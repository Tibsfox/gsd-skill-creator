#!/usr/bin/env python3
"""
Hybrid Retrieval × LongMemEval Benchmark
==========================================

Two-phase retrieval combining the speed of keyword TF-IDF with the
ranking precision of embedding similarity:

  Phase 1: Keyword TF-IDF pre-filter → top K candidates (fast, ~0.04s/question)
  Phase 2: all-MiniLM-L6-v2 embedding rerank on candidates only (~0.1s/question)

This should achieve near-MemPalace ranking quality (R@5 ≈ 0.96) at a fraction
of the cost, since we embed only ~15 sessions per question instead of 53.

Comparison targets:
  MemPalace (full ChromaDB):  R@5=0.966, 1120s  (2.24s/q)
  Grove (keyword only):       R@5=0.791,   22s  (0.04s/q)
  Hybrid (target):            R@5≈0.94+,  ~60s  (0.12s/q)

Usage:
    # Run with mempal venv (has chromadb + onnxruntime):
    /tmp/mempal-bench/.venv/bin/python benchmarks/longmemeval_hybrid.py \\
        /tmp/longmemeval-data/longmemeval_s_cleaned.json

    /tmp/mempal-bench/.venv/bin/python benchmarks/longmemeval_hybrid.py \\
        /tmp/longmemeval-data/longmemeval_s_cleaned.json --limit 20

    # Tune pre-filter width:
    --prefilter-k 20   (wider pre-filter, slower but higher recall ceiling)
    --prefilter-k 10   (narrower, faster, may miss some)
"""

import json
import sys
import argparse
import math
import re
import time
import numpy as np
from collections import Counter, defaultdict
from pathlib import Path

# Embedding function — all-MiniLM-L6-v2 via onnxruntime (384-dim)
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

# =============================================================================
# METRICS (identical to mempalace and grove benchmarks)
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
    dcg = sum(
        1.0 / math.log2(i + 2) for i, sid in enumerate(retrieved[:k]) if sid in rel_set
    )
    ideal = sum(1.0 / math.log2(i + 2) for i in range(min(k, len(rel_set))))
    return dcg / ideal if ideal > 0 else 0.0


# =============================================================================
# PHASE 1: KEYWORD TF-IDF PRE-FILTER (from longmemeval_grove.py)
# =============================================================================

STOP_WORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'he',
    'she', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
    'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
    'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or',
    'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'through', 'during', 'before', 'after',
    'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off',
    'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
    'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
    'don', 'should', 'now', 'could', 'would', 'also', 'like', 'get',
    'make', 'know', 'think', 'want', 'tell', 'said', 'one', 'two',
}


def tokenize(text):
    return re.findall(r'\b[a-z]+(?:\'[a-z]+)?\b', text.lower())


def extract_keywords(question):
    tokens = tokenize(question)
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 2]


def session_to_text(session):
    parts = []
    for turn in session:
        if isinstance(turn, dict):
            parts.append(turn.get('content', ''))
        elif isinstance(turn, str):
            parts.append(turn)
    return ' '.join(parts)


def keyword_score(keywords, session_tokens, session_text):
    if not keywords or not session_tokens:
        return 0.0
    tf = Counter(session_tokens)
    total = len(session_tokens)
    score = 0.0
    for kw in keywords:
        if kw in tf:
            term_freq = tf[kw] / total
            if kw in session_text.lower():
                term_freq *= 1.5
            score += term_freq
    return score


def prefilter_sessions(question, sessions, session_ids, top_k=15):
    """Phase 1: keyword TF-IDF pre-filter. Returns top_k candidate indices."""
    keywords = extract_keywords(question)
    if not keywords:
        return list(range(min(top_k, len(sessions))))

    scored = []
    for i, session in enumerate(sessions):
        text = session_to_text(session)
        tokens = tokenize(text)
        s = keyword_score(keywords, tokens, text)
        scored.append((s, i))

    scored.sort(key=lambda x: -x[0])
    return [idx for _, idx in scored[:top_k]]


# =============================================================================
# PHASE 2: EMBEDDING RERANK
# =============================================================================

def cosine_similarity(a, b):
    """Cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    return dot / norm if norm > 0 else 0.0


def embedding_rerank(question, candidate_indices, sessions, session_ids, embed_fn):
    """
    Phase 2: embed question + candidates, rerank by cosine similarity.
    Returns full ranked list: reranked candidates first, then remaining sessions.
    """
    # Build texts for embedding — truncate to 512 chars per session
    # (MiniLM max sequence = 256 tokens ≈ 1024 chars; shorter = faster)
    MAX_EMBED_CHARS = 512
    candidate_texts = []
    for idx in candidate_indices:
        text = session_to_text(sessions[idx])
        candidate_texts.append(text[:MAX_EMBED_CHARS] if len(text) > MAX_EMBED_CHARS else text)

    # Batch embed: question + all candidates in one call
    all_texts = [question] + candidate_texts
    embeddings = embed_fn(all_texts)

    query_emb = embeddings[0]
    candidate_embs = embeddings[1:]

    # Score each candidate by cosine similarity
    scored = []
    for i, idx in enumerate(candidate_indices):
        sim = cosine_similarity(query_emb, candidate_embs[i])
        scored.append((sim, session_ids[idx]))

    scored.sort(key=lambda x: -x[0])
    reranked_ids = [sid for _, sid in scored]

    # Append remaining sessions (not in candidates) in original order
    candidate_set = set(candidate_indices)
    remaining = [session_ids[i] for i in range(len(sessions)) if i not in candidate_set]
    return reranked_ids + remaining


# =============================================================================
# HYBRID RETRIEVAL
# =============================================================================

def hybrid_retrieve(question, sessions, session_ids, embed_fn, prefilter_k=15):
    """
    Two-phase retrieval:
      1. Keyword TF-IDF → top prefilter_k candidates
      2. Embedding cosine similarity → rerank candidates
    """
    # Phase 1: fast keyword pre-filter
    candidate_indices = prefilter_sessions(question, sessions, session_ids, top_k=prefilter_k)

    # Phase 2: embedding rerank on candidates only
    return embedding_rerank(question, candidate_indices, sessions, session_ids, embed_fn)


# =============================================================================
# BENCHMARK RUNNER
# =============================================================================

def run_benchmark(data_path, limit=None, prefilter_k=15):
    with open(data_path) as f:
        data = json.load(f)

    if limit:
        data = data[:limit]

    # Initialize embedding function (loads model on first call)
    print("  Loading embedding model (all-MiniLM-L6-v2 via onnxruntime)...")
    embed_fn = DefaultEmbeddingFunction()
    # Warm up
    embed_fn(["warmup"])

    print(f"\n{'=' * 60}")
    print(f"  Hybrid Retrieval × LongMemEval")
    print(f"  Questions: {len(data)}")
    print(f"  Method: Keyword TF-IDF pre-filter (K={prefilter_k}) + embedding rerank")
    print(f"  Model: all-MiniLM-L6-v2 (384-dim, onnxruntime)")
    print(f"{'=' * 60}\n")

    k_values = [1, 3, 5, 10, 30, 50]
    all_recalls = {k: [] for k in k_values}
    all_ndcgs = {k: [] for k in k_values}
    type_recalls = defaultdict(lambda: {k: [] for k in k_values})

    phase1_time = 0.0
    phase2_time = 0.0
    start_time = time.time()

    for i, item in enumerate(data):
        qtype = item['question_type']
        question = item['question']
        answer_sids = item['answer_session_ids']
        session_ids = item['haystack_session_ids']
        sessions = item['haystack_sessions']

        # Phase 1 timing
        t1 = time.time()
        candidate_indices = prefilter_sessions(question, sessions, session_ids, top_k=prefilter_k)
        phase1_time += time.time() - t1

        # Phase 2 timing
        t2 = time.time()
        ranked = embedding_rerank(question, candidate_indices, sessions, session_ids, embed_fn)
        phase2_time += time.time() - t2

        # Score
        for k in k_values:
            r = recall_at_k(ranked, answer_sids, k)
            n = ndcg_at_k(ranked, answer_sids, k)
            all_recalls[k].append(r)
            all_ndcgs[k].append(n)
            type_recalls[qtype][k].append(r)

        if (i + 1) % 50 == 0:
            elapsed = time.time() - start_time
            print(f"  [{i+1}/{len(data)}] {elapsed:.1f}s elapsed")

    total_time = time.time() - start_time

    # Print results
    print(f"\n{'=' * 60}")
    print(f"  RESULTS — Hybrid Retrieval (TF-IDF + Embedding)")
    print(f"  {len(data)} questions, {total_time:.1f}s total")
    print(f"  Phase 1 (keyword): {phase1_time:.1f}s ({phase1_time/len(data)*1000:.1f}ms/q)")
    print(f"  Phase 2 (embed):   {phase2_time:.1f}s ({phase2_time/len(data)*1000:.1f}ms/q)")
    print(f"  Pre-filter K: {prefilter_k}")
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

    # Comparison table
    print(f"\n{'=' * 60}")
    print(f"  THREE-WAY COMPARISON")
    print(f"{'=' * 60}")
    print(f"  {'Metric':<12} {'MemPalace':>10} {'Grove':>10} {'Hybrid':>10}")
    print(f"  {'-'*12} {'-'*10} {'-'*10} {'-'*10}")

    mempal = {'R@1': 0.806, 'R@3': 0.926, 'R@5': 0.966, 'R@10': 0.982, 'R@30': 0.996, 'R@50': 1.000}
    grove =  {'R@1': 0.400, 'R@3': 0.696, 'R@5': 0.791, 'R@10': 0.879, 'R@30': 0.984, 'R@50': 1.000}

    for k in k_values:
        key = f'R@{k}'
        r = sum(all_recalls[k]) / len(all_recalls[k])
        mp = mempal.get(key, 0)
        gr = grove.get(key, 0)
        best = '***' if r >= mp else ('**' if r > gr else '')
        print(f"  {key:<12} {mp:>10.3f} {gr:>10.3f} {r:>10.3f} {best}")

    mp_time, gr_time = 1120.2, 22.0
    print(f"  {'Time':<12} {mp_time:>9.1f}s {gr_time:>9.1f}s {total_time:>9.1f}s")
    speedup_vs_mp = mp_time / total_time
    print(f"  {'vs MemPalace':<12} {'1.0x':>10} {mp_time/gr_time:>9.1f}x {speedup_vs_mp:>9.1f}x")

    print(f"\n{'=' * 60}")

    return {
        'recall_5': sum(all_recalls[5]) / len(all_recalls[5]),
        'recall_10': sum(all_recalls[10]) / len(all_recalls[10]),
        'ndcg_10': sum(all_ndcgs[10]) / len(all_ndcgs[10]),
        'total_time': total_time,
        'phase1_time': phase1_time,
        'phase2_time': phase2_time,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Hybrid × LongMemEval')
    parser.add_argument('data_path', help='Path to longmemeval_s_cleaned.json')
    parser.add_argument('--limit', type=int, default=None)
    parser.add_argument('--prefilter-k', type=int, default=15, help='Pre-filter width (default: 15)')
    args = parser.parse_args()
    run_benchmark(args.data_path, args.limit, args.prefilter_k)
