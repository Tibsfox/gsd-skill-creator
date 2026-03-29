#!/usr/bin/env python3
"""
tools/validate-formulas.py
The Space Between — Formula Validation Script
Part of the GSD Ecosystem / NASA Mission Series Part G

Validates key TSPB formulas against known analytical results.
Usage: python3 tools/validate-formulas.py
"""

import numpy as np
from scipy import constants
import sys

PASS = "  [PASS]"
FAIL = "  [FAIL]"
results = []

def check(name, computed, expected, tol=1e-10):
    err = abs(computed - expected) / (abs(expected) + 1e-300)
    ok = err < tol
    status = PASS if ok else FAIL
    results.append((name, ok))
    print(f"{status}  {name}")
    if not ok:
        print(f"         computed={computed:.15g}  expected={expected:.15g}  err={err:.2e}")

print("=" * 60)
print("The Space Between — Formula Validation")
print("=" * 60)

# ── Layer 1: Unit Circle ──────────────────────────────────────
print("\nLayer 1: Unit Circle")

# Pythagorean identity
for deg in [0, 30, 45, 60, 90, 120, 180, 270, 360]:
    th = np.radians(deg)
    check(f"sin²+cos²=1  @ {deg}°", np.sin(th)**2 + np.cos(th)**2, 1.0)

# Euler's formula
for deg in [0, 45, 90, 180, 270]:
    th = np.radians(deg)
    euler = np.exp(1j * th)
    check(f"Re(e^iθ)=cosθ @ {deg}°", euler.real, np.cos(th))
    check(f"Im(e^iθ)=sinθ @ {deg}°", euler.imag, np.sin(th))

# Euler's identity: e^(iπ) + 1 = 0  →  e^(iπ) = -1
check("Euler's identity: e^(iπ) = -1", np.exp(1j * np.pi).real, -1.0)

# ── Layer 2: Pythagorean Theorem ─────────────────────────────
print("\nLayer 2: Pythagorean Theorem")

# 3-4-5 triple
check("3-4-5 triangle", np.sqrt(3**2 + 4**2), 5.0)
# 5-12-13 triple
check("5-12-13 triangle", np.sqrt(5**2 + 12**2), 13.0)
# Distance formula in 3D
d = np.sqrt((3-0)**2 + (4-0)**2 + (0-0)**2)
check("3D distance (3,4,0) from origin", d, 5.0)

# ── Physical Constants ────────────────────────────────────────
print("\nAppendix A: Physical Constants (NIST CODATA 2022)")

c_ref = 299_792_458  # exact
check("Speed of light", constants.c, c_ref, tol=1e-12)

h_ref = 6.62607015e-34  # exact
check("Planck constant", constants.h, h_ref, tol=1e-10)

kB_ref = 1.380649e-23  # exact
check("Boltzmann constant", constants.k, kB_ref, tol=1e-10)

sigma_ref = 5.670374419e-8
check("Stefan-Boltzmann", constants.sigma, sigma_ref, tol=1e-6)

# Solar flux at 1 AU  S = L_sun / (4π AU²)
AU = 1.495978707e11  # m
L_sun = 3.828e26     # W
S = L_sun / (4 * np.pi * AU**2)
check("Solar constant at 1 AU (~1361 W/m²)", S, 1361.0, tol=0.02)

# ── Summary ───────────────────────────────────────────────────
print("\n" + "=" * 60)
passed = sum(1 for _, ok in results if ok)
total = len(results)
print(f"Results: {passed}/{total} passed")

if passed == total:
    print("ALL FORMULAS VALIDATED — TSPB release ready")
    sys.exit(0)
else:
    failed = [name for name, ok in results if not ok]
    print(f"FAILURES: {failed}")
    sys.exit(1)
