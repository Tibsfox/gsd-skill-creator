/**
 * Tests for RecalibratePanel: slider, labels, preview, Apply, live switching.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

import { RecalibratePanel } from './recalibrate-panel';
import { MagicLevel } from './types';

function createContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  mockInvoke.mockReset();
  // Default getMagicLevel returns level 3
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'get_magic_level') return Promise.resolve({ level: 3 });
    if (cmd === 'set_magic_level')
      return Promise.resolve({ level: 3, previous_level: 3 });
    return Promise.resolve({});
  });
  document.body.innerHTML = '';
});

describe('RecalibratePanel', () => {
  it('renders .recalibrate-panel container', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({ container });
    await panel.mount();
    expect(container.querySelector('.recalibrate-panel')).not.toBeNull();
  });

  it('renders 5-step slider input', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({ container });
    await panel.mount();
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    expect(slider).not.toBeNull();
    expect(slider.min).toBe('1');
    expect(slider.max).toBe('5');
    expect(slider.step).toBe('1');
  });

  it('slider default value is current level', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({
      container,
      initialLevel: MagicLevel.ANNOTATED,
    });
    await panel.mount();
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    expect(slider.value).toBe('3');
  });

  it('renders level labels for all 5 levels', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({ container });
    await panel.mount();
    const labels = container.querySelectorAll('.recalibrate-panel__labels span');
    expect(labels.length).toBe(5);
    const texts = Array.from(labels).map((l) => l.textContent);
    expect(texts).toContain('Full Magic');
    expect(texts).toContain('Guided');
    expect(texts).toContain('Annotated');
    expect(texts).toContain('Verbose');
    expect(texts).toContain('No Magic');
  });

  it('moving slider updates preview area', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({ container });
    await panel.mount();
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    slider.value = '1';
    slider.dispatchEvent(new Event('input'));
    const preview = container.querySelector('.recalibrate-panel__preview');
    expect(preview).not.toBeNull();
    expect(preview!.textContent).toBeTruthy();
  });

  it('moving slider to 5 shows raw preview', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({ container });
    await panel.mount();
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    slider.value = '5';
    slider.dispatchEvent(new Event('input'));
    const preview = container.querySelector('.recalibrate-panel__preview');
    expect(preview!.textContent!.toLowerCase()).toMatch(/debug|raw/);
  });

  it('preview shows sample service event at selected level', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({ container });
    await panel.mount();
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    const preview = container.querySelector('.recalibrate-panel__preview');

    // Level 3: mentions command output
    slider.value = '3';
    slider.dispatchEvent(new Event('input'));
    const text3 = preview!.textContent!.toLowerCase();
    expect(text3).toMatch(/watch|start|command/);

    // Level 1: mentions visual indicators or shapes
    slider.value = '1';
    slider.dispatchEvent(new Event('input'));
    const text1 = preview!.textContent!.toLowerCase();
    expect(text1).toMatch(/led|green|dot/);
  });

  it('Apply button exists and calls onApply', async () => {
    const onApply = vi.fn();
    const container = createContainer();
    const panel = new RecalibratePanel({ container, onApply });
    await panel.mount();
    const button = container.querySelector(
      '.recalibrate-panel__apply',
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    // Wait for async saveMagicLevel
    await new Promise((r) => setTimeout(r, 10));
    expect(onApply).toHaveBeenCalledWith(MagicLevel.ANNOTATED);
  });

  it('Apply button triggers persistence save', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({ container });
    await panel.mount();
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    slider.value = '4';
    slider.dispatchEvent(new Event('input'));
    const button = container.querySelector(
      '.recalibrate-panel__apply',
    ) as HTMLButtonElement;
    button.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(mockInvoke).toHaveBeenCalledWith('set_magic_level', { level: 4 });
  });

  it('level change is immediate (calls onLevelChange on Apply)', async () => {
    const onLevelChange = vi.fn();
    const container = createContainer();
    const panel = new RecalibratePanel({ container, onLevelChange });
    await panel.mount();
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    slider.value = '2';
    slider.dispatchEvent(new Event('input'));
    const button = container.querySelector(
      '.recalibrate-panel__apply',
    ) as HTMLButtonElement;
    button.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(onLevelChange).toHaveBeenCalledWith(MagicLevel.GUIDED);
  });

  it('slider highlights current active level', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({
      container,
      initialLevel: MagicLevel.ANNOTATED,
    });
    await panel.mount();
    const labels = container.querySelectorAll('.recalibrate-panel__labels span');
    const activeLabel = Array.from(labels).find((l) =>
      l.classList.contains('recalibrate-panel__label--active'),
    );
    expect(activeLabel).not.toBeUndefined();
    expect(activeLabel!.textContent).toBe('Annotated');
  });

  it('panel shows description for each level on slider move', async () => {
    const container = createContainer();
    const panel = new RecalibratePanel({ container });
    await panel.mount();
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    const desc = container.querySelector('.recalibrate-panel__description');

    slider.value = '1';
    slider.dispatchEvent(new Event('input'));
    expect(desc!.textContent!.toLowerCase()).toMatch(/shapes|colors/);

    slider.value = '5';
    slider.dispatchEvent(new Event('input'));
    expect(desc!.textContent!.toLowerCase()).toMatch(/raw|everything/);
  });
});
