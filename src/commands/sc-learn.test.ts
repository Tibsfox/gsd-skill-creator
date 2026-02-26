import { describe, it, expect, vi, beforeEach } from 'vitest';

// === Hoisted mock variables (referenced inside vi.mock factories) ===

const { mockMerge, mockGetProvenanceChain, mockGetPendingConflicts, mockResolveConflict, mockRecord, mockGetChangeset } = vi.hoisted(() => ({
  mockMerge: vi.fn(),
  mockGetProvenanceChain: vi.fn(),
  mockGetPendingConflicts: vi.fn().mockReturnValue([]),
  mockResolveConflict: vi.fn(),
  mockRecord: vi.fn(),
  mockGetChangeset: vi.fn(),
}));

// === Mock all pipeline modules ===

vi.mock('../learn/acquirer.js', () => ({
  acquireSource: vi.fn().mockResolvedValue({
    source: { input: 'test.md', type: 'local-file', familiarity: 'HOME' },
    staged: [{
      filename: 'test.md',
      content: '# Test\n\nDefinition 1.1: A group is a set with a binary operation.',
      byteSize: 100,
      encoding: 'utf-8',
      sourceFile: 'test.md',
    }],
    stagingDir: '/tmp/staging',
    timestamp: new Date().toISOString(),
    errors: [],
  }),
}));

vi.mock('../learn/sanitizer.js', () => ({
  sanitizeContent: vi.fn().mockResolvedValue({
    source: { input: 'test.md', type: 'local-file', familiarity: 'HOME' },
    staged: [{
      filename: 'test.md',
      content: '# Test\n\nDefinition 1.1: A group is a set with a binary operation.',
      byteSize: 100,
      encoding: 'utf-8',
      sourceFile: 'test.md',
    }],
    report: { findings: [], tier: 'HOME', passed: true, summary: '0 findings', checkedAt: new Date().toISOString() },
    autoApproved: true,
  }),
}));

vi.mock('../learn/hitl-gate.js', () => ({
  hitlGate: vi.fn().mockResolvedValue({
    decision: { status: 'approved', rationale: 'Auto-approved', reviewedFindings: 0, decidedAt: new Date().toISOString(), decidedBy: 'auto' },
    sanitizationResult: {
      source: { input: 'test.md', type: 'local-file', familiarity: 'HOME' },
      staged: [{
        filename: 'test.md',
        content: '# Test\n\nDefinition 1.1: A group is a set with a binary operation.',
        byteSize: 100,
        encoding: 'utf-8',
        sourceFile: 'test.md',
      }],
      report: { findings: [], tier: 'HOME', passed: true, summary: '0 findings', checkedAt: new Date().toISOString() },
      autoApproved: true,
    },
    proceed: true,
  }),
}));

vi.mock('../learn/analyzer.js', () => ({
  analyzeDocument: vi.fn().mockReturnValue({
    sections: [{ title: 'Test', level: 1, content: 'Definition 1.1: A group is a set.', children: [], startIndex: 0 }],
    contentType: 'textbook',
    detectedDomain: 'foundations',
    planePosition: { real: -0.5, imaginary: 0.5 },
    confidence: 0.8,
    keywords: ['group', 'set', 'binary', 'operation'],
    wordCount: 20,
    sectionCount: 1,
  }),
}));

vi.mock('../learn/extractor.js', () => ({
  extractPrimitives: vi.fn().mockReturnValue({
    candidates: [{
      id: 'foundations-group',
      name: 'Group',
      type: 'definition',
      domain: 'foundations',
      chapter: 1,
      section: '1.1',
      planePosition: { real: -0.5, imaginary: 0.5 },
      formalStatement: 'A group is a set with a binary operation.',
      computationalForm: 'Defines: A group is a set with a binary operation',
      prerequisites: [],
      dependencies: [],
      enables: [],
      compositionRules: [],
      applicabilityPatterns: ['group', 'set'],
      keywords: ['group', 'set', 'binary'],
      tags: ['textbook', 'foundations'],
      buildLabs: [],
      sourceSection: 'Test',
      sourceOffset: 0,
      extractionConfidence: 0.9,
    }],
    contentType: 'textbook',
    domain: 'foundations',
    totalSectionsProcessed: 1,
    extractionMethod: 'textbook-heuristic',
  }),
}));

vi.mock('../learn/dependency-wirer.js', () => ({
  wireDependencies: vi.fn().mockReturnValue({
    wiredPrimitives: [{
      id: 'foundations-group',
      name: 'Group',
      type: 'definition',
      domain: 'foundations',
      chapter: 1,
      section: '1.1',
      planePosition: { real: -0.5, imaginary: 0.5 },
      formalStatement: 'A group is a set with a binary operation.',
      computationalForm: 'Defines: A group is a set with a binary operation',
      prerequisites: [],
      dependencies: [],
      enables: [],
      compositionRules: [],
      applicabilityPatterns: ['group', 'set'],
      keywords: ['group', 'set', 'binary'],
      tags: ['textbook', 'foundations'],
      buildLabs: [],
      sourceSection: 'Test',
      sourceOffset: 0,
      extractionConfidence: 0.9,
    }],
    edgesAdded: 0,
    enablesAdded: 0,
    prerequisitesAdded: 0,
  }),
}));

vi.mock('../learn/dedup-prefilter.js', () => ({
  prefilterDuplicates: vi.fn().mockReturnValue({
    candidateId: 'foundations-group',
    matches: [],
    flagged: false,
  }),
}));

vi.mock('../learn/semantic-comparator.js', () => ({
  compareSemantically: vi.fn().mockReturnValue({
    candidateId: 'foundations-group',
    comparisons: [],
    bestMatch: null,
  }),
}));

vi.mock('../learn/merge-engine.js', () => ({
  createMergeEngine: vi.fn().mockReturnValue({
    merge: mockMerge,
    resolveConflict: mockResolveConflict,
    getProvenanceChain: mockGetProvenanceChain,
    getPendingConflicts: mockGetPendingConflicts,
  }),
}));

vi.mock('../learn/changeset-manager.js', () => ({
  createChangesetManager: vi.fn().mockReturnValue({
    record: mockRecord,
    getChangeset: mockGetChangeset,
    listSessions: vi.fn().mockReturnValue([]),
    revert: vi.fn(),
  }),
}));

vi.mock('../learn/generators/skill-generator.js', () => ({
  generateLearnedSkill: vi.fn().mockReturnValue({
    generated: false,
    reason: 'Insufficient primitives (1 < 30)',
    skill: null,
  }),
}));

vi.mock('../learn/generators/agent-generator.js', () => ({
  generateAgent: vi.fn().mockReturnValue({
    generated: false,
    reason: 'Insufficient primitives (1 < 30)',
    agent: null,
  }),
}));

vi.mock('../learn/generators/team-generator.js', () => ({
  generateTeam: vi.fn().mockReturnValue({
    generated: false,
    reason: 'Insufficient primitives (1 < 50)',
    team: null,
  }),
}));

vi.mock('../learn/report-generator.js', () => ({
  generateLearningReport: vi.fn().mockReturnValue({
    markdown: '# Report',
    sessionId: 'learn-123',
    primitivesAdded: 1,
    primitivesUpdated: 0,
    primitivesSkipped: 0,
    conflictsPresented: 0,
    skillCount: 0,
    agentCount: 0,
    teamCount: 0,
  }),
}));

// === Import SUT after mocks ===

import { scLearn } from './sc-learn.js';
import type { ScLearnOptions, ScLearnResult } from './sc-learn.js';
import { acquireSource } from '../learn/acquirer.js';
import { sanitizeContent } from '../learn/sanitizer.js';
import { hitlGate } from '../learn/hitl-gate.js';
import { analyzeDocument } from '../learn/analyzer.js';
import { extractPrimitives } from '../learn/extractor.js';
import { wireDependencies } from '../learn/dependency-wirer.js';
import { prefilterDuplicates } from '../learn/dedup-prefilter.js';
import { compareSemantically } from '../learn/semantic-comparator.js';
import { createMergeEngine } from '../learn/merge-engine.js';
import { createChangesetManager } from '../learn/changeset-manager.js';
import { generateLearnedSkill } from '../learn/generators/skill-generator.js';
import { generateAgent } from '../learn/generators/agent-generator.js';
import { generateTeam } from '../learn/generators/team-generator.js';
import { generateLearningReport } from '../learn/report-generator.js';

// === Default return values ===

const DEFAULT_STAGED = [{
  filename: 'test.md',
  content: '# Test\n\nDefinition 1.1: A group is a set with a binary operation.',
  byteSize: 100,
  encoding: 'utf-8',
  sourceFile: 'test.md',
}];

function setDefaultMockReturns(): void {
  // Hoisted mocks
  mockGetProvenanceChain.mockReturnValue([{
    sessionId: 'learn-123',
    timestamp: new Date().toISOString(),
    candidateId: 'foundations-group',
    existingId: null,
    action: 'add-new',
    rationale: 'No existing match.',
  }]);
  mockMerge.mockReturnValue({
    action: 'add',
    modifications: [{
      type: 'add',
      primitiveId: 'foundations-group',
      primitive: { id: 'foundations-group', domain: 'foundations' },
    }],
    provenance: {
      sessionId: 'learn-123',
      timestamp: new Date().toISOString(),
      candidateId: 'foundations-group',
      existingId: null,
      action: 'add-new',
      rationale: 'No existing match.',
    },
  });
  mockGetChangeset.mockReturnValue({
    sessionId: 'learn-123',
    createdAt: new Date().toISOString(),
    entries: [],
    reverted: false,
  });

  // Module-level mocks (cleared by vi.clearAllMocks)
  vi.mocked(acquireSource).mockResolvedValue({
    source: { input: 'test.md', type: 'local-file', familiarity: 'HOME' },
    staged: DEFAULT_STAGED,
    stagingDir: '/tmp/staging',
    timestamp: new Date().toISOString(),
    errors: [],
  });
  vi.mocked(sanitizeContent).mockResolvedValue({
    source: { input: 'test.md', type: 'local-file', familiarity: 'HOME' },
    staged: DEFAULT_STAGED,
    report: { findings: [], tier: 'HOME', passed: true, summary: '0 findings', checkedAt: new Date().toISOString() },
    autoApproved: true,
  });
  vi.mocked(hitlGate).mockResolvedValue({
    decision: { status: 'approved', rationale: 'Auto-approved', reviewedFindings: 0, decidedAt: new Date().toISOString(), decidedBy: 'auto' },
    sanitizationResult: {
      source: { input: 'test.md', type: 'local-file', familiarity: 'HOME' },
      staged: DEFAULT_STAGED,
      report: { findings: [], tier: 'HOME', passed: true, summary: '0 findings', checkedAt: new Date().toISOString() },
      autoApproved: true,
    },
    proceed: true,
  });
  vi.mocked(analyzeDocument).mockReturnValue({
    sections: [{ title: 'Test', level: 1, content: 'Definition 1.1: A group is a set.', children: [], startIndex: 0 }],
    contentType: 'textbook',
    detectedDomain: 'foundations',
    planePosition: { real: -0.5, imaginary: 0.5 },
    confidence: 0.8,
    keywords: ['group', 'set', 'binary', 'operation'],
    wordCount: 20,
    sectionCount: 1,
  });
  vi.mocked(extractPrimitives).mockReturnValue({
    candidates: [{
      id: 'foundations-group',
      name: 'Group',
      type: 'definition',
      domain: 'foundations',
      chapter: 1,
      section: '1.1',
      planePosition: { real: -0.5, imaginary: 0.5 },
      formalStatement: 'A group is a set with a binary operation.',
      computationalForm: 'Defines: A group is a set with a binary operation',
      prerequisites: [],
      dependencies: [],
      enables: [],
      compositionRules: [],
      applicabilityPatterns: ['group', 'set'],
      keywords: ['group', 'set', 'binary'],
      tags: ['textbook', 'foundations'],
      buildLabs: [],
      sourceSection: 'Test',
      sourceOffset: 0,
      extractionConfidence: 0.9,
    }],
    contentType: 'textbook',
    domain: 'foundations',
    totalSectionsProcessed: 1,
    extractionMethod: 'textbook-heuristic',
  });
  vi.mocked(wireDependencies).mockReturnValue({
    wiredPrimitives: [{
      id: 'foundations-group',
      name: 'Group',
      type: 'definition',
      domain: 'foundations',
      chapter: 1,
      section: '1.1',
      planePosition: { real: -0.5, imaginary: 0.5 },
      formalStatement: 'A group is a set with a binary operation.',
      computationalForm: 'Defines: A group is a set with a binary operation',
      prerequisites: [],
      dependencies: [],
      enables: [],
      compositionRules: [],
      applicabilityPatterns: ['group', 'set'],
      keywords: ['group', 'set', 'binary'],
      tags: ['textbook', 'foundations'],
      buildLabs: [],
      sourceSection: 'Test',
      sourceOffset: 0,
      extractionConfidence: 0.9,
    }],
    edgesAdded: 0,
    enablesAdded: 0,
    prerequisitesAdded: 0,
  });
  vi.mocked(prefilterDuplicates).mockReturnValue({
    candidateId: 'foundations-group',
    matches: [],
    flagged: false,
  });
  vi.mocked(compareSemantically).mockReturnValue({
    candidateId: 'foundations-group',
    comparisons: [],
    bestMatch: null,
  });
  vi.mocked(generateLearnedSkill).mockReturnValue({
    generated: false,
    reason: 'Insufficient primitives (1 < 30)',
    skill: null,
  });
  vi.mocked(generateAgent).mockReturnValue({
    generated: false,
    reason: 'Insufficient primitives (1 < 30)',
    agent: null,
  });
  vi.mocked(generateTeam).mockReturnValue({
    generated: false,
    reason: 'Insufficient primitives (1 < 50)',
    team: null,
  });
  vi.mocked(generateLearningReport).mockReturnValue({
    markdown: '# Report',
    sessionId: 'learn-123',
    primitivesAdded: 1,
    primitivesUpdated: 0,
    primitivesSkipped: 0,
    conflictsPresented: 0,
    skillCount: 0,
    agentCount: 0,
    teamCount: 0,
  });
}

// === Tests ===

describe('sc:learn: pipeline orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultMockReturns();
  });

  it('calls all 7 pipeline stages in order', async () => {
    const callOrder: string[] = [];
    vi.mocked(acquireSource).mockImplementation(async () => {
      callOrder.push('acquire');
      return {
        source: { input: 'test.md', type: 'local-file' as const, familiarity: 'HOME' as const },
        staged: [{ filename: 'test.md', content: 'Definition 1.1: group', byteSize: 50, encoding: 'utf-8', sourceFile: 'test.md' }],
        stagingDir: '/tmp', timestamp: new Date().toISOString(), errors: [],
      };
    });
    vi.mocked(sanitizeContent).mockImplementation(async (r) => {
      callOrder.push('sanitize');
      return { source: r.source, staged: r.staged, report: { findings: [], tier: 'HOME' as const, passed: true, summary: '', checkedAt: '' }, autoApproved: true };
    });
    vi.mocked(hitlGate).mockImplementation(async (r) => {
      callOrder.push('hitl');
      return { decision: { status: 'approved' as const, rationale: '', reviewedFindings: 0, decidedAt: '', decidedBy: 'auto' as const }, sanitizationResult: r, proceed: true };
    });
    vi.mocked(analyzeDocument).mockImplementation(() => {
      callOrder.push('analyze');
      return { sections: [{ title: 'T', level: 1, content: 'Def', children: [], startIndex: 0 }], contentType: 'textbook' as const, detectedDomain: 'foundations', planePosition: { real: 0, imaginary: 0 }, confidence: 0.8, keywords: ['group'], wordCount: 5, sectionCount: 1 };
    });
    vi.mocked(extractPrimitives).mockImplementation(() => {
      callOrder.push('extract');
      return { candidates: [{ id: 'test', name: 'Test', type: 'definition' as const, domain: 'foundations' as const, chapter: 1, section: '1', planePosition: { real: 0, imaginary: 0 }, formalStatement: 'fs', computationalForm: 'cf', prerequisites: [], dependencies: [], enables: [], compositionRules: [], applicabilityPatterns: [], keywords: [], tags: [], buildLabs: [], sourceSection: 'T', sourceOffset: 0, extractionConfidence: 0.9 }], contentType: 'textbook' as const, domain: 'foundations', totalSectionsProcessed: 1, extractionMethod: 'textbook-heuristic' };
    });
    vi.mocked(wireDependencies).mockImplementation((c) => {
      callOrder.push('wire');
      return { wiredPrimitives: c as any, edgesAdded: 0, enablesAdded: 0, prerequisitesAdded: 0 };
    });
    vi.mocked(prefilterDuplicates).mockImplementation(() => {
      callOrder.push('dedup');
      return { candidateId: 'test', matches: [], flagged: false };
    });
    mockMerge.mockImplementation(() => {
      callOrder.push('merge');
      return { action: 'add', modifications: [{ type: 'add', primitiveId: 'test', primitive: { id: 'test', domain: 'foundations' } }], provenance: { sessionId: 's', timestamp: '', candidateId: 'test', existingId: null, action: 'add-new', rationale: '' } };
    });
    mockGetProvenanceChain.mockReturnValue([{ sessionId: 's', timestamp: '', candidateId: 'test', existingId: null, action: 'add-new', rationale: '' }]);
    vi.mocked(generateLearnedSkill).mockImplementation(() => {
      callOrder.push('gen-skill');
      return { generated: false, reason: 'below threshold', skill: null };
    });
    vi.mocked(generateAgent).mockImplementation(() => {
      callOrder.push('gen-agent');
      return { generated: false, reason: 'below threshold', agent: null };
    });
    vi.mocked(generateTeam).mockImplementation(() => {
      callOrder.push('gen-team');
      return { generated: false, reason: 'below threshold', team: null };
    });
    vi.mocked(generateLearningReport).mockImplementation(() => {
      callOrder.push('report');
      return { markdown: '# R', sessionId: 's', primitivesAdded: 1, primitivesUpdated: 0, primitivesSkipped: 0, conflictsPresented: 0, skillCount: 0, agentCount: 0, teamCount: 0 };
    });

    await scLearn('test.md');

    expect(callOrder).toEqual([
      'acquire', 'sanitize', 'hitl', 'analyze', 'extract', 'wire',
      'dedup', 'merge',
      'gen-skill', 'gen-agent', 'gen-team',
      'report',
    ]);
  });

  it('passes source to acquireSource', async () => {
    await scLearn('my-doc.md');
    expect(acquireSource).toHaveBeenCalledWith('my-doc.md', expect.objectContaining({}));
  });

  it('passes acquisition result to sanitizer', async () => {
    const mockAcqResult = {
      source: { input: 'test.md', type: 'local-file' as const, familiarity: 'HOME' as const },
      staged: [{ filename: 'test.md', content: 'content', byteSize: 7, encoding: 'utf-8', sourceFile: 'test.md' }],
      stagingDir: '/tmp', timestamp: '', errors: [],
    };
    vi.mocked(acquireSource).mockResolvedValue(mockAcqResult);

    await scLearn('test.md');
    expect(sanitizeContent).toHaveBeenCalledWith(mockAcqResult);
  });

  it('passes sanitization result to HITL gate', async () => {
    await scLearn('test.md');
    expect(hitlGate).toHaveBeenCalledWith(
      expect.objectContaining({ autoApproved: true }),
      undefined,
    );
  });

  it('returns success=true and sessionId on successful run', async () => {
    const result = await scLearn('test.md');
    expect(result.success).toBe(true);
    expect(result.sessionId).toMatch(/^learn-\d+$/);
  });

  it('includes report in result', async () => {
    const result = await scLearn('test.md');
    expect(result.report).toBeDefined();
    expect(result.report.sessionId).toBeDefined();
  });
});

describe('sc:learn: options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultMockReturns();
  });

  it('--domain overrides detected domain by passing to extractPrimitives', async () => {
    await scLearn('test.md', { domain: 'waves' });
    expect(extractPrimitives).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ domain: 'waves' }),
    );
  });

  it('--scope passed to acquireSource', async () => {
    await scLearn('test.md', { scope: ['src/', 'lib/'] });
    expect(acquireSource).toHaveBeenCalledWith('test.md', expect.objectContaining({ githubScope: ['src/', 'lib/'] }));
  });

  it('--depth shallow skips dependency wiring', async () => {
    await scLearn('test.md', { depth: 'shallow' });
    expect(wireDependencies).not.toHaveBeenCalled();
  });

  it('--depth standard runs dependency wiring', async () => {
    await scLearn('test.md', { depth: 'standard' });
    expect(wireDependencies).toHaveBeenCalled();
  });

  it('--depth deep runs dependency wiring', async () => {
    await scLearn('test.md', { depth: 'deep' });
    expect(wireDependencies).toHaveBeenCalled();
  });

  it('promptFn passed to hitlGate', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    await scLearn('test.md', { promptFn: mockPrompt });
    expect(hitlGate).toHaveBeenCalledWith(expect.anything(), mockPrompt);
  });
});

describe('sc:learn: progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultMockReturns();
  });

  it('calls onProgress for each pipeline stage', async () => {
    const stages: string[] = [];
    const onProgress = vi.fn((stage: string) => {
      stages.push(stage);
    });

    await scLearn('test.md', { onProgress });

    expect(stages).toContain('acquire');
    expect(stages).toContain('sanitize');
    expect(stages).toContain('hitl');
    expect(stages).toContain('analyze');
    expect(stages).toContain('extract');
    expect(stages).toContain('dedup');
    expect(stages).toContain('generate');
    expect(stages).toContain('report');
  });

  it('stage names match expected set', async () => {
    const expectedStages = ['acquire', 'sanitize', 'hitl', 'analyze', 'extract', 'dedup', 'generate', 'report'];
    const receivedStages: string[] = [];
    const onProgress = vi.fn((stage: string) => {
      receivedStages.push(stage);
    });

    await scLearn('test.md', { onProgress });

    for (const expected of expectedStages) {
      expect(receivedStages).toContain(expected);
    }
  });

  it('does not throw when onProgress is not provided', async () => {
    await expect(scLearn('test.md')).resolves.toBeDefined();
  });
});

describe('sc:learn: error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProvenanceChain.mockReturnValue([]);
    mockMerge.mockReturnValue({
      action: 'add',
      modifications: [],
      provenance: { sessionId: 's', timestamp: '', candidateId: '', existingId: null, action: 'add-new', rationale: '' },
    });
    mockGetChangeset.mockReturnValue({ sessionId: 's', createdAt: '', entries: [], reverted: false });
  });

  it('HITL rejection returns early', async () => {
    vi.mocked(hitlGate).mockResolvedValue({
      decision: { status: 'rejected', rationale: 'User rejected', reviewedFindings: 0, decidedAt: '', decidedBy: 'user' },
      sanitizationResult: {
        source: { input: 'test.md', type: 'local-file', familiarity: 'HOME' },
        staged: [],
        report: { findings: [], tier: 'HOME', passed: true, summary: '', checkedAt: '' },
        autoApproved: false,
      },
      proceed: false,
    });

    const result = await scLearn('test.md');

    // Should not reach analyze/extract stages
    expect(analyzeDocument).not.toHaveBeenCalled();
    expect(extractPrimitives).not.toHaveBeenCalled();
    expect(result.errors).toContain('Content rejected at HITL gate');
  });

  it('acquisition exception returns success=false', async () => {
    vi.mocked(acquireSource).mockRejectedValue(new Error('File not found: missing.md'));

    const result = await scLearn('missing.md');

    expect(result.success).toBe(false);
    expect(result.errors).toContain('File not found: missing.md');
    // Should not reach further stages
    expect(sanitizeContent).not.toHaveBeenCalled();
  });

  it('fatal acquisition errors return success=false', async () => {
    vi.mocked(acquireSource).mockResolvedValue({
      source: { input: 'bad.md', type: 'local-file', familiarity: 'HOME' },
      staged: [],
      stagingDir: '/tmp',
      timestamp: '',
      errors: [{ file: 'bad.md', reason: 'Binary content', fatal: true }],
    });

    const result = await scLearn('bad.md');

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(sanitizeContent).not.toHaveBeenCalled();
  });

  it('non-fatal acquisition errors do not prevent pipeline from continuing', async () => {
    vi.mocked(acquireSource).mockResolvedValue({
      source: { input: 'test.md', type: 'local-file', familiarity: 'HOME' },
      staged: [{ filename: 'test.md', content: 'content', byteSize: 7, encoding: 'utf-8', sourceFile: 'test.md' }],
      stagingDir: '/tmp',
      timestamp: '',
      errors: [{ file: 'extra.pdf', reason: 'Unsupported', fatal: false }],
    });

    const result = await scLearn('test.md');

    expect(sanitizeContent).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});

describe('sc:learn: dry-run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultMockReturns();
  });

  it('full pipeline runs in dry-run mode', async () => {
    const result = await scLearn('test.md', { dryRun: true });

    // All stages should have been called
    expect(acquireSource).toHaveBeenCalled();
    expect(sanitizeContent).toHaveBeenCalled();
    expect(hitlGate).toHaveBeenCalled();
    expect(analyzeDocument).toHaveBeenCalled();
    expect(extractPrimitives).toHaveBeenCalled();
    expect(prefilterDuplicates).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('report is generated in dry-run mode', async () => {
    const result = await scLearn('test.md', { dryRun: true });
    expect(generateLearningReport).toHaveBeenCalled();
    expect(result.report).toBeDefined();
  });

  it('changeset is null in dry-run mode', async () => {
    const result = await scLearn('test.md', { dryRun: true });
    expect(result.changeset).toBeNull();
  });

  it('no modifications recorded to changeset manager in dry-run mode', async () => {
    await scLearn('test.md', { dryRun: true });
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it('modifications are recorded when not in dry-run mode', async () => {
    await scLearn('test.md', { dryRun: false });
    expect(mockRecord).toHaveBeenCalled();
  });
});
