# DIY Oscilloscope Projects

Commercial oscilloscopes are the gold standard for signal measurement, but DIY alternatives exist for hobbyists who need basic waveform visualization on a budget. This page covers three approaches: the DSO138 soldering kit, ESP32-based software scopes, and the Raspberry Pi Pico as a USB oscilloscope (Scoppy). Each has specific limitations that determine when it is -- and is not -- suitable for LED work.

---

## DSO138 Kit Oscilloscope

### Overview

The DSO138 is a single-channel digital oscilloscope sold as a soldering kit for $15-25. It uses an STM32F103 ARM Cortex-M3 microcontroller and a 2.4" TFT LCD display. The kit serves two purposes: it is a soldering practice project, and the result is a basic but functional oscilloscope.

```
DSO138 Block Diagram:

  BNC Input --> Attenuator --> Op-Amp Buffer --> STM32F103 ADC
                (relay-switched                  (12-bit, 1 MSPS)
                 sensitivity)                        |
                                                     v
                                              2.4" TFT LCD
                                              (320 x 240)
                                                     |
                                              [Trigger] [V/div] [s/div]
                                              Push buttons
```

### Specifications

| Parameter | DSO138 | Rigol DS1054Z (for comparison) |
|-----------|--------|-------------------------------|
| Channels | 1 | 4 |
| Bandwidth | ~200 kHz | 50 MHz (100 MHz unlocked) |
| Sampling rate | 1 MSa/s | 1 GSa/s |
| Vertical resolution | 12-bit | 8-bit |
| Input range | 0-50V (with attenuator) | ±400V (with 10:1 probe) |
| Coupling | DC only (some mods add AC) | AC/DC/GND |
| Trigger | Edge (basic) | Edge, pulse, video, pattern |
| Protocol decode | None | SPI, I2C, UART |
| Display | 2.4" TFT (320x240) | 7" TFT (800x480) |
| Price | $15-25 (kit) | $350-400 (assembled) |

### Build Guide

The DSO138 kit typically includes:

1. **PCB** -- Pre-assembled SMD components (STM32, op-amps, voltage regulators)
2. **Through-hole components** -- Resistors, capacitors, headers, BNC connector, buttons, LCD
3. **LCD module** -- 2.4" SPI TFT, pre-soldered to a breakout board

**Assembly steps:**

1. Identify all through-hole components using the parts list and color codes
2. Solder low-profile components first: resistors, small capacitors
3. Solder the IC sockets (if provided) or solder ICs directly
4. Install the BNC input connector and sensitivity relay
5. Solder the pin headers for the LCD module
6. Attach the LCD module to the pin headers
7. Connect power (9V DC adapter or USB-to-9V converter)
8. Power on and run the built-in self-test

> **SAFETY WARNING:** The DSO138 has no input protection beyond a basic attenuator. Never connect it to mains voltage, motor drives, or any signal above 50V. The BNC input is directly coupled to the op-amp input through the attenuator resistors. A voltage spike above the rated maximum can destroy the op-amp and potentially the STM32.

### What It Can Measure (LED Work)

| Signal | DSO138 Capable? | Notes |
|--------|----------------|-------|
| PWM dimming (1-10 kHz) | Yes | Well within 200 kHz bandwidth |
| Arduino analogWrite (490 Hz) | Yes | Clean square wave display |
| ESP32 LEDC PWM (up to 40 kHz) | Yes | Up to ~50 kHz duty cycle visible |
| WS2812B data (800 kHz) | No | 800 kHz exceeds 200 kHz bandwidth |
| APA102 SPI clock (10+ MHz) | No | Far beyond bandwidth |
| Power supply ripple | Marginal | DC coupling only; no AC mode for small ripple |
| MOSFET gate drive (slow) | Yes | Rise times > 5us visible |

The DSO138 is a learning tool, not a measurement instrument. Use it for understanding waveform shapes, verifying that PWM is working, and learning oscilloscope controls. For protocol-level debugging, you need a real scope. See [Oscilloscope Basics](m7-oscilloscope-basics.md) for buying recommendations.

### Common DSO138 Modifications

- **AC coupling:** Add a 1uF capacitor in series with the input to block DC offset
- **Extended bandwidth:** Replace the input op-amp with a faster device (limited by ADC rate)
- **Battery power:** Replace 9V adapter with a Li-ion battery and boost converter for portable use
- **3D-printed case:** Numerous designs available on Thingiverse and Printables

---

## ESP32-Based Oscilloscope

### Architecture

The ESP32's ADC and WiFi capabilities enable a software oscilloscope that displays waveforms on a web browser or phone screen. The ESP32 samples the input signal, stores it in a buffer, and serves the waveform data over WiFi to a browser-based display.

```
ESP32 Oscilloscope Architecture:

  Analog Input --> Voltage Divider --> GPIO36 (ADC1_CH0) --> ESP32 ADC
                   (scale to 0-3.3V)                         |
                                                    Sample Buffer (DMA)
                                                             |
                                                    WiFi AP / Web Server
                                                             |
                                                    Browser (phone/laptop)
                                                    [Chart.js waveform display]
```

### Performance Characteristics

| Parameter | ESP32 Scope | Notes |
|-----------|------------|-------|
| Channels | 1-2 (ADC1 channels) | ADC2 unavailable with WiFi |
| Bandwidth | ~50 kHz effective | Limited by ADC sampling rate |
| Sampling rate | 100-200 kSa/s (reliable) | Can reach 1 MSPS but with noise |
| Resolution | 12-bit (9-10 ENOB) | Nonlinear; see [Nyquist Sampling](m7-nyquist-sampling.md) |
| Input range | 0-3.3V (raw), 0-12V (with divider) | Attenuator needed for 5V signals |
| Trigger | Software edge trigger | Latency-dependent, not cycle-accurate |
| Display | Web browser via WiFi | ~100ms display latency |
| Cost | $3-5 (ESP32 DevKit) | Plus resistors for voltage divider |

### Implementation

```c
// ESP32 oscilloscope - core sampling loop
// Uses I2S peripheral for high-speed ADC (DMA-driven)

#include <driver/i2s.h>
#include <WiFi.h>
#include <WebServer.h>

#define SAMPLE_RATE     200000   // 200 kSa/s
#define BUFFER_SIZE     1024     // samples per capture
#define ADC_CHANNEL     ADC1_CHANNEL_0  // GPIO36

static uint16_t sample_buffer[BUFFER_SIZE];
WebServer server(80);

void setup_adc_i2s() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX | I2S_MODE_ADC_BUILT_IN),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 4,
        .dma_buf_len = 256,
        .use_apll = false,
    };
    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_adc_mode(ADC_UNIT_1, ADC_CHANNEL);
    i2s_adc_enable(I2S_NUM_0);
}

void capture_waveform() {
    size_t bytes_read;
    i2s_read(I2S_NUM_0, sample_buffer, sizeof(sample_buffer),
             &bytes_read, portMAX_DELAY);
    // sample_buffer now contains BUFFER_SIZE 12-bit samples
}

void handle_data() {
    capture_waveform();

    // Send samples as JSON array
    String json = "[";
    for (int i = 0; i < BUFFER_SIZE; i++) {
        uint16_t raw = sample_buffer[i] & 0x0FFF;  // 12-bit mask
        if (i > 0) json += ",";
        json += String(raw);
    }
    json += "]";
    server.send(200, "application/json", json);
}

void setup() {
    WiFi.softAP("ESP32-Scope", "password");
    setup_adc_i2s();
    server.on("/data", handle_data);
    server.begin();
}

void loop() {
    server.handleClient();
}
```

### Input Protection Circuit

The ESP32's GPIO pins are rated for 0-3.3V. LED circuits commonly use 5V or 12V. A voltage divider with clamping diodes protects the input:

```
                  10K         10K
  Signal ---/\/\/---+---/\/\/---+--- ESP32 GPIO36
                    |           |
                    |         3.3V
                    |           |
                    |       Schottky
                    |       diode (BAT54)
                    |           |
                    +-----------+
                    |
                  10K
                    |
                   GND

  Voltage division: 1/2 (10K + 10K divider)
  Input range: 0-6.6V --> 0-3.3V at ADC
  Schottky diode clamps overvoltage to 3.3V + 0.3V
```

> **SAFETY WARNING:** The ESP32 ADC input has no built-in overvoltage protection. Connecting a 12V LED strip power rail directly to a GPIO pin will permanently damage the ESP32. Always use a voltage divider and clamping diode for any signal above 3.3V.

### Limitations for LED Work

| Application | ESP32 Scope? | Why |
|-------------|-------------|-----|
| Verify PWM is working | Yes | Can see square wave shape and duty cycle |
| Measure PWM frequency | Yes, up to ~50 kHz | Software frequency counter |
| View WS2812B data | No | 800 kHz > effective bandwidth |
| View SPI clock | No | MHz range beyond capability |
| Power supply ripple | Marginal | Noise floor too high for mV-level ripple |
| Learning waveforms | Yes | Good for understanding scope concepts |

---

## Raspberry Pi Pico as USB Oscilloscope (Scoppy)

### Overview

**Scoppy** is a free Android app that turns a Raspberry Pi Pico (RP2040) into a 2-channel USB oscilloscope, using the phone's screen as the display. The Pico's ADC (12-bit, 500 kSa/s) samples the signal and streams data to the phone over USB.

This is the most capable DIY oscilloscope option, combining the RP2040's fast ADC with a full-featured display app.

### Specifications

| Parameter | Scoppy (Pico) | DSO138 | ESP32 Scope |
|-----------|--------------|--------|-------------|
| Channels | 2 | 1 | 1-2 |
| Bandwidth | ~100 kHz | ~200 kHz | ~50 kHz |
| Sampling rate | 500 kSa/s (single ch) | 1 MSa/s | 200 kSa/s |
| Resolution | 12-bit | 12-bit | 12-bit (9-10 ENOB) |
| Input range | 0-3.3V (raw) | 0-50V | 0-3.3V (raw) |
| Trigger | Software (app) | Hardware (basic) | Software |
| Display | Android phone/tablet | 2.4" TFT | Web browser |
| Protocol decode | No | No | No |
| Cost | $4 (Pico) + phone | $15-25 | $3-5 + phone |

### Setup Procedure

1. **Flash the Pico with Scoppy firmware:**

```
1. Download scoppy-pico-v?.uf2 from fhdm-dev.github.io/scoppy
2. Hold BOOTSEL button on Pico, plug into USB
3. Pico appears as a USB drive
4. Copy the .uf2 file to the drive
5. Pico reboots with Scoppy firmware
```

2. **Install the Scoppy app** on Android from the Play Store

3. **Wire the input:**

```
Raspberry Pi Pico Pin Assignments (Scoppy):

  GPIO26 (ADC0) ---- Channel 1 Input
  GPIO27 (ADC1) ---- Channel 2 Input
  GND           ---- Signal Ground
  3V3           ---- (Do NOT use as reference; use AGND)

  For voltage divider input (measuring 5V signals):
                    10K
  Signal ---/\/\/---+--- GPIO26
                    |
                  10K
                    |
                   GND
```

4. **Connect Pico to phone** with USB OTG cable

5. **Open Scoppy app** -- waveform display appears automatically

### Using Scoppy for LED Work

**Measuring Arduino PWM:**

```
Setup:
  Connect GPIO26 to Arduino PWM output pin (through voltage divider if 5V)
  Connect GND to Arduino GND
  Open Scoppy app

App settings:
  Timebase: 1 ms/div
  Voltage: 1V/div (with 2:1 divider, actual signal is 2x displayed)
  Trigger: Rising edge, auto

Expected display:
  Clean square wave at 490 Hz (Arduino default)
  Duty cycle readable from waveform
```

**Measuring ESP32 LEDC PWM (3.3V, no divider needed):**

```
Setup:
  Connect GPIO26 directly to ESP32 LEDC output pin
  Connect GND to ESP32 GND

App settings:
  Timebase: 500 us/div (for 1 kHz PWM) or 20 us/div (for 25 kHz PWM)
  Voltage: 1V/div
  Trigger: Rising edge

The Pico ADC can resolve PWM up to ~50 kHz reliably.
```

### Scoppy Limitations

- **No protocol decode:** Cannot parse WS2812B or SPI data
- **No deep memory:** Limited capture depth compared to commercial scopes
- **Input protection required:** The RP2040 ADC pins have 0-3.3V absolute maximum rating
- **Phone dependency:** Requires Android phone connected via USB OTG
- **Single-ended only:** No differential input mode
- **No isolated ground:** Shares ground with USB; cannot measure floating circuits

---

## Comparison: When Is DIY Sufficient?

### Decision Matrix

| Task | DSO138 | ESP32 Scope | Scoppy (Pico) | Need Real Scope |
|------|--------|-------------|---------------|----------------|
| Verify PWM is working | OK | OK | Good | Overkill |
| Measure PWM duty cycle | OK | OK | Good | Overkill |
| Debug WS2812B timing | No | No | No | Required |
| Debug APA102 SPI | No | No | No | Required |
| Power supply checkout | Marginal | No | Marginal | Recommended |
| Learn oscilloscope concepts | Good | Good | Good | Even better |
| Classroom teaching | Good | Good | Good | Budget-dependent |
| Production debugging | No | No | No | Required |

### Cost Comparison

| Solution | Component Cost | Total Cost | Capability Level |
|----------|---------------|-----------|-----------------|
| DSO138 kit | $15-25 | $20-30 (with supply) | Basic (~200 kHz, 1 ch) |
| ESP32 scope | $3-5 + resistors | $5-10 | Minimal (~50 kHz, WiFi display) |
| Scoppy (Pico) | $4 + OTG cable | $10-15 | Moderate (~100 kHz, 2 ch) |
| Hantek 6022BE USB | $50-70 | $50-70 | Fair (20 MHz, 2 ch, PC software) |
| Rigol DS1054Z | $350-400 | $350-400 | Professional (50-100 MHz, 4 ch) |
| Siglent SDS1104X-E | $400-500 | $400-500 | Professional (100 MHz, 4 ch) |

### The Honest Assessment

DIY oscilloscopes are **learning tools and verification aids**, not measurement instruments. They answer the question "is my PWM signal present and approximately correct?" but cannot answer "what is the exact timing of my WS2812B protocol?" or "does my SPI signal have ringing that might cause data corruption?"

For anyone serious about LED electronics beyond basic PWM dimming, a **Rigol DS1054Z or Siglent SDS1104X-E** is the single best investment. The protocol decode, four channels, deep memory, and reliable triggering save hours of debugging that no DIY scope can provide. See [Measuring LED Signals](m7-measuring-led-signals.md) for procedures that require a commercial scope.

That said, DIY scopes have genuine value:

1. **First exposure:** Understanding what a waveform looks like before investing $350+
2. **Remote/portable use:** An ESP32 scope with WiFi is useful for checking signals on an installation 30 feet up a ladder
3. **Education:** Building a DSO138 teaches soldering, analog signal conditioning, and ADC principles simultaneously
4. **Budget constraints:** A $10 Scoppy setup is infinitely better than no oscilloscope at all

---

## Building a Better DIY Scope: Key Improvements

For those who want to push DIY scope performance further:

### Input Attenuator with Relay Switching

```
  Input BNC
     |
     +---[10M]---+---[1M]---+--- ADC Input
     |            |          |
     +---[Relay1]-+          |   Relay1 ON:  1:1 (0-3.3V range)
     |                       |   Relay1 OFF: 10:1 (0-33V range)
     +---[Relay2]--[100K]----+   Relay2 adds 100:1 (0-330V range)
     |
    GND
```

### Software Trigger with Hysteresis

```python
# Python-style pseudocode for software trigger
def find_trigger(samples, level, hysteresis=0.05):
    """Find rising edge crossing of trigger level."""
    armed = False
    for i in range(len(samples) - 1):
        if samples[i] < level - hysteresis:
            armed = True  # Signal is below threshold
        if armed and samples[i] >= level:
            return i      # Rising edge found
    return -1  # No trigger found
```

### Oversampling for Resolution Improvement

```
Oversampling theorem:
  Oversample by factor K --> gain log2(K)/2 effective bits

  Example: RP2040 ADC at 500 kSa/s, signal bandwidth 10 kHz
  Available oversampling factor: 500000 / (2 * 10000) = 25x
  Resolution gain: log2(25)/2 = 2.3 bits
  Effective resolution: 12 + 2.3 = 14.3 bits

  Implementation: average every 25 consecutive samples
  Output rate: 500000 / 25 = 20 kSa/s (still 2x Nyquist for 10 kHz)
```

This technique is particularly useful with the RP2040's cleaner ADC (compared to ESP32), where the additional bits from oversampling are meaningful rather than being buried in nonlinearity artifacts.

---

## Key Takeaways

- The DSO138 kit ($15-25) is a soldering project that produces a basic ~200 kHz, 1-channel scope
- ESP32-based scopes offer WiFi display but are limited to ~50 kHz effective bandwidth
- Scoppy (Pico + Android phone) is the most capable DIY option: 2 channels, ~100 kHz, $10 total
- No DIY oscilloscope can decode WS2812B or SPI protocols -- you need a commercial scope for that
- DIY scopes are excellent for PWM verification, learning, and portable/remote signal checking
- The Rigol DS1054Z at $350 remains the most cost-effective real oscilloscope for LED work

---

## Cross-References

- [Oscilloscope Basics](m7-oscilloscope-basics.md) -- Commercial scope buying guide and fundamentals
- [Measuring LED Signals](m7-measuring-led-signals.md) -- Measurement procedures that show where DIY scopes fall short
- [Nyquist Sampling](m7-nyquist-sampling.md) -- ADC sampling theory underlying all DIY scope designs
- [ESP32 LED Control](m2-esp32-led.md) -- ESP32 platform details including ADC characteristics
- [RP2040 PIO State Machines](m2-rp2040-pio.md) -- RP2040 architecture used by Scoppy firmware
- [Glossary](00-glossary.md) -- Definitions of terms used throughout this series

---

*Sources: JYE Tech DSO138 documentation and schematic, Scoppy (fhdm-dev) firmware documentation and source code, Espressif ESP32 I2S ADC mode technical reference, Raspberry Pi Foundation RP2040 ADC specifications, EEVblog "DIY Oscilloscope Shootout" episode, Hackaday.io ESP32 oscilloscope projects, Adafruit "Analog Inputs for Microcontrollers" guide, Rigol DS1054Z specifications (for comparison baseline).*
