/**
 * Teaching ledger tests
 *
 * CF-M8-01  round-trip (serialise → parse → validate)
 * CF-M8-02  five categories accept correct input, reject incorrect
 * CF-M8-03  M3-trace linkage by ID
 * EC-07     10 KiB content bound
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

import {
  appendTeachEntry,
  readTeachEntries,
  getTeachEntryById,
  validateTeachEntry,
  isValidCategory,
  TEACH_CATEGORIES,
  TEACH_CONTENT_MAX_BYTES,
} from '../teaching.js';
import type { TeachCategory } from '../../types/symbiosis.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function tempLedger(): string {
  const dir = join(tmpdir(), `symbiosis-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return join(dir, 'teaching.jsonl');
}

// ─── CF-M8-01: round-trip ────────────────────────────────────────────────────

describe('CF-M8-01: teach entry round-trip', () => {
  it('appends a valid entry and reads it back with identical fields', () => {
    const path = tempLedger();
    const result = appendTeachEntry(
      'correction',
      'System should not fire on test files',
      ['trace-abc'],
      { ledgerPath: path, now: 1_000_000 },
    );

    expect(result.ok).toBe(true);
    expect(result.id).toBeTruthy();

    const entries = readTeachEntries(path);
    expect(entries).toHaveLength(1);

    const entry = entries[0]!;
    expect(entry.id).toBe(result.id);
    expect(entry.ts).toBe(1_000_000);
    expect(entry.category).toBe('correction');
    expect(entry.content).toBe('System should not fire on test files');
    expect(entry.refs).toEqual(['trace-abc']);
  });

  it('generates unique IDs for each entry', () => {
    const path = tempLedger();
    appendTeachEntry('pattern', 'Content A', [], { ledgerPath: path });
    appendTeachEntry('pattern', 'Content B', [], { ledgerPath: path });
    const entries = readTeachEntries(path);
    expect(entries).toHaveLength(2);
    expect(entries[0]!.id).not.toBe(entries[1]!.id);
  });

  it('appends without overwriting existing entries (append-only)', () => {
    const path = tempLedger();
    for (let i = 0; i < 5; i++) {
      appendTeachEntry('preference', `Content ${i}`, [], { ledgerPath: path });
    }
    const entries = readTeachEntries(path);
    expect(entries).toHaveLength(5);
    // All IDs unique
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('round-trips multiple categories in one ledger', () => {
    const path = tempLedger();
    const categories: TeachCategory[] = ['correction', 'clarification', 'constraint', 'pattern', 'preference'];
    for (const cat of categories) {
      appendTeachEntry(cat, `Content for ${cat}`, [], { ledgerPath: path });
    }
    const entries = readTeachEntries(path);
    expect(entries).toHaveLength(5);
    const foundCats = entries.map((e) => e.category);
    for (const cat of categories) {
      expect(foundCats).toContain(cat);
    }
  });

  it('skips malformed lines and continues (EC-06)', () => {
    const path = tempLedger();
    // Write a bad line manually
    writeFileSync(path, 'not-json\n{"id":"x","ts":1,"category":"correction","content":"ok","refs":[]}\n', 'utf8');
    const entries = readTeachEntries(path);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.content).toBe('ok');
  });

  it('returns empty array when ledger does not exist', () => {
    const entries = readTeachEntries('/tmp/does-not-exist-' + randomUUID() + '.jsonl');
    expect(entries).toEqual([]);
  });
});

// ─── CF-M8-02: five categories ───────────────────────────────────────────────

describe('CF-M8-02: five categories accept/reject per schema', () => {
  const validCategories: TeachCategory[] = [
    'correction', 'clarification', 'constraint', 'pattern', 'preference',
  ];

  for (const cat of validCategories) {
    it(`accepts category "${cat}"`, () => {
      expect(isValidCategory(cat)).toBe(true);
    });
  }

  it('rejects an unknown category string', () => {
    expect(isValidCategory('opinion')).toBe(false);
    expect(isValidCategory('custom')).toBe(false);
    expect(isValidCategory('')).toBe(false);
  });

  it('rejects null and non-string values', () => {
    expect(isValidCategory(null)).toBe(false);
    expect(isValidCategory(42)).toBe(false);
    expect(isValidCategory(undefined)).toBe(false);
  });

  it('TEACH_CATEGORIES set contains exactly five entries', () => {
    expect(TEACH_CATEGORIES.size).toBe(5);
  });

  it('validateTeachEntry returns no errors for a valid entry', () => {
    const entry = {
      id: randomUUID(),
      ts: Date.now(),
      category: 'constraint' as TeachCategory,
      content: 'Never import from desktop/ in src/',
      refs: [],
    };
    expect(validateTeachEntry(entry)).toHaveLength(0);
  });

  it('validateTeachEntry rejects missing id', () => {
    const entry = { ts: 1, category: 'pattern', content: 'x', refs: [] };
    const errors = validateTeachEntry(entry);
    expect(errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('validateTeachEntry rejects invalid category', () => {
    const entry = { id: 'a', ts: 1, category: 'mood', content: 'x', refs: [] };
    const errors = validateTeachEntry(entry);
    expect(errors.some((e) => e.includes('category'))).toBe(true);
  });

  it('validateTeachEntry rejects oversized content', () => {
    const entry = {
      id: 'a',
      ts: 1,
      category: 'correction',
      content: 'x'.repeat(TEACH_CONTENT_MAX_BYTES + 1),
      refs: [],
    };
    const errors = validateTeachEntry(entry);
    expect(errors.some((e) => e.includes('10 KiB'))).toBe(true);
  });

  it('appendTeachEntry rejects unknown category', () => {
    const path = tempLedger();
    const result = appendTeachEntry('opinion' as TeachCategory, 'some text', [], { ledgerPath: path });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid category/i);
  });
});

// ─── CF-M8-03: M3-trace linkage by ID ────────────────────────────────────────

describe('CF-M8-03: M3-trace linkage by ID', () => {
  it('getTeachEntryById resolves an entry appended with refs to trace IDs', () => {
    const path = tempLedger();
    const traceId = `trace-${randomUUID()}`;
    const result = appendTeachEntry(
      'constraint',
      'Never auto-merge without review',
      [traceId],
      { ledgerPath: path },
    );
    expect(result.ok).toBe(true);

    const found = getTeachEntryById(result.id!, path);
    expect(found).toBeDefined();
    expect(found!.id).toBe(result.id);
    expect(found!.refs).toContain(traceId);
  });

  it('getTeachEntryById returns undefined for unknown ID', () => {
    const path = tempLedger();
    appendTeachEntry('pattern', 'Some content', [], { ledgerPath: path });
    const found = getTeachEntryById('nonexistent-id', path);
    expect(found).toBeUndefined();
  });

  it('can look up entries by ID across a multi-entry ledger', () => {
    const path = tempLedger();
    const ids: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = appendTeachEntry('preference', `Content ${i}`, [], { ledgerPath: path });
      ids.push(r.id!);
    }
    // Lookup each in reverse
    for (const id of ids.reverse()) {
      const found = getTeachEntryById(id, path);
      expect(found).toBeDefined();
      expect(found!.id).toBe(id);
    }
  });
});

// ─── EC-07: 10 KiB bound ─────────────────────────────────────────────────────

describe('EC-07: 10 KiB content bound', () => {
  it('rejects content that exceeds 10 KiB', () => {
    const path = tempLedger();
    const longContent = 'x'.repeat(TEACH_CONTENT_MAX_BYTES + 1);
    const result = appendTeachEntry('clarification', longContent, [], { ledgerPath: path });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/10 KiB/);
  });

  it('accepts content exactly at the 10 KiB limit', () => {
    const path = tempLedger();
    const maxContent = 'x'.repeat(TEACH_CONTENT_MAX_BYTES);
    const result = appendTeachEntry('clarification', maxContent, [], { ledgerPath: path });
    expect(result.ok).toBe(true);
  });

  it('rejects empty content', () => {
    const path = tempLedger();
    const result = appendTeachEntry('pattern', '', [], { ledgerPath: path });
    expect(result.ok).toBe(false);
  });
});
