/**
 * Wizard state machine for first-boot calibration.
 *
 * Pure functions controlling three-screen navigation, skip logic,
 * first-boot detection, and recalibration entry point.
 *
 * All state transitions return new objects (no mutation).
 */

export type WizardScreen = 'color-picker' | 'crt-settings' | 'theme-mode';
export type WizardStatus = 'active' | 'complete' | 'skipped';

export interface WizardState {
  currentScreen: WizardScreen;
  status: WizardStatus;
  /** Accumulated partial user choices per screen (merged into UserStyle on complete). */
  screenData: {
    'color-picker': { anchors: string[] } | null;
    'crt-settings': Record<string, unknown> | null;
    'theme-mode': { mode: 'light' | 'dark'; preset: string } | null;
  };
}

/** Fixed screen sequence: color-picker -> crt-settings -> theme-mode. */
export const SCREEN_ORDER: readonly WizardScreen[] = [
  'color-picker',
  'crt-settings',
  'theme-mode',
] as const;

/** Create initial wizard state: first screen, active, all data null. */
export function createWizardState(): WizardState {
  return {
    currentScreen: 'color-picker',
    status: 'active',
    screenData: {
      'color-picker': null,
      'crt-settings': null,
      'theme-mode': null,
    },
  };
}

/**
 * Advance to the next screen, optionally storing data for the current screen.
 * On the last screen, sets status to 'complete'.
 * No-op if status is not 'active' (returns original reference).
 */
export function nextScreen(state: WizardState, data?: object): WizardState {
  if (state.status !== 'active') return state;

  const idx = SCREEN_ORDER.indexOf(state.currentScreen);
  const isLast = idx === SCREEN_ORDER.length - 1;

  const newScreenData = data
    ? { ...state.screenData, [state.currentScreen]: data }
    : { ...state.screenData };

  if (isLast) {
    return {
      currentScreen: state.currentScreen,
      status: 'complete',
      screenData: newScreenData,
    };
  }

  return {
    currentScreen: SCREEN_ORDER[idx + 1],
    status: 'active',
    screenData: newScreenData,
  };
}

/**
 * Go back one screen. No-op on the first screen or when not active.
 * Returns original reference on no-op.
 */
export function prevScreen(state: WizardState): WizardState {
  if (state.status !== 'active') return state;

  const idx = SCREEN_ORDER.indexOf(state.currentScreen);
  if (idx === 0) return state;

  return {
    ...state,
    currentScreen: SCREEN_ORDER[idx - 1],
  };
}

/**
 * Skip the current screen without storing data.
 * On the last screen, sets status to 'skipped'.
 */
export function skipScreen(state: WizardState): WizardState {
  if (state.status !== 'active') return state;

  const idx = SCREEN_ORDER.indexOf(state.currentScreen);
  const isLast = idx === SCREEN_ORDER.length - 1;

  if (isLast) {
    return { ...state, status: 'skipped' };
  }

  return {
    ...state,
    currentScreen: SCREEN_ORDER[idx + 1],
  };
}

/**
 * Skip the entire wizard immediately. All remaining screenData stays null.
 */
export function skipAll(state: WizardState): WizardState {
  return { ...state, status: 'skipped' };
}

/**
 * Mark the wizard as complete. Used when user finishes the last screen.
 */
export function completeWizard(state: WizardState): WizardState {
  return { ...state, status: 'complete' };
}

/**
 * Returns true when the calibrated flag is false (wizard should show).
 */
export function isFirstBoot(calibrated: boolean): boolean {
  return !calibrated;
}

/**
 * Returns a fresh wizard state for re-entering calibration.
 * Used by "System menu -> Recalibrate".
 */
export function resetCalibration(): WizardState {
  return createWizardState();
}

/**
 * Returns the 0-based index of a screen for progress indicator display.
 */
export function getScreenIndex(screen: WizardScreen): number {
  return SCREEN_ORDER.indexOf(screen);
}
