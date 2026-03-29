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
