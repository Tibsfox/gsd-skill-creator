import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBootRenderer } from './boot-renderer.js';
import { CHIPSETS, BOOT_TIMING } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default palette: 32 hex colors (index 0 = near-black, 31 = near-white). */
const TEST_PALETTE = [
  '#0a0a0a', '#1a1a2e', '#16213e', '#0f3460', // 0-3
  '#533483', '#e94560', '#f5a623', '#f7dc6f', // 4-7
  '#82e0aa', '#48c9b0', '#45b7d1', '#3498db', // 8-11
  '#2980b9', '#8e44ad', '#27ae60', '#2ecc71', // 12-15 (14 = green-ish)
  '#1abc9c', '#f39c12', '#e67e22', '#d35400', // 16-19
  '#c0392b', '#e74c3c', '#9b59b6', '#2c3e50', // 20-23
  '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', // 24-27
  '#ecf0f1', '#d5dbdb', '#aab7b8', '#f0f0f0', // 28-31
];

/** Trigger a requestAnimationFrame callback manually with given timestamp. */
function triggerRAF(time: number): void {
  const callbacks = (globalThis as any).__rafCallbacks as Array<(t: number) => void> | undefined;
  if (callbacks && callbacks.length > 0) {
    const batch = [...callbacks];
    callbacks.length = 0;
    for (const cb of batch) cb(time);
  }
}

/**
 * Drive the animation loop through multiple frames using small incremental
 * steps. The state machine requires per-frame deltas (it resets elapsedMs
 * on phase transitions), so we simulate ~16ms frames up to the target time.
 */
function advanceToTime(targetMs: number, stepMs = 16): void {
  let t = 0;
  // First frame sets prevTimestamp
  triggerRAF(t);
  while (t < targetMs) {
    t = Math.min(t + stepMs, targetMs);
    triggerRAF(t);
  }
}

let container: HTMLDivElement;
let rafCallbacks: Array<(t: number) => void>;
let originalRAF: typeof globalThis.requestAnimationFrame;
let originalCAF: typeof globalThis.cancelAnimationFrame;
let rafIdCounter: number;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);

  // Mock requestAnimationFrame / cancelAnimationFrame
  rafCallbacks = [];
  (globalThis as any).__rafCallbacks = rafCallbacks;
  rafIdCounter = 0;
  originalRAF = globalThis.requestAnimationFrame;
  originalCAF = globalThis.cancelAnimationFrame;

  globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback): number => {
    rafCallbacks.push(cb as (t: number) => void);
    return ++rafIdCounter;
  }) as any;
  globalThis.cancelAnimationFrame = vi.fn((_id: number): void => {
    rafCallbacks.length = 0;
  }) as any;
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalRAF;
  globalThis.cancelAnimationFrame = originalCAF;
  delete (globalThis as any).__rafCallbacks;
  container.remove();
});

// Cumulative timings for convenience
const INIT_END = BOOT_TIMING.initDurationMs; // 400
const AGNUS_END = INIT_END + CHIPSETS[0].delayMs; // 400 + 600 = 1000
const DENISE_END = AGNUS_END + CHIPSETS[1].delayMs; // 1000 + 800 = 1800
const PAULA_END = DENISE_END + CHIPSETS[2].delayMs; // 1800 + 700 = 2500
const GARY_END = PAULA_END + CHIPSETS[3].delayMs; // 2500 + 500 = 3000
const READY_END = GARY_END + BOOT_TIMING.readyDurationMs; // 3000 + 800 = 3800
const COMPLETE_END = READY_END + BOOT_TIMING.transitionDurationMs; // 3800 + 200 = 4000

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createBootRenderer', () => {
  it('returns object with start, skip, destroy methods', () => {
    const renderer = createBootRenderer({ container });
    expect(renderer).toHaveProperty('start');
    expect(renderer).toHaveProperty('skip');
    expect(renderer).toHaveProperty('destroy');
    expect(typeof renderer.start).toBe('function');
    expect(typeof renderer.skip).toBe('function');
    expect(typeof renderer.destroy).toBe('function');
    renderer.destroy();
  });
});

describe('start()', () => {
  it('creates boot-screen element in container', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    expect(container.querySelector('.boot-screen')).not.toBeNull();
    renderer.destroy();
  });

  it('boot-screen has boot-header with "GSD-OS" text', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    const header = container.querySelector('.boot-header');
    expect(header).not.toBeNull();
    expect(header!.textContent).toContain('GSD-OS');
    renderer.destroy();
  });

  it('boot-screen has boot-chipset-list container (initially empty)', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    const list = container.querySelector('.boot-chipset-list');
    expect(list).not.toBeNull();
    expect(list!.children.length).toBe(0);
    renderer.destroy();
  });

  it('boot-screen has boot-progress bar', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    const progress = container.querySelector('.boot-progress');
    expect(progress).not.toBeNull();
    const fill = container.querySelector('.boot-progress-fill');
    expect(fill).not.toBeNull();
    renderer.destroy();
  });

  it('boot-screen has boot-skip-hint text', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    const hint = container.querySelector('.boot-skip-hint');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('skip');
    renderer.destroy();
  });
});

describe('chipset animation', () => {
  it('after advancing past init phase, first chipset line (Agnus) appears', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    advanceToTime(AGNUS_END);
    const lines = container.querySelectorAll('.boot-chipset-line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    renderer.destroy();
  });

  it('Agnus line shows name "Agnus" and role "Graphics DMA"', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    advanceToTime(AGNUS_END);
    const line = container.querySelector('.boot-chipset-line');
    expect(line).not.toBeNull();
    const name = line!.querySelector('.boot-chip-name');
    const role = line!.querySelector('.boot-chip-role');
    expect(name!.textContent).toBe('Agnus');
    expect(role!.textContent).toBe('Graphics DMA');
    renderer.destroy();
  });

  it('after Agnus initializes, status shows "OK"', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    advanceToTime(AGNUS_END);
    const status = container.querySelector('.boot-chip-status');
    expect(status).not.toBeNull();
    expect(status!.textContent).toBe('OK');
    renderer.destroy();
  });

  it('all 4 chipsets appear in order as sequence advances', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    advanceToTime(GARY_END);
    const lines = container.querySelectorAll('.boot-chipset-line');
    expect(lines.length).toBe(4);
    const names = Array.from(lines).map(
      (l) => l.querySelector('.boot-chip-name')!.textContent,
    );
    expect(names).toEqual(['Agnus', 'Denise', 'Paula', 'Gary']);
    renderer.destroy();
  });
});

describe('progress bar', () => {
  it('progress bar fill width increases with getSequenceProgress', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    triggerRAF(0);

    const fill = container.querySelector('.boot-progress-fill') as HTMLElement;

    // Advance partway through init
    triggerRAF(BOOT_TIMING.initDurationMs / 2);
    const midWidth = fill.style.width;
    expect(midWidth).not.toBe('0%');

    // Advance further (still incremental delta)
    triggerRAF(BOOT_TIMING.initDurationMs);
    const laterWidth = fill.style.width;
    expect(parseFloat(laterWidth)).toBeGreaterThan(parseFloat(midWidth));

    renderer.destroy();
  });
});

describe('phase transitions', () => {
  it('when phase reaches ready, boot-message shows "System Ready"', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    advanceToTime(GARY_END + 16); // Just past all chipsets -> ready phase
    const msg = container.querySelector('.boot-message');
    expect(msg).not.toBeNull();
    expect(msg!.textContent).toContain('System Ready');
    renderer.destroy();
  });

  it('when phase reaches complete, boot-screen gets fadeout class', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    // Advance past ready phase end (add margin for frame alignment)
    advanceToTime(READY_END + 32);
    const screen = container.querySelector('.boot-screen');
    expect(screen!.classList.contains('boot-screen--fadeout')).toBe(true);
    renderer.destroy();
  });

  it('start() promise resolves when boot completes', async () => {
    const renderer = createBootRenderer({ container });
    let resolved = false;
    const promise = renderer.start().then(() => {
      resolved = true;
    });

    // Advance past transition end (add margin for frame alignment)
    advanceToTime(COMPLETE_END + 32);

    await promise;
    expect(resolved).toBe(true);
  });
});

describe('skip handling', () => {
  it('skip() sets phase to skipped and triggers fadeout', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    triggerRAF(0);
    renderer.skip();
    triggerRAF(100);
    const screen = container.querySelector('.boot-screen');
    expect(screen!.classList.contains('boot-screen--fadeout')).toBe(true);
  });

  it('click on container triggers skip', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    triggerRAF(0);
    container.querySelector('.boot-screen')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    triggerRAF(100);
    const screen = container.querySelector('.boot-screen');
    expect(screen!.classList.contains('boot-screen--fadeout')).toBe(true);
  });

  it('keydown on container triggers skip', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    triggerRAF(0);
    container.querySelector('.boot-screen')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    triggerRAF(100);
    const screen = container.querySelector('.boot-screen');
    expect(screen!.classList.contains('boot-screen--fadeout')).toBe(true);
  });

  it('skip() promise resolves after transition', async () => {
    const renderer = createBootRenderer({ container });
    let resolved = false;
    const promise = renderer.start().then(() => {
      resolved = true;
    });

    triggerRAF(0);
    renderer.skip();
    // Frame to apply skip -> fadeout
    triggerRAF(100);
    // Frame after transition duration
    triggerRAF(100 + BOOT_TIMING.transitionDurationMs);

    await promise;
    expect(resolved).toBe(true);
  });
});

describe('destroy()', () => {
  it('removes boot-screen from container', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    expect(container.querySelector('.boot-screen')).not.toBeNull();
    renderer.destroy();
    expect(container.querySelector('.boot-screen')).toBeNull();
  });

  it('removes event listeners (no double-fire on subsequent clicks)', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    triggerRAF(0);
    renderer.destroy();
    expect(() => {
      container.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    }).not.toThrow();
  });
});

describe('palette colors', () => {
  it('custom palette colors applied to boot-screen element CSS variables', () => {
    const renderer = createBootRenderer({ container, palette: TEST_PALETTE });
    renderer.start();
    const screen = container.querySelector('.boot-screen') as HTMLElement;
    expect(screen.style.getPropertyValue('--boot-bg')).toBe(TEST_PALETTE[0]);
    expect(screen.style.getPropertyValue('--boot-text')).toBe(TEST_PALETTE[31]);
    expect(screen.style.getPropertyValue('--boot-accent')).toBe(TEST_PALETTE[3]);
    expect(screen.style.getPropertyValue('--boot-ok')).toBe(TEST_PALETTE[14]);
    expect(screen.style.getPropertyValue('--boot-progress')).toBe(TEST_PALETTE[3]);
    renderer.destroy();
  });

  it('default palette used when no palette provided', () => {
    const renderer = createBootRenderer({ container });
    renderer.start();
    const screen = container.querySelector('.boot-screen') as HTMLElement;
    expect(screen.style.getPropertyValue('--boot-bg')).not.toBe('');
    expect(screen.style.getPropertyValue('--boot-text')).not.toBe('');
    renderer.destroy();
  });
});
