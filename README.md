<p align="center">
  <img src="https://img.shields.io/badge/works_with-7_AI_coding_tools-blueviolet?style=for-the-badge" alt="Works with 7 AI coding tools" />
</p>

<h1 align="center">codebase-memory</h1>

<p align="center">
  <strong>Give your AI coding assistant a permanent memory of your codebase.</strong>
  <br />
  One command. Zero maintenance. Every session starts with full project context.
  <br /><br />
  Works with <strong>Claude Code</strong> &bull; <strong>Cursor</strong> &bull; <strong>GitHub Copilot</strong> &bull; <strong>Windsurf</strong> &bull; <strong>Cline</strong> &bull; <strong>Aider</strong> &bull; <strong>Roo Code</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/codebase-memory"><img src="https://img.shields.io/npm/v/codebase-memory.svg?style=flat-square&color=blue" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/codebase-memory"><img src="https://img.shields.io/npm/dm/codebase-memory.svg?style=flat-square&color=green" alt="npm downloads" /></a>
  <a href="https://github.com/RagavRida/codebase-memory/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="license" /></a>
  <a href="https://github.com/RagavRida/codebase-memory"><img src="https://img.shields.io/github/stars/RagavRida/codebase-memory?style=flat-square&color=yellow" alt="stars" /></a>
</p>

---

## The Problem

Every time you start a new AI coding session — in **any** IDE — your AI assistant has **zero memory** of your project. It re-reads files, re-discovers your stack, re-learns your patterns. On large codebases, this wastes tokens, wastes time, and produces inconsistent code.

**This happens in every tool**: Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Aider — all of them start from scratch every session.

## The Solution

`codebase-memory` analyzes your codebase **once** and generates context files for **every major AI coding tool**. Your AI assistant loads these automatically at session start. No re-analysis. No wasted tokens. Instant context.

```
Without codebase-memory:                 With codebase-memory:
┌──────────────────────────┐            ┌──────────────────────────┐
│ Session 1: Scan 200 files │            │ Session 1: Auto-analyze  │
│ Session 2: Scan 200 files │            │ Session 2: Load 1 file   │
│ Session 3: Scan 200 files │            │ Session 3: Load 1 file   │
│ ...slow every time        │            │ ...instant every time    │
└──────────────────────────┘            └──────────────────────────┘
```

---

## Quick Start

```bash
npm install -g codebase-memory
```

### Fully automatic (Claude Code)

```bash
codebase-memory setup
```

After this, you never run another command. New projects are auto-analyzed, changes are auto-tracked, and memory is auto-updated when sessions end.

### Any IDE / AI tool

```bash
cd your-project
codebase-memory analyze
```

This generates context files for **all supported tools at once**:

| File generated | AI tool | How it's loaded |
|---|---|---|
| `CLAUDE.md` + `.claude/rules/` | **Claude Code** | Auto-loaded at session start |
| `.cursorrules` | **Cursor** | Auto-loaded at session start |
| `.github/copilot-instructions.md` | **GitHub Copilot** | Auto-loaded at session start |
| `.windsurfrules` | **Windsurf** | Auto-loaded at session start |
| `.clinerules` | **Cline** | Auto-loaded at session start |
| `CONVENTIONS.md` | **Aider** | Add `read: CONVENTIONS.md` to `.aider.conf.yml` |
| `.roomodes` | **Roo Code** | Auto-loaded at session start |

**One command, all IDEs covered.**

---

## What It Creates

```
your-project/
├── CLAUDE.md                          # Claude Code
├── .cursorrules                       # Cursor
├── .windsurfrules                     # Windsurf
├── .clinerules                        # Cline
├── .roomodes                          # Roo Code
├── CONVENTIONS.md                     # Aider
├── .github/
│   └── copilot-instructions.md        # GitHub Copilot
└── .claude/
    └── rules/
        ├── architecture.md            # Folder map, entry points, data flow
        ├── stack.md                   # Tech stack, versions, all commands
        ├── modules.md                 # Every module and what it does
        ├── models.md                  # DB schemas, types, entities
        ├── api.md                     # All routes and endpoints
        ├── conventions.md             # Naming, patterns, testing approach
        ├── gotchas.md                 # Quirks, workarounds, do-not-touch
        └── changelog.md              # Auto-updated change log
```

---

## Why Every Session Is Smarter

Your AI assistant already knows your entire project before you type anything:

| You ask | AI already knows from memory |
|---------|------------------------------|
| "Add a payment endpoint" | Routes live in `src/routes/`, you use Express, auth is JWT middleware |
| "Fix the user model" | Schema is in `prisma/schema.prisma`, User has relations to Orders |
| "Write tests for the API" | You use Vitest, tests go in `__tests__/`, run with `npm test` |
| "Refactor the auth flow" | Auth middleware is in `src/middleware/auth.ts`, uses bcrypt + JWT |
| "What database do we use?" | PostgreSQL 15 via Prisma ORM, connection string in DATABASE_URL |

**No scanning. No guessing. No wasted context window.** The knowledge is already loaded.

---

## How the Automation Works (Claude Code)

The `setup` command installs 3 invisible hooks that run automatically:

```
┌───────────────────────────────────────────────────────────────┐
│                     Claude Code Session                        │
│                                                                │
│  SESSION START ──→ PreToolUse hook fires                       │
│    ├─ No CLAUDE.md? → auto-analyzes project in background      │
│    └─ CLAUDE.md exists? → skips (instant)                      │
│                                                                │
│  DURING WORK ───→ PostToolUse hook fires on Write/Edit         │
│    └─ Logs every changed file to changelog.md with timestamp   │
│                                                                │
│  SESSION END ───→ Stop hook fires                              │
│    └─ Auto-updates memory: new modules, routes, models, cmds   │
└───────────────────────────────────────────────────────────────┘
```

For other IDEs, run `codebase-memory analyze` once per project (or `codebase-memory update` after major changes).

---

## What It Detects

| Category | Coverage |
|----------|----------|
| **Languages** | JavaScript, TypeScript, Python, Go, Rust, Ruby, Java/Kotlin |
| **Frameworks** | Next.js, React, Vue, Svelte, Express, FastAPI, Django, Flask, NestJS, Remix, Astro, Nuxt, SvelteKit, Hono, Koa, Fastify, Angular, Gatsby, Electron, and more |
| **Databases** | PostgreSQL, MySQL, SQLite, MongoDB, Redis |
| **ORMs** | Prisma, Drizzle, TypeORM, Sequelize, Mongoose, SQLAlchemy |
| **Package Managers** | npm, pnpm, yarn, bun, pip, uv, pipenv |
| **Test Frameworks** | Vitest, Jest, Mocha, pytest, Playwright, Cypress |
| **Build Tools** | Vite, webpack, esbuild, Rollup, Turborepo |
| **Linters** | ESLint, Prettier, Biome |
| **State Management** | Zustand, Redux, TanStack Query |
| **Infrastructure** | Docker, docker-compose |
| **Project Structure** | Entry points, route files, model files, API surfaces, folder conventions, naming patterns |

---

## Automatic Change Tracking

Every file your AI edits is logged:

```markdown
# Memory Changelog

## 2026-04-14 — Initial analysis
- Full codebase analyzed and memory files written
- 12 modules mapped, 8 endpoints documented, 5 models captured

## 2026-04-14
- `src/routes/payments.ts` — Write at 14:30
- `src/models/invoice.ts` — Edit at 14:35

### Session ended at 15:00
**Recent commits:**
  a1b2c3d Add payment processing endpoint
  d4e5f6g Update invoice model with status field
```

---

## Commands

```bash
codebase-memory setup              # One-time: install Claude Code auto-hooks
codebase-memory analyze [dir]      # Analyze codebase + generate all IDE context files
codebase-memory update [dir]       # Incremental update after changes
codebase-memory restore [dir]      # Print project summary
codebase-memory teardown           # Remove Claude Code hooks
```

---

## Works With Every Project

```bash
cd ~/nextjs-saas && codebase-memory analyze
# → Detects Next.js 14 + Prisma + PostgreSQL + Tailwind + Stripe

cd ~/python-api && codebase-memory analyze
# → Detects FastAPI + SQLAlchemy + Redis + pytest

cd ~/go-microservice && codebase-memory analyze
# → Detects Go modules + Docker + gRPC

cd ~/react-native-app && codebase-memory analyze
# → Detects React Native + Expo + TypeScript + Zustand
```

---

## Comparison

| Feature | codebase-memory | Manual rules files | No context files |
|---------|:-:|:-:|:-:|
| Auto-generates from codebase | Yes | No (write by hand) | N/A |
| Detects stack + frameworks | Yes | No | No |
| Maps modules + routes + models | Yes | No | No |
| Auto-tracks changes | Yes | No | No |
| Auto-updates on session end | Yes | No | No |
| Works across all AI IDEs | Yes | 1 IDE at a time | No |
| Setup time | 30 seconds | Hours | N/A |

---

## FAQ

<details>
<summary><strong>Does this work with [my IDE]?</strong></summary>

If your AI coding tool reads any of these files, yes:
- `CLAUDE.md` / `.claude/rules/` — Claude Code
- `.cursorrules` — Cursor
- `.github/copilot-instructions.md` — GitHub Copilot
- `.windsurfrules` — Windsurf
- `.clinerules` — Cline
- `CONVENTIONS.md` — Aider
- `.roomodes` — Roo Code

All generated from one command.
</details>

<details>
<summary><strong>Does it send my code anywhere?</strong></summary>

No. Everything runs 100% locally. Memory files are plain markdown stored in your project directory. Nothing is uploaded, telemetried, or phoned home.
</details>

<details>
<summary><strong>Will it slow down my IDE?</strong></summary>

No. The context files are small (a few KB each). The Claude Code session-start hook uses a temp marker — subsequent tool calls skip in microseconds.
</details>

<details>
<summary><strong>What if my project changes significantly?</strong></summary>

Run `codebase-memory analyze` again for a fresh full scan. Or let the auto-update hook (Claude Code) catch incremental changes over time.
</details>

<details>
<summary><strong>Does it work in monorepos?</strong></summary>

Yes. Run it from the root and it maps all top-level packages and services.
</details>

<details>
<summary><strong>Can I customize the generated files?</strong></summary>

Yes. The generated files are plain markdown. Edit them freely — the update command only appends, never overwrites your changes.
</details>

---

## Uninstall

```bash
codebase-memory teardown           # Remove Claude Code hooks
npm uninstall -g codebase-memory   # Remove package
```

To remove memory from a specific project:
```bash
rm -f CLAUDE.md .cursorrules .windsurfrules .clinerules .roomodes CONVENTIONS.md
rm -rf .claude/rules/ .github/copilot-instructions.md
```

---

## Contributing

Contributions welcome. Open an issue or submit a PR.

If you'd like to add support for another AI coding tool, check `src/utils/ide-generator.js` — it's designed to be easily extensible.

---

## Star History

If this tool saved you time, consider giving it a star. It helps others discover it.

[![Star History Chart](https://api.star-history.com/svg?repos=RagavRida/codebase-memory&type=Date)](https://star-history.com/#RagavRida/codebase-memory&Date)

---

<p align="center">
  <strong>Stop teaching your AI the same codebase every session.</strong>
  <br />
  <code>npm install -g codebase-memory && codebase-memory setup</code>
  <br /><br />
  <sub>Built for developers who use AI coding tools daily and are tired of the cold-start problem.</sub>
</p>
