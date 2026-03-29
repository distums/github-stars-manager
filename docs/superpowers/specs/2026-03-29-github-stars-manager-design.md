# GitHub Stars Manager - 设计文档

## 概述

一个 Node.js 应用，用于同步和管理 GitHub Stars，支持 CLI 和 Web UI 两种交互方式。

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js (Web 服务) + Commander.js (CLI)
- **存储**: JSON 文件 (`stars.json`)
- **认证**: GitHub Personal Access Token (环境变量 `GITHUB_TOKEN`)

## 项目结构

```
github-stars-manager/
├── src/
│   ├── cli.js          # CLI 入口
│   ├── server.js       # Web 服务
│   ├── sync.js         # GitHub Stars 同步逻辑
│   ├── store.js        # JSON 文件读写
│   └── github.js       # GitHub API 封装
├── stars.json          # 本地存储
├── package.json
└── README.md
```

## 功能详情

### CLI 命令

| 命令 | 功能 |
|------|------|
| `sync` | 同步所有 GitHub Stars 到本地 |
| `unstar <owner/repo>` | 取消 star 某个项目 |
| `search <keyword>` | 搜索 stars |
| `server` | 启动 Web UI (默认 3000 端口) |

### Web UI

- 列表展示所有 stars
- 支持关键词搜索（搜索名称和描述）
- 每项显示名称、描述、URL
- 支持直接取消 star

## 数据格式

`stars.json` 文件格式：

```json
[
  {
    "name": "owner/repo",
    "description": "项目描述",
    "url": "https://github.com/owner/repo"
  }
]
```

## GitHub API 使用

- `GET /user/starred` - 获取 starred 列表，分页处理（每页 100 条）
- `DELETE /user/starred/:owner/:repo` - 取消 star

认证通过 `Authorization: Bearer {token}` header 传递。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `GITHUB_TOKEN` | 是 | GitHub Personal Access Token |

## 错误处理

- Token 未设置：提示用户设置环境变量
- 网络错误：打印错误信息并退出
- 取消 star 失败：提示具体错误
