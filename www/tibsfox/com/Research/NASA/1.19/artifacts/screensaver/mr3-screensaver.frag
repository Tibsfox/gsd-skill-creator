#version 330 core

// Mercury-Redstone 3 — "Freedom" Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Launch — Redstone A-7 flame below, capsule ascending through
//           atmosphere layers, blue sky fading to black.
//   Mode 1: Coast — The periscope view from 187.5 km. Earth curvature,
//           thin blue atmospheric line, Cape Canaveral coastline, Atlantic
//           Ocean. Stars above. Circular viewport frame. Gentle tumble.
//   Mode 2: Reentry — 11.6g: orange/white plasma envelope surrounding
//           the capsule heat shield. Fiberglass ablating in streamers.
//   Mode 3: Recovery — Blue Atlantic below, the ringsail main parachute
//           billowed above, capsule swinging. USS Lake Champlain approaching.
//
// Color palette:
//   Freedom blue:   #1848AA  (capsule stripe)
//   Flame orange:   #FF6020
//   Plasma white:   #FFE8D0
//   Atlantic blue:  #183060
//   Chute orange:   #CC6830
//
// Compile: glslangValidator mr3-screensaver.frag
// Run:     glslViewer mr3-screensaver.frag

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
const vec3 FREEDOM_BLUE  = vec3(0.094, 0.282, 0.667);
const vec3 FLAME_ORANGE  = vec3(1.0, 0.376, 0.125);
const vec3 PLASMA_WHITE  = vec3(1.0, 0.910, 0.816);
const vec3 ATLANTIC_BLUE = vec3(0.094, 0.188, 0.376);
const vec3 CHUTE_ORANGE  = vec3(0.8, 0.408, 0.188);
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
// MODE 0: Launch — Redstone ascending through atmosphere
// ============================================================

vec3 mode0_launch(vec2 uv, float t) {
  float localT = mod(t, 15.0);
  float progress = localT / 15.0;  // 0→1 over 15 seconds

  // Sky color: blue at bottom fading to black at top as altitude increases
  float skyFade = smoothstep(0.0, 0.7, progress);  // Atmosphere thins
  vec3 skyLow = vec3(0.2, 0.4, 0.8);
  vec3 skyHigh = SPACE_BG;
  vec3 skyCol = mix(skyLow, skyHigh, skyFade);

  // Gradient: darker at top
  float vertGrad = smoothstep(-0.4, 0.4, uv.y);
  vec3 col = mix(skyCol * 0.3, skyCol, vertGrad);

  // Stars fade in as sky darkens
  if (progress > 0.4) {
    float starVis = smoothstep(0.4, 0.8, progress);
    col += drawStars(uv, t, 40, 0.0) * starVis;
  }

  // Ground / launch pad (only visible early)
  if (progress < 0.3) {
    float groundY = -0.35 - progress * 1.0;
    float ground = smoothstep(groundY + 0.01, groundY, uv.y);
    vec3 groundCol = vec3(0.08, 0.10, 0.06);
    col = mix(col, groundCol, ground * (1.0 - progress * 3.0));
  }

  // Capsule position (rises from bottom to center)
  float capY = -0.25 + progress * 0.30;
  float capX = 0.0;
  vec2 capPos = vec2(capX, capY);

  // Capsule body (conical shape approximated)
  float capD = length(uv - capPos);

  // Redstone booster below capsule (long cylinder)
  float boosterLen = 0.22 * (1.0 - smoothstep(0.5, 0.7, progress));  // Drops away at staging
  vec2 boosterCenter = capPos - vec2(0.0, boosterLen * 0.5 + 0.025);
  float boosterD = sdBox(uv - boosterCenter, vec2(0.012, boosterLen * 0.5));
  float booster = smoothstep(0.003, -0.003, boosterD);
  col = mix(col, vec3(0.7, 0.7, 0.72), booster * step(progress, 0.6));

  // Black-and-white roll pattern on Redstone (instrument section stripes)
  if (booster > 0.0 && progress < 0.6) {
    float stripePhase = mod((uv.y - boosterCenter.y + boosterLen * 0.5) * 30.0, 2.0);
    float stripe = step(1.0, stripePhase);
    col = mix(col, vec3(0.15), booster * stripe * 0.4);
  }

  // Capsule (smaller, at top of booster)
  float capsuleD = sdCircle(uv - capPos, 0.015);
  float capsule = smoothstep(0.004, -0.004, capsuleD);
  col = mix(col, vec3(0.2, 0.2, 0.22), capsule);

  // Freedom 7 blue stripe
  float stripeD = sdBox(uv - capPos, vec2(0.016, 0.003));
  float blueStripe = smoothstep(0.002, -0.002, stripeD);
  col = mix(col, FREEDOM_BLUE, blueStripe * capsule * 0.7);

  // Engine flame (below booster)
  if (progress < 0.6) {
    vec2 flameBase = boosterCenter - vec2(0.0, boosterLen * 0.5);
    float flameLen = 0.15 + 0.05 * sin(t * 20.0);
    for (int i = 0; i < 20; i++) {
      float fi = float(i) / 20.0;
      float fx = flameBase.x + (hash1(fi * 7.0 + floor(t * 30.0)) - 0.5) * 0.015 * fi;
      float fy = flameBase.y - fi * flameLen;
      float fd = length(uv - vec2(fx, fy));
      float flame = smoothstep(0.012 * (1.0 - fi * 0.7), 0.003, fd);

      // Color: white core → yellow → orange → red tip
      vec3 flameCol;
      if (fi < 0.2) flameCol = vec3(1.0, 0.95, 0.85);
      else if (fi < 0.5) flameCol = vec3(1.0, 0.7, 0.2);
      else flameCol = FLAME_ORANGE * (1.0 - fi * 0.5);

      col += flameCol * flame * (1.0 - fi) * 0.12;
    }
  }

  // Staging event flash (brief white flash at separation)
  if (progress > 0.58 && progress < 0.64) {
    float flashD = length(uv - capPos - vec2(0.0, -0.03));
    float flash = exp(-flashD * 15.0) * exp(-(progress - 0.60) * 80.0);
    col += vec3(1.0, 0.9, 0.7) * flash * 0.5;
  }

  return col;
}

// ============================================================
// MODE 1: Coast — Periscope view from 187.5 km
// ============================================================

vec3 mode1_periscope(vec2 uv, float t) {
  vec3 col = SPACE_BG;
  float localT = mod(t, 15.0);

  // Gentle tumble rotation (Shepard's manual attitude control)
  float tumbleAngle = sin(localT * 0.3) * 0.08;
  float ca = cos(tumbleAngle), sa = sin(tumbleAngle);
  vec2 ruv = vec2(uv.x * ca - uv.y * sa, uv.x * sa + uv.y * ca);

  // Circular periscope viewport
  float viewportR = 0.38;
  float viewportD = length(ruv) - viewportR;

  // Outside viewport: capsule interior (dark gray)
  if (viewportD > 0.0) {
    col = vec3(0.03, 0.03, 0.04);
    // Viewport rim
    float rim = smoothstep(0.02, 0.0, abs(viewportD));
    col = mix(col, vec3(0.15, 0.15, 0.17), rim);
    // Rivet marks on viewport frame
    for (int i = 0; i < 12; i++) {
      float angle = float(i) * 3.14159 * 2.0 / 12.0;
      vec2 rivetPos = vec2(cos(angle), sin(angle)) * (viewportR + 0.015);
      float rivetD = length(ruv - rivetPos);
      float rivet = smoothstep(0.005, 0.002, rivetD);
      col = mix(col, vec3(0.12), rivet);
    }
    return col;
  }

  // Inside viewport: Earth view from 187.5 km

  // Earth curvature — large sphere, mostly below viewport
  float earthR = 2.5;
  float earthY = -earthR - 0.10;
  float earthD = length(ruv - vec2(0.0, earthY)) - earthR;
  float onEarth = step(earthD, 0.0);

  // Thin blue atmospheric line at the limb
  float atmoGlow = smoothstep(0.04, 0.0, earthD) * (1.0 - onEarth);
  col += vec3(0.15, 0.35, 0.80) * atmoGlow * 0.8;

  // Second thinner glow layer
  float atmoGlow2 = smoothstep(0.08, 0.02, earthD) * (1.0 - onEarth);
  col += vec3(0.05, 0.15, 0.40) * atmoGlow2 * 0.4;

  // Stars above Earth
  col += drawStars(ruv, t, 50, 100.0) * (1.0 - onEarth);

  // Earth surface
  if (onEarth > 0.0) {
    // Ocean base color
    vec3 oceanCol = ATLANTIC_BLUE * 0.5;

    // Cloud patterns
    float clouds = fbm(ruv * 6.0 + vec2(t * 0.005, t * 0.002));
    vec3 cloudCol = vec3(0.6, 0.62, 0.65) * smoothstep(0.45, 0.65, clouds);

    // Coastline (Cape Canaveral region — Florida peninsula hint)
    // Simple landmass shape in the lower portion of view
    float land = smoothstep(0.52, 0.55, fbm(ruv * 4.0 + vec2(3.0, 1.0)));
    vec3 landCol = vec3(0.12, 0.18, 0.08);

    vec3 surfaceCol = mix(oceanCol, landCol, land * 0.6);
    surfaceCol += cloudCol;

    // Sun glint on ocean
    float glintX = 0.1 + sin(t * 0.1) * 0.05;
    float glintD = length(ruv - vec2(glintX, earthY + earthR - 0.3));
    float glint = exp(-glintD * 8.0) * 0.15;
    surfaceCol += vec3(0.8, 0.85, 0.9) * glint;

    col = mix(col, surfaceCol, onEarth);
  }

  // Mask to circular viewport
  float viewMask = smoothstep(viewportR, viewportR - 0.005, length(ruv));
  col *= viewMask;

  return col;
}

// ============================================================
// MODE 2: Reentry — 11.6g plasma envelope
// ============================================================

vec3 mode2_reentry(vec2 uv, float t) {
  vec3 col = SPACE_BG * 0.5;
  float localT = mod(t, 15.0);

  // Heat shield at bottom, capsule above
  // Viewing from the side as plasma streams past

  // Capsule body (center of screen, slightly left)
  vec2 capPos = vec2(-0.05, 0.0);
  float capD = sdBox(uv - capPos, vec2(0.06, 0.045));

  // Heat shield curve (bottom of capsule — wider)
  float shieldD = sdCircle(uv - capPos + vec2(0.0, 0.05), 0.08);
  float shield = smoothstep(0.005, -0.005, max(shieldD, -(uv.y - capPos.y + 0.02)));

  // Capsule body
  float body = smoothstep(0.005, -0.005, capD);
  col = mix(col, vec3(0.2, 0.2, 0.22), body);
  col = mix(col, vec3(0.25, 0.18, 0.10), shield);

  // Plasma envelope — wraps around heat shield
  // Ionized gas at ~1600°C, ablating fiberglass
  float plasmaIntensity = 0.7 + 0.3 * sin(localT * 0.4);

  // Bow shock — compressed plasma in front of heat shield
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float angle = (fi / 30.0 - 0.5) * 2.8;
    float dist = 0.09 + fi * 0.004;
    float px = capPos.x - cos(angle) * dist * 0.3;
    float py = capPos.y + 0.05 - sin(angle) * dist;

    // Add turbulence
    px += (hash1(fi + floor(t * 15.0)) - 0.5) * 0.008;
    py += (hash1(fi * 3.0 + floor(t * 15.0)) - 0.5) * 0.005;

    float pd = length(uv - vec2(px, py));
    float plasma = smoothstep(0.008, 0.002, pd);

    // Color gradient: white core → yellow → orange → red edge
    vec3 plasmaCol;
    float temp = 1.0 - fi / 30.0;
    if (temp > 0.7) plasmaCol = PLASMA_WHITE;
    else if (temp > 0.4) plasmaCol = vec3(1.0, 0.7, 0.2);
    else plasmaCol = FLAME_ORANGE;

    col += plasmaCol * plasma * plasmaIntensity * 0.08;
  }

  // Ablation streamers — fiberglass particles streaming behind
  for (int i = 0; i < 15; i++) {
    float fi = float(i);
    float streamT = mod(t * 3.0 + fi * 0.4, 2.0);
    float sx = capPos.x + 0.08 + streamT * 0.25;
    float sy = capPos.y + 0.03 + (hash1(fi * 11.0) - 0.5) * 0.06;
    sy += sin(t * 5.0 + fi * 2.0) * 0.01;

    float sd = length(uv - vec2(sx, sy));
    float streamer = smoothstep(0.005, 0.001, sd);
    float fade = max(0.0, 1.0 - streamT * 0.6);
    col += FLAME_ORANGE * streamer * fade * 0.15;
  }

  // Overall plasma glow around capsule
  float glowD = length(uv - capPos + vec2(0.0, 0.03));
  float glow = exp(-glowD * 6.0) * plasmaIntensity;
  col += vec3(1.0, 0.5, 0.15) * glow * 0.25;

  // G-force indicator: pulsing brightness at 11.6g
  float gPulse = 0.8 + 0.2 * sin(localT * 3.0);
  col *= gPulse;

  // Sparse stars visible through plasma
  col += drawStars(uv, t, 15, 200.0) * 0.3;

  return col;
}

// ============================================================
// MODE 3: Recovery — parachute descent, splashdown
// ============================================================

vec3 mode3_recovery(vec2 uv, float t) {
  float localT = mod(t, 15.0);

  // Atlantic Ocean below — deep blue with wave texture
  float oceanSurf = fbm(uv * 8.0 + vec2(t * 0.03, t * 0.01));
  vec3 col = ATLANTIC_BLUE * (0.4 + oceanSurf * 0.3);

  // Horizon line
  float horizonY = -0.05 + sin(t * 0.2) * 0.01;  // Slight sway
  float sky = smoothstep(horizonY - 0.02, horizonY + 0.02, uv.y);

  // Sky above horizon
  vec3 skyCol = vec3(0.35, 0.50, 0.75);
  col = mix(col, skyCol, sky);

  // Clouds near horizon
  if (sky > 0.0) {
    float cloudY = horizonY + 0.08;
    float clouds = fbm(vec2(uv.x * 3.0 + t * 0.01, (uv.y - cloudY) * 8.0));
    float cloudMask = smoothstep(0.4, 0.6, clouds) * smoothstep(horizonY + 0.15, horizonY + 0.02, uv.y);
    col = mix(col, vec3(0.75, 0.78, 0.82), cloudMask * 0.4);
  }

  // Sun reflection on water
  float sunGlint = exp(-length(uv - vec2(0.2, horizonY - 0.1)) * 5.0);
  col += vec3(0.3, 0.35, 0.25) * sunGlint * (1.0 - sky) * 0.3;

  // Capsule — swinging under parachute
  float swingAngle = sin(localT * 1.2) * 0.08;
  float swingX = sin(swingAngle) * 0.02;
  vec2 capPos = vec2(0.0 + swingX, -0.12);

  // Parachute lines (from capsule up to canopy)
  vec2 chuteTop = vec2(0.0, 0.22);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float lineX = capPos.x + (fi - 2.0) * 0.012;
    float topX = chuteTop.x + (fi - 2.0) * 0.06;
    // Draw line segments
    for (int s = 0; s < 20; s++) {
      float fs = float(s) / 20.0;
      float lx = mix(lineX, topX, fs);
      float ly = mix(capPos.y + 0.02, chuteTop.y, fs);
      float ld = length(uv - vec2(lx, ly));
      float line = smoothstep(0.003, 0.001, ld);
      col = mix(col, vec3(0.4, 0.4, 0.42), line * 0.4);
    }
  }

  // Ringsail main parachute canopy
  float chuteR = 0.12;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float angle = (fi / 8.0) * 3.14159;  // Half-dome
    float cx = chuteTop.x + cos(angle) * chuteR;
    float cy = chuteTop.y + sin(angle) * chuteR * 0.4;  // Flattened dome
    float cd = length(uv - vec2(cx, cy));
    float canopy = smoothstep(0.015, 0.005, cd);

    // Alternating orange and white gores
    vec3 goreCol = (int(fi) % 2 == 0) ? CHUTE_ORANGE : vec3(0.85, 0.85, 0.82);
    col = mix(col, goreCol, canopy * 0.6);
  }

  // Canopy dome fill
  float domeD = sdCircle(uv - chuteTop - vec2(0.0, chuteR * 0.15), chuteR * 0.95);
  float dome = smoothstep(0.01, -0.01, domeD) * step(uv.y, chuteTop.y + chuteR * 0.5);
  vec3 domeCol = mix(CHUTE_ORANGE, vec3(0.85), fbm(uv * 15.0));
  col = mix(col, domeCol * 0.7, dome * 0.5);

  // Capsule body
  float capD = sdCircle(uv - capPos, 0.018);
  float capsule = smoothstep(0.005, -0.005, capD);
  col = mix(col, vec3(0.2, 0.2, 0.22), capsule);

  // Parachute shadow on water
  float shadowX = 0.05;
  float shadowD = sdCircle(uv - vec2(shadowX, horizonY - 0.15), 0.08);
  float shadow = smoothstep(0.02, -0.02, shadowD) * (1.0 - sky);
  col = mix(col, ATLANTIC_BLUE * 0.2, shadow * 0.3);

  // USS Lake Champlain hint (small ship shape near horizon)
  float shipX = 0.25;
  float shipY = horizonY - 0.02;
  float shipD = sdBox(uv - vec2(shipX, shipY), vec2(0.025, 0.005));
  float ship = smoothstep(0.003, -0.003, shipD);
  col = mix(col, vec3(0.3, 0.32, 0.35), ship * 0.6);

  // Ship wake
  float wakeD = abs(uv.y - shipY + 0.008) * step(uv.x, shipX + 0.02) * step(shipX - 0.06, uv.x);
  float wake = smoothstep(0.004, 0.001, wakeD) * smoothstep(shipX - 0.06, shipX + 0.02, uv.x);
  col = mix(col, vec3(0.5, 0.55, 0.6), wake * 0.2);

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
    col = mode1_periscope(uv, t);
  } else if (mode == 2) {
    col = mode2_reentry(uv, t);
  } else {
    col = mode3_recovery(uv, t);
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
