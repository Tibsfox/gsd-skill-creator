/**
 * Spatial Builder Extension for the Spatial Computing Department.
 *
 * Provides the typed interface for spatial-computing try-sessions.
 * Minecraft builds are described in structured text -- this interface
 * standardizes how build instructions are formatted in try-sessions.
 *
 * @module departments/spatial-computing/extensions/spatial-builder
 */

/** A single construction step in a build session. */
export interface BuildStep {
  /** Human-readable instruction using Minecraft vocabulary */
  instruction: string;
  /** Coordinate or region reference (e.g., "start at 0,64,0 facing east") */
  location?: string;
  /** Block types involved (e.g., ["oak_planks", "cobblestone", "redstone_dust"]) */
  blocks: string[];
  /** Concept IDs from spatial-computing department explored in this step */
  conceptsExplored: string[];
}

/** Configuration for a guided spatial build try-session. */
export interface SpatialBuildConfig {
  /** Wing context */
  wing: 'spatial-foundations' | 'building-architecture' | 'redstone-engineering' | 'systems-automation' | 'collaborative-design';
  /** Name of the build project */
  buildName: string;
  /** Estimated real-world time to complete the build */
  estimatedMinutes: number;
  /** Materials needed before starting */
  materials: string[];
  /** Ordered construction steps */
  steps: BuildStep[];
}

/**
 * Creates a spatial build try-session configuration.
 *
 * @param config - Build session specification
 * @returns Validated SpatialBuildConfig ready for try-session use
 */
export function createSpatialBuildSession(config: SpatialBuildConfig): SpatialBuildConfig {
  return config;
}
