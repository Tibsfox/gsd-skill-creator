#!/usr/bin/env python3
"""
ranger4_impact_trajectory.py
Ranger 4 Lunar Impact Trajectory Simulator
Mission 1.29 — NASA Mission Series

Computes and visualizes:
1. Ranger 4's Earth-to-Moon transfer trajectory
2. Ranger 3's miss trajectory (for comparison)
3. Impact energy and crater estimation
4. The information deficit (designed vs actual data)

Requirements: numpy, matplotlib
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle

# Constants
G = 6.674e-11  # m³/(kg·s²)
M_earth = 5.972e24  # kg
M_moon = 7.348e22  # kg
R_earth = 6.371e6  # m
R_moon = 1.737e6  # m
d_earth_moon = 3.844e8  # m
mu_earth = G * M_earth
mu_moon = G * M_moon

print("=" * 60)
print("RANGER 4 — LUNAR IMPACT TRAJECTORY ANALYSIS")
print("Mission 1.29 — First US Spacecraft to Reach the Moon")
print("April 23-26, 1962")
print("=" * 60)

# === 1. Trajectory Parameters ===
print("\n--- Transfer Orbit Parameters ---")
v_tli = 10900  # m/s (TLI velocity)
h_tli = 185000  # m (parking orbit altitude)
r_tli = R_earth + h_tli

# Specific orbital energy
epsilon = v_tli**2 / 2 - mu_earth / r_tli
print(f"TLI velocity: {v_tli} m/s")
print(f"Injection altitude: {h_tli/1000:.0f} km")
print(f"Specific energy: {epsilon:.2e} J/kg")
print(f"Trajectory type: {'HYPERBOLIC (escape)' if epsilon > 0 else 'ELLIPTICAL (bound)'}")

# Semi-major axis (negative for hyperbola)
a = -mu_earth / (2 * epsilon)
e = 1 - r_tli / a  # eccentricity at periapsis
print(f"Semi-major axis: {a/1000:.0f} km")
print(f"Eccentricity: {abs(e):.3f}")

# === 2. Impact Velocity ===
print("\n--- Lunar Impact ---")
v_approach = 1100  # m/s relative to Moon
v_esc_moon = np.sqrt(2 * mu_moon / R_moon)
v_impact = np.sqrt(v_approach**2 + v_esc_moon**2)
print(f"Approach velocity: {v_approach} m/s")
print(f"Lunar escape velocity: {v_esc_moon:.0f} m/s")
print(f"Impact velocity: {v_impact:.0f} m/s ({v_impact/1000:.2f} km/s)")
print(f"Measured: ~2670 m/s (2.67 km/s)")

# Impact energy
m_ranger = 331  # kg
E_impact = 0.5 * m_ranger * 2670**2
tnt_kg = E_impact / 4.184e6
print(f"\nImpact kinetic energy: {E_impact:.2e} J")
print(f"TNT equivalent: {tnt_kg:.0f} kg ({tnt_kg/1000:.2f} tonnes)")
print(f"Impact location: ~15.5°S, 130.7°W (far side)")

# === 3. Information Deficit ===
print("\n--- Information Deficit ---")
R_design = 500  # bps
t_mission = 64 * 3600  # seconds
I_design = R_design * t_mission
I_actual = 100 * 32  # Doppler measurements
deficit = (I_design - I_actual) / I_design * 100

print(f"Designed data return: {I_design:,} bits ({I_design/8/1e6:.1f} MB)")
print(f"Actual data return: {I_actual:,} bits ({I_actual/8:.0f} bytes)")
print(f"Information deficit: {deficit:.4f}%")
print(f"The timer failure reduced 14.4 MB to 400 bytes.")

# === 4. Ranger Fleet Comparison ===
print("\n--- Ranger Fleet: Missions 1-5 ---")
rangers = [
    ("Ranger 1", "1961-08-23", "LEO trap", 0, "Agena A restart failed"),
    ("Ranger 2", "1961-11-18", "LEO trap", 0, "Agena A restart failed"),
    ("Ranger 3", "1962-01-26", "Miss 36793 km", 36793, "Guidance + midcourse error"),
    ("Ranger 4", "1962-04-23", "IMPACT (far side)", 0, "Timer failed — dead on arrival"),
    ("Ranger 5", "1962-10-18", "Miss 725 km", 725, "Power failure"),
]

print(f"{'Mission':<12} {'Date':<12} {'Result':<20} {'Miss (km)':<12} {'Failure'}")
print("-" * 80)
for name, date, result, miss, failure in rangers:
    miss_str = f"{miss:,}" if miss > 0 else "IMPACT"
    print(f"{name:<12} {date:<12} {result:<20} {miss_str:<12} {failure}")

# === 5. Plot: Ranger 3 vs Ranger 4 trajectories ===
fig, axes = plt.subplots(1, 2, figsize=(16, 8))

# Left plot: Earth-Moon system with trajectories
ax = axes[0]
ax.set_facecolor('#0A0A20')

# Earth
earth = Circle((0, 0), R_earth/1e6, color='#3060C0', alpha=0.8)
ax.add_patch(earth)
ax.text(0, -15, 'Earth', ha='center', color='#80A0D0', fontsize=9)

# Moon
moon_x = d_earth_moon / 1e6
moon = Circle((moon_x, 0), R_moon/1e6 * 5, color='#808080', alpha=0.8)  # enlarged for visibility
ax.add_patch(moon)
ax.text(moon_x, -15, 'Moon', ha='center', color='#A0A0A0', fontsize=9)

# Ranger 4 trajectory (hit)
t_param = np.linspace(0, 1, 200)
r4_x = t_param * moon_x
r4_y = 30 * np.sin(t_param * np.pi) * (1 - 0.3 * t_param)  # arc
ax.plot(r4_x, r4_y, 'r-', linewidth=2, label='Ranger 4 (IMPACT)')
ax.plot(r4_x[-1], r4_y[-1], 'r*', markersize=15)

# Ranger 3 trajectory (miss by 36,793 km)
r3_y = 50 * np.sin(t_param * np.pi) * (1 - 0.1 * t_param)
r3_x = t_param * (moon_x + 36.793)
ax.plot(r3_x, r3_y, 'g--', linewidth=1.5, alpha=0.7, label='Ranger 3 (miss 36,793 km)')

# Timer failure marker
fail_idx = int(1/64 * 200)  # ~1 hour into 64-hour flight
ax.plot(r4_x[fail_idx], r4_y[fail_idx], 'yo', markersize=10, zorder=5)
ax.annotate('Timer failure\n(T+1 hr)', 
            (r4_x[fail_idx], r4_y[fail_idx]),
            textcoords="offset points", xytext=(15, 15),
            color='#FFD700', fontsize=8,
            arrowprops=dict(arrowstyle='->', color='#FFD700'))

# Carrier signal line (thin blue)
carrier_x = np.array([r4_x[fail_idx], 0])
carrier_y = np.array([r4_y[fail_idx], 0])
ax.plot(carrier_x, carrier_y, 'b-', linewidth=0.5, alpha=0.3, label='Carrier signal')

ax.set_xlim(-50, moon_x + 60)
ax.set_ylim(-80, 80)
ax.set_xlabel('Distance (×1000 km)', color='#A0A0A0')
ax.set_ylabel('Offset (×1000 km)', color='#A0A0A0')
ax.set_title('Ranger 3 vs Ranger 4: Miss vs Impact', color='white', fontsize=13)
ax.legend(loc='lower right', fontsize=8, facecolor='#151530', edgecolor='#303060')
ax.tick_params(colors='#808080')

# Right plot: Information deficit
ax2 = axes[1]
ax2.set_facecolor('#0A0A20')

categories = ['Designed\n(14.4 MB)', 'Actual\n(400 bytes)']
values = [I_design, I_actual]
colors = ['#4080FF', '#CC6600']
bars = ax2.bar(categories, values, color=colors, width=0.5, edgecolor='#303060')

ax2.set_yscale('log')
ax2.set_ylabel('Data (bits, log scale)', color='#A0A0A0')
ax2.set_title('Ranger 4: Information Deficit (99.997%)', color='white', fontsize=13)
ax2.tick_params(colors='#808080')

# Annotate
ax2.text(0, I_design * 1.5, f'{I_design:,} bits', ha='center', color='#80B0FF', fontsize=10)
ax2.text(1, I_actual * 3, f'{I_actual:,} bits', ha='center', color='#FF8C00', fontsize=10)

plt.tight_layout()
plt.savefig('ranger4-trajectory-analysis.png', dpi=150, facecolor='#0A0A20')
print(f"\nSaved: ranger4-trajectory-analysis.png")
print(f"\nThe trajectory was perfect. The spacecraft was dead.")
print(f"The crater is still on the far side. No one has ever seen it.")
