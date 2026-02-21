/**
 * Module 10: Digital Signal Processing — Lab exercises
 *
 * 5 labs to be implemented in Phase 273.
 */

export interface LabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface Lab {
  id: string;
  title: string;
  steps: LabStep[];
  verify: () => boolean;
}

/** Placeholder — labs added in Phase 273 */
export const labs: Lab[] = [];
