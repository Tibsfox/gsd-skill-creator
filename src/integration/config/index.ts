/**
 * Integration config module — barrel exports.
 *
 * Public API for the integration configuration subsystem.
 * All consumers should import from this module rather than
 * reaching into individual files.
 *
 * @module integration/config
 */

// Types (interfaces for documentation and type annotations)
export type {
  IntegrationToggles,
  TokenBudgetConfig,
  ObservationConfig,
  SuggestionConfig,
  IntegrationConfig,
} from './types.js';

// Schema, default config, and inferred type
export {
  IntegrationConfigSchema,
  DEFAULT_INTEGRATION_CONFIG,
} from './schema.js';
export type { InferredIntegrationConfig } from './schema.js';

// Reader: filesystem loading and validation
export {
  readIntegrationConfig,
  validateIntegrationConfig,
  IntegrationConfigError,
  DEFAULT_CONFIG_PATH,
} from './reader.js';
