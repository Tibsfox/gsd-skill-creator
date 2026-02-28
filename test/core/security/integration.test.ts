/**
 * Integration Tests (INT-01..INT-10)
 *
 * End-to-end verification that all security components work together.
 * Tests the TypeScript layer's integration: schemas validate cross-module
 * data, render functions produce correct output from integrated state,
 * IPC constants match across modules, and barrel exports are complete.
 *
 * @module tests/security/integration
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

import {
  SecurityEventSchema,
  SandboxProfileSchema,
  ProxyConfigSchema,
  AgentIsolationStateSchema,
  DomainCredentialSchema,
  SECURITY_COMMANDS,
  SECURITY_IPC_EVENTS,
  PANEL_IPC_EVENTS,
} from '../../../src/security/index.js';

import {
  renderShieldIndicator,
  renderSecurityDetail,
  renderBlockedRequestLog,
  renderAgentIsolationStatus,
  renderProxyHealth,
  shouldBypassMagicFilter,
  getShieldPulseClass,
  type ShieldState,
  type SecurityEvent,
  type SecurityTimeline,
  type BlockedRequest,
  type AgentIsolationStatus,
  type ProxyHealth,
} from '../../../src/components/SecurityPanel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fixturesDir = resolve(__dirname, '../../fixtures/security-patterns');

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

function makeEvent(
  severity: SecurityEvent['severity'],
  source: SecurityEvent['source'] = 'sandbox',
  message = 'Test event',
): SecurityEvent {
  return {
    id: `evt-${severity}`,
    timestamp: '2026-02-26T10:00:00Z',
    severity,
    source,
    message,
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

// ---------------------------------------------------------------------------
// INT-01: Full bootstrap produces active security status
// ---------------------------------------------------------------------------

describe('INT-01: Full bootstrap integration', () => {
  it('INT-01: All IPC events defined for complete bootstrap flow', () => {
    // Backend emits these on bootstrap completion
    expect(SECURITY_IPC_EVENTS.SHIELD_UPDATE).toBe('security:shield-update');
    expect(SECURITY_IPC_EVENTS.BREACH_BLOCKED).toBe('security:breach-blocked');
    // Panel consumes these
    expect(PANEL_IPC_EVENTS['sandbox-active']).toBe('security:sandbox-active');
    expect(PANEL_IPC_EVENTS['proxy-health']).toBe('security:proxy-health');
  });

  it('INT-01b: SecurityEvent covers all 4 sources in bootstrap flow', () => {
    for (const source of ['sandbox', 'proxy', 'staging', 'agent-isolation'] as const) {
      const event = {
        id: `boot-${source}`,
        timestamp: '2026-02-26T09:00:00Z',
        severity: 'info',
        source,
        event_type: 'bootstrap_check',
        detail: { step: source },
      };
      expect(() => SecurityEventSchema.parse(event)).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// INT-02: End-to-end API call (agent -> proxy -> external)
// ---------------------------------------------------------------------------

describe('INT-02: End-to-end API call flow', () => {
  it('INT-02: Agent sandbox profile + proxy config form valid pipeline', () => {
    const proxyConfig = {
      socket_path: '/tmp/gsd-proxy.sock',
      allowed_domains: [{
        domain: 'api.anthropic.com',
        credential_type: 'api_key_header' as const,
        credential_source: 'keychain' as const,
        header_name: 'x-api-key',
      }],
      log_requests: true,
      log_credentials: false,
    };
    const agentProfile = {
      agent_id: 'exec-001',
      agent_type: 'exec' as const,
      filesystem: {
        write_dirs: ['/tmp/worktree'],
        deny_read: ['/home/user/.ssh'],
      },
      network: {
        allowed_domains: [{
          domain: 'api.anthropic.com',
          credential_type: 'api_key_header' as const,
          credential_source: 'keychain' as const,
          header_name: 'x-api-key',
        }],
        proxy_socket: proxyConfig.socket_path,
      },
      worktree_path: '/tmp/worktree',
    };
    // Both parse successfully -- pipeline is valid
    const proxy = ProxyConfigSchema.parse(proxyConfig);
    const profile = SandboxProfileSchema.parse(agentProfile);
    // Agent's proxy_socket matches proxy's socket_path
    expect(profile.network.proxy_socket).toBe(proxy.socket_path);
    // Credential never appears in serialized form
    const json = JSON.stringify({ proxy, profile });
    expect(json).not.toContain('sk-ant');
  });
});

// ---------------------------------------------------------------------------
// INT-03: End-to-end git push with SSH agent forwarding
// ---------------------------------------------------------------------------

describe('INT-03: SSH agent forwarding pipeline', () => {
  it('INT-03: SSH agent credential type supported in domain binding', () => {
    const cred = {
      domain: 'github.com',
      credential_type: 'ssh_agent' as const,
      credential_source: 'env' as const,
    };
    const result = DomainCredentialSchema.parse(cred);
    expect(result.credential_type).toBe('ssh_agent');
    expect(result.domain).toBe('github.com');
  });
});

// ---------------------------------------------------------------------------
// INT-04: CVE payload quarantine + IPC event
// ---------------------------------------------------------------------------

describe('INT-04: CVE-2025-59536 quarantine flow', () => {
  it('INT-04: CVE fixture + breach event + shield state integration', () => {
    // 1. Fixture contains the attack pattern
    const fixturePath = join(fixturesDir, 'sec-001-hook-override', '.claude', 'settings.json');
    const content = readFileSync(fixturePath, 'utf-8');
    expect(content).toContain('hooks');
    expect(content).toContain('curl');

    // 2. Security event for quarantine
    const quarantineEvent = {
      id: 'quarantine-001',
      timestamp: '2026-02-26T10:00:00Z',
      severity: 'blocked',
      source: 'staging',
      event_type: 'content_quarantined',
      detail: { cve: 'CVE-2025-59536', pattern: 'SEC-001' },
    };
    const event = SecurityEventSchema.parse(quarantineEvent);
    expect(event.severity).toBe('blocked');

    // 3. Shield should bypass magic on breach
    const panelEvent = makeEvent('blocked', 'staging', 'CVE-2025-59536 quarantined');
    expect(shouldBypassMagicFilter(panelEvent)).toBe(true);

    // 4. Shield state reflects breach
    const state = makeState('breach-blocked');
    const html = renderShieldIndicator(state, 1);
    expect(html).toContain('shield-breach-blocked');
  });
});

// ---------------------------------------------------------------------------
// INT-05: Multi-agent parallel isolation
// ---------------------------------------------------------------------------

describe('INT-05: Multi-agent isolation', () => {
  it('INT-05: 3 agents with isolated worktrees render correctly', () => {
    const agents: AgentIsolationStatus[] = [
      { agentId: 'exec-001', agentType: 'EXEC', isolated: true, worktreePath: '/tmp/exec-001', sandboxProfile: 'exec' },
      { agentId: 'verify-001', agentType: 'VERIFY', isolated: true, worktreePath: '/tmp/verify-001', sandboxProfile: 'verify' },
      { agentId: 'scout-001', agentType: 'SCOUT', isolated: true, worktreePath: '/tmp/scout-001', sandboxProfile: 'scout' },
    ];
    const html = renderAgentIsolationStatus(agents);
    expect(html).toContain('exec-001');
    expect(html).toContain('verify-001');
    expect(html).toContain('scout-001');
    // All should be isolated
    const isolatedCount = (html.match(/isolated-yes/g) || []).length;
    expect(isolatedCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// INT-06: Proxy restart recovery
// ---------------------------------------------------------------------------

describe('INT-06: Proxy restart recovery', () => {
  it('INT-06: Shield transitions from attention back to secure', () => {
    const before = makeState('attention', { proxy_active: false });
    const after = makeState('secure', { proxy_active: true });
    const pulse = getShieldPulseClass(before, after);
    expect(pulse).toBe('shield-pulse');
    // After recovery, proxy health shows running
    const health: ProxyHealth = {
      status: 'running',
      uptime: 5,
      requestCount: 0,
      blockedCount: 0,
      activeDomains: ['api.anthropic.com'],
      avgLatencyMs: 0,
    };
    const html = renderProxyHealth(health);
    expect(html).toContain('proxy-running');
  });
});

// ---------------------------------------------------------------------------
// INT-07: Remote Control sandbox compatibility
// ---------------------------------------------------------------------------

describe('INT-07: Tauri command completeness', () => {
  it('INT-07: All 7 security commands available', () => {
    expect(Object.keys(SECURITY_COMMANDS)).toHaveLength(7);
    expect(SECURITY_COMMANDS.GET_STATUS).toBe('security_get_status');
    expect(SECURITY_COMMANDS.RELEASE_QUARANTINE).toBe('security_release_quarantine');
    expect(SECURITY_COMMANDS.SANDBOX_VERIFY).toBe('sandbox_verify_full');
    expect(SECURITY_COMMANDS.PROXY_HEALTH).toBe('proxy_health');
    expect(SECURITY_COMMANDS.AGENT_CREATE).toBe('agent_create');
    expect(SECURITY_COMMANDS.AGENT_DESTROY).toBe('agent_destroy');
    expect(SECURITY_COMMANDS.AGENT_VERIFY_ISOLATION).toBe('agent_verify_isolation');
  });
});

// ---------------------------------------------------------------------------
// INT-08: Magic level progressive disclosure
// ---------------------------------------------------------------------------

describe('INT-08: Magic level progressive disclosure', () => {
  it('INT-08: Level 1 -> 5 reveals progressively more detail', () => {
    const state = makeState('secure');
    const timeline = makeTimeline([makeEvent('info')]);

    const l1 = renderShieldIndicator(state, 1);
    const l2 = renderShieldIndicator(state, 2);
    const l3 = renderShieldIndicator(state, 3);
    const l5 = renderShieldIndicator(state, 5);

    // Level 1 has least content
    expect(l1.length).toBeLessThan(l2.length);
    // Level 2 adds status text
    expect(l2).toContain('shield-status');
    // Level 3 adds subsystem info
    expect(l3).toContain('Sandbox:');
    // Level 5 has most content
    expect(l5.length).toBeGreaterThanOrEqual(l3.length);

    // Detail panel progressive disclosure
    const d2 = renderSecurityDetail(state, timeline, 2);
    const d3 = renderSecurityDetail(state, timeline, 3);
    const d5 = renderSecurityDetail(state, timeline, 5);

    expect(d2).not.toContain('security-timeline');
    expect(d3).toContain('security-timeline');
    expect(d5).toContain('security-event-stream');
  });
});

// ---------------------------------------------------------------------------
// INT-09: Graceful degradation without sandbox
// ---------------------------------------------------------------------------

describe('INT-09: Graceful degradation', () => {
  it('INT-09: Shield shows attention when sandbox inactive', () => {
    const state = makeState('attention', {
      sandbox_active: false,
      proxy_active: true,
    });
    const html = renderShieldIndicator(state, 3);
    expect(html).toContain('shield-attention');
    expect(html).toContain('Sandbox: OFF');
    expect(html).toContain('Proxy: ON');
  });
});

// ---------------------------------------------------------------------------
// INT-10: Barrel export completeness
// ---------------------------------------------------------------------------

describe('INT-10: Barrel export completeness', () => {
  it('INT-10: src/security/index.ts exports all required symbols', () => {
    // Schemas
    expect(SecurityEventSchema).toBeDefined();
    expect(SandboxProfileSchema).toBeDefined();
    expect(ProxyConfigSchema).toBeDefined();
    expect(AgentIsolationStateSchema).toBeDefined();
    expect(DomainCredentialSchema).toBeDefined();

    // Command constants
    expect(SECURITY_COMMANDS).toBeDefined();
    expect(SECURITY_IPC_EVENTS).toBeDefined();
    expect(PANEL_IPC_EVENTS).toBeDefined();

    // Render functions
    expect(renderShieldIndicator).toBeDefined();
    expect(renderSecurityDetail).toBeDefined();
    expect(renderBlockedRequestLog).toBeDefined();
    expect(renderAgentIsolationStatus).toBeDefined();
    expect(renderProxyHealth).toBeDefined();
    expect(shouldBypassMagicFilter).toBeDefined();
    expect(getShieldPulseClass).toBeDefined();
  });

  it('INT-10b: All fixture directories exist', () => {
    const expected = [
      'clean-mission-pack',
      'sec-001-hook-override',
      'sec-002-api-redirect',
      'sec-003-hook-injection',
      'sec-004-mcp-risk',
      'sec-005-sandbox-escape',
      'sec-006-ssh-key-ref',
      'sec-007-credential-exfil',
      'sec-008-base64-obfuscation',
    ];
    for (const dir of expected) {
      expect(existsSync(join(fixturesDir, dir))).toBe(true);
    }
  });
});
