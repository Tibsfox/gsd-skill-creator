/**
 * Wings 5-8 Test Suite
 *
 * Tests module exports, no-math-in-wonder rule, and interactive element counts.
 */

import { describe, it, expect } from 'vitest';

// ─── Wing 5: Set Theory ────────────────────────────────

describe('Wing 5: Set Theory', () => {
  describe('module exports', () => {
    it('index exports SetTheoryWing as default', async () => {
      const mod = await import('../../src/observatory/wings/05-set-theory/index.js');
      expect(mod.default).toBeDefined();
      expect(mod.SetTheoryWing).toBeDefined();
      expect(mod.default).toBe(mod.SetTheoryWing);
    });

    it('index exports all six phase components', async () => {
      const mod = await import('../../src/observatory/wings/05-set-theory/index.js');
      expect(mod.WonderPhase).toBeDefined();
      expect(mod.SeePhase).toBeDefined();
      expect(mod.TouchPhase).toBeDefined();
      expect(mod.UnderstandPhase).toBeDefined();
      expect(mod.ConnectPhase).toBeDefined();
      expect(mod.CreatePhase).toBeDefined();
    });

    it('each phase module exports a named component', async () => {
      const wonder = await import('../../src/observatory/wings/05-set-theory/WonderPhase.js');
      const see = await import('../../src/observatory/wings/05-set-theory/SeePhase.js');
      const touch = await import('../../src/observatory/wings/05-set-theory/TouchPhase.js');
      const understand = await import('../../src/observatory/wings/05-set-theory/UnderstandPhase.js');
      const connect = await import('../../src/observatory/wings/05-set-theory/ConnectPhase.js');
      const create = await import('../../src/observatory/wings/05-set-theory/CreatePhase.js');

      expect(typeof wonder.WonderPhase).toBe('function');
      expect(typeof see.SeePhase).toBe('function');
      expect(typeof touch.TouchPhase).toBe('function');
      expect(typeof understand.UnderstandPhase).toBe('function');
      expect(typeof connect.ConnectPhase).toBe('function');
      expect(typeof create.CreatePhase).toBe('function');
    });
  });

  describe('no-math-in-wonder rule', () => {
    it('WonderPhase does not contain mathNotation rendering', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/05-set-theory/WonderPhase.tsx',
        'utf-8',
      );
      expect(src).not.toMatch(/mathNotation/);
      expect(src).not.toMatch(/math-notation/);
      expect(src).not.toMatch(/\\frac|\\sum|\\int|\\theta/);
    });

    it('SeePhase does not contain mathNotation rendering', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/05-set-theory/SeePhase.tsx',
        'utf-8',
      );
      expect(src).not.toMatch(/mathNotation/);
      expect(src).not.toMatch(/math-notation/);
    });
  });

  describe('interactive element counts', () => {
    it('TouchPhase has at least 2 interactive elements', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/05-set-theory/TouchPhase.tsx',
        'utf-8',
      );
      const matches = src.match(/data-interactive=/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ─── Wing 6: Category Theory ────────────────────────────

describe('Wing 6: Category Theory', () => {
  describe('module exports', () => {
    it('index exports CategoryTheoryWing as default', async () => {
      const mod = await import('../../src/observatory/wings/06-category-theory/index.js');
      expect(mod.default).toBeDefined();
      expect(mod.CategoryTheoryWing).toBeDefined();
      expect(mod.default).toBe(mod.CategoryTheoryWing);
    });

    it('index exports all six phase components', async () => {
      const mod = await import('../../src/observatory/wings/06-category-theory/index.js');
      expect(mod.WonderPhase).toBeDefined();
      expect(mod.SeePhase).toBeDefined();
      expect(mod.TouchPhase).toBeDefined();
      expect(mod.UnderstandPhase).toBeDefined();
      expect(mod.ConnectPhase).toBeDefined();
      expect(mod.CreatePhase).toBeDefined();
    });

    it('each phase module exports a named component', async () => {
      const wonder = await import('../../src/observatory/wings/06-category-theory/WonderPhase.js');
      const see = await import('../../src/observatory/wings/06-category-theory/SeePhase.js');
      const touch = await import('../../src/observatory/wings/06-category-theory/TouchPhase.js');
      const understand = await import('../../src/observatory/wings/06-category-theory/UnderstandPhase.js');
      const connect = await import('../../src/observatory/wings/06-category-theory/ConnectPhase.js');
      const create = await import('../../src/observatory/wings/06-category-theory/CreatePhase.js');

      expect(typeof wonder.WonderPhase).toBe('function');
      expect(typeof see.SeePhase).toBe('function');
      expect(typeof touch.TouchPhase).toBe('function');
      expect(typeof understand.UnderstandPhase).toBe('function');
      expect(typeof connect.ConnectPhase).toBe('function');
      expect(typeof create.CreatePhase).toBe('function');
    });
  });

  describe('no-math-in-wonder rule', () => {
    it('WonderPhase does not contain mathNotation rendering', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/06-category-theory/WonderPhase.tsx',
        'utf-8',
      );
      expect(src).not.toMatch(/mathNotation/);
      expect(src).not.toMatch(/math-notation/);
      expect(src).not.toMatch(/\\frac|\\sum|\\int|\\theta/);
    });

    it('SeePhase does not contain mathNotation rendering', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/06-category-theory/SeePhase.tsx',
        'utf-8',
      );
      expect(src).not.toMatch(/mathNotation/);
      expect(src).not.toMatch(/math-notation/);
    });
  });

  describe('interactive element counts', () => {
    it('TouchPhase has at least 2 interactive elements', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/06-category-theory/TouchPhase.tsx',
        'utf-8',
      );
      const matches = src.match(/data-interactive=/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ─── Wing 7: Information Theory ─────────────────────────

describe('Wing 7: Information Theory', () => {
  describe('module exports', () => {
    it('index exports InformationTheoryWing as default', async () => {
      const mod = await import('../../src/observatory/wings/07-information-theory/index.js');
      expect(mod.default).toBeDefined();
      expect(mod.InformationTheoryWing).toBeDefined();
      expect(mod.default).toBe(mod.InformationTheoryWing);
    });

    it('index exports all six phase components', async () => {
      const mod = await import('../../src/observatory/wings/07-information-theory/index.js');
      expect(mod.WonderPhase).toBeDefined();
      expect(mod.SeePhase).toBeDefined();
      expect(mod.TouchPhase).toBeDefined();
      expect(mod.UnderstandPhase).toBeDefined();
      expect(mod.ConnectPhase).toBeDefined();
      expect(mod.CreatePhase).toBeDefined();
    });

    it('each phase module exports a named component', async () => {
      const wonder = await import('../../src/observatory/wings/07-information-theory/WonderPhase.js');
      const see = await import('../../src/observatory/wings/07-information-theory/SeePhase.js');
      const touch = await import('../../src/observatory/wings/07-information-theory/TouchPhase.js');
      const understand = await import('../../src/observatory/wings/07-information-theory/UnderstandPhase.js');
      const connect = await import('../../src/observatory/wings/07-information-theory/ConnectPhase.js');
      const create = await import('../../src/observatory/wings/07-information-theory/CreatePhase.js');

      expect(typeof wonder.WonderPhase).toBe('function');
      expect(typeof see.SeePhase).toBe('function');
      expect(typeof touch.TouchPhase).toBe('function');
      expect(typeof understand.UnderstandPhase).toBe('function');
      expect(typeof connect.ConnectPhase).toBe('function');
      expect(typeof create.CreatePhase).toBe('function');
    });
  });

  describe('no-math-in-wonder rule', () => {
    it('WonderPhase does not contain mathNotation rendering', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/07-information-theory/WonderPhase.tsx',
        'utf-8',
      );
      expect(src).not.toMatch(/mathNotation/);
      expect(src).not.toMatch(/math-notation/);
      expect(src).not.toMatch(/\\frac|\\sum|\\int|\\theta/);
    });

    it('SeePhase does not contain mathNotation rendering', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/07-information-theory/SeePhase.tsx',
        'utf-8',
      );
      expect(src).not.toMatch(/mathNotation/);
      expect(src).not.toMatch(/math-notation/);
    });
  });

  describe('interactive element counts', () => {
    it('TouchPhase has at least 2 interactive elements', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/07-information-theory/TouchPhase.tsx',
        'utf-8',
      );
      const matches = src.match(/data-interactive=/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ─── Wing 8: L-Systems ──────────────────────────────────

describe('Wing 8: L-Systems', () => {
  describe('module exports', () => {
    it('index exports LSystemsWing as default', async () => {
      const mod = await import('../../src/observatory/wings/08-l-systems/index.js');
      expect(mod.default).toBeDefined();
      expect(mod.LSystemsWing).toBeDefined();
      expect(mod.default).toBe(mod.LSystemsWing);
    });

    it('index exports all six phase components', async () => {
      const mod = await import('../../src/observatory/wings/08-l-systems/index.js');
      expect(mod.WonderPhase).toBeDefined();
      expect(mod.SeePhase).toBeDefined();
      expect(mod.TouchPhase).toBeDefined();
      expect(mod.UnderstandPhase).toBeDefined();
      expect(mod.ConnectPhase).toBeDefined();
      expect(mod.CreatePhase).toBeDefined();
    });

    it('each phase module exports a named component', async () => {
      const wonder = await import('../../src/observatory/wings/08-l-systems/WonderPhase.js');
      const see = await import('../../src/observatory/wings/08-l-systems/SeePhase.js');
      const touch = await import('../../src/observatory/wings/08-l-systems/TouchPhase.js');
      const understand = await import('../../src/observatory/wings/08-l-systems/UnderstandPhase.js');
      const connect = await import('../../src/observatory/wings/08-l-systems/ConnectPhase.js');
      const create = await import('../../src/observatory/wings/08-l-systems/CreatePhase.js');

      expect(typeof wonder.WonderPhase).toBe('function');
      expect(typeof see.SeePhase).toBe('function');
      expect(typeof touch.TouchPhase).toBe('function');
      expect(typeof understand.UnderstandPhase).toBe('function');
      expect(typeof connect.ConnectPhase).toBe('function');
      expect(typeof create.CreatePhase).toBe('function');
    });
  });

  describe('no-math-in-wonder rule', () => {
    it('WonderPhase does not contain mathNotation rendering', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/08-l-systems/WonderPhase.tsx',
        'utf-8',
      );
      expect(src).not.toMatch(/mathNotation/);
      expect(src).not.toMatch(/math-notation/);
      expect(src).not.toMatch(/\\frac|\\sum|\\int|\\theta/);
    });

    it('SeePhase does not contain mathNotation rendering', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/08-l-systems/SeePhase.tsx',
        'utf-8',
      );
      expect(src).not.toMatch(/mathNotation/);
      expect(src).not.toMatch(/math-notation/);
    });
  });

  describe('interactive element counts', () => {
    it('TouchPhase has at least 2 interactive elements', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/08-l-systems/TouchPhase.tsx',
        'utf-8',
      );
      const matches = src.match(/data-interactive=/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('closing the circle', () => {
    it('ConnectPhase references the unit circle and "begin again"', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/08-l-systems/ConnectPhase.tsx',
        'utf-8',
      );
      expect(src).toMatch(/unit circle/i);
      expect(src).toMatch(/begin again/i);
    });

    it('CreatePhase contains closing words and "begin again"', async () => {
      const { readFileSync } = await import('fs');
      const src = readFileSync(
        'src/observatory/wings/08-l-systems/CreatePhase.tsx',
        'utf-8',
      );
      expect(src).toMatch(/begin again/i);
      expect(src).toMatch(/Return to the Observatory/);
    });
  });
});

// ─── Cross-wing structural tests ────────────────────────

describe('Cross-wing structure', () => {
  const WINGS = [
    { dir: '05-set-theory', name: 'Set Theory' },
    { dir: '06-category-theory', name: 'Category Theory' },
    { dir: '07-information-theory', name: 'Information Theory' },
    { dir: '08-l-systems', name: 'L-Systems' },
  ];

  const PHASES = [
    'WonderPhase',
    'SeePhase',
    'TouchPhase',
    'UnderstandPhase',
    'ConnectPhase',
    'CreatePhase',
  ];

  for (const wing of WINGS) {
    describe(`${wing.name} file structure`, () => {
      it('has all 7 required files (index + 6 phases)', async () => {
        const { existsSync } = await import('fs');
        const base = `src/observatory/wings/${wing.dir}`;

        expect(existsSync(`${base}/index.tsx`)).toBe(true);
        for (const phase of PHASES) {
          expect(existsSync(`${base}/${phase}.tsx`)).toBe(true);
        }
      });
    });
  }

  describe('import consistency', () => {
    it('all wing indexes import from ../../types/index.js', async () => {
      const { readFileSync } = await import('fs');
      for (const wing of WINGS) {
        const src = readFileSync(
          `src/observatory/wings/${wing.dir}/index.tsx`,
          'utf-8',
        );
        expect(src).toContain("from '../../../types/index.js'");
        expect(src).toContain("from '../../../core/registry.js'");
      }
    });
  });
});
