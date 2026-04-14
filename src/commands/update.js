import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import {
  getFileTree,
  getTopLevelFolders,
  detectStack,
  detectRouteFiles,
  detectModelFiles,
  guessFolderPurpose,
  readFileSafe
} from '../utils/scanner.js';
import { writeFile, appendFile } from '../utils/writer.js';

export async function update(targetDir) {
  const rootDir = path.resolve(targetDir);
  const rulesDir = path.join(rootDir, '.claude', 'rules');

  // Check memory files exist
  if (!fs.existsSync(path.join(rootDir, 'CLAUDE.md'))) {
    console.error(chalk.red('\n  No CLAUDE.md found. Run `codebase-memory analyze` first.\n'));
    process.exit(1);
  }

  console.log(chalk.bold('\n  Codebase Memory — Incremental Update\n'));
  console.log(chalk.dim(`  Target: ${rootDir}\n`));

  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].substring(0, 5);
  const changes = [];

  // Scan current state
  const spinner = ora('Scanning for changes...').start();
  const files = await getFileTree(rootDir);
  const folders = getTopLevelFolders(rootDir);
  const stack = detectStack(rootDir);
  const routeFiles = detectRouteFiles(files);
  const modelFiles = detectModelFiles(files);
  spinner.succeed('Scan complete');

  // Compare modules
  const spinner2 = ora('Checking for new modules...').start();
  const existingModules = readFileSafe(path.join(rulesDir, 'modules.md')) || '';
  const newFolders = folders.filter(f => !existingModules.includes(`\`${f}/\``));

  if (newFolders.length > 0) {
    const newEntries = newFolders.map(f => {
      const folderFiles = files.filter(file => file.startsWith(f + '/'));
      const keyFiles = folderFiles.slice(0, 5);
      return `\n## ${f}
- **Location**: \`${f}/\`
- **Purpose**: ${guessFolderPurpose(f)}
- **Key files**:
${keyFiles.map(kf => `  - \`${kf}\``).join('\n') || '  - (empty)'}
- **File count**: ${folderFiles.length}
`;
    });

    appendFile(path.join(rulesDir, 'modules.md'), newEntries.join('\n'));
    changes.push(`Added ${newFolders.length} new module(s): ${newFolders.join(', ')}`);
  }
  spinner2.succeed(newFolders.length ? `${newFolders.length} new modules added` : 'No new modules');

  // Check for new route files
  const spinner3 = ora('Checking for new API routes...').start();
  const existingApi = readFileSafe(path.join(rulesDir, 'api.md')) || '';
  const newRoutes = routeFiles.filter(f => !existingApi.includes(f));

  if (newRoutes.length > 0) {
    const routeSection = '\n## New Routes (added ' + today + ')\n' +
      newRoutes.map(f => `- \`${f}\``).join('\n') + '\n';
    appendFile(path.join(rulesDir, 'api.md'), routeSection);
    changes.push(`Added ${newRoutes.length} new route file(s)`);
  }
  spinner3.succeed(newRoutes.length ? `${newRoutes.length} new route files added` : 'No new routes');

  // Check for new model files
  const spinner4 = ora('Checking for new models...').start();
  const existingModels = readFileSafe(path.join(rulesDir, 'models.md')) || '';
  const newModels = modelFiles.filter(f => !existingModels.includes(f));

  if (newModels.length > 0) {
    const modelSection = '\n## New Models (added ' + today + ')\n' +
      newModels.map(f => `- \`${f}\``).join('\n') + '\n';
    appendFile(path.join(rulesDir, 'models.md'), modelSection);
    changes.push(`Added ${newModels.length} new model file(s)`);
  }
  spinner4.succeed(newModels.length ? `${newModels.length} new model files added` : 'No new models');

  // Check for new scripts/commands
  const spinner5 = ora('Checking for new commands...').start();
  const existingStack = readFileSafe(path.join(rulesDir, 'stack.md')) || '';
  const newScripts = Object.entries(stack.scripts).filter(([name]) => !existingStack.includes(name));

  if (newScripts.length > 0) {
    const scriptSection = '\n## New Commands (added ' + today + ')\n' +
      '| Command | What it does |\n|---------|-------------|\n' +
      newScripts.map(([name, cmd]) => `| \`${stack.packageManager || 'npm'} run ${name}\` | ${cmd} |`).join('\n') + '\n';
    appendFile(path.join(rulesDir, 'stack.md'), scriptSection);
    changes.push(`Added ${newScripts.length} new command(s)`);
  }
  spinner5.succeed(newScripts.length ? `${newScripts.length} new commands added` : 'No new commands');

  // Check git for recent changes
  let gitSummary = '';
  try {
    const diffStat = execSync('git diff --stat HEAD~5 2>/dev/null || true', { cwd: rootDir, encoding: 'utf-8' }).trim();
    const recentCommits = execSync('git log --oneline -5 2>/dev/null || true', { cwd: rootDir, encoding: 'utf-8' }).trim();
    if (diffStat || recentCommits) {
      gitSummary = '\n### Git activity\n';
      if (recentCommits) gitSummary += '```\n' + recentCommits + '\n```\n';
      if (diffStat) gitSummary += '```\n' + diffStat + '\n```\n';
    }
  } catch {
    // Not a git repo, skip
  }

  // Update changelog
  const changelogEntry = `\n## ${today} — Session update (${time})
${changes.length ? changes.map(c => `- ${c}`).join('\n') : '- No structural changes detected'}
${gitSummary}`;

  appendFile(path.join(rulesDir, 'changelog.md'), changelogEntry);

  // Update CLAUDE.md timestamp
  const claudeMd = readFileSafe(path.join(rootDir, 'CLAUDE.md'));
  if (claudeMd) {
    const updated = claudeMd.replace(
      /> Last analyzed: .*/,
      `> Last analyzed: ${today} (updated)`
    );
    writeFile(path.join(rootDir, 'CLAUDE.md'), updated);
  }

  // Summary
  console.log(chalk.green(`\n  Memory updated — ${changes.length} change(s) recorded.\n`));
  if (changes.length) {
    for (const c of changes) {
      console.log(chalk.dim(`    ${c}`));
    }
    console.log('');
  }
  console.log(chalk.dim('  Changelog updated at .claude/rules/changelog.md\n'));
}
