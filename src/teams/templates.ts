/**
 * Team pattern template generators.
 *
 * Pure functions that produce valid TeamConfig objects with pattern-specific
 * members, tools, and sample tasks. Five patterns supported:
 * - Leader/Worker: One leader delegates to N workers
 * - Pipeline: Sequential processing chain with stage dependencies
 * - Swarm: Peer-to-peer collaboration with self-claiming tasks
 * - Router: One router classifies work and directs to specialist members
 * - Map-Reduce: Orchestrator splits work to parallel workers and consolidates
 *
 * All generators return TemplateResult with config, sample tasks, and pattern info.
 * No side effects, no I/O -- purely data transformation.
 */

import type { TeamConfig, TeamMember, TeamTask } from '../types/team.js';

// ============================================================================
// Tool Constant Arrays
// ============================================================================

/**
 * Tools assigned to leader/coordinator agents.
 * Includes task management and teammate coordination tools.
 */
export const LEADER_TOOLS = [
  'Read', 'Write', 'Bash', 'Glob', 'Grep',
  'TaskCreate', 'TaskList', 'TaskGet', 'TaskUpdate',
  'SendMessage', 'TeammateTool',
];

/**
 * Tools assigned to worker agents in leader/worker pattern.
 * Includes file operations, web access, and task updates.
 */
export const WORKER_TOOLS = [
  'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
  'WebFetch', 'WebSearch',
  'TaskGet', 'TaskUpdate', 'SendMessage',
];

/**
 * Tools assigned to pipeline stage agents.
 * Includes file operations and task progress reporting.
 */
export const PIPELINE_STAGE_TOOLS = [
  'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
  'TaskGet', 'TaskUpdate', 'SendMessage',
];

/**
 * Tools assigned to swarm worker agents.
 * Includes TaskList for self-claiming work from the task queue.
 */
export const SWARM_WORKER_TOOLS = [
  'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
  'TaskList', 'TaskGet', 'TaskUpdate', 'SendMessage',
];

/**
 * Tools assigned to router agents.
 * Classification and delegation tools (no file writing).
 */
export const ROUTER_TOOLS = [
  'Read', 'Bash', 'Glob', 'Grep',
  'TaskCreate', 'TaskList', 'TaskGet', 'TaskUpdate',
  'SendMessage', 'TeammateTool',
];

/**
 * Tools assigned to reducer/orchestrator agents in map-reduce pattern.
 * Like leader tools plus Write for producing consolidated output.
 */
export const REDUCER_TOOLS = [
  'Read', 'Write', 'Bash', 'Glob', 'Grep',
  'TaskCreate', 'TaskList', 'TaskGet', 'TaskUpdate',
  'SendMessage', 'TeammateTool',
];

// ============================================================================
// Template Types
// ============================================================================

/**
 * Options for generating a team template.
 */
export interface TemplateOptions {
  /** Team name used as prefix for agent IDs. */
  name: string;
  /** Optional team description (defaults vary by pattern). */
  description?: string;
  /** Number of workers/stages (default: 3). */
  workerCount?: number;
}

/**
 * Result of generating a team template.
 */
export interface TemplateResult {
  /** Valid TeamConfig ready for serialization. */
  config: TeamConfig;
  /** Sample tasks demonstrating the pattern's workflow. */
  sampleTasks: TeamTask[];
  /** Metadata describing the pattern for UI/documentation. */
  patternInfo: {
    /** Topology identifier. */
    topology: string;
    /** Human-readable description of the pattern. */
    description: string;
    /** Summary of member composition (e.g., "1 lead + 3 workers"). */
    memberSummary: string;
  };
}

// ============================================================================
// Leader/Worker Template
// ============================================================================

/**
 * Generate a leader/worker team configuration.
 *
 * Creates one coordinator lead and N worker agents. The leader delegates
 * tasks and the workers execute them in parallel.
 *
 * @param opts - Template options (name, description, workerCount)
 * @returns TemplateResult with config, sample tasks, and pattern info
 */
export function generateLeaderWorkerTemplate(opts: TemplateOptions): TemplateResult {
  const workerCount = opts.workerCount ?? 3;
  const description = opts.description ?? `Leader/worker team with ${workerCount} workers`;

  const lead: TeamMember = {
    agentId: `${opts.name}-lead`,
    name: 'Lead',
    agentType: 'coordinator',
    tools: LEADER_TOOLS,
  };

  const workers: TeamMember[] = Array.from({ length: workerCount }, (_, i) => ({
    agentId: `${opts.name}-worker-${i + 1}`,
    name: `Worker ${i + 1}`,
    agentType: 'worker',
    tools: WORKER_TOOLS,
  }));

  const config: TeamConfig = {
    name: opts.name,
    description,
    leadAgentId: lead.agentId,
    createdAt: new Date().toISOString(),
    members: [lead, ...workers],
    version: 1,
    topology: 'leader-worker',
  };

  const sampleTasks: TeamTask[] = [
    {
      id: 'task-1',
      subject: 'Example parallel task A',
      description: 'Replace with your work -- this task runs in parallel with other tasks',
      status: 'pending',
    },
    {
      id: 'task-2',
      subject: 'Example parallel task B',
      description: 'Replace with your work -- workers pick up tasks assigned by the leader',
      status: 'pending',
    },
  ];

  return {
    config,
    sampleTasks,
    patternInfo: {
      topology: 'leader-worker',
      description: 'One coordinator delegates work to parallel workers',
      memberSummary: `1 lead + ${workerCount} workers`,
    },
  };
}

// ============================================================================
// Pipeline Template
// ============================================================================

/**
 * Generate a pipeline team configuration.
 *
 * Creates one orchestrator lead and N sequential stage agents. Tasks flow
 * through stages with explicit blockedBy/blocks dependencies.
 *
 * @param opts - Template options (name, description, workerCount for stage count)
 * @returns TemplateResult with config, sample tasks with dependency chain, and pattern info
 */
export function generatePipelineTemplate(opts: TemplateOptions): TemplateResult {
  const stageCount = opts.workerCount ?? 3;
  const description = opts.description ?? `Pipeline team with ${stageCount} sequential stages`;

  const lead: TeamMember = {
    agentId: `${opts.name}-lead`,
    name: 'Lead',
    agentType: 'orchestrator',
    tools: LEADER_TOOLS,
  };

  const stages: TeamMember[] = Array.from({ length: stageCount }, (_, i) => ({
    agentId: `${opts.name}-stage-${i + 1}`,
    name: `Stage ${i + 1}`,
    agentType: 'worker',
    tools: PIPELINE_STAGE_TOOLS,
  }));

  const config: TeamConfig = {
    name: opts.name,
    description,
    leadAgentId: lead.agentId,
    createdAt: new Date().toISOString(),
    members: [lead, ...stages],
    version: 1,
    topology: 'pipeline',
  };

  // Generate sequential tasks with blockedBy/blocks dependency chain
  const sampleTasks: TeamTask[] = Array.from({ length: stageCount }, (_, i) => {
    const taskId = `stage-${i + 1}`;
    const task: TeamTask = {
      id: taskId,
      subject: `Pipeline stage ${i + 1}`,
      description: `Replace with your work -- stage ${i + 1} processes output from the previous stage`,
      status: 'pending',
    };

    // First stage has no blockedBy
    if (i > 0) {
      task.blockedBy = [`stage-${i}`];
    }

    // Last stage has no blocks
    if (i < stageCount - 1) {
      task.blocks = [`stage-${i + 2}`];
    }

    return task;
  });

  return {
    config,
    sampleTasks,
    patternInfo: {
      topology: 'pipeline',
      description: 'Sequential processing chain where each stage depends on the previous',
      memberSummary: `1 lead + ${stageCount} stages`,
    },
  };
}

// ============================================================================
// Swarm Template
// ============================================================================

/**
 * Generate a swarm team configuration.
 *
 * Creates one coordinator lead and N worker agents. Workers self-claim
 * tasks from the task list -- no explicit assignment or dependencies.
 *
 * @param opts - Template options (name, description, workerCount)
 * @returns TemplateResult with config, unassigned sample tasks, and pattern info
 */
export function generateSwarmTemplate(opts: TemplateOptions): TemplateResult {
  const workerCount = opts.workerCount ?? 3;
  const description = opts.description ?? `Swarm team with ${workerCount} self-organizing workers`;

  const lead: TeamMember = {
    agentId: `${opts.name}-lead`,
    name: 'Lead',
    agentType: 'coordinator',
    tools: LEADER_TOOLS,
  };

  const workers: TeamMember[] = Array.from({ length: workerCount }, (_, i) => ({
    agentId: `${opts.name}-worker-${i + 1}`,
    name: `Worker ${i + 1}`,
    agentType: 'worker',
    tools: SWARM_WORKER_TOOLS,
  }));

  const config: TeamConfig = {
    name: opts.name,
    description,
    leadAgentId: lead.agentId,
    createdAt: new Date().toISOString(),
    members: [lead, ...workers],
    version: 1,
    topology: 'swarm',
  };

  const sampleTasks: TeamTask[] = [
    {
      id: 'task-1',
      subject: 'Example self-claimed task A',
      description: 'Replace with your work -- workers self-claim from the task list',
      status: 'pending',
    },
    {
      id: 'task-2',
      subject: 'Example self-claimed task B',
      description: 'Replace with your work -- no assignment needed, workers pick tasks autonomously',
      status: 'pending',
    },
  ];

  return {
    config,
    sampleTasks,
    patternInfo: {
      topology: 'swarm',
      description: 'Workers self-claim tasks from the shared task list',
      memberSummary: `1 lead + ${workerCount} workers`,
    },
  };
}

// ============================================================================
// Router Template
// ============================================================================

/**
 * Generate a router team configuration.
 *
 * Creates one router agent that classifies incoming work and directs it
 * to N specialist agents. The router decides which specialist handles
 * each request based on classification.
 *
 * @param opts - Template options (name, description, workerCount for specialist count)
 * @returns TemplateResult with config, sample tasks, and pattern info
 */
export function generateRouterTemplate(opts: TemplateOptions): TemplateResult {
  const specialistCount = opts.workerCount ?? 3;
  const description = opts.description ?? `Router team with ${specialistCount} specialists`;

  const router: TeamMember = {
    agentId: `${opts.name}-router`,
    name: 'Router',
    agentType: 'router',
    tools: ROUTER_TOOLS,
  };

  const specialists: TeamMember[] = Array.from({ length: specialistCount }, (_, i) => ({
    agentId: `${opts.name}-specialist-${i + 1}`,
    name: `Specialist ${i + 1}`,
    agentType: 'specialist',
    tools: WORKER_TOOLS,
  }));

  const config: TeamConfig = {
    name: opts.name,
    description,
    leadAgentId: router.agentId,
    createdAt: new Date().toISOString(),
    members: [router, ...specialists],
    version: 1,
    topology: 'router',
  };

  const sampleTasks: TeamTask[] = [
    {
      id: 'task-1',
      subject: 'Classify and route request A',
      description: 'Replace with your work -- router classifies and delegates to the appropriate specialist',
      status: 'pending',
    },
    {
      id: 'task-2',
      subject: 'Classify and route request B',
      description: 'Replace with your work -- each request is analyzed and sent to the best-fit specialist',
      status: 'pending',
    },
  ];

  return {
    config,
    sampleTasks,
    patternInfo: {
      topology: 'router',
      description: 'One router classifies work and directs to specialist members',
      memberSummary: `1 router + ${specialistCount} specialists`,
    },
  };
}

// ============================================================================
// Map-Reduce Template
// ============================================================================

/**
 * Generate a map-reduce team configuration.
 *
 * Creates one orchestrator that splits work into parallel chunks for N
 * worker agents, then consolidates the results. The map task must complete
 * before worker tasks can begin.
 *
 * @param opts - Template options (name, description, workerCount)
 * @returns TemplateResult with config, sample tasks with dependency chain, and pattern info
 */
export function generateMapReduceTemplate(opts: TemplateOptions): TemplateResult {
  const workerCount = opts.workerCount ?? 3;
  const description = opts.description ?? `Map-reduce team with ${workerCount} workers`;

  const orchestrator: TeamMember = {
    agentId: `${opts.name}-orchestrator`,
    name: 'Orchestrator',
    agentType: 'orchestrator',
    tools: REDUCER_TOOLS,
  };

  const workers: TeamMember[] = Array.from({ length: workerCount }, (_, i) => ({
    agentId: `${opts.name}-worker-${i + 1}`,
    name: `Worker ${i + 1}`,
    agentType: 'worker',
    tools: WORKER_TOOLS,
  }));

  const config: TeamConfig = {
    name: opts.name,
    description,
    leadAgentId: orchestrator.agentId,
    createdAt: new Date().toISOString(),
    members: [orchestrator, ...workers],
    version: 1,
    topology: 'map-reduce',
  };

  // Map task splits work, worker tasks depend on it
  const mapTask: TeamTask = {
    id: 'map-split',
    subject: 'Split work into parallel chunks',
    description: 'Replace with your work -- orchestrator divides the problem into independent chunks',
    status: 'pending',
  };

  const workerTasks: TeamTask[] = Array.from({ length: workerCount }, (_, i) => ({
    id: `worker-chunk-${i + 1}`,
    subject: `Process chunk ${i + 1}`,
    description: `Replace with your work -- worker processes assigned chunk independently`,
    status: 'pending',
    blockedBy: ['map-split'],
  }));

  const sampleTasks: TeamTask[] = [mapTask, ...workerTasks];

  return {
    config,
    sampleTasks,
    patternInfo: {
      topology: 'map-reduce',
      description: 'Orchestrator splits work to parallel workers and consolidates results',
      memberSummary: `1 orchestrator + ${workerCount} workers`,
    },
  };
}
