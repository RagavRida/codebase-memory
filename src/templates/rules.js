// Templates for all .claude/rules/ files

export const architectureTemplate = `# Architecture

## Folder Map
{{folderMap}}

## Entry Points
{{entryPoints}}

## Data Flow
{{dataFlow}}

## External Dependencies
{{externalDeps}}

## Deployment
{{deployment}}
`;

export const stackTemplate = `# Tech Stack

## Languages
{{languages}}

## Frameworks & Libraries
{{frameworks}}

## Database
{{database}}

## External APIs
{{externalApis}}

## Dev Tooling
{{devTooling}}

## All Commands
| Command | What it does |
|---------|-------------|
{{commands}}
`;

export const modulesTemplate = `# Module Map

{{modules}}
`;

export const modelsTemplate = `# Data Models

{{models}}

## Enums & Constants
{{enums}}

## Migration notes
{{migrations}}
`;

export const apiTemplate = `# API Surface

## Base URL
{{baseUrl}}

## Auth
{{auth}}

## Endpoints
{{endpoints}}

## WebSockets / Events
{{websockets}}
`;

export const conventionsTemplate = `# Conventions & Patterns

## Naming
{{naming}}

## Error Handling
{{errorHandling}}

## Auth Pattern
{{authPattern}}

## State Management
{{stateManagement}}

## Testing Approach
{{testing}}

## Code Style Notes
{{codeStyle}}
`;

export const gotchasTemplate = `# Gotchas & Workarounds

## Known Quirks
{{quirks}}

## Do Not Touch
{{doNotTouch}}

## Known Bugs / TODOs
{{bugs}}

## Environment Notes
{{envNotes}}
`;

export const changelogTemplate = (date, moduleCount, endpointCount, modelCount) =>
  `# Memory Changelog

## ${date} — Initial analysis
- Full codebase analyzed and memory files written
- ${moduleCount} modules mapped, ${endpointCount} endpoints documented, ${modelCount} models captured
`;

export const claudeMdTemplate = (projectName, date, description, stack, devCmd, testCmd, buildCmd) =>
  `# ${projectName} — Claude Memory
> Last analyzed: ${date}
> Re-analysis needed: NO — read .claude/rules/ files instead of source files

## What this project is
${description}

## Quick reference
- **Stack**: ${stack}
- **Dev**: \`${devCmd}\`
- **Test**: \`${testCmd}\`
- **Build**: \`${buildCmd}\`

## Memory files (read these, not source files)
- @.claude/rules/architecture.md — folder map, entry points, data flow
- @.claude/rules/stack.md — tech stack, versions, all commands
- @.claude/rules/modules.md — every module and what it does
- @.claude/rules/models.md — DB schemas and data types
- @.claude/rules/api.md — all routes and endpoints
- @.claude/rules/conventions.md — naming, patterns, testing approach
- @.claude/rules/gotchas.md — quirks, workarounds, do-not-touch
- @.claude/rules/changelog.md — what changed and when

## Instruction
You have full codebase knowledge from the files above.
Do NOT re-read source files to understand structure — use memory files.
If something seems outdated, flag it rather than re-analyzing.
`;

export const trackChangesHook = `#!/bin/bash
# Auto-tracks every file Claude writes/edits into changelog.md
# Fired automatically by Claude Code after every Write/Edit/MultiEdit tool use

TOOL=$1
FILE=$2
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
CHANGELOG=".claude/rules/changelog.md"

# Only track actual file writes
if [[ "$TOOL" != "Write" && "$TOOL" != "Edit" && "$TOOL" != "MultiEdit" ]]; then
  exit 0
fi

# Skip tracking the memory files themselves
if [[ "$FILE" == *".claude/rules"* || "$FILE" == *"CLAUDE.md"* ]]; then
  exit 0
fi

# Create today's section header if it doesn't exist
DATE=$(date '+%Y-%m-%d')
if ! grep -q "## $DATE" "$CHANGELOG" 2>/dev/null; then
  echo "" >> "$CHANGELOG"
  echo "## $DATE" >> "$CHANGELOG"
fi

# Append the file change
echo "- \\\`$FILE\\\` — modified at $TIMESTAMP" >> "$CHANGELOG"
`;

export const sessionEndHook = `#!/bin/bash
# Fires when Claude Code session ends
# Appends git summary to changelog for full traceability

CHANGELOG=".claude/rules/changelog.md"
DATE=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M')

echo "" >> "$CHANGELOG"
echo "### Session ended at $TIME" >> "$CHANGELOG"

# Append git diff summary if git is available
if git rev-parse --git-dir > /dev/null 2>&1; then
  DIFF=$(git diff --stat HEAD 2>/dev/null)
  COMMITS=$(git log --oneline -5 2>/dev/null)

  if [ -n "$DIFF" ]; then
    echo "" >> "$CHANGELOG"
    echo "**Git diff:**" >> "$CHANGELOG"
    echo '\`\`\`' >> "$CHANGELOG"
    echo "$DIFF" >> "$CHANGELOG"
    echo '\`\`\`' >> "$CHANGELOG"
  fi

  if [ -n "$COMMITS" ]; then
    echo "" >> "$CHANGELOG"
    echo "**Recent commits:**" >> "$CHANGELOG"
    echo '\`\`\`' >> "$CHANGELOG"
    echo "$COMMITS" >> "$CHANGELOG"
    echo '\`\`\`' >> "$CHANGELOG"
  fi
fi
`;

export const hooksSettings = {
  hooks: {
    PostToolUse: [
      {
        matcher: "Write|Edit|MultiEdit",
        hooks: [
          {
            type: "command",
            command: 'bash .claude/hooks/track-changes.sh "$CLAUDE_TOOL_NAME" "$CLAUDE_TOOL_INPUT_path"'
          }
        ]
      }
    ],
    Stop: [
      {
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/session-end.sh"
          }
        ]
      }
    ]
  }
};
