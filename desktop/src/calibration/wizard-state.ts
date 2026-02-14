/**
 * Wizard state machine for first-boot calibration.
 *
 * Pure functions controlling three-screen navigation, skip logic,
 * first-boot detection, and recalibration entry point.
 */

export type WizardScreen = 'color-picker' | 'crt-settings' | 'theme-mode';
export type WizardStatus = 'active' | 'complete' | 'skipped';

export interface WizardState {
  currentScreen: WizardScreen;
  status: WizardStatus;
  screenData: {
    'color-picker': { anchors: string[] } | null;
    'crt-settings': Record<string, unknown> | null;
    'theme-mode': { mode: 'light' | 'dark'; preset: string } | null;
  };
}

export const SCREEN_ORDER: readonly WizardScreen[] = [];

export function createWizardState(): WizardState {
  throw new Error('Not implemented');
}

export function nextScreen(_state: WizardState, _data?: object): WizardState {
  throw new Error('Not implemented');
}

export function prevScreen(_state: WizardState): WizardState {
  throw new Error('Not implemented');
}

export function skipScreen(_state: WizardState): WizardState {
  throw new Error('Not implemented');
}

export function skipAll(_state: WizardState): WizardState {
  throw new Error('Not implemented');
}

export function completeWizard(_state: WizardState): WizardState {
  throw new Error('Not implemented');
}

export function isFirstBoot(_calibrated: boolean): boolean {
  throw new Error('Not implemented');
}

export function resetCalibration(): WizardState {
  throw new Error('Not implemented');
}

export function getScreenIndex(_screen: WizardScreen): number {
  throw new Error('Not implemented');
}
