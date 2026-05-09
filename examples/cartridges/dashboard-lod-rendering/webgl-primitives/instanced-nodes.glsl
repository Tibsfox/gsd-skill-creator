// =============================================================================
// dashboard-lod-rendering / webgl-primitives / instanced-nodes.glsl
// -----------------------------------------------------------------------------
// SDF-disk-with-border node primitive for the WebGL rung (doc 02 §3).
// Per-instance attributes: position (vec2), radius (float), colorIndex (uint).
// Single instanced draw call paints N nodes; per-instance attribute divisor 1.
// =============================================================================

// -- VERTEX SHADER ------------------------------------------------------------
#ifdef VERTEX_SHADER

#version 300 es
precision highp float;

// Per-vertex (one quad — 6 vertices forming two triangles)
in vec2 a_quadVert;        // ∈ [-1,1] × [-1,1]

// Per-instance attributes (vertexAttribDivisor(loc, 1))
in vec2  a_position;       // world-space center of the disk
in float a_radius;         // world-space radius
in uint  a_colorIndex;     // 0..255 — index into u_palette

// Camera (one uniform; updated per frame)
uniform mat3 u_camera;     // 3x3 affine matrix: pan + zoom in 2D

// Outputs to fragment
out vec2 v_localUV;        // [-1,1] across the quad
flat out uint v_colorIndex;  // flat — integers cannot be linearly interpolated

void main() {
  vec2 worldPos = a_position + a_quadVert * a_radius;
  vec2 clip = (u_camera * vec3(worldPos, 1.0)).xy;
  gl_Position = vec4(clip, 0.0, 1.0);
  v_localUV = a_quadVert;
  v_colorIndex = a_colorIndex;
}

#endif

// -- FRAGMENT SHADER ----------------------------------------------------------
#ifdef FRAGMENT_SHADER

#version 300 es
precision highp float;

in vec2 v_localUV;
flat in uint v_colorIndex;

uniform sampler2D u_palette;     // 256x1 — colorIndex -> RGBA fill colour

out vec4 outColor;

void main() {
  // Signed distance from disk centre (0 at centre, 1 at edge of quad)
  float d = length(v_localUV);

  // Antialiased edge — Inigo Quilez SDF disk pattern.
  // fwidth(d) is the change in d per pixel; multiplying by ~0.7 gives a smooth
  // anti-aliased edge that matches the screen pixel size automatically across
  // any zoom level. See iquilezles.org/articles/distfunctions2d/.
  float aa     = fwidth(d) * 0.7;
  float fill   = smoothstep(1.0,        1.0 - aa, d);
  float border = smoothstep(0.85 - aa,  0.85,     d) * fill;

  // Palette lookup — colorIndex maps to a 256x1 texture row.
  // The fragment shader does NOT need to know the palette contents; the
  // application updates the texture for selection-highlight / theme-switch
  // without recompiling the shader.
  vec4 fillColour = texelFetch(u_palette, ivec2(int(v_colorIndex), 0), 0);
  vec4 borderCol  = vec4(0.05, 0.05, 0.05, 1.0);

  outColor = mix(fillColour, borderCol, border);

  // Discard transparent pixels (outside the disk) so the depth buffer stays
  // clean for layered overlays.
  if (fill < 0.001) discard;
}

#endif

// =============================================================================
// USAGE NOTES
// =============================================================================
//
// 1. Compile this file twice — once with #define VERTEX_SHADER, once with
//    #define FRAGMENT_SHADER — and link as a single program. (Or split into
//    two files; the dashboard's loader does the #define trick to keep them
//    co-located.)
//
// 2. Set up VAO with:
//      a_quadVert   — per-vertex   (divisor 0; default)
//      a_position   — per-instance (divisor 1; gl.vertexAttribDivisor(loc, 1))
//      a_radius     — per-instance (divisor 1)
//      a_colorIndex — per-instance (divisor 1; integer attribute)
//
// 3. Draw call:
//      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instanceCount);
//
// 4. Use STREAM_DRAW + bufferSubData for buffers that change every frame
//    (a_position during layout iteration); STATIC_DRAW for a_radius once
//    set; STATIC_DRAW for a_quadVert.
//
// 5. The palette texture is 256x1 RGBA8. Slot N maps to colour N. The
//    dashboard's palette: 0=node-default, 10=commit-green, 20=decision-orange,
//    30=task-blue, 40=file-blue, 50=alternative-red, 60=evidence-purple, etc.
//    See cartridge `dashboard/lib/palette.js` for the mapping.
//
// =============================================================================
