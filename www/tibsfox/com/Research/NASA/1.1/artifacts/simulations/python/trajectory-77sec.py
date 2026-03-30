#!/usr/bin/env python3
"""
Pioneer 0 — 77-Second Trajectory Simulation
=============================================
NASA Mission Series v1.1

Simulates the actual flight of Pioneer 0 (Thor-Able 1) from T+0 to T+77 seconds
using real mission parameters. Models thrust, gravity, atmospheric drag, and the
turbopump bearing failure at T+73.6 seconds.

Launch: August 17, 1958, 12:18 UTC
Launch Site: Cape Canaveral LC-17A (28.49°N, 80.58°W)
Vehicle: Thor DM-18 (Rocketdyne LR-79 engine)
Outcome: Turbopump failure at T+73.6, vehicle breakup at T+77, ~16 km altitude

Usage: python3 trajectory-77sec.py
Dependencies: numpy, scipy, matplotlib
Output: trajectory_77sec.png (3 subplots)
"""

import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

# ============================================================
# REAL MISSION PARAMETERS
# ============================================================

# Thor DM-18 / LR-79-NA-9 engine
THRUST_SEA_LEVEL = 667_000.0       # N (150,000 lbf)
MASS_TOTAL = 49_895.0 + 1_200.0    # kg (Thor wet mass + upper stages/spacecraft)
MASS_FLOW_RATE = 220.0             # kg/s (RP-1 + LOX combined flow, LR-79 spec)
SPACECRAFT_MASS = 38.0             # kg (Pioneer 0)

# Atmospheric model (US Standard Atmosphere simplified)
RHO_SEA_LEVEL = 1.225              # kg/m^3
SCALE_HEIGHT = 8_500.0             # m (exponential atmosphere)

# Vehicle aerodynamic properties
CD = 0.20                          # drag coefficient (streamlined rocket with fins)
DIAMETER = 2.44                    # m (Thor body diameter)
AREA = np.pi * (DIAMETER / 2) ** 2 # m^2 (cross-section)

# Earth
G = 9.80665                        # m/s^2 (standard gravity)
R_EARTH = 6_371_000.0              # m

# Flight profile
T_GRAVITY_TURN = 12.0              # s (gravity turn initiation, after clearing tower)
TURN_RATE = 0.0065                 # rad/s (gentle pitch rate — Thor gravity turn was gradual)
T_PUMP_FAILURE = 73.6              # s (turbopump bearing failure)
T_BREAKUP = 77.0                   # s (vehicle breakup / RSO destruct)

# ============================================================
# PHYSICS MODEL
# ============================================================

def atmosphere_density(altitude):
    """Exponential atmosphere model. Returns air density in kg/m^3."""
    return RHO_SEA_LEVEL * np.exp(-altitude / SCALE_HEIGHT)

def gravity(altitude):
    """Gravitational acceleration accounting for altitude."""
    return G * (R_EARTH / (R_EARTH + altitude)) ** 2

def thrust_at_altitude(altitude, t):
    """
    Thrust adjusted for altitude (vacuum thrust bonus from nozzle expansion).
    LR-79 vacuum thrust was ~758 kN vs 667 kN sea level.
    Linear interpolation based on ambient pressure.
    """
    if t > T_PUMP_FAILURE:
        # Turbopump failed — thrust decays rapidly (not instant cutoff)
        decay_time = t - T_PUMP_FAILURE
        return THRUST_SEA_LEVEL * max(0, 1.0 - decay_time / 0.5) * 0.1
    p_ratio = np.exp(-altitude / SCALE_HEIGHT)
    # Thrust increases with altitude as backpressure drops
    thrust_vacuum = 758_000.0  # N
    return THRUST_SEA_LEVEL + (thrust_vacuum - THRUST_SEA_LEVEL) * (1.0 - p_ratio)

def equations_of_motion(t, state):
    """
    State vector: [x, y, vx, vy, mass]
    x = downrange distance (m)
    y = altitude (m)
    vx = horizontal velocity (m/s)
    vy = vertical velocity (m/s)
    mass = current vehicle mass (kg)
    """
    x, y, vx, vy, mass = state

    # Prevent going underground
    if y < 0:
        return [0, 0, 0, 0, 0]

    # Current speed
    v = np.sqrt(vx**2 + vy**2)

    # Gravity (always downward)
    g = gravity(max(y, 0))

    # Atmospheric drag
    rho = atmosphere_density(max(y, 0))
    if v > 0:
        drag = 0.5 * rho * v**2 * CD * AREA
        drag_x = -drag * vx / v
        drag_y = -drag * vy / v
    else:
        drag_x = 0
        drag_y = 0

    # Thrust direction
    thrust = thrust_at_altitude(max(y, 0), t)

    if t < T_GRAVITY_TURN:
        # Vertical ascent phase
        thrust_x = 0
        thrust_y = thrust
        dm = -MASS_FLOW_RATE if t <= T_PUMP_FAILURE else 0
    elif t <= T_PUMP_FAILURE:
        # Gravity turn: pitch angle increases over time
        pitch_from_vertical = (t - T_GRAVITY_TURN) * TURN_RATE
        pitch_from_vertical = min(pitch_from_vertical, np.radians(25))  # max pitch 25°
        thrust_x = thrust * np.sin(pitch_from_vertical)
        thrust_y = thrust * np.cos(pitch_from_vertical)
        dm = -MASS_FLOW_RATE
    elif t <= T_BREAKUP:
        # Post-failure: no meaningful thrust, vehicle tumbling
        # Random tumble approximated as zero net thrust direction
        thrust_x = 0
        thrust_y = 0
        dm = 0
    else:
        thrust_x = 0
        thrust_y = 0
        dm = 0

    # Accelerations
    ax = (thrust_x + drag_x) / mass
    ay = (thrust_y + drag_y) / mass - g

    return [vx, vy, ax, ay, dm]

# ============================================================
# RUN SIMULATION
# ============================================================

print("=" * 60)
print("Pioneer 0 — 77-Second Trajectory Simulation")
print("NASA Mission Series v1.1")
print("=" * 60)
print()

# Initial conditions: on the pad at LC-17A
y0 = [0.0, 0.0, 0.0, 0.0, MASS_TOTAL]

# Solve ODE from T+0 to T+80 (a few seconds past breakup)
t_span = (0, 80)
t_eval = np.linspace(0, 80, 8001)  # 0.01 s resolution

sol = solve_ivp(
    equations_of_motion, t_span, y0,
    method='RK45', t_eval=t_eval,
    max_step=0.05, rtol=1e-8, atol=1e-10
)

t = sol.t
x = sol.y[0]       # downrange (m)
y = sol.y[1]       # altitude (m)
vx = sol.y[2]      # horizontal velocity (m/s)
vy = sol.y[3]      # vertical velocity (m/s)
mass = sol.y[4]    # mass (kg)

# Derived quantities
altitude_km = y / 1000.0
velocity = np.sqrt(vx**2 + vy**2)
acceleration_g = np.zeros_like(t)

# Compute acceleration numerically
for i in range(1, len(t)):
    dt = t[i] - t[i-1]
    if dt > 0:
        dv = velocity[i] - velocity[i-1]
        acceleration_g[i] = (dv / dt) / G
acceleration_g[0] = acceleration_g[1]

# Dynamic pressure
q_dynamic = np.array([0.5 * atmosphere_density(max(alt, 0)) * v**2
                       for alt, v in zip(y, velocity)])

# Find key events
idx_pump = np.argmin(np.abs(t - T_PUMP_FAILURE))
idx_breakup = np.argmin(np.abs(t - T_BREAKUP))

# Find Max-Q
idx_maxq = np.argmax(q_dynamic[:idx_breakup])
t_maxq = t[idx_maxq]
q_max = q_dynamic[idx_maxq]

# Print key values
print(f"Launch mass:            {MASS_TOTAL:.0f} kg")
print(f"Thrust (sea level):     {THRUST_SEA_LEVEL/1000:.0f} kN")
propellant_consumed = MASS_TOTAL - mass[idx_pump]
print(f"Propellant consumed:    {propellant_consumed:.0f} kg")
print()
print("KEY FLIGHT EVENTS:")
print(f"  Max-Q:                T+{t_maxq:.1f} s at {q_max/1000:.1f} kPa")
print(f"  Alt at Max-Q:         {altitude_km[idx_maxq]:.2f} km")
print(f"  Vel at Max-Q:         {velocity[idx_maxq]:.1f} m/s")
print()
print(f"  Turbopump failure:    T+{T_PUMP_FAILURE} s")
print(f"  Alt at failure:       {altitude_km[idx_pump]:.2f} km")
print(f"  Vel at failure:       {velocity[idx_pump]:.1f} m/s")
print(f"  Accel at failure:     {acceleration_g[idx_pump]:.2f} g")
print()
print(f"  Vehicle breakup:      T+{T_BREAKUP} s")
print(f"  Alt at breakup:       {altitude_km[idx_breakup]:.2f} km")
print(f"  Vel at breakup:       {velocity[idx_breakup]:.1f} m/s")
print()
print(f"  Mass at failure:      {mass[idx_pump]:.0f} kg")
print(f"  Downrange at breakup: {x[idx_breakup]/1000:.2f} km")

# ============================================================
# PLOT
# ============================================================

fig, axes = plt.subplots(3, 1, figsize=(12, 14), sharex=True)
fig.suptitle(
    'Pioneer 0 (Thor-Able 1) — 77-Second Flight\n'
    'August 17, 1958 | Cape Canaveral LC-17A',
    fontsize=16, fontweight='bold', y=0.98
)

# Color scheme
COLOR_FLIGHT = '#2196F3'
COLOR_FAILURE = '#F44336'
COLOR_MAXQ = '#FF9800'
COLOR_GRID = '#E0E0E0'

# Only plot up to breakup + a few seconds
mask = t <= 80

# --- Altitude vs Time ---
ax1 = axes[0]
ax1.plot(t[mask], altitude_km[mask], color=COLOR_FLIGHT, linewidth=2.5, label='Altitude')
ax1.axvline(T_PUMP_FAILURE, color=COLOR_FAILURE, linestyle='--', linewidth=1.5, alpha=0.8)
ax1.axvline(T_BREAKUP, color=COLOR_FAILURE, linestyle='-', linewidth=2, alpha=0.9)
ax1.axvline(t_maxq, color=COLOR_MAXQ, linestyle=':', linewidth=1.5, alpha=0.8)

ax1.annotate(f'T+{T_PUMP_FAILURE}s\nTurbopump\nFailure',
             xy=(T_PUMP_FAILURE, altitude_km[idx_pump]),
             xytext=(T_PUMP_FAILURE - 18, altitude_km[idx_pump] + 2),
             fontsize=9, color=COLOR_FAILURE, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=COLOR_FAILURE, lw=1.5))

ax1.annotate(f'T+{T_BREAKUP}s\nBREAKUP\n~{altitude_km[idx_breakup]:.1f} km',
             xy=(T_BREAKUP, altitude_km[idx_breakup]),
             xytext=(T_BREAKUP + 1, altitude_km[idx_breakup] - 3),
             fontsize=9, color=COLOR_FAILURE, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=COLOR_FAILURE, lw=1.5))

ax1.annotate(f'Max-Q\nT+{t_maxq:.0f}s',
             xy=(t_maxq, altitude_km[idx_maxq]),
             xytext=(t_maxq + 5, altitude_km[idx_maxq] - 2),
             fontsize=9, color=COLOR_MAXQ, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=COLOR_MAXQ, lw=1.5))

ax1.set_ylabel('Altitude (km)', fontsize=12)
ax1.set_ylim(-0.5, max(altitude_km[mask]) * 1.15)
ax1.grid(True, alpha=0.3, color=COLOR_GRID)
ax1.legend(loc='upper left', fontsize=10)

# --- Velocity vs Time ---
ax2 = axes[1]
ax2.plot(t[mask], velocity[mask], color='#4CAF50', linewidth=2.5, label='Total Velocity')
ax2.axvline(T_PUMP_FAILURE, color=COLOR_FAILURE, linestyle='--', linewidth=1.5, alpha=0.8)
ax2.axvline(T_BREAKUP, color=COLOR_FAILURE, linestyle='-', linewidth=2, alpha=0.9)

ax2.annotate(f'{velocity[idx_pump]:.0f} m/s\nat failure',
             xy=(T_PUMP_FAILURE, velocity[idx_pump]),
             xytext=(T_PUMP_FAILURE - 20, velocity[idx_pump] * 0.7),
             fontsize=9, color=COLOR_FAILURE, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=COLOR_FAILURE, lw=1.5))

ax2.set_ylabel('Velocity (m/s)', fontsize=12)
ax2.grid(True, alpha=0.3, color=COLOR_GRID)
ax2.legend(loc='upper left', fontsize=10)

# --- Acceleration vs Time ---
ax3 = axes[2]
ax3.plot(t[mask], acceleration_g[mask], color='#9C27B0', linewidth=2.5, label='Acceleration')
ax3.axvline(T_PUMP_FAILURE, color=COLOR_FAILURE, linestyle='--', linewidth=1.5, alpha=0.8)
ax3.axvline(T_BREAKUP, color=COLOR_FAILURE, linestyle='-', linewidth=2, alpha=0.9)
ax3.axhline(0, color='black', linewidth=0.5)

ax3.annotate(f'T+{T_PUMP_FAILURE}s\nThrust cutoff',
             xy=(T_PUMP_FAILURE, acceleration_g[idx_pump]),
             xytext=(T_PUMP_FAILURE - 18, acceleration_g[idx_pump] + 1),
             fontsize=9, color=COLOR_FAILURE, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=COLOR_FAILURE, lw=1.5))

ax3.set_ylabel('Acceleration (g)', fontsize=12)
ax3.set_xlabel('Time (seconds from liftoff)', fontsize=12)
ax3.grid(True, alpha=0.3, color=COLOR_GRID)
ax3.legend(loc='upper left', fontsize=10)

# Shared formatting
for ax in axes:
    ax.xaxis.set_major_locator(ticker.MultipleLocator(10))
    ax.xaxis.set_minor_locator(ticker.MultipleLocator(5))
    ax.tick_params(labelsize=10)

plt.tight_layout(rect=[0, 0, 1, 0.96])

# Save
output_path = 'trajectory_77sec.png'
plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor='white')
print()
print(f"Plot saved: {output_path}")
print()
print("=" * 60)
print(f"\"Seventy-seven seconds of flight consumed ~{propellant_consumed:.0f} kg of")
print(f" propellant. The lessons consumed zero additional fuel.\"")
print("=" * 60)

plt.close()
