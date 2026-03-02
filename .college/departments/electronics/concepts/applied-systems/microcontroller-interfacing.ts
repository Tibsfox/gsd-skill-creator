import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const microcontrollerInterfacing: RosettaConcept = {
  id: 'elec-microcontroller-interfacing',
  name: 'Microcontroller Interfacing',
  domain: 'electronics',
  description:
    'Microcontrollers (MCUs) integrate CPU, memory, and peripherals on one chip. GPIO (general-purpose ' +
    'I/O) pins are configurable as digital input, output, or alternate function. UART is asynchronous ' +
    'serial: start bit, 8 data bits, stop bit at a configured baud rate (e.g., 9600, 115200). ' +
    'SPI is synchronous: MOSI (master-out), MISO (master-in), SCK (clock), CS (chip-select) -- ' +
    'full duplex, fast (up to 100MHz). I2C uses two wires (SDA, SCL) with 7-bit addresses, ' +
    'supporting up to 127 devices on one bus (400kHz fast-mode). Interrupts allow peripherals to ' +
    'preempt the main loop: ISR (interrupt service routine) must be brief and avoid blocking calls. ' +
    'PWM (pulse-width modulation) varies duty cycle to control motors, LEDs, and servos. ' +
    'Arduino/ESP32 abstract hardware registers with simplified API. Timer peripherals generate PWM, ' +
    'measure pulse width, and create precise delays without busy-waiting.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-sequential-logic-design',
      description: 'MCU peripherals (UART state machine, SPI shift register, I2C protocol FSM) are sequential logic in hardware',
    },
    {
      type: 'dependency',
      targetId: 'elec-sensor-actuator-systems',
      description: 'Sensors connect to MCU via ADC and SPI/I2C; actuators connect via PWM and H-bridge',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.50,
    magnitude: Math.sqrt(0.55 ** 2 + 0.50 ** 2),
    angle: Math.atan2(0.50, 0.55),
  },
};
