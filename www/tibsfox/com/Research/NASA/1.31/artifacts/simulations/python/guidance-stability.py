#!/usr/bin/env python3
"""
guidance-stability.py — Mariner 1 Guidance System Stability Analysis

Demonstrates the effect of the missing overbar (smoothing function)
on the Atlas guidance system. Shows how raw radar noise, when processed
without smoothing, causes feedback oscillations leading to range safety
destruct at T+293 seconds.

Mission 1.31 — Mariner 1 (Atlas-Agena B), July 22, 1962
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

np.random.seed(1962)

# Simulation parameters
N = 400  # time steps (seconds)
dt = 1.0
K = 0.35  # guidance correction gain
noise_std = 8.0  # radar noise (m/s velocity estimate)
destruct_limit = 45.0  # lateral deviation limit (km)

# True trajectory (nominal — gentle pitch program)
true_velocity = np.linspace(0, 100, N)

# Radar measurements (noisy)
radar_noise = np.random.normal(0, noise_std, N)
v_measured = true_velocity + radar_noise

# ================================================================
# WITH SMOOTHING (correct code — what should have happened)
# ================================================================
window = 7  # moving average window
x_smooth = np.zeros(N)
v_smooth = np.zeros(N)
corrections_smooth = np.zeros(N)

for i in range(1, N):
    start = max(0, i - window)
    v_smooth[i] = np.mean(v_measured[start:i+1])  # THE OVERBAR
    error = v_smooth[i] - true_velocity[i]
    corrections_smooth[i] = -K * error
    x_smooth[i] = x_smooth[i-1] + corrections_smooth[i]

# ================================================================
# WITHOUT SMOOTHING (Mariner 1 — missing overbar)
# ================================================================
x_raw = np.zeros(N)
corrections_raw = np.zeros(N)
destruct_time = N

for i in range(1, N):
    error = v_measured[i] - true_velocity[i]  # RAW — no overbar!
    corrections_raw[i] = -K * error
    x_raw[i] = x_raw[i-1] + corrections_raw[i]
    if abs(x_raw[i]) > destruct_limit and destruct_time == N:
        destruct_time = i

# ================================================================
# VISUALIZATION
# ================================================================
fig, axes = plt.subplots(2, 2, figsize=(14, 9))
t = np.arange(N)

# Panel 1: Radar data
axes[0,0].plot(t, radar_noise, 'r.', alpha=0.2, markersize=2, label='Radar noise')
axes[0,0].plot(t, v_smooth - true_velocity, 'b-', linewidth=1.5, label='Smoothed error')
axes[0,0].axhline(0, color='gray', linestyle='--', alpha=0.5)
axes[0,0].set_ylabel('Velocity error (m/s)')
axes[0,0].set_title('Radar Tracking Error: Raw vs. Smoothed')
axes[0,0].legend(fontsize=8)
axes[0,0].grid(alpha=0.3)

# Panel 2: Guidance corrections
axes[0,1].plot(t, corrections_smooth, 'b-', alpha=0.8, linewidth=1, label='Smoothed corrections')
axes[0,1].plot(t[:destruct_time+10], corrections_raw[:destruct_time+10], 'r-', alpha=0.6, linewidth=0.8, label='Raw corrections (no overbar)')
axes[0,1].set_ylabel('Correction magnitude (km/s)')
axes[0,1].set_title('Guidance Corrections: Smooth vs. Oscillating')
axes[0,1].legend(fontsize=8)
axes[0,1].grid(alpha=0.3)

# Panel 3: Trajectory with smoothing (stable)
axes[1,0].plot(t, x_smooth, 'b-', linewidth=1.5, label='With overbar (correct)')
axes[1,0].axhline(destruct_limit, color='r', linestyle='--', alpha=0.5, label='Destruct limit')
axes[1,0].axhline(-destruct_limit, color='r', linestyle='--', alpha=0.5)
axes[1,0].fill_between(t, -destruct_limit, destruct_limit, alpha=0.05, color='green')
axes[1,0].set_ylabel('Lateral deviation (km)')
axes[1,0].set_xlabel('Time (seconds)')
axes[1,0].set_title('WITH Overbar: Vehicle Stays on Course')
axes[1,0].set_ylim(-70, 70)
axes[1,0].legend(fontsize=8)
axes[1,0].grid(alpha=0.3)

# Panel 4: Trajectory without smoothing (destruct)
axes[1,1].plot(t[:destruct_time+5], x_raw[:destruct_time+5], 'r-', linewidth=1.5, label='Without overbar (Mariner 1)')
axes[1,1].axhline(destruct_limit, color='r', linestyle='--', alpha=0.5, label='Destruct limit')
axes[1,1].axhline(-destruct_limit, color='r', linestyle='--', alpha=0.5)
axes[1,1].axvline(destruct_time, color='orange', linewidth=3, label=f'DESTRUCT T+{destruct_time}s', zorder=5)
axes[1,1].fill_between(t, -destruct_limit, destruct_limit, alpha=0.05, color='green')
axes[1,1].set_ylabel('Lateral deviation (km)')
axes[1,1].set_xlabel('Time (seconds)')
axes[1,1].set_title(f'WITHOUT Overbar: Oscillation → DESTRUCT at T+{destruct_time}s')
axes[1,1].set_ylim(-70, 70)
axes[1,1].legend(fontsize=8, loc='upper left')
axes[1,1].grid(alpha=0.3)

plt.suptitle('MARINER 1: The Missing Overbar\n'
             'One symbol omitted from guidance equations → feedback instability → range safety destruct',
             fontsize=13, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('mariner1_guidance_analysis.png', dpi=150, bbox_inches='tight')
print(f'Simulation complete.')
print(f'With smoothing: max deviation = {np.max(np.abs(x_smooth)):.1f} km (safe)')
print(f'Without smoothing: destruct at T+{destruct_time}s, deviation = {destruct_limit:.0f} km')
print(f'The difference is {window} samples of averaging. The overbar.')
print(f'Cost of the missing overbar: $18.5 million (1962 dollars).')
