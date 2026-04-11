# Module 11: Microcontrollers -- Assessment

> **Tier**: 4 | **H&H Reference**: Ch.14-15 | **Passing Score**: 0.7

## Question 1: Serial Protocol Selection

**Conceptual** -- Explain the difference between UART, SPI, and I2C. When would you choose each protocol for a new design?

Consider: number of wires, speed, number of devices, duplex capability, and typical use cases.

## Question 2: Timer Overflow Frequency

**Calculation** -- A timer runs at a base clock of 16 MHz. The prescaler is set to 64 and the timer period (reload value) is 250.

What is the overflow frequency of this timer? Show your work.

## Question 3: Floating GPIO Input

**Analysis** -- Your GPIO input pin is reading random high and low values. The pin is connected to a momentary pushbutton that connects the pin to ground when pressed. When released, the pin is not connected to anything.

What is wrong, and how do you fix it?

## Question 4: LED PWM Brightness

**Design** -- You need to dim an LED to 30% brightness using PWM. Your timer has 8-bit resolution, giving compare values from 0 to 255.

What compare value should you set? Show your calculation.

## Question 5: I2C Temperature Decode

**Application** -- An I2C temperature sensor at address 0x48 stores its temperature reading in register 0x00 as a 16-bit value. The raw value is divided by 256 to get degrees Celsius.

You read register 0x00 and get the two bytes [0x19, 0x80]. What is the temperature in degrees Celsius?

---

## Answer Key

### Answer 1: Serial Protocol Selection

**UART**: Point-to-point, asynchronous (no shared clock), 2 wires (TX/RX), moderate speed (up to ~1 Mbaud). Choose for: debug consoles, GPS modules, Bluetooth modules, any two-device serial link where simplicity matters.

**SPI**: Synchronous, full-duplex, 4+ wires (SCLK, MOSI, MISO, CS per slave), very fast (MHz range). Choose for: high-speed peripherals like displays, SD cards, flash memory, and fast ADCs where data rate matters and pin count is not constrained.

**I2C**: Synchronous, half-duplex, 2 wires (SDA, SCL) shared among up to 127 devices, moderate speed (100 kHz - 1 MHz). Choose for: multi-device sensor networks, EEPROMs, RTCs, and I/O expanders where pin count is limited and speed is not critical.

### Answer 2: Timer Overflow Frequency

Timer tick frequency = base clock / prescaler = 16,000,000 / 64 = 250,000 Hz

Overflow frequency = tick frequency / period = 250,000 / 250 = **1000 Hz (1 kHz)**

The timer overflows 1000 times per second, suitable for generating a 1 ms periodic interrupt.

### Answer 3: Floating GPIO Input

**Problem**: The input pin is floating (not connected to any defined voltage) when the button is not pressed. A floating input picks up electromagnetic noise and reads random values.

**Fix**: Enable the internal pull-up resistor on the GPIO pin. This connects the pin to Vcc through a high-value resistor (typically 20-50 kohm). When the button is not pressed, the pin reads high (pulled up to Vcc). When pressed, the button connects the pin to ground, which overrides the weak pull-up and the pin reads low.

Alternative: Add an external pull-up resistor (10 kohm typical) between the pin and Vcc.

### Answer 4: LED PWM Brightness

Duty cycle for 30% brightness = 0.30

Compare value = duty_cycle * max_value = 0.30 * 255 = 76.5

Since the compare register is an integer, round to **76 or 77**.

Both are acceptable: 76/255 = 29.8% and 77/255 = 30.2%, both well within the perceptible resolution of human vision for LED brightness.

### Answer 5: I2C Temperature Decode

Raw bytes: [0x19, 0x80]

Combine into 16-bit value: 0x19 * 256 + 0x80 = 25 * 256 + 128 = 6528

Temperature = 6528 / 256 = **25.5 degrees C**

This encoding stores temperature as a fixed-point number with 8 integer bits and 8 fractional bits. The 0x19 (25) is the integer part, and 0x80 (128/256 = 0.5) is the fractional part, giving 25.5 degrees C.
