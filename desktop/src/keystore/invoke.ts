/**
 * Tauri command wrappers + stub implementations for the v1.49.650 keystore.
 *
 * STUB STATUS (v1.49.650 phase-(g) Option 2):
 *   The Rust Tauri commands at `src-tauri/src/commands/keystore.rs` are NOT
 *   yet wired. `StubKeystoreApi` returns canned responses so that desktop
 *   UI modules (passphrase-flow.ts + migration-banner.ts) can be built and
 *   tested independently of the Rust IPC layer. The production class
 *   `TauriKeystoreApi` is kept in this file so a follow-on milestone can
 *   swap a single line in `getKeystoreApi()` to make the UI live.
 *
 * Command names (will become `#[tauri::command]`s in `src-tauri/`):
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
 * Production implementation — calls the real Tauri commands.
 *
 * NOT WIRED at v1.49.650 phase-(g): the commands at
 * `src-tauri/src/commands/keystore.rs` do not exist yet. Invoking these
 * methods today rejects with Tauri's "command not found" error. The class
 * lives here so that when the Rust commands ship, `getKeystoreApi()` flips
 * one line to use this class and the typed wrappers below enforce the
 * contract at compile time.
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
 * Used as the v1.49.650 default so the UI surface is testable + previewable
 * before the Rust commands land.
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
 * Factory — returns the keystore API the rest of the desktop UI should use.
 *
 * v1.49.650 default: `StubKeystoreApi` with `DEFAULT_STUB_MOCKS`. A future
 * milestone wires `TauriKeystoreApi` when the Rust commands ship; the swap
 * is a single line here, and no UI module needs to change.
 */
export function getKeystoreApi(): KeystoreApi {
  return new StubKeystoreApi();
}
