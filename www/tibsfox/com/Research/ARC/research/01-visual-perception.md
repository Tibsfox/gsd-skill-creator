# From Photon to Percept

> **Domain:** Neuroscience of Vision
> **Module:** 1 -- Visual Perception Neuroscience
> **Through-line:** *Color is assembled, not received. A photon enters the eye. Opponent-process cells fire. The brain constructs the boundary between this and not-this. The coloring book exists; the lines inside it are a negotiated fiction.*

---

## Table of Contents

1. [The Retinal Foundation](#1-the-retinal-foundation)
2. [Opponent-Process Color Coding](#2-opponent-process-color-coding)
3. [The Cortical Pathway](#3-the-cortical-pathway)
4. [Joint Color-Shape Coding: Salk Institute 2019](#4-joint-color-shape-coding-salk-institute-2019)
5. [V4 Globs and Full Hue Representation](#5-v4-globs-and-full-hue-representation)
6. [Peripheral Color and the Fill-In Problem](#6-peripheral-color-and-the-fill-in-problem)
7. [Implications for Art](#7-implications-for-art)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. The Retinal Foundation

The eye contains three types of cone photoreceptors, labeled Short (S), Medium (M), and Long (L) based on peak wavelength sensitivity [1][2]:

- **S cones** -- Respond to violet-blue wavelengths (~420 nm peak)
- **M cones** -- Respond to green-yellow wavelengths (~534 nm peak)
- **L cones** -- Respond to greenish-yellow wavelengths (~564 nm peak; not red, as commonly stated)

Color perception is not a property of the object but an output of the perceiving system. Objects absorb some wavelengths and reflect others. The reflected photons trigger differential cone responses. The brain interprets this differential as color.

This means color does not exist in the world outside the observer. A wavelength of 580 nm is not "yellow" -- it is electromagnetic radiation that triggers a specific ratio of L:M:S cone activation that the brain interprets as yellow. Color is a construct. The retina is the first stage of construction.

---

## 2. Opponent-Process Color Coding

Retinal ganglion cells (RGCs) act as feature detectors, encoding color differences rather than absolute values [1][3]:

- **Midget cells** -- Red-green opponency (L-cone vs. M-cone differential)
- **Bi-stratified cells** -- Blue-yellow opponency (S-cone ON, L+M-cone OFF)
- **Parasol cells** -- Luminance (black-white, all cones combined)

The opponent-process system is mathematically elegant: rather than encoding three separate absolute color channels, it encodes differences. Three opponent axes:

1. **Red-Green** -- L-cone minus M-cone response
2. **Blue-Yellow** -- S-cone minus (L+M)-cone response
3. **Black-White** -- Sum of all cone responses (luminance)

These three axes map directly onto the "cardinal directions" of psychophysically defined color space. The system is more efficient and more robust than absolute encoding -- a principle shared with audio compression, where differential encoding outperforms absolute encoding.

---

## 3. The Cortical Pathway

From the retina, signals travel via the optic nerve to the lateral geniculate nucleus (LGN) of the thalamus, which organizes and repackages them before forwarding to primary visual cortex (V1) in the occipital lobe [1][2]:

| Stage | Structure | Function |
|-------|-----------|----------|
| Retina | S, M, L cones | Wavelength detection |
| Retina | Retinal ganglion cells | Opponent-process encoding |
| LGN | Lateral geniculate nucleus | Signal organization, relay |
| V1 | Primary visual cortex | Color + orientation joint coding |
| V4 | Extrastriate cortex "globs" | Full hue-space representation |
| IT cortex | Inferior temporal lobe | Color-shape integration |

V1 contains two types of color-sensitive neurons:
- **Single-opponent neurons** -- Respond to large areas of uniform color (useful for recognizing color scenes and atmospheres)
- **Double-opponent cells** -- Respond to color boundaries, textures, and patterns (useful for edge detection and form)

---

## 4. Joint Color-Shape Coding: Salk Institute 2019

A landmark study from the Salk Institute, published in *Science* in June 2019, overturned the classical model of visual processing [4]:

**Classical model:** The visual system encodes shape and color with different sets of neurons and combines them only at the highest brain centers.

**2019 finding:** Neurons in the primary visual cortex (V1) respond selectively to particular *combinations* of color and shape. Color and orientation are jointly coded and spatially organized in primate primary visual cortex.

The lead researchers (Li, Garg & Callaway) demonstrated that the brain "encodes color and form together in a systematic way" rather than processing them in separate streams before later combination. This finding has direct implications for understanding why certain art compositions feel unified while others feel fragmented -- the brain is processing color and form as a single integrated signal from the very first cortical stage.

Neuroscientist Bevil Conway (Wellesley/MIT) has noted that the brain appears to reflect what artists have long recognized: that color and shape can be decoupled or combined, each represented somewhat independently [5].

---

## 5. V4 Globs and Full Hue Representation

From V1, visual information proceeds through extrastriate cortex: V2, then V4. Color processing in the extended V4 area occurs in millimeter-sized modules called "globs" [1][2]:

- V4 is the first stage where the full range of hues in color space is represented
- Individual glob clusters are tuned to specific regions of color space
- V4 neurons provide input to the inferior temporal (IT) cortex, which integrates color with shape and form
- Damage to V4 produces cerebral achromatopsia -- the world appears in shades of gray while object recognition remains intact

The glob architecture means color is processed in a spatially organized mosaic, with nearby globs representing nearby colors in perceptual color space. This is analogous to the tonotopic organization of the auditory cortex, where nearby neurons respond to nearby frequencies.

---

## 6. Peripheral Color and the Fill-In Problem

The cone distribution in the human eye is uneven: cone density is highest at the fovea, extremely low in the periphery. Peripheral color vision is poor [5].

Much of the color perceived in the periphery may be "filled in" by what the brain expects based on context and memory. This has direct implications for composition: a viewer scanning a Phil Lewis print is constructing color as they go, with the brain filling gaps based on pattern and expectation.

The geometric repetition in Phil Lewis's work is not just aesthetically satisfying -- it feeds the brain's fill-in machinery with reliable pattern data. When the brain encounters a repeating geometric motif, it can predict (and therefore "see") the color and form in peripheral vision before the eye actually samples that region. The repetition makes the art more vivid, not less, because it gives the visual system a reliable template for perceptual construction.

---

## 7. Implications for Art

The neuroscience of visual perception reveals that art does not merely present visual information -- it manipulates a construction process:

1. **Color is differential, not absolute** -- Contrast matters more than hue. Phil Lewis's use of electric teal against warm amber exploits the opponent-process axes directly.
2. **Color and form are jointly coded** -- Compositions where color and shape align feel unified because V1 processes them as a single signal.
3. **Repetition aids peripheral perception** -- Geometric repetition provides the brain's fill-in system with reliable pattern data, making the artwork appear more vivid across the visual field.
4. **The fovea constructs, the periphery predicts** -- The viewer's eye tracks across the composition, building detailed color in the fovea while the periphery predicts based on pattern. The artist controls this process through compositional structure.

---

## 8. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Visual processing as biological signal processing; retinal feature detection |
| [FFA](../FFA/index.html) | Color in fursuit design and animation; texture perception in creative practice |
| [LED](../LED/index.html) | Color theory in LED design; RGB as additive color model; digital color vs. perception |
| [ART](../ART/index.html) | Visual perception as foundation for art theory |
| [WAL](../WAL/index.html) | Parody as perceptual transformation; recognizing the original through the modified form |

---

## 9. Sources

1. [Mechanism of human color vision -- Frontiers in Neuroscience (2024), PMC11221215](https://pubmed.ncbi.nlm.nih.gov/)
2. [Color Vision -- Wikipedia (cross-referenced with primary sources)](https://en.wikipedia.org/wiki/Color_vision)
3. [American Museum of Natural History -- How We See Color](https://www.amnh.org/explore/ology/brain/seeing-color)
4. Li, P., Garg, A., & Callaway, E. (2019). "Color and orientation are jointly coded and spatially organized in primate primary visual cortex." *Science*, 364(6447), 1275. DOI: 10.1126/science.aaw5868.
5. Conway, B. (2009). "Cortical mechanisms of colour vision." *Nature Reviews Neuroscience*. DOI: 10.1038/nrn1138.
