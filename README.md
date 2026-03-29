# GitHub Stars Manager

Sync and manage your GitHub Stars with CLI and Web UI.

## Setup

### 1. Generate GitHub Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set expiration as needed
4. Select scopes:
   - `repo` (Full control of private repositories) - required for starring
5. Click "Generate token" and copy the token

### 2. Configure and Install

```bash
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN
npm install
```

## CLI Commands

```bash
# Sync all stars from GitHub
npm start sync

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
