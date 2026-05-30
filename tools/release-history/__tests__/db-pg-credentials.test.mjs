/**
 * db.mjs — resolvePgCredentials: PG credential resolution + loud failure.
 *
 * Authored v1.49.916 (tool-robustness ship). Closes the opaque-error wart that
 * mis-led the v1.49.915 handoff: running a release-history tool directly (not
 * through tools/release-history/run-with-pg.mjs) left RH_POSTGRES_URL unset, so
 * `pg` surfaced the cryptic `SASL: ... client password must be a string` instead
 * of a message naming the fix. resolvePgCredentials is the testable seam (no
 * network, no `pg` import) that throws a loud, actionable error first.
 *
 * Per #10427 (failure-mode contracts): a load-bearing surface fails loudly with
 * a message that names the fix. The paired assertion below exercises the failure
 * path explicitly.
 */
import { describe, it, expect } from 'vitest';
import { resolvePgCredentials } from '../db.mjs';

describe('resolvePgCredentials — PG credential resolution + loud failure', () => {
  const cfg = { db: { driver: 'postgres', postgres_url_env: 'RH_POSTGRES_URL' } };

  it('prefers the connection-URL env var when set', () => {
    const out = resolvePgCredentials(cfg, { RH_POSTGRES_URL: 'postgresql://u:p@h:5432/d' });
    expect(out).toEqual({ connString: 'postgresql://u:p@h:5432/d' });
  });

  it('honors a custom postgres_url_env name', () => {
    const out = resolvePgCredentials({ db: { postgres_url_env: 'ALT_URL' } }, { ALT_URL: 'postgresql://x' });
    expect(out.connString).toBe('postgresql://x');
  });

  it('falls back to the PG* object config when only PGPASSWORD is set', () => {
    const out = resolvePgCredentials(cfg, {
      PGPASSWORD: 'secret', PG_HOST: 'db.local', PG_PORT: '6543', PG_USER: 'maple', PG_DB: 'tibsfox',
    });
    expect(out.connConfig).toEqual({
      host: 'db.local', port: 6543, user: 'maple', password: 'secret', database: 'tibsfox',
    });
  });

  it('defaults the PG* object fields when unspecified (preserves legacy behavior)', () => {
    const out = resolvePgCredentials(cfg, { PGPASSWORD: 'secret' });
    expect(out.connConfig).toEqual({
      host: 'localhost', port: 5432, user: 'postgres', password: 'secret', database: 'postgres',
    });
  });

  it('the URL env var wins over PGPASSWORD when both are present', () => {
    const out = resolvePgCredentials(cfg, { RH_POSTGRES_URL: 'postgresql://u@h/d', PGPASSWORD: 'secret' });
    expect(out).toEqual({ connString: 'postgresql://u@h/d' });
  });

  it('preserves the passwordless-auth edge: PG_HOST set without PGPASSWORD builds a config (pg/.pgpass decides), does NOT throw', () => {
    // Regression pin for the v916 review finding: the loud-error guard must NOT
    // eliminate passwordless local auth (trust/peer/~/.pgpass). A configured
    // host with no password is a legitimate state — let pg decide.
    const out = resolvePgCredentials(cfg, { PG_HOST: 'db.local', PG_PORT: '6543' });
    expect(out.connConfig).toEqual({
      host: 'db.local', port: 6543, user: 'postgres', password: undefined, database: 'postgres',
    });
  });

  it('throws a loud, actionable error ONLY when NO connection coordinate is resolvable (no URL, password, or host)', () => {
    expect(() => resolvePgCredentials(cfg, {})).toThrow(/no connection is resolvable/);
  });

  it('the error names the run-with-pg wrapper and the env var (not the opaque pg SASL string)', () => {
    let msg = '';
    try { resolvePgCredentials(cfg, {}); } catch (e) { msg = e.message; }
    expect(msg).toMatch(/run-with-pg\.mjs/);
    expect(msg).toMatch(/RH_POSTGRES_URL/);
    // Regression guard: we replace the opaque pg error, we do not echo it.
    expect(msg).not.toMatch(/SASL/);
  });

  it('uses the custom env-var name in the error message when configured', () => {
    let msg = '';
    try { resolvePgCredentials({ db: { postgres_url_env: 'ALT_URL' } }, {}); } catch (e) { msg = e.message; }
    expect(msg).toMatch(/ALT_URL/);
  });
});
