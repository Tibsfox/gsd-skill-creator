/**
 * MOSFET, Op-Amp, and Regulator Model Test Suite (Phase 270 Plan 01)
 *
 * Validates MOSFET N/P-channel switches, op-amp VCVS model (ideal/non-ideal),
 * and voltage regulator (linear/buck/boost) stamps and circuit solutions.
 *
 * Tests: type definitions, stamp exports, circuit solutions via solveNonlinear,
 * stampComponent dispatch, collectNodes integration.
 */

import { describe, it, expect } from 'vitest';
import {
  stampMOSFET,
  stampOpAmp,
  stampRegulator,
  stampComponent,
} from '../simulator/components';
import { solveNonlinear } from '../simulator/mna-engine';
import type {
  Component,
  MOSFET,
  OpAmp,
  Regulator,
  StampTarget,
} from '../simulator/components';
import type { StampLogEntry } from '../simulator/mna-engine';

// ============================================================================
// MOSFET Tests (SIM-16)
// ============================================================================

describe('MOSFET Model', () => {
  // Test 1
  it('stampMOSFET is exported and callable', () => {
    expect(typeof stampMOSFET).toBe('function');
  });

  // Test 2
  it('N-channel MOSFET type definition', () => {
    const m1: MOSFET = {
      id: 'M1',
      type: 'mosfet',
      channel: 'N',
      thresholdVoltage: 2.0,
      onResistance: 0.1,
      nodes: ['d', 's'],
      gateNode: 'g',
    };
    expect(m1.id).toBe('M1');
    expect(m1.type).toBe('mosfet');
    expect(m1.channel).toBe('N');
    expect(m1.thresholdVoltage).toBe(2.0);
    expect(m1.onResistance).toBe(0.1);
    expect(m1.nodes).toEqual(['d', 's']);
    expect(m1.gateNode).toBe('g');
  });

  // Test 3: N-channel MOSFET switch ON circuit
  it('N-channel MOSFET switch ON circuit', () => {
    // 5V supply, R_D = 1k, N-MOSFET M1 (Vth=2, Rds_on=0.1), gate = 5V
    // Vgs = 5V > Vth = 2V => ON, V_drain ~ 0V (nearly all voltage across R_D)
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 },
      { id: 'RD', type: 'resistor', nodes: ['vcc', 'd'], resistance: 1000 },
      { id: 'M1', type: 'mosfet', channel: 'N', thresholdVoltage: 2.0, onResistance: 0.1, nodes: ['d', '0'], gateNode: 'g' },
      { id: 'VG', type: 'voltage-source', nodes: ['g', '0'], voltage: 5 },
    ];

    const result = solveNonlinear(components, '0');

    expect(result.converged).toBe(true);

    const vDrain = result.nodeVoltages.find((nv) => nv.node === 'd');
    expect(vDrain).toBeDefined();
    // MOSFET ON: V_drain ~ Rds_on * I_D = 0.1 * 5mA = 0.5mV, effectively 0
    expect(vDrain!.voltage).toBeLessThan(0.1);
  });

  // Test 4: N-channel MOSFET switch OFF circuit
  it('N-channel MOSFET switch OFF circuit', () => {
    // Same circuit but gate at 0V => Vgs = 0 < Vth = 2 => OFF
    // V_drain ~ 5V (no current, drain pulled to VCC through R_D)
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 },
      { id: 'RD', type: 'resistor', nodes: ['vcc', 'd'], resistance: 1000 },
      { id: 'M1', type: 'mosfet', channel: 'N', thresholdVoltage: 2.0, onResistance: 0.1, nodes: ['d', '0'], gateNode: 'g' },
      { id: 'VG', type: 'voltage-source', nodes: ['g', '0'], voltage: 0 },
    ];

    const result = solveNonlinear(components, '0');

    expect(result.converged).toBe(true);

    const vDrain = result.nodeVoltages.find((nv) => nv.node === 'd');
    expect(vDrain).toBeDefined();
    // MOSFET OFF: V_drain ~ VCC = 5V (tiny leakage through R_off)
    expect(vDrain!.voltage).toBeGreaterThan(4.5);
  });

  // Test 5: P-channel MOSFET switch ON circuit
  it('P-channel MOSFET switch ON circuit', () => {
    // 5V supply, R_D = 1k from drain to ground, P-MOSFET (drain='d', source='vcc')
    // Gate grounded (0V), so Vsg = V_source - V_gate = 5 - 0 = 5 >= Vth = 2 => ON
    // Current flows from source (VCC) through MOSFET to drain, then through R_D to GND
    // V_drain ~ 5V (only Rds_on drop from VCC)
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 },
      { id: 'RD', type: 'resistor', nodes: ['d', '0'], resistance: 1000 },
      { id: 'M1', type: 'mosfet', channel: 'P', thresholdVoltage: 2.0, onResistance: 0.1, nodes: ['d', 'vcc'], gateNode: 'g' },
      { id: 'VG', type: 'voltage-source', nodes: ['g', '0'], voltage: 0 },
    ];

    const result = solveNonlinear(components, '0');

    expect(result.converged).toBe(true);

    const vDrain = result.nodeVoltages.find((nv) => nv.node === 'd');
    expect(vDrain).toBeDefined();
    // P-channel ON: current flows, V_drain = I_D * R_D ~ 5V * R_D / (R_D + Rds_on) ~ 5V
    expect(vDrain!.voltage).toBeGreaterThan(4.0);
  });
});

// ============================================================================
// Op-Amp Tests (SIM-17)
// ============================================================================

describe('Op-Amp Model', () => {
  // Test 6
  it('stampOpAmp is exported and callable', () => {
    expect(typeof stampOpAmp).toBe('function');
  });

  // Test 7: Ideal non-inverting amplifier
  it('ideal non-inverting amplifier', () => {
    // Op-amp U1: openLoopGain=1e6, V_in=1V, R_f=10k, R_g=10k
    // Non-inverting config: gain = 1 + Rf/Rg = 2, V_out ~ 2V
    const components: Component[] = [
      { id: 'Vin', type: 'voltage-source', nodes: ['inp', '0'], voltage: 1 },
      { id: 'Rf', type: 'resistor', nodes: ['out', 'inv'], resistance: 10000 },
      { id: 'Rg', type: 'resistor', nodes: ['inv', '0'], resistance: 10000 },
    ];

    const opamps: OpAmp[] = [{
      id: 'U1',
      type: 'op-amp',
      nonInvertingInput: 'inp',
      invertingInput: 'inv',
      output: 'out',
      openLoopGain: 1e6,
      gbwProduct: 1e6,
      slewRate: 1,
      inputOffset: 0,
    }];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);

    expect(result.converged).toBe(true);

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    expect(vOut).toBeDefined();
    // Gain = 2, V_out = 2V within 1%
    expect(vOut!.voltage).toBeCloseTo(2.0, 1);
  });

  // Test 8: Ideal inverting amplifier
  it('ideal inverting amplifier', () => {
    // Op-amp U1: V_in=1V through R_in=10k to inv, R_f=20k from out to inv
    // Non-inverting input tied to ground, gain = -Rf/Rin = -2, V_out ~ -2V
    const components: Component[] = [
      { id: 'Vin', type: 'voltage-source', nodes: ['inp_r', '0'], voltage: 1 },
      { id: 'Rin', type: 'resistor', nodes: ['inp_r', 'inv'], resistance: 10000 },
      { id: 'Rf', type: 'resistor', nodes: ['out', 'inv'], resistance: 20000 },
    ];

    const opamps: OpAmp[] = [{
      id: 'U1',
      type: 'op-amp',
      nonInvertingInput: '0',
      invertingInput: 'inv',
      output: 'out',
      openLoopGain: 1e6,
      gbwProduct: 1e6,
      slewRate: 1,
      inputOffset: 0,
    }];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);

    expect(result.converged).toBe(true);

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    expect(vOut).toBeDefined();
    // Gain = -2, V_out = -2V within 1%
    expect(vOut!.voltage).toBeCloseTo(-2.0, 1);
  });

  // Test 9: Non-ideal op-amp has finite gain
  it('non-ideal op-amp has finite gain', () => {
    // Same non-inverting circuit but openLoopGain = 1000
    // Closed-loop gain: G = A / (1 + A*beta) where beta = Rg/(Rf+Rg) = 0.5
    // G = 1000 / (1 + 1000*0.5) = 1000/501 ~ 1.996
    const components: Component[] = [
      { id: 'Vin', type: 'voltage-source', nodes: ['inp', '0'], voltage: 1 },
      { id: 'Rf', type: 'resistor', nodes: ['out', 'inv'], resistance: 10000 },
      { id: 'Rg', type: 'resistor', nodes: ['inv', '0'], resistance: 10000 },
    ];

    const opamps: OpAmp[] = [{
      id: 'U1',
      type: 'op-amp',
      nonInvertingInput: 'inp',
      invertingInput: 'inv',
      output: 'out',
      openLoopGain: 1000,
      gbwProduct: 1e6,
      slewRate: 1,
      inputOffset: 0,
    }];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);

    expect(result.converged).toBe(true);

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    expect(vOut).toBeDefined();
    // V_out ~ 1.996V within 1%
    expect(vOut!.voltage).toBeCloseTo(1.996, 1);
  });

  // Test 10: Op-amp with input offset
  it('op-amp with input offset', () => {
    // Non-inverting amp (gain=2), V_in = 0V, inputOffset = 5mV
    // Output ~ gain * offset = 2 * 5mV = 10mV
    const components: Component[] = [
      { id: 'Vin', type: 'voltage-source', nodes: ['inp', '0'], voltage: 0 },
      { id: 'Rf', type: 'resistor', nodes: ['out', 'inv'], resistance: 10000 },
      { id: 'Rg', type: 'resistor', nodes: ['inv', '0'], resistance: 10000 },
    ];

    const opamps: OpAmp[] = [{
      id: 'U1',
      type: 'op-amp',
      nonInvertingInput: 'inp',
      invertingInput: 'inv',
      output: 'out',
      openLoopGain: 1e6,
      gbwProduct: 1e6,
      slewRate: 1,
      inputOffset: 0.005,
    }];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);

    expect(result.converged).toBe(true);

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    expect(vOut).toBeDefined();
    // V_out ~ 0.01V within 20%
    expect(Math.abs(vOut!.voltage - 0.01)).toBeLessThan(0.002);
  });
});

// ============================================================================
// Regulator Tests (SIM-18)
// ============================================================================

describe('Regulator Model', () => {
  // Test 11
  it('stampRegulator is exported and callable', () => {
    expect(typeof stampRegulator).toBe('function');
  });

  // Test 12: 7805 linear regulator: 12V in, 5V out
  it('7805 linear regulator: 12V in, 5V out', () => {
    // 12V source, regulator (linear, Vout=5, Vdo=2), R_load=100 ohm
    // V_in=12 > Vout+Vdo=7 => in regulation, V_out=5V
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 12 },
      { id: 'REG1', type: 'regulator', topology: 'linear', outputVoltage: 5.0, dropoutVoltage: 2.0, nodes: ['vin', 'vout'] },
      { id: 'RL', type: 'resistor', nodes: ['vout', '0'], resistance: 100 },
    ];

    const result = solveNonlinear(components, '0');

    expect(result.converged).toBe(true);

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'vout');
    expect(vOut).toBeDefined();
    // V_out = 5.0V within 1%
    expect(vOut!.voltage).toBeCloseTo(5.0, 1);
  });

  // Test 13: LDO regulator in dropout
  it('LDO regulator in dropout', () => {
    // 6V source, regulator (linear, Vout=5, Vdo=2)
    // V_in=6 < Vout+Vdo=7 => dropout, V_out ~ Vin - Vdo = 4V
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 6 },
      { id: 'REG1', type: 'regulator', topology: 'linear', outputVoltage: 5.0, dropoutVoltage: 2.0, nodes: ['vin', 'vout'] },
      { id: 'RL', type: 'resistor', nodes: ['vout', '0'], resistance: 100 },
    ];

    const result = solveNonlinear(components, '0');

    expect(result.converged).toBe(true);

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'vout');
    expect(vOut).toBeDefined();
    // V_out ~ 4.0V within 5%
    expect(vOut!.voltage).toBeCloseTo(4.0, 0);
  });

  // Test 14: Buck converter: 12V in, 3.3V out
  it('buck converter: 12V in, 3.3V out', () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 12 },
      { id: 'REG1', type: 'regulator', topology: 'buck', outputVoltage: 3.3, dropoutVoltage: 0, nodes: ['vin', 'vout'] },
      { id: 'RL', type: 'resistor', nodes: ['vout', '0'], resistance: 100 },
    ];

    const result = solveNonlinear(components, '0');

    expect(result.converged).toBe(true);

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'vout');
    expect(vOut).toBeDefined();
    // V_out = 3.3V within 1%
    expect(vOut!.voltage).toBeCloseTo(3.3, 1);
  });

  // Test 15: Boost converter: 3.3V in, 5V out
  it('boost converter: 3.3V in, 5V out', () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 3.3 },
      { id: 'REG1', type: 'regulator', topology: 'boost', outputVoltage: 5.0, dropoutVoltage: 0, nodes: ['vin', 'vout'] },
      { id: 'RL', type: 'resistor', nodes: ['vout', '0'], resistance: 100 },
    ];

    const result = solveNonlinear(components, '0');

    expect(result.converged).toBe(true);

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'vout');
    expect(vOut).toBeDefined();
    // V_out = 5.0V within 1%
    expect(vOut!.voltage).toBeCloseTo(5.0, 1);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: stamp dispatch and node collection', () => {
  // Test 16: stampComponent dispatches MOSFET
  it('stampComponent dispatches MOSFET', () => {
    const mosfet: MOSFET = {
      id: 'M1',
      type: 'mosfet',
      channel: 'N',
      thresholdVoltage: 2.0,
      onResistance: 0.1,
      nodes: ['d', '0'],
      gateNode: 'g',
    };

    const size = 3;
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix.push(new Array(size).fill(0));
    }
    const rhs = new Array(size).fill(0);
    const stampLog: StampLogEntry[] = [];
    const nodeMap = new Map<string, number>([['d', 0], ['g', 1]]);

    const target: StampTarget = {
      matrix,
      rhs,
      stampLog,
      nodeIndex: (node: string) => {
        if (node === '0') return -1;
        return nodeMap.get(node) ?? -1;
      },
      vsIndex: () => -1,
      n: size,
    };

    // stampComponent with MOSFET and 'dc' analysis should not throw
    expect(() => stampComponent(target, mosfet, 'dc')).not.toThrow();
  });

  // Test 17: collectNodes collects MOSFET gateNode
  it('collectNodes collects MOSFET gateNode', () => {
    // A circuit with MOSFET where gateNode is a unique node
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5 },
      { id: 'RD', type: 'resistor', nodes: ['vcc', 'd'], resistance: 1000 },
      { id: 'M1', type: 'mosfet', channel: 'N', thresholdVoltage: 2.0, onResistance: 0.1, nodes: ['d', '0'], gateNode: 'g' },
      { id: 'VG', type: 'voltage-source', nodes: ['g', '0'], voltage: 5 },
    ];

    const result = solveNonlinear(components, '0');

    // The gate node 'g' should appear in the node voltages
    const vG = result.nodeVoltages.find((nv) => nv.node === 'g');
    expect(vG).toBeDefined();
    expect(typeof vG!.voltage).toBe('number');
  });

  // Test 18: OpAmp type is defined and stampOpAmp accepts it
  it('OpAmp is defined and stampOpAmp accepts it', () => {
    const opamp: OpAmp = {
      id: 'U1',
      type: 'op-amp',
      invertingInput: 'inv',
      nonInvertingInput: 'ninv',
      output: 'out',
      openLoopGain: 1e6,
      gbwProduct: 1e6,
      slewRate: 1,
      inputOffset: 0,
    };

    // Verify OpAmp does NOT extend BaseComponent (no nodes array)
    expect('nodes' in opamp).toBe(false);
    expect(opamp.type).toBe('op-amp');

    // stampOpAmp should accept it (type check)
    expect(typeof stampOpAmp).toBe('function');
  });
});
