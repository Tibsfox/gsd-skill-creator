/**
 * Electronics Department Agent Definitions.
 *
 * Five agents route the 14 chipset skills across tiers:
 * - EL-1 circuit-instructor: foundations (voltage/current/resistance, passive components, signals)
 * - EL-2 semiconductor-instructor: semiconductor devices (diodes, transistors)
 * - EL-3 analog-systems-instructor: analog systems (op-amps, power supplies)
 * - EL-4 digital-instructor: digital and mixed-signal (logic, data conversion, DSP)
 * - EL-5 systems-instructor: applied systems (MCU, sensors, industrial)
 *
 * @module departments/electronics/chipset/agent-definitions
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single skill within the electronics chipset */
export interface ChipsetSkill {
  /** Unique skill identifier */
  id: string;
  /** Domain/wing this skill covers */
  domain: string;
  /** Description of what this skill provides */
  description: string;
}

/** An agent definition with skill routing */
export interface AgentDefinition {
  /** Agent role identifier */
  id: string;
  /** Agent name */
  name: string;
  /** Agent role description */
  role: string;
  /** Skills this agent routes */
  skills: string[];
}

// ─── Agent Definitions ───────────────────────────────────────────────────────

/**
 * EL-1 Circuit Instructor -- foundation electronics for Tier 1.
 * Covers voltage, current, resistance, passive components, and AC signals.
 */
export const circuitInstructorAgent: AgentDefinition = {
  id: 'EL-1',
  name: 'circuit-instructor',
  role: 'Foundation instructor for voltage/current/resistance, passive components, and signals',
  skills: ['circuit-fundamentals', 'passive-components', 'signal-analysis'],
};

/**
 * EL-2 Semiconductor Instructor -- Tier 2a device physics.
 * Covers diode and transistor circuits.
 */
export const semiconductorInstructorAgent: AgentDefinition = {
  id: 'EL-2',
  name: 'semiconductor-instructor',
  role: 'Semiconductor device instructor for diodes and transistors',
  skills: ['diode-circuits', 'transistor-circuits'],
};

/**
 * EL-3 Analog Systems Instructor -- Tier 2b analog design.
 * Covers op-amp circuits and power supply design.
 */
export const analogSystemsInstructorAgent: AgentDefinition = {
  id: 'EL-3',
  name: 'analog-systems-instructor',
  role: 'Analog system design instructor for op-amps and power supplies',
  skills: ['op-amp-circuits', 'power-supply-design'],
};

/**
 * EL-4 Digital Instructor -- Tier 3 digital and mixed-signal.
 * Covers logic gates, sequential logic, data conversion, and DSP.
 */
export const digitalInstructorAgent: AgentDefinition = {
  id: 'EL-4',
  name: 'digital-instructor',
  role: 'Digital and mixed-signal instructor for logic, data conversion, and DSP',
  skills: ['logic-gate-design', 'sequential-logic', 'data-conversion', 'dsp-fundamentals'],
};

/**
 * EL-5 Systems Instructor -- Tier 4 applied systems.
 * Covers microcontrollers, sensor/actuator systems, and industrial electronics.
 */
export const systemsInstructorAgent: AgentDefinition = {
  id: 'EL-5',
  name: 'systems-instructor',
  role: 'Applied systems instructor and safety warden liaison',
  skills: ['microcontroller-systems', 'sensor-actuator-systems', 'industrial-and-applied'],
};
