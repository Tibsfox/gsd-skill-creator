/**
 * CSS custom property bridge from UserStyle to DOM.
 *
 * Projects palette colors, semantic tokens, CRT values, and mode
 * onto document.documentElement as CSS custom properties. This bridges
 * the UserStyle data model to DOM-based styling while the WebGL engine
 * reads the same UserStyle for shader uniforms.
 */
import type { UserStyle } from './user-style.js';

/** All CSS custom property names managed by this bridge. */
const PALETTE_VARS = Array.from({ length: 32 }, (_, i) => `--palette-${i}`);

const SEMANTIC_VARS = [
  '--bg-primary',
  '--bg-secondary',
  '--fg-primary',
  '--fg-secondary',
  '--accent-primary',
  '--accent-secondary',
] as const;

const CRT_VARS = [
  '--crt-scanline-intensity',
  '--crt-phosphor-glow',
] as const;

const MODE_VAR = '--mode';

/**
 * Apply UserStyle as CSS custom properties on document.documentElement.
 *
 * Sets 32 palette colors, 6 mode-aware semantic tokens, 2 CRT values,
 * and the mode indicator. Safe to call repeatedly (idempotent).
 */
export function applyUserStyleCSS(style: UserStyle): void {
  const el = document.documentElement;
  const colors = style.palette.colors;
  const isDark = style.mode === 'dark';

  // 32 palette colors
  for (let i = 0; i < 32; i++) {
    el.style.setProperty(`--palette-${i}`, colors[i]);
  }

  // Mode-aware semantic tokens
  el.style.setProperty('--bg-primary', isDark ? colors[0] : colors[31]);
  el.style.setProperty('--bg-secondary', isDark ? colors[2] : colors[29]);
  el.style.setProperty('--fg-primary', isDark ? colors[31] : colors[0]);
  el.style.setProperty('--fg-secondary', isDark ? colors[29] : colors[2]);
  el.style.setProperty('--accent-primary', colors[3]);
  el.style.setProperty('--accent-secondary', colors[7]);

  // CRT values
  el.style.setProperty('--crt-scanline-intensity', String(style.crt.scanlineIntensity));
  el.style.setProperty('--crt-phosphor-glow', String(style.crt.phosphorGlow));

  // Mode
  el.style.setProperty(MODE_VAR, style.mode);
}

/**
 * Remove all CSS custom properties set by applyUserStyleCSS.
 * Cleans up palette, semantic, CRT, and mode variables from documentElement.
 */
export function removeUserStyleCSS(): void {
  const el = document.documentElement;

  for (const name of PALETTE_VARS) {
    el.style.removeProperty(name);
  }
  for (const name of SEMANTIC_VARS) {
    el.style.removeProperty(name);
  }
  for (const name of CRT_VARS) {
    el.style.removeProperty(name);
  }
  el.style.removeProperty(MODE_VAR);
}
