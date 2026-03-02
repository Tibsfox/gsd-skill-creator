/**
 * Spatial Computing Department Chipset Configuration.
 *
 * Defines the complete chipset for the Spatial Computing department:
 * 5 skills (one per wing) and 2 agents (spatial-guide, build-instructor).
 * New chipset -- no source pack exists; created for Phase 23.
 *
 * @module departments/spatial-computing/chipset/spatial-chipset
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single skill within the spatial-computing chipset */
export interface ChipsetSkill {
  id: string;
  domain: string;
  description: string;
}

/** An agent definition */
export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  skills: string[];
}

/** Token budget configuration */
export interface TokenBudget {
  summaryLimit: number;
  activeLimit: number;
  deepLimit: number;
}

/** Complete chipset configuration */
export interface ChipsetConfig {
  name: string;
  version: string;
  description: string;
  skills: ChipsetSkill[];
  agents: AgentDefinition[];
  tokenBudget: TokenBudget;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

const skills: ChipsetSkill[] = [
  {
    id: 'spatial-foundations-guide',
    domain: 'spatial-foundations',
    description: 'Coordinate systems, 3D navigation, spatial reasoning, geometric structures in block space',
  },
  {
    id: 'building-architecture-guide',
    domain: 'building-architecture',
    description: 'Structural principles, material properties, blueprint design, aesthetic construction',
  },
  {
    id: 'redstone-engineering-guide',
    domain: 'redstone-engineering',
    description: 'Logic gates via redstone, combinational circuits, timing, repeaters, comparators',
  },
  {
    id: 'systems-automation-guide',
    domain: 'systems-automation',
    description: 'Automated farms, item sorting networks, transportation, production chains',
  },
  {
    id: 'collaborative-design-guide',
    domain: 'collaborative-design',
    description: 'Server project planning, role specialization, iterative builds, community construction',
  },
];

// ─── Agents ──────────────────────────────────────────────────────────────────

const spatialGuideAgent: AgentDefinition = {
  id: 'spatial-guide',
  name: 'spatial-guide',
  role: 'Primary guide for spatial foundations and building -- entry point for new learners',
  skills: ['spatial-foundations-guide', 'building-architecture-guide'],
};

const buildInstructorAgent: AgentDefinition = {
  id: 'build-instructor',
  name: 'build-instructor',
  role: 'Technical instructor for redstone, automation, and collaborative design',
  skills: ['redstone-engineering-guide', 'systems-automation-guide', 'collaborative-design-guide'],
};

// ─── Chipset Config ──────────────────────────────────────────────────────────

/**
 * The complete Spatial Computing chipset configuration.
 *
 * 5 skills, 2 agents, token budget for session management.
 */
export const chipsetConfig: ChipsetConfig = {
  name: 'spatial-computing',
  version: '0.1.0',
  description:
    'Spatial Computing Department -- routes queries to 5 wings covering coordinate navigation, ' +
    'building, redstone engineering, automation, and collaborative design.',
  skills,
  agents: [spatialGuideAgent, buildInstructorAgent],
  tokenBudget: {
    summaryLimit: 3000,
    activeLimit: 12000,
    deepLimit: 50000,
  },
};
