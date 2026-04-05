#!/usr/bin/env python3
"""
Ranger Fleet Failure Analysis
Mission 1.26 — NASA Mission Series

Visualizes the six consecutive Ranger failures (Rangers 1-6) and the
recovery (Rangers 7-9). Shows failure mode migration, progress toward
success, and the eventual breakthrough.

Requirements: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# Ranger mission data
missions = [
    {"name": "Ranger 1", "date": "1961-08-23", "outcome": "LEO trap", 
     "distance_km": 160, "failure": "Agena restart", "system": "Launch Vehicle",
     "color": "#CC5540"},
    {"name": "Ranger 2", "date": "1961-11-18", "outcome": "LEO trap",
     "distance_km": 160, "failure": "Agena restart", "system": "Launch Vehicle",
     "color": "#CC5540"},
    {"name": "Ranger 3", "date": "1962-01-26", "outcome": "Missed Moon",
     "distance_km": 384400+36793, "failure": "Guidance error", "system": "Guidance",
     "color": "#D4A830"},
    {"name": "Ranger 4", "date": "1962-04-23", "outcome": "Hit Moon (no data)",
     "distance_km": 384400, "failure": "Computer failure", "system": "Spacecraft",
     "color": "#7EB8DA"},
    {"name": "Ranger 5", "date": "1962-10-18", "outcome": "Missed Moon",
     "distance_km": 384400-724, "failure": "Power failure", "system": "Spacecraft",
     "color": "#7EB8DA"},
    {"name": "Ranger 6", "date": "1964-01-30", "outcome": "Hit Moon (cameras failed)",
     "distance_km": 384400, "failure": "Camera failure", "system": "Instruments",
     "color": "#8FAE43"},
    {"name": "Ranger 7", "date": "1964-07-31", "outcome": "SUCCESS: 4316 photos",
     "distance_km": 384400, "failure": "None", "system": "SUCCESS",
     "color": "#40CC40"},
    {"name": "Ranger 8", "date": "1965-02-17", "outcome": "SUCCESS: 7137 photos",
     "distance_km": 384400, "failure": "None", "system": "SUCCESS",
     "color": "#40CC40"},
    {"name": "Ranger 9", "date": "1965-03-24", "outcome": "SUCCESS: 5814 photos",
     "distance_km": 384400, "failure": "None", "system": "SUCCESS",
     "color": "#40CC40"},
]

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Ranger Program: Six Failures to Three Successes\n'
             'Mission 1.26 — The First of the Six',
             fontsize=14, fontweight='bold', color='#E8E0D8')
fig.patch.set_facecolor('#0D0A08')

# ---- PLOT 1: Distance from Earth (log scale) ----
ax = axes[0, 0]
ax.set_facecolor('#1A0E08')

for i, m in enumerate(missions):
    ax.bar(i, max(m["distance_km"], 1), color=m["color"], alpha=0.8, width=0.7)
    if m["distance_km"] < 1000:
        ax.text(i, m["distance_km"] * 1.5, f'{m["distance_km"]} km', 
                ha='center', fontsize=7, color='#E8E0D8')

ax.set_yscale('log')
ax.axhline(y=384400, color='#A09888', linestyle=':', alpha=0.5)
ax.text(8.5, 384400, 'Moon', color='#A09888', fontsize=8, va='bottom')
ax.set_xticks(range(9))
ax.set_xticklabels([m["name"].replace("Ranger ", "R") for m in missions], 
                   rotation=45, fontsize=8)
ax.set_ylabel('Distance from Earth (km, log)', color='#A09888')
ax.set_title('How Far Each Ranger Got', color='#8FAE43')
ax.tick_params(colors='#A09888')

# ---- PLOT 2: Failure Mode Migration ----
ax = axes[0, 1]
ax.set_facecolor('#1A0E08')

systems = ["Launch Vehicle", "Guidance", "Spacecraft", "Instruments", "SUCCESS"]
sys_colors = {"Launch Vehicle": "#CC5540", "Guidance": "#D4A830", 
              "Spacecraft": "#7EB8DA", "Instruments": "#8FAE43", "SUCCESS": "#40CC40"}

for i, m in enumerate(missions):
    y = systems.index(m["system"])
    ax.scatter(i, y, color=sys_colors[m["system"]], s=200, zorder=5, 
              edgecolors='#E8E0D8', linewidths=0.5)

ax.set_xticks(range(9))
ax.set_xticklabels([m["name"].replace("Ranger ", "R") for m in missions],
                   rotation=45, fontsize=8)
ax.set_yticks(range(5))
ax.set_yticklabels(systems, fontsize=8)
ax.set_title('Failure Mode Migration', color='#8FAE43')
ax.tick_params(colors='#A09888')

# Add arrow showing progression
ax.annotate('', xy=(6, 4), xytext=(0, 0),
           arrowprops=dict(arrowstyle='->', color='#A09888', alpha=0.3, lw=2))

# ---- PLOT 3: Cumulative Progress ----
ax = axes[1, 0]
ax.set_facecolor('#1A0E08')

# Score each mission on subsystem achievements
# LV ok, Trajectory ok, Bus ok, Instruments ok
scores = [
    [1, 0, 0, 0],  # R1: LV worked (first burn), nothing else
    [1, 0, 0, 0],  # R2: same
    [1, 1, 1, 0],  # R3: LV, trajectory attempted, bus worked (missed Moon)
    [1, 1, 1, 0],  # R4: LV, trajectory, hit Moon, but bus dead
    [1, 0, 0, 0],  # R5: LV ok, but power died
    [1, 1, 1, 0],  # R6: LV, traj, bus all ok, cameras failed
    [1, 1, 1, 1],  # R7: ALL SYSTEMS GO
    [1, 1, 1, 1],  # R8
    [1, 1, 1, 1],  # R9
]

subsystems = ['Launch Vehicle', 'Trajectory', 'Spacecraft Bus', 'Instruments']
sub_colors = ['#CC5540', '#D4A830', '#7EB8DA', '#8FAE43']

x = np.arange(9)
bottom = np.zeros(9)
for j, (sub, col) in enumerate(zip(subsystems, sub_colors)):
    vals = [s[j] for s in scores]
    ax.bar(x, vals, bottom=bottom, color=col, alpha=0.8, width=0.7, label=sub)
    bottom += vals

ax.set_xticks(range(9))
ax.set_xticklabels([m["name"].replace("Ranger ", "R") for m in missions],
                   rotation=45, fontsize=8)
ax.set_ylabel('Subsystems Working', color='#A09888')
ax.set_title('Cumulative Subsystem Reliability', color='#8FAE43')
ax.legend(fontsize=7, facecolor='#1A0E08', edgecolor='#4A3828', 
          labelcolor='#E8E0D8', loc='upper left')
ax.tick_params(colors='#A09888')

# ---- PLOT 4: Timeline ----
ax = axes[1, 1]
ax.set_facecolor('#1A0E08')

# Parse dates roughly
dates_months = [0, 3, 5, 8, 14, 29, 35, 42, 43]  # months from R1

for i, (m, dm) in enumerate(zip(missions, dates_months)):
    marker = 'o' if 'SUCCESS' not in m["outcome"] else '*'
    size = 80 if marker == 'o' else 200
    ax.scatter(dm, 0.5, color=m["color"], s=size, marker=marker, 
              zorder=5, edgecolors='#E8E0D8', linewidths=0.5)
    va = 'bottom' if i % 2 == 0 else 'top'
    y = 0.7 if i % 2 == 0 else 0.3
    ax.text(dm, y, m["name"].replace("Ranger ", "R"), 
            ha='center', fontsize=7, color=m["color"], fontweight='bold')

ax.axhline(y=0.5, color='#4A3828', linewidth=1)
ax.set_xlim(-2, 46)
ax.set_ylim(0, 1)
ax.set_xlabel('Months from Ranger 1 launch', color='#A09888')
ax.set_title('Timeline: 3+ Years from First Failure to First Success', color='#8FAE43')
ax.set_yticks([])
ax.tick_params(colors='#A09888')

# Shade the failure period
ax.axvspan(-1, 29, alpha=0.1, color='#CC5540')
ax.text(14, 0.9, 'SIX CONSECUTIVE FAILURES', ha='center', 
        fontsize=9, color='#CC5540', fontweight='bold', alpha=0.7)

plt.tight_layout()
plt.savefig('ranger_fleet_analysis.png', dpi=150, facecolor='#0D0A08',
            bbox_inches='tight')
plt.show()
print("Plot saved: ranger_fleet_analysis.png")
