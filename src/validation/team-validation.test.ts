import { describe, it, expect } from 'vitest';
import {
  TeamMemberSchema,
  TeamConfigSchema,
  TeamTaskSchema,
  InboxMessageSchema,
  validateTeamConfig,
} from './team-validation.js';

// ============================================================================
// TeamMemberSchema Tests
// ============================================================================

describe('TeamMemberSchema', () => {
  it('should accept minimal valid member (agentId + name only)', () => {
    const result = TeamMemberSchema.safeParse({
      agentId: 'agent-1',
      name: 'Alice',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.agentId).toBe('agent-1');
      expect(result.data.name).toBe('Alice');
    }
  });

  it('should accept full member with all optional fields', () => {
    const result = TeamMemberSchema.safeParse({
      agentId: 'agent-2',
      name: 'Bob',
      agentType: 'coder',
      color: '#FF5733',
      joinedAt: '2026-01-15T10:00:00Z',
      backendType: 'tmux',
      model: 'sonnet',
      cwd: '/home/bob/project',
      prompt: 'You are a coding assistant',
      planModeRequired: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.agentId).toBe('agent-2');
      expect(result.data.name).toBe('Bob');
      expect(result.data.agentType).toBe('coder');
      expect(result.data.color).toBe('#FF5733');
      expect(result.data.backendType).toBe('tmux');
      expect(result.data.model).toBe('sonnet');
      expect(result.data.cwd).toBe('/home/bob/project');
      expect(result.data.prompt).toBe('You are a coding assistant');
      expect(result.data.planModeRequired).toBe(true);
    }
  });

  it('should reject missing agentId', () => {
    const result = TeamMemberSchema.safeParse({
      name: 'Alice',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('agentId'))).toBe(true);
    }
  });

  it('should reject missing name', () => {
    const result = TeamMemberSchema.safeParse({
      agentId: 'agent-1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
    }
  });

  it('should reject invalid backendType', () => {
    const result = TeamMemberSchema.safeParse({
      agentId: 'agent-1',
      name: 'Alice',
      backendType: 'docker',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid model value', () => {
    const result = TeamMemberSchema.safeParse({
      agentId: 'agent-1',
      name: 'Alice',
      model: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('should preserve unknown fields via passthrough', () => {
    const result = TeamMemberSchema.safeParse({
      agentId: 'agent-1',
      name: 'Alice',
      futureField: 'test',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).futureField).toBe('test');
    }
  });
});

// ============================================================================
// TeamConfigSchema Tests
// ============================================================================

describe('TeamConfigSchema', () => {
  const validMember = {
    agentId: 'agent-1',
    name: 'Alice',
  };

  it('should accept minimal valid config', () => {
    const result = TeamConfigSchema.safeParse({
      name: 'my-team',
      leadAgentId: 'agent-1',
      createdAt: '2026-01-15T10:00:00Z',
      members: [validMember],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('my-team');
      expect(result.data.leadAgentId).toBe('agent-1');
      expect(result.data.members).toHaveLength(1);
    }
  });

  it('should accept full config with description and multiple members', () => {
    const result = TeamConfigSchema.safeParse({
      name: 'dev-team',
      description: 'A development team for feature work',
      leadAgentId: 'agent-1',
      createdAt: '2026-01-15T10:00:00Z',
      members: [
        { agentId: 'agent-1', name: 'Alice' },
        { agentId: 'agent-2', name: 'Bob', model: 'opus' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('A development team for feature work');
      expect(result.data.members).toHaveLength(2);
    }
  });

  it('should reject missing name', () => {
    const result = TeamConfigSchema.safeParse({
      leadAgentId: 'agent-1',
      createdAt: '2026-01-15T10:00:00Z',
      members: [validMember],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
    }
  });

  it('should reject missing leadAgentId', () => {
    const result = TeamConfigSchema.safeParse({
      name: 'my-team',
      createdAt: '2026-01-15T10:00:00Z',
      members: [validMember],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('leadAgentId'))).toBe(true);
    }
  });

  it('should reject missing createdAt', () => {
    const result = TeamConfigSchema.safeParse({
      name: 'my-team',
      leadAgentId: 'agent-1',
      members: [validMember],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('createdAt'))).toBe(true);
    }
  });

  it('should reject missing members', () => {
    const result = TeamConfigSchema.safeParse({
      name: 'my-team',
      leadAgentId: 'agent-1',
      createdAt: '2026-01-15T10:00:00Z',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('members'))).toBe(true);
    }
  });

  it('should reject empty members array', () => {
    const result = TeamConfigSchema.safeParse({
      name: 'my-team',
      leadAgentId: 'agent-1',
      createdAt: '2026-01-15T10:00:00Z',
      members: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const memberIssue = result.error.issues.find((i) =>
        i.path.includes('members') || i.message.includes('member')
      );
      expect(memberIssue).toBeDefined();
    }
  });

  it('should preserve unknown fields via passthrough', () => {
    const result = TeamConfigSchema.safeParse({
      name: 'my-team',
      leadAgentId: 'agent-1',
      createdAt: '2026-01-15T10:00:00Z',
      members: [validMember],
      topology: 'leader-worker',
      customSetting: 42,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).topology).toBe('leader-worker');
      expect((result.data as Record<string, unknown>).customSetting).toBe(42);
    }
  });
});

// ============================================================================
// TeamTaskSchema Tests
// ============================================================================

describe('TeamTaskSchema', () => {
  it('should accept minimal valid task', () => {
    const result = TeamTaskSchema.safeParse({
      id: 'task-1',
      subject: 'Implement auth',
      status: 'pending',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('task-1');
      expect(result.data.subject).toBe('Implement auth');
      expect(result.data.status).toBe('pending');
    }
  });

  it('should accept full task with all optional fields', () => {
    const result = TeamTaskSchema.safeParse({
      id: 'task-2',
      subject: 'Build API',
      description: 'Create REST API for user management',
      status: 'in_progress',
      owner: 'agent-1',
      activeForm: 'Building API endpoints',
      blockedBy: ['task-1'],
      blocks: ['task-3'],
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T12:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Create REST API for user management');
      expect(result.data.owner).toBe('agent-1');
      expect(result.data.blockedBy).toEqual(['task-1']);
      expect(result.data.blocks).toEqual(['task-3']);
    }
  });

  it('should reject missing id', () => {
    const result = TeamTaskSchema.safeParse({
      subject: 'Implement auth',
      status: 'pending',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('id'))).toBe(true);
    }
  });

  it('should reject missing subject', () => {
    const result = TeamTaskSchema.safeParse({
      id: 'task-1',
      status: 'pending',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('subject'))).toBe(true);
    }
  });

  it('should reject missing status', () => {
    const result = TeamTaskSchema.safeParse({
      id: 'task-1',
      subject: 'Implement auth',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('status'))).toBe(true);
    }
  });

  it('should reject invalid status value', () => {
    const result = TeamTaskSchema.safeParse({
      id: 'task-1',
      subject: 'Implement auth',
      status: 'done',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid status values', () => {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    for (const status of validStatuses) {
      const result = TeamTaskSchema.safeParse({
        id: 'task-1',
        subject: 'Test task',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should preserve unknown fields via passthrough', () => {
    const result = TeamTaskSchema.safeParse({
      id: 'task-1',
      subject: 'Implement auth',
      status: 'pending',
      priority: 'high',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).priority).toBe('high');
    }
  });
});

// ============================================================================
// InboxMessageSchema Tests
// ============================================================================

describe('InboxMessageSchema', () => {
  it('should accept valid message', () => {
    const result = InboxMessageSchema.safeParse({
      from: 'agent-1',
      text: 'Task completed successfully',
      timestamp: '2026-01-15T10:00:00Z',
      read: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBe('agent-1');
      expect(result.data.text).toBe('Task completed successfully');
      expect(result.data.read).toBe(false);
    }
  });

  it('should reject missing from', () => {
    const result = InboxMessageSchema.safeParse({
      text: 'Hello',
      timestamp: '2026-01-15T10:00:00Z',
      read: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('from'))).toBe(true);
    }
  });

  it('should reject missing text', () => {
    const result = InboxMessageSchema.safeParse({
      from: 'agent-1',
      timestamp: '2026-01-15T10:00:00Z',
      read: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('text'))).toBe(true);
    }
  });

  it('should reject missing timestamp', () => {
    const result = InboxMessageSchema.safeParse({
      from: 'agent-1',
      text: 'Hello',
      read: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('timestamp'))).toBe(true);
    }
  });

  it('should reject missing read', () => {
    const result = InboxMessageSchema.safeParse({
      from: 'agent-1',
      text: 'Hello',
      timestamp: '2026-01-15T10:00:00Z',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('read'))).toBe(true);
    }
  });

  it('should reject non-boolean read value', () => {
    const result = InboxMessageSchema.safeParse({
      from: 'agent-1',
      text: 'Hello',
      timestamp: '2026-01-15T10:00:00Z',
      read: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('should preserve unknown fields via passthrough', () => {
    const result = InboxMessageSchema.safeParse({
      from: 'agent-1',
      text: 'Hello',
      timestamp: '2026-01-15T10:00:00Z',
      read: true,
      structuredType: 'task_completed',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).structuredType).toBe('task_completed');
    }
  });
});

// ============================================================================
// validateTeamConfig Tests
// ============================================================================

describe('validateTeamConfig', () => {
  const validConfig = {
    name: 'my-team',
    leadAgentId: 'agent-1',
    createdAt: '2026-01-15T10:00:00Z',
    members: [{ agentId: 'agent-1', name: 'Alice' }],
  };

  it('should return success for valid config with data populated', () => {
    const result = validateTeamConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('my-team');
    expect(result.data?.members).toHaveLength(1);
  });

  it('should return failure for invalid config with descriptive error messages', () => {
    const result = validateTeamConfig({
      leadAgentId: '',
      members: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return errors as array of "path: message" strings', () => {
    const result = validateTeamConfig({
      name: '',
      leadAgentId: '',
      createdAt: '',
      members: [],
    });
    expect(result.valid).toBe(false);
    // Errors should include field paths
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    expect(result.errors.some((e) => e.includes('members'))).toBe(true);
  });

  it('should populate data on success', () => {
    const result = validateTeamConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('my-team');
  });

  it('should have undefined data on failure', () => {
    const result = validateTeamConfig({});
    expect(result.valid).toBe(false);
    expect(result.data).toBeUndefined();
  });

  it('should accept config with unknown fields (forward compatibility)', () => {
    const result = validateTeamConfig({
      ...validConfig,
      topology: 'leader-worker',
      version: 2,
    });
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect((result.data as Record<string, unknown>).topology).toBe('leader-worker');
  });
});
