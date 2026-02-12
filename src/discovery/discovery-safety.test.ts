/**
 * Tests for discovery boundary and content safety functions.
 *
 * Covers: SECRET_PATTERNS constant, redactSecrets(), filterStructuralOnly(),
 * ProjectAccessConfig type, and validateProjectAccess().
 */

import { describe, it, expect } from 'vitest';
import {
  SECRET_PATTERNS,
  redactSecrets,
  filterStructuralOnly,
  validateProjectAccess,
} from './discovery-safety.js';
import type { ParsedEntry } from './types.js';

// ============================================================================
// SECRET_PATTERNS
// ============================================================================

describe('SECRET_PATTERNS', () => {
  it('is an array of { name: string; pattern: RegExp } objects', () => {
    expect(Array.isArray(SECRET_PATTERNS)).toBe(true);
    for (const entry of SECRET_PATTERNS) {
      expect(typeof entry.name).toBe('string');
      expect(entry.pattern).toBeInstanceOf(RegExp);
    }
  });

  it('contains at least 10 distinct named patterns', () => {
    expect(SECRET_PATTERNS.length).toBeGreaterThanOrEqual(10);
    const names = SECRET_PATTERNS.map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBeGreaterThanOrEqual(10);
  });

  it('covers AWS keys', () => {
    const awsPattern = SECRET_PATTERNS.find((p) => p.name.includes('aws'));
    expect(awsPattern).toBeDefined();
    expect(awsPattern!.pattern.test('AKIAIOSFODNN7EXAMPLE')).toBe(true);
  });

  it('covers generic API keys', () => {
    const apiKeyPattern = SECRET_PATTERNS.find((p) => p.name.includes('api-key'));
    expect(apiKeyPattern).toBeDefined();
    expect(apiKeyPattern!.pattern.test('api_key=abc123longvalue456')).toBe(true);
  });

  it('covers Bearer tokens', () => {
    const bearerPattern = SECRET_PATTERNS.find((p) => p.name.includes('bearer'));
    expect(bearerPattern).toBeDefined();
    expect(bearerPattern!.pattern.test('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig')).toBe(true);
  });

  it('covers GitHub tokens', () => {
    const ghPattern = SECRET_PATTERNS.find((p) => p.name.includes('github'));
    expect(ghPattern).toBeDefined();
    expect(ghPattern!.pattern.test('ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1234')).toBe(true);
  });

  it('covers npm tokens', () => {
    const npmPattern = SECRET_PATTERNS.find((p) => p.name.includes('npm'));
    expect(npmPattern).toBeDefined();
    expect(npmPattern!.pattern.test('npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(true);
  });

  it('covers private key blocks', () => {
    const pkPattern = SECRET_PATTERNS.find((p) => p.name.includes('private-key'));
    expect(pkPattern).toBeDefined();
  });

  it('covers password assignments', () => {
    const pwPattern = SECRET_PATTERNS.find((p) => p.name.includes('password'));
    expect(pwPattern).toBeDefined();
    expect(pwPattern!.pattern.test('password=mysecretpassword123')).toBe(true);
  });

  it('covers Stripe keys', () => {
    const stripePattern = SECRET_PATTERNS.find((p) => p.name.includes('stripe'));
    expect(stripePattern).toBeDefined();
    expect(stripePattern!.pattern.test('sk_' + 'live_abcdefghijklmnopqrstuvwx')).toBe(true);
  });

  it('covers Slack tokens', () => {
    const slackPattern = SECRET_PATTERNS.find((p) => p.name.includes('slack'));
    expect(slackPattern).toBeDefined();
    expect(slackPattern!.pattern.test('xox' + 'b-123456789012-1234567890123-abcdefghijklmnopqrstuvwx')).toBe(true);
  });

  it('covers generic secrets (secret= or token= with long values)', () => {
    const genericPattern = SECRET_PATTERNS.find((p) => p.name.includes('generic-secret'));
    expect(genericPattern).toBeDefined();
    expect(genericPattern!.pattern.test('secret=abcdefghij1234567890')).toBe(true);
  });
});

// ============================================================================
// redactSecrets
// ============================================================================

describe('redactSecrets', () => {
  it('redacts AWS keys with tagged marker', () => {
    const input = 'my key is AKIAIOSFODNN7EXAMPLE and more text';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED:aws-key]');
    expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });

  it('redacts api_key=value with tagged marker', () => {
    const input = 'config has api_key=abc123longvalue456 set';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED:api-key]');
    expect(result).not.toContain('abc123longvalue456');
  });

  it('redacts GitHub tokens with tagged marker', () => {
    const input = 'token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1234';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED:github-token]');
    expect(result).not.toContain('ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1234');
  });

  it('redacts private key blocks with tagged marker', () => {
    const input = '-----BEGIN RSA PRIVATE KEY-----\nMIIBogIB...\n-----END RSA PRIVATE KEY-----';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED:private-key]');
    expect(result).not.toContain('MIIBogIB');
  });

  it('redacts Bearer tokens with tagged marker', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED:bearer-token]');
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  it('returns unchanged text when no secrets present', () => {
    const input = 'This is a normal message with no secrets at all.';
    const result = redactSecrets(input);
    expect(result).toBe(input);
  });

  it('redacts multiple secrets in one pass', () => {
    const input = 'key=AKIAIOSFODNN7EXAMPLE and ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1234';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED:aws-key]');
    expect(result).toContain('[REDACTED:github-token]');
    expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(result).not.toContain('ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1234');
  });

  it('returns empty string for empty input', () => {
    expect(redactSecrets('')).toBe('');
  });
});

// ============================================================================
// filterStructuralOnly
// ============================================================================

describe('filterStructuralOnly', () => {
  it('removes user-prompt entries (returns null)', () => {
    const entry: ParsedEntry = {
      kind: 'user-prompt',
      data: {
        text: 'some raw conversation content',
        sessionId: 'sess-1',
        timestamp: '2026-01-01T00:00:00Z',
        cwd: '/home/user',
      },
    };
    expect(filterStructuralOnly(entry)).toBeNull();
  });

  it('keeps skipped entries as-is', () => {
    const entry: ParsedEntry = {
      kind: 'skipped',
      type: 'progress',
    };
    const result = filterStructuralOnly(entry);
    expect(result).toEqual(entry);
  });

  it('keeps tool-uses entries but replaces input with { redacted: true }', () => {
    const entry: ParsedEntry = {
      kind: 'tool-uses',
      data: [
        { name: 'Read', input: { file_path: '/etc/passwd', content: 'sensitive data' } },
        { name: 'Write', input: { file_path: '/tmp/out', content: 'more sensitive data' } },
      ],
    };
    const result = filterStructuralOnly(entry);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('tool-uses');
    if (result!.kind === 'tool-uses') {
      expect(result!.data).toHaveLength(2);
      expect(result!.data[0].name).toBe('Read');
      expect(result!.data[0].input).toEqual({ redacted: true });
      expect(result!.data[1].name).toBe('Write');
      expect(result!.data[1].input).toEqual({ redacted: true });
    }
  });

  it('keeps Bash tool command (after redaction) for structural insight', () => {
    const entry: ParsedEntry = {
      kind: 'tool-uses',
      data: [
        {
          name: 'Bash',
          input: {
            command: 'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig" https://api.example.com',
            timeout: 5000,
          },
        },
      ],
    };
    const result = filterStructuralOnly(entry);
    expect(result).not.toBeNull();
    if (result!.kind === 'tool-uses') {
      expect(result!.data[0].name).toBe('Bash');
      // Command should be present but with secrets redacted
      const input = result!.data[0].input as { command: string; redacted: boolean };
      expect(input.command).toContain('[REDACTED:bearer-token]');
      expect(input.command).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(input.redacted).toBe(true);
    }
  });
});

// ============================================================================
// validateProjectAccess
// ============================================================================

describe('validateProjectAccess', () => {
  it('allows project in allowProjects list', () => {
    expect(
      validateProjectAccess('project-a', {
        allowProjects: ['project-a', 'project-b'],
      }),
    ).toBe(true);
  });

  it('denies project not in allowProjects list', () => {
    expect(
      validateProjectAccess('project-c', {
        allowProjects: ['project-a', 'project-b'],
      }),
    ).toBe(false);
  });

  it('denies project in excludeProjects list', () => {
    expect(
      validateProjectAccess('project-a', {
        excludeProjects: ['project-a'],
      }),
    ).toBe(false);
  });

  it('allows project when no restrictions set', () => {
    expect(validateProjectAccess('project-a', {})).toBe(true);
  });

  it('blocklist wins over allowlist', () => {
    expect(
      validateProjectAccess('project-a', {
        allowProjects: ['project-a'],
        excludeProjects: ['project-a'],
      }),
    ).toBe(false);
  });

  it('allows project when both allowProjects and excludeProjects are undefined', () => {
    expect(
      validateProjectAccess('project-a', {
        allowProjects: undefined,
        excludeProjects: undefined,
      }),
    ).toBe(true);
  });
});
