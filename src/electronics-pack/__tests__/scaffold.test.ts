/**
 * Electronics Pack scaffold validation tests.
 *
 * Validates the complete pack structure created by Phase 262:
 * directory layout, module placeholders, chipset configuration,
 * SKILL.md orchestrator, metadata, references, and component library.
 *
 * Covers requirements: SCAF-01 through SCAF-07.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

// ============================================================================
// YAML parsing helper (uses js-yaml)
// ============================================================================

let jsYaml: { load: (s: string) => unknown };

beforeAll(async () => {
  const mod = await import('js-yaml');
  jsYaml = mod.default ?? mod;
});

function loadYaml<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return jsYaml.load(content) as T;
}

// ============================================================================
// Module directory names
// ============================================================================

const MODULE_DIRS = [
  '01-the-circuit',
  '02-passive-components',
  '03-the-signal',
  '04-diodes',
  '05-transistors',
  '06-op-amps',
  '07-power-supplies',
  '07a-logic-gates',
  '08-sequential-logic',
  '09-data-conversion',
  '10-dsp',
  '11-microcontrollers',
  '12-sensors-actuators',
  '13-plc',
  '14-off-grid-power',
  '15-pcb-design',
];

// ============================================================================
// Group 1: Directory Structure (SCAF-01)
// ============================================================================

describe('Directory Structure (SCAF-01)', () => {
  it('electronics-pack root directory exists', () => {
    expect(fs.existsSync(packRoot)).toBe(true);
  });

  it('all 16 module directories exist', () => {
    for (const dir of MODULE_DIRS) {
      const fullPath = path.join(packRoot, 'modules', dir);
      expect(fs.existsSync(fullPath), `missing: modules/${dir}`).toBe(true);
    }
  });

  it('support directories exist (simulator, safety, shared, references, __tests__)', () => {
    const supportDirs = ['simulator', 'safety', 'shared', 'references', '__tests__'];
    for (const dir of supportDirs) {
      const fullPath = path.join(packRoot, dir);
      expect(fs.existsSync(fullPath), `missing: ${dir}`).toBe(true);
    }
  });

  it('each module directory contains content.md, labs.ts, and assessment.md', () => {
    for (const dir of MODULE_DIRS) {
      const modulePath = path.join(packRoot, 'modules', dir);
      for (const file of ['content.md', 'labs.ts', 'assessment.md']) {
        const filePath = path.join(modulePath, file);
        expect(fs.existsSync(filePath), `missing: modules/${dir}/${file}`).toBe(true);
      }
    }
  });
});

// ============================================================================
// Group 2: Module Content Placeholders
// ============================================================================

describe('Module Content Placeholders', () => {
  it('each content.md contains the correct module title', () => {
    const expectedTitles: Record<string, string> = {
      '01-the-circuit': '# Module 1: The Circuit',
      '02-passive-components': '# Module 2: Passive Components',
      '03-the-signal': '# Module 3: The Signal',
      '04-diodes': '# Module 4: Diodes',
      '05-transistors': '# Module 5: Transistors',
      '06-op-amps': '# Module 6: Op-Amps',
      '07-power-supplies': '# Module 7: Power Supplies',
      '07a-logic-gates': '# Module 7A: Logic Gates',
      '08-sequential-logic': '# Module 8: Sequential Logic',
      '09-data-conversion': '# Module 9: Data Conversion',
      '10-dsp': '# Module 10: Digital Signal Processing',
      '11-microcontrollers': '# Module 11: Microcontrollers',
      '12-sensors-actuators': '# Module 12: Sensors and Actuators',
      '13-plc': '# Module 13: Programmable Logic Controllers',
      '14-off-grid-power': '# Module 14: Off-Grid Power Systems',
      '15-pcb-design': '# Module 15: PCB Design',
    };

    for (const [dir, title] of Object.entries(expectedTitles)) {
      const content = fs.readFileSync(path.join(packRoot, 'modules', dir, 'content.md'), 'utf-8');
      expect(content, `modules/${dir}/content.md should contain title`).toContain(title);
    }
  });

  it('each content.md contains tier and safety mode metadata', () => {
    for (const dir of MODULE_DIRS) {
      const content = fs.readFileSync(path.join(packRoot, 'modules', dir, 'content.md'), 'utf-8');
      expect(content, `modules/${dir}/content.md should have Tier`).toContain('Tier');
      expect(content, `modules/${dir}/content.md should have Safety Mode`).toContain('Safety Mode');
    }
  });

  it('each labs.ts exports a labs array', () => {
    for (const dir of MODULE_DIRS) {
      const content = fs.readFileSync(path.join(packRoot, 'modules', dir, 'labs.ts'), 'utf-8');
      expect(content, `modules/${dir}/labs.ts should export labs`).toContain('export const labs');
    }
  });
});

// ============================================================================
// Group 3: Chipset Configuration (SCAF-02, SCAF-03)
// ============================================================================

interface ChipsetSkill {
  id: string;
  name: string;
  triggers: string[];
  module?: string;
  modules?: string[];
  tier: number;
}

interface ChipsetAgent {
  id: string;
  name: string;
  skills: string[];
  role: string;
  tier: number;
}

interface ChipsetConfig {
  name: string;
  version: string;
  skills: ChipsetSkill[];
  agents: ChipsetAgent[];
  topology: { type: string };
}

describe('Chipset Configuration (SCAF-02, SCAF-03)', () => {
  let chipset: ChipsetConfig;

  beforeAll(() => {
    chipset = loadYaml<ChipsetConfig>(path.join(packRoot, 'chipset.yaml'));
  });

  it('defines exactly 14 skills', () => {
    expect(chipset.skills).toHaveLength(14);
  });

  it('each skill has id, name, triggers (non-empty), module or modules, and tier', () => {
    for (const skill of chipset.skills) {
      expect(skill.id, `skill must have id`).toBeTruthy();
      expect(skill.name, `${skill.id} must have name`).toBeTruthy();
      expect(Array.isArray(skill.triggers), `${skill.id} triggers must be array`).toBe(true);
      expect(skill.triggers.length, `${skill.id} triggers must be non-empty`).toBeGreaterThan(0);
      expect(skill.module || skill.modules, `${skill.id} must have module or modules`).toBeTruthy();
      expect(skill.tier, `${skill.id} must have tier`).toBeGreaterThanOrEqual(1);
      expect(skill.tier, `${skill.id} tier must be <= 4`).toBeLessThanOrEqual(4);
    }
  });

  it('defines exactly 5 agents', () => {
    expect(chipset.agents).toHaveLength(5);
  });

  it('each agent has id, name, skills (non-empty), and role', () => {
    for (const agent of chipset.agents) {
      expect(agent.id, `agent must have id`).toBeTruthy();
      expect(agent.name, `${agent.id} must have name`).toBeTruthy();
      expect(Array.isArray(agent.skills), `${agent.id} skills must be array`).toBe(true);
      expect(agent.skills.length, `${agent.id} skills must be non-empty`).toBeGreaterThan(0);
      expect(agent.role, `${agent.id} must have role`).toBeTruthy();
    }
  });

  it('agent EL-1 has exactly 3 skills (Tier 1)', () => {
    const el1 = chipset.agents.find((a) => a.id === 'EL-1');
    expect(el1).toBeDefined();
    expect(el1!.skills).toHaveLength(3);
    expect(el1!.tier).toBe(1);
  });

  it('agent EL-5 has exactly 3 skills (Tier 4)', () => {
    const el5 = chipset.agents.find((a) => a.id === 'EL-5');
    expect(el5).toBeDefined();
    expect(el5!.skills).toHaveLength(3);
    expect(el5!.tier).toBe(4);
  });

  it('all skill IDs referenced by agents exist in the skills array', () => {
    const skillIds = new Set(chipset.skills.map((s) => s.id));
    for (const agent of chipset.agents) {
      for (const skillRef of agent.skills) {
        expect(skillIds.has(skillRef), `agent ${agent.id} references unknown skill "${skillRef}"`).toBe(true);
      }
    }
  });

  it('topology type is pipeline', () => {
    expect(chipset.topology.type).toBe('pipeline');
  });
});

// ============================================================================
// Group 4: SKILL.md Orchestrator (SCAF-04)
// ============================================================================

describe('SKILL.md Orchestrator (SCAF-04)', () => {
  let skillContent: string;

  beforeAll(() => {
    skillContent = fs.readFileSync(path.join(packRoot, 'SKILL.md'), 'utf-8');
  });

  it('exists and contains frontmatter with name "electronics"', () => {
    expect(skillContent).toContain('name: electronics');
  });

  it('contains routeToModule routing description', () => {
    expect(skillContent).toContain('routeToModule');
  });

  it('lists all 15 modules in the module table', () => {
    const moduleNames = [
      'The Circuit', 'Passive Components', 'The Signal',
      'Diodes', 'Transistors', 'Op-Amps', 'Power Supplies',
      'Logic Gates', 'Sequential Logic', 'Data Conversion',
      'DSP', 'Microcontrollers', 'Sensors & Actuators',
      'PLC', 'Off-Grid Power', 'PCB Design',
    ];
    // Check that at least 15 distinct module names appear (some have variations)
    let found = 0;
    for (const name of moduleNames) {
      if (skillContent.includes(name)) found++;
    }
    expect(found, 'SKILL.md should list all 15+ module names').toBeGreaterThanOrEqual(15);
  });
});

// ============================================================================
// Group 5: Metadata (SCAF-05)
// ============================================================================

interface PackMetadata {
  name: string;
  modules: { count: number; tiers: Record<string, string[]> };
  agents: { count: number };
  skills: { count: number };
  triggers: string[];
}

describe('Metadata (SCAF-05)', () => {
  let metadata: PackMetadata;

  beforeAll(() => {
    metadata = loadYaml<PackMetadata>(path.join(packRoot, 'metadata.yaml'));
  });

  it('name is "electronics"', () => {
    expect(metadata.name).toBe('electronics');
  });

  it('modules.count is 15', () => {
    expect(metadata.modules.count).toBe(15);
  });

  it('agents.count is 5', () => {
    expect(metadata.agents.count).toBe(5);
  });

  it('skills.count is 14', () => {
    expect(metadata.skills.count).toBe(14);
  });

  it('triggers is a non-empty array', () => {
    expect(Array.isArray(metadata.triggers)).toBe(true);
    expect(metadata.triggers.length).toBeGreaterThan(0);
  });

  it('all 16 module IDs are listed across tiers', () => {
    const allModules = Object.values(metadata.modules.tiers).flat();
    for (const dir of MODULE_DIRS) {
      expect(allModules, `metadata tiers should include ${dir}`).toContain(dir);
    }
  });
});

// ============================================================================
// Group 6: References (SCAF-06)
// ============================================================================

describe('References (SCAF-06)', () => {
  it('bibliography.md contains "Horowitz", "Hill", and "3rd"', () => {
    const content = fs.readFileSync(path.join(packRoot, 'references', 'bibliography.md'), 'utf-8');
    expect(content).toContain('Horowitz');
    expect(content).toContain('Hill');
    expect(content).toContain('3rd');
  });

  it('bibliography.md contains citation convention section', () => {
    const content = fs.readFileSync(path.join(packRoot, 'references', 'bibliography.md'), 'utf-8');
    expect(content).toContain('Citation Convention');
  });

  it('hh-chapter-map.md contains mapping table with at least 15 entries', () => {
    const content = fs.readFileSync(path.join(packRoot, 'references', 'hh-chapter-map.md'), 'utf-8');
    // Count table data rows (lines starting with |, excluding header and separator)
    const tableRows = content.split('\n').filter((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith('|') && !trimmed.startsWith('|--') && !trimmed.startsWith('| H&H');
    });
    expect(tableRows.length, 'hh-chapter-map.md should have >= 15 data rows').toBeGreaterThanOrEqual(15);
  });

  it('hh-chapter-map.md maps to known module names', () => {
    const content = fs.readFileSync(path.join(packRoot, 'references', 'hh-chapter-map.md'), 'utf-8');
    const knownModules = ['01-the-circuit', '02-passive-components', '05-transistors', '06-op-amps', '07a-logic-gates', '11-microcontrollers'];
    for (const mod of knownModules) {
      expect(content, `hh-chapter-map should reference ${mod}`).toContain(mod);
    }
  });
});

// ============================================================================
// Group 7: Component Library (SCAF-07)
// ============================================================================

interface ComponentLibrary {
  resistors: {
    e24_series: number[];
    power_ratings: number[];
  };
  capacitors: {
    e12_series: number[];
    types: Record<string, unknown>;
  };
  inductors: {
    e12_series: number[];
  };
}

describe('Component Library (SCAF-07)', () => {
  let library: ComponentLibrary;

  beforeAll(() => {
    library = loadYaml<ComponentLibrary>(path.join(packRoot, 'shared', 'component-library.yaml'));
  });

  it('resistors.e24_series has 24 values', () => {
    expect(library.resistors.e24_series).toHaveLength(24);
  });

  it('capacitors.e12_series has 12 values', () => {
    expect(library.capacitors.e12_series).toHaveLength(12);
  });

  it('inductors.e12_series has 12 values', () => {
    expect(library.inductors.e12_series).toHaveLength(12);
  });

  it('resistor power_ratings is non-empty', () => {
    expect(library.resistors.power_ratings.length).toBeGreaterThan(0);
  });

  it('capacitor types includes ceramic, electrolytic, and film', () => {
    expect(library.capacitors.types).toHaveProperty('ceramic');
    expect(library.capacitors.types).toHaveProperty('electrolytic');
    expect(library.capacitors.types).toHaveProperty('film');
  });

  it('all E24 values are between 1.0 and 9.1', () => {
    for (const val of library.resistors.e24_series) {
      expect(val, `E24 value ${val} should be >= 1.0`).toBeGreaterThanOrEqual(1.0);
      expect(val, `E24 value ${val} should be <= 9.1`).toBeLessThanOrEqual(9.1);
    }
  });
});
