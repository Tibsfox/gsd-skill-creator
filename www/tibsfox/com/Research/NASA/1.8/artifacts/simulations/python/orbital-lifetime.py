#!/usr/bin/env python3
"""
Orbital Lifetime Model — Vanguard 1
=====================================
Mission 1.8 — Vanguard 1, March 17, 1958

Models the orbital decay of Vanguard 1 from 1958 to 2250+, showing
why it will remain in orbit for approximately 240 more years.

Vanguard 1 has the highest perigee of any early satellite (654 km),
which places it well above the densest part of the atmosphere. Combined
with its low mass-to-area ratio (ballistic coefficient), this gives it
an extraordinarily long orbital lifetime. Explorer 1, with a perigee of
358 km, re-entered in 1970 (12 years). Vanguard 1, with a perigee just
300 km higher, will last 300+ years.

The model includes:
- Atmospheric drag using exponential density model
- Solar activity cycles (11-year, affects upper atmosphere density)
- Secular perigee evolution
- Comparison with other early satellites

Usage:
    python orbital-lifetime.py              # Show plots
    python orbital-lifetime.py --save       # Save to PNG

Requirements:
    pip install numpy matplotlib
"""

import numpy as np
import sys

HAS_DISPLAY = '--save' not in sys.argv
if not HAS_DISPLAY:
    import matplotlib
    matplotlib.use('Agg')

import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec

# ============================================================
# Physical Constants
# ============================================================

R_EARTH = 6371.0        # km
MU_EARTH = 398600.4     # km^3/s^2
G0 = 9.80665            # m/s^2

# Vanguard 1 parameters
MASS = 1.47             # kg
DIAMETER = 0.165        # m (16.5 cm)
AREA = np.pi * (DIAMETER / 2) ** 2  # cross-sectional area, m^2
CD = 2.2                # drag coefficient (sphere)

# Initial orbital elements (March 17, 1958)
PERIGEE_INIT = 654.0    # km altitude
APOGEE_INIT = 3969.0    # km altitude
INCLINATION = 34.25     # degrees
PERIOD_INIT = 134.2     # minutes

# Derived
A_INIT = R_EARTH + (PERIGEE_INIT + APOGEE_INIT) / 2.0  # semi-major axis, km
ECC_INIT = (APOGEE_INIT - PERIGEE_INIT) / (2 * A_INIT - 2 * R_EARTH + APOGEE_INIT + PERIGEE_INIT)

# Ballistic coefficient
BETA = MASS / (CD * AREA)  # kg/m^2

# ============================================================
# Atmospheric Density Model (exponential)
# ============================================================

# Scale heights and base densities for different altitude regimes
# Simplified Harris-Priester-like model
ATMO_LAYERS = [
    # (h_base_km, rho_base_kg_m3, H_km)
    (150, 2.07e-9, 22.5),
    (200, 2.79e-10, 29.7),
    (250, 7.25e-11, 37.1),
    (300, 2.42e-11, 45.5),
    (400, 3.73e-12, 53.6),
    (500, 6.97e-13, 63.2),
    (600, 1.45e-13, 71.8),
    (700, 3.61e-14, 88.7),
    (800, 1.17e-14, 124.0),
    (900, 5.24e-15, 181.0),
    (1000, 3.02e-15, 268.0),
]

def atmo_density(h_km, solar_activity=0.5):
    """
    Atmospheric density at altitude h_km.
    solar_activity: 0.0 = solar minimum, 1.0 = solar maximum.
    At solar max, upper atmosphere density increases ~10x at 600+ km.
    """
    if h_km < 150:
        return 1e-8  # very dense, rapid decay
    if h_km > 1500:
        return 1e-18  # essentially zero

    # Find the appropriate layer
    rho = 1e-18
    for i, (h_base, rho_base, H) in enumerate(ATMO_LAYERS):
        if i < len(ATMO_LAYERS) - 1:
            h_next = ATMO_LAYERS[i + 1][0]
        else:
            h_next = 2000.0

        if h_base <= h_km < h_next:
            rho = rho_base * np.exp(-(h_km - h_base) / H)
            break

    # Solar activity modulation
    # At high altitudes, solar max increases density by factor ~5-10
    solar_factor = 1.0 + solar_activity * 8.0 * np.exp(-(h_km - 400) ** 2 / (200 ** 2))
    return rho * solar_factor

# ============================================================
# Orbital Decay Model
# ============================================================

def orbital_decay(years=350, dt_days=30):
    """
    Simulate orbital decay from initial conditions.
    Returns time (years), perigee (km), apogee (km), period (minutes).
    """
    n_steps = int(years * 365.25 / dt_days)

    t_years = np.zeros(n_steps)
    perigee = np.zeros(n_steps)
    apogee = np.zeros(n_steps)
    period = np.zeros(n_steps)

    # Initial conditions
    a = A_INIT  # semi-major axis, km
    e = ECC_INIT  # eccentricity

    for i in range(n_steps):
        t_years[i] = i * dt_days / 365.25
        year = 1958 + t_years[i]

        h_peri = a * (1 - e) - R_EARTH  # perigee altitude, km
        h_apo = a * (1 + e) - R_EARTH   # apogee altitude, km

        perigee[i] = h_peri
        apogee[i] = h_apo
        period[i] = 2 * np.pi * np.sqrt((a * 1000) ** 3 / (MU_EARTH * 1e9)) / 60.0  # minutes

        if h_peri < 100:
            # Re-entry
            perigee[i:] = 0
            apogee[i:] = 0
            period[i:] = 0
            t_years[i:] = t_years[i]
            break

        # Solar activity cycle (11-year)
        solar_cycle = 0.5 + 0.5 * np.sin(2 * np.pi * (year - 1958) / 11.0)

        # Atmospheric density at perigee (drag is strongest here)
        rho = atmo_density(h_peri, solar_cycle)

        # Drag-induced semi-major axis decay rate
        # da/dt = -rho * A * CD * a * v_peri / m  (approximate)
        v_peri = np.sqrt(MU_EARTH * (2.0 / (a * (1 - e)) - 1.0 / a))  # km/s
        v_peri_ms = v_peri * 1000  # m/s

        # Semi-major axis decay per time step
        da_per_orbit = -np.pi * rho * (CD * AREA / MASS) * a * 1000 * (1 + e)  # meters per orbit
        orbits_per_step = dt_days * 24 * 60 / period[i]
        da_total = da_per_orbit * orbits_per_step / 1000  # km

        a += da_total

        # Eccentricity evolution (drag circularizes the orbit)
        de_per_orbit = -2 * np.pi * rho * (CD * AREA / MASS) * a * 1000 * (1 - e ** 2) / (1 + e)
        de_total = de_per_orbit * orbits_per_step / 1000
        e = max(0.001, e + de_total * 0.1)  # damped eccentricity evolution

    return t_years, perigee, apogee, period

# ============================================================
# Comparison Satellites
# ============================================================

SATELLITES = {
    'Sputnik 1': {'launch': 1957.75, 'reentry': 1958.0, 'perigee': 215, 'apogee': 939,
                  'mass': 83.6, 'note': 'First artificial satellite'},
    'Sputnik 2': {'launch': 1957.83, 'reentry': 1958.3, 'perigee': 212, 'apogee': 1660,
                  'mass': 508.3, 'note': 'Carried Laika'},
    'Explorer 1': {'launch': 1958.08, 'reentry': 1970.2, 'perigee': 358, 'apogee': 2550,
                   'mass': 13.97, 'note': 'Van Allen belts'},
    'Vanguard 1': {'launch': 1958.21, 'reentry': 2258, 'perigee': 654, 'apogee': 3969,
                   'mass': 1.47, 'note': 'First solar power'},
    'Explorer 3': {'launch': 1958.21, 'reentry': 1958.5, 'perigee': 186, 'apogee': 2799,
                   'mass': 14.1, 'note': 'Confirmed Van Allen'},
}

# ============================================================
# Plotting
# ============================================================

def plot_all():
    fig = plt.figure(figsize=(14, 12))
    fig.patch.set_facecolor('#0a0a14')
    gs = GridSpec(3, 2, figure=fig, hspace=0.35, wspace=0.3)

    # Colors
    gold = '#D4A830'
    amber = '#E8A020'
    green = '#5A8A5A'
    blue = '#4488CC'
    red = '#CC4444'

    # ---- Plot 1: Perigee and Apogee evolution ----
    ax1 = fig.add_subplot(gs[0, :])
    ax1.set_facecolor('#0a0a14')

    t, peri, apo, per = orbital_decay(years=350, dt_days=30)
    years = 1958 + t

    ax1.plot(years, peri, color=gold, linewidth=1.5, label='Perigee altitude')
    ax1.plot(years, apo, color=blue, linewidth=1.0, alpha=0.7, label='Apogee altitude')

    # Mark key dates
    ax1.axvline(x=1958.21, color='#444444', linestyle=':', alpha=0.5)
    ax1.annotate('Launch\n1958', (1958, peri[0]), textcoords='offset points',
                 xytext=(10, -20), color=amber, fontsize=8)

    ax1.axvline(x=1964.4, color=green, linestyle=':', alpha=0.3)
    ax1.annotate('Transmitter\ndied 1964', (1964.4, peri[30]),
                 textcoords='offset points', xytext=(10, 20), color=green, fontsize=8)

    ax1.axvline(x=2026, color=red, linestyle=':', alpha=0.3)
    ax1.annotate('NOW\n2026', (2026, peri[int(68*12.2)]),
                 textcoords='offset points', xytext=(10, -20), color=red, fontsize=8)

    # Re-entry zone
    ax1.axhspan(0, 150, alpha=0.05, color=red)
    ax1.text(2200, 50, 'Re-entry zone (<150 km)', color=red, fontsize=8, alpha=0.5)

    ax1.set_xlabel('Year', color='#888888')
    ax1.set_ylabel('Altitude (km)', color='#888888')
    ax1.set_title('Vanguard 1 Orbital Evolution: 1958-2300', color=gold, fontsize=12)
    ax1.legend(facecolor='#0a0a14', edgecolor='#333333', labelcolor='#aaaaaa')
    ax1.tick_params(colors='#666666')
    ax1.spines['bottom'].set_color('#333333')
    ax1.spines['left'].set_color('#333333')
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.set_xlim(1955, 2310)
    ax1.set_ylim(0, max(apo) * 1.05)

    # ---- Plot 2: Atmospheric density profile ----
    ax2 = fig.add_subplot(gs[1, 0])
    ax2.set_facecolor('#0a0a14')

    h = np.linspace(150, 1200, 500)
    rho_min = [atmo_density(hi, 0.0) for hi in h]
    rho_max = [atmo_density(hi, 1.0) for hi in h]

    ax2.semilogy(h, rho_min, color=blue, linewidth=1.5, label='Solar minimum')
    ax2.semilogy(h, rho_max, color=red, linewidth=1.5, label='Solar maximum')
    ax2.fill_between(h, rho_min, rho_max, alpha=0.1, color=gold)

    # Mark Vanguard 1 perigee
    ax2.axvline(x=654, color=gold, linestyle='--', alpha=0.5)
    ax2.annotate('Vanguard 1\nperigee', (654, 1e-13),
                 textcoords='offset points', xytext=(10, 10),
                 color=gold, fontsize=9)

    # Mark Explorer 1 perigee
    ax2.axvline(x=358, color=green, linestyle='--', alpha=0.5)
    ax2.annotate('Explorer 1\nperigee', (358, 1e-11),
                 textcoords='offset points', xytext=(10, 10),
                 color=green, fontsize=9)

    ax2.set_xlabel('Altitude (km)', color='#888888')
    ax2.set_ylabel('Density (kg/m^3)', color='#888888')
    ax2.set_title('Atmospheric Density vs Altitude', color=gold, fontsize=11)
    ax2.legend(facecolor='#0a0a14', edgecolor='#333333', labelcolor='#aaaaaa')
    ax2.tick_params(colors='#666666')
    ax2.spines['bottom'].set_color('#333333')
    ax2.spines['left'].set_color('#333333')
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)

    # ---- Plot 3: Satellite lifetime comparison ----
    ax3 = fig.add_subplot(gs[1, 1])
    ax3.set_facecolor('#0a0a14')

    names = list(SATELLITES.keys())
    lifetimes = []
    perigees = []
    for name, data in SATELLITES.items():
        lifetime = data['reentry'] - data['launch']
        lifetimes.append(min(lifetime, 350))
        perigees.append(data['perigee'])

    colors_bar = [gold if n == 'Vanguard 1' else blue for n in names]
    bars = ax3.barh(names, lifetimes, color=colors_bar, alpha=0.8, edgecolor='#333333')

    # Add perigee annotation
    for i, (name, lifetime, peri_h) in enumerate(zip(names, lifetimes, perigees)):
        if lifetime > 100:
            ax3.text(lifetime - 20, i, f'~{lifetime:.0f} yr\n({peri_h} km)',
                     color='#0a0a14', fontsize=8, va='center', ha='right', fontweight='bold')
        else:
            ax3.text(lifetime + 2, i, f'{lifetime:.1f} yr ({peri_h} km)',
                     color='#888888', fontsize=8, va='center')

    ax3.set_xlabel('Orbital Lifetime (years)', color='#888888')
    ax3.set_title('Early Satellite Lifetimes', color=gold, fontsize=11)
    ax3.tick_params(colors='#666666')
    ax3.spines['bottom'].set_color('#333333')
    ax3.spines['left'].set_color('#333333')
    ax3.spines['top'].set_visible(False)
    ax3.spines['right'].set_visible(False)

    # ---- Plot 4: Why perigee altitude matters (exponential effect) ----
    ax4 = fig.add_subplot(gs[2, 0])
    ax4.set_facecolor('#0a0a14')

    perigees_range = np.linspace(200, 800, 100)
    lifetimes_est = []
    for peri_h in perigees_range:
        # Rough estimate: lifetime ~ exp(perigee_alt / scale_height) / (rho * area/mass)
        rho = atmo_density(peri_h, 0.5)
        if rho > 0:
            # Very rough: lifetime in years ~ k / rho
            lifetime_est = BETA / (rho * 1e6) / (365.25 * 24 * 3600)
            lifetime_est = min(lifetime_est, 1000)
        else:
            lifetime_est = 1000
        lifetimes_est.append(lifetime_est)

    ax4.semilogy(perigees_range, lifetimes_est, color=gold, linewidth=2)
    ax4.axvline(x=654, color=gold, linestyle='--', alpha=0.5)
    ax4.axvline(x=358, color=green, linestyle='--', alpha=0.5)
    ax4.axvline(x=215, color=red, linestyle='--', alpha=0.5)

    ax4.annotate('Vanguard 1', (654, 200), color=gold, fontsize=9)
    ax4.annotate('Explorer 1', (358, 15), color=green, fontsize=9)
    ax4.annotate('Sputnik 1', (215, 0.3), color=red, fontsize=9)

    ax4.set_xlabel('Perigee Altitude (km)', color='#888888')
    ax4.set_ylabel('Estimated Lifetime (years)', color='#888888')
    ax4.set_title('Orbital Lifetime vs Perigee Altitude', color=gold, fontsize=11)
    ax4.tick_params(colors='#666666')
    ax4.spines['bottom'].set_color('#333333')
    ax4.spines['left'].set_color('#333333')
    ax4.spines['top'].set_visible(False)
    ax4.spines['right'].set_visible(False)

    # ---- Plot 5: Solar cycle effect ----
    ax5 = fig.add_subplot(gs[2, 1])
    ax5.set_facecolor('#0a0a14')

    cycle_years = np.linspace(1958, 2030, 500)
    solar_activity = [0.5 + 0.5 * np.sin(2 * np.pi * (y - 1958) / 11.0) for y in cycle_years]
    density_at_perigee = [atmo_density(654, sa) * 1e15 for sa in solar_activity]

    ax5.plot(cycle_years, solar_activity, color=amber, linewidth=1.5,
             label='Solar activity', alpha=0.8)
    ax5.set_ylabel('Solar Activity (normalized)', color=amber)
    ax5.tick_params(axis='y', colors=amber)

    ax5_twin = ax5.twinx()
    ax5_twin.plot(cycle_years, density_at_perigee, color=blue, linewidth=1.0,
                  alpha=0.7, label='Density at 654 km')
    ax5_twin.set_ylabel('Density at 654 km (x10^-15 kg/m^3)', color=blue)
    ax5_twin.tick_params(axis='y', colors=blue)
    ax5_twin.spines['right'].set_color(blue)

    ax5.set_xlabel('Year', color='#888888')
    ax5.set_title('Solar Cycle Effect on Drag', color=gold, fontsize=11)
    ax5.tick_params(axis='x', colors='#666666')
    ax5.spines['bottom'].set_color('#333333')
    ax5.spines['left'].set_color(amber)
    ax5.spines['top'].set_visible(False)

    plt.suptitle('Vanguard 1 Orbital Lifetime: The Oldest Satellite Still in Orbit\n'
                 'Mission 1.8 | 654 x 3,969 km | 1.47 kg | Estimated lifetime: 240+ years',
                 color=amber, fontsize=13, y=0.98)

    if '--save' in sys.argv:
        plt.savefig('orbital-lifetime.png', dpi=150, bbox_inches='tight',
                    facecolor='#0a0a14')
        print('Saved: orbital-lifetime.png')
    else:
        plt.show()

if __name__ == '__main__':
    print('Vanguard 1 Orbital Lifetime Analysis')
    print('=' * 50)
    print(f'Launch:              March 17, 1958')
    print(f'Mass:                {MASS} kg')
    print(f'Diameter:            {DIAMETER*100:.1f} cm')
    print(f'Cross-section:       {AREA*1e4:.1f} cm^2')
    print(f'Ballistic coeff:     {BETA:.1f} kg/m^2')
    print(f'Initial perigee:     {PERIGEE_INIT:.0f} km')
    print(f'Initial apogee:      {APOGEE_INIT:.0f} km')
    print(f'Initial period:      {PERIOD_INIT:.1f} min')
    print(f'Inclination:         {INCLINATION:.2f} deg')
    print()
    print('Atmospheric density comparison:')
    print(f'  At 358 km (Explorer 1):  {atmo_density(358):.2e} kg/m^3')
    print(f'  At 654 km (Vanguard 1):  {atmo_density(654):.2e} kg/m^3')
    print(f'  Ratio:                   {atmo_density(358)/atmo_density(654):.0f}x')
    print()
    print(f'Explorer 1 experienced {atmo_density(358)/atmo_density(654):.0f}x more drag.')
    print(f'Explorer 1 re-entered in 1970 (12 years).')
    print(f'Vanguard 1 will orbit until ~2258 (~300 years).')
    print(f'A 300 km difference in perigee means 25x longer life.')
    print()
    print('The grapefruit is the most enduring thing we have ever launched.')
    print()

    plot_all()
