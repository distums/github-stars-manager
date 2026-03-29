# GitHub Stars Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个 Node.js CLI + Web UI 应用，同步和管理 GitHub Stars

**Architecture:** 使用 Express.js 提供 Web 服务，Commander.js 处理 CLI，JSON 文件存储数据。CLI 和 Web 服务共享同一业务逻辑层。

**Tech Stack:** Node.js, Express.js, Commander.js, axios

---

## 文件结构

```
github-stars-manager/
├── src/
│   ├── github.js       # GitHub API 封装
│   ├── store.js        # JSON 文件读写
│   ├── sync.js         # 同步逻辑
│   ├── cli.js          # CLI 入口
│   └── server.js       # Web 服务
├── public/
│   └── index.html      # Web UI
├── stars.json          # 数据存储
└── package.json
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "github-stars-manager",
  "version": "1.0.0",
  "description": "Manage GitHub Stars with CLI and Web UI",
  "main": "src/cli.js",
  "bin": {
    "github-stars": "src/cli.js"
  },
  "scripts": {
    "start": "node src/cli.js",
    "server": "node src/server.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "commander": "^12.0.0",
    "express": "^4.18.2"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `npm install`

- [ ] **Step 3: Commit**

```bash
git init
git add package.json
git commit -m "init: project structure and dependencies"
```

---

## Task 2: GitHub API 封装

**Files:**
- Create: `src/github.js`

- [ ] **Step 1: 创建 GitHub API 封装**

```javascript
const axios = require('axios');

const GITHUB_API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is not set');
  process.exit(1);
}

const client = axios.create({
  baseURL: GITHUB_API,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  }
});

async function getStarred() {
  const stars = [];
  let page = 1;
  while (true) {
    const response = await client.get('/user/starred', {
      params: { per_page: 100, page }
    });
    stars.push(...response.data);
    if (response.data.length < 100) break;
    page++;
  }
  return stars.map(repo => ({
    name: `${repo.owner.login}/${repo.name}`,
    description: repo.description || '',
    url: repo.html_url
  }));
}

async function unstar(owner, repo) {
  await client.delete(`/user/starred/${owner}/${repo}`);
}

module.exports = { getStarred, unstar };
```

- [ ] **Step 2: Commit**

```bash
git add src/github.js
git commit -m "feat: add GitHub API wrapper"
```

---

## Task 3: JSON 文件存储

**Files:**
- Create: `src/store.js`

- [ ] **Step 1: 创建存储模块**

```javascript
const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(process.cwd(), 'stars.json');

function loadStars() {
  if (!fs.existsSync(STORE_FILE)) return [];
  const data = fs.readFileSync(STORE_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveStars(stars) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(stars, null, 2));
}

function searchStars(keyword) {
  const stars = loadStars();
  if (!keyword) return stars;
  const lower = keyword.toLowerCase();
  return stars.filter(
    s => s.name.toLowerCase().includes(lower) || s.description.toLowerCase().includes(lower)
  );
}

function removeStar(name) {
  const stars = loadStars();
  const index = stars.findIndex(s => s.name === name);
  if (index === -1) return false;
  stars.splice(index, 1);
  saveStars(stars);
  return true;
}

function addStars(newStars) {
  const stars = loadStars();
  const nameSet = new Set(stars.map(s => s.name));
  for (const star of newStars) {
    if (!nameSet.has(star.name)) {
      stars.push(star);
    }
  }
  saveStars(stars);
}

module.exports = { loadStars, saveStars, searchStars, removeStar, addStars };
```

- [ ] **Step 2: Commit**

```bash
git add src/store.js
git commit -m "feat: add JSON store module"
```

---

## Task 4: 同步逻辑

**Files:**
- Create: `src/sync.js`

- [ ] **Step 1: 创建同步模块**

```javascript
const { getStarred } = require('./github');
const { addStars } = require('./store');

async function sync() {
  console.log('Fetching stars from GitHub...');
  const stars = await getStarred();
  console.log(`Found ${stars.length} stars`);
  addStars(stars);
  console.log('Stars synced successfully');
}

module.exports = { sync };
```

- [ ] **Step 2: Commit**

```bash
git add src/sync.js
git commit -m "feat: add sync module"
```

---

## Task 5: CLI 入口

**Files:**
- Create: `src/cli.js`

- [ ] **Step 1: 创建 CLI 入口**

```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const { sync } = require('./sync');
const { searchStars, removeStar } = require('./store');
const { unstar } = require('./github');

const program = new Command();

program
  .name('github-stars')
  .description('Manage GitHub Stars');

program
  .command('sync')
  .description('Sync all GitHub Stars to local')
  .action(async () => {
    try {
      await sync();
    } catch (error) {
      console.error('Sync failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('search <keyword>')
  .description('Search stars by keyword')
  .action((keyword) => {
    const stars = searchStars(keyword);
    if (stars.length === 0) {
      console.log('No stars found');
      return;
    }
    stars.forEach(s => {
      console.log(`${s.name}`);
      console.log(`  ${s.description}`);
      console.log(`  ${s.url}`);
      console.log();
    });
  });

program
  .command('unstar <owner/repo>')
  .description('Unstar a repository')
  .action(async (name) => {
    try {
      const [owner, repo] = name.split('/');
      await unstar(owner, repo);
      removeStar(name);
      console.log(`Unstarred ${name}`);
    } catch (error) {
      console.error('Unstar failed:', error.message);
      process.exit(1);
    }
  });

program.parse();
```

- [ ] **Step 2: 设置可执行权限**

Run: `chmod +x src/cli.js` (Windows 可跳过)

- [ ] **Step 3: Commit**

```bash
git add src/cli.js
git commit -m "feat: add CLI commands"
```

---

## Task 6: Web 服务

**Files:**
- Create: `src/server.js`
- Create: `public/index.html`

- [ ] **Step 1: 创建 Web 服务**

```javascript
const express = require('express');
const path = require('path');
const { searchStars, removeStar } = require('./store');
const { unstar } = require('./github');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/stars', (req, res) => {
  const keyword = req.query.q || '';
  const stars = searchStars(keyword);
  res.json(stars);
});

app.delete('/api/stars/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const [owner, repo] = name.split('/');
    await unstar(owner, repo);
    removeStar(name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

- [ ] **Step 2: 创建 Web UI**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Stars Manager</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #333; }
    input { width: 100%; padding: 10px; font-size: 16px; margin-bottom: 20px; }
    .star { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
    .star h3 { margin: 0 0 5px; }
    .star h3 a { color: #0366d6; text-decoration: none; }
    .star p { margin: 5px 0; color: #666; }
    .star button { background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; }
    .star button:hover { background: #c82333; }
  </style>
</head>
<body>
  <h1>GitHub Stars</h1>
  <input type="text" id="search" placeholder="Search stars...">
  <div id="stars"></div>
  <script>
    async function loadStars() {
      const q = document.getElementById('search').value;
      const res = await fetch('/api/stars?q=' + encodeURIComponent(q));
      const stars = await res.json();
      const container = document.getElementById('stars');
      container.innerHTML = stars.map(s => `
        <div class="star">
          <h3><a href="${s.url}" target="_blank">${s.name}</a></h3>
          <p>${s.description || 'No description'}</p>
          <button onclick="unstar('${s.name}')">Unstar</button>
        </div>
      `).join('');
    }
    async function unstar(name) {
      if (!confirm('Unstar ' + name + '?')) return;
      await fetch('/api/stars/' + encodeURIComponent(name), { method: 'DELETE' });
      loadStars();
    }
    document.getElementById('search').addEventListener('input', loadStars);
    loadStars();
  </script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add src/server.js public/index.html
git commit -m "feat: add web server and UI"
```

---

## Task 7: 初始化 stars.json

**Files:**
- Create: `stars.json`

- [ ] **Step 1: 创建空的 stars.json**

```json
[]
```

- [ ] **Step 2: Commit**

```bash
git add stars.json
git commit -m "feat: add empty stars data file"
```

---

## Task 8: 创建 README

**Files:**
- Create: `README.md`

- [ ] **Step 1: 创建 README**

```markdown
# GitHub Stars Manager

Sync and manage your GitHub Stars with CLI and Web UI.

## Setup

```bash
export GITHUB_TOKEN=your_github_token
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## 实现顺序

1. Task 1: 项目初始化
2. Task 2: GitHub API 封装
3. Task 3: JSON 文件存储
4. Task 4: 同步逻辑
5. Task 5: CLI 入口
6. Task 6: Web 服务
7. Task 7: 初始化 stars.json
8. Task 8: 创建 README
