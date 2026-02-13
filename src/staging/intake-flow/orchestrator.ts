/**
 * Intake flow orchestrator.
 *
 * Coordinates the full document assessment pipeline: stage -> hygiene ->
 * assess -> route to one of three paths (clear/gaps/confused). Records
 * each step for crash recovery and supports "anything else?" confirmation
 * before queuing.
 *
 * @module staging/intake-flow/orchestrator
 */

import type { ClarityAssessment, GapDetail } from './types.js';
import type { IntakeFlowState, IntakeFlowStep } from './step-types.js';
import type { HygieneFinding } from '../hygiene/types.js';
import type { ContentSourceInfo, TrustClassification } from '../hygiene/trust-types.js';
import type { HygieneReport, ReportOptions } from '../hygiene/report.js';
import type { MoveDocumentResult } from '../state-machine.js';
import type { StagingState } from '../types.js';
import type { ClarityRoute } from './types.js';

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

// Stub exports -- will be implemented in GREEN phase
export async function runIntakeFlow(_options: {
  basePath: string;
  filename: string;
  source: string;
  deps?: Partial<IntakeDependencies>;
}): Promise<IntakeFlowResult> {
  throw new Error('Not implemented');
}

export async function confirmIntake(_options: {
  basePath: string;
  filename: string;
  additionalContext?: string;
  deps?: Partial<IntakeDependencies>;
}): Promise<IntakeFlowResult> {
  throw new Error('Not implemented');
}

export async function resumeIntakeFlow(_options: {
  basePath: string;
  filename: string;
  source: string;
  deps?: Partial<IntakeDependencies>;
}): Promise<IntakeFlowResult | null> {
  throw new Error('Not implemented');
}
