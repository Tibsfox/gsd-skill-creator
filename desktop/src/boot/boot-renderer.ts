/**
 * Boot sequence DOM renderer.
 *
 * Creates a fullscreen overlay that animates chipset initialization with
 * timing-driven state transitions, user palette colors, and skip-on-click
 * or keypress. The renderer reads the chipset state machine (chipset.ts)
 * and produces a retro "system initialization" screen showing each chipset
 * appearing one by one with a progress indicator.
 *
 * Lifecycle: call `start()` which returns a Promise that resolves when the
 * boot completes naturally or is skipped by user interaction. The overlay
 * is automatically cleaned up on completion.
 */

import { createBootState, CHIPSETS, BOOT_TIMING } from './types.js';
import type { BootState } from './types.js';
import { advanceSequence, getSequenceProgress, skipSequence } from './chipset.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for creating a boot renderer. */
export interface BootRendererOptions {
  /** Container element to append the boot screen overlay to. */
  container: HTMLElement;
  /** Optional 32-color hex palette. Defaults to a built-in dark palette. */
  palette?: string[];
}

/** Boot renderer interface. */
export interface BootRenderer {
  /** Start the boot animation. Resolves when boot completes or is skipped. */
  start(): Promise<void>;
  /** Force-skip the boot sequence. */
  skip(): void;
  /** Clean up DOM and listeners. Called automatically on complete/skip. */
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Default palette
// ---------------------------------------------------------------------------

/** Minimal default palette when none is provided. */
const DEFAULT_PALETTE: string[] = [
  '#0a0a0a', '#1a1a2e', '#16213e', '#0f3460',
  '#533483', '#e94560', '#f5a623', '#f7dc6f',
  '#82e0aa', '#48c9b0', '#45b7d1', '#3498db',
  '#2980b9', '#8e44ad', '#27ae60', '#2ecc71',
  '#1abc9c', '#f39c12', '#e67e22', '#d35400',
  '#c0392b', '#e74c3c', '#9b59b6', '#2c3e50',
  '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7',
  '#ecf0f1', '#d5dbdb', '#aab7b8', '#f0f0f0',
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a boot renderer that manages the boot animation lifecycle.
 *
 * @param options.container - DOM element to render into
 * @param options.palette   - Optional 32-color hex palette
 * @returns BootRenderer with start/skip/destroy methods
 */
export function createBootRenderer(options: BootRendererOptions): BootRenderer {
  const { container, palette = DEFAULT_PALETTE } = options;

  let state: BootState = createBootState();
  let screen: HTMLDivElement | null = null;
  let rafId = 0;
  let resolve: (() => void) | null = null;
  let prevTimestamp = -1;
  let destroyed = false;
  let fadeoutStarted = false;
  let fadeoutTime = -1;

  // Track which chipsets have been rendered to avoid duplicate DOM entries
  let renderedChipsetCount = 0;

  // DOM references
  let chipsetList: HTMLDivElement | null = null;
  let progressFill: HTMLDivElement | null = null;
  let messageEl: HTMLDivElement | null = null;

  // Event handlers (stored for removal)
  const onClickHandler = (): void => doSkip();
  const onKeydownHandler = (): void => doSkip();

  // -------------------------------------------------------------------------
  // DOM creation
  // -------------------------------------------------------------------------

  function createDOM(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'boot-screen';

    // Apply palette CSS custom properties
    el.style.setProperty('--boot-bg', palette[0] ?? '#0a0a0a');
    el.style.setProperty('--boot-text', palette[31] ?? '#f0f0f0');
    el.style.setProperty('--boot-accent', palette[3] ?? '#0f3460');
    el.style.setProperty('--boot-ok', palette[14] ?? '#27ae60');
    el.style.setProperty('--boot-progress', palette[3] ?? '#0f3460');

    // Header
    const header = document.createElement('div');
    header.className = 'boot-header';
    header.textContent = 'GSD-OS v0.1.0';
    el.appendChild(header);

    // Chipset list
    chipsetList = document.createElement('div');
    chipsetList.className = 'boot-chipset-list';
    el.appendChild(chipsetList);

    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'boot-progress';
    progressFill = document.createElement('div');
    progressFill.className = 'boot-progress-fill';
    progressFill.style.width = '0%';
    progress.appendChild(progressFill);
    el.appendChild(progress);

    // Message area
    messageEl = document.createElement('div');
    messageEl.className = 'boot-message';
    el.appendChild(messageEl);

    // Skip hint
    const hint = document.createElement('div');
    hint.className = 'boot-skip-hint';
    hint.textContent = 'Click or press any key to skip';
    el.appendChild(hint);

    return el;
  }

  // -------------------------------------------------------------------------
  // Chipset line rendering
  // -------------------------------------------------------------------------

  function renderChipsetLine(index: number): void {
    if (!chipsetList) return;

    const chipDef = CHIPSETS[index];
    if (!chipDef) return;

    const line = document.createElement('div');
    line.className = 'boot-chipset-line boot-chipset-line--active';

    const name = document.createElement('span');
    name.className = 'boot-chip-name';
    name.textContent = chipDef.name;

    const role = document.createElement('span');
    role.className = 'boot-chip-role';
    role.textContent = chipDef.role;

    const status = document.createElement('span');
    status.className = 'boot-chip-status';
    status.textContent = 'OK';

    line.appendChild(name);
    line.appendChild(role);
    line.appendChild(status);
    chipsetList.appendChild(line);
  }

  // -------------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------------

  function frame(timestamp: number): void {
    if (destroyed || !screen) return;

    // First frame: record start time, no delta yet
    if (prevTimestamp < 0) {
      prevTimestamp = timestamp;
      rafId = requestAnimationFrame(frame);
      return;
    }

    const deltaMs = timestamp - prevTimestamp;
    prevTimestamp = timestamp;

    // Advance state machine with incremental delta
    state = advanceSequence(state, deltaMs);

    // Render newly initialized chipsets
    const initializedCount = state.chipsetStatuses.filter(Boolean).length;
    while (renderedChipsetCount < initializedCount) {
      renderChipsetLine(renderedChipsetCount);
      renderedChipsetCount++;
    }

    // Update progress bar
    const progress = getSequenceProgress(state);
    if (progressFill) {
      progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    // Show "System Ready" when in ready phase
    if (state.phase === 'ready' && messageEl) {
      messageEl.textContent = 'System Ready';
    }

    // Handle complete/skipped -> fadeout
    if (
      (state.phase === 'complete' || state.phase === 'skipped') &&
      !fadeoutStarted
    ) {
      fadeoutStarted = true;
      fadeoutTime = timestamp;
      screen.classList.add('boot-screen--fadeout');
    }

    // After fadeout transition, resolve and destroy
    if (fadeoutStarted && fadeoutTime >= 0) {
      const fadeElapsed = timestamp - fadeoutTime;
      if (fadeElapsed >= BOOT_TIMING.transitionDurationMs) {
        finish();
        return;
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  // -------------------------------------------------------------------------
  // Skip and finish
  // -------------------------------------------------------------------------

  function doSkip(): void {
    if (destroyed || fadeoutStarted) return;
    state = skipSequence(state);
    // Fadeout will be applied on the next frame
  }

  function finish(): void {
    if (resolve) {
      const r = resolve;
      resolve = null;
      // Destroy first, then resolve
      destroy();
      r();
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  function start(): Promise<void> {
    return new Promise<void>((res) => {
      resolve = res;

      // Create DOM
      screen = createDOM();
      container.appendChild(screen);

      // Attach event listeners for skip
      screen.addEventListener('click', onClickHandler);
      screen.addEventListener('keydown', onKeydownHandler);

      // Start animation loop
      rafId = requestAnimationFrame(frame);
    });
  }

  function skip(): void {
    doSkip();
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;

    // Cancel animation frame
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }

    // Remove event listeners
    if (screen) {
      screen.removeEventListener('click', onClickHandler);
      screen.removeEventListener('keydown', onKeydownHandler);
      screen.remove();
      screen = null;
    }

    chipsetList = null;
    progressFill = null;
    messageEl = null;
  }

  return { start, skip, destroy };
}
