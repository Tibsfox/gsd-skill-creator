#!/usr/bin/env python3
"""
TIROS-1 — Orbital Ground Track and Coverage Analysis
=========================================================================
Mission 1.15: TIROS-1 (NASA / Thor-Able), April 1, 1960
FIRST WEATHER SATELLITE — 48.4° inclination, 693 x 756 km orbit

Plots the ground track of TIROS-1 over multiple orbits, showing which
latitudes and longitudes are observed. Calculates the time required for
near-global coverage of the observable latitude band (48.4°N to 48.4°S).
Shows the effect of Earth's rotation on successive ground tracks — each
orbit shifts westward by ~25° of longitude.

This produces:
  1. Equirectangular world map with ground tracks for 15 orbits
  2. Latitude coverage histogram — which latitudes get observed
  3. Coverage buildup over time — cumulative area observed
  4. Nodal regression and orbital precession

Requires: numpy, matplotlib
Run: python3 ground-track.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.patches import Rectangle

# =========================================================================
# Orbital Parameters
# =========================================================================
R_EARTH = 6371.0           # Earth radius (km)
MU = 398600.4418           # Earth gravitational parameter (km^3/s^2)
J2 = 1.08263e-3            # Earth's J2 oblateness
OMEGA_EARTH = 7.2921159e-5  # Earth rotation rate (rad/s)
PI = np.pi
DEG = PI / 180.0

# TIROS-1 orbit
PERI_ALT = 693.0           # Perigee altitude (km)
APO_ALT = 756.0            # Apogee altitude (km)
INCL = 48.4                # Inclination (degrees)
a = R_EARTH + (PERI_ALT + APO_ALT) / 2.0  # Semi-major axis (km)
e = (APO_ALT - PERI_ALT) / (2 * R_EARTH + APO_ALT + PERI_ALT)  # Eccentricity
PERIOD = 2 * PI * np.sqrt(a ** 3 / MU)  # Orbital period (seconds)
PERIOD_MIN = PERIOD / 60.0  # minutes

# Camera FOV (wide-angle)
WA_FOV = 104.0             # degrees
HALF_FOV = WA_FOV / 2.0


def ground_track(num_orbits=15, dt_seconds=30):
    """Compute ground track for multiple orbits.

    Uses a simplified circular orbit model with J2 nodal regression.
    Returns arrays of (latitude, longitude) for each time step.
    """
    # Nodal regression rate (degrees per day)
    # dOmega/dt = -3/2 * n * J2 * (R_e/a)^2 * cos(i)
    n = 2 * PI / PERIOD  # mean motion
    omega_dot = -1.5 * n * J2 * (R_EARTH / a) ** 2 * np.cos(INCL * DEG)
    omega_dot_deg_day = omega_dot * 180 / PI * 86400
    print(f"Nodal regression: {omega_dot_deg_day:.2f} deg/day")

    total_time = num_orbits * PERIOD
    t = np.arange(0, total_time, dt_seconds)

    # Orbital position (true anomaly approximation for near-circular)
    nu = n * t  # mean anomaly ≈ true anomaly for low e

    # Position in orbital plane
    r = a * (1 - e ** 2) / (1 + e * np.cos(nu))

    # Latitude: depends on argument of latitude (u = omega + nu)
    # For circular orbit: lat = arcsin(sin(i) * sin(u))
    u = nu  # argument of latitude (setting argument of perigee = 0)
    lat = np.arcsin(np.sin(INCL * DEG) * np.sin(u))

    # Longitude: RAAN - Earth rotation + orbital longitude
    # RAAN regresses over time
    raan_0 = 0.0  # initial RAAN (arbitrary)
    raan = raan_0 + omega_dot * t

    # Sub-satellite longitude
    # lon = RAAN + arctan(cos(i) * tan(u)) - omega_earth * t
    lon = raan + np.arctan2(np.cos(INCL * DEG) * np.sin(u), np.cos(u)) - OMEGA_EARTH * t

    # Convert to degrees and wrap
    lat_deg = lat * 180 / PI
    lon_deg = (lon * 180 / PI) % 360 - 180  # wrap to [-180, 180]

    return t, lat_deg, lon_deg


# =========================================================================
# Compute ground track
# =========================================================================
t, lat, lon = ground_track(num_orbits=15, dt_seconds=30)

# =========================================================================
# Plot
# =========================================================================
fig = plt.figure(figsize=(16, 12))
fig.suptitle('TIROS-1 Ground Track & Coverage Analysis — Mission 1.15\n'
             'First Weather Satellite (April 1, 1960)',
             fontsize=14, fontweight='bold', y=0.98)

gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

# =========================================================================
# Plot 1: World Map with Ground Tracks
# =========================================================================
ax1 = fig.add_subplot(gs[0, :])

# Simple continent outlines (approximate coastlines)
# Draw a basic equirectangular "map"
ax1.set_facecolor('#081828')

# Grid lines
for lat_line in range(-60, 90, 30):
    ax1.axhline(y=lat_line, color='#1a3050', linewidth=0.5)
for lon_line in range(-150, 180, 30):
    ax1.axvline(x=lon_line, color='#1a3050', linewidth=0.5)

# Coverage latitude limits
ax1.axhline(y=INCL, color='#CC6040', linewidth=1, linestyle='--', alpha=0.5)
ax1.axhline(y=-INCL, color='#CC6040', linewidth=1, linestyle='--', alpha=0.5)
ax1.text(182, INCL, f'{INCL}°N', fontsize=7, color='#CC6040', va='center')
ax1.text(182, -INCL, f'{INCL}°S', fontsize=7, color='#CC6040', va='center')

# Shade uncovered latitudes
ax1.axhspan(INCL, 90, alpha=0.15, color='#CC6040')
ax1.axhspan(-90, -INCL, alpha=0.15, color='#CC6040')

# Plot ground tracks — color-code by orbit number
num_orbits = 15
for orb in range(num_orbits):
    t_start = orb * PERIOD
    t_end = (orb + 1) * PERIOD
    mask = (t >= t_start) & (t < t_end)

    orb_lon = lon[mask]
    orb_lat = lat[mask]

    # Detect longitude wrapping (jumps > 180°)
    dlon = np.diff(orb_lon)
    wrap_idx = np.where(np.abs(dlon) > 180)[0]

    # Split at wrap points for clean plotting
    segments = np.split(np.arange(len(orb_lon)), wrap_idx + 1)

    color_val = orb / num_orbits
    color = plt.cm.plasma(color_val)

    for seg in segments:
        if len(seg) > 1:
            ax1.plot(orb_lon[seg], orb_lat[seg], color=color,
                     linewidth=0.8, alpha=0.7)

    # Mark orbit start
    if len(orb_lon) > 0:
        ax1.plot(orb_lon[0], orb_lat[0], '.', color=color, markersize=4)

# Equator
ax1.axhline(y=0, color='#4080CC', linewidth=0.8, alpha=0.3)

ax1.set_xlim(-180, 200)
ax1.set_ylim(-90, 90)
ax1.set_xlabel('Longitude (degrees)')
ax1.set_ylabel('Latitude (degrees)')
ax1.set_title(f'Ground Track — {num_orbits} Orbits '
              f'({num_orbits * PERIOD_MIN / 60:.1f} hours)')
ax1.set_aspect(1.5)

# Colorbar for orbit number
sm = plt.cm.ScalarMappable(cmap='plasma', norm=plt.Normalize(1, num_orbits))
cbar = plt.colorbar(sm, ax=ax1, shrink=0.6, pad=0.01)
cbar.set_label('Orbit Number', fontsize=8)

# =========================================================================
# Plot 2: Latitude Coverage Histogram
# =========================================================================
ax2 = fig.add_subplot(gs[1, 0])

# Histogram of latitude samples (proportional to time spent at each lat)
ax2.hist(lat, bins=90, range=(-90, 90), orientation='horizontal',
         color='#4080CC', alpha=0.7, edgecolor='#2060AA')

# Mark maximum latitude coverage
ax2.axhline(y=INCL, color='#CC6040', linewidth=1.5, linestyle='--',
            label=f'Max latitude: ±{INCL}°')
ax2.axhline(y=-INCL, color='#CC6040', linewidth=1.5, linestyle='--')
ax2.axhline(y=0, color='#888', linewidth=0.8, linestyle=':')

ax2.set_ylabel('Latitude (degrees)')
ax2.set_xlabel('Relative observation density')
ax2.set_title('Latitude Coverage Distribution')
ax2.set_ylim(-90, 90)
ax2.legend(fontsize=8)
ax2.grid(True, alpha=0.3)

# Annotate: satellites spend more time at higher latitudes (slower ground speed)
ax2.annotate('More time at\nhigher latitudes\n(turning points)',
             xy=(0.8, 0.85), xycoords='axes fraction',
             fontsize=7, color='#666', ha='center',
             style='italic')

# =========================================================================
# Plot 3: Coverage Buildup Over Time
# =========================================================================
ax3 = fig.add_subplot(gs[1, 1])

# Simplified coverage model: each orbit covers a swath
# Swath width from wide-angle camera
orbit_alt = (PERI_ALT + APO_ALT) / 2.0
half_fov_rad = np.radians(WA_FOV / 2.0)
swath_km = 2 * orbit_alt * np.tan(half_fov_rad)

# Earth surface area between ±48.4° latitude
earth_area_total = 4 * PI * R_EARTH ** 2  # total surface
# Area between latitudes: 2*pi*R^2 * |sin(lat2) - sin(lat1)|
observable_area = 2 * PI * R_EARTH ** 2 * 2 * np.sin(INCL * DEG)

# Each orbit covers approximately: swath_width * circumference_fraction
orbit_circumference = 2 * PI * R_EARTH * np.cos(np.radians(30))  # average lat ~30°
orbit_coverage = swath_km * orbit_circumference * 0.5  # half in daylight

# Cumulative coverage with overlap reduction
orbits_array = np.arange(1, 15 * 14 + 1)  # 15 days of ~14 orbits/day
cumulative = np.zeros(len(orbits_array))
covered = 0
for i, orb in enumerate(orbits_array):
    # Each new orbit adds coverage, but with increasing overlap
    new_area = orbit_coverage * (1 - covered / observable_area)
    covered += new_area
    covered = min(covered, observable_area)
    cumulative[i] = covered / observable_area * 100

days = orbits_array / (24 * 60 / PERIOD_MIN)

ax3.plot(days, cumulative, color='#4080CC', linewidth=2)
ax3.axhline(y=90, color='#888', linewidth=0.8, linestyle=':', alpha=0.5)
ax3.axhline(y=95, color='#CC6040', linewidth=0.8, linestyle=':', alpha=0.5)

# Mark 78-day mission duration
ax3.axvline(x=78, color='#606878', linewidth=1.5, linestyle='--', alpha=0.7)
ax3.text(78, 50, '  78-day\n  mission', fontsize=8, color='#606878')

# Mark when 90% coverage is reached
idx_90 = np.where(cumulative >= 90)[0]
if len(idx_90) > 0:
    day_90 = days[idx_90[0]]
    ax3.plot(day_90, 90, 'o', color='#4080CC', markersize=8)
    ax3.annotate(f'90% coverage\nat day {day_90:.0f}',
                 xy=(day_90, 90), xytext=(day_90 + 3, 80),
                 fontsize=8, arrowprops=dict(arrowstyle='->', color='#666'))

ax3.set_xlabel('Days Since Launch')
ax3.set_ylabel('Observable Area Covered (%)')
ax3.set_title('Cumulative Coverage of Observable Latitudes')
ax3.set_xlim(0, 80)
ax3.set_ylim(0, 105)
ax3.grid(True, alpha=0.3)

# =========================================================================
# Summary text
# =========================================================================
fig.text(0.5, 0.01,
         f'TIROS-1: {PERI_ALT:.0f}×{APO_ALT:.0f} km, '
         f'{INCL}° inclination, '
         f'period {PERIOD_MIN:.1f} min, '
         f'{24 * 60 / PERIOD_MIN:.1f} orbits/day — '
         f'Longitude shift per orbit: {360 * PERIOD / 86400:.1f}° westward — '
         f'22,952 photos in 78 days',
         ha='center', fontsize=9, style='italic', color='#666')

plt.savefig('tiros1-ground-track.png', dpi=150, bbox_inches='tight',
            facecolor='white')
print("Saved: tiros1-ground-track.png")
plt.show()

# =========================================================================
# Console summary
# =========================================================================
print("\n" + "=" * 70)
print("TIROS-1 Ground Track Summary")
print("=" * 70)
print(f"\nOrbit: {PERI_ALT:.0f} x {APO_ALT:.0f} km, {INCL}° inclination")
print(f"Semi-major axis: {a:.1f} km")
print(f"Eccentricity: {e:.4f}")
print(f"Period: {PERIOD_MIN:.1f} minutes ({PERIOD:.0f} seconds)")
print(f"Orbits per day: {24 * 60 / PERIOD_MIN:.1f}")
print(f"Longitude shift per orbit: {360 * PERIOD / 86400:.1f}° westward")
print(f"\nLatitude coverage: {INCL}°S to {INCL}°N")
print(f"Observable surface area: {observable_area:.0f} km² "
      f"({observable_area / earth_area_total * 100:.1f}% of Earth)")
print(f"Camera swath width: {swath_km:.0f} km (wide-angle, {WA_FOV}° FOV)")
print(f"\nPhotos captured: 22,952 in 78 days ({22952 / 78:.0f} per day)")
print(f"Photos per orbit: {22952 / (78 * 24 * 60 / PERIOD_MIN):.1f}")
