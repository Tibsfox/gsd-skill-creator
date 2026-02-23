/**
 * Module 12: Sensors and Actuators -- Test Suite
 *
 * Validates all 5 sensor/actuator labs: Wheatstone bridge, instrumentation
 * amplifier, H-bridge motor driver, stepper motor sequencer, and optocoupled
 * interface.
 *
 * Labs 1-2 use MNA circuit simulation for analog signal conditioning.
 * Labs 3-5 use mathematical models / state machines for motor control
 * and digital isolation.
 *
 * TDD RED phase: tests written before lab implementation.
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/12-sensors-actuators/labs.js';

// ============================================================================
// General structure tests
// ============================================================================

describe('Module 12: Sensors and Actuators -- Lab structure', () => {
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

  it('lab IDs follow m12-lab-NN pattern', () => {
    const expectedIds = [
      'm12-lab-01',
      'm12-lab-02',
      'm12-lab-03',
      'm12-lab-04',
      'm12-lab-05',
    ];
    for (let i = 0; i < labs.length; i++) {
      expect(labs[i].id).toBe(expectedIds[i]);
    }
  });
});

// ============================================================================
// Lab 1: Wheatstone Bridge (MNA simulation)
// ============================================================================

describe('Module 12: Lab 1 -- Wheatstone Bridge', () => {
  it('has id m12-lab-01 and title "Wheatstone Bridge"', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-01');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Wheatstone Bridge');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-01')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- balanced bridge ~0V, 1% change ~12.5mV', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-01')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 2: Instrumentation Amplifier (mathematical model)
// ============================================================================

describe('Module 12: Lab 2 -- Instrumentation Amplifier', () => {
  it('has id m12-lab-02 and title "Instrumentation Amplifier"', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-02');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Instrumentation Amplifier');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-02')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- gain ~100 amplifies 12mV to ~1.2V', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-02')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 3: H-Bridge Motor Driver (state machine model)
// ============================================================================

describe('Module 12: Lab 3 -- H-Bridge Motor Driver', () => {
  it('has id m12-lab-03 and title "H-Bridge Motor Driver"', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-03');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('H-Bridge Motor Driver');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-03')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- correct forward/reverse/coast/shoot-through detection', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-03')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 4: Stepper Motor Sequencer (mathematical model)
// ============================================================================

describe('Module 12: Lab 4 -- Stepper Motor Sequencer', () => {
  it('has id m12-lab-04 and title "Stepper Motor Sequencer"', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-04');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Stepper Motor Sequencer');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-04')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- 4 full-step phases, 8 half-step phases, correct angle', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-04')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// Lab 5: Optocoupled Interface (mathematical model)
// ============================================================================

describe('Module 12: Lab 5 -- Optocoupled Interface', () => {
  it('has id m12-lab-05 and title "Optocoupled Interface"', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-05');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Optocoupled Interface');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-05')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- input HIGH->output LOW, input LOW->output HIGH, CTR correct', () => {
    const lab = labs.find((l) => l.id === 'm12-lab-05')!;
    expect(lab.verify()).toBe(true);
  });
});

// ============================================================================
// All labs verify
// ============================================================================

describe('Module 12: All labs verify', () => {
  it('all 5 verify() calls return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
