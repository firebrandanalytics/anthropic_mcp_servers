import { z } from "zod";
import { githubGraphQLRequest, validateOwnerName } from "../common/utils.js"; // Assuming utils.js is in common

// Schema for listing organization projects
export const ListOrgProjectsSchema = z.object({
  organizationLogin: z
    .string()
    .transform(validateOwnerName)
    .describe("The login name of the GitHub organization."),
  // Add pagination later if needed (e.g., first, after)
});

// Type for the project data we want to return (subset)
export type ProjectInfo = {
  id: string;
  title: string;
  url: string;
};

// GraphQL query to fetch organization projects
const LIST_ORG_PROJECTS_QUERY = `
  query ListOrgProjects($login: String!, $first: Int = 20) {
    organization(login: $login) {
      projectsV2(first: $first) {
        nodes {
          id
          title
          url
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

// Function to list organization projects
export async function listOrganizationProjects(
  orgLogin: string
): Promise<ProjectInfo[]> {
  // Consider adding pagination handling later
  const variables = {
    login: orgLogin,
    first: 100, // Fetch up to 100 projects initially
  };

  // TODO: Add proper type checking for the response data
  const responseData = await githubGraphQLRequest(
    LIST_ORG_PROJECTS_QUERY,
    variables
  );

  // Basic validation of the response structure
  if (
    !responseData ||
    !responseData.organization ||
    !responseData.organization.projectsV2 ||
    !Array.isArray(responseData.organization.projectsV2.nodes)
  ) {
    console.error(
      "Unexpected response structure from GitHub GraphQL API:",
      responseData
    );
    throw new Error("Failed to fetch projects: Invalid response structure.");
  }

  // Extract and map the project nodes
  const projects: ProjectInfo[] = responseData.organization.projectsV2.nodes
    .map((node: any) => {
      if (
        !node ||
        typeof node.id !== "string" ||
        typeof node.title !== "string" ||
        typeof node.url !== "string"
      ) {
        console.warn("Skipping invalid project node:", node);
        return null; // Skip invalid nodes
      }
      return {
        id: node.id,
        title: node.title,
        url: node.url,
      };
    })
    .filter((p: ProjectInfo | null): p is ProjectInfo => p !== null); // Explicitly type 'p' here

  return projects;
}

// --- Create Project Draft Issue ---

// Schema for creating a draft issue card
export const CreateProjectDraftIssueSchema = z.object({
  projectId: z
    .string()
    .describe('The Node ID of the Project (e.g., "PROJECT_kwDO...)'),
  title: z.string().min(1).describe("The title of the draft issue card."),
});

// GraphQL mutation to add a draft issue
const CREATE_DRAFT_ISSUE_MUTATION = `
  mutation CreateDraftIssue($projectId: ID!, $title: String!) {
    addProjectV2DraftIssue(input: {projectId: $projectId, title: $title}) {
      projectItem {
        id # Return the ID of the created item
      }
    }
  }
`;

// Type for the creation response
export type CreateDraftIssueResponse = {
  addProjectV2DraftIssue: {
    projectItem: {
      id: string;
    };
  };
};

// Function to create a draft issue card
export async function createProjectDraftIssueCard(
  projectId: string,
  title: string
): Promise<string> {
  // Returns the ID of the new card
  const variables = {
    projectId: projectId,
    title: title,
  };

  const responseData = (await githubGraphQLRequest(
    CREATE_DRAFT_ISSUE_MUTATION,
    variables
  )) as CreateDraftIssueResponse; // Add type assertion

  // Validate response structure
  if (
    !responseData ||
    !responseData.addProjectV2DraftIssue ||
    !responseData.addProjectV2DraftIssue.projectItem ||
    typeof responseData.addProjectV2DraftIssue.projectItem.id !== "string"
  ) {
    console.error(
      "Unexpected response structure from GitHub GraphQL API:",
      responseData
    );
    throw new Error(
      "Failed to create draft issue card: Invalid response structure."
    );
  }

  return responseData.addProjectV2DraftIssue.projectItem.id;
}

// --- Update Project Card Single Select Field ---

// Schema for updating a single-select field on a project card
export const UpdateProjectCardFieldSchema = z.object({
  projectId: z
    .string()
    .describe('The Node ID of the Project (e.g., "PVT_kwDO...)'),
  itemId: z
    .string()
    .describe(
      'The Node ID of the Project Item (card) to update (e.g., "PVTI_lADO...)'
    ),
  fieldId: z
    .string()
    .describe(
      'The Node ID of the custom field to update (e.g., "PVTSSF_lADO...)'
    ),
  singleSelectOptionId: z
    .string()
    .describe(
      'The Node ID of the specific option to select for the field (e.g., "f75ad...)'
    ),
});

// GraphQL mutation to update a project item's field value
// See: https://docs.github.com/en/graphql/reference/mutations#updateprojectv2itemfieldvalue
const UPDATE_PROJECT_ITEM_FIELD_MUTATION = `
  mutation UpdateProjectItemField(
    $projectId: ID!,
    $itemId: ID!,
    $fieldId: ID!,
    $value: ProjectV2FieldValue!
  ) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId,
      itemId: $itemId,
      fieldId: $fieldId,
      value: $value
    }) {
      projectV2Item {
        id # Return the ID of the updated item
      }
    }
  }
`;

// Type for the update response
export type UpdateProjectItemFieldResponse = {
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: string;
    };
  };
};

// Function to update a single-select field on a project card
export async function updateProjectCardSingleSelectField(
  projectId: string,
  itemId: string,
  fieldId: string,
  singleSelectOptionId: string
): Promise<string> {
  // Returns the ID of the updated item
  const variables = {
    projectId: projectId,
    itemId: itemId,
    fieldId: fieldId,
    value: {
      // The 'value' input type depends on the field being updated.
      // For single select fields, it's singleSelectOptionId.
      singleSelectOptionId: singleSelectOptionId,
    },
  };

  const responseData = (await githubGraphQLRequest(
    UPDATE_PROJECT_ITEM_FIELD_MUTATION,
    variables
  )) as UpdateProjectItemFieldResponse;

  // Validate response structure
  if (
    !responseData ||
    !responseData.updateProjectV2ItemFieldValue ||
    !responseData.updateProjectV2ItemFieldValue.projectV2Item ||
    typeof responseData.updateProjectV2ItemFieldValue.projectV2Item.id !==
      "string"
  ) {
    console.error(
      "Unexpected response structure from GitHub GraphQL API:",
      responseData
    );
    throw new Error(
      "Failed to update project card field: Invalid response structure."
    );
  }

  // Ensure the ID returned matches the item we intended to update
  if (responseData.updateProjectV2ItemFieldValue.projectV2Item.id !== itemId) {
    console.warn(
      `Updated item ID (${responseData.updateProjectV2ItemFieldValue.projectV2Item.id}) does not match requested item ID (${itemId}).`
    );
  }

  return responseData.updateProjectV2ItemFieldValue.projectV2Item.id;
}

// --- Update Project Card Text Field ---

// Schema for updating a text field on a project card
export const UpdateProjectCardTextFieldSchema = z.object({
  projectId: z.string().describe('The Node ID of the Project (e.g., "PVT_kwDO...)'),
  itemId: z.string().describe('The Node ID of the Project Item (card) to update (e.g., "PVTI_lADO...)'),
  fieldId: z.string().describe('The Node ID of the custom text field to update (e.g., "PVTFT_lADO...)'),
  text: z.string().describe('The new text value for the field.'),
});

// Function to update a text field on a project card
export async function updateProjectCardTextField(
  projectId: string,
  itemId: string,
  fieldId: string,
  text: string
): Promise<string> { // Returns the ID of the updated item
  const variables = {
    projectId: projectId,
    itemId: itemId,
    fieldId: fieldId,
    value: {
      // The 'value' input type depends on the field being updated.
      // For text fields, it's 'text'.
      text: text
    }
  };

  // Reuse the existing mutation and response type assertion
  const responseData = await githubGraphQLRequest(UPDATE_PROJECT_ITEM_FIELD_MUTATION, variables) as UpdateProjectItemFieldResponse;

  // Validate response structure (reusing logic from single-select update)
  if (
    !responseData ||
    !responseData.updateProjectV2ItemFieldValue ||
    !responseData.updateProjectV2ItemFieldValue.projectV2Item ||
    typeof responseData.updateProjectV2ItemFieldValue.projectV2Item.id !== 'string'
  ) {
    console.error("Unexpected response structure from GitHub GraphQL API:", responseData);
    throw new Error("Failed to update project card text field: Invalid response structure.");
  }

  // Optional: Check if the returned ID matches the requested ID
  if (responseData.updateProjectV2ItemFieldValue.projectV2Item.id !== itemId) {
     console.warn(`Updated item ID (${responseData.updateProjectV2ItemFieldValue.projectV2Item.id}) does not match requested item ID (${itemId}).`);
  }

  return responseData.updateProjectV2ItemFieldValue.projectV2Item.id;
}

// --- List Project Fields ---

// Schema for listing project fields
export const ListProjectFieldsSchema = z.object({
  projectId: z.string().describe('The Node ID of the Project (e.g., "PVT_kwDO...)'),
});

// GraphQL query to fetch project fields, including options for single-select
const GET_PROJECT_FIELDS_QUERY = `
  query GetProjectFields($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        fields(first: 100) { # Fetch up to 100 fields
          nodes {
            ... on ProjectV2FieldCommon {
              id
              name
              dataType
            }
            ... on ProjectV2SingleSelectField {
              options {
                id
                name
              }
            }
            # Add fragments for other field types if needed (e.g., Iteration, Date)
          }
        }
      }
    }
  }
`;

// Type for individual field options (for single-select)
export type FieldOption = {
  id: string;
  name: string;
};

// Type for the field information we want to return
export type ProjectFieldInfo = {
  id: string;
  name: string;
  dataType: string; // e.g., "TEXT", "SINGLE_SELECT", "NUMBER", "DATE", "ITERATION"
  options?: FieldOption[]; // Only populated for SINGLE_SELECT fields
};

// Type for the raw GraphQL response structure (simplified)
type ProjectFieldsQueryResponse = {
    node: {
        fields: {
            nodes: Array<{
                id: string;
                name: string;
                dataType: string;
                options?: Array<{ id: string; name: string }>;
            }>
        }
    } | null; // node could be null if ID not found or not a ProjectV2
};


// Function to list fields for a project
export async function listProjectFields(
  projectId: string
): Promise<ProjectFieldInfo[]> {
  const variables = {
    projectId: projectId,
  };

  const responseData = await githubGraphQLRequest(GET_PROJECT_FIELDS_QUERY, variables) as ProjectFieldsQueryResponse;

  // Validate response structure
  if (
    !responseData ||
    !responseData.node ||
    !responseData.node.fields ||
    !Array.isArray(responseData.node.fields.nodes)
  ) {
    // Handle case where project ID might be invalid or not a ProjectV2
    const projectExistsCheck = await githubGraphQLRequest(`query CheckProject($id: ID!) { node(id: $id) { id } }`, { id: projectId });
    if (!projectExistsCheck || !projectExistsCheck.node) {
        throw new Error(`Project with ID "${projectId}" not found.`);
    }
    // If project exists but structure is wrong, it's an unexpected API response
    console.error("Unexpected response structure from GitHub GraphQL API for project fields:", responseData);
    throw new Error("Failed to fetch project fields: Invalid response structure.");
  }

  // Extract and map the field nodes
  const fields: ProjectFieldInfo[] = responseData.node.fields.nodes.map((node) => {
    // Basic validation for each node
    if (!node || typeof node.id !== 'string' || typeof node.name !== 'string' || typeof node.dataType !== 'string') {
        console.warn("Skipping invalid project field node:", node);
        return null; // Skip invalid nodes
    }

    const fieldInfo: ProjectFieldInfo = {
      id: node.id,
      name: node.name,
      dataType: node.dataType,
    };

    // Include options if they exist (for single select fields)
    if (node.dataType === 'SINGLE_SELECT' && Array.isArray(node.options)) {
      fieldInfo.options = node.options
        .map(opt => (opt && typeof opt.id === 'string' && typeof opt.name === 'string' ? { id: opt.id, name: opt.name } : null))
        .filter((opt): opt is FieldOption => opt !== null); // Filter out any invalid options
    }

    return fieldInfo;
  }).filter((f): f is ProjectFieldInfo => f !== null); // Filter out any nulls from skipped nodes

  return fields;
}

// --- List Project Items ---

// Schema for listing project items
export const ListProjectItemsSchema = z.object({
  projectId: z.string().describe('The Node ID of the Project (e.g., "PVT_kwDO...)'),
  // Future: Add pagination args (e.g., first, after)
});

// GraphQL query to fetch project items and their content
const GET_PROJECT_ITEMS_QUERY = `
  query GetProjectItems($projectId: ID!, $first: Int = 100, $after: String) {
    node(id: $projectId) {
      ... on ProjectV2 {
        items(first: $first, after: $after) {
          nodes {
            id
            type # DRAFT_ISSUE, ISSUE, PULL_REQUEST
            content {
              ... on DraftIssue {
                title
                createdAt
                updatedAt
              }
              ... on Issue {
                number
                title
                url
                state
                createdAt
                updatedAt
                repository { nameWithOwner owner { login } }
              }
              ... on PullRequest {
                number
                title
                url
                state
                createdAt
                updatedAt
                repository { nameWithOwner owner { login } }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

// Type for the project item information
export type ProjectItemInfo = {
  itemId: string; // Node ID of the ProjectV2Item
  itemType: 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST' | 'UNKNOWN';
  content: {
    title?: string; // For DraftIssue, Issue, PR
    number?: number; // For Issue, PR
    url?: string; // For Issue, PR
    state?: string; // For Issue, PR
    repository?: string; // For Issue, PR (nameWithOwner)
    owner?: string; // For Issue, PR (repo owner login)
    createdAt?: string;
    updatedAt?: string;
  } | null; // Content can be null in some cases
};

// Type for the raw GraphQL response structure (simplified)
type ProjectItemsQueryResponse = {
    node: {
        items: {
            nodes: Array<{
                id: string;
                type: 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST';
                content?: { // Content can be optional or null
                    __typename: 'DraftIssue' | 'Issue' | 'PullRequest'; // Helps identify type
                    title?: string;
                    number?: number;
                    url?: string;
                    state?: string;
                    createdAt?: string; // ISO 8601 string
                    updatedAt?: string; // ISO 8601 string
                    repository?: { nameWithOwner: string; owner: { login: string } };
                } | null;
            }>;
            pageInfo: {
                endCursor: string | null;
                hasNextPage: boolean;
            };
        };
    } | null;
};

// Function to list items for a project
export async function listProjectItems(
  projectId: string
): Promise<ProjectItemInfo[]> { // Future: Return pagination info as well
  const variables = {
    projectId: projectId,
    first: 100, // Fetch up to 100 items initially
  };

  const responseData = await githubGraphQLRequest(GET_PROJECT_ITEMS_QUERY, variables) as ProjectItemsQueryResponse;

  // Validate response structure
   if (
    !responseData ||
    !responseData.node ||
    !responseData.node.items ||
    !Array.isArray(responseData.node.items.nodes)
  ) {
    // Check if the project exists to give a better error message
    const projectExistsCheck = await githubGraphQLRequest(`query CheckProject($id: ID!) { node(id: $id) { id } }`, { id: projectId });
    if (!projectExistsCheck || !projectExistsCheck.node) {
        throw new Error(`Project with ID "${projectId}" not found.`);
    }
    console.error("Unexpected response structure from GitHub GraphQL API for project items:", responseData);
    throw new Error("Failed to fetch project items: Invalid response structure.");
  }

  // Extract and map the item nodes
  const items: ProjectItemInfo[] = responseData.node.items.nodes.map((node) => {
     if (!node || typeof node.id !== 'string' || !node.type) {
        console.warn("Skipping invalid project item node:", node);
        return null; // Skip invalid nodes
     }

     const itemInfo: ProjectItemInfo = {
         itemId: node.id,
         itemType: node.type,
         content: null // Default to null
     };

     // Populate content based on type
     if (node.content) {
         itemInfo.content = {
             title: node.content.title,
             number: node.content.number,
             url: node.content.url,
             state: node.content.state,
             repository: node.content.repository?.nameWithOwner,
             owner: node.content.repository?.owner?.login,
             createdAt: node.content.createdAt,
             updatedAt: node.content.updatedAt,
         };
         // Clean up undefined fields if necessary (optional)
         Object.keys(itemInfo.content).forEach(key => itemInfo.content![key as keyof typeof itemInfo.content] === undefined && delete itemInfo.content![key as keyof typeof itemInfo.content]);
     }

     return itemInfo;

  }).filter((item): item is ProjectItemInfo => item !== null);

  // Future: Handle pagination if responseData.node.items.pageInfo.hasNextPage is true

  return items;
}

// --- Convert Project Draft Item to Issue ---

export const ConvertProjectDraftToIssueSchema = z.object({
  projectItemId: z.string().describe('The ID of the draft issue ProjectV2Item to convert.'),
  repositoryId: z.string().describe('The ID of the repository to create the issue in.'),
});

const CONVERT_PROJECT_DRAFT_TO_ISSUE_MUTATION = `
  mutation ConvertDraftToIssue($input: ConvertProjectV2DraftIssueItemToIssueInput!) {
    convertProjectV2DraftIssueItemToIssue(input: $input) {
      # The correct field name is 'item' not 'projectV2Item'
      item {
        id # ID of the card (item) itself
        # Check the content, which should now be an Issue
        content {
          ... on Issue {
            id # Node ID of the newly created Issue
            number
            url
          }
        }
      }
    }
  }
`;

export type ConvertDraftToIssueResponse = {
  convertProjectV2DraftIssueItemToIssue: {
    item: {
      id: string;
      content?: {
        id?: string;
        number?: number;
        url?: string;
      } | null;
    } | null;
  };
};


export async function convertProjectDraftToIssue(
  params: z.infer<typeof ConvertProjectDraftToIssueSchema>
): Promise<{ newItemId: string; issueNumber: number; issueUrl: string }> {
  const input = {
    itemId: params.projectItemId,
    repositoryId: params.repositoryId,
  };
  const variables = { input };

  const responseData = await githubGraphQLRequest(CONVERT_PROJECT_DRAFT_TO_ISSUE_MUTATION, variables) as ConvertDraftToIssueResponse;

  const projectItem = responseData?.convertProjectV2DraftIssueItemToIssue?.item;
  const issueContent = projectItem?.content;

  if (
    !projectItem ||
    !issueContent ||
    typeof issueContent.id !== 'string' ||
    typeof issueContent.number !== 'number' ||
    typeof issueContent.url !== 'string'
  ) {
    console.error("Unexpected response structure or missing issue data after draft conversion:", JSON.stringify(responseData, null, 2));
    // Check if it's because the content wasn't an issue
    if (projectItem && projectItem.content) {
         throw new Error("Failed to convert draft to issue: Resulting item content is not a valid issue.");
    }
    throw new Error("Failed to convert draft to issue: Invalid response structure or issue data missing.");
  }

  return {
    newItemId: issueContent.id,
    issueNumber: issueContent.number,
    issueUrl: issueContent.url,
  };
}
