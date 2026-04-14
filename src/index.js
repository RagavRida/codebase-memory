#!/usr/bin/env node

import { Command } from 'commander';
import { analyze } from './commands/analyze.js';
import { update } from './commands/update.js';
import { restore } from './commands/restore.js';
import { setup, teardown } from './commands/setup.js';

const program = new Command();

program
  .name('codebase-memory')
  .description('Give your AI coding assistant a permanent memory of your codebase. Works with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Aider, and Roo Code.')
  .version('1.1.0');

program
  .command('analyze')
  .alias('a')
  .description('Full deep scan — analyzes the codebase and writes all memory files')
  .argument('[directory]', 'Target directory to analyze', '.')
  .action((directory) => analyze(directory));

program
  .command('update')
  .alias('u')
  .description('Incremental update — detects changes since last analysis and appends to memory')
  .argument('[directory]', 'Target directory to update', '.')
  .action((directory) => update(directory));

program
  .command('restore')
  .alias('r')
  .description('Session start — reads memory files and prints project summary')
  .argument('[directory]', 'Target directory to restore context for', '.')
  .action((directory) => restore(directory));

program
  .command('setup')
  .alias('s')
  .description('One-time setup — installs global Claude Code hooks for full automation')
  .action(() => setup());

program
  .command('teardown')
  .description('Remove all global hooks installed by setup')
  .action(() => teardown());

program.parse();
