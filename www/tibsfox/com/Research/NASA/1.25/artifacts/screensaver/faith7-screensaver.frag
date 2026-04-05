// faith7-screensaver.frag
// 4-mode GLSL screensaver for Mission 1.25 -- Mercury-Atlas 9 / Faith 7
//
// Mode 1: Madrone bark exfoliation -- peeling terracotta reveals jade green
// Mode 2: 22-orbit ground track -- sinusoidal trace across Earth projection
// Mode 3: Consumable depletion bars -- five bars depleting over time
// Mode 4: Manual reentry corridor -- 2-degree window visualization
//
// Modes cycle every 30 seconds (2 minutes total loop)
// XScreenSaver / GSD-OS compatible

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

// Perlin noise helper (simplified)
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

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

// Mode 1: Madrone bark exfoliation
vec3 madroneBark(vec2 uv, float t) {
    vec3 terracotta = vec3(0.71, 0.34, 0.22);
    vec3 cream = vec3(0.96, 0.90, 0.78);
    vec3 jade = vec3(0.24, 0.55, 0.22);

    // Bark texture
    float bark_noise = fbm(uv * 6.0 + vec2(0.0, t * 0.05));

    // Peel front (advances over time)
    float peel_front = sin(t * 0.3 + uv.x * 3.0) * 0.3 + uv.y;
    float peel = smoothstep(0.0, 0.15, bark_noise - peel_front * 0.5 + 0.3);

    // Color: jade where peeled, terracotta where intact, cream at edge
    vec3 col = mix(jade, terracotta, peel);
    float edge = smoothstep(0.0, 0.05, abs(bark_noise - peel_front * 0.5 + 0.3));
    col = mix(cream, col, edge);

    return col;
}

// Mode 2: 22-orbit ground track
vec3 groundTrack(vec2 uv, float t) {
    vec3 ocean = vec3(0.04, 0.08, 0.18);
    vec3 land = vec3(0.08, 0.16, 0.06);
    vec3 track_col = vec3(0.96, 0.90, 0.78);

    // Simple continent shapes (noise-based)
    float continent = smoothstep(0.45, 0.55, fbm(uv * 3.0));
    vec3 bg = mix(ocean, land, continent);

    // Orbital ground track: sinusoidal, shifting westward
    float orbit_count = mod(t * 0.5, 22.0);
    float track = 0.0;
    for (float i = 0.0; i < 22.0; i += 1.0) {
        if (i > orbit_count) break;
        float x_offset = i * 0.0614; // 22.1 degrees / 360 in UV
        float y_track = 0.5 + 0.32 * sin((uv.x + x_offset) * 6.283);
        float dist = abs(uv.y - y_track);
        track = max(track, smoothstep(0.01, 0.003, dist) * (i < orbit_count ? 1.0 : 0.5));
    }

    return mix(bg, track_col, track * 0.7);
}

// Mode 3: Consumable bars
vec3 consumableBars(vec2 uv, float t) {
    vec3 bg = vec3(0.05, 0.08, 0.05);
    float mission_frac = mod(t * 0.03, 1.0); // 0-1 over ~33 seconds

    // Five bars
    vec3 colors[5];
    colors[0] = vec3(0.2, 0.4, 0.9);  // battery (blue)
    colors[1] = vec3(0.2, 0.8, 0.3);  // oxygen (green)
    colors[2] = vec3(0.9, 0.2, 0.2);  // CO2 scrubber (red)
    colors[3] = vec3(0.9, 0.5, 0.1);  // H2O2 (orange)
    colors[4] = vec3(0.8, 0.8, 0.8);  // water (white)

    float rates[5];
    rates[0] = 0.43;  // battery: depletes to 57% at mission end
    rates[1] = 0.64;  // oxygen: 36% margin
    rates[2] = 0.76;  // CO2: 24% margin (limiting!)
    rates[3] = 0.57;  // H2O2: 43% margin
    rates[4] = 0.74;  // water: 26% margin

    vec3 col = bg;
    for (int i = 0; i < 5; i++) {
        float y_center = 0.2 + float(i) * 0.15;
        float bar_height = 0.04;
        if (abs(uv.y - y_center) < bar_height) {
            float fill = 1.0 - mission_frac * rates[i];
            if (uv.x < 0.1 + 0.8 * fill) {
                col = colors[i];
                // Flash red when critical (CO2 scrubber at <30%)
                if (i == 2 && fill < 0.3) {
                    col = mix(col, vec3(1.0, 0.0, 0.0), 0.5 * (0.5 + 0.5 * sin(t * 8.0)));
                }
            } else {
                col = vec3(0.15);
            }
        }
    }

    return col;
}

// Mode 4: Reentry corridor
vec3 reentryCorridor(vec2 uv, float t) {
    vec3 bg = vec3(0.02, 0.02, 0.08);
    vec3 corridor_col = vec3(0.24, 0.55, 0.22);
    vec3 danger_col = vec3(0.9, 0.2, 0.2);
    vec3 capsule_col = vec3(0.96, 0.90, 0.78);

    // Corridor band: 2 degrees wide (mapped to screen)
    float corridor_center = 0.5;
    float corridor_width = 0.08; // 2 degrees mapped to UV
    float in_corridor = smoothstep(corridor_width, corridor_width - 0.01,
                                    abs(uv.y - corridor_center));

    vec3 col = mix(danger_col * 0.3, bg, 1.0 - in_corridor * 0.3);
    col = mix(col, corridor_col * 0.2, in_corridor * 0.5);

    // Capsule dot moving along corridor
    float capsule_x = mod(t * 0.15, 1.0);
    float capsule_y = corridor_center + 0.02 * sin(t * 2.0); // slight wobble
    float capsule_dist = length(uv - vec2(capsule_x, capsule_y));
    col = mix(col, capsule_col, smoothstep(0.02, 0.01, capsule_dist));

    // Atmosphere glow at right edge
    float atmo_glow = smoothstep(0.7, 1.0, uv.x) * 0.3;
    col += vec3(0.9, 0.4, 0.1) * atmo_glow;

    return col;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Mode cycling: 30 seconds per mode
    float mode_time = mod(u_time, 120.0);
    int mode = int(mode_time / 30.0);

    vec3 col;
    float local_t = mod(mode_time, 30.0);

    if (mode == 0) {
        col = madroneBark(uv, local_t);
    } else if (mode == 1) {
        col = groundTrack(uv, local_t);
    } else if (mode == 2) {
        col = consumableBars(uv, local_t);
    } else {
        col = reentryCorridor(uv, local_t);
    }

    // Mode transition fade
    float transition = smoothstep(0.0, 1.0, min(local_t / 1.0, (30.0 - local_t) / 1.0));
    col *= transition;

    gl_FragColor = vec4(col, 1.0);
}
