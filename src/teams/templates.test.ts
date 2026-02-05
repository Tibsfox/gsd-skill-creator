import { describe, it, expect } from 'vitest';
import {
  generateLeaderWorkerTemplate,
  generatePipelineTemplate,
  generateSwarmTemplate,
  LEADER_TOOLS,
  WORKER_TOOLS,
  PIPELINE_STAGE_TOOLS,
  SWARM_WORKER_TOOLS,
} from './templates.js';
import { validateTeamConfig } from '../validation/team-validation.js';

// ============================================================================
// Leader/Worker Template Tests
// ============================================================================

describe('generateLeaderWorkerTemplate', () => {
  it('should produce config with 1 lead + 3 workers by default', () => {
    const result = generateLeaderWorkerTemplate({ name: 'test-team' });
    expect(result.config.members).toHaveLength(4);
  });

  it('should create lead with correct agentId and agentType', () => {
    const result = generateLeaderWorkerTemplate({ name: 'alpha' });
    const lead = result.config.members[0];
    expect(lead.agentId).toBe('alpha-lead');
    expect(lead.name).toBe('Lead');
    expect(lead.agentType).toBe('coordinator');
  });

  it('should create workers with sequential agentIds', () => {
    const result = generateLeaderWorkerTemplate({ name: 'alpha' });
    const workers = result.config.members.slice(1);
    expect(workers[0].agentId).toBe('alpha-worker-1');
    expect(workers[1].agentId).toBe('alpha-worker-2');
    expect(workers[2].agentId).toBe('alpha-worker-3');
  });

  it('should name workers sequentially', () => {
    const result = generateLeaderWorkerTemplate({ name: 'alpha' });
    const workers = result.config.members.slice(1);
    expect(workers[0].name).toBe('Worker 1');
    expect(workers[1].name).toBe('Worker 2');
    expect(workers[2].name).toBe('Worker 3');
  });

  it('should set all workers to agentType worker', () => {
    const result = generateLeaderWorkerTemplate({ name: 'alpha' });
    const workers = result.config.members.slice(1);
    for (const worker of workers) {
      expect(worker.agentType).toBe('worker');
    }
  });

  it('should support custom workerCount', () => {
    const result = generateLeaderWorkerTemplate({ name: 'big', workerCount: 5 });
    expect(result.config.members).toHaveLength(6); // 1 lead + 5 workers
    expect(result.config.members[5].agentId).toBe('big-worker-5');
  });

  it('should set config name and leadAgentId correctly', () => {
    const result = generateLeaderWorkerTemplate({ name: 'my-team' });
    expect(result.config.name).toBe('my-team');
    expect(result.config.leadAgentId).toBe('my-team-lead');
  });

  it('should set topology to leader-worker', () => {
    const result = generateLeaderWorkerTemplate({ name: 'test' });
    expect((result.config as Record<string, unknown>).topology).toBe('leader-worker');
  });

  it('should include version 1', () => {
    const result = generateLeaderWorkerTemplate({ name: 'test' });
    expect((result.config as Record<string, unknown>).version).toBe(1);
  });

  it('should use default description when none provided', () => {
    const result = generateLeaderWorkerTemplate({ name: 'test' });
    expect(result.config.description).toBe('Leader/worker team with 3 workers');
  });

  it('should use custom description when provided', () => {
    const result = generateLeaderWorkerTemplate({
      name: 'test',
      description: 'Custom research team',
    });
    expect(result.config.description).toBe('Custom research team');
  });

  it('should return 2 sample tasks with status pending', () => {
    const result = generateLeaderWorkerTemplate({ name: 'test' });
    expect(result.sampleTasks).toHaveLength(2);
    for (const task of result.sampleTasks) {
      expect(task.status).toBe('pending');
    }
  });

  it('should set patternInfo correctly', () => {
    const result = generateLeaderWorkerTemplate({ name: 'test' });
    expect(result.patternInfo.topology).toBe('leader-worker');
    expect(result.patternInfo.memberSummary).toBe('1 lead + 3 workers');
  });

  it('should assign LEADER_TOOLS to lead', () => {
    const result = generateLeaderWorkerTemplate({ name: 'test' });
    const lead = result.config.members[0];
    expect((lead as Record<string, unknown>).tools).toEqual(LEADER_TOOLS);
  });

  it('should assign WORKER_TOOLS to workers', () => {
    const result = generateLeaderWorkerTemplate({ name: 'test' });
    const workers = result.config.members.slice(1);
    for (const worker of workers) {
      expect((worker as Record<string, unknown>).tools).toEqual(WORKER_TOOLS);
    }
  });

  it('should produce config that passes validateTeamConfig', () => {
    const result = generateLeaderWorkerTemplate({ name: 'valid-team' });
    const validation = validateTeamConfig(result.config);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});

// ============================================================================
// Pipeline Template Tests
// ============================================================================

describe('generatePipelineTemplate', () => {
  it('should produce config with 1 lead + 3 stages by default', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    expect(result.config.members).toHaveLength(4);
  });

  it('should create lead with agentType orchestrator', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    const lead = result.config.members[0];
    expect(lead.agentId).toBe('pipe-lead');
    expect(lead.agentType).toBe('orchestrator');
  });

  it('should create stage members with sequential agentIds', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    const stages = result.config.members.slice(1);
    expect(stages[0].agentId).toBe('pipe-stage-1');
    expect(stages[1].agentId).toBe('pipe-stage-2');
    expect(stages[2].agentId).toBe('pipe-stage-3');
  });

  it('should name stages sequentially', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    const stages = result.config.members.slice(1);
    expect(stages[0].name).toBe('Stage 1');
    expect(stages[1].name).toBe('Stage 2');
    expect(stages[2].name).toBe('Stage 3');
  });

  it('should set stage members to agentType worker', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    const stages = result.config.members.slice(1);
    for (const stage of stages) {
      expect(stage.agentType).toBe('worker');
    }
  });

  it('should set topology to pipeline', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    expect((result.config as Record<string, unknown>).topology).toBe('pipeline');
  });

  it('should include version 1', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    expect((result.config as Record<string, unknown>).version).toBe(1);
  });

  it('should return 3 sample tasks with sequential dependencies', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    expect(result.sampleTasks).toHaveLength(3);
  });

  it('should have task 1 with no blockedBy and blocks stage-2', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    const task1 = result.sampleTasks[0];
    expect(task1.id).toBe('stage-1');
    expect(task1.blockedBy).toBeUndefined();
    expect(task1.blocks).toEqual(['stage-2']);
  });

  it('should have task 2 blockedBy stage-1 and blocks stage-3', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    const task2 = result.sampleTasks[1];
    expect(task2.id).toBe('stage-2');
    expect(task2.blockedBy).toEqual(['stage-1']);
    expect(task2.blocks).toEqual(['stage-3']);
  });

  it('should have task 3 blockedBy stage-2 and no blocks', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    const task3 = result.sampleTasks[2];
    expect(task3.id).toBe('stage-3');
    expect(task3.blockedBy).toEqual(['stage-2']);
    expect(task3.blocks).toBeUndefined();
  });

  it('should set all tasks to status pending', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    for (const task of result.sampleTasks) {
      expect(task.status).toBe('pending');
    }
  });

  it('should set patternInfo correctly', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    expect(result.patternInfo.topology).toBe('pipeline');
    expect(result.patternInfo.memberSummary).toBe('1 lead + 3 stages');
  });

  it('should support custom stage count via workerCount', () => {
    const result = generatePipelineTemplate({ name: 'pipe', workerCount: 5 });
    expect(result.config.members).toHaveLength(6); // 1 lead + 5 stages
    expect(result.sampleTasks).toHaveLength(5);
    // Verify last task has no blocks
    expect(result.sampleTasks[4].blocks).toBeUndefined();
    // Verify second-to-last blocks last
    expect(result.sampleTasks[3].blocks).toEqual(['stage-5']);
  });

  it('should assign PIPELINE_STAGE_TOOLS to stages', () => {
    const result = generatePipelineTemplate({ name: 'pipe' });
    const stages = result.config.members.slice(1);
    for (const stage of stages) {
      expect((stage as Record<string, unknown>).tools).toEqual(PIPELINE_STAGE_TOOLS);
    }
  });

  it('should produce config that passes validateTeamConfig', () => {
    const result = generatePipelineTemplate({ name: 'valid-pipe' });
    const validation = validateTeamConfig(result.config);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});

// ============================================================================
// Swarm Template Tests
// ============================================================================

describe('generateSwarmTemplate', () => {
  it('should produce config with 1 lead + 3 workers by default', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    expect(result.config.members).toHaveLength(4);
  });

  it('should create lead with agentType coordinator', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    const lead = result.config.members[0];
    expect(lead.agentId).toBe('swarm-lead');
    expect(lead.agentType).toBe('coordinator');
  });

  it('should create workers with sequential agentIds', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    const workers = result.config.members.slice(1);
    expect(workers[0].agentId).toBe('swarm-worker-1');
    expect(workers[1].agentId).toBe('swarm-worker-2');
    expect(workers[2].agentId).toBe('swarm-worker-3');
  });

  it('should set topology to swarm', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    expect((result.config as Record<string, unknown>).topology).toBe('swarm');
  });

  it('should include version 1', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    expect((result.config as Record<string, unknown>).version).toBe(1);
  });

  it('should return 2 sample tasks with no owner (self-claiming)', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    expect(result.sampleTasks).toHaveLength(2);
    for (const task of result.sampleTasks) {
      expect(task.owner).toBeUndefined();
    }
  });

  it('should return 2 sample tasks with no blockedBy (no dependencies)', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    for (const task of result.sampleTasks) {
      expect(task.blockedBy).toBeUndefined();
    }
  });

  it('should return tasks with status pending', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    for (const task of result.sampleTasks) {
      expect(task.status).toBe('pending');
    }
  });

  it('should set patternInfo correctly', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    expect(result.patternInfo.topology).toBe('swarm');
    expect(result.patternInfo.memberSummary).toBe('1 lead + 3 workers');
  });

  it('should support custom workerCount', () => {
    const result = generateSwarmTemplate({ name: 'swarm', workerCount: 7 });
    expect(result.config.members).toHaveLength(8); // 1 lead + 7 workers
    expect(result.patternInfo.memberSummary).toBe('1 lead + 7 workers');
  });

  it('should assign SWARM_WORKER_TOOLS to workers', () => {
    const result = generateSwarmTemplate({ name: 'swarm' });
    const workers = result.config.members.slice(1);
    for (const worker of workers) {
      expect((worker as Record<string, unknown>).tools).toEqual(SWARM_WORKER_TOOLS);
    }
  });

  it('should produce config that passes validateTeamConfig', () => {
    const result = generateSwarmTemplate({ name: 'valid-swarm' });
    const validation = validateTeamConfig(result.config);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});

// ============================================================================
// Cross-template Tests
// ============================================================================

describe('Cross-template properties', () => {
  const templates = [
    { name: 'leader-worker', fn: generateLeaderWorkerTemplate },
    { name: 'pipeline', fn: generatePipelineTemplate },
    { name: 'swarm', fn: generateSwarmTemplate },
  ];

  for (const { name, fn } of templates) {
    it(`${name}: should include version 1 in config`, () => {
      const result = fn({ name: 'test' });
      expect((result.config as Record<string, unknown>).version).toBe(1);
    });

    it(`${name}: should have createdAt as valid ISO string`, () => {
      const result = fn({ name: 'test' });
      const createdAt = result.config.createdAt;
      expect(createdAt).toBeDefined();
      // Verify it parses as a valid date
      const parsed = new Date(createdAt);
      expect(parsed.toISOString()).toBe(createdAt);
    });

    it(`${name}: should have leadAgentId matching a member agentId`, () => {
      const result = fn({ name: 'test' });
      const memberIds = result.config.members.map((m) => m.agentId);
      expect(memberIds).toContain(result.config.leadAgentId);
    });

    it(`${name}: config passes validateTeamConfig`, () => {
      const result = fn({ name: 'cross-check' });
      const validation = validateTeamConfig(result.config);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  }
});
