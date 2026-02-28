/**
 * Barrel exports for the AMIGA meta-mission module.
 *
 * Provides the MetaMissionHarness and SkillCandidateDetector for running
 * self-documenting meta-missions through the complete AMIGA stack and
 * surfacing skill candidates during debrief.
 */

export { MetaMissionHarness } from './meta-mission-harness.js';
export type {
  MetaMissionConfig,
  MetaMissionResult,
  SkillPackageDraft,
} from './meta-mission-harness.js';

export { SkillCandidateDetector } from './skill-candidate-detector.js';
export type {
  SkillCandidate,
  DetectionResult,
} from './skill-candidate-detector.js';
