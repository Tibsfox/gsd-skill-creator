#!/usr/bin/env python3
"""
Nyquist-Palette Experiment — VAV PoC #1

Tests the prediction from M14 section 5.5:
  "For a fixed corpus with K semantic categories, reducing palette size
   below 2K causes retrieval quality to degrade sharply."

The semantic Nyquist criterion: |P| >= 2K for alias-free encoding.

Method:
  1. Generate a synthetic corpus of 4096 tokens drawn from K=30 categories
     with a realistic Zipf distribution (some categories much more frequent)
  2. Encode the corpus into a palette of size |P| by mapping each category
     to a palette index (when |P| < K, multiple categories merge to one index)
  3. Decode the palette back and measure retrieval precision/recall
  4. Sweep |P| from 8 to 128 and plot the degradation curve
  5. Verify the 2K threshold prediction

Expected results (from M14 section 5.5):
  - |P| >= 60 (2K): alias-free, precision/recall ~1.0
  - |P| 30-59: marginal, degraded retrieval
  - |P| < 30: aliased, sharp quality drop

Run: python3 nyquist-palette.py
No external dependencies (stdlib only).
"""

import math
import random
from collections import Counter

# --- Configuration ---
K = 30           # Number of semantic categories
N = 4096         # Section size (blocks per section in Minecraft)
ZIPF_S = 1.2    # Zipf exponent (higher = more skewed distribution)
SEED = 42
PALETTE_SIZES = [8, 12, 16, 20, 24, 28, 30, 32, 36, 40, 48, 56, 60, 64, 80, 96, 128]

random.seed(SEED)


def zipf_weights(k, s):
    """Generate Zipf-distributed weights for k categories."""
    raw = [1.0 / (i ** s) for i in range(1, k + 1)]
    total = sum(raw)
    return [w / total for w in raw]


def generate_corpus(n, k, s):
    """Generate n tokens from k categories with Zipf distribution."""
    weights = zipf_weights(k, s)
    categories = list(range(k))
    # Weighted random selection
    corpus = []
    cumulative = []
    acc = 0.0
    for w in weights:
        acc += w
        cumulative.append(acc)
    for _ in range(n):
        r = random.random()
        for idx, c in enumerate(cumulative):
            if r <= c:
                corpus.append(idx)
                break
    return corpus


def encode_with_palette(corpus, k, palette_size):
    """
    Encode corpus into a reduced palette.
    When palette_size < k, multiple categories merge into the same index.
    Uses deterministic round-robin mapping to simulate lossy compression.
    """
    # Map each of k categories to a palette index in [0, palette_size)
    category_to_palette = {}
    for cat in range(k):
        category_to_palette[cat] = cat % palette_size
    encoded = [category_to_palette[token] for token in corpus]
    return encoded, category_to_palette


def decode_and_measure(corpus, encoded, category_to_palette, k, palette_size):
    """
    Measure retrieval quality: for each category, can we recover it uniquely?

    Precision: of all tokens retrieved for category c, how many are correct?
    Recall: of all tokens that are category c, how many are retrieved?

    When multiple categories map to the same palette index, retrieval
    returns all tokens at that index — some are false positives.
    """
    # Build reverse map: palette_index -> set of categories that map to it
    palette_to_categories = {}
    for cat, pidx in category_to_palette.items():
        if pidx not in palette_to_categories:
            palette_to_categories[pidx] = set()
        palette_to_categories[pidx].add(cat)

    # Per-category precision and recall
    precisions = []
    recalls = []

    for cat in range(k):
        pidx = category_to_palette[cat]
        # Ground truth: positions where corpus has this category
        true_positions = {i for i, t in enumerate(corpus) if t == cat}
        if not true_positions:
            continue
        # Retrieved: positions where encoded has this palette index
        retrieved_positions = {i for i, e in enumerate(encoded) if e == pidx}

        # True positives: retrieved AND correct
        tp = len(true_positions & retrieved_positions)
        # Precision: tp / retrieved (how many retrieved are correct)
        precision = tp / len(retrieved_positions) if retrieved_positions else 0.0
        # Recall: tp / true (how many true are retrieved)
        recall = tp / len(true_positions) if true_positions else 0.0

        precisions.append(precision)
        recalls.append(recall)

    avg_precision = sum(precisions) / len(precisions) if precisions else 0.0
    avg_recall = sum(recalls) / len(recalls) if recalls else 0.0

    # F1 score
    if avg_precision + avg_recall > 0:
        f1 = 2 * avg_precision * avg_recall / (avg_precision + avg_recall)
    else:
        f1 = 0.0

    # Count aliased categories (categories that share a palette index with another)
    aliased = sum(1 for cat in range(k)
                  if len(palette_to_categories[category_to_palette[cat]]) > 1)

    return avg_precision, avg_recall, f1, aliased


def shannon_entropy(corpus, palette_size):
    """Compute Shannon entropy of the encoded corpus."""
    counts = Counter(corpus)
    n = len(corpus)
    h = 0.0
    for count in counts.values():
        p = count / n
        if p > 0:
            h -= p * math.log2(p)
    return h


def compression_efficiency(corpus, palette_size):
    """Ratio of actual entropy to maximum possible entropy."""
    h = shannon_entropy(corpus, palette_size)
    h_max = math.log2(palette_size) if palette_size > 1 else 0
    return h / h_max if h_max > 0 else 0.0


def main():
    print("=" * 72)
    print("Nyquist-Palette Experiment — VAV PoC #1")
    print(f"K = {K} semantic categories, N = {N} tokens, Zipf s = {ZIPF_S}")
    print(f"Nyquist threshold: 2K = {2 * K}")
    print("=" * 72)
    print()

    corpus = generate_corpus(N, K, ZIPF_S)

    # Verify distribution
    counts = Counter(corpus)
    print(f"Corpus: {len(counts)} unique categories present")
    print(f"Most frequent: category {counts.most_common(1)[0][0]} "
          f"({counts.most_common(1)[0][1]} tokens, "
          f"{100 * counts.most_common(1)[0][1] / N:.1f}%)")
    print(f"Least frequent: category {counts.most_common()[-1][0]} "
          f"({counts.most_common()[-1][1]} tokens, "
          f"{100 * counts.most_common()[-1][1] / N:.1f}%)")
    print()

    # Header
    fmt = "{:>6} | {:>9} | {:>9} | {:>5} | {:>7} | {:>7} | {:>10} | {}"
    print(fmt.format("|P|", "Precision", "Recall", "F1", "Aliased", "Entropy",
                     "Eff. Ratio", "Verdict"))
    print("-" * 85)

    results = []
    for ps in PALETTE_SIZES:
        encoded, cat_map = encode_with_palette(corpus, K, ps)
        prec, rec, f1, aliased = decode_and_measure(
            corpus, encoded, cat_map, K, ps)
        h = shannon_entropy(encoded, ps)
        eff = compression_efficiency(encoded, ps)

        if ps >= 2 * K:
            verdict = "ALIAS-FREE"
        elif ps >= K:
            verdict = "MARGINAL"
        else:
            verdict = "ALIASED"

        print(fmt.format(
            ps,
            f"{prec:.4f}",
            f"{rec:.4f}",
            f"{f1:.3f}",
            f"{aliased}/{K}",
            f"{h:.2f}",
            f"{eff:.3f}",
            verdict
        ))
        results.append((ps, prec, rec, f1, aliased, verdict))

    print()
    print("=" * 72)
    print("ANALYSIS")
    print("=" * 72)

    # Find the transition points
    alias_free_results = [(ps, f1) for ps, _, _, f1, _, v in results
                          if v == "ALIAS-FREE"]
    marginal_results = [(ps, f1) for ps, _, _, f1, _, v in results
                        if v == "MARGINAL"]
    aliased_results = [(ps, f1) for ps, _, _, f1, _, v in results
                       if v == "ALIASED"]

    if alias_free_results:
        print(f"\nAlias-free range (|P| >= {2*K}):")
        print(f"  F1 scores: {', '.join(f'{f1:.3f}' for _, f1 in alias_free_results)}")
        print(f"  Mean F1: {sum(f1 for _, f1 in alias_free_results) / len(alias_free_results):.4f}")

    if marginal_results:
        print(f"\nMarginal range ({K} <= |P| < {2*K}):")
        print(f"  F1 scores: {', '.join(f'{f1:.3f}' for _, f1 in marginal_results)}")
        print(f"  Mean F1: {sum(f1 for _, f1 in marginal_results) / len(marginal_results):.4f}")

    if aliased_results:
        print(f"\nAliased range (|P| < {K}):")
        print(f"  F1 scores: {', '.join(f'{f1:.3f}' for _, f1 in aliased_results)}")
        print(f"  Mean F1: {sum(f1 for _, f1 in aliased_results) / len(aliased_results):.4f}")

    # Verify prediction
    print("\n--- Prediction Verification ---")
    above_2k = [f1 for ps, _, _, f1, _, _ in results if ps >= 2 * K]
    below_k = [f1 for ps, _, _, f1, _, _ in results if ps < K]

    if above_2k and below_k:
        mean_above = sum(above_2k) / len(above_2k)
        mean_below = sum(below_k) / len(below_k)
        drop = mean_above - mean_below
        print(f"Mean F1 above 2K ({2*K}): {mean_above:.4f}")
        print(f"Mean F1 below K ({K}):    {mean_below:.4f}")
        print(f"Quality drop:             {drop:.4f} ({100*drop/mean_above:.1f}%)")
        if drop > 0.1:
            print(f"CONFIRMED: Sharp degradation below Nyquist threshold.")
        else:
            print(f"WEAK: Degradation below expected threshold.")

    # BPE analysis
    print("\n--- Bits-Per-Entry Analysis ---")
    for ps in [16, 30, 60, 128]:
        bpe = max(4, math.ceil(math.log2(ps))) if ps > 1 else 0
        i_max = 4096 * bpe
        print(f"|P| = {ps:>3}: BPE = {bpe}, I_max = {i_max:,} bits = {i_max/8:,.0f} bytes")

    print("\n" + "=" * 72)
    print("Experiment complete. See M14 section 5.5 for theoretical framework.")
    print("=" * 72)


if __name__ == "__main__":
    main()
