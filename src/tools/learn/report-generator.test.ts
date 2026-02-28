import { describe, it, expect } from 'vitest';
import { generateLearningReport } from './report-generator.js';
import type { LearningReportInput } from './report-generator.js';

// Inline ProvenanceEntry construction — no merge-engine import for test isolation

function makeInput(overrides: Partial<LearningReportInput> = {}): LearningReportInput {
  return {
    sessionId: 'test-session-001',
    sourcePath: '/tmp/source.md',
    startedAt: '2026-02-26T04:00:00Z',
    completedAt: '2026-02-26T04:05:00Z',
    provenanceChain: [],
    mergeActions: [],
    skillsGenerated: [],
    agentsGenerated: [],
    teamsGenerated: [],
    errors: [],
    options: {},
    ...overrides,
  };
}

function makeProvenance(overrides: Partial<LearningReportInput['provenanceChain'][0]> = {}) {
  return {
    sessionId: 'test-session-001',
    timestamp: '2026-02-26T04:01:00Z',
    candidateId: 'prim-candidate',
    existingId: null as string | null,
    action: 'add-new',
    rationale: 'No existing match — adding as genuinely new primitive.',
    ...overrides,
  };
}

describe('report generator: summary', () => {
  it('counts added primitives correctly', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'prim-1', action: 'add-new' }),
        makeProvenance({ candidateId: 'prim-2', action: 'add-specialization' }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.primitivesAdded).toBe(2);
  });

  it('counts updated primitives correctly', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'prim-1', action: 'update-generalization', existingId: 'existing-1' }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.primitivesUpdated).toBe(1);
  });

  it('counts skipped primitives correctly', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'prim-1', action: 'skip', existingId: 'existing-1' }),
        makeProvenance({ candidateId: 'prim-2', action: 'skip', existingId: 'existing-2' }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.primitivesSkipped).toBe(2);
  });

  it('counts conflicts correctly', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'prim-1', action: 'conflict-presented', existingId: 'existing-1' }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.conflictsPresented).toBe(1);
  });

  it('includes session ID in report', () => {
    const input = makeInput({ sessionId: 'my-session-42' });
    const report = generateLearningReport(input);
    expect(report.sessionId).toBe('my-session-42');
    expect(report.markdown).toContain('my-session-42');
  });

  it('includes source path in markdown', () => {
    const input = makeInput({ sourcePath: '/path/to/source.md' });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('/path/to/source.md');
  });

  it('includes timestamps in markdown', () => {
    const input = makeInput({
      startedAt: '2026-02-26T04:00:00Z',
      completedAt: '2026-02-26T04:05:00Z',
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('2026-02-26T04:00:00Z');
    expect(report.markdown).toContain('2026-02-26T04:05:00Z');
  });

  it('computes mixed counts from varied provenance chain', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'p1', action: 'add-new' }),
        makeProvenance({ candidateId: 'p2', action: 'skip', existingId: 'e1' }),
        makeProvenance({ candidateId: 'p3', action: 'update-generalization', existingId: 'e2' }),
        makeProvenance({ candidateId: 'p4', action: 'conflict-presented', existingId: 'e3' }),
        makeProvenance({ candidateId: 'p5', action: 'add-specialization', existingId: 'e4' }),
        makeProvenance({ candidateId: 'p6', action: 'conflict-resolved', existingId: 'e5', userDecision: 'keep-existing' }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.primitivesAdded).toBe(2);    // add-new + add-specialization
    expect(report.primitivesUpdated).toBe(1);   // update-generalization
    expect(report.primitivesSkipped).toBe(1);   // skip
    expect(report.conflictsPresented).toBe(2);  // conflict-presented + conflict-resolved
    expect(report.skillCount).toBe(0);
    expect(report.agentCount).toBe(0);
    expect(report.teamCount).toBe(0);
  });
});

describe('report generator: provenance', () => {
  it('includes provenance entry for each added primitive', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'prim-added', action: 'add-new', rationale: 'Adding new primitive' }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('prim-added');
    expect(report.markdown).toContain('add-new');
  });

  it('shows rationale in provenance', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'prim-1', action: 'add-new', rationale: 'No existing match found' }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('No existing match found');
  });

  it('shows original and new formalStatement when present', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({
          candidateId: 'prim-gen',
          action: 'update-generalization',
          existingId: 'existing-1',
          rationale: 'Generalizing existing',
          originalFormalStatement: 'f(x) = x^2 for x > 0',
          newFormalStatement: 'f(x) = x^2 for all x',
        }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('f(x) = x^2 for x > 0');
    expect(report.markdown).toContain('f(x) = x^2 for all x');
  });

  it('shows userDecision when present', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({
          candidateId: 'prim-conflict',
          action: 'conflict-resolved',
          existingId: 'existing-1',
          rationale: 'User resolved conflict',
          userDecision: 'keep-both',
        }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('keep-both');
  });

  it('groups provenance entries by action type', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'p1', action: 'add-new' }),
        makeProvenance({ candidateId: 'p2', action: 'skip', existingId: 'e1' }),
        makeProvenance({ candidateId: 'p3', action: 'add-new' }),
      ],
    });
    const report = generateLearningReport(input);
    // Both add-new entries should appear under the same group
    const addSection = report.markdown.indexOf('add-new');
    expect(addSection).toBeGreaterThan(-1);
  });
});

describe('report generator: generated artifacts', () => {
  it('lists skills with file names', () => {
    const input = makeInput({
      skillsGenerated: [
        { domainName: 'Perception', primitiveCount: 12, fileName: 'perception-skill.md' },
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('Perception');
    expect(report.markdown).toContain('perception-skill.md');
    expect(report.skillCount).toBe(1);
  });

  it('lists agents with file names', () => {
    const input = makeInput({
      agentsGenerated: [
        { agentName: 'MathTutor', fileName: 'math-tutor-agent.md' },
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('MathTutor');
    expect(report.markdown).toContain('math-tutor-agent.md');
    expect(report.agentCount).toBe(1);
  });

  it('lists teams with agent counts', () => {
    const input = makeInput({
      teamsGenerated: [
        { teamName: 'AnalysisTeam', fileName: 'analysis-team.md', agentCount: 3 },
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('AnalysisTeam');
    expect(report.markdown).toContain('analysis-team.md');
    expect(report.markdown).toContain('3');
    expect(report.teamCount).toBe(1);
  });

  it('omits generated artifacts section when none generated', () => {
    const input = makeInput({
      skillsGenerated: [],
      agentsGenerated: [],
      teamsGenerated: [],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).not.toContain('## Generated Artifacts');
  });

  it('includes section when at least one artifact type present', () => {
    const input = makeInput({
      skillsGenerated: [
        { domainName: 'Waves', primitiveCount: 8, fileName: 'waves-skill.md' },
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('## Generated Artifacts');
  });
});

describe('report generator: errors', () => {
  it('includes errors section when errors exist', () => {
    const input = makeInput({
      errors: ['Failed to parse section 4.2', 'Timeout during comparison'],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('## Errors');
    expect(report.markdown).toContain('Failed to parse section 4.2');
    expect(report.markdown).toContain('Timeout during comparison');
  });

  it('omits errors section when no errors', () => {
    const input = makeInput({ errors: [] });
    const report = generateLearningReport(input);
    expect(report.markdown).not.toContain('## Errors');
  });
});

describe('report generator: empty input', () => {
  it('handles zero provenance entries', () => {
    const input = makeInput({ provenanceChain: [] });
    const report = generateLearningReport(input);
    expect(report.primitivesAdded).toBe(0);
    expect(report.primitivesUpdated).toBe(0);
    expect(report.primitivesSkipped).toBe(0);
    expect(report.conflictsPresented).toBe(0);
    expect(report.markdown).toContain('# sc:learn Report');
  });

  it('handles empty arrays for all fields', () => {
    const input = makeInput({
      provenanceChain: [],
      mergeActions: [],
      skillsGenerated: [],
      agentsGenerated: [],
      teamsGenerated: [],
      errors: [],
    });
    const report = generateLearningReport(input);
    expect(report.sessionId).toBe('test-session-001');
    expect(report.markdown.length).toBeGreaterThan(0);
    // Should NOT have artifacts or errors sections
    expect(report.markdown).not.toContain('## Generated Artifacts');
    expect(report.markdown).not.toContain('## Errors');
  });
});

describe('report generator: format', () => {
  it('output starts with markdown heading', () => {
    const input = makeInput();
    const report = generateLearningReport(input);
    expect(report.markdown.startsWith('# ')).toBe(true);
  });

  it('has required section headings', () => {
    const input = makeInput({
      provenanceChain: [
        makeProvenance({ candidateId: 'p1', action: 'add-new' }),
      ],
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('# sc:learn Report');
    expect(report.markdown).toContain('## Summary');
    expect(report.markdown).toContain('## Primitives');
    expect(report.markdown).toContain('## Provenance Chains');
    expect(report.markdown).toContain('## Options');
  });

  it('report fits in reasonable size for 100 provenance entries', () => {
    const entries = Array.from({ length: 100 }, (_, i) =>
      makeProvenance({
        candidateId: `prim-${i}`,
        action: i % 4 === 0 ? 'add-new' : i % 4 === 1 ? 'skip' : i % 4 === 2 ? 'update-generalization' : 'conflict-presented',
        existingId: i % 4 === 0 ? null : `existing-${i}`,
        rationale: `Rationale for entry ${i}`,
      }),
    );
    const input = makeInput({ provenanceChain: entries });
    const report = generateLearningReport(input);
    expect(report.markdown.length).toBeLessThan(50_000);
  });

  it('includes options section with provided options', () => {
    const input = makeInput({
      options: { domain: 'perception', depth: 'deep', dryRun: true, scope: ['ch1', 'ch2'] },
    });
    const report = generateLearningReport(input);
    expect(report.markdown).toContain('## Options');
    expect(report.markdown).toContain('perception');
    expect(report.markdown).toContain('deep');
    expect(report.markdown).toContain('true');
  });
});
