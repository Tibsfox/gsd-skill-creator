#!/usr/bin/env python3
"""
Explorer 6 Orbit & Radiation Belt Exposure
===========================================
Mission 1.6 — Explorer 6 (S-2), August 7, 1959
Discovery of the ring current

Explorer 6 orbited Earth in a highly elliptical orbit:
  Perigee:  237 km (just above the atmosphere)
  Apogee:   42,400 km (beyond geosynchronous altitude)
  Period:   ~12.5 hours
  Inclination: 47 degrees

This orbit traversed BOTH Van Allen radiation belts on every pass:
  Inner belt: peak intensity at ~3,000 km altitude (protons)
  Outer belt: peak intensity at ~16,000-20,000 km altitude (electrons)
  Slot region: relative minimum between ~6,000-10,000 km

Explorer 6 discovered the ring current — a toroidal electric current
flowing westward around Earth at 3-8 Earth radii, carried by trapped
ions in the magnetosphere. This current causes magnetic storms and
is a major feature of space weather.

This script:
  1. Computes the orbit using Keplerian mechanics (vis-viva equation)
  2. Maps time spent at each altitude (Kepler's second law — more time at apogee)
  3. Overlays a Van Allen belt radiation model
  4. Plots altitude vs time with radiation intensity color-coded
  5. Shows total radiation dose per orbit

Usage: python3 orbit-radiation.py
Requires: numpy, matplotlib, scipy
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from scipy.integrate import solve_ivp

# ============================================================
# CONSTANTS
# ============================================================
G = 6.674e-11           # Gravitational constant (m^3 kg^-1 s^-2)
M_EARTH = 5.972e24      # Earth mass (kg)
R_EARTH = 6.371e6       # Earth radius (m)
MU = G * M_EARTH        # Standard gravitational parameter

# Explorer 6 orbital parameters
PERIGEE_ALT = 237e3     # 237 km above surface
APOGEE_ALT = 42400e3    # 42,400 km above surface
PERIGEE_R = R_EARTH + PERIGEE_ALT
APOGEE_R = R_EARTH + APOGEE_ALT

# Derived orbital parameters
SEMI_MAJOR = (PERIGEE_R + APOGEE_R) / 2.0
ECCENTRICITY = (APOGEE_R - PERIGEE_R) / (APOGEE_R + PERIGEE_R)
PERIOD = 2.0 * np.pi * np.sqrt(SEMI_MAJOR**3 / MU)  # Kepler's third law
SPECIFIC_ENERGY = -MU / (2.0 * SEMI_MAJOR)

# ============================================================
# STEP 1: Compute orbit trajectory
# ============================================================
def compute_orbit(num_points=2000):
    """
    Compute Explorer 6 orbit using the vis-viva equation and
    Kepler's equation for time-of-flight.

    Returns arrays of time, radius, velocity, and true anomaly.
    """
    # Solve Kepler's equation: M = E - e*sin(E)
    # Mean anomaly M advances linearly with time
    # Eccentric anomaly E gives the position on the orbit

    mean_anomalies = np.linspace(0, 2 * np.pi, num_points, endpoint=False)
    times = mean_anomalies / (2 * np.pi) * PERIOD

    # Solve Kepler's equation iteratively for each M
    eccentric_anomalies = np.copy(mean_anomalies)
    for _ in range(20):  # Newton-Raphson iterations
        dE = (eccentric_anomalies - ECCENTRICITY * np.sin(eccentric_anomalies) -
              mean_anomalies) / (1 - ECCENTRICITY * np.cos(eccentric_anomalies))
        eccentric_anomalies -= dE

    # True anomaly from eccentric anomaly
    true_anomalies = 2 * np.arctan2(
        np.sqrt(1 + ECCENTRICITY) * np.sin(eccentric_anomalies / 2),
        np.sqrt(1 - ECCENTRICITY) * np.cos(eccentric_anomalies / 2)
    )

    # Radius from true anomaly (orbit equation)
    radii = SEMI_MAJOR * (1 - ECCENTRICITY**2) / (1 + ECCENTRICITY * np.cos(true_anomalies))

    # Velocity from vis-viva equation: v^2 = mu * (2/r - 1/a)
    velocities = np.sqrt(MU * (2.0 / radii - 1.0 / SEMI_MAJOR))

    # Altitude above surface
    altitudes = radii - R_EARTH

    return times, radii, velocities, altitudes, true_anomalies

# ============================================================
# STEP 2: Van Allen belt radiation model
# ============================================================
def van_allen_flux(altitude_m):
    """
    Simplified Van Allen belt radiation intensity model.

    Returns relative radiation flux as a function of altitude.
    Based on the dual-belt structure discovered by Pioneer 3 (1958)
    and confirmed/mapped by Explorer 6 (1959).

    Inner belt: Peak at ~3,000 km (energetic protons)
    Slot region: Minimum at ~6,000-10,000 km
    Outer belt: Peak at ~16,000-20,000 km (energetic electrons)

    Units are arbitrary (relative flux, 0-1 scale).
    """
    alt_km = altitude_m / 1e3

    # Inner belt — protons, narrow and intense
    inner_peak = 3000.0   # km
    inner_width = 1500.0  # km (half-width)
    inner_flux = 0.8 * np.exp(-((alt_km - inner_peak) / inner_width)**2)

    # Outer belt — electrons, broader and diffuse
    outer_peak = 18000.0  # km
    outer_width = 6000.0  # km (half-width)
    outer_flux = 1.0 * np.exp(-((alt_km - outer_peak) / outer_width)**2)

    # Slot region naturally emerges as the gap between the two Gaussians

    # Additional scattered radiation at high altitudes
    background = 0.02 * np.clip(alt_km / 50000.0, 0, 0.1)

    return inner_flux + outer_flux + background

# ============================================================
# STEP 3: Ring current model
# ============================================================
def ring_current_intensity(altitude_m):
    """
    Simplified ring current model.

    The ring current flows at 3-8 Earth radii (~19,000-51,000 km altitude)
    in the equatorial plane. Explorer 6 discovered this current by measuring
    the magnetic field depression it causes.

    Returns relative ring current intensity.
    """
    alt_km = altitude_m / 1e3
    r_earth_radii = (R_EARTH + altitude_m) / R_EARTH

    # Ring current peaks at ~4-5 Earth radii
    peak_radii = 4.5
    width_radii = 1.5
    intensity = np.exp(-((r_earth_radii - peak_radii) / width_radii)**2)

    return intensity

# ============================================================
# STEP 4: Visualize
# ============================================================
def main():
    print("Explorer 6 Orbit & Radiation Belt Mapping")
    print("=" * 55)
    print(f"Perigee altitude:  {PERIGEE_ALT/1e3:.0f} km")
    print(f"Apogee altitude:   {APOGEE_ALT/1e3:.0f} km")
    print(f"Semi-major axis:   {SEMI_MAJOR/1e3:.0f} km")
    print(f"Eccentricity:      {ECCENTRICITY:.4f}")
    print(f"Orbital period:    {PERIOD/3600:.2f} hours")
    print(f"Specific energy:   {SPECIFIC_ENERGY/1e6:.2f} MJ/kg")
    print()

    # Compute orbit
    print("Computing orbit...")
    times, radii, velocities, altitudes, true_anomalies = compute_orbit(2000)

    # Compute radiation exposure
    radiation = van_allen_flux(altitudes)
    ring_current = ring_current_intensity(altitudes)

    # Compute velocities at key points
    v_perigee = np.sqrt(MU * (2.0 / PERIGEE_R - 1.0 / SEMI_MAJOR))
    v_apogee = np.sqrt(MU * (2.0 / APOGEE_R - 1.0 / SEMI_MAJOR))

    print(f"Velocity at perigee: {v_perigee:.0f} m/s ({v_perigee/1e3:.2f} km/s)")
    print(f"Velocity at apogee:  {v_apogee:.0f} m/s ({v_apogee/1e3:.2f} km/s)")
    print(f"Velocity ratio:      {v_perigee/v_apogee:.1f}:1")
    print()

    # Time spent in each radiation belt
    dt = np.diff(times, prepend=0)
    dt[0] = dt[1]

    inner_belt_mask = (altitudes > 1500e3) & (altitudes < 5000e3)
    outer_belt_mask = (altitudes > 12000e3) & (altitudes < 25000e3)
    slot_mask = (altitudes > 5000e3) & (altitudes < 12000e3)

    time_inner = np.sum(dt[inner_belt_mask]) / 3600
    time_outer = np.sum(dt[outer_belt_mask]) / 3600
    time_slot = np.sum(dt[slot_mask]) / 3600

    print(f"Time in inner belt:  {time_inner:.2f} hours")
    print(f"Time in slot region: {time_slot:.2f} hours")
    print(f"Time in outer belt:  {time_outer:.2f} hours")
    print()

    # Total radiation dose (integral of flux * time)
    total_dose = np.sum(radiation * dt)
    print(f"Relative radiation dose per orbit: {total_dose:.0f} (arbitrary units)")
    print()

    # --- PLOTTING ---
    fig, axes = plt.subplots(3, 1, figsize=(14, 14), facecolor='#0A0A1A')

    time_hours = times / 3600.0

    # --- Plot 1: Altitude vs Time with radiation color ---
    ax1 = axes[0]

    # Create a radiation-colored altitude trace
    radiation_cmap = LinearSegmentedColormap.from_list('radiation', [
        (0.0, '#0A150A'),     # Low radiation — dark
        (0.2, '#33CC33'),     # Moderate — green
        (0.5, '#D4A830'),     # Medium — amber
        (0.8, '#FF4444'),     # High — red
        (1.0, '#FF88FF'),     # Extreme — magenta
    ])

    # Plot as colored scatter
    scatter = ax1.scatter(time_hours, altitudes / 1e3, c=radiation,
                          cmap=radiation_cmap, s=2, vmin=0, vmax=1)
    cbar = plt.colorbar(scatter, ax=ax1, label='Radiation Flux (relative)')
    cbar.ax.yaxis.label.set_color('#CCCCCC')
    cbar.ax.tick_params(colors='#666666')

    # Van Allen belt bands (background)
    ax1.axhspan(1500, 5000, alpha=0.1, color='#FF4444', label='Inner Belt')
    ax1.axhspan(5000, 12000, alpha=0.05, color='#333333', label='Slot Region')
    ax1.axhspan(12000, 25000, alpha=0.1, color='#FF8844', label='Outer Belt')

    ax1.set_xlabel('Time (hours)', color='#CCCCCC', fontsize=11)
    ax1.set_ylabel('Altitude (km)', color='#CCCCCC', fontsize=11)
    ax1.set_title('Explorer 6 Orbit — Altitude vs. Time with Radiation Intensity',
                  color='#CCCCCC', fontsize=13, fontweight='bold')
    ax1.set_facecolor('#0A0A1A')
    ax1.tick_params(colors='#666666')
    ax1.legend(loc='upper right', fontsize=9, facecolor='#1A1A2A',
               edgecolor='#333333', labelcolor='#CCCCCC')
    ax1.set_ylim(0, 45000)

    # Annotate perigee and apogee
    ax1.annotate(f'Perigee\n{PERIGEE_ALT/1e3:.0f} km\n{v_perigee/1e3:.1f} km/s',
                 xy=(0, PERIGEE_ALT/1e3), xytext=(0.5, 8000),
                 color='#33CC33', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#33CC33'))
    ax1.annotate(f'Apogee\n{APOGEE_ALT/1e3:.0f} km\n{v_apogee/1e3:.1f} km/s',
                 xy=(PERIOD/7200, APOGEE_ALT/1e3), xytext=(PERIOD/7200 - 1, 35000),
                 color='#D4A830', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#D4A830'))

    for spine in ax1.spines.values():
        spine.set_color('#333333')

    # --- Plot 2: Velocity profile ---
    ax2 = axes[1]
    ax2.plot(time_hours, velocities / 1e3, color='#33CC33', linewidth=1.5,
             label='Orbital velocity')
    ax2.fill_between(time_hours, velocities / 1e3, alpha=0.15, color='#33CC33')

    ax2.set_xlabel('Time (hours)', color='#CCCCCC', fontsize=11)
    ax2.set_ylabel('Velocity (km/s)', color='#CCCCCC', fontsize=11)
    ax2.set_title('Explorer 6 — Orbital Velocity (vis-viva equation)',
                  color='#CCCCCC', fontsize=13, fontweight='bold')
    ax2.set_facecolor('#0A0A1A')
    ax2.tick_params(colors='#666666')
    ax2.legend(loc='upper right', fontsize=9, facecolor='#1A1A2A',
               edgecolor='#333333', labelcolor='#CCCCCC')

    # Show Kepler's 2nd law: fast at perigee, slow at apogee
    ax2.annotate(f'Fast at perigee\n{v_perigee/1e3:.1f} km/s',
                 xy=(0, v_perigee/1e3), xytext=(1, v_perigee/1e3 - 1),
                 color='#33CC33', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#33CC33'))
    ax2.annotate(f'Slow at apogee\n{v_apogee/1e3:.1f} km/s',
                 xy=(PERIOD/7200, v_apogee/1e3), xytext=(PERIOD/7200 - 1, v_apogee/1e3 + 1.5),
                 color='#D4A830', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#D4A830'))

    for spine in ax2.spines.values():
        spine.set_color('#333333')

    # --- Plot 3: Radiation belt profile (altitude cross-section) ---
    ax3 = axes[2]
    alt_range = np.linspace(0, 45000e3, 1000)
    rad_profile = van_allen_flux(alt_range)
    ring_profile = ring_current_intensity(alt_range)

    ax3.fill_between(alt_range / 1e3, rad_profile, alpha=0.3, color='#FF4444',
                     label='Van Allen Belt Radiation')
    ax3.plot(alt_range / 1e3, rad_profile, color='#FF6666', linewidth=1.5)
    ax3.plot(alt_range / 1e3, ring_profile * 0.5, color='#4488FF', linewidth=1.5,
             linestyle='--', label='Ring Current (Explorer 6 discovery)')

    # Mark Explorer 6 orbital range
    ax3.axvspan(PERIGEE_ALT / 1e3, APOGEE_ALT / 1e3, alpha=0.05, color='#33CC33')
    ax3.axvline(PERIGEE_ALT / 1e3, color='#33CC33', linestyle=':', alpha=0.5, label='Perigee')
    ax3.axvline(APOGEE_ALT / 1e3, color='#D4A830', linestyle=':', alpha=0.5, label='Apogee')

    ax3.annotate('Inner Belt\n(protons)\n~3,000 km',
                 xy=(3000, 0.8), xytext=(3000, 0.9),
                 color='#FF6666', fontsize=9, ha='center')
    ax3.annotate('Outer Belt\n(electrons)\n~18,000 km',
                 xy=(18000, 1.0), xytext=(18000, 1.1),
                 color='#FF6666', fontsize=9, ha='center')
    ax3.annotate('Slot\nRegion',
                 xy=(8000, 0.1), color='#666666', fontsize=9, ha='center')

    ax3.set_xlabel('Altitude (km)', color='#CCCCCC', fontsize=11)
    ax3.set_ylabel('Relative Intensity', color='#CCCCCC', fontsize=11)
    ax3.set_title('Van Allen Belt Profile — Explorer 6 Traverses Both Belts Every Orbit',
                  color='#CCCCCC', fontsize=13, fontweight='bold')
    ax3.set_facecolor('#0A0A1A')
    ax3.tick_params(colors='#666666')
    ax3.legend(loc='upper right', fontsize=9, facecolor='#1A1A2A',
               edgecolor='#333333', labelcolor='#CCCCCC')

    for spine in ax3.spines.values():
        spine.set_color('#333333')

    fig.suptitle('Explorer 6 — Orbit, Velocity & Radiation Belt Mapping\n'
                 'August 7, 1959 | Highly Elliptical Orbit 237 x 42,400 km',
                 color='#CCCCCC', fontsize=15, fontweight='bold', y=0.98)

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.savefig('explorer6-orbit-radiation.png', dpi=150, facecolor='#0A0A1A',
                bbox_inches='tight')
    print("Saved: explorer6-orbit-radiation.png")
    plt.show()

    print()
    print("Key finding: Explorer 6 spent most of its time near apogee")
    print("(Kepler's 2nd law — slower at greater distance), which means")
    print("it accumulated the majority of its radiation dose in the outer belt.")
    print("This prolonged exposure in the outer belt is what enabled the")
    print("discovery of the ring current — a sustained magnetic field")
    print("depression measurable only with extended observation time at")
    print("high altitude.")

if __name__ == '__main__':
    main()
