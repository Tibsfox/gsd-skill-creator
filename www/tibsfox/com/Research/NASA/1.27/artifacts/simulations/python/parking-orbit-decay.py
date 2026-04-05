#!/usr/bin/env python3
"""
Ranger 2 Parking Orbit Decay Simulator
Mission 1.27 — November 18, 1961

Simulates the 2-day orbital decay of Ranger 2 from its
150 x 242 km parking orbit through atmospheric reentry.

The Agena B roll gyroscope failed, preventing the injection
burn. The spacecraft was stranded in an orbit designed to
last 90 minutes and survived for 48 hours.
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Constants
mu = 3.986e14       # Earth gravitational parameter (m^3/s^2)
R_e = 6.371e6       # Earth radius (m)
g0 = 9.81           # gravitational acceleration (m/s^2)

# Atmospheric density model (exponential, simplified)
def atmo_density(h_km):
    """Approximate atmospheric density at altitude h (km)"""
    if h_km < 120:
        return 1e-7  # very dense, rapid reentry
    elif h_km < 180:
        rho0 = 3.2e-10
        H = 20.0
        return rho0 * np.exp(-(h_km - 150) / H)
    elif h_km < 300:
        rho0 = 1.2e-11
        H = 28.0
        return rho0 * np.exp(-(h_km - 250) / H)
    else:
        rho0 = 8e-13
        H = 35.0
        return rho0 * np.exp(-(h_km - 350) / H)

# Ranger 2 parameters
m_sc = 304.0        # spacecraft mass (kg)
Cd = 2.2            # drag coefficient
A = 4.0             # cross-sectional area (m^2)
B = Cd * A / (2 * m_sc)  # ballistic coefficient factor

# Initial orbit
h_p0 = 150.0        # initial perigee altitude (km)
h_a0 = 242.0        # initial apogee altitude (km)

# Simulation
dt = 60.0           # time step (seconds)
t_max = 200 * 3600  # max simulation time (200 hours)

# Storage
times = []
perigees = []
apogees = []
periods = []

h_p = h_p0
h_a = h_a0

t = 0
while t < t_max and h_p > 80:  # 80 km = reentry threshold
    r_p = R_e + h_p * 1e3
    r_a = R_e + h_a * 1e3
    a = (r_p + r_a) / 2
    T = 2 * np.pi * np.sqrt(a**3 / mu)
    v_p = np.sqrt(mu * (2/r_p - 1/a))
    
    # Atmospheric drag at perigee
    rho_p = atmo_density(h_p)
    drag_decel = B * rho_p * v_p**2
    
    # Approximate semi-major axis change per orbit
    da_per_orbit = -2 * np.pi * a * a * rho_p * Cd * A / m_sc
    
    # Update orbit (per time step)
    da_per_dt = da_per_orbit / T * dt
    a_new = a + da_per_dt
    
    # Update perigee and apogee (simplified: perigee drops faster)
    h_a = (2 * a_new - r_p) / 1e3 - R_e / 1e3
    h_p = h_p + da_per_dt / 1e3 * 0.6  # perigee drops faster
    
    times.append(t / 3600)
    perigees.append(h_p)
    apogees.append(h_a)
    periods.append(T / 60)
    
    t += dt

# Plot
fig, axes = plt.subplots(2, 1, figsize=(12, 8), gridspec_kw={'height_ratios': [3, 1]})

# Altitude plot
ax1 = axes[0]
ax1.fill_between(times, perigees, apogees, alpha=0.2, color='#4A8A4A', label='Orbit band')
ax1.plot(times, perigees, color='#CC4444', linewidth=2, label='Perigee altitude')
ax1.plot(times, apogees, color='#4A8A4A', linewidth=2, label='Apogee altitude')

# Mark events
ax1.axhline(y=100, color='#FF6600', linestyle='--', alpha=0.5, label='Reentry threshold (100 km)')
ax1.axvline(x=0, color='#FFD700', linestyle=':', alpha=0.5)
ax1.axvline(x=1.5, color='#CC4444', linestyle=':', alpha=0.7)
ax1.axvline(x=20, color='#FF8800', linestyle=':', alpha=0.7)
ax1.axvline(x=23, color='#FF4444', linestyle=':', alpha=0.7)

# Annotations
ax1.annotate('LAUNCH\n08:12 UTC', xy=(0, 150), fontsize=8, color='#FFD700',
            ha='left', va='bottom')
ax1.annotate('GYROSCOPE\nFAILURE', xy=(1.5, 230), fontsize=8, color='#CC4444',
            ha='center', va='top')
ax1.annotate('N₂ EXHAUSTED\nTUMBLE BEGINS', xy=(20, 200), fontsize=8, color='#FF8800',
            ha='center', va='top')
ax1.annotate('SIGNAL LOST', xy=(23, 180), fontsize=8, color='#FF4444',
            ha='center', va='top')

ax1.set_ylabel('Altitude (km)', fontsize=12)
ax1.set_title('Ranger 2 — Parking Orbit Decay (November 18-20, 1961)', fontsize=14)
ax1.legend(loc='upper right', fontsize=9)
ax1.set_xlim(0, max(times))
ax1.grid(alpha=0.2)

# Period plot
ax2 = axes[1]
ax2.plot(times, periods, color='#7EB8DA', linewidth=1.5)
ax2.set_xlabel('Time Since Launch (hours)', fontsize=12)
ax2.set_ylabel('Period (min)', fontsize=12)
ax2.grid(alpha=0.2)

plt.tight_layout()
plt.savefig('ranger2_orbital_decay.png', dpi=150, facecolor='#0D160D')
print("Saved: ranger2_orbital_decay.png")
print(f"\nSimulation results:")
print(f"  Initial orbit: {h_p0:.0f} x {h_a0:.0f} km")
print(f"  Reentry after: {times[-1]:.1f} hours ({times[-1]/24:.1f} days)")
print(f"  Final perigee: {perigees[-1]:.0f} km")
print(f"  Total orbits:  {t / (88.3*60):.0f}")
print(f"\n  One gyroscope. Two days. Then plasma.")
