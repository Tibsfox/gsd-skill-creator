// aurora7-screensaver.frag
// GLSL Fragment Shader: Aurora 7 / Devil's Club — 4-Mode Screensaver
// Mission 1.23 — Mercury-Atlas 7 / The Cost of Curiosity
//
// Mode 1: Devil's Club Growth — L-system spine distribution, fractal defense
// Mode 2: Firefly Particles — ice crystals sublimating at orbital dawn
// Mode 3: Retrofire Error — cos(θ) vector decomposition visualization
// Mode 4: Flicker Drumming — 25 Hz rhythmic pulse on resonant surface
//
// Uniforms:
//   u_time: elapsed time (seconds)
//   u_resolution: viewport resolution
//   u_mode: screensaver mode (0-3, cycles automatically)
//   u_mouse: optional mouse position for interaction
//
// Compatible with: XScreenSaver, GSD-OS, ShaderToy, GLSL Sandbox
// Target: 60fps on RTX 4060 Ti at 1080p

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

// === UTILITY FUNCTIONS ===
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

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

// === MODE 1: DEVIL'S CLUB GROWTH ===
// L-system inspired spine pattern growing from center
vec3 devilsClub(vec2 uv, float t) {
    vec3 col = vec3(0.04, 0.08, 0.04); // Dark forest floor

    // Main stem
    float stem = smoothstep(0.02, 0.0, abs(uv.x)) * step(uv.y, 0.3 + 0.2 * sin(t * 0.3));

    // Spines along stem (periodic, hierarchical)
    float spineScale = 0.15;
    for (int i = 0; i < 20; i++) {
        float y = float(i) * 0.03 - 0.1;
        if (uv.y > y - 0.01 && uv.y < y + 0.01) {
            float side = (mod(float(i), 2.0) < 1.0) ? 1.0 : -1.0;
            float spineLen = spineScale * (0.5 + 0.5 * hash(vec2(float(i), 0.0)));
            float spineLine = smoothstep(0.003, 0.0,
                abs(uv.y - y - (uv.x - side * 0.01) * 0.3) *
                step(0.0, side * (uv.x - 0.01)) *
                step(side * uv.x, spineLen));
            col += vec3(0.6, 0.4, 0.15) * spineLine; // Thorn color
        }
    }

    // Leaf (large, palmate)
    float leafDist = length(uv - vec2(0.15, 0.2 + 0.05 * sin(t * 0.5)));
    float leaf = smoothstep(0.12, 0.08, leafDist);
    col = mix(col, vec3(0.1, 0.4, 0.1), leaf * 0.6);

    // Stem color
    col += vec3(0.25, 0.15, 0.05) * stem;

    return col;
}

// === MODE 2: FIREFLY PARTICLES ===
// Ice crystals sublimating at orbital dawn
vec3 fireflyParticles(vec2 uv, float t) {
    vec3 col = vec3(0.0);

    // Orbital dawn gradient (left = night, right = day)
    float dawn = smoothstep(-0.3, 0.3, uv.x + sin(t * 0.1) * 0.5);
    col = mix(vec3(0.01, 0.01, 0.03), vec3(0.05, 0.08, 0.15), dawn);

    // Earth curve at bottom
    float earthCurve = -0.3 + 0.1 * (uv.x * uv.x);
    if (uv.y < earthCurve) {
        col = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.15, 0.1), uv.x + 0.5);
    }
    // Atmosphere glow
    float atmo = smoothstep(0.02, 0.0, uv.y - earthCurve) * dawn;
    col += vec3(0.1, 0.2, 0.5) * atmo;

    // Firefly particles — drifting ice crystals
    for (int i = 0; i < 50; i++) {
        float fi = float(i);
        vec2 particlePos = vec2(
            hash(vec2(fi, 1.0)) - 0.5 + sin(t * 0.2 + fi) * 0.1,
            hash(vec2(fi, 2.0)) - 0.5 + cos(t * 0.15 + fi * 0.7) * 0.1
        );
        particlePos += vec2(t * 0.02, t * 0.01); // Drift
        particlePos = fract(particlePos + 0.5) - 0.5; // Wrap

        float dist = length(uv - particlePos);
        float brightness = dawn * smoothstep(0.015, 0.003, dist);
        float shimmer = 0.5 + 0.5 * sin(t * 3.0 + fi * 2.0);
        col += vec3(0.9, 0.85, 0.6) * brightness * shimmer * 0.3;
    }

    return col;
}

// === MODE 3: RETROFIRE ERROR VISUALIZATION ===
// cos(θ) vector decomposition — the math of 402 km
vec3 retrofireError(vec2 uv, float t) {
    vec3 col = vec3(0.02, 0.02, 0.05);

    // Yaw angle oscillates to show the effect
    float theta = 25.0 * (0.5 + 0.5 * sin(t * 0.3)); // 0 to 25 degrees
    float thetaRad = theta * 3.14159 / 180.0;

    // Planned retrofire vector (pointing left = retrograde)
    vec2 planned = vec2(-0.3, 0.0);
    // Actual retrofire vector (rotated by theta)
    vec2 actual = vec2(-0.3 * cos(thetaRad), 0.3 * sin(thetaRad));
    // Retrograde component
    vec2 retroComp = vec2(actual.x, 0.0);
    // Cross-range component
    vec2 crossComp = vec2(0.0, actual.y);

    // Draw vectors from center
    vec2 center = vec2(0.0, 0.0);

    // Planned vector (green)
    float plannedLine = smoothstep(0.004, 0.0,
        abs(uv.y - center.y) * step(uv.x, center.x) * step(center.x + planned.x, uv.x));
    col += vec3(0.0, 0.8, 0.0) * plannedLine;

    // Actual vector (yellow)
    float t2 = dot(uv - center, normalize(actual)) / length(actual);
    float actualDist = length(uv - center - actual * clamp(t2, 0.0, 1.0));
    col += vec3(0.9, 0.7, 0.0) * smoothstep(0.005, 0.0, actualDist) *
           step(0.0, t2) * step(t2, 1.0);

    // cos(θ) readout area
    if (uv.y < -0.35) {
        col = vec3(0.05, 0.05, 0.1);
    }

    // Overshoot indicator (red bar at bottom proportional to theta)
    float overshoot = 25.0 * 152.0 * (1.0 - cos(thetaRad));
    float barWidth = overshoot / 1000.0; // Scale
    if (uv.y > -0.45 && uv.y < -0.4 && uv.x > -0.5 && uv.x < -0.5 + barWidth) {
        col = vec3(0.9, 0.2, 0.1);
    }

    return col;
}

// === MODE 4: FLICKER DRUMMING RHYTHM ===
// 25 Hz visual pulse — concentric rings expanding from center
vec3 flickerDrumming(vec2 uv, float t) {
    vec3 col = vec3(0.05, 0.03, 0.02); // Bark background

    float drumRate = 25.0;
    float phase = fract(t * drumRate);

    // Each drum strike creates an expanding ring
    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float ringTime = fract(t * drumRate - fi * 0.125);
        float ringRadius = ringTime * 0.5;
        float ringWidth = 0.01 + ringTime * 0.02;
        float dist = length(uv);
        float ring = smoothstep(ringWidth, 0.0, abs(dist - ringRadius));
        float fade = 1.0 - ringTime;
        col += vec3(0.8, 0.4, 0.1) * ring * fade * 0.3;
    }

    // Center impact point
    float impact = smoothstep(0.02, 0.0, length(uv)) * (0.5 + 0.5 * sin(t * drumRate * 6.283));
    col += vec3(1.0, 0.6, 0.2) * impact * 0.5;

    return col;
}

// === MAIN ===
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
    float t = u_time;

    // Auto-cycle modes every 20 seconds
    int mode = int(mod(t / 20.0, 4.0));

    vec3 col;
    if (mode == 0) col = devilsClub(uv, t);
    else if (mode == 1) col = fireflyParticles(uv, t);
    else if (mode == 2) col = retrofireError(uv, t);
    else col = flickerDrumming(uv, t);

    // Mode transition fade
    float transPhase = fract(t / 20.0);
    float fade = smoothstep(0.95, 1.0, transPhase) + smoothstep(0.05, 0.0, transPhase);
    col *= (1.0 - fade * 0.5);

    gl_FragColor = vec4(col, 1.0);
}
