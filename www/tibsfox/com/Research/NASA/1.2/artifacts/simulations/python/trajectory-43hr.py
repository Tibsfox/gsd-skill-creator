#!/usr/bin/env python3
"""
Pioneer 1 — 43-Hour Trajectory and Van Allen Radiation Profile
==============================================================
Mission 1.2, NASA Mission Series
Launch: October 11, 1958, 08:42 UTC, Cape Canaveral LC-17A
Apogee: 113,854 km after ~18 hours
Reentry: South Pacific after 43 hours 17 minutes

This script simulates Pioneer 1's complete ballistic arc using real
orbital mechanics (vis-viva equation, Keplerian motion) and overlays
the Van Allen radiation belt profile discovered during the mission.

The AJ10-40 second stage cut off 10 seconds early due to an accelerometer
error, leaving the spacecraft 234 m/s short of escape velocity.

Usage: python3 trajectory-43hr.py
Output: pioneer1_altitude.png, pioneer1_radiation.png, pioneer1_combined.png
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
from scipy.integrate import solve_ivp

# ===========================================================================
# Physical constants and mission parameters
# ===========================================================================

R_EARTH = 6_371_000          # Earth radius (m)
MU_EARTH = 3.986004418e14    # Earth gravitational parameter (m^3/s^2)
G0 = 9.80665                 # Standard gravity (m/s^2)

# Pioneer 1 mission parameters (from research.md)
BURNOUT_ALT = 200_000        # Burnout altitude (m) — after 3rd stage
BURNOUT_R = R_EARTH + BURNOUT_ALT
APOGEE_ALT = 113_854_000     # Observed apogee (m)
APOGEE_R = R_EARTH + APOGEE_ALT
MISSION_DURATION = 43 * 3600 + 17 * 60  # 43 hours 17 minutes (s)
SPACECRAFT_MASS = 34.2       # kg

# Three-stage launch vehicle parameters
# Stage 1: Thor DM-18 with Rocketdyne LR-79
THOR_THRUST = 667_000        # N
THOR_ISP = 282               # s (sea level)
THOR_BURN_TIME = 160         # s
THOR_PROP_MASS = 44_000      # kg (approximate)

# Stage 2: Aerojet AJ10-40 (INTENDED 120s, ACTUAL ~110s)
AJ10_THRUST = 34_250         # N
AJ10_ISP = 270               # s (vacuum)
AJ10_INTENDED_BURN = 120     # s
AJ10_ACTUAL_BURN = 110       # s (10 seconds early — accelerometer error)
VELOCITY_SHORTFALL = 234     # m/s

# Stage 3: ABL X-248 solid motor
X248_THRUST = 15_600         # N
X248_ISP = 235               # s
X248_BURN_TIME = 20          # s

# Transmitter
TX_FREQ = 108.06e6           # Hz
TX_POWER = 0.300             # W

# ===========================================================================
# Orbital mechanics: compute the ballistic trajectory
# ===========================================================================

def compute_orbital_elements():
    """
    Derive orbital elements from burnout conditions.

    Pioneer 1 was on a near-escape trajectory. We use the vis-viva equation
    and the observed apogee to back-calculate the burnout velocity.

    Vis-viva: v^2 = mu * (2/r - 1/a)
    For an ellipse: a = (r_perigee + r_apogee) / 2
    """
    # Semi-major axis from perigee (burnout) and apogee
    r_perigee = BURNOUT_R
    r_apogee = APOGEE_R
    a = (r_perigee + r_apogee) / 2

    # Eccentricity
    e = (r_apogee - r_perigee) / (r_apogee + r_perigee)

    # Burnout velocity (vis-viva at perigee)
    v_burnout = np.sqrt(MU_EARTH * (2 / r_perigee - 1 / a))

    # Escape velocity at burnout altitude
    v_escape = np.sqrt(2 * MU_EARTH / r_perigee)

    # Orbital period
    T = 2 * np.pi * np.sqrt(a**3 / MU_EARTH)

    # Specific orbital energy
    epsilon = -MU_EARTH / (2 * a)

    # Angular momentum (assuming burnout at perigee, tangential)
    h = r_perigee * v_burnout

    print("=" * 65)
    print("Pioneer 1 — Orbital Elements")
    print("=" * 65)
    print(f"Semi-major axis:     {a/1000:,.1f} km")
    print(f"Eccentricity:        {e:.6f}")
    print(f"Perigee altitude:    {(r_perigee - R_EARTH)/1000:,.1f} km")
    print(f"Apogee altitude:     {(r_apogee - R_EARTH)/1000:,.1f} km")
    print(f"Burnout velocity:    {v_burnout:,.1f} m/s  ({v_burnout/1000:.3f} km/s)")
    print(f"Escape velocity:     {v_escape:,.1f} m/s  ({v_escape/1000:.3f} km/s)")
    print(f"Velocity shortfall:  {v_escape - v_burnout:,.1f} m/s")
    print(f"Orbital period:      {T/3600:,.2f} hours")
    print(f"Specific energy:     {epsilon/1e6:,.3f} MJ/kg")
    print(f"Angular momentum:    {h:,.0f} m^2/s")
    print()

    return a, e, r_perigee, r_apogee, v_burnout, v_escape, T, h


def kepler_equation(M, e, tol=1e-12):
    """Solve Kepler's equation M = E - e*sin(E) using Newton-Raphson."""
    E = M  # initial guess
    for _ in range(100):
        dE = (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
        E -= dE
        if np.abs(dE) < tol:
            break
    return E


def compute_trajectory(a, e, T, num_points=5000):
    """
    Compute altitude vs. time for Pioneer 1's ballistic arc.

    Pioneer 1 launched at perigee and flew roughly half an orbit
    (perigee -> apogee -> back to perigee) in 43 hours.
    The full orbital period is longer, but the spacecraft reentered
    the atmosphere on the descending leg.
    """
    # Time array: 0 to mission duration
    t = np.linspace(0, MISSION_DURATION, num_points)

    # Mean motion
    n = 2 * np.pi / T

    # Mean anomaly (starting from perigee, M=0 at t=0)
    M = n * t

    # Solve Kepler's equation for each time step
    E = np.array([kepler_equation(m, e) for m in M])

    # True anomaly from eccentric anomaly
    theta = 2 * np.arctan2(
        np.sqrt(1 + e) * np.sin(E / 2),
        np.sqrt(1 - e) * np.cos(E / 2)
    )

    # Radius from orbital equation
    r = a * (1 - e * np.cos(E))

    # Altitude above surface
    altitude = r - R_EARTH

    # Velocity (vis-viva)
    v = np.sqrt(MU_EARTH * (2 / r - 1 / a))

    # Time in hours for plotting
    t_hours = t / 3600

    # Find apogee time
    apogee_idx = np.argmax(altitude)
    apogee_time = t_hours[apogee_idx]

    print(f"Computed apogee:     {altitude[apogee_idx]/1000:,.1f} km at T+{apogee_time:.2f} hours")
    print(f"Velocity at apogee:  {v[apogee_idx]:,.1f} m/s")
    print(f"Mission duration:    {t_hours[-1]:.2f} hours")
    print()

    return t_hours, altitude / 1000, v, theta


# ===========================================================================
# Van Allen radiation belt model
# ===========================================================================

def radiation_model(altitude_km):
    """
    Model the Van Allen radiation belts as dual Gaussian profiles.

    Pioneer 1's instruments (Geiger-Mueller tube and ionization chamber)
    measured radiation intensity as a function of altitude. The data revealed:

    - Inner belt: proton-dominated, peak at ~3,500 km, intense
    - Slot region: 7,000-10,000 km, reduced intensity
    - Outer belt: electron-dominated, peak at ~16,000 km, broader

    The inner belt was so intense that Pioneer 1's GM tube saturated
    (count rate exceeded the detector's ability to resolve individual
    pulses). This saturation initially confused the data — the count
    rate DROPPED in the most intense region because the detector
    couldn't keep up.

    Units: arbitrary (normalized to peak = 1000 counts/sec)
    """
    alt = np.asarray(altitude_km, dtype=float)

    # Inner belt: sharp peak at 3,500 km
    inner_peak = 3_500      # km
    inner_sigma = 1_500     # km
    inner_amplitude = 1000  # counts/sec (peak)
    inner = inner_amplitude * np.exp(-0.5 * ((alt - inner_peak) / inner_sigma) ** 2)

    # Outer belt: broader peak at 16,000 km
    outer_peak = 16_000     # km
    outer_sigma = 5_000     # km
    outer_amplitude = 600   # counts/sec (lower peak, but broader)
    outer = outer_amplitude * np.exp(-0.5 * ((alt - outer_peak) / outer_sigma) ** 2)

    # Combined radiation intensity
    total = inner + outer

    # Model detector saturation in the inner belt core
    # GM tube saturates above ~800 counts/sec — dead time causes undercounting
    gm_saturation = 800     # counts/sec
    gm_dead_time = 100e-6   # 100 microsecond dead time (typical for 1958 GM tube)

    # Paralyzable detector model: measured = true * exp(-true * dead_time)
    # For display, show what the detector would actually read
    measured = total * np.exp(-total * gm_dead_time)

    return total, measured, inner, outer


# ===========================================================================
# Three-stage launch sequence delta-v budget
# ===========================================================================

def print_launch_sequence():
    """Print the three-stage launch sequence with delta-v budget."""
    print("=" * 65)
    print("Pioneer 1 — Three-Stage Launch Sequence")
    print("=" * 65)

    # Stage 1: Thor
    dv1 = THOR_ISP * G0 * np.log(
        (THOR_PROP_MASS + 5000 + SPACECRAFT_MASS) / (5000 + SPACECRAFT_MASS)
    )
    print(f"Stage 1 (Thor LR-79):    {THOR_BURN_TIME}s burn, ~{dv1:,.0f} m/s")

    # Stage 2: AJ10-40 (cut off 10s early)
    aj10_prop_rate = AJ10_THRUST / (AJ10_ISP * G0)
    prop_used = aj10_prop_rate * AJ10_ACTUAL_BURN
    prop_intended = aj10_prop_rate * AJ10_INTENDED_BURN
    print(f"Stage 2 (AJ10-40):       {AJ10_ACTUAL_BURN}s burn (intended {AJ10_INTENDED_BURN}s)")
    print(f"  -> Accelerometer error caused premature cutoff")
    print(f"  -> Lost {VELOCITY_SHORTFALL} m/s ({AJ10_INTENDED_BURN - AJ10_ACTUAL_BURN}s of thrust)")

    # Stage 3: X-248
    print(f"Stage 3 (ABL X-248):     {X248_BURN_TIME}s burn (full duration, solid motor)")
    print(f"  -> Fixed impulse, cannot compensate for Stage 2 shortfall")
    print()


# ===========================================================================
# Plotting
# ===========================================================================

def plot_altitude(t_hours, altitude_km):
    """Plot 1: Altitude vs time — the 43-hour arc."""
    fig, ax = plt.subplots(figsize=(14, 7))

    ax.plot(t_hours, altitude_km, color='#2196F3', linewidth=2, label='Pioneer 1 trajectory')

    # Mark key events
    apogee_idx = np.argmax(altitude_km)
    ax.annotate(
        f'APOGEE\n{altitude_km[apogee_idx]:,.0f} km\nT+{t_hours[apogee_idx]:.1f} hr',
        xy=(t_hours[apogee_idx], altitude_km[apogee_idx]),
        xytext=(t_hours[apogee_idx] + 3, altitude_km[apogee_idx] - 10000),
        fontsize=11, fontweight='bold', color='#1565C0',
        arrowprops=dict(arrowstyle='->', color='#1565C0', lw=1.5),
        ha='left'
    )

    # Van Allen belt regions (horizontal bands)
    ax.axhspan(1000, 6000, alpha=0.15, color='orange', label='Inner Van Allen Belt')
    ax.axhspan(10000, 30000, alpha=0.10, color='mediumpurple', label='Outer Van Allen Belt')
    ax.axhspan(6000, 10000, alpha=0.05, color='gray', label='Slot Region')

    # Moon distance reference
    ax.axhline(y=384400, color='silver', linestyle='--', linewidth=1, alpha=0.7)
    ax.text(42, 384400 + 5000, 'Moon (384,400 km)', fontsize=9, color='gray', ha='right')

    # Mark belt transits on ascent
    for alt, label, color in [
        (3500, 'Inner belt peak', 'darkorange'),
        (16000, 'Outer belt peak', 'mediumpurple'),
    ]:
        # Find ascent crossing
        ascent_mask = (t_hours < t_hours[apogee_idx])
        alts_ascent = altitude_km[ascent_mask]
        t_ascent = t_hours[ascent_mask]
        cross_idx = np.argmin(np.abs(alts_ascent - alt))
        ax.plot(t_ascent[cross_idx], alt, 'o', color=color, markersize=8, zorder=5)

    ax.set_xlabel('Time Since Launch (hours)', fontsize=12)
    ax.set_ylabel('Altitude (km)', fontsize=12)
    ax.set_title(
        'Pioneer 1 — 43-Hour Ballistic Arc\n'
        'October 11-13, 1958 | First NASA Mission | 234 m/s Short of Escape',
        fontsize=14, fontweight='bold'
    )
    ax.legend(loc='upper right', fontsize=10)
    ax.set_xlim(0, 44)
    ax.set_ylim(0, 130000)
    ax.grid(True, alpha=0.3)
    ax.tick_params(labelsize=10)

    # Format y-axis with commas
    ax.get_yaxis().set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:,.0f}'))

    fig.tight_layout()
    fig.savefig('pioneer1_altitude.png', dpi=150, bbox_inches='tight')
    print("Saved: pioneer1_altitude.png")
    plt.close(fig)


def plot_radiation(altitude_km_range):
    """Plot 2: Radiation intensity vs altitude — the discovery profile."""
    alt = np.linspace(0, 120000, 5000)
    total, measured, inner, outer = radiation_model(alt)

    fig, ax = plt.subplots(figsize=(14, 7))

    # True radiation (what's actually there)
    ax.plot(alt / 1000, total, color='red', linewidth=1.5, alpha=0.4,
            linestyle='--', label='True intensity')

    # What the GM tube measured (with saturation)
    ax.plot(alt / 1000, measured, color='#4CAF50', linewidth=2.5,
            label='GM tube reading (saturated)')

    # Individual belts
    ax.fill_between(alt / 1000, 0, inner, alpha=0.15, color='orange',
                    label='Inner belt (protons)')
    ax.fill_between(alt / 1000, 0, outer, alpha=0.10, color='mediumpurple',
                    label='Outer belt (electrons)')

    # Saturation annotation
    ax.annotate(
        'DETECTOR SATURATION\nGM tube overwhelmed\nCount rate drops despite\nincreasing radiation',
        xy=(3.5, 500), xytext=(15, 850),
        fontsize=10, fontweight='bold', color='darkred',
        arrowprops=dict(arrowstyle='->', color='darkred', lw=1.5),
        bbox=dict(boxstyle='round,pad=0.5', facecolor='lightyellow', edgecolor='darkred', alpha=0.9)
    )

    # Mark Pioneer 1 apogee
    ax.axvline(x=113.854, color='#2196F3', linestyle=':', linewidth=2, alpha=0.7)
    ax.text(113.854 + 1, 900, 'Pioneer 1\napogee', fontsize=10, color='#1565C0',
            fontweight='bold', va='top')

    # Slot region
    ax.annotate('Slot Region', xy=(8.5, 50), fontsize=11, color='gray',
                fontweight='bold', ha='center')

    ax.set_xlabel('Altitude (thousands of km)', fontsize=12)
    ax.set_ylabel('Count Rate (counts/sec)', fontsize=12)
    ax.set_title(
        'Van Allen Radiation Belts — As Discovered by Pioneer 1\n'
        'First continuous radiation profile from surface to 113,854 km',
        fontsize=14, fontweight='bold'
    )
    ax.legend(loc='upper right', fontsize=10)
    ax.set_xlim(0, 120)
    ax.set_ylim(0, 1100)
    ax.grid(True, alpha=0.3)
    ax.tick_params(labelsize=10)

    fig.tight_layout()
    fig.savefig('pioneer1_radiation.png', dpi=150, bbox_inches='tight')
    print("Saved: pioneer1_radiation.png")
    plt.close(fig)


def plot_combined(t_hours, altitude_km):
    """Plot 3: Combined — radiation along the trajectory over time."""
    # Get radiation at each altitude point along the trajectory
    total_rad, measured_rad, inner_rad, outer_rad = radiation_model(altitude_km)

    fig = plt.figure(figsize=(16, 10))
    gs = GridSpec(3, 1, height_ratios=[2, 1, 1], hspace=0.35)

    # --- Top panel: Altitude ---
    ax1 = fig.add_subplot(gs[0])
    ax1.plot(t_hours, altitude_km, color='#2196F3', linewidth=2)
    ax1.axhspan(1000, 6000, alpha=0.15, color='orange')
    ax1.axhspan(10000, 30000, alpha=0.10, color='mediumpurple')
    ax1.set_ylabel('Altitude (km)', fontsize=11)
    ax1.set_title(
        'Pioneer 1 — Trajectory + Radiation Profile Over 43 Hours\n'
        'October 11-13, 1958 | Van Allen Belt Discovery Flight',
        fontsize=13, fontweight='bold'
    )
    ax1.get_yaxis().set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:,.0f}'))
    ax1.grid(True, alpha=0.3)
    ax1.set_xlim(0, 44)

    apogee_idx = np.argmax(altitude_km)
    ax1.annotate(f'Apogee: {altitude_km[apogee_idx]:,.0f} km',
                xy=(t_hours[apogee_idx], altitude_km[apogee_idx]),
                xytext=(t_hours[apogee_idx] + 2, altitude_km[apogee_idx] - 8000),
                fontsize=10, fontweight='bold', color='#1565C0',
                arrowprops=dict(arrowstyle='->', color='#1565C0'))

    # --- Middle panel: True radiation ---
    ax2 = fig.add_subplot(gs[1], sharex=ax1)
    ax2.fill_between(t_hours, 0, inner_rad, alpha=0.4, color='orange', label='Inner belt')
    ax2.fill_between(t_hours, 0, outer_rad, alpha=0.3, color='mediumpurple', label='Outer belt')
    ax2.plot(t_hours, total_rad, color='red', linewidth=1.5, alpha=0.7, label='Total')
    ax2.set_ylabel('True Intensity\n(counts/sec)', fontsize=11)
    ax2.legend(loc='upper right', fontsize=9, ncol=3)
    ax2.grid(True, alpha=0.3)
    ax2.set_xlim(0, 44)

    # Mark the 4 belt transits
    # Find peaks in radiation (2 on ascent, 2 on descent)
    mid = len(t_hours) // 2
    for half, label_suffix in [(slice(0, mid), 'ascent'), (slice(mid, None), 'descent')]:
        inner_section = inner_rad[half]
        outer_section = outer_rad[half]
        t_section = t_hours[half]

        if len(inner_section) > 0:
            inner_peak_idx = np.argmax(inner_section)
            if inner_section[inner_peak_idx] > 100:
                ax2.annotate(f'Inner\n({label_suffix})',
                           xy=(t_section[inner_peak_idx], inner_section[inner_peak_idx]),
                           fontsize=8, color='darkorange', ha='center', fontweight='bold')

        if len(outer_section) > 0:
            outer_peak_idx = np.argmax(outer_section)
            if outer_section[outer_peak_idx] > 50:
                ax2.annotate(f'Outer\n({label_suffix})',
                           xy=(t_section[outer_peak_idx], outer_section[outer_peak_idx]),
                           fontsize=8, color='purple', ha='center', fontweight='bold')

    # --- Bottom panel: What the GM tube actually measured ---
    ax3 = fig.add_subplot(gs[2], sharex=ax1)
    ax3.plot(t_hours, measured_rad, color='#4CAF50', linewidth=2, label='GM tube (saturated)')
    ax3.axhline(y=800, color='darkred', linestyle=':', linewidth=1, alpha=0.5)
    ax3.text(22, 810, 'Saturation threshold', fontsize=8, color='darkred')
    ax3.set_ylabel('Measured Rate\n(counts/sec)', fontsize=11)
    ax3.set_xlabel('Time Since Launch (hours)', fontsize=12)
    ax3.legend(loc='upper right', fontsize=9)
    ax3.grid(True, alpha=0.3)
    ax3.set_xlim(0, 44)

    fig.savefig('pioneer1_combined.png', dpi=150, bbox_inches='tight')
    print("Saved: pioneer1_combined.png")
    plt.close(fig)


# ===========================================================================
# Main
# ===========================================================================

def main():
    print()
    print("  Pioneer 1 — 43-Hour Trajectory and Radiation Profile")
    print("  Mission 1.2, NASA Mission Series")
    print("  First NASA-launched spacecraft, October 11, 1958")
    print()

    # Print launch sequence
    print_launch_sequence()

    # Compute orbital elements
    a, e, r_peri, r_apo, v_burn, v_esc, T, h = compute_orbital_elements()

    # Compute trajectory
    print("Computing 43-hour ballistic trajectory (Keplerian)...")
    t_hours, altitude_km, velocity, theta = compute_trajectory(a, e, T)

    # Print key velocity facts
    print("=" * 65)
    print("The 234 m/s Shortfall")
    print("=" * 65)
    print(f"Achieved velocity:   {v_burn:,.1f} m/s  ({v_burn/1000:.3f} km/s)")
    print(f"Escape velocity:     {v_esc:,.1f} m/s  ({v_esc/1000:.3f} km/s)")
    print(f"Shortfall:           {v_esc - v_burn:,.1f} m/s")
    print(f"Percentage achieved: {100 * v_burn / v_esc:.1f}%")
    print(f"Result:              Apogee at {APOGEE_ALT/1000:,.0f} km instead of lunar orbit")
    print()

    # Generate plots
    print("Generating plots...")
    plot_altitude(t_hours, altitude_km)
    plot_radiation(altitude_km)
    plot_combined(t_hours, altitude_km)

    print()
    print("=" * 65)
    print("Pioneer 1 returned 43 hours of data that changed our")
    print("understanding of the space between Earth and Moon.")
    print("The Van Allen belt structure it discovered directly")
    print("informed shielding requirements for Mercury, Gemini,")
    print("and Apollo.")
    print("=" * 65)


if __name__ == '__main__':
    main()
