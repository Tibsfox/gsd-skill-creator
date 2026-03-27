/**
 * Module 11: Microcontrollers -- Lab exercises
 *
 * 5 labs backed by the GPIO simulator demonstrating MCU peripheral concepts:
 * blink LED, serial communication, ADC reading, PWM motor control, I2C sensor.
 *
 * Phase 274 Plan 02.
 */

import { GPIOSimulator } from '../../simulator/gpio-sim.js';

export interface LabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface Lab {
  id: string;
  title: string;
  steps: LabStep[];
  verify: () => boolean;
}

// ============================================================================
// Lab 1: Blink (m11-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm11-lab-01',
  title: 'Blink',
  steps: [
    {
      instruction:
        'Create a GPIOSimulator with 20 pins. Set pin 13 as a digital output using pinMode(13, "output"). This is the "Hello World" of embedded programming -- pin 13 is the on-board LED on most Arduino boards.',
      expected_observation:
        'Pin 13 is now configured as an output. Its initial state is low (LED off). The pin direction register has been set to "output" mode.',
      learn_note:
        'Every GPIO pin on a microcontroller must be configured before use. The direction register determines whether the pin is reading external signals (input) or driving a voltage (output). Forgetting to set the direction is a classic beginner mistake. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Write a HIGH value to pin 13 with digitalWrite(13, "high"), then read it back with digitalRead(13). This turns the LED on by sourcing current through the pin to Vcc.',
      expected_observation:
        'digitalRead returns "high". The pin is now driving 3.3V (or 5V depending on the MCU), which lights the LED through its current-limiting resistor.',
      learn_note:
        'digitalWrite sets the output data register. The pin driver then connects the pin to Vcc (high) or GND (low). Current flows through the LED when the pin is high. Most MCU pins can source/sink 10-20mA. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Now write LOW to pin 13 with digitalWrite(13, "low") and verify it reads back "low". Toggle between HIGH and LOW 5 times to create the classic blink pattern.',
      expected_observation:
        'Each toggle changes the LED state: high (on) -> low (off) -> high (on) and so on. After 5 complete high-low cycles, the final state depends on where the loop ends.',
      learn_note:
        'The blink program demonstrates the fundamental embedded loop: read inputs, make decisions, drive outputs, repeat. Real blink programs add delay() calls between toggles so the human eye can see the LED flash. Without delay, the pin toggles at MHz speeds. -- H&H Ch.14-15',
    },
  ],
  verify: () => {
    const sim = new GPIOSimulator(20);
    sim.pinMode(13, 'output');

    // Toggle pin 13 high/low for 5 cycles and verify each state
    for (let i = 0; i < 5; i++) {
      sim.digitalWrite(13, 'high');
      if (sim.digitalRead(13) !== 'high') return false;

      sim.digitalWrite(13, 'low');
      if (sim.digitalRead(13) !== 'low') return false;
    }

    return true;
  },
};

// ============================================================================
// Lab 2: Serial Communication (m11-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm11-lab-02',
  title: 'Serial Communication',
  steps: [
    {
      instruction:
        'Create a GPIOSimulator and configure UART at 9600 baud, 8 data bits, 1 stop bit. This is the most common serial configuration, often written as "9600 8N1" (8 data bits, No parity, 1 stop bit).',
      expected_observation:
        'UART peripheral is configured. The baud rate clock divider is set so each bit period is 1/9600 = 104.17 microseconds.',
      learn_note:
        'UART is asynchronous serial: there is no shared clock between sender and receiver. Both sides must agree on the baud rate beforehand. If the rates differ by more than ~3%, communication fails. 9600 baud is slow but reliable; 115200 is common for debug consoles. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Transmit the ASCII string "HELLO" as bytes [0x48, 0x45, 0x4C, 0x4C, 0x4F]. Each byte is framed as: 1 start bit (0), 8 data bits (LSB first), 1 stop bit (1) = 10 bits per byte.',
      expected_observation:
        'The transmitter produces 50 bits total (5 bytes * 10 bits/frame). Each frame begins with a 0 (start bit) and ends with a 1 (stop bit). The data bits are sent least-significant bit first.',
      learn_note:
        'The start bit (always 0) signals the receiver that a byte is coming. The receiver then samples the next 8 bits at the agreed baud rate. The stop bit (always 1) provides a guaranteed idle period. LSB-first ordering is a historical convention from teletype machines. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Feed the transmitted bitstream back into the UART receiver. Decode the frames and verify the received bytes match the original [0x48, 0x45, 0x4C, 0x4C, 0x4F].',
      expected_observation:
        'The receiver successfully decodes all 5 bytes. "HELLO" round-trips through the UART transmit/receive path without errors. Frame count = 5, total bits = 50.',
      learn_note:
        'In a real system, the TX pin of one device connects to the RX pin of another (and vice versa for bidirectional). Errors occur from baud rate mismatch, noise, or buffer overflow. Real UARTs have FIFOs and interrupts to prevent data loss. -- H&H Ch.14-15',
    },
  ],
  verify: () => {
    const sim = new GPIOSimulator(20);
    sim.configureUART({ baudRate: 9600, dataBits: 8, stopBits: 1 });

    const helloBytes = [0x48, 0x45, 0x4c, 0x4c, 0x4f]; // H E L L O
    const bits = sim.uartTransmit(helloBytes);

    // Check frame length: 5 bytes * 10 bits = 50
    if (bits.length !== 50) return false;

    // Receive the bits back
    const decoded = sim.uartReceive(bits);

    // Verify round-trip
    if (decoded.length !== helloBytes.length) return false;
    for (let i = 0; i < helloBytes.length; i++) {
      if (decoded[i] !== helloBytes[i]) return false;
    }

    return true;
  },
};

// ============================================================================
// Lab 3: ADC Reading (m11-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm11-lab-03',
  title: 'ADC Reading',
  steps: [
    {
      instruction:
        'Create a GPIOSimulator and configure a 10-bit ADC with 3.3V reference voltage. A 10-bit ADC produces digital codes from 0 to 1023, with each step representing 3.3V / 1024 = 3.22 mV.',
      expected_observation:
        'ADC peripheral is configured with 1024 quantization levels. The reference voltage sets the full-scale range: 0V maps to code 0, 3.3V maps to code 1023.',
      learn_note:
        'Most microcontrollers have a built-in SAR ADC with 10-12 bit resolution. The reference voltage (Vref) determines the measurement range. Using a stable, low-noise Vref is critical for accurate readings. Internal Vref is convenient but external is more precise. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Set the analog voltage on pin 0 to 0V and read the ADC code. Then set it to 1.65V (midscale) and read again. Finally set to 3.3V (full scale) and read.',
      expected_observation:
        '0V reads as code 0. 1.65V (exactly half of Vref) reads as approximately 512 (midscale). 3.3V reads as 1023 (full scale, the maximum code for a 10-bit ADC).',
      learn_note:
        'The ADC transfer function is: code = round(V_in / V_ref * 2^N). Midscale is the quickest sanity check. If midscale reads wrong, the reference or the ADC configuration is off. The code can never reach 2^N (1024 for 10-bit); the maximum is 2^N - 1 = 1023. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Verify the codes are within +/- 1 count of the expected values. This accounts for normal quantization rounding. Calculate the actual voltage each code represents: V = code * Vref / 1024.',
      expected_observation:
        'Code 0 -> 0V (exact). Code 512 -> 1.65V (exact midscale). Code 1023 -> 3.2968V (one LSB below Vref). All within the +/- 1 count tolerance.',
      learn_note:
        'The +/- 0.5 LSB quantization error is inherent in all ADCs. Real ADCs also have offset error, gain error, and nonlinearity that add to the total uncertainty. Averaging multiple samples (oversampling) reduces random noise by sqrt(N). -- H&H Ch.14-15',
    },
  ],
  verify: () => {
    const sim = new GPIOSimulator(20);
    sim.configureADC({ resolutionBits: 10, vRef: 3.3 });

    // Test 0V -> code 0
    sim.setAnalogVoltage(0, 0);
    const code0 = sim.analogRead(0);
    if (code0 !== 0) return false;

    // Test 1.65V -> ~512 (midscale)
    sim.setAnalogVoltage(0, 1.65);
    const codeMid = sim.analogRead(0);
    if (Math.abs(codeMid - 512) > 1) return false;

    // Test 3.3V -> 1023 (full scale)
    sim.setAnalogVoltage(0, 3.3);
    const codeFull = sim.analogRead(0);
    if (codeFull !== 1023) return false;

    return true;
  },
};

// ============================================================================
// Lab 4: PWM Motor Control (m11-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm11-lab-04',
  title: 'PWM Motor Control',
  steps: [
    {
      instruction:
        'Create a GPIOSimulator and configure PWM on pin 5 at 1000 Hz (1 kHz). This gives a period of 1000 microseconds. PWM controls motor speed by rapidly switching the power on and off.',
      expected_observation:
        'PWM peripheral is configured on pin 5. The base frequency of 1 kHz means each cycle is 1 millisecond (1000 us). The duty cycle determines what fraction of each cycle the pin is high.',
      learn_note:
        'PWM (Pulse Width Modulation) simulates an analog output using digital switching. A motor responds to the average voltage: 50% duty cycle at 12V delivers an effective 6V to the motor. The PWM frequency must be high enough that the motor/load integrates the pulses smoothly. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Generate PWM cycles at 5 duty cycle levels: 0% (motor off), 25% (quarter speed), 50% (half speed), 75% (three-quarter speed), 100% (full speed). For each, generate 1 cycle and examine the high/low times.',
      expected_observation:
        '0% duty: 0us high, 1000us low. 25% duty: 250us high, 750us low. 50% duty: 500us high, 500us low. 75% duty: 750us high, 250us low. 100% duty: 1000us high, 0us low.',
      learn_note:
        'The duty cycle directly controls the average output voltage: V_avg = V_supply * duty_cycle. At 25%, the motor gets 25% of the supply voltage on average. Hardware timers generate PWM automatically -- the CPU just sets the compare value and the timer handles the toggling. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Verify the timing precision. At 1 kHz, the period should be exactly 1000 us. Check that high_time + low_time = 1000 us for every duty cycle setting.',
      expected_observation:
        'All duty cycles produce cycles where high + low = 1000 us exactly. The timer hardware ensures precise timing regardless of what the CPU is doing -- this is why hardware PWM is preferred over software bit-banging.',
      learn_note:
        'PWM resolution depends on the timer: an 8-bit timer gives 256 duty cycle levels (0.39% steps), while a 16-bit timer gives 65536 levels. Higher PWM frequency reduces audible motor whine but also reduces resolution. The tradeoff is: resolution = timer_clock / (PWM_frequency * prescaler). -- H&H Ch.14-15',
    },
  ],
  verify: () => {
    const sim = new GPIOSimulator(20);
    const dutyCycles = [0.0, 0.25, 0.5, 0.75, 1.0];
    const expectedHigh = [0, 250, 500, 750, 1000];
    const expectedLow = [1000, 750, 500, 250, 0];

    for (let i = 0; i < dutyCycles.length; i++) {
      sim.configurePWM(5, { frequencyHz: 1000, dutyCycle: dutyCycles[i] });
      const cycles = sim.generatePWM(5, 1);

      if (cycles.length !== 1) return false;
      if (cycles[0].high !== expectedHigh[i]) return false;
      if (cycles[0].low !== expectedLow[i]) return false;
    }

    return true;
  },
};

// ============================================================================
// Lab 5: I2C Sensor Network (m11-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm11-lab-05',
  title: 'I2C Sensor Network',
  steps: [
    {
      instruction:
        'Create a GPIOSimulator and configure I2C at 100 kHz (standard mode). Register a simulated temperature sensor at address 0x48 with registers { 0: 0x19, 1: 0x80 }. This represents a 16-bit temperature value of 0x1980 = 25.5 degrees C.',
      expected_observation:
        'I2C bus is configured at standard speed. The slave device at address 0x48 is registered with its internal register map. The I2C controller is ready to perform addressed transactions.',
      learn_note:
        'I2C uses just two wires (SDA for data, SCL for clock) to connect up to 127 devices. Each device has a unique 7-bit address. The master initiates all transfers. Address 0x48 is the default for many temperature sensors (TMP102, LM75). -- H&H Ch.14-15',
    },
    {
      instruction:
        'Write register pointer [0x00] to the sensor to select the temperature register. Then read 2 bytes from the sensor. The I2C protocol: write sets the register pointer, subsequent reads return data starting from that pointer.',
      expected_observation:
        'Write to 0x48 with data [0x00] returns ack=true (device acknowledged). Read of 2 bytes returns [0x19, 0x80] with ack=true. These are the MSB and LSB of the temperature register.',
      learn_note:
        'Most I2C sensors use a register-pointer model: write the register address first, then read the data. The pointer auto-increments so you can read multiple consecutive registers in one transaction. This is why i2cWrite with just [regAddr] is so common. -- H&H Ch.14-15',
    },
    {
      instruction:
        'Attempt to read from address 0x77 (no device registered). The I2C bus should return NACK (no acknowledgment). Decode the temperature from [0x19, 0x80]: combine as 0x1980 = 6528, then 6528 / 256 = 25.5 degrees C.',
      expected_observation:
        'Read from 0x77 returns ack=false and empty data -- the bus detected no device at that address. Temperature calculation: 0x19*256 + 0x80 = 6528, divided by 256 gives 25.5 degrees C.',
      learn_note:
        'NACK is a critical bus signal: it tells the master that no slave responded. A real I2C scanner tries every address (0x00-0x7F) and records which ones ACK -- this is how you discover what devices are connected. Always check the ACK bit before using received data. -- H&H Ch.14-15',
    },
  ],
  verify: () => {
    const sim = new GPIOSimulator(20);
    sim.configureI2C(100000);
    sim.i2cSlaveRegisters(0x48, { 0: 0x19, 1: 0x80 });

    // Write register pointer to 0x00
    const writeResult = sim.i2cWrite(0x48, [0x00]);
    if (!writeResult.ack) return false;

    // Read 2 bytes
    const readResult = sim.i2cRead(0x48, 2);
    if (!readResult.ack) return false;
    if (readResult.data[0] !== 0x19) return false;
    if (readResult.data[1] !== 0x80) return false;

    // NACK for non-existent address
    const nackResult = sim.i2cRead(0x77, 1);
    if (nackResult.ack !== false) return false;

    // Decode temperature: 0x1980 = 6528, / 256 = 25.5 degrees C
    const tempRaw = (readResult.data[0] << 8) | readResult.data[1];
    const tempC = tempRaw / 256;
    if (Math.abs(tempC - 25.5) > 0.01) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
