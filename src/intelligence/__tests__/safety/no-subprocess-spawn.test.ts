/**
 * Phase 826 / C13 — S2: No subprocess spawn
 *
 * Zero Command::new, std::process::Command, tokio::process::Command, spawn(
 * in any .rs file under src-tauri/intelligence/.
 *
 * G2 BLOCK — any FAIL blocks release.
 *
 * Phase 826 / D-26-08.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../../');
const RUST_INTELLIGENCE_DIR = join(REPO_ROOT, 'src-tauri/src/intelligence');

const FORBIDDEN_RUST_CODE_PATTERNS = [
  // Match actual code uses — not comments
  /^\s*[^/\s][^/]*Command::new/m,
  /^\s*[^/\s][^/]*std::process::Command/m,
  /^\s*[^/\s][^/]*tokio::process::Command/m,
  // spawn( that isn't in a comment
  /^\s*[^/\s][^/]*\.spawn\s*\(/m,
];

// S2 scope for TS: only the IPC client layer (ipc.ts) and web-tool entry points.
// The analyzer layer (src/intelligence/analyzer/) legitimately uses child_process
// for git operations; that is server-side not callable from UI.
const TS_SPAWN_PATTERNS = [
  /require\(['"]child_process['"]\)/,
  /from\s+['"]child_process['"]/,
  /from\s+['"]node:child_process['"]/,
];

// Files in the IPC/UI surface that must never spawn subprocesses
const IPC_SURFACE_FILES = [
  join(REPO_ROOT, 'src/intelligence/ipc.ts'),
];

const DESKTOP_INTELLIGENCE_DIR = join(REPO_ROOT, 'desktop/intelligence');

function collectRustFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory() && e.name !== 'target') {
      files.push(...collectRustFiles(full));
    } else if (e.isFile() && e.name.endsWith('.rs')) {
      files.push(full);
    }
  }
  return files;
}

function collectTsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '__tests__') continue;
      files.push(...collectTsFiles(full));
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      files.push(full);
    }
  }
  return files;
}

describe('S2: no subprocess spawn in intelligence code (G2 BLOCK)', () => {
  it('src-tauri/src/intelligence/ .rs files contain zero subprocess spawn patterns', () => {
    const files = collectRustFiles(RUST_INTELLIGENCE_DIR);
    expect(files.length, 'Expected at least one .rs file in src-tauri/src/intelligence/').toBeGreaterThan(0);

    const offenders: Array<{ file: string; pattern: string; line: number }> = [];

    for (const f of files) {
      const lines = readFileSync(f, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        // Skip comment lines
        if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
        for (const pat of FORBIDDEN_RUST_CODE_PATTERNS) {
          // Test line-by-line for forbidden patterns
          if (pat.test(line)) {
            offenders.push({
              file: f.replace(REPO_ROOT + '/', ''),
              pattern: pat.source,
              line: i + 1,
            });
          }
        }
      }
    }

    expect(offenders, `S2 VIOLATION: subprocess spawn found in Rust intelligence code:\n${
      offenders.map((o) => `  ${o.file}:${o.line} — ${o.pattern}`).join('\n')
    }`).toHaveLength(0);
  });

  it('ipc.ts (Tauri UI surface) contains zero child_process spawn patterns', () => {
    // S2 scope: only the UI-callable IPC surface (not the server-side analyzer).
    // The analyzer legitimately uses git child_process for churn/complexity;
    // that code path is NOT callable from the web UI.
    const offenders: Array<{ file: string; pattern: string; line: number }> = [];

    for (const f of IPC_SURFACE_FILES) {
      if (!existsSync(f)) continue;
      const lines = readFileSync(f, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        for (const pat of TS_SPAWN_PATTERNS) {
          if (pat.test(line)) {
            offenders.push({
              file: f.replace(REPO_ROOT + '/', ''),
              pattern: pat.source,
              line: i + 1,
            });
          }
        }
      }
    }

    expect(offenders, `S2 VIOLATION: child_process spawn found in IPC surface files:\n${
      offenders.map((o) => `  ${o.file}:${o.line} — ${o.pattern}`).join('\n')
    }`).toHaveLength(0);
  });

  it('desktop/intelligence/ (webview) contains zero child_process spawn patterns', () => {
    // Desktop webview must never spawn child processes
    const files = collectTsFiles(DESKTOP_INTELLIGENCE_DIR);
    const offenders: Array<{ file: string; pattern: string; line: number }> = [];

    for (const f of files) {
      const lines = readFileSync(f, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        for (const pat of TS_SPAWN_PATTERNS) {
          if (pat.test(line)) {
            offenders.push({
              file: f.replace(REPO_ROOT + '/', ''),
              pattern: pat.source,
              line: i + 1,
            });
          }
        }
      }
    }

    expect(offenders, `S2 VIOLATION: child_process spawn found in desktop/intelligence/:\n${
      offenders.map((o) => `  ${o.file}:${o.line} — ${o.pattern}`).join('\n')
    }`).toHaveLength(0);
  });
});
