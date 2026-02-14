/**
 * Theme mode calibration screen (Screen 3).
 *
 * DOM factory that renders a light/dark mode toggle and palette preset
 * cards with 8-color preview strips. Users choose their preferred mode
 * and palette, with live WebGL preview via engine.setPaletteColors().
 * Returns mode + selected preset via onComplete callback.
 */
import { PALETTE_PRESETS, getPaletteColors } from '../engine/palette.js';
import type { PalettePreset, Palette } from '../engine/palette.js';
import type { Engine } from '../engine/engine.js';

/** Result data from the theme mode screen. */
export interface ThemeModeResult {
  mode: 'light' | 'dark';
  preset: PalettePreset;
}

interface ThemeModeOptions {
  defaults: { mode: 'light' | 'dark'; preset: PalettePreset };
  customColors: string[] | null;
  onComplete: (result: ThemeModeResult) => void;
  onSkip: () => void;
  onBack: () => void;
  engine?: Engine | null;
}

/**
 * Create the theme mode calibration screen.
 *
 * Returns a root HTMLElement containing:
 * - Title and instruction text
 * - Light/Dark mode toggle buttons
 * - 5-6 palette preset cards with 8-color preview strips
 * - Back, Skip, and Finish buttons
 */
export function createThemeModeScreen(options: ThemeModeOptions): HTMLElement {
  const { defaults, customColors, onComplete, onSkip, onBack, engine } = options;

  let selectedMode: 'light' | 'dark' = defaults.mode;
  let selectedPreset: PalettePreset = defaults.preset;

  // Root
  const root = document.createElement('div');
  root.className = 'calibration-screen calibration-screen--theme-mode';

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Choose Your Theme';
  root.appendChild(title);

  // Instruction
  const instruction = document.createElement('p');
  instruction.textContent = 'Pick your preferred mode and palette';
  root.appendChild(instruction);

  // --- Light/Dark toggle ---
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'calibration-mode-toggle';

  const darkBtn = document.createElement('button');
  darkBtn.textContent = 'Dark Mode';
  if (selectedMode === 'dark') {
    darkBtn.classList.add('calibration-mode-toggle--selected');
  }

  const lightBtn = document.createElement('button');
  lightBtn.textContent = 'Light Mode';
  if (selectedMode === 'light') {
    lightBtn.classList.add('calibration-mode-toggle--selected');
  }

  function selectMode(mode: 'light' | 'dark'): void {
    selectedMode = mode;
    if (mode === 'dark') {
      darkBtn.classList.add('calibration-mode-toggle--selected');
      lightBtn.classList.remove('calibration-mode-toggle--selected');
    } else {
      lightBtn.classList.add('calibration-mode-toggle--selected');
      darkBtn.classList.remove('calibration-mode-toggle--selected');
    }
    document.documentElement.setAttribute('data-theme', mode);
  }

  darkBtn.addEventListener('click', () => selectMode('dark'));
  lightBtn.addEventListener('click', () => selectMode('light'));

  toggleContainer.appendChild(darkBtn);
  toggleContainer.appendChild(lightBtn);
  root.appendChild(toggleContainer);

  // --- Palette preset cards ---
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'calibration-preset-cards';

  // Build list of presets to display
  const presetEntries: Array<{ key: PalettePreset; name: string; colors: string[] }> = [];

  const presetKeys: PalettePreset[] = ['amiga-1.3', 'amiga-2.0', 'amiga-3.1', 'c64', 'custom'];
  for (const key of presetKeys) {
    const palette: Palette = PALETTE_PRESETS[key];
    presetEntries.push({ key, name: palette.name, colors: palette.colors });
  }

  // Add custom colors card if provided
  if (customColors) {
    presetEntries.push({
      key: 'custom' as PalettePreset,
      name: 'Your Custom',
      colors: customColors,
    });
  }

  let selectedCard: HTMLElement | null = null;

  for (const entry of presetEntries) {
    const card = document.createElement('div');
    card.className = 'calibration-preset-card';
    card.dataset.preset = entry.key;

    // Mark initially selected
    if (entry.key === selectedPreset && entry.name !== 'Your Custom') {
      card.classList.add('calibration-preset-card--selected');
      selectedCard = card;
    }

    // Palette name
    const nameEl = document.createElement('div');
    nameEl.className = 'calibration-preset-name';
    nameEl.textContent = entry.name;
    card.appendChild(nameEl);

    // 8-color preview strip (first 8 colors)
    const preview = document.createElement('div');
    preview.className = 'calibration-preset-preview';
    const previewColors = entry.colors.slice(0, 8);
    for (const color of previewColors) {
      const swatch = document.createElement('div');
      swatch.className = 'calibration-preset-color';
      swatch.style.backgroundColor = color;
      preview.appendChild(swatch);
    }
    card.appendChild(preview);

    // Click handler
    card.addEventListener('click', () => {
      // Deselect previous
      if (selectedCard) {
        selectedCard.classList.remove('calibration-preset-card--selected');
      }

      // Select this card
      card.classList.add('calibration-preset-card--selected');
      selectedCard = card;
      selectedPreset = entry.key;

      // Live preview via engine
      if (engine) {
        engine.setPaletteColors(entry.colors);
      }
    });

    cardsContainer.appendChild(card);
  }

  root.appendChild(cardsContainer);

  // --- Buttons ---
  const buttons = document.createElement('div');
  buttons.className = 'calibration-buttons';

  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back';
  backBtn.dataset.action = 'back';
  backBtn.addEventListener('click', () => onBack());
  buttons.appendChild(backBtn);

  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'Skip';
  skipBtn.dataset.action = 'skip';
  skipBtn.addEventListener('click', () => onSkip());
  buttons.appendChild(skipBtn);

  const finishBtn = document.createElement('button');
  finishBtn.textContent = 'Finish';
  finishBtn.dataset.action = 'finish';
  finishBtn.addEventListener('click', () => {
    onComplete({
      mode: selectedMode,
      preset: selectedPreset,
    });
  });
  buttons.appendChild(finishBtn);

  root.appendChild(buttons);

  return root;
}
