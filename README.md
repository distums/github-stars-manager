# GitHub Stars Manager

Sync, search, and manage your GitHub Stars effortlessly via **Agent Skill** and **CLI**.

## Install as Agent Skill

```bash
npx skills add distums/github-stars-manager
```

## Setup

### 1. Generate GitHub Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set expiration as needed
4. Select scopes based on your needs:

| Scope | When to Select |
|-------|---------------|
| `repo` (Full control of private repositories) | Required if you have **private repositories** in your stars |
| `public_repo` (Access public repositories) | Required if you only have **public repositories** |

5. Click "Generate token" and copy the token

**Note:** If you only star public repositories, just select `public_repo`. If you have any private starred repositories, you need `repo` scope.

### 2. Configure and Install

```bash
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN
npm install
```

## CLI Commands

```bash
# Configure GitHub token (saved directly in package directory)
npm start config -- --set-token ghp_xxxxxx
# or check current configuration paths and status
npm start config -- --show

# Sync all stars from GitHub
npm start sync

# Force sync and overwrite local stars
npm start sync -- -f

# Search stars by keyword
npm start search keyword

# Unstar a repository
npm start unstar owner/repo
```

## Web UI

```bash
npm run server
```

Then open http://localhost:3000

## Data Storage

Stars are stored locally in `stars.json` with the following schema:

```json
{
  "id": 123456,
  "full_name": "owner/repo",
  "description": "Project description",
  "url": "https://github.com/owner/repo",
  "language": "JavaScript"
}
```

## License

[MIT](LICENSE)

