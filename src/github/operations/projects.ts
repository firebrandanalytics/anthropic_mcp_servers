import { z } from "zod";
import { githubRequest, buildUrl } from "../common/utils.js";

// Schema definitions for Project objects
export const GitHubProjectSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string(),
  html_url: z.string(),
  columns_url: z.string(),
  name: z.string(),
  body: z.string().nullable(),
  number: z.number(),
  state: z.enum(["open", "closed"]),
  creator: z.object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string(),
    url: z.string(),
    html_url: z.string(),
  }),
  created_at: z.string(),
  updated_at: z.string(),
});

export const GitHubProjectColumnSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string(),
  project_url: z.string(),
  cards_url: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const GitHubProjectCardSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string(),
  column_url: z.string(),
  content_url: z.string().nullable(),
  project_url: z.string(),
  creator: z.object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string(),
    url: z.string(),
    html_url: z.string(),
  }),
  created_at: z.string(),
  updated_at: z.string(),
  note: z.string().nullable(),
  archived: z.boolean(),
});

// Input schemas for Projects operations
export const ListProjectsSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  state: z.enum(["open", "closed", "all"]).optional().describe("Filter projects by state"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number"),
});

export const CreateProjectSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  name: z.string().describe("Name of the project"),
  body: z.string().optional().describe("Body/description of the project"),
});

export const GetProjectSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
});

export const UpdateProjectSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  name: z.string().optional().describe("New name of the project"),
  body: z.string().optional().describe("New body/description of the project"),
  state: z.enum(["open", "closed"]).optional().describe("New state of the project"),
});

export const DeleteProjectSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
});

// Columns schemas
export const ListProjectColumnsSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number"),
});

export const CreateProjectColumnSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  name: z.string().describe("Name of the column"),
});

export const UpdateProjectColumnSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  column_id: z.number().describe("Column ID"),
  name: z.string().describe("New name of the column"),
});

export const DeleteProjectColumnSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  column_id: z.number().describe("Column ID"),
});

// Cards schemas
export const ListProjectCardsSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  column_id: z.number().describe("Column ID"),
  archived_state: z.enum(["all", "archived", "not_archived"]).optional().describe("Filter cards by archived state"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number"),
});

export const CreateProjectCardSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  column_id: z.number().describe("Column ID"),
  note: z.string().optional().describe("The note content for the card"),
  content_id: z.number().optional().describe("The ID of the issue or pull request to associate with this card"),
  content_type: z.enum(["Issue", "PullRequest"]).optional().describe("The type of content to associate with this card"),
});

export const UpdateProjectCardSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  card_id: z.number().describe("Card ID"),
  note: z.string().optional().describe("The note content for the card"),
  archived: z.boolean().optional().describe("Whether or not the card is archived"),
});

export const DeleteProjectCardSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  card_id: z.number().describe("Card ID"),
});

export const MoveProjectCardSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  project_number: z.number().describe("Project number"),
  card_id: z.number().describe("Card ID"),
  position: z.enum(["top", "bottom", "after:<card_id>"]).describe("Position to move the card to"),
  column_id: z.number().optional().describe("Column ID to move the card to"),
});

// Add these new schemas for organization-level projects
export const ListOrgProjectsSchema = z.object({
    org: z.string().describe("Organization name"),
    state: z.enum(["open", "closed", "all"]).optional().describe("Filter projects by state"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
    page: z.number().optional().describe("Page number"),
  });
  
  export const CreateOrgProjectSchema = z.object({
    org: z.string().describe("Organization name"),
    name: z.string().describe("Name of the project"),
    body: z.string().optional().describe("Body/description of the project"),
  });
  
  export const GetOrgProjectSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
  });
  
  export const UpdateOrgProjectSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    name: z.string().optional().describe("New name of the project"),
    body: z.string().optional().describe("New body/description of the project"),
    state: z.enum(["open", "closed"]).optional().describe("New state of the project"),
  });
  
  export const DeleteOrgProjectSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
  });
  
  // Update other schemas for columns and cards to handle organization-level projects
  export const ListOrgProjectColumnsSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
    page: z.number().optional().describe("Page number"),
  });
  
  export const CreateOrgProjectColumnSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    name: z.string().describe("Name of the column"),
  });
  
  export const UpdateOrgProjectColumnSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    column_id: z.number().describe("Column ID"),
    name: z.string().describe("New name of the column"),
  });
  
  export const DeleteOrgProjectColumnSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    column_id: z.number().describe("Column ID"),
  });
  
  export const ListOrgProjectCardsSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    column_id: z.number().describe("Column ID"),
    archived_state: z.enum(["all", "archived", "not_archived"]).optional().describe("Filter cards by archived state"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
    page: z.number().optional().describe("Page number"),
  });
  
  export const CreateOrgProjectCardSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    column_id: z.number().describe("Column ID"),
    note: z.string().optional().describe("The note content for the card"),
    content_id: z.number().optional().describe("The ID of the issue or pull request to associate with this card"),
    content_type: z.enum(["Issue", "PullRequest"]).optional().describe("The type of content to associate with this card"),
  });
  
  export const UpdateOrgProjectCardSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    card_id: z.number().describe("Card ID"),
    note: z.string().optional().describe("The note content for the card"),
    archived: z.boolean().optional().describe("Whether or not the card is archived"),
  });
  
  export const DeleteOrgProjectCardSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    card_id: z.number().describe("Card ID"),
  });
  
  export const MoveOrgProjectCardSchema = z.object({
    org: z.string().describe("Organization name"),
    project_number: z.number().describe("Project number"),
    card_id: z.number().describe("Card ID"),
    position: z.enum(["top", "bottom", "after:<card_id>"]).describe("Position to move the card to"),
    column_id: z.number().optional().describe("Column ID to move the card to"),
  });

// Type exports
export type GitHubProject = z.infer<typeof GitHubProjectSchema>;
export type GitHubProjectColumn = z.infer<typeof GitHubProjectColumnSchema>;
export type GitHubProjectCard = z.infer<typeof GitHubProjectCardSchema>;

// Function implementations
export async function listProjects(
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof ListProjectsSchema>, "owner" | "repo"> = {}
): Promise<GitHubProject[]> {
  const url = buildUrl(`https://api.github.com/repos/${owner}/${repo}/projects`, {
    state: options.state,
    per_page: options.per_page?.toString(),
    page: options.page?.toString(),
  });

  const response = await githubRequest(url, {
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
  });

  return z.array(GitHubProjectSchema).parse(response);
}

export async function createProject(
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof CreateProjectSchema>, "owner" | "repo">
): Promise<GitHubProject> {
  const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/projects`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
    body: options,
  });

  return GitHubProjectSchema.parse(response);
}

export async function getProject(
  owner: string,
  repo: string,
  projectNumber: number
): Promise<GitHubProject> {
  // First get the list of projects to find the project by number
  const projects = await listProjects(owner, repo);
  const project = projects.find(p => p.number === projectNumber);
  
  if (!project) {
    throw new Error(`Project number ${projectNumber} not found in repository ${owner}/${repo}`);
  }

  const response = await githubRequest(project.url, {
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
  });

  return GitHubProjectSchema.parse(response);
}

export async function updateProject(
  owner: string,
  repo: string,
  projectNumber: number,
  options: Omit<z.infer<typeof UpdateProjectSchema>, "owner" | "repo" | "project_number">
): Promise<GitHubProject> {
  // First get the project to obtain its URL
  const project = await getProject(owner, repo, projectNumber);

  const response = await githubRequest(project.url, {
    method: "PATCH",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
    body: options,
  });

  return GitHubProjectSchema.parse(response);
}

export async function deleteProject(
  owner: string,
  repo: string,
  projectNumber: number
): Promise<void> {
  // First get the project to obtain its URL
  const project = await getProject(owner, repo, projectNumber);

  await githubRequest(project.url, {
    method: "DELETE",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
  });
}

// Project columns functions
export async function listProjectColumns(
  owner: string,
  repo: string,
  projectNumber: number,
  options: Omit<z.infer<typeof ListProjectColumnsSchema>, "owner" | "repo" | "project_number"> = {}
): Promise<GitHubProjectColumn[]> {
  // First get the project to obtain its columns URL
  const project = await getProject(owner, repo, projectNumber);

  const url = buildUrl(project.columns_url, {
    per_page: options.per_page?.toString(),
    page: options.page?.toString(),
  });

  const response = await githubRequest(url, {
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
  });

  return z.array(GitHubProjectColumnSchema).parse(response);
}

export async function createProjectColumn(
  owner: string,
  repo: string,
  projectNumber: number,
  options: Omit<z.infer<typeof CreateProjectColumnSchema>, "owner" | "repo" | "project_number">
): Promise<GitHubProjectColumn> {
  // First get the project to obtain its columns URL
  const project = await getProject(owner, repo, projectNumber);

  const response = await githubRequest(project.columns_url, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
    body: options,
  });

  return GitHubProjectColumnSchema.parse(response);
}

export async function updateProjectColumn(
  owner: string,
  repo: string,
  projectNumber: number,
  columnId: number,
  options: Omit<z.infer<typeof UpdateProjectColumnSchema>, "owner" | "repo" | "project_number" | "column_id">
): Promise<GitHubProjectColumn> {
  const response = await githubRequest(`https://api.github.com/projects/columns/${columnId}`, {
    method: "PATCH",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
    body: options,
  });

  return GitHubProjectColumnSchema.parse(response);
}

export async function deleteProjectColumn(
  owner: string,
  repo: string,
  projectNumber: number,
  columnId: number
): Promise<void> {
  await githubRequest(`https://api.github.com/projects/columns/${columnId}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
  });
}

// Project cards functions
export async function listProjectCards(
  owner: string,
  repo: string,
  projectNumber: number,
  columnId: number,
  options: Omit<z.infer<typeof ListProjectCardsSchema>, "owner" | "repo" | "project_number" | "column_id"> = {}
): Promise<GitHubProjectCard[]> {
  const url = buildUrl(`https://api.github.com/projects/columns/${columnId}/cards`, {
    archived_state: options.archived_state,
    per_page: options.per_page?.toString(),
    page: options.page?.toString(),
  });

  const response = await githubRequest(url, {
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
  });

  return z.array(GitHubProjectCardSchema).parse(response);
}

export async function createProjectCard(
  owner: string,
  repo: string,
  projectNumber: number,
  columnId: number,
  options: Omit<z.infer<typeof CreateProjectCardSchema>, "owner" | "repo" | "project_number" | "column_id">
): Promise<GitHubProjectCard> {
  const response = await githubRequest(`https://api.github.com/projects/columns/${columnId}/cards`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
    body: options,
  });

  return GitHubProjectCardSchema.parse(response);
}

export async function updateProjectCard(
  owner: string,
  repo: string,
  projectNumber: number,
  cardId: number,
  options: Omit<z.infer<typeof UpdateProjectCardSchema>, "owner" | "repo" | "project_number" | "card_id">
): Promise<GitHubProjectCard> {
  const response = await githubRequest(`https://api.github.com/projects/cards/${cardId}`, {
    method: "PATCH",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
    body: options,
  });

  return GitHubProjectCardSchema.parse(response);
}

export async function deleteProjectCard(
  owner: string,
  repo: string,
  projectNumber: number,
  cardId: number
): Promise<void> {
  await githubRequest(`https://api.github.com/projects/cards/${cardId}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
  });
}

export async function moveProjectCard(
  owner: string,
  repo: string,
  projectNumber: number,
  cardId: number,
  position: string,
  columnId?: number
): Promise<void> {
  const body: any = { position };
  if (columnId) {
    body.column_id = columnId;
  }

  await githubRequest(`https://api.github.com/projects/cards/${cardId}/moves`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github.inertia-preview+json",
    },
    body,
  });
}

// Organization-level project functions
export async function listOrgProjects(
    org: string,
    options: Omit<z.infer<typeof ListOrgProjectsSchema>, "org"> = {}
  ): Promise<GitHubProject[]> {
    const url = buildUrl(`https://api.github.com/orgs/${org}/projects`, {
      state: options.state,
      per_page: options.per_page?.toString(),
      page: options.page?.toString(),
    });
  
    const response = await githubRequest(url, {
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    });
  
    return z.array(GitHubProjectSchema).parse(response);
  }
  
  export async function createOrgProject(
    org: string,
    options: Omit<z.infer<typeof CreateOrgProjectSchema>, "org">
  ): Promise<GitHubProject> {
    const response = await githubRequest(`https://api.github.com/orgs/${org}/projects`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
      body: options,
    });
  
    return GitHubProjectSchema.parse(response);
  }
  
  export async function getOrgProject(
    org: string,
    projectNumber: number
  ): Promise<GitHubProject> {
    // First get the list of organization projects to find the project by number
    const projects = await listOrgProjects(org);
    const project = projects.find(p => p.number === projectNumber);
    
    if (!project) {
      throw new Error(`Project number ${projectNumber} not found in organization ${org}`);
    }
  
    const response = await githubRequest(project.url, {
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    });
  
    return GitHubProjectSchema.parse(response);
  }
  
  export async function updateOrgProject(
    org: string,
    projectNumber: number,
    options: Omit<z.infer<typeof UpdateOrgProjectSchema>, "org" | "project_number">
  ): Promise<GitHubProject> {
    // First get the project to obtain its URL
    const project = await getOrgProject(org, projectNumber);
  
    const response = await githubRequest(project.url, {
      method: "PATCH",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
      body: options,
    });
  
    return GitHubProjectSchema.parse(response);
  }
  
  export async function deleteOrgProject(
    org: string,
    projectNumber: number
  ): Promise<void> {
    // First get the project to obtain its URL
    const project = await getOrgProject(org, projectNumber);
  
    await githubRequest(project.url, {
      method: "DELETE",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    });
  }
  
  // Organization project columns functions
  export async function listOrgProjectColumns(
    org: string,
    projectNumber: number,
    options: Omit<z.infer<typeof ListOrgProjectColumnsSchema>, "org" | "project_number"> = {}
  ): Promise<GitHubProjectColumn[]> {
    // First get the project to obtain its columns URL
    const project = await getOrgProject(org, projectNumber);
  
    const url = buildUrl(project.columns_url, {
      per_page: options.per_page?.toString(),
      page: options.page?.toString(),
    });
  
    const response = await githubRequest(url, {
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    });
  
    return z.array(GitHubProjectColumnSchema).parse(response);
  }
  
  export async function createOrgProjectColumn(
    org: string,
    projectNumber: number,
    options: Omit<z.infer<typeof CreateOrgProjectColumnSchema>, "org" | "project_number">
  ): Promise<GitHubProjectColumn> {
    // First get the project to obtain its columns URL
    const project = await getOrgProject(org, projectNumber);
  
    const response = await githubRequest(project.columns_url, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
      body: options,
    });
  
    return GitHubProjectColumnSchema.parse(response);
  }
  
  export async function updateOrgProjectColumn(
    org: string,
    projectNumber: number,
    columnId: number,
    options: Omit<z.infer<typeof UpdateOrgProjectColumnSchema>, "org" | "project_number" | "column_id">
  ): Promise<GitHubProjectColumn> {
    const response = await githubRequest(`https://api.github.com/projects/columns/${columnId}`, {
      method: "PATCH",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
      body: options,
    });
  
    return GitHubProjectColumnSchema.parse(response);
  }
  
  export async function deleteOrgProjectColumn(
    org: string,
    projectNumber: number,
    columnId: number
  ): Promise<void> {
    await githubRequest(`https://api.github.com/projects/columns/${columnId}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    });
  }
  
  // Organization project cards functions
  export async function listOrgProjectCards(
    org: string,
    projectNumber: number,
    columnId: number,
    options: Omit<z.infer<typeof ListOrgProjectCardsSchema>, "org" | "project_number" | "column_id"> = {}
  ): Promise<GitHubProjectCard[]> {
    const url = buildUrl(`https://api.github.com/projects/columns/${columnId}/cards`, {
      archived_state: options.archived_state,
      per_page: options.per_page?.toString(),
      page: options.page?.toString(),
    });
  
    const response = await githubRequest(url, {
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    });
  
    return z.array(GitHubProjectCardSchema).parse(response);
  }
  
  export async function createOrgProjectCard(
    org: string,
    projectNumber: number,
    columnId: number,
    options: Omit<z.infer<typeof CreateOrgProjectCardSchema>, "org" | "project_number" | "column_id">
  ): Promise<GitHubProjectCard> {
    const response = await githubRequest(`https://api.github.com/projects/columns/${columnId}/cards`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
      body: options,
    });
  
    return GitHubProjectCardSchema.parse(response);
  }
  
  export async function updateOrgProjectCard(
    org: string,
    projectNumber: number,
    cardId: number,
    options: Omit<z.infer<typeof UpdateOrgProjectCardSchema>, "org" | "project_number" | "card_id">
  ): Promise<GitHubProjectCard> {
    const response = await githubRequest(`https://api.github.com/projects/cards/${cardId}`, {
      method: "PATCH",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
      body: options,
    });
  
    return GitHubProjectCardSchema.parse(response);
  }
  
  export async function deleteOrgProjectCard(
    org: string,
    projectNumber: number,
    cardId: number
  ): Promise<void> {
    await githubRequest(`https://api.github.com/projects/cards/${cardId}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    });
  }
  
  export async function moveOrgProjectCard(
    org: string,
    projectNumber: number,
    cardId: number,
    position: string,
    columnId?: number
  ): Promise<void> {
    const body: any = { position };
    if (columnId) {
      body.column_id = columnId;
    }
  
    await githubRequest(`https://api.github.com/projects/cards/${cardId}/moves`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
      body,
    });
  }