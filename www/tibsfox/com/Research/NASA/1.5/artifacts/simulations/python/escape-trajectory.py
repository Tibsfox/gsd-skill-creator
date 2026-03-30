#!/usr/bin/env python3
"""
Pioneer 4 — Hyperbolic Escape Trajectory
==========================================
Mission 1.5: Pioneer 4 (Juno II), March 3, 1959
FIRST AMERICAN SPACECRAFT TO ACHIEVE ESCAPE VELOCITY

Pioneer 4 achieved ~11.1 km/s (above Earth's escape velocity of 11.0 km/s
at its burnout altitude), entering a hyperbolic trajectory that:
  1. Passed the Moon at ~60,000 km (too far for imaging, but good tracking)
  2. Entered heliocentric orbit (a = 1.15 AU, e = 0.07, T = 1.23 years)

This script computes and visualizes:
  - The hyperbolic escape from Earth
  - Lunar flyby geometry
  - Heliocentric orbit
  - Comparison with Pioneer 1's elliptical arc
  - Signal strength decay over 82 hours of tracking

Requires: numpy, scipy, matplotlib
Run: python3 escape-trajectory.py
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch
from matplotlib.collections import LineCollection

# =========================================================================
# Constants
# =========================================================================
G = 6.674e-11              # gravitational constant (m^3 kg^-1 s^-2)
M_EARTH = 5.972e24         # Earth mass (kg)
R_EARTH = 6.371e6          # Earth radius (m)
MU_EARTH = G * M_EARTH     # Earth gravitational parameter

M_SUN = 1.989e30           # Sun mass (kg)
MU_SUN = G * M_SUN         # Sun gravitational parameter
AU = 1.496e11              # Astronomical Unit (m)

MOON_DIST = 3.844e8        # Moon distance (m)
MOON_ORBITAL_PERIOD = 27.32 * 86400  # Moon orbital period (s)

# =========================================================================
# Pioneer 4 parameters
# =========================================================================
BURNOUT_ALT = 300e3         # Burnout altitude (m) — approximate
BURNOUT_R = R_EARTH + BURNOUT_ALT
V_BURNOUT = 11.1e3          # Burnout velocity (m/s) — escape velocity achieved!
V_ESCAPE_AT_BURNOUT = np.sqrt(2 * MU_EARTH / BURNOUT_R)  # ~11.0 km/s

# Pioneer 1 for comparison
V_PIONEER1 = 10.27e3        # Pioneer 1 burnout velocity (m/s) — fell back

# Pioneer 4 heliocentric orbit
A_HELIO = 1.15 * AU         # Semi-major axis
E_HELIO = 0.07              # Eccentricity
T_HELIO = 2 * np.pi * np.sqrt(A_HELIO ** 3 / MU_SUN)  # Orbital period

# Tracking parameters
TRACKING_TIME_HR = 82       # Hours of contact maintained
TRANSMIT_POWER_W = 0.3      # 300 mW transmitter
TRANSMIT_FREQ_MHZ = 108.06  # VHF frequency
MAX_TRACKING_DIST_KM = 655_000  # Maximum tracking distance


def compute_orbit(v0, r0, mu, dt=60, t_max=200000):
    """
    Numerically integrate a 2D orbit using Verlet integration.

    Parameters
    ----------
    v0 : float
        Initial velocity (m/s), tangential
    r0 : float
        Initial radius (m)
    mu : float
        Gravitational parameter (m^3/s^2)
    dt : float
        Time step (seconds)
    t_max : float
        Maximum simulation time (seconds)

    Returns
    -------
    times, x, y, r, v : arrays
    """
    # Initial conditions: start at (r0, 0) with velocity (0, v0)
    x, y = r0, 0.0
    vx, vy = 0.0, v0

    times = [0]
    xs, ys = [x], [y]
    rs = [r0]
    vs = [v0]

    t = 0
    while t < t_max:
        r = np.sqrt(x ** 2 + y ** 2)
        if r < R_EARTH * 0.9:  # Re-entered
            break
        if r > 5e9:  # Way beyond Moon
            break

        # Gravitational acceleration
        ax = -mu * x / r ** 3
        ay = -mu * y / r ** 3

        # Velocity Verlet
        x_new = x + vx * dt + 0.5 * ax * dt ** 2
        y_new = y + vy * dt + 0.5 * ay * dt ** 2

        r_new = np.sqrt(x_new ** 2 + y_new ** 2)
        ax_new = -mu * x_new / r_new ** 3
        ay_new = -mu * y_new / r_new ** 3

        vx += 0.5 * (ax + ax_new) * dt
        vy += 0.5 * (ay + ay_new) * dt

        x, y = x_new, y_new
        t += dt

        times.append(t)
        xs.append(x)
        ys.append(y)
        rs.append(r_new)
        vs.append(np.sqrt(vx ** 2 + vy ** 2))

    return (np.array(times), np.array(xs), np.array(ys),
            np.array(rs), np.array(vs))


def main():
    # =====================================================================
    # Compute trajectories
    # =====================================================================

    # Pioneer 4 (escape — hyperbolic)
    t4, x4, y4, r4, v4 = compute_orbit(V_BURNOUT, BURNOUT_R, MU_EARTH,
                                         dt=30, t_max=300000)

    # Pioneer 1 (suborbital — elliptical arc, falls back)
    t1, x1, y1, r1, v1 = compute_orbit(V_PIONEER1, BURNOUT_R, MU_EARTH,
                                         dt=30, t_max=200000)

    # =====================================================================
    # Plot 1: Earth-centered trajectory (hyperbolic escape)
    # =====================================================================
    fig1, ax1 = plt.subplots(figsize=(12, 12))

    # Earth
    earth = Circle((0, 0), R_EARTH / 1e6, color='#2266aa', zorder=5)
    ax1.add_patch(earth)

    # Moon orbit (dashed circle)
    moon_orbit = Circle((0, 0), MOON_DIST / 1e6, fill=False,
                         linestyle='--', color='#555', linewidth=1)
    ax1.add_patch(moon_orbit)
    ax1.text(MOON_DIST / 1e6 * 0.72, MOON_DIST / 1e6 * 0.72,
             'Moon orbit\n384,400 km', fontsize=9, color='#888', ha='center')

    # Pioneer 4 trajectory (color-coded by velocity)
    points = np.array([x4 / 1e6, y4 / 1e6]).T.reshape(-1, 1, 2)
    segments = np.concatenate([points[:-1], points[1:]], axis=1)
    norm_v = (v4[:-1] - v4.min()) / (v4.max() - v4.min() + 1e-10)
    lc = LineCollection(segments, cmap='plasma', norm=plt.Normalize(0, 1))
    lc.set_array(norm_v)
    lc.set_linewidth(2)
    ax1.add_collection(lc)

    # Pioneer 1 trajectory (comparison)
    ax1.plot(x1 / 1e6, y1 / 1e6, color='#ffd93d', linewidth=1.5,
             alpha=0.5, linestyle='--', label='Pioneer 1 (fell back)')

    # Mark Pioneer 4 lunar flyby point (~60,000 km from Moon)
    # Find the point closest to Moon distance
    moon_angle = np.pi / 6  # approximate Moon position at flyby
    moon_x = MOON_DIST * np.cos(moon_angle) / 1e6
    moon_y = MOON_DIST * np.sin(moon_angle) / 1e6
    ax1.plot(moon_x, moon_y, 'o', color='#aaa', markersize=8, zorder=6)
    ax1.text(moon_x + 15, moon_y + 15, 'Moon\n(at flyby)', fontsize=9,
             color='#aaa', ha='left')

    # Labels
    ax1.set_xlabel('Distance (thousands of km)', fontsize=12, color='white')
    ax1.set_ylabel('Distance (thousands of km)', fontsize=12, color='white')
    ax1.set_title('Pioneer 4 Hyperbolic Escape Trajectory\n'
                  f'v = {V_BURNOUT / 1e3:.1f} km/s '
                  f'(v_escape = {V_ESCAPE_AT_BURNOUT / 1e3:.2f} km/s)',
                  fontsize=14, fontweight='bold', color='white')
    ax1.set_aspect('equal')
    ax1.set_facecolor('#0a0a2e')
    fig1.set_facecolor('#0a0a2e')
    ax1.tick_params(colors='white')
    for spine in ax1.spines.values():
        spine.set_color('white')
    ax1.grid(True, alpha=0.15, color='white')

    # Legend
    ax1.plot([], [], color='#ffd93d', linestyle='--', alpha=0.5, label='Pioneer 1 (10.27 km/s — fell back)')
    ax1.plot([], [], color='#ff6b6b', linewidth=2, label='Pioneer 4 (11.1 km/s — escaped)')
    ax1.legend(facecolor='#1a1a3e', edgecolor='white', labelcolor='white',
               fontsize=10, loc='lower right')

    lim = MOON_DIST * 1.3 / 1e6
    ax1.set_xlim(-lim * 0.3, lim)
    ax1.set_ylim(-lim * 0.3, lim)

    plt.tight_layout()
    plt.savefig('escape-trajectory-earth.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: escape-trajectory-earth.png")

    # =====================================================================
    # Plot 2: Moon flyby detail
    # =====================================================================
    fig2, ax2 = plt.subplots(figsize=(10, 10))

    # Find closest approach to Moon's position
    moon_pos = np.array([MOON_DIST * np.cos(moon_angle),
                          MOON_DIST * np.sin(moon_angle)])
    dists_to_moon = np.sqrt((x4 - moon_pos[0]) ** 2 + (y4 - moon_pos[1]) ** 2)
    closest_idx = np.argmin(dists_to_moon)
    closest_dist = dists_to_moon[closest_idx]

    # Plot trajectory near Moon
    window = max(0, closest_idx - 500), min(len(x4), closest_idx + 500)
    ax2.plot((x4[window[0]:window[1]] - moon_pos[0]) / 1e3,
             (y4[window[0]:window[1]] - moon_pos[1]) / 1e3,
             color='#ff6b6b', linewidth=2)

    # Moon
    moon_circle = Circle((0, 0), 1737, color='#aaa', zorder=5)
    ax2.add_patch(moon_circle)

    # Closest approach marker
    ca_x = (x4[closest_idx] - moon_pos[0]) / 1e3
    ca_y = (y4[closest_idx] - moon_pos[1]) / 1e3
    ax2.plot(ca_x, ca_y, '*', color='#ffd700', markersize=15, zorder=6)
    ax2.annotate(f'Closest approach\n{closest_dist / 1e3:.0f} km',
                 xy=(ca_x, ca_y), xytext=(ca_x + 15000, ca_y + 15000),
                 fontsize=10, color='#ffd700', fontweight='bold',
                 arrowprops=dict(arrowstyle='->', color='#ffd700', lw=2))

    ax2.set_xlabel('Distance from Moon (km)', fontsize=12, color='white')
    ax2.set_ylabel('Distance from Moon (km)', fontsize=12, color='white')
    ax2.set_title('Pioneer 4 Lunar Flyby\n'
                  'March 4, 1959 — First successful lunar encounter',
                  fontsize=14, fontweight='bold', color='white')
    ax2.set_aspect('equal')
    ax2.set_facecolor('#0a0a2e')
    fig2.set_facecolor('#0a0a2e')
    ax2.tick_params(colors='white')
    for spine in ax2.spines.values():
        spine.set_color('white')
    ax2.grid(True, alpha=0.15, color='white')

    plt.tight_layout()
    plt.savefig('escape-trajectory-flyby.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: escape-trajectory-flyby.png")

    # =====================================================================
    # Plot 3: Heliocentric orbit
    # =====================================================================
    fig3, ax3 = plt.subplots(figsize=(12, 12))

    # Orbits
    theta = np.linspace(0, 2 * np.pi, 1000)

    # Earth orbit (nearly circular, e=0.017)
    r_earth = AU * (1 - 0.017 ** 2) / (1 + 0.017 * np.cos(theta))
    ax3.plot(r_earth * np.cos(theta) / AU, r_earth * np.sin(theta) / AU,
             color='#4488cc', linewidth=2, label='Earth (1 AU)')

    # Mars orbit
    a_mars = 1.524 * AU
    e_mars = 0.093
    r_mars = a_mars * (1 - e_mars ** 2) / (1 + e_mars * np.cos(theta))
    ax3.plot(r_mars * np.cos(theta) / AU, r_mars * np.sin(theta) / AU,
             color='#cc4444', linewidth=1.5, alpha=0.5, label='Mars (1.52 AU)')

    # Pioneer 4 orbit
    r_p4 = A_HELIO * (1 - E_HELIO ** 2) / (1 + E_HELIO * np.cos(theta))
    ax3.plot(r_p4 * np.cos(theta) / AU, r_p4 * np.sin(theta) / AU,
             color='#ffd700', linewidth=2, label=f'Pioneer 4 ({A_HELIO / AU:.2f} AU)')

    # Sun
    ax3.plot(0, 0, 'o', color='#ffdd00', markersize=18, zorder=5)
    ax3.text(0.05, 0.05, 'Sun', fontsize=10, color='#ffdd00')

    # Earth position (arbitrary angle for visualization)
    earth_angle = np.pi / 4
    ax3.plot(np.cos(earth_angle), np.sin(earth_angle), 'o',
             color='#4488cc', markersize=10, zorder=5)
    ax3.text(np.cos(earth_angle) + 0.05, np.sin(earth_angle) + 0.05,
             'Earth', fontsize=10, color='#4488cc')

    # Pioneer 4 position (ahead of Earth in orbit, after escaping)
    p4_angle = earth_angle + 0.3  # slightly ahead
    p4_r = A_HELIO * (1 - E_HELIO ** 2) / (1 + E_HELIO * np.cos(p4_angle))
    ax3.plot(p4_r / AU * np.cos(p4_angle), p4_r / AU * np.sin(p4_angle),
             '*', color='#ffd700', markersize=15, zorder=5)
    ax3.text(p4_r / AU * np.cos(p4_angle) + 0.05,
             p4_r / AU * np.sin(p4_angle) + 0.05,
             'Pioneer 4', fontsize=10, color='#ffd700')

    ax3.set_xlabel('Distance (AU)', fontsize=12, color='white')
    ax3.set_ylabel('Distance (AU)', fontsize=12, color='white')
    ax3.set_title('Pioneer 4 Heliocentric Orbit\n'
                  f'a = {A_HELIO / AU:.2f} AU, e = {E_HELIO:.3f}, '
                  f'T = {T_HELIO / 86400 / 365.25:.2f} years',
                  fontsize=14, fontweight='bold', color='white')
    ax3.set_aspect('equal')
    ax3.set_facecolor('#0a0a2e')
    fig3.set_facecolor('#0a0a2e')
    ax3.tick_params(colors='white')
    for spine in ax3.spines.values():
        spine.set_color('white')
    ax3.legend(facecolor='#1a1a3e', edgecolor='white', labelcolor='white',
               fontsize=11, loc='lower left')
    ax3.grid(True, alpha=0.15, color='white')
    ax3.set_xlim(-2, 2)
    ax3.set_ylim(-2, 2)

    plt.tight_layout()
    plt.savefig('escape-trajectory-heliocentric.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: escape-trajectory-heliocentric.png")

    # =====================================================================
    # Plot 4: Signal strength vs distance
    # =====================================================================
    fig4, ax4 = plt.subplots(figsize=(12, 6))

    t_hrs = np.linspace(0, TRACKING_TIME_HR, 1000)
    # Approximate distance over time (linear increase after escape)
    # At escape, velocity ~ sqrt(v0^2 - v_esc^2) at infinity
    v_inf = np.sqrt(max(0, V_BURNOUT ** 2 - V_ESCAPE_AT_BURNOUT ** 2))
    distance_km = np.sqrt((BURNOUT_R + v_inf * t_hrs * 3600) ** 2) / 1e3

    # Signal power follows inverse-square law
    # P_received proportional to 1/r^2
    # Reference: full signal at 1000 km
    ref_dist = 1000  # km
    signal_relative = (ref_dist / distance_km) ** 2
    signal_dbm = 10 * np.log10(signal_relative * TRANSMIT_POWER_W * 1000)  # dBm

    # Noise floor (approximate receiver sensitivity)
    noise_floor_dbm = -120  # typical VHF receiver

    ax4.plot(t_hrs, signal_dbm, color='#7ec8e3', linewidth=2, label='Received signal')
    ax4.axhline(y=noise_floor_dbm, color='#ff6b6b', linestyle='--', linewidth=1.5,
                label=f'Noise floor ({noise_floor_dbm} dBm)')
    ax4.fill_between(t_hrs, noise_floor_dbm, signal_dbm,
                     where=signal_dbm > noise_floor_dbm,
                     alpha=0.1, color='#7ec8e3')

    # Mark key events
    events = [
        (0, 'Launch'),
        (16, 'Lunar flyby\n(60,000 km)'),
        (TRACKING_TIME_HR, f'Last contact\n({MAX_TRACKING_DIST_KM:,} km)')
    ]
    for t_ev, label in events:
        ax4.axvline(x=t_ev, color='#ffd700', linestyle=':', alpha=0.5)
        ax4.text(t_ev + 0.5, signal_dbm[0] - 10, label,
                 fontsize=9, color='#ffd700', rotation=0, va='top')

    ax4.set_xlabel('Time since launch (hours)', fontsize=12, color='white')
    ax4.set_ylabel('Signal Power (dBm)', fontsize=12, color='white')
    ax4.set_title('Pioneer 4 Signal Strength vs Time\n'
                  f'{TRANSMIT_POWER_W * 1000:.0f} mW at {TRANSMIT_FREQ_MHZ} MHz — '
                  f'tracked for {TRACKING_TIME_HR} hours',
                  fontsize=14, fontweight='bold', color='white')
    ax4.legend(facecolor='#1a1a3e', edgecolor='white', labelcolor='white', fontsize=10)
    ax4.set_facecolor('#0a0a2e')
    fig4.set_facecolor('#0a0a2e')
    ax4.tick_params(colors='white')
    for spine in ax4.spines.values():
        spine.set_color('white')
    ax4.grid(True, alpha=0.15, color='white')

    plt.tight_layout()
    plt.savefig('escape-trajectory-signal.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: escape-trajectory-signal.png")

    # =====================================================================
    # Print summary
    # =====================================================================
    print("\n" + "=" * 65)
    print(" Pioneer 4 — FIRST SUCCESSFUL ESCAPE")
    print("=" * 65)
    print(f" Launch:               March 3, 1959 (Juno II)")
    print(f" Burnout velocity:     {V_BURNOUT / 1e3:.2f} km/s")
    print(f" Escape velocity:      {V_ESCAPE_AT_BURNOUT / 1e3:.2f} km/s "
          f"(at {BURNOUT_ALT / 1e3:.0f} km altitude)")
    print(f" Excess velocity:      {v_inf / 1e3:.2f} km/s "
          f"(hyperbolic excess)")
    print(f" Eccentricity:         >1 (hyperbolic)")
    print(f"")
    print(f" Lunar flyby:          ~60,000 km from Moon surface")
    print(f" Max tracking dist:    {MAX_TRACKING_DIST_KM:,} km")
    print(f" Contact duration:     {TRACKING_TIME_HR} hours")
    print(f"")
    print(f" Heliocentric orbit:")
    print(f"   Semi-major axis:    {A_HELIO / AU:.3f} AU")
    print(f"   Eccentricity:       {E_HELIO:.3f}")
    print(f"   Orbital period:     {T_HELIO / 86400 / 365.25:.2f} years")
    print(f"   Perihelion:         {A_HELIO * (1 - E_HELIO) / AU:.3f} AU")
    print(f"   Aphelion:           {A_HELIO * (1 + E_HELIO) / AU:.3f} AU")
    print(f"")
    years_since = 67  # 2026 - 1959
    orbits_completed = years_since / (T_HELIO / 86400 / 365.25)
    print(f" Pioneer 4 today ({years_since} years later):")
    print(f"   Completed orbits:   ~{orbits_completed:.0f}")
    print(f"   Still in heliocentric orbit")
    print(f"   No longer transmitting (battery exhausted after 82 hours)")
    print(f"")
    print(f" The velocity difference between failure and escape:")
    print(f"   Pioneer 1:  {V_PIONEER1 / 1e3:.2f} km/s -> fell back (elliptical)")
    print(f"   Pioneer 4:  {V_BURNOUT / 1e3:.2f} km/s -> escaped (hyperbolic)")
    print(f"   Difference: {(V_BURNOUT - V_PIONEER1) / 1e3:.2f} km/s")
    print(f"   That's only {(V_BURNOUT - V_PIONEER1) / V_BURNOUT * 100:.1f}% "
          f"more velocity.")
    print("=" * 65)

    plt.show()


if __name__ == '__main__':
    main()
