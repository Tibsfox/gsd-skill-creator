/**
 * RecalibratePanel: Settings panel for adjusting magic verbosity level.
 *
 * Renders a 5-step slider with level labels, description, live preview,
 * and Apply button. Changes take effect immediately on Apply.
 *
 * @module magic/recalibrate-panel
 */

import { MagicLevel, DEFAULT_MAGIC_LEVEL } from './types';
import { loadMagicLevel, saveMagicLevel } from './persistence';

export interface RecalibratePanelProps {
  container: HTMLElement;
  initialLevel?: MagicLevel;
  onApply?: (level: MagicLevel) => void;
  onLevelChange?: (level: MagicLevel) => void;
}

const LEVEL_LABELS: Record<MagicLevel, string> = {
  [MagicLevel.FULL_MAGIC]: 'Full Magic',
  [MagicLevel.GUIDED]: 'Guided',
  [MagicLevel.ANNOTATED]: 'Annotated',
  [MagicLevel.VERBOSE]: 'Verbose',
  [MagicLevel.NO_MAGIC]: 'No Magic',
};

const LEVEL_DESCRIPTIONS: Record<MagicLevel, string> = {
  [MagicLevel.FULL_MAGIC]:
    'Shapes and colors only. No text from system commands. Claude chat always visible.',
  [MagicLevel.GUIDED]:
    'Claude narration plus summary results. Service status updates shown.',
  [MagicLevel.ANNOTATED]:
    'Narration plus key command output. Errors shown in full. Default level.',
  [MagicLevel.VERBOSE]:
    'All command output including stdout/stderr. Full service logs.',
  [MagicLevel.NO_MAGIC]:
    'Raw everything. Every log line, debug timing, IPC raw events.',
};

const PREVIEW_CONTENT: Record<MagicLevel, string> = {
  [MagicLevel.FULL_MAGIC]: '[LED: green dot] File watcher started.',
  [MagicLevel.GUIDED]: 'File watcher is now monitoring your project.',
  [MagicLevel.ANNOTATED]:
    'Starting file watcher...\n$ fswatch --recursive ./src\nWatching 142 files.',
  [MagicLevel.VERBOSE]:
    'Starting file watcher...\n$ fswatch --recursive ./src\n[stdout] Watching 142 files in 23 directories\n[stdout] Initial scan complete (0.34s)',
  [MagicLevel.NO_MAGIC]:
    '[debug:timing] fswatch init: 340ms\n[debug:ipc_raw] send service:starting {"service_id":"file_watcher"}\nStarting file watcher...\n$ fswatch --recursive ./src\n[stdout] Watching 142 files in 23 directories\n[stdout] Initial scan complete (0.34s)\n[debug:ipc_raw] send service:state_change {"from":"starting","to":"online"}',
};

export class RecalibratePanel {
  private container: HTMLElement;
  private initialLevel?: MagicLevel;
  private onApply?: (level: MagicLevel) => void;
  private onLevelChange?: (level: MagicLevel) => void;
  private selectedLevel: MagicLevel;
  private root: HTMLDivElement | null = null;
  private slider: HTMLInputElement | null = null;
  private labelsContainer: HTMLDivElement | null = null;
  private descriptionEl: HTMLDivElement | null = null;
  private previewEl: HTMLDivElement | null = null;
  private handleSliderInput: (() => void) | null = null;
  private handleApplyClick: (() => void) | null = null;

  constructor(props: RecalibratePanelProps) {
    this.container = props.container;
    this.initialLevel = props.initialLevel;
    this.onApply = props.onApply;
    this.onLevelChange = props.onLevelChange;
    this.selectedLevel = props.initialLevel ?? DEFAULT_MAGIC_LEVEL;
  }

  async mount(): Promise<void> {
    // Load current level from IPC if no initialLevel provided
    if (this.initialLevel === undefined) {
      this.selectedLevel = await loadMagicLevel();
    }

    this.root = document.createElement('div');
    this.root.className = 'recalibrate-panel';

    // Heading
    const heading = document.createElement('h3');
    heading.textContent = 'How much do you want to see?';
    this.root.appendChild(heading);

    // Slider row
    const sliderRow = document.createElement('div');
    sliderRow.className = 'recalibrate-panel__slider-row';
    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = '1';
    this.slider.max = '5';
    this.slider.step = '1';
    this.slider.value = String(this.selectedLevel);
    this.slider.className = 'recalibrate-panel__slider';
    sliderRow.appendChild(this.slider);
    this.root.appendChild(sliderRow);

    // Labels
    this.labelsContainer = document.createElement('div');
    this.labelsContainer.className = 'recalibrate-panel__labels';
    this.renderLabels();
    this.root.appendChild(this.labelsContainer);

    // Description
    this.descriptionEl = document.createElement('div');
    this.descriptionEl.className = 'recalibrate-panel__description';
    this.descriptionEl.textContent =
      LEVEL_DESCRIPTIONS[this.selectedLevel] || '';
    this.root.appendChild(this.descriptionEl);

    // Preview
    this.previewEl = document.createElement('div');
    this.previewEl.className = 'recalibrate-panel__preview';
    this.previewEl.textContent = PREVIEW_CONTENT[this.selectedLevel] || '';
    this.root.appendChild(this.previewEl);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'recalibrate-panel__actions';
    const applyButton = document.createElement('button');
    applyButton.className = 'recalibrate-panel__apply';
    applyButton.textContent = 'Apply';
    actions.appendChild(applyButton);
    this.root.appendChild(actions);

    // Event handlers
    this.handleSliderInput = () => {
      this.selectedLevel = Number(this.slider!.value) as MagicLevel;
      this.renderLabels();
      this.descriptionEl!.textContent =
        LEVEL_DESCRIPTIONS[this.selectedLevel] || '';
      this.previewEl!.textContent =
        PREVIEW_CONTENT[this.selectedLevel] || '';
    };
    this.slider.addEventListener('input', this.handleSliderInput);

    this.handleApplyClick = () => {
      saveMagicLevel(this.selectedLevel).catch(() => {
        /* ignore persistence errors in UI */
      });
      this.onApply?.(this.selectedLevel);
      this.onLevelChange?.(this.selectedLevel);
    };
    applyButton.addEventListener('click', this.handleApplyClick);

    this.container.appendChild(this.root);
  }

  destroy(): void {
    if (this.slider && this.handleSliderInput) {
      this.slider.removeEventListener('input', this.handleSliderInput);
    }
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
  }

  getSelectedLevel(): MagicLevel {
    return this.selectedLevel;
  }

  private renderLabels(): void {
    if (!this.labelsContainer) return;
    this.labelsContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const span = document.createElement('span');
      span.textContent = LEVEL_LABELS[i as MagicLevel] || '';
      if (i === this.selectedLevel) {
        span.classList.add('recalibrate-panel__label--active');
      }
      this.labelsContainer.appendChild(span);
    }
  }
}
