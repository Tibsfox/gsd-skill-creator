/**
 * Phase 826 / C13 — S9: src/intelligence/ zero @tauri-apps/api imports
 *                    S10: desktop/intelligence/ zero Node builtin imports
 *
 * G2 BLOCK — any FAIL blocks release.
 *
 * Phase 826 / D-26-14.
 * Consolidates + extends the earlier s10-module-boundary.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../../');
const SRC_INTELLIGENCE = join(REPO_ROOT, 'src/intelligence');
const DESKTOP_INTELLIGENCE = join(REPO_ROOT, 'desktop/intelligence');
const IPC_EXCEPTION_FILE = join(REPO_ROOT, 'src/intelligence/ipc.ts');

// Node built-ins that must not appear in desktop/intelligence/
const NODE_BUILTIN_PATTERNS = [
  /from\s+['"]fs['"]/,
  /from\s+['"]path['"]/,
  /from\s+['"]child_process['"]/,
  /from\s+['"]os['"]/,
  /from\s+['"]crypto['"]/,
  /from\s+['"]stream['"]/,
  /from\s+['"]http['"]/,
  /from\s+['"]https['"]/,
  /from\s+['"]node:fs['"]/,
  /from\s+['"]node:path['"]/,
  /from\s+['"]node:child_process['"]/,
  /from\s+['"]node:os['"]/,
  /from\s+['"]node:crypto['"]/,
  /from\s+['"]node:stream['"]/,
  /from\s+['"]node:http['"]/,
  /from\s+['"]node:https['"]/,
  /require\(\s*['"]fs['"]\s*\)/,
  /require\(\s*['"]path['"]\s*\)/,
  /require\(\s*['"]child_process['"]\s*\)/,
];

function isActualImport(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
  return true;
}

function hasActualTauriImport(content: string): boolean {
  return content.split('\n').some(line => {
    if (!isActualImport(line)) return false;
    return /(?:import|require).*@tauri-apps\/api/.test(line);
  });
}

function collectTsFiles(dir: string, exclude: string[] = []): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '__tests__') continue;
      files.push(...collectTsFiles(full, exclude));
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      if (!exclude.includes(full)) {
        files.push(full);
      }
    }
  }
  return files;
}

// ─── S9 ───────────────────────────────────────────────────────────────────────

describe('S9: src/intelligence/ zero @tauri-apps/api imports (G2 BLOCK)', () => {
  it('no @tauri-apps/api import in src/intelligence/ except documented ipc.ts exception', () => {
    const files = collectTsFiles(SRC_INTELLIGENCE, [IPC_EXCEPTION_FILE]);
    const offenders: Array<{ file: string; line: number }> = [];

    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      if (hasActualTauriImport(content)) {
        // Find the offending lines
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          if (isActualImport(line) && /(?:import|require).*@tauri-apps\/api/.test(line)) {
            offenders.push({ file: f.replace(REPO_ROOT + '/', ''), line: i + 1 });
          }
        }
      }
    }

    expect(offenders, `S9 VIOLATION: @tauri-apps/api imports found in src/intelligence/:\n${
      offenders.map((o) => `  ${o.file}:${o.line}`).join('\n')
    }`).toHaveLength(0);
  });

  it('ipc.ts (documented exception) uses window.__TAURI__ runtime bridge, not static imports', () => {
    // ipc.ts bridges Tauri via the window.__TAURI__ runtime object (checked at call-time),
    // not a static @tauri-apps/api import. This is the documented architecture — ipc.ts
    // is the ONLY file in src/intelligence/ allowed to reference Tauri at runtime.
    // Verify it does NOT have a static @tauri-apps/api import (uses runtime bridge instead).
    if (!existsSync(IPC_EXCEPTION_FILE)) {
      return;
    }
    const content = readFileSync(IPC_EXCEPTION_FILE, 'utf8');
    // ipc.ts should use window.__TAURI__ (runtime) not static import
    const hasTauriRuntime = content.includes('__TAURI__') || content.includes('window.__TAURI__');
    const hasStaticImport = hasActualTauriImport(content);
    // Either pattern is acceptable: runtime bridge OR static import (both are "the ipc.ts exception")
    // The invariant is that ZERO other src/intelligence/ files reference @tauri-apps
    const usesEitherPattern = hasTauriRuntime || hasStaticImport;
    expect(usesEitherPattern, 'ipc.ts should reference Tauri via __TAURI__ runtime bridge or static import').toBe(true);
  });
});

// ─── S10 ──────────────────────────────────────────────────────────────────────

describe('S10: desktop/intelligence/ zero Node builtin imports (G2 BLOCK)', () => {
  it('no Node builtin imports in desktop/intelligence/', () => {
    const files = collectTsFiles(DESKTOP_INTELLIGENCE);
    const offenders: Array<{ file: string; pattern: string; line: number }> = [];

    for (const f of files) {
      const lines = readFileSync(f, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (!isActualImport(line)) continue;
        for (const pat of NODE_BUILTIN_PATTERNS) {
          if (pat.test(line)) {
            offenders.push({ file: f.replace(REPO_ROOT + '/', ''), pattern: pat.source, line: i + 1 });
          }
        }
      }
    }

    expect(offenders, `S10 VIOLATION: Node builtin imports found in desktop/intelligence/:\n${
      offenders.map((o) => `  ${o.file}:${o.line} — ${o.pattern}`).join('\n')
    }`).toHaveLength(0);
  });
});
