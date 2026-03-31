#!/usr/bin/env python3
"""
TIROS-1 — Camera Coverage and Image Geometry
=========================================================================
Mission 1.15: TIROS-1 (NASA / Thor-Able), April 1, 1960
FIRST WEATHER SATELLITE — 120 kg drum, two vidicon TV cameras

Computes the vidicon camera coverage geometry from TIROS-1's orbit.
TIROS-1 carried two cameras: a wide-angle (104 degree FOV, ~800m resolution)
and a narrow-angle (12 degree FOV, ~80m resolution). This simulation
calculates the swath width, ground resolution, and footprint geometry
for both cameras at various orbital altitudes and look angles.

This produces:
  1. Camera footprint on Earth's surface — wide-angle vs narrow-angle
  2. Ground resolution vs look angle (nadir to limb)
  3. Swath width vs orbital altitude
  4. Image distortion at off-nadir angles (obliquity effect)
  5. Daily coverage accumulation over multiple orbits

Requires: numpy, matplotlib
Run: python3 image-geometry.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# =========================================================================
# Physical Constants & TIROS-1 Parameters
# =========================================================================
R_EARTH = 6371.0          # Earth radius (km)
PI = np.pi

# TIROS-1 orbit
ORBIT_PERI = 693.0        # Perigee altitude (km)
ORBIT_APO = 756.0         # Apogee altitude (km)
ORBIT_MID = (ORBIT_PERI + ORBIT_APO) / 2.0  # ~724.5 km
INCLINATION = 48.4        # Orbital inclination (degrees)
PERIOD_MIN = 99.2         # Orbital period (minutes)
MASS = 120.0              # Satellite mass (kg)

# Wide-angle camera
WA_FOV = 104.0            # Field of view (degrees)
WA_LINES = 500            # Approximate TV lines
WA_FOCAL = 1.27           # Focal length (mm) — very short for wide angle
WA_FORMAT = 12.7           # Image format size (mm) — 0.5 inch vidicon

# Narrow-angle camera
NA_FOV = 12.0             # Field of view (degrees)
NA_LINES = 500            # Same line count = higher resolution
NA_FOCAL = 58.0           # Focal length (mm)
NA_FORMAT = 12.7           # Same format size


def swath_width(altitude_km, fov_deg):
    """Calculate ground swath width from orbital altitude and camera FOV.

    For a camera pointing at nadir, the swath width on a flat Earth is:
        W = 2 * h * tan(FOV/2)

    For a curved Earth, we use the arc length:
        central_angle = 2 * arcsin((h * sin(FOV/2)) / (R + h) * ...)
        W = R * central_angle
    """
    h = altitude_km
    half_fov = np.radians(fov_deg / 2.0)
    R = R_EARTH

    # On curved Earth: half-angle subtended at Earth center
    # Using the sine rule in the triangle: satellite, Earth center, footprint edge
    rho = np.arcsin((R + h) / R * np.sin(half_fov))
    # Earth central angle
    lambda_c = PI - rho - half_fov
    # Swath half-width on surface
    swath_half = R * lambda_c

    return 2.0 * swath_half


def ground_resolution(altitude_km, fov_deg, num_lines, look_angle_deg=0):
    """Calculate ground pixel size (resolution) at a given look angle.

    At nadir (look_angle=0):
        pixel_size = swath_width / num_lines

    At off-nadir look angles, the pixel is stretched by:
        1/cos(look_angle) in the along-scan direction (geometric stretch)
        Additional range increase: slant_range / nadir_range
    """
    h = altitude_km
    theta = np.radians(look_angle_deg)

    # Slant range to ground point
    # From triangle: satellite, Earth center, ground point
    R = R_EARTH
    slant_range = np.sqrt((R + h) ** 2 + R ** 2 - 2 * R * (R + h) * np.cos(
        np.arcsin((R + h) / R * np.sin(theta)) - theta
    ))

    # For small angles, approximate:
    slant_range_approx = h / np.cos(theta) if abs(theta) < np.radians(80) else h * 10

    # IFOV (instantaneous field of view per pixel)
    ifov = np.radians(fov_deg) / num_lines

    # Ground pixel size at nadir
    nadir_pixel = h * ifov  # km

    # At off-nadir: pixel stretches
    if abs(look_angle_deg) < 80:
        pixel_along = nadir_pixel / np.cos(theta)
        pixel_cross = nadir_pixel / np.cos(theta)
    else:
        pixel_along = nadir_pixel * 10
        pixel_cross = nadir_pixel * 10

    return pixel_along, pixel_cross


# =========================================================================
# Plot 1: Camera Footprints — Wide-Angle vs Narrow-Angle
# =========================================================================

fig = plt.figure(figsize=(16, 12))
fig.suptitle('TIROS-1 Camera Coverage Geometry — Mission 1.15\n'
             'First Weather Satellite (April 1, 1960)',
             fontsize=14, fontweight='bold', y=0.98)

gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

# --- Footprint comparison ---
ax1 = fig.add_subplot(gs[0, 0])

# Wide-angle footprint at mid-orbit
wa_swath = swath_width(ORBIT_MID, WA_FOV)
na_swath = swath_width(ORBIT_MID, NA_FOV)

# Draw Earth surface (flat projection for simplicity)
theta_range = np.linspace(-wa_swath / 2, wa_swath / 2, 200)

# Wide-angle camera footprint (circle on ground)
wa_half = wa_swath / 2
wa_circle = plt.Circle((0, 0), wa_half, fill=True, alpha=0.2,
                        color='#4080CC', label=f'Wide-angle: {wa_swath:.0f} km')
ax1.add_patch(wa_circle)
wa_outline = plt.Circle((0, 0), wa_half, fill=False, color='#4080CC', linewidth=2)
ax1.add_patch(wa_outline)

# Narrow-angle camera footprint
na_half = na_swath / 2
na_circle = plt.Circle((0, 0), na_half, fill=True, alpha=0.3,
                        color='#CC6040', label=f'Narrow-angle: {na_swath:.0f} km')
ax1.add_patch(na_circle)
na_outline = plt.Circle((0, 0), na_half, fill=False, color='#CC6040', linewidth=2)
ax1.add_patch(na_outline)

# Satellite nadir point
ax1.plot(0, 0, 'k+', markersize=15, markeredgewidth=2)
ax1.text(5, 5, 'Nadir', fontsize=8, color='#333')

ax1.set_xlim(-wa_half * 1.3, wa_half * 1.3)
ax1.set_ylim(-wa_half * 1.3, wa_half * 1.3)
ax1.set_aspect('equal')
ax1.set_xlabel('Cross-track distance (km)')
ax1.set_ylabel('Along-track distance (km)')
ax1.set_title(f'Camera Footprints at {ORBIT_MID:.0f} km Altitude')
ax1.legend(loc='upper right', fontsize=8)
ax1.grid(True, alpha=0.3)

# =========================================================================
# Plot 2: Ground Resolution vs Look Angle
# =========================================================================
ax2 = fig.add_subplot(gs[0, 1])

look_angles = np.linspace(0, 50, 100)
wa_res = np.array([ground_resolution(ORBIT_MID, WA_FOV, WA_LINES, la)[0] * 1000
                   for la in look_angles])  # convert to meters
na_res = np.array([ground_resolution(ORBIT_MID, NA_FOV, NA_LINES, la)[0] * 1000
                   for la in look_angles])

ax2.plot(look_angles, wa_res, color='#4080CC', linewidth=2,
         label=f'Wide-angle ({WA_FOV}° FOV)')
ax2.plot(look_angles, na_res, color='#CC6040', linewidth=2,
         label=f'Narrow-angle ({NA_FOV}° FOV)')

ax2.axhline(y=wa_res[0], color='#4080CC', linestyle='--', alpha=0.4)
ax2.axhline(y=na_res[0], color='#CC6040', linestyle='--', alpha=0.4)
ax2.text(52, wa_res[0], f'{wa_res[0]:.0f} m', fontsize=8, color='#4080CC', va='center')
ax2.text(52, na_res[0], f'{na_res[0]:.0f} m', fontsize=8, color='#CC6040', va='center')

ax2.set_xlabel('Look Angle from Nadir (degrees)')
ax2.set_ylabel('Ground Resolution (meters)')
ax2.set_title('Ground Resolution vs Look Angle')
ax2.legend(fontsize=8)
ax2.grid(True, alpha=0.3)
ax2.set_xlim(0, 55)

# =========================================================================
# Plot 3: Swath Width vs Orbital Altitude
# =========================================================================
ax3 = fig.add_subplot(gs[1, 0])

altitudes = np.linspace(200, 1500, 200)
wa_swaths = np.array([swath_width(a, WA_FOV) for a in altitudes])
na_swaths = np.array([swath_width(a, NA_FOV) for a in altitudes])

ax3.plot(altitudes, wa_swaths, color='#4080CC', linewidth=2,
         label=f'Wide-angle ({WA_FOV}°)')
ax3.plot(altitudes, na_swaths, color='#CC6040', linewidth=2,
         label=f'Narrow-angle ({NA_FOV}°)')

# Mark TIROS-1's orbit
ax3.axvline(x=ORBIT_MID, color='#333', linestyle=':', alpha=0.6)
ax3.plot(ORBIT_MID, swath_width(ORBIT_MID, WA_FOV), 'o',
         color='#4080CC', markersize=8)
ax3.plot(ORBIT_MID, swath_width(ORBIT_MID, NA_FOV), 'o',
         color='#CC6040', markersize=8)
ax3.annotate(f'TIROS-1\n({ORBIT_MID:.0f} km)',
             xy=(ORBIT_MID, swath_width(ORBIT_MID, WA_FOV)),
             xytext=(ORBIT_MID + 100, swath_width(ORBIT_MID, WA_FOV) * 0.7),
             fontsize=8, arrowprops=dict(arrowstyle='->', color='#666'))

ax3.set_xlabel('Orbital Altitude (km)')
ax3.set_ylabel('Swath Width (km)')
ax3.set_title('Swath Width vs Altitude')
ax3.legend(fontsize=8)
ax3.grid(True, alpha=0.3)

# =========================================================================
# Plot 4: Image Distortion — Obliquity Effect
# =========================================================================
ax4 = fig.add_subplot(gs[1, 1])

# Show how a square grid on the ground appears distorted at off-nadir angles
angles_demo = [0, 15, 30, 45]
colors_demo = ['#4080CC', '#6090CC', '#8060AA', '#CC6040']

for idx, angle in enumerate(angles_demo):
    # A 100km square on the ground
    sq_x = np.array([0, 100, 100, 0, 0])
    sq_y = np.array([0, 0, 100, 100, 0])

    # Distortion: cos(angle) compression in look direction
    theta = np.radians(angle)
    if theta > 0:
        stretch = 1.0 / np.cos(theta)
    else:
        stretch = 1.0

    sq_x_dist = sq_x * stretch + idx * 180
    sq_y_dist = sq_y

    ax4.fill(sq_x_dist, sq_y_dist, alpha=0.2, color=colors_demo[idx])
    ax4.plot(sq_x_dist, sq_y_dist, color=colors_demo[idx], linewidth=2,
             label=f'{angle}° look angle ({stretch:.2f}x stretch)')

    # Show the pixel size
    pixel_km = ground_resolution(ORBIT_MID, WA_FOV, WA_LINES, angle)[0]
    ax4.text(sq_x_dist[0] + 10, -15, f'{pixel_km * 1000:.0f}m/px',
             fontsize=7, color=colors_demo[idx])

ax4.set_xlabel('Ground distance (km, with stretch)')
ax4.set_ylabel('Ground distance (km)')
ax4.set_title('Pixel Distortion at Off-Nadir Angles (100 km grid)')
ax4.legend(fontsize=7, loc='upper left')
ax4.set_aspect('equal')
ax4.grid(True, alpha=0.3)
ax4.set_xlim(-20, 750)
ax4.set_ylim(-30, 140)

# =========================================================================
# Summary text
# =========================================================================
fig.text(0.5, 0.01,
         f'TIROS-1: {ORBIT_PERI:.0f}×{ORBIT_APO:.0f} km orbit, '
         f'{INCLINATION}° inclination, {PERIOD_MIN:.1f} min period, '
         f'{MASS:.0f} kg — '
         f'Wide-angle swath: {swath_width(ORBIT_MID, WA_FOV):.0f} km, '
         f'Narrow-angle swath: {swath_width(ORBIT_MID, NA_FOV):.0f} km — '
         f'22,952 photos in 78 days',
         ha='center', fontsize=9, style='italic', color='#666')

plt.savefig('tiros1-image-geometry.png', dpi=150, bbox_inches='tight',
            facecolor='white')
print("Saved: tiros1-image-geometry.png")
plt.show()

# =========================================================================
# Console summary
# =========================================================================
print("\n" + "=" * 70)
print("TIROS-1 Camera Coverage Summary")
print("=" * 70)
print(f"\nOrbit: {ORBIT_PERI:.0f} x {ORBIT_APO:.0f} km, {INCLINATION}° inclination")
print(f"Period: {PERIOD_MIN:.1f} minutes")
print(f"Mid-altitude: {ORBIT_MID:.0f} km")
print(f"\nWide-angle camera ({WA_FOV}° FOV, f={WA_FOCAL} mm):")
print(f"  Swath width: {swath_width(ORBIT_MID, WA_FOV):.0f} km")
print(f"  Nadir resolution: {ground_resolution(ORBIT_MID, WA_FOV, WA_LINES)[0] * 1000:.0f} m")
print(f"  Resolution at 30° off-nadir: {ground_resolution(ORBIT_MID, WA_FOV, WA_LINES, 30)[0] * 1000:.0f} m")
print(f"\nNarrow-angle camera ({NA_FOV}° FOV, f={NA_FOCAL} mm):")
print(f"  Swath width: {swath_width(ORBIT_MID, NA_FOV):.0f} km")
print(f"  Nadir resolution: {ground_resolution(ORBIT_MID, NA_FOV, NA_LINES)[0] * 1000:.0f} m")
print(f"  Resolution at 30° off-nadir: {ground_resolution(ORBIT_MID, NA_FOV, NA_LINES, 30)[0] * 1000:.0f} m")
print(f"\nPhotos captured: 22,952 in 78 days ({22952 / 78:.0f} per day)")
print(f"Orbits per day: {24 * 60 / PERIOD_MIN:.1f}")
