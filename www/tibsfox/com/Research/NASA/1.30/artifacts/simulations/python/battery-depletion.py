#!/usr/bin/env python3
"""
Ranger 5 Battery Depletion Simulator
=====================================
Simulates the 8 hour 44 minute battery life after solar panel failure.
Shows system shutdowns as power drains, and the trajectory passing the
Moon at 725 km without power for midcourse correction.

Mission: v1.30 — Ranger 5 (October 18, 1962)
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# === BATTERY DEPLETION MODEL ===
E_battery = 1000  # Wh (silver-zinc)
P_total = 110     # W (all systems)

# System power draws and shutdown times (estimated)
systems = {
    'Gamma-ray spectrometer': {'power': 15, 'shutdown_h': 4.0, 'color': '#CC00CC'},
    'Radar altimeter':        {'power': 10, 'shutdown_h': 6.0, 'color': '#0088CC'},
    'TV camera':              {'power': 30, 'shutdown_h': 7.0, 'color': '#CCCC00'},
    'Attitude control':       {'power': 25, 'shutdown_h': 8.0, 'color': '#00CC88'},
    'Telemetry + comms':      {'power': 20, 'shutdown_h': 8.5, 'color': '#CC6600'},
    'Command receiver':       {'power': 10, 'shutdown_h': 8.73, 'color': '#CC0000'},
}

t = np.linspace(0, 10, 1000)
E = np.maximum(E_battery - P_total * t, 0)

# === PLOT 1: Battery depletion with system shutdowns ===
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))

ax1.plot(t, E, color='#CC0000', linewidth=2.5, label='Battery energy')
ax1.fill_between(t, 0, E, alpha=0.15, color='#CC0000')

for name, info in systems.items():
    ax1.axvline(info['shutdown_h'], color=info['color'], linestyle='--',
                alpha=0.7, linewidth=1)
    ax1.annotate(f"  {name}\n  dies at T+{info['shutdown_h']}h",
                xy=(info['shutdown_h'], E_battery * 0.9 - list(systems.keys()).index(name) * 80),
                fontsize=7, color=info['color'])

ax1.axhline(0, color='#666', linewidth=0.5)
ax1.axvline(8.73, color='#FF0000', linewidth=2, label='Total power loss (T+8h44m)')
ax1.set_xlabel('Time after launch (hours)')
ax1.set_ylabel('Battery Energy (Wh)')
ax1.set_title('Ranger 5: Battery Depletion — Systems Going Dark', fontsize=14)
ax1.legend(fontsize=9)
ax1.set_xlim(0, 10)
ax1.set_ylim(-20, 1100)
ax1.grid(alpha=0.2)

# === PLOT 2: Timeline to Moon ===
t_full = np.linspace(0, 70, 1000)
E_full = np.maximum(E_battery - P_total * t_full, 0)

ax2.fill_between(t_full, 0, 1, where=(E_full > 0),
                 alpha=0.15, color='#00CC00', label='Powered')
ax2.fill_between(t_full, 0, 1, where=(E_full <= 0),
                 alpha=0.15, color='#CC0000', label='Dead')

ax2.axvline(8.73, color='#CC0000', linewidth=2, label='Power loss')
ax2.axvline(64, color='#CCCC00', linewidth=2, label='Lunar flyby (725 km)')

# Midcourse correction window
ax2.axvspan(14, 20, alpha=0.1, color='#00CCCC', label='Correction window')
ax2.annotate('Midcourse correction\nwindow (dead)', xy=(17, 0.5),
            ha='center', fontsize=9, color='#00CCCC')
ax2.annotate('725 km\nflyby', xy=(64, 0.7),
            ha='center', fontsize=10, color='#CCCC00', fontweight='bold')

ax2.set_xlabel('Time after launch (hours)')
ax2.set_ylabel('')
ax2.set_title('Ranger 5: 64 Hours to the Moon — Dead After 8.7', fontsize=14)
ax2.legend(fontsize=9, loc='upper right')
ax2.set_xlim(0, 70)
ax2.set_ylim(0, 1)
ax2.set_yticks([])
ax2.grid(axis='x', alpha=0.2)

plt.tight_layout()
plt.savefig('ranger5_battery_depletion.png', dpi=150)
print('Ranger 5 Battery Depletion Analysis')
print('=' * 50)
print(f'Battery capacity:    {E_battery} Wh')
print(f'Total power draw:    {P_total} W')
print(f'Theoretical life:    {E_battery/P_total:.1f} hours')
print(f'Actual life:         8.73 hours')
print(f'Transit to Moon:     ~64 hours')
print(f'Power deficit:       {64 - 8.73:.1f} hours')
print(f'')
print(f'The spacecraft died 55 hours before reaching the Moon.')
print(f'725 km. Cameras intact. Power absent.')
print(f'')
print(f'Saved: ranger5_battery_depletion.png')
