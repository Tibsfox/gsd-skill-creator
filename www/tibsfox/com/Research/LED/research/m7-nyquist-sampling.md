# Nyquist-Shannon Sampling & ADC

The Nyquist-Shannon sampling theorem is the mathematical foundation for all digital measurement, including oscilloscopes, audio recording, and microcontroller ADCs reading LED sensor data. Understanding it explains why oscilloscopes need sampling rates far above the signal frequency, why aliasing creates phantom signals, and why the ESP32's ADC is unreliable for precision work.

---

## The Nyquist-Shannon Sampling Theorem

### Statement

A continuous-time signal can be perfectly reconstructed from its discrete samples if and only if the sampling frequency is at least twice the highest frequency component in the signal:

```
fs >= 2 * fmax

Where:
  fs   = sampling frequency (samples per second)
  fmax = highest frequency component in the signal

The frequency fs/2 is called the Nyquist frequency.
```

This theorem, independently proven by Harry Nyquist (1928) and Claude Shannon (1949), is one of the most important results in information theory. It establishes a hard boundary: below 2x, information is irretrievably lost.

### Intuitive Explanation

Consider sampling a sine wave. If you take at least two samples per cycle, you capture both the peak and the trough -- enough to reconstruct the original waveform. With fewer than two samples per cycle, you cannot distinguish the original frequency from a lower-frequency alias.

```
Original signal: 10 kHz sine wave

Sampling at 25 kHz (2.5x -- adequate):
  x   x   x   x   x   x   x   x   x   x   x   x
  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\
 /  \/  \/  \/  \/  \/  \/  \/  \/  \/  \/  \/  \
  Reconstructed waveform: correct 10 kHz

Sampling at 15 kHz (1.5x -- UNDER Nyquist):
  x       x       x       x       x       x
  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\
 /  \/  \/  \/  \/  \/  \/  \/  \/  \/  \/  \/  \
  Reconstructed waveform: FALSE 5 kHz signal (alias!)

Sampling at exactly 20 kHz (2x -- Nyquist limit):
  x     x     x     x     x     x     x     x
  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\  /\
 /  \/  \/  \/  \/  \/  \/  \/  \/  \/  \/  \/  \
  Reconstructed waveform: amplitude uncertain (phase-dependent)
```

At exactly 2x, reconstruction is theoretically perfect but practically unreliable because it depends on the phase relationship between the sampling clock and the signal. This is why practical systems use sampling rates of 5-10x the signal bandwidth.

---

## Aliasing

### What Aliasing Looks Like

Aliasing occurs when a signal is sampled below the Nyquist rate. The undersampled signal appears as a lower frequency that does not exist in the original signal. This is not noise -- it is a coherent, repeatable false signal that looks real.

```
Aliasing example: 900 Hz signal sampled at 1000 Hz

  True signal:     900 Hz (just below Nyquist frequency of 500 Hz)
  Alias appears:   1000 - 900 = 100 Hz

  On the scope: you see a stable 100 Hz waveform.
  It looks completely real. There is no visual indication it is an alias.
  Only the frequency is wrong.
```

### Aliasing in LED Work

Aliasing is directly relevant to LED measurement:

1. **Oscilloscope aliasing:** If a scope's sampling rate is too low for the signal being measured, the displayed waveform shows incorrect frequency and shape. A 24 MHz APA102 clock viewed on a 10 MSa/s scope would alias to a false lower frequency. See [Oscilloscope Basics](m7-oscilloscope-basics.md) for bandwidth selection rules.

2. **PWM + camera aliasing:** When filming LED installations with a camera, the camera's frame rate (24-60 fps) aliases against the LED PWM frequency. This produces visible rolling bands or flicker in video that is invisible to the naked eye. Solution: use PWM frequencies above 1 kHz (ideally above 20 kHz) for installations that will be photographed.

3. **ADC aliasing in sensor circuits:** A [TCS34725 color sensor](m4-tcs34725-sensing.md) or photodiode reading PWM-dimmed light will alias if the ADC sampling rate is near the PWM frequency.

### The Anti-Aliasing Filter

To prevent aliasing, an **analog low-pass filter** must be placed before the ADC. This filter removes all frequency components above the Nyquist frequency before sampling occurs:

```
Signal path for alias-free digitization:

  Analog     Anti-Aliasing     ADC          Digital
  Signal --> Low-Pass Filter --> Sampler --> Signal
              (cutoff at         (at fs
               fs/2)             samples/s)

Filter characteristics:
  Cutoff frequency:  fc = fs / 2
  Rolloff:           As steep as possible (-40 to -80 dB/decade)
  Type:              Butterworth (flat passband), Bessel (linear phase),
                     or Chebyshev (steep rolloff, some ripple)
```

In oscilloscopes, the anti-aliasing filter is built into the analog front end. In microcontroller circuits, you must add it yourself if the signal bandwidth approaches the ADC sampling rate.

### Simple Anti-Aliasing Filter for MCU ADC

A first-order RC low-pass filter:

```
                 R
  Signal ---/\/\/---+--- ADC Input
                    |
                    C
                    |
                   GND

  Cutoff frequency: fc = 1 / (2 * pi * R * C)

  Example: sampling at 10 kHz (fs), want fc = 5 kHz:
    fc = 5000 Hz
    Choose C = 10 nF
    R = 1 / (2 * pi * 5000 * 10e-9) = 3,183 ohm
    Use R = 3.3K ohm (nearest standard value)
```

A first-order filter provides only -20 dB/decade rolloff, which means frequencies at 10x the cutoff are only attenuated by 20 dB (10x). For better alias rejection, use a second-order Sallen-Key filter (-40 dB/decade) or a dedicated anti-aliasing filter IC.

---

## ADC Resolution

### Bits to Voltage Levels

An ADC converts a continuous voltage to a discrete digital number. The number of bits determines the resolution:

```
n-bit ADC --> 2^n discrete levels

Full-scale voltage = Vref

Resolution (LSB) = Vref / 2^n
```

| ADC Bits | Levels | Resolution at 3.3V | Resolution at 5.0V |
|----------|--------|--------------------|--------------------|
| 8-bit | 256 | 12.9 mV | 19.5 mV |
| 10-bit | 1,024 | 3.22 mV | 4.88 mV |
| 12-bit | 4,096 | 0.806 mV | 1.22 mV |
| 16-bit | 65,536 | 0.050 mV | 0.076 mV |
| 24-bit | 16,777,216 | 0.197 uV | 0.298 uV |

For LED applications, the relevant question is: can the ADC resolve the signal of interest?

```
Example: measuring a photodiode signal for ambient light sensing

  Photodiode output range: 0 to 3.3V
  Desired sensitivity: 1 lux resolution out of 1000 lux range
  Required: 1000 levels minimum --> need at least 10-bit ADC

  12-bit ADC at 3.3V: 4096 levels = 0.24 lux per level --> adequate
  8-bit ADC at 3.3V: 256 levels = 3.9 lux per level --> too coarse
```

### Signal-to-Noise Ratio (SNR)

The theoretical maximum SNR of an ADC is determined by its resolution:

```
SNR = 6.02 * n + 1.76 dB

Where n = number of bits

  8-bit:  49.9 dB
  10-bit: 61.96 dB
  12-bit: 74.0 dB
  16-bit: 98.1 dB
```

In practice, ADC noise, reference voltage noise, and quantization effects reduce the effective number of bits (ENOB) below the nominal resolution. The ESP32's 12-bit ADC, for example, has an ENOB of approximately 9-10 bits due to nonlinearity.

---

## ESP32 ADC Characteristics

### The Good and the Bad

The ESP32 has two 12-bit SAR (Successive Approximation Register) ADCs with 18 available channels. On paper, 12-bit resolution at up to 2 MSa/s seems excellent. In practice, the ESP32 ADC has well-documented limitations:

| Parameter | Specification | Practical Reality |
|-----------|--------------|-------------------|
| Resolution | 12-bit (4096 levels) | ~9-10 effective bits (ENOB) |
| Sampling rate | 2 MSa/s (max) | 100-200 kSa/s typical with accurate reads |
| Input range | 0-3.3V (with attenuation) | Nonlinear below 0.1V and above 3.0V |
| Linearity | Not specified | ~3-5% INL error (S-curve distortion) |
| Reference | Internal (1100 mV nominal) | Varies per chip (1000-1200 mV) |
| ADC2 | 10 channels | Cannot be used while WiFi is active |
| Noise floor | Not specified | ~10-20 mV in typical circuits |

### The Nonlinearity Problem

The ESP32's ADC exhibits a characteristic S-shaped nonlinearity:

```
ESP32 ADC Transfer Function (exaggerated):

  ADC Reading
  4095 |                              .....***
       |                          ****
       |                       ***       <-- Linear region
       |                    ***              (0.15V - 2.9V)
       |                 ***
       |              ***
       |           ***
       |        ***
       |     ***
       |  ***
       |**                         <-- Compressed at low voltages
     0 +--+-----+-----+-----+-----+
       0  0.5   1.0   1.5   2.5  3.3V
              Input Voltage

  Ideal (linear) would be a straight diagonal line.
  Actual has S-curve: compressed at both ends, roughly linear in middle.
```

### Calibration for ESP32 ADC

Espressif provides factory calibration values stored in eFuse. The ESP-IDF ADC calibration API uses these to correct for individual chip variation:

```c
#include "esp_adc_cal.h"

// Characterize ADC with factory calibration
esp_adc_cal_characteristics_t adc_chars;
esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11,
                          ADC_WIDTH_BIT_12, 0, &adc_chars);

// Read calibrated voltage
uint32_t voltage_mv;
esp_adc_cal_get_voltage(ADC_CHANNEL_0, &adc_chars, &voltage_mv);
// voltage_mv is in millivolts, corrected for this specific chip
```

With calibration, accuracy improves to approximately +/- 1-2% in the linear region (0.15V to 2.9V). Outside this range, even calibrated readings are unreliable.

### When to Use ESP32 ADC

| Application | ESP32 ADC Suitable? | Notes |
|-------------|-------------------|-------|
| Potentiometer reading (dimmer knob) | Yes | 10-bit effective is plenty for a knob |
| Light level sensing (LDR/photodiode) | Yes, with calibration | Use calibrated API, stay in linear range |
| Battery voltage monitoring | Marginal | Use voltage divider to stay in 0.15-2.9V range |
| Audio sampling | No | Too noisy, nonlinear at small signals |
| Precision color measurement | No | Use external ADC (ADS1115) |
| Waveform capture (DIY scope) | Marginal | See [DIY Oscilloscopes](m7-diy-oscilloscopes.md) |

---

## External ADCs for Precision

### ADS1115: 16-bit I2C ADC

The Texas Instruments ADS1115 is the go-to external ADC for microcontroller projects requiring precision:

| Parameter | ADS1115 | ESP32 built-in |
|-----------|---------|----------------|
| Resolution | 16-bit (65,536 levels) | 12-bit (4,096 levels) |
| Interface | I2C (up to 4 addresses) | Direct SAR |
| Sampling rate | 8-860 SPS (configurable) | Up to 2 MSPS |
| Input range | +/-6.144V to +/-0.256V (PGA) | 0-3.3V |
| Linearity | +/-0.01% INL | ~3-5% INL |
| Noise | 4 uV RMS (at 8 SPS) | ~10-20 mV |
| Channels | 4 single-ended or 2 differential | 18 (ADC1 + ADC2) |
| Cost | $2-4 (breakout: $10-15) | Included |

### ADS1115 Wiring and Code

```
ADS1115 Breakout:

  ESP32          ADS1115
  3.3V --------  VDD
  GND  --------  GND
  GPIO21 (SDA) - SDA
  GPIO22 (SCL) - SCL
  (Signal) ----  A0 (Analog input channel 0)
  GND --------   ADDR (I2C address 0x48)
```

```python
# MicroPython example: read ADS1115 on ESP32
from machine import I2C, Pin
import struct
import time

i2c = I2C(0, sda=Pin(21), scl=Pin(22), freq=400000)
ADS_ADDR = 0x48

# Configuration register: AIN0, +/-4.096V, 128 SPS, single-shot
config = 0xC383  # See ADS1115 datasheet Table 8
i2c.writeto_mem(ADS_ADDR, 0x01, struct.pack('>H', config))

time.sleep_ms(10)  # Wait for conversion

# Read conversion register
raw = i2c.readfrom_mem(ADS_ADDR, 0x00, 2)
value = struct.unpack('>h', raw)[0]  # Signed 16-bit

# Convert to voltage
voltage = value * 4.096 / 32768
print(f"Voltage: {voltage:.4f} V")
print(f"Resolution: {4.096/32768*1000:.3f} mV per LSB")
```

### When to Use External ADC

| Scenario | Recommendation |
|----------|---------------|
| Reading a dimmer potentiometer | ESP32 built-in ADC is fine |
| Measuring LED forward voltage precisely | ADS1115 (need mV accuracy) |
| Color sensor signal conditioning | ADS1115 (need linearity) |
| Battery monitoring (rough) | ESP32 with voltage divider |
| Audio/waveform (>10 kSPS) | MCP3208 (12-bit SPI, 100 kSPS) |
| High-speed capture (>100 kSPS) | MCP3208 or dedicated scope chip |

---

## Practical Example: Sampling a PWM-Dimmed LED

### The Problem

You want to measure the actual brightness of a PWM-dimmed LED using a photodiode and an ADC. The PWM runs at 1 kHz. What sampling rate do you need?

```
PWM frequency: 1 kHz (fundamental)
Harmonics: 3 kHz, 5 kHz, 7 kHz, 9 kHz...

For accurate duty cycle measurement:
  Need at least the 5th harmonic: 5 kHz
  Nyquist: fs >= 2 x 5 kHz = 10 kHz minimum
  Practical: fs >= 50 kHz (10x highest harmonic of interest)

Anti-aliasing filter cutoff: fc = 25 kHz (Nyquist frequency)
```

### The Solution

```c
// Arduino code: measure PWM-dimmed LED brightness
// using analog read with software averaging

const int PHOTO_PIN = A0;
const int NUM_SAMPLES = 100;  // Average over 100 PWM cycles
const int SAMPLE_RATE = 50000;  // 50 kHz
const int DELAY_US = 1000000 / SAMPLE_RATE;  // 20 us between samples

float measureBrightness() {
    long sum = 0;
    for (int i = 0; i < NUM_SAMPLES * 50; i++) {
        // 50 samples per PWM cycle x 100 cycles = 5000 samples
        sum += analogRead(PHOTO_PIN);
        delayMicroseconds(DELAY_US);
    }
    // Average reading represents the DC (average) brightness
    return (float)sum / (NUM_SAMPLES * 50);
}
```

By averaging over many complete PWM cycles, the ADC does not need to resolve individual PWM transitions -- it measures the average (DC equivalent) brightness, which is proportional to the duty cycle.

---

## Key Takeaways

- The Nyquist theorem requires sampling at minimum 2x the highest signal frequency; practical systems use 5-10x
- Aliasing creates false low-frequency signals that look real and cannot be removed digitally after sampling
- Anti-aliasing low-pass filters must precede ADC conversion to remove frequencies above the Nyquist limit
- The ESP32's 12-bit ADC has ~9-10 effective bits due to S-curve nonlinearity; use the calibration API
- The ADS1115 (16-bit I2C, $10-15 breakout) is the standard upgrade for precision analog measurement
- For PWM brightness measurement, averaging over many cycles provides accurate DC-equivalent readings

---

## Cross-References

- [Oscilloscope Basics](m7-oscilloscope-basics.md) -- Bandwidth and sampling rate selection for scopes
- [Measuring LED Signals](m7-measuring-led-signals.md) -- Practical measurement procedures on oscilloscopes
- [DIY Oscilloscopes](m7-diy-oscilloscopes.md) -- ADC-based oscilloscope projects using these principles
- [TCS34725 Color Sensing](m4-tcs34725-sensing.md) -- Precision color measurement requiring good ADC performance
- [ESP32 LED Control](m2-esp32-led.md) -- ESP32 platform overview including ADC usage
- [Glossary](00-glossary.md) -- Definitions of terms used throughout this series

---

*Sources: Shannon (1949) "Communication in the Presence of Noise," Nyquist (1928) "Certain Topics in Telegraph Transmission Theory," Texas Instruments ADS1115 datasheet (SBAS444C), Espressif ESP32 Technical Reference Manual (ADC chapter), Art of Electronics (Horowitz & Hill, 3rd ed.) Chapter 13, Analog Devices "Data Conversion Handbook," Maxim Integrated "Coherent Sampling vs. Window Sampling" application note.*
