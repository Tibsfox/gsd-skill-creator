#version 330 core

// Explorer 4 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Nuclear detonation flash → expanding particle shell → magnetic trapping
//           The Argus flash in the South Atlantic, electrons injecting into field lines
//   Mode 1: Particles spiraling along magnetic field lines, bouncing between mirror points
//           The core physics of radiation belts made visible
//   Mode 2: Cladonia stellaris star-burst branching growth
//           The lichen that absorbs what the sky releases, fractal branching
//   Mode 3: Jung mandala — circular symmetric pattern evolving
//           The shadow made visible: what we cannot see still shapes us
//
// Color palette: Nuclear / Radiation / Lichen
//   Nuclear white:    #FFFFFF (detonation flash)
//   Aurora green:     #40FF80 (trapped particles, northern lights)
//   Radiation amber:  #D4A830 (high-energy particles, warning)
//   Lichen pale:      #C8D8A0 (Cladonia stellaris, pale yellow-green)
//   Deep space:       #050510 (background)
//
// Compile: glslangValidator explorer4-screensaver.frag
// Run:     glslViewer explorer4-screensaver.frag
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

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// --- Colors ---
const vec3 NUCLEAR_WHITE   = vec3(1.000, 1.000, 1.000);   // #FFFFFF
const vec3 AURORA_GREEN    = vec3(0.251, 1.000, 0.502);   // #40FF80
const vec3 RADIATION_AMBER = vec3(0.831, 0.659, 0.188);   // #D4A830
const vec3 LICHEN_PALE     = vec3(0.784, 0.847, 0.627);   // #C8D8A0
const vec3 DEEP_SPACE      = vec3(0.020, 0.020, 0.063);   // #050510
const vec3 FIELD_BLUE      = vec3(0.150, 0.250, 0.600);   // field lines
const vec3 MANDALA_GOLD    = vec3(0.800, 0.700, 0.300);   // Jung mandala
const vec3 MANDALA_DEEP    = vec3(0.300, 0.100, 0.400);   // mandala shadow
const vec3 FLASH_CORE      = vec3(1.000, 0.950, 0.800);   // detonation core

// ============================================================
// Mode 0: Nuclear Detonation → Particle Shell → Trapping
// ============================================================
// A point of nuclear white expands outward as a spherical shell.
// The shell encounters magnetic field lines (dipole curves) and
// particles begin spiraling along them, transitioning from white
// to aurora green as they become trapped.

vec4 nuclearDetonation(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  vec2 center = vec2(0.5, 0.35); // detonation point (South Atlantic, below equator)
  float dist = length(uv - center);

  // Phase timing within 15-second mode
  float flash_phase = t * 0.8;    // controls expansion

  // --- Initial flash (first 2 seconds) ---
  float flash_radius = flash_phase * 0.15;
  float flash_ring = smoothstep(flash_radius + 0.02, flash_radius, dist) *
                     smoothstep(flash_radius - 0.08, flash_radius, dist);
  float flash_bright = max(0.0, 1.0 - flash_phase * 0.3);
  col += NUCLEAR_WHITE * flash_ring * flash_bright;

  // --- Expanding particle shell ---
  float shell_radius = flash_phase * 0.06;
  float shell = smoothstep(shell_radius + 0.015, shell_radius, dist) *
                smoothstep(shell_radius - 0.015, shell_radius, dist);
  float shell_bright = max(0.0, 1.0 - flash_phase * 0.08);
  col += mix(NUCLEAR_WHITE, AURORA_GREEN, min(flash_phase * 0.15, 1.0)) * shell * shell_bright * 0.6;

  // --- Magnetic field lines (dipole) ---
  float angle = atan(uv.y - 0.5, uv.x - 0.5);
  float r = length(uv - vec2(0.5, 0.5));
  // Dipole field lines: r = L * cos^2(theta)
  for (int i = 1; i <= 5; i++) {
    float L = float(i) * 0.12;
    float field_r = L * pow(cos(angle), 2.0);
    float line_dist = abs(r - field_r);
    float line_bright = smoothstep(0.005, 0.001, line_dist) * 0.15;
    col += FIELD_BLUE * line_bright * min(flash_phase * 0.2, 1.0);
  }

  // --- Trapped particles spiraling ---
  if (flash_phase > 3.0) {
    float trap_phase = (flash_phase - 3.0) * 2.0;
    for (int p = 0; p < 8; p++) {
      float pf = float(p) * 0.785 + t * 3.0;
      float pr = 0.15 + 0.05 * sin(pf * 0.7);
      float pa = pf + sin(t * 5.0 + float(p)) * 0.3;
      vec2 pp = vec2(0.5, 0.5) + pr * vec2(cos(pa), sin(pa) * 0.4);
      float pd = length(uv - pp);
      float glow = smoothstep(0.015, 0.003, pd) * min(trap_phase * 0.3, 0.8);
      col += AURORA_GREEN * glow;
    }
  }

  // --- Stars ---
  float star = step(0.997, hash(floor(uv * 200.0)));
  col += vec3(0.5, 0.5, 0.6) * star * 0.3;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Particle Spiraling Along Field Lines
// ============================================================
// Magnetic dipole field lines drawn as curves. Particles (bright dots)
// spiral along them, bouncing between mirror points near the poles.
// Speed varies: fast at equator, slow at mirror points.

vec4 particleSpiral(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  vec2 earth_center = vec2(0.5, 0.5);
  float earth_r = 0.06;

  // Draw Earth
  float earth_dist = length(uv - earth_center);
  if (earth_dist < earth_r) {
    float lat = (uv.y - earth_center.y) / earth_r;
    col = mix(vec3(0.1, 0.2, 0.5), vec3(0.15, 0.4, 0.25), smoothstep(-0.5, 0.5, lat));
    col += vec3(0.1) * vnoise(uv * 80.0);
  }

  // --- Magnetic field lines (dipole: r = L * cos^2(lambda)) ---
  float angle_from_eq = atan(uv.y - earth_center.y, uv.x - earth_center.x);
  float r_from_center = length(uv - earth_center);

  for (int i = 1; i <= 7; i++) {
    float L = float(i) * 0.06 + 0.04;
    // Draw field line as parametric curve
    for (float theta = -1.4; theta < 1.4; theta += 0.02) {
      float fr = L * pow(cos(theta), 2.0);
      vec2 fp = earth_center + fr * vec2(cos(theta), sin(theta));
      float fd = length(uv - fp);
      float line_alpha = smoothstep(0.004, 0.001, fd) * 0.2;
      col += FIELD_BLUE * line_alpha;
    }
  }

  // --- Bouncing particles ---
  for (int p = 0; p < 6; p++) {
    float L = 0.10 + float(p) * 0.05;
    // Bounce phase: oscillate latitude with time
    float bounce_freq = 1.5 + float(p) * 0.3;
    float lambda = sin(t * bounce_freq + float(p) * 1.1) * 1.2;
    float pr = L * pow(cos(lambda), 2.0);
    vec2 pp = earth_center + pr * vec2(cos(lambda), sin(lambda));

    float pd = length(uv - pp);

    // Brightness: brighter at mirror points (high latitude)
    float mirror_bright = 0.4 + 0.6 * abs(sin(lambda));

    // Color: green at equator, amber near mirrors
    vec3 pcol = mix(AURORA_GREEN, RADIATION_AMBER, abs(sin(lambda)));

    float glow = smoothstep(0.012, 0.002, pd) * mirror_bright;
    col += pcol * glow;

    // Spiral trail (fainter)
    for (float trail = 0.05; trail < 0.3; trail += 0.05) {
      float tl = lambda - trail * sign(cos(t * bounce_freq + float(p) * 1.1));
      float tr = L * pow(cos(tl), 2.0);
      vec2 tp = earth_center + tr * vec2(cos(tl), sin(tl));
      float td = length(uv - tp);
      float trail_glow = smoothstep(0.008, 0.002, td) * (0.3 - trail) * 0.5;
      col += pcol * trail_glow * 0.4;
    }
  }

  // Stars
  float star = step(0.997, hash(floor(uv * 180.0)));
  col += vec3(0.5) * star * 0.3;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Cladonia stellaris — Star-burst Branching Growth
// ============================================================
// Fractal branching structure of reindeer lichen. Pale yellow-green
// branches radiate from multiple growth points, each branch splitting
// into finer branches. Star-tipped ends glow slightly brighter.

vec4 lichenGrowth(vec2 uv, float t) {
  vec3 col = DEEP_SPACE * 1.5; // slightly lighter background (tundra night)

  // Growth time cycles slowly
  float grow = fract(t * 0.05) * 8.0;

  // Multiple lichen colonies
  for (int c = 0; c < 4; c++) {
    vec2 colony_center = vec2(
      0.2 + float(c) * 0.2 + 0.05 * sin(float(c) * 2.3),
      0.4 + 0.15 * cos(float(c) * 1.7)
    );

    float colony_dist = length(uv - colony_center);

    // Branching structure using polar coordinates from colony center
    vec2 local = uv - colony_center;
    float a = atan(local.y, local.x);
    float r = length(local);

    // Branch pattern: multiple radial arms with fractal splitting
    float branch = 0.0;
    float scale = 1.0;
    float freq = 5.0 + float(c);
    for (int level = 0; level < 4; level++) {
      float arm = abs(sin(a * freq + float(level) * 1.5));
      float radial = smoothstep(0.0, grow * 0.05 * scale, r) *
                     smoothstep(grow * 0.05 * scale + 0.02, grow * 0.05 * scale, r);
      branch += arm * (1.0 - r * 4.0) * scale * 0.3;
      freq *= 2.1;
      scale *= 0.5;
    }

    branch = max(0.0, branch);

    // Star tips: bright points at branch ends
    float star_tips = 0.0;
    for (int s = 0; s < 8; s++) {
      float sa = float(s) * 0.785 + float(c) * 0.5;
      float sr = grow * 0.04 + 0.01 * sin(sa * 3.0 + t);
      vec2 sp = colony_center + sr * vec2(cos(sa), sin(sa));
      float sd = length(uv - sp);
      star_tips += smoothstep(0.008, 0.002, sd) * 0.6;
    }

    // Color: pale lichen green-yellow
    vec3 lichen_col = mix(LICHEN_PALE, LICHEN_PALE * 1.3, star_tips);
    float alpha = branch * smoothstep(0.25, 0.0, colony_dist);

    col += lichen_col * alpha;
    col += LICHEN_PALE * star_tips * 0.4;
  }

  // Subtle ground texture (tundra)
  float ground = fbm(uv * 15.0 + t * 0.1) * 0.04;
  col += vec3(0.15, 0.12, 0.08) * ground;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Jung Mandala — Circular Symmetric Pattern
// ============================================================
// Evolving circular symmetric pattern inspired by Jung's mandalas.
// The mandala is the Self made visible — the wholeness that includes
// the shadow. The pattern evolves slowly, maintaining perfect
// rotational symmetry with 8-fold or 12-fold divisions.

vec4 jungMandala(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  vec2 center = vec2(0.5, 0.5);
  vec2 p = uv - center;
  float r = length(p);
  float a = atan(p.y, p.x);

  // Fold angle for symmetry (12-fold)
  float fold = 12.0;
  float fa = mod(a + 3.14159, 6.28318 / fold);
  fa = abs(fa - 3.14159 / fold);

  // --- Outer ring ---
  float outer_ring = smoothstep(0.38, 0.37, r) * smoothstep(0.35, 0.36, r);
  col += MANDALA_GOLD * outer_ring * 0.6;

  // --- Rotating petal layers ---
  for (int layer = 0; layer < 4; layer++) {
    float lr = 0.08 + float(layer) * 0.07;
    float la = fa + t * (0.1 + float(layer) * 0.05);
    float petal = smoothstep(0.04, 0.02, abs(r - lr)) *
                  (0.5 + 0.5 * cos(la * fold));
    vec3 pcol = mix(MANDALA_GOLD, MANDALA_DEEP, float(layer) / 4.0);
    col += pcol * petal * 0.4;
  }

  // --- Central sun/shadow ---
  float core_dist = r;
  float core = smoothstep(0.06, 0.02, core_dist);
  float shadow = smoothstep(0.02, 0.05, core_dist) * smoothstep(0.08, 0.06, core_dist);

  // Core alternates between gold (consciousness) and deep purple (shadow)
  float phase = 0.5 + 0.5 * sin(t * 0.3);
  vec3 core_col = mix(MANDALA_GOLD, MANDALA_DEEP, phase);
  col += core_col * core * 0.8;
  col += mix(MANDALA_DEEP, MANDALA_GOLD, phase) * shadow * 0.3;

  // --- Radiating spokes ---
  float spoke = smoothstep(0.01, 0.005, abs(sin(a * fold * 0.5 + t * 0.2)) * r);
  spoke *= smoothstep(0.06, 0.10, r) * smoothstep(0.36, 0.32, r);
  col += MANDALA_GOLD * spoke * 0.2;

  // --- Breathing: the whole mandala gently pulses ---
  float breath = 0.85 + 0.15 * sin(t * 0.5);
  col *= breath;

  // --- Dotted circle decorations ---
  for (int ring = 1; ring <= 3; ring++) {
    float rr = float(ring) * 0.10 + 0.05;
    float ring_line = smoothstep(0.003, 0.001, abs(r - rr));
    col += MANDALA_GOLD * ring_line * 0.15;

    // Dots on ring
    for (int d = 0; d < 12; d++) {
      float da = float(d) * 6.28318 / 12.0 + t * 0.1 * float(ring);
      vec2 dp = center + rr * vec2(cos(da), sin(da));
      float dd = length(uv - dp);
      float dot = smoothstep(0.006, 0.003, dd);
      col += MANDALA_GOLD * dot * 0.3;
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode Selector
// ============================================================
void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  // Correct aspect ratio
  float aspect = iResolution.x / iResolution.y;
  uv.x = (uv.x - 0.5) * aspect + 0.5;

  // 60-second total cycle, 15 seconds per mode
  float cycle_time = mod(iTime, 60.0);
  int mode = int(cycle_time / 15.0);
  float mode_time = mod(cycle_time, 15.0);

  // Cross-fade between modes (1 second transition)
  float fade_in = smoothstep(0.0, 1.0, mode_time);
  float fade_out = smoothstep(14.0, 15.0, mode_time);

  vec4 current_col;
  if (mode == 0) {
    current_col = nuclearDetonation(uv, mode_time);
  } else if (mode == 1) {
    current_col = particleSpiral(uv, mode_time);
  } else if (mode == 2) {
    current_col = lichenGrowth(uv, mode_time);
  } else {
    current_col = jungMandala(uv, mode_time);
  }

  // Apply fade transitions
  current_col.rgb *= fade_in * (1.0 - fade_out);

  // Vignette
  vec2 vig_uv = gl_FragCoord.xy / iResolution.xy;
  float vig = 1.0 - 0.4 * length(vig_uv - vec2(0.5));
  current_col.rgb *= vig;

  fragColor = current_col;
}
