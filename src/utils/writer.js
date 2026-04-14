import fs from 'fs';
import path from 'path';

/**
 * Ensure a directory exists (recursive)
 */
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write a file, creating parent directories as needed
 */
export function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Append to a file, creating it if it doesn't exist
 */
export function appendFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, content, 'utf-8');
}

/**
 * Make a file executable
 */
export function makeExecutable(filePath) {
  fs.chmodSync(filePath, '755');
}

/**
 * Read and merge JSON settings (deep merge for hooks)
 */
export function mergeSettings(filePath, newSettings) {
  let existing = {};
  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      existing = {};
    }
  }
  const merged = deepMerge(existing, newSettings);
  writeFile(filePath, JSON.stringify(merged, null, 2) + '\n');
  return merged;
}

function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
      output[key] = [...target[key], ...source[key]];
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
