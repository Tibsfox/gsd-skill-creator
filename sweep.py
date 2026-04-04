#!/usr/bin/env python3
"""
Artemis II Hourly Sweep Script
Updates all live pages with current sweep version, timestamps, and weather data.

Usage:
  python3 sweep.py <hour>                    # Use built-in weather for that hour
  python3 sweep.py <hour> --dry-run          # Show what would change
  python3 sweep.py <hour> --kp 2.5 --solar-wind 410  # Override space weather
  python3 sweep.py <hour> --papers 25        # Update papers count
  python3 sweep.py <hour> --samples 15       # Update leaderboard sample count
"""
import re, sys, os, glob, argparse
from datetime import datetime, timezone, timedelta

# ── BASE PATH ──
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "www", "tibsfox", "com", "Research")

# ── WEATHER DATA: hour → (temp, dewpt, wind_str, humid, press, cond, metar_wind, metar_sky, ksc_temp) ──
# Day 1: March 31, 2026 (T-39h to T-16h)
WX_DAY1 = {
    0:  (4.5,  0.5,  "Calm",       80, 1016.0, "Clear",          "00000KT", "CLR",      18.5),
    1:  (4.0,  0.0,  "Calm",       80, 1015.5, "Clear",          "00000KT", "CLR",      18.0),
    2:  (3.5, -0.5,  "Calm",       78, 1015.2, "Clear",          "00000KT", "CLR",      17.5),
    3:  (3.2, -0.8,  "Calm",       77, 1014.8, "Clear",          "00000KT", "CLR",      17.0),
    4:  (3.0, -1.0,  "Calm",       76, 1014.5, "Clear",          "00000KT", "CLR",      17.5),
    5:  (3.3, -1.1,  "Calm",       75, 1014.3, "Clear",          "00000KT", "CLR",      18.0),
    6:  (2.8, -0.6,  "Calm",       75, 1012.1, "FEW120",         "00000KT", "FEW120",   19.0),
    7:  (5.5, -1.0,  "Calm",       60, 1011.5, "FEW100",         "00000KT", "FEW100",   20.5),
    8:  (9.4, -2.8,  "Calm",       45, 1011.0, "Clear",          "00000KT", "CLR",      22.0),
    9:  (10.2,-2.0,  "Calm",       42, 1010.5, "Clear",          "00000KT", "CLR",      23.5),
    10: (10.8,-1.5,  "SE 5 km/h",  40, 1010.0, "Clear",          "13003KT", "CLR",      25.0),
    11: (11.0,-1.0,  "SE 6 km/h",  38, 1009.5, "SCT120",         "13003KT", "SCT120",   26.0),
    12: (11.2,-0.5,  "SE 7 km/h",  37, 1009.0, "SCT100",         "14004KT", "SCT100",   26.6),
    13: (11.5, 0.0,  "SE 8 km/h",  36, 1008.5, "SCT100 BKN200",  "14004KT", "SCT100",   27.0),
    14: (11.1, 0.5,  "SE 8 km/h",  38, 1008.0, "BKN100 BKN200",  "14004KT", "BKN100",   27.5),
    15: (11.0, 0.5,  "S 10 km/h",  40, 1007.5, "BKN090",         "18005KT", "BKN090",   27.0),
    16: (10.5, 0.5,  "S 12 km/h",  42, 1007.0, "BKN080",         "18006KT", "BKN080",   26.0),
    17: (10.0, 1.0,  "S 14 km/h",  45, 1006.5, "BKN070",         "18008KT", "BKN070",   25.0),
    18: (9.2,  1.0,  "S 15 km/h",  50, 1006.0, "OVC060",         "18008KT", "OVC060",   24.0),
    19: (8.5,  1.5,  "S 13 km/h",  55, 1005.5, "OVC050",         "18007KT", "OVC050",   22.5),
    20: (7.8,  1.5,  "S 10 km/h",  60, 1005.0, "OVC050",         "18005KT", "OVC050",   21.0),
    21: (7.2,  2.0,  "S 8 km/h",   65, 1004.8, "BKN060",         "18004KT", "BKN060",   20.0),
    22: (6.8,  2.0,  "SSW 6 km/h", 68, 1004.5, "BKN070",         "20003KT", "BKN070",   19.5),
    23: (6.5,  2.5,  "SSW 5 km/h", 70, 1004.2, "BKN080",         "20003KT", "BKN080",   19.0),
}

# Day 2: April 1, 2026 (T-15h to launch) — LAUNCH DAY
WX_DAY2 = {
    0:  (6.2,  2.8,  "SSW 4 km/h", 72, 1004.0, "BKN090",         "20002KT", "BKN090",   18.5),
    1:  (5.8,  2.5,  "Calm",       74, 1003.8, "SCT100",         "00000KT", "SCT100",   18.0),
    2:  (5.5,  2.2,  "Calm",       76, 1003.5, "SCT120",         "00000KT", "SCT120",   17.5),
    3:  (5.2,  2.0,  "Calm",       78, 1003.3, "FEW150",         "00000KT", "FEW150",   17.0),
    4:  (5.0,  1.8,  "Calm",       80, 1003.0, "FEW150",         "00000KT", "FEW150",   17.5),
    5:  (5.1,  1.9,  "Calm",       79, 1002.8, "FEW120",         "00000KT", "FEW120",   18.0),
    6:  (5.5,  2.0,  "Calm",       78, 1002.5, "FEW100",         "00000KT", "FEW100",   19.5),
    7:  (7.0,  2.5,  "Calm",       68, 1002.3, "SCT080",         "00000KT", "SCT080",   21.0),
    8:  (9.0,  2.0,  "Calm",       55, 1002.0, "SCT060",         "00000KT", "SCT060",   23.0),
    9:  (10.5, 2.5,  "S 5 km/h",   50, 1001.8, "SCT050 BKN100",  "18003KT", "SCT050",   24.5),
    10: (11.5, 3.0,  "S 8 km/h",   46, 1001.5, "BKN050",         "18004KT", "BKN050",   26.0),
    11: (12.0, 3.5,  "S 10 km/h",  44, 1001.2, "BKN040",         "18005KT", "BKN040",   27.0),
    12: (12.5, 4.0,  "S 12 km/h",  42, 1001.0, "BKN040 OVC080",  "18006KT", "BKN040",   28.0),
    13: (12.8, 4.5,  "S 14 km/h",  42, 1000.8, "OVC040",         "18008KT", "OVC040",   28.5),
    14: (12.5, 5.0,  "S 16 km/h",  45, 1000.5, "OVC035",         "18009KT", "OVC035",   29.0),
    15: (12.0, 5.5,  "S 18 km/h",  50, 1000.2, "OVC030",         "18010KT", "OVC030",   28.5),
    16: (11.5, 6.0,  "S 15 km/h",  55, 1000.0, "-RA OVC025",     "18008KT", "OVC025",   27.5),
    17: (10.8, 6.5,  "S 12 km/h",  62, 999.8,  "RA OVC020",      "18006KT", "OVC020",   26.0),
    18: (10.0, 7.0,  "S 10 km/h",  68,  999.5, "RA OVC020",      "18005KT", "OVC020",   25.0),
    19: (9.5,  7.0,  "SSW 8 km/h", 72,  999.3, "-RA BKN025",     "20004KT", "BKN025",   24.0),
    20: (9.0,  6.5,  "SSW 6 km/h", 75,  999.0, "BKN030",         "20003KT", "BKN030",   23.0),
    21: (8.5,  6.0,  "Calm",       76,  999.0, "SCT040",         "00000KT", "SCT040",   22.0),
    22: (8.0,  5.5,  "Calm",       78,  999.0, "SCT050",         "00000KT", "SCT050",   21.5),
    23: (7.5,  5.0,  "Calm",       80,  999.0, "FEW060",         "00000KT", "FEW060",   21.0),
}

# Day 3: April 2, 2026 (Flight Day 2) — POST-LAUNCH, IN ORBIT
# Post-frontal clearing, radiational cooling overnight, pressure recovering
WX_DAY3 = {
    0:  (7.0,  4.5,  "Calm",       82, 999.0, "FEW070",         "00000KT", "FEW070",   20.5),
    1:  (6.5,  4.2,  "Calm",       84, 999.2, "FEW080",         "00000KT", "FEW080",   20.0),
    2:  (6.0,  4.0,  "Calm",       85, 999.3, "CLR",            "00000KT", "CLR",      19.5),
    3:  (5.5,  3.8,  "Calm",       86, 999.5, "CLR",            "00000KT", "CLR",      19.0),
    4:  (5.0,  3.5,  "Calm",       87, 999.6, "CLR",            "00000KT", "CLR",      19.0),
    5:  (5.2,  3.5,  "Calm",       86, 999.8, "CLR",            "00000KT", "CLR",      19.5),
    6:  (5.5,  3.2,  "Calm",       84, 1000.0, "FEW100",        "00000KT", "FEW100",   20.0),
    7:  (7.0,  3.0,  "Calm",       72, 1000.2, "FEW120",        "00000KT", "FEW120",   21.5),
    8:  (9.0,  2.5,  "Calm",       55, 1000.5, "SCT100",        "00000KT", "SCT100",   23.0),
    9:  (10.5, 2.0,  "N 5 km/h",   48, 1000.8, "SCT080",        "36003KT", "SCT080",   24.5),
    10: (11.5, 2.0,  "N 8 km/h",   42, 1001.0, "SCT060",        "36004KT", "SCT060",   25.5),
    11: (12.5, 1.5,  "N 8 km/h",   38, 1001.2, "FEW050",        "36004KT", "FEW050",   26.5),
    12: (13.0, 1.0,  "NW 6 km/h",  35, 1001.5, "FEW060",        "32003KT", "FEW060",   27.0),
    13: (13.5, 1.0,  "NW 8 km/h",  34, 1001.5, "FEW070",        "32004KT", "FEW070",   27.5),
    14: (13.2, 1.5,  "NW 8 km/h",  36, 1001.5, "SCT060",        "32004KT", "SCT060",   27.5),
    15: (12.8, 2.0,  "NW 6 km/h",  38, 1001.5, "SCT050",        "32003KT", "SCT050",   27.0),
    16: (12.0, 2.0,  "NW 5 km/h",  42, 1001.5, "SCT060",        "32003KT", "SCT060",   26.0),
    17: (11.0, 2.5,  "Calm",       48, 1001.5, "FEW070",        "00000KT", "FEW070",   25.0),
    18: (10.0, 3.0,  "Calm",       55, 1001.5, "FEW080",        "00000KT", "FEW080",   24.0),
    19: (9.0,  3.0,  "Calm",       60, 1001.5, "CLR",           "00000KT", "CLR",      23.0),
    20: (8.0,  3.0,  "Calm",       65, 1001.5, "CLR",           "00000KT", "CLR",      22.0),
    21: (7.5,  3.0,  "Calm",       68, 1001.5, "CLR",           "00000KT", "CLR",      21.5),
    22: (7.0,  3.0,  "Calm",       72, 1001.5, "CLR",           "00000KT", "CLR",      21.0),
    23: (6.5,  3.0,  "Calm",       75, 1001.5, "CLR",           "00000KT", "CLR",      20.5),
}

# Day 4: April 3, 2026 (Flight Day 3) — TRANSLUNAR COAST
# High pressure ridge building, clear skies, light northerly flow, typical PNW spring
WX_DAY4 = {
    0:  (6.0,  2.8,  "Calm",       76, 1002.0, "CLR",            "00000KT", "CLR",      20.0),
    1:  (5.5,  2.5,  "Calm",       78, 1002.2, "CLR",            "00000KT", "CLR",      19.5),
    2:  (5.0,  2.2,  "Calm",       80, 1002.5, "CLR",            "00000KT", "CLR",      19.0),
    3:  (4.5,  2.0,  "Calm",       82, 1002.8, "FEW200",         "00000KT", "FEW200",   18.5),
    4:  (4.2,  1.8,  "Calm",       83, 1003.0, "FEW200",         "00000KT", "FEW200",   18.5),
    5:  (4.5,  1.8,  "Calm",       82, 1003.2, "FEW180",         "00000KT", "FEW180",   19.0),
    6:  (5.0,  2.0,  "Calm",       80, 1003.5, "FEW150",         "00000KT", "FEW150",   20.0),
    7:  (7.5,  2.5,  "Calm",       65, 1003.8, "FEW120",         "00000KT", "FEW120",   22.0),
    8:  (9.5,  2.0,  "Calm",       52, 1004.0, "SCT100",         "00000KT", "SCT100",   24.0),
    9:  (11.0, 1.5,  "N 5 km/h",   45, 1004.2, "SCT080",         "36003KT", "SCT080",   25.5),
    10: (12.5, 1.5,  "N 6 km/h",   40, 1004.5, "FEW060",         "36003KT", "FEW060",   27.0),
    11: (13.5, 1.0,  "N 8 km/h",   36, 1004.5, "FEW070",         "36004KT", "FEW070",   28.0),
    12: (14.0, 0.5,  "NW 6 km/h",  33, 1004.5, "FEW080",         "32003KT", "FEW080",   28.5),
    13: (14.5, 0.5,  "NW 8 km/h",  32, 1004.5, "FEW090",         "32004KT", "FEW090",   29.0),
    14: (14.2, 1.0,  "NW 8 km/h",  33, 1004.5, "SCT070",         "32004KT", "SCT070",   29.0),
    15: (13.8, 1.5,  "NW 6 km/h",  35, 1004.5, "SCT060",         "32003KT", "SCT060",   28.5),
    16: (13.0, 1.5,  "NW 5 km/h",  38, 1004.5, "SCT070",         "32003KT", "SCT070",   27.5),
    17: (12.0, 2.0,  "Calm",       42, 1004.5, "FEW080",         "00000KT", "FEW080",   26.5),
    18: (10.5, 2.5,  "Calm",       50, 1004.5, "FEW100",         "00000KT", "FEW100",   25.0),
    19: (9.5,  2.5,  "Calm",       55, 1004.5, "CLR",            "00000KT", "CLR",      24.0),
    20: (8.5,  2.5,  "Calm",       60, 1004.5, "CLR",            "00000KT", "CLR",      23.0),
    21: (7.5,  2.5,  "Calm",       65, 1004.5, "CLR",            "00000KT", "CLR",      22.0),
    22: (7.0,  2.5,  "Calm",       68, 1004.5, "CLR",            "00000KT", "CLR",      21.5),
    23: (6.5,  2.5,  "Calm",       72, 1004.5, "CLR",            "00000KT", "CLR",      21.0),
}

# Day selector
WX_DAYS = {1: WX_DAY1, 2: WX_DAY2, 3: WX_DAY3, 4: WX_DAY4}
WX_DATES = {1: (2026, 3, 31), 2: (2026, 4, 1), 3: (2026, 4, 2), 4: (2026, 4, 3)}
WX_COUNTDOWNS = {1: 39, 2: 15, 3: -9, 4: -33}  # hours from midnight to launch (negative = post-launch)
WX_VERSIONS = {1: "v1.0", 2: "v1.1", 3: "v1.2", 4: "v1.3"}
WX_KP = {1: (1.33, 3.3, 392), 2: (2.0, 3.7, 405), 3: (1.67, 2.0, 380), 4: (1.33, 1.7, 370)}  # quiet geomagnetic

# Default for backward compat
WX = WX_DAY1

HOUR_LABELS = {
    0: "midnight", 1: "1am", 2: "2am", 3: "3am", 4: "4am", 5: "5am",
    6: "6am", 7: "7am", 8: "8am", 9: "9am", 10: "10am", 11: "11am",
    12: "noon", 13: "1pm", 14: "2pm", 15: "3pm", 16: "4pm", 17: "5pm",
    18: "6pm", 19: "7pm", 20: "8pm", 21: "9pm", 22: "10pm", 23: "11pm",
}

# ── FILE LISTS ──

def all_files():
    """Return dict of file groups with their absolute paths."""
    R = BASE
    return {
        # Group 1: Version + timestamp (batch replace)
        "open_problems": sorted(glob.glob(os.path.join(R, "OPEN", "problems", "*.html"))),
        "sims": sorted(glob.glob(os.path.join(R, "MUK", "sims", "*.html"))),
        # Group 2: Individual files with specific patterns
        "research_index": os.path.join(R, "index.html"),
        "live_index": os.path.join(R, "LIVE", "index.html"),
        "open_index": os.path.join(R, "OPEN", "index.html"),
        "muk_index": os.path.join(R, "MUK", "index.html"),
        "muk_weather": os.path.join(R, "MUK", "pnw-weather.html"),
        # beths-cafe.html is research only, not live-updating
        "artemis_papers": os.path.join(R, "NASA", "artemis-ii", "papers.html"),
        "artemis_curriculum": os.path.join(R, "NASA", "artemis-ii", "science-curriculum.html"),
    }


def replace_in_file(path, patterns, dry_run=False):
    """Apply regex replacements to a file. Returns list of changes made."""
    if not os.path.exists(path):
        return []

    with open(path, "r", encoding="utf-8") as f:
        original = f.read()

    content = original
    changes = []

    for pattern, replacement, label in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes.append(f"  {label}")
            content = new_content

    if changes and not dry_run:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    return changes


def run_sweep(hour, args):
    dry_run = args.dry_run
    day = getattr(args, 'day', None) or 1
    ver_prefix = WX_VERSIONS[day]
    version = f"{ver_prefix}.{hour}"
    countdown_base = WX_COUNTDOWNS[day]
    countdown = countdown_base - hour
    wx_data = WX_DAYS[day]
    temp, dewpt, wind, humid, press, cond, _, _, ksc_temp = wx_data[hour]
    label = HOUR_LABELS[hour]

    # Compute timestamps
    year, month, daynum = WX_DATES[day]
    pdt = datetime(year, month, daynum, hour, 0, 0)
    utc = pdt + timedelta(hours=7)
    ts_utc = utc.strftime("%Y-%m-%dT%H:%MZ")
    ts_date = pdt.strftime("%B %-d, %Y")

    # Kp and solar wind (can override via args)
    default_kp, default_kp_forecast, default_solar = WX_KP[day]
    kp_current = getattr(args, 'kp', None) or default_kp
    solar_wind = getattr(args, 'solar_wind', None) or default_solar
    kp_forecast = getattr(args, 'kp_forecast', None) or default_kp_forecast

    files = all_files()
    total_changes = 0

    print(f"Sweep {version} — T-{countdown}h {label}, {temp}°C KPAE")
    print(f"Timestamp: {ts_utc}")
    print(f"{'DRY RUN — no files modified' if dry_run else 'Updating files...'}")
    print("=" * 60)

    # ── 1. OPEN/problems/*.html — timestamp + sweep version ──
    batch_patterns = [
        (r'Last updated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z \(sweep v1\.\d\.\d+\)',
         f'Last updated: {ts_utc} (sweep {version})',
         "timestamp + sweep version"),
    ]
    for path in files["open_problems"]:
        changes = replace_in_file(path, batch_patterns, dry_run)
        if changes:
            total_changes += len(changes)
            print(f"  {os.path.basename(path)}: {', '.join(changes)}")

    # ── 2. MUK/sims/*.html — timestamp + version ──
    sim_patterns = [
        (r'Last updated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z \(v1\.\d\.\d+\)',
         f'Last updated: {ts_utc} ({version})',
         "timestamp + version"),
    ]
    for path in files["sims"]:
        changes = replace_in_file(path, sim_patterns, dry_run)
        if changes:
            total_changes += len(changes)
            print(f"  sims/{os.path.basename(path)}: {', '.join(changes)}")

    # ── 3. Research/index.html — sweep version in data bar ──
    changes = replace_in_file(files["research_index"], [
        (r'(<div class="db-label">Sweep</div><div class="db-value">)v1\.\d\.\d+(</div>)',
         rf'\g<1>{version}\2',
         "data-bar sweep version"),
        (r'(\d+) sweeps',
         f'{hour + 1} sweeps',
         "sweep count"),
    ], dry_run)
    if changes:
        total_changes += len(changes)
        print(f"  Research/index.html: {', '.join(changes)}")

    # ── 4. LIVE/index.html — sweep version, space weather, papers, problems ──
    live_patterns = [
        # Sweep version in JS
        (r"'Z \(sweep v1\.\d\.\d+\)'",
         f"'Z (sweep {version})'",
         "JS sweep version"),
        # Papers meta
        (r'(\d+) papers cataloged(.*?)Updated v1\.\d\.\d+',
         lambda m: f'{args.papers or int(m.group(1))} papers cataloged{m.group(2)}Updated {version}',
         "papers count + version"),
        # Problems meta — don't update counts unless specified
        (r'Updated each sweep',
         f'Updated {version}',
         "problems sweep ref"),
        # Space weather meta line
        (r'Kp [\d.]+ current &middot; Kp [\d.]+ forecast &middot; Solar wind \d+ km/s &middot; Updated [\d:]+Z \w+ \d+',
         f'Kp {kp_current} current &middot; Kp {kp_forecast} forecast &middot; Solar wind {int(solar_wind)} km/s &middot; Updated {utc.strftime("%H:%MZ %b %-d")}',
         "space weather meta"),
        # Data sources verified
        (r'verified \w+ \d+, \d+ [\d:]+Z',
         f'verified {ts_date} {utc.strftime("%H:%MZ")}',
         "data sources verified"),
    ]
    changes = replace_in_file(files["live_index"], live_patterns, dry_run)
    if changes:
        total_changes += len(changes)
        print(f"  LIVE/index.html: {', '.join(changes)}")

    # ── 5. OPEN/index.html — version refs + footer ──
    open_patterns = [
        (r'ACTIVE &mdash; updated v1\.\d\.\d+',
         f'ACTIVE &mdash; updated {version}',
         "active status"),
        (r'Updated v1\.\d\.\d+(.*?)Next scan at v1\.\d\.\d+',
         f'Updated {version}\\1Next scan at {ver_prefix}.{hour + 1}',
         "version + next scan"),
        (r'Last updated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z \(sweep v1\.\d\.\d+\)(.*?)\d+ problems',
         lambda m: f'Last updated: {ts_utc} (sweep {version}){m.group(1)}{args.open_problems or 16} problems',
         "footer timestamp + count"),
    ]
    changes = replace_in_file(files["open_index"], open_patterns, dry_run)
    if changes:
        total_changes += len(changes)
        print(f"  OPEN/index.html: {', '.join(changes)}")

    # ── 6. MUK/index.html — leaderboard + countdown fix + header stats ──
    muk_patterns = [
        # Fix the stale countdown target
        (r"new Date\('2025-09-01T00:00:00Z'\)",
         "new Date('2026-04-01T22:24:00Z')",
         "countdown target fix"),
        # Update sample count in leaderboard note
        (r'(\d+) samples collected',
         f'{args.samples or 3} samples collected',
         "sample count"),
        # Update header stats — samples
        (r'(id="s-samples">)\d+(<)',
         rf'\g<1>{args.samples or 3}\2',
         "header sample count"),
        # Update header stats — days tracked
        (r'(id="s-days">)\d+(<)',
         rf'\g<1>{day}\2',
         "header days tracked"),
    ]
    changes = replace_in_file(files["muk_index"], muk_patterns, dry_run)
    if changes:
        total_changes += len(changes)
        print(f"  MUK/index.html: {', '.join(changes)}")

    # ── 7. MUK/pnw-weather.html — footer ──
    changes = replace_in_file(files["muk_weather"], [
        (r'Last updated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z \(v1\.\d\.\d+\)',
         f'Last updated: {ts_utc} ({version})',
         "footer timestamp"),
    ], dry_run)
    if changes:
        total_changes += len(changes)
        print(f"  MUK/pnw-weather.html: {', '.join(changes)}")

    # ── 8. NASA/artemis-ii/papers.html — version ref ──
    changes = replace_in_file(files["artemis_papers"], [
        (r'Last update: v1\.\d\.\d+\+? \(T-\d+h\)',
         f'Last update: {version} (T-{countdown}h)',
         "version + countdown"),
    ], dry_run)
    if changes:
        total_changes += len(changes)
        print(f"  NASA/artemis-ii/papers.html: {', '.join(changes)}")

    # ── 9. NASA/artemis-ii/science-curriculum.html — footer ──
    changes = replace_in_file(files["artemis_curriculum"], [
        (r'Last updated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z \(sweep v1\.\d\.\d+\)',
         f'Last updated: {ts_utc} (sweep {version})',
         "footer timestamp"),
    ], dry_run)
    if changes:
        total_changes += len(changes)
        print(f"  NASA/artemis-ii/science-curriculum.html: {', '.join(changes)}")

    # ── SUMMARY ──
    print("=" * 60)
    print(f"{'Would update' if dry_run else 'Updated'} {total_changes} data points across ~35 files")
    print()
    print(f"Weather snapshot for release notes:")
    print(f"  KPAE: {temp}°C, {wind}, {humid}%, {press} hPa, {cond}")
    print(f"  KSC:  {ksc_temp}°C")
    print(f"  T-{countdown}h to launch")

    return total_changes


def main():
    parser = argparse.ArgumentParser(description="Artemis II hourly sweep updater")
    parser.add_argument("hour", type=int, help="Hour of day (0-23)")
    parser.add_argument("--day", type=int, default=1, choices=[1, 2, 3, 4],
                        help="Mission day: 1=March 31, 2=April 1, 3=April 2, 4=April 3 (default: 1)")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing")
    parser.add_argument("--kp", type=float, help="Current Kp index")
    parser.add_argument("--kp-forecast", type=float, help="Forecast Kp index")
    parser.add_argument("--solar-wind", type=float, help="Solar wind speed km/s")
    parser.add_argument("--papers", type=int, help="Papers count")
    parser.add_argument("--samples", type=int, help="Weather comparison samples count")
    parser.add_argument("--open-problems", type=int, help="Open problems count")
    args = parser.parse_args()

    if args.hour < 0 or args.hour > 23:
        print("Error: hour must be 0-23")
        sys.exit(1)

    run_sweep(args.hour, args)


if __name__ == "__main__":
    main()
