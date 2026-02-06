import { describe, it, expect } from 'vitest';
import {
  generateGsdResearchTeam,
  generateGsdDebuggingTeam,
  GSD_RESEARCH_AGENT_IDS,
  GSD_DEBUG_AGENT_IDS,
  RESEARCH_DIMENSIONS,
} from './gsd-templates.js';
import { LEADER_TOOLS, WORKER_TOOLS } from './templates.js';
import { validateTeamConfig } from '../validation/team-validation.js';

// ============================================================================
// GSD Research Team Tests
// ============================================================================

describe('generateGsdResearchTeam', () => {
  it('should produce config with 5 members (1 lead + 4 researchers)', () => {
    const result = generateGsdResearchTeam();
    expect(result.config.members).toHaveLength(5);
  });

  it('should have lead with agentId gsd-research-synthesizer and agentType coordinator', () => {
    const result = generateGsdResearchTeam();
    const lead = result.config.members[0];
    expect(lead.agentId).toBe('gsd-research-synthesizer');
    expect(lead.agentType).toBe('coordinator');
  });

  it('should have 4 researchers with dimension-specific agentIds and agentType specialist', () => {
    const result = generateGsdResearchTeam();
    const researchers = result.config.members.slice(1);
    expect(researchers).toHaveLength(4);
    expect(researchers[0].agentId).toBe('gsd-researcher-stack');
    expect(researchers[1].agentId).toBe('gsd-researcher-features');
    expect(researchers[2].agentId).toBe('gsd-researcher-architecture');
    expect(researchers[3].agentId).toBe('gsd-researcher-pitfalls');
    for (const r of researchers) {
      expect(r.agentType).toBe('specialist');
    }
  });

  it('should default name to gsd-research', () => {
    const result = generateGsdResearchTeam();
    expect(result.config.name).toBe('gsd-research');
  });

  it('should default description correctly', () => {
    const result = generateGsdResearchTeam();
    expect(result.config.description).toBe(
      'GSD parallel research team: 4 specialist researchers + synthesizer lead',
    );
  });

  it('should allow custom name and description overrides', () => {
    const result = generateGsdResearchTeam({
      name: 'my-research',
      description: 'Custom research desc',
    });
    expect(result.config.name).toBe('my-research');
    expect(result.config.description).toBe('Custom research desc');
  });

  it('should set leadAgentId matching lead member agentId', () => {
    const result = generateGsdResearchTeam();
    expect(result.config.leadAgentId).toBe('gsd-research-synthesizer');
    expect(result.config.leadAgentId).toBe(result.config.members[0].agentId);
  });

  it('should set topology to leader-worker and version to 1', () => {
    const result = generateGsdResearchTeam();
    const config = result.config as Record<string, unknown>;
    expect(config.topology).toBe('leader-worker');
    expect(config.version).toBe(1);
  });

  it('should have 5 sample tasks (4 research + 1 synthesis)', () => {
    const result = generateGsdResearchTeam();
    expect(result.sampleTasks).toHaveLength(5);
  });

  it('should have synthesis task blockedBy all 4 research task IDs', () => {
    const result = generateGsdResearchTeam();
    const synthesisTask = result.sampleTasks[4];
    expect(synthesisTask.id).toBe('synthesize');
    expect(synthesisTask.blockedBy).toEqual([
      'research-stack',
      'research-features',
      'research-architecture',
      'research-pitfalls',
    ]);
  });

  it('should have all research tasks with status pending and no dependencies', () => {
    const result = generateGsdResearchTeam();
    const researchTasks = result.sampleTasks.slice(0, 4);
    for (const task of researchTasks) {
      expect(task.status).toBe('pending');
      expect(task.blockedBy).toBeUndefined();
    }
  });

  it('should set patternInfo with correct topology, description, and memberSummary', () => {
    const result = generateGsdResearchTeam();
    expect(result.patternInfo.topology).toBe('leader-worker');
    expect(result.patternInfo.description).toContain('research');
    expect(result.patternInfo.memberSummary).toBe('1 synthesizer + 4 researchers');
  });

  it('should assign LEADER_TOOLS to lead and WORKER_TOOLS to researchers', () => {
    const result = generateGsdResearchTeam();
    const lead = result.config.members[0] as Record<string, unknown>;
    expect(lead.tools).toEqual(LEADER_TOOLS);
    const researchers = result.config.members.slice(1);
    for (const r of researchers) {
      expect((r as Record<string, unknown>).tools).toEqual(WORKER_TOOLS);
    }
  });

  it('should produce config that passes validateTeamConfig with zero errors', () => {
    const result = generateGsdResearchTeam();
    const validation = validateTeamConfig(result.config);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should have all unique agentIds', () => {
    const result = generateGsdResearchTeam();
    const ids = result.config.members.map((m) => m.agentId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================================================
// GSD Debugging Team Tests
// ============================================================================

describe('generateGsdDebuggingTeam', () => {
  it('should produce config with 4 members (1 lead + 3 debuggers)', () => {
    const result = generateGsdDebuggingTeam();
    expect(result.config.members).toHaveLength(4);
  });

  it('should have lead with agentId gsd-debug-lead and agentType coordinator', () => {
    const result = generateGsdDebuggingTeam();
    const lead = result.config.members[0];
    expect(lead.agentId).toBe('gsd-debug-lead');
    expect(lead.agentType).toBe('coordinator');
  });

  it('should have 3 debuggers with correct agentIds (alpha, beta, gamma) and agentType specialist', () => {
    const result = generateGsdDebuggingTeam();
    const debuggers = result.config.members.slice(1);
    expect(debuggers).toHaveLength(3);
    expect(debuggers[0].agentId).toBe('gsd-debugger-alpha');
    expect(debuggers[1].agentId).toBe('gsd-debugger-beta');
    expect(debuggers[2].agentId).toBe('gsd-debugger-gamma');
    for (const d of debuggers) {
      expect(d.agentType).toBe('specialist');
    }
  });

  it('should default name to gsd-debug', () => {
    const result = generateGsdDebuggingTeam();
    expect(result.config.name).toBe('gsd-debug');
  });

  it('should default description correctly', () => {
    const result = generateGsdDebuggingTeam();
    expect(result.config.description).toBe(
      'GSD adversarial debugging team: competing hypotheses with 3 investigators',
    );
  });

  it('should allow custom name and description overrides', () => {
    const result = generateGsdDebuggingTeam({
      name: 'my-debug',
      description: 'Custom debug desc',
    });
    expect(result.config.name).toBe('my-debug');
    expect(result.config.description).toBe('Custom debug desc');
  });

  it('should set leadAgentId matching lead member agentId', () => {
    const result = generateGsdDebuggingTeam();
    expect(result.config.leadAgentId).toBe('gsd-debug-lead');
    expect(result.config.leadAgentId).toBe(result.config.members[0].agentId);
  });

  it('should set topology to leader-worker and version to 1', () => {
    const result = generateGsdDebuggingTeam();
    const config = result.config as Record<string, unknown>;
    expect(config.topology).toBe('leader-worker');
    expect(config.version).toBe(1);
  });

  it('should have 5 sample tasks (1 hypothesize + 3 investigate + 1 synthesize)', () => {
    const result = generateGsdDebuggingTeam();
    expect(result.sampleTasks).toHaveLength(5);
    expect(result.sampleTasks[0].id).toBe('hypothesize');
    expect(result.sampleTasks[1].id).toBe('investigate-alpha');
    expect(result.sampleTasks[2].id).toBe('investigate-beta');
    expect(result.sampleTasks[3].id).toBe('investigate-gamma');
    expect(result.sampleTasks[4].id).toBe('synthesize');
  });

  it('should have 3 investigation tasks blockedBy hypothesize', () => {
    const result = generateGsdDebuggingTeam();
    const investigations = result.sampleTasks.slice(1, 4);
    for (const task of investigations) {
      expect(task.blockedBy).toEqual(['hypothesize']);
    }
  });

  it('should have synthesize task blockedBy all 3 investigation tasks', () => {
    const result = generateGsdDebuggingTeam();
    const synthesize = result.sampleTasks[4];
    expect(synthesize.id).toBe('synthesize');
    expect(synthesize.blockedBy).toEqual([
      'investigate-alpha',
      'investigate-beta',
      'investigate-gamma',
    ]);
  });

  it('should set patternInfo with correct topology, description, and memberSummary', () => {
    const result = generateGsdDebuggingTeam();
    expect(result.patternInfo.topology).toBe('leader-worker');
    expect(result.patternInfo.description).toContain('debugging');
    expect(result.patternInfo.memberSummary).toBe('1 coordinator + 3 debuggers');
  });

  it('should assign LEADER_TOOLS to lead and WORKER_TOOLS to debuggers', () => {
    const result = generateGsdDebuggingTeam();
    const lead = result.config.members[0] as Record<string, unknown>;
    expect(lead.tools).toEqual(LEADER_TOOLS);
    const debuggers = result.config.members.slice(1);
    for (const d of debuggers) {
      expect((d as Record<string, unknown>).tools).toEqual(WORKER_TOOLS);
    }
  });

  it('should produce config that passes validateTeamConfig with zero errors', () => {
    const result = generateGsdDebuggingTeam();
    const validation = validateTeamConfig(result.config);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should have all unique agentIds', () => {
    const result = generateGsdDebuggingTeam();
    const ids = result.config.members.map((m) => m.agentId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================================================
// Cross-template Tests
// ============================================================================

describe('GSD cross-template properties', () => {
  const templates = [
    { name: 'research', fn: generateGsdResearchTeam },
    { name: 'debugging', fn: generateGsdDebuggingTeam },
  ];

  for (const { name, fn } of templates) {
    it(`${name}: should have createdAt as valid ISO string`, () => {
      const result = fn();
      const createdAt = result.config.createdAt;
      expect(createdAt).toBeDefined();
      const parsed = new Date(createdAt);
      expect(parsed.toISOString()).toBe(createdAt);
    });

    it(`${name}: should have leadAgentId matching a member agentId`, () => {
      const result = fn();
      const memberIds = result.config.members.map((m) => m.agentId);
      expect(memberIds).toContain(result.config.leadAgentId);
    });

    it(`${name}: config passes validateTeamConfig`, () => {
      const result = fn();
      const validation = validateTeamConfig(result.config);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it(`${name}: all member agentIds are unique`, () => {
      const result = fn();
      const ids = result.config.members.map((m) => m.agentId);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});

// ============================================================================
// Exported Constants Tests
// ============================================================================

describe('GSD template constants', () => {
  it('RESEARCH_DIMENSIONS should have 4 dimensions', () => {
    expect(RESEARCH_DIMENSIONS).toHaveLength(4);
    expect(RESEARCH_DIMENSIONS).toEqual([
      'stack',
      'features',
      'architecture',
      'pitfalls',
    ]);
  });

  it('GSD_RESEARCH_AGENT_IDS should have 5 IDs (1 lead + 4 researchers)', () => {
    expect(GSD_RESEARCH_AGENT_IDS).toHaveLength(5);
    expect(GSD_RESEARCH_AGENT_IDS[0]).toBe('gsd-research-synthesizer');
  });

  it('GSD_DEBUG_AGENT_IDS should have 4 IDs (1 lead + 3 debuggers)', () => {
    expect(GSD_DEBUG_AGENT_IDS).toHaveLength(4);
    expect(GSD_DEBUG_AGENT_IDS[0]).toBe('gsd-debug-lead');
  });
});
