/**
 * MuseLoader — discovers, validates, and loads muse chipsets from YAML.
 *
 * Extends EngineRegistry with muse-aware loading and context-based selection.
 */

import type { MuseId, MuseOrientation } from './muse-schema-validator.js';
import type { MusePlanePosition, CartesianPosition } from './muse-plane-types.js';

export interface LoadedMuse {
  id: MuseId;
  name: string;
  museType: string;
  orientation: MuseOrientation;
  planePosition: CartesianPosition;
  vocabulary: string[];
  voice: { tone: string; style: string; signature?: string };
  activationPatterns: string[];
  composableWith: string[];
  totalBudget: number;
}

export interface MuseRegistry {
  getMuse(id: MuseId): LoadedMuse | undefined;
  allMuses(): LoadedMuse[];
  getMusesByPattern(context: string): LoadedMuse[];
  museBudgetUsed(): number;
}

export class MuseLoader {
  // Stub — will be implemented in GREEN
  loadFromObject(config: Record<string, unknown>): LoadedMuse | null {
    throw new Error('Not implemented');
  }

  loadAll(configs: Record<string, unknown>[]): Map<MuseId, LoadedMuse> {
    throw new Error('Not implemented');
  }

  createRegistry(muses: Map<MuseId, LoadedMuse>): MuseRegistry {
    throw new Error('Not implemented');
  }
}
