/**
 * Tauri command wrappers for the unified keystore.
 *
 * v1.49.636 C1 wired the three Rust `#[tauri::command]` functions at
 * `src-tauri/src/commands/keystore.rs`. `getKeystoreApi()` returns the
 * production `TauriKeystoreApi`; test code that needs canned responses
 * uses `getStubKeystoreApi()` or instantiates `StubKeystoreApi` directly.
 *
 * Command names registered in `src-tauri/src/lib.rs::run`:
 *   - `keystore_status`           → `KeystoreStatus`
 *   - `keystore_migrate_v1_to_v2` → `Result<MigrationOutcome, String>`
 *   - `keystore_set`              → `Result<(), String>`
 */

import { invoke } from '@tauri-apps/api/core';
import type { KeystoreStatus, MigrationOutcome } from './types';

/**
 * Unified surface that the desktop UI builds against.
 *
 * Methods that map to Rust `Result<T, E>` reject with the `E` (a string)
 * on `Err` and resolve with the `T` on `Ok`, per Tauri's invoke contract.
 */
export interface KeystoreApi {
  /** Read current state + backend (`keystore_status`). */
  status(): Promise<KeystoreStatus>;
  /**
   * Migrate v1 plaintext file → v2 storage. Resolves with the migrated
   * count; rejects with a string error message.
   */
  migrateV1ToV2(passphrase?: string): Promise<MigrationOutcome>;
  /**
   * Save a credential under `account`. On Path 2, `passphrase` is required.
   * Rejects with a string error message.
   */
  set(account: string, value: string, passphrase?: string): Promise<void>;
}

/**
 * Production implementation — calls the real Tauri commands wired in
 * v1.49.636 C1 at `src-tauri/src/commands/keystore.rs` and registered in
 * `src-tauri/src/lib.rs::run`.
 */
export class TauriKeystoreApi implements KeystoreApi {
  status(): Promise<KeystoreStatus> {
    return invoke<KeystoreStatus>('keystore_status');
  }

  migrateV1ToV2(passphrase?: string): Promise<MigrationOutcome> {
    return invoke<MigrationOutcome>('keystore_migrate_v1_to_v2', {
      passphrase: passphrase ?? null,
    });
  }

  set(account: string, value: string, passphrase?: string): Promise<void> {
    return invoke<void>('keystore_set', {
      account,
      value,
      passphrase: passphrase ?? null,
    });
  }
}

/** Canned-mock configuration for `StubKeystoreApi`. */
export interface StubKeystoreMocks {
  /** Canned status response. Defaults to `{ state: 'absent', backend: null }`. */
  status?: KeystoreStatus;
  /** Canned migrate outcome. Defaults to `{ migrated_count: 1 }`. */
  migrateOutcome?: MigrationOutcome;
  /** If set, `migrateV1ToV2` rejects with this string. */
  migrateError?: string;
  /** If set, `set` rejects with this string. */
  setError?: string;
}

/** Default mocks used when `StubKeystoreApi` is constructed with no override. */
export const DEFAULT_STUB_MOCKS: Required<
  Pick<StubKeystoreMocks, 'status' | 'migrateOutcome'>
> = {
  status: { state: 'absent', backend: null },
  migrateOutcome: { migrated_count: 1 },
};

/**
 * Stub implementation that returns canned responses without calling Tauri.
 * Used by tests via direct instantiation (`new StubKeystoreApi(...)`) or
 * the `getStubKeystoreApi()` factory helper. Not the production default
 * after v1.49.636 C1.
 */
export class StubKeystoreApi implements KeystoreApi {
  constructor(private mocks: StubKeystoreMocks = {}) {}

  status(): Promise<KeystoreStatus> {
    return Promise.resolve(this.mocks.status ?? DEFAULT_STUB_MOCKS.status);
  }

  migrateV1ToV2(_passphrase?: string): Promise<MigrationOutcome> {
    if (this.mocks.migrateError !== undefined) {
      return Promise.reject(this.mocks.migrateError);
    }
    return Promise.resolve(
      this.mocks.migrateOutcome ?? DEFAULT_STUB_MOCKS.migrateOutcome,
    );
  }

  set(_account: string, _value: string, _passphrase?: string): Promise<void> {
    if (this.mocks.setError !== undefined) {
      return Promise.reject(this.mocks.setError);
    }
    return Promise.resolve();
  }
}

/**
 * Factory — returns the production keystore API the desktop UI builds
 * against. v1.49.636 C1 flipped this from the v1.49.636 phase-(g) stub
 * to the live `TauriKeystoreApi`. Tests that need canned responses use
 * `getStubKeystoreApi()` below, or instantiate `StubKeystoreApi`
 * directly.
 */
export function getKeystoreApi(): KeystoreApi {
  return new TauriKeystoreApi();
}

/**
 * Test-only factory — returns a `StubKeystoreApi` instance with the
 * supplied (or default) canned-response mocks. Use in vitest / jsdom
 * environments where Tauri's `invoke` is unavailable.
 */
export function getStubKeystoreApi(mocks?: StubKeystoreMocks): KeystoreApi {
  return new StubKeystoreApi(mocks);
}
