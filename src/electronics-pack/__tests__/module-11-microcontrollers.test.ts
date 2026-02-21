/**
 * Module 11: Microcontrollers -- Test Suite
 *
 * Validates all 5 MCU labs: blink LED, serial communication (UART),
 * ADC reading, PWM motor control, and I2C sensor network.
 *
 * All labs use the GPIOSimulator from Plan 01.
 *
 * TDD RED phase: tests written before lab implementation.
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../modules/11-microcontrollers/labs';
import { GPIOSimulator } from '../simulator/gpio-sim';

// ============================================================================
// General structure tests
// ============================================================================

describe('Module 11: Microcontrollers -- Lab structure', () => {
  it('has exactly 5 labs', () => {
    expect(labs).toHaveLength(5);
  });

  it('each lab has non-empty id, title, and steps', () => {
    for (const lab of labs) {
      expect(lab.id).toBeTruthy();
      expect(lab.title).toBeTruthy();
      expect(lab.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('each LabStep has instruction, expected_observation, and learn_note', () => {
    for (const lab of labs) {
      for (const step of lab.steps) {
        expect(step.instruction).toBeTruthy();
        expect(step.expected_observation).toBeTruthy();
        expect(step.learn_note).toBeTruthy();
      }
    }
  });

  it('lab IDs follow m11-lab-NN pattern', () => {
    const expectedIds = [
      'm11-lab-01',
      'm11-lab-02',
      'm11-lab-03',
      'm11-lab-04',
      'm11-lab-05',
    ];
    for (let i = 0; i < labs.length; i++) {
      expect(labs[i].id).toBe(expectedIds[i]);
    }
  });
});

// ============================================================================
// Lab 1: Blink
// ============================================================================

describe('Module 11: Lab 1 -- Blink', () => {
  it('has id m11-lab-01 and title "Blink"', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-01');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Blink');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-01')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- GPIO pin toggles high/low correctly', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-01')!;
    expect(lab.verify()).toBe(true);
  });

  it('GPIO pin 13 can be set as output and toggled', () => {
    const sim = new GPIOSimulator(20);
    sim.pinMode(13, 'output');

    sim.digitalWrite(13, 'high');
    expect(sim.digitalRead(13)).toBe('high');

    sim.digitalWrite(13, 'low');
    expect(sim.digitalRead(13)).toBe('low');
  });
});

// ============================================================================
// Lab 2: Serial Communication (UART)
// ============================================================================

describe('Module 11: Lab 2 -- Serial Communication', () => {
  it('has id m11-lab-02 and title "Serial Communication"', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-02');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('Serial Communication');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-02')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- UART round-trips "HELLO" bytes', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-02')!;
    expect(lab.verify()).toBe(true);
  });

  it('UART transmit of "HELLO" produces 50 bits (5 bytes * 10 bits/frame)', () => {
    const sim = new GPIOSimulator(20);
    sim.configureUART({ baudRate: 9600, dataBits: 8, stopBits: 1 });

    const helloBytes = [0x48, 0x45, 0x4c, 0x4c, 0x4f]; // H E L L O
    const bits = sim.uartTransmit(helloBytes);
    expect(bits).toHaveLength(50); // 5 * (1 start + 8 data + 1 stop)
  });

  it('UART receive correctly decodes transmitted "HELLO"', () => {
    const sim = new GPIOSimulator(20);
    sim.configureUART({ baudRate: 9600, dataBits: 8, stopBits: 1 });

    const helloBytes = [0x48, 0x45, 0x4c, 0x4c, 0x4f];
    const bits = sim.uartTransmit(helloBytes);
    const decoded = sim.uartReceive(bits);
    expect(decoded).toEqual(helloBytes);
  });
});

// ============================================================================
// Lab 3: ADC Reading
// ============================================================================

describe('Module 11: Lab 3 -- ADC Reading', () => {
  it('has id m11-lab-03 and title "ADC Reading"', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-03');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('ADC Reading');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-03')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- ADC converts 0V, 1.65V, 3.3V correctly', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-03')!;
    expect(lab.verify()).toBe(true);
  });

  it('10-bit ADC with 3.3V ref: 0V -> 0, 1.65V -> ~512, 3.3V -> 1023', () => {
    const sim = new GPIOSimulator(20);
    sim.configureADC({ resolutionBits: 10, vRef: 3.3 });

    sim.setAnalogVoltage(0, 0);
    expect(sim.analogRead(0)).toBe(0);

    sim.setAnalogVoltage(0, 1.65);
    const midCode = sim.analogRead(0);
    expect(Math.abs(midCode - 512)).toBeLessThanOrEqual(1);

    sim.setAnalogVoltage(0, 3.3);
    expect(sim.analogRead(0)).toBe(1023);
  });
});

// ============================================================================
// Lab 4: PWM Motor Control
// ============================================================================

describe('Module 11: Lab 4 -- PWM Motor Control', () => {
  it('has id m11-lab-04 and title "PWM Motor Control"', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-04');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('PWM Motor Control');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-04')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- PWM generates correct duty cycle timings', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-04')!;
    expect(lab.verify()).toBe(true);
  });

  it('PWM at 1 kHz with 50% duty: 500us high, 500us low', () => {
    const sim = new GPIOSimulator(20);
    sim.configurePWM(5, { frequencyHz: 1000, dutyCycle: 0.5 });
    const cycles = sim.generatePWM(5, 1);

    expect(cycles).toHaveLength(1);
    expect(cycles[0].high).toBe(500);
    expect(cycles[0].low).toBe(500);
  });

  it('PWM at 1 kHz with 0% duty: 0us high, 1000us low', () => {
    const sim = new GPIOSimulator(20);
    sim.configurePWM(5, { frequencyHz: 1000, dutyCycle: 0.0 });
    const cycles = sim.generatePWM(5, 1);

    expect(cycles[0].high).toBe(0);
    expect(cycles[0].low).toBe(1000);
  });

  it('PWM at 1 kHz with 100% duty: 1000us high, 0us low', () => {
    const sim = new GPIOSimulator(20);
    sim.configurePWM(5, { frequencyHz: 1000, dutyCycle: 1.0 });
    const cycles = sim.generatePWM(5, 1);

    expect(cycles[0].high).toBe(1000);
    expect(cycles[0].low).toBe(0);
  });
});

// ============================================================================
// Lab 5: I2C Sensor Network
// ============================================================================

describe('Module 11: Lab 5 -- I2C Sensor Network', () => {
  it('has id m11-lab-05 and title "I2C Sensor Network"', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-05');
    expect(lab).toBeDefined();
    expect(lab!.title).toBe('I2C Sensor Network');
  });

  it('has at least 3 steps', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-05')!;
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('verify() returns true -- I2C reads sensor registers with ACK/NACK', () => {
    const lab = labs.find((l) => l.id === 'm11-lab-05')!;
    expect(lab.verify()).toBe(true);
  });

  it('I2C read from registered slave returns correct data with ack', () => {
    const sim = new GPIOSimulator(20);
    sim.configureI2C(100000);
    sim.i2cSlaveRegisters(0x48, { 0: 0x19, 1: 0x80 });

    // Set register pointer to 0
    const writeResult = sim.i2cWrite(0x48, [0x00]);
    expect(writeResult.ack).toBe(true);

    // Read 2 bytes from current pointer
    const readResult = sim.i2cRead(0x48, 2);
    expect(readResult.ack).toBe(true);
    expect(readResult.data).toEqual([0x19, 0x80]);
  });

  it('I2C read from non-existent address returns NACK', () => {
    const sim = new GPIOSimulator(20);
    sim.configureI2C(100000);

    const result = sim.i2cRead(0x77, 1);
    expect(result.ack).toBe(false);
    expect(result.data).toEqual([]);
  });
});

// ============================================================================
// All verify() functions pass
// ============================================================================

describe('Module 11: All labs verify()', () => {
  it('all 5 verify() functions return true', () => {
    for (const lab of labs) {
      expect(lab.verify()).toBe(true);
    }
  });
});
