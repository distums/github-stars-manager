# GitHub Stars Manager

Sync and manage your GitHub Stars with CLI and Web UI.

## Setup

```bash
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN
npm install
```

## CLI Commands

```bash
# Sync all stars
npm start sync

# Search stars
npm start search keyword

# Unstar a repository
npm start unstar owner/repo
```

## Web UI

```bash
npm run server
```

Then open http://localhost:3000
