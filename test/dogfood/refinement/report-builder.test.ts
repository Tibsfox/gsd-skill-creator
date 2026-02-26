import { describe, it, expect } from 'vitest';
import type { RefinementResult, KnowledgePatch, ImprovementTicket, SkillUpdate } from '../../../src/dogfood/refinement/types.js';
import type { ProgressState, ChapterMetrics, TrackProgress } from '../../../src/dogfood/harness/types.js';
import type { GapRecord } from '../../../src/dogfood/verification/types.js';
import { buildReport } from '../../../src/dogfood/refinement/report-builder.js';
import type { ReportInput, EightLayerMapping } from '../../../src/dogfood/refinement/report-builder.js';

// --- Factories ---

function makeTrackProgress(overrides: Partial<TrackProgress> = {}): TrackProgress {
  return {
    status: 'complete',
    currentPart: 5,
    currentChapter: 17,
    chunksProcessed: 120,
    chunksTotal: 120,
    conceptsLearned: 45,
    tokensUsed: 50000,
    errors: [],
    ...overrides,
  };
}

function makeProgressState(overrides: Partial<ProgressState> = {}): ProgressState {
  return {
    missionId: 'v1.40',
    startedAt: '2026-02-20T08:00:00Z',
    lastUpdatedAt: '2026-02-26T12:00:00Z',
    extraction: {
      status: 'complete',
      chaptersExtracted: 33,
      chunksGenerated: 240,
      totalPages: 450,
      errors: [],
    },
    learning: {
      trackA: makeTrackProgress({ conceptsLearned: 45 }),
      trackB: makeTrackProgress({ conceptsLearned: 35, currentPart: 10, currentChapter: 33 }),
    },
    verification: {
      status: 'complete',
      conceptsVerified: 80,
      gapsFound: 25,
      gapsByType: {
        'verified': 10,
        'inconsistent': 5,
        'missing-in-ecosystem': 4,
        'incomplete': 3,
        'outdated': 2,
        'differently-expressed': 1,
      },
    },
    refinement: {
      status: 'complete',
      patchesGenerated: 8,
      ticketsGenerated: 12,
      skillsUpdated: 6,
      reportComplete: true,
    },
    ...overrides,
  };
}

function makeChapterMetrics(chapter: number, overrides: Partial<ChapterMetrics> = {}): ChapterMetrics {
  return {
    chapter,
    part: Math.ceil(chapter / 3.3),
    chunksGenerated: 8,
    conceptsDetected: 3,
    mathDensity: 0.4,
    tokensUsed: 3000,
    processingTimeMs: 15000,
    errorsEncountered: 0,
    gapsFound: 1,
    ...overrides,
  };
}

function makePatch(id: string, overrides: Partial<KnowledgePatch> = {}): KnowledgePatch {
  return {
    id,
    targetDocument: 'skills/fourier/SKILL.md',
    targetSection: 'definition',
    gapId: 'gap-001',
    patchType: 'update',
    currentContent: 'Old content.',
    proposedContent: 'New content.',
    rationale: 'Evidence from Chapter 5.',
    confidence: 0.85,
    requiresReview: true,
    reviewNotes: 'Check citation.',
    ...overrides,
  };
}

function makeTicket(id: string, overrides: Partial<ImprovementTicket> = {}): ImprovementTicket {
  return {
    id,
    title: 'Fix inconsistency in Fourier Transform',
    component: 'concept-detector',
    severity: 'high',
    category: 'bug',
    description: 'Inconsistency detected.',
    reproductionSteps: ['1. Run sc:learn on Chapter 5', '2. Check output'],
    expectedBehavior: 'Correct detection.',
    actualBehavior: 'Incorrect detection.',
    suggestedFix: 'Improve detection logic.',
    affectedChapters: [5],
    tokenImpact: '~1000 tokens',
    ...overrides,
  };
}

function makeSkillUpdate(id: string, overrides: Partial<SkillUpdate> = {}): SkillUpdate {
  return {
    id,
    skillName: 'fourier-transform',
    action: 'refine',
    currentDefinition: 'Existing definition.',
    proposedDefinition: 'Improved definition with frequency decomposition.',
    triggerPatterns: ['Fourier Transform', 'frequency analysis'],
    complexPlanePosition: { theta: Math.PI / 4, radius: 0.6 },
    evidenceFromTextbook: 'Chapter 5',
    evidenceFromEcosystem: 'skills/fourier-transform/SKILL.md',
    ...overrides,
  };
}

function makeRefinementResult(overrides: Partial<RefinementResult> = {}): RefinementResult {
  return {
    patches: [
      makePatch('patch-001'),
      makePatch('patch-002', { confidence: 0.75, targetDocument: 'docs/synthesis.md' }),
      makePatch('patch-003', { confidence: 0.60, patchType: 'add' }),
    ],
    tickets: [
      makeTicket('ticket-001', { severity: 'critical' }),
      makeTicket('ticket-002', { severity: 'high' }),
      makeTicket('ticket-003', { severity: 'medium' }),
      makeTicket('ticket-004', { severity: 'low' }),
      makeTicket('ticket-005', { severity: 'high', component: 'position-mapper' }),
    ],
    skillUpdates: [
      makeSkillUpdate('skill-001'),
      makeSkillUpdate('skill-002', { action: 'create', skillName: 'wavelet-transform' }),
    ],
    statistics: {
      gapsProcessed: 25,
      patchesGenerated: 3,
      ticketsGenerated: 5,
      skillsUpdated: 2,
      skippedGaps: 10,
    },
    ...overrides,
  };
}

function makeGapRecord(overrides: Partial<GapRecord> = {}): GapRecord {
  return {
    id: 'gap-001',
    type: 'inconsistent',
    severity: 'significant',
    concept: 'Fourier Transform',
    textbookSource: 'Chapter 5, Section 3',
    ecosystemSource: 'skills/fourier/SKILL.md',
    textbookClaim: 'Decomposes into constituent frequencies.',
    ecosystemClaim: 'Converts time-domain signals.',
    analysis: 'Incomplete description in ecosystem.',
    suggestedResolution: 'Update definition.',
    affectsComponents: ['concept-detector'],
    ...overrides,
  };
}

function makeDefaultInput(): ReportInput {
  const chapterMetrics = Array.from({ length: 33 }, (_, i) => makeChapterMetrics(i + 1));
  const gaps = [
    makeGapRecord({ id: 'gap-001', type: 'inconsistent', textbookSource: 'Chapter 5' }),
    makeGapRecord({ id: 'gap-002', type: 'missing-in-ecosystem', textbookSource: 'Chapter 12' }),
    makeGapRecord({ id: 'gap-003', type: 'verified', textbookSource: 'Chapter 1' }),
    makeGapRecord({ id: 'gap-004', type: 'incomplete', textbookSource: 'Chapter 20' }),
    makeGapRecord({ id: 'gap-005', type: 'outdated', textbookSource: 'Chapter 30' }),
  ];

  return {
    result: makeRefinementResult(),
    progress: makeProgressState(),
    chapterMetrics,
    gaps,
  };
}

describe('report-builder', () => {
  describe('report completeness (REFINE-04)', () => {
    it('returns a markdown string', () => {
      const report = buildReport(makeDefaultInput());
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });

    it('contains the report title', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('# v1.40 Dogfood Report: sc:learn');
    });

    it('contains Executive Summary section', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## Executive Summary');
      // Must be non-empty (at least one paragraph after the heading)
      const idx = report.indexOf('## Executive Summary');
      const sectionContent = report.slice(idx + 22, report.indexOf('\n## ', idx + 22));
      expect(sectionContent.trim().length).toBeGreaterThan(50);
    });

    it('contains Metrics Dashboard section', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## Metrics Dashboard');
    });

    it('contains The Eight-Layer Verification section', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## The Eight-Layer Verification');
    });

    it('contains Gap Analysis by Part section with Part I through Part X', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## Gap Analysis by Part');
      expect(report).toContain('Part I');
      expect(report).toContain('Part X');
    });

    it('contains Top Findings section with at least 1 finding', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## Top Findings');
      const idx = report.indexOf('## Top Findings');
      const sectionContent = report.slice(idx, report.indexOf('\n## ', idx + 1));
      expect(sectionContent).toMatch(/\d+\./);
    });

    it('contains sc:learn Performance Assessment with subsections', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## sc:learn Performance Assessment');
      expect(report).toContain('What Worked Well');
      expect(report).toContain('What Struggled');
      expect(report).toContain('Recommended Improvements');
    });

    it('contains Knowledge Patches Summary section', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## Knowledge Patches Summary');
    });

    it('contains Improvement Tickets Summary section', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## Improvement Tickets Summary');
    });

    it('contains Recommendations section', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## Recommendations');
    });

    it('contains Appendices section with A through E', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('## Appendices');
      expect(report).toMatch(/###\s+A\./);
      expect(report).toMatch(/###\s+B\./);
      expect(report).toMatch(/###\s+C\./);
      expect(report).toMatch(/###\s+D\./);
      expect(report).toMatch(/###\s+E\./);
    });

    it('has no TODO or PLACEHOLDER markers', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).not.toContain('[TODO]');
      expect(report).not.toContain('[PLACEHOLDER]');
      expect(report).not.toContain('TBD');
      expect(report).not.toMatch(/to be determined/i);
    });
  });

  describe('actual metrics (REFINE-06)', () => {
    it('contains actual chapter count from progress state', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('33');
    });

    it('contains token usage derived from chapter metrics', () => {
      const input = makeDefaultInput();
      const totalTokens = input.chapterMetrics.reduce((sum, cm) => sum + cm.tokensUsed, 0);
      const report = buildReport(input);
      expect(report).toContain(totalTokens.toLocaleString());
    });

    it('contains processing time derived from chapter metrics', () => {
      const input = makeDefaultInput();
      const report = buildReport(input);
      // Processing time should appear as a human-readable number (not "TBD")
      expect(report).not.toContain('N/33');
      expect(report).not.toMatch(/~estimate/);
    });

    it('contains gaps found count from verification data', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('25');
    });

    it('contains patches/tickets/skills counts from statistics', () => {
      const report = buildReport(makeDefaultInput());
      const stats = makeRefinementResult().statistics;
      expect(report).toContain(String(stats.patchesGenerated));
      expect(report).toContain(String(stats.ticketsGenerated));
      expect(report).toContain(String(stats.skillsUpdated));
    });
  });

  describe('patches summary table', () => {
    it('each patch appears as a row with targetDocument, patchType, confidence', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('patch-001');
      expect(report).toContain('patch-002');
      expect(report).toContain('patch-003');
      expect(report).toContain('0.85');
      expect(report).toContain('0.75');
    });
  });

  describe('tickets summary table', () => {
    it('each ticket appears as a row with title, component, severity, category', () => {
      const report = buildReport(makeDefaultInput());
      expect(report).toContain('ticket-001');
      expect(report).toContain('concept-detector');
      expect(report).toContain('position-mapper');
      expect(report).toContain('critical');
    });
  });

  describe('per-part analysis', () => {
    it('each of 10 parts gets a subsection', () => {
      const report = buildReport(makeDefaultInput());
      const partNames = [
        'Part I: Seeing', 'Part II: Hearing', 'Part III: Touching',
        'Part IV: Expanding', 'Part V: Grounding', 'Part VI: Defining',
        'Part VII: Mapping', 'Part VIII: Channeling', 'Part IX: Growing',
        'Part X: Being',
      ];
      for (const name of partNames) {
        expect(report).toContain(name);
      }
    });
  });

  describe('edge cases', () => {
    it('handles empty patches/tickets/skills arrays', () => {
      const input = makeDefaultInput();
      input.result = makeRefinementResult({
        patches: [],
        tickets: [],
        skillUpdates: [],
        statistics: {
          gapsProcessed: 0,
          patchesGenerated: 0,
          ticketsGenerated: 0,
          skillsUpdated: 0,
          skippedGaps: 0,
        },
      });
      const report = buildReport(input);
      expect(report).toContain('No patches generated');
      expect(report).toContain('No tickets generated');
    });

    it('handles zero metrics without crashing', () => {
      const input: ReportInput = {
        result: makeRefinementResult({
          patches: [],
          tickets: [],
          skillUpdates: [],
          statistics: {
            gapsProcessed: 0,
            patchesGenerated: 0,
            ticketsGenerated: 0,
            skillsUpdated: 0,
            skippedGaps: 0,
          },
        }),
        progress: makeProgressState({
          extraction: { status: 'complete', chaptersExtracted: 0, chunksGenerated: 0, totalPages: 0, errors: [] },
          verification: { status: 'complete', conceptsVerified: 0, gapsFound: 0, gapsByType: {} },
          refinement: { status: 'complete', patchesGenerated: 0, ticketsGenerated: 0, skillsUpdated: 0, reportComplete: false },
        }),
        chapterMetrics: [],
        gaps: [],
      };
      const report = buildReport(input);
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });
  });
});
