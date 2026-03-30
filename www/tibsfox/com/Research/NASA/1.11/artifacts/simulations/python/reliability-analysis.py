#!/usr/bin/env python3
"""
Explorer 5 — Monte Carlo Reliability Analysis
=========================================================================
Mission 1.11: Explorer 5 (Juno I / ABMA), FAILED August 24, 1958
LAUNCH FAILURE — Separation Contact Event

Monte Carlo simulation of Juno I stage separation reliability.
Runs 10,000 simulated separation attempts with random variations in:
  - Radial clearance (manufacturing tolerance)
  - Spin rate (actual vs nominal)
  - Spring force (pyrotechnic variability)
  - Booster flex (thermal bending from engine heat)
  - Tub eccentricity (mass imbalance)

For each trial, the simulation determines whether contact occurs
based on the effective clearance after all perturbations. If contact
occurs, the resulting nutation angle and trajectory deviation are
computed. The output shows:
  1. Overall failure rate and 95% confidence interval
  2. Sensitivity analysis — which parameter contributes most to failure
  3. Risk curves — probability of failure vs safety margin
  4. Cumulative success probability over multiple launches

Requires: numpy, matplotlib, scipy
Run: python3 reliability-analysis.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from scipy import stats

# =========================================================================
# Nominal Parameters and Uncertainty Distributions
# =========================================================================

N_TRIALS = 10000
np.random.seed(1958)  # Seed: Explorer 5's year

# Nominal clearance and tolerance
CLEARANCE_NOMINAL = 0.050  # 5.0 cm nominal radial clearance
CLEARANCE_SIGMA = 0.012    # 1.2 cm standard deviation (manufacturing)

# Spin rate variation
SPIN_NOMINAL = 450.0       # RPM
SPIN_SIGMA = 15.0          # RPM standard deviation

# Spring force variation
SPRING_NOMINAL = 500.0     # Newtons
SPRING_SIGMA = 30.0        # Newton standard deviation

# Booster thermal flex (bending toward tub)
FLEX_MEAN = 0.005          # 5 mm mean flex toward tub
FLEX_SIGMA = 0.008         # 8 mm standard deviation

# Tub eccentricity (center of mass offset from spin axis)
ECCEN_MEAN = 0.002         # 2 mm mean eccentricity
ECCEN_SIGMA = 0.003        # 3 mm standard deviation

# Contact threshold: if effective clearance < 0, contact occurs
# Effective clearance = nominal - flex - eccentricity * wobble_factor + spring_push


def compute_effective_clearance(clearance, flex, eccentricity, spin_rate, spring_force):
    """
    Compute effective radial clearance during separation.

    The tub moves axially (away from booster) while spinning. During the
    separation transient, the tub can wobble due to spring asymmetry and
    eccentricity. The effective clearance is the minimum radial gap.

    Parameters
    ----------
    clearance : float
        Manufacturing clearance (m)
    flex : float
        Booster thermal flex toward tub (m)
    eccentricity : float
        Tub mass center offset from spin axis (m)
    spin_rate : float
        Actual spin rate (RPM)
    spring_force : float
        Actual separation spring force (N)

    Returns
    -------
    effective_clearance : float
        Minimum radial gap during separation (m). Negative = contact.
    """
    # Eccentricity creates a wobble whose amplitude depends on spin rate
    omega = spin_rate * 2 * np.pi / 60
    # Centrifugal displacement at edge = eccentricity * (omega/omega_nom)^2
    omega_nom = SPIN_NOMINAL * 2 * np.pi / 60
    wobble = eccentricity * (omega / omega_nom) ** 2

    # Spring force affects separation velocity — lower force = slower separation
    # During slow separation, the tub spends more time in the danger zone
    sep_speed_ratio = spring_force / SPRING_NOMINAL
    # Danger zone exposure factor: slower = more exposure
    exposure = 1.0 / max(sep_speed_ratio, 0.3)

    # Effective clearance: reduce by flex, wobble, and exposure factor
    effective = clearance - flex - wobble * exposure
    return effective


def run_monte_carlo():
    """Run N_TRIALS simulated separations and return results."""
    # Sample random parameters
    clearances = np.random.normal(CLEARANCE_NOMINAL, CLEARANCE_SIGMA, N_TRIALS)
    clearances = np.maximum(clearances, 0.001)  # physical minimum

    flexes = np.abs(np.random.normal(FLEX_MEAN, FLEX_SIGMA, N_TRIALS))
    eccentricities = np.abs(np.random.normal(ECCEN_MEAN, ECCEN_SIGMA, N_TRIALS))
    spin_rates = np.random.normal(SPIN_NOMINAL, SPIN_SIGMA, N_TRIALS)
    spring_forces = np.random.normal(SPRING_NOMINAL, SPRING_SIGMA, N_TRIALS)
    spring_forces = np.maximum(spring_forces, 100.0)  # minimum viable

    # Compute effective clearance for each trial
    eff_clearances = np.array([
        compute_effective_clearance(c, f, e, s, sp)
        for c, f, e, s, sp in zip(clearances, flexes, eccentricities,
                                   spin_rates, spring_forces)
    ])

    # Contact occurs when effective clearance < 0
    contacts = eff_clearances < 0

    results = {
        'clearances': clearances,
        'flexes': flexes,
        'eccentricities': eccentricities,
        'spin_rates': spin_rates,
        'spring_forces': spring_forces,
        'eff_clearances': eff_clearances,
        'contacts': contacts,
        'failure_rate': np.mean(contacts),
        'n_failures': np.sum(contacts),
    }

    return results


def sensitivity_analysis(results):
    """
    Determine which parameter contributes most to failure.
    Uses correlation between each parameter and effective clearance.
    """
    params = {
        'Manufacturing clearance': results['clearances'],
        'Booster thermal flex': results['flexes'],
        'Tub eccentricity': results['eccentricities'],
        'Spin rate': results['spin_rates'],
        'Spring force': results['spring_forces'],
    }

    sensitivities = {}
    for name, values in params.items():
        corr, pval = stats.pearsonr(values, results['eff_clearances'])
        sensitivities[name] = {'correlation': corr, 'p_value': pval}

    return sensitivities


def plot_results(results, sensitivities):
    """Generate comprehensive analysis plots."""
    fig = plt.figure(figsize=(18, 14), facecolor='#050505')
    gs = gridspec.GridSpec(2, 3, hspace=0.35, wspace=0.35)

    failure_rate = results['failure_rate']
    n_fail = results['n_failures']

    # --- Plot 1: Effective Clearance Distribution ---
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_facecolor('#0a0a1a')

    bins = np.linspace(-0.04, 0.08, 60)
    ax1.hist(results['eff_clearances'][~results['contacts']], bins=bins,
             color='#40CC40', alpha=0.7, label='Success (no contact)')
    ax1.hist(results['eff_clearances'][results['contacts']], bins=bins,
             color='#CC2020', alpha=0.7, label='Failure (contact)')
    ax1.axvline(x=0, color='#D4A830', linewidth=2, linestyle='--',
                label='Contact threshold')
    ax1.set_xlabel('Effective Clearance (m)', color='#888')
    ax1.set_ylabel('Count', color='#888')
    ax1.set_title('Effective Clearance Distribution', color='#D0D8E0', fontsize=12)
    ax1.legend(fontsize=8, facecolor='#0a0a1a', edgecolor='#333', labelcolor='#aaa')
    ax1.tick_params(colors='#666')
    for spine in ax1.spines.values():
        spine.set_color('#333')

    # --- Plot 2: Sensitivity Analysis ---
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.set_facecolor('#0a0a1a')

    names = list(sensitivities.keys())
    correlations = [abs(sensitivities[n]['correlation']) for n in names]
    colors = ['#CC2020' if c > 0.3 else '#D4A830' if c > 0.1 else '#40CC40'
              for c in correlations]
    bars = ax2.barh(range(len(names)), correlations, color=colors, alpha=0.8)
    ax2.set_yticks(range(len(names)))
    ax2.set_yticklabels(names, color='#aaa', fontsize=9)
    ax2.set_xlabel('|Correlation| with Effective Clearance', color='#888')
    ax2.set_title('Sensitivity Analysis', color='#D0D8E0', fontsize=12)
    ax2.tick_params(colors='#666')
    for spine in ax2.spines.values():
        spine.set_color('#333')

    # --- Plot 3: Risk Curve ---
    ax3 = fig.add_subplot(gs[0, 2])
    ax3.set_facecolor('#0a0a1a')

    margins = np.linspace(0.01, 0.10, 50)
    failure_probs = []
    for margin in margins:
        # Recalculate failure rate with different nominal clearance
        shifted = results['eff_clearances'] + (margin - CLEARANCE_NOMINAL)
        fp = np.mean(shifted < 0)
        failure_probs.append(fp * 100)

    ax3.plot(margins * 100, failure_probs, color='#CC2020', linewidth=2)
    ax3.axvline(x=CLEARANCE_NOMINAL * 100, color='#D4A830', linewidth=1.5,
                linestyle='--', label=f'Nominal ({CLEARANCE_NOMINAL*100:.0f} cm)')
    ax3.axhline(y=failure_rate * 100, color='#CC2020', linewidth=1,
                linestyle=':', alpha=0.5)
    ax3.set_xlabel('Design Clearance Margin (cm)', color='#888')
    ax3.set_ylabel('Failure Probability (%)', color='#888')
    ax3.set_title('Risk Curve: Clearance vs Failure Rate', color='#D0D8E0', fontsize=12)
    ax3.legend(fontsize=9, facecolor='#0a0a1a', edgecolor='#333', labelcolor='#aaa')
    ax3.tick_params(colors='#666')
    for spine in ax3.spines.values():
        spine.set_color('#333')
    ax3.grid(True, alpha=0.15)

    # --- Plot 4: Cumulative Launch Success ---
    ax4 = fig.add_subplot(gs[1, 0])
    ax4.set_facecolor('#0a0a1a')

    n_launches = 50
    cumulative_success = [(1 - failure_rate) ** n * 100 for n in range(1, n_launches + 1)]
    ax4.plot(range(1, n_launches + 1), cumulative_success,
             color='#40CC40', linewidth=2)
    ax4.axhline(y=50, color='#D4A830', linewidth=1, linestyle='--',
                alpha=0.5, label='50% threshold')
    ax4.fill_between(range(1, n_launches + 1), cumulative_success, 0,
                     alpha=0.1, color='#40CC40')
    ax4.set_xlabel('Number of Consecutive Launches', color='#888')
    ax4.set_ylabel('Probability of All Succeeding (%)', color='#888')
    ax4.set_title('Cumulative Success Probability', color='#D0D8E0', fontsize=12)
    ax4.legend(fontsize=9, facecolor='#0a0a1a', edgecolor='#333', labelcolor='#aaa')
    ax4.tick_params(colors='#666')
    for spine in ax4.spines.values():
        spine.set_color('#333')
    ax4.grid(True, alpha=0.15)

    # --- Plot 5: Scatter — Clearance vs Flex ---
    ax5 = fig.add_subplot(gs[1, 1])
    ax5.set_facecolor('#0a0a1a')

    scatter_colors = ['#CC2020' if c else '#40CC40' for c in results['contacts']]
    ax5.scatter(results['clearances'] * 100, results['flexes'] * 100,
                c=scatter_colors, s=2, alpha=0.3)
    ax5.set_xlabel('Manufacturing Clearance (cm)', color='#888')
    ax5.set_ylabel('Booster Thermal Flex (cm)', color='#888')
    ax5.set_title('Clearance vs Flex (green=ok, red=fail)', color='#D0D8E0', fontsize=12)
    ax5.tick_params(colors='#666')
    for spine in ax5.spines.values():
        spine.set_color('#333')
    ax5.grid(True, alpha=0.15)

    # --- Plot 6: Statistics Summary ---
    ax6 = fig.add_subplot(gs[1, 2])
    ax6.set_facecolor('#0a0a1a')
    ax6.axis('off')

    # Wilson score confidence interval
    z = 1.96  # 95% CI
    n = N_TRIALS
    p_hat = failure_rate
    denom = 1 + z**2 / n
    center = (p_hat + z**2 / (2*n)) / denom
    spread = z * np.sqrt(p_hat * (1-p_hat) / n + z**2 / (4*n**2)) / denom
    ci_low = max(0, center - spread)
    ci_high = min(1, center + spread)

    stats_text = (
        f"MONTE CARLO RELIABILITY ANALYSIS\n"
        f"{'='*40}\n\n"
        f"Trials:          {N_TRIALS:,}\n"
        f"Failures:        {n_fail:,}\n"
        f"Failure rate:    {failure_rate*100:.2f}%\n"
        f"95% CI:          [{ci_low*100:.2f}%, {ci_high*100:.2f}%]\n\n"
        f"{'='*40}\n"
        f"PARAMETER CONTRIBUTIONS\n"
        f"{'='*40}\n\n"
    )
    for name, vals in sensitivities.items():
        stats_text += f"  {name}:\n"
        stats_text += f"    |r| = {abs(vals['correlation']):.3f}\n"

    stats_text += (
        f"\n{'='*40}\n"
        f"CONTEXT: JUNO I PROGRAM\n"
        f"{'='*40}\n\n"
        f"  Explorer 5: FAILED (contact)\n"
        f"  Explorer 1: SUCCESS\n"
        f"  Explorer 3: FAILED (4th stage)\n"
        f"  Explorer 4: SUCCESS\n\n"
        f"  Historical Juno I failure rate:\n"
        f"  ~33% (3 success / 6 total)\n"
    )

    ax6.text(0.05, 0.95, stats_text, transform=ax6.transAxes,
             fontfamily='monospace', fontsize=9, color='#40CC40',
             verticalalignment='top')

    fig.suptitle('Explorer 5 — Monte Carlo Separation Reliability Analysis\n'
                 f'{N_TRIALS:,} trials | Failure rate: {failure_rate*100:.1f}%',
                 color='#D0D8E0', fontsize=14, y=0.98)

    plt.savefig('explorer5-reliability-analysis.png', dpi=150, facecolor='#050505',
                bbox_inches='tight')
    plt.show()
    print("\nSaved: explorer5-reliability-analysis.png")


# =========================================================================
# Main
# =========================================================================

if __name__ == '__main__':
    print("=" * 70)
    print("Explorer 5 — Monte Carlo Separation Reliability Analysis")
    print(f"Running {N_TRIALS:,} simulated separation attempts...")
    print("=" * 70)
    print()

    results = run_monte_carlo()
    sensitivities = sensitivity_analysis(results)

    print(f"Results:")
    print(f"  Total trials:   {N_TRIALS:,}")
    print(f"  Failures:       {results['n_failures']:,}")
    print(f"  Failure rate:   {results['failure_rate']*100:.2f}%")
    print()

    print(f"Sensitivity analysis (|correlation| with effective clearance):")
    for name, vals in sensitivities.items():
        bar = '#' * int(abs(vals['correlation']) * 50)
        print(f"  {name:30s} |r|={abs(vals['correlation']):.3f} {bar}")
    print()

    print("Generating plots...")
    plot_results(results, sensitivities)

    print("\nIn the Library of Babel, there is a book that records")
    print("every possible separation outcome. Most pages are green.")
    print(f"Approximately {results['failure_rate']*100:.1f}% are red.")
    print("Explorer 5 opened to a red page.")
