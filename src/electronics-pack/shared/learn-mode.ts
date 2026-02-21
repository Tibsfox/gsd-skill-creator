/**
 * Learn Mode System
 *
 * Three-level depth system for progressive content disclosure.
 * To be implemented in Phase 267.
 */

/** Depth levels for learn mode */
export enum DepthLevel {
  /** Practical rules and intuition — no math */
  Practical = 1,
  /** Section references and deeper explanations */
  Reference = 2,
  /** Full mathematical treatment */
  Mathematical = 3,
}

/** A depth marker embedded in module content */
export interface DepthMarker {
  level: DepthLevel;
  content: string;
  hhCitation: string; // e.g., "H&H 1.2.1" or "H&H p.42"
}

/** Learn mode configuration per module */
export interface LearnModeConfig {
  moduleId: string;
  defaultLevel: DepthLevel;
  markers: DepthMarker[];
}
