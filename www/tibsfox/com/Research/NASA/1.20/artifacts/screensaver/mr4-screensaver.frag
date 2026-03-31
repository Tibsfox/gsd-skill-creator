#version 330 core

// Mercury-Redstone 4 — "4,900 Meters" Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Launch — Redstone A-7 flame, capsule ascending. Liberty Bell 7's
//           distinctive crack-pattern paint (resembling the Liberty Bell crack)
//           visible on the capsule body.
//   Mode 1: Coast — Earth view from 190 km. Similar to MR-3 but with the
//           trapezoidal observation window instead of periscope. Grissom
//           reported the view was spectacular.
//   Mode 2: Splashdown — Capsule floating on the Atlantic, hatch cover
//           blowing off (flash), water rushing in. The capsule listing
//           and beginning to sink. Helicopter overhead, cable taut.
//   Mode 3: Sinking — THE CENTERPIECE. The capsule descending through
//           4,900 meters of ocean. Blue water fading to black through the
//           photic zone (0-200m), twilight zone (200-1000m), midnight zone
//           (1000-4000m), abyssal zone (4000-4900m). Marine snow particles
//           stream upward. Light diminishes exponentially. Final darkness.
//           In 1999, the capsule was recovered from this depth.
//
// Color palette:
//   Liberty blue:    #1A3C80  (capsule body)
//   Bell crack:      #C0C0B0  (crack paint motif)
//   Surface water:   #1060B0
//   Deep twilight:   #082040
//   Midnight:        #030810
//   Abyss:           #010204
//
// Compile: glslangValidator mr4-screensaver.frag
// Run:     glslViewer mr4-screensaver.frag

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

// --- Color palette ---
const vec3 LIBERTY_BLUE  = vec3(0.102, 0.235, 0.502);
const vec3 BELL_CRACK    = vec3(0.752, 0.752, 0.690);
const vec3 FLAME_ORANGE  = vec3(1.0, 0.376, 0.125);
const vec3 PLASMA_WHITE  = vec3(1.0, 0.910, 0.816);
const vec3 SURFACE_WATER = vec3(0.063, 0.376, 0.690);
const vec3 DEEP_TWILIGHT = vec3(0.031, 0.125, 0.251);
const vec3 MIDNIGHT      = vec3(0.012, 0.031, 0.063);
const vec3 ABYSS         = vec3(0.004, 0.008, 0.016);
const vec3 SPACE_BG      = vec3(0.020, 0.020, 0.063);

// Draw stars helper
vec3 drawStars(vec2 uv, float t, int count, float seed) {
  vec3 col = vec3(0.0);
  for (int i = 0; i < 60; i++) {
    if (i >= count) break;
    float fi = float(i) + seed;
    vec2 starPos = vec2(hash1(fi * 7.3) * 1.4 - 0.7,
                         hash1(fi * 13.7) * 0.8 - 0.4);
    float starD = length(uv - starPos);
    float star = smoothstep(0.003, 0.001, starD);
    float twinkle = 0.5 + 0.5 * sin(t * (1.0 + hash1(fi * 3.1)) + fi);
    col += vec3(0.8, 0.85, 1.0) * star * twinkle * 0.35;
  }
  return col;
}

// ============================================================
// MODE 0: Launch — Redstone ascending
// ============================================================

vec3 mode0_launch(vec2 uv, float t) {
  float localT = mod(t, 15.0);
  float progress = localT / 15.0;

  // Sky fading to black
  float skyFade = smoothstep(0.0, 0.7, progress);
  vec3 skyLow = vec3(0.2, 0.4, 0.8);
  vec3 skyHigh = SPACE_BG;
  vec3 skyCol = mix(skyLow, skyHigh, skyFade);

  float vertGrad = smoothstep(-0.4, 0.4, uv.y);
  vec3 col = mix(skyCol * 0.3, skyCol, vertGrad);

  // Stars
  if (progress > 0.4) {
    float starVis = smoothstep(0.4, 0.8, progress);
    col += drawStars(uv, t, 40, 0.0) * starVis;
  }

  // Ground (early only)
  if (progress < 0.3) {
    float groundY = -0.35 - progress * 1.0;
    float ground = smoothstep(groundY + 0.01, groundY, uv.y);
    vec3 groundCol = vec3(0.08, 0.10, 0.06);
    col = mix(col, groundCol, ground * (1.0 - progress * 3.0));
  }

  // Capsule position
  float capY = -0.25 + progress * 0.30;
  vec2 capPos = vec2(0.0, capY);

  // Redstone booster
  float boosterLen = 0.22 * (1.0 - smoothstep(0.5, 0.7, progress));
  vec2 boosterCenter = capPos - vec2(0.0, boosterLen * 0.5 + 0.025);
  float boosterD = sdBox(uv - boosterCenter, vec2(0.012, boosterLen * 0.5));
  float booster = smoothstep(0.003, -0.003, boosterD);
  col = mix(col, vec3(0.7, 0.7, 0.72), booster * step(progress, 0.6));

  // Roll pattern stripes
  if (booster > 0.0 && progress < 0.6) {
    float stripePhase = mod((uv.y - boosterCenter.y + boosterLen * 0.5) * 30.0, 2.0);
    float stripe = step(1.0, stripePhase);
    col = mix(col, vec3(0.15), booster * stripe * 0.4);
  }

  // Liberty Bell 7 capsule (distinctive crack pattern)
  float capsuleD = sdCircle(uv - capPos, 0.016);
  float capsule = smoothstep(0.004, -0.004, capsuleD);
  col = mix(col, vec3(0.18, 0.18, 0.20), capsule);

  // Liberty Bell crack motif — the distinctive paint crack line
  float crackX = uv.x - capPos.x;
  float crackY = uv.y - capPos.y;
  float crackLine = abs(crackX - sin(crackY * 50.0) * 0.002) * 200.0;
  float crack = smoothstep(2.0, 0.5, crackLine) * capsule;
  col = mix(col, BELL_CRACK, crack * 0.3);

  // Blue stripe
  float stripeD = sdBox(uv - capPos, vec2(0.017, 0.003));
  float blueStripe = smoothstep(0.002, -0.002, stripeD);
  col = mix(col, LIBERTY_BLUE, blueStripe * capsule * 0.7);

  // Engine flame
  if (progress < 0.6) {
    vec2 flameBase = boosterCenter - vec2(0.0, boosterLen * 0.5);
    float flameLen = 0.15 + 0.05 * sin(t * 22.0);
    for (int i = 0; i < 20; i++) {
      float fi = float(i) / 20.0;
      float fx = flameBase.x + (hash1(fi * 7.0 + floor(t * 30.0)) - 0.5) * 0.015 * fi;
      float fy = flameBase.y - fi * flameLen;
      float fd = length(uv - vec2(fx, fy));
      float flame = smoothstep(0.012 * (1.0 - fi * 0.7), 0.003, fd);

      vec3 flameCol;
      if (fi < 0.2) flameCol = vec3(1.0, 0.95, 0.85);
      else if (fi < 0.5) flameCol = vec3(1.0, 0.7, 0.2);
      else flameCol = FLAME_ORANGE * (1.0 - fi * 0.5);

      col += flameCol * flame * (1.0 - fi) * 0.12;
    }
  }

  // Staging flash
  if (progress > 0.58 && progress < 0.64) {
    float flashD = length(uv - capPos - vec2(0.0, -0.03));
    float flash = exp(-flashD * 15.0) * exp(-(progress - 0.60) * 80.0);
    col += vec3(1.0, 0.9, 0.7) * flash * 0.5;
  }

  return col;
}

// ============================================================
// MODE 1: Coast — View from 190 km (trapezoidal window)
// ============================================================

vec3 mode1_coast(vec2 uv, float t) {
  vec3 col = SPACE_BG;
  float localT = mod(t, 15.0);

  // Gentle attitude drift
  float driftAngle = sin(localT * 0.25) * 0.06;
  float ca = cos(driftAngle), sa = sin(driftAngle);
  vec2 ruv = vec2(uv.x * ca - uv.y * sa, uv.x * sa + uv.y * ca);

  // Trapezoidal observation window (Grissom's window, not periscope)
  float trapW_top = 0.30;
  float trapW_bot = 0.38;
  float trapH = 0.30;
  float wy = (ruv.y + trapH * 0.5) / trapH;
  float wx = mix(trapW_top, trapW_bot, wy) * 0.5;
  float insideW = step(0.0, wy) * step(wy, 1.0)
                * step(-wx, ruv.x) * step(ruv.x, wx);

  // Window frame
  if (insideW < 0.5) {
    col = vec3(0.03, 0.03, 0.04);
    // Frame edge glow
    float edgeDist = min(min(abs(ruv.x - wx), abs(ruv.x + wx)),
                        min(abs(ruv.y + trapH * 0.5), abs(ruv.y - trapH * 0.5)));
    float frameGlow = smoothstep(0.03, 0.0, edgeDist);
    col = mix(col, vec3(0.12, 0.12, 0.14), frameGlow * 0.5);
    return col;
  }

  // Earth view
  float earthR = 2.8;
  float earthY = -earthR - 0.05;
  float earthD = length(ruv - vec2(0.0, earthY)) - earthR;
  float onEarth = step(earthD, 0.0);

  // Atmospheric limb
  float atmoGlow = smoothstep(0.04, 0.0, earthD) * (1.0 - onEarth);
  col += vec3(0.15, 0.35, 0.80) * atmoGlow * 0.8;
  float atmoGlow2 = smoothstep(0.08, 0.02, earthD) * (1.0 - onEarth);
  col += vec3(0.05, 0.15, 0.40) * atmoGlow2 * 0.4;

  // Stars
  col += drawStars(ruv, t, 50, 100.0) * (1.0 - onEarth);

  // Earth surface
  if (onEarth > 0.0) {
    vec3 oceanCol = SURFACE_WATER * 0.4;
    float clouds = fbm(ruv * 6.0 + vec2(t * 0.004, t * 0.002));
    vec3 cloudCol = vec3(0.6, 0.62, 0.65) * smoothstep(0.45, 0.65, clouds);

    // Atlantic coastline — Cape Canaveral area
    float land = smoothstep(0.52, 0.55, fbm(ruv * 4.0 + vec2(3.5, 1.2)));
    vec3 landCol = vec3(0.12, 0.18, 0.08);

    vec3 surfaceCol = mix(oceanCol, landCol, land * 0.6);
    surfaceCol += cloudCol;

    // Sun glint
    float glintD = length(ruv - vec2(0.05, earthY + earthR - 0.25));
    float glint = exp(-glintD * 8.0) * 0.15;
    surfaceCol += vec3(0.8, 0.85, 0.9) * glint;

    col = mix(col, surfaceCol, onEarth);
  }

  return col;
}

// ============================================================
// MODE 2: Splashdown — Hatch blow, capsule listing
// ============================================================

vec3 mode2_splashdown(vec2 uv, float t) {
  float localT = mod(t, 15.0);
  float progress = localT / 15.0;

  // Ocean surface
  float oceanSurf = fbm(uv * 10.0 + vec2(t * 0.04, t * 0.015));
  vec3 col = SURFACE_WATER * (0.35 + oceanSurf * 0.25);

  // Wave highlights
  float waveH = smoothstep(0.55, 0.65, oceanSurf);
  col += vec3(0.2, 0.25, 0.3) * waveH * 0.2;

  // Horizon
  float horizonY = -0.02 + sin(t * 0.15) * 0.01;
  float sky = smoothstep(horizonY - 0.02, horizonY + 0.02, uv.y);
  vec3 skyCol = vec3(0.35, 0.50, 0.75);
  col = mix(col, skyCol, sky);

  // Capsule — starts floating, then lists as water enters
  float listAngle = smoothstep(0.4, 0.8, progress) * 0.3;  // Tilting
  float sinkY = smoothstep(0.5, 1.0, progress) * 0.08;     // Sinking

  vec2 capPos = vec2(0.0, -0.10 - sinkY);
  float cosa = cos(listAngle), sina = sin(listAngle);

  // Capsule body (rotated by list angle)
  vec2 rotUV = vec2(
    (uv.x - capPos.x) * cosa - (uv.y - capPos.y) * sina,
    (uv.x - capPos.x) * sina + (uv.y - capPos.y) * cosa
  );
  float capD = sdBox(rotUV, vec2(0.025, 0.015));
  float capsule = smoothstep(0.004, -0.004, capD);
  col = mix(col, vec3(0.18, 0.18, 0.20), capsule);

  // Liberty Bell crack on capsule
  float crackLine = abs(rotUV.x - sin(rotUV.y * 40.0) * 0.003) * 150.0;
  float crack = smoothstep(2.0, 0.5, crackLine) * capsule;
  col = mix(col, BELL_CRACK, crack * 0.25);

  // Hatch blow flash (at progress ~0.3)
  if (progress > 0.25 && progress < 0.40) {
    float flashIntensity = exp(-(progress - 0.30) * 40.0);
    vec2 hatchPos = capPos + vec2(0.02 * cosa, 0.02 * sina);
    float flashD = length(uv - hatchPos);
    float flash = exp(-flashD * 12.0) * flashIntensity;
    col += vec3(1.0, 0.9, 0.6) * flash * 0.8;
  }

  // Water splashing through hatch (after blow)
  if (progress > 0.35) {
    float splashAmount = smoothstep(0.35, 0.50, progress);
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float angle = fi * 0.785 + t * 2.0;
      float dist = 0.03 + splashAmount * 0.02;
      vec2 splashP = capPos + vec2(cos(angle), sin(angle)) * dist;
      float sd = length(uv - splashP);
      float splash = smoothstep(0.008, 0.003, sd);
      col = mix(col, vec3(0.4, 0.55, 0.7), splash * splashAmount * 0.3);
    }
  }

  // Helicopter above
  float heliX = -0.15 + sin(t * 0.3) * 0.03;
  float heliY = 0.18;
  float heliD = sdBox(uv - vec2(heliX, heliY), vec2(0.04, 0.008));
  float heli = smoothstep(0.003, -0.003, heliD);
  col = mix(col, vec3(0.25, 0.28, 0.30), heli * 0.7);

  // Rotor blur
  float rotorAngle = t * 30.0;
  float rotorD = sdBox(uv - vec2(heliX, heliY + 0.012),
                       vec2(0.06, 0.001));
  float rotor = smoothstep(0.003, -0.001, rotorD);
  col = mix(col, vec3(0.4, 0.4, 0.42), rotor * 0.3);

  // Cable from helicopter to capsule
  if (progress > 0.1 && progress < 0.85) {
    float cableSnap = smoothstep(0.75, 0.85, progress);
    float cableEnd = mix(capPos.y + 0.02, capPos.y + 0.08, cableSnap);
    for (int s = 0; s < 15; s++) {
      float fs = float(s) / 15.0;
      float cx = mix(heliX, capPos.x + 0.02, fs);
      float cy = mix(heliY - 0.01, cableEnd, fs);
      // Cable sag
      cy -= sin(fs * 3.14159) * 0.02 * (1.0 - cableSnap);
      float cd = length(uv - vec2(cx, cy));
      float cable = smoothstep(0.003, 0.001, cd);
      col = mix(col, vec3(0.3, 0.3, 0.32), cable * 0.5 * (1.0 - cableSnap));
    }
  }

  // Dye marker in water (green-yellow)
  float dyeD = length(uv - capPos - vec2(0.04, -0.03));
  float dye = exp(-dyeD * 6.0) * smoothstep(0.2, 0.4, progress);
  col = mix(col, vec3(0.3, 0.6, 0.1), dye * 0.3);

  return col;
}

// ============================================================
// MODE 3: Sinking — 4,900 meters (THE CENTERPIECE)
// ============================================================

vec3 mode3_sinking(vec2 uv, float t) {
  float localT = mod(t, 15.0);
  float progress = localT / 15.0;

  // Depth: 0 → 4900 meters over 15 seconds
  float depth = progress * 4900.0;

  // --- Ocean zones ---
  // Photic zone: 0-200m (surface light)
  // Twilight zone: 200-1000m (fading blue)
  // Midnight zone: 1000-4000m (near total dark)
  // Abyssal zone: 4000-4900m (absolute dark)

  // Light extinction — exponential decay
  // In the real ocean, light halves every ~75m in clear water
  float lightLevel = exp(-depth / 300.0);  // Faster for visual drama

  // Background water color — shifts from blue to black
  vec3 waterCol;
  if (depth < 200.0) {
    // Photic zone: bright blue, sunbeams visible
    float t_zone = depth / 200.0;
    waterCol = mix(SURFACE_WATER, DEEP_TWILIGHT, t_zone);
  } else if (depth < 1000.0) {
    // Twilight zone: deep blue fading
    float t_zone = (depth - 200.0) / 800.0;
    waterCol = mix(DEEP_TWILIGHT, MIDNIGHT, t_zone);
  } else if (depth < 4000.0) {
    // Midnight zone: nearly black
    float t_zone = (depth - 1000.0) / 3000.0;
    waterCol = mix(MIDNIGHT, ABYSS, t_zone);
  } else {
    // Abyssal zone: absolute darkness
    waterCol = ABYSS;
  }

  // Base water color with subtle variation
  vec3 col = waterCol + vnoise(uv * 5.0 + t * 0.1) * lightLevel * 0.03;

  // --- Sunbeams (photic zone only) ---
  if (depth < 200.0) {
    float beamVis = 1.0 - depth / 200.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float beamX = (fi - 2.0) * 0.15 + sin(t * 0.1 + fi) * 0.05;
      float beamW = 0.02 + fi * 0.005;
      float beam = smoothstep(beamW, 0.0, abs(uv.x - beamX));
      beam *= smoothstep(-0.3, 0.4, uv.y);  // Comes from above
      col += vec3(0.15, 0.25, 0.35) * beam * beamVis * 0.3;
    }
  }

  // --- Marine snow particles ---
  // Organic particles that drift downward in the real ocean.
  // From the capsule's falling perspective, they stream UPWARD.
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float px = hash1(fi * 7.3) * 1.2 - 0.6;
    float py = mod(hash1(fi * 13.1) + t * (0.05 + hash1(fi * 3.7) * 0.08)
               + progress * 2.0, 1.4) - 0.7;

    // Slight lateral drift
    px += sin(t * 0.5 + fi * 2.0) * 0.01;

    float pd = length(uv - vec2(px, py));
    float snowSize = 0.001 + hash1(fi * 5.3) * 0.002;
    float snow = smoothstep(snowSize + 0.001, snowSize, pd);

    // Visibility depends on depth and proximity to light
    float snowVis = lightLevel * 0.8 + 0.05;  // Some bioluminescence
    if (depth > 1000.0) snowVis = max(0.02, snowVis);

    col += vec3(0.7, 0.75, 0.8) * snow * snowVis * 0.4;
  }

  // --- The capsule ---
  // Slowly tumbling as it sinks, getting smaller (moving away/deeper)
  float capsuleScale = 1.0 - progress * 0.3;  // Slightly shrinks as it "falls"
  float tumble = sin(t * 0.4) * 0.2;
  float ct = cos(tumble), st = sin(tumble);

  vec2 capCenter = vec2(sin(t * 0.15) * 0.03, -0.05);
  vec2 capUV = uv - capCenter;
  capUV = vec2(capUV.x * ct - capUV.y * st,
               capUV.x * st + capUV.y * ct);

  // Capsule body
  float capD = sdBox(capUV, vec2(0.03 * capsuleScale, 0.02 * capsuleScale));
  float capsule = smoothstep(0.005, -0.005, capD);

  // Heat shield (rounded bottom)
  float shieldD = sdCircle(capUV + vec2(0.0, 0.015 * capsuleScale),
                           0.035 * capsuleScale);
  float shield = smoothstep(0.005, -0.005,
                 max(shieldD, -(capUV.y + 0.005 * capsuleScale)));

  // Capsule color — dimmed by depth
  vec3 capCol = vec3(0.18, 0.18, 0.20) * (lightLevel * 0.8 + 0.1);
  vec3 shieldCol = vec3(0.25, 0.18, 0.10) * (lightLevel * 0.8 + 0.1);
  col = mix(col, capCol, capsule);
  col = mix(col, shieldCol, shield);

  // Liberty Bell crack (visible in upper zones)
  if (lightLevel > 0.05) {
    float crackLine = abs(capUV.x - sin(capUV.y * 50.0) * 0.002) * 200.0;
    float crack = smoothstep(2.0, 0.5, crackLine) * capsule * lightLevel;
    col = mix(col, BELL_CRACK * lightLevel, crack * 0.2);
  }

  // Open hatch — dark void at the top of the capsule
  float hatchD = sdCircle(capUV - vec2(0.015 * capsuleScale, 0.01 * capsuleScale),
                          0.008 * capsuleScale);
  float hatch = smoothstep(0.003, -0.003, hatchD) * capsule;
  col = mix(col, vec3(0.01, 0.01, 0.02), hatch);

  // Bubble trail from open hatch (early depths)
  if (depth < 1500.0) {
    float bubbleVis = 1.0 - depth / 1500.0;
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      float bx = capCenter.x + 0.015 + (hash1(fi * 11.0) - 0.5) * 0.04;
      float by = capCenter.y + 0.03 + fi * 0.03
               + mod(t * (0.1 + hash1(fi * 5.0) * 0.05), 0.4);
      float bd = length(uv - vec2(bx, by));
      float bubbleR = 0.002 + hash1(fi * 3.0) * 0.003;
      float bubble = smoothstep(bubbleR + 0.002, bubbleR, bd);
      col += vec3(0.3, 0.4, 0.5) * bubble * bubbleVis * 0.3;
    }
  }

  // --- Bioluminescence (twilight + midnight zones) ---
  if (depth > 200.0 && depth < 4000.0) {
    float bioVis = smoothstep(200.0, 600.0, depth)
                 * (1.0 - smoothstep(3000.0, 4000.0, depth));
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float bx = sin(t * 0.2 + fi * 1.7) * 0.4;
      float by = cos(t * 0.15 + fi * 2.3) * 0.3;
      float bd = length(uv - vec2(bx, by));
      float bio = exp(-bd * 8.0);
      // Blue-green bioluminescence
      col += vec3(0.05, 0.15, 0.20) * bio * bioVis * 0.15
           * (0.5 + 0.5 * sin(t * 2.0 + fi * 3.0));
    }
  }

  // --- Depth counter (bottom of screen) ---
  // Visual: a fading light indicator showing depth
  float depthBar = smoothstep(-0.45, -0.43, uv.y)
                 * smoothstep(-0.40, -0.42, uv.y);
  float depthFill = 1.0 - progress;
  float barX = (uv.x + 0.5);
  float barFill = step(barX, depthFill);
  col = mix(col, SURFACE_WATER * lightLevel * 2.0, depthBar * barFill * 0.2);

  // --- Final darkness ---
  // In the last 2 seconds, everything fades to absolute black
  if (progress > 0.87) {
    float blackout = smoothstep(0.87, 1.0, progress);
    col = mix(col, vec3(0.0), blackout);
  }

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
    col = mode0_launch(uv, t);
  } else if (mode == 1) {
    col = mode1_coast(uv, t);
  } else if (mode == 2) {
    col = mode2_splashdown(uv, t);
  } else {
    col = mode3_sinking(uv, t);
  }

  // Cross-fade between modes
  float modeT = mod(cycle, 15.0);
  float fadeIn = smoothstep(0.0, 1.0, modeT);
  float fadeOut = smoothstep(14.0, 15.0, modeT);
  col *= fadeIn * (1.0 - fadeOut);

  // Slight vignette
  float vignette = 1.0 - 0.3 * length(uv);
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
