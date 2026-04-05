// Ranger 5 Screensaver — 4-Mode GLSL Fragment Shader
// Mode 1: Stair-step moss growth (L-system fractal, green on dark)
// Mode 2: Battery depletion (power gauge draining, indicators going dark)
// Mode 3: 725-km flyby (Moon surface scrolling past with distance counter)
// Mode 4: Rough-winged swallow silhouette (solitary bird over river)
//
// For XScreenSaver / GSD-OS integration
// Uniform inputs: iTime (seconds), iResolution (vec2)

#ifdef GL_ES
precision mediump float;
#endif

uniform float iTime;
uniform vec2 iResolution;

// Mode selection: cycles every 30 seconds
int getMode() {
    return int(mod(iTime / 30.0, 4.0));
}

// === UTILITIES ===
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

// === MODE 1: STAIR-STEP MOSS ===
vec3 mossMode(vec2 uv) {
    float t = iTime * 0.3;
    // Growing steps from bottom
    float stepCount = 8.0 + sin(t * 0.5) * 2.0;
    float stepHeight = 1.0 / stepCount;
    float step = floor(uv.y / stepHeight);
    float withinStep = fract(uv.y / stepHeight);

    // Each step has branching fronds
    float frondX = sin(uv.x * 20.0 + step * 3.14) * 0.3;
    float frondShape = smoothstep(0.3, 0.5, withinStep) * smoothstep(1.0, 0.6, withinStep);
    float frond = smoothstep(0.02, 0.0, abs(uv.x - 0.5 + frondX * 0.1) - 0.15 * frondShape);

    // Green gradient: newer steps (top) are brighter
    float age = step / stepCount;
    vec3 green = mix(vec3(0.05, 0.15, 0.05), vec3(0.2, 0.6, 0.15), age);

    // Grow animation: steps appear over time
    float growMask = smoothstep(step - 0.5, step + 0.5, mod(t * 2.0, stepCount));

    return green * frond * growMask * 0.8 + vec3(0.02, 0.04, 0.02);
}

// === MODE 2: BATTERY DEPLETION ===
vec3 batteryMode(vec2 uv) {
    float t = mod(iTime, 30.0) / 30.0; // 0 to 1 over 30 seconds

    // Battery gauge on left
    float gaugeX = smoothstep(0.08, 0.1, uv.x) * smoothstep(0.22, 0.2, uv.x);
    float gaugeY = smoothstep(0.1, 0.12, uv.y) * smoothstep(0.9, 0.88, uv.y);
    float fillLevel = max(0.0, 1.0 - t * 1.15); // drains to zero
    float filled = step(uv.y - 0.1, fillLevel * 0.78);
    vec3 gaugeColor = mix(vec3(0.8, 0.1, 0.1), vec3(0.1, 0.8, 0.1), fillLevel);
    vec3 gauge = gaugeColor * gaugeX * gaugeY * filled;

    // System indicators on right (5 dots that go dark over time)
    vec3 indicators = vec3(0.0);
    for (int i = 0; i < 5; i++) {
        float iy = 0.25 + float(i) * 0.12;
        float ix = 0.7;
        float dotDist = length(uv - vec2(ix, iy));
        float shutdownTime = 0.3 + float(i) * 0.13; // staggered shutdown
        float alive = step(t, shutdownTime);
        vec3 dotColor = mix(vec3(0.3, 0.0, 0.0), vec3(0.0, 0.8, 0.2), alive);
        indicators += dotColor * smoothstep(0.02, 0.01, dotDist);
    }

    return gauge + indicators + vec3(0.02, 0.02, 0.03);
}

// === MODE 3: 725-KM FLYBY ===
vec3 flybyMode(vec2 uv) {
    float t = mod(iTime, 30.0) / 30.0;

    // Moon surface scrolling from right to left
    float scrollX = uv.x + t * 2.0;
    float terrain = 0.4 + noise(vec2(scrollX * 5.0, 0.0)) * 0.15
                       + noise(vec2(scrollX * 15.0, 1.0)) * 0.05;

    // Craters
    float crater = 0.0;
    for (int i = 0; i < 6; i++) {
        vec2 cp = vec2(hash(vec2(float(i), 0.0)) * 3.0 + t * 2.0, 0.3 + hash(vec2(0.0, float(i))) * 0.2);
        float r = 0.03 + hash(vec2(float(i), 1.0)) * 0.05;
        crater += smoothstep(r, r * 0.7, length(uv - cp));
    }

    float moonSurface = step(uv.y, terrain) * (0.3 + crater * 0.2);
    vec3 moonColor = vec3(0.5, 0.48, 0.45) * moonSurface;

    // Distance indicator
    float dist = 725.0 * (1.0 - abs(t - 0.5) * 2.0); // approaches then recedes
    // Spacecraft dot at top
    float scDist = length(uv - vec2(0.5, 0.85));
    vec3 spacecraft = vec3(0.8, 0.7, 0.2) * smoothstep(0.01, 0.005, scDist) * 0.5; // dim, no power

    return moonColor + spacecraft + vec3(0.01, 0.01, 0.02);
}

// === MODE 4: ROUGH-WINGED SWALLOW ===
vec3 swallowMode(vec2 uv) {
    float t = iTime * 0.5;

    // River background
    float riverNoise = noise(vec2(uv.x * 3.0 + t * 0.3, uv.y * 2.0));
    vec3 river = mix(vec3(0.05, 0.08, 0.12), vec3(0.08, 0.12, 0.18), riverNoise);
    float horizon = smoothstep(0.55, 0.6, uv.y);
    vec3 sky = mix(vec3(0.15, 0.18, 0.22), vec3(0.08, 0.1, 0.15), uv.y);
    vec3 bg = mix(river, sky, horizon);

    // Bank (brown earth)
    float bankLine = 0.55 + noise(vec2(uv.x * 8.0, 0.0)) * 0.03;
    float bank = smoothstep(bankLine + 0.02, bankLine, uv.y);
    bg = mix(bg, vec3(0.2, 0.12, 0.06), bank * 0.5);

    // Swallow silhouette — simple bird shape
    float birdX = mod(t * 0.3, 1.5) - 0.25;
    float birdY = 0.7 + sin(t * 2.0) * 0.03;
    vec2 birdPos = uv - vec2(birdX, birdY);
    // Body
    float body = smoothstep(0.02, 0.01, length(birdPos * vec2(1.0, 2.5)));
    // Wings
    float wingL = smoothstep(0.04, 0.02, length((birdPos - vec2(-0.03, 0.005)) * vec2(1.0, 4.0)));
    float wingR = smoothstep(0.04, 0.02, length((birdPos - vec2(0.03, 0.005)) * vec2(1.0, 4.0)));
    float bird = max(body, max(wingL, wingR));
    vec3 birdColor = vec3(0.15, 0.1, 0.08); // drab brown

    return mix(bg, birdColor, bird);
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    int mode = getMode();

    vec3 color;
    if (mode == 0) color = mossMode(uv);
    else if (mode == 1) color = batteryMode(uv);
    else if (mode == 2) color = flybyMode(uv);
    else color = swallowMode(uv);

    gl_FragColor = vec4(color, 1.0);
}
