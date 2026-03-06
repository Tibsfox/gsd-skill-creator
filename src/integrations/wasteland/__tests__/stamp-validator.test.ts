/**
 * Stamp Validator Tests
 *
 * Tests the automated completion validation pipeline:
 * evidence parsing, valence scoring, severity classification,
 * confidence scoring, stamp generation, SQL output, and full pipeline.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  parseEvidence,
  scoreQuality,
  scoreReliability,
  scoreCreativity,
  computeValence,
  computeConfidence,
  classifySeverity,
  generateMessage,
  parseTags,
  buildStamp,
  toSQL,
  toSQLScript,
  validate,
  type CompletionRecord,
  type WantedItem,
  type EvidenceSignals,
  type ValidationDataProvider,
  type ValidatorConfig,
} from '../stamp-validator.js';

// ============================================================================
// Evidence Parser Tests
// ============================================================================

describe('parseEvidence', () => {
  it('returns empty signals for null evidence', () => {
    const signals = parseEvidence(null);
    expect(signals.hasFileReference).toBe(false);
    expect(signals.hasLineCount).toBe(false);
    expect(signals.fileCount).toBe(0);
    expect(signals.lineCount).toBe(0);
  });

  it('returns empty signals for empty string', () => {
    const signals = parseEvidence('');
    expect(signals.hasFileReference).toBe(false);
    expect(signals.descriptionLength).toBe(0);
  });

  it('extracts file references', () => {
    const signals = parseEvidence('docs/gas-city-role-format-spec.md — 886-line spec');
    expect(signals.hasFileReference).toBe(true);
    expect(signals.fileCount).toBeGreaterThanOrEqual(1);
    expect(signals.specificArtifacts).toContain('docs/gas-city-role-format-spec.md');
  });

  it('extracts line counts', () => {
    const signals = parseEvidence('docs/mvr-protocol-spec.md — 1013-line public protocol spec');
    expect(signals.hasLineCount).toBe(true);
    expect(signals.lineCount).toBe(1013);
  });

  it('sums multiple line counts', () => {
    const signals = parseEvidence('file-a.ts — 200-line module. file-b.ts — 300-line tests.');
    expect(signals.lineCount).toBe(500);
  });

  it('extracts PR links', () => {
    const signals = parseEvidence('https://github.com/anthropics/beads/pull/1805');
    expect(signals.hasPRLink).toBe(true);
    expect(signals.specificArtifacts).toContain('https://github.com/anthropics/beads/pull/1805');
  });

  it('detects URLs', () => {
    const signals = parseEvidence('See https://example.com/docs for details');
    expect(signals.hasURL).toBe(true);
  });

  it('measures description quality', () => {
    const signals = parseEvidence(
      'docs/spider-protocol-fraud-detection.md — 6 threats, 5 anomaly indicators, per-threat SQL, 4-level response framework.'
    );
    expect(signals.hasDescription).toBe(true);
    expect(signals.descriptionLength).toBeGreaterThan(20);
  });

  it('handles real wasteland evidence format', () => {
    const evidence = 'docs/gas-city-role-format-spec.md — 886-line spec. EBNF grammar, Zod schema, activation scoring, composability, migration guides from CrewAI/AutoGen/LangGraph.';
    const signals = parseEvidence(evidence);
    expect(signals.hasFileReference).toBe(true);
    expect(signals.hasLineCount).toBe(true);
    expect(signals.lineCount).toBe(886);
    expect(signals.hasDescription).toBe(true);
  });
});

// ============================================================================
// Valence Scorer Tests
// ============================================================================

describe('scoreQuality', () => {
  it('returns baseline 3 for minimal signals', () => {
    const signals = parseEvidence('Some basic work done');
    expect(scoreQuality(signals, 'medium')).toBeGreaterThanOrEqual(2);
    expect(scoreQuality(signals, 'medium')).toBeLessThanOrEqual(4);
  });

  it('scores higher for file refs with line counts', () => {
    const rich = parseEvidence('docs/spec.md — 886-line spec with EBNF grammar and Zod schema');
    const bare = parseEvidence('did some work');
    expect(scoreQuality(rich, 'large')).toBeGreaterThan(scoreQuality(bare, 'large'));
  });

  it('scores higher for PR links', () => {
    const withPR = parseEvidence('https://github.com/org/repo/pull/42');
    const noPR = parseEvidence('fixed it');
    expect(scoreQuality(withPR, 'medium')).toBeGreaterThan(scoreQuality(noPR, 'medium'));
  });

  it('returns value between 1 and 5', () => {
    const signals = parseEvidence('docs/huge.md — 5000-line spec with everything');
    const score = scoreQuality(signals, 'trivial');
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(5);
  });
});

describe('scoreReliability', () => {
  it('returns higher score for multiple artifacts', () => {
    const rich = parseEvidence('docs/a.md — 200-line file. docs/b.md — 300-line tests. https://github.com/org/repo/pull/1');
    const bare = parseEvidence('did it');
    expect(scoreReliability(rich)).toBeGreaterThan(scoreReliability(bare));
  });

  it('penalizes very thin evidence', () => {
    const thin = parseEvidence('ok');
    expect(scoreReliability(thin)).toBeLessThan(3);
  });
});

describe('scoreCreativity', () => {
  it('gives bonus for design/research types', () => {
    const signals = parseEvidence('docs/design.md — 400-line design document with architecture');
    expect(scoreCreativity(signals, 'design')).toBeGreaterThan(scoreCreativity(signals, 'bug'));
  });

  it('gives bonus for community work', () => {
    const signals = parseEvidence('docs/campfire.md — discussion document with positions');
    expect(scoreCreativity(signals, 'community')).toBeGreaterThan(scoreCreativity(signals, 'feature'));
  });
});

describe('computeValence', () => {
  it('returns all three dimensions', () => {
    const signals = parseEvidence('docs/spec.md — 500-line spec');
    const valence = computeValence(signals, 'large', 'design');
    expect(valence).toHaveProperty('quality');
    expect(valence).toHaveProperty('reliability');
    expect(valence).toHaveProperty('creativity');
  });

  it('all dimensions are in 1-5 range', () => {
    const signals = parseEvidence('docs/spec.md — 2000-line everything');
    const valence = computeValence(signals, 'epic', 'research');
    expect(valence.quality).toBeGreaterThanOrEqual(1);
    expect(valence.quality).toBeLessThanOrEqual(5);
    expect(valence.reliability).toBeGreaterThanOrEqual(1);
    expect(valence.reliability).toBeLessThanOrEqual(5);
    expect(valence.creativity).toBeGreaterThanOrEqual(1);
    expect(valence.creativity).toBeLessThanOrEqual(5);
  });
});

// ============================================================================
// Confidence Tests
// ============================================================================

describe('computeConfidence', () => {
  it('returns higher confidence for verifiable evidence', () => {
    const verifiable = parseEvidence('https://github.com/org/repo/pull/42 — docs/spec.md — 500-line spec');
    const vague = parseEvidence('did some work');
    expect(computeConfidence(verifiable)).toBeGreaterThan(computeConfidence(vague));
  });

  it('returns value between 0.1 and 0.95', () => {
    const signals = parseEvidence('everything verifiable');
    const confidence = computeConfidence(signals);
    expect(confidence).toBeGreaterThanOrEqual(0.1);
    expect(confidence).toBeLessThanOrEqual(0.95);
  });

  it('caps confidence for unverifiable evidence', () => {
    const signals = parseEvidence('I definitely did this amazing work trust me');
    expect(computeConfidence(signals)).toBeLessThanOrEqual(0.6);
  });
});

// ============================================================================
// Severity Tests
// ============================================================================

describe('classifySeverity', () => {
  it('classifies trivial work as leaf', () => {
    const signals = parseEvidence('small fix');
    expect(classifySeverity('trivial', signals)).toBe('leaf');
  });

  it('classifies small work as leaf', () => {
    const signals = parseEvidence('docs/fix.md — 50-line patch');
    expect(classifySeverity('small', signals)).toBe('leaf');
  });

  it('classifies medium work with evidence as branch', () => {
    const signals = parseEvidence('docs/feature.md — 400-line implementation with tests');
    expect(classifySeverity('medium', signals)).toBe('branch');
  });

  it('classifies epic work with strong evidence as root', () => {
    const signals = parseEvidence('docs/protocol.md — 1013-line spec. docs/impl.ts — 800-line implementation');
    expect(classifySeverity('epic', signals)).toBe('root');
  });

  it('classifies large work with very high line count as root', () => {
    const signals = parseEvidence('docs/massive.md — 900-line document with full coverage');
    expect(classifySeverity('large', signals)).toBe('root');
  });
});

// ============================================================================
// Stamp Generation Tests
// ============================================================================

describe('parseTags', () => {
  it('parses JSON array string', () => {
    expect(parseTags('["Go","automation"]')).toEqual(['Go', 'automation']);
  });

  it('returns empty array for null', () => {
    expect(parseTags(null)).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseTags('not json')).toEqual([]);
  });
});

describe('generateMessage', () => {
  it('includes wanted title', () => {
    const signals = parseEvidence('docs/spec.md — 500-line spec');
    const valence = { quality: 4, reliability: 4, creativity: 3.5 };
    const msg = generateMessage('Design Gas City role format', signals, valence);
    expect(msg).toContain('Design Gas City role format');
  });

  it('includes line count when available', () => {
    const signals = parseEvidence('docs/spec.md — 500-line spec');
    const valence = { quality: 4, reliability: 4, creativity: 3.5 };
    const msg = generateMessage('Some work', signals, valence);
    expect(msg).toContain('500 lines');
  });

  it('uses appropriate qualifier for high scores', () => {
    const signals = parseEvidence('docs/spec.md — 500-line spec');
    const valence = { quality: 5, reliability: 5, creativity: 5 };
    const msg = generateMessage('Amazing work', signals, valence);
    expect(msg).toMatch(/Exceptional|Strong/);
  });
});

describe('buildStamp', () => {
  const completion: CompletionRecord = {
    id: 'c-test001',
    wanted_id: 'w-test001',
    completed_by: 'MapleFoxyBells',
    evidence: 'docs/gas-city-role-format-spec.md — 886-line spec. EBNF grammar, Zod schema.',
    completed_at: '2026-03-01T00:00:00Z',
  };

  const wanted: WantedItem = {
    id: 'w-test001',
    title: 'Design Gas City declarative role format',
    description: 'Design the role format for Gas City',
    type: 'design',
    effort_level: 'large',
    tags: '["design","roles","YAML"]',
    posted_by: 'steveyegge',
    status: 'in_review',
  };

  it('produces a valid stamp recommendation', () => {
    const stamp = buildStamp(completion, wanted, 'gastown-ci', null);
    expect(stamp.id).toMatch(/^s-[0-9a-f]{10}$/);
    expect(stamp.author).toBe('gastown-ci');
    expect(stamp.subject).toBe('MapleFoxyBells');
    expect(stamp.context_id).toBe('c-test001');
    expect(stamp.context_type).toBe('completion');
    expect(stamp.wantedId).toBe('w-test001');
    expect(stamp.skill_tags).toEqual(['design', 'roles', 'YAML']);
  });

  it('sets valence in 1-5 range', () => {
    const stamp = buildStamp(completion, wanted, 'gastown-ci', null);
    expect(stamp.valence.quality).toBeGreaterThanOrEqual(1);
    expect(stamp.valence.quality).toBeLessThanOrEqual(5);
    expect(stamp.valence.reliability).toBeGreaterThanOrEqual(1);
    expect(stamp.valence.reliability).toBeLessThanOrEqual(5);
    expect(stamp.valence.creativity).toBeGreaterThanOrEqual(1);
    expect(stamp.valence.creativity).toBeLessThanOrEqual(5);
  });

  it('classifies large design work as branch or root', () => {
    const stamp = buildStamp(completion, wanted, 'gastown-ci', null);
    expect(['branch', 'root']).toContain(stamp.severity);
  });

  it('passes through prev_stamp_hash', () => {
    const stamp = buildStamp(completion, wanted, 'gastown-ci', 'abc123');
    expect(stamp.prev_stamp_hash).toBe('abc123');
  });
});

// ============================================================================
// SQL Generation Tests
// ============================================================================

describe('toSQL', () => {
  it('generates INSERT for stamps table', () => {
    const stamp = buildStamp(
      { id: 'c-001', wanted_id: 'w-001', completed_by: 'alice', evidence: 'docs/spec.md — 100-line spec', completed_at: null },
      { id: 'w-001', title: 'Test work', description: null, type: 'docs', effort_level: 'small', tags: '["docs"]', posted_by: 'bob', status: 'in_review' },
      'validator',
      null,
    );
    const sql = toSQL(stamp);
    expect(sql).toContain('INSERT INTO stamps');
    expect(sql).toContain(stamp.id);
    expect(sql).toContain("'validator'");
    expect(sql).toContain("'alice'");
  });

  it('generates UPDATE for completions', () => {
    const stamp = buildStamp(
      { id: 'c-002', wanted_id: 'w-002', completed_by: 'alice', evidence: 'docs/spec.md — 100-line spec', completed_at: null },
      { id: 'w-002', title: 'More work', description: null, type: 'feature', effort_level: 'medium', tags: null, posted_by: 'bob', status: 'in_review' },
      'validator',
      null,
    );
    const sql = toSQL(stamp);
    expect(sql).toContain('UPDATE completions SET validated_by');
    expect(sql).toContain("WHERE id = 'c-002'");
  });

  it('generates UPDATE for wanted status', () => {
    const stamp = buildStamp(
      { id: 'c-003', wanted_id: 'w-003', completed_by: 'alice', evidence: 'docs/spec.md — 100-line spec', completed_at: null },
      { id: 'w-003', title: 'Work', description: null, type: 'docs', effort_level: 'medium', tags: null, posted_by: 'bob', status: 'in_review' },
      'validator',
      null,
    );
    const sql = toSQL(stamp);
    expect(sql).toContain("UPDATE wanted SET status = 'completed'");
    expect(sql).toContain("WHERE id = 'w-003'");
  });

  it('handles NULL prev_stamp_hash', () => {
    const stamp = buildStamp(
      { id: 'c-004', wanted_id: 'w-004', completed_by: 'alice', evidence: 'docs/spec.md — 100-line spec', completed_at: null },
      { id: 'w-004', title: 'Work', description: null, type: 'docs', effort_level: 'medium', tags: null, posted_by: 'bob', status: 'in_review' },
      'validator',
      null,
    );
    const sql = toSQL(stamp);
    expect(sql).toContain('NULL, NOW());');
  });

  it('escapes single quotes in evidence-derived text', () => {
    const stamp = buildStamp(
      { id: 'c-005', wanted_id: 'w-005', completed_by: "o'malley", evidence: "it's a file.md — 100-line spec", completed_at: null },
      { id: 'w-005', title: "It's done", description: null, type: 'docs', effort_level: 'medium', tags: null, posted_by: 'bob', status: 'in_review' },
      'validator',
      null,
    );
    const sql = toSQL(stamp);
    expect(sql).toContain("o''malley");
    expect(sql).toContain("It''s done");
  });
});

describe('toSQLScript', () => {
  it('generates header with counts', () => {
    const result = {
      stamps: [],
      skipped: [{ completionId: 'c-1', reason: 'test' }],
      errors: [],
    };
    const script = toSQLScript(result);
    expect(script).toContain('Stamps: 0');
    expect(script).toContain('Skipped: 1');
  });
});

// ============================================================================
// Pipeline Integration Tests
// ============================================================================

describe('validate (pipeline)', () => {
  const makeProvider = (
    completions: Array<CompletionRecord & { wanted: WantedItem }>,
    lastHash: string | null = null,
  ): ValidationDataProvider => ({
    getUnvalidatedCompletions: vi.fn().mockResolvedValue(completions),
    getLastStampHash: vi.fn().mockResolvedValue(lastHash),
  });

  const defaultConfig: ValidatorConfig = {
    validatorHandle: 'gastown-ci',
    minConfidenceThreshold: 0.3,
    dryRun: true,
  };

  const sampleCompletion: CompletionRecord & { wanted: WantedItem } = {
    id: 'c-01541be343',
    wanted_id: 'w-gc-001',
    completed_by: 'MapleFoxyBells',
    evidence: 'docs/gas-city-role-format-spec.md — 886-line spec. EBNF grammar, Zod schema.',
    completed_at: '2026-03-01T00:00:00Z',
    wanted: {
      id: 'w-gc-001',
      title: 'Design Gas City declarative role format',
      description: 'Design the role format',
      type: 'design',
      effort_level: 'large',
      tags: '["design","roles","YAML"]',
      posted_by: 'steveyegge',
      status: 'in_review',
    },
  };

  it('produces stamps for valid completions', async () => {
    const provider = makeProvider([sampleCompletion]);
    const result = await validate(provider, defaultConfig);
    expect(result.stamps).toHaveLength(1);
    expect(result.stamps[0].author).toBe('gastown-ci');
    expect(result.stamps[0].subject).toBe('MapleFoxyBells');
  });

  it('enforces Yearbook Rule', async () => {
    const selfCompletion = { ...sampleCompletion, completed_by: 'gastown-ci' };
    const provider = makeProvider([selfCompletion]);
    const result = await validate(provider, defaultConfig);
    expect(result.stamps).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toContain('Yearbook Rule');
  });

  it('skips completions with no evidence', async () => {
    const noEvidence = { ...sampleCompletion, evidence: null };
    const provider = makeProvider([noEvidence]);
    const result = await validate(provider, defaultConfig);
    expect(result.stamps).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toContain('No evidence');
  });

  it('skips completions below confidence threshold', async () => {
    const vague = { ...sampleCompletion, evidence: 'did it' };
    const highThreshold: ValidatorConfig = { ...defaultConfig, minConfidenceThreshold: 0.9 };
    const provider = makeProvider([vague]);
    const result = await validate(provider, highThreshold);
    expect(result.stamps).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toContain('Confidence');
  });

  it('handles provider errors gracefully', async () => {
    const provider: ValidationDataProvider = {
      getUnvalidatedCompletions: vi.fn().mockRejectedValue(new Error('network error')),
      getLastStampHash: vi.fn().mockResolvedValue(null),
    };
    const result = await validate(provider, defaultConfig);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('network error');
  });

  it('processes multiple completions', async () => {
    const second: CompletionRecord & { wanted: WantedItem } = {
      id: 'c-06b3609d31',
      wanted_id: 'w-hop-003',
      completed_by: 'MapleFoxyBells',
      evidence: 'docs/spider-protocol-fraud-detection.md — 6 threats, 5 anomaly indicators, per-threat SQL.',
      completed_at: '2026-03-01T01:00:00Z',
      wanted: {
        id: 'w-hop-003',
        title: 'Design Spider Protocol fraud detection queries',
        description: 'Design fraud detection',
        type: 'feature',
        effort_level: 'large',
        tags: '["SQL","security","fraud-detection"]',
        posted_by: 'steveyegge',
        status: 'in_review',
      },
    };
    const provider = makeProvider([sampleCompletion, second]);
    const result = await validate(provider, defaultConfig);
    expect(result.stamps).toHaveLength(2);
  });

  it('links passbook chain via prev_stamp_hash', async () => {
    const provider = makeProvider([sampleCompletion], 'prev-hash-abc');
    const result = await validate(provider, defaultConfig);
    expect(result.stamps[0].prev_stamp_hash).toBe('prev-hash-abc');
  });

  it('full pipeline produces valid SQL', async () => {
    const provider = makeProvider([sampleCompletion]);
    const result = await validate(provider, defaultConfig);
    const sql = toSQLScript(result);
    expect(sql).toContain('INSERT INTO stamps');
    expect(sql).toContain('UPDATE completions');
    expect(sql).toContain('UPDATE wanted');
    expect(sql).toContain('MapleFoxyBells');
    expect(sql).toContain('gastown-ci');
  });
});
