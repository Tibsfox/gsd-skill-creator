#version 300 es
precision highp float;

uniform sampler2D u_source;

in vec2 vUV;
out vec4 fragColor;

void main() {
  fragColor = texture(u_source, vUV);
}
