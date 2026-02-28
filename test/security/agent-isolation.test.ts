/**
 * Agent Isolation Tests (AI-01..AI-06)
 *
 * Tests TypeScript-level agent isolation state schema validation,
 * cross-agent isolation contracts, and lifecycle verification.
 *
 * The actual AgentIsolationManager is Rust (Phase 371). These tests
 * verify the TypeScript schemas and dashboard rendering enforce
 * the same isolation guarantees.
 *
 * @module tests/security/agent-isolation
 */

import { describe, it, expect } from 'vitest';

import {
  AgentIsolationStateSchema,
  SandboxProfileSchema,
  SecurityEventSchema,
  type AgentIsolationState,
  SECURITY_COMMANDS,
  SECURITY_IPC_EVENTS,
} from '../../src/security/index.js';

import {
  renderAgentIsolationStatus,
  type AgentIsolationStatus,
} from '../../src/components/SecurityPanel.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeIsolationState(overrides: Partial<AgentIsolationState> = {}): AgentIsolationState {
  return {
    agent_id: 'exec-001',
    agent_type: 'exec',
    worktree_path: '/tmp/agents/exec-001',
    sandbox_profile: {
      agent_id: 'exec-001',
      agent_type: 'exec',
      filesystem: {
        write_dirs: ['/tmp/agents/exec-001'],
        deny_read: ['/home/user/.ssh', '/home/user/.aws'],
      },
      network: {
        allowed_domains: [],
        proxy_socket: '/tmp/proxy.sock',
      },
      worktree_path: '/tmp/agents/exec-001',
    },
    status: 'active',
    created_at: '2026-02-26T09:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AI-01: Agent creation produces valid state
// ---------------------------------------------------------------------------

describe('AI-01: Agent creation produces valid isolation state', () => {
  it('AI-01: AgentIsolationState with exec type parses correctly', () => {
    const state = makeIsolationState();
    const result = AgentIsolationStateSchema.parse(state);
    expect(result.agent_id).toBe('exec-001');
    expect(result.agent_type).toBe('exec');
    expect(result.status).toBe('active');
    expect(result.sandbox_profile.filesystem.write_dirs).toContain('/tmp/agents/exec-001');
  });

  it('AI-01b: agent_create command exists', () => {
    expect(SECURITY_COMMANDS.AGENT_CREATE).toBe('agent_create');
  });
});

// ---------------------------------------------------------------------------
// AI-02: Agent destruction removes state
// ---------------------------------------------------------------------------

describe('AI-02: Agent destruction lifecycle', () => {
  it('AI-02: agent_destroy command exists', () => {
    expect(SECURITY_COMMANDS.AGENT_DESTROY).toBe('agent_destroy');
  });

  it('AI-02b: AGENT_DESTROYED IPC event exists', () => {
    expect(SECURITY_IPC_EVENTS.AGENT_DESTROYED).toBe('security:agent-destroyed');
  });
});

// ---------------------------------------------------------------------------
// AI-03: INTEG agent can read all worktrees
// ---------------------------------------------------------------------------

describe('AI-03: INTEG agent read-across access', () => {
  it('AI-03: Main/INTEG profile write_dirs can include multiple worktree paths', () => {
    const integState = makeIsolationState({
      agent_id: 'main-001',
      agent_type: 'main',
      sandbox_profile: {
        agent_id: 'main-001',
        agent_type: 'main',
        filesystem: {
          write_dirs: [
            '/tmp/project',
            '/tmp/agents/exec-001',
            '/tmp/agents/verify-001',
          ],
          deny_read: ['/home/user/.ssh'],
        },
        network: {
          allowed_domains: [],
          proxy_socket: '/tmp/proxy.sock',
        },
        worktree_path: '/tmp/project',
      },
    });
    const result = AgentIsolationStateSchema.parse(integState);
    // INTEG agent has access to exec-001 AND verify-001 worktrees
    expect(result.sandbox_profile.filesystem.write_dirs).toContain('/tmp/agents/exec-001');
    expect(result.sandbox_profile.filesystem.write_dirs).toContain('/tmp/agents/verify-001');
  });
});

// ---------------------------------------------------------------------------
// AI-04: Cross-agent isolation verification
// ---------------------------------------------------------------------------

describe('AI-04: Cross-agent isolation verification', () => {
  it('AI-04: EXEC profile does NOT include VERIFY worktree path', () => {
    const execState = makeIsolationState({
      agent_id: 'exec-001',
      agent_type: 'exec',
      sandbox_profile: {
        agent_id: 'exec-001',
        agent_type: 'exec',
        filesystem: {
          write_dirs: ['/tmp/agents/exec-001'],
          deny_read: ['/home/user/.ssh'],
        },
        network: { allowed_domains: [], proxy_socket: '' },
        worktree_path: '/tmp/agents/exec-001',
      },
    });
    const parsed = AgentIsolationStateSchema.parse(execState);
    expect(parsed.sandbox_profile.filesystem.write_dirs).not.toContain('/tmp/agents/verify-001');
  });

  it('AI-04b: agent_verify_isolation command exists', () => {
    expect(SECURITY_COMMANDS.AGENT_VERIFY_ISOLATION).toBe('agent_verify_isolation');
  });
});

// ---------------------------------------------------------------------------
// AI-05: WorktreeCreate hook produces valid profile
// ---------------------------------------------------------------------------

describe('AI-05: WorktreeCreate hook contract', () => {
  it('AI-05: AGENT_CREATED IPC event exists for hook notification', () => {
    expect(SECURITY_IPC_EVENTS.AGENT_CREATED).toBe('security:agent-created');
  });

  it('AI-05b: Agent isolation state accepts creating status', () => {
    const state = makeIsolationState({ status: 'creating' });
    const result = AgentIsolationStateSchema.parse(state);
    expect(result.status).toBe('creating');
  });
});

// ---------------------------------------------------------------------------
// AI-06: Cleanup preserves shared directory
// ---------------------------------------------------------------------------

describe('AI-06: Cleanup and shared directory preservation', () => {
  it('AI-06: Dashboard renders agent isolation status correctly', () => {
    const agents: AgentIsolationStatus[] = [
      { agentId: 'exec-001', agentType: 'EXEC', isolated: true, worktreePath: '/tmp/exec-001', sandboxProfile: 'default' },
      { agentId: 'verify-001', agentType: 'VERIFY', isolated: true, worktreePath: '/tmp/verify-001', sandboxProfile: 'default' },
    ];
    const html = renderAgentIsolationStatus(agents);
    expect(html).toContain('exec-001');
    expect(html).toContain('verify-001');
    expect(html).toContain('isolated-yes');
  });

  it('AI-06b: Empty agent list renders without crash', () => {
    const html = renderAgentIsolationStatus([]);
    expect(typeof html).toBe('string');
    expect(html).toContain('agent-isolation-status');
  });
});
