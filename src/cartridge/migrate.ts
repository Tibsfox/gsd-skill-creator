/**
 * Cartridge migration helpers.
 *
 * Thin wrappers around `legacy-adapter.ts` for the common case of taking an
 * old content cartridge (from `src/bundles/cartridge/`) and producing a
 * unified Cartridge with explicit migration provenance — as opposed to the
 * adapter's sentinel origin which is meant for transparent legacy reads.
 */

import { legacyToUnified } from './legacy-adapter.js';
import type { Cartridge as LegacyCartridge } from '../bundles/cartridge/types.js';
import type { Cartridge } from './types.js';

export interface MigrateOptions {
  author?: string;
  buildSession?: string;
  sourceCommits?: string[];
  /** When true, preserve the original id verbatim. Default: true. */
  preserveId?: boolean;
  /** Override the resulting id. Ignored when preserveId is true. */
  newId?: string;
}

export function migrateLegacyCartridge(
  legacy: LegacyCartridge,
  options: MigrateOptions = {},
): Cartridge {
  const unified = legacyToUnified(legacy);
  const preserveId = options.preserveId ?? true;

  const migrated: Cartridge = {
    ...unified,
    id: preserveId ? unified.id : options.newId ?? unified.id,
    author: options.author ?? unified.author,
    provenance: {
      origin: 'migrate',
      createdAt: new Date().toISOString(),
      ...(options.sourceCommits ? { sourceCommits: options.sourceCommits } : {}),
      ...(options.buildSession ? { buildSession: options.buildSession } : {}),
    },
  };

  return migrated;
}
