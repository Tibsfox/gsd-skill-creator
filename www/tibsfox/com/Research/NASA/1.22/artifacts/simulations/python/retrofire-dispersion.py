"""
MA-7 Aurora 7 — Retrofire Dispersion Analysis

Analyzes how yaw error and timing error during retrofire affect the
landing point for Scott Carpenter's Mercury-Atlas 7 mission (1962-05-24).

Carpenter's manual retrofire was approximately 25 degrees off in yaw and
3 seconds late, contributing to a 402 km overshoot of the planned
splashdown point.

Usage:
    python3 retrofire-dispersion.py

Outputs:
    retrofire-dispersion.png — contour plot of landing overshoot
    stdout — key parameter values
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

# ===========================================================================
# Physical parameters
# ===========================================================================

ORBITAL_VELOCITY = 7_844.0      # m/s — Mercury orbital velocity
PLANNED_DV = 152.0              # m/s — nominal retrograde delta-V
DV_SENSITIVITY = 25.0           # km per m/s of delta-V deficit
REENTRY_GEOMETRY_FACTOR = 2.0   # maps timing error into downrange overshoot
CARPENTER_YAW_ERROR = 25.0      # degrees — estimated actual yaw error
CARPENTER_TIMING_ERROR = 3.0    # seconds — estimated firing delay

# ===========================================================================
# Sweep ranges
# ===========================================================================

yaw_errors_deg = np.linspace(0.0, 30.0, 200)
timing_errors_s = np.linspace(0.0, 10.0, 200)
YAW, TIME = np.meshgrid(yaw_errors_deg, timing_errors_s)

# ===========================================================================
# Compute overshoot for every (yaw, timing) pair
# ===========================================================================

yaw_rad = np.radians(YAW)

# Effective retrograde component of the retro burn
effective_dv = PLANNED_DV * np.cos(yaw_rad)

# Lateral (wasted) component
lateral_dv = PLANNED_DV * np.sin(yaw_rad)

# Overshoot from delta-V deficit (less retrograde braking = longer downrange)
dv_deficit = PLANNED_DV - effective_dv
overshoot_dv = dv_deficit * DV_SENSITIVITY  # km

# Overshoot from late firing (spacecraft travels further before deceleration)
overshoot_timing = TIME * ORBITAL_VELOCITY * REENTRY_GEOMETRY_FACTOR / 1000.0  # km

# Total overshoot
total_overshoot = overshoot_dv + overshoot_timing

# ===========================================================================
# Carpenter's specific case
# ===========================================================================

carpenter_yaw_rad = np.radians(CARPENTER_YAW_ERROR)
carpenter_eff_dv = PLANNED_DV * np.cos(carpenter_yaw_rad)
carpenter_lat_dv = PLANNED_DV * np.sin(carpenter_yaw_rad)
carpenter_dv_deficit = PLANNED_DV - carpenter_eff_dv
carpenter_overshoot_dv = carpenter_dv_deficit * DV_SENSITIVITY
carpenter_overshoot_time = CARPENTER_TIMING_ERROR * ORBITAL_VELOCITY * REENTRY_GEOMETRY_FACTOR / 1000.0
carpenter_total = carpenter_overshoot_dv + carpenter_overshoot_time

# ===========================================================================
# Print key values
# ===========================================================================

print("=" * 60)
print("MA-7 Aurora 7 — Retrofire Dispersion Analysis")
print("=" * 60)
print(f"Orbital velocity:          {ORBITAL_VELOCITY:,.0f} m/s")
print(f"Planned retro delta-V:     {PLANNED_DV:.0f} m/s")
print(f"Delta-V sensitivity:       {DV_SENSITIVITY:.0f} km per m/s deficit")
print(f"Reentry geometry factor:   {REENTRY_GEOMETRY_FACTOR:.1f}")
print()
print("--- Carpenter's actual parameters ---")
print(f"Yaw error:                 {CARPENTER_YAW_ERROR:.0f} degrees")
print(f"Timing error:              {CARPENTER_TIMING_ERROR:.0f} seconds")
print(f"Effective retro delta-V:   {carpenter_eff_dv:.1f} m/s")
print(f"Lateral (wasted) delta-V:  {carpenter_lat_dv:.1f} m/s")
print(f"Delta-V deficit:           {carpenter_dv_deficit:.1f} m/s")
print(f"Overshoot from dV deficit: {carpenter_overshoot_dv:.1f} km")
print(f"Overshoot from timing:     {carpenter_overshoot_time:.1f} km")
print(f"Total predicted overshoot: {carpenter_total:.1f} km")
print(f"Historical overshoot:      ~402 km")
print()
print(f"Worst case (30 deg, 10s):  {total_overshoot[-1, -1]:.1f} km")
print(f"Perfect retro (0 deg, 0s): {total_overshoot[0, 0]:.1f} km")
print("=" * 60)

# ===========================================================================
# Plot
# ===========================================================================

fig, ax = plt.subplots(figsize=(10, 7))

# Filled contour plot
levels = np.linspace(0, 600, 25)
cf = ax.contourf(YAW, TIME, total_overshoot, levels=levels, cmap="YlOrRd")
cs = ax.contour(YAW, TIME, total_overshoot, levels=levels[::3],
                colors="k", linewidths=0.4, alpha=0.5)
ax.clabel(cs, inline=True, fontsize=7, fmt="%.0f km")

cbar = fig.colorbar(cf, ax=ax, pad=0.02)
cbar.set_label("Total landing overshoot (km)", fontsize=11)

# Mark Carpenter's actual parameters
ax.plot(CARPENTER_YAW_ERROR, CARPENTER_TIMING_ERROR,
        marker="*", color="red", markersize=18, zorder=5,
        markeredgecolor="darkred", markeredgewidth=0.8,
        label=f"Carpenter actual ({CARPENTER_YAW_ERROR}\u00b0, {CARPENTER_TIMING_ERROR}s) \u2192 {carpenter_total:.0f} km")

# Mark planned (perfect) parameters
ax.plot(0, 0,
        marker="*", color="lime", markersize=18, zorder=5,
        markeredgecolor="darkgreen", markeredgewidth=0.8,
        label="Planned retrofire (0\u00b0, 0s)")

ax.set_xlabel("Yaw error (degrees)", fontsize=12)
ax.set_ylabel("Timing error (seconds)", fontsize=12)
ax.set_title("MA-7 Aurora 7 \u2014 Retrofire Dispersion Analysis",
             fontsize=14, fontweight="bold")
ax.text(0.5, 1.02, "Landing overshoot vs yaw error and timing delay",
        transform=ax.transAxes, ha="center", fontsize=10, style="italic",
        color="gray")

ax.legend(loc="upper left", fontsize=9, framealpha=0.9)
ax.set_xlim(0, 30)
ax.set_ylim(0, 10)

plt.tight_layout()
out_path = Path(__file__).parent / "retrofire-dispersion.png"
fig.savefig(out_path, dpi=150, bbox_inches="tight")
print(f"\nSaved: {out_path}")
plt.close(fig)
