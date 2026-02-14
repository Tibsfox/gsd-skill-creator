/**
 * Boot module barrel export.
 *
 * Provides the public API for the Amiga-inspired boot sequence:
 * types, chipset state machine, boot renderer, desktop background,
 * and accessibility mode detection/enforcement.
 */

// Types
export type { BootPhase, ChipsetDef, BootConfig, BootState } from './types.js';
export { CHIPSETS, BOOT_TIMING, DEFAULT_BOOT_CONFIG, shouldSkipBoot, createBootState } from './types.js';

// Chipset state machine
export { advanceSequence, getActiveChipset, isSequenceComplete, getSequenceProgress, skipSequence } from './chipset.js';

// Boot renderer
export type { BootRenderer } from './boot-renderer.js';
export { createBootRenderer } from './boot-renderer.js';

// Desktop background
export type { DesktopBackground, BackgroundMode } from './desktop-background.js';
export { createDesktopBackground, applyBackgroundMode } from './desktop-background.js';

// Accessibility
export type { AccessibilityState } from './accessibility.js';
export {
  detectAccessibilityPreferences,
  applyAccessibilityMode,
  removeAccessibilityMode,
  watchAccessibilityChanges,
  HIGH_CONTRAST_PALETTE,
} from './accessibility.js';
