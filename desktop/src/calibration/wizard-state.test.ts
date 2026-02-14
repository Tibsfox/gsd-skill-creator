import { describe, it, expect } from 'vitest';
import {
  WizardState,
  WizardScreen,
  SCREEN_ORDER,
  createWizardState,
  nextScreen,
  prevScreen,
  skipScreen,
  skipAll,
  completeWizard,
  isFirstBoot,
  resetCalibration,
  getScreenIndex,
} from './wizard-state';

describe('wizard-state', () => {
  describe('SCREEN_ORDER', () => {
    it('has exactly 3 screens in correct order', () => {
      expect(SCREEN_ORDER).toEqual(['color-picker', 'crt-settings', 'theme-mode']);
      expect(SCREEN_ORDER).toHaveLength(3);
    });
  });

  describe('createWizardState', () => {
    it('returns color-picker screen, active status, all null screenData', () => {
      const state = createWizardState();
      expect(state.currentScreen).toBe('color-picker');
      expect(state.status).toBe('active');
      expect(state.screenData['color-picker']).toBeNull();
      expect(state.screenData['crt-settings']).toBeNull();
      expect(state.screenData['theme-mode']).toBeNull();
    });
  });

  describe('nextScreen', () => {
    it('from color-picker goes to crt-settings', () => {
      const state = createWizardState();
      const next = nextScreen(state);
      expect(next.currentScreen).toBe('crt-settings');
      expect(next.status).toBe('active');
    });

    it('from crt-settings goes to theme-mode', () => {
      const state: WizardState = {
        ...createWizardState(),
        currentScreen: 'crt-settings',
      };
      const next = nextScreen(state);
      expect(next.currentScreen).toBe('theme-mode');
      expect(next.status).toBe('active');
    });

    it('from theme-mode sets status to complete', () => {
      const state: WizardState = {
        ...createWizardState(),
        currentScreen: 'theme-mode',
      };
      const next = nextScreen(state);
      expect(next.status).toBe('complete');
      // Stays on theme-mode since it's the last screen
      expect(next.currentScreen).toBe('theme-mode');
    });

    it('stores provided data in screenData', () => {
      const state = createWizardState();
      const data = { anchors: ['#ff0000', '#00ff00'] };
      const next = nextScreen(state, data);
      expect(next.screenData['color-picker']).toEqual(data);
    });

    it('without data leaves screenData null for that screen', () => {
      const state = createWizardState();
      const next = nextScreen(state);
      expect(next.screenData['color-picker']).toBeNull();
    });

    it('on non-active state returns unchanged', () => {
      const state: WizardState = {
        ...createWizardState(),
        status: 'complete',
      };
      const result = nextScreen(state);
      expect(result).toBe(state);
    });
  });

  describe('prevScreen', () => {
    it('from crt-settings goes to color-picker', () => {
      const state: WizardState = {
        ...createWizardState(),
        currentScreen: 'crt-settings',
      };
      const prev = prevScreen(state);
      expect(prev.currentScreen).toBe('color-picker');
    });

    it('from color-picker returns unchanged (no previous)', () => {
      const state = createWizardState();
      const prev = prevScreen(state);
      expect(prev).toBe(state);
    });

    it('on non-active state returns unchanged', () => {
      const state: WizardState = {
        ...createWizardState(),
        currentScreen: 'crt-settings',
        status: 'skipped',
      };
      const result = prevScreen(state);
      expect(result).toBe(state);
    });
  });

  describe('skipScreen', () => {
    it('advances without storing data', () => {
      const state = createWizardState();
      const skipped = skipScreen(state);
      expect(skipped.currentScreen).toBe('crt-settings');
      expect(skipped.screenData['color-picker']).toBeNull();
      expect(skipped.status).toBe('active');
    });

    it('on last screen sets status to skipped', () => {
      const state: WizardState = {
        ...createWizardState(),
        currentScreen: 'theme-mode',
      };
      const skipped = skipScreen(state);
      expect(skipped.status).toBe('skipped');
      expect(skipped.currentScreen).toBe('theme-mode');
    });
  });

  describe('skipAll', () => {
    it('sets status to skipped immediately from any screen', () => {
      const fromFirst = skipAll(createWizardState());
      expect(fromFirst.status).toBe('skipped');

      const fromMiddle = skipAll({
        ...createWizardState(),
        currentScreen: 'crt-settings',
      });
      expect(fromMiddle.status).toBe('skipped');

      const fromLast = skipAll({
        ...createWizardState(),
        currentScreen: 'theme-mode',
      });
      expect(fromLast.status).toBe('skipped');
    });
  });

  describe('completeWizard', () => {
    it('sets status to complete', () => {
      const state = createWizardState();
      const completed = completeWizard(state);
      expect(completed.status).toBe('complete');
    });
  });

  describe('isFirstBoot', () => {
    it('returns true when calibrated is false', () => {
      expect(isFirstBoot(false)).toBe(true);
    });

    it('returns false when calibrated is true', () => {
      expect(isFirstBoot(true)).toBe(false);
    });
  });

  describe('resetCalibration', () => {
    it('returns fresh wizard state', () => {
      const reset = resetCalibration();
      const fresh = createWizardState();
      expect(reset).toEqual(fresh);
    });
  });

  describe('getScreenIndex', () => {
    it('returns 0 for color-picker, 1 for crt-settings, 2 for theme-mode', () => {
      expect(getScreenIndex('color-picker')).toBe(0);
      expect(getScreenIndex('crt-settings')).toBe(1);
      expect(getScreenIndex('theme-mode')).toBe(2);
    });
  });

  describe('immutability', () => {
    it('nextScreen does not mutate original state', () => {
      const state = createWizardState();
      const original = { ...state, screenData: { ...state.screenData } };
      nextScreen(state, { anchors: ['red'] });
      expect(state.currentScreen).toBe(original.currentScreen);
      expect(state.screenData['color-picker']).toBe(original.screenData['color-picker']);
    });
  });
});
