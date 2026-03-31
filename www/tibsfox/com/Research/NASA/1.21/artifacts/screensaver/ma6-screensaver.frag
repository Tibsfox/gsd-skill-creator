#version 450

// Mercury-Atlas 6 / Friendship 7 — "Godspeed, John Glenn" Screensaver
// February 20, 1962 — First American to orbit Earth, 3 orbits
//
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Orbital Dawn — Earth's limb with atmospheric glow, sunrise
//           spreading along the curved horizon, Glenn's famous "fireflies"
//           (luminescent ice particles from the capsule), star field,
//           capsule silhouette against the dawn.
//   Mode 1: Three Orbits — Top-down Earth view with three sinusoidal
//           ground tracks shifting westward (Earth rotation). Capsule dot
//           traversing current orbit. Day/night terminator. Tracking
//           station pulses along the ground tracks.
//   Mode 2: Reentry — Head-on heat shield view. The retropack was left
//           strapped on (controllers feared the heat shield was loose).
//           Burning retropack debris spiraling away, plasma streamers,
//           orange/white center building to peak intensity.
//   Mode 3: Salmon Run — Chinook salmon in abstract underwater scene.
//           Copper/silver fish forms, caustic light patterns, river
//           current noise, magnetic field line overlays, spawning gravel.
//
// Organism: Chinook salmon (Oncorhynchus tshawytscha)
// Bird: Swainson's Thrush (Catharus ustulatus)
//
// Compile: glslangValidator ma6-screensaver.frag
// Run:     glslViewer ma6-screensaver.frag

layout(location = 0) out vec4 fragColor;

uniform float iTime;
uniform vec2 iResolution;
uniform int iFrame;
uniform vec4 iMouse;

// --- Color palette ---

const vec3 ORBITAL_BLUE   = vec3(0.094, 0.251, 0.627);   // #1840A0
const vec3 FIREFLY_GOLD   = vec3(0.784, 0.596, 0.251);   // #C89840
const vec3 REENTRY_AMBER  = vec3(0.816, 0.502, 0.125);   // #D08020
const vec3 EARTH_GREEN    = vec3(0.165, 0.376, 0.251);    // #2A6040
const vec3 ATLANTIC_BLUE  = vec3(0.039, 0.157, 0.282);    // #0A2848
const vec3 SALMON_COPPER  = vec3(0.753, 0.439, 0.251);    // #C07040
const vec3 SALMON_SILVER  = vec3(0.753, 0.784, 0.816);    // #C0C8D0
const vec3 SPACE_BG       = vec3(0.012, 0.012, 0.039);

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

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
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
// MODE 0: Orbital Dawn — Earth's limb, sunrise, fireflies
// ============================================================

vec3 mode0_orbital_dawn(vec2 uv, float t) {
    float localT = mod(t, 15.0);
    float progress = localT / 15.0;

    vec3 col = SPACE_BG;

    // Stars in background
    col += drawStars(uv, t, 60, 42.0);

    // Earth's limb — curved horizon near the bottom
    float limbY = -0.18;
    float limbCurve = limbY - uv.x * uv.x * 0.15;
    float earthMask = smoothstep(limbCurve + 0.005, limbCurve - 0.005, uv.y);

    // Earth surface — dark side with city lights hint
    vec3 earthDark = vec3(0.01, 0.02, 0.04);
    vec3 earthSurface = earthDark;
    // Faint city clusters
    float cities = smoothstep(0.62, 0.65, vnoise(uv * 40.0 + vec2(t * 0.02, 0.0)))
                 * smoothstep(limbCurve - 0.15, limbCurve - 0.01, uv.y);
    earthSurface += vec3(0.6, 0.5, 0.2) * cities * 0.08;
    col = mix(col, earthSurface, earthMask);

    // Atmospheric glow layers along the limb
    float limbDist = uv.y - limbCurve;
    // Deep blue atmosphere
    float atmoBlue = exp(-max(limbDist, 0.0) * 25.0) * (1.0 - earthMask);
    col += ORBITAL_BLUE * atmoBlue * 0.6;
    // Cyan layer
    float atmoCyan = exp(-max(limbDist, 0.0) * 40.0) * (1.0 - earthMask);
    col += vec3(0.2, 0.6, 0.9) * atmoCyan * 0.4;
    // White thin layer at limb edge
    float atmoWhite = exp(-max(limbDist, 0.0) * 80.0) * (1.0 - earthMask);
    col += vec3(0.9, 0.95, 1.0) * atmoWhite * 0.5;

    // Sunrise: golden light spreading along the limb from the right
    float sunAngle = progress * 3.14159 * 0.5; // sun rises over the 15 seconds
    float sunX = 0.5 - progress * 0.6; // sun slides from right toward center
    vec2 sunPos = vec2(sunX, limbCurve + 0.02);

    float sunDist = length(uv - sunPos);
    // Sun glow
    float sunGlow = exp(-sunDist * 5.0) * smoothstep(0.0, 0.3, progress);
    col += vec3(1.0, 0.85, 0.5) * sunGlow * 0.7;
    // Sun core
    float sunCore = smoothstep(0.025, 0.015, sunDist) * smoothstep(0.0, 0.2, progress);
    col += vec3(1.0, 0.95, 0.85) * sunCore;

    // Sunrise color along the limb
    float limbGlow = exp(-abs(limbDist) * 30.0) * exp(-abs(uv.x - sunX) * 3.0);
    col += vec3(1.0, 0.6, 0.2) * limbGlow * smoothstep(0.0, 0.3, progress) * 0.6;

    // Glenn's "fireflies" — luminescent ice particles
    for (int i = 0; i < 30; i++) {
        float fi = float(i);
        float seed1 = hash1(fi * 17.3 + 5.0);
        float seed2 = hash1(fi * 23.7 + 11.0);
        float seed3 = hash1(fi * 31.1 + 7.0);

        // Fireflies drift slowly, appearing throughout the mode
        float spawnT = seed1 * 10.0;
        float alive = smoothstep(spawnT - 0.5, spawnT, localT);

        vec2 ffPos = vec2(seed2 * 1.6 - 0.8,
                         seed3 * 0.8 - 0.3);
        // Slow drift
        ffPos += vec2(sin(t * 0.3 + fi) * 0.02,
                      cos(t * 0.2 + fi * 1.7) * 0.015) * (localT - spawnT) * 0.1;

        float ffDist = length(uv - ffPos);
        float ff = smoothstep(0.006, 0.002, ffDist) * alive;
        // Gentle pulsing
        float pulse = 0.6 + 0.4 * sin(t * 2.0 + fi * 4.0);
        col += FIREFLY_GOLD * ff * pulse * 0.5;
        // Soft glow halo
        col += FIREFLY_GOLD * exp(-ffDist * 80.0) * alive * pulse * 0.08;
    }

    // Capsule silhouette — small dark shape against the sunrise
    vec2 capPos = vec2(sunX - 0.15, limbCurve + 0.07);
    // Truncated cone shape
    float capBody = sdBox(uv - capPos, vec2(0.008, 0.012));
    float capSil = smoothstep(0.003, -0.003, capBody);
    // Heat shield (wider bottom)
    float shieldD = sdBox(uv - capPos + vec2(0.0, 0.012), vec2(0.011, 0.003));
    float shield = smoothstep(0.002, -0.002, shieldD);
    capSil = max(capSil, shield);
    col = mix(col, vec3(0.01), capSil * 0.9);

    return col;
}

// ============================================================
// MODE 1: Three Orbits — ground tracks on Earth
// ============================================================

vec3 mode1_three_orbits(vec2 uv, float t) {
    float localT = mod(t, 15.0);
    float progress = localT / 15.0;

    // Earth as a circle (top-down view)
    float earthR = 0.38;
    float earthD = length(uv);
    float earthMask = smoothstep(earthR + 0.005, earthR - 0.005, earthD);

    // Space background
    vec3 col = SPACE_BG;
    col += drawStars(uv, t, 40, 100.0) * (1.0 - earthMask);

    // Earth surface with continents (procedural noise)
    vec3 oceanCol = ATLANTIC_BLUE;
    vec3 landCol = EARTH_GREEN;
    // Rotate continents slowly
    float rot = t * 0.03;
    vec2 earthUV = uv * 3.0 + vec2(rot, 0.0);
    float continent = fbm(earthUV * 2.5 + vec2(3.0, 1.0));
    float landMask = smoothstep(0.48, 0.55, continent);
    vec3 surfaceCol = mix(oceanCol, landCol, landMask);

    // Day/night terminator — sweeps across the disk
    float terminatorX = 0.05 * sin(t * 0.1);
    float daylight = smoothstep(terminatorX - 0.12, terminatorX + 0.12, uv.x);
    vec3 nightCol = surfaceCol * 0.08;
    vec3 dayCol = surfaceCol * 1.2;
    surfaceCol = mix(nightCol, dayCol, daylight);

    // Atmospheric rim
    float rimGlow = smoothstep(earthR - 0.03, earthR, earthD) * earthMask;
    surfaceCol += vec3(0.15, 0.35, 0.7) * rimGlow;

    col = mix(col, surfaceCol, earthMask);

    // Three orbital ground tracks (sinusoidal — inclined orbit projection)
    float inclination = 32.5 / 90.0; // Mercury orbit ~32.5 degrees
    for (int orbit = 0; orbit < 3; orbit++) {
        float orbitShift = float(orbit) * 0.22; // westward shift per orbit
        float orbitAlpha = (orbit == 0) ? 0.3 :
                           (orbit == 1) ? 0.5 : 0.9;

        // Parametric ground track
        for (int seg = 0; seg < 80; seg++) {
            float st = float(seg) / 80.0;
            float trackX = (st - 0.5) * earthR * 2.0 - orbitShift;
            float trackY = sin(st * 6.28318 * 1.5) * earthR * inclination;
            vec2 trackPos = vec2(trackX, trackY);

            if (length(trackPos) > earthR - 0.02) continue;

            float segD = length(uv - trackPos);
            float segGlow = smoothstep(0.006, 0.002, segD);

            vec3 trackCol = mix(ORBITAL_BLUE, vec3(0.3, 0.7, 1.0), 0.4);
            col += trackCol * segGlow * orbitAlpha * earthMask * 0.4;
        }

        // Tracking station dots along the ground track
        for (int sta = 0; sta < 5; sta++) {
            float staT = float(sta) / 5.0 + 0.1;
            float staX = (staT - 0.5) * earthR * 2.0 - orbitShift;
            float staY = sin(staT * 6.28318 * 1.5) * earthR * inclination;
            vec2 staPos = vec2(staX, staY);

            if (length(staPos) > earthR - 0.03) continue;

            float staD = length(uv - staPos);
            float staPulse = 0.5 + 0.5 * sin(t * 3.0 + float(sta) * 2.0 + float(orbit));
            float staDot = smoothstep(0.008, 0.004, staD) * staPulse;
            col += vec3(0.2, 0.9, 0.3) * staDot * earthMask * 0.5;
        }
    }

    // Capsule dot — moving along the current orbit track
    float capsuleParam = fract(progress * 1.2);
    int currentOrbit = int(progress * 3.0);
    float cOrbitShift = float(min(currentOrbit, 2)) * 0.22;
    float capX = (capsuleParam - 0.5) * earthR * 2.0 - cOrbitShift;
    float capY = sin(capsuleParam * 6.28318 * 1.5) * earthR * inclination;
    vec2 capPos = vec2(capX, capY);

    if (length(capPos) < earthR - 0.01) {
        float capD = length(uv - capPos);
        float capDot = smoothstep(0.010, 0.004, capD);
        col += vec3(1.0, 0.9, 0.6) * capDot * earthMask;
        // Trail
        float capGlow = exp(-capD * 30.0) * earthMask;
        col += FIREFLY_GOLD * capGlow * 0.3;
    }

    return col;
}

// ============================================================
// MODE 2: Reentry — heat shield plasma, retropack debris
// ============================================================

vec3 mode2_reentry(vec2 uv, float t) {
    float localT = mod(t, 15.0);
    float progress = localT / 15.0;

    // Intensity builds over the 15 seconds
    float intensity = 0.3 + progress * 0.7;
    vec3 col = vec3(0.0);

    // Radial distance from center
    float rd = length(uv);
    float angle = atan(uv.y, uv.x);

    // Heat shield core — white-hot center fading to orange
    float coreGlow = exp(-rd * 8.0 / intensity);
    vec3 coreCol = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.7, 0.3), rd * 3.0);
    col += coreCol * coreGlow * intensity;

    // Heat shield disk
    float shieldR = 0.06;
    float shieldD = sdCircle(uv, shieldR);
    float shieldMask = smoothstep(0.005, -0.005, shieldD);
    vec3 shieldCol = mix(vec3(1.0, 0.98, 0.9), REENTRY_AMBER, 0.3);
    col = mix(col, shieldCol * intensity * 1.5, shieldMask);

    // Plasma flow — radial streaks outward
    for (int i = 0; i < 40; i++) {
        float fi = float(i);
        float streakAngle = fi * 6.28318 / 40.0 + sin(t * 0.5 + fi) * 0.1;
        float sa = sin(streakAngle);
        float ca = cos(streakAngle);
        vec2 dir = vec2(ca, sa);

        // Project point onto this radial line
        float proj = dot(uv, dir);
        float perp = length(uv - dir * proj);

        // Streak only outward from shield
        float streakMask = smoothstep(shieldR, shieldR + 0.01, proj);
        float streakWidth = 0.003 + 0.002 * sin(fi * 7.0);
        float streak = smoothstep(streakWidth, streakWidth * 0.3, perp) * streakMask;

        // Fade with distance
        float distFade = exp(-(proj - shieldR) * 6.0);
        // Flicker
        float flicker = 0.5 + 0.5 * sin(t * 15.0 + fi * 3.7 + proj * 20.0);

        vec3 streakCol = mix(REENTRY_AMBER, vec3(0.9, 0.2, 0.05), proj * 2.0);
        col += streakCol * streak * distFade * flicker * intensity * 0.15;
    }

    // Ambient plasma glow — noise-driven
    float plasNoise = fbm(vec2(angle * 3.0, rd * 8.0 - t * 2.0));
    float plasmaRing = exp(-abs(rd - 0.12 - progress * 0.05) * 15.0);
    col += REENTRY_AMBER * plasNoise * plasmaRing * intensity * 0.4;

    // Second plasma ring (outer)
    float ring2 = exp(-abs(rd - 0.22 - progress * 0.03) * 10.0);
    col += vec3(0.6, 0.15, 0.02) * plasNoise * ring2 * intensity * 0.25;

    // Burning retropack debris — angular fragments spiraling away
    for (int d = 0; d < 8; d++) {
        float fd = float(d);
        float debrisSpawn = 2.0 + fd * 1.2;
        float debrisAge = localT - debrisSpawn;
        if (debrisAge < 0.0) continue;

        float debrisAngle = fd * 0.785 + 0.3 + debrisAge * (0.5 + hash1(fd * 5.0) * 0.8);
        float debrisR = 0.08 + debrisAge * (0.03 + hash1(fd * 11.0) * 0.02);

        vec2 debrisPos = vec2(cos(debrisAngle), sin(debrisAngle)) * debrisR;

        // Angular fragment (rotated box)
        float dAngle = debrisAge * (3.0 + fd * 0.5); // spin
        float dca = cos(dAngle);
        float dsa = sin(dAngle);
        vec2 dLocal = uv - debrisPos;
        dLocal = vec2(dLocal.x * dca - dLocal.y * dsa,
                      dLocal.x * dsa + dLocal.y * dca);

        float fragD = sdBox(dLocal, vec2(0.005, 0.003) * (1.0 - debrisAge * 0.05));
        float fragMask = smoothstep(0.003, -0.001, fragD);

        // Fragment glowing
        float heatFade = exp(-debrisAge * 0.3);
        vec3 fragCol = mix(vec3(0.4, 0.1, 0.02), REENTRY_AMBER, heatFade);
        col += fragCol * fragMask * intensity * heatFade;

        // Fire trail behind each fragment
        for (int trail = 1; trail < 6; trail++) {
            float trailT = float(trail) * 0.015;
            float tAngle = debrisAngle - trailT * (0.5 + hash1(fd * 5.0) * 0.8);
            float tR = debrisR - trailT * 2.0;
            vec2 trailPos = vec2(cos(tAngle), sin(tAngle)) * max(tR, 0.08);
            float trailD = length(uv - trailPos);
            float trailGlow = smoothstep(0.008, 0.002, trailD) * heatFade;
            col += vec3(1.0, 0.4, 0.05) * trailGlow * 0.15 * (1.0 - float(trail) / 6.0);
        }
    }

    // Overall radial gradient: dark red edges to black space
    float edgeFade = smoothstep(0.5, 0.15, rd);
    col *= edgeFade;

    // Add dark red rim glow
    float rimDist = smoothstep(0.45, 0.25, rd) * (1.0 - smoothstep(0.25, 0.1, rd));
    col += vec3(0.3, 0.03, 0.0) * rimDist * intensity * 0.5;

    return col;
}

// ============================================================
// MODE 3: Salmon Run — Chinook salmon, underwater scene
// ============================================================

// Caustic light pattern
float caustic(vec2 uv, float t) {
    float c = 0.0;
    vec2 p = uv * 4.0;
    for (int i = 0; i < 3; i++) {
        float fi = float(i + 1);
        vec2 q = p * fi + vec2(t * 0.3 * fi, t * 0.2);
        c += sin(q.x + sin(q.y + t * 0.5)) * 0.5 + 0.5;
    }
    return c / 3.0;
}

// Simple fish shape — elongated body
float sdFish(vec2 p, float size) {
    // Elliptical body
    vec2 bodyP = p / vec2(size, size * 0.3);
    float body = length(bodyP) - 1.0;

    // Tail (triangle behind body)
    vec2 tailP = p + vec2(size * 0.9, 0.0);
    float tailD = max(abs(tailP.y) - size * 0.35 * (1.0 - tailP.x / (size * 0.5)),
                      tailP.x - size * 0.4);
    tailD = max(tailD, -tailP.x);

    return min(body * size * 0.3, tailD);
}

vec3 mode3_salmon_run(vec2 uv, float t) {
    float localT = mod(t, 15.0);

    // Base water color — blue-green gradient
    float waterDepth = (uv.y + 0.5) * 0.8;
    vec3 waterShallow = vec3(0.1, 0.35, 0.4);
    vec3 waterDeep = vec3(0.02, 0.08, 0.12);
    vec3 col = mix(waterDeep, waterShallow, waterDepth);

    // River current — flowing noise
    float current = fbm(vec2(uv.x * 3.0 - t * 0.4, uv.y * 5.0 + t * 0.1));
    col += vec3(0.03, 0.06, 0.08) * current;

    // Caustic light patterns from above
    float caust = caustic(uv, t);
    float caustMask = smoothstep(0.0, 0.4, waterDepth); // stronger near surface
    col += vec3(0.15, 0.25, 0.2) * caust * caustMask * 0.4;

    // Spawning gravel at the bottom
    float gravelY = -0.38;
    float gravelMask = smoothstep(gravelY + 0.06, gravelY, uv.y);
    float gravelNoise = vnoise(uv * vec2(30.0, 15.0) + vec2(3.7, 1.2));
    vec3 gravelCol = mix(vec3(0.15, 0.12, 0.08), vec3(0.25, 0.2, 0.15), gravelNoise);
    // Individual pebble detail
    float pebbles = smoothstep(0.45, 0.55, vnoise(uv * 60.0));
    gravelCol = mix(gravelCol, gravelCol * 1.3, pebbles);
    col = mix(col, gravelCol, gravelMask);

    // Magnetic field lines — gentle curves overlaid
    for (int fl = 0; fl < 5; fl++) {
        float ffl = float(fl);
        float lineY = (ffl - 2.0) * 0.15;
        float curve = lineY + sin(uv.x * 4.0 + ffl * 1.5 + t * 0.2) * 0.06;
        float lineD = abs(uv.y - curve);
        float line = smoothstep(0.004, 0.001, lineD);
        float lineAlpha = 0.06 + 0.03 * sin(t * 0.5 + ffl);
        col += vec3(0.3, 0.5, 0.7) * line * lineAlpha;
    }

    // Salmon — swimming upstream (left to right with undulation)
    for (int s = 0; s < 7; s++) {
        float fs = float(s);
        float seed1 = hash1(fs * 13.7 + 3.0);
        float seed2 = hash1(fs * 7.3 + 17.0);
        float seed3 = hash1(fs * 23.1 + 9.0);

        // Swimming speed and position
        float swimSpeed = 0.08 + seed1 * 0.06;
        float fishX = fract(seed2 + t * swimSpeed) * 2.0 - 1.0;
        float fishY = (seed3 - 0.5) * 0.5;
        // Undulation
        fishY += sin(t * 2.0 + fs * 4.0 + fishX * 3.0) * 0.02;

        vec2 fishPos = vec2(fishX, fishY);

        // Body angle follows swimming motion
        float bodyAngle = sin(t * 3.0 + fs * 5.0) * 0.12;
        float fca = cos(bodyAngle);
        float fsa = sin(bodyAngle);
        vec2 localP = uv - fishPos;
        localP = vec2(localP.x * fca + localP.y * fsa,
                     -localP.x * fsa + localP.y * fca);

        float fishSize = 0.03 + seed1 * 0.015;
        float fishD = sdFish(localP, fishSize);
        float fishMask = smoothstep(0.004, -0.002, fishD);

        if (fishMask > 0.01) {
            // Salmon coloring: copper/silver with red undertones
            vec3 fishCol = mix(SALMON_COPPER, SALMON_SILVER, 0.4 + 0.3 * sin(localP.x * 60.0));

            // Spawning red on belly
            float bellyRed = smoothstep(0.0, -0.01, localP.y) * smoothstep(-fishSize * 0.3, 0.0, localP.y);
            fishCol = mix(fishCol, vec3(0.7, 0.15, 0.1), bellyRed * 0.5);

            // Silver flash — specular highlight
            float flash = sin(t * 5.0 + fs * 7.0) * 0.5 + 0.5;
            float flashPos = smoothstep(0.0, 0.005, -localP.y) * smoothstep(-0.01, -0.005, localP.y);
            fishCol += SALMON_SILVER * flash * flashPos * 0.4;

            // Eye
            vec2 eyePos = localP - vec2(-fishSize * 0.6, fishSize * 0.05);
            float eyeD = length(eyePos);
            float eye = smoothstep(0.003, 0.001, eyeD);
            fishCol = mix(fishCol, vec3(0.02), eye);

            col = mix(col, fishCol, fishMask);
        }
    }

    // Floating particles (sediment, organic matter)
    for (int p = 0; p < 20; p++) {
        float fp = float(p);
        vec2 partPos = vec2(hash1(fp * 11.0 + 5.0) * 1.6 - 0.8,
                           hash1(fp * 19.0 + 3.0) * 0.8 - 0.4);
        // Drift with current
        partPos.x = fract(partPos.x * 0.5 + 0.5 + t * 0.02 * (1.0 + hash1(fp * 3.0))) * 2.0 - 1.0;
        partPos.y += sin(t * 0.5 + fp * 2.0) * 0.01;

        float partD = length(uv - partPos);
        float part = smoothstep(0.003, 0.001, partD);
        col += vec3(0.4, 0.5, 0.3) * part * 0.15;
    }

    // Water surface ripple at top
    float surfaceY = 0.38;
    float surfaceWave = surfaceY + sin(uv.x * 15.0 + t * 2.0) * 0.008
                                 + sin(uv.x * 8.0 - t * 1.3) * 0.005;
    float surfaceMask = smoothstep(surfaceWave - 0.01, surfaceWave, uv.y);
    col = mix(col, vec3(0.6, 0.75, 0.7) * 0.5, surfaceMask);

    return col;
}

// ============================================================
// MAIN — Mode cycling with crossfade
// ============================================================

void main() {
    vec2 uv = (gl_FragCoord.xy - iResolution.xy * 0.5) / min(iResolution.x, iResolution.y);
    float t = iTime;
    float cycle = mod(t, 60.0);

    int mode = int(cycle / 15.0);

    // Compute current and next mode colors for crossfade
    vec3 colCurrent;
    vec3 colNext;

    if (mode == 0) {
        colCurrent = mode0_orbital_dawn(uv, t);
    } else if (mode == 1) {
        colCurrent = mode1_three_orbits(uv, t);
    } else if (mode == 2) {
        colCurrent = mode2_reentry(uv, t);
    } else {
        colCurrent = mode3_salmon_run(uv, t);
    }

    // Crossfade: compute next mode in the last second
    float modeT = mod(cycle, 15.0);
    float crossfade = smoothstep(14.0, 15.0, modeT);

    vec3 col = colCurrent;

    if (crossfade > 0.001) {
        int nextMode = int(mod(float(mode + 1), 4.0));
        if (nextMode == 0) {
            colNext = mode0_orbital_dawn(uv, t);
        } else if (nextMode == 1) {
            colNext = mode1_three_orbits(uv, t);
        } else if (nextMode == 2) {
            colNext = mode2_reentry(uv, t);
        } else {
            colNext = mode3_salmon_run(uv, t);
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
