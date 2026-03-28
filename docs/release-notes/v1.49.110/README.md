# v1.49.110 "Every Lesson a Handshake Between a Beginner and a Coordinate System"

**Released:** 2026-03-28
**Code:** NEH
**Series:** PNW Research Series (#110 of 167)

## Summary

Jeff Molofee's NeHe Productions -- Neon Helium -- was the corpus that defined an entire generation of 3D graphics programmers. Between 1997 and 2012, the 48 tutorials taught OpenGL to hundreds of thousands of developers: the ones who built the games, the simulations, the visualizers. This research preserves the complete NeHe knowledge graph as executable intelligence inside skill-creator, with YAML taxonomy, JSON-LD concept DAG, a deprecation map flagging 15+ legacy patterns, and modernized Python implementations for all 48 lessons.

## Key Features

| Metric | Value |
|--------|-------|
| Research Modules | 6 |
| Total Lines | ~4,409 |
| Safety-Critical Tests | 5 |
| Parallel Tracks | 3 |
| Est. Tokens | ~350K |
| Color Theme | Deep space indigo / shader purple / OpenGL green (#1A237E primary, #4A148C tertiary, #1B5E20 gl-green) |

### Research Modules

1. **M1: Taxonomy & Skill Mapping** -- Machine-readable knowledge graph: YAML taxonomy of all 48 lessons, JSON-LD concept DAG with prerequisite edges, skill definition for the "opengl-lesson" skill type. The intelligence backbone.
2. **M2: Foundation Track (L01-L12)** -- Window setup, first triangle, color, rotation, 3D shapes, texture mapping, filters and lighting, blending, moving bitmaps, 3D world loading, flag/wave effect, display lists. From blank window to textured, lit 3D scene.
3. **M3: Intermediate Track (L13-L24)** -- Bitmap fonts, outline fonts, texture-mapped fonts, fog, quadrics, particle engine, line-based extensions, morphing, picking, reflections/clipping, TGA loading.
4. **M4: Advanced Track (L25-L36)** -- Morphing and OBJ loading, stencil buffer reflections, shadow volumes, Bezier patches, collision detection, heightmap terrain, text-to-texture, multi-texturing, cel shading, compressed textures, spring-mass physics.
5. **M5: Expert Track (L37-L48)** -- Cel-shading techniques, compressed textures, physical simulation, rope physics (Verlet integration), virtual worlds with ODE, multiple viewports, FreeType fonts, 3D lens flare, vertex buffer objects, fullscreen antialiasing, CG shader translation, ArcBall rotation.
6. **M6: Upstream Intelligence** -- Intelligence index for agent queries, DACP three-part bundle schemas, deprecation map (15+ legacy patterns flagged), documentation index searchable by concept/lesson/API function.

### Cross-References

- **VKD** (Vulkan Desktop) -- GPU pipeline architecture, texture mapping, lighting models, shader translation, vertex buffer objects, deprecation map
- **WAL** (Wall of Sound) -- OpenGL pipeline, lighting models, shader translation, compute shaders
- **VKS** (Vulkan Screensaver) -- NeHe lesson translation to Vulkan/SPIR-V plugins
- **OCT** (OctaMED) -- Demoscene / demoparty culture overlap
- **SYS** (Systems Administration) -- CMake build systems

## Retrospective

### What Worked
- The four-tier skill progression (Foundation, Intermediate, Advanced, Expert) maps directly to the original NeHe curriculum structure -- the research preserves pedagogical intent
- Building the deprecation map as a first-class deliverable makes the research immediately actionable: agents know which OpenGL patterns to avoid and what modern equivalents to suggest
- The JSON-LD concept DAG with prerequisite edges enables traversal-based queries -- "what do I need to know before shadow volumes?" resolves automatically

### What Could Be Better
- The 43 platform ports (C, Java, Python, Delphi, etc.) are catalogued but not deeply analyzed -- the cross-language translation patterns are architecturally interesting
- WebGL and WebGPU modernization paths are mentioned but not fully specified for each lesson

## Lessons Learned

- A curriculum is a directed acyclic graph -- each lesson has defined prerequisites, concepts introduced, and successors -- and treating it that way enables machine traversal, not just human reading
- The deprecation map is not just a compatibility tool -- it is a model of how APIs evolve, how fixed-function pipelines become programmable shaders, how the architecture of graphics itself changed over two decades
- NeHe's pedagogical success came from sequencing: each lesson introduced exactly one new concept on top of working code, reducing cognitive load to a single delta per step

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
