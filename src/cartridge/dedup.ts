/**
 * Cartridge dedup — identify duplicate skills and agents across chipsets.
 *
 * When a cartridge composes multiple department chipsets (e.g. via forks),
 * the same capability can show up in more than one place with slightly
 * different keys. Dedup produces a content-addressed report of collisions so
 * the caller can decide whether to merge, rename, or ignore.
 *
 * This module is descriptive, not destructive: it never mutates the input.
 */

import type { Cartridge, DepartmentChipset, GraphicsChipset } from './types.js';

export interface DedupCollision {
  kind: 'skill' | 'agent' | 'graphics-source';
  key: string;
  locations: string[];
}

export interface DedupReport {
  collisions: DedupCollision[];
  skillCount: number;
  agentCount: number;
  graphicsSourceCount: number;
}

export function dedupCartridge(cartridge: Cartridge): DedupReport {
  const skillMap = new Map<string, string[]>();
  const agentMap = new Map<string, string[]>();
  const graphicsSourceMap = new Map<string, string[]>();

  cartridge.chipsets.forEach((chipset, idx) => {
    const base = `chipsets[${idx}]`;

    if (chipset.kind === 'department') {
      const dept = chipset as DepartmentChipset;

      if (dept.skills) {
        for (const skillKey of Object.keys(dept.skills)) {
          pushInto(skillMap, skillKey, `${base}.skills.${skillKey}`);
        }
      }

      if (dept.agents?.agents) {
        for (const agent of dept.agents.agents) {
          pushInto(
            agentMap,
            agent.name,
            `${base}.agents.agents[${agent.name}]`,
          );
        }
      }
      return;
    }

    if (chipset.kind === 'graphics') {
      const gfx = chipset as GraphicsChipset;
      (gfx.sources ?? []).forEach((source, sIdx) => {
        pushInto(
          graphicsSourceMap,
          source.path,
          `${base}.sources[${sIdx}].path`,
        );
      });
      return;
    }
  });

  const collisions: DedupCollision[] = [];

  for (const [key, locations] of skillMap) {
    if (locations.length > 1) {
      collisions.push({ kind: 'skill', key, locations });
    }
  }
  for (const [key, locations] of agentMap) {
    if (locations.length > 1) {
      collisions.push({ kind: 'agent', key, locations });
    }
  }
  for (const [key, locations] of graphicsSourceMap) {
    if (locations.length > 1) {
      collisions.push({ kind: 'graphics-source', key, locations });
    }
  }

  collisions.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.key.localeCompare(b.key);
  });

  return {
    collisions,
    skillCount: skillMap.size,
    agentCount: agentMap.size,
    graphicsSourceCount: graphicsSourceMap.size,
  };
}

function pushInto(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key);
  if (existing) {
    existing.push(value);
  } else {
    map.set(key, [value]);
  }
}
