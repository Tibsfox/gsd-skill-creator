# Shader Programming and WebGPU

> **Domain:** GPU Shader Development and Cross-Platform Rendering
> **Module:** 5 -- GLSL Techniques, SPIR-V Toolchain, WebGPU/WGSL, Shader Debugging, and the GSD-OS CRT Shader Engine
> **Through-line:** *A shader is a contract between the programmer and the silicon. You write the function. The GPU executes it a billion times. There are no loops over pixels -- there is one invocation per pixel, running in parallel, stateless, each computing its color from nothing but its coordinates and the uniforms you provided. Understanding this inversion -- from "loop over data" to "data invokes function" -- is the key to thinking in shaders.*

---

## Table of Contents

1. [The Shader Execution Model](#1-the-shader-execution-model)
2. [GLSL Techniques: Fragment Shaders](#2-glsl-techniques-fragment-shaders)
3. [GLSL Techniques: Vertex and Geometry](#3-glsl-techniques-vertex-and-geometry)
4. [Signed Distance Functions](#4-signed-distance-functions)
5. [Ray Marching](#5-ray-marching)
6. [Noise and Procedural Generation](#6-noise-and-procedural-generation)
7. [Post-Processing Effects](#7-post-processing-effects)
8. [The SPIR-V Toolchain](#8-the-spir-v-toolchain)
9. [Shader Debugging and Profiling](#9-shader-debugging-and-profiling)
10. [The GSD-OS CRT Shader Engine](#10-the-gsd-os-crt-shader-engine)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Shader Execution Model

GPUs execute shaders in SIMD fashion: 32 threads (NVIDIA warp) or 64 threads (AMD wavefront) execute the same instruction simultaneously on different data [1]:

```
SIMD EXECUTION MODEL
================================================================

  Fragment Shader: color = f(fragCoord, uniforms)

  CPU mental model:           GPU actual execution:
  for (y = 0; y < H; y++)    All pixels execute simultaneously
    for (x = 0; x < W; x++)  in groups of 32/64 (warp/wavefront)
      pixel[x][y] = f(x,y)   Each thread knows only its own coords

  1920x1080 = 2,073,600 fragments
  / 32 threads per warp = 64,800 warps
  RTX 4060 Ti: 4352 CUDA cores / 32 = 136 warps in flight
  = ~477 warp dispatches to cover entire frame
```

### Divergence Penalty

When threads in a warp take different `if/else` branches, the GPU serializes execution: both branches run, with inactive threads masked. A warp with 50/50 branch divergence runs at half throughput [1].

```glsl
// BAD: high divergence in a warp
if (fragCoord.x > iResolution.x * 0.5) {
    // expensive path A
} else {
    // expensive path B
}

// BETTER: branchless equivalent
float t = step(iResolution.x * 0.5, fragCoord.x);
vec3 color = mix(pathB(), pathA(), t);
```

### Uniform Control Flow

When the branch condition depends on a uniform (constant across all invocations), there is no divergence -- all threads take the same path. This is why `#define` and `const` branches are free but data-dependent branches are expensive [1].

---

## 2. GLSL Techniques: Fragment Shaders

### UV Coordinate Normalization

The standard Shadertoy pattern normalizes pixel coordinates to [-1, 1] with correct aspect ratio [2]:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    // uv.x ranges [-aspect, aspect], uv.y ranges [-1, 1]
    // Origin at center, y-up
}
```

### Color Palettes

Inigo Quilez's cosine-based palette function generates infinite smooth color gradients from four vec3 parameters [3]:

```glsl
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

// Example: rainbow
vec3 col = palette(length(uv) - iTime,
    vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
```

### Anti-aliasing with smoothstep

Hardware anti-aliasing (MSAA) operates at the geometry level. For procedural shapes in fragment shaders, analytical anti-aliasing uses `smoothstep` with a pixel-width threshold [4]:

```glsl
float circle(vec2 uv, vec2 center, float radius) {
    float d = length(uv - center) - radius;
    float pixelWidth = fwidth(d);  // screen-space derivative
    return smoothstep(pixelWidth, -pixelWidth, d);
}
```

The `fwidth()` function returns the sum of absolute derivatives across the 2x2 pixel quad, giving the size of one pixel in the shader's coordinate system. This is the correct anti-aliasing kernel width [4].

---

## 3. GLSL Techniques: Vertex and Geometry

### Skinned Animation

Skeletal animation in the vertex shader: each vertex is weighted across up to 4 bone matrices [5]:

```glsl
#version 330 core
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec4 aBoneWeights;
layout(location = 2) in ivec4 aBoneIDs;

uniform mat4 boneMatrices[128];
uniform mat4 model, view, projection;

void main() {
    mat4 skin = aBoneWeights.x * boneMatrices[aBoneIDs.x]
              + aBoneWeights.y * boneMatrices[aBoneIDs.y]
              + aBoneWeights.z * boneMatrices[aBoneIDs.z]
              + aBoneWeights.w * boneMatrices[aBoneIDs.w];
    gl_Position = projection * view * model * skin * vec4(aPos, 1.0);
}
```

### Instanced Particles

Vertex shader particle systems use `gl_InstanceID` to index into a particle state buffer [6]:

```glsl
layout(std430, binding = 0) buffer ParticleBuffer {
    vec4 particles[]; // xyz = position, w = life
};

void main() {
    vec4 p = particles[gl_InstanceID];
    float size = mix(2.0, 0.0, 1.0 - p.w); // shrink as life decays
    vec3 worldPos = p.xyz + aPos * size;
    gl_Position = projection * view * vec4(worldPos, 1.0);
}
```

---

## 4. Signed Distance Functions

Signed Distance Functions (SDFs) define geometry implicitly as a scalar field: positive outside, zero on the surface, negative inside [3]:

```
SDF PRIMITIVES
================================================================

  Sphere:   sdf(p) = length(p - center) - radius
  Box:      sdf(p) = length(max(abs(p) - halfExtents, 0.0))
  Plane:    sdf(p) = dot(p, normal) + offset
  Torus:    sdf(p) = length(vec2(length(p.xz) - R, p.y)) - r
  Cylinder: sdf(p) = length(p.xz) - radius
```

### CSG (Constructive Solid Geometry) Operations

Combining SDFs with min/max produces boolean operations [3]:

```glsl
float opUnion(float d1, float d2)        { return min(d1, d2); }
float opSubtract(float d1, float d2)     { return max(-d1, d2); }
float opIntersect(float d1, float d2)    { return max(d1, d2); }
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}
```

Smooth union (`opSmoothUnion`) produces organic-looking blends between shapes -- the technique behind countless Shadertoy "blobby" effects.

### Domain Operations

Repeating, folding, and twisting the input coordinates before evaluating the SDF creates complex geometry from simple primitives [3]:

```glsl
// Infinite repetition
vec3 opRepeat(vec3 p, vec3 spacing) {
    return mod(p + 0.5 * spacing, spacing) - 0.5 * spacing;
}

// Twist
vec3 opTwist(vec3 p, float amount) {
    float c = cos(amount * p.y);
    float s = sin(amount * p.y);
    return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
}
```

---

## 5. Ray Marching

Ray marching traverses the SDF by stepping along the ray by the distance to the nearest surface [3]:

```glsl
RAY MARCHING ALGORITHM (SPHERE TRACING)
================================================================

float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = sceneSDF(p);
        if (d < EPSILON) return t;  // hit surface
        t += d;                      // safe to advance by d
        if (t > MAX_DIST) break;     // escaped scene
    }
    return -1.0;  // no hit
}

  Step sizes adapt to distance:
  Far from surface: large steps (fast)
  Near surface: small steps (precise)
  On surface: d < epsilon (converged)
```

### Normal Estimation

The SDF gradient at the hit point gives the surface normal [3]:

```glsl
vec3 estimateNormal(vec3 p) {
    float e = 0.001;
    return normalize(vec3(
        sceneSDF(p + vec3(e,0,0)) - sceneSDF(p - vec3(e,0,0)),
        sceneSDF(p + vec3(0,e,0)) - sceneSDF(p - vec3(0,e,0)),
        sceneSDF(p + vec3(0,0,e)) - sceneSDF(p - vec3(0,0,e))
    ));
}
```

This requires 6 SDF evaluations per hit point -- a significant cost. Tetrahedron sampling reduces this to 4 evaluations [3].

### Soft Shadows

SDFs enable analytically soft shadows by tracking the closest approach of the shadow ray to any surface [3]:

```glsl
float softShadow(vec3 ro, vec3 rd, float tmin, float tmax, float k) {
    float res = 1.0;
    float t = tmin;
    for (int i = 0; i < 64; i++) {
        float d = sceneSDF(ro + rd * t);
        if (d < 0.001) return 0.0;
        res = min(res, k * d / t);
        t += d;
        if (t > tmax) break;
    }
    return res;
}
```

The parameter `k` controls shadow softness. Higher `k` = sharper shadows. This is computationally free compared to ray-traced shadows -- it is a byproduct of the march already being performed [3].

---

## 6. Noise and Procedural Generation

### Perlin and Simplex Noise

Ken Perlin's gradient noise (1985) and simplex noise (2001) are the foundation of procedural texturing [7]:

```glsl
// 2D hash (fast, non-cryptographic)
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Value noise (interpolated hash)
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // smoothstep
    return mix(
        mix(hash(i), hash(i + vec2(1,0)), f.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
        f.y
    );
}
```

### Fractal Brownian Motion (fBm)

Layering noise at multiple frequencies creates natural-looking textures [7]:

```glsl
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}
```

6 octaves of fBm with frequency doubling and amplitude halving produces terrain, clouds, fire, water, and countless organic patterns.

### Voronoi / Worley Noise

Voronoi noise computes the distance to the nearest point in a random point set [8]:

```glsl
float voronoi(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float minDist = 1.0;
    for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(x, y);
        vec2 point = hash2(i + neighbor); // random point in cell
        float d = length(neighbor + point - f);
        minDist = min(minDist, d);
    }
    return minDist;
}
```

Voronoi produces cell-like patterns: stone walls, reptile scales, soap bubbles, cracked earth.

---

## 7. Post-Processing Effects

### Bloom

Bloom simulates the optical scatter of bright light [9]:

1. Extract bright pixels (threshold > 1.0 in HDR)
2. Downsample bright buffer through 5-7 mip levels
3. Apply Gaussian blur at each level
4. Upsample and accumulate back to full resolution
5. Add bloom buffer to original image

The multi-scale approach is efficient because blurring a 120x68 image (mip 4 of 1920x1080) covers a large screen-space radius with very few texture samples [9].

### Screen-Space Ambient Occlusion (SSAO)

SSAO estimates ambient occlusion from the depth buffer [10]:

```glsl
float ssao(vec2 uv) {
    vec3 pos = reconstructPosition(uv, depthTexture);
    vec3 normal = texture(normalTexture, uv).xyz;
    float occlusion = 0.0;
    for (int i = 0; i < KERNEL_SIZE; i++) {
        vec3 samplePos = pos + kernelSamples[i] * radius;
        vec4 offset = projection * vec4(samplePos, 1.0);
        offset.xy = offset.xy / offset.w * 0.5 + 0.5;
        float sampleDepth = texture(depthTexture, offset.xy).r;
        occlusion += (sampleDepth >= samplePos.z + bias ? 0.0 : 1.0);
    }
    return 1.0 - (occlusion / KERNEL_SIZE);
}
```

64 kernel samples with a 4x4 noise rotation texture provides visually acceptable AO at real-time rates, denoised with a bilateral blur [10].

### Chromatic Aberration

Simulates lens color fringing by sampling R, G, B channels at slightly offset UVs [11]:

```glsl
vec3 chromaticAberration(sampler2D tex, vec2 uv, float amount) {
    vec2 offset = (uv - 0.5) * amount;
    float r = texture(tex, uv + offset).r;
    float g = texture(tex, uv).g;
    float b = texture(tex, uv - offset).b;
    return vec3(r, g, b);
}
```

---

## 8. The SPIR-V Toolchain

### Compilation Pipeline

```
SPIR-V TOOLCHAIN
================================================================

  Source Code (GLSL, HLSL, WGSL, Slang)
       |
       v
  +-----------------+
  | glslangValidator| (Khronos reference compiler)
  | shaderc         | (Google C++ wrapper)
  | naga            | (Rust, wgpu ecosystem)
  | DXC             | (Microsoft HLSL compiler)
  +-----------------+
       |
       v
  SPIR-V Binary (.spv)
       |
       +---> spirv-opt (optimization passes)
       +---> spirv-val (validation)
       +---> spirv-cross (decompile to GLSL/HLSL/MSL)
       +---> spirv-reflect (extract binding metadata)
       |
       v
  Vulkan Pipeline or OpenGL (via GL_ARB_gl_spirv)
```

### Key Tools

| Tool | Source | Purpose |
|---|---|---|
| glslangValidator | Khronos | Reference GLSL-to-SPIR-V compiler |
| shaderc | Google | C/C++ library wrapping glslang |
| spirv-opt | Khronos | Dead code elimination, inlining, constant folding |
| spirv-cross | Khronos | Cross-compile SPIR-V to GLSL/HLSL/MSL |
| naga | gfx-rs | WGSL/GLSL/SPIR-V/HLSL/MSL translator |
| Slang | NVIDIA | High-level shader language targeting SPIR-V [12] |

---

## 9. Shader Debugging and Profiling

### Debugging Strategies

Fragment shaders cannot use `printf`. Debugging relies on visual output [13]:

```glsl
// Debug: visualize normals as colors
fragColor = vec4(normal * 0.5 + 0.5, 1.0);

// Debug: visualize UV coordinates
fragColor = vec4(uv, 0.0, 1.0);

// Debug: visualize depth (linearized)
float z = linearDepth(gl_FragCoord.z);
fragColor = vec4(vec3(z / farPlane), 1.0);

// Debug: visualize overdraw (additive blending)
fragColor = vec4(0.1, 0.0, 0.0, 1.0); // each layer adds red
```

### GPU Profiling Tools

| Tool | Vendor | Capabilities |
|---|---|---|
| Nsight Graphics | NVIDIA | Per-draw timing, occupancy, memory, shader profiling |
| Radeon GPU Profiler | AMD | Wavefront occupancy, cache analysis, barrier timing |
| RenderDoc | Open source | Frame capture, draw-by-draw inspection, texture viewer |
| Intel GPA | Intel | Frame analyzer, system analyzer, multi-GPU profiling |
| PIX | Microsoft | DirectX 12 / GPU capture (Windows) |

RenderDoc deserves special mention: it captures an entire frame's worth of GPU commands and lets you step through draw calls, inspect textures, buffers, and pipeline state at each point [14]. It works with OpenGL 3.2+, Vulkan, and DirectX 11/12.

> **SAFETY WARNING:** GPU profiling tools inject instrumentation into the GPU command stream. Running profilers on production workloads can reduce frame rates by 20-50%. Never ship with profiling layers enabled. Validation layers (`VK_LAYER_KHRONOS_validation`) have similar overhead and must be disabled in release builds [14].

---

## 10. The GSD-OS CRT Shader Engine

The GSD-OS desktop shell includes a CRT post-processing shader that simulates cathode ray tube display characteristics [15]:

```
CRT SHADER PIPELINE (DENISE CHIP)
================================================================

  Input: WebGL 2.0 framebuffer (editor canvas content)
       |
       v
  Pass 1: Scanline Generation
    - Darken alternating pixel rows by 15-30%
    - Modulate intensity with sin(fragCoord.y * scanlineDensity)
       |
       v
  Pass 2: Phosphor Bloom
    - 5-tap Gaussian blur on bright pixels
    - RGB phosphor dot pattern (triangular subpixel layout)
    - Bloom radius: 2-4 pixels
       |
       v
  Pass 3: Chromatic Aberration
    - Barrel distortion (CRT curvature)
    - RGB channel offset (0.5-2.0 pixel separation)
       |
       v
  Pass 4: Vignette and Noise
    - Corner darkening (radial gradient)
    - Film grain noise (time-varying hash)
       |
       v
  Output: Composite framebuffer to screen
```

### Implementation Notes

The CRT shader runs as a WebGL 2.0 fragment shader in the Tauri WebView. It reads from the canvas render target (bound as `sampler2D`) and writes the post-processed result. The shader is the Denise chip of GSD-OS: it owns the display output path and runs without blocking the skill-creator (Agnus) or the metric pipeline (Paula) [15].

All CRT parameters are exposed as uniforms controllable via Tauri commands:

| Parameter | Uniform | Range | Default |
|---|---|---|---|
| Scanline intensity | `u_scanlineStrength` | 0.0-1.0 | 0.25 |
| Phosphor bloom | `u_bloomRadius` | 0-8 px | 3 |
| Curvature | `u_barrelDistortion` | 0.0-0.3 | 0.1 |
| Chromatic aberration | `u_chromaticOffset` | 0.0-3.0 px | 1.0 |
| Film grain | `u_noiseAmount` | 0.0-0.2 | 0.05 |

---

## 11. Cross-References

> **Related:** [GPU Graphics Pipeline](01-gpu-graphics-pipeline.md) -- fragment shader stage where these techniques execute. [XScreenSaver and Shadertoy](04-xscreensaver-shadertoy.md) -- Shadertoy as the creative GLSL playground. [GPU Observability](06-gpu-observability.md) -- profiling shader performance via NVML and OTel.

**Series cross-references:**
- **GPO (GPU Orchestration):** Shader compilation and pipeline state management
- **SGL (Signal & Light):** DSP algorithms mapped to shader compute (FFT, convolution)
- **MPC (Math Co-Processor):** GPU math operations parallel math coprocessor tools
- **GRD (Gradient Engine):** Gradient-based optimization in neural denoising
- **DAA (Deep Audio Analyzer):** Audio-reactive shaders driven by spectral data
- **SPA (Spatial Awareness):** Spatial hash and SDF techniques for 3D awareness

---

## 12. Sources

1. NVIDIA. "CUDA C++ Programming Guide." Version 12.3, docs.nvidia.com, 2024. Chapter: "SIMT Architecture."
2. Quilez, I. "Shadertoy Tutorials." iquilezles.org/articles, 2013-2026.
3. Quilez, I. "Distance Functions." iquilezles.org/articles/distfunctions, 2008-2025.
4. Gustavson, S. "Analytic Anti-aliasing in Fragment Shaders." Journal of Graphics, GPU, and Game Tools, 2012.
5. de Vries, J. "Skeletal Animation." LearnOpenGL.com, 2019.
6. de Vries, J. "Instancing." LearnOpenGL.com, 2015.
7. Perlin, K. "Improving Noise." ACM SIGGRAPH, pp. 681-682, 2002.
8. Worley, S. "A Cellular Texture Basis Function." ACM SIGGRAPH, pp. 291-294, 1996.
9. Jimenez, J. "Next-Generation Post Processing in Call of Duty: Advanced Warfare." ACM SIGGRAPH Course, 2014.
10. Bavoil, L. and Sainz, M. "Multi-Layer Dual-Resolution Screen-Space Ambient Occlusion." NVIDIA Technical Report, 2009.
11. Lottes, T. "CRT Shader Techniques." GPU Pro 7, CRC Press, 2016.
12. He, Y. et al. "Slang: Language Mechanisms for Extensible Real-Time Shading Systems." ACM Transactions on Graphics, vol. 37, no. 4, 2018.
13. Wronski, B. "Debugging GPU Shaders: Techniques and Best Practices." Graphics Programming Blog, 2022.
14. Karlsson, B. and Rideout, P. "RenderDoc Documentation." renderdoc.org, 2024.
15. GSD-OS. "CRT Shader Engine Technical Specification." gsd-skill-creator/docs, 2025.
16. Khronos Group. "SPIR-V Specification." Version 1.6, khronos.org/registry/SPIR-V, 2023.

---

*GPU Ecosystem -- Module 5: Shader Programming and WebGPU. One function. A billion invocations. No loops. The GPU does the rest.*
