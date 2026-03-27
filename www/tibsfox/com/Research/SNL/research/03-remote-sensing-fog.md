# Remote Sensing & Fog Vision

> **Domain:** Atmospheric Remote Sensing and Sensor Fusion
> **Module:** 3 -- Lidar, Radar, Sonar, and Multi-Modal Perception Through Atmospheric Opacity
> **Through-line:** *Fog is not an absence of information -- it is a different kind of presence.* Where lidar goes blind, radar sees clearly. Where radar loses resolution, sonar picks up the fine grain. Where all electromagnetic sensing fails, acoustic ranging still works because sound waves bend around water droplets instead of scattering off them. The sensing layer's power comes not from any single sensor but from the architecture that fuses their overlapping perspectives into a coherent picture of the world.

---

## Table of Contents

1. [The Fog Problem](#1-the-fog-problem)
2. [Electromagnetic Spectrum for Sensing](#2-electromagnetic-spectrum-for-sensing)
3. [Lidar Time-of-Flight Principles](#3-lidar-time-of-flight-principles)
4. [Fog Penetration by Sensing Modality](#4-fog-penetration-by-sensing-modality)
5. [Millimeter-Wave and X-Band Radar](#5-millimeter-wave-and-x-band-radar)
6. [RTL-SDR Doppler Weather Sensing](#6-rtl-sdr-doppler-weather-sensing)
7. [Coherent Doppler Lidar](#7-coherent-doppler-lidar)
8. [Ultrasonic Sonar Ranging](#8-ultrasonic-sonar-ranging)
9. [Acoustic Sensing and Foghorns](#9-acoustic-sensing-and-foghorns)
10. [Phone-Flash Time-of-Flight](#10-phone-flash-time-of-flight)
11. [Sensor Fusion Architectures](#11-sensor-fusion-architectures)
12. [DIY Remote Sensing Components](#12-diy-remote-sensing-components)
13. [Safety and Regulatory Boundaries](#13-safety-and-regulatory-boundaries)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Fog Problem

The Pacific Northwest experiences approximately 30-60 fog days per year, with coastal areas like the Olympic Peninsula and San Juan Islands exceeding 80 fog days annually. Dense fog reduces visibility below 1 km, and in extreme cases below 100 m. For any sensing layer deployed in PNW environments, fog is not an edge case -- it is a primary operating condition [1][2].

Fog affects different sensing modalities in fundamentally different ways because the interaction between electromagnetic radiation and water droplets depends on the ratio of droplet size to wavelength. Fog droplets are typically 1-20 micrometers in diameter. At visible and near-infrared wavelengths (400-1600 nm), the droplets are much larger than the wavelength, causing Mie scattering -- strong, wavelength-dependent scattering that rapidly attenuates the signal. At millimeter-wave frequencies (77-79 GHz, wavelength ~4 mm), the droplets are much smaller than the wavelength, and scattering is negligible. At acoustic frequencies (40 kHz, wavelength ~8.5 mm), sound waves diffract around the droplets with minimal attenuation [3].

### Atmospheric Opacity Spectrum

```
SENSING MODALITY vs FOG ATTENUATION
================================================================

Wavelength    Modality            Fog Effect      Range Impact
--------------------------------------------------------------------
400-700 nm    Visible light       SEVERE          Near-zero in dense fog
905 nm        Near-IR lidar       SEVERE          >50% range loss
1550 nm       Eye-safe lidar      HIGH            30-60% range loss
3-5 um        Mid-IR thermal      MODERATE        Reduced contrast
77-79 GHz     mm-wave radar       MINIMAL         <5% range loss
9.3-9.5 GHz   X-band radar        LOW             <10% in light rain
40 kHz        Ultrasonic sonar    NEGLIGIBLE      Temperature-dependent
50-500 Hz     Acoustic (foghorn)  NONE            Kilometers of range
```

---

## 2. Electromagnetic Spectrum for Sensing

Understanding where each sensing modality lives on the electromagnetic spectrum reveals why no single sensor can serve all conditions [3][4].

### Spectrum Map

| Band | Frequency | Wavelength | DIY Feasible | Typical Use |
|---|---|---|---|---|
| Visible | 400-700 THz | 400-700 nm | Yes (camera) | Machine vision, photography |
| Near-IR | 200-400 THz | 700-1600 nm | Yes (lidar modules) | Ranging, SLAM, LiDAR |
| Mid-IR | 60-100 THz | 3-5 um | Expensive | Thermal imaging |
| Far-IR | 10-30 THz | 10-30 um | Moderate (MLX90640) | Presence detection, heat |
| mm-Wave | 77-81 GHz | 3.7-3.9 mm | Emerging ($50+) | Automotive radar, weather |
| X-band | 9.3-9.5 GHz | 31-32 mm | No (FCC licensed) | Weather radar, marine |
| S-band | 2.7-3.0 GHz | 100-111 mm | No (FCC licensed) | NEXRAD weather radar |
| UHF | 300-3000 MHz | 10-100 cm | Yes (RTL-SDR receive) | Passive radar, TV signals |
| VHF | 30-300 MHz | 1-10 m | Yes (RTL-SDR receive) | FM radio, aviation |
| HF | 3-30 MHz | 10-100 m | Yes (HAM license) | Long-range communication |
| Ultrasonic | 20-400 kHz | 0.86-17 mm | Yes ($2-5) | Short-range distance |
| Audible | 20 Hz - 20 kHz | 17 mm - 17 m | Yes (microphone) | Acoustic monitoring |

---

## 3. Lidar Time-of-Flight Principles

Lidar (Light Detection and Ranging) measures distance by timing the round-trip of a laser pulse. The fundamental equation is trivially simple; the engineering challenges are in managing noise, atmospheric attenuation, and eye safety [4][5].

### Basic Ranging Equation

```
Distance = (c * t_roundtrip) / 2

Where:
  c = speed of light (299,792,458 m/s)
  t_roundtrip = time from pulse emission to detector response

For 1 meter resolution: t = 2/c = 6.67 ns
For 1 cm resolution: t = 0.067 ns = 67 ps

This is why lidar requires nanosecond-precision timing electronics.
```

### Wavelength Selection

| Wavelength | Eye Safety | Fog Performance | Cost | Common Use |
|---|---|---|---|---|
| 905 nm | Class 1M (caution) | Poor -- Mie scattering | Low ($5-20 module) | VL53L1X ToF, cheap lidar |
| 940 nm | Similar to 905 nm | Poor | Low | iPhone Face ID |
| 1550 nm | Eye-safe (water absorbs) | Better -- still scatters | High ($50-200+) | Automotive lidar, surveying |

**The 1550 nm advantage:** Water in the cornea and vitreous humor of the eye absorbs 1550 nm strongly, preventing the light from reaching the retina. This allows higher power output without eye damage risk, which partially compensates for the higher fog attenuation. The net result is better fog penetration with lower safety risk [5].

### DIY Lidar Modules

| Module | Wavelength | Range | Interface | Price | Notes |
|---|---|---|---|---|---|
| VL53L0X | 940 nm | 2 m | I2C | $3-8 | Miniature ToF; gesture sensing |
| VL53L1X | 940 nm | 4 m | I2C | $5-12 | Longer range; region of interest |
| TF-Luna | 850 nm | 8 m (reflective) | UART/I2C | $15-25 | Higher power; IP65 available |
| RPLIDAR A1 | 785 nm | 12 m | UART | $100 | 360-degree scanning lidar |
| Garmin LIDAR-Lite v4 | 940 nm | 10 m | I2C | $60 | LED-based, not laser; eye-safe |

> **SAFETY WARNING:** Never look directly into any lidar laser source, even "eye-safe" Class 1 devices. Class 1 eye safety ratings assume a specific exposure time and beam divergence. Staring into a laser aperture at close range can exceed the rated exposure. All lidar installations should include a warning label and be mounted above head height or aimed downward.

---

## 4. Fog Penetration by Sensing Modality

The definitive comparison for sensor selection in fog-prone environments. All attenuation values sourced from peer-reviewed atmospheric optics research [3][5][6].

### Fog Attenuation Matrix

| Modality | Wavelength | Fog Attenuation | Rain Effect | Clear-Air Range | Dense Fog Range |
|---|---|---|---|---|---|
| Visible lidar (905 nm) | Near-IR | Up to 200 dB/km | Moderate | 50-200 m (module) | <10 m |
| Eye-safe lidar (1550 nm) | Near-IR | 80-150 dB/km | Moderate | 50-200 m | 15-50 m |
| mm-wave radar (77 GHz) | 3.9 mm | <1 dB/km | 15-20 dB/km (heavy) | 100-300 m | 90-280 m |
| X-band radar (9.4 GHz) | 32 mm | <0.5 dB/km | 5-10 dB/km | km-scale | km-scale |
| Ultrasonic sonar (40 kHz) | 8.5 mm acoustic | Negligible | Minimal | 2-4 m | 2-4 m (unchanged) |
| Acoustic foghorn (200 Hz) | 1.7 m acoustic | None | None | 3-5 km | 3-5 km (unchanged) |

### Key Insight

**Radar sees through fog because fog droplets (1-20 um) are 200x smaller than the radar wavelength (4 mm at 77 GHz).** Mie scattering requires the scatterer to be comparable in size to the wavelength. When the scatterer is much smaller, Rayleigh scattering dominates -- and Rayleigh scattering intensity drops as the inverse fourth power of wavelength, making it negligible at radar frequencies.

**Sonar ignores fog because sound waves diffract around obstacles smaller than their wavelength.** A 40 kHz ultrasonic pulse has a wavelength of 8.5 mm at 20 degrees C. Fog droplets at 1-20 um are 400x smaller. The sound wave simply wraps around them.

---

## 5. Millimeter-Wave and X-Band Radar

Millimeter-wave radar (77-79 GHz) is the emerging standard for automotive and industrial sensing. X-band radar (9.3-9.5 GHz) is the established standard for weather and marine applications [6][7].

### mm-Wave Radar Principles

Frequency-Modulated Continuous Wave (FMCW) radar transmits a chirp -- a signal that linearly sweeps from a start frequency to a stop frequency over a defined time. The reflected chirp arrives delayed by the round-trip time. Mixing the transmitted and received chirps produces a beat frequency proportional to the target distance.

```
FMCW RADAR PRINCIPLE
================================================================

Transmitted: ─────/─────/─────/    (chirp sweeps from f1 to f2)
Received:       ─────/─────/       (delayed by round-trip time)

Beat frequency: fb = (2 * R * BW) / (c * T_chirp)

Where:
  R = target distance
  BW = chirp bandwidth (typically 1-4 GHz)
  c = speed of light
  T_chirp = chirp duration (typically 50-200 us)

Range resolution: dR = c / (2 * BW)
  At BW = 4 GHz: dR = 3.75 cm
```

### DIY mm-Wave Availability

The Texas Instruments IWR1443 and AWR1843 evaluation modules provide 77-81 GHz FMCW radar on a single chip with onboard DSP. Price: $50-100 for evaluation boards. These are FCC-certified for operation in the 76-81 GHz ISM band (no license required for short-range applications at compliant power levels).

### X-Band Weather Radar

NEXRAD (WSR-88D) S-band radar is the backbone of US weather radar, but X-band fills a gap for localized, high-resolution precipitation monitoring. The shorter wavelength provides finer spatial resolution but suffers more attenuation in heavy rain.

| Parameter | S-band (NEXRAD) | X-band (research) | mm-Wave (DIY) |
|---|---|---|---|
| Frequency | 2.7-3.0 GHz | 9.3-9.5 GHz | 77-81 GHz |
| Wavelength | 100-111 mm | 31-32 mm | 3.7-3.9 mm |
| Range | 460 km | 40-100 km | 100-300 m |
| Resolution | 1 km | 100-250 m | 3.75 cm (at 4 GHz BW) |
| Rain attenuation | Low | Moderate | High |
| DIY feasible | No | No (licensed) | Yes (ISM band) |

---

## 6. RTL-SDR Doppler Weather Sensing

The RTL-SDR (software-defined radio based on the RTL2832U chipset) enables passive Doppler weather sensing by receiving signals from existing transmitters (TV towers, FM stations, aircraft transponders) and measuring their Doppler shift as weather fronts move through the signal path [8][9].

### Passive Bistatic Radar Concept

Traditional radar is monostatic -- the transmitter and receiver are co-located. Passive bistatic radar uses transmitters of opportunity (FM broadcast towers, DAB stations, DVB-T transmitters) and a separate receiver (RTL-SDR dongle, ~$25). Weather disturbances in the signal path cause Doppler shifts and multipath variations that can be analyzed to detect precipitation, wind shear, and front boundaries.

### RTL-SDR Hardware

| Component | Specification | Price | Source |
|---|---|---|---|
| RTL-SDR Blog V4 | RTL2832U + R828D, 500 kHz-1.766 GHz | $30 | rtl-sdr.com |
| Antenna (dipole) | Tuned for target frequency | $10-20 | Amazon, Adafruit |
| Low-noise amplifier | 20 dB gain, NF < 1 dB | $15 | Nooelec, RTL-SDR Blog |
| Raspberry Pi 4 | Processing platform | $35-75 | Adafruit |
| Software | GNU Radio, dump1090, rtl_433 | Free | github.com |

### Weather Signal Detection

The `rtl_433` software decodes signals from over 200 wireless sensor protocols in the 433 MHz ISM band, including weather stations, soil moisture sensors, and tire pressure monitors. Combined with antenna diversity and signal processing, an RTL-SDR station can passively monitor local weather conditions from nearby consumer weather station transmissions [9].

### Doppler Wind Measurement

By monitoring the carrier frequency of a distant FM station, changes in Doppler shift indicate wind speed and direction along the line of sight. A weather front moving at 30 km/h through the signal path between an FM tower 50 km away and the receiver produces a Doppler shift of approximately:

```
f_doppler = f_carrier * v / c
          = 100 MHz * (30 km/h / 3.6) / 299,792,458
          = 100,000,000 * 8.33 / 299,792,458
          = 2.78 Hz

This 2.78 Hz shift is measurable with an RTL-SDR
at sufficiently long integration times (>10 seconds).
```

> **Related:** See [SGL](../SGL/) for FFT and spectral analysis algorithms applicable to SDR signal processing, [SYS](../SYS/) for SDR receiver station infrastructure.

---

## 7. Coherent Doppler Lidar

Coherent Doppler lidar represents the high end of atmospheric remote sensing -- measuring wind velocity by detecting the Doppler shift of laser light scattered from atmospheric aerosols [10][11].

### Operating Principle

Unlike direct-detection lidar (which measures only distance), coherent Doppler lidar uses optical heterodyne detection:

1. A laser transmits a pulse at a known frequency (typically 1.5 um, eye-safe)
2. The pulse scatters from aerosols (dust, pollen, humidity droplets) in the atmosphere
3. The backscattered light is mixed with a local oscillator (a sample of the original laser) on a photodetector
4. The beat frequency between the returned signal and the local oscillator equals the Doppler shift
5. The Doppler shift is directly proportional to the wind velocity along the beam

### Performance Parameters

| Parameter | Typical Value | Source |
|---|---|---|
| Wavelength | 1.5 um (eye-safe) | SSEC/UW-Madison [10] |
| Wind velocity precision | 10 cm/s | SSEC operational data |
| Range | 10-15 km (clear air) | NASA HARLIE program |
| Range resolution | 50-100 m | Beam dwell time dependent |
| Scan pattern | Conical, PPI, RHI | Application dependent |
| Cost | $200K-$1M+ | Research-grade instruments |

### Relationship to DIY Sensing

Coherent Doppler lidar is not DIY-accessible today. However, understanding its principles informs the design of cheaper sensing alternatives:

- **Wind profiling at the boundary layer** can be approximated by distributed anemometer meshes at a tiny fraction of the cost
- **Aerosol detection** overlaps with PM2.5 particulate sensors (SDS011 at $20 vs $200K lidar)
- **The heterodyne detection principle** is the same technique used in FM radio demodulation -- familiar to anyone who has built an SDR receiver

---

## 8. Ultrasonic Sonar Ranging

Ultrasonic sonar is the most fog-immune ranging technology available at DIY prices. Sound waves at 40 kHz have a wavelength of 8.5 mm -- 400x larger than fog droplets -- and diffract around them without significant attenuation [12].

### HC-SR04 Module

The HC-SR04 is the most widely used DIY ultrasonic ranging module:

| Parameter | Specification |
|---|---|
| Frequency | 40 kHz |
| Range | 2 cm - 400 cm |
| Accuracy | +/- 3 mm |
| Beam angle | ~15 degrees |
| Trigger pulse | 10 us TTL |
| Echo pulse | Width proportional to distance |
| Supply | 5V, 15 mA active |
| Price | $1-3 |

### Temperature Correction

The speed of sound varies with temperature, introducing range error if uncorrected:

```
Speed of sound = 331.3 + (0.606 * T_celsius) m/s

At 0°C:  331.3 m/s
At 20°C: 343.4 m/s (standard reference)
At 40°C: 355.5 m/s

Range calculation: distance = (echo_time_us * speed_of_sound) / 2 / 1,000,000

Error from 1°C temperature uncertainty:
  0.606 m/s / 343.4 m/s = 0.176%
  At 4 m range: 0.176% * 4000 mm = 7 mm error per degree C
```

### Weatherproof Variant: JSN-SR04T

For outdoor field deployment, the JSN-SR04T provides:
- IP67 waterproof transducer (probe + cable)
- Range: 20 cm - 600 cm
- Same interface as HC-SR04 (trigger/echo)
- Operating temperature: -20 to +70 C
- Price: $5-10

### Applications in Sensing Layer

- **Water level monitoring:** JSN-SR04T mounted above a stream or rain gauge for continuous level measurement
- **Snow depth:** Mounted at a known height, measuring distance to snow surface
- **Proximity sensing:** Detecting wildlife or visitors at field stations
- **Wind-sheltered ranging:** Unlike lidar, sonar works in fog, rain, and smoke

---

## 9. Acoustic Sensing and Foghorns

Acoustic sensing at audible and infrasonic frequencies provides range and environmental information that no electromagnetic sensor can replicate in certain conditions [13].

### Foghorn Physics

Foghorns have been used for marine navigation since the 1850s. Their effectiveness in fog is absolute -- sound waves at 50-500 Hz have wavelengths of 0.7-7 meters, completely immune to fog droplet scattering.

| Foghorn Type | Frequency | Range | Notes |
|---|---|---|---|
| Diaphragm (traditional) | 200-400 Hz | 3-5 km | Compressed air driven |
| Electronic (modern) | 100-700 Hz | 2-8 km | Speaker array, directional |
| USCG standard signal | 250-500 Hz | 5+ km | Codified pattern identification |

### Acoustic Environmental Monitoring

Modern acoustic sensing extends beyond simple ranging to environmental characterization:

- **Rain detection:** The acoustic signature of rain on a hard surface has a characteristic broadband spectrum centered around 1-5 kHz. A MEMS microphone (INMP441 or MAX4466) can detect and classify rainfall intensity by spectral analysis.
- **Wind estimation:** Wind noise has a characteristic low-frequency signature (<500 Hz) whose amplitude correlates with wind speed. Combined with anemometer data, acoustic wind provides a redundant measurement.
- **Wildlife monitoring:** Automated acoustic species identification using bird song, frog chorus, and insect stridulation. The PNW soundscape includes diagnostic species (Pacific chorus frog, varied thrush, Swainson's thrush) whose presence indicates habitat health [14].

---

## 10. Phone-Flash Time-of-Flight

Time-of-flight cameras using modulated infrared light are now embedded in consumer smartphones (iPhone 12+ LiDAR, iPad Pro). The principle is adaptable to DIY sensing using phone camera flash synchronization [4].

### Principle

A ToF camera illuminates the scene with modulated infrared light (typically at 850 or 940 nm) and measures the phase difference between the emitted and returned signals for each pixel. The phase difference maps directly to distance.

```
ToF PHASE MEASUREMENT
================================================================

Emitted:   ∿∿∿∿∿∿∿∿∿∿    (modulated at f_mod, typically 20-100 MHz)
Returned:    ∿∿∿∿∿∿∿∿∿∿  (delayed by round-trip time)

Phase difference: phi = 2 * pi * f_mod * (2 * R / c)
Distance: R = (phi * c) / (4 * pi * f_mod)

At f_mod = 20 MHz:
  Unambiguous range = c / (2 * f_mod) = 7.5 m
  Phase resolution of 1 degree = 7.5 / 360 = 21 mm
```

### DIY Application

Using a smartphone's flash LED as a pulsed light source and the camera as a detector, rudimentary time-of-flight ranging has been demonstrated for indoor mapping. The camera's rolling shutter acts as a crude phase detector when synchronized with the flash pulse.

**Limitations:** Smartphone flash LEDs are not modulated at the MHz frequencies needed for mm-resolution ToF. The technique provides decimeter-level accuracy at best, suitable for room-scale mapping but not precision ranging.

---

## 11. Sensor Fusion Architectures

No single sensor provides reliable ranging and environmental monitoring in all conditions. Sensor fusion -- combining data from multiple modalities -- is the architectural response [3][15].

### Fusion Strategy Matrix

| Condition | Primary Sensor | Secondary Sensor | Fusion Method |
|---|---|---|---|
| Clear, dry | Lidar (VL53L1X) | -- | Single sensor sufficient |
| Light fog | Lidar + sonar | mm-wave (if available) | Weighted average; trust sonar more |
| Dense fog | Sonar + radar | Acoustic | Switch to sonar primary; lidar disabled |
| Rain | Radar + sonar | Lidar degraded | Radar primary for distance > 5m |
| Night, clear | Lidar (unaffected) | Sonar | Normal fusion |
| Smoke | Radar + sonar | Acoustic | Same as dense fog |

### Fusion Architecture: Kalman Filter

The Kalman filter is the standard framework for fusing noisy sensor measurements into a single best estimate. For a weather node combining lidar and sonar distance measurements:

```
SENSOR FUSION -- KALMAN FILTER (simplified)
================================================================

State: x = [distance, velocity]
Measurements: z_lidar, z_sonar (when available)

Predict:
  x_pred = F * x_prev + B * u    (state transition)
  P_pred = F * P_prev * F^T + Q  (covariance prediction)

Update (for each sensor):
  K = P_pred * H^T * (H * P_pred * H^T + R)^-1  (Kalman gain)
  x = x_pred + K * (z - H * x_pred)              (state update)
  P = (I - K * H) * P_pred                        (covariance update)

Where:
  R_lidar = high in fog (sensor unreliable)
  R_sonar = constant (fog-independent)
  The Kalman gain automatically trusts sonar more in fog.
```

### Practical Implementation

On an ESP32 with a VL53L1X lidar and HC-SR04 sonar:

1. Read both sensors every 100 ms
2. Lidar returns `0` or error code in fog -- set R_lidar to infinity (distrust completely)
3. Sonar always returns a valid reading -- set R_sonar to calibrated noise variance
4. Kalman filter seamlessly transitions from lidar-primary (clear) to sonar-only (fog) without mode switching

> **Related:** See [ECO](../ECO/) for ecological sensor fusion in PNW forest environments, [BPS](../BPS/) for multi-sensor field station design, [PSS](../PSS/) for power system monitoring sensor fusion, [K8S](../K8S/) for distributed sensor data aggregation.

---

## 12. DIY Remote Sensing Components

Complete component catalog for building a multi-modal sensing node [16].

### Sensor Component Matrix

| Component | Modality | Interface | Range | Price | Source |
|---|---|---|---|---|---|
| VL53L0X | Lidar ToF, 940 nm | I2C | 2 m | $3-8 | Adafruit, SparkFun |
| VL53L1X | Lidar ToF, 940 nm | I2C | 4 m | $5-12 | Adafruit, SparkFun |
| TF-Luna | Lidar, 850 nm | UART/I2C | 8 m | $15-25 | Benewake |
| HC-SR04 | Ultrasonic, 40 kHz | Trigger/Echo | 4 m | $1-3 | Generic |
| JSN-SR04T | Ultrasonic, IP67 | Trigger/Echo | 6 m | $5-10 | Generic |
| RTL-SDR V4 | SDR receiver | USB | Passive | $30 | rtl-sdr.com |
| IWR1443 EVM | mm-wave radar, 77 GHz | UART/SPI | 150 m | $50-100 | Texas Instruments |
| MLX90640 | Thermal IR, 32x24 | I2C | Passive (thermal) | $40-60 | Melexis |
| INMP441 | MEMS microphone | I2S | Acoustic | $2-5 | Generic |
| HMC5883L | Magnetometer | I2C | N/A (field sensing) | $2-5 | Honeywell |

---

## 13. Safety and Regulatory Boundaries

Remote sensing technologies intersect with eye safety regulations, RF emissions limits, and spectrum licensing requirements [17][18].

### Eye Safety: Laser Classification

| Class | Power Limit | Typical Device | Safety Requirement |
|---|---|---|---|
| Class 1 | <0.39 mW (visible) | VL53L0X, VL53L1X | Safe under all conditions |
| Class 1M | Safe for naked eye | Some lidar modules | Warning label; no magnifying optics |
| Class 2 | <1 mW (visible) | Laser pointer | Blink reflex provides protection |
| Class 3R | 1-5 mW | -- | Risk of eye injury; avoid direct exposure |
| Class 3B | 5-500 mW | -- | Serious eye hazard; require safety goggles |

**Rule for sensing layer:** Only use Class 1 or Class 1M laser sources. No Class 3R or above in any unattended deployment.

### RF Regulatory Compliance

| Band | Regulation | License | Power Limit | Sensing Layer Use |
|---|---|---|---|---|
| 433 MHz ISM | FCC Part 15 | None | 10 mW (ERP) | Sensor telemetry, rtl_433 receive |
| 915 MHz ISM | FCC Part 15 | None | 1 W (EIRP) | LoRa/Meshtastic mesh |
| 2.4 GHz ISM | FCC Part 15 | None | 1 W (EIRP) | WiFi, Bluetooth |
| 5.8 GHz ISM | FCC Part 15 | None | 1 W (EIRP) | WiFi 5/6 |
| 77-81 GHz | FCC Part 15 | None | Restricted EIRP | mm-wave radar modules |
| 500 kHz-1.766 GHz | Receive only | None required | Receive only | RTL-SDR passive monitoring |

> **SAFETY WARNING:** Transmitting on frequencies outside ISM bands requires an amateur radio license (FCC Part 97) or other authorization. The RTL-SDR is receive-only and requires no license. Never modify an RTL-SDR to transmit. Never build or operate a weather radar transmitter without appropriate FCC licensing.

---

## 14. Cross-References

> **Related:** [BPS](../BPS/) -- field sensor deployment and environmental enclosure design for outdoor sensing nodes. [ECO](../ECO/) -- ecological monitoring applications that combine remote sensing with biological survey data. [EMG](../EMG/) -- emergency response sensor networks requiring all-weather reliability. [SGL](../SGL/) -- DSP and spectral analysis algorithms for processing radar and SDR signals. [LED](../LED/) -- light source control for active illumination sensing. [T55](../T55/) -- timing systems including GPS PPS for synchronized distributed sensing. [SYS](../SYS/) -- infrastructure for SDR stations and radar data processing. [PSS](../PSS/) -- power systems for remote sensing stations. [K8S](../K8S/) -- container orchestration for sensor data processing pipelines. [SHE](../SHE/) -- environmental shelter and weatherproofing for outdoor sensor installations.

---

## 15. Sources

1. NOAA Climate Data Online (2025): "Fog Frequency Data -- Pacific Northwest Stations." climate.data.noaa.gov
2. NWS Seattle (2025): "Western Washington Climate Summary." weather.gov/sew/climate
3. RP Photonics Encyclopedia (2025): "LIDAR -- Principles, Atmospheric Scattering, Fog Attenuation." rpphotonics.com/lidar.html
4. LiDAR Solutions Australia (2025): "Lidar Performance in Adverse Weather Conditions." lidarsolutions.com.au
5. EOS (Earth Observing System) (2025): "Lidar vs Radar in Fog and Precipitation." eos.com/lidar-vs-radar
6. Texas Instruments (2025): "FMCW Radar Fundamentals -- IWR1443 Application Note." ti.com/lit/an/swra553a/
7. NOAA NWS Radar Operations Center (2025): "NEXRAD Technical Information." roc.noaa.gov/WSR88D/
8. RTL-SDR Blog (2025): "Passive Bistatic Radar with RTL-SDR." rtl-sdr.com
9. Merbanan (2025): "rtl_433 -- Generic Data Receiver for ISM Band." github.com/merbanan/rtl_433
10. SSEC / University of Wisconsin-Madison (2025): "Doppler Lidar Research Program." metobs.ssec.wisc.edu/lidar
11. NASA (2024): "HARLIE -- High Altitude Remote Lidar for Investigation of the Environment." nasa.gov
12. Elecfreaks (2024): "HC-SR04 Ultrasonic Sensor Module Datasheet." elecfreaks.com
13. USCG (2024): "Aids to Navigation -- Sound Signal Characteristics." navcen.uscg.gov
14. Cornell Lab of Ornithology (2025): "Automated Acoustic Species Identification." birdnet.cornell.edu
15. Thrun, S., Burgard, W., Fox, D. (2005): "Probabilistic Robotics." MIT Press. Chapter 3: Gaussian Filters.
16. Adafruit Industries (2025): "Distance Sensor Comparison Guide." learn.adafruit.com/distance-sensors
17. IEC 60825-1 (2014): "Safety of Laser Products -- Part 1: Equipment Classification and Requirements."
18. FCC (2025): "Part 15 -- Radio Frequency Devices." ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15
