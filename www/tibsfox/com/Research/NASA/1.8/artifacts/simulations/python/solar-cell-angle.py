#!/usr/bin/env python3
"""
Solar Cell Power vs Angle — Vanguard 1
=======================================
Mission 1.8 — Vanguard 1, March 17, 1958

Models solar cell output as a function of incidence angle:
    P(theta) = P_max * cos(theta)

This is Lambert's cosine law applied to energy collection. Vanguard 1
had 6 silicon solar cells (Bell Labs, ~6% efficiency) on a 16.5 cm
sphere. Because the satellite tumbled freely with no attitude control,
each cell's angle to the Sun changed continuously, and the total power
was the sum of individual cell contributions weighted by cos(theta_i).

This simulation:
1. Plots P(theta) for a single cell (the cosine law)
2. Shows total power from 6 cells at different satellite orientations
3. Compares 1958 Bell Labs cells (~6% eff) vs modern multi-junction (~47%)
4. Animates power output as the satellite tumbles

Usage:
    python solar-cell-angle.py              # Show plots
    python solar-cell-angle.py --save       # Save to PNG
    python solar-cell-angle.py --animate    # Show tumble animation

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
# Physical Constants — Vanguard 1 Solar Cells
# ============================================================

# Bell Labs silicon solar cells, 1958
# ~6% efficiency, ~1 mW per cell at normal incidence
# Solar constant: ~1361 W/m^2 at Earth orbit
# Cell area: ~2 cm x 0.5 cm = 1 cm^2 = 1e-4 m^2 each

SOLAR_CONSTANT = 1361.0    # W/m^2 at 1 AU
CELL_AREA = 1.0e-4         # m^2 (approximately 2 cm x 0.5 cm)
EFFICIENCY_1958 = 0.06     # 6% — Bell Labs silicon, 1958
EFFICIENCY_MODERN = 0.47   # 47% — modern 6-junction concentrator (2022)
NUM_CELLS = 6

P_MAX_1958 = SOLAR_CONSTANT * CELL_AREA * EFFICIENCY_1958    # ~0.82 mW per cell
P_MAX_MODERN = SOLAR_CONSTANT * CELL_AREA * EFFICIENCY_MODERN  # ~6.4 mW per cell

# Cell positions on sphere (simplified — 6 cells in octahedral arrangement)
# Normals pointing in 6 directions: +x, -x, +y, -y, +z, -z
CELL_NORMALS = np.array([
    [1.0, 0.0, 0.0],
    [-1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, -1.0, 0.0],
    [0.0, 0.0, 1.0],
    [0.0, 0.0, -1.0],
])

def single_cell_power(theta_deg, p_max):
    """Power from a single cell at angle theta (degrees)."""
    theta_rad = np.radians(theta_deg)
    return p_max * np.maximum(0, np.cos(theta_rad))

def total_power_6cells(sun_direction, p_max):
    """Total power from 6 cells given a sun direction vector."""
    sun_norm = sun_direction / np.linalg.norm(sun_direction)
    total = 0.0
    for normal in CELL_NORMALS:
        cos_theta = np.dot(normal, sun_norm)
        if cos_theta > 0:
            total += p_max * cos_theta
    return total

def tumble_power_timeseries(duration_orbits=3, steps_per_orbit=200, p_max=P_MAX_1958):
    """Simulate power output as satellite tumbles through multiple orbits."""
    # Vanguard 1 tumble: rotation about all three axes at different rates
    # Approximate tumble rates (rad/s)
    wx = 2.7 * 2 * np.pi   # ~2.7 rps initially
    wy = 0.3 * 2 * np.pi
    wz = 0.1 * 2 * np.pi

    total_steps = int(duration_orbits * steps_per_orbit)
    t = np.linspace(0, duration_orbits * 134.2 * 60, total_steps)  # seconds

    # Sunlight direction (fixed in inertial frame)
    sun_dir = np.array([1.0, 0.0, 0.0])

    powers = np.zeros(total_steps)
    eclipse = np.zeros(total_steps, dtype=bool)

    for i, ti in enumerate(t):
        # Rotation matrices for tumble
        cx, sx = np.cos(wx * ti), np.sin(wx * ti)
        cy, sy = np.cos(wy * ti), np.sin(wy * ti)
        cz, sz = np.cos(wz * ti), np.sin(wz * ti)

        Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
        Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
        Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])

        R = Rx @ Ry @ Rz

        # Eclipse: satellite in Earth's shadow for ~35% of orbit
        orbit_phase = (ti / (134.2 * 60)) % 1.0
        in_eclipse = 0.35 < orbit_phase < 0.70

        if in_eclipse:
            powers[i] = 0.0
            eclipse[i] = True
        else:
            # Rotate sun direction into body frame
            sun_body = R.T @ sun_dir
            powers[i] = total_power_6cells(sun_body, p_max)

    return t / 60.0, powers, eclipse  # return time in minutes

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

    # ---- Plot 1: Single cell P(theta) ----
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_facecolor('#0a0a14')

    theta = np.linspace(0, 90, 200)
    p_1958 = single_cell_power(theta, P_MAX_1958)
    p_modern = single_cell_power(theta, P_MAX_MODERN)

    ax1.plot(theta, p_1958 * 1000, color=gold, linewidth=2,
             label=f'1958 Bell Labs ({EFFICIENCY_1958*100:.0f}%)')
    ax1.plot(theta, p_modern * 1000, color=blue, linewidth=2, linestyle='--',
             label=f'Modern 6-junction ({EFFICIENCY_MODERN*100:.0f}%)')

    # Mark key angles
    for angle, label in [(0, 'direct'), (30, '30'), (60, '60'), (90, 'edge')]:
        p = single_cell_power(angle, P_MAX_1958) * 1000
        ax1.plot(angle, p, 'o', color=amber, markersize=6)
        ax1.annotate(f'{label}\n{p:.2f} mW', (angle, p),
                     textcoords='offset points', xytext=(10, 5),
                     color='#888888', fontsize=7)

    ax1.set_xlabel('Angle of Incidence (degrees)', color='#888888')
    ax1.set_ylabel('Power Output (mW)', color='#888888')
    ax1.set_title('Single Solar Cell: P = P_max cos(theta)', color=gold, fontsize=11)
    ax1.legend(facecolor='#0a0a14', edgecolor='#333333', labelcolor='#aaaaaa')
    ax1.tick_params(colors='#666666')
    ax1.spines['bottom'].set_color('#333333')
    ax1.spines['left'].set_color('#333333')
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)

    # ---- Plot 2: 6-cell total power vs satellite orientation ----
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.set_facecolor('#0a0a14')

    # Vary sun direction across all orientations
    n_points = 500
    azimuth = np.linspace(0, 2 * np.pi, n_points)
    elevation = np.linspace(-np.pi / 2, np.pi / 2, n_points)

    powers_az = [total_power_6cells(
        np.array([np.cos(a), np.sin(a), 0.0]), P_MAX_1958) * 1000
        for a in azimuth]
    powers_el = [total_power_6cells(
        np.array([np.cos(e), 0.0, np.sin(e)]), P_MAX_1958) * 1000
        for e in elevation]

    ax2.plot(np.degrees(azimuth), powers_az, color=gold, linewidth=1.5,
             label='Azimuth sweep', alpha=0.8)
    ax2.plot(np.degrees(elevation) + 180, powers_el, color=green, linewidth=1.5,
             label='Elevation sweep', alpha=0.8)

    ax2.axhline(y=np.mean(powers_az), color=amber, linestyle=':', alpha=0.5,
                label=f'Mean: {np.mean(powers_az):.2f} mW')

    ax2.set_xlabel('Sun Direction (degrees)', color='#888888')
    ax2.set_ylabel('Total Power from 6 Cells (mW)', color='#888888')
    ax2.set_title('6-Cell Sphere: Total Power vs Orientation', color=gold, fontsize=11)
    ax2.legend(facecolor='#0a0a14', edgecolor='#333333', labelcolor='#aaaaaa', fontsize=8)
    ax2.tick_params(colors='#666666')
    ax2.spines['bottom'].set_color('#333333')
    ax2.spines['left'].set_color('#333333')
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)

    # ---- Plot 3: Tumble time series ----
    ax3 = fig.add_subplot(gs[1, :])
    ax3.set_facecolor('#0a0a14')

    t_min, powers, eclipse = tumble_power_timeseries(duration_orbits=3)

    ax3.plot(t_min, powers * 1000, color=gold, linewidth=0.8, alpha=0.9)

    # Shade eclipse regions
    eclipse_starts = np.where(np.diff(eclipse.astype(int)) == 1)[0]
    eclipse_ends = np.where(np.diff(eclipse.astype(int)) == -1)[0]
    for start, end in zip(eclipse_starts, eclipse_ends):
        ax3.axvspan(t_min[start], t_min[end], alpha=0.15, color='#222244')

    ax3.set_xlabel('Time (minutes)', color='#888888')
    ax3.set_ylabel('Total Power (mW)', color='#888888')
    ax3.set_title('Vanguard 1 Power Output During Tumble (3 orbits)', color=gold, fontsize=11)
    ax3.tick_params(colors='#666666')
    ax3.spines['bottom'].set_color('#333333')
    ax3.spines['left'].set_color('#333333')
    ax3.spines['top'].set_visible(False)
    ax3.spines['right'].set_visible(False)

    # ---- Plot 4: Efficiency comparison across decades ----
    ax4 = fig.add_subplot(gs[2, 0])
    ax4.set_facecolor('#0a0a14')

    decades = [1958, 1970, 1980, 1990, 2000, 2010, 2020, 2025]
    efficiencies = [6.0, 10.0, 15.0, 20.0, 28.0, 37.0, 44.0, 47.6]

    ax4.bar(range(len(decades)), efficiencies,
            color=[gold if d == 1958 else blue for d in decades],
            alpha=0.8, edgecolor='#333333')
    ax4.set_xticks(range(len(decades)))
    ax4.set_xticklabels([str(d) for d in decades], rotation=45)
    ax4.set_ylabel('Record Efficiency (%)', color='#888888')
    ax4.set_title('Solar Cell Efficiency Records', color=gold, fontsize=11)
    ax4.tick_params(colors='#666666')
    ax4.spines['bottom'].set_color('#333333')
    ax4.spines['left'].set_color('#333333')
    ax4.spines['top'].set_visible(False)
    ax4.spines['right'].set_visible(False)

    # Annotate Vanguard 1
    ax4.annotate('Vanguard 1\nBell Labs', (0, 6), textcoords='offset points',
                 xytext=(15, 20), color=amber, fontsize=8,
                 arrowprops=dict(arrowstyle='->', color=amber, lw=0.8))

    # ---- Plot 5: Power budget ----
    ax5 = fig.add_subplot(gs[2, 1])
    ax5.set_facecolor('#0a0a14')

    categories = ['Chemical\nBatteries', 'Solar\n(avg sunlit)', 'Transmitter\n10 mW', 'Transmitter\nreduced']
    values = [200.0, 1.5, 10.0, 1.0]
    colors_bar = [red, gold, '#666666', green]

    bars = ax5.barh(categories, values, color=colors_bar, alpha=0.8, edgecolor='#333333')
    ax5.set_xlabel('Power (mW)', color='#888888')
    ax5.set_title('Vanguard 1 Power Budget', color=gold, fontsize=11)
    ax5.tick_params(colors='#666666')
    ax5.spines['bottom'].set_color('#333333')
    ax5.spines['left'].set_color('#333333')
    ax5.spines['top'].set_visible(False)
    ax5.spines['right'].set_visible(False)

    # Annotate timeline
    ax5.annotate('Died June 1958', xy=(200, 0), xytext=(200, 0.5),
                 color=red, fontsize=8, alpha=0.7)
    ax5.annotate('Active until May 1964', xy=(1.5, 1), xytext=(5, 1.5),
                 color=gold, fontsize=8, alpha=0.7)

    plt.suptitle('Vanguard 1 — First Solar-Powered Satellite (March 17, 1958)\n'
                 'Mission 1.8 | 6 Bell Labs Silicon Cells | 1.47 kg | 16.5 cm diameter',
                 color=amber, fontsize=13, y=0.98)

    if '--save' in sys.argv:
        plt.savefig('solar-cell-angle.png', dpi=150, bbox_inches='tight',
                    facecolor='#0a0a14')
        print('Saved: solar-cell-angle.png')
    else:
        plt.show()

if __name__ == '__main__':
    print('Vanguard 1 Solar Cell Analysis')
    print('=' * 50)
    print(f'Cell area:           {CELL_AREA*1e4:.1f} cm^2')
    print(f'Solar constant:      {SOLAR_CONSTANT:.0f} W/m^2')
    print(f'1958 efficiency:     {EFFICIENCY_1958*100:.0f}%')
    print(f'P_max per cell:      {P_MAX_1958*1000:.2f} mW')
    print(f'Modern efficiency:   {EFFICIENCY_MODERN*100:.0f}%')
    print(f'Modern P_max/cell:   {P_MAX_MODERN*1000:.2f} mW')
    print()
    print('Power at various angles (1958 cell):')
    for angle in [0, 15, 30, 45, 60, 75, 90]:
        p = single_cell_power(angle, P_MAX_1958) * 1000
        print(f'  {angle:3d} deg:  {p:.3f} mW  ({p/P_MAX_1958/1000*100:.0f}%)')
    print()
    print('6-cell total power at various orientations:')
    for desc, direction in [('Sun on +X face', [1, 0, 0]),
                            ('Sun on corner', [1, 1, 1]),
                            ('Sun on edge', [1, 1, 0])]:
        p = total_power_6cells(np.array(direction, dtype=float), P_MAX_1958) * 1000
        print(f'  {desc:25s}  {p:.3f} mW')
    print()
    print('The cosine law is why attitude control matters.')
    print('Vanguard 1 had none. It tumbled freely.')
    print('Its total power varied continuously as each cell')
    print('rotated into and out of sunlight.')
    print('But it worked. For six years.')
    print()

    plot_all()
