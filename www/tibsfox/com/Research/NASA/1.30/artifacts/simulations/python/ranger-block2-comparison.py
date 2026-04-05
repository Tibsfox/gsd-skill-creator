#!/usr/bin/env python3
"""
Ranger Block II Comparison
===========================
Compares Rangers 3, 4, and 5 — three identical spacecraft,
three different failure modes, zero lunar science.

Mission: v1.30 — Ranger 5 (October 18, 1962)
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Block II Rangers
missions = [
    {'name': 'Ranger 3', 'date': 'Jan 26, 1962', 'miss_km': 36793,
     'failure': 'Guidance error\n(reversed commands)', 'color': '#CC6600',
     'subsystem': 'Launch vehicle'},
    {'name': 'Ranger 4', 'date': 'Apr 23, 1962', 'miss_km': 0,
     'failure': 'Timer failure\n(dead on arrival)', 'color': '#CC0000',
     'subsystem': 'Computer'},
    {'name': 'Ranger 5', 'date': 'Oct 18, 1962', 'miss_km': 725,
     'failure': 'Power short circuit\n(solar panels dead)', 'color': '#880000',
     'subsystem': 'Electrical power'},
]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Plot 1: Miss distances (log scale)
names = [m['name'] for m in missions]
misses = [max(m['miss_km'], 1) for m in missions]  # min 1 for log scale
colors = [m['color'] for m in missions]

bars = ax1.bar(names, misses, color=colors, edgecolor='#333', linewidth=1.5)
ax1.set_yscale('log')
ax1.set_ylabel('Miss Distance (km, log scale)')
ax1.set_title('Block II Ranger: Miss Distances', fontsize=13)

for bar, m in zip(bars, missions):
    height = bar.get_height()
    label = f"{m['miss_km']:,} km" if m['miss_km'] > 0 else "IMPACT\n(dead)"
    ax1.text(bar.get_x() + bar.get_width()/2., height * 1.3,
             label, ha='center', va='bottom', fontweight='bold', fontsize=9)
    ax1.text(bar.get_x() + bar.get_width()/2., 2,
             m['failure'], ha='center', va='bottom', fontsize=7,
             color='#E8E8E8', style='italic')

ax1.set_ylim(0.5, 100000)
ax1.grid(axis='y', alpha=0.2)

# Plot 2: Failure subsystems (showing distributed failure)
subsystems = ['Launch\nvehicle', 'Computer/\nsequencer', 'Electrical\npower',
              'Communications', 'Instruments']
failure_map = [1, 0, 0, 0, 0,   # Ranger 3: launch vehicle
               0, 1, 0, 0, 0,   # Ranger 4: computer
               0, 0, 1, 0, 0]   # Ranger 5: power

data = np.array(failure_map).reshape(3, 5)
im = ax2.imshow(data, cmap='Reds', aspect='auto', vmin=0, vmax=1)
ax2.set_xticks(range(5))
ax2.set_xticklabels(subsystems, fontsize=8)
ax2.set_yticks(range(3))
ax2.set_yticklabels([m['name'] for m in missions])
ax2.set_title('Failure Subsystem Map\n(each mission fails differently)', fontsize=13)

for i in range(3):
    for j in range(5):
        text = '✗' if data[i, j] > 0 else '✓'
        color = '#FFFFFF' if data[i, j] > 0 else '#446644'
        ax2.text(j, i, text, ha='center', va='center', fontsize=16,
                fontweight='bold', color=color)

plt.suptitle('Three Identical Spacecraft. Three Different Failures. Zero Lunar Science.',
             fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig('ranger_block2_comparison.png', dpi=150, bbox_inches='tight')

print('Ranger Block II Comparison')
print('=' * 55)
for m in missions:
    print(f"  {m['name']} ({m['date']}): {m['subsystem']} → {m['miss_km']:,} km miss")
print()
print('Three missions. Three subsystems. Three failures.')
print('The root cause was organizational, not technical.')
print('That is why JPL was reorganized, not redesigned.')
print()
print('Saved: ranger_block2_comparison.png')
