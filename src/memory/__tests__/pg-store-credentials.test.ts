/**
 * PG-2 — PgStore credential resolution.
 *
 * The store must reach the real database via the canonical RH_POSTGRES_URL
 * (process.env or repo .env) rather than defaulting to foxy@localhost with an
 * empty password. We mock `pg` to capture the Pool configuration the store
 * constructs, without needing a live database.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const poolConfigs: Array<Record<string, unknown>> = [];

class MockPool {
  constructor(cfg: Record<string, unknown>) {
    poolConfigs.push(cfg);
  }
  async query(): Promise<{ rows: unknown[] }> {
    return { rows: [] };
  }
  // applyMigrations() borrows a dedicated client (PG-6) to run the migration
  // with statement_timeout disabled, then release(true)s it.
  async connect(): Promise<{ query: () => Promise<{ rows: unknown[] }>; release: (destroy?: boolean) => void }> {
    return { query: async () => ({ rows: [] }), release: () => {} };
  }
  on(): void {
    /* pg Pool emits 'error' for idle-client faults; the store registers a listener */
  }
  async end(): Promise<void> {}
}

vi.mock('pg', () => ({ default: { Pool: MockPool } }));

// Imported after the mock is registered (vi.mock is hoisted).
const { PgStore } = await import('../pg-store.js');

describe('PgStore credential resolution (PG-2)', () => {
  const savedUrl = process.env.RH_POSTGRES_URL;

  beforeEach(() => {
    poolConfigs.length = 0;
  });

  afterEach(() => {
    if (savedUrl === undefined) delete process.env.RH_POSTGRES_URL;
    else process.env.RH_POSTGRES_URL = savedUrl;
  });

  it('uses RH_POSTGRES_URL as the Pool connection string when no config is given', async () => {
    process.env.RH_POSTGRES_URL = 'postgresql://tester:pw@db.example:6543/testdb';
    const store = new PgStore();
    await store.init();

    expect(poolConfigs).toHaveLength(1);
    expect(poolConfigs[0]).toMatchObject({
      connectionString: 'postgresql://tester:pw@db.example:6543/testdb',
    });
    // The connectionString branch must not also pass discrete host fields.
    expect(poolConfigs[0]).not.toHaveProperty('host');
    // Pool hardening travels with every Pool: bounded connect + a client label.
    expect(poolConfigs[0]).toMatchObject({
      connectionTimeoutMillis: 10_000,
      application_name: 'gsd-skill-creator/pg-store',
    });
  });

  it('honors an explicit connectionString over the env', async () => {
    process.env.RH_POSTGRES_URL = 'postgresql://from-env@db/ignored';
    const store = new PgStore({ connectionString: 'postgresql://explicit@db/wins' });
    await store.init();

    expect(poolConfigs[0]).toMatchObject({
      connectionString: 'postgresql://explicit@db/wins',
    });
  });

  it('falls back to discrete host/user fields when an explicit host is pinned', async () => {
    delete process.env.RH_POSTGRES_URL;
    const store = new PgStore({
      host: '127.0.0.1',
      user: 'foxy',
      password: '',
      database: 'tibsfox',
    });
    await store.init();

    expect(poolConfigs).toHaveLength(1);
    expect(poolConfigs[0]).not.toHaveProperty('connectionString');
    expect(poolConfigs[0]).toMatchObject({ host: '127.0.0.1', database: 'tibsfox' });
  });
});
