#!/usr/bin/env python3
"""
Ranger 7 Crater Size-Frequency Distribution
Mission 1.34 — NASA Mission Series

Demonstrates the power-law crater distribution N(>D) ~ D^(-2)
that Ranger 7's photographs established for Mare Cognitum.
Plots the cumulative size-frequency distribution on log-log axes.

Usage: python crater-distribution.py
"""

import numpy as np

print("RANGER 7: CRATER SIZE-FREQUENCY DISTRIBUTION")
print("=" * 60)
print()
print("Power law: N(>D) = k × D^b")
print("  k = 1×10^7 craters/km² (reference at D = 1 m)")
print("  b = -2 (established by Shoemaker from Ranger 7 data)")
print()

# Power law parameters
k = 1e7
b = -2.0

# Diameter range spanning Ranger 7's resolution range
diameters = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 5000, 10000]

print(f"{'Diameter':>10} | {'N(>D)/km²':>14} | {'Ranger 7 could see?':>20}")
print("-" * 50)

for D in diameters:
    N = k * D**b
    # Ranger 7 resolution ranged from ~2000m to ~0.5m
    visible = "Yes (in final frames)" if D >= 0.5 else "Below resolution"
    if D > 2000:
        visible = "Visible from telescopes"
    elif D > 100:
        visible = "Yes (early frames)"
    elif D > 10:
        visible = "Yes (mid-descent)"
    elif D >= 0.5:
        visible = "Yes (final frames)"
    print(f"{D:>8.1f} m | {N:>14,.0f} | {visible:>20}")

print()
print("Key insight: the power law holds across ALL scales Ranger 7 measured.")
print("Every frame revealed new craters invisible in the previous frame.")
print("The Moon is a fractal landscape — self-similar at every magnification.")
print()
print("This finding was critical for Apollo:")
print("  - Surface is ROUGH (craters at every scale)")
print("  - Surface is SOLID (not deep dust)")
print("  - Surface is NAVIGABLE (craters are manageable)")
print("  - Apollo could land. Ranger 7 proved it.")
