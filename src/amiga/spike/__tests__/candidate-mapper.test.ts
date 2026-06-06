/**
 * Locks the AMIGA-candidate -> SC-suggestion mapping and the SuggestionStore
 * round-trip. The store round-trip writes to an OS temp dir (never the real
 * .planning/patterns) so it stays deterministic and CI-safe on all OS legs.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { toSuggestionCandidate, toSuggestionCandidates, suggestionId } from '../candidate-mapper.js';
import type { SkillCandidate as AmigaSkillCandidate } from '../../meta-mission/skill-candidate-detector.js';
import { SuggestionStore } from '../../../detection/suggestion-store.js';

function amigaCandidate(overrides: Partial<AmigaSkillCandidate> = {}): AmigaSkillCandidate {
  return {
    name: 'edit-to-bash-cycle',
    description: 'Repeating sequence: EDIT->BASH detected 152 times across the mission',
    trigger_pattern: 'EDIT->BASH',
    confidence: 0.9,
    evidence: ['ev-1', 'ev-2', 'ev-3'],
    detection_method: 'sequence_repetition',
    ...overrides,
  };
}

const ctx = {
  sessionIds: ['e3099ea9-05ea-4219-b8b4-8cf80e793b19'],
  firstSeen: Date.parse('2026-05-28T10:00:00.000Z'),
  lastSeen: Date.parse('2026-05-28T11:00:00.000Z'),
  coOccurringTools: ['Bash', 'Edit', 'Read'],
};

describe('candidate-mapper (AMIGA -> SC suggestion)', () => {
  it('produces a deterministic, dedupe-friendly id from the candidate name', () => {
    expect(suggestionId(amigaCandidate())).toBe('amiga-edit-to-bash-cycle');
    // stable across calls
    expect(suggestionId(amigaCandidate())).toBe(suggestionId(amigaCandidate()));
  });

  it('maps every field onto the SC SkillCandidate shape', () => {
    const sc = toSuggestionCandidate(amigaCandidate(), ctx);
    expect(sc.id).toBe('amiga-edit-to-bash-cycle');
    expect(sc.type).toBe('workflow');
    expect(sc.pattern).toBe('EDIT->BASH');
    expect(sc.occurrences).toBe(3); // = evidence.length
    expect(sc.confidence).toBe(0.9);
    expect(sc.suggestedName).toBe('edit-to-bash-cycle');
    expect(sc.suggestedDescription).toContain('[source: AMIGA sequence_repetition]');
    expect(sc.evidence.sessionIds).toEqual(ctx.sessionIds);
    expect(sc.evidence.coOccurringTools).toEqual(['Bash', 'Edit', 'Read']);
    expect(sc.evidence.firstSeen).toBe(ctx.firstSeen);
    expect(sc.evidence.lastSeen).toBe(ctx.lastSeen);
    expect(sc.evidence.coOccurringFiles).toEqual([]);
  });

  it('caps sessionIds/tools/files at 10 entries', () => {
    const many = Array.from({ length: 25 }, (_, i) => `s-${i}`);
    const sc = toSuggestionCandidate(amigaCandidate(), {
      ...ctx,
      sessionIds: many,
      coOccurringTools: many,
      coOccurringFiles: many,
    });
    expect(sc.evidence.sessionIds).toHaveLength(10);
    expect(sc.evidence.coOccurringTools).toHaveLength(10);
    expect(sc.evidence.coOccurringFiles).toHaveLength(10);
  });

  it('maps a batch preserving order', () => {
    const out = toSuggestionCandidates(
      [amigaCandidate({ name: 'a-cycle' }), amigaCandidate({ name: 'b-cycle' })],
      ctx,
    );
    expect(out.map((c) => c.id)).toEqual(['amiga-a-cycle', 'amiga-b-cycle']);
  });

  it('lands in SuggestionStore as pending and dedupes on re-emit (idempotent)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'amiga-spike-'));
    try {
      const store = new SuggestionStore(dir);
      const mapped = toSuggestionCandidates(
        [amigaCandidate({ name: 'multi-contributor-handoff', detection_method: 'attribution_cluster' })],
        ctx,
      );

      const firstAdd = await store.addCandidates(mapped);
      expect(firstAdd).toHaveLength(1);

      const pending = await store.getPending();
      expect(pending.some((s) => s.candidate.id === 'amiga-multi-contributor-handoff')).toBe(true);
      expect(pending[0].state).toBe('pending');

      // Re-emitting the same candidate adds nothing (dedupe by id).
      const secondAdd = await store.addCandidates(mapped);
      expect(secondAdd).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
