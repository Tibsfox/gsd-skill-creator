/**
 * Accessibility mode detection and enforcement.
 *
 * Auto-activates when the OS reports prefers-reduced-motion or
 * prefers-contrast media queries. Disables CRT effects, removes
 * CSS fallback overlays, applies a high-contrast palette, and
 * suppresses all animations via CSS class.
 *
 * BOOT-06: Accessibility mode = no CRT, no animations, high-contrast, DOM-only
 * BOOT-07: Auto-activate on prefers-reduced-motion or prefers-contrast
 */

import type { Engine } from '../engine/engine.js';
import type { UserStyle } from '../calibration/user-style.js';
import { removeCSSFallback } from '../engine/css-fallback.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Current accessibility preference state from the OS. */
export interface AccessibilityState {
  prefersReducedMotion: boolean;
  prefersContrast: boolean;
  /** True if either preference is active. */
  isAccessibilityMode: boolean;
}

// ---------------------------------------------------------------------------
// High-contrast palette
// ---------------------------------------------------------------------------

/**
 * 32-color high-contrast palette for accessibility mode.
 *
 * Pure black and white at endpoints, strong primary and secondary
 * colors for maximum distinguishability. No subtle gradients.
 */
export const HIGH_CONTRAST_PALETTE: string[] = [
  '#000000', // 0  - pure black
  '#0000FF', // 1  - blue
  '#FF0000', // 2  - red
  '#00FF00', // 3  - green
  '#FFFF00', // 4  - yellow
  '#FF00FF', // 5  - magenta
  '#00FFFF', // 6  - cyan
  '#FF8800', // 7  - orange
  '#8800FF', // 8  - purple
  '#0088FF', // 9  - sky blue
  '#FF0088', // 10 - hot pink
  '#00FF88', // 11 - spring green
  '#88FF00', // 12 - chartreuse
  '#8800AA', // 13 - dark purple
  '#AA8800', // 14 - dark yellow
  '#00AA88', // 15 - teal
  '#333333', // 16 - dark gray
  '#555555', // 17 - medium-dark gray
  '#777777', // 18 - medium gray
  '#999999', // 19 - medium-light gray
  '#BBBBBB', // 20 - light gray
  '#CC0000', // 21 - dark red
  '#0000CC', // 22 - dark blue
  '#00CC00', // 23 - dark green
  '#CCCC00', // 24 - dark yellow
  '#CC00CC', // 25 - dark magenta
  '#00CCCC', // 26 - dark cyan
  '#FF4444', // 27 - light red
  '#4444FF', // 28 - light blue
  '#44FF44', // 29 - light green
  '#DDDDDD', // 30 - near white
  '#FFFFFF', // 31 - pure white
];

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Detect current OS accessibility preferences via media queries.
 *
 * Reads prefers-reduced-motion and prefers-contrast. Returns a state
 * object indicating which preferences are active and whether
 * accessibility mode should be enabled (either preference triggers it).
 */
export function detectAccessibilityPreferences(): AccessibilityState {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;

  return {
    prefersReducedMotion,
    prefersContrast,
    isAccessibilityMode: prefersReducedMotion || prefersContrast,
  };
}

// ---------------------------------------------------------------------------
// Enforcement
// ---------------------------------------------------------------------------

/**
 * Apply full accessibility mode.
 *
 * 1. Disables CRT effects (engine config)
 * 2. Removes CSS CRT fallback overlays
 * 3. Applies high-contrast palette
 * 4. Sets gsd-os--a11y CSS class (disables all animations)
 * 5. Sets CSS custom properties for high contrast
 * 6. Sets data-a11y attribute for programmatic detection
 */
export function applyAccessibilityMode(engine: Engine, container: HTMLElement): void {
  // 1. Disable CRT effects
  engine.updateConfig({
    enabled: false,
    scanlineIntensity: 0,
    barrelDistortion: 0,
    phosphorGlow: 0,
    chromaticAberration: 0,
    vignette: 0,
  });

  // 2. Remove CSS CRT fallback overlays
  removeCSSFallback(container);

  // 3. Apply high-contrast palette
  engine.setPaletteColors(HIGH_CONTRAST_PALETTE);

  // 4. Set CSS class (CSS rules disable animations/transitions)
  document.documentElement.classList.add('gsd-os--a11y');

  // 5. Set CSS custom properties for high contrast
  document.documentElement.style.setProperty('--bg-primary', '#000000');
  document.documentElement.style.setProperty('--fg-primary', '#FFFFFF');
  document.documentElement.style.setProperty('--accent-primary', '#FFFF00');

  // 6. Set data attribute for programmatic detection
  document.documentElement.dataset.a11y = 'true';
}

/**
 * Remove accessibility mode -- restore user preferences.
 *
 * 1. Re-applies user CRT config
 * 2. Re-applies user palette
 * 3. Removes gsd-os--a11y class
 * 4. Removes data-a11y attribute
 *
 * Note: caller should call applyUserStyleCSS(userStyle) after this
 * to restore CSS custom properties from the user's theme.
 */
export function removeAccessibilityMode(
  engine: Engine,
  container: HTMLElement,
  userStyle: UserStyle,
): void {
  // 1. Restore user CRT config
  engine.updateConfig(userStyle.crt);

  // 2. Restore user palette
  engine.setPaletteColors(userStyle.palette.colors);

  // 3. Remove a11y CSS class
  document.documentElement.classList.remove('gsd-os--a11y');

  // 4. Remove data attribute
  delete document.documentElement.dataset.a11y;
}

// ---------------------------------------------------------------------------
// Runtime Watching
// ---------------------------------------------------------------------------

/**
 * Watch for runtime accessibility preference changes.
 *
 * Sets up media query listeners that auto-toggle accessibility mode
 * when the OS reports changes to prefers-reduced-motion or
 * prefers-contrast. Returns a cleanup function.
 *
 * @param engine - WebGL CRT engine
 * @param container - Root container element
 * @param getUserStyle - Callback to retrieve current user style
 * @returns Cleanup function to remove listeners
 */
export function watchAccessibilityChanges(
  engine: Engine,
  container: HTMLElement,
  getUserStyle: () => UserStyle,
): () => void {
  const motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const contrastMQ = window.matchMedia('(prefers-contrast: more)');

  const check = (): void => {
    const state = detectAccessibilityPreferences();
    if (state.isAccessibilityMode) {
      applyAccessibilityMode(engine, container);
    } else {
      const style = getUserStyle();
      removeAccessibilityMode(engine, container, style);
    }
  };

  motionMQ.addEventListener('change', check);
  contrastMQ.addEventListener('change', check);

  return () => {
    motionMQ.removeEventListener('change', check);
    contrastMQ.removeEventListener('change', check);
  };
}
