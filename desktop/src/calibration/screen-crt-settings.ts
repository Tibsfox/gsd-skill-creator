/**
 * CRT settings calibration screen.
 *
 * DOM factory that renders 5 labeled range sliders for CRT post-processing
 * effects, a master enable/disable toggle, and real-time WebGL preview
 * via engine.updateConfig(). Returns accumulated slider values via
 * onComplete callback.
 */
import type { CRTConfig } from '../engine/crt-config.js';
import type { Engine } from '../engine/engine.js';

/** Result data from the CRT settings screen. */
export interface CRTSettingsResult {
  /** Only the CRT fields the user adjusted. */
  crt: Partial<CRTConfig>;
}

interface CRTSettingsOptions {
  defaults: CRTConfig;
  onComplete: (result: CRTSettingsResult) => void;
  onSkip: () => void;
  onBack: () => void;
  engine?: Engine | null;
}

/** Slider configuration for each CRT effect. */
interface SliderDef {
  label: string;
  field: keyof Omit<CRTConfig, 'enabled'>;
  min: number;
  max: number;
  step: number;
}

const SLIDER_DEFS: SliderDef[] = [
  { label: 'Scanlines', field: 'scanlineIntensity', min: 0, max: 1, step: 0.05 },
  { label: 'Phosphor Glow', field: 'phosphorGlow', min: 0, max: 1, step: 0.05 },
  { label: 'Barrel Distortion', field: 'barrelDistortion', min: 0, max: 0.5, step: 0.025 },
  { label: 'Chromatic Aberration', field: 'chromaticAberration', min: 0, max: 5, step: 0.25 },
  { label: 'Vignette', field: 'vignette', min: 0, max: 1, step: 0.05 },
];

/**
 * Format a numeric value to 2 decimal places for display.
 */
function formatValue(value: number): string {
  return value.toFixed(2);
}

/**
 * Create the CRT settings calibration screen.
 *
 * Returns a root HTMLElement containing:
 * - Title and instruction text
 * - Master "Enable CRT Effects" toggle checkbox
 * - 5 labeled range sliders with value display
 * - Real-time engine preview on slider input events
 * - Back, Skip, and Next buttons
 */
export function createCRTSettingsScreen(options: CRTSettingsOptions): HTMLElement {
  const { defaults, onComplete, onSkip, onBack, engine } = options;

  // Track current values
  const currentValues: Record<string, number> = {};
  for (const def of SLIDER_DEFS) {
    currentValues[def.field] = defaults[def.field];
  }
  let crtEnabled = defaults.enabled;

  // Root
  const root = document.createElement('div');
  root.className = 'calibration-screen calibration-screen--crt-settings';

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Tune Your CRT';
  root.appendChild(title);

  // Instruction
  const instruction = document.createElement('p');
  instruction.textContent = 'Adjust the retro effects to your taste';
  root.appendChild(instruction);

  // Master toggle
  const toggleGroup = document.createElement('div');
  toggleGroup.className = 'calibration-toggle-group';

  const toggleLabel = document.createElement('label');
  const toggleCheckbox = document.createElement('input');
  toggleCheckbox.type = 'checkbox';
  toggleCheckbox.checked = crtEnabled;
  toggleLabel.appendChild(toggleCheckbox);
  toggleLabel.appendChild(document.createTextNode(' Enable CRT Effects'));
  toggleGroup.appendChild(toggleLabel);
  root.appendChild(toggleGroup);

  // Slider container
  const slidersContainer = document.createElement('div');
  slidersContainer.className = 'calibration-sliders';

  // Build sliders
  for (const def of SLIDER_DEFS) {
    const group = document.createElement('div');
    group.className = 'calibration-slider-group';

    const label = document.createElement('label');
    label.textContent = def.label;
    group.appendChild(label);

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'calibration-slider-value';
    valueDisplay.textContent = formatValue(defaults[def.field]);
    group.appendChild(valueDisplay);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'calibration-slider';
    slider.min = String(def.min);
    slider.max = String(def.max);
    slider.step = String(def.step);
    slider.value = String(defaults[def.field]);
    slider.dataset.crtField = def.field;

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      currentValues[def.field] = val;
      valueDisplay.textContent = formatValue(val);

      // Real-time engine preview
      if (engine) {
        engine.updateConfig({ [def.field]: val });
      }
    });

    group.appendChild(slider);
    slidersContainer.appendChild(group);
  }

  root.appendChild(slidersContainer);

  // Toggle disables sliders visually
  toggleCheckbox.addEventListener('change', () => {
    crtEnabled = toggleCheckbox.checked;
    if (crtEnabled) {
      slidersContainer.classList.remove('calibration-sliders--disabled');
    } else {
      slidersContainer.classList.add('calibration-sliders--disabled');
    }

    if (engine) {
      engine.updateConfig({ enabled: crtEnabled });
    }
  });

  // Button container
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

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.dataset.action = 'next';
  nextBtn.addEventListener('click', () => {
    const crt: Partial<CRTConfig> = { enabled: crtEnabled };
    for (const def of SLIDER_DEFS) {
      (crt as Record<string, unknown>)[def.field] = currentValues[def.field];
    }
    onComplete({ crt });
  });
  buttons.appendChild(nextBtn);

  root.appendChild(buttons);

  return root;
}
