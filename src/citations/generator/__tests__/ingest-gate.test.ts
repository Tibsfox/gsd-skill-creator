import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  evaluateSourceAudit,
  titleSimilarity,
  DEFAULT_GATE_THRESHOLDS,
  type SourceAuditInput,
} from '../ingest-gate.js';
import {
  readReviewQueue,
  appendReviewItems,
  verdictToReviewItem,
} from '../review-queue.js';
import type { AuditResult } from '../integrity-audit.js';

function cleanAudit(): AuditResult {
  return {
    total_citations_found: 4,
    resolved: 4,
    unresolved: 0,
    broken_links: [],
    orphaned_works: [],
    completeness_score: 1.0,
    recommendations: [],
  };
}

describe('evaluateSourceAudit: passing signals', () => {
  it('passes a healthy source (live ref, high confidence, matching title)', () => {
    const input: SourceAuditInput = {
      sourceId: '10.1000/ok',
      deadReference: false,
      resolutionConfidence: 0.95,
      claimedTitle: 'Attention Is All You Need',
      resolvedTitle: 'Attention Is All You Need',
      audit: cleanAudit(),
    };
    const v = evaluateSourceAudit(input);
    expect(v.action).toBe('pass');
    expect(v.reasons).toEqual([]);
  });

  it('passes when only a sourceId is known (no signals to fail on)', () => {
    const v = evaluateSourceAudit({ sourceId: 'x' });
    expect(v.action).toBe('pass');
  });
});

describe('evaluateSourceAudit: blocking signals', () => {
  it('blocks a dead reference', () => {
    const v = evaluateSourceAudit({ sourceId: 'dead', deadReference: true });
    expect(v.action).toBe('block');
    expect(v.blockedBy).toContain('dead-reference');
  });

  it('blocks a low-confidence resolution', () => {
    const v = evaluateSourceAudit({ sourceId: 'c', resolutionConfidence: 0.3 });
    expect(v.action).toBe('block');
    expect(v.blockedBy).toContain('low-confidence-resolution');
  });

  it('blocks a mismatched title', () => {
    const v = evaluateSourceAudit({
      sourceId: 't',
      resolutionConfidence: 0.9,
      claimedTitle: 'A Study of Reinforcement Learning',
      resolvedTitle: 'Photosynthesis in Marine Algae',
    });
    expect(v.action).toBe('block');
    expect(v.blockedBy).toContain('title-mismatch');
  });

  it('blocks when the folded-in audit has broken citations', () => {
    const audit = cleanAudit();
    audit.broken_links = ['DOI:10.9999/gone'];
    const v = evaluateSourceAudit({ sourceId: 'b', audit });
    expect(v.action).toBe('block');
    expect(v.blockedBy).toContain('broken-citations');
  });
});

describe('evaluateSourceAudit: flagging signals', () => {
  it('flags a marginal-confidence resolution (between block and flag bands)', () => {
    const v = evaluateSourceAudit({ sourceId: 'm', resolutionConfidence: 0.65 });
    expect(v.action).toBe('flag');
    expect(v.flaggedBy).toContain('marginal-confidence');
  });

  it('flags low audit completeness without blocking', () => {
    const audit = cleanAudit();
    audit.completeness_score = 0.6;
    const v = evaluateSourceAudit({ sourceId: 'lc', audit });
    expect(v.action).toBe('flag');
    expect(v.flaggedBy).toContain('low-completeness');
  });

  it('block outranks flag when both fire', () => {
    const audit = cleanAudit();
    audit.completeness_score = 0.6; // would flag
    const v = evaluateSourceAudit({ sourceId: 'both', deadReference: true, audit });
    expect(v.action).toBe('block');
    expect(v.reasons[0]).toBe('dead-reference');
  });
});

describe('titleSimilarity', () => {
  it('is ~1 for titles differing only in articles/case/punctuation', () => {
    expect(titleSimilarity('The Transformer, revisited', 'transformer revisited')).toBeGreaterThan(0.95);
  });
  it('is low for unrelated titles', () => {
    expect(titleSimilarity('Graph Neural Networks', 'A History of Rome')).toBeLessThan(DEFAULT_GATE_THRESHOLDS.titleSimilarity);
  });
});

describe('review queue', () => {
  let dir: string;
  let queuePath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-queue-'));
    queuePath = path.join(dir, 'nested', 'review-queue.json');
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns [] for a missing file', () => {
    expect(readReviewQueue(queuePath)).toEqual([]);
  });

  it('verdictToReviewItem returns null for a passing verdict', () => {
    const item = verdictToReviewItem(
      { sourceId: 'p', action: 'pass', reasons: [], blockedBy: [], flaggedBy: [] },
      'test',
    );
    expect(item).toBeNull();
  });

  it('appends items, creates parent dirs, and round-trips', () => {
    const v = evaluateSourceAudit({ sourceId: 'dead', deadReference: true });
    const item = verdictToReviewItem(v, 'sc-learn', { doi: '10.1/x' })!;
    const merged = appendReviewItems(queuePath, [item]);
    expect(merged).toHaveLength(1);
    expect(fs.existsSync(queuePath)).toBe(true);
    const read = readReviewQueue(queuePath);
    expect(read[0].sourceId).toBe('dead');
    expect(read[0].origin).toBe('sc-learn');
    expect(read[0].detail).toEqual({ doi: '10.1/x' });
  });

  it('dedups by sourceId::action across appends', () => {
    const item = (): ReturnType<typeof verdictToReviewItem> =>
      verdictToReviewItem(
        { sourceId: 's', action: 'block', reasons: ['dead-reference'], blockedBy: ['dead-reference'], flaggedBy: [] },
        'arxiv-bridge',
      );
    appendReviewItems(queuePath, [item()!]);
    appendReviewItems(queuePath, [item()!]);
    expect(readReviewQueue(queuePath)).toHaveLength(1);
  });
});
