/**
 * Theme mode calibration screen (Screen 3).
 *
 * Stub -- will be implemented in GREEN phase.
 */
import type { PalettePreset } from '../engine/palette.js';
import type { Engine } from '../engine/engine.js';

/** Result data from the theme mode screen. */
export interface ThemeModeResult {
  mode: 'light' | 'dark';
  preset: PalettePreset;
}

interface ThemeModeOptions {
  defaults: { mode: 'light' | 'dark'; preset: PalettePreset };
  customColors: string[] | null;
  onComplete: (result: ThemeModeResult) => void;
  onSkip: () => void;
  onBack: () => void;
  engine?: Engine | null;
}

/**
 * Create the theme mode calibration screen.
 * Stub -- returns empty div.
 */
export function createThemeModeScreen(_options: ThemeModeOptions): HTMLElement {
  return document.createElement('div');
}
