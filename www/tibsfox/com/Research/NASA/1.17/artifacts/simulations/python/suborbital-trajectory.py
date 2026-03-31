#!/usr/bin/env python3
"""
Mercury-Redstone 2 — Suborbital Trajectory: Nominal vs Abort
=============================================================
NASA Mission Series v1.17

Computes and compares MR-2's actual trajectory (abort at T+137s,
253 km peak altitude) with the planned nominal trajectory (185 km
peak altitude). Shows altitude, velocity, and g-force vs time.

The abort system fired because:
1. Higher-than-expected fuel consumption rate
2. Cabin pressure anomaly
The escape rocket added ~5 seconds of extra thrust, pushing the
capsule to a higher trajectory than planned.

Key MR-2 parameters:
  Launch: January 31, 1961, 16:55 UTC
  Launch site: Cape Canaveral LC-5
  Vehicle: Mercury-Redstone (MR-2)
  Passenger: Ham (chimpanzee #65)
  Planned altitude: 185 km (115 miles)
  Actual altitude: 253 km (157 miles)
  Planned range: 466 km (290 miles)
  Actual range: 679 km (422 miles)
  Flight time: 16 min 39 sec
  Peak g-force: 14.7g (reentry)
  Recovery: USS Donner

Usage: python3 suborbital-trajectory.py
Dependencies: numpy, scipy, matplotlib
Output: suborbital_trajectory.png (3 subplots)
"""

import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt

# ============================================================
# PHYSICAL CONSTANTS
# ============================================================

G = 9.80665          # m/s^2
R_EARTH = 6.371e6    # m (Earth radius)
MU = 3.986e14        # m^3/s^2 (gravitational parameter)

# ============================================================
# VEHICLE PARAMETERS
# ============================================================

# Mercury-Redstone booster
THRUST_REDSTONE = 347_000.0    # N (78,000 lbf)
MASS_GROSS = 29_937.0          # kg (~66,000 lbs)
MASS_EMPTY = 6_350.0           # kg (booster dry)
CAPSULE_MASS = 1_360.0         # kg (Mercury capsule + escape tower)
BURN_RATE = 146.0              # kg/s (propellant consumption)

# Escape rocket (abort system)
THRUST_ESCAPE = 231_000.0     # N (52,000 lbf)
BURN_TIME_ESCAPE = 5.0        # s (approximate)

# Aerodynamics (simplified)
CD = 0.3                      # Drag coefficient (capsule shape)
DIAMETER = 1.89               # m (Mercury capsule diameter)
AREA = np.pi * (DIAMETER/2)**2

# Launch angle (slightly off-vertical for range)
LAUNCH_ANGLE = np.radians(80)  # 80 degrees from horizontal

# ============================================================
# ATMOSPHERE MODEL (simplified exponential)
# ============================================================

def density(alt):
    """Air density vs altitude (exponential atmosphere model)."""
    rho0 = 1.225       # kg/m^3 at sea level
    H = 8500.0          # scale height, m
    return rho0 * np.exp(-alt / H)

# ============================================================
# EQUATIONS OF MOTION
# ============================================================

def trajectory(t, state, abort=False, abort_time=137.0):
    """
    2D trajectory equations in Cartesian coordinates.
    state = [x, y, vx, vy, mass]
    """
    x, y, vx, vy, mass = state
    alt = max(0.0, y)
    v = np.sqrt(vx**2 + vy**2)

    # Gravity (varies with altitude)
    r = R_EARTH + alt
    g = MU / r**2

    # Thrust
    thrust = 0.0
    if mass > CAPSULE_MASS + MASS_EMPTY:
        # Redstone engine burning
        thrust = THRUST_REDSTONE
    elif abort and t >= abort_time and t < abort_time + BURN_TIME_ESCAPE:
        # Escape rocket firing during abort
        thrust = THRUST_ESCAPE

    # Drag
    rho = density(alt)
    drag = 0.5 * rho * v**2 * CD * AREA if v > 0 else 0.0

    # Direction vectors
    if v > 0:
        drag_x = -drag * vx / v
        drag_y = -drag * vy / v
    else:
        drag_x = 0.0
        drag_y = 0.0

    # Thrust direction (along velocity vector during powered flight)
    if thrust > 0 and v > 0:
        thrust_x = thrust * vx / v
        thrust_y = thrust * vy / v
    elif thrust > 0:
        # At launch, thrust along launch angle
        thrust_x = thrust * np.cos(LAUNCH_ANGLE)
        thrust_y = thrust * np.sin(LAUNCH_ANGLE)
    else:
        thrust_x = 0.0
        thrust_y = 0.0

    # Mass flow
    if thrust > 0 and mass > CAPSULE_MASS:
        mdot = -BURN_RATE
    else:
        mdot = 0.0

    # Accelerations
    ax = (thrust_x + drag_x) / mass
    ay = (thrust_y + drag_y) / mass - g

    return [vx, vy, ax, ay, mdot]

# ============================================================
# SIMULATION
# ============================================================

def simulate(abort=False, abort_time=137.0, label=""):
    """Run trajectory simulation."""
    # Initial conditions: on pad
    state0 = [0.0, 0.0, 0.0, 0.0, MASS_GROSS]

    # Time span
    t_span = (0, 1000)  # seconds (will stop at splashdown)
    t_eval = np.linspace(0, 1000, 10000)

    # Event: hit the ground
    def splashdown(t, state, *args):
        return state[1] if t > 10 else 1.0  # y = 0 after launch
    splashdown.terminal = True
    splashdown.direction = -1

    sol = solve_ivp(
        trajectory, t_span, state0,
        args=(abort, abort_time),
        t_eval=t_eval,
        events=splashdown,
        max_step=0.5,
        rtol=1e-8
    )

    t = sol.t
    x = sol.y[0]
    y = sol.y[1]
    vx = sol.y[2]
    vy = sol.y[3]
    mass = sol.y[4]

    # Compute derived quantities
    alt_km = y / 1000.0
    range_km = x / 1000.0
    velocity = np.sqrt(vx**2 + vy**2)

    # G-force: total acceleration / g
    gforce = np.zeros_like(t)
    for i in range(len(t)):
        if i > 0:
            dt = t[i] - t[i-1]
            if dt > 0:
                dvx = vx[i] - vx[i-1]
                dvy = vy[i] - vy[i-1]
                ax = dvx / dt
                ay = dvy / dt + G  # Include gravity
                gforce[i] = np.sqrt(ax**2 + ay**2) / G
        else:
            gforce[i] = 1.0

    # Smooth g-force
    kernel_size = 20
    if len(gforce) > kernel_size:
        kernel = np.ones(kernel_size) / kernel_size
        gforce = np.convolve(gforce, kernel, mode='same')

    return {
        'label': label,
        't': t,
        'alt_km': alt_km,
        'range_km': range_km,
        'velocity': velocity,
        'gforce': gforce,
        'peak_alt': np.max(alt_km),
        'max_range': np.max(range_km),
        'peak_g': np.max(gforce),
        'flight_time': t[-1] if len(t) > 0 else 0
    }

# ============================================================
# RUN BOTH TRAJECTORIES
# ============================================================

print("Computing nominal trajectory...")
nominal = simulate(abort=False, label="Nominal (planned)")

print("Computing abort trajectory (MR-2 actual)...")
actual = simulate(abort=True, abort_time=137.0, label="Abort (MR-2 actual)")

print(f"\n{'='*55}")
print(f"{'Parameter':<25} {'Nominal':>12} {'Actual (MR-2)':>14}")
print(f"{'='*55}")
print(f"{'Peak altitude (km)':<25} {nominal['peak_alt']:>12.1f} {actual['peak_alt']:>14.1f}")
print(f"{'Max range (km)':<25} {nominal['max_range']:>12.1f} {actual['max_range']:>14.1f}")
print(f"{'Peak g-force':<25} {nominal['peak_g']:>12.1f} {actual['peak_g']:>14.1f}")
print(f"{'Flight time (s)':<25} {nominal['flight_time']:>12.1f} {actual['flight_time']:>14.1f}")
print(f"{'='*55}")

# ============================================================
# PLOTTING
# ============================================================

fig, axes = plt.subplots(3, 1, figsize=(12, 14))
fig.suptitle('Mercury-Redstone 2 — Nominal vs Abort Trajectory\n'
             'January 31, 1961 • Ham the Chimpanzee',
             fontsize=14, fontweight='bold', y=0.98)

colors = {'nominal': '#2050A0', 'actual': '#FF3030'}

# Plot 1: Altitude vs Time
ax1 = axes[0]
ax1.plot(nominal['t'], nominal['alt_km'], color=colors['nominal'],
         linewidth=2, label=f"Nominal ({nominal['peak_alt']:.0f} km peak)")
ax1.plot(actual['t'], actual['alt_km'], color=colors['actual'],
         linewidth=2, label=f"Abort/Actual ({actual['peak_alt']:.0f} km peak)")
ax1.axhline(y=100, color='#888888', linestyle='--', alpha=0.5, label='Karman line (100 km)')
ax1.set_xlabel('Time (seconds)')
ax1.set_ylabel('Altitude (km)')
ax1.set_title('Altitude vs Time')
ax1.legend(loc='upper right')
ax1.grid(True, alpha=0.3)
ax1.set_xlim(0, max(nominal['flight_time'], actual['flight_time']) * 1.05)

# Mark abort time
ax1.axvline(x=137, color=colors['actual'], linestyle=':', alpha=0.6)
ax1.annotate('Abort\nT+137s', xy=(137, 50), fontsize=9, color=colors['actual'],
             ha='right')

# Plot 2: Velocity vs Time
ax2 = axes[1]
ax2.plot(nominal['t'], nominal['velocity'], color=colors['nominal'],
         linewidth=2, label='Nominal')
ax2.plot(actual['t'], actual['velocity'], color=colors['actual'],
         linewidth=2, label='Abort/Actual')
ax2.set_xlabel('Time (seconds)')
ax2.set_ylabel('Velocity (m/s)')
ax2.set_title('Velocity vs Time')
ax2.legend(loc='upper right')
ax2.grid(True, alpha=0.3)
ax2.set_xlim(0, max(nominal['flight_time'], actual['flight_time']) * 1.05)
ax2.axvline(x=137, color=colors['actual'], linestyle=':', alpha=0.6)

# Plot 3: G-Force vs Time
ax3 = axes[2]
ax3.plot(nominal['t'], nominal['gforce'], color=colors['nominal'],
         linewidth=2, label=f"Nominal (peak {nominal['peak_g']:.1f}g)")
ax3.plot(actual['t'], actual['gforce'], color=colors['actual'],
         linewidth=2, label=f"Abort/Actual (peak {actual['peak_g']:.1f}g)")
ax3.axhline(y=6, color='#E8CC30', linestyle='--', alpha=0.5,
            label='Sustained human tolerance (~6g)')
ax3.axhline(y=14.7, color='#FF3030', linestyle='--', alpha=0.3,
            label='MR-2 peak (14.7g)')
ax3.set_xlabel('Time (seconds)')
ax3.set_ylabel('G-Force')
ax3.set_title('G-Force vs Time')
ax3.legend(loc='upper right')
ax3.grid(True, alpha=0.3)
ax3.set_xlim(0, max(nominal['flight_time'], actual['flight_time']) * 1.05)
ax3.axvline(x=137, color=colors['actual'], linestyle=':', alpha=0.6)

plt.tight_layout()
plt.savefig('suborbital_trajectory.png', dpi=150, bbox_inches='tight',
            facecolor='white')
print("\nSaved: suborbital_trajectory.png")
plt.close()
