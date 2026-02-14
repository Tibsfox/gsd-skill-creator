/**
 * Tests for accessibility mode detection and enforcement.
 *
 * Verifies OS media query detection (prefers-reduced-motion, prefers-contrast),
 * accessibility mode application/removal, and runtime change watching.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock matchMedia before importing the module
const matchMediaResults: Record<string, boolean> = {};
const matchMediaListeners: Record<string, Array<(e: { matches: boolean }) => void>> = {};

function mockMatchMedia(query: string) {
  return {
    matches: matchMediaResults[query] ?? false,
    media: query,
    addEventListener: vi.fn((event: string, cb: (e: { matches: boolean }) => void) => {
      if (event === 'change') {
        if (!matchMediaListeners[query]) matchMediaListeners[query] = [];
        matchMediaListeners[query].push(cb);
      }
    }),
    removeEventListener: vi.fn((event: string, cb: (e: { matches: boolean }) => void) => {
      if (event === 'change' && matchMediaListeners[query]) {
        matchMediaListeners[query] = matchMediaListeners[query].filter((l) => l !== cb);
      }
    }),
    dispatchEvent: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
}

vi.stubGlobal('matchMedia', vi.fn((query: string) => mockMatchMedia(query)));

// Mock removeCSSFallback
vi.mock('../engine/css-fallback.js', () => ({
  removeCSSFallback: vi.fn(),
}));

import {
  detectAccessibilityPreferences,
  applyAccessibilityMode,
  removeAccessibilityMode,
  watchAccessibilityChanges,
  HIGH_CONTRAST_PALETTE,
} from './accessibility.js';
import { removeCSSFallback } from '../engine/css-fallback.js';
import type { UserStyle } from '../calibration/user-style.js';

// ---------------------------------------------------------------------------
// Mock Engine
// ---------------------------------------------------------------------------

function createMockEngine() {
  return {
    updateConfig: vi.fn(),
    setPaletteColors: vi.fn(),
    setPalette: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
    getConfig: vi.fn(() => ({})),
    mode: 'webgl2' as const,
  };
}

// ---------------------------------------------------------------------------
// Mock UserStyle
// ---------------------------------------------------------------------------

function createMockUserStyle(): UserStyle {
  return {
    palette: {
      preset: 'amiga-3.1' as const,
      colors: Array(32).fill('#aabbcc'),
      anchors: [],
    },
    crt: {
      enabled: true,
      scanlineIntensity: 0.6,
      barrelDistortion: 0.15,
      phosphorGlow: 0.4,
      chromaticAberration: 2.0,
      vignette: 0.5,
    },
    mode: 'dark' as const,
    boot: { skip: false, background: 'gradient' as const },
    calibrated: true,
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset matchMedia mocks
  matchMediaResults['(prefers-reduced-motion: reduce)'] = false;
  matchMediaResults['(prefers-contrast: more)'] = false;
  for (const key of Object.keys(matchMediaListeners)) {
    delete matchMediaListeners[key];
  }

  // Reset document state
  document.documentElement.classList.remove('gsd-os--a11y');
  delete document.documentElement.dataset.a11y;
  document.documentElement.style.removeProperty('--bg-primary');
  document.documentElement.style.removeProperty('--fg-primary');
  document.documentElement.style.removeProperty('--accent-primary');

  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// detectAccessibilityPreferences
// ---------------------------------------------------------------------------

describe('detectAccessibilityPreferences', () => {
  it('returns false/false when no OS preferences are set', () => {
    const state = detectAccessibilityPreferences();
    expect(state.prefersReducedMotion).toBe(false);
    expect(state.prefersContrast).toBe(false);
    expect(state.isAccessibilityMode).toBe(false);
  });

  it('returns true for prefersReducedMotion when matchMedia matches', () => {
    matchMediaResults['(prefers-reduced-motion: reduce)'] = true;
    const state = detectAccessibilityPreferences();
    expect(state.prefersReducedMotion).toBe(true);
  });

  it('returns true for prefersContrast when matchMedia matches', () => {
    matchMediaResults['(prefers-contrast: more)'] = true;
    const state = detectAccessibilityPreferences();
    expect(state.prefersContrast).toBe(true);
  });

  it('isAccessibilityMode is true when either preference is active', () => {
    matchMediaResults['(prefers-reduced-motion: reduce)'] = true;
    const state = detectAccessibilityPreferences();
    expect(state.isAccessibilityMode).toBe(true);
  });

  it('isAccessibilityMode is true when both preferences are active', () => {
    matchMediaResults['(prefers-reduced-motion: reduce)'] = true;
    matchMediaResults['(prefers-contrast: more)'] = true;
    const state = detectAccessibilityPreferences();
    expect(state.isAccessibilityMode).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// HIGH_CONTRAST_PALETTE
// ---------------------------------------------------------------------------

describe('HIGH_CONTRAST_PALETTE', () => {
  it('has exactly 32 colors', () => {
    expect(HIGH_CONTRAST_PALETTE).toHaveLength(32);
  });

  it('slot 0 is pure black (#000000)', () => {
    expect(HIGH_CONTRAST_PALETTE[0]).toBe('#000000');
  });

  it('slot 31 is pure white (#FFFFFF)', () => {
    expect(HIGH_CONTRAST_PALETTE[31]).toBe('#FFFFFF');
  });
});

// ---------------------------------------------------------------------------
// applyAccessibilityMode
// ---------------------------------------------------------------------------

describe('applyAccessibilityMode', () => {
  it('calls engine.updateConfig with enabled:false', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    applyAccessibilityMode(engine as any, container);
    expect(engine.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('calls engine.setPaletteColors with HIGH_CONTRAST_PALETTE', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    applyAccessibilityMode(engine as any, container);
    expect(engine.setPaletteColors).toHaveBeenCalledWith(HIGH_CONTRAST_PALETTE);
  });

  it('adds gsd-os--a11y class to documentElement', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    applyAccessibilityMode(engine as any, container);
    expect(document.documentElement.classList.contains('gsd-os--a11y')).toBe(true);
  });

  it('sets data-a11y attribute', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    applyAccessibilityMode(engine as any, container);
    expect(document.documentElement.dataset.a11y).toBe('true');
  });

  it('sets --bg-primary to #000000', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    applyAccessibilityMode(engine as any, container);
    expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe('#000000');
  });

  it('sets --fg-primary to #FFFFFF', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    applyAccessibilityMode(engine as any, container);
    expect(document.documentElement.style.getPropertyValue('--fg-primary')).toBe('#FFFFFF');
  });

  it('calls removeCSSFallback on container', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    applyAccessibilityMode(engine as any, container);
    expect(removeCSSFallback).toHaveBeenCalledWith(container);
  });
});

// ---------------------------------------------------------------------------
// removeAccessibilityMode
// ---------------------------------------------------------------------------

describe('removeAccessibilityMode', () => {
  it('restores engine config from userStyle', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    const style = createMockUserStyle();

    // Apply first to set state
    applyAccessibilityMode(engine as any, container);
    vi.clearAllMocks();

    removeAccessibilityMode(engine as any, container, style);
    expect(engine.updateConfig).toHaveBeenCalledWith(style.crt);
  });

  it('restores engine palette from userStyle', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    const style = createMockUserStyle();

    applyAccessibilityMode(engine as any, container);
    vi.clearAllMocks();

    removeAccessibilityMode(engine as any, container, style);
    expect(engine.setPaletteColors).toHaveBeenCalledWith(style.palette.colors);
  });

  it('removes gsd-os--a11y class', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    const style = createMockUserStyle();

    applyAccessibilityMode(engine as any, container);
    removeAccessibilityMode(engine as any, container, style);
    expect(document.documentElement.classList.contains('gsd-os--a11y')).toBe(false);
  });

  it('removes data-a11y attribute', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    const style = createMockUserStyle();

    applyAccessibilityMode(engine as any, container);
    removeAccessibilityMode(engine as any, container, style);
    expect(document.documentElement.dataset.a11y).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// watchAccessibilityChanges
// ---------------------------------------------------------------------------

describe('watchAccessibilityChanges', () => {
  it('returns a cleanup function', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    const style = createMockUserStyle();
    const cleanup = watchAccessibilityChanges(engine as any, container, () => style);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('triggers applyAccessibilityMode when preference changes to true', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    const style = createMockUserStyle();
    const cleanup = watchAccessibilityChanges(engine as any, container, () => style);

    // Simulate prefers-reduced-motion changing to true
    matchMediaResults['(prefers-reduced-motion: reduce)'] = true;
    const listeners = matchMediaListeners['(prefers-reduced-motion: reduce)'] ?? [];
    for (const listener of listeners) {
      listener({ matches: true });
    }

    expect(engine.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(document.documentElement.classList.contains('gsd-os--a11y')).toBe(true);

    cleanup();
  });

  it('triggers removeAccessibilityMode when preference changes to false', () => {
    const engine = createMockEngine();
    const container = document.createElement('div');
    const style = createMockUserStyle();

    // Start with a11y active
    matchMediaResults['(prefers-reduced-motion: reduce)'] = true;
    applyAccessibilityMode(engine as any, container);
    vi.clearAllMocks();

    const cleanup = watchAccessibilityChanges(engine as any, container, () => style);

    // Simulate prefers-reduced-motion changing back to false
    matchMediaResults['(prefers-reduced-motion: reduce)'] = false;
    const listeners = matchMediaListeners['(prefers-reduced-motion: reduce)'] ?? [];
    for (const listener of listeners) {
      listener({ matches: false });
    }

    // Should have restored user CRT config
    expect(engine.updateConfig).toHaveBeenCalledWith(style.crt);
    expect(document.documentElement.classList.contains('gsd-os--a11y')).toBe(false);

    cleanup();
  });
});
