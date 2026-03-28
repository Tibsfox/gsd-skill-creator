# XScreenSaver Catalog -- 240+ Hacks, API Families & Technique Taxonomy

## Overview

XScreenSaver, maintained by Jamie Zawinski (jwz) since 1992, is the definitive screensaver framework for Unix systems. At version 6.14 in early 2026 with over 240 individual "hacks," it spans a complete history of generative graphics: from the simplest Xlib line-drawing programs to fully procedural GLSL shader programs ported from Shadertoy.

Each hack is a standalone program, sandboxed and independently executable, rendering onto a window provided by the daemon via the `$XSCREENSAVER_WINDOW` environment variable. This architecture -- a separation of concerns executed with surgical precision -- is what the Amiga Principle looks like applied to visual software.

## Architectural Properties

- **Language:** All hacks are written in ISO C99 (not C++)
- **No nonstandard libraries:** Each hack is self-contained
- **Sandboxed execution:** Display modes run in separate processes; crash in a hack cannot unlock the screen
- **Window protocol:** Hacks render to an externally provided window ID
- **Compatibility layers:** `jwxyz` (X11 API on Cocoa), `jwzgles` (OpenGL 1.3 on OpenGL ES 1.0)

## API Family Classification

The 240+ hacks divide into four primary API families, reflecting four decades of graphics API evolution on Unix:

### X11/Xlib Family (~120 hacks)

The original API family. Programs draw using raw X11 primitives: `XDrawLine`, `XFillRectangle`, `XPutImage`. These hacks represent the earliest era of screensaver programming, when pixels were large enough to count.

**Representative hacks:**
- `attraction` -- Particle systems with gravitational attraction
- `maze` -- Recursive maze generation and solution
- `rorschach` -- Symmetric inkblot generation
- `flame` -- Iterated function system fractals
- `drift` -- Fractal drift patterns
- `coral` -- Coral reef growth simulation
- `crystal` -- Crystalline symmetry patterns

### OpenGL 1.3 Family (~100 hacks)

The xlockmore API compatibility layer. These hacks use fixed-function OpenGL pipeline: display lists, immediate mode rendering, GLU quadrics. They represent the era when 3D hardware acceleration became accessible.

**Representative hacks:**
- `glplanet` -- Textured rotating Earth
- `gears` -- Interlocking gear mechanisms
- `superquadrics` -- Parametric surface rendering
- `molecule` -- 3D molecular structure visualization
- `cage` -- Escher-inspired impossible geometry
- `stairs` -- Another Escher tribute
- `morph3d` -- Morphing polyhedra

### GLSL/Shader Family (~15 hacks)

Native GLSL shader programs written specifically for XScreenSaver. These use the programmable pipeline with vertex and fragment shaders compiled at runtime.

**Representative hacks:**
- `hexstrut` -- Hexagonal strut patterns
- `hydrostat` -- Fluid dynamics visualization
- `raverhoop` -- Rave-style light hoop physics
- `energystream` -- Particle energy streams

### Shadertoy Port Family (~10 hacks)

Shaders imported from Shadertoy.com using XScreenSaver 6.14's GLSL compatibility shims. These target four GLSL profiles: OpenGL compatibility 3.1-4.6, macOS Core Profile 4.1, iOS OpenGL ES 3.0, and Android OpenGL ES 3.0-3.2.

**Representative hacks:**
- `splodesic` -- Exploding geodesic forms
- `quasicrystal` -- Penrose-tiling quasicrystal patterns
- `unknownpleasures` -- Joy Division album cover visualization

## Technique Taxonomy

Beyond API family, each hack employs one or more generative techniques. This taxonomy enables skill-creator to match screensaver patterns to computational techniques:

| Technique | Count | Examples |
|---|---|---|
| Cellular automata | 8+ | `ant`, `life`, `crystal` |
| Strange attractors | 5+ | `attraction`, `strange`, `lorenz` |
| Fractal geometry | 12+ | `flame`, `ifs`, `drift`, `julia` |
| Particle systems | 10+ | `fireworkx`, `fountain`, `galaxy` |
| L-systems / growth | 4+ | `coral`, `forest`, `plant` |
| Geometry / polyhedra | 15+ | `polyominoes`, `superquadrics`, `morph3d` |
| Physics simulation | 8+ | `molecules`, `fluidballs`, `grav` |
| Maze / path | 4+ | `maze`, `thornbird`, `pacman` |
| Text / typography | 3+ | `fontglide`, `starwars`, `fliptext` |
| Image manipulation | 6+ | `decayscreen`, `slidescreen`, `photopile` |
| Abstract / mathematical | 20+ | `interference`, `moire`, `truchet` |

## Upstream Intelligence Schema

For skill-creator integration, each hack is mapped to a structured record:

```
{
  "name": "attraction",
  "api_family": "xlib",
  "technique": ["particle_systems", "gravitational"],
  "source_file": "hacks/attraction.c",
  "category": "simulation",
  "opengl_version": null,
  "glsl_profile": null,
  "skill_equivalence": "physics-particle-system",
  "complexity": "medium",
  "interactive": false,
  "description": "Gravitational particle attraction simulation"
}
```

This schema enables the upstream intelligence feed to detect when a new screensaver pattern appears and suggest a corresponding skill-creator skill.

## Source Organization

The XScreenSaver source tree is organized as:

```
xscreensaver/
  hacks/           -- X11/Xlib hacks (C source)
  hacks/glx/       -- OpenGL hacks (C source + GLSL)
  hacks/images/    -- Embedded image data
  driver/          -- Daemon, lock screen, preferences
  utils/           -- Shared utility libraries
  jwxyz/           -- X11 compatibility layer for macOS/iOS/Android
```

## Cross-References

> **Related:** [Vulkan Engine Architecture](02-vulkan-engine.md) for the modern engine that extends this legacy, [Sascha Willems Gallery](04-sascha-willems.md) for Vulkan-native technique equivalents.
