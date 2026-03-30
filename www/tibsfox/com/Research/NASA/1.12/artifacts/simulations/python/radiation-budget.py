#!/usr/bin/env python3
"""
Explorer 7 — Earth's Radiation Budget
=========================================================================
Mission 1.12: Explorer 7 (Goddard SFC / Juno II), October 13, 1959
FIRST EARTH RADIATION BUDGET MEASUREMENT FROM SPACE

Computes Earth's radiation budget using the fundamental energy balance
equation. The Sun delivers S₀ = 1361 W/m² to Earth's cross section.
Earth reflects a fraction (albedo α ≈ 0.30) and absorbs the rest.
To maintain thermal equilibrium, Earth must radiate σT⁴ back to space.

Explorer 7 carried Suomi-Parent bolometers — black and white hemispheric
sensors that separated reflected solar from emitted thermal radiation.
This was the first measurement of the planetary energy balance from orbit.

This produces:
  1. Energy balance vs albedo — absorbed solar vs emitted thermal
  2. Equilibrium temperature vs albedo — snowball to hothouse
  3. Greenhouse effect — how trapping shifts the equilibrium
  4. CO₂ sensitivity — temperature change per CO₂ doubling
  5. Explorer 7 measurement context — what Suomi's bolometers saw

Requires: numpy, matplotlib
Run: python3 radiation-budget.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# =========================================================================
# Physical Constants
# =========================================================================
S0 = 1361.0           # Solar constant (W/m²) — TSI at 1 AU
SIGMA = 5.670374e-8   # Stefan-Boltzmann constant (W/m²/K⁴)
R_EARTH = 6.371e6     # Earth radius (m)

# Earth parameters
ALBEDO_EARTH = 0.30   # Earth's current mean albedo
T_SURFACE = 288.0     # Earth's actual mean surface temperature (K)
T_EFFECTIVE = 255.0   # Earth's effective radiating temperature (K)

# =========================================================================
# Figure 1: Energy Balance vs Albedo
# =========================================================================
fig = plt.figure(figsize=(16, 14))
fig.suptitle("Explorer 7 — Earth's Radiation Budget\n"
             "First satellite measurement of planetary energy balance (October 13, 1959)",
             fontsize=14, fontweight='bold', color='#E8D060')
fig.patch.set_facecolor('#0a0a15')

gs = gridspec.GridSpec(3, 2, hspace=0.35, wspace=0.30)

# --- Plot 1: Energy flows vs albedo ---
ax1 = fig.add_subplot(gs[0, 0])
ax1.set_facecolor('#0d0d20')

albedo = np.linspace(0.0, 0.8, 200)

# Absorbed solar = S0 * (1 - alpha) / 4
absorbed_solar = S0 * (1.0 - albedo) / 4.0

# Emitted thermal at various effective temperatures
T_range = [220, 240, 255, 270, 288]
for T in T_range:
    emitted = SIGMA * T**4 * np.ones_like(albedo)
    label = f"Emitted at T={T}K ({T-273:.0f}°C)"
    ax1.plot(albedo, emitted, '--', linewidth=0.8, alpha=0.5, label=label)

ax1.plot(albedo, absorbed_solar, color='#E8D060', linewidth=2.5,
         label=f'Absorbed solar: S₀(1-α)/4')

# Mark Earth
earth_absorbed = S0 * (1 - ALBEDO_EARTH) / 4
ax1.axvline(ALBEDO_EARTH, color='#2040AA', linewidth=1, linestyle=':', alpha=0.7)
ax1.axhline(earth_absorbed, color='#CC4020', linewidth=1, linestyle=':', alpha=0.7)
ax1.plot(ALBEDO_EARTH, earth_absorbed, 'o', color='#2040AA', markersize=10,
         label=f'Earth (α={ALBEDO_EARTH}): {earth_absorbed:.0f} W/m²')

ax1.set_xlabel('Albedo (α)', color='#aaa', fontsize=10)
ax1.set_ylabel('Energy flux (W/m²)', color='#aaa', fontsize=10)
ax1.set_title('Absorbed Solar vs Emitted Thermal', color='#ddd', fontsize=11)
ax1.legend(fontsize=7, facecolor='#151530', edgecolor='#333',
           labelcolor='#ccc', loc='upper right')
ax1.tick_params(colors='#888')
ax1.set_xlim(0, 0.8)
ax1.set_ylim(0, 400)
for spine in ax1.spines.values():
    spine.set_color('#333')

# --- Plot 2: Equilibrium temperature vs albedo ---
ax2 = fig.add_subplot(gs[0, 1])
ax2.set_facecolor('#0d0d20')

# T_eq = ((S0 * (1 - alpha)) / (4 * epsilon * sigma))^0.25
epsilon_values = [1.0, 0.9, 0.8, 0.7, 0.612]  # effective emissivity
colors_eps = ['#CC4020', '#CC6040', '#CC8060', '#CCA080', '#E8D060']

for eps, color in zip(epsilon_values, colors_eps):
    T_eq = ((S0 * (1 - albedo)) / (4 * eps * SIGMA))**0.25
    label = f'ε = {eps:.3f}'
    if abs(eps - 0.612) < 0.01:
        label += ' (Earth actual)'
    ax2.plot(albedo, T_eq, color=color, linewidth=1.5, label=label)

# Mark Earth
T_eq_no_greenhouse = ((S0 * (1 - ALBEDO_EARTH)) / (4 * SIGMA))**0.25
ax2.axvline(ALBEDO_EARTH, color='#2040AA', linewidth=1, linestyle=':', alpha=0.7)
ax2.axhline(T_SURFACE, color='#CC4020', linewidth=1, linestyle=':', alpha=0.5,
            label=f'Actual surface: {T_SURFACE}K')
ax2.axhline(T_eq_no_greenhouse, color='#2040AA', linewidth=1, linestyle=':', alpha=0.5,
            label=f'No greenhouse: {T_eq_no_greenhouse:.0f}K')

# Temperature reference lines
ax2.axhline(273.15, color='#4080CC', linewidth=0.5, linestyle='--', alpha=0.3)
ax2.text(0.01, 274, '0°C (freezing)', fontsize=7, color='#4080CC', alpha=0.5)
ax2.axhline(373.15, color='#CC4020', linewidth=0.5, linestyle='--', alpha=0.3)
ax2.text(0.01, 374, '100°C (boiling)', fontsize=7, color='#CC4020', alpha=0.5)

ax2.set_xlabel('Albedo (α)', color='#aaa', fontsize=10)
ax2.set_ylabel('Equilibrium temperature (K)', color='#ddd', fontsize=10)
ax2.set_title('Equilibrium Temperature vs Albedo', color='#ddd', fontsize=11)
ax2.legend(fontsize=7, facecolor='#151530', edgecolor='#333',
           labelcolor='#ccc', loc='upper right')
ax2.tick_params(colors='#888')
ax2.set_xlim(0, 0.8)
ax2.set_ylim(150, 400)
for spine in ax2.spines.values():
    spine.set_color('#333')

# --- Plot 3: Greenhouse Effect Visualization ---
ax3 = fig.add_subplot(gs[1, 0])
ax3.set_facecolor('#0d0d20')

# Show how greenhouse gases shift the energy balance
greenhouse_strength = np.linspace(0, 0.5, 200)
# Effective emissivity: 1.0 (no greenhouse) to 0.5 (strong greenhouse)
eff_emissivity = 1.0 - greenhouse_strength

# At Earth's albedo, equilibrium temperature as function of greenhouse
T_greenhouse = ((S0 * (1 - ALBEDO_EARTH)) / (4 * eff_emissivity * SIGMA))**0.25
T_greenhouse_celsius = T_greenhouse - 273.15

ax3.fill_between(greenhouse_strength * 100, T_greenhouse_celsius,
                 T_eq_no_greenhouse - 273.15,
                 alpha=0.2, color='#CC4020',
                 label='Greenhouse warming')
ax3.plot(greenhouse_strength * 100, T_greenhouse_celsius,
         color='#CC4020', linewidth=2.5)

# Mark current conditions
current_greenhouse = 1.0 - 0.612  # ~0.388
ax3.axvline(current_greenhouse * 100, color='#E8D060', linewidth=1.5,
            linestyle='--', label=f'Current ({current_greenhouse*100:.0f}%)')
ax3.plot(current_greenhouse * 100,
         T_SURFACE - 273.15, 'o', color='#E8D060', markersize=10)

# Mark pre-industrial
pre_industrial_T = 287.0  # ~14°C
ax3.axhline(pre_industrial_T - 273.15, color='#8AAA70', linewidth=1,
            linestyle=':', alpha=0.7, label=f'Pre-industrial: ~14°C')

ax3.set_xlabel('Greenhouse strength (%)', color='#aaa', fontsize=10)
ax3.set_ylabel('Surface temperature (°C)', color='#ddd', fontsize=10)
ax3.set_title('Greenhouse Effect on Equilibrium Temperature', color='#ddd', fontsize=11)
ax3.legend(fontsize=8, facecolor='#151530', edgecolor='#333', labelcolor='#ccc')
ax3.tick_params(colors='#888')
ax3.set_xlim(0, 50)
for spine in ax3.spines.values():
    spine.set_color('#333')

# --- Plot 4: CO₂ Sensitivity ---
ax4 = fig.add_subplot(gs[1, 1])
ax4.set_facecolor('#0d0d20')

# Climate sensitivity: how much warming per CO2 doubling
# Simple model: ΔT ≈ λ × ΔF, where ΔF ≈ 5.35 × ln(CO2/CO2_ref)
CO2_range = np.linspace(200, 1000, 200)
CO2_ref = 280.0  # pre-industrial
T_ref = 287.0    # pre-industrial temperature

# Various climate sensitivities (K per doubling)
sensitivities = [1.5, 2.0, 3.0, 4.5]
sens_colors = ['#8AAA70', '#E8D060', '#CC8040', '#CC4020']

for sens, color in zip(sensitivities, sens_colors):
    # λ = sensitivity / (5.35 * ln(2))
    lam = sens / (5.35 * np.log(2))
    delta_F = 5.35 * np.log(CO2_range / CO2_ref)
    delta_T = lam * delta_F
    T_result = T_ref + delta_T - 273.15
    ax4.plot(CO2_range, T_result, color=color, linewidth=1.5,
             label=f'ECS = {sens}°C/doubling')

# Mark key CO2 levels
ax4.axvline(280, color='#8AAA70', linewidth=1, linestyle=':', alpha=0.7)
ax4.text(283, -20, '1750\n280 ppm', fontsize=7, color='#8AAA70', alpha=0.7)
ax4.axvline(420, color='#E8D060', linewidth=1, linestyle=':', alpha=0.7)
ax4.text(423, -20, '2024\n420 ppm', fontsize=7, color='#E8D060', alpha=0.7)
ax4.axvline(560, color='#CC8040', linewidth=1, linestyle=':', alpha=0.7)
ax4.text(563, -20, '2×CO₂\n560 ppm', fontsize=7, color='#CC8040', alpha=0.7)

# Explorer 7 era
ax4.axvline(315, color='#2040AA', linewidth=1, linestyle='--', alpha=0.7)
ax4.text(318, -19, '1959\n315 ppm', fontsize=7, color='#2040AA', alpha=0.7)

ax4.set_xlabel('CO₂ concentration (ppm)', color='#aaa', fontsize=10)
ax4.set_ylabel('Surface temperature (°C)', color='#ddd', fontsize=10)
ax4.set_title('Climate Sensitivity to CO₂', color='#ddd', fontsize=11)
ax4.legend(fontsize=8, facecolor='#151530', edgecolor='#333', labelcolor='#ccc')
ax4.tick_params(colors='#888')
ax4.set_xlim(200, 1000)
for spine in ax4.spines.values():
    spine.set_color('#333')

# --- Plot 5: Explorer 7 Measurement Context ---
ax5 = fig.add_subplot(gs[2, :])
ax5.set_facecolor('#0d0d20')

# Show what Explorer 7's bolometers measured over one orbit
# Orbit period ~108 minutes
orbit_time = np.linspace(0, 108, 500)  # minutes

# Solar illumination: depends on sun angle (day/night cycle)
# Explorer 7 orbit: 573 × 1073 km, ~101 min period
# Day fraction depends on beta angle
sun_angle = 2 * np.pi * orbit_time / 108.0
illuminated = np.maximum(np.cos(sun_angle), 0)  # 0 on night side, max on day side

# Black bolometer: absorbs all — solar + Earth reflected + Earth thermal
# Solar input to black bolo (when sunlit)
solar_to_black = 1361 * illuminated * 0.25  # view factor, spacecraft orientation
# Earth reflected (always present, higher on day side)
earth_reflected = 100 * (0.3 + 0.5 * illuminated)  # W/m²
# Earth thermal (always present, nearly constant)
earth_thermal = 240 * (0.9 + 0.1 * np.sin(sun_angle * 0.3))  # ~240 W/m²

black_total = solar_to_black + earth_reflected + earth_thermal

# White bolometer: reflects visible, absorbs only thermal
# White reflects ~90% of visible solar
white_solar = solar_to_black * 0.10  # only 10% absorbed
white_total = white_solar + earth_thermal

ax5.fill_between(orbit_time, 0, black_total, alpha=0.15, color='#CC4020',
                 label='Black bolometer (total)')
ax5.plot(orbit_time, black_total, color='#CC4020', linewidth=1.5)

ax5.fill_between(orbit_time, 0, white_total, alpha=0.15, color='#E8D060',
                 label='White bolometer (thermal only)')
ax5.plot(orbit_time, white_total, color='#E8D060', linewidth=1.5)

# Difference = solar + reflected component
difference = black_total - white_total
ax5.plot(orbit_time, difference, color='#2040AA', linewidth=1.5, linestyle='--',
         label='Difference (solar + reflected)')

# Day/night shading
for i in range(len(orbit_time) - 1):
    if illuminated[i] < 0.01:
        ax5.axvspan(orbit_time[i], orbit_time[i+1], alpha=0.05, color='#000')

# Eclipse markers
ax5.axvspan(54 - 2, 54 + 2, alpha=0.15, color='#333',
            label='Shadow (eclipse)')
ax5.text(54, max(black_total) * 0.9, 'SHADOW', fontsize=8, color='#666',
         ha='center', fontweight='bold')

ax5.set_xlabel('Orbit time (minutes)', color='#aaa', fontsize=10)
ax5.set_ylabel('Radiation flux (W/m²)', color='#ddd', fontsize=10)
ax5.set_title("Explorer 7 Bolometer Readings — One Orbit (573 × 1073 km, 101 min period)\n"
              "Suomi-Parent bolometers: the first space-based radiation budget measurement",
              color='#ddd', fontsize=11)
ax5.legend(fontsize=8, facecolor='#151530', edgecolor='#333', labelcolor='#ccc',
           loc='upper right')
ax5.tick_params(colors='#888')
ax5.set_xlim(0, 108)
ax5.set_ylim(0, max(black_total) * 1.15)
for spine in ax5.spines.values():
    spine.set_color('#333')

plt.savefig('radiation-budget.png', dpi=150, bbox_inches='tight',
            facecolor='#0a0a15', edgecolor='none')
print("Saved: radiation-budget.png")

# =========================================================================
# Summary Statistics
# =========================================================================
print("\n" + "=" * 60)
print("EARTH RADIATION BUDGET SUMMARY")
print("=" * 60)
print(f"Solar constant (S₀):          {S0:.0f} W/m²")
print(f"Earth's albedo (α):            {ALBEDO_EARTH:.2f}")
print(f"Absorbed solar:                {earth_absorbed:.0f} W/m²")
print(f"Effective temperature (no GH): {T_eq_no_greenhouse:.1f} K ({T_eq_no_greenhouse-273.15:.1f}°C)")
print(f"Actual surface temperature:    {T_SURFACE:.0f} K ({T_SURFACE-273.15:.0f}°C)")
print(f"Greenhouse warming:            {T_SURFACE - T_eq_no_greenhouse:.1f} K")
print(f"Effective emissivity:          {(earth_absorbed / (SIGMA * T_SURFACE**4)):.3f}")
print(f"")
print(f"Explorer 7 orbit: 573 × 1073 km, 101.2 min period")
print(f"Spacecraft mass: 41.5 kg")
print(f"Bolometer: Suomi-Parent black/white hemispheres")
print(f"Operation: October 13, 1959 — ~2 years")
print("=" * 60)

plt.show()
