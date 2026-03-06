/**
 * Observatory Wings 1-4 Tests
 *
 * Tests the data/logic aspects of the wing components:
 * - Wing modules export properly
 * - Wonder phases contain no math notation
 * - Each wing has >= 2 interactive elements in TouchPhase
 * - Phase order is enforced
 */

import { describe, it, expect } from 'vitest';
import { PHASE_ORDER } from '../../src/types/index.js';

// Import wing metadata from each wing
import {
  wingMeta as unitCircleMeta,
  WING_ID as UC_ID,
  WING_NAME as UC_NAME,
  WING_SUBTITLE as UC_SUBTITLE,
} from '../../src/observatory/wings/01-unit-circle/index.js';

import {
  wingMeta as pythagoreanMeta,
  WING_ID as PY_ID,
  WING_NAME as PY_NAME,
  WING_SUBTITLE as PY_SUBTITLE,
} from '../../src/observatory/wings/02-pythagorean/index.js';

import {
  wingMeta as trigonometryMeta,
  WING_ID as TR_ID,
  WING_NAME as TR_NAME,
  WING_SUBTITLE as TR_SUBTITLE,
} from '../../src/observatory/wings/03-trigonometry/index.js';

import {
  wingMeta as vectorCalculusMeta,
  WING_ID as VC_ID,
  WING_NAME as VC_NAME,
  WING_SUBTITLE as VC_SUBTITLE,
} from '../../src/observatory/wings/04-vector-calculus/index.js';

// Import wonder phase metadata individually for content checks
import { wonderMeta as ucWonder } from '../../src/observatory/wings/01-unit-circle/WonderPhase.js';
import { wonderMeta as pyWonder } from '../../src/observatory/wings/02-pythagorean/WonderPhase.js';
import { wonderMeta as trWonder } from '../../src/observatory/wings/03-trigonometry/WonderPhase.js';
import { wonderMeta as vcWonder } from '../../src/observatory/wings/04-vector-calculus/WonderPhase.js';

// Import touch phase metadata for interactive element counts
import { touchMeta as ucTouch } from '../../src/observatory/wings/01-unit-circle/TouchPhase.js';
import { touchMeta as pyTouch } from '../../src/observatory/wings/02-pythagorean/TouchPhase.js';
import { touchMeta as trTouch } from '../../src/observatory/wings/03-trigonometry/TouchPhase.js';
import { touchMeta as vcTouch } from '../../src/observatory/wings/04-vector-calculus/TouchPhase.js';

// Import barrel export
import { allWingMetas } from '../../src/observatory/wings/index.js';

const allWings = [
  { meta: unitCircleMeta, id: UC_ID, name: UC_NAME, subtitle: UC_SUBTITLE },
  { meta: pythagoreanMeta, id: PY_ID, name: PY_NAME, subtitle: PY_SUBTITLE },
  { meta: trigonometryMeta, id: TR_ID, name: TR_NAME, subtitle: TR_SUBTITLE },
  { meta: vectorCalculusMeta, id: VC_ID, name: VC_NAME, subtitle: VC_SUBTITLE },
];

describe('Wings 1-4: Module Exports', () => {
  it('all 4 wings export valid metadata', () => {
    expect(allWings.length).toBe(4);
    for (const wing of allWings) {
      expect(wing.meta).toBeDefined();
      expect(wing.meta.id).toBe(wing.id);
      expect(wing.meta.name).toBe(wing.name);
      expect(wing.meta.subtitle).toBe(wing.subtitle);
    }
  });

  it('barrel export includes all 4 wing metas', () => {
    expect(allWingMetas.length).toBe(4);
    expect(allWingMetas[0].id).toBe('unit-circle');
    expect(allWingMetas[1].id).toBe('pythagorean');
    expect(allWingMetas[2].id).toBe('trigonometry');
    expect(allWingMetas[3].id).toBe('vector-calculus');
  });

  it('each wing has all 6 phase metadata entries', () => {
    const expectedPhases: string[] = ['wonder', 'see', 'touch', 'understand', 'connect', 'create'];
    for (const wing of allWings) {
      for (const phase of expectedPhases) {
        expect(wing.meta.phases).toHaveProperty(phase);
      }
    }
  });

  it('wing IDs match foundation IDs', () => {
    expect(UC_ID).toBe('unit-circle');
    expect(PY_ID).toBe('pythagorean');
    expect(TR_ID).toBe('trigonometry');
    expect(VC_ID).toBe('vector-calculus');
  });

  it('wing subtitles are correct', () => {
    expect(UC_SUBTITLE).toBe('Seeing');
    expect(PY_SUBTITLE).toBe('Relationship');
    expect(TR_SUBTITLE).toBe('Motion');
    expect(VC_SUBTITLE).toBe('Fields');
  });
});

describe('Wings 1-4: Wonder Phases Contain No Math', () => {
  const wonderMetas = [
    { name: 'Unit Circle', meta: ucWonder },
    { name: 'Pythagorean', meta: pyWonder },
    { name: 'Trigonometry', meta: trWonder },
    { name: 'Vector Calculus', meta: vcWonder },
  ];

  for (const { name, meta } of wonderMetas) {
    it(`${name} wonder phase reports containsMath = false`, () => {
      expect(meta.containsMath).toBe(false);
    });

    it(`${name} wonder phase has 0 interactive elements`, () => {
      expect(meta.interactiveElements).toBe(0);
    });

    it(`${name} wonder phase has required reflection time`, () => {
      expect(meta.requiredTimeMs).toBeGreaterThanOrEqual(30000);
    });

    it(`${name} wonder phase has narrative keywords`, () => {
      expect(meta.keywords.length).toBeGreaterThan(0);
    });
  }
});

describe('Wings 1-4: Touch Phases Have >= 2 Interactive Elements', () => {
  const touchMetas = [
    { name: 'Unit Circle', meta: ucTouch },
    { name: 'Pythagorean', meta: pyTouch },
    { name: 'Trigonometry', meta: trTouch },
    { name: 'Vector Calculus', meta: vcTouch },
  ];

  for (const { name, meta } of touchMetas) {
    it(`${name} touch phase has >= 2 interactive elements`, () => {
      expect(meta.interactiveElements).toBeGreaterThanOrEqual(2);
    });

    it(`${name} touch phase has interactive element IDs`, () => {
      expect(meta.interactiveElementIds.length).toBeGreaterThanOrEqual(2);
    });

    it(`${name} touch phase has interactive element types`, () => {
      expect(meta.interactiveElementTypes.length).toBeGreaterThanOrEqual(2);
    });
  }

  it('aggregate interactive counts match wing meta', () => {
    for (const wing of allWings) {
      expect(wing.meta.touchPhaseInteractiveCount).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('Wings 1-4: Phase Order Enforcement', () => {
  it('PHASE_ORDER has exactly 6 phases', () => {
    expect(PHASE_ORDER.length).toBe(6);
  });

  it('PHASE_ORDER follows correct sequence', () => {
    expect(PHASE_ORDER).toEqual([
      'wonder', 'see', 'touch', 'understand', 'connect', 'create',
    ]);
  });

  it('wonder is always first (index 0)', () => {
    expect(PHASE_ORDER[0]).toBe('wonder');
  });

  it('create is always last (index 5)', () => {
    expect(PHASE_ORDER[5]).toBe('create');
  });

  it('each wing metadata has phases keyed by PHASE_ORDER names', () => {
    for (const wing of allWings) {
      for (const phaseName of PHASE_ORDER) {
        expect(wing.meta.phases).toHaveProperty(phaseName);
      }
    }
  });
});

describe('Wings 1-4: Content Integrity', () => {
  it('Unit Circle wonder has nature-related keywords', () => {
    const keywords = ucWonder.keywords;
    expect(keywords).toContain('shadow');
    expect(keywords).toContain('earth');
    expect(keywords).toContain('rotation');
  });

  it('Pythagorean wonder has relationship keywords', () => {
    const keywords = pyWonder.keywords;
    expect(keywords).toContain('spider');
    expect(keywords).toContain('diagonal');
  });

  it('Trigonometry wonder has motion keywords', () => {
    const keywords = trWonder.keywords;
    expect(keywords).toContain('swing');
    expect(keywords).toContain('oscillation');
  });

  it('Vector Calculus wonder has field keywords', () => {
    const keywords = vcWonder.keywords;
    expect(keywords).toContain('wind');
    expect(keywords).toContain('magnetic');
    expect(keywords).toContain('field');
  });

  it('all wings have totalInteractiveElements >= 2', () => {
    for (const wing of allWings) {
      expect(wing.meta.totalInteractiveElements).toBeGreaterThanOrEqual(2);
    }
  });
});
