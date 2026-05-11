/**
 * Tests for the v1.49.650 keystore Tauri-command wrappers.
 *
 * Covers the stub implementation (used at v1.49.650 phase-(g)) and the
 * production wrapper (kept in tree for the follow-on milestone that wires
 * the Rust commands).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

import {
  StubKeystoreApi,
  TauriKeystoreApi,
  DEFAULT_STUB_MOCKS,
  getKeystoreApi,
} from './invoke';
import type { KeystoreStatus } from './types';

beforeEach(() => {
  mockInvoke.mockReset();
});

describe('StubKeystoreApi', () => {
  it('returns DEFAULT_STUB_MOCKS.status when no override supplied', async () => {
    const api = new StubKeystoreApi();
    expect(await api.status()).toEqual(DEFAULT_STUB_MOCKS.status);
  });

  it('returns mock override for status', async () => {
    const override: KeystoreStatus = { state: 'encrypted', backend: 'keyring' };
    const api = new StubKeystoreApi({ status: override });
    expect(await api.status()).toEqual(override);
  });

  it('returns DEFAULT_STUB_MOCKS.migrateOutcome on migrate', async () => {
    const api = new StubKeystoreApi();
    expect(await api.migrateV1ToV2()).toEqual(
      DEFAULT_STUB_MOCKS.migrateOutcome,
    );
  });

  it('returns mock override for migrateOutcome', async () => {
    const api = new StubKeystoreApi({ migrateOutcome: { migrated_count: 7 } });
    expect(await api.migrateV1ToV2('any-pass')).toEqual({ migrated_count: 7 });
  });

  it('rejects with migrateError string when configured', async () => {
    const api = new StubKeystoreApi({ migrateError: 'invalid passphrase' });
    await expect(api.migrateV1ToV2('wrong')).rejects.toBe('invalid passphrase');
  });

  it('resolves void on set when no error configured', async () => {
    const api = new StubKeystoreApi();
    await expect(api.set('anthropic-api-key', 'sk-test')).resolves.toBeUndefined();
  });

  it('rejects with setError string when configured', async () => {
    const api = new StubKeystoreApi({ setError: 'keyring unavailable' });
    await expect(api.set('a', 'b')).rejects.toBe('keyring unavailable');
  });

  it('treats empty-string setError as a rejection (not "no error")', async () => {
    const api = new StubKeystoreApi({ setError: '' });
    await expect(api.set('a', 'b')).rejects.toBe('');
  });
});

describe('TauriKeystoreApi (wiring contract)', () => {
  it('status() invokes keystore_status with no args', async () => {
    mockInvoke.mockResolvedValueOnce({ state: 'absent', backend: null });
    await new TauriKeystoreApi().status();
    expect(mockInvoke).toHaveBeenCalledWith('keystore_status');
  });

  it('migrateV1ToV2 passes passphrase when supplied', async () => {
    mockInvoke.mockResolvedValueOnce({ migrated_count: 1 });
    await new TauriKeystoreApi().migrateV1ToV2('hunter2');
    expect(mockInvoke).toHaveBeenCalledWith('keystore_migrate_v1_to_v2', {
      passphrase: 'hunter2',
    });
  });

  it('migrateV1ToV2 passes null when passphrase omitted', async () => {
    mockInvoke.mockResolvedValueOnce({ migrated_count: 0 });
    await new TauriKeystoreApi().migrateV1ToV2();
    expect(mockInvoke).toHaveBeenCalledWith('keystore_migrate_v1_to_v2', {
      passphrase: null,
    });
  });

  it('set invokes keystore_set with account+value+passphrase', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await new TauriKeystoreApi().set('anthropic-api-key', 'sk-test', 'hunter2');
    expect(mockInvoke).toHaveBeenCalledWith('keystore_set', {
      account: 'anthropic-api-key',
      value: 'sk-test',
      passphrase: 'hunter2',
    });
  });

  it('set passes null passphrase when omitted (Path 1 host)', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await new TauriKeystoreApi().set('anthropic-api-key', 'sk-test');
    expect(mockInvoke).toHaveBeenCalledWith('keystore_set', {
      account: 'anthropic-api-key',
      value: 'sk-test',
      passphrase: null,
    });
  });

  it('set propagates rejection from invoke', async () => {
    mockInvoke.mockRejectedValueOnce('backend error');
    await expect(new TauriKeystoreApi().set('a', 'b')).rejects.toBe(
      'backend error',
    );
  });
});

describe('getKeystoreApi (v1.49.650 default factory)', () => {
  it('returns a StubKeystoreApi for the duration of phase-(g) stub mode', () => {
    expect(getKeystoreApi()).toBeInstanceOf(StubKeystoreApi);
  });
});
