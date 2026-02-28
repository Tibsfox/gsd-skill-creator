/**
 * Topology data pipeline for the GSD Dashboard.
 *
 * Transforms raw project skill/agent/team information into the
 * TopologyData structure consumed by the topology renderer. Handles
 * node creation, edge generation, column-based layout positioning,
 * and 12-node collapse with active-first priority.
 *
 * Pure functions, no I/O. The caller is responsible for reading
 * chipset.yaml or STATE.md and constructing the TopologySource.
 *
 * @module dashboard/topology-data
 */

import type {
  TopologyNode,
  TopologyEdge,
  TopologyData,
} from './topology-renderer.js';

// ============================================================================
// Types
// ============================================================================

/** Source data for building topology graph. */
export interface TopologySource {
  agents: Array<{ id: string; name: string; domain: string; skills: string[] }>;
  skills: Array<{ id: string; name: string; domain: string; agentId?: string }>;
  teams: Array<{ id: string; name: string; members: string[]; topology: string }>;
  activeAgentIds: string[];
  activeSkillIds: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum visible nodes before collapse. */
const MAX_VISIBLE_NODES = 12;

/** Default viewBox dimensions. */
const DEFAULT_VIEWBOX = { width: 800, height: 600 };

/** Column x-positions for layout (normalized 0-1). */
const COLUMN_X = {
  team: 0.15,
  agent: 0.5,
  skill: 0.85,
} as const;

/** Type priority for collapse sorting (higher = kept longer). */
const TYPE_PRIORITY: Record<TopologyNode['type'], number> = {
  team: 5,
  agent: 4,
  skill: 3,
  phase: 2,
  adapter: 1,
  plan: 0,
};

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Distribute items evenly along the y-axis within a column.
 * Returns normalized y values (0-1) for each index.
 */
function distributeY(count: number): number[] {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));
}

/**
 * Apply collapse logic: keep at most MAX_VISIBLE_NODES nodes,
 * prioritizing active nodes and higher type priority.
 * Returns visible nodes plus a summary node if collapsed.
 */
function collapseNodes(nodes: TopologyNode[]): TopologyNode[] {
  if (nodes.length <= MAX_VISIBLE_NODES) {
    return nodes;
  }

  // Sort: active first, then by type priority descending
  const sorted = [...nodes].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return TYPE_PRIORITY[b.type] - TYPE_PRIORITY[a.type];
  });

  const visible = sorted.slice(0, MAX_VISIBLE_NODES - 1);
  const collapsedCount = nodes.length - visible.length;

  // Add summary node
  visible.push({
    id: 'collapsed-summary',
    label: `+${collapsedCount} more`,
    type: 'plan',
    domain: 'collapsed',
    active: false,
    x: 0.85,
    y: 0.9,
  });

  return visible;
}

// ============================================================================
// Main builder
// ============================================================================

/**
 * Build TopologyData from a TopologySource.
 *
 * Steps:
 * 1. Create raw nodes from agents, skills, and teams
 * 2. Create edges from agent-skill and team-agent relationships
 * 3. Apply column-based layout positioning
 * 4. Apply collapse logic if >12 nodes
 * 5. Filter edges to only reference visible nodes
 *
 * @param source - Raw project entity data.
 * @returns Positioned, collapsed TopologyData ready for rendering.
 */
export function buildTopologyData(source: TopologySource): TopologyData {
  const activeAgentSet = new Set(source.activeAgentIds);
  const activeSkillSet = new Set(source.activeSkillIds);

  // Step 1: Create raw nodes
  const rawNodes: TopologyNode[] = [];

  // Teams (left column)
  const teamYPositions = distributeY(source.teams.length);
  for (let i = 0; i < source.teams.length; i++) {
    const team = source.teams[i];
    const teamActive = team.members.some((m) => activeAgentSet.has(m));
    rawNodes.push({
      id: team.id,
      label: team.name,
      type: 'team',
      domain: 'infrastructure',
      active: teamActive,
      x: COLUMN_X.team,
      y: teamYPositions[i],
    });
  }

  // Agents (center column)
  const agentYPositions = distributeY(source.agents.length);
  for (let i = 0; i < source.agents.length; i++) {
    const agent = source.agents[i];
    rawNodes.push({
      id: agent.id,
      label: agent.name,
      type: 'agent',
      domain: agent.domain,
      active: activeAgentSet.has(agent.id),
      x: COLUMN_X.agent,
      y: agentYPositions[i],
    });
  }

  // Skills (right column)
  const skillYPositions = distributeY(source.skills.length);
  for (let i = 0; i < source.skills.length; i++) {
    const skill = source.skills[i];
    rawNodes.push({
      id: skill.id,
      label: skill.name,
      type: 'skill',
      domain: skill.domain,
      active: activeSkillSet.has(skill.id),
      x: COLUMN_X.skill,
      y: skillYPositions[i],
    });
  }

  // Step 2: Create edges
  const nodeActiveMap = new Map<string, boolean>();
  for (const node of rawNodes) {
    nodeActiveMap.set(node.id, node.active);
  }

  const edges: TopologyEdge[] = [];

  // Agent-to-skill edges (when skill has agentId)
  for (const skill of source.skills) {
    if (skill.agentId && nodeActiveMap.has(skill.agentId)) {
      const fromActive = nodeActiveMap.get(skill.agentId) ?? false;
      const toActive = nodeActiveMap.get(skill.id) ?? false;
      edges.push({
        from: skill.agentId,
        to: skill.id,
        active: fromActive && toActive,
        domain: skill.domain,
      });
    }
  }

  // Team-to-agent edges
  for (const team of source.teams) {
    for (const memberId of team.members) {
      if (nodeActiveMap.has(memberId)) {
        const fromActive = nodeActiveMap.get(team.id) ?? false;
        const toActive = nodeActiveMap.get(memberId) ?? false;
        edges.push({
          from: team.id,
          to: memberId,
          active: fromActive && toActive,
          domain: 'infrastructure',
        });
      }
    }
  }

  // Step 3: Apply collapse
  const visibleNodes = collapseNodes(rawNodes);
  const visibleIds = new Set(visibleNodes.map((n) => n.id));

  // Step 4: Filter edges
  const visibleEdges = edges.filter(
    (e) => visibleIds.has(e.from) && visibleIds.has(e.to),
  );

  return {
    nodes: visibleNodes,
    edges: visibleEdges,
    viewBox: DEFAULT_VIEWBOX,
  };
}
