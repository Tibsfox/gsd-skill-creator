#!/usr/bin/env python3
"""Hybrid search: vector + FTS with Reciprocal Rank Fusion.

Usage:
  python3 search_corpus.py "how do bees pollinate in the PNW"
  python3 search_corpus.py "Kuramoto synchronization" --limit 10
"""

import sys
import psycopg2
from sentence_transformers import SentenceTransformer

DB_DSN = "host=localhost dbname=tibsfox user=postgres password=foxyuw5,&%cM#(C3"
MODEL = "all-MiniLM-L6-v2"
RRF_K = 60  # Reciprocal Rank Fusion constant (from Sourcegraph/Axon research)
LIMIT = 5

def hybrid_search(query: str, limit: int = LIMIT):
    """Two-tier search: semantic + keyword, fused with RRF."""
    model = SentenceTransformer(MODEL)
    emb = model.encode([query], normalize_embeddings=True)[0]

    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()

    # Lane 1: Vector similarity search (top 20)
    cur.execute("""
        SELECT id, path, title, 1 - (embedding <=> %s::vector) as score
        FROM artemis.research_pages
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> %s::vector
        LIMIT 20
    """, (emb.tolist(), emb.tolist()))
    vector_results = {row[0]: {'path': row[1], 'title': row[2], 'vscore': row[3]} for row in cur.fetchall()}

    # Lane 2: Full-text search (top 20)
    # Convert query to tsquery with & between words
    ts_words = ' & '.join(query.split())
    cur.execute("""
        SELECT id, path, title, ts_rank(tsv, to_tsquery('english', %s)) as score
        FROM artemis.research_pages
        WHERE tsv @@ to_tsquery('english', %s)
        ORDER BY score DESC
        LIMIT 20
    """, (ts_words, ts_words))
    fts_results = {row[0]: {'path': row[1], 'title': row[2], 'fscore': row[3]} for row in cur.fetchall()}

    # Reciprocal Rank Fusion
    all_ids = set(vector_results.keys()) | set(fts_results.keys())

    # Assign ranks
    v_ranked = sorted(vector_results.keys(), key=lambda x: vector_results[x]['vscore'], reverse=True)
    f_ranked = sorted(fts_results.keys(), key=lambda x: fts_results[x]['fscore'], reverse=True)

    v_rank = {pid: i+1 for i, pid in enumerate(v_ranked)}
    f_rank = {pid: i+1 for i, pid in enumerate(f_ranked)}

    # Compute RRF scores
    fused = []
    for pid in all_ids:
        rrf_v = 1.0 / (RRF_K + v_rank.get(pid, 999))
        rrf_f = 1.0 / (RRF_K + f_rank.get(pid, 999))
        rrf_total = rrf_v + rrf_f

        info = vector_results.get(pid, fts_results.get(pid, {}))
        fused.append({
            'id': pid,
            'path': info.get('path', ''),
            'title': info.get('title', ''),
            'rrf': rrf_total,
            'vscore': vector_results.get(pid, {}).get('vscore', 0),
            'fscore': fts_results.get(pid, {}).get('fscore', 0),
            'lanes': ('V' if pid in vector_results else '-') + ('F' if pid in fts_results else '-')
        })

    fused.sort(key=lambda x: x['rrf'], reverse=True)

    cur.close()
    conn.close()
    return fused[:limit]

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 search_corpus.py <query> [--limit N]")
        sys.exit(1)

    query = sys.argv[1]
    limit = LIMIT
    if '--limit' in sys.argv:
        idx = sys.argv.index('--limit')
        limit = int(sys.argv[idx + 1])

    print(f"Query: {query}")
    print(f"{'RRF':>6}  {'V':>5}  {'F':>5}  {'Lanes':>5}  {'Path':<40}  Title")
    print("-" * 100)

    results = hybrid_search(query, limit)
    for r in results:
        title = r['title'][:50] if r['title'] else ''
        print(f"{r['rrf']:.4f}  {r['vscore']:.3f}  {r['fscore']:.3f}  {r['lanes']:>5}  {r['path']:<40}  {title}")
