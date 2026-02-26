import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { harvestObservations } from '../../src/retro/observation-harvester.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('observation-harvester', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'retro-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads JSONL lines and extracts patterns', () => {
    const jsonlPath = join(tmpDir, 'sessions.jsonl');
    writeFileSync(
      jsonlPath,
      [
        JSON.stringify({ type: 'pattern_detected', name: 'wave-based-execution' }),
        JSON.stringify({ type: 'pattern_detected', name: 'tdd-red-green-cycle' }),
      ].join('\n'),
    );

    const result = harvestObservations(jsonlPath);

    expect(result.new_patterns).toContain('wave-based-execution');
    expect(result.new_patterns).toContain('tdd-red-green-cycle');
    expect(result.new_patterns).toHaveLength(2);
  });

  it('extracts skill suggestions', () => {
    const jsonlPath = join(tmpDir, 'sessions.jsonl');
    writeFileSync(
      jsonlPath,
      [
        JSON.stringify({ type: 'skill_suggested', name: 'auto-format-on-save' }),
        JSON.stringify({ type: 'skill_suggested', name: 'commit-message-style' }),
      ].join('\n'),
    );

    const result = harvestObservations(jsonlPath);

    expect(result.skill_suggestions).toContain('auto-format-on-save');
    expect(result.skill_suggestions).toContain('commit-message-style');
    expect(result.skill_suggestions).toHaveLength(2);
  });

  it('extracts promotion candidates', () => {
    const jsonlPath = join(tmpDir, 'sessions.jsonl');
    writeFileSync(
      jsonlPath,
      JSON.stringify({ type: 'promotion_candidate', name: 'lint-fix-pattern' }),
    );

    const result = harvestObservations(jsonlPath);

    expect(result.promotion_candidates).toContain('lint-fix-pattern');
    expect(result.promotion_candidates).toHaveLength(1);
  });

  it('deduplicates entries by name', () => {
    const jsonlPath = join(tmpDir, 'sessions.jsonl');
    writeFileSync(
      jsonlPath,
      [
        JSON.stringify({ type: 'pattern_detected', name: 'duplicate-pattern' }),
        JSON.stringify({ type: 'pattern_detected', name: 'duplicate-pattern' }),
        JSON.stringify({ type: 'pattern_detected', name: 'duplicate-pattern' }),
        JSON.stringify({ type: 'pattern_detected', name: 'unique-pattern' }),
      ].join('\n'),
    );

    const result = harvestObservations(jsonlPath);

    expect(result.new_patterns).toHaveLength(2);
    expect(result.new_patterns).toContain('duplicate-pattern');
    expect(result.new_patterns).toContain('unique-pattern');
  });

  it('handles missing sessions.jsonl gracefully', () => {
    const nonExistentPath = join(tmpDir, 'does-not-exist.jsonl');

    const result = harvestObservations(nonExistentPath);

    expect(result.new_patterns).toHaveLength(0);
    expect(result.skill_suggestions).toHaveLength(0);
    expect(result.promotion_candidates).toHaveLength(0);
  });

  it('skips malformed JSONL lines', () => {
    const jsonlPath = join(tmpDir, 'sessions.jsonl');
    writeFileSync(
      jsonlPath,
      [
        JSON.stringify({ type: 'pattern_detected', name: 'valid-pattern' }),
        'this is not json {{{',
        '',
        '{"broken": true',
        JSON.stringify({ type: 'skill_suggested', name: 'valid-suggestion' }),
      ].join('\n'),
    );

    const result = harvestObservations(jsonlPath);

    expect(result.new_patterns).toHaveLength(1);
    expect(result.new_patterns).toContain('valid-pattern');
    expect(result.skill_suggestions).toHaveLength(1);
    expect(result.skill_suggestions).toContain('valid-suggestion');
  });
});
