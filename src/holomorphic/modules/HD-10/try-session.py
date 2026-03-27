"""
HD-10 Try Session: Koopman Analysis with EDMD

Demonstrates Extended Dynamic Mode Decomposition on the logistic map.
A polynomial dictionary lifts the 1D state to a 3D observable space,
and the Koopman operator is approximated as K = Psi(X') @ Psi(X)^+.

Requires: pip install numpy
"""

import numpy as np


def run_try_session():
    """Demonstrate EDMD on the logistic map."""
    r = 2.8
    x = 0.5
    orbit = [x]
    for _ in range(100):
        x = r * x * (1 - x)
        orbit.append(x)
    orbit = np.array(orbit)

    # Polynomial dictionary: [x, x^2, x^3]
    psi_X = np.vstack([orbit[:-1], orbit[:-1]**2, orbit[:-1]**3])
    psi_Y = np.vstack([orbit[1:], orbit[1:]**2, orbit[1:]**3])

    # EDMD: K = psi_Y @ psi_X^+ (pseudoinverse)
    K_approx = psi_Y @ np.linalg.pinv(psi_X)
    eigenvalues = np.linalg.eigvals(K_approx)

    print("=== HD-10 Try Session: EDMD on Logistic Map ===\n")
    print(f"Logistic map r={r}, 100 iterations from x_0=0.5")
    print(f"Dictionary: [x, x^2, x^3] (polynomial)")
    print(f"\nApproximate Koopman matrix K (3x3):")
    for row in K_approx:
        print(f"  [{', '.join(f'{v:8.4f}' for v in row)}]")

    print(f"\nEDMD eigenvalues: {eigenvalues}")
    print(f"Magnitudes: {np.abs(eigenvalues)}")

    dominant_idx = np.argmax(np.abs(eigenvalues))
    print(f"Dominant eigenvalue: {eigenvalues[dominant_idx]:.4f}")
    print(f"Dominant magnitude: {np.abs(eigenvalues[dominant_idx]):.4f}")

    # Interpretation
    print("\n--- Interpretation ---")
    for i, eig in enumerate(eigenvalues):
        mag = abs(eig)
        if mag < 0.99:
            label = "decaying (attracting)"
        elif mag > 1.01:
            label = "growing (repelling)"
        else:
            label = "persistent (neutral)"
        print(f"  lambda_{i} = {eig:.4f}  |lambda| = {mag:.4f}  ({label})")

    fixed_point = (r - 1) / r
    print(f"\nFixed point x* = {fixed_point:.4f}")
    print(f"Orbit converges: x_100 = {orbit[-1]:.6f}")


if __name__ == "__main__":
    run_try_session()
