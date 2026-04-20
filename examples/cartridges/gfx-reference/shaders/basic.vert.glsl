#version 300 es
// GFX Reference — vertex shader.
//
// GLSL ES 3.00 paired with WebGL 2.0 and OpenGL ES 3.0. Full shader
// language reference at /Research/GFX/M2-glsl.html on tibsfox.com.
//
// Consumes a 2D clip-space position from attribute location 0 and
// forwards a normalised UV coordinate to the fragment shader. The
// homogeneous `gl_Position` output is mandatory for every vertex
// shader in WebGL 2 (Khronos OGL Wiki — Shader).

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
    // [-1, 1] clip space → [0, 1] UV space.
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
