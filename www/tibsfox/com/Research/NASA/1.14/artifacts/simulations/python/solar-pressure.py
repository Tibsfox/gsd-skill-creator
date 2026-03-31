#!/usr/bin/env python3
"""
Echo 1 — Solar Radiation Pressure Orbit Perturbation
=========================================================================
Mission 1.14: Echo 1 (NASA / Delta DM-19), August 12, 1960
FIRST PASSIVE COMMUNICATIONS SATELLITE — 30.5m aluminized Mylar balloon

Simulates the effect of solar radiation pressure (SRP) on Echo 1's orbit.
Echo 1 was uniquely vulnerable to SRP because of its extreme area-to-mass
ratio: a 30.5m diameter sphere (A = 730.6 m²) weighing only 76 kg.
The SRP force was comparable to the gravitational perturbations that
affect normal satellites, causing significant orbit changes over weeks.

For a perfectly reflecting surface: F = 2 * S * A / c
where S = solar flux (1361 W/m²), A = cross-section, c = speed of light.

This produces:
  1. SRP force magnitude and comparison to gravity
  2. Orbit evolution over 6 months (perigee/apogee drift)
  3. Area-to-mass ratio comparison: Echo 1 vs typical satellites
  4. Eccentricity and semi-major axis changes over time

Requires: numpy, matplotlib
Run: python3 solar-pressure.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# =========================================================================
# Physical Constants
# =========================================================================
C = 2.998e8              # Speed of light (m/s)
G = 6.674e-11            # Gravitational constant
M_EARTH = 5.972e24       # Earth mass (kg)
MU = G * M_EARTH         # Earth's gravitational parameter
R_EARTH = 6371e3         # Earth radius (m)
AU = 1.496e11            # 1 AU (m)
SOLAR_FLUX = 1361.0      # Solar constant at 1 AU (W/m²)
PI = np.pi

# =========================================================================
# Echo 1 Parameters
# =========================================================================
DIAMETER = 30.5          # meters
RADIUS = DIAMETER / 2.0
MASS = 76.0              # kg
AREA = PI * RADIUS**2    # Cross-sectional area: 730.6 m²
AM_RATIO = AREA / MASS   # Area-to-mass ratio: 9.61 m²/kg

# Reflectivity of aluminized Mylar: ~0.95
REFLECTIVITY = 0.95
# SRP coefficient: C_R = 1 + reflectivity (1 for absorption, up to 2 for perfect reflection)
C_R = 1.0 + REFLECTIVITY  # = 1.95

# Initial orbital elements
A_INIT = R_EARTH + (1519e3 + 1687e3) / 2.0  # Semi-major axis
E_INIT = (1687e3 - 1519e3) / (2 * A_INIT)   # Eccentricity
PERI_INIT = R_EARTH + 1519e3                  # Initial perigee radius
APO_INIT = R_EARTH + 1687e3                   # Initial apogee radius

# =========================================================================
# SRP Calculations
# =========================================================================

# SRP force on Echo 1
F_SRP = C_R * SOLAR_FLUX * AREA / C
# SRP acceleration
A_SRP = F_SRP / MASS

# Gravitational acceleration at orbit altitude for comparison
A_GRAV = MU / ((R_EARTH + 1600e3)**2)

# =========================================================================
# Comparison satellites
# =========================================================================
satellites = {
    'Echo 1':         {'mass': 76,    'area': 730.6, 'desc': '30.5m Mylar balloon'},
    'Vanguard 1':     {'mass': 1.47,  'area': 0.049, 'desc': '16cm sphere, 1958'},
    'Sputnik 1':      {'mass': 83.6,  'area': 0.13,  'desc': '58cm sphere, 1957'},
    'Telstar 1':      {'mass': 77,    'area': 0.95,  'desc': '88cm sphere, 1962'},
    'ISS':            {'mass': 420000, 'area': 2500,  'desc': 'International Space Station'},
    'Hubble':         {'mass': 11110, 'area': 60,    'desc': 'Space Telescope'},
}

# =========================================================================
# Simple orbit propagation with SRP perturbation
# =========================================================================
# Using Gauss's variational equations (simplified for SRP)
# The SRP force has a roughly constant direction (toward/away from Sun)
# Its effect on the orbit depends on the angle between the orbit plane
# and the Sun direction.

def propagate_orbit_srp(a_init, e_init, am_ratio, c_r, days=180, dt_hours=1):
    """
    Simplified SRP orbit propagation using secular perturbation theory.

    SRP causes the eccentricity vector to precess and the eccentricity
    magnitude to oscillate. For an orbit with the Sun approximately
    in the orbit plane, the main effect is a change in eccentricity
    and a slow drift in semi-major axis.
    """
    dt = dt_hours * 3600  # seconds
    n_steps = int(days * 24 / dt_hours)

    # SRP acceleration for this satellite
    a_srp = c_r * SOLAR_FLUX * am_ratio / C

    # Arrays to store results
    times_days = np.zeros(n_steps)
    a_vals = np.zeros(n_steps)
    e_vals = np.zeros(n_steps)
    peri_vals = np.zeros(n_steps)
    apo_vals = np.zeros(n_steps)

    a = a_init
    e = e_init

    for i in range(n_steps):
        times_days[i] = i * dt_hours / 24.0
        a_vals[i] = a
        e_vals[i] = e
        peri_vals[i] = a * (1 - e)
        apo_vals[i] = a * (1 + e)

        # Mean motion
        n = np.sqrt(MU / a**3)

        # Simplified SRP perturbation rates (Gauss equations, averaged)
        # The Sun angle relative to the orbit rotates with Earth's orbital period
        sun_angle = 2 * PI * times_days[i] / 365.25

        # da/dt from SRP (tangential component)
        # For a non-circular orbit, the tangential SRP effect averages to:
        da_dt = 2 * a_srp * e * np.sin(sun_angle) / n

        # de/dt from SRP (radial component)
        # Secular change in eccentricity from SRP:
        de_dt = (3 * a_srp / (2 * n * a)) * np.sin(sun_angle)

        # Update orbital elements
        a += da_dt * dt
        e += de_dt * dt

        # Clamp eccentricity to physical range
        e = max(0.001, min(e, 0.5))

        # Ensure perigee stays above Earth's surface
        if a * (1 - e) < R_EARTH + 100e3:
            break

    return times_days[:i+1], a_vals[:i+1], e_vals[:i+1], peri_vals[:i+1], apo_vals[:i+1]

# Propagate Echo 1
t_echo, a_echo, e_echo, peri_echo, apo_echo = propagate_orbit_srp(
    A_INIT, E_INIT, AM_RATIO, C_R, days=180
)

# Propagate a "normal" satellite (Telstar-like AM ratio) for comparison
am_normal = satellites['Telstar 1']['area'] / satellites['Telstar 1']['mass']
t_normal, a_normal, e_normal, peri_normal, apo_normal = propagate_orbit_srp(
    A_INIT, E_INIT, am_normal, C_R, days=180
)

# =========================================================================
# Plotting
# =========================================================================
fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

# --- Subplot 1: Area-to-Mass Ratio Comparison ---
ax1 = fig.add_subplot(gs[0, 0])
names = list(satellites.keys())
am_ratios = [satellites[n]['area'] / satellites[n]['mass'] for n in names]
colors = ['#C0C8D0' if n == 'Echo 1' else '#2060CC' for n in names]

bars = ax1.barh(names, am_ratios, color=colors, edgecolor='#333')
ax1.set_xlabel('Area-to-Mass Ratio (m²/kg)')
ax1.set_title('Area-to-Mass Ratio: Echo 1 vs Other Satellites\n(Higher = more affected by solar radiation pressure)')
ax1.set_xscale('log')
ax1.grid(True, alpha=0.3, axis='x')

# Annotate Echo 1's extreme value
ax1.annotate(f'{AM_RATIO:.1f} m²/kg\n(800× Telstar)',
             xy=(AM_RATIO, 0), xytext=(AM_RATIO * 2, 0.5),
             fontsize=8, color='#C0C8D0',
             arrowprops=dict(arrowstyle='->', color='#C0C8D0'))

# --- Subplot 2: Orbit Evolution (Perigee/Apogee) ---
ax2 = fig.add_subplot(gs[0, 1])
ax2.plot(t_echo, (peri_echo - R_EARTH) / 1000, color='#2060CC', linewidth=2,
         label='Echo 1 perigee')
ax2.plot(t_echo, (apo_echo - R_EARTH) / 1000, color='#8040CC', linewidth=2,
         label='Echo 1 apogee')
ax2.plot(t_normal, (peri_normal - R_EARTH) / 1000, color='#2060CC', linewidth=1,
         linestyle='--', alpha=0.5, label='Normal sat perigee')
ax2.plot(t_normal, (apo_normal - R_EARTH) / 1000, color='#8040CC', linewidth=1,
         linestyle='--', alpha=0.5, label='Normal sat apogee')
ax2.axhline(y=ORBIT_PERI/1000, color='#C0C8D0', linestyle=':', linewidth=0.5)
ax2.axhline(y=ORBIT_APO/1000, color='#C0C8D0', linestyle=':', linewidth=0.5)
ax2.set_xlabel('Days After Launch')
ax2.set_ylabel('Altitude (km)')
ax2.set_title('Echo 1 Orbit Evolution Under Solar Pressure\n(vs typical satellite with same initial orbit)')
ax2.legend(fontsize=8)
ax2.grid(True, alpha=0.3)

# --- Subplot 3: Eccentricity Evolution ---
ax3 = fig.add_subplot(gs[1, 0])
ax3.plot(t_echo, e_echo, color='#C0C8D0', linewidth=2,
         label=f'Echo 1 (A/M = {AM_RATIO:.1f} m²/kg)')
ax3.plot(t_normal, e_normal, color='#2060CC', linewidth=1.5,
         linestyle='--', label=f'Normal sat (A/M = {am_normal:.4f} m²/kg)')
ax3.axhline(y=E_INIT, color='#888', linestyle=':', linewidth=0.5,
            label=f'Initial e = {E_INIT:.4f}')
ax3.set_xlabel('Days After Launch')
ax3.set_ylabel('Eccentricity')
ax3.set_title('Eccentricity Evolution: Solar Pressure Effect\n(Echo 1\'s balloon shape makes it a solar sail)')
ax3.legend(fontsize=8)
ax3.grid(True, alpha=0.3)

# --- Subplot 4: Force Comparison ---
ax4 = fig.add_subplot(gs[1, 1])

forces = {
    'Gravity at\n1600 km':    A_GRAV,
    'SRP on\nEcho 1':        A_SRP,
    'SRP on\nTelstar':       C_R * SOLAR_FLUX * am_normal / C,
    'SRP on\nISS':           C_R * SOLAR_FLUX * (2500/420000) / C,
    'Atmospheric\ndrag at\n1600 km': 1e-8,  # negligible at this altitude
}

force_names = list(forces.keys())
force_vals = [forces[n] for n in force_names]
force_colors = ['#888', '#C0C8D0', '#2060CC', '#2060CC', '#666']

ax4.barh(force_names, force_vals, color=force_colors, edgecolor='#333')
ax4.set_xlabel('Acceleration (m/s²)')
ax4.set_xscale('log')
ax4.set_title('Perturbation Accelerations at Echo 1 Altitude\n(SRP on Echo 1 is ~10⁻⁵ × gravity)')
ax4.grid(True, alpha=0.3, axis='x')

# Annotate ratio
ax4.annotate(f'SRP/gravity = {A_SRP/A_GRAV:.1e}',
             xy=(A_SRP, 1), fontsize=9, color='#C0C8D0',
             bbox=dict(boxstyle='round', facecolor='#111122', edgecolor='#333'))

# --- Main title ---
fig.suptitle('NASA Mission 1.14 — Echo 1: Solar Radiation Pressure\n'
             '76 kg balloon with 730.6 m² cross-section — a passive solar sail',
             fontsize=14, fontweight='bold', y=0.98)

plt.savefig('echo1-solar-pressure.png', dpi=150, bbox_inches='tight',
            facecolor='#0a0a15', edgecolor='none')
plt.show()

# =========================================================================
# Summary Statistics
# =========================================================================
print("\n" + "=" * 70)
print("Echo 1 — Solar Radiation Pressure Analysis")
print("=" * 70)
print(f"\nEcho 1 Physical Properties:")
print(f"  Diameter:          {DIAMETER} m")
print(f"  Mass:              {MASS} kg")
print(f"  Cross-section:     {AREA:.1f} m²")
print(f"  Area-to-mass:      {AM_RATIO:.2f} m²/kg")
print(f"  Reflectivity:      {REFLECTIVITY}")
print(f"  C_R coefficient:   {C_R}")
print(f"\nSolar Radiation Pressure:")
print(f"  Solar flux:        {SOLAR_FLUX} W/m²")
print(f"  Force (F=2SA/c):   {F_SRP:.4f} N = {F_SRP*1000:.2f} mN")
print(f"  Acceleration:      {A_SRP:.4e} m/s²")
print(f"  Gravity at orbit:  {A_GRAV:.2f} m/s²")
print(f"  SRP/gravity ratio: {A_SRP/A_GRAV:.2e}")
print(f"\nFor comparison (SRP acceleration):")
for name, sat in satellites.items():
    am = sat['area'] / sat['mass']
    a_srp_sat = C_R * SOLAR_FLUX * am / C
    print(f"  {name:17s}: A/M = {am:.4f} m²/kg, a_SRP = {a_srp_sat:.2e} m/s²  ({sat['desc']})")
print(f"\nKey insight: Echo 1's area-to-mass ratio ({AM_RATIO:.1f} m²/kg) is")
print(f"  {AM_RATIO / am_normal:.0f}× higher than Telstar's ({am_normal:.4f} m²/kg).")
print(f"  Solar radiation pressure on Echo 1 was a significant perturbation,")
print(f"  causing measurable orbit changes within days. This was one of the")
print(f"  first direct measurements of solar radiation pressure on a spacecraft —")
print(f"  confirming Maxwell's prediction that light exerts pressure.")
print(f"\nOrganism connection: Physalia physalis (Portuguese man o' war)")
print(f"  The man o' war's gas-filled float catches the wind — it IS a sail.")
print(f"  Echo 1's balloon caught the solar wind (photon pressure) — it IS a solar sail.")
print(f"  Both are passive structures pushed by their environment's radiation field.")
