/**
 * Security Dashboard Panel tests.
 *
 * TDD test suite for ShieldIndicator, magic bypass, event timeline,
 * and shield pulse CSS class logic.
 *
 * @module components/SecurityPanel.test
 */

import { describe, it, expect } from 'vitest';
import {
  type ShieldState,
  type SecurityEvent,
  type SecurityTimeline,
  type BlockedRequest,
  type AgentIsolationStatus,
  type ProxyHealth,
  type SandboxProfile,
  type ProxyLogEntry,
  type QuarantineItem,
  renderShieldIndicator,
  renderSecurityDetail,
  renderBlockedRequestLog,
  renderAgentIsolationStatus,
  renderProxyHealth,
  shouldBypassMagicFilter,
  getShieldPulseClass,
  SECURITY_IPC_EVENTS,
} from './SecurityPanel.js';

// ============================================================================
// Mock data helpers
// ============================================================================

function makeState(
  status: ShieldState['status'],
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
    id: `evt-${severity}-001`,
    timestamp: '2026-02-26T10:00:00Z',
    severity,
    source: 'sandbox',
    message: `Test ${severity} event`,
  };
}

function makeTimeline(events: SecurityEvent[]): SecurityTimeline {
  return {
    events,
    filter: {
      severity: [],
      source: [],
      time_range: {
        start: '2026-02-26T00:00:00Z',
        end: '2026-02-26T23:59:59Z',
      },
    },
  };
}

// ============================================================================
// Test Group 1: Shield renders at all 5 magic levels (DSH-01)
// ============================================================================

describe('Group 1: Shield renders at all 5 magic levels', () => {
  const state = makeState('secure');

  it('renders non-empty output at magic level 1', () => {
    const result = renderShieldIndicator(state, 1);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders non-empty output at magic level 2', () => {
    const result = renderShieldIndicator(state, 2);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders non-empty output at magic level 3', () => {
    const result = renderShieldIndicator(state, 3);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders non-empty output at magic level 4', () => {
    const result = renderShieldIndicator(state, 4);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders non-empty output at magic level 5', () => {
    const result = renderShieldIndicator(state, 5);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Group 2: 4 shield state colors (DSH-02)
// ============================================================================

describe('Group 2: 4 shield state colors', () => {
  it('secure state contains shield-secure class', () => {
    const result = renderShieldIndicator(makeState('secure'), 3);
    expect(result).toContain('shield-secure');
  });

  it('attention state contains shield-attention class', () => {
    const result = renderShieldIndicator(makeState('attention'), 3);
    expect(result).toContain('shield-attention');
  });

  it('breach-blocked state contains shield-breach-blocked class', () => {
    const result = renderShieldIndicator(makeState('breach-blocked'), 3);
    expect(result).toContain('shield-breach-blocked');
  });

  it('inactive state contains shield-inactive class', () => {
    const result = renderShieldIndicator(makeState('inactive'), 3);
    expect(result).toContain('shield-inactive');
  });
});

// ============================================================================
// Test Group 3: Magic bypass for critical events (DSH-03)
// ============================================================================

describe('Group 3: Magic bypass for critical events', () => {
  it('blocked severity bypasses magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('blocked'))).toBe(true);
  });

  it('critical severity bypasses magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('critical'))).toBe(true);
  });

  it('warning severity does NOT bypass magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('warning'))).toBe(false);
  });

  it('info severity does NOT bypass magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('info'))).toBe(false);
  });

  it('audit severity does NOT bypass magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('audit'))).toBe(false);
  });
});

// ============================================================================
// Test Group 4: Event timeline shown at magic level 3+ (DSH-04)
// ============================================================================

describe('Group 4: Event timeline at magic level 3+', () => {
  const state = makeState('secure');
  const timeline = makeTimeline([
    makeEvent('blocked'),
    makeEvent('warning'),
    makeEvent('info'),
  ]);

  it('timeline NOT present at magic level 2', () => {
    const result = renderSecurityDetail(state, timeline, 2);
    expect(result).not.toContain('security-timeline');
  });

  it('timeline present at magic level 3', () => {
    const result = renderSecurityDetail(state, timeline, 3);
    expect(result).toContain('security-timeline');
  });

  it('timeline present at magic level 4', () => {
    const result = renderSecurityDetail(state, timeline, 4);
    expect(result).toContain('security-timeline');
  });

  it('timeline present at magic level 5', () => {
    const result = renderSecurityDetail(state, timeline, 5);
    expect(result).toContain('security-timeline');
  });
});

// ============================================================================
// Test Group 5: Shield pulse on state change
// ============================================================================

describe('Group 5: Shield pulse on state change', () => {
  it('returns shield-pulse when status changes', () => {
    const prev = makeState('secure');
    const next = makeState('breach-blocked');
    expect(getShieldPulseClass(prev, next)).toBe('shield-pulse');
  });

  it('returns empty string when status unchanged', () => {
    const prev = makeState('secure');
    const same = makeState('secure');
    expect(getShieldPulseClass(prev, same)).toBe('');
  });
});

// ============================================================================
// Mock data helpers (Plan 372-02)
// ============================================================================

function makeBlockedRequest(
  severity: BlockedRequest['severity'] = 'blocked',
  domain = 'evil.com',
): BlockedRequest {
  return {
    id: `br-${domain}-001`,
    timestamp: '2026-02-26T10:00:00Z',
    domain,
    agentId: 'agent-exec-1',
    reason: `Blocked request to ${domain}`,
    severity,
  };
}

function makeAgentIsolation(
  agentId: string,
  agentType: AgentIsolationStatus['agentType'],
  isolated: boolean,
): AgentIsolationStatus {
  return {
    agentId,
    agentType,
    isolated,
    worktreePath: `/tmp/worktrees/${agentId}`,
    sandboxProfile: 'default',
  };
}

function makeProxyHealth(
  status: ProxyHealth['status'],
  overrides?: Partial<ProxyHealth>,
): ProxyHealth {
  return {
    status,
    uptime: 3600,
    requestCount: 42,
    blockedCount: 3,
    activeDomains: ['api.anthropic.com', 'github.com'],
    avgLatencyMs: 12.5,
    ...overrides,
  };
}

function makeSandboxProfiles(): SandboxProfile[] {
  return [
    { name: 'exec-profile', active: true, agentType: 'EXEC' },
    { name: 'verify-profile', active: false, agentType: 'VERIFY' },
  ];
}

function makeProxyLogs(): ProxyLogEntry[] {
  return [
    { domain: 'api.anthropic.com', status: 'allowed', latencyMs: 15, timestamp: '2026-02-26T10:00:00Z' },
    { domain: 'evil.com', status: 'blocked', latencyMs: 0, timestamp: '2026-02-26T10:00:01Z' },
  ];
}

function makeQuarantineItems(): QuarantineItem[] {
  return [
    { id: 'q-001', reason: 'Credential exfiltration attempt', timestamp: '2026-02-26T10:00:00Z', severity: 'critical' },
  ];
}

// ============================================================================
// Test Group 6: Full security operations view at magic level 5 (DSH-05)
// ============================================================================

describe('Group 6: Full operations view at magic level 5', () => {
  const state = makeState('secure');
  const timeline = makeTimeline([makeEvent('blocked'), makeEvent('info')]);
  const opts = {
    sandboxProfiles: makeSandboxProfiles(),
    proxyLogs: makeProxyLogs(),
    quarantineItems: makeQuarantineItems(),
  };

  it('level 5 contains event-stream section marker', () => {
    const result = renderSecurityDetail(state, timeline, 5, opts);
    expect(result).toContain('security-event-stream');
  });

  it('level 5 contains sandbox-profiles section marker', () => {
    const result = renderSecurityDetail(state, timeline, 5, opts);
    expect(result).toContain('sandbox-profiles');
  });

  it('level 5 contains proxy-logs section marker', () => {
    const result = renderSecurityDetail(state, timeline, 5, opts);
    expect(result).toContain('proxy-logs');
  });

  it('level 5 contains quarantine-contents section marker', () => {
    const result = renderSecurityDetail(state, timeline, 5, opts);
    expect(result).toContain('quarantine-contents');
  });
});

// ============================================================================
// Test Group 7: Blocked request log with severity colors (DSH-06)
// ============================================================================

describe('Group 7: Blocked request log severity colors', () => {
  it('blocked severity entry contains severity-blocked class', () => {
    const result = renderBlockedRequestLog([makeBlockedRequest('blocked')]);
    expect(result).toContain('severity-blocked');
  });

  it('warning severity entry contains severity-warning class', () => {
    const result = renderBlockedRequestLog([makeBlockedRequest('warning')]);
    expect(result).toContain('severity-warning');
  });

  it('empty list returns a string without crash', () => {
    const result = renderBlockedRequestLog([]);
    expect(typeof result).toBe('string');
  });

  it('multiple entries contain both domain names', () => {
    const result = renderBlockedRequestLog([
      makeBlockedRequest('blocked', 'evil.com'),
      makeBlockedRequest('warning', 'suspect.org'),
    ]);
    expect(result).toContain('evil.com');
    expect(result).toContain('suspect.org');
  });
});

// ============================================================================
// Test Group 8: Per-agent isolation status (DSH-07)
// ============================================================================

describe('Group 8: Per-agent isolation status', () => {
  it('output contains the agentId value', () => {
    const agent = makeAgentIsolation('agent-exec-1', 'EXEC', true);
    const result = renderAgentIsolationStatus([agent]);
    expect(result).toContain('agent-exec-1');
  });

  it('output contains the agentType value', () => {
    const agent = makeAgentIsolation('agent-verify-1', 'VERIFY', true);
    const result = renderAgentIsolationStatus([agent]);
    expect(result).toContain('VERIFY');
  });

  it('isolated=true entry contains isolated-yes class', () => {
    const agent = makeAgentIsolation('agent-1', 'EXEC', true);
    const result = renderAgentIsolationStatus([agent]);
    expect(result).toContain('isolated-yes');
  });

  it('isolated=false entry contains isolated-no class', () => {
    const agent = makeAgentIsolation('agent-2', 'SCOUT', false);
    const result = renderAgentIsolationStatus([agent]);
    expect(result).toContain('isolated-no');
  });

  it('empty list returns a string without crash', () => {
    const result = renderAgentIsolationStatus([]);
    expect(typeof result).toBe('string');
  });
});

// ============================================================================
// Test Group 9: Credential proxy health (DSH-08)
// ============================================================================

describe('Group 9: Credential proxy health', () => {
  it('running status contains proxy-running class', () => {
    const result = renderProxyHealth(makeProxyHealth('running'));
    expect(result).toContain('proxy-running');
  });

  it('down status contains proxy-down class', () => {
    const result = renderProxyHealth(makeProxyHealth('down'));
    expect(result).toContain('proxy-down');
  });

  it('degraded status contains proxy-degraded class', () => {
    const result = renderProxyHealth(makeProxyHealth('degraded'));
    expect(result).toContain('proxy-degraded');
  });

  it('output contains requestCount value', () => {
    const result = renderProxyHealth(makeProxyHealth('running', { requestCount: 42 }));
    expect(result).toContain('42');
  });

  it('output contains avgLatencyMs value', () => {
    const result = renderProxyHealth(makeProxyHealth('running', { avgLatencyMs: 12.5 }));
    expect(result).toContain('12.5');
  });
});

// ============================================================================
// Test Group 10: IPC event constants
// ============================================================================

describe('Group 10: IPC event constants', () => {
  it('sandbox-active maps to security:sandbox-active', () => {
    expect(SECURITY_IPC_EVENTS['sandbox-active']).toBe('security:sandbox-active');
  });

  it('request-blocked maps to security:request-blocked', () => {
    expect(SECURITY_IPC_EVENTS['request-blocked']).toBe('security:request-blocked');
  });

  it('content-quarantined maps to security:content-quarantined', () => {
    expect(SECURITY_IPC_EVENTS['content-quarantined']).toBe('security:content-quarantined');
  });

  it('has exactly 10 event entries', () => {
    expect(Object.keys(SECURITY_IPC_EVENTS).length).toBe(10);
  });
});
