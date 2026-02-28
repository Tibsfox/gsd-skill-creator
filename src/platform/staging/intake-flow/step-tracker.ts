/**
 * Intake flow step tracker for crash recovery.
 *
 * Persists flow progress to the document's .meta.json file under
 * the `intake_flow` key. When a session crashes mid-intake, the
 * system reads the metadata and resumes from the last completed step.
 *
 * Uses JSON.parse/stringify directly (not Zod schema) to preserve
 * all existing metadata fields including the intake_flow extension.
 * The StagingMetadataSchema uses .passthrough() so extra keys are
 * already valid at the schema level.
 *
 * @module staging/intake-flow/step-tracker
 */

import { readFile, writeFile } from 'node:fs/promises';
import type { IntakeFlowState, IntakeFlowStep } from './step-types.js';
import { INTAKE_FLOW_STEPS } from './step-types.js';

/** Default flow state for a document with no recorded steps. */
const DEFAULT_FLOW_STATE: IntakeFlowState = {
  currentStep: 'staged' as IntakeFlowStep,
  completedSteps: [],
};

/**
 * Validate that a step is the next expected step in the flow.
 *
 * @param step - The step being recorded
 * @param completedSteps - Steps already completed
 * @throws Error if the step is out of order (skipped or backward)
 */
function validateStepOrder(step: IntakeFlowStep, completedSteps: IntakeFlowStep[]): void {
  const stepIndex = INTAKE_FLOW_STEPS.indexOf(step);
  const expectedIndex = completedSteps.length;

  if (stepIndex !== expectedIndex) {
    const expected = INTAKE_FLOW_STEPS[expectedIndex] ?? '(flow complete)';
    throw new Error(
      `Invalid step order: cannot record '${step}' — expected '${expected}'. ` +
      `Completed steps: [${completedSteps.join(', ')}]`,
    );
  }
}

/**
 * Record a completed intake flow step to the document's metadata.
 *
 * Reads the existing .meta.json, updates (or creates) the intake_flow
 * field, validates step ordering, and writes back preserving all
 * existing metadata fields.
 *
 * @param step - The intake flow step to record
 * @param metadataPath - Absolute path to the .meta.json file
 * @param data - Optional additional data to persist (assessment, hygiene report, etc.)
 * @throws Error if step is out of order
 */
export async function recordStep(
  step: IntakeFlowStep,
  metadataPath: string,
  data?: Partial<IntakeFlowState>,
): Promise<void> {
  // Read existing metadata
  const raw = await readFile(metadataPath, 'utf-8');
  const meta = JSON.parse(raw) as Record<string, unknown>;

  // Extract or create flow state
  const existing = (meta.intake_flow ?? { ...DEFAULT_FLOW_STATE }) as IntakeFlowState;
  const completedSteps = existing.completedSteps ?? [];

  // Validate step order
  validateStepOrder(step, completedSteps);

  // Update flow state
  const updatedFlow: IntakeFlowState = {
    ...existing,
    currentStep: step,
    completedSteps: [...completedSteps, step],
  };

  // Merge optional data
  if (data) {
    if (data.assessment !== undefined) updatedFlow.assessment = data.assessment;
    if (data.hygieneReport !== undefined) updatedFlow.hygieneReport = data.hygieneReport;
    if (data.userConfirmed !== undefined) updatedFlow.userConfirmed = data.userConfirmed;
    if (data.additionalContext !== undefined) updatedFlow.additionalContext = data.additionalContext;
  }

  // Write back preserving all existing metadata fields
  meta.intake_flow = updatedFlow;
  await writeFile(metadataPath, JSON.stringify(meta, null, 2), 'utf-8');
}

/**
 * Read the current flow state from a document's metadata.
 *
 * Returns the persisted IntakeFlowState, or a default state
 * (currentStep: 'staged', completedSteps: []) if no flow state
 * has been recorded yet.
 *
 * @param metadataPath - Absolute path to the .meta.json file
 * @returns The current intake flow state
 */
export async function readFlowState(metadataPath: string): Promise<IntakeFlowState> {
  const raw = await readFile(metadataPath, 'utf-8');
  const meta = JSON.parse(raw) as Record<string, unknown>;

  if (!meta.intake_flow) {
    return { ...DEFAULT_FLOW_STATE, completedSteps: [] };
  }

  return meta.intake_flow as IntakeFlowState;
}

/**
 * Determine the resume point for a document's intake flow.
 *
 * Finds the last completed step and returns the next step in the
 * sequence. Returns the first step ('staged') if no steps have
 * been completed. Returns null if all steps are complete.
 *
 * @param metadataPath - Absolute path to the .meta.json file
 * @returns The next step to execute, or null if flow is complete
 */
export async function getResumePoint(metadataPath: string): Promise<IntakeFlowStep | null> {
  const state = await readFlowState(metadataPath);
  const completedCount = state.completedSteps.length;

  // No steps completed -- start from the beginning
  if (completedCount === 0) {
    return INTAKE_FLOW_STEPS[0];
  }

  // All steps complete -- flow is done
  if (completedCount >= INTAKE_FLOW_STEPS.length) {
    return null;
  }

  // Return the next step after the last completed one
  return INTAKE_FLOW_STEPS[completedCount];
}
