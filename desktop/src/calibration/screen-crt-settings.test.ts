/**
 * Tests for CRT settings calibration screen.
 *
 * Verifies slider rendering, default values, master toggle,
 * engine preview integration, and onComplete/onSkip/onBack callbacks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCRTSettingsScreen,
  type CRTSettingsResult,
} from './screen-crt-settings.js';
import { CRT_DEFAULTS } from '../engine/crt-config.js';
import type { CRTConfig } from '../engine/crt-config.js';

describe('screen-crt-settings', () => {
  let root: HTMLElement;
  let onComplete: ReturnType<typeof vi.fn>;
  let onSkip: ReturnType<typeof vi.fn>;
  let onBack: ReturnType<typeof vi.fn>;
  const defaults: CRTConfig = { ...CRT_DEFAULTS };

  beforeEach(() => {
    onComplete = vi.fn();
    onSkip = vi.fn();
    onBack = vi.fn();
    root = createCRTSettingsScreen({ defaults, onComplete, onSkip, onBack });
  });

  it('returns HTMLElement with class calibration-screen--crt-settings', () => {
    expect(root).toBeInstanceOf(HTMLElement);
    expect(root.classList.contains('calibration-screen')).toBe(true);
    expect(root.classList.contains('calibration-screen--crt-settings')).toBe(true);
  });

  it('contains 5 range inputs with correct data-crt-field attributes', () => {
    const sliders = root.querySelectorAll<HTMLInputElement>('input[type="range"]');
    expect(sliders).toHaveLength(5);

    const fields = Array.from(sliders).map((s) => s.dataset.crtField);
    expect(fields).toContain('scanlineIntensity');
    expect(fields).toContain('phosphorGlow');
    expect(fields).toContain('barrelDistortion');
    expect(fields).toContain('chromaticAberration');
    expect(fields).toContain('vignette');
  });

  it('sliders initialized to values from defaults parameter', () => {
    const scanline = root.querySelector<HTMLInputElement>(
      'input[data-crt-field="scanlineIntensity"]',
    )!;
    expect(parseFloat(scanline.value)).toBe(defaults.scanlineIntensity);

    const barrel = root.querySelector<HTMLInputElement>(
      'input[data-crt-field="barrelDistortion"]',
    )!;
    expect(parseFloat(barrel.value)).toBe(defaults.barrelDistortion);
  });

  it('changing scanlineIntensity slider updates displayed value text', () => {
    const scanline = root.querySelector<HTMLInputElement>(
      'input[data-crt-field="scanlineIntensity"]',
    )!;

    // Find the associated value display
    const container = scanline.closest('.calibration-slider-group')!;
    const valueDisplay = container.querySelector('.calibration-slider-value')!;

    // Change slider value
    scanline.value = '0.8';
    scanline.dispatchEvent(new Event('input', { bubbles: true }));

    expect(valueDisplay.textContent).toBe('0.80');
  });

  it('master toggle checkbox exists and is checked by default (crt.enabled=true)', () => {
    const toggle = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(toggle).not.toBeNull();
    expect(toggle.checked).toBe(true);
  });

  it('unchecking master toggle adds disabled visual state to slider container', () => {
    const toggle = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const sliderContainer = root.querySelector('.calibration-sliders')!;

    toggle.checked = false;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));

    expect(sliderContainer.classList.contains('calibration-sliders--disabled')).toBe(true);
  });

  it('clicking Next calls onComplete with CRTSettingsResult containing current slider values', () => {
    const nextBtn = root.querySelector<HTMLElement>('[data-action="next"]')!;
    nextBtn.click();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result: CRTSettingsResult = onComplete.mock.calls[0][0];
    expect(result.crt).toBeDefined();
    expect(typeof result.crt.scanlineIntensity).toBe('number');
    expect(typeof result.crt.vignette).toBe('number');
  });

  it('clicking Skip calls onSkip', () => {
    const skipBtn = root.querySelector<HTMLElement>('[data-action="skip"]')!;
    skipBtn.click();

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('clicking Back calls onBack', () => {
    const backBtn = root.querySelector<HTMLElement>('[data-action="back"]')!;
    backBtn.click();

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('when engine provided, changing a slider calls engine.updateConfig', () => {
    const mockEngine = { updateConfig: vi.fn() };
    const screen = createCRTSettingsScreen({
      defaults,
      onComplete,
      onSkip,
      onBack,
      engine: mockEngine as unknown as import('../engine/engine.js').Engine,
    });

    const slider = screen.querySelector<HTMLInputElement>(
      'input[data-crt-field="scanlineIntensity"]',
    )!;
    slider.value = '0.9';
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    expect(mockEngine.updateConfig).toHaveBeenCalled();
  });

  it('when engine is null, changing slider does not throw', () => {
    const screen = createCRTSettingsScreen({
      defaults,
      onComplete,
      onSkip,
      onBack,
      engine: null,
    });

    const slider = screen.querySelector<HTMLInputElement>(
      'input[data-crt-field="scanlineIntensity"]',
    )!;
    slider.value = '0.5';
    expect(() => {
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }).not.toThrow();
  });
});
