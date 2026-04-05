#!/usr/bin/env python3
"""
mercury-progression.py
Mercury Program Duration and Capability Progression

Visualizes the six crewed Mercury flights as a learning curve:
from 15-minute suborbital to 34-hour orbital endurance.

Mission 1.25 / NASA Mission Series
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Mercury crewed flight data
flights = {
    'Mission': ['MR-3', 'MR-4', 'MA-6', 'MA-7', 'MA-8', 'MA-9'],
    'Astronaut': ['Shepard', 'Grissom', 'Glenn', 'Carpenter', 'Schirra', 'Cooper'],
    'Date': ['1961-05-05', '1961-07-21', '1962-02-20', '1962-05-24', '1962-10-03', '1963-05-15'],
    'Duration_min': [15.5, 15.6, 295, 296, 553, 2060],
    'Orbits': [0, 0, 3, 3, 6, 22],
    'Apogee_km': [187, 190, 260, 268, 285, 267],
    'Callsign': ['Freedom 7', 'Liberty Bell 7', 'Friendship 7', 'Aurora 7', 'Sigma 7', 'Faith 7'],
    'Key_event': [
        'First American\nin space',
        'Capsule sank\nafter landing',
        'First American\nin orbit',
        'Science mission\n400km overshoot',
        'Engineering\ntextbook flight',
        'Manual reentry\n34-hour endurance'
    ]
}

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Mercury Program: Six Flights, Two Years, One Learning Curve',
            fontsize=16, fontweight='bold', color='#F5E6C8', y=0.98)

# Plot 1: Duration (log scale)
ax = axes[0, 0]
durations_hr = [d/60 for d in flights['Duration_min']]
colors = ['#7EB8DA', '#7EB8DA', '#4A90D9', '#4A90D9', '#4A90D9', '#B5573A']
bars = ax.bar(range(6), durations_hr, color=colors, edgecolor='#F5E6C8', linewidth=0.5)
ax.set_yscale('log')
ax.set_ylabel('Duration (hours, log scale)', fontsize=10)
ax.set_title('Mission Duration Progression', fontsize=12, color='#F5E6C8')
ax.set_xticks(range(6))
ax.set_xticklabels([f"{m}\n{a}" for m, a in zip(flights['Mission'], flights['Astronaut'])],
                   fontsize=8)
ax.axhline(y=24, color='#F44336', linestyle='--', alpha=0.5, label='24h design limit')
for i, (bar, h) in enumerate(zip(bars, durations_hr)):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() * 1.1,
           f'{h:.1f}h', ha='center', fontsize=8, color='#F5E6C8')
ax.legend(fontsize=8)
ax.set_facecolor('#0D1A12')
ax.grid(True, alpha=0.1)

# Plot 2: Orbits
ax = axes[0, 1]
ax.bar(range(6), flights['Orbits'], color=colors, edgecolor='#F5E6C8', linewidth=0.5)
ax.set_ylabel('Number of Orbits', fontsize=10)
ax.set_title('Orbital Count Progression', fontsize=12, color='#F5E6C8')
ax.set_xticks(range(6))
ax.set_xticklabels(flights['Mission'], fontsize=9)
for i, o in enumerate(flights['Orbits']):
    ax.text(i, o + 0.3, str(o), ha='center', fontsize=9, color='#F5E6C8')
ax.set_facecolor('#0D1A12')
ax.grid(True, alpha=0.1)

# Plot 3: Key events timeline
ax = axes[1, 0]
dates_numeric = [0, 2.5, 9.5, 12.5, 17, 24.5]  # months from first flight
ax.scatter(dates_numeric, [1]*6, s=100, c=colors, zorder=5, edgecolors='#F5E6C8')
for i, (x, event) in enumerate(zip(dates_numeric, flights['Key_event'])):
    ax.annotate(f"{flights['Callsign'][i]}\n{event}",
               xy=(x, 1), xytext=(x, 1.3 if i % 2 == 0 else 0.7),
               fontsize=7, ha='center', color='#F5E6C8',
               arrowprops=dict(arrowstyle='-', color='#F5E6C8', alpha=0.3))
ax.set_xlim(-1, 26)
ax.set_ylim(0, 2)
ax.set_xlabel('Months from first flight (May 1961)', fontsize=10)
ax.set_title('Key Events Timeline', fontsize=12, color='#F5E6C8')
ax.set_yticks([])
ax.set_facecolor('#0D1A12')

# Plot 4: Capability matrix
ax = axes[1, 1]
capabilities = [
    'Survive in space',
    'Reach orbit',
    'Conduct science',
    'Precision engineering',
    'Sleep in space',
    'Endure 24+ hours',
    'Manual reentry',
]
# Which mission first demonstrated each
first_demo = [0, 2, 3, 4, 5, 5, 5]  # index into flights

ax.barh(range(len(capabilities)), [1]*len(capabilities),
       left=first_demo, color='#3D8B37', alpha=0.3, height=0.6)
ax.scatter(first_demo, range(len(capabilities)), c='#B5573A', s=80,
          zorder=5, edgecolors='#F5E6C8')

ax.set_yticks(range(len(capabilities)))
ax.set_yticklabels(capabilities, fontsize=8)
ax.set_xticks(range(6))
ax.set_xticklabels(flights['Mission'], fontsize=8)
ax.set_title('Capability Milestones', fontsize=12, color='#F5E6C8')
ax.set_facecolor('#0D1A12')
ax.invert_yaxis()

for ax in axes.flat:
    ax.tick_params(colors='#F5E6C8')
    for spine in ax.spines.values():
        spine.set_color('#3A2A1A')

fig.set_facecolor('#0D1A12')
plt.tight_layout()
plt.savefig('mercury_progression.png', dpi=150, facecolor='#0D1A12',
           bbox_inches='tight')
print("Saved: mercury_progression.png")
