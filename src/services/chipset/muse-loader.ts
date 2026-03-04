/**
 * MuseLoader — discovers, validates, and loads muse chipsets from YAML.
 *
 * Extends EngineRegistry with muse-aware loading and context-based selection.
 */

import { validateMuseChipset, isMuseChipset, getMuseOrientation } from './muse-schema-validator.js';
import type { MuseId, MuseOrientation } from './muse-schema-validator.js';
import type { CartesianPosition } from './muse-plane-types.js';

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
  loadFromObject(config: Record<string, unknown>): LoadedMuse | null {
    if (!isMuseChipset(config)) return null;

    const validation = validateMuseChipset(config);
    if (!validation.valid) return null;

    const planePosition = getMuseOrientation(config);
    if (!planePosition) return null;

    const orientation = config.orientation as MuseOrientation;
    const voice = config.voice as { tone: string; style: string; signature?: string };

    return {
      id: config.name as MuseId,
      name: config.name as string,
      museType: config.museType as string,
      orientation,
      planePosition: { real: planePosition.real, imaginary: planePosition.imaginary },
      vocabulary: (config.vocabulary as string[]) || [],
      voice,
      activationPatterns: (config.activationPatterns as string[]) || [],
      composableWith: (config.composableWith as string[]) || [],
      totalBudget: (config.totalBudget as number) || 0,
    };
  }

  loadAll(configs: Record<string, unknown>[]): Map<MuseId, LoadedMuse> {
    const result = new Map<MuseId, LoadedMuse>();
    for (const config of configs) {
      const muse = this.loadFromObject(config);
      if (muse) result.set(muse.id, muse);
    }
    return result;
  }

  createRegistry(muses: Map<MuseId, LoadedMuse>): MuseRegistry {
    return {
      getMuse(id: MuseId): LoadedMuse | undefined {
        return muses.get(id);
      },

      allMuses(): LoadedMuse[] {
        return Array.from(muses.values());
      },

      getMusesByPattern(context: string): LoadedMuse[] {
        const lower = context.toLowerCase();
        return Array.from(muses.values()).filter(muse =>
          muse.activationPatterns.some(pattern => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(lower);
          })
        );
      },

      museBudgetUsed(): number {
        let total = 0;
        for (const muse of muses.values()) {
          total += muse.totalBudget;
        }
        return total;
      },
    };
  }
}
