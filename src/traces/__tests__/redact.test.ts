/**
 * Redact-on-write: secrets must not leak into traces.
 *
 * Validates that the redactString and redactTrace functions catch:
 *   - api_key / apikey / api-key patterns
 *   - password patterns
 *   - token patterns
 *   - secret patterns
 *   - private_key / private-key patterns
 *
 * Also validates that redaction fires on writeTrace (integration).
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { redactString, redactTrace, writeTrace } from '../writer.js';
import { readTraces } from '../reader.js';
import type { DecisionTrace } from '../../types/memory.js';
import type { CanonicalDecisionTrace } from '../schema.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempPath(): string {
  return join(tmpdir(), `traces-redact-test-${randomUUID()}.jsonl`);
}

function makeTrace(overrides: Partial<DecisionTrace> = {}): DecisionTrace {
  return {
    id: randomUUID(),
    ts: Date.now(),
    actor: 'skill:redact-test',
    intent: 'Test redaction logic',
    reasoning: 'No secrets here',
    constraints: [],
    alternatives: [],
    refs: {},
    ...overrides,
  };
}

// ─── redactString ─────────────────────────────────────────────────────────────

describe('redactString — api_key patterns', () => {
  it('redacts api_key=value', () => {
    const result = redactString('Found api_key=sk-abc123 in payload');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('sk-abc123');
  });

  it('redacts apikey=value', () => {
    const result = redactString('apikey=supersecret');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('supersecret');
  });

  it('redacts api-key=value', () => {
    const result = redactString('api-key=abc-def-ghi');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('abc-def-ghi');
  });
});

describe('redactString — password patterns', () => {
  it('redacts password=value', () => {
    const result = redactString('password=hunter2');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('hunter2');
  });

  it('redacts PASSWORD: value (case insensitive)', () => {
    const result = redactString('PASSWORD: mysecretpassword');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('mysecretpassword');
  });

  it('redacts password in constraints array element', () => {
    const result = redactString('must not include password=letmein');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('letmein');
  });
});

describe('redactString — token patterns', () => {
  it('redacts token=value', () => {
    const result = redactString('token=eyJhbGciOiJIUzI1NiJ9');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiJ9');
  });

  it('redacts standalone token value (space-separated)', () => {
    // "token xyz_abc" — token is a standalone word followed by a value.
    const result = redactString('Authorization: token xyz_abc');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('xyz_abc');
  });

  it('redacts TOKEN (uppercase)', () => {
    const result = redactString('TOKEN=secret-value');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('secret-value');
  });
});

describe('redactString — secret patterns', () => {
  it('redacts secret=value', () => {
    const result = redactString('secret=my-super-secret');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('my-super-secret');
  });

  it('redacts Secret: value', () => {
    const result = redactString('Secret: abc123def456');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('abc123def456');
  });
});

describe('redactString — private_key patterns', () => {
  it('redacts private_key=value', () => {
    const result = redactString('private_key=MIIG...');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('MIIG');
  });

  it('redacts private-key=value', () => {
    const result = redactString('private-key=someBase64Value');
    expect(result).toContain('[redacted]');
    expect(result).not.toContain('someBase64Value');
  });
});

describe('redactString — clean strings pass through', () => {
  it('does not modify strings with no secrets', () => {
    const clean = 'Sort a list of skills by priority score';
    expect(redactString(clean)).toBe(clean);
  });

  it('does not modify empty string', () => {
    expect(redactString('')).toBe('');
  });
});

// ─── redactTrace ──────────────────────────────────────────────────────────────

describe('redactTrace', () => {
  it('redacts secrets in intent', () => {
    const c: CanonicalDecisionTrace = {
      id: randomUUID(), ts: 1000, actor: 'skill:x',
      intent: 'Send api_key=sk-12345 to endpoint',
      reasoning: 'test', constraints: [], alternatives: [], outcome: '',
      refs: { teachId: '', entityIds: [] },
    };
    const redacted = redactTrace(c);
    expect(redacted.intent).toContain('[redacted]');
    expect(redacted.intent).not.toContain('sk-12345');
  });

  it('redacts secrets in reasoning', () => {
    const c: CanonicalDecisionTrace = {
      id: randomUUID(), ts: 1000, actor: 'skill:x',
      intent: 'test',
      reasoning: 'Used password=admin123 to authenticate',
      constraints: [], alternatives: [], outcome: '',
      refs: { teachId: '', entityIds: [] },
    };
    const redacted = redactTrace(c);
    expect(redacted.reasoning).toContain('[redacted]');
    expect(redacted.reasoning).not.toContain('admin123');
  });

  it('redacts secrets in constraints array', () => {
    const c: CanonicalDecisionTrace = {
      id: randomUUID(), ts: 1000, actor: 'skill:x',
      intent: 'test', reasoning: 'test',
      constraints: ['token=abc123', 'max-tokens:1000'],
      alternatives: [], outcome: '',
      refs: { teachId: '', entityIds: [] },
    };
    const redacted = redactTrace(c);
    expect(redacted.constraints[0]).toContain('[redacted]');
    expect(redacted.constraints[0]).not.toContain('abc123');
    expect(redacted.constraints[1]).toBe('max-tokens:1000'); // unchanged
  });

  it('redacts secrets in alternatives array', () => {
    const c: CanonicalDecisionTrace = {
      id: randomUUID(), ts: 1000, actor: 'skill:x',
      intent: 'test', reasoning: 'test',
      constraints: [],
      alternatives: ['rejected: secret=xyz'],
      outcome: '',
      refs: { teachId: '', entityIds: [] },
    };
    const redacted = redactTrace(c);
    expect(redacted.alternatives[0]).toContain('[redacted]');
    expect(redacted.alternatives[0]).not.toContain('xyz');
  });

  it('does not modify clean traces', () => {
    const c: CanonicalDecisionTrace = {
      id: randomUUID(), ts: 1000, actor: 'skill:clean',
      intent: 'Sort skills by priority', reasoning: 'Merge sort is stable',
      constraints: ['O(n log n)'], alternatives: ['quicksort: unstable'],
      outcome: 'Done',
      refs: { teachId: 'teach-1', entityIds: ['e1'] },
    };
    const redacted = redactTrace(c);
    expect(redacted.intent).toBe(c.intent);
    expect(redacted.reasoning).toBe(c.reasoning);
    expect(redacted.constraints).toEqual(c.constraints);
    expect(redacted.alternatives).toEqual(c.alternatives);
  });
});

// ─── Integration: redaction fires on writeTrace ───────────────────────────────

describe('writeTrace — redact-on-write integration', () => {
  it('writes redacted reasoning to the log (secret not persisted)', async () => {
    const logPath = tempPath();
    const trace = makeTrace({
      reasoning: 'Authenticated using api_key=sk-verysecret-value',
    });
    await writeTrace(trace, logPath);

    const read = await readTraces(logPath);
    expect(read).toHaveLength(1);
    expect(read[0].reasoning).toContain('[redacted]');
    expect(read[0].reasoning).not.toContain('sk-verysecret-value');
  });

  it('writes redacted intent to the log (password not persisted)', async () => {
    const logPath = tempPath();
    const trace = makeTrace({
      intent: 'Login with password=hunter2 and token=abc',
    });
    await writeTrace(trace, logPath);

    const read = await readTraces(logPath);
    expect(read).toHaveLength(1);
    expect(read[0].intent).not.toContain('hunter2');
    expect(read[0].intent).not.toContain('abc');
    expect(read[0].intent).toContain('[redacted]');
  });

  it('does not redact clean traces on write', async () => {
    const logPath = tempPath();
    const trace = makeTrace({
      intent: 'Sort skill definitions by priority',
      reasoning: 'Merge sort for stable ordering',
    });
    await writeTrace(trace, logPath);

    const read = await readTraces(logPath);
    expect(read[0].intent).toBe(trace.intent);
    expect(read[0].reasoning).toBe(trace.reasoning);
  });
});
