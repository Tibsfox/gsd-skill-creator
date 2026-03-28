# Intermediate Track (Lessons 13-24)

## Building the Visual Vocabulary

The intermediate track expands beyond basic geometry and lighting into text rendering, atmospheric effects, procedural geometry, and particle systems.

### Lesson 13 -- Bitmap Fonts

Text rendering in OpenGL using Windows bitmap fonts. wglUseFontBitmaps creates a set of display lists from a Windows font, one list per character. Text is rendered by calling these lists in sequence.

**Modernization note:** wglUseFontBitmaps is Windows-only and deprecated. Modern approach: FreeType + texture atlas (see Lesson 43).

### Lesson 14 -- Outline Fonts

3D extruded text using wglUseFontOutlines. Characters are rendered as solid geometry with depth, allowing lighting and rotation of text objects. The function generates vertex data from TrueType font outlines.

### Lesson 15 -- Texture-Mapped Fonts

Fonts rendered using a pre-built texture atlas. Each character occupies a cell in a grid texture. Text rendering becomes a series of textured quads with appropriate UV coordinates. This is the most portable font technique in the NeHe series and closest to modern practice.

### Lesson 16 -- Cool-Looking Fog

Atmospheric fog using OpenGL's built-in fog model:

| Fog Mode | Equation | Visual Effect |
|----------|----------|---------------|
| GL_LINEAR | f = (end - d) / (end - start) | Uniform density |
| GL_EXP | f = e^(-density * d) | Natural fog falloff |
| GL_EXP2 | f = e^(-(density * d)^2) | Dense, thick fog |

Fog is applied per-fragment, blending object color with fog color based on distance from the viewer. It adds depth perception and atmosphere to scenes.

### Lesson 17 -- 2D Texture Font (Improved)

An improved texture-based font system using a 256-character texture atlas. Characters are rendered as textured quads with per-character UV offsets calculated from the grid position. This approach is GPU-friendly and works identically across platforms.

### Lesson 18 -- Quadrics

GLU quadric objects provide parametric geometry generation:

- **gluSphere** -- sphere with configurable slices and stacks
- **gluCylinder** -- cylinder or cone
- **gluDisk** -- flat disk or partial disk (ring)
- **gluPartialDisk** -- sector of a disk

Quadrics automatically generate normals and texture coordinates, making them useful for quick prototyping of rounded geometry.

### Lesson 19 -- Particle Engine

The first physics-based rendering: a particle system with gravity, velocity, and color evolution. Each particle has:

- Position (x, y, z)
- Velocity (dx, dy, dz)
- Color (r, g, b, a) -- fades over lifetime
- Lifetime -- particle is recycled when expired

Particles are rendered as textured point sprites or small quads facing the camera (billboards). The system demonstrates the pattern: **allocate pool, update physics, render, recycle dead particles**.

### Lesson 20 -- Masking

Alpha masking using a two-pass technique: first render a black-and-white mask, then render the color image with blending. The mask controls which pixels of the color image are visible. This is a precursor to modern stencil-based and shader-based masking.

### Lesson 21 -- Lines and Line Extensions

Rendering lines with GL_LINES, GL_LINE_STRIP, and GL_LINE_LOOP. Antialiased lines using glEnable(GL_LINE_SMOOTH). Custom line patterns with glLineStipple for dashed and dotted lines.

Also demonstrates a simple interactive game rendered entirely with lines -- showing that complex behavior is possible with minimal rendering.

### Lesson 22 -- Bump Mapping (Emboss Method)

Multi-pass rendering technique that simulates surface relief without modifying geometry:

1. Render base texture
2. Render offset texture (shifted by light direction) with subtractive blending
3. The difference between passes creates an embossed appearance

This is a simplified version of normal mapping. The emboss method was popular in the late 1990s before shaders enabled true per-pixel lighting.

### Lesson 23 -- Sphere Environment Mapping

Simulates reflective surfaces using a pre-rendered environment map. The GL_SPHERE_MAP texture generation mode automatically computes texture coordinates based on the surface normal and view direction, producing chrome-like reflections.

### Lesson 24 -- Extensions and TGA Loading

Loading TGA (Targa) image files with alpha channel support. TGA became the preferred format for textures with transparency because BMP does not support alpha channels. Also demonstrates querying OpenGL extensions with glGetString(GL_EXTENSIONS).

---

> **Related:** See [Foundation Track](02-foundation-track.md) for the prerequisites these lessons build on, and [Advanced Track](04-advanced-track.md) for lessons 25-36.
