/**
 * Module 12: Sensors and Actuators -- Lab exercises
 *
 * 5 labs demonstrating the interface between electronics and the physical world:
 *   Lab 1: Wheatstone Bridge (MNA simulation)
 *   Lab 2: Instrumentation Amplifier (mathematical model)
 *   Lab 3: H-Bridge Motor Driver (state machine)
 *   Lab 4: Stepper Motor Sequencer (sequence generator)
 *   Lab 5: Optocoupled Interface (signal transfer model)
 *
 * Labs 1 uses MNA dcAnalysis for analog signal conditioning.
 * Labs 2-5 use pure mathematical models and state machines.
 */

import { dcAnalysis } from '../../simulator/mna-engine.js';
import type { Component, Resistor, VoltageSource } from '../../simulator/components.js';

export interface LabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface Lab {
  id: string;
  title: string;
  steps: LabStep[];
  verify: () => boolean;
}

// ============================================================================
// Helper: check if two values are within a relative tolerance
// ============================================================================

function withinTolerance(actual: number, expected: number, toleranceFraction: number): boolean {
  if (expected === 0) return Math.abs(actual) < toleranceFraction;
  return Math.abs(actual - expected) / Math.abs(expected) < toleranceFraction;
}

// ============================================================================
// Lab 1: Wheatstone Bridge (m12-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm12-lab-01',
  title: 'Wheatstone Bridge',
  steps: [
    {
      instruction:
        'Build a Wheatstone bridge: voltage source Vs=5V between node "vcc" and ground "0". R1=1k between "vcc" and "a". R2=1k between "a" and "0". R3=1k between "vcc" and "b". R4=1k (sensor) between "b" and "0". Measure V_out = V(a) - V(b).',
      expected_observation:
        'Both nodes "a" and "b" are at 2.5V. The difference V_out = 0V. The bridge is balanced because R1/R2 = R3/R4 = 1.',
      learn_note:
        'A balanced Wheatstone bridge outputs zero volts regardless of the excitation voltage. This null output is the key to its sensitivity -- any deviation from balance produces a measurable signal against a zero baseline.',
    },
    {
      instruction:
        'Now change R4 (the sensor) to 1010 ohms, simulating a 1% resistance increase from a strain gauge under load. Re-run the analysis and measure V_out = V(a) - V(b).',
      expected_observation:
        'V(a) stays at 2.5V (unchanged arm). V(b) shifts slightly because the R3-R4 divider ratio changed. V_out is approximately 12.5mV -- a tiny but measurable signal from a 1% change.',
      learn_note:
        'The bridge converts a tiny resistance change into a proportional voltage. The approximate formula is V_out ~ Vs * deltaR / (4*R) for small changes. Here: 5V * 10 / 4000 = 12.5mV. This is far more sensitive than measuring the resistance directly.',
    },
    {
      instruction:
        'Calculate the sensitivity: 12.5mV per 1% change at 5V excitation. For a strain gauge with gauge factor 2, this corresponds to 5000 microstrain. In a real application, this millivolt-level signal feeds an instrumentation amplifier (Lab 2).',
      expected_observation:
        'The bridge produces millivolt-scale outputs. Without amplification, the signal is too small for most ADCs (which need volts). The signal-to-noise ratio depends on excitation voltage and bridge balance.',
      learn_note:
        'The Wheatstone bridge is the starting point of nearly every precision sensor system. Strain gauges, RTDs, load cells, and pressure sensors all use bridges. The bridge output always needs amplification -- that is why instrumentation amplifiers exist.',
    },
  ],
  verify: () => {
    // Test 1: Balanced bridge (all 1k) -> Vout ~ 0V
    const balancedComponents: Component[] = [
      { id: 'Vs', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['vcc', 'a'], resistance: 1000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['a', '0'], resistance: 1000 } as Resistor,
      { id: 'R3', type: 'resistor', nodes: ['vcc', 'b'], resistance: 1000 } as Resistor,
      { id: 'R4', type: 'resistor', nodes: ['b', '0'], resistance: 1000 } as Resistor,
    ];
    const balancedResult = dcAnalysis(balancedComponents);
    const vaBalanced = balancedResult.nodeVoltages.find((nv) => nv.node === 'a');
    const vbBalanced = balancedResult.nodeVoltages.find((nv) => nv.node === 'b');
    if (!vaBalanced || !vbBalanced) return false;
    const vOutBalanced = Math.abs(vaBalanced.voltage - vbBalanced.voltage);
    // Balanced bridge should be < 5mV (essentially 0)
    if (vOutBalanced > 0.005) return false;

    // Test 2: Unbalanced bridge (R4=1010 ohms, 1% change) -> Vout ~ 12.5mV
    const unbalancedComponents: Component[] = [
      { id: 'Vs', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['vcc', 'a'], resistance: 1000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['a', '0'], resistance: 1000 } as Resistor,
      { id: 'R3', type: 'resistor', nodes: ['vcc', 'b'], resistance: 1000 } as Resistor,
      { id: 'R4', type: 'resistor', nodes: ['b', '0'], resistance: 1010 } as Resistor,
    ];
    const unbalancedResult = dcAnalysis(unbalancedComponents);
    const vaUnbalanced = unbalancedResult.nodeVoltages.find((nv) => nv.node === 'a');
    const vbUnbalanced = unbalancedResult.nodeVoltages.find((nv) => nv.node === 'b');
    if (!vaUnbalanced || !vbUnbalanced) return false;
    const vOutUnbalanced = Math.abs(vaUnbalanced.voltage - vbUnbalanced.voltage);
    // Should be approximately 12.5mV (within 20% tolerance for circuit topology)
    if (!withinTolerance(vOutUnbalanced, 0.0125, 0.20)) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: Instrumentation Amplifier (m12-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm12-lab-02',
  title: 'Instrumentation Amplifier',
  steps: [
    {
      instruction:
        'Model an instrumentation amplifier (INA) as a gain block. The gain formula is G = 1 + 2*R/Rg, where R = 24.7k and Rg = 500 ohms. Calculate the gain.',
      expected_observation:
        'G = 1 + 2 * 24700 / 500 = 1 + 98.8 = 99.8. This is very close to 100x gain, set by a single resistor (Rg).',
      learn_note:
        'An instrumentation amplifier uses three op-amps internally but presents a simple interface: one gain-setting resistor. This is much more practical than wiring three separate op-amps. The INA128 and AD620 are classic examples.',
    },
    {
      instruction:
        'Apply a differential signal from the Wheatstone bridge: V+ = 2.512V, V- = 2.500V (12mV differential). Calculate the output: Vout = G * (V+ - V-).',
      expected_observation:
        'Vout = 99.8 * (2.512 - 2.500) = 99.8 * 0.012 = 1.1976V. The 12mV bridge signal has been amplified to nearly 1.2V -- now easily readable by an ADC.',
      learn_note:
        'The INA amplifies only the difference between its inputs, rejecting the large common-mode voltage (2.5V). This common-mode rejection ratio (CMRR) is typically 80-120 dB. Without it, the 2.5V common-mode would swamp the 12mV signal.',
    },
    {
      instruction:
        'Now try a different Rg to change the gain. With Rg = 1000 ohms: G = 1 + 2*24700/1000 = 50.4. Vout = 50.4 * 0.012 = 0.605V. With Rg = 250 ohms: G = 1 + 2*24700/250 = 198.6.',
      expected_observation:
        'Smaller Rg = higher gain. The gain adjusts smoothly from ~1 (Rg -> infinity) to ~200 (Rg = 250 ohms). The designer chooses Rg to match the expected sensor signal range to the ADC input range.',
      learn_note:
        'Gain selection is a design trade-off: higher gain amplifies both signal and noise. The INA gain should place the full-scale sensor output just below the ADC maximum. For a 12-bit ADC with 3.3V reference, target Vout_max ~ 3.0V to avoid clipping.',
    },
  ],
  verify: () => {
    const R = 24700; // ohms
    const Rg = 500;  // ohms

    // Test 1: Gain calculation
    const gain = 1 + 2 * R / Rg; // expect 99.8
    if (!withinTolerance(gain, 99.8, 0.01)) return false;

    // Test 2: Output voltage with 12mV differential
    const vPlus = 2.512;
    const vMinus = 2.500;
    const vDiff = vPlus - vMinus; // 0.012V
    const vOut = gain * vDiff;    // expect ~1.1976V
    if (!withinTolerance(vOut, 1.1976, 0.05)) return false;

    // Test 3: Different gain with Rg = 1000 ohms
    const gain2 = 1 + 2 * R / 1000;
    const vOut2 = gain2 * vDiff;
    if (!withinTolerance(gain2, 50.4, 0.01)) return false;
    if (!withinTolerance(vOut2, 0.6048, 0.05)) return false;

    return true;
  },
};

// ============================================================================
// Lab 3: H-Bridge Motor Driver (m12-lab-03)
// ============================================================================

/** H-bridge switch configuration */
interface HBridgeSwitches {
  q1: boolean; // high-side left
  q2: boolean; // high-side right
  q3: boolean; // low-side left
  q4: boolean; // low-side right
}

type MotorState = 'forward' | 'reverse' | 'coast' | 'shoot-through';

/**
 * Determine motor state from H-bridge switch configuration.
 *
 * Q1 (high-left)  + Q4 (low-right) ON -> forward (current left-to-right)
 * Q2 (high-right) + Q3 (low-left) ON  -> reverse (current right-to-left)
 * All OFF                              -> coast (motor free-spins)
 * Q1+Q2 ON (same-leg high-side)        -> shoot-through (short circuit!)
 * Q3+Q4 ON (same-leg low-side)         -> shoot-through
 */
function getMotorState(sw: HBridgeSwitches): MotorState {
  // Shoot-through detection: both switches on same leg
  if (sw.q1 && sw.q3) return 'shoot-through'; // left leg
  if (sw.q2 && sw.q4) return 'shoot-through'; // right leg

  // Forward: Q1 (high-left) + Q4 (low-right)
  if (sw.q1 && sw.q4 && !sw.q2 && !sw.q3) return 'forward';

  // Reverse: Q2 (high-right) + Q3 (low-left)
  if (sw.q2 && sw.q3 && !sw.q1 && !sw.q4) return 'reverse';

  // Coast: all off
  if (!sw.q1 && !sw.q2 && !sw.q3 && !sw.q4) return 'coast';

  // Any other combination (partial switching) treated as coast
  return 'coast';
}

const lab03: Lab = {
  id: 'm12-lab-03',
  title: 'H-Bridge Motor Driver',
  steps: [
    {
      instruction:
        'Model an H-bridge with 4 switches: Q1 (high-left), Q2 (high-right), Q3 (low-left), Q4 (low-right). The motor sits between the left and right midpoints. Set Q1=true, Q4=true, others false. Check the motor direction.',
      expected_observation:
        'Motor state: "forward". Current flows from supply through Q1, through the motor left-to-right, through Q4 to ground. The motor spins in the forward direction.',
      learn_note:
        'An H-bridge gets its name from the H-shaped arrangement of four switches around the motor. By selecting which diagonal pair is ON, you control the direction of current through the motor and therefore its rotation direction.',
    },
    {
      instruction:
        'Now set Q2=true, Q3=true, Q1=false, Q4=false (the other diagonal). Check the motor direction. Then try all switches OFF.',
      expected_observation:
        'With Q2+Q3: motor state is "reverse" -- current flows right-to-left through the motor. With all OFF: motor state is "coast" -- motor spins freely with no drive current, gradually slowing due to friction.',
      learn_note:
        'The two diagonal pairs give forward and reverse. All-off gives coast (free spin). In a real H-bridge, you also control speed using PWM on the enable pin, rapidly switching between driving and coasting.',
    },
    {
      instruction:
        'WARNING: Set Q1=true, Q3=true (both switches on the left leg). Check the state. This is the dangerous "shoot-through" condition.',
      expected_observation:
        'Motor state: "shoot-through"! Both the high-side and low-side switches on the same leg are ON simultaneously, creating a direct short circuit from supply to ground. This causes massive current and can destroy the transistors instantly.',
      learn_note:
        'Shoot-through is the most dangerous H-bridge fault. Real motor driver ICs (L298, DRV8833) include dead-time insertion: a brief delay between turning off one switch and turning on the other, ensuring both are never ON simultaneously.',
    },
  ],
  verify: () => {
    // Forward: Q1+Q4 ON
    const forward = getMotorState({ q1: true, q2: false, q3: false, q4: true });
    if (forward !== 'forward') return false;

    // Reverse: Q2+Q3 ON
    const reverse = getMotorState({ q1: false, q2: true, q3: true, q4: false });
    if (reverse !== 'reverse') return false;

    // Coast: all OFF
    const coast = getMotorState({ q1: false, q2: false, q3: false, q4: false });
    if (coast !== 'coast') return false;

    // Shoot-through: left leg (Q1+Q3)
    const stLeft = getMotorState({ q1: true, q2: false, q3: true, q4: false });
    if (stLeft !== 'shoot-through') return false;

    // Shoot-through: right leg (Q2+Q4)
    const stRight = getMotorState({ q1: false, q2: true, q3: false, q4: true });
    if (stRight !== 'shoot-through') return false;

    return true;
  },
};

// ============================================================================
// Lab 4: Stepper Motor Sequencer (m12-lab-04)
// ============================================================================

type CoilPhase = [number, number, number, number]; // [A, B, A', B']

/**
 * Generate full-step sequence (two-phase-on, higher torque).
 * Standard 4-phase sequence for a bipolar stepper motor.
 */
function fullStepSequence(): CoilPhase[] {
  return [
    [1, 1, 0, 0], // A + B
    [0, 1, 1, 0], // B + A'
    [0, 0, 1, 1], // A' + B'
    [1, 0, 0, 1], // B' + A
  ];
}

/**
 * Generate half-step sequence (8 phases, finer resolution).
 * Interleaves single-coil and double-coil states.
 */
function halfStepSequence(): CoilPhase[] {
  return [
    [1, 0, 0, 0], // A only
    [1, 1, 0, 0], // A + B
    [0, 1, 0, 0], // B only
    [0, 1, 1, 0], // B + A'
    [0, 0, 1, 0], // A' only
    [0, 0, 1, 1], // A' + B'
    [0, 0, 0, 1], // B' only
    [1, 0, 0, 1], // B' + A
  ];
}

/**
 * Calculate rotor angle after N steps.
 * @param steps Number of steps taken
 * @param stepAngle Degrees per step (1.8 for standard 200-step motor)
 * @returns Angle in degrees (modulo 360)
 */
function rotorAngle(steps: number, stepAngle: number): number {
  return (steps * stepAngle) % 360;
}

const lab04: Lab = {
  id: 'm12-lab-04',
  title: 'Stepper Motor Sequencer',
  steps: [
    {
      instruction:
        'Generate the full-step sequence for a 4-phase stepper motor using two-phase-on drive. Each phase energizes two adjacent coils for maximum holding torque. Step through the 4 phases and observe the coil pattern.',
      expected_observation:
        'Full-step sequence has 4 unique phases: [1,1,0,0], [0,1,1,0], [0,0,1,1], [1,0,0,1]. Each phase has exactly 2 coils energized. The pattern rotates the magnetic field in 90-degree increments.',
      learn_note:
        'Stepper motors move in discrete angular steps by switching which coils are energized. The two-phase-on (full-step) drive provides the highest torque because two coils pull the rotor simultaneously. Each step rotates the motor by its step angle.',
    },
    {
      instruction:
        'Generate the half-step sequence. This interleaves single-coil and double-coil states, producing 8 unique phases and halving the step angle. Compare with the full-step sequence.',
      expected_observation:
        'Half-step has 8 unique phases. It alternates between 1-coil and 2-coil energization: [1,0,0,0], [1,1,0,0], [0,1,0,0], ... This gives 0.9 degrees/step instead of 1.8, doubling the positioning resolution.',
      learn_note:
        'Half-stepping is a compromise: finer resolution than full-step but lower torque during the single-coil phases. For applications needing smooth motion (CNC machines, 3D printers), microstepping (sinusoidal current profiles) provides even finer resolution.',
    },
    {
      instruction:
        'Calculate the rotor angle after 10 full steps of a 200-step/revolution motor (step angle = 1.8 degrees). Then calculate for 200 steps (full revolution).',
      expected_observation:
        '10 full steps: 10 * 1.8 = 18 degrees. 200 full steps: 200 * 1.8 = 360 degrees = one full revolution. The relationship is perfectly linear: angle = N * step_angle.',
      learn_note:
        'The key advantage of stepper motors is open-loop position control: you know exactly where the shaft is by counting steps. No encoder or feedback is needed (unless you risk missing steps under heavy load). A 200-step motor divides 360 degrees into 200 precise increments.',
    },
  ],
  verify: () => {
    // Test 1: Full-step sequence has 4 unique phases
    const fullSeq = fullStepSequence();
    if (fullSeq.length !== 4) return false;
    const fullSet = new Set(fullSeq.map((p) => p.join(',')));
    if (fullSet.size !== 4) return false;

    // Test 2: Half-step sequence has 8 unique phases
    const halfSeq = halfStepSequence();
    if (halfSeq.length !== 8) return false;
    const halfSet = new Set(halfSeq.map((p) => p.join(',')));
    if (halfSet.size !== 8) return false;

    // Test 3: Rotor angle after 10 full steps = 18 degrees (1.8 deg/step)
    const angle10 = rotorAngle(10, 1.8);
    if (!withinTolerance(angle10, 18, 0.001)) return false;

    // Test 4: Rotor angle after 200 steps = 360 degrees (full revolution)
    const angle200 = rotorAngle(200, 1.8);
    if (!withinTolerance(angle200, 0, 0.001)) return false; // 360 % 360 = 0

    return true;
  },
};

// ============================================================================
// Lab 5: Optocoupled Interface (m12-lab-05)
// ============================================================================

/** Optocoupler parameters */
interface OptocouplerParams {
  vIn: number;      // input voltage (V)
  vfLed: number;    // LED forward voltage (V)
  rIn: number;      // input current-limiting resistor (ohms)
  ctr: number;      // current transfer ratio (fraction, e.g., 1.0 = 100%)
  rPullup: number;  // output pull-up resistor (ohms)
  vcc: number;      // output supply voltage (V)
}

interface OptocouplerResult {
  ledCurrent: number;   // mA
  outputCurrent: number; // mA
  outputVoltage: number; // V
  isLedOn: boolean;
  isOutputLow: boolean;
}

/**
 * Model optocoupler signal transfer.
 * Input side: LED driven through resistor. If Vin > Vf_led, current flows.
 * Output side: phototransistor conducts when LED is ON, pulling output LOW.
 * When LED is OFF, pull-up holds output HIGH.
 */
function simulateOptocoupler(params: OptocouplerParams): OptocouplerResult {
  const { vIn, vfLed, rIn, ctr, rPullup, vcc } = params;

  // Input current: only flows if Vin > Vf_led
  const ledCurrent = vIn > vfLed ? (vIn - vfLed) / rIn : 0;
  const isLedOn = ledCurrent > 0.0001; // 0.1mA threshold

  // Output: phototransistor collector current = CTR * LED current
  const outputCurrent = isLedOn ? ctr * ledCurrent : 0;

  // Output voltage: if conducting, Vout ~ 0V (saturated). If off, Vout = Vcc
  // More precisely: Vout = Vcc - Ic * Rpullup, clamped to [0, Vcc]
  let outputVoltage: number;
  if (isLedOn) {
    outputVoltage = Math.max(0, vcc - outputCurrent * rPullup);
  } else {
    outputVoltage = vcc;
  }

  const isOutputLow = outputVoltage < 0.5; // TTL low threshold

  return { ledCurrent, outputCurrent, outputVoltage, isLedOn, isOutputLow };
}

const lab05: Lab = {
  id: 'm12-lab-05',
  title: 'Optocoupled Interface',
  steps: [
    {
      instruction:
        'Model an optocoupler (4N35 type) with: input from MCU GPIO at 3.3V, LED forward voltage 1.2V, input resistor 330 ohms. Output side: pull-up resistor 10k to Vcc=5V, CTR=100%. Drive the input HIGH (3.3V) and observe the output.',
      expected_observation:
        'LED current = (3.3 - 1.2) / 330 = 6.36mA. Phototransistor conducts: Ic = 1.0 * 6.36mA = 6.36mA. Output voltage = 5V - 6.36mA * 10k = deeply saturated at ~0V. Output is LOW when input is HIGH (inverted).',
      learn_note:
        'The optocoupler inverts the signal: HIGH input turns on the LED, which turns on the phototransistor, which pulls the output LOW. This is inherent to the open-collector output configuration with a pull-up resistor.',
    },
    {
      instruction:
        'Now drive the input LOW (0V). The LED receives no current. Observe the output state.',
      expected_observation:
        'LED current = 0 (Vin < Vf_led). Phototransistor is OFF: no collector current. Output is pulled to Vcc = 5V by the pull-up resistor. Output is HIGH when input is LOW.',
      learn_note:
        'With no LED light, the phototransistor is effectively an open switch. The pull-up resistor defines the HIGH voltage level on the output side. The input and output sides share no electrical connection -- they are galvanically isolated.',
    },
    {
      instruction:
        'Verify the isolation: the input side operates at 3.3V (MCU domain) and the output side at 5V (relay domain). The CTR determines how much LED current is "transferred" to the phototransistor. Calculate CTR requirements for a specific output current.',
      expected_observation:
        'CTR = Ic / If. For 6.36mA input current and 100% CTR, output delivers 6.36mA -- more than enough to drive a logic gate or relay driver transistor. Typical optocouplers have CTR from 50% to 300%.',
      learn_note:
        'Optocouplers provide galvanic isolation rated at 1-7.5kV. This protects sensitive MCU circuitry from high-voltage spikes on the output side. They are essential in industrial control, medical equipment, and any application where safety isolation is required.',
    },
  ],
  verify: () => {
    const baseParams: OptocouplerParams = {
      vIn: 3.3,
      vfLed: 1.2,
      rIn: 330,
      ctr: 1.0,   // 100%
      rPullup: 10000,
      vcc: 5.0,
    };

    // Test 1: Input HIGH (3.3V) -> LED ON -> output LOW
    const highResult = simulateOptocoupler(baseParams);
    if (!highResult.isLedOn) return false;
    if (!highResult.isOutputLow) return false;
    // LED current should be approximately (3.3 - 1.2) / 330 = 6.36mA
    if (!withinTolerance(highResult.ledCurrent, 0.006364, 0.05)) return false;

    // Test 2: Input LOW (0V) -> LED OFF -> output HIGH (5V)
    const lowResult = simulateOptocoupler({ ...baseParams, vIn: 0 });
    if (lowResult.isLedOn) return false;
    if (lowResult.isOutputLow) return false;
    if (!withinTolerance(lowResult.outputVoltage, 5.0, 0.01)) return false;

    // Test 3: CTR calculation is correct
    // Output current = CTR * LED current
    const expectedOutputCurrent = baseParams.ctr * highResult.ledCurrent;
    if (!withinTolerance(highResult.outputCurrent, expectedOutputCurrent, 0.01)) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
