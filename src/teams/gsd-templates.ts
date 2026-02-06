/**
 * GSD-specific team template generators.
 *
 * Pure functions that produce valid TeamConfig objects for GSD workflows:
 * - Research team: 1 synthesizer lead + 4 dimension-specific researchers
 * - Debugging team: 1 coordinator lead + 3 adversarial investigators
 *
 * Both follow the leader-worker topology and return TemplateResult objects
 * compatible with the standard template generators from templates.ts.
 * No side effects, no I/O -- purely data transformation.
 */

import type { TeamConfig, TeamMember, TeamTask } from '../types/team.js';
import type { TemplateResult } from './templates.js';
import { LEADER_TOOLS, WORKER_TOOLS } from './templates.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Research dimensions for the GSD research team.
 * Each dimension maps to a specialist researcher agent.
 */
export const RESEARCH_DIMENSIONS = [
  'stack',
  'features',
  'architecture',
  'pitfalls',
] as const;

/**
 * Agent IDs for the GSD research team (synthesizer lead + 4 researchers).
 */
export const GSD_RESEARCH_AGENT_IDS = [
  'gsd-research-synthesizer',
  'gsd-researcher-stack',
  'gsd-researcher-features',
  'gsd-researcher-architecture',
  'gsd-researcher-pitfalls',
] as const;

/**
 * Agent IDs for the GSD debugging team (lead + 3 investigators).
 */
export const GSD_DEBUG_AGENT_IDS = [
  'gsd-debug-lead',
  'gsd-debugger-alpha',
  'gsd-debugger-beta',
  'gsd-debugger-gamma',
] as const;

// ============================================================================
// Options
// ============================================================================

/**
 * Options for GSD template generators.
 */
export interface GsdTemplateOptions {
  /** Optional team name override. */
  name?: string;
  /** Optional team description override. */
  description?: string;
}

// ============================================================================
// Research dimension prompt mapping
// ============================================================================

const DIMENSION_PROMPTS: Record<(typeof RESEARCH_DIMENSIONS)[number], string> = {
  stack:
    'Research technology stack options: languages, frameworks, libraries, and runtime environments. Evaluate maturity, community support, and compatibility.',
  features:
    'Research feature capabilities and requirements: what the technology can do, API surface, extensibility points, and integration options.',
  architecture:
    'Research architectural patterns and design considerations: scalability, modularity, data flow, and deployment topology.',
  pitfalls:
    'Research known pitfalls, limitations, and failure modes: common mistakes, performance gotchas, security concerns, and migration risks.',
};

// ============================================================================
// Research Team Generator
// ============================================================================

/**
 * Generate a GSD parallel research team configuration.
 *
 * Creates one synthesizer lead (coordinator) and four specialist researcher
 * agents, one per research dimension. The synthesizer coordinates research
 * tasks and produces a unified synthesis from all dimensions.
 *
 * @param opts - Optional name and description overrides
 * @returns TemplateResult with config, sample tasks, and pattern info
 */
export function generateGsdResearchTeam(
  opts?: GsdTemplateOptions,
): TemplateResult {
  const name = opts?.name ?? 'gsd-research';
  const description =
    opts?.description ??
    'GSD parallel research team: 4 specialist researchers + synthesizer lead';

  const lead: TeamMember = {
    agentId: 'gsd-research-synthesizer',
    name: 'Research Synthesizer',
    agentType: 'coordinator',
    model: 'sonnet',
    tools: LEADER_TOOLS,
    prompt:
      'Coordinate parallel research across stack, features, architecture, and pitfalls dimensions. Synthesize findings into a unified research report with recommendations.',
  };

  const researchers: TeamMember[] = RESEARCH_DIMENSIONS.map((dimension) => ({
    agentId: `gsd-researcher-${dimension}` as string,
    name: `Researcher (${dimension})`,
    agentType: 'specialist' as const,
    model: 'opus' as const,
    tools: WORKER_TOOLS,
    prompt: DIMENSION_PROMPTS[dimension],
  }));

  const config: TeamConfig = {
    name,
    description,
    leadAgentId: lead.agentId,
    createdAt: new Date().toISOString(),
    members: [lead, ...researchers],
    version: 1,
    topology: 'leader-worker',
  };

  const researchTaskIds = RESEARCH_DIMENSIONS.map(
    (dim) => `research-${dim}`,
  );

  const researchTasks: TeamTask[] = RESEARCH_DIMENSIONS.map((dimension) => ({
    id: `research-${dimension}`,
    subject: `Research ${dimension} dimension`,
    description: `Investigate ${dimension} aspects: ${DIMENSION_PROMPTS[dimension].toLowerCase()}`,
    status: 'pending' as const,
  }));

  const synthesisTask: TeamTask = {
    id: 'synthesize',
    subject: 'Synthesize research findings',
    description:
      'Combine findings from all research dimensions into a unified report with recommendations and trade-off analysis.',
    status: 'pending',
    blockedBy: researchTaskIds,
  };

  return {
    config,
    sampleTasks: [...researchTasks, synthesisTask],
    patternInfo: {
      topology: 'leader-worker',
      description:
        'Parallel research across 4 dimensions with synthesis by coordinator',
      memberSummary: '1 synthesizer + 4 researchers',
    },
  };
}

// ============================================================================
// Debugging Team Generator
// ============================================================================

/**
 * Debugger definitions for the adversarial debugging team.
 * Each debugger has a distinct investigation angle.
 */
const DEBUGGER_DEFS = [
  {
    agentId: 'gsd-debugger-alpha',
    name: 'Debugger Alpha',
    model: 'opus' as const,
    prompt:
      'Primary hypothesis investigator. Form the most likely explanation for the bug and systematically verify or refute it through code analysis, logging, and reproduction.',
  },
  {
    agentId: 'gsd-debugger-beta',
    name: 'Debugger Beta',
    model: 'opus' as const,
    prompt:
      'Adversarial investigator. Challenge the primary hypothesis by exploring alternative explanations, edge cases, and unexpected interaction patterns that others may overlook.',
  },
  {
    agentId: 'gsd-debugger-gamma',
    name: 'Debugger Gamma',
    model: 'sonnet' as const,
    prompt:
      'Environmental and configuration investigator. Focus on infrastructure, dependencies, environment variables, build configuration, and deployment-related root causes.',
  },
] as const;

/**
 * Generate a GSD adversarial debugging team configuration.
 *
 * Creates one coordinator lead and three specialist debuggers with
 * competing investigation angles. The coordinator forms hypotheses
 * and synthesizes findings from all investigators.
 *
 * @param opts - Optional name and description overrides
 * @returns TemplateResult with config, sample tasks, and pattern info
 */
export function generateGsdDebuggingTeam(
  opts?: GsdTemplateOptions,
): TemplateResult {
  const name = opts?.name ?? 'gsd-debug';
  const description =
    opts?.description ??
    'GSD adversarial debugging team: competing hypotheses with 3 investigators';

  const lead: TeamMember = {
    agentId: 'gsd-debug-lead',
    name: 'Debug Coordinator',
    agentType: 'coordinator',
    model: 'opus',
    tools: LEADER_TOOLS,
    prompt:
      'Coordinate adversarial debugging. Form initial hypotheses, dispatch investigators with competing angles, and synthesize findings into a root cause analysis with fix recommendations.',
  };

  const debuggers: TeamMember[] = DEBUGGER_DEFS.map((def) => ({
    agentId: def.agentId as string,
    name: def.name,
    agentType: 'specialist' as const,
    model: def.model,
    tools: WORKER_TOOLS,
    prompt: def.prompt,
  }));

  const config: TeamConfig = {
    name,
    description,
    leadAgentId: lead.agentId,
    createdAt: new Date().toISOString(),
    members: [lead, ...debuggers],
    version: 1,
    topology: 'leader-worker',
  };

  const investigationIds = DEBUGGER_DEFS.map(
    (def) => `investigate-${def.agentId.replace('gsd-debugger-', '')}`,
  );

  const hypothesizeTask: TeamTask = {
    id: 'hypothesize',
    subject: 'Form debugging hypotheses',
    description:
      'Analyze the bug report, reproduce the issue, and form initial hypotheses for investigation.',
    status: 'pending',
  };

  const investigationTasks: TeamTask[] = DEBUGGER_DEFS.map((def, i) => ({
    id: investigationIds[i],
    subject: `Investigate: ${def.name}`,
    description: def.prompt,
    status: 'pending' as const,
    blockedBy: ['hypothesize'],
  }));

  const synthesizeTask: TeamTask = {
    id: 'synthesize',
    subject: 'Synthesize debugging findings',
    description:
      'Combine investigation results from all angles into a root cause analysis with recommended fix and prevention strategy.',
    status: 'pending',
    blockedBy: investigationIds,
  };

  return {
    config,
    sampleTasks: [hypothesizeTask, ...investigationTasks, synthesizeTask],
    patternInfo: {
      topology: 'leader-worker',
      description:
        'Adversarial debugging with competing hypotheses and synthesis',
      memberSummary: '1 coordinator + 3 debuggers',
    },
  };
}
