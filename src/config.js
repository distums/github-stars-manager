const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PACKAGE_ENV_FILE = path.join(PACKAGE_ROOT, '.env');
const CWD_ENV_FILE = path.resolve(process.cwd(), '.env');
const STORE_FILE = path.join(PACKAGE_ROOT, 'stars.json');

function loadEnv() {
  // 1. 如果当前工作目录存在 .env 则优先加载（用于本地开发或当前目录覆盖）
  if (fs.existsSync(CWD_ENV_FILE)) {
    dotenv.config({ path: CWD_ENV_FILE, quiet: true });
  }
  // 2. 加载包安装目录内的 .env（作为包级默认配置）
  if (CWD_ENV_FILE !== PACKAGE_ENV_FILE && fs.existsSync(PACKAGE_ENV_FILE)) {
    dotenv.config({ path: PACKAGE_ENV_FILE, quiet: true });
  }
}

function setToken(token) {
  let content = '';
  if (fs.existsSync(PACKAGE_ENV_FILE)) {
    content = fs.readFileSync(PACKAGE_ENV_FILE, 'utf-8');
    if (/^GITHUB_TOKEN=.*/m.test(content)) {
      content = content.replace(/^GITHUB_TOKEN=.*/m, `GITHUB_TOKEN=${token}`);
    } else {
      content = content.trimEnd() ? `${content.trimEnd()}\nGITHUB_TOKEN=${token}\n` : `GITHUB_TOKEN=${token}\n`;
    }
  } else {
    content = `GITHUB_TOKEN=${token}\n`;
  }
  fs.writeFileSync(PACKAGE_ENV_FILE, content, 'utf-8');
  process.env.GITHUB_TOKEN = token;
}

module.exports = {
  PACKAGE_ROOT,
  PACKAGE_ENV_FILE,
  CWD_ENV_FILE,
  STORE_FILE,
  loadEnv,
  setToken
};
