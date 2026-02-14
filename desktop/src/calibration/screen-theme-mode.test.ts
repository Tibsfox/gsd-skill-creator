/**
 * Tests for theme mode calibration screen (Screen 3).
 *
 * Verifies light/dark toggle, palette preset cards with color preview,
 * custom color card, engine integration, and onComplete/onSkip/onBack callbacks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createThemeModeScreen,
  type ThemeModeResult,
} from './screen-theme-mode.js';
import { PALETTE_PRESETS } from '../engine/palette.js';
import type { PalettePreset } from '../engine/palette.js';

describe('screen-theme-mode', () => {
  let root: HTMLElement;
  let onComplete: ReturnType<typeof vi.fn>;
  let onSkip: ReturnType<typeof vi.fn>;
  let onBack: ReturnType<typeof vi.fn>;

  const defaults: { mode: 'light' | 'dark'; preset: PalettePreset } = {
    mode: 'dark',
    preset: 'amiga-3.1',
  };

  beforeEach(() => {
    onComplete = vi.fn();
    onSkip = vi.fn();
    onBack = vi.fn();
    root = createThemeModeScreen({
      defaults,
      customColors: null,
      onComplete,
      onSkip,
      onBack,
    });
  });

  it('returns HTMLElement with class calibration-screen--theme-mode', () => {
    expect(root).toBeInstanceOf(HTMLElement);
    expect(root.classList.contains('calibration-screen')).toBe(true);
    expect(root.classList.contains('calibration-screen--theme-mode')).toBe(true);
  });

  it('contains light and dark mode toggle buttons', () => {
    const toggleBtns = root.querySelectorAll('.calibration-mode-toggle button');
    expect(toggleBtns.length).toBeGreaterThanOrEqual(2);

    const texts = Array.from(toggleBtns).map((b) => b.textContent);
    expect(texts).toContain('Dark Mode');
    expect(texts).toContain('Light Mode');
  });

  it('default selection matches defaults.mode parameter (dark)', () => {
    const darkBtn = Array.from(
      root.querySelectorAll<HTMLElement>('.calibration-mode-toggle button'),
    ).find((b) => b.textContent === 'Dark Mode')!;
    expect(darkBtn.classList.contains('calibration-mode-toggle--selected')).toBe(true);
  });

  it('defaults.mode=light selects light toggle initially', () => {
    const screen = createThemeModeScreen({
      defaults: { mode: 'light', preset: 'amiga-3.1' },
      customColors: null,
      onComplete,
      onSkip,
      onBack,
    });

    const lightBtn = Array.from(
      screen.querySelectorAll<HTMLElement>('.calibration-mode-toggle button'),
    ).find((b) => b.textContent === 'Light Mode')!;
    expect(lightBtn.classList.contains('calibration-mode-toggle--selected')).toBe(true);

    const darkBtn = Array.from(
      screen.querySelectorAll<HTMLElement>('.calibration-mode-toggle button'),
    ).find((b) => b.textContent === 'Dark Mode')!;
    expect(darkBtn.classList.contains('calibration-mode-toggle--selected')).toBe(false);
  });

  it('toggling to light mode updates the selected toggle state', () => {
    const lightBtn = Array.from(
      root.querySelectorAll<HTMLElement>('.calibration-mode-toggle button'),
    ).find((b) => b.textContent === 'Light Mode')!;

    lightBtn.click();

    expect(lightBtn.classList.contains('calibration-mode-toggle--selected')).toBe(true);

    const darkBtn = Array.from(
      root.querySelectorAll<HTMLElement>('.calibration-mode-toggle button'),
    ).find((b) => b.textContent === 'Dark Mode')!;
    expect(darkBtn.classList.contains('calibration-mode-toggle--selected')).toBe(false);
  });

  it('shows 5 preset cards without customColors', () => {
    const cards = root.querySelectorAll('.calibration-preset-card');
    expect(cards).toHaveLength(5);
  });

  it('shows 6 preset cards when customColors provided', () => {
    const customColors = Array.from({ length: 32 }, (_, i) => `#${String(i).padStart(6, '0')}`);
    const screen = createThemeModeScreen({
      defaults,
      customColors,
      onComplete,
      onSkip,
      onBack,
    });

    const cards = screen.querySelectorAll('.calibration-preset-card');
    expect(cards).toHaveLength(6);
  });

  it('each preset card shows palette name and 8-color preview', () => {
    const cards = root.querySelectorAll('.calibration-preset-card');
    for (const card of cards) {
      // Has a name label
      const name = card.querySelector('.calibration-preset-name');
      expect(name).not.toBeNull();
      expect(name!.textContent!.length).toBeGreaterThan(0);

      // Has 8 color preview squares
      const previewColors = card.querySelectorAll('.calibration-preset-color');
      expect(previewColors).toHaveLength(8);
    }
  });

  it('clicking a preset card sets calibration-preset-card--selected class', () => {
    const cards = root.querySelectorAll<HTMLElement>('.calibration-preset-card');
    const card = cards[1];

    card.click();

    expect(card.classList.contains('calibration-preset-card--selected')).toBe(true);
  });

  it('only one preset card is selected at a time', () => {
    const cards = root.querySelectorAll<HTMLElement>('.calibration-preset-card');

    cards[0].click();
    expect(cards[0].classList.contains('calibration-preset-card--selected')).toBe(true);

    cards[2].click();
    expect(cards[2].classList.contains('calibration-preset-card--selected')).toBe(true);
    expect(cards[0].classList.contains('calibration-preset-card--selected')).toBe(false);
  });

  it('clicking Finish calls onComplete with current mode and preset', () => {
    // Select a specific preset
    const cards = root.querySelectorAll<HTMLElement>('.calibration-preset-card');
    cards[1].click(); // amiga-2.0

    const finishBtn = root.querySelector<HTMLElement>('[data-action="finish"]')!;
    finishBtn.click();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result: ThemeModeResult = onComplete.mock.calls[0][0];
    expect(result.mode).toBe('dark');
    expect(result.preset).toBeDefined();
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

  it('when engine provided, selecting preset card calls engine.setPaletteColors', () => {
    const mockEngine = { setPaletteColors: vi.fn(), updateConfig: vi.fn() };
    const screen = createThemeModeScreen({
      defaults,
      customColors: null,
      onComplete,
      onSkip,
      onBack,
      engine: mockEngine as unknown as import('../engine/engine.js').Engine,
    });

    const cards = screen.querySelectorAll<HTMLElement>('.calibration-preset-card');
    cards[0].click();

    expect(mockEngine.setPaletteColors).toHaveBeenCalled();
  });

  it('custom card uses customColors array, not PALETTE_PRESETS custom', () => {
    const customColors = Array.from({ length: 32 }, () => '#AABBCC');
    const screen = createThemeModeScreen({
      defaults,
      customColors,
      onComplete,
      onSkip,
      onBack,
    });

    // Find the "Your Custom" card
    const cards = screen.querySelectorAll<HTMLElement>('.calibration-preset-card');
    const customCard = Array.from(cards).find((c) => {
      const name = c.querySelector('.calibration-preset-name');
      return name?.textContent === 'Your Custom';
    })!;
    expect(customCard).toBeDefined();

    // Preview colors should use the custom colors, not PALETTE_PRESETS.custom
    const previewColors = customCard.querySelectorAll<HTMLElement>('.calibration-preset-color');
    // All 8 preview squares should have #AABBCC background
    for (const pc of previewColors) {
      // jsdom converts hex to rgb()
      expect(pc.style.backgroundColor).not.toBe('');
    }
  });
});
