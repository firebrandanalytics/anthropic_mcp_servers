# GitHub MCP Server

MCP Server for the GitHub API, enabling file operations, repository management, search functionality, and more.

### Features

- **Automatic Branch Creation**: When creating/updating files or pushing changes, branches are automatically created if they don't exist
- **Comprehensive Error Handling**: Clear error messages for common issues
- **Git History Preservation**: Operations maintain proper Git history without force pushing
- **Batch Operations**: Support for both single-file and multi-file operations
- **Advanced Search**: Support for searching code, issues/PRs, and users


## Tools

1. `create_or_update_file`
   - Create or update a single file in a repository
   - Inputs:
     - `owner` (string): Repository owner (username or organization)
     - `repo` (string): Repository name
     - `path` (string): Path where to create/update the file
     - `content` (string): Content of the file
     - `message` (string): Commit message
     - `branch` (string): Branch to create/update the file in
     - `sha` (optional string): SHA of file being replaced (for updates)
   - Returns: File content and commit details

2. `push_files`
   - Push multiple files in a single commit
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `branch` (string): Branch to push to
     - `files` (array): Files to push, each with `path` and `content`
     - `message` (string): Commit message
   - Returns: Updated branch reference

3. `search_repositories`
   - Search for GitHub repositories
   - Inputs:
     - `query` (string): Search query
     - `page` (optional number): Page number for pagination
     - `perPage` (optional number): Results per page (max 100)
   - Returns: Repository search results

4. `create_repository`
   - Create a new GitHub repository
   - Inputs:
     - `name` (string): Repository name
     - `description` (optional string): Repository description
     - `private` (optional boolean): Whether repo should be private
     - `autoInit` (optional boolean): Initialize with README
   - Returns: Created repository details

5. `get_file_contents`
   - Get contents of a file or directory
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `path` (string): Path to file/directory
     - `branch` (optional string): Branch to get contents from
   - Returns: File/directory contents

6. `create_issue`
   - Create a new issue
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `title` (string): Issue title
     - `body` (optional string): Issue description
     - `assignees` (optional string[]): Usernames to assign
     - `labels` (optional string[]): Labels to add
     - `milestone` (optional number): Milestone number
   - Returns: Created issue details

7. `create_pull_request`
   - Create a new pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `title` (string): PR title
     - `body` (optional string): PR description
     - `head` (string): Branch containing changes
     - `base` (string): Branch to merge into
     - `draft` (optional boolean): Create as draft PR
     - `maintainer_can_modify` (optional boolean): Allow maintainer edits
   - Returns: Created pull request details

8. `fork_repository`
   - Fork a repository
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `organization` (optional string): Organization to fork to
   - Returns: Forked repository details

9. `create_branch`
   - Create a new branch
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `branch` (string): Name for new branch
     - `from_branch` (optional string): Source branch (defaults to repo default)
   - Returns: Created branch reference

10. `list_issues`
    - List and filter repository issues
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `state` (optional string): Filter by state ('open', 'closed', 'all')
      - `labels` (optional string[]): Filter by labels
      - `sort` (optional string): Sort by ('created', 'updated', 'comments')
      - `direction` (optional string): Sort direction ('asc', 'desc')
      - `since` (optional string): Filter by date (ISO 8601 timestamp)
      - `page` (optional number): Page number
      - `per_page` (optional number): Results per page
    - Returns: Array of issue details

11. `update_issue`
    - Update an existing issue
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `issue_number` (number): Issue number to update
      - `title` (optional string): New title
      - `body` (optional string): New description
      - `state` (optional string): New state ('open' or 'closed')
      - `labels` (optional string[]): New labels
      - `assignees` (optional string[]): New assignees
      - `milestone` (optional number): New milestone number
    - Returns: Updated issue details

12. `add_issue_comment`
    - Add a comment to an issue
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `issue_number` (number): Issue number to comment on
      - `body` (string): Comment text
    - Returns: Created comment details

13. `search_code`
    - Search for code across GitHub repositories
    - Inputs:
      - `q` (string): Search query using GitHub code search syntax
      - `sort` (optional string): Sort field ('indexed' only)
      - `order` (optional string): Sort order ('asc' or 'desc')
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: Code search results with repository context

14. `search_issues`
    - Search for issues and pull requests
    - Inputs:
      - `q` (string): Search query using GitHub issues search syntax
      - `sort` (optional string): Sort field (comments, reactions, created, etc.)
      - `order` (optional string): Sort order ('asc' or 'desc')
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: Issue and pull request search results

15. `search_users`
    - Search for GitHub users
    - Inputs:
      - `q` (string): Search query using GitHub users search syntax
      - `sort` (optional string): Sort field (followers, repositories, joined)
      - `order` (optional string): Sort order ('asc' or 'desc')
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: User search results

16. `list_commits`
   - Gets commits of a branch in a repository
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `page` (optional string): page number
     - `per_page` (optional string): number of record per page
     - `sha` (optional string): branch name
   - Returns: List of commits

17. `get_issue`
   - Gets the contents of an issue within a repository
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `issue_number` (number): Issue number to retrieve
   - Returns: Github Issue object & details

18. `get_pull_request`
   - Get details of a specific pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `pull_number` (number): Pull request number
   - Returns: Pull request details including diff and review status

19. `list_pull_requests`
   - List and filter repository pull requests
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `state` (optional string): Filter by state ('open', 'closed', 'all')
     - `head` (optional string): Filter by head user/org and branch
     - `base` (optional string): Filter by base branch
     - `sort` (optional string): Sort by ('created', 'updated', 'popularity', 'long-running')
     - `direction` (optional string): Sort direction ('asc', 'desc')
     - `per_page` (optional number): Results per page (max 100)
     - `page` (optional number): Page number
   - Returns: Array of pull request details

20. `create_pull_request_review`
   - Create a review on a pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `pull_number` (number): Pull request number
     - `body` (string): Review comment text
     - `event` (string): Review action ('APPROVE', 'REQUEST_CHANGES', 'COMMENT')
     - `commit_id` (optional string): SHA of commit to review
     - `comments` (optional array): Line-specific comments, each with:
       - `path` (string): File path
       - `position` (number): Line position in diff
       - `body` (string): Comment text
   - Returns: Created review details

21. `merge_pull_request`
   - Merge a pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `pull_number` (number): Pull request number
     - `commit_title` (optional string): Title for merge commit
     - `commit_message` (optional string): Extra detail for merge commit
     - `merge_method` (optional string): Merge method ('merge', 'squash', 'rebase')
   - Returns: Merge result details

22. `get_pull_request_files`
   - Get the list of files changed in a pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `pull_number` (number): Pull request number
   - Returns: Array of changed files with patch and status details

23. `get_pull_request_status`
   - Get the combined status of all status checks for a pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `pull_number` (number): Pull request number
   - Returns: Combined status check results and individual check details

24. `update_pull_request_branch`
   - Update a pull request branch with the latest changes from the base branch (equivalent to GitHub's "Update branch" button)
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `pull_number` (number): Pull request number
     - `expected_head_sha` (optional string): The expected SHA of the pull request's HEAD ref
   - Returns: Success message when branch is updated

25. `get_pull_request_comments`
   - Get the review comments on a pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `pull_number` (number): Pull request number
   - Returns: Array of pull request review comments with details like the comment text, author, and location in the diff

26. `get_pull_request_reviews`
   - Get the reviews on a pull request
   - Inputs:
     - `owner` (string): Repository owner
     - `repo` (string): Repository name
     - `pull_number` (number): Pull request number
   - Returns: Array of pull request reviews with details like the review state (APPROVED, CHANGES_REQUESTED, etc.), reviewer, and review body

## Search Query Syntax

### Code Search
- `language:javascript`: Search by programming language
- `repo:owner/name`: Search in specific repository
- `path:app/src`: Search in specific path
- `extension:js`: Search by file extension
- Example: `q: "import express" language:typescript path:src/`

### Issues Search
- `is:issue` or `is:pr`: Filter by type
- `is:open` or `is:closed`: Filter by state
- `label:bug`: Search by label
- `author:username`: Search by author
- Example: `q: "memory leak" is:issue is:open label:bug`

### Users Search
- `type:user` or `type:org`: Filter by account type
- `followers:>1000`: Filter by followers
- `location:London`: Search by location
- Example: `q: "fullstack developer" location:London followers:>100`

## GitHub Projects Support

The GitHub MCP Server now includes comprehensive support for GitHub Projects:

27. `list_projects`
    - List projects in a GitHub repository
    - Inputs:
      - `owner` (string): Repository owner (username or organization)
      - `repo` (string): Repository name
      - `state` (optional string): Filter projects by state ('open', 'closed', 'all')
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: Array of repository projects

28. `create_project`
    - Create a new project in a GitHub repository
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `name` (string): Name of the project
      - `body` (optional string): Body/description of the project
    - Returns: Created project details

29. `get_project`
    - Get details of a specific project
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
    - Returns: Project details

30. `update_project`
    - Update a project in a GitHub repository
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `name` (optional string): New name of the project
      - `body` (optional string): New body/description of the project
      - `state` (optional string): New state of the project ('open', 'closed')
    - Returns: Updated project details

31. `delete_project`
    - Delete a project from a GitHub repository
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
    - Returns: Success message

32. `list_project_columns`
    - List columns in a GitHub project
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: Array of project columns

33. `create_project_column`
    - Create a new column in a GitHub project
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `name` (string): Name of the column
    - Returns: Created column details

34. `update_project_column`
    - Update a column in a GitHub project
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `column_id` (number): Column ID
      - `name` (string): New name of the column
    - Returns: Updated column details

35. `delete_project_column`
    - Delete a column from a GitHub project
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `column_id` (number): Column ID
    - Returns: Success message

36. `list_project_cards`
    - List cards in a GitHub project column
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `column_id` (number): Column ID
      - `archived_state` (optional string): Filter cards by archived state ('all', 'archived', 'not_archived')
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: Array of project cards

37. `create_project_card`
    - Create a new card in a GitHub project column
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `column_id` (number): Column ID
      - `note` (optional string): The note content for the card
      - `content_id` (optional number): The ID of the issue or pull request to associate with this card
      - `content_type` (optional string): The type of content to associate with this card ('Issue', 'PullRequest')
    - Returns: Created card details

38. `update_project_card`
    - Update a card in a GitHub project
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `card_id` (number): Card ID
      - `note` (optional string): The new note content for the card
      - `archived` (optional boolean): Whether or not the card is archived
    - Returns: Updated card details

39. `delete_project_card`
    - Delete a card from a GitHub project
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `card_id` (number): Card ID
    - Returns: Success message

40. `move_project_card`
    - Move a card in a GitHub project
    - Inputs:
      - `owner` (string): Repository owner
      - `repo` (string): Repository name
      - `project_number` (number): Project number
      - `card_id` (number): Card ID
      - `position` (string): Position to move the card to ('top', 'bottom', 'after:<card_id>')
      - `column_id` (optional number): Column ID to move the card to
    - Returns: Success message

## GitHub Organization Projects Support

The GitHub MCP Server includes support for GitHub Organization Projects:

41. `list_org_projects`
    - List projects in a GitHub organization
    - Inputs:
      - `org` (string): Organization name
      - `state` (optional string): Filter projects by state ('open', 'closed', 'all')
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: Array of organization projects

42. `create_org_project`
    - Create a new project in a GitHub organization
    - Inputs:
      - `org` (string): Organization name
      - `name` (string): Name of the project
      - `body` (optional string): Body/description of the project
    - Returns: Created project details

43. `get_org_project`
    - Get details of a specific project in a GitHub organization
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
    - Returns: Project details

44. `update_org_project`
    - Update a project in a GitHub organization
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `name` (optional string): New name of the project
      - `body` (optional string): New body/description of the project
      - `state` (optional string): New state of the project ('open', 'closed')
    - Returns: Updated project details

45. `delete_org_project`
    - Delete a project from a GitHub organization
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
    - Returns: Success message

46. `list_org_project_columns`
    - List columns in a GitHub organization project
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: Array of project columns

47. `create_org_project_column`
    - Create a new column in a GitHub organization project
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `name` (string): Name of the column
    - Returns: Created column details

48. `update_org_project_column`
    - Update a column in a GitHub organization project
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `column_id` (number): Column ID
      - `name` (string): New name of the column
    - Returns: Updated column details

49. `delete_org_project_column`
    - Delete a column from a GitHub organization project
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `column_id` (number): Column ID
    - Returns: Success message

50. `list_org_project_cards`
    - List cards in a GitHub organization project column
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `column_id` (number): Column ID
      - `archived_state` (optional string): Filter cards by archived state ('all', 'archived', 'not_archived')
      - `per_page` (optional number): Results per page (max 100)
      - `page` (optional number): Page number
    - Returns: Array of project cards

51. `create_org_project_card`
    - Create a new card in a GitHub organization project column
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `column_id` (number): Column ID
      - `note` (optional string): The note content for the card
      - `content_id` (optional number): The ID of the issue or pull request to associate with this card
      - `content_type` (optional string): The type of content to associate with this card ('Issue', 'PullRequest')
    - Returns: Created card details

52. `update_org_project_card`
    - Update a card in a GitHub organization project
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `card_id` (number): Card ID
      - `note` (optional string): The new note content for the card
      - `archived` (optional boolean): Whether or not the card is archived
    - Returns: Updated card details

53. `delete_org_project_card`
    - Delete a card from a GitHub organization project
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `card_id` (number): Card ID
    - Returns: Success message

54. `move_org_project_card`
    - Move a card in a GitHub organization project
    - Inputs:
      - `org` (string): Organization name
      - `project_number` (number): Project number
      - `card_id` (number): Card ID
      - `position` (string): Position to move the card to ('top', 'bottom', 'after:<card_id>')
      - `column_id` (optional number): Column ID to move the card to
    - Returns: Success message

For detailed search syntax, see [GitHub's searching documentation](https://docs.github.com/en/search-github/searching-on-github).

## Setup

### Personal Access Token
[Create a GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with appropriate permissions:
   - Go to [Personal access tokens](https://github.com/settings/tokens) (in GitHub Settings > Developer settings)
   - Select which repositories you'd like this token to have access to (Public, All, or Select)
   - Create a token with the `repo` scope ("Full control of private repositories")
     - Alternatively, if working only with public repositories, select only the `public_repo` scope
   - Copy the generated token

### Usage with Claude Desktop
To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

#### Docker
```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "mcp/github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### NPX

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

## Build

Docker build:

```bash
docker build -t mcp/github -f src/github/Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
