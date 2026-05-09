// =============================================================================
// dashboard-lod-rendering / webgl-primitives / edge-batch.glsl
// -----------------------------------------------------------------------------
// Wide-line edge primitive via per-instance quad extrusion (doc 02 §4).
// gl.lineWidth() is unreliable across implementations; quad-based wide lines
// are the canonical workaround documented at
//   https://www.khronos.org/opengl/wiki/Wide_Lines
// and used by mapbox-gl-js, deck.gl, Sigma.js v2.
// =============================================================================

// -- VERTEX SHADER ------------------------------------------------------------
#ifdef VERTEX_SHADER

#version 300 es
precision highp float;

// Per-vertex (one quad: 6 vertices forming a thin rectangle)
in vec2 a_quadVert;        // x ∈ [0,1] (along edge), y ∈ [-1,1] (perpendicular)

// Per-instance edge attributes
in vec2  a_src;            // edge source position
in vec2  a_dst;            // edge destination position
in float a_thickness;      // half-width in screen pixels
in uint  a_colorIndex;

// Camera
uniform mat3 u_camera;
uniform float u_pixelToWorld;  // 1.0 / screen-pixels-per-world-unit at current zoom

// Outputs
out vec2 v_localUV;
flat out uint v_colorIndex;

void main() {
  vec2 dir = a_dst - a_src;
  float len = length(dir);
  vec2 tangent = (len > 0.0001) ? dir / len : vec2(1.0, 0.0);
  vec2 normal = vec2(-tangent.y, tangent.x);

  // a_quadVert.x ∈ [0,1] interpolates along the edge.
  // a_quadVert.y ∈ [-1,1] extrudes perpendicular by thickness (in world units).
  float thicknessWorld = a_thickness * u_pixelToWorld;
  vec2 worldPos = a_src + tangent * (a_quadVert.x * len) + normal * (a_quadVert.y * thicknessWorld);

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

uniform sampler2D u_palette;

out vec4 outColor;

void main() {
  // Antialias the perpendicular edge of the line.
  float dPerp = abs(v_localUV.y);  // 0 = centerline, 1 = edge of quad
  float aa = fwidth(dPerp) * 0.7;
  float alpha = smoothstep(1.0, 1.0 - aa, dPerp);

  vec4 col = texelFetch(u_palette, ivec2(int(v_colorIndex), 0), 0);
  outColor = vec4(col.rgb, col.a * alpha);

  if (alpha < 0.005) discard;
}

#endif

// =============================================================================
// USAGE NOTES
// =============================================================================
//
// 1. The quad attribute is laid out as:
//      a_quadVert = [(0,-1), (1,-1), (0,1),   (0,1), (1,-1), (1,1)]
//    — two triangles forming a long thin rectangle along x ∈ [0,1] with
//    perpendicular extent y ∈ [-1,1].
//
// 2. u_pixelToWorld converts screen-pixel thickness to world coords. The
//    application computes:
//      const screenWidthPx = canvas.width;
//      const worldWidthAtZoom = screenWidthPx / cameraZoom;
//      const u_pixelToWorld = worldWidthAtZoom / screenWidthPx;
//                          // simplifies to 1 / cameraZoom
//
// 3. For curved edges (overlapping straight projections), extend by adding a
//    per-instance control-point attribute and evaluating a quadratic Bezier in
//    the vertex shader. See deck.gl's LineLayer with `getCurvature` callback.
//
// 4. Edge colour index is keyed on relation type per T5 substrate decision 1
//    (closed PROV-O relation set):
//      0=default, 10=wasGeneratedBy-green, 20=used-grey,
//      30=wasInformedBy-amber, 40=wasInfluencedBy-red-dashed (pattern via
//      additional attribute), etc. The dashboard's palette texture handles
//      relation-type → colour mapping.
//
// =============================================================================
