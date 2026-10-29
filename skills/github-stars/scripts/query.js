#!/usr/bin/env node
// Structured, JSON-output queries over the github-stars-manager local cache (stars.json).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function parseArgs(argv) {
  const opts = { keyword: [], any: [], topic: [], limit: 50, stats: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) fail(`Missing value for ${a}`);
      return argv[++i];
    };
    const nextBool = () => {
      if (i + 1 < argv.length && (argv[i + 1] === 'true' || argv[i + 1] === 'false')) {
        return argv[++i] === 'true';
      }
      return true;
    };
    const nextDate = () => {
      const raw = next();
      const ts = Date.parse(raw);
      if (Number.isNaN(ts)) fail(`Invalid date for ${a}: ${raw}`);
      return ts;
    };
    switch (a) {
      case '--file': opts.file = next(); break;
      case '--keyword': opts.keyword.push(next().toLowerCase()); break;
      case '--any': opts.any.push(next().toLowerCase()); break;
      case '--topic': opts.topic.push(next().toLowerCase()); break;
      case '--language': opts.language = next().toLowerCase(); break;
      case '--owner': opts.owner = next().toLowerCase(); break;
      case '--license': opts.license = next().toLowerCase(); break;
      case '--visibility': opts.visibility = next().toLowerCase(); break;
      case '--archived': opts.archived = nextBool(); break;
      case '--no-archived': opts.archived = false; break;
      case '--disabled': opts.disabled = nextBool(); break;
      case '--no-disabled': opts.disabled = false; break;
      case '--private': opts.private = nextBool(); break;
      case '--no-private': opts.private = false; break;
      case '--updated-after': opts.updatedAfter = nextDate(); break;
      case '--updated-before': opts.updatedBefore = nextDate(); break;
      case '--created-after': opts.createdAfter = nextDate(); break;
      case '--created-before': opts.createdBefore = nextDate(); break;
      case '--pushed-after': opts.pushedAfter = nextDate(); break;
      case '--pushed-before': opts.pushedBefore = nextDate(); break;
      case '--sort': opts.sort = next().toLowerCase(); break;
      case '--limit': opts.limit = parseInt(next(), 10); break;
      case '--stats': opts.stats = true; break;
      case '-h': case '--help':
        console.log([
          'Usage: query.js [--file f] [filters] [--sort field[:asc|desc]] [--stats] [--limit n]',
          'Filters:',
          '  --keyword <k>          Substring in full_name/description/topics/homepage (repeatable; AND)',
          '  --any <k>              Substring in full_name/description/topics/homepage (repeatable; OR)',
          '  --topic <t>            Exact topic match, case-insensitive (repeatable; AND)',
          '  --language <l>         Exact language match, case-insensitive ("none" = no language)',
          '  --owner <o>            Exact owner login match, case-insensitive',
          '  --license <lic>        Substring match on license name, case-insensitive ("none" = no license)',
          '  --visibility <v>       Exact visibility match (e.g. public, private)',
          '  --archived [bool]      Filter by archived status (or --no-archived)',
          '  --disabled [bool]      Filter by disabled status (or --no-disabled)',
          '  --private [bool]       Filter by private status (or --no-private)',
          '  --updated-after <iso>  Updated on/after date (e.g. 2025-01-01)',
          '  --updated-before <iso> Updated on/before date',
          '  --created-after <iso>  Created on/after date',
          '  --created-before <iso> Created on/before date',
          '  --pushed-after <iso>   Pushed on/after date',
          '  --pushed-before <iso>  Pushed on/before date',
          'Options:',
          '  --sort <key>           Sort by updated, created, pushed, or name (append :asc or :desc)',
          '  --stats                Output summary counts instead of records',
          '  --limit <n>            Max records to return (default 50; 0 = unlimited)'
        ].join('\n'));
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

  const rawOwner = s => (typeof s.owner === 'string' ? s.owner : s.owner?.login) || (s.full_name ? s.full_name.split('/')[0] : '');
  const getOwner = s => rawOwner(s).toLowerCase();
  const rawLicense = s => (typeof s.license === 'string' ? s.license : s.license?.name) || '';
  const text = s => [
    s.full_name || '',
    s.description || '',
    Array.isArray(s.topics) ? s.topics.join(' ') : '',
    s.homepage || ''
  ].join(' ').toLowerCase();

  const filtered = stars.filter(s => {
    if (opts.keyword.length || opts.any.length) {
      const t = text(s);
      if (opts.keyword.length && !opts.keyword.every(k => t.includes(k))) return false;
      if (opts.any.length && !opts.any.some(k => t.includes(k))) return false;
    }
    if (opts.topic.length) {
      const topics = Array.isArray(s.topics) ? s.topics.map(x => String(x).toLowerCase()) : [];
      if (!opts.topic.every(t => topics.includes(t))) return false;
    }
    if (opts.language !== undefined) {
      const lang = (s.language || '').toLowerCase();
      if (opts.language === 'none' ? lang !== '' : lang !== opts.language) return false;
    }
    if (opts.owner !== undefined && getOwner(s) !== opts.owner) return false;
    if (opts.license !== undefined) {
      const lic = rawLicense(s).toLowerCase();
      if (opts.license === 'none' ? lic !== '' : !lic.includes(opts.license)) return false;
    }
    if (opts.visibility !== undefined && (s.visibility || '').toLowerCase() !== opts.visibility) return false;
    if (opts.archived !== undefined && Boolean(s.archived) !== opts.archived) return false;
    if (opts.disabled !== undefined && Boolean(s.disabled) !== opts.disabled) return false;
    if (opts.private !== undefined && Boolean(s.private) !== opts.private) return false;
    if (opts.updatedAfter !== undefined || opts.updatedBefore !== undefined) {
      const ts = s.updated_at ? Date.parse(s.updated_at) : NaN;
      if (Number.isNaN(ts)) return false;
      if (opts.updatedAfter !== undefined && ts < opts.updatedAfter) return false;
      if (opts.updatedBefore !== undefined && ts > opts.updatedBefore) return false;
    }
    if (opts.createdAfter !== undefined || opts.createdBefore !== undefined) {
      const ts = s.created_at ? Date.parse(s.created_at) : NaN;
      if (Number.isNaN(ts)) return false;
      if (opts.createdAfter !== undefined && ts < opts.createdAfter) return false;
      if (opts.createdBefore !== undefined && ts > opts.createdBefore) return false;
    }
    if (opts.pushedAfter !== undefined || opts.pushedBefore !== undefined) {
      const ts = s.pushed_at ? Date.parse(s.pushed_at) : NaN;
      if (Number.isNaN(ts)) return false;
      if (opts.pushedAfter !== undefined && ts < opts.pushedAfter) return false;
      if (opts.pushedBefore !== undefined && ts > opts.pushedBefore) return false;
    }
    return true;
  });

  if (opts.sort) {
    const [rawKey, rawDir] = opts.sort.split(':');
    const dir = rawDir === 'asc' ? 1 : rawDir === 'desc' ? -1 : (rawKey === 'name' || rawKey === 'full_name' ? 1 : -1);
    filtered.sort((a, b) => {
      if (rawKey === 'updated' || rawKey === 'updated_at') {
        return ((Date.parse(a.updated_at) || 0) - (Date.parse(b.updated_at) || 0)) * dir;
      }
      if (rawKey === 'created' || rawKey === 'created_at') {
        return ((Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0)) * dir;
      }
      if (rawKey === 'pushed' || rawKey === 'pushed_at') {
        return ((Date.parse(a.pushed_at) || 0) - (Date.parse(b.pushed_at) || 0)) * dir;
      }
      if (rawKey === 'name' || rawKey === 'full_name') {
        return String(a.full_name || '').localeCompare(String(b.full_name || '')) * dir;
      }
      fail(`Unknown --sort key: ${rawKey} (expected updated, created, pushed, or name)`);
    });
  }

  if (opts.stats) {
    const byLang = {};
    const byOwner = {};
    const byTopic = {};
    const byLicense = {};
    let archivedCount = 0;
    let disabledCount = 0;
    let privateCount = 0;
    for (const s of filtered) {
      const l = s.language || '(none)';
      byLang[l] = (byLang[l] || 0) + 1;
      const o = rawOwner(s) || '(unknown)';
      byOwner[o] = (byOwner[o] || 0) + 1;
      const lic = rawLicense(s) || '(none)';
      byLicense[lic] = (byLicense[lic] || 0) + 1;
      if (Array.isArray(s.topics)) {
        for (const t of s.topics) {
          byTopic[t] = (byTopic[t] || 0) + 1;
        }
      }
      if (s.archived) archivedCount++;
      if (s.disabled) disabledCount++;
      if (s.private) privateCount++;
    }
    const sortDesc = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
    console.log(JSON.stringify({
      file,
      total: stars.length,
      matched: filtered.length,
      archived: archivedCount,
      disabled: disabledCount,
      private: privateCount,
      languages: Object.fromEntries(sortDesc(byLang)),
      licenses: Object.fromEntries(sortDesc(byLicense)),
      top_topics: Object.fromEntries(sortDesc(byTopic).slice(0, 30)),
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

