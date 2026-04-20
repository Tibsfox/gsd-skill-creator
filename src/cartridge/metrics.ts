/**
 * Cartridge metrics — static summary over a cartridge's shape.
 *
 * This module reports counts and structural facts about a cartridge
 * (skills, agents, teams, record types, chipset kinds). It does NOT run the
 * cartridge or collect telemetry — that is handled by the metrics chipset's
 * activation_tracking at runtime, separate from this static view.
 *
 * The intended caller is `skill-creator cartridge metrics <path>`.
 */

import type {
  Cartridge,
  ChipsetKind,
  DepartmentChipset,
  GraphicsChipset,
  GroveChipset,
  MetricsChipset,
} from './types.js';
import { findChipset, findChipsets } from './types.js';

export interface CartridgeMetrics {
  id: string;
  name: string;
  version: string;
  trust: string;
  chipsetKinds: ChipsetKind[];
  chipsetCount: number;
  skillCount: number;
  agentCount: number;
  teamCount: number;
  groveRecordTypeCount: number;
  graphicsShaderStageCount: number;
  graphicsSourceCount: number;
  hasMetricsChipset: boolean;
  hasEvaluationChipset: boolean;
  benchmarkCaseMinimum: number | null;
}

export function collectMetrics(cartridge: Cartridge): CartridgeMetrics {
  const chipsetKinds = cartridge.chipsets.map((c) => c.kind);
  const uniqueKinds = Array.from(new Set(chipsetKinds)).sort() as ChipsetKind[];

  let skillCount = 0;
  let agentCount = 0;
  let teamCount = 0;

  for (const chipset of cartridge.chipsets) {
    if (chipset.kind !== 'department') continue;
    const dept = chipset as DepartmentChipset;
    skillCount += Object.keys(dept.skills ?? {}).length;
    agentCount += dept.agents?.agents?.length ?? 0;
    teamCount += Object.keys(dept.teams ?? {}).length;
  }

  let groveRecordTypeCount = 0;
  for (const grove of findChipsets(cartridge, 'grove')) {
    groveRecordTypeCount += (grove as GroveChipset).record_types.length;
  }

  let graphicsShaderStageCount = 0;
  let graphicsSourceCount = 0;
  for (const gfx of findChipsets(cartridge, 'graphics')) {
    const g = gfx as GraphicsChipset;
    graphicsShaderStageCount += g.shader_stages.length;
    graphicsSourceCount += g.sources?.length ?? 0;
  }

  const metricsChipset = findChipset(cartridge, 'metrics') as
    | MetricsChipset
    | undefined;
  const evaluation = findChipset(cartridge, 'evaluation');

  let benchmarkCaseMinimum: number | null = null;
  if (metricsChipset?.benchmarks && metricsChipset.benchmarks.length > 0) {
    benchmarkCaseMinimum = metricsChipset.benchmarks.reduce(
      (min, b) => Math.min(min, b.test_cases_minimum),
      metricsChipset.benchmarks[0]!.test_cases_minimum,
    );
  }

  return {
    id: cartridge.id,
    name: cartridge.name,
    version: cartridge.version,
    trust: cartridge.trust,
    chipsetKinds: uniqueKinds,
    chipsetCount: cartridge.chipsets.length,
    skillCount,
    agentCount,
    teamCount,
    groveRecordTypeCount,
    graphicsShaderStageCount,
    graphicsSourceCount,
    hasMetricsChipset: metricsChipset !== undefined,
    hasEvaluationChipset: evaluation !== undefined,
    benchmarkCaseMinimum,
  };
}
