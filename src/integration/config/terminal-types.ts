/**
 * Type definitions for terminal configuration.
 *
 * Defines the shape of terminal (Wetty) integration settings:
 * - Port for the Wetty server
 * - URL base path
 * - Authentication mode (extensible enum, currently 'none' only)
 * - Color theme
 *
 * @module integration/config/terminal-types
 */

/**
 * Terminal configuration for the Wetty server integration.
 *
 * All fields have sensible defaults provided by TerminalConfigSchema,
 * so users can provide a partial config or none at all.
 */
export interface TerminalConfig {
  /** Wetty server port (1-65535). Default: 11338. */
  port: number;
  /** URL base path for Wetty (must start with /). Default: '/terminal'. */
  base_path: string;
  /** Authentication mode. Default: 'none'. */
  auth_mode: 'none';
  /** Terminal color theme. Default: 'dark'. */
  theme: 'dark' | 'light';
  /** tmux session name to attach/create. Default: 'dev'. */
  session_name: string;
}
