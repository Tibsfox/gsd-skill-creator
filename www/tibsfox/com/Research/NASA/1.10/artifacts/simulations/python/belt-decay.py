#!/usr/bin/env python3
"""
Explorer 4 — Artificial Radiation Belt Decay After Project Argus
=================================================================
Mission 1.10: Explorer 4 (Juno I / ABMA), July 26, 1958
PROJECT ARGUS — Three Nuclear Detonations in Space

Models the creation and decay of artificial radiation belts produced by
the three Argus nuclear detonations (Aug 27, Aug 30, Sep 6, 1958).

Electrons from each detonation are injected into the radiation belt region.
They decay through:
  1. Atmospheric loss (particles in the loss cone hit the atmosphere)
  2. Pitch-angle scattering (wave-particle interactions scatter particles
     into the loss cone over time)
  3. Coulomb scattering (collisions with thermal plasma)

The characteristic decay time depends on injection altitude:
  - Argus I (200 km): fast decay, ~days
  - Argus II (240 km): slightly slower, ~days-week
  - Argus III (540 km): slowest, ~weeks

Explorer 4's scintillation counters measured the rise and fall of
particle counts as it orbited through the artificial belts.

Requires: numpy, matplotlib
Run: python3 belt-decay.py
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.dates import DateFormatter
from datetime import datetime, timedelta

# =========================================================================
# Argus detonation parameters
# =========================================================================
ARGUS_TESTS = [
    {
        'name': 'Argus I',
        'date': datetime(1958, 8, 27, 2, 28),  # UTC
        'altitude_km': 200,
        'yield_kt': 1.7,
        'L_shell': 1.7,
        'initial_flux': 1.0e8,       # electrons/cm^2/s (estimated peak)
        'decay_time_days': 3.0,      # e-folding time
        'color': '#FF6B6B',
    },
    {
        'name': 'Argus II',
        'date': datetime(1958, 8, 30, 3, 18),
        'altitude_km': 240,
        'yield_kt': 1.7,
        'L_shell': 1.8,
        'initial_flux': 1.2e8,
        'decay_time_days': 5.0,
        'color': '#FFB347',
    },
    {
        'name': 'Argus III',
        'date': datetime(1958, 9, 6, 22, 13),
        'altitude_km': 540,
        'yield_kt': 1.7,
        'L_shell': 2.0,
        'initial_flux': 1.5e8,
        'decay_time_days': 14.0,     # higher altitude = slower decay
        'color': '#40FF80',
    },
]

# Explorer 4 orbit parameters
EXPLORER4_LAUNCH = datetime(1958, 7, 26)
EXPLORER4_PERIOD_MIN = 110.4        # Orbital period (minutes)
EXPLORER4_PERIGEE_KM = 263
EXPLORER4_APOGEE_KM = 2210
EXPLORER4_INCLINATION_DEG = 50.3

# Natural Van Allen belt background
NATURAL_BACKGROUND = 1.0e4  # electrons/cm^2/s (natural inner belt)


def belt_intensity(t_hours, test):
    """
    Compute artificial belt intensity at time t_hours after detonation.

    Uses exponential decay with an initial rise phase.

    Parameters
    ----------
    t_hours : array
        Hours after detonation
    test : dict
        Argus test parameters

    Returns
    -------
    flux : array
        Electron flux (electrons/cm^2/s)
    """
    # Rise phase: belt forms in ~1 hour as electrons drift around Earth
    rise_time = 1.0  # hours
    rise = 1.0 - np.exp(-t_hours / rise_time)

    # Decay: exponential with e-folding time
    decay = np.exp(-t_hours / (test['decay_time_days'] * 24.0))

    # Combined
    flux = test['initial_flux'] * rise * decay

    # Only positive times
    flux[t_hours < 0] = 0.0

    return flux


def explorer4_sampling(start_time, end_time, orbit_period_min):
    """
    Simulate Explorer 4's sampling: it only measures the belt when
    its orbit passes through the belt region. This creates periodic
    sampling gaps.

    Returns times when Explorer 4 is in the belt region.
    """
    dt_hours = orbit_period_min / 60.0
    # Approximate: satellite is in belt region for ~20% of each orbit
    belt_fraction = 0.20
    belt_duration = dt_hours * belt_fraction

    times = []
    t = 0
    total_hours = (end_time - start_time).total_seconds() / 3600
    while t < total_hours:
        # Belt passage window
        for dt in np.linspace(0, belt_duration, 5):
            times.append(t + dt)
        t += dt_hours

    return np.array(times)


def plot_belt_decay():
    """Generate the complete belt decay visualization."""
    fig, axes = plt.subplots(3, 1, figsize=(14, 12), sharex=True)
    fig.suptitle(
        'Project Argus — Artificial Radiation Belt Creation and Decay\n'
        'Explorer 4 Scintillation Counter Measurements',
        fontsize=14, fontweight='bold'
    )

    # Time axis: July 26 to October 15, 1958
    t_start = datetime(1958, 7, 26)
    t_end = datetime(1958, 10, 15)
    hours_total = (t_end - t_start).total_seconds() / 3600
    t_hours = np.linspace(0, hours_total, 5000)
    t_dates = [t_start + timedelta(hours=h) for h in t_hours]

    # =============================================
    # Panel 1: Individual belt intensities
    # =============================================
    ax1 = axes[0]
    ax1.set_facecolor('#050510')

    for test in ARGUS_TESTS:
        hours_after_det = np.array([
            (t_start + timedelta(hours=h) - test['date']).total_seconds() / 3600
            for h in t_hours
        ])
        flux = belt_intensity(hours_after_det, test)
        ax1.semilogy(t_dates, flux, color=test['color'], linewidth=1.5,
                     label=f"{test['name']} ({test['altitude_km']} km, "
                           f"tau={test['decay_time_days']}d)")
        # Mark detonation time
        ax1.axvline(x=test['date'], color=test['color'], linestyle='--',
                    alpha=0.5, linewidth=0.8)

    ax1.axhline(y=NATURAL_BACKGROUND, color='#888888', linestyle=':',
                alpha=0.5, label='Natural background')
    ax1.set_ylabel('Electron flux\n(electrons/cm²/s)')
    ax1.set_title('Individual Artificial Belt Intensities')
    ax1.legend(fontsize=8, loc='upper right')
    ax1.set_ylim(1e2, 5e8)
    ax1.grid(True, alpha=0.1)

    # =============================================
    # Panel 2: Combined intensity (what Explorer 4 measures)
    # =============================================
    ax2 = axes[1]
    ax2.set_facecolor('#050510')

    total_flux = np.full_like(t_hours, NATURAL_BACKGROUND)
    for test in ARGUS_TESTS:
        hours_after_det = np.array([
            (t_start + timedelta(hours=h) - test['date']).total_seconds() / 3600
            for h in t_hours
        ])
        total_flux += belt_intensity(hours_after_det, test)

    ax2.semilogy(t_dates, total_flux, color='#40FF80', linewidth=1.5,
                 label='Total belt intensity')
    ax2.axhline(y=NATURAL_BACKGROUND, color='#888888', linestyle=':',
                alpha=0.5, label='Natural background')

    # Mark detonation times
    for test in ARGUS_TESTS:
        ax2.axvline(x=test['date'], color=test['color'], linestyle='--',
                    alpha=0.5, linewidth=0.8)
        ax2.annotate(test['name'], xy=(test['date'], 3e8),
                     fontsize=7, color=test['color'], ha='center')

    ax2.set_ylabel('Total electron flux\n(electrons/cm²/s)')
    ax2.set_title('Combined Belt Intensity — Explorer 4 Measurement Region')
    ax2.legend(fontsize=8, loc='upper right')
    ax2.set_ylim(1e3, 5e8)
    ax2.grid(True, alpha=0.1)

    # =============================================
    # Panel 3: Simulated Explorer 4 count rate
    # =============================================
    ax3 = axes[2]
    ax3.set_facecolor('#050510')

    # Sample at orbit passages
    sample_hours = explorer4_sampling(t_start, t_end, EXPLORER4_PERIOD_MIN)
    sample_dates = [t_start + timedelta(hours=h) for h in sample_hours]

    # Interpolate total flux at sample times
    sample_flux = np.interp(sample_hours, t_hours, total_flux)

    # Add counting statistics (Poisson noise)
    # Scintillation counter: ~1 count per 100 electrons/cm^2/s
    counting_efficiency = 0.01
    expected_counts = sample_flux * counting_efficiency
    measured_counts = np.random.poisson(np.maximum(expected_counts, 1).astype(int))

    ax3.semilogy(sample_dates, measured_counts, '.', color='#D4A830',
                 markersize=2, alpha=0.6, label='Scintillation counter readings')

    # Smoothed trend
    window = 50
    if len(measured_counts) > window:
        smoothed = np.convolve(measured_counts,
                               np.ones(window) / window, mode='same')
        ax3.semilogy(sample_dates, smoothed, color='#40FF80', linewidth=1.5,
                     alpha=0.8, label=f'Smoothed ({window}-point)')

    # Mark detonation times
    for test in ARGUS_TESTS:
        ax3.axvline(x=test['date'], color=test['color'], linestyle='--',
                    alpha=0.5, linewidth=0.8)

    ax3.set_ylabel('Count rate\n(counts/s)')
    ax3.set_title('Simulated Explorer 4 Scintillation Counter Data')
    ax3.legend(fontsize=8, loc='upper right')
    ax3.set_xlabel('Date (1958)')
    ax3.grid(True, alpha=0.1)

    # Format x-axis dates
    for ax in axes:
        ax.xaxis.set_major_formatter(DateFormatter('%b %d'))
        ax.tick_params(axis='x', rotation=30)

    plt.tight_layout()
    plt.savefig('belt-decay.png', dpi=150, bbox_inches='tight',
                facecolor='#0a0a1e')
    print('Saved: belt-decay.png')

    # Print summary
    print('\nProject Argus — Belt Decay Summary')
    print('=' * 50)
    for test in ARGUS_TESTS:
        half_life = test['decay_time_days'] * np.log(2)
        time_to_background = -test['decay_time_days'] * np.log(
            NATURAL_BACKGROUND / test['initial_flux']) / 1.0
        print(f"\n{test['name']}:")
        print(f"  Detonation:    {test['date'].strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"  Altitude:      {test['altitude_km']} km")
        print(f"  L-shell:       {test['L_shell']}")
        print(f"  Peak flux:     {test['initial_flux']:.1e} e/cm²/s")
        print(f"  e-fold time:   {test['decay_time_days']:.1f} days")
        print(f"  Half-life:     {half_life:.1f} days")
        print(f"  Time to bg:    {time_to_background:.1f} days")

    print(f'\nExplorer 4 orbit:')
    print(f'  Period:        {EXPLORER4_PERIOD_MIN:.1f} min')
    print(f'  Perigee:       {EXPLORER4_PERIGEE_KM} km')
    print(f'  Apogee:        {EXPLORER4_APOGEE_KM} km')
    print(f'  Inclination:   {EXPLORER4_INCLINATION_DEG}°')

    plt.show()


if __name__ == '__main__':
    plot_belt_decay()
