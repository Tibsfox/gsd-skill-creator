#!/usr/bin/env python3
"""
Wiener Filter on Quantized Embeddings — VAV PoC #3

Tests the prediction from M16 (audio fidelity) mapped to M19 (backup/recovery):
  Wiener denoising applied to quantized (compressed) embedding vectors
  can recover signal quality, paralleling erasure-coded chunk recovery.

Method:
  1. Generate synthetic 128-dimensional embeddings for 100 documents
  2. Quantize embeddings (simulate lossy compression at various bit depths)
  3. Apply Wiener-like spectral denoising to the quantized embeddings
  4. Measure cosine similarity between original and recovered embeddings
  5. Compare: original, quantized (no recovery), Wiener-recovered

The Wiener filter estimates the original signal from noisy observation:
  S_hat(f) = [|H(f)|^2 / (|H(f)|^2 + N(f)/S(f))] * Y(f)

For quantization noise, H(f) = 1 (no channel distortion), so:
  S_hat(f) = [1 / (1 + N(f)/S(f))] * Y(f)
  S_hat(f) = [SNR(f) / (SNR(f) + 1)] * Y(f)

This attenuates frequency bands where noise dominates and preserves
bands where signal dominates.

Run: python3 wiener-embeddings.py
No external dependencies (stdlib only).
"""

import math
import random
import cmath

SEED = 42
random.seed(SEED)

DIM = 128          # Embedding dimension
N_DOCS = 100       # Number of documents
BIT_DEPTHS = [2, 3, 4, 5, 6, 8, 12, 16]  # Quantization levels


def generate_embeddings(n_docs, dim):
    """
    Generate synthetic embeddings with structure.
    Uses a mix of low-frequency (smooth) and high-frequency (detail) components
    to simulate real embedding distributions.
    """
    embeddings = []
    for d in range(n_docs):
        vec = []
        # Low-frequency component (clusters in embedding space)
        cluster = d % 5  # 5 clusters
        base = [(cluster * 0.3 + 0.1 * math.sin(i * math.pi / 16))
                for i in range(dim)]
        # High-frequency detail (per-document variation)
        detail = [0.05 * math.sin(i * math.pi * d / 7) +
                  0.02 * random.gauss(0, 1)
                  for i in range(dim)]
        vec = [b + det for b, det in zip(base, detail)]
        # Normalize to unit length
        norm = math.sqrt(sum(v * v for v in vec))
        vec = [v / norm for v in vec]
        embeddings.append(vec)
    return embeddings


def quantize(vec, bits):
    """
    Uniform quantization to `bits` per dimension.
    Maps [-1, 1] range to 2^bits levels.
    """
    levels = 2 ** bits
    step = 2.0 / levels
    quantized = []
    for v in vec:
        # Clamp to [-1, 1]
        v = max(-1.0, min(1.0, v))
        # Quantize
        level = int((v + 1.0) / step)
        level = min(level, levels - 1)
        # Reconstruct
        reconstructed = -1.0 + (level + 0.5) * step
        quantized.append(reconstructed)
    return quantized


def fft_1d(x):
    """Simple DFT (not FFT) for small vectors. Returns complex spectrum."""
    n = len(x)
    spectrum = []
    for k in range(n):
        s = 0 + 0j
        for t in range(n):
            angle = -2 * math.pi * k * t / n
            s += x[t] * cmath.exp(1j * angle)
        spectrum.append(s)
    return spectrum


def ifft_1d(spectrum):
    """Inverse DFT. Returns real signal."""
    n = len(spectrum)
    signal = []
    for t in range(n):
        s = 0 + 0j
        for k in range(n):
            angle = 2 * math.pi * k * t / n
            s += spectrum[k] * cmath.exp(1j * angle)
        signal.append(s.real / n)
    return signal


def wiener_filter(noisy_vec, noise_variance):
    """
    Apply Wiener filter in frequency domain.

    S_hat(f) = [|Y(f)|^2 - sigma_n^2] / |Y(f)|^2 * Y(f)
             = max(0, 1 - sigma_n^2 / |Y(f)|^2) * Y(f)

    This is the power subtraction form of the Wiener filter,
    equivalent to the SNR form when the noise is white (uniform power).
    """
    # Transform to frequency domain
    Y = fft_1d(noisy_vec)
    n = len(Y)

    # Estimate noise power (uniform across frequencies for quantization noise)
    noise_power = noise_variance * n  # Total noise power distributed across frequencies

    # Apply Wiener filter
    S_hat = []
    for k in range(n):
        signal_power = abs(Y[k]) ** 2
        if signal_power > 0:
            # Wiener gain: attenuate frequencies where noise dominates
            gain = max(0.0, 1.0 - noise_power / (n * signal_power))
            # Soft floor to avoid complete zeroing (spectral floor)
            gain = max(gain, 0.01)
        else:
            gain = 0.0
        S_hat.append(Y[k] * gain)

    # Transform back
    recovered = ifft_1d(S_hat)
    return recovered


def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def mse(a, b):
    """Mean squared error between two vectors."""
    return sum((x - y) ** 2 for x, y in zip(a, b)) / len(a)


def quantization_noise_variance(bits):
    """
    Theoretical quantization noise variance for uniform quantizer.
    For step size delta: var = delta^2 / 12
    """
    levels = 2 ** bits
    delta = 2.0 / levels  # Range [-1, 1]
    return delta ** 2 / 12


def main():
    print("=" * 72)
    print("Wiener Filter on Quantized Embeddings — VAV PoC #3")
    print(f"Dimensions: {DIM}, Documents: {N_DOCS}")
    print("=" * 72)
    print()

    embeddings = generate_embeddings(N_DOCS, DIM)

    # Header
    fmt = ("{:>4} | {:>8} | {:>8} | {:>8} | {:>9} | {:>9} | {:>9} | "
           "{:>8} | {}")
    print(fmt.format(
        "Bits", "Q-Noise", "Cos(Q)", "Cos(W)",
        "MSE(Q)", "MSE(W)", "Improve",
        "Recovery", "Verdict"))
    print("-" * 100)

    results = []
    for bits in BIT_DEPTHS:
        noise_var = quantization_noise_variance(bits)

        cos_q_sum = 0.0
        cos_w_sum = 0.0
        mse_q_sum = 0.0
        mse_w_sum = 0.0

        for emb in embeddings:
            # Quantize
            q = quantize(emb, bits)
            # Wiener filter
            w = wiener_filter(q, noise_var)

            # Metrics
            cos_q_sum += cosine_similarity(emb, q)
            cos_w_sum += cosine_similarity(emb, w)
            mse_q_sum += mse(emb, q)
            mse_w_sum += mse(emb, w)

        cos_q = cos_q_sum / N_DOCS
        cos_w = cos_w_sum / N_DOCS
        mse_q = mse_q_sum / N_DOCS
        mse_w = mse_w_sum / N_DOCS

        # Improvement
        if mse_q > 0:
            mse_improve = (mse_q - mse_w) / mse_q * 100
        else:
            mse_improve = 0.0

        # Recovery ratio (how much of the lost similarity is recovered)
        lost = 1.0 - cos_q
        if lost > 0.001:
            recovered = (cos_w - cos_q) / lost * 100
        else:
            recovered = 0.0

        if mse_improve > 20:
            verdict = "STRONG"
        elif mse_improve > 5:
            verdict = "MODERATE"
        elif mse_improve > 0:
            verdict = "WEAK"
        else:
            verdict = "NONE"

        print(fmt.format(
            bits,
            f"{noise_var:.2e}",
            f"{cos_q:.5f}",
            f"{cos_w:.5f}",
            f"{mse_q:.2e}",
            f"{mse_w:.2e}",
            f"{mse_improve:+.1f}%",
            f"{recovered:+.1f}%",
            verdict
        ))
        results.append((bits, cos_q, cos_w, mse_q, mse_w, mse_improve,
                         recovered, verdict))

    print()
    print("=" * 72)
    print("ANALYSIS")
    print("=" * 72)
    print()

    # Find the sweet spot
    best_improve = max(results, key=lambda r: r[5])
    print(f"Best MSE improvement: {best_improve[0]}-bit quantization "
          f"({best_improve[5]:+.1f}% MSE reduction)")
    print()

    # Regime analysis
    heavy_q = [r for r in results if r[0] <= 4]
    light_q = [r for r in results if r[0] >= 8]
    mid_q = [r for r in results if 4 < r[0] < 8]

    if heavy_q:
        avg_improve = sum(r[5] for r in heavy_q) / len(heavy_q)
        avg_recovery = sum(r[6] for r in heavy_q) / len(heavy_q)
        print(f"Heavy quantization (2-4 bit): avg MSE improvement {avg_improve:+.1f}%, "
              f"avg similarity recovery {avg_recovery:+.1f}%")

    if mid_q:
        avg_improve = sum(r[5] for r in mid_q) / len(mid_q)
        avg_recovery = sum(r[6] for r in mid_q) / len(mid_q)
        print(f"Medium quantization (5-6 bit): avg MSE improvement {avg_improve:+.1f}%, "
              f"avg similarity recovery {avg_recovery:+.1f}%")

    if light_q:
        avg_improve = sum(r[5] for r in light_q) / len(light_q)
        print(f"Light quantization (8-16 bit): avg MSE improvement {avg_improve:+.1f}% "
              f"(diminishing returns)")

    print()
    print("--- Mapping to VAV Architecture ---")
    print()
    print("The Wiener filter / quantized embedding parallel maps to Ceph as follows:")
    print()
    print("  Quantization         = Lossy compression (palette reduction)")
    print("  Quantization noise   = Compression artifact (aliasing)")
    print("  Wiener filter        = Post-read error correction")
    print("  Frequency domain     = Spectral decomposition of embedding structure")
    print("  Low-freq components  = Cluster membership (preserved by quantization)")
    print("  High-freq components = Document-specific detail (damaged by quantization)")
    print("  Wiener gain < 1      = Attenuate noise-dominated frequency bands")
    print("  Wiener gain ~ 1      = Preserve signal-dominated frequency bands")
    print()
    print("The parallel to M16's audio restoration is precise:")
    print("  - Vinyl crackle / tape hiss = quantization noise floor")
    print("  - Spectral denoising        = Wiener filter on compressed embeddings")
    print("  - IRENE optical scanning    = re-reading from higher-fidelity replica")
    print("  - AccurateRip verification  = comparing against ground-truth embedding")
    print()
    print("The parallel to M19's Ceph recovery:")
    print("  - Degraded PG        = quantized embedding (fewer bits = fewer replicas)")
    print("  - Scrubbing           = comparing quantized vs original")
    print("  - Replica repair      = Wiener filter reconstructing from remaining signal")
    print("  - Erasure coding      = spreading information across frequency bands")
    print()

    strong_results = [r for r in results if r[7] == "STRONG"]
    if strong_results:
        print(f"CONFIRMED: Wiener denoising produces measurable recovery at "
              f"{', '.join(f'{r[0]}-bit' for r in strong_results)} quantization.")
        print("The audio-to-embedding mapping is not just analogy — it is the same")
        print("mathematics applied to a different signal domain.")
    else:
        moderate_results = [r for r in results if r[7] == "MODERATE"]
        if moderate_results:
            print(f"PARTIAL: Moderate recovery at "
                  f"{', '.join(f'{r[0]}-bit' for r in moderate_results)} quantization.")
            print("The mapping holds but the effect is smaller than audio restoration")
            print("because embedding quantization noise is more uniformly distributed.")

    print()
    print("=" * 72)
    print("Experiment complete. See M16 section 4-5 and M19 section 9.")
    print("=" * 72)


if __name__ == "__main__":
    main()
