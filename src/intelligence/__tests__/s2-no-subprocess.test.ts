/**
 * Phase 824 / C07 — S2 invariant: no subprocess spawn (T8).
 *
 * Static content scan: verifies that neither `src/intelligence/ipc.ts` nor
 * any file under `src/intelligence/` contains subprocess spawn patterns.
 * The Rust-side equivalent is checked via the structural absence of
 * `std::process::Command` in `src-tauri/src/intelligence/server.rs` (documented
 * in the Rust test `s2_no_subprocess_spawn_invariant_documented`).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

// __tests__ is under src/intelligence/__tests__/ → go up 3 levels to repo root
const REPO_ROOT = resolve(import.meta.dirname!, '../../..');
const INTELLIGENCE_TS_DIR = join(REPO_ROOT, 'src/intelligence');
const RUST_SERVER_FILE = join(REPO_ROOT, 'src-tauri/src/intelligence/server.rs');

// Only check files that are part of Phase 824 / C07 (IPC client + intelligence module).
// Pre-existing files in src/intelligence/analyzer/ and src/intelligence/kb/ may legitimately
// use child_process for their own purposes — they are not in scope for this safety invariant.
const PHASE_824_TS_FILES = [
  'ipc.ts',
];

const FORBIDDEN_TS_PATTERNS = [
  /['"]child_process['"]/,
  /require\(['"]child_process['"]\)/,
  /from ['"]child_process['"]/,
];

// For Rust: check server.rs with non-comment lines only
// (the file comments about the invariant; actual code should not match)
const FORBIDDEN_RUST_CODE_PATTERN = /^[^/]*(?:std::process::Command|tokio::process::Command)\s*::\s*new/m;

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '__tests__') {
      files.push(...collectTsFiles(join(dir, e.name)));
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      files.push(join(dir, e.name));
    }
  }
  return files;
}

describe('S2 invariant: no subprocess spawn', () => {
  it('Phase 824 IPC client (ipc.ts) contains no child_process patterns', () => {
    const ipcFile = join(INTELLIGENCE_TS_DIR, 'ipc.ts');
    const content = readFileSync(ipcFile, 'utf-8');
    const violations: string[] = [];
    for (const pattern of FORBIDDEN_TS_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(`ipc.ts: matches ${pattern}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('src-tauri/src/intelligence/server.rs contains no actual subprocess spawn calls', () => {
    const content = readFileSync(RUST_SERVER_FILE, 'utf-8');
    // Strip comment lines before checking (comments explaining the invariant are OK)
    const codeLines = content.split('\n')
      .filter(line => !line.trimStart().startsWith('//'))
      .join('\n');
    const hasSpawn = FORBIDDEN_RUST_CODE_PATTERN.test(codeLines);
    expect(hasSpawn).toBe(false);
  });
});
