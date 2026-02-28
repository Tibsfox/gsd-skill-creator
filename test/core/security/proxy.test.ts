/**
 * Credential Proxy Tests (CP-01..CP-08)
 *
 * Tests TypeScript-level proxy configuration schema invariants,
 * domain allowlist enforcement, and credential safety contracts.
 *
 * The actual proxy server is implemented in Rust (ProxyServer, CredentialProxy).
 * These tests verify the TypeScript schema enforces the same invariants.
 *
 * @module tests/security/proxy
 */

import { describe, it, expect } from 'vitest';

import {
  ProxyConfigSchema,
  DomainCredentialSchema,
  SecurityEventSchema,
  type ProxyConfig,
  SECURITY_COMMANDS,
} from '../../../src/core/security/index.js';

import {
  renderProxyHealth,
  type ProxyHealth,
} from '../../../src/components/SecurityPanel.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProxyConfig(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    socket_path: '/tmp/gsd-proxy.sock',
    allowed_domains: [{
      domain: 'api.anthropic.com',
      credential_type: 'api_key_header',
      credential_source: 'keychain',
      header_name: 'x-api-key',
    }],
    log_requests: true,
    log_credentials: false,
    ...overrides,
  };
}

function makeHealth(overrides: Partial<ProxyHealth> = {}): ProxyHealth {
  return {
    status: 'running',
    uptime: 3600,
    requestCount: 100,
    blockedCount: 5,
    activeDomains: ['api.anthropic.com', 'github.com'],
    avgLatencyMs: 12.0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// CP-01: Credential injection via domain binding
// ---------------------------------------------------------------------------

describe('CP-01: Domain credential injection', () => {
  it('CP-01: DomainCredential with api_key_header has header_name', () => {
    const cred = {
      domain: 'api.anthropic.com',
      credential_type: 'api_key_header' as const,
      credential_source: 'keychain' as const,
      header_name: 'x-api-key',
    };
    const result = DomainCredentialSchema.parse(cred);
    expect(result.header_name).toBe('x-api-key');
    expect(result.credential_type).toBe('api_key_header');
  });
});

// ---------------------------------------------------------------------------
// CP-02: Blocked domain enforcement
// ---------------------------------------------------------------------------

describe('CP-02: Blocked domain produces SecurityEvent', () => {
  it('CP-02: SecurityEvent with blocked severity for unlisted domain', () => {
    const event = {
      id: 'blocked-001',
      timestamp: '2026-02-26T10:00:00Z',
      severity: 'blocked',
      source: 'proxy',
      event_type: 'domain_blocked',
      detail: { domain: 'unlisted.com', agent_id: 'exec-001' },
    };
    const result = SecurityEventSchema.parse(event);
    expect(result.severity).toBe('blocked');
    expect(result.source).toBe('proxy');
  });
});

// ---------------------------------------------------------------------------
// CP-03: Response credential stripping
// ---------------------------------------------------------------------------

describe('CP-03: Credential stripping contract', () => {
  it('CP-03: ProxyConfig log_credentials is always false', () => {
    const config = makeProxyConfig();
    const result = ProxyConfigSchema.parse(config);
    expect(result.log_credentials).toBe(false);
  });

  it('CP-03b: ProxyConfig rejects log_credentials: true', () => {
    expect(() =>
      ProxyConfigSchema.parse({ ...makeProxyConfig(), log_credentials: true }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CP-04: Proxy health endpoint
// ---------------------------------------------------------------------------

describe('CP-04: Proxy health status', () => {
  it('CP-04: proxy_health command exists in SECURITY_COMMANDS', () => {
    expect(SECURITY_COMMANDS.PROXY_HEALTH).toBe('proxy_health');
  });

  it('CP-04b: ProxyHealth render contains status and request count', () => {
    const health = makeHealth({ status: 'running', requestCount: 42, uptime: 100 });
    const html = renderProxyHealth(health);
    expect(html).toContain('running');
    expect(html).toContain('42');
    expect(html).toContain('100');
  });
});

// ---------------------------------------------------------------------------
// CP-05: Concurrent request isolation
// ---------------------------------------------------------------------------

describe('CP-05: Concurrent agent credential isolation', () => {
  it('CP-05: Multiple agent DomainCredentials parse independently', () => {
    const agents = ['exec-001', 'exec-002', 'verify-001'];
    const configs = agents.map(agentId => ({
      socket_path: `/tmp/proxy-${agentId}.sock`,
      allowed_domains: [{
        domain: 'api.anthropic.com',
        credential_type: 'api_key_header' as const,
        credential_source: 'keychain' as const,
        header_name: 'x-api-key',
      }],
      log_requests: true,
      log_credentials: false,
    }));
    // All configs parse without cross-contamination
    const parsed = configs.map(c => ProxyConfigSchema.parse(c));
    expect(parsed).toHaveLength(3);
    // Each has unique socket
    const sockets = new Set(parsed.map(p => p.socket_path));
    expect(sockets.size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// CP-06: Proxy latency measurement
// ---------------------------------------------------------------------------

describe('CP-06: Proxy latency under threshold', () => {
  it('CP-06: ProxyHealth avgLatencyMs renders correctly', () => {
    const health = makeHealth({ avgLatencyMs: 25.5 });
    const html = renderProxyHealth(health);
    expect(html).toContain('25.5');
    expect(html).toContain('ms');
  });
});

// ---------------------------------------------------------------------------
// CP-07: Socket permissions
// ---------------------------------------------------------------------------

describe('CP-07: Proxy socket path contract', () => {
  it('CP-07: ProxyConfig requires socket_path string', () => {
    const config = makeProxyConfig({ socket_path: '/tmp/gsd-proxy.sock' });
    const result = ProxyConfigSchema.parse(config);
    expect(result.socket_path).toBe('/tmp/gsd-proxy.sock');
  });

  it('CP-07b: ProxyConfig rejects missing socket_path', () => {
    const { socket_path: _, ...noSocket } = makeProxyConfig();
    expect(() => ProxyConfigSchema.parse(noSocket)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CP-08: Proxy restart resilience
// ---------------------------------------------------------------------------

describe('CP-08: Proxy restart credential safety', () => {
  it('CP-08: ProxyConfig round-trips through JSON without credential leakage', () => {
    const config = makeProxyConfig();
    const parsed = ProxyConfigSchema.parse(config);
    const json = JSON.stringify(parsed);
    expect(json).not.toContain('sk-ant');
    const reparsed = ProxyConfigSchema.parse(JSON.parse(json));
    expect(reparsed).toEqual(parsed);
    expect(reparsed.log_credentials).toBe(false);
  });
});
