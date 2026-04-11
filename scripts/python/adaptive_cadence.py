#!/usr/bin/env python3
"""Adaptive sweep cadence — adjusts data collection frequency based on change rate.

Monitors weather data variance, page update frequency, and external source
activity to recommend whether the next sweep should be early, on-time, or delayed.

Three timestamp layers tracked per observation:
  1. source_ts  — when the source originally tagged the data (METAR obs time)
  2. capture_ts — when we observed/scraped it (our wall clock at capture)
  3. storage_ts — when we committed it to DB/git (commit timestamp)

Usage:
  python3 adaptive_cadence.py                     # Check current cadence recommendation
  python3 adaptive_cadence.py --history            # Show cadence history
  python3 adaptive_cadence.py --set-interval 15    # Override interval (minutes)
"""

import os
import sys
import json
import argparse
from datetime import datetime, timezone, timedelta

import psycopg2

from db_config import DB_DSN
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cadence-state.json')

# Cadence parameters
DEFAULT_INTERVAL_MINUTES = 15
MIN_INTERVAL_MINUTES = 10
MAX_INTERVAL_MINUTES = 30

# Thresholds for cadence adjustment
TEMP_CHANGE_FAST = 2.0      # °C change triggers faster cadence
PRESS_CHANGE_FAST = 2.0     # hPa change triggers faster cadence
WIND_CHANGE_FAST = 15.0     # km/h change triggers faster cadence
PAGE_UPDATE_FAST = 10       # pages updated in last hour triggers faster cadence


def load_state():
    """Load cadence state from disk."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        'current_interval': DEFAULT_INTERVAL_MINUTES,
        'last_sweep_ts': None,
        'history': [],
        'adjustments': []
    }


def save_state(state):
    """Save cadence state to disk."""
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2, default=str)


def get_weather_variance(cur, hours=2):
    """Check weather data variance over recent samples.

    Returns dict with change rates for key metrics.
    Tracks source timestamps (when observation was made at station)
    vs capture timestamps (when we stored them).
    """
    cur.execute("""
        SELECT temp_c, pressure_hpa, wind_speed_kmh,
               observed_at, created_at
        FROM artemis.weather_samples
        ORDER BY created_at DESC
        LIMIT %s
    """, (hours * 4,))  # ~4 samples per hour
    rows = cur.fetchall()

    if len(rows) < 2:
        return {
            'temp_range': 0, 'press_range': 0, 'wind_range': 0,
            'samples': len(rows),
            'max_source_lag_minutes': 0,
            'recommendation': 'normal'
        }

    temps = [r[0] for r in rows if r[0] is not None]
    pressures = [r[1] for r in rows if r[1] is not None]
    winds = [r[2] for r in rows if r[2] is not None]

    # Calculate source-to-capture lag
    lags = []
    for r in rows:
        if r[3] and r[4]:  # observed_at, created_at
            lag = (r[4] - r[3]).total_seconds() / 60
            lags.append(lag)

    temp_range = max(temps) - min(temps) if temps else 0
    press_range = max(pressures) - min(pressures) if pressures else 0
    wind_range = max(winds) - min(winds) if winds else 0
    max_lag = max(lags) if lags else 0

    # Determine recommendation
    if temp_range > TEMP_CHANGE_FAST or press_range > PRESS_CHANGE_FAST or wind_range > WIND_CHANGE_FAST:
        rec = 'faster'
    elif temp_range < TEMP_CHANGE_FAST / 3 and press_range < PRESS_CHANGE_FAST / 3:
        rec = 'slower'
    else:
        rec = 'normal'

    return {
        'temp_range': round(temp_range, 1),
        'press_range': round(press_range, 1),
        'wind_range': round(wind_range, 1),
        'samples': len(rows),
        'max_source_lag_minutes': round(max_lag, 1),
        'recommendation': rec
    }


def get_page_activity(cur, hours=1):
    """Check how many pages were updated recently."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    cur.execute("""
        SELECT count(*) FROM artemis.research_pages
        WHERE updated_at > %s
    """, (cutoff,))
    count = cur.fetchone()[0]

    return {
        'pages_updated': count,
        'window_hours': hours,
        'recommendation': 'faster' if count > PAGE_UPDATE_FAST else 'normal'
    }


def compute_next_interval(weather, activity, state):
    """Determine the next sweep interval based on all signals."""
    current = state['current_interval']

    # Count votes
    votes = {'faster': 0, 'normal': 0, 'slower': 0}
    votes[weather['recommendation']] += 2  # Weather gets double weight
    votes[activity['recommendation']] += 1

    if votes['faster'] > votes['slower']:
        new_interval = max(MIN_INTERVAL_MINUTES, current - 5)
        reason = 'high variance detected'
    elif votes['slower'] > votes['faster']:
        new_interval = min(MAX_INTERVAL_MINUTES, current + 5)
        reason = 'low variance, extending interval'
    else:
        new_interval = DEFAULT_INTERVAL_MINUTES
        reason = 'nominal conditions'

    return new_interval, reason


def recommend(args=None):
    """Main cadence check — returns recommendation."""
    state = load_state()
    now = datetime.now(timezone.utc)

    try:
        conn = psycopg2.connect(DB_DSN)
        cur = conn.cursor()

        # Check if weather_samples table has the expected columns
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema='artemis' AND table_name='weather_samples'
        """)
        columns = [r[0] for r in cur.fetchall()]

        if 'temp_c' in columns and 'pressure_hpa' in columns:
            weather = get_weather_variance(cur)
        else:
            weather = {'temp_range': 0, 'press_range': 0, 'wind_range': 0,
                       'samples': 0, 'max_source_lag_minutes': 0, 'recommendation': 'normal'}

        activity = get_page_activity(cur)
        conn.close()
    except Exception as e:
        weather = {'recommendation': 'normal', 'samples': 0, 'error': str(e)}
        activity = {'recommendation': 'normal', 'pages_updated': 0}

    new_interval, reason = compute_next_interval(weather, activity, state)

    # Update state
    state['current_interval'] = new_interval
    state['history'].append({
        'timestamp': now.isoformat(),
        'interval': new_interval,
        'reason': reason,
        'weather': weather,
        'activity': activity
    })
    # Keep last 100 entries
    state['history'] = state['history'][-100:]
    save_state(state)

    return {
        'recommended_interval': new_interval,
        'reason': reason,
        'weather': weather,
        'activity': activity,
        'timestamp': now.isoformat()
    }


def main():
    parser = argparse.ArgumentParser(description="Adaptive sweep cadence")
    parser.add_argument("--history", action="store_true", help="Show cadence history")
    parser.add_argument("--set-interval", type=int, help="Override interval (minutes)")
    args = parser.parse_args()

    if args.history:
        state = load_state()
        for entry in state['history'][-20:]:
            ts = entry.get('timestamp', '?')[:19]
            interval = entry.get('interval', '?')
            reason = entry.get('reason', '?')
            print(f"  {ts}  {interval}m  {reason}")
        return

    if args.set_interval:
        state = load_state()
        state['current_interval'] = max(MIN_INTERVAL_MINUTES,
                                         min(MAX_INTERVAL_MINUTES, args.set_interval))
        save_state(state)
        print(f"Interval set to {state['current_interval']}m")
        return

    result = recommend()
    print(f"Cadence: {result['recommended_interval']}m ({result['reason']})")
    print(f"  Weather: temp±{result['weather'].get('temp_range', 0)}°C, "
          f"press±{result['weather'].get('press_range', 0)}hPa, "
          f"{result['weather'].get('samples', 0)} samples")
    print(f"  Activity: {result['activity'].get('pages_updated', 0)} pages updated in 1h")
    if result['weather'].get('max_source_lag_minutes', 0) > 0:
        print(f"  Source lag: {result['weather']['max_source_lag_minutes']}m max")


if __name__ == "__main__":
    main()
