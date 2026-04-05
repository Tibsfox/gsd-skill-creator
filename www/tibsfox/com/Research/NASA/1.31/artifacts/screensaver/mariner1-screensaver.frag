// mariner1-screensaver.frag — 4-Mode GLSL Screensaver
// Mission 1.31: Mariner 1 (Atlas-Agena B) — Destroyed T+293s
// Modes: Barn Swallow flight | Mariner 1 destruct | Mariner 2 launch | Venus approach
// XScreenSaver / GSD-OS compatible

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265359

// Cycle through 4 modes, 15 seconds each
float mode_time = mod(u_time, 60.0);
int mode = int(mode_time / 15.0);
float t = mod(mode_time, 15.0) / 15.0;  // 0-1 within mode

// Hash function for procedural randomness
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Barn Swallow silhouette (forked tail)
float swallow(vec2 uv, vec2 pos, float scale) {
    vec2 p = (uv - pos) / scale;
    // Body
    float body = smoothstep(0.15, 0.0, length(p));
    // Wings
    float wing_l = smoothstep(0.08, 0.0, length(p - vec2(-0.2, 0.05)));
    float wing_r = smoothstep(0.08, 0.0, length(p - vec2(0.2, 0.05)));
    // Forked tail
    float tail_l = smoothstep(0.04, 0.0, length(p - vec2(-0.08, -0.18)));
    float tail_r = smoothstep(0.04, 0.0, length(p - vec2(0.08, -0.18)));
    return body + wing_l + wing_r + tail_l + tail_r;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 center = uv - 0.5;
    vec3 col = vec3(0.0);

    if (mode == 0) {
        // Mode 1: Barn Swallow aerial pursuit
        // Dusk sky background
        col = mix(vec3(0.05, 0.08, 0.15), vec3(0.3, 0.15, 0.1), uv.y);

        // Swallow flying (sinusoidal path)
        float sx = 0.3 + 0.3 * sin(u_time * 1.5);
        float sy = 0.5 + 0.15 * cos(u_time * 2.3);
        float s = swallow(uv, vec2(sx, sy), 0.12);
        col += vec3(0.1, 0.15, 0.3) * s;

        // Second swallow (companion)
        float sx2 = 0.6 + 0.2 * sin(u_time * 1.8 + 1.0);
        float sy2 = 0.6 + 0.1 * cos(u_time * 2.0 + 0.5);
        float s2 = swallow(uv, vec2(sx2, sy2), 0.08);
        col += vec3(0.1, 0.12, 0.25) * s2;

        // Insects (tiny dots)
        for (int i = 0; i < 8; i++) {
            float fi = float(i);
            vec2 ip = vec2(hash(vec2(fi, 0.0)) + sin(u_time * (1.0 + fi * 0.3)) * 0.05,
                          hash(vec2(0.0, fi)) + cos(u_time * (0.8 + fi * 0.2)) * 0.03);
            float insect = smoothstep(0.003, 0.0, length(uv - ip));
            col += vec3(0.5) * insect;
        }

    } else if (mode == 1) {
        // Mode 2: Mariner 1 destruct sequence
        // Dark sky
        col = vec3(0.02, 0.03, 0.06);

        // Stars
        float stars = step(0.998, hash(floor(uv * 200.0)));
        col += vec3(stars * 0.5);

        // Rocket trail (oscillating — guidance error)
        float trail_x = 0.5 + sin(uv.y * 20.0 + u_time * 3.0) * t * 0.15;
        float trail = smoothstep(0.02, 0.0, abs(uv.x - trail_x)) * step(0.1, uv.y) * step(uv.y, 0.5 + t * 0.3);
        col += vec3(1.0, 0.5, 0.1) * trail * (1.0 - t);

        // Explosion at destruct point
        if (t > 0.6) {
            float exp_t = (t - 0.6) / 0.4;
            float exp_r = exp_t * 0.2;
            vec2 exp_center = vec2(0.5, 0.5 + 0.18);
            float explosion = smoothstep(exp_r, exp_r * 0.3, length(uv - exp_center));
            col += vec3(1.0, 0.4, 0.1) * explosion * (1.0 - exp_t);
            // Debris particles
            for (int i = 0; i < 12; i++) {
                float fi = float(i);
                float angle = fi * PI * 2.0 / 12.0;
                vec2 dp = exp_center + vec2(cos(angle), sin(angle)) * exp_t * 0.3 * (0.5 + hash(vec2(fi)));
                float debris = smoothstep(0.005, 0.0, length(uv - dp));
                col += vec3(0.8, 0.3, 0.05) * debris * (1.0 - exp_t);
            }
        }

        // T+293 text overlay (fade in)
        if (t > 0.7) {
            col += vec3(0.5, 0.1, 0.1) * step(0.48, uv.x) * step(uv.x, 0.52) * step(0.45, uv.y) * step(uv.y, 0.46) * (t - 0.7) * 3.0;
        }

    } else if (mode == 2) {
        // Mode 3: Mariner 2 launch (success)
        col = mix(vec3(0.02, 0.04, 0.1), vec3(0.1, 0.15, 0.3), uv.y);

        // Clean rocket trail (no oscillation)
        float trail = smoothstep(0.015, 0.0, abs(uv.x - 0.5)) * step(0.05, uv.y) * step(uv.y, t);
        col += vec3(0.8, 0.9, 1.0) * trail;

        // Exhaust glow
        float glow_y = t * 0.8;
        float glow = smoothstep(0.1, 0.0, length(uv - vec2(0.5, max(0.05, glow_y))));
        col += vec3(1.0, 0.7, 0.3) * glow * 0.5;

        // "36 days later" text indicator
        col += vec3(0.2, 0.5, 0.2) * step(0.47, uv.x) * step(uv.x, 0.53) * step(0.01, uv.y) * step(uv.y, 0.03);

    } else {
        // Mode 4: Venus approach
        // Deep space
        col = vec3(0.01, 0.01, 0.03);
        float stars = step(0.997, hash(floor(uv * 300.0)));
        col += vec3(stars * 0.4);

        // Venus (growing disk)
        float venus_r = 0.05 + t * 0.15;
        vec2 venus_pos = vec2(0.5, 0.5);
        float venus = smoothstep(venus_r, venus_r - 0.01, length(uv - venus_pos));
        // Venus color: pale yellow-white (cloud-covered)
        vec3 venus_col = mix(vec3(0.9, 0.85, 0.7), vec3(0.7, 0.65, 0.5),
                            noise(uv * 10.0 + u_time * 0.1));
        col += venus_col * venus;

        // Subtle atmosphere glow
        float atmo = smoothstep(venus_r + 0.03, venus_r, length(uv - venus_pos));
        col += vec3(0.3, 0.3, 0.2) * atmo * (1.0 - venus);
    }

    gl_FragColor = vec4(col, 1.0);
}
