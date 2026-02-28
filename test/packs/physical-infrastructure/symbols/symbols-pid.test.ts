import { describe, it, expect } from 'vitest';
import {
  PID_SYMBOLS,
  PID_LINE_TYPES,
} from '../../../../skills/physical-infrastructure/skills/blueprint-engine/references/symbols/symbols-pid.js';

describe('Symbol inventory count', () => {
  it('has exactly 50 P&ID symbols', () => {
    expect(Object.keys(PID_SYMBOLS).length).toBe(50);
  });
  it('has exactly 3 line type definitions', () => {
    expect(Object.keys(PID_LINE_TYPES).length).toBe(3);
  });
});

describe('Category coverage', () => {
  const byCategory = (cat: string) =>
    Object.values(PID_SYMBOLS).filter(s => s.category === cat);

  it('has at least 10 valve symbols', () => {
    expect(byCategory('valve').length).toBeGreaterThanOrEqual(10);
  });
  it('has at least 4 pump symbols', () => {
    expect(byCategory('pump').length).toBeGreaterThanOrEqual(4);
  });
  it('has at least 4 heat-exchanger symbols', () => {
    expect(byCategory('heat-exchanger').length).toBeGreaterThanOrEqual(4);
  });
  it('has at least 4 vessel symbols (including strainer)', () => {
    expect(byCategory('vessel').length).toBeGreaterThanOrEqual(4);
  });
  it('has at least 12 instrument symbols', () => {
    expect(byCategory('instrument').length).toBeGreaterThanOrEqual(12);
  });
  it('has at least 6 pipe fitting symbols', () => {
    expect(byCategory('pipe-fitting').length).toBeGreaterThanOrEqual(6);
  });
});

describe('Required symbols present', () => {
  it('has valve-gate', () => expect(PID_SYMBOLS['valve-gate']).toBeDefined());
  it('has valve-globe', () => expect(PID_SYMBOLS['valve-globe']).toBeDefined());
  it('has valve-ball', () => expect(PID_SYMBOLS['valve-ball']).toBeDefined());
  it('has valve-butterfly', () => expect(PID_SYMBOLS['valve-butterfly']).toBeDefined());
  it('has valve-check-swing', () => expect(PID_SYMBOLS['valve-check-swing']).toBeDefined());
  it('has valve-relief', () => expect(PID_SYMBOLS['valve-relief']).toBeDefined());
  it('has pump-centrifugal', () => expect(PID_SYMBOLS['pump-centrifugal']).toBeDefined());
  it('has pump-positive-displacement', () => expect(PID_SYMBOLS['pump-positive-displacement']).toBeDefined());
  it('has hx-shell-tube', () => expect(PID_SYMBOLS['hx-shell-tube']).toBeDefined());
  it('has hx-plate', () => expect(PID_SYMBOLS['hx-plate']).toBeDefined());
  it('has vessel-tank-open', () => expect(PID_SYMBOLS['vessel-tank-open']).toBeDefined());
  it('has vessel-strainer', () => expect(PID_SYMBOLS['vessel-strainer']).toBeDefined());
  it('has instrument-TI', () => expect(PID_SYMBOLS['instrument-TI']).toBeDefined());
  it('has instrument-PT', () => expect(PID_SYMBOLS['instrument-PT']).toBeDefined());
  it('has instrument-FC', () => expect(PID_SYMBOLS['instrument-FC']).toBeDefined());
  it('has instrument-LT', () => expect(PID_SYMBOLS['instrument-LT']).toBeDefined());
  it('has fitting-elbow-90', () => expect(PID_SYMBOLS['fitting-elbow-90']).toBeDefined());
  it('has fitting-tee', () => expect(PID_SYMBOLS['fitting-tee']).toBeDefined());
  it('has fitting-reducer', () => expect(PID_SYMBOLS['fitting-reducer']).toBeDefined());
  it('has fitting-flange', () => expect(PID_SYMBOLS['fitting-flange']).toBeDefined());
});

describe('SVG structure validity', () => {
  const symbols = Object.values(PID_SYMBOLS);

  it('every symbol has a non-empty id', () => {
    symbols.forEach(s => expect(s.id.length).toBeGreaterThan(0));
  });
  it('every symbol has a non-empty name', () => {
    symbols.forEach(s => expect(s.name.length).toBeGreaterThan(0));
  });
  it('every symbol has standard ISA-5.1', () => {
    symbols.forEach(s => expect(s.standard).toBe('ISA-5.1'));
  });
  it('every symbol has a valid viewBox (4 space-separated numbers)', () => {
    symbols.forEach(s => {
      const parts = s.viewBox.split(' ');
      expect(parts.length).toBe(4);
      parts.forEach(p => expect(isNaN(Number(p))).toBe(false));
    });
  });
  it('every symbol has non-empty svgContent', () => {
    symbols.forEach(s => expect(s.svgContent.trim().length).toBeGreaterThan(0));
  });
  it('every symbol has at least 1 connection point', () => {
    symbols.forEach(s => {
      if (s.category !== 'instrument') {
        expect(s.connectionPoints.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
  it('every symbol has at least 1 tag', () => {
    symbols.forEach(s => expect(s.tags.length).toBeGreaterThanOrEqual(1));
  });
});

describe('Line type definitions', () => {
  it('has process-pipe line type', () => {
    expect(PID_LINE_TYPES['process-pipe']).toBeDefined();
    expect(PID_LINE_TYPES['process-pipe'].svgStrokeWidth).toBeGreaterThanOrEqual(1.5);
    expect(PID_LINE_TYPES['process-pipe'].svgStrokeDasharray).toBeUndefined();
  });
  it('has instrument-signal line type (dashed)', () => {
    expect(PID_LINE_TYPES['instrument-signal']).toBeDefined();
    expect(PID_LINE_TYPES['instrument-signal'].svgStrokeDasharray).toBeDefined();
    expect(PID_LINE_TYPES['instrument-signal'].svgStrokeDasharray).toContain(',');
  });
  it('has electrical-signal line type (dot-dash)', () => {
    expect(PID_LINE_TYPES['electrical-signal']).toBeDefined();
    expect(PID_LINE_TYPES['electrical-signal'].svgStrokeDasharray).toBeDefined();
  });
});
