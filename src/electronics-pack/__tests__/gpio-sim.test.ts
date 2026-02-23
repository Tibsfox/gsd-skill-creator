/**
 * GPIO Simulator Test Suite
 *
 * 26 test cases covering GPIO pins (8), UART (3), SPI (2), I2C (3),
 * PWM (3), ADC (3), timer (2), and interrupts (2).
 *
 * Phase 274 Plan 01 -- RED phase.
 */

import { describe, it, expect } from 'vitest';
import {
  GPIOSimulator,
  type GPIOPin,
  type PinDirection,
  type PinState,
  type PullMode,
  type UARTConfig,
  type SPIConfig,
  type I2CTransaction,
  type PWMConfig,
  type ADCConfig,
  type TimerConfig,
  type InterruptHandler,
} from '../simulator/gpio-sim.js';

// ===========================================================================
// Group 1: GPIO Pin Tests
// ===========================================================================

describe('GPIO Pin Tests', () => {
  it('constructor creates pins in input mode with low state', () => {
    const sim = new GPIOSimulator(8);
    const pin0 = sim.getPin(0);
    expect(pin0.direction).toBe('input');
    expect(pin0.state).toBe('low');
    expect(pin0.pull).toBe('none');
  });

  it('pinMode sets pin direction', () => {
    const sim = new GPIOSimulator(8);
    sim.pinMode(0, 'output');
    const pin0 = sim.getPin(0);
    expect(pin0.direction).toBe('output');
  });

  it('digitalWrite sets output pin high or low', () => {
    const sim = new GPIOSimulator(8);
    sim.pinMode(0, 'output');

    sim.digitalWrite(0, 'high');
    expect(sim.getPin(0).state).toBe('high');

    sim.digitalWrite(0, 'low');
    expect(sim.getPin(0).state).toBe('low');
  });

  it('digitalRead returns pin state', () => {
    const sim = new GPIOSimulator(8);
    sim.pinMode(0, 'output');
    sim.digitalWrite(0, 'high');
    expect(sim.digitalRead(0)).toBe('high');
  });

  it('digitalRead on floating input returns low', () => {
    const sim = new GPIOSimulator(8);
    sim.pinMode(0, 'input');
    expect(sim.digitalRead(0)).toBe('low');
  });

  it('pull-up resistor makes floating input read high', () => {
    const sim = new GPIOSimulator(8);
    sim.pinMode(0, 'input');
    sim.setPull(0, 'pullup');
    expect(sim.digitalRead(0)).toBe('high');
  });

  it('pull-down resistor makes floating input read low', () => {
    const sim = new GPIOSimulator(8);
    sim.pinMode(0, 'input');
    sim.setPull(0, 'pulldown');
    expect(sim.digitalRead(0)).toBe('low');
  });

  it('external drive overrides pull resistor', () => {
    const sim = new GPIOSimulator(8);
    sim.pinMode(0, 'input');
    sim.setPull(0, 'pullup');
    sim.externalDrive(0, 'low');
    expect(sim.digitalRead(0)).toBe('low');
  });
});

// ===========================================================================
// Group 2: UART Peripheral Tests
// ===========================================================================

describe('UART Peripheral Tests', () => {
  it('UART transmit encodes byte with start/stop bits', () => {
    const sim = new GPIOSimulator(8);
    sim.configureUART({ baudRate: 9600, dataBits: 8, stopBits: 1 });

    // Transmit 0x55 = 01010101 binary
    const frame = sim.uartTransmit([0x55]);

    // Frame: start(0), 8 data bits LSB-first (1,0,1,0,1,0,1,0), stop(1)
    expect(frame).toHaveLength(10);
    expect(frame[0]).toBe(0); // start bit
    // 0x55 = 01010101 -> LSB-first: 1,0,1,0,1,0,1,0
    expect(frame[1]).toBe(1);
    expect(frame[2]).toBe(0);
    expect(frame[3]).toBe(1);
    expect(frame[4]).toBe(0);
    expect(frame[5]).toBe(1);
    expect(frame[6]).toBe(0);
    expect(frame[7]).toBe(1);
    expect(frame[8]).toBe(0);
    expect(frame[9]).toBe(1); // stop bit
  });

  it('UART receive decodes bitstream to bytes', () => {
    const sim = new GPIOSimulator(8);
    sim.configureUART({ baudRate: 9600, dataBits: 8, stopBits: 1 });

    // Feed bits: start=0, data=0x55 LSB-first (1,0,1,0,1,0,1,0), stop=1
    const bits = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
    const bytes = sim.uartReceive(bits);
    expect(bytes).toEqual([0x55]);
  });

  it('UART round-trips data', () => {
    const sim = new GPIOSimulator(8);
    sim.configureUART({ baudRate: 9600, dataBits: 8, stopBits: 1 });

    const original = [0x48, 0x49]; // "HI"
    const transmitted = sim.uartTransmit(original);
    const received = sim.uartReceive(transmitted);
    expect(received).toEqual(original);
  });
});

// ===========================================================================
// Group 3: SPI Peripheral Tests
// ===========================================================================

describe('SPI Peripheral Tests', () => {
  it('SPI transfer sends and receives bytes simultaneously', () => {
    const sim = new GPIOSimulator(8);
    sim.configureSPI({ clockHz: 1_000_000, mode: 0 });
    sim.spiSlaveData([0xaa]);

    const miso = sim.spiTransfer([0x55]);
    expect(miso).toEqual([0xaa]);
  });

  it('SPI transfer multiple bytes', () => {
    const sim = new GPIOSimulator(8);
    sim.configureSPI({ clockHz: 1_000_000, mode: 0 });
    sim.spiSlaveData([0x01, 0x02, 0x03]);

    const miso = sim.spiTransfer([0xff, 0xff, 0xff]);
    expect(miso).toEqual([0x01, 0x02, 0x03]);
  });
});

// ===========================================================================
// Group 4: I2C Peripheral Tests
// ===========================================================================

describe('I2C Peripheral Tests', () => {
  it('I2C write to slave address gets ACK', () => {
    const sim = new GPIOSimulator(8);
    sim.configureI2C(100_000);
    sim.i2cSlaveRegisters(0x48, { 0: 0, 1: 0 });

    const result = sim.i2cWrite(0x48, [0x00, 0x42]);
    expect(result.ack).toBe(true);
  });

  it('I2C read from slave returns register data', () => {
    const sim = new GPIOSimulator(8);
    sim.configureI2C(100_000);
    sim.i2cSlaveRegisters(0x48, { 0: 0x1a, 1: 0x2b });

    // Set register pointer to 0
    sim.i2cWrite(0x48, [0x00]);
    // Read 2 bytes starting at register 0
    const result = sim.i2cRead(0x48, 2);
    expect(result.data).toEqual([0x1a, 0x2b]);
    expect(result.ack).toBe(true);
  });

  it('I2C write to non-existent address gets NACK', () => {
    const sim = new GPIOSimulator(8);
    sim.configureI2C(100_000);

    const result = sim.i2cWrite(0x77, [0x00]);
    expect(result.ack).toBe(false);
  });
});

// ===========================================================================
// Group 5: PWM Peripheral Tests
// ===========================================================================

describe('PWM Peripheral Tests', () => {
  it('PWM generates correct duty cycle', () => {
    const sim = new GPIOSimulator(20);
    sim.configurePWM(5, { frequencyHz: 1000, dutyCycle: 0.75 });

    const cycles = sim.generatePWM(5, 1);
    // Period = 1e6 / 1000 = 1000us. High = 750us, Low = 250us.
    expect(cycles).toHaveLength(1);
    expect(cycles[0].high).toBe(750);
    expect(cycles[0].low).toBe(250);
  });

  it('PWM 50% duty cycle produces square wave', () => {
    const sim = new GPIOSimulator(20);
    sim.configurePWM(5, { frequencyHz: 500, dutyCycle: 0.5 });

    const cycles = sim.generatePWM(5, 1);
    // Period = 1e6 / 500 = 2000us. High = 1000us, Low = 1000us.
    expect(cycles).toHaveLength(1);
    expect(cycles[0].high).toBe(1000);
    expect(cycles[0].low).toBe(1000);
  });

  it('PWM 0% and 100% edge cases', () => {
    const sim = new GPIOSimulator(20);

    // 0% duty
    sim.configurePWM(5, { frequencyHz: 1000, dutyCycle: 0.0 });
    const zeroCycles = sim.generatePWM(5, 1);
    expect(zeroCycles[0].high).toBe(0);
    expect(zeroCycles[0].low).toBe(1000);

    // 100% duty
    sim.configurePWM(5, { frequencyHz: 1000, dutyCycle: 1.0 });
    const fullCycles = sim.generatePWM(5, 1);
    expect(fullCycles[0].high).toBe(1000);
    expect(fullCycles[0].low).toBe(0);
  });
});

// ===========================================================================
// Group 6: ADC Peripheral Tests
// ===========================================================================

describe('ADC Peripheral Tests', () => {
  it('ADC converts midscale voltage correctly', () => {
    const sim = new GPIOSimulator(8);
    sim.configureADC({ resolutionBits: 10, vRef: 3.3 });
    sim.setAnalogVoltage(0, 1.65);

    const code = sim.analogRead(0);
    // Midscale for 10-bit: 512 (+/- 1)
    expect(Math.abs(code - 512)).toBeLessThanOrEqual(1);
  });

  it('ADC clamps to 0 and max code', () => {
    const sim = new GPIOSimulator(8);
    sim.configureADC({ resolutionBits: 10, vRef: 3.3 });

    sim.setAnalogVoltage(0, 0);
    expect(sim.analogRead(0)).toBe(0);

    sim.setAnalogVoltage(0, 3.3);
    expect(sim.analogRead(0)).toBe(1023);
  });

  it('ADC voltage-to-code conversion is accurate', () => {
    const sim = new GPIOSimulator(8);
    sim.configureADC({ resolutionBits: 10, vRef: 3.3 });
    sim.setAnalogVoltage(0, 1.0);

    const code = sim.analogRead(0);
    // Expected: round(1.0 / 3.3 * 1024) = 310
    expect(Math.abs(code - 310)).toBeLessThanOrEqual(1);
  });
});

// ===========================================================================
// Group 7: Timer/Counter and Interrupt Tests
// ===========================================================================

describe('Timer/Counter Tests', () => {
  it('timer counts up and overflows at period', () => {
    const sim = new GPIOSimulator(8);
    sim.configureTimer({ prescaler: 1, period: 256, clockHz: 16e6 });

    const r1 = sim.timerTick(255);
    expect(r1.count).toBe(255);
    expect(r1.overflowed).toBe(false);

    const r2 = sim.timerTick(1);
    expect(r2.count).toBe(0);
    expect(r2.overflowed).toBe(true);
  });

  it('timer prescaler divides clock', () => {
    const sim = new GPIOSimulator(8);
    sim.configureTimer({ prescaler: 8, period: 100, clockHz: 16e6 });

    const r = sim.timerTick(8);
    // 8 ticks / prescaler 8 = 1 timer increment
    expect(r.count).toBe(1);
  });
});

describe('Interrupt Tests', () => {
  it('interrupt handler fires on trigger', () => {
    const sim = new GPIOSimulator(8);
    let fired = false;
    sim.onInterrupt('pin-change', () => {
      fired = true;
    });
    sim.triggerInterrupt('pin-change');
    expect(fired).toBe(true);
  });

  it('timer overflow triggers interrupt', () => {
    const sim = new GPIOSimulator(8);
    sim.configureTimer({ prescaler: 1, period: 256, clockHz: 16e6 });

    let overflowCount = 0;
    sim.onInterrupt('timer-overflow', () => {
      overflowCount++;
    });

    sim.timerTick(256);
    expect(overflowCount).toBe(1);

    sim.timerTick(256);
    expect(overflowCount).toBe(2);
  });
});
