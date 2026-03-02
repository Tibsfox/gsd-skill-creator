/**
 * BBS Pack shared type definitions.
 *
 * Bbs-prefixed interfaces for lab exercises following
 * the electronics-pack Lab/LabStep pattern.
 */

export interface BbsLabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface BbsLab {
  id: string;
  title: string;
  steps: BbsLabStep[];
  verify: () => boolean;
}
