/**
 * Keystore desktop UI surface. v1.49.636 C1 wired the production
 * `TauriKeystoreApi` and added the `getStubKeystoreApi()` test escape
 * hatch. See `./invoke.ts`.
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
  getStubKeystoreApi,
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
