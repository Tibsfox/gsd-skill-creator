#version 450

// Mercury-Atlas 7 / Aurora 7 — "I am a firefly" Screensaver
// May 24, 1962 — Scott Carpenter, 3 orbits, science-focused flight
//
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Orbital Dawn — Earth's limb on the right, terminator line
//           where sunlight hits the spacecraft hull. Carpenter's "fireflies"
//           bloom outward from a central point, glowing yellowish-green.
//           Deep space black to Earth blue to dawn gold to particle green.
//   Mode 1: Bioluminescence — Deep dark water with jellyfish forms,
//           transparent bell shapes pulsing. Bioluminescent green glow.
//           Calcium flash events: aequorin blue pulse converting to GFP green.
//           Drifting plankton particles in the water.
//   Mode 2: Reentry — Fireball of atmospheric reentry. Central capsule
//           surrounded by ionized plasma. Retropack fragments burning away,
//           separating and trailing. Orange-white core, atmospheric blue haze.
//   Mode 3: Aurora Borealis — Northern lights from below. Curtains of
//           green light rippling vertically. Green dominant (557.7nm oxygen),
//           purple/blue edges. Stars visible through curtains. Majestic sway.
//
// Organism: Aequorea victoria (crystal jellyfish — GFP source)
//
// Compile: glslangValidator ma7-screensaver.frag
// Run:     glslViewer ma7-screensaver.frag

layout(location = 0) out vec4 fragColor;

uniform float iTime;
uniform vec2 iResolution;
uniform int iFrame;
uniform vec4 iMouse;

// --- Color palette ---

const vec3 SPACE_BLACK    = vec3(0.008, 0.008, 0.031);     // Deep space
const vec3 EARTH_BLUE     = vec3(0.094, 0.251, 0.627);     // Limb blue
const vec3 DAWN_GOLD      = vec3(0.878, 0.694, 0.314);     // Sunrise gold
const vec3 FIREFLY_GREEN  = vec3(0.502, 0.784, 0.314);     // Particle glow
const vec3 OCEAN_BLACK    = vec3(0.008, 0.016, 0.047);     // Deep water
const vec3 DEEP_BLUE      = vec3(0.020, 0.059, 0.149);     // Water mid
const vec3 AEQUORIN_BLUE  = vec3(0.188, 0.376, 0.878);     // Ca2+ flash
const vec3 GFP_GREEN      = vec3(0.251, 0.816, 0.502);     // #40D080
const vec3 PLASMA_ORANGE  = vec3(0.878, 0.502, 0.125);     // Reentry plasma
const vec3 WHITEHOT       = vec3(1.0, 0.941, 0.878);       // Core heat
const vec3 ATMO_HAZE      = vec3(0.314, 0.502, 0.753);     // Atmospheric blue
const vec3 AURORA_GREEN   = vec3(0.251, 0.878, 0.376);     // 557.7nm oxygen
const vec3 AURORA_PURPLE  = vec3(0.376, 0.188, 0.627);     // Purple edge

// --- Shared utilities ---

float hash(vec2 p) {
    p = fract(p * vec2(443.897, 441.423));
    p += dot(p, p.yx + 19.19);
    return fract(p.x * p.y);
}

float hash1(float p) {
    p = fract(p * 443.897);
    p += p * p + 19.19;
    return fract(p);
}

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

float fbm3(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * vnoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

// SDF capsule shape (for Mercury spacecraft)
float sdCapsule(vec2 p, float h, float r) {
    p.y -= clamp(p.y, -h, h);
    return length(p) - r;
}

// Procedural star field
vec3 drawStars(vec2 uv, float t, int count, float seed) {
    vec3 col = vec3(0.0);
    for (int i = 0; i < 80; i++) {
        if (i >= count) break;
        float fi = float(i) + seed;
        vec2 starPos = vec2(hash1(fi * 7.3) * 2.0 - 1.0,
                            hash1(fi * 13.7) * 1.0 - 0.5);
        float starD = length(uv - starPos);
        float star = smoothstep(0.003, 0.001, starD);
        float twinkle = 0.5 + 0.5 * sin(t * (1.0 + hash1(fi * 3.1)) + fi);
        col += vec3(0.8, 0.85, 1.0) * star * twinkle * 0.35;
    }
    return col;
}


// ============================================================
// MODE 0: Orbital Dawn — Earth's limb, terminator, fireflies
// ============================================================

vec3 mode0_orbital_dawn(vec2 uv, float t) {
    float localT = mod(t, 15.0);
    float progress = localT / 15.0;

    vec3 col = SPACE_BLACK;

    // Stars in deep space (left side)
    col += drawStars(uv, t, 60, 22.0);

    // Earth's limb — bright blue-white arc on the right side
    // Curved edge sweeping from bottom-right to top-right
    float limbX = 0.35 - uv.y * uv.y * 0.2;
    float earthMask = smoothstep(limbX - 0.005, limbX + 0.005, uv.x);

    // Earth's dark surface with subtle cloud patterns
    vec3 earthDark = vec3(0.01, 0.02, 0.06);
    float clouds = fbm3(uv * 8.0 + vec2(t * 0.01, 0.0)) * 0.06;
    vec3 earthSurface = earthDark + vec3(clouds * 0.5, clouds, clouds * 0.8);
    col = mix(col, earthSurface, earthMask);

    // Atmospheric layers along the limb
    float limbDist = uv.x - limbX;

    // Deep blue atmosphere band
    float atmoBlue = exp(-max(-limbDist, 0.0) * 30.0) * (1.0 - earthMask);
    col += EARTH_BLUE * atmoBlue * 0.7;

    // Cyan-white thin atmosphere
    float atmoCyan = exp(-max(-limbDist, 0.0) * 50.0) * (1.0 - earthMask);
    col += vec3(0.3, 0.65, 0.95) * atmoCyan * 0.5;

    // Bright white limb edge
    float atmoWhite = exp(-max(-limbDist, 0.0) * 100.0) * (1.0 - earthMask);
    col += vec3(0.9, 0.95, 1.0) * atmoWhite * 0.6;

    // Terminator line — sunlight hitting the hull
    // Sun rising from the right, terminator sweeps across
    float terminatorX = 0.3 - progress * 0.4;
    float terminatorGlow = exp(-abs(uv.x - terminatorX) * 8.0);
    terminatorGlow *= smoothstep(-0.5, 0.0, uv.x) * smoothstep(0.0, 0.3, progress);

    // Dawn gold along the terminator
    col += DAWN_GOLD * terminatorGlow * 0.3;

    // Sun glow from the right
    vec2 sunPos = vec2(0.9, 0.1 - progress * 0.15);
    float sunDist = length(uv - sunPos);
    float sunGlow = exp(-sunDist * 4.0) * smoothstep(0.0, 0.25, progress);
    col += vec3(1.0, 0.88, 0.55) * sunGlow * 0.5;
    float sunCore = smoothstep(0.03, 0.015, sunDist) * smoothstep(0.0, 0.15, progress);
    col += WHITEHOT * sunCore * 0.8;

    // Carpenter's fireflies — blooming outward from a central point
    // (ice particles from the capsule hull catching dawn light)
    vec2 sourcePoint = vec2(-0.1, 0.05);
    for (int i = 0; i < 35; i++) {
        float fi = float(i);
        float s1 = hash1(fi * 13.7 + 3.0);
        float s2 = hash1(fi * 29.3 + 7.0);
        float s3 = hash1(fi * 41.1 + 11.0);

        // Spawn over time, bloom outward
        float spawnT = s1 * 8.0;
        float alive = smoothstep(spawnT - 0.5, spawnT, localT);
        float age = max(localT - spawnT, 0.0);

        // Radial expansion from source point
        float angle = s2 * 6.28318;
        float speed = 0.02 + s3 * 0.03;
        vec2 ffPos = sourcePoint + vec2(cos(angle), sin(angle)) * speed * age;

        // Slow drift perturbation
        ffPos += vec2(sin(t * 0.2 + fi * 2.0) * 0.008,
                      cos(t * 0.15 + fi * 1.3) * 0.006);

        float ffDist = length(uv - ffPos);
        float ff = smoothstep(0.005, 0.001, ffDist) * alive;

        // Gentle pulsing glow
        float pulse = 0.5 + 0.5 * sin(t * 1.5 + fi * 3.7);

        // Yellowish-green firefly color, catching sunlight
        vec3 ffColor = mix(FIREFLY_GREEN, DAWN_GOLD, s3 * 0.3);
        col += ffColor * ff * pulse * 0.6;

        // Soft glow halo
        col += ffColor * exp(-ffDist * 100.0) * alive * pulse * 0.06;
    }

    return col;
}


// ============================================================
// MODE 1: Bioluminescence — jellyfish, aequorin/GFP, deep water
// ============================================================

// Jellyfish bell SDF — parabolic dome shape
float sdJellyBell(vec2 p, float radius, float phase) {
    // Pulsing contraction
    float pulse = 1.0 + 0.12 * sin(phase);
    p.x *= pulse;

    // Bell shape: parabolic dome
    float bellY = radius - p.x * p.x / (radius * 0.6);
    float dist = p.y - bellY;

    // Only the dome top (above center)
    if (p.y < -radius * 0.3) {
        dist = length(p - vec2(0.0, -radius * 0.3)) - radius * 0.4;
    }

    return dist;
}

vec3 mode1_bioluminescence(vec2 uv, float t) {
    float localT = mod(t, 15.0);
    float progress = localT / 15.0;

    // Deep dark water background
    vec3 col = OCEAN_BLACK;

    // Subtle water depth gradient
    col += DEEP_BLUE * smoothstep(0.5, -0.5, uv.y) * 0.3;

    // Water caustics — faint light patterns from above
    float caustic1 = vnoise(uv * 6.0 + vec2(t * 0.08, t * 0.05));
    float caustic2 = vnoise(uv * 8.0 - vec2(t * 0.06, t * 0.03));
    float caustic = smoothstep(0.45, 0.55, caustic1 * caustic2 * 4.0);
    col += DEEP_BLUE * caustic * 0.08;

    // Drifting organic particles (plankton / marine snow)
    for (int i = 0; i < 40; i++) {
        float fi = float(i);
        float px = hash1(fi * 7.7) * 2.0 - 1.0;
        float py = hash1(fi * 11.3) * 1.0 - 0.5;
        float pSpeed = 0.01 + hash1(fi * 3.9) * 0.02;

        vec2 pPos = vec2(px + sin(t * 0.1 + fi) * 0.05,
                         mod(py - t * pSpeed, 1.2) - 0.6);
        float pDist = length(uv - pPos);
        float particle = smoothstep(0.004, 0.001, pDist);
        float pAlpha = 0.15 + 0.1 * sin(t * 0.5 + fi * 2.0);
        col += vec3(0.3, 0.5, 0.4) * particle * pAlpha;
    }

    // --- Jellyfish ---
    // 3 jellyfish at different positions, sizes, depths
    for (int j = 0; j < 3; j++) {
        float fj = float(j);
        float jSeed = fj * 17.0 + 5.0;

        // Position: drift slowly upward and laterally
        vec2 jCenter = vec2(
            hash1(jSeed + 1.0) * 1.4 - 0.7,
            hash1(jSeed + 2.0) * 0.6 - 0.3
        );
        jCenter.x += sin(t * 0.15 + fj * 2.1) * 0.08;
        jCenter.y += sin(t * 0.1 + fj * 1.7) * 0.04 + t * 0.005;
        jCenter.y = mod(jCenter.y + 0.5, 1.2) - 0.7;

        float jRadius = 0.08 + hash1(jSeed + 3.0) * 0.06;
        float jPhase = t * 1.5 + fj * 2.0;

        vec2 jUV = uv - jCenter;

        // Bell shape
        float bellDist = sdJellyBell(jUV, jRadius, jPhase);

        // Transparent bell body
        float bellMask = smoothstep(0.01, -0.01, bellDist);
        float bellEdge = smoothstep(0.02, 0.0, abs(bellDist));

        // Bell interior — very transparent with faint structure
        vec3 bellColor = DEEP_BLUE * 0.3 + GFP_GREEN * 0.05;
        col = mix(col, bellColor, bellMask * 0.15);

        // Bell margin glow — bioluminescent green
        col += GFP_GREEN * bellEdge * 0.4;

        // Radial margin organs (green dots along the rim)
        float rimAngle = atan(jUV.x, jUV.y - jRadius * 0.3);
        float rimPulse = 0.5 + 0.5 * sin(rimAngle * 12.0 + t * 2.0 + fj);
        float rimGlow = bellEdge * rimPulse * 0.3;
        col += GFP_GREEN * rimGlow;

        // Tentacles — trailing lines below the bell
        for (int k = 0; k < 5; k++) {
            float fk = float(k);
            float tentX = jCenter.x + (fk - 2.0) * jRadius * 0.35;
            float tentStartY = jCenter.y - jRadius * 0.4;

            // Wavy tentacle
            float tentDist = abs(uv.x - tentX - sin(uv.y * 15.0 + t * 1.5 + fk * 1.3) * 0.01);
            float tentMask = smoothstep(0.003, 0.001, tentDist);
            tentMask *= smoothstep(tentStartY, tentStartY - 0.0001, uv.y);
            tentMask *= smoothstep(tentStartY - jRadius * 1.5, tentStartY - jRadius * 0.3, uv.y);

            col += GFP_GREEN * tentMask * 0.2;
        }

        // Pulsation glow — the bell contracts and emits light
        float pulseGlow = max(sin(jPhase), 0.0);
        float pulseDist = length(jUV);
        col += GFP_GREEN * exp(-pulseDist * 15.0) * pulseGlow * 0.15;
    }

    // --- Calcium flash events (aequorin -> GFP energy transfer) ---
    // Two flash events per cycle: sudden blue that converts to green
    for (int f = 0; f < 2; f++) {
        float ff = float(f);
        float flashTime = 4.0 + ff * 7.0; // flash at ~4s and ~11s
        float flashAge = localT - flashTime;

        if (flashAge > 0.0 && flashAge < 3.0) {
            vec2 flashPos = vec2(
                hash1(ff * 37.0 + 100.0) * 1.2 - 0.6,
                hash1(ff * 53.0 + 200.0) * 0.6 - 0.3
            );

            float flashDist = length(uv - flashPos);

            // Phase 1 (0-0.5s): bright aequorin blue flash
            float bluePhase = smoothstep(0.0, 0.1, flashAge) * smoothstep(0.8, 0.3, flashAge);
            col += AEQUORIN_BLUE * exp(-flashDist * 12.0) * bluePhase * 0.8;

            // Phase 2 (0.3-3.0s): sustained GFP green glow (FRET transfer)
            float greenPhase = smoothstep(0.3, 0.8, flashAge) * smoothstep(3.0, 2.0, flashAge);
            col += GFP_GREEN * exp(-flashDist * 8.0) * greenPhase * 0.5;

            // Expanding ring of the flash
            float ring = abs(flashDist - flashAge * 0.08);
            float ringGlow = smoothstep(0.015, 0.005, ring) * smoothstep(0.0, 0.3, flashAge)
                           * smoothstep(2.5, 1.5, flashAge);
            vec3 ringColor = mix(AEQUORIN_BLUE, GFP_GREEN, smoothstep(0.0, 1.5, flashAge));
            col += ringColor * ringGlow * 0.4;
        }
    }

    return col;
}


// ============================================================
// MODE 2: Reentry — fireball, plasma, retropack debris
// ============================================================

vec3 mode2_reentry(vec2 uv, float t) {
    float localT = mod(t, 15.0);
    float progress = localT / 15.0;

    vec3 col = SPACE_BLACK;

    // Faint stars visible at mode start, fading as atmosphere thickens
    col += drawStars(uv, t, 40, 77.0) * smoothstep(0.4, 0.0, progress);

    // Atmospheric blue haze building from the edges
    float atmoHaze = smoothstep(0.0, 0.6, progress);
    float hazeEdge = smoothstep(0.3, 0.7, length(uv));
    col += ATMO_HAZE * hazeEdge * atmoHaze * 0.15;

    // Central capsule shape (simplified Mercury capsule — blunt cone)
    vec2 capUV = uv;
    // Capsule is slightly left of center, moving right
    capUV.x += 0.05 - progress * 0.03;

    // SDF: blunt body with heat shield
    float heatShield = length(vec2(capUV.x + 0.02, capUV.y)) - 0.04;
    float cone = capUV.x - 0.02 + abs(capUV.y) * 1.5 - 0.06;
    float capsule = min(heatShield, cone);

    // Capsule silhouette (dark against plasma)
    float capMask = smoothstep(0.005, -0.005, capsule);

    // --- Ionized plasma envelope ---
    float plasmaDist = length(capUV * vec2(0.7, 1.0));

    // Shock wave — bow shock ahead of the capsule
    float shockRadius = 0.09 + 0.02 * sin(t * 3.0);
    float shockWave = abs(length(capUV * vec2(0.6, 1.0) + vec2(0.02, 0.0)) - shockRadius);
    float shockGlow = smoothstep(0.015, 0.003, shockWave);
    shockGlow *= smoothstep(0.0, 0.3, progress) * smoothstep(-0.08, 0.0, capUV.x + 0.05);
    col += PLASMA_ORANGE * shockGlow * 0.6;

    // Plasma glow around the heat shield
    float plasmaCore = exp(-plasmaDist * 18.0);
    vec3 plasmaColor = mix(PLASMA_ORANGE, WHITEHOT, plasmaCore * 0.6);
    float plasmaIntensity = smoothstep(0.0, 0.5, progress);
    col += plasmaColor * plasmaCore * plasmaIntensity * 1.2;

    // White-hot center at heat shield face
    float hotCenter = exp(-length(capUV + vec2(0.02, 0.0)) * 35.0);
    col += WHITEHOT * hotCenter * plasmaIntensity * 0.8;

    // Streaming red-orange trails behind the capsule
    for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float trailY = (hash1(fi * 7.1 + 50.0) - 0.5) * 0.12;
        float trailSpeed = 0.3 + hash1(fi * 11.3 + 60.0) * 0.4;

        // Trail streams to the left (behind capsule)
        float trailX = capUV.x - 0.04;
        if (trailX < 0.0) {
            float trailDist = abs(capUV.y - trailY - sin(capUV.x * 20.0 + t * 3.0 + fi) * 0.008);
            float trail = smoothstep(0.008, 0.002, trailDist);
            trail *= smoothstep(-0.5, -0.05, capUV.x); // fade at distance
            trail *= smoothstep(0.05, -0.05, capUV.x);  // start near capsule
            trail *= plasmaIntensity;

            vec3 trailColor = mix(PLASMA_ORANGE, vec3(0.8, 0.2, 0.05), hash1(fi * 3.3));
            col += trailColor * trail * 0.3;
        }
    }

    // --- Retropack debris ---
    // Fragments separating and trailing behind, burning away
    for (int d = 0; d < 6; d++) {
        float fd = float(d);
        float debrisSpawn = 2.0 + fd * 1.5; // staggered separation
        float debrisAge = localT - debrisSpawn;

        if (debrisAge > 0.0 && debrisAge < 10.0) {
            // Fragment trajectory: separating backward and outward
            float dAngle = (hash1(fd * 19.0 + 30.0) - 0.5) * 1.5;
            float dSpeed = 0.015 + hash1(fd * 23.0 + 40.0) * 0.02;

            vec2 dPos = vec2(-0.06, 0.0); // start at retropack position
            dPos.x -= debrisAge * dSpeed * 2.0;
            dPos.y += sin(dAngle) * debrisAge * dSpeed;

            // Tumbling
            dPos += vec2(sin(t * 4.0 + fd * 5.0), cos(t * 3.0 + fd * 7.0)) * 0.003;

            float dDist = length(uv - dPos);

            // Debris size shrinks as it burns
            float dSize = 0.006 * smoothstep(8.0, 0.0, debrisAge);
            float dMask = smoothstep(dSize, dSize * 0.3, dDist);

            // Burning glow
            float burnGlow = exp(-dDist * 60.0) * smoothstep(0.0, 1.0, debrisAge)
                           * smoothstep(9.0, 5.0, debrisAge);
            vec3 burnColor = mix(WHITEHOT, PLASMA_ORANGE, smoothstep(0.0, 4.0, debrisAge));
            col += burnColor * dMask * 0.5;
            col += PLASMA_ORANGE * burnGlow * 0.3;

            // Debris trail
            float trailLen = min(debrisAge * 0.02, 0.08);
            float trailD = abs(uv.y - dPos.y);
            float trailMask = smoothstep(0.004, 0.001, trailD);
            trailMask *= smoothstep(dPos.x - trailLen, dPos.x, uv.x);
            trailMask *= smoothstep(dPos.x + 0.01, dPos.x, uv.x);
            trailMask *= smoothstep(8.0, 3.0, debrisAge);
            col += PLASMA_ORANGE * trailMask * 0.2;
        }
    }

    // Capsule overlay (dark silhouette)
    col = mix(col, vec3(0.02, 0.01, 0.01), capMask * 0.8);

    // Atmospheric glow increasing over the whole scene
    float overallGlow = smoothstep(0.3, 1.0, progress) * 0.1;
    col += ATMO_HAZE * overallGlow;

    return col;
}


// ============================================================
// MODE 3: Aurora Borealis — northern lights from below
// ============================================================

vec3 mode3_aurora(vec2 uv, float t) {
    float localT = mod(t, 15.0);
    float progress = localT / 15.0;

    // Dark night sky
    vec3 col = vec3(0.01, 0.012, 0.03);

    // Stars — visible through the aurora
    for (int i = 0; i < 60; i++) {
        float fi = float(i) + 100.0;
        vec2 starPos = vec2(hash1(fi * 7.3) * 2.0 - 1.0,
                            hash1(fi * 13.7) * 1.0 - 0.5);
        float starD = length(uv - starPos);
        float star = smoothstep(0.003, 0.001, starD);
        float twinkle = 0.5 + 0.5 * sin(t * (0.8 + hash1(fi * 3.1)) + fi);
        col += vec3(0.85, 0.9, 1.0) * star * twinkle * 0.25;
    }

    // --- Aurora curtains ---
    // Multiple vertical curtain bands across the sky
    // Viewed from below, so curtains are in the upper portion

    float auroraRegion = smoothstep(-0.1, 0.1, uv.y); // aurora lives in upper half

    // Curtain 1: dominant green, center-left
    {
        float curtainX = uv.x * 3.0;
        // Horizontal displacement — swaying curtain
        float sway = sin(uv.y * 4.0 + t * 0.3) * 0.15
                   + sin(uv.y * 7.0 + t * 0.5) * 0.08
                   + sin(uv.y * 2.0 - t * 0.2) * 0.2;
        float fold = sin(curtainX + sway + fbm3(vec2(uv.x * 2.0, uv.y + t * 0.1)) * 2.0);

        // Curtain intensity from folded structure
        float curtain = smoothstep(0.0, 0.8, fold) * smoothstep(1.0, 0.5, fold);
        curtain *= auroraRegion;

        // Vertical intensity — brighter in the middle, fading at edges
        float vertFade = smoothstep(-0.1, 0.15, uv.y) * smoothstep(0.5, 0.35, uv.y);
        curtain *= vertFade;

        // Pulsation
        float pulse = 0.7 + 0.3 * sin(t * 0.8 + uv.y * 3.0);
        curtain *= pulse;

        // Green core with purple/blue edges
        vec3 curtainColor = AURORA_GREEN;
        float edgeFactor = smoothstep(0.3, 0.0, fold) + smoothstep(0.8, 1.0, fold);
        curtainColor = mix(curtainColor, AURORA_PURPLE, edgeFactor * 0.5);

        // Lower edge gets more purple (nitrogen)
        curtainColor = mix(curtainColor, AURORA_PURPLE,
                          smoothstep(0.2, -0.05, uv.y) * 0.4);

        col += curtainColor * curtain * 0.5;
    }

    // Curtain 2: secondary, offset
    {
        float curtainX = (uv.x + 0.4) * 2.5;
        float sway = sin(uv.y * 5.0 + t * 0.4 + 1.0) * 0.12
                   + sin(uv.y * 3.0 - t * 0.25 + 2.0) * 0.18;
        float fold = sin(curtainX + sway + fbm3(vec2(uv.x * 1.5 + 3.0, uv.y + t * 0.08)) * 1.8);

        float curtain = smoothstep(-0.1, 0.7, fold) * smoothstep(1.0, 0.6, fold);
        curtain *= auroraRegion;

        float vertFade = smoothstep(-0.05, 0.18, uv.y) * smoothstep(0.48, 0.32, uv.y);
        curtain *= vertFade;

        float pulse = 0.6 + 0.4 * sin(t * 0.6 + uv.y * 4.0 + 1.5);
        curtain *= pulse;

        vec3 curtainColor = AURORA_GREEN * 0.8;
        float edgeFactor = smoothstep(0.2, -0.1, fold) + smoothstep(0.7, 1.0, fold);
        curtainColor = mix(curtainColor, AURORA_PURPLE * 0.7, edgeFactor * 0.6);

        col += curtainColor * curtain * 0.35;
    }

    // Curtain 3: faint background curtain
    {
        float curtainX = (uv.x - 0.3) * 4.0;
        float sway = sin(uv.y * 6.0 + t * 0.35 + 3.0) * 0.1
                   + sin(uv.y * 2.5 - t * 0.15 + 5.0) * 0.15;
        float fold = sin(curtainX + sway + fbm3(vec2(uv.x * 3.0 - 2.0, uv.y + t * 0.06)) * 1.5);

        float curtain = smoothstep(0.1, 0.8, fold) * smoothstep(1.0, 0.7, fold);
        curtain *= auroraRegion;

        float vertFade = smoothstep(0.0, 0.2, uv.y) * smoothstep(0.45, 0.3, uv.y);
        curtain *= vertFade;

        float pulse = 0.5 + 0.5 * sin(t * 0.5 + uv.y * 2.5 + 3.0);
        curtain *= pulse;

        col += AURORA_GREEN * 0.5 * curtain * 0.2;
    }

    // Diffuse aurora glow — overall sky illumination
    float diffuseGlow = smoothstep(-0.1, 0.3, uv.y) * smoothstep(0.5, 0.2, uv.y);
    float diffuseWave = 0.5 + 0.5 * sin(uv.x * 2.0 + t * 0.3);
    col += AURORA_GREEN * diffuseGlow * diffuseWave * 0.06;

    // Ground horizon — dark silhouette with faint reflected glow
    float ground = smoothstep(-0.18, -0.22, uv.y);
    col = mix(col, vec3(0.005, 0.008, 0.012), ground);

    // Ground-level reflected aurora glow
    float reflected = smoothstep(-0.15, -0.20, uv.y) * smoothstep(-0.35, -0.20, uv.y);
    col += AURORA_GREEN * reflected * 0.04;

    // Treeline silhouette hint at horizon
    float treeNoise = fbm3(vec2(uv.x * 15.0, 0.0));
    float treeline = smoothstep(-0.17 - treeNoise * 0.03, -0.18 - treeNoise * 0.03, uv.y);
    col *= mix(1.0, 0.3, (1.0 - treeline) * smoothstep(-0.15, -0.19, uv.y));

    return col;
}


// ============================================================
// MAIN — mode selection with crossfade
// ============================================================

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    float t = iTime;
    float cycle = mod(t, 60.0);

    int mode = int(cycle / 15.0);

    // Compute current mode color
    vec3 colCurrent;

    if (mode == 0) {
        colCurrent = mode0_orbital_dawn(uv, t);
    } else if (mode == 1) {
        colCurrent = mode1_bioluminescence(uv, t);
    } else if (mode == 2) {
        colCurrent = mode2_reentry(uv, t);
    } else {
        colCurrent = mode3_aurora(uv, t);
    }

    // Crossfade: compute next mode in the last second
    float modeT = mod(cycle, 15.0);
    float crossfade = smoothstep(14.0, 15.0, modeT);

    vec3 col = colCurrent;

    if (crossfade > 0.001) {
        int nextMode = int(mod(float(mode + 1), 4.0));
        vec3 colNext;
        if (nextMode == 0) {
            colNext = mode0_orbital_dawn(uv, t);
        } else if (nextMode == 1) {
            colNext = mode1_bioluminescence(uv, t);
        } else if (nextMode == 2) {
            colNext = mode2_reentry(uv, t);
        } else {
            colNext = mode3_aurora(uv, t);
        }
        col = mix(colCurrent, colNext, crossfade);
    }

    // Fade in at mode start
    float fadeIn = smoothstep(0.0, 1.0, modeT);
    col *= fadeIn;

    // Vignette
    float vignette = 1.0 - 0.3 * length(uv);
    col *= vignette;

    fragColor = vec4(col, 1.0);
}
