import { z } from "zod";
import { githubRequest, buildUrl } from "../common/utils.js";

// --- GraphQL Helper ---
// Define a type for GraphQL errors
const GraphQLErrorSchema = z.object({
  message: z.string(),
  locations: z.array(z.object({ line: z.number(), column: z.number() })).optional(),
  path: z.array(z.string().or(z.number())).optional(),
  extensions: z.record(z.unknown()).optional(),
});

// Define a type for the GraphQL response structure
const GraphQLResponseSchema = z.object({
  data: z.record(z.unknown()).nullable(),
  errors: z.array(GraphQLErrorSchema).optional(),
});

/**
 * Makes a request to the GitHub GraphQL API.
 * @param query The GraphQL query or mutation string.
 * @param variables An object containing variables for the query.
 * @returns The data part of the GraphQL response.
 * @throws Throws an error if the request fails or the response contains GraphQL errors.
 */
async function githubGraphQLRequest<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await githubRequest("https://api.github.com/graphql", { // Use the base githubRequest helper
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization header should be handled by the underlying githubRequest
    },
    body: JSON.stringify({ query, variables }),
    // No 'Accept' header needed like for REST preview APIs
  });

  const parsedResponse = GraphQLResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    console.error("Failed to parse GraphQL response:", parsedResponse.error);
    // Attempt to provide more context if possible
    let responseDetails = "Invalid response structure.";
    if (typeof response === 'object' && response !== null) {
        responseDetails = JSON.stringify(response, null, 2);
    } else if (typeof response === 'string') {
        responseDetails = response;
    }
    throw new Error(`Failed to parse GraphQL response. Raw response: ${responseDetails}`);
  }


  if (parsedResponse.data.errors && parsedResponse.data.errors.length > 0) {
    // Log all errors for debugging
    console.error("GraphQL Errors:", JSON.stringify(parsedResponse.data.errors, null, 2));
    // Throw the first error message
    throw new Error(`GraphQL Error: ${parsedResponse.data.errors[0].message}`);
  }

  if (parsedResponse.data.data === null || parsedResponse.data.data === undefined) {
     // This case might indicate an issue not caught by the 'errors' array, like permissions
     console.error("GraphQL response data is null/undefined, Full Response:", JSON.stringify(parsedResponse.data, null, 2));
     throw new Error("GraphQL query returned null data. Check query validity and permissions.");
  }

  // Assuming the actual data is nested within the 'data' object
  // The specific structure depends on the query, so casting to T
  return parsedResponse.data.data as T;
}


// --- Projects V2 Schemas ---

// Basic ProjectV2 Schema (add more fields as needed)
export const GitHubProjectV2Schema = z.object({
    id: z.string(), // Node ID
    title: z.string(),
    number: z.number(),
    url: z.string(),
    closed: z.boolean(),
    public: z.boolean(),
    readme: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    creator: z.object({
      login: z.string(),
      url: z.string(),
      avatarUrl: z.string().optional(), // Make optional if not always present
    }).nullable(), // Creator might be null
    owner: z.object({
      id: z.string(), // Node ID
      // __typename: z.string(), // Helpful for identifying owner type (User/Org)
      // login: z.string().optional(), // Available for User/Org
      // name: z.string().optional(), // Available for Org
    }),
  });

// Schema for the connection structure used in pagination
const PageInfoSchema = z.object({
    endCursor: z.string().nullable(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    startCursor: z.string().nullable(),
});

// Schema for the response when listing projects
const ProjectV2ConnectionSchema = z.object({
    nodes: z.array(GitHubProjectV2Schema).nullable(),
    pageInfo: PageInfoSchema,
    totalCount: z.number(),
});

// Schema for ProjectV2 Fields (Base and Specific Types)
export const ProjectV2FieldCommonSchema = z.object({
    id: z.string(), // Node ID
    name: z.string(),
    dataType: z.enum([ // Possible field types
        "TEXT",
        "NUMBER",
        "DATE",
        "SINGLE_SELECT",
        "ITERATION",
        "ASSIGNEES",
        // Add other types as needed (e.g., REPOSITORY, LABELS, MILESTONE)
      ]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const ProjectV2SingleSelectFieldOptionSchema = z.object({
    id: z.string(), // Node ID of the option
    name: z.string(),
    // color: z.string().optional(), // Might exist
});

export const ProjectV2SingleSelectFieldSchema = ProjectV2FieldCommonSchema.extend({
    dataType: z.literal("SINGLE_SELECT"),
    options: z.array(ProjectV2SingleSelectFieldOptionSchema),
});

// Add schemas for other field types (Iteration, Date, etc.) if detailed info is needed

// Union schema for different field types (adjust as more types are added)
export const ProjectV2FieldSchema = z.union([
    ProjectV2SingleSelectFieldSchema,
    ProjectV2FieldCommonSchema, // Fallback for other types
]);

const ProjectV2FieldConnectionSchema = z.object({
    nodes: z.array(ProjectV2FieldSchema).nullable(),
    pageInfo: PageInfoSchema,
    totalCount: z.number(),
});

// Schema for ProjectV2 Items (Base and Content Types)
// Base schema for any item in a Project V2
export const ProjectV2ItemSchema = z.object({
    id: z.string(), // Node ID of the ProjectV2Item itself
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    isArchived: z.boolean(),
    project: z.object({ id: z.string(), title: z.string(), number: z.number() }), // Basic project info
    type: z.enum(["ISSUE", "PULL_REQUEST", "DRAFT_ISSUE"]),
    // Use fieldValueByName or fieldValues to get specific field data
    fieldValues: z.object({ // Connection for getting specific field values
        nodes: z.array(z.object({ // Simplified - get full details if needed
            // __typename: z.string(), // e.g., ProjectV2ItemFieldTextValue
            // text: z.string().optional(),
            // number: z.number().optional(),
            // date: z.string().datetime().optional(),
            field: z.object({ id: z.string(), name: z.string() }),
            // Value depends on field type (e.g., option id for single select)
            value: z.unknown().optional(), // Use specific value types later
        })).nullable(),
        totalCount: z.number()
    }).optional(), // Query this connection explicitly if needed

    // Content represents the underlying GitHub object (Issue, PR)
    content: z.union([
        z.object({ // Issue
            __typename: z.literal("Issue"),
            id: z.string(), // Node ID of the Issue
            number: z.number(),
            title: z.string(),
            url: z.string(),
            state: z.string(), // e.g., "OPEN", "CLOSED"
            // Add more Issue fields as needed
        }),
        z.object({ // Pull Request
            __typename: z.literal("PullRequest"),
            id: z.string(), // Node ID of the PR
            number: z.number(),
            title: z.string(),
            url: z.string(),
            state: z.string(), // e.g., "OPEN", "CLOSED", "MERGED"
            // Add more PR fields as needed
        }),
        z.object({ // Draft Issue
            __typename: z.literal("DraftIssue"),
            id: z.string(), // Node ID of the DraftIssue
            title: z.string(),
            body: z.string(),
            // Draft issues don't have a number or URL outside the project
        }),
        z.null(), // Content can be null if item is somehow malformed/deleted
    ]).optional(), // Query content explicitly if needed
});

const ProjectV2ItemConnectionSchema = z.object({
    nodes: z.array(ProjectV2ItemSchema).nullable(),
    pageInfo: PageInfoSchema,
    totalCount: z.number(),
});

// --- Input Schemas (Keeping separate for clarity, map to V2 concepts) ---

// Input for listing V2 projects (Org)
export const ListOrgProjectsV2Schema = z.object({
  orgLogin: z.string().describe("Organization login name"),
  first: z.number().optional().describe("Returns the first n results (max 100)."),
  after: z.string().optional().describe("Returns the elements in the list that come after the specified cursor."),
  // 'state' filtering is done differently in V2 (usually via filterBy query param if available, or client-side)
  // We can add state filtering later if needed by querying specific fields.
});

// Input for creating V2 project (Org) - Requires Org Node ID!
export const CreateOrgProjectV2Schema = z.object({
  organizationId: z.string().describe("The Node ID of the organization."),
  title: z.string().describe("The title of the project."),
  // 'body'/readme can be updated separately
});

// Input for listing V2 projects (Repo)
export const ListRepoProjectsV2Schema = z.object({
    ownerLogin: z.string().describe("Repository owner's login (user or organization)"),
    repoName: z.string().describe("Repository name"),
    first: z.number().optional().describe("Returns the first n results (max 100)."),
    after: z.string().optional().describe("Returns the elements in the list that come after the specified cursor."),
    // 'state' filtering is potentially available via the 'states' argument in repository.projectsV2
});

// Input for creating V2 project (Repo) - Requires Repo Owner (User/Org) Node ID!
export const CreateRepoProjectV2Schema = z.object({
    ownerId: z.string().describe("The Node ID of the repository owner (User or Organization)."),
    repositoryId: z.string().describe("The Node ID of the repository."), // Repository ID needed for linking
    title: z.string().describe("The title of the project."),
});

// Input for getting V2 project
export const GetProjectV2Schema = z.object({
  projectId: z.string().describe("The Node ID of the project."),
});

// Input for updating V2 project
export const UpdateProjectV2Schema = z.object({
  projectId: z.string().describe("The Node ID of the project."),
  title: z.string().optional().describe("New title for the project."),
  readme: z.string().optional().describe("New readme content for the project."),
  closed: z.boolean().optional().describe("Set to true to close the project, false to reopen."),
  // Add other updatable fields like 'public' if needed
});

// Input for deleting V2 project
export const DeleteProjectV2Schema = z.object({
    projectId: z.string().describe("The Node ID of the project to delete."),
});

// Input for listing V2 project fields
export const ListProjectFieldsV2Schema = z.object({
    projectId: z.string().describe("The Node ID of the project."),
    first: z.number().optional().describe("Returns the first n results (max 100)."),
    after: z.string().optional().describe("Returns the elements in the list that come after the specified cursor."),
});

// Input for listing V2 project items
export const ListProjectItemsV2Schema = z.object({
    projectId: z.string().describe("The Node ID of the project."),
    first: z.number().optional().describe("Returns the first n results (max 100)."),
    after: z.string().optional().describe("Returns the elements in the list that come after the specified cursor."),
});

// Input for adding a draft issue to a V2 project
export const AddProjectDraftIssueV2Schema = z.object({
    projectId: z.string().describe("The Node ID of the project."),
    title: z.string().describe("The title of the draft issue."),
    body: z.string().optional().describe("The body of the draft issue."),
    // assigneeIds: z.array(z.string()).optional().describe("Node IDs of users to assign."), // Optional: Can set assignees
});

// Input for adding an existing Issue or PR to a V2 project
export const AddProjectItemByIdV2Schema = z.object({
    projectId: z.string().describe("The Node ID of the project."),
    contentId: z.string().describe("The Node ID of the Issue or Pull Request to add."),
});

// Input for updating a field value for a V2 project item (replaces moving cards)
export const UpdateProjectItemFieldValueV2Schema = z.object({
    projectId: z.string().describe("The Node ID of the project."),
    itemId: z.string().describe("The Node ID of the item to update."),
    fieldId: z.string().describe("The Node ID of the field to update."),
    // Value type depends on the field's dataType
    value: z.union([
        z.object({ singleSelectOptionId: z.string().describe("Node ID of the option for Single Select fields.") }),
        z.object({ text: z.string().describe("Text value for Text fields.") }),
        z.object({ number: z.number().describe("Number value for Number fields.") }),
        z.object({ date: z.string().datetime().describe("Date value (ISO 8601 string) for Date fields.") }),
        z.object({ iterationId: z.string().describe("Node ID of the iteration for Iteration fields.") }),
        z.object({ userIds: z.array(z.string()).describe("Array of user Node IDs for Assignee fields.") }),
        // Add other value types as needed
    ]).describe("The value to set for the field. Use the key corresponding to the field's data type.")
});

// Input for deleting a V2 project item
export const DeleteProjectItemV2Schema = z.object({
    projectId: z.string().describe("The Node ID of the project."),
    itemId: z.string().describe("The Node ID of the item to delete."),
});

// We will need functions/queries to get Node IDs based on login/repo names.

// --- Type Exports ---
export type GitHubProjectV2 = z.infer<typeof GitHubProjectV2Schema>;
export type PageInfo = z.infer<typeof PageInfoSchema>;
export type ProjectV2Connection = z.infer<typeof ProjectV2ConnectionSchema>;
export type ProjectV2Field = z.infer<typeof ProjectV2FieldSchema>;
export type ProjectV2SingleSelectFieldOption = z.infer<typeof ProjectV2SingleSelectFieldOptionSchema>;
export type ProjectV2Item = z.infer<typeof ProjectV2ItemSchema>;

// --- GraphQL Queries/Mutations ---

const LIST_ORG_PROJECTS_V2_QUERY = `
  query ListOrgProjectsV2($orgLogin: String!, $first: Int, $after: String) {
    organization(login: $orgLogin) {
      projectsV2(first: $first, after: $after, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          id
          title
          number
          url
          closed
          public
          readme
          createdAt
          updatedAt
          creator {
            login
            url
            ... on User { avatarUrl }
          }
          owner {
            id
          }
        }
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        totalCount
      }
    }
  }
`;

const CREATE_ORG_PROJECT_V2_MUTATION = `
  mutation CreateOrgProjectV2($organizationId: ID!, $title: String!) {
    createProjectV2(input: {ownerId: $organizationId, title: $title}) {
      projectV2 {
        id
        title
        number
        url
        closed
        public
        readme
        createdAt
        updatedAt
        creator {
            login
            url
            ... on User { avatarUrl }
          }
        owner {
          id
        }
      }
    }
  }
`;

const LIST_REPO_PROJECTS_V2_QUERY = `
  query ListRepoProjectsV2($ownerLogin: String!, $repoName: String!, $first: Int, $after: String) {
    repository(owner: $ownerLogin, name: $repoName) {
      projectsV2(first: $first, after: $after, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          id
          title
          number
          url
          closed
          public
          readme
          createdAt
          updatedAt
          creator {
            login
            url
            ... on User { avatarUrl }
          }
          owner {
            id
          }
        }
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        totalCount
      }
    }
  }
`;

// Linking to a repository requires the repository's Node ID
const CREATE_REPO_PROJECT_V2_MUTATION = `
  mutation CreateRepoProjectV2($ownerId: ID!, $repositoryId: ID!, $title: String!) {
    createProjectV2(input: {ownerId: $ownerId, repositoryId: $repositoryId, title: $title}) {
      projectV2 {
        id
        title
        number
        url
        closed
        public
        readme
        createdAt
        updatedAt
        creator {
          login
          url
          ... on User { avatarUrl }
        }
        owner {
          id
        }
      }
    }
  }
`;

const GET_PROJECT_V2_QUERY = `
  query GetProjectV2($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        id
        title
        number
        url
        closed
        public
        readme
        createdAt
        updatedAt
        creator {
          login
          url
          ... on User { avatarUrl }
        }
        owner {
          id
        }
        # Add fields, items, views connection here if needed later
      }
    }
  }
`;

const UPDATE_PROJECT_V2_MUTATION = `
  mutation UpdateProjectV2(
    $projectId: ID!
    $title: String
    $readme: String
    $closed: Boolean
    # $public: Boolean - Add if needed
  ) {
    updateProjectV2(input: {
      projectId: $projectId
      title: $title
      readme: $readme
      closed: $closed
      # public: $public
    }) {
      projectV2 {
        id
        title
        number
        url
        closed
        public
        readme
        createdAt
        updatedAt
        # Return updated fields
      }
    }
  }
`;

const DELETE_PROJECT_V2_MUTATION = `
  mutation DeleteProjectV2($projectId: ID!) {
    deleteProjectV2(input: {projectId: $projectId}) {
      clientMutationId # Or projectV2 { id } - confirmation field
    }
  }
`;

const LIST_PROJECT_FIELDS_QUERY = `
  query ListProjectFieldsV2($projectId: ID!, $first: Int, $after: String) {
    node(id: $projectId) {
      ... on ProjectV2 {
        fields(first: $first, after: $after) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            __typename
            ... on ProjectV2Field {
              id
              name
              dataType
              createdAt
              updatedAt
            }
            ... on ProjectV2IterationField {
              id
              name
              dataType
              createdAt
              updatedAt
              configuration {
                iterations {
                  id
                  title
                  startDate
                  duration
                }
                # completedIterations { ... }
                # durationUnit
                # startDay
              }
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              dataType
              createdAt
              updatedAt
              options {
                id
                name
              }
            }
            # Add fragments for other specific field types if needed
          }
        }
      }
    }
  }
`;

const LIST_PROJECT_ITEMS_QUERY = `
  query ListProjectItemsV2($projectId: ID!, $first: Int, $after: String) {
    node(id: $projectId) {
      ... on ProjectV2 {
        items(first: $first, after: $after, orderBy: {field: POSITION, direction: ASC}) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            id
            createdAt
            updatedAt
            isArchived
            type
            project { id title number }
            # Include content or fieldValues here if always needed
            # Example: Fetching Status field value by name
            # fieldValueByName(name: "Status") {
            #   ... on ProjectV2ItemFieldSingleSelectValue {
            #     name # Option name
            #     optionId
            #   }
            # }
            content {
              __typename
              ... on DraftIssue {
                id title body
              }
              ... on Issue {
                id number title url state
              }
              ... on PullRequest {
                id number title url state
              }
            }
          }
        }
      }
    }
  }
`;

const ADD_PROJECT_DRAFT_ISSUE_MUTATION = `
  mutation AddDraftIssue($projectId: ID!, $title: String!, $body: String) {
    addProjectV2DraftIssue(input: {projectId: $projectId, title: $title, body: $body}) {
      projectItem {
        id
        # Include fields from ProjectV2ItemSchema if needed upon creation
      }
    }
  }
`;

const ADD_PROJECT_ITEM_BY_ID_MUTATION = `
  mutation AddItemById($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
      item {
        id
        # Include fields from ProjectV2ItemSchema if needed upon creation
      }
    }
  }
`;

// This mutation handles various field types
const UPDATE_PROJECT_ITEM_FIELD_MUTATION = `
  mutation UpdateItemFieldValue(
    $projectId: ID!
    $itemId: ID!
    $fieldId: ID!
    $value: ProjectV2FieldValue! # This input type covers all value possibilities
  ) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: $value
    }) {
      projectV2Item {
        id
        # Optionally refetch the updated field value
        # fieldValueByName(name: "Status") { ... } # Replace "Status" with actual field name or query by ID
      }
    }
  }
`;

const DELETE_PROJECT_ITEM_MUTATION = `
  mutation DeleteItem($projectId: ID!, $itemId: ID!) {
    deleteProjectV2Item(input: {projectId: $projectId, itemId: $itemId}) {
      deletedItemId
    }
  }
`;

// Helper function (example) to get Node IDs - Needed for mutations
// You'll need to implement robust versions of these
async function getOrganizationNodeId(orgLogin: string): Promise<string> {
    const query = `query GetOrgId($login: String!) { organization(login: $login) { id } }`;
    const result = await githubGraphQLRequest<{ organization: { id: string } | null }>(query, { login: orgLogin });
    if (!result.organization) throw new Error(`Organization not found: ${orgLogin}`);
    return result.organization.id;
}

async function getRepositoryNodeId(ownerLogin: string, repoName: string): Promise<string> {
    const query = `query GetRepoId($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { id } }`;
    const result = await githubGraphQLRequest<{ repository: { id: string } | null }>(query, { owner: ownerLogin, name: repoName });
    if (!result.repository) throw new Error(`Repository not found: ${ownerLogin}/${repoName}`);
    return result.repository.id;
}

// This might be the user or org owning the repo
async function getRepositoryOwnerNodeId(ownerLogin: string): Promise<string> {
    const query = `query GetRepoOwnerId($login: String!) { repositoryOwner(login: $login) { id } }`;
    const result = await githubGraphQLRequest<{ repositoryOwner: { id: string } | null }>(query, { login: ownerLogin });
    if (!result.repositoryOwner) throw new Error(`Repository owner not found: ${ownerLogin}`);
    return result.repositoryOwner.id;
}


// --- Refactored Functions ---

/**
 * Lists Projects V2 for an organization.
 */
export async function listOrgProjectsV2(
  options: z.infer<typeof ListOrgProjectsV2Schema>
): Promise<ProjectV2Connection> {
  const result = await githubGraphQLRequest<{ organization: { projectsV2: ProjectV2Connection } }>(
    LIST_ORG_PROJECTS_V2_QUERY,
    {
      orgLogin: options.orgLogin,
      first: options.first ?? 30, // Default page size
      after: options.after,
    }
  );

  // Validate the nested structure
  return ProjectV2ConnectionSchema.parse(result.organization.projectsV2);
}

/**
 * Creates a Project V2 for an organization.
 */
export async function createOrgProjectV2(
  options: Omit<z.infer<typeof CreateOrgProjectV2Schema>, 'organizationId'> & { orgLogin: string } // Use login for convenience
): Promise<GitHubProjectV2> {
  // Get the organization Node ID first
  const organizationId = await getOrganizationNodeId(options.orgLogin);

  const result = await githubGraphQLRequest<{ createProjectV2: { projectV2: GitHubProjectV2 } }>(
    CREATE_ORG_PROJECT_V2_MUTATION,
    {
      organizationId: organizationId,
      title: options.title,
    }
  );
  return GitHubProjectV2Schema.parse(result.createProjectV2.projectV2);
}


/**
 * Lists Projects V2 for a repository.
 */
export async function listRepoProjectsV2(
  options: z.infer<typeof ListRepoProjectsV2Schema>
): Promise<ProjectV2Connection> {
    const result = await githubGraphQLRequest<{ repository: { projectsV2: ProjectV2Connection } }>(
        LIST_REPO_PROJECTS_V2_QUERY,
        {
            ownerLogin: options.ownerLogin,
            repoName: options.repoName,
            first: options.first ?? 30, // Default page size
            after: options.after,
        }
    );
     // Validate the nested structure
    return ProjectV2ConnectionSchema.parse(result.repository.projectsV2);
}


/**
 * Creates a Project V2 linked to a repository.
 */
export async function createRepoProjectV2(
    options: Omit<z.infer<typeof CreateRepoProjectV2Schema>, 'ownerId' | 'repositoryId'> & { ownerLogin: string, repoName: string } // Use logins for convenience
): Promise<GitHubProjectV2> {
    // Get necessary Node IDs
    const ownerId = await getRepositoryOwnerNodeId(options.ownerLogin); // ID of the user/org owning the repo
    const repositoryId = await getRepositoryNodeId(options.ownerLogin, options.repoName);

    const result = await githubGraphQLRequest<{ createProjectV2: { projectV2: GitHubProjectV2 } }>(
        CREATE_REPO_PROJECT_V2_MUTATION,
        {
            ownerId: ownerId,
            repositoryId: repositoryId, // Link the project to the repo
            title: options.title,
        }
    );
    return GitHubProjectV2Schema.parse(result.createProjectV2.projectV2);
}

/**
 * Gets a specific Project V2 by its Node ID.
 */
export async function getProjectV2(
  options: z.infer<typeof GetProjectV2Schema>
): Promise<GitHubProjectV2> {
  const result = await githubGraphQLRequest<{ node: GitHubProjectV2 | null }>(
    GET_PROJECT_V2_QUERY,
    {
      projectId: options.projectId,
    }
  );

  if (!result.node) {
    throw new Error(`Project V2 with Node ID ${options.projectId} not found or not accessible.`);
  }

  // Validate the structure (node is the project object)
  return GitHubProjectV2Schema.parse(result.node);
}

/**
 * Updates a Project V2.
 */
export async function updateProjectV2(
  options: z.infer<typeof UpdateProjectV2Schema>
): Promise<GitHubProjectV2> {
  // Construct variables, excluding the ID from the main payload
  const variables: Record<string, any> = { projectId: options.projectId };
  if (options.title !== undefined) variables.title = options.title;
  if (options.readme !== undefined) variables.readme = options.readme;
  if (options.closed !== undefined) variables.closed = options.closed;

  // Check if any update fields were actually provided
  if (Object.keys(variables).length <= 1) {
    // Only projectId was provided, no actual updates requested.
    // We could either throw an error or return the project unmodified.
    // Let's return the current project state.
    console.warn("updateProjectV2 called without any fields to update.");
    return getProjectV2({ projectId: options.projectId });
  }

  const result = await githubGraphQLRequest<{ updateProjectV2: { projectV2: GitHubProjectV2 } }>(
    UPDATE_PROJECT_V2_MUTATION,
    variables
  );

  return GitHubProjectV2Schema.parse(result.updateProjectV2.projectV2);
}

/**
 * Deletes a Project V2 by its Node ID.
 */
export async function deleteProjectV2(
  options: z.infer<typeof DeleteProjectV2Schema>
): Promise<void> {
  // The mutation returns clientMutationId or similar for confirmation, but we don't strictly need it.
  await githubGraphQLRequest<{ deleteProjectV2: { clientMutationId: string | null } } | unknown>(
    DELETE_PROJECT_V2_MUTATION,
    {
      projectId: options.projectId,
    }
  );
  // No return value needed
}

/**
 * Lists Fields for a Project V2.
 */
export async function listProjectFieldsV2(
    options: z.infer<typeof ListProjectFieldsV2Schema>
): Promise<z.infer<typeof ProjectV2FieldConnectionSchema>> { // Use z.infer
    const result = await githubGraphQLRequest<{ node: { fields: any } }>(
        LIST_PROJECT_FIELDS_QUERY,
        {
            projectId: options.projectId,
            first: options.first ?? 30, // Default page size
            after: options.after,
        }
    );

    if (!result.node || !result.node.fields) {
        throw new Error(`Fields for Project V2 ${options.projectId} not found or project doesn't exist.`);
    }
    // TODO: Add robust validation with ProjectV2FieldConnectionSchema
    // Need to handle the __typename and specific field types properly in validation
    console.warn("TODO: Add robust Zod validation for listProjectFieldsV2 response");
    return result.node.fields as any; // Temporary bypass validation
}

/**
 * Lists Items for a Project V2.
 */
export async function listProjectItemsV2(
    options: z.infer<typeof ListProjectItemsV2Schema>
): Promise<z.infer<typeof ProjectV2ItemConnectionSchema>> { // Use z.infer
    const result = await githubGraphQLRequest<{ node: { items: z.infer<typeof ProjectV2ItemConnectionSchema> } }>(
        LIST_PROJECT_ITEMS_QUERY,
        {
            projectId: options.projectId,
            first: options.first ?? 30, // Default page size
            after: options.after,
        }
    );

    if (!result.node || !result.node.items) {
        throw new Error(`Items for Project V2 ${options.projectId} not found or project doesn't exist.`);
    }
    // Validate the nested structure
    return ProjectV2ItemConnectionSchema.parse(result.node.items);
}

/**
 * Adds a Draft Issue item to a Project V2.
 */
export async function addProjectDraftIssueV2(
    options: z.infer<typeof AddProjectDraftIssueV2Schema>
): Promise<{ id: string }> { // Returns the new item's ID
    const result = await githubGraphQLRequest<{ addProjectV2DraftIssue: { projectItem: { id: string } } }>(
        ADD_PROJECT_DRAFT_ISSUE_MUTATION,
        {
            projectId: options.projectId,
            title: options.title,
            body: options.body, // Optional
        }
    );
    return result.addProjectV2DraftIssue.projectItem;
}

/**
 * Adds an existing Issue or Pull Request item to a Project V2 using its Node ID.
 * NOTE: Requires the Node ID of the Issue or PR (contentId).
 */
export async function addProjectItemByIdV2(
    options: z.infer<typeof AddProjectItemByIdV2Schema>
): Promise<{ id: string }> { // Returns the new item's ID
    const result = await githubGraphQLRequest<{ addProjectV2ItemById: { item: { id: string } } }>(
        ADD_PROJECT_ITEM_BY_ID_MUTATION,
        {
            projectId: options.projectId,
            contentId: options.contentId,
        }
    );
    return result.addProjectV2ItemById.item;
}

/**
 * Updates a specific field's value for an item in a Project V2.
 * This is used to change status, priority, assignees, etc.
 */
export async function updateProjectItemFieldValueV2(
    options: z.infer<typeof UpdateProjectItemFieldValueV2Schema>
): Promise<{ id: string }> { // Returns the updated item's ID
    const result = await githubGraphQLRequest<{ updateProjectV2ItemFieldValue: { projectV2Item: { id: string } } }>(
        UPDATE_PROJECT_ITEM_FIELD_MUTATION,
        {
            projectId: options.projectId,
            itemId: options.itemId,
            fieldId: options.fieldId,
            value: options.value, // Pass the specific value object
        }
    );
    return result.updateProjectV2ItemFieldValue.projectV2Item;
}

/**
 * Deletes an item (Issue, PR, or Draft Issue) from a Project V2.
 */
export async function deleteProjectItemV2(
    options: z.infer<typeof DeleteProjectItemV2Schema>
): Promise<{ deletedItemId: string }> { // Returns the ID of the deleted item
    const result = await githubGraphQLRequest<{ deleteProjectV2Item: { deletedItemId: string } }>(
        DELETE_PROJECT_ITEM_MUTATION,
        {
            projectId: options.projectId,
            itemId: options.itemId,
        }
    );
    return result.deleteProjectV2Item;
}


// --- Deprecated/Requires Refactoring Placeholder ---

// ... old list/create/get/update/delete Project placeholders ...

/*
// OLD - Classic Project Columns Functions
export async function listProjectColumns(
  owner: string,
  repo: string,
  projectNumber: number,
  options: Omit<z.infer<typeof ListProjectColumnsSchema>, "owner" | "repo" | "project_number"> = {}
): Promise<GitHubProjectColumn[]> {
  // ... old implementation ...
  throw new Error("Function not migrated to Projects V2 GraphQL API. Use listProjectFieldsV2.");
}

export async function createProjectColumn(
  owner: string,
  repo: string,
  projectNumber: number,
  options: Omit<z.infer<typeof CreateProjectColumnSchema>, "owner" | "repo" | "project_number">
): Promise<GitHubProjectColumn> {
  // ... old implementation ...
  throw new Error("Function not migrated to Projects V2 GraphQL API. Manage fields/views directly.");
}

export async function updateProjectColumn(
  owner: string,
  repo: string,
  projectNumber: number,
  columnId: number,
  options: Omit<z.infer<typeof UpdateProjectColumnSchema>, "owner" | "repo" | "project_number" | "column_id">
): Promise<GitHubProjectColumn> {
    // ... old implementation ...
    throw new Error("Function not migrated to Projects V2 GraphQL API. Manage fields/views directly.");
}

export async function deleteProjectColumn(
  owner: string,
  repo: string,
  projectNumber: number,
  columnId: number
): Promise<void> {
    // ... old implementation ...
    throw new Error("Function not migrated to Projects V2 GraphQL API. Manage fields/views directly.");
}
*/

/*
// OLD - Classic Project Cards Functions
export async function listProjectCards(
  owner: string,
  repo: string,
  projectNumber: number,
  columnId: number,
  options: Omit<z.infer<typeof ListProjectCardsSchema>, "owner" | "repo" | "project_number" | "column_id"> = {}
): Promise<GitHubProjectCard[]> {
    // ... old implementation ...
    throw new Error("Function not migrated to Projects V2 GraphQL API. Use listProjectItemsV2.");
}

export async function createProjectCard(
  owner: string,
  repo: string,
  projectNumber: number,
  columnId: number,
  options: Omit<z.infer<typeof CreateProjectCardSchema>, "owner" | "repo" | "project_number" | "column_id">
): Promise<GitHubProjectCard> {
    // ... old implementation ...
    throw new Error("Function not migrated to Projects V2 GraphQL API. Use addProjectDraftIssueV2 or addProjectItemByIdV2.");
}

export async function updateProjectCard(
  owner: string,
  repo: string,
  projectNumber: number,
  cardId: number,
  options: Omit<z.infer<typeof UpdateProjectCardSchema>, "owner" | "repo" | "project_number" | "card_id">
): Promise<GitHubProjectCard> {
    // ... old implementation ...
    throw new Error("Function not migrated to Projects V2 GraphQL API. Use updateProjectItemFieldValueV2 or updateProjectDraftIssueV2 (not implemented yet).");
}

export async function deleteProjectCard(
  owner: string,
  repo: string,
  projectNumber: number,
  cardId: number
): Promise<void> {
    // ... old implementation ...
    throw new Error("Function not migrated to Projects V2 GraphQL API. Use deleteProjectItemV2.");
}

export async function moveProjectCard(
  owner: string,
  repo: string,
  projectNumber: number,
  cardId: number,
  position: string,
  columnId?: number
): Promise<void> {
    // ... old implementation ...
    throw new Error("Function not migrated to Projects V2 GraphQL API. Use updateProjectItemFieldValueV2 to change the relevant field (e.g., Status).");
}
*/

// ... existing Org Project function placeholders / commented out code ...

/*
  // Organization project columns functions
  // ... list/create/update/delete Org Column ...

  // Organization project cards functions
  // ... list/create/update/delete/move Org Card ...
*/

// Ensure all original code below this point is either removed or commented out
// if you intend to fully replace it with the V2 GraphQL implementation.