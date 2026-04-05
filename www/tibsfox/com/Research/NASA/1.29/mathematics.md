# Mission 1.29 -- Ranger 4: The Math of Arriving Dead

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Ranger 4 (April 23, 1962)
**Primary TSPB Layer:** 7 (Information Systems Theory -- Single-Point Failure, Shannon Capacity of a Dead Channel)
**Secondary Layers:** 4 (Vector Calculus -- Lunar Impact Trajectory), 2 (Pythagorean Theorem -- Impact Energy), 5 (Set Theory -- Failure Mode Classification)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: The Information Content of a Carrier Signal (Layer 7, Section 7.4)

### Table

| Parameter | Symbol | Units | Ranger 4 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | April 23, 1962, 20:50:00 UTC |
| Launch vehicle | -- | -- | Atlas-Agena B |
| Spacecraft mass | m_sc | kg | 331 |
| Carrier frequency | f_c | MHz | 960 |
| Transmitter power (backup) | P_tx | W | ~0.1 (estimate) |
| Telemetry data rate (design) | R_design | bps | ~500 (full telemetry) |
| Telemetry data rate (actual) | R_actual | bps | 0 (carrier only) |
| Tracking data (Doppler) | -- | -- | Yes (frequency shift) |
| Science data returned | -- | -- | None |
| Transfer duration | t_transfer | hr | ~64 |
| Impact velocity | v_impact | km/s | 2.67 |
| Impact coordinates | -- | -- | ~15.5°S, 130.7°W (far side) |
| Impact kinetic energy | E_k | J | ~1.18 × 10⁹ |

### Formulas

**Shannon Channel Capacity:**

The maximum rate at which information can be transmitted over a noisy channel:

```
C = B * log2(1 + S/N)

where:
  C = channel capacity (bits/second)
  B = bandwidth (Hz)
  S = signal power (watts)
  N = noise power (watts)
  S/N = signal-to-noise ratio (dimensionless)
```

**Ranger 4's actual information content:**

The carrier signal transmitted by Ranger 4 was an unmodulated continuous wave. The information content of a CW carrier is:

```
I_carrier = Doppler shift only
           = d(f)/dt → v_radial(t) → trajectory parameters

For a CW carrier, the "bandwidth" is effectively the Doppler resolution:
  B_doppler ≈ 1/T_integration (Hz)
  T_integration = tracking station integration time

The Doppler measurement provides:
  v_radial = c * (delta_f / f_c)
  
where:
  c = speed of light (3 × 10⁸ m/s)
  delta_f = observed frequency shift (Hz)
  f_c = carrier frequency (960 MHz)

At 960 MHz, a radial velocity of 1 m/s produces:
  delta_f = 960 × 10⁶ × 1 / (3 × 10⁸) = 3.2 Hz

The carrier signal carried trajectory information. It carried zero science data.
```

**The information deficit:**

```
I_design = R_design × t_mission = 500 bps × 64 hr × 3600 s/hr 
         = 115,200,000 bits ≈ 14.4 MB

I_actual = Doppler tracking data only ≈ 100 velocity measurements × 32 bits
         = 3,200 bits ≈ 0.4 KB

Information deficit: 115,200,000 - 3,200 = 115,196,800 bits lost
Fraction returned: 3,200 / 115,200,000 = 0.0028%
```

The timer failure reduced Ranger 4's information return from 14.4 megabytes to 400 bytes. The mission was 99.997% information-silent.

### Worked Example

**Problem:** Calculate the information capacity of Ranger 4's designed telemetry link versus the actual carrier-only link. Compute the Shannon capacity of both channels and the information deficit.

```python
import numpy as np

# Constants
c = 3e8  # speed of light, m/s
f_carrier = 960e6  # carrier frequency, Hz

# === Designed Channel (full telemetry) ===
# Telemetry: ~500 bps over ~64 hours
R_design = 500  # bits per second
t_mission = 64 * 3600  # seconds (64 hours)
I_design = R_design * t_mission

print("=== RANGER 4: INFORMATION ANALYSIS ===")
print(f"\n--- Designed Channel ---")
print(f"Data rate: {R_design} bps")
print(f"Mission duration: {t_mission/3600:.0f} hours")
print(f"Total designed data: {I_design:,.0f} bits = {I_design/8/1e6:.1f} MB")

# === Actual Channel (carrier only) ===
# Doppler tracking: ~100 measurements with ~0.1 m/s precision
n_measurements = 100
bits_per_measurement = 32  # 32-bit float for each velocity
I_actual = n_measurements * bits_per_measurement

print(f"\n--- Actual Channel (CW carrier only) ---")
print(f"Doppler measurements: {n_measurements}")
print(f"Bits per measurement: {bits_per_measurement}")
print(f"Total actual data: {I_actual:,} bits = {I_actual/8:.0f} bytes")

# === Information Deficit ===
deficit = I_design - I_actual
fraction = I_actual / I_design * 100

print(f"\n--- Information Deficit ---")
print(f"Designed: {I_design:>15,} bits")
print(f"Actual:   {I_actual:>15,} bits")
print(f"Deficit:  {deficit:>15,} bits ({100-fraction:.4f}% lost)")
print(f"Fraction returned: {fraction:.4f}%")

# === Doppler sensitivity ===
v_radial = 1.0  # m/s
delta_f = f_carrier * v_radial / c
print(f"\n--- Doppler Tracking ---")
print(f"Carrier frequency: {f_carrier/1e6:.0f} MHz")
print(f"Doppler shift at 1 m/s: {delta_f:.1f} Hz")
print(f"Doppler shift at impact (2,670 m/s): {f_carrier * 2670 / c:.0f} Hz")
print(f"The carrier told us WHERE it hit, but not WHAT it found.")

# === Impact Energy ===
m_sc = 331  # kg
v_impact = 2670  # m/s
E_k = 0.5 * m_sc * v_impact**2
tnt_equiv = E_k / 4.184e6  # kg TNT

print(f"\n--- Impact Energy ---")
print(f"Mass: {m_sc} kg at {v_impact} m/s")
print(f"Kinetic energy: {E_k:.2e} J")
print(f"TNT equivalent: {tnt_equiv:.0f} kg ({tnt_equiv/1000:.2f} tonnes)")
print(f"Enough energy to create a ~15-20 m crater.")
print(f"All 14.4 MB of unrecorded data destroyed in 0.001 seconds.")
```

---

## Deposit 2: Lunar Impact Trajectory (Layer 4, Section 4.4)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Earth mass | M_E | kg | 5.972 × 10²⁴ |
| Moon mass | M_M | kg | 7.348 × 10²² |
| Earth-Moon distance (mean) | d_EM | km | 384,400 |
| TLI velocity | v_TLI | km/s | ~10.9 |
| Transfer time | t_transfer | hr | ~64 |
| Impact velocity | v_impact | km/s | 2.67 |
| Lunar escape velocity (surface) | v_esc_moon | km/s | 2.38 |
| Impact angle | θ_impact | deg | ~60-70 (estimate) |

### Formulas

**Vis-viva equation (transfer orbit):**

```
v² = μ * (2/r - 1/a)

where:
  μ = G * M (gravitational parameter)
  r = current distance from central body
  a = semi-major axis of transfer orbit
```

**Lunar impact velocity from conservation of energy:**

```
v_impact² = v_approach² + v_esc_moon²

where:
  v_approach = spacecraft velocity relative to Moon at large distance
  v_esc_moon = lunar escape velocity at surface = sqrt(2 * G * M_moon / R_moon)
             = sqrt(2 * 4.905 × 10¹² / 1.737 × 10⁶)
             = 2,376 m/s ≈ 2.38 km/s
  
For Ranger 4:
  v_approach ≈ 1.1 km/s (relative to Moon)
  v_impact = sqrt(1100² + 2376²) = sqrt(1.21e6 + 5.65e6)
           = sqrt(6.86e6) ≈ 2,619 m/s ≈ 2.62 km/s
  (Actual measured: ~2.67 km/s — trajectory angle adds additional component)
```

### Worked Example

**Problem:** Calculate Ranger 4's impact velocity on the Moon using energy conservation. Compare the impact energy to the sensitivity threshold of the seismometer that should have been deployed.

```python
import numpy as np

# Constants
G = 6.674e-11  # gravitational constant
M_moon = 7.348e22  # Moon mass, kg
R_moon = 1.737e6  # Moon radius, m
m_ranger = 331  # spacecraft mass, kg

# Lunar escape velocity
v_esc = np.sqrt(2 * G * M_moon / R_moon)
print(f"Lunar escape velocity at surface: {v_esc:.0f} m/s ({v_esc/1000:.2f} km/s)")

# Approach velocity (relative to Moon, at large distance)
v_approach = 1100  # m/s (estimated from trajectory analysis)

# Impact velocity
v_impact = np.sqrt(v_approach**2 + v_esc**2)
print(f"Calculated impact velocity: {v_impact:.0f} m/s ({v_impact/1000:.2f} km/s)")
print(f"Measured impact velocity: ~2670 m/s (2.67 km/s)")

# Impact energy
E_k = 0.5 * m_ranger * v_impact**2
print(f"\nImpact kinetic energy: {E_k:.2e} J")

# Seismometer sensitivity
# The Ranger seismometer was designed to detect:
# - Lunar quakes (magnitude 1-3 on the Richter-equivalent scale)
# - Impact events from meteorites (~1 kg at ~20 km/s)
# Ranger 4's own impact would have been detectable at 1000+ km
seismic_equiv = np.log10(E_k) - 4.8  # approximate magnitude
print(f"Approximate seismic magnitude of impact: {seismic_equiv:.1f}")
print(f"The seismometer that was never deployed would have detected")
print(f"its own spacecraft's impact from the other side of the Moon.")

# Crater estimation (Pi-scaling law)
# D = K * (m * v^2 / (rho * g))^(1/3.22)
rho_regolith = 1500  # kg/m³
g_moon = 1.62  # m/s²
K = 1.03  # scaling constant for loose regolith
D = K * (m_ranger * v_impact**2 / (rho_regolith * g_moon))**(1/3.22)
print(f"\nEstimated crater diameter: {D:.0f} m")
print(f"This crater exists on the far side of the Moon.")
print(f"It has never been observed. It will persist for billions of years.")
```

---

## Deposit 3: Single-Point Failure Analysis (Layer 5, Section 5.3)

### Table: Ranger 4 Failure Chain

| Event | Time | System | Status | Consequence |
|-------|------|--------|--------|-------------|
| Launch | T+0 | Atlas-Agena B | NOMINAL | Trajectory correct |
| TLI burn | T+30 min | Agena B | NOMINAL | On lunar intercept |
| Separation | T+45 min | Spacecraft | NOMINAL | Free flight begins |
| Timer failure | T+~60 min | Master clock | FAILED | All sequencing lost |
| Solar panel deploy | T+65 min (planned) | Power | NOT COMMANDED | Battery only |
| HGA pointing | T+70 min (planned) | Communications | NOT COMMANDED | Carrier only |
| Midcourse correction | T+16 hr (planned) | Propulsion | NOT COMMANDED | Ballistic impact |
| Camera activation | T+63 hr (planned) | Science | NOT COMMANDED | No images |
| Seismometer separation | T+63.5 hr (planned) | Science | NOT COMMANDED | Destroyed on impact |
| Impact | T+64 hr | -- | NOMINAL (physics) | First US lunar impact |

### Formula: System Reliability with Single-Point Failure

```
R_system = R_SPF × R_rest

where:
  R_system = overall system reliability
  R_SPF = reliability of the single-point failure component
  R_rest = reliability of all other components (in series)

For Ranger 4:
  If R_timer = 0.99 (99% reliable)
  And R_rest = 0.85 (85% reliable, all other components)
  
  R_system = 0.99 × 0.85 = 0.842

  But the CONSEQUENCE of timer failure is total:
  Mission_success = f(timer) × f(trajectory) × f(instruments)
  
  If timer fails: Mission_success = 0 × 1 × 1 = 0
  The 0 dominates regardless of other terms.
```

### Worked Example

**Problem:** Model the Ranger 4 failure as a reliability problem. Show how a single-point failure with 99% reliability dominates mission success probability when its failure mode is catastrophic.

```python
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Ranger 4 system model
# Timer is a single-point failure — if it fails, mission value = 0
# All other systems have independent failure probabilities

components = {
    'Timer (master clock)': 0.99,       # SPF — catastrophic if fails
    'Solar panels': 0.95,
    'High-gain antenna': 0.97,
    'TV camera': 0.90,
    'Gamma-ray spectrometer': 0.93,
    'Seismometer capsule': 0.88,
    'Midcourse engine': 0.95,
    'Radar altimeter': 0.92,
    'Launch vehicle': 0.85,
}

# Overall mission success requires ALL components
R_all = 1.0
for name, r in components.items():
    R_all *= r

print("=== RANGER 4: RELIABILITY ANALYSIS ===")
print(f"\nComponent reliabilities:")
for name, r in components.items():
    spf = " [SINGLE-POINT FAILURE]" if 'Timer' in name else ""
    print(f"  {name:<30} {r:.2f}{spf}")
print(f"\nOverall mission reliability (all-up): {R_all:.4f} ({R_all*100:.1f}%)")

# What if timer had redundancy?
R_timer_redundant = 1 - (1 - 0.99)**2  # dual redundant: 1 - (1-R)^2
print(f"\n--- With Dual-Redundant Timer ---")
print(f"Single timer: R = 0.99")
print(f"Dual timer:   R = {R_timer_redundant:.6f}")
R_all_redundant = R_all / 0.99 * R_timer_redundant
print(f"Mission reliability: {R_all:.4f} → {R_all_redundant:.4f}")
print(f"Improvement: {(R_all_redundant - R_all)/R_all*100:.1f}%")

# The lesson: a 99% reliable component with catastrophic failure mode
# contributes MORE risk than a 90% reliable component with graceful degradation
R_timer_sweep = np.linspace(0.9, 0.999, 100)
R_rest = R_all / 0.99  # remove timer from product
R_mission = R_timer_sweep * R_rest

fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(R_timer_sweep * 100, R_mission * 100, 'r-', linewidth=2)
ax.axvline(x=99, color='orange', linestyle='--', label='Ranger 4 timer (99%)')
ax.axhline(y=R_all*100, color='gray', linestyle=':', alpha=0.5)
ax.set_xlabel('Timer Reliability (%)', fontsize=12)
ax.set_ylabel('Mission Success Probability (%)', fontsize=12)
ax.set_title('Ranger 4: Single-Point Failure Dominates Mission Reliability', fontsize=14)
ax.legend()
ax.grid(True, alpha=0.3)
ax.set_xlim(90, 100)
plt.tight_layout()
plt.savefig('ranger4-spf-analysis.png', dpi=150)
print(f"\nSaved: ranger4-spf-analysis.png")
print(f"\nThe timer was 99% reliable. Ranger 4 was in the 1%.")
print(f"The camera was 90% reliable. Nobody remembers that,")
print(f"because the timer killed the mission before the camera mattered.")
```

---

## Deposit 4: Crater Formation Energy (Layer 2, Section 2.6)

### Formula

**Impact crater diameter (Pi-group scaling):**

```
D = 1.161 * (ρ_proj/ρ_target)^(1/3) * d_proj^0.78 * v_impact^0.44 * g^(-0.22)

Simplified for Ranger 4 parameters:
  ρ_proj ≈ 1000 kg/m³ (average spacecraft density)
  ρ_target ≈ 1500 kg/m³ (lunar regolith)
  m_proj = 331 kg → d_proj = (6m/(π*ρ))^(1/3) ≈ 0.86 m
  v_impact = 2670 m/s
  g_moon = 1.62 m/s²

  D ≈ 13-20 m (depending on impact angle and regolith properties)
```

**The Pythagorean distance from Earth to impact:**

```
d = sqrt((d_EM)² + corrections)

For far-side impact:
  The impact point is on the lunar far side at ~130.7°W longitude.
  Line-of-sight distance from Earth through the Moon to impact point:
  d_total ≈ d_EM + R_moon ≈ 384,400 + 1,737 = 386,137 km

  No direct observation possible. The Moon's body blocks all 
  electromagnetic communication with the impact site.
  
  Information from the impact: 0 bits.
  Energy of the impact: 1.18 × 10⁹ joules.
  
  The ratio of energy to information is undefined (division by zero).
  Maximum energy, zero information. The inverse of a good mission.
```

---

## Resonance Statement

Ranger 4 teaches the mathematics of zero: how a single component failure (reliability 0.99, consequence ∞) can reduce the information content of a $25 million mission to approximately 400 bytes of Doppler tracking data. The mission's trajectory was mathematically precise — the impact point was predictable to within a few hundred kilometers using classical two-body mechanics with lunar perturbation. The engineering was mathematically broken — a single-point failure in the command sequencer reduced the Shannon capacity of the spacecraft-to-Earth channel from 500 bits per second to effectively zero. The math of arrival was perfect. The math of communication was null. The crater on the far side of the Moon is a monument to the difference between reaching a destination and being able to speak from it.
