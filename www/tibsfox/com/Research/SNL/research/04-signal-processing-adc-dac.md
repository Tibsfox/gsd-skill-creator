# Signal Processing, ADC/DAC & Timekeeping

> **Domain:** Analog-Digital Interface Engineering
> **Module:** 4 -- Analog-to-Digital Conversion, Digital-to-Analog Output, and Precision Timekeeping
> **Through-line:** *The analog world does not stop when you sample it.* Between one ADC sample and the next, the temperature changed, the wind shifted, the UV index drifted -- and those unrecorded moments are permanently lost. The resolution of the ADC determines the granularity of what you can know. The sample rate determines the bandwidth of what you can observe. The timekeeper determines when you knew it. Signal processing in the sensing layer is the art of capturing just enough of the infinite analog world to answer the questions that matter.

---

## Table of Contents

1. [The Conversion Boundary](#1-the-conversion-boundary)
2. [ADC Architecture Comparison](#2-adc-architecture-comparison)
3. [On-Board ADC Characterization](#3-on-board-adc-characterization)
4. [External ADC: ADS1115](#4-external-adc-ads1115)
5. [Other External ADC Options](#5-other-external-adc-options)
6. [DAC Options](#6-dac-options)
7. [PiWave PIO-DAC: 150 MS/s](#7-piwave-pio-dac-150-ms-s)
8. [I2S Audio Interface](#8-i2s-audio-interface)
9. [Sampling Theory and Aliasing](#9-sampling-theory-and-aliasing)
10. [Real-Time Clock: DS3231](#10-real-time-clock-ds3231)
11. [GPS PPS Timing](#11-gps-pps-timing)
12. [NTP Synchronization](#12-ntp-synchronization)
13. [SMPTE Timecodes](#13-smpte-timecodes)
14. [Edge Processing Patterns](#14-edge-processing-patterns)
15. [Cross-References](#15-cross-references)
16. [Sources](#16-sources)

---

## 1. The Conversion Boundary

Every sensor in the sensing layer produces an analog signal -- a voltage, a current, a resistance change -- that must cross the conversion boundary into the digital domain before it can be processed, stored, transmitted, or fused with other measurements. The quality of this conversion determines the fidelity floor for the entire downstream pipeline. No amount of digital signal processing can recover information lost at the ADC [1].

The Amiga Principle is directly applicable: Paula, the Amiga's I/O chip, handled all audio input and output through 8-bit DMA-driven converters at 28 kHz -- the CPU never touched a single audio sample. In the sensing layer, the DMA-ADC pattern on ESP32 and Pico achieves the same decoupling: the conversion subsystem runs independently, filling buffers that the CPU processes at its own pace [2].

### Conversion Quality Metrics

| Metric | Definition | Importance |
|---|---|---|
| Resolution (bits) | Number of quantization levels (2^N) | Determines minimum detectable change |
| Sample rate (SPS) | Conversions per second | Determines maximum observable frequency |
| DNL (LSB) | Deviation of each step from ideal 1 LSB | Monotonicity and code-to-code accuracy |
| INL (LSB) | Maximum deviation from ideal straight line | Overall accuracy across full range |
| ENOB | Effective number of bits (accounts for noise) | True usable resolution |
| SNR (dB) | Signal-to-noise ratio | Dynamic range |
| SFDR (dB) | Spurious-free dynamic range | Freedom from harmonic distortion |

---

## 2. ADC Architecture Comparison

Three ADC architectures dominate the microcontroller sensing space. Understanding their tradeoffs is essential for matching the ADC to the sensing application [1][3].

### Architecture Tradeoffs

| Architecture | Resolution | Speed | Power | Accuracy | Cost | Used In |
|---|---|---|---|---|---|---|
| SAR (Successive Approximation) | 8-18 bit | 10 kSPS - 5 MSPS | Low | Good | Low | Arduino, ESP32, Pico |
| Delta-Sigma | 16-32 bit | 10-1000 SPS | Medium | Excellent | Medium | ADS1115, HX711 |
| Flash | 4-8 bit | 100 MSPS+ | High | Fair | High | Video ADC, oscilloscopes |

### SAR ADC Operation

The SAR ADC is the workhorse of microcontroller analog inputs. It operates by binary search:

```
SAR ADC BINARY SEARCH (12-bit example)
================================================================

Step 1: Compare input to Vref/2 (2048)
  Input > Vref/2 → bit 11 = 1, remainder = input - Vref/2
  Input < Vref/2 → bit 11 = 0, remainder = input

Step 2: Compare remainder to Vref/4 (1024)
  ...repeat for each bit...

Step 12: Final bit determined
  Total time: 12 clock cycles + sample-and-hold time

Result: 12 comparisons for 12-bit resolution
  At 2 MHz ADC clock: 12 * 500 ns + S&H = ~10 us per conversion
  = 100 kSPS
```

### Delta-Sigma ADC Operation

Delta-sigma ADCs trade speed for resolution by oversampling and noise shaping. The ADS1115 samples the input at a much higher rate than the output rate, then applies a digital decimation filter that averages out the quantization noise. This achieves 16-bit effective resolution at the cost of limiting the output rate to 8-860 SPS [4].

**Advantages:** Excellent linearity, no missing codes, inherent anti-aliasing from oversampling.
**Disadvantages:** Slow. Cannot track rapidly changing signals.

---

## 3. On-Board ADC Characterization

### Comprehensive Platform Comparison

| Platform | Resolution | Max Rate | Reference | ENOB | Linearity Notes |
|---|---|---|---|---|---|
| ATmega328P (Arduino) | 10-bit | 15 kSPS | AVCC (5V) or 1.1V bandgap | 9.7 | Best linearity of all on-board ADCs tested |
| RP2040 (Pico) | 12-bit | 500 kSPS | 3.3V | 10.2 | Dead zone below 20 mV; tail-off near 3.3V |
| RP2350 (Pico 2) | 12-bit | 500 kSPS | 3.3V | 10.5 | Improved over RP2040; same architecture |
| ESP32 (Xtensa) | 12-bit | 2 MSPS | 3.3V | 8.5-9.5 | Known nonlinearity at extremes; requires calibration |
| ESP32-S3 | 12-bit | 2 MSPS | 3.3V | 9.0-10.0 | Improved over original ESP32 |

### ESP32 ADC Nonlinearity Detail

The ESP32 ADC transfer function deviates from ideal in three regions [5]:

1. **Below 0.1V (codes 0-120):** Output clamps or shows erratic behavior. Unusable for measurement.
2. **0.15V-2.45V (codes 180-3000):** Best linearity region. Calibration lookup table reduces INL to +/-2 LSB.
3. **Above 2.6V (codes 3200-4095):** Compression and saturation. Readings plateau before reaching 3.3V.

**Calibration approach:** Espressif stores factory calibration data in eFuse memory. The `esp_adc_cal_characterize()` API reads this data and provides a polynomial correction function. After calibration, typical accuracy is +/-5 mV across the usable range.

### Pico ADC Characterization

The RP2040 uses capacitor-ratio matching for its SAR DAC (the internal DAC that generates comparison voltages during conversion). This is more precise than resistor ladders because capacitor ratios can be manufactured with higher accuracy on silicon [6].

**Known issues:**
- Dead zone: codes 0-15 (approximately 0-20 mV) may not be reached
- Temperature coefficient: ~0.2 LSB per degree C change in ambient temperature
- Channel crosstalk: switching between ADC channels requires a 1 us settling delay

**Best practice:** Always discard the first sample after switching channels. Average 4-16 samples for noise reduction (increases ENOB by 1-2 bits).

---

## 4. External ADC: ADS1115

The ADS1115 is the reference external ADC for sensing layer applications. Its 16-bit delta-sigma architecture provides precision measurements that no on-board ADC can match [4][7].

### ADS1115 Specifications

| Parameter | Value | Notes |
|---|---|---|
| Resolution | 16-bit (including sign) | 15 usable bits in single-ended mode |
| Sample rate | 8 to 860 SPS (programmable) | Lower rate = lower noise |
| Input channels | 4 single-ended or 2 differential | Software-selectable MUX |
| PGA gain | 2/3, 1, 2, 4, 8, 16 | Full-scale range: +/-6.144V to +/-0.256V |
| Interface | I2C (4 selectable addresses) | Up to 4 ADS1115 on one bus |
| Supply | 2.0V-5.5V | 150 uA typical operating current |
| Price | $1.50-3.00 | Adafruit breakout: $14.95 (includes level shifting) |

### PGA Settings and Measurement Resolution

| PGA Setting | Full-Scale Range | LSB Size | Best For |
|---|---|---|---|
| 2/3x (default) | +/- 6.144V | 187.5 uV | High-voltage monitoring |
| 1x | +/- 4.096V | 125 uV | General purpose |
| 2x | +/- 2.048V | 62.5 uV | Sensor conditioning output |
| 4x | +/- 1.024V | 31.25 uV | Thermocouples |
| 8x | +/- 0.512V | 15.625 uV | Load cells, strain gauges |
| 16x | +/- 0.256V | 7.8125 uV | Micro-voltage measurement |

### Differential Mode

In differential mode, the ADS1115 measures the voltage difference between two input pins, rejecting common-mode noise. This is critical for:

- **Wheatstone bridge sensors** (load cells, pressure transducers): the bridge output is a differential signal of a few millivolts superimposed on a common-mode voltage near Vcc/2
- **Thermocouple measurement:** the thermocouple generates microvolts to millivolts of differential voltage
- **Long cable runs:** common-mode noise from EMI is rejected

---

## 5. Other External ADC Options

| Device | Resolution | Rate | Interface | Channels | Price | Use Case |
|---|---|---|---|---|---|---|
| ADS1015 | 12-bit | 3300 SPS | I2C | 4 SE / 2 diff | $1.00 | Faster ADS1115 alternative |
| PCF8591 | 8-bit | 11.25 kSPS | I2C | 4 SE + 1 DAC | $0.50 | Simple, includes DAC |
| ADS7828 | 12-bit | 50 kSPS | I2C | 8 SE | $3.00 | 8-channel monitoring |
| HX711 | 24-bit | 10/80 SPS | Digital (serial) | 2 diff | $0.50 | Load cell, strain gauge |
| MCP3008 | 10-bit | 200 kSPS | SPI | 8 SE | $2.50 | Fast 8-channel scanning |
| ADS8688 | 16-bit | 500 kSPS | SPI | 8 SE | $15.00 | High-speed multi-channel |

### Selection Guide

```
EXTERNAL ADC SELECTION
================================================================

Need highest precision?
  → ADS1115 (16-bit, slow) or HX711 (24-bit, very slow)

Need many channels?
  → ADS7828 (8ch I2C) or MCP3008 (8ch SPI)

Need speed?
  → MCP3008 (200 kSPS SPI) or ADS8688 (500 kSPS SPI)

Need cheapest?
  → PCF8591 ($0.50, 8-bit, includes DAC)

Need load cell / strain gauge?
  → HX711 ($0.50, 24-bit, dedicated bridge amplifier)
```

---

## 6. DAC Options

Digital-to-analog conversion in the sensing layer serves three primary purposes: generating reference voltages for sensor conditioning, producing audio output for acoustic signaling, and creating arbitrary waveforms for scientific stimulus [8][9].

### DAC Comparison

| Device | Resolution | Speed | Interface | Channels | Price | Best Use |
|---|---|---|---|---|---|---|
| ESP32 internal | 8-bit | ~MHz | GPIO 25/26 | 2 | Free | Telephone audio, bias voltage |
| MCP4725 | 12-bit | 400 kHz I2C | I2C | 1 | $1.50 | Precision bias, slow waveforms |
| MCP4728 | 12-bit | 400 kHz I2C | I2C | 4 | $3.00 | Multi-channel bias generation |
| PCM5102 | 32-bit | 384 kHz (I2S) | I2S | 2 (stereo) | $3-8 | High-quality audio output |
| PiWave PIO-DAC | 10-14 bit | 150 MS/s | PIO parallel | 1 | $5 (Pico 2 + R-2R) | RF, function generator |

### MCP4725 Deep Dive

The MCP4725 is the standard precision DAC for sensing layer applications. Key features [8]:

- **EEPROM:** Stores a default output value that is loaded on power-up. Useful for generating a stable bias voltage without firmware.
- **I2C address:** 0x60 or 0x61 (configurable via A0 pin)
- **Output:** Rail-to-rail, 0V to VCC
- **Settling time:** 6 us (0.5 LSB accuracy)
- **Power-down mode:** <60 nA for battery-powered applications

**Applications:**
- Generate 1.1V reference for UV sensor calibration
- Create programmable threshold voltage for analog comparator
- Drive audio at low quality (sine wave buzzer at 1 kHz)

---

## 7. PiWave PIO-DAC: 150 MS/s

The PiWave project demonstrated 150 million samples per second output from a Raspberry Pi Pico 2, using the PIO subsystem to drive parallel data to an external DAC [10].

### Architecture

```
PiWave PIO-DAC SIGNAL PATH
================================================================

Flash memory (waveform data)
    │
    v
DMA Engine ──────> PIO FIFO ──────> PIO State Machine
                   (8 deep)          │
                                     │ 10/12/14 parallel GPIO
                                     v
                                R-2R Ladder DAC
                                (or parallel DAC IC)
                                     │
                                     v
                              Analog Output
                              (0 to Vref)

Performance: 150 MS/s at 10-bit
             Nyquist frequency: 75 MHz
             CPU utilization: 0% during output
```

### Applications in Sensing Layer

1. **Arbitrary waveform generator:** Generate precise stimulus signals for sensor characterization. Sweep a sine wave from 1 Hz to 100 kHz to measure a sensor's frequency response.
2. **Software-defined radio transmitter:** At 150 MS/s, the PIO-DAC can directly synthesize RF waveforms up to 75 MHz (Nyquist). Combined with a bandpass filter and amplifier, this creates a low-cost SDR transmitter.
3. **Function generator replacement:** A $5 Pico 2 + $2 R-2R ladder replaces a $200 bench function generator for many applications.

> **SAFETY WARNING:** The PIO-DAC output can generate RF-frequency signals. Connecting the output to an antenna constitutes a radio transmitter subject to FCC Part 15 or Part 97 regulations. Never connect the PIO-DAC to an antenna without appropriate filtering and regulatory compliance.

---

## 8. I2S Audio Interface

I2S (Inter-IC Sound) is a synchronous serial protocol designed specifically for digital audio. It provides the bridge between ADC/DAC ICs and the microcontroller's DMA engine [11].

### I2S Signal Lines

| Line | Function | Direction |
|---|---|---|
| BCLK (Bit Clock) | Clocks individual bits | Master to slave |
| WS (Word Select) | Left/right channel select | Master to slave |
| SD (Serial Data) | Audio sample data | Bidirectional |
| MCLK (Master Clock) | Optional, 256x sample rate | Master to slave |

### I2S on ESP32

The ESP32 has two I2S peripherals (I2S0 and I2S1), each supporting:

- Sample rates: 8 kHz to 96 kHz (192 kHz with some codecs)
- Bit depths: 8, 16, 24, 32 bits per sample
- DMA-driven: audio data flows directly from memory to I2S without CPU involvement
- Both transmit and receive: supports simultaneous audio input and output

### Audio Codec Pairing

| Codec | Type | Resolution | Interface | Price | Notes |
|---|---|---|---|---|---|
| PCM5102 | DAC | 32-bit/384kHz | I2S | $3-8 | Excellent audio quality; no MCLK needed |
| MAX98357A | DAC + Amp | 16-bit | I2S | $3-6 | Built-in 3W class D amplifier |
| INMP441 | MEMS Mic | 24-bit | I2S | $2-5 | Digital MEMS microphone |
| WM8960 | Codec | 24-bit/48kHz | I2S + I2C | $8-15 | Full codec: ADC + DAC + headphone amp |

---

## 9. Sampling Theory and Aliasing

The Nyquist-Shannon sampling theorem is the fundamental law governing all ADC applications in the sensing layer [1][12].

### The Nyquist Theorem

**Theorem:** A bandlimited signal with maximum frequency f_max can be perfectly reconstructed from its samples if the sampling rate f_s > 2 * f_max.

**Corollary:** Sampling at rate f_s, the maximum recoverable frequency is f_s/2 (the Nyquist frequency). Any signal component above f_s/2 will alias -- appear as a false lower-frequency component that is indistinguishable from real data.

### Aliasing in Weather Sensing

Consider a temperature sensor sampled every 10 minutes (f_s = 1/600 Hz). The Nyquist frequency is 1/1200 Hz (one cycle per 20 minutes). Temperature fluctuations faster than 20-minute cycles (e.g., sun-cloud transitions every 5 minutes) will alias into slower-appearing variations that corrupt the daily temperature profile.

**Mitigation:** Either sample faster (every minute) or apply an analog low-pass filter before the ADC. For digital sensors like the BME280 that have their own internal oversampling, aliasing is handled internally.

### Anti-Aliasing Filter Design

For analog sensors feeding an ADC, an anti-aliasing filter (AAF) is required:

```
ANTI-ALIASING FILTER PLACEMENT
================================================================

  Sensor ──> AAF (analog low-pass) ──> ADC ──> Digital processing

  AAF cutoff frequency: f_c = f_s / 2 (or slightly below)

  Simple RC filter: f_c = 1 / (2 * pi * R * C)
  For f_c = 250 Hz (ADC at 500 SPS):
    R = 10 kohm, C = 63.7 nF → use 68 nF standard value
    f_c = 1 / (2 * pi * 10000 * 68e-9) = 234 Hz ✓

  For f_c = 100 kHz (ADC at 200 kSPS):
    R = 1 kohm, C = 1.59 nF → use 1.5 nF
    f_c = 1 / (2 * pi * 1000 * 1.5e-9) = 106 kHz ✓
```

---

## 10. Real-Time Clock: DS3231

The DS3231 is the standard precision RTC for sensing layer nodes. Its temperature-compensated crystal oscillator (TCXO) provides accuracy that is orders of magnitude better than the microcontroller's crystal [13].

### DS3231 Specifications

| Parameter | Value | Comparison |
|---|---|---|
| Accuracy | +/- 2 ppm (0-40 C) | <1 minute/year drift |
| Crystal type | MEMS TCXO (internal) | No external crystal needed |
| Interface | I2C (address 0x68) | Standard bus protocol |
| Backup battery | CR2032 (years of backup) | Maintains time through power loss |
| Temperature sensor | Built-in, +/- 3 C | Useful for environmental monitoring |
| Alarm outputs | 2 programmable alarms | Wake microcontroller from deep sleep |
| Square wave output | 1 Hz, 1.024 kHz, 4.096 kHz, 8.192 kHz | For external timing reference |
| Supply | 2.3V-5.5V | Compatible with all platforms |
| Price | $1-3 (module with battery holder) | Widely available |

### Drift Comparison

| Time Source | Accuracy | Drift per Day | Drift per Year |
|---|---|---|---|
| Ceramic resonator (ESP32) | +/- 10,000 ppm | 864 seconds | 87.6 hours |
| Crystal oscillator (Arduino) | +/- 50 ppm | 4.3 seconds | 26 minutes |
| DS3231 TCXO | +/- 2 ppm | 0.17 seconds | 1 minute |
| GPS PPS | < 0.001 ppm | < 0.0001 seconds | < 0.03 seconds |

### Use Pattern: Wake-on-Alarm

The DS3231's programmable alarms can wake a microcontroller from deep sleep at precise intervals:

1. Set alarm for next sample time (e.g., every 10 minutes aligned to clock)
2. Put microcontroller into deep sleep (ESP8266: 20 uA, ESP32: 10 uA)
3. DS3231 alarm output pulls INT pin low at programmed time
4. Microcontroller wakes, reads sensors, transmits data, returns to sleep
5. Total active time: 3-5 seconds per 10-minute cycle

This achieves time-aligned sampling across multiple nodes without GPS.

---

## 11. GPS PPS Timing

GPS PPS (Pulse Per Second) provides the highest-accuracy time reference available to DIY sensing nodes. The PPS signal is a hardware pulse output from the GPS module, synchronized to UTC with sub-microsecond accuracy [14].

### GPS PPS Specifications

| Parameter | Typical Value | Notes |
|---|---|---|
| Pulse accuracy | < 50 ns (relative to UTC) | After GPS lock acquired |
| Pulse width | 100 ms (configurable) | Rising edge is the timing reference |
| Time to first fix | 30-60 seconds (cold start) | 1-5 seconds hot start |
| Lock requirements | 4+ satellites visible | Outdoor, clear sky |
| Module price | $10-15 (NEO-6M) | $30-50 for NEO-M9N (newer, faster) |
| Power | 30-50 mA during acquisition | 10-25 mA during tracking |

### PPS Discipline

For the highest accuracy, the microcontroller's system clock is "disciplined" by the PPS signal:

```
GPS PPS CLOCK DISCIPLINE
================================================================

  GPS Module ──PPS──> Hardware Interrupt Pin
                           │
                           v
                    Capture system timer value
                    at PPS rising edge
                           │
                           v
                    Compare to expected 1-second interval
                           │
                           v
                    Compute clock drift rate
                    Adjust timer frequency or offset
                           │
                           v
                    All timestamps aligned to UTC
                    with < 1 us accuracy

  Result: Every sensor reading has a UTC-traceable timestamp
          accurate to the microsecond level.
```

### Applications

- **Distributed sensor synchronization:** Multiple weather nodes sample at the same instant, enabling spatial gradient measurement
- **Phase-locked strobing:** POV displays and scientific instruments flash in synchronization across any distance
- **Scientific data provenance:** GPS-timestamped observations are accepted by atmospheric science databases (NOAA, MADIS)

> **Related:** See [T55](../T55/) for detailed GPS module integration and PPS firmware patterns, [SGL](../SGL/) for SMPTE timecode details, [BPS](../BPS/) for field station timing architecture.

---

## 12. NTP Synchronization

For nodes with WiFi but no GPS, NTP (Network Time Protocol) provides time synchronization over the network [15].

### NTP Accuracy

| Scenario | Typical Accuracy | Notes |
|---|---|---|
| Internet NTP server | < 50 ms | Depends on network path |
| LAN NTP server | < 1 ms | Minimal network jitter |
| Local Raspberry Pi NTP (GPS-disciplined) | < 10 us | Pi acts as Stratum 1 server |

### ESP32 NTP Configuration

The ESP32's `configTime()` function sets the system clock from NTP servers. For sensing layer applications:

1. Configure primary and secondary NTP servers (pool.ntp.org + gateway Pi)
2. Set timezone offset for local time display
3. Resync every 3600 seconds (default) or more frequently for better drift correction
4. Use `gettimeofday()` for microsecond-resolution timestamps between syncs

---

## 13. SMPTE Timecodes

SMPTE (Society of Motion Picture and Television Engineers) timecodes provide frame-accurate time reference for synchronized multi-channel recording. Two formats are relevant to sensing layer applications [16].

### LTC (Linear Time Code)

LTC embeds the timecode in an audio signal using biphase modulation. It can be recorded on any audio channel or transmitted over any audio path.

| Parameter | Value |
|---|---|
| Format | HH:MM:SS:FF (hours, minutes, seconds, frames) |
| Frame rates | 24, 25, 29.97, 30 fps |
| Modulation | Biphase (Manchester encoding) |
| Bandwidth | 1.2 kHz (24 fps) to 2.4 kHz (30 fps) |
| Level | -10 dBu to +4 dBu |

### MTC (MIDI Time Code)

MTC encodes SMPTE timecode within MIDI messages, enabling synchronization of musical instruments, lighting controllers, and sensing equipment.

- **Full frame message:** Sent once per second; contains complete time
- **Quarter frame messages:** Sent 4 per frame; progressively update H:M:S:F digits
- **Advantage:** Rides on existing MIDI cable infrastructure

### Application: Synchronized Scientific Recording

A weather station with multiple sensors (temperature, humidity, wind, UV) recording at different rates can use a shared timecode to align all measurements in post-processing. The DS3231 provides the time base; LTC on an audio channel or MTC on a MIDI bus distributes it.

---

## 14. Edge Processing Patterns

Edge processing -- performing computation at the sensor node rather than sending raw data to a central server -- is essential for bandwidth-constrained mesh networks [17].

### DMA-ADC Continuous Sampling (ESP32)

```
ESP32 DMA-ADC PATTERN
================================================================

Configuration:
  adc_continuous_config_t config = {
    .sample_freq_hz = 20000,     // 20 kSPS
    .conv_mode = ADC_CONV_SINGLE_UNIT_1,
    .format = ADC_DIGI_OUTPUT_FORMAT_TYPE2,
  };

Flow:
  ADC hardware ──DMA──> Ring buffer (4096 samples)
                              │
                              │ (callback on half-full)
                              v
                        Process 2048 samples:
                          - Compute mean, min, max
                          - Apply median filter (outlier rejection)
                          - Compute RMS for noise estimation
                              │
                              v
                        MQTT publish: {
                          "mean": 23.4,
                          "min": 22.8,
                          "max": 24.1,
                          "rms_noise": 0.12,
                          "timestamp": "2026-03-26T14:30:00Z",
                          "samples": 2048
                        }
```

### Compression Strategies

For mesh weather nodes with limited LoRa bandwidth (max ~11 kbps at SF7, 125 kHz):

| Strategy | Compression Ratio | Complexity | Notes |
|---|---|---|---|
| Average + min/max | 1000:3 | Trivial | Lose temporal detail |
| Delta encoding | 3:1 to 10:1 | Low | Encode differences between samples |
| Run-length encoding | 2:1 to 20:1 | Low | Good for slowly changing values |
| Huffman coding | 2:1 to 5:1 | Medium | Optimal for known distributions |
| Threshold reporting | Variable | Low | Only report when change exceeds threshold |

---

## 15. Cross-References

> **Related:** [SGL](../SGL/) -- DSP algorithms for processing ADC data including FFT, filtering, and spectral analysis. [T55](../T55/) -- deep dive into timing systems including GPS PPS hardware integration and NTP server configuration. [BPS](../BPS/) -- field sensor station design including ADC selection and power budgeting. [LED](../LED/) -- DAC applications for LED brightness control and gamma correction. [SYS](../SYS/) -- MQTT broker configuration and data pipeline infrastructure. [ECO](../ECO/) -- environmental monitoring applications of ADC and sensor integration. [EMG](../EMG/) -- emergency sensor networks requiring real-time ADC processing. [DAA](../DAA/) -- deep audio analysis using I2S audio interfaces and DSP. [K8S](../K8S/) -- container orchestration for edge computing gateway management. [PSS](../PSS/) -- power monitoring using INA219/INA226 current sensing.

---

## 16. Sources

1. Kester, W. (2005): "Data Conversion Handbook." Analog Devices / Newnes. Chapter 2: ADC Architectures.
2. Miner, J. et al. (1985): "Amiga Hardware Reference Manual -- Paula I/O Specifications."
3. Texas Instruments (2024): "Understanding SAR ADC Fundamentals." ti.com/lit/an/slaa013a/
4. Texas Instruments (2024): "ADS1115 Ultra-Small, Low-Power, I2C-Compatible, 860-SPS, 16-Bit ADC." ti.com/lit/ds/symlink/ads1115.pdf
5. Espressif Systems (2025): "ESP32 ADC Calibration API Reference." docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/adc_calibration.html
6. Raspberry Pi Foundation (2024): "RP2040 ADC Subsystem -- Capacitor-Ratio Architecture." datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf, Section 4.9.
7. Adafruit Industries (2025): "ADS1115 4-Channel ADC Breakout Tutorial." learn.adafruit.com/adafruit-4-channel-adc-breakouts
8. Microchip Technology (2024): "MCP4725 12-Bit DAC with EEPROM Datasheet." microchip.com/en-us/product/mcp4725
9. Adafruit Industries (2024): "MCP4725 Breakout Tutorial." learn.adafruit.com/mcp4725-12-bit-dac-tutorial
10. Hackaday (Jan 2026): "PiWave: 150 MS/s PIO-DAC on Raspberry Pi Pico 2." hackaday.com
11. Philips Semiconductors (1996): "I2S Bus Specification." sparkfun.com/datasheets/BreakoutBoards/I2SBUS.pdf
12. Shannon, C.E. (1949): "Communication in the Presence of Noise." Proceedings of the IRE, 37(1), 10-21.
13. Maxim Integrated (2015): "DS3231 Extremely Accurate I2C-Integrated RTC/TCXO/Crystal Datasheet." maximintegrated.com/en/products/analog/clock-and-timer/DS3231.html
14. u-blox (2024): "NEO-6M GPS Module Datasheet." u-blox.com/en/product/neo-6-series
15. Mills, D.L. (2006): "Computer Network Time Synchronization: The Network Time Protocol on Earth and in Space." CRC Press.
16. SMPTE ST 12-1:2014: "Time and Control Code." smpte.org
17. Shi, W. et al. (2016): "Edge Computing: Vision and Challenges." IEEE Internet of Things Journal, 3(5), 637-646.
