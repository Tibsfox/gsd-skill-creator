/**
 * Migration-banner state machine for the v1.49.636 keystore UI.
 *
 * Shows a visible banner on launch when a v1 plaintext credential file is
 * detected, prompting the user to migrate to v2 (Path-1 keyring or Path-2
 * age-encrypted file). The banner orchestrates the migration call via the
 * supplied `KeystoreApi` and exposes the result to the presenter via
 * snapshot + onChange.
 *
 * STUB STATUS (v1.49.636 phase-(g) Option 2):
 *   No DOM rendering is wired here. The class is a pure observable state
 *   machine; a presenter in a follow-on milestone subscribes via
 *   `onChange()` and renders the banner.
 *
 * Lifecycle:
 *   - Construct with a `KeystoreApi` (from `./invoke`).
 *   - Caller invokes `refresh()` at app startup (and after any keystore
 *     mutation) to re-probe state.
 *   - If status is `'plaintext'`, banner becomes visible. On Path-1 hosts
 *     the caller invokes `migrate()` with no passphrase; on Path-2 hosts
 *     it invokes `migrate(passphrase)` after running `PassphraseFlow`.
 *   - User-initiated `dismiss()` is sticky for the current process — a
 *     follow-on `refresh()` will not re-show the banner unless `reset()`
 *     is called first.
 *
 * @module keystore/migration-banner
 */

import type { KeystoreApi } from './invoke';
import type { KeystoreStatus } from './types';

/** Lifecycle state of the migration banner. */
export type MigrationBannerState =
  | 'idle'
  | 'visible'
  | 'hidden'
  | 'migrating'
  | 'success'
  | 'error'
  | 'dismissed';

/** Public view of the banner, emitted on every state change. */
export interface MigrationBannerSnapshot {
  state: MigrationBannerState;
  status: KeystoreStatus | null;
  migratedCount: number;
  error: string | null;
  /** Convenience: should the presenter render the banner DOM right now? */
  shouldShow: boolean;
}

/** Listener registered via `onChange`. */
export type MigrationBannerListener = (
  snapshot: MigrationBannerSnapshot,
) => void;

const VISIBLE_STATES: ReadonlySet<MigrationBannerState> = new Set<MigrationBannerState>([
  'visible',
  'migrating',
  'success',
  'error',
]);

export class MigrationBanner {
  private state: MigrationBannerState = 'idle';
  private status: KeystoreStatus | null = null;
  private migratedCount = 0;
  private error: string | null = null;
  private listeners = new Set<MigrationBannerListener>();

  constructor(private readonly api: KeystoreApi) {}

  /**
   * Probe the keystore state and update banner visibility. Idempotent.
   * If the user has previously dismissed the banner, refresh() will not
   * re-show it until reset() is called.
   */
  async refresh(): Promise<void> {
    try {
      const status = await this.api.status();
      this.status = status;
      this.error = null;
      if (this.state === 'dismissed') {
        // sticky — keep dismissed until reset()
      } else if (status.state === 'plaintext') {
        this.state = 'visible';
      } else {
        this.state = 'hidden';
      }
      this.notify();
    } catch (e) {
      // Status probe failed — surface the error to the presenter but
      // keep the banner hidden (we don't know whether to prompt).
      this.state = 'hidden';
      this.error = stringifyError(e);
      this.notify();
    }
  }

  /**
   * Run migration. `passphrase` is required on Path-2 hosts (keyring
   * unavailable); on Path-1 hosts the keystore selects the keyring
   * backend and ignores the passphrase argument.
   */
  async migrate(passphrase?: string): Promise<void> {
    if (this.state === 'migrating') return;
    this.state = 'migrating';
    this.error = null;
    this.notify();
    try {
      const outcome = await this.api.migrateV1ToV2(passphrase);
      this.state = 'success';
      this.migratedCount = outcome.migrated_count;
      this.notify();
    } catch (e) {
      this.state = 'error';
      this.error = stringifyError(e);
      this.notify();
    }
  }

  /** Hide the banner. Sticky for the lifetime of this instance. */
  dismiss(): void {
    this.state = 'dismissed';
    this.notify();
  }

  /** Clear dismissal + reset to idle so a subsequent refresh() can show again. */
  reset(): void {
    this.state = 'idle';
    this.status = null;
    this.migratedCount = 0;
    this.error = null;
    this.notify();
  }

  /** Read the current snapshot. */
  snapshot(): MigrationBannerSnapshot {
    return {
      state: this.state,
      status: this.status,
      migratedCount: this.migratedCount,
      error: this.error,
      shouldShow: VISIBLE_STATES.has(this.state),
    };
  }

  /** Subscribe to snapshot changes. Returns an unsubscribe function. */
  onChange(listener: MigrationBannerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snap = this.snapshot();
    for (const listener of this.listeners) listener(snap);
  }
}

function stringifyError(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  return String(e);
}
