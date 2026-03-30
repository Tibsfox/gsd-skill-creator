#!/usr/bin/env python3
"""
Pioneer Program — Five-Mission Comparison
==========================================
All 5 Pioneer missions (0-4) on one visualization.
The story of convergence from total failure to escape velocity.

  Pioneer 0: 16 km       (77 seconds)     — Thor-Able I exploded
  Pioneer 1: 113,854 km  (43 hours)       — fell back (guidance error)
  Pioneer 2: 1,550 km    (45 minutes)     — fell back (3rd stage failure)
  Pioneer 3: 102,322 km  (38 hours)       — fell back (early cutoff)
  Pioneer 4: ESCAPE       (82+ hours)     — heliocentric orbit achieved

August 17, 1958 to March 3, 1959: 198 days, 5 missions, 1 success.

Requires: numpy, matplotlib
Run: python3 pioneer-comparison.py
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

# =========================================================================
# Mission data
# =========================================================================
missions = [
    {
        'name': 'Pioneer 0',
        'version': 'v1.1',
        'date': 'Aug 17, 1958',
        'vehicle': 'Thor-Able I',
        'max_alt_km': 16,
        'flight_time_hr': 77 / 3600,  # 77 seconds
        'flight_time_label': '77 sec',
        'failure': 'First stage exploded\n(turbopump bearing seizure)',
        'stage_failed': 1,
        'color': '#ff6b6b',
        'status': 'DESTROYED',
        'organism': "Devil's club",
        'escape': False,
    },
    {
        'name': 'Pioneer 1',
        'version': 'v1.2',
        'date': 'Oct 11, 1958',
        'vehicle': 'Thor-Able I',
        'max_alt_km': 113_854,
        'flight_time_hr': 43,
        'flight_time_label': '43 hours',
        'failure': 'Guidance error: 3.5\u00b0 steering\ncaused 236 m/s velocity deficit',
        'stage_failed': 0,  # guidance, not a stage failure
        'color': '#ffd93d',
        'status': 'PARTIAL SUCCESS',
        'organism': 'Sword fern',
        'escape': False,
    },
    {
        'name': 'Pioneer 2',
        'version': 'v1.3',
        'date': 'Nov 8, 1958',
        'vehicle': 'Thor-Able I',
        'max_alt_km': 1_550,
        'flight_time_hr': 0.75,  # 45 minutes
        'flight_time_label': '45 min',
        'failure': 'Third stage failed to ignite\n(spin rocket misalignment)',
        'stage_failed': 3,
        'color': '#ff6b6b',
        'status': 'FAILED',
        'organism': 'Black-capped chickadee',
        'escape': False,
    },
    {
        'name': 'Pioneer 3',
        'version': 'v1.4',
        'date': 'Dec 6, 1958',
        'vehicle': 'Juno II',
        'max_alt_km': 102_322,
        'flight_time_hr': 38,
        'flight_time_label': '38 hours',
        'failure': 'First stage cutoff 3.7s early\n(LOX depletion sensor error)',
        'stage_failed': 1,
        'color': '#ffd93d',
        'status': 'PARTIAL SUCCESS',
        'organism': "Old Man's Beard lichen",
        'escape': False,
    },
    {
        'name': 'Pioneer 4',
        'version': 'v1.5',
        'date': 'Mar 3, 1959',
        'vehicle': 'Juno II',
        'max_alt_km': 655_000,  # tracking distance, not max alt (infinite)
        'flight_time_hr': 82,
        'flight_time_label': '82+ hours',
        'failure': None,
        'stage_failed': None,
        'color': '#6bcb77',
        'status': 'SUCCESS \u2014 ESCAPE',
        'organism': 'Douglas-fir',
        'escape': True,
    },
]

MOON_DIST_KM = 384_400


def parabolic_trajectory(t_hrs, max_alt_km, flight_time_hr, escape=False):
    """Simplified ballistic/escape trajectory."""
    t = np.asarray(t_hrs, dtype=float)
    if escape:
        # Escape: altitude increases without bound
        # Use approximate hyperbolic escape curve
        v_esc = 11.0  # km/s approximate
        alt = v_esc * t * 3600  # very simplified
        return np.maximum(alt, 0)
    else:
        t_half = flight_time_hr / 2
        alt = max_alt_km * (1 - ((t - t_half) / t_half) ** 2)
        return np.maximum(alt, 0)


def main():
    # =====================================================================
    # Plot 1: Altitude vs Time (all 5 missions, log scale)
    # =====================================================================
    fig1, ax1 = plt.subplots(figsize=(16, 9))

    for m in missions:
        t_max = m['flight_time_hr'] * 1.05
        if m['escape']:
            t_max = 90
        t = np.linspace(0, t_max, 2000)
        alt = parabolic_trajectory(t, m['max_alt_km'], m['flight_time_hr'],
                                    m['escape'])
        # Clip tiny altitudes for log scale
        alt_plot = np.maximum(alt, 1)

        ax1.semilogy(t, alt_plot, color=m['color'], linewidth=2.5,
                     label=f"{m['name']} ({m['flight_time_label']})",
                     alpha=0.9)

        # Mark maximum altitude
        max_idx = np.argmax(alt)
        if not m['escape']:
            ax1.plot(t[max_idx], alt[max_idx], 'v', color=m['color'],
                     markersize=10, zorder=5)
            ax1.annotate(f"{m['max_alt_km']:,} km",
                         xy=(t[max_idx], alt[max_idx]),
                         xytext=(t[max_idx] + 1, alt[max_idx] * 1.5),
                         fontsize=9, color=m['color'],
                         arrowprops=dict(arrowstyle='->', color=m['color'],
                                         lw=1.5))
        else:
            ax1.annotate('ESCAPE \u2192 \u221E',
                         xy=(85, alt[-1]),
                         fontsize=12, color=m['color'],
                         fontweight='bold', va='center')

    # Moon distance reference
    ax1.axhline(y=MOON_DIST_KM, color='#888', linestyle='--', linewidth=1.5,
                alpha=0.5)
    ax1.text(88, MOON_DIST_KM * 1.15, f'Moon ({MOON_DIST_KM:,} km)',
             fontsize=10, color='#888', ha='right')

    ax1.set_xlabel('Time since launch (hours)', fontsize=13, color='white')
    ax1.set_ylabel('Altitude (km, log scale)', fontsize=13, color='white')
    ax1.set_title('Pioneer Program: Five Missions to Escape\n'
                  'August 1958 \u2013 March 1959',
                  fontsize=16, fontweight='bold', color='white')
    ax1.legend(facecolor='#1a1a3e', edgecolor='white', labelcolor='white',
               fontsize=11, loc='center right')
    ax1.set_facecolor('#0a0a2e')
    fig1.set_facecolor('#0a0a2e')
    ax1.tick_params(colors='white')
    for spine in ax1.spines.values():
        spine.set_color('white')
    ax1.grid(True, alpha=0.15, color='white')
    ax1.set_xlim(-2, 90)
    ax1.set_ylim(1, 1e6)

    plt.tight_layout()
    plt.savefig('pioneer-comparison-altitude.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: pioneer-comparison-altitude.png")

    # =====================================================================
    # Plot 2: Maximum Altitude Bar Chart
    # =====================================================================
    fig2, ax2 = plt.subplots(figsize=(14, 8))

    names = [m['name'] for m in missions]
    alts = [m['max_alt_km'] for m in missions]
    colors = [m['color'] for m in missions]

    # Use log scale for bars
    bars = ax2.bar(range(len(missions)), alts, color=colors, edgecolor='white',
                   linewidth=1, alpha=0.85, width=0.6)

    ax2.set_yscale('log')

    # Moon distance line
    ax2.axhline(y=MOON_DIST_KM, color='#888', linestyle='--', linewidth=2)
    ax2.text(4.4, MOON_DIST_KM * 0.7, 'Moon', fontsize=11, color='#888',
             ha='right')

    # Labels on bars
    for i, (bar, m) in enumerate(zip(bars, missions)):
        alt = m['max_alt_km']
        if m['escape']:
            ax2.text(i, alt * 1.3, 'ESCAPE\n\u221E', ha='center', va='bottom',
                     fontsize=12, fontweight='bold', color=m['color'])
        else:
            ax2.text(i, alt * 1.3, f'{alt:,} km', ha='center', va='bottom',
                     fontsize=10, color=m['color'])

    # X-axis labels
    ax2.set_xticks(range(len(missions)))
    labels = [f"{m['name']}\n{m['version']}\n{m['date']}\n{m['vehicle']}"
              for m in missions]
    ax2.set_xticklabels(labels, fontsize=9, color='white')

    ax2.set_ylabel('Maximum Altitude (km, log scale)', fontsize=13, color='white')
    ax2.set_title('Pioneer Program: Maximum Altitude Reached\n'
                  '4 orders of magnitude from explosion to escape',
                  fontsize=15, fontweight='bold', color='white')
    ax2.set_facecolor('#0a0a2e')
    fig2.set_facecolor('#0a0a2e')
    ax2.tick_params(colors='white')
    for spine in ax2.spines.values():
        spine.set_color('white')
    ax2.grid(True, alpha=0.15, color='white', axis='y')
    ax2.set_ylim(5, 2e6)

    plt.tight_layout()
    plt.savefig('pioneer-comparison-maxalt.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: pioneer-comparison-maxalt.png")

    # =====================================================================
    # Plot 3: Annotated Failure Analysis
    # =====================================================================
    fig3, ax3 = plt.subplots(figsize=(16, 10))

    # Timeline layout
    y_positions = [4, 3, 2, 1, 0]  # top to bottom

    for i, m in enumerate(missions):
        y = y_positions[i]

        # Mission box
        box_color = m['color']
        box = FancyBboxPatch((0.5, y - 0.35), 2.5, 0.7,
                             boxstyle="round,pad=0.1",
                             facecolor=box_color + '33',
                             edgecolor=box_color, linewidth=2)
        ax3.add_patch(box)

        # Mission name and date
        ax3.text(1.75, y + 0.15, f"{m['name']} ({m['version']})",
                 fontsize=12, fontweight='bold', color=box_color,
                 ha='center', va='center')
        ax3.text(1.75, y - 0.12, f"{m['date']} | {m['vehicle']}",
                 fontsize=9, color='#aaa', ha='center', va='center')

        # Status
        ax3.text(3.5, y + 0.1, m['status'],
                 fontsize=11, fontweight='bold', color=box_color,
                 va='center')

        # Flight time and altitude
        if m['escape']:
            ax3.text(3.5, y - 0.15, f"{m['flight_time_label']} | ESCAPE \u2192 \u221E",
                     fontsize=9, color='#aaa', va='center')
        else:
            ax3.text(3.5, y - 0.15,
                     f"{m['flight_time_label']} | {m['max_alt_km']:,} km",
                     fontsize=9, color='#aaa', va='center')

        # Failure description
        if m['failure']:
            ax3.text(6.5, y, m['failure'],
                     fontsize=9, color='#ccc', va='center',
                     bbox=dict(boxstyle='round,pad=0.3',
                               facecolor='#1a1a3e',
                               edgecolor='#333'))
        else:
            ax3.text(6.5, y, 'ALL STAGES NOMINAL\nEscape velocity achieved\n11.1 km/s',
                     fontsize=9, color='#6bcb77', va='center',
                     fontweight='bold',
                     bbox=dict(boxstyle='round,pad=0.3',
                               facecolor='#1a3a1e',
                               edgecolor='#6bcb77'))

        # Organism
        ax3.text(9.5, y, m['organism'],
                 fontsize=9, color='#558855', va='center',
                 fontstyle='italic')

    # Connecting arrow showing progression
    for i in range(len(missions) - 1):
        ax3.annotate('', xy=(1.75, y_positions[i + 1] + 0.4),
                     xytext=(1.75, y_positions[i] - 0.4),
                     arrowprops=dict(arrowstyle='->', color='#444',
                                     lw=1.5, connectionstyle='arc3,rad=0'))

    # Headers
    ax3.text(1.75, 4.8, 'MISSION', fontsize=10, color='#666',
             ha='center', fontweight='bold')
    ax3.text(3.5, 4.8, 'RESULT', fontsize=10, color='#666',
             fontweight='bold')
    ax3.text(6.5, 4.8, 'WHAT FAILED', fontsize=10, color='#666',
             ha='center', fontweight='bold')
    ax3.text(9.5, 4.8, 'ORGANISM', fontsize=10, color='#666',
             ha='center', fontweight='bold')

    ax3.set_xlim(0, 11)
    ax3.set_ylim(-1, 5.5)
    ax3.axis('off')
    ax3.set_title('Pioneer Program Failure Analysis\n'
                  '198 days from first explosion to first escape',
                  fontsize=15, fontweight='bold', color='white',
                  pad=20)
    ax3.set_facecolor('#0a0a2e')
    fig3.set_facecolor('#0a0a2e')

    plt.tight_layout()
    plt.savefig('pioneer-comparison-failures.png', dpi=150, facecolor='#0a0a2e')
    print("Saved: pioneer-comparison-failures.png")

    # =====================================================================
    # Print summary
    # =====================================================================
    print("\n" + "=" * 70)
    print(" PIONEER PROGRAM — FIVE MISSIONS TO ESCAPE")
    print("=" * 70)
    print(f"{'Mission':<12} {'Date':<14} {'Vehicle':<12} {'Max Alt':>12} {'Time':>12} {'Status'}")
    print("-" * 70)
    for m in missions:
        alt_str = '\u221E (escape)' if m['escape'] else f"{m['max_alt_km']:,} km"
        print(f"{m['name']:<12} {m['date']:<14} {m['vehicle']:<12} "
              f"{alt_str:>12} {m['flight_time_label']:>12} {m['status']}")
    print("-" * 70)
    print(f"")
    print(f" Duration:  198 days (Aug 17, 1958 to Mar 3, 1959)")
    print(f" Missions:  5 total (2 failures, 2 partial successes, 1 full success)")
    print(f" Vehicles:  Thor-Able I (3 attempts), Juno II (2 attempts)")
    print(f"")
    print(f" Altitude range: 16 km to infinity")
    print(f"   That's a factor of {655_000 / 16:,.0f}x improvement from P0 to P4")
    print(f"")
    print(f" Key lesson: each failure taught something critical:")
    print(f"   P0: Don't use untested turbopump bearings")
    print(f"   P1: Fix the guidance system (3.5\u00b0 error = 236 m/s deficit)")
    print(f"   P2: Align the spin rockets properly")
    print(f"   P3: Fix the LOX depletion sensor (3.7s early cutoff)")
    print(f"   P4: All corrections applied -> escape velocity achieved")
    print("=" * 70)

    plt.show()


if __name__ == '__main__':
    main()
