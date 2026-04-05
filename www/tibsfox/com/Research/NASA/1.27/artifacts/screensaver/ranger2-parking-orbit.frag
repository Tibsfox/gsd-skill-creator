// ranger2-parking-orbit.frag
// GLSL screensaver: Ranger 2 parking orbit decay
// A bright dot circles a planet, dimming and lowering with each orbit
// until it streaks into the atmosphere and disappears
//
// Uniforms:
//   u_time: elapsed time (seconds)
//   u_resolution: viewport resolution
//
// For XScreenSaver or GSD-OS screensaver framework

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265

// Earth rendering
vec3 earth_color(vec2 uv, float radius) {
    float d = length(uv);
    if (d > radius) return vec3(0.0);
    
    // Simple Earth with atmosphere
    float atmosphere = smoothstep(radius, radius * 0.95, d);
    vec3 surface = mix(vec3(0.05, 0.15, 0.4), vec3(0.1, 0.3, 0.15), 
                       sin(uv.x * 8.0 + uv.y * 5.0) * 0.5 + 0.5);
    vec3 atmo_glow = vec3(0.2, 0.5, 0.9) * (1.0 - atmosphere) * 0.3;
    return surface * atmosphere + atmo_glow;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
    
    // Earth parameters
    float earth_radius = 0.3;
    vec3 col = earth_color(uv, earth_radius);
    
    // Orbit parameters
    float orbit_period = 3.0;  // seconds per orbit
    float total_time = 100.0;  // total animation time
    float t = mod(u_time, total_time);
    
    // Orbit decays over time
    float orbit_radius = earth_radius + 0.15 * (1.0 - t / total_time);
    float angle = t / orbit_period * 2.0 * PI;
    
    // Spacecraft position
    vec2 sc_pos = orbit_radius * vec2(cos(angle), sin(angle));
    float sc_dist = length(uv - sc_pos);
    
    // Spacecraft brightness decays (signal loss)
    float brightness = max(0.0, 1.0 - t / (total_time * 0.7));
    
    // Shadow detection (behind Earth relative to Sun at +x)
    float in_shadow = step(0.0, -sc_pos.x) * step(abs(sc_pos.y), earth_radius);
    brightness *= (1.0 - in_shadow * 0.7);
    
    // Spacecraft rendering
    float sc_glow = 0.003 / (sc_dist * sc_dist + 0.0001);
    vec3 sc_color = mix(vec3(1.0, 0.85, 0.3), vec3(1.0, 0.3, 0.2), t / total_time);
    col += sc_color * sc_glow * brightness;
    
    // Reentry streak at end
    if (t > total_time * 0.9 && orbit_radius < earth_radius + 0.02) {
        float streak = exp(-sc_dist * 50.0) * 0.5;
        col += vec3(1.0, 0.6, 0.2) * streak;
    }
    
    // Orbit trail (fading)
    float trail_dist = abs(length(uv) - orbit_radius);
    float trail = 0.001 / (trail_dist + 0.001);
    col += vec3(0.2, 0.4, 0.2) * trail * 0.02 * brightness;
    
    gl_FragColor = vec4(col, 1.0);
}
