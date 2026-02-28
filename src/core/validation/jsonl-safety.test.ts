import { describe, it, expect } from 'vitest';
import {
  computeChecksum,
  createChecksummedEntry,
  verifyChecksum,
  validateJsonlEntry,
  JsonlSafetyError,
} from './jsonl-safety.js';

describe('computeChecksum', () => {
  it('returns a 64-char hex string (SHA-256)', () => {
    const result = computeChecksum({ key: 'value' });
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic (same input = same output)', () => {
    const data = { command: 'git status', args: ['--short'] };
    const first = computeChecksum(data);
    const second = computeChecksum(data);
    expect(first).toBe(second);
  });

  it('produces different checksums for different data', () => {
    const a = computeChecksum({ key: 'a' });
    const b = computeChecksum({ key: 'b' });
    expect(a).not.toBe(b);
  });
});

describe('createChecksummedEntry', () => {
  it('adds a _checksum field to the envelope object', () => {
    const envelope = {
      timestamp: Date.now(),
      category: 'commands',
      data: { command: 'npm test' },
    };
    const result = createChecksummedEntry(envelope);
    expect(result).toHaveProperty('_checksum');
    expect(typeof result._checksum).toBe('string');
    expect(result._checksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it('preserves all original envelope fields', () => {
    const envelope = {
      timestamp: 12345,
      category: 'sessions',
      data: { sessionId: 's1' },
      session_id: 'extra-field',
    };
    const result = createChecksummedEntry(envelope);
    expect(result.timestamp).toBe(12345);
    expect(result.category).toBe('sessions');
    expect(result.data).toEqual({ sessionId: 's1' });
    expect(result.session_id).toBe('extra-field');
  });
});

describe('verifyChecksum', () => {
  it('returns {valid: true} for untampered entries', () => {
    const entry = createChecksummedEntry({
      timestamp: Date.now(),
      category: 'commands',
      data: { command: 'git log' },
    });
    const result = verifyChecksum(entry);
    expect(result).toEqual({ valid: true });
  });

  it('returns {valid: false} when data field is modified after checksum', () => {
    const entry = createChecksummedEntry({
      timestamp: Date.now(),
      category: 'commands',
      data: { command: 'git log' },
    });
    // Tamper with data
    (entry.data as Record<string, unknown>).command = 'rm -rf /';
    const result = verifyChecksum(entry);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('tampered');
  });

  it('returns {valid: false} when _checksum field is missing', () => {
    const entry = {
      timestamp: Date.now(),
      category: 'commands',
      data: { command: 'git log' },
    };
    const result = verifyChecksum(entry);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('_checksum');
  });

  it('returns {valid: false} when _checksum is not a string', () => {
    const entry = {
      timestamp: Date.now(),
      category: 'commands',
      data: { command: 'git log' },
      _checksum: 12345,
    };
    const result = verifyChecksum(entry);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('_checksum');
  });
});

describe('validateJsonlEntry', () => {
  it('returns {valid: true, entry: ...} for a valid Pattern envelope', () => {
    const line = JSON.stringify({
      timestamp: Date.now(),
      category: 'commands',
      data: { command: 'npm test' },
    });
    const result = validateJsonlEntry(line);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.entry.timestamp).toBeTypeOf('number');
      expect(result.entry.category).toBeTypeOf('string');
      expect(result.entry.data).toBeTypeOf('object');
    }
  });

  it('returns {valid: false} with missing timestamp', () => {
    const line = JSON.stringify({ category: 'commands', data: {} });
    const result = validateJsonlEntry(line);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('timestamp');
    }
  });

  it('returns {valid: false} with missing category', () => {
    const line = JSON.stringify({ timestamp: 123, data: {} });
    const result = validateJsonlEntry(line);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('category');
    }
  });

  it('returns {valid: false} with missing data', () => {
    const line = JSON.stringify({ timestamp: 123, category: 'commands' });
    const result = validateJsonlEntry(line);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('data');
    }
  });

  it('returns {valid: false} with timestamp as string (wrong type)', () => {
    const line = JSON.stringify({
      timestamp: 'not-a-number',
      category: 'commands',
      data: {},
    });
    const result = validateJsonlEntry(line);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('timestamp');
    }
  });

  it('returns {valid: false} with non-JSON string', () => {
    const result = validateJsonlEntry('this is not json');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Invalid JSON');
    }
  });

  it('returns {valid: false} with empty string', () => {
    const result = validateJsonlEntry('');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Invalid JSON');
    }
  });
});

describe('JsonlSafetyError', () => {
  it('has name set to JsonlSafetyError', () => {
    const err = new JsonlSafetyError('test');
    expect(err.name).toBe('JsonlSafetyError');
    expect(err.message).toBe('test');
    expect(err).toBeInstanceOf(Error);
  });
});
