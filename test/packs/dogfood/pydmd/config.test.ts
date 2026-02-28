import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';

const ROOT = resolve(import.meta.dirname, '..', '..', '..', '..');
const CONFIG_PATH = resolve(ROOT, 'src/dogfood/pydmd/config/pydmd-target.yaml');
const SCENARIOS_PATH = resolve(ROOT, 'src/dogfood/pydmd/config/dmd-scenarios.json');

describe('PyDMD config', () => {
  describe('pydmd-target.yaml', () => {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    const config = load(raw) as Record<string, unknown>;

    it('should have target.url pointing to PyDMD GitHub', () => {
      const target = config.target as Record<string, unknown>;
      expect(target.url).toBe('https://github.com/PyDMD/PyDMD');
    });

    it('should have target.name equal to PyDMD', () => {
      const target = config.target as Record<string, unknown>;
      expect(target.name).toBe('PyDMD');
    });

    it('should have expected_structure with all four directories', () => {
      const structure = config.expected_structure as Record<string, string>;
      expect(structure.source_dir).toBe('pydmd/');
      expect(structure.test_dir).toBe('tests/');
      expect(structure.tutorial_dir).toBe('tutorials/');
      expect(structure.docs_dir).toBe('docs/');
    });

    it('should have at least 10 known algorithm variants', () => {
      const variants = config.known_algorithm_variants as Array<Record<string, string>>;
      expect(variants.length).toBeGreaterThanOrEqual(10);
    });

    it('should have name, class, and description on each variant', () => {
      const variants = config.known_algorithm_variants as Array<Record<string, string>>;
      for (const v of variants) {
        expect(v).toHaveProperty('name');
        expect(v).toHaveProperty('class');
        expect(v).toHaveProperty('description');
      }
    });

    it('should have health_check.pass_threshold of 0.80', () => {
      const hc = config.health_check as Record<string, number>;
      expect(hc.pass_threshold).toBe(0.80);
    });

    it('should target python language', () => {
      const target = config.target as Record<string, unknown>;
      expect(target.language).toBe('python');
    });

    it('should use pyproject.toml build system', () => {
      const bs = config.build_system as Record<string, unknown>;
      expect(bs.type).toBe('pyproject.toml');
    });
  });

  describe('dmd-scenarios.json', () => {
    const raw = readFileSync(SCENARIOS_PATH, 'utf-8');
    const scenarios = JSON.parse(raw) as Array<Record<string, unknown>>;

    it('should contain exactly 10 scenarios', () => {
      expect(scenarios).toHaveLength(10);
    });

    it('should have required fields on each scenario', () => {
      for (const s of scenarios) {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('description');
        expect(s).toHaveProperty('dataCharacteristics');
        expect(s).toHaveProperty('expectedVariant');
        expect(s).toHaveProperty('rationale');
      }
    });

    it('should have boolean data characteristic fields', () => {
      const requiredFields = [
        'noisy', 'multiScale', 'hasControl', 'highDimensional',
        'timeDelayed', 'parameterVarying', 'needsSparse', 'physicsKnown',
        'streaming', 'nonlinear',
      ];
      for (const s of scenarios) {
        const chars = s.dataCharacteristics as Record<string, boolean>;
        for (const field of requiredFields) {
          expect(typeof chars[field]).toBe('boolean');
        }
      }
    });

    it('should have unique expected variants (no duplicates)', () => {
      const variants = scenarios.map(s => s.expectedVariant as string);
      const unique = new Set(variants);
      expect(unique.size).toBe(variants.length);
    });

    it('should include key algorithm variants', () => {
      const variants = scenarios.map(s => s.expectedVariant as string);
      const required = ['DMD', 'BOP-DMD', 'MrDMD', 'DMDc', 'CDMD', 'HankelDMD', 'PiDMD', 'SpDMD'];
      for (const r of required) {
        expect(variants).toContain(r);
      }
    });

    it('should have scenario IDs matching pattern scenario-NN', () => {
      for (const s of scenarios) {
        expect(s.id).toMatch(/^scenario-\d{2}$/);
      }
    });
  });
});
