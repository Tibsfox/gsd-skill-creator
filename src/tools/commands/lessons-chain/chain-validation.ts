/**
 * @file Lessons-learned chain validation functions
 * @description Validates chain integrity (prior lessons exist and are referenced)
 *              and forward reference enforcement (next plan references prior lessons).
 *              Consumed by the combined chain runner (Plan 03) and CLI (Phase 561).
 * @module tools/commands/lessons-chain
 */
import type { ChainConfig, ChainIntegrity } from './chain-types.js';

/**
 * Parameters for validating chain integrity.
 */
interface ChainIntegrityParams {
  config: ChainConfig;
  milestoneId: string;
  priorMilestoneId: string;
  priorLessonsPath: string;
  priorLessonsExists: boolean;
  currentMilestoneContent: string;
  chainPosition: number;
  totalInSeries: number;
}

/**
 * Parameters for validating forward references.
 */
interface ForwardReferenceParams {
  config: ChainConfig;
  currentMilestoneId: string;
  currentLessonsPath: string;
  nextPlanContent: string;
  nextPlanPath: string;
  chainPosition: number;
  totalInSeries: number;
}

/**
 * Validates that the lessons-learned chain is intact for a given milestone.
 * Checks that prior lessons-learned documents exist and are referenced
 * in the current milestone content.
 *
 * @param params - Chain integrity validation parameters
 * @returns ChainIntegrity result with validation status
 */
export function validateChainIntegrity(params: ChainIntegrityParams): ChainIntegrity {
  const {
    config, milestoneId, priorMilestoneId, priorLessonsPath,
    priorLessonsExists, currentMilestoneContent, chainPosition, totalInSeries,
  } = params;

  const errors: string[] = [];

  // First milestone in series has no prior lessons to reference
  if (chainPosition === 1) {
    return {
      valid: true,
      status: 'intact',
      priorLessonsFound: priorLessonsExists,
      priorLessonsPath: priorLessonsExists ? priorLessonsPath : '',
      forwardReferenceFound: false,
      forwardReferencePath: '',
      errors: [],
      chainPosition,
      totalInSeries,
    };
  }

  // Check prior lessons existence
  if (!priorLessonsExists) {
    if (!config.requiresPriorLessons) {
      // Enforcement disabled -- non-breaking
      return {
        valid: true,
        status: 'incomplete',
        priorLessonsFound: false,
        priorLessonsPath: '',
        forwardReferenceFound: false,
        forwardReferencePath: '',
        errors: [],
        chainPosition,
        totalInSeries,
      };
    }
    errors.push(`Prior lessons-learned document not found: ${priorLessonsPath}`);
    return {
      valid: false,
      status: 'broken',
      priorLessonsFound: false,
      priorLessonsPath: '',
      forwardReferenceFound: false,
      forwardReferencePath: '',
      errors,
      chainPosition,
      totalInSeries,
    };
  }

  // Prior lessons exist -- check that current milestone references them
  const hasReference =
    currentMilestoneContent.includes(priorLessonsPath) ||
    currentMilestoneContent.includes(priorMilestoneId);

  if (!hasReference) {
    errors.push(
      `Current milestone ${milestoneId} does not reference prior lessons-learned from ${priorMilestoneId}`
    );
    return {
      valid: false,
      status: 'broken',
      priorLessonsFound: true,
      priorLessonsPath,
      forwardReferenceFound: false,
      forwardReferencePath: '',
      errors,
      chainPosition,
      totalInSeries,
    };
  }

  return {
    valid: true,
    status: 'intact',
    priorLessonsFound: true,
    priorLessonsPath,
    forwardReferenceFound: false,
    forwardReferencePath: '',
    errors: [],
    chainPosition,
    totalInSeries,
  };
}

/**
 * Validates that the next milestone plan references the current
 * milestone's lessons-learned document.
 *
 * @param params - Forward reference validation parameters
 * @returns ChainIntegrity result with forward reference status
 */
export function validateForwardReference(params: ForwardReferenceParams): ChainIntegrity {
  const {
    config, currentMilestoneId, currentLessonsPath,
    nextPlanContent, nextPlanPath, chainPosition, totalInSeries,
  } = params;

  // Last milestone in series has no next plan to reference
  if (chainPosition === totalInSeries) {
    return {
      valid: true,
      status: 'intact',
      priorLessonsFound: false,
      priorLessonsPath: '',
      forwardReferenceFound: true,
      forwardReferencePath: '',
      errors: [],
      chainPosition,
      totalInSeries,
    };
  }

  const hasReference =
    nextPlanContent.includes(currentLessonsPath) ||
    nextPlanContent.includes(currentMilestoneId);

  if (!hasReference) {
    if (!config.feedForwardEnforced) {
      return {
        valid: true,
        status: 'incomplete',
        priorLessonsFound: false,
        priorLessonsPath: '',
        forwardReferenceFound: false,
        forwardReferencePath: '',
        errors: [],
        chainPosition,
        totalInSeries,
      };
    }

    return {
      valid: false,
      status: 'broken',
      priorLessonsFound: false,
      priorLessonsPath: '',
      forwardReferenceFound: false,
      forwardReferencePath: '',
      errors: [
        `Next milestone plan does not reference lessons-learned from ${currentMilestoneId}`,
      ],
      chainPosition,
      totalInSeries,
    };
  }

  return {
    valid: true,
    status: 'intact',
    priorLessonsFound: false,
    priorLessonsPath: '',
    forwardReferenceFound: true,
    forwardReferencePath: nextPlanPath,
    errors: [],
    chainPosition,
    totalInSeries,
  };
}
