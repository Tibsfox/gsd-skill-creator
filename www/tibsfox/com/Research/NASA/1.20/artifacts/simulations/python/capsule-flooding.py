#!/usr/bin/env python3
"""
Liberty Bell 7 Capsule Flooding Model
======================================
NASA Mission Series v1.20

Models the water ingress through Liberty Bell 7's blown hatch opening
using fluid dynamics and buoyancy calculations.

When the hatch blew at splashdown, seawater rushed through the opening.
The capsule weighed approximately 2,400 lbs (1,089 kg) dry. As water
flooded in, the effective weight increased until the recovery helicopter
(Sikorsky HSS-1 / UH-34D) could no longer support the load. Marine
helicopter pilot Jim Lewis held on as long as possible — the engine
chip warning light came on — and had to release the cable.

The hatch opening was approximately 19 inches (48.3 cm) in diameter.
We model the flow rate using the Bernoulli equation for flow through
an orifice, with corrections for the submerged condition.

Physics:
  Flow rate Q = Cd × A × sqrt(2 × g × h)
  Where:
    Cd = discharge coefficient (~0.6 for sharp-edged orifice)
    A = hatch area = pi × (0.2415)^2 = 0.1833 m^2
    g = 9.81 m/s^2
    h = head of water above hatch center (changes as capsule sinks)

Plots:
  1. Water volume inside capsule vs time
  2. Total capsule weight (dry + water) vs time, with helicopter max lift line
  3. Buoyancy margin (lift force - weight) vs time, showing when recovery fails

Usage: python3 capsule-flooding.py
Dependencies: numpy, matplotlib
Output: capsule_flooding.png (3 subplots)
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# PHYSICAL CONSTANTS AND CAPSULE PARAMETERS
# ============================================================

G = 9.80665              # m/s^2
RHO_SEA = 1025.0         # kg/m^3 seawater density

# Mercury capsule (Liberty Bell 7 - MR-4)
CAPSULE_DRY_MASS = 1089.0    # kg (2,400 lbs)
CAPSULE_VOLUME = 1.56        # m^3 (approximate internal volume)
CAPSULE_DISP_VOLUME = 1.03   # m^3 (displacement volume when floating)

# Hatch opening
HATCH_DIAMETER = 0.483       # m (19 inches)
HATCH_AREA = np.pi * (HATCH_DIAMETER / 2) ** 2  # 0.1833 m^2
HATCH_Cd = 0.61             # Discharge coefficient (sharp-edged orifice)

# Hatch center height above waterline when capsule is floating level
HATCH_HEIGHT_ABOVE_WL = 0.15  # m (approximate — hatch is near top of capsule)

# Recovery helicopter (Sikorsky UH-34D / HSS-1)
HELI_MAX_LIFT = 1814.0      # kg (4,000 lbs) — hover ceiling with cable load
HELI_CABLE_LIMIT = 2268.0   # kg (5,000 lbs) — cable breaking strength
HELI_WARNING_LOAD = 1680.0  # kg — engine chip light threshold

# Capsule buoyancy when floating (before flooding)
# Displacement = capsule volume below waterline
CAPSULE_BUOYANCY_DRY = CAPSULE_DISP_VOLUME * RHO_SEA  # ~1056 kg of displaced water

# ============================================================
# SIMULATION
# ============================================================

dt = 0.1       # Time step (seconds)
t_max = 300.0  # 5 minutes — more than enough to see the outcome

# Time array
t_array = np.arange(0, t_max, dt)
n_steps = len(t_array)

# State arrays
water_volume = np.zeros(n_steps)     # m^3 of water inside capsule
water_mass = np.zeros(n_steps)       # kg of water inside
total_mass = np.zeros(n_steps)       # kg (dry + water)
buoyancy_force = np.zeros(n_steps)   # kg equivalent
net_force = np.zeros(n_steps)        # kg (buoyancy - weight), >0 = floating
heli_load = np.zeros(n_steps)        # kg being lifted by helicopter
flow_rate = np.zeros(n_steps)        # m^3/s
freeboard = np.zeros(n_steps)        # m (how high hatch is above water)

# Initial conditions
water_volume[0] = 0.0
capsule_sunk = False
capsule_sunk_time = None
heli_attached = True
heli_detach_time = None

for i in range(1, n_steps):
    t = t_array[i]

    # Current water inside
    w_vol = water_volume[i-1]
    w_mass = w_vol * RHO_SEA

    # Total mass
    tot_mass = CAPSULE_DRY_MASS + w_mass

    # --- Buoyancy ---
    # Capsule displacement depends on how much it has sunk.
    # As water enters, the capsule rides lower, eventually submerging.
    # Simplification: displacement volume increases linearly with sinking
    # until fully submerged, then stays constant.

    # Waterline rises as capsule gets heavier
    # Fraction submerged = total_mass / (RHO_SEA * max_displacement_volume)
    max_disp = 1.8  # m^3 — total capsule exterior volume including heat shield
    frac_submerged = min(1.0, tot_mass / (RHO_SEA * max_disp))
    current_disp = max_disp * frac_submerged

    buoy_kg = current_disp * RHO_SEA  # Buoyancy in kg-equivalent

    # --- Freeboard (height of hatch above waterline) ---
    # As capsule rides lower, freeboard decreases, then goes negative (submerged)
    fb = HATCH_HEIGHT_ABOVE_WL * (1.0 - frac_submerged * 1.8)
    freeboard[i] = fb

    # --- Flow rate through hatch ---
    if fb > 0:
        # Hatch above waterline — water enters from waves/splashing
        # Reduced flow — not fully submerged
        head = 0.05  # Small head from wave action
        Q = HATCH_Cd * HATCH_AREA * np.sqrt(2 * G * head) * 0.3  # Reduced
    elif w_vol < CAPSULE_VOLUME:
        # Hatch submerged — full Bernoulli flow
        head = abs(fb) + 0.3  # Head = submersion depth + some margin
        Q = HATCH_Cd * HATCH_AREA * np.sqrt(2 * G * head)
        # Reduce flow as capsule fills (less air volume to displace)
        fill_fraction = w_vol / CAPSULE_VOLUME
        Q *= max(0.05, 1.0 - fill_fraction * 0.8)
    else:
        Q = 0.0  # Capsule full

    flow_rate[i] = Q

    # --- Update water volume ---
    new_vol = min(CAPSULE_VOLUME, w_vol + Q * dt)
    water_volume[i] = new_vol
    water_mass[i] = new_vol * RHO_SEA
    total_mass[i] = CAPSULE_DRY_MASS + water_mass[i]

    buoyancy_force[i] = buoy_kg
    net_force[i] = buoy_kg - total_mass[i]  # Positive = floating

    # --- Helicopter load ---
    # Helicopter tries to lift capsule. Load = total_mass - buoyancy
    # Only when attached and capsule is heavy enough to need lift
    if heli_attached:
        load = max(0, total_mass[i] - buoyancy_force[i])
        heli_load[i] = load

        # Engine chip warning
        if load > HELI_WARNING_LOAD and heli_detach_time is None:
            # Pilot gets warning but holds on for a bit longer
            pass

        # Forced to release — exceeds safe hover load
        if load > HELI_MAX_LIFT:
            heli_attached = False
            heli_detach_time = t
    else:
        heli_load[i] = 0.0

    # --- Capsule sinks ---
    if net_force[i] < -100 and not capsule_sunk and not heli_attached:
        capsule_sunk = True
        capsule_sunk_time = t


# ============================================================
# PLOTTING
# ============================================================

fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(14, 12), sharex=True)
fig.patch.set_facecolor('#0c1020')

COL_WATER = '#2080CC'
COL_MASS  = '#CC6830'
COL_BUOY  = '#30AA50'
COL_HELI  = '#CCAA30'
COL_BG    = '#0a0e1a'
COL_TXT   = '#889098'
COL_GRID  = '#1a2040'
COL_DANGER = '#FF4040'

# Limit to useful time range (first 120 seconds shows the drama)
t_plot_max = 120
mask = t_array < t_plot_max

# --- SUBPLOT 1: Water Volume ---
ax1.set_facecolor(COL_BG)
ax1.plot(t_array[mask], water_volume[mask], color=COL_WATER, linewidth=2.0,
         label='Water inside capsule')
ax1.axhline(y=CAPSULE_VOLUME, color='#556677', linewidth=0.8, linestyle=':')
ax1.text(5, CAPSULE_VOLUME + 0.03, f'Capsule capacity ({CAPSULE_VOLUME} m\u00B3)',
         color='#556677', fontsize=8)

if capsule_sunk_time and capsule_sunk_time < t_plot_max:
    ax1.axvline(x=capsule_sunk_time, color=COL_DANGER, linewidth=0.8, linestyle='--')
    ax1.text(capsule_sunk_time + 1, CAPSULE_VOLUME * 0.8, 'Capsule sinks',
             color=COL_DANGER, fontsize=8)

ax1.set_ylabel('Water Volume (m\u00B3)', color=COL_TXT, fontsize=11)
ax1.set_title('Liberty Bell 7 — Capsule Flooding After Hatch Blow\n'
              'Bernoulli flow through 19-inch (48.3 cm) hatch opening',
              color='#C0C0D0', fontsize=13, pad=10)
ax1.legend(loc='upper left', fontsize=8, facecolor=COL_BG,
           edgecolor=COL_GRID, labelcolor=COL_TXT)
ax1.set_ylim(0, CAPSULE_VOLUME * 1.15)
ax1.tick_params(colors='#556677')
ax1.grid(alpha=0.15, color='#334455')
for spine in ax1.spines.values():
    spine.set_color(COL_GRID)


# --- SUBPLOT 2: Mass / Helicopter Load ---
ax2.set_facecolor(COL_BG)
ax2.plot(t_array[mask], total_mass[mask], color=COL_MASS, linewidth=2.0,
         label='Total capsule mass (dry + water)')
ax2.plot(t_array[mask], heli_load[mask], color=COL_HELI, linewidth=2.0,
         label='Helicopter load (mass - buoyancy)')
ax2.plot(t_array[mask], buoyancy_force[mask], color=COL_BUOY, linewidth=1.5,
         linestyle='--', label='Buoyancy force (kg equiv.)')

# Helicopter limits
ax2.axhline(y=HELI_MAX_LIFT, color=COL_DANGER, linewidth=0.8, linestyle=':')
ax2.text(5, HELI_MAX_LIFT + 30, f'UH-34D max hover lift ({int(HELI_MAX_LIFT)} kg / '
         f'{int(HELI_MAX_LIFT * 2.205)} lbs)', color=COL_DANGER, fontsize=8)
ax2.axhline(y=HELI_WARNING_LOAD, color='#CCAA30', linewidth=0.8, linestyle=':')
ax2.text(5, HELI_WARNING_LOAD + 30, f'Engine chip warning ({int(HELI_WARNING_LOAD)} kg)',
         color='#CCAA30', fontsize=8)

if heli_detach_time and heli_detach_time < t_plot_max:
    ax2.axvline(x=heli_detach_time, color=COL_HELI, linewidth=0.8, linestyle='--')
    ax2.text(heli_detach_time + 1, HELI_MAX_LIFT * 0.6,
             f'Cable released (t={heli_detach_time:.0f}s)',
             color=COL_HELI, fontsize=8)

ax2.set_ylabel('Mass / Force (kg)', color=COL_TXT, fontsize=11)
ax2.legend(loc='upper left', fontsize=8, facecolor=COL_BG,
           edgecolor=COL_GRID, labelcolor=COL_TXT)
ax2.set_ylim(0, max(total_mass[mask]) * 1.15)
ax2.tick_params(colors='#556677')
ax2.grid(alpha=0.15, color='#334455')
for spine in ax2.spines.values():
    spine.set_color(COL_GRID)


# --- SUBPLOT 3: Buoyancy Margin ---
ax3.set_facecolor(COL_BG)
ax3.plot(t_array[mask], net_force[mask], color=COL_BUOY, linewidth=2.0,
         label='Buoyancy margin (buoyancy - total mass)')
ax3.axhline(y=0, color='#556677', linewidth=1.0, linestyle='-')
ax3.text(5, 20, 'Floating', color=COL_BUOY, fontsize=8)
ax3.text(5, -50, 'Sinking', color=COL_DANGER, fontsize=8)

# Shade sinking zone
ax3.axhspan(min(net_force[mask]) * 1.1, 0, alpha=0.06, color='#FF3030')
ax3.axhspan(0, max(net_force[mask]) * 1.1, alpha=0.04, color='#30AA50')

ax3.set_ylabel('Buoyancy Margin (kg)', color=COL_TXT, fontsize=11)
ax3.set_xlabel('Time After Hatch Blow (seconds)', color=COL_TXT, fontsize=11)
ax3.legend(loc='upper right', fontsize=8, facecolor=COL_BG,
           edgecolor=COL_GRID, labelcolor=COL_TXT)
ax3.tick_params(colors='#556677')
ax3.grid(alpha=0.15, color='#334455')
for spine in ax3.spines.values():
    spine.set_color(COL_GRID)


plt.tight_layout(pad=1.5)
plt.savefig('capsule_flooding.png', dpi=150, facecolor='#0c1020',
            bbox_inches='tight')
plt.close()


# ============================================================
# NUMERICAL SUMMARY
# ============================================================

print("=" * 70)
print("LIBERTY BELL 7 — CAPSULE FLOODING MODEL")
print("=" * 70)
print()
print(f"Capsule dry mass:         {CAPSULE_DRY_MASS:.0f} kg ({CAPSULE_DRY_MASS * 2.205:.0f} lbs)")
print(f"Capsule internal volume:  {CAPSULE_VOLUME:.2f} m\u00B3")
print(f"Hatch diameter:           {HATCH_DIAMETER*100:.1f} cm ({HATCH_DIAMETER*39.37:.1f} inches)")
print(f"Hatch area:               {HATCH_AREA:.4f} m\u00B2")
print()
print(f"UH-34D max hover lift:    {HELI_MAX_LIFT:.0f} kg ({HELI_MAX_LIFT * 2.205:.0f} lbs)")
print(f"Engine chip warning at:   {HELI_WARNING_LOAD:.0f} kg ({HELI_WARNING_LOAD * 2.205:.0f} lbs)")
print()

# Find key events
half_full_idx = np.argmax(water_volume > CAPSULE_VOLUME * 0.5)
full_idx = np.argmax(water_volume >= CAPSULE_VOLUME * 0.99)

print("--- Timeline ---")
print()
print(f"  t=0s:     Hatch blows. Water begins entering.")
if half_full_idx > 0:
    print(f"  t={t_array[half_full_idx]:.0f}s:    Capsule 50% flooded "
          f"({water_volume[half_full_idx]:.2f} m\u00B3)")
if heli_detach_time:
    print(f"  t={heli_detach_time:.0f}s:    Helicopter forced to release cable "
          f"(load exceeded {HELI_MAX_LIFT:.0f} kg)")
if capsule_sunk_time:
    print(f"  t={capsule_sunk_time:.0f}s:    Capsule sinks below surface")
if full_idx > 0:
    print(f"  t={t_array[full_idx]:.0f}s:    Capsule fully flooded")
print(f"  t=∞:      Liberty Bell 7 reaches 4,900 m depth")
print()
print("--- Key Insight ---")
print()
print("The math makes the outcome inevitable. A 48.3 cm opening admits")
print(f"water at approximately {flow_rate[10]:.3f} m\u00B3/s initially.")
print("The helicopter's maximum lift capacity is simply insufficient for")
print("a capsule rapidly filling with seawater (1,025 kg per cubic meter).")
print("Jim Lewis held on as long as the physics allowed.")
print()
print(f"Maximum water mass in capsule: {CAPSULE_VOLUME * RHO_SEA:.0f} kg "
      f"({CAPSULE_VOLUME * RHO_SEA * 2.205:.0f} lbs)")
print(f"Total mass when full: {CAPSULE_DRY_MASS + CAPSULE_VOLUME * RHO_SEA:.0f} kg "
      f"({(CAPSULE_DRY_MASS + CAPSULE_VOLUME * RHO_SEA) * 2.205:.0f} lbs)")
print()
print("Output: capsule_flooding.png")
