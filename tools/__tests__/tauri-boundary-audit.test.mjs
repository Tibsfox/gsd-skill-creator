/**
 * C2 — tauri-boundary-audit tests (v1.49.634 §15).
 *
 * 4 hermetic tests against the audit CLI. The first three drop synthetic
 * fixtures into a temp tree mirroring the repo layout and invoke the audit
 * with cwd pinned to that fixture; the fourth dry-runs pre-tag-gate step 9.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');
const AUDIT_SCRIPT = join(REPO_ROOT, 'tools', 'tauri-boundary-audit.mjs');

let tmpRoot;

function makeFixtureRepo() {
  const root = mkdtempSync(join(tmpdir(), 'tauri-boundary-audit-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'desktop'), { recursive: true });
  mkdirSync(join(root, 'tools'), { recursive: true });
  cpSync(AUDIT_SCRIPT, join(root, 'tools', 'tauri-boundary-audit.mjs'));
  return root;
}

function runAuditIn(root, args = []) {
  const result = spawnSync(process.execPath, [join(root, 'tools', 'tauri-boundary-audit.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

beforeEach(() => {
  tmpRoot = makeFixtureRepo();
});

afterEach(() => {
  if (tmpRoot && existsSync(tmpRoot)) {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

describe('tauri-boundary-audit (C2 v1.49.634)', () => {
  it('audit detects src/ importing @tauri-apps/api', () => {
    writeFileSync(
      join(tmpRoot, 'src', 'bad.ts'),
      "import { invoke } from '@tauri-apps/api/core';\nexport function call() { return invoke('foo'); }\n",
    );
    const { status, stdout } = runAuditIn(tmpRoot);
    expect(status).toBe(10);
    expect(stdout).toContain('src/bad.ts');
    expect(stdout).toContain('src-imports-tauri');
    expect(stdout).toContain('@tauri-apps/api/core');
  });

  it('audit detects desktop/ importing node: builtin', () => {
    writeFileSync(
      join(tmpRoot, 'desktop', 'bad.ts'),
      "import { readFileSync } from 'node:fs';\nexport function load() { return readFileSync('/etc/hosts', 'utf8'); }\n",
    );
    const { status, stdout } = runAuditIn(tmpRoot);
    expect(status).toBe(10);
    expect(stdout).toContain('desktop/bad.ts');
    expect(stdout).toContain('desktop-imports-node');
    expect(stdout).toContain('node:fs');
  });

  it('audit passes on clean tree', () => {
    writeFileSync(
      join(tmpRoot, 'src', 'good.ts'),
      "// JSDoc example: import { invoke } from '@tauri-apps/api/core';\nexport const ok = 1;\n",
    );
    writeFileSync(
      join(tmpRoot, 'desktop', 'good.ts'),
      "/* readFileSync from 'node:fs' is fine in a comment */\nexport const ok = 1;\n",
    );
    writeFileSync(
      join(tmpRoot, 'desktop', 'bad.test.ts'),
      "import { randomFillSync } from 'node:crypto';\nexport const seeded = randomFillSync(new Uint8Array(8));\n",
    );
    const { status, stdout } = runAuditIn(tmpRoot);
    expect(status).toBe(0);
    expect(stdout).toContain('CLEAN');
  });

  it('pre-tag-gate step 9 invokes tauri-boundary-audit', () => {
    // Verify the pre-tag-gate script has step 9 wired to the audit. We do not
    // execute the full pre-tag-gate here (too heavy — would also run build +
    // vitest + CI gate). Instead we assert the source contains the step-9
    // invocation plus the override env var name documented in the C2 spec.
    const preTagGateSh = execFileSync('cat', [join(REPO_ROOT, 'tools', 'pre-tag-gate.sh')], { encoding: 'utf8' });
    expect(preTagGateSh).toMatch(/step 9\/\d+: tauri-boundary/);
    expect(preTagGateSh).toContain('tools/tauri-boundary-audit.mjs');
    expect(preTagGateSh).toContain('SC_SKIP_TAURI_BOUNDARY_GATE');
    expect(preTagGateSh).toMatch(/exit\s+9/);
  });
});
