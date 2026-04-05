#!/usr/bin/env python3
"""
Ranger 1 Orbital Decay Simulator
Mission 1.26 — NASA Mission Series

Simulates the seven-day orbital decay of Ranger 1 from its 160 km parking orbit
to atmospheric reentry on August 30, 1961. Demonstrates the exponential feedback
loop: lower altitude → higher density → more drag → lower altitude.

Requirements: numpy, matplotlib
Hardware: Any system capable of running Python 3.8+
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle

# Constants
MU = 3.986e14        # Earth gravitational parameter (m^3/s^2)
R_EARTH = 6.371e6    # Earth radius (m)
G0 = 9.81            # Standard gravity (m/s^2)

# Ranger 1 parameters
M_TOTAL = 900.0      # spacecraft + Agena dry mass (kg)
CD = 2.2             # drag coefficient
A_CROSS = 5.0        # cross-sectional area (m^2)
H_INIT = 160.0       # initial altitude (km)

def atmospheric_density(h_km):
    """Exponential atmospheric density model (simplified)."""
    if h_km <= 100:
        return 5.6e-7
    elif h_km <= 150:
        H = 22.0
        rho_ref = 2.1e-9
        return rho_ref * np.exp(-(h_km - 150) / H)
    elif h_km <= 300:
        H = 40.0
        rho_ref = 2.1e-9
        return rho_ref * np.exp(-(h_km - 150) / H)
    else:
        H = 58.0
        rho_ref = 2.1e-9 * np.exp(-(300 - 150) / 40.0)
        return rho_ref * np.exp(-(h_km - 300) / H)

def simulate_decay(h_init_km, m_kg, cd, area, dt_hours=0.1):
    """Simulate orbital decay using simplified King-Hele model."""
    h = h_init_km
    t = 0.0
    dt = dt_hours
    
    times = [t]
    altitudes = [h]
    densities = [atmospheric_density(h)]
    periods = []
    
    r = R_EARTH + h * 1000
    T = 2 * np.pi * np.sqrt(r**3 / MU)
    periods.append(T / 60)  # minutes
    
    while h > 80 and t < 240:  # stop at 80 km or 10 days
        r = R_EARTH + h * 1000
        v = np.sqrt(MU / r)
        rho = atmospheric_density(h)
        
        # Drag force
        F_drag = 0.5 * rho * v**2 * cd * area
        
        # Altitude decay rate (simplified)
        # dh/dt = -(F_drag / m) * (r / v) * 3600 / 1000
        dh_dt = -F_drag * r / (m_kg * v) * 3.6  # km/hr (approximate)
        
        h += dh_dt * dt
        t += dt
        
        if h < 80:
            h = 80.0
        
        times.append(t)
        altitudes.append(h)
        densities.append(atmospheric_density(h))
        r_new = R_EARTH + h * 1000
        T_new = 2 * np.pi * np.sqrt(r_new**3 / MU)
        periods.append(T_new / 60)
    
    return np.array(times), np.array(altitudes), np.array(densities), np.array(periods)

# Run simulations
print("RANGER 1 ORBITAL DECAY SIMULATION")
print("=" * 60)

t, alt, rho, per = simulate_decay(H_INIT, M_TOTAL, CD, A_CROSS)

print(f"Initial altitude: {H_INIT} km")
print(f"Reentry (80 km) at: {t[-1]:.1f} hours = {t[-1]/24:.1f} days")
print(f"Historical: ~7 days (168 hours)")

# Also simulate what-if scenarios
t_200, alt_200, _, _ = simulate_decay(200, M_TOTAL, CD, A_CROSS)
t_300, alt_300, _, _ = simulate_decay(300, M_TOTAL, CD, A_CROSS)

# ---- PLOT 1: Altitude vs Time ----
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Ranger 1: Orbital Decay from 160 km Parking Orbit\n'
             'Mission 1.26 — August 23–30, 1961', 
             fontsize=14, fontweight='bold', color='#E8E0D8')
fig.patch.set_facecolor('#0D0A08')

ax = axes[0, 0]
ax.set_facecolor('#1A0E08')
ax.plot(t / 24, alt, color='#D4A830', linewidth=2, label='Ranger 1 (160 km)')
ax.plot(t_200 / 24, alt_200, color='#7EB8DA', linewidth=1.5, alpha=0.7, 
        linestyle='--', label='What-if: 200 km')
ax.plot(t_300 / 24, alt_300, color='#6B8E23', linewidth=1.5, alpha=0.7, 
        linestyle=':', label='What-if: 300 km')
ax.axhline(y=80, color='#CC5540', linestyle='-', alpha=0.5, linewidth=1)
ax.text(0.5, 85, 'REENTRY', color='#CC5540', fontsize=8)

for day in range(1, 8):
    ax.axvline(x=day, color='#4A3828', linestyle=':', alpha=0.4)
    ax.text(day, alt.max() * 0.95, f'Day {day}', color='#A09888', 
            fontsize=7, ha='center')

ax.set_xlabel('Time (days)', color='#A09888')
ax.set_ylabel('Altitude (km)', color='#A09888')
ax.set_title('Altitude vs Time', color='#8FAE43')
ax.legend(loc='upper right', fontsize=8, facecolor='#1A0E08', 
          edgecolor='#4A3828', labelcolor='#E8E0D8')
ax.tick_params(colors='#A09888')
ax.set_xlim(0, max(t[-1]/24, 10))
ax.set_ylim(70, max(H_INIT, 200) * 1.1)

# ---- PLOT 2: Density vs Altitude ----
ax = axes[0, 1]
ax.set_facecolor('#1A0E08')
alt_range = np.linspace(100, 600, 200)
rho_range = [atmospheric_density(h) for h in alt_range]
ax.semilogy(alt_range, rho_range, color='#6B8E23', linewidth=2)
ax.axvline(x=160, color='#D4A830', linestyle='--', linewidth=2, label='Ranger 1: 160 km')
ax.axvline(x=400, color='#7EB8DA', linestyle=':', linewidth=1.5, label='ISS: ~400 km')
ax.set_xlabel('Altitude (km)', color='#A09888')
ax.set_ylabel('Density (kg/m³)', color='#A09888')
ax.set_title('Atmospheric Density (Exponential)', color='#8FAE43')
ax.legend(fontsize=8, facecolor='#1A0E08', edgecolor='#4A3828', labelcolor='#E8E0D8')
ax.tick_params(colors='#A09888')

# ---- PLOT 3: Orbital Period ----
ax = axes[1, 0]
ax.set_facecolor('#1A0E08')
ax.plot(t / 24, per, color='#D4A830', linewidth=2)
ax.set_xlabel('Time (days)', color='#A09888')
ax.set_ylabel('Orbital Period (minutes)', color='#A09888')
ax.set_title('Orbital Period (decreasing as orbit lowers)', color='#8FAE43')
ax.tick_params(colors='#A09888')

# ---- PLOT 4: Energy ----
ax = axes[1, 1]
ax.set_facecolor('#1A0E08')
r_arr = R_EARTH + alt * 1000
energy = -MU / (2 * r_arr)  # specific orbital energy (J/kg)
ax.plot(t / 24, energy / 1e6, color='#D4A830', linewidth=2, label='Actual (parking orbit)')

# The intended trajectory energy
a_target = (R_EARTH + 160e3 + 1.1e9) / 2
e_target = -MU / (2 * a_target)
ax.axhline(y=e_target / 1e6, color='#6B8E23', linestyle='--', linewidth=1.5, 
           label=f'Intended (deep space): {e_target/1e6:.1f} MJ/kg')
ax.set_xlabel('Time (days)', color='#A09888')
ax.set_ylabel('Specific Energy (MJ/kg)', color='#A09888')
ax.set_title('Orbital Energy: Actual vs Intended', color='#8FAE43')
ax.legend(fontsize=8, facecolor='#1A0E08', edgecolor='#4A3828', labelcolor='#E8E0D8')
ax.tick_params(colors='#A09888')

plt.tight_layout()
plt.savefig('ranger1_orbital_decay.png', dpi=150, facecolor='#0D0A08', 
            bbox_inches='tight')
plt.show()
print("\nPlot saved: ranger1_orbital_decay.png")
