#version 300 es
precision highp float;

uniform sampler2D u_palette;  // 32x1 palette texture
uniform float u_time;          // animation time for subtle effects
uniform vec2 u_resolution;

in vec2 vUV;
out vec4 fragColor;

void main() {
  // Map vertical position to palette index for gradient background.
  // Creates a vertical gradient using palette colors.
  float index = vUV.y * 31.0;
  float palU = (floor(index) + 0.5) / 32.0;  // +0.5 for texel center

  vec4 color = texture(u_palette, vec2(palU, 0.5));
  fragColor = color;
}
