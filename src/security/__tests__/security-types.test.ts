/**
 * Security type round-trip validation tests.
 *
 * Validates that all 5 Zod schemas in src/types/security.ts correctly parse
 * JSON shapes matching the Rust Serde output (snake_case field names, enum
 * values as lowercase strings).
 *
 * Phase 516-01 -- SSH Security Core
 *
 * @module security/__tests__/security-types.test
 */

import { describe, it, expect } from 'vitest';
import {
  DomainCredentialSchema,
  SecurityEventSchema,
  SandboxProfileSchema,
  ProxyConfigSchema,
  AgentIsolationStateSchema,
} from '../../types/security.js';

// ============================================================================
// DomainCredential
// ============================================================================

describe('DomainCredentialSchema', () => {
  const validApiKey = {
    domain: 'api.anthropic.com',
    credential_type: 'api_key_header',
    credential_source: 'env',
    header_name: 'x-api-key',
  };

  const validSshAgent = {
    domain: 'github.com',
    credential_type: 'ssh_agent',
    credential_source: 'keychain',
  };

  const validBearer = {
    domain: 'registry.npmjs.org',
    credential_type: 'bearer_token',
    credential_source: 'file',
  };

  const validBasicAuth = {
    domain: 'internal.corp.com',
    credential_type: 'basic_auth',
    credential_source: 'keychain',
  };

  it('should accept valid api_key_header credential', () => {
    const result = DomainCredentialSchema.parse(validApiKey);
    expect(result.domain).toBe('api.anthropic.com');
    expect(result.credential_type).toBe('api_key_header');
    expect(result.header_name).toBe('x-api-key');
  });

  it('should accept valid ssh_agent credential', () => {
    const result = DomainCredentialSchema.parse(validSshAgent);
    expect(result.credential_type).toBe('ssh_agent');
  });

  it('should accept valid bearer_token credential', () => {
    const result = DomainCredentialSchema.parse(validBearer);
    expect(result.credential_type).toBe('bearer_token');
  });

  it('should accept valid basic_auth credential', () => {
    const result = DomainCredentialSchema.parse(validBasicAuth);
    expect(result.credential_type).toBe('basic_auth');
  });

  it('should accept optional header_name being absent', () => {
    const result = DomainCredentialSchema.parse(validSshAgent);
    expect(result.header_name).toBeUndefined();
  });

  it('should reject unknown credential_type variant', () => {
    expect(() =>
      DomainCredentialSchema.parse({
        domain: 'evil.com',
        credential_type: 'oauth2_magic',
        credential_source: 'env',
      }),
    ).toThrow();
  });

  it('should reject unknown credential_source variant', () => {
    expect(() =>
      DomainCredentialSchema.parse({
        domain: 'evil.com',
        credential_type: 'bearer_token',
        credential_source: 'memory',
      }),
    ).toThrow();
  });

  it('should reject missing domain field', () => {
    expect(() =>
      DomainCredentialSchema.parse({
        credential_type: 'bearer_token',
        credential_source: 'env',
      }),
    ).toThrow();
  });

  it('should round-trip through JSON serialization', () => {
    const original = DomainCredentialSchema.parse(validApiKey);
    const roundTripped = DomainCredentialSchema.parse(
      JSON.parse(JSON.stringify(original)),
    );
    expect(roundTripped).toEqual(original);
  });
});

// ============================================================================
// SecurityEvent
// ============================================================================

describe('SecurityEventSchema', () => {
  const validEvent = {
    id: 'evt-001',
    timestamp: '2026-03-01T12:00:00Z',
    severity: 'critical',
    source: 'staging',
    event_type: 'pattern_match',
    detail: { finding_id: 'SEC-001', file: 'test.json', line: 5 },
  };

  it('should accept valid security event with info severity', () => {
    const result = SecurityEventSchema.parse({
      ...validEvent,
      severity: 'info',
    });
    expect(result.severity).toBe('info');
  });

  it('should accept valid security event with warning severity', () => {
    const result = SecurityEventSchema.parse({
      ...validEvent,
      severity: 'warning',
    });
    expect(result.severity).toBe('warning');
  });

  it('should accept valid security event with critical severity', () => {
    const result = SecurityEventSchema.parse(validEvent);
    expect(result.severity).toBe('critical');
  });

  it('should accept valid security event with blocked severity', () => {
    const result = SecurityEventSchema.parse({
      ...validEvent,
      severity: 'blocked',
    });
    expect(result.severity).toBe('blocked');
  });

  it('should accept all 4 source types', () => {
    for (const source of ['sandbox', 'proxy', 'staging', 'agent-isolation']) {
      const result = SecurityEventSchema.parse({ ...validEvent, source });
      expect(result.source).toBe(source);
    }
  });

  it('should validate ISO 8601 datetime format', () => {
    expect(() =>
      SecurityEventSchema.parse({
        ...validEvent,
        timestamp: 'not-a-date',
      }),
    ).toThrow();
  });

  it('should accept detail as arbitrary record', () => {
    const result = SecurityEventSchema.parse({
      ...validEvent,
      detail: { any_key: 'any_value', nested: { deep: true } },
    });
    expect(result.detail).toHaveProperty('any_key');
  });

  it('should reject unknown severity variant', () => {
    expect(() =>
      SecurityEventSchema.parse({
        ...validEvent,
        severity: 'apocalyptic',
      }),
    ).toThrow();
  });

  it('should reject unknown source variant', () => {
    expect(() =>
      SecurityEventSchema.parse({
        ...validEvent,
        source: 'unknown-subsystem',
      }),
    ).toThrow();
  });

  it('should reject missing required fields', () => {
    expect(() =>
      SecurityEventSchema.parse({ id: 'evt-001' }),
    ).toThrow();
  });

  it('should round-trip through JSON serialization', () => {
    const original = SecurityEventSchema.parse(validEvent);
    const roundTripped = SecurityEventSchema.parse(
      JSON.parse(JSON.stringify(original)),
    );
    expect(roundTripped).toEqual(original);
  });
});

// ============================================================================
// SandboxProfile
// ============================================================================

describe('SandboxProfileSchema', () => {
  const validProfile = {
    agent_id: 'exec-001',
    agent_type: 'exec',
    filesystem: {
      write_dirs: ['/tmp/worktree/exec-001'],
      deny_read: ['/home/user/.ssh', '/home/user/.aws'],
    },
    network: {
      allowed_domains: [
        {
          domain: 'api.anthropic.com',
          credential_type: 'api_key_header',
          credential_source: 'env',
          header_name: 'x-api-key',
        },
      ],
      proxy_socket: '/tmp/proxy.sock',
    },
  };

  it('should accept valid exec profile', () => {
    const result = SandboxProfileSchema.parse(validProfile);
    expect(result.agent_type).toBe('exec');
    expect(result.filesystem.write_dirs).toHaveLength(1);
  });

  it('should accept all 4 agent_type variants', () => {
    for (const agentType of ['exec', 'verify', 'scout', 'main']) {
      const result = SandboxProfileSchema.parse({
        ...validProfile,
        agent_type: agentType,
      });
      expect(result.agent_type).toBe(agentType);
    }
  });

  it('should validate nested filesystem object', () => {
    expect(() =>
      SandboxProfileSchema.parse({
        ...validProfile,
        filesystem: { write_dirs: 'not-an-array' },
      }),
    ).toThrow();
  });

  it('should validate nested network.allowed_domains array', () => {
    const result = SandboxProfileSchema.parse(validProfile);
    expect(result.network.allowed_domains).toHaveLength(1);
    expect(result.network.allowed_domains[0].domain).toBe(
      'api.anthropic.com',
    );
  });

  it('should accept optional worktree_path', () => {
    const withWorktree = {
      ...validProfile,
      worktree_path: '/tmp/worktrees/exec-001',
    };
    const result = SandboxProfileSchema.parse(withWorktree);
    expect(result.worktree_path).toBe('/tmp/worktrees/exec-001');
  });

  it('should accept absent worktree_path', () => {
    const result = SandboxProfileSchema.parse(validProfile);
    expect(result.worktree_path).toBeUndefined();
  });

  it('should reject unknown agent_type variant', () => {
    expect(() =>
      SandboxProfileSchema.parse({
        ...validProfile,
        agent_type: 'admin',
      }),
    ).toThrow();
  });

  it('should reject missing filesystem field', () => {
    const { filesystem: _fs, ...rest } = validProfile;
    expect(() => SandboxProfileSchema.parse(rest)).toThrow();
  });

  it('should round-trip through JSON serialization', () => {
    const original = SandboxProfileSchema.parse(validProfile);
    const roundTripped = SandboxProfileSchema.parse(
      JSON.parse(JSON.stringify(original)),
    );
    expect(roundTripped).toEqual(original);
  });
});

// ============================================================================
// ProxyConfig
// ============================================================================

describe('ProxyConfigSchema', () => {
  const validConfig = {
    socket_path: '/tmp/proxy.sock',
    allowed_domains: [
      {
        domain: 'api.anthropic.com',
        credential_type: 'api_key_header',
        credential_source: 'env',
        header_name: 'x-api-key',
      },
    ],
    log_requests: true,
    log_credentials: false,
  };

  it('should accept valid proxy config', () => {
    const result = ProxyConfigSchema.parse(validConfig);
    expect(result.socket_path).toBe('/tmp/proxy.sock');
    expect(result.log_requests).toBe(true);
    expect(result.log_credentials).toBe(false);
  });

  it('should accept log_credentials: false', () => {
    const result = ProxyConfigSchema.parse(validConfig);
    expect(result.log_credentials).toBe(false);
  });

  it('should REJECT log_credentials: true (z.literal(false) enforced)', () => {
    expect(() =>
      ProxyConfigSchema.parse({
        ...validConfig,
        log_credentials: true,
      }),
    ).toThrow();
  });

  it('should reject log_credentials with non-boolean value', () => {
    expect(() =>
      ProxyConfigSchema.parse({
        ...validConfig,
        log_credentials: 'false',
      }),
    ).toThrow();
  });

  it('should validate allowed_domains array contains valid DomainCredentials', () => {
    expect(() =>
      ProxyConfigSchema.parse({
        ...validConfig,
        allowed_domains: [{ invalid: true }],
      }),
    ).toThrow();
  });

  it('should accept empty allowed_domains array', () => {
    const result = ProxyConfigSchema.parse({
      ...validConfig,
      allowed_domains: [],
    });
    expect(result.allowed_domains).toHaveLength(0);
  });

  it('should reject missing socket_path', () => {
    const { socket_path: _sp, ...rest } = validConfig;
    expect(() => ProxyConfigSchema.parse(rest)).toThrow();
  });

  it('should round-trip through JSON serialization', () => {
    const original = ProxyConfigSchema.parse(validConfig);
    const roundTripped = ProxyConfigSchema.parse(
      JSON.parse(JSON.stringify(original)),
    );
    expect(roundTripped).toEqual(original);
  });
});

// ============================================================================
// AgentIsolationState
// ============================================================================

describe('AgentIsolationStateSchema', () => {
  const validState = {
    agent_id: 'exec-001',
    agent_type: 'exec',
    worktree_path: '/tmp/worktrees/exec-001',
    sandbox_profile: {
      agent_id: 'exec-001',
      agent_type: 'exec',
      filesystem: {
        write_dirs: ['/tmp/worktrees/exec-001'],
        deny_read: ['/home/user/.ssh'],
      },
      network: {
        allowed_domains: [
          {
            domain: 'api.anthropic.com',
            credential_type: 'api_key_header',
            credential_source: 'env',
          },
        ],
        proxy_socket: '/tmp/proxy.sock',
      },
    },
    status: 'active',
    created_at: '2026-03-01T12:00:00Z',
  };

  it('should accept valid agent isolation state', () => {
    const result = AgentIsolationStateSchema.parse(validState);
    expect(result.agent_id).toBe('exec-001');
    expect(result.status).toBe('active');
  });

  it('should validate nested sandbox_profile recursively', () => {
    const result = AgentIsolationStateSchema.parse(validState);
    expect(result.sandbox_profile.agent_type).toBe('exec');
    expect(result.sandbox_profile.filesystem.deny_read).toContain(
      '/home/user/.ssh',
    );
  });

  it('should validate ISO 8601 datetime for created_at', () => {
    expect(() =>
      AgentIsolationStateSchema.parse({
        ...validState,
        created_at: 'invalid-datetime',
      }),
    ).toThrow();
  });

  it('should accept all 4 agent_type variants', () => {
    for (const agentType of ['exec', 'verify', 'scout', 'main']) {
      const result = AgentIsolationStateSchema.parse({
        ...validState,
        agent_type: agentType,
        sandbox_profile: {
          ...validState.sandbox_profile,
          agent_type: agentType,
        },
      });
      expect(result.agent_type).toBe(agentType);
    }
  });

  it('should reject invalid nested sandbox_profile', () => {
    expect(() =>
      AgentIsolationStateSchema.parse({
        ...validState,
        sandbox_profile: { invalid: true },
      }),
    ).toThrow();
  });

  it('should reject missing required worktree_path', () => {
    const { worktree_path: _wt, ...rest } = validState;
    expect(() => AgentIsolationStateSchema.parse(rest)).toThrow();
  });

  it('should round-trip through JSON serialization', () => {
    const original = AgentIsolationStateSchema.parse(validState);
    const roundTripped = AgentIsolationStateSchema.parse(
      JSON.parse(JSON.stringify(original)),
    );
    expect(roundTripped).toEqual(original);
  });
});
