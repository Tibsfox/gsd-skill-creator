#!/usr/bin/env python3
"""
Explorer 1 vs Explorer 3: Data Coverage Comparison
Mission 1.9 — Explorer 3 (confirmed Van Allen belts with tape recorder)

This simulation compares the data coverage between Explorer 1 (real-time
telemetry only) and Explorer 3 (continuous tape recording + compressed
playback). It shows:

1. Ground station visibility windows (~10% of orbit for Explorer 1)
2. Radiation intensity profile for a complete orbit
3. How the gaps in Explorer 1's data could hide the belt structure
4. How Explorer 3's tape recorder revealed the complete picture

Explorer 1 could only transmit data when visible from a ground station.
With stations spread around the equator, a satellite in a 33-degree
inclination orbit is visible from any given station for only ~5-10
minutes per 115-minute orbit. Total coverage: roughly 10-15% of
each orbit.

Explorer 3's tape recorder changed this: it recorded continuously
for the entire orbit and played back compressed (4:1) over ground
stations, giving scientists 100% data coverage for the first time.

Run: python3 recording-comparison.py
Requires: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# ============================================
# ORBITAL PARAMETERS
# ============================================

# Explorer 1: 358 x 2,550 km, 114.8 min period, 33.24 deg inclination
E1_PERIGEE = 358    # km
E1_APOGEE = 2550    # km
E1_PERIOD = 114.8   # minutes
E1_INCL = 33.24     # degrees

# Explorer 3: 186 x 2,799 km, 115.7 min period, 33.15 deg inclination
E3_PERIGEE = 186    # km
E3_APOGEE = 2799    # km
E3_PERIOD = 115.7   # minutes
E3_INCL = 33.15     # degrees

R_EARTH = 6371      # km

# ============================================
# RADIATION BELT MODEL
# ============================================

def radiation_intensity(altitude_km, L_shell=None):
    """
    Simplified radiation belt intensity model.
    Returns relative intensity (0-1) based on altitude.

    The inner Van Allen belt peaks at ~1.5 Earth radii (3,000 km altitude).
    Explorer 1 and 3 orbits crossed through the lower edge of the belt
    near their apogees.
    """
    r = (R_EARTH + altitude_km) / R_EARTH  # Earth radii

    # Inner belt: peaks around L=1.5 (3,000 km altitude)
    belt_center = 1.5
    belt_width = 0.3
    intensity = np.exp(-((r - belt_center) ** 2) / (2 * belt_width ** 2))

    # Scale to peak intensity
    return intensity


def orbit_altitude(true_anomaly, perigee_km, apogee_km):
    """
    Calculate altitude at a given true anomaly for an elliptical orbit.

    true_anomaly: angle from perigee (radians)
    Returns altitude in km.
    """
    r_p = R_EARTH + perigee_km
    r_a = R_EARTH + apogee_km
    a = (r_p + r_a) / 2                    # semi-major axis
    e = (r_a - r_p) / (r_a + r_p)          # eccentricity
    r = a * (1 - e**2) / (1 + e * np.cos(true_anomaly))
    return r - R_EARTH


# ============================================
# GROUND STATION COVERAGE
# ============================================

def ground_station_coverage(true_anomaly, num_stations=6):
    """
    Model ground station visibility as a function of orbital position.

    Simplified: stations are evenly spaced in longitude, and the satellite
    is visible from a station for ~10 degrees of true anomaly per pass.
    Total coverage: ~10-15% of orbit.
    """
    coverage = np.zeros_like(true_anomaly)

    # Station positions (in terms of true anomaly — simplified)
    station_spacing = 2 * np.pi / num_stations
    station_window = np.radians(12)  # ~12 degrees visibility per station

    for i in range(num_stations):
        station_pos = i * station_spacing
        # Gaussian window centered on station
        delta = np.abs(np.mod(true_anomaly - station_pos + np.pi, 2*np.pi) - np.pi)
        coverage = np.maximum(coverage,
                              np.exp(-(delta**2) / (2 * (station_window/2)**2)))

    return coverage


# ============================================
# GEIGER COUNTER RESPONSE
# ============================================

def geiger_response(true_intensity, dead_time_us=100):
    """
    Geiger counter response with dead time saturation.

    The measured rate N_m = N_t * exp(-N_t * tau) where tau is dead time.
    At high true rates, the measured rate drops to zero (saturation).

    We model the Geiger response as:
    - Linear below a threshold
    - Dropping toward zero at high intensities (saturation)
    """
    # Normalize intensity to count rate
    max_rate = 50000  # counts/sec at peak belt intensity
    true_rate = true_intensity * max_rate

    # Dead time in seconds
    tau = dead_time_us * 1e-6

    # Paralyzable detector model
    measured_rate = true_rate * np.exp(-true_rate * tau)

    # Normalize back
    measured = measured_rate / max_rate
    return np.clip(measured, 0, 1)


# ============================================
# SIMULATION
# ============================================

# One complete orbit
theta = np.linspace(0, 2 * np.pi, 1000)

# Explorer 1 orbit
e1_alt = orbit_altitude(theta, E1_PERIGEE, E1_APOGEE)
e1_radiation = radiation_intensity(e1_alt)
e1_geiger = geiger_response(e1_radiation)
e1_coverage = ground_station_coverage(theta, num_stations=6)
e1_data = e1_geiger * e1_coverage  # Only see data during coverage windows

# Explorer 3 orbit
e3_alt = orbit_altitude(theta, E3_PERIGEE, E3_APOGEE)
e3_radiation = radiation_intensity(e3_alt)
e3_geiger = geiger_response(e3_radiation)
# Explorer 3: tape records everything — full coverage
e3_data = e3_geiger  # Complete orbit, no gaps

# ============================================
# PLOTTING
# ============================================

fig, axes = plt.subplots(3, 1, figsize=(14, 12))
fig.patch.set_facecolor('#0a0a1a')
fig.suptitle('Explorer 1 vs Explorer 3: Data Coverage Comparison',
             color='#D4A830', fontsize=16, fontweight='bold', y=0.98)

# Shared styling
for ax in axes:
    ax.set_facecolor('#080810')
    ax.tick_params(colors='#888888')
    for spine in ax.spines.values():
        spine.set_color('#333333')
    ax.grid(True, alpha=0.15, color='#444444')

# --- Panel 1: Altitude and True Radiation ---
ax1 = axes[0]
time_min = theta / (2 * np.pi) * E3_PERIOD  # Time in minutes

ax1_alt = ax1.twinx()
ax1_alt.fill_between(time_min, e3_alt, alpha=0.1, color='#4488CC',
                      label='Explorer 3 altitude')
ax1_alt.plot(time_min, e3_alt, color='#4488CC', alpha=0.4, linewidth=0.8)
ax1_alt.fill_between(time_min, e1_alt, alpha=0.1, color='#CC8844',
                      label='Explorer 1 altitude')
ax1_alt.plot(time_min, e1_alt, color='#CC8844', alpha=0.4, linewidth=0.8)
ax1_alt.set_ylabel('Altitude (km)', color='#888888')
ax1_alt.tick_params(colors='#888888')

ax1.plot(time_min, e3_radiation, color='#CC3333', linewidth=2,
         label='True radiation intensity')
ax1.fill_between(time_min, e3_radiation, alpha=0.15, color='#CC3333')
ax1.set_ylabel('Radiation Intensity', color='#888888')
ax1.set_title('True Radiation Profile (What Actually Exists)',
              color='#D0D4D8', fontsize=12)
ax1.legend(loc='upper left', facecolor='#080810', edgecolor='#333333',
           labelcolor='#AAAAAA')
ax1_alt.legend(loc='upper right', facecolor='#080810', edgecolor='#333333',
               labelcolor='#AAAAAA')

# --- Panel 2: Explorer 1 (gaps) ---
ax2 = axes[1]
# Show the coverage windows
ax2.fill_between(time_min, e1_coverage * 0.05, alpha=0.2, color='#D4A830',
                  label='Ground station visibility')

# Show the gapped data
ax2.plot(time_min, e1_data, color='#D4A830', linewidth=1.5,
         label='Explorer 1 measured data')
ax2.fill_between(time_min, e1_data, alpha=0.3, color='#D4A830')

# Mark the gaps
gap_mask = e1_coverage < 0.1
ax2.fill_between(time_min, 0, 1, where=gap_mask, alpha=0.08,
                  color='#FF0000', label='No coverage (data lost)')

ax2.set_ylabel('Measured Intensity', color='#888888')
ax2.set_title('Explorer 1: Real-Time Only (gaps in coverage)',
              color='#D0D4D8', fontsize=12)
ax2.set_ylim(-0.05, 1.1)
ax2.legend(loc='upper right', facecolor='#080810', edgecolor='#333333',
           labelcolor='#AAAAAA', fontsize=9)
ax2.text(E1_PERIOD * 0.5, 0.95,
         f'Coverage: ~{np.mean(e1_coverage > 0.3)*100:.0f}% of orbit',
         color='#D4A830', fontsize=10, ha='center', va='top',
         bbox=dict(boxstyle='round,pad=0.3', facecolor='#0a0a1a',
                   edgecolor='#D4A830', alpha=0.8))

# --- Panel 3: Explorer 3 (complete) ---
ax3 = axes[2]
ax3.plot(time_min, e3_data, color='#40CC40', linewidth=1.5,
         label='Explorer 3 measured data (tape recorded)')
ax3.fill_between(time_min, e3_data, alpha=0.3, color='#40CC40')

# Show where saturation occurs
saturation_mask = (e3_radiation > 0.7) & (e3_geiger < 0.1)
ax3.fill_between(time_min, 0, 1, where=saturation_mask, alpha=0.15,
                  color='#CC3333', label='Geiger saturation zone')

# Annotate the saturation
sat_indices = np.where(saturation_mask)[0]
if len(sat_indices) > 0:
    sat_center = time_min[sat_indices[len(sat_indices)//2]]
    ax3.annotate('Geiger counter saturated\n(zero counts = maximum radiation)',
                 xy=(sat_center, 0.02),
                 xytext=(sat_center + 15, 0.5),
                 color='#CC3333', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#CC3333'),
                 bbox=dict(boxstyle='round,pad=0.3', facecolor='#0a0a1a',
                           edgecolor='#CC3333', alpha=0.8))

ax3.set_ylabel('Measured Intensity', color='#888888')
ax3.set_xlabel('Time (minutes)', color='#888888')
ax3.set_title('Explorer 3: Tape Recorded (complete orbit coverage)',
              color='#D0D4D8', fontsize=12)
ax3.set_ylim(-0.05, 1.1)
ax3.legend(loc='upper right', facecolor='#080810', edgecolor='#333333',
           labelcolor='#AAAAAA', fontsize=9)
ax3.text(E3_PERIOD * 0.5, 0.95,
         'Coverage: 100% of orbit (tape recorder)',
         color='#40CC40', fontsize=10, ha='center', va='top',
         bbox=dict(boxstyle='round,pad=0.3', facecolor='#0a0a1a',
                   edgecolor='#40CC40', alpha=0.8))

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.savefig('recording-comparison.png', dpi=150, facecolor=fig.get_facecolor(),
            bbox_inches='tight')
plt.show()

# ============================================
# TEXT SUMMARY
# ============================================

print()
print('=' * 70)
print('Explorer 1 vs Explorer 3: Data Coverage Comparison')
print('=' * 70)
print()
print(f'Explorer 1: {E1_PERIGEE} x {E1_APOGEE} km, {E1_PERIOD:.1f} min period')
print(f'Explorer 3: {E3_PERIGEE} x {E3_APOGEE} km, {E3_PERIOD:.1f} min period')
print()
print(f'Explorer 1 ground station coverage: ~{np.mean(e1_coverage > 0.3)*100:.0f}% of orbit')
print(f'Explorer 3 tape recorder coverage:  100% of orbit')
print()
print(f'Explorer 1 peak measured radiation: {np.max(e1_data):.3f} (normalized)')
print(f'Explorer 3 peak measured radiation: {np.max(e3_data):.3f} (normalized)')
print()
print('The critical difference:')
print(f'  Explorer 1 data points in belt region: {np.sum((e1_data > 0.01) & (e3_radiation > 0.3))}/{np.sum(e3_radiation > 0.3)}')
print(f'  Explorer 3 data points in belt region: {np.sum((e3_data > 0.01) & (e3_radiation > 0.3))}/{np.sum(e3_radiation > 0.3)} (plus saturation zones)')
print()
print('Explorer 1 could INFER the belts from the saturation pattern,')
print('but the gaps in coverage made the inference uncertain.')
print('Explorer 3 CONFIRMED the belts with a complete radiation profile.')
print('The tape recorder transformed an inference into a discovery.')
