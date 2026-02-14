/**
 * Wizard orchestrator stub.
 *
 * Stub -- will be implemented in GREEN phase.
 */
import type { UserStyle } from './user-style.js';
import type { Engine } from '../engine/engine.js';

interface WizardOptions {
  container: HTMLElement;
  engine?: Engine | null;
  onComplete: (style: UserStyle) => void;
}

export class CalibrationWizard {
  constructor(_options: WizardOptions) {}
  start(): void {}
  destroy(): void {}
}
