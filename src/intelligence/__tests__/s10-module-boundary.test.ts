/**
 * Phase 824 / C07+C08+C09 — S10 module boundary invariant.
 *
 * Verifies:
 * 1. `desktop/intelligence/` contains zero Node.js module imports
 *    (no `require('fs')`, `require('path')`, `import ... from 'fs'`, etc.)
 * 2. `src/intelligence/` has no imports from `@tauri-apps/api/*` EXCEPT
 *    the documented exception at `src/intelligence/ipc.ts` (D-24-02).
 * 3. `desktop/intelligence/` has no `anthropic` SDK imports (S1/S7).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// __tests__ is under src/intelligence/__tests__/ → go up 3 levels to repo root
const REPO_ROOT = resolve(import.meta.dirname!, '../../..');
const DESKTOP_INTELLIGENCE_DIR = join(REPO_ROOT, 'desktop/intelligence');
const SRC_INTELLIGENCE_DIR = join(REPO_ROOT, 'src/intelligence');
const IPC_EXCEPTION_FILE = join(REPO_ROOT, 'src/intelligence/ipc.ts');

const NODE_BUILTIN_PATTERNS = [
  /require\(['"]fs['"]\)/,
  /require\(['"]path['"]\)/,
  /require\(['"]child_process['"]\)/,
  /require\(['"]crypto['"]\)/,
  /require\(['"]os['"]\)/,
  /from ['"]fs['"]/,
  /from ['"]path['"]/,
  /from ['"]child_process['"]/,
  /from ['"]crypto['"]/,
  /from ['"]os['"]/,
  /import \* from ['"]node:/,
  /from ['"]node:fs['"]/,
  /from ['"]node:path['"]/,
];

/** Returns true if the file content contains an actual import from @tauri-apps/api (not just a comment). */
function hasActualTauriImport(content: string): boolean {
  return content.split('\n').some(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
    return /(?:import|require).*@tauri-apps\/api/.test(line);
  });
}
const ANTHROPIC_PATTERN = /anthropic/;

function collectFiles(dir: string, opts: { excludeTests?: boolean } = {}): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue;
      if (opts.excludeTests && e.name === '__tests__') continue;
      files.push(...collectFiles(join(dir, e.name), opts));
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx') || e.name.endsWith('.js'))) {
      files.push(join(dir, e.name));
    }
  }
  return files;
}

describe('S10 module boundary: desktop/intelligence has zero Node imports', () => {
  it('no Node builtin imports in desktop/intelligence/', () => {
    const files = collectFiles(DESKTOP_INTELLIGENCE_DIR);
    // If directory doesn't exist yet (C08/C09 not yet written), skip gracefully.
    if (files.length === 0) return;

    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const pattern of NODE_BUILTIN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${file}: matches ${pattern}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('S10 module boundary: src/intelligence Tauri API isolation', () => {
  it('only ipc.ts may import @tauri-apps/api; all other src/intelligence files do not', () => {
    const files = collectFiles(SRC_INTELLIGENCE_DIR, { excludeTests: true });
    const violations: string[] = [];
    for (const file of files) {
      // ipc.ts has the documented exception (D-24-02).
      // Note: ipc.ts actually uses globalThis.__TAURI__ for dual-mode compatibility,
      // so it also doesn't have an import statement, but we keep the exception here
      // for forward-compatibility if Phase 825 wires in the actual import.
      if (file === IPC_EXCEPTION_FILE) continue;
      const content = readFileSync(file, 'utf-8');
      if (hasActualTauriImport(content)) {
        violations.push(`${file}: unexpected @tauri-apps/api import outside ipc.ts`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('S1/S7: no anthropic SDK imports in desktop/intelligence/', () => {
  it('desktop/intelligence has no anthropic imports', () => {
    const files = collectFiles(DESKTOP_INTELLIGENCE_DIR);
    if (files.length === 0) return;
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      if (ANTHROPIC_PATTERN.test(content)) {
        violations.push(`${file}: anthropic import found`);
      }
    }
    expect(violations).toEqual([]);
  });
});
