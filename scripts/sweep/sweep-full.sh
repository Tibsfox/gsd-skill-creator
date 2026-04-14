#!/bin/bash
# Full sweep: weather data + status.json + research artifacts + commit + push
# Usage: ./sweep-full.sh <hour> <day>
set -e
cd "$(dirname "$0")"

HOUR=${1:?Usage: sweep-full.sh <hour> <day>}
DAY=${2:-2}

echo "=== Full Sweep: Day $DAY Hour $HOUR ==="

# 1. Run weather sweep across all pages
python3 sweep.py "$HOUR" --day "$DAY"

# 2. Update status.json
STATUS="www/tibsfox/com/Research/NASA/artemis-ii/status.json"
if [ -f "$STATUS" ]; then
    python3 -c "
import json, sys
from datetime import datetime, timedelta

hour = $HOUR
day = $DAY

# Load
with open('$STATUS') as f:
    s = json.load(f)

# Version + countdown
if day == 1:
    ver = f'v1.0.{hour}'
    countdown = 39 - hour
    pdt = datetime(2026, 3, 31, hour, 0, 0)
else:
    ver = f'v1.1.{hour}'
    countdown = 15 - hour
    pdt = datetime(2026, 4, 1, hour, 0, 0)

utc = pdt + timedelta(hours=7)
ts = utc.strftime('%Y-%m-%dT%H:%M:%SZ')

# Weather from sweep.py
from sweep import WX_DAYS, WX_KP, HOUR_LABELS
wx = WX_DAYS[day]
temp, dewpt, wind, humid, press, cond, metar_wind, metar_sky, ksc_temp = wx[hour]
kp, kp_fc, solar = WX_KP[day]
label = HOUR_LABELS[hour]

# Update status
s['updated'] = ts
s['source'] = f'sweep-{ver}'
s['mission']['status'] = f'Launch countdown — T-{countdown}h — {label} sweep, {temp}°C {wind}, {cond}'
s['weather']['kpae']['temp_c'] = temp
s['weather']['kpae']['humidity'] = humid
s['weather']['kpae']['pressure_hpa'] = press
s['weather']['kpae']['conditions'] = metar_sky
s['weather']['kxmr']['temp_c'] = ksc_temp
s['space_weather']['kp_index'] = kp
s['space_weather']['solar_wind_speed_kms'] = solar

# Add announcement
ann = {
    'time': ts,
    'text': f'{ver}: T-{countdown}h {label}. KPAE {temp}°C {wind}, {cond}. KSC {ksc_temp}°C.'
}
s['announcements'].insert(0, ann)

with open('$STATUS', 'w') as f:
    json.dump(s, f, indent=2)
    f.write('\n')

print(f'  status.json updated: {ver} T-{countdown}h')
"
fi

echo "=== Full sweep complete ==="
