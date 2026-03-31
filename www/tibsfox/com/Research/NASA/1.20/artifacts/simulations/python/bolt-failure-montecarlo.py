#!/usr/bin/env python3
"""
Explosive Bolt Failure Mode — Monte Carlo Analysis
====================================================
NASA Mission Series v1.20

Monte Carlo simulation of the Liberty Bell 7 hatch explosive bolt
failure. The Mercury capsule side hatch was secured by 70 explosive
bolts (a mild detonating fuse ring) with a manual backup T-handle
plunger. After splashdown, the hatch blew unexpectedly. The cause
was never definitively determined.

This simulation models 4 candidate failure modes and uses Bayesian
reasoning with observed evidence to compute posterior probabilities.

Failure modes:
  1. Thermal expansion (P_prior = 0.15)
     — Heat from reentry could have thermally expanded the initiator
     — Supported by: hatch was on the sun-facing side after splashdown
     — Contradicted by: MR-3 hatch didn't blow under similar conditions

  2. Vibration coupling (P_prior = 0.25)
     — Mechanical shock from splashdown transmitted through hull to bolts
     — Supported by: MR-4 landed harder than MR-3 (higher sea state)
     — Partially supported by: the jolt could have cracked an initiator

  3. Electrical fault (P_prior = 0.45)
     — Stray current in the firing circuit activated the initiator
     — Supported by: post-flight analysis of similar circuits showed
       vulnerability to static discharge and salt water intrusion
     — Supported by: the firing circuit had no safe/arm mechanism
       beyond the astronaut's manual activation
     — This is the most commonly cited probable cause

  4. Deliberate activation by Grissom (P_prior = 0.15)
     — Grissom panicked and hit the plunger
     — Contradicted by: no bruising on Grissom's hand (plunger requires
       significant force — leaves distinctive palm bruise)
     — Contradicted by: plunger cap was found in place (not displaced)
     — Contradicted by: Grissom's calm radio calls before the event
     — This was the accusation that haunted Grissom until his death
     — The evidence firmly refutes this mode

Observed evidence used for Bayesian update:
  E1: No hand bruising on Grissom (strongly against mode 4)
  E2: Plunger cap undisplaced (strongly against mode 4)
  E3: Calm radio demeanor before event (against mode 4)
  E4: Higher sea state than MR-3 (slightly favors mode 2)
  E5: No warning indicators before blow (against mode 1)
  E6: Salt water exposure of connector (favors mode 3)

Usage: python3 bolt-failure-montecarlo.py
Dependencies: numpy, matplotlib
Output: bolt_failure_montecarlo.png (4 subplots)
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# MODEL PARAMETERS
# ============================================================

N_TRIALS = 100_000
np.random.seed(19610721)  # July 21, 1961 — MR-4 launch date

# --- Prior probabilities ---
P_THERMAL = 0.15
P_VIBRATION = 0.25
P_ELECTRICAL = 0.45
P_DELIBERATE = 0.15

# --- Evidence likelihood ratios ---
# P(evidence | mode) / P(evidence | not mode)
# These encode how strongly each piece of evidence supports/refutes each mode

# For each failure mode, define likelihood of observing the evidence
# Rows: evidence items, Columns: [thermal, vibration, electrical, deliberate]

LIKELIHOODS = {
    'no_bruising':      [1.0,  1.0,  1.0,  0.05],  # Very unlikely if deliberate
    'plunger_intact':   [1.0,  1.0,  1.0,  0.10],  # Unlikely if plunger was struck
    'calm_radio':       [0.9,  0.9,  0.9,  0.30],  # Somewhat unlikely if panicking
    'high_sea_state':   [0.8,  1.5,  1.0,  1.0],   # Slightly favors vibration
    'no_warning':       [0.5,  0.8,  0.9,  1.0],   # Somewhat against thermal
    'salt_water':       [0.8,  0.7,  1.8,  1.0],   # Strongly favors electrical
}

# --- Monte Carlo parameter distributions ---
# Each mode has uncertain parameters that affect the failure probability

# Thermal expansion: temperature at bolt location (°C)
# Normal operation: 100-150°C. Failure threshold: ~200°C
# Uncertainty: mean 130, std 25
THERMAL_TEMP_MEAN = 130.0
THERMAL_TEMP_STD = 25.0
THERMAL_THRESHOLD = 200.0

# Vibration: peak shock (g) at bolt location
# Normal splashdown: 15-25g. Failure threshold: ~35g
# MR-4 had rougher splashdown: mean 22g, std 5g
VIB_SHOCK_MEAN = 22.0
VIB_SHOCK_STD = 5.0
VIB_THRESHOLD = 35.0

# Electrical: stray current (mA) in firing circuit
# Nominal: 0-2 mA leakage. Initiator threshold: ~5 mA
# Salt water intrusion raises baseline: mean 2.5 mA, std 1.5 mA
ELEC_CURRENT_MEAN = 2.5
ELEC_CURRENT_STD = 1.5
ELEC_THRESHOLD = 5.0

# Deliberate: force applied to plunger (N)
# Required force: ~100 N. Accidental contact: mean 15 N, std 8 N
# (If Grissom didn't do it, any contact was accidental arm movement)
DELIB_FORCE_MEAN = 15.0
DELIB_FORCE_STD = 8.0
DELIB_THRESHOLD = 100.0


# ============================================================
# MONTE CARLO SIMULATION
# ============================================================

# Sample parameter values for each trial
thermal_temps = np.random.normal(THERMAL_TEMP_MEAN, THERMAL_TEMP_STD, N_TRIALS)
vib_shocks = np.random.normal(VIB_SHOCK_MEAN, VIB_SHOCK_STD, N_TRIALS)
elec_currents = np.random.normal(ELEC_CURRENT_MEAN, ELEC_CURRENT_STD, N_TRIALS)
delib_forces = np.random.normal(DELIB_FORCE_MEAN, DELIB_FORCE_STD, N_TRIALS)

# Ensure non-negative values
thermal_temps = np.maximum(thermal_temps, 0)
vib_shocks = np.maximum(vib_shocks, 0)
elec_currents = np.maximum(elec_currents, 0)
delib_forces = np.maximum(delib_forces, 0)

# Compute failure probability for each mode in each trial
# Using sigmoid function around threshold for smooth transition
def failure_prob(values, threshold, steepness=0.3):
    """Sigmoid failure probability centered at threshold."""
    x = (values - threshold) / (threshold * steepness)
    return 1.0 / (1.0 + np.exp(-x))

p_fail_thermal = failure_prob(thermal_temps, THERMAL_THRESHOLD)
p_fail_vibration = failure_prob(vib_shocks, VIB_THRESHOLD)
p_fail_electrical = failure_prob(elec_currents, ELEC_THRESHOLD)
p_fail_deliberate = failure_prob(delib_forces, DELIB_THRESHOLD)

# Weight by prior probability
weighted_thermal = P_THERMAL * p_fail_thermal
weighted_vibration = P_VIBRATION * p_fail_vibration
weighted_electrical = P_ELECTRICAL * p_fail_electrical
weighted_deliberate = P_DELIBERATE * p_fail_deliberate

# Normalize to get posterior (which mode, given a failure occurred)
total_weight = weighted_thermal + weighted_vibration + weighted_electrical + weighted_deliberate
total_weight = np.maximum(total_weight, 1e-10)  # Avoid division by zero

posterior_thermal = weighted_thermal / total_weight
posterior_vibration = weighted_vibration / total_weight
posterior_electrical = weighted_electrical / total_weight
posterior_deliberate = weighted_deliberate / total_weight

# --- Bayesian update with evidence ---
evidence_product = np.ones(4)  # [thermal, vibration, electrical, deliberate]
for ev_name, likelihoods in LIKELIHOODS.items():
    evidence_product *= np.array(likelihoods)

priors = np.array([P_THERMAL, P_VIBRATION, P_ELECTRICAL, P_DELIBERATE])
unnormed_posterior = priors * evidence_product
bayesian_posterior = unnormed_posterior / unnormed_posterior.sum()


# ============================================================
# PLOTTING
# ============================================================

fig = plt.figure(figsize=(14, 14))
fig.patch.set_facecolor('#0c1020')

COL_THERM = '#CC4444'
COL_VIB   = '#CCAA30'
COL_ELEC  = '#4488FF'
COL_DELIB = '#888888'
COL_BG    = '#0a0e1a'
COL_TXT   = '#889098'
COL_GRID  = '#1a2040'

mode_names = ['Thermal\nExpansion', 'Vibration\nCoupling', 'Electrical\nFault',
              'Deliberate\nActivation']
mode_colors = [COL_THERM, COL_VIB, COL_ELEC, COL_DELIB]

# --- Subplot 1: Parameter distributions ---
ax1 = fig.add_subplot(2, 2, 1)
ax1.set_facecolor(COL_BG)
ax1.hist(thermal_temps[:5000], bins=50, color=COL_THERM, alpha=0.7, density=True,
         label='Bolt temperature')
ax1.axvline(x=THERMAL_THRESHOLD, color='white', linewidth=1, linestyle='--')
ax1.text(THERMAL_THRESHOLD + 3, ax1.get_ylim()[1] * 0.8, f'Failure\n({THERMAL_THRESHOLD}°C)',
         color='white', fontsize=8)
ax1.set_xlabel('Temperature (°C)', color=COL_TXT, fontsize=10)
ax1.set_ylabel('Density', color=COL_TXT, fontsize=10)
ax1.set_title('Thermal Expansion Model', color=COL_THERM, fontsize=11)
ax1.legend(fontsize=8, facecolor=COL_BG, edgecolor=COL_GRID, labelcolor=COL_TXT)
ax1.tick_params(colors='#556677')
ax1.grid(alpha=0.15, color='#334455')
for spine in ax1.spines.values():
    spine.set_color(COL_GRID)

# --- Subplot 2: Failure probability by mode (MC results) ---
ax2 = fig.add_subplot(2, 2, 2)
ax2.set_facecolor(COL_BG)

mc_means = [posterior_thermal.mean(), posterior_vibration.mean(),
            posterior_electrical.mean(), posterior_deliberate.mean()]
mc_stds = [posterior_thermal.std(), posterior_vibration.std(),
           posterior_electrical.std(), posterior_deliberate.std()]

bars = ax2.bar(mode_names, mc_means, yerr=mc_stds, color=mode_colors,
               edgecolor='#334455', capsize=5, error_kw={'color': '#889098'})

for bar, val in zip(bars, mc_means):
    ax2.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02,
             f'{val:.1%}', ha='center', color=COL_TXT, fontsize=9)

ax2.set_ylabel('Posterior Probability', color=COL_TXT, fontsize=10)
ax2.set_title('Monte Carlo: Failure Mode Given Failure Occurred\n'
              f'({N_TRIALS:,} trials)', color='#C0C0D0', fontsize=11)
ax2.set_ylim(0, max(mc_means) * 1.4)
ax2.tick_params(colors='#556677')
ax2.grid(alpha=0.15, color='#334455', axis='y')
for spine in ax2.spines.values():
    spine.set_color(COL_GRID)

# --- Subplot 3: Bayesian update with evidence ---
ax3 = fig.add_subplot(2, 2, 3)
ax3.set_facecolor(COL_BG)

x_pos = np.arange(4)
width = 0.35

bars_prior = ax3.bar(x_pos - width/2, priors, width, color=mode_colors,
                     edgecolor='#334455', alpha=0.4, label='Prior')
bars_post = ax3.bar(x_pos + width/2, bayesian_posterior, width, color=mode_colors,
                    edgecolor='#334455', label='Posterior (with evidence)')

for bar, val in zip(bars_post, bayesian_posterior):
    ax3.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
             f'{val:.1%}', ha='center', color=COL_TXT, fontsize=9, fontweight='bold')

ax3.set_xticks(x_pos)
ax3.set_xticklabels(mode_names, fontsize=9)
ax3.set_ylabel('Probability', color=COL_TXT, fontsize=10)
ax3.set_title('Bayesian Update: Prior → Posterior with Physical Evidence',
              color='#C0C0D0', fontsize=11)
ax3.legend(fontsize=8, facecolor=COL_BG, edgecolor=COL_GRID, labelcolor=COL_TXT)
ax3.set_ylim(0, max(bayesian_posterior) * 1.3)
ax3.tick_params(colors='#556677')
ax3.grid(alpha=0.15, color='#334455', axis='y')
for spine in ax3.spines.values():
    spine.set_color(COL_GRID)

# --- Subplot 4: Evidence impact ---
ax4 = fig.add_subplot(2, 2, 4)
ax4.set_facecolor(COL_BG)

evidence_names = list(LIKELIHOODS.keys())
evidence_labels = ['No bruising', 'Plunger intact', 'Calm radio',
                   'High seas', 'No warning', 'Salt water']

# Show likelihood ratios for deliberate (how evidence refutes it)
delib_likelihoods = [LIKELIHOODS[ev][3] for ev in evidence_names]
elec_likelihoods = [LIKELIHOODS[ev][2] for ev in evidence_names]

x_ev = np.arange(len(evidence_names))
ax4.barh(x_ev + 0.15, delib_likelihoods, 0.3, color=COL_DELIB,
         edgecolor='#334455', label='Deliberate', alpha=0.7)
ax4.barh(x_ev - 0.15, elec_likelihoods, 0.3, color=COL_ELEC,
         edgecolor='#334455', label='Electrical', alpha=0.7)

ax4.axvline(x=1.0, color='#556677', linewidth=1, linestyle=':')
ax4.text(1.02, -0.6, 'Neutral', color='#556677', fontsize=8)
ax4.text(0.3, -0.6, 'Refutes', color='#FF4040', fontsize=8)
ax4.text(1.5, -0.6, 'Supports', color='#30CC30', fontsize=8)

ax4.set_yticks(x_ev)
ax4.set_yticklabels(evidence_labels, fontsize=9)
ax4.set_xlabel('Likelihood Ratio', color=COL_TXT, fontsize=10)
ax4.set_title('Evidence Impact: Electrical vs Deliberate',
              color='#C0C0D0', fontsize=11)
ax4.legend(fontsize=8, facecolor=COL_BG, edgecolor=COL_GRID, labelcolor=COL_TXT)
ax4.tick_params(colors='#556677')
ax4.grid(alpha=0.15, color='#334455', axis='x')
for spine in ax4.spines.values():
    spine.set_color(COL_GRID)


plt.tight_layout(pad=2.0)
fig.suptitle('Liberty Bell 7 — Explosive Bolt Failure Analysis',
             color='#C0C0D0', fontsize=15, y=1.01)
plt.savefig('bolt_failure_montecarlo.png', dpi=150, facecolor='#0c1020',
            bbox_inches='tight')
plt.close()


# ============================================================
# NUMERICAL SUMMARY
# ============================================================

print("=" * 70)
print("LIBERTY BELL 7 — EXPLOSIVE BOLT FAILURE ANALYSIS")
print("=" * 70)
print(f"\nMonte Carlo: {N_TRIALS:,} trials")
print()
print("--- Prior Probabilities ---")
print(f"  Thermal expansion:    {P_THERMAL:.0%}")
print(f"  Vibration coupling:   {P_VIBRATION:.0%}")
print(f"  Electrical fault:     {P_ELECTRICAL:.0%}")
print(f"  Deliberate activation:{P_DELIBERATE:.0%}")
print()
print("--- Monte Carlo Posterior (physics + parameter uncertainty) ---")
print(f"  Thermal expansion:    {posterior_thermal.mean():.1%} +/- {posterior_thermal.std():.1%}")
print(f"  Vibration coupling:   {posterior_vibration.mean():.1%} +/- {posterior_vibration.std():.1%}")
print(f"  Electrical fault:     {posterior_electrical.mean():.1%} +/- {posterior_electrical.std():.1%}")
print(f"  Deliberate activation:{posterior_deliberate.mean():.1%} +/- {posterior_deliberate.std():.1%}")
print()
print("--- Bayesian Posterior (with physical evidence) ---")
print(f"  Thermal expansion:    {bayesian_posterior[0]:.1%}")
print(f"  Vibration coupling:   {bayesian_posterior[1]:.1%}")
print(f"  Electrical fault:     {bayesian_posterior[2]:.1%}")
print(f"  Deliberate activation:{bayesian_posterior[3]:.1%}")
print()
print("--- Key Evidence Against Deliberate Activation ---")
print(f"  No hand bruising:       Likelihood ratio = {LIKELIHOODS['no_bruising'][3]}")
print(f"  Plunger cap intact:     Likelihood ratio = {LIKELIHOODS['plunger_intact'][3]}")
print(f"  Calm radio demeanor:    Likelihood ratio = {LIKELIHOODS['calm_radio'][3]}")
print(f"  Combined evidence reduces 'deliberate' from {P_DELIBERATE:.0%} to {bayesian_posterior[3]:.1%}")
print()
print("--- Conclusion ---")
print("  The evidence strongly favors an electrical fault as the most")
print("  probable cause. Deliberate activation by Grissom is effectively")
print("  ruled out by the physical evidence (no bruising, intact plunger).")
print("  Grissom maintained his innocence until his death in the Apollo 1")
print("  fire on January 27, 1967. The recovery of Liberty Bell 7 in 1999")
print("  provided additional evidence but no definitive answer.")
print()
print("Output: bolt_failure_montecarlo.png")
