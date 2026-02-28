/**
 * Security type schema tests.
 *
 * Validates TypeScript Zod schemas for SecurityEvent, SandboxProfile,
 * ProxyConfig, DomainCredential, and AgentIsolationState.
 *
 * TDD RED phase: These tests import from src/types/security.ts which
 * does not yet exist -- all tests must FAIL on first run.
 *
 * @module tests/security-types
 */

import { describe, it, expect } from 'vitest';
import {
  SecurityEventSchema,
  SandboxProfileSchema,
  ProxyConfigSchema,
  DomainCredentialSchema,
  AgentIsolationStateSchema,
} from '../../../src/types/security.js';
import type {
  SecurityEvent,
  SandboxProfile,
  ProxyConfig,
  DomainCredential,
  AgentIsolationState,
} from '../../../src/types/security.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const validDomainCredential: DomainCredential = {
  domain: 'api.anthropic.com',
  credential_type: 'api_key_header',
  credential_source: 'keychain',
  header_name: 'x-api-key',
};

const validDomainCredentialMinimal: DomainCredential = {
  domain: 'github.com',
  credential_type: 'ssh_agent',
  credential_source: 'env',
};

const validSandboxProfile: SandboxProfile = {
  agent_id: 'exec-001',
  agent_type: 'exec',
  filesystem: {
    write_dirs: ['/tmp/worktree-exec-001'],
    deny_read: ['/home/user/.ssh', '/home/user/.aws'],
  },
  network: {
    allowed_domains: [validDomainCredential],
    proxy_socket: '/tmp/gsd-proxy.sock',
  },
  worktree_path: '/tmp/worktree-exec-001',
};

const validSecurityEvent: SecurityEvent = {
  id: 'evt-001',
  timestamp: '2026-02-26T09:00:00Z',
  severity: 'warning',
  source: 'sandbox',
  event_type: 'filesystem_deny',
  detail: { path: '/home/user/.ssh/id_ed25519', action: 'read' },
};

const validProxyConfig: ProxyConfig = {
  socket_path: '/tmp/gsd-proxy.sock',
  allowed_domains: [validDomainCredential],
  log_requests: true,
  log_credentials: false,
};

const validAgentIsolationState: AgentIsolationState = {
  agent_id: 'exec-001',
  agent_type: 'exec',
  worktree_path: '/tmp/worktree-exec-001',
  sandbox_profile: validSandboxProfile,
  status: 'active',
  created_at: '2026-02-26T09:00:00Z',
};

// ---------------------------------------------------------------------------
// DomainCredential
// ---------------------------------------------------------------------------

describe('DomainCredentialSchema', () => {
  it('accepts a valid credential with all fields', () => {
    const result = DomainCredentialSchema.parse(validDomainCredential);
    expect(result.domain).toBe('api.anthropic.com');
    expect(result.credential_type).toBe('api_key_header');
    expect(result.credential_source).toBe('keychain');
    expect(result.header_name).toBe('x-api-key');
  });

  it('accepts a credential without optional header_name', () => {
    const result = DomainCredentialSchema.parse(validDomainCredentialMinimal);
    expect(result.header_name).toBeUndefined();
  });

  it('rejects invalid credential_type', () => {
    expect(() =>
      DomainCredentialSchema.parse({
        ...validDomainCredential,
        credential_type: 'oauth2',
      }),
    ).toThrow();
  });

  it('rejects invalid credential_source', () => {
    expect(() =>
      DomainCredentialSchema.parse({
        ...validDomainCredential,
        credential_source: 'vault',
      }),
    ).toThrow();
  });

  it('rejects missing domain', () => {
    const { domain: _, ...noDomain } = validDomainCredential;
    expect(() => DomainCredentialSchema.parse(noDomain)).toThrow();
  });

  it('round-trips through JSON', () => {
    const parsed = DomainCredentialSchema.parse(validDomainCredential);
    const json = JSON.stringify(parsed);
    const reparsed = DomainCredentialSchema.parse(JSON.parse(json));
    expect(reparsed).toEqual(parsed);
  });
});

// ---------------------------------------------------------------------------
// SecurityEvent
// ---------------------------------------------------------------------------

describe('SecurityEventSchema', () => {
  it('accepts a valid security event', () => {
    const result = SecurityEventSchema.parse(validSecurityEvent);
    expect(result.id).toBe('evt-001');
    expect(result.severity).toBe('warning');
    expect(result.source).toBe('sandbox');
  });

  it('accepts all severity values', () => {
    for (const severity of ['info', 'warning', 'critical', 'blocked'] as const) {
      const result = SecurityEventSchema.parse({
        ...validSecurityEvent,
        severity,
      });
      expect(result.severity).toBe(severity);
    }
  });

  it('accepts all source values', () => {
    for (const source of ['sandbox', 'proxy', 'staging', 'agent-isolation'] as const) {
      const result = SecurityEventSchema.parse({
        ...validSecurityEvent,
        source,
      });
      expect(result.source).toBe(source);
    }
  });

  it('rejects invalid severity', () => {
    expect(() =>
      SecurityEventSchema.parse({
        ...validSecurityEvent,
        severity: 'fatal',
      }),
    ).toThrow();
  });

  it('rejects invalid source', () => {
    expect(() =>
      SecurityEventSchema.parse({
        ...validSecurityEvent,
        source: 'unknown',
      }),
    ).toThrow();
  });

  it('rejects missing id', () => {
    const { id: _, ...noId } = validSecurityEvent;
    expect(() => SecurityEventSchema.parse(noId)).toThrow();
  });

  it('accepts detail as record with any values', () => {
    const result = SecurityEventSchema.parse({
      ...validSecurityEvent,
      detail: { nested: { deep: true }, count: 42, tags: ['a', 'b'] },
    });
    expect(result.detail).toEqual({ nested: { deep: true }, count: 42, tags: ['a', 'b'] });
  });

  it('round-trips through JSON', () => {
    const parsed = SecurityEventSchema.parse(validSecurityEvent);
    const json = JSON.stringify(parsed);
    const reparsed = SecurityEventSchema.parse(JSON.parse(json));
    expect(reparsed).toEqual(parsed);
  });
});

// ---------------------------------------------------------------------------
// SandboxProfile
// ---------------------------------------------------------------------------

describe('SandboxProfileSchema', () => {
  it('accepts a valid sandbox profile', () => {
    const result = SandboxProfileSchema.parse(validSandboxProfile);
    expect(result.agent_id).toBe('exec-001');
    expect(result.agent_type).toBe('exec');
    expect(result.filesystem.write_dirs).toHaveLength(1);
    expect(result.filesystem.deny_read).toHaveLength(2);
    expect(result.network.allowed_domains).toHaveLength(1);
  });

  it('accepts all agent_type values', () => {
    for (const agent_type of ['exec', 'verify', 'scout', 'main'] as const) {
      const result = SandboxProfileSchema.parse({
        ...validSandboxProfile,
        agent_type,
      });
      expect(result.agent_type).toBe(agent_type);
    }
  });

  it('accepts without optional worktree_path', () => {
    const { worktree_path: _, ...noWorktree } = validSandboxProfile;
    const result = SandboxProfileSchema.parse(noWorktree);
    expect(result.worktree_path).toBeUndefined();
  });

  it('rejects invalid agent_type', () => {
    expect(() =>
      SandboxProfileSchema.parse({
        ...validSandboxProfile,
        agent_type: 'admin',
      }),
    ).toThrow();
  });

  it('rejects missing filesystem', () => {
    const { filesystem: _, ...noFs } = validSandboxProfile;
    expect(() => SandboxProfileSchema.parse(noFs)).toThrow();
  });

  it('validates nested DomainCredential in network', () => {
    expect(() =>
      SandboxProfileSchema.parse({
        ...validSandboxProfile,
        network: {
          allowed_domains: [{ domain: 'test.com', credential_type: 'invalid' }],
          proxy_socket: '/tmp/test.sock',
        },
      }),
    ).toThrow();
  });

  it('round-trips through JSON', () => {
    const parsed = SandboxProfileSchema.parse(validSandboxProfile);
    const json = JSON.stringify(parsed);
    const reparsed = SandboxProfileSchema.parse(JSON.parse(json));
    expect(reparsed).toEqual(parsed);
  });
});

// ---------------------------------------------------------------------------
// ProxyConfig
// ---------------------------------------------------------------------------

describe('ProxyConfigSchema', () => {
  it('accepts a valid proxy config', () => {
    const result = ProxyConfigSchema.parse(validProxyConfig);
    expect(result.socket_path).toBe('/tmp/gsd-proxy.sock');
    expect(result.log_requests).toBe(true);
    expect(result.log_credentials).toBe(false);
  });

  it('rejects log_credentials: true', () => {
    expect(() =>
      ProxyConfigSchema.parse({
        ...validProxyConfig,
        log_credentials: true,
      }),
    ).toThrow();
  });

  it('rejects missing socket_path', () => {
    const { socket_path: _, ...noSocket } = validProxyConfig;
    expect(() => ProxyConfigSchema.parse(noSocket)).toThrow();
  });

  it('validates nested DomainCredential array', () => {
    expect(() =>
      ProxyConfigSchema.parse({
        ...validProxyConfig,
        allowed_domains: [{ domain: 'test.com' }],
      }),
    ).toThrow();
  });

  it('round-trips through JSON', () => {
    const parsed = ProxyConfigSchema.parse(validProxyConfig);
    const json = JSON.stringify(parsed);
    const reparsed = ProxyConfigSchema.parse(JSON.parse(json));
    expect(reparsed).toEqual(parsed);
  });
});

// ---------------------------------------------------------------------------
// AgentIsolationState
// ---------------------------------------------------------------------------

describe('AgentIsolationStateSchema', () => {
  it('accepts a valid agent isolation state', () => {
    const result = AgentIsolationStateSchema.parse(validAgentIsolationState);
    expect(result.agent_id).toBe('exec-001');
    expect(result.agent_type).toBe('exec');
    expect(result.status).toBe('active');
    expect(result.sandbox_profile.agent_id).toBe('exec-001');
  });

  it('accepts all agent_type values', () => {
    for (const agent_type of ['exec', 'verify', 'scout', 'main'] as const) {
      const result = AgentIsolationStateSchema.parse({
        ...validAgentIsolationState,
        agent_type,
        sandbox_profile: { ...validSandboxProfile, agent_type },
      });
      expect(result.agent_type).toBe(agent_type);
    }
  });

  it('rejects missing sandbox_profile', () => {
    const { sandbox_profile: _, ...noProfile } = validAgentIsolationState;
    expect(() => AgentIsolationStateSchema.parse(noProfile)).toThrow();
  });

  it('rejects invalid nested sandbox_profile', () => {
    expect(() =>
      AgentIsolationStateSchema.parse({
        ...validAgentIsolationState,
        sandbox_profile: { agent_id: 'bad' },
      }),
    ).toThrow();
  });

  it('round-trips through JSON', () => {
    const parsed = AgentIsolationStateSchema.parse(validAgentIsolationState);
    const json = JSON.stringify(parsed);
    const reparsed = AgentIsolationStateSchema.parse(JSON.parse(json));
    expect(reparsed).toEqual(parsed);
  });
});
