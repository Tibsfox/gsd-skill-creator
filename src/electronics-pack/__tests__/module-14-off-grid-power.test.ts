/**
 * Module 14: Off-Grid Power Systems -- Test Suite
 *
 * Validates all 5 off-grid power labs: solar I-V curve, battery bank
 * sizing, MPPT algorithm, inverter waveforms, and complete off-grid
 * system design.
 *
 * TDD RED phase: tests written before lab implementation.
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/14-off-grid-power/labs.js';

// ============================================================================
// General structure tests
// ============================================================================

describe('Module 14: Off-Grid Power -- Lab structure', () => {
  it('has exactly 5 labs', () => {
    expect(labs).toHaveLength(5);
  });

  it('each lab has non-empty id, title, and steps', () => {
    for (const lab of labs) {
      expect(lab.id).toBeTruthy();
      expect(lab.title).toBeTruthy();
      expect(lab.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('each LabStep has instruction, expected_observation, and learn_note', () => {
    for (const lab of labs) {
      for (const step of lab.steps) {
        expect(step.instruction).toBeTruthy();
        expect(step.expected_observation).toBeTruthy();
        expect(step.learn_note).toBeTruthy();
      }
    }
  });

  it('lab IDs follow m14-lab-NN pattern', () => {
    const expectedIds = [
      'm14-lab-01',
      'm14-lab-02',
      'm14-lab-03',
      'm14-lab-04',
      'm14-lab-05',
    ];
    for (let i = 0; i < labs.length; i++) {
      expect(labs[i].id).toBe(expectedIds[i]);
    }
  });
});

// ============================================================================
// Lab 1: Solar I-V Curve
// ============================================================================

describe('Module 14: Lab 1 -- Solar I-V Curve', () => {
  it('has id m14-lab-01 and title "Solar I-V Curve"', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-01');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Solar I-V Curve');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-01')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- generates I-V curve and validates Isc, Voc, fill factor', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-01')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Battery Bank Sizing
// ============================================================================

describe('Module 14: Lab 2 -- Battery Bank Sizing', () => {
  it('has id m14-lab-02 and title "Battery Bank Sizing"', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-02');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Battery Bank Sizing');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-02')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- discharges battery to 50% DOD and checks SOC/voltage', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-02')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: MPPT Algorithm
// ============================================================================

describe('Module 14: Lab 3 -- MPPT Algorithm', () => {
  it('has id m14-lab-03 and title "MPPT Algorithm"', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-03');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('MPPT Algorithm');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-03')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- P&O MPPT converges within 5% of true MPP', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-03')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: Inverter Waveforms
// ============================================================================

describe('Module 14: Lab 4 -- Inverter Waveforms', () => {
  it('has id m14-lab-04 and title "Inverter Waveforms"', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-04');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Inverter Waveforms');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-04')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- efficiency curve shape: 50% > 10%, 75% > 85%, input > output', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-04')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Complete Off-Grid System
// ============================================================================

describe('Module 14: Lab 5 -- Complete Off-Grid System', () => {
  it('has id m14-lab-05 and title "Complete Off-Grid System"', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-05');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Complete Off-Grid System');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-05')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- integrates solar + MPPT + battery + inverter', () => {
    const lab = labs.find((l) => l.id === 'm14-lab-05')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// All labs verify
// ============================================================================

describe('Module 14: All labs verify', () => {
  it('all 5 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
