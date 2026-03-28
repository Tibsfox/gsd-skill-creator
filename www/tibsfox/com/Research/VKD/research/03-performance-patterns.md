# Performance Patterns

## Overview

The Vulkan Samples repository contains 24 performance samples, each demonstrating specific optimization techniques with profiling annotations. These patterns encode accumulated wisdom from ARM, NVIDIA, AMD, and other GPU architects.

## Render Pass Optimization

### Subpass Dependencies

Proper subpass dependencies enable tile-based GPUs (ARM Mali, Qualcomm Adreno, Apple) to keep data in on-chip tile memory rather than writing to main memory:

| Pattern | Benefit | GPU Type |
|---------|---------|----------|
| Single render pass, multiple subpasses | Tile memory reuse | Tile-based (mobile) |
| Transient attachments | No backing memory allocation | Tile-based |
| Lazy allocation | Defer memory until actually used | All |
| Load/store operations | Control what gets read/written | All |

### Render Pass Best Practices

```
DO:  Use LOAD_OP_CLEAR or LOAD_OP_DONT_CARE (avoid LOAD_OP_LOAD when possible)
DO:  Use STORE_OP_DONT_CARE for depth/stencil when not needed afterward
DO:  Group operations into subpasses to maximize tile-local processing
DON'T: Create unnecessary render pass breaks
DON'T: Store attachments that won't be sampled later
```

## Command Buffer Management

### Recording Strategies

| Strategy | When to Use | Overhead |
|----------|------------|----------|
| Single primary, re-record each frame | Simple scenes | Low CPU, moderate recording cost |
| Secondary command buffers | Parallel recording | Multi-threaded recording benefit |
| Persistent command buffers | Static geometry | Zero per-frame recording cost |
| Multi-threaded recording | Complex scenes | Scales with CPU cores |

### Command Buffer Pools

Allocate one command pool per thread to avoid synchronization. Reset pools (vkResetCommandPool) rather than individual buffers for better performance.

## Pipeline Optimization

### Pipeline Caching

VkPipelineCache stores compiled pipeline state across runs:

```
1. Load cache from disk on startup
2. Create pipelines with cache handle
3. Save cache to disk on shutdown
```

Pipeline compilation can take hundreds of milliseconds. Caching eliminates this cost on subsequent runs.

### Pipeline Derivatives

When creating similar pipelines, specify a base pipeline. The driver can optimize compilation by reusing shared state from the parent pipeline.

### Specialization Constants

Compile-time constants injected at pipeline creation:

```glsl
layout(constant_id = 0) const int LIGHT_COUNT = 4;
```

The driver can optimize shader code based on these constants (unroll loops, eliminate dead code). Better than uniform-based branching for values known at pipeline creation time.

## Descriptor Management

### Descriptor Set Strategies

| Strategy | Frequency | Contents |
|----------|-----------|----------|
| Set 0 | Per-frame | Camera matrices, time, global state |
| Set 1 | Per-material | Textures, material parameters |
| Set 2 | Per-object | Model matrix, instance data |

Organize descriptor sets by update frequency to minimize rebinding. Set 0 is bound once per frame; Set 2 is rebound per draw call.

### Push Constants

Small, frequently-changing data (model matrix, material ID) should use push constants rather than descriptor sets. Push constants are written directly into the command buffer with zero allocation overhead.

```
Max push constant size: 128 bytes (guaranteed minimum)
Typical use: 4x4 matrix (64 bytes) + material index (4 bytes)
```

## Multi-Draw Indirect

GPU-driven rendering using indirect draw commands:

```
CPU writes draw parameters to a buffer:
  [vertex_count, instance_count, first_vertex, first_instance]
  [vertex_count, instance_count, first_vertex, first_instance]
  ...

GPU reads and executes all draws from the buffer:
  vkCmdDrawIndirect(cmd, buffer, offset, draw_count, stride)
```

Benefits:
- Single API call for thousands of draw calls
- Draw parameters can be generated/modified by compute shaders
- Enables GPU-driven scene traversal and culling

## Memory Management

### Buffer Usage Patterns

| Access Pattern | Memory Type | Usage |
|---------------|-------------|-------|
| GPU-only read | DEVICE_LOCAL | Vertex/index buffers, textures |
| CPU write, GPU read (streaming) | HOST_VISIBLE + HOST_COHERENT | Uniform buffers, staging |
| CPU write once, GPU read many | DEVICE_LOCAL (via staging) | Static geometry, textures |
| GPU write, CPU read (readback) | HOST_VISIBLE + HOST_CACHED | Query results, screenshots |

### Allocation Strategy

- Suballocate from large blocks (avoid per-object vkAllocateMemory)
- Use VMA (Vulkan Memory Allocator) for production applications
- Budget memory per heap using VK_EXT_memory_budget

## Profiling and Measurement

### Timestamp Queries

```
vkCmdWriteTimestamp(cmd, VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT, pool, 0)
// ... rendering commands ...
vkCmdWriteTimestamp(cmd, VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT, pool, 1)
```

GPU timestamps measure actual execution time with nanosecond precision (device-dependent). Essential for identifying bottlenecks.

### Pipeline Statistics

VK_QUERY_TYPE_PIPELINE_STATISTICS provides counters for: input assembly vertices/primitives, vertex/geometry/tessellation shader invocations, fragment shader invocations, and compute shader invocations.

---

> **Related:** See [API Foundations](01-api-foundations.md) for the base patterns these optimizations apply to, and [Upstream Intelligence](05-upstream-intelligence.md) for version-specific optimization guidance.
