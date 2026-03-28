# Upstream Intelligence

## Vulkan 1.4 Specification Changes

Vulkan 1.4 (released December 2024) promoted several extensions to core:

| Promoted Extension | Impact |
|-------------------|--------|
| VK_KHR_dynamic_rendering_local_read | Subpass-equivalent input attachment reads with dynamic rendering |
| VK_KHR_maintenance5 | Misc improvements (buffer copies, image requirements) |
| VK_KHR_push_descriptor | Push descriptors without pre-allocated sets |

### Breaking Changes

Vulkan 1.4 requires all implementations to support:
- Dynamic rendering (no render pass objects required)
- Synchronization2 (new barrier and semaphore API)
- Buffer device address (GPU-side pointer arithmetic)

Code written assuming these features are optional now has a guaranteed baseline on 1.4 hardware.

## SDK 1.4.341 Updates (March 2026)

The Vulkan SDK 1.4.341 release includes:

- Updated validation layers with improved synchronization checking
- New Vulkan Profiles support (device capability targeting)
- Updated SPIR-V tools (spirv-cross, spirv-opt)
- Improved shader debugging support in RenderDoc integration

## Roadmap 2026 Extensions

### Tensor Processing

The VK_ARM_tensors and VK_ARM_data_graph extensions represent Vulkan's expansion into ML inference:

- **Tensor types** -- multi-dimensional arrays with defined layout in GPU memory
- **Data graph** -- directed acyclic graph of tensor operations
- **Execution** -- GPU dispatches the entire graph, optimizing scheduling

This enables neural network inference directly in the Vulkan rendering pipeline without CPU round-trips or separate ML framework dependencies.

### Float8 Shader Support

VK_EXT_shader_float8 adds 8-bit floating point types to shaders:

- E4M3 (4-bit exponent, 3-bit mantissa) -- range-optimized
- E5M2 (5-bit exponent, 2-bit mantissa) -- precision-optimized

Float8 halves memory bandwidth compared to FP16, enabling larger models and faster inference on bandwidth-limited GPUs.

## Extension Promotion Tracking

### Active Promotion Candidates

| Extension | Current Status | Promotion Target |
|-----------|---------------|-----------------|
| VK_EXT_mesh_shader | Multi-vendor EXT | Potential KHR |
| VK_KHR_ray_tracing_maintenance1 | KHR | Potential core |
| VK_EXT_shader_object | Multi-vendor EXT | Potential core |
| VK_ARM_tensors | Vendor | Potential EXT |

### Tracking Methodology

Extension promotions are tracked through:
- Khronos Vulkan Working Group meeting minutes
- Vulkan Roadmap documents
- SDK release notes
- Hardware vendor driver release notes

## Version Conflict Detection

### Common Conflicts

| Pattern | Risk | Mitigation |
|---------|------|-----------|
| Using 1.2 descriptor update template with 1.3 dynamic rendering | Undefined behavior | Check both feature sets |
| Assuming push descriptor with non-1.4 device | Extension not available | Runtime feature check |
| Using VK_ARM_tensors on non-ARM GPU | Extension absent | Hardware tier gating |

### Version Gate Strategy

```yaml
version_gate:
  minimum_vulkan: "1.1"
  required_features:
    vulkan_1_2: [descriptor_indexing, buffer_device_address]
    vulkan_1_3: [dynamic_rendering, synchronization2]
  optional_extensions:
    ray_tracing: [VK_KHR_acceleration_structure, VK_KHR_ray_tracing_pipeline]
    mesh_shading: [VK_EXT_mesh_shader]
    tensor: [VK_ARM_tensors, VK_ARM_data_graph]
```

## Upstream Intelligence YAML Structure

The upstream intelligence artifact follows a defined schema:

```yaml
upstream_intelligence:
  vulkan_version: "1.4"
  sdk_version: "1.4.341"
  last_updated: "2026-03-27"
  
  samples:
    - id: hello_triangle
      category: api
      vulkan_min: "1.0"
      extensions: []
      concepts: [instance, device, swapchain, pipeline, command_buffer]
      
    - id: ray_tracing_basic
      category: extension
      vulkan_min: "1.1"
      extensions: [VK_KHR_ray_tracing_pipeline, VK_KHR_acceleration_structure]
      concepts: [acceleration_structure, ray_generation, closest_hit]
      hardware_tier: "rtx_2000_plus"
  
  deprecations:
    - pattern: "VkRenderPass for simple rendering"
      since: "1.3"
      replacement: "VK_KHR_dynamic_rendering"
      severity: "low"
```

---

> **Related:** See [Extension Corpus](02-extension-corpus.md) for the extensions tracked here, and [skill-creator Wiring](06-skill-creator-wiring.md) for how this intelligence is consumed.
