#!/usr/bin/env python3
"""Intent classification and query routing for the research corpus.

Routes queries to the appropriate retrieval strategy based on intent analysis.
Implements the intent classification spec from the codebase intelligence strategy.

Usage:
  python3 intent_router.py "how do bees pollinate in the PNW"
  python3 intent_router.py "compare Kuramoto and Lotka-Volterra models"
  python3 intent_router.py "MUK/pnw-weather.html"
"""

import re
import sys
import time
from datetime import datetime, timezone
import psycopg2
from sentence_transformers import SentenceTransformer

DB_DSN = "host=localhost dbname=tibsfox user=postgres password=foxyuw5,&%cM#(C3"
MODEL = "all-MiniLM-L6-v2"
RRF_K = 60


def classify_intent(query: str) -> str:
    """Route queries to appropriate retrieval strategy."""
    q = query.lower().strip()

    # Navigational: looks like a path or page name
    if '/' in q or q.endswith('.html') or q.endswith('.md'):
        return 'navigational'

    # Computational: math questions
    if any(w in q for w in ['calculate', 'compute', 'solve', 'how many', 'prove', 'derive']):
        return 'computational'

    # Comparative: multi-topic
    if any(w in q for w in ['compare', 'versus', 'vs', 'difference between', 'similarities']):
        return 'comparative'

    # Factual: definition questions
    if any(w in q for w in ['what is', 'define', 'explain', 'who is', 'when did', 'where is']):
        return 'factual'

    # Cluster: Rosetta cluster queries
    if any(w in q for w in ['cluster', 'rosetta', 'all projects in', 'everything about']):
        return 'cluster'

    # Gap analysis
    if any(w in q for w in ['missing', 'gap', 'what don\'t we have', 'what\'s not covered']):
        return 'gap_analysis'

    # Default: exploratory
    return 'exploratory'


def navigational_search(query, cur):
    """Exact path/title lookup."""
    # Try path match
    cur.execute(
        "SELECT id, title, path, category FROM artemis.research_pages WHERE path ILIKE %s LIMIT 5",
        (f'%{query}%',)
    )
    results = cur.fetchall()
    if results:
        return [{'id': r[0], 'title': r[1], 'path': r[2], 'category': r[3],
                 'score': 1.0, 'lane': 'navigational'} for r in results]

    # Try title match
    cur.execute(
        "SELECT id, title, path, category FROM artemis.research_pages WHERE title ILIKE %s LIMIT 5",
        (f'%{query}%',)
    )
    results = cur.fetchall()
    return [{'id': r[0], 'title': r[1], 'path': r[2], 'category': r[3],
             'score': 0.9, 'lane': 'navigational'} for r in results]


def vector_search(query_emb, cur, limit=10):
    """Semantic vector search."""
    cur.execute("""
        SELECT id, title, path, category,
               1 - (embedding <=> %s::vector) as score
        FROM artemis.research_pages
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """, (query_emb.tolist(), query_emb.tolist(), limit))
    return [{'id': r[0], 'title': r[1], 'path': r[2], 'category': r[3],
             'score': float(r[4]), 'lane': 'vector'} for r in cur.fetchall()]


def fts_search(query, cur, limit=10):
    """Full-text keyword search."""
    cur.execute("""
        SELECT id, title, path, category,
               ts_rank(tsv, websearch_to_tsquery('english', %s)) as score
        FROM artemis.research_pages
        WHERE tsv @@ websearch_to_tsquery('english', %s)
        ORDER BY score DESC
        LIMIT %s
    """, (query, query, limit))
    return [{'id': r[0], 'title': r[1], 'path': r[2], 'category': r[3],
             'score': float(r[4]), 'lane': 'fts'} for r in cur.fetchall()]


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
    """Find matching concepts by embedding similarity, return their referenced pages."""
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
        return []

    page_scores = {}
    page_meta = {}
    for cid, cname, ccat, csim in top_concepts:
        cur.execute("""
            SELECT cr.page_id, cr.ref_type, rp.path, rp.title, rp.category
            FROM artemis.concept_refs cr
            JOIN artemis.research_pages rp ON rp.id = cr.page_id
            WHERE cr.concept_id = %s
        """, (cid,))
        for page_id, ref_type, path, title, category in cur.fetchall():
            type_weight = {'definition': 1.0, 'reference': 0.7, 'related': 0.5}.get(ref_type, 0.5)
            score = csim * type_weight
            if page_id not in page_scores or score > page_scores[page_id]:
                page_scores[page_id] = score
                page_meta[page_id] = {
                    'id': page_id, 'title': title, 'path': path,
                    'category': category, 'score': score, 'lane': 'concept',
                    'concept': cname
                }

    ranked = sorted(page_scores.items(), key=lambda x: -x[1])[:limit]
    return [page_meta[pid] for pid, _ in ranked]


def hybrid_rrf(query, query_emb, cur, limit=10):
    """Reciprocal Rank Fusion of vector + FTS + concept results, boosted by PageRank."""
    vector_results = vector_search(query_emb, cur, limit=limit * 3)
    fts_results = fts_search(query, cur, limit=limit * 3)

    # Lane 3: Concept search (if available)
    concept_results = []
    if _concept_lane_available(cur):
        concept_results = concept_search(query_emb, cur, limit=limit * 3)

    # Build RRF scores
    scores = {}
    metadata = {}

    for rank, r in enumerate(vector_results):
        pid = r['id']
        scores[pid] = scores.get(pid, 0) + 1.0 / (RRF_K + rank + 1)
        metadata[pid] = r
        metadata[pid]['lanes'] = ['vector']

    for rank, r in enumerate(fts_results):
        pid = r['id']
        scores[pid] = scores.get(pid, 0) + 1.0 / (RRF_K + rank + 1)
        if pid in metadata:
            metadata[pid]['lanes'].append('fts')
        else:
            metadata[pid] = r
            metadata[pid]['lanes'] = ['fts']

    for rank, r in enumerate(concept_results):
        pid = r['id']
        scores[pid] = scores.get(pid, 0) + 1.0 / (RRF_K + rank + 1)
        if pid in metadata:
            metadata[pid]['lanes'].append('concept')
        else:
            metadata[pid] = r
            metadata[pid]['lanes'] = ['concept']

    # PageRank boost (10%)
    if scores:
        page_ids = list(scores.keys())
        cur.execute("""
            SELECT page_id, pagerank FROM artemis.page_metrics
            WHERE page_id = ANY(%s)
        """, (page_ids,))
        for pid, pr in cur.fetchall():
            if pid in scores:
                scores[pid] += 0.1 * (pr or 0)

    # Freshness boost (20% for <30 days, 10% for <90 days)
    if scores:
        cur.execute("""
            SELECT id, updated_at FROM artemis.research_pages
            WHERE id = ANY(%s) AND updated_at IS NOT NULL
        """, (page_ids,))
        now = datetime.now(timezone.utc)
        for pid, updated in cur.fetchall():
            if updated and pid in scores:
                days_ago = (now - updated).days
                if days_ago < 30:
                    scores[pid] *= 1.2
                elif days_ago < 90:
                    scores[pid] *= 1.1

    # Sort and return top N
    ranked = sorted(scores.items(), key=lambda x: -x[1])[:limit]
    results = []
    for pid, score in ranked:
        entry = metadata.get(pid, {})
        entry['rrf_score'] = score
        entry['lane'] = '+'.join(entry.get('lanes', ['unknown']))
        results.append(entry)

    return results


def comparative_search(query, query_emb, cur, limit=10):
    """Multi-topic comparison: split query, search each half, merge."""
    # Simple split on comparison words
    parts = re.split(r'\s+(?:vs|versus|compared to|and|or)\s+', query, flags=re.IGNORECASE)
    if len(parts) < 2:
        return hybrid_rrf(query, query_emb, cur, limit)

    all_results = {}
    for part in parts:
        part = part.strip()
        if not part:
            continue
        part_emb = model.encode([part], normalize_embeddings=True)[0]
        results = hybrid_rrf(part, part_emb, cur, limit=limit // 2)
        for r in results:
            pid = r['id']
            if pid not in all_results:
                all_results[pid] = r
                all_results[pid]['query_parts'] = [part]
            else:
                all_results[pid]['rrf_score'] += r.get('rrf_score', 0)
                all_results[pid]['query_parts'].append(part)

    # Boost results that appear in multiple parts (bridge documents)
    for pid, r in all_results.items():
        if len(r.get('query_parts', [])) > 1:
            r['rrf_score'] *= 1.5  # 50% boost for bridge docs

    ranked = sorted(all_results.values(), key=lambda x: -x.get('rrf_score', 0))
    return ranked[:limit]


def cluster_search(query, cur, limit=20):
    """Return all pages in a Rosetta cluster."""
    # Extract cluster name from query
    q = query.lower()
    for word in ['cluster', 'rosetta', 'all', 'projects', 'in', 'everything', 'about']:
        q = q.replace(word, '')
    cluster_name = q.strip()

    cur.execute("""
        SELECT rp.id, rp.title, rp.path, rp.category,
               COALESCE(pm.pagerank, 0) as score
        FROM artemis.research_pages rp
        LEFT JOIN artemis.page_metrics pm ON pm.page_id = rp.id
        WHERE rp.category ILIKE %s
        ORDER BY COALESCE(pm.pagerank, 0) DESC
        LIMIT %s
    """, (f'%{cluster_name}%', limit))
    return [{'id': r[0], 'title': r[1], 'path': r[2], 'category': r[3],
             'score': float(r[4]), 'lane': 'cluster'} for r in cur.fetchall()]


def route_query(query, model, cur, limit=10):
    """Main entry point: classify intent and route to search strategy."""
    intent = classify_intent(query)
    t0 = time.time()

    if intent == 'navigational':
        results = navigational_search(query, cur)
    elif intent == 'computational':
        # Flag for math coprocessor, but still search for context
        query_emb = model.encode([query], normalize_embeddings=True)[0]
        results = hybrid_rrf(query, query_emb, cur, limit)
        for r in results:
            r['note'] = 'Route to gsd-math-coprocessor for computation'
    elif intent == 'comparative':
        query_emb = model.encode([query], normalize_embeddings=True)[0]
        results = comparative_search(query, query_emb, cur, limit)
    elif intent == 'cluster':
        results = cluster_search(query, cur, limit)
    elif intent == 'gap_analysis':
        query_emb = model.encode([query], normalize_embeddings=True)[0]
        results = hybrid_rrf(query, query_emb, cur, limit)
        for r in results:
            r['note'] = 'Review coverage gaps against this result set'
    else:
        # factual or exploratory — full hybrid RRF
        query_emb = model.encode([query], normalize_embeddings=True)[0]
        results = hybrid_rrf(query, query_emb, cur, limit)

    elapsed = time.time() - t0
    return {
        'intent': intent,
        'query': query,
        'results': results,
        'elapsed_ms': round(elapsed * 1000, 1),
        'timestamp': datetime.now(timezone.utc).isoformat()
    }


def print_results(response):
    """Pretty-print search results."""
    print(f"\nQuery: {response['query']}")
    print(f"Intent: {response['intent']}")
    print(f"Time: {response['elapsed_ms']}ms")
    print(f"Results: {len(response['results'])}")
    print("=" * 70)

    for i, r in enumerate(response['results'], 1):
        score = r.get('rrf_score', r.get('score', 0))
        lane = r.get('lane', '?')
        title = (r.get('title', '') or 'Untitled')[:55]
        path = r.get('path', '')
        note = r.get('note', '')
        print(f"  {i:2d}. [{lane:12s}] {score:.4f}  {title}")
        print(f"      {path}")
        if note:
            print(f"      >> {note}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 intent_router.py <query>")
        sys.exit(1)

    query = ' '.join(sys.argv[1:])
    model = SentenceTransformer(MODEL)
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()

    response = route_query(query, model, cur)
    print_results(response)

    conn.close()
