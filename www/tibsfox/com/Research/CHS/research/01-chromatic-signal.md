# Chromatic Signal -- The Geometry of Color Perception

## Overview

Color is not a property of light. It is a property of brains. The electromagnetic spectrum is continuous and uniform; the experience of color arises from the compression of that continuum into three opponent channels by the human visual system. This module maps the mathematics of that compression -- from photon to percept -- and its implications for interface design.

## Trichromatic Theory (Young-Helmholtz)

Thomas Young proposed in 1802 that color vision relies on three types of receptor, each sensitive to a different range of wavelengths. Hermann von Helmholtz formalized this into the trichromatic theory: all perceivable colors can be represented as weighted combinations of three primary stimuli.

The three cone types in the human retina:
- **L-cones (long wavelength):** Peak sensitivity ~564 nm (red-shifted)
- **M-cones (medium wavelength):** Peak sensitivity ~534 nm (green)
- **S-cones (short wavelength):** Peak sensitivity ~420 nm (blue-violet)

The LMS color space defined by these cone responses is the physiological basis of all color representation. Every color model -- RGB, CMYK, CIE XYZ, CIELAB -- is a mathematical transformation of LMS coordinates.

## Opponent-Process Theory (Hering)

Ewald Hering observed that certain color combinations are never perceived simultaneously: there is no reddish-green or yellowish-blue. He proposed three opponent channels:

- **Light-dark (achromatic):** L + M signal
- **Red-green:** L - M signal
- **Blue-yellow:** S - (L + M) signal

Modern neuroscience confirms both theories: cones provide trichromatic input at the retinal level; retinal ganglion cells then encode opponent-process signals for transmission to the lateral geniculate nucleus (LGN) and visual cortex.

### Implications for UI Design

The opponent-process model explains why:
- Red-on-green text is maximally difficult to read (it excites and inhibits the same channel)
- Blue text on yellow backgrounds is perceptually unstable
- Achromatic (light-dark) contrast is the strongest perceptual signal for structure

## CIE Color System

The Commission Internationale de l'Eclairage (CIE) established the standard observer in 1931, mapping cone sensitivities to three color-matching functions: x-bar, y-bar, z-bar. The resulting CIE XYZ color space is the foundation of all colorimetry.

### CIE 1931 Chromaticity Diagram

The xy chromaticity diagram projects the 3D XYZ space onto a 2D plane, with the spectral locus forming a horseshoe shape. All physically realizable colors lie within this boundary. No display can reproduce the full gamut of perceivable color.

### CIELAB (L*a*b*) Space

CIELAB (1976) applies a perceptual uniformity correction to XYZ:
- **L*:** Lightness (0 = black, 100 = white)
- **a*:** Red-green axis
- **b*:** Blue-yellow axis

The key property: equal Euclidean distances in CIELAB correspond to approximately equal perceived color differences (deltaE). This makes CIELAB the standard for measuring color accuracy in display calibration.

## Quantum Information-Theoretic Models

Recent work by Berthier and Provenzi (2022-2024) applies quantum information theory to color perception. Their framework treats color signals as quantum states in a 3-dimensional Hilbert space, where:

- Cone responses are projective measurements
- Chromatic adaptation is a unitary transformation
- Metamerism (physically different spectra producing identical color percepts) is an information-theoretic compression artifact

This model provides a rigorous mathematical foundation for understanding color as an information channel with finite capacity.

## Gestalt Color Grouping

The Gestalt principles of perceptual organization apply directly to color:

- **Similarity:** Elements of the same color are perceived as belonging together
- **Proximity:** Color similarity strengthens grouping by spatial proximity
- **Common region:** A shared background color creates a perceptual container
- **Figure-ground:** Color contrast is the primary cue for figure-ground separation

### Color as Information Channel

In UI design, color functions as an information channel in the Shannon sense:
- **Channel capacity:** Limited by the number of distinguishable colors (~7 +/- 2 categories without labels)
- **Signal encoding:** Hue encodes category, saturation encodes intensity, lightness encodes hierarchy
- **Noise:** Uncalibrated displays, ambient light, and color vision deficiency introduce channel noise
- **Bandwidth:** The human visual system processes color at lower spatial resolution than luminance

## Cross-References

> **Related:** [Entropy & Perception](02-entropy-perception.md) for the information-theoretic framework, [Synthesis](06-synthesis.md) for how chromatic signal integrates with the unified design science.
