#!/usr/bin/env python3
"""
Orbital Decay Comparison: Explorer 1 vs Explorer 3
Mission 1.9 — Explorer 3 (confirmed Van Allen belts with tape recorder)

Compares the orbital decay of:
  - Explorer 1: 358 x 2,550 km perigee, lasted ~12 years (re-entered March 31, 1970)
  - Explorer 3: 186 x 2,799 km perigee, lasted ~3 months (re-entered June 27, 1958)

The difference: 172 km of perigee altitude. That's the distance from
Seattle to Portland. In orbital mechanics, it's the difference between
12 years and 93 days.

Atmospheric density decreases exponentially with altitude. At 358 km,
the density is roughly 100x greater than at 654 km (Vanguard 1).
At 186 km, the density is roughly 50x greater than at 358 km.
These density differences compound with every orbit.

This simulation uses a simplified atmospheric model with solar cycle
effects to show how perigee altitude evolves over time for both
satellites. The 11-year solar cycle modulates upper atmospheric
density by a factor of 5-10, causing periodic accelerations in
orbital decay.

Run: python3 orbital-decay.py
Requires: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================
# CONSTANTS
# ============================================

R_EARTH = 6371.0    # km
MU = 3.986e5        # km^3/s^2 (gravitational parameter)
G0 = 9.81           # m/s^2

# ============================================
# ATMOSPHERIC DENSITY MODEL
# ============================================

def atmospheric_density(alt_km, solar_activity=0.5):
    """
    Simplified exponential atmosphere model with solar cycle effects.

    solar_activity: 0 = solar minimum, 1 = solar maximum
    Returns density in kg/m^3.

    Based on simplified NRLMSISE-00 model at moderate latitudes.
    The density at any altitude scales by ~5-10x between solar min/max.
    """
    # Base density and scale height at reference altitudes
    # (alt_km, rho_0 in kg/m^3, scale_height in km)
    layers = [
        (150, 2.0e-9,  22),
        (200, 2.5e-10, 29),
        (250, 6.0e-11, 34),
        (300, 1.9e-11, 38),
        (350, 6.8e-12, 44),
        (400, 2.8e-12, 50),
        (500, 5.2e-13, 58),
        (600, 1.3e-13, 65),
        (700, 3.6e-14, 72),
        (800, 1.1e-14, 80),
    ]

    # Find bracketing layer
    rho_ref = layers[0][1]
    H = layers[0][2]
    alt_ref = layers[0][0]

    for i in range(len(layers) - 1):
        if alt_km >= layers[i][0] and alt_km < layers[i+1][0]:
            alt_ref = layers[i][0]
            rho_ref = layers[i][1]
            H = layers[i][2]
            break
    else:
        if alt_km >= layers[-1][0]:
            alt_ref = layers[-1][0]
            rho_ref = layers[-1][1]
            H = layers[-1][2]

    rho = rho_ref * np.exp(-(alt_km - alt_ref) / H)

    # Solar activity effect: density scales by factor of 3-8
    # at high altitudes during solar maximum
    solar_factor = 1.0 + solar_activity * (4.0 + alt_km / 200.0)
    rho *= solar_factor

    return rho


def solar_activity_cycle(time_years, start_year=1958.0):
    """
    Model the 11-year solar cycle.
    Solar Cycle 19 peaked around 1958 (very strong cycle).
    Returns activity level 0-1.
    """
    # Approximate: cycle peaks around 1958, 1969, 1980, 1991, 2002, 2013
    cycle_period = 11.0
    phase = ((start_year + time_years - 1958.0) % cycle_period) / cycle_period

    # Sinusoidal approximation with asymmetric rise/fall
    if isinstance(phase, np.ndarray):
        activity = np.where(phase < 0.4,
                           0.5 + 0.5 * np.sin(phase / 0.4 * np.pi - np.pi/2),
                           0.5 + 0.5 * np.sin((phase - 0.4) / 0.6 * np.pi + np.pi/2))
    else:
        if phase < 0.4:
            activity = 0.5 + 0.5 * np.sin(phase / 0.4 * np.pi - np.pi/2)
        else:
            activity = 0.5 + 0.5 * np.sin((phase - 0.4) / 0.6 * np.pi + np.pi/2)

    return np.clip(activity, 0, 1)


# ============================================
# ORBITAL DECAY SIMULATION
# ============================================

def simulate_decay(perigee_km, apogee_km, mass_kg, area_m2, Cd=2.2,
                   max_years=15.0, dt_days=1.0, start_year=1958.0):
    """
    Simulate orbital decay by tracking perigee altitude changes.

    Uses the King-Hele theory for orbit-averaged drag:
    - Drag primarily affects the orbit at perigee (lowest point)
    - Each orbit, drag reduces the apogee
    - Perigee stays roughly constant until late in the decay
    - Final rapid spiral-in occurs when the orbit circularizes near perigee

    Returns arrays of (time_years, perigee_km, apogee_km).
    """
    r_p = R_EARTH + perigee_km
    r_a = R_EARTH + apogee_km
    a = (r_p + r_a) / 2.0          # semi-major axis (km)
    e = (r_a - r_p) / (r_a + r_p)  # eccentricity

    # Ballistic coefficient (m^2/kg)
    beta = Cd * area_m2 / mass_kg

    times = [0.0]
    perigees = [perigee_km]
    apogees = [apogee_km]

    t = 0.0  # days
    dt = dt_days

    while t < max_years * 365.25 and perigee_km > 120:
        # Current orbital period (seconds)
        T = 2 * np.pi * np.sqrt((a * 1e3)**3 / (MU * 1e9))

        # Orbits per time step
        orbits_per_step = dt * 86400.0 / T

        # Atmospheric density at perigee
        year = t / 365.25
        solar = solar_activity_cycle(year, start_year)
        rho = atmospheric_density(perigee_km, solar)

        # Orbital velocity at perigee (m/s)
        v_p = np.sqrt(MU * 1e9 * (2.0 / (r_p * 1e3) - 1.0 / (a * 1e3)))

        # Drag acceleration at perigee (m/s^2)
        a_drag = 0.5 * rho * v_p**2 * beta

        # Delta-v per orbit (simplified: drag acts over a fraction of the orbit
        # near perigee; effective arc length ~ 2*sqrt(2*pi*a*H) for H = scale height)
        H = 40.0e3  # approximate scale height in meters at perigee
        drag_arc = 2.0 * np.sqrt(2 * np.pi * a * 1e3 * H)  # effective drag arc (m)
        delta_v = a_drag * drag_arc / v_p  # delta-v per orbit (m/s)

        # Total delta-v per time step
        total_dv = delta_v * orbits_per_step

        # Update semi-major axis: da = -2*a^2*v/mu * dv (vis-viva)
        da = -2.0 * (a * 1e3)**2 / (MU * 1e9) * v_p * total_dv  # meters
        a += da / 1e3  # convert to km

        # Eccentricity change: drag mostly lowers apogee (circularizing)
        # de/dt ≈ -(1-e^2)/(a*e) * da/dt * (for aerobraking)
        if e > 0.001:
            # Apogee decreases faster than perigee
            r_a_new = 2 * a - r_p
            if r_a_new < r_p:
                r_a_new = r_p  # circular orbit
            apogee_km = r_a_new - R_EARTH
            r_a = r_a_new
            e = (r_a - r_p) / (r_a + r_p) if (r_a + r_p) > 0 else 0

            # Once orbit is nearly circular, perigee drops with apogee
            if e < 0.01:
                perigee_km = a - R_EARTH
                r_p = R_EARTH + perigee_km
        else:
            # Circular orbit: both perigee and apogee drop together
            perigee_km = a - R_EARTH
            apogee_km = a - R_EARTH
            r_p = R_EARTH + perigee_km
            r_a = r_p

        t += dt
        times.append(t / 365.25)  # Convert to years
        perigees.append(max(perigee_km, 0))
        apogees.append(max(apogee_km, 0))

        # Stop if re-entered
        if perigee_km < 120:
            break

    return np.array(times), np.array(perigees), np.array(apogees)


# ============================================
# RUN SIMULATIONS
# ============================================

print('Simulating orbital decay...')
print()

# Explorer 1: launched Jan 31, 1958
e1_t, e1_peri, e1_apo = simulate_decay(
    perigee_km=358, apogee_km=2550,
    mass_kg=13.97, area_m2=0.036,  # cylindrical cross-section
    max_years=15.0, dt_days=1.0,
    start_year=1958.08
)

# Explorer 3: launched Mar 26, 1958
e3_t, e3_peri, e3_apo = simulate_decay(
    perigee_km=186, apogee_km=2799,
    mass_kg=14.1, area_m2=0.036,  # same instrument package
    max_years=2.0, dt_days=0.1,   # finer resolution for short life
    start_year=1958.24
)

# ============================================
# PLOTTING
# ============================================

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.patch.set_facecolor('#0a0a1a')
fig.suptitle('Orbital Decay: Explorer 1 vs Explorer 3',
             color='#D4A830', fontsize=16, fontweight='bold', y=0.98)

for ax in axes.flat:
    ax.set_facecolor('#080810')
    ax.tick_params(colors='#888888')
    for spine in ax.spines.values():
        spine.set_color('#333333')
    ax.grid(True, alpha=0.15, color='#444444')

# --- Panel 1: Explorer 1 orbital evolution ---
ax1 = axes[0, 0]
ax1.plot(e1_t, e1_apo, color='#CC8844', linewidth=1.5, label='Apogee')
ax1.plot(e1_t, e1_peri, color='#40CC40', linewidth=1.5, label='Perigee')
ax1.fill_between(e1_t, e1_peri, e1_apo, alpha=0.1, color='#888888')
ax1.axhline(y=120, color='#CC3333', linestyle='--', alpha=0.5, label='Re-entry (~120 km)')
ax1.set_xlabel('Time (years from launch)', color='#888888')
ax1.set_ylabel('Altitude (km)', color='#888888')
ax1.set_title('Explorer 1: 358 x 2,550 km', color='#D0D4D8', fontsize=11)
ax1.legend(facecolor='#080810', edgecolor='#333333', labelcolor='#AAAAAA', fontsize=9)
ax1.set_ylim(0, 2700)

# Annotate re-entry
if e1_peri[-1] < 120:
    ax1.annotate(f'Re-entry: {e1_t[-1]:.1f} years',
                 xy=(e1_t[-1], 120), xytext=(e1_t[-1]-3, 500),
                 color='#CC3333', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#CC3333'))

# --- Panel 2: Explorer 3 orbital evolution ---
ax2 = axes[0, 1]
e3_t_days = e3_t * 365.25  # Convert to days for clarity
ax2.plot(e3_t_days, e3_apo, color='#CC8844', linewidth=1.5, label='Apogee')
ax2.plot(e3_t_days, e3_peri, color='#40CC40', linewidth=1.5, label='Perigee')
ax2.fill_between(e3_t_days, e3_peri, e3_apo, alpha=0.1, color='#888888')
ax2.axhline(y=120, color='#CC3333', linestyle='--', alpha=0.5, label='Re-entry (~120 km)')
ax2.set_xlabel('Time (days from launch)', color='#888888')
ax2.set_ylabel('Altitude (km)', color='#888888')
ax2.set_title('Explorer 3: 186 x 2,799 km', color='#D0D4D8', fontsize=11)
ax2.legend(facecolor='#080810', edgecolor='#333333', labelcolor='#AAAAAA', fontsize=9)
ax2.set_ylim(0, 3000)

# Annotate re-entry
if e3_peri[-1] < 120:
    ax2.annotate(f'Re-entry: {e3_t_days[-1]:.0f} days',
                 xy=(e3_t_days[-1], 120), xytext=(e3_t_days[-1]-20, 800),
                 color='#CC3333', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#CC3333'))

# --- Panel 3: Atmospheric density comparison ---
ax3 = axes[1, 0]
altitudes = np.linspace(150, 700, 200)
rho_min = [atmospheric_density(a, 0.0) for a in altitudes]
rho_max = [atmospheric_density(a, 1.0) for a in altitudes]
rho_mid = [atmospheric_density(a, 0.5) for a in altitudes]

ax3.semilogy(altitudes, rho_mid, color='#D4A830', linewidth=1.5, label='Solar moderate')
ax3.fill_between(altitudes, rho_min, rho_max, alpha=0.2, color='#D4A830',
                  label='Solar min/max range')
ax3.axvline(x=186, color='#40CC40', linestyle='--', alpha=0.7, label=f'Explorer 3 perigee ({E3_PERIGEE} km)')
ax3.axvline(x=358, color='#CC8844', linestyle='--', alpha=0.7, label=f'Explorer 1 perigee ({E1_PERIGEE} km)')
ax3.set_xlabel('Altitude (km)', color='#888888')
ax3.set_ylabel('Density (kg/m$^3$)', color='#888888')
ax3.set_title('Atmospheric Density vs Altitude', color='#D0D4D8', fontsize=11)
ax3.legend(facecolor='#080810', edgecolor='#333333', labelcolor='#AAAAAA', fontsize=8)

# Annotate density ratio
rho_186 = atmospheric_density(186, 0.5)
rho_358 = atmospheric_density(358, 0.5)
ratio = rho_186 / rho_358
ax3.text(270, np.sqrt(rho_186 * rho_358),
         f'Density ratio:\n{ratio:.0f}x',
         color='#D4A830', fontsize=10, ha='center',
         bbox=dict(boxstyle='round,pad=0.3', facecolor='#0a0a1a',
                   edgecolor='#D4A830', alpha=0.8))

# --- Panel 4: Solar cycle effect ---
ax4 = axes[1, 1]
years = np.linspace(0, 15, 500)
solar = solar_activity_cycle(years, 1958.0)
ax4.plot(1958 + years, solar, color='#D4A830', linewidth=1.5)
ax4.fill_between(1958 + years, solar, alpha=0.2, color='#D4A830')
ax4.axvspan(1958.24, 1958.24 + 93/365.25, alpha=0.3, color='#40CC40',
            label='Explorer 3 lifetime (93 days)')
ax4.axvspan(1958.08, 1970.25, alpha=0.1, color='#CC8844',
            label='Explorer 1 lifetime (12 years)')
ax4.set_xlabel('Year', color='#888888')
ax4.set_ylabel('Solar Activity', color='#888888')
ax4.set_title('Solar Cycle 19 (strongest on record)', color='#D0D4D8', fontsize=11)
ax4.legend(facecolor='#080810', edgecolor='#333333', labelcolor='#AAAAAA', fontsize=8)
ax4.set_xlim(1957, 1973)

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.savefig('orbital-decay.png', dpi=150, facecolor=fig.get_facecolor(),
            bbox_inches='tight')
plt.show()

# ============================================
# TEXT SUMMARY
# ============================================

print('=' * 70)
print('Orbital Decay Comparison')
print('=' * 70)
print()
print(f'Explorer 1:')
print(f'  Orbit: {E1_PERIGEE} x {E1_APOGEE} km')
print(f'  Mass: 13.97 kg')
print(f'  Launched: January 31, 1958')
print(f'  Re-entered: March 31, 1970')
print(f'  Lifetime: ~12 years')
print(f'  Simulated lifetime: {e1_t[-1]:.1f} years')
print()
print(f'Explorer 3:')
print(f'  Orbit: {E3_PERIGEE} x {E3_APOGEE} km')
print(f'  Mass: 14.1 kg')
print(f'  Launched: March 26, 1958')
print(f'  Re-entered: June 27, 1958')
print(f'  Lifetime: 93 days (~0.25 years)')
print(f'  Simulated lifetime: {e3_t[-1]:.2f} years ({e3_t[-1]*365.25:.0f} days)')
print()
print(f'Perigee difference: {E1_PERIGEE - E3_PERIGEE} km')
print(f'  = the distance from Seattle to Portland')
print(f'  = the difference between 12 years and 93 days')
print()
print(f'Atmospheric density at {E3_PERIGEE} km: {rho_186:.2e} kg/m^3')
print(f'Atmospheric density at {E1_PERIGEE} km: {rho_358:.2e} kg/m^3')
print(f'Density ratio: {ratio:.0f}x')
print()
print(f'Explorer 3 experienced ~{ratio:.0f}x more drag per perigee pass.')
print(f'Combined with the stronger solar activity in early 1958')
print(f'(Solar Cycle 19 was the strongest on record), Explorer 3')
print(f'decayed rapidly. It completed its mission — confirming the')
print(f'Van Allen belts — in just 93 days before the atmosphere')
print(f'reclaimed it.')
print()
print(f'The 172 km difference in perigee altitude was the price')
print(f'Explorer 3 paid for its lower orbit. But the tape recorder')
print(f'made those 93 days worth more than Explorer 1\'s 12 years')
print(f'of fragmentary data — because every orbit was recorded.')
