<p align="center">
  <h1 align="center">codebase-memory</h1>
  <p align="center">
    <strong>Give Claude Code a permanent memory of your codebase.</strong>
    <br />
    One setup. Zero maintenance. Every session starts with full project context.
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/codebase-memory"><img src="https://img.shields.io/npm/v/codebase-memory.svg?style=flat-square&color=blue" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/codebase-memory"><img src="https://img.shields.io/npm/dm/codebase-memory.svg?style=flat-square&color=green" alt="npm downloads" /></a>
    <a href="https://github.com/RagavRida/codebase-memory/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="license" /></a>
    <a href="https://github.com/RagavRida/codebase-memory"><img src="https://img.shields.io/github/stars/RagavRida/codebase-memory?style=flat-square&color=yellow" alt="stars" /></a>
  </p>
</p>

---

## The Problem

Every time you start a Claude Code session, Claude has **zero memory** of your project. It re-reads files, re-discovers your stack, re-learns your patterns. On large codebases, this eats tokens, wastes time, and leads to inconsistent suggestions.

## The Solution

`codebase-memory` analyzes your codebase **once** and stores structured knowledge in `.claude/rules/` files that Claude Code **automatically loads every session**. No re-analysis. No wasted tokens. Instant context.

```
Without codebase-memory:                With codebase-memory:
┌─────────────────────────┐            ┌─────────────────────────┐
│ Session 1: Read 200 files│            │ Session 1: Auto-analyze │
│ Session 2: Read 200 files│            │ Session 2: Read 8 files │
│ Session 3: Read 200 files│            │ Session 3: Read 8 files │
│ ...slow every time       │            │ ...instant every time   │
└─────────────────────────┘            └─────────────────────────┘
```

---

## Quick Start

```bash
npm install -g codebase-memory
codebase-memory setup
```

**That's it.** Everything is automatic from here.

---

## How It Works

### One-time setup installs 3 invisible hooks:

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code Session                       │
│                                                              │
│  1. SESSION START (PreToolUse hook)                          │
│     └─ No CLAUDE.md? → auto-analyzes your project           │
│     └─ CLAUDE.md exists? → skips instantly                   │
│                                                              │
│  2. DURING WORK (PostToolUse hook)                           │
│     └─ Claude edits a file → logged to changelog.md          │
│                                                              │
│  3. SESSION END (Stop hook)                                  │
│     └─ Auto-updates memory with new modules, routes, models  │
└─────────────────────────────────────────────────────────────┘
```

### What gets created in your project:

```
your-project/
├── CLAUDE.md                      # Project summary (auto-loaded by Claude Code)
└── .claude/rules/
    ├── architecture.md            # Folder map, entry points, data flow
    ├── stack.md                   # Tech stack, versions, all commands
    ├── modules.md                 # Every module and what it does
    ├── models.md                  # DB schemas, types, entities
    ├── api.md                     # All routes and endpoints
    ├── conventions.md             # Naming, patterns, testing approach
    ├── gotchas.md                 # Quirks, workarounds, do-not-touch
    └── changelog.md               # Auto-updated change log
```

Claude Code **natively** reads `CLAUDE.md` and `.claude/rules/` at session start. This isn't a hack — it's built into Claude Code. We just automate creating and maintaining these files.

---

## Why Every Session Is Smarter

When you ask Claude to work on your project, it already knows:

| You ask | Claude already knows from memory |
|---------|----------------------------------|
| "Add a payment endpoint" | Your routes live in `src/routes/`, you use Express, auth is JWT middleware |
| "Fix the user model" | Schema is in `prisma/schema.prisma`, User has relations to Orders and Posts |
| "Write tests for the API" | You use Vitest, tests go in `__tests__/`, test command is `npm run test` |
| "Refactor the auth flow" | Auth middleware is in `src/middleware/auth.ts`, uses bcrypt + JWT |

**No scanning. No guessing. No re-reading 200 files.** The answer is already in Claude's context.

---

## What It Detects

| Category | Coverage |
|----------|----------|
| **Languages** | JavaScript, TypeScript, Python, Go, Rust, Ruby, Java/Kotlin |
| **Frameworks** | Next.js, React, Vue, Svelte, Express, FastAPI, Django, NestJS, Remix, Astro, and 30+ more |
| **Databases** | PostgreSQL, MySQL, SQLite, MongoDB, Redis |
| **ORMs** | Prisma, Drizzle, TypeORM, Sequelize, Mongoose, SQLAlchemy |
| **Package Managers** | npm, pnpm, yarn, bun, pip, uv, pipenv |
| **Test Frameworks** | Vitest, Jest, Mocha, pytest, Playwright, Cypress |
| **Build Tools** | Vite, webpack, esbuild, Rollup, Turborepo |
| **Linters** | ESLint, Prettier, Biome |
| **Infrastructure** | Docker, docker-compose |
| **Project Structure** | Entry points, route files, model files, API surfaces, folder conventions |

---

## Automatic Change Tracking

Every file Claude edits is logged with a timestamp:

```markdown
# Memory Changelog

## 2026-04-14 — Initial analysis
- Full codebase analyzed and memory files written
- 12 modules mapped, 8 endpoints documented, 5 models captured

## 2026-04-14
- `src/routes/payments.ts` — Write at 14:30
- `src/models/invoice.ts` — Edit at 14:35
- `prisma/schema.prisma` — Edit at 14:36

### Session ended at 15:00
**Recent commits:**
```
a1b2c3d Add payment processing endpoint
d4e5f6g Update invoice model with status field
```​
```

At session end, new modules, routes, and models are auto-detected and appended to the memory files.

---

## Commands

After `setup`, you don't need any of these. But they're available:

```bash
codebase-memory setup              # One-time: install global hooks (fully automatic after this)
codebase-memory analyze [dir]      # Manual: full deep scan of a codebase
codebase-memory update [dir]       # Manual: incremental update after a session
codebase-memory restore [dir]      # Manual: print project summary
codebase-memory teardown           # Remove all global hooks
```

---

## Works With Every Project

```bash
cd ~/nextjs-app && claude        # → auto-analyzes Next.js + Prisma + PostgreSQL
cd ~/python-api && claude        # → auto-analyzes FastAPI + SQLAlchemy + Redis
cd ~/go-service && claude        # → auto-analyzes Go modules
cd ~/rust-cli && claude          # → auto-analyzes Cargo workspace
cd ~/nextjs-app && claude        # → already analyzed, instant context
```

Each project gets its own memory files. Switch freely between projects.

---

## Uninstall

```bash
codebase-memory teardown           # Remove hooks (keeps project memory files)
npm uninstall -g codebase-memory   # Remove package
```

To also remove memory from a specific project:
```bash
rm CLAUDE.md && rm -rf .claude/rules/
```

---

## FAQ

**Does this work with other AI coding tools?**
It's built for Claude Code, which natively reads `CLAUDE.md` and `.claude/rules/`. Other tools that support similar conventions will also benefit.

**Does it send my code anywhere?**
No. Everything runs locally. The memory files are plain markdown stored in your project directory.

**Will it slow down Claude Code?**
No. The session-start check uses a temp marker file — subsequent tool calls skip in microseconds. The memory files are small (a few KB each).

**What if my project changes significantly?**
Run `codebase-memory analyze` again to do a fresh full scan. Or let the auto-update hook catch incremental changes over time.

**Does it work in monorepos?**
Yes. Run it from the monorepo root and it maps all top-level packages/services.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

MIT

---

<p align="center">
  <sub>Built for developers who are tired of Claude re-reading their codebase every session.</sub>
</p>
