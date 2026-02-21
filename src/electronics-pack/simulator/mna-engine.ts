/**
 * MNA Circuit Simulator Engine
 *
 * Modified Nodal Analysis for DC, AC, and transient circuit simulation.
 * To be implemented in Phase 263.
 */

/** Node voltage result from MNA solution */
export interface NodeVoltage {
  node: string;
  voltage: number;
}

/** Branch current result */
export interface BranchCurrent {
  branch: string;
  current: number;
}

/** MNA solution result */
export interface MNASolution {
  nodeVoltages: NodeVoltage[];
  branchCurrents: BranchCurrent[];
}

/** Stamp log entry for matrix visibility */
export interface StampLogEntry {
  component: string;
  row: number;
  col: number;
  value: number;
  explanation: string;
}
