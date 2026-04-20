#version 300 es
// GFX Reference — fragment shader.
//
// A UV-driven RGB gradient with a soft radial halo computed from a
// signed-distance function evaluated in UV space. Demonstrates that
// the stage is wired and that precision qualifiers + output bindings
// are behaving as expected in GLSL ES 3.00.
//
// See /Research/GFX/M2-glsl.html (precision qualifiers, fragment
// stage) and /Research/GFX/M3-webgl.html (WebGL 2 rendering context).

precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

// Signed distance from the UV centre; negative inside the disk.
float sdfCircle(vec2 uv, vec2 centre, float radius) {
    return length(uv - centre) - radius;
}

void main() {
    vec2 uv = v_uv;

    // Base UV gradient: x → red, y → green, centre → blue.
    vec3 base = vec3(uv.x, uv.y, 0.5);

    // Radial halo: smooth band around a 0.25-radius circle centred on
    // (0.5, 0.5). Contribution rides on top of the UV base.
    float d = sdfCircle(uv, vec2(0.5), 0.25);
    float halo = smoothstep(0.05, 0.0, abs(d));

    fragColor = vec4(base + vec3(halo) * 0.35, 1.0);
}
