#!/usr/bin/env python3
"""
Aurora 7 Fuel Budget Model
Mission 1.23 — Mercury-Atlas 7 / The Cost of Curiosity

Models the hydrogen peroxide attitude control fuel consumption
during Carpenter's three-orbit mission. Shows how science
observations depleted the margin that was needed for retrofire.

Compares: planned budget vs. Carpenter's actual consumption.
"""

import numpy as np

# === MISSION TIMELINE (simplified) ===
# Total mission: ~4 hours 56 minutes
# Three orbits, each ~88 minutes

print("AURORA 7 FUEL BUDGET MODEL")
print("=" * 70)

# Activities and their fuel costs (% of total manual fuel)
planned_budget = [
    ("Orbit 1: Station-keeping",        7.0),
    ("Orbit 1: Planned science",         5.0),
    ("Orbit 2: Station-keeping",        7.0),
    ("Orbit 2: Planned science",         5.0),
    ("Orbit 3: Station-keeping",        6.0),
    ("Orbit 3: Retrofire preparation",  15.0),
    ("Retrofire execution",             10.0),
    ("Reserve (contingency)",           45.0),
]

actual_budget = [
    ("Orbit 1: Station-keeping",         6.0),
    ("Orbit 1: Firefly investigation",  12.0),
    ("Orbit 1: Balloon experiment",      8.0),
    ("Orbit 1: Terrain photography",     5.0),
    ("Orbit 2: Station-keeping",         5.0),
    ("Orbit 2: Firefly re-investigation",10.0),
    ("Orbit 2: Liquid behavior obs",     4.0),
    ("Orbit 2: Additional photography",  7.0),
    ("Orbit 2: Unscheduled maneuvers",  10.0),
    ("Orbit 3: Station-keeping",         4.0),
    ("Orbit 3: Retrofire preparation",   8.0),
    ("Retrofire execution",             10.0),
    ("Reserve remaining",                5.0),
]

def print_budget(title, items):
    print(f"\n{title}")
    print(f"{'-'*70}")
    print(f"{'Activity':<40} {'Cost':>8} {'Remaining':>10}")
    print(f"{'-'*70}")

    remaining = 100.0
    for activity, cost in items:
        remaining -= cost
        bar = "█" * int(remaining / 5) + "░" * (20 - int(remaining / 5))
        status = ""
        if remaining < 15:
            status = " ⚠ CRITICAL"
        elif remaining < 30:
            status = " ⚡ CAUTION"
        print(f"{activity:<40} {cost:>7.1f}% {remaining:>8.1f}%  {bar}{status}")

    print(f"\nFinal reserve: {remaining:.1f}%")
    return remaining

planned_reserve = print_budget("PLANNED FUEL BUDGET (Flight Plan)", planned_budget)
actual_reserve = print_budget("ACTUAL FUEL CONSUMPTION (Carpenter)", actual_budget)

print(f"\n{'='*70}")
print(f"COMPARISON")
print(f"{'='*70}")
print(f"  Planned reserve at retrofire: {planned_reserve:.1f}%")
print(f"  Actual reserve at retrofire:  {actual_reserve:.1f}%")
print(f"  Deficit: {planned_reserve - actual_reserve:.1f}%")
print()
print(f"  The firefly investigation alone consumed ~22% of total fuel.")
print(f"  The entire planned science budget was 10%.")
print(f"  Carpenter spent 2.2x the planned science allocation on")
print(f"  firefly investigation alone, plus additional observations.")
print()
print(f"  At retrofire: 5% remaining instead of 45%.")
print(f"  5% could not compensate for the horizon scanner failure.")
print(f"  45% would have provided margin to correct manually.")
print(f"  The difference: 402 km of overshoot and a grounded pilot.")
print()
print(f"  The firefly mystery was solved. The science was real.")
print(f"  The fuel was gone. The margin was 402 kilometers.")
