/**
 * Transcript Compactor Tests
 *
 * Backlog 999.2: convoy-level summarization checkpoints.
 * Tests pure classification, compaction, and persistence functions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  classifyLine,
  estimateTokens,
  parseTranscript,
  markRepeated,
  compactSegments,
  shouldCompact,
  getCompactionLevel,
  getDiscardCategories,
  compactTranscript,
  saveCheckpoint,
  loadCheckpoints,
  DEFAULT_COMPACTION_CONFIG,
  type TranscriptSegment,
  type CompactionDigest,
  type CompactionConfig,
  type CompactionLevel,
} from './transcript-compactor.js';

// ============================================================================
// Line Classification
// ============================================================================

describe('classifyLine', () => {
  it('classifies instruction lines', () => {
    expect(classifyLine('TASK: Build the event log module')).toBe('instruction');
    expect(classifyLine('INSTRUCTION: Use atomic writes')).toBe('instruction');
    expect(classifyLine('You must implement the compactor')).toBe('instruction');
    expect(classifyLine('Phase 3 implementation')).toBe('instruction');
  });

  it('classifies decision lines', () => {
    expect(classifyLine('DECISION: Use append-only log')).toBe('decision');
    expect(classifyLine('We chose JSON Lines format because of git friendliness')).toBe('decision');
    expect(classifyLine('Selected atomic write with rationale: crash recovery')).toBe('decision');
  });

  it('classifies error lines', () => {
    expect(classifyLine('ERROR: File not found')).toBe('error');
    expect(classifyLine('FAIL: Test assertion failed')).toBe('error');
    expect(classifyLine('Connection timeout after 30s')).toBe('error');
    expect(classifyLine('stack trace follows')).toBe('error');
  });

  it('classifies result lines', () => {
    expect(classifyLine('RESULT: 42 tests pass')).toBe('result');
    expect(classifyLine('PASS: All invariants checked')).toBe('result');
    expect(classifyLine('Successfully compiled in 2.3s')).toBe('result');
    expect(classifyLine('CREATED: event-log.ts')).toBe('result');
  });

  it('classifies state lines', () => {
    expect(classifyLine('STATE: 5 of 10 items complete')).toBe('state');
    expect(classifyLine('Currently processing wave 3')).toBe('state');
    expect(classifyLine('CHECKPOINT: Phase 2 done')).toBe('state');
  });

  it('classifies everything else as intermediate', () => {
    expect(classifyLine('Reading the file contents...')).toBe('intermediate');
    expect(classifyLine('Looking at the imports')).toBe('intermediate');
    expect(classifyLine('')).toBe('intermediate');
    expect(classifyLine('   ')).toBe('intermediate');
  });
});

// ============================================================================
// Token Estimation
// ============================================================================

describe('estimateTokens', () => {
  it('returns 0 for empty text', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates tokens from word count', () => {
    expect(estimateTokens('hello world')).toBe(3); // 2 words * 1.3 = 2.6 → 3
  });

  it('handles multiline text', () => {
    const text = 'line one\nline two\nline three';
    expect(estimateTokens(text)).toBeGreaterThan(0);
  });
});

// ============================================================================
// Transcript Parsing
// ============================================================================

describe('parseTranscript', () => {
  it('returns empty array for empty text', () => {
    expect(parseTranscript('', 'agent-1', '2026-01-01T00:00:00Z')).toEqual([]);
  });

  it('groups consecutive lines of the same category', () => {
    const text = [
      'TASK: Build module A',
      'You must use TypeScript',
      'Reading file contents...',
      'Looking at imports...',
      'RESULT: Build succeeded',
    ].join('\n');

    const segments = parseTranscript(text, 'agent-1', '2026-01-01T00:00:00Z');

    expect(segments.length).toBe(3); // instruction, intermediate, result
    expect(segments[0].category).toBe('instruction');
    expect(segments[1].category).toBe('intermediate');
    expect(segments[2].category).toBe('result');
  });

  it('sets source and timestamp on all segments', () => {
    const segments = parseTranscript('TASK: Do stuff', 'polecat-alpha', '2026-04-04T12:00:00Z');
    expect(segments[0].source).toBe('polecat-alpha');
    expect(segments[0].timestamp).toBe('2026-04-04T12:00:00Z');
  });

  it('estimates tokens for each segment', () => {
    const segments = parseTranscript('TASK: Build the module', 'a', 't');
    expect(segments[0].tokenEstimate).toBeGreaterThan(0);
  });
});

// ============================================================================
// Repeated Content Detection
// ============================================================================

describe('markRepeated', () => {
  it('marks duplicate segments as repeated', () => {
    const segments: TranscriptSegment[] = [
      { category: 'intermediate', text: 'Reading file...', source: 'a', timestamp: 't', tokenEstimate: 5 },
      { category: 'intermediate', text: 'Reading file...', source: 'a', timestamp: 't', tokenEstimate: 5 },
      { category: 'result', text: 'PASS: done', source: 'a', timestamp: 't', tokenEstimate: 3 },
    ];

    const result = markRepeated(segments);
    expect(result[0].category).toBe('intermediate'); // First occurrence kept
    expect(result[1].category).toBe('repeated');     // Second marked repeated
    expect(result[2].category).toBe('result');       // Unique stays
  });

  it('keeps first occurrence of duplicates', () => {
    const segments: TranscriptSegment[] = [
      { category: 'error', text: 'timeout', source: 'a', timestamp: 't', tokenEstimate: 2 },
      { category: 'error', text: 'timeout', source: 'a', timestamp: 't', tokenEstimate: 2 },
      { category: 'error', text: 'timeout', source: 'a', timestamp: 't', tokenEstimate: 2 },
    ];

    const result = markRepeated(segments);
    expect(result[0].category).toBe('error');
    expect(result[1].category).toBe('repeated');
    expect(result[2].category).toBe('repeated');
  });

  it('handles empty array', () => {
    expect(markRepeated([])).toEqual([]);
  });
});

// ============================================================================
// Compaction
// ============================================================================

describe('compactSegments', () => {
  it('preserves instruction and decision segments', () => {
    const segments: TranscriptSegment[] = [
      { category: 'instruction', text: 'TASK: Build it', source: 'a', timestamp: 't', tokenEstimate: 5 },
      { category: 'decision', text: 'DECISION: Use JSON', source: 'a', timestamp: 't', tokenEstimate: 5 },
      { category: 'intermediate', text: 'verbose output...', source: 'a', timestamp: 't', tokenEstimate: 100 },
    ];

    const result = compactSegments(segments);
    expect(result.digest).toContain('TASK: Build it');
    expect(result.digest).toContain('DECISION: Use JSON');
    expect(result.digest).not.toContain('verbose output');
  });

  it('extracts decisions into the decisions array', () => {
    const segments: TranscriptSegment[] = [
      { category: 'decision', text: 'DECISION: Use append-only', source: 'a', timestamp: 't', tokenEstimate: 5 },
      { category: 'decision', text: 'DECISION: Sort keys', source: 'a', timestamp: 't', tokenEstimate: 5 },
    ];

    const result = compactSegments(segments);
    expect(result.decisions).toHaveLength(2);
    expect(result.decisions[0]).toContain('append-only');
  });

  it('extracts errors into the errors array', () => {
    const segments: TranscriptSegment[] = [
      { category: 'error', text: 'ERROR: Connection refused', source: 'a', timestamp: 't', tokenEstimate: 5 },
    ];

    const result = compactSegments(segments);
    expect(result.errors).toHaveLength(1);
  });

  it('discards intermediate and repeated segments', () => {
    const segments: TranscriptSegment[] = [
      { category: 'intermediate', text: 'thinking...', source: 'a', timestamp: 't', tokenEstimate: 50 },
      { category: 'repeated', text: 'duplicate content', source: 'a', timestamp: 't', tokenEstimate: 50 },
      { category: 'instruction', text: 'TASK: Do this', source: 'a', timestamp: 't', tokenEstimate: 5 },
    ];

    const result = compactSegments(segments);
    expect(result.digest).not.toContain('thinking');
    expect(result.digest).not.toContain('duplicate');
    expect(result.digest).toContain('TASK: Do this');
  });

  it('truncates when exceeding maxDigestTokens', () => {
    const config: CompactionConfig = { ...DEFAULT_COMPACTION_CONFIG, maxDigestTokens: 10 };
    const segments: TranscriptSegment[] = [
      { category: 'instruction', text: 'A '.repeat(100), source: 'a', timestamp: 't', tokenEstimate: 130 },
    ];

    const result = compactSegments(segments, config);
    expect(result.compactedTokens).toBeLessThanOrEqual(15); // Allow some slack
  });

  it('reports compression ratio', () => {
    const segments: TranscriptSegment[] = [
      { category: 'instruction', text: 'TASK: Build', source: 'a', timestamp: 't', tokenEstimate: 5 },
      { category: 'intermediate', text: 'x '.repeat(500), source: 'a', timestamp: 't', tokenEstimate: 650 },
    ];

    const result = compactSegments(segments);
    expect(result.originalTokens).toBe(655);
    expect(result.compactedTokens).toBeLessThan(result.originalTokens);
  });
});

// ============================================================================
// Compaction Trigger
// ============================================================================

describe('shouldCompact', () => {
  it('triggers when budget exceeds any progressive threshold', () => {
    expect(shouldCompact(100, 65)).toBe(true);  // above 60% (full)
    expect(shouldCompact(100, 60)).toBe(true);  // at 60% (full)
    expect(shouldCompact(100, 50)).toBe(true);  // at 50% (moderate)
    expect(shouldCompact(100, 35)).toBe(true);  // at 35% (light)
    expect(shouldCompact(100, 20)).toBe(true);  // at 20% (snapshot)
  });

  it('does not trigger below lowest threshold', () => {
    expect(shouldCompact(5000, 15)).toBe(false);
    expect(shouldCompact(5000, 10)).toBe(false);
  });

  it('triggers when transcript exceeds 10K tokens', () => {
    expect(shouldCompact(15000, 10)).toBe(true);
  });
});

describe('getCompactionLevel', () => {
  it('returns progressive levels based on budget percent', () => {
    expect(getCompactionLevel(100, 15)).toBeNull();        // below 20%
    expect(getCompactionLevel(100, 20)).toBe('snapshot');   // at 20%
    expect(getCompactionLevel(100, 25)).toBe('snapshot');   // between 20-35%
    expect(getCompactionLevel(100, 35)).toBe('light');      // at 35%
    expect(getCompactionLevel(100, 45)).toBe('light');      // between 35-50%
    expect(getCompactionLevel(100, 50)).toBe('moderate');   // at 50%
    expect(getCompactionLevel(100, 55)).toBe('moderate');   // between 50-60%
    expect(getCompactionLevel(100, 60)).toBe('full');       // at 60%
    expect(getCompactionLevel(100, 90)).toBe('full');       // above 60%
  });

  it('returns full for large transcripts regardless of budget', () => {
    expect(getCompactionLevel(15000, 5)).toBe('full');
  });

  it('returns null when below all thresholds', () => {
    expect(getCompactionLevel(5000, 10)).toBeNull();
  });
});

describe('getDiscardCategories', () => {
  it('snapshot keeps everything', () => {
    expect(getDiscardCategories('snapshot')).toEqual([]);
  });

  it('light only discards repeated', () => {
    expect(getDiscardCategories('light')).toEqual(['repeated']);
  });

  it('moderate discards intermediate and repeated', () => {
    expect(getDiscardCategories('moderate')).toContain('intermediate');
    expect(getDiscardCategories('moderate')).toContain('repeated');
  });

  it('full discards intermediate and repeated', () => {
    expect(getDiscardCategories('full')).toContain('intermediate');
    expect(getDiscardCategories('full')).toContain('repeated');
  });
});

// ============================================================================
// Persistence
// ============================================================================

describe('checkpoint persistence', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'compactor-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('saves and loads a checkpoint', async () => {
    const digest: CompactionDigest = {
      checkpointId: 'cp-1-test',
      convoyId: 'convoy-alpha',
      itemsCompacted: 5,
      originalTokens: 10000,
      compactedTokens: 2000,
      compressionRatio: 0.2,
      digest: 'TASK: Build stuff\n\nDECISION: Use JSON',
      decisions: ['Use JSON'],
      errors: [],
      currentState: 'Phase 2 in progress',
      createdAt: '2026-04-04T12:00:00Z',
    };

    await saveCheckpoint(tmpDir, digest);

    const loaded = await loadCheckpoints(tmpDir, 'convoy-alpha');
    expect(loaded).toHaveLength(1);
    expect(loaded[0].checkpointId).toBe('cp-1-test');
    expect(loaded[0].digest).toContain('TASK: Build stuff');
    expect(loaded[0].decisions).toEqual(['Use JSON']);
  });

  it('loads multiple checkpoints in chronological order', async () => {
    const base = {
      convoyId: 'convoy-beta',
      itemsCompacted: 3,
      originalTokens: 5000,
      compactedTokens: 1000,
      compressionRatio: 0.2,
      digest: 'test',
      decisions: [],
      errors: [],
      currentState: 'ok',
    };

    await saveCheckpoint(tmpDir, { ...base, checkpointId: 'cp-2', createdAt: '2026-04-04T14:00:00Z' });
    await saveCheckpoint(tmpDir, { ...base, checkpointId: 'cp-1', createdAt: '2026-04-04T12:00:00Z' });

    const loaded = await loadCheckpoints(tmpDir, 'convoy-beta');
    expect(loaded).toHaveLength(2);
    expect(loaded[0].checkpointId).toBe('cp-1'); // Earlier first
    expect(loaded[1].checkpointId).toBe('cp-2');
  });

  it('returns empty array for nonexistent convoy', async () => {
    const loaded = await loadCheckpoints(tmpDir, 'nonexistent');
    expect(loaded).toEqual([]);
  });
});

// ============================================================================
// Full Pipeline
// ============================================================================

describe('compactTranscript', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'compactor-pipeline-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('compacts when budget threshold is exceeded', async () => {
    const transcript = [
      'TASK: Build the event log module',
      'You must use append-only writes',
      'Reading the existing code...',
      'Looking at types...',
      'Checking imports...',
      'More verbose exploration here...',
      'Still reading...',
      'DECISION: Use JSON Lines format because git-friendly',
      'RESULT: Module created successfully',
    ].join('\n');

    const result = await compactTranscript(
      tmpDir, 'convoy-1', transcript, 'polecat-1', 'Phase 2 active', 70,
    );

    expect(result.compacted).toBe(true);
    expect(result.digest).toBeDefined();
    expect(result.digest!.digest).toContain('TASK: Build');
    expect(result.digest!.digest).toContain('DECISION:');
    expect(result.digest!.decisions.length).toBeGreaterThan(0);
    expect(result.digest!.compressionRatio).toBeLessThan(1);

    // Verify persisted
    const checkpoints = await loadCheckpoints(tmpDir, 'convoy-1');
    expect(checkpoints).toHaveLength(1);
  });

  it('skips compaction when below threshold', async () => {
    const result = await compactTranscript(
      tmpDir, 'convoy-2', 'Short text', 'agent-1', 'ok', 10,
    );

    expect(result.compacted).toBe(false);
    expect(result.reason).toContain('threshold');
  });

  it('handles empty transcript', async () => {
    const result = await compactTranscript(
      tmpDir, 'convoy-3', '', 'agent-1', 'ok', 70,
    );

    expect(result.compacted).toBe(false);
  });
});
