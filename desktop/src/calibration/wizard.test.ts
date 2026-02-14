/**
 * Tests for CalibrationWizard orchestrator.
 *
 * Verifies three-screen composition with state machine navigation,
 * user-style persistence, CSS bridge application, engine updates,
 * skip logic, and destroy cleanup.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CalibrationWizard } from './wizard.js';
import { DEFAULT_USER_STYLE, type UserStyle } from './user-style.js';

describe('CalibrationWizard', () => {
  let container: HTMLElement;
  let onComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onComplete = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    document.body.removeChild(container);
    // Clean up CSS custom properties
    for (let i = 0; i < 32; i++) {
      document.documentElement.style.removeProperty(`--palette-${i}`);
    }
    document.documentElement.style.removeProperty('--bg-primary');
    document.documentElement.style.removeProperty('--mode');
  });

  it('constructor accepts container, engine, onComplete', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    expect(wizard).toBeDefined();
  });

  it('start() renders color-picker screen content into container', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Color picker screen should have its specific class
    const screen = container.querySelector('.calibration-screen--color-picker');
    expect(screen).not.toBeNull();
  });

  it('start() shows progress indicator with "Step 1 of 3"', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    const progress = container.querySelector('.calibration-progress');
    expect(progress).not.toBeNull();
    expect(progress!.textContent).toContain('1');
    expect(progress!.textContent).toContain('3');
  });

  it('completing screen 1 transitions to screen 2 (crt-settings content appears)', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Click Next on color picker screen
    const nextBtn = container.querySelector<HTMLElement>('[data-action="next"]')!;
    nextBtn.click();

    // CRT settings screen should now be visible
    const crtScreen = container.querySelector('.calibration-screen--crt-settings');
    expect(crtScreen).not.toBeNull();
  });

  it('completing screen 2 transitions to screen 3 (theme-mode content appears)', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Screen 1 -> Screen 2
    const nextBtn1 = container.querySelector<HTMLElement>('[data-action="next"]')!;
    nextBtn1.click();

    // Screen 2 -> Screen 3
    const nextBtn2 = container.querySelector<HTMLElement>('[data-action="next"]')!;
    nextBtn2.click();

    // Theme mode screen should now be visible
    const themeScreen = container.querySelector('.calibration-screen--theme-mode');
    expect(themeScreen).not.toBeNull();
  });

  it('completing screen 3 calls onComplete with a full UserStyle', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Navigate through all 3 screens
    // Screen 1
    container.querySelector<HTMLElement>('[data-action="next"]')!.click();
    // Screen 2
    container.querySelector<HTMLElement>('[data-action="next"]')!.click();
    // Screen 3 (Finish)
    container.querySelector<HTMLElement>('[data-action="finish"]')!.click();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const style: UserStyle = onComplete.mock.calls[0][0];
    expect(style.palette).toBeDefined();
    expect(style.palette.colors).toHaveLength(32);
    expect(style.crt).toBeDefined();
    expect(style.mode).toBeDefined();
    expect(style.calibrated).toBe(true);
  });

  it('completing screen 3 calls saveUserStyle (persists to localStorage)', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Navigate through all 3 screens
    container.querySelector<HTMLElement>('[data-action="next"]')!.click();
    container.querySelector<HTMLElement>('[data-action="next"]')!.click();
    container.querySelector<HTMLElement>('[data-action="finish"]')!.click();

    // Verify localStorage was written
    const stored = localStorage.getItem('gsd-os-user-style');
    expect(stored).not.toBeNull();
    expect(stored).toContain('calibrated: true');
  });

  it('completing screen 3 calls applyUserStyleCSS (custom properties set)', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Navigate through all 3 screens
    container.querySelector<HTMLElement>('[data-action="next"]')!.click();
    container.querySelector<HTMLElement>('[data-action="next"]')!.click();
    container.querySelector<HTMLElement>('[data-action="finish"]')!.click();

    // Verify CSS custom properties were set
    const mode = document.documentElement.style.getPropertyValue('--mode');
    expect(mode).not.toBe('');
  });

  it('skipScreen on screen 1 transitions to screen 2 with null screenData for color-picker', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Skip screen 1
    container.querySelector<HTMLElement>('[data-action="skip"]')!.click();

    // CRT settings should be visible
    const crtScreen = container.querySelector('.calibration-screen--crt-settings');
    expect(crtScreen).not.toBeNull();
  });

  it('skipAll from screen 1 calls onComplete with DEFAULT_USER_STYLE-like result', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Skip through all screens
    container.querySelector<HTMLElement>('[data-action="skip"]')!.click(); // Screen 1
    container.querySelector<HTMLElement>('[data-action="skip"]')!.click(); // Screen 2
    container.querySelector<HTMLElement>('[data-action="skip"]')!.click(); // Screen 3

    expect(onComplete).toHaveBeenCalledTimes(1);
    const style: UserStyle = onComplete.mock.calls[0][0];
    // Should have default values since all screens were skipped
    expect(style.palette.preset).toBe(DEFAULT_USER_STYLE.palette.preset);
    expect(style.mode).toBe(DEFAULT_USER_STYLE.mode);
    expect(style.calibrated).toBe(true);
  });

  it('destroy() clears container content', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();
    expect(container.children.length).toBeGreaterThan(0);

    wizard.destroy();
    expect(container.innerHTML).toBe('');
  });

  it('custom colors from screen 1 are passed to screen 3 as customColors option', () => {
    const wizard = new CalibrationWizard({
      container,
      engine: null,
      onComplete,
    });
    wizard.start();

    // Select some swatches on screen 1 and complete
    const swatches = container.querySelectorAll<HTMLElement>('.calibration-swatch');
    swatches[0].click();
    container.querySelector<HTMLElement>('[data-action="next"]')!.click();

    // Screen 2 -> Screen 3
    container.querySelector<HTMLElement>('[data-action="next"]')!.click();

    // Screen 3 should have 6 preset cards (5 presets + 1 custom)
    const cards = container.querySelectorAll('.calibration-preset-card');
    expect(cards).toHaveLength(6);
  });
});
