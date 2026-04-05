#!/usr/bin/env python3
"""
Serial vs Parallel Reliability: Ranger 2 vs Sword Fern
Mission 1.27

Compares serial reliability chains (spacecraft systems) with
parallel redundancy strategies (fern spore production).
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

print("SERIAL VS PARALLEL RELIABILITY")
print("Ranger 2 (serial) vs Sword Fern (parallel)")
print("=" * 60)

# === SERIAL: Ranger 2 ===
components = [
    ("Atlas Stage 1",    0.90),
    ("Atlas Sustainer",   0.95),
    ("Agena 1st Burn",   0.93),
    ("Agena Gyroscopes",  0.95),
    ("Agena Restart",    0.85),
    ("Separation",       0.98),
    ("SC Attitude Ctrl",  0.95),
    ("SC Instruments",   0.90),
]

print("\n--- SERIAL CHAIN (Ranger 2) ---")
R_serial = 1.0
for name, R in components:
    R_serial *= R
    print(f"  {name:<20} R={R:.3f}  Cumulative: {R_serial:.4f}")
print(f"  System reliability: {R_serial*100:.1f}%")

# === PARALLEL: Sword Fern ===
print("\n--- PARALLEL ARRAY (Sword Fern) ---")
n_spores = 10_000_000
p_per_spore = 1e-6  # probability of successful establishment per spore

P_at_least_one = 1 - (1 - p_per_spore)**n_spores
expected_successes = n_spores * p_per_spore

print(f"  Spores per plant/year: {n_spores:,}")
print(f"  Success per spore:     {p_per_spore:.1e}")
print(f"  P(at least 1 success): {P_at_least_one:.6f}")
print(f"  Expected successes:    {expected_successes:.0f}")

# === COMPARISON PLOT ===
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Left: Serial reliability vs number of components
n_range = np.arange(1, 21)
for p in [0.99, 0.95, 0.90, 0.85]:
    R = p ** n_range
    ax1.plot(n_range, R * 100, label=f'p={p:.2f}', linewidth=2)

ax1.axhline(50, color='gray', linestyle='--', alpha=0.5)
ax1.axvline(8, color='#CC4444', linestyle=':', alpha=0.7, label='Ranger 2 (8 components)')
ax1.set_xlabel('Number of Serial Components')
ax1.set_ylabel('System Reliability (%)')
ax1.set_title('Serial Chain: More Components → Lower Reliability')
ax1.legend(fontsize=9)
ax1.grid(alpha=0.3)
ax1.set_ylim(0, 100)

# Right: Parallel redundancy vs number of attempts
n_attempts = np.logspace(0, 8, 1000)
for p in [1e-2, 1e-4, 1e-6, 1e-8]:
    P = 1 - (1 - p)**n_attempts
    ax2.semilogx(n_attempts, P * 100, label=f'p={p:.0e}', linewidth=2)

ax2.axhline(99, color='gray', linestyle='--', alpha=0.5)
ax2.axvline(1e7, color='#4A8A4A', linestyle=':', alpha=0.7, label='Sword fern (10M spores)')
ax2.set_xlabel('Number of Parallel Attempts')
ax2.set_ylabel('P(at least 1 success) (%)')
ax2.set_title('Parallel Array: More Attempts → Higher P(success)')
ax2.legend(fontsize=9)
ax2.grid(alpha=0.3)
ax2.set_ylim(0, 105)

plt.suptitle('Serial (Ranger 2) vs Parallel (Sword Fern) Reliability', fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig('serial_vs_parallel.png', dpi=150, facecolor='#0D160D')
print("\nSaved: serial_vs_parallel.png")
print("\nThe fern's math wins. Always.")
