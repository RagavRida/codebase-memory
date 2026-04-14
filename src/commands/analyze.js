import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import {
  getFileTree,
  getTopLevelFolders,
  detectStack,
  detectEntryPoints,
  detectRouteFiles,
  detectModelFiles,
  categorizeFiles,
  guessFolderPurpose,
  readJsonSafe,
  readFileSafe
} from '../utils/scanner.js';
import { writeFile, makeExecutable, mergeSettings } from '../utils/writer.js';
import {
  claudeMdTemplate,
  changelogTemplate,
  trackChangesHook,
  sessionEndHook,
  hooksSettings
} from '../templates/rules.js';

export async function analyze(targetDir) {
  const rootDir = path.resolve(targetDir);

  if (!fs.existsSync(rootDir)) {
    console.error(chalk.red(`Directory not found: ${rootDir}`));
    process.exit(1);
  }

  console.log(chalk.bold('\n  Codebase Memory — Full Analysis\n'));
  console.log(chalk.dim(`  Target: ${rootDir}\n`));

  // Step 1: Explore repo structure
  const spinner = ora('Scanning file tree...').start();
  const files = await getFileTree(rootDir);
  spinner.succeed(`Found ${files.length} files`);

  const spinner2 = ora('Detecting project stack...').start();
  const folders = getTopLevelFolders(rootDir);
  const stack = detectStack(rootDir);
  const entryPoints = detectEntryPoints(rootDir, files);
  const routeFiles = detectRouteFiles(files);
  const modelFiles = detectModelFiles(files);
  const fileCategories = categorizeFiles(files);
  spinner2.succeed('Stack detected');

  // Step 2: Read deeper context
  const spinner3 = ora('Gathering deeper context...').start();
  const pkg = readJsonSafe(path.join(rootDir, 'package.json'));
  const readme = readFileSafe(path.join(rootDir, 'README.md'));
  const envExample = readFileSafe(path.join(rootDir, '.env.example'));
  const dockerCompose = readFileSafe(path.join(rootDir, 'docker-compose.yml'))
    || readFileSafe(path.join(rootDir, 'docker-compose.yaml'));
  const dockerfile = readFileSafe(path.join(rootDir, 'Dockerfile'));
  const prismaSchema = readFileSafe(path.join(rootDir, 'prisma', 'schema.prisma'));
  spinner3.succeed('Context gathered');

  // Step 3: Build content for each rules file
  const spinner4 = ora('Writing memory files...').start();
  const today = new Date().toISOString().split('T')[0];
  const rulesDir = path.join(rootDir, '.claude', 'rules');
  const hooksDir = path.join(rootDir, '.claude', 'hooks');

  // Derive project info
  const projectName = pkg?.name || path.basename(rootDir);
  const description = pkg?.description || readme?.split('\n').slice(0, 3).join(' ').substring(0, 200) || 'Project analyzed by codebase-memory';
  const stackSummary = [
    ...stack.languages,
    ...stack.frameworks.map(f => f.name)
  ].filter((v, i, a) => a.indexOf(v) === i).join(' + ') || 'Unknown';

  // --- architecture.md ---
  const folderMap = folders.map(f => `- \`${f}/\` — ${guessFolderPurpose(f)}`).join('\n');
  const entryPointsList = entryPoints.length
    ? entryPoints.map(e => `- \`${e}\``).join('\n')
    : '- No standard entry points detected — check manually';

  const dataFlow = routeFiles.length
    ? `1. Request hits entry point\n2. Routed through middleware\n3. Handled by route files in: ${[...new Set(routeFiles.map(f => path.dirname(f)))].join(', ')}\n4. Returns response`
    : '- Data flow not auto-detected — fill in manually';

  const externalDeps = [];
  if (dockerCompose) externalDeps.push('- Docker Compose services detected (see docker-compose.yml)');
  if (envExample) {
    const envVars = envExample.match(/^[A-Z_]+=.*/gm);
    if (envVars) {
      for (const v of envVars.slice(0, 10)) {
        const name = v.split('=')[0];
        externalDeps.push(`- \`${name}\` — environment variable`);
      }
    }
  }

  writeFile(path.join(rulesDir, 'architecture.md'), `# Architecture

## Folder Map
${folderMap || '- No folders detected'}

## Entry Points
${entryPointsList}

## Data Flow
${dataFlow}

## External Dependencies
${externalDeps.length ? externalDeps.join('\n') : '- None detected — fill in manually'}

## Deployment
${dockerfile ? '- Dockerfile detected' : '- No Dockerfile detected'}
${dockerCompose ? '- docker-compose.yml detected' : ''}
`);

  // --- stack.md ---
  const languagesList = stack.languages.length
    ? stack.languages.map(l => `- ${l}`).join('\n')
    : '- Not detected';

  const frameworksList = stack.frameworks.length
    ? stack.frameworks.map(f => `- ${f.name} ${f.version}`).join('\n')
    : '- None detected';

  const databaseList = stack.database.length
    ? stack.database.map(d => `- ${d}`).join('\n')
    : '- None detected';

  const commandRows = Object.entries(stack.scripts)
    .map(([name, cmd]) => `| \`${stack.packageManager || 'npm'} run ${name}\` | ${cmd} |`)
    .join('\n');

  writeFile(path.join(rulesDir, 'stack.md'), `# Tech Stack

## Languages
${languagesList}

## Frameworks & Libraries
${frameworksList}

## Database
${databaseList}

## External APIs
- Check .env.example for API keys

## Dev Tooling
- Package manager: ${stack.packageManager || 'unknown'}
${stack.frameworks.find(f => ['ESLint', 'Prettier', 'Biome'].includes(f.name))
    ? `- Linter: ${stack.frameworks.filter(f => ['ESLint', 'Prettier', 'Biome'].includes(f.name)).map(f => f.name).join(' + ')}`
    : '- Linter: not detected'}
${stack.frameworks.find(f => ['Vitest', 'Jest', 'Mocha', 'pytest'].includes(f.name))
    ? `- Test runner: ${stack.frameworks.filter(f => ['Vitest', 'Jest', 'Mocha', 'pytest'].includes(f.name)).map(f => f.name).join(' + ')}`
    : '- Test runner: not detected'}
${stack.frameworks.find(f => ['Vite', 'webpack', 'esbuild', 'Rollup'].includes(f.name))
    ? `- Bundler: ${stack.frameworks.filter(f => ['Vite', 'webpack', 'esbuild', 'Rollup'].includes(f.name)).map(f => f.name).join(' + ')}`
    : '- Bundler: not detected'}

## All Commands
| Command | What it does |
|---------|-------------|
${commandRows || '| — | No scripts found |'}
`);

  // --- modules.md ---
  const moduleEntries = folders.map(f => {
    const folderFiles = files.filter(file => file.startsWith(f + '/'));
    const keyFiles = folderFiles.slice(0, 5);
    return `## ${f}
- **Location**: \`${f}/\`
- **Purpose**: ${guessFolderPurpose(f)}
- **Key files**:
${keyFiles.map(kf => `  - \`${kf}\``).join('\n') || '  - (empty)'}
- **File count**: ${folderFiles.length}
`;
  });

  writeFile(path.join(rulesDir, 'modules.md'), `# Module Map

${moduleEntries.join('\n') || 'No modules detected'}
`);

  // --- models.md ---
  const modelsContent = modelFiles.length
    ? modelFiles.map(f => `- \`${f}\``).join('\n')
    : 'No model files detected';

  let prismaModels = '';
  if (prismaSchema) {
    const modelMatches = prismaSchema.match(/model\s+\w+\s*\{[^}]*\}/g);
    if (modelMatches) {
      prismaModels = '\n## Prisma Models\n\n' + modelMatches.map(m => '```prisma\n' + m + '\n```').join('\n\n');
    }
  }

  writeFile(path.join(rulesDir, 'models.md'), `# Data Models

## Model Files
${modelsContent}
${prismaModels}

## Enums & Constants
- Scan model files above for enum definitions

## Migration notes
${fs.existsSync(path.join(rootDir, 'prisma', 'migrations')) ? '- Prisma migrations detected in prisma/migrations/' : '- No migrations detected'}
`);

  // --- api.md ---
  const apiContent = routeFiles.length
    ? routeFiles.map(f => `- \`${f}\``).join('\n')
    : 'No route files detected';

  writeFile(path.join(rulesDir, 'api.md'), `# API Surface

## Route Files
${apiContent}

## Base URL
- Check entry point configuration

## Auth
- Check middleware files for auth implementation

## Endpoints
- Read route files above for detailed endpoint listing

## WebSockets / Events
- Not auto-detected — fill in if applicable
`);

  // --- conventions.md ---
  const hasTs = stack.languages.includes('TypeScript');
  const hasReact = stack.frameworks.some(f => ['React', 'Next.js'].includes(f.name));

  writeFile(path.join(rulesDir, 'conventions.md'), `# Conventions & Patterns

## Naming
- Files: ${detectNamingConvention(files)}
- Functions: Check source files for convention
${hasTs ? '- Types: Check types/ or interfaces/ folders' : ''}

## Error Handling
- Check source for error handling patterns

## Auth Pattern
- Check middleware/ or auth/ folders

${hasReact ? `## State Management
- Check for Zustand, Redux, or React Context usage
` : ''}

## Testing Approach
${stack.scripts.test ? `- Test command: \`${stack.packageManager || 'npm'} run test\`` : '- No test script detected'}
${stack.frameworks.find(f => ['Vitest', 'Jest', 'Mocha', 'pytest'].includes(f.name))
    ? `- Framework: ${stack.frameworks.filter(f => ['Vitest', 'Jest', 'Mocha', 'pytest'].includes(f.name)).map(f => f.name).join(', ')}`
    : ''}

## Code Style Notes
${stack.frameworks.find(f => f.name === 'ESLint') ? '- ESLint configured' : ''}
${stack.frameworks.find(f => f.name === 'Prettier') ? '- Prettier configured' : ''}
${stack.frameworks.find(f => f.name === 'Biome') ? '- Biome configured' : ''}
`);

  // --- gotchas.md ---
  const doNotTouch = [];
  if (fs.existsSync(path.join(rootDir, 'prisma'))) doNotTouch.push('- `prisma/migrations/` — auto-generated by Prisma, never edit manually');
  if (fs.existsSync(path.join(rootDir, 'package-lock.json'))) doNotTouch.push('- `package-lock.json` — auto-generated by npm');
  if (fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml'))) doNotTouch.push('- `pnpm-lock.yaml` — auto-generated by pnpm');
  if (fs.existsSync(path.join(rootDir, 'yarn.lock'))) doNotTouch.push('- `yarn.lock` — auto-generated by yarn');

  writeFile(path.join(rulesDir, 'gotchas.md'), `# Gotchas & Workarounds

## Known Quirks
- Review after using the project for initial quirk discovery

## Do Not Touch
${doNotTouch.length ? doNotTouch.join('\n') : '- None identified yet'}

## Known Bugs / TODOs
- [ ] Review codebase for existing TODOs

## Environment Notes
${envExample ? '- .env.example exists — copy to .env and fill in values' : '- No .env.example found'}
`);

  // --- changelog.md ---
  writeFile(
    path.join(rulesDir, 'changelog.md'),
    changelogTemplate(today, folders.length, routeFiles.length, modelFiles.length)
  );

  // --- CLAUDE.md ---
  writeFile(
    path.join(rootDir, 'CLAUDE.md'),
    claudeMdTemplate(
      projectName,
      today,
      description,
      stackSummary,
      stack.devCmd || 'N/A',
      stack.testCmd || 'N/A',
      stack.buildCmd || 'N/A'
    )
  );

  spinner4.succeed('Memory files written');

  // Step 5.5: Scaffold hooks
  const spinner5 = ora('Setting up auto-tracking hooks...').start();

  writeFile(path.join(hooksDir, 'track-changes.sh'), trackChangesHook);
  makeExecutable(path.join(hooksDir, 'track-changes.sh'));

  writeFile(path.join(hooksDir, 'session-end.sh'), sessionEndHook);
  makeExecutable(path.join(hooksDir, 'session-end.sh'));

  mergeSettings(path.join(rootDir, '.claude', 'settings.json'), hooksSettings);

  spinner5.succeed('Auto-tracking hooks installed');

  // Step 6: Summary
  console.log(chalk.green('\n  Codebase memory stored + auto-tracking enabled.\n'));
  console.log(chalk.dim('  Files written:'));
  const writtenFiles = [
    'CLAUDE.md',
    '.claude/rules/architecture.md',
    '.claude/rules/stack.md',
    '.claude/rules/modules.md',
    '.claude/rules/models.md',
    '.claude/rules/api.md',
    '.claude/rules/conventions.md',
    '.claude/rules/gotchas.md',
    '.claude/rules/changelog.md',
    '.claude/hooks/track-changes.sh',
    '.claude/hooks/session-end.sh',
    '.claude/settings.json',
  ];
  for (const f of writtenFiles) {
    console.log(chalk.dim(`    ${f}`));
  }

  console.log('');
  console.log(`  ${chalk.cyan(folders.length)} modules mapped`);
  console.log(`  ${chalk.cyan(routeFiles.length)} endpoint files documented`);
  console.log(`  ${chalk.cyan(modelFiles.length)} model files captured`);
  console.log(`  ${chalk.cyan(files.length)} total files scanned`);
  console.log('');
  console.log(chalk.yellow('  Auto-tracking active — every file change is logged to changelog.md automatically.'));
  console.log(chalk.green('  Re-analysis will NOT be needed in future sessions.\n'));
}

function detectNamingConvention(files) {
  const jsFiles = files.filter(f => /\.(js|ts|jsx|tsx)$/.test(f));
  if (!jsFiles.length) return 'Not detected';

  const basenames = jsFiles.map(f => path.basename(f, path.extname(f)));
  const kebab = basenames.filter(n => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(n)).length;
  const pascal = basenames.filter(n => /^[A-Z][a-zA-Z0-9]*$/.test(n)).length;
  const camel = basenames.filter(n => /^[a-z][a-zA-Z0-9]*$/.test(n)).length;

  if (kebab > pascal && kebab > camel) return 'kebab-case';
  if (pascal > kebab && pascal > camel) return 'PascalCase';
  if (camel > kebab && camel > pascal) return 'camelCase';
  return 'Mixed';
}
