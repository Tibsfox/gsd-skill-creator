#!/usr/bin/env python3
"""
nasa-csv-path-y-reconciliation.py — one-shot CSV renumber per Path Y.

Background: live NASA index 1.66 = Pioneer 9 (Nov-1968) + 1.67 = OAO-2 (Dec-1968)
diverged from CSV during v1.49.582 + v1.49.586 ship cycles (thematic prioritization
chose richer subjects over strict chronology). OAO-2 was missing from CSV entirely.

Path Y reconciliation per user direction 2026-04-29:
  1. Rewrite row 1.66: SURVEYOR-7 → PIONEER-9 (matches shipped v1.49.583)
  2. Rewrite row 1.67: APOLLO-5 → OAO-2 STARGAZER (matches shipped v1.49.586; new content)
  3. Surveyor 7 → row 1.68
  4. Apollo 5 → row 1.69
  5. Apollo 6 → row 1.70
  6. Apollo 7 → row 1.71
  7. Old 1.70 (Pioneer 9) is removed (now at 1.66)
  8. Old 1.71+ rows shift +1 (Apollo 8 → 1.72, etc.)

After this milestone, version-order = chronological-order resumes from 1.72.

Idempotent: detects prior application via 1.66 = PIONEER-9 marker and exits no-op.
Atomic: writes to <csv>.tmp then renames; on any error preserves original.
"""

import csv
import os
import shutil
import sys
from datetime import date

CSV_PATH = "www/tibsfox/com/Research/NASA/catalog/nasa_master_mission_catalog_expanded.csv"

# Old → New version map for the affected band
RENUMBER = {
    "1.66": "1.68",  # SURVEYOR-7 moves down 2 (because Pioneer 9 took 1.66, OAO-2 took 1.67)
    "1.67": "1.69",  # APOLLO-5 moves down 2
    "1.68": "1.70",  # APOLLO-6 moves down 2
    "1.69": "1.71",  # APOLLO-7 moves down 2
    "1.70": "1.66",  # PIONEER-9 moves UP to where it actually shipped
    # Old 1.71+ all shift +1 (handled programmatically below)
}

# New row at 1.67: OAO-2 Stargazer (was missing from CSV)
OAO2_ROW = {
    "version": "1.67",
    "mission_code": "OAO-2",
    "mission_name": "OAO-2 Stargazer",
    "start_date": "1968-12-07",
    "end_date": "1973-02-13",
    "mission_type": "astronomical-observatory",
    "program": "OAO",
    "epoch": "1",
    "status": "complete",
    "notes": "First successful Orbiting Astronomical Observatory; UV photometry 1500-3000 angstrom; ~5,000-star catalog (Code et al. 1970-1980); SAO Celescope + UW WEP instruments; 4y2mo continuous observations; cooling failure ended mission; founding-instance space-UV catalog referenced by IUE/Hubble/GALEX",
}


def shift_above(version_str, threshold_old="1.71"):
    """Shift versions >= threshold_old by +1. Returns new version string."""
    v_parts = version_str.split(".")
    if len(v_parts) != 2:
        return version_str  # unrecognized format, leave alone
    major, minor = v_parts
    if major != "1":
        return version_str
    try:
        minor_int = int(minor)
    except ValueError:
        return version_str
    threshold_minor = int(threshold_old.split(".")[1])
    if minor_int >= threshold_minor:
        return f"{major}.{minor_int + 1}"
    return version_str


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_full = os.path.join(repo_root, CSV_PATH)
    if not os.path.isfile(csv_full):
        print(f"FATAL: CSV not found at {csv_full}", file=sys.stderr)
        return 1

    # Load all rows
    with open(csv_full, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if not fieldnames or "version" not in fieldnames:
        print("FATAL: CSV missing 'version' column", file=sys.stderr)
        return 1

    # Idempotency check: if 1.66 already PIONEER-9, we've already applied
    by_version = {r["version"]: r for r in rows}
    if "1.66" in by_version and by_version["1.66"].get("mission_code") == "PIONEER-9":
        print(f"  [no-op] CSV already reconciled (1.66 = PIONEER-9 detected); idempotent skip")
        return 0

    # Sanity: confirm starting state
    if by_version.get("1.66", {}).get("mission_code") != "SURVEYOR-7":
        print(f"FATAL: expected 1.66 = SURVEYOR-7 in starting state; got {by_version.get('1.66', {}).get('mission_code')}", file=sys.stderr)
        return 1

    # Apply renumbering
    new_rows = []
    seen_versions = set()
    for r in rows:
        v = r["version"]
        if v in RENUMBER:
            new_v = RENUMBER[v]
        else:
            new_v = shift_above(v, threshold_old="1.71")
        # Guard: prevent dup version emission
        if new_v in seen_versions:
            print(f"FATAL: duplicate version {new_v} would be emitted (from old {v})", file=sys.stderr)
            return 1
        seen_versions.add(new_v)
        new_row = dict(r)
        new_row["version"] = new_v
        new_rows.append(new_row)

    # Insert OAO-2 row at 1.67
    new_rows.append(OAO2_ROW)

    # Sort by version using natural-sort key (1.6 < 1.66 < 1.7)
    def vkey(row):
        v = row["version"]
        parts = v.split(".")
        if len(parts) != 2:
            return (0, 0)
        try:
            return (int(parts[0]), int(parts[1]))
        except ValueError:
            return (0, 0)

    new_rows.sort(key=vkey)

    # Verify post-state expectations
    by_v_new = {r["version"]: r for r in new_rows}
    expected = [
        ("1.66", "PIONEER-9"),
        ("1.67", "OAO-2"),
        ("1.68", "SURVEYOR-7"),
        ("1.69", "APOLLO-5"),
        ("1.70", "APOLLO-6"),
        ("1.71", "APOLLO-7"),
        ("1.72", "APOLLO-8"),
    ]
    for v, code in expected:
        actual = by_v_new.get(v, {}).get("mission_code")
        if actual != code:
            print(f"FATAL: post-renumber check failed at {v}: expected {code}, got {actual}", file=sys.stderr)
            return 1

    # Write atomically
    csv_tmp = csv_full + ".tmp"
    with open(csv_tmp, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in new_rows:
            writer.writerow(r)

    # Backup before rename
    csv_bak = csv_full + f".bak.{date.today().isoformat()}"
    shutil.copy2(csv_full, csv_bak)
    os.replace(csv_tmp, csv_full)

    print(f"  [done] CSV reconciled: {len(rows)} rows in → {len(new_rows)} rows out (+1 for OAO-2)")
    print(f"  [backup] {csv_bak}")
    print(f"  [post-state]")
    for v, _ in expected:
        r = by_v_new[v]
        print(f"    {v}: {r['mission_code']} ({r['start_date']}) — {r['mission_name']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
