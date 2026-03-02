/**
 * Security Dashboard Panel Integration Tests.
 *
 * Verifies the security panel works correctly at all magic levels with
 * complete coverage of shield, blocked request log, proxy health, agent
 * isolation status, IPC constants, and edge cases.
 *
 * Phase 517-03 — Dashboard integration tests (SSH-05)
 *
 * @module security/__tests__/dashboard-integration.test
 */

import { describe, it, expect } from 'vitest';
import {
  type ShieldState,
  type ShieldStatus,
  type SecurityEvent,
  type SecurityTimeline,
  type BlockedRequest,
  type AgentIsolationStatus,
  type ProxyHealth,
  renderShieldIndicator,
  renderSecurityDetail,
  renderBlockedRequestLog,
  renderAgentIsolationStatus,
  renderProxyHealth,
  shouldBypassMagicFilter,
  getShieldPulseClass,
  SECURITY_IPC_EVENTS,
} from '../../components/SecurityPanel.js';

import {
  SECURITY_IPC_EVENTS as BACKEND_IPC_EVENTS,
  SECURITY_COMMANDS,
  PANEL_IPC_EVENTS,
} from '../index.js';

// ============================================================================
// Mock data helpers
// ============================================================================

function makeState(
  status: ShieldStatus,
  overrides?: Partial<ShieldState>,
): ShieldState {
  return {
    status,
    last_event: null,
    sandbox_active: true,
    proxy_active: true,
    agents_isolated: 0,
    ...overrides,
  };
}

function makeEvent(severity: SecurityEvent['severity']): SecurityEvent {
  return {
    id: `evt-${severity}-int-001`,
    timestamp: '2026-03-01T12:00:00Z',
    severity,
    source: 'sandbox',
    message: `Integration test ${severity} event`,
  };
}

function makeTimeline(events: SecurityEvent[]): SecurityTimeline {
  return {
    events,
    filter: {
      severity: [],
      source: [],
      time_range: {
        start: '2026-03-01T00:00:00Z',
        end: '2026-03-01T23:59:59Z',
      },
    },
  };
}

function makeBlockedRequest(
  severity: BlockedRequest['severity'] = 'blocked',
  domain = 'malicious.example.com',
): BlockedRequest {
  return {
    id: `br-${domain}-int-001`,
    timestamp: '2026-03-01T12:00:00Z',
    domain,
    agentId: 'agent-exec-int',
    reason: `Integration test blocked: ${domain}`,
    severity,
  };
}

function makeAgentStatus(
  agentType: AgentIsolationStatus['agentType'],
  isolated = true,
): AgentIsolationStatus {
  const id = `agent-${agentType.toLowerCase()}-int`;
  return {
    agentId: id,
    agentType,
    isolated,
    worktreePath: `/tmp/worktrees/${id}`,
    sandboxProfile: `${agentType.toLowerCase()}-profile`,
  };
}

function makeProxyHealth(
  status: ProxyHealth['status'],
  overrides?: Partial<ProxyHealth>,
): ProxyHealth {
  return {
    status,
    uptime: 7200,
    requestCount: 100,
    blockedCount: 5,
    activeDomains: ['api.anthropic.com', 'github.com'],
    avgLatencyMs: 8.3,
    ...overrides,
  };
}

// ============================================================================
// Test Group 1: SSH-05 — Shield indicator at all magic levels
// ============================================================================

describe('SSH-05: Shield indicator at all magic levels', () => {
  const statuses: ShieldStatus[] = ['secure', 'attention', 'breach-blocked', 'inactive'];

  for (let level = 1; level <= 5; level++) {
    it(`renders non-empty HTML at magic level ${level}`, () => {
      const result = renderShieldIndicator(makeState('secure'), level);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('shield-indicator');
    });
  }

  it('renders at magic level 1 (verifies always-visible requirement)', () => {
    const result = renderShieldIndicator(makeState('secure'), 1);
    expect(result).toContain('shield-indicator');
    expect(result).toContain('shield-icon');
  });

  for (const status of statuses) {
    it(`renders distinct output for ShieldStatus "${status}"`, () => {
      const result = renderShieldIndicator(makeState(status), 3);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      // Each status maps to a specific CSS class
      expect(result).toContain(`shield-${status}`);
    });
  }

  it('getShieldPulseClass returns non-empty for changed states', () => {
    const prev = makeState('secure');
    const next = makeState('breach-blocked');
    const cls = getShieldPulseClass(prev, next);
    expect(cls).toBe('shield-pulse');
  });

  it('getShieldPulseClass returns empty for unchanged states', () => {
    const prev = makeState('secure');
    const same = makeState('secure');
    expect(getShieldPulseClass(prev, same)).toBe('');
  });
});

// ============================================================================
// Test Group 2: SSH-05 — Magic bypass filter
// ============================================================================

describe('SSH-05: Magic bypass filter', () => {
  it('shouldBypassMagicFilter returns true for blocked severity', () => {
    expect(shouldBypassMagicFilter(makeEvent('blocked'))).toBe(true);
  });

  it('shouldBypassMagicFilter returns true for critical severity', () => {
    expect(shouldBypassMagicFilter(makeEvent('critical'))).toBe(true);
  });

  it('shouldBypassMagicFilter returns false for warning severity', () => {
    expect(shouldBypassMagicFilter(makeEvent('warning'))).toBe(false);
  });

  it('shouldBypassMagicFilter returns false for info severity', () => {
    expect(shouldBypassMagicFilter(makeEvent('info'))).toBe(false);
  });

  it('shouldBypassMagicFilter returns false for audit severity', () => {
    expect(shouldBypassMagicFilter(makeEvent('audit'))).toBe(false);
  });
});

// ============================================================================
// Test Group 3: SSH-05 — Blocked request log
// ============================================================================

describe('SSH-05: Blocked request log', () => {
  it('renders entries with severity-colored CSS classes', () => {
    const requests = [
      makeBlockedRequest('blocked', 'evil.com'),
      makeBlockedRequest('warning', 'suspect.org'),
    ];
    const result = renderBlockedRequestLog(requests);
    expect(result).toContain('severity-blocked');
    expect(result).toContain('severity-warning');
    expect(result).toContain('evil.com');
    expect(result).toContain('suspect.org');
  });

  it('blocked severity entry has severity-blocked CSS class', () => {
    const result = renderBlockedRequestLog([makeBlockedRequest('blocked')]);
    expect(result).toContain('severity-blocked');
  });

  it('warning severity entry has severity-warning CSS class', () => {
    const result = renderBlockedRequestLog([makeBlockedRequest('warning')]);
    expect(result).toContain('severity-warning');
  });

  it('handles empty list gracefully without crash', () => {
    const result = renderBlockedRequestLog([]);
    expect(typeof result).toBe('string');
    expect(result).toContain('blocked-request-log');
  });
});

// ============================================================================
// Test Group 4: SSH-05 — Proxy health display
// ============================================================================

describe('SSH-05: Proxy health display', () => {
  it('renders running state with proxy-running class and uptime', () => {
    const result = renderProxyHealth(makeProxyHealth('running'));
    expect(result).toContain('proxy-running');
    expect(result).toContain('7200');
    expect(result).toContain('100');
  });

  it('renders down state with proxy-down class', () => {
    const result = renderProxyHealth(makeProxyHealth('down', { requestCount: 0 }));
    expect(result).toContain('proxy-down');
  });

  it('renders degraded state with proxy-degraded class', () => {
    const result = renderProxyHealth(makeProxyHealth('degraded'));
    expect(result).toContain('proxy-degraded');
  });

  it('all proxy health renders return non-empty strings', () => {
    for (const status of ['running', 'down', 'degraded'] as const) {
      const result = renderProxyHealth(makeProxyHealth(status));
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Test Group 5: SSH-05 — Agent isolation status
// ============================================================================

describe('SSH-05: Agent isolation status', () => {
  it('renders per-agent entries with all 3 agent types', () => {
    const agents = [
      makeAgentStatus('EXEC'),
      makeAgentStatus('VERIFY'),
      makeAgentStatus('SCOUT'),
    ];
    const result = renderAgentIsolationStatus(agents);
    expect(result).toContain('EXEC');
    expect(result).toContain('VERIFY');
    expect(result).toContain('SCOUT');
  });

  it('each entry contains the agent role type', () => {
    const agent = makeAgentStatus('EXEC');
    const result = renderAgentIsolationStatus([agent]);
    expect(result).toContain('EXEC');
    expect(result).toContain('agent-type');
  });

  it('handles empty agents list gracefully', () => {
    const result = renderAgentIsolationStatus([]);
    expect(typeof result).toBe('string');
    expect(result).toContain('agent-isolation-status');
  });
});

// ============================================================================
// Test Group 6: SSH-05 — IPC and command constant integrity
// ============================================================================

describe('SSH-05: IPC and command constant integrity', () => {
  it('SECURITY_IPC_EVENTS (backend) has exactly 4 entries', () => {
    expect(Object.keys(BACKEND_IPC_EVENTS).length).toBe(4);
  });

  it('SECURITY_IPC_EVENTS contains SHIELD_UPDATE, BREACH_BLOCKED, AGENT_CREATED, AGENT_DESTROYED', () => {
    expect(BACKEND_IPC_EVENTS.SHIELD_UPDATE).toBeDefined();
    expect(BACKEND_IPC_EVENTS.BREACH_BLOCKED).toBeDefined();
    expect(BACKEND_IPC_EVENTS.AGENT_CREATED).toBeDefined();
    expect(BACKEND_IPC_EVENTS.AGENT_DESTROYED).toBeDefined();
  });

  it('SECURITY_COMMANDS has exactly 7 entries', () => {
    expect(Object.keys(SECURITY_COMMANDS).length).toBe(7);
  });

  it('PANEL_IPC_EVENTS is defined and re-exported correctly from barrel', () => {
    expect(PANEL_IPC_EVENTS).toBeDefined();
    expect(typeof PANEL_IPC_EVENTS).toBe('object');
  });

  it('all backend IPC event values are non-empty strings starting with security:', () => {
    for (const [key, value] of Object.entries(BACKEND_IPC_EVENTS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
      expect(value).toMatch(/^security:/);
    }
  });

  it('all SECURITY_COMMANDS values are non-empty strings', () => {
    for (const [key, value] of Object.entries(SECURITY_COMMANDS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('PANEL_IPC_EVENTS has expected panel event names', () => {
    const panelEvents = Object.values(PANEL_IPC_EVENTS);
    expect(panelEvents.length).toBeGreaterThan(0);
    // Panel events should follow security: prefix convention
    for (const val of panelEvents) {
      expect(typeof val).toBe('string');
      expect(val).toMatch(/^security:/);
    }
  });
});

// ============================================================================
// Test Group 7: SSH-05 — Edge cases
// ============================================================================

describe('SSH-05: Edge cases', () => {
  it('renderShieldIndicator with null last_event returns valid HTML', () => {
    const state = makeState('secure', { last_event: null });
    const result = renderShieldIndicator(state, 3);
    expect(result).toBeTruthy();
    expect(result).toContain('shield-indicator');
  });

  it('renderShieldIndicator with 0 agents_isolated returns valid HTML', () => {
    const state = makeState('secure', { agents_isolated: 0 });
    const result = renderShieldIndicator(state, 3);
    expect(result).toBeTruthy();
    expect(result).toContain('shield-indicator');
  });

  it('renderSecurityDetail with all subsystems inactive renders correctly', () => {
    const state = makeState('inactive', {
      sandbox_active: false,
      proxy_active: false,
      agents_isolated: 0,
      last_event: null,
    });
    const timeline = makeTimeline([]);
    const result = renderSecurityDetail(state, timeline, 3);
    expect(result).toBeTruthy();
    expect(result).toContain('security-detail');
  });

  it('renderBlockedRequestLog with 100 entries returns valid HTML (no crash on large list)', () => {
    const requests: BlockedRequest[] = [];
    for (let i = 0; i < 100; i++) {
      requests.push(makeBlockedRequest(i % 2 === 0 ? 'blocked' : 'warning', `domain-${i}.com`));
    }
    const result = renderBlockedRequestLog(requests);
    expect(result).toBeTruthy();
    expect(result).toContain('blocked-request-log');
    expect(result).toContain('domain-0.com');
    expect(result).toContain('domain-99.com');
  });
});
