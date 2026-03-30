#!/usr/bin/env python3
"""
Pioneer 3 — Dual Van Allen Belt Radiation Profile
==================================================
Mission 1.4: Pioneer 3 (Juno II), December 6, 1958
Maximum altitude: 102,322 km | Flight duration: ~38 hours

Pioneer 3's key scientific discovery: TWO distinct radiation belts
surrounding Earth, not one. Dr. James Van Allen's dual GM tube
experiment revealed:
  - Inner belt: peak ~3,500 km, high-energy protons (>30 MeV)
  - Outer belt: peak ~16,000 km, lower-energy electrons (~1 MeV)
  - Slot region: ~7,000-10,000 km, reduced radiation intensity

This script models the radiation environment as a superposition of
two Gaussians (plus background), then simulates what Pioneer 3's
Geiger-Mueller tubes actually measured with Poisson counting statistics.

Requires: numpy, scipy, matplotlib
Run: python3 dual-belt-profile.py
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import poisson

# =========================================================================
# Physical parameters
# =========================================================================

# Pioneer 3 flight parameters
MAX_ALT_KM = 102_322          # Maximum altitude (km)
FLIGHT_TIME_HR = 38.0         # Total flight time (hours)
EARTH_RADIUS_KM = 6_371       # Earth radius (km)

# Radiation belt model: two Gaussians + constant background
# Based on Van Allen's published data from Pioneer 3 and Explorer missions

# Inner belt (high-energy trapped protons)
INNER_PEAK_KM = 3_500         # Peak altitude (km above surface)
INNER_SIGMA_KM = 1_500        # Width (km)
INNER_IMAX = 10_000           # Peak intensity (counts/sec)

# Outer belt (trapped electrons)
OUTER_PEAK_KM = 16_000        # Peak altitude (km above surface)
OUTER_SIGMA_KM = 5_000        # Width (km)
OUTER_IMAX = 5_000            # Peak intensity (counts/sec)

# Background (cosmic rays + spacecraft)
BACKGROUND = 5                # counts/sec (cosmic ray background)

# GM tube parameters
INTEGRATION_TIME_S = 1.0      # Counting interval (seconds)
DEAD_TIME_US = 100            # Dead time per count (microseconds)


def radiation_profile(altitude_km):
    """
    Compute radiation intensity as function of altitude.
    Two-Gaussian model with background.

    Parameters
    ----------
    altitude_km : array-like
        Altitude above Earth's surface in km

    Returns
    -------
    intensity : array-like
        Radiation intensity in counts/sec
    """
    alt = np.asarray(altitude_km, dtype=float)

    inner = INNER_IMAX * np.exp(-0.5 * ((alt - INNER_PEAK_KM) / INNER_SIGMA_KM) ** 2)
    outer = OUTER_IMAX * np.exp(-0.5 * ((alt - OUTER_PEAK_KM) / OUTER_SIGMA_KM) ** 2)

    return inner + outer + BACKGROUND


def pioneer3_trajectory(t_hours, max_alt_km=MAX_ALT_KM, flight_time_hr=FLIGHT_TIME_HR):
    """
    Simplified Pioneer 3 trajectory: ballistic (parabolic) arc.
    Launched nearly vertically, reached max altitude, fell back.

    The Juno II upper stage burned out at ~200 km altitude with
    insufficient velocity for lunar trajectory. The spacecraft
    followed a high ballistic arc.

    Parameters
    ----------
    t_hours : array-like
        Time since launch (hours)
    max_alt_km : float
        Maximum altitude
    flight_time_hr : float
        Total flight time

    Returns
    -------
    altitude_km : array-like
        Altitude above Earth's surface (km)
    """
    t = np.asarray(t_hours, dtype=float)
    t_half = flight_time_hr / 2.0

    # Parabolic approximation: alt = max_alt * (1 - ((t - t_half)/t_half)^2)
    alt = max_alt_km * (1.0 - ((t - t_half) / t_half) ** 2)
    alt = np.maximum(alt, 0.0)  # Clip to zero (surface)

    return alt


def simulate_gm_counts(true_rate, integration_time=INTEGRATION_TIME_S, rng=None):
    """
    Simulate Geiger-Mueller tube measurements with Poisson statistics.

    Parameters
    ----------
    true_rate : array-like
        True radiation rate (counts/sec)
    integration_time : float
        Integration time per measurement (seconds)
    rng : numpy.random.Generator, optional
        Random number generator

    Returns
    -------
    measured_rate : array-like
        Measured count rate (counts/sec) with Poisson noise
    """
    if rng is None:
        rng = np.random.default_rng(42)

    expected_counts = np.asarray(true_rate) * integration_time
    expected_counts = np.maximum(expected_counts, 0)

    # Poisson sampling
    actual_counts = rng.poisson(expected_counts)

    # Convert back to rate
    return actual_counts / integration_time


def main():
    rng = np.random.default_rng(1958)  # Year of Pioneer 3

    # =====================================================================
    # Plot 1: Radiation Intensity vs Altitude (The Discovery Plot)
    # =====================================================================
    altitudes = np.linspace(0, 50_000, 2000)
    intensity = radiation_profile(altitudes)
    inner_only = INNER_IMAX * np.exp(-0.5 * ((altitudes - INNER_PEAK_KM) / INNER_SIGMA_KM) ** 2)
    outer_only = OUTER_IMAX * np.exp(-0.5 * ((altitudes - OUTER_PEAK_KM) / OUTER_SIGMA_KM) ** 2)

    fig1, ax1 = plt.subplots(figsize=(12, 7))
    ax1.semilogy(altitudes / 1000, intensity, 'w-', linewidth=2.5, label='Total radiation')
    ax1.semilogy(altitudes / 1000, inner_only + BACKGROUND, 'r--', linewidth=1.5,
                 alpha=0.7, label=f'Inner belt (peak {INNER_PEAK_KM:,} km)')
    ax1.semilogy(altitudes / 1000, outer_only + BACKGROUND, 'c--', linewidth=1.5,
                 alpha=0.7, label=f'Outer belt (peak {OUTER_PEAK_KM:,} km)')
    ax1.axhline(y=BACKGROUND, color='gray', linestyle=':', alpha=0.5,
                label=f'Background ({BACKGROUND} counts/sec)')

    # Mark key regions
    ax1.axvspan(7, 10, alpha=0.15, color='black', label='Slot region')
    ax1.axvline(x=MAX_ALT_KM / 1000, color='yellow', linestyle='--', alpha=0.5,
                label=f'Pioneer 3 max alt ({MAX_ALT_KM:,} km)')

    ax1.set_xlabel('Altitude (thousands of km)', fontsize=13)
    ax1.set_ylabel('Radiation Intensity (counts/sec)', fontsize=13)
    ax1.set_title('Pioneer 3 Discovery: Dual Van Allen Radiation Belts\n'
                  'December 6, 1958 — Dr. James Van Allen', fontsize=15, fontweight='bold')
    ax1.legend(loc='upper right', fontsize=10)
    ax1.set_facecolor('#0a0a2e')
    fig1.set_facecolor('#0a0a2e')
    ax1.tick_params(colors='white')
    ax1.xaxis.label.set_color('white')
    ax1.yaxis.label.set_color('white')
    ax1.title.set_color('white')
    for spine in ax1.spines.values():
        spine.set_color('white')
    ax1.legend(facecolor='#1a1a3e', edgecolor='white', labelcolor='white', fontsize=10)
    ax1.set_xlim(0, 50)
    ax1.set_ylim(1, 20_000)
    ax1.grid(True, alpha=0.2, color='white')

    plt.tight_layout()
    plt.savefig('dual-belt-profile-discovery.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: dual-belt-profile-discovery.png")

    # =====================================================================
    # Plot 2: Pioneer 3 Trajectory Overlaid with Radiation Profile
    # =====================================================================
    t_hours = np.linspace(0, FLIGHT_TIME_HR, 5000)
    alt_km = pioneer3_trajectory(t_hours)
    traj_intensity = radiation_profile(alt_km)

    fig2, (ax2a, ax2b) = plt.subplots(2, 1, figsize=(14, 10), sharex=True)

    # Top: Altitude vs time
    ax2a.plot(t_hours, alt_km / 1000, 'w-', linewidth=2)
    ax2a.axhline(y=INNER_PEAK_KM / 1000, color='red', linestyle=':', alpha=0.5,
                 label=f'Inner belt peak ({INNER_PEAK_KM:,} km)')
    ax2a.axhline(y=OUTER_PEAK_KM / 1000, color='cyan', linestyle=':', alpha=0.5,
                 label=f'Outer belt peak ({OUTER_PEAK_KM:,} km)')
    ax2a.fill_between(t_hours, 7, 10, alpha=0.15, color='gray', label='Slot region')
    ax2a.set_ylabel('Altitude (thousands of km)', fontsize=12, color='white')
    ax2a.set_title('Pioneer 3 Flight Profile with Radiation Belts\n'
                   '38-hour ballistic arc to 102,322 km',
                   fontsize=14, fontweight='bold', color='white')
    ax2a.legend(loc='upper right', facecolor='#1a1a3e', edgecolor='white',
                labelcolor='white', fontsize=9)
    ax2a.set_facecolor('#0a0a2e')
    ax2a.tick_params(colors='white')
    for spine in ax2a.spines.values():
        spine.set_color('white')
    ax2a.grid(True, alpha=0.2, color='white')

    # Bottom: Radiation intensity vs time
    ax2b.semilogy(t_hours, traj_intensity, 'lime', linewidth=1.5, label='True rate')
    ax2b.set_xlabel('Time since launch (hours)', fontsize=12, color='white')
    ax2b.set_ylabel('Radiation (counts/sec)', fontsize=12, color='white')
    ax2b.set_facecolor('#0a0a2e')
    ax2b.tick_params(colors='white')
    for spine in ax2b.spines.values():
        spine.set_color('white')
    ax2b.grid(True, alpha=0.2, color='white')
    ax2b.legend(loc='upper right', facecolor='#1a1a3e', edgecolor='white',
                labelcolor='white', fontsize=9)

    # Mark the four belt transits (up through inner, up through outer,
    # down through outer, down through inner)
    for label, t_approx in [('Inner (ascent)', 3), ('Outer (ascent)', 10),
                             ('Outer (descent)', 28), ('Inner (descent)', 35)]:
        ax2b.axvline(x=t_approx, color='yellow', linestyle='--', alpha=0.3)
        ax2b.text(t_approx, 15000, label, rotation=90, fontsize=8,
                  color='yellow', alpha=0.6, va='top')

    fig2.set_facecolor('#0a0a2e')
    plt.tight_layout()
    plt.savefig('dual-belt-trajectory.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: dual-belt-trajectory.png")

    # =====================================================================
    # Plot 3: What the GM Tubes Actually Measured (Poisson-sampled)
    # =====================================================================
    # Sample at realistic intervals (every ~30 seconds along trajectory)
    t_sample = np.arange(0, FLIGHT_TIME_HR, 30.0 / 3600.0)  # every 30s
    alt_sample = pioneer3_trajectory(t_sample)
    true_rate_sample = radiation_profile(alt_sample)

    # Poisson-sample the measurements
    measured_rate = simulate_gm_counts(true_rate_sample, INTEGRATION_TIME_S, rng)

    fig3, ax3 = plt.subplots(figsize=(14, 7))
    ax3.semilogy(t_sample, true_rate_sample, 'lime', linewidth=1.5, alpha=0.7,
                 label='True radiation profile')
    ax3.semilogy(t_sample, np.maximum(measured_rate, 0.5), 'w.', markersize=1.5,
                 alpha=0.5, label='GM tube measurements (Poisson noise)')

    ax3.set_xlabel('Time since launch (hours)', fontsize=12, color='white')
    ax3.set_ylabel('Count rate (counts/sec)', fontsize=12, color='white')
    ax3.set_title('Pioneer 3 GM Tube Measurements — Poisson Counting Statistics\n'
                  f'Integration time: {INTEGRATION_TIME_S}s | '
                  f'Samples: {len(t_sample):,} over {FLIGHT_TIME_HR:.0f} hours',
                  fontsize=14, fontweight='bold', color='white')
    ax3.set_facecolor('#0a0a2e')
    fig3.set_facecolor('#0a0a2e')
    ax3.tick_params(colors='white')
    for spine in ax3.spines.values():
        spine.set_color('white')
    ax3.legend(facecolor='#1a1a3e', edgecolor='white', labelcolor='white', fontsize=10)
    ax3.grid(True, alpha=0.2, color='white')

    # Annotate the dual-peak structure visibility
    ax3.annotate('Inner belt\n(clearly visible\neven with noise)',
                 xy=(3, 8000), fontsize=10, color='red',
                 ha='center', fontweight='bold')
    ax3.annotate('Outer belt\n(visible but noisier)',
                 xy=(10, 3000), fontsize=10, color='cyan',
                 ha='center', fontweight='bold')
    ax3.annotate('Slot region\n(the dip that\nproves dual belts)',
                 xy=(6, 20), fontsize=10, color='yellow',
                 ha='center', fontweight='bold')

    plt.tight_layout()
    plt.savefig('dual-belt-gm-measurements.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: dual-belt-gm-measurements.png")

    # =====================================================================
    # Print numerical summary
    # =====================================================================
    print("\n" + "=" * 60)
    print(" Pioneer 3 — Dual Van Allen Belt Discovery")
    print("=" * 60)
    print(f" Launch:         December 6, 1958 (Juno II)")
    print(f" Max altitude:   {MAX_ALT_KM:,} km")
    print(f" Flight time:    {FLIGHT_TIME_HR:.0f} hours")
    print(f"")
    print(f" Inner belt peak:  {INNER_PEAK_KM:,} km ({INNER_IMAX:,} counts/sec)")
    print(f" Outer belt peak:  {OUTER_PEAK_KM:,} km ({OUTER_IMAX:,} counts/sec)")
    print(f" Slot region:      7,000-10,000 km")
    print(f" Background:       {BACKGROUND} counts/sec")
    print(f"")
    print(f" Peak radiation at trajectory apex:")
    apex_intensity = radiation_profile(MAX_ALT_KM)
    print(f"   {apex_intensity:.1f} counts/sec at {MAX_ALT_KM:,} km")
    print(f"")
    print(f" Inner belt transit time (ascent):  ~4 hours")
    print(f" Outer belt transit time (ascent):  ~8 hours")
    print(f" Time in slot region (ascent):      ~3 hours")
    print(f"")
    print(f" Pioneer 3 passed through each belt TWICE (up and down),")
    print(f" giving Van Allen four independent measurements of the")
    print(f" radiation profile — confirming the dual-belt structure.")
    print("=" * 60)

    plt.show()


if __name__ == '__main__':
    main()
