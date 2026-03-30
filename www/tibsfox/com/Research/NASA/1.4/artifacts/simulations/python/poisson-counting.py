#!/usr/bin/env python3
"""
Pioneer 3 — Geiger-Mueller Counting Statistics Demo
====================================================
Mission 1.4: Pioneer 3 (Juno II), December 6, 1958

Geiger-Mueller tubes count individual radiation events. Each count is
a random (Poisson) process. The quality of the measurement depends on:

  1. True radiation rate (higher rate = more counts = better statistics)
  2. Integration time (longer counting window = more counts per bin)
  3. Dead time (tube recovery period after each count, causes saturation)

This script demonstrates how integration time affects measurement
quality as Pioneer 3 traversed the dual Van Allen belts. It shows
why Van Allen's 1-second integration time was sufficient to detect
the dual-peak structure, but also why the inner belt appeared to
DECREASE in intensity — the tubes were saturating (dead-time losses).

Requires: numpy, matplotlib
Run: python3 poisson-counting.py
"""

import numpy as np
import matplotlib.pyplot as plt

# =========================================================================
# Parameters
# =========================================================================

# Dual Van Allen belt profile (same model as dual-belt-profile.py)
INNER_PEAK_KM = 3_500
INNER_SIGMA_KM = 1_500
INNER_IMAX = 10_000    # counts/sec

OUTER_PEAK_KM = 16_000
OUTER_SIGMA_KM = 5_000
OUTER_IMAX = 5_000     # counts/sec

BACKGROUND = 5          # counts/sec

# GM tube dead time (typical: 100-200 microseconds)
DEAD_TIME_S = 100e-6    # 100 microseconds

# Pioneer 3 parameters
MAX_ALT_KM = 102_322
FLIGHT_TIME_HR = 38.0

# Integration times to compare
INTEGRATION_TIMES = [0.1, 1.0, 10.0]  # seconds


def true_radiation_profile(alt_km):
    """Dual-Gaussian Van Allen belt model."""
    alt = np.asarray(alt_km, dtype=float)
    inner = INNER_IMAX * np.exp(-0.5 * ((alt - INNER_PEAK_KM) / INNER_SIGMA_KM) ** 2)
    outer = OUTER_IMAX * np.exp(-0.5 * ((alt - OUTER_PEAK_KM) / OUTER_SIGMA_KM) ** 2)
    return inner + outer + BACKGROUND


def dead_time_correction(true_rate, dead_time=DEAD_TIME_S):
    """
    Apply GM tube dead-time (paralyzable model).

    The measured rate is always LESS than the true rate because the
    tube can't detect a new event while recovering from the previous one.

    For a paralyzable (Type II) detector:
        m = n * exp(-n * tau)
    where m = measured rate, n = true rate, tau = dead time

    At very high rates, the measured rate actually DECREASES — this is
    exactly what happened with Pioneer 1 and 3 in the inner belt.
    Van Allen initially thought the counters had failed!
    """
    n = np.asarray(true_rate, dtype=float)
    return n * np.exp(-n * dead_time)


def poisson_sample(true_rate, integration_time, rng):
    """Poisson-sample counts and return measured rate."""
    expected = np.maximum(true_rate * integration_time, 0)
    counts = rng.poisson(expected)
    return counts / integration_time


def main():
    rng = np.random.default_rng(1958)

    # =====================================================================
    # Generate altitude profile along trajectory
    # =====================================================================
    # Dense sampling for "true" profile
    alt_dense = np.linspace(0, 50_000, 5000)
    rate_dense = true_radiation_profile(alt_dense)

    # =====================================================================
    # Plot 1: Effect of Integration Time on Measurement Quality
    # =====================================================================
    fig1, axes = plt.subplots(len(INTEGRATION_TIMES) + 1, 1,
                              figsize=(14, 14), sharex=True)

    # Top panel: true profile
    axes[0].semilogy(alt_dense / 1000, rate_dense, 'lime', linewidth=2)
    axes[0].set_ylabel('Rate\n(counts/s)', fontsize=10, color='white')
    axes[0].set_title('Effect of Integration Time on Van Allen Belt Measurement\n'
                      'Pioneer 3 GM Tube Counting Statistics',
                      fontsize=14, fontweight='bold', color='white')
    axes[0].text(0.02, 0.85, 'TRUE PROFILE\n(no noise)', transform=axes[0].transAxes,
                 fontsize=11, color='lime', fontweight='bold', va='top')
    axes[0].set_facecolor('#0a0a2e')
    axes[0].tick_params(colors='white')
    for spine in axes[0].spines.values():
        spine.set_color('white')
    axes[0].grid(True, alpha=0.2, color='white')
    axes[0].set_ylim(1, 20_000)

    # Panels for each integration time
    colors = ['#ff6b6b', '#ffd93d', '#6bcb77']
    for i, (dt, color) in enumerate(zip(INTEGRATION_TIMES, colors)):
        ax = axes[i + 1]

        # Sample at intervals matching integration time
        # (can't measure faster than your integration window)
        n_samples = int(50_000 / (dt * 50))  # rough: 50 km/s effective sweep
        n_samples = max(200, min(n_samples, 5000))
        alt_sampled = np.linspace(100, 49_900, n_samples)
        true_rate = true_radiation_profile(alt_sampled)
        measured = poisson_sample(true_rate, dt, rng)

        # Relative error
        with np.errstate(divide='ignore', invalid='ignore'):
            rel_error = np.where(true_rate > 1,
                                 np.abs(measured - true_rate) / true_rate * 100,
                                 0)
        mean_error = np.mean(rel_error[true_rate > 10])

        ax.semilogy(alt_dense / 1000, rate_dense, 'lime', linewidth=1, alpha=0.3)
        ax.semilogy(alt_sampled / 1000, np.maximum(measured, 0.5),
                    '.', color=color, markersize=3, alpha=0.7)
        ax.set_ylabel('Rate\n(counts/s)', fontsize=10, color='white')
        ax.text(0.02, 0.85,
                f'Integration: {dt}s\n{n_samples} samples\n'
                f'Mean error: {mean_error:.1f}%',
                transform=ax.transAxes, fontsize=10, color=color,
                fontweight='bold', va='top',
                bbox=dict(boxstyle='round', facecolor='#0a0a2e', edgecolor=color, alpha=0.8))
        ax.set_facecolor('#0a0a2e')
        ax.tick_params(colors='white')
        for spine in ax.spines.values():
            spine.set_color('white')
        ax.grid(True, alpha=0.2, color='white')
        ax.set_ylim(1, 20_000)

    axes[-1].set_xlabel('Altitude (thousands of km)', fontsize=12, color='white')
    fig1.set_facecolor('#0a0a2e')
    plt.tight_layout()
    plt.savefig('poisson-integration-comparison.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: poisson-integration-comparison.png")

    # =====================================================================
    # Plot 2: Dead-Time Saturation Effect
    # =====================================================================
    # This is the KEY insight: at very high count rates, a paralyzable
    # GM tube's measured rate DROPS. Van Allen thought his counters had
    # failed in the inner belt — the rate was SO high that dead-time
    # losses made the measured rate decrease.

    fig2, (ax2a, ax2b) = plt.subplots(1, 2, figsize=(14, 7))

    # Left: measured vs true rate curve
    true_rates = np.logspace(0, 5, 1000)  # 1 to 100,000 counts/sec
    measured_rates = dead_time_correction(true_rates, DEAD_TIME_S)

    ax2a.loglog(true_rates, true_rates, 'w--', linewidth=1, alpha=0.5,
                label='Ideal (no dead time)')
    ax2a.loglog(true_rates, measured_rates, 'lime', linewidth=2.5,
                label=f'Paralyzable detector (τ={DEAD_TIME_S*1e6:.0f} μs)')

    # Mark the rollover point (maximum measured rate)
    max_measured = 1 / (DEAD_TIME_S * np.e)
    true_at_max = 1 / DEAD_TIME_S
    ax2a.plot(true_at_max, max_measured, 'ro', markersize=12, zorder=5)
    ax2a.annotate(f'Saturation!\n{max_measured:.0f} counts/sec\n'
                  f'(true: {true_at_max:.0f})',
                  xy=(true_at_max, max_measured),
                  xytext=(true_at_max * 3, max_measured * 0.3),
                  fontsize=10, color='red', fontweight='bold',
                  arrowprops=dict(arrowstyle='->', color='red', lw=2))

    # Mark Pioneer 3 inner belt rate
    ax2a.axvline(x=INNER_IMAX, color='red', linestyle=':', alpha=0.5)
    ax2a.text(INNER_IMAX * 1.2, 10, f'Inner belt\n({INNER_IMAX:,}/sec)',
              fontsize=9, color='red')

    ax2a.set_xlabel('True Count Rate (counts/sec)', fontsize=12, color='white')
    ax2a.set_ylabel('Measured Count Rate (counts/sec)', fontsize=12, color='white')
    ax2a.set_title('GM Tube Dead-Time Saturation\n'
                   'Why Van Allen Thought His Counters Failed',
                   fontsize=13, fontweight='bold', color='white')
    ax2a.legend(facecolor='#1a1a3e', edgecolor='white', labelcolor='white', fontsize=10)
    ax2a.set_facecolor('#0a0a2e')
    ax2a.tick_params(colors='white')
    for spine in ax2a.spines.values():
        spine.set_color('white')
    ax2a.grid(True, alpha=0.2, color='white')

    # Right: what Pioneer 3 would measure with dead-time effects
    alt_sweep = np.linspace(0, 50_000, 2000)
    true_profile = true_radiation_profile(alt_sweep)
    measured_profile = dead_time_correction(true_profile, DEAD_TIME_S)

    ax2b.semilogy(alt_sweep / 1000, true_profile, 'lime', linewidth=2,
                  label='True radiation', alpha=0.7)
    ax2b.semilogy(alt_sweep / 1000, measured_profile, 'r-', linewidth=2,
                  label='What GM tube reports', alpha=0.9)

    ax2b.fill_between(alt_sweep / 1000, measured_profile, true_profile,
                      alpha=0.2, color='red', label='Lost counts (dead time)')

    ax2b.set_xlabel('Altitude (thousands of km)', fontsize=12, color='white')
    ax2b.set_ylabel('Count Rate (counts/sec)', fontsize=12, color='white')
    ax2b.set_title('Radiation Profile: True vs Measured\n'
                   'Dead-time losses distort the inner belt peak',
                   fontsize=13, fontweight='bold', color='white')
    ax2b.legend(facecolor='#1a1a3e', edgecolor='white', labelcolor='white', fontsize=10)
    ax2b.set_facecolor('#0a0a2e')
    ax2b.tick_params(colors='white')
    for spine in ax2b.spines.values():
        spine.set_color('white')
    ax2b.grid(True, alpha=0.2, color='white')
    ax2b.set_xlim(0, 50)

    fig2.set_facecolor('#0a0a2e')
    plt.tight_layout()
    plt.savefig('poisson-dead-time-saturation.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: poisson-dead-time-saturation.png")

    # =====================================================================
    # Plot 3: Poisson Statistics Fundamentals
    # =====================================================================
    fig3, axes3 = plt.subplots(2, 3, figsize=(16, 10))

    # Show Poisson distributions at different rates
    rates = [5, 50, 500, 2000, 5000, 10000]

    for ax, rate in zip(axes3.flat, rates):
        # For display, use 1-second integration
        expected = rate * 1.0

        if expected < 50:
            k = np.arange(0, int(expected * 3) + 1)
            pmf = poisson.pmf(k, expected)
            ax.bar(k, pmf, color='lime', alpha=0.7, edgecolor='white', linewidth=0.5)
        else:
            # Use normal approximation for display
            x = np.linspace(expected - 4 * np.sqrt(expected),
                            expected + 4 * np.sqrt(expected), 200)
            pdf = (1 / np.sqrt(2 * np.pi * expected)) * \
                  np.exp(-0.5 * ((x - expected) / np.sqrt(expected)) ** 2)
            ax.fill_between(x, pdf, color='lime', alpha=0.5)
            ax.plot(x, pdf, 'lime', linewidth=2)

        # Relative uncertainty
        rel_unc = 100 / np.sqrt(expected) if expected > 0 else 100

        ax.set_title(f'{rate:,} counts/sec\n'
                     f'σ/μ = {rel_unc:.1f}%',
                     fontsize=11, color='white', fontweight='bold')
        ax.set_facecolor('#0a0a2e')
        ax.tick_params(colors='white', labelsize=8)
        for spine in ax.spines.values():
            spine.set_color('white')

    fig3.suptitle('Poisson Counting Statistics at Different Radiation Rates\n'
                  '1-second integration | Higher rate → better precision',
                  fontsize=14, fontweight='bold', color='white', y=1.02)
    fig3.set_facecolor('#0a0a2e')
    plt.tight_layout()
    plt.savefig('poisson-statistics-fundamentals.png', dpi=150,
                facecolor='#0a0a2e', bbox_inches='tight')
    print("Saved: poisson-statistics-fundamentals.png")

    # =====================================================================
    # Numerical Summary
    # =====================================================================
    print("\n" + "=" * 60)
    print(" Poisson Counting Statistics — Pioneer 3 GM Tubes")
    print("=" * 60)
    print(f"")
    print(f" Pioneer 3 actual integration time: ~1 second")
    print(f" GM tube dead time: ~{DEAD_TIME_S*1e6:.0f} microseconds")
    print(f"")
    print(f" At key altitudes (1-second integration):")
    for label, alt in [("Background (space)", 50_000),
                       ("Outer belt peak", OUTER_PEAK_KM),
                       ("Slot region", 8_500),
                       ("Inner belt peak", INNER_PEAK_KM),
                       ("Low altitude", 500)]:
        true_r = true_radiation_profile(alt)
        meas_r = dead_time_correction(true_r, DEAD_TIME_S)
        sigma = np.sqrt(true_r)
        rel_err = 100 / np.sqrt(true_r) if true_r > 0 else 0
        print(f"   {label:25s}: {true_r:8.0f} counts/sec "
              f"(σ={sigma:6.0f}, {rel_err:5.1f}% uncertainty, "
              f"measured={meas_r:8.0f})")
    print(f"")
    print(f" Maximum measurable rate (paralyzable detector):")
    print(f"   m_max = 1/(τ·e) = {1/(DEAD_TIME_S * np.e):.0f} counts/sec")
    print(f"   This occurs at true rate = 1/τ = {1/DEAD_TIME_S:.0f} counts/sec")
    print(f"")
    print(f" Key insight: at {INNER_IMAX:,} counts/sec (inner belt peak),")
    meas_inner = dead_time_correction(INNER_IMAX, DEAD_TIME_S)
    loss_pct = (1 - meas_inner / INNER_IMAX) * 100
    print(f"   the tube measures only {meas_inner:.0f} counts/sec "
          f"({loss_pct:.1f}% dead-time loss).")
    print(f"   Van Allen had to correct for this effect to reveal")
    print(f"   the true dual-belt structure.")
    print("=" * 60)

    plt.show()


if __name__ == '__main__':
    main()
