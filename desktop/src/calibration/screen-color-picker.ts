/**
 * Color picker calibration screen.
 *
 * DOM factory that renders a 24-swatch grid spanning the OKLCH hue wheel.
 * Users select 0-4 anchor colors; generatePalette() produces a harmonious
 * 32-color palette previewed in real time. Returns anchors and generated
 * palette via onComplete callback.
 */
import { formatHex, converter } from 'culori';
import { generatePalette } from '../engine/palette.js';
import type { Engine } from '../engine/engine.js';

const toRgb = converter('rgb');

/** Result data from the color picker screen. */
export interface ColorPickerResult {
  /** 0-4 selected hex colors (anchor colors). */
  anchors: string[];
  /** 32-color generated palette. */
  colors: string[];
}

interface ColorPickerOptions {
  onComplete: (result: ColorPickerResult) => void;
  onSkip: () => void;
  engine?: Engine | null;
}

/**
 * Generate 24 diverse swatch colors using OKLCH.
 *
 * 12 hues at 30-degree intervals x 2 lightness levels (0.45 and 0.70),
 * fixed chroma 0.15. Exported for testing.
 */
function buildSwatchColors(): string[] {
  const colors: string[] = [];
  const HUES = 12;
  const LIGHTNESS_LEVELS = [0.45, 0.70];
  const CHROMA = 0.15;

  for (let i = 0; i < HUES; i++) {
    const hue = i * 30;
    for (const lightness of LIGHTNESS_LEVELS) {
      const rgb = toRgb({ mode: 'oklch', l: lightness, c: CHROMA, h: hue });
      colors.push(formatHex(rgb).toUpperCase());
    }
  }

  return colors;
}

/** 24 pre-defined color swatches spanning the OKLCH hue wheel. */
export const SWATCH_COLORS: string[] = buildSwatchColors();

const MAX_SELECTIONS = 4;

/**
 * Create the color picker calibration screen.
 *
 * Returns a root HTMLElement containing:
 * - Title and instruction text
 * - 24-swatch grid with click-to-toggle selection (max 4)
 * - Live palette preview strip (32 color squares)
 * - Next and Skip buttons
 */
export function createColorPickerScreen(options: ColorPickerOptions): HTMLElement {
  const { onComplete, onSkip } = options;
  const selectedAnchors: string[] = [];

  // Root
  const root = document.createElement('div');
  root.className = 'calibration-screen calibration-screen--color-picker';

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Pick Your Colors';
  root.appendChild(title);

  // Instruction
  const instruction = document.createElement('p');
  instruction.textContent = 'Select up to 4 colors that speak to you';
  root.appendChild(instruction);

  // Swatch grid
  const grid = document.createElement('div');
  grid.className = 'calibration-swatch-grid';

  for (const color of SWATCH_COLORS) {
    const btn = document.createElement('button');
    btn.className = 'calibration-swatch';
    btn.style.backgroundColor = color;
    btn.dataset.color = color;

    btn.addEventListener('click', () => {
      const idx = selectedAnchors.indexOf(color);
      if (idx >= 0) {
        // Deselect
        selectedAnchors.splice(idx, 1);
        btn.classList.remove('calibration-swatch--selected');
      } else if (selectedAnchors.length < MAX_SELECTIONS) {
        // Select
        selectedAnchors.push(color);
        btn.classList.add('calibration-swatch--selected');
      }
      // else: at max, ignore

      updatePreview();
    });

    grid.appendChild(btn);
  }

  root.appendChild(grid);

  // Palette preview strip
  const preview = document.createElement('div');
  preview.className = 'calibration-palette-preview';

  // Initialize with 32 squares from neutral palette (0 anchors)
  const initialPalette = generatePalette([]);
  for (const color of initialPalette.colors) {
    const square = document.createElement('div');
    square.style.backgroundColor = color;
    preview.appendChild(square);
  }

  root.appendChild(preview);

  /** Update palette preview when selection changes. */
  function updatePreview(): void {
    const palette = generatePalette(selectedAnchors);
    const squares = preview.children;
    for (let i = 0; i < palette.colors.length; i++) {
      (squares[i] as HTMLElement).style.backgroundColor = palette.colors[i];
    }
  }

  // Button container
  const buttons = document.createElement('div');
  buttons.className = 'calibration-buttons';

  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'Skip';
  skipBtn.dataset.action = 'skip';
  skipBtn.addEventListener('click', () => onSkip());
  buttons.appendChild(skipBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.dataset.action = 'next';
  nextBtn.addEventListener('click', () => {
    const palette = generatePalette(selectedAnchors);
    onComplete({
      anchors: [...selectedAnchors],
      colors: palette.colors,
    });
  });
  buttons.appendChild(nextBtn);

  root.appendChild(buttons);

  return root;
}
