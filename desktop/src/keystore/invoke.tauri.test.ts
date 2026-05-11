/**
 * v1.49.636 C1 — Post-flip smoke tests for `getKeystoreApi()` -> Tauri.
 *
 * Distinct from `invoke.test.ts` which exercises the Stub + Tauri wiring
 * contracts. This file is the focused smoke surface that the W1A G-gate
 * inspects: prove the factory returns the live `TauriKeystoreApi` and
 * that each method forwards to the correct Tauri command name + payload.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

import {
  TauriKeystoreApi,
  StubKeystoreApi,
  getKeystoreApi,
  getStubKeystoreApi,
} from './invoke';

beforeEach(() => {
  mockInvoke.mockReset();
});

describe('v1.49.636 C1 flip — getKeystoreApi() returns TauriKeystoreApi', () => {
  it('factory returns a TauriKeystoreApi instance', () => {
    const api = getKeystoreApi();
    expect(api).toBeInstanceOf(TauriKeystoreApi);
    expect(api).not.toBeInstanceOf(StubKeystoreApi);
  });

  it('status() forwards to keystore_status with no payload', async () => {
    mockInvoke.mockResolvedValueOnce({ state: 'encrypted', backend: 'keyring' });
    await getKeystoreApi().status();
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('keystore_status');
  });

  it('migrateV1ToV2(passphrase) forwards passphrase to keystore_migrate_v1_to_v2', async () => {
    mockInvoke.mockResolvedValueOnce({ migrated_count: 3 });
    const out = await getKeystoreApi().migrateV1ToV2('hunter2');
    expect(out).toEqual({ migrated_count: 3 });
    expect(mockInvoke).toHaveBeenCalledWith('keystore_migrate_v1_to_v2', {
      passphrase: 'hunter2',
    });
  });

  it('set(account, value, passphrase) forwards full payload to keystore_set', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await getKeystoreApi().set('anthropic-api-key', 'sk-test', 'hunter2');
    expect(mockInvoke).toHaveBeenCalledWith('keystore_set', {
      account: 'anthropic-api-key',
      value: 'sk-test',
      passphrase: 'hunter2',
    });
  });

  it('propagates sanitized error string from Rust boundary unchanged', async () => {
    // Post-sanitization contract: the string that crosses the FFI is
    // already produced by `keystore_error_to_user_string` on the Rust
    // side. The TS wrapper does not re-sanitize; it forwards as-is.
    mockInvoke.mockRejectedValueOnce('Keystore I/O error: file open: permission denied');
    await expect(getKeystoreApi().set('a', 'b')).rejects.toBe(
      'Keystore I/O error: file open: permission denied',
    );
  });
});

describe('v1.49.636 C1 — getStubKeystoreApi() remains usable for tests', () => {
  it('returns a StubKeystoreApi that does not call Tauri invoke', async () => {
    const api = getStubKeystoreApi();
    await api.status();
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
