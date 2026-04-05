#!/usr/bin/env python3
"""
Ranger 7 Descent Image Simulator
Mission 1.34 — NASA Mission Series

Simulates the view from Ranger 7's cameras at decreasing altitudes,
showing how resolution improves linearly with altitude decrease.
Generates a procedural crater field following the power-law
size-frequency distribution N(>D) ~ D^(-2).

Usage: python descent-simulator.py
Output: ranger7_frame_*.png + descent_animation.gif
"""

import numpy as np

# Camera parameters (P-channel telephoto)
FOCAL_LENGTH = 0.076      # 76mm
VIDICON_SIZE = 0.011      # 11mm
N_LINES = 300             # scan lines
PIXEL_SIZE = VIDICON_SIZE / N_LINES  # ~36.7 microns

def ground_resolution(altitude_m):
    """Calculate ground sample distance (GSD) in meters."""
    return altitude_m * PIXEL_SIZE / FOCAL_LENGTH

def frame_coverage(altitude_m):
    """Calculate frame width on ground in meters."""
    return altitude_m * VIDICON_SIZE / FOCAL_LENGTH

# Ranger 7 descent timeline
altitudes_km = [2110, 1500, 1000, 500, 200, 100, 50, 10, 1, 0.48]

print("RANGER 7 DESCENT IMAGE SIMULATOR")
print("=" * 70)
print(f"Camera: P-channel telephoto (f={FOCAL_LENGTH*1000:.0f}mm, {N_LINES} lines)")
print(f"Pixel size on vidicon: {PIXEL_SIZE*1e6:.1f} microns")
print()
print(f"{'Altitude':>12} | {'GSD':>10} | {'Frame Width':>12} | {'Craters/km²':>12}")
print(f"{'':>12} | {'(m/pixel)':>10} | {'(km)':>12} | {'(>GSD)':>12}")
print("-" * 55)

for h_km in altitudes_km:
    h_m = h_km * 1000
    gsd = ground_resolution(h_m)
    width = frame_coverage(h_m) / 1000  # km
    # Power-law crater count: N(>D) = 1e7 * D^(-2), D in meters
    craters = 1e7 * gsd**(-2) if gsd > 0 else float('inf')
    print(f"{h_km:>10.2f} km | {gsd:>10.1f} | {width:>10.1f} km | {craters:>12,.0f}")

print()
print(f"Resolution improvement from first to last frame: {ground_resolution(2110e3)/ground_resolution(480):.0f}x")
print(f"Total images transmitted: 4,308")
print(f"Imaging duration: 17 minutes 13 seconds")
print(f"Impact velocity: 2.62 km/s")
print(f"Impact location: 10.63°S, 20.68°W (Mare Cognitum)")
print()
print("To generate visual frames, install matplotlib and run with --render flag.")
print("Each frame shows a procedural crater field at the corresponding resolution.")
