/**
 * Zod schema for terminal (Wetty) configuration.
 *
 * Every field has a `.default()` so that `TerminalConfigSchema.parse({})`
 * returns a complete, fully populated config. Users can provide a partial
 * config (or none at all) and get sensible behavior.
 *
 * Covers CONF-01 (schema validation) and CONF-03 (sensible defaults):
 * - port: 11338 (avoids conflict with common services on 3000)
 * - base_path: '/terminal' (dashboard integration path)
 * - auth_mode: 'none' (extensible enum, SSH auth out of scope)
 * - theme: 'dark' (matches dashboard theme)
 *
 * @module integration/config/terminal-schema
 */

import { z } from 'zod';
import type { TerminalConfig } from './terminal-types.js';

/**
 * Zod schema for terminal configuration with defaults and validation.
 *
 * Usage:
 * ```typescript
 * // Full defaults from empty input:
 * const config = TerminalConfigSchema.parse({});
 *
 * // Partial override:
 * const config = TerminalConfigSchema.parse({ port: 8080 });
 * ```
 */
export const TerminalConfigSchema = z.object({
  /** Wetty server port (1-65535). Default: 11338. */
  port: z.number().int().min(1).max(65535).default(11338),

  /** URL base path for Wetty (must start with /). Default: '/terminal'. */
  base_path: z.string().min(1).regex(/^\//, 'base_path must start with /').default('/terminal'),

  /** Authentication mode. Default: 'none'. Extensible to ['none', 'token'] later. */
  auth_mode: z.enum(['none']).default('none'),

  /** Terminal color theme. Default: 'dark'. */
  theme: z.enum(['dark', 'light']).default('dark'),

  /** tmux session name to attach/create. Default: 'dev'. */
  session_name: z.string().min(1).default('dev'),
});

/**
 * Inferred TypeScript type from the Zod schema.
 *
 * This should be structurally identical to the `TerminalConfig` interface
 * defined in terminal-types.ts. The interface exists for documentation;
 * this type is used for runtime type safety.
 */
export type InferredTerminalConfig = z.infer<typeof TerminalConfigSchema>;

/**
 * Default terminal config produced by parsing an empty object.
 *
 * Consumers can use this as a reference for all default values or as
 * a starting point for building partial overrides.
 */
export const DEFAULT_TERMINAL_CONFIG: TerminalConfig = TerminalConfigSchema.parse({});
