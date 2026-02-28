/**
 * Tests for the intake flow orchestrator.
 *
 * Verifies three-path routing (clear/gaps/confused), "anything else?"
 * confirmation, crash recovery via step tracker, and hygiene integration.
 *
 * Uses dependency injection (IntakeDependencies) to isolate each test
 * from real filesystem and hygiene modules.
 *
 * @module staging/intake-flow/orchestrator.test
 */

import { describe, it, expect, vi } from 'vitest';
import type { IntakeDependencies, IntakeFlowResult } from './orchestrator.js';
import { runIntakeFlow, confirmIntake, resumeIntakeFlow } from './orchestrator.js';
import type { ClarityAssessment } from './types.js';
import type { HygieneReport } from '../hygiene/report.js';
import type { IntakeFlowState, IntakeFlowStep } from './step-types.js';

// ---------------------------------------------------------------------------
// Helpers: default mocks
// ---------------------------------------------------------------------------

/** Build a clean hygiene report with no findings. */
function cleanReport(overrides?: Partial<HygieneReport>): HygieneReport {
  return {
    tier: 'stranger',
    filtered: false,
    totalFindings: 0,
    findings: [],
    summary: { critical: 0, warning: 0, notice: 0, info: 0 },
    overallRisk: 'clean',
    generatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Build a clear assessment. */
function clearAssessment(overrides?: Partial<ClarityAssessment>): ClarityAssessment {
  return {
    route: 'clear',
    reason: 'Well-structured document',
    confidence: 0.85,
    gaps: [],
    sections: ['Goals', 'Approach', 'Deliverables'],
    ...overrides,
  };
}

/** Build a gaps assessment. */
function gapsAssessment(overrides?: Partial<ClarityAssessment>): ClarityAssessment {
  return {
    route: 'gaps',
    reason: 'Missing key areas',
    confidence: 0.55,
    gaps: [
      { area: 'goals/purpose', question: 'What are the specific goals?' },
      { area: 'constraints', question: 'What constraints exist?' },
    ],
    sections: ['Overview'],
    ...overrides,
  };
}

/** Build a confused assessment. */
function confusedAssessment(overrides?: Partial<ClarityAssessment>): ClarityAssessment {
  return {
    route: 'confused',
    reason: 'Document is too minimal',
    confidence: 0.15,
    gaps: [],
    sections: [],
    ...overrides,
  };
}

/** Recorded step calls for tracking. */
type StepCall = { step: IntakeFlowStep; metadataPath: string; data?: Partial<IntakeFlowState> };

/** Build default mock dependencies. */
function createMockDeps(overrides?: Partial<IntakeDependencies>): IntakeDependencies {
  const recordStepCalls: StepCall[] = [];

  return {
    scanContent: vi.fn().mockReturnValue([]),
    classifyFamiliarity: vi.fn().mockReturnValue({ tier: 'stranger', reason: 'test' }),
    generateHygieneReport: vi.fn().mockReturnValue(cleanReport()),
    assessClarity: vi.fn().mockReturnValue(clearAssessment()),
    moveDocument: vi.fn().mockResolvedValue({ documentPath: '/doc', metadataPath: '/meta' }),
    recordStep: vi.fn().mockImplementation(async (step, metadataPath, data) => {
      recordStepCalls.push({ step, metadataPath, data });
    }),
    getResumePoint: vi.fn().mockResolvedValue(null),
    readFlowState: vi.fn().mockResolvedValue({
      currentStep: 'staged',
      completedSteps: [],
    } satisfies IntakeFlowState),
    readFile: vi.fn().mockResolvedValue('# Document\n\nSome content here.'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runIntakeFlow', () => {
  const basePath = '/project';
  const filename = 'my-doc.md';
  const source = 'console';

  it('routes clear documents with needsConfirmation=true', async () => {
    const deps = createMockDeps();
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    expect(result.route).toBe('clear');
    expect(result.needsConfirmation).toBe(true);
    expect(result.questions).toEqual([]);
    expect(result.step).toBe('assessed');
  });

  it('routes gaps documents with targeted questions', async () => {
    const assessment = gapsAssessment();
    const deps = createMockDeps({
      assessClarity: vi.fn().mockReturnValue(assessment),
    });
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    expect(result.route).toBe('gaps');
    expect(result.needsConfirmation).toBe(false);
    expect(result.questions).toEqual(assessment.gaps);
    expect(result.questions.length).toBe(2);
    expect(result.step).toBe('assessed');
  });

  it('routes confused documents with empty questions', async () => {
    const deps = createMockDeps({
      assessClarity: vi.fn().mockReturnValue(confusedAssessment()),
    });
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    expect(result.route).toBe('confused');
    expect(result.needsConfirmation).toBe(false);
    expect(result.questions).toEqual([]);
    expect(result.step).toBe('assessed');
  });

  it('moves document to checking during hygiene step', async () => {
    const deps = createMockDeps();
    await runIntakeFlow({ basePath, filename, source, deps });

    expect(deps.moveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath,
        filename,
        fromState: 'inbox',
        toState: 'checking',
      }),
    );
  });

  it('includes hygiene findings in result', async () => {
    const report = cleanReport({
      totalFindings: 2,
      findings: [
        {
          source: 'pattern',
          id: 'test-pattern',
          importance: 'warning',
          title: 'Test finding',
          description: 'Test description',
          suggestion: 'Fix it',
          isCritical: false,
        },
      ],
      summary: { critical: 0, warning: 1, notice: 0, info: 0 },
      overallRisk: 'warning' as const,
    });
    const deps = createMockDeps({
      generateHygieneReport: vi.fn().mockReturnValue(report),
    });
    // overallRisk is 'warning' so it should move to attention and stop
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    expect(result.hygieneReport).toBe(report);
    expect(result.hygieneReport.totalFindings).toBe(2);
  });

  it('records hygiene and assessed steps in sequence', async () => {
    const deps = createMockDeps();
    await runIntakeFlow({ basePath, filename, source, deps });

    const recordStep = deps.recordStep as ReturnType<typeof vi.fn>;
    // Should have been called at least for 'hygiene' and 'assessed'
    const stepCalls = recordStep.mock.calls.map((c: unknown[]) => c[0]);
    expect(stepCalls).toContain('hygiene');
    expect(stepCalls).toContain('assessed');
    // 'hygiene' should come before 'assessed'
    const hygieneIdx = stepCalls.indexOf('hygiene');
    const assessedIdx = stepCalls.indexOf('assessed');
    expect(hygieneIdx).toBeLessThan(assessedIdx);
  });

  it('moves risky hygiene to attention and pauses flow', async () => {
    const riskyReport = cleanReport({
      overallRisk: 'critical',
      totalFindings: 3,
    });
    const deps = createMockDeps({
      generateHygieneReport: vi.fn().mockReturnValue(riskyReport),
    });
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    // Should move from checking to attention
    expect(deps.moveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        fromState: 'checking',
        toState: 'attention',
      }),
    );
    // Flow paused at hygiene step
    expect(result.step).toBe('hygiene');
    expect(result.hygieneReport.overallRisk).toBe('critical');
    // assessClarity should NOT have been called
    expect(deps.assessClarity).not.toHaveBeenCalled();
  });

  it('generates correct message for clear route', async () => {
    const deps = createMockDeps();
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    expect(result.message).toBe('Document is clear and ready to queue');
  });

  it('generates correct message for gaps route', async () => {
    const assessment = gapsAssessment();
    const deps = createMockDeps({
      assessClarity: vi.fn().mockReturnValue(assessment),
    });
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    expect(result.message).toBe('Document has 2 gaps that need clarification');
  });

  it('generates correct message for confused route', async () => {
    const deps = createMockDeps({
      assessClarity: vi.fn().mockReturnValue(confusedAssessment()),
    });
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    expect(result.message).toBe('Document needs restatement before proceeding');
  });

  it('handles warning-level hygiene risk by moving to attention', async () => {
    const warningReport = cleanReport({
      overallRisk: 'warning',
      totalFindings: 1,
    });
    const deps = createMockDeps({
      generateHygieneReport: vi.fn().mockReturnValue(warningReport),
    });
    const result = await runIntakeFlow({ basePath, filename, source, deps });

    expect(deps.moveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        fromState: 'checking',
        toState: 'attention',
      }),
    );
    expect(result.step).toBe('hygiene');
  });
});

describe('confirmIntake', () => {
  const basePath = '/project';
  const filename = 'my-doc.md';

  it('confirms and queues a clear document', async () => {
    const assessment = clearAssessment();
    const hygieneReport = cleanReport();

    const deps = createMockDeps({
      readFlowState: vi.fn().mockResolvedValue({
        currentStep: 'assessed',
        completedSteps: ['staged', 'hygiene', 'assessed'],
        assessment,
        hygieneReport: { overallRisk: 'clean', findingCount: 0 },
      } satisfies IntakeFlowState),
      readFile: vi.fn().mockResolvedValue('# Doc content'),
    });

    // For confirmIntake, we also need to set up assessClarity and generateHygieneReport
    // since it re-builds the result. The deps from readFlowState carry the assessment.
    (deps.assessClarity as ReturnType<typeof vi.fn>).mockReturnValue(assessment);
    (deps.generateHygieneReport as ReturnType<typeof vi.fn>).mockReturnValue(hygieneReport);

    const result = await confirmIntake({ basePath, filename, deps });

    expect(result.step).toBe('confirmed');
    expect(result.route).toBe('clear');
    expect(result.needsConfirmation).toBe(false);

    // Should record 'confirmed' step
    expect(deps.recordStep).toHaveBeenCalledWith(
      'confirmed',
      expect.any(String),
      expect.objectContaining({ userConfirmed: true }),
    );

    // Should move from checking to ready
    expect(deps.moveDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        fromState: 'checking',
        toState: 'ready',
      }),
    );
  });

  it('passes additional context through to step tracker', async () => {
    const assessment = clearAssessment();

    const deps = createMockDeps({
      readFlowState: vi.fn().mockResolvedValue({
        currentStep: 'assessed',
        completedSteps: ['staged', 'hygiene', 'assessed'],
        assessment,
        hygieneReport: { overallRisk: 'clean', findingCount: 0 },
      } satisfies IntakeFlowState),
    });
    (deps.assessClarity as ReturnType<typeof vi.fn>).mockReturnValue(assessment);

    await confirmIntake({ basePath, filename, additionalContext: 'Extra info here', deps });

    expect(deps.recordStep).toHaveBeenCalledWith(
      'confirmed',
      expect.any(String),
      expect.objectContaining({
        userConfirmed: true,
        additionalContext: 'Extra info here',
      }),
    );
  });
});

describe('resumeIntakeFlow', () => {
  const basePath = '/project';
  const filename = 'my-doc.md';

  it('resumes from hygiene step forward', async () => {
    const deps = createMockDeps({
      getResumePoint: vi.fn().mockResolvedValue('hygiene' as IntakeFlowStep),
      readFlowState: vi.fn().mockResolvedValue({
        currentStep: 'staged',
        completedSteps: ['staged'],
      } satisfies IntakeFlowState),
    });
    const result = await resumeIntakeFlow({ basePath, filename, source: 'console', deps });

    expect(result).not.toBeNull();
    // Should have run hygiene scan + assessment
    expect(deps.scanContent).toHaveBeenCalled();
    expect(deps.assessClarity).toHaveBeenCalled();
    expect(result!.step).toBe('assessed');
  });

  it('resumes from assessed step with stored assessment', async () => {
    const assessment = gapsAssessment();
    const deps = createMockDeps({
      getResumePoint: vi.fn().mockResolvedValue('assessed' as IntakeFlowStep),
      readFlowState: vi.fn().mockResolvedValue({
        currentStep: 'hygiene',
        completedSteps: ['staged', 'hygiene'],
        hygieneReport: { overallRisk: 'clean', findingCount: 0 },
      } satisfies IntakeFlowState),
      assessClarity: vi.fn().mockReturnValue(assessment),
    });
    const result = await resumeIntakeFlow({ basePath, filename, source: 'console', deps });

    expect(result).not.toBeNull();
    expect(result!.route).toBe('gaps');
    expect(result!.questions).toEqual(assessment.gaps);
    expect(result!.step).toBe('assessed');
  });

  it('resumes from confirmed step as ready-to-queue', async () => {
    const assessment = clearAssessment();
    const deps = createMockDeps({
      getResumePoint: vi.fn().mockResolvedValue('confirmed' as IntakeFlowStep),
      readFlowState: vi.fn().mockResolvedValue({
        currentStep: 'assessed',
        completedSteps: ['staged', 'hygiene', 'assessed'],
        assessment,
        hygieneReport: { overallRisk: 'clean', findingCount: 0 },
      } satisfies IntakeFlowState),
    });
    (deps.assessClarity as ReturnType<typeof vi.fn>).mockReturnValue(assessment);

    const result = await resumeIntakeFlow({ basePath, filename, source: 'console', deps });

    expect(result).not.toBeNull();
    expect(result!.route).toBe('clear');
    expect(result!.needsConfirmation).toBe(true);
    expect(result!.step).toBe('assessed');
  });

  it('returns null when flow is already complete', async () => {
    const deps = createMockDeps({
      getResumePoint: vi.fn().mockResolvedValue(null),
    });
    const result = await resumeIntakeFlow({ basePath, filename, source: 'console', deps });

    expect(result).toBeNull();
  });
});
