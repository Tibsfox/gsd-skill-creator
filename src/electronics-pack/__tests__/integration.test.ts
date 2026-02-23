/**
 * Integration Test Suite — Electronics Educational Pack
 *
 * Cross-module integration tests validating the entire pack works end-to-end.
 * Covers INTG-01 through INTG-10: simulator engines, safety warden,
 * learn mode, chipset routing, and all 15 modules loadable with verify().
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODULE_DIRS = [
  '01-the-circuit', '02-passive-components', '03-the-signal',
  '04-diodes', '05-transistors', '06-op-amps', '07-power-supplies',
  '07a-logic-gates', '08-sequential-logic', '09-data-conversion',
  '10-dsp', '11-microcontrollers', '12-sensors-actuators',
  '13-plc', '14-off-grid-power', '15-pcb-design',
];

const MODULES_DIR = path.resolve(__dirname, '../modules');
const TESTS_DIR = path.resolve(__dirname);

// ---------------------------------------------------------------------------
// INTG-01: Simulator Engine Coverage — MNA
// ---------------------------------------------------------------------------

describe('INTG-01: MNA Simulator Engine', () => {
  it('exports all core stamp functions', async () => {
    const components = await import('../simulator/components.js');
    expect(typeof components.stampResistor).toBe('function');
    expect(typeof components.stampCapacitor).toBe('function');
    expect(typeof components.stampInductor).toBe('function');
    expect(typeof components.stampVoltageSource).toBe('function');
    expect(typeof components.stampCurrentSource).toBe('function');
    expect(typeof components.stampDiode).toBe('function');
  });

  it('runs a voltage divider through DC analysis', async () => {
    const { dcAnalysis } = await import('../simulator/mna-engine.js');
    const result = dcAnalysis([
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 2000 },
      { id: 'R2', type: 'resistor', nodes: ['2', '0'], resistance: 1000 },
    ] as any[]);

    const v2 = result.nodeVoltages.find((nv) => nv.node === '2');
    expect(v2).toBeDefined();
    expect(v2!.voltage).toBeCloseTo(10 * 1000 / 3000, 2);
  });

  it('exports buildMatrix and solve for matrix-level access', async () => {
    const engine = await import('../simulator/mna-engine.js');
    expect(typeof engine.buildMatrix).toBe('function');
    expect(typeof engine.solve).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// INTG-02: Logic Simulator Coverage
// ---------------------------------------------------------------------------

describe('INTG-02: Logic Simulator Engine', () => {
  it('evaluates a simple AND gate circuit', async () => {
    const { LogicSimulator, GateType } = await import('../simulator/logic-sim.js');
    const sim = new LogicSimulator();
    sim.addGate({
      id: 'AND1',
      type: GateType.AND,
      inputs: ['A', 'B'],
      output: 'Y',
      propagationDelay: 10,
    });

    sim.setSignal('A', true);
    sim.setSignal('B', true);
    sim.evaluate();
    expect(sim.getSignal('Y')).toBe(true);

    sim.setSignal('A', true);
    sim.setSignal('B', false);
    sim.evaluate();
    expect(sim.getSignal('Y')).toBe(false);
  });

  it('simulates a D flip-flop with sequential behavior', async () => {
    const { evaluateFlipFlop, FlipFlopType } = await import('../simulator/logic-sim.js');

    let state = { Q: false, Qbar: true };

    // Set D=1, rising edge -> Q should latch to 1
    state = evaluateFlipFlop(FlipFlopType.D, { D: true }, state, 'rising');
    expect(state.Q).toBe(true);
    expect(state.Qbar).toBe(false);

    // No edge -> hold
    state = evaluateFlipFlop(FlipFlopType.D, { D: false }, state, 'none');
    expect(state.Q).toBe(true);

    // Rising edge with D=0 -> Q latches to 0
    state = evaluateFlipFlop(FlipFlopType.D, { D: false }, state, 'rising');
    expect(state.Q).toBe(false);
    expect(state.Qbar).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// INTG-03: Safety Warden Module Assignments
// ---------------------------------------------------------------------------

describe('INTG-03: Safety Warden Module Assignments', () => {
  it('assigns correct safety modes to all 16 module directories', async () => {
    const { getModuleMode, SafetyMode } = await import('../safety/warden.js');

    const expectedAnnotate = [
      '01-the-circuit', '02-passive-components', '03-the-signal',
      '07a-logic-gates', '08-sequential-logic',
    ];
    const expectedGate = [
      '04-diodes', '05-transistors', '06-op-amps', '07-power-supplies',
      '09-data-conversion', '10-dsp', '11-microcontrollers',
      '12-sensors-actuators', '15-pcb-design',
    ];
    const expectedRedirect = ['13-plc', '14-off-grid-power'];

    for (const mod of expectedAnnotate) {
      expect(getModuleMode(mod)).toBe(SafetyMode.Annotate);
    }
    for (const mod of expectedGate) {
      expect(getModuleMode(mod)).toBe(SafetyMode.Gate);
    }
    for (const mod of expectedRedirect) {
      expect(getModuleMode(mod)).toBe(SafetyMode.Redirect);
    }
  });

  it('classifies voltage ranges correctly', async () => {
    const { classifyVoltage, SafetyMode } = await import('../safety/warden.js');

    // 5V -> ELV -> Annotate
    const r5 = classifyVoltage(5);
    expect(r5.mode).toBe(SafetyMode.Annotate);
    expect(r5.requiresAssessment).toBe(false);

    // 24V -> SELV -> Gate
    const r24 = classifyVoltage(24);
    expect(r24.mode).toBe(SafetyMode.Gate);
    expect(r24.requiresAssessment).toBe(false);

    // 100V -> Low voltage -> Gate + assessment
    const r100 = classifyVoltage(100);
    expect(r100.mode).toBe(SafetyMode.Gate);
    expect(r100.requiresAssessment).toBe(true);

    // 240V -> Hazardous -> Redirect
    const r240 = classifyVoltage(240);
    expect(r240.mode).toBe(SafetyMode.Redirect);
    expect(r240.requiresAssessment).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// INTG-04: Learn Mode Citations
// ---------------------------------------------------------------------------

describe('INTG-04: Learn Mode Citations', () => {
  it('resolves H&H 1.2 to a valid citation referencing module 01', async () => {
    const { lookupCitation } = await import('../shared/learn-mode.js');
    const citation = lookupCitation('1.2');
    expect(citation).not.toBeNull();
    expect(citation!.chapter).toBe(1);
    expect(citation!.modules).toContain('01-the-circuit');
  });

  it('has chapter map entries covering all 15 modules', async () => {
    const { lookupCitation } = await import('../shared/learn-mode.js');

    // All chapter map refs that should cover all modules
    const refs = [
      '1.2', '1.4', '1.5', '1.6', '1.7',
      'Ch.2', 'Ch.3', 'Ch.4', 'Ch.5', 'Ch.6',
      '8.11', 'Ch.9', '9.8',
      '10.1-10.2', '10.3-10.5',
      'Ch.12', 'Ch.13', '13.5', 'Ch.14-15',
    ];

    const allModulesCovered = new Set<string>();
    for (const ref of refs) {
      const c = lookupCitation(ref);
      if (c) {
        for (const m of c.modules) {
          allModulesCovered.add(m);
        }
      }
    }

    // All 15 module IDs (07a uses logic-gates H&H 10.1-10.2, 13-plc uses IEC not H&H)
    for (const dir of MODULE_DIRS) {
      if (dir === '13-plc') continue; // PLC uses IEC 61131-3, not H&H
      expect(allModulesCovered.has(dir)).toBe(true);
    }
  });

  it('returns null for invalid citations', async () => {
    const { lookupCitation } = await import('../shared/learn-mode.js');
    expect(lookupCitation('99.99')).toBeNull();
    expect(lookupCitation('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// INTG-05: Cross-Pack Documentation (file existence)
// ---------------------------------------------------------------------------

describe('INTG-05: Cross-Pack Documentation', () => {
  it('has SKILL.md at pack root', () => {
    const skillPath = path.resolve(__dirname, '../SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  it('has references directory with hh-chapter-map', () => {
    const refsPath = path.resolve(__dirname, '../references/hh-chapter-map.md');
    expect(fs.existsSync(refsPath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// INTG-06: Circuit Format (file existence)
// ---------------------------------------------------------------------------

describe('INTG-06: Circuit Format', () => {
  it('has circuit-format.ts in shared/', async () => {
    const circuitFormat = await import('../shared/circuit-format.js');
    expect(circuitFormat).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// INTG-07: Assessment Scoring (warden exports)
// ---------------------------------------------------------------------------

describe('INTG-07: Assessment Scoring', () => {
  it('safety warden exports checkSafety for assessment gating', async () => {
    const warden = await import('../safety/warden.js');
    expect(typeof warden.checkSafety).toBe('function');

    // Verify it returns assessmentRequired field
    const result = warden.checkSafety('13-plc');
    expect(typeof result.assessmentRequired).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// INTG-08: Chipset Routing
// ---------------------------------------------------------------------------

describe('INTG-08: Chipset Routing', () => {
  const chipsetPath = path.resolve(__dirname, '../chipset.yaml');
  let chipset: any;

  it('loads and parses chipset.yaml', () => {
    const raw = fs.readFileSync(chipsetPath, 'utf-8');
    chipset = yaml.load(raw) as any;
    expect(chipset).toBeDefined();
    expect(chipset.name).toBe('electronics');
  });

  it('defines 14 skills', () => {
    expect(chipset.skills).toHaveLength(14);
  });

  it('each skill has id, name, triggers, module/modules, and tier', () => {
    for (const skill of chipset.skills) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(Array.isArray(skill.triggers)).toBe(true);
      expect(skill.triggers.length).toBeGreaterThan(0);
      expect(skill.module || skill.modules).toBeTruthy();
      expect(typeof skill.tier).toBe('number');
    }
  });

  it('skill modules map to existing module directories', () => {
    for (const skill of chipset.skills) {
      const mods = skill.modules
        ? skill.modules
        : [skill.module];
      for (const mod of mods) {
        const modPath = path.resolve(MODULES_DIR, mod);
        expect(fs.existsSync(modPath)).toBe(true);
      }
    }
  });

  it('trigger keywords are unique per skill', () => {
    for (const skill of chipset.skills) {
      // YAML may parse some triggers as non-string (e.g., AC -> boolean)
      // so coerce to string before checking uniqueness
      const normalized = skill.triggers.map((t: any) => String(t).toLowerCase());
      const unique = new Set(normalized);
      expect(unique.size).toBe(skill.triggers.length);
    }
  });
});

// ---------------------------------------------------------------------------
// INTG-09: All Modules Loadable
// ---------------------------------------------------------------------------

describe('INTG-09: All Modules Loadable', () => {
  it('all 16 module directories have loadable labs', async () => {
    let totalLabs = 0;

    for (const dir of MODULE_DIRS) {
      const mod = await import(`../modules/${dir}/labs`);
      expect(Array.isArray(mod.labs)).toBe(true);
      expect(mod.labs.length).toBeGreaterThan(0);
      totalLabs += mod.labs.length;
    }

    // Should have at least 75 labs total
    expect(totalLabs).toBeGreaterThanOrEqual(75);
  });

  it('each lab has required fields: id, title, steps, verify', async () => {
    for (const dir of MODULE_DIRS) {
      const mod = await import(`../modules/${dir}/labs`);
      for (const lab of mod.labs) {
        expect(lab.id).toBeTruthy();
        expect(lab.title).toBeTruthy();
        expect(Array.isArray(lab.steps)).toBe(true);
        expect(lab.steps.length).toBeGreaterThan(0);
        expect(typeof lab.verify).toBe('function');
      }
    }
  });

  it('each lab verify() returns true', async () => {
    for (const dir of MODULE_DIRS) {
      const mod = await import(`../modules/${dir}/labs`);
      for (const lab of mod.labs) {
        const result = lab.verify();
        expect(result).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// INTG-10: Overall Test Suite Health
// ---------------------------------------------------------------------------

describe('INTG-10: Test Suite Health', () => {
  it('has at least 36 test files in __tests__/', () => {
    const files = fs.readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.ts'));
    // 36 existing + this file + content-quality = 38
    expect(files.length).toBeGreaterThanOrEqual(36);
  });

  it('no test file is empty (each has at least 1 describe)', () => {
    const files = fs.readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.ts'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8');
      expect(content.includes('describe')).toBe(true);
    }
  });
});
