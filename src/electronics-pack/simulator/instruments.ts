/**
 * Virtual Instruments
 *
 * Measurement instrument interfaces and functions for circuit analysis.
 * Voltmeter and ammeter implemented in Phase 264 Plan 01.
 */

import { dcAnalysis, type MNASolution } from './mna-engine';
import type { Component, VoltageSource } from './components';

/** Voltmeter — measures voltage between two nodes */
export interface Voltmeter {
  type: 'voltmeter';
  nodeA: string;
  nodeB: string;
  reading: number; // volts
}

/** Ammeter — measures current through a branch */
export interface Ammeter {
  type: 'ammeter';
  branch: string;
  reading: number; // amps
}

/** Oscilloscope channel configuration */
export interface OscilloscopeChannel {
  node: string;
  scale: number;    // volts per division
  offset: number;   // volts
  enabled: boolean;
}

/** Oscilloscope — time-domain waveform display (up to 4 channels) */
export interface Oscilloscope {
  type: 'oscilloscope';
  channels: OscilloscopeChannel[];
  timebase: number; // seconds per division
  triggerLevel: number;
  triggerChannel: number;
}

/** Spectrum analyzer — frequency-domain display */
export interface SpectrumAnalyzer {
  type: 'spectrum-analyzer';
  node: string;
  fftSize: number;
  window: 'rectangular' | 'hanning' | 'hamming';
  frequencyRange: [number, number]; // Hz
}

/** Union type of all instruments */
export type Instrument = Voltmeter | Ammeter | Oscilloscope | SpectrumAnalyzer;

// ============================================================================
// Measurement Functions
// ============================================================================

/**
 * Type guard: check if solution is an MNASolution (has nodeVoltages array)
 * vs a plain Record<string, number> from transient time-point data.
 */
function isMNASolution(
  solution: MNASolution | Record<string, number>,
): solution is MNASolution {
  return (
    typeof solution === 'object' &&
    solution !== null &&
    'nodeVoltages' in solution &&
    Array.isArray((solution as MNASolution).nodeVoltages)
  );
}

/**
 * Measure voltage between two nodes.
 *
 * Pure read from an existing solution -- does NOT modify the circuit.
 * Works with both MNASolution objects (from dcAnalysis) and plain
 * Record<string, number> snapshots (from transient time-point data).
 *
 * Ground node voltage is always 0V.
 *
 * @param nodeA - Positive probe node
 * @param nodeB - Negative probe node (reference)
 * @param solution - MNASolution or Record<string, number> of node voltages
 * @param groundNode - Name of the ground node (default "0")
 * @returns V(nodeA) - V(nodeB) in volts
 */
export function measureVoltage(
  nodeA: string,
  nodeB: string,
  solution: MNASolution | Record<string, number>,
  groundNode: string = '0',
): number {
  let voltageA: number;
  let voltageB: number;

  if (isMNASolution(solution)) {
    // Extract voltages from MNASolution nodeVoltages array
    const findVoltage = (node: string): number => {
      if (node === groundNode) return 0;
      const entry = solution.nodeVoltages.find((nv) => nv.node === node);
      return entry ? entry.voltage : 0;
    };
    voltageA = findVoltage(nodeA);
    voltageB = findVoltage(nodeB);
  } else {
    // Plain record: lookup directly, ground is 0
    voltageA = nodeA === groundNode ? 0 : (solution[nodeA] ?? 0);
    voltageB = nodeB === groundNode ? 0 : (solution[nodeB] ?? 0);
  }

  return voltageA - voltageB;
}

/**
 * Measure current between two nodes by inserting a zero-volt voltage source.
 *
 * Standard ammeter technique for MNA: insert a zero-volt voltage source
 * between nodeA (positive) and nodeB (negative), re-solve the circuit,
 * and read the branch current through the inserted source.
 *
 * The ammeter should be placed at a measurement point where no existing
 * component directly connects nodeA and nodeB -- like a real ammeter
 * inserted in series at a break point in a wire. The zero-volt source
 * creates the wire and captures the current flowing through it.
 *
 * The input components array is NOT mutated.
 *
 * @param nodeA - Node where current enters the ammeter (positive terminal)
 * @param nodeB - Node where current exits the ammeter (negative terminal)
 * @param components - Original circuit components (not mutated)
 * @param groundNode - Name of the ground node (default "0")
 * @returns Current in amps (positive = conventional current from nodeA to nodeB)
 */
export function measureCurrent(
  nodeA: string,
  nodeB: string,
  components: Component[],
  groundNode: string = '0',
): number {
  // Clone the components array (shallow) to avoid mutating the original
  const modifiedComponents = [...components];

  // Create a unique ammeter ID
  const ammeterId = `__ammeter_${nodeA}_${nodeB}`;

  // Insert a zero-volt voltage source between nodeA (positive) and nodeB (negative)
  const ammeterSource: VoltageSource = {
    id: ammeterId,
    type: 'voltage-source',
    nodes: [nodeA, nodeB],
    voltage: 0,
  };
  modifiedComponents.push(ammeterSource);

  // Re-solve the circuit with the ammeter inserted
  const solution = dcAnalysis(modifiedComponents, groundNode);

  // Find the branch current through the ammeter source
  const branch = solution.branchCurrents.find((bc) => bc.branch === ammeterId);
  if (!branch) return 0;

  // MNA convention for voltage source V with nodes [+, -] = [nodeA, nodeB]:
  // The branch current j in the MNA solution represents current injected
  // by the source into the positive terminal (nodeA) from internal flow.
  // The source carries current from -(nodeB) to +(nodeA) internally,
  // which means external current flows from +(nodeA) to -(nodeB).
  // j > 0 means current flows from nodeA to nodeB externally, which is
  // exactly the conventional ammeter reading direction we want.
  return branch.current;
}
