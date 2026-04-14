import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const IGNORE_DIRS = [
  'node_modules', '.git', 'dist', '__pycache__', 'build',
  '.next', '.nuxt', '.output', 'coverage', '.turbo',
  '.cache', 'vendor', 'target', '.venv', 'venv', 'env',
  '.tox', '.mypy_cache', '.pytest_cache', '.cargo'
];

const IGNORE_PATTERN = IGNORE_DIRS.map(d => `**/${d}/**`);

/**
 * Get all files in the project, excluding common build/dependency dirs
 */
export async function getFileTree(rootDir) {
  const files = await glob('**/*', {
    cwd: rootDir,
    nodir: true,
    ignore: IGNORE_PATTERN,
    dot: true
  });
  return files.sort();
}

/**
 * Get top-level folders and their purposes based on common conventions
 */
export function getTopLevelFolders(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const folders = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !IGNORE_DIRS.includes(e.name))
    .map(e => e.name);
  return folders;
}

/**
 * Try to read and parse a JSON file
 */
export function readJsonSafe(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Try to read a file as text
 */
export function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Detect the project type and stack
 */
export function detectStack(rootDir) {
  const stack = {
    languages: [],
    frameworks: [],
    database: [],
    packageManager: null,
    devCmd: null,
    testCmd: null,
    buildCmd: null,
    scripts: {}
  };

  // Node.js / JavaScript / TypeScript
  const pkg = readJsonSafe(path.join(rootDir, 'package.json'));
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (fs.existsSync(path.join(rootDir, 'tsconfig.json'))) {
      stack.languages.push('TypeScript');
    }
    stack.languages.push('JavaScript');

    // Detect package manager
    if (fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml'))) {
      stack.packageManager = 'pnpm';
    } else if (fs.existsSync(path.join(rootDir, 'yarn.lock'))) {
      stack.packageManager = 'yarn';
    } else if (fs.existsSync(path.join(rootDir, 'bun.lockb')) || fs.existsSync(path.join(rootDir, 'bun.lock'))) {
      stack.packageManager = 'bun';
    } else {
      stack.packageManager = 'npm';
    }

    // Detect frameworks
    const frameworkMap = {
      'next': 'Next.js',
      'react': 'React',
      'vue': 'Vue.js',
      'nuxt': 'Nuxt',
      'svelte': 'Svelte',
      '@sveltejs/kit': 'SvelteKit',
      'express': 'Express',
      'fastify': 'Fastify',
      'hono': 'Hono',
      'koa': 'Koa',
      'nestjs': 'NestJS',
      '@nestjs/core': 'NestJS',
      'remix': 'Remix',
      '@remix-run/node': 'Remix',
      'astro': 'Astro',
      'gatsby': 'Gatsby',
      'angular': 'Angular',
      '@angular/core': 'Angular',
      'electron': 'Electron',
      'tailwindcss': 'Tailwind CSS',
      '@tanstack/react-query': 'TanStack Query',
      'zustand': 'Zustand',
      'redux': 'Redux',
      'prisma': 'Prisma',
      '@prisma/client': 'Prisma',
      'drizzle-orm': 'Drizzle ORM',
      'typeorm': 'TypeORM',
      'sequelize': 'Sequelize',
      'mongoose': 'Mongoose',
      'vitest': 'Vitest',
      'jest': 'Jest',
      'mocha': 'Mocha',
      'playwright': 'Playwright',
      'cypress': 'Cypress',
      'esbuild': 'esbuild',
      'vite': 'Vite',
      'webpack': 'webpack',
      'rollup': 'Rollup',
      'turbo': 'Turborepo',
      'eslint': 'ESLint',
      'prettier': 'Prettier',
      'biome': 'Biome',
      '@biomejs/biome': 'Biome'
    };

    for (const [depName, frameworkName] of Object.entries(frameworkMap)) {
      if (deps[depName]) {
        stack.frameworks.push({ name: frameworkName, version: deps[depName] });
      }
    }

    // Detect database from dependencies
    const dbMap = {
      'pg': 'PostgreSQL',
      'mysql2': 'MySQL',
      'better-sqlite3': 'SQLite',
      'sqlite3': 'SQLite',
      'mongodb': 'MongoDB',
      'mongoose': 'MongoDB',
      'redis': 'Redis',
      'ioredis': 'Redis'
    };
    for (const [depName, dbName] of Object.entries(dbMap)) {
      if (deps[depName]) {
        stack.database.push(dbName);
      }
    }

    // Extract scripts
    if (pkg.scripts) {
      stack.scripts = pkg.scripts;
      stack.devCmd = pkg.scripts.dev || pkg.scripts.start || null;
      stack.testCmd = pkg.scripts.test || null;
      stack.buildCmd = pkg.scripts.build || null;
    }
  }

  // Python
  const pyproject = readFileSafe(path.join(rootDir, 'pyproject.toml'));
  const requirements = readFileSafe(path.join(rootDir, 'requirements.txt'));
  if (pyproject || requirements) {
    stack.languages.push('Python');
    const allPyDeps = (pyproject || '') + (requirements || '');

    if (allPyDeps.includes('fastapi')) stack.frameworks.push({ name: 'FastAPI', version: '' });
    if (allPyDeps.includes('django')) stack.frameworks.push({ name: 'Django', version: '' });
    if (allPyDeps.includes('flask')) stack.frameworks.push({ name: 'Flask', version: '' });
    if (allPyDeps.includes('sqlalchemy')) stack.frameworks.push({ name: 'SQLAlchemy', version: '' });
    if (allPyDeps.includes('pytest')) stack.frameworks.push({ name: 'pytest', version: '' });

    if (fs.existsSync(path.join(rootDir, 'uv.lock'))) {
      stack.packageManager = stack.packageManager || 'uv';
    } else if (fs.existsSync(path.join(rootDir, 'Pipfile'))) {
      stack.packageManager = stack.packageManager || 'pipenv';
    } else if (pyproject) {
      stack.packageManager = stack.packageManager || 'pip';
    }
  }

  // Go
  if (fs.existsSync(path.join(rootDir, 'go.mod'))) {
    stack.languages.push('Go');
  }

  // Rust
  if (fs.existsSync(path.join(rootDir, 'Cargo.toml'))) {
    stack.languages.push('Rust');
  }

  // Ruby
  if (fs.existsSync(path.join(rootDir, 'Gemfile'))) {
    stack.languages.push('Ruby');
    const gemfile = readFileSafe(path.join(rootDir, 'Gemfile')) || '';
    if (gemfile.includes('rails')) stack.frameworks.push({ name: 'Ruby on Rails', version: '' });
  }

  // Java / Kotlin
  if (fs.existsSync(path.join(rootDir, 'pom.xml')) || fs.existsSync(path.join(rootDir, 'build.gradle'))) {
    stack.languages.push('Java/Kotlin');
  }

  // Docker
  if (fs.existsSync(path.join(rootDir, 'Dockerfile')) || fs.existsSync(path.join(rootDir, 'docker-compose.yml')) || fs.existsSync(path.join(rootDir, 'docker-compose.yaml'))) {
    stack.frameworks.push({ name: 'Docker', version: '' });
  }

  return stack;
}

/**
 * Detect entry points based on common patterns
 */
export function detectEntryPoints(rootDir, files) {
  const entryPatterns = [
    'src/index.ts', 'src/index.js', 'src/index.tsx', 'src/index.jsx',
    'src/main.ts', 'src/main.js', 'src/main.tsx', 'src/main.jsx',
    'src/app.ts', 'src/app.js', 'src/app.tsx', 'src/app.jsx',
    'src/server.ts', 'src/server.js',
    'index.ts', 'index.js',
    'main.py', 'app.py', 'manage.py', 'server.py',
    'src/main.py', 'src/app.py',
    'cmd/main.go', 'main.go',
    'src/main.rs', 'src/lib.rs',
    'app/page.tsx', 'app/page.jsx', // Next.js app router
    'pages/index.tsx', 'pages/index.jsx', // Next.js pages router
    'app/layout.tsx', 'app/layout.jsx',
  ];

  return entryPatterns.filter(p => files.includes(p));
}

/**
 * Find route/API files
 */
export function detectRouteFiles(files) {
  const routePatterns = [
    /routes?\//i,
    /api\//i,
    /controllers?\//i,
    /handlers?\//i,
    /endpoints?\//i,
    /views?\//i,
    /app\/api\//i,  // Next.js API routes
    /pages\/api\//i, // Next.js pages API
  ];

  return files.filter(f => routePatterns.some(p => p.test(f)));
}

/**
 * Find model/schema files
 */
export function detectModelFiles(files) {
  const modelPatterns = [
    /models?\//i,
    /schema/i,
    /entities?\//i,
    /types?\//i,
    /prisma\/schema/i,
    /migrations?\//i,
    /\.entity\./i,
    /\.model\./i,
  ];

  return files.filter(f => modelPatterns.some(p => p.test(f)));
}

/**
 * Categorize files by extension
 */
export function categorizeFiles(files) {
  const categories = {};
  for (const file of files) {
    const ext = path.extname(file) || '(no ext)';
    if (!categories[ext]) categories[ext] = [];
    categories[ext].push(file);
  }
  return categories;
}

/**
 * Detect folder purposes based on common naming conventions
 */
export function guessFolderPurpose(folderName) {
  const purposes = {
    'src': 'Main source code',
    'lib': 'Shared libraries and utilities',
    'app': 'Application entry / Next.js app router',
    'pages': 'Page components / Next.js pages router',
    'components': 'Reusable UI components',
    'ui': 'UI components',
    'hooks': 'Custom React hooks',
    'utils': 'Utility functions',
    'helpers': 'Helper functions',
    'services': 'Service layer / business logic',
    'api': 'API routes and handlers',
    'routes': 'Route definitions',
    'controllers': 'Request handlers / controllers',
    'middleware': 'Middleware functions',
    'models': 'Data models / database schemas',
    'entities': 'Database entities',
    'types': 'TypeScript type definitions',
    'interfaces': 'TypeScript interfaces',
    'config': 'Configuration files',
    'constants': 'Constant values',
    'tests': 'Test files',
    '__tests__': 'Test files',
    'test': 'Test files',
    'spec': 'Test specifications',
    'fixtures': 'Test fixtures',
    'mocks': 'Mock data for tests',
    'public': 'Static public assets',
    'static': 'Static files',
    'assets': 'Static assets (images, fonts, etc.)',
    'styles': 'CSS/SCSS stylesheets',
    'css': 'CSS stylesheets',
    'scripts': 'Build/deploy scripts',
    'bin': 'Executable scripts',
    'cmd': 'Command entry points (Go)',
    'internal': 'Internal packages (Go)',
    'pkg': 'Public packages (Go)',
    'migrations': 'Database migrations',
    'prisma': 'Prisma schema and migrations',
    'db': 'Database related files',
    'docs': 'Documentation',
    'templates': 'Template files',
    'views': 'View templates',
    'layouts': 'Layout components',
    'store': 'State management store',
    'state': 'State management',
    'context': 'React context providers',
    'providers': 'Provider components',
    'plugins': 'Plugin modules',
    'modules': 'Feature modules',
    'features': 'Feature-based code organization',
    'domain': 'Domain logic',
    'infra': 'Infrastructure code',
    'deploy': 'Deployment configuration',
    'docker': 'Docker configuration',
    '.github': 'GitHub Actions and config',
    'ci': 'CI/CD configuration',
  };
  return purposes[folderName] || 'Project folder';
}
