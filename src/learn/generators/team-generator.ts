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
}

export interface GeneratedTeam {
  teamName: string;
  fileName: string;
  content: string;
  agentCount: number;
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

function generateFrontmatter(slug: string, domainName: string): string {
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

function generateTopology(
  primitives: MathematicalPrimitive[],
  quadrants: Set<Quadrant>,
): string {
  // Determine topology based on composition patterns
  // If most rules are sequential -> pipeline
  // Otherwise -> leader-worker
  let sequentialCount = 0;
  let totalRules = 0;

  for (const p of primitives) {
    for (const rule of p.compositionRules ?? []) {
      totalRules++;
      if (rule.type === 'sequential') sequentialCount++;
    }
  }

  const topology = totalRules > 0 && sequentialCount / totalRules > 0.5
    ? 'pipeline'
    : 'leader-worker';

  const topologyDescription = topology === 'pipeline'
    ? 'Sequential pipeline: agents process in order, each feeding results to the next.'
    : 'Leader-worker: lead agent coordinates specialist agents per quadrant.';

  return [
    '## Topology',
    '',
    `**Type:** ${topology}`,
    `**Agent count:** ${quadrants.size}`,
    '',
    topologyDescription,
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

  // Generate content
  const slug = slugify(domainName);
  const frontmatter = generateFrontmatter(slug, domainName);
  const purpose = generatePurpose(domainName, occupiedQuadrants);
  const agents = generateAgents(primitives, quadrantMap, occupiedQuadrants);
  const coordination = generateCoordination(primitives, quadrantMap);
  const topology = generateTopology(primitives, occupiedQuadrants);

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
    topology,
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
    },
  };
}
