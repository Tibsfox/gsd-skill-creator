#!/usr/bin/env python3
"""
Explorer 1 Orbit and Radiation Belt Crossing
=============================================
Mission 1.7 — Explorer 1, January 31, 1958

Computes Explorer 1's orbit (358 × 2,550 km, 33.24° inclination) and
models the inner Van Allen radiation belt using a dipole magnetic field.
Plots altitude vs time for one orbit, color-coded by radiation intensity,
showing the belt crossing regions and marking where the Geiger counter
would saturate.

Three-way collaboration:
    - Army ABMA (Huntsville, AL) — Juno I launch vehicle
    - JPL (Pasadena, CA) — satellite construction
    - University of Iowa (Iowa City, IA) — Geiger counter (Van Allen)

The orbit carries the satellite from 358 km (below the belt, low radiation)
up to 2,550 km (through the inner belt peak at ~1,500 km). On each pass,
the Geiger counter registered increasing counts as the satellite climbed
into the belt — then suddenly read ZERO as it passed through the most
intense region. The counters recovered on the way down. This pattern
repeated orbit after orbit until Van Allen realized that zero meant
maximum, not failure.

Usage:
    python orbit-belt-crossing.py           # Show plot
    python orbit-belt-crossing.py --save    # Save to PNG

Requires: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize
from matplotlib.cm import ScalarMappable
import sys

# --- Physical Constants ---
R_EARTH = 6371.0    # km
MU_EARTH = 3.986e5  # km^3/s^2 (gravitational parameter)
B0_EARTH = 3.12e-5  # Tesla (dipole moment at equator, surface)

def kepler_orbit(perigee_km, apogee_km, n_points=1000):
    """
    Compute orbital altitude vs true anomaly for an elliptical orbit.

    Parameters:
        perigee_km : perigee altitude above surface (km)
        apogee_km  : apogee altitude above surface (km)
        n_points   : number of points around the orbit

    Returns:
        true_anomaly : array of angles (radians)
        altitude     : array of altitudes above surface (km)
        radius       : array of distances from Earth center (km)
        time_minutes : array of time from perigee (minutes)
    """
    r_peri = R_EARTH + perigee_km
    r_apo = R_EARTH + apogee_km
    a = (r_peri + r_apo) / 2.0          # semi-major axis
    e = (r_apo - r_peri) / (r_apo + r_peri)  # eccentricity
    period = 2 * np.pi * np.sqrt(a**3 / MU_EARTH)  # seconds

    true_anomaly = np.linspace(0, 2 * np.pi, n_points)
    radius = a * (1 - e**2) / (1 + e * np.cos(true_anomaly))
    altitude = radius - R_EARTH

    # Eccentric anomaly from true anomaly
    E = 2 * np.arctan2(np.sqrt(1 - e) * np.sin(true_anomaly / 2),
                        np.sqrt(1 + e) * np.cos(true_anomaly / 2))
    # Mean anomaly from eccentric anomaly
    M = E - e * np.sin(E)
    # Time from mean anomaly
    time_seconds = M / (2 * np.pi) * period
    time_minutes = time_seconds / 60.0

    return true_anomaly, altitude, radius, time_minutes, period / 60.0

def dipole_radiation_model(radius_km, L_shell=1.5, belt_width_Re=0.3):
    """
    Simple dipole magnetic field radiation belt model.

    The inner Van Allen belt is modeled as a Gaussian distribution
    centered at a particular L-shell (equatorial crossing distance
    in Earth radii). Radiation intensity depends on how close the
    satellite passes to the belt peak.

    Parameters:
        radius_km    : distance from Earth center (km)
        L_shell      : L-shell of belt peak (Earth radii, ~1.5 for inner belt)
        belt_width_Re: width of belt in Earth radii

    Returns:
        intensity : radiation intensity (normalized 0-1)
        flux      : approximate particle flux (counts/cm^2/sec)
    """
    r_Re = radius_km / R_EARTH  # convert to Earth radii

    # Inner belt Gaussian profile
    belt_center = L_shell  # Earth radii
    intensity = np.exp(-(r_Re - belt_center)**2 / (2 * belt_width_Re**2))

    # Scale to approximate flux
    # Inner belt peak: ~10^4 protons/cm^2/sec (E > 10 MeV)
    # Geiger counter sees ~10^6 total counts/sec including lower energy
    max_flux = 1e6  # counts/sec at belt peak
    flux = intensity * max_flux + 30  # add cosmic ray background

    return intensity, flux

def geiger_response(true_rate, tau=100e-6):
    """
    Paralyzable dead time model for Geiger counter.

    Parameters:
        true_rate : true count rate (counts/sec)
        tau       : dead time (seconds)

    Returns:
        measured_rate : measured count rate (counts/sec)
    """
    return true_rate * np.exp(-true_rate * tau)

def main():
    save_mode = '--save' in sys.argv

    # --- Explorer 1 Orbital Parameters ---
    perigee = 358      # km above surface
    apogee = 2550      # km above surface
    inclination = 33.24  # degrees

    # Compute orbit
    theta, altitude, radius, time_min, period_min = kepler_orbit(perigee, apogee)

    # Radiation belt model
    intensity, true_flux = dipole_radiation_model(radius)

    # Geiger counter response
    tau = 100e-6  # 100 microsecond dead time
    measured_flux = geiger_response(true_flux, tau)

    # Saturation threshold
    saturation_mask = measured_flux < 10  # effectively zero

    # --- Figure ---
    fig = plt.figure(figsize=(16, 12))

    # Panel 1: Orbit altitude with radiation color coding
    ax1 = fig.add_subplot(2, 2, 1)
    # Color-code the orbit by radiation intensity
    points = ax1.scatter(time_min, altitude, c=intensity, cmap='hot',
                        s=2, vmin=0, vmax=1)
    plt.colorbar(points, ax=ax1, label='Radiation Intensity (normalized)')

    # Mark belt region
    ax1.axhspan(1000, 2200, alpha=0.1, color='gold', label='Inner belt region')
    ax1.axhline(1500, color='orange', linestyle=':', alpha=0.5, label='Belt peak (~1,500 km)')

    # Mark saturation regions
    for i in range(len(time_min) - 1):
        if saturation_mask[i]:
            ax1.axvspan(time_min[i], time_min[i + 1],
                       alpha=0.15, color='red', linewidth=0)

    ax1.set_xlabel('Time from Perigee (minutes)')
    ax1.set_ylabel('Altitude (km)')
    ax1.set_title(f'Explorer 1 Orbit: {perigee} × {apogee} km, i={inclination}°')
    ax1.legend(fontsize=8)
    ax1.grid(True, alpha=0.3)

    # Panel 2: True flux vs measured flux
    ax2 = fig.add_subplot(2, 2, 2)
    ax2.semilogy(time_min, true_flux, 'r-', linewidth=1.5, label='True particle flux', alpha=0.7)
    ax2.semilogy(time_min, np.maximum(measured_flux, 0.1), 'g-', linewidth=2, label='Geiger measured')
    ax2.axhline(1.0 / tau, color='orange', linestyle='--', alpha=0.5,
                label=f'Max countable rate (1/τ = {1.0/tau:.0f}/s)')

    # Shade saturation regions
    for i in range(len(time_min) - 1):
        if saturation_mask[i]:
            ax2.axvspan(time_min[i], time_min[i + 1],
                       alpha=0.15, color='red', linewidth=0)

    ax2.set_xlabel('Time from Perigee (minutes)')
    ax2.set_ylabel('Count Rate (counts/sec)')
    ax2.set_title('Geiger Counter: True vs Measured Count Rate')
    ax2.set_ylim(1, 2e6)
    ax2.legend(fontsize=9)
    ax2.grid(True, alpha=0.3)

    # Add annotation for saturation
    sat_indices = np.where(saturation_mask)[0]
    if len(sat_indices) > 0:
        sat_mid = time_min[sat_indices[len(sat_indices) // 2]]
        ax2.annotate('SATURATED\n(zero counts)',
                     xy=(sat_mid, 1), fontsize=10, ha='center',
                     color='red', fontweight='bold',
                     bbox=dict(boxstyle='round,pad=0.3', facecolor='lightyellow'))

    # Panel 3: Cross-section view of belt with orbit
    ax3 = fig.add_subplot(2, 2, 3, aspect='equal')

    # Earth
    earth_theta = np.linspace(0, 2 * np.pi, 200)
    ax3.fill(R_EARTH * np.cos(earth_theta) / R_EARTH,
             R_EARTH * np.sin(earth_theta) / R_EARTH,
             color='#1a3d5c', alpha=0.8)
    ax3.plot(np.cos(earth_theta), np.sin(earth_theta), 'b-', linewidth=1)

    # Radiation belt (toroidal cross-section in meridional plane)
    r_range = np.linspace(1.0, 3.0, 200)
    lat_range = np.linspace(-np.pi / 2, np.pi / 2, 200)
    R, LAT = np.meshgrid(r_range, lat_range)

    # Dipole L-shell: r = L * cos^2(lat)
    # Radiation peaks at L = 1.5 Re
    L_local = R / np.cos(LAT)**2
    belt_intensity = np.exp(-(L_local - 1.5)**2 / (2 * 0.3**2))
    # Confine to trapped particle region (latitude < ~60°)
    belt_intensity *= np.cos(LAT)**4

    X = R * np.cos(LAT)
    Y = R * np.sin(LAT)
    ax3.contourf(X, Y, belt_intensity, levels=20, cmap='YlOrRd', alpha=0.4)

    # Dipole field lines
    for L in [1.2, 1.5, 2.0, 2.5, 3.0]:
        fl_lat = np.linspace(-np.pi / 3, np.pi / 3, 200)
        fl_r = L * np.cos(fl_lat)**2
        fl_x = fl_r * np.cos(fl_lat)
        fl_y = fl_r * np.sin(fl_lat)
        ax3.plot(fl_x, fl_y, 'b-', alpha=0.15, linewidth=0.5)

    # Explorer 1 orbit (projected onto meridional plane)
    orbit_x = radius / R_EARTH * np.cos(theta * 0.4)  # compress for visualization
    orbit_y = radius / R_EARTH * np.sin(theta * 0.4)
    ax3.plot(orbit_x, orbit_y, 'g-', linewidth=1.5, label='Explorer 1 orbit')

    # Mark position at several times
    for idx in [0, 250, 500, 750]:
        marker = 'r*' if saturation_mask[idx] else 'go'
        ax3.plot(orbit_x[idx], orbit_y[idx], marker, markersize=8)

    ax3.set_xlabel('Distance (Earth radii)')
    ax3.set_ylabel('Distance (Earth radii)')
    ax3.set_title('Radiation Belt Cross-Section')
    ax3.set_xlim(-0.5, 3.5)
    ax3.set_ylim(-2.0, 2.0)
    ax3.legend(fontsize=8)
    ax3.grid(True, alpha=0.2)

    # Panel 4: Information panel
    ax4 = fig.add_subplot(2, 2, 4)
    ax4.axis('off')

    info_text = f"""
    EXPLORER 1 — MISSION PARAMETERS
    ════════════════════════════════════════

    Launch:        January 31, 1958
    Vehicle:       Juno I (modified Redstone)
    Mass:          13.97 kg
    Orbit:         {perigee} × {apogee} km
    Inclination:   {inclination}°
    Period:        {period_min:.1f} minutes

    GEIGER COUNTER (Type 314)
    ════════════════════════════════════════

    Dead time (τ):   {tau * 1e6:.0f} μs
    Max countable:   {1/tau:.0f} counts/sec
    Belt peak flux:  ~10⁶ counts/sec
    Measured at peak: ≈ 0 (SATURATED)

    THREE-WAY COLLABORATION
    ════════════════════════════════════════

    Army ABMA:       Juno I rocket (Huntsville, AL)
    JPL:             Satellite (Pasadena, CA)
    U of Iowa:       Instruments (Iowa City, IA)

    DISCOVERY
    ════════════════════════════════════════

    Zero counts ≠ no radiation
    Zero counts = too much radiation

    The absence indicates the presence.
    Van Allen belts: discovered by paradox.
    """

    ax4.text(0.05, 0.95, info_text, transform=ax4.transAxes,
             fontsize=9, fontfamily='monospace', verticalalignment='top',
             bbox=dict(boxstyle='round,pad=0.5', facecolor='#1a1a2e', alpha=0.9),
             color='#00ff41')

    plt.tight_layout()

    if save_mode:
        plt.savefig('orbit-belt-crossing.png', dpi=150, bbox_inches='tight')
        print("Saved to orbit-belt-crossing.png")
    else:
        plt.show()

    # --- Print orbital summary ---
    print("\n" + "=" * 60)
    print("EXPLORER 1 ORBIT & RADIATION BELT CROSSING")
    print("=" * 60)
    print(f"\nOrbital period:      {period_min:.1f} minutes")
    print(f"Perigee altitude:    {perigee} km")
    print(f"Apogee altitude:     {apogee} km")
    print(f"Belt peak altitude:  ~1,500 km")
    print(f"\nTime in belt (>50% intensity): {np.sum(intensity > 0.5) / len(intensity) * period_min:.1f} min per orbit")
    print(f"Time saturated (zero counts):  {np.sum(saturation_mask) / len(saturation_mask) * period_min:.1f} min per orbit")
    print(f"\nThe satellite crosses the inner belt on EVERY orbit.")
    print(f"Two crossings per orbit: ascending and descending.")
    print(f"Each crossing: Geiger counter goes from counting to saturated to counting.")
    print(f"\nThis repeating pattern convinced Van Allen it was not a malfunction.")
    print(f"A broken instrument would stay broken. This one recovered every time.")

if __name__ == '__main__':
    main()
