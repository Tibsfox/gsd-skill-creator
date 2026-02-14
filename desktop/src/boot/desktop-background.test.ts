import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  type BackgroundMode,
  type DesktopBackground,
  applyBackgroundMode,
  createDesktopBackground,
} from './desktop-background';

/** Minimal Engine mock with copper list methods. */
function createMockEngine() {
  return {
    setCopperProgram: vi.fn(),
    setCopperEntries: vi.fn(),
  };
}

describe('applyBackgroundMode', () => {
  let engine: ReturnType<typeof createMockEngine>;

  beforeEach(() => {
    engine = createMockEngine();
  });

  it('calls setCopperProgram("gradient") for gradient mode', () => {
    applyBackgroundMode(engine as any, 'gradient');
    expect(engine.setCopperProgram).toHaveBeenCalledWith('gradient');
  });

  it('calls setCopperProgram("flat") for flat mode', () => {
    applyBackgroundMode(engine as any, 'flat');
    expect(engine.setCopperProgram).toHaveBeenCalledWith('flat');
  });

  it('calls setCopperProgram("flat") for disabled mode', () => {
    applyBackgroundMode(engine as any, 'disabled');
    expect(engine.setCopperProgram).toHaveBeenCalledWith('flat');
  });
});

describe('createDesktopBackground', () => {
  let engine: ReturnType<typeof createMockEngine>;

  beforeEach(() => {
    engine = createMockEngine();
  });

  it('applies initial mode on creation', () => {
    createDesktopBackground(engine as any, 'gradient');
    expect(engine.setCopperProgram).toHaveBeenCalledWith('gradient');
  });

  it('exposes current mode via .mode', () => {
    const bg = createDesktopBackground(engine as any, 'flat');
    expect(bg.mode).toBe('flat');
  });

  it('setMode changes mode and calls applyBackgroundMode', () => {
    const bg = createDesktopBackground(engine as any, 'gradient');
    engine.setCopperProgram.mockClear();

    bg.setMode('flat');
    expect(bg.mode).toBe('flat');
    expect(engine.setCopperProgram).toHaveBeenCalledWith('flat');
  });

  it('setMode to same mode does not call engine methods again', () => {
    const bg = createDesktopBackground(engine as any, 'gradient');
    engine.setCopperProgram.mockClear();

    bg.setMode('gradient');
    expect(engine.setCopperProgram).not.toHaveBeenCalled();
  });

  it('setMode to disabled from gradient switches correctly', () => {
    const bg = createDesktopBackground(engine as any, 'gradient');
    engine.setCopperProgram.mockClear();

    bg.setMode('disabled');
    expect(bg.mode).toBe('disabled');
    expect(engine.setCopperProgram).toHaveBeenCalledWith('flat');
  });

  it('tracks disabled as mode even though engine shows flat', () => {
    const bg = createDesktopBackground(engine as any, 'disabled');
    expect(bg.mode).toBe('disabled');
    // Engine receives 'flat' but DesktopBackground reports 'disabled'
    expect(engine.setCopperProgram).toHaveBeenCalledWith('flat');
  });

  it('destroy does not throw', () => {
    const bg = createDesktopBackground(engine as any, 'gradient');
    expect(() => bg.destroy()).not.toThrow();
  });
});
