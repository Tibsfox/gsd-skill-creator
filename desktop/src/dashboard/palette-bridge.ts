/**
 * Palette CSS bridge: maps user-style.yaml palette values to dashboard
 * CSS custom properties.
 *
 * The dashboard design system (src/dashboard/design-system.ts + styles.ts)
 * uses CSS custom properties (--bg, --surface, --text, --accent, --border,
 * etc.). In GSD-OS, these values are derived from the user's chosen palette
 * in user-style.yaml rather than hardcoded. This module provides the bridge.
 *
 * @module dashboard/palette-bridge
 */

/** Dashboard palette configuration matching CSS custom property tokens. */
export interface PaletteConfig {
  bg: string;            // Background color (maps to --bg)
  surface: string;       // Surface/card color (maps to --surface)
  surfaceRaised: string; // Raised surface (maps to --surface-raised)
  border: string;        // Border color (maps to --border)
  borderMuted: string;   // Muted border (maps to --border-muted)
  text: string;          // Primary text (maps to --text)
  textMuted: string;     // Muted text (maps to --text-muted)
  accent: string;        // Accent/link color (maps to --accent)
  green: string;         // Success color (maps to --green, --signal-success)
  yellow: string;        // Warning color (maps to --yellow, --signal-warning)
  red: string;           // Error color (maps to --red, --signal-error)
  purple: string;        // Purple accent (maps to --purple)
}

/** Default dark theme palette matching src/dashboard/styles.ts values. */
export const DEFAULT_PALETTE: PaletteConfig = {
  bg: '#0d1117',
  surface: '#161b22',
  surfaceRaised: '#1c2128',
  border: '#30363d',
  borderMuted: '#21262d',
  text: '#e6edf3',
  textMuted: '#8b949e',
  accent: '#58a6ff',
  green: '#3fb950',
  yellow: '#d29922',
  red: '#f85149',
  purple: '#bc8cff',
};

/** All CSS variable names that paletteToCssVars produces. */
const CSS_VAR_NAMES = [
  '--bg', '--surface', '--surface-raised',
  '--border', '--border-muted',
  '--text', '--text-muted',
  '--accent', '--green', '--yellow', '--red', '--purple',
  '--signal-success', '--signal-warning', '--signal-error',
  '--color-frontend', '--color-backend',
] as const;

/**
 * Convert a PaletteConfig to a Record of CSS custom property name-value pairs.
 *
 * Includes direct mappings (--bg, --surface, etc.), signal color aliases
 * (--signal-success, --signal-warning, --signal-error), and domain color
 * overrides (--color-frontend, --color-backend).
 */
export function paletteToCssVars(
  palette: PaletteConfig,
): Record<string, string> {
  return {
    // Direct mappings
    '--bg': palette.bg,
    '--surface': palette.surface,
    '--surface-raised': palette.surfaceRaised,
    '--border': palette.border,
    '--border-muted': palette.borderMuted,
    '--text': palette.text,
    '--text-muted': palette.textMuted,
    '--accent': palette.accent,
    '--green': palette.green,
    '--yellow': palette.yellow,
    '--red': palette.red,
    '--purple': palette.purple,

    // Signal color aliases
    '--signal-success': palette.green,
    '--signal-warning': palette.yellow,
    '--signal-error': palette.red,

    // Domain color overrides
    '--color-frontend': palette.accent,
    '--color-backend': palette.green,
  };
}

/**
 * Apply palette CSS variables to a target element.
 * Defaults to document.documentElement if no root is provided.
 */
export function applyPalette(
  palette: PaletteConfig,
  root?: HTMLElement,
): void {
  const target = root ?? document.documentElement;
  const vars = paletteToCssVars(palette);
  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value);
  }
}

/**
 * Remove all palette CSS variables from a target element.
 * Defaults to document.documentElement if no root is provided.
 */
export function removePalette(root?: HTMLElement): void {
  const target = root ?? document.documentElement;
  for (const name of CSS_VAR_NAMES) {
    target.style.removeProperty(name);
  }
}
