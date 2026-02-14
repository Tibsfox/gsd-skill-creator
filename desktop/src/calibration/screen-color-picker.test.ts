/**
 * Tests for color picker calibration screen.
 *
 * Verifies swatch grid rendering, selection toggle (max 4),
 * live palette preview via generatePalette, and onComplete/onSkip callbacks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createColorPickerScreen,
  SWATCH_COLORS,
  type ColorPickerResult,
} from './screen-color-picker.js';

describe('screen-color-picker', () => {
  describe('SWATCH_COLORS', () => {
    it('has exactly 24 entries', () => {
      expect(SWATCH_COLORS).toHaveLength(24);
    });
  });

  describe('createColorPickerScreen', () => {
    let root: HTMLElement;
    let onComplete: ReturnType<typeof vi.fn>;
    let onSkip: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      onComplete = vi.fn();
      onSkip = vi.fn();
      root = createColorPickerScreen({ onComplete, onSkip });
    });

    it('returns an HTMLElement with class calibration-screen--color-picker', () => {
      expect(root).toBeInstanceOf(HTMLElement);
      expect(root.classList.contains('calibration-screen')).toBe(true);
      expect(root.classList.contains('calibration-screen--color-picker')).toBe(true);
    });

    it('contains 24 swatch buttons with class calibration-swatch', () => {
      const swatches = root.querySelectorAll('.calibration-swatch');
      expect(swatches).toHaveLength(24);
      for (const swatch of swatches) {
        expect(swatch.tagName).toBe('BUTTON');
      }
    });

    it('each swatch has a background-color style set', () => {
      const swatches = root.querySelectorAll<HTMLElement>('.calibration-swatch');
      for (const swatch of swatches) {
        expect(swatch.style.backgroundColor).not.toBe('');
      }
    });

    it('clicking a swatch toggles calibration-swatch--selected class', () => {
      const swatch = root.querySelector<HTMLElement>('.calibration-swatch')!;
      expect(swatch.classList.contains('calibration-swatch--selected')).toBe(false);

      swatch.click();
      expect(swatch.classList.contains('calibration-swatch--selected')).toBe(true);

      swatch.click();
      expect(swatch.classList.contains('calibration-swatch--selected')).toBe(false);
    });

    it('maximum 4 swatches can be selected (5th click does not add selection)', () => {
      const swatches = root.querySelectorAll<HTMLElement>('.calibration-swatch');

      // Select first 4
      swatches[0].click();
      swatches[1].click();
      swatches[2].click();
      swatches[3].click();
      expect(root.querySelectorAll('.calibration-swatch--selected')).toHaveLength(4);

      // 5th click should not add a selection
      swatches[4].click();
      expect(root.querySelectorAll('.calibration-swatch--selected')).toHaveLength(4);
      expect(swatches[4].classList.contains('calibration-swatch--selected')).toBe(false);
    });

    it('palette preview shows 32 color squares', () => {
      const preview = root.querySelector('.calibration-palette-preview');
      expect(preview).not.toBeNull();
      const squares = preview!.children;
      expect(squares).toHaveLength(32);
    });

    it('palette preview updates when selection changes', () => {
      const preview = root.querySelector<HTMLElement>('.calibration-palette-preview')!;
      const initialColors = Array.from(preview.children).map(
        (el) => (el as HTMLElement).style.backgroundColor,
      );

      // Select a swatch to change the palette
      const swatch = root.querySelector<HTMLElement>('.calibration-swatch')!;
      swatch.click();

      const updatedColors = Array.from(preview.children).map(
        (el) => (el as HTMLElement).style.backgroundColor,
      );

      // At least some colors should change when an anchor is added
      expect(updatedColors).not.toEqual(initialColors);
    });

    it('clicking Next calls onComplete with anchors array matching selected swatches', () => {
      const swatches = root.querySelectorAll<HTMLElement>('.calibration-swatch');
      swatches[0].click();
      swatches[2].click();

      const nextBtn = root.querySelector<HTMLElement>('[data-action="next"]')!;
      nextBtn.click();

      expect(onComplete).toHaveBeenCalledTimes(1);
      const result: ColorPickerResult = onComplete.mock.calls[0][0];
      expect(result.anchors).toHaveLength(2);
    });

    it('clicking Next calls onComplete with colors array of length 32', () => {
      const nextBtn = root.querySelector<HTMLElement>('[data-action="next"]')!;
      nextBtn.click();

      const result: ColorPickerResult = onComplete.mock.calls[0][0];
      expect(result.colors).toHaveLength(32);
    });

    it('clicking Skip calls onSkip', () => {
      const skipBtn = root.querySelector<HTMLElement>('[data-action="skip"]')!;
      skipBtn.click();

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('deselecting a swatch removes it from anchors', () => {
      const swatches = root.querySelectorAll<HTMLElement>('.calibration-swatch');
      swatches[0].click(); // select
      swatches[1].click(); // select
      swatches[0].click(); // deselect

      const nextBtn = root.querySelector<HTMLElement>('[data-action="next"]')!;
      nextBtn.click();

      const result: ColorPickerResult = onComplete.mock.calls[0][0];
      expect(result.anchors).toHaveLength(1);
    });

    it('with 0 selections Next still works (generates neutral palette)', () => {
      const nextBtn = root.querySelector<HTMLElement>('[data-action="next"]')!;
      nextBtn.click();

      expect(onComplete).toHaveBeenCalledTimes(1);
      const result: ColorPickerResult = onComplete.mock.calls[0][0];
      expect(result.anchors).toHaveLength(0);
      expect(result.colors).toHaveLength(32);
    });
  });
});
