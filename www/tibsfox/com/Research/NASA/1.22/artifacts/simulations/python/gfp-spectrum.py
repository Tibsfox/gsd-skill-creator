"""
Aequorea victoria — Green Fluorescent Protein (GFP) Spectra

Visualizes the excitation and emission spectra of wild-type GFP as
Gaussian approximations, annotated with Stokes shift, quantum yield,
and photon energy calculations.

GFP was carried aboard Aurora 7 as one of the first biological
fluorescence experiments in space, connecting Osamu Shimomura's
jellyfish research to orbital science.

Usage:
    python3 gfp-spectrum.py

Outputs:
    gfp-spectrum.png — excitation/emission spectra with annotations
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from pathlib import Path

# ===========================================================================
# Physical constants
# ===========================================================================

H_EV_S = 4.135_667_696e-15     # Planck constant in eV*s
C_M_S = 2.997_924_58e8         # speed of light in m/s

# ===========================================================================
# Spectral model parameters (Gaussian approximations)
# ===========================================================================

EXCITATION_PEAK_1 = 395.0      # nm — major excitation peak
EXCITATION_SIGMA_1 = 15.0      # nm
EXCITATION_AMP_1 = 1.0

EXCITATION_PEAK_2 = 475.0      # nm — minor excitation peak
EXCITATION_SIGMA_2 = 12.0      # nm
EXCITATION_AMP_2 = 0.35

EMISSION_PEAK = 509.0          # nm — emission peak
EMISSION_SIGMA = 18.0          # nm
EMISSION_AMP = 0.79            # quantum yield

QUANTUM_YIELD = 0.79

# ===========================================================================
# Wavelength axis
# ===========================================================================

wavelength = np.linspace(300, 650, 1000)


def gaussian(x, mu, sigma, amp):
    """Normalized Gaussian scaled by amplitude."""
    return amp * np.exp(-0.5 * ((x - mu) / sigma) ** 2)


def photon_energy_ev(wavelength_nm):
    """E = hc/lambda in eV."""
    return H_EV_S * C_M_S / (wavelength_nm * 1e-9)


# ===========================================================================
# Build spectra
# ===========================================================================

excitation = (gaussian(wavelength, EXCITATION_PEAK_1, EXCITATION_SIGMA_1, EXCITATION_AMP_1) +
              gaussian(wavelength, EXCITATION_PEAK_2, EXCITATION_SIGMA_2, EXCITATION_AMP_2))

emission = gaussian(wavelength, EMISSION_PEAK, EMISSION_SIGMA, EMISSION_AMP)

# Energy calculations
energy_395 = photon_energy_ev(EXCITATION_PEAK_1)
energy_509 = photon_energy_ev(EMISSION_PEAK)
energy_loss = energy_395 - energy_509
energy_loss_pct = 100.0 * energy_loss / energy_395

stokes_major = EMISSION_PEAK - EXCITATION_PEAK_1
stokes_minor = EMISSION_PEAK - EXCITATION_PEAK_2

# ===========================================================================
# Visible spectrum rainbow gradient
# ===========================================================================

def wavelength_to_rgb(wl):
    """Convert wavelength (380-750 nm) to approximate RGB."""
    if 380 <= wl < 440:
        r = -(wl - 440) / (440 - 380)
        g = 0.0
        b = 1.0
    elif 440 <= wl < 490:
        r = 0.0
        g = (wl - 440) / (490 - 440)
        b = 1.0
    elif 490 <= wl < 510:
        r = 0.0
        g = 1.0
        b = -(wl - 510) / (510 - 490)
    elif 510 <= wl < 580:
        r = (wl - 510) / (580 - 510)
        g = 1.0
        b = 0.0
    elif 580 <= wl < 645:
        r = 1.0
        g = -(wl - 645) / (645 - 580)
        b = 0.0
    elif 645 <= wl <= 750:
        r = 1.0
        g = 0.0
        b = 0.0
    else:
        r = g = b = 0.0

    # Intensity falloff at edges of visible range
    if 380 <= wl < 420:
        factor = 0.3 + 0.7 * (wl - 380) / (420 - 380)
    elif 645 < wl <= 750:
        factor = 0.3 + 0.7 * (750 - wl) / (750 - 645)
    else:
        factor = 1.0

    return (r * factor, g * factor, b * factor)

# ===========================================================================
# Plot
# ===========================================================================

fig, ax = plt.subplots(figsize=(11, 6.5))

# Draw visible spectrum as background strips
vis_start, vis_end = 380, 650
for wl in range(vis_start, vis_end):
    color = wavelength_to_rgb(wl)
    ax.axvspan(wl, wl + 1, alpha=0.12, color=color, linewidth=0, zorder=0)

# Excitation spectrum
ax.plot(wavelength, excitation, color="#2060CC", linewidth=2.0, label="Excitation")
ax.fill_between(wavelength, excitation, alpha=0.3, color="#2060CC", zorder=2)

# Emission spectrum
ax.plot(wavelength, emission, color="#22AA22", linewidth=2.0, label="Emission")
ax.fill_between(wavelength, emission, alpha=0.3, color="#22AA22", zorder=2)

# Peak markers (vertical dashed lines)
ax.axvline(EXCITATION_PEAK_1, color="#2060CC", linestyle="--", linewidth=0.8, alpha=0.6)
ax.axvline(EXCITATION_PEAK_2, color="#5588DD", linestyle="--", linewidth=0.8, alpha=0.6)
ax.axvline(EMISSION_PEAK, color="#22AA22", linestyle="--", linewidth=0.8, alpha=0.6)

# Peak wavelength labels
ax.text(EXCITATION_PEAK_1, 1.04, f"{EXCITATION_PEAK_1:.0f} nm",
        ha="center", fontsize=8, color="#2060CC")
ax.text(EXCITATION_PEAK_2, 0.39, f"{EXCITATION_PEAK_2:.0f} nm",
        ha="center", fontsize=8, color="#5588DD")
ax.text(EMISSION_PEAK, 0.83, f"{EMISSION_PEAK:.0f} nm",
        ha="center", fontsize=8, color="#22AA22")

# Stokes shift arrow (major: 395 -> 509)
ax.annotate("",
            xy=(EMISSION_PEAK, 0.55), xytext=(EXCITATION_PEAK_1, 0.55),
            arrowprops=dict(arrowstyle="<->", color="#CC4444", lw=1.5))
ax.text((EXCITATION_PEAK_1 + EMISSION_PEAK) / 2, 0.57,
        f"Stokes shift\n{stokes_major:.0f} nm",
        ha="center", va="bottom", fontsize=9, color="#CC4444", fontweight="bold")

# Info text box
info_text = (
    f"Quantum yield: {QUANTUM_YIELD}\n"
    f"Stokes shift: {stokes_major:.0f} nm (major) / {stokes_minor:.0f} nm (minor)\n"
    f"E(395 nm) = hc/\u03bb = {energy_395:.2f} eV\n"
    f"E(509 nm) = hc/\u03bb = {energy_509:.2f} eV\n"
    f"Energy loss: {energy_loss:.2f} eV ({energy_loss_pct:.1f}%)"
)
props = dict(boxstyle="round,pad=0.5", facecolor="white", edgecolor="gray", alpha=0.9)
ax.text(0.97, 0.97, info_text, transform=ax.transAxes,
        fontsize=9, verticalalignment="top", horizontalalignment="right",
        bbox=props, family="monospace")

# Axes and labels
ax.set_xlabel("Wavelength (nm)", fontsize=12)
ax.set_ylabel("Relative intensity", fontsize=12)
ax.set_title("Aequorea victoria \u2014 Green Fluorescent Protein Spectra",
             fontsize=14, fontweight="bold")
ax.text(0.5, 1.02, "Excitation and emission spectra with Stokes shift",
        transform=ax.transAxes, ha="center", fontsize=10, style="italic",
        color="gray")

ax.set_xlim(300, 650)
ax.set_ylim(0, 1.15)
ax.legend(loc="upper left", fontsize=10, framealpha=0.9)

plt.tight_layout()
out_path = Path(__file__).parent / "gfp-spectrum.png"
fig.savefig(out_path, dpi=150, bbox_inches="tight")
print(f"Saved: {out_path}")
plt.close(fig)
