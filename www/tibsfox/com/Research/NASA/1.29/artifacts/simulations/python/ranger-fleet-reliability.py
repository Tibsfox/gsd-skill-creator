#!/usr/bin/env python3
"""
ranger_fleet_reliability.py
Ranger Program Reliability Analysis
Mission 1.29 — NASA Mission Series

Analyzes the Ranger program's six-failure, three-success arc
through the lens of reliability engineering.

Requirements: numpy, matplotlib
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

print("=" * 60)
print("RANGER PROGRAM — RELIABILITY ANALYSIS")
print("Nine Missions, Six Failures, Three Successes")
print("=" * 60)

# Ranger mission data
missions = {
    'R1': {'date': '1961-08-23', 'success': False, 'failure': 'Agena restart', 'subsystem': 'launch_vehicle'},
    'R2': {'date': '1961-11-18', 'success': False, 'failure': 'Agena restart', 'subsystem': 'launch_vehicle'},
    'R3': {'date': '1962-01-26', 'success': False, 'failure': 'Guidance error', 'subsystem': 'guidance'},
    'R4': {'date': '1962-04-23', 'success': False, 'failure': 'Timer (SPF)', 'subsystem': 'c&dh'},
    'R5': {'date': '1962-10-18', 'success': False, 'failure': 'Power system', 'subsystem': 'power'},
    'R6': {'date': '1964-01-30', 'success': False, 'failure': 'Camera', 'subsystem': 'payload'},
    'R7': {'date': '1964-07-28', 'success': True, 'failure': None, 'subsystem': None},
    'R8': {'date': '1965-02-17', 'success': True, 'failure': None, 'subsystem': None},
    'R9': {'date': '1965-03-21', 'success': True, 'failure': None, 'subsystem': None},
}

# Cumulative success rate
n_missions = list(range(1, 10))
cumulative_successes = []
running_success = 0
for i, (name, data) in enumerate(missions.items()):
    if data['success']:
        running_success += 1
    cumulative_successes.append(running_success / (i + 1))

print("\n--- Mission-by-Mission ---")
for i, (name, data) in enumerate(missions.items()):
    status = "✓ SUCCESS" if data['success'] else f"✗ FAIL ({data['failure']})"
    rate = cumulative_successes[i]
    print(f"  {name}: {data['date']}  {status:<30} Cumulative: {rate:.1%}")

# Single-point failure analysis for Ranger 4
print("\n--- Ranger 4: Single-Point Failure Analysis ---")
components = {
    'Master clock timer': {'R': 0.99, 'consequence': 'total', 'SPF': True},
    'Solar panels': {'R': 0.95, 'consequence': 'power_loss', 'SPF': False},
    'High-gain antenna': {'R': 0.97, 'consequence': 'data_loss', 'SPF': False},
    'TV camera': {'R': 0.90, 'consequence': 'partial_loss', 'SPF': False},
    'Gamma-ray spec': {'R': 0.93, 'consequence': 'partial_loss', 'SPF': False},
    'Seismometer': {'R': 0.88, 'consequence': 'partial_loss', 'SPF': False},
    'Midcourse engine': {'R': 0.95, 'consequence': 'targeting', 'SPF': False},
    'Radar altimeter': {'R': 0.92, 'consequence': 'partial_loss', 'SPF': False},
    'Atlas-Agena B': {'R': 0.85, 'consequence': 'total', 'SPF': True},
}

R_total = 1.0
for name, comp in components.items():
    R_total *= comp['R']
    spf_marker = " [SPF]" if comp['SPF'] else ""
    print(f"  {name:<25} R = {comp['R']:.2f}  Consequence: {comp['consequence']}{spf_marker}")

print(f"\n  Total system reliability: {R_total:.4f} ({R_total*100:.1f}%)")

# With redundant timer
R_timer_dual = 1 - (1 - 0.99)**2
R_total_fixed = R_total / 0.99 * R_timer_dual
print(f"  With dual timer:         {R_total_fixed:.4f} ({R_total_fixed*100:.1f}%)")
print(f"  SPF elimination benefit: {(R_total_fixed - R_total)/R_total*100:.1f}% improvement")

# === Visualization ===
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.patch.set_facecolor('#0A0A20')

# Plot 1: Cumulative success rate
ax1 = axes[0, 0]
ax1.set_facecolor('#0A0A20')
colors = ['#CC3333' if not m['success'] else '#33CC33' for m in missions.values()]
ax1.bar(list(missions.keys()), [1]*9, color=colors, alpha=0.3, width=0.6)
ax1.plot(list(missions.keys()), cumulative_successes, 'w-o', linewidth=2, markersize=6)
ax1.set_ylabel('Cumulative Success Rate', color='#A0A0A0')
ax1.set_title('Ranger Program: Six Failures → Three Successes', color='white')
ax1.axhline(y=0.333, color='#CC6600', linestyle='--', alpha=0.5, label='Final: 33%')
ax1.tick_params(colors='#808080')
ax1.legend(facecolor='#151530', edgecolor='#303060')

# Plot 2: Failure subsystem distribution
ax2 = axes[0, 1]
ax2.set_facecolor('#0A0A20')
subsystems = ['launch_vehicle', 'guidance', 'c&dh', 'power', 'payload']
labels = ['Launch Vehicle\n(Agena)', 'Guidance', 'C&DH\n(Timer)', 'Power', 'Payload\n(Camera)']
counts = [sum(1 for m in missions.values() if m['subsystem'] == s) for s in subsystems]
colors_pie = ['#CC3333', '#CCCC33', '#CC6600', '#3366CC', '#33CC33']
wedges, texts, autotexts = ax2.pie(counts, labels=labels, colors=colors_pie, 
                                     autopct='%1.0f%%', startangle=90,
                                     textprops={'color': '#D0D0D0', 'fontsize': 8})
for t in autotexts:
    t.set_color('white')
ax2.set_title('Failure Distribution by Subsystem', color='white')

# Plot 3: SPF reliability sensitivity
ax3 = axes[1, 0]
ax3.set_facecolor('#0A0A20')
R_spf = np.linspace(0.9, 0.999, 100)
R_rest = R_total / 0.99
R_sys_single = R_spf * R_rest
R_sys_dual = (1 - (1 - R_spf)**2) * R_rest
ax3.plot(R_spf * 100, R_sys_single * 100, 'r-', linewidth=2, label='Single timer')
ax3.plot(R_spf * 100, R_sys_dual * 100, 'g-', linewidth=2, label='Dual redundant')
ax3.axvline(x=99, color='#CC6600', linestyle='--', alpha=0.7, label='Ranger 4 (99%)')
ax3.fill_between(R_spf * 100, R_sys_single * 100, R_sys_dual * 100, alpha=0.1, color='green')
ax3.set_xlabel('Timer Reliability (%)', color='#A0A0A0')
ax3.set_ylabel('Mission Success (%)', color='#A0A0A0')
ax3.set_title('SPF Sensitivity: Single vs Redundant', color='white')
ax3.legend(facecolor='#151530', edgecolor='#303060', fontsize=8)
ax3.tick_params(colors='#808080')

# Plot 4: Information deficit
ax4 = axes[1, 1]
ax4.set_facecolor('#0A0A20')
info_data = {
    'R3\n(missed)': 500 * 30 * 3600,  # some telemetry during flyby
    'R4\n(hit, dead)': 3200,  # Doppler only
    'R7\n(SUCCESS)': 500 * 17 * 60 + 4316 * 200000,  # telemetry + images
}
bars = ax4.bar(info_data.keys(), info_data.values(), 
               color=['#CCCC33', '#CC6600', '#33CC33'], width=0.5,
               edgecolor='#303060')
ax4.set_yscale('log')
ax4.set_ylabel('Data Returned (bits, log scale)', color='#A0A0A0')
ax4.set_title('Data Return: R3 (miss) vs R4 (dead hit) vs R7 (success)', color='white')
ax4.tick_params(colors='#808080')

plt.tight_layout()
plt.savefig('ranger-fleet-reliability.png', dpi=150, facecolor='#0A0A20')
print(f"\nSaved: ranger-fleet-reliability.png")
print(f"\nNine missions. Six different failure modes.")
print(f"Each failure eliminated a specific engineering weakness.")
print(f"Ranger 4's contribution: never again would a single clock")
print(f"be the sole keeper of a spacecraft's mission timeline.")
