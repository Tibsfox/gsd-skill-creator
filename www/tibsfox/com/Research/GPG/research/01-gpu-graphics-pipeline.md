# GPU Graphics Pipeline

> **Domain:** GPU Architecture and Graphics Programming
> **Module:** 1 -- Vertex, Fragment, Geometry, Tessellation, and Compute Shaders
> **Through-line:** *The GPU does not think. It executes. A billion shader invocations per second, each one stateless, each one independent, each one doing exactly the one thing it was programmed to do. The CPU submits work orders. The GPU fills pixels. The architecture's power comes from this division of labor -- the same principle that let three Amiga custom chips outperform workstations costing ten times their price.*

---

## Table of Contents

1. [The Rendering Pipeline](#1-the-rendering-pipeline)
2. [Vertex Processing](#2-vertex-processing)
3. [Primitive Assembly and Rasterization](#3-primitive-assembly-and-rasterization)
4. [Fragment Processing](#4-fragment-processing)
5. [Geometry Shaders](#5-geometry-shaders)
6. [Tessellation](#6-tessellation)
7. [Compute Shaders](#7-compute-shaders)
8. [Shader Languages: GLSL and SPIR-V](#8-shader-languages-glsl-and-spir-v)
9. [GPU Memory Architecture](#9-gpu-memory-architecture)
10. [The Hello Triangle](#10-the-hello-triangle)
11. [Pipeline State and Optimization](#11-pipeline-state-and-optimization)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Rendering Pipeline

The modern GPU graphics pipeline is a fixed-function and programmable hybrid. Fixed stages handle rasterization, depth testing, and blending. Programmable stages -- vertex, tessellation, geometry, fragment, and compute shaders -- execute user-defined programs on massively parallel hardware [1].

The pipeline processes geometry in strict order:

```
GPU GRAPHICS PIPELINE -- MODERN PROGRAMMABLE ARCHITECTURE
================================================================

  Application (CPU)
       |
       | Draw calls, vertex data, uniforms
       v
  +-----------------+
  | Input Assembly  | Fixed: reads vertex/index buffers
  +-----------------+
       |
       v
  +-----------------+
  | Vertex Shader   | Programmable: transforms vertices
  +-----------------+
       |
       v
  +-----------------+
  | Tessellation    | Programmable (optional): subdivides patches
  | Control + Eval  |
  +-----------------+
       |
       v
  +-----------------+
  | Geometry Shader | Programmable (optional): per-primitive ops
  +-----------------+
       |
       v
  +-----------------+
  | Rasterization   | Fixed: converts primitives to fragments
  +-----------------+
       |
       v
  +-----------------+
  | Fragment Shader | Programmable: computes per-pixel color
  +-----------------+
       |
       v
  +-----------------+
  | Output Merger   | Fixed: depth test, stencil, blending
  +-----------------+
       |
       v
    Framebuffer
```

OpenGL 1.0 (1992) provided only the fixed-function pipeline [2]. OpenGL 2.0 (2004) introduced GLSL programmable shaders. OpenGL 4.0 (2010) added tessellation stages. OpenGL 4.3 (2012) added compute shaders. Each addition replaced a fixed-function stage with a programmable one, moving expressiveness from the driver to the developer.

The Vulkan specification (1.0, February 2016) made the entire pipeline explicitly controlled by the application [3]. No implicit state. No driver guessing. Every pipeline state object is compiled ahead of time. This explicitness is what enables Vulkan to submit draw calls with an order of magnitude less CPU overhead than OpenGL -- measured at 100K+ draw calls per frame on commodity hardware [4].

---

## 2. Vertex Processing

The vertex shader runs once per vertex. It receives vertex attributes (position, normal, texture coordinates, color) from vertex buffers bound during input assembly and outputs clip-space position plus any interpolated data the fragment shader needs [1].

### Model-View-Projection Transform

The canonical vertex transform chain:

```
VERTEX TRANSFORM PIPELINE
================================================================

  Object Space          Model Matrix          World Space
  (local coords) ------> [M] ------> (scene coords)
                                           |
                              View Matrix   |
                              [V] <---------+
                                |
                          Camera Space
                          (eye coords)
                                |
                     Projection Matrix
                          [P]
                                |
                          Clip Space
                          (NDC after w-divide)
                                |
                       Viewport Transform
                                |
                         Screen Space
                       (pixel coords)

  Combined: gl_Position = P * V * M * vec4(position, 1.0)
```

In GLSL, the minimal vertex shader:

```
#version 330 core
layout (location = 0) in vec3 aPos;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main() {
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}
```

### Vertex Buffer Objects (VBOs) and Vertex Array Objects (VAOs)

OpenGL 3.0 core profile requires all vertex data to reside in GPU-side buffer objects [5]. A VBO stores the raw vertex data. A VAO stores the attribute layout -- which VBO, stride, offset, and data type for each attribute slot. Binding a single VAO before drawing restores the entire vertex format configuration. This is the OpenGL equivalent of Agnus pre-loading DMA pointers: specify the data layout once, then just issue the draw command.

### Instanced Rendering

`glDrawArraysInstanced` and `glDrawElementsInstanced` allow the GPU to render thousands of identical meshes with per-instance variation (position, color, scale) stored in a separate VBO with a divisor [6]. A forest of 10,000 trees rendered with a single draw call and a per-instance model matrix buffer. The GPU's parallelism makes this trivially efficient -- each instance is independent, requiring no synchronization.

> **Related:** [Vulkan and Modern APIs](02-vulkan-modern-apis.md) -- Vulkan's command buffers make instanced rendering even more explicit. [Shader Programming](05-shader-programming.md) -- GLSL instancing built-ins like `gl_InstanceID`.

---

## 3. Primitive Assembly and Rasterization

After vertex processing, the GPU assembles vertices into primitives (points, lines, triangles) and performs clipping against the view frustum. Vertices outside the clip volume are discarded or clipped to the frustum boundary [1].

### Rasterization Algorithm

The rasterizer converts each triangle into a set of fragments -- candidate pixels that may contribute to the final image. The standard approach is edge-function rasterization [7]:

For a triangle with vertices v0, v1, v2 and a sample point p:

```
E01(p) = (v1.x - v0.x) * (p.y - v0.y) - (v1.y - v0.y) * (p.x - v0.x)
E12(p) = (v2.x - v1.x) * (p.y - v1.y) - (v2.y - v1.y) * (p.x - v1.x)
E20(p) = (v0.x - v2.x) * (p.y - v2.y) - (v0.y - v2.y) * (p.x - v2.x)
```

Point p is inside the triangle if all three edge functions have the same sign. Modern GPUs evaluate this in parallel across 2x2 pixel quads, which is why fragment shaders always execute in 2x2 groups even if some fragments are outside the triangle [8].

### Face Culling and Winding Order

Triangles have a front and back face determined by vertex winding order. Counter-clockwise (CCW) winding is the OpenGL default for front faces. Back-face culling eliminates approximately 50% of triangles in a closed mesh, nearly doubling rasterization throughput [1].

---

## 4. Fragment Processing

The fragment shader runs once per fragment (candidate pixel). It receives interpolated vertex outputs and computes the final color. This is where texturing, lighting, shadows, and all per-pixel visual effects happen [1].

### Phong Lighting Model

The Blinn-Phong model remains the baseline for real-time lighting [9]:

```
BLINN-PHONG LIGHTING COMPONENTS
================================================================

  Ambient:  Ia = ka * Ia_global
  Diffuse:  Id = kd * (N . L) * Il
  Specular: Is = ks * (N . H)^n * Il

  Where:
    N = surface normal (normalized)
    L = light direction (normalized)
    H = halfway vector = normalize(L + V)
    V = view direction (normalized)
    n = shininess exponent (1 to 256+)

  Final: I = Ia + Id + Is (clamped to [0,1])
```

### Texture Sampling

Texture sampling in the fragment shader is where the GPU's dedicated texture units earn their silicon. A single `texture(sampler2D, uv)` call invokes hardware-accelerated bilinear filtering, mipmap selection, and anisotropic filtering -- operations that would require dozens of arithmetic instructions if done manually [10].

Mipmap levels are pre-computed at powers-of-two resolution. The hardware selects the appropriate level based on the screen-space derivatives of the texture coordinates (computed from the 2x2 quad), then bilinearly interpolates between the two nearest mip levels (trilinear filtering). Anisotropic filtering takes up to 16 additional samples along the axis of maximum compression [10].

### Deferred Rendering

Forward rendering evaluates lighting for every fragment, including those occluded by closer geometry. Deferred rendering splits the pipeline into two passes [11]:

1. **Geometry pass:** Render scene to multiple render targets (G-buffer) storing position, normal, albedo, specular, and depth per pixel.
2. **Lighting pass:** For each light, render a screen-space quad (or volume) that reads the G-buffer and computes lighting only for visible pixels.

This decouples geometric complexity from lighting complexity. A scene with 1,000 lights and 1 million triangles evaluates each light against only the visible pixels, not against every triangle [11].

---

## 5. Geometry Shaders

Geometry shaders (OpenGL 3.2 / GLSL 150) operate on complete primitives -- receiving all vertices of a triangle, line, or point and outputting zero or more new primitives [12].

Use cases:
- **Point sprites:** Convert points to camera-facing quads
- **Shadow volume extrusion:** Extend silhouette edges to infinity
- **Wireframe rendering:** Compute barycentric coordinates for edge detection
- **Level-of-detail selection:** Per-triangle LOD decisions

> **SAFETY WARNING:** Geometry shaders can amplify vertex count significantly. Outputting 128 vertices per input triangle on a 100K-triangle mesh creates 12.8M output vertices. Modern GPUs handle this, but it can exceed vertex throughput limits on mobile GPUs and Raspberry Pi VideoCore VII, which does not support geometry shaders in OpenGL ES 3.1 [13].

### Performance Considerations

Geometry shaders have been largely superseded by mesh shaders (NVIDIA VK_NV_mesh_shader, OpenGL GL_NV_mesh_shader) and task shaders for amplification workloads [14]. The geometry shader's serial-within-primitive execution model prevents full utilization of SIMD lanes. Mesh shaders process meshlets in parallel, achieving 2-5x better throughput for the same vertex amplification workload on NVIDIA Turing and later architectures [14].

---

## 6. Tessellation

The tessellation stage (OpenGL 4.0) subdivides coarse patches into fine geometry on the GPU, enabling continuous level-of-detail without CPU-side mesh generation [15].

```
TESSELLATION PIPELINE
================================================================

  Input: Patch (control points)
         |
         v
  +-------------------------+
  | Tessellation Control    |  Programmable: sets tessellation
  | Shader (TCS)            |  levels, modifies control points
  +-------------------------+
         |
         v
  +-------------------------+
  | Tessellation Primitive  |  Fixed: generates new vertices
  | Generator (TPG)         |  based on tessellation levels
  +-------------------------+
         |
         v
  +-------------------------+
  | Tessellation Evaluation |  Programmable: positions each
  | Shader (TES)            |  generated vertex
  +-------------------------+
```

The tessellation control shader sets inner and outer tessellation levels per patch. These levels determine how many subdivisions the fixed-function tessellator generates. A terrain patch visible at 10 meters might use tessellation level 64; the same patch at 500 meters drops to level 4. The GPU handles the geometry generation entirely on-chip [15].

### Displacement Mapping

With tessellation, displacement maps become practical in real-time. The TES reads a heightmap texture and displaces each generated vertex along its normal:

```
vec4 pos = mix(mix(p0, p1, u), mix(p3, p2, u), v);
float height = texture(heightMap, texCoord).r;
pos.xyz += normal * height * displacementScale;
gl_Position = projection * view * model * pos;
```

This technique is fundamental to terrain rendering in modern engines. A 256x256 control mesh tessellated to level 64 produces over 16 million triangles -- generated entirely on the GPU from a single draw call and a texture read [15].

---

## 7. Compute Shaders

Compute shaders (OpenGL 4.3 / Vulkan 1.0) run outside the graphics pipeline entirely. They have no fixed-function input or output. They read and write buffer objects and images using explicit memory operations [16].

### Work Groups and Invocations

Compute shaders execute in three-dimensional work groups:

```
COMPUTE SHADER DISPATCH MODEL
================================================================

  glDispatchCompute(num_groups_x, num_groups_y, num_groups_z)

  Each work group contains:
    layout(local_size_x = 16, local_size_y = 16, local_size_z = 1)

  Total invocations = groups_x * groups_y * groups_z *
                      local_x * local_y * local_z

  For a 1920x1080 image with 16x16 local size:
    glDispatchCompute(120, 68, 1)
    = 120 * 68 * 1 * 16 * 16 * 1
    = 2,088,960 shader invocations
```

### Shared Memory

Invocations within a work group share a fast on-chip memory pool (shared in GLSL, workgroupMemory in SPIR-V). This enables cooperative algorithms like parallel reduction, prefix sum, and tiled matrix multiplication [16].

Typical shared memory sizes: 32-48 KB per work group on desktop GPUs (NVIDIA Ampere: 48 KB configurable shared/L1), 16-32 KB on mobile GPUs [17].

### Use Cases in the GSD-OS Context

- **Post-processing:** Bloom, blur, tone mapping as compute passes instead of full-screen fragment shaders -- avoids the 2x2 quad overhead for non-pixel-aligned operations [18]
- **Particle simulation:** Update millions of particles per frame with shared memory for neighbor queries
- **Physics:** Cloth simulation, fluid dynamics on GPU buffers fed back to the vertex pipeline
- **Image processing:** Histogram computation, convolution kernels for the CRT shader engine

> **Related:** [GPU Observability](06-gpu-observability.md) -- compute shader dispatch metrics tracked via NVML and OTel instrumentation.

---

## 8. Shader Languages: GLSL and SPIR-V

### GLSL

The OpenGL Shading Language has evolved from GLSL 110 (OpenGL 2.0) to GLSL 460 (OpenGL 4.6). Each version adds capabilities matching the pipeline features of its OpenGL version [19]:

| GLSL Version | OpenGL | Key Additions |
|---|---|---|
| 110 | 2.0 | Basic vertex/fragment shaders |
| 130 | 3.0 | Integer types, texture functions |
| 150 | 3.2 | Geometry shaders, in/out blocks |
| 330 | 3.3 | Layout qualifiers (the modern baseline) |
| 400 | 4.0 | Tessellation shaders, double precision |
| 430 | 4.3 | Compute shaders, SSBOs, image load/store |
| 460 | 4.6 | SPIR-V consumption, shader ballot, subgroup ops |

### SPIR-V

SPIR-V (Standard Portable Intermediate Representation) is the binary shader format for Vulkan. Unlike GLSL source strings compiled by the driver at runtime, SPIR-V modules are pre-compiled offline using `glslangValidator` or Google's `shaderc` [20].

Benefits:
- **No driver compiler variance:** The same SPIR-V binary runs identically on AMD, NVIDIA, Intel, and ARM GPUs
- **Compile-time validation:** Errors caught at build time, not at runtime
- **Reflection:** Tooling can extract binding layouts, push constant sizes, and specialization constants from SPIR-V metadata
- **Multi-language input:** GLSL, HLSL, and Slang all compile to SPIR-V

### XScreenSaver GLSL Portability

Jamie Zawinski's XScreenSaver 6.14 targets four incompatible GLSL profiles: Linux GL 3.1-4.6 compatibility, macOS GL 4.1 core, iOS ES 3.0, and Android ES 3.0-3.2 [21]. The `jwzgles` compatibility layer bridges GL ES to GL 1.3, enabling legacy hacks on modern mobile platforms. GSD-OS's CRT shader engine faces the same portability challenge across Tauri's WebGL 2.0 context and native GL 4.x.

---

## 9. GPU Memory Architecture

Understanding GPU memory hierarchy is essential for pipeline optimization [17]:

```
GPU MEMORY HIERARCHY
================================================================

  Registers          ~256 KB total    Fastest   Per-thread
       |
  Shared Memory      32-48 KB         Fast      Per-work-group
       |
  L1 Cache           48-128 KB        Fast      Per-SM/CU
       |
  L2 Cache           2-6 MB           Medium    Shared across GPU
       |
  VRAM (GDDR6/HBM)  4-24 GB          Slow      Global
       |
  System RAM (PCIe)  16-256 GB        Slowest   CPU-GPU transfer
```

### Bandwidth Considerations

NVIDIA RTX 4060 Ti: 288 GB/s VRAM bandwidth, 18 GB/s PCIe 4.0 x16 [22]. This 16:1 ratio means that CPU-GPU data transfers are the bottleneck. The pipeline principle: keep data on the GPU. Upload vertex/texture data once, render many frames. This is why persistent mapped buffers (`GL_MAP_PERSISTENT_BIT`, OpenGL 4.4) exist -- they maintain a CPU-visible pointer to GPU memory, eliminating the per-frame map/unmap overhead [5].

### Texture Memory

Textures occupy a special region of GPU memory with hardware-optimized access patterns. Tiled/swizzled memory layouts (Morton Z-order) ensure that spatially adjacent texels are adjacent in memory, maximizing cache line utilization during bilinear sampling [23].

---

## 10. The Hello Triangle

Every graphics programmer's first program: a single colored triangle on a black background. This trivial program exercises the entire pipeline: vertex buffer creation, shader compilation, VAO setup, clear-draw-swap loop [6].

The NeHe equivalent (Lesson 1-3, 1997) used `glBegin(GL_TRIANGLES)` with immediate-mode vertex submission. The modern core-profile version requires approximately 80 lines of boilerplate: window creation (GLFW), GL loader (GLAD), VBO/VAO setup, shader compilation, and the render loop. Vulkan's Hello Triangle requires approximately 800 lines -- the explicitness tax [3].

### Vulkan Hello Triangle Breakdown

The 800 lines decompose into:
- Instance creation and physical device selection: ~100 lines
- Logical device and queue creation: ~60 lines
- Swap chain creation: ~120 lines
- Render pass and framebuffer: ~80 lines
- Graphics pipeline creation: ~150 lines
- Command buffers: ~80 lines
- Synchronization (semaphores, fences): ~60 lines
- Render loop: ~80 lines
- Cleanup: ~70 lines

Each section corresponds to a Vulkan object that OpenGL's driver created implicitly. The explicitness enables validation layers (`VK_LAYER_KHRONOS_validation`) to catch every error at development time -- something OpenGL's implicit state model made nearly impossible [3].

> **Related:** [Vulkan and Modern APIs](02-vulkan-modern-apis.md) -- deep dive into the Vulkan object model. [XScreenSaver and Shadertoy](04-xscreensaver-shadertoy.md) -- Hello Triangle as an XScreenSaver hack.

---

## 11. Pipeline State and Optimization

### Draw Call Batching

Every draw call has CPU-side overhead: binding pipeline state, updating uniforms, issuing the GPU command. At 1,000 draw calls per frame, OpenGL spends approximately 1-2ms of CPU time on driver overhead. Vulkan's pre-compiled command buffers reduce this to 0.1-0.2ms for the same workload [4].

Strategies:
- **Instanced rendering:** 10,000 objects in one draw call
- **Texture atlases:** Combine multiple textures to avoid rebinding
- **Uniform Buffer Objects (UBOs):** Batch uniform data for all objects
- **Shader Storage Buffer Objects (SSBOs):** Large arrays accessible from shaders
- **Indirect rendering:** `glDrawIndirect` with GPU-generated draw parameters

### GPU Profiling

NVIDIA Nsight Graphics, AMD Radeon GPU Profiler, and Intel GPA provide per-draw-call timing, occupancy analysis, and memory bandwidth utilization [24]. The key metrics:

| Metric | Target | Concern |
|---|---|---|
| GPU utilization | >90% | Low = CPU-bound |
| Shader occupancy | >60% | Low = register pressure |
| L2 cache hit rate | >80% | Low = bandwidth bound |
| Overdraw ratio | <2.0x | High = fragment waste |
| Draw calls/frame | <5000 | High = CPU overhead |

---

## 12. Cross-References

> **Related:** [Vulkan and Modern APIs](02-vulkan-modern-apis.md) -- explicit GPU control and the Vulkan object model. [Ray Tracing Architecture](03-ray-tracing-architecture.md) -- hardware-accelerated BVH traversal extending the pipeline. [XScreenSaver and Shadertoy](04-xscreensaver-shadertoy.md) -- GLSL fragment shader programs as screensaver hacks. [Shader Programming](05-shader-programming.md) -- GLSL and WebGPU shader development in depth.

**Series cross-references:**
- **GPO (GPU Orchestration):** Compute scheduling and GPU resource management complements pipeline architecture
- **SGL (Signal & Light):** LED persistence of vision and stage lighting share the visual output pipeline
- **MPC (Math Co-Processor):** GPU SIMD parallels math coprocessor stream isolation
- **GSD2 (GSD-2 Architecture):** Chipset YAML maps pipeline stages to coprocessor roles
- **CMH (Computational Mesh):** Mesh processing feeds the vertex pipeline
- **ACE (Compute Engine):** Cloud GPU instances running the same pipeline remotely
- **SYS (Systems Admin):** GPU driver management and hardware monitoring

---

## 13. Sources

1. Akenine-Moller, T., Haines, E., and Hoffman, N. *Real-Time Rendering*. 4th ed. CRC Press, 2018.
2. Segal, M. and Akeley, K. "The OpenGL Graphics System: A Specification, Version 1.0." Silicon Graphics, 1992.
3. Overvoorde, A. *Vulkan Tutorial*. vulkan-tutorial.com, 2016-2025.
4. Selling, G. "Vulkan vs OpenGL: CPU Overhead Benchmark." GDC 2016 Presentation, 2016.
5. Khronos Group. "OpenGL 4.6 Core Profile Specification." opengl.org, 2017.
6. de Vries, J. *LearnOpenGL*. learnopengl.com, 2014-2025. Chapter: "Hello Triangle."
7. Pineda, J. "A Parallel Algorithm for Polygon Rasterization." ACM SIGGRAPH Computer Graphics, vol. 22, no. 4, pp. 17-20, 1988.
8. Wronski, B. "GPU Quad Overshading: How Fragment Shaders Really Execute." Graphics Programming Blog, 2022.
9. Blinn, J. "Models of Light Reflection for Computer Synthesized Pictures." ACM SIGGRAPH, pp. 192-198, 1977.
10. Heckbert, P.S. "Survey of Texture Mapping." IEEE Computer Graphics and Applications, vol. 6, no. 11, pp. 56-67, 1986.
11. Hargreaves, S. and Harris, M. "Deferred Shading." GDC 2004, NVIDIA Developer, 2004.
12. Khronos Group. "OpenGL 3.2 Specification: Geometry Shaders." Section 11.3, 2009.
13. Broadcom. "VideoCore VII GPU Technical Reference." BCM2712 Datasheet, 2023.
14. Kubisch, C. "Introduction to Mesh Shaders." NVIDIA Developer, GTC 2019.
15. Moreton, H. "GPU Tessellation." NVIDIA Technical Brief, 2009.
16. Khronos Group. "OpenGL 4.3 Specification: Compute Shaders." Section 19, 2012.
17. NVIDIA. "CUDA C++ Programming Guide." Version 12.3, docs.nvidia.com, 2024. Chapter: "Memory Hierarchy."
18. Jimenez, J. "Next-Generation Post Processing in Call of Duty: Advanced Warfare." ACM SIGGRAPH Course, 2014.
19. Khronos Group. "The OpenGL Shading Language Specification." Versions 1.10-4.60, opengl.org.
20. Khronos Group. "SPIR-V Specification." Version 1.6, khronos.org/registry/SPIR-V, 2023.
21. Zawinski, J. "XScreenSaver 6.14 Release Notes." jwz.org/blog, January 2026.
22. NVIDIA. "GeForce RTX 4060 Ti Specifications." nvidia.com/en-us/geforce, 2023.
23. Morton, G.M. "A Computer Oriented Geodetic Data Base and a New Technique in File Sequencing." IBM Technical Report, 1966.
24. NVIDIA. "Nsight Graphics User Guide." docs.nvidia.com/nsight-graphics, 2024.

---

*GPU Ecosystem -- Module 1: GPU Graphics Pipeline. From vertex to fragment, the pipeline fills the framebuffer one triangle at a time, a billion times per second.*
