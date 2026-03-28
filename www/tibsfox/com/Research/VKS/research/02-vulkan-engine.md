# Vulkan Engine Architecture -- Native Vulkan 1.3+, Scene Manager & Plugin System

## Overview

The Vulkan Screensaver Engine is a native Vulkan-first screensaver framework for Linux. Not a compatibility shim. Not OpenGL wrapped in Vulkan. A native Vulkan architecture that treats the screensaver as a compute and graphics platform -- one that can run NeHe tutorials reborn as Vulkan pipelines, Sascha Willems' example gallery in standalone form, CUDA-interop generative math, and AI-backed evolutionary visual algorithms.

## Design Philosophy

The Amiga Principle applies here with particular force. The Amiga's custom chips -- Agnus, Denise, Paula -- achieved effects that machines with far more raw power could not, because each chip had a dedicated execution path precisely shaped to its purpose. A Vulkan screensaver engine should be the same: not a general-purpose rendering engine with screensaver bolted on, but an engine whose every subsystem is architected around the specific constraints and freedoms of the idle-screen context.

**Idle-screen constraints and freedoms:**
- No user input (keyboard/mouse irrelevant)
- Continuous execution (no frame budget pressure from interaction)
- GPU as primary actor (CPU minimally involved)
- CUDA as the mathematical substrate
- Power management awareness (reduce clocks during low-complexity scenes)

## Vulkan 1.3+ Requirements

The engine targets Vulkan 1.3 as the minimum API version, which provides:

- **Dynamic rendering** -- no render pass objects, simplified pipeline creation
- **Synchronization2** -- simplified fence/semaphore model
- **Maintenance4** -- relaxed interface matching, null descriptors
- **Subgroup operations** -- cross-lane operations in compute shaders
- **Timeline semaphores** -- fine-grained GPU synchronization

### Device Requirements

| Feature | Minimum | Recommended |
|---|---|---|
| Vulkan API | 1.3 | 1.3+ |
| GPU VRAM | 2 GB | 4+ GB |
| Compute capability | Required | Required |
| Ray tracing | Optional | VK_KHR_ray_tracing_pipeline |
| Driver | Mesa RADV/ANV or NVIDIA 535+ | Latest |

## Core Architecture

### Scene Manager

The scene manager is the central orchestration component. It selects, schedules, and transitions between active screensaver modules (plugins).

**Responsibilities:**
- Plugin discovery and loading via shared library (.so) interface
- Scene scheduling (random, sequential, weighted by user preference)
- Transition system (crossfade, dissolve, wipe, shader-based)
- Resource lifecycle management (Vulkan device memory, descriptor pools)
- Frame pacing (target 60fps, drop to 30fps on thermal throttle)

### Plugin Interface

Every screensaver plugin implements a minimal C interface:

```c
typedef struct VksPlugin {
    const char* name;
    const char* author;
    uint32_t version;

    VkResult (*init)(VksContext* ctx);
    VkResult (*render)(VksContext* ctx, float dt);
    void     (*resize)(VksContext* ctx, uint32_t w, uint32_t h);
    void     (*destroy)(VksContext* ctx);
} VksPlugin;
```

This mirrors JWZ's original philosophy: any program that can render to a provided surface is a screensaver. The plugin owns its pipelines, shaders, and buffers. The engine owns the surface, swapchain, and timing.

### Output Layer

The engine supports dual output targets:

- **Wayland** -- via `wl_surface` and `VK_KHR_wayland_surface`
- **X11** -- via `$XSCREENSAVER_WINDOW` environment variable and `VK_KHR_xlib_surface`

The output layer abstracts these into a unified surface interface that plugins never interact with directly.

## CUDA Interop

For plugins that require CUDA compute (noise generation, physics simulation, AI inference), the engine provides a CUDA interop layer using `VK_NV_external_memory` (NVIDIA) or `VK_KHR_external_memory` (cross-vendor).

**Interop flow:**
1. Engine allocates Vulkan device memory with external memory export
2. CUDA imports the memory as a `cudaExternalMemory_t`
3. CUDA kernels write to shared memory
4. Vulkan semaphore synchronizes access
5. Vulkan pipeline reads results as storage buffer or image

This avoids any CPU-side copy -- the data stays on GPU throughout.

## Build System

The engine uses CMake as its build system:

```
vulkan-screensaver-engine/
  CMakeLists.txt           -- Top-level build
  src/
    engine/                -- Core engine (scene manager, output, timing)
    plugins/               -- Built-in plugins
      nehe/                -- NeHe translations (48 plugins)
      sascha/              -- Sascha Willems adaptations
      cuda/                -- CUDA generative plugins
      ai/                  -- AI evolution plugins
  shaders/                 -- SPIR-V shader sources (GLSL compiled via glslc)
  external/                -- Third-party dependencies
```

## Cross-References

> **Related:** [XScreenSaver Catalog](01-xscreensaver-catalog.md) for the legacy architecture this extends, [NeHe Translation](03-nehe-vulkan.md) for the tutorial plugin set, [CUDA Generative](05-cuda-generative.md) for the compute layer.
