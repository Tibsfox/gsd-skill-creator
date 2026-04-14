#!/usr/bin/env python3
"""
Pre-Indexed Embedding × LongMemEval Benchmark
================================================

Proves that pre-indexing embeddings at ingest time matches MemPalace speed.

Architecture:
  1. INGEST PHASE: Embed all turns in all sessions ONCE, store in memory.
  2. QUERY PHASE: For each question, embed the query and cosine-scan
     the pre-indexed vectors. No per-question embedding of sessions.

This mirrors the production architecture: grove records are embedded
when imported, vectors are stored alongside content hashes, and search
is a pure cosine scan.

Expected result: MemPalace-quality ranking (NDCG@10 ≈ 0.89) at
grove-level speed (seconds, not minutes).

Usage:
    /tmp/mempal-bench/.venv/bin/python benchmarks/longmemeval_preindex.py \\
        /tmp/longmemeval-data/longmemeval_s_cleaned.json

    /tmp/mempal-bench/.venv/bin/python benchmarks/longmemeval_preindex.py \\
        /tmp/longmemeval-data/longmemeval_s_cleaned.json --limit 20
"""

import json
import argparse
import math
import time
import numpy as np
from collections import defaultdict

from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

# =============================================================================
# METRICS
# =============================================================================

def recall_at_k(retrieved, relevant, k):
    if not relevant:
        return 1.0
    top_k = set(retrieved[:k])
    return len(top_k & set(relevant)) / len(set(relevant))


def ndcg_at_k(retrieved, relevant, k):
    if not relevant:
        return 1.0
    rel_set = set(relevant)
    dcg = sum(1.0 / math.log2(i + 2) for i, sid in enumerate(retrieved[:k]) if sid in rel_set)
    ideal = sum(1.0 / math.log2(i + 2) for i in range(min(k, len(rel_set))))
    return dcg / ideal if ideal > 0 else 0.0


def cosine_similarity(a, b):
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    return dot / norm if norm > 0 else 0.0


# =============================================================================
# PRE-INDEXED STORE
# =============================================================================

class PreIndexedStore:
    """
    Pre-computed turn-level embedding index for a single question's haystack.

    Ingest: embed every turn in every session ONCE.
    Query: embed the question, cosine-scan, score sessions by best turn match.
    """

    def __init__(self, embed_fn):
        self.embed_fn = embed_fn
        # turn_vectors[session_idx] = list of (turn_idx, vector)
        self.turn_vectors = {}
        self.ingest_time = 0.0

    def ingest(self, sessions):
        """Embed all turns in all sessions. Call once per question's haystack."""
        start = time.time()

        # Collect all turn texts with their session mapping
        all_texts = []
        mapping = []  # (session_idx, turn_idx)

        for si, session in enumerate(sessions):
            for ti, turn in enumerate(session):
                content = turn.get('content', '') if isinstance(turn, dict) else str(turn)
                if content.strip():
                    all_texts.append(content[:1024])  # Cap at 1024 chars
                    mapping.append((si, ti))

        if not all_texts:
            self.ingest_time = time.time() - start
            return

        # Batch embed all turns at once
        vectors = self.embed_fn(all_texts)

        # Store by session
        for i, (si, ti) in enumerate(mapping):
            if si not in self.turn_vectors:
                self.turn_vectors[si] = []
            self.turn_vectors[si].append(vectors[i])

        self.ingest_time = time.time() - start

    def query(self, question, session_ids):
        """Embed the question, return session IDs ranked by best-turn similarity."""
        [query_vec] = self.embed_fn([question])

        scored = []
        for si, session_id in enumerate(session_ids):
            turn_vecs = self.turn_vectors.get(si, [])
            if not turn_vecs:
                scored.append((0.0, session_id))
                continue
            # Score = max similarity across turns
            best = max(cosine_similarity(query_vec, tv) for tv in turn_vecs)
            scored.append((best, session_id))

        scored.sort(key=lambda x: -x[0])
        return [sid for _, sid in scored]


# =============================================================================
# BENCHMARK
# =============================================================================

def run_benchmark(data_path, limit=None):
    with open(data_path) as f:
        data = json.load(f)

    if limit:
        data = data[:limit]

    print("  Loading embedding model (all-MiniLM-L6-v2 via onnxruntime)...")
    embed_fn = DefaultEmbeddingFunction()
    embed_fn(["warmup"])  # Warm up

    print(f"\n{'=' * 60}")
    print(f"  Pre-Indexed Turn-Level Embedding × LongMemEval")
    print(f"  Questions: {len(data)}")
    print(f"  Method: Embed all turns at ingest, cosine scan at query")
    print(f"  Model: all-MiniLM-L6-v2 (384-dim, onnxruntime)")
    print(f"{'=' * 60}\n")

    k_values = [1, 3, 5, 10, 30, 50]
    all_recalls = {k: [] for k in k_values}
    all_ndcgs = {k: [] for k in k_values}
    type_recalls = defaultdict(lambda: {k: [] for k in k_values})

    total_ingest_time = 0.0
    total_query_time = 0.0
    total_turns_embedded = 0
    start_time = time.time()

    for i, item in enumerate(data):
        qtype = item['question_type']
        question = item['question']
        answer_sids = item['answer_session_ids']
        session_ids = item['haystack_session_ids']
        sessions = item['haystack_sessions']

        # Ingest: embed all turns ONCE
        store = PreIndexedStore(embed_fn)
        store.ingest(sessions)
        total_ingest_time += store.ingest_time
        total_turns_embedded += sum(len(s) for s in sessions)

        # Query: embed question + cosine scan (fast)
        t_q = time.time()
        ranked = store.query(question, session_ids)
        total_query_time += time.time() - t_q

        # Score
        for k in k_values:
            r = recall_at_k(ranked, answer_sids, k)
            n = ndcg_at_k(ranked, answer_sids, k)
            all_recalls[k].append(r)
            all_ndcgs[k].append(n)
            type_recalls[qtype][k].append(r)

        if (i + 1) % 50 == 0:
            elapsed = time.time() - start_time
            print(f"  [{i+1}/{len(data)}] {elapsed:.1f}s elapsed"
                  f" (ingest: {total_ingest_time:.1f}s, query: {total_query_time:.1f}s)")

    total_time = time.time() - start_time

    print(f"\n{'=' * 60}")
    print(f"  RESULTS — Pre-Indexed Turn-Level Embedding")
    print(f"  {len(data)} questions, {total_time:.1f}s total")
    print(f"  Ingest (embed all turns): {total_ingest_time:.1f}s"
          f" ({total_ingest_time/len(data)*1000:.1f}ms/q)")
    print(f"  Query (cosine scan only): {total_query_time:.1f}s"
          f" ({total_query_time/len(data)*1000:.2f}ms/q)")
    print(f"  Total turns embedded: {total_turns_embedded}")
    print(f"{'=' * 60}\n")

    print("  SESSION-LEVEL METRICS:")
    for k in k_values:
        r = sum(all_recalls[k]) / len(all_recalls[k])
        n = sum(all_ndcgs[k]) / len(all_ndcgs[k])
        print(f"    Recall@{k:2d}: {r:.3f}    NDCG@{k:2d}: {n:.3f}")

    print(f"\n  PER-TYPE BREAKDOWN (recall_any@10):")
    for qtype, metrics in sorted(type_recalls.items()):
        r10 = sum(metrics[10]) / len(metrics[10]) if metrics[10] else 0
        print(f"    {qtype:40s} R@10={r10:.3f}  (n={len(metrics[10])})")

    # Comparison
    print(f"\n{'=' * 60}")
    print(f"  FIVE-WAY COMPARISON")
    print(f"{'=' * 60}")
    print(f"  {'Metric':<12} {'MemPalace':>10} {'Keyword':>10} {'Hybrid':>10} {'TurnLvl':>10} {'PreIndex':>10}")
    print(f"  {'-'*12} {'-'*10} {'-'*10} {'-'*10} {'-'*10} {'-'*10}")

    mp  = {'R@1':0.806,'R@3':0.926,'R@5':0.966,'R@10':0.982,'R@30':0.996,'R@50':1.000}
    kw  = {'R@1':0.400,'R@3':0.696,'R@5':0.791,'R@10':0.879,'R@30':0.984,'R@50':1.000}
    hyb = {'R@1':0.480,'R@3':0.802,'R@5':0.882,'R@10':0.918,'R@30':0.964,'R@50':1.000}
    tl  = {'R@1':0.548,'R@3':0.864,'R@5':0.918,'R@10':0.942,'R@30':0.972,'R@50':1.000}

    for k in k_values:
        key = f'R@{k}'
        r = sum(all_recalls[k]) / len(all_recalls[k])
        print(f"  {key:<12} {mp[key]:>10.3f} {kw[key]:>10.3f} {hyb[key]:>10.3f} {tl[key]:>10.3f} {r:>10.3f}")

    print(f"  {'Time':<12} {'1120.2s':>10} {'22.0s':>10} {'381.6s':>10} {'3635.7s':>10} {f'{total_time:.1f}s':>10}")
    print(f"  {'Query ms/q':<12} {'2240':>10} {'44':>10} {'763':>10} {'7271':>10} {f'{total_query_time/len(data)*1000:.1f}':>10}")

    print(f"\n{'=' * 60}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Pre-Indexed × LongMemEval')
    parser.add_argument('data_path', help='Path to longmemeval_s_cleaned.json')
    parser.add_argument('--limit', type=int, default=None)
    args = parser.parse_args()
    run_benchmark(args.data_path, args.limit)
