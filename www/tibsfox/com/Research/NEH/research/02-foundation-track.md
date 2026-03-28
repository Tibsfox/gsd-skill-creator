# Foundation Track (Lessons 01-12)

## Tier 0: The First Window to 3D Shapes

### Lesson 01 -- Setting Up an OpenGL Window

The journey begins with creating a window and initializing an OpenGL rendering context. The original NeHe code uses Win32 API (CreateWindowEx, PixelFormatDescriptor, wglCreateContext). The modern implementation uses GLFW for cross-platform window management.

Key concepts:
- Window creation and event loop
- OpenGL context initialization
- Viewport setup with glViewport
- Clearing the framebuffer with glClear

### Lesson 02 -- Your First Polygon

Drawing primitives on screen. The immediate mode API (glBegin/glEnd) defines vertices inline:

```
glBegin(GL_TRIANGLES)
  glVertex3f( 0.0,  1.0, 0.0)  # top
  glVertex3f(-1.0, -1.0, 0.0)  # bottom-left
  glVertex3f( 1.0, -1.0, 0.0)  # bottom-right
glEnd()
```

This is the "Hello World" of 3D graphics: a white triangle on a black background. The modern equivalent uses vertex buffer objects and shader programs.

### Lesson 03 -- Adding Color

Color is specified per-vertex with glColor3f. OpenGL interpolates colors across triangle faces (Gouraud shading). This produces smooth color gradients without any lighting calculation.

### Lesson 04 -- Rotation

Animation enters the picture. The modelview matrix is manipulated with glRotatef to spin objects each frame. The display callback is called repeatedly, incrementing a rotation angle.

Key concept: the distinction between the **modelview matrix** (positions objects in the scene) and the **projection matrix** (defines the camera/viewport).

### Lesson 05 -- 3D Shapes

The depth buffer (Z-buffer) is enabled with glEnable(GL_DEPTH_TEST). Without it, triangles render in submission order regardless of distance. With it, closer geometry correctly occludes farther geometry.

A colored cube and pyramid are rendered with per-face colors, rotating on different axes.

## Tier 1: Texture and Light

### Lesson 06 -- Texture Mapping

The first texture is loaded from a BMP file and applied to a cube. Key API calls:

- glGenTextures / glBindTexture -- texture object management
- glTexImage2D -- upload pixel data to GPU
- glTexCoord2f -- assign texture coordinates to vertices

Texture coordinates (UV) map image pixels to geometry vertices. The range 0.0-1.0 covers the entire texture; values outside this range tile (GL_REPEAT) or clamp (GL_CLAMP).

### Lesson 07 -- Texture Filters + Lighting + Keyboard

Three texture filtering modes demonstrated:

| Filter | GL Constant | Quality | Performance |
|--------|------------|---------|-------------|
| Nearest | GL_NEAREST | Pixelated | Fastest |
| Linear | GL_LINEAR | Smooth/blurry | Fast |
| Mipmapped | GL_LINEAR_MIPMAP_LINEAR | Crisp at all distances | Best quality |

Lighting is introduced with GL_LIGHT0. The lighting model requires:
- Normal vectors per vertex/face (glNormal3f)
- Material properties (ambient, diffuse, specular)
- Light position and color

### Lesson 08 -- Blending

Transparency via alpha blending. The blend function glBlendFunc(GL_SRC_ALPHA, GL_ONE) controls how source and destination colors combine. Objects rendered with blending enabled appear translucent.

Blending requires careful render ordering: opaque objects first, then transparent objects sorted back-to-front.

### Lesson 09 -- Moving Bitmaps in 3D

Textured quads used as sprites in 3D space. This technique pre-dates modern particle systems and sprite rendering. Alpha blending makes the background of each quad transparent, creating the appearance of floating 2D images in 3D space.

### Lesson 10 -- Loading a 3D World

The first lesson that loads external data: a text file defining vertices, texture coordinates, and triangles. The viewer walks through the world using keyboard controls, updating the camera position and direction each frame.

This lesson introduces the concept of a **scene graph** -- structured geometry data loaded from disk rather than hard-coded.

### Lesson 11 -- Flag/Wave Effect

A flat mesh is deformed by a sine wave function, creating a rippling flag effect. The mesh vertices are updated each frame, and the texture mapping follows the deformation. This demonstrates animated geometry driven by mathematical functions.

### Lesson 12 -- Display Lists

Display lists compile a sequence of OpenGL commands into a named, reusable batch:

```
list_id = glGenLists(1)
glNewList(list_id, GL_COMPILE)
  # ... geometry commands ...
glEndList()

# Later, execute the compiled list:
glCallList(list_id)
```

Display lists reduce driver overhead by submitting pre-compiled command buffers. They are the precursor to vertex buffer objects (VBOs), which provide GPU-side storage.

## Common Modernization Notes

All 12 lessons in this tier require modernization from the original Win32/glaux code:

- **Window management:** Win32 API replaced with GLFW
- **Image loading:** glaux replaced with stb_image or Pillow
- **Build system:** Visual C++ project replaced with pip-installable Python package
- **API style:** Immediate mode (glBegin/glEnd) annotated with modern VBO equivalents

---

> **Related:** See [Taxonomy](01-taxonomy-skill-mapping.md) for the skill graph that organizes these lessons, and [Intermediate Track](03-intermediate-track.md) for lessons 13-24.
