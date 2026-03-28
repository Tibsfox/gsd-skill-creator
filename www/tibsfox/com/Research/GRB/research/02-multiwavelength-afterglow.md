# Multi-wavelength Afterglow

> **Domain:** High-Energy Astrophysics
> **Module:** 2 -- X-Ray Localization Chain, Temporal & Spectral Analysis
> **Through-line:** *The 27x improvement in positional accuracy between Swift/XRT and Chandra/ACIS-S was decisive: it changed the most probable host from a bright galaxy at 130 kpc offset to a faint source at subarcsecond offset.*

---

## Table of Contents

1. [X-Ray Localization Chain](#1-x-ray-localization-chain)
2. [X-Ray Temporal and Spectral Analysis](#2-x-ray-temporal-and-spectral-analysis)
3. [Optical and NIR Non-detections](#3-optical-and-nir-non-detections)
4. [Host Identification](#4-host-identification)
5. [Sources](#5-sources)

---

## 1. X-Ray Localization Chain

| Instrument | Epoch (T0+) | Position | Error radius |
|------------|------------|----------|--------------|
| Swift/XRT | 1.8 days | RA=5h19m01.79s, Dec=-47d53'34.9" | 6.4" (90%) |
| Chandra/ACIS-S | 4.7 days | RA=5h19m01.53s, Dec=-47d53'32.4"; 6.7 sigma | 0.24" (68%) |

The 27x improvement in positional accuracy is decisive: a 2" XRT circle yields Pcc > 50% favoring bright galaxy G1 at 130 kpc offset; the Chandra position yields Pcc ~ 4% for faint G* at subarcsecond offset.

## 2. X-Ray Temporal and Spectral Analysis

| Parameter | Value | Source |
|-----------|-------|--------|
| Photon index Gamma | 1.3 +/- 0.2 | XMM pn spectrum |
| Spectral slope beta_X | 0.3 +/- 0.2 | Slow-cooling, nu_c > nu_X |
| Electron index p | ~2.1-2.2 | Closure relations satisfied |
| Temporal decay alpha | 1.13 +0.35/-0.27 | MCMC, combined light curve |
| Jet break lower limit | t_j > 6 days (90% CL) | XMM-Newton constraint |
| Galactic N_H | 2.45 x 10^20 cm^-2 | Fixed (Willingale et al. 2013) |

## 3. Optical and NIR Non-detections

Optical afterglow not detected to 3-sigma limits at any epoch. VLT/FORS2 limits: R > 24.1-25.0 AB mag. A faint source at the Chandra position detected in late-time VLT (R = 26.3 +/- 0.3 AB mag at T0 + 36.75 days) and HST WFC3/F160W (26.00 +/- 0.10 AB mag at T0 + 164.9 days). Image subtraction confirms these as the host G*, not afterglow.

## 4. Host Identification

Chandra's subarcsecond localization is currently the only tool providing positions independent of optical brightness for faint-afterglow events.

## 5. Sources

- Dichiara et al. 2026, ApJL, 999, L42
- Chandra Data Collection: doi:10.25574/cdc.510
- HST Data Archive: doi:10.17909/xded-jp95

> **Related:** [Burst Properties](01-burst-properties.md), [Host Environment](03-host-environment.md)
