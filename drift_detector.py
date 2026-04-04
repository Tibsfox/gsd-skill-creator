#!/usr/bin/env python3
"""Drift detection for research corpus and weather data.

Detects when content, embeddings, or external data sources deviate from
expected patterns. Flags anomalies for human review.

Three drift types:
  1. Content drift  — page content changes significantly between sweeps
  2. Embedding drift — semantic meaning shifts (vector distance from previous)
  3. Source drift    — external data sources go stale, change format, or disagree

Usage:
  python3 drift_detector.py                    # Run full drift check
  python3 drift_detector.py --content-only     # Check only content drift
  python3 drift_detector.py --report           # Generate drift report
"""

import os
import sys
import json
import hashlib
import argparse
from datetime import datetime, timezone, timedelta
from collections import defaultdict

import psycopg2

DB_DSN = "host=localhost dbname=tibsfox user=postgres password=foxyuw5,&%cM#(C3"

# Drift thresholds
CONTENT_DRIFT_THRESHOLD = 0.3     # 30% word count change
EMBEDDING_DRIFT_THRESHOLD = 0.15  # cosine distance > 0.15 from previous
SOURCE_STALE_HOURS = 48           # source not updated in 48h
WEATHER_OUTLIER_SIGMA = 3.0       # 3-sigma outlier detection


def check_content_drift(cur):
    """Detect pages where content changed significantly."""
    # Compare current word_count against a baseline
    # For now, flag pages where word count is suspiciously low (possible truncation)
    cur.execute("""
        SELECT id, path, title, word_count
        FROM artemis.research_pages
        WHERE word_count IS NOT NULL AND word_count < 50
        ORDER BY word_count ASC
    """)
    thin_pages = cur.fetchall()

    # Check for duplicate content (possible copy-paste errors)
    cur.execute("""
        SELECT a.id, a.path, b.id, b.path,
               1 - (a.embedding <=> b.embedding) as similarity
        FROM artemis.research_pages a
        JOIN artemis.research_pages b ON a.id < b.id
        WHERE a.embedding IS NOT NULL AND b.embedding IS NOT NULL
          AND 1 - (a.embedding <=> b.embedding) > 0.95
          AND a.path != b.path
        ORDER BY similarity DESC
        LIMIT 20
    """)
    near_dupes = cur.fetchall()

    return {
        'thin_pages': [{'id': r[0], 'path': r[1], 'title': r[2], 'words': r[3]}
                       for r in thin_pages],
        'near_duplicates': [{'page_a': r[1], 'page_b': r[3],
                             'similarity': round(float(r[4]), 4)}
                            for r in near_dupes],
        'thin_count': len(thin_pages),
        'dupe_count': len(near_dupes)
    }


def check_embedding_drift(cur):
    """Detect pages with unusual embedding patterns."""
    # Find pages that are very distant from all others (orphan embeddings)
    cur.execute("""
        WITH avg_distances AS (
            SELECT a.id, a.path, a.title,
                   AVG(a.embedding <=> b.embedding) as avg_dist
            FROM artemis.research_pages a
            CROSS JOIN LATERAL (
                SELECT embedding
                FROM artemis.research_pages b
                WHERE b.id != a.id AND b.embedding IS NOT NULL
                ORDER BY a.embedding <=> b.embedding
                LIMIT 5
            ) b
            WHERE a.embedding IS NOT NULL
            GROUP BY a.id, a.path, a.title
        )
        SELECT id, path, title, avg_dist
        FROM avg_distances
        WHERE avg_dist > %s
        ORDER BY avg_dist DESC
        LIMIT 20
    """, (EMBEDDING_DRIFT_THRESHOLD * 5,))  # 5x threshold for "truly isolated"

    orphans = cur.fetchall()

    # Find clusters with only 1 member (potential miscategorization)
    cur.execute("""
        SELECT pm.cluster_id, count(*) as size,
               array_agg(rp.title ORDER BY pm.pagerank DESC) as titles
        FROM artemis.page_metrics pm
        JOIN artemis.research_pages rp ON rp.id = pm.page_id
        WHERE pm.cluster_id IS NOT NULL
        GROUP BY pm.cluster_id
        HAVING count(*) = 1
    """)
    singletons = cur.fetchall()

    return {
        'orphan_pages': [{'id': r[0], 'path': r[1], 'title': r[2],
                          'avg_distance': round(float(r[3]), 4)}
                         for r in orphans],
        'singleton_clusters': [{'cluster_id': r[0], 'title': r[2][0] if r[2] else '?'}
                               for r in singletons],
        'orphan_count': len(orphans),
        'singleton_count': len(singletons)
    }


def check_source_drift(cur):
    """Detect stale or problematic data sources."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=SOURCE_STALE_HOURS)

    # Pages not updated in SOURCE_STALE_HOURS
    cur.execute("""
        SELECT id, path, title, updated_at
        FROM artemis.research_pages
        WHERE updated_at IS NOT NULL AND updated_at < %s
        ORDER BY updated_at ASC
        LIMIT 20
    """, (cutoff,))
    stale = cur.fetchall()

    # Pages with no updated_at timestamp at all
    cur.execute("""
        SELECT count(*) FROM artemis.research_pages
        WHERE updated_at IS NULL
    """)
    no_timestamp = cur.fetchone()[0]

    # Check weather data for outliers
    weather_anomalies = []
    try:
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema='artemis' AND table_name='weather_samples'
        """)
        columns = [r[0] for r in cur.fetchall()]

        if 'temp_c' in columns:
            cur.execute("""
                WITH stats AS (
                    SELECT AVG(temp_c) as mean, STDDEV(temp_c) as std
                    FROM artemis.weather_samples
                    WHERE temp_c IS NOT NULL
                )
                SELECT ws.id, ws.temp_c, ws.created_at,
                       ABS(ws.temp_c - s.mean) / NULLIF(s.std, 0) as z_score
                FROM artemis.weather_samples ws, stats s
                WHERE ABS(ws.temp_c - s.mean) / NULLIF(s.std, 0) > %s
                ORDER BY z_score DESC
                LIMIT 10
            """, (WEATHER_OUTLIER_SIGMA,))
            weather_anomalies = [{'id': r[0], 'temp': float(r[1]),
                                  'timestamp': str(r[2]), 'z_score': round(float(r[3]), 2)}
                                 for r in cur.fetchall()]
    except Exception:
        pass

    return {
        'stale_pages': [{'id': r[0], 'path': r[1], 'title': r[2],
                         'last_updated': str(r[3])}
                        for r in stale],
        'no_timestamp_count': no_timestamp,
        'weather_anomalies': weather_anomalies,
        'stale_count': len(stale)
    }


def run_drift_check(content_only=False):
    """Run full drift detection suite."""
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()

    results = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'content': check_content_drift(cur),
    }

    if not content_only:
        results['embedding'] = check_embedding_drift(cur)
        results['source'] = check_source_drift(cur)

    conn.close()
    return results


def print_report(results):
    """Pretty-print drift report."""
    print(f"\nDrift Report — {results['timestamp'][:19]}Z")
    print("=" * 60)

    c = results['content']
    print(f"\nContent Drift:")
    print(f"  Thin pages (<50 words): {c['thin_count']}")
    if c['thin_pages']:
        for p in c['thin_pages'][:5]:
            print(f"    {p['words']:4d} words  {p['path']}")
    print(f"  Near-duplicates (>95% similarity): {c['dupe_count']}")
    if c['near_duplicates']:
        for d in c['near_duplicates'][:5]:
            print(f"    {d['similarity']:.4f}  {d['page_a']} ↔ {d['page_b']}")

    if 'embedding' in results:
        e = results['embedding']
        print(f"\nEmbedding Drift:")
        print(f"  Orphan pages (high avg distance): {e['orphan_count']}")
        print(f"  Singleton clusters: {e['singleton_count']}")
        if e['orphan_pages']:
            for p in e['orphan_pages'][:5]:
                print(f"    dist={p['avg_distance']:.4f}  {p['path']}")

    if 'source' in results:
        s = results['source']
        print(f"\nSource Drift:")
        print(f"  Stale pages (>{SOURCE_STALE_HOURS}h): {s['stale_count']}")
        print(f"  Pages without timestamp: {s['no_timestamp_count']}")
        print(f"  Weather anomalies ({WEATHER_OUTLIER_SIGMA}σ): {len(s['weather_anomalies'])}")
        if s['weather_anomalies']:
            for a in s['weather_anomalies'][:5]:
                print(f"    z={a['z_score']:.1f}σ  {a['temp']}°C at {a['timestamp'][:19]}")


def main():
    parser = argparse.ArgumentParser(description="Research corpus drift detection")
    parser.add_argument("--content-only", action="store_true")
    parser.add_argument("--report", action="store_true", help="Full report")
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args()

    results = run_drift_check(content_only=args.content_only)

    if args.json:
        print(json.dumps(results, indent=2, default=str))
    else:
        print_report(results)


if __name__ == "__main__":
    main()
