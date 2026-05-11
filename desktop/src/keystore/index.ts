/**
 * Keystore desktop UI surface (v1.49.650 phase-(g) stub).
 *
 * See `./invoke.ts` for the stub-vs-real contract and the swap point
 * (`getKeystoreApi()`) that flips when the Rust Tauri commands ship in a
 * follow-on milestone.
 *
 * @module keystore
 */

export type {
  KeystoreState,
  KeystoreBackendKind,
  KeystoreStatus,
  MigrationOutcome,
} from './types';

export type { KeystoreApi, StubKeystoreMocks } from './invoke';
export {
  TauriKeystoreApi,
  StubKeystoreApi,
  DEFAULT_STUB_MOCKS,
  getKeystoreApi,
} from './invoke';

export type {
  PassphraseFlowState,
  PassphraseFlowSnapshot,
  PassphraseFlowSubmit,
  PassphraseFlowListener,
} from './passphrase-flow';
export { PassphraseFlow } from './passphrase-flow';

export type {
  MigrationBannerState,
  MigrationBannerSnapshot,
  MigrationBannerListener,
} from './migration-banner';
export { MigrationBanner } from './migration-banner';
