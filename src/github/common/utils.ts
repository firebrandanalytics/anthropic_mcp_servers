import { getUserAgent } from "universal-user-agent";
import {
  createGitHubError,
  GitHubError,
} from "./errors.js";
import { VERSION } from "./version.js";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export function buildUrl(
  baseUrl: string,
  params: Record<string, string | number | undefined>
): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });
  return url.toString();
}

const USER_AGENT = `modelcontextprotocol/servers/github/v${VERSION} ${getUserAgent()}`;

export async function githubRequest(
  url: string,
  options: RequestOptions = {}
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
    ...options.headers,
  };

  if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw createGitHubError(response.status, responseBody);
  }

  return responseBody;
}

export function validateBranchName(branch: string): string {
  const sanitized = branch.trim();
  if (!sanitized) {
    throw new Error("Branch name cannot be empty");
  }
  if (sanitized.includes("..")) {
    throw new Error("Branch name cannot contain '..'");
  }
  if (/[\s~^:?*[\\\]]/.test(sanitized)) {
    throw new Error("Branch name contains invalid characters");
  }
  if (sanitized.startsWith("/") || sanitized.endsWith("/")) {
    throw new Error("Branch name cannot start or end with '/'");
  }
  if (sanitized.endsWith(".lock")) {
    throw new Error("Branch name cannot end with '.lock'");
  }
  return sanitized;
}

export function validateRepositoryName(name: string): string {
  const sanitized = name.trim().toLowerCase();
  if (!sanitized) {
    throw new Error("Repository name cannot be empty");
  }
  if (!/^[a-z0-9_.-]+$/.test(sanitized)) {
    throw new Error(
      "Repository name can only contain lowercase letters, numbers, hyphens, periods, and underscores"
    );
  }
  if (sanitized.startsWith(".") || sanitized.endsWith(".")) {
    throw new Error("Repository name cannot start or end with a period");
  }
  return sanitized;
}

export function validateOwnerName(owner: string): string {
  const sanitized = owner.trim().toLowerCase();
  if (!sanitized) {
    throw new Error("Owner name cannot be empty");
  }
  if (!/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/.test(sanitized)) {
    throw new Error(
      "Owner name must start with a letter or number and can contain up to 39 characters"
    );
  }
  return sanitized;
}

export async function checkBranchExists(
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> {
  try {
    await githubRequest(
      `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`
    );
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return false;
    }
    throw error;
  }
}

export async function checkUserExists(username: string): Promise<boolean> {
  try {
    await githubRequest(`https://api.github.com/users/${username}`);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return false;
    }
    throw error;
  }
}

// Define the GraphQL endpoint
const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

// Helper for GitHub GraphQL API requests
export async function githubGraphQLRequest(
  query: string,
  variables?: Record<string, any>
): Promise<any> {
  // Consider using a more specific return type if possible
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
  };

  if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    headers[
      "Authorization"
    ] = `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
  } else {
    throw new Error(
      "GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required for GraphQL requests."
    );
  }

  const body = JSON.stringify({
    query,
    variables,
  });

  try {
    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body,
    });

    const responseBody = await parseResponseBody(response);

    if (
      response.ok &&
      typeof responseBody === "object" &&
      responseBody !== null &&
      "errors" in responseBody &&
      Array.isArray(responseBody.errors) &&
      responseBody.errors.length > 0
    ) {
      const errorMessages = responseBody.errors
        .map((err: any) => err.message || "Unknown GraphQL error")
        .join("; ");
      throw new Error(`GraphQL Query Error(s): ${errorMessages}`);
    }

    if (!response.ok) {
      throw createGitHubError(response.status, responseBody);
    }

    if (
      typeof responseBody !== "object" ||
      responseBody === null ||
      !("data" in responseBody)
    ) {
      throw new Error('Invalid GraphQL response: "data" field missing.');
    }

    return responseBody.data;
  } catch (error) {
    if (
      error instanceof GitHubError ||
      (error instanceof Error &&
        error.message.startsWith("GraphQL Query Error"))
    ) {
      throw error;
    }
    throw new Error(
      `GraphQL request failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
