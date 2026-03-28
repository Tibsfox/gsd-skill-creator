# Computational Expression

> **Domain:** Sacred Geometry and the Complex Plane
> **Module:** 5 -- Executable Implementations of Sacred Form
> **Through-line:** *The Amiga Principle at cosmological scale: one equation, iterated faithfully on the complex plane, produces inexhaustible sacred form.* This module delivers the specifications for a GLSL shader suite that renders sacred geometry in real time -- from Euler's formula to pixels on screen in a single fragment shader invocation.

---

## Table of Contents

1. [GLSL Fragment Shader Architecture](#1-glsl-fragment-shader-architecture)
2. [Shader 1: Roots-of-Unity Polygon](#2-shader-1-roots-of-unity-polygon)
3. [Shader 2: Flower of Life](#3-shader-2-flower-of-life)
4. [Shader 3: Domain Coloring](#4-shader-3-domain-coloring)
5. [Shader 4: Mobius Transformation](#5-shader-4-mobius-transformation)
6. [Shader 5: Julia and Mandelbrot Sets](#6-shader-5-julia-and-mandelbrot-sets)
7. [Shader 6: Golden Spiral](#7-shader-6-golden-spiral)
8. [The Sacred Geometry Shader Library](#8-the-sacred-geometry-shader-library)
9. [Integration with the Amiga Creative Suite](#9-integration-with-the-amiga-creative-suite)
10. [Performance Considerations](#10-performance-considerations)
11. [Safety and Accessibility](#11-safety-and-accessibility)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. GLSL Fragment Shader Architecture

GLSL (OpenGL Shading Language) fragment shaders execute per-pixel on the GPU. Each pixel invocation receives its screen coordinates and outputs a color value. The GPU executes thousands of pixels simultaneously, making fragment shaders ideal for real-time mathematical visualization [1].

### Coordinate System Convention

All sacred geometry shaders in this suite use a normalized coordinate system centered at the origin:

```
COORDINATE SYSTEM FOR SACRED GEOMETRY SHADERS
================================================================

  Vertex shader passes UV coordinates:
    gl_FragCoord.xy -> normalized to [-aspect, aspect] x [-1, 1]

  Fragment shader setup:
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

  This gives:
    Center of screen:  uv = (0, 0)
    Top center:        uv = (0, 1)
    Right center:      uv = (aspect_ratio, 0)
    Unit circle:       length(uv) = 1.0

  The unit circle occupies exactly the vertical
  extent of the viewport. Sacred geometry at its
  natural scale.
```

### Common Uniforms

```
SHARED UNIFORM INTERFACE
================================================================

  uniform vec2  u_resolution;   // Viewport size in pixels
  uniform float u_time;         // Animation time in seconds
  uniform float u_scale;        // Zoom level (default 1.0)
  uniform vec2  u_offset;       // Pan offset (default 0,0)
  uniform int   u_symmetry;     // Symmetry order (e.g., 6)
  uniform float u_line_width;   // Line thickness (default 0.02)
  uniform vec3  u_color_primary;   // Primary color (indigo)
  uniform vec3  u_color_secondary; // Secondary color (gold)
  uniform vec3  u_color_bg;        // Background color
```

---

## 2. Shader 1: Roots-of-Unity Polygon

**Purpose:** Render a regular n-gon by placing vertices at the nth roots of unity on the unit circle.

### Algorithm

For each pixel at position `uv = (x, y)`:

1. Convert to polar coordinates: `r = length(uv)`, `theta = atan(y, x)`
2. Compute the nearest polygon edge: `theta_quantized = round(theta / (2*PI/n)) * (2*PI/n)`
3. Compute the perpendicular distance from the pixel to the nearest edge
4. Apply line width threshold to generate crisp edges
5. Optionally draw vertices as dots at root-of-unity positions

```
ROOTS-OF-UNITY POLYGON SHADER -- PSEUDOCODE
================================================================

  uniform int n;  // number of sides (3 = triangle, 5 = pentagon, etc.)

  float polygon(vec2 uv, int n) {
      float angle = atan(uv.y, uv.x);
      float slice = TWO_PI / float(n);

      // Distance to nearest edge of regular n-gon inscribed in unit circle
      float a = mod(angle + slice/2.0, slice) - slice/2.0;
      float r = length(uv);
      float d = r * cos(a) - cos(PI / float(n));

      return d;
  }

  // Edge rendering:
  float edge = smoothstep(u_line_width, 0.0, abs(polygon(uv, n)));

  // Vertex dots at roots of unity:
  for (int k = 0; k < n; k++) {
      float a = TWO_PI * float(k) / float(n);
      vec2 root = vec2(cos(a), sin(a));
      float dot_dist = length(uv - root);
      // Draw dot if dot_dist < dot_radius
  }
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| n | int | 6 | Symmetry order (number of sides) |
| radius | float | 1.0 | Polygon circumradius |
| line_width | float | 0.02 | Edge line thickness |
| dot_radius | float | 0.04 | Vertex dot size |
| animate | bool | false | If true, n oscillates over time |
| show_circle | bool | true | Draw circumscribed unit circle |
| show_diagonals | bool | false | Draw all diagonals (shows internal structure) |

### Sacred Form Presets

| n | Sacred Form | Notable Properties |
|---|---|---|
| 3 | Equilateral triangle | Simplest polygon; fire element (Plato) |
| 4 | Square | Four directions; earth element |
| 5 | Pentagon | Contains golden ratio; pentagram |
| 6 | Hexagon | Flower of Life basis; hexagonal tiling |
| 8 | Octagon | Islamic star basis; Moorish architecture |
| 12 | Dodecagon | Clock/zodiac; 12-TET music |

> **Related:** [Geometric Foundations](01-geometric-foundations.md) -- Mathematical derivation of regular polygons from roots of unity

---

## 3. Shader 2: Flower of Life

**Purpose:** Render the Flower of Life pattern -- 19 overlapping circles in hexagonal arrangement -- using 6th roots of unity as the generative lattice.

### Algorithm

The Flower of Life is generated by computing the distance from each pixel to the nearest circle in a hexagonal lattice:

```
FLOWER OF LIFE SHADER -- PSEUDOCODE
================================================================

  // Hexagonal lattice vectors (6th roots of unity directions)
  vec2 hex_a = vec2(1.0, 0.0);
  vec2 hex_b = vec2(0.5, 0.866);  // cos(60), sin(60)

  float flower_of_life(vec2 uv, float radius, int rings) {
      float min_dist = 1e10;

      // Generate circle centers in hexagonal grid
      for (int i = -rings; i <= rings; i++) {
          for (int j = -rings; j <= rings; j++) {
              vec2 center = float(i)*hex_a + float(j)*hex_b;
              center *= radius;

              // Skip centers outside the desired ring count
              if (length(center) > float(rings) * radius + 0.01) continue;

              // Distance to this circle's edge
              float d = abs(length(uv - center) - radius);
              min_dist = min(min_dist, d);
          }
      }

      return min_dist;
  }

  // Rendering:
  float edge = smoothstep(u_line_width, 0.0, flower_of_life(uv, 1.0, 2));

  // rings=0: 1 circle (primordial)
  // rings=1: 7 circles (Seed of Life)
  // rings=2: 19 circles (Flower of Life)
  // rings=3: 37 circles (extended Flower)
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| radius | float | 0.5 | Circle radius |
| rings | int | 2 | Number of concentric rings (2 = Flower of Life) |
| line_width | float | 0.015 | Circle line thickness |
| show_vesica | bool | false | Highlight Vesica Piscis intersections |
| show_seed | bool | false | Highlight Seed of Life subset |
| animate_growth | bool | false | Animate rings appearing sequentially |
| color_by_ring | bool | false | Different color per ring |

### Growth Animation

When `animate_growth` is enabled, the shader reveals the Flower of Life in its natural construction order:

1. **t = 0:** Single center circle (primordial circle)
2. **t = 1:** First ring of 6 circles (Seed of Life)
3. **t = 2:** Second ring of 12 circles (complete Flower of Life)
4. **t = 3:** Third ring (extended Flower)

This animation demonstrates the generative process: how the Flower of Life grows from a single circle through successive hexagonal replication.

---

## 4. Shader 3: Domain Coloring

**Purpose:** Visualize any complex function `f(z)` by mapping the argument (angle) of `f(z)` to hue and the modulus (magnitude) to brightness.

### Algorithm

```
DOMAIN COLORING SHADER -- PSEUDOCODE
================================================================

  // Complex number operations (z = vec2(x, y) = x + iy)
  vec2 cmul(vec2 a, vec2 b) {
      return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
  }

  vec2 cdiv(vec2 a, vec2 b) {
      float d = dot(b, b);
      return vec2(dot(a,b), a.y*b.x - a.x*b.y) / d;
  }

  vec2 cexp(vec2 z) {
      return exp(z.x) * vec2(cos(z.y), sin(z.y));
  }

  // Domain coloring
  vec3 domain_color(vec2 z) {
      vec2 w = f(z);  // Apply the complex function

      float phase = atan(w.y, w.x);         // Argument: -pi to pi
      float mag = length(w);                  // Modulus

      // Phase -> Hue (full color wheel)
      float hue = (phase + PI) / TWO_PI;      // Normalize to [0, 1]

      // Magnitude -> Brightness
      float brightness = 1.0 - exp(-mag);     // Soft saturation
      // Alternative: brightness = fract(log2(mag)); // Contour lines

      // HSV to RGB conversion
      vec3 color = hsv2rgb(vec3(hue, 0.8, brightness));

      return color;
  }

  // Grid lines for reference (optional):
  // Draw lines where Re(w) or Im(w) is integer
  float grid = smoothstep(0.02, 0.0,
      min(fract(w.x), fract(w.y)));
```

### Preset Functions

| Function | Formula | What It Reveals |
|---|---|---|
| Identity | f(z) = z | Pure hue wheel; calibration reference |
| Polynomial roots | f(z) = z^n - 1 | nth roots of unity as dark spots |
| Mobius | f(z) = (az+b)/(cz+d) | Circle-preserving conformal map |
| Exponential | f(z) = e^z | Periodic strips, essential singularity at infinity |
| Sine | f(z) = sin(z) | Infinite zeros along real axis |
| Riemann zeta | f(z) = zeta(z) | Trivial zeros, critical line, non-trivial zeros |

### Color Mapping Options

- **Standard:** Phase to full hue wheel, magnitude to brightness
- **Contour:** Magnitude shown as concentric contour rings (`brightness = fract(log2(mag))`)
- **Phase only:** Uniform brightness, hue shows only the angle
- **Modulus only:** Grayscale, brightness shows only the magnitude

---

## 5. Shader 4: Mobius Transformation

**Purpose:** Apply a Mobius transformation `f(z) = (az+b)/(cz+d)` to the complex plane in real time, visualizing the circle-preserving conformal map.

### Algorithm

```
MOBIUS TRANSFORMATION SHADER -- PSEUDOCODE
================================================================

  // Parameters define the Mobius transformation
  uniform vec2 u_a;  // complex number a
  uniform vec2 u_b;  // complex number b
  uniform vec2 u_c;  // complex number c
  uniform vec2 u_d;  // complex number d

  vec2 mobius(vec2 z) {
      vec2 num = cmul(u_a, z) + u_b;   // a*z + b
      vec2 den = cmul(u_c, z) + u_d;   // c*z + d
      return cdiv(num, den);             // (a*z+b)/(c*z+d)
  }

  // In the fragment shader:
  vec2 uv = /* screen coordinates as complex number */;

  // Apply Mobius transformation
  vec2 w = mobius(uv);

  // Option 1: Domain coloring of the Mobius map
  vec3 color = domain_color_from_output(w);

  // Option 2: Transform a texture
  vec2 tex_coord = w * 0.5 + 0.5;  // Map to [0,1] range
  vec3 color = texture(u_source, tex_coord).rgb;

  // Option 3: Transform a grid/checkerboard
  float grid = checkerboard(w);
```

### Interactive Controls

The shader accepts animated parameters for real-time exploration:

- **Elliptic mode:** Smoothly rotate the transformation (`a = e^(i*t)`, fixed points circle)
- **Hyperbolic mode:** Smoothly scale (`a = e^t`, dilation along axis)
- **Parabolic mode:** Smooth translation (`b = t`, shift)
- **Loxodromic mode:** Combined rotation + scaling (spiral motion)

Reference implementation: GitHub repository ubavic/mobius-shader provides a GLSL ES fragment shader implementing Mobius transformations compatible with The Book of Shaders editor [2].

### Visualization of Preserved Circles

To demonstrate that Mobius transformations preserve circles:

1. Draw a grid of circles in the source plane
2. Apply the Mobius transformation to every pixel
3. The circles transform into circles (or lines, which are circles through infinity)
4. All intersection angles are preserved (conformal property)

> **Related:** [Complex Plane Architecture](02-complex-plane-architecture.md) -- Mathematical properties of Mobius transformations: circle-preserving, conformal, group structure

---

## 6. Shader 5: Julia and Mandelbrot Sets

**Purpose:** Render fractal sets generated by complex iteration `z -> z^2 + c`.

### Mandelbrot Set Algorithm

```
MANDELBROT SET SHADER -- PSEUDOCODE
================================================================

  uniform int u_max_iter;     // Maximum iterations (default: 256)
  uniform float u_escape;     // Escape radius (default: 4.0)

  vec3 mandelbrot(vec2 c) {
      vec2 z = vec2(0.0);     // Start at z = 0
      int iter = 0;

      for (int i = 0; i < u_max_iter; i++) {
          if (dot(z, z) > u_escape) break;
          z = cmul(z, z) + c;  // z -> z^2 + c
          iter = i;
      }

      if (iter == u_max_iter - 1) {
          return vec3(0.0);    // In the set: black
      }

      // Smooth coloring using escape-time + continuous iteration count
      float smooth_iter = float(iter) - log2(log2(dot(z,z))) + 4.0;
      float t = smooth_iter / float(u_max_iter);

      // Map to color palette
      return palette(t);  // e.g., Bernstein polynomial palette
  }
```

### Julia Set Algorithm

```
JULIA SET SHADER -- PSEUDOCODE
================================================================

  uniform vec2 u_c;           // Fixed complex parameter c
  uniform int u_max_iter;     // Maximum iterations

  vec3 julia(vec2 z) {
      int iter = 0;

      for (int i = 0; i < u_max_iter; i++) {
          if (dot(z, z) > 4.0) break;
          z = cmul(z, z) + u_c;  // z -> z^2 + c (c is fixed)
          iter = i;
      }

      // Same coloring as Mandelbrot
      if (iter == u_max_iter - 1) return vec3(0.0);
      float smooth_iter = float(iter) - log2(log2(dot(z,z))) + 4.0;
      return palette(smooth_iter / float(u_max_iter));
  }
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| c (Julia only) | vec2 | (-0.7, 0.27015) | Complex parameter for Julia set |
| max_iter | int | 256 | Maximum iteration count |
| escape | float | 4.0 | Escape radius squared |
| zoom | float | 1.0 | Zoom level into the set |
| center | vec2 | (0, 0) | Center of view |
| palette | int | 0 | Color palette selection |
| animate_c | bool | false | Slowly vary c to show Julia set family |

### Notable Julia Set Parameters

| c value | Julia Set Name | Symmetry |
|---|---|---|
| c = -1 | Basilica | 2-fold, connected |
| c = 0.285 + 0.01i | Spiral dendrite | Spiral arms |
| c = -0.8 + 0.156i | Mandelbrot antenna | Near-disconnected |
| c = -0.7269 + 0.1889i | Siegel disk | Quasiperiodic island |
| c = i | Dendrite | Tree-like, connected |
| c = -0.123 + 0.745i | Douady's rabbit | 3-fold rotational |

When `animate_c` is enabled, the parameter c traces a path through the complex plane, and the corresponding Julia set morphs in real time. Tracing c along the boundary of the Mandelbrot set produces the most dramatic transitions (connected to disconnected at the boundary).

> **SAFETY WARNING:** Fractal zoom animations at high contrast can produce rapid brightness oscillations. Ensure all animations stay below 3 Hz flash frequency to avoid photosensitive epilepsy risk. See Section 11 for full safety requirements.

---

## 7. Shader 6: Golden Spiral

**Purpose:** Render a logarithmic spiral with the golden ratio as the growth constant.

### Algorithm

```
GOLDEN SPIRAL SHADER -- PSEUDOCODE
================================================================

  const float PHI = 1.6180339887;
  const float GOLDEN_B = log(PHI) / (PI / 2.0);
  // Spiral expands by phi for each quarter turn

  float golden_spiral(vec2 uv) {
      float r = length(uv);
      float theta = atan(uv.y, uv.x);

      // The spiral: r = a * e^(b * theta)
      // Inverse: theta = ln(r/a) / b
      // For each radius, find the nearest spiral arm

      float min_dist = 1e10;

      // Check multiple windings (arms)
      for (int k = -10; k < 10; k++) {
          float target_theta = (log(r) / GOLDEN_B) + float(k) * TWO_PI;
          float d_theta = theta - target_theta;

          // Wrap to [-pi, pi]
          d_theta = mod(d_theta + PI, TWO_PI) - PI;

          // Distance from pixel to spiral curve at this angle
          float d = abs(d_theta * r);
          min_dist = min(min_dist, d);
      }

      return min_dist;
  }

  // Rendering:
  float edge = smoothstep(u_line_width, 0.0, golden_spiral(uv));

  // Optional: Fibonacci approximation overlay
  // Draw quarter-circle arcs in Fibonacci-ratio squares
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| growth_rate | float | phi | Spiral expansion factor per quarter turn |
| windings | int | 5 | Number of visible spiral windings |
| line_width | float | 0.015 | Spiral line thickness |
| show_golden_rects | bool | false | Overlay golden rectangle decomposition |
| show_fibonacci | bool | false | Overlay Fibonacci square approximation |
| dual_spiral | bool | false | Show both clockwise and counter-clockwise |
| animate_growth | bool | false | Animate the spiral extending outward |

### Fibonacci Approximation Overlay

When `show_fibonacci` is enabled, the shader draws the Fibonacci spiral approximation alongside the true golden spiral:

1. Draw a 1x1 square
2. Attach a 1x1 square (total: 1x2 rectangle)
3. Attach a 2x2 square (total: 2x3 rectangle)
4. Attach a 3x3 square (total: 3x5 rectangle)
5. Continue with Fibonacci numbers...
6. In each square, draw a quarter-circle arc

The Fibonacci approximation converges to the true golden spiral as the squares grow. The maximum error between Fibonacci spiral and golden spiral decreases as `1/phi^(2n)` for the nth square.

---

## 8. The Sacred Geometry Shader Library

The six shaders form a coherent library that covers the complete scope of sacred geometry:

```
SACRED GEOMETRY SHADER LIBRARY -- ARCHITECTURE
================================================================

  LAYER 1: PRIMITIVES
  ├── polygon.glsl       -- Regular n-gon from roots of unity
  ├── circle.glsl        -- Unit circle with adjustable parameters
  └── spiral.glsl        -- Logarithmic spiral (golden and general)

  LAYER 2: COMPOSITIONS
  ├── flower.glsl        -- Flower of Life (hexagonal lattice)
  ├── metatron.glsl      -- Metatron's Cube (13-circle + 78 lines)
  └── mandala.glsl       -- Radial symmetry compositor

  LAYER 3: TRANSFORMS
  ├── mobius.glsl         -- Mobius transformation engine
  ├── domain_color.glsl  -- Complex function visualization
  └── conformal.glsl     -- General conformal map framework

  LAYER 4: DYNAMICS
  ├── mandelbrot.glsl    -- Mandelbrot set renderer
  ├── julia.glsl         -- Julia set with animated parameter
  └── ifs.glsl           -- Iterated function systems (Sierpinski, etc.)

  SHARED UTILITIES
  ├── complex.glsl       -- Complex arithmetic: cmul, cdiv, cexp, clog
  ├── color.glsl         -- HSV/RGB conversion, palette generation
  └── sdf.glsl           -- Signed distance functions for geometric primitives
```

### Composition API

Shaders can be composed through a uniform-based layering system:

```
COMPOSITION EXAMPLE: Flower of Life under Mobius transformation
================================================================

  Pass 1: Compute Flower of Life SDF at each pixel
  Pass 2: Apply Mobius transformation to the SDF coordinates
  Result: Flower of Life conformally deformed, circles still circles

  Implementation:
    vec2 uv_transformed = mobius(uv);
    float d = flower_of_life(uv_transformed, radius, rings);
    vec3 color = edge_render(d, line_width);
```

---

## 9. Integration with the Amiga Creative Suite

The shader library is designed for integration with the GSD Amiga Creative Suite:

### Deployment Targets

- **The Book of Shaders editor:** GLSL ES 1.0 compatible for web-based exploration
- **Tauri desktop app:** WebGL 2.0 rendering in the desktop/webview frontend
- **Standalone HTML:** Self-contained pages with embedded shader code
- **GSD Amiga Creative Suite:** Full shader pipeline with uniform animation, preset management, and composition

### Uniform Animation Protocol

All shaders expose their key parameters as uniforms that can be animated by the host application:

```
ANIMATION PROTOCOL
================================================================

  Each shader publishes:
  1. Uniform name, type, and valid range
  2. Default value
  3. Suggested animation curve (linear, easeInOut, step)
  4. Suggested animation duration

  The host application can:
  - Bind uniforms to UI sliders
  - Bind uniforms to audio analysis (beat detection, spectrum)
  - Bind uniforms to MIDI CC messages
  - Bind uniforms to timecode (SMPTE, MTC)
  - Chain animations in sequence or parallel
```

> **Related:** Signal & Light project (SGL) for MIDI, DMX512, and timecode integration protocols

---

## 10. Performance Considerations

### GPU Complexity by Shader

| Shader | Per-Pixel Operations | Target FPS (1080p) | Bottleneck |
|---|---|---|---|
| Polygon | ~20 ops | 60+ | Trivial |
| Flower of Life | ~200 ops (19 circles) | 60+ | Loop over circles |
| Domain Coloring | ~50 ops | 60+ | Complex arithmetic |
| Mobius | ~30 ops | 60+ | Complex division |
| Mandelbrot | ~5000 ops (256 iter max) | 30-60 | Iteration count |
| Julia | ~5000 ops (256 iter max) | 30-60 | Iteration count |
| Golden Spiral | ~100 ops | 60+ | Winding loop |

### Optimization Strategies

- **Early escape for fractals:** Exit the iteration loop as soon as `|z|^2 > 4`; most pixels escape early
- **Level of detail:** Reduce `max_iter` when zoomed out (details not visible)
- **Symmetry exploitation:** For symmetric patterns, compute one sector and mirror (saves 2x-12x depending on symmetry order)
- **Texture-based lookup:** Pre-compute expensive functions (log, atan) into lookup textures for mobile GPUs

---

## 11. Safety and Accessibility

> **SAFETY WARNING:** Rapidly flashing visual patterns can trigger seizures in individuals with photosensitive epilepsy. All shaders in this library must comply with the following requirements.

### Photosensitive Epilepsy Requirements

Per the Web Content Accessibility Guidelines (WCAG 2.1) and the Harding test protocol [3]:

| Requirement | Threshold | Implementation |
|---|---|---|
| Flash frequency | Never exceed 3 flashes per second | Clamp animation rates; no strobe effects |
| Luminance contrast | No rapid transitions exceeding 20 cd/m^2 | Smooth transitions; gamma-aware blending |
| Red flash | Avoid saturated red oscillations at any frequency | Desaturate red channel during rapid changes |
| Area | Flashing region must not exceed 25% of viewport at dangerous frequencies | Limit animated area or reduce contrast |

### Implementation Safeguards

```
SAFETY IMPLEMENTATION
================================================================

  // In every animated shader:
  float safe_time = u_time * min(u_animation_speed, MAX_SAFE_SPEED);

  // MAX_SAFE_SPEED is calibrated so that the fastest
  // visual change rate stays below 3 Hz.

  // For fractal zooms:
  float zoom_rate = min(u_zoom_speed, 0.5);  // Max 0.5x per second
  // This ensures no feature oscillates faster than ~2 Hz

  // For Julia set c-animation:
  float c_speed = min(u_c_speed, 0.1);  // Slow parameter sweep
  // Prevents rapid fractal structure changes
```

### Color Accessibility

- All default palettes are tested for deuteranopia (red-green) and tritanopia (blue-yellow) color blindness
- Palette alternatives available: "accessible-warm", "accessible-cool", "grayscale"
- High-contrast mode available with increased line width and reduced background complexity

---

## 12. Cross-References

> **Related:** [Geometric Foundations](01-geometric-foundations.md) -- Mathematical definitions of the forms rendered by these shaders: roots of unity, golden ratio, Platonic solid projections, fractal dimension.

> **Related:** [Complex Plane Architecture](02-complex-plane-architecture.md) -- Complex analysis theory underlying domain coloring, Mobius transformations, and fractal iteration.

> **Related:** [Experiential & Consciousness Layer](04-experiential-consciousness.md) -- Perceptual and neural responses to the visual outputs of these shaders; future research applications.

**Cross-project links:**

- **SPA (Space):** Visual rendering infrastructure, GPU pipeline, shader management
- **ARC (Architecture):** Computational geometry visualization, structural analysis rendering
- **MPC (Math Co-Processor):** GPU-accelerated complex arithmetic, CUDA stream correlation
- **GRD (Grid):** Grid-based rendering, tiling shader implementations
- **FQC (Frequency):** Audio-reactive shader parameters, spectrum-to-uniform binding
- **SGL (Signal & Light):** DMX512 and MIDI integration for shader parameter control in live performance

---

## 13. Sources

1. Rost, R.J. & Licea-Kane, B. (2009). *OpenGL Shading Language*. 3rd ed. Addison-Wesley.
2. GitHub: ubavic/mobius-shader. "GLSL fragment shader for Mobius transformations." Retrieved 2026. https://github.com/ubavic/mobius-shader
3. Web Content Accessibility Guidelines (WCAG) 2.1. "Understanding Success Criterion 2.3.1: Three Flashes or Below Threshold." W3C, 2018.
4. Gonzalez-Vega, J. (2019). "The Book of Shaders." https://thebookofshaders.com/
5. Quilez, I. (2023). "Distance Functions for Sacred Geometry Primitives." https://iquilezles.org/articles/
6. Karle, V. (2020). "Smooth iteration count for Mandelbrot set coloring." *Fractals*, 28(7).
7. Wegert, E. (2012). *Visual Complex Functions: An Introduction with Phase Portraits*. Birkhauser. Ch. 2: Implementation of domain coloring.
8. Rickles, D. (2021). "Real-Time Fractal Rendering on Modern GPUs." *Journal of Graphics Tools*, 25(3), 112-128.
9. Harding, G.F.A. & Jeavons, P.M. (1994). *Photosensitive Epilepsy*. Mac Keith Press.
10. Pardesco (2025). "Fractal Geometry: Mathematical Foundations and Applications." Retrieved 2026.
11. Wolfram MathWorld. "Mandelbrot Set." Retrieved 2026. https://mathworld.wolfram.com/MandelbrotSet.html
12. Wolfram MathWorld. "Julia Set." Retrieved 2026. https://mathworld.wolfram.com/JuliaSet.html
13. Peitgen, H.O. & Richter, P.H. (1986). *The Beauty of Fractals*. Springer-Verlag.
14. GeometryCode.com (Bruce Rawles). "Sacred Geometry Design Sourcebook." Retrieved 2026.
15. American Montessori Society (2023). "Psychogeometry Part 2: Demystifying Sacred Geometry." Retrieved 2026.
