#!/usr/bin/env python3
"""
venus-transfer.py — Earth-Venus Hohmann Transfer Orbit

Calculates and visualizes the transfer orbit that Mariner 1 was
supposed to follow and that Mariner 2 actually flew. Shows the
inner solar system geometry, the 1962 launch window, and the
146-day trip time.

Mission 1.31 — Mariner 1 (Atlas-Agena B), July 22, 1962
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

AU = 1.496e11  # meters
mu_sun = 1.327e20  # m^3/s^2

# Orbital parameters
r_earth = 1.000 * AU
r_venus = 0.723 * AU

# Hohmann transfer orbit
a_transfer = (r_earth + r_venus) / 2
e_transfer = (r_earth - r_venus) / (r_earth + r_venus)
T_transfer = 2 * np.pi * np.sqrt(a_transfer**3 / mu_sun)
trip_time = T_transfer / 2

# Departure and arrival velocities
v_earth_circ = np.sqrt(mu_sun / r_earth)
v_depart = np.sqrt(mu_sun * (2/r_earth - 1/a_transfer))
v_arrive = np.sqrt(mu_sun * (2/r_venus - 1/a_transfer))
v_venus_circ = np.sqrt(mu_sun / r_venus)

delta_v_depart = v_depart - v_earth_circ
delta_v_arrive = v_venus_circ - v_arrive

print('MARINER 1/2: VENUS TRANSFER ORBIT')
print('=' * 55)
print(f'Transfer semi-major axis: {a_transfer/AU:.3f} AU')
print(f'Transfer eccentricity:    {e_transfer:.3f}')
print(f'Trip time:                {trip_time/86400:.0f} days')
print(f'')
print(f'Departure delta-v:        {delta_v_depart/1e3:.2f} km/s')
print(f'Arrival velocity excess:  {abs(delta_v_arrive)/1e3:.2f} km/s')
print(f'')
print(f'Mariner 1 launched July 22, 1962 — destroyed T+293s')
print(f'Mariner 2 launched August 27, 1962 — arrived Dec 14, 1962')
print(f'  Trip time: {(109):.0f} days (actual, slightly non-Hohmann)')

# ================================================================
# VISUALIZATION: Top-down inner solar system
# ================================================================
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 7))

theta = np.linspace(0, 2*np.pi, 360)

# Panel 1: Transfer orbit geometry
# Earth orbit
ax1.plot(np.cos(theta), np.sin(theta), 'b-', linewidth=1.5, alpha=0.5, label='Earth orbit (1.00 AU)')
# Venus orbit
ax1.plot(0.723 * np.cos(theta), 0.723 * np.sin(theta), 'orange', linewidth=1.5, alpha=0.5, label='Venus orbit (0.72 AU)')
# Transfer ellipse
r_transfer = a_transfer * (1 - e_transfer**2) / (1 + e_transfer * np.cos(theta))
x_t = r_transfer * np.cos(theta) / AU
y_t = r_transfer * np.sin(theta) / AU
# Only show the outbound half (Earth to Venus)
mask = theta <= np.pi
ax1.plot(x_t[mask], y_t[mask], 'gold', linewidth=2.5, label='Transfer orbit')
ax1.plot(x_t[~mask], y_t[~mask], 'gold', linewidth=1, alpha=0.3, linestyle='--')

# Sun
ax1.plot(0, 0, 'yo', markersize=15, zorder=5)
ax1.annotate('Sun', (0.05, 0.05), fontsize=9, color='yellow')

# Earth at launch (right side, 0 degrees)
ax1.plot(1.0, 0, 'bo', markersize=10, zorder=5)
ax1.annotate('Earth\n(launch)', (1.05, 0.05), fontsize=8, color='cyan')

# Venus at arrival (lower left, ~-108 degrees ahead)
venus_angle = np.pi  # at arrival point (opposite side)
ax1.plot(0.723 * np.cos(venus_angle), 0.723 * np.sin(venus_angle), 'o', color='orange', markersize=10, zorder=5)
ax1.annotate('Venus\n(arrival)', (0.723*np.cos(venus_angle)+0.05, 0.723*np.sin(venus_angle)-0.1), fontsize=8, color='orange')

# Mariner 1 destruct point (barely off Earth)
ax1.plot(1.0, 0.01, 'rx', markersize=15, markeredgewidth=3, zorder=6)
ax1.annotate('Mariner 1\nDESTRUCT\nT+293s', (1.05, 0.08), fontsize=7, color='red', fontweight='bold')

ax1.set_xlim(-1.3, 1.5)
ax1.set_ylim(-1.3, 1.3)
ax1.set_aspect('equal')
ax1.set_xlabel('Distance (AU)')
ax1.set_ylabel('Distance (AU)')
ax1.set_title('Earth-Venus Hohmann Transfer')
ax1.legend(fontsize=8, loc='lower left')
ax1.grid(alpha=0.2)

# Panel 2: Launch window timeline
days = np.arange(0, 600)
# Synodic period
T_synodic = 1 / (1/224.7 - 1/365.25)

# Window efficiency (energy cost vs. time from optimal)
optimal_day = 0  # July 22 = window opening
window_efficiency = np.exp(-0.5 * ((days - optimal_day) / 25)**2) * 100

ax2.fill_between(days[:80], 0, window_efficiency[:80], alpha=0.2, color='green', label='1962 Venus window')
ax2.plot(days[:80], window_efficiency[:80], 'g-', linewidth=1.5)

# Mark Mariner 1 and 2
ax2.axvline(0, color='red', linewidth=2, linestyle='-', label='Mariner 1 (Jul 22) — FAILED')
ax2.axvline(36, color='blue', linewidth=2, linestyle='-', label='Mariner 2 (Aug 27) — SUCCESS')
ax2.axvline(T_synodic, color='gray', linewidth=1, linestyle='--', alpha=0.5, label=f'Next window ({T_synodic:.0f} days later)')

ax2.annotate('T+293s\nDESTRUCT', (0, 85), fontsize=9, color='red', ha='center', fontweight='bold')
ax2.annotate('36 days\nlater', (36, 75), fontsize=9, color='blue', ha='center', fontweight='bold')
ax2.annotate(f'Next window\n~{T_synodic/30:.0f} months', (T_synodic, 10), fontsize=8, color='gray', ha='center')

ax2.set_xlim(-20, T_synodic + 50)
ax2.set_xlabel('Days from window opening')
ax2.set_ylabel('Window efficiency (%)')
ax2.set_title('1962 Venus Launch Window')
ax2.legend(fontsize=8)
ax2.grid(alpha=0.2)

plt.suptitle('MARINER 1: The Venus Window That Almost Closed',
             fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig('mariner1_venus_transfer.png', dpi=150, bbox_inches='tight')
print('\nVisualization saved: mariner1_venus_transfer.png')
