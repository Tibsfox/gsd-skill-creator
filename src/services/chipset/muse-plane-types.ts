/**
 * Muse plane position types for complex plane activation scoring.
 */

import type { MuseId } from './muse-schema-validator.js';

export interface MusePlanePosition {
  angle: number;     // radians [0, 2π)
  magnitude: number; // [0, 1]
}

export interface MuseDistance {
  museId: MuseId;
  distance: number;
  angularDistance: number;
  isComplementary: boolean; // angular distance > π/3
}

export interface MuseActivation {
  museId: MuseId;
  score: number;  // [0, 1]
  reason: string;
}

export interface CartesianPosition {
  real: number;
  imaginary: number;
}
