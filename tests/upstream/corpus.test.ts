import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChangeType, Severity } from '../../src/upstream/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CorpusEntry {
  id: string;
  channel: string;
  diff_summary: string;
  raw_content: string;
  expected_type: ChangeType;
  expected_severity: Severity;
}

const corpusPath = resolve(__dirname, '../../src/upstream/test-data/corpus.json');
const corpus: CorpusEntry[] = JSON.parse(readFileSync(corpusPath, 'utf-8'));

/* ------------------------------------------------------------------ */
/*  Corpus validation                                                  */
/* ------------------------------------------------------------------ */

describe('Upstream Change Test Corpus', () => {
  it('corpus file is valid JSON array', () => {
    expect(Array.isArray(corpus)).toBe(true);
  });

  it('contains exactly 50 entries', () => {
    expect(corpus).toHaveLength(50);
  });

  it('each entry has required fields: id, channel, diff_summary, expected_type, expected_severity', () => {
    for (const entry of corpus) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('channel');
      expect(entry).toHaveProperty('diff_summary');
      expect(entry).toHaveProperty('raw_content');
      expect(entry).toHaveProperty('expected_type');
      expect(entry).toHaveProperty('expected_severity');
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.channel).toBe('string');
      expect(typeof entry.diff_summary).toBe('string');
      expect(typeof entry.raw_content).toBe('string');
      expect(typeof entry.expected_type).toBe('string');
      expect(typeof entry.expected_severity).toBe('string');
    }
  });

  it('all 6 change types represented (minimum 5 of each type)', () => {
    const types: ChangeType[] = ['breaking', 'deprecation', 'enhancement', 'security', 'optimization', 'informational'];
    const counts = new Map<string, number>();

    for (const entry of corpus) {
      counts.set(entry.expected_type, (counts.get(entry.expected_type) ?? 0) + 1);
    }

    for (const type of types) {
      const count = counts.get(type) ?? 0;
      expect(count, `expected at least 5 entries of type "${type}", got ${count}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('all 4 severity levels represented', () => {
    const severities: Severity[] = ['P0', 'P1', 'P2', 'P3'];
    const found = new Set(corpus.map((e) => e.expected_severity));

    for (const sev of severities) {
      expect(found.has(sev), `expected severity "${sev}" to be present`).toBe(true);
    }
  });

  it('entries cover all 11 channels (at least 1 per channel)', () => {
    const expectedChannels = [
      'anthropic-docs',
      'anthropic-blog',
      'anthropic-changelog',
      'claude-code-releases',
      'claude-code-issues',
      'anthropic-sdk-python',
      'anthropic-sdk-ts',
      'mcp-spec',
      'mcp-servers',
      'anthropic-cookbook',
      'anthropic-status',
    ];

    const found = new Set(corpus.map((e) => e.channel));

    for (const channel of expectedChannels) {
      expect(found.has(channel), `expected channel "${channel}" to be present`).toBe(true);
    }
  });
});
