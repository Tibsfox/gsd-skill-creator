import { describe, it, expect } from 'vitest';
import {
  ELEC_SYMBOLS,
  ELEC_LINE_TYPES,
} from '../../../../skills/physical-infrastructure/skills/blueprint-engine/references/symbols/symbols-electrical.js';

describe('Symbol inventory count', () => {
  it('has exactly 30 electrical symbols', () => {
    expect(Object.keys(ELEC_SYMBOLS).length).toBe(30);
  });
  it('has at least 3 electrical line type definitions', () => {
    expect(Object.keys(ELEC_LINE_TYPES).length).toBeGreaterThanOrEqual(3);
  });
});

describe('Category coverage', () => {
  const byCategory = (cat: string) =>
    Object.values(ELEC_SYMBOLS).filter(s => s.category === cat);

  it('has at least 5 source symbols', () => {
    expect(byCategory('source').length).toBeGreaterThanOrEqual(5);
  });
  it('has at least 6 protection symbols', () => {
    expect(byCategory('protection').length).toBeGreaterThanOrEqual(6);
  });
  it('has at least 6 distribution symbols', () => {
    expect(byCategory('distribution').length).toBeGreaterThanOrEqual(6);
  });
  it('has at least 5 load symbols', () => {
    expect(byCategory('load').length).toBeGreaterThanOrEqual(5);
  });
  it('has at least 4 instrument symbols', () => {
    expect(byCategory('instrument').length).toBeGreaterThanOrEqual(4);
  });
});

describe('Required symbols present', () => {
  it('has transformer-2winding', () => expect(ELEC_SYMBOLS['transformer-2winding']).toBeDefined());
  it('has generator-ac', () => expect(ELEC_SYMBOLS['generator-ac']).toBeDefined());
  it('has solar-panel', () => expect(ELEC_SYMBOLS['solar-panel']).toBeDefined());
  it('has battery-bank', () => expect(ELEC_SYMBOLS['battery-bank']).toBeDefined());
  it('has utility-service', () => expect(ELEC_SYMBOLS['utility-service']).toBeDefined());
  it('has breaker-1pole', () => expect(ELEC_SYMBOLS['breaker-1pole']).toBeDefined());
  it('has breaker-3pole', () => expect(ELEC_SYMBOLS['breaker-3pole']).toBeDefined());
  it('has fuse', () => expect(ELEC_SYMBOLS['fuse']).toBeDefined());
  it('has disconnect-switch', () => expect(ELEC_SYMBOLS['disconnect-switch']).toBeDefined());
  it('has gfci-receptacle', () => expect(ELEC_SYMBOLS['gfci-receptacle']).toBeDefined());
  it('has surge-protector', () => expect(ELEC_SYMBOLS['surge-protector']).toBeDefined());
  it('has busbar', () => expect(ELEC_SYMBOLS['busbar']).toBeDefined());
  it('has pdu-rack', () => expect(ELEC_SYMBOLS['pdu-rack']).toBeDefined());
  it('has panelboard', () => expect(ELEC_SYMBOLS['panelboard']).toBeDefined());
  it('has switchgear', () => expect(ELEC_SYMBOLS['switchgear']).toBeDefined());
  it('has ats-automatic', () => expect(ELEC_SYMBOLS['ats-automatic']).toBeDefined());
  it('has sts-static', () => expect(ELEC_SYMBOLS['sts-static']).toBeDefined());
  it('has motor-3phase', () => expect(ELEC_SYMBOLS['motor-3phase']).toBeDefined());
  it('has ups-system', () => expect(ELEC_SYMBOLS['ups-system']).toBeDefined());
  it('has server-rack', () => expect(ELEC_SYMBOLS['server-rack']).toBeDefined());
  it('has ammeter', () => expect(ELEC_SYMBOLS['ammeter']).toBeDefined());
  it('has voltmeter', () => expect(ELEC_SYMBOLS['voltmeter']).toBeDefined());
  it('has wattmeter', () => expect(ELEC_SYMBOLS['wattmeter']).toBeDefined());
  it('has power-factor-meter', () => expect(ELEC_SYMBOLS['power-factor-meter']).toBeDefined());
});

describe('SVG structure validity', () => {
  const symbols = Object.values(ELEC_SYMBOLS);

  it('every symbol has a non-empty id', () => {
    symbols.forEach(s => expect(s.id.length).toBeGreaterThan(0));
  });
  it('every symbol has a non-empty name', () => {
    symbols.forEach(s => expect(s.name.length).toBeGreaterThan(0));
  });
  it('every symbol has a standard reference', () => {
    symbols.forEach(s => expect(s.standard.length).toBeGreaterThan(0));
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
      expect(s.connectionPoints.length).toBeGreaterThanOrEqual(1);
    });
  });
  it('every symbol has at least 1 tag', () => {
    symbols.forEach(s => expect(s.tags.length).toBeGreaterThanOrEqual(1));
  });
  it('transformer-2winding has at least 2 connection points (primary and secondary)', () => {
    const t = ELEC_SYMBOLS['transformer-2winding'];
    if (t) expect(t.connectionPoints.length).toBeGreaterThanOrEqual(2);
  });
  it('breaker-3pole has at least 3 connection points', () => {
    const b = ELEC_SYMBOLS['breaker-3pole'];
    if (b) expect(b.connectionPoints.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Electrical line type definitions', () => {
  it('has power-conductor line type (solid)', () => {
    expect(ELEC_LINE_TYPES['power-conductor']).toBeDefined();
    expect(ELEC_LINE_TYPES['power-conductor'].svgStrokeWidth).toBeGreaterThanOrEqual(1.5);
    expect(ELEC_LINE_TYPES['power-conductor'].svgStrokeDasharray).toBeUndefined();
  });
  it('has grounding-conductor line type', () => {
    expect(ELEC_LINE_TYPES['grounding-conductor']).toBeDefined();
  });
  it('has control-wiring line type (dashed)', () => {
    expect(ELEC_LINE_TYPES['control-wiring']).toBeDefined();
    expect(ELEC_LINE_TYPES['control-wiring'].svgStrokeDasharray).toBeDefined();
  });
});
