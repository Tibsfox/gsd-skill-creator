#version 330 core

// Mercury-Atlas 5 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Orbital path — capsule circling Earth, 2 complete orbits
//           with ground track projection below
//   Mode 1: Reentry corridor — narrow band between skip-out and
//           burn-up, capsule threading through the safe zone
//   Mode 2: Bull kelp forest — underwater Nereocystis luetkeana,
//           stipes, pneumatocysts, blades waving in current
//   Mode 3: Narnia wardrobe — doorway opening to reveal stars,
//           C.S. Lewis tribute (the heavens declare)
//
// Color palette:
//   Orbital blue:   #2050CC
//   Atlas silver:   #C0C0D0
//   Kelp brown:     #5A4020
//   Kelp green:     #308030
//   Ocean deep:     #081830
//
// Compile: glslangValidator ma5-screensaver.frag
// Run:     glslViewer ma5-screensaver.frag
// Install: copy to /usr/lib/xscreensaver/ or ~/.local/share/xscreensaver/

uniform float iTime;
uniform vec2 iResolution;

out vec4 fragColor;

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

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// --- Color palette ---
const vec3 ORBITAL_BLUE  = vec3(0.125, 0.314, 0.800);
const vec3 ATLAS_SILVER  = vec3(0.753, 0.753, 0.816);
const vec3 KELP_BROWN    = vec3(0.353, 0.251, 0.125);
const vec3 KELP_GREEN    = vec3(0.188, 0.502, 0.188);
const vec3 OCEAN_DEEP    = vec3(0.031, 0.094, 0.188);
const vec3 SPACE_BG      = vec3(0.020, 0.020, 0.063);

// ============================================================
// MODE 0: Orbital path — 2 complete orbits with ground track
// ============================================================

vec3 mode0_orbital(vec2 uv, float t) {
  vec3 col = SPACE_BG;
  float localT = mod(t, 15.0);

  // Earth — larger sphere, lower in view
  float earthR = 1.8;
  float earthY = -earthR - 0.10;
  float earthD = length(uv - vec2(0.0, earthY)) - earthR;
  float atmosphere = smoothstep(0.05, 0.0, earthD);
  float ground = step(earthD, 0.0);

  // Earth surface color with continent hints
  vec3 earthCol = ORBITAL_BLUE * 0.2;
  float continent = fbm(uv * 8.0 + vec2(t * 0.01, 0.0));
  earthCol = mix(earthCol, vec3(0.08, 0.15, 0.06), step(0.55, continent) * 0.5);
  col = mix(col, vec3(0.05, 0.15, 0.35), atmosphere);
  col = mix(col, earthCol, ground);

  // Atmosphere limb glow
  float limb = smoothstep(0.06, 0.0, abs(earthD)) * 0.35;
  col += vec3(0.1, 0.25, 0.6) * limb;

  // Stars
  for (int i = 0; i < 50; i++) {
    float fi = float(i);
    vec2 starPos = vec2(hash1(fi * 7.3) * 1.4 - 0.7,
                         hash1(fi * 13.7) * 0.5 + 0.15);
    float starD = length(uv - starPos);
    float star = smoothstep(0.003, 0.001, starD);
    float twinkle = 0.5 + 0.5 * sin(t * (1.0 + hash1(fi * 3.1)) + fi);
    col += vec3(0.8, 0.85, 1.0) * star * twinkle * 0.35;
  }

  // Orbital path — elliptical track above Earth
  // Two complete orbits in 15 seconds
  float orbitPhase = localT / 15.0 * 2.0;  // 0-2 = two orbits

  // Draw orbital ellipse (dotted)
  for (int i = 0; i < 80; i++) {
    float fi = float(i) / 80.0;
    float angle = fi * 6.28318;
    float orbitX = cos(angle) * 0.45;
    float orbitY = earthY + earthR + 0.08 + sin(angle) * 0.12;
    vec2 orbitPos = vec2(orbitX, orbitY);
    float orbitD = length(uv - orbitPos);

    // Color shifts between orbits
    float orbitNum = mod(orbitPhase, 1.0);
    vec3 pathCol = mix(ORBITAL_BLUE, ATLAS_SILVER, fi * 0.3);

    float visible = step(fi, mod(orbitPhase, 1.0));
    float dot = smoothstep(0.004, 0.001, orbitD);
    col = mix(col, pathCol * 0.6, dot * visible * 0.5);
  }

  // Capsule position
  float capAngle = mod(orbitPhase, 1.0) * 6.28318;
  float capX = cos(capAngle) * 0.45;
  float capY = earthY + earthR + 0.08 + sin(capAngle) * 0.12;
  vec2 capPos = vec2(capX, capY);
  float capD = length(uv - capPos);

  // Capsule glow
  float capsule = smoothstep(0.012, 0.004, capD);
  col = mix(col, ATLAS_SILVER, capsule);

  // Thruster pops visualization — small sparks near capsule
  // More frequent during second orbit
  if (orbitPhase > 1.0) {
    float popPhase = mod(localT * 4.0, 1.0);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float angle = hash1(fi + floor(localT * 4.0)) * 6.28318;
      vec2 popOffset = vec2(cos(angle), sin(angle)) * 0.02;
      float popD = length(uv - capPos - popOffset);
      float pop = smoothstep(0.006, 0.002, popD) * step(popPhase, 0.3);
      col += vec3(1.0, 0.7, 0.2) * pop * 0.4;
    }
  }

  // Ground track projection (line from capsule straight down to Earth surface)
  if (capY > earthY + earthR) {
    float trackX = capX;
    float trackY = earthY + earthR - 0.01;
    float trackD = abs(uv.x - trackX) * step(trackY, uv.y) * step(uv.y, capY);
    float trackLine = smoothstep(0.003, 0.001, trackD);
    col = mix(col, ORBITAL_BLUE * 0.3, trackLine * 0.3);

    // Ground track dot
    float gtD = length(uv - vec2(trackX, trackY));
    float gtDot = smoothstep(0.008, 0.003, gtD);
    col = mix(col, ORBITAL_BLUE * 0.5, gtDot * 0.5);
  }

  // Orbit counter indicator
  float orbitCount = floor(orbitPhase);
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float indX = -0.45 + fi * 0.03;
    float indD = sdCircle(uv - vec2(indX, 0.42), 0.006);
    float ind = smoothstep(0.002, -0.002, indD);
    float lit = step(fi, orbitCount);
    vec3 indCol = mix(ATLAS_SILVER * 0.2, ORBITAL_BLUE, lit);
    col = mix(col, indCol, ind);
  }

  return col;
}

// ============================================================
// MODE 1: Reentry corridor — threading the needle
// ============================================================

vec3 mode1_corridor(vec2 uv, float t) {
  vec3 col = SPACE_BG;
  float localT = mod(t, 15.0);

  // The reentry corridor: a narrow band of flight path angles
  // Too shallow = skip off atmosphere (bounce back to space)
  // Too steep = excessive heating and g-force (burn up)
  // MA-5 had to thread through the safe zone

  // Corridor boundaries (two diagonal bands)
  float corridorCenter = uv.x * 0.15;  // Slight slope
  float corridorWidth = 0.06;

  // Skip-out boundary (upper)
  float skipY = corridorCenter + corridorWidth;
  float skipD = abs(uv.y - skipY);
  float skipLine = smoothstep(0.004, 0.001, skipD);
  col = mix(col, vec3(0.2, 0.5, 1.0), skipLine * 0.6);

  // Burn-up boundary (lower)
  float burnY = corridorCenter - corridorWidth;
  float burnD = abs(uv.y - burnY);
  float burnLine = smoothstep(0.004, 0.001, burnD);
  col = mix(col, vec3(1.0, 0.3, 0.1), burnLine * 0.6);

  // Safe corridor fill
  float inCorridor = step(burnY, uv.y) * step(uv.y, skipY);
  col = mix(col, vec3(0.05, 0.1, 0.05), inCorridor * 0.4);

  // Atmosphere gradient (bottom = dense, top = vacuum)
  float atmoGrad = smoothstep(-0.3, 0.3, -uv.y);
  col += vec3(0.02, 0.04, 0.08) * atmoGrad;

  // Capsule entering from left, threading through corridor
  float capProgress = localT / 15.0;
  float capX = -0.5 + capProgress * 1.0;
  float capY = corridorCenter + sin(capProgress * 12.0) * 0.02;  // Slight oscillation
  vec2 capPos = vec2(capX, capY);

  if (capX > -0.5 && capX < 0.5) {
    float capD = length(uv - capPos);

    // Heat shield glow (increases with corridor depth)
    float heatIntensity = smoothstep(0.3, 0.8, capProgress);
    float heatGlow = exp(-capD * 12.0) * heatIntensity;
    col += vec3(1.0, 0.5, 0.1) * heatGlow * 0.5;
    col += vec3(1.0, 0.2, 0.05) * exp(-capD * 25.0) * heatIntensity * 0.3;

    // Capsule body
    float capsule = smoothstep(0.012, 0.005, capD);
    col = mix(col, ATLAS_SILVER, capsule);

    // Plasma trail
    for (int i = 0; i < 15; i++) {
      float fi = float(i);
      float trailX = capX - fi * 0.015;
      float trailY = capY + (hash1(fi + floor(t * 10.0)) - 0.5) * 0.01;
      float trailD = length(uv - vec2(trailX, trailY));
      float trail = smoothstep(0.006, 0.002, trailD);
      float fade = 1.0 - fi / 15.0;
      col += vec3(1.0, 0.4 + fi * 0.03, 0.1) * trail * fade * heatIntensity * 0.15;
    }
  }

  // Labels: arrows pointing to boundaries
  // Skip-out zone hash marks (above corridor)
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float hx = -0.35 + fi * 0.10;
    float hy = skipY + 0.03;
    float hd = sdSegment(uv, vec2(hx, hy), vec2(hx + 0.01, hy + 0.02));
    float hline = smoothstep(0.003, 0.001, hd);
    col = mix(col, vec3(0.2, 0.5, 1.0), hline * 0.3);
  }

  // Burn-up zone hash marks (below corridor)
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float hx = -0.35 + fi * 0.10;
    float hy = burnY - 0.03;
    float hd = sdSegment(uv, vec2(hx, hy), vec2(hx + 0.01, hy - 0.02));
    float hline = smoothstep(0.003, 0.001, hd);
    col = mix(col, vec3(1.0, 0.3, 0.1), hline * 0.3);
  }

  return col;
}

// ============================================================
// MODE 2: Bull kelp forest — Nereocystis luetkeana
// ============================================================

vec3 mode2_kelp(vec2 uv, float t) {
  vec3 col = OCEAN_DEEP;
  float localT = mod(t, 15.0);

  // Underwater scene: bull kelp (Nereocystis luetkeana)
  // Stipes rising from holdfast on bottom, gas-filled pneumatocyst
  // (bulb) at top, blades streaming from the bulb in the current

  // Water depth gradient (darker at bottom, lighter near surface)
  float depthGrad = smoothstep(-0.4, 0.4, uv.y);
  col = mix(OCEAN_DEEP, vec3(0.04, 0.12, 0.25), depthGrad * 0.6);

  // Light rays from surface
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float rayX = (fi - 2.0) * 0.15 + sin(t * 0.1 + fi) * 0.02;
    float rayD = abs(uv.x - rayX);
    float ray = smoothstep(0.04, 0.0, rayD) * depthGrad * 0.15;
    col += vec3(0.05, 0.12, 0.08) * ray;
  }

  // Particles / plankton drifting
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    vec2 partPos = vec2(
      hash1(fi * 7.1) * 1.0 - 0.5 + sin(t * 0.3 + fi * 2.0) * 0.02,
      mod(hash1(fi * 13.3) + t * 0.01 * (0.5 + hash1(fi * 3.7)), 1.0) - 0.5
    );
    float partD = length(uv - partPos);
    float part = smoothstep(0.004, 0.001, partD);
    col += vec3(0.1, 0.15, 0.08) * part * 0.3;
  }

  // Bull kelp stipes (3 plants at different positions)
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float baseX = (fk - 1.0) * 0.22;
    float baseY = -0.40;
    float topY = 0.20 + fk * 0.05;

    // Holdfast at bottom (root-like structure)
    float hfD = sdCircle(uv - vec2(baseX, baseY), 0.025);
    float holdfast = smoothstep(0.008, -0.005, hfD);
    col = mix(col, KELP_BROWN * 0.6, holdfast);

    // Stipe (long, thin, slightly curved by current)
    for (int s = 0; s < 40; s++) {
      float fs = float(s) / 40.0;
      float stipeY = baseY + fs * (topY - baseY);
      float sway = sin(t * 0.5 + fs * 4.0 + fk * 2.0) * 0.03 * fs;
      float stipeX = baseX + sway;
      float stipeD = length(uv - vec2(stipeX, stipeY));

      // Stipe gets thinner toward top
      float width = 0.004 - fs * 0.002;
      float stipe = smoothstep(width + 0.002, width, stipeD);
      vec3 stipeCol = mix(KELP_BROWN, KELP_GREEN * 0.7, fs);
      col = mix(col, stipeCol, stipe * 0.7);
    }

    // Pneumatocyst (gas-filled bulb at top)
    float topSway = sin(t * 0.5 + 4.0 + fk * 2.0) * 0.03;
    vec2 bulbPos = vec2(baseX + topSway, topY);
    float bulbD = sdCircle(uv - bulbPos, 0.018);
    float bulb = smoothstep(0.005, -0.005, bulbD);
    // Bulb is golden-brown, slightly translucent
    vec3 bulbCol = mix(KELP_BROWN, vec3(0.5, 0.35, 0.15), 0.5);
    col = mix(col, bulbCol, bulb);

    // Gas highlight on bulb
    float highlightD = sdCircle(uv - bulbPos - vec2(-0.005, 0.005), 0.006);
    float highlight = smoothstep(0.003, 0.0, highlightD);
    col += vec3(0.15, 0.12, 0.05) * highlight * bulb;

    // Blades streaming from pneumatocyst (long, flat, waving)
    for (int b = 0; b < 6; b++) {
      float fb = float(b);
      float bladeAngle = (fb / 6.0 - 0.5) * 1.5 + sin(t * 0.3 + fb) * 0.3;

      for (int seg = 0; seg < 15; seg++) {
        float fseg = float(seg) / 15.0;
        float bladeLen = 0.12 + hash1(fb * 3.0 + fk * 7.0) * 0.06;
        float bx = bulbPos.x + sin(bladeAngle + fseg * 1.5 + sin(t * 0.7 + fb) * 0.4) * bladeLen * fseg;
        float by = bulbPos.y + cos(bladeAngle) * bladeLen * fseg * 0.3;

        float bladeD = length(uv - vec2(bx, by));
        float bladeWidth = 0.003 * (1.0 - fseg * 0.5);
        float blade = smoothstep(bladeWidth + 0.002, bladeWidth, bladeD);
        col = mix(col, KELP_GREEN * (0.6 + fseg * 0.3), blade * 0.5);
      }
    }
  }

  // Ocean current lines
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float cy = -0.3 + fi * 0.18;
    float cx = mod(t * 0.03 + fi * 0.3, 1.4) - 0.7;
    float cd = sdSegment(uv, vec2(cx, cy), vec2(cx + 0.08, cy + 0.005));
    float cline = smoothstep(0.003, 0.001, cd);
    col += vec3(0.05, 0.1, 0.15) * cline * 0.2;
  }

  return col;
}

// ============================================================
// MODE 3: Narnia wardrobe — doorway opening to stars
// ============================================================

vec3 mode3_narnia(vec2 uv, float t) {
  vec3 col = vec3(0.02, 0.01, 0.01);  // Dark interior
  float localT = mod(t, 15.0);

  // C.S. Lewis tribute: "The heavens declare the glory of God"
  // A wardrobe door slowly opens, revealing stars beyond

  // Door opening animation
  float doorOpen = smoothstep(2.0, 10.0, localT);

  // Wardrobe frame (dark wood)
  float frameD = sdBox(uv, vec2(0.28, 0.42));
  float frame = smoothstep(0.01, -0.01, abs(frameD) - 0.02);
  vec3 woodCol = vec3(0.12, 0.06, 0.03);
  float woodGrain = vnoise(uv * vec2(3.0, 30.0)) * 0.3;
  col = mix(col, woodCol * (0.7 + woodGrain), frame);

  // Door panels (two doors opening outward)
  float doorWidth = 0.25 * (1.0 - doorOpen);

  // Left door
  float leftDoorD = sdBox(uv - vec2(-doorWidth * 0.5, 0.0), vec2(doorWidth * 0.5, 0.38));
  float leftDoor = smoothstep(0.005, -0.005, leftDoorD);
  float ldGrain = vnoise((uv - vec2(-doorWidth * 0.5, 0.0)) * vec2(4.0, 25.0)) * 0.25;
  col = mix(col, woodCol * (0.5 + ldGrain), leftDoor);

  // Right door
  float rightDoorD = sdBox(uv - vec2(doorWidth * 0.5, 0.0), vec2(doorWidth * 0.5, 0.38));
  float rightDoor = smoothstep(0.005, -0.005, rightDoorD);
  float rdGrain = vnoise((uv - vec2(doorWidth * 0.5, 0.0)) * vec2(4.0, 25.0)) * 0.25;
  col = mix(col, woodCol * (0.5 + rdGrain), rightDoor);

  // Door knobs
  float knobLd = sdCircle(uv - vec2(-doorWidth + 0.02, 0.0), 0.008);
  float knobL = smoothstep(0.002, -0.002, knobLd);
  col = mix(col, vec3(0.5, 0.4, 0.15), knobL * leftDoor);

  float knobRd = sdCircle(uv - vec2(doorWidth - 0.02, 0.0), 0.008);
  float knobR = smoothstep(0.002, -0.002, knobRd);
  col = mix(col, vec3(0.5, 0.4, 0.15), knobR * rightDoor);

  // Opening area — stars visible through the gap
  float openGap = doorOpen * 0.25;  // Width of opening
  float openD = sdBox(uv, vec2(openGap, 0.38));
  float opening = smoothstep(0.005, -0.005, openD);

  if (opening > 0.0) {
    // Star field through the doorway
    vec3 starfield = SPACE_BG;

    // Deep nebula background
    float nebula = fbm(uv * 4.0 + vec2(t * 0.02, 0.0));
    starfield += vec3(0.05, 0.02, 0.08) * nebula;

    // Stars
    for (int i = 0; i < 60; i++) {
      float fi = float(i);
      vec2 starPos = vec2(hash1(fi * 7.3 + 100.0) * 0.6 - 0.3,
                           hash1(fi * 13.7 + 200.0) * 0.8 - 0.4);
      float starD = length(uv - starPos);
      float brightness = hash1(fi * 23.1);
      float star = smoothstep(0.003, 0.001, starD) * brightness;
      float twinkle = 0.6 + 0.4 * sin(t * (1.5 + hash1(fi * 5.3)) + fi);

      // Star color variation
      vec3 starCol;
      if (brightness > 0.8)
        starCol = vec3(0.9, 0.95, 1.0);  // Blue-white
      else if (brightness > 0.5)
        starCol = vec3(1.0, 0.95, 0.8);  // Yellow-white
      else
        starCol = vec3(1.0, 0.7, 0.5);   // Warm

      starfield += starCol * star * twinkle * 0.6;
    }

    // One bright star (Narnia's guiding star)
    vec2 brightPos = vec2(0.0, 0.15);
    float brightD = length(uv - brightPos);
    float bright = exp(-brightD * 20.0) * doorOpen;
    starfield += vec3(0.8, 0.85, 1.0) * bright * 0.4;
    float brightCore = smoothstep(0.005, 0.001, brightD);
    starfield += vec3(1.0) * brightCore * doorOpen;

    // Cross-shaped diffraction spikes on the bright star
    float spikeH = smoothstep(0.003, 0.0005, abs(uv.y - brightPos.y))
                 * exp(-abs(uv.x - brightPos.x) * 15.0);
    float spikeV = smoothstep(0.003, 0.0005, abs(uv.x - brightPos.x))
                 * exp(-abs(uv.y - brightPos.y) * 15.0);
    starfield += vec3(0.6, 0.65, 0.9) * (spikeH + spikeV) * doorOpen * 0.3;

    col = mix(col, starfield, opening);
  }

  // Light spilling from the opening onto the dark interior
  if (doorOpen > 0.1) {
    float spillD = sdBox(uv, vec2(openGap + 0.05, 0.42));
    float spill = smoothstep(0.1, 0.0, max(0.0, spillD)) * doorOpen;
    col += vec3(0.04, 0.04, 0.08) * spill;
  }

  // Fur coats hanging inside (you can just see them in the dark)
  // The wardrobe passage from The Lion, the Witch and the Wardrobe
  if (doorOpen > 0.3) {
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float coatX = (fi - 1.5) * 0.08;
      // Only visible in the door-adjacent areas, not through the opening
      float coatVisible = step(openGap, abs(uv.x - coatX) + 0.05);
      float coatD = sdBox(uv - vec2(coatX, 0.05), vec2(0.015, 0.15));
      float coat = smoothstep(0.008, -0.005, coatD);
      col = mix(col, vec3(0.06, 0.04, 0.03) * (0.8 + fi * 0.1),
                coat * coatVisible * 0.3 * doorOpen);
    }
  }

  // Vignette for mood
  float vignette = 1.0 - 0.5 * length(uv * 1.2);
  col *= max(0.3, vignette);

  return col;
}

// ============================================================
// MAIN — Mode cycling
// ============================================================

void main() {
  vec2 uv = (gl_FragCoord.xy - iResolution.xy * 0.5) / min(iResolution.x, iResolution.y);
  float t = iTime;
  float cycle = mod(t, 60.0);

  int mode = int(cycle / 15.0);

  vec3 col;
  if (mode == 0) {
    col = mode0_orbital(uv, t);
  } else if (mode == 1) {
    col = mode1_corridor(uv, t);
  } else if (mode == 2) {
    col = mode2_kelp(uv, t);
  } else {
    col = mode3_narnia(uv, t);
  }

  // Cross-fade between modes (1-second transition)
  float modeT = mod(cycle, 15.0);
  float fadeIn = smoothstep(0.0, 1.0, modeT);
  float fadeOut = smoothstep(14.0, 15.0, modeT);
  col *= fadeIn * (1.0 - fadeOut);

  // Slight vignette
  float vignette = 1.0 - 0.3 * length(uv);
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
