/**
 * Engine public API barrel export.
 */

export { Engine } from './engine';
export type { EngineMode } from './engine';
export {
  type CRTConfig,
  CRT_DEFAULTS,
  mergeCRTConfig,
  isEffectEnabled,
} from './crt-config';
export { FrameTimeMeasurer } from './performance';
export { PaletteTexture } from './palette-texture';
export {
  type Palette,
  type PalettePreset,
  PALETTE_PRESETS,
  generatePalette,
  getPaletteColors,
  paletteToUint8,
} from './palette';
