/**
 * Barrel export for the calibration module.
 *
 * Provides the public API for first-boot calibration, user style
 * persistence, CSS bridge, and wizard orchestration.
 */
export { CalibrationWizard } from './wizard.js';
export {
  type UserStyle,
  UserStyleSchema,
  DEFAULT_USER_STYLE,
  loadUserStyle,
  saveUserStyle,
  serializeUserStyle,
  deserializeUserStyle,
} from './user-style.js';
export { applyUserStyleCSS, removeUserStyleCSS } from './css-bridge.js';
export { isFirstBoot, resetCalibration } from './wizard-state.js';
export type { WizardScreen, WizardState } from './wizard-state.js';
export type { ColorPickerResult } from './screen-color-picker.js';
export type { CRTSettingsResult } from './screen-crt-settings.js';
export type { ThemeModeResult } from './screen-theme-mode.js';
