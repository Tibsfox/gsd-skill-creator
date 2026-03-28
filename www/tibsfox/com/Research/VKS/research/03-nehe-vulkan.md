# NeHe Vulkan Translation -- 48 Lessons Reborn in SPIR-V

## Overview

The NeHe OpenGL tutorial series by Jeff Molofee defined how a generation learned 3D graphics programming. Written between 1999 and 2003, the 48 lessons cover the entire fixed-function OpenGL pipeline from window creation through advanced effects. No authoritative Vulkan port of the full series exists. This module translates all 48 lesson concepts to Vulkan/SPIR-V screensaver plugins.

## Translation Philosophy

The goal is not a line-by-line port. OpenGL's immediate-mode API has no Vulkan equivalent. Instead, each lesson's *concept* is reimplemented using idiomatic Vulkan patterns:

- Fixed-function pipeline calls become descriptor sets and pipeline state objects
- `glBegin`/`glEnd` become vertex buffers with `vkCmdDraw`
- Display lists become indirect draw commands
- `gluPerspective` becomes push constants with a projection matrix
- Texture environment modes become fragment shader combiners

## Lesson Mapping

### Foundation Lessons (1-10)

| NeHe | Concept | Vulkan Translation |
|---|---|---|
| 01 | Window + GL context | Vulkan instance, device, swapchain creation |
| 02 | First triangle | Vertex buffer, pipeline, render to swapchain |
| 03 | Color interpolation | Per-vertex color attributes in vertex buffer |
| 04 | Rotation | Push constants for model-view matrix, uniform buffer |
| 05 | 3D shapes | Index buffers, multiple draw calls |
| 06 | Texture mapping | `VkImage`, `VkSampler`, descriptor sets |
| 07 | Texture filters | Sampler filter modes (nearest, linear, mipmap) |
| 08 | Blending | Pipeline blend state, alpha compositing |
| 09 | Moving bitmaps | Textured quads with instanced rendering |
| 10 | 3D world loading | OBJ-like mesh loading, camera matrix |

### Intermediate Lessons (11-24)

| NeHe | Concept | Vulkan Translation |
|---|---|---|
| 11 | Flag wave effect | Compute shader for vertex displacement |
| 12 | Display lists | Indirect draw buffers, pre-recorded command buffers |
| 13 | Bitmap fonts | Push-based glyph rendering with texture atlas |
| 14 | Outline fonts | SDF font rendering in fragment shader |
| 15 | Textured fonts | Combined SDF + texture sampling |
| 16 | Fog | Fragment shader distance fog (linear, exp, exp2) |
| 17 | 2D texture fonts | Sprite-based text with texture array |
| 18 | Quadrics | Compute-generated parametric surfaces |
| 19 | Particle engine | Compute shader particle system with transform feedback |
| 20 | Masking | Stencil buffer operations |
| 21 | Lines | Line topology, line width (where supported) |
| 22 | Bump mapping | Normal mapping with tangent-space computation |
| 23 | Sphere mapping | Environment mapping with cubemap |
| 24 | Extensions | Vulkan extension querying and feature negotiation |

### Advanced Lessons (25-48)

| NeHe | Concept | Vulkan Translation |
|---|---|---|
| 25 | Morphing | Compute shader vertex interpolation between shapes |
| 26 | Clipping (stencil) | Stencil buffer reflections and clipping |
| 27 | Shadows (stencil) | Stencil shadow volumes |
| 28 | Bezier patches | Tessellation shader for parametric surfaces |
| 29 | Blitter effects | Compute shader image processing |
| 30 | Collision detection | Compute shader AABB/sphere intersection |
| 31 | Model loading | glTF 2.0 loading (modern equivalent of .ms3d) |
| 32 | Picking | Compute shader ray casting from screen coords |
| 33 | TGA loading | `stb_image` + VkImage upload pipeline |
| 34 | Heightmap terrain | Tessellation + displacement mapping |
| 35 | AVI playback | Video texture via Vulkan video decode (VK_KHR_video) |
| 36 | Radial blur | Multi-pass rendering with accumulation buffer |
| 37 | Cel shading | Fragment shader quantized lighting |
| 38 | Custom texture load | Compressed texture formats (BC, ASTC) |
| 39 | Intro to physics | Compute shader Verlet integration |
| 40 | Rope physics | Compute shader constraint-based rope |
| 41 | Volumetric fog | Ray marching in fragment shader |
| 42 | Multiple viewports | Multiple render passes to subregions |
| 43 | FreeType fonts | GPU-accelerated text with Vulkan FreeType |
| 44 | 3D lens flare | Occlusion query + billboard sprites |
| 45 | Vertex buffer objects | Already the default Vulkan paradigm |
| 46 | GLSL intro | The entire Vulkan pipeline is shader-based |
| 47 | CG shaders | SPIR-V as the universal shader IR |
| 48 | ArcBall rotation | Quaternion trackball in push constants |

## Shader Compilation

All shaders are authored in GLSL and compiled to SPIR-V using `glslc` (from the Vulkan SDK):

```bash
glslc -fshader-stage=vertex nehe01.vert.glsl -o nehe01.vert.spv
glslc -fshader-stage=fragment nehe01.frag.glsl -o nehe01.frag.spv
```

Each lesson plugin loads its compiled SPIR-V at initialization and creates a `VkShaderModule` from the bytecode.

## Cross-References

> **Related:** [Vulkan Engine Architecture](02-vulkan-engine.md) for the plugin system these lessons target, [Sascha Willems Gallery](04-sascha-willems.md) for more advanced Vulkan technique examples.
