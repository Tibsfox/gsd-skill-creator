#!/bin/bash
set -e
cd "$(dirname "$0")"

# Backfill sweeps — hour 13 already applied but uncommitted
# Remaining: 15, 16, 19, 20, 21, 22, 23

# First commit the existing v1.0.13 state
echo "=== Committing v1.0.13 (already applied) ==="
git add -u www/
git commit -m "feat(sweep): v1.0.13 — T-26h 1pm, 11.5°C SE 8 km/h, scattered clouds"
echo "✓ v1.0.13 committed"
echo

# Now run each remaining sweep and commit
declare -A LABELS
LABELS[15]="T-24h 3pm, 11.0°C S 10 km/h, broken clouds"
LABELS[16]="T-23h 4pm, 10.5°C S 12 km/h, broken overcast"
LABELS[19]="T-20h 7pm, 8.5°C S 13 km/h, overcast"
LABELS[20]="T-19h 8pm, 7.8°C S 10 km/h, overcast"
LABELS[21]="T-18h 9pm, 7.2°C S 8 km/h, broken clearing"
LABELS[22]="T-17h 10pm, 6.8°C SSW 6 km/h, broken clouds"
LABELS[23]="T-16h 11pm, 6.5°C SSW 5 km/h, broken clouds"

for h in 15 16 19 20 21 22 23; do
    echo "=== Sweep v1.0.$h ==="
    python3 sweep.py "$h"
    git add -u www/
    git commit -m "feat(sweep): v1.0.$h — ${LABELS[$h]}"
    echo "✓ v1.0.$h committed"
    echo
done

echo "Done! 8 backfill sweeps committed (v1.0.13 through v1.0.23)."
