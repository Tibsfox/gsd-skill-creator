#!/usr/bin/env python3
"""
Pioneer 5 — Heliocentric Orbit Simulation
=========================================================================
Mission 1.13: Pioneer 5 (NASA / Thor-Able IV), March 11, 1960
FIRST INTERPLANETARY PROBE — Heliocentric orbit 0.806 × 0.995 AU

Simulates Pioneer 5's orbit in the context of the inner solar system.
The probe was launched into a heliocentric orbit between Earth and Venus,
becoming the first spacecraft to achieve interplanetary trajectory.

Orbital elements:
  Perihelion:    0.806 AU (120.6 million km)
  Aphelion:      0.995 AU (148.9 million km)
  Semi-major:    0.9005 AU (134.7 million km)
  Eccentricity:  0.105
  Period:        311.6 days
  Inclination:   3.35 degrees to the ecliptic

Communication was maintained for 106 days (March 11 - June 26, 1960),
during which Pioneer 5 transmitted data about the interplanetary
magnetic field, solar wind, and cosmic radiation. Contact was lost
at a distance of 36.2 million km from Earth.

This produces:
  1. Top-down solar system view — orbits of Venus, Earth, Pioneer 5
  2. Distance from Earth vs time — showing communication window
  3. Signal strength vs time — received power declining to noise floor
  4. Pioneer 5's position at key dates (launch, mid-mission, loss of signal)

Requires: numpy, matplotlib
Run: python3 heliocentric-orbit.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# =========================================================================
# Constants
# =========================================================================
AU = 1.496e11           # Astronomical Unit (m)
MU_SUN = 1.327e20       # Sun's gravitational parameter (m³/s²)
DAY = 86400.0           # Seconds per day
C = 2.998e8             # Speed of light (m/s)

# =========================================================================
# Orbital Elements
# =========================================================================

# Pioneer 5
P5_A = 0.9005 * AU      # Semi-major axis (m)
P5_E = 0.105            # Eccentricity
P5_PERIOD = 2 * np.pi * np.sqrt(P5_A**3 / MU_SUN)  # ~311.6 days
P5_LAUNCH_DATE = 0      # Day 0 = March 11, 1960
P5_LOS_DATE = 106       # Loss of signal: June 26, 1960

# Earth
EARTH_A = 1.0 * AU
EARTH_E = 0.0167
EARTH_PERIOD = 365.25 * DAY

# Venus
VENUS_A = 0.723 * AU
VENUS_E = 0.0068
VENUS_PERIOD = 224.7 * DAY

# =========================================================================
# Orbital Position Functions
# =========================================================================

def kepler_solve(M, e, tol=1e-8):
    """Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E."""
    E = M.copy()
    for _ in range(50):
        dE = (M - E + e * np.sin(E)) / (1 - e * np.cos(E))
        E += dE
        if np.max(np.abs(dE)) < tol:
            break
    return E

def orbit_position(t, a, e, period, phase0=0):
    """Compute orbital position at time t (in seconds).
    Returns (x, y) in meters and radius r."""
    M = 2 * np.pi * t / period + phase0
    E = kepler_solve(M, e)
    nu = 2 * np.arctan2(np.sqrt(1 + e) * np.sin(E / 2),
                         np.sqrt(1 - e) * np.cos(E / 2))
    r = a * (1 - e * np.cos(E))
    x = r * np.cos(nu)
    y = r * np.sin(nu)
    return x, y, r

# =========================================================================
# Time Array: 0 to 300 days from launch
# =========================================================================
days = np.linspace(0, 300, 3000)
t_sec = days * DAY

# Initial orbital phases (approximate for March 11, 1960)
# Earth at ~70 degrees from vernal equinox on March 11
EARTH_PHASE0 = np.radians(70)
# Venus approximately 45 degrees ahead of Earth
VENUS_PHASE0 = np.radians(115)
# Pioneer 5 launched roughly along Earth's velocity vector
P5_PHASE0 = np.radians(70)

# Compute positions
ex, ey, er = orbit_position(t_sec, EARTH_A, EARTH_E, EARTH_PERIOD, EARTH_PHASE0)
vx, vy, vr = orbit_position(t_sec, VENUS_A, VENUS_E, VENUS_PERIOD, VENUS_PHASE0)
px, py, pr = orbit_position(t_sec, P5_A, P5_E, P5_PERIOD, P5_PHASE0)

# Distance between Pioneer 5 and Earth
dist_p5_earth = np.sqrt((px - ex)**2 + (py - ey)**2)
dist_p5_earth_km = dist_p5_earth / 1000
dist_p5_earth_au = dist_p5_earth / AU

# Light travel time (one-way)
light_time_sec = dist_p5_earth / C
light_time_min = light_time_sec / 60

# =========================================================================
# Link Budget vs Time
# =========================================================================
P_TX = 5.0              # Watts
FREQ = 378.2e6          # Hz
LAMBDA = C / FREQ
G_TX = 3.0              # dBi
G_RX = 43.0             # dBi
P_TX_DBM = 10 * np.log10(P_TX * 1000)

fspl = 20 * np.log10(4 * np.pi * dist_p5_earth / LAMBDA)
p_rx_dbm = P_TX_DBM + G_TX - fspl + G_RX

K_BOLTZ = 1.381e-23
T_SYS = 150.0
BW = 100.0
noise_dbm = 10 * np.log10(K_BOLTZ * T_SYS * BW * 1000)
snr = p_rx_dbm - noise_dbm

# =========================================================================
# Full orbit traces (for drawing complete orbits)
# =========================================================================
theta = np.linspace(0, 2 * np.pi, 500)

# Earth orbit
e_orbit_r = EARTH_A * (1 - EARTH_E**2) / (1 + EARTH_E * np.cos(theta))
e_orbit_x = e_orbit_r * np.cos(theta)
e_orbit_y = e_orbit_r * np.sin(theta)

# Venus orbit
v_orbit_r = VENUS_A * (1 - VENUS_E**2) / (1 + VENUS_E * np.cos(theta))
v_orbit_x = v_orbit_r * np.cos(theta)
v_orbit_y = v_orbit_r * np.sin(theta)

# Pioneer 5 orbit
p_orbit_r = P5_A * (1 - P5_E**2) / (1 + P5_E * np.cos(theta))
p_orbit_x = p_orbit_r * np.cos(theta)
p_orbit_y = p_orbit_r * np.sin(theta)

# =========================================================================
# Plotting
# =========================================================================
fig = plt.figure(figsize=(16, 14))
fig.suptitle("Pioneer 5 — Heliocentric Orbit\n"
             "First interplanetary probe, March 11, 1960 — 0.806 × 0.995 AU",
             fontsize=14, fontweight='bold', color='#E8D060')
fig.patch.set_facecolor('#0a0a15')

gs = gridspec.GridSpec(2, 2, hspace=0.30, wspace=0.30)

# --- Plot 1: Solar System Top-Down View ---
ax1 = fig.add_subplot(gs[0, 0])
ax1.set_facecolor('#0d0d20')
ax1.set_aspect('equal')

# Orbits
ax1.plot(e_orbit_x / AU, e_orbit_y / AU, color='#2060CC', linewidth=0.8,
         alpha=0.4, label='Earth orbit')
ax1.plot(v_orbit_x / AU, v_orbit_y / AU, color='#E8D8B0', linewidth=0.8,
         alpha=0.4, label='Venus orbit')
ax1.plot(p_orbit_x / AU, p_orbit_y / AU, color='#CC8830', linewidth=1.0,
         alpha=0.6, label='Pioneer 5 orbit')

# Sun
ax1.plot(0, 0, '*', color='#E8D060', markersize=15, zorder=10)
ax1.annotate('Sun', (0, 0), textcoords="offset points", xytext=(10, 10),
             fontsize=8, color='#E8D060')

# Trajectories during mission (first 300 days)
ax1.plot(px[:300] / AU, py[:300] / AU, color='#E8D060', linewidth=2,
         alpha=0.8, label='Pioneer 5 trajectory')
ax1.plot(ex[:300] / AU, ey[:300] / AU, color='#2060CC', linewidth=1.5,
         alpha=0.6, linestyle='--')

# Key positions
for day_idx, label, marker_color in [
    (0, 'Launch\n(Mar 11)', '#8AAA70'),
    (50, 'Day 50\n(Apr 30)', '#CC8830'),
    (106, 'LOS\n(Jun 26)', '#CC4020'),
]:
    idx = int(day_idx * 10)  # 10 points per day
    if idx < len(px):
        ax1.plot(px[idx] / AU, py[idx] / AU, 'o', color=marker_color,
                 markersize=8, zorder=10)
        ax1.annotate(label, (px[idx] / AU, py[idx] / AU),
                     textcoords="offset points", xytext=(8, 8),
                     fontsize=7, color=marker_color)
        # Earth position at same time
        ax1.plot(ex[idx] / AU, ey[idx] / AU, 's', color='#2060CC',
                 markersize=6, zorder=10)

        # Line between Pioneer 5 and Earth
        ax1.plot([px[idx] / AU, ex[idx] / AU], [py[idx] / AU, ey[idx] / AU],
                 '--', color='#444', linewidth=0.5)

# Venus position at launch
ax1.plot(vx[0] / AU, vy[0] / AU, 'o', color='#E8D8B0', markersize=7, zorder=10)
ax1.annotate('Venus', (vx[0] / AU, vy[0] / AU), textcoords="offset points",
             xytext=(8, -12), fontsize=7, color='#E8D8B0')

ax1.set_xlabel('x (AU)', color='#888', fontsize=9)
ax1.set_ylabel('y (AU)', color='#888', fontsize=9)
ax1.set_title('Inner Solar System — Top-Down View', color='#ccc', fontsize=11)
ax1.legend(fontsize=7, loc='lower left', facecolor='#0d0d20', edgecolor='#333',
           labelcolor='#aaa')
ax1.tick_params(colors='#666', labelsize=8)
ax1.grid(True, alpha=0.15, color='#444')
ax1.set_xlim(-1.3, 1.3)
ax1.set_ylim(-1.3, 1.3)

# --- Plot 2: Distance from Earth vs Time ---
ax2 = fig.add_subplot(gs[0, 1])
ax2.set_facecolor('#0d0d20')

ax2.plot(days, dist_p5_earth_km / 1e6, color='#CC8830', linewidth=2,
         label='Distance from Earth')
ax2.axhline(y=D_RECORD_KM / 1e6, color='#CC4020', linestyle='--', alpha=0.5,
            label=f'Record: {D_RECORD_KM/1e6:.1f}M km')
ax2.axvline(x=P5_LOS_DATE, color='#CC4020', linestyle=':', alpha=0.7,
            label=f'Loss of signal (day {P5_LOS_DATE})')

# Mark communication window
ax2.axvspan(0, P5_LOS_DATE, alpha=0.05, color='#2060CC')
ax2.text(P5_LOS_DATE / 2, 2, 'Communication\nwindow', ha='center',
         fontsize=8, color='#2060CC', alpha=0.6)

ax2.set_xlabel('Days since launch', color='#888', fontsize=9)
ax2.set_ylabel('Distance (million km)', color='#888', fontsize=9)
ax2.set_title('Distance from Earth vs Time', color='#ccc', fontsize=11)
ax2.legend(fontsize=7, loc='upper left', facecolor='#0d0d20', edgecolor='#333',
           labelcolor='#aaa')
ax2.tick_params(colors='#666', labelsize=8)
ax2.grid(True, alpha=0.15, color='#444')

# Secondary y-axis: AU
ax2b = ax2.twinx()
ax2b.set_ylabel('Distance (AU)', color='#666', fontsize=9)
y_min, y_max = ax2.get_ylim()
ax2b.set_ylim(y_min * 1e9 / AU, y_max * 1e9 / AU)
ax2b.tick_params(colors='#666', labelsize=8)

# --- Plot 3: Received Power and SNR vs Time ---
ax3 = fig.add_subplot(gs[1, 0])
ax3.set_facecolor('#0d0d20')

ax3.plot(days, p_rx_dbm, color='#2060CC', linewidth=2, label='Received power (dBm)')
ax3.axhline(y=noise_dbm, color='#CC4020', linestyle='--', alpha=0.7,
            label=f'Noise floor ({noise_dbm:.0f} dBm)')
ax3.axvline(x=P5_LOS_DATE, color='#CC4020', linestyle=':', alpha=0.7)

# Mark where SNR drops below detection (0 dB)
snr_zero_day = days[np.argmin(np.abs(snr))]
ax3.annotate(f'SNR = 0 dB\n(day {snr_zero_day:.0f})',
             (snr_zero_day, p_rx_dbm[np.argmin(np.abs(snr))]),
             textcoords="offset points", xytext=(20, 20),
             fontsize=7, color='#CC4020',
             arrowprops=dict(arrowstyle='->', color='#CC4020', lw=0.8))

ax3.set_xlabel('Days since launch', color='#888', fontsize=9)
ax3.set_ylabel('Power (dBm)', color='#888', fontsize=9)
ax3.set_title('Received Signal Power vs Time', color='#ccc', fontsize=11)
ax3.legend(fontsize=7, loc='upper right', facecolor='#0d0d20', edgecolor='#333',
           labelcolor='#aaa')
ax3.tick_params(colors='#666', labelsize=8)
ax3.grid(True, alpha=0.15, color='#444')

# --- Plot 4: Light Travel Time ---
ax4 = fig.add_subplot(gs[1, 1])
ax4.set_facecolor('#0d0d20')

ax4.plot(days, light_time_min, color='#E8D060', linewidth=2,
         label='One-way light time')
ax4.plot(days, 2 * light_time_min, color='#CC8830', linewidth=1.5,
         alpha=0.6, linestyle='--', label='Round-trip time')
ax4.axvline(x=P5_LOS_DATE, color='#CC4020', linestyle=':', alpha=0.7)

# Mark Pioneer 5 record
idx_los = int(P5_LOS_DATE * 10)
if idx_los < len(light_time_min):
    ax4.annotate(f'{light_time_min[idx_los]:.1f} min\none-way at LOS',
                 (P5_LOS_DATE, light_time_min[idx_los]),
                 textcoords="offset points", xytext=(-60, 20),
                 fontsize=7, color='#E8D060',
                 arrowprops=dict(arrowstyle='->', color='#E8D060', lw=0.8))

ax4.set_xlabel('Days since launch', color='#888', fontsize=9)
ax4.set_ylabel('Light Travel Time (minutes)', color='#888', fontsize=9)
ax4.set_title('Signal Travel Time', color='#ccc', fontsize=11)
ax4.legend(fontsize=7, loc='upper left', facecolor='#0d0d20', edgecolor='#333',
           labelcolor='#aaa')
ax4.tick_params(colors='#666', labelsize=8)
ax4.grid(True, alpha=0.15, color='#444')

plt.tight_layout(rect=[0, 0, 1, 0.94])
plt.savefig('pioneer5-heliocentric-orbit.png', dpi=150, facecolor='#0a0a15',
            bbox_inches='tight')
plt.show()

# =========================================================================
# Summary
# =========================================================================
print("\n" + "=" * 70)
print("PIONEER 5 — HELIOCENTRIC ORBIT SUMMARY")
print("=" * 70)
print(f"\nOrbital elements:")
print(f"  Perihelion:      {P5_A * (1 - P5_E) / AU:.3f} AU ({P5_A * (1 - P5_E) / 1e9:.1f} million km)")
print(f"  Aphelion:        {P5_A * (1 + P5_E) / AU:.3f} AU ({P5_A * (1 + P5_E) / 1e9:.1f} million km)")
print(f"  Semi-major axis: {P5_A / AU:.4f} AU")
print(f"  Eccentricity:    {P5_E:.3f}")
print(f"  Period:          {P5_PERIOD / DAY:.1f} days")

print(f"\nMission timeline:")
print(f"  Launch:          March 11, 1960 (day 0)")
print(f"  Loss of signal:  June 26, 1960 (day {P5_LOS_DATE})")
print(f"  Distance at LOS: {dist_p5_earth_km[int(P5_LOS_DATE * 10)] / 1e6:.1f} million km")
print(f"  Light time at LOS: {light_time_min[int(P5_LOS_DATE * 10)]:.1f} minutes one-way")
print(f"  SNR at LOS:      {snr[int(P5_LOS_DATE * 10)]:.1f} dB")
