/**
 * Pre-wiring engine for resource manifest to planning doc conversion.
 *
 * Converts a ResourceManifest into a PreWiringResult containing
 * structured skill assignments, topology info, agent configurations,
 * gap analysis, and markdown output suitable for embedding in
 * planning documents.
 *
 * Pure functions, no I/O. All data passed as arguments.
 *
 * @module staging/queue/pre-wiring
 */

import type {
  ResourceManifest,
  SkillMatchStatus,
  TopologyType,
} from '../resource/types.js';

// ============================================================================
// Types
// ============================================================================

/** Options for generating pre-wiring from a resource manifest. */
export interface PreWiringOptions {
  /** The resource manifest to convert. */
  manifest: ResourceManifest;
  /** Queue entry ID for traceability. */
  entryId: string;
}

/** A skill pre-wired for use in a planning doc. */
export interface PreWiredSkill {
  /** Skill name. */
  name: string;
  /** Match status from resource analysis. */
  status: SkillMatchStatus;
  /** Relevance score (0-1). */
  relevance: number;
  /** Scope of the skill (user-level or project-level). */
  scope?: 'user' | 'project';
}

/** Topology section for the planning doc. */
export interface PreWiredTopology {
  /** Topology pattern type. */
  type: TopologyType;
  /** Number of agents recommended. */
  agentCount: number;
  /** Rationale for the topology choice. */
  rationale: string;
  /** Confidence in the topology recommendation. */
  confidence: number;
}

/** An agent assignment derived from topology and skills. */
export interface PreWiredAgent {
  /** Role label (e.g., 'executor', 'stage-1', 'coordinator', 'worker-1'). */
  role: string;
  /** Skill names assigned to this agent. */
  skills: string[];
}

/** Complete pre-wiring result for embedding in planning docs. */
export interface PreWiringResult {
  /** Queue entry ID for traceability. */
  entryId: string;
  /** Pre-wired skills (ready, flagged, recommended -- excludes missing). */
  skills: PreWiredSkill[];
  /** Topology section. */
  topology: PreWiredTopology;
  /** Agent assignments derived from topology and skills. */
  agents: PreWiredAgent[];
  /** Gaps: missing skill coverage descriptions. */
  gaps: string[];
  /** Markdown string for embedding in planning docs. */
  markdown: string;
}

// ============================================================================
// Skill extraction
// ============================================================================

/**
 * Extract non-missing skills from the manifest as PreWiredSkills.
 * Missing skills are excluded (they become gaps instead).
 */
function extractSkills(manifest: ResourceManifest): PreWiredSkill[] {
  return manifest.skillMatches
    .filter((m) => m.status !== 'missing')
    .map((m) => ({
      name: m.skillName,
      status: m.status,
      relevance: m.relevance,
      ...(m.scope ? { scope: m.scope } : {}),
    }));
}

/**
 * Extract gap descriptions from missing skills in the manifest.
 */
function extractGaps(manifest: ResourceManifest): string[] {
  return manifest.skillMatches
    .filter((m) => m.status === 'missing')
    .map((m) => `Missing skill coverage for: ${m.skillName}`);
}

// ============================================================================
// Topology mapping
// ============================================================================

/**
 * Map a TopologyRecommendation to a PreWiredTopology.
 */
function mapTopology(manifest: ResourceManifest): PreWiredTopology {
  const topo = manifest.topology;
  return {
    type: topo.topology,
    agentCount: topo.agentCount,
    rationale: topo.rationale,
    confidence: topo.confidence,
  };
}

// ============================================================================
// Agent derivation
// ============================================================================

/**
 * Derive agent assignments from topology type and available skills.
 *
 * - single: 1 agent gets all skills
 * - pipeline: distribute skills round-robin across agentCount agents, named stage-1..N
 * - map-reduce: 1 coordinator + (agentCount-1) workers; coordinator gets first skill, workers split rest
 * - router: 1 router + (agentCount-1) handlers; router gets no skills, handlers split all
 * - hybrid: same as pipeline (best general assignment strategy)
 */
function deriveAgents(
  topologyType: TopologyType,
  agentCount: number,
  skills: PreWiredSkill[],
): PreWiredAgent[] {
  const skillNames = skills.map((s) => s.name);

  switch (topologyType) {
    case 'single':
      return [{ role: 'executor', skills: skillNames }];

    case 'pipeline':
    case 'hybrid':
      return derivePipelineAgents(agentCount, skillNames);

    case 'map-reduce':
      return deriveMapReduceAgents(agentCount, skillNames);

    case 'router':
      return deriveRouterAgents(agentCount, skillNames);

    default:
      return [{ role: 'executor', skills: skillNames }];
  }
}

/**
 * Pipeline/hybrid: distribute skills round-robin across stages.
 */
function derivePipelineAgents(agentCount: number, skillNames: string[]): PreWiredAgent[] {
  const agents: PreWiredAgent[] = [];
  for (let i = 0; i < agentCount; i++) {
    agents.push({ role: `stage-${i + 1}`, skills: [] });
  }

  for (let i = 0; i < skillNames.length; i++) {
    agents[i % agentCount].skills.push(skillNames[i]);
  }

  return agents;
}

/**
 * Map-reduce: 1 coordinator (first skill) + workers (remaining skills split).
 */
function deriveMapReduceAgents(agentCount: number, skillNames: string[]): PreWiredAgent[] {
  const agents: PreWiredAgent[] = [];

  // Coordinator gets the first skill
  const coordinatorSkills = skillNames.length > 0 ? [skillNames[0]] : [];
  agents.push({ role: 'coordinator', skills: coordinatorSkills });

  // Workers split the remaining skills
  const workerCount = agentCount - 1;
  const remainingSkills = skillNames.slice(1);

  for (let i = 0; i < workerCount; i++) {
    agents.push({ role: `worker-${i + 1}`, skills: [] });
  }

  for (let i = 0; i < remainingSkills.length; i++) {
    agents[1 + (i % workerCount)].skills.push(remainingSkills[i]);
  }

  return agents;
}

/**
 * Router: 1 router (no skills) + handlers (all skills split).
 */
function deriveRouterAgents(agentCount: number, skillNames: string[]): PreWiredAgent[] {
  const agents: PreWiredAgent[] = [];

  // Router gets no skills
  agents.push({ role: 'router', skills: [] });

  // Handlers split all skills
  const handlerCount = agentCount - 1;
  for (let i = 0; i < handlerCount; i++) {
    agents.push({ role: `handler-${i + 1}`, skills: [] });
  }

  for (let i = 0; i < skillNames.length; i++) {
    agents[1 + (i % handlerCount)].skills.push(skillNames[i]);
  }

  return agents;
}

// ============================================================================
// Markdown generation
// ============================================================================

/**
 * Generate markdown string from structured pre-wiring data.
 */
function generateMarkdown(
  skills: PreWiredSkill[],
  topology: PreWiredTopology,
  agents: PreWiredAgent[],
  gaps: string[],
): string {
  const lines: string[] = [];

  lines.push('## Pre-Wired Resources');
  lines.push('');

  // Skills section
  lines.push('### Skills');
  if (skills.length === 0) {
    lines.push('- (none)');
  } else {
    for (const skill of skills) {
      const scope = skill.scope ?? 'unknown';
      lines.push(`- [${skill.status}] ${skill.name} (${scope}, relevance: ${skill.relevance})`);
    }
  }
  lines.push('');

  // Topology section
  lines.push('### Topology');
  lines.push(`Type: ${topology.type} (confidence: ${topology.confidence})`);
  lines.push(`Agents: ${topology.agentCount}`);
  lines.push('');

  // Agent Assignments section
  lines.push('### Agent Assignments');
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const skillList = agent.skills.length > 0 ? agent.skills.join(', ') : '(none)';
    lines.push(`- Agent ${i + 1} (${agent.role}): ${skillList}`);
  }

  // Gaps section (only if gaps exist)
  if (gaps.length > 0) {
    lines.push('');
    lines.push('### Gaps');
    for (const gap of gaps) {
      lines.push(`- ${gap}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Main function
// ============================================================================

/**
 * Generate a pre-wiring result from a resource manifest.
 *
 * Converts a ResourceManifest into structured planning doc resource
 * assignments, including skill lists, topology mapping, agent
 * derivation, gap analysis, and markdown output.
 *
 * @param options - The manifest and entry ID.
 * @returns A complete PreWiringResult.
 */
export function generatePreWiring(options: PreWiringOptions): PreWiringResult {
  const { manifest, entryId } = options;

  // Extract skills (exclude missing) and gaps (missing only)
  const skills = extractSkills(manifest);
  const gaps = extractGaps(manifest);

  // Map topology
  const topology = mapTopology(manifest);

  // Derive agents from topology type and available skills
  const agents = deriveAgents(
    manifest.topology.topology,
    manifest.topology.agentCount,
    skills,
  );

  // Generate markdown
  const markdown = generateMarkdown(skills, topology, agents, gaps);

  return {
    entryId,
    skills,
    topology,
    agents,
    gaps,
    markdown,
  };
}
