#!/usr/bin/env python3
"""
Pioneer 5 — Deep Space Link Budget Calculator
=========================================================================
Mission 1.13: Pioneer 5 (NASA / Thor-Able IV), March 11, 1960
FIRST INTERPLANETARY PROBE — Heliocentric orbit between Earth and Venus

Computes the communication link budget for Pioneer 5's 5-watt transmitter
at various distances from Earth. Shows received power, signal-to-noise
ratio, and achievable data rate as functions of distance, demonstrating
the inverse-square law's relentless effect on deep-space communication.

Pioneer 5 set the distance record at 36.2 million km (0.242 AU),
transmitting telemetry about the interplanetary magnetic field and
solar wind. Its 5W signal at that distance had a received power of
approximately 10^-19 watts — barely above the thermal noise floor.

This produces:
  1. Received power vs distance (linear and log scale)
  2. Signal-to-noise ratio vs distance
  3. Achievable data rate vs distance (Shannon capacity)
  4. Free-space path loss at Pioneer 5's frequency
  5. Comparison: Pioneer 5 vs later deep-space missions

Requires: numpy, matplotlib
Run: python3 link-budget.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# =========================================================================
# Physical Constants & Pioneer 5 Parameters
# =========================================================================
C = 2.998e8              # Speed of light (m/s)
K_BOLTZ = 1.381e-23      # Boltzmann constant (J/K)
AU = 1.496e11            # 1 Astronomical Unit (m)

# Pioneer 5 transmitter
P_TX_W = 5.0             # Transmitter power (watts)
P_TX_DBM = 10 * np.log10(P_TX_W * 1000)  # = +37 dBm
FREQ = 378.2e6           # Downlink frequency (Hz)
LAMBDA = C / FREQ        # Wavelength (m) = 0.793 m

# Antenna gains
G_TX_DBI = 3.0           # Spacecraft antenna gain (dBi, omnidirectional)
G_RX_DBI = 43.0          # Ground antenna gain (26m dish at 378 MHz, dBi)

# Receiver
T_SYS = 150.0            # System noise temperature (K) — 1960s technology
BW = 100.0               # Receiver bandwidth (Hz) — very narrow for CW
NOISE_POWER_DBM = 10 * np.log10(K_BOLTZ * T_SYS * BW * 1000)

# Pioneer 5's record distance
D_RECORD_KM = 36.2e6     # 36.2 million km
D_RECORD_M = D_RECORD_KM * 1000

# =========================================================================
# Link Budget Functions
# =========================================================================

def fspl_db(distance_m, wavelength_m):
    """Free-space path loss in dB."""
    return 20 * np.log10(4 * np.pi * distance_m / wavelength_m)

def received_power_dbm(distance_m):
    """Received power at given distance (dBm)."""
    loss = fspl_db(distance_m, LAMBDA)
    return P_TX_DBM + G_TX_DBI - loss + G_RX_DBI

def snr_db(distance_m):
    """Signal-to-noise ratio at given distance (dB)."""
    return received_power_dbm(distance_m) - NOISE_POWER_DBM

def data_rate_bps(distance_m):
    """Shannon capacity at given distance (bps)."""
    snr_linear = 10 ** (snr_db(distance_m) / 10)
    snr_linear = np.maximum(snr_linear, 1e-10)
    return BW * np.log2(1 + snr_linear)

# =========================================================================
# Distance Array: 1,000 km to 100 million km (logarithmic)
# =========================================================================
distances_m = np.logspace(6, 11, 500)  # 1,000 km to 100M km
distances_km = distances_m / 1000
distances_au = distances_m / AU

# Compute link budget parameters
p_rx = received_power_dbm(distances_m)
snr = snr_db(distances_m)
rate = data_rate_bps(distances_m)
loss = fspl_db(distances_m, LAMBDA)

# =========================================================================
# Plotting
# =========================================================================
fig = plt.figure(figsize=(16, 14))
fig.suptitle("Pioneer 5 — Deep Space Link Budget\n"
             "5W transmitter at 378.2 MHz, first interplanetary probe (March 11, 1960)",
             fontsize=14, fontweight='bold', color='#2060CC')
fig.patch.set_facecolor('#0a0a15')

gs = gridspec.GridSpec(3, 2, hspace=0.35, wspace=0.30)

# --- Plot 1: Received Power vs Distance ---
ax1 = fig.add_subplot(gs[0, 0])
ax1.set_facecolor('#0d0d20')

ax1.semilogx(distances_km, p_rx, color='#2060CC', linewidth=2, label='Received power')
ax1.axhline(y=NOISE_POWER_DBM, color='#CC4020', linestyle='--', alpha=0.7,
            label=f'Noise floor ({NOISE_POWER_DBM:.0f} dBm)')
ax1.axvline(x=D_RECORD_KM, color='#E8D060', linestyle=':', alpha=0.7,
            label=f'Pioneer 5 record ({D_RECORD_KM/1e6:.1f}M km)')

# Mark key distances
milestones = [
    (1e3, 'Launch'),
    (384400, 'Moon'),
    (D_RECORD_KM, 'Pioneer 5\nrecord'),
]
for d, label in milestones:
    p = received_power_dbm(d * 1000)
    ax1.plot(d, p, 'o', color='#E8D060', markersize=6)
    ax1.annotate(label, (d, p), textcoords="offset points",
                 xytext=(10, 10), fontsize=7, color='#E8D060')

ax1.set_xlabel('Distance (km)', color='#888', fontsize=9)
ax1.set_ylabel('Received Power (dBm)', color='#888', fontsize=9)
ax1.set_title('Received Signal Power', color='#ccc', fontsize=11)
ax1.legend(fontsize=7, loc='upper right', facecolor='#0d0d20', edgecolor='#333',
           labelcolor='#aaa')
ax1.tick_params(colors='#666', labelsize=8)
ax1.grid(True, alpha=0.15, color='#444')

# --- Plot 2: Signal-to-Noise Ratio vs Distance ---
ax2 = fig.add_subplot(gs[0, 1])
ax2.set_facecolor('#0d0d20')

ax2.semilogx(distances_km, snr, color='#CC8830', linewidth=2, label='SNR')
ax2.axhline(y=0, color='#CC4020', linestyle='--', alpha=0.7, label='0 dB (signal = noise)')
ax2.axhline(y=3, color='#E8D060', linestyle=':', alpha=0.5, label='3 dB (min detection)')
ax2.axvline(x=D_RECORD_KM, color='#E8D060', linestyle=':', alpha=0.5)

# Color the regions
ax2.fill_between(distances_km, snr, 0, where=snr > 0, alpha=0.1, color='#2060CC')
ax2.fill_between(distances_km, snr, 0, where=snr <= 0, alpha=0.1, color='#CC4020')

ax2.set_xlabel('Distance (km)', color='#888', fontsize=9)
ax2.set_ylabel('SNR (dB)', color='#888', fontsize=9)
ax2.set_title('Signal-to-Noise Ratio', color='#ccc', fontsize=11)
ax2.legend(fontsize=7, loc='upper right', facecolor='#0d0d20', edgecolor='#333',
           labelcolor='#aaa')
ax2.tick_params(colors='#666', labelsize=8)
ax2.grid(True, alpha=0.15, color='#444')
ax2.set_ylim(-30, max(snr) + 10)

# --- Plot 3: Data Rate vs Distance ---
ax3 = fig.add_subplot(gs[1, 0])
ax3.set_facecolor('#0d0d20')

ax3.loglog(distances_km, rate, color='#8AAA70', linewidth=2, label='Shannon capacity')
ax3.axhline(y=1, color='#CC4020', linestyle='--', alpha=0.5, label='1 bps')
ax3.axvline(x=D_RECORD_KM, color='#E8D060', linestyle=':', alpha=0.5,
            label='Pioneer 5 record')

ax3.set_xlabel('Distance (km)', color='#888', fontsize=9)
ax3.set_ylabel('Data Rate (bps)', color='#888', fontsize=9)
ax3.set_title('Achievable Data Rate (Shannon Capacity)', color='#ccc', fontsize=11)
ax3.legend(fontsize=7, loc='upper right', facecolor='#0d0d20', edgecolor='#333',
           labelcolor='#aaa')
ax3.tick_params(colors='#666', labelsize=8)
ax3.grid(True, alpha=0.15, color='#444')

# --- Plot 4: Free-Space Path Loss ---
ax4 = fig.add_subplot(gs[1, 1])
ax4.set_facecolor('#0d0d20')

ax4.semilogx(distances_km, loss, color='#CC4020', linewidth=2, label='FSPL at 378.2 MHz')

# Compare with other frequencies
for f, lbl, clr in [(108e6, '108 MHz (Explorer)', '#4488CC'),
                     (2.3e9, '2.3 GHz (S-band)', '#CC8830'),
                     (8.4e9, '8.4 GHz (X-band)', '#CC4060')]:
    lam = C / f
    fspl = fspl_db(distances_m, lam)
    ax4.semilogx(distances_km, fspl, color=clr, linewidth=1, alpha=0.6, label=lbl)

ax4.axvline(x=D_RECORD_KM, color='#E8D060', linestyle=':', alpha=0.5)

ax4.set_xlabel('Distance (km)', color='#888', fontsize=9)
ax4.set_ylabel('Path Loss (dB)', color='#888', fontsize=9)
ax4.set_title('Free-Space Path Loss', color='#ccc', fontsize=11)
ax4.legend(fontsize=7, loc='upper left', facecolor='#0d0d20', edgecolor='#333',
           labelcolor='#aaa')
ax4.tick_params(colors='#666', labelsize=8)
ax4.grid(True, alpha=0.15, color='#444')

# --- Plot 5: Power at Key Distances (bar chart) ---
ax5 = fig.add_subplot(gs[2, 0])
ax5.set_facecolor('#0d0d20')

key_distances = [1e3, 1e4, 384400, 1e6, 1e7, D_RECORD_KM]
key_labels = ['1,000\nkm', '10,000\nkm', 'Moon\n384K km', '1M\nkm',
              '10M\nkm', 'Pioneer 5\n36.2M km']
key_powers = [received_power_dbm(d * 1000) for d in key_distances]

colors = ['#2060CC' if p > NOISE_POWER_DBM else '#CC4020' for p in key_powers]
bars = ax5.bar(range(len(key_distances)), key_powers, color=colors, alpha=0.8,
               edgecolor='#444')
ax5.axhline(y=NOISE_POWER_DBM, color='#CC4020', linestyle='--', alpha=0.7,
            label=f'Noise floor')
ax5.set_xticks(range(len(key_distances)))
ax5.set_xticklabels(key_labels, fontsize=7, color='#888')
ax5.set_ylabel('Received Power (dBm)', color='#888', fontsize=9)
ax5.set_title('Signal Strength at Key Distances', color='#ccc', fontsize=11)
ax5.legend(fontsize=7, facecolor='#0d0d20', edgecolor='#333', labelcolor='#aaa')
ax5.tick_params(colors='#666', labelsize=8)
ax5.grid(True, alpha=0.15, color='#444', axis='y')

# Add power labels on bars
for i, p in enumerate(key_powers):
    ax5.text(i, p + 2, f'{p:.0f}', ha='center', fontsize=7, color='#E8D060')

# --- Plot 6: Mission Comparison ---
ax6 = fig.add_subplot(gs[2, 1])
ax6.set_facecolor('#0d0d20')

missions = [
    ('Pioneer 5\n(1960)', 36.2e6, 5, '#E8D060'),
    ('Mariner 2\n(1962)', 87e6, 3, '#CC8830'),
    ('Pioneer 10\n(1973)', 2.4e9, 8, '#2060CC'),
    ('Voyager 1\n(2024)', 24.4e9, 23, '#8AAA70'),
    ('New Horizons\n(2015)', 4.9e9, 12, '#CC4060'),
]

for i, (name, dist_km, power_w, color) in enumerate(missions):
    ax6.barh(i, np.log10(dist_km), color=color, alpha=0.7, height=0.6, edgecolor='#444')
    ax6.text(np.log10(dist_km) + 0.1, i, f'{dist_km/1e6:.0f}M km, {power_w}W',
             fontsize=7, color='#ccc', va='center')

ax6.set_yticks(range(len(missions)))
ax6.set_yticklabels([m[0] for m in missions], fontsize=8, color='#888')
ax6.set_xlabel('log₁₀(Distance in km)', color='#888', fontsize=9)
ax6.set_title('Deep Space Communication — Mission Comparison', color='#ccc', fontsize=11)
ax6.tick_params(colors='#666', labelsize=8)
ax6.grid(True, alpha=0.15, color='#444', axis='x')

plt.tight_layout(rect=[0, 0, 1, 0.94])
plt.savefig('pioneer5-link-budget.png', dpi=150, facecolor='#0a0a15',
            bbox_inches='tight')
plt.show()

# =========================================================================
# Summary Output
# =========================================================================
print("\n" + "=" * 70)
print("PIONEER 5 — DEEP SPACE LINK BUDGET SUMMARY")
print("=" * 70)
print(f"\nTransmitter power:    {P_TX_W} W ({P_TX_DBM:.1f} dBm)")
print(f"Frequency:            {FREQ/1e6:.1f} MHz (λ = {LAMBDA:.3f} m)")
print(f"Spacecraft antenna:   {G_TX_DBI:.1f} dBi")
print(f"Ground antenna:       {G_RX_DBI:.1f} dBi (26m dish)")
print(f"System noise temp:    {T_SYS:.0f} K")
print(f"Receiver bandwidth:   {BW:.0f} Hz")
print(f"Noise floor:          {NOISE_POWER_DBM:.1f} dBm")

print(f"\n{'Distance':>18s} {'FSPL':>10s} {'P_rx':>10s} {'SNR':>8s} {'Rate':>10s}")
print("-" * 60)
for d_km in [1e3, 1e4, 1e5, 384400, 1e6, 1e7, D_RECORD_KM, 1e8]:
    d_m = d_km * 1000
    fl = fspl_db(d_m, LAMBDA)
    pr = received_power_dbm(d_m)
    sn = snr_db(d_m)
    rt = data_rate_bps(d_m)
    label = ''
    if d_km == 384400: label = ' (Moon)'
    elif d_km == D_RECORD_KM: label = ' (Pioneer 5 RECORD)'
    print(f"{d_km:>15,.0f} km {fl:>9.1f} dB {pr:>9.1f} dBm {sn:>7.1f} dB {rt:>9.1f} bps{label}")

print(f"\nAt Pioneer 5's record distance ({D_RECORD_KM/1e6:.1f} million km):")
print(f"  Received power = {10**(received_power_dbm(D_RECORD_M)/10) / 1000:.2e} watts")
print(f"  That's {P_TX_W / (10**(received_power_dbm(D_RECORD_M)/10) / 1000):.1e}× weaker than transmitted")
print(f"  SNR = {snr_db(D_RECORD_M):.1f} dB — {'detectable' if snr_db(D_RECORD_M) > 0 else 'below noise floor'}")
