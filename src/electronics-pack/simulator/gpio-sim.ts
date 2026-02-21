/**
 * GPIO Simulator Engine
 *
 * Pin-level I/O modeling with UART, SPI, I2C, PWM, ADC, timer/counter,
 * and interrupt peripherals for Module 11 microcontroller labs.
 *
 * Phase 274 Plan 01.
 */

// ===========================================================================
// Types
// ===========================================================================

export type PinDirection = 'input' | 'output';
export type PinState = 'high' | 'low';
export type PullMode = 'none' | 'pullup' | 'pulldown';

export interface GPIOPin {
  direction: PinDirection;
  state: PinState;
  pull: PullMode;
  analogVoltage: number;
  externalDrive: PinState | null;
  pwmConfig: PWMConfig | null;
}

export interface UARTConfig {
  baudRate: number;
  dataBits: number;
  stopBits: number;
}

export interface SPIConfig {
  clockHz: number;
  mode: 0 | 1 | 2 | 3;
}

export interface I2CTransaction {
  address: number;
  data: number[];
  ack: boolean;
}

export interface PWMConfig {
  frequencyHz: number;
  dutyCycle: number;
}

export interface ADCConfig {
  resolutionBits: number;
  vRef: number;
}

export interface TimerConfig {
  prescaler: number;
  period: number;
  clockHz: number;
}

export type InterruptHandler = (source: string) => void;

// ===========================================================================
// Internal state types
// ===========================================================================

interface I2CSlaveState {
  registers: Record<number, number>;
  registerPointer: number;
}

// ===========================================================================
// GPIOSimulator
// ===========================================================================

/**
 * MCU peripheral simulator providing GPIO pins, UART, SPI, I2C,
 * PWM, ADC, timer/counter, and interrupt dispatch.
 *
 * Follows the established pattern: pure functional internals exposed
 * through a class wrapper (like MNAEngine and LogicSimulator).
 */
export class GPIOSimulator {
  private pins: GPIOPin[];

  // UART state
  private uartConfig: UARTConfig | null = null;

  // SPI state
  private spiConfig: SPIConfig | null = null;
  private spiSlaveBuffer: number[] = [];

  // I2C state
  private i2cSpeedHz = 0;
  private i2cSlaves: Map<number, I2CSlaveState> = new Map();

  // ADC state
  private adcConfig: ADCConfig | null = null;

  // Timer state
  private timerConfig: TimerConfig | null = null;
  private timerCount = 0;
  private timerPrescalerAccumulator = 0;

  // Interrupt handlers
  private interruptHandlers: Map<string, InterruptHandler> = new Map();

  /**
   * Create a GPIO simulator with the specified number of pins.
   * All pins start in input mode, state low, pull none.
   */
  constructor(pinCount: number) {
    this.pins = [];
    for (let i = 0; i < pinCount; i++) {
      this.pins.push({
        direction: 'input',
        state: 'low',
        pull: 'none',
        analogVoltage: 0,
        externalDrive: null,
        pwmConfig: null,
      });
    }
  }

  // =========================================================================
  // GPIO Pin Operations
  // =========================================================================

  /**
   * Set pin direction. When switching to output, state defaults to low.
   */
  pinMode(pin: number, direction: PinDirection): void {
    this.validatePin(pin);
    this.pins[pin].direction = direction;
    if (direction === 'output') {
      this.pins[pin].state = 'low';
    }
  }

  /**
   * Set output pin state. Only valid for output pins.
   */
  digitalWrite(pin: number, state: PinState): void {
    this.validatePin(pin);
    this.pins[pin].state = state;
  }

  /**
   * Read pin state. For input pins with no external drive, returns
   * pull-based state (pullup=high, pulldown/none=low). If external
   * drive is set, returns that value.
   */
  digitalRead(pin: number): PinState {
    this.validatePin(pin);
    const p = this.pins[pin];

    if (p.direction === 'output') {
      return p.state;
    }

    // Input pin: external drive overrides pull
    if (p.externalDrive !== null) {
      return p.externalDrive;
    }

    // No external drive: use pull mode
    if (p.pull === 'pullup') {
      return 'high';
    }
    return 'low'; // pulldown or none
  }

  /**
   * Set pull-up or pull-down resistor on a pin.
   */
  setPull(pin: number, mode: PullMode): void {
    this.validatePin(pin);
    this.pins[pin].pull = mode;
  }

  /**
   * Simulate an external device driving the pin.
   * Overrides pull resistor for input pins.
   */
  externalDrive(pin: number, state: PinState): void {
    this.validatePin(pin);
    this.pins[pin].externalDrive = state;
  }

  /**
   * Return a copy of pin state for inspection.
   */
  getPin(pin: number): GPIOPin {
    this.validatePin(pin);
    return { ...this.pins[pin] };
  }

  // =========================================================================
  // UART Peripheral
  // =========================================================================

  /**
   * Configure UART peripheral.
   */
  configureUART(config: UARTConfig): void {
    this.uartConfig = { ...config };
  }

  /**
   * Transmit byte array as UART frames.
   * Each byte produces: start bit (0), 8 data bits LSB-first, stop bit (1).
   * Returns flat array of bit values.
   */
  uartTransmit(data: number[]): number[] {
    const bits: number[] = [];

    for (const byte of data) {
      // Start bit
      bits.push(0);

      // Data bits LSB-first
      for (let i = 0; i < 8; i++) {
        bits.push((byte >> i) & 1);
      }

      // Stop bit
      bits.push(1);
    }

    return bits;
  }

  /**
   * Receive a bitstream and decode to bytes.
   * Parses frames: start bit (0), 8 data bits LSB-first, stop bit (1).
   */
  uartReceive(bits: number[]): number[] {
    const bytes: number[] = [];
    let i = 0;

    while (i + 9 < bits.length) {
      // Expect start bit = 0
      if (bits[i] !== 0) {
        i++;
        continue;
      }
      i++; // skip start bit

      // Read 8 data bits LSB-first
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (bits[i + bit]) {
          byte |= 1 << bit;
        }
      }
      i += 8;

      // Skip stop bit
      i++;

      bytes.push(byte);
    }

    return bytes;
  }

  // =========================================================================
  // SPI Peripheral
  // =========================================================================

  /**
   * Configure SPI peripheral.
   */
  configureSPI(config: SPIConfig): void {
    this.spiConfig = { ...config };
  }

  /**
   * Set data the SPI slave will send on MISO.
   */
  spiSlaveData(misoData: number[]): void {
    this.spiSlaveBuffer = [...misoData];
  }

  /**
   * Full-duplex SPI transfer. Sends MOSI data, returns MISO data.
   * If slave buffer is exhausted, returns 0xFF for remaining bytes.
   */
  spiTransfer(mosiData: number[]): number[] {
    const misoResult: number[] = [];

    for (let i = 0; i < mosiData.length; i++) {
      if (i < this.spiSlaveBuffer.length) {
        misoResult.push(this.spiSlaveBuffer[i]);
      } else {
        misoResult.push(0xff);
      }
    }

    return misoResult;
  }

  // =========================================================================
  // I2C Peripheral
  // =========================================================================

  /**
   * Configure I2C bus speed.
   */
  configureI2C(speedHz: number): void {
    this.i2cSpeedHz = speedHz;
  }

  /**
   * Register a slave device with a register map.
   */
  i2cSlaveRegisters(address: number, registers: Record<number, number>): void {
    this.i2cSlaves.set(address, {
      registers: { ...registers },
      registerPointer: 0,
    });
  }

  /**
   * Write data to I2C slave. First byte is register address,
   * remaining bytes are values written starting at that register.
   * Returns { ack: true } if slave exists, { ack: false } otherwise.
   */
  i2cWrite(address: number, data: number[]): { ack: boolean } {
    const slave = this.i2cSlaves.get(address);
    if (!slave) {
      return { ack: false };
    }

    if (data.length === 0) {
      return { ack: true };
    }

    // First byte is register pointer
    slave.registerPointer = data[0];

    // Remaining bytes are values written to consecutive registers
    for (let i = 1; i < data.length; i++) {
      slave.registers[slave.registerPointer + (i - 1)] = data[i];
    }

    return { ack: true };
  }

  /**
   * Read numBytes from I2C slave starting at current register pointer.
   * Returns { data, ack: true } if slave exists, { data: [], ack: false } otherwise.
   */
  i2cRead(
    address: number,
    numBytes: number,
  ): { data: number[]; ack: boolean } {
    const slave = this.i2cSlaves.get(address);
    if (!slave) {
      return { data: [], ack: false };
    }

    const result: number[] = [];
    for (let i = 0; i < numBytes; i++) {
      const reg = slave.registerPointer + i;
      result.push(slave.registers[reg] ?? 0);
    }

    return { data: result, ack: true };
  }

  // =========================================================================
  // PWM Peripheral
  // =========================================================================

  /**
   * Configure PWM on a pin.
   */
  configurePWM(pin: number, config: PWMConfig): void {
    this.validatePin(pin);
    this.pins[pin].pwmConfig = { ...config };
  }

  /**
   * Generate PWM waveform cycles.
   * Returns array of { high, low } pairs in microseconds.
   */
  generatePWM(
    pin: number,
    numCycles: number,
  ): { high: number; low: number }[] {
    this.validatePin(pin);
    const config = this.pins[pin].pwmConfig;
    if (!config) {
      throw new Error(`PWM not configured on pin ${pin}`);
    }

    const periodUs = 1e6 / config.frequencyHz;
    const highUs = periodUs * config.dutyCycle;
    const lowUs = periodUs - highUs;

    const cycles: { high: number; low: number }[] = [];
    for (let i = 0; i < numCycles; i++) {
      cycles.push({ high: highUs, low: lowUs });
    }

    return cycles;
  }

  // =========================================================================
  // ADC Peripheral
  // =========================================================================

  /**
   * Configure ADC resolution and reference voltage.
   */
  configureADC(config: ADCConfig): void {
    this.adcConfig = { ...config };
  }

  /**
   * Set the analog voltage on a pin (for ADC reads).
   */
  setAnalogVoltage(pin: number, voltage: number): void {
    this.validatePin(pin);
    this.pins[pin].analogVoltage = voltage;
  }

  /**
   * Read analog voltage from pin and convert to digital code.
   * Clamps input to [0, vRef] and output to [0, 2^bits - 1].
   */
  analogRead(pin: number): number {
    this.validatePin(pin);
    if (!this.adcConfig) {
      throw new Error('ADC not configured');
    }

    const { resolutionBits, vRef } = this.adcConfig;
    const voltage = this.pins[pin].analogVoltage;

    // Clamp voltage to [0, vRef]
    const clamped = Math.max(0, Math.min(vRef, voltage));

    // Convert to digital code
    const levels = Math.pow(2, resolutionBits);
    let code = Math.round((clamped / vRef) * levels);

    // Clamp code to valid range [0, 2^bits - 1]
    code = Math.max(0, Math.min(levels - 1, code));

    return code;
  }

  // =========================================================================
  // Timer/Counter
  // =========================================================================

  /**
   * Configure timer with prescaler, period, and clock frequency.
   */
  configureTimer(config: TimerConfig): void {
    this.timerConfig = { ...config };
    this.timerCount = 0;
    this.timerPrescalerAccumulator = 0;
  }

  /**
   * Advance timer by numTicks raw clock ticks.
   * Prescaler divides ticks into timer increments.
   * Overflow wraps at period and fires timer-overflow interrupt if registered.
   */
  timerTick(numTicks: number): { count: number; overflowed: boolean } {
    if (!this.timerConfig) {
      throw new Error('Timer not configured');
    }

    const { prescaler, period } = this.timerConfig;

    // Accumulate ticks through prescaler
    this.timerPrescalerAccumulator += numTicks;
    const increments = Math.floor(this.timerPrescalerAccumulator / prescaler);
    this.timerPrescalerAccumulator %= prescaler;

    // Apply increments to counter
    this.timerCount += increments;

    let overflowed = false;
    if (this.timerCount >= period) {
      overflowed = true;
      this.timerCount = this.timerCount % period;

      // Fire timer-overflow interrupt
      const handler = this.interruptHandlers.get('timer-overflow');
      if (handler) {
        handler('timer-overflow');
      }
    }

    return { count: this.timerCount, overflowed };
  }

  // =========================================================================
  // Interrupts
  // =========================================================================

  /**
   * Register an interrupt handler for a named source.
   */
  onInterrupt(source: string, handler: InterruptHandler): void {
    this.interruptHandlers.set(source, handler);
  }

  /**
   * Trigger an interrupt by source name.
   * Calls the registered handler if one exists.
   */
  triggerInterrupt(source: string): void {
    const handler = this.interruptHandlers.get(source);
    if (handler) {
      handler(source);
    }
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private validatePin(pin: number): void {
    if (pin < 0 || pin >= this.pins.length) {
      throw new Error(
        `Pin ${pin} out of range (0-${this.pins.length - 1})`,
      );
    }
  }
}
