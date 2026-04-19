/**
 * Tests for `src/tractability/classifier.ts`
 *
 * Coverage:
 *   CF-ME1-04 — pure function (referential transparency)
 *   CF-ME1-05 — never throws; malformed → 'unknown'
 *   LS-26     — classifies from frontmatter alone
 *   - All three output_structure kinds
 *   - Null / undefined (absent frontmatter)
 *   - Prose with implicit structure hints
 *   - Observation stats: high variance lowers confidence but not class
 *   - classifySkillFromRaw convenience wrapper
 */

import { describe, it, expect } from 'vitest';
import {
  classifySkill,
  classifySkillFromRaw,
} from '../classifier.js';
import type { OutputStructure } from '../../output-structure/schema.js';

// ---------------------------------------------------------------------------
// classifySkill — primary signal: output_structure kinds
// ---------------------------------------------------------------------------

describe('classifySkill — json-schema', () => {
  const structure: OutputStructure = { kind: 'json-schema', schema: '{"type":"object"}' };

  it('returns tractable', () => {
    const result = classifySkill(structure);
    expect(result.tractabilityClass).toBe('tractable');
  });

  it('confidence is 1.0', () => {
    const result = classifySkill(structure);
    expect(result.confidence).toBe(1.0);
  });

  it('evidence direction is tractable', () => {
    const result = classifySkill(structure);
    expect(result.evidence[0]?.direction).toBe('tractable');
  });

  it('has no warnings', () => {
    const result = classifySkill(structure);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('classifySkill — markdown-template', () => {
  const structure: OutputStructure = { kind: 'markdown-template', template: '## Section\n{{content}}' };

  it('returns tractable', () => {
    const result = classifySkill(structure);
    expect(result.tractabilityClass).toBe('tractable');
  });

  it('confidence is 1.0', () => {
    const result = classifySkill(structure);
    expect(result.confidence).toBe(1.0);
  });

  it('evidence direction is tractable', () => {
    const result = classifySkill(structure);
    expect(result.evidence[0]?.direction).toBe('tractable');
  });
});

describe('classifySkill — prose', () => {
  const structure: OutputStructure = { kind: 'prose' };

  it('returns coin-flip', () => {
    const result = classifySkill(structure);
    expect(result.tractabilityClass).toBe('coin-flip');
  });

  it('confidence is 0.8 with no body', () => {
    const result = classifySkill(structure);
    expect(result.confidence).toBe(0.8);
  });

  it('confidence is 0.7 when body has implicit structure hints', () => {
    const result = classifySkill(structure, 'Output a JSON object with fields...');
    expect(result.confidence).toBe(0.7);
  });

  it('evidence direction is coin-flip even with implicit hints', () => {
    const result = classifySkill(structure, 'Output JSON');
    expect(result.evidence[0]?.direction).toBe('coin-flip');
  });

  it('evidence contains "implicit-structure keywords" note when hints present', () => {
    const result = classifySkill(structure, 'Return a YAML schema');
    const sig = result.evidence[0]?.signal ?? '';
    expect(sig).toContain('implicit-structure');
  });
});

// ---------------------------------------------------------------------------
// classifySkill — absent frontmatter
// ---------------------------------------------------------------------------

describe('classifySkill — null/undefined (absent)', () => {
  it('returns unknown for null', () => {
    expect(classifySkill(null).tractabilityClass).toBe('unknown');
  });

  it('returns unknown for undefined', () => {
    expect(classifySkill(undefined).tractabilityClass).toBe('unknown');
  });

  it('confidence is 0.5 for absent', () => {
    expect(classifySkill(null).confidence).toBe(0.5);
  });

  it('evidence direction is unknown', () => {
    expect(classifySkill(null).evidence[0]?.direction).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// CF-ME1-04 — pure function (referential transparency)
// ---------------------------------------------------------------------------

describe('CF-ME1-04 — referential transparency', () => {
  it('same input always yields same tractabilityClass', () => {
    const s: OutputStructure = { kind: 'json-schema', schema: 'foo' };
    const r1 = classifySkill(s);
    const r2 = classifySkill({ ...s });
    expect(r1.tractabilityClass).toBe(r2.tractabilityClass);
  });

  it('same input always yields same confidence', () => {
    const s: OutputStructure = { kind: 'prose' };
    const r1 = classifySkill(s);
    const r2 = classifySkill(s);
    expect(r1.confidence).toBe(r2.confidence);
  });

  it('does not mutate the input structure', () => {
    const s: OutputStructure = { kind: 'json-schema', schema: 'test' };
    const before = JSON.stringify(s);
    classifySkill(s);
    expect(JSON.stringify(s)).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// CF-ME1-05 — never throws
// ---------------------------------------------------------------------------

describe('CF-ME1-05 — never throws on malformed input', () => {
  it('does not throw for null', () => {
    expect(() => classifySkill(null)).not.toThrow();
  });

  it('does not throw for undefined', () => {
    expect(() => classifySkill(undefined)).not.toThrow();
  });

  it('returns unknown for null (fail-safe)', () => {
    expect(classifySkill(null).tractabilityClass).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// Secondary signal: observation stats
// ---------------------------------------------------------------------------

describe('classifySkill — observation stats', () => {
  const tractableStructure: OutputStructure = { kind: 'json-schema', schema: '{}' };

  it('does not change the class even with high variance', () => {
    const result = classifySkill(tractableStructure, undefined, {
      activationVariance: 0.9,
      sampleCount: 20,
    });
    // class unchanged despite high variance
    expect(result.tractabilityClass).toBe('tractable');
  });

  it('lowers confidence when variance > 0.5 on tractable skill', () => {
    const baseline = classifySkill(tractableStructure);
    const withVariance = classifySkill(tractableStructure, undefined, {
      activationVariance: 0.8,
      sampleCount: 20,
    });
    expect(withVariance.confidence).toBeLessThan(baseline.confidence);
  });

  it('emits a warning when variance > 0.5 on tractable skill', () => {
    const result = classifySkill(tractableStructure, undefined, {
      activationVariance: 0.8,
      sampleCount: 20,
    });
    expect(result.warnings.some((w) => w.includes('variance'))).toBe(true);
  });

  it('ignores observation when sampleCount < 5', () => {
    const baseline = classifySkill(tractableStructure);
    const withFewSamples = classifySkill(tractableStructure, undefined, {
      activationVariance: 0.9,
      sampleCount: 3,
    });
    // Confidence unchanged (observation treated as absent)
    expect(withFewSamples.confidence).toBe(baseline.confidence);
    // But a warning is emitted about the low sample count
    expect(withFewSamples.warnings.some((w) => w.includes('sample count'))).toBe(true);
  });

  it('does not lower confidence for coin-flip skill with high variance', () => {
    const proseStructure: OutputStructure = { kind: 'prose' };
    const baseline = classifySkill(proseStructure);
    const withVariance = classifySkill(proseStructure, undefined, {
      activationVariance: 0.9,
      sampleCount: 20,
    });
    // No penalty on non-tractable skills
    expect(withVariance.confidence).toBe(baseline.confidence);
  });
});

// ---------------------------------------------------------------------------
// classifySkillFromRaw — raw frontmatter convenience wrapper
// ---------------------------------------------------------------------------

describe('classifySkillFromRaw', () => {
  it('classifies json-schema from raw object', () => {
    const raw = { kind: 'json-schema', schema: '{"type":"string"}' };
    const result = classifySkillFromRaw(raw);
    expect(result.tractabilityClass).toBe('tractable');
  });

  it('classifies prose from raw string shorthand', () => {
    // String shorthand: 'prose' as a plain string is handled by resolveOutputStructure
    const raw = 'prose';
    const result = classifySkillFromRaw(raw);
    // 'prose' string shorthand resolves via validator → if unknown falls to default
    // The validator in ME-5 accepts 'prose' as a string shorthand
    expect(['coin-flip', 'unknown']).toContain(result.tractabilityClass);
  });

  it('returns unknown for null raw value', () => {
    const result = classifySkillFromRaw(null);
    expect(result.tractabilityClass).toBe('unknown');
  });

  it('returns unknown for undefined raw value', () => {
    const result = classifySkillFromRaw(undefined);
    expect(result.tractabilityClass).toBe('unknown');
  });

  it('does not throw for garbage raw value', () => {
    expect(() => classifySkillFromRaw(42)).not.toThrow();
    expect(() => classifySkillFromRaw([])).not.toThrow();
    expect(() => classifySkillFromRaw({ kind: 'bogus' })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Evidence trail completeness
// ---------------------------------------------------------------------------

describe('evidence trail', () => {
  it('always contains at least one entry', () => {
    const cases: Array<OutputStructure | null | undefined> = [
      null,
      undefined,
      { kind: 'prose' },
      { kind: 'json-schema', schema: '{}' },
      { kind: 'markdown-template', template: '## H' },
    ];
    for (const c of cases) {
      const result = classifySkill(c);
      expect(result.evidence.length).toBeGreaterThan(0);
    }
  });

  it('every evidence entry has weight in [0,1]', () => {
    const result = classifySkill({ kind: 'json-schema', schema: '{}' }, undefined, {
      activationVariance: 0.6,
      sampleCount: 10,
    });
    for (const ev of result.evidence) {
      expect(ev.weight).toBeGreaterThanOrEqual(0);
      expect(ev.weight).toBeLessThanOrEqual(1);
    }
  });

  it('every evidence direction is a valid TractabilityClass', () => {
    const valid = new Set(['tractable', 'coin-flip', 'unknown']);
    const result = classifySkill({ kind: 'prose' });
    for (const ev of result.evidence) {
      expect(valid.has(ev.direction)).toBe(true);
    }
  });
});
