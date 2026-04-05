#!/usr/bin/env python3
"""
Ranger Program Convergence Analyzer
Mission 1.33 — NASA Mission Series

Visualizes all nine Ranger missions showing the convergence
from six failures to three successes.

Usage: python3 ranger-convergence.py
Requires: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime

# Ranger mission data
missions = [
    {"name": "Ranger 1", "date": "1961-08-23", "result": "failure",
     "miss_km": None, "images": 0, "cause": "Agena failure\n(no TLI)"},
    {"name": "Ranger 2", "date": "1961-11-18", "result": "failure",
     "miss_km": None, "images": 0, "cause": "Agena failure\n(no TLI)"},
    {"name": "Ranger 3", "date": "1962-01-26", "result": "failure",
     "miss_km": 36800, "images": 0, "cause": "Atlas guidance\nerror"},
    {"name": "Ranger 4", "date": "1962-04-23", "result": "partial",
     "miss_km": 0, "images": 0, "cause": "Computer failure\n(hit Moon blind)"},
    {"name": "Ranger 5", "date": "1962-10-18", "result": "failure",
     "miss_km": 725, "images": 0, "cause": "Power failure"},
    {"name": "Ranger 6", "date": "1964-01-30", "result": "partial",
     "miss_km": 32, "images": 0, "cause": "Camera failure\n(Paschen arc)"},
    {"name": "Ranger 7", "date": "1964-07-31", "result": "success",
     "miss_km": 15, "images": 4316, "cause": "SUCCESS"},
    {"name": "Ranger 8", "date": "1965-02-20", "result": "success",
     "miss_km": 24, "images": 7137, "cause": "SUCCESS"},
    {"name": "Ranger 9", "date": "1965-03-24", "result": "success",
     "miss_km": 5, "images": 5814, "cause": "SUCCESS\n(live TV!)"},
]

fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(14, 12))
fig.patch.set_facecolor('#0D0A08')

colors = {'failure': '#FF3030', 'partial': '#FFB030', 'success': '#40CC40'}

# ============================================================
# Chart 1: Mission Timeline
# ============================================================
ax1.set_facecolor('#0D0A08')
for i, m in enumerate(missions):
    c = colors[m['result']]
    ax1.bar(i, 1, color=c, alpha=0.8, width=0.7, edgecolor=c)
    ax1.text(i, -0.15, m['name'].replace('Ranger ', 'R'), 
             ha='center', va='top', color='#E8E8E8', fontsize=9, fontweight='bold')
    ax1.text(i, -0.35, m['date'][:4], ha='center', va='top', 
             color='#A0A0A0', fontsize=7)
    ax1.text(i, 0.5, m['cause'], ha='center', va='center', 
             color='#1A1008', fontsize=6, fontweight='bold')

ax1.set_ylim(-0.5, 1.3)
ax1.set_xlim(-0.5, 8.5)
ax1.set_yticks([])
ax1.set_xticks([])
ax1.set_title('Ranger Program: Nine Missions (1961-1965)', 
              color='#E8D4B8', fontsize=13, fontweight='bold', pad=10)

# Legend
for label, color in colors.items():
    ax1.bar([], [], color=color, label=label.upper())
ax1.legend(loc='upper right', fontsize=8, facecolor='#1A1008', 
           edgecolor='#5C2E0E', labelcolor='#E8E8E8')
for spine in ax1.spines.values():
    spine.set_visible(False)

# ============================================================
# Chart 2: Images Returned
# ============================================================
ax2.set_facecolor('#0D0A08')
image_counts = [m['images'] for m in missions]
bar_colors = [colors[m['result']] for m in missions]

bars = ax2.bar(range(9), image_counts, color=bar_colors, alpha=0.8, 
               width=0.7, edgecolor=[colors[m['result']] for m in missions])

for i, count in enumerate(image_counts):
    if count > 0:
        ax2.text(i, count + 150, f'{count:,}', ha='center', 
                 color='#40CC40', fontsize=9, fontweight='bold')
    else:
        ax2.text(i, 150, '0', ha='center', color='#FF3030', fontsize=9)

ax2.set_xticks(range(9))
ax2.set_xticklabels([m['name'].replace('Ranger ', 'R') for m in missions], 
                     color='#A0A0A0', fontsize=8)
ax2.set_ylabel('Images Returned', color='#A0A0A0')
ax2.set_title('The Wall of Zeros, Then the Breakthrough', 
              color='#E8D4B8', fontsize=12, fontweight='bold')
ax2.tick_params(colors='#666666')

# Annotate the breakthrough
ax2.annotate('Ranger 6 failure analysis\n→ 100+ fixes → Ranger 7', 
             xy=(6, 4316), xytext=(4, 6000),
             color='#FFB030', fontsize=8,
             arrowprops=dict(arrowstyle='->', color='#FFB030'))

for spine in ax2.spines.values():
    spine.set_color('#333333')

# ============================================================
# Chart 3: Targeting Accuracy (log scale)
# ============================================================
ax3.set_facecolor('#0D0A08')

# Only plot missions that had a miss distance
for i, m in enumerate(missions):
    if m['miss_km'] is not None and m['miss_km'] > 0:
        c = colors[m['result']]
        ax3.semilogy(i, m['miss_km'], 'o', color=c, markersize=12, zorder=5)
        ax3.text(i, m['miss_km'] * 1.5, f"{m['miss_km']:,} km", 
                 ha='center', va='bottom', color=c, fontsize=8)
    elif m['miss_km'] == 0:
        ax3.semilogy(i, 1, 'v', color='#FFB030', markersize=10, zorder=5)
        ax3.text(i, 0.5, 'Hit\n(uncontrolled)', ha='center', va='top', 
                 color='#FFB030', fontsize=7)
    else:
        ax3.text(i, 50000, 'Did not\nreach Moon', ha='center', 
                 color='#FF3030', fontsize=7, alpha=0.5)

ax3.set_xticks(range(9))
ax3.set_xticklabels([m['name'].replace('Ranger ', 'R') for m in missions], 
                     color='#A0A0A0', fontsize=8)
ax3.set_ylabel('Miss Distance (km, log scale)', color='#A0A0A0')
ax3.set_title('Targeting Accuracy Improvement', 
              color='#E8D4B8', fontsize=12, fontweight='bold')
ax3.set_ylim(0.5, 100000)
ax3.tick_params(colors='#666666')
ax3.grid(True, alpha=0.15, color='#444444')

# Highlight Ranger 6's accuracy
ax3.annotate('Best accuracy in program\n(32 km) — but cameras dead', 
             xy=(5, 32), xytext=(2, 10),
             color='#FFB030', fontsize=8,
             arrowprops=dict(arrowstyle='->', color='#FFB030'))

for spine in ax3.spines.values():
    spine.set_color('#333333')

plt.tight_layout(pad=2)
plt.savefig('ranger_convergence.png', dpi=150, 
            facecolor='#0D0A08', bbox_inches='tight')
plt.show()

print("\nRanger Program Summary:")
print(f"  Missions: 9")
print(f"  Failures: 6 (Rangers 1-6)")
print(f"  Successes: 3 (Rangers 7-9)")
print(f"  Total images: {sum(m['images'] for m in missions):,}")
print(f"  Ranger 6 contribution: 0 images, 100+ fixes")
print(f"  Images enabled by Ranger 6: {4316+7137+5814:,}")
