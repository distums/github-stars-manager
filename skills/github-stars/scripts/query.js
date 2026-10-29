#!/usr/bin/env node
// Structured, JSON-output queries over the github-stars-manager local cache (stars.json).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function parseArgs(argv) {
  const opts = { keyword: [], any: [], limit: 50, stats: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) fail(`Missing value for ${a}`);
      return argv[++i];
    };
    switch (a) {
      case '--file': opts.file = next(); break;
      case '--keyword': opts.keyword.push(next().toLowerCase()); break;
      case '--any': opts.any.push(next().toLowerCase()); break;
      case '--language': opts.language = next().toLowerCase(); break;
      case '--owner': opts.owner = next().toLowerCase(); break;
      case '--limit': opts.limit = parseInt(next(), 10); break;
      case '--stats': opts.stats = true; break;
      case '-h': case '--help':
        console.log('Usage: query.js [--file f] [--keyword k]... [--any k]... [--language l] [--owner o] [--stats] [--limit n]');
        process.exit(0);
      default: fail(`Unknown argument: ${a}`);
    }
  }
  if (Number.isNaN(opts.limit) || opts.limit < 0) fail('--limit must be a non-negative integer');
  return opts;
}

function fail(msg) {
  console.error(JSON.stringify({ error: msg }));
  process.exit(1);
}

function locateStore(explicit) {
  if (explicit) return path.resolve(explicit);
  // Same resolution order as the skill: global `github-stars`, then `npx github-stars-manager`.
  const candidates = [
    ['github-stars', ['config', '--path']],
    ['npx', ['-y', 'github-stars-manager', 'config', '--path']]
  ];
  for (const [cmd, args] of candidates) {
    try {
      const out = execFileSync(cmd, args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      const m = out.match(/Package data file:\s*(.+)/);
      if (m) return m[1].trim();
    } catch (_) { /* try next */ }
  }
  fail('Could not locate stars.json: neither `github-stars` nor `npx github-stars-manager` is available. Pass --file explicitly.');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const file = locateStore(opts.file);
  if (!fs.existsSync(file)) fail(`stars.json not found at ${file}. Run "github-stars sync" first or pass --file.`);

  let stars;
  try {
    stars = JSON.parse(fs.readFileSync(file, 'utf-8') || '[]');
  } catch (e) {
    fail(`Failed to parse ${file}: ${e.message}`);
  }

  const text = s => `${s.full_name} ${s.description || ''}`.toLowerCase();
  const filtered = stars.filter(s => {
    const t = text(s);
    if (opts.keyword.length && !opts.keyword.every(k => t.includes(k))) return false;
    if (opts.any.length && !opts.any.some(k => t.includes(k))) return false;
    if (opts.language !== undefined) {
      const lang = (s.language || '').toLowerCase();
      if (opts.language === 'none' ? lang !== '' : lang !== opts.language) return false;
    }
    if (opts.owner !== undefined && s.full_name.split('/')[0].toLowerCase() !== opts.owner) return false;
    return true;
  });

  if (opts.stats) {
    const byLang = {};
    const byOwner = {};
    for (const s of filtered) {
      const l = s.language || '(none)';
      byLang[l] = (byLang[l] || 0) + 1;
      const o = s.full_name.split('/')[0];
      byOwner[o] = (byOwner[o] || 0) + 1;
    }
    const sortDesc = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
    console.log(JSON.stringify({
      file,
      total: stars.length,
      matched: filtered.length,
      languages: Object.fromEntries(sortDesc(byLang)),
      top_owners: Object.fromEntries(sortDesc(byOwner).filter(([, n]) => n > 1).slice(0, 20))
    }, null, 2));
    return;
  }

  const results = opts.limit === 0 ? filtered : filtered.slice(0, opts.limit);
  console.log(JSON.stringify({
    file,
    total: stars.length,
    matched: filtered.length,
    returned: results.length,
    results
  }, null, 2));
}

main();

