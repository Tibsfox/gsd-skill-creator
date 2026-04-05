#!/usr/bin/env python3
"""
Ranger 6 Trajectory + Paschen Breakdown Visualizer
Mission 1.33 — NASA Mission Series

Two-panel simulation:
  Panel 1: Ranger 6 trajectory from Earth to Moon with camera death marked
  Panel 2: Paschen breakdown curve with ascent pressure profile

Usage: python3 ranger6-trajectory.py
Requires: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
fig.patch.set_facecolor('#0D0A08')

# ============================================================
# PANEL 1: Ranger 6 Trajectory
# ============================================================
ax1.set_facecolor('#0D0A08')
ax1.set_aspect('equal')

# Earth
earth = Circle((0, 0), 6.371, color='#3366CC', alpha=0.8)
ax1.add_patch(earth)
ax1.text(0, 0, 'Earth', ha='center', va='center', color='white', fontsize=8)

# Moon
moon_x, moon_y = 384.4, 0  # thousands of km
moon = Circle((moon_x, moon_y), 1.737, color='#AAAAAA', alpha=0.8)
ax1.add_patch(moon)
ax1.text(moon_x, moon_y + 8, 'Moon', ha='center', color='#CCCCCC', fontsize=8)

# Ranger 6 trajectory (simplified arc)
t = np.linspace(0, 1, 1000)
# Approximate trajectory as a curved path
x_traj = t * moon_x
y_traj = 30 * np.sin(np.pi * t * 0.7) * (1 - t * 0.5)

# Camera death point (T+107s ≈ 0.05% of transit)
cam_death_idx = 5  # very early
ax1.plot(x_traj[:cam_death_idx], y_traj[:cam_death_idx], 
         color='#40CC40', linewidth=2, label='Cameras alive')
ax1.plot(x_traj[cam_death_idx:], y_traj[cam_death_idx:], 
         color='#666666', linewidth=2, linestyle='--', label='Flying BLIND (65.4 hrs)')

# Camera death marker
ax1.plot(x_traj[cam_death_idx], y_traj[cam_death_idx], 
         'r*', markersize=15, zorder=5)
ax1.annotate('CAMERAS KILLED\nT+107 sec\n(electrical arc)', 
             xy=(x_traj[cam_death_idx], y_traj[cam_death_idx]),
             xytext=(60, 60), color='#FF3030', fontsize=8, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color='#FF3030'))

# Impact point
ax1.plot(moon_x, 0, 'o', color='#FFB030', markersize=10, zorder=5)
ax1.annotate('IMPACT\n32 km from target\nZero photographs', 
             xy=(moon_x, 0), xytext=(moon_x - 80, -40),
             color='#FFB030', fontsize=8, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color='#FFB030'))

# Target zone
target = Circle((moon_x, 0), 3.2, fill=False, color='#FFB030', 
                linewidth=1, linestyle='--')
ax1.add_patch(target)

ax1.set_xlim(-20, 410)
ax1.set_ylim(-80, 80)
ax1.set_xlabel('Distance (thousands of km)', color='#A0A0A0')
ax1.set_ylabel('', color='#A0A0A0')
ax1.set_title('Ranger 6 Trajectory — Perfect Aim, Blind Eyes', 
              color='#E8D4B8', fontsize=12, fontweight='bold')
ax1.legend(loc='upper left', fontsize=8, 
           facecolor='#1A1008', edgecolor='#5C2E0E', labelcolor='#E8E8E8')
ax1.tick_params(colors='#666666')
for spine in ax1.spines.values():
    spine.set_color('#333333')

# ============================================================
# PANEL 2: Paschen Breakdown Curve
# ============================================================
ax2.set_facecolor('#0D0A08')

# Paschen curve parameters (air)
A = 15.0       # 1/(torr·cm)
B = 365.0      # V/(torr·cm)
gamma = 0.01   # secondary electron emission coefficient

pd = np.logspace(-0.3, 3, 500)
denom = np.log(A * pd) - np.log(np.log(1 + 1/gamma))
V_bd = np.where(denom > 0, B * pd / denom, np.nan)

# Plot Paschen curve
ax2.loglog(pd, V_bd, color='#7EB8DA', linewidth=2, label='V_breakdown (air)')

# Camera voltage line
ax2.axhline(y=10000, color='#FF3030', linewidth=1.5, linestyle='--', 
            label='Camera voltage (10 kV)')

# Danger zone
valid_mask = (V_bd < 10000) & (~np.isnan(V_bd))
if np.any(valid_mask):
    ax2.fill_between(pd, 100, V_bd, where=valid_mask, 
                     alpha=0.2, color='#FF3030', label='ARC ZONE')

# Paschen minimum
valid_V = np.where(np.isnan(V_bd), 1e10, V_bd)
min_idx = np.argmin(valid_V)
ax2.plot(pd[min_idx], valid_V[min_idx], 'o', color='#FFB030', 
         markersize=10, zorder=5)
ax2.annotate(f'Paschen minimum\n{valid_V[min_idx]:.0f} V at p×d = {pd[min_idx]:.2f}',
             xy=(pd[min_idx], valid_V[min_idx]),
             xytext=(pd[min_idx] * 10, valid_V[min_idx] * 0.3),
             color='#FFB030', fontsize=8,
             arrowprops=dict(arrowstyle='->', color='#FFB030'))

# Ranger 6 conditions (approximate)
ranger_pd = 0.5  # approximate p*d at 90 km altitude, 0.5 cm gap
ax2.axvline(x=ranger_pd, color='#FF6600', linewidth=1, linestyle=':',
            label=f'Ranger 6 staging (~{ranger_pd} torr·cm)')

ax2.set_xlim(0.1, 1000)
ax2.set_ylim(100, 100000)
ax2.set_xlabel('p × d (torr·cm)', color='#A0A0A0')
ax2.set_ylabel('Breakdown Voltage (V)', color='#A0A0A0')
ax2.set_title('Paschen Breakdown — Why the Cameras Died', 
              color='#E8D4B8', fontsize=12, fontweight='bold')
ax2.legend(loc='upper right', fontsize=7, 
           facecolor='#1A1008', edgecolor='#5C2E0E', labelcolor='#E8E8E8')
ax2.tick_params(colors='#666666')
ax2.grid(True, alpha=0.15, color='#444444')
for spine in ax2.spines.values():
    spine.set_color('#333333')

plt.tight_layout()
plt.savefig('ranger6_trajectory_paschen.png', dpi=150, 
            facecolor='#0D0A08', bbox_inches='tight')
plt.show()

print("\nRanger 6: Perfect trajectory. Dead cameras.")
print(f"Paschen minimum: ~{valid_V[min_idx]:.0f} V")
print(f"Camera voltage: 10,000 V ({10000/valid_V[min_idx]:.0f}× above minimum)")
print("The cameras never had a chance.")
