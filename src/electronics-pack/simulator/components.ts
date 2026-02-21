/**
 * Circuit Component Models
 *
 * Type stubs for all simulatable electronic components.
 * Passive components implemented in Phase 263.
 * BJT model added in Phase 269.
 * MOSFET, op-amp, and regulator models added in Phase 270.
 */

/** Base component interface with type discriminator */
export interface BaseComponent {
  id: string;
  type: string;
  nodes: [string, string];
}

/** Resistor — Phase 263 */
export interface Resistor extends BaseComponent {
  type: 'resistor';
  resistance: number; // ohms
}

/** Capacitor — Phase 263 */
export interface Capacitor extends BaseComponent {
  type: 'capacitor';
  capacitance: number; // farads
}

/** Inductor — Phase 263 */
export interface Inductor extends BaseComponent {
  type: 'inductor';
  inductance: number; // henries
}

/** DC voltage source — Phase 263 */
export interface VoltageSource extends BaseComponent {
  type: 'voltage-source';
  voltage: number; // volts
}

/** DC current source — Phase 263 */
export interface CurrentSource extends BaseComponent {
  type: 'current-source';
  current: number; // amps
}

/** Diode — Phase 263 */
export interface Diode extends BaseComponent {
  type: 'diode';
  saturationCurrent: number; // amps (Is)
  thermalVoltage: number;    // volts (Vt)
}

/** BJT transistor — Phase 269 */
export interface BJT extends BaseComponent {
  type: 'bjt';
  polarity: 'NPN' | 'PNP';
  beta: number;          // current gain
  nodes: [string, string]; // collector, emitter (base is third)
  baseNode: string;
}

/** MOSFET — Phase 270 */
export interface MOSFET extends BaseComponent {
  type: 'mosfet';
  channel: 'N' | 'P';
  thresholdVoltage: number; // volts (Vth)
  onResistance: number;     // ohms (Rds_on)
  gateNode: string;
}

/** Op-amp — Phase 270 */
export interface OpAmp {
  id: string;
  type: 'op-amp';
  invertingInput: string;
  nonInvertingInput: string;
  output: string;
  openLoopGain: number;
  gbwProduct: number;  // Hz
  slewRate: number;    // V/us
  inputOffset: number; // volts
}

/** Voltage regulator — Phase 270 */
export interface Regulator extends BaseComponent {
  type: 'regulator';
  topology: 'linear' | 'buck' | 'boost' | 'buck-boost';
  outputVoltage: number;  // volts
  dropoutVoltage: number; // volts (linear only)
}

/** Union type of all circuit components */
export type Component =
  | Resistor
  | Capacitor
  | Inductor
  | VoltageSource
  | CurrentSource
  | Diode
  | BJT
  | MOSFET
  | Regulator;
