const { Octokit } = require('@octokit/core');

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }
  return new Octokit({ auth: token });
}

const PER_PAGE_LIMIT = 100;

async function getStarred() {
  const octokit = getOctokit();
  const stars = [];
  let page = 1;
  while (true) {
    try {
      const timeLabel = `GET /user/starred ${page}`;
      console.time(timeLabel);
      const response = await octokit.request('GET /user/starred', {
        per_page: PER_PAGE_LIMIT,
        page,
        headers: {
          'X-GitHub-Api-Version': '2026-03-10',
        },
      });
      console.timeEnd(timeLabel);
      stars.push(...response.data);
      if (response.data.length < PER_PAGE_LIMIT) break;
      page++;
    } catch (error) {
      throw new Error(`Failed to fetch stars: ${error.message}`);
    }
  }
  return stars.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    owner: repo.owner?.login || null,
    description: repo.description,
    url: repo.html_url,
    git_url: repo.git_url,
    ssh_url: repo.ssh_url,
    homepage: repo.homepage,
    language: repo.language,
    archived: repo.archived,
    disabled: repo.disabled,
    license: repo.license?.name || null,
    topics: repo.topics,
    visibility: repo.visibility,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
  }));
}

async function unstar(owner, repo) {
  const octokit = getOctokit();
  try {
    await octokit.request('DELETE /user/starred/{owner}/{repo}', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2026-03-10',
      },
    });
  } catch (error) {
    if (error.status === 404 || error.response?.status === 404) {
      throw new Error(`Repository ${owner}/${repo} is not starred`);
    }
    throw new Error(`Failed to unstar ${owner}/${repo}: ${error.message}`);
  }
}

module.exports = { getStarred, unstar };
