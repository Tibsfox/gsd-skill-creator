/**
 * Cedar integrity engine — scribe, oracle, and sentinel.
 *
 * Maintains an append-only, content-addressed timeline.
 * Detects integrity violations and voice inconsistencies.
 *
 * Hash: SHA-256(timestamp|source|category|content)
 * ID: cedar-{hash.slice(0,12)}
 */

import { createHash } from 'crypto';
import type { MuseId } from './muse-schema-validator.js';
import type { TimelineEntry, TimelineQuery, IntegrityReport, SuspiciousPattern, TimelineCategory } from './cedar-timeline.js';

// Muse vocabulary lookup for voice consistency checking
const MUSE_VOCAB: Record<string, string[]> = {
  foxy: ['cartography', 'narrative', 'story', 'creative', 'direction', 'maps', 'cross-pollination', 'educational'],
  lex: ['execution', 'discipline', 'pipeline', 'verification', 'constraint', 'specification', 'protocol', 'rigor'],
  hemlock: ['quality', 'standard', 'benchmark', 'threshold', 'calibration', 'audit', 'compliance', 'governance'],
  sam: ['curiosity', 'exploration', 'hypothesis', 'experiment', 'discovery', 'wonder', 'question', 'prototype'],
  cedar: ['timeline', 'integrity', 'observation', 'record', 'pattern', 'continuity', 'memory', 'witness'],
  willow: ['welcome', 'guide', 'comfort', 'clarity', 'warmth', 'invitation', 'accessibility', 'kindness'],
  raven: ['pattern', 'echo', 'recurrence', 'structural', 'signal', 'noise', 'rhyming', 'detection'],
  hawk: ['position', 'relay', 'formation', 'coverage', 'gap', 'awareness', 'connection', 'flock'],
  owl: ['temporal', 'synchronization', 'sequence', 'cadence', 'momentum', 'clock', 'timing', 'schedule'],
};

function computeHash(timestamp: string, source: string, category: string, content: string): string {
  return createHash('sha256')
    .update(`${timestamp}|${source}|${category}|${content}`)
    .digest('hex');
}

export class CedarEngine {
  private entries: TimelineEntry[] = [];

  record(entry: { timestamp: string; source: string; category: TimelineCategory; content: string; references: string[] }): TimelineEntry {
    const hash = computeHash(entry.timestamp, entry.source, entry.category, entry.content);
    const id = `cedar-${hash.slice(0, 12)}`;
    const timelineEntry: TimelineEntry = {
      id,
      timestamp: entry.timestamp,
      source: entry.source,
      category: entry.category,
      content: entry.content,
      references: entry.references,
      hash,
    };
    this.entries.push(timelineEntry);
    return timelineEntry;
  }

  query(q: TimelineQuery): TimelineEntry[] {
    let results = [...this.entries];
    if (q.category) results = results.filter(e => e.category === q.category);
    if (q.source) results = results.filter(e => e.source === q.source);
    if (q.since) results = results.filter(e => e.timestamp >= q.since!);
    if (q.until) results = results.filter(e => e.timestamp <= q.until!);
    if (q.pattern) {
      const regex = new RegExp(q.pattern, 'i');
      results = results.filter(e => regex.test(e.content));
    }
    if (q.limit) results = results.slice(0, q.limit);
    return results;
  }

  verifyIntegrity(): IntegrityReport {
    const suspicious: SuspiciousPattern[] = [];
    let chainValid = true;

    for (const entry of this.entries) {
      const expected = computeHash(entry.timestamp, entry.source, entry.category, entry.content);
      if (entry.hash !== expected) {
        chainValid = false;
        suspicious.push({
          type: 'hash-mismatch',
          severity: 'alert',
          description: `Entry ${entry.id} hash mismatch: expected ${expected.slice(0, 12)}, got ${entry.hash.slice(0, 12)}`,
          affectedEntries: [entry.id],
        });
      }
    }

    return {
      totalEntries: this.entries.length,
      chainValid,
      brokenLinks: [],
      suspiciousPatterns: suspicious,
    };
  }

  checkVoiceConsistency(museId: MuseId, output: string): SuspiciousPattern | null {
    const expectedVocab = MUSE_VOCAB[museId] || [];
    const lower = output.toLowerCase();

    // Count matches for expected muse
    const expectedMatches = expectedVocab.filter(word => lower.includes(word)).length;

    // Count matches for other muses
    let maxOtherMatches = 0;
    let maxOtherMuse = '';
    for (const [id, vocab] of Object.entries(MUSE_VOCAB)) {
      if (id === museId) continue;
      const matches = vocab.filter(word => lower.includes(word)).length;
      if (matches > maxOtherMatches) {
        maxOtherMatches = matches;
        maxOtherMuse = id;
      }
    }

    if (maxOtherMatches > expectedMatches && maxOtherMatches >= 2) {
      return {
        type: 'vocabulary-drift',
        severity: 'warning',
        description: `Output uses ${maxOtherMuse}'s vocabulary (${maxOtherMatches} matches) more than ${museId}'s (${expectedMatches} matches)`,
        affectedEntries: [],
      };
    }

    return null;
  }

  allEntries(): TimelineEntry[] {
    return this.entries;
  }
}
