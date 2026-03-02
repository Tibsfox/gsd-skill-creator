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

/**
 * Readonly default CRT configuration matching research spec values.
 *
 * @justification Type: Accepted heuristic
 * CRT effect defaults are perceptual tuning values inspired by Amiga OCS hardware:
 * - scanlineIntensity 0.6: Visible scanline gaps without obscuring terminal text
 * - barrelDistortion 0.15: Subtle CRT curvature that doesn't distort UI readability
 * - phosphorGlow 0.4: Moderate bloom emulating P22 phosphor persistence
 * - chromaticAberration 2.0px: Minimal RGB fringing visible at screen edges only
 * - vignette 0.5: Half-strength edge darkening for CRT "spotlight" effect
 * All values are user-configurable at runtime via mergeCRTConfig().
 */
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
