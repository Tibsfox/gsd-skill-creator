# Ray Tracing Architecture

> **Domain:** GPU Hardware and Real-Time Ray Tracing
> **Module:** 3 -- BVH Acceleration Structures, RT Cores, DXR/VK_KHR_ray_tracing, and the Convergence of Rasterization and Ray Tracing
> **Through-line:** *Rasterization asks: "which pixels does this triangle cover?" Ray tracing asks: "what does this pixel see?" The first question scales with geometry. The second scales with resolution. For fifty years, ray tracing was too expensive for real time. Then NVIDIA put BVH traversal into fixed-function silicon, and the question changed from "can we afford it?" to "where do we spend the rays?"*

---

## Table of Contents

1. [Ray Tracing Fundamentals](#1-ray-tracing-fundamentals)
2. [Bounding Volume Hierarchies](#2-bounding-volume-hierarchies)
3. [RT Core Architecture](#3-rt-core-architecture)
4. [Vulkan Ray Tracing Pipeline](#4-vulkan-ray-tracing-pipeline)
5. [Acceleration Structure Management](#5-acceleration-structure-management)
6. [Shader Binding Table](#6-shader-binding-table)
7. [Ray-Scene Intersection](#7-ray-scene-intersection)
8. [Hybrid Rendering](#8-hybrid-rendering)
9. [Path Tracing and Global Illumination](#9-path-tracing-and-global-illumination)
10. [DLSS, FSR, and Reconstruction](#10-dlss-fsr-and-reconstruction)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Ray Tracing Fundamentals

Ray tracing computes visibility by casting rays from the camera through each pixel into the scene. For each ray, the algorithm finds the closest intersection with scene geometry and evaluates shading at that point [1].

```
RAY TRACING -- BASIC ALGORITHM
================================================================

  For each pixel (x, y):
    ray = camera.generateRay(x, y)
    hit = scene.intersect(ray)
    if hit:
      color = shade(hit.point, hit.normal, hit.material, lights)
      // Optionally: cast reflection/refraction/shadow rays
    else:
      color = background
    framebuffer[x, y] = color
```

The computational challenge: a 1920x1080 frame has 2,073,600 pixels. Each primary ray must test against potentially millions of triangles. Naive O(n) intersection testing is prohibitive. The solution: spatial data structures that reduce intersection tests to O(log n) [1].

### Whitted Ray Tracing (1980)

Turner Whitted's seminal paper introduced recursive ray tracing [2]: at each intersection, cast additional rays for reflection, refraction, and shadows. Each reflected ray spawns its own tree of secondary rays. A recursion depth of 4-8 is typical, producing physically plausible reflections, refractions, and sharp shadows.

Whitted ray tracing evaluates only specular (mirror) reflections. Diffuse inter-reflections -- the soft light that fills a room from a single window -- require thousands of rays per pixel. This is the domain of path tracing.

---

## 2. Bounding Volume Hierarchies

A Bounding Volume Hierarchy (BVH) organizes scene geometry into a tree of axis-aligned bounding boxes (AABBs) [3]:

```
BVH TREE STRUCTURE
================================================================

              [Root AABB]
             /           \
      [Left AABB]      [Right AABB]
      /        \        /          \
  [AABB]    [AABB]  [AABB]      [AABB]
   / \       / \     / \          / \
  T0  T1   T2  T3  T4  T5      T6  T7

  T = triangle (leaf node)

  Ray traversal:
  1. Test ray against root AABB
  2. If hit, test children
  3. Recurse until leaf nodes
  4. Test ray against triangles in leaf
  5. Track closest hit
```

### BVH Construction

Surface Area Heuristic (SAH) minimizes the expected cost of ray traversal [3]:

```
Cost(split) = C_traversal + P(left) * N(left) * C_intersect
                           + P(right) * N(right) * C_intersect

Where:
  P(child) = SA(child) / SA(parent)    (probability of hitting child)
  N(child) = number of primitives in child
  C_traversal = cost of one AABB test (constant)
  C_intersect = cost of one triangle test (constant)
```

The SAH evaluates all possible split planes and chooses the one minimizing total expected cost. For a scene of N triangles, a good BVH reduces average intersection tests from N to approximately 2 * log2(N) [3]. A million-triangle scene: 40 tests instead of 1,000,000.

### BLAS and TLAS

Vulkan ray tracing uses a two-level acceleration structure [4]:

- **Bottom-Level Acceleration Structure (BLAS):** Built per mesh. Contains triangle geometry. Reusable across instances.
- **Top-Level Acceleration Structure (TLAS):** Built per frame. Contains instance transforms referencing BLASes. Updated when objects move.

This two-level design enables instancing: 10,000 trees using the same BLAS with different transforms. The TLAS is rebuilt every frame (O(n) in instances, not triangles), while BLASes are built once and reused.

---

## 3. RT Core Architecture

NVIDIA's RT Cores are fixed-function hardware units dedicated to BVH traversal and ray-triangle intersection [5]:

```
RT CORE EXECUTION MODEL
================================================================

  Shader (SM) issues trace call
       |
       v
  RT Core receives ray + TLAS pointer
       |
       +---> BVH traversal (box intersection): fixed-function
       |     - Tests ray against AABB nodes
       |     - Traverses tree depth-first
       |     - ~1 box test per clock cycle
       |
       +---> Triangle intersection: fixed-function
       |     - Moller-Trumbore algorithm in hardware
       |     - Returns barycentric coordinates + t value
       |
       v
  Result returned to shader: hit/miss + intersection data
```

### Hardware Generations

| Generation | RT Cores | BVH Traversal | Triangle Test | Rays/sec (est.) |
|---|---|---|---|---|
| Turing (RTX 20xx, 2018) | 1st gen | 1 box/clock | 1 tri/clock | ~10 Giga-rays/s |
| Ampere (RTX 30xx, 2020) | 2nd gen | 2 box/clock | 1 tri/clock | ~20 Giga-rays/s |
| Ada Lovelace (RTX 40xx, 2022) | 3rd gen | 2 box/clock | 2 tri/clock | ~40 Giga-rays/s |

Sources: NVIDIA Turing Architecture Whitepaper [5], NVIDIA Ampere Architecture Whitepaper [6], NVIDIA Ada Lovelace Architecture Whitepaper [7].

AMD's RDNA 2 and later architectures include Ray Accelerators that perform BVH traversal in hardware. The implementation differs: AMD processes 4 box intersections per clock in a shader-visible instruction (not fully fixed-function), giving software more control over traversal order [8].

### Tensor Cores and AI Denoising

Tensor cores (NVIDIA) perform matrix multiply-accumulate operations (e.g., FP16 4x4 matrices) at throughputs exceeding 300 TFLOPS on Ada Lovelace [7]. Their primary role in ray tracing is not tracing rays but *denoising the result*. A noisy 1-sample-per-pixel path-traced image passed through a trained neural denoiser (DLSS, OptiX AI denoiser) produces a clean result competitive with 64+ samples per pixel [9].

---

## 4. Vulkan Ray Tracing Pipeline

The `VK_KHR_ray_tracing_pipeline` extension (promoted to Vulkan 1.3 as optional) introduces five new shader stages [4]:

```
VULKAN RAY TRACING SHADER STAGES
================================================================

  vkCmdTraceRaysKHR()
       |
       v
  +--------------------+
  | Ray Generation     | Programmable: generates primary rays
  | Shader (rgen)      | (one invocation per pixel)
  +--------------------+
       |
       | traceRayEXT()
       v
  +--------------------+
  | Intersection       | Programmable (optional): custom
  | Shader (rint)      | intersection for non-triangle geometry
  +--------------------+
       |
       v
  +--------------------+
  | Any-Hit Shader     | Programmable (optional): transparency
  | (rahit)            | testing (alpha cutout)
  +--------------------+
       |
       v
  +--------------------+
  | Closest-Hit Shader | Programmable: shading at intersection
  | (rchit)            | point (materials, secondary rays)
  +--------------------+
       |
  +--------------------+
  | Miss Shader        | Programmable: no intersection found
  | (rmiss)            | (sky color, environment map)
  +--------------------+
```

### Ray Generation Shader (GLSL)

```
#version 460
#extension GL_EXT_ray_tracing : require

layout(set = 0, binding = 0) uniform accelerationStructureEXT tlas;
layout(set = 0, binding = 1, rgba8) uniform image2D outputImage;
layout(set = 0, binding = 2) uniform CameraData { mat4 invView; mat4 invProj; };

layout(location = 0) rayPayloadEXT vec3 hitColor;

void main() {
    vec2 uv = (gl_LaunchIDEXT.xy + 0.5) / gl_LaunchSizeEXT.xy;
    vec4 target = invProj * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
    vec3 origin = (invView * vec4(0, 0, 0, 1)).xyz;
    vec3 direction = normalize((invView * vec4(target.xyz, 0)).xyz);

    traceRayEXT(tlas, gl_RayFlagsOpaqueEXT, 0xFF,
                0, 0, 0, origin, 0.001, direction, 1000.0, 0);

    imageStore(outputImage, ivec2(gl_LaunchIDEXT.xy), vec4(hitColor, 1.0));
}
```

---

## 5. Acceleration Structure Management

Building acceleration structures is a GPU-side operation [4]:

```
ACCELERATION STRUCTURE BUILD
================================================================

  CPU: Provide geometry (vertex + index buffers)
       |
       v
  vkCmdBuildAccelerationStructuresKHR()
       |
       v
  GPU: SAH-based BVH construction
       |  (BLAS: per-mesh, build once or on deform)
       |  (TLAS: per-frame, rebuild on object movement)
       |
       v
  Scratch buffer (temporary, size from vkGetAccelerationStructureBuildSizesKHR)
```

### Update vs. Rebuild

- **Rebuild:** Full SAH-optimized construction. Best traversal quality. Cost: O(N log N).
- **Update (refit):** Adjusts existing BVH node AABBs without restructuring the tree. Cost: O(N). Quality degrades over time as objects move far from their original positions.

For deformable meshes (character animation), update is used per frame. For scene restructuring (objects added/removed), rebuild is necessary [4].

### Memory Footprint

A BLAS for a 100K-triangle mesh requires approximately 15-25 MB of GPU memory (acceleration structure + scratch buffer during build). The TLAS for 10,000 instances requires approximately 2-5 MB [10]. Memory budgets must account for both the final structure and the scratch buffer, which can be freed after build completion.

---

## 6. Shader Binding Table

The Shader Binding Table (SBT) maps ray types and geometry instances to specific shader programs [4]:

```
SHADER BINDING TABLE LAYOUT
================================================================

  Offset 0:     Ray Generation Record
  Offset 64:    Miss Record (ray type 0: primary)
  Offset 128:   Miss Record (ray type 1: shadow)
  Offset 192:   Hit Group (geometry 0, ray type 0) = {closest-hit, any-hit}
  Offset 256:   Hit Group (geometry 0, ray type 1) = {shadow closest-hit}
  Offset 320:   Hit Group (geometry 1, ray type 0) = {glass closest-hit, any-hit}
  ...

  Record size: aligned to shaderGroupHandleSize (32 bytes on NVIDIA)
  Each record can include inline push data (material parameters)
```

When a ray hits geometry instance N with ray type T, the hardware looks up the SBT at offset `hitGroupBase + N * hitGroupStride + T * handleSize` to find which shaders to execute. This is the Vulkan equivalent of a function pointer table -- but GPU-resident and hardware-indexed [4].

---

## 7. Ray-Scene Intersection

### Moller-Trumbore Algorithm

The standard ray-triangle intersection algorithm, implemented in RT Core hardware [11]:

Given ray origin O, direction D, and triangle vertices V0, V1, V2:

```
E1 = V1 - V0
E2 = V2 - V0
P  = cross(D, E2)
det = dot(E1, P)

if |det| < epsilon: no intersection (ray parallel to triangle)

inv_det = 1.0 / det
T = O - V0
u = dot(T, P) * inv_det
if u < 0 or u > 1: no intersection

Q = cross(T, E1)
v = dot(D, Q) * inv_det
if v < 0 or u + v > 1: no intersection

t = dot(E2, Q) * inv_det
if t > t_min and t < t_max: intersection at O + t * D
  barycentric = (1-u-v, u, v)
```

The algorithm requires 1 cross product, 3 dot products, and 1 division. In hardware, the division is the expensive part; RT Cores pipeline the reciprocal computation.

### Ray Coherence

Rays cast from nearby pixels through similar geometry traverse similar BVH paths. RT Cores exploit this coherence by processing rays in warps (32 threads on NVIDIA). When warp rays diverge to different BVH nodes, utilization drops -- this is *ray divergence*, the primary performance limiter for incoherent secondary rays (diffuse bounces, ambient occlusion) [5].

---

## 8. Hybrid Rendering

Modern real-time renderers use rasterization for primary visibility and ray tracing for specific effects [12]:

```
HYBRID RENDERING PIPELINE
================================================================

  Pass 1: Rasterization (G-Buffer)
    - Geometry → Vertex → Fragment → G-Buffer (position, normal, albedo)
    - Fast: 2M+ triangles in <2ms

  Pass 2: Ray-Traced Reflections
    - Cast reflection rays from G-Buffer specular surfaces
    - Trace against TLAS
    - 0.25-1 ray per reflective pixel

  Pass 3: Ray-Traced Shadows
    - Cast shadow rays from G-Buffer toward each light
    - Binary hit/miss (no shading at intersection)
    - 1 ray per light per shadowed pixel

  Pass 4: Ray-Traced Ambient Occlusion
    - Cast short-range hemisphere rays from G-Buffer
    - 0.5-4 rays per pixel, denoised

  Pass 5: Composite + Post-Processing
    - Combine rasterized G-Buffer with RT results
    - Denoise RT output (temporal + spatial)
    - Tone mapping, bloom, TAA
```

This hybrid approach achieves the visual quality of ray tracing at a fraction of the cost of full path tracing. Rasterization handles the heavy geometry work; ray tracing handles the effects that rasterization approximates poorly (reflections, soft shadows, global illumination) [12].

---

## 9. Path Tracing and Global Illumination

Path tracing extends Whitted's model by tracing rays in all directions at each intersection, not just specular reflection/refraction [1]:

```
PATH TRACING ALGORITHM
================================================================

  function pathTrace(ray, depth):
    if depth > maxDepth: return black

    hit = scene.intersect(ray)
    if no hit: return environment(ray.direction)

    // Direct lighting
    direct = sampleLight(hit) * BRDF(hit, lightDir, viewDir)

    // Indirect lighting (recursive)
    bounceDir = sampleHemisphere(hit.normal)
    indirect = pathTrace(Ray(hit.point, bounceDir), depth + 1)
              * BRDF(hit, bounceDir, viewDir)
              * dot(hit.normal, bounceDir)
              / pdf(bounceDir)

    return emission + direct + indirect
```

At 1 sample per pixel, path tracing produces extremely noisy images. At 64-256 samples per pixel, noise converges to acceptable levels. Real-time path tracing uses 1-4 samples per pixel combined with AI denoising [9].

### ReSTIR (Reservoir-based Spatiotemporal Importance Resampling)

ReSTIR, introduced by Bitterli et al. (2020) [13], enables real-time rendering with millions of lights. Instead of sampling all lights, each pixel maintains a small reservoir of candidate light samples, resampled across space and time. The technique reduces variance by orders of magnitude compared to uniform light sampling, making path tracing with many lights practical at real-time rates.

---

## 10. DLSS, FSR, and Reconstruction

### NVIDIA DLSS (Deep Learning Super Sampling)

DLSS uses a trained convolutional neural network running on Tensor Cores to reconstruct a high-resolution image from a lower-resolution rendered input plus motion vectors [9]:

| DLSS Mode | Internal Resolution | Output | Performance Gain |
|---|---|---|---|
| Quality | 66.7% | Native | ~1.5x |
| Balanced | 58.3% | Native | ~1.7x |
| Performance | 50.0% | Native | ~2.0x |
| Ultra Performance | 33.3% | Native | ~3.0x |

DLSS 3 (Ada Lovelace) adds frame generation: synthesizing entire intermediate frames using the Optical Flow Accelerator hardware. This doubles apparent frame rate but adds one frame of input latency [7].

### AMD FSR (FidelityFX Super Resolution)

FSR 2 uses temporal upscaling without machine learning, running on any GPU (including integrated and VideoCore VII via Vulkan compute) [14]. FSR 3 adds frame generation similar to DLSS 3 but implemented in software.

### Reconstruction in the GSD-OS Context

The GSD-OS CRT shader engine applies a post-processing pass (phosphor bloom, scanlines, chromatic aberration) that is structurally similar to a reconstruction filter. The CRT shader reads a source framebuffer and writes a processed output -- the same read-compute-write pattern as DLSS but with a deterministic (non-ML) filter kernel [15].

---

## 11. Cross-References

> **Related:** [GPU Graphics Pipeline](01-gpu-graphics-pipeline.md) -- the rasterization pipeline that ray tracing extends. [Vulkan and Modern APIs](02-vulkan-modern-apis.md) -- Vulkan's VK_KHR_ray_tracing_pipeline. [Shader Programming](05-shader-programming.md) -- ray tracing shader stages in GLSL.

**Series cross-references:**
- **GPO (GPU Orchestration):** RT Core scheduling and ray tracing workload management
- **SGL (Signal & Light):** LED POV displays share persistence-of-vision with temporal reconstruction
- **MPC (Math Co-Processor):** BVH construction parallels spatial data structure operations
- **GRD (Gradient Engine):** Neural network training for DLSS-style reconstruction
- **ACE (Compute Engine):** Cloud ray tracing on GPU instances
- **CMH (Computational Mesh):** BVH construction from mesh geometry

---

## 12. Sources

1. Pharr, M., Jakob, W., and Humphreys, G. *Physically Based Rendering: From Theory to Implementation*. 4th ed. MIT Press, 2023.
2. Whitted, T. "An Improved Illumination Model for Shaded Display." Communications of the ACM, vol. 23, no. 6, pp. 343-349, 1980.
3. Wald, I. "On Fast Construction of SAH-based Bounding Volume Hierarchies." IEEE Symposium on Interactive Ray Tracing, 2007.
4. Khronos Group. "VK_KHR_ray_tracing_pipeline Specification." Vulkan Extension, 2020.
5. NVIDIA. "NVIDIA Turing GPU Architecture Whitepaper." 2018.
6. NVIDIA. "NVIDIA Ampere GA102 GPU Architecture Whitepaper." 2020.
7. NVIDIA. "NVIDIA Ada Lovelace Architecture Whitepaper." 2022.
8. AMD. "RDNA 3 Instruction Set Architecture Reference Guide." 2022.
9. NVIDIA. "DLSS: Deep Learning Super Sampling Technical Documentation." developer.nvidia.com, 2024.
10. Benthin, C., Woop, S., and Wald, I. "Efficient Ray Tracing of Deformable Scenes." Proceedings of the Eurographics Conference, 2006.
11. Moller, T. and Trumbore, B. "Fast, Minimum Storage Ray-Triangle Intersection." Journal of Graphics Tools, vol. 2, no. 1, pp. 21-28, 1997.
12. Marrs, A., Shirley, P., and Wald, I. *Ray Tracing Gems II*. Apress, 2021.
13. Bitterli, B. et al. "Spatiotemporal Reservoir Resampling for Real-Time Ray Tracing with Dynamic Direct Lighting." ACM Transactions on Graphics, vol. 39, no. 4, 2020.
14. AMD. "FidelityFX Super Resolution 2 Technical Documentation." gpuopen.com, 2023.
15. Lottes, T. "CRT Shader Techniques: Phosphor Persistence and Scanline Simulation." GPU Pro 7, CRC Press, 2016.
16. Khronos Group. "Vulkan Ray Tracing Tutorial." github.com/KhronosGroup/Vulkan-Samples, 2023.
17. McGuire, M. "The Graphics Codex." graphicscodex.com, 2024.

---

*GPU Ecosystem -- Module 3: Ray Tracing Architecture. Where do you spend the rays? That is the only question that matters.*
