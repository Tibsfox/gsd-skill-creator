/**
 * runtime-hal — runtime HAL public surface.
 *
 * @see runtimes.ts for the registry.
 * @module runtime-hal
 */

export {
  SUPPORTED_RUNTIMES,
  RUNTIME_STATUS,
  isSupportedRuntime,
  getRuntimeCount,
  type SupportedRuntime,
} from './runtimes.js';
