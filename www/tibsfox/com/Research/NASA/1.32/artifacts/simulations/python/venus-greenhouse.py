#!/usr/bin/env python3
"""
Venus Greenhouse Effect — Mariner 2 Confirmation
==================================================
Mission 1.32: Mariner 2 (Atlas-Agena B), December 14, 1962

Mariner 2's microwave radiometer confirmed Venus's surface temperature
at ~460°C (733 K), proving the greenhouse effect at planetary scale.

This script visualizes:
  1. Planetary temperature comparison (with/without greenhouse)
  2. Venus atmospheric opacity at microwave wavelengths
  3. Mariner 2 radiometer scan results
  4. Earth vs Venus greenhouse comparison

Requires: numpy, matplotlib
Run: python3 venus-greenhouse.py
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

sigma = 5.67e-8  # Stefan-Boltzmann constant

# === Planetary data ===
planets = [
    ("Mercury", 9127, 0.12, 440, 0),
    ("Venus",   2601, 0.77, 733, 506),
    ("Earth",   1361, 0.30, 288, 33),
    ("Mars",     586, 0.25, 210, -17),
]

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.patch.set_facecolor('#0D1A0D')

# Panel 1: Equilibrium vs Actual Temperature
ax = axes[0, 0]
names = [p[0] for p in planets]
T_eq = [(S * (1-A) / (4*sigma))**0.25 for _, S, A, _, _ in planets]
T_actual = [p[3] for p in planets]

x = np.arange(len(names))
bars1 = ax.bar(x - 0.2, T_eq, 0.35, label='Equilibrium (no greenhouse)',
               color='#4A90D9', edgecolor='#333')
bars2 = ax.bar(x + 0.2, T_actual, 0.35, label='Actual (measured)',
               color='#CC3300', edgecolor='#333')

ax.set_xticks(x)
ax.set_xticklabels(names, color='#E8E8E8')
ax.set_ylabel('Temperature (K)', color='#E8E8E8')
ax.set_title('Planetary Temperatures: Equilibrium vs Actual', color='#C8E8C8')
ax.legend(fontsize=8)
ax.tick_params(colors='#A0A0A0')
ax.set_facecolor('#0A2E0A')
ax.grid(axis='y', alpha=0.2)

# Annotate Venus
ax.annotate('MARINER 2\nmeasured this',
            xy=(1.2, 733), fontsize=8, color='gold',
            fontweight='bold', ha='center')

# Panel 2: Greenhouse Warming by Planet
ax2 = axes[0, 1]
greenhouse = [p[4] for p in planets]
colors = ['#888888', '#CC3300', '#4A90D9', '#AA6633']
ax2.barh(names, greenhouse, color=colors, edgecolor='#333')
ax2.set_xlabel('Greenhouse Warming (K)', color='#E8E8E8')
ax2.set_title('Greenhouse Effect by Planet', color='#C8E8C8')
ax2.axvline(x=0, color='#E8E8E8', linewidth=0.5)
ax2.tick_params(colors='#A0A0A0')
ax2.set_facecolor('#0A2E0A')
ax2.grid(axis='x', alpha=0.2)

for i, (name, dT) in enumerate(zip(names, greenhouse)):
    ax2.text(max(dT + 10, 20), i, f'+{dT} K' if dT > 0 else f'{dT} K',
             va='center', color='#E8E8E8', fontsize=9)

# Panel 3: Mariner 2 Radiometer Scan
ax3 = axes[1, 0]
# Simulated scan across Venus disk
scan_angle = np.linspace(-1, 1, 100)  # -1 to 1 across disk
T_13mm = 650 - 100 * scan_angle**2 + 20 * np.random.randn(100)  # limb darkening
T_19mm = 700 - 80 * scan_angle**2 + 25 * np.random.randn(100)

ax3.plot(scan_angle, T_13mm, 'c-', alpha=0.7, linewidth=1.5, label='13.5 mm (22.2 GHz)')
ax3.plot(scan_angle, T_19mm, 'r-', alpha=0.7, linewidth=1.5, label='19 mm (15.8 GHz)')
ax3.axhline(y=733, color='gold', linestyle='--', alpha=0.5, label='Surface T = 733 K')
ax3.fill_between(scan_angle, 0, 1, where=(abs(scan_angle) < 1),
                 alpha=0.05, color='yellow', label='Venus disk')
ax3.set_xlabel('Position across Venus disk', color='#E8E8E8')
ax3.set_ylabel('Brightness Temperature (K)', color='#E8E8E8')
ax3.set_title('Mariner 2 Microwave Radiometer Scan\nDecember 14, 1962', color='#C8E8C8')
ax3.legend(fontsize=8)
ax3.tick_params(colors='#A0A0A0')
ax3.set_facecolor('#0A2E0A')
ax3.grid(alpha=0.2)
ax3.set_ylim(400, 850)

# Panel 4: CO2 concentration vs temperature
ax4 = axes[1, 1]
co2_ppm = np.logspace(1, 6, 100)  # 10 to 1,000,000 ppm
# Simplified logarithmic forcing
dT = 5.35 * np.log(co2_ppm / 280) * 3.0  # climate sensitivity ~3K per doubling
T_surface = 255 + 33 + dT  # base + current greenhouse + forcing

ax4.semilogx(co2_ppm, T_surface, 'r-', linewidth=2)
ax4.axhline(y=288, color='#4A90D9', linestyle='--', alpha=0.5, label='Earth today (288 K)')
ax4.axhline(y=733, color='gold', linestyle='--', alpha=0.5, label='Venus (733 K)')
ax4.axvline(x=420, color='#4A90D9', linestyle=':', alpha=0.5, label='Earth CO₂ (420 ppm)')
ax4.axvline(x=965000, color='gold', linestyle=':', alpha=0.5, label='Venus CO₂ (965,000 ppm)')

ax4.set_xlabel('CO₂ Concentration (ppm)', color='#E8E8E8')
ax4.set_ylabel('Surface Temperature (K)', color='#E8E8E8')
ax4.set_title('CO₂ vs Surface Temperature\n(simplified forcing model)', color='#C8E8C8')
ax4.legend(fontsize=7, loc='upper left')
ax4.tick_params(colors='#A0A0A0')
ax4.set_facecolor('#0A2E0A')
ax4.grid(alpha=0.2)

plt.tight_layout()
plt.savefig('venus_greenhouse.png', dpi=150, facecolor='#0D1A0D')
print("Saved: venus_greenhouse.png")
print("\nVenus: 460°C. 96.5% CO₂. 90 atmospheres.")
print("Earth: 15°C.  0.042% CO₂. 1 atmosphere.")
print("Same physics. Different scale. Mariner 2 measured the difference.")
