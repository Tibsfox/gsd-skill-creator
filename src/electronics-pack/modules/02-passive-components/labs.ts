/**
 * Module 2: Passive Components — Lab exercises
 *
 * 5 labs to be implemented in Phase 268.
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

/** Placeholder — labs added in Phase 268 */
export const labs: Lab[] = [];
