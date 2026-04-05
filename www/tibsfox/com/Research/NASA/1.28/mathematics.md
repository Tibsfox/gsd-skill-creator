# Mission 1.28 -- Ranger 3: The Math of Missing

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Ranger 3 (January 26, 1962)
**Primary TSPB Layer:** 4 (Vector Calculus -- Trajectory Error Propagation, Midcourse Correction)
**Secondary Layers:** 3 (Trigonometry -- Flyby Geometry, Angular Miss), 7 (Information Systems -- Sign Errors in Control Loops), 1 (Unit Circle -- Phase Inversion in Feedback Systems)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Guidance Error Propagation (Layer 4, Section 4.28)

### Table

| Parameter | Symbol | Units | Ranger 3 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | January 26, 1962, 20:30 UTC |
| Launch vehicle | -- | -- | Atlas-Agena B (Atlas 121D / Agena B) |
| Operating agency | -- | -- | JPL / NASA |
| Spacecraft mass | m_sc | kg | 329.8 (with capsule) |
| Planned trajectory | -- | -- | Lunar impact |
| Actual trajectory | -- | -- | Lunar flyby + heliocentric orbit |
| Injection velocity error | Δv | m/s | ~375 (excess) |
| Midcourse correction applied | Δv_mc | m/s | ~34 |
| Miss distance (closest approach) | d_miss | km | 36,793 |
| Transit time to closest approach | t_CA | hr | ~66 |
| Trajectory sensitivity | ∂r/∂v | km/(m/s) | ~98 |
| Error source 1 | -- | -- | Booster autopilot sign inversion |
| Error source 2 | -- | -- | Guidance computer trajectory computation |

### Formulas

**Error Propagation Along a Trajectory:**

For a ballistic trajectory from Earth to the Moon, the miss distance at the target is approximately proportional to the velocity error at injection:

```
Δr_miss ≈ (∂r/∂v) × Δv

where:
  Δr_miss = position error at closest approach (km)
  ∂r/∂v  = trajectory sensitivity (km per m/s)
  Δv      = velocity error at injection (m/s)

For Ranger 3:
  Δr_miss ≈ 98 × 375 = 36,750 km
  Actual:                36,793 km
```

This linear approximation works remarkably well because the trajectory sensitivity is nearly constant along the specific geometry of Ranger 3's flyby. For different flyby geometries, the sensitivity varies — but for first-order analysis, the linear model captures the essential physics: **small velocity errors at launch become large position errors at the target.**

**The Midcourse Correction Deficit:**

The midcourse correction reduces the miss distance by the same sensitivity:

```
Δr_corrected ≈ Δr_miss - (∂r/∂v) × Δv_mc

Δr_before = 98 × 375 ≈ 36,750 km (without correction)
Δr_after  = 98 × (375 - 34) ≈ 98 × 341 ≈ 33,418 km (with correction)

The actual miss (36,793 km) was larger than this simple estimate because
the midcourse correction was not applied in the optimal direction and
the sensitivity is slightly different for the correction geometry vs. the
injection geometry. The correction helped. It was not enough.
```

**Required Midcourse Budget:**

For a given injection error distribution, the midcourse motor must be sized to the worst-case:

```
Δv_mc_required ≥ max(Δv_injection_error)

For Ranger 3's actual error:  Δv_mc_required ≥ 375 m/s
Ranger 3's actual capability: Δv_mc_available = 50 m/s
Deficit:                      325 m/s (motor 7.5x too small)
```

### Worked Example: The Cost of a Sign

```python
import numpy as np
import matplotlib.pyplot as plt

# Ranger 3 guidance error propagation
# ====================================

# Physical parameters
mu = 3.986e14          # Earth GM (m^3/s^2)
R_earth = 6.371e6     # Earth radius (m)
d_moon = 3.844e8      # Earth-Moon distance (m)

# Ranger 3 trajectory parameters
h_park = 185e3         # Parking orbit altitude (m)
r_park = R_earth + h_park
v_park = np.sqrt(mu / r_park)      # Parking orbit velocity
T_park = 2 * np.pi * np.sqrt(r_park**3 / mu)  # Parking orbit period

# Planned injection parameters
v_planned = 10880      # m/s (planned injection velocity)
dv_error = 375         # m/s (excess velocity from guidance error)
v_actual = v_planned + dv_error

# Trajectory sensitivity (empirical from Ranger 3 analysis)
sensitivity = 98       # km per m/s of velocity error

# Miss distance calculation
miss_uncorrected = sensitivity * dv_error
dv_midcourse = 34      # m/s (midcourse correction applied)
miss_corrected = sensitivity * (dv_error - dv_midcourse)
miss_actual = 36793    # km (observed)

print("RANGER 3 GUIDANCE ERROR ANALYSIS")
print("=" * 50)
print(f"Parking orbit: {h_park/1e3:.0f} km altitude, v = {v_park:.0f} m/s")
print(f"Parking orbit period: {T_park/60:.1f} minutes")
print(f"")
print(f"Planned injection velocity: {v_planned} m/s")
print(f"Actual injection velocity:  {v_actual} m/s")
print(f"Velocity error:             +{dv_error} m/s (excess)")
print(f"")
print(f"Trajectory sensitivity: {sensitivity} km/(m/s)")
print(f"")
print(f"Miss distance (uncorrected): {miss_uncorrected:,.0f} km")
print(f"Midcourse correction:        {dv_midcourse} m/s")
print(f"Miss distance (corrected):   {miss_corrected:,.0f} km")
print(f"Miss distance (actual):      {miss_actual:,.0f} km")
print(f"")
print(f"Midcourse motor capacity:    50 m/s")
print(f"Error magnitude:             {dv_error} m/s")
print(f"Motor deficit:               {dv_error - 50} m/s")
print(f"Motor provided {50/dv_error*100:.1f}% of what was needed.")
print(f"")
print(f"The sign inversion added {dv_error} m/s.")
print(f"That is {miss_actual:,} km of empty space between")
print(f"the cameras and the Moon they were built to photograph.")

# Sensitivity sweep: miss distance vs. velocity error
dv_range = np.linspace(0, 500, 100)
miss_range = sensitivity * dv_range

fig, ax = plt.subplots(1, 1, figsize=(10, 6))
ax.plot(dv_range, miss_range, 'b-', linewidth=2, label='Miss distance')
ax.axhline(y=0, color='gray', linestyle='-', alpha=0.3)
ax.axvline(x=375, color='r', linestyle='--', alpha=0.7, label=f'Ranger 3: {dv_error} m/s')
ax.axhline(y=36793, color='r', linestyle=':', alpha=0.5)
ax.axvline(x=50, color='g', linestyle='--', alpha=0.7, label='Midcourse motor capacity: 50 m/s')
ax.fill_between([0, 50], [0, 0], [miss_range[10], miss_range[10]],
                alpha=0.1, color='green', label='Correctable range')
ax.set_xlabel('Injection Velocity Error (m/s)', fontsize=12)
ax.set_ylabel('Miss Distance at Moon (km)', fontsize=12)
ax.set_title('Ranger 3: Velocity Error → Miss Distance', fontsize=14)
ax.legend(fontsize=10)
ax.set_xlim(0, 500)
ax.set_ylim(0, 50000)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('ranger3_error_propagation.png', dpi=150)
plt.show()
```

---

## Deposit 2: Sign Errors in Control Systems (Layer 7, Section 7.28)

### The Feedback Sign Problem

The most dangerous error in a control system is a sign error. Not a magnitude error -- if a component produces 90% or 110% of the expected output, the system degrades gracefully. But if a component produces -100% of the expected output, the system diverges. The control loop goes from stable to unstable. The correction amplifies the error instead of reducing it.

**The general feedback system:**

```
Command signal → [+] → Controller → Plant → Output
                  ↑                           |
                  └───── Feedback × K ────────┘

Stable (negative feedback): K < 0
  error(t+1) = error(t) × (1 + K), where |1+K| < 1
  → error converges to zero

Unstable (positive feedback): K > 0
  error(t+1) = error(t) × (1 + K), where |1+K| > 1
  → error diverges to infinity
```

**Ranger 3's specific sign error:**

```
Pitch rate → [+] → Autopilot switching amp → Pitch correction
                ↑                                    |
                └──── Rate feedback × K_rate ────────┘

Intended: K_rate = -0.5 (negative feedback, rate damping)
  Pitch-up rate → correction commands pitch-down → rate reduced

Actual: K_rate = +0.5 (positive feedback, rate amplification)
  Pitch-up rate → correction commands MORE pitch-up → rate increased
  (Caught by guidance computer before divergence, but net velocity error accumulated)
```

### Worked Example: Negative vs. Positive Feedback

```python
import numpy as np

# Sign error in feedback control system
# Demonstrates Ranger 3's autopilot sign inversion

K_correct = -0.5   # Negative feedback (intended)
K_inverted = +0.5  # Positive feedback (actual - sign inverted!)
theta_0 = 2.0      # Initial pitch rate error (deg/s)
steps = 15

print("RANGER 3 AUTOPILOT SIGN INVERSION")
print("=" * 55)
print(f"{'Step':>4} | {'Correct (K=-0.5)':>18} | {'Inverted (K=+0.5)':>18}")
print("-" * 55)

theta_c = theta_0
theta_i = theta_0

for n in range(steps):
    print(f"{n:4d} | {theta_c:18.6f}° | {theta_i:18.6f}°")
    theta_c = theta_c * (1 + K_correct)
    theta_i = theta_i * (1 + K_inverted)

print("-" * 55)
print(f"Correct sign: error → 0 (converges, Moon impact)")
print(f"Inverted sign: error → ∞ (diverges, 36,793 km miss)")
print(f"")
print(f"After {steps} steps with inverted sign:")
print(f"  Error grew from {theta_0}° to {theta_0 * (1.5)**(steps-1):.0f}°")
print(f"  Factor of {(1.5)**(steps-1):.0f}x amplification")
print(f"")
print(f"One sign. Plus instead of minus.")
print(f"The difference between touching the Moon")
print(f"and orbiting the Sun forever.")
```

---

## Deposit 3: Flyby Geometry and Angular Miss (Layer 3, Section 3.28)

### The Angular Error

Ranger 3's miss can be expressed as an angular error at Earth -- the angle between the intended trajectory and the actual trajectory at the point of injection. For a target at the Moon's distance:

```
θ_miss = arctan(Δr_miss / d_moon)
       = arctan(36,793 / 384,400)
       = arctan(0.0957)
       = 5.47°

Five and a half degrees. That is the angular error at Earth that produces
a miss of 36,793 km at the Moon. The inverse-square sensitivity:
at half the Moon's distance, the same angular error produces half the miss.
At twice the Moon's distance, twice the miss.
```

### The Midcourse Correction Geometry

The midcourse correction is most effective when applied perpendicular to the velocity vector (cross-track correction). A correction applied along the velocity vector (in-track correction) changes the arrival time but not the miss distance (to first order). The optimal correction direction depends on the geometry of the error:

```
For a velocity magnitude error (Ranger 3's primary error):
  Correction is best applied as a braking maneuver (opposite to velocity)
  Δv_correction = Δv_error × cos(α)
  where α is the angle between the correction direction and the velocity vector

For a velocity direction error:
  Correction is best applied perpendicular to the velocity
  Δv_correction = Δv_error × sin(α)
```

### Worked Example: Angular Error and Distance Sensitivity

```python
import numpy as np

# Ranger 3 angular error analysis

d_moon = 384400  # km (Earth-Moon distance)
miss = 36793     # km (Ranger 3 miss distance)

# Angular error at injection
theta_rad = np.arctan(miss / d_moon)
theta_deg = np.degrees(theta_rad)

print("RANGER 3 ANGULAR ERROR ANALYSIS")
print("=" * 50)
print(f"Earth-Moon distance: {d_moon:,} km")
print(f"Miss distance: {miss:,} km")
print(f"Angular error at Earth: {theta_deg:.2f}°")
print(f"")

# How angular error maps to miss distance at different ranges
ranges_km = [100000, 200000, 384400, 500000, 1000000]
print(f"Miss distance vs. range (at {theta_deg:.2f}° error):")
print(f"{'Range (km)':>15} | {'Miss (km)':>12}")
print("-" * 35)
for r in ranges_km:
    miss_at_r = r * np.tan(theta_rad)
    print(f"{r:>15,} | {miss_at_r:>12,.0f}")

print(f"")
print(f"At the Moon: {miss:,} km miss")
print(f"At Mars (closest, ~55M km): {55e6 * np.tan(theta_rad):,.0f} km miss")
print(f"")
print(f"5.47 degrees. The width of three fingers held at arm's length.")
print(f"At 384,400 km, three fingers wide is 36,793 km of nothing.")
```

---

## Deposit 4: Fog Capture as Passive Interception (Layer 3, Section 3.28-org)

### The Lichen Antenna Problem

Ramalina menziesii's fog capture is mathematically identical to an antenna's signal capture. Both are passive interception of energy (water mass / electromagnetic energy) from a diffuse medium (fog / radio noise floor).

```
Fog capture:
  Q_water = η × A_p × v_fog × LWC
  where Q = capture rate (g/s), η = efficiency, A_p = projected area,
  v_fog = wind speed, LWC = liquid water content (g/m³)

Antenna capture:
  P_signal = A_eff × S
  where P = received power (W), A_eff = effective aperture (m²),
  S = power flux density (W/m²)

Both: Rate = Efficiency × Area × Flux
The mathematics is identical. The medium is different.
```

### Worked Example: Lichen vs. Antenna

```python
import numpy as np

# Fog capture by Ramalina vs. signal capture by antenna
# Same mathematics, different medium

print("PASSIVE INTERCEPTION: LICHEN vs. ANTENNA")
print("=" * 55)

# Lichen fog capture
eta_lichen = 0.5        # capture efficiency
A_lichen = 0.05         # m^2 projected area
v_fog = 2.0             # m/s wind speed
LWC = 0.25              # g/m^3 liquid water content
Q_water = eta_lichen * A_lichen * v_fog * LWC  # g/s

# Ranger 3 antenna signal capture
A_antenna = 0.8         # m^2 effective aperture (estimated)
# Signal flux from DSN at lunar distance
P_tx = 0.5              # W transmitter power (Ranger 3 S-band)
d_lunar = 3.844e8       # m
S_flux = P_tx / (4 * np.pi * d_lunar**2)  # W/m^2
P_rx = A_antenna * S_flux  # W received

print(f"LICHEN (Ramalina menziesii):")
print(f"  Projected area: {A_lichen*1e4:.0f} cm²")
print(f"  Fog flux: {v_fog * LWC:.2f} g/(m²·s)")
print(f"  Capture rate: {Q_water*1000:.2f} mg/s = {Q_water*3600:.0f} g/hr")
print(f"")
print(f"ANTENNA (Ranger 3 high-gain):")
print(f"  Effective aperture: {A_antenna:.1f} m²")
print(f"  Signal flux: {S_flux:.2e} W/m²")
print(f"  Received power: {P_rx:.2e} W")
print(f"")
print(f"Both equations: Rate = Efficiency × Area × Flux")
print(f"The lichen catches fog. The antenna catches photons.")
print(f"Both miss when the flux drops below the threshold.")
print(f"No fog → no water → dormancy.")
print(f"No signal → no data → silence.")
print(f"36,793 km of nothing looks the same to both.")
```

---

## Resonance Statement

The mathematics of Ranger 3 is the mathematics of error propagation: small deviations at the origin become large misses at the target, and the sign of the feedback determines whether errors converge to zero or diverge to infinity. Plus instead of minus. The lichen hangs in the fog belt and captures what the air brings. The spacecraft flew past the Moon and captured nothing. The math is the same: rate equals efficiency times area times flux. When the flux is there, both organisms thrive. When the flux misses -- fog that stays offshore, a trajectory aimed 5.47 degrees wrong -- both organisms wait in silence for a chance that, for Ranger 3, will never come again.
