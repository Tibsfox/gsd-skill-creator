# Advanced Track (Lessons 25-36)

## Significant Rendering Techniques

The advanced track introduces techniques that were at the cutting edge of real-time graphics when the NeHe tutorials were written: stencil operations, shadow rendering, parametric surfaces, collision detection, and heightmap terrain.

### Lesson 25 -- Morphing and OBJ Loading

Smooth interpolation between two 3D models. Given mesh A and mesh B with the same vertex count, each vertex position is linearly interpolated:

```
vertex_current = vertex_A * (1 - t) + vertex_B * t
```

Also introduces Wavefront OBJ file loading -- one of the simplest and most common 3D model formats (plain text, one vertex/face per line).

### Lesson 26 -- Stencil Buffer Reflections

The stencil buffer is used to create planar reflections:

1. Clear stencil buffer
2. Draw the reflective plane into the stencil only (no color/depth write)
3. Enable stencil test -- only draw where stencil was marked
4. Render the scene mirrored (scale by -1 on the reflection axis)
5. Disable stencil test
6. Render the normal scene and the reflective surface with blending

This creates a mirror effect on a flat surface (floor, water). The stencil buffer prevents reflected geometry from appearing outside the mirror boundary.

### Lesson 27 -- Shadow Volumes

Stencil-based shadow rendering using shadow volume geometry:

1. Determine silhouette edges of the occluder as seen from the light
2. Extrude silhouette edges away from the light to create shadow volume geometry
3. Render shadow volumes into stencil buffer using depth-fail (Carmack's reverse)
4. Where stencil count is non-zero, the pixel is in shadow -- darken it

Shadow volumes produce pixel-perfect hard shadows but are computationally expensive for complex geometry.

### Lesson 28 -- Bezier Patches

Parametric surface evaluation for smooth, curved geometry. A Bezier patch is defined by a grid of control points (typically 4x4 = 16 points). The surface is evaluated at discrete (u,v) parameters to produce a tessellated mesh.

Applications: car body panels, terrain smoothing, organic shapes, font rendering.

### Lesson 29 -- Blitter / Direct Pixel Access

Writing directly to the framebuffer with glDrawPixels and reading back with glReadPixels. This enables software rasterization effects, post-processing, and pixel-level manipulation.

**Modernization note:** glDrawPixels is deprecated. Modern equivalent: render to texture (FBO) + fullscreen quad with fragment shader.

### Lesson 30 -- Collision Detection

Ray-plane and ray-sphere intersection for basic collision detection. The lesson implements:

- Point-plane distance calculation
- Ray-triangle intersection (Moller-Trumbore algorithm)
- Simple response: reflect velocity vector off collision normal

This is the entry point to real-time physics in 3D graphics.

### Lesson 31 -- Model Loading (Milkshape 3D)

Loading MS3D (Milkshape 3D) format models. MS3D is a binary format that includes vertex positions, triangles, groups, materials, and joint/bone data for skeletal animation. This lesson focuses on static rendering; animation is left as an exercise.

### Lesson 32 -- Picking

Selection of objects in 3D space by clicking. GL_SELECT mode renders the scene with a name stack:

1. Enter selection mode with glRenderMode(GL_SELECT)
2. Render each object with a unique name pushed to the stack
3. Query the hit records to determine which objects were under the cursor

**Modernization note:** GL_SELECT is deprecated. Modern approaches: ray casting from screen coordinates, color-coded rendering to an offscreen FBO.

### Lesson 33 -- Loading TGA (Compressed)

Extension of Lesson 24's TGA loader to support Run-Length Encoding (RLE) compressed TGA files. RLE compression encodes sequences of identical pixels as a count + value pair, significantly reducing file size for images with large uniform areas.

### Lesson 34 -- Heightmap Terrain

Generating terrain from a grayscale heightmap image:

- Each pixel's brightness value becomes the Y (height) coordinate
- Pixels are laid out on a regular XZ grid
- Normals are computed from height differences for lighting
- Texture coordinates map aerial imagery or procedural textures

Heightmap terrain is the foundation of virtually all outdoor rendering in games and simulations.

### Lesson 35 -- Playing AVI in OpenGL

Streaming video frames as OpenGL textures. Each frame of an AVI file is decoded and uploaded as a texture, then rendered on a quad. This demonstrates real-time texture updates -- the same technique used for webcam feeds, video playback in 3D environments, and dynamic texture content.

**Modernization note:** AVI decoding via Windows API is platform-specific. Modern equivalent: FFmpeg + texture streaming.

### Lesson 36 -- Radial Blur / Translucency

Multi-pass rendering for motion blur and glow effects:

1. Render the scene normally
2. Render again with slight scale increase and reduced alpha
3. Repeat with increasing scale and decreasing alpha
4. Blend all passes together

The accumulated translucent copies create a radial blur/glow effect around bright objects. This is a precursor to modern bloom post-processing shaders.

---

> **Related:** See [Intermediate Track](03-intermediate-track.md) for the prerequisites, and [Expert Track](05-expert-track.md) for lessons 37-48.
