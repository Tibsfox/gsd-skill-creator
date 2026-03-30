#version 330 core

// Explorer 5 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Separation failure — spinning tub contacts booster, tumble ensues
//           The moment Explorer 5's future forked
//   Mode 1: Fault tree — branching paths, some terminating in red (failure),
//           others green (success). Probability flows downward.
//   Mode 2: Amanita muscaria — red cap with white spots emerging from
//           universal veil (white egg breaking apart)
//   Mode 3: Borges labyrinth — infinite recursive corridors receding
//           into darkness. The library of all possible outcomes.
//
// Color palette: Failure / Warning / Mushroom
//   Failure red:     #CC2020 (mission loss, fault termination)
//   Warning amber:   #D4A830 (caution, probability threshold)
//   Success green:   #40CC40 (nominal path, clean separation)
//   Mushroom red:    #CC3030 (Amanita cap)
//   Mushroom white:  #F0F0E8 (Amanita spots, universal veil)
//   Deep:            #050505 (background, void, library darkness)
//
// Compile: glslangValidator explorer5-screensaver.frag
// Run:     glslViewer explorer5-screensaver.frag
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
const vec3 FAILURE_RED    = vec3(0.800, 0.125, 0.125);   // #CC2020
const vec3 WARNING_AMBER  = vec3(0.831, 0.659, 0.188);   // #D4A830
const vec3 SUCCESS_GREEN  = vec3(0.251, 0.800, 0.251);   // #40CC40
const vec3 MUSHROOM_RED   = vec3(0.800, 0.188, 0.188);   // #CC3030
const vec3 MUSHROOM_WHITE = vec3(0.941, 0.941, 0.910);   // #F0F0E8
const vec3 DEEP           = vec3(0.020, 0.020, 0.020);   // #050505
const vec3 METAL_GREY     = vec3(0.400, 0.420, 0.450);   // rocket body
const vec3 FLAME_ORANGE   = vec3(0.900, 0.500, 0.100);   // rocket exhaust
const vec3 LIBRARY_BROWN  = vec3(0.300, 0.200, 0.100);   // Borges shelves

// ============================================================
// Mode 0: Separation Failure — Contact and Tumble
// ============================================================
// The spinning tub separates from the booster.
// A contact event occurs — the edge strikes the booster.
// The tub begins to tumble — nutation grows, trajectory diverges.

vec4 separationFailure(vec2 uv, float t) {
  vec3 col = DEEP;

  // Phase: 0-3s separation approach, 3-5s contact, 5-15s tumble
  float phase = mod(t, 15.0);

  // Booster body — a cylinder receding downward
  float booster_y = -0.3 - phase * 0.02;
  float booster_w = 0.08;
  float booster_d = smoothstep(booster_w + 0.005, booster_w, abs(uv.x));
  float booster_h = smoothstep(booster_y - 0.4, booster_y - 0.38, uv.y) *
                    smoothstep(booster_y + 0.02, booster_y, uv.y);
  col = mix(col, METAL_GREY * 0.6, booster_d * booster_h);

  // Spinning tub — a smaller cylinder above booster, separating
  float sep_progress = clamp(phase / 3.0, 0.0, 1.0);
  float tub_gap = sep_progress * 0.15; // growing gap

  // After contact (phase > 3), tub begins to tumble
  float nutation_angle = 0.0;
  if (phase > 3.0) {
    float nt = phase - 3.0;
    nutation_angle = nt * 0.15 * sin(nt * 2.5); // growing wobble
  }

  float tub_y = booster_y + 0.05 + tub_gap;
  float tub_w = 0.07;

  // Apply nutation rotation
  vec2 tub_uv = uv - vec2(0.0, tub_y);
  tub_uv = rot(nutation_angle) * tub_uv;
  tub_uv += vec2(0.0, tub_y);

  float tub_d = smoothstep(tub_w + 0.005, tub_w, abs(tub_uv.x));
  float tub_h = smoothstep(tub_y - 0.04, tub_y - 0.02, tub_uv.y) *
                smoothstep(tub_y + 0.08, tub_y + 0.06, tub_uv.y);

  // Tub color: normal metal → red flash at contact → amber during tumble
  vec3 tub_color = METAL_GREY;
  if (phase > 3.0 && phase < 4.0) {
    tub_color = mix(METAL_GREY, FAILURE_RED, (1.0 - (phase - 3.0)));
  } else if (phase > 4.0) {
    tub_color = mix(METAL_GREY, WARNING_AMBER, 0.3);
  }
  col = mix(col, tub_color, tub_d * tub_h);

  // Spin indication — small dots rotating around the tub
  float spin_rate = 10.0;
  if (phase > 3.0) spin_rate = 10.0 - (phase - 3.0) * 0.5; // slowing
  for (int i = 0; i < 4; i++) {
    float angle = float(i) * 1.5708 + t * spin_rate;
    vec2 sp = vec2(cos(angle) * tub_w * 0.8, sin(angle) * 0.015) +
              vec2(0.0, tub_y + 0.02);
    float sd = length(uv - sp);
    float spark = smoothstep(0.008, 0.003, sd);
    col = mix(col, WARNING_AMBER, spark * 0.7);
  }

  // Contact flash — bright spark at the edge
  if (phase > 2.8 && phase < 3.5) {
    float flash_intensity = exp(-8.0 * abs(phase - 3.0));
    vec2 contact_point = vec2(tub_w * 0.9, booster_y + 0.04);
    float contact_d = length(uv - contact_point);
    float contact_flash = smoothstep(0.04, 0.0, contact_d) * flash_intensity;
    col += vec3(1.0, 0.8, 0.3) * contact_flash;
  }

  // Trajectory lines — nominal (green, fading) vs actual (red, growing)
  if (phase > 5.0) {
    float traj_t = phase - 5.0;
    // Nominal trajectory — straight up (what should have happened)
    float nominal_x = 0.0;
    float nominal_vis = smoothstep(0.003, 0.001, abs(uv.x - nominal_x)) *
                        smoothstep(tub_y + 0.1, tub_y + 0.1 + traj_t * 0.05, uv.y) *
                        smoothstep(0.8, tub_y + 0.15, uv.y);
    col = mix(col, SUCCESS_GREEN * 0.3, nominal_vis * (1.0 - traj_t * 0.08));

    // Actual trajectory — curving off to the side
    float actual_x = (uv.y - tub_y - 0.1) * sin(nutation_angle) * 0.5;
    float actual_vis = smoothstep(0.004, 0.001, abs(uv.x - actual_x)) *
                       smoothstep(tub_y + 0.1, tub_y + 0.1 + traj_t * 0.04, uv.y) *
                       smoothstep(0.7, tub_y + 0.15, uv.y);
    col = mix(col, FAILURE_RED * 0.6, actual_vis);
  }

  // Stars background
  float star = hash(floor(uv * 200.0));
  if (star > 0.997) col += vec3(0.3);

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Fault Tree — Branching Probability Paths
// ============================================================
// A tree of branching paths flows downward. Each branch point
// has a probability. Some paths terminate green (success),
// others red (failure). The Explorer 5 failure path is highlighted.

vec4 faultTree(vec2 uv, float t) {
  vec3 col = DEEP;

  // Animated growth — tree grows downward over time
  float grow = mod(t, 15.0) / 15.0;
  float depth_limit = grow * 1.5;

  // Recursive-style tree using iteration
  vec2 p = vec2(0.0, 0.45); // root at top center
  float branch_len = 0.18;
  float line_w = 0.004;
  float total_prob = 1.0;

  // Level 0: Root — "LAUNCH"
  // Draw trunk
  float trunk = smoothstep(line_w + 0.001, line_w, abs(uv.x - p.x)) *
                smoothstep(p.y - branch_len * 0.3, p.y - branch_len * 0.25, uv.y) *
                smoothstep(p.y + 0.01, p.y, uv.y);
  col = mix(col, WARNING_AMBER, trunk * smoothstep(0.0, 0.1, depth_limit));

  // Root node
  float root_d = length(uv - p);
  float root_glow = smoothstep(0.02, 0.01, root_d);
  col = mix(col, WARNING_AMBER, root_glow * smoothstep(0.0, 0.05, depth_limit));

  // Level 1 branches: Ignition (0.95 success) / Ignition Fail (0.05)
  float l1y = p.y - branch_len * 0.5;
  if (depth_limit > 0.2) {
    // Left branch — success path
    vec2 l1_ok = vec2(-0.2, l1y);
    float b1_line = smoothstep(line_w + 0.001, line_w,
      abs(uv.y - mix(p.y - 0.05, l1y, clamp((uv.x - p.x) / (l1_ok.x - p.x), 0.0, 1.0))) +
      abs(uv.x - mix(p.x, l1_ok.x, clamp((uv.y - p.y + 0.05) / (l1y - p.y + 0.05), 0.0, 1.0))) * 0.3);
    // Simplified: draw angled lines
    float ang1 = smoothstep(line_w * 2.0, line_w,
      abs((uv.x - p.x) * (l1y - p.y + 0.05) - (uv.y - p.y + 0.05) * (l1_ok.x - p.x)) /
      length(vec2(l1_ok.x - p.x, l1y - p.y + 0.05)));
    float in_range1 = smoothstep(l1_ok.x - 0.01, l1_ok.x + 0.01, uv.x) *
                      smoothstep(p.x + 0.01, p.x - 0.01, uv.x);
    col = mix(col, SUCCESS_GREEN * 0.7, ang1 * in_range1 *
              smoothstep(0.2, 0.3, depth_limit) * 0.5);

    // Node
    float n1 = smoothstep(0.018, 0.008, length(uv - l1_ok));
    col = mix(col, SUCCESS_GREEN, n1 * smoothstep(0.25, 0.35, depth_limit));

    // Right branch — failure path (small)
    vec2 l1_fail = vec2(0.25, l1y + 0.03);
    float nf1 = smoothstep(0.012, 0.005, length(uv - l1_fail));
    col = mix(col, FAILURE_RED * 0.5, nf1 * smoothstep(0.25, 0.35, depth_limit));
  }

  // Level 2: Separation — THE CRITICAL NODE
  float l2y = l1y - branch_len * 0.5;
  if (depth_limit > 0.5) {
    vec2 sep_node = vec2(-0.15, l2y);
    float sep_d = length(uv - sep_node);

    // Pulsing highlight — this is where Explorer 5 failed
    float pulse = 0.5 + 0.5 * sin(t * 3.0);
    float sep_glow = smoothstep(0.035, 0.015, sep_d);
    vec3 sep_color = mix(WARNING_AMBER, FAILURE_RED, pulse * 0.6);
    col = mix(col, sep_color, sep_glow * smoothstep(0.5, 0.6, depth_limit));

    // Branch to success (left)
    vec2 sep_ok = vec2(-0.3, l2y - 0.12);
    float sok_d = smoothstep(0.015, 0.006, length(uv - sep_ok));
    col = mix(col, SUCCESS_GREEN, sok_d * smoothstep(0.6, 0.75, depth_limit));

    // Branch to failure (right) — EXPLORER 5'S PATH
    vec2 sep_fail = vec2(0.0, l2y - 0.12);
    float sf_d = smoothstep(0.018, 0.008, length(uv - sep_fail));
    float sf_pulse = 0.6 + 0.4 * sin(t * 4.0);
    col = mix(col, FAILURE_RED, sf_d * sf_pulse * smoothstep(0.6, 0.75, depth_limit));

    // Label-like glow around failure node
    float halo = smoothstep(0.04, 0.025, length(uv - sep_fail));
    col = mix(col, FAILURE_RED * 0.3, halo * smoothstep(0.7, 0.85, depth_limit));
  }

  // Level 3: Terminal nodes
  float l3y = l2y - branch_len * 0.6;
  if (depth_limit > 0.8) {
    // Multiple terminal failure modes
    for (int i = 0; i < 5; i++) {
      float xoff = -0.3 + float(i) * 0.15;
      vec2 term = vec2(xoff, l3y - float(i % 3) * 0.04);
      float td = smoothstep(0.012, 0.004, length(uv - term));
      bool is_fail = (i == 1 || i == 3); // some paths fail
      vec3 tc = is_fail ? FAILURE_RED : SUCCESS_GREEN;
      col = mix(col, tc * 0.8, td * smoothstep(0.8, 1.0, depth_limit));
    }
  }

  // Probability text-like markers (small dots indicating %)
  if (depth_limit > 0.4) {
    // Scatter probability indicator dots
    for (int i = 0; i < 8; i++) {
      vec2 prob_pos = vec2(
        -0.35 + hash(vec2(float(i), 0.5)) * 0.7,
        0.4 - hash(vec2(float(i), 1.5)) * 0.8
      );
      if (prob_pos.y > 0.45 - depth_limit * 0.6) {
        float prob_d = smoothstep(0.005, 0.002, length(uv - prob_pos));
        col = mix(col, WARNING_AMBER * 0.4, prob_d);
      }
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Amanita Muscaria — Universal Veil Breaking
// ============================================================
// A red cap with white spots emerges from a white egg (universal veil).
// The veil tears, patches remain on the cap. Growth from soil.

vec4 amanitaGrowth(vec2 uv, float t) {
  vec3 col = DEEP;
  float phase = mod(t, 15.0) / 15.0;

  // Ground layer — dark forest floor
  float ground_y = -0.35;
  float ground = smoothstep(ground_y + 0.02, ground_y, uv.y);
  vec3 ground_col = vec3(0.06, 0.05, 0.03);
  // Scattered leaf litter
  ground_col += vec3(0.02) * vnoise(uv * 30.0);
  col = mix(col, ground_col, ground);

  // Growth animation
  float growth = smoothstep(0.0, 0.6, phase); // mushroom emerges
  float veil_break = smoothstep(0.3, 0.5, phase); // veil tears

  // Stipe (stem) — white, cylindrical
  float stipe_h = 0.25 * growth;
  float stipe_w = 0.025 + 0.005 * sin(uv.y * 20.0); // slight taper
  float stipe_base = ground_y;
  float stipe = smoothstep(stipe_w + 0.003, stipe_w, abs(uv.x)) *
                smoothstep(stipe_base, stipe_base + 0.01, uv.y) *
                smoothstep(stipe_base + stipe_h + 0.01, stipe_base + stipe_h, uv.y);
  col = mix(col, MUSHROOM_WHITE * 0.85, stipe);

  // Annulus (ring on stem) — remnant of partial veil
  if (veil_break > 0.3) {
    float ring_y = stipe_base + stipe_h * 0.6;
    float ring = smoothstep(0.003, 0.001, abs(uv.y - ring_y)) *
                 smoothstep(stipe_w + 0.015, stipe_w + 0.005, abs(uv.x)) *
                 smoothstep(stipe_w - 0.005, stipe_w + 0.005, abs(uv.x));
    col = mix(col, MUSHROOM_WHITE * 0.7, ring * veil_break);
  }

  // Cap — red dome
  float cap_y = stipe_base + stipe_h;
  float cap_radius = 0.12 * growth;
  float cap_height = 0.08 * growth;

  // Dome shape — elliptical
  vec2 cap_uv = uv - vec2(0.0, cap_y);
  float cap_shape = (cap_uv.x * cap_uv.x) / (cap_radius * cap_radius) +
                    (cap_uv.y * cap_uv.y) / (cap_height * cap_height);
  float cap_top = smoothstep(1.05, 0.95, cap_shape) *
                  smoothstep(cap_y - 0.01, cap_y, uv.y); // only top half

  // Cap color with shading
  float cap_shade = 1.0 - cap_uv.y / cap_height * 0.3;
  vec3 cap_col = MUSHROOM_RED * cap_shade;
  // Darker at edges
  cap_col *= 1.0 - smoothstep(0.7, 1.0, cap_shape) * 0.3;
  col = mix(col, cap_col, cap_top);

  // White spots (universal veil remnants) — scattered on cap
  if (veil_break > 0.1) {
    for (int i = 0; i < 12; i++) {
      float spot_angle = float(i) * 0.524 + 0.3;
      float spot_r = 0.3 + hash(vec2(float(i), 2.0)) * 0.5;
      vec2 spot_pos = vec2(
        cos(spot_angle) * cap_radius * spot_r,
        sin(spot_angle) * cap_height * spot_r * 0.8 + cap_y + cap_height * 0.2
      );
      float spot_size = 0.008 + hash(vec2(float(i), 3.0)) * 0.008;
      float spot = smoothstep(spot_size + 0.002, spot_size, length(uv - spot_pos));
      // Spots appear as veil breaks
      float spot_vis = smoothstep(0.0, 0.3, veil_break) * cap_top;
      col = mix(col, MUSHROOM_WHITE * 0.95, spot * spot_vis);
    }
  }

  // Universal veil — white membrane enclosing the young mushroom
  // Visible early, breaking apart mid-phase
  if (phase < 0.6) {
    float veil_intact = 1.0 - veil_break;
    float veil_radius = cap_radius * 1.2;
    float veil_shape = length(uv - vec2(0.0, cap_y - 0.02)) / veil_radius;
    // Veil fragments — breaking apart
    float fragment_noise = vnoise(uv * 15.0 + t * 0.5);
    float veil_frag = smoothstep(1.0, 0.9, veil_shape) *
                      smoothstep(0.5, 0.6, veil_shape + fragment_noise * veil_break * 0.5);
    col = mix(col, MUSHROOM_WHITE * 0.7, veil_frag * veil_intact * 0.6);
  }

  // Volva (cup at base) — another veil remnant
  if (growth > 0.3) {
    float volva_y = stipe_base;
    float volva_w = stipe_w * 2.0;
    float volva = smoothstep(volva_w + 0.005, volva_w, abs(uv.x)) *
                  smoothstep(volva_y - 0.01, volva_y, uv.y) *
                  smoothstep(volva_y + 0.03, volva_y + 0.01, uv.y);
    col = mix(col, MUSHROOM_WHITE * 0.6, volva * 0.5);
  }

  // Mycelium threads in soil — faint white lines
  for (int i = 0; i < 6; i++) {
    float mx = (float(i) - 2.5) * 0.08;
    float my = ground_y - hash(vec2(float(i), 5.0)) * 0.1;
    vec2 mp = vec2(mx, my);
    float myc_d = length(uv - mp);
    float myc = smoothstep(0.04, 0.01, myc_d) * (1.0 - smoothstep(ground_y - 0.15, ground_y, uv.y));
    col = mix(col, MUSHROOM_WHITE * 0.15, myc * 0.3);
  }

  // Spore particles drifting from mature cap
  if (phase > 0.7) {
    float spore_t = phase - 0.7;
    for (int i = 0; i < 20; i++) {
      float sx = hash(vec2(float(i), 7.0)) * 0.4 - 0.2;
      float sy = cap_y + cap_height + spore_t * hash(vec2(float(i), 8.0)) * 0.3;
      sx += sin(t * 0.5 + float(i)) * 0.02; // drift
      float sp = smoothstep(0.004, 0.001, length(uv - vec2(sx, sy)));
      col = mix(col, MUSHROOM_WHITE * 0.4, sp * (1.0 - spore_t * 2.0));
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Borges Labyrinth — Infinite Recursive Corridors
// ============================================================
// An infinite library receding into perspective. Hexagonal rooms.
// Books on every wall. Corridors branch and recurse forever.
// The Library of Babel contains every possible book — including
// the one that records Explorer 5's orbital data.

vec4 borgesLabyrinth(vec2 uv, float t) {
  vec3 col = DEEP;

  // Camera moving slowly forward through the library
  float z_offset = t * 0.3;

  // Perspective corridor — repeating segments receding
  // Use UV distortion to create depth illusion
  vec2 p = uv;

  // Hexagonal corridor cross-section (simplified as rectangular)
  // Repeated in depth using modular arithmetic
  for (int layer = 0; layer < 8; layer++) {
    float depth = float(layer) + fract(z_offset);
    float scale = 1.0 / (1.0 + depth * 0.8);

    vec2 lp = p * scale;

    // Corridor walls
    float wall_w = 0.35 * scale;
    float wall_h = 0.25 * scale;

    // Left wall
    float left_wall = smoothstep(-wall_w - 0.005 * scale, -wall_w, lp.x) *
                      smoothstep(-wall_w + 0.003 * scale, -wall_w + 0.001 * scale, lp.x) *
                      smoothstep(-wall_h, -wall_h + 0.01 * scale, lp.y) *
                      smoothstep(wall_h, wall_h - 0.01 * scale, lp.y);
    // Right wall
    float right_wall = smoothstep(wall_w, wall_w + 0.005 * scale, lp.x) *
                       smoothstep(wall_w + 0.003 * scale, wall_w + 0.001 * scale, -lp.x + wall_w * 2.0 + 0.003 * scale) *
                       step(lp.x, wall_w + 0.004 * scale) *
                       smoothstep(-wall_h, -wall_h + 0.01 * scale, lp.y) *
                       smoothstep(wall_h, wall_h - 0.01 * scale, lp.y);

    // Depth-based dimming
    float dim = 1.0 / (1.0 + depth * 0.5);

    // Wall color — warm brown with book textures
    vec3 wall_col = LIBRARY_BROWN * dim;
    // Book spines — vertical lines on walls
    float books = step(0.5, fract(lp.x * 40.0 / scale + float(layer) * 7.0));
    wall_col = mix(wall_col, wall_col * 1.3, books * 0.2);

    col = mix(col, wall_col, (left_wall + right_wall) * 0.8);

    // Floor
    float floor_vis = smoothstep(-wall_h - 0.003 * scale, -wall_h, lp.y) *
                      smoothstep(-wall_h + 0.005 * scale, -wall_h + 0.002 * scale, lp.y) *
                      step(-wall_w, lp.x) * step(lp.x, wall_w);
    vec3 floor_col = vec3(0.08, 0.06, 0.04) * dim;
    // Floor tiles
    float tiles = step(0.5, fract(lp.x * 20.0 / scale)) *
                  step(0.5, fract(depth * 3.0));
    floor_col = mix(floor_col, floor_col * 1.4, tiles * 0.15);
    col = mix(col, floor_col, floor_vis);

    // Ceiling
    float ceil_vis = smoothstep(wall_h + 0.003 * scale, wall_h, lp.y) *
                     smoothstep(wall_h - 0.005 * scale, wall_h - 0.002 * scale, lp.y) *
                     step(-wall_w, lp.x) * step(lp.x, wall_w);
    col = mix(col, vec3(0.05, 0.04, 0.03) * dim, ceil_vis);

    // Dim lamp at each corridor segment
    vec2 lamp_pos = vec2(0.0, wall_h * 0.7) * scale;
    float lamp_d = length(lp - lamp_pos);
    float lamp = smoothstep(0.02 * scale, 0.005 * scale, lamp_d) * dim;
    col = mix(col, WARNING_AMBER * 0.8, lamp * 0.6);

    // Lamp glow on nearby surfaces
    float glow_radius = 0.15 * scale;
    float glow = smoothstep(glow_radius, 0.0, lamp_d) * dim * 0.15;
    col += WARNING_AMBER * glow;

    // Side corridor openings (branching paths)
    if (layer % 3 == 1) {
      float side_open = smoothstep(-0.03 * scale, -0.01 * scale, lp.y) *
                        smoothstep(0.06 * scale, 0.04 * scale, lp.y);
      // Left side corridor
      float left_open = step(-wall_w - 0.001 * scale, lp.x) *
                        step(lp.x, -wall_w + 0.02 * scale) * side_open;
      col = mix(col, DEEP + LIBRARY_BROWN * 0.05 * dim, left_open * 0.5);
    }
  }

  // Floating particles — dust motes in lamp light
  for (int i = 0; i < 15; i++) {
    float px = hash(vec2(float(i), 10.0)) * 0.6 - 0.3;
    float py = hash(vec2(float(i), 11.0)) * 0.4 - 0.2;
    py += sin(t * 0.3 + float(i) * 2.0) * 0.02;
    px += cos(t * 0.2 + float(i) * 1.5) * 0.01;
    float pd = smoothstep(0.004, 0.001, length(uv - vec2(px, py)));
    col += WARNING_AMBER * 0.15 * pd;
  }

  // Faint text on distant back wall — the book of Explorer 5's data
  float text_vis = smoothstep(0.1, 0.05, abs(uv.x)) *
                   smoothstep(0.08, 0.02, abs(uv.y));
  float text_noise = vnoise(uv * 200.0 + vec2(t * 0.1, 0.0));
  col = mix(col, WARNING_AMBER * 0.15, text_vis * text_noise * 0.3);

  return vec4(col, 1.0);
}

// ============================================================
// MAIN — Mode Cycling
// ============================================================
void main() {
  vec2 uv = (gl_FragCoord.xy - iResolution.xy * 0.5) / min(iResolution.x, iResolution.y);

  float cycle = 60.0; // total cycle time
  float mode_dur = cycle / 4.0; // 15s per mode
  float t = mod(iTime, cycle);
  int mode = int(t / mode_dur);
  float mode_t = mod(t, mode_dur);

  // Cross-fade between modes
  float fade_dur = 1.5;
  float fade_in = smoothstep(0.0, fade_dur, mode_t);
  float fade_out = smoothstep(mode_dur, mode_dur - fade_dur, mode_t);
  float fade = min(fade_in, fade_out);

  vec4 result;
  if (mode == 0) {
    result = separationFailure(uv, mode_t);
  } else if (mode == 1) {
    result = faultTree(uv, mode_t);
  } else if (mode == 2) {
    result = amanitaGrowth(uv, mode_t);
  } else {
    result = borgesLabyrinth(uv, mode_t);
  }

  // Apply mode transition fade
  result.rgb *= fade;

  // Subtle vignette
  float vignette = 1.0 - length(uv) * 0.4;
  result.rgb *= vignette;

  fragColor = result;
}
