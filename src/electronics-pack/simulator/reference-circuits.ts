/**
 * Reference Circuit Definitions
 *
 * 10 canonical circuits with known analytical solutions for validating
 * the MNA simulator stack. Each circuit exercises a different combination
 * of analysis mode, component types, and measurement instruments.
 *
 * These definitions serve as the simulator's ground truth and are
 * imported by the reference-circuits test suite and by future lab phases
 * that need standard test circuits.
 *
 * Phase 264 Plan 03.
 */

import type { Component } from './components';

// ============================================================================
// Reference Circuit Interface
// ============================================================================

export interface ReferenceCircuit {
  id: string;
  name: string;
  description: string;
  components: Component[];
  analysisType: 'dc' | 'ac' | 'transient' | 'nonlinear' | 'roundtrip';
  groundNode: string;
  expected: Record<string, number>;
  tolerances: Record<string, number>;
}

// ============================================================================
// REF-01: Voltage Divider (DC)
// ============================================================================

export const voltageDivider: ReferenceCircuit = {
  id: 'REF-01',
  name: 'Voltage Divider',
  description: 'DC voltage divider: 10V source, R1=2k, R2=1k. Tests DC analysis, voltmeter, ammeter, stamp log.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 2000 },
    { id: 'R2', type: 'resistor', nodes: ['2', '0'], resistance: 1000 },
  ],
  analysisType: 'dc',
  groundNode: '0',
  expected: {
    V_2: 10 * 1000 / (1000 + 2000), // 3.3333V
    I_R: 10 / (2000 + 1000),         // 3.333mA
  },
  tolerances: {
    V_2: 0.001,  // 0.1%
    I_R: 0.001,  // 0.1%
  },
};

// ============================================================================
// REF-02: Wheatstone Bridge (DC)
// ============================================================================

export const wheatsoneBridge: ReferenceCircuit = {
  id: 'REF-02',
  name: 'Wheatstone Bridge',
  description: 'Balanced Wheatstone bridge: 5V source, R1=1k, R2=2k, R3=1k, R4=2k. Tests balanced bridge condition.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 5 },
    { id: 'R1', type: 'resistor', nodes: ['1', 'A'], resistance: 1000 },
    { id: 'R2', type: 'resistor', nodes: ['1', 'B'], resistance: 2000 },
    { id: 'R3', type: 'resistor', nodes: ['A', '0'], resistance: 1000 },
    { id: 'R4', type: 'resistor', nodes: ['B', '0'], resistance: 2000 },
  ],
  analysisType: 'dc',
  groundNode: '0',
  expected: {
    V_bridge: 0, // V(A) - V(B) = 0 for balanced bridge
  },
  tolerances: {
    V_bridge: 1e-10,
  },
};

// ============================================================================
// REF-03: RC Low-Pass Filter (AC)
// ============================================================================

export const rcLowPass: ReferenceCircuit = {
  id: 'REF-03',
  name: 'RC Low-Pass Filter',
  description: 'AC low-pass filter: 1V source, R=1k, C=1uF. fc=159.15Hz. Tests AC analysis magnitude/phase.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 },
    { id: 'C1', type: 'capacitor', nodes: ['2', '0'], capacitance: 1e-6 },
  ],
  analysisType: 'ac',
  groundNode: '0',
  expected: {
    fc: 1 / (2 * Math.PI * 1000 * 1e-6), // 159.155 Hz
    mag_at_fc_dB: -3.01,
    phase_at_fc_deg: -45,
    mag_passband_dB: 0,
    mag_stopband_dB: -20,
  },
  tolerances: {
    mag_at_fc_dB: 0.5,
    phase_at_fc_deg: 2,
    mag_passband_dB: 0.5,
    mag_stopband_dB: 2,
  },
};

// ============================================================================
// REF-04: RL High-Pass Filter (AC)
// ============================================================================

export const rlHighPass: ReferenceCircuit = {
  id: 'REF-04',
  name: 'RL High-Pass Filter',
  description: 'AC high-pass filter: 1V source, R=100 in series, L=10mH in shunt. fc=1591.55Hz. Tests AC analysis with inductor.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 100 },
    { id: 'L1', type: 'inductor', nodes: ['2', '0'], inductance: 10e-3 },
  ],
  analysisType: 'ac',
  groundNode: '0',
  expected: {
    fc: 100 / (2 * Math.PI * 10e-3), // 1591.55 Hz
    mag_at_fc_dB: -3.01,
    mag_passband_dB: 0,
    mag_stopband_dB: -20,
  },
  tolerances: {
    mag_at_fc_dB: 0.5,
    mag_passband_dB: 0.5,
    mag_stopband_dB: 2,
  },
};

// ============================================================================
// REF-05: Diode Rectifier (DC nonlinear)
// ============================================================================

export const diodeRectifier: ReferenceCircuit = {
  id: 'REF-05',
  name: 'Diode Rectifier',
  description: 'DC nonlinear: 5V source, R=1k, diode. Tests Newton-Raphson convergence and piecewise-linear diode model.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 5 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 },
    { id: 'D1', type: 'diode', nodes: ['2', '0'], saturationCurrent: 1e-14, thermalVoltage: 0.026 },
  ],
  analysisType: 'nonlinear',
  groundNode: '0',
  expected: {
    V_diode: 0.6,            // forward voltage drop (piecewise-linear threshold)
    I_R: (5 - 0.6) / 1000,  // ~4.4mA
  },
  tolerances: {
    V_diode: 0.1,   // 0.1V absolute
    I_R: 0.15,      // 15% relative
  },
};

// ============================================================================
// REF-06: Diode Clipping (DC nonlinear)
// ============================================================================

export const diodeClipping: ReferenceCircuit = {
  id: 'REF-06',
  name: 'Diode Clipping',
  description: 'DC nonlinear: 10V source, R=1k, anti-parallel diodes. Tests voltage clamping behavior.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 },
    { id: 'D1', type: 'diode', nodes: ['2', '0'], saturationCurrent: 1e-14, thermalVoltage: 0.026 },
    { id: 'D2', type: 'diode', nodes: ['0', '2'], saturationCurrent: 1e-14, thermalVoltage: 0.026 },
  ],
  analysisType: 'nonlinear',
  groundNode: '0',
  expected: {
    V_output: 0.6,  // clamped to ~0.6V by forward-biased D1
  },
  tolerances: {
    V_output: 0.1,  // 0.1V absolute
  },
};

// ============================================================================
// REF-07: RC Step Response (Transient)
// ============================================================================

export const rcStepResponse: ReferenceCircuit = {
  id: 'REF-07',
  name: 'RC Step Response',
  description: 'Transient: 5V step, R=1k, C=1uF. tau=1ms. Tests Backward Euler transient + oscilloscope.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 5 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 },
    { id: 'C1', type: 'capacitor', nodes: ['2', '0'], capacitance: 1e-6 },
  ],
  analysisType: 'transient',
  groundNode: '0',
  expected: {
    tau: 1e-3,                          // RC time constant
    V_at_tau: 5 * (1 - 1 / Math.E),    // 3.161V
    V_steady: 5,                        // final value
  },
  tolerances: {
    V_at_tau: 0.02,   // 2% relative
    V_steady: 0.01,   // 1% relative
  },
};

// ============================================================================
// REF-08: RL Step Response (Transient)
// ============================================================================

export const rlStepResponse: ReferenceCircuit = {
  id: 'REF-08',
  name: 'RL Step Response',
  description: 'Transient: 5V step, R=100 Ohm, L=10mH. tau=0.1ms. Tests inductor transient companion model.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 5 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 100 },
    { id: 'L1', type: 'inductor', nodes: ['2', '0'], inductance: 10e-3 },
  ],
  analysisType: 'transient',
  groundNode: '0',
  expected: {
    tau: 10e-3 / 100,                         // L/R = 0.1ms
    I_at_tau: (5 / 100) * (1 - 1 / Math.E),  // 31.6mA
    I_steady: 5 / 100,                        // 50mA
  },
  tolerances: {
    I_at_tau: 0.02,   // 2% relative
    I_steady: 0.01,   // 1% relative
  },
};

// ============================================================================
// REF-09: RLC Series Resonance (AC)
// ============================================================================

export const rlcResonance: ReferenceCircuit = {
  id: 'REF-09',
  name: 'RLC Series Resonance',
  description: 'AC resonance: 1V source, R=10, L=1mH, C=1uF. f0=5032.9Hz. Tests resonance peak and spectrum analyzer.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 10 },
    { id: 'L1', type: 'inductor', nodes: ['2', '3'], inductance: 1e-3 },
    { id: 'C1', type: 'capacitor', nodes: ['3', '0'], capacitance: 1e-6 },
  ],
  analysisType: 'ac',
  groundNode: '0',
  expected: {
    f0: 1 / (2 * Math.PI * Math.sqrt(1e-3 * 1e-6)), // 5032.9 Hz
    Q: (1 / 10) * Math.sqrt(1e-3 / 1e-6),            // 3.162
  },
  tolerances: {
    f0: 0.01,   // 1% relative
    Q: 0.01,    // 1% relative
  },
};

// ============================================================================
// REF-10: Circuit File Round-Trip
// ============================================================================

export const circuitRoundTrip: ReferenceCircuit = {
  id: 'REF-10',
  name: 'Circuit File Round-Trip',
  description: 'Save/load/convert voltage divider via CircuitDefinition format. Tests serialization integrity.',
  components: [
    { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 10 },
    { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 2000 },
    { id: 'R2', type: 'resistor', nodes: ['2', '0'], resistance: 1000 },
  ],
  analysisType: 'roundtrip',
  groundNode: '0',
  expected: {
    V_2: 10 * 1000 / (1000 + 2000), // 3.3333V (same as REF-01)
  },
  tolerances: {
    V_2: 1e-12, // machine precision for round-trip
  },
};

// ============================================================================
// Complete Reference Circuit Catalog
// ============================================================================

export const referenceCircuits: ReferenceCircuit[] = [
  voltageDivider,
  wheatsoneBridge,
  rcLowPass,
  rlHighPass,
  diodeRectifier,
  diodeClipping,
  rcStepResponse,
  rlStepResponse,
  rlcResonance,
  circuitRoundTrip,
];
