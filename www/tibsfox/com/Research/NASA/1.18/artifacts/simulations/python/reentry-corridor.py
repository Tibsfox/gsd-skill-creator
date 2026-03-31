#!/usr/bin/env python3
"""
Mercury-Atlas 5 — Reentry Corridor Visualization
==================================================
NASA Mission Series v1.18

Visualizes the reentry corridor: the narrow band of flight path
angles at the atmospheric entry interface (400,000 ft / ~122 km)
that allows safe return.

Too shallow (flight path angle too small):
  → spacecraft skips off the atmosphere like a stone on water
  → bounces back into space, potentially into an orbit with
    no recovery possibility

Too steep (flight path angle too large):
  → excessive aerodynamic heating overwhelms the heat shield
  → excessive g-force exceeds structural/biological limits
  → spacecraft breaks up or occupant loses consciousness

The safe corridor for Mercury was approximately:
  Shallow limit: -1° (skip-out boundary)
  Steep limit:   -7.5° (maximum heating/g-force boundary)
  MA-5 actual:   ~-2° to -3° (well within corridor)

Key insight: the corridor gets NARROWER for higher-speed entries.
This is why Apollo lunar return (11 km/s) had a much tighter
corridor than Mercury orbital return (7.8 km/s).

Usage: python3 reentry-corridor.py
Dependencies: numpy, matplotlib
Output: reentry_corridor.png (2 subplots)
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# PHYSICAL CONSTANTS AND PARAMETERS
# ============================================================

R_EARTH = 6.371e6         # m
G = 9.80665               # m/s^2
ENTRY_ALT = 122e3         # m (400,000 ft = entry interface)

# Atmospheric model (exponential)
RHO_0 = 1.225             # kg/m^3 (sea level density)
H_SCALE = 8500.0          # m (scale height)

# Mercury capsule parameters
MASS = 1355.0             # kg (Mercury capsule mass)
CD = 1.1                  # drag coefficient (blunt body)
AREA = 2.81               # m^2 (heat shield area, 6 ft diameter)
BC = MASS / (CD * AREA)   # ballistic coefficient, kg/m^2

# ============================================================
# CORRIDOR BOUNDARY CALCULATIONS
# ============================================================

def atmospheric_density(altitude):
    """Exponential atmosphere model."""
    return RHO_0 * np.exp(-altitude / H_SCALE)

def max_deceleration_g(v_entry, gamma_deg):
    """Approximate peak deceleration in g for a given entry angle.
    Uses the Allen-Eggers analytical solution for ballistic entry.
    Peak decel ≈ v²sin(γ) / (2eH)  where H is scale height
    """
    gamma = np.radians(abs(gamma_deg))
    if gamma < 0.001:
        return 0.0
    v = v_entry
    # Peak deceleration from ballistic entry theory
    a_max = v**2 * np.sin(gamma) / (2.0 * np.e * H_SCALE)
    return a_max / G

def peak_heating_rate(v_entry, gamma_deg):
    """Approximate peak stagnation-point heating rate (W/cm²).
    Sutton-Graves correlation: q ≈ k × sqrt(rho/r_n) × v^3
    """
    gamma = np.radians(abs(gamma_deg))
    if gamma < 0.001:
        return 0.0
    # Approximate altitude of peak heating
    # For ballistic entry, peak heating occurs at slightly higher altitude
    # than peak deceleration
    rho_peak = RHO_0 * np.exp(-1) * np.sin(gamma)  # Simplified
    r_nose = 0.95  # m (Mercury heat shield radius)
    k = 1.83e-4    # Sutton-Graves constant for Earth (W/cm² / (kg/m³)^0.5 / (m/s)^3)
    q = k * np.sqrt(rho_peak / r_nose) * v_entry**3
    return q

# Entry velocity for MA-5 (orbital return)
V_ENTRY_MA5 = 7850.0    # m/s (approximate orbital velocity at entry interface)

# ============================================================
# PLOT
# ============================================================

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
fig.patch.set_facecolor('#0c1020')

gamma_range = np.linspace(0.1, 12.0, 200)  # degrees (absolute value)

# --- Subplot 1: G-force vs flight path angle ---
ax1.set_facecolor('#0a0e1a')

g_loads = [max_deceleration_g(V_ENTRY_MA5, g) for g in gamma_range]
ax1.plot(gamma_range, g_loads, color='#FF3030', linewidth=2, label='Peak deceleration')

# Corridor boundaries
SKIP_LIMIT = 1.0    # degrees — minimum entry angle
STEEP_LIMIT = 7.5   # degrees — maximum safe angle
MA5_ACTUAL = 2.5     # degrees — MA-5 actual entry angle (approximate)

ax1.axvline(x=SKIP_LIMIT, color='#2050CC', linewidth=1.5, linestyle='--',
             label=f'Skip-out limit ({SKIP_LIMIT}°)')
ax1.axvline(x=STEEP_LIMIT, color='#FF6030', linewidth=1.5, linestyle='--',
             label=f'Max heating limit ({STEEP_LIMIT}°)')

# Safe corridor fill
ax1.axvspan(SKIP_LIMIT, STEEP_LIMIT, alpha=0.12, color='#40CC40',
             label='Safe corridor')

# MA-5 actual entry
ma5_g = max_deceleration_g(V_ENTRY_MA5, MA5_ACTUAL)
ax1.scatter([MA5_ACTUAL], [ma5_g], color='#C0C0D0', s=120, zorder=5, marker='*')
ax1.annotate(f'MA-5 actual\n{MA5_ACTUAL}° → {ma5_g:.1f}g',
              xy=(MA5_ACTUAL, ma5_g),
              xytext=(MA5_ACTUAL + 2.0, ma5_g + 2.0),
              color='#C0C0D0', fontsize=9, fontweight='bold',
              arrowprops=dict(arrowstyle='->', color='#C0C0D0'))

# Human tolerance line
ax1.axhline(y=8.0, color='#FFD700', linewidth=1, linestyle=':',
             alpha=0.5, label='Consciousness limit (~8g sustained)')

ax1.set_xlabel('Flight Path Angle at Entry Interface (degrees)', color='#889098', fontsize=11)
ax1.set_ylabel('Peak Deceleration (g)', color='#889098', fontsize=11)
ax1.set_title('Reentry Corridor — G-Force vs Entry Angle\n'
               f'Entry velocity: {V_ENTRY_MA5/1e3:.1f} km/s (Mercury orbital return)',
               color='#C0C0D0', fontsize=12, pad=10)
ax1.legend(loc='upper left', fontsize=8, facecolor='#0a0e1a',
            edgecolor='#1a2040', labelcolor='#889098')
ax1.set_xlim(0, 12)
ax1.set_ylim(0, max(g_loads) * 1.1)
ax1.tick_params(colors='#556677')
ax1.grid(alpha=0.15, color='#334455')
for spine in ax1.spines.values():
    spine.set_color('#1a2040')

# --- Subplot 2: Altitude vs range profile for different angles ---
ax2.set_facecolor('#0a0e1a')

# Simplified altitude profiles for different entry angles
# Using ballistic trajectory approximation
entry_angles = [0.5, 1.0, 2.5, 5.0, 8.0]
colors = ['#2050CC', '#40AACC', '#C0C0D0', '#CCAA40', '#FF4040']
styles = ['--', '--', '-', ':', ':']

for angle, color, style in zip(entry_angles, colors, styles):
    gamma = np.radians(angle)
    # Simplified trajectory: exponential altitude decay
    # Range and altitude parametrized by time
    dt = 0.5
    alt = ENTRY_ALT
    v = V_ENTRY_MA5
    range_km = 0
    alts = [alt / 1e3]
    ranges = [0]

    for step in range(2000):
        rho = atmospheric_density(alt)
        drag = 0.5 * rho * v**2 * CD * AREA / MASS
        # Decelerate
        v -= drag * dt
        if v < 100:
            break
        # Descend
        alt -= v * np.sin(gamma) * dt
        range_km += v * np.cos(gamma) * dt / 1e3

        # Skip-out check
        if alt > ENTRY_ALT * 1.1 and angle < 0.8:
            # Would skip out
            break
        if alt < 0:
            alt = 0
            alts.append(0)
            ranges.append(range_km)
            break

        alts.append(alt / 1e3)
        ranges.append(range_km)

    label = f'{angle}°'
    if angle == MA5_ACTUAL:
        label += ' (MA-5 actual)'
    elif angle < SKIP_LIMIT:
        label += ' (skip-out risk)'
    elif angle > STEEP_LIMIT:
        label += ' (extreme heating)'

    ax2.plot(ranges, alts, color=color, linewidth=2 if angle == MA5_ACTUAL else 1.5,
              linestyle=style, label=label)

# Entry interface line
ax2.axhline(y=ENTRY_ALT/1e3, color='#556677', linewidth=1, linestyle=':',
             alpha=0.5)
ax2.annotate('Entry interface (122 km)', xy=(50, ENTRY_ALT/1e3 + 2),
              color='#556677', fontsize=8)

ax2.set_xlabel('Downrange Distance (km)', color='#889098', fontsize=11)
ax2.set_ylabel('Altitude (km)', color='#889098', fontsize=11)
ax2.set_title('Altitude Profile — Different Entry Angles\n'
               'Shallow entries cover more range; steep entries dive faster',
               color='#C0C0D0', fontsize=12, pad=10)
ax2.legend(loc='upper right', fontsize=8, facecolor='#0a0e1a',
            edgecolor='#1a2040', labelcolor='#889098')
ax2.set_ylim(0, 140)
ax2.tick_params(colors='#556677')
ax2.grid(alpha=0.15, color='#334455')
for spine in ax2.spines.values():
    spine.set_color('#1a2040')

plt.tight_layout(pad=2.0)
plt.savefig('reentry_corridor.png', dpi=150, facecolor='#0c1020',
             bbox_inches='tight')
plt.close()

# ============================================================
# NUMERICAL SUMMARY
# ============================================================

print("=" * 60)
print("MERCURY-ATLAS 5 — REENTRY CORRIDOR ANALYSIS")
print("=" * 60)
print()
print(f"Entry interface altitude:  {ENTRY_ALT/1e3:.0f} km (400,000 ft)")
print(f"Entry velocity:            {V_ENTRY_MA5:.0f} m/s ({V_ENTRY_MA5/1e3:.1f} km/s)")
print(f"Ballistic coefficient:     {BC:.0f} kg/m²")
print()
print("--- Corridor Boundaries ---")
print(f"Skip-out limit:            {SKIP_LIMIT}° (too shallow → bounces off)")
print(f"Max heating limit:         {STEEP_LIMIT}° (too steep → burns up)")
print(f"Safe corridor width:       {STEEP_LIMIT - SKIP_LIMIT}°")
print()
print("--- MA-5 Actual Entry ---")
print(f"Flight path angle:         ~{MA5_ACTUAL}°")
print(f"Peak deceleration:         ~{max_deceleration_g(V_ENTRY_MA5, MA5_ACTUAL):.1f}g")
print(f"Margin from skip-out:      {MA5_ACTUAL - SKIP_LIMIT:.1f}°")
print(f"Margin from max heating:   {STEEP_LIMIT - MA5_ACTUAL:.1f}°")
print()
print("--- Comparison: What Happens Outside the Corridor ---")
for angle in [0.5, 1.0, 2.5, 5.0, 8.0, 10.0]:
    g = max_deceleration_g(V_ENTRY_MA5, angle)
    status = "SAFE" if SKIP_LIMIT <= angle <= STEEP_LIMIT else "DANGEROUS"
    if angle < SKIP_LIMIT:
        status = "SKIP-OUT"
    elif angle > STEEP_LIMIT:
        status = "EXTREME"
    print(f"  {angle:5.1f}° → {g:5.1f}g  [{status}]")
print()
print("The corridor is narrow. At 7.8 km/s, the difference between")
print("safe return and skip-out is about 1 degree. The difference")
print("between safe return and structural failure is about 5 degrees.")
print("Threading this needle is what the retrofire system must achieve.")
print()
print("Output: reentry_corridor.png")
