/**
 * Electronics Department Chipset Configuration.
 *
 * Defines the complete chipset for the Electronics department:
 * 14 skills covering all 4 tiers (15 modules), 5 agents with tier-based routing,
 * and the token budget for session management.
 *
 * Migrated from src/electronics-pack/chipset.yaml (Phase 23).
 * HH chapter references (Horowitz & Hill, Art of Electronics 3rd Ed.) are preserved.
 *
 * @module departments/electronics/chipset/electronics-chipset
 */

import type { ChipsetSkill, AgentDefinition } from './agent-definitions.js';
import {
  circuitInstructorAgent,
  semiconductorInstructorAgent,
  analogSystemsInstructorAgent,
  digitalInstructorAgent,
  systemsInstructorAgent,
} from './agent-definitions.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Token budget configuration for Electronics sessions */
export interface TokenBudget {
  /** Maximum tokens per session summary */
  summaryLimit: number;
  /** Maximum tokens for active session */
  activeLimit: number;
  /** Maximum tokens for deep-dive sessions */
  deepLimit: number;
}

/** Complete chipset configuration */
export interface ChipsetConfig {
  name: string;
  version: string;
  description: string;
  skills: ChipsetSkill[];
  agents: AgentDefinition[];
  tokenBudget: TokenBudget;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

const skills: ChipsetSkill[] = [
  {
    id: 'circuit-fundamentals',
    domain: 'circuit-foundations',
    description: "Voltage, current, resistance, Ohm's law, KVL/KCL, power, series/parallel circuits",
  },
  {
    id: 'passive-components',
    domain: 'circuit-foundations',
    description: 'Capacitors, inductors, RC/RL/RLC filters, resonance, Thevenin/Norton, impedance',
  },
  {
    id: 'signal-analysis',
    domain: 'circuit-foundations',
    description: 'AC signals, frequency response, Bode plots, decibels, noise, coupling, spectrum',
  },
  {
    id: 'diode-circuits',
    domain: 'active-devices',
    description: 'Diode I-V curves, rectification, Zener, LEDs, Shockley equation, clamping, bridge',
  },
  {
    id: 'transistor-circuits',
    domain: 'active-devices',
    description: 'BJT/MOSFET amplifiers, common-emitter, emitter-follower, current mirrors, gain',
  },
  {
    id: 'op-amp-circuits',
    domain: 'analog-systems',
    description: 'Operational amplifiers, inverting/non-inverting, integrator, differentiator, comparator, active filters',
  },
  {
    id: 'power-supply-design',
    domain: 'analog-systems',
    description: 'Linear/switching regulators, buck/boost, LDO, ripple, thermal management, battery charging',
  },
  {
    id: 'logic-gate-design',
    domain: 'digital-mixed-signal',
    description: "Boolean algebra, combinational logic, CMOS construction, truth tables, K-maps, De Morgan's",
  },
  {
    id: 'sequential-logic',
    domain: 'digital-mixed-signal',
    description: 'Flip-flops, counters, registers, state machines, clocks, latches, memory',
  },
  {
    id: 'data-conversion',
    domain: 'digital-mixed-signal',
    description: 'ADC/DAC architectures, sampling theorem, Nyquist, quantization, aliasing',
  },
  {
    id: 'dsp-fundamentals',
    domain: 'digital-mixed-signal',
    description: 'FIR/IIR filters, FFT/DFT, convolution, windowing, fixed-point arithmetic',
  },
  {
    id: 'microcontroller-systems',
    domain: 'applied-systems',
    description: 'MCU architecture, GPIO, UART/SPI/I2C, interrupts, PWM, Arduino/ESP32',
  },
  {
    id: 'sensor-actuator-systems',
    domain: 'applied-systems',
    description: 'Wheatstone bridge, H-bridge, stepper motors, thermocouples, instrumentation amplifiers',
  },
  {
    id: 'industrial-and-applied',
    domain: 'applied-systems',
    description: 'PLC/ladder logic, off-grid/solar power, PCB design and layout',
  },
];

// ─── Chipset Config ──────────────────────────────────────────────────────────

/**
 * The complete Electronics chipset configuration.
 *
 * 14 skills, 5 tiered agents, token budget for session management.
 * Preserves all HH chapter references from the source electronics-pack.
 */
export const chipsetConfig: ChipsetConfig = {
  name: 'electronics',
  version: '0.1.0',
  description:
    'Electronics Department -- routes queries across 15 modules (4 tiers) covering ' +
    'circuit foundations through applied embedded systems. Based on Horowitz & Hill, ' +
    'Art of Electronics 3rd Ed.',
  skills,
  agents: [
    circuitInstructorAgent,
    semiconductorInstructorAgent,
    analogSystemsInstructorAgent,
    digitalInstructorAgent,
    systemsInstructorAgent,
  ],
  tokenBudget: {
    summaryLimit: 3000,
    activeLimit: 12000,
    deepLimit: 50000,
  },
};
