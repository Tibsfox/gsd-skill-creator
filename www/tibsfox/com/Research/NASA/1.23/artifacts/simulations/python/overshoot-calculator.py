#!/usr/bin/env python3
"""
Aurora 7 Retrofire Overshoot Calculator
Mission 1.23 — Mercury-Atlas 7 / The Cost of Curiosity

Calculates the splashdown overshoot from retrofire errors:
  - Yaw angle error (0-45 degrees)
  - Timing delay (0-10 seconds)

Shows how cos(θ) converts a small angular error into a large
position error through the reentry dynamics.

Scott Carpenter: 25° yaw, 3s delay → 402 km overshoot

Usage:
  python3 overshoot-calculator.py
  python3 overshoot-calculator.py --interactive  (matplotlib slider mode)
"""

import numpy as np
import sys

# === MISSION PARAMETERS ===
DV_PLANNED = 152.0       # Planned retrofire delta-v (m/s)
V_ORBITAL = 7840.0       # Orbital velocity (m/s)
SENS_DV = 25.0           # km per m/s of delta-v deficit
SENS_TIMING = 7.84       # km per second of timing delay
CARPENTER_YAW = 25.0     # Carpenter's actual yaw error (degrees)
CARPENTER_DELAY = 3.0    # Carpenter's actual timing delay (seconds)
ACTUAL_OVERSHOOT = 402.0 # Carpenter's actual overshoot (km)


def calculate_overshoot(yaw_deg, delay_sec):
    """Calculate estimated splashdown overshoot.

    Args:
        yaw_deg: Yaw error during retrofire (degrees)
        delay_sec: Timing delay for retrofire initiation (seconds)

    Returns:
        dict with overshoot components and total
    """
    yaw_rad = np.radians(yaw_deg)

    # Vector decomposition
    dv_retrograde = DV_PLANNED * np.cos(yaw_rad)
    dv_crossrange = DV_PLANNED * np.sin(yaw_rad)
    dv_deficit = DV_PLANNED - dv_retrograde

    # Overshoot components
    dx_deltav = SENS_DV * dv_deficit          # From reduced retrograde thrust
    dx_timing = SENS_TIMING * delay_sec       # From late retrofire initiation
    dx_total = dx_deltav + dx_timing          # Approximate total

    return {
        'yaw_deg': yaw_deg,
        'delay_sec': delay_sec,
        'cos_yaw': np.cos(yaw_rad),
        'sin_yaw': np.sin(yaw_rad),
        'dv_retrograde': dv_retrograde,
        'dv_crossrange': dv_crossrange,
        'dv_deficit': dv_deficit,
        'dx_deltav_km': dx_deltav,
        'dx_timing_km': dx_timing,
        'dx_total_km': dx_total,
    }


def print_analysis(result):
    """Print formatted overshoot analysis."""
    print(f"\n{'='*65}")
    print(f"AURORA 7 RETROFIRE OVERSHOOT ANALYSIS")
    print(f"{'='*65}")
    print(f"\nInput errors:")
    print(f"  Yaw angle:    {result['yaw_deg']:.1f}°")
    print(f"  Timing delay: {result['delay_sec']:.1f} s")
    print(f"\nVector decomposition:")
    print(f"  cos({result['yaw_deg']:.1f}°) = {result['cos_yaw']:.4f}")
    print(f"  sin({result['yaw_deg']:.1f}°) = {result['sin_yaw']:.4f}")
    print(f"  Retrograde Δv:  {result['dv_retrograde']:.1f} m/s "
          f"(planned: {DV_PLANNED:.0f} m/s)")
    print(f"  Cross-range Δv: {result['dv_crossrange']:.1f} m/s "
          f"(wasted sideways)")
    print(f"  Retrograde deficit: {result['dv_deficit']:.1f} m/s")
    print(f"\nOvershoot breakdown:")
    print(f"  From Δv deficit: {result['dx_deltav_km']:.0f} km")
    print(f"  From timing delay: {result['dx_timing_km']:.0f} km")
    print(f"  Estimated total:   {result['dx_total_km']:.0f} km")
    print(f"\n  Carpenter's actual: {ACTUAL_OVERSHOOT:.0f} km")
    print(f"{'='*65}")


def sweep_table():
    """Print a sweep table of overshoot vs. yaw angle."""
    print(f"\n{'='*65}")
    print(f"OVERSHOOT vs YAW ANGLE (timing delay = {CARPENTER_DELAY}s)")
    print(f"{'='*65}")
    print(f"{'Yaw':>6}° | {'cos(θ)':>8} | {'Δv_retro':>9} | "
          f"{'Deficit':>8} | {'Overshoot':>10}")
    print(f"{'-'*55}")

    for yaw in [0, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45]:
        r = calculate_overshoot(yaw, CARPENTER_DELAY)
        marker = " ← AURORA 7" if yaw == 25 else ""
        print(f"{yaw:>6}° | {r['cos_yaw']:>8.4f} | "
              f"{r['dv_retrograde']:>8.1f} | {r['dv_deficit']:>7.1f} | "
              f"{r['dx_total_km']:>9.0f} km{marker}")

    print(f"\n  At 0°: only {SENS_TIMING * CARPENTER_DELAY:.0f} km overshoot "
          f"(timing delay alone)")
    print(f"  At 25°: {calculate_overshoot(25, 3)['dx_total_km']:.0f} km overshoot")
    print(f"  cos(25°) = 0.9063. Nine percent wasted sideways.")
    print(f"  Nine percent became 402 kilometers.\n")


def main():
    # Carpenter's actual errors
    result = calculate_overshoot(CARPENTER_YAW, CARPENTER_DELAY)
    print_analysis(result)

    # Sweep table
    sweep_table()

    # What-if scenarios
    print(f"{'='*65}")
    print(f"WHAT-IF SCENARIOS")
    print(f"{'='*65}")

    scenarios = [
        ("Perfect retrofire (0° yaw, 0s delay)", 0, 0),
        ("Timing only (0° yaw, 3s delay)", 0, 3),
        ("Yaw only (25° yaw, 0s delay)", 25, 0),
        ("Carpenter actual (25° yaw, 3s delay)", 25, 3),
        ("Worst case (45° yaw, 5s delay)", 45, 5),
    ]

    for name, yaw, delay in scenarios:
        r = calculate_overshoot(yaw, delay)
        print(f"  {name}: {r['dx_total_km']:.0f} km")

    print()
    print(f"The trigonometry does not care about intentions.")
    print(f"cos(25°) = 0.9063. That is all it knows.")


if __name__ == '__main__':
    main()
