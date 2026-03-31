# Worked Examples — Artemis II Parameters

*Each example uses REAL mission parameters. Populated during and after mission.*

## 1. HEO Orbital Period (vis-viva)

```
Given: apogee altitude = 70,000 km, perigee altitude = 200 km
Earth radius = 6,371 km
μ_Earth = 398,600 km³/s²

a = (r_apogee + r_perigee) / 2
  = (76,371 + 6,571) / 2
  = 41,471 km

T = 2π √(a³/μ)
  = 2π √(41,471³ / 398,600)
  = 2π √(7.131 × 10¹³ / 398,600)
  = 2π × 133,740
  = 84,030 s
  ≈ 23.3 hours ✓ (matches NASA's ~23.5 hour HEO period)
```

## 2. Light Delay at Lunar Distance

```
Given: Earth-Moon distance = 384,400 km (center-to-center)
       Moon radius = 1,737 km
       c = 299,792.458 km/s

At mean lunar distance:
  One-way delay = 384,400 / 299,792.458 = 1.282 seconds
  Round-trip    = 2.565 seconds

At closest approach (6,513 km from Moon's FAR SIDE surface):
  NOTE: Flyby passes BEHIND the Moon. Orion is farther from Earth, not closer.
  Distance from Earth = 384,400 + 1,737 + 6,513 = 392,650 km (center-to-center)
  One-way delay = 392,650 / 299,792.458 = 1.310 seconds
  Round-trip    = 2.619 seconds
  Communication blackout possible behind the Moon (line-of-sight blocked)

At max distance (7,600 km beyond Moon):
  Distance from Earth ≈ 384,400 + 7,600 = 392,000 km
  One-way delay = 392,000 / 299,792.458 = 1.307 seconds
```

## 3. ESM TLI Burn (Tsiolkovsky)

```
Artemis II TLI staging:
  ICPS (RL10C-2, Isp=462s) → orbit insertion + perigee raise to HEO
  ESM OMS (AJ10-190, Isp=316s) → TLI burn from HEO to lunar transfer

Given: Orion + ESM mass at TLI = 26,520 kg
       ESM OMS engine Isp = 316 s (AJ10-190)
       ESM total Δv budget = 1,050 m/s (all post-ICPS maneuvers)
       TLI Δv ≈ 800-900 m/s (from HEO, not from LEO)
       (Remaining ~150-250 m/s for mid-course corrections and entry trim)

Δv = Isp × g₀ × ln(m₀/mf)
900 = 316 × 9.81 × ln(26,520/mf)
ln(26,520/mf) = 0.2904
26,520/mf = 1.337
mf = 19,836 kg
Propellant consumed for TLI ≈ 6,684 kg

NOTE: The 3,150 m/s TLI Δv cited in some sources is from LEO.
From HEO (70,000 km apogee), the required Δv is much less because
the spacecraft is already at high energy. This is why the HEO parking
orbit exists — it reduces the ESM's TLI burn requirement.
```

## 4. O2O Optical Link Budget

```
Given: O2O telescope aperture = 100 mm (4 inches)
       Wavelength = ~1550 nm (telecom IR)
       Distance = 384,400 km
       Achieved downlink = 260 Mbps

Diffraction-limited beam divergence:
  θ = 1.22 × λ/D = 1.22 × 1550e-9 / 0.1 = 18.9 μrad

Beam footprint at Moon distance:
  footprint = 384,400 × 18.9e-6 = 7.27 km diameter

vs S-band radio (2.2 GHz, same aperture):
  λ_radio = c/f = 0.136 m
  θ_radio = 1.22 × 0.136 / 0.1 = 1.66 rad (unfocused — needs larger dish)
  For 3m dish: θ = 1.22 × 0.136 / 3 = 0.055 rad
  footprint = 384,400 × 0.055 = 21,142 km diameter

Optical beam is 2,900× tighter than 3m S-band dish.
This concentration is why 260 Mbps is achievable with milliwatt power.
Shannon capacity: C = B × log₂(1 + SNR)
Higher photon density at receiver → higher SNR → higher capacity.
```

*More examples added as mission data becomes available.*
