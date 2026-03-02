import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const feedbackControl: RosettaConcept = {
  id: 'tech-feedback-control',
  name: 'Feedback & Control Systems',
  domain: 'technology',
  description:
    'Feedback systems sense outputs and adjust inputs to maintain a desired state. ' +
    'A thermostat is a simple feedback controller: sensor (thermometer) → comparator (vs. setpoint) → actuator (heater). ' +
    'Negative feedback stabilizes systems; positive feedback amplifies change. ' +
    'PID controllers (Proportional-Integral-Derivative) are the most common industrial control algorithm. ' +
    'Modern control systems underlie automotive cruise control, aircraft autopilots, and industrial automation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-inputs-processes-outputs',
      description: 'Feedback loops connect the output back to modify the input — extending the basic IPO model',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
