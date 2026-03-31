#!/usr/bin/env python3
"""
Mercury-Atlas 5 — Orbital Velocity vs Altitude
=================================================
NASA Mission Series v1.18

Computes and plots orbital velocity as a function of altitude.
Shows the critical threshold: below ~7.8 km/s at low Earth orbit
altitude, a trajectory is suborbital (falls back). Above that
velocity, the object enters orbit.

Compares:
  - Redstone max velocity (~2.3 km/s → suborbital, falls back)
  - Atlas max velocity (~7.8 km/s → orbital, stays up)
  - MA-5 actual orbit parameters (161×237 km elliptical)

Key MA-5 parameters:
  Launch: November 29, 1961, 15:08 UTC
  Launch site: Cape Canaveral LC-14
  Vehicle: Atlas D (109-D)
  Passenger: Enos (chimpanzee)
  Orbit: 161 km × 237 km (99.4 mi × 147.3 mi)
  Inclination: 32.5°
  Orbital period: 88.5 minutes
  Planned: 3 orbits, actual: 2 orbits
  Total flight time: 3 hours 20 minutes 59 seconds
  Recovery: USS Stormes, south of Bermuda

Usage: python3 orbital-velocity.py
Dependencies: numpy, matplotlib
Output: orbital_velocity.png (2 subplots)
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# PHYSICAL CONSTANTS
# ============================================================

G_CONST = 6.674e-11       # m^3 kg^-1 s^-2
M_EARTH = 5.972e24        # kg
R_EARTH = 6.371e6         # m (mean radius)
MU = G_CONST * M_EARTH    # gravitational parameter, m^3/s^2

# ============================================================
# ORBITAL VELOCITY CALCULATIONS
# ============================================================

def circular_velocity(altitude_km):
    """Orbital velocity for a circular orbit at given altitude."""
    r = R_EARTH + altitude_km * 1e3
    return np.sqrt(MU / r)

def escape_velocity(altitude_km):
    """Escape velocity at given altitude."""
    r = R_EARTH + altitude_km * 1e3
    return np.sqrt(2 * MU / r)

def elliptical_velocity(altitude_km, a_km):
    """Velocity at a point in an elliptical orbit.
    altitude_km: current altitude
    a_km: semi-major axis of ellipse (from Earth center) in km
    Uses vis-viva equation: v^2 = GM(2/r - 1/a)
    """
    r = R_EARTH + altitude_km * 1e3
    a = a_km * 1e3
    return np.sqrt(MU * (2.0/r - 1.0/a))

# ============================================================
# MA-5 SPECIFIC PARAMETERS
# ============================================================

MA5_PERIGEE = 161.0     # km
MA5_APOGEE = 237.0      # km
MA5_SEMI_MAJOR = R_EARTH/1e3 + (MA5_PERIGEE + MA5_APOGEE) / 2.0  # km from center
MA5_PERIOD = 88.5 * 60  # seconds

# Redstone comparison (suborbital)
REDSTONE_MAX_V = 2300.0    # m/s (~2.3 km/s)
REDSTONE_MAX_ALT = 253.0   # km (Ham's actual altitude)

# Atlas comparison
ATLAS_ORBITAL_V = circular_velocity(MA5_PERIGEE)  # m/s at perigee altitude

# ============================================================
# PLOT 1: ORBITAL VELOCITY VS ALTITUDE
# ============================================================

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
fig.patch.set_facecolor('#0c1020')

altitudes = np.linspace(100, 2000, 500)  # 100 to 2000 km

v_circular = np.array([circular_velocity(h) for h in altitudes]) / 1e3  # km/s
v_escape = np.array([escape_velocity(h) for h in altitudes]) / 1e3      # km/s

# Subplot 1: Velocity vs altitude with regions
ax1.set_facecolor('#0a0e1a')
ax1.fill_between(altitudes, 0, v_circular, alpha=0.15, color='#FF4040',
                  label='Suborbital region')
ax1.fill_between(altitudes, v_circular, v_escape, alpha=0.15, color='#2050CC',
                  label='Orbital region')
ax1.fill_between(altitudes, v_escape, 15, alpha=0.1, color='#40CC40',
                  label='Escape region')

ax1.plot(altitudes, v_circular, color='#2050CC', linewidth=2,
          label=f'Circular orbit velocity')
ax1.plot(altitudes, v_escape, color='#40CC40', linewidth=2, linestyle='--',
          label=f'Escape velocity')

# Mark Redstone (suborbital)
ax1.scatter([REDSTONE_MAX_ALT], [REDSTONE_MAX_V / 1e3], color='#FF3030',
             s=100, zorder=5, marker='v')
ax1.annotate('Redstone (Ham)\n2.3 km/s — SUBORBITAL',
              xy=(REDSTONE_MAX_ALT, REDSTONE_MAX_V / 1e3),
              xytext=(REDSTONE_MAX_ALT + 200, REDSTONE_MAX_V / 1e3 + 1.0),
              color='#FF3030', fontsize=9, fontweight='bold',
              arrowprops=dict(arrowstyle='->', color='#FF3030'))

# Mark Atlas (orbital) — velocity at perigee
atlas_v_perigee = elliptical_velocity(MA5_PERIGEE, MA5_SEMI_MAJOR) / 1e3
ax1.scatter([MA5_PERIGEE], [atlas_v_perigee], color='#C0C0D0',
             s=120, zorder=5, marker='*')
ax1.annotate(f'Atlas (Enos, perigee)\n{atlas_v_perigee:.1f} km/s — ORBITAL',
              xy=(MA5_PERIGEE, atlas_v_perigee),
              xytext=(MA5_PERIGEE + 250, atlas_v_perigee + 0.5),
              color='#C0C0D0', fontsize=9, fontweight='bold',
              arrowprops=dict(arrowstyle='->', color='#C0C0D0'))

# Mark Atlas at apogee
atlas_v_apogee = elliptical_velocity(MA5_APOGEE, MA5_SEMI_MAJOR) / 1e3
ax1.scatter([MA5_APOGEE], [atlas_v_apogee], color='#C0C0D0',
             s=80, zorder=5, marker='o')
ax1.annotate(f'Enos (apogee)\n{atlas_v_apogee:.1f} km/s',
              xy=(MA5_APOGEE, atlas_v_apogee),
              xytext=(MA5_APOGEE + 200, atlas_v_apogee - 1.0),
              color='#808890', fontsize=8,
              arrowprops=dict(arrowstyle='->', color='#808890'))

ax1.set_xlabel('Altitude (km)', color='#889098', fontsize=11)
ax1.set_ylabel('Velocity (km/s)', color='#889098', fontsize=11)
ax1.set_title('Orbital Velocity Threshold\nRedstone (Suborbital) vs Atlas (Orbital)',
               color='#C0C0D0', fontsize=13, pad=10)
ax1.legend(loc='upper right', fontsize=8, facecolor='#0a0e1a',
            edgecolor='#1a2040', labelcolor='#889098')
ax1.set_xlim(100, 2000)
ax1.set_ylim(0, 14)
ax1.tick_params(colors='#556677')
ax1.grid(alpha=0.15, color='#334455')
for spine in ax1.spines.values():
    spine.set_color('#1a2040')

# ============================================================
# PLOT 2: MA-5 ELLIPTICAL ORBIT VISUALIZATION
# ============================================================

ax2.set_facecolor('#0a0e1a')
ax2.set_aspect('equal')

# Earth
theta = np.linspace(0, 2*np.pi, 200)
earth_r = R_EARTH / 1e3  # in km for this plot we normalize
ax2.fill(np.cos(theta) * 0.92, np.sin(theta) * 0.92,
          color='#102040', alpha=0.8)
ax2.plot(np.cos(theta) * 0.92, np.sin(theta) * 0.92,
          color='#2050CC', linewidth=1, alpha=0.5)

# Atmosphere hint
ax2.plot(np.cos(theta) * 0.94, np.sin(theta) * 0.94,
          color='#2050CC', linewidth=0.5, alpha=0.3)

# MA-5 orbit (elliptical)
# Normalize: Earth surface = 0.92, so altitude scales from there
scale = 0.92 / earth_r  # km to plot units
perigee_r = (earth_r + MA5_PERIGEE) * scale
apogee_r = (earth_r + MA5_APOGEE) * scale
semi_major = (perigee_r + apogee_r) / 2.0
semi_minor = np.sqrt(perigee_r * apogee_r)
center_offset = semi_major - perigee_r

orbit_x = np.cos(theta) * semi_major - center_offset
orbit_y = np.sin(theta) * semi_minor

ax2.plot(orbit_x, orbit_y, color='#C0C0D0', linewidth=2,
          label=f'MA-5 orbit ({int(MA5_PERIGEE)}×{int(MA5_APOGEE)} km)')

# Mark perigee and apogee
ax2.scatter([perigee_r], [0], color='#2050CC', s=60, zorder=5)
ax2.annotate(f'Perigee\n{int(MA5_PERIGEE)} km',
              xy=(perigee_r, 0), xytext=(perigee_r + 0.05, -0.12),
              color='#2050CC', fontsize=8,
              arrowprops=dict(arrowstyle='->', color='#2050CC'))

ax2.scatter([-apogee_r + 2*center_offset], [0], color='#C0C0D0', s=60, zorder=5)

# For display, the apogee point is on the opposite side
ax_apo_x = -semi_major - center_offset
ax2.scatter([ax_apo_x], [0], color='#C0C0D0', s=60, zorder=5)
ax2.annotate(f'Apogee\n{int(MA5_APOGEE)} km',
              xy=(ax_apo_x, 0), xytext=(ax_apo_x - 0.05, 0.12),
              color='#C0C0D0', fontsize=8,
              arrowprops=dict(arrowstyle='->', color='#C0C0D0'))

# Direction arrow
arrow_angle = np.pi / 4
arrow_x = np.cos(arrow_angle) * semi_major - center_offset
arrow_y = np.sin(arrow_angle) * semi_minor
ax2.annotate('', xy=(arrow_x - 0.02, arrow_y + 0.02),
              xytext=(arrow_x + 0.02, arrow_y - 0.02),
              arrowprops=dict(arrowstyle='->', color='#FFD700', lw=1.5))

ax2.set_title(f'MA-5 Orbital Path\nPeriod: {MA5_PERIOD/60:.1f} min | 2 orbits completed',
               color='#C0C0D0', fontsize=13, pad=10)
ax2.set_xlim(-1.3, 1.3)
ax2.set_ylim(-1.1, 1.1)
ax2.legend(loc='lower right', fontsize=8, facecolor='#0a0e1a',
            edgecolor='#1a2040', labelcolor='#889098')
ax2.tick_params(colors='#556677')
ax2.grid(alpha=0.1, color='#334455')
for spine in ax2.spines.values():
    spine.set_color('#1a2040')

plt.tight_layout(pad=2.0)
plt.savefig('orbital_velocity.png', dpi=150, facecolor='#0c1020',
             bbox_inches='tight')
plt.close()

# ============================================================
# NUMERICAL SUMMARY
# ============================================================

print("=" * 60)
print("MERCURY-ATLAS 5 — ORBITAL VELOCITY ANALYSIS")
print("=" * 60)
print()
print(f"Earth radius:              {R_EARTH/1e3:.0f} km")
print(f"Gravitational parameter:   {MU:.3e} m³/s²")
print()
print("--- Velocity Comparison ---")
print(f"Redstone max velocity:     {REDSTONE_MAX_V:.0f} m/s  ({REDSTONE_MAX_V/1e3:.1f} km/s)")
print(f"Circular orbit at 161 km:  {circular_velocity(161):.0f} m/s  ({circular_velocity(161)/1e3:.2f} km/s)")
print(f"Redstone / orbital ratio:  {REDSTONE_MAX_V/circular_velocity(161)*100:.1f}%  → SUBORBITAL")
print()
print("--- MA-5 Orbit Parameters ---")
print(f"Perigee:                   {MA5_PERIGEE:.0f} km")
print(f"Apogee:                    {MA5_APOGEE:.0f} km")
print(f"Semi-major axis:           {MA5_SEMI_MAJOR:.0f} km (from center)")
print(f"Velocity at perigee:       {elliptical_velocity(MA5_PERIGEE, MA5_SEMI_MAJOR):.0f} m/s  ({atlas_v_perigee:.2f} km/s)")
print(f"Velocity at apogee:        {elliptical_velocity(MA5_APOGEE, MA5_SEMI_MAJOR):.0f} m/s  ({atlas_v_apogee:.2f} km/s)")
print(f"Orbital period:            {MA5_PERIOD/60:.1f} min")
print(f"Escape velocity at 161 km: {escape_velocity(161):.0f} m/s  ({escape_velocity(161)/1e3:.2f} km/s)")
print()
print("--- The Threshold ---")
print(f"Redstone reached {REDSTONE_MAX_V/1e3:.1f} km/s → fell back (suborbital)")
print(f"Atlas reached {atlas_v_perigee:.1f} km/s → stayed up (orbital)")
print(f"Difference: {(atlas_v_perigee - REDSTONE_MAX_V/1e3):.1f} km/s more velocity = orbit vs. splashdown")
print()
print("Output: orbital_velocity.png")
