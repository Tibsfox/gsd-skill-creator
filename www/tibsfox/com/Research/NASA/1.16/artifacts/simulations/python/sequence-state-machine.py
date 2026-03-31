#!/usr/bin/env python3
"""
Mercury-Redstone 1 — Tail Plug Disconnection State Machine
==========================================================
NASA Mission Series v1.16

Models the MR-1 tail plug connector as a finite state machine.
Demonstrates how the wrong disconnection sequence creates a
"sneak circuit" — an unintended electrical path that sends a
spurious engine shutdown command.

The tail plug had multiple pins that disconnected as the rocket
rose off the pad. The correct sequence required power pins to
disconnect before control pins, ensuring the shutdown command
path was broken before the control circuit lost its inhibit.

MR-1's 4-inch rise caused pins to disconnect in the wrong order.

Outputs:
  - State transition diagram (correct vs actual)
  - Monte Carlo analysis of sequence probability
  - Timing sensitivity plot

Usage: python3 sequence-state-machine.py
Dependencies: numpy, matplotlib
Output: sequence_state_machine.png (3 subplots)
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from itertools import permutations
from collections import Counter

# ============================================================
# STATE MACHINE DEFINITION
# ============================================================

# Pins in the tail plug connector (simplified model)
# A = Ground power (must disconnect first)
# B = Control bus inhibit (must disconnect second)
# C = Telemetry monitoring (must disconnect third)

PINS = ['A', 'B', 'C']

# State machine transitions
# State = set of pins still connected
# Correct sequence: A disconnects → B disconnects → C disconnects → FLIGHT
# MR-1 actual: B disconnects → A disconnects → SHUTDOWN (sneak circuit)

def evaluate_sequence(seq):
    """
    Evaluate a disconnection sequence.
    Returns ('FLIGHT', path) or ('SHUTDOWN', path) with state trace.

    Rules (simplified from actual MR-1 electrical analysis):
    - If B disconnects before A: sneak circuit forms → SHUTDOWN
    - If A disconnects first: correct path → eventually FLIGHT
    - Sequence must complete A before B for safe operation
    """
    states = [frozenset(PINS)]  # Start: all connected
    connected = set(PINS)

    for pin in seq:
        connected.remove(pin)
        states.append(frozenset(connected))

        # Check for sneak circuit condition:
        # B disconnected while A still connected
        if pin == 'B' and 'A' in connected:
            return 'SHUTDOWN', states

    return 'FLIGHT', states


def analyze_all_sequences():
    """Enumerate all possible disconnection sequences and classify outcomes."""
    results = {}
    for seq in permutations(PINS):
        outcome, path = evaluate_sequence(seq)
        results[seq] = (outcome, path)
    return results


# ============================================================
# MONTE CARLO: Manufacturing Tolerance Model
# ============================================================

def monte_carlo_sequences(n_trials=100000, pin_length_mm=None):
    """
    Monte Carlo simulation: given manufacturing tolerances on pin lengths,
    what fraction of assemblies would produce the wrong sequence?

    Each pin has a nominal length and tolerance. The order of disconnection
    is determined by effective pin length (shorter pins disconnect first
    as the rocket rises).

    Nominal design (correct order A→B→C):
      Pin A: 25.0 mm (shortest — disconnects first)
      Pin B: 27.0 mm (middle)
      Pin C: 29.0 mm (longest — disconnects last)

    Tolerance: ±0.5 mm (normal distribution, 3-sigma at ±0.5)
    """
    if pin_length_mm is None:
        pin_length_mm = {
            'A': (25.0, 0.167),  # (nominal, 1-sigma) → 3σ = ±0.5 mm
            'B': (27.0, 0.167),
            'C': (29.0, 0.167),
        }

    outcomes = Counter()

    for _ in range(n_trials):
        # Sample actual pin lengths
        lengths = {}
        for pin, (nom, sigma) in pin_length_mm.items():
            lengths[pin] = np.random.normal(nom, sigma)

        # Disconnection order: shortest first
        order = tuple(sorted(lengths, key=lambda p: lengths[p]))
        outcome, _ = evaluate_sequence(order)
        outcomes[outcome] += 1

    return outcomes, n_trials


def tight_tolerance_sweep():
    """
    Sweep pin spacing to find the tolerance at which failure becomes likely.
    As pin length differences decrease, wrong-order probability increases.
    """
    spacings = np.linspace(0.1, 5.0, 50)  # mm between nominal pin lengths
    failure_rates = []

    n_per = 10000

    for spacing in spacings:
        sigma = 0.167  # Fixed manufacturing tolerance
        pin_lengths = {
            'A': (25.0, sigma),
            'B': (25.0 + spacing, sigma),
            'C': (25.0 + 2 * spacing, sigma),
        }
        outcomes, _ = monte_carlo_sequences(n_per, pin_lengths)
        rate = outcomes.get('SHUTDOWN', 0) / n_per
        failure_rates.append(rate)

    return spacings, failure_rates


# ============================================================
# PLOTTING
# ============================================================

def plot_results():
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.patch.set_facecolor('#0c1020')

    for ax in axes:
        ax.set_facecolor('#0a0e1a')
        ax.tick_params(colors='#8090a0')
        ax.spines['bottom'].set_color('#2a3050')
        ax.spines['top'].set_color('#2a3050')
        ax.spines['left'].set_color('#2a3050')
        ax.spines['right'].set_color('#2a3050')

    # --- Subplot 1: State Transition Diagram ---
    ax1 = axes[0]
    ax1.set_xlim(-0.5, 4.5)
    ax1.set_ylim(-1.5, 1.5)
    ax1.set_aspect('equal')
    ax1.set_title('State Transition Diagram', color='#c0c8d8', fontsize=12, pad=10)

    # Correct path (top)
    correct_states = [
        (0, 0.8, '{A,B,C}'),
        (1.5, 0.8, '{B,C}'),
        (3.0, 0.8, '{C}'),
        (4.0, 0.8, 'FLIGHT'),
    ]

    for x, y, label in correct_states:
        color = '#44ff88' if label == 'FLIGHT' else '#4488cc'
        circle = plt.Circle((x, y), 0.3, fill=False, color=color, linewidth=2)
        ax1.add_patch(circle)
        ax1.text(x, y, label, ha='center', va='center', color=color,
                fontsize=7, fontweight='bold')

    # Correct path arrows
    for i in range(len(correct_states) - 1):
        x0, y0, _ = correct_states[i]
        x1, y1, _ = correct_states[i + 1]
        ax1.annotate('', xy=(x1 - 0.32, y1), xytext=(x0 + 0.32, y0),
                    arrowprops=dict(arrowstyle='->', color='#44ff88', lw=1.5))

    labels = ['-A', '-B', '-C']
    for i, lbl in enumerate(labels):
        x0, y0, _ = correct_states[i]
        x1, y1, _ = correct_states[i + 1]
        mx = (x0 + x1) / 2
        ax1.text(mx, y0 + 0.35, lbl, ha='center', va='bottom',
                color='#44ff88', fontsize=9)

    # Wrong path (bottom)
    wrong_states = [
        (0, -0.5, '{A,B,C}'),
        (1.5, -0.5, '{A,C}'),
        (3.5, -0.5, 'SHUTDOWN'),
    ]

    # Arrow from start to wrong first step
    ax1.annotate('', xy=(1.18, -0.5), xytext=(0.32, -0.5),
                arrowprops=dict(arrowstyle='->', color='#ff4444', lw=1.5))
    ax1.text(0.75, -0.15, '-B', ha='center', color='#ff4444', fontsize=9)

    # Wrong state node
    circle_w1 = plt.Circle((1.5, -0.5), 0.3, fill=False, color='#ff4444', linewidth=2)
    ax1.add_patch(circle_w1)
    ax1.text(1.5, -0.5, '{A,C}', ha='center', va='center', color='#ff4444',
            fontsize=7, fontweight='bold')

    # Sneak circuit annotation
    ax1.annotate('', xy=(3.18, -0.5), xytext=(1.82, -0.5),
                arrowprops=dict(arrowstyle='->', color='#ff4444', lw=1.5))
    ax1.text(2.5, -0.15, 'SNEAK\nCIRCUIT', ha='center', color='#ff4444',
            fontsize=7, fontweight='bold')

    # Shutdown node
    circle_sd = plt.Circle((3.5, -0.5), 0.3, fill=False, color='#ff0000', linewidth=2.5)
    ax1.add_patch(circle_sd)
    ax1.text(3.5, -0.5, 'SHUT\nDOWN', ha='center', va='center', color='#ff0000',
            fontsize=7, fontweight='bold')

    ax1.text(2.0, 1.3, 'CORRECT SEQUENCE', color='#44ff88', fontsize=9,
            ha='center', fontweight='bold')
    ax1.text(2.0, -1.1, 'MR-1 ACTUAL', color='#ff4444', fontsize=9,
            ha='center', fontweight='bold')

    ax1.set_xticks([])
    ax1.set_yticks([])

    # --- Subplot 2: All Permutations ---
    ax2 = axes[1]
    results = analyze_all_sequences()

    seqs = list(results.keys())
    outcomes = [results[s][0] for s in seqs]
    colors = ['#44ff88' if o == 'FLIGHT' else '#ff4444' for o in outcomes]
    labels_seq = ['→'.join(s) for s in seqs]

    bars = ax2.barh(range(len(seqs)), [1]*len(seqs), color=colors, height=0.6)
    ax2.set_yticks(range(len(seqs)))
    ax2.set_yticklabels(labels_seq, fontsize=10, fontfamily='monospace', color='#c0c8d8')
    ax2.set_xticks([])
    ax2.set_title('All Possible Sequences (3! = 6)', color='#c0c8d8', fontsize=12, pad=10)

    for i, (seq, (outcome, _)) in enumerate(results.items()):
        ax2.text(0.5, i, outcome, ha='center', va='center',
                color='#000000', fontweight='bold', fontsize=10)

    n_flight = sum(1 for o in outcomes if o == 'FLIGHT')
    n_shutdown = sum(1 for o in outcomes if o == 'SHUTDOWN')
    ax2.text(0.5, -0.8, f'FLIGHT: {n_flight}/6  SHUTDOWN: {n_shutdown}/6',
            ha='center', color='#8090a0', fontsize=9,
            transform=ax2.get_xaxis_transform())

    # --- Subplot 3: Tolerance Sensitivity ---
    ax3 = axes[2]
    spacings, failure_rates = tight_tolerance_sweep()

    ax3.plot(spacings, [r * 100 for r in failure_rates], color='#ff4444', linewidth=2)
    ax3.fill_between(spacings, [r * 100 for r in failure_rates],
                     alpha=0.15, color='#ff4444')
    ax3.set_xlabel('Pin Length Spacing (mm)', color='#8090a0', fontsize=10)
    ax3.set_ylabel('Failure Rate (%)', color='#8090a0', fontsize=10)
    ax3.set_title('Manufacturing Tolerance Sensitivity', color='#c0c8d8', fontsize=12, pad=10)

    # Mark the nominal 2mm spacing
    ax3.axvline(x=2.0, color='#4488cc', linestyle='--', alpha=0.7, linewidth=1)
    ax3.text(2.1, ax3.get_ylim()[1] * 0.9, 'Nominal\n2mm gap',
            color='#4488cc', fontsize=9)

    # Mark danger zone
    ax3.axhspan(5, 100, alpha=0.05, color='#ff4444')
    ax3.text(0.5, 10, 'DANGER\nZONE', color='#ff4444', fontsize=9, alpha=0.5)

    ax3.set_ylim(0, max(r * 100 for r in failure_rates) * 1.2)
    ax3.grid(True, alpha=0.1, color='#4488cc')

    plt.tight_layout(pad=2.0)

    # Title bar
    fig.suptitle('Mercury-Redstone 1 — Tail Plug Disconnection State Machine',
                color='#c0c8d8', fontsize=14, fontweight='bold', y=0.98)
    plt.subplots_adjust(top=0.90)

    plt.savefig('sequence_state_machine.png', dpi=150, facecolor='#0c1020',
                bbox_inches='tight')
    print("Saved: sequence_state_machine.png")
    plt.close()


# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    print("Mercury-Redstone 1 — Tail Plug State Machine Analysis")
    print("=" * 55)

    # Enumerate all sequences
    print("\nAll possible disconnection sequences:")
    results = analyze_all_sequences()
    for seq, (outcome, path) in sorted(results.items()):
        arrow = ' → '.join(seq)
        status = '  FLIGHT' if outcome == 'FLIGHT' else 'SHUTDOWN'
        marker = '  ' if outcome == 'FLIGHT' else '!!'
        print(f"  {marker} {arrow:12s} → {status}")

    flight_count = sum(1 for _, (o, _) in results.items() if o == 'FLIGHT')
    shutdown_count = sum(1 for _, (o, _) in results.items() if o == 'SHUTDOWN')
    print(f"\nCorrect sequences: {flight_count}/6 ({flight_count/6*100:.1f}%)")
    print(f"Shutdown sequences: {shutdown_count}/6 ({shutdown_count/6*100:.1f}%)")

    # Monte Carlo
    print("\nMonte Carlo: Manufacturing tolerance analysis...")
    print("  Pin A: 25.0 ± 0.5 mm (3σ)")
    print("  Pin B: 27.0 ± 0.5 mm (3σ)")
    print("  Pin C: 29.0 ± 0.5 mm (3σ)")

    outcomes, n = monte_carlo_sequences(100000)
    for outcome, count in sorted(outcomes.items()):
        pct = count / n * 100
        print(f"  {outcome}: {count}/{n} ({pct:.3f}%)")

    # Plot
    print("\nGenerating plots...")
    plot_results()
    print("Done.")
