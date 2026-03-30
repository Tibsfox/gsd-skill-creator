#!/usr/bin/env python3
"""
Geiger Counter Dead Time Saturation Model
==========================================
Mission 1.7 — Explorer 1, January 31, 1958

Models the paralyzable dead time behavior of a Geiger-Mueller tube.
Demonstrates the paradox that discovered the Van Allen radiation belts:
at very high true count rates, the measured count rate goes to ZERO.

The paralyzable (Type II) dead time model:
    N_measured = N_true × exp(-N_true × tau)

Where:
    N_true    = actual particle arrival rate (counts/sec)
    N_measured = observed count rate after dead time losses
    tau       = dead time of the G-M tube (~100 microseconds)

This function peaks at N_true = 1/tau, then DECREASES toward zero.
Explorer 1's Geiger counter (Type 314) had tau ≈ 100 us.
At the Van Allen belt peak (~1,500 km altitude), the true count rate
exceeded 10^6 counts/sec, producing N_measured ≈ 0.

Van Allen recognized that zero counts meant maximum radiation — not
instrument failure. This insight led directly to the discovery of
the radiation belts that bear his name.

Usage:
    python geiger-saturation.py              # Show plot
    python geiger-saturation.py --save       # Save to PNG

Requires: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
import sys

def paralyzable_dead_time(N_true, tau):
    """
    Paralyzable (Type II, extending) dead time model.

    Each event resets the dead time clock. At high rates, the tube
    never recovers — every new particle arrives during dead time and
    extends it further. The measured rate approaches zero.

    Parameters:
        N_true : array of true count rates (counts/sec)
        tau    : dead time (seconds)

    Returns:
        N_measured : observed count rates (counts/sec)
    """
    return N_true * np.exp(-N_true * tau)

def non_paralyzable_dead_time(N_true, tau):
    """
    Non-paralyzable (Type I) dead time model for comparison.

    Events during dead time are simply lost but don't extend it.
    The measured rate saturates at 1/tau but never goes to zero.

    Parameters:
        N_true : array of true count rates (counts/sec)
        tau    : dead time (seconds)

    Returns:
        N_measured : observed count rates (counts/sec)
    """
    return N_true / (1 + N_true * tau)

def main():
    save_mode = '--save' in sys.argv

    # --- Parameters ---
    tau = 100e-6  # 100 microseconds dead time (Explorer 1's Type 314 tube)

    # True count rates from 0 to 10^6 counts/sec
    N_true = np.logspace(0, 6, 1000)

    # Calculate measured rates for both models
    N_meas_para = paralyzable_dead_time(N_true, tau)
    N_meas_nonpara = non_paralyzable_dead_time(N_true, tau)

    # Key points
    peak_rate = 1.0 / tau  # Peak of paralyzable curve
    peak_measured = peak_rate * np.exp(-1)  # = 1/(tau * e)

    # Explorer 1 operating range
    background_rate = 30       # counts/sec (cosmic ray background)
    belt_rate = 1e6            # counts/sec (Van Allen belt peak estimate)
    belt_measured = paralyzable_dead_time(belt_rate, tau)

    # --- Figure 1: Dead Time Curves ---
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle("Geiger Counter Dead Time — Explorer 1 Saturation Paradox",
                 fontsize=14, fontweight='bold', y=0.98)

    # Panel 1: Log-log plot of both models
    ax1 = axes[0, 0]
    ax1.loglog(N_true, N_meas_para, 'g-', linewidth=2, label='Paralyzable (Explorer 1)')
    ax1.loglog(N_true, N_meas_nonpara, 'b--', linewidth=1.5, label='Non-paralyzable')
    ax1.loglog(N_true, N_true, 'k:', linewidth=1, alpha=0.3, label='Ideal (no dead time)')
    ax1.axvline(peak_rate, color='r', linestyle=':', alpha=0.5, label=f'Peak at 1/τ = {peak_rate:.0f}/s')
    ax1.axvline(belt_rate, color='orange', linestyle='--', alpha=0.7, label=f'Belt peak: {belt_rate:.0e}/s')

    # Mark Explorer 1's operating points
    ax1.plot(background_rate, paralyzable_dead_time(background_rate, tau),
             'wo', markersize=10, markeredgecolor='green', markeredgewidth=2,
             label=f'Background: {background_rate}/s')
    ax1.plot(belt_rate, max(belt_measured, 0.1),
             'r*', markersize=15, label=f'Belt: measured ≈ 0')

    ax1.set_xlabel('True Count Rate (counts/sec)')
    ax1.set_ylabel('Measured Count Rate (counts/sec)')
    ax1.set_title('True vs Measured Count Rate')
    ax1.legend(fontsize=8, loc='lower right')
    ax1.set_xlim(1, 1e6)
    ax1.set_ylim(0.1, 1e5)
    ax1.grid(True, alpha=0.3)

    # Panel 2: Linear plot showing the paradox clearly
    ax2 = axes[0, 1]
    N_linear = np.linspace(0, 5e4, 500)
    N_meas_lin = paralyzable_dead_time(N_linear, tau)

    ax2.plot(N_linear / 1000, N_meas_lin / 1000, 'g-', linewidth=2)
    ax2.axvline(peak_rate / 1000, color='r', linestyle=':', alpha=0.5)
    ax2.fill_between(N_linear / 1000, 0, N_meas_lin / 1000,
                     alpha=0.1, color='green')

    # Annotate the peak
    ax2.annotate(f'Peak: {peak_measured:.0f}/s\nat N_true = {peak_rate:.0f}/s',
                 xy=(peak_rate / 1000, peak_measured / 1000),
                 xytext=(peak_rate / 1000 + 5, peak_measured / 1000 + 0.5),
                 arrowprops=dict(arrowstyle='->', color='red'),
                 fontsize=9, color='red')

    # Annotate the paradox
    ax2.annotate('Measured rate DECREASES\nas true rate increases!',
                 xy=(30, 1.0), fontsize=10, color='orange',
                 bbox=dict(boxstyle='round,pad=0.3', facecolor='lightyellow', alpha=0.8))

    ax2.set_xlabel('True Count Rate (×1000 counts/sec)')
    ax2.set_ylabel('Measured Count Rate (×1000 counts/sec)')
    ax2.set_title('The Saturation Paradox (Linear Scale)')
    ax2.grid(True, alpha=0.3)

    # Panel 3: Fractional loss vs true rate
    ax3 = axes[1, 0]
    fraction_detected = np.where(N_true > 0, N_meas_para / N_true, 1.0)
    ax3.semilogx(N_true, fraction_detected * 100, 'g-', linewidth=2)
    ax3.axhline(50, color='orange', linestyle='--', alpha=0.5, label='50% loss')
    ax3.axhline(10, color='red', linestyle='--', alpha=0.5, label='90% loss')
    ax3.axvline(peak_rate, color='r', linestyle=':', alpha=0.5)

    # Explorer 1 annotations
    ax3.annotate('Background\n(cosmic rays)',
                 xy=(background_rate, 99.7), fontsize=8,
                 ha='center', va='bottom', color='green')
    ax3.annotate('Van Allen Belt\n(ZERO counts)',
                 xy=(belt_rate, 0.001), fontsize=8,
                 ha='center', va='bottom', color='red')

    ax3.set_xlabel('True Count Rate (counts/sec)')
    ax3.set_ylabel('Fraction Detected (%)')
    ax3.set_title('Detection Efficiency vs Count Rate')
    ax3.set_ylim(-5, 105)
    ax3.legend(fontsize=9)
    ax3.grid(True, alpha=0.3)

    # Panel 4: Explorer 1 orbit context
    ax4 = axes[1, 1]

    # Altitude profile (simplified sinusoidal for one orbit)
    orbit_phase = np.linspace(0, 2 * np.pi, 500)
    # Explorer 1: 358 × 2550 km, semi-major = 1454 km above surface
    perigee = 358    # km
    apogee = 2550    # km
    semi_major = (perigee + apogee) / 2
    eccentricity = (apogee - perigee) / (apogee + perigee)
    altitude = semi_major * (1 - eccentricity * np.cos(orbit_phase))

    # Radiation belt model: Gaussian centered at 1500 km
    belt_peak_alt = 1500  # km
    belt_sigma = 400      # km
    radiation = np.exp(-(altitude - belt_peak_alt)**2 / (2 * belt_sigma**2))
    true_rate_orbit = 30 + radiation * 1e6  # background + belt

    # Measured rate using paralyzable model
    measured_rate_orbit = paralyzable_dead_time(true_rate_orbit, tau)

    # Time axis (114.8 minute period)
    time_min = orbit_phase / (2 * np.pi) * 114.8

    ax4_alt = ax4
    ax4_alt.plot(time_min, altitude, 'b-', linewidth=1.5, label='Altitude (km)')
    ax4_alt.set_xlabel('Time (minutes)')
    ax4_alt.set_ylabel('Altitude (km)', color='blue')
    ax4_alt.tick_params(axis='y', labelcolor='blue')
    ax4_alt.set_ylim(0, 3000)

    # Belt region shading
    ax4_alt.axhspan(1000, 2000, alpha=0.1, color='gold', label='Inner belt region')

    ax4_rate = ax4_alt.twinx()
    ax4_rate.plot(time_min, measured_rate_orbit, 'g-', linewidth=2, label='Measured rate')
    ax4_rate.plot(time_min, true_rate_orbit, 'r:', linewidth=1, alpha=0.5, label='True rate')
    ax4_rate.set_ylabel('Count Rate (/sec)', color='green')
    ax4_rate.tick_params(axis='y', labelcolor='green')
    ax4_rate.set_yscale('symlog', linthresh=100)

    # Mark saturation regions
    saturation_mask = measured_rate_orbit < 1.0
    for i in range(len(time_min) - 1):
        if saturation_mask[i]:
            ax4_alt.axvspan(time_min[i], time_min[i + 1],
                           alpha=0.2, color='red', linewidth=0)

    ax4_alt.set_title("Explorer 1 Orbit: Belt Crossing")

    # Combined legend
    lines1, labels1 = ax4_alt.get_legend_handles_labels()
    lines2, labels2 = ax4_rate.get_legend_handles_labels()
    ax4_alt.legend(lines1 + lines2, labels1 + labels2, fontsize=7, loc='upper right')

    plt.tight_layout(rect=[0, 0, 1, 0.96])

    if save_mode:
        plt.savefig('geiger-saturation.png', dpi=150, bbox_inches='tight')
        print("Saved to geiger-saturation.png")
    else:
        plt.show()

    # --- Print summary ---
    print("\n" + "=" * 60)
    print("GEIGER COUNTER DEAD TIME ANALYSIS — EXPLORER 1")
    print("=" * 60)
    print(f"\nDead time (tau):      {tau * 1e6:.0f} microseconds")
    print(f"Peak measured rate:   {peak_measured:.0f} counts/sec")
    print(f"  at true rate:       {peak_rate:.0f} counts/sec")
    print(f"\nBackground (30/s):    measured = {paralyzable_dead_time(30, tau):.1f}/s (99.7% detected)")
    print(f"Belt peak (10^6/s):   measured = {paralyzable_dead_time(1e6, tau):.6f}/s (≈ ZERO)")
    print(f"\nVan Allen's insight:  zero counts = maximum radiation")
    print(f"The absence indicates the presence.")
    print(f"\nLobaria pulmonaria:   absent from polluted forests")
    print(f"                      its absence = presence of pollution")
    print(f"                      same logic, different domain.")

if __name__ == '__main__':
    main()
