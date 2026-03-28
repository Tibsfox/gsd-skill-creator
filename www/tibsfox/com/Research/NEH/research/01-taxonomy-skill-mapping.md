# Taxonomy and Skill Mapping

## The Rendering Knowledge Graph

The 48 NeHe lessons form a directed acyclic graph (DAG) -- a rendering knowledge graph where each lesson is a skill node with defined prerequisites, concepts introduced, and successors. This module maps that graph into machine-readable form for skill-creator.

## Tier Classification

### Tier 0: Foundation (L01-L05)

The bedrock. Every OpenGL program starts here.

| Lesson | Title | Concepts Introduced |
|--------|-------|-------------------|
| L01 | Setting Up an OpenGL Window | Window creation, GL context, message loop |
| L02 | Your First Polygon | glBegin/glEnd, GL_TRIANGLES, GL_QUADS |
| L03 | Adding Color | glColor3f, vertex coloring, smooth shading |
| L04 | Rotation | glRotatef, modelview matrix, animation loop |
| L05 | 3D Shapes | Depth buffer, glEnable(GL_DEPTH_TEST), cube/pyramid |

### Tier 1: Texture and Light (L06-L12)

Visual richness. The scene becomes believable.

| Lesson | Title | Concepts Introduced |
|--------|-------|-------------------|
| L06 | Texture Mapping | glTexImage2D, texture coordinates, BMP loading |
| L07 | Texture Filters + Lighting | GL_NEAREST/LINEAR/MIPMAP, GL_LIGHT0, normals |
| L08 | Blending | glBlendFunc, transparency, GL_SRC_ALPHA |
| L09 | Moving Bitmaps in 3D | Textured quads as sprites, orthographic projection |
| L10 | Loading a 3D World | Text file parsing, vertex/triangle data, walkthrough |
| L11 | Flag/Wave Effect | Sine wave mesh deformation, animated textures |
| L12 | Display Lists | glNewList/glCallList, precompiled geometry batches |

### Tier 2: Intermediate (L13-L24)

Building the visual vocabulary.

| Lesson | Title | Concepts Introduced |
|--------|-------|-------------------|
| L13 | Bitmap Fonts | wglUseFontBitmaps, text rendering |
| L14 | Outline Fonts | wglUseFontOutlines, 3D text extrusion |
| L15 | Texture-Mapped Fonts | Font atlas, UV mapping for text |
| L16 | Cool-Looking Fog | glFog, linear/exponential fog modes |
| L17 | 2D Texture Font | Texture atlas for glyph rendering |
| L18 | Quadrics | gluSphere, gluCylinder, gluDisk, GLU quadric objects |
| L19 | Particle Engine | Point sprites, physics-based motion, recycling |
| L20 | Masking | Blending-based masking, texture composition |
| L21 | Lines / Line Extensions | GL_LINES, antialiased lines, custom patterns |
| L22 | Bump Mapping (Emboss) | Multi-pass rendering, texture coordinate offsets |
| L23 | Sphere Mapping / Environment Maps | GL_SPHERE_MAP, chrome-like reflections |
| L24 | Extensions / TGA Loading | TGA file format, alpha channel loading |

### Tier 3: Advanced (L25-L36)

Significant rendering techniques.

| Lesson | Title | Key Technique |
|--------|-------|--------------|
| L25 | Morphing + OBJ Loading | Vertex interpolation, Wavefront OBJ parser |
| L26 | Stencil Buffer Reflections | glStencilOp, planar reflections |
| L27 | Shadow Volumes | Stencil-based shadow geometry |
| L28 | Bezier Patches | Parametric surface evaluation |
| L29 | Blitter / Direct Pixel | glDrawPixels, software rasterization |
| L30 | Collision Detection | Ray-plane intersection, spatial queries |
| L31 | Model Loading (Milkshape) | MS3D format, skeletal animation prep |
| L32 | Picking | GL_SELECT mode, name stack, ray casting |
| L33 | TGA Loading (Compressed) | RLE-compressed TGA support |
| L34 | Heightmap Terrain | Grid mesh from grayscale image |
| L35 | Playing AVI in OpenGL | Video texture streaming (Windows-specific) |
| L36 | Translucent/Radial Blur | Multi-pass blending, accumulation buffer |

### Tier 4: Expert (L37-L48)

Cutting-edge techniques for their era.

| Lesson | Title | Key Technique |
|--------|-------|--------------|
| L37 | Cel Shading (Toon) | 1D texture lookup for stylized shading |
| L38 | Loading Compressed Textures | DXT/S3TC, glCompressedTexImage2D |
| L39 | Physical Simulation Intro | Spring-mass systems, Hooke's law |
| L40 | Rope Physics | Verlet integration, constraint satisfaction |
| L41 | Virtual Worlds / ODE | Open Dynamics Engine integration |
| L42 | Multiple Viewports | glViewport, split-screen rendering |
| L43 | FreeType Fonts in OpenGL | FreeType2 library, anti-aliased glyph rendering |
| L44 | 3D Lens Flare | Billboard quads, occlusion testing |
| L45 | Vertex Buffer Objects | glGenBuffers, GPU-side vertex data, modern path |
| L46 | Fullscreen Antialiasing | Multisampling, WGL_ARB_multisample |
| L47 | CG Shader Introduction | NVIDIA Cg, vertex/fragment programs |
| L48 | ArcBall Rotation | Quaternion-based trackball interaction |

## Prerequisite Graph

```
L01 --> L02 --> L03 --> L04 --> L05
                                 |
                    L06 --> L07 --> L08 --> L12
                     |              |
                    L09 --> L10 --> L11
                     |
               L13,L14,L15 --> L17
                     |
                    L16 --> L18 --> L19
                                    |
                    L22 --> L23 --> L24
                     |
          L25 --> L26 --> L27 --> L28
           |              |
          L30 --> L32    L31
           |
     L34 --> L37 --> L38 --> L39 --> L40
                              |
                    L45 --> L46 --> L47 --> L48
```

## Deprecation Mapping

The NeHe tutorials use legacy OpenGL (fixed-function pipeline). Modern OpenGL (3.3+) deprecates many of these patterns:

| Legacy Pattern | Modern Equivalent | Lessons Affected |
|---------------|-------------------|-----------------|
| glBegin/glEnd | VBOs + glDrawArrays | L02-L36 |
| glLight/glMaterial | Shader-based lighting | L07+ |
| glTexEnv | Fragment shaders | L06+ |
| Display lists | VBOs + VAOs | L12 |
| GL_SELECT picking | Ray casting / FBO | L32 |
| glDrawPixels | Texture + fullscreen quad | L29 |
| wglUseFontBitmaps | FreeType + texture atlas | L13-L15 |
| Cg shaders | GLSL | L47 |

---

> **Related:** See [Foundation Track](02-foundation-track.md) for the first 12 lessons implemented, and [Upstream Integration](06-upstream-integration.md) for the DACP schemas that make this taxonomy queryable.
