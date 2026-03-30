#!/usr/bin/env python3
"""
Explorer 7 — Bolometer Orbital Simulation
=========================================================================
Mission 1.12: Explorer 7 (Goddard SFC / Juno II), October 13, 1959
SUOMI-PARENT BOLOMETER — Black and White Hemispheric Sensors

Simulates Explorer 7's elliptical orbit (573 × 1073 km) with bolometer
readings around one complete orbit. The black hemisphere absorbs all
incoming radiation (solar + Earth reflected + Earth thermal). The white
hemisphere reflects visible light and absorbs only thermal infrared.

The difference between the two readings isolates the solar and reflected
components from the thermal component — Suomi's key insight for
measuring the radiation budget from space.

Physics:
  - Orbit: 573 × 1073 km elliptical, period ~101.2 minutes
  - Radiation sources: direct solar, Earth albedo (reflected), Earth thermal
  - Black bolometer: absorptance ~0.97 for all wavelengths
  - White bolometer: reflectance ~0.90 for visible, absorptance ~0.90 for IR
  - Temperature: T = (absorbed_flux / (epsilon * sigma))^0.25

This produces:
  1. Orbit ground track with day/night terminator
  2. Black vs white bolometer temperature around one orbit
  3. Radiation components: solar, reflected, thermal
  4. Energy budget: absorbed vs emitted for each sensor

Requires: numpy, matplotlib
Run: python3 bolometer-orbit.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# =========================================================================
# Constants
# =========================================================================
S0 = 1361.0           # Solar constant (W/m²)
SIGMA = 5.670374e-8   # Stefan-Boltzmann constant
R_EARTH = 6.371e6     # Earth radius (m)
MU = 3.986e14         # Earth gravitational parameter (m³/s²)

# Orbit parameters (Explorer 7)
PERIGEE_ALT = 573e3   # Perigee altitude (m)
APOGEE_ALT = 1073e3   # Apogee altitude (m)
r_p = R_EARTH + PERIGEE_ALT
r_a = R_EARTH + APOGEE_ALT
a = (r_p + r_a) / 2   # Semi-major axis
e = (r_a - r_p) / (r_a + r_p)  # Eccentricity
T_orbit = 2 * np.pi * np.sqrt(a**3 / MU)  # Orbital period (s)

# Bolometer properties
ALPHA_BLACK = 0.97    # Black hemisphere absorptance (all wavelengths)
ALPHA_WHITE_VIS = 0.10  # White hemisphere absorptance (visible)
ALPHA_WHITE_IR = 0.90   # White hemisphere absorptance (infrared)
EPSILON_BLACK = 0.97  # Black emissivity
EPSILON_WHITE = 0.90  # White emissivity

# Earth properties
ALBEDO = 0.30         # Earth mean albedo
T_EARTH = 255.0       # Earth effective temperature (K)
EARTH_IR = SIGMA * T_EARTH**4  # ~240 W/m²

MASS_SC = 41.5        # Spacecraft mass (kg)

# =========================================================================
# Orbital Mechanics
# =========================================================================
def orbit_radius(theta, a, e):
    """Orbital radius at true anomaly theta."""
    return a * (1 - e**2) / (1 + e * np.cos(theta))

def mean_to_true(M, e, tol=1e-10):
    """Convert mean anomaly to true anomaly via Kepler's equation."""
    # Solve M = E - e*sin(E) for E, then convert to true anomaly
    E = M.copy()
    for _ in range(50):
        dE = (M - E + e * np.sin(E)) / (1 - e * np.cos(E))
        E += dE
        if np.max(np.abs(dE)) < tol:
            break
    # True anomaly from eccentric anomaly
    theta = 2 * np.arctan2(np.sqrt(1 + e) * np.sin(E / 2),
                            np.sqrt(1 - e) * np.cos(E / 2))
    return theta

# =========================================================================
# Simulation
# =========================================================================
N_points = 500
time_s = np.linspace(0, T_orbit, N_points)
time_min = time_s / 60.0

# Mean anomaly
M = 2 * np.pi * time_s / T_orbit

# True anomaly
theta = mean_to_true(M, e)

# Orbital radius
r = orbit_radius(theta, a, e)
alt = (r - R_EARTH) / 1000  # altitude in km

# Sun angle (simplified: sun fixed in +x direction)
# Spacecraft position angle from subsolar point
sun_angle = theta  # simplified model

# View factor: fraction of sky occupied by Earth
# For a sphere viewed from distance r: Omega = 2*pi*(1 - sqrt(1 - (R/r)^2))
earth_half_angle = np.arcsin(R_EARTH / r)
earth_solid_angle = 2 * np.pi * (1 - np.cos(earth_half_angle))
earth_view_factor = earth_solid_angle / (2 * np.pi)  # hemisphere normalization

# =========================================================================
# Radiation Sources
# =========================================================================

# 1. Direct solar (when sunlit)
# Sunlit fraction: depends on whether spacecraft is in Earth's shadow
# Simplified: shadow when angle is in the eclipse zone
shadow_half_angle = np.arcsin(R_EARTH / r)
in_shadow = np.abs(np.pi - sun_angle) < shadow_half_angle
sunlit = ~in_shadow

direct_solar = S0 * sunlit.astype(float)

# 2. Earth reflected (albedo)
# Reflected sunlight from the sunlit portion of Earth visible to spacecraft
# Maximum when directly above subsolar point, zero on night side
cos_sun_angle = np.cos(sun_angle)
illuminated_fraction = np.maximum(cos_sun_angle, 0)
earth_reflected = ALBEDO * S0 * illuminated_fraction * earth_view_factor

# 3. Earth thermal emission (always present)
earth_thermal = EARTH_IR * earth_view_factor

# =========================================================================
# Bolometer Temperatures
# =========================================================================

# Black bolometer absorbs everything
flux_black = (ALPHA_BLACK * direct_solar * 0.25 +  # 1/4 = hemisphere average
              ALPHA_BLACK * earth_reflected +
              ALPHA_BLACK * earth_thermal)

T_black = (flux_black / (EPSILON_BLACK * SIGMA))**0.25
# Clip to reasonable range
T_black = np.clip(T_black, 50, 500)

# White bolometer: reflects visible, absorbs thermal
flux_white = (ALPHA_WHITE_VIS * direct_solar * 0.25 +
              ALPHA_WHITE_VIS * earth_reflected +
              ALPHA_WHITE_IR * earth_thermal)

T_white = (flux_white / (EPSILON_WHITE * SIGMA))**0.25
T_white = np.clip(T_white, 50, 500)

# =========================================================================
# Plotting
# =========================================================================
fig = plt.figure(figsize=(16, 14))
fig.suptitle("Explorer 7 — Suomi-Parent Bolometer Simulation\n"
             f"Orbit: {PERIGEE_ALT/1000:.0f} × {APOGEE_ALT/1000:.0f} km, "
             f"Period: {T_orbit/60:.1f} min, Mass: {MASS_SC} kg",
             fontsize=14, fontweight='bold', color='#E8D060')
fig.patch.set_facecolor('#0a0a15')

gs = gridspec.GridSpec(3, 2, hspace=0.35, wspace=0.30)

# --- Plot 1: Orbital altitude ---
ax1 = fig.add_subplot(gs[0, 0])
ax1.set_facecolor('#0d0d20')

ax1.plot(time_min, alt, color='#2040AA', linewidth=2, label='Altitude')
ax1.axhline(PERIGEE_ALT/1000, color='#2040AA', linewidth=0.8, linestyle=':', alpha=0.5)
ax1.axhline(APOGEE_ALT/1000, color='#2040AA', linewidth=0.8, linestyle=':', alpha=0.5)
ax1.text(2, PERIGEE_ALT/1000 + 10, f'Perigee: {PERIGEE_ALT/1000:.0f} km',
         fontsize=8, color='#2040AA', alpha=0.7)
ax1.text(2, APOGEE_ALT/1000 + 10, f'Apogee: {APOGEE_ALT/1000:.0f} km',
         fontsize=8, color='#2040AA', alpha=0.7)

# Shadow regions
for i in range(len(time_min) - 1):
    if in_shadow[i]:
        ax1.axvspan(time_min[i], time_min[i+1], alpha=0.1, color='#333')

ax1.set_xlabel('Orbit time (minutes)', color='#aaa', fontsize=10)
ax1.set_ylabel('Altitude (km)', color='#ddd', fontsize=10)
ax1.set_title('Orbital Altitude Profile', color='#ddd', fontsize=11)
ax1.tick_params(colors='#888')
ax1.set_xlim(0, T_orbit/60)
for spine in ax1.spines.values():
    spine.set_color('#333')

# --- Plot 2: Bolometer temperatures ---
ax2 = fig.add_subplot(gs[0, 1])
ax2.set_facecolor('#0d0d20')

ax2.plot(time_min, T_black, color='#CC4020', linewidth=2, label='Black bolometer')
ax2.plot(time_min, T_white, color='#E8D060', linewidth=2, label='White bolometer')
ax2.fill_between(time_min, T_white, T_black, alpha=0.1, color='#CC8040',
                 label='Difference (solar component)')

# Shadow regions
for i in range(len(time_min) - 1):
    if in_shadow[i]:
        ax2.axvspan(time_min[i], time_min[i+1], alpha=0.1, color='#333')

ax2.set_xlabel('Orbit time (minutes)', color='#aaa', fontsize=10)
ax2.set_ylabel('Temperature (K)', color='#ddd', fontsize=10)
ax2.set_title('Bolometer Temperatures Around One Orbit', color='#ddd', fontsize=11)
ax2.legend(fontsize=8, facecolor='#151530', edgecolor='#333', labelcolor='#ccc')
ax2.tick_params(colors='#888')
ax2.set_xlim(0, T_orbit/60)
for spine in ax2.spines.values():
    spine.set_color('#333')

# --- Plot 3: Radiation components ---
ax3 = fig.add_subplot(gs[1, 0])
ax3.set_facecolor('#0d0d20')

ax3.plot(time_min, direct_solar * 0.25, color='#E8D060', linewidth=1.5,
         label='Direct solar (hemisphere avg)')
ax3.plot(time_min, earth_reflected, color='#8AAA70', linewidth=1.5,
         label='Earth reflected (albedo)')
ax3.plot(time_min, earth_thermal, color='#CC4020', linewidth=1.5,
         label='Earth thermal (IR)')

# Stacked total
total = direct_solar * 0.25 + earth_reflected + earth_thermal
ax3.fill_between(time_min, 0, earth_thermal, alpha=0.1, color='#CC4020')
ax3.fill_between(time_min, earth_thermal, earth_thermal + earth_reflected,
                 alpha=0.1, color='#8AAA70')
ax3.fill_between(time_min, earth_thermal + earth_reflected, total,
                 alpha=0.1, color='#E8D060')

for i in range(len(time_min) - 1):
    if in_shadow[i]:
        ax3.axvspan(time_min[i], time_min[i+1], alpha=0.1, color='#333')

ax3.set_xlabel('Orbit time (minutes)', color='#aaa', fontsize=10)
ax3.set_ylabel('Radiation flux (W/m²)', color='#ddd', fontsize=10)
ax3.set_title('Radiation Components at Spacecraft', color='#ddd', fontsize=11)
ax3.legend(fontsize=8, facecolor='#151530', edgecolor='#333', labelcolor='#ccc')
ax3.tick_params(colors='#888')
ax3.set_xlim(0, T_orbit/60)
for spine in ax3.spines.values():
    spine.set_color('#333')

# --- Plot 4: Black vs white absorbed flux ---
ax4 = fig.add_subplot(gs[1, 1])
ax4.set_facecolor('#0d0d20')

ax4.plot(time_min, flux_black, color='#CC4020', linewidth=2,
         label='Black bolometer absorbed')
ax4.plot(time_min, flux_white, color='#E8D060', linewidth=2,
         label='White bolometer absorbed')

# The difference isolates the visible component
flux_diff = flux_black - flux_white
ax4.plot(time_min, flux_diff, color='#2040AA', linewidth=1.5, linestyle='--',
         label='Difference (visible component)')

for i in range(len(time_min) - 1):
    if in_shadow[i]:
        ax4.axvspan(time_min[i], time_min[i+1], alpha=0.1, color='#333')

ax4.set_xlabel('Orbit time (minutes)', color='#aaa', fontsize=10)
ax4.set_ylabel('Absorbed flux (W/m²)', color='#ddd', fontsize=10)
ax4.set_title("Suomi's Insight: Black − White = Solar Component", color='#ddd', fontsize=11)
ax4.legend(fontsize=8, facecolor='#151530', edgecolor='#333', labelcolor='#ccc')
ax4.tick_params(colors='#888')
ax4.set_xlim(0, T_orbit/60)
for spine in ax4.spines.values():
    spine.set_color('#333')

# --- Plot 5: Temperature difference and science ---
ax5 = fig.add_subplot(gs[2, :])
ax5.set_facecolor('#0d0d20')

T_diff = T_black - T_white
ax5.plot(time_min, T_diff, color='#CC8040', linewidth=2.5,
         label='T_black − T_white')

# Annotate key regions
sunlit_mask = sunlit.astype(float)
ax5.fill_between(time_min, 0, T_diff * sunlit_mask, alpha=0.15, color='#E8D060',
                 label='Sunlit: solar heating visible in T difference')
shadow_T_diff = T_diff * in_shadow.astype(float)
ax5.fill_between(time_min, 0, shadow_T_diff, alpha=0.15, color='#2040AA',
                 label='Shadow: only thermal — T difference near zero')

ax5.axhline(0, color='#444', linewidth=0.5)

# Add explanation text
ax5.text(T_orbit/120, max(T_diff) * 0.85,
         "When sunlit: Black absorbs solar + thermal.\n"
         "White absorbs only thermal → large T difference.\n"
         "In shadow: Both see only Earth thermal → small difference.\n"
         "This separation is Suomi's breakthrough.",
         fontsize=9, color='#aaa', fontfamily='monospace',
         bbox=dict(boxstyle='round', facecolor='#151530', edgecolor='#333', alpha=0.8))

ax5.set_xlabel('Orbit time (minutes)', color='#aaa', fontsize=10)
ax5.set_ylabel('Temperature difference (K)', color='#ddd', fontsize=10)
ax5.set_title('Temperature Difference = Radiation Budget Measurement', color='#ddd', fontsize=11)
ax5.legend(fontsize=8, facecolor='#151530', edgecolor='#333', labelcolor='#ccc',
           loc='upper right')
ax5.tick_params(colors='#888')
ax5.set_xlim(0, T_orbit/60)
for spine in ax5.spines.values():
    spine.set_color('#333')

plt.savefig('bolometer-orbit.png', dpi=150, bbox_inches='tight',
            facecolor='#0a0a15', edgecolor='none')
print("Saved: bolometer-orbit.png")

# =========================================================================
# Summary
# =========================================================================
print("\n" + "=" * 60)
print("EXPLORER 7 BOLOMETER SIMULATION SUMMARY")
print("=" * 60)
print(f"Orbit: {PERIGEE_ALT/1000:.0f} × {APOGEE_ALT/1000:.0f} km")
print(f"Period: {T_orbit/60:.1f} min")
print(f"Eccentricity: {e:.4f}")
print(f"Semi-major axis: {a/1000:.0f} km")
print(f"")
print(f"Black bolometer T range: {np.min(T_black):.0f} – {np.max(T_black):.0f} K")
print(f"White bolometer T range: {np.min(T_white):.0f} – {np.max(T_white):.0f} K")
print(f"Max T difference (sunlit): {np.max(T_diff):.1f} K")
print(f"Min T difference (shadow): {np.min(T_diff[in_shadow]):.1f} K" if np.any(in_shadow) else "No shadow in this orbit config")
print(f"")
print(f"Mean Earth thermal flux: {np.mean(earth_thermal):.0f} W/m²")
print(f"Mean reflected flux: {np.mean(earth_reflected):.0f} W/m²")
print(f"Mean direct solar flux: {np.mean(direct_solar * 0.25):.0f} W/m²")
print("=" * 60)

plt.show()
