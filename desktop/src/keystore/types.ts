/**
 * Type contracts for the unified keystore Tauri command surface.
 *
 * v1.49.636 C1 wired these to live Rust commands at
 * `src-tauri/src/commands/keystore.rs` with mirror types
 * (`KeystoreStatus`, `KeystoreState`, `KeystoreBackendKind`,
 * `MigrationOutcome`) in `src-tauri/src/security/keystore.rs`.
 *
 * Mapping to the Rust Keystore API (`src-tauri/src/security/keystore.rs`):
 *   - `state: 'absent'`     ⇔ `DiscoveredState::Empty`
 *   - `state: 'plaintext'`  ⇔ `DiscoveredState::V1Plaintext`
 *   - `state: 'encrypted'`  ⇔ `DiscoveredState::Path1`,
 *                              `DiscoveredState::Path2`, or
 *                              `DiscoveredState::Path1WithPath2Orphan`
 *   - `backend: 'keyring'`  ⇔ `KeystoreBackend::OsKeyring`
 *   - `backend: 'file'`     ⇔ `KeystoreBackend::AgeFile(_)`
 *   - `backend: null`       ⇔ no credential resident (state `'absent'`)
 */

/** On-disk keystore state, reported by `keystore_status`. */
export type KeystoreState = 'absent' | 'plaintext' | 'encrypted';

/**
 * Active keystore backend. `null` when state is `'absent'`.
 *   - `'keyring'`: Path 1 — OS keyring (gnome-keyring / Keychain / Cred Manager).
 *   - `'file'`:    Path 2 — age-encrypted `~/.config/gsd-os/credentials.age`.
 */
export type KeystoreBackendKind = 'keyring' | 'file' | null;

/** Response from `keystore_status`. */
export interface KeystoreStatus {
  state: KeystoreState;
  backend: KeystoreBackendKind;
}

/** Ok payload from `keystore_migrate_v1_to_v2`. */
export interface MigrationOutcome {
  migrated_count: number;
}
