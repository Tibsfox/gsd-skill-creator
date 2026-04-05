# Mission 1.30 -- Ranger 5: The Math of Going Dark

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Ranger 5 (October 18, 1962)
**Primary TSPB Layer:** 7 (Information Systems Theory -- Power System Reliability, Signal Loss)
**Secondary Layers:** 4 (Vector Calculus -- Uncorrected Trajectory), 5 (Set Theory -- Failure Mode Classification), 2 (Pythagorean Theorem -- Inverse-Square Power Law)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Battery Depletion as Linear Power Drain (Layer 7, Section 7.2)

### Table

| Parameter | Symbol | Units | Ranger 5 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | October 18, 1962, ~16:59 UTC |
| Launch vehicle | -- | -- | Atlas-Agena B |
| Spacecraft mass | m_sc | kg | 342.5 |
| Solar panel output (nominal) | P_solar | W | 135 |
| Solar cell count | N_cells | -- | 8,680 |
| Panel span | L_panel | m | 5.2 |
| Battery capacity | E_batt | Wh | ~1,000 |
| Spacecraft power draw | P_draw | W | ~110 |
| Time to power failure | t_fail | min | ~75 |
| Battery life | t_batt | h:min | 8:44 |
| Lunar miss distance | d_miss | km | 725 |
| Gamma-ray data collected | t_data | h | ~4 |

### Formulas

**Battery Depletion (Linear Model):**
```
E(t) = E_0 - P_draw * t

Time to depletion:
t_dead = E_0 / P_draw = 1000 Wh / 110 W ≈ 9.09 hours

Actual: 8 hours 44 minutes (8.73 hours)
Efficiency factor: 8.73 / 9.09 = 0.96 (96% of theoretical)
```

**Power Deficit Relative to Mission Timeline:**
```
t_transit ≈ 64 hours (Earth to Moon)
t_battery = 8.73 hours
t_deficit = 64 - 8.73 = 55.27 hours

The spacecraft died 55 hours before reaching the Moon.
```

### Worked Example

Calculate the minimum battery capacity needed for Ranger 5 to survive to lunar arrival:

```python
P_draw = 110  # watts
t_transit = 64  # hours to Moon
E_needed = P_draw * t_transit  # 7,040 Wh
E_actual = 1000  # Wh

ratio = E_needed / E_actual  # 7.04x
print(f"Battery needed: {E_needed:,} Wh")
print(f"Battery actual: {E_actual:,} Wh")
print(f"Deficit factor: {ratio:.1f}x")
# Ranger 5 needed 7x more battery to reach the Moon without solar power.
# That battery would have weighed ~63 kg (at 1962 silver-zinc energy density).
# The spacecraft mass budget could not accommodate it.
# The solar panels were not optional. They were existential.
```

---

## Deposit 2: Uncorrected Trajectory Dispersion (Layer 4, Section 4.4)

### Table

| Ranger Mission | Miss Distance (km) | Cause | Correction Possible? |
|---------------|-------------------|-------|---------------------|
| Ranger 3 | 36,793 | Guidance error | No (reversed commands) |
| Ranger 4 | 0 (impact) | Timer failure | N/A (already on impact trajectory) |
| Ranger 5 | 725 | Power failure | No (power dead) |

### Formulas

**Trajectory Dispersion:**
```
The miss distance at the Moon depends on injection velocity errors (δv),
injection angle errors (δθ), and timing errors (δt):

δr_moon ≈ (∂r/∂v) * δv + (∂r/∂θ) * δθ * r_injection + (∂r/∂t) * δt

For Ranger 5:
δr_moon = 725 km at range 380,000 km
Angular error ≈ arctan(725/380000) ≈ 0.109 degrees
Fractional error: 725/380000 = 0.00191 = 0.19%
```

**Required Midcourse Correction:**
```
δv_correction ≈ δr_moon / t_remaining
           ≈ 725,000 m / (48 * 3600 s)
           ≈ 4.2 m/s

Motor capability: >50 m/s
Correction was trivial. Power was absent.
```

---

## Deposit 3: Failure Mode Taxonomy (Layer 5, Section 5.2)

### Worked Example

Classify the six Ranger failures by subsystem and failure type:

```python
import numpy as np

failures = {
    'Ranger 1': {'subsystem': 'launch_vehicle', 'type': 'restart_failure', 'severity': 'total'},
    'Ranger 2': {'subsystem': 'launch_vehicle', 'type': 'restart_failure', 'severity': 'total'},
    'Ranger 3': {'subsystem': 'guidance', 'type': 'command_reversal', 'severity': 'partial'},
    'Ranger 4': {'subsystem': 'computer', 'type': 'timer_failure', 'severity': 'total'},
    'Ranger 5': {'subsystem': 'power', 'type': 'short_circuit', 'severity': 'total'},
    'Ranger 6': {'subsystem': 'instruments', 'type': 'camera_failure', 'severity': 'total'},
}

# Count unique failure subsystems
subsystems = set(f['subsystem'] for f in failures.values())
print(f"Unique failure subsystems: {len(subsystems)}")
print(f"Subsystems: {', '.join(sorted(subsystems))}")
print(f"\nNo subsystem failed twice (except launch vehicle on R1/R2).")
print(f"This distribution indicates SYSTEMIC quality issues,")
print(f"not a single design flaw. The fix required organizational")
print(f"change, not component replacement.")
```

The set-theoretic insight: when the intersection of individual failure mode sets is empty (no repeated failure mode across different missions), the root cause is in the union of all subsystem quality processes -- an organizational problem, not a technical one. This is what the congressional investigation found, and this is why JPL was reorganized rather than redesigned.
