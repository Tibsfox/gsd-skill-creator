#version 300 es
precision highp float;

uniform sampler2D u_palette;     // 32x1 palette texture
uniform sampler2D u_copperList;  // Nx1 copper list texture (N = virtual height)
uniform float u_time;            // animation time (reserved for future animated raster bars)
uniform vec2 u_resolution;
uniform float u_copperHeight;    // virtual height of copper list (e.g., 256)

in vec2 vUV;
out vec4 fragColor;

void main() {
  // Map fragment Y to virtual scanline in copper list
  float scanline = vUV.y * u_copperHeight;
  float copperV = (floor(scanline) + 0.5) / u_copperHeight;

  // Read copper list entry for this scanline
  vec4 copperEntry = texture(u_copperList, vec2(0.5, copperV));

  // Decode: R = palette index A, G = palette index B, B = blend factor
  float indexA = copperEntry.r * 255.0;
  float indexB = copperEntry.g * 255.0;
  float blend = copperEntry.b;  // Already 0.0-1.0 after texture normalization

  // Look up both palette colors
  float palUA = (floor(indexA) + 0.5) / 32.0;
  float palUB = (floor(indexB) + 0.5) / 32.0;
  vec4 colorA = texture(u_palette, vec2(palUA, 0.5));
  vec4 colorB = texture(u_palette, vec2(palUB, 0.5));

  // Interpolate between the two palette colors
  fragColor = mix(colorA, colorB, blend);
}
