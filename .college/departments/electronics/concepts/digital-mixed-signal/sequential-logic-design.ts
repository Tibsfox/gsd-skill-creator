import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sequentialLogicDesign: RosettaConcept = {
  id: 'elec-sequential-logic-design',
  name: 'Sequential Logic Design',
  domain: 'electronics',
  description:
    'Sequential circuits add memory to combinational logic: outputs depend on both current inputs and ' +
    'stored state. D flip-flop captures input on clock rising edge; Q follows D one clock cycle later. ' +
    'JK flip-flop adds toggle functionality. SR latch has forbidden state when both S=R=1. ' +
    'Registers are arrays of D flip-flops. Binary counters increment on each clock edge; ' +
    'synchronous counters change all bits simultaneously; ripple counters change serially (slower). ' +
    'Finite state machines (FSMs): Moore outputs depend only on state; Mealy outputs depend on state ' +
    'and inputs. State diagrams show transitions with input/output labels. Synchronous design principle: ' +
    'all flip-flops share one clock to prevent metastability. Setup time (data must be stable before ' +
    'clock edge) and hold time (data must be stable after clock edge) are critical timing constraints.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-combinational-logic',
      description: 'Next-state logic and output logic in FSMs are combinational circuits',
    },
    {
      type: 'dependency',
      targetId: 'elec-microcontroller-interfacing',
      description: 'MCU peripherals (UART, SPI, I2C) are sequential state machines implemented in hardware',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.60,
    magnitude: Math.sqrt(0.45 ** 2 + 0.60 ** 2),
    angle: Math.atan2(0.60, 0.45),
  },
};
