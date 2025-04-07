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
    $value: ProjectV2FieldValueInput!
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
