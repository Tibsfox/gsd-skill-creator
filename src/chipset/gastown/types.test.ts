/**
 * Tests for Gastown orchestration chipset type system.
 *
 * Validates type correctness for all shared interfaces and type aliases:
 * - AgentRole, AgentStatus, WorkStatus, HookStatus, MessageChannel
 * - AgentIdentity, WorkItem, AgentMessage
 * - ChipsetConfig and sub-interfaces (SkillManifest, AgentTopology, etc.)
 * - HookState, Convoy, MergeRequest
 *
 * These are compile-time type tests — they verify that valid objects
 * satisfy the interfaces and that the type unions contain expected values.
 */

import { describe, it, expect } from 'vitest';
import type {
  AgentRole,
  AgentStatus,
  WorkStatus,
  HookStatus,
  MessageChannel,
  AgentIdentity,
  WorkItem,
  AgentMessage,
  SkillEntry,
  SkillManifest,
  AgentEntry,
  AgentTopology,
  ChannelEntry,
  CommunicationConfig,
  DispatchConfig,
  GateCheck,
  EvaluationGates,
  ChipsetConfig,
  HookState,
  Convoy,
  MergeRequest,
} from './types.js';

// ============================================================================
// AgentRole
// ============================================================================

describe('AgentRole', () => {
  it('accepts all valid role values', () => {
    const roles: AgentRole[] = ['mayor', 'witness', 'refinery', 'polecat', 'crew'];
    expect(roles).toHaveLength(5);
    expect(roles).toContain('mayor');
    expect(roles).toContain('witness');
    expect(roles).toContain('refinery');
    expect(roles).toContain('polecat');
    expect(roles).toContain('crew');
  });
});

// ============================================================================
// AgentStatus
// ============================================================================

describe('AgentStatus', () => {
  it('accepts all valid status values', () => {
    const statuses: AgentStatus[] = ['idle', 'active', 'stalled', 'terminated'];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain('idle');
    expect(statuses).toContain('active');
    expect(statuses).toContain('stalled');
    expect(statuses).toContain('terminated');
  });
});

// ============================================================================
// WorkStatus
// ============================================================================

describe('WorkStatus', () => {
  it('accepts all valid work status values', () => {
    const statuses: WorkStatus[] = ['open', 'hooked', 'in_progress', 'done', 'merged'];
    expect(statuses).toHaveLength(5);
    expect(statuses).toContain('open');
    expect(statuses).toContain('hooked');
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('done');
    expect(statuses).toContain('merged');
  });
});

// ============================================================================
// HookStatus
// ============================================================================

describe('HookStatus', () => {
  it('accepts all valid hook status values', () => {
    const statuses: HookStatus[] = ['empty', 'pending', 'active', 'completed'];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain('empty');
    expect(statuses).toContain('pending');
    expect(statuses).toContain('active');
    expect(statuses).toContain('completed');
  });
});

// ============================================================================
// MessageChannel
// ============================================================================

describe('MessageChannel', () => {
  it('accepts all valid channel types', () => {
    const channels: MessageChannel[] = ['mail', 'nudge', 'hook', 'handoff'];
    expect(channels).toHaveLength(4);
    expect(channels).toContain('mail');
    expect(channels).toContain('nudge');
    expect(channels).toContain('hook');
    expect(channels).toContain('handoff');
  });
});

// ============================================================================
// AgentIdentity
// ============================================================================

describe('AgentIdentity', () => {
  it('accepts a valid agent identity with all fields', () => {
    const agent: AgentIdentity = {
      id: 'polecat-alpha',
      role: 'polecat',
      rig: 'gastown-main',
      hookId: 'hook-polecat-alpha',
      status: 'active',
      sessionId: 'session-abc123',
    };
    expect(agent.id).toBe('polecat-alpha');
    expect(agent.role).toBe('polecat');
    expect(agent.rig).toBe('gastown-main');
    expect(agent.hookId).toBe('hook-polecat-alpha');
    expect(agent.status).toBe('active');
    expect(agent.sessionId).toBe('session-abc123');
  });

  it('accepts agent identity without optional sessionId', () => {
    const agent: AgentIdentity = {
      id: 'mayor-prime',
      role: 'mayor',
      rig: 'gastown-main',
      hookId: 'hook-mayor-prime',
      status: 'idle',
    };
    expect(agent.sessionId).toBeUndefined();
  });

  it('accepts each agent role', () => {
    const roles: AgentRole[] = ['mayor', 'witness', 'refinery', 'polecat', 'crew'];
    for (const role of roles) {
      const agent: AgentIdentity = {
        id: `${role}-1`,
        role,
        rig: 'test-rig',
        hookId: `hook-${role}-1`,
        status: 'idle',
      };
      expect(agent.role).toBe(role);
    }
  });
});

// ============================================================================
// WorkItem
// ============================================================================

describe('WorkItem', () => {
  it('accepts a valid work item with all fields', () => {
    const item: WorkItem = {
      beadId: 'bead-a1b2c',
      title: 'Implement auth middleware',
      description: 'Add JWT verification to all protected routes',
      status: 'in_progress',
      assignee: 'polecat-alpha',
      hookStatus: 'active',
      priority: 'P1',
    };
    expect(item.beadId).toBe('bead-a1b2c');
    expect(item.title).toBe('Implement auth middleware');
    expect(item.status).toBe('in_progress');
    expect(item.assignee).toBe('polecat-alpha');
    expect(item.hookStatus).toBe('active');
    expect(item.priority).toBe('P1');
  });

  it('accepts work item without optional assignee', () => {
    const item: WorkItem = {
      beadId: 'bead-x9y8z',
      title: 'Unassigned task',
      description: 'Waiting for dispatch',
      status: 'open',
      hookStatus: 'empty',
      priority: 'P3',
    };
    expect(item.assignee).toBeUndefined();
  });

  it('accepts all priority levels', () => {
    const priorities: WorkItem['priority'][] = ['P1', 'P2', 'P3'];
    expect(priorities).toHaveLength(3);
  });
});

// ============================================================================
// AgentMessage
// ============================================================================

describe('AgentMessage', () => {
  it('accepts a valid durable mail message', () => {
    const msg: AgentMessage = {
      from: 'mayor-prime',
      to: 'polecat-alpha',
      channel: 'mail',
      payload: 'Work item bead-a1b2c assigned to you',
      timestamp: '2026-03-06T09:00:00Z',
      durable: true,
    };
    expect(msg.from).toBe('mayor-prime');
    expect(msg.to).toBe('polecat-alpha');
    expect(msg.channel).toBe('mail');
    expect(msg.durable).toBe(true);
  });

  it('accepts a non-durable nudge message', () => {
    const msg: AgentMessage = {
      from: 'witness-1',
      to: 'polecat-alpha',
      channel: 'nudge',
      payload: 'ping',
      timestamp: '2026-03-06T09:01:00Z',
      durable: false,
    };
    expect(msg.channel).toBe('nudge');
    expect(msg.durable).toBe(false);
  });
});

// ============================================================================
// SkillManifest & SkillEntry
// ============================================================================

describe('SkillManifest', () => {
  it('accepts a valid skill manifest with required and recommended', () => {
    const entry: SkillEntry = {
      name: 'agent-topology',
      domain: 'orchestration',
      description: 'Mayor/witness/polecat supervision hierarchy',
      token_budget_weight: 0.15,
    };
    const manifest: SkillManifest = {
      required: [entry],
      recommended: [],
    };
    expect(manifest.required).toHaveLength(1);
    expect(manifest.required[0].name).toBe('agent-topology');
    expect(manifest.recommended).toHaveLength(0);
  });
});

// ============================================================================
// AgentTopology & AgentEntry
// ============================================================================

describe('AgentTopology', () => {
  it('accepts a valid agent topology', () => {
    const entry: AgentEntry = {
      name: 'polecat',
      role: 'polecat',
      skills: ['sling-dispatch', 'hook-persistence'],
      count: 5,
    };
    const topology: AgentTopology = {
      topology: 'mayor-witness-polecat',
      agents: [entry],
    };
    expect(topology.topology).toBe('mayor-witness-polecat');
    expect(topology.agents).toHaveLength(1);
    expect(topology.agents[0].count).toBe(5);
  });

  it('accepts agent entry without optional count', () => {
    const entry: AgentEntry = {
      name: 'mayor',
      role: 'mayor',
      skills: ['agent-topology', 'sling-dispatch'],
    };
    expect(entry.count).toBeUndefined();
  });
});

// ============================================================================
// CommunicationConfig & ChannelEntry
// ============================================================================

describe('CommunicationConfig', () => {
  it('accepts a valid communication config', () => {
    const channel: ChannelEntry = {
      name: 'mail',
      type: 'mail',
      filesystem_path: 'state/mail/',
      behavior: 'Durable async messages persisted to filesystem',
    };
    const config: CommunicationConfig = {
      channels: [channel],
    };
    expect(config.channels).toHaveLength(1);
    expect(config.channels[0].type).toBe('mail');
  });
});

// ============================================================================
// DispatchConfig
// ============================================================================

describe('DispatchConfig', () => {
  it('accepts a valid dispatch config', () => {
    const config: DispatchConfig = {
      strategy: 'sling',
      max_parallel: 10,
      batch_threshold: 3,
      formula_support: true,
    };
    expect(config.strategy).toBe('sling');
    expect(config.max_parallel).toBe(10);
    expect(config.batch_threshold).toBe(3);
    expect(config.formula_support).toBe(true);
  });
});

// ============================================================================
// EvaluationGates & GateCheck
// ============================================================================

describe('EvaluationGates', () => {
  it('accepts valid evaluation gates with pre-deploy checks', () => {
    const check: GateCheck = {
      check: 'test-coverage',
      threshold: 80,
      action: 'block',
    };
    const gates: EvaluationGates = {
      pre_deploy: [check],
    };
    expect(gates.pre_deploy).toHaveLength(1);
    expect(gates.pre_deploy[0].action).toBe('block');
  });

  it('accepts all gate check actions', () => {
    const actions: GateCheck['action'][] = ['block', 'warn', 'log'];
    expect(actions).toHaveLength(3);
  });
});

// ============================================================================
// ChipsetConfig
// ============================================================================

describe('ChipsetConfig', () => {
  it('accepts a valid chipset config with all sections', () => {
    const config: ChipsetConfig = {
      name: 'gastown-orchestration',
      version: '0.1.0',
      archetype: 'multi-agent-orchestration',
      skills: {
        required: [{
          name: 'agent-topology',
          domain: 'orchestration',
          description: 'Agent supervision hierarchy',
          token_budget_weight: 0.15,
        }],
        recommended: [],
      },
      agents: {
        topology: 'mayor-witness-polecat',
        agents: [{
          name: 'mayor',
          role: 'mayor',
          skills: ['agent-topology'],
        }],
      },
      communication: {
        channels: [{
          name: 'mail',
          type: 'mail',
          filesystem_path: 'state/mail/',
          behavior: 'Durable async',
        }],
      },
      dispatch: {
        strategy: 'sling',
        max_parallel: 10,
        batch_threshold: 3,
        formula_support: true,
      },
      evaluation: {
        pre_deploy: [{
          check: 'tests-pass',
          threshold: 100,
          action: 'block',
        }],
      },
    };
    expect(config.name).toBe('gastown-orchestration');
    expect(config.version).toBe('0.1.0');
    expect(config.archetype).toBe('multi-agent-orchestration');
    expect(config.skills.required).toHaveLength(1);
    expect(config.agents.agents).toHaveLength(1);
    expect(config.communication.channels).toHaveLength(1);
    expect(config.dispatch.strategy).toBe('sling');
    expect(config.evaluation.pre_deploy).toHaveLength(1);
  });
});

// ============================================================================
// HookState
// ============================================================================

describe('HookState', () => {
  it('accepts a valid hook state with work item', () => {
    const state: HookState = {
      agentId: 'polecat-alpha',
      status: 'active',
      workItem: {
        beadId: 'bead-a1b2c',
        title: 'Task',
        description: 'Do the thing',
        status: 'in_progress',
        assignee: 'polecat-alpha',
        hookStatus: 'active',
        priority: 'P1',
      },
      lastActivity: '2026-03-06T09:00:00Z',
    };
    expect(state.agentId).toBe('polecat-alpha');
    expect(state.status).toBe('active');
    expect(state.workItem?.beadId).toBe('bead-a1b2c');
  });

  it('accepts hook state without optional workItem', () => {
    const state: HookState = {
      agentId: 'polecat-beta',
      status: 'empty',
      lastActivity: '2026-03-06T08:00:00Z',
    };
    expect(state.workItem).toBeUndefined();
  });
});

// ============================================================================
// Convoy
// ============================================================================

describe('Convoy', () => {
  it('accepts a valid convoy', () => {
    const convoy: Convoy = {
      id: 'convoy-001',
      name: 'Auth Implementation',
      beadIds: ['bead-a1b2c', 'bead-d4e5f', 'bead-g7h8i'],
      progress: 0.33,
      createdAt: '2026-03-06T08:00:00Z',
    };
    expect(convoy.id).toBe('convoy-001');
    expect(convoy.beadIds).toHaveLength(3);
    expect(convoy.progress).toBeCloseTo(0.33);
  });

  it('accepts convoy with empty beadIds', () => {
    const convoy: Convoy = {
      id: 'convoy-empty',
      name: 'Empty convoy',
      beadIds: [],
      progress: 0,
      createdAt: '2026-03-06T08:00:00Z',
    };
    expect(convoy.beadIds).toHaveLength(0);
    expect(convoy.progress).toBe(0);
  });
});

// ============================================================================
// MergeRequest
// ============================================================================

describe('MergeRequest', () => {
  it('accepts a valid merge request', () => {
    const mr: MergeRequest = {
      id: 'mr-001',
      sourceBranch: 'feature/auth',
      targetBranch: 'main',
      status: 'pending',
      beadId: 'bead-a1b2c',
    };
    expect(mr.id).toBe('mr-001');
    expect(mr.sourceBranch).toBe('feature/auth');
    expect(mr.targetBranch).toBe('main');
    expect(mr.status).toBe('pending');
    expect(mr.beadId).toBe('bead-a1b2c');
  });

  it('accepts all merge request status values', () => {
    const statuses: MergeRequest['status'][] = ['pending', 'merging', 'merged', 'conflicted'];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('merging');
    expect(statuses).toContain('merged');
    expect(statuses).toContain('conflicted');
  });
});
