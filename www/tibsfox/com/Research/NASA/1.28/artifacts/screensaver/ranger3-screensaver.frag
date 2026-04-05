// ranger3-screensaver.frag
// GLSL Fragment Shader — 4-Mode Screensaver for Mission 1.28 (Ranger 3)
// XScreenSaver / GSD-OS compatible
//
// Mode 1: Lace lichen in fog — pendant strands with drifting fog particles
// Mode 2: Ranger 3 flyby — spacecraft trajectory past the Moon, 36,793 km gap
// Mode 3: Sign inversion feedback — converging (green) vs diverging (red) spirals
// Mode 4: Violet-green Swallow pursuit — real-time trajectory corrections
//
// Hardware target: RTX 4060 Ti, 1920x1080, 60fps
// Cycle time: 30s per mode, 120s total loop

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265359
#define TAU 6.28318530718

// ==========================================
// Utility functions
// ==========================================

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

// ==========================================
// Mode 1: Lace Lichen in Fog
// ==========================================

vec3 lichenFog(vec2 uv) {
    // Fog background — drifting gray-white
    float fog = fbm(uv * 3.0 + vec2(u_time * 0.05, u_time * 0.02));
    vec3 fogColor = mix(vec3(0.04, 0.05, 0.06), vec3(0.25, 0.28, 0.30), fog * 0.7);

    // Lichen strands — pendant yellow-green filaments
    float strand = 0.0;
    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float x = 0.15 + fi * 0.1 + sin(u_time * 0.3 + fi) * 0.02;
        float width = 0.003 + 0.001 * sin(uv.y * 20.0 + fi * 3.0);
        float d = abs(uv.x - x - sin(uv.y * 8.0 + fi * 2.0 + u_time * 0.5) * 0.015);
        strand += smoothstep(width, 0.0, d) * (0.3 + 0.7 * uv.y);
    }
    vec3 lichenColor = vec3(0.66, 0.72, 0.44); // pale yellow-green
    vec3 col = mix(fogColor, lichenColor, strand * 0.8);

    // Fog droplets — small bright points drifting
    for (int i = 0; i < 20; i++) {
        float fi = float(i);
        vec2 dp = vec2(hash(vec2(fi, 0.0)), fract(hash(vec2(fi, 1.0)) + u_time * 0.02 * (0.5 + hash(vec2(fi, 2.0)))));
        float droplet = smoothstep(0.005, 0.0, length(uv - dp));
        col += vec3(0.6, 0.7, 0.8) * droplet * 0.5;
    }

    return col;
}

// ==========================================
// Mode 2: Ranger 3 Flyby
// ==========================================

vec3 rangerFlyby(vec2 uv) {
    vec3 col = vec3(0.01, 0.01, 0.03); // deep space

    // Stars
    for (int i = 0; i < 40; i++) {
        vec2 sp = vec2(hash(vec2(float(i), 0.0)), hash(vec2(float(i), 1.0)));
        float star = smoothstep(0.003, 0.0, length(uv - sp));
        col += vec3(0.8, 0.85, 1.0) * star * (0.3 + 0.7 * hash(vec2(float(i), 3.0)));
    }

    // Moon — right side of screen
    vec2 moonCenter = vec2(0.7, 0.5);
    float moonR = 0.08;
    float moonD = length(uv - moonCenter);
    if (moonD < moonR) {
        float limb = smoothstep(moonR, moonR - 0.005, moonD);
        float crater = noise(uv * 40.0) * 0.3;
        col = mix(col, vec3(0.5 + crater, 0.48 + crater, 0.45 + crater), limb);
    }

    // Planned trajectory — green dashed line curving toward moon
    float planned_t = fract(u_time * 0.1);
    vec2 planned_pos = vec2(0.1 + planned_t * 0.6, 0.5 + sin(planned_t * PI) * 0.15);
    float planned_d = length(uv - planned_pos);
    if (planned_t < 1.0) {
        col += vec3(0.2, 0.6, 0.2) * smoothstep(0.004, 0.0, planned_d) * step(0.5, fract(planned_t * 10.0));
    }

    // Actual trajectory — red line curving PAST moon (above it)
    float actual_t = fract(u_time * 0.1);
    vec2 actual_pos = vec2(0.1 + actual_t * 0.85, 0.5 + sin(actual_t * PI * 0.8) * 0.25);
    float actual_d = length(uv - actual_pos);
    col += vec3(0.7, 0.15, 0.1) * smoothstep(0.003, 0.0, actual_d);

    // Gap annotation at closest approach
    float gap_x = 0.72;
    if (abs(uv.x - gap_x) < 0.001 && uv.y > 0.5 + moonR && uv.y < 0.5 + 0.25) {
        col += vec3(0.8, 0.3, 0.2) * 0.5; // vertical line showing gap
    }

    return col;
}

// ==========================================
// Mode 3: Sign Inversion Feedback
// ==========================================

vec3 signInversion(vec2 uv) {
    vec2 center = vec2(0.5, 0.5);
    vec2 p = uv - center;
    float r = length(p);
    float a = atan(p.y, p.x);

    // Converging spiral (negative feedback) — green, left half
    float conv = 0.0;
    if (uv.x < 0.5) {
        float spiral_r = 0.4 * exp(-u_time * 0.3); // shrinking
        float spiral = sin(a * 3.0 + r * 20.0 - u_time * 2.0);
        conv = smoothstep(0.0, 0.3, spiral) * smoothstep(0.4, 0.0, r) * exp(-u_time * 0.2);
    }

    // Diverging spiral (positive feedback) — red, right half
    float div = 0.0;
    if (uv.x >= 0.5) {
        float spiral = sin(a * 3.0 + r * 20.0 + u_time * 2.0);
        div = smoothstep(0.0, 0.3, spiral) * smoothstep(0.0, 0.5, r * (1.0 + u_time * 0.1));
    }

    vec3 col = vec3(0.02);
    col += vec3(0.1, 0.5, 0.15) * conv;  // green convergence
    col += vec3(0.6, 0.1, 0.08) * div;   // red divergence

    // Center dividing line
    col += vec3(0.3) * smoothstep(0.002, 0.0, abs(uv.x - 0.5));

    return col;
}

// ==========================================
// Mode 4: Violet-green Swallow Pursuit
// ==========================================

vec3 swallowPursuit(vec2 uv) {
    vec3 col = vec3(0.35, 0.55, 0.75); // sky blue

    // Insect — small dark point, erratic movement
    float t = u_time * 1.5;
    vec2 insect = vec2(0.5 + 0.3 * sin(t * 0.7) * cos(t * 0.3),
                       0.5 + 0.2 * cos(t * 0.9) * sin(t * 0.5));
    float insectD = length(uv - insect);
    col -= vec3(0.3) * smoothstep(0.005, 0.0, insectD);

    // Swallow — pursuit curve chasing insect with delay
    float delay = 0.3;
    float t2 = t - delay;
    vec2 swallow = vec2(0.5 + 0.3 * sin(t2 * 0.7) * cos(t2 * 0.3),
                        0.5 + 0.2 * cos(t2 * 0.9) * sin(t2 * 0.5));
    // Add pursuit correction offset
    vec2 correction = normalize(insect - swallow) * 0.03;
    swallow += correction;

    float swallowD = length(uv - swallow);

    // Swallow body — iridescent green-violet
    if (swallowD < 0.015) {
        float irid = 0.5 + 0.5 * sin(atan(uv.y - swallow.y, uv.x - swallow.x) * 3.0);
        col = mix(vec3(0.1, 0.4, 0.15), vec3(0.3, 0.1, 0.4), irid); // green to violet
    }

    // Trail — fading pursuit path
    for (int i = 1; i < 15; i++) {
        float fi = float(i);
        float t3 = t - delay - fi * 0.05;
        vec2 trail = vec2(0.5 + 0.3 * sin(t3 * 0.7) * cos(t3 * 0.3),
                          0.5 + 0.2 * cos(t3 * 0.9) * sin(t3 * 0.5));
        float td = length(uv - trail);
        col = mix(col, vec3(0.2, 0.5, 0.3), smoothstep(0.003, 0.0, td) * (1.0 - fi / 15.0) * 0.3);
    }

    return col;
}

// ==========================================
// Main — mode cycling
// ==========================================

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    float cycleTime = 30.0; // seconds per mode
    float totalCycle = cycleTime * 4.0;
    float phase = mod(u_time, totalCycle);
    int mode = int(phase / cycleTime);

    vec3 col;
    if (mode == 0) {
        col = lichenFog(uv);
    } else if (mode == 1) {
        col = rangerFlyby(uv);
    } else if (mode == 2) {
        col = signInversion(uv);
    } else {
        col = swallowPursuit(uv);
    }

    // Mode transition fade
    float fadeTime = 1.5;
    float modeProgress = mod(phase, cycleTime);
    float fade = smoothstep(0.0, fadeTime, modeProgress) * smoothstep(cycleTime, cycleTime - fadeTime, modeProgress);
    col *= fade;

    gl_FragColor = vec4(col, 1.0);
}
