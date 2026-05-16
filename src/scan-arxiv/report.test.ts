// === scan-arxiv report renderer tests ===

import { describe, it, expect } from 'vitest';
import { renderRunReport } from './report.js';
import type { RunOutput, QueueEntry } from './types.js';

function makeEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    rank: 1,
    paper: {
      arxivId: '2605.12345',
      title: 'A Test Paper',
      authors: ['Author One'],
      abstract: 'Abstract text.',
      categories: ['cs.AI'],
      publishedAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
      pdfUrl: 'https://arxiv.org/pdf/2605.12345',
      absUrl: 'https://arxiv.org/abs/2605.12345',
    },
    relevance: {
      subscores: {
        'agent-orchestration': 0.9,
        'skill-design': 0.3,
        'code-gen': 0.2,
        'memory-retrieval': 0.1,
      },
      aggregate: 0.87,
      rationale: 'Strong relevance to agent orchestration.',
      scoredAt: '2026-05-16T18:00:00Z',
      scorerVersion: 'v1.0.0',
    },
    ...overrides,
  };
}

function makeRun(overrides: Partial<RunOutput> = {}): RunOutput {
  return {
    runId: '2026-05-16T18-22-31Z',
    invokedAt: '2026-05-16T18:22:31Z',
    options: {
      month: '2026-04',
      top: 30,
      dryRun: false,
      categories: ['cs.AI', 'cs.CL', 'cs.LG'],
      minScore: 0.5,
      noCache: false,
      outputDir: '.planning/arxiv-may-funnel/runs',
    },
    totalsByCategory: { 'cs.AI': 42, 'cs.CL': 15, 'cs.LG': 27 },
    totalsByDomain: {
      'agent-orchestration': 10,
      'skill-design': 5,
      'code-gen': 3,
      'memory-retrieval': 2,
    },
    fetchedCount: 84,
    rankedCount: 50,
    dedupSkipCount: 4,
    queue: [makeEntry()],
    runtimeMs: 3210,
    ...overrides,
  };
}

describe('renderRunReport', () => {
  it('renders the H1 title and all required section headers', () => {
    const md = renderRunReport(makeRun());

    expect(md).toContain('# arxiv-may-funnel — Run Report');
    expect(md).toContain('## Per-category counts');
    expect(md).toContain('## Per-domain candidate counts');
    expect(md).toContain('## Top-K queue');
    expect(md).toContain('## Next step');
  });

  it('per-category counts table reflects totalsByCategory exactly', () => {
    const run = makeRun({
      totalsByCategory: { 'cs.AI': 42, 'cs.CL': 15, 'cs.LG': 27 },
    });
    const md = renderRunReport(run);

    expect(md).toContain('| cs.AI | 42 |');
    expect(md).toContain('| cs.CL | 15 |');
    expect(md).toContain('| cs.LG | 27 |');
  });

  it('escapes pipe characters in paper titles', () => {
    const entry = makeEntry({
      paper: {
        arxivId: '2605.99999',
        title: 'Title with | pipe | chars',
        authors: ['A'],
        abstract: 'Abstract.',
        categories: ['cs.AI'],
        publishedAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
        pdfUrl: 'https://arxiv.org/pdf/2605.99999',
        absUrl: 'https://arxiv.org/abs/2605.99999',
      },
    });
    const run = makeRun({ queue: [entry] });
    const md = renderRunReport(run);

    // The raw | in the title must be escaped as \| in the table
    expect(md).toContain('Title with \\| pipe \\| chars');
    // Raw unescaped pipes should not appear inside a cell for this title
    // (we check for the escaped form appearing, which is sufficient)
  });

  it('truncates rationale longer than 120 chars and appends "…"', () => {
    const longRationale = 'x'.repeat(130);
    const entry = makeEntry({
      relevance: {
        subscores: {
          'agent-orchestration': 0.8,
          'skill-design': 0.2,
          'code-gen': 0.1,
          'memory-retrieval': 0.1,
        },
        aggregate: 0.7,
        rationale: longRationale,
        scoredAt: '2026-05-16T18:00:00Z',
        scorerVersion: 'v1.0.0',
      },
    });
    const run = makeRun({ queue: [entry] });
    const md = renderRunReport(run);

    // The truncated rationale (120 chars) + ellipsis should appear
    expect(md).toContain('x'.repeat(120) + '…');
    // The full 130-char string should NOT appear
    expect(md).not.toContain('x'.repeat(130));
  });
});
