/**
 * Desktop background manager.
 *
 * Controls the WebGL copper list layer to render configurable gradient
 * backgrounds behind the desktop environment. Three modes are supported:
 *
 * - **gradient** (default): Smooth vertical gradient using copper list
 *   preset with palette indices 1 and 20.
 * - **flat**: Solid background color using palette index 0.
 * - **disabled**: Visually identical to flat, but semantically distinct
 *   for accessibility purposes. The CRT pipeline (168-04) uses this
 *   signal to suppress decorative visual effects.
 *
 * The background persists after boot completes and is independent of
 * the boot animation sequence.
 */

import type { Engine } from '../engine';

/** Background rendering mode. */
export type BackgroundMode = 'gradient' | 'flat' | 'disabled';

/** Desktop background controller. */
export interface DesktopBackground {
  /** Current background mode. */
  readonly mode: BackgroundMode;
  /** Switch to a new background mode. No-op if mode unchanged. */
  setMode(mode: BackgroundMode): void;
  /** Cleanup (no-op -- background lives with engine lifecycle). */
  destroy(): void;
}

/**
 * Apply a background mode to the engine copper list.
 *
 * - `'gradient'` -> `engine.setCopperProgram('gradient')`
 * - `'flat'`     -> `engine.setCopperProgram('flat')`
 * - `'disabled'` -> `engine.setCopperProgram('flat')` (same visual, different semantic)
 */
export function applyBackgroundMode(engine: Engine, mode: BackgroundMode): void {
  switch (mode) {
    case 'gradient':
      engine.setCopperProgram('gradient');
      break;
    case 'flat':
    case 'disabled':
      engine.setCopperProgram('flat');
      break;
  }
}

/**
 * Create a desktop background manager.
 *
 * Applies the initial mode immediately and provides a `setMode` method
 * for runtime switching. Mode changes only trigger engine updates when
 * the mode actually changes (same-mode calls are no-ops).
 */
export function createDesktopBackground(
  engine: Engine,
  initialMode: BackgroundMode = 'gradient',
): DesktopBackground {
  let currentMode: BackgroundMode = initialMode;
  applyBackgroundMode(engine, currentMode);

  return {
    get mode(): BackgroundMode {
      return currentMode;
    },

    setMode(mode: BackgroundMode): void {
      if (mode === currentMode) return;
      currentMode = mode;
      applyBackgroundMode(engine, mode);
    },

    destroy(): void {
      // No-op: background lifecycle tied to engine.
    },
  };
}
