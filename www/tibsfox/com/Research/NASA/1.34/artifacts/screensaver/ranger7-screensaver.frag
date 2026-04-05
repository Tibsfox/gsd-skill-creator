// ranger7-screensaver.frag
// Fractal lunar surface with power-law crater distribution
// Infinite zoom reveals new craters at every scale
// N(>D) ~ D^(-2): ten times smaller → 100 times more numerous
//
// XScreenSaver / GSD-OS compatible fragment shader
//
// Uniforms:
//   u_time: elapsed seconds
//   u_resolution: viewport resolution
//   u_zoom: zoom level (increases with time in screensaver mode)

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

// Hash function for procedural crater placement
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D noise for subtle surface variation
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

// Crater function: circular depression with raised rim
float crater(vec2 p, vec2 center, float radius) {
    float d = length(p - center) / radius;
    if (d > 1.5) return 0.0;
    // Interior: depression
    float interior = smoothstep(0.0, 0.8, d) * 0.3;
    // Rim: raised ring
    float rim = exp(-pow((d - 1.0) * 4.0, 2.0)) * 0.4;
    return rim - interior * (1.0 - smoothstep(0.8, 1.0, d));
}

// Multi-scale crater field following power law
float craterField(vec2 uv, float zoom) {
    float surface = 0.0;
    
    // Multiple octaves of craters (power-law: smaller = more numerous)
    for (float scale = 1.0; scale < 256.0; scale *= 2.0) {
        float effectiveScale = scale * zoom;
        vec2 cell = floor(uv * effectiveScale);
        
        // More craters at smaller scales (power law N ~ D^-2)
        float numCraters = 2.0;  // per cell at each scale
        
        for (float n = 0.0; n < 2.0; n++) {
            vec2 offset = vec2(hash(cell + n * 17.3), hash(cell + n * 31.7 + 0.5));
            vec2 craterCenter = (cell + offset) / effectiveScale;
            float craterRadius = (0.3 + 0.4 * hash(cell + n * 53.1)) / effectiveScale;
            surface += crater(uv, craterCenter, craterRadius) / scale * 0.5;
        }
    }
    
    return surface;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    // Screensaver mode: slow zoom in
    float zoom = 1.0 + u_time * 0.1;
    vec2 center = vec2(0.5, 0.5);
    uv = (uv - center) / zoom + center;
    
    // Base mare surface (dark gray)
    float base = 0.12 + noise(uv * 20.0) * 0.03;
    
    // Add multi-scale craters
    float craters = craterField(uv, zoom);
    
    // Combine
    float brightness = base + craters;
    brightness = clamp(brightness, 0.0, 0.3);
    
    // Slight warm tint (lunar surface)
    vec3 color = vec3(brightness * 1.05, brightness, brightness * 0.95);
    
    gl_FragColor = vec4(color, 1.0);
}
