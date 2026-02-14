/**
 * CRT effect configuration type system.
 *
 * Defines the shape and defaults for all five CRT post-processing effects
 * (scanlines, barrel distortion, phosphor glow, chromatic aberration, vignette).
 * Pure TypeScript -- no WebGL dependencies.
 */

/** Configuration for CRT post-processing effects. */
export interface CRTConfig {
  /** Master enable/disable toggle for all CRT effects. */
  enabled: boolean;
  /** Horizontal scanline darkness intensity (0 = off, 1 = maximum). */
  scanlineIntensity: number;
  /** Barrel distortion curvature amount (0 = flat, 0.5 = heavy curve). */
  barrelDistortion: number;
  /** Phosphor glow bloom intensity (0 = off, 1 = maximum bloom). */
  phosphorGlow: number;
  /** Chromatic aberration offset in pixels (0 = off, 5 = heavy fringing). */
  chromaticAberration: number;
  /** Vignette darkness at screen edges (0 = off, 1 = heavy darkening). */
  vignette: number;
}

/** Readonly default CRT configuration matching research spec values. */
export const CRT_DEFAULTS: Readonly<CRTConfig> = {
  enabled: true,
  scanlineIntensity: 0.6,
  barrelDistortion: 0.15,
  phosphorGlow: 0.4,
  chromaticAberration: 2.0,
  vignette: 0.5,
} as const;

/**
 * Merge a partial config with CRT_DEFAULTS.
 * Fields not specified in `partial` retain their default values.
 */
export function mergeCRTConfig(partial: Partial<CRTConfig>): CRTConfig {
  return { ...CRT_DEFAULTS, ...partial };
}

/**
 * Check whether a specific effect is active.
 * Returns true only when the master toggle is enabled AND the effect's
 * intensity is greater than zero.
 */
export function isEffectEnabled(
  config: CRTConfig,
  effect: keyof Omit<CRTConfig, "enabled">,
): boolean {
  return config.enabled && config[effect] > 0;
}
