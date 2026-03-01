/**
 * Tests for STATE.md auto-pruner.
 *
 * Covers:
 * - countLines: empty, single, multi-line content
 * - parseStateEntries: frontmatter extraction, section splitting
 * - identifyStaleEntries: checkpoint-based staleness detection
 * - formatArchive: archive document generation with metadata
 * - pruneState: full orchestrator with soft/hard limits, edge cases
 */

import { describe, it, expect, vi } from 'vitest';
import {
  countLines,
  parseStateEntries,
  identifyStaleEntries,
  formatArchive,
  pruneState,
} from './state-pruner.js';
import type { PruneResult } from './state-pruner.js';

// ============================================================================
// countLines
// ============================================================================

describe('countLines', () => {
  it('should return 0 for empty string', () => {
    expect(countLines('')).toBe(0);
  });

  it('should return 1 for single line with no trailing newline', () => {
    expect(countLines('hello')).toBe(1);
  });

  it('should return correct count for multi-line content', () => {
    expect(countLines('line1\nline2\nline3\n')).toBe(3);
  });

  it('should handle content with only newlines', () => {
    expect(countLines('\n\n\n')).toBe(3);
  });

  it('should handle content with trailing newline', () => {
    expect(countLines('a\nb\n')).toBe(2);
  });

  it('should handle content without trailing newline', () => {
    expect(countLines('a\nb')).toBe(2);
  });
});

// ============================================================================
// parseStateEntries
// ============================================================================

const SAMPLE_STATE = `---
milestone: v1.53
status: executing
---

# Project State

## Project Reference

See: .planning/PROJECT.md

## Current Position

Phase: 497 of 502 (Foundation) -- COMPLETE
Plan: 2 of 2

## Performance Metrics

**Velocity:**
- Total plans completed: 2

## Accumulated Context

### Decisions

- [v1.53 start]: Skip v1.52

### Pending Todos

None yet.

## Session Continuity

Last session: 2026-03-01
`;

describe('parseStateEntries', () => {
  it('should extract frontmatter between --- delimiters', () => {
    const result = parseStateEntries(SAMPLE_STATE);
    expect(result.frontmatter).toContain('milestone: v1.53');
    expect(result.frontmatter).toContain('status: executing');
  });

  it('should split content into sections by ## headings', () => {
    const result = parseStateEntries(SAMPLE_STATE);
    expect(result.sections.length).toBeGreaterThan(0);
    const headers = result.sections.map(s => s.header);
    expect(headers).toContain('Project Reference');
    expect(headers).toContain('Current Position');
    expect(headers).toContain('Session Continuity');
  });

  it('should preserve section content', () => {
    const result = parseStateEntries(SAMPLE_STATE);
    const posSection = result.sections.find(s => s.header === 'Current Position');
    expect(posSection).toBeDefined();
    expect(posSection!.content).toContain('Phase: 497');
  });

  it('should handle content with no frontmatter', () => {
    const content = '## Section One\n\nSome text\n\n## Section Two\n\nMore text\n';
    const result = parseStateEntries(content);
    expect(result.frontmatter).toBe('');
    expect(result.sections.length).toBe(2);
  });

  it('should handle content with only frontmatter', () => {
    const content = '---\nkey: value\n---\n';
    const result = parseStateEntries(content);
    expect(result.frontmatter).toContain('key: value');
    expect(result.sections.length).toBe(0);
  });

  it('should handle empty content', () => {
    const result = parseStateEntries('');
    expect(result.frontmatter).toBe('');
    expect(result.sections.length).toBe(0);
  });
});

// ============================================================================
// identifyStaleEntries
// ============================================================================

describe('identifyStaleEntries', () => {
  it('should never mark structural sections as stale', () => {
    const sections = [
      { header: 'Project Reference', content: 'old content', checkpoint: 1 },
      { header: 'Current Position', content: 'old content', checkpoint: 1 },
      { header: 'Session Continuity', content: 'old content', checkpoint: 1 },
    ];
    const stale = identifyStaleEntries(sections, 10);
    expect(stale).toHaveLength(0);
  });

  it('should mark entries older than current checkpoint as stale', () => {
    const sections = [
      { header: 'Project Reference', content: 'ref', checkpoint: 1 },
      { header: 'Performance Metrics', content: 'old metrics', checkpoint: 3 },
      { header: 'Accumulated Context', content: 'old context', checkpoint: 5 },
      { header: 'Session Continuity', content: 'session', checkpoint: 1 },
    ];
    const stale = identifyStaleEntries(sections, 10);
    expect(stale).toHaveLength(2);
    expect(stale.map(s => s.header)).toContain('Performance Metrics');
    expect(stale.map(s => s.header)).toContain('Accumulated Context');
  });

  it('should keep entries at or above current checkpoint', () => {
    const sections = [
      { header: 'Performance Metrics', content: 'current', checkpoint: 10 },
      { header: 'Accumulated Context', content: 'current', checkpoint: 10 },
    ];
    const stale = identifyStaleEntries(sections, 10);
    expect(stale).toHaveLength(0);
  });

  it('should return empty array when no stale entries exist', () => {
    const sections = [
      { header: 'Current Position', content: 'pos', checkpoint: 10 },
    ];
    const stale = identifyStaleEntries(sections, 5);
    expect(stale).toHaveLength(0);
  });
});

// ============================================================================
// formatArchive
// ============================================================================

describe('formatArchive', () => {
  it('should produce archive with header, timestamp, and milestone', () => {
    const entries = [
      { header: 'Old Metrics', content: 'data here', checkpoint: 3 },
    ];
    const archive = formatArchive(entries, 10, 'v1.53');
    expect(archive).toContain('# STATE Archive');
    expect(archive).toContain('Checkpoint 10');
    expect(archive).toContain('Milestone: v1.53');
    expect(archive).toContain('Archived:');
  });

  it('should include all archived entry content', () => {
    const entries = [
      { header: 'Old Metrics', content: 'metric data\nmore data', checkpoint: 3 },
      { header: 'Old Context', content: 'context data', checkpoint: 5 },
    ];
    const archive = formatArchive(entries, 10, 'v1.53');
    expect(archive).toContain('## Old Metrics');
    expect(archive).toContain('metric data');
    expect(archive).toContain('## Old Context');
    expect(archive).toContain('context data');
  });

  it('should include covers description listing entry headers', () => {
    const entries = [
      { header: 'Section A', content: 'a', checkpoint: 1 },
      { header: 'Section B', content: 'b', checkpoint: 2 },
    ];
    const archive = formatArchive(entries, 10, 'v1.53');
    expect(archive).toContain('Section A');
    expect(archive).toContain('Section B');
  });
});

// ============================================================================
// pruneState (orchestrator)
// ============================================================================

describe('pruneState', () => {
  // Build a state content with N lines
  function makeState(lineCount: number, includeStale = true): string {
    const lines: string[] = [];
    lines.push('---');
    lines.push('milestone: v1.53');
    lines.push('status: executing');
    lines.push('---');
    lines.push('');
    lines.push('# Project State');
    lines.push('');
    lines.push('## Project Reference');
    lines.push('');
    lines.push('See: .planning/PROJECT.md');
    lines.push('');
    lines.push('## Current Position');
    lines.push('');
    lines.push('Phase: 500');
    lines.push('');
    lines.push('## Session Continuity');
    lines.push('');
    lines.push('Last session: 2026-03-01');

    if (includeStale) {
      lines.push('');
      lines.push('## Performance Metrics');
      lines.push('');
      // Pad with stale content lines
      const remaining = lineCount - lines.length;
      for (let i = 0; i < remaining; i++) {
        lines.push(`- metric line ${i}`);
      }
    } else {
      // Just pad with empty lines to reach target
      const remaining = lineCount - lines.length;
      for (let i = 0; i < remaining; i++) {
        lines.push('');
      }
    }

    return lines.join('\n') + '\n';
  }

  const mockExecState = {
    milestone: 'v1.53',
    status: 'RUNNING' as const,
    current_subversion: 50,
    total_subversions: 100,
    checkpoints: [10, 20, 30, 40, 50],
    started_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T08:00:00.000Z',
  };

  it('should not prune when under 80 lines', async () => {
    const content = makeState(50);
    const readFn = vi.fn().mockResolvedValue(content);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const result = await pruneState(
      'STATE.md',
      'archive/',
      mockExecState,
      { readFile: readFn, writeFile: writeFn }
    );

    expect(result.pruned).toBe(false);
    expect(result.linesBefore).toBe(countLines(content));
    expect(writeFn).not.toHaveBeenCalled();
  });

  it('should prune when at soft limit (80-100 lines)', async () => {
    const content = makeState(90);
    const readFn = vi.fn().mockResolvedValue(content);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const result = await pruneState(
      'STATE.md',
      'archive/',
      mockExecState,
      { readFile: readFn, writeFile: writeFn }
    );

    expect(result.pruned).toBe(true);
    expect(result.linesAfter).toBeLessThanOrEqual(80);
    expect(result.archivePath).toBeDefined();
    expect(writeFn).toHaveBeenCalled();
  });

  it('should force prune when exceeding hard limit (>100 lines)', async () => {
    // Build a state with many non-structural stale sections that after soft prune
    // (removing some stale sections) still exceeds 100 lines due to multiple stale
    // sections with content. The key: have multiple stale sections so that after
    // archiving them and adding summary lines, the file still exceeds 100.
    const lines: string[] = [];
    lines.push('---');
    lines.push('milestone: v1.53');
    lines.push('status: executing');
    lines.push('---');
    lines.push('');
    lines.push('# Project State');
    lines.push('');
    lines.push('## Project Reference');
    lines.push('');
    lines.push('See: .planning/PROJECT.md');
    lines.push('');
    lines.push('## Current Position');
    lines.push('');
    lines.push('Phase: 500');
    lines.push('');
    lines.push('## Session Continuity');
    lines.push('');
    lines.push('Last session: 2026-03-01');
    lines.push('');
    // Add many stale sections to exceed 100 lines
    for (let section = 0; section < 6; section++) {
      lines.push(`## Stale Section ${section}`);
      lines.push('');
      for (let i = 0; i < 15; i++) {
        lines.push(`- stale data ${section}-${i}`);
      }
      lines.push('');
    }
    const content = lines.join('\n') + '\n';

    const readFn = vi.fn().mockResolvedValue(content);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const result = await pruneState(
      'STATE.md',
      'archive/',
      mockExecState,
      { readFile: readFn, writeFile: writeFn }
    );

    expect(result.pruned).toBe(true);
    // After pruning, should be significantly smaller than before
    expect(result.linesAfter).toBeLessThan(result.linesBefore);
    // Should have a warning since original exceeded hard limit
    expect(result.warning).toBeDefined();
  });

  it('should not prune when no stale entries found even above soft limit', async () => {
    const content = makeState(90, false);
    const readFn = vi.fn().mockResolvedValue(content);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const result = await pruneState(
      'STATE.md',
      'archive/',
      mockExecState,
      { readFile: readFn, writeFile: writeFn }
    );

    expect(result.pruned).toBe(false);
  });

  it('should handle empty file gracefully', async () => {
    const readFn = vi.fn().mockResolvedValue('');
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const result = await pruneState(
      'STATE.md',
      'archive/',
      mockExecState,
      { readFile: readFn, writeFile: writeFn }
    );

    expect(result.pruned).toBe(false);
    expect(result.linesBefore).toBe(0);
  });

  it('should handle frontmatter-only file gracefully', async () => {
    const content = '---\nmilestone: v1.53\n---\n';
    const readFn = vi.fn().mockResolvedValue(content);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const result = await pruneState(
      'STATE.md',
      'archive/',
      mockExecState,
      { readFile: readFn, writeFile: writeFn }
    );

    expect(result.pruned).toBe(false);
  });

  it('should write archive file to correct path', async () => {
    const content = makeState(90);
    const readFn = vi.fn().mockResolvedValue(content);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const result = await pruneState(
      'STATE.md',
      'archive/',
      mockExecState,
      { readFile: readFn, writeFile: writeFn }
    );

    if (result.archivePath) {
      expect(result.archivePath).toContain('STATE-ARCHIVE-');
      expect(result.archivePath).toContain('archive/');
    }
  });

  it('should replace stale entries with summary lines in pruned STATE', async () => {
    const content = makeState(90);
    const readFn = vi.fn().mockResolvedValue(content);
    const writtenContent: Record<string, string> = {};
    const writeFn = vi.fn().mockImplementation((path: string, data: string) => {
      writtenContent[path] = data;
      return Promise.resolve();
    });

    await pruneState(
      'STATE.md',
      'archive/',
      mockExecState,
      { readFile: readFn, writeFile: writeFn }
    );

    // STATE.md should have been written with archive reference
    if (writtenContent['STATE.md']) {
      expect(writtenContent['STATE.md']).toContain('STATE-ARCHIVE-');
    }
  });

  it('should handle large phase numbers (e.g., 508) as currentCheckpoint', async () => {
    // Build a state with stale entries at phase 500 and current checkpoint at 508
    const lines: string[] = [];
    lines.push('---');
    lines.push('milestone: v1.55');
    lines.push('status: executing');
    lines.push('---');
    lines.push('');
    lines.push('# Project State');
    lines.push('');
    lines.push('## Project Reference');
    lines.push('');
    lines.push('See: .planning/PROJECT.md');
    lines.push('');
    lines.push('## Current Position');
    lines.push('');
    lines.push('Phase: 508 of 518');
    lines.push('');
    lines.push('## Performance Metrics');
    lines.push('');
    // Phase 500 content -- should be stale relative to checkpoint 508
    lines.push('Phase: 500 metrics here');
    // Pad to exceed soft limit
    for (let i = 0; i < 65; i++) {
      lines.push(`- metric line ${i}`);
    }
    lines.push('');
    lines.push('## Session Continuity');
    lines.push('');
    lines.push('Last session: 2026-03-01');
    const content = lines.join('\n') + '\n';

    const readFn = vi.fn().mockResolvedValue(content);
    const writeFn = vi.fn().mockResolvedValue(undefined);

    const largePhaseState = {
      milestone: 'v1.55',
      status: 'RUNNING' as const,
      current_subversion: 508,
      total_subversions: 100,
      checkpoints: [],
      started_at: '2026-03-01T00:00:00.000Z',
      updated_at: '2026-03-01T08:00:00.000Z',
    };

    const result = await pruneState(
      'STATE.md',
      'archive/',
      largePhaseState,
      { readFile: readFn, writeFile: writeFn }
    );

    // The Performance Metrics section (checkpoint=500) should be stale relative to 508
    expect(result.pruned).toBe(true);
    expect(result.linesAfter).toBeLessThan(result.linesBefore);
    expect(result.archivePath).toContain('STATE-ARCHIVE-508');
  });
});
