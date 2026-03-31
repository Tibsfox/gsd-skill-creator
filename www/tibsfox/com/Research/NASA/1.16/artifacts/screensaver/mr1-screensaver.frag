#version 330 core

// Mercury-Redstone 1 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Rocket on pad — brief 4-inch rise, settles back,
//           parachutes fall from top like confetti
//   Mode 1: State machine diagram — nodes and transitions
//           lighting up in wrong sequence (sneak circuit)
//   Mode 2: Dictyostelium aggregation — individual dots
//           converging toward center then dispersing
//   Mode 3: Voltaire quill — scrolling satirical text
//           "Il faut cultiver notre jardin"
//
// Color palette: Mercury Silver / Redstone Red / Pad Gray /
//                Parachute Orange / Abort Red
//   Mercury silver:    #B0B8C0
//   Redstone red:      #CC4020
//   Pad gray:          #606060
//   Parachute orange:  #E88020
//   Abort red:         #FF0000
//
// Compile: glslangValidator mr1-screensaver.frag
// Run:     glslViewer mr1-screensaver.frag
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
const vec3 REDSTONE_RED   = vec3(0.800, 0.251, 0.125);
const vec3 PAD_GRAY       = vec3(0.376, 0.376, 0.376);
const vec3 CHUTE_ORANGE   = vec3(0.910, 0.502, 0.125);
const vec3 ABORT_RED      = vec3(1.0, 0.0, 0.0);
const vec3 BG_DARK        = vec3(0.04, 0.04, 0.06);

// ============================================================
// MODE 0: Rocket on pad — 4-inch rise, parachute confetti
// ============================================================

vec3 mode0_rocket(vec2 uv, float t) {
  vec3 col = BG_DARK;
  float localT = mod(t, 15.0);

  // Ground / launch pad
  float ground = step(uv.y, 0.15);
  col = mix(col, PAD_GRAY * 0.5, ground);

  // Launch pad structure
  float pad = step(abs(uv.x), 0.12) * step(uv.y, 0.18) * step(0.12, uv.y);
  col = mix(col, PAD_GRAY * 0.8, pad);

  // Rocket body — rises 4 inches then settles back
  float risePhase = smoothstep(2.0, 3.5, localT);
  float settlePhase = smoothstep(3.5, 5.0, localT);
  float rocketY = 0.18 + 0.02 * risePhase * (1.0 - settlePhase);

  vec2 rp = uv - vec2(0.0, rocketY);
  // Capsule (top)
  float capsule = step(sdCircle(rp - vec2(0.0, 0.30), 0.035), 0.0);
  col = mix(col, MERCURY_SILVER, capsule);
  // Body cylinder
  float body = step(abs(rp.x), 0.025) * step(0.0, rp.y) * step(rp.y, 0.28);
  col = mix(col, REDSTONE_RED, body);
  // Fins
  float finL = step(sdBox(rp - vec2(-0.04, 0.02), vec2(0.02, 0.04)), 0.0);
  float finR = step(sdBox(rp - vec2(0.04, 0.02), vec2(0.02, 0.04)), 0.0);
  col = mix(col, REDSTONE_RED * 0.7, max(finL, finR));

  // Escape tower fires (after settle)
  float towerPhase = smoothstep(6.0, 6.5, localT);
  float towerGone = smoothstep(6.5, 9.0, localT);
  if (towerPhase > 0.0 && towerGone < 1.0) {
    float towerY = rocketY + 0.34 + towerPhase * 0.4;
    float towerX = towerPhase * 0.15;
    vec2 tp = uv - vec2(towerX, towerY);
    float tower = step(length(tp), 0.015);
    col = mix(col, ABORT_RED, tower * (1.0 - towerGone));
    // Tower exhaust
    float exhaust = exp(-length(tp + vec2(0.0, 0.02)) * 30.0) * (1.0 - towerGone);
    col += vec3(1.0, 0.6, 0.1) * exhaust * 0.5;
  }

  // Parachutes deploy and drape (confetti-like)
  float chutePhase = smoothstep(8.0, 9.0, localT);
  if (chutePhase > 0.0) {
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      float startX = hash1(fi * 7.3) * 0.3 - 0.15;
      float startY = 0.9 - hash1(fi * 3.7) * 0.1;
      float fallSpeed = 0.05 + hash1(fi * 11.1) * 0.04;
      float drift = sin(localT * 2.0 + fi) * 0.03;

      float chuteT = max(0.0, localT - 8.0 - fi * 0.15);
      vec2 cp = vec2(startX + drift * chuteT, startY - fallSpeed * chuteT);

      // Stop at rocket/pad level
      cp.y = max(cp.y, rocketY + hash1(fi * 5.0) * 0.25);

      float dist = length(uv - cp);
      float chute = smoothstep(0.012, 0.008, dist);
      col = mix(col, CHUTE_ORANGE, chute * chutePhase);
    }
  }

  // Brief engine flame
  float flamePhase = smoothstep(2.0, 2.5, localT) * (1.0 - smoothstep(3.5, 4.0, localT));
  if (flamePhase > 0.0) {
    vec2 fp = uv - vec2(0.0, rocketY - 0.02);
    float flame = exp(-length(fp * vec2(5.0, 2.0)) * 8.0);
    col += vec3(1.0, 0.5, 0.1) * flame * flamePhase * 0.6;
  }

  return col;
}

// ============================================================
// MODE 1: State machine diagram — sneak circuit
// ============================================================

vec3 mode1_stateMachine(vec2 uv, float t) {
  vec3 col = BG_DARK;
  float localT = mod(t, 15.0);

  // 5 states in a layout:
  //   IDLE → ARM → POWER → CONTROL → FLIGHT (correct)
  //   IDLE → ARM → CONTROL → POWER → SHUTDOWN (MR-1 actual)
  vec2 states[5];
  states[0] = vec2(-0.5, 0.15);   // IDLE
  states[1] = vec2(-0.2, 0.15);   // ARMED
  states[2] = vec2(0.1, 0.30);    // POWER DISC (correct path, top)
  states[3] = vec2(0.1, 0.0);     // CONTROL DISC (wrong path, bottom)
  states[4] = vec2(0.4, 0.30);    // FLIGHT (correct end)
  // SHUTDOWN state
  vec2 shutdownPos = vec2(0.4, 0.0);

  // Animate: correct path first, then wrong path
  float correctPhase = smoothstep(0.0, 7.0, localT);
  float wrongPhase = smoothstep(7.5, 14.0, localT);

  // Draw edges
  // Correct path: 0→1→2→4
  float e01 = sdSegment(uv, states[0], states[1]);
  float e12 = sdSegment(uv, states[1], states[2]);
  float e24 = sdSegment(uv, states[2], vec2(0.4, 0.30));

  float correctEdges = smoothstep(0.004, 0.002, e01) * step(0.0, correctPhase)
                     + smoothstep(0.004, 0.002, e12) * step(0.25, correctPhase)
                     + smoothstep(0.004, 0.002, e24) * step(0.5, correctPhase);
  col = mix(col, MERCURY_SILVER * 0.5, min(correctEdges, 1.0));

  // Wrong path: 0→1→3→shutdown
  float e13 = sdSegment(uv, states[1], states[3]);
  float e3s = sdSegment(uv, states[3], shutdownPos);

  float wrongEdges = smoothstep(0.004, 0.002, e13) * step(0.0, wrongPhase)
                   + smoothstep(0.004, 0.002, e3s) * step(0.4, wrongPhase);
  col = mix(col, ABORT_RED * 0.6, min(wrongEdges, 1.0));

  // Draw state nodes
  for (int i = 0; i < 5; i++) {
    float d = sdCircle(uv - states[i], 0.04);
    float nodeRing = smoothstep(0.004, 0.001, abs(d));
    float nodeFill = smoothstep(0.001, -0.005, d);

    vec3 nodeCol = MERCURY_SILVER;
    float isActive = 0.0;
    if (i == 0) isActive = step(0.0, correctPhase);
    else if (i == 1) isActive = step(0.15, correctPhase);
    else if (i == 2) isActive = step(0.4, correctPhase);
    else if (i == 4) isActive = step(0.7, correctPhase);

    col = mix(col, nodeCol * 0.3, nodeFill * 0.5);
    col = mix(col, nodeCol, nodeRing);

    // Pulse active nodes
    if (isActive > 0.0) {
      float pulse = 0.5 + 0.5 * sin(t * 4.0);
      col += vec3(0.1, 0.3, 0.5) * nodeFill * pulse * isActive;
    }
  }

  // Shutdown node (red)
  float sd = sdCircle(uv - shutdownPos, 0.04);
  float sdRing = smoothstep(0.004, 0.001, abs(sd));
  float sdFill = smoothstep(0.001, -0.005, sd);
  float sdActive = step(0.7, wrongPhase);
  col = mix(col, ABORT_RED * 0.3, sdFill * 0.5);
  col = mix(col, ABORT_RED, sdRing * wrongPhase);

  if (sdActive > 0.0) {
    float pulse = 0.5 + 0.5 * sin(t * 6.0);
    col += ABORT_RED * sdFill * pulse * sdActive * 0.5;
  }

  // Wrong path animated dot
  if (wrongPhase > 0.0 && wrongPhase < 1.0) {
    vec2 wrongPos;
    if (wrongPhase < 0.3) {
      wrongPos = mix(states[0], states[1], wrongPhase / 0.3);
    } else if (wrongPhase < 0.6) {
      wrongPos = mix(states[1], states[3], (wrongPhase - 0.3) / 0.3);
    } else {
      wrongPos = mix(states[3], shutdownPos, (wrongPhase - 0.6) / 0.4);
    }
    float dotD = length(uv - wrongPos);
    float dot = smoothstep(0.012, 0.006, dotD);
    col = mix(col, ABORT_RED, dot);
  }

  return col;
}

// ============================================================
// MODE 2: Dictyostelium aggregation
// ============================================================

vec3 mode2_dictyostelium(vec2 uv, float t) {
  vec3 col = BG_DARK * 1.5;  // Slightly lighter for agar plate
  float localT = mod(t, 15.0);

  // Phase: 0-5s disperse, 5-10s aggregate, 10-15s slug forms then collapses
  float aggPhase = smoothstep(3.0, 9.0, localT);
  float slugPhase = smoothstep(9.0, 12.0, localT);
  float collapsePhase = smoothstep(12.0, 14.0, localT);

  vec2 center = vec2(0.0, 0.0);

  // cAMP spiral waves (visible during aggregation)
  if (aggPhase > 0.0 && collapsePhase < 1.0) {
    float angle = atan(uv.y, uv.x);
    float dist = length(uv);
    float spiral = sin(angle * 3.0 - dist * 15.0 + t * 2.0) * 0.5 + 0.5;
    spiral *= exp(-dist * 3.0) * aggPhase * (1.0 - slugPhase);
    col += vec3(0.05, 0.15, 0.05) * spiral;
  }

  // Individual amoebae as dots
  for (int i = 0; i < 80; i++) {
    float fi = float(i);
    // Random starting positions
    float startAngle = hash1(fi * 7.13) * 6.283;
    float startDist = 0.15 + hash1(fi * 3.71) * 0.35;
    vec2 startPos = vec2(cos(startAngle), sin(startAngle)) * startDist;

    // Move toward center during aggregation
    vec2 currentPos = mix(startPos, center, aggPhase * 0.85);

    // Add wandering motion
    float wander = hash1(fi * 11.3) * 0.02;
    currentPos += vec2(sin(t * 0.5 + fi), cos(t * 0.7 + fi * 1.3)) * wander * (1.0 - aggPhase);

    // During slug phase, form into elongated shape rising up
    if (slugPhase > 0.0) {
      float slugY = slugPhase * 0.15 * (1.0 - collapsePhase);
      float slugSpread = 0.03 * (1.0 - slugPhase * 0.7);
      float fi_norm = fi / 80.0;
      currentPos = vec2(
        sin(fi_norm * 6.283) * slugSpread,
        fi_norm * slugPhase * 0.3 - 0.05 + slugY
      );

      // Collapse: slug falls back
      if (collapsePhase > 0.0) {
        currentPos.y *= (1.0 - collapsePhase);
        currentPos.x += (hash1(fi * 5.5) - 0.5) * collapsePhase * 0.2;
      }
    }

    float dotD = length(uv - currentPos);
    float dotSize = 0.004 + hash1(fi * 2.1) * 0.003;
    float dot = smoothstep(dotSize, dotSize * 0.3, dotD);

    // Color: yellow-green amoebae
    vec3 amoebaCol = mix(vec3(0.6, 0.7, 0.2), vec3(0.8, 0.9, 0.3),
                         hash1(fi * 9.0));
    col = mix(col, amoebaCol, dot);
  }

  return col;
}

// ============================================================
// MODE 3: Voltaire quill — scrolling text
// ============================================================

// Simple 5x7 pixel font for key characters
float charPixel(int ch, vec2 p) {
  if (p.x < 0.0 || p.x >= 5.0 || p.y < 0.0 || p.y >= 7.0) return 0.0;
  int x = int(p.x);
  int y = 6 - int(p.y);  // Flip Y

  // Encode a few key letters as 5x7 bitmaps
  // I
  if (ch == 73) {
    int rows[7] = int[7](0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x1F);
    return float((rows[y] >> (4-x)) & 1);
  }
  // L
  if (ch == 76) {
    int rows[7] = int[7](0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F);
    return float((rows[y] >> (4-x)) & 1);
  }
  // F
  if (ch == 70) {
    int rows[7] = int[7](0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10);
    return float((rows[y] >> (4-x)) & 1);
  }
  // A
  if (ch == 65) {
    int rows[7] = int[7](0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11);
    return float((rows[y] >> (4-x)) & 1);
  }
  // U
  if (ch == 85) {
    int rows[7] = int[7](0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E);
    return float((rows[y] >> (4-x)) & 1);
  }
  // T
  if (ch == 84) {
    int rows[7] = int[7](0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04);
    return float((rows[y] >> (4-x)) & 1);
  }
  // 4 (as in "4 inches")
  if (ch == 52) {
    int rows[7] = int[7](0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02);
    return float((rows[y] >> (4-x)) & 1);
  }
  return 0.0;
}

vec3 mode3_voltaire(vec2 uv, float t) {
  vec3 col = BG_DARK;
  float localT = mod(t, 15.0);

  // Quill pen drawing arc
  float quillAngle = localT * 0.3;
  vec2 quillPos = vec2(sin(quillAngle) * 0.3, cos(quillAngle * 0.7) * 0.2);

  // Quill trail — ink line
  float trailD = 1.0;
  for (int i = 0; i < 30; i++) {
    float fi = float(i) / 30.0;
    float pastT = localT - fi * 3.0;
    float pastAngle = pastT * 0.3;
    vec2 pastPos = vec2(sin(pastAngle) * 0.3, cos(pastAngle * 0.7) * 0.2);
    float d = length(uv - pastPos);
    trailD = min(trailD, d);
  }
  float ink = smoothstep(0.008, 0.003, trailD);
  col = mix(col, MERCURY_SILVER * 0.6, ink * 0.5);

  // Quill nib
  float quillD = length(uv - quillPos);
  float quill = smoothstep(0.015, 0.008, quillD);
  col = mix(col, CHUTE_ORANGE, quill);

  // Feather behind nib
  vec2 featherDir = normalize(vec2(cos(quillAngle * 0.3), -sin(quillAngle * 0.7)));
  vec2 featherBase = quillPos + featherDir * 0.12;
  float featherD = sdSegment(uv, quillPos, featherBase);
  float feather = smoothstep(0.006, 0.002, featherD);
  col = mix(col, MERCURY_SILVER * 0.4, feather);

  // Scrolling text at bottom: "Il faut cultiver notre jardin"
  float scrollX = mod(t * 0.08, 1.5) - 0.75;
  // Render as glowing dots at bottom of screen
  float textY = -0.35;
  float textD = abs(uv.y - textY);
  float textGlow = smoothstep(0.04, 0.01, textD);

  // Horizontal bars representing text lines
  float line1 = smoothstep(0.003, 0.001,
    abs(uv.y - textY)) * step(-0.4 + scrollX, uv.x) * step(uv.x, 0.4 + scrollX);
  float line2 = smoothstep(0.003, 0.001,
    abs(uv.y - (textY - 0.05))) * step(-0.3 + scrollX, uv.x) * step(uv.x, 0.3 + scrollX);

  // Color with parchment/ink feel
  vec3 inkCol = vec3(0.15, 0.10, 0.05);
  col = mix(col, MERCURY_SILVER * 0.3, line1 * 0.6);
  col = mix(col, MERCURY_SILVER * 0.25, line2 * 0.5);

  // "4" in large text — the number that defines this mission
  vec2 numPos = uv * 20.0 + vec2(2.5, -1.0);
  float digit4 = charPixel(52, numPos);
  float digitGlow = smoothstep(0.5, 1.0, digit4);
  float breathe = 0.4 + 0.3 * sin(t * 1.5);
  col = mix(col, REDSTONE_RED * breathe, digitGlow * 0.4);

  // Decorative border — aged parchment corners
  float border = smoothstep(0.48, 0.47, max(abs(uv.x), abs(uv.y * 0.75)));
  col = mix(col, MERCURY_SILVER * 0.08, border);

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
    col = mode0_rocket(uv, t);
  } else if (mode == 1) {
    col = mode1_stateMachine(uv, t);
  } else if (mode == 2) {
    col = mode2_dictyostelium(uv, t);
  } else {
    col = mode3_voltaire(uv, t);
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
