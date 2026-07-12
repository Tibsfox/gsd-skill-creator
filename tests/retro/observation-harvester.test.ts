import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { harvestObservations } from '../../src/retro/observation-harvester.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * The harvester reads the REAL observe.mjs event shape:
 *   { t, kind, label, payload? }
 * (Earlier it expected a phantom { type, name } and always returned empty.)
 */
describe('observation-harvester (observe.mjs event shape)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'retro-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function write(lines: unknown[]): string {
    const p = join(tmpDir, 'current.jsonl');
    writeFileSync(p, lines.map((l) => JSON.stringify(l)).join('\n'));
    return p;
  }

  it('folds friction / win / decision kinds into new_patterns', () => {
    const p = write([
      { t: '2026-07-12T10:00:00Z', kind: 'friction', label: 'read-before-edit', payload: { count: 3 } },
      { t: '2026-07-12T10:05:00Z', kind: 'win', label: 'idempotent-pipeline' },
      { t: '2026-07-12T10:10:00Z', kind: 'decision', label: 'defer-live-storage' },
    ]);

    const result = harvestObservations(p);

    expect(result.new_patterns).toEqual(
      expect.arrayContaining(['read-before-edit', 'idempotent-pipeline', 'defer-live-storage']),
    );
    expect(result.new_patterns).toHaveLength(3);
  });

  it('maps gap kind to skill_suggestions', () => {
    const p = write([
      { t: '2026-07-12T10:00:00Z', kind: 'gap', label: 'batch-rewrite tool' },
      { t: '2026-07-12T10:05:00Z', kind: 'gap', label: 'retro driver' },
    ]);

    const result = harvestObservations(p);

    expect(result.skill_suggestions).toEqual(
      expect.arrayContaining(['batch-rewrite tool', 'retro driver']),
    );
    expect(result.skill_suggestions).toHaveLength(2);
  });

  it('maps promotion kind to promotion_candidates', () => {
    const p = write([{ t: '2026-07-12T10:00:00Z', kind: 'promotion', label: 'lint-fix-pattern' }]);

    const result = harvestObservations(p);

    expect(result.promotion_candidates).toEqual(['lint-fix-pattern']);
  });

  it('ignores informational kinds (tool-use, checkpoint, tokens, correction)', () => {
    const p = write([
      { t: '2026-07-12T10:00:00Z', kind: 'tool-use', label: 'better-sqlite3 installed' },
      { t: '2026-07-12T10:05:00Z', kind: 'checkpoint', label: 'phase-1 done' },
      { t: '2026-07-12T10:10:00Z', kind: 'tokens', label: 'pass-2', payload: { total: 48200 } },
      { t: '2026-07-12T10:15:00Z', kind: 'correction', label: 'no Co-Authored-By' },
    ]);

    const result = harvestObservations(p);

    expect(result.new_patterns).toHaveLength(0);
    expect(result.skill_suggestions).toHaveLength(0);
    expect(result.promotion_candidates).toHaveLength(0);
  });

  it('deduplicates by label', () => {
    const p = write([
      { t: '2026-07-12T10:00:00Z', kind: 'friction', label: 'dupe' },
      { t: '2026-07-12T10:01:00Z', kind: 'friction', label: 'dupe' },
      { t: '2026-07-12T10:02:00Z', kind: 'friction', label: 'unique' },
    ]);

    const result = harvestObservations(p);

    expect(result.new_patterns).toHaveLength(2);
    expect(result.new_patterns).toEqual(expect.arrayContaining(['dupe', 'unique']));
  });

  it('handles a missing log gracefully', () => {
    const result = harvestObservations(join(tmpDir, 'nope.jsonl'));
    expect(result.new_patterns).toHaveLength(0);
    expect(result.skill_suggestions).toHaveLength(0);
    expect(result.promotion_candidates).toHaveLength(0);
  });

  it('skips malformed lines and events missing kind/label', () => {
    const p = join(tmpDir, 'current.jsonl');
    writeFileSync(
      p,
      [
        JSON.stringify({ t: '2026-07-12T10:00:00Z', kind: 'gap', label: 'valid-gap' }),
        'not json {{{',
        '',
        '{"kind":"gap"', // truncated
        JSON.stringify({ kind: 'friction' }), // no label
        JSON.stringify({ label: 'orphan' }), // no kind
        JSON.stringify({ t: '2026-07-12T10:10:00Z', kind: 'win', label: 'valid-win' }),
      ].join('\n'),
    );

    const result = harvestObservations(p);

    expect(result.skill_suggestions).toEqual(['valid-gap']);
    expect(result.new_patterns).toEqual(['valid-win']);
  });
});
