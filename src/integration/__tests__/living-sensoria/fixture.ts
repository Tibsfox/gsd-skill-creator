/**
 * Synthetic fixture-builders for the Living Sensoria integration tests.
 *
 * Keeps the test files focused on assertion logic by centralising fixture
 * construction. Everything here is pure-in-memory; no disk IO.
 *
 * @module integration/__tests__/living-sensoria/fixture
 */

import type { DecisionTrace, MemoryEntry } from '../../../types/memory.js';
import type { BranchManifest } from '../../../branches/manifest.js';
import type {
  TeachEntry,
  CoEvolutionOffering,
  TeachCategory,
} from '../../../types/symbiosis.js';
import type { SessionRecord } from '../../../symbiosis/coEvolution.js';
import { ingestObservations, type Observation } from '../../../graph/ingest.js';
import { buildWeightedGraph, leiden } from '../../../graph/leiden.js';

/**
 * Build a 50-session observation stream for the main fixture. Each session
 * contains 3-5 observations. Structure is deterministic — same input →
 * same graph.
 */
export function buildObservations(n: number = 50): Observation[] {
  const out: Observation[] = [];
  const skills = ['debug', 'test-gen', 'refactor', 'format', 'lint'];
  const commands = ['npm test', 'git commit', 'npm build', 'git push'];
  const files = ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'];
  const outcomes = ['success', 'failure', 'retry'];
  let ts = 1700000000000;
  for (let i = 0; i < n; i++) {
    const sessionId = `session-${i.toString().padStart(3, '0')}`;
    const count = 3 + (i % 3);
    for (let k = 0; k < count; k++) {
      out.push({
        ts: ts,
        skill: skills[(i + k) % skills.length],
        command: commands[(i + k) % commands.length],
        file: files[(i + k) % files.length],
        sessionId,
        outcome: outcomes[(i + k) % outcomes.length],
      });
      ts += 60_000; // 1 minute between observations
    }
  }
  return out;
}

/**
 * Build an M1 graph + communities from the synthetic observations.
 */
export function buildM1(n: number = 50) {
  const obs = buildObservations(n);
  const graph = ingestObservations(obs);
  const weighted = buildWeightedGraph({
    entities: graph.entities,
    edges: graph.edges,
  });
  const leidenResult = leiden(weighted, { seed: 42 });
  const communities = leidenResult.communities[0] ?? [];
  return { graph, communities, weighted };
}

/**
 * Build a batch of synthetic M2 memory entries — `success` outcomes come
 * with explicit `tokens` counts so the M2EnergySource can compute
 * tokens-per-productive-outcome.
 */
export function buildM2(n: number = 50): MemoryEntry[] {
  const out: MemoryEntry[] = [];
  for (let i = 0; i < n; i++) {
    const tag = i % 3 === 0 ? 'success' : 'neutral';
    const entry: MemoryEntry & { tokens?: number } = {
      id: `mem-${i}`,
      content: `${tag} session ${i} debug activity`,
      ts: 1700000000000 + i * 3_600_000,
      alpha: 0.4,
      beta: 0.4,
      gamma: 0.2,
      score: 0,
      tokens: 800 + (i % 10) * 50,
    };
    out.push(entry);
  }
  return out;
}

/**
 * Build synthetic M3 decision traces — one per session.
 */
export function buildM3(n: number = 50): DecisionTrace[] {
  const out: DecisionTrace[] = [];
  const outcomes = ['success', 'failure', 'retry'];
  const reasoning = [
    'default scoring path',
    'refactor triggered by low coverage',
    'migration to new schema-change path',
    'architecture shift, commit-to-trunk',
    'breaking change noted',
  ];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `trace-${i}`,
      ts: 1700000000000 + i * 3_600_000,
      actor: 'm5-selector',
      intent: `session-${i}-intent`,
      reasoning: reasoning[i % reasoning.length],
      constraints: [],
      alternatives: [],
      outcome: outcomes[i % outcomes.length],
      refs: { entityIds: [`skill:debug`] },
    });
  }
  return out;
}

/**
 * Build synthetic M4 branch manifests — mix of committed/aborted/open.
 */
export function buildM4(n: number = 12): BranchManifest[] {
  const out: BranchManifest[] = [];
  const states: Array<'open' | 'committed' | 'aborted'> = [
    'committed',
    'committed',
    'committed',
    'aborted',
    'open',
  ];
  for (let i = 0; i < n; i++) {
    const state = states[i % states.length];
    const deltaFraction = state === 'aborted' ? 0.19 : 0.05 + (i % 5) * 0.02;
    out.push({
      id: `branch-${i}`,
      skillName: `debug`,
      parentHash: '0'.repeat(64),
      parentByteLength: 1000,
      createdAt: 1700000000000 + i * 86_400_000,
      state,
      exploreSessionCount: 2,
      tracePaths: [],
      proposedByteLength: 1050,
      deltaFraction,
      committedAt: state === 'committed' ? 1700000001000 + i * 86_400_000 : undefined,
      abortedAt: state === 'aborted' ? 1700000001000 + i * 86_400_000 : undefined,
    });
  }
  return out;
}

/**
 * Build synthetic M8 teaching entries.
 */
export function buildTeachEntries(
  specs: Array<{ category: TeachCategory; ref?: string }>,
): TeachEntry[] {
  return specs.map((s, i) => ({
    id: `teach-${i}`,
    ts: 1700000000000 + i * 60_000,
    category: s.category,
    content: `teaching entry ${i}`,
    refs: s.ref ? [s.ref] : [],
  }));
}

/**
 * Build synthetic M8 session records for co-evolution scanner.
 */
export function buildSessionRecords(n: number = 20): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (let i = 0; i < n; i++) {
    const date = new Date(1700000000000 + i * 86_400_000).toISOString().slice(0, 10);
    out.push({
      index: i,
      date,
      activatedSkills: ['debug', 'test-gen'].slice(0, (i % 2) + 1),
      testFirstCommit: i % 3 === 0,
      branch: i % 5 === 0 ? `feat-${Math.floor(i / 5)}` : 'trunk',
      taskDescription: i % 4 === 0 ? 'add unit tests for parser' : `generic work ${i}`,
    });
  }
  return out;
}

/**
 * Dummy co-evolution offerings — used for status / flag tests.
 */
export function buildOfferings(n: number = 3): CoEvolutionOffering[] {
  const out: CoEvolutionOffering[] = [];
  const kinds: Array<'trajectory' | 'consistency' | 'pattern' | 'opportunity'> = [
    'trajectory',
    'pattern',
    'opportunity',
  ];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `off-${i}`,
      ts: 1700000000000 + i * 60_000,
      kind: kinds[i % kinds.length],
      content: `offering ${i}`,
      sourcePointers: [`sessions[${i}]`],
    });
  }
  return out;
}
