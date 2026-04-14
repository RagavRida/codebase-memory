import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { ensureDir, writeFile, makeExecutable, mergeSettings } from '../utils/writer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, '..', 'index.js');

const HOOKS_DIR = path.join(process.env.HOME, '.codebase-memory', 'hooks');
const CLAUDE_SETTINGS = path.join(process.env.HOME, '.claude', 'settings.json');

export async function setup() {
  console.log(chalk.bold('\n  Codebase Memory — Global Setup\n'));
  console.log(chalk.dim('  This installs Claude Code hooks so everything runs automatically:\n'));
  console.log(chalk.dim('    - New project opened  → auto-analyze'));
  console.log(chalk.dim('    - Files edited         → auto-track in changelog'));
  console.log(chalk.dim('    - Session ends          → auto-update memory\n'));

  const nodePath = process.execPath; // absolute path to node binary

  // Step 1: Write hook scripts
  const spinner = ora('Writing hook scripts...').start();
  ensureDir(HOOKS_DIR);

  // --- auto-init.sh ---
  // Fires on PreToolUse. Checks session marker so it only runs once.
  // If no CLAUDE.md → auto-analyze. If CLAUDE.md exists → skip.
  writeFile(path.join(HOOKS_DIR, 'auto-init.sh'), `#!/bin/bash
# Auto-init: runs once per session per project directory
# Checks if CLAUDE.md exists — if not, auto-analyzes the codebase

MARKER_DIR="/tmp/codebase-memory-sessions"
mkdir -p "$MARKER_DIR"

# Create a unique marker per project directory
DIR_HASH=$(echo -n "$(pwd)" | shasum | cut -d' ' -f1)
MARKER="$MARKER_DIR/$DIR_HASH"

# Already initialized this session? Exit fast.
if [ -f "$MARKER" ]; then
  exit 0
fi

# Create marker immediately so concurrent calls don't double-fire
touch "$MARKER"

# Not a project directory? Skip.
if [ ! -f "package.json" ] && [ ! -f "pyproject.toml" ] && [ ! -f "go.mod" ] && \\
   [ ! -f "Cargo.toml" ] && [ ! -f "Gemfile" ] && [ ! -f "pom.xml" ] && \\
   [ ! -f "build.gradle" ] && [ ! -f "Makefile" ] && [ ! -f "composer.json" ]; then
  exit 0
fi

# Already has memory files? Skip.
if [ -f "CLAUDE.md" ] && [ -d ".claude/rules" ]; then
  exit 0
fi

# Auto-analyze in background so it doesn't block the tool call
"${nodePath}" "${CLI_PATH}" analyze . > /dev/null 2>&1 &

exit 0
`);
  makeExecutable(path.join(HOOKS_DIR, 'auto-init.sh'));

  // --- auto-track.sh ---
  // Fires on PostToolUse for Write/Edit/MultiEdit
  writeFile(path.join(HOOKS_DIR, 'auto-track.sh'), `#!/bin/bash
# Auto-track: logs every file change to .claude/rules/changelog.md

TOOL="$CLAUDE_TOOL_NAME"
FILE="$CLAUDE_TOOL_INPUT_file_path"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
CHANGELOG=".claude/rules/changelog.md"

# No changelog file? Not an analyzed project — skip.
if [ ! -f "$CHANGELOG" ]; then
  exit 0
fi

# Skip memory files themselves
if [[ "$FILE" == *".claude/rules"* || "$FILE" == *"CLAUDE.md"* ]]; then
  exit 0
fi

# Skip empty file paths
if [ -z "$FILE" ]; then
  exit 0
fi

# Create today's section header if needed
DATE=$(date '+%Y-%m-%d')
if ! grep -q "## $DATE" "$CHANGELOG" 2>/dev/null; then
  echo "" >> "$CHANGELOG"
  echo "## $DATE" >> "$CHANGELOG"
fi

# Append the change
echo "- \\\`$FILE\\\` — $TOOL at $TIMESTAMP" >> "$CHANGELOG"
`);
  makeExecutable(path.join(HOOKS_DIR, 'auto-track.sh'));

  // --- auto-update.sh ---
  // Fires on Stop (session end)
  writeFile(path.join(HOOKS_DIR, 'auto-update.sh'), `#!/bin/bash
# Auto-update: runs incremental memory update when Claude session ends

# Not an analyzed project? Skip.
if [ ! -f "CLAUDE.md" ] || [ ! -d ".claude/rules" ]; then
  exit 0
fi

CHANGELOG=".claude/rules/changelog.md"
DATE=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M')

echo "" >> "$CHANGELOG"
echo "### Session ended at $TIME" >> "$CHANGELOG"

# Append git summary if available
if git rev-parse --git-dir > /dev/null 2>&1; then
  DIFF=$(git diff --stat HEAD 2>/dev/null)
  COMMITS=$(git log --oneline -5 2>/dev/null)

  if [ -n "$DIFF" ]; then
    echo "" >> "$CHANGELOG"
    echo "**Uncommitted changes:**" >> "$CHANGELOG"
    echo "\\\`\\\`\\\`" >> "$CHANGELOG"
    echo "$DIFF" >> "$CHANGELOG"
    echo "\\\`\\\`\\\`" >> "$CHANGELOG"
  fi

  if [ -n "$COMMITS" ]; then
    echo "" >> "$CHANGELOG"
    echo "**Recent commits:**" >> "$CHANGELOG"
    echo "\\\`\\\`\\\`" >> "$CHANGELOG"
    echo "$COMMITS" >> "$CHANGELOG"
    echo "\\\`\\\`\\\`" >> "$CHANGELOG"
  fi
fi

# Run the full incremental update
"${nodePath}" "${CLI_PATH}" update . > /dev/null 2>&1

exit 0
`);
  makeExecutable(path.join(HOOKS_DIR, 'auto-update.sh'));

  spinner.succeed('Hook scripts written');

  // Step 2: Install hooks into global Claude settings
  const spinner2 = ora('Installing Claude Code hooks...').start();
  ensureDir(path.dirname(CLAUDE_SETTINGS));

  const hookConfig = {
    hooks: {
      PreToolUse: [
        {
          hooks: [
            {
              type: "command",
              command: `bash ${path.join(HOOKS_DIR, 'auto-init.sh')}`
            }
          ]
        }
      ],
      PostToolUse: [
        {
          matcher: "Write|Edit|MultiEdit",
          hooks: [
            {
              type: "command",
              command: `bash ${path.join(HOOKS_DIR, 'auto-track.sh')}`
            }
          ]
        }
      ],
      Stop: [
        {
          hooks: [
            {
              type: "command",
              command: `bash ${path.join(HOOKS_DIR, 'auto-update.sh')}`
            }
          ]
        }
      ]
    }
  };

  mergeSettings(CLAUDE_SETTINGS, hookConfig);
  spinner2.succeed('Claude Code hooks installed');

  // Summary
  console.log(chalk.green('\n  Setup complete! Everything is now automatic.\n'));
  console.log(chalk.dim('  What happens now:'));
  console.log('');
  console.log(`  ${chalk.cyan('Session start')}  → If no CLAUDE.md exists, your project is`);
  console.log(`                    auto-analyzed and memory files are created`);
  console.log('');
  console.log(`  ${chalk.cyan('During work')}    → Every file Write/Edit is logged to`);
  console.log(`                    .claude/rules/changelog.md`);
  console.log('');
  console.log(`  ${chalk.cyan('Session end')}    → Memory files are auto-updated with any`);
  console.log(`                    new modules, routes, models, or commands`);
  console.log('');
  console.log(chalk.dim('  Files installed:'));
  console.log(chalk.dim(`    ${path.join(HOOKS_DIR, 'auto-init.sh')}`));
  console.log(chalk.dim(`    ${path.join(HOOKS_DIR, 'auto-track.sh')}`));
  console.log(chalk.dim(`    ${path.join(HOOKS_DIR, 'auto-update.sh')}`));
  console.log(chalk.dim(`    ${CLAUDE_SETTINGS}`));
  console.log('');
  console.log(chalk.yellow('  To undo: run `codebase-memory teardown`\n'));
}

export async function teardown() {
  console.log(chalk.bold('\n  Codebase Memory — Teardown\n'));

  const spinner = ora('Removing hooks...').start();

  // Remove hook scripts
  const hooksParent = path.join(process.env.HOME, '.codebase-memory');
  if (fs.existsSync(hooksParent)) {
    fs.rmSync(hooksParent, { recursive: true });
  }

  // Remove hook entries from Claude settings
  if (fs.existsSync(CLAUDE_SETTINGS)) {
    try {
      const settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS, 'utf-8'));
      if (settings.hooks) {
        // Remove our specific hooks by checking for our script paths
        for (const eventType of ['PreToolUse', 'PostToolUse', 'Stop']) {
          if (Array.isArray(settings.hooks[eventType])) {
            settings.hooks[eventType] = settings.hooks[eventType].filter(entry => {
              const hooks = entry.hooks || [];
              return !hooks.some(h => h.command && h.command.includes('.codebase-memory'));
            });
            if (settings.hooks[eventType].length === 0) {
              delete settings.hooks[eventType];
            }
          }
        }
        if (Object.keys(settings.hooks).length === 0) {
          delete settings.hooks;
        }
        fs.writeFileSync(CLAUDE_SETTINGS, JSON.stringify(settings, null, 2) + '\n');
      }
    } catch {
      // If settings are corrupted, just leave them
    }
  }

  // Clean up session markers
  const markerDir = '/tmp/codebase-memory-sessions';
  if (fs.existsSync(markerDir)) {
    fs.rmSync(markerDir, { recursive: true });
  }

  spinner.succeed('Hooks removed');
  console.log(chalk.green('\n  Teardown complete. All global hooks have been removed.\n'));
  console.log(chalk.dim('  Note: Project-level memory files (CLAUDE.md, .claude/rules/) are untouched.\n'));
}
