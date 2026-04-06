#!/usr/bin/env python3
"""Artemis II Sweep Daemon — automated cadence management.

Runs continuously, executing actions at precise wall-clock intervals:
- :00 — hourly sweep (sweep.py), embed new pages, FTP sync
- :15 — sub-mark commit, concept extraction check
- :30 — sub-mark commit, NASA briefing check, ChromaDB sync
- :45 — sub-mark commit, drift detection

Timestamps:
  source_ts  — when the data source tagged the observation
  capture_ts — when we captured/scraped it (wall clock at execution)
  storage_ts — when we committed to DB/git (commit timestamp)

Usage:
  python3 sweep_daemon.py                    # Run daemon
  python3 sweep_daemon.py --dry-run          # Show what would happen
  python3 sweep_daemon.py --once             # Run one cycle and exit
  python3 sweep_daemon.py --status           # Show daemon state
  python3 sweep_daemon.py --day 5            # Override mission day
"""

import os
import sys
import json
import time
import subprocess
import argparse
from datetime import datetime, timezone, timedelta

# ── Configuration ──

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE_DIR, '.sweep-daemon-state.json')

# Mission parameters
MISSION_DAYS = {
    1: ('2026-03-31', 'v1.0'),
    2: ('2026-04-01', 'v1.1'),
    3: ('2026-04-02', 'v1.2'),
    4: ('2026-04-03', 'v1.3'),
    5: ('2026-04-04', 'v1.4'),
    6: ('2026-04-05', 'v1.5'),
    7: ('2026-04-06', 'v1.6'),
    8: ('2026-04-07', 'v1.7'),
    9: ('2026-04-08', 'v1.8'),
    10: ('2026-04-09', 'v1.9'),
}

# Sub-mark schedule: minute → actions
# Discovery engine runs at :30 on hours 0, 6, 12, 18 (every 6 hours)
DISCOVERY_HOURS = {0, 6, 12, 18}

SCHEDULE = {
    0:  ['sweep', 'embed', 'ftp_sync', 'commit'],
    15: ['concept_check', 'commit'],
    30: ['nasa_check', 'chroma_sync', 'discovery_check', 'commit'],
    45: ['drift_check', 'commit'],
}

# Peak cadence schedule: every 15 min gets full sweep + embed
# Used during lunar flyby window (Day 8, 06:00-18:00 EDT = 10:00-22:00 UTC)
PEAK_SCHEDULE = {
    0:  ['sweep', 'embed', 'ftp_sync', 'commit'],
    15: ['sweep', 'embed', 'concept_check', 'commit'],
    30: ['sweep', 'embed', 'nasa_check', 'chroma_sync', 'commit'],
    45: ['sweep', 'embed', 'drift_check', 'commit'],
}

# Peak cadence windows: (mission_day, start_hour_utc, end_hour_utc)
PEAK_WINDOWS = [
    (8, 10, 22),  # Day 8 (Apr 7): lunar flyby, 06:00-18:00 EDT
]

# NASA briefing playlist
NASA_PLAYLIST = 'PL2aBZuCeDwlSoxUrYsYWZr6NBTTKGir8U'


def is_peak_cadence(mission_day):
    """Check if current time falls within a peak cadence window."""
    now_utc = datetime.now(timezone.utc)
    hour_utc = now_utc.hour
    for day, start_h, end_h in PEAK_WINDOWS:
        if mission_day == day and start_h <= hour_utc < end_h:
            return True
    return False


def load_state():
    """Load daemon state from disk."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        'last_sweep_hour': -1,
        'last_mark_minute': -1,
        'last_sweep_day': 0,
        'marks_hit': 0,
        'marks_missed': 0,
        'sweeps_completed': 0,
        'errors': [],
        'started_at': None,
    }


def save_state(state):
    """Save daemon state atomically."""
    tmp = STATE_FILE + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(state, f, indent=2, default=str)
    os.replace(tmp, STATE_FILE)


def get_mission_day():
    """Determine current mission day from date."""
    today = datetime.now().strftime('%Y-%m-%d')
    for day, (date_str, _) in MISSION_DAYS.items():
        if date_str == today:
            return day
    return None


def run_cmd(cmd, dry_run=False, timeout=120):
    """Run a shell command, return (success, output)."""
    if dry_run:
        print(f"  [DRY RUN] {cmd}")
        return True, ""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True,
            timeout=timeout, cwd=BASE_DIR
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, f"TIMEOUT after {timeout}s"
    except Exception as e:
        return False, str(e)


def action_sweep(hour, day, dry_run=False):
    """Run hourly sweep."""
    cmd = f"python3 sweep.py {hour} --day {day} --samples 30 --open-problems 19"
    success, output = run_cmd(cmd, dry_run)
    if success:
        # Extract weather snapshot
        for line in output.split('\n'):
            if 'KPAE:' in line or 'KSC:' in line:
                print(f"    {line.strip()}")
    return success


def action_embed(dry_run=False):
    """Run incremental embedding (includes concept extraction + ChromaDB sync)."""
    cmd = "python3 embed_incremental.py"
    success, output = run_cmd(cmd, dry_run, timeout=300)
    if success:
        for line in output.split('\n'):
            if 'pages embedded' in line or 'concept' in line.lower() or 'chroma' in line.lower():
                print(f"    {line.strip()}")
    return success


def action_ftp_sync(dry_run=False):
    """Sync sweep-updated files to tibsfox.com."""
    cmd = """python3 -c "
import ftplib, os
env = {}
for line in open('.env'):
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        env[k.strip()] = v
host = env['FTP_HOST'].strip().strip('\\'\\\"')
user = env['FTP_USER'].strip().strip('\\'\\\"')
passwd = env['FTP_PASS']
ftp = ftplib.FTP(host, timeout=60)
ftp.login(user, passwd)
local_base = os.path.abspath('www/tibsfox/com/Research')
count = 0
ftp.cwd('/')
for f in ['index.html', 'series.js']:
    local = os.path.join(local_base, f)
    if os.path.exists(local):
        with open(local, 'rb') as fh:
            ftp.storbinary(f'STOR {f}', fh)
        count += 1
for subdir in ['OPEN/problems', 'LIVE', 'MUK/sims', 'MUK', 'NASA/artemis-ii']:
    local_dir = os.path.join(local_base, subdir)
    if not os.path.isdir(local_dir): continue
    try: ftp.cwd(f'/{subdir}')
    except: continue
    for item in os.listdir(local_dir):
        if not item.endswith('.html'): continue
        local_path = os.path.join(local_dir, item)
        try:
            need = ftp.size(item) != os.path.getsize(local_path)
        except: need = True
        if need:
            with open(local_path, 'rb') as fh:
                ftp.storbinary(f'STOR {item}', fh)
            count += 1
ftp.quit()
print(f'Synced {count} files')
" """
    success, output = run_cmd(cmd, dry_run, timeout=180)
    if success:
        for line in output.split('\n'):
            if 'Synced' in line:
                print(f"    {line.strip()}")
    return success


def action_commit(hour, minute, day, ver_prefix, dry_run=False):
    """Commit and push current state."""
    if minute == 0:
        mark = f"{ver_prefix}.{hour}"
    else:
        sub = minute // 15
        mark = f"{ver_prefix}.{hour}.{sub}"

    cmd = f'git add www/tibsfox/com/Research/ 2>/dev/null; git diff --cached --quiet || (git commit -m "feat(sweep): {mark} — auto-daemon, Day {day} hour {hour}:{minute:02d}" && git push origin artemis-ii 2>&1 | tail -1)'
    success, output = run_cmd(cmd, dry_run)
    return success


def action_nasa_check(dry_run=False):
    """Check if NASA FD4+ briefing is available."""
    cmd = f'yt-dlp --flat-playlist --print "%(id)s\\t%(title)s" "https://www.youtube.com/playlist?list={NASA_PLAYLIST}" --no-warnings --quiet 2>/dev/null | head -5'
    success, output = run_cmd(cmd, dry_run, timeout=30)
    if success:
        for line in output.strip().split('\n'):
            if 'Private' not in line and 'April' in line:
                print(f"    NEW BRIEFING: {line}")
                return True
    return False


def action_concept_check(dry_run=False):
    """Quick check if new concepts need extraction."""
    cmd = """python3 -c "
from db_config import DB_DSN
import psycopg2
conn = psycopg2.connect(DB_DSN)
cur = conn.cursor()
cur.execute('SELECT count(*) FROM artemis.research_pages')
pages = cur.fetchone()[0]
cur.execute('SELECT count(*) FROM artemis.concepts')
concepts = cur.fetchone()[0]
cur.execute('SELECT count(*) FROM artemis.concept_refs')
refs = cur.fetchone()[0]
print(f'{pages} pages, {concepts} concepts, {refs} refs')
conn.close()
" """
    success, output = run_cmd(cmd, dry_run, timeout=15)
    if success:
        print(f"    {output.strip()}")
    return success


def action_drift_check(dry_run=False):
    """Run lightweight drift detection."""
    cmd = "python3 drift_detector.py --content-only --json"
    success, output = run_cmd(cmd, dry_run, timeout=30)
    if success:
        try:
            data = json.loads(output)
            thin = data.get('content', {}).get('thin_count', 0)
            dupes = data.get('content', {}).get('dupe_count', 0)
            print(f"    Drift: {thin} thin pages, {dupes} near-duplicates")
        except json.JSONDecodeError:
            pass
    return success


def action_chroma_sync(dry_run=False):
    """Sync to ChromaDB backup."""
    cmd = "python3 chroma_backup.py"
    success, output = run_cmd(cmd, dry_run, timeout=120)
    if success:
        for line in output.split('\n'):
            if 'ChromaDB' in line:
                print(f"    {line.strip()}")
    return success


def action_discovery_check(dry_run=False):
    """Run research discovery engine (every 6 hours at :30)."""
    now = datetime.now()
    if now.hour not in DISCOVERY_HOURS:
        print(f"    Skipped (not a discovery hour, next at :{min(h for h in DISCOVERY_HOURS if h > now.hour) if any(h > now.hour for h in DISCOVERY_HOURS) else min(DISCOVERY_HOURS)}:30)")
        return True
    print(f"    Running discovery engine (6-hour cadence)...")
    cmd = "python3 discovery_engine.py"
    success, output = run_cmd(cmd, dry_run, timeout=300)
    if success:
        for line in output.split('\n'):
            if 'NEW:' in line or 'Total this run' in line or 'Appended' in line:
                print(f"    {line.strip()}")
    return success


def run_mark(hour, minute, day, ver_prefix, state, dry_run=False):
    """Execute all actions for a given mark."""
    schedule = PEAK_SCHEDULE if is_peak_cadence(day) else SCHEDULE
    actions = schedule.get(minute, [])
    if not actions:
        return

    now = datetime.now()
    mark_name = f"{ver_prefix}.{hour}" if minute == 0 else f"{ver_prefix}.{hour}.{minute // 15}"
    print(f"\n{'='*60}")
    print(f"[{now.strftime('%H:%M:%S %Z')}] Mark {mark_name} — Day {day}, hour {hour}:{minute:02d}")
    print(f"{'='*60}")

    for action_name in actions:
        print(f"  → {action_name}")
        try:
            if action_name == 'sweep':
                action_sweep(hour, day, dry_run)
            elif action_name == 'embed':
                action_embed(dry_run)
            elif action_name == 'ftp_sync':
                action_ftp_sync(dry_run)
            elif action_name == 'commit':
                action_commit(hour, minute, day, ver_prefix, dry_run)
            elif action_name == 'nasa_check':
                action_nasa_check(dry_run)
            elif action_name == 'concept_check':
                action_concept_check(dry_run)
            elif action_name == 'drift_check':
                action_drift_check(dry_run)
            elif action_name == 'chroma_sync':
                action_chroma_sync(dry_run)
            elif action_name == 'discovery_check':
                action_discovery_check(dry_run)
        except Exception as e:
            print(f"    ERROR: {e}")
            state['errors'].append({'time': str(now), 'action': action_name, 'error': str(e)})

    state['marks_hit'] += 1
    if minute == 0:
        state['sweeps_completed'] += 1
    state['last_sweep_hour'] = hour
    state['last_mark_minute'] = minute
    save_state(state)


def daemon_loop(day_override=None, dry_run=False, once=False):
    """Main daemon loop — runs until interrupted."""
    state = load_state()
    state['started_at'] = str(datetime.now())
    save_state(state)

    print(f"Sweep Daemon started at {datetime.now().strftime('%H:%M:%S %Z')}")
    print(f"Schedule: {', '.join(f':{m:02d}' for m in sorted(SCHEDULE.keys()))}")
    print(f"Peak windows: {', '.join(f'Day {d} {s:02d}:00-{e:02d}:00 UTC' for d, s, e in PEAK_WINDOWS)}")
    print(f"Dry run: {dry_run}")

    last_executed = -1
    last_day = None

    while True:
        now = datetime.now()
        minute = now.minute
        hour = now.hour

        # Determine mission day from wall clock (--day override only for testing)
        day = day_override or get_mission_day()
        if day is None:
            print(f"[{now.strftime('%H:%M')}] No mission day for {now.strftime('%Y-%m-%d')} — sleeping")
            time.sleep(60)
            continue

        # Day boundary: reset tracking when day changes
        if last_day is not None and day != last_day:
            print(f"\n{'='*60}")
            print(f"DAY BOUNDARY: Day {last_day} → Day {day}")
            print(f"{'='*60}")
            last_executed = -1
            state['last_sweep_hour'] = -1
            state['last_mark_minute'] = -1
            save_state(state)
        last_day = day

        ver_prefix = MISSION_DAYS[day][1]

        # Check if we're at a scheduled mark and haven't already executed it
        mark_key = day * 10000 + hour * 100 + minute
        active_schedule = PEAK_SCHEDULE if is_peak_cadence(day) else SCHEDULE
        if minute in active_schedule and mark_key != last_executed:
            run_mark(hour, minute, day, ver_prefix, state, dry_run)
            last_executed = mark_key

            if once:
                print("\n--once mode: exiting after one cycle")
                return

        # Sleep until next check (poll every 60 seconds)
        time.sleep(60)


def show_status():
    """Show daemon state."""
    state = load_state()
    print("Sweep Daemon Status")
    print(f"  Started: {state.get('started_at', 'never')}")
    print(f"  Marks hit: {state.get('marks_hit', 0)}")
    print(f"  Marks missed: {state.get('marks_missed', 0)}")
    print(f"  Sweeps completed: {state.get('sweeps_completed', 0)}")
    print(f"  Last sweep hour: {state.get('last_sweep_hour', -1)}")
    print(f"  Last mark minute: {state.get('last_mark_minute', -1)}")
    print(f"  Errors: {len(state.get('errors', []))}")
    for err in state.get('errors', [])[-5:]:
        print(f"    {err['time']}: {err['action']} — {err['error']}")


def main():
    parser = argparse.ArgumentParser(description="Artemis II Sweep Daemon")
    parser.add_argument("--dry-run", action="store_true", help="Show actions without executing")
    parser.add_argument("--once", action="store_true", help="Run one cycle and exit")
    parser.add_argument("--status", action="store_true", help="Show daemon state")
    parser.add_argument("--day", type=int, help="Override mission day (1-10)")
    args = parser.parse_args()

    if args.status:
        show_status()
        return

    try:
        daemon_loop(day_override=args.day, dry_run=args.dry_run, once=args.once)
    except KeyboardInterrupt:
        print("\nDaemon stopped by user")
        state = load_state()
        save_state(state)


if __name__ == "__main__":
    main()
