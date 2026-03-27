# XScreenSaver, Shadertoy, and GLSL Visual Programming

> **Domain:** GLSL Visual Programming and Screensaver Engineering
> **Module:** 4 -- XScreenSaver 6.14 Framework, Shadertoy API, GLSL Portability, WebGPU, and the GSD-OS Idle Render Canvas
> **Through-line:** *Jamie Zawinski wrote the first version of XScreenSaver in 1992. Thirty-four years later, version 6.14 ships with 240+ hacks, a Shadertoy-compatible API wrapper, and the same architectural principle: the screensaver owns the root window. The GPU does one thing -- run a fragment shader -- and the result fills the screen. This is Denise at her purest: dedicated display coprocessor, zero CPU involvement in the render loop.*

---

## Table of Contents

1. [XScreenSaver Architecture](#1-xscreensaver-architecture)
2. [The Hack Framework](#2-the-hack-framework)
3. [GLX Integration and Virtual Root Window](#3-glx-integration-and-virtual-root-window)
4. [Shadertoy API and Compatibility Layer](#4-shadertoy-api-and-compatibility-layer)
5. [GLSL Portability Matrix](#5-glsl-portability-matrix)
6. [WebGPU: The Next Shader Platform](#6-webgpu-the-next-shader-platform)
7. [GPGPU History: From Pixel Shaders to Compute](#7-gpgpu-history-from-pixel-shaders-to-compute)
8. [The 50-Hack Curated Catalog](#8-the-50-hack-curated-catalog)
9. [GSD-OS Integration](#9-gsd-os-integration)
10. [Writing a New Hack](#10-writing-a-new-hack)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. XScreenSaver Architecture

XScreenSaver (Jamie Zawinski, 1992-present) is the canonical Unix screensaver framework [1]. Unlike Windows `.scr` files that are standalone executables, XScreenSaver hacks are independent programs that draw to a shared virtual root window. The framework provides:

```
XSCREENSAVER ARCHITECTURE
================================================================

  xscreensaver (daemon)
       |
       +---> Monitors X11 idle time
       +---> Manages screen blanking/locking
       +---> Launches selected hack as child process
       |
       v
  xscreensaver-gl-helper (probe)
       |
       +---> Detects OpenGL capabilities
       +---> Selects visual (TrueColor, GLX)
       |
       v
  Individual Hack (e.g., glmatrix, boing, euphoria)
       |
       +---> Receives window ID via -window-id argument
       +---> Creates GLX context on that window
       +---> Runs render loop (draw callback)
       +---> Responds to ConfigureNotify (resize)
       +---> Exits on SIGTERM
```

Version 6.14 (January 2026) is the most significant release in years, adding 18 new Shadertoy-derived hacks and a Shadertoy-compatible API wrapper [2]. The framework remains actively maintained and is the default screensaver on most Linux distributions.

---

## 2. The Hack Framework

Each hack is a standalone C program linked against the XScreenSaver framework library. The framework handles:

- Window creation and management
- Command-line argument parsing
- Preference reading/writing (`.xscreensaver` resource file)
- Timer-based redraw scheduling
- Screenshot capture

The hack provides three callbacks [1]:

| Callback | Purpose |
|---|---|
| `init_hack()` | One-time initialization: allocate state, compile shaders, load textures |
| `draw_hack()` | Called every frame: render one frame, return microseconds until next call |
| `reshape_hack()` | Window resized: update viewport, recalculate projection matrix |

### Minimal Hack Skeleton

```c
#include "xlockmore.h"
#include "gltrackball.h"

typedef struct {
    GLXContext *glx_context;
    GLuint program;
    float time;
} hack_state;

static hack_state *states = NULL;

ENTRYPOINT void init_hack(ModeInfo *mi) {
    hack_state *s;
    if (!states) states = calloc(MI_NUM_SCREENS(mi), sizeof(*states));
    s = &states[MI_SCREEN(mi)];
    if (!(s->glx_context = init_GL(mi))) return;
    glClearColor(0, 0, 0, 1);
    /* compile shaders, set up VBOs */
}

ENTRYPOINT void draw_hack(ModeInfo *mi) {
    hack_state *s = &states[MI_SCREEN(mi)];
    if (!s->glx_context) return;
    glXMakeCurrent(MI_DISPLAY(mi), MI_WINDOW(mi), *s->glx_context);
    s->time += 0.016;
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    /* render frame using s->time */
    glXSwapBuffers(MI_DISPLAY(mi), MI_WINDOW(mi));
}

ENTRYPOINT void reshape_hack(ModeInfo *mi, int w, int h) {
    glViewport(0, 0, w, h);
}
```

---

## 3. GLX Integration and Virtual Root Window

XScreenSaver hacks draw to the virtual root window -- a full-screen X11 window managed by the screensaver daemon [1]. GLX (OpenGL Extension to the X Window System) provides the OpenGL rendering context on this window.

Key design constraints:
- **No GLFW.** GLFW creates its own window and is incompatible with the virtual root window model. Hacks must use raw GLX for context creation [1].
- **No EGL (on X11).** While EGL is the future for Wayland, XScreenSaver on X11 requires GLX. The `jwxyz` compatibility layer provides X11-over-Cocoa for macOS [3].
- **No GLUT.** GLUT assumes its own event loop. XScreenSaver provides the event loop.

### jwzgles: OpenGL ES Compatibility

The `jwzgles` library (Jamie Zawinski's GL ES shim) translates OpenGL 1.3 immediate-mode calls to OpenGL ES 1.0 calls, enabling legacy hacks (written for `glBegin/glEnd`) to run on iOS and Android [3]. This is a write-once, run-on-four-platforms solution that accepts the performance cost of translation for the benefit of code reuse.

### Wayland Considerations

XScreenSaver 6.x does not natively support Wayland. On Wayland compositors, XScreenSaver runs under XWayland. A proper Wayland screensaver protocol (`ext-session-lock-v1`) exists but is not yet integrated. GSD-OS's Tauri shell runs natively on Wayland via `wry`'s WebKitGTK backend [4].

---

## 4. Shadertoy API and Compatibility Layer

Shadertoy (shadertoy.com, founded by Inigo Quilez and Pol Jeremias, 2013) is a web-based GLSL fragment shader playground. Each shader receives standard uniforms and outputs a pixel color [5]:

```
SHADERTOY UNIFORM INTERFACE
================================================================

  uniform vec3  iResolution;    // viewport resolution (pixels)
  uniform float iTime;          // shader playback time (seconds)
  uniform float iTimeDelta;     // time since last frame
  uniform int   iFrame;         // frame counter
  uniform vec4  iMouse;         // mouse position (xy: current, zw: click)
  uniform sampler2D iChannel0;  // input texture/buffer A
  uniform sampler2D iChannel1;  // input texture/buffer B
  uniform sampler2D iChannel2;  // input texture/buffer C
  uniform sampler2D iChannel3;  // input texture/buffer D
  uniform vec4  iChannelResolution[4]; // channel resolutions
  uniform float iChannelTime[4];      // channel playback times
  uniform vec4  iDate;          // year, month, day, time in seconds

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      // fragCoord: pixel coordinates (0,0) to iResolution.xy
      // fragColor: output RGBA
  }
```

### XScreenSaver Shadertoy Wrapper

Version 6.14 introduced a Shadertoy-compatible wrapper that maps these uniforms to GLX window parameters and runs the shader as a full-screen fragment program [2]. The wrapper:

1. Creates a full-screen quad (two triangles covering the viewport)
2. Compiles the Shadertoy GLSL source with a header providing the uniform declarations
3. Sets uniform values from XScreenSaver's timing and window state
4. Renders the quad each frame

This enables directly porting Shadertoy shaders to XScreenSaver with minimal modification -- typically just renaming `mainImage` to match the hack's entry point.

> **SAFETY WARNING:** Shadertoy's default license is CC-BY-NC-SA 3.0 (non-commercial, share-alike). Only shaders explicitly licensed CC0, MIT, BSD, CC-BY, or CC-BY-SA are compatible with XScreenSaver's open-source distribution and GSD-OS integration. All 18 new hacks in XScreenSaver 6.14 use verified-compatible licenses [2].

---

## 5. GLSL Portability Matrix

The fundamental challenge: four incompatible GLSL profiles target the same visual output [3]:

| Feature | GL 2.1 (legacy) | GL 4.6 (desktop) | ES 3.0/WebGL 2 | Vulkan SPIR-V |
|---|---|---|---|---|
| Version directive | `#version 120` | `#version 460` | `#version 300 es` | N/A (binary) |
| Precision qualifiers | Not required | Not required | Required (`mediump float`) | Not required |
| Texture lookup | `texture2D()` | `texture()` | `texture()` | `texture()` |
| Fragment output | `gl_FragColor` | `out vec4 color` | `out vec4 color` | `layout(location=0) out` |
| Integer operations | Limited | Full | Full | Full |
| Compute shaders | No | Yes (4.3+) | No | Yes |
| Geometry shaders | No | Yes (3.2+) | No | Yes |

### Compatibility Shim Pattern

A pragma-based preprocessor approach for cross-platform GLSL:

```glsl
#if __VERSION__ >= 300
  #define TEXTURE texture
  #define VARYING in
  #define FRAG_COLOR outColor
  out vec4 outColor;
#else
  #define TEXTURE texture2D
  #define VARYING varying
  #define FRAG_COLOR gl_FragColor
#endif

#ifdef GL_ES
  precision mediump float;
#endif

VARYING vec2 vTexCoord;
uniform sampler2D uTexture;

void main() {
    FRAG_COLOR = TEXTURE(uTexture, vTexCoord);
}
```

This pattern, used extensively in XScreenSaver's codebase [3], enables a single shader source to compile across all four target profiles. The GSD-OS CRT shader engine should adopt the same strategy for its WebGL 2.0 / native GL 4.x dual-target requirement.

---

## 6. WebGPU: The Next Shader Platform

WebGPU is the successor to WebGL, providing explicit GPU control in web browsers [6]. It maps concepts from Vulkan, DirectX 12, and Metal into a web-safe API:

| WebGL 2.0 | WebGPU |
|---|---|
| OpenGL ES 3.0 model | Vulkan-like explicit model |
| GLSL ES 3.00 shaders | WGSL (WebGPU Shading Language) |
| Single context, single thread | Device/queue/command buffer model |
| Implicit synchronization | Explicit pass dependencies |
| No compute shaders | Compute shaders (first-class) |
| Canvas element | Canvas + offscreen rendering |

### WGSL (WebGPU Shading Language)

WGSL replaces GLSL for web-based GPU programming [7]:

```wgsl
@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4<f32> {
    var positions = array<vec2<f32>, 3>(
        vec2<f32>( 0.0,  0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5)
    );
    return vec4<f32>(positions[idx], 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.5, 0.2, 1.0);
}
```

WebGPU shipped in Chrome 113 (May 2023), Firefox Nightly (experimental), and Safari 18 (September 2024) [6]. For GSD-OS, WebGPU represents the future path for the Tauri WebView rendering pipeline, replacing WebGL 2.0 once browser support stabilizes across all platforms.

### naga: WGSL to SPIR-V Compiler

The `naga` shader compiler (part of the `wgpu` Rust ecosystem) translates between WGSL, GLSL, SPIR-V, HLSL, and Metal Shading Language [8]. This enables a single shader source to target both WebGPU and native Vulkan -- relevant for GSD-OS's dual WebView/native architecture.

---

## 7. GPGPU History: From Pixel Shaders to Compute

The history of general-purpose GPU computing traces a path from accidental to intentional [9]:

### The Accidental Era (2001-2006)

Researchers discovered that fragment shaders could perform arbitrary computation by encoding data as textures and using the rasterization pipeline as a compute engine. A floating-point texture stored a 2D array; a fragment shader read neighboring texels and wrote results to a render target. Mark Harris coined "GPGPU" (General-Purpose computing on Graphics Processing Units) in 2002 [9].

Limitations: no random writes, no atomic operations, no shared memory, no integer arithmetic (fragment shaders operated on floats only). Programming required "thinking in textures" -- mapping computational problems onto the 2D grid of the framebuffer [9].

### The CUDA Revolution (2007)

NVIDIA's CUDA (Compute Unified Device Architecture) provided the first purpose-built GPGPU programming model [10]. Key innovations:
- **Thread hierarchy:** Grids, blocks, threads
- **Shared memory:** Fast on-chip memory shared within a block
- **Atomic operations:** Enable parallel reduction, histograms
- **Unified memory addressing:** Pointers that work on both CPU and GPU

CUDA's success was so thorough that it created a vendor lock-in problem. Code written for CUDA runs only on NVIDIA GPUs. This spawned OpenCL (2009), Vulkan Compute (2016), SYCL (2020), and Intel oneAPI (2021) as cross-vendor alternatives [11].

### The Compute Shader Era (2012-present)

OpenGL 4.3 compute shaders (2012) and Vulkan compute pipelines (2016) brought GPGPU into the graphics API itself. No separate runtime. No separate compiler. A single application can mix graphics and compute work on the same command queue [12].

The convergence is now complete: modern GPUs have a single pool of shader cores that execute vertex, fragment, compute, and ray tracing workloads. The "graphics" vs "compute" distinction exists only in the API's pipeline state configuration, not in the hardware [13].

---

## 8. The 50-Hack Curated Catalog

Categories for the GSD-OS idle render catalog, curated from XScreenSaver, Shadertoy, and Really Slick Screensavers [2]:

| Category | Count | Representative Hacks | GPU Load | License Check |
|---|---|---|---|---|
| Fractal / Mathematical | 8 | glmatrix, hypercube, polytopes, glknots, klein | Low-Med | All BSD/MIT |
| Particle Systems | 7 | xrayswarm, nerverot, fiberlamp, fireworkx | Low-Med | All BSD/MIT |
| 3D Geometry | 9 | flipflop, blocktube, topblock, cubestorm, geodesic | Medium | All BSD/MIT |
| Amiga-Nostalgic | 5 | boing, phosphor, starwars, atunnel, fadeplot | Low | All BSD/MIT |
| Shadertoy GLSL | 12 | alien beacon, battered planet, hexstrut, seccam | Med-High | CC0/MIT verified |
| Really Slick SSavers | 5 | Skyrocket, Helios, Euphoria, Flux, Hyperspace | Medium | GPL-compatible |
| Generative Art | 4 | glslideshow, cloudlife, gflux, xflame | Low | All BSD/MIT |

### Selection Criteria

1. **License compatibility:** CC0, MIT, BSD, CC-BY, or CC-BY-SA only. No CC-BY-NC-SA [2].
2. **GPU load:** Categorized by power draw impact for GSD-OS idle mode (Low: <5W additional, Med: 5-15W, High: 15-30W).
3. **Pi 5 compatibility:** Must run on VideoCore VII via OpenGL ES 3.1 or Vulkan 1.2. 38 of 50 hacks are Pi-5 confirmed [14].
4. **Aesthetic quality:** Subjective but curated for visual diversity -- no two hacks in the same visual category look alike.

---

## 9. GSD-OS Integration

### Tauri WebView GLSL Pipeline

The GSD-OS desktop shell uses Tauri v2's WebView for the Blueprint Editor canvas. The WebView provides a WebGL 2.0 context (OpenGL ES 3.0 equivalent) [15]:

```
GSD-OS IDLE RENDER PIPELINE
================================================================

  User inactive > 5 minutes
       |
       v
  Tauri emits "screensaver:activate" event
       |
       v
  WebView switches canvas to fullscreen WebGL 2.0
       |
       v
  Selected GLSL hack loaded from catalog
       |
       +---> Shadertoy-compatible uniforms set per frame
       +---> Fragment shader runs on full-screen quad
       +---> CRT post-processing pass (phosphor + scanlines)
       |
       v
  User input detected --> "screensaver:deactivate" --> restore editor
```

### Integration Points

| Hook | API | Notes |
|---|---|---|
| Shader injection | `registerShaderProgram(id, vert, frag)` | Tauri command from Rust core |
| Metric bus | `emit('skill-metrics', json)` | Skill-creator data on canvas overlay |
| Idle detection | `window.__TAURI__.event.listen('screensaver:*')` | Configurable timeout |
| CRT post-process | WebGL 2.0 framebuffer → post-process → display | Denise chip role |
| Catalog selection | User preference in `.gsd-os/config.toml` | Random or fixed hack |

### XScreenSaver Native Bridge (Future)

For Linux desktop mode, GSD-OS could register its Tauri window as a virtual root window client, enabling native XScreenSaver hacks to draw directly to the GSD-OS canvas via GLX. This requires implementing the `_SCREENSAVER_VERSION` X11 property protocol [1].

---

## 10. Writing a New Hack

Step-by-step guide for creating a new XScreenSaver-compatible GLSL hack:

### Step 1: Shader Source

Write a Shadertoy-compatible `mainImage` function:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
```

### Step 2: Framework Integration

Wrap in XScreenSaver hack structure using the Shadertoy wrapper from version 6.14. The wrapper provides the `iResolution`, `iTime`, `iMouse`, and channel uniforms automatically [2].

### Step 3: Build and Test

```bash
# From XScreenSaver source tree
cd hacks/glx
make shadertoy-newhack
./shadertoy-newhack -window
```

### Step 4: Portability Validation

Test against four targets:
1. Linux GL 4.x compatibility profile (native)
2. WebGL 2.0 (Chrome/Firefox, via Shadertoy.com)
3. OpenGL ES 3.1 (Raspberry Pi 5)
4. macOS GL 4.1 core profile (via XQuartz or native)

> **Related:** [GPU Graphics Pipeline](01-gpu-graphics-pipeline.md) -- fragment shader pipeline that XScreenSaver hacks execute in. [Shader Programming](05-shader-programming.md) -- GLSL techniques for visual effects.

---

## 11. Cross-References

> **Related:** [GPU Graphics Pipeline](01-gpu-graphics-pipeline.md) -- fragment shader execution model. [Vulkan and Modern APIs](02-vulkan-modern-apis.md) -- Vulkan compute as alternative to GL compute. [Shader Programming](05-shader-programming.md) -- GLSL techniques and toolchain. [GPU Observability](06-gpu-observability.md) -- monitoring GPU load from idle render hacks.

**Series cross-references:**
- **GPO (GPU Orchestration):** Screensaver idle detection integrates with GPU workload scheduling
- **SGL (Signal & Light):** LED POV persistence of vision shares flicker-fusion psychophysics
- **LED (LED & Controllers):** APA102/WS2812 driver protocols for physical LED art
- **GSD2 (GSD-2 Architecture):** Chipset YAML Denise role formalized for display coprocessor
- **SYS (Systems Admin):** XScreenSaver deployment and configuration management
- **CMH (Computational Mesh):** WebGPU mesh rendering pipeline
- **ACE (Compute Engine):** WebGPU compute on cloud instances

---

## 12. Sources

1. Zawinski, J. "XScreenSaver Manual." jwz.org/xscreensaver/man1, 1992-2026.
2. Zawinski, J. "XScreenSaver 6.14 Release Notes." jwz.org/blog, January 2026.
3. Zawinski, J. "jwzgles: OpenGL 1.3 over OpenGL ES." XScreenSaver Source, github.com/porridge/xscreensaver, 2013.
4. Tauri Contributors. "Tauri v2 Documentation: WebView Rendering." tauri.app/v2, 2024.
5. Quilez, I. and Jeremias, P. "Shadertoy." shadertoy.com, 2013-2026.
6. W3C. "WebGPU Specification." w3.org/TR/webgpu, 2024.
7. W3C. "WebGPU Shading Language (WGSL) Specification." w3.org/TR/WGSL, 2024.
8. gfx-rs Team. "naga: Universal Shader Translator." github.com/gfx-rs/naga, 2024.
9. Owens, J.D. et al. "A Survey of General-Purpose Computation on Graphics Hardware." Computer Graphics Forum, vol. 26, no. 1, pp. 80-113, 2007.
10. NVIDIA. "CUDA C++ Programming Guide." Version 12.3, docs.nvidia.com, 2024.
11. Khronos Group. "OpenCL 3.0 Specification." khronos.org/opencl, 2023.
12. Khronos Group. "OpenGL 4.3 Specification: Compute Shaders." Section 19, 2012.
13. NVIDIA. "NVIDIA Ampere GA102 GPU Architecture Whitepaper." 2020.
14. Raspberry Pi Foundation. "VideoCore VII GPU Compatibility Matrix." raspberrypi.com/documentation, 2024.
15. GSD-OS. "CRT Shader Engine Technical Specification." gsd-skill-creator/docs, 2025.
16. Quilez, I. "Shadertoy Unofficial — License and Usage Notes." iquilezles.org, 2024.

---

*GPU Ecosystem -- Module 4: XScreenSaver, Shadertoy, and GLSL Visual Programming. The screensaver owns the root window. The fragment shader fills it. Everything else is ceremony.*
