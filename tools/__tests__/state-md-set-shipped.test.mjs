/**
 * tools/state-md-set-shipped.mjs unit tests.
 *
 * Covers buildShippedStateContent: arg validation + content template + idempotency.
 * E2E spawn-driven write/check is exercised by integration-style spawnSync test.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildShippedStateContent } from '../state-md-set-shipped.mjs';

const TOOL_PATH = resolve(
  fileURLToPath(import.meta.url),
  '..',
  '..',
  'state-md-set-shipped.mjs',
);
const NORMALIZER_SRC = resolve(
  fileURLToPath(import.meta.url),
  '..',
  '..',
  'state-md-normalizer.mjs',
);
const PROSE_SRC = resolve(
  fileURLToPath(import.meta.url),
  '..',
  '..',
  'state-md-normalizer-prose.mjs',
);

// ─── unit tests for the content builder ──────────────────────────────────

describe('buildShippedStateContent', () => {
  it('emits canonical schema with all required fields', () => {
    const content = buildShippedStateContent({
      version: 'v1.49.813',
      name: 'Post-T14-reset STATE.md drift closure',
      degree: '1.178',
      predecessor: 'v1.49.812',
      predecessorSha: 'd30de2b4c',
      counterCadence: true,
      predecessorCounterCadence: false,
      date: '2026-05-27',
      lastUpdated: '2026-05-27T10:00:00.000Z',
    });

    expect(content).toContain('milestone: v1.49.813');
    expect(content).toContain('milestone_name: Post-T14-reset STATE.md drift closure');
    expect(content).toContain('status: shipped');
    expect(content).toContain('counter_cadence: true');
    expect(content).toContain('nasa_degree: "1.178"');
    expect(content).toContain('predecessor:');
    expect(content).toContain('  milestone: v1.49.812');
    expect(content).toContain('  shipped_at_sha: d30de2b4c');
    expect(content).toContain('Milestone: **v1.49.813 — Post-T14-reset STATE.md drift closure**');
    expect(content).toContain('Status: SHIPPED');
    expect(content).toContain('Opened: 2026-05-27');
  });

  it('is byte-deterministic for identical inputs (idempotent)', () => {
    const args = {
      version: 'v1.49.813',
      name: 'A milestone',
      degree: '1.178',
      predecessor: 'v1.49.812',
      predecessorSha: 'd30de2b4c',
      counterCadence: false,
      predecessorCounterCadence: false,
      date: '2026-05-27',
      lastUpdated: '2026-05-27T10:00:00.000Z',
    };
    const first = buildShippedStateContent(args);
    const second = buildShippedStateContent(args);
    expect(first).toBe(second);
  });

  it('strips leading v from version in milestone field', () => {
    const content = buildShippedStateContent({
      version: 'v1.49.813',
      name: 'A',
      degree: '1.178',
      predecessor: 'v1.49.812',
      predecessorSha: 'aaaaaaa',
      date: '2026-05-27',
      lastUpdated: '2026-05-27T10:00:00.000Z',
    });
    expect(content).toMatch(/^milestone: v1\.49\.813$/m);
    expect(content).not.toMatch(/^milestone: vv/m);
  });
});

// ─── CLI: arg validation ────────────────────────────────────────────────

describe('state-md-set-shipped CLI: arg validation', () => {
  it('exits 1 when --version is missing', () => {
    const result = spawnSync(
      'node',
      [TOOL_PATH, '--name', 'X', '--degree', '1.178', '--predecessor', 'v1.0.0', '--predecessor-sha', 'aaaaaaa'],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Missing required flags.*--version/);
  });

  it('exits 1 when --version does not match semver', () => {
    const result = spawnSync(
      'node',
      [TOOL_PATH, '--version', 'not-semver', '--name', 'X', '--degree', '1.178', '--predecessor', 'v1.0.0', '--predecessor-sha', 'aaaaaaa'],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/--version must match/);
  });

  it('exits 1 when --predecessor-sha is not hex', () => {
    const result = spawnSync(
      'node',
      [TOOL_PATH, '--version', 'v1.49.813', '--name', 'X', '--degree', '1.178', '--predecessor', 'v1.0.0', '--predecessor-sha', 'xyz!!'],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/--predecessor-sha must be 7-40 hex chars/);
  });
});

// ─── CLI: write + check end-to-end ──────────────────────────────────────

describe('state-md-set-shipped CLI: write + check', () => {
  it('writes a fresh STATE.md and the normalizer-check passes immediately', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'state-md-set-shipped-'));
    try {
      // Set up a minimal repo: .planning/ + tools/ with the actual normalizer + the prose helper.
      mkdirSync(join(tmp, '.planning'), { recursive: true });
      mkdirSync(join(tmp, 'tools'), { recursive: true });
      writeFileSync(
        join(tmp, 'tools', 'state-md-normalizer.mjs'),
        readFileSync(NORMALIZER_SRC, 'utf8'),
        'utf8',
      );
      writeFileSync(
        join(tmp, 'tools', 'state-md-normalizer-prose.mjs'),
        readFileSync(PROSE_SRC, 'utf8'),
        'utf8',
      );
      writeFileSync(
        join(tmp, 'tools', 'state-md-set-shipped.mjs'),
        readFileSync(TOOL_PATH, 'utf8'),
        'utf8',
      );
      // js-yaml dep — point at the real node_modules so the normalizer can require it.
      const setupNodeModules = spawnSync('ln', ['-s', resolve(process.cwd(), 'node_modules'), join(tmp, 'node_modules')], { encoding: 'utf8' });
      expect(setupNodeModules.status).toBe(0);

      const result = spawnSync(
        'node',
        [
          'tools/state-md-set-shipped.mjs',
          '--version', 'v1.49.813',
          '--name', 'Test milestone',
          '--degree', '1.178',
          '--predecessor', 'v1.49.812',
          '--predecessor-sha', 'd30de2b4c',
        ],
        { cwd: tmp, encoding: 'utf8' },
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/WROTE STATE.md for v1\.49\.813.*normalize-check PASS/);
      expect(existsSync(join(tmp, '.planning', 'STATE.md'))).toBe(true);

      // --check after the write should also pass (idempotency).
      const checkResult = spawnSync(
        'node',
        [
          'tools/state-md-set-shipped.mjs',
          '--check',
          '--version', 'v1.49.813',
          '--name', 'Test milestone',
          '--degree', '1.178',
          '--predecessor', 'v1.49.812',
          '--predecessor-sha', 'd30de2b4c',
        ],
        { cwd: tmp, encoding: 'utf8' },
      );
      expect(checkResult.status).toBe(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
