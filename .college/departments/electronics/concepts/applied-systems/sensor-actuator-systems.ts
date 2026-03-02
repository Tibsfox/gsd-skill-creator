import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sensorActuatorSystems: RosettaConcept = {
  id: 'elec-sensor-actuator-systems',
  name: 'Sensor & Actuator Systems',
  domain: 'electronics',
  description:
    'Wheatstone bridge balances four resistors to measure small resistance changes from sensors ' +
    '(strain gauges, RTDs, thermistors). At balance: R1/R2 = R3/R4; unbalance voltage is proportional ' +
    'to fractional resistance change. Instrumentation amplifiers (INA128, AD620) amplify the ' +
    'differential bridge voltage with high CMRR, rejecting power-supply noise. Thermocouples generate ' +
    'voltage from the Seebeck effect (e.g., Type K: 41 uV/degC) and require cold-junction compensation. ' +
    'H-bridge drives DC motors in both directions: two switches high-side, two low-side; never both ' +
    'on same side simultaneously (shoot-through). Stepper motors move in discrete angular steps ' +
    '(1.8 degrees/step for a 200-step motor); full-step, half-step, and microstepping modes trade ' +
    'resolution for torque. Optocouplers provide galvanic isolation between high-voltage and logic.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-opamp-configurations',
      description: 'Instrumentation amplifiers and signal conditioning for sensors use op-amp circuit techniques',
    },
    {
      type: 'dependency',
      targetId: 'elec-microcontroller-interfacing',
      description: 'Sensors interface to MCU ADC inputs; actuators are driven by MCU PWM and GPIO outputs',
    },
  ],
  complexPlanePosition: {
    real: 0.58,
    imaginary: 0.48,
    magnitude: Math.sqrt(0.58 ** 2 + 0.48 ** 2),
    angle: Math.atan2(0.48, 0.58),
  },
};
