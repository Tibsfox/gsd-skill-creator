# API Foundations

## Core API Samples Overview

The Vulkan Samples repository contains 14 core API samples plus 14 Vulkan-Hpp C++ variants. These samples demonstrate the fundamental patterns of Vulkan programming, from instance creation through compute dispatch.

## Hello Triangle and Variants

### Hello Triangle (Basic)

The canonical first Vulkan program. Unlike OpenGL's immediate mode, Vulkan requires explicit setup of:

- **VkInstance** -- application-level Vulkan connection
- **VkPhysicalDevice** -- GPU selection
- **VkDevice** -- logical device with queue families
- **VkSwapchain** -- presentation surface management
- **VkRenderPass** -- framebuffer attachment descriptions
- **VkPipeline** -- complete graphics pipeline state
- **VkCommandBuffer** -- recorded GPU commands

Total setup code for a triangle: approximately 800-1000 lines. This verbosity is intentional -- Vulkan exposes every decision that OpenGL makes implicitly.

### Hello Triangle 1.3

Updated version using Vulkan 1.3 features: dynamic rendering (no explicit render pass), synchronization2, and simplified pipeline creation. Demonstrates the API's evolution toward reduced boilerplate.

## Key API Samples

| Sample | Vulkan Concepts | Prerequisites |
|--------|----------------|---------------|
| Hello Triangle | Instance, device, swapchain, pipeline, command buffer | None |
| Hello Triangle 1.3 | Dynamic rendering, sync2 | Hello Triangle |
| Compute N-body | Compute pipeline, SSBO, dispatch | Hello Triangle |
| HDR | HDR swapchain, tone mapping, wide color | Pipeline, framebuffer |
| Instancing | Instance buffers, indirect draw | Vertex buffers |
| Terrain Tessellation | Tessellation shaders, heightmap | Pipeline stages |
| Dynamic Rendering | VK_KHR_dynamic_rendering | Render passes |
| Timeline Semaphores | VkSemaphoreTypeCreateInfo | Synchronization |
| Buffer Device Address | VK_KHR_buffer_device_address | Descriptor management |
| Descriptor Indexing | VK_EXT_descriptor_indexing, bindless | Descriptor sets |
| Synchronization 2 | VK_KHR_synchronization2 | Barriers, semaphores |
| Separate Image Sampler | Combined vs. separate descriptor types | Descriptor sets |
| Dynamic Uniform Buffer | Dynamic offsets, UBO management | Uniform buffers |
| Texture Loading | VkImage, staging buffer, mip generation | Memory management |

## Vulkan-Hpp Variants

Roughly half the API samples have Vulkan-Hpp counterparts (prefixed `hpp_`). These demonstrate idiomatic C++ bindings:

```cpp
// C API
VkInstanceCreateInfo createInfo{};
createInfo.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
vkCreateInstance(&createInfo, nullptr, &instance);

// Vulkan-Hpp
vk::InstanceCreateInfo createInfo{};
auto instance = vk::createInstance(createInfo);
```

Key differences: RAII object management (UniqueHandle), exception-based error handling, type-safe enums, and builder-pattern construction.

## Memory Management Patterns

Vulkan requires explicit memory management. The API samples demonstrate several patterns:

### Staging Buffer Pattern

```
CPU-visible staging buffer  -->  GPU-optimal device-local buffer
(VK_MEMORY_PROPERTY_HOST_VISIBLE)  (VK_MEMORY_PROPERTY_DEVICE_LOCAL)
```

Data is first uploaded to a CPU-accessible staging buffer, then transferred to GPU-optimal memory via a transfer command buffer. This two-step process maximizes GPU memory bandwidth.

### Memory Allocation Strategy

The samples use VMA (Vulkan Memory Allocator) or manual allocation with:

- vkGetBufferMemoryRequirements -- query alignment and type requirements
- vkAllocateMemory -- allocate from appropriate memory heap
- vkBindBufferMemory -- associate memory with buffer

Production applications batch allocations (suballocate from large blocks) to avoid per-object allocation overhead.

## Synchronization Model

Vulkan's synchronization is explicit -- the application must declare all data dependencies:

| Mechanism | Scope | Use Case |
|-----------|-------|----------|
| Fences | CPU-GPU | Wait for GPU work completion |
| Semaphores | Queue-Queue | Order work between queues |
| Timeline Semaphores | Queue-Queue | Signal/wait with integer values |
| Pipeline Barriers | Command buffer | Memory and execution dependencies |
| Events | Within command buffer | Fine-grained synchronization |

The API samples demonstrate correct synchronization for common patterns: swapchain image acquisition, render-to-texture, compute-to-graphics, and multi-queue submission.

## Descriptor Management

Descriptors connect shader resources (buffers, textures, samplers) to pipeline stages:

```
VkDescriptorSetLayout  -->  VkDescriptorPool  -->  VkDescriptorSet
(schema)                   (allocator)             (instance)
```

The API samples demonstrate both traditional descriptor sets and bindless approaches (descriptor indexing).

---

> **Related:** See [Extension Corpus](02-extension-corpus.md) for advanced extensions building on these foundations, and [Framework](04-framework-build.md) for the sample application architecture.
