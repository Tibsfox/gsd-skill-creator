/**
 * Terminal integration wiring for the GSD Dashboard generator pipeline.
 *
 * Bridges the terminal panel renderer ({@link module:dashboard/terminal-panel})
 * with the integration config reader ({@link module:integration/config/reader}).
 * The dashboard generator can call {@link buildTerminalHtml} to get complete
 * HTML (panel + styles) ready for injection into the index page, or use
 * {@link getTerminalConfig} to access terminal settings independently.
 *
 * @module dashboard/terminal-integration
 */

import { readIntegrationConfig } from '../integration/config/reader.js';
import { renderTerminalPanel, renderTerminalStyles } from './terminal-panel.js';
import type { TerminalConfig } from '../integration/config/terminal-types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of building terminal HTML for the dashboard generator.
 *
 * Contains both the panel markup and the associated CSS, allowing the
 * generator to embed them in separate locations within the page template
 * (HTML in the body, CSS in the head or a `<style>` block).
 */
export interface TerminalHtmlResult {
  /** HTML string containing the terminal panel (iframe + fallback + script). */
  html: string;
  /** CSS string for terminal panel styling (to embed in page `<style>`). */
  styles: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read terminal settings from the integration config.
 *
 * Extracts just the `terminal` section from the full integration config,
 * useful for consumers that need terminal settings (port, base_path, etc.)
 * without the rest of the integration configuration.
 *
 * @param configPath - Path to the integration config file (optional, uses default)
 * @returns Terminal configuration with all defaults applied
 */
export async function getTerminalConfig(
  configPath?: string,
): Promise<TerminalConfig> {
  const config = await readIntegrationConfig(configPath);
  return config.terminal;
}

/**
 * Build complete terminal panel HTML and CSS for the dashboard generator.
 *
 * Reads the terminal configuration, delegates to the panel renderer for
 * HTML markup, and collects the panel CSS. The generator can inject these
 * into the dashboard page template at the appropriate locations.
 *
 * @param configPath - Path to the integration config file (optional, uses default)
 * @returns Object with `html` (panel markup) and `styles` (panel CSS)
 */
export async function buildTerminalHtml(
  configPath?: string,
): Promise<TerminalHtmlResult> {
  const terminalConfig = await getTerminalConfig(configPath);
  const html = renderTerminalPanel(terminalConfig);
  const styles = renderTerminalStyles();
  return { html, styles };
}
