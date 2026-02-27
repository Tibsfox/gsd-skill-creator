/**
 * Python script generator for the PyDMD knowledge skill.
 * Transforms a KnowledgeGraph into 3 self-contained Python helper scripts.
 */

import type { KnowledgeGraph, AlgorithmVariant } from '../types.js';

/** Set of 3 generated Python scripts. */
export interface ScriptSet {
  /** Minimal DMD analysis script (~50-80 lines). */
  quickDmd: string;
  /** Side-by-side variant comparison script (~80-120 lines). */
  compareVariants: string;
  /** Mode visualization script (~60-100 lines). */
  visualizeModes: string;
}

/**
 * Generate 3 self-contained Python scripts from a KnowledgeGraph.
 * Each script includes docstrings, argparse, and __main__ guard.
 */
export function generateScripts(graph: KnowledgeGraph): ScriptSet {
  return {
    quickDmd: generateQuickDmd(graph),
    compareVariants: generateCompareVariants(graph),
    visualizeModes: generateVisualizeModes(graph),
  };
}

// --- Quick DMD Script ---

function generateQuickDmd(graph: KnowledgeGraph): string {
  return `#!/usr/bin/env python3
"""
Quick DMD Analysis Script
=========================

Minimal Dynamic Mode Decomposition analysis in Python using PyDMD.
Generates sample data, applies standard DMD, and prints key diagnostics.

Usage:
    python quick-dmd.py
    python quick-dmd.py --source file --path data.npy
    python quick-dmd.py --rank 10 --output results.txt
"""

import argparse
import sys

import numpy as np
from pydmd import DMD


def generate_sample_data(n_space: int = 64, n_time: int = 128) -> np.ndarray:
    """Generate sample spatiotemporal data with two oscillating modes."""
    x = np.linspace(0, 2 * np.pi, n_space)
    t = np.linspace(0, 4 * np.pi, n_time)

    # Two modes: slow oscillation + fast oscillation with decay
    mode1 = np.sin(x)[:, None] * np.exp(1j * 0.5 * t)[None, :]
    mode2 = np.cos(2 * x)[:, None] * np.exp((-0.1 + 1j * 2.3) * t)[None, :]

    return np.real(mode1 + 0.5 * mode2)


def load_data(source: str, path: str | None) -> np.ndarray:
    """Load data from file or generate sample."""
    if source == "generate":
        print("Generating sample spatiotemporal data...")
        return generate_sample_data()
    elif source == "file" and path:
        print(f"Loading data from {path}...")
        return np.load(path)
    else:
        print("Error: --path required when --source is 'file'", file=sys.stderr)
        sys.exit(1)


def run_dmd(data: np.ndarray, svd_rank: int) -> DMD:
    """Fit a standard DMD model to the data."""
    dmd = DMD(svd_rank=svd_rank)
    dmd.fit(data)
    return dmd


def print_diagnostics(dmd: DMD, data: np.ndarray) -> str:
    """Print key DMD diagnostics and return summary."""
    eigenvalues = dmd.eigs
    recon_error = np.linalg.norm(data - dmd.reconstructed_data.real) / np.linalg.norm(data)

    lines = [
        f"DMD Analysis Results",
        f"{'=' * 40}",
        f"Number of modes:        {len(eigenvalues)}",
        f"Reconstruction error:   {recon_error:.6f}",
        f"",
        f"Eigenvalues:",
    ]
    for i, eig in enumerate(eigenvalues):
        lines.append(f"  Mode {i+1}: |lambda| = {abs(eig):.4f}, freq = {np.angle(eig):.4f}")

    summary = "\\n".join(lines)
    print(summary)
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Quick DMD analysis using PyDMD")
    parser.add_argument("--source", choices=["generate", "file"], default="generate",
                        help="Data source: generate sample or load from file")
    parser.add_argument("--path", type=str, default=None,
                        help="Path to .npy data file (required if --source is 'file')")
    parser.add_argument("--rank", type=int, default=-1,
                        help="SVD rank truncation (-1 for automatic)")
    parser.add_argument("--output", type=str, default=None,
                        help="Output file for results (default: stdout)")
    args = parser.parse_args()

    data = load_data(args.source, args.path)
    dmd = run_dmd(data, args.rank)
    summary = print_diagnostics(dmd, data)

    if args.output:
        with open(args.output, "w") as f:
            f.write(summary)
        print(f"\\nResults saved to {args.output}")


if __name__ == "__main__":
    main()
`;
}

// --- Compare Variants Script ---

function generateCompareVariants(graph: KnowledgeGraph): string {
  // Pick representative variant class names from the knowledge graph
  const allVariants = graph.concepts.algorithmic;
  const representativeVariants = selectRepresentativeVariants(allVariants);

  const importLines = representativeVariants
    .map(v => `from pydmd import ${v.class}`)
    .join('\n');

  const variantMapEntries = representativeVariants
    .map(v => `    "${v.class}": ${v.class}`)
    .join(',\n');

  const defaultVariants = representativeVariants
    .slice(0, 4)
    .map(v => `"${v.class}"`)
    .join(', ');

  return `#!/usr/bin/env python3
"""
Compare DMD Variants Script
============================

Side-by-side comparison of multiple DMD algorithm variants on the same dataset.
Compares eigenvalues, reconstruction error, and computation time.

Usage:
    python compare-variants.py
    python compare-variants.py --variants DMD BOPDMD MrDMD
    python compare-variants.py --data data.npy --rank 10
"""

import argparse
import time
import sys

import numpy as np
${importLines}


VARIANT_MAP = {
${variantMapEntries},
}


def generate_test_data(n_space: int = 64, n_time: int = 128,
                       noise_level: float = 0.1) -> np.ndarray:
    """Generate test data with multiple modes and optional noise."""
    x = np.linspace(0, 2 * np.pi, n_space)
    t = np.linspace(0, 4 * np.pi, n_time)

    mode1 = np.sin(x)[:, None] * np.exp(1j * 0.5 * t)[None, :]
    mode2 = np.cos(2 * x)[:, None] * np.exp((-0.05 + 1j * 2.0) * t)[None, :]
    mode3 = np.sin(3 * x)[:, None] * np.exp(1j * 4.5 * t)[None, :]

    data = np.real(mode1 + 0.5 * mode2 + 0.3 * mode3)
    if noise_level > 0:
        data += noise_level * np.random.randn(*data.shape)
    return data


def compare_variants(data: np.ndarray, variant_names: list[str],
                     svd_rank: int) -> list[dict]:
    """Run each variant and collect comparison metrics."""
    results = []
    for name in variant_names:
        if name not in VARIANT_MAP:
            print(f"Warning: Unknown variant '{name}', skipping.", file=sys.stderr)
            continue

        cls = VARIANT_MAP[name]
        try:
            model = cls(svd_rank=svd_rank)
            t0 = time.perf_counter()
            model.fit(data)
            elapsed = time.perf_counter() - t0

            eigs = model.eigs
            recon = model.reconstructed_data.real
            error = np.linalg.norm(data - recon) / np.linalg.norm(data)

            results.append({
                "variant": name,
                "n_modes": len(eigs),
                "recon_error": error,
                "time_sec": elapsed,
                "max_eig_magnitude": float(np.max(np.abs(eigs))),
                "min_eig_magnitude": float(np.min(np.abs(eigs))),
            })
        except Exception as exc:
            results.append({
                "variant": name,
                "error": str(exc),
            })

    return results


def print_comparison(results: list[dict]) -> None:
    """Print a formatted comparison table."""
    header = f"{'Variant':<18} {'Modes':>6} {'Error':>10} {'Time (s)':>10} {'|eig| max':>10}"
    print(header)
    print("-" * len(header))

    for r in results:
        if "error" in r:
            print(f"{r['variant']:<18} ERROR: {r['error']}")
        else:
            print(f"{r['variant']:<18} {r['n_modes']:>6} {r['recon_error']:>10.6f} "
                  f"{r['time_sec']:>10.4f} {r['max_eig_magnitude']:>10.4f}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compare DMD variants side-by-side"
    )
    parser.add_argument("--variants", nargs="+",
                        default=[${defaultVariants}],
                        help="Variant class names to compare")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to .npy data file (generates sample if not given)")
    parser.add_argument("--rank", type=int, default=-1,
                        help="SVD rank truncation")
    parser.add_argument("--noise", type=float, default=0.1,
                        help="Noise level for generated data")
    args = parser.parse_args()

    if args.data:
        data = np.load(args.data)
    else:
        data = generate_test_data(noise_level=args.noise)

    print(f"Comparing {len(args.variants)} variants on data shape {data.shape}\\n")
    results = compare_variants(data, args.variants, args.rank)
    print_comparison(results)


if __name__ == "__main__":
    main()
`;
}

/**
 * Select a representative set of variants for the comparison script.
 * Returns at least 5 variants covering different categories.
 */
function selectRepresentativeVariants(variants: AlgorithmVariant[]): AlgorithmVariant[] {
  if (variants.length <= 6) return variants;

  // Always include standard DMD, then pick diverse representatives
  const selected: AlgorithmVariant[] = [];
  const classSet = new Set<string>();

  // Priority classes for comparison
  const priorityClasses = ['DMD', 'BOPDMD', 'MrDMD', 'DMDc', 'EDMD', 'OptDMD', 'SpDMD', 'HankelDMD'];

  for (const cls of priorityClasses) {
    const variant = variants.find(v => v.class === cls);
    if (variant && !classSet.has(variant.class)) {
      selected.push(variant);
      classSet.add(variant.class);
    }
  }

  // Fill remaining up to 8
  for (const v of variants) {
    if (selected.length >= 8) break;
    if (!classSet.has(v.class)) {
      selected.push(v);
      classSet.add(v.class);
    }
  }

  return selected;
}

// --- Visualize Modes Script ---

function generateVisualizeModes(graph: KnowledgeGraph): string {
  return `#!/usr/bin/env python3
"""
Visualize DMD Modes Script
===========================

Plot spatial modes, temporal dynamics, and eigenvalues from a fitted DMD model.
Produces publication-ready figures using matplotlib.

Usage:
    python visualize-modes.py
    python visualize-modes.py --data data.npy --rank 5
    python visualize-modes.py --output modes.png --format png
"""

import argparse
import sys

import numpy as np
from matplotlib import pyplot as plt
from matplotlib.patches import Circle
from pydmd import DMD


def generate_sample_data(n_space: int = 64, n_time: int = 128) -> np.ndarray:
    """Generate sample spatiotemporal data with clear modal structure."""
    x = np.linspace(0, 2 * np.pi, n_space)
    t = np.linspace(0, 4 * np.pi, n_time)

    mode1 = np.sin(x)[:, None] * np.exp(1j * 0.5 * t)[None, :]
    mode2 = np.cos(2 * x)[:, None] * np.exp((-0.1 + 1j * 2.3) * t)[None, :]
    return np.real(mode1 + 0.5 * mode2)


def plot_eigenvalues(ax: plt.Axes, eigs: np.ndarray) -> None:
    """Plot eigenvalues on the complex plane with unit circle."""
    circle = Circle((0, 0), 1, fill=False, color="gray", linestyle="--", linewidth=0.8)
    ax.add_patch(circle)
    ax.scatter(eigs.real, eigs.imag, c="tab:blue", s=60, zorder=3, edgecolors="black", linewidths=0.5)
    ax.set_xlabel("Real")
    ax.set_ylabel("Imaginary")
    ax.set_title("DMD Eigenvalues")
    ax.set_aspect("equal")
    ax.axhline(0, color="gray", linewidth=0.5)
    ax.axvline(0, color="gray", linewidth=0.5)
    ax.grid(True, alpha=0.3)


def plot_modes(ax: plt.Axes, modes: np.ndarray, n_modes: int = 4) -> None:
    """Plot the first n spatial modes."""
    for i in range(min(n_modes, modes.shape[1])):
        ax.plot(modes[:, i].real, label=f"Mode {i+1}", linewidth=1.2)
    ax.set_xlabel("Spatial index")
    ax.set_ylabel("Amplitude")
    ax.set_title("Spatial Modes")
    ax.legend(fontsize=8)
    ax.grid(True, alpha=0.3)


def plot_dynamics(ax: plt.Axes, dynamics: np.ndarray, n_modes: int = 4) -> None:
    """Plot temporal dynamics for the first n modes."""
    for i in range(min(n_modes, dynamics.shape[0])):
        ax.plot(dynamics[i].real, label=f"Mode {i+1}", linewidth=1.2)
    ax.set_xlabel("Time step")
    ax.set_ylabel("Amplitude")
    ax.set_title("Temporal Dynamics")
    ax.legend(fontsize=8)
    ax.grid(True, alpha=0.3)


def main() -> None:
    parser = argparse.ArgumentParser(description="Visualize DMD modes and eigenvalues")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to .npy data file (generates sample if not given)")
    parser.add_argument("--rank", type=int, default=-1,
                        help="SVD rank truncation")
    parser.add_argument("--output", type=str, default=None,
                        help="Output file path (shows interactive plot if not given)")
    parser.add_argument("--format", type=str, default="png",
                        choices=["png", "pdf", "svg"],
                        help="Output file format")
    parser.add_argument("--n-modes", type=int, default=4,
                        help="Number of modes to plot")
    args = parser.parse_args()

    if args.data:
        data = np.load(args.data)
    else:
        data = generate_sample_data()

    dmd = DMD(svd_rank=args.rank)
    dmd.fit(data)

    fig, axes = plt.subplots(1, 3, figsize=(15, 4))
    plot_eigenvalues(axes[0], dmd.eigs)
    plot_modes(axes[1], dmd.modes, n_modes=args.n_modes)
    plot_dynamics(axes[2], dmd.dynamics, n_modes=args.n_modes)

    fig.suptitle("DMD Mode Visualization", fontsize=14)
    fig.tight_layout()

    if args.output:
        fig.savefig(args.output, format=args.format, dpi=150, bbox_inches="tight")
        print(f"Figure saved to {args.output}")
    else:
        plt.show()


if __name__ == "__main__":
    main()
`;
}
