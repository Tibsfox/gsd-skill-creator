# Sascha Willems Vulkan Gallery -- 60+ Examples as Screensaver Plugins

## Overview

Sascha Willems' Vulkan Examples repository is the definitive open-source reference for Vulkan graphics programming. With over 60 MIT-licensed C++ examples, continuously maintained and covering everything from basic triangle rendering to advanced ray tracing, this gallery represents the state of the art in Vulkan technique demonstration.

This module adapts selected examples as standalone screensaver plugins for the Vulkan Screensaver Engine. The focus is on visually compelling techniques that work well in a continuous, non-interactive context.

## Source Repository

- **Repository:** [github.com/SaschaWillems/Vulkan](https://github.com/SaschaWillems/Vulkan)
- **License:** MIT
- **Language:** C++ with GLSL shaders
- **Active maintenance:** Continuously updated for new Vulkan features
- **Star count:** 10,000+ (one of the most-starred Vulkan projects)

## Selected Examples for Screensaver Adaptation

### Compute Shader Examples

These are the highest-priority adaptations because compute shaders produce the most visually dynamic screensaver content:

| Example | Technique | Visual Output |
|---|---|---|
| `computeparticles` | GPU particle system | 256K+ particles with physics |
| `computenbody` | N-body gravitational simulation | Galaxy-scale particle interaction |
| `computecloth` | Cloth simulation | Fabric draping and wind response |
| `computeraytracing` | Compute-based ray tracer | Real-time ray traced scene |
| `computecullandlod` | Frustum culling + LOD | Dense instanced scenes |

### PBR (Physically Based Rendering)

| Example | Technique | Visual Output |
|---|---|---|
| `pbrbasic` | Cook-Torrance BRDF | Metallic/roughness material spheres |
| `pbribl` | Image-based lighting | Environment-lit PBR objects |
| `pbrtexture` | PBR with texture maps | Textured materials under HDR lighting |

### Post-Processing Effects

| Example | Technique | Visual Output |
|---|---|---|
| `bloom` | HDR bloom | Glowing light sources |
| `ssao` | Screen-space ambient occlusion | Depth-enhanced rendering |
| `radialblur` | Radial motion blur | Speed-effect rendering |
| `hdr` | High dynamic range | Tone-mapped HDR scenes |

### Advanced Rendering

| Example | Technique | Visual Output |
|---|---|---|
| `deferredshadows` | Deferred rendering + shadows | Complex lit scenes |
| `instancing` | Instanced draw calls | 100K+ object scenes |
| `indirectdraw` | Indirect rendering | GPU-driven scene submission |
| `tessellation` | Hardware tessellation | Smooth curved surfaces |
| `displacement` | Displacement mapping | Terrain and surface detail |

### Ray Tracing (VK_KHR_ray_tracing_pipeline)

| Example | Technique | Visual Output |
|---|---|---|
| `raytracingbasic` | Basic ray tracing | Simple reflective scene |
| `raytracingshadows` | Ray traced shadows | Soft shadow rendering |
| `raytracingreflections` | Multi-bounce reflections | Mirror-like surfaces |

## Adaptation Strategy

Each Sascha Willems example is adapted following these steps:

1. **Strip interaction:** Remove keyboard/mouse handlers, replace with time-based animation
2. **Add scene variation:** Parameterize camera position, lighting, material properties with time-varying functions
3. **Implement plugin interface:** Wrap in `VksPlugin` struct with init/render/resize/destroy
4. **Optimize for continuous run:** Add resource recycling, prevent memory leaks over long runs
5. **Add transition hooks:** Support crossfade via alpha channel during scene transitions

## Performance Considerations

Screensaver plugins must run indefinitely without degradation:

- **Memory:** All allocations pooled; no per-frame allocation
- **Descriptors:** Pre-allocated descriptor pools sized for maximum sets
- **Command buffers:** Ring buffer of pre-allocated command buffers
- **Thermal:** Monitor GPU temperature; reduce particle count or resolution if throttling

## Cross-References

> **Related:** [Vulkan Engine Architecture](02-vulkan-engine.md) for the plugin system, [NeHe Translation](03-nehe-vulkan.md) for foundational technique coverage, [CUDA Generative](05-cuda-generative.md) for compute-heavy alternatives.
