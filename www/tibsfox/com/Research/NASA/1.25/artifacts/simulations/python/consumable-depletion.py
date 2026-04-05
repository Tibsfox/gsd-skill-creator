#!/usr/bin/env python3
"""
consumable-depletion.py
Mercury-Atlas 9 / Faith 7 -- Consumable Depletion Simulator

Plots all five MA-9 consumable levels over the 34-hour mission,
marking the points where systems failed and the transition to
manual control.

Mission 1.25 / NASA Mission Series
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

# Mission timeline (hours)
t = np.linspace(0, 36, 1000)
T_mission = 34.33  # actual mission duration

# Consumable definitions: (name, initial, rate, unit, color)
consumables = [
    ("Battery Power", 36000, 450, "Wh", "#4A90D9"),       # blue
    ("Oxygen (O₂)", 5.9, 0.11, "kg", "#4CAF50"),          # green
    ("CO₂ Scrubber (LiOH)", 4.5, 0.10, "kg CO₂", "#F44336"),  # red
    ("Attitude Fuel (H₂O₂)", 27.2, 0.45, "kg", "#FF9800"),    # orange
    ("Cooling Water", 16.3, 0.35, "kg", "#9E9E9E"),       # gray
]

# Create figure
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10), height_ratios=[3, 1])

# === TOP PLOT: Consumable depletion ===
for name, S0, rate, unit, color in consumables:
    # Modify rate for sleep period (orbits 7-14, ~hours 10-21)
    levels = np.zeros_like(t)
    for i, ti in enumerate(t):
        if 10 <= ti <= 21:  # sleep period: reduced consumption
            effective_rate = rate * 0.7
        else:
            effective_rate = rate
        if i == 0:
            levels[i] = 100.0
        else:
            dt = t[i] - t[i-1]
            depletion_frac = effective_rate * dt / S0 * 100
            levels[i] = max(0, levels[i-1] - depletion_frac)

    ax1.plot(t, levels, color=color, linewidth=2, label=name)

# Mark events
events = [
    (0, "Launch", "#4CAF50"),
    (10, "Sleep begins", "#7EB8DA"),
    (21, "Sleep ends", "#7EB8DA"),
    (28, "⚠ Orbit 19: 0.05g false alarm\nGyro drift begins", "#FF9800"),
    (31, "⚠ Orbit 21: Inverter fails\nCO₂ rising", "#F44336"),
    (33, "Orbit 22: MANUAL CONTROL\nRetrofire by hand", "#B5573A"),
    (T_mission, "Splashdown\n6.4 km from carrier", "#4CAF50"),
]

for t_event, label, color in events:
    ax1.axvline(x=t_event, color=color, linestyle='--', alpha=0.5, linewidth=1)
    y_pos = 105 if t_event < 20 else 95
    ax1.annotate(label, xy=(t_event, y_pos), fontsize=7,
                color=color, ha='center', va='bottom',
                rotation=0, alpha=0.8)

# Design limit
ax1.axvline(x=24, color='white', linestyle=':', alpha=0.3, linewidth=1)
ax1.annotate("24h design limit", xy=(24, 50), fontsize=8,
            color='white', alpha=0.4, rotation=90, ha='right')

# Critical threshold
ax1.axhline(y=20, color='#F44336', linestyle=':', alpha=0.3)
ax1.annotate("CRITICAL", xy=(35, 21), fontsize=7, color='#F44336', alpha=0.5)

ax1.set_xlim(0, 36)
ax1.set_ylim(0, 110)
ax1.set_xlabel("Mission Elapsed Time (hours)", fontsize=11)
ax1.set_ylabel("Remaining (%)", fontsize=11)
ax1.set_title("Mercury-Atlas 9 / Faith 7 — Consumable Depletion Over 34 Hours",
             fontsize=14, fontweight='bold', color='#F5E6C8')
ax1.legend(loc='upper right', fontsize=9, framealpha=0.8)
ax1.set_facecolor('#0D1A12')
ax1.grid(True, alpha=0.15, color='#F5E6C8')

# === BOTTOM PLOT: Mercury program progression ===
missions = ['MR-3\nShepard', 'MR-4\nGrissom', 'MA-6\nGlenn', 'MA-7\nCarpenter', 'MA-8\nSchirra', 'MA-9\nCooper']
durations_hr = [0.258, 0.260, 4.92, 4.93, 9.22, 34.33]
colors = ['#7EB8DA', '#7EB8DA', '#4A90D9', '#4A90D9', '#4A90D9', '#B5573A']

bars = ax2.barh(missions, durations_hr, color=colors, edgecolor='#F5E6C8', linewidth=0.5)
ax2.set_xlabel("Duration (hours)", fontsize=11)
ax2.set_title("Mercury Program Duration Progression", fontsize=12, color='#F5E6C8')
ax2.set_facecolor('#0D1A12')
ax2.axvline(x=24, color='white', linestyle=':', alpha=0.3)
ax2.annotate("24h design limit", xy=(24, 5.5), fontsize=8, color='white', alpha=0.4)

# Add duration labels
for bar, dur in zip(bars, durations_hr):
    ax2.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2,
            f'{dur:.1f}h', va='center', fontsize=9, color='#F5E6C8')

fig.set_facecolor('#0D1A12')
plt.tight_layout()
plt.savefig('ma9_consumable_depletion.png', dpi=150, facecolor='#0D1A12',
           edgecolor='none', bbox_inches='tight')
print("Saved: ma9_consumable_depletion.png")
print(f"\nMission duration: {T_mission:.2f} hours ({T_mission*60:.0f} minutes)")
print(f"Limiting consumable: CO₂ scrubber (LiOH)")
print(f"Design limit: 24 hours | Actual: {T_mission:.1f} hours (+{(T_mission/24-1)*100:.0f}%)")
