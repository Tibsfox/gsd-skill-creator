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
  TerminalConfig,
} from './types.js';

// Schema, default config, and inferred type
export {
  IntegrationConfigSchema,
  DEFAULT_INTEGRATION_CONFIG,
} from './schema.js';
export type { InferredIntegrationConfig } from './schema.js';

// Terminal schema, default config, and inferred type
export { TerminalConfigSchema, DEFAULT_TERMINAL_CONFIG } from './terminal-schema.js';
export type { InferredTerminalConfig } from './terminal-schema.js';

// Reader: filesystem loading and validation
export {
  readIntegrationConfig,
  validateIntegrationConfig,
  IntegrationConfigError,
  DEFAULT_CONFIG_PATH,
} from './reader.js';
