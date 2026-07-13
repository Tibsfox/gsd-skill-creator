import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { DEFAULT_DOMAIN_WEIGHTS } from '../scan-arxiv/ranker.js';
import {
  analyzeGaps,
  buildCorpusCoverage,
  classifySubtopicDomain,
  tokenize,
  DEFAULT_GAP_SUBTOPICS,
  type CorpusCoverage,
  type CitationSource,
  type MemorySource,
  type SpineMemory,
} from './gap-radar.js';

// A fixture corpus heavy on agent-orchestration + memory-retrieval, thin on
// skill-design, and completely bare on code-gen.
function fixtureCoverage(): CorpusCoverage {
  return {
    termCounts: new Map<string, number>([
      ['agent', 5],
      ['orchestration', 4],
      ['memory', 3],
      ['retrieval', 3],
      ['skill', 2],
      // 'code' and 'generation' intentionally absent -> the corpus gap.
    ]),
    workCount: 12,
    arxivSeenCount: 40,
  };
}

describe('tokenize', () => {
  it('lowercases, splits on non-alphanumerics, drops stopwords and short tokens', () => {
    expect(tokenize('Multi-Agent Orchestration for the Swarm')).toEqual([
      'multi',
      'agent',
      'orchestration',
      'swarm',
    ]);
  });
});

describe('classifySubtopicDomain', () => {
  it('routes each mission subtopic to its own domain', () => {
    expect(classifySubtopicDomain(tokenize('agent orchestration'))).toBe('agent-orchestration');
    expect(classifySubtopicDomain(tokenize('skill design'))).toBe('skill-design');
    expect(classifySubtopicDomain(tokenize('code generation'))).toBe('code-gen');
    expect(classifySubtopicDomain(tokenize('memory retrieval'))).toBe('memory-retrieval');
  });

  it('falls back to the primary domain when nothing matches', () => {
    expect(classifySubtopicDomain(tokenize('quantum widgets'))).toBe('agent-orchestration');
  });
});

describe('analyzeGaps', () => {
  it('ranks the uncovered subtopic first and the best-covered last', () => {
    const report = analyzeGaps('mission', [...DEFAULT_GAP_SUBTOPICS], fixtureCoverage());

    expect(report.subtopics.map((s) => s.subtopic)).toEqual([
      'code generation', // coverage 0 -> gap 1
      'skill design', // coverage 2 -> gap 0.78
      'memory retrieval', // coverage 6 -> gap 0.33
      'agent orchestration', // coverage 9 -> gap 0
    ]);

    const top = report.subtopics[0]!;
    expect(top.domain).toBe('code-gen');
    expect(top.gapScore).toBe(1);
    expect(top.coverage).toBe(0);

    const bottom = report.subtopics[3]!;
    expect(bottom.gapScore).toBe(0);
    expect(bottom.coverageRatio).toBe(1);
  });

  it('re-weights DEFAULT_DOMAIN_WEIGHTS toward the under-covered domain', () => {
    const report = analyzeGaps('mission', [...DEFAULT_GAP_SUBTOPICS], fixtureCoverage());
    const w = report.reweightedDomainWeights;

    // code-gen is the biggest gap -> its share must rise above the default.
    expect(w['code-gen']).toBeGreaterThan(DEFAULT_DOMAIN_WEIGHTS['code-gen']);
    // agent-orchestration is fully covered -> its share must fall.
    expect(w['agent-orchestration']).toBeLessThan(DEFAULT_DOMAIN_WEIGHTS['agent-orchestration']);

    // Still a valid weight vector.
    const sum = w['agent-orchestration'] + w['skill-design'] + w['code-gen'] + w['memory-retrieval'];
    expect(sum).toBeCloseTo(1, 10);
  });

  it('defaults to the four mission domains when no subtopics are given', () => {
    const report = analyzeGaps('mission', [], fixtureCoverage());
    expect(report.subtopics).toHaveLength(4);
    expect(new Set(report.subtopics.map((s) => s.domain))).toEqual(
      new Set(['agent-orchestration', 'skill-design', 'code-gen', 'memory-retrieval']),
    );
  });

  it('treats an empty corpus as all-gap but low-confidence', () => {
    const empty: CorpusCoverage = { termCounts: new Map(), workCount: 0, arxivSeenCount: 0 };
    const report = analyzeGaps('mission', [...DEFAULT_GAP_SUBTOPICS], empty);
    expect(report.subtopics.every((s) => s.gapScore === 1)).toBe(true);
    expect(report.confidence).toBe(0);
    // Equal pressure -> defaults pass through proportionally.
    expect(report.reweightedDomainWeights['agent-orchestration']).toBeCloseTo(
      DEFAULT_DOMAIN_WEIGHTS['agent-orchestration'],
      10,
    );
  });

  it('raises confidence as corpus maturity grows', () => {
    const bare = analyzeGaps('m', [], { termCounts: new Map(), workCount: 1, arxivSeenCount: 0 });
    const mature = analyzeGaps('m', [], fixtureCoverage());
    expect(mature.confidence).toBeGreaterThan(bare.confidence);
  });
});

describe('buildCorpusCoverage', () => {
  it('counts one increment per work per distinct title/tag term', async () => {
    const source: CitationSource = {
      async init() {},
      async all() {
        return [
          { title: 'Agent Orchestration Patterns', tags: ['agents', 'coordination'] },
          { title: 'Agent Memory Retrieval', tags: ['memory'] },
        ];
      },
    };

    const seenPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'gap-')), 'seen-ids.json');
    await fs.writeFile(
      seenPath,
      JSON.stringify({
        version: 1,
        ids: { '2605.0001': { ingestedAt: 'x', reportPath: 'y' }, '2605.0002': { ingestedAt: 'x', reportPath: 'y' } },
      }),
    );

    const coverage = await buildCorpusCoverage({ citationSource: source, seenIdsPath: seenPath });

    expect(coverage.workCount).toBe(2);
    expect(coverage.arxivSeenCount).toBe(2);
    // 'agent' appears in both works' titles -> covered by 2 works.
    expect(coverage.termCounts.get('agent')).toBe(2);
    // 'memory' in one title + never double-counted within a work.
    expect(coverage.termCounts.get('memory')).toBe(1);
    expect(coverage.termCounts.get('coordination')).toBe(1);
  });

  it('reports zero arxiv coverage when the seen-ids ledger is absent', async () => {
    const source: CitationSource = {
      async init() {},
      async all() {
        return [{ title: 'Skill Design', tags: [] }];
      },
    };
    const coverage = await buildCorpusCoverage({
      citationSource: source,
      seenIdsPath: path.join(os.tmpdir(), 'gap-radar-nonexistent-xyz.json'),
    });
    expect(coverage.arxivSeenCount).toBe(0);
    expect(coverage.workCount).toBe(1);
    expect(coverage.termCounts.get('skill')).toBe(1);
  });

  it('degrades to two signals when no memory source is injected', async () => {
    const source: CitationSource = {
      async init() {},
      async all() {
        return [{ title: 'Skill Design', tags: [] }];
      },
    };
    const coverage = await buildCorpusCoverage({
      citationSource: source,
      seenIdsPath: path.join(os.tmpdir(), 'gap-radar-nonexistent-xyz.json'),
    });
    expect(coverage.spineCount ?? 0).toBe(0);
  });
});

describe('buildCorpusCoverage — Knowledge Spine signal', () => {
  const emptyCitations: CitationSource = {
    async init() {},
    async all() {
      return [];
    },
  };
  const noArxiv = path.join(os.tmpdir(), 'gap-radar-nonexistent-spine.json');

  // A mock MemoryService.query that returns lessons/findings by type filter.
  function memorySourceOf(byType: Partial<Record<string, SpineMemory[]>>): MemorySource {
    return {
      async query(_text, options) {
        const records = byType[options?.type ?? ''] ?? [];
        return { results: records.map((record) => ({ record })) };
      },
    };
  }

  it('folds lesson/finding memories into the coverage map as a third signal', async () => {
    const memorySource = memorySourceOf({
      lesson: [
        { name: 'Code Generation Repair', description: 'synthesis loop', tags: ['codegen'] },
      ],
      finding: [{ name: 'Program Synthesis', description: 'coding wins', tags: [] }],
    });

    const coverage = await buildCorpusCoverage({
      citationSource: emptyCitations,
      seenIdsPath: noArxiv,
      memorySource,
    });

    expect(coverage.workCount).toBe(0);
    expect(coverage.spineCount).toBe(2);
    // 'code' from the lesson name; 'generation' from it too — corpus now covers
    // the previously-bare code-gen vocabulary.
    expect(coverage.termCounts.get('code')).toBe(1);
    expect(coverage.termCounts.get('generation')).toBe(1);
    // 'synthesis' appears in both memories -> covered by 2.
    expect(coverage.termCounts.get('synthesis')).toBe(2);
  });

  it('increments term counts on top of the citation vocabulary', async () => {
    const citationSource: CitationSource = {
      async init() {},
      async all() {
        return [{ title: 'Agent Orchestration', tags: [] }];
      },
    };
    const memorySource = memorySourceOf({
      lesson: [{ name: 'Agent Coordination', description: '', tags: [] }],
    });

    const coverage = await buildCorpusCoverage({
      citationSource,
      seenIdsPath: noArxiv,
      memorySource,
    });

    // 'agent' covered by one work + one lesson.
    expect(coverage.termCounts.get('agent')).toBe(2);
    expect(coverage.workCount).toBe(1);
    expect(coverage.spineCount).toBe(1);
  });

  it('counts a memory once even when both type queries return it', async () => {
    const shared: SpineMemory = { name: 'Memory Retrieval', description: '', tags: [] };
    const memorySource = memorySourceOf({ lesson: [shared], finding: [shared] });

    const coverage = await buildCorpusCoverage({
      citationSource: emptyCitations,
      seenIdsPath: noArxiv,
      memorySource,
    });

    expect(coverage.spineCount).toBe(1);
    expect(coverage.termCounts.get('memory')).toBe(1);
  });

  it('lets a mined lesson close a corpus gap in the ranked report', async () => {
    const memorySource = memorySourceOf({
      lesson: [
        { name: 'Code Generation', description: 'program synthesis', tags: ['codegen'] },
      ],
    });
    const coverage = await buildCorpusCoverage({
      citationSource: emptyCitations,
      seenIdsPath: noArxiv,
      memorySource,
    });

    const report = analyzeGaps('mission', [...DEFAULT_GAP_SUBTOPICS], coverage);
    const codeGen = report.subtopics.find((s) => s.subtopic === 'code generation')!;
    // Spine coverage lifts code-gen off the floor.
    expect(codeGen.coverage).toBeGreaterThan(0);
    expect(report.spineCount).toBe(1);
    // The spine memory also raises corpus-maturity confidence above bare.
    expect(report.confidence).toBeGreaterThan(0);
  });
});
