/**
 * Passphrase-entry flow state machine for the v1.49.650 keystore UI.
 *
 * Drives the passphrase + re-confirm prompt shown for Path-2 (age-file)
 * keystore operations: first-run setup, migration from v1 plaintext, and
 * session-start unlock. The flow itself is API-agnostic — the caller
 * supplies the `submitFn` that runs after the passphrase is validated,
 * which keeps the state machine reusable across all three contexts.
 *
 * STUB STATUS (v1.49.650 phase-(g) Option 2):
 *   No DOM rendering is wired here. The class is a pure observable state
 *   machine; a presenter in a follow-on milestone subscribes via
 *   `onChange()` and renders the form.
 *
 * Validation policy:
 *   - Passphrase + confirmation must both be non-empty and match.
 *   - Passphrase quality is enforced via zxcvbn (R14, shipped v1.49.637
 *     C3) at `submit()` BEFORE `submitFn` runs — weak passphrases never
 *     reach the Tauri invoke boundary. Default threshold: zxcvbn score
 *     >= 3; operator override via `SC_PASSPHRASE_MIN_SCORE` (range 0-4).
 *     See `src/keystore/passphrase-quality.ts`.
 *
 * @module keystore/passphrase-flow
 */

import {
  assertPassphraseQuality,
  PassphraseQualityError,
} from '../../../src/keystore/passphrase-quality';

/** Lifecycle state of the passphrase flow. */
export type PassphraseFlowState =
  | 'entering'
  | 'submitting'
  | 'success'
  | 'error';

/** Public view of the flow, emitted on every state change. */
export interface PassphraseFlowSnapshot {
  state: PassphraseFlowState;
  /** Reason submit is currently disallowed. `null` once both fields validate. */
  validationError: string | null;
  /** True when submit() will be accepted (validation passes + not in flight). */
  canSubmit: boolean;
  /** Backend error from the most recent submit attempt, if any. */
  submitError: string | null;
}

/** Caller-supplied async work that runs after the passphrase validates. */
export type PassphraseFlowSubmit = (passphrase: string) => Promise<void>;

/** Listener registered via `onChange`. */
export type PassphraseFlowListener = (snapshot: PassphraseFlowSnapshot) => void;

export class PassphraseFlow {
  private state: PassphraseFlowState = 'entering';
  private passphrase = '';
  private confirm = '';
  private submitError: string | null = null;
  private listeners = new Set<PassphraseFlowListener>();

  constructor(private readonly submitFn: PassphraseFlowSubmit) {}

  /** Update the primary passphrase field. */
  setPassphrase(value: string): void {
    this.passphrase = value;
    this.clearTerminalAfterEdit();
    this.notify();
  }

  /** Update the confirmation field. */
  setConfirm(value: string): void {
    this.confirm = value;
    this.clearTerminalAfterEdit();
    this.notify();
  }

  /** Reset to initial state with empty fields. */
  reset(): void {
    this.state = 'entering';
    this.passphrase = '';
    this.confirm = '';
    this.submitError = null;
    this.notify();
  }

  /** Read the current snapshot. */
  snapshot(): PassphraseFlowSnapshot {
    return {
      state: this.state,
      validationError: this.computeValidationError(),
      canSubmit: this.computeCanSubmit(),
      submitError: this.submitError,
    };
  }

  /** Subscribe to snapshot changes. Returns an unsubscribe function. */
  onChange(listener: PassphraseFlowListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Validate, then invoke the caller-supplied `submitFn` with the passphrase.
   * No-op if validation fails or a submit is already in flight.
   */
  async submit(): Promise<void> {
    if (this.state === 'submitting') return;
    if (this.computeValidationError() !== null) return;
    // R14: enforce zxcvbn quality threshold BEFORE invoking submitFn so the
    // rejected passphrase never crosses the FFI boundary. PassphraseQualityError
    // surfaces as `submitError` via the same path as Tauri-side rejection,
    // matching existing error UX (string in `submitError`, state -> 'error').
    try {
      assertPassphraseQuality(this.passphrase);
    } catch (e) {
      this.state = 'error';
      this.submitError =
        e instanceof PassphraseQualityError ? e.message : stringifyError(e);
      this.notify();
      return;
    }
    this.state = 'submitting';
    this.submitError = null;
    this.notify();
    try {
      await this.submitFn(this.passphrase);
      this.state = 'success';
      this.notify();
    } catch (e) {
      this.state = 'error';
      this.submitError = stringifyError(e);
      this.notify();
    }
  }

  /**
   * After a field edit, drop out of any terminal state so the user can
   * keep typing; never clobber an in-flight submit.
   */
  private clearTerminalAfterEdit(): void {
    if (this.state === 'submitting') return;
    this.state = 'entering';
    this.submitError = null;
  }

  private computeValidationError(): string | null {
    if (this.passphrase.length === 0) return 'enter a passphrase';
    if (this.confirm.length === 0) return 'confirm your passphrase';
    if (this.passphrase !== this.confirm) return 'passphrases do not match';
    return null;
  }

  private computeCanSubmit(): boolean {
    return this.state !== 'submitting' && this.computeValidationError() === null;
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
