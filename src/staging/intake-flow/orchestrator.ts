/**
 * Intake flow orchestrator.
 *
 * Coordinates the full document assessment pipeline: stage -> hygiene ->
 * assess -> route to one of three paths (clear/gaps/confused). Records
 * each step for crash recovery and supports "anything else?" confirmation
 * before queuing.
 *
 * Uses dependency injection for testability -- all external dependencies
 * (scanners, assessors, filesystem) are injected via IntakeDependencies.
 * Default implementations use the real modules.
 *
 * @module staging/intake-flow/orchestrator
 */

import { readFile as fsReadFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ClarityAssessment, GapDetail } from './types.js';
import type { ClarityRoute } from './types.js';
import type { IntakeFlowState, IntakeFlowStep } from './step-types.js';
import type { HygieneFinding } from '../hygiene/types.js';
import type { ContentSourceInfo, TrustClassification } from '../hygiene/trust-types.js';
import type { HygieneReport, ReportOptions } from '../hygiene/report.js';
import type { MoveDocumentResult } from '../state-machine.js';
import type { StagingState } from '../types.js';
import { STAGING_DIRS } from '../types.js';
import { scanContent as realScanContent } from '../hygiene/scanner.js';
import { classifyFamiliarity as realClassifyFamiliarity } from '../hygiene/familiarity.js';
import { generateHygieneReport as realGenerateHygieneReport } from '../hygiene/report.js';
import { assessClarity as realAssessClarity } from './clarity-assessor.js';
import { moveDocument as realMoveDocument } from '../state-machine.js';
import { recordStep as realRecordStep, getResumePoint as realGetResumePoint, readFlowState as realReadFlowState } from './step-tracker.js';

/** Dependency injection interface for testability. */
export interface IntakeDependencies {
  scanContent: (content: string) => HygieneFinding[];
  classifyFamiliarity: (source: ContentSourceInfo) => TrustClassification;
  generateHygieneReport: (options: ReportOptions) => HygieneReport;
  assessClarity: (content: string) => ClarityAssessment;
  moveDocument: (options: {
    basePath: string;
    filename: string;
    fromState: StagingState;
    toState: StagingState;
  }) => Promise<MoveDocumentResult>;
  recordStep: (step: IntakeFlowStep, metadataPath: string, data?: Partial<IntakeFlowState>) => Promise<void>;
  getResumePoint: (metadataPath: string) => Promise<IntakeFlowStep | null>;
  readFlowState: (metadataPath: string) => Promise<IntakeFlowState>;
  readFile: (path: string) => Promise<string>;
}

/** Result of running the intake flow orchestrator. */
export interface IntakeFlowResult {
  route: ClarityRoute;
  assessment: ClarityAssessment;
  hygieneReport: HygieneReport;
  step: IntakeFlowStep;
  needsConfirmation: boolean;
  questions: GapDetail[];
  message: string;
}

/** Risk levels that trigger attention routing (human review required). */
const ATTENTION_RISKS: ReadonlySet<string> = new Set(['critical', 'warning']);

/** Build default real dependencies. */
function defaultDeps(): IntakeDependencies {
  return {
    scanContent: realScanContent,
    classifyFamiliarity: realClassifyFamiliarity,
    generateHygieneReport: realGenerateHygieneReport,
    assessClarity: realAssessClarity,
    moveDocument: realMoveDocument,
    recordStep: realRecordStep,
    getResumePoint: realGetResumePoint,
    readFlowState: realReadFlowState,
    readFile: (path: string) => fsReadFile(path, 'utf-8'),
  };
}

/** Merge partial dependency overrides with defaults. */
function resolveDeps(partial?: Partial<IntakeDependencies>): IntakeDependencies {
  if (!partial) return defaultDeps();
  return { ...defaultDeps(), ...partial };
}

/** Build the metadata path for a document in the inbox. */
function buildMetadataPath(basePath: string, filename: string): string {
  return join(basePath, STAGING_DIRS.inbox, `${filename}.meta.json`);
}

/** Build the metadata path for a document in checking state. */
function buildCheckingMetadataPath(basePath: string, filename: string): string {
  return join(basePath, STAGING_DIRS.checking, `${filename}.meta.json`);
}

/** Generate a human-readable status message based on route. */
function routeMessage(route: ClarityRoute, gapCount: number): string {
  switch (route) {
    case 'clear':
      return 'Document is clear and ready to queue';
    case 'gaps':
      return `Document has ${gapCount} gaps that need clarification`;
    case 'confused':
      return 'Document needs restatement before proceeding';
  }
}

/** Build an IntakeFlowResult from assessment and hygiene data. */
function buildResult(
  assessment: ClarityAssessment,
  hygieneReport: HygieneReport,
  step: IntakeFlowStep,
): IntakeFlowResult {
  const route = assessment.route;
  const needsConfirmation = route === 'clear' && step === 'assessed';
  const questions = route === 'gaps' ? assessment.gaps : [];
  const message = routeMessage(route, questions.length);

  return {
    route,
    assessment,
    hygieneReport,
    step,
    needsConfirmation,
    questions,
    message,
  };
}

// ---------------------------------------------------------------------------
// Step executors
// ---------------------------------------------------------------------------

/** Execute the hygiene step: move to checking, scan, classify, report. */
async function executeHygieneStep(
  deps: IntakeDependencies,
  basePath: string,
  filename: string,
  source: string,
  content: string,
  metadataPath: string,
): Promise<{ hygieneReport: HygieneReport; metadataPath: string; paused: boolean }> {
  // Move document from inbox to checking
  await deps.moveDocument({ basePath, filename, fromState: 'inbox', toState: 'checking' });

  // Metadata path is now in checking dir
  const checkingMetaPath = buildCheckingMetadataPath(basePath, filename);

  // Run hygiene scan
  const findings = deps.scanContent(content);
  const classification = deps.classifyFamiliarity({ origin: source } as ContentSourceInfo);
  const hygieneReport = deps.generateHygieneReport({
    findings,
    tier: classification.tier,
  });

  // Record hygiene step
  await deps.recordStep('hygiene', checkingMetaPath, {
    hygieneReport: {
      overallRisk: hygieneReport.overallRisk,
      findingCount: hygieneReport.totalFindings,
    },
  });

  // If risky, move to attention and pause flow
  if (ATTENTION_RISKS.has(hygieneReport.overallRisk)) {
    await deps.moveDocument({ basePath, filename, fromState: 'checking', toState: 'attention' });
    return { hygieneReport, metadataPath: checkingMetaPath, paused: true };
  }

  return { hygieneReport, metadataPath: checkingMetaPath, paused: false };
}

/** Execute the assessed step: run clarity assessment. */
async function executeAssessedStep(
  deps: IntakeDependencies,
  content: string,
  metadataPath: string,
): Promise<ClarityAssessment> {
  const assessment = deps.assessClarity(content);

  await deps.recordStep('assessed', metadataPath, {
    assessment,
  });

  return assessment;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the full intake flow from the beginning.
 *
 * Pipeline: inbox -> hygiene scan -> clarity assessment -> routing.
 * Clear documents get needsConfirmation=true awaiting "anything else?".
 * Gap documents get targeted questions. Confused documents get restate message.
 * Risky hygiene pauses flow at attention state.
 *
 * @param options.basePath - Project root (parent of .planning/)
 * @param options.filename - Document filename in inbox
 * @param options.source - Origin of the document
 * @param options.deps - Optional dependency overrides for testing
 * @returns Flow result with route, assessment, and next action
 */
export async function runIntakeFlow(options: {
  basePath: string;
  filename: string;
  source: string;
  deps?: Partial<IntakeDependencies>;
}): Promise<IntakeFlowResult> {
  const { basePath, filename, source } = options;
  const deps = resolveDeps(options.deps);
  const metadataPath = buildMetadataPath(basePath, filename);

  // Read document content from inbox
  const documentPath = join(basePath, STAGING_DIRS.inbox, filename);
  const content = await deps.readFile(documentPath);

  // Step: staged (record that the document is in the pipeline)
  await deps.recordStep('staged', metadataPath);

  // Step: hygiene
  const hygieneResult = await executeHygieneStep(
    deps, basePath, filename, source, content, metadataPath,
  );

  // If hygiene flagged risk, flow pauses here
  if (hygieneResult.paused) {
    // Return a paused result at the hygiene step
    const placeholderAssessment: ClarityAssessment = {
      route: 'confused',
      reason: 'Flow paused for hygiene review',
      confidence: 0,
      gaps: [],
      sections: [],
    };
    return {
      route: 'confused',
      assessment: placeholderAssessment,
      hygieneReport: hygieneResult.hygieneReport,
      step: 'hygiene',
      needsConfirmation: false,
      questions: [],
      message: 'Document requires hygiene review before proceeding',
    };
  }

  // Step: assessed
  const assessment = await executeAssessedStep(
    deps, content, hygieneResult.metadataPath,
  );

  return buildResult(assessment, hygieneResult.hygieneReport, 'assessed');
}

/**
 * Confirm a clear document for queuing ("anything else?" confirmation).
 *
 * Must be called after runIntakeFlow returns a clear route with
 * needsConfirmation=true. Records the confirmed step, moves the
 * document from checking to ready, and returns the updated result.
 *
 * @param options.basePath - Project root (parent of .planning/)
 * @param options.filename - Document filename
 * @param options.additionalContext - Optional extra context from user
 * @param options.deps - Optional dependency overrides for testing
 * @returns Updated result with step='confirmed'
 */
export async function confirmIntake(options: {
  basePath: string;
  filename: string;
  additionalContext?: string;
  deps?: Partial<IntakeDependencies>;
}): Promise<IntakeFlowResult> {
  const { basePath, filename, additionalContext } = options;
  const deps = resolveDeps(options.deps);
  const metadataPath = buildCheckingMetadataPath(basePath, filename);

  // Read flow state to get assessment
  const flowState = await deps.readFlowState(metadataPath);
  const assessment = (flowState.assessment as ClarityAssessment) ?? deps.assessClarity('');

  // Record confirmed step
  await deps.recordStep('confirmed', metadataPath, {
    userConfirmed: true,
    additionalContext,
  });

  // Move from checking to ready
  await deps.moveDocument({ basePath, filename, fromState: 'checking', toState: 'ready' });

  // Build hygiene report from stored data
  const hygieneReport = deps.generateHygieneReport({
    findings: [],
    tier: 'stranger',
  });

  return {
    route: assessment.route,
    assessment,
    hygieneReport,
    step: 'confirmed',
    needsConfirmation: false,
    questions: [],
    message: routeMessage(assessment.route, 0),
  };
}

/**
 * Resume an interrupted intake flow from the last completed step.
 *
 * Reads the step tracker to find where the flow was interrupted,
 * re-reads the document content, and continues from that point.
 * Returns null if the flow is already complete.
 *
 * @param options.basePath - Project root (parent of .planning/)
 * @param options.filename - Document filename
 * @param options.source - Origin of the document
 * @param options.deps - Optional dependency overrides for testing
 * @returns Flow result from resume point, or null if complete
 */
export async function resumeIntakeFlow(options: {
  basePath: string;
  filename: string;
  source: string;
  deps?: Partial<IntakeDependencies>;
}): Promise<IntakeFlowResult | null> {
  const { basePath, filename, source } = options;
  const deps = resolveDeps(options.deps);
  const metadataPath = buildCheckingMetadataPath(basePath, filename);

  // Check resume point
  const resumeStep = await deps.getResumePoint(metadataPath);
  if (resumeStep === null) {
    return null;
  }

  // Read flow state
  const flowState = await deps.readFlowState(metadataPath);

  // Read document content (try checking dir first, then inbox)
  const checkingPath = join(basePath, STAGING_DIRS.checking, filename);
  const inboxPath = join(basePath, STAGING_DIRS.inbox, filename);
  let content: string;
  try {
    content = await deps.readFile(checkingPath);
  } catch {
    content = await deps.readFile(inboxPath);
  }

  // Build hygiene report from stored state or run fresh
  let hygieneReport: HygieneReport;

  if (resumeStep === 'hygiene') {
    // Need to run hygiene and assessment from scratch
    const findings = deps.scanContent(content);
    const classification = deps.classifyFamiliarity({ origin: source } as ContentSourceInfo);
    hygieneReport = deps.generateHygieneReport({
      findings,
      tier: classification.tier,
    });

    // Record hygiene step
    await deps.recordStep('hygiene', metadataPath, {
      hygieneReport: {
        overallRisk: hygieneReport.overallRisk,
        findingCount: hygieneReport.totalFindings,
      },
    });

    // Check for risky hygiene
    if (ATTENTION_RISKS.has(hygieneReport.overallRisk)) {
      await deps.moveDocument({ basePath, filename, fromState: 'checking', toState: 'attention' });
      const placeholderAssessment: ClarityAssessment = {
        route: 'confused',
        reason: 'Flow paused for hygiene review',
        confidence: 0,
        gaps: [],
        sections: [],
      };
      return {
        route: 'confused',
        assessment: placeholderAssessment,
        hygieneReport,
        step: 'hygiene',
        needsConfirmation: false,
        questions: [],
        message: 'Document requires hygiene review before proceeding',
      };
    }

    // Run assessment
    const assessment = await executeAssessedStep(deps, content, metadataPath);
    return buildResult(assessment, hygieneReport, 'assessed');
  }

  // For assessed and confirmed resume points, rebuild report from stored data
  hygieneReport = deps.generateHygieneReport({
    findings: [],
    tier: 'stranger',
  });

  if (resumeStep === 'assessed') {
    // Run assessment
    const assessment = await executeAssessedStep(deps, content, metadataPath);
    return buildResult(assessment, hygieneReport, 'assessed');
  }

  if (resumeStep === 'confirmed') {
    // Assessment already done, return result awaiting confirmation
    const assessment = (flowState.assessment as ClarityAssessment) ?? deps.assessClarity(content);
    return buildResult(assessment, hygieneReport, 'assessed');
  }

  // For 'staged' resume point, run the full flow
  // (This handles the case where getResumePoint returns 'staged')
  return runIntakeFlow({ basePath, filename, source, deps });
}
