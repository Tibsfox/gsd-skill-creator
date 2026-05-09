/**
 * Component 02 — env-loader.ts unit tests.
 *
 * 4 tests covering the env-loading discipline:
 *   1. RH_POSTGRES_URL direct path (process env var)
 *   2. PGHOST+PGUSER+... composition from .env file
 *   3. Missing env returns { ok: false, reason: 'pg-not-configured' }
 *   4. RH_ENV_FILE override respects a custom .env path
 *
 * PG_TEST=1 gated integration tests are in the same file, guarded by
 * `skipIf(process.env.PG_TEST !== '1')` so they are excluded from
 * default `npx vitest run` runs (CI does not need PG).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadPgEnv,
  parseEnvFile,
  composeUrlFromPgKeys,
} from '../env-loader.js';

// ---------------------------------------------------------------------------
// Helpers to save/restore process.env without leaking across tests
// ---------------------------------------------------------------------------

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {
    RH_POSTGRES_URL: process.env['RH_POSTGRES_URL'],
    RH_ENV_FILE: process.env['RH_ENV_FILE'],
    ARTEMIS_REPO_ENV: process.env['ARTEMIS_REPO_ENV'],
    PGHOST: process.env['PGHOST'],
    PGPORT: process.env['PGPORT'],
    PGUSER: process.env['PGUSER'],
    PGDATABASE: process.env['PGDATABASE'],
    PGPASSWORD: process.env['PGPASSWORD'],
  };
  // Clear all PG-related env vars before each test.
  for (const key of Object.keys(savedEnv)) {
    delete process.env[key];
  }
});

afterEach(() => {
  // Restore original env.
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
});

// ---------------------------------------------------------------------------
// Test 1 — RH_POSTGRES_URL direct path (process env var)
// ---------------------------------------------------------------------------

describe('env-loader: RH_POSTGRES_URL direct path', () => {
  it('returns the URL verbatim when RH_POSTGRES_URL is set in process.env', () => {
    const expected = 'postgresql://user:pass@host:5432/db';
    process.env['RH_POSTGRES_URL'] = expected;

    const result = loadPgEnv(undefined, true);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// Test 2 — PGHOST+PGUSER+... composition from .env file
// ---------------------------------------------------------------------------

describe('env-loader: PGHOST+PGUSER+... composition from .env file', () => {
  it('composes a valid postgresql:// URL from PG* key set in a temp .env file', () => {
    // Write a temp .env with component keys, no RH_POSTGRES_URL.
    const tmpDir = mkdtempSync(join(tmpdir(), 'scribe-pg-test-'));
    const envPath = join(tmpDir, '.env');
    writeFileSync(
      envPath,
      [
        '# comment line — ignored',
        'PGHOST=localhost',
        'PGPORT=5432',
        'PGUSER=maple',
        'PGPASSWORD=secret',
        'PGDATABASE=tibsfox',
      ].join('\n'),
      'utf8',
    );

    try {
      process.env['RH_ENV_FILE'] = envPath;
      const result = loadPgEnv(undefined, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // URL must be a valid postgresql:// URL with all components.
        expect(result.url).toMatch(/^postgresql:\/\//);
        expect(result.url).toContain('maple');
        expect(result.url).toContain('localhost');
        expect(result.url).toContain('5432');
        expect(result.url).toContain('tibsfox');
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('composeUrlFromPgKeys returns a well-formed URL when all keys present', () => {
    const kv = {
      PGHOST: 'db.example.com',
      PGPORT: '5432',
      PGUSER: 'admin',
      PGPASSWORD: 'p@ss!word',
      PGDATABASE: 'mydb',
    };
    const url = composeUrlFromPgKeys(kv);
    expect(url).not.toBeNull();
    expect(url).toMatch(/^postgresql:\/\//);
    // Password with special chars must be percent-encoded.
    expect(url).toContain(encodeURIComponent('p@ss!word'));
  });

  it('composeUrlFromPgKeys returns null when keys are missing', () => {
    const kv = { PGHOST: 'localhost' }; // missing 4 required keys
    expect(composeUrlFromPgKeys(kv)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Missing env returns { ok: false, reason: 'pg-not-configured' }
// ---------------------------------------------------------------------------

describe('env-loader: missing env returns pg-not-configured', () => {
  it('returns ok=false with reason=pg-not-configured when no PG vars and no .env', () => {
    // Use a non-existent directory so the default .env path is also absent.
    const tmpDir = mkdtempSync(join(tmpdir(), 'scribe-pg-test-'));
    // Set RH_ENV_FILE to a path that does not exist.
    const missingEnvPath = join(tmpDir, 'nonexistent', '.env');
    process.env['RH_ENV_FILE'] = missingEnvPath;

    try {
      const result = loadPgEnv(undefined, true);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('pg-not-configured');
        expect(typeof result.hint).toBe('string');
        expect(result.hint.length).toBeGreaterThan(0);
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// Test 4 — RH_ENV_FILE override respects a custom .env path
// ---------------------------------------------------------------------------

describe('env-loader: RH_ENV_FILE override', () => {
  it('reads credentials from the path specified in RH_ENV_FILE, not the default .env', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'scribe-pg-test-'));
    const customEnvPath = join(tmpDir, 'custom.env');
    const expectedUrl = 'postgresql://customuser:custompass@custom-host:9999/customdb';
    writeFileSync(customEnvPath, `RH_POSTGRES_URL=${expectedUrl}\n`, 'utf8');

    try {
      process.env['RH_ENV_FILE'] = customEnvPath;
      const result = loadPgEnv(undefined, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.url).toBe(expectedUrl);
        expect(result.source).toBe('RH_ENV_FILE env var');
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// parseEnvFile internal — matched-quote stripping + lone apostrophe preservation
// ---------------------------------------------------------------------------

describe('parseEnvFile — quote handling', () => {
  it('strips matched double-quote pairs', () => {
    const kv = parseEnvFile('KEY="hello world"');
    expect(kv['KEY']).toBe('hello world');
  });

  it('strips matched single-quote pairs', () => {
    const kv = parseEnvFile("KEY='hello world'");
    expect(kv['KEY']).toBe('hello world');
  });

  it('preserves a lone leading apostrophe (FTP_PASS gotcha)', () => {
    // The FTP password starts with a literal `'` — a lone leading apostrophe
    // must NOT be stripped. Only matched pairs are stripped.
    const kv = parseEnvFile("FTP_PASS='password_value");
    // The value starts with `'` (not a matched pair) → preserved verbatim.
    expect(kv['FTP_PASS']).toBe("'password_value");
  });

  it('ignores comment lines and blank lines', () => {
    const kv = parseEnvFile(
      [
        '# this is a comment',
        '',
        'FOO=bar',
        '  ',
        '# another comment',
        'BAZ=qux',
      ].join('\n'),
    );
    expect(kv['FOO']).toBe('bar');
    expect(kv['BAZ']).toBe('qux');
    expect(Object.keys(kv)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// PG_TEST=1 gated integration test
// ---------------------------------------------------------------------------

const pgTestEnabled = process.env['PG_TEST'] === '1';

describe.skipIf(!pgTestEnabled)(
  'env-loader: live PG connectivity (PG_TEST=1)',
  () => {
    it('loadPgEnv resolves a URL that can connect to a live PG instance', async () => {
      // Dynamic import — `pg` is optional; test is only gated when PG_TEST=1.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pgMod = await import('pg') as any;
      const PgPool = pgMod.default?.Pool ?? pgMod.Pool;
      const result = loadPgEnv(undefined, false);

      if (!result.ok) {
        throw new Error(
          `loadPgEnv failed: ${result.reason} — ${result.hint}`,
        );
      }

      const pool = new PgPool({ connectionString: result.url });
      try {
        const { rows } = await pool.query('SELECT 1 AS alive');
        expect(rows[0]).toMatchObject({ alive: 1 });
      } finally {
        await pool.end();
      }
    });
  },
);
