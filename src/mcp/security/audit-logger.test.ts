import { describe, it, expect } from 'vitest';
import { AuditLogger, type AuditEntry } from './audit-logger.js';

// ============================================================================
// Helpers
// ============================================================================

function makeEntry(overrides: Partial<Omit<AuditEntry, 'id' | 'timestamp'>> = {}) {
  return {
    caller: 'agent-1',
    serverId: 'server-1',
    toolName: 'read-file',
    params: { path: '/project/file.ts' } as Record<string, unknown>,
    responseStatus: 'success' as const,
    durationMs: 42,
    blocked: false,
    source: 'external' as const,
    ...overrides,
  };
}

// ============================================================================
// Audit entry logging (SECR-10)
// ============================================================================

describe('AuditLogger: entry logging (SECR-10)', () => {
  it('log() creates entry with id, timestamp, caller, tool, params, status, timing', () => {
    const logger = new AuditLogger();
    const entry = logger.log(makeEntry());
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeGreaterThan(0);
    expect(entry.caller).toBe('agent-1');
    expect(entry.toolName).toBe('read-file');
    expect(entry.responseStatus).toBe('success');
    expect(entry.durationMs).toBe(42);
  });

  it('entry includes serverId and toolName', () => {
    const logger = new AuditLogger();
    const entry = logger.log(makeEntry({ serverId: 'test-server', toolName: 'write-file' }));
    expect(entry.serverId).toBe('test-server');
    expect(entry.toolName).toBe('write-file');
  });

  it('entry includes source field', () => {
    const logger = new AuditLogger();
    const ext = logger.log(makeEntry({ source: 'external' }));
    expect(ext.source).toBe('external');

    const a2a = logger.log(makeEntry({ source: 'agent-to-agent' }));
    expect(a2a.source).toBe('agent-to-agent');
  });

  it('getEntries() returns logged entries', () => {
    const logger = new AuditLogger();
    logger.log(makeEntry());
    logger.log(makeEntry({ toolName: 'write-file' }));
    expect(logger.getEntries().length).toBe(2);
  });

  it('getRecentEntries() returns most recent N entries', () => {
    const logger = new AuditLogger();
    logger.log(makeEntry({ toolName: 'tool-1' }));
    logger.log(makeEntry({ toolName: 'tool-2' }));
    logger.log(makeEntry({ toolName: 'tool-3' }));

    const recent = logger.getRecentEntries(2);
    expect(recent.length).toBe(2);
    expect(recent[0].toolName).toBe('tool-2');
    expect(recent[1].toolName).toBe('tool-3');
  });

  it('filter by serverId works', () => {
    const logger = new AuditLogger();
    logger.log(makeEntry({ serverId: 'a' }));
    logger.log(makeEntry({ serverId: 'b' }));
    logger.log(makeEntry({ serverId: 'a' }));

    const filtered = logger.getEntries({ serverId: 'a' });
    expect(filtered.length).toBe(2);
    expect(filtered.every((e) => e.serverId === 'a')).toBe(true);
  });

  it('filter by toolName works', () => {
    const logger = new AuditLogger();
    logger.log(makeEntry({ toolName: 'read' }));
    logger.log(makeEntry({ toolName: 'write' }));

    const filtered = logger.getEntries({ toolName: 'write' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].toolName).toBe('write');
  });

  it('onEntry callback is invoked on each log', () => {
    const captured: AuditEntry[] = [];
    const logger = new AuditLogger({ onEntry: (e) => captured.push(e) });
    logger.log(makeEntry());
    logger.log(makeEntry());
    expect(captured.length).toBe(2);
  });
});

// ============================================================================
// Parameter redaction (SECR-11)
// ============================================================================

describe('AuditLogger: parameter redaction (SECR-11)', () => {
  it('API keys in params are redacted', () => {
    const logger = new AuditLogger();
    const entry = logger.log(makeEntry({
      params: { config: 'api_key: sk-1234567890abcdefghijklmn' },
    }));
    expect(JSON.stringify(entry.params)).toContain('[REDACTED]');
    expect(JSON.stringify(entry.params)).not.toContain('sk-1234567890abcdefghijklmn');
  });

  it('bearer tokens in params are redacted', () => {
    const logger = new AuditLogger();
    const entry = logger.log(makeEntry({
      params: { auth: 'bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123' },
    }));
    expect(JSON.stringify(entry.params)).toContain('[REDACTED]');
  });

  it('password fields are redacted by key name', () => {
    const logger = new AuditLogger();
    const entry = logger.log(makeEntry({
      params: { password: 'mysecretpassword123' },
    }));
    expect(entry.params.password).toBe('[REDACTED]');
  });

  it('AWS access keys are redacted', () => {
    const logger = new AuditLogger();
    const entry = logger.log(makeEntry({
      params: { credentials: 'AKIAIOSFODNN7EXAMPLE' },
    }));
    expect(JSON.stringify(entry.params)).toContain('[REDACTED]');
    expect(JSON.stringify(entry.params)).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });

  it('nested object values are redacted', () => {
    const logger = new AuditLogger();
    const entry = logger.log(makeEntry({
      params: {
        config: {
          nested: {
            apiKey: 'super-secret-key-value',
          },
        },
      },
    }));
    const nested = (entry.params.config as any)?.nested;
    expect(nested?.apiKey).toBe('[REDACTED]');
  });

  it('non-sensitive params are NOT redacted', () => {
    const logger = new AuditLogger();
    const entry = logger.log(makeEntry({
      params: { path: '/project/file.ts', encoding: 'utf-8' },
    }));
    expect(entry.params.path).toBe('/project/file.ts');
    expect(entry.params.encoding).toBe('utf-8');
  });

  it('custom redaction patterns work', () => {
    const logger = new AuditLogger({
      redactPatterns: [/CUSTOM_SECRET_\w+/g],
    });
    const entry = logger.log(makeEntry({
      params: { data: 'contains CUSTOM_SECRET_VALUE here' },
    }));
    expect(JSON.stringify(entry.params)).toContain('[REDACTED]');
    expect(JSON.stringify(entry.params)).not.toContain('CUSTOM_SECRET_VALUE');
  });
});

// ============================================================================
// Capacity management
// ============================================================================

describe('AuditLogger: capacity management', () => {
  it('maxEntries limit is enforced (oldest entries dropped)', () => {
    const logger = new AuditLogger({ maxEntries: 3 });
    logger.log(makeEntry({ toolName: 'tool-1' }));
    logger.log(makeEntry({ toolName: 'tool-2' }));
    logger.log(makeEntry({ toolName: 'tool-3' }));
    logger.log(makeEntry({ toolName: 'tool-4' }));

    const entries = logger.getEntries();
    expect(entries.length).toBe(3);
    // Oldest (tool-1) should be dropped
    expect(entries[0].toolName).toBe('tool-2');
  });

  it('clear() removes all entries', () => {
    const logger = new AuditLogger();
    logger.log(makeEntry());
    logger.log(makeEntry());
    expect(logger.getEntries().length).toBe(2);

    logger.clear();
    expect(logger.getEntries().length).toBe(0);
  });
});
