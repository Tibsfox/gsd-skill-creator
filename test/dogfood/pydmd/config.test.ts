import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.resolve(__dirname, '../../../src/dogfood/pydmd/config');

describe('PyDMD config', () => {
  describe('YAML target configuration', () => {
    const yamlPath = path.join(configDir, 'pydmd-target.yaml');

    it('file exists at expected path', () => {
      expect(fs.existsSync(yamlPath)).toBe(true);
    });

    it('parses as valid YAML', () => {
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const config = yaml.load(content) as Record<string, unknown>;
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('contains target.url matching PyDMD GitHub URL', () => {
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const config = yaml.load(content) as { target: { url: string } };
      expect(config.target.url).toBe('https://github.com/PyDMD/PyDMD');
    });

    it('contains target.name equal to PyDMD', () => {
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const config = yaml.load(content) as { target: { name: string } };
      expect(config.target.name).toBe('PyDMD');
    });

    it('contains expected_structure with all directory fields', () => {
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const config = yaml.load(content) as { expected_structure: Record<string, string> };
      const structure = config.expected_structure;
      expect(structure.source_dir).toBeDefined();
      expect(structure.test_dir).toBeDefined();
      expect(structure.tutorial_dir).toBeDefined();
      expect(structure.docs_dir).toBeDefined();
    });

    it('contains known_algorithm_variants with at least 10 entries', () => {
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const config = yaml.load(content) as { known_algorithm_variants: Array<Record<string, string>> };
      expect(config.known_algorithm_variants.length).toBeGreaterThanOrEqual(10);
    });

    it('each variant has name, class, and description fields', () => {
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const config = yaml.load(content) as { known_algorithm_variants: Array<Record<string, string>> };
      for (const variant of config.known_algorithm_variants) {
        expect(variant.name).toBeDefined();
        expect(variant.class).toBeDefined();
        expect(variant.description).toBeDefined();
        expect(typeof variant.name).toBe('string');
        expect(typeof variant.class).toBe('string');
        expect(typeof variant.description).toBe('string');
      }
    });

    it('contains health_check.pass_threshold equal to 0.80', () => {
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const config = yaml.load(content) as { health_check: { pass_threshold: number } };
      expect(config.health_check.pass_threshold).toBe(0.80);
    });
  });

  describe('DMD scenarios fixture', () => {
    const scenariosPath = path.join(configDir, 'dmd-scenarios.json');

    it('file exists at expected path', () => {
      expect(fs.existsSync(scenariosPath)).toBe(true);
    });

    it('parses as valid JSON array', () => {
      const content = fs.readFileSync(scenariosPath, 'utf-8');
      const scenarios = JSON.parse(content);
      expect(Array.isArray(scenarios)).toBe(true);
    });

    it('contains exactly 10 scenarios', () => {
      const content = fs.readFileSync(scenariosPath, 'utf-8');
      const scenarios = JSON.parse(content);
      expect(scenarios).toHaveLength(10);
    });

    it('each scenario has required fields', () => {
      const content = fs.readFileSync(scenariosPath, 'utf-8');
      const scenarios = JSON.parse(content) as Array<Record<string, unknown>>;
      for (const scenario of scenarios) {
        expect(scenario.id).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.dataCharacteristics).toBeDefined();
        expect(scenario.expectedVariant).toBeDefined();
        expect(scenario.rationale).toBeDefined();
      }
    });

    it('each dataCharacteristics has all boolean fields', () => {
      const content = fs.readFileSync(scenariosPath, 'utf-8');
      const scenarios = JSON.parse(content) as Array<{ dataCharacteristics: Record<string, boolean> }>;
      const requiredFields = ['noisy', 'multiScale', 'hasControl', 'highDimensional', 'timeDelayed', 'parameterVarying', 'needsSparse', 'physicsKnown', 'streaming', 'nonlinear'];
      for (const scenario of scenarios) {
        for (const field of requiredFields) {
          expect(typeof scenario.dataCharacteristics[field]).toBe('boolean');
        }
      }
    });

    it('all expectedVariant values are unique', () => {
      const content = fs.readFileSync(scenariosPath, 'utf-8');
      const scenarios = JSON.parse(content) as Array<{ expectedVariant: string }>;
      const variants = scenarios.map(s => s.expectedVariant);
      const unique = new Set(variants);
      expect(unique.size).toBe(variants.length);
    });

    it('expected variants include key algorithms', () => {
      const content = fs.readFileSync(scenariosPath, 'utf-8');
      const scenarios = JSON.parse(content) as Array<{ expectedVariant: string }>;
      const variants = new Set(scenarios.map(s => s.expectedVariant));
      const required = ['DMD', 'BOP-DMD', 'MrDMD', 'DMDc', 'CDMD', 'HankelDMD', 'PiDMD', 'SpDMD'];
      for (const r of required) {
        expect(variants.has(r)).toBe(true);
      }
    });

    it('every scenario id matches pattern scenario-NN', () => {
      const content = fs.readFileSync(scenariosPath, 'utf-8');
      const scenarios = JSON.parse(content) as Array<{ id: string }>;
      for (const scenario of scenarios) {
        expect(scenario.id).toMatch(/^scenario-\d{2}$/);
      }
    });
  });
});
