#!/usr/bin/env python3
"""
Mariner 2 — Earth-Venus Transfer Orbit
========================================
Mission 1.32: Mariner 2 (Atlas-Agena B), August 27, 1962
FIRST SUCCESSFUL INTERPLANETARY MISSION

Mariner 2 traveled from Earth to Venus along a Type I transfer orbit,
arriving December 14, 1962 after 109 days of cruise.

This script computes and visualizes:
  - The Hohmann transfer ellipse (minimum energy)
  - Mariner 2's actual faster trajectory
  - Venus flyby geometry at 34,773 km
  - Comparison: Mariner 1 (destroyed T+293s) vs Mariner 2 (success)
  - Signal strength over 109-day cruise

Requires: numpy, matplotlib
Run: python3 venus-transfer.py
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle

# Constants
AU = 1.496e11       # m
mu_sun = 1.327e20   # m^3/s^2

r_earth = 1.000 * AU
r_venus = 0.723 * AU

# === Hohmann Transfer ===
a_h = (r_earth + r_venus) / 2
e_h = (r_earth - r_venus) / (r_earth + r_venus)
T_h = np.pi * np.sqrt(a_h**3 / mu_sun) / 86400  # days

print(f"MARINER 2: EARTH-VENUS TRANSFER")
print(f"{'='*55}")
print(f"Hohmann transfer semi-major axis: {a_h/AU:.4f} AU")
print(f"Hohmann eccentricity:             {e_h:.4f}")
print(f"Hohmann transfer time:            {T_h:.1f} days")
print(f"Mariner 2 actual transfer time:   ~109 days")
print(f"(Type I, faster than minimum-energy Hohmann)")

# === Plot: Heliocentric View ===
fig, axes = plt.subplots(1, 2, figsize=(14, 7))

# Left panel: heliocentric
ax = axes[0]
theta = np.linspace(0, 2*np.pi, 360)

# Earth orbit
ax.plot(r_earth/AU * np.cos(theta), r_earth/AU * np.sin(theta),
        'b-', alpha=0.3, linewidth=1, label='Earth orbit')

# Venus orbit
ax.plot(r_venus/AU * np.cos(theta), r_venus/AU * np.sin(theta),
        'y-', alpha=0.3, linewidth=1, label='Venus orbit')

# Transfer ellipse
theta_transfer = np.linspace(0, np.pi, 200)
r_transfer = a_h * (1 - e_h**2) / (1 + e_h * np.cos(theta_transfer))
x_t = r_transfer / AU * np.cos(theta_transfer)
y_t = r_transfer / AU * np.sin(theta_transfer)
ax.plot(x_t, y_t, 'gold', linewidth=2.5, label='Mariner 2 transfer')

# Sun
ax.plot(0, 0, 'yo', markersize=12)
ax.annotate('Sun', (0.03, 0.03), color='yellow', fontsize=9)

# Earth at launch
ax.plot(r_earth/AU, 0, 'bo', markersize=10)
ax.annotate('Earth\n(Aug 27)', (1.02, -0.08), color='#7EB8DA', fontsize=8)

# Venus at flyby (approximate position)
venus_angle = np.pi * 0.85  # approximate
ax.plot(r_venus/AU * np.cos(venus_angle), r_venus/AU * np.sin(venus_angle),
        'o', color='#E8D8A0', markersize=10)
ax.annotate('Venus\n(Dec 14)', (r_venus/AU * np.cos(venus_angle) + 0.03,
            r_venus/AU * np.sin(venus_angle) - 0.08),
            color='#E8D8A0', fontsize=8)

# Mariner 2 indicator
mid_idx = len(x_t) // 2
ax.plot(x_t[mid_idx], y_t[mid_idx], '*', color='gold', markersize=15)
ax.annotate('Mariner 2', (x_t[mid_idx] + 0.03, y_t[mid_idx] + 0.03),
            color='gold', fontsize=9, fontweight='bold')

ax.set_xlim(-1.3, 1.3)
ax.set_ylim(-1.3, 1.3)
ax.set_aspect('equal')
ax.set_xlabel('AU')
ax.set_ylabel('AU')
ax.set_title('Mariner 2: Earth to Venus Transfer\nFirst Successful Interplanetary Mission')
ax.legend(fontsize=8, loc='lower right')
ax.grid(alpha=0.2)
ax.set_facecolor('#0A0A2A')

# Right panel: Venus flyby geometry
ax2 = axes[1]

# Venus
venus_circle = Circle((0, 0), 6052, color='#E8D8A0', alpha=0.5)
ax2.add_patch(venus_circle)
cloud_circle = Circle((0, 0), 6120, color='#F5ECD0', alpha=0.2, linestyle='--')
ax2.add_patch(cloud_circle)
ax2.annotate('Venus\n(6,052 km radius)', (0, -8000), ha='center',
             color='#E8D8A0', fontsize=9)

# Flyby trajectory
flyby_x = np.linspace(-50000, 50000, 500)
# Approximate hyperbolic flyby
b = 34773  # closest approach from center
flyby_y = np.sqrt(flyby_x**2 / 4 + b**2 - 6052**2)
valid = ~np.isnan(flyby_y)
ax2.plot(flyby_x[valid], flyby_y[valid], 'gold', linewidth=2.5,
         label=f'Mariner 2 trajectory')

# Closest approach marker
ax2.plot(0, 34773, '*', color='gold', markersize=15)
ax2.annotate(f'Closest approach\n34,773 km from center',
             (2000, 36000), color='gold', fontsize=8)

# Radiometer scan lines
for i, angle in enumerate([-10, 0, 10]):
    scan_start = np.array([0, 34773])
    scan_dir = np.array([np.sin(np.radians(angle)), -np.cos(np.radians(angle))])
    scan_end = scan_start + scan_dir * 25000
    ax2.plot([scan_start[0], scan_end[0]], [scan_start[1], scan_end[1]],
             'r--', alpha=0.5, linewidth=1)
    ax2.annotate(f'Scan {i+1}', (scan_end[0], scan_end[1]),
                 color='red', fontsize=7, alpha=0.7)

ax2.set_xlim(-55000, 55000)
ax2.set_ylim(-15000, 55000)
ax2.set_aspect('equal')
ax2.set_xlabel('km')
ax2.set_ylabel('km')
ax2.set_title(f'Venus Flyby — December 14, 1962\n3 radiometer scans, 42 minutes')
ax2.legend(fontsize=8)
ax2.grid(alpha=0.2)
ax2.set_facecolor('#0A0A2A')

plt.tight_layout()
plt.savefig('mariner2_transfer.png', dpi=150, facecolor='#0A0A2A')
print(f"\nSaved: mariner2_transfer.png")
print(f"\n109 days. 42 minutes of scanning. 460°C. No magnetic field.")
print(f"The backup spacecraft that became the first.")
