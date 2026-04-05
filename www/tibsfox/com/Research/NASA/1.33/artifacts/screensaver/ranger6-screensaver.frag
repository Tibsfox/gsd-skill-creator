// Ranger 6 Screensaver — 4-Mode GLSL Fragment Shader
// Mission 1.33 — Ranger 6 (Atlas-Agena B), January 30, 1964
// For XScreenSaver / GSD-OS / ShaderToy
//
// Mode 1: Cedar Cathedral — looking up through western red cedar canopy
// Mode 2: Ranger 6 Transit — spacecraft moving toward Moon, cameras dead
// Mode 3: Paschen Arc — abstract ionization cascade visualization
// Mode 4: Waxwing Flock — silhouettes swarming around a mountain ash
//
// Each mode runs for 30 seconds, cycling continuously.
// Total cycle: 120 seconds.

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265

// Mode selection (30-second cycles)
int getMode() {
    return int(mod(u_time / 30.0, 4.0));
}

// Hash functions for procedural generation
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

// Mode 1: Cedar Cathedral — looking up through flat spray foliage
vec3 cedarCathedral(vec2 uv) {
    // Dark cedar tones
    vec3 sky = vec3(0.4, 0.5, 0.6) * 0.3;
    vec3 cedar = vec3(0.08, 0.15, 0.05);
    vec3 bark = vec3(0.25, 0.15, 0.08);
    
    // Radial trunk from center
    float trunk_dist = length(uv);
    float trunk = smoothstep(0.08, 0.05, trunk_dist);
    
    // Flat spray branches — overlapping layers
    float branches = 0.0;
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float angle = fi * PI / 3.0 + sin(u_time * 0.1 + fi) * 0.1;
        vec2 dir = vec2(cos(angle), sin(angle));
        float proj = dot(uv, dir);
        float perp = abs(dot(uv, vec2(-dir.y, dir.x)));
        float branch = smoothstep(0.02, 0.005, perp) * step(0.0, proj) * step(proj, 0.4 + fi * 0.05);
        // Flat spray foliage along branches
        float spray = noise(uv * 15.0 + fi * 3.0 + u_time * 0.05) * 0.7;
        float foliage = smoothstep(0.08, 0.02, perp - spray * 0.05) * step(0.05, proj);
        branches += max(branch, foliage * 0.6);
    }
    branches = clamp(branches, 0.0, 1.0);
    
    // Light filtering through gaps
    float light = noise(uv * 8.0 + u_time * 0.02) * 0.3 + 0.2;
    light *= (1.0 - branches);
    
    // Rain drops
    float rain = step(0.998, hash(uv * 100.0 + floor(u_time * 10.0)));
    
    vec3 col = mix(sky + light * vec3(0.2, 0.3, 0.1), cedar, branches);
    col = mix(col, bark, trunk);
    col += rain * vec3(0.3, 0.4, 0.5);
    
    return col;
}

// Mode 2: Ranger 6 Transit — spacecraft approaching Moon
vec3 rangerTransit(vec2 uv) {
    float t = mod(u_time, 30.0);
    vec3 col = vec3(0.01, 0.01, 0.02); // deep space
    
    // Stars
    float stars = step(0.997, hash(floor(uv * 200.0)));
    col += stars * vec3(0.8, 0.9, 1.0) * 0.5;
    
    // Moon growing as spacecraft approaches
    float moon_size = 0.05 + t * 0.015;
    vec2 moon_pos = vec2(0.3, 0.2);
    float moon_dist = length(uv - moon_pos);
    float moon = smoothstep(moon_size + 0.005, moon_size - 0.005, moon_dist);
    vec3 moon_color = vec3(0.7, 0.7, 0.65);
    // Craters
    float crater = smoothstep(0.02, 0.01, length(uv - moon_pos - vec2(0.02, 0.01)));
    moon_color -= crater * 0.15;
    col = mix(col, moon_color, moon);
    
    // Spacecraft (small dot moving toward Moon)
    float sc_x = -0.3 + t * 0.02;
    float sc_y = -0.1 + t * 0.01;
    vec2 sc_pos = vec2(sc_x, sc_y);
    float sc = smoothstep(0.008, 0.003, length(uv - sc_pos));
    
    // Camera status indicator — RED after T+107s equivalent
    float cam_dead = step(2.0, t); // cameras die early in the animation
    vec3 sc_color = mix(vec3(0.2, 0.8, 0.2), vec3(0.8, 0.1, 0.1), cam_dead);
    col = mix(col, sc_color, sc);
    
    // RED flash at camera death
    if (t > 1.8 && t < 2.2) {
        col += vec3(0.5, 0.0, 0.0) * (1.0 - abs(t - 2.0) * 5.0);
    }
    
    // "CAMERAS DEAD" text area (simplified as red bar)
    if (cam_dead > 0.5 && uv.y > 0.35 && uv.y < 0.38) {
        col = mix(col, vec3(0.5, 0.0, 0.0), 0.3);
    }
    
    return col;
}

// Mode 3: Paschen Arc — abstract ionization cascade
vec3 paschenArc(vec2 uv) {
    float t = u_time * 2.0;
    vec3 col = vec3(0.02, 0.01, 0.03);
    
    // Electric field lines
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float y = (fi - 2.0) * 0.15;
        float wave = sin(uv.x * 20.0 + t + fi * 1.5) * 0.02;
        float line = smoothstep(0.003, 0.001, abs(uv.y - y - wave));
        col += line * vec3(0.1, 0.1, 0.3);
    }
    
    // Arc branches — random branching lightning
    float arc_time = mod(t, 3.0);
    if (arc_time < 0.5) {
        float arc_y = noise(vec2(uv.x * 30.0 + t * 5.0, t)) * 0.3 - 0.15;
        float arc = smoothstep(0.01, 0.002, abs(uv.y - arc_y));
        float branch = noise(vec2(uv.x * 50.0, uv.y * 50.0 + t * 10.0));
        arc *= step(0.3, branch);
        col += arc * vec3(0.6, 0.3, 1.0); // purple arc
        col += arc * vec3(1.0, 1.0, 1.0) * 0.3; // white core
    }
    
    // Pressure gradient background
    float pressure = smoothstep(-0.5, 0.5, uv.x);
    col += vec3(0.0, pressure * 0.05, pressure * 0.08);
    
    // Electrode plates at edges
    float left_plate = smoothstep(-0.48, -0.49, uv.x) * smoothstep(-0.3, 0.3, abs(uv.y));
    float right_plate = smoothstep(0.48, 0.49, uv.x) * smoothstep(-0.3, 0.3, abs(uv.y));
    col = mix(col, vec3(0.4, 0.4, 0.45), left_plate + right_plate);
    
    return col;
}

// Mode 4: Waxwing Flock — silhouettes around a tree
vec3 waxwingFlock(vec2 uv) {
    float t = u_time;
    vec3 col = vec3(0.35, 0.45, 0.55); // winter sky
    
    // Mountain ash tree (simplified trunk + branches)
    float trunk = smoothstep(0.02, 0.01, abs(uv.x + 0.1)) * step(-0.3, uv.y) * step(uv.y, 0.1);
    col = mix(col, vec3(0.2, 0.15, 0.1), trunk);
    
    // Berry clusters (orange-red dots)
    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        vec2 berry_pos = vec2(-0.1 + hash(vec2(fi, 0.0)) * 0.3 - 0.15,
                              -0.1 + hash(vec2(fi, 1.0)) * 0.3);
        float berry = smoothstep(0.015, 0.008, length(uv - berry_pos));
        col = mix(col, vec3(0.8, 0.2, 0.1), berry);
    }
    
    // Waxwing silhouettes — small birds circling
    for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float angle = fi * PI / 6.0 + t * (0.3 + fi * 0.05);
        float radius = 0.15 + sin(t * 0.5 + fi) * 0.08;
        vec2 bird_pos = vec2(-0.1 + cos(angle) * radius,
                              0.0 + sin(angle) * radius * 0.6);
        float bird = smoothstep(0.012, 0.005, length(uv - bird_pos));
        // Wing shape
        float wing = smoothstep(0.02, 0.01, abs(uv.y - bird_pos.y + 0.003))
                   * smoothstep(0.008, 0.002, abs(uv.x - bird_pos.x));
        col = mix(col, vec3(0.1, 0.08, 0.06), max(bird, wing * 0.5));
    }
    
    return col;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    int mode = getMode();
    vec3 col;
    
    if (mode == 0) col = cedarCathedral(uv);
    else if (mode == 1) col = rangerTransit(uv);
    else if (mode == 2) col = paschenArc(uv);
    else col = waxwingFlock(uv);
    
    // Mode transition fade
    float phase = mod(u_time, 30.0);
    float fade = smoothstep(0.0, 1.0, phase) * smoothstep(30.0, 29.0, phase);
    col *= fade;
    
    gl_FragColor = vec4(col, 1.0);
}
