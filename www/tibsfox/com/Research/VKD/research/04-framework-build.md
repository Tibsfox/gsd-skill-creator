# Framework and Build Architecture

## Sample Framework Design

The Vulkan Samples framework provides shared infrastructure that all samples build upon. Understanding this framework is essential for extending the sample collection or building applications based on the patterns.

## Application Architecture

### Class Hierarchy

```
vkb::Application (base)
  └── vkb::VulkanSample (Vulkan-specific base)
        └── HelloTriangle (specific sample)
        └── ComputeNBody (specific sample)
        └── ... (80+ samples)
```

### Lifecycle

Each sample follows a defined lifecycle:

| Method | Purpose | Called |
|--------|---------|-------|
| prepare() | Create Vulkan resources | Once at startup |
| update(delta_time) | Update logic (animation, physics) | Every frame |
| draw(command_buffer) | Record rendering commands | Every frame |
| finish() | Destroy Vulkan resources | Once at shutdown |

### Resource Management

The framework provides RAII wrappers for common Vulkan objects:

- **vkb::Device** -- logical device with queue management
- **vkb::Swapchain** -- presentation surface management
- **vkb::RenderContext** -- frame-in-flight management
- **vkb::ShaderModule** -- SPIR-V loading and reflection

## Platform Abstraction

### Supported Platforms

| Platform | Window System | Build System |
|----------|--------------|-------------|
| Windows | Win32 | CMake + MSVC |
| Linux | Wayland / X11 | CMake + GCC/Clang |
| macOS | MoltenVK | CMake + Xcode |
| Android | ANativeWindow | CMake + Gradle |

### Platform Layer

The platform abstraction handles:

- Window creation and event handling
- Input (keyboard, mouse, touch)
- File system access (asset loading)
- Timer and frame timing
- Display properties (resolution, DPI, HDR)

## CMake Build System

### Structure

```
vulkan-samples/
  ├── CMakeLists.txt          (root)
  ├── app/                     (platform entry points)
  ├── framework/               (shared framework code)
  ├── samples/                 (individual samples)
  │     ├── api/               (API foundation samples)
  │     ├── extensions/        (extension samples)
  │     └── performance/       (performance samples)
  ├── shaders/                 (GLSL -> SPIR-V)
  ├── assets/                  (models, textures)
  └── third_party/             (dependencies)
```

### Key CMake Features

- Per-sample CMake targets (build individual samples)
- SPIR-V shader compilation via glslangValidator
- Asset management via Git LFS submodule (vulkan-samples-assets)
- Android builds via Gradle integration with CMake

## Dependencies

### Required

- Vulkan SDK (headers, loader, validation layers)
- CMake 3.16+
- C++17 compiler
- glslangValidator (SPIR-V compilation)

### Optional

- Git LFS (for binary assets in vulkan-samples-assets submodule)
- Android SDK + NDK (for Android builds)
- Doxygen (for documentation generation)

## CI/CD Patterns

### Validation Layer Integration

All samples run with Vulkan validation layers enabled during CI:

```
VK_INSTANCE_LAYERS=VK_LAYER_KHRONOS_validation
```

The validation layers detect:
- API usage errors
- Memory leaks
- Synchronization hazards
- Best practice violations

### GPU CI Considerations

GPU-dependent tests require hardware in the CI pipeline:

| Approach | Pros | Cons |
|----------|------|------|
| SwiftShader (CPU) | No GPU needed | Slow, limited features |
| Cloud GPU instances | Real hardware | Cost per run |
| Self-hosted runners | Consistent hardware | Maintenance burden |

## Asset Management

### Git LFS

Binary assets (textures, models, HDR environments) are stored in a separate Git LFS repository (vulkan-samples-assets) referenced as a submodule. This keeps the main repository small while providing high-quality test assets.

### Asset Loading Pipeline

```
Disk (PNG/KTX/glTF) 
  --> CPU decode (stb_image/tinygltf)
    --> Staging buffer (HOST_VISIBLE)
      --> Transfer command
        --> GPU memory (DEVICE_LOCAL)
```

The framework provides loaders for:
- PNG/JPG textures (stb_image)
- KTX2 textures (Khronos Texture format, compressed)
- glTF 2.0 models (tinygltf)
- SPIR-V shaders (pre-compiled)

## Extension Support Checking

The framework provides runtime extension checking:

```cpp
if (device.is_extension_supported("VK_KHR_ray_tracing_pipeline")) {
    // Enable ray tracing features
} else {
    // Graceful fallback
}
```

Samples that require specific extensions check availability at prepare() time and skip gracefully if unsupported.

---

> **Related:** See [API Foundations](01-api-foundations.md) for the samples that use this framework, and [Upstream Intelligence](05-upstream-intelligence.md) for version tracking.
