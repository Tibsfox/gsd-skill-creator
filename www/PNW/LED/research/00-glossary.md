# LED Lighting & Controllers Glossary

A comprehensive reference of technical terms used throughout this LED research series. Each term links to the page where it is explained in greatest detail.

---

## A

**ADC (Analog-to-Digital Converter)** — Converts a continuous analog voltage into a discrete digital number. Resolution is measured in bits: a 12-bit ADC produces 4,096 levels. The ESP32 has a 12-bit ADC with ~9-10 effective bits due to nonlinearity. See [Nyquist-Shannon Sampling](m7-nyquist-sampling.md).

**Anti-aliasing** — An analog low-pass filter placed before an ADC to remove frequency components above the Nyquist frequency, preventing aliasing artifacts. Without this filter, high-frequency signals fold back into the sampled data as false low-frequency ghosts. See [Nyquist-Shannon Sampling](m7-nyquist-sampling.md).

**APA102** — A clock-driven addressable LED (also sold as DotStar by Adafruit) that uses a two-wire SPI interface. Unlike the WS2812B, it has no timing constraints, supports clock speeds up to 24 MHz, and includes a 5-bit global brightness register for superior low-brightness performance. See [APA102 SPI Protocol](m3-apa102-spi.md).

## B

**Bandwidth** — The frequency at which an oscilloscope's response drops to -3 dB (70.7% of true amplitude). The 5x rule recommends choosing a scope with bandwidth at least 5 times the highest frequency component of the measured signal. See [Oscilloscope Fundamentals](m7-oscilloscope-basics.md).

**Breadboard** — A solderless prototyping board with spring-loaded clips that accept component leads and jumper wires. Used for quickly assembling and testing LED circuits before committing to a PCB or permanent wiring. See [Arduino LED Control](m2-arduino-led-control.md).

## C

**CCT (Correlated Color Temperature)** — A measure of a white light source's warmth or coolness, expressed in Kelvin. Warm white is ~2700K (amber tone), cool white is ~6500K (blue-white). In the Hue API, CCT is specified in mirek (reciprocal megakelvin). See [Philips Hue CLIP API](m4-philips-hue-api.md).

**CCP Module (Capture/Compare/PWM)** — A peripheral on PIC microcontrollers that generates hardware PWM signals. The CCP module uses Timer2 as its timebase and provides 10-bit duty cycle resolution. See [PIC Microcontroller & MPLAB XC8 PWM](m2-pic-xc8-pwm.md).

**CLIP API (Connected Lighting Interface Protocol)** — The HTTP REST API used by the Philips Hue bridge. CLIP v1 uses unencrypted HTTP on port 80; CLIP v2 uses HTTPS on port 443 with server-sent events for real-time updates. See [Philips Hue CLIP API](m4-philips-hue-api.md).

**COB LED (Chip-on-Board)** — An LED package that mounts many small dies directly onto a substrate in a dense array, covered with a single phosphor layer. Produces a uniform light source with very high lumen density, commonly used in track lighting and downlights. See [LED Electronics Fundamentals](m1-led-fundamentals.md).

**Constant-current driver** — A circuit that maintains a fixed current through an LED regardless of voltage variations, temperature changes, or LED aging. Superior to resistor-based current limiting for high-power LEDs because it eliminates thermal runaway risk. See [Constant-Current Drivers](m1-current-drivers.md).

**Cross-linking** — In the context of this research series, the practice of connecting related pages through hyperlinks. Each module page cross-references related topics to form a navigable knowledge graph. See [Glossary](00-glossary.md).

## D

**Darlington pair** — A compound transistor configuration that multiplies the gain of two bipolar transistors. While historically used for LED switching, MOSFETs have largely replaced Darlington pairs due to lower saturation voltage and zero gate current. See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

**Debouncing** — The process of filtering out the rapid on/off transitions (bounce) that occur when a mechanical switch or button is pressed. Implemented in hardware (RC filter) or software (timing delay) to produce a single clean edge. See [IR & RF Remote Control](m5-ir-rf-remote.md).

**Derating curve** — A graph showing how a component's maximum rated capacity decreases as temperature increases. For LEDs and MOSFETs, the derating curve defines how much current must be reduced at elevated ambient temperatures to prevent thermal damage. See [Thermal Management](m1-thermal-management.md).

**DMA (Direct Memory Access)** — A hardware subsystem that transfers data between memory and peripherals without CPU involvement. On the RP2040, DMA feeds pixel data from RAM to PIO state machines, enabling zero-CPU-overhead LED updates. See [RP2040 PIO](m2-rp2040-pio.md).

**DSO (Digital Storage Oscilloscope)** — The modern standard oscilloscope type. An ADC digitizes the input signal, stores samples in memory, and reconstructs the waveform on an LCD display. Provides automatic measurements, protocol decoding, and data export. See [Oscilloscope Fundamentals](m7-oscilloscope-basics.md).

**Duty cycle** — The percentage of time a PWM signal is in the HIGH state during one period. A 50% duty cycle means the signal is HIGH half the time. For LED dimming, duty cycle directly controls perceived brightness. See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

## E

**Edge trigger** — The most fundamental oscilloscope trigger mode. The scope begins capturing when the signal crosses a voltage threshold in a specified direction (rising or falling). Essential for stable display of repetitive waveforms like PWM. See [Oscilloscope Fundamentals](m7-oscilloscope-basics.md).

**ESP32** — A dual-core 240 MHz microcontroller with built-in WiFi and Bluetooth, 16-channel hardware PWM (LEDC), and 8-channel RMT peripheral. The dominant platform for WiFi-connected LED projects and the hardware basis for WLED firmware. See [ESP32 LED Control](m2-esp32-led.md).

**ESP8266** — A single-core 80-160 MHz WiFi microcontroller. Predecessor to the ESP32 with fewer GPIO pins, no hardware PWM, and limited SRAM (80 KB). Still used in legacy WLED installations but superseded by ESP32 for new projects. See [ESP32 LED Control](m2-esp32-led.md).

## F

**FastLED** — An open-source Arduino library that supports 50+ addressable LED chipsets with a unified API. Provides HSV color model, palette support, and math helpers for animation. More feature-rich than the NeoPixel library but with a steeper learning curve. See [LED Libraries](m3-led-libraries.md).

**Flicker fusion** — The critical flicker fusion frequency (CFF) is the threshold at which a flickering light source appears steady to the human eye. Ranges from 60-90 Hz for foveal vision under bright conditions. POV displays exploit this phenomenon. See [POV Physics](m6-pov-physics.md).

**Forward voltage (Vf)** — The voltage drop across an LED when current flows through it. Determined by the semiconductor bandgap: red LEDs drop ~2.0V, blue/white LEDs drop ~3.0-3.6V. The forward voltage decreases with rising temperature (~2mV/C). See [LED Electronics Fundamentals](m1-led-fundamentals.md).

**Freewheeling diode** — A diode placed across an inductive load (such as an LED strip with parasitic inductance) to clamp voltage spikes when the driving MOSFET turns off. The 1N5819 Schottky diode is the standard choice. See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

## G

**GPIO (General-Purpose Input/Output)** — Digital pins on a microcontroller that can be configured as inputs or outputs. GPIO pins drive LED data lines, read buttons and sensors, and generate PWM signals. Voltage levels are typically 3.3V or 5V. See [Raspberry Pi GPIO](m2-raspberry-pi-gpio.md).

**GRB order** — The byte order used by WS2812B LEDs: Green, Red, Blue. Data is transmitted MSB-first within each byte, with the green byte sent first. This is a hardware design decision by WorldSemi and is handled automatically by libraries like NeoPixel and FastLED. See [WS2812B Protocol](m3-ws2812b-protocol.md).

## H

**Hall effect sensor** — A sensor that detects magnetic fields. In POV displays, a Hall sensor on the spinning arm detects a fixed magnet on the frame to provide a once-per-revolution reference signal for angular position synchronization. See [POV Physics](m6-pov-physics.md).

**Heatsink** — A thermally conductive component (typically aluminum) attached to a heat-generating device to increase the surface area for convection cooling. Required for MOSFETs above ~5A and high-power LEDs above 1W. Thermal resistance is measured in C/W. See [Thermal Management](m1-thermal-management.md).

**HSV (Hue, Saturation, Value)** — A cylindrical color model where Hue is the color angle (0-360 degrees), Saturation is color purity (0-100%), and Value is brightness (0-100%). More intuitive for LED color mixing than RGB. FastLED provides native HSV support via the CHSV type. See [LED Libraries](m3-led-libraries.md).

**Hue bridge** — The central hardware device in the Philips Hue system. Contains a ZigBee coordinator radio and an HTTP/HTTPS web server. Translates REST API calls into ZigBee commands for up to 50 light devices. Can be emulated in software by diyHue. See [Philips Hue CLIP API](m4-philips-hue-api.md).

## I

**I-V curve** — A graph plotting current versus voltage for a device. LEDs have an exponential I-V curve (Shockley diode equation), meaning a small voltage increase above the forward voltage causes a massive current increase. This is why LEDs require current limiting. See [LED Electronics Fundamentals](m1-led-fundamentals.md).

**I2C (Inter-Integrated Circuit)** — A two-wire serial communication protocol using SDA (data) and SCL (clock) lines. Used to connect sensors like the TCS34725 color sensor and external ADCs like the ADS1115 to microcontrollers. Supports multiple devices on the same bus via addressing. See [TCS34725 Color Sensing](m4-tcs34725-sensing.md).

**IEC 61131-3** — The international standard defining five programming languages for PLCs: Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Instruction List (IL), and Sequential Function Chart (SFC). Ladder logic is the most widely used for LED indicator control. See [PLC Ladder Logic](m8-plc-ladder-logic.md).

**IRLZ44N** — A logic-level N-channel MOSFET commonly used for LED strip dimming. Key specs: V_DS max 55V, I_D max 47A, R_DS(on) 0.022 ohm at 5V gate drive, TO-220 package. Fully turns on with 5V logic; marginal at 3.3V. See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

## J

**Junction temperature (Tj)** — The temperature at the semiconductor die inside an LED or MOSFET package. The junction temperature determines LED lifespan, color shift, and efficiency. Maximum Tj is typically 150-175C; operating target is well below this. See [Thermal Management](m1-thermal-management.md).

## L

**Ladder logic** — A graphical PLC programming language that resembles electrical relay schematics. Programs consist of horizontal "rungs" between power rails, with contacts (inputs) and coils (outputs). The most widely used IEC 61131-3 language for discrete I/O control. See [PLC Ladder Logic](m8-plc-ladder-logic.md).

**LED strip** — A flexible PCB with surface-mount LEDs, resistors, and (for addressable types) controller ICs soldered at regular intervals. Available in 12V/24V analog (single-color, RGB, RGBW) and 5V addressable (WS2812B, APA102) variants. See [LED Electronics Fundamentals](m1-led-fundamentals.md).

**LEDC** — The LED Control peripheral on the ESP32. Provides 16 independent hardware PWM channels with configurable frequency (1 Hz to 40 MHz) and resolution (1 to 20 bits). Multiple channels can share a timer for synchronized frequency. See [ESP32 LED Control](m2-esp32-led.md).

**Level shifter** — A circuit that converts logic signals from one voltage to another. The 74HCT125 is the standard level shifter for converting 3.3V MCU outputs to the 5V logic required by WS2812B LEDs. See [WS2812B Protocol](m3-ws2812b-protocol.md).

**LM317** — A classic adjustable linear voltage regulator that can be configured as a simple constant-current source for LEDs using a single resistor (I = 1.25V / R). Limited to low-power applications due to linear power dissipation. See [Constant-Current Drivers](m1-current-drivers.md).

**Logic-level MOSFET** — A MOSFET designed to be fully enhanced (lowest R_DS(on)) with gate voltages of 3.3-5V, as produced by microcontrollers. Distinguished from standard MOSFETs that require 10V+ gate drive. The "L" in IRLZ44N indicates logic-level. See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

**Lux** — The SI unit of illuminance, measuring luminous flux per unit area (lumens per square meter). Used to quantify ambient light levels: 50 lux (dim room), 500 lux (office), 10,000+ lux (direct sunlight). The TCS34725 sensor measures lux via its clear channel. See [TCS34725 Color Sensing](m4-tcs34725-sensing.md).

## M

**MCU (Microcontroller Unit)** — A compact integrated circuit containing a processor, memory, and I/O peripherals on a single chip. The primary platforms for LED control include Arduino (ATmega328P), ESP32, RP2040, PIC, and Raspberry Pi. See [MCU Comparison](m2-mcu-comparison.md).

**Mirek** — Reciprocal megakelvin, the unit used by the Philips Hue API for color temperature. Conversion: Kelvin = 1,000,000 / mirek. The Hue range is 153 mirek (6536K cool daylight) to 500 mirek (2000K warm candlelight). See [Philips Hue CLIP API](m4-philips-hue-api.md).

**Modbus TCP** — An industrial communication protocol that runs over TCP/IP, enabling PLCs and microcontrollers to exchange data. Used in hybrid PLC + ESP32 architectures to pass machine state from the PLC to the ESP32 for smart LED status indication. See [Hybrid PLC + ESP32](m8-hybrid-plc-esp32.md).

**MOSFET (Metal-Oxide-Semiconductor Field-Effect Transistor)** — A voltage-controlled power switch. N-channel logic-level MOSFETs (IRLZ44N, IRLB8721) are the standard method for switching LED strips from microcontroller PWM outputs. The gate draws essentially zero DC current. See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

**MQTT (Message Queuing Telemetry Transport)** — A lightweight publish/subscribe messaging protocol for IoT devices. ESP32 boards use MQTT to communicate with Home Assistant, and WLED supports MQTT for remote control. Zigbee2MQTT bridges ZigBee devices to MQTT. See [ESP32 LED Control](m2-esp32-led.md).

**MSO (Mixed-Signal Oscilloscope)** — An oscilloscope that combines standard analog channels with digital logic analyzer channels (typically 8 or 16). Useful for correlating analog signals (LED voltage) with digital signals (SPI clock and data) on the same timebase. See [Oscilloscope Fundamentals](m7-oscilloscope-basics.md).

## N

**NeoPixel** — Adafruit's brand name for WS2812B-compatible addressable LEDs and their associated Arduino library. The NeoPixel library provides a simple API for setting pixel colors and handles GRB byte ordering and protocol timing automatically. See [LED Libraries](m3-led-libraries.md).

**NZR protocol (Non-Return-to-Zero)** — The single-wire data encoding used by WS2812B LEDs. Each bit is a fixed-width pulse at 800 kHz (1.25 microseconds). A "0" bit is 0.4 us HIGH + 0.85 us LOW; a "1" bit is 0.8 us HIGH + 0.45 us LOW. See [WS2812B Protocol](m3-ws2812b-protocol.md).

**Nyquist theorem** — A signal can be perfectly reconstructed from its samples if and only if the sampling frequency is at least twice the highest frequency component. Below this rate, aliasing creates false signals. Practical systems use 5-10x oversampling. See [Nyquist-Shannon Sampling](m7-nyquist-sampling.md).

## O

**OTA (Over-the-Air)** — A method for updating firmware on a microcontroller via WiFi instead of a physical USB connection. WLED supports OTA updates, allowing firmware changes to ESP32 LED controllers mounted in hard-to-reach locations. See [WLED Firmware Setup](m5-wled-setup.md).

## P

**P-N junction** — The boundary between p-type (excess holes) and n-type (excess electrons) semiconductor material. When forward-biased, electrons and holes recombine at the junction, releasing energy as photons. The bandgap energy determines the photon wavelength (LED color). See [LED Electronics Fundamentals](m1-led-fundamentals.md).

**Passive probe** — The standard oscilloscope probe, typically 10:1 attenuation. Increases input impedance to ~10 MΩ and extends voltage range, but requires compensation adjustment for accurate high-frequency measurements. See [Oscilloscope Fundamentals](m7-oscilloscope-basics.md).

**Persistence of vision (POV)** — The optical phenomenon where the human retina integrates light over a 25-40ms temporal window. A spinning column of LEDs updated fast enough appears as a solid disc of light. Requires rotation speeds of 1800+ RPM. See [POV Physics](m6-pov-physics.md).

**PIO (Programmable I/O)** — A unique peripheral on the RP2040 microcontroller. Two PIO blocks with four state machines each execute custom micro-programs that generate precise timing signals in hardware, with zero CPU involvement. Ideal for WS2812B and APA102 protocols. See [RP2040 PIO](m2-rp2040-pio.md).

**PLC (Programmable Logic Controller)** — A ruggedized industrial computer designed for real-time control. Runs a deterministic scan cycle, tolerates harsh environments, and is programmed in IEC 61131-3 languages. Used for safety-critical LED indicators and status displays. See [PLC Ladder Logic](m8-plc-ladder-logic.md).

**Polar mapping** — The coordinate transformation used in POV displays to map a rectangular image onto a circular display. Each pixel is addressed by angle (0-359 degrees) and radius (LED index from hub to tip) instead of x,y Cartesian coordinates. See [RP2040 POV Architecture](m6-rp2040-pov-architecture.md).

**Power injection** — The practice of feeding power at multiple points along a long LED strip to compensate for voltage drop in the thin copper traces. Without injection, LEDs at the far end receive insufficient voltage, causing dimming and color shift. See [Power Injection](m3-power-injection.md).

**Probe compensation** — The adjustment of a passive oscilloscope probe's trimmer capacitor to match the scope's input capacitance. An uncompensated probe produces frequency-dependent amplitude errors. Must be performed when changing probes or channels. See [Oscilloscope Fundamentals](m7-oscilloscope-basics.md).

**Protocol decoder** — A software feature in digital oscilloscopes that interprets captured waveform data as structured protocol messages (SPI, I2C, UART, WS2812B). Displays decoded data as annotations overlaid on the waveform trace. See [Measuring LED Signals](m7-measuring-led-signals.md).

**PWM (Pulse Width Modulation)** — A technique for controlling average power by rapidly switching a signal between on and off states. The duty cycle determines perceived LED brightness. Common frequencies range from 1 kHz (basic) to 25 kHz (flicker-free, camera-safe). See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

## R

**Relay output module** — A PLC output module that uses mechanical contacts to switch loads. Handles both AC and DC up to 250V/2A, but is limited to ~20ms switching speed. Suitable for simple LED indicators but not PWM dimming. See [PLC Ladder Logic](m8-plc-ladder-logic.md).

**RP2040** — The microcontroller in the Raspberry Pi Pico. Features dual ARM Cortex-M0+ cores at 133 MHz, 8 PIO state machines, and hardware DMA. Can drive up to 8 independent LED strips simultaneously using PIO. See [RP2040 PIO](m2-rp2040-pio.md).

## S

**Sampling rate** — The number of voltage measurements an oscilloscope's ADC takes per second. Must be at least 2x bandwidth (Nyquist minimum), with 5-10x recommended for accurate waveform representation. Entry-level DSOs offer 500 MSa/s to 1 GSa/s. See [Oscilloscope Fundamentals](m7-oscilloscope-basics.md).

**SPI (Serial Peripheral Interface)** — A four-wire synchronous serial protocol using clock (SCK), data out (MOSI), data in (MISO), and chip select (CS). APA102 LEDs use SPI's clock and data lines. SPI supports much higher clock rates than I2C. See [APA102 SPI Protocol](m3-apa102-spi.md).

**State machine** — A computational model where a system exists in one of a finite number of states and transitions between them based on inputs. PIO state machines on the RP2040 execute custom programs to generate LED protocol signals. PLCs use state machine patterns for sequencing. See [RP2040 PIO](m2-rp2040-pio.md).

## T

**TCS34725** — A digital color sensor from ams that measures red, green, blue, and clear light intensity via I2C. Features 16-bit resolution per channel, configurable gain (1x-60x), and an integrated IR blocking filter. Used for ambient light CCT measurement and closed-loop color feedback. See [TCS34725 Color Sensing](m4-tcs34725-sensing.md).

**Temporal integration** — The process by which retinal photoreceptor cells accumulate photons over a continuous time window (25-40ms for cones). This biological mechanism makes persistence of vision displays possible by summing rapid sequential light pulses into a perceived steady image. See [POV Physics](m6-pov-physics.md).

**Thermal resistance (Rth)** — A measure of a material or interface's opposition to heat flow, measured in degrees Celsius per watt (C/W). Lower thermal resistance means better heat transfer. A TO-220 MOSFET package has ~62 C/W junction-to-ambient without a heatsink. See [Thermal Management](m1-thermal-management.md).

**Thermal runaway** — A positive feedback failure mode where rising temperature decreases an LED's forward voltage, increasing current, generating more heat, further raising temperature. Without proper thermal management or constant-current driving, this loop destroys the LED. See [Thermal Management](m1-thermal-management.md).

**Transistor output module** — A PLC output module that uses solid-state switching (MOSFET or Darlington). Faster than relay outputs (<1ms vs 20ms) with unlimited mechanical lifespan, but limited to DC loads and typically 0.5A per point. See [PLC Ladder Logic](m8-plc-ladder-logic.md).

**TRIAC** — A bidirectional semiconductor switch used for mains AC dimming. TRIACs are used in traditional wall dimmers and require specialized circuits (zero-cross detection, snubber networks) for LED compatibility. Not covered in detail in this low-voltage DC series. See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

**Trigger** — The oscilloscope circuit that determines when to begin capturing and displaying a waveform. Without triggering, the display shows an unstable, rolling mess. Edge trigger is the most common; pulse width trigger is useful for WS2812B analysis. See [Oscilloscope Fundamentals](m7-oscilloscope-basics.md).

## W

**WLED** — An open-source firmware for ESP8266 and ESP32 that provides 100+ LED effects, a web UI, JSON API, MQTT, DMX/Art-Net support, segments, presets, and Home Assistant auto-discovery. The most popular smart LED controller firmware. See [WLED Firmware Setup](m5-wled-setup.md).

**WS2812B** — The most widely used addressable LED. Uses a single-wire NZR protocol at 800 kHz with GRB byte order. Each LED reads the first 24 bits it receives and passes the rest down the chain. Requires precise nanosecond timing and is interrupt-sensitive. See [WS2812B Protocol](m3-ws2812b-protocol.md).

## X

**XC8** — Microchip's ANSI C compiler for 8-bit PIC microcontrollers. Used with MPLAB X IDE for programming PIC16/PIC18 devices. The free version produces functional code; the paid version adds optimization. See [PIC Microcontroller & MPLAB XC8 PWM](m2-pic-xc8-pwm.md).

## Z

**Zigbee** — A low-power mesh networking protocol (IEEE 802.15.4 at 2.4 GHz) used by Philips Hue, IKEA TRADFRI, and other smart lighting products. Requires a coordinator (bridge or USB dongle). Mains-powered devices act as routers, extending mesh range. See [Philips Hue CLIP API](m4-philips-hue-api.md).

---

## Cross-References

- [Source Index](00-source-index.md) -- Bibliography of all sources referenced across this series
- [LED Electronics Fundamentals](m1-led-fundamentals.md) -- Starting point for the full research series
- [MCU Comparison](m2-mcu-comparison.md) -- Platform selection guide for LED projects

---

*This glossary covers terms from all 30 pages of the LED Lighting & Controllers research series. Terms are linked to the page where they receive the most detailed treatment.*
