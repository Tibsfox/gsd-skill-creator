/**
 * Electronics Department Definition
 *
 * Defines the CollegeDepartment object for the electronics department,
 * including all 5 tier-based wings and token budget configuration.
 *
 * @module departments/electronics/electronics-department
 */

import type {
  CollegeDepartment,
  DepartmentWing,
  TrySession,
  TokenBudgetConfig,
  CalibrationModel,
  RosettaConcept,
} from '../../rosetta-core/types.js';

// ─── Wing Definitions ───────────────────────────────────────────────────────

const circuitFoundationsWing: DepartmentWing = {
  id: 'circuit-foundations',
  name: 'Circuit Foundations',
  description:
    'Voltage, current, resistance, passive components (RC/RL/RLC), AC signals and frequency analysis. ' +
    'Covers Ohm\'s Law, KVL/KCL, Thevenin/Norton equivalents, and Bode plots.',
  concepts: ['elec-ohms-law-fundamentals', 'elec-passive-component-behavior', 'elec-signal-ac-analysis'],
};

const activeDevicesWing: DepartmentWing = {
  id: 'active-devices',
  name: 'Active Devices',
  description:
    'Diode circuits, BJT/MOSFET transistors, semiconductor physics, and amplifier configurations. ' +
    'Covers rectification, Zener regulation, common-emitter amplifiers, and current mirrors.',
  concepts: ['elec-diode-rectification', 'elec-transistor-amplifiers', 'elec-semiconductor-physics'],
};

const analogSystemsWing: DepartmentWing = {
  id: 'analog-systems',
  name: 'Analog Systems',
  description:
    'Op-amp circuits, power supply design, feedback, stability, and active filter design. ' +
    'Covers inverting/non-inverting configurations, buck/boost regulators, and loop gain.',
  concepts: ['elec-opamp-configurations', 'elec-power-supply-design', 'elec-feedback-stability'],
};

const digitalMixedSignalWing: DepartmentWing = {
  id: 'digital-mixed-signal',
  name: 'Digital & Mixed-Signal',
  description:
    'Boolean logic, combinational and sequential digital circuits, ADC/DAC, and DSP fundamentals. ' +
    'Covers CMOS gates, flip-flops, Nyquist sampling, FIR/IIR filters, and FFT.',
  concepts: ['elec-combinational-logic', 'elec-sequential-logic-design', 'elec-data-conversion-dsp'],
};

const appliedSystemsWing: DepartmentWing = {
  id: 'applied-systems',
  name: 'Applied Systems',
  description:
    'Microcontrollers, sensors/actuators, PLC/ladder logic, off-grid power, and PCB design. ' +
    'Covers GPIO/UART/SPI/I2C, Wheatstone bridges, MPPT, Gerber files, and IEC 61131-3.',
  concepts: ['elec-microcontroller-interfacing', 'elec-sensor-actuator-systems', 'elec-industrial-embedded'],
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Electronics department -- 5 tier-based wings of electronics education.
 *
 * Wings follow the Horowitz & Hill progression from circuit foundations
 * through active devices, analog systems, digital mixed-signal, and
 * applied embedded systems.
 */
export const electronicsDepartment: CollegeDepartment = {
  id: 'electronics',
  name: 'Electronics',
  wings: [
    circuitFoundationsWing,
    activeDevicesWing,
    analogSystemsWing,
    digitalMixedSignalWing,
    appliedSystemsWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the electronics department.
 *
 * No-op: CollegeLoader uses filesystem discovery via DEPARTMENT.md.
 * This function exists as a programmatic registration hook for future use.
 */
export function registerElectronicsDepartment(): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
