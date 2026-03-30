#!/usr/bin/env python3
"""
Explorer 4 — Charged Particle Trapping in Earth's Dipole Magnetic Field
=========================================================================
Mission 1.10: Explorer 4 (Juno I / ABMA), July 26, 1958
PROJECT ARGUS — Artificial Radiation Belts from Nuclear Detonations

Simulates a charged particle (electron) injected into Earth's dipole
magnetic field at a given pitch angle and altitude. The electron spirals
along field lines, bouncing between magnetic mirror points near the poles.

Physics:
  - Dipole field: B = (mu_0 * M / 4pi) * sqrt(1 + 3*sin^2(lambda)) / r^3
  - First adiabatic invariant: mu = m * v_perp^2 / (2B) = const
  - Mirror condition: sin^2(alpha_eq) / B_eq = sin^2(90) / B_mirror
  - Mirror latitude: cos^6(lambda_m) / sqrt(1 + 3*sin^2(lambda_m)) = sin^2(alpha_eq)

This produces:
  1. 3D trajectory of the spiraling electron
  2. 2D meridional plane projection showing bounce path
  3. Pitch angle evolution as function of latitude
  4. Mirror point visualization

Requires: numpy, scipy, matplotlib
Run: python3 particle-trapping.py
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# =========================================================================
# Constants
# =========================================================================
R_EARTH = 6.371e6          # Earth radius (m)
B_SURFACE_EQUATOR = 3.07e-5  # Equatorial surface field (T)
M_DIPOLE = B_SURFACE_EQUATOR * R_EARTH ** 3  # Dipole moment * mu_0/(4pi)
M_ELECTRON = 9.109e-31     # Electron mass (kg)
Q_ELECTRON = 1.602e-19     # Electron charge (C)
C_LIGHT = 2.998e8          # Speed of light (m/s)

# =========================================================================
# Argus injection parameters
# =========================================================================
# Argus I: ~200 km altitude, ~480 km geocentric shell
# Argus III: ~540 km altitude
# Electrons from 1.7 kt W-25 warhead, beta decay energies ~MeV range

INJECTION_L = 2.0           # L-shell parameter (in Earth radii)
INJECTION_ENERGY_KEV = 500  # Electron energy (keV)
INJECTION_PITCH_DEG = 45    # Equatorial pitch angle (degrees)


def dipole_field_strength(r, lambda_rad):
    """
    Magnetic field strength at position (r, lambda) in dipole field.

    Parameters
    ----------
    r : float
        Radial distance from Earth center (m)
    lambda_rad : float
        Magnetic latitude (radians, 0 = equator)

    Returns
    -------
    B : float
        Total magnetic field magnitude (T)
    """
    cos_l = np.cos(lambda_rad)
    sin_l = np.sin(lambda_rad)
    return (M_DIPOLE / r ** 3) * np.sqrt(1 + 3 * sin_l ** 2)


def dipole_field_at_equator(L):
    """Equatorial field strength at L-shell L (Earth radii)."""
    r_eq = L * R_EARTH
    return M_DIPOLE / r_eq ** 3


def mirror_latitude(pitch_angle_eq_deg):
    """
    Find the mirror latitude for a given equatorial pitch angle.
    Uses the dipole mirror equation:
      cos^6(lambda_m) / sqrt(1 + 3*sin^2(lambda_m)) = sin^2(alpha_eq)

    Parameters
    ----------
    pitch_angle_eq_deg : float
        Equatorial pitch angle in degrees

    Returns
    -------
    lambda_m : float
        Mirror point latitude in degrees
    """
    sin2_alpha = np.sin(np.radians(pitch_angle_eq_deg)) ** 2

    # Numerical solution: scan latitude from 0 to 90
    lambdas = np.linspace(0, np.pi / 2, 10000)
    lhs = np.cos(lambdas) ** 6 / np.sqrt(1 + 3 * np.sin(lambdas) ** 2)

    # Find where lhs = sin^2(alpha_eq)
    idx = np.argmin(np.abs(lhs - sin2_alpha))
    return np.degrees(lambdas[idx])


def compute_bounce_trajectory(L, pitch_angle_eq_deg, n_points=2000):
    """
    Compute the trajectory of a bouncing particle in the meridional plane.

    The particle follows a dipole field line (r = L * cos^2(lambda))
    and bounces between +/- mirror latitude.

    Parameters
    ----------
    L : float
        L-shell (Earth radii)
    pitch_angle_eq_deg : float
        Equatorial pitch angle (degrees)
    n_points : int
        Number of points per half-bounce

    Returns
    -------
    r_traj : array
        Radial distances (m)
    lambda_traj : array
        Latitudes (radians)
    pitch_angles : array
        Pitch angles along trajectory (degrees)
    """
    lambda_m = mirror_latitude(pitch_angle_eq_deg)
    lambda_m_rad = np.radians(lambda_m)

    # One full bounce: equator → north mirror → equator → south mirror → equator
    lam_up = np.linspace(0, lambda_m_rad, n_points)
    lam_down = np.linspace(lambda_m_rad, 0, n_points)
    lam_south = np.linspace(0, -lambda_m_rad, n_points)
    lam_back = np.linspace(-lambda_m_rad, 0, n_points)

    lambda_traj = np.concatenate([lam_up, lam_down, lam_south, lam_back])

    # Radial distance along field line: r = L * R_earth * cos^2(lambda)
    r_traj = L * R_EARTH * np.cos(lambda_traj) ** 2

    # Pitch angle evolution: sin^2(alpha) = B(r,lam) * sin^2(alpha_eq) / B_eq
    B_eq = dipole_field_at_equator(L)
    sin2_alpha_eq = np.sin(np.radians(pitch_angle_eq_deg)) ** 2

    B_traj = np.array([dipole_field_strength(r, lam)
                       for r, lam in zip(r_traj, lambda_traj)])
    sin2_alpha_traj = np.minimum(B_traj * sin2_alpha_eq / B_eq, 1.0)
    pitch_angles = np.degrees(np.arcsin(np.sqrt(sin2_alpha_traj)))

    return r_traj, lambda_traj, pitch_angles


def compute_3d_spiral(L, pitch_angle_eq_deg, energy_kev, n_gyrations=200):
    """
    Compute approximate 3D spiral trajectory with gyration.

    Parameters
    ----------
    L : float
        L-shell
    pitch_angle_eq_deg : float
        Equatorial pitch angle
    energy_kev : float
        Electron energy in keV
    n_gyrations : int
        Number of gyration cycles to compute

    Returns
    -------
    x, y, z : arrays
        3D position coordinates (in Earth radii)
    """
    lambda_m = mirror_latitude(pitch_angle_eq_deg)
    lambda_m_rad = np.radians(lambda_m)

    # Gyration radius at equator
    B_eq = dipole_field_at_equator(L)
    gamma = 1 + energy_kev * 1e3 * Q_ELECTRON / (M_ELECTRON * C_LIGHT ** 2)
    v = C_LIGHT * np.sqrt(1 - 1 / gamma ** 2)
    v_perp = v * np.sin(np.radians(pitch_angle_eq_deg))
    r_gyro = gamma * M_ELECTRON * v_perp / (Q_ELECTRON * B_eq)

    # Normalized gyration radius (in Earth radii)
    r_gyro_RE = r_gyro / R_EARTH

    # Bounce trajectory in meridional plane
    n_points_per_bounce = n_gyrations * 50
    lam_half = np.linspace(0, lambda_m_rad, n_points_per_bounce // 4)
    lam_full = np.concatenate([
        lam_half,
        lam_half[::-1],
        -lam_half,
        -lam_half[::-1]
    ])

    r_field = L * np.cos(lam_full) ** 2  # in Earth radii

    # Gyration phase
    gyro_phase = np.linspace(0, 2 * np.pi * n_gyrations, len(lam_full))

    # Scale gyration radius with latitude (increases near mirrors)
    B_lam = np.array([dipole_field_strength(rf * R_EARTH, lf)
                      for rf, lf in zip(r_field, lam_full)])
    r_gyro_local = r_gyro_RE * np.sqrt(B_eq / B_lam)

    # 3D coordinates
    x = r_field * np.cos(lam_full) + r_gyro_local * np.cos(gyro_phase) * 0.3
    y = r_gyro_local * np.sin(gyro_phase) * 0.3
    z = r_field * np.sin(lam_full)

    return x, y, z


def plot_all():
    """Generate all visualization panels."""
    fig = plt.figure(figsize=(16, 12))
    fig.suptitle(
        f'Explorer 4 — Particle Trapping in Earth\'s Dipole Field\n'
        f'L={INJECTION_L}, E={INJECTION_ENERGY_KEV} keV, '
        f'pitch angle={INJECTION_PITCH_DEG}°',
        fontsize=14, fontweight='bold'
    )

    lambda_m = mirror_latitude(INJECTION_PITCH_DEG)
    r_traj, lam_traj, pitch_traj = compute_bounce_trajectory(
        INJECTION_L, INJECTION_PITCH_DEG
    )

    # --- Panel 1: Meridional plane trajectory ---
    ax1 = fig.add_subplot(221)

    # Earth
    theta_earth = np.linspace(0, 2 * np.pi, 200)
    ax1.fill(np.cos(theta_earth), np.sin(theta_earth), color='#1a3a6a', alpha=0.8)
    ax1.plot(np.cos(theta_earth), np.sin(theta_earth), 'w-', linewidth=0.5)

    # Field lines
    for L_val in [1.5, 2.0, 2.5, 3.0, 4.0, 5.0]:
        lam_line = np.linspace(-np.pi / 2, np.pi / 2, 500)
        r_line = L_val * np.cos(lam_line) ** 2
        x_line = r_line * np.cos(lam_line)
        z_line = r_line * np.sin(lam_line)
        color = '#40FF80' if L_val == INJECTION_L else '#333355'
        lw = 1.5 if L_val == INJECTION_L else 0.5
        ax1.plot(x_line, z_line, color=color, linewidth=lw, alpha=0.7)

    # Bounce trajectory (highlight)
    x_bounce = (r_traj / R_EARTH) * np.cos(lam_traj)
    z_bounce = (r_traj / R_EARTH) * np.sin(lam_traj)
    ax1.plot(x_bounce, z_bounce, color='#D4A830', linewidth=2.0, alpha=0.9,
             label=f'Bounce path (±{lambda_m:.1f}°)')

    # Mirror points
    r_mirror = INJECTION_L * np.cos(np.radians(lambda_m)) ** 2
    ax1.plot(r_mirror * np.cos(np.radians(lambda_m)),
             r_mirror * np.sin(np.radians(lambda_m)),
             'rv', markersize=10, label=f'North mirror ({lambda_m:.1f}°)')
    ax1.plot(r_mirror * np.cos(np.radians(lambda_m)),
             -r_mirror * np.sin(np.radians(lambda_m)),
             'r^', markersize=10, label=f'South mirror (-{lambda_m:.1f}°)')

    ax1.set_xlim(-0.5, 3.5)
    ax1.set_ylim(-2.5, 2.5)
    ax1.set_aspect('equal')
    ax1.set_xlabel('Equatorial distance (R_E)')
    ax1.set_ylabel('Distance from equatorial plane (R_E)')
    ax1.set_title('Meridional Plane — Bounce Trajectory')
    ax1.legend(fontsize=8, loc='upper right')
    ax1.set_facecolor('#050510')
    ax1.grid(True, alpha=0.1)

    # --- Panel 2: 3D spiral ---
    ax2 = fig.add_subplot(222, projection='3d')

    x3d, y3d, z3d = compute_3d_spiral(
        INJECTION_L, INJECTION_PITCH_DEG, INJECTION_ENERGY_KEV,
        n_gyrations=80
    )

    # Color by latitude (green at equator, amber at mirrors)
    colors = np.abs(z3d) / np.max(np.abs(z3d) + 1e-10)

    for i in range(len(x3d) - 1):
        c = plt.cm.YlGn(1.0 - colors[i])
        ax2.plot(x3d[i:i + 2], y3d[i:i + 2], z3d[i:i + 2],
                 color=c, linewidth=0.5, alpha=0.7)

    # Earth sphere
    u = np.linspace(0, 2 * np.pi, 30)
    v = np.linspace(0, np.pi, 20)
    xe = 0.3 * np.outer(np.cos(u), np.sin(v))
    ye = 0.3 * np.outer(np.sin(u), np.sin(v))
    ze = 0.3 * np.outer(np.ones_like(u), np.cos(v))
    ax2.plot_surface(xe, ye, ze, color='#1a3a6a', alpha=0.5)

    ax2.set_xlabel('X (R_E)')
    ax2.set_ylabel('Y (R_E)')
    ax2.set_zlabel('Z (R_E)')
    ax2.set_title('3D Spiral Trajectory')
    ax2.set_facecolor('#050510')

    # --- Panel 3: Pitch angle vs latitude ---
    ax3 = fig.add_subplot(223)

    n_bounce = len(lam_traj) // 4  # one quarter = equator to mirror
    lam_deg = np.degrees(lam_traj[:n_bounce])
    pitch_deg = pitch_traj[:n_bounce]

    ax3.plot(lam_deg, pitch_deg, color='#40FF80', linewidth=2)
    ax3.axhline(y=90, color='#D4A830', linestyle='--', alpha=0.5, label='Mirror (90°)')
    ax3.axvline(x=lambda_m, color='#D4A830', linestyle=':', alpha=0.5,
                label=f'Mirror latitude ({lambda_m:.1f}°)')

    ax3.set_xlabel('Magnetic latitude (degrees)')
    ax3.set_ylabel('Pitch angle (degrees)')
    ax3.set_title('Pitch Angle Evolution — Equator to Mirror')
    ax3.set_xlim(0, lambda_m + 5)
    ax3.set_ylim(0, 100)
    ax3.legend(fontsize=8)
    ax3.set_facecolor('#050510')
    ax3.grid(True, alpha=0.15)

    # --- Panel 4: Mirror latitude vs equatorial pitch angle ---
    ax4 = fig.add_subplot(224)

    pitch_range = np.linspace(5, 85, 200)
    mirror_lats = [mirror_latitude(pa) for pa in pitch_range]

    ax4.plot(pitch_range, mirror_lats, color='#40FF80', linewidth=2)

    # Mark current particle
    ax4.plot(INJECTION_PITCH_DEG, lambda_m, 'o', color='#D4A830',
             markersize=10, label=f'This particle ({INJECTION_PITCH_DEG}° → {lambda_m:.1f}°)')

    # Loss cone (mirror inside atmosphere, ~100 km = ~1.016 R_E)
    # For L=2: loss cone pitch angle where mirror is at atmosphere
    loss_cone_lat = np.degrees(np.arccos(np.sqrt(1.016 / INJECTION_L)))
    loss_cone_pitch = None
    for pa in pitch_range:
        ml = mirror_latitude(pa)
        if ml >= loss_cone_lat:
            loss_cone_pitch = pa
            break

    if loss_cone_pitch:
        ax4.axvspan(0, loss_cone_pitch, alpha=0.15, color='red', label='Loss cone')
        ax4.axvline(x=loss_cone_pitch, color='red', linestyle='--', alpha=0.5)

    ax4.set_xlabel('Equatorial pitch angle (degrees)')
    ax4.set_ylabel('Mirror point latitude (degrees)')
    ax4.set_title('Mirror Latitude vs Pitch Angle (Loss Cone)')
    ax4.legend(fontsize=8)
    ax4.set_facecolor('#050510')
    ax4.grid(True, alpha=0.15)

    plt.tight_layout()
    plt.savefig('particle-trapping.png', dpi=150, bbox_inches='tight',
                facecolor='#0a0a1e')
    print(f'Saved: particle-trapping.png')
    print(f'\nParameters:')
    print(f'  L-shell:              {INJECTION_L}')
    print(f'  Energy:               {INJECTION_ENERGY_KEV} keV')
    print(f'  Equatorial pitch:     {INJECTION_PITCH_DEG}°')
    print(f'  Mirror latitude:      ±{lambda_m:.1f}°')
    print(f'  Equatorial field:     {dipole_field_at_equator(INJECTION_L)*1e6:.2f} uT')
    print(f'  Mirror field:         {dipole_field_strength(INJECTION_L * R_EARTH * np.cos(np.radians(lambda_m))**2, np.radians(lambda_m))*1e6:.2f} uT')
    plt.show()


if __name__ == '__main__':
    plot_all()
