import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { readFileSafe } from '../utils/scanner.js';

export async function restore(targetDir) {
  const rootDir = path.resolve(targetDir);
  const rulesDir = path.join(rootDir, '.claude', 'rules');

  // Check memory files exist
  if (!fs.existsSync(path.join(rootDir, 'CLAUDE.md'))) {
    console.error(chalk.red('\n  No CLAUDE.md found. Run `codebase-memory analyze` first.\n'));
    process.exit(1);
  }

  console.log(chalk.bold('\n  Codebase Memory — Context Restore\n'));

  // Read all memory files
  const claudeMd = readFileSafe(path.join(rootDir, 'CLAUDE.md'));
  const architecture = readFileSafe(path.join(rulesDir, 'architecture.md'));
  const stack = readFileSafe(path.join(rulesDir, 'stack.md'));
  const modules = readFileSafe(path.join(rulesDir, 'modules.md'));
  const models = readFileSafe(path.join(rulesDir, 'models.md'));
  const api = readFileSafe(path.join(rulesDir, 'api.md'));
  const conventions = readFileSafe(path.join(rulesDir, 'conventions.md'));
  const gotchas = readFileSafe(path.join(rulesDir, 'gotchas.md'));
  const changelog = readFileSafe(path.join(rulesDir, 'changelog.md'));

  // Extract project info from CLAUDE.md
  const projectName = claudeMd?.match(/^# (.+?) — Claude Memory/m)?.[1] || 'Unknown project';
  const description = claudeMd?.match(/## What this project is\n(.+)/m)?.[1] || '';
  const stackLine = claudeMd?.match(/\*\*Stack\*\*: (.+)/)?.[1] || 'Unknown';

  // Get last changelog entry
  const changelogLines = changelog?.split('\n') || [];
  const lastEntry = changelogLines.filter(l => l.startsWith('## ')).pop() || 'No changelog entries';

  // Count modules
  const moduleCount = (modules?.match(/^## /gm) || []).length;

  // Count files mentioned
  const filesMentioned = new Set();
  const allContent = [architecture, stack, modules, models, api, conventions, gotchas].join('\n');
  const fileMatches = allContent.match(/`[^`]+\.[a-z]+`/g) || [];
  fileMatches.forEach(f => filesMentioned.add(f));

  // Print summary
  console.log(chalk.green(`  ${projectName}: ${description}`));
  console.log(chalk.dim(`  Stack: ${stackLine}`));
  console.log(chalk.dim(`  Modules: ${moduleCount} | Files referenced: ${filesMentioned.size}`));
  console.log(chalk.dim(`  Last activity: ${lastEntry.replace('## ', '')}`));
  console.log('');

  // Print memory file status
  const memoryFiles = [
    { name: 'CLAUDE.md', content: claudeMd },
    { name: 'architecture.md', content: architecture },
    { name: 'stack.md', content: stack },
    { name: 'modules.md', content: modules },
    { name: 'models.md', content: models },
    { name: 'api.md', content: api },
    { name: 'conventions.md', content: conventions },
    { name: 'gotchas.md', content: gotchas },
    { name: 'changelog.md', content: changelog },
  ];

  console.log(chalk.dim('  Memory files:'));
  for (const mf of memoryFiles) {
    const status = mf.content ? chalk.green('OK') : chalk.red('MISSING');
    const size = mf.content ? `${(mf.content.length / 1024).toFixed(1)}KB` : '';
    console.log(chalk.dim(`    ${status} ${mf.name} ${size}`));
  }

  console.log(chalk.green('\n  Context restored. Memory files are loaded — no need to re-read source files.\n'));
}
