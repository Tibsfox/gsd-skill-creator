# DIY Satellite Reception Pipeline

> **Domain:** Software-Defined Radio and Satellite Imagery
> **Module:** 2 -- GOES-19 Direct Reception for Weather Game Integration
> **Through-line:** *A geostationary weather satellite 35,786 km above the equator transmits full-disk images of the Western Hemisphere every 30 minutes. The signal is unencrypted, the frequency is public, and the hardware to receive it costs less than a video game. The data is literally falling from the sky -- you just need to point a dish at it.*

---

## Table of Contents

1. [The Case for Direct Reception](#1-the-case-for-direct-reception)
2. [GOES-19: The Current Operational Satellite](#2-goes-19-the-current-operational-satellite)
3. [Hardware Requirements](#3-hardware-requirements)
4. [RF Signal Path and Link Budget](#4-rf-signal-path-and-link-budget)
5. [SatDump: The Decode Pipeline](#5-satdump-the-decode-pipeline)
6. [Image Products and Channels](#6-image-products-and-channels)
7. [Cloud Cover Extraction from Satellite Imagery](#7-cloud-cover-extraction-from-satellite-imagery)
8. [Precipitation Type Detection](#8-precipitation-type-detection)
9. [Automation for Continuous Reception](#9-automation-for-continuous-reception)
10. [Other Receivable Satellites](#10-other-receivable-satellites)
11. [Integration with the Weather Sidecar](#11-integration-with-the-weather-sidecar)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Case for Direct Reception

The Minecraft weather sidecar can operate entirely on API-sourced data (Open-Meteo, HRRR, GEOS-5). Every module in this mission works without a satellite dish. So why build one?

Three reasons. First, **ground truth verification.** API data is model output -- numerical weather prediction processed through physics equations and data assimilation. Satellite imagery is direct observation. When the HRRR model says cloud cover is 40% over Puget Sound, a GOES-19 visible image from the same hour either confirms or contradicts that prediction. The imagery provides a visual sanity check that no amount of model cross-validation can match [1].

Second, **educational value.** Receiving weather satellite imagery with a $30 SDR dongle is one of the most accessible and compelling demonstrations of radio engineering, orbital mechanics, and atmospheric science available to a Minecraft-playing audience. The mesh networking education goal of the broader Foxy's Playground infrastructure extends naturally to satellite reception: both are about building your own receivers for publicly available signals [2].

Third, **independence from the internet.** A GOES-19 ground station operates on a direct RF link to a geostationary satellite. No ISP, no API endpoint, no cloud service. During a major weather event -- precisely when real-time weather data is most valuable -- internet infrastructure may be degraded while the satellite continues transmitting uninterrupted. A local ground station provides a data source that fails only when the dish is physically obstructed or the satellite itself is offline [3].

```
GOES-19 DIRECT RECEPTION -- CONCEPT
================================================================

                        GOES-19
                     (35,786 km)
                    75.2 deg West
                         |
                    HRIT Signal
                    1694.1 MHz
                    927 kbps
                         |
          +--------------+--------------+
          |                             |
     [WiFi Grid Dish]            [Internet APIs]
     [LNA + RTL-SDR]            [Open-Meteo/HRRR]
     [SatDump Decode]
          |                             |
     Raw imagery                 Model output
     Cloud cover %               Weather code
     Precip zones                Temperature
     Storm cells                 Precipitation
          |                             |
          +---------- FUSION ----------+
                        |
               [Weather Sidecar]
               Enhanced confidence
               Imagery for display
```

> **SAFETY NOTE:** Receiving publicly broadcast satellite signals is legal in all jurisdictions. GOES-19 HRIT transmissions are unencrypted and intended for public reception. No amateur radio license is required. The RTL-SDR dongle operates in receive-only mode and does not transmit [2].

---

## 2. GOES-19: The Current Operational Satellite

GOES-19 (formerly GOES-U) is the fourth and final spacecraft in NOAA's GOES-R series. Launched June 25, 2024, and declared operational on April 7, 2025, GOES-19 replaced GOES-16 as the operational GOES-East satellite at approximately 75.2 degrees West longitude [4]. As a geostationary satellite, it maintains a fixed position in the sky relative to the ground -- no tracking hardware required.

### Orbital Parameters

| Parameter | Value |
|---|---|
| Designation | GOES-19 (GOES-East) |
| Longitude | ~75.2 degrees W |
| Altitude | 35,786 km (geosynchronous) |
| Inclination | Near-zero (geostationary) |
| Launch date | June 25, 2024 |
| Operational date | April 7, 2025 |
| Predecessor | GOES-16 (now standby) |
| Series | GOES-R (4th of 4 spacecraft) |

### Coverage and Imaging Cadence

| Mode | Coverage | Cadence |
|---|---|---|
| Full Disk | Western Hemisphere (pole to pole) | Every 10 minutes |
| CONUS | Continental US + southern Canada | Every 5 minutes |
| Mesoscale | 1000 x 1000 km region | Every 60 seconds (two regions) |

The mesoscale mode is particularly valuable for Minecraft weather integration: GOES-19 can image a PNW-sized region every minute, providing near-real-time cloud evolution tracking that API data cannot match.

### HRIT Transmission

GOES-19 downlinks data via High-Rate Information Transmission (HRIT) on L-band frequencies near 1694.1 MHz. The HRIT signal carries a subset of the full-resolution ABI (Advanced Baseline Imager) data at reduced but still useful resolution [5].

| HRIT Parameter | Value |
|---|---|
| Frequency | ~1694.1 MHz (L-band) |
| Bandwidth | 1.2 MHz |
| Data rate | 927 kbps |
| Modulation | BPSK |
| Error correction | Reed-Solomon + LDPC |
| Signal type | Continuous, unencrypted |
| Polarization | Linear |

---

## 3. Hardware Requirements

The hardware for GOES-19 HRIT reception has been extensively documented by the RTL-SDR and amateur radio communities [2]. The total cost for a basic station ranges from $80 to $150 using commercially available components.

### Bill of Materials

| Component | Typical Cost | Specification | Notes |
|---|---|---|---|
| RTL-SDR dongle | $30-$50 | RTL-SDR Blog V4 or V3; 0.1-1.75 GHz | R820T2 tuner; 8-bit ADC; USB 2.0 |
| WiFi grid parabolic dish | $20-$40 | 2.4 GHz panel antenna; ~24 dBi gain | Repurposed; feed centered for L-band |
| Low Noise Amplifier (LNA) | $30-$60 | Nooelec SAWbird+ GOES; 1688 MHz centered | Filtered LNA; pre-amp at antenna feed |
| Coaxial cable | $10-$20 | RG-6 or LMR-240; 1-3 meters | Minimize length; LNA near antenna reduces cable loss impact |
| SMA adapters | $5-$10 | SMA-to-F-type or SMA-to-N-type | Depends on LNA and antenna connector types |
| Mounting hardware | $0-$20 | Tripod, pole mount, or fixed bracket | Dish must point at ~30 deg elevation (varies by latitude) |
| **Total** | **$95-$200** | | |

### Antenna Pointing

Since GOES-19 is geostationary, the antenna points at a fixed position in the southern sky (from Northern Hemisphere locations). For a station in western Washington (~47 degrees N, ~122 degrees W):

| Parameter | Value |
|---|---|
| Azimuth | ~135 degrees (SE) |
| Elevation | ~30 degrees above horizon |
| Beamwidth needed | ~10-15 degrees (grid dish provides this) |

The pointing can be computed for any location using satellite tracking software or online calculators. Once aligned, the dish does not need to move -- the satellite stays in the same position indefinitely [2].

---

## 4. RF Signal Path and Link Budget

The RF signal path from GOES-19 to the SDR dongle determines whether the system will decode reliably. The key parameter is signal-to-noise ratio (SNR) at the receiver input.

### Signal Path

```
GOES-19 HRIT SIGNAL PATH
================================================================

  GOES-19 Transmitter
  |  EIRP: ~60 dBW
  |
  v
  Free Space Path Loss
  |  35,786 km at 1694 MHz
  |  Loss: ~187 dB
  |
  v
  Atmospheric Attenuation
  |  ~0.5 dB (clear sky at 30 deg elevation)
  |  ~1-3 dB (rain, moderate)
  |
  v
  Receive Antenna (WiFi Grid Dish)
  |  Gain: ~24 dBi
  |
  v
  SAWbird+ GOES LNA
  |  Gain: ~35 dB
  |  Noise Figure: ~0.5 dB
  |  SAW filter: 1688 MHz center, 30 MHz BW
  |
  v
  Coaxial Cable (1.5m RG-6)
  |  Loss: ~0.5 dB
  |
  v
  RTL-SDR V4 Dongle
  |  NF: ~4 dB (with external LNA, system NF dominated by LNA)
  |  Sample rate: 2.4 MSPS
  |  Bandwidth: >1.2 MHz needed
  |
  v
  SatDump Software Decode
  |  BPSK demodulation
  |  Reed-Solomon + LDPC error correction
  |  Output: calibrated imagery
```

### Link Budget Summary

| Parameter | Value |
|---|---|
| Satellite EIRP | ~60 dBW |
| Free space path loss (35,786 km, 1694 MHz) | -187.0 dB |
| Atmospheric loss (clear sky) | -0.5 dB |
| Receive antenna gain | +24 dBi |
| LNA gain | +35 dB |
| Cable loss | -0.5 dB |
| System noise temperature | ~75 K (LNA-dominated) |
| Required Eb/N0 for BPSK (BER 10^-5) | ~9.6 dB |
| **Margin** | **~6-8 dB** |

A 6-8 dB margin is comfortable. The system will decode reliably in clear sky conditions and maintain lock through moderate rain. Heavy rain (>25 mm/hr) at L-band can add 3+ dB of attenuation and may cause occasional frame drops [6].

---

## 5. SatDump: The Decode Pipeline

SatDump is the open-source software that handles the full decode pipeline from raw RF samples to calibrated satellite imagery [7]. It supports GOES-R series (HRIT and GRB), Meteor-M2, MetOp, and several other weather satellite platforms.

### Software Pipeline

```
SatDump DECODE PIPELINE
================================================================

  RTL-SDR USB Interface
  |  Raw I/Q samples at 2.4 MSPS
  |
  v
  BPSK Demodulation
  |  Carrier recovery
  |  Symbol timing recovery
  |  Output: soft decisions
  |
  v
  Viterbi / LDPC Decoding
  |  Forward error correction
  |
  v
  Reed-Solomon Error Correction
  |  Frame-level error detection/correction
  |  Output: clean data frames
  |
  v
  HRIT Protocol Decode
  |  LRIT/HRIT packet reassembly
  |  Image segment extraction
  |  Channel identification
  |
  v
  Radiometric Calibration
  |  Raw DN to brightness temperature
  |  Solar zenith correction (visible)
  |
  v
  Output Products
  |  GeoTIFF (georeferenced)
  |  PNG (display-ready)
  |  NetCDF (analysis-ready)
```

### SatDump Configuration for GOES-19

SatDump provides a GUI and command-line interface. For automated continuous reception on a headless Linux server (Raspberry Pi or GSD mesh node):

```
# Continuous live decode via RTL-SDR
satdump live goes_hrit \
  --source rtlsdr \
  --samplerate 2400000 \
  --frequency 1694100000 \
  --gain 40 \
  --output_folder /data/goes19/
```

SatDump handles clock drift correction, signal acquisition, and multi-frame image assembly automatically. Output images appear in the configured folder with timestamps and channel identification [7].

### System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| CPU | Raspberry Pi 4 (ARM Cortex-A72) | x86-64 with AVX2 |
| RAM | 2 GB | 4 GB |
| Storage | 10 GB (with rotation) | 50+ GB (archive) |
| OS | Linux (Debian/Ubuntu) | Linux (any modern distro) |
| USB | USB 2.0 (for RTL-SDR) | USB 3.0 |

A Raspberry Pi 4 is sufficient for continuous HRIT decode. On a GSD mesh node with a more capable CPU, SatDump runs as a lightweight background service alongside the weather sidecar and Minecraft server.

---

## 6. Image Products and Channels

GOES-19's Advanced Baseline Imager (ABI) captures 16 spectral channels, of which a subset is transmitted via HRIT [8]. The channels most relevant to weather game integration:

### ABI Channels via HRIT

| Channel | Wavelength | Resolution | Primary Use |
|---|---|---|---|
| 2 (Red Visible) | 0.64 um | 0.5 km (2 km via HRIT) | Cloud detection (daytime) |
| 7 (Shortwave IR) | 3.9 um | 2 km | Fog/low cloud detection |
| 8 (Upper-level WV) | 6.2 um | 2 km | Upper atmosphere moisture |
| 9 (Mid-level WV) | 6.9 um | 2 km | Mid-level moisture |
| 13 (Clean IR) | 10.3 um | 2 km | Cloud top temperature; night cloud detection |
| 14 (IR Longwave) | 11.2 um | 2 km | Cloud cover (day and night) |

### Derived Products for Minecraft

From these raw channels, Python post-processing can derive several weather variables:

1. **Cloud cover percentage** -- Threshold-based classification of Channel 14 brightness temperatures; pixels colder than the surface background are classified as cloud [9]
2. **Cloud top height** -- Brightness temperature to altitude conversion using standard atmosphere lapse rate
3. **Fog detection** -- Channel 7 minus Channel 14 difference technique; fog and low stratus produce a characteristic negative difference at night [10]
4. **Precipitation area estimation** -- Very cold cloud tops (brightness temperature < -40C) indicate deep convection with likely heavy precipitation [9]
5. **Storm cell identification** -- Mesoscale imagery at 1-minute cadence allows tracking of individual convective cells

---

## 7. Cloud Cover Extraction from Satellite Imagery

The primary value of GOES-19 imagery for the Minecraft sidecar is independent cloud cover estimation. The algorithm:

### Threshold-Based Cloud Detection

```
CLOUD DETECTION ALGORITHM
================================================================

  Input: Channel 14 (IR 11.2um) brightness temperature grid

  1. Determine clear-sky background temperature
     - Use 30-day running maximum brightness temperature
       per pixel location (clear sky = warmest)
     - Or use HRRR surface temperature as background

  2. Apply cloud threshold
     - If BT_pixel < BT_background - threshold: CLOUDY
     - threshold = 5K (conservative)
     - threshold = 3K (sensitive, detects thin cirrus)

  3. Compute cloud fraction
     - For each Minecraft zone bounding box:
       cloud_fraction = cloudy_pixels / total_pixels
     - Scale to 0-100%

  4. Compare with API cloud_cover value
     - If |satellite - api| > 20%: flag discrepancy
     - Log for operator review
```

### Day vs. Night Detection

Visible channel (Channel 2) provides the highest-resolution cloud detection during daytime but is unavailable at night. The IR channels (13, 14) work 24/7 but with lower contrast against warm surfaces during daytime [9]. The sidecar uses a solar zenith angle check to select the appropriate algorithm:

- **Solar zenith < 80 degrees:** Use visible + IR composite (highest accuracy)
- **Solar zenith 80-90 degrees:** Use IR-only (twilight transition)
- **Solar zenith > 90 degrees:** Use IR-only (nighttime)

---

## 8. Precipitation Type Detection

GOES-19 imagery alone cannot directly measure precipitation at the surface. However, multi-channel analysis provides strong indicators:

### Cloud Top Temperature to Precipitation Mapping

| Cloud Top BT | Estimated Top Height | Precipitation Likelihood |
|---|---|---|
| > 0 C (273 K) | < 2 km | Low cloud; drizzle possible |
| -10 to 0 C | 2-4 km | Moderate cloud; light rain/snow likely |
| -20 to -10 C | 4-7 km | Thick nimbostratus; moderate precipitation |
| -40 to -20 C | 7-10 km | Deep stratiform; continuous precipitation |
| < -40 C (233 K) | > 10 km | Deep convection; heavy rain, possible hail/thunder |

These thresholds are calibrated against ground-based radar and rain gauge networks [9]. For Minecraft integration, satellite-derived precipitation estimates serve as confidence adjustments to API-sourced weather codes, not replacements.

### Fog Detection via Channel Differencing

The Channel 7 minus Channel 14 difference technique exploits the emissivity difference between water droplets and the clear atmosphere at shortwave vs. longwave IR wavelengths [10]. At night, fog and low stratus produce a negative brightness temperature difference (Channel 7 colder than Channel 14), while clear surfaces produce a positive or near-zero difference.

```
fog_index = BT_ch7 - BT_ch14
if fog_index < -2K and BT_ch14 > 270K:
    classification = "fog_or_low_stratus"
```

This technique is particularly valuable for PNW coastal fog detection, where marine fog banks can form rapidly and are poorly resolved by coarser models.

---

## 9. Automation for Continuous Reception

For integration with the weather sidecar, the GOES-19 ground station must run unattended and continuously.

### Systemd Service Configuration

```
# /etc/systemd/system/goes19-recv.service
[Unit]
Description=GOES-19 HRIT Reception via SatDump
After=network.target

[Service]
Type=simple
User=weather
ExecStart=/usr/local/bin/satdump live goes_hrit \
  --source rtlsdr \
  --samplerate 2400000 \
  --frequency 1694100000 \
  --gain 40 \
  --output_folder /data/goes19/live/
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
```

### Image Rotation and Archiving

New images arrive approximately every 10 minutes (full disk) and every 5 minutes (CONUS). At roughly 2-5 MB per image set, daily storage requirements are 1-3 GB. A rotation policy:

- **Keep 24 hours** of full-resolution imagery
- **Keep 7 days** of derived products (cloud cover grids)
- **Archive monthly** composites and notable events
- **Total disk requirement:** 10-50 GB with rotation

### Python Post-Processing Cron

```
# Run cloud cover extraction every 10 minutes
*/10 * * * * /usr/local/bin/python3 /opt/weather/extract_cloud_cover.py \
  --input /data/goes19/live/ \
  --output /data/weather/satellite/ \
  --zones /etc/weather/zone_config.yaml
```

The extraction script processes the most recent imagery set, computes per-zone cloud cover, and writes a JSON file that the weather sidecar reads during its next fetch cycle.

---

## 10. Other Receivable Satellites

GOES-19 is the primary target, but the amateur satellite reception community has documented several other platforms compatible with RTL-SDR hardware [2].

### Comparison of Receivable Weather Satellites

| Satellite | Type | Frequency | Equipment | Resolution | Coverage |
|---|---|---|---|---|---|
| GOES-19 | Geostationary | 1694 MHz (L-band) | Dish + LNA + RTL-SDR | 2 km (HRIT) | Western Hemisphere |
| GOES-18 | Geostationary | 1694 MHz (L-band) | Same as GOES-19 | 2 km (HRIT) | Pacific/West |
| Meteor-M2 N3 | Polar LEO | 137 MHz (VHF) | V-dipole antenna | 4 km (LRPT) | Global (passes) |
| MetOp-B/C | Polar LEO | 1701 MHz (L-band) | Tracking dish | 1 km (AHRPT) | Global (passes) |
| Fengyun-3 | Polar LEO | 1704 MHz (L-band) | Tracking dish | 1 km | Global (passes) |

### Note on Decommissioned NOAA APT Satellites

The NOAA-15, NOAA-18, and NOAA-19 polar orbiting satellites that transmitted APT (Automatic Picture Transmission) on 137 MHz were the traditional entry point for amateur satellite reception. As of 2025, all three have been decommissioned or have severely degraded sensors [11]. New projects should target GOES-R series (geostationary, no tracking) or Meteor-M2 (polar, simple V-dipole antenna).

---

## 11. Integration with the Weather Sidecar

The GOES-19 ground station is an **optional enrichment** for the weather sidecar, not a requirement.

### Integration Architecture

```
SATELLITE INTEGRATION -- OPTIONAL MODULE
================================================================

  [SatDump continuous decode]
        |
        v
  [Cloud cover extraction script]
  (runs every 10 minutes)
        |
        v
  /data/weather/satellite/latest.json
  {
    "timestamp": "2026-03-26T12:10:00Z",
    "source": "goes19_hrit",
    "zones": {
      "pnw-coast": {
        "cloud_cover_pct": 82,
        "fog_detected": true,
        "deep_convection": false,
        "confidence": 0.85
      },
      "cascades": {
        "cloud_cover_pct": 95,
        "fog_detected": false,
        "deep_convection": false,
        "confidence": 0.90
      }
    }
  }
        |
        v
  [Weather sidecar reads satellite JSON]
  - Fuses with API data
  - satellite cloud_cover used as confidence weight
  - Fog detection overrides API if satellite confidence > 0.8
  - Deep convection flag adjusts thunder probability
```

### Fusion Logic

The sidecar does not replace API data with satellite data. Instead, it adjusts confidence:

1. **Cloud cover:** If satellite and API agree within 15%, use API value (higher precision). If they disagree by more than 25%, log a discrepancy and use the satellite value (direct observation).
2. **Fog:** If satellite detects fog and API does not report WMO codes 45-48, the sidecar may override to enable fog effects in the game. Satellite fog detection at L-band resolution is well-validated for PNW maritime conditions [10].
3. **Deep convection:** If satellite identifies cloud tops below -40 C in a zone and the API has no thunder probability, the sidecar escalates the thunder probability to 30% as a precaution.

> **SAFETY NOTE:** Satellite-derived estimates are supplementary and should never be the sole basis for weather state decisions. The fusion logic must always have a valid API response as the foundation; satellite data adjusts confidence, not base classification.

---

## 12. Cross-References

> **Related:** [Global Weather Data Sources](01-global-weather-data-sources.md) -- the API data sources that satellite imagery validates and enriches. [Microclimate Simulation](04-microclimate-simulation.md) -- consumes the fused weather state that satellite data influences. [GSD Mesh Integration](05-gsd-mesh-integration.md) -- the ground station runs on the same GSD mesh node as the sidecar.

**Series cross-references:**
- **SPA (Space Systems):** GOES-19 orbital parameters, L-band communications, and satellite architecture
- **MCR (Microcontrollers):** RTL-SDR hardware interfacing and USB peripheral management
- **SNL (Signal & Light):** RF signal processing, demodulation, and error correction concepts
- **BPS (Bioregional Profiles):** Satellite-derived cloud cover contributes to regional weather characterization
- **CMH (Climate History):** GOES-R series continuity with earlier GOES satellites for historical comparison
- **VAV (Vacuum Tubes to VLSI):** ADC technology in the RTL-SDR dongle and satellite sensor digitization

---

## 13. Sources

1. NOAA. "Geostationary Operational Environmental Satellites (GOES)." National Environmental Satellite, Data, and Information Service, 2026. https://www.nesdis.noaa.gov/current-satellite-missions/currently-flying/goes
2. RTL-SDR Blog. "GOES 16/17 and GK-2A Weather Satellite Reception -- Comprehensive Tutorial." 2019/2025. https://www.rtl-sdr.com/rtl-sdr-com-goes-16-17-and-gk-2a-weather-satellite-reception-comprehensive-tutorial/
3. Riehl, H. "Geostationary Satellite Meteorology." Academic Press, 1983.
4. NOAA NESDIS. "GOES-19 Operational Status." 2025. https://www.nesdis.noaa.gov/goes-19
5. NOAA. "GOES-R Series HRIT/EMWIN Product Description." GOES-R Series Product Definition and User Guide, 2024.
6. Ippolito, L.J. "Radiowave Propagation in Satellite Communications." Van Nostrand Reinhold, 1986.
7. SatDump Project. "Open-Source Satellite Data Processing." GitHub, 2023-2026. https://github.com/SatDump/SatDump
8. Schmit, T.J., Gunshor, M.M., Menzel, W.P., Gurka, J.J., Li, J., and Bachmeier, A.S. "Introducing the Next-Generation Advanced Baseline Imager on GOES-R." *Bulletin of the American Meteorological Society*, 86(8), 1079-1096, 2005.
9. Rossow, W.B. and Schiffer, R.A. "Advances in Understanding Clouds from ISCCP." *Bulletin of the American Meteorological Society*, 80(11), 2261-2287, 1999.
10. Ellrod, G.P. "Advances in the Detection and Analysis of Fog at Night Using GOES Multispectral Infrared Imagery." *Weather and Forecasting*, 10(3), 606-619, 1995.
11. NOAA. "NOAA Polar-Orbiting Satellites: End of Mission Status." Office of Satellite and Product Operations, 2025.
12. ben.land. "Receiving and Decoding Transmissions from Weather Satellites." 2025. https://ben.land/post/2025/05/31/receiving-weather-satellites/
13. Nooelec. "SAWbird+ GOES Filtered Low Noise Amplifier." Product Documentation, 2024.
14. RTL-SDR Blog. "RTL-SDR Blog V4 Technical Specifications." 2024.
15. NASA GOES-R Series. "ABI Band Quick Reference Guide." 2024. https://www.goes-r.gov/education/ABI-bands-quick-info.html

---

*Minecraft Real-Time Weather -- Module 2: DIY Satellite Reception Pipeline. A $100 ground station, an unencrypted signal from geostationary orbit, and the willingness to look up. The weather data is already broadcasting -- all you need is a receiver.*
