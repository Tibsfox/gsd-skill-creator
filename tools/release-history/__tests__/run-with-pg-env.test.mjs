/**
 * C08 — run-with-pg.mjs env-file resolution test
 *
 * Asserts that the wrapper honors the env-file override precedence:
 *   1. RH_ENV_FILE=<path>        → preferred
 *   2. ARTEMIS_REPO_ENV=<path>   → deprecated alias (with notice)
 *   3. <repo-root>/.env          → default
 *
 * Authored 2026-04-28 in v1.49.585 component C08 (full-deprecation rewrite).
 * Spec: .planning/missions/v1-49-585-concerns-cleanup/components/08-artemis-env-var.md
 *
 * NOTE: tools/** is outside the current vitest include glob; this test is
 * forward-ready. The same assertions are exercised inline at C08 / G1
 * verification time via direct shell invocation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');
const WRAPPER = join(REPO_ROOT, 'tools', 'release-history', 'run-with-pg.mjs');

describe('C08 — run-with-pg.mjs env-file resolution', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'run-with-pg-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function run(envOverrides) {
    const env = { ...process.env, ...envOverrides };
    // Strip these so the test fully controls precedence
    delete env.RH_ENV_FILE;
    delete env.ARTEMIS_REPO_ENV;
    Object.assign(env, envOverrides);
    return spawnSync('node', [WRAPPER, '--check'], { env, encoding: 'utf-8' });
  }

  it('CF-C08-01: default → uses <repo-root>/.env (assumes dev environment has it)', () => {
    const result = run({});
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('default <repo-root>/.env'.toLowerCase().slice(0, 5)) // partial match
      || expect(result.stdout).toMatch(/--check OK/);
  });

  it('CF-C08-02: RH_ENV_FILE override honored when valid', () => {
    const altEnv = join(tmpDir, '.env');
    writeFileSync(altEnv, 'RH_POSTGRES_URL=postgresql://test:test@localhost:5432/test\n');
    const result = run({ RH_ENV_FILE: altEnv });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/--check OK/);
  });

  it('CF-C08-03: nonexistent path → exit 2 with structured error', () => {
    const result = run({ RH_ENV_FILE: '/nonexistent/path/.env' });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/PG credentials .env file not found/);
    expect(result.stderr).toMatch(/RH_ENV_FILE/);
  });

  it('CF-C08-04: ARTEMIS_REPO_ENV (deprecated) still honored, emits deprecation notice', () => {
    const altEnv = join(tmpDir, '.env');
    writeFileSync(altEnv, 'RH_POSTGRES_URL=postgresql://test:test@localhost:5432/test\n');
    const result = run({ ARTEMIS_REPO_ENV: altEnv });
    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/DEPRECATION NOTICE/);
    expect(result.stderr).toMatch(/ARTEMIS_REPO_ENV is deprecated/);
  });

  it('CF-C08-05: RH_ENV_FILE wins over ARTEMIS_REPO_ENV (precedence)', () => {
    const goodEnv = join(tmpDir, 'good.env');
    const badEnv = join(tmpDir, 'bad-non-existent.env');  // not written
    writeFileSync(goodEnv, 'RH_POSTGRES_URL=postgresql://test:test@localhost:5432/test\n');
    const result = run({ RH_ENV_FILE: goodEnv, ARTEMIS_REPO_ENV: badEnv });
    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/DEPRECATION NOTICE/); // RH_ENV_FILE wins, no notice
  });

  it('CF-C08-06: missing RH_POSTGRES_URL falls back to PG* keys', () => {
    const altEnv = join(tmpDir, '.env');
    writeFileSync(altEnv,
      'PGHOST=localhost\nPGPORT=5432\nPGUSER=test\nPGDATABASE=test\nPGPASSWORD=test\n');
    const result = run({ RH_ENV_FILE: altEnv });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/derived from PG\* keys/);
  });

  it('CF-C08-07: missing both RH_POSTGRES_URL AND PG* keys → fatal', () => {
    const altEnv = join(tmpDir, '.env');
    writeFileSync(altEnv, '# empty\n');
    const result = run({ RH_ENV_FILE: altEnv });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/has neither RH_POSTGRES_URL/);
  });
});
