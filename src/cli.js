#!/usr/bin/env node

require('dotenv').config();
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
  .action(async (keyword) => {
    try {
      const stars = await searchStars(keyword);
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
    } catch (error) {
      console.error('Search failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('unstar <owner/repo>')
  .description('Unstar a repository')
  .action(async (name) => {
    try {
      const [owner, repo] = name.split('/');
      if (!owner || !repo) {
        console.error('Invalid format. Use owner/repo (e.g., facebook/react)');
        process.exit(1);
      }
      await unstar(owner, repo);
      await removeStar(name);
      console.log(`Unstarred ${name}`);
    } catch (error) {
      console.error('Unstar failed:', error.message);
      process.exit(1);
    }
  });

program.parse();
