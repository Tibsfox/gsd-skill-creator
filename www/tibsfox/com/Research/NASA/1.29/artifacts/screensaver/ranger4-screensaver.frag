// ranger4-screensaver.frag
// GLSL Fragment Shader — Ranger 4 Mission Visualization
// Mission 1.29 — NASA Mission Series
//
// Four modes cycling every 30 seconds:
//   Mode 0: Bracken fern crozier uncoiling (fractal fiddlehead)
//   Mode 1: Ranger 4 trajectory (Earth to Moon, carrier signal thread)
//   Mode 2: Far-side impact (expanding crater, silence visualization)
//   Mode 3: Tree Swallow in flight (iridescent swooping arcs)
//
// XScreenSaver / GSD-OS compatible
// Resolution-independent, time-based animation

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define PI 3.14159265359
#define TAU 6.28318530718

// Mode selection: 30-second cycles
float mode_time = mod(time, 120.0);
int mode = int(mode_time / 30.0);
float mt = mod(mode_time, 30.0); // time within mode

// Utility: distance field for a circle
float circle(vec2 p, float r) {
    return length(p) - r;
}

// Utility: smooth step
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Mode 0: Bracken crozier — spiral uncoiling
vec3 mode_bracken(vec2 uv, float t) {
    vec2 center = vec2(0.0, -0.2);
    vec2 p = uv - center;
    
    // Spiral parameters — uncoiling over time
    float uncoil = smoothstep(0.0, 25.0, t); // 0 = tight spiral, 1 = open
    float spiralTightness = mix(4.0, 1.5, uncoil);
    
    // Convert to polar
    float angle = atan(p.y, p.x);
    float radius = length(p);
    
    // Spiral distance field
    float spiral_r = (angle + PI) / TAU * 0.3 + 0.05;
    for (int i = 0; i < 5; i++) {
        spiral_r += 0.3;
        float d = abs(radius - spiral_r * (1.0 - uncoil * 0.3));
        if (d < 0.015) {
            float green = 0.3 + 0.4 * sin(float(i) * 1.5 + t * 0.5);
            return vec3(0.05, green, 0.02);
        }
    }
    
    // Fiddlehead hairs (small details)
    float hair = sin(angle * 20.0 + radius * 50.0 + t) * 0.5 + 0.5;
    if (radius < 0.4 && hair > 0.95) {
        return vec3(0.3, 0.25, 0.1); // tawny hair color
    }
    
    // Background: dark forest floor
    return vec3(0.02, 0.04, 0.02);
}

// Mode 1: Ranger 4 trajectory
vec3 mode_trajectory(vec2 uv, float t) {
    // Earth (blue circle, left side)
    vec2 earth_pos = vec2(-0.5, 0.0);
    float earth_r = 0.08;
    float d_earth = circle(uv - earth_pos, earth_r);
    
    // Moon (gray circle, right side)
    vec2 moon_pos = vec2(0.5, 0.1);
    float moon_r = 0.03;
    float d_moon = circle(uv - moon_pos, moon_r);
    
    // Trajectory arc (bezier-like curve)
    float progress = smoothstep(0.0, 25.0, t);
    vec2 ctrl = vec2(0.0, 0.4); // control point above
    
    // Draw trajectory as series of dots
    float trail = 0.0;
    for (int i = 0; i < 50; i++) {
        float s = float(i) / 50.0;
        if (s > progress) break;
        vec2 p1 = mix(earth_pos, ctrl, s);
        vec2 p2 = mix(ctrl, moon_pos, s);
        vec2 pos = mix(p1, p2, s);
        float d = length(uv - pos);
        // Gray trail (dead spacecraft)
        trail += smoothstep(0.005, 0.002, d) * mix(0.3, 0.1, s);
    }
    
    // Carrier signal: thin blue line from spacecraft to earth
    float carrier_alpha = 0.0;
    if (progress > 0.1) {
        vec2 sc_pos = mix(mix(earth_pos, ctrl, progress), 
                          mix(ctrl, moon_pos, progress), progress);
        // Line from sc_pos to earth_pos
        vec2 line_dir = normalize(earth_pos - sc_pos);
        vec2 to_point = uv - sc_pos;
        float along = dot(to_point, line_dir);
        float perp = length(to_point - line_dir * along);
        if (along > 0.0 && along < length(earth_pos - sc_pos)) {
            carrier_alpha = smoothstep(0.003, 0.001, perp) * 0.3;
        }
    }
    
    vec3 col = vec3(0.01, 0.01, 0.03); // deep space
    
    // Earth
    if (d_earth < 0.0) col = vec3(0.1, 0.3, 0.7);
    
    // Moon
    if (d_moon < 0.0) col = vec3(0.5, 0.5, 0.5);
    
    // Trail
    col += vec3(trail * 0.4, trail * 0.4, trail * 0.3);
    
    // Carrier signal (blue thread)
    col += vec3(0.0, 0.1, 0.4) * carrier_alpha;
    
    // Impact flash
    if (progress > 0.98) {
        float flash = (1.0 - smoothstep(0.98, 1.0, progress)) * 2.0;
        float d_impact = length(uv - moon_pos);
        col += vec3(1.0, 0.9, 0.7) * flash * smoothstep(0.1, 0.0, d_impact);
    }
    
    return col;
}

// Mode 2: Far-side impact
vec3 mode_impact(vec2 uv, float t) {
    // Gray lunar surface
    vec3 surface = vec3(0.15, 0.15, 0.14);
    
    // Add subtle crater texture
    float noise = sin(uv.x * 30.0 + uv.y * 25.0) * 
                  cos(uv.x * 15.0 - uv.y * 35.0) * 0.03;
    surface += noise;
    
    // Impact crater expanding
    float crater_r = smoothstep(0.0, 5.0, t) * 0.15;
    float d_crater = length(uv);
    
    if (d_crater < crater_r) {
        float depth = 1.0 - d_crater / crater_r;
        surface = mix(surface, vec3(0.05, 0.05, 0.04), depth * 0.7);
    }
    
    // Crater rim
    if (abs(d_crater - crater_r) < 0.01 && crater_r > 0.01) {
        surface = vec3(0.25, 0.25, 0.23);
    }
    
    // Ejecta rays
    float angle = atan(uv.y, uv.x);
    float ray = abs(sin(angle * 6.0)) * smoothstep(crater_r, crater_r + 0.2, d_crater);
    ray *= smoothstep(crater_r + 0.3, crater_r, d_crater);
    surface += ray * 0.05 * smoothstep(0.0, 3.0, t);
    
    // No signal visualization: the absence of waves
    // (the art is in what is NOT here)
    
    // Text area: "NO DATA" fading in
    // (handled by screensaver overlay, not shader)
    
    return surface;
}

// Mode 3: Tree Swallow flight
vec3 mode_swallow(vec2 uv, float t) {
    vec3 sky = mix(vec3(0.1, 0.15, 0.3), vec3(0.02, 0.05, 0.15), uv.y + 0.5);
    
    // Swooping arcs — multiple swallows
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float phase = fi * TAU / 3.0 + t * 0.8;
        float x = sin(phase) * 0.6 + cos(phase * 0.7 + fi) * 0.2;
        float y = cos(phase * 1.3 + fi * 2.0) * 0.3;
        
        vec2 bird_pos = vec2(x, y);
        float d = length(uv - bird_pos);
        
        // Bird body (small triangle-ish)
        if (d < 0.02) {
            // Iridescent blue-green: color shifts with angle
            float iridescence = sin(atan(uv.y - y, uv.x - x) * 3.0 + t * 2.0);
            vec3 bird_col = mix(vec3(0.0, 0.3, 0.5), vec3(0.0, 0.5, 0.3), 
                               iridescence * 0.5 + 0.5);
            sky = bird_col;
        }
        
        // Wing spread
        float wing_spread = 0.04;
        vec2 wing_dir = vec2(cos(phase * 0.8), sin(phase * 1.3 + fi));
        float wing_d = abs(dot(uv - bird_pos, vec2(-wing_dir.y, wing_dir.x)));
        float wing_along = dot(uv - bird_pos, wing_dir);
        if (wing_d < 0.005 && abs(wing_along) < wing_spread) {
            sky = vec3(0.0, 0.2, 0.35);
        }
    }
    
    // Subtle insect dots (what they're catching)
    float insects = step(0.998, sin(uv.x * 200.0 + t * 3.0) * 
                                 cos(uv.y * 150.0 - t * 2.0));
    sky += insects * 0.1;
    
    return sky;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - resolution * 0.5) / min(resolution.x, resolution.y);
    
    float mt_local = mod(mode_time, 30.0);
    int current_mode = int(mode_time / 30.0);
    
    vec3 color;
    if (current_mode == 0) {
        color = mode_bracken(uv, mt_local);
    } else if (current_mode == 1) {
        color = mode_trajectory(uv, mt_local);
    } else if (current_mode == 2) {
        color = mode_impact(uv, mt_local);
    } else {
        color = mode_swallow(uv, mt_local);
    }
    
    // Mode transition fade
    float fade_in = smoothstep(0.0, 1.0, mt_local);
    float fade_out = smoothstep(30.0, 29.0, mt_local);
    color *= fade_in * fade_out;
    
    gl_FragColor = vec4(color, 1.0);
}
