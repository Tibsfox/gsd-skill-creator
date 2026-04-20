# GFX Reference

Reference `kind: graphics` cartridge. Demonstrates the MVP shape of the
graphics chipset added 2026-04-20: WebGL 2 host, GLSL ES 3.00 shader
pair, vertex + fragment stages, `glslang` toolchain enabled, MSAA 4x,
60 FPS target.

Ships two real shader files under `shaders/`:

- `basic.vert.glsl` — clip-space pass-through with UV forwarding.
- `basic.frag.glsl` — UV RGB gradient plus a soft signed-distance halo
  around the UV-space centre. Produces a usable visual without any
  uniforms or textures, so the cartridge can be validated and dry-run
  without a full host.

## Research grounding

Grounded in the *Graphics APIs* research series at
[/Research/GFX/](https://tibsfox.com/Research/GFX/) on tibsfox.com:

| Module | Link | Why it matters here |
|---|---|---|
| M1 — OpenGL | [/Research/GFX/M1-opengl.html](https://tibsfox.com/Research/GFX/M1-opengl.html) | Desktop host API reference for the OpenGL 4.6 variant. |
| M2 — GLSL | [/Research/GFX/M2-glsl.html](https://tibsfox.com/Research/GFX/M2-glsl.html) | Shader language, six programmable stages, precision qualifiers — directly shapes both shaders here. |
| M3 — WebGL | [/Research/GFX/M3-webgl.html](https://tibsfox.com/Research/GFX/M3-webgl.html) | Browser-embedded API — matches the cartridge's default host. |
| M4 — Vulkan | [/Research/GFX/M4-vulkan.html](https://tibsfox.com/Research/GFX/M4-vulkan.html) | Validation layers, explicit sync — drives the Vulkan variant recipe. |
| M5 — Pipeline | [/Research/GFX/M5-pipeline.html](https://tibsfox.com/Research/GFX/M5-pipeline.html) | SPIR-V, SPIRV-Cross, ANGLE, MoltenVK — the cross-API bridge story. |

## Per-API variant recipes

To retarget this cartridge, edit the `kind: graphics` block in
`cartridge.yaml`:

### OpenGL 4.6 / GLSL 4.60 (desktop)

```yaml
api: opengl
api_version: "4.6"
shader_language: glsl
shader_language_version: "4.60"
host:
  kind: native-c   # or native-rust
```

### Vulkan 1.4 / SPIR-V (explicit sync, validation layers)

```yaml
api: vulkan
api_version: "1.4"
shader_language: spirv
shader_language_version: "1.6"
runtime:
  validation_layers: true
toolchain:
  glslang: true
  spirv_cross: true
host:
  kind: native-c
```

### OpenGL ES 3.2 (mobile)

```yaml
api: opengl-es
api_version: "3.2"
shader_language: glsl-es
shader_language_version: "3.20"
host:
  kind: native-c
```

## Forge-gate status

This reference cartridge is committed with all four forge gates green:

```
skill-creator cartridge validate examples/cartridges/gfx-reference/cartridge.yaml   # valid: true
skill-creator cartridge eval     examples/cartridges/gfx-reference/cartridge.yaml   # exit 0
skill-creator cartridge dedup    examples/cartridges/gfx-reference/cartridge.yaml   # no collisions
skill-creator cartridge metrics  examples/cartridges/gfx-reference/cartridge.yaml
```

`eval` runs the `all_graphics_sources_declare_stage` gate added with the
`graphics` kind: every shader source's `stage` must be listed in the
chipset's top-level `shader_stages[]`.

## How to run

### 1. Validate + eval

```
skill-creator cartridge validate ./cartridge.yaml
skill-creator cartridge eval ./cartridge.yaml
```

### 2. Preview in a browser (WebGL default)

The cartridge declares `host.kind: vite` and `host.entry: index.html`.
Bring your own Vite-served HTML: create an `index.html` that fetches
both shader files, compiles them into a WebGL 2 program, draws a
fullscreen quad, and you will see the UV + halo output defined by the
fragment shader above. The cartridge itself only declares the pipeline
shape — the host is intentionally BYO so any WebGL 2 demo host works.

### 3. Native hosts (OpenGL, Vulkan)

`host.kind: native-c` / `native-rust` / `mcp` are declared for forward
compatibility; a runtime shell is not yet shipped with
gsd-skill-creator. Point your own GLFW / SDL2 / Vulkan-Hpp host at the
shader paths in `sources[]`.
