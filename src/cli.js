#!/usr/bin/env node

const { loadEnv, PACKAGE_ENV_FILE, STORE_FILE, setToken } = require('./config');
loadEnv();
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
  .option('-f, --force', 'Force overwrite local stars with remote data')
  .action(async (options) => {
    try {
      await sync(options);
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
        console.log(`${s.full_name}`);
        console.log(`  ID: ${s.id}`);
        console.log(`  ${s.description || 'No description'}`);
        console.log(`  Language: ${s.language || 'N/A'}`);
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
  .action(async (fullName) => {
    try {
      const [owner, repo] = fullName.split('/');
      if (!owner || !repo) {
        console.error('Invalid format. Use owner/repo (e.g., facebook/react)');
        process.exit(1);
      }
      await unstar(owner, repo);
      await removeStar(fullName);
      console.log(`Unstarred ${fullName}`);
    } catch (error) {
      console.error('Unstar failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Manage CLI configuration in package installation directory')
  .option('--set-token <token>', 'Set GitHub Personal Access Token in package .env')
  .option('--path', 'Print the path of the package configuration and data files')
  .option('--show', 'Show current configuration status')
  .action((options) => {
    if (options.setToken) {
      setToken(options.setToken);
      console.log('GitHub token successfully saved to package configuration.');
      return;
    }

    if (options.path) {
      console.log('Package .env path:', PACKAGE_ENV_FILE);
      console.log('Package data file:', STORE_FILE);
      return;
    }

    if (options.show) {
      const token = process.env.GITHUB_TOKEN;
      console.log('Package .env path:', PACKAGE_ENV_FILE);
      console.log('Package data file:', STORE_FILE);
      if (token) {
        const masked = token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : '****';
        console.log(`GitHub Token: Configured (${masked})`);
      } else {
        console.log('GitHub Token: Not configured');
      }
      return;
    }

    console.log('Package .env path:', PACKAGE_ENV_FILE);
    console.log('Package data file:', STORE_FILE);
    console.log('\nUsage:');
    console.log('  github-stars config --set-token <token>');
    console.log('  github-stars config --path');
    console.log('  github-stars config --show');
  });

program.parse();
