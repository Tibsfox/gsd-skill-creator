"""
HD-09 Try Session: DMD with PyDMD on Skill Evolution Data

Demonstrates Dynamic Mode Decomposition on synthetic skill activation
time series. Two modes: one stable (decaying), one oscillating.

Requires: pip install numpy pydmd
"""

import numpy as np

# Note: requires pip install pydmd
# from pydmd import DMD


def run_try_session():
    """Demonstrate DMD on synthetic skill activation data."""
    # Create synthetic skill activation time series
    # Two measurement channels over 100 time steps
    t = np.linspace(0, 10, 100)

    # Mode 1: decaying oscillation (inside unit circle)
    x1 = np.exp(-0.1 * t) * np.cos(2 * np.pi * 0.5 * t)

    # Mode 2: slowly decaying oscillation (closer to unit circle)
    x2 = np.exp(-0.05 * t) * np.sin(2 * np.pi * 0.3 * t)

    # Stack into snapshot matrix (rows = channels, columns = time)
    data = np.vstack([x1, x2])

    print("=== HD-09 Try Session: DMD with PyDMD ===\n")
    print(f"Snapshot matrix shape: {data.shape}")
    print(f"  Rows (measurement channels): {data.shape[0]}")
    print(f"  Columns (time snapshots):    {data.shape[1]}")
    print(f"Time span: {t[0]:.1f} to {t[-1]:.1f}")
    print(f"Number of snapshots: {len(t)}")

    # If PyDMD is available, uncomment:
    # dmd = DMD(svd_rank=2)
    # dmd.fit(data)
    # print(f"\nDMD eigenvalues: {dmd.eigs}")
    # print(f"DMD modes shape: {dmd.modes.shape}")
    # for i, eig in enumerate(dmd.eigs):
    #     mag = abs(eig)
    #     label = "decaying" if mag < 1 else "growing" if mag > 1 else "neutral"
    #     print(f"  lambda_{i} = {eig:.4f}  |lambda| = {mag:.4f}  ({label})")

    print("\n--- Expected behavior ---")
    print("  Mode 1 (decay=0.1): eigenvalue inside unit circle (attracting)")
    print("  Mode 2 (decay=0.05): eigenvalue closer to unit circle (slower decay)")
    print("  Both modes are oscillatory (nonzero imaginary part)")


if __name__ == "__main__":
    run_try_session()
