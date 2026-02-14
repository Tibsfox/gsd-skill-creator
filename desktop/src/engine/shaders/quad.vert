#version 300 es

layout(location = 0) in vec2 aPosition;

out vec2 vUV;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUV = aPosition * 0.5 + 0.5;
}
