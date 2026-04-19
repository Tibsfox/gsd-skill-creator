/**
 * Unified `skill-creator status` — aggregates state from all eight Living
 * Sensoria modules (M1–M8) into one coherent view.
 *
 * Wave 2 integration (IT-09). When no unified status command exists elsewhere,
 * this is the canonical surface. CLI wrappers import `renderStatus` and pipe
 * its output to stdout; library callers can use `collectStatus` to get the
 * structured snapshot.
 *
 * Every field is optional — modules that have not been initialised (fresh
 * installs with flags off) return `null` and are rendered as "—" in the
 * narrative view. This keeps the status command useful across all partial-
 * enable combinations (IT-12).
 *
 * @module cli-status
 */

import type { Graph } from './graph/ingest.js';
import type { Community, DecisionTrace, MemoryEntry } from './types/memory.js';
import type { BranchManifest } from './branches/manifest.js';
import type { TeachEntry, CoEvolutionOffering, QuintessenceSnapshot } from './types/symbiosis.js';

export interface LivingSensoriaStatusInputs {
  /** M1 — semantic memory graph (optional). */
  m1?: { graph: Graph; communities: readonly Community[] } | null;
  /** M2 — memory entries (optional). */
  m2?: { shortTermCount: number; longTermCount: number } | null;
  /** M3 — decision traces (optional). */
  m3?: { traces: readonly DecisionTrace[] } | null;
  /** M4 — branch manifests (optional). */
  m4?: { manifests: readonly BranchManifest[] } | null;
  /** M5 — orchestration flag state. */
  m5?: { orchestrationEnabled: boolean; prefixCacheSize: number } | null;
  /** M6 — sensoria flag + desensitisation registry size. */
  m6?: { sensoriaEnabled: boolean; trackedSkills: number } | null;
  /** M7 — generative model cardinality + surprise-log size. */
  m7?: { intentClasses: number; observationTypes: number; surpriseEntries: number } | null;
  /** M8 — symbiosis counts + latest snapshot. */
  m8?: {
    teachEntries: readonly TeachEntry[];
    offerings: readonly CoEvolutionOffering[];
    latestQuintessence: QuintessenceSnapshot | null;
  } | null;
}

export interface LivingSensoriaStatus {
  m1: { entities: number; edges: number; communities: number } | null;
  m2: { shortTermCount: number; longTermCount: number } | null;
  m3: { traceCount: number } | null;
  m4: { total: number; open: number; committed: number; aborted: number } | null;
  m5: { orchestrationEnabled: boolean; prefixCacheSize: number } | null;
  m6: { sensoriaEnabled: boolean; trackedSkills: number } | null;
  m7: { intentClasses: number; observationTypes: number; surpriseEntries: number } | null;
  m8: {
    teachCount: number;
    teachByCategory: Record<string, number>;
    offeringCount: number;
    offeringByKind: Record<string, number>;
    latestQuintessence: QuintessenceSnapshot | null;
  } | null;
}

/**
 * Collect a structured status snapshot from whichever modules are
 * available. Missing modules return `null` in their slot.
 */
export function collectStatus(inputs: LivingSensoriaStatusInputs): LivingSensoriaStatus {
  return {
    m1: inputs.m1
      ? {
          entities: inputs.m1.graph.entities.size,
          edges: inputs.m1.graph.edges.size,
          communities: inputs.m1.communities.length,
        }
      : null,
    m2: inputs.m2 ?? null,
    m3: inputs.m3 ? { traceCount: inputs.m3.traces.length } : null,
    m4: inputs.m4 ? summariseBranches(inputs.m4.manifests) : null,
    m5: inputs.m5 ?? null,
    m6: inputs.m6 ?? null,
    m7: inputs.m7 ?? null,
    m8: inputs.m8 ? summariseSymbiosis(inputs.m8) : null,
  };
}

/**
 * Render a narrative-form status block suitable for CLI output. Each module
 * occupies a single line plus optional detail rows; missing modules are
 * marked `—`.
 */
export function renderStatus(status: LivingSensoriaStatus): string {
  const lines: string[] = [];
  lines.push('skill-creator status — Living Sensoria (v1.49.561)');
  lines.push('─'.repeat(55));

  lines.push(renderM1(status.m1));
  lines.push(renderM2(status.m2));
  lines.push(renderM3(status.m3));
  lines.push(renderM4(status.m4));
  lines.push(renderM5(status.m5));
  lines.push(renderM6(status.m6));
  lines.push(renderM7(status.m7));
  lines.push(...renderM8(status.m8));
  return lines.join('\n');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function summariseBranches(manifests: readonly BranchManifest[]): LivingSensoriaStatus['m4'] {
  let open = 0;
  let committed = 0;
  let aborted = 0;
  for (const m of manifests) {
    if (m.state === 'open') open += 1;
    else if (m.state === 'committed') committed += 1;
    else if (m.state === 'aborted') aborted += 1;
  }
  return { total: manifests.length, open, committed, aborted };
}

function summariseSymbiosis(
  m8: NonNullable<LivingSensoriaStatusInputs['m8']>,
): NonNullable<LivingSensoriaStatus['m8']> {
  const teachByCategory: Record<string, number> = {};
  for (const e of m8.teachEntries) {
    teachByCategory[e.category] = (teachByCategory[e.category] ?? 0) + 1;
  }
  const offeringByKind: Record<string, number> = {};
  for (const o of m8.offerings) {
    offeringByKind[o.kind] = (offeringByKind[o.kind] ?? 0) + 1;
  }
  return {
    teachCount: m8.teachEntries.length,
    teachByCategory,
    offeringCount: m8.offerings.length,
    offeringByKind,
    latestQuintessence: m8.latestQuintessence,
  };
}

function renderM1(m1: LivingSensoriaStatus['m1']): string {
  if (!m1) return 'M1 Semantic Memory Graph:    —';
  return `M1 Semantic Memory Graph:    ${m1.entities} entities, ${m1.edges} edges, ${m1.communities} communities`;
}

function renderM2(m2: LivingSensoriaStatus['m2']): string {
  if (!m2) return 'M2 Hierarchical Memory:      —';
  return `M2 Hierarchical Memory:      ${m2.shortTermCount} short-term, ${m2.longTermCount} long-term`;
}

function renderM3(m3: LivingSensoriaStatus['m3']): string {
  if (!m3) return 'M3 Decision-Trace Ledger:    —';
  return `M3 Decision-Trace Ledger:    ${m3.traceCount} traces`;
}

function renderM4(m4: LivingSensoriaStatus['m4']): string {
  if (!m4) return 'M4 Branch-Context:           —';
  return `M4 Branch-Context:           ${m4.total} total (${m4.open} open, ${m4.committed} committed, ${m4.aborted} aborted)`;
}

function renderM5(m5: LivingSensoriaStatus['m5']): string {
  if (!m5) return 'M5 Agentic Orchestration:    —';
  const flag = m5.orchestrationEnabled ? 'ON' : 'OFF';
  return `M5 Agentic Orchestration:    orchestration=${flag}, prefix-cache=${m5.prefixCacheSize}`;
}

function renderM6(m6: LivingSensoriaStatus['m6']): string {
  if (!m6) return 'M6 Sensoria:                 —';
  const flag = m6.sensoriaEnabled ? 'ON' : 'OFF';
  return `M6 Sensoria:                 sensoria=${flag}, tracked skills=${m6.trackedSkills}`;
}

function renderM7(m7: LivingSensoriaStatus['m7']): string {
  if (!m7) return 'M7 Umwelt:                   —';
  return `M7 Umwelt:                   ${m7.intentClasses} intents × ${m7.observationTypes} observations, surprise log=${m7.surpriseEntries}`;
}

function renderM8(m8: LivingSensoriaStatus['m8']): string[] {
  if (!m8) return ['M8 Symbiosis:                —'];
  const lines: string[] = [];
  lines.push(
    `M8 Symbiosis:                teach=${m8.teachCount}, offerings=${m8.offeringCount}`,
  );
  if (m8.latestQuintessence) {
    const q = m8.latestQuintessence;
    lines.push(
      `  Quintessence: self=${(q.selfVsNonSelf * 100).toFixed(0)}%, ` +
        `tension=${q.essentialTensions.toFixed(2)}, ` +
        `energy=${q.growthAndEnergyFlow.toFixed(0)} tok/outcome, ` +
        `stability=${(q.stabilityVsNovelty * 100).toFixed(0)}%, ` +
        `fateful=${q.fatefulEncounters}`,
    );
  }
  return lines;
}
