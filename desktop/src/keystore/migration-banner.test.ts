/**
 * Tests for the v1.49.650 keystore migration-banner state machine.
 *
 * Uses `StubKeystoreApi` from `./invoke` as the test double — same surface
 * the desktop UI uses for tests after v1.49.636 C1 flipped getKeystoreApi()
 * to TauriKeystoreApi in production.
 */

import { describe, it, expect, vi } from 'vitest';
import { MigrationBanner } from './migration-banner';
import { StubKeystoreApi } from './invoke';
import type { KeystoreStatus } from './types';

const ABSENT: KeystoreStatus = { state: 'absent', backend: null };
const ENCRYPTED_KEYRING: KeystoreStatus = { state: 'encrypted', backend: 'keyring' };
const PLAINTEXT: KeystoreStatus = { state: 'plaintext', backend: null };

describe('MigrationBanner — initial state', () => {
  it('starts in "idle" with shouldShow false', () => {
    const banner = new MigrationBanner(new StubKeystoreApi());
    const snap = banner.snapshot();
    expect(snap.state).toBe('idle');
    expect(snap.shouldShow).toBe(false);
    expect(snap.status).toBeNull();
    expect(snap.error).toBeNull();
  });
});

describe('MigrationBanner — refresh', () => {
  it('becomes visible when plaintext state is detected', async () => {
    const banner = new MigrationBanner(new StubKeystoreApi({ status: PLAINTEXT }));
    await banner.refresh();
    const snap = banner.snapshot();
    expect(snap.state).toBe('visible');
    expect(snap.shouldShow).toBe(true);
    expect(snap.status).toEqual(PLAINTEXT);
  });

  it('stays hidden when no plaintext file is detected (encrypted state)', async () => {
    const banner = new MigrationBanner(
      new StubKeystoreApi({ status: ENCRYPTED_KEYRING }),
    );
    await banner.refresh();
    expect(banner.snapshot().state).toBe('hidden');
    expect(banner.snapshot().shouldShow).toBe(false);
  });

  it('stays hidden when keystore is absent', async () => {
    const banner = new MigrationBanner(new StubKeystoreApi({ status: ABSENT }));
    await banner.refresh();
    expect(banner.snapshot().state).toBe('hidden');
  });

  it('records the error and hides the banner when status probe rejects', async () => {
    const api = new StubKeystoreApi();
    api.status = () => Promise.reject('backend exploded');
    const banner = new MigrationBanner(api);
    await banner.refresh();
    const snap = banner.snapshot();
    expect(snap.state).toBe('hidden');
    expect(snap.error).toBe('backend exploded');
    expect(snap.shouldShow).toBe(false);
  });
});

describe('MigrationBanner — migrate', () => {
  it('transitions visible → migrating → success and captures migrated_count', async () => {
    const banner = new MigrationBanner(
      new StubKeystoreApi({
        status: PLAINTEXT,
        migrateOutcome: { migrated_count: 3 },
      }),
    );
    await banner.refresh();
    expect(banner.snapshot().state).toBe('visible');
    await banner.migrate('hunter2');
    const snap = banner.snapshot();
    expect(snap.state).toBe('success');
    expect(snap.migratedCount).toBe(3);
    expect(snap.shouldShow).toBe(true);
  });

  it('transitions to "error" with the failure message on migrate rejection', async () => {
    const banner = new MigrationBanner(
      new StubKeystoreApi({
        status: PLAINTEXT,
        migrateError: 'invalid passphrase',
      }),
    );
    await banner.refresh();
    await banner.migrate('wrong');
    const snap = banner.snapshot();
    expect(snap.state).toBe('error');
    expect(snap.error).toBe('invalid passphrase');
  });

  it('omits passphrase on Path-1 hosts (no arg) and still succeeds', async () => {
    const api = new StubKeystoreApi({ status: PLAINTEXT });
    const spy = vi.spyOn(api, 'migrateV1ToV2');
    const banner = new MigrationBanner(api);
    await banner.refresh();
    await banner.migrate();
    expect(spy).toHaveBeenCalledWith(undefined);
    expect(banner.snapshot().state).toBe('success');
  });

  it('is a no-op when a migrate is already in flight', async () => {
    let resolveFn: ((v: { migrated_count: number }) => void) | null = null;
    const api = new StubKeystoreApi({ status: PLAINTEXT });
    const migrateSpy = vi.fn(
      () => new Promise<{ migrated_count: number }>((resolve) => { resolveFn = resolve; }),
    );
    api.migrateV1ToV2 = migrateSpy;
    const banner = new MigrationBanner(api);
    await banner.refresh();
    const first = banner.migrate();
    expect(banner.snapshot().state).toBe('migrating');
    await banner.migrate(); // re-entry — must not call again
    expect(migrateSpy).toHaveBeenCalledTimes(1);
    resolveFn!({ migrated_count: 1 });
    await first;
    expect(banner.snapshot().state).toBe('success');
  });
});

describe('MigrationBanner — dismiss + reset', () => {
  it('dismiss hides the banner and is sticky across refresh', async () => {
    const banner = new MigrationBanner(new StubKeystoreApi({ status: PLAINTEXT }));
    await banner.refresh();
    expect(banner.snapshot().state).toBe('visible');
    banner.dismiss();
    expect(banner.snapshot().state).toBe('dismissed');
    expect(banner.snapshot().shouldShow).toBe(false);
    await banner.refresh();
    expect(banner.snapshot().state).toBe('dismissed');
  });

  it('reset clears dismissal so a subsequent refresh can re-show', async () => {
    const banner = new MigrationBanner(new StubKeystoreApi({ status: PLAINTEXT }));
    await banner.refresh();
    banner.dismiss();
    banner.reset();
    expect(banner.snapshot().state).toBe('idle');
    expect(banner.snapshot().status).toBeNull();
    await banner.refresh();
    expect(banner.snapshot().state).toBe('visible');
  });
});

describe('MigrationBanner — onChange subscriptions', () => {
  it('notifies listeners on refresh + migrate transitions', async () => {
    const banner = new MigrationBanner(new StubKeystoreApi({ status: PLAINTEXT }));
    const listener = vi.fn();
    banner.onChange(listener);
    await banner.refresh();
    await banner.migrate('hunter2');
    // refresh fires once; migrate fires twice (migrating → success).
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('unsubscribe stops further notifications', async () => {
    const banner = new MigrationBanner(new StubKeystoreApi({ status: PLAINTEXT }));
    const listener = vi.fn();
    const unsubscribe = banner.onChange(listener);
    await banner.refresh();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await banner.migrate();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
