#version 300 es
precision highp float;

uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform float u_barrelDistortion;
uniform float u_chromaticAberration;
uniform float u_vignette;

in vec2 vUV;
out vec4 fragColor;

/**
 * Apply barrel distortion to UV coordinates.
 * Centers UV to [-1,1] range, applies radial distortion,
 * then maps back to [0,1].
 */
vec2 barrelDistort(vec2 uv, float k) {
  vec2 centered = uv * 2.0 - 1.0;
  centered *= 1.0 + dot(centered, centered) * k;
  return centered * 0.5 + 0.5;
}

void main() {
  // Apply barrel distortion
  vec2 uv = barrelDistort(vUV, u_barrelDistortion);

  // Discard out-of-bounds fragments
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragColor = vec4(0.0);
    return;
  }

  // Chromatic aberration: offset R and B channels along direction from center
  vec2 center = vec2(0.5);
  vec2 dir = uv - center;
  float aberrationPx = u_chromaticAberration / u_resolution.x;

  float r = texture(u_source, uv + dir * aberrationPx).r;
  float g = texture(u_source, uv).g;
  float b = texture(u_source, uv - dir * aberrationPx).b;

  vec3 color = vec3(r, g, b);

  // Vignette: darken edges based on distance from center
  float dist = length(dir) * 2.0;
  float vig = 1.0 - smoothstep(1.0 - u_vignette, 1.0, dist);
  color *= vig;

  fragColor = vec4(color, 1.0);
}
