# Extension Corpus

## Extension Sample Categories

The Vulkan Samples repository contains 47 extension samples organized by extension family. Each sample demonstrates a specific Vulkan extension or extension combination with practical usage patterns.

## Ray Tracing (KHR)

The ray tracing extension family (VK_KHR_ray_tracing_pipeline, VK_KHR_acceleration_structure, VK_KHR_ray_query) enables hardware-accelerated ray tracing:

| Sample | Extension | Demonstrates |
|--------|-----------|-------------|
| Ray Tracing Basic | VK_KHR_ray_tracing_pipeline | TLAS/BLAS build, ray gen/closest hit/miss shaders |
| Ray Tracing Reflection | VK_KHR_ray_tracing_pipeline | Recursive ray tracing for reflective surfaces |
| Ray Queries | VK_KHR_ray_query | Inline ray tracing from any shader stage |
| Ray Tracing Extended | Multiple | Combined techniques, shadows, AO |

### Acceleration Structure Hierarchy

```
Top-Level Acceleration Structure (TLAS)
  |-- Instance 0 --> Bottom-Level AS (BLAS) for mesh A
  |-- Instance 1 --> Bottom-Level AS (BLAS) for mesh B
  |-- Instance 2 --> Bottom-Level AS (BLAS) for mesh A (different transform)
```

BLAS contains geometry (triangles or AABBs). TLAS contains instances referencing BLASes with per-instance transforms. The GPU traverses this hierarchy during ray-scene intersection.

## Mesh Shaders

VK_EXT_mesh_shader replaces the traditional vertex input assembly + vertex shader + geometry shader pipeline with a compute-like model:

- **Task shader** (optional) -- generates mesh shader workgroups
- **Mesh shader** -- outputs primitives directly, no input assembly needed

Benefits: better GPU occupancy, natural LOD, culling in the shader rather than CPU-side.

## Dynamic Rendering

VK_KHR_dynamic_rendering (core in Vulkan 1.3) eliminates VkRenderPass and VkFramebuffer objects:

```cpp
// Traditional
vkCmdBeginRenderPass(cmd, &renderPassInfo, VK_SUBPASS_CONTENTS_INLINE);

// Dynamic rendering
vkCmdBeginRendering(cmd, &renderingInfo);
```

Simplifies code, reduces object management overhead, and enables more flexible rendering patterns.

## Fragment Shading Rate

VK_KHR_fragment_shading_rate allows variable-rate shading:

| Mode | Granularity | Use Case |
|------|------------|----------|
| Per-pipeline | Entire draw | Reduce shading for simple materials |
| Per-primitive | Per-triangle | Shade edges at full rate, interiors at reduced |
| Per-region | Screen-space tiles | Foveated rendering for VR |

Variable-rate shading can significantly improve performance for scenes where not every pixel needs full shading precision.

## Descriptor Indexing (Bindless)

VK_EXT_descriptor_indexing enables bindless rendering:

- Arrays of descriptors (textures, buffers) bound once
- Shaders index into arrays dynamically
- No descriptor set switching between draw calls
- GPU-driven rendering becomes practical

This is the foundation of modern rendering architectures where the GPU selects resources per-draw rather than the CPU binding individual textures.

## Extension Promotion Paths

Extensions follow a promotion lifecycle:

```
Vendor extension (VK_NV_*, VK_AMD_*, VK_ARM_*)
  --> Multi-vendor (VK_EXT_*)
    --> Khronos standard (VK_KHR_*)
      --> Core Vulkan (promoted into spec version)
```

Key promotions in recent versions:

| Extension | Promoted To | Version |
|-----------|------------|---------|
| VK_KHR_dynamic_rendering | Core | Vulkan 1.3 |
| VK_KHR_synchronization2 | Core | Vulkan 1.3 |
| VK_KHR_maintenance4 | Core | Vulkan 1.3 |
| VK_EXT_descriptor_indexing | Core | Vulkan 1.2 |
| VK_KHR_buffer_device_address | Core | Vulkan 1.2 |

## Tensor and Data Graph (Frontier)

The newest extension family represents Vulkan's expansion into ML inference:

- **VK_ARM_tensors** -- tensor data types and operations
- **VK_ARM_data_graph** -- computation graph execution on GPU
- **VK_EXT_shader_float8** -- 8-bit floating point in shaders

These extensions enable GPU-accelerated neural network inference directly in the Vulkan pipeline, without requiring separate ML frameworks.

## Version Requirements Matrix

Each extension sample requires specific Vulkan versions and hardware:

| Sample Category | Min Vulkan | GPU Requirement |
|----------------|-----------|-----------------|
| Core API | 1.0 | Any Vulkan GPU |
| Dynamic Rendering | 1.3 | 2020+ GPUs |
| Ray Tracing | 1.1 + extensions | RTX 2000+ / RDNA 2+ |
| Mesh Shaders | 1.1 + extension | RTX 2000+ / RDNA 2+ |
| Tensor/Data Graph | 1.1 + extensions | ARM Mali G720+ |

---

> **Related:** See [API Foundations](01-api-foundations.md) for the base patterns these extensions build on, and [Performance Patterns](03-performance-patterns.md) for optimization techniques.
