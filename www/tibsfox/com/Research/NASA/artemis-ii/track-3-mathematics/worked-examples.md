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
Given: Earth-Moon distance = 384,400 km, c = 299,792.458 km/s

One-way delay = 384,400 / 299,792.458 = 1.282 seconds
Round-trip    = 2.565 seconds

At closest approach (6,513 km from surface):
  Distance from Earth = 384,400 - 6,513 = 377,887 km
  One-way delay = 377,887 / 299,792.458 = 1.260 seconds
```

## 3. TLI Delta-v (Tsiolkovsky)

```
Given: Orion + ESM mass at TLI = 26,520 kg
       ESM OMS engine Isp = 316 s (AJ10-190)
       Required Δv for TLI ≈ 3,150 m/s

Δv = Isp × g₀ × ln(m₀/mf)
3,150 = 316 × 9.81 × ln(26,520/mf)
ln(26,520/mf) = 1.016
26,520/mf = 2.762
mf = 9,602 kg
Propellant consumed = 26,520 - 9,602 = 16,918 kg
```

*More examples added as mission data becomes available.*
