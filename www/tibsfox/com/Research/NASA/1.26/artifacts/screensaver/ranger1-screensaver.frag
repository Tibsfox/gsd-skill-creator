// ranger1-screensaver.frag
// GLSL Fragment Shader — Ranger 1 Orbital Decay Visualization
// Mission 1.26 — NASA Mission Series
//
// Displays Ranger 1's orbit decaying around Earth over 7 days.
// Earth at center, atmosphere ring, orbit shrinking with each pass.
// The spacecraft dot speeds up as the orbit lowers (shorter period).
// When the orbit intersects the atmosphere, flash and restart.
//
// Uniforms:
//   u_time: elapsed time (seconds)
//   u_resolution: viewport size
//
// Designed for XScreenSaver / GSD-OS screensaver pipeline
// Target: 60fps on RTX 4060 Ti at 1080p

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265359
#define TAU 6.28318530718

// Procedural star field
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float stars(vec2 uv) {
    vec2 id = floor(uv * 200.0);
    float h = hash(id);
    vec2 center = (id + 0.5) / 200.0;
    float d = length(uv - center);
    float brightness = smoothstep(0.003, 0.0, d) * step(0.97, h);
    return brightness * (0.5 + 0.5 * sin(u_time * 0.3 + h * TAU));
}

// Smooth circle
float circle(vec2 uv, vec2 center, float radius, float width) {
    float d = length(uv - center);
    return smoothstep(width, 0.0, abs(d - radius));
}

// Filled circle
float disk(vec2 uv, vec2 center, float radius) {
    return smoothstep(radius + 0.002, radius - 0.002, length(uv - center));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
    
    // Time management: 60 seconds = one full 7-day cycle
    float cycle_time = mod(u_time, 65.0); // 60s decay + 5s pause
    float t_norm = clamp(cycle_time / 60.0, 0.0, 1.0); // 0 = launch, 1 = reentry
    
    // Background: deep space
    vec3 col = vec3(0.05, 0.04, 0.03);
    
    // Stars
    col += vec3(0.8, 0.85, 0.9) * stars(uv);
    
    // Earth
    float earth_r = 0.08;
    vec2 center = vec2(0.0);
    
    // Earth glow
    float glow = 1.0 / (1.0 + 80.0 * pow(length(uv - center), 2.0));
    col += vec3(0.02, 0.06, 0.12) * glow;
    
    // Earth disk
    float earth = disk(uv, center, earth_r);
    vec3 earth_col = mix(
        vec3(0.04, 0.15, 0.35),  // ocean
        vec3(0.08, 0.25, 0.08),  // land
        smoothstep(-0.02, 0.02, sin(uv.x * 30.0 + uv.y * 20.0))
    );
    col = mix(col, earth_col, earth);
    
    // Atmosphere ring (reentry boundary)
    float atmo_r = earth_r + 0.005;
    float atmo = circle(uv, center, atmo_r, 0.004);
    col += vec3(0.6, 0.3, 0.15) * atmo * 0.5;
    
    // Orbit radius: decays from 0.25 to atmosphere over the cycle
    // Exponential decay: slow at first, fast at end
    float orbit_r_start = 0.25;
    float orbit_r_end = atmo_r + 0.01;
    
    // Exponential decay profile (slow early, fast late)
    float decay = 1.0 - pow(t_norm, 3.0);
    float orbit_r = mix(orbit_r_end, orbit_r_start, decay);
    
    // Orbit ring (fading trail)
    float orbit_ring = circle(uv, center, orbit_r, 0.003);
    
    // Color based on decay state
    vec3 orbit_color;
    if (t_norm < 0.6) {
        orbit_color = vec3(0.83, 0.66, 0.19); // gold (stable)
    } else if (t_norm < 0.85) {
        orbit_color = vec3(1.0, 0.55, 0.0);   // amber (decaying)
    } else {
        orbit_color = vec3(0.8, 0.2, 0.1);     // red (terminal)
    }
    col += orbit_color * orbit_ring * 0.3;
    
    // Spacecraft dot
    // Angular velocity increases as orbit lowers (Kepler: omega ~ r^-1.5)
    float omega = 2.0 * PI / pow(orbit_r / orbit_r_start, 1.5) * 0.5;
    float angle = u_time * omega;
    vec2 sc_pos = center + orbit_r * vec2(cos(angle), sin(angle));
    
    float sc_dot = smoothstep(0.008, 0.002, length(uv - sc_pos));
    col += orbit_color * sc_dot * 1.5;
    
    // Spacecraft glow
    float sc_glow = 1.0 / (1.0 + 800.0 * pow(length(uv - sc_pos), 2.0));
    col += orbit_color * sc_glow * 0.15;
    
    // Reentry flash
    if (t_norm > 0.95) {
        float flash = (t_norm - 0.95) / 0.05;
        col += vec3(1.0, 0.6, 0.2) * flash * 0.5 * smoothstep(0.05, 0.0, length(uv - sc_pos));
    }
    
    // Day counter (approximate position as text placeholder)
    int day = int(t_norm * 7.0) + 1;
    
    // Fade in/out for cycle restart
    if (cycle_time > 60.0) {
        float fade = (cycle_time - 60.0) / 5.0;
        col *= 1.0 - fade;
    }
    
    gl_FragColor = vec4(col, 1.0);
}
