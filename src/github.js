const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

const client = axios.create({
  baseURL: GITHUB_API,
  timeout: 30000,
  headers: {
    Accept: 'application/vnd.github.v3+json'
  }
});

function authHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }
  return { Authorization: `Bearer ${token}` };
}

async function getStarred() {
  const stars = [];
  let page = 1;
  while (true) {
    try {
      const response = await client.get('/user/starred', {
        headers: authHeaders(),
        params: { per_page: 100, page }
      });
      stars.push(...response.data);
      if (response.data.length < 100) break;
      page++;
    } catch (error) {
      throw new Error(`Failed to fetch stars: ${error.message}`);
    }
  }
  return stars.map(repo => ({
    id: repo.id,
    full_name: repo.full_name,
    description: repo.description || '',
    url: repo.html_url,
    language: repo.language || ''
  }));
}

async function unstar(owner, repo) {
  try {
    await client.delete(`/user/starred/${owner}/${repo}`, {
      headers: authHeaders()
    });
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Repository ${owner}/${repo} is not starred`);
    }
    throw new Error(`Failed to unstar ${owner}/${repo}: ${error.message}`);
  }
}

module.exports = { getStarred, unstar };
