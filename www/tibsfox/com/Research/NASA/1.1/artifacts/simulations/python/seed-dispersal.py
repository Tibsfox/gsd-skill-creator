#!/usr/bin/env python3
"""
Fireweed Seed Dispersal Simulation
====================================
NASA Mission Series v1.1 — Organism Pairing: Chamerion angustifolium

Models the wind dispersal of 80,000 fireweed seeds from a single plant.
Each seed has a pappus (silky parachute) that catches the wind and carries
it across the landscape.

Real parameters:
  - Seeds per plant: ~80,000
  - Seed mass: ~0.1 mg
  - Pappus diameter: ~1.5 cm
  - Terminal velocity: ~0.3 m/s (pappus fully deployed)
  - Release height: 1.0-2.5 m (typical fireweed stem)

Wind field uses smooth random noise (scipy gaussian_filter on random field)
to create coherent, naturalistic wind patterns.

Usage: python3 seed-dispersal.py
Dependencies: numpy, scipy, matplotlib
Output: seed_dispersal.png (4-panel time series + statistics)
"""

import numpy as np
from scipy.ndimage import gaussian_filter
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import matplotlib.gridspec as gridspec

# ============================================================
# SEED PARAMETERS (real fireweed values)
# ============================================================

N_SEEDS = 80_000                    # seeds per plant per season
SEED_MASS = 0.1e-6                  # kg (0.1 mg)
PAPPUS_DIAMETER = 0.015             # m (1.5 cm)
PAPPUS_AREA = np.pi * (PAPPUS_DIAMETER / 2) ** 2  # m^2
RELEASE_HEIGHT_MIN = 1.0            # m (short plant)
RELEASE_HEIGHT_MAX = 2.5            # m (tall plant)
TERMINAL_VELOCITY = 0.25            # m/s (pappus fully open, ideal)

# Air properties
RHO_AIR = 1.225                     # kg/m^3

# Drag coefficient for pappus (like a small parachute)
# Derived from terminal velocity: v_t = sqrt(2mg / (rho * Cd * A))
# Cd = 2mg / (rho * v_t^2 * A)
CD_PAPPUS = (2 * SEED_MASS * 9.81) / (RHO_AIR * TERMINAL_VELOCITY**2 * PAPPUS_AREA)

# Simulation domain
DOMAIN_SIZE = 2000.0                # m (2 km x 2 km area)
WIND_GRID_N = 64                    # grid resolution for wind field

# Time snapshots to plot
SNAPSHOT_TIMES = [1, 5, 10, 30]     # minutes
DT = 0.5                            # s (time step)

# Base wind speed (typical PNW afternoon breeze)
WIND_BASE_SPEED = 3.0               # m/s (~7 mph, light breeze)
WIND_GUST_AMPLITUDE = 2.0           # m/s (gust variation)

# ============================================================
# WIND FIELD GENERATION (Perlin-like smooth noise)
# ============================================================

def generate_wind_field(seed=42):
    """
    Generate a smooth, coherent wind field using gaussian-filtered
    random noise. Returns (wx, wy) velocity grids.

    This creates naturalistic wind patterns with coherent structures:
    convergence zones, divergence zones, and gentle rotation — the kind
    of wind field you get in a mountain valley or forest clearing.
    """
    rng = np.random.RandomState(seed)

    # Random noise -> gaussian filter for smooth, coherent fields
    # Large sigma = large-scale coherent features
    raw_wx = rng.randn(WIND_GRID_N, WIND_GRID_N)
    raw_wy = rng.randn(WIND_GRID_N, WIND_GRID_N)

    # Multi-scale smoothing (like octaves of Perlin noise)
    wx = (gaussian_filter(raw_wx, sigma=12) * WIND_GUST_AMPLITUDE * 2.0 +
          gaussian_filter(rng.randn(WIND_GRID_N, WIND_GRID_N), sigma=6) * WIND_GUST_AMPLITUDE * 0.8 +
          gaussian_filter(rng.randn(WIND_GRID_N, WIND_GRID_N), sigma=3) * WIND_GUST_AMPLITUDE * 0.3)

    wy = (gaussian_filter(raw_wy, sigma=12) * WIND_GUST_AMPLITUDE * 2.0 +
          gaussian_filter(rng.randn(WIND_GRID_N, WIND_GRID_N), sigma=6) * WIND_GUST_AMPLITUDE * 0.8 +
          gaussian_filter(rng.randn(WIND_GRID_N, WIND_GRID_N), sigma=3) * WIND_GUST_AMPLITUDE * 0.3)

    # Add prevailing wind direction (NW to SE, typical PNW summer)
    wx += WIND_BASE_SPEED * 0.7   # eastward component
    wy += WIND_BASE_SPEED * -0.3  # slight southward

    return wx, wy

def sample_wind(x, y, wx_field, wy_field, time_offset=0):
    """
    Sample wind velocity at position (x, y) from the wind field grid.
    Adds time-varying perturbation for temporal coherence.
    """
    # Map world coordinates to grid indices
    gx = np.clip((x / DOMAIN_SIZE + 0.5) * (WIND_GRID_N - 1), 0, WIND_GRID_N - 1).astype(int)
    gy = np.clip((y / DOMAIN_SIZE + 0.5) * (WIND_GRID_N - 1), 0, WIND_GRID_N - 1).astype(int)

    wx = wx_field[gy, gx]
    wy = wy_field[gy, gx]

    # Add small time-varying turbulence
    turb_scale = 0.3
    wx += turb_scale * np.sin(time_offset * 0.01 + x * 0.005)
    wy += turb_scale * np.cos(time_offset * 0.013 + y * 0.005)

    return wx, wy

# ============================================================
# SEED DISPERSAL SIMULATION
# ============================================================

def simulate_dispersal():
    """
    Simulate 80,000 seeds being released from a single fireweed plant
    and carried by wind. Seeds are released over the bloom period
    (not all at once).
    """
    print("=" * 60)
    print("Fireweed Seed Dispersal — 80,000 Seeds")
    print("Chamerion angustifolium")
    print("=" * 60)
    print()

    rng = np.random.RandomState(2024)

    # Generate wind field
    wx_field, wy_field = generate_wind_field(seed=42)

    max_time = max(SNAPSHOT_TIMES) * 60  # convert to seconds
    n_steps = int(max_time / DT) + 1  # +1 to include final time point

    # Seed release: staggered over first 10 minutes (seeds don't all release at once)
    # Progressive pod opening from bottom to top of raceme
    release_times = rng.exponential(scale=120, size=N_SEEDS)  # mean 2 min
    release_times = np.clip(release_times, 0, max_time * 0.8)

    # Initial positions: all from the plant (origin) with slight random spread
    # representing different pods on the raceme
    x = np.zeros(N_SEEDS)
    y = np.zeros(N_SEEDS)
    release_heights = rng.uniform(RELEASE_HEIGHT_MIN, RELEASE_HEIGHT_MAX, N_SEEDS)
    z = release_heights.copy()  # vertical height above ground

    # Track which seeds have been released and which have landed
    released = np.zeros(N_SEEDS, dtype=bool)
    landed = np.zeros(N_SEEDS, dtype=bool)

    # Pappus efficiency varies per seed (some are damaged, folded)
    pappus_efficiency = rng.uniform(0.5, 1.0, N_SEEDS)
    v_terminal = TERMINAL_VELOCITY * pappus_efficiency

    # Storage for snapshots
    snapshots = {}
    snapshot_seconds = [t * 60 for t in SNAPSHOT_TIMES]

    print(f"Simulating {N_SEEDS:,} seeds over {max_time/60:.0f} minutes...")
    print(f"Time step: {DT} s, total steps: {n_steps}")
    print()

    current_time = 0
    for step in range(n_steps):
        current_time = step * DT

        # Release seeds whose time has come
        new_releases = (~released) & (release_times <= current_time)
        released |= new_releases

        # Active seeds: released but not landed
        active = released & (~landed)

        if not np.any(active):
            if current_time > 60:  # at least 1 minute in
                # Check if we've passed all snapshots
                if all(current_time >= s for s in snapshot_seconds):
                    break
            continue

        # Sample wind at each active seed position
        wx, wy = sample_wind(x[active], y[active], wx_field, wy_field, current_time)

        # Add random turbulence (brownian-like jitter)
        n_active = np.sum(active)
        wx += rng.randn(n_active) * 0.5
        wy += rng.randn(n_active) * 0.5

        # Update horizontal position
        x[active] += wx * DT
        y[active] += wy * DT

        # Update vertical position (falling at terminal velocity)
        z[active] -= v_terminal[active] * DT

        # Thermals and updrafts — critical for realistic dispersal distances
        # PNW summer afternoon: convective thermals reach 500-1500 m
        # Seeds caught in thermals can be lofted to 100+ meters
        # Model as spatially coherent updraft zones using wind field
        active_x = x[active]
        active_y = y[active]
        active_z = z[active]

        # Base thermal updraft: position-dependent (coherent thermal cells)
        thermal_x = (active_x / 200.0 + current_time * 0.002)
        thermal_y = (active_y / 200.0 + current_time * 0.0015)
        thermal_strength = np.sin(thermal_x) * np.cos(thermal_y) * 0.8  # m/s

        # Stronger thermals for seeds already aloft (positive feedback)
        height_bonus = np.clip(active_z / 50.0, 0, 2.0)  # seeds higher up get stronger lift
        thermal_strength += height_bonus * 0.3

        # Random gusts on top
        gust = rng.randn(n_active) * 0.15

        updraft = thermal_strength + gust
        z[active] += updraft * DT
        z[active] = np.maximum(z[active], 0)  # can't go underground

        # Seeds that hit the ground
        just_landed = active.copy()
        just_landed[active] = z[active] <= 0
        landed |= just_landed
        z[landed] = 0

        # Record snapshots
        for snap_s in snapshot_seconds:
            if snap_s not in snapshots and current_time >= snap_s:
                snapshots[snap_s] = {
                    'x': x.copy(),
                    'y': y.copy(),
                    'released': released.copy(),
                    'landed': landed.copy(),
                    'airborne': released & (~landed)
                }
                t_min = snap_s / 60
                n_rel = np.sum(released)
                n_land = np.sum(landed)
                n_air = np.sum(released & (~landed))
                distances = np.sqrt(x[released]**2 + y[released]**2)
                print(f"  T+{t_min:.0f} min: {n_rel:,} released, "
                      f"{n_air:,} airborne, {n_land:,} landed, "
                      f"mean dist={np.mean(distances):.0f} m, "
                      f"max dist={np.max(distances):.0f} m")

    return snapshots, wx_field, wy_field

# ============================================================
# VISUALIZATION
# ============================================================

def plot_dispersal(snapshots, wx_field, wy_field):
    """Create a 4-panel visualization of seed dispersal at each time snapshot."""

    # Custom colormap: dark to magenta (fireweed color)
    fireweed_cmap = LinearSegmentedColormap.from_list(
        'fireweed',
        ['#1a0a1a', '#4A0E4E', '#8B1A8B', '#C850C0', '#E8A0E8', '#FFFFFF'],
        N=256
    )

    fig = plt.figure(figsize=(16, 16))
    gs = gridspec.GridSpec(3, 2, height_ratios=[1, 1, 0.6], hspace=0.3, wspace=0.3)

    fig.suptitle(
        'Fireweed Seed Dispersal — 80,000 Seeds from a Single Plant\n'
        'Chamerion angustifolium | NASA Mission v1.1 Organism Pairing',
        fontsize=16, fontweight='bold', y=0.98
    )

    snapshot_seconds = sorted(snapshots.keys())

    for i, snap_s in enumerate(snapshot_seconds[:4]):
        row = i // 2
        col = i % 2
        ax = fig.add_subplot(gs[row, col])

        snap = snapshots[snap_s]
        t_min = snap_s / 60

        # Get positions of released seeds
        mask = snap['released']
        sx = snap['x'][mask]
        sy = snap['y'][mask]

        # Separate airborne vs landed
        airborne = snap['airborne'][mask]
        landed_mask = snap['landed'][mask]

        # Plot as density (hexbin) for landed seeds
        if np.sum(landed_mask) > 10:
            hb = ax.hexbin(
                sx[landed_mask], sy[landed_mask],
                gridsize=50, cmap=fireweed_cmap,
                mincnt=1, alpha=0.8,
                extent=[-DOMAIN_SIZE/2, DOMAIN_SIZE/2, -DOMAIN_SIZE/2, DOMAIN_SIZE/2]
            )

        # Plot airborne seeds as small dots
        if np.sum(airborne) > 0:
            # Subsample if too many for plotting
            airborne_x = sx[airborne]
            airborne_y = sy[airborne]
            if len(airborne_x) > 5000:
                idx = np.random.choice(len(airborne_x), 5000, replace=False)
                airborne_x = airborne_x[idx]
                airborne_y = airborne_y[idx]
            ax.scatter(airborne_x, airborne_y, s=0.3, c='white', alpha=0.4, zorder=5)

        # Plant position (origin)
        ax.plot(0, 0, 'g*', markersize=12, zorder=10, label='Plant')

        # Wind field arrows (subsampled)
        wg = np.linspace(-DOMAIN_SIZE/2, DOMAIN_SIZE/2, WIND_GRID_N)
        WX, WY = np.meshgrid(wg, wg)
        skip = 8
        ax.quiver(
            WX[::skip, ::skip], WY[::skip, ::skip],
            wx_field[::skip, ::skip], wy_field[::skip, ::skip],
            color='#40A040', alpha=0.2, scale=80, width=0.003, zorder=1
        )

        # Statistics for this snapshot
        if np.sum(mask) > 0:
            distances = np.sqrt(sx**2 + sy**2)
            mean_d = np.mean(distances)
            max_d = np.max(distances)
            n_released = np.sum(mask)
            n_landed = np.sum(landed_mask)

            stats_text = (
                f'Released: {n_released:,}\n'
                f'Landed: {n_landed:,}\n'
                f'Mean: {mean_d:.0f} m\n'
                f'Max: {max_d:.0f} m'
            )
            ax.text(0.02, 0.98, stats_text, transform=ax.transAxes,
                    fontsize=9, verticalalignment='top',
                    fontfamily='monospace', color='#C850C0',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='#0A0A0A', alpha=0.8))

        ax.set_xlim(-DOMAIN_SIZE/2, DOMAIN_SIZE/2)
        ax.set_ylim(-DOMAIN_SIZE/2, DOMAIN_SIZE/2)
        ax.set_facecolor('#0A0A0A')
        ax.set_title(f'T + {t_min:.0f} minutes', fontsize=13, fontweight='bold', color='#C850C0')
        ax.set_xlabel('East-West (m)', fontsize=10)
        ax.set_ylabel('North-South (m)', fontsize=10)
        ax.tick_params(colors='#888888')
        ax.set_aspect('equal')

        # Scale bar
        bar_x = DOMAIN_SIZE/2 - 300
        bar_y = -DOMAIN_SIZE/2 + 50
        ax.plot([bar_x - 200, bar_x], [bar_y, bar_y], 'w-', linewidth=2)
        ax.text(bar_x - 100, bar_y + 30, '200 m', ha='center', color='white', fontsize=8)

    # Bottom panel: dispersal statistics across time
    ax_stats = fig.add_subplot(gs[2, :])

    # Compute distance distributions for each snapshot
    colors = ['#FF6B9D', '#C850C0', '#8B1A8B', '#4A0E4E']
    for i, snap_s in enumerate(snapshot_seconds[:4]):
        snap = snapshots[snap_s]
        t_min = snap_s / 60
        mask = snap['released']
        if np.sum(mask) > 0:
            distances = np.sqrt(snap['x'][mask]**2 + snap['y'][mask]**2)
            # Histogram
            bins = np.linspace(0, DOMAIN_SIZE * 0.7, 100)
            ax_stats.hist(distances, bins=bins, alpha=0.4, color=colors[i],
                         label=f'T+{t_min:.0f} min (n={np.sum(mask):,})',
                         density=True)

    ax_stats.set_xlabel('Distance from Plant (m)', fontsize=12)
    ax_stats.set_ylabel('Density', fontsize=12)
    ax_stats.set_title('Seed Dispersal Distance Distribution Over Time', fontsize=13, fontweight='bold')
    ax_stats.legend(fontsize=10, loc='upper right')
    ax_stats.set_facecolor('#FAFAFA')
    ax_stats.grid(True, alpha=0.3)

    # Annotation
    ax_stats.text(0.02, 0.95,
                  'Single Chamerion angustifolium plant\n'
                  '80,000 seeds | Pappus-aided wind dispersal\n'
                  'PNW summer breeze (~3 m/s prevailing NW)',
                  transform=ax_stats.transAxes, fontsize=9,
                  verticalalignment='top', fontfamily='monospace',
                  bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))

    output_path = 'seed_dispersal.png'
    plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor='white')
    print()
    print(f"Plot saved: {output_path}")

    # Print final statistics
    final_snap = snapshots[max(snapshot_seconds)]
    mask = final_snap['released']
    distances = np.sqrt(final_snap['x'][mask]**2 + final_snap['y'][mask]**2)

    print()
    print("DISPERSAL STATISTICS (T+30 minutes):")
    print(f"  Seeds released: {np.sum(mask):,}")
    print(f"  Seeds landed:   {np.sum(final_snap['landed']):,}")
    print(f"  Mean distance:  {np.mean(distances):.0f} m")
    print(f"  Median distance:{np.median(distances):.0f} m")
    print(f"  Max distance:   {np.max(distances):.0f} m")
    print(f"  Std deviation:  {np.std(distances):.0f} m")
    print(f"  95th percentile:{np.percentile(distances, 95):.0f} m")
    print()
    print("  Distance quantiles:")
    for p in [10, 25, 50, 75, 90, 95, 99]:
        print(f"    {p:3d}th: {np.percentile(distances, p):8.0f} m")

    print()
    print("=" * 60)
    print("\"A single fireweed plant produces 80,000 seeds, each")
    print(" weighing 0.1 milligrams. Small things make large things")
    print(" possible.\"")
    print("=" * 60)

    plt.close()

# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    snapshots, wx_field, wy_field = simulate_dispersal()
    plot_dispersal(snapshots, wx_field, wy_field)
