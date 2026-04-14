#!/usr/bin/env python3
"""
Grove × LongMemEval Benchmark
===============================

Evaluates our structural retrieval approach against the LongMemEval benchmark
using the same 500 questions and scoring methodology as MemPalace.

Our retrieval approach:
  - No embeddings, no vector similarity, no LLM calls
  - Keyword extraction from the question
  - Structural session matching (keyword overlap scoring)
  - TF-IDF-weighted ranking

This measures pure structural retrieval — the same approach our
GroveNamespace.searchByKeyword() and TripleStore.search() use,
applied to the LongMemEval dataset for direct comparison.

Usage:
    python benchmarks/longmemeval_grove.py /tmp/longmemeval-data/longmemeval_s_cleaned.json
    python benchmarks/longmemeval_grove.py /tmp/longmemeval-data/longmemeval_s_cleaned.json --limit 20
"""

import json
import sys
import argparse
import math
import re
import time
from collections import Counter, defaultdict
from pathlib import Path

# =============================================================================
# METRICS (same as mempalace for direct comparison)
# =============================================================================

def recall_at_k(retrieved, relevant, k):
    """Fraction of relevant items found in top-k."""
    if not relevant:
        return 1.0
    top_k = set(retrieved[:k])
    return len(top_k & set(relevant)) / len(set(relevant))


def ndcg_at_k(retrieved, relevant, k):
    """Normalized Discounted Cumulative Gain at k."""
    if not relevant:
        return 1.0
    rel_set = set(relevant)
    dcg = sum(
        1.0 / math.log2(i + 2) for i, sid in enumerate(retrieved[:k]) if sid in rel_set
    )
    ideal = sum(1.0 / math.log2(i + 2) for i in range(min(k, len(rel_set))))
    return dcg / ideal if ideal > 0 else 0.0


# =============================================================================
# STRUCTURAL RETRIEVAL ENGINE
# =============================================================================

# Stop words to exclude from keyword extraction
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
    """Split text into lowercase word tokens."""
    return re.findall(r'\b[a-z]+(?:\'[a-z]+)?\b', text.lower())


def extract_keywords(question):
    """Extract meaningful keywords from a question."""
    tokens = tokenize(question)
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 2]


def session_to_text(session):
    """Flatten a session (list of turns) into a single text."""
    parts = []
    for turn in session:
        if isinstance(turn, dict):
            parts.append(turn.get('content', ''))
        elif isinstance(turn, str):
            parts.append(turn)
    return ' '.join(parts)


def score_session(keywords, session_text, session_tokens):
    """Score a session against query keywords using TF-IDF-like weighting."""
    if not keywords or not session_tokens:
        return 0.0

    # Term frequency in session
    tf = Counter(session_tokens)
    total_tokens = len(session_tokens)

    score = 0.0
    for kw in keywords:
        if kw in tf:
            # TF component: frequency normalized by document length
            term_freq = tf[kw] / total_tokens
            # Boost exact multi-word matches
            if kw in session_text.lower():
                term_freq *= 1.5
            score += term_freq

    return score


def retrieve_sessions(question, sessions, session_ids, top_k=50):
    """
    Retrieve the most relevant session IDs for a question.
    Uses keyword overlap with TF-IDF-like scoring.
    """
    keywords = extract_keywords(question)
    if not keywords:
        return list(range(len(sessions)))[:top_k]

    # Pre-tokenize all sessions
    scored = []
    for i, session in enumerate(sessions):
        text = session_to_text(session)
        tokens = tokenize(text)
        s = score_session(keywords, text, tokens)
        scored.append((s, session_ids[i]))

    # Sort by score descending, break ties by original order
    scored.sort(key=lambda x: -x[0])
    return [sid for _, sid in scored]


# =============================================================================
# BENCHMARK RUNNER
# =============================================================================

def run_benchmark(data_path, limit=None):
    """Run the full LongMemEval benchmark with structural retrieval."""
    with open(data_path) as f:
        data = json.load(f)

    if limit:
        data = data[:limit]

    print(f"\n{'=' * 60}")
    print(f"  Grove Structural Retrieval × LongMemEval")
    print(f"  Questions: {len(data)}")
    print(f"  Method: Keyword TF-IDF (no embeddings, no LLM)")
    print(f"{'=' * 60}\n")

    k_values = [1, 3, 5, 10, 30, 50]
    all_recalls = {k: [] for k in k_values}
    all_ndcgs = {k: [] for k in k_values}
    type_recalls = defaultdict(lambda: {k: [] for k in k_values})

    start_time = time.time()

    for i, item in enumerate(data):
        qid = item['question_id']
        qtype = item['question_type']
        question = item['question']
        answer_sids = item['answer_session_ids']
        session_ids = item['haystack_session_ids']
        sessions = item['haystack_sessions']

        # Retrieve
        ranked = retrieve_sessions(question, sessions, session_ids)

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

    elapsed = time.time() - start_time

    # Print results
    print(f"\n{'=' * 60}")
    print(f"  RESULTS — Grove Structural Retrieval")
    print(f"  {len(data)} questions, {elapsed:.1f}s")
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

    print(f"\n{'=' * 60}")

    # Return summary for comparison
    return {
        'recall_5': sum(all_recalls[5]) / len(all_recalls[5]),
        'recall_10': sum(all_recalls[10]) / len(all_recalls[10]),
        'ndcg_10': sum(all_ndcgs[10]) / len(all_ndcgs[10]),
        'elapsed': elapsed,
        'questions': len(data),
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Grove × LongMemEval')
    parser.add_argument('data_path', help='Path to longmemeval_s_cleaned.json')
    parser.add_argument('--limit', type=int, default=None, help='Limit to N questions')
    args = parser.parse_args()
    run_benchmark(args.data_path, args.limit)
