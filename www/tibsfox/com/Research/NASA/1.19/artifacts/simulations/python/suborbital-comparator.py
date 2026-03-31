#!/usr/bin/env python3
"""
Suborbital Trajectory Comparator — Shepard, Ham, and Gagarin
==============================================================
NASA Mission Series v1.19

Compares three historic flights from 1961:
  1. Mercury-Redstone 3 (MR-3) — Alan Shepard, May 5, 1961
     First American in space. Suborbital, 187.5 km apogee.
  2. Mercury-Redstone 2 (MR-2) — Ham the chimp, Jan 31, 1961
     First hominid Redstone flight. Suborbital, 253 km apogee.
     (Higher than Shepard due to over-burn — engine ran 1 sec long)
  3. Vostok 1 — Yuri Gagarin, April 12, 1961
     First human in space. Full orbit, 327 km apogee.

Plots:
  - Altitude vs time (all three on same axes)
  - Velocity vs time
  - G-force vs time
  Annotated with key events (MECO, apogee, retrofire, max-g).

Usage: python3 suborbital-comparator.py
Dependencies: numpy, matplotlib
Output: suborbital_comparator.png (3 subplots)
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch

# ============================================================
# PHYSICAL CONSTANTS
# ============================================================

G_EARTH = 9.80665     # m/s^2
R_EARTH = 6.371e6     # m

# ============================================================
# MISSION PROFILES — Piecewise approximations from flight data
# ============================================================
# Each profile is a series of (time_seconds, value) keyframes
# interpolated linearly between points.

def interpolate_profile(times, values, t_array):
    """Linearly interpolate a profile defined by keyframe pairs."""
    return np.interp(t_array, times, values)


# --- MR-3: Alan Shepard — Freedom 7 ---
# Total flight: 15 min 28 sec (928 seconds)
# Launch: May 5, 1961, 14:34 UTC from LC-5
# Redstone A-7 engine: 78,000 lbf, burn time ~142 seconds

MR3_ALT_T = [0, 30, 60, 90, 120, 142, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 780, 840, 928]
MR3_ALT_V = [0, 8, 28, 55, 95, 130, 170, 187.5, 185, 175, 158, 130, 95, 60, 30, 10, 2, 0.5, 0]  # km

MR3_VEL_T = [0, 30, 60, 90, 120, 142, 200, 300, 400, 500, 600, 700, 800, 870, 900, 928]
MR3_VEL_V = [0, 500, 1100, 1700, 2100, 2300, 2250, 2100, 1800, 1200, 600, 400, 500, 800, 400, 30]  # m/s

MR3_GF_T = [0, 10, 30, 60, 100, 130, 142, 143, 145, 440, 442, 445, 450, 455, 460,
            520, 530, 540, 550, 600, 700, 780, 928]
MR3_GF_V = [1.0, 1.2, 2.0, 3.5, 5.0, 6.0, 6.3, 0.5, 0.0, 0.0, 1.0, 1.5, 1.0, 0.5, 0.0,
            6.0, 9.5, 11.6, 9.0, 4.0, 1.0, 1.0, 3.0]


# --- MR-2: Ham the Chimp ---
# Total flight: 16 min 39 sec (999 seconds)
# Launch: Jan 31, 1961 from LC-5
# Redstone engine over-burned by ~1 second → higher apogee, higher speed
# Velocity ~200 m/s faster than planned → steeper reentry

MR2_ALT_T = [0, 30, 60, 90, 120, 137, 145, 200, 260, 320, 380, 440, 500, 560, 620, 700, 780, 860, 999]
MR2_ALT_V = [0, 9, 32, 62, 105, 145, 155, 210, 245, 253, 248, 230, 200, 155, 105, 55, 20, 3, 0]  # km

MR2_VEL_T = [0, 30, 60, 90, 120, 137, 200, 320, 440, 560, 680, 800, 900, 960, 999]
MR2_VEL_V = [0, 550, 1200, 1850, 2300, 2500, 2400, 2100, 1600, 1000, 500, 600, 800, 400, 30]  # m/s

MR2_GF_T = [0, 10, 30, 60, 100, 130, 137, 138, 140, 480, 560, 580, 590, 600, 610,
            650, 700, 800, 900, 999]
MR2_GF_V = [1.0, 1.3, 2.2, 3.8, 5.5, 6.8, 7.0, 0.8, 0.0, 0.0, 4.0, 8.0, 12.0, 14.7, 11.0,
            6.0, 3.0, 1.0, 1.0, 3.5]


# --- Vostok 1: Yuri Gagarin ---
# Total flight: 108 minutes (6480 seconds) — one full orbit
# We show only the first ~2000 seconds (launch + partial orbit + reentry)
# to fit on the same time axis. Full orbital altitude shown as constant.
# Launch: April 12, 1961, 06:07 UTC from Baikonur
# Vostok 8K72K rocket: ~900,000 lbf total thrust

GAGARIN_ALT_T = [0, 60, 120, 180, 240, 300, 500, 1000, 2000, 3000, 4000, 5000, 5500, 5800,
                 6000, 6200, 6300, 6400, 6480]
GAGARIN_ALT_V = [0, 20, 60, 120, 190, 250, 315, 327, 320, 310, 300, 280, 200, 120,
                 60, 20, 8, 2, 0]  # km

GAGARIN_VEL_T = [0, 60, 120, 180, 240, 300, 500, 1000, 3000, 5000, 5800, 6000, 6200, 6400, 6480]
GAGARIN_VEL_V = [0, 800, 1800, 3200, 5000, 7000, 7840, 7800, 7750, 7700, 5000, 3000, 1000, 200, 10]  # m/s

GAGARIN_GF_T = [0, 10, 60, 120, 180, 240, 290, 300, 301, 305, 500, 5000, 5500, 5600,
                5700, 5750, 5800, 5900, 6000, 6200, 6480]
GAGARIN_GF_V = [1.0, 1.5, 2.5, 3.5, 4.0, 4.5, 4.8, 5.0, 0.5, 0.0, 0.0, 0.0, 1.0, 3.0,
                5.0, 7.0, 8.0, 6.0, 3.0, 1.0, 4.0]  # Gagarin ejected + parachute


# ============================================================
# TIME AXIS — Show first 1200 seconds for suborbital comparison
# ============================================================

# For the main comparison, use 1000 seconds (covers both suborbital flights)
t_sub = np.linspace(0, 1000, 2000)

# For Gagarin, show abbreviated profile up to 1000s (launch + orbital insertion)
# Then show a note that he continued for 108 minutes total
t_gag_full = np.linspace(0, 6480, 5000)

# ============================================================
# COMPUTE PROFILES
# ============================================================

mr3_alt = interpolate_profile(MR3_ALT_T, MR3_ALT_V, t_sub)
mr3_vel = interpolate_profile(MR3_VEL_T, MR3_VEL_V, t_sub)
mr3_gf  = interpolate_profile(MR3_GF_T, MR3_GF_V, t_sub)

mr2_alt = interpolate_profile(MR2_ALT_T, MR2_ALT_V, t_sub)
mr2_vel = interpolate_profile(MR2_VEL_T, MR2_VEL_V, t_sub)
mr2_gf  = interpolate_profile(MR2_GF_T, MR2_GF_V, t_sub)

gag_alt = interpolate_profile(GAGARIN_ALT_T, GAGARIN_ALT_V, t_sub)
gag_vel = interpolate_profile(GAGARIN_VEL_T, GAGARIN_VEL_V, t_sub)
gag_gf  = interpolate_profile(GAGARIN_GF_T, GAGARIN_GF_V, t_sub)


# ============================================================
# PLOTTING
# ============================================================

fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(14, 12), sharex=True)
fig.patch.set_facecolor('#0c1020')

# Color scheme
COL_MR3 = '#4488FF'    # Freedom blue
COL_MR2 = '#FF8844'    # Ham orange
COL_GAG = '#CC4444'    # Vostok red
COL_BG  = '#0a0e1a'
COL_TXT = '#889098'
COL_GRID = '#1a2040'

# --- SUBPLOT 1: Altitude vs Time ---
ax1.set_facecolor(COL_BG)
ax1.plot(t_sub, mr3_alt, color=COL_MR3, linewidth=2.0, label='MR-3 Shepard (187.5 km)')
ax1.plot(t_sub, mr2_alt, color=COL_MR2, linewidth=2.0, label='MR-2 Ham (253 km)')
ax1.plot(t_sub, gag_alt, color=COL_GAG, linewidth=2.0, linestyle='--',
         label='Vostok 1 Gagarin (327 km → orbit)')

# Annotations
ax1.annotate('Shepard apogee\n187.5 km', xy=(300, 187.5),
             xytext=(380, 210), color=COL_MR3, fontsize=8,
             arrowprops=dict(arrowstyle='->', color=COL_MR3))
ax1.annotate('Ham apogee\n253 km', xy=(320, 253),
             xytext=(420, 280), color=COL_MR2, fontsize=8,
             arrowprops=dict(arrowstyle='->', color=COL_MR2))
ax1.annotate('Gagarin: orbital\n(continues to 327 km)', xy=(500, 315),
             xytext=(600, 300), color=COL_GAG, fontsize=8,
             arrowprops=dict(arrowstyle='->', color=COL_GAG))

# Karman line
ax1.axhline(y=100, color='#556677', linewidth=0.8, linestyle=':')
ax1.text(20, 103, 'Karman line (100 km)', color='#556677', fontsize=7)

ax1.set_ylabel('Altitude (km)', color=COL_TXT, fontsize=11)
ax1.set_title('Suborbital Trajectory Comparison — 1961\nShepard (MR-3) vs Ham (MR-2) vs Gagarin (Vostok 1)',
              color='#C0C0D0', fontsize=13, pad=10)
ax1.legend(loc='upper right', fontsize=8, facecolor=COL_BG,
           edgecolor=COL_GRID, labelcolor=COL_TXT)
ax1.set_ylim(0, 350)
ax1.tick_params(colors='#556677')
ax1.grid(alpha=0.15, color='#334455')
for spine in ax1.spines.values():
    spine.set_color(COL_GRID)


# --- SUBPLOT 2: Velocity vs Time ---
ax2.set_facecolor(COL_BG)
ax2.plot(t_sub, mr3_vel, color=COL_MR3, linewidth=2.0, label='MR-3 Shepard')
ax2.plot(t_sub, mr2_vel, color=COL_MR2, linewidth=2.0, label='MR-2 Ham')
ax2.plot(t_sub, gag_vel, color=COL_GAG, linewidth=2.0, linestyle='--', label='Vostok 1 Gagarin')

# MECO annotations
ax2.annotate('MR-3 MECO\n2,300 m/s', xy=(142, 2300),
             xytext=(200, 2500), color=COL_MR3, fontsize=8,
             arrowprops=dict(arrowstyle='->', color=COL_MR3))
ax2.annotate('MR-2 MECO\n2,500 m/s\n(over-burn)', xy=(137, 2500),
             xytext=(50, 2700), color=COL_MR2, fontsize=8,
             arrowprops=dict(arrowstyle='->', color=COL_MR2))
ax2.annotate('Gagarin: orbital velocity\n~7,840 m/s', xy=(500, 7840),
             xytext=(600, 7200), color=COL_GAG, fontsize=8,
             arrowprops=dict(arrowstyle='->', color=COL_GAG))

# Orbital velocity threshold
ax2.axhline(y=7800, color='#556677', linewidth=0.8, linestyle=':')
ax2.text(20, 7900, 'Orbital velocity (~7,800 m/s)', color='#556677', fontsize=7)

ax2.set_ylabel('Velocity (m/s)', color=COL_TXT, fontsize=11)
ax2.legend(loc='upper right', fontsize=8, facecolor=COL_BG,
           edgecolor=COL_GRID, labelcolor=COL_TXT)
ax2.set_ylim(0, 8500)
ax2.tick_params(colors='#556677')
ax2.grid(alpha=0.15, color='#334455')
for spine in ax2.spines.values():
    spine.set_color(COL_GRID)


# --- SUBPLOT 3: G-Force vs Time ---
ax3.set_facecolor(COL_BG)
ax3.plot(t_sub, mr3_gf, color=COL_MR3, linewidth=2.0, label='MR-3 Shepard')
ax3.plot(t_sub, mr2_gf, color=COL_MR2, linewidth=2.0, label='MR-2 Ham')
ax3.plot(t_sub, gag_gf, color=COL_GAG, linewidth=2.0, linestyle='--', label='Vostok 1 Gagarin')

# Peak g annotations
ax3.annotate('Shepard reentry\n11.6g', xy=(540, 11.6),
             xytext=(600, 13.0), color=COL_MR3, fontsize=8, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=COL_MR3))
ax3.annotate('Ham abort reentry\n14.7g (!)', xy=(600, 14.7),
             xytext=(700, 15.5), color=COL_MR2, fontsize=8, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=COL_MR2))
ax3.annotate('Gagarin launch\n~5g', xy=(290, 5.0),
             xytext=(350, 6.5), color=COL_GAG, fontsize=8,
             arrowprops=dict(arrowstyle='->', color=COL_GAG))

# Danger zones
ax3.axhspan(9, 16, alpha=0.08, color='#FF3030')
ax3.text(20, 9.3, 'Extreme (>9g)', color='#FF3030', fontsize=7, alpha=0.6)
ax3.axhspan(6, 9, alpha=0.05, color='#FFAA30')
ax3.text(20, 6.3, 'High (6-9g)', color='#FFAA30', fontsize=7, alpha=0.6)

# Zero-g region
ax3.axhspan(-0.5, 0.5, alpha=0.05, color='#4488FF')
ax3.text(250, -0.3, 'Weightless', color='#4488FF', fontsize=7, alpha=0.6)

ax3.set_ylabel('G-Force (g)', color=COL_TXT, fontsize=11)
ax3.set_xlabel('Time from Launch (seconds)', color=COL_TXT, fontsize=11)
ax3.legend(loc='upper right', fontsize=8, facecolor=COL_BG,
           edgecolor=COL_GRID, labelcolor=COL_TXT)
ax3.set_ylim(-1, 16)
ax3.tick_params(colors='#556677')
ax3.grid(alpha=0.15, color='#334455')
for spine in ax3.spines.values():
    spine.set_color(COL_GRID)


plt.tight_layout(pad=1.5)
plt.savefig('suborbital_comparator.png', dpi=150, facecolor='#0c1020',
            bbox_inches='tight')
plt.close()


# ============================================================
# NUMERICAL SUMMARY
# ============================================================

print("=" * 70)
print("SUBORBITAL TRAJECTORY COMPARISON — 1961")
print("=" * 70)
print()
print("MISSION               DATE          APOGEE    MAX VEL    MAX G     DURATION")
print("-" * 70)
print(f"MR-2 Ham              Jan 31 1961   253 km    2,500 m/s  14.7g     16m 39s")
print(f"Vostok 1 Gagarin      Apr 12 1961   327 km    7,840 m/s  ~8g       108 min")
print(f"MR-3 Shepard          May 05 1961   187.5 km  2,300 m/s  11.6g     15m 28s")
print()
print("--- Key Differences ---")
print()
print("Ham vs Shepard:")
print("  Ham's Redstone over-burned by ~1 second")
print("  Extra velocity: ~200 m/s → 66 km higher apogee")
print("  Steeper reentry: 14.7g vs Shepard's 11.6g")
print("  The over-burn triggered the abort sensing system")
print("  Ham proved the capsule (and occupant) could survive worst-case")
print()
print("Shepard vs Gagarin:")
print("  Gagarin reached orbital velocity: 7,840 m/s vs Shepard's 2,300 m/s")
print("  Gagarin's rocket: ~900,000 lbf vs Redstone's 78,000 lbf")
print("  Gagarin orbited once (108 min); Shepard arced (15 min)")
print("  But Shepard had manual control; Gagarin's was fully automatic")
print("  Shepard proved a human could operate controls in space")
print()
print("--- The Velocity Gap ---")
print(f"  Redstone max velocity:  2,300 m/s")
print(f"  Orbital velocity:       7,800 m/s")
print(f"  Ratio:                  {2300/7800*100:.1f}% — Redstone couldn't orbit")
print(f"  Atlas was needed for orbit (360,000 lbf, ~7,800 m/s)")
print()
print("Output: suborbital_comparator.png")
