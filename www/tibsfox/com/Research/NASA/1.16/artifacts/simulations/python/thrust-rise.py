#!/usr/bin/env python3
"""
Mercury-Redstone 1 — Engine Startup and 4-Inch Rise
====================================================
NASA Mission Series v1.16

Models the Rocketdyne A-7 engine startup sequence and calculates
the rocket's rise during the first 2 seconds. Shows that at
approximately 0.6 seconds of net positive thrust, the tail plug
separates at 4 inches (~10 cm) of rise.

The A-7 was a derivative of the Redstone missile's NAA 75-110
engine, producing 78,000 lbf (347 kN) thrust. Mercury-Redstone
gross liftoff weight was approximately 66,000 lbs (30,000 kg).

Key question: How long does it take to rise 4 inches, and what
was the thrust profile at the moment of tail plug separation?

Launch: November 21, 1960, 14:00 UTC
Launch Site: Cape Canaveral LC-5
Vehicle: Mercury-Redstone (MR-1)
Outcome: Engine shutdown after 4-inch rise due to sneak circuit

Usage: python3 thrust-rise.py
Dependencies: numpy, scipy, matplotlib
Output: thrust_rise.png (4 subplots)
"""

import numpy as np
from scipy.integrate import cumulative_trapezoid
import matplotlib.pyplot as plt

# ============================================================
# REAL MISSION PARAMETERS
# ============================================================

# Rocketdyne A-7 engine (Mercury-Redstone variant)
THRUST_RATED = 347_000.0         # N (78,000 lbf rated thrust)
MASS_TOTAL = 29_937.0            # kg (~66,000 lbs gross liftoff weight)
SPACECRAFT_MASS = 1_224.0        # kg (Mercury capsule + escape tower)
G = 9.80665                      # m/s^2

# Engine startup profile
# The A-7 engine startup was a staged sequence:
#   T-0.0: Ignition command
#   T+0.0 to T+0.3: Igniter burns, turbopump spins up
#   T+0.3 to T+0.8: Main propellant valves open, thrust ramps
#   T+0.8 to T+1.3: Thrust reaches 90% rated
#   T+1.3+: Full rated thrust
# Holddown clamps release at ~1.0 second (when thrust > weight)

HOLDDOWN_RELEASE_THRUST = MASS_TOTAL * G * 1.05  # Release at 105% weight
TAIL_PLUG_HEIGHT = 0.102         # m (4 inches)

# Time parameters
DT = 0.001                       # 1 ms time step
T_MAX = 3.0                      # seconds to simulate

# ============================================================
# ENGINE THRUST MODEL
# ============================================================

def thrust_profile(t):
    """
    Model the A-7 engine thrust buildup.
    Returns thrust in Newtons at time t (seconds after ignition command).
    """
    if t < 0:
        return 0.0
    elif t < 0.3:
        # Igniter phase: negligible thrust, turbopump spinning up
        return THRUST_RATED * 0.02 * (t / 0.3)
    elif t < 0.8:
        # Main valve opening: thrust ramps from ~2% to ~60%
        frac = (t - 0.3) / 0.5
        return THRUST_RATED * (0.02 + 0.58 * frac**1.5)
    elif t < 1.3:
        # Approaching rated: 60% to 100%
        frac = (t - 0.8) / 0.5
        return THRUST_RATED * (0.60 + 0.40 * (1 - (1 - frac)**2))
    else:
        # Full rated thrust (with slight oscillation from combustion)
        osc = 1.0 + 0.005 * np.sin(2 * np.pi * 120 * t)  # 120 Hz combustion
        return THRUST_RATED * osc


def weight(t):
    """Rocket weight (approximately constant for first 3 seconds)."""
    # Mass flow rate ~130 kg/s, but negligible over 3 seconds
    fuel_burned = 130.0 * max(0, t - 0.5)  # Approximate
    return (MASS_TOTAL - fuel_burned) * G


# ============================================================
# SIMULATION
# ============================================================

def simulate():
    """Simulate the first 3 seconds of MR-1's flight."""
    times = np.arange(0, T_MAX, DT)
    n = len(times)

    thrust = np.array([thrust_profile(t) for t in times])
    weights = np.array([weight(t) for t in times])
    net_force = thrust - weights

    # Before holddown release: rocket is clamped
    holddown_released = False
    release_time = None

    for i, t in enumerate(times):
        if not holddown_released:
            if thrust[i] > HOLDDOWN_RELEASE_THRUST:
                holddown_released = True
                release_time = t
            else:
                net_force[i] = 0.0  # Clamps absorb thrust

    # Acceleration (only after holddown release)
    mass = np.array([MASS_TOTAL - 130.0 * max(0, t - 0.5) for t in times])
    acceleration = net_force / mass

    # Velocity and position (numerical integration)
    velocity = np.zeros(n)
    position = np.zeros(n)

    for i in range(1, n):
        velocity[i] = velocity[i-1] + acceleration[i] * DT
        position[i] = position[i-1] + velocity[i] * DT

    # Find tail plug separation time
    sep_idx = None
    for i, h in enumerate(position):
        if h >= TAIL_PLUG_HEIGHT:
            sep_idx = i
            break

    return times, thrust, weights, net_force, acceleration, velocity, position, release_time, sep_idx


# ============================================================
# PLOTTING
# ============================================================

def plot_results():
    times, thrust, weights, net_force, accel, vel, pos, release_t, sep_idx = simulate()

    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.patch.set_facecolor('#0c1020')

    for row in axes:
        for ax in row:
            ax.set_facecolor('#0a0e1a')
            ax.tick_params(colors='#8090a0')
            for spine in ax.spines.values():
                spine.set_color('#2a3050')
            ax.grid(True, alpha=0.1, color='#4488cc')

    sep_time = times[sep_idx] if sep_idx else None

    # --- Plot 1: Thrust vs Weight ---
    ax1 = axes[0][0]
    ax1.plot(times, thrust / 1000, color='#CC4020', linewidth=2, label='Thrust')
    ax1.plot(times, weights / 1000, color='#4488cc', linewidth=2, linestyle='--', label='Weight')
    ax1.axhline(y=HOLDDOWN_RELEASE_THRUST/1000, color='#44ff88', linestyle=':',
                alpha=0.5, label='Holddown release')
    if release_t:
        ax1.axvline(x=release_t, color='#44ff88', linestyle=':', alpha=0.3)
    if sep_time:
        ax1.axvline(x=sep_time, color='#E88020', linewidth=2, linestyle='--',
                    label=f'Tail plug sep (T+{sep_time:.3f}s)')
    ax1.set_xlabel('Time (seconds)', color='#8090a0')
    ax1.set_ylabel('Force (kN)', color='#8090a0')
    ax1.set_title('Thrust vs Weight', color='#c0c8d8', fontsize=13)
    ax1.legend(loc='lower right', fontsize=9, facecolor='#0a0e1a',
              edgecolor='#2a3050', labelcolor='#c0c8d8')

    # --- Plot 2: Net Force ---
    ax2 = axes[0][1]
    ax2.plot(times, net_force / 1000, color='#E88020', linewidth=2)
    ax2.axhline(y=0, color='#8090a0', linewidth=0.5)
    ax2.fill_between(times, net_force / 1000, 0,
                     where=net_force > 0, alpha=0.15, color='#44ff88')
    ax2.fill_between(times, net_force / 1000, 0,
                     where=net_force < 0, alpha=0.15, color='#ff4444')
    if sep_time:
        ax2.axvline(x=sep_time, color='#E88020', linewidth=2, linestyle='--')
        ax2.text(sep_time + 0.05, ax2.get_ylim()[1] * 0.8,
                f'Sneak circuit\nT+{sep_time:.3f}s',
                color='#ff4444', fontsize=9, fontweight='bold')
    ax2.set_xlabel('Time (seconds)', color='#8090a0')
    ax2.set_ylabel('Net Force (kN)', color='#8090a0')
    ax2.set_title('Net Force (Thrust - Weight)', color='#c0c8d8', fontsize=13)

    # --- Plot 3: Height ---
    ax3 = axes[1][0]
    ax3.plot(times, pos * 100, color='#B0B8C0', linewidth=2)  # cm
    ax3.axhline(y=TAIL_PLUG_HEIGHT * 100, color='#ff4444', linewidth=2,
                linestyle='--', label=f'4 inches ({TAIL_PLUG_HEIGHT*100:.1f} cm)')
    if sep_time:
        ax3.plot(sep_time, TAIL_PLUG_HEIGHT * 100, 'o', color='#ff0000',
                markersize=10, zorder=5)
        ax3.annotate(f'TAIL PLUG SEPARATES\nHeight: 4 inches\nTime: T+{sep_time:.3f}s',
                    xy=(sep_time, TAIL_PLUG_HEIGHT * 100),
                    xytext=(sep_time + 0.3, TAIL_PLUG_HEIGHT * 100 + 5),
                    color='#ff4444', fontsize=9, fontweight='bold',
                    arrowprops=dict(arrowstyle='->', color='#ff4444'))
    ax3.set_xlabel('Time (seconds)', color='#8090a0')
    ax3.set_ylabel('Height (cm)', color='#8090a0')
    ax3.set_title('Rocket Height Above Pad', color='#c0c8d8', fontsize=13)
    ax3.legend(loc='upper left', fontsize=9, facecolor='#0a0e1a',
              edgecolor='#2a3050', labelcolor='#c0c8d8')

    # --- Plot 4: Velocity ---
    ax4 = axes[1][1]
    ax4.plot(times, vel, color='#44ff88', linewidth=2)
    if sep_time:
        ax4.axvline(x=sep_time, color='#E88020', linewidth=2, linestyle='--')
        sep_vel = vel[sep_idx]
        ax4.plot(sep_time, sep_vel, 'o', color='#ff0000', markersize=10, zorder=5)
        ax4.annotate(f'v = {sep_vel:.3f} m/s\n({sep_vel * 3.281:.3f} ft/s)',
                    xy=(sep_time, sep_vel),
                    xytext=(sep_time + 0.3, sep_vel + 0.3),
                    color='#E88020', fontsize=10, fontweight='bold',
                    arrowprops=dict(arrowstyle='->', color='#E88020'))
    ax4.set_xlabel('Time (seconds)', color='#8090a0')
    ax4.set_ylabel('Velocity (m/s)', color='#8090a0')
    ax4.set_title('Rocket Velocity', color='#c0c8d8', fontsize=13)

    plt.tight_layout(pad=2.0)
    fig.suptitle('Mercury-Redstone 1 — A-7 Engine Startup & 4-Inch Rise',
                color='#c0c8d8', fontsize=15, fontweight='bold', y=0.98)
    plt.subplots_adjust(top=0.92)

    plt.savefig('thrust_rise.png', dpi=150, facecolor='#0c1020',
                bbox_inches='tight')
    print("Saved: thrust_rise.png")
    plt.close()


# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    print("Mercury-Redstone 1 — Engine Startup Analysis")
    print("=" * 48)

    times, thrust, weights, net_force, accel, vel, pos, release_t, sep_idx = simulate()

    print(f"\nVehicle Parameters:")
    print(f"  Gross liftoff weight: {MASS_TOTAL:,.0f} kg ({MASS_TOTAL * 2.205:,.0f} lbs)")
    print(f"  A-7 rated thrust:    {THRUST_RATED/1000:,.0f} kN ({THRUST_RATED/4.448:,.0f} lbf)")
    print(f"  Thrust/weight ratio: {THRUST_RATED / (MASS_TOTAL * G):.2f}")

    print(f"\nEngine Startup Sequence:")
    print(f"  Holddown release threshold: {HOLDDOWN_RELEASE_THRUST/1000:.1f} kN")
    print(f"  Holddown release time:      T+{release_t:.3f} s")

    if sep_idx:
        sep_time = times[sep_idx]
        sep_vel = vel[sep_idx]
        sep_thrust = thrust[sep_idx]
        sep_accel = accel[sep_idx]

        print(f"\nTail Plug Separation (4 inches / {TAIL_PLUG_HEIGHT*100:.1f} cm):")
        print(f"  Time:          T+{sep_time:.3f} s")
        print(f"  Velocity:      {sep_vel:.4f} m/s ({sep_vel * 3.281:.4f} ft/s)")
        print(f"  Thrust:        {sep_thrust/1000:.1f} kN ({sep_thrust/4.448:.0f} lbf)")
        print(f"  Acceleration:  {sep_accel:.2f} m/s^2 ({sep_accel/G:.2f} g)")
        print(f"  Thrust/weight: {sep_thrust / (MASS_TOTAL * G):.3f}")
        print(f"\n  At this moment, the sneak circuit in the tail plug")
        print(f"  connector sent a shutdown command to the A-7 engine.")

    # Generate plots
    print("\nGenerating plots...")
    plot_results()
    print("Done.")
