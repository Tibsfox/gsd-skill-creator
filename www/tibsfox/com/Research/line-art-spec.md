# Line Art Specification — Seattle 360 / Sound of Puget Sound

## Purpose

Every degree produces a `line-art.svg` for both Part A (S36) and Part B (SPS). These are **seeds** — simple ink-on-parchment line drawings that grow richer with each pass through the circle.

## Design Language

Derived from the Paintless Dog watercolor painting (brand source):

- **Ink linework** — `#2a2a2a` strokes, three weights: thin (1.2px), med (2px), bold (3px)
- **Fox-orange wash** — `#c75b3a` at 25% opacity, accent highlights
- **Amber splashes** — `#e89848` at 6-8% opacity, background texture
- **Forest wash** — `#2d5a3a` at 4-5% opacity, ecological elements
- **River wash** — `#1e6ca0` at 5% opacity, water/sky elements
- **Parchment ground** — transparent SVG, designed to sit on `#f5f0e6`

## Geometry Foundation

The unit circle and mathematical structures explored in the project inform the compositions:

- **Radial symmetry** — degree position maps to composition angle
- **Golden ratio** — use phi (1.618) for proportional relationships
- **Sine/cosine curves** — waveforms for acoustic elements, flight paths
- **Fibonacci spirals** — shell forms, feather arrangements, musical progressions
- **Bezier curves** — all organic forms use cubic beziers, never straight-line approximations

## Part A (S36) — Artist Line Art

Each artist gets an SVG capturing their **instrument** or **signature gesture**:

| Element | Approach |
|---------|----------|
| Instrument | Primary subject — trumpet, guitar, microphone, turntable, piano |
| Musical notation | Staff lines, notes, or waveforms radiating from the instrument |
| Fox-orange accent | Applied to the instrument's resonant surface (bell, soundhole, screen) |
| Genre signature | Visual hint — blues bend, jazz angle, folk simplicity, electronic grid |
| Degree label | Bottom center, Georgia serif, `#8a8884` |

## Part B (SPS) — Species Line Art

Each species gets an SVG capturing their **silhouette** or **signature behavior**:

| Element | Approach |
|---------|----------|
| Silhouette | Primary subject — field-guide accurate proportions |
| Habitat line | Single-stroke suggestion of habitat (water line, branch, grass) |
| Acoustic element | Visual representation of the degree's named sound element |
| Fox-orange accent | Applied to one distinguishing feature (beak, crown, wing bar) |
| Degree label | Bottom center, Georgia serif, `#8a8884` |

## SVG Template

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <style>
    .ink { fill: none; stroke: #2a2a2a; stroke-linecap: round; stroke-linejoin: round; }
    .ink-thin { stroke-width: 1.2; }
    .ink-med { stroke-width: 2; }
    .ink-bold { stroke-width: 3; }
    .wash { fill: none; stroke: #c75b3a; stroke-width: 1.5; opacity: 0.25; }
    .splash { fill: #e89848; opacity: 0.06; }
  </style>

  <!-- Background splashes -->
  <!-- Subject -->
  <!-- Accent wash -->
  <!-- Degree label -->
  <text x="200" y="370" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#8a8884">N° — Subject Name</text>
  <text x="200" y="386" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="#8a8884" font-style="italic">acoustic element name</text>
</svg>
```

## File Location

```
S36/research/releases/NNN-slug/line-art.svg
SPS/research/releases/NNN-slug/line-art.svg
```

## Integration with index.html

Each degree's `index.html` should embed the SVG:

```html
<div class="line-art">
  <img src="line-art.svg" alt="Degree N line art — Subject Name" loading="lazy"/>
</div>
```

## Progression

- **Pass 1 (current):** Simple silhouettes and instrument sketches. Seeds.
- **Pass 2:** Add acoustic waveform overlays derived from the named elements.
- **Pass 3:** Add habitat context, cross-reference visual threads.
- **Pass 4:** Full watercolor-style compositions with layered washes.

## Chipset Integration

This spec should be wired into the research agent prompts so line art is **always produced** alongside the four standard files (research.md, index.html, knowledge-nodes.json, retrospective.md). The degree pipeline becomes a **five-file** output per side.
