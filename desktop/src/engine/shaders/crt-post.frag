#version 300 es
precision highp float;

uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform float u_scanlineIntensity;
uniform float u_phosphorGlow;

in vec2 vUV;
out vec4 fragColor;

/**
 * Compute scanline darkening factor for the current fragment.
 * Creates horizontal dark bands that simulate CRT electron beam scanning.
 */
float scanline(vec2 uv, float intensity) {
  float scanPos = uv.y * u_resolution.y;
  float scanFactor = sin(scanPos * 3.14159) * 0.5 + 0.5;
  return mix(1.0, scanFactor, intensity);
}

/**
 * Simulate phosphor glow by averaging neighboring texels.
 * Uses a 7-sample cross pattern: center + 4 horizontal + 2 vertical neighbors.
 */
vec3 phosphorGlow(sampler2D tex, vec2 uv, vec2 texelSize, float intensity) {
  vec3 center = texture(tex, uv).rgb;

  vec3 sum = center;
  sum += texture(tex, uv + vec2(-2.0 * texelSize.x, 0.0)).rgb;
  sum += texture(tex, uv + vec2(-1.0 * texelSize.x, 0.0)).rgb;
  sum += texture(tex, uv + vec2( 1.0 * texelSize.x, 0.0)).rgb;
  sum += texture(tex, uv + vec2( 2.0 * texelSize.x, 0.0)).rgb;
  sum += texture(tex, uv + vec2(0.0, -1.0 * texelSize.y)).rgb;
  sum += texture(tex, uv + vec2(0.0,  1.0 * texelSize.y)).rgb;

  vec3 avg = sum / 7.0;
  return mix(center, avg, intensity);
}

void main() {
  vec2 texelSize = 1.0 / u_resolution;

  // Apply phosphor glow first (before scanlines darken the result)
  vec3 color = phosphorGlow(u_source, vUV, texelSize, u_phosphorGlow);

  // Apply scanline darkening
  float scan = scanline(vUV, u_scanlineIntensity);
  color *= scan;

  fragColor = vec4(color, 1.0);
}
