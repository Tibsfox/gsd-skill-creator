#!/usr/bin/env python3
"""Hybrid search: vector + FTS + concepts with Reciprocal Rank Fusion.

Three-lane search fused with RRF (k=60):
  Lane 1: Vector similarity (page embeddings)
  Lane 2: Full-text search (tsvector)
  Lane 3: Concept search (entity embeddings -> referenced pages)

Usage:
  python3 search_corpus.py "how do bees pollinate in the PNW"
  python3 search_corpus.py "Kuramoto synchronization" --limit 10
  python3 search_corpus.py "Katherine Johnson" --no-concepts
"""

import sys
import psycopg2
from sentence_transformers import SentenceTransformer

from db_config import DB_DSN
MODEL = "all-MiniLM-L6-v2"
RRF_K = 60  # Reciprocal Rank Fusion constant (from Sourcegraph/Axon research)
LIMIT = 5


def _concept_lane_available(cur):
    """Check if concept embeddings exist."""
    try:
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'artemis' AND table_name = 'concepts'
              AND column_name = 'embedding'
        """)
        if not cur.fetchone():
            return False
        cur.execute("SELECT count(*) FROM artemis.concepts WHERE embedding IS NOT NULL")
        return cur.fetchone()[0] > 0
    except Exception:
        return False


def concept_search(query_emb, cur, limit=20):
    """Lane 3: Find matching concepts by embedding similarity, return their referenced pages.

    1. Find top-K concepts closest to the query embedding
    2. Expand each concept to its referenced pages via concept_refs
    3. Score pages by concept similarity * ref_type weight
    """
    cur.execute("""
        SELECT c.id, c.name, c.category,
               1 - (c.embedding <=> %s::vector) as sim
        FROM artemis.concepts c
        WHERE c.embedding IS NOT NULL
        ORDER BY c.embedding <=> %s::vector
        LIMIT 10
    """, (query_emb.tolist(), query_emb.tolist()))
    top_concepts = cur.fetchall()

    if not top_concepts:
        return {}

    # Expand concepts to pages
    page_scores = {}  # page_id -> best score
    page_meta = {}    # page_id -> metadata
    concept_trail = {}  # page_id -> list of concept names that led here

    for cid, cname, ccat, csim in top_concepts:
        # Weight: definitions are stronger signals than references
        cur.execute("""
            SELECT cr.page_id, cr.ref_type, rp.path, rp.title
            FROM artemis.concept_refs cr
            JOIN artemis.research_pages rp ON rp.id = cr.page_id
            WHERE cr.concept_id = %s
        """, (cid,))
        for page_id, ref_type, path, title in cur.fetchall():
            # ref_type weight: definition=1.0, reference=0.7, related=0.5
            type_weight = {'definition': 1.0, 'reference': 0.7, 'related': 0.5}.get(ref_type, 0.5)
            score = csim * type_weight

            if page_id not in page_scores or score > page_scores[page_id]:
                page_scores[page_id] = score
                page_meta[page_id] = {'path': path, 'title': title}

            if page_id not in concept_trail:
                concept_trail[page_id] = []
            if cname not in concept_trail[page_id]:
                concept_trail[page_id].append(cname)

    # Build results dict keyed by page_id
    results = {}
    ranked = sorted(page_scores.items(), key=lambda x: -x[1])[:limit]
    for page_id, score in ranked:
        meta = page_meta[page_id]
        results[page_id] = {
            'path': meta['path'],
            'title': meta['title'],
            'cscore': score,
            'concepts': concept_trail.get(page_id, [])
        }

    return results


def hybrid_search(query: str, limit: int = LIMIT, use_concepts: bool = True):
    """Three-lane search: semantic + keyword + concepts, fused with RRF."""
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

    # Lane 3: Concept search (entity embeddings -> referenced pages)
    concept_results = {}
    has_concepts = False
    if use_concepts and _concept_lane_available(cur):
        concept_results = concept_search(emb, cur, limit=20)
        has_concepts = True

    # Reciprocal Rank Fusion across all lanes
    all_ids = set(vector_results.keys()) | set(fts_results.keys()) | set(concept_results.keys())

    # Assign ranks per lane
    v_ranked = sorted(vector_results.keys(), key=lambda x: vector_results[x]['vscore'], reverse=True)
    f_ranked = sorted(fts_results.keys(), key=lambda x: fts_results[x]['fscore'], reverse=True)
    c_ranked = sorted(concept_results.keys(), key=lambda x: concept_results[x]['cscore'], reverse=True)

    v_rank = {pid: i+1 for i, pid in enumerate(v_ranked)}
    f_rank = {pid: i+1 for i, pid in enumerate(f_ranked)}
    c_rank = {pid: i+1 for i, pid in enumerate(c_ranked)}

    # Compute RRF scores
    fused = []
    for pid in all_ids:
        rrf_v = 1.0 / (RRF_K + v_rank.get(pid, 999))
        rrf_f = 1.0 / (RRF_K + f_rank.get(pid, 999))
        rrf_c = 1.0 / (RRF_K + c_rank.get(pid, 999))
        rrf_total = rrf_v + rrf_f + rrf_c

        # Merge metadata from whichever lane(s) found this page
        info = vector_results.get(pid, fts_results.get(pid, concept_results.get(pid, {})))
        concepts_matched = concept_results.get(pid, {}).get('concepts', [])

        lane_str = (
            ('V' if pid in vector_results else '-') +
            ('F' if pid in fts_results else '-') +
            ('C' if pid in concept_results else '-')
        )

        fused.append({
            'id': pid,
            'path': info.get('path', ''),
            'title': info.get('title', ''),
            'rrf': rrf_total,
            'vscore': vector_results.get(pid, {}).get('vscore', 0),
            'fscore': fts_results.get(pid, {}).get('fscore', 0),
            'cscore': concept_results.get(pid, {}).get('cscore', 0),
            'lanes': lane_str,
            'concepts': concepts_matched,
        })

    fused.sort(key=lambda x: x['rrf'], reverse=True)

    cur.close()
    conn.close()
    return fused[:limit], has_concepts


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 search_corpus.py <query> [--limit N] [--no-concepts]")
        sys.exit(1)

    query = sys.argv[1]
    limit = LIMIT
    use_concepts = True

    if '--limit' in sys.argv:
        idx = sys.argv.index('--limit')
        limit = int(sys.argv[idx + 1])
    if '--no-concepts' in sys.argv:
        use_concepts = False

    results, has_concepts = hybrid_search(query, limit, use_concepts)

    print(f"Query: {query}")
    if has_concepts:
        print(f"Lanes: V=vector, F=FTS, C=concept (3-way RRF, k={RRF_K})")
    else:
        print(f"Lanes: V=vector, F=FTS (2-way RRF, k={RRF_K}) — concept lane inactive")
    print(f"{'RRF':>6}  {'V':>5}  {'F':>5}  {'C':>5}  {'Lanes':>5}  {'Path':<40}  Title")
    print("-" * 110)

    for r in results:
        title = r['title'][:45] if r['title'] else ''
        concepts = ', '.join(r.get('concepts', [])[:3])
        line = f"{r['rrf']:.4f}  {r['vscore']:.3f}  {r['fscore']:.3f}  {r['cscore']:.3f}  {r['lanes']:>5}  {r['path']:<40}  {title}"
        if concepts:
            line += f"\n{'':>73}via: {concepts}"
        print(line)
