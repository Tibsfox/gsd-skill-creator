#version 330 core

// Mercury-Redstone 2 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Suborbital arc — capsule rising, arcing, descending
//           with g-force color gradient along the trajectory
//   Mode 1: Reaction time — flashing stimulus dot, response dot
//           with delay visualization (Ham's lever task)
//   Mode 2: Rough-skinned newt — orange belly unken reflex
//           warning display, toxin warning colors
//   Mode 3: Schubert — flowing musical staff with notes,
//           "Unfinished Symphony" motif, two movements
//
// Color palette:
//   Mercury silver:  #B0B8C0
//   Abort red:       #FF3030
//   G-force yellow:  #E8CC30
//   Newt orange:     #E87020
//   Ocean blue:      #2050A0
//   Space:           #050510
//
// Compile: glslangValidator mr2-screensaver.frag
// Run:     glslViewer mr2-screensaver.frag
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
const vec3 MERCURY_SILVER = vec3(0.690, 0.722, 0.753);
const vec3 ABORT_RED      = vec3(1.0, 0.188, 0.188);
const vec3 GFORCE_YELLOW  = vec3(0.910, 0.800, 0.188);
const vec3 NEWT_ORANGE    = vec3(0.910, 0.439, 0.125);
const vec3 OCEAN_BLUE     = vec3(0.125, 0.314, 0.627);
const vec3 SPACE_BG       = vec3(0.020, 0.020, 0.063);

// ============================================================
// MODE 0: Suborbital arc with g-force gradient
// ============================================================

vec3 mode0_suborbital(vec2 uv, float t) {
  vec3 col = SPACE_BG;
  float localT = mod(t, 15.0);

  // Earth curvature at bottom
  float earthR = 2.5;
  float earthY = -earthR + 0.05;
  float earthD = length(uv - vec2(0.0, earthY)) - earthR;
  float atmosphere = smoothstep(0.04, 0.0, earthD);
  float ground = step(earthD, 0.0);
  col = mix(col, OCEAN_BLUE * 0.3, atmosphere);
  col = mix(col, OCEAN_BLUE * 0.15, ground);

  // Atmosphere glow at edge
  float atmoGlow = smoothstep(0.06, 0.0, abs(earthD)) * 0.3;
  col += vec3(0.1, 0.2, 0.5) * atmoGlow;

  // Stars
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    vec2 starPos = vec2(hash1(fi * 7.3) * 1.2 - 0.6,
                         hash1(fi * 13.7) * 0.6 + 0.1);
    float starD = length(uv - starPos);
    float star = smoothstep(0.004, 0.001, starD);
    float twinkle = 0.5 + 0.5 * sin(t * (1.0 + hash1(fi * 3.1)) + fi);
    col += vec3(0.8, 0.85, 1.0) * star * twinkle * 0.4;
  }

  // Trajectory arc — suborbital parabola
  // Phase: 0-5s ascent, 5-10s coast/apogee, 10-15s descent
  float flightPhase = localT / 15.0;

  // Draw trajectory path (dotted arc)
  for (int i = 0; i < 60; i++) {
    float fi = float(i) / 60.0;
    // Parabolic arc: x from -0.4 to 0.4, y peaks at 0.45
    float arcX = -0.4 + fi * 0.8;
    float arcY = 0.05 + 0.40 * sin(fi * 3.14159);  // Sine arch
    vec2 arcPos = vec2(arcX, arcY);
    float arcD = length(uv - arcPos);

    // Color by g-force at this point in trajectory
    // Launch: high g, coast: 0g, reentry: highest g
    float localG;
    if (fi < 0.2) localG = 6.0;          // Ascent
    else if (fi < 0.3) localG = 9.0;     // Abort extra thrust
    else if (fi < 0.4) localG = 2.0;     // Burnout
    else if (fi < 0.6) localG = 0.0;     // Weightlessness
    else if (fi < 0.8) localG = 8.0;     // Reentry building
    else if (fi < 0.85) localG = 14.7;   // Peak
    else localG = 3.0;                    // Chutes

    vec3 gCol = mix(MERCURY_SILVER, GFORCE_YELLOW, clamp(localG / 8.0, 0.0, 1.0));
    gCol = mix(gCol, ABORT_RED, clamp((localG - 8.0) / 7.0, 0.0, 1.0));

    // Only show points up to current flight phase
    float visible = step(fi, flightPhase);
    float dot = smoothstep(0.005, 0.002, arcD) * visible;
    col = mix(col, gCol, dot * 0.7);
  }

  // Capsule position along arc
  float capX = -0.4 + flightPhase * 0.8;
  float capY = 0.05 + 0.40 * sin(flightPhase * 3.14159);
  vec2 capPos = vec2(capX, capY);
  float capD = length(uv - capPos);

  // Capsule glow
  float capsule = smoothstep(0.015, 0.005, capD);
  float currentG;
  if (flightPhase < 0.2) currentG = 6.0;
  else if (flightPhase < 0.3) currentG = 9.0;
  else if (flightPhase < 0.4) currentG = 2.0;
  else if (flightPhase < 0.6) currentG = 0.0;
  else if (flightPhase < 0.8) currentG = 8.0;
  else if (flightPhase < 0.85) currentG = 14.7;
  else currentG = 3.0;

  vec3 capCol = mix(MERCURY_SILVER, ABORT_RED, clamp(currentG / 15.0, 0.0, 1.0));
  col = mix(col, capCol, capsule);

  // Reentry glow (heating)
  if (flightPhase > 0.6 && flightPhase < 0.9) {
    float heatIntensity = sin((flightPhase - 0.6) / 0.3 * 3.14159);
    float heatGlow = exp(-capD * 15.0) * heatIntensity;
    col += vec3(1.0, 0.4, 0.1) * heatGlow * 0.4;
  }

  // Altitude marker
  float altLineD = abs(uv.x - 0.52);
  float altLine = smoothstep(0.003, 0.001, altLineD)
                * step(0.05, uv.y) * step(uv.y, 0.50);
  col = mix(col, MERCURY_SILVER * 0.3, altLine * 0.5);

  // Altitude tick at capsule height
  float tickD = sdSegment(uv, vec2(0.50, capY), vec2(0.54, capY));
  float tick = smoothstep(0.004, 0.001, tickD);
  col = mix(col, capCol, tick);

  return col;
}

// ============================================================
// MODE 1: Reaction time — Ham's lever task
// ============================================================

vec3 mode1_reaction(vec2 uv, float t) {
  vec3 col = SPACE_BG * 1.5;
  float localT = mod(t, 15.0);

  // Simulate Ham's reaction time test:
  // Light flashes (stimulus) → Ham pulls lever (response)
  // Baseline: 400ms, In-flight: 500ms

  // Stimulus light: flashes every 2 seconds
  float stimPeriod = 2.0;
  float stimPhase = mod(localT, stimPeriod);
  float stimOn = step(0.0, stimPhase) * step(stimPhase, 0.15);

  // Stimulus dot (left side)
  vec2 stimPos = vec2(-0.2, 0.0);
  float stimD = sdCircle(uv - stimPos, 0.06);
  float stimRing = smoothstep(0.005, 0.001, abs(stimD));
  float stimFill = smoothstep(0.001, -0.01, stimD);
  col = mix(col, MERCURY_SILVER * 0.3, stimRing);
  col = mix(col, GFORCE_YELLOW, stimFill * stimOn);

  // "STIMULUS" label position
  float labelY = -0.12;

  // Response dot (right side) — appears after delay
  float responseDelay;
  float responsePhase = mod(localT, stimPeriod);

  // Alternate between ground baseline (400ms) and flight (500ms)
  float isFlightTrial = step(7.5, localT);
  responseDelay = mix(0.40, 0.50, isFlightTrial);

  // Delay fraction of period
  float delayFrac = responseDelay / stimPeriod;
  float responseOn = step(delayFrac, responsePhase)
                   * step(responsePhase, delayFrac + 0.08);

  vec2 respPos = vec2(0.2, 0.0);
  float respD = sdCircle(uv - respPos, 0.06);
  float respRing = smoothstep(0.005, 0.001, abs(respD));
  float respFill = smoothstep(0.001, -0.01, respD);
  col = mix(col, MERCURY_SILVER * 0.3, respRing);
  vec3 respCol = mix(vec3(0.2, 0.8, 0.3), ABORT_RED, isFlightTrial * 0.3);
  col = mix(col, respCol, respFill * responseOn);

  // Delay visualization: animated line from stimulus to response
  if (stimPhase > 0.0 && stimPhase < delayFrac + 0.08) {
    float progress = clamp(stimPhase / delayFrac, 0.0, 1.0);
    vec2 lineStart = stimPos + vec2(0.08, 0.0);
    vec2 lineEnd = respPos - vec2(0.08, 0.0);
    vec2 currentEnd = mix(lineStart, lineEnd, progress);
    float lineD = sdSegment(uv, lineStart, currentEnd);
    float line = smoothstep(0.004, 0.001, lineD);
    col = mix(col, GFORCE_YELLOW * 0.6, line);

    // Moving dot along line
    vec2 dotPos = mix(lineStart, lineEnd, progress);
    float dotD = length(uv - dotPos);
    float dot = smoothstep(0.01, 0.004, dotD);
    col = mix(col, GFORCE_YELLOW, dot);
  }

  // G-force background effect (screen shake simulation)
  if (isFlightTrial > 0.5) {
    float gNoise = vnoise(uv * 20.0 + t * 5.0) * 0.05;
    col += vec3(0.03, 0.0, 0.0) * gNoise;

    // Vibration lines
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float lineY = (hash1(fi * 7.0 + floor(t * 3.0)) - 0.5) * 0.8;
      float lineD = abs(uv.y - lineY);
      float scanLine = smoothstep(0.003, 0.001, lineD) * 0.08;
      col += ABORT_RED * scanLine;
    }
  }

  // Mode label at bottom
  float modeBarY = -0.38;
  float barD = abs(uv.y - modeBarY);
  float modeBar = smoothstep(0.003, 0.001, barD)
                * step(-0.3, uv.x) * step(uv.x, 0.3);
  vec3 barCol = mix(vec3(0.2, 0.8, 0.3), ABORT_RED, isFlightTrial);
  col = mix(col, barCol * 0.4, modeBar * 0.5);

  return col;
}

// ============================================================
// MODE 2: Rough-skinned newt — unken reflex
// ============================================================

vec3 mode2_newt(vec2 uv, float t) {
  vec3 col = SPACE_BG;
  float localT = mod(t, 15.0);

  // The rough-skinned newt (Taricha granulosa) displays the
  // "unken reflex" when threatened: curls back to expose its
  // bright orange belly — warning predators of tetrodotoxin.

  // Phase: 0-5s resting (dark back), 5-12s unken reflex (orange belly),
  // 12-15s returns to resting
  float reflexPhase = smoothstep(4.0, 6.0, localT);
  float returnPhase = smoothstep(12.0, 14.0, localT);
  float displayPhase = reflexPhase * (1.0 - returnPhase);

  // Newt body — elongated oval
  vec2 bodyCenter = vec2(0.0, 0.0);
  float bodyLen = 0.3;
  float bodyWidth = 0.08;

  // Unken reflex: body curls, exposing belly
  float curl = displayPhase * 0.3;

  // Body shape (two overlapping ellipses for natural form)
  vec2 headPos = vec2(-0.12, curl * 0.1);
  vec2 tailPos = vec2(0.15, curl * 0.05);

  // Main body
  float bodyD = sdBox(uv - bodyCenter, vec2(bodyLen, bodyWidth * (1.0 + curl * 0.5)));
  float body = smoothstep(0.01, -0.01, bodyD - 0.03);

  // Head (slightly wider)
  float headD = sdCircle(uv - headPos - vec2(-0.08, 0.0), 0.055 + curl * 0.01);
  float head = smoothstep(0.01, -0.01, headD);

  // Tail (tapers)
  float tailTaper = max(0.0, 1.0 - (uv.x - 0.1) * 5.0) * 0.04;
  float tailD = abs(uv.y - curl * 0.02 * (uv.x - 0.1)) - tailTaper;
  float tail = smoothstep(0.01, -0.005, tailD)
             * step(0.1, uv.x) * step(uv.x, 0.35);

  float newtShape = max(max(body, head), tail);

  // Color: dorsal (dark brown/black) vs ventral (bright orange)
  vec3 dorsalCol = vec3(0.15, 0.10, 0.05);  // Dark brown-black
  vec3 ventralCol = NEWT_ORANGE;              // Bright warning orange

  // During unken reflex, belly color shows
  // The "flip" reveals the underside
  float bellyReveal = displayPhase;

  // Rough skin texture (the "rough" in rough-skinned newt)
  float skinBumps = vnoise(uv * 80.0) * 0.3 + vnoise(uv * 40.0) * 0.3;

  vec3 newtCol = mix(dorsalCol * (0.7 + skinBumps * 0.3),
                      ventralCol * (0.8 + skinBumps * 0.2),
                      bellyReveal);

  col = mix(col, newtCol, newtShape);

  // Eyes (small, dark)
  vec2 eyePos = headPos + vec2(-0.13, 0.02);
  float eyeD = sdCircle(uv - eyePos, 0.008);
  float eye = smoothstep(0.002, -0.002, eyeD);
  col = mix(col, vec3(0.05), eye * newtShape);

  // Warning rings pulsing outward during unken reflex
  if (displayPhase > 0.1) {
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float ringTime = localT - 5.0 - fi * 1.5;
      if (ringTime > 0.0) {
        float ringR = ringTime * 0.08;
        float ringD = abs(length(uv) - ringR);
        float ring = smoothstep(0.006, 0.002, ringD);
        float ringFade = max(0.0, 1.0 - ringTime * 0.3);
        col += NEWT_ORANGE * ring * ringFade * 0.3 * displayPhase;
      }
    }
  }

  // TTX molecule hint: hexagonal shapes floating
  if (displayPhase > 0.3) {
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float angle = fi / 6.0 * 6.283 + t * 0.2;
      float dist = 0.25 + 0.05 * sin(t * 0.5 + fi);
      vec2 hexPos = vec2(cos(angle), sin(angle)) * dist;

      // Simple hexagon approximation
      float hexD = sdCircle(uv - hexPos, 0.015);
      float hex = smoothstep(0.004, 0.001, abs(hexD));
      col += NEWT_ORANGE * hex * 0.2 * displayPhase;
    }
  }

  // Leaf litter background (habitat)
  float leafNoise = fbm(uv * 5.0 + vec2(0.0, t * 0.02));
  col = mix(col, vec3(0.06, 0.04, 0.02), leafNoise * 0.15);

  return col;
}

// ============================================================
// MODE 3: Schubert — Unfinished Symphony motif
// ============================================================

vec3 mode3_schubert(vec2 uv, float t) {
  vec3 col = SPACE_BG;
  float localT = mod(t, 15.0);

  // Musical staff — 5 lines
  float staffY = 0.0;
  float staffSpacing = 0.025;

  for (int i = -2; i <= 2; i++) {
    float lineY = staffY + float(i) * staffSpacing;
    float lineD = abs(uv.y - lineY);
    float line = smoothstep(0.002, 0.0005, lineD);
    col = mix(col, MERCURY_SILVER * 0.25, line);
  }

  // Scrolling notes — "Unfinished Symphony" opening motif (B minor)
  // The unfinished quality resonates with MR-2: Ham's mission was
  // the final qualification before Glenn, but the story wasn't
  // "finished" — it was the beginning

  // Note positions (pitch mapped to staff lines)
  // Simplified motif: B3 D4 F#4 A4 B4 (rising pattern)
  float notePositions[8];
  notePositions[0] = -2.0;   // B3 (below staff)
  notePositions[1] = -1.0;   // D4
  notePositions[2] = 0.0;    // F#4 (middle)
  notePositions[3] = 1.0;    // A4
  notePositions[4] = 2.0;    // B4
  notePositions[5] = 1.5;    // A#4 (descending)
  notePositions[6] = 0.5;    // G4
  notePositions[7] = -0.5;   // E4

  float scrollSpeed = 0.06;

  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float noteX = 0.5 - (localT * scrollSpeed + fi * 0.12);
    float noteY = staffY + notePositions[i] * staffSpacing;

    if (noteX > -0.6 && noteX < 0.6) {
      // Note head (filled oval)
      vec2 notePos = vec2(noteX, noteY);
      float noteD = sdCircle((uv - notePos) * vec2(1.0, 1.5), 0.012);
      float note = smoothstep(0.002, -0.002, noteD);

      // Note stem
      float stemD = abs(uv.x - noteX - 0.01);
      float stem = smoothstep(0.002, 0.0005, stemD)
                 * step(noteY, uv.y) * step(uv.y, noteY + 0.06);

      // Color: warm, golden (Schubert's Romantic era)
      vec3 noteCol = mix(GFORCE_YELLOW, NEWT_ORANGE, 0.3);
      float fadeIn = smoothstep(-0.5, -0.3, noteX);
      float fadeOut = smoothstep(0.5, 0.3, noteX);
      float alpha = fadeIn * fadeOut;

      col = mix(col, noteCol, (note + stem * 0.3) * alpha);
    }
  }

  // Second movement hint — appears in second half of cycle
  // The "Unfinished" only has 2 movements (of planned 4)
  float secondMvt = smoothstep(8.0, 10.0, localT);
  if (secondMvt > 0.0) {
    float staff2Y = -0.15;
    for (int i = -2; i <= 2; i++) {
      float lineY = staff2Y + float(i) * staffSpacing;
      float lineD = abs(uv.y - lineY);
      float line = smoothstep(0.002, 0.0005, lineD);
      col = mix(col, MERCURY_SILVER * 0.15 * secondMvt, line);
    }

    // Fewer notes, slower — the second movement is more sparse
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float noteX = 0.4 - ((localT - 8.0) * scrollSpeed * 0.7 + fi * 0.16);
      float noteY = staff2Y + sin(fi * 1.2) * 1.5 * staffSpacing;

      if (noteX > -0.5 && noteX < 0.5) {
        vec2 notePos = vec2(noteX, noteY);
        float noteD = sdCircle((uv - notePos) * vec2(1.0, 1.5), 0.012);
        float note = smoothstep(0.002, -0.002, noteD);
        col = mix(col, MERCURY_SILVER * 0.6, note * secondMvt * 0.7);
      }
    }
  }

  // "Unfinished" — the staff fades to nothing at the right edge
  // representing the two movements that were never written
  float fadeZone = smoothstep(0.3, 0.5, uv.x);
  if (fadeZone > 0.0 && localT > 11.0) {
    float unfinished = smoothstep(11.0, 13.0, localT);
    // Dotted lines suggesting unwritten music
    for (int i = -2; i <= 2; i++) {
      float lineY = staffY + float(i) * staffSpacing;
      float lineD = abs(uv.y - lineY);
      float dash = step(0.5, fract(uv.x * 30.0));
      float line = smoothstep(0.002, 0.0005, lineD) * dash;
      col = mix(col, MERCURY_SILVER * 0.1, line * fadeZone * unfinished);
    }
  }

  // Quill / pen nib at bottom (writing the score)
  float nibAngle = t * 0.4;
  vec2 nibPos = vec2(sin(nibAngle) * 0.2, -0.30 + cos(nibAngle * 0.7) * 0.05);
  float nibD = length(uv - nibPos);
  float nib = smoothstep(0.012, 0.006, nibD);
  col = mix(col, MERCURY_SILVER * 0.7, nib);

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
    col = mode0_suborbital(uv, t);
  } else if (mode == 1) {
    col = mode1_reaction(uv, t);
  } else if (mode == 2) {
    col = mode2_newt(uv, t);
  } else {
    col = mode3_schubert(uv, t);
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
