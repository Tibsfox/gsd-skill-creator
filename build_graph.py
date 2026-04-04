#!/usr/bin/env python3
"""Build cross-reference graph from HTML links + semantic similarity.

Creates knowledge graph tables in pgvector, parses HTML for internal links,
adds semantic similarity edges, computes PageRank and community metrics.

Usage:
  python3 build_graph.py              # Full build
  python3 build_graph.py --skip-schema  # Skip table creation
  python3 build_graph.py --stats-only   # Just print graph stats
"""

import os
import re
import sys
import time
import argparse
from datetime import datetime, timezone
from urllib.parse import unquote
import psycopg2
from bs4 import BeautifulSoup
import networkx as nx

from db_config import DB_DSN
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "www", "tibsfox", "com", "Research")


def create_schema(cur):
    """Create knowledge graph tables if they don't exist."""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS artemis.concepts (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            category TEXT,
            canonical_page_id INTEGER REFERENCES artemis.research_pages(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS artemis.concept_refs (
            id SERIAL PRIMARY KEY,
            concept_id INTEGER REFERENCES artemis.concepts(id),
            page_id INTEGER REFERENCES artemis.research_pages(id),
            ref_type TEXT NOT NULL,
            context TEXT,
            UNIQUE(concept_id, page_id, ref_type)
        );

        CREATE TABLE IF NOT EXISTS artemis.page_links (
            id SERIAL PRIMARY KEY,
            source_page_id INTEGER REFERENCES artemis.research_pages(id),
            target_page_id INTEGER REFERENCES artemis.research_pages(id),
            link_text TEXT,
            UNIQUE(source_page_id, target_page_id)
        );

        CREATE TABLE IF NOT EXISTS artemis.annotations (
            id SERIAL PRIMARY KEY,
            page_id INTEGER REFERENCES artemis.research_pages(id),
            label TEXT NOT NULL,
            note TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS artemis.page_metrics (
            page_id INTEGER PRIMARY KEY REFERENCES artemis.research_pages(id),
            pagerank FLOAT DEFAULT 0,
            in_degree INTEGER DEFAULT 0,
            out_degree INTEGER DEFAULT 0,
            cluster_id INTEGER,
            hub_score FLOAT DEFAULT 0,
            authority_score FLOAT DEFAULT 0,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    print("Schema tables created/verified.")


def resolve_href_to_page(href, source_path, page_paths, cur):
    """Resolve a relative href to a research_pages.id."""
    if not href or href.startswith(('http://', 'https://', 'mailto:', '#', 'javascript:')):
        return None

    # Normalize the source directory
    source_dir = os.path.dirname(source_path)

    # Resolve relative path
    resolved = os.path.normpath(os.path.join(source_dir, unquote(href.split('#')[0])))

    # Try exact match first
    if resolved in page_paths:
        return page_paths[resolved]

    # Try with .html extension
    if not resolved.endswith('.html'):
        resolved_html = resolved + '.html'
        if resolved_html in page_paths:
            return page_paths[resolved_html]

    # Try index.html in directory
    resolved_index = os.path.join(resolved, 'index.html')
    if resolved_index in page_paths:
        return page_paths[resolved_index]

    return None


def build_link_graph(cur):
    """Parse HTML files for internal links and build the page_links table."""
    # Get all pages with paths (relative to Research/)
    cur.execute("SELECT id, path FROM artemis.research_pages WHERE path IS NOT NULL")
    pages = cur.fetchall()
    page_paths = {}  # absolute path -> page_id
    page_by_id = {}  # id -> absolute path

    for page_id, fpath in pages:
        abs_path = os.path.normpath(os.path.join(BASE, fpath))
        page_paths[abs_path] = page_id
        page_by_id[page_id] = abs_path

    print(f"Scanning {len(pages)} pages for internal links...")
    total_links = 0
    errors = 0

    for page_id, fpath in pages:
        abs_path = page_by_id[page_id]
        if not os.path.exists(abs_path) or not abs_path.endswith('.html'):
            continue

        try:
            with open(abs_path, 'r', encoding='utf-8', errors='replace') as f:
                html = f.read()
        except Exception:
            errors += 1
            continue

        soup = BeautifulSoup(html, 'lxml')
        for link in soup.find_all('a', href=True):
            href = link['href']
            target_id = resolve_href_to_page(href, abs_path, page_paths, cur)
            if target_id and target_id != page_id:
                link_text = link.get_text(strip=True)[:200]
                try:
                    cur.execute("""
                        INSERT INTO artemis.page_links (source_page_id, target_page_id, link_text)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (source_page_id, target_page_id) DO NOTHING
                    """, (page_id, target_id, link_text))
                    total_links += 1
                except Exception:
                    pass

    print(f"  Found {total_links} internal links ({errors} read errors)")
    return total_links


def add_semantic_edges(cur, threshold=0.7, max_per_page=3):
    """Add semantic similarity edges for highly related pages."""
    print(f"Computing semantic similarity edges (threshold={threshold})...")
    cur.execute("""
        SELECT a.id, b.id, 1 - (a.embedding <=> b.embedding) as sim
        FROM artemis.research_pages a, artemis.research_pages b
        WHERE a.id < b.id
          AND a.embedding IS NOT NULL AND b.embedding IS NOT NULL
          AND 1 - (a.embedding <=> b.embedding) > %s
        ORDER BY a.id, sim DESC
    """, (threshold,))

    rows = cur.fetchall()
    print(f"  Found {len(rows)} pairs above threshold")

    # Track per-page count to limit to max_per_page
    page_counts = {}
    inserted = 0
    for src, tgt, sim in rows:
        src_count = page_counts.get(src, 0)
        tgt_count = page_counts.get(tgt, 0)
        if src_count >= max_per_page and tgt_count >= max_per_page:
            continue
        try:
            cur.execute("""
                INSERT INTO artemis.page_links (source_page_id, target_page_id, link_text)
                VALUES (%s, %s, %s)
                ON CONFLICT (source_page_id, target_page_id) DO NOTHING
            """, (src, tgt, f"semantic:{sim:.3f}"))
            inserted += 1
            page_counts[src] = src_count + 1
            page_counts[tgt] = tgt_count + 1
        except Exception:
            pass

    print(f"  Added {inserted} semantic similarity edges")
    return inserted


def compute_metrics(cur):
    """Build NetworkX graph and compute PageRank, centrality, communities."""
    print("Building NetworkX graph...")

    # Load nodes
    cur.execute("SELECT id, title, path FROM artemis.research_pages")
    pages = cur.fetchall()

    G = nx.DiGraph()
    for pid, title, fpath in pages:
        G.add_node(pid, title=title, path=fpath)

    # Load edges
    cur.execute("SELECT source_page_id, target_page_id, link_text FROM artemis.page_links")
    edges = cur.fetchall()
    for src, tgt, text in edges:
        edge_type = 'semantic' if text and text.startswith('semantic:') else 'cites'
        weight = float(text.split(':')[1]) if edge_type == 'semantic' else 1.0
        G.add_edge(src, tgt, type=edge_type, weight=weight)

    print(f"  Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    # PageRank
    print("  Computing PageRank...")
    pagerank = nx.pagerank(G, alpha=0.85)

    # Hub/Authority (HITS)
    print("  Computing HITS...")
    try:
        hubs, authorities = nx.hits(G, max_iter=100)
    except nx.PowerIterationFailedConvergence:
        hubs = {n: 0 for n in G.nodes()}
        authorities = {n: 0 for n in G.nodes()}

    # Community detection on undirected version
    print("  Detecting communities...")
    G_undirected = G.to_undirected()
    try:
        communities = list(nx.community.louvain_communities(G_undirected, seed=42))
        # Build node -> cluster_id map
        cluster_map = {}
        for cid, members in enumerate(communities):
            for node in members:
                cluster_map[node] = cid
        print(f"  Found {len(communities)} communities")
    except Exception as e:
        print(f"  Community detection failed: {e}")
        cluster_map = {}

    # Store metrics
    print("  Storing metrics...")
    now = datetime.now(timezone.utc)
    for node_id in G.nodes():
        pr = pagerank.get(node_id, 0)
        hub = hubs.get(node_id, 0)
        auth = authorities.get(node_id, 0)
        cid = cluster_map.get(node_id)
        in_deg = G.in_degree(node_id)
        out_deg = G.out_degree(node_id)

        cur.execute("""
            INSERT INTO artemis.page_metrics
                (page_id, pagerank, in_degree, out_degree, cluster_id, hub_score, authority_score, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (page_id) DO UPDATE SET
                pagerank = EXCLUDED.pagerank,
                in_degree = EXCLUDED.in_degree,
                out_degree = EXCLUDED.out_degree,
                cluster_id = EXCLUDED.cluster_id,
                hub_score = EXCLUDED.hub_score,
                authority_score = EXCLUDED.authority_score,
                updated_at = EXCLUDED.updated_at
        """, (node_id, pr, in_deg, out_deg, cid, hub, auth, now))

    return G, pagerank, communities if 'communities' in dir() else []


def print_stats(cur):
    """Print graph statistics."""
    cur.execute("SELECT count(*) FROM artemis.page_links")
    link_count = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM artemis.page_links WHERE link_text LIKE 'semantic:%'")
    semantic_count = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM artemis.page_metrics")
    metric_count = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM artemis.concepts")
    concept_count = cur.fetchone()[0]

    print(f"\n{'='*60}")
    print(f"Graph Statistics")
    print(f"{'='*60}")
    print(f"  Page links (HTML): {link_count - semantic_count}")
    print(f"  Page links (semantic): {semantic_count}")
    print(f"  Total edges: {link_count}")
    print(f"  Pages with metrics: {metric_count}")
    print(f"  Concepts: {concept_count}")

    if metric_count > 0:
        cur.execute("""
            SELECT rp.title, pm.pagerank, pm.in_degree, pm.out_degree
            FROM artemis.page_metrics pm
            JOIN artemis.research_pages rp ON rp.id = pm.page_id
            ORDER BY pm.pagerank DESC
            LIMIT 10
        """)
        print(f"\n  Top 10 by PageRank:")
        for title, pr, in_d, out_d in cur.fetchall():
            print(f"    {pr:.6f}  in:{in_d} out:{out_d}  {title[:60]}")

        cur.execute("SELECT DISTINCT cluster_id FROM artemis.page_metrics WHERE cluster_id IS NOT NULL")
        clusters = cur.fetchall()
        print(f"\n  Communities: {len(clusters)}")
        for (cid,) in sorted(clusters)[:10]:
            cur.execute("""
                SELECT count(*), array_agg(rp.title ORDER BY pm.pagerank DESC)
                FROM artemis.page_metrics pm
                JOIN artemis.research_pages rp ON rp.id = pm.page_id
                WHERE pm.cluster_id = %s
            """, (cid,))
            count, titles = cur.fetchone()
            top3 = ', '.join((titles or [])[:3])
            print(f"    Cluster {cid}: {count} pages — {top3}")


def main():
    parser = argparse.ArgumentParser(description="Build knowledge graph from research corpus")
    parser.add_argument("--skip-schema", action="store_true", help="Skip table creation")
    parser.add_argument("--stats-only", action="store_true", help="Just print stats")
    parser.add_argument("--threshold", type=float, default=0.7, help="Semantic similarity threshold")
    args = parser.parse_args()

    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor()

    if args.stats_only:
        print_stats(cur)
        conn.close()
        return

    t0 = time.time()

    # Step 1: Schema
    if not args.skip_schema:
        create_schema(cur)
        conn.commit()

    # Step 2: Parse HTML links
    link_count = build_link_graph(cur)
    conn.commit()

    # Step 3: Semantic similarity edges
    semantic_count = add_semantic_edges(cur, threshold=args.threshold)
    conn.commit()

    # Step 4: Compute and store metrics
    G, pagerank, communities = compute_metrics(cur)
    conn.commit()

    # Step 5: Print results
    print_stats(cur)

    elapsed = time.time() - t0
    print(f"\nCompleted in {elapsed:.1f}s")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")

    conn.close()


if __name__ == "__main__":
    main()
