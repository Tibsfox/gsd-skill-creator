// === Team Generator ===
//
// Generates team configurations when a learned domain has 50+ primitives,
// 20+ cross-quadrant composition rules, and primitives spanning 2+ quadrants.
// Cross-quadrant rules indicate the domain is complex enough to warrant
// multi-agent coordination.
//
// Quadrant definitions on the Complex Plane:
// Q1: real >= 0, imaginary >= 0  (creative + abstract)
// Q2: real < 0,  imaginary >= 0  (logical + abstract)
// Q3: real < 0,  imaginary < 0   (logical + embodied)
// Q4: real >= 0, imaginary < 0   (creative + embodied)

import type { MathematicalPrimitive, PlanePosition } from '../../types/mfe-types.js';

// === Exported Types ===

export interface TeamGeneratorConfig {
  minPrimitives: number;
  minCompositionRules: number;
  minQuadrants: number;
  outputDir: string;
  /** Discount factor for the successor representation M = (I − γP)⁻¹. Default 0.9. */
  spectralGamma: number;
}

/**
 * Seven topology archetypes from the 2026 spectral-topology framing
 * (Parks & Alharthi, arxiv `2605.11453`). Each has a closed-form (ρ, Δ, κ)
 * signature that ranks robustness / consensus / drift.
 */
export type TopologyType =
  | 'pipeline'
  | 'leader-worker'
  | 'mesh'
  | 'ring'
  | 'tree'
  | 'bipartite'
  | 'critique-route';

/**
 * Coordination signature for a team topology. Computed from the
 * row-stochastic communication operator P and the successor
 * representation M = (I − γP)⁻¹.
 *
 *   ρ — spectral radius of P (drift; row-stochastic ⇒ ρ = 1).
 *   Δ — spectral gap 1 − |λ₂(P)| (consensus rate; larger = faster mixing).
 *   κ — condition number of M (robustness; smaller = better conditioned).
 */
export interface CoordinationSignature {
  rho: number;
  delta: number;
  kappa: number;
  gamma: number;
}

export interface GeneratedTeam {
  teamName: string;
  fileName: string;
  content: string;
  agentCount: number;
  topology: TopologyType;
  coordinationSignature: CoordinationSignature;
}

export interface TeamGeneratorResult {
  generated: boolean;
  reason: string;
  team: GeneratedTeam | null;
}

// === Defaults ===

const DEFAULT_CONFIG: TeamGeneratorConfig = {
  minPrimitives: 50,
  minCompositionRules: 20,
  minQuadrants: 2,
  outputDir: 'teams/learn',
  spectralGamma: 0.9,
};

// === Helpers ===

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeYaml(s: string): string {
  const escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

function getQuadrant(pos: PlanePosition): Quadrant {
  if (pos.real >= 0 && pos.imaginary >= 0) return 'Q1';
  if (pos.real < 0 && pos.imaginary >= 0) return 'Q2';
  if (pos.real < 0 && pos.imaginary < 0) return 'Q3';
  return 'Q4';
}

const QUADRANT_LABELS: Record<Quadrant, string> = {
  Q1: 'Creative + Abstract',
  Q2: 'Logical + Abstract',
  Q3: 'Logical + Embodied',
  Q4: 'Creative + Embodied',
};

/**
 * Build a map from primitive ID to its quadrant for fast lookup.
 */
function buildQuadrantMap(primitives: MathematicalPrimitive[]): Map<string, Quadrant> {
  const map = new Map<string, Quadrant>();
  for (const p of primitives) {
    map.set(p.id, getQuadrant(p.planePosition));
  }
  return map;
}

/**
 * Count composition rules that cross quadrant boundaries.
 * A rule is "cross-quadrant" if the source primitive and the target primitive
 * (identified by rule.with) are in different quadrants.
 */
function countCrossQuadrantRules(
  primitives: MathematicalPrimitive[],
  quadrantMap: Map<string, Quadrant>,
): number {
  let count = 0;
  for (const p of primitives) {
    const sourceQuadrant = quadrantMap.get(p.id);
    if (!sourceQuadrant) continue;
    for (const rule of p.compositionRules ?? []) {
      const targetQuadrant = quadrantMap.get(rule.with);
      if (targetQuadrant && targetQuadrant !== sourceQuadrant) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Collect the set of occupied quadrants.
 */
function getOccupiedQuadrants(quadrantMap: Map<string, Quadrant>): Set<Quadrant> {
  return new Set(quadrantMap.values());
}

// === Section Generators ===

function generateFrontmatter(
  slug: string,
  domainName: string,
  topology: TopologyType,
  signature: CoordinationSignature,
): string {
  const today = new Date().toISOString().split('T')[0];
  return [
    '---',
    `name: learn-${slug}-team`,
    `description: ${escapeYaml(`Multi-agent team for ${domainName} domain coordination`)}`,
    'metadata:',
    '  extensions:',
    '    gsd-skill-creator:',
    '      version: 1',
    `      createdAt: ${escapeYaml(today)}`,
    '      type: team',
    `      topology: ${topology}`,
    '      coordination_signature:',
    `        rho: ${signature.rho.toFixed(4)}`,
    `        delta: ${signature.delta.toFixed(4)}`,
    `        kappa: ${signature.kappa.toFixed(4)}`,
    `        gamma: ${signature.gamma.toFixed(2)}`,
    '---',
  ].join('\n');
}

function generatePurpose(domainName: string, quadrants: Set<Quadrant>): string {
  const quadrantList = [...quadrants]
    .map(q => `${q} (${QUADRANT_LABELS[q]})`)
    .join(', ');

  return [
    '## Purpose',
    '',
    `Multi-domain coordination for the **${domainName}** learned domain.`,
    `Spans ${quadrants.size} quadrants: ${quadrantList}.`,
    'Coordinates specialized agents to handle cross-quadrant composition patterns.',
  ].join('\n');
}

function generateAgents(
  primitives: MathematicalPrimitive[],
  quadrantMap: Map<string, Quadrant>,
  quadrants: Set<Quadrant>,
): string {
  const agentEntries: string[] = [];

  for (const q of [...quadrants].sort()) {
    const qPrimitives = primitives.filter(p => quadrantMap.get(p.id) === q);
    const topNames = qPrimitives
      .slice(0, 5)
      .map(p => p.name)
      .join(', ');

    agentEntries.push(
      `### ${q} Agent (${QUADRANT_LABELS[q]})`,
      '',
      `- **Coverage:** ${qPrimitives.length} primitives`,
      `- **Key concepts:** ${topNames || 'None'}`,
    );
  }

  return [
    '## Agents',
    '',
    ...agentEntries,
  ].join('\n');
}

function generateCoordination(
  primitives: MathematicalPrimitive[],
  quadrantMap: Map<string, Quadrant>,
): string {
  const crossRules: string[] = [];

  for (const p of primitives) {
    const sourceQ = quadrantMap.get(p.id);
    if (!sourceQ) continue;
    for (const rule of p.compositionRules ?? []) {
      const targetQ = quadrantMap.get(rule.with);
      if (targetQ && targetQ !== sourceQ) {
        crossRules.push(
          `- ${p.name} (${sourceQ}) + ${rule.with} (${targetQ}) -> ${rule.yields} (${rule.type})`,
        );
      }
    }
  }

  const limited = crossRules.slice(0, 15);

  return [
    '## Coordination',
    '',
    `**Cross-quadrant composition rules:** ${crossRules.length} total`,
    '',
    ...limited,
  ].join('\n');
}

const TOPOLOGY_DESCRIPTIONS: Record<TopologyType, string> = {
  pipeline:
    'Sequential pipeline: agents process in order, each feeding results to the next.',
  'leader-worker':
    'Leader-worker: lead agent coordinates specialist agents per quadrant.',
  mesh:
    'Full mesh: every agent communicates with every other agent (high parallelism, fast consensus).',
  ring:
    'Ring: each agent communicates with two neighbours (low connectivity, slow mixing).',
  tree:
    'Tree: hierarchical delegation; root coordinates branches that fan out to leaves.',
  bipartite:
    'Bipartite: two layers (e.g. planners vs executors) with cross-layer edges only.',
  'critique-route':
    'Critique-route: controller observes drafts and routes the next step per Fang et al. `2605.08686`.',
};

/**
 * Pick a topology archetype from the composition-rule pattern across
 * primitives. Driven by three signals:
 *
 *   - sequentialRatio: rules tagged `sequential` / total rules
 *   - quadrantCount: number of occupied quadrants
 *   - feedbackRatio: rules whose target is also a rule source
 *
 * The thresholds preserve the original 'sequential > 0.5 ⇒ pipeline'
 * behaviour as a base case and extend it with five new options for
 * patterns the original heuristic could not express.
 */
function selectTopology(primitives: MathematicalPrimitive[], quadrants: Set<Quadrant>): TopologyType {
  let sequentialCount = 0;
  let totalRules = 0;
  const sourceIds = new Set<string>();
  for (const p of primitives) {
    const rules = p.compositionRules ?? [];
    if (rules.length > 0) sourceIds.add(p.id);
    for (const rule of rules) {
      totalRules++;
      if (rule.type === 'sequential') sequentialCount++;
    }
  }

  if (totalRules === 0) return 'leader-worker';

  const sequentialRatio = sequentialCount / totalRules;
  const qCount = quadrants.size;
  const ruleDensity = totalRules / Math.max(1, sourceIds.size);

  // Base case: preserve the original 'pipeline' selection for sequential-heavy chains.
  if (sequentialRatio > 0.5) return 'pipeline';

  // Two quadrants only ⇒ bipartite: planners vs executors.
  if (qCount === 2) return 'bipartite';

  // Many quadrants + dense parallel rules ⇒ mesh.
  if (qCount >= 3 && sequentialRatio < 0.3 && ruleDensity > 2) return 'mesh';

  // Many quadrants + sparse rules ⇒ ring.
  if (qCount >= 3 && ruleDensity < 1.0) return 'ring';

  // Hierarchical-looking patterns (sequential 0.3–0.5, many quadrants) ⇒ tree.
  if (qCount >= 3 && sequentialRatio >= 0.3) return 'tree';

  // Default: parallel coordinator pattern. 'critique-route' is a valid
  // emit target but is not auto-selected — caller must request it via
  // the topology hint (planned extension).
  return 'leader-worker';
}

/**
 * Compute the (ρ, Δ, κ) coordination signature for a topology archetype
 * with `n` agents. Uses closed-form spectra for the row-stochastic
 * communication operator P and derives the successor-representation
 * condition number κ = max|1 / (1 − γλᵢ)| / min|1 / (1 − γλᵢ)|. The
 * formulas match Parks & Alharthi `2605.11453` Appendix A.
 */
export function topologySignature(
  topology: TopologyType,
  n: number,
  gamma = 0.9,
): CoordinationSignature {
  if (n < 2 || !Number.isFinite(n)) {
    throw new Error(`topologySignature: n must be >= 2, got ${n}`);
  }
  if (gamma <= 0 || gamma >= 1) {
    throw new Error(`topologySignature: gamma must be in (0, 1), got ${gamma}`);
  }

  switch (topology) {
    case 'mesh': {
      // P = (J − I)/(n−1), eigenvalues {1, −1/(n−1) [mult n−1]}.
      const lambda2 = -1 / (n - 1);
      const delta = 1 - Math.abs(lambda2);
      const maxM = 1 / (1 - gamma);
      const minM = 1 / (1 - gamma * lambda2);
      return { rho: 1, delta, kappa: maxM / minM, gamma };
    }
    case 'ring': {
      // C_n with uniform 1/2 weight to each neighbour.
      // Eigenvalues: cos(2πk/n) for k = 0..n−1.
      const lambda2 = Math.cos((2 * Math.PI) / n);
      const lambdaMin =
        n % 2 === 0 ? -1 : Math.cos((Math.PI * (n - 1)) / n);
      const delta = 1 - Math.abs(lambda2);
      const maxM = 1 / (1 - gamma);
      const minM = 1 / (1 - gamma * lambdaMin);
      return { rho: 1, delta, kappa: Math.abs(maxM / minM), gamma };
    }
    case 'pipeline': {
      // Reflective path P_n, eigenvalues cos(kπ/(n−1)) for k = 0..n−1.
      const lambda2 = Math.cos(Math.PI / (n - 1));
      const lambdaMin = Math.cos(Math.PI);
      const delta = 1 - Math.abs(lambda2);
      const maxM = 1 / (1 - gamma);
      const minM = 1 / (1 - gamma * lambdaMin);
      return { rho: 1, delta, kappa: Math.abs(maxM / minM), gamma };
    }
    case 'leader-worker': {
      // Directed star with 2-cycles ⇒ |λ₂| ≈ 1, Δ ≈ 0.
      // κ stays bounded because the structural symmetry makes M
      // 1 − γ² invertible.
      const delta = 0;
      const kappa = 1 / (1 - gamma * gamma);
      return { rho: 1, delta, kappa, gamma };
    }
    case 'tree': {
      // Balanced binary tree of depth d ≈ ceil(log2(n+1)).
      // Diffusion behaves path-like over the depth.
      const d = Math.max(2, Math.ceil(Math.log2(n + 1)));
      const lambda2 = Math.cos(Math.PI / (d + 1));
      const delta = 1 - Math.abs(lambda2);
      const maxM = 1 / (1 - gamma);
      const minM = 1 / (1 + gamma);
      return { rho: 1, delta, kappa: maxM / minM, gamma };
    }
    case 'bipartite': {
      // Two layers; cross-edges only ⇒ eigenvalues {1, −1, 0,...}.
      // Slowest of the well-mixed topologies.
      const lambda2 = -1;
      const delta = 0;
      const maxM = 1 / (1 - gamma);
      const minM = 1 / (1 - gamma * lambda2);
      return { rho: 1, delta, kappa: maxM / minM, gamma };
    }
    case 'critique-route': {
      // Controller with weighted feedback edges (~0.3 mixing).
      // Tighter conditioning than leader-worker, slower than mesh.
      const lambda2 = 0.3;
      const delta = 1 - lambda2;
      const maxM = 1 / (1 - gamma);
      const minM = 1 / (1 - gamma * lambda2);
      return { rho: 1, delta, kappa: maxM / minM, gamma };
    }
  }
}

function generateTopology(
  topology: TopologyType,
  signature: CoordinationSignature,
  quadrants: Set<Quadrant>,
): string {
  return [
    '## Topology',
    '',
    `**Type:** ${topology}`,
    `**Agent count:** ${quadrants.size}`,
    `**Coordination signature:** ρ=${signature.rho.toFixed(4)} Δ=${signature.delta.toFixed(4)} κ=${signature.kappa.toFixed(4)} (γ=${signature.gamma})`,
    '',
    TOPOLOGY_DESCRIPTIONS[topology],
  ].join('\n');
}

// === Main Function ===

export function generateTeam(
  domainName: string,
  primitives: MathematicalPrimitive[],
  config?: Partial<TeamGeneratorConfig>,
): TeamGeneratorResult {
  const cfg: TeamGeneratorConfig = { ...DEFAULT_CONFIG, ...config };

  // Threshold check: primitives
  if (primitives.length < cfg.minPrimitives) {
    return {
      generated: false,
      reason: `Insufficient primitives (${primitives.length} < ${cfg.minPrimitives})`,
      team: null,
    };
  }

  // Build quadrant map
  const quadrantMap = buildQuadrantMap(primitives);
  const occupiedQuadrants = getOccupiedQuadrants(quadrantMap);

  // Threshold check: quadrants
  if (occupiedQuadrants.size < cfg.minQuadrants) {
    return {
      generated: false,
      reason: `Insufficient quadrant coverage (${occupiedQuadrants.size} < ${cfg.minQuadrants})`,
      team: null,
    };
  }

  // Threshold check: cross-quadrant composition rules
  const crossRuleCount = countCrossQuadrantRules(primitives, quadrantMap);
  if (crossRuleCount < cfg.minCompositionRules) {
    return {
      generated: false,
      reason: `Insufficient cross-quadrant composition rules (${crossRuleCount} < ${cfg.minCompositionRules})`,
      team: null,
    };
  }

  // Pick topology + compute spectral signature
  const topology = selectTopology(primitives, occupiedQuadrants);
  const signature = topologySignature(topology, occupiedQuadrants.size, cfg.spectralGamma);

  // Generate content
  const slug = slugify(domainName);
  const frontmatter = generateFrontmatter(slug, domainName, topology, signature);
  const purpose = generatePurpose(domainName, occupiedQuadrants);
  const agents = generateAgents(primitives, quadrantMap, occupiedQuadrants);
  const coordination = generateCoordination(primitives, quadrantMap);
  const topologySection = generateTopology(topology, signature, occupiedQuadrants);

  const content = [
    frontmatter,
    '',
    `# ${domainName} Team`,
    '',
    purpose,
    '',
    agents,
    '',
    coordination,
    '',
    topologySection,
    '',
  ].join('\n');

  const teamName = `learn-${slug}-team`;

  return {
    generated: true,
    reason: `Generated team with ${primitives.length} primitives, ${crossRuleCount} cross-quadrant rules, ${occupiedQuadrants.size} quadrants`,
    team: {
      teamName,
      fileName: `${cfg.outputDir}/${teamName}/TEAM.md`,
      content,
      agentCount: occupiedQuadrants.size,
      topology,
      coordinationSignature: signature,
    },
  };
}
