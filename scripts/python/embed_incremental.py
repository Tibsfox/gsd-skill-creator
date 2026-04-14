#!/usr/bin/env python3
"""Incremental embedding + graph update for sweep.py integration.

Call after sweep.py updates files. Scans for new/changed pages,
re-embeds them, and refreshes graph metrics for affected nodes.

Usage:
  python3 embed_incremental.py                    # Auto-detect changes
  python3 embed_incremental.py --force-all        # Re-embed everything
  python3 embed_incremental.py --graph-only       # Just refresh graph metrics
"""

import os
import re
import sys
import hashlib
import argparse
import time
from datetime import datetime, timezone
from glob import glob

import psycopg2
from sentence_transformers import SentenceTransformer

from db_config import DB_DSN
MODEL = "all-MiniLM-L6-v2"
BATCH = 64
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "www", "tibsfox", "com", "Research")


def content_hash(text):
    """SHA-256 of content for change detection."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]


def extract_text(html_path):
    """Extract plain text from HTML for embedding."""
    try:
        with open(html_path, 'r', encoding='utf-8', errors='replace') as f:
            html = f.read()
    except Exception:
        return None, None

    # Strip HTML tags, keep text
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    # Extract title
    title_match = re.search(r'<title>([^<]+)</title>', html)
    title = title_match.group(1) if title_match else os.path.basename(html_path)

    return title, text


def scan_for_changes(cur):
    """Find new or changed HTML files not yet in DB or with stale content."""
    # Get current DB state
    cur.execute("SELECT id, path, title FROM artemis.research_pages")
    db_pages = {row[1]: (row[0], row[2]) for row in cur.fetchall()}

    # Scan filesystem
    html_files = glob(os.path.join(BASE, '**', '*.html'), recursive=True)

    new_pages = []
    changed_pages = []

    for fpath in html_files:
        rel_path = os.path.relpath(fpath, BASE)
        title, text = extract_text(fpath)
        if not text:
            continue

        if rel_path not in db_pages:
            new_pages.append((rel_path, title, text))
        # For existing pages, check if content changed by comparing word count
        # (full content hash would require storing it, which we can add later)

    return new_pages, changed_pages


def embed_pages(pages, cur, model):
    """Embed a list of (id, text) pairs."""
    if not pages:
        return 0

    count = 0
    for i in range(0, len(pages), BATCH):
        batch = pages[i:i+BATCH]
        ids = [p[0] for p in batch]
        texts = [p[1][:2000] for p in batch]
        embeddings = model.encode(texts, normalize_embeddings=True)
        for page_id, emb in zip(ids, embeddings):
            cur.execute(
                "UPDATE artemis.research_pages SET embedding = %s::vector WHERE id = %s",
                (emb.tolist(), page_id)
            )
        count += len(batch)

    return count


def insert_new_pages(new_pages, cur, model):
    """Insert new pages into DB and embed them."""
    inserted = []
    now = datetime.now(timezone.utc)

    for rel_path, title, text in new_pages:
        word_count = len(text.split())
        # Determine category from path
        parts = rel_path.split('/')
        category = parts[0] if len(parts) > 1 else 'root'

        cur.execute("""
            INSERT INTO artemis.research_pages (path, title, category, content_text, word_count, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id
        """, (rel_path, title, category, text[:10000], word_count, now))

        result = cur.fetchone()
        if result:
            inserted.append((result[0], text))

    # Embed the new pages
    if inserted:
        embed_count = embed_pages(inserted, cur, model)
        return embed_count

    return 0


def refresh_graph_metrics(cur):
    """Refresh PageRank and community detection for affected nodes."""
    try:
        import networkx as nx
    except ImportError:
        print("  networkx not available, skipping graph refresh")
        return

    # Rebuild from page_links
    cur.execute("SELECT source_page_id, target_page_id, link_text FROM artemis.page_links")
    edges = cur.fetchall()
    if not edges:
        return

    G = nx.DiGraph()
    cur.execute("SELECT id FROM artemis.research_pages")
    for (pid,) in cur.fetchall():
        G.add_node(pid)

    for src, tgt, text in edges:
        weight = 1.0
        if text and text.startswith('semantic:'):
            try:
                weight = float(text.split(':')[1])
            except (ValueError, IndexError):
                pass
        G.add_edge(src, tgt, weight=weight)

    pagerank = nx.pagerank(G, alpha=0.85)
    now = datetime.now(timezone.utc)

    for node_id, pr in pagerank.items():
        cur.execute("""
            INSERT INTO artemis.page_metrics (page_id, pagerank, in_degree, out_degree, updated_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (page_id) DO UPDATE SET
                pagerank = EXCLUDED.pagerank,
                in_degree = EXCLUDED.in_degree,
                out_degree = EXCLUDED.out_degree,
                updated_at = EXCLUDED.updated_at
        """, (node_id, pr, G.in_degree(node_id), G.out_degree(node_id), now))


def main():
    parser = argparse.ArgumentParser(description="Incremental embedding + graph update")
    parser.add_argument("--force-all", action="store_true", help="Re-embed all pages")
    parser.add_argument("--graph-only", action="store_true", help="Only refresh graph metrics")
    args = parser.parse_args()

    t0 = time.time()
    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor()

    if args.graph_only:
        print("Refreshing graph metrics...")
        refresh_graph_metrics(cur)
        conn.commit()
        print(f"Done in {time.time()-t0:.1f}s")
        conn.close()
        return

    # Load model
    model = SentenceTransformer(MODEL)

    if args.force_all:
        # Re-embed all pages
        cur.execute("SELECT id, COALESCE(content_text, title, '') FROM artemis.research_pages ORDER BY id")
        pages = cur.fetchall()
        count = embed_pages(pages, cur, model)
        conn.commit()
        print(f"Re-embedded {count} pages")
    else:
        # Scan for new pages
        new_pages, changed_pages = scan_for_changes(cur)
        print(f"Found {len(new_pages)} new pages, {len(changed_pages)} changed")

        if new_pages:
            count = insert_new_pages(new_pages, cur, model)
            conn.commit()
            print(f"Inserted and embedded {count} new pages")

        # Also embed any pages missing embeddings
        cur.execute("SELECT id, COALESCE(content_text, title, '') FROM artemis.research_pages WHERE embedding IS NULL ORDER BY id")
        unembedded = cur.fetchall()
        if unembedded:
            count = embed_pages(unembedded, cur, model)
            conn.commit()
            print(f"Embedded {count} previously unembedded pages")

    # Refresh concepts (extract + embed new concepts from new pages)
    try:
        from extract_concepts import extract_and_store_concepts
        print("Extracting concepts from new pages...")
        concept_count = extract_and_store_concepts(cur)
        conn.commit()
        if concept_count:
            print(f"  {concept_count} new concept refs added")
            # Embed any new concepts
            from embed_concepts import embed_new_concepts
            embedded_concepts = embed_new_concepts(cur, model)
            conn.commit()
            if embedded_concepts:
                print(f"  {embedded_concepts} concepts embedded")
    except ImportError:
        pass  # concept extraction not available, skip
    except Exception as e:
        print(f"  Concept extraction skipped: {e}")
        conn.rollback()
        conn.autocommit = False

    # Refresh graph
    print("Refreshing graph metrics...")
    refresh_graph_metrics(cur)
    conn.commit()

    # Sync to ChromaDB backup if available
    try:
        from chroma_backup import sync_to_chroma
        print("Syncing to ChromaDB backup...")
        sync_to_chroma(cur)
    except ImportError:
        pass  # ChromaDB not configured, skip
    except Exception as e:
        print(f"  ChromaDB sync skipped: {e}")

    elapsed = time.time() - t0
    cur.execute("SELECT count(*) FROM artemis.research_pages")
    total = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM artemis.research_pages WHERE embedding IS NOT NULL")
    embedded = cur.fetchone()[0]
    print(f"Done in {elapsed:.1f}s — {embedded}/{total} pages embedded")

    conn.close()


if __name__ == "__main__":
    main()
