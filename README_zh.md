# GitHub Stars Manager

通过 **Agent Skill** 和 **CLI** 轻松同步、搜索和管理你的 GitHub Stars。

## 安装为 Agent Skill

```bash
npx skills add distums/github-stars-manager
```

## 环境配置

### 1. 生成 GitHub Token

1. 前往 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 按需设置过期时间
4. 根据需求选择权限范围（Scope）：

| 权限范围 (Scope) | 适用场景 |
|-------|---------------|
| `repo` (私有仓库的完全控制权) | 如果你的 Star 中包含**私有仓库**，则需要勾选此项 |
| `public_repo` (访问公开仓库) | 如果你的 Star 中只有**公开仓库**，勾选此项即可 |

5. 点击 "Generate token" 并复制生成的 Token

**注意：** 如果你只 Star 公开仓库，仅勾选 `public_repo` 即可。如果有任何已 Star 的私有仓库，则需要 `repo` 权限。

### 2. 配置与安装

```bash
cp .env.example .env
# 编辑 .env 文件并填入你的 GITHUB_TOKEN
npm install
```

## CLI 命令

```bash
# 配置 GitHub token（直接保存在包目录中）
npm start config -- --set-token ghp_xxxxxx
# 或查看当前配置路径和状态
npm start config -- --show

# 从 GitHub 同步所有 Stars
npm start sync

# 强制同步并覆盖本地 Stars 数据
npm start sync -- -f

# 按关键词搜索 Stars
npm start search keyword

# 取消 Star 指定仓库
npm start unstar owner/repo
```

## Web UI

```bash
npm run server
```

然后在浏览器中打开 http://localhost:3000

## 数据存储

Stars 数据保存在本地的 `stars.json` 文件中，结构如下：

```json
{
  "id": 123456,
  "full_name": "owner/repo",
  "description": "Project description",
  "url": "https://github.com/owner/repo",
  "language": "JavaScript"
}
```

## 开源协议

[MIT](LICENSE)

