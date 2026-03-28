# Expert Track (Lessons 37-48)

## Cutting-Edge Techniques

The expert track contains the most technically demanding lessons: physical simulation, shader programming, advanced rendering techniques, and the mathematical foundations of interactive 3D navigation.

### Lesson 37 -- Cel Shading (Toon Shader)

Non-photorealistic rendering that gives 3D objects a cartoon/comic appearance:

1. Compute the dot product of the surface normal and light direction
2. Use the result as an index into a 1D texture (shade ramp)
3. The shade ramp contains discrete brightness bands instead of smooth gradients
4. Render black outlines by rendering back-faces slightly enlarged in black

The result is the distinctive "cel-shaded" look used in games like Jet Set Radio, The Legend of Zelda: Wind Waker, and Borderlands.

### Lesson 38 -- Loading Compressed Textures (DXT)

Compressed texture formats (DXT1/DXT3/DXT5, also known as S3TC/BC1-BC3) store textures in GPU-native compressed form:

| Format | Bits/Pixel | Alpha | Ratio |
|--------|-----------|-------|-------|
| DXT1 (BC1) | 4 bpp | 1-bit | 6:1 |
| DXT3 (BC2) | 8 bpp | 4-bit explicit | 4:1 |
| DXT5 (BC3) | 8 bpp | Interpolated | 4:1 |

Compressed textures reduce GPU memory usage and improve rendering performance by reducing memory bandwidth. The GPU decompresses blocks on-the-fly during texture sampling.

### Lesson 39 -- Physical Simulation Introduction

Introduction to physics simulation with spring-mass systems:

- **Mass points** -- particles with position, velocity, and mass
- **Springs** -- connections between masses obeying Hooke's law: F = -k * x
- **Damping** -- velocity-proportional force to prevent perpetual oscillation
- **Integration** -- Euler method for updating positions from forces

The simulation produces bouncing, stretching, and oscillating behavior from simple mathematical rules.

### Lesson 40 -- Rope Physics (Verlet Integration)

Constraint-based physics using Verlet integration:

```
new_position = current_position + (current_position - old_position) + acceleration * dt^2
```

Verlet integration is numerically stable and naturally handles constraints: after each integration step, distance constraints between connected particles are enforced by moving particles back to their required distances. This produces realistic rope, cloth, and chain behavior.

### Lesson 41 -- Virtual Worlds with ODE

Integration with the Open Dynamics Engine (ODE) for rigid body physics. ODE provides:

- Rigid body dynamics (forces, torques, mass properties)
- Collision detection with various geometry types
- Constraint joints (hinge, slider, ball-socket)

This lesson demonstrates how a physics engine integrates with OpenGL rendering: ODE computes positions/orientations, OpenGL renders the results.

### Lesson 42 -- Multiple Viewports

Split-screen rendering using glViewport to divide the window into multiple independent rendering regions. Each viewport can have its own camera, projection, and scene content. Applications: CAD tools (front/side/top/perspective views), split-screen multiplayer, picture-in-picture.

### Lesson 43 -- FreeType Fonts in OpenGL

High-quality anti-aliased text using the FreeType2 library:

1. Load a TrueType/OpenType font file with FreeType
2. Render each glyph to a bitmap
3. Upload glyph bitmaps as OpenGL textures
4. Render text as textured quads with proper kerning and spacing

This is the modern standard for text rendering in OpenGL applications, replacing all previous font techniques (L13-L15, L17).

### Lesson 44 -- 3D Lens Flare

Simulated camera lens flare effects:

- Billboard quads positioned along the line from the light source through the screen center
- Each quad represents a lens element (aperture, ghost, streak)
- Occlusion testing: if the light source is behind geometry, suppress the flare
- Intensity modulated by angle and occlusion

### Lesson 45 -- Vertex Buffer Objects (VBOs)

The modern GPU data path. VBOs store vertex data in GPU memory rather than client memory:

```
glGenBuffers(1, &vbo)
glBindBuffer(GL_ARRAY_BUFFER, vbo)
glBufferData(GL_ARRAY_BUFFER, size, data, GL_STATIC_DRAW)
```

VBOs eliminate the need for glBegin/glEnd and reduce CPU-GPU data transfer. This is the single most important modernization lesson -- it bridges legacy OpenGL to the modern programmable pipeline.

### Lesson 46 -- Fullscreen Antialiasing

Multisampling (MSAA) for smooth edges:

- Request a multisample pixel format (WGL_ARB_multisample on Windows)
- The GPU renders each pixel multiple times at sub-pixel offsets
- Samples are averaged to produce smooth edges without shader changes

### Lesson 47 -- CG Shader Introduction

NVIDIA Cg (C for Graphics) vertex and fragment programs. Cg was one of the first high-level shading languages, predating GLSL's widespread adoption. This lesson demonstrates custom vertex transformation and per-pixel lighting in a shader program.

**Modernization note:** Cg is deprecated. Direct translation to GLSL vertex and fragment shaders.

### Lesson 48 -- ArcBall Rotation

Quaternion-based trackball interaction for 3D viewport navigation:

- Map 2D mouse positions to a virtual hemisphere
- Compute the rotation axis (cross product of start and end vectors)
- Compute the rotation angle (dot product)
- Apply as a quaternion rotation to avoid gimbal lock

ArcBall rotation is the standard interaction pattern for 3D viewport navigation in CAD, modeling, and visualization applications.

---

> **Related:** See [Advanced Track](04-advanced-track.md) for the prerequisites, and [Upstream Integration](06-upstream-integration.md) for how these techniques are indexed for skill-creator.
