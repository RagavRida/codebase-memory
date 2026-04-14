<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/codebase--memory-give_your_AI_a_permanent_memory-white?style=for-the-badge&labelColor=0d1117&color=58a6ff">
    <img alt="codebase-memory" src="https://img.shields.io/badge/codebase--memory-give_your_AI_a_permanent_memory-white?style=for-the-badge&labelColor=f6f8fa&color=0969da">
  </picture>
</p>

<p align="center">
  Analyze once. Remember forever. Context from session one.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/codebase-memory"><img src="https://img.shields.io/npm/v/codebase-memory?style=flat-square&labelColor=0d1117&color=58a6ff" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/codebase-memory"><img src="https://img.shields.io/npm/dm/codebase-memory?style=flat-square&labelColor=0d1117&color=2ea043" alt="downloads" /></a>
  <a href="https://github.com/RagavRida/codebase-memory/blob/main/LICENSE"><img src="https://img.shields.io/github/license/RagavRida/codebase-memory?style=flat-square&labelColor=0d1117&color=8b949e" alt="license" /></a>
  <a href="https://github.com/RagavRida/codebase-memory/stargazers"><img src="https://img.shields.io/github/stars/RagavRida/codebase-memory?style=flat-square&labelColor=0d1117&color=e3b341" alt="stars" /></a>
</p>

<p align="center">
  <sub>
    <b>Claude Code</b>&ensp;&middot;&ensp;<b>Cursor</b>&ensp;&middot;&ensp;<b>GitHub Copilot</b>&ensp;&middot;&ensp;<b>Windsurf</b>&ensp;&middot;&ensp;<b>Cline</b>&ensp;&middot;&ensp;<b>Aider</b>&ensp;&middot;&ensp;<b>Roo Code</b>
  </sub>
</p>

<br>

## Why

AI coding assistants start every session with zero knowledge of your project. They re-read files, re-discover your stack, and re-learn your conventions. On large codebases this burns through context windows, wastes time, and produces inconsistent suggestions.

`codebase-memory` fixes this. It performs a one-time deep analysis of your project and writes structured context files that your AI tool loads automatically at session start. The result: every session begins exactly where the last one left off.

```
Before                              After
──────                              ─────
Session 1  scan 200 files  slow     Session 1  analyze once     one-time
Session 2  scan 200 files  slow     Session 2  load context     instant
Session 3  scan 200 files  slow     Session 3  load context     instant
```

<br>

## Install

```bash
npm install -g codebase-memory
```

<br>

## Quick start

**Option A &mdash; Fully automatic** (Claude Code)

```bash
codebase-memory setup
```

Installs invisible hooks. New projects are auto-analyzed on first use, changes are tracked during work, and memory is updated when the session ends. Nothing else to do.

**Option B &mdash; Any AI tool**

```bash
cd your-project
codebase-memory analyze
```

Generates context files for every supported tool in one pass.

<br>

## Supported tools

A single `analyze` creates the correct file for each tool:

| Generated file | Tool | Loaded |
|:--|:--|:--|
| `CLAUDE.md` &plus; `.claude/rules/` | Claude Code | Automatically |
| `.cursorrules` | Cursor | Automatically |
| `.github/copilot-instructions.md` | GitHub Copilot | Automatically |
| `.windsurfrules` | Windsurf | Automatically |
| `.clinerules` | Cline | Automatically |
| `CONVENTIONS.md` | Aider | Via `.aider.conf.yml` |
| `.roomodes` | Roo Code | Automatically |

<br>

## What it generates

```
project/
├── CLAUDE.md                        Claude Code context
├── .cursorrules                     Cursor context
├── .windsurfrules                   Windsurf context
├── .clinerules                      Cline context
├── .roomodes                        Roo Code context
├── CONVENTIONS.md                   Aider context
├── .github/
│   └── copilot-instructions.md      GitHub Copilot context
└── .claude/
    └── rules/
        ├── architecture.md          Folder map, entry points, data flow
        ├── stack.md                 Languages, frameworks, versions, commands
        ├── modules.md               Every module and its responsibility
        ├── models.md                Database schemas, types, entities
        ├── api.md                   Routes and endpoints
        ├── conventions.md           Naming patterns, error handling, testing
        ├── gotchas.md               Quirks, workarounds, do-not-touch files
        └── changelog.md             Auto-updated change log
```

<br>

## Detection coverage

| Category | What's detected |
|:--|:--|
| Languages | JavaScript, TypeScript, Python, Go, Rust, Ruby, Java, Kotlin |
| Frameworks | Next.js, React, Vue, Svelte, Express, FastAPI, Django, Flask, NestJS, Remix, Astro, Nuxt, SvelteKit, Hono, Koa, Fastify, Angular, Gatsby, Electron &plus; more |
| Databases | PostgreSQL, MySQL, SQLite, MongoDB, Redis |
| ORMs | Prisma, Drizzle, TypeORM, Sequelize, Mongoose, SQLAlchemy |
| Package managers | npm, pnpm, yarn, bun, pip, uv, pipenv |
| Testing | Vitest, Jest, Mocha, pytest, Playwright, Cypress |
| Build tools | Vite, webpack, esbuild, Rollup, Turborepo |
| Linting | ESLint, Prettier, Biome |
| State management | Zustand, Redux, TanStack Query |
| Infrastructure | Docker, docker-compose |
| Structure | Entry points, route files, model files, API surfaces, naming conventions |

<br>

## How automation works

When you run `codebase-memory setup`, three Claude Code hooks are installed globally:

```
Session start     PreToolUse hook checks for CLAUDE.md
                  ├── missing → analyzes project in background
                  └── present → skips instantly

During work       PostToolUse hook fires on Write / Edit
                  └── appends file path + timestamp to changelog.md

Session end       Stop hook fires
                  └── runs incremental update (new modules, routes, models)
```

The session-start check uses a temp marker per project directory. After the first tool call it exits in microseconds.

For tools other than Claude Code, run `codebase-memory analyze` once per project or `codebase-memory update` after significant changes.

<br>

## Change tracking

Every edit made by the AI is recorded:

```markdown
## 2026-04-14 — Initial analysis
- Full codebase analyzed and memory files written
- 12 modules mapped, 8 endpoints documented, 5 models captured

## 2026-04-14
- `src/routes/payments.ts` — Write at 14:30
- `src/models/invoice.ts` — Edit at 14:35

### Session ended at 15:00
**Recent commits:**
  a1b2c3d Add payment processing endpoint
  d4e5f6g Update invoice model
```

<br>

## CLI reference

```
codebase-memory <command> [options]

Commands:
  setup              Install global Claude Code hooks (one-time)
  analyze [dir]      Full analysis + generate context for all IDEs
  update  [dir]      Incremental update — append only what changed
  restore [dir]      Print project summary from memory files
  teardown           Remove global hooks

Aliases:
  s → setup    a → analyze    u → update    r → restore
```

<br>

## Comparison

| | codebase-memory | Manual rules files | No context |
|:--|:-:|:-:|:-:|
| Auto-generates from codebase | Yes | &mdash; | &mdash; |
| Detects stack and frameworks | Yes | &mdash; | &mdash; |
| Maps modules, routes, models | Yes | &mdash; | &mdash; |
| Tracks changes automatically | Yes | &mdash; | &mdash; |
| Updates memory on session end | Yes | &mdash; | &mdash; |
| Covers 7 AI tools at once | Yes | 1 | &mdash; |
| Time to set up | 30 seconds | Hours | &mdash; |

<br>

## FAQ

<details>
<summary>Does it work with my tool?</summary>
<br>
If your AI coding tool reads <code>.cursorrules</code>, <code>.github/copilot-instructions.md</code>, <code>.windsurfrules</code>, <code>.clinerules</code>, <code>CONVENTIONS.md</code>, <code>.roomodes</code>, or <code>CLAUDE.md</code>, yes. All are generated from one command.
</details>

<details>
<summary>Does it send code anywhere?</summary>
<br>
No. Everything runs locally. The output is plain markdown in your project directory. Nothing is uploaded or transmitted.
</details>

<details>
<summary>Will it slow down my editor?</summary>
<br>
No. Context files are a few KB. The Claude Code hook exits in microseconds after the first check per session.
</details>

<details>
<summary>What if the project changes significantly?</summary>
<br>
Run <code>codebase-memory analyze</code> again for a full rescan, or let the auto-update hook handle incremental changes.
</details>

<details>
<summary>Does it work in monorepos?</summary>
<br>
Yes. Run from the root to map all top-level packages and services.
</details>

<details>
<summary>Can I edit the generated files?</summary>
<br>
Yes. They are plain markdown. The update command appends only — it never overwrites manual edits.
</details>

<br>

## Uninstall

```bash
codebase-memory teardown             # remove hooks
npm uninstall -g codebase-memory     # remove package
```

Remove memory from a specific project:

```bash
rm -f CLAUDE.md .cursorrules .windsurfrules .clinerules .roomodes CONVENTIONS.md
rm -rf .claude/rules/ .github/copilot-instructions.md
```

<br>

## Contributing

Issues and pull requests are welcome.

To add support for a new AI tool, see [`src/utils/ide-generator.js`](src/utils/ide-generator.js) — the architecture is designed for easy extension.

<br>

---

<p align="center">
  <code>npm install -g codebase-memory && codebase-memory setup</code>
  <br><br>
  <sub>Stop re-teaching your AI assistant the same codebase every session.</sub>
</p>
