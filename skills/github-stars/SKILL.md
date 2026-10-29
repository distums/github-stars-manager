---
name: github-stars
description: Manage the user's GitHub starred repositories through the `github-stars-manager` CLI (global `github-stars` or `npx github-stars-manager`) — sync stars from GitHub to a local cache, search/filter/summarize them, unstar repositories (single or bulk cleanup), and configure the GitHub token. Use this skill whenever the user mentions their GitHub stars, starred repos, "收藏的仓库", "我的 star", finding a repo they starred before, cleaning up / unstarring old or unwanted repos, analyzing what languages or topics they star, or syncing stars — even if they don't name the tool explicitly.
---

# GitHub Stars Manager

This skill drives the `github-stars-manager` CLI, which keeps a local cache (`stars.json`) of the user's GitHub stars and can unstar repos via the GitHub API.

## Locating the CLI

Decide once per session and reuse it (referred to as `$GS` below):

1. If `which github-stars` succeeds (globally installed via `npm i -g github-stars-manager`), use `github-stars`.
2. Otherwise use `npx github-stars-manager` (e.g. `npx github-stars-manager search react`). The first run may download the package; add `-y` (`npx -y github-stars-manager ...`) to skip the install prompt in non-interactive shells.

Don't look for or fall back to a source checkout (`node src/cli.js`, `npm start`) — this skill is distributed on its own, without the CLI source. If `npx` fails too (no Node.js / no network), tell the user to install Node.js or run `npm i -g github-stars-manager` rather than reimplementing the CLI.

Note: with `npx`, the token and `stars.json` live inside the npx package cache, so `config --path` is the reliable way to find them. Suggest a global install if the user wants the cache and token to persist predictably.

`sync` and `unstar` call the GitHub API, so they need network access. `search` and the query script only read the local cache.

## Commands

| Task | Command | Notes |
|------|---------|-------|
| Check config / token status | `$GS config --show` | Prints `.env` path, data file path, masked token |
| Show file paths | `$GS config --path` | Use to find `stars.json` |
| Set token | `$GS config --set-token <token>` | Writes to the package `.env` |
| Incremental sync | `$GS sync` | Adds new stars; **does not remove** stars unstarred elsewhere |
| Full sync | `$GS sync -f` | Overwrites local cache with exact remote state |
| Keyword search | `$GS search <keyword>` | Case-insensitive substring over `full_name`, `description`, `language` |
| Unstar | `$GS unstar <owner/repo>` | Removes on GitHub **and** in local cache |

Each cached record looks like:
```json
{
  "id": 123,
  "name": "repo",
  "full_name": "owner/repo",
  "private": false,
  "owner": "owner",
  "description": "...",
  "url": "https://github.com/owner/repo",
  "git_url": "git://github.com/owner/repo.git",
  "ssh_url": "git@github.com:owner/repo.git",
  "homepage": "https://example.com",
  "language": "JavaScript",
  "archived": false,
  "disabled": false,
  "license": "MIT License",
  "topics": ["cli", "automation"],
  "visibility": "public",
  "created_at": "2024-01-15T08:00:00Z",
  "updated_at": "2026-10-01T12:30:00Z"
}
```

## Richer queries: `scripts/query.js`

`search` is a single substring match with human-oriented output. For anything more structured (filter by language, topics, license, archived/disabled/private status, update/creation dates, sorting, counting, stats, or JSON output for further reasoning), use the bundled script — it reads the same `stars.json` and prints JSON:

```bash
node <skill-dir>/scripts/query.js [--file <stars.json>] [options]
  --keyword <k>          substring in full_name/description/topics/homepage (repeatable; all must match)
  --any <k>              substring in full_name/description/topics/homepage (repeatable; any may match)
  --topic <t>            exact topic match, case-insensitive (repeatable; all must match)
  --language <l>         exact language match, case-insensitive ("none" = no language)
  --owner <o>            exact owner login match, case-insensitive
  --license <lic>        substring match on license name, case-insensitive ("none" = no license)
  --visibility <v>       exact visibility match (e.g. "public", "private")
  --archived [bool]      filter by archived status (or --no-archived)
  --disabled [bool]      filter by disabled status (or --no-disabled)
  --private [bool]       filter by private status (or --no-private)
  --updated-after <iso>  updated on/after date (e.g. 2025-01-01)
  --updated-before <iso> updated on/before date
  --created-after <iso>  created on/after date
  --created-before <iso> created on/before date
  --sort <key>           sort by updated, created, or name (append :asc or :desc)
  --stats                output counts by language, license, top topics, top owners, and archived/disabled/private totals
  --limit <n>            cap number of records (default 50; 0 = no cap)
```

If `--file` is omitted, the script asks `github-stars config --path` (or `npx -y github-stars-manager config --path`) for the location. Prefer the script over loading `stars.json` directly — the file can be large (hundreds of KB) and would waste context.

## Workflows

**Freshness first.** The cache can be stale. If the user asks about their current stars and the data may be outdated (or they just starred/unstarred something on GitHub), run `$GS sync` first. Use `sync -f` when accuracy of *removals* or latest field structure matters (e.g. counting stars, cleanup audits), since plain `sync` never deletes or overwrites existing records.

**Finding a repo.** Translate vague descriptions into several keywords, topics, or filters and try them (e.g. "that Rust terminal thing" → `--language rust --any terminal --any tui --any shell`, or filter by `--topic`, `--owner`, `--updated-after`). Present results as a short list: `full_name` — description (language, topics/homepage if helpful) + URL.

**Unstarring & cleanup.** Unstarring changes the user's GitHub account, so:
- For a single repo the user named explicitly, just do it.
- For cleanup audits (e.g. "unstar archived repos", "find stale repos not updated since 2022", "unstar all my old jQuery plugins"), query with `--archived`, `--disabled`, or `--updated-before <date>` (plus `--sort updated:asc`), first show the exact list of `owner/repo` (with archived/updated_at details) that would be removed, and get confirmation. Then run `$GS unstar` once per repo and report successes and failures separately. A "not starred" error usually means the cache was stale — suggest `sync -f`.

**Token problems.** Errors like `GITHUB_TOKEN environment variable is not set`, HTTP 401, or 403 mean the token is missing/invalid/under-scoped. Run `$GS config --show`, then ask the user for a classic PAT (`public_repo` scope, or `repo` if they star private repos) and set it with `config --set-token`. Never print the full token back; the CLI masks it for you.

**Analysis.** For "what do I star most?" style questions, use `query.js --stats`, then summarize insights (top languages, top topics, license distribution, recurring owners, archived/private counts, and themes you notice from descriptions) rather than dumping raw JSON.

