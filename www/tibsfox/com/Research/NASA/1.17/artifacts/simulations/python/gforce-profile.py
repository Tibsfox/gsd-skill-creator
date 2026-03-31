#!/usr/bin/env python3
"""
Mercury-Redstone 2 — G-Force Timeline Detail
=============================================
NASA Mission Series v1.17

Detailed g-force profile for Ham's MR-2 flight. Shows the
complete timeline from launch through splashdown with human
tolerance limits overlaid. Highlights how the abort system
activation changed the g-force profile from planned to actual.

Ham experienced:
  - Launch: ~6g (powered ascent)
  - Abort activation (T+137s): spike to ~9g (escape rocket thrust)
  - Weightlessness: 0g (6.6 minutes of coast)
  - Reentry peak: 14.7g (due to steeper trajectory from abort)
  - Planned reentry peak: ~11g (without abort)

Despite 14.7g, Ham continued performing lever tasks.

Usage: python3 gforce-profile.py
Dependencies: numpy, matplotlib
Output: gforce_profile.png
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import matplotlib.patches as mpatches

# ============================================================
# MR-2 FLIGHT TIMELINE (reconstructed from telemetry reports)
# ============================================================

# Time points (seconds from liftoff)
# G-force values (multiples of Earth gravity)

# Nominal (planned) profile
nominal_t = np.array([
    0, 5, 10, 20, 30, 50, 70, 90, 110, 130,
    142,   # BECO (booster engine cutoff)
    145,   # Capsule separation
    150, 200, 250, 300, 350, 400,
    420,   # Apogee ~185 km
    440, 460, 480, 500, 520, 540,
    560, 580, 590, 600,
    605,   # Peak reentry
    610, 620, 640, 660, 680,
    700,   # Drogue chute
    720,   # Main chute
    740, 800, 850, 900
])

nominal_g = np.array([
    1.0, 1.2, 1.5, 2.0, 2.8, 3.5, 4.2, 4.8, 5.5, 6.0,
    0.2,   # BECO — sudden unloading
    0.1,   # Separation
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0,   # Apogee
    0.0, 0.0, 0.2, 0.5, 1.0, 2.0,
    4.0, 7.0, 9.0, 10.5,
    11.0,  # Peak reentry (nominal)
    10.0, 7.0, 4.0, 2.0, 1.5,
    3.0,   # Drogue deploy jolt
    2.5,   # Main deploy
    1.5, 1.2, 1.0, 1.0
])

# Actual (with abort) profile
actual_t = np.array([
    0, 5, 10, 20, 30, 50, 70, 90, 110, 130,
    137,   # Abort system activates — escape rocket fires
    139,   # Peak abort thrust
    142,   # BECO + escape rocket burnout
    145,   # Post-abort coast begins
    150, 200, 250, 300, 350, 400, 450, 500,
    520,   # Apogee ~253 km (higher than planned)
    540, 560, 580, 600, 620, 640,
    660, 680, 700, 710,
    720,   # Peak reentry (actual — steeper trajectory)
    725, 740, 760, 780, 800,
    820,   # Drogue chute
    840,   # Main chute
    860, 900, 950, 999
])

actual_g = np.array([
    1.0, 1.2, 1.5, 2.0, 2.8, 3.5, 4.2, 4.8, 5.5, 6.0,
    8.5,   # Abort fires — sudden extra thrust!
    9.0,   # Peak abort g
    0.3,   # Burnout — sudden unloading
    0.1,   # Coast begins
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0,   # Apogee 253 km
    0.0, 0.1, 0.3, 0.8, 1.5, 3.0,
    6.0, 9.0, 12.0, 14.0,
    14.7,  # PEAK — 14.7g actual
    13.0, 9.0, 5.0, 3.0, 2.0,
    3.5,   # Drogue deploy jolt
    3.0,   # Main deploy
    2.0, 1.2, 1.0, 1.0
])

# ============================================================
# HUMAN TOLERANCE REFERENCE LINES
# ============================================================

tolerance_levels = {
    'Comfortable': {'g': 3, 'color': '#30AA30', 'style': '--'},
    'Trained pilot tolerance (sustained)': {'g': 6, 'color': '#E8CC30', 'style': '--'},
    'Fighter pilot (brief)': {'g': 9, 'color': '#E87020', 'style': '--'},
    'Loss of consciousness (most humans)': {'g': 7, 'color': '#CC4040', 'style': ':'},
    'MR-2 peak (14.7g)': {'g': 14.7, 'color': '#FF3030', 'style': '-.'},
}

# ============================================================
# PLOTTING
# ============================================================

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 12),
                                gridspec_kw={'height_ratios': [3, 1]})

fig.suptitle("Mercury-Redstone 2 — G-Force Timeline\n"
             "Ham the Chimpanzee • January 31, 1961",
             fontsize=15, fontweight='bold', y=0.98)

# --- Main G-Force Plot ---
# Nominal trajectory
ax1.fill_between(nominal_t, 0, nominal_g, alpha=0.15, color='#2050A0')
ax1.plot(nominal_t, nominal_g, color='#2050A0', linewidth=2.5,
         label='Nominal (planned)', linestyle='--')

# Actual trajectory (with abort)
ax1.fill_between(actual_t, 0, actual_g, alpha=0.15, color='#FF3030')
ax1.plot(actual_t, actual_g, color='#FF3030', linewidth=2.5,
         label='Actual (with abort)')

# Human tolerance lines
for name, info in tolerance_levels.items():
    ax1.axhline(y=info['g'], color=info['color'], linestyle=info['style'],
                alpha=0.5, linewidth=1)
    ax1.text(actual_t[-1] * 0.98, info['g'] + 0.3, name,
             fontsize=7.5, color=info['color'], ha='right', va='bottom',
             alpha=0.8)

# Annotations for key events
events = [
    (0, 1.0, 'Liftoff', '#B0B8C0'),
    (137, 8.5, 'ABORT\nFIRES', '#FF3030'),
    (142, 0.3, 'BECO', '#B0B8C0'),
    (520, 0.0, 'Apogee\n253 km', '#2050A0'),
    (720, 14.7, 'PEAK\n14.7g', '#FF3030'),
    (820, 3.5, 'Drogue', '#B0B8C0'),
    (840, 3.0, 'Main\nchute', '#B0B8C0'),
    (999, 1.0, 'Splash-\ndown', '#2050A0'),
]

for evt_t, evt_g, label, color in events:
    ax1.annotate(label,
                 xy=(evt_t, evt_g),
                 xytext=(evt_t, evt_g + 1.5),
                 fontsize=8, color=color, ha='center',
                 fontweight='bold',
                 arrowprops=dict(arrowstyle='->', color=color, lw=1))

# Weightlessness zone
wl_start = 150
wl_end = 500
ax1.axvspan(wl_start, wl_end, alpha=0.05, color='#4488CC')
ax1.text((wl_start + wl_end) / 2, 1.0, 'Weightlessness\n(0g coast — 6.6 min)',
         fontsize=9, color='#4488CC', ha='center', va='bottom',
         style='italic')

ax1.set_xlabel('Time from Liftoff (seconds)', fontsize=11)
ax1.set_ylabel('G-Force (multiples of Earth gravity)', fontsize=11)
ax1.set_title('G-Force Profile: How the Abort Changed Everything', fontsize=12)
ax1.legend(loc='upper left', fontsize=10)
ax1.grid(True, alpha=0.2)
ax1.set_xlim(0, actual_t[-1] * 1.02)
ax1.set_ylim(-0.5, 17)

# --- Phase Bar (bottom) ---
phases = [
    (0, 137, 'Powered\nAscent', '#30AA30'),
    (137, 145, 'ABORT', '#FF3030'),
    (145, 500, 'Coast / Weightlessness', '#4488CC'),
    (500, 520, 'Apogee', '#2050A0'),
    (520, 800, 'Reentry', '#E87020'),
    (800, 860, 'Chutes', '#B0B8C0'),
    (860, 999, 'Recovery', '#2050A0'),
]

ax2.set_xlim(0, actual_t[-1] * 1.02)
ax2.set_ylim(0, 1)
ax2.set_xlabel('Time from Liftoff (seconds)', fontsize=11)
ax2.set_title('Flight Phases', fontsize=10)
ax2.set_yticks([])

for start, end, label, color in phases:
    width = end - start
    rect = FancyBboxPatch((start, 0.1), width, 0.8,
                           boxstyle="round,pad=0.02",
                           facecolor=color, alpha=0.3,
                           edgecolor=color, linewidth=1.5)
    ax2.add_patch(rect)
    ax2.text(start + width/2, 0.5, label,
             fontsize=8, ha='center', va='center',
             color=color, fontweight='bold')

plt.tight_layout()
plt.savefig('gforce_profile.png', dpi=150, bbox_inches='tight',
            facecolor='white')
print("Saved: gforce_profile.png")

# ============================================================
# SUMMARY STATISTICS
# ============================================================

print(f"\n{'='*55}")
print(f"MR-2 G-Force Summary")
print(f"{'='*55}")
print(f"Launch g-force (powered ascent):  ~6g")
print(f"Abort spike:                      ~9g")
print(f"Weightlessness duration:          ~{(500-150):.0f}s ({(500-150)/60:.1f} min)")
print(f"Peak reentry g-force (actual):    14.7g")
print(f"Peak reentry g-force (nominal):   ~11g")
print(f"G-force increase from abort:      +{14.7-11:.1f}g ({(14.7-11)/11*100:.0f}%)")
print(f"Total flight time:                ~{actual_t[-1]:.0f}s ({actual_t[-1]/60:.1f} min)")
print(f"{'='*55}")
print(f"\nHam's lever response time:")
print(f"  Ground baseline:  400 ms")
print(f"  In-flight:        500 ms  (+{(500-400)/400*100:.0f}%)")
print(f"  Despite 14.7g reentry — cognitive function maintained")
plt.close()
