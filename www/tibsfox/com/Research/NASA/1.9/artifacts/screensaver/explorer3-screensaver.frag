#version 330 core

// Explorer 3 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Tape recording — horizontal scan lines being "written" like
//           magnetic tape, then rewinding and fast playback. Amber data
//           dots appear on brown tape, then accelerate during replay.
//   Mode 1: Complete radiation profile — full orbit radiation data
//           visualization showing the belt crossing, unlike Explorer 1's
//           fragmentary data. Continuous curve vs. gapped curve.
//   Mode 2: Liverwort gemma cups — circular cups on a green thallus
//           surface with disc-shaped gemmae being "ejected" by rain drops.
//   Mode 3: Hero's journey — circular orbit path with Campbell's stages
//           mapped to orbital positions. The satellite as hero, the belt
//           as the underworld, the data as the boon.
//
// Color palette: Explorer 3 / Tape Recorder
//   Tape brown:     #5A4030  (magnetic tape oxide coating)
//   Data green:     #40CC40  (oscilloscope data, confirmed readings)
//   Archive amber:  #D4A830  (stored data, recorded knowledge)
//   Liverwort:      #4A7A3A  (Marchantia polymorpha thallus)
//   Cosmic deep:    #050510  (orbital darkness)
//
// Compile: glslangValidator explorer3-screensaver.frag
// Run:     glslViewer explorer3-screensaver.frag
// Install: copy to /usr/lib/xscreensaver/ or ~/.local/share/xscreensaver/

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_mode;

out vec4 fragColor;

// --- Constants ---
const vec3 TAPE_BROWN    = vec3(0.353, 0.251, 0.188);
const vec3 DATA_GREEN    = vec3(0.251, 0.800, 0.251);
const vec3 ARCHIVE_AMBER = vec3(0.831, 0.659, 0.188);
const vec3 LIVERWORT     = vec3(0.290, 0.478, 0.227);
const vec3 COSMIC_DEEP   = vec3(0.020, 0.020, 0.063);
const vec3 GEMMA_GREEN   = vec3(0.380, 0.600, 0.280);
const vec3 BELT_RED      = vec3(0.800, 0.200, 0.100);
const vec3 ORBIT_BLUE    = vec3(0.150, 0.350, 0.650);
const vec3 EARTH_BLUE    = vec3(0.100, 0.250, 0.550);

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

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

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdRing(vec2 p, float r, float w) {
  return abs(length(p) - r) - w;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Smooth minimum for blending shapes
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Stars background
vec3 stars(vec2 uv) {
  vec3 col = COSMIC_DEEP;
  for (int i = 0; i < 3; i++) {
    vec2 grid = floor(uv * (50.0 + float(i) * 30.0));
    float h = hash(grid + float(i) * 100.0);
    if (h > 0.97) {
      vec2 center = (grid + 0.5) / (50.0 + float(i) * 30.0);
      float d = length(uv - center);
      float brightness = h * 0.5 * (1.0 - float(i) * 0.2);
      float twinkle = 0.7 + 0.3 * sin(u_time * (1.0 + h * 3.0));
      col += vec3(brightness * twinkle) * smoothstep(0.003, 0.0, d);
    }
  }
  return col;
}

// ============================================
// MODE 0: TAPE RECORDING
// ============================================
// Horizontal scan lines representing magnetic tape.
// Data dots appear as the tape moves. Rewind, then
// fast playback at 4x speed.

vec3 mode_tape(vec2 uv, float t) {
  vec3 col = COSMIC_DEEP * 0.5;

  // Tape phase: 0-0.5 recording, 0.5-0.6 rewind, 0.6-1.0 playback
  float phase = fract(t / 15.0);
  bool is_rec = phase < 0.5;
  bool is_rew = phase >= 0.5 && phase < 0.6;
  bool is_play = phase >= 0.6;

  // Tape body — two reels and tape between them
  vec2 reel_L = vec2(-0.35, 0.0);
  vec2 reel_R = vec2(0.35, 0.0);
  float reel_r = 0.15;

  // Left reel
  float d_reel_L = sdCircle(uv - reel_L, reel_r);
  col = mix(col, TAPE_BROWN * 0.6, smoothstep(0.005, 0.0, d_reel_L));
  // Reel hub
  float d_hub_L = sdCircle(uv - reel_L, 0.03);
  col = mix(col, vec3(0.4), smoothstep(0.003, 0.0, d_hub_L));
  // Reel spokes
  for (int i = 0; i < 3; i++) {
    float a = float(i) * TAU / 3.0 + t * 2.0;
    vec2 spoke_dir = vec2(cos(a), sin(a));
    float d_spoke = abs(dot(uv - reel_L, vec2(-spoke_dir.y, spoke_dir.x)));
    float along = dot(uv - reel_L, spoke_dir);
    if (along > 0.0 && along < reel_r) {
      col = mix(col, vec3(0.3), smoothstep(0.003, 0.0, d_spoke));
    }
  }

  // Right reel
  float d_reel_R = sdCircle(uv - reel_R, reel_r);
  col = mix(col, TAPE_BROWN * 0.6, smoothstep(0.005, 0.0, d_reel_R));
  float d_hub_R = sdCircle(uv - reel_R, 0.03);
  col = mix(col, vec3(0.4), smoothstep(0.003, 0.0, d_hub_R));
  for (int i = 0; i < 3; i++) {
    float a = float(i) * TAU / 3.0 - t * 2.0;
    vec2 spoke_dir = vec2(cos(a), sin(a));
    float d_spoke = abs(dot(uv - reel_R, vec2(-spoke_dir.y, spoke_dir.x)));
    float along = dot(uv - reel_R, spoke_dir);
    if (along > 0.0 && along < reel_r) {
      col = mix(col, vec3(0.3), smoothstep(0.003, 0.0, d_spoke));
    }
  }

  // Tape path between reels
  float tape_y = 0.0;
  float tape_h = 0.025;
  if (abs(uv.y - tape_y) < tape_h && uv.x > -0.2 && uv.x < 0.2) {
    col = TAPE_BROWN;

    // Tape head (center)
    float d_head = sdBox(uv - vec2(0.0, tape_y), vec2(0.01, tape_h + 0.005));
    col = mix(col, vec3(0.5, 0.5, 0.6), smoothstep(0.003, 0.0, d_head));

    // Data dots on tape
    float tape_speed;
    if (is_rec) tape_speed = t * 0.5;
    else if (is_rew) tape_speed = t * 0.5 - (phase - 0.5) * 15.0 * 2.0;
    else tape_speed = (phase - 0.6) * 15.0 * 2.0;

    float data_x = uv.x + tape_speed;
    vec2 data_grid = floor(vec2(data_x * 40.0, (uv.y - tape_y + tape_h) * 4.0));
    float data_h = hash(data_grid);

    // Radiation-like data pattern
    float belt_pos = sin(data_x * 3.0) * 0.5 + 0.5;
    float data_thresh = 0.3 + belt_pos * 0.5;

    if (data_h > data_thresh) {
      float dot_d = length(fract(vec2(data_x * 40.0, (uv.y - tape_y + tape_h) * 4.0)) - 0.5);
      vec3 dot_col = is_play ? DATA_GREEN : ARCHIVE_AMBER;
      col = mix(col, dot_col, smoothstep(0.4, 0.2, dot_d) * 0.7);
    }
  }

  // Mode label
  float label_y = -0.35;
  if (is_rec) {
    // "REC" indicator — pulsing red dot
    float pulse = 0.5 + 0.5 * sin(t * 4.0);
    float d_rec = sdCircle(uv - vec2(-0.08, label_y), 0.015);
    col = mix(col, vec3(0.9, 0.15, 0.1) * pulse, smoothstep(0.003, 0.0, d_rec));
  } else if (is_play) {
    // Play indicator — green triangle
    vec2 tri_p = uv - vec2(-0.08, label_y);
    float d_tri = max(abs(tri_p.y) - 0.015, tri_p.x - 0.015);
    col = mix(col, DATA_GREEN * 0.8, smoothstep(0.003, 0.0, max(d_tri, -tri_p.x - 0.01)));
  }

  return col;
}

// ============================================
// MODE 1: COMPLETE RADIATION PROFILE
// ============================================
// Full orbit radiation data — Explorer 3's continuous recording
// vs. Explorer 1's fragmentary real-time telemetry.

vec3 mode_radiation(vec2 uv, float t) {
  vec3 col = COSMIC_DEEP;

  // Two side-by-side graphs
  float graph_w = 0.38;
  float graph_h = 0.3;
  float graph_sep = 0.42;

  // Explorer 1 (left) — gaps in coverage
  vec2 e1_center = vec2(-graph_sep / 2.0, 0.05);
  // Explorer 3 (right) — complete coverage
  vec2 e3_center = vec2(graph_sep / 2.0, 0.05);

  // Axes
  for (int g = 0; g < 2; g++) {
    vec2 gc = (g == 0) ? e1_center : e3_center;
    vec2 origin = gc - vec2(graph_w, graph_h);

    // X axis
    float d_xaxis = abs(uv.y - origin.y);
    if (uv.x > origin.x - 0.01 && uv.x < origin.x + graph_w * 2.0 + 0.01) {
      col = mix(col, vec3(0.25), smoothstep(0.002, 0.0, d_xaxis));
    }
    // Y axis
    float d_yaxis = abs(uv.x - origin.x);
    if (uv.y > origin.y - 0.01 && uv.y < origin.y + graph_h * 2.0 + 0.01) {
      col = mix(col, vec3(0.25), smoothstep(0.002, 0.0, d_yaxis));
    }
  }

  // Radiation profile: bell-shaped curve representing belt crossing
  // Animated: the curve draws itself over time
  float draw_progress = fract(t / 12.0);

  for (int g = 0; g < 2; g++) {
    vec2 gc = (g == 0) ? e1_center : e3_center;
    vec2 origin = gc - vec2(graph_w, graph_h);

    if (uv.x > origin.x && uv.x < origin.x + graph_w * 2.0) {
      float x_norm = (uv.x - origin.x) / (graph_w * 2.0);

      // Only draw up to the current progress
      if (x_norm < draw_progress) {
        // Bell curve radiation profile
        float belt_center = 0.5;
        float belt_width = 0.15;
        float radiation = exp(-pow(x_norm - belt_center, 2.0) / (2.0 * belt_width * belt_width));

        // Saturation zone — in the belt center, Geiger counter reads zero
        float saturation_zone = smoothstep(0.42, 0.45, x_norm) * smoothstep(0.58, 0.55, x_norm);

        float true_signal = radiation;
        float measured_signal;

        if (g == 0) {
          // Explorer 1: gaps where no ground station coverage
          // Ground stations cover roughly 10% of orbit
          float coverage = 0.0;
          for (int s = 0; s < 5; s++) {
            float station_pos = 0.1 + float(s) * 0.2;
            float station_width = 0.04;
            coverage = max(coverage,
                          smoothstep(station_pos - station_width, station_pos, x_norm) *
                          smoothstep(station_pos + station_width, station_pos, x_norm));
          }
          measured_signal = true_signal * coverage * (1.0 - saturation_zone);
        } else {
          // Explorer 3: complete coverage (tape recorded everything)
          measured_signal = true_signal * (1.0 - saturation_zone);
        }

        // Draw the measured data curve
        float curve_y = origin.y + measured_signal * graph_h * 1.8;
        float d_curve = abs(uv.y - curve_y);

        vec3 curve_col = (g == 0) ? ARCHIVE_AMBER * 0.7 : DATA_GREEN;
        col = mix(col, curve_col, smoothstep(0.004, 0.001, d_curve));

        // For Explorer 3, also draw the saturation zone indication
        if (g == 1 && saturation_zone > 0.5) {
          float sat_bar_y = origin.y + 0.01;
          if (uv.y > sat_bar_y && uv.y < sat_bar_y + 0.015) {
            col = mix(col, BELT_RED * 0.5, 0.3);
          }
        }
      }
    }
  }

  // Labels (positioned as colored dots to indicate which is which)
  float d_e1_dot = sdCircle(uv - (e1_center + vec2(0.0, graph_h + 0.06)), 0.012);
  col = mix(col, ARCHIVE_AMBER * 0.7, smoothstep(0.003, 0.0, d_e1_dot));

  float d_e3_dot = sdCircle(uv - (e3_center + vec2(0.0, graph_h + 0.06)), 0.012);
  col = mix(col, DATA_GREEN, smoothstep(0.003, 0.0, d_e3_dot));

  return col;
}

// ============================================
// MODE 2: LIVERWORT GEMMA CUPS
// ============================================
// Marchantia polymorpha thallus with gemma cups.
// Rain drops splash into cups, ejecting gemmae.

vec3 mode_liverwort(vec2 uv, float t) {
  // Thallus background — green, slightly textured
  float thallus_noise = fbm(uv * 8.0 + t * 0.05);
  vec3 col = mix(LIVERWORT * 0.7, LIVERWORT * 1.1, thallus_noise);

  // Thallus surface texture — subtle cell pattern
  float cell_pattern = vnoise(uv * 30.0);
  col *= 0.9 + 0.1 * cell_pattern;

  // Midrib — central darker line
  float midrib = smoothstep(0.02, 0.0, abs(uv.x)) * 0.15;
  col -= vec3(midrib);

  // Gemma cups — 4-5 circular cups on the thallus surface
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 cup_pos = vec2(
      sin(fi * 2.1 + 0.5) * 0.25,
      cos(fi * 1.7 + 0.3) * 0.2 + fi * 0.06 - 0.15
    );

    float cup_r = 0.04 + hash(vec2(fi, 0.0)) * 0.02;
    float d_cup = sdCircle(uv - cup_pos, cup_r);

    // Cup rim
    float d_rim = sdRing(uv - cup_pos, cup_r, 0.004);
    col = mix(col, LIVERWORT * 0.5, smoothstep(0.003, 0.0, d_rim));

    // Cup interior — darker, with gemmae
    if (d_cup < 0.0) {
      col = mix(col, LIVERWORT * 0.4, 0.5);

      // Gemmae inside the cup — small discs
      for (int g = 0; g < 6; g++) {
        float fg = float(g);
        float ga = fg * TAU / 6.0 + fi;
        float gr = cup_r * 0.5 * (0.5 + hash(vec2(fi, fg)) * 0.5);
        vec2 gemma_pos = cup_pos + vec2(cos(ga), sin(ga)) * gr;
        float gemma_r = 0.006;

        float d_gemma = sdCircle(uv - gemma_pos, gemma_r);
        col = mix(col, GEMMA_GREEN, smoothstep(0.003, 0.0, d_gemma));
      }
    }

    // Rain splash ejection — animated gemmae flying out
    float splash_time = fract(t * 0.3 + fi * 0.2);
    if (splash_time < 0.5) {
      float eject_t = splash_time * 2.0;
      for (int e = 0; e < 3; e++) {
        float fe = float(e);
        float eject_angle = fi * 1.3 + fe * TAU / 3.0 + t * 0.1;
        float eject_dist = eject_t * (0.08 + hash(vec2(fi, fe + 10.0)) * 0.06);
        vec2 eject_pos = cup_pos + vec2(cos(eject_angle), sin(eject_angle)) * eject_dist;

        // Ejected gemma — gets smaller as it flies
        float eject_r = 0.005 * (1.0 - eject_t * 0.5);
        float d_eject = sdCircle(uv - eject_pos, eject_r);
        float eject_alpha = 1.0 - eject_t;
        col = mix(col, GEMMA_GREEN * 1.3, smoothstep(0.003, 0.0, d_eject) * eject_alpha);
      }

      // Rain drop splash effect at the cup
      if (splash_time < 0.1) {
        float splash_r = splash_time * 10.0 * cup_r * 1.5;
        float d_splash = sdRing(uv - cup_pos, splash_r, 0.002);
        float splash_alpha = 1.0 - splash_time * 10.0;
        col = mix(col, vec3(0.6, 0.7, 0.9), smoothstep(0.003, 0.0, d_splash) * splash_alpha * 0.5);
      }
    }
  }

  // Occasional rain drops falling
  for (int r = 0; r < 8; r++) {
    float fr = float(r);
    float drop_x = sin(fr * 3.7 + 1.0) * 0.4;
    float drop_y = fract(-t * 0.8 + fr * 0.125) * 1.2 - 0.6;
    vec2 drop_pos = vec2(drop_x, drop_y);
    float drop_len = 0.02;
    float d_drop = sdBox(uv - drop_pos, vec2(0.001, drop_len));
    col = mix(col, vec3(0.5, 0.6, 0.8), smoothstep(0.002, 0.0, d_drop) * 0.3);
  }

  return col;
}

// ============================================
// MODE 3: HERO'S JOURNEY
// ============================================
// Campbell's monomyth mapped to the orbit. The satellite
// is the hero, the radiation belt is the underworld/abyss,
// the tape recorder carries the boon (data) back.

vec3 mode_journey(vec2 uv, float t) {
  vec3 col = stars(uv);

  // Circular orbit path
  float orbit_r = 0.3;
  float d_orbit = sdRing(uv, orbit_r, 0.002);
  col = mix(col, ORBIT_BLUE * 0.4, smoothstep(0.004, 0.0, d_orbit));

  // Earth at center
  float d_earth = sdCircle(uv, 0.08);
  float earth_tex = fbm(uv * 15.0 + 3.0);
  vec3 earth_col = mix(EARTH_BLUE, EARTH_BLUE * 1.3, earth_tex);
  col = mix(col, earth_col, smoothstep(0.005, 0.0, d_earth));

  // Radiation belt arc — the "underworld" zone
  // Bottom half of the orbit (hero descends)
  float belt_start = PI * 0.7;
  float belt_end = PI * 1.3;
  for (float i = 0.0; i < 30.0; i += 1.0) {
    float a = belt_start + (i / 30.0) * (belt_end - belt_start);
    vec2 belt_pos = vec2(cos(a), sin(a)) * orbit_r;
    float d_bp = length(uv - belt_pos);
    float belt_intensity = sin((a - belt_start) / (belt_end - belt_start) * PI);
    col = mix(col, BELT_RED * 0.3, smoothstep(0.025, 0.01, d_bp) * belt_intensity * 0.4);
  }

  // Journey stage markers around the orbit
  // 12 stages of the monomyth, equally spaced
  float stage_angles[12] = float[12](
    0.0,                   // 1. Ordinary World (top)
    TAU / 12.0,            // 2. Call to Adventure
    TAU * 2.0 / 12.0,      // 3. Refusal of the Call
    TAU * 3.0 / 12.0,      // 4. Meeting the Mentor
    TAU * 4.0 / 12.0,      // 5. Crossing the Threshold
    TAU * 5.0 / 12.0,      // 6. Tests, Allies, Enemies
    TAU * 6.0 / 12.0,      // 7. Approach (bottom — deepest into belt)
    TAU * 7.0 / 12.0,      // 8. Ordeal (the abyss)
    TAU * 8.0 / 12.0,      // 9. Reward (the boon — data recorded)
    TAU * 9.0 / 12.0,      // 10. The Road Back
    TAU * 10.0 / 12.0,     // 11. Resurrection
    TAU * 11.0 / 12.0      // 12. Return with Elixir
  );

  // Satellite position — orbiting
  float sat_angle = -t * 0.4 + PI / 2.0;  // Start at top, go clockwise
  vec2 sat_pos = vec2(cos(sat_angle), sin(sat_angle)) * orbit_r;

  // Draw stage dots
  for (int s = 0; s < 12; s++) {
    float a = -stage_angles[s] + PI / 2.0;
    vec2 stage_pos = vec2(cos(a), sin(a)) * orbit_r;
    float d_stage = sdCircle(uv - stage_pos, 0.008);

    // Color based on position: ordinary world = amber, underworld = red
    vec3 stage_col;
    if (s >= 5 && s <= 8) {
      stage_col = BELT_RED;  // Underworld stages
    } else if (s >= 9) {
      stage_col = DATA_GREEN;  // Return stages (carrying data)
    } else {
      stage_col = ARCHIVE_AMBER;  // Departure stages
    }

    // Glow if satellite has passed this stage
    float sat_progress = fract(-sat_angle / TAU + 0.25);
    float stage_progress = float(s) / 12.0;
    float passed = smoothstep(0.0, 0.08, sat_progress - stage_progress);
    float brightness = 0.3 + passed * 0.7;

    col = mix(col, stage_col * brightness, smoothstep(0.003, 0.0, d_stage));
  }

  // Satellite (hero)
  float d_sat = sdCircle(uv - sat_pos, 0.012);
  // Satellite glows brighter when carrying the boon (after stage 9)
  float has_boon = smoothstep(PI * 1.3, PI * 1.5, mod(-sat_angle + PI * 0.5, TAU));
  vec3 sat_col = mix(ARCHIVE_AMBER, DATA_GREEN, has_boon);
  col = mix(col, sat_col, smoothstep(0.004, 0.0, d_sat));

  // Glow around satellite
  float sat_glow = 1.0 / (1.0 + 800.0 * d_sat * d_sat);
  col += sat_col * sat_glow * 0.15;

  // Trail behind satellite
  for (int tr = 1; tr < 20; tr++) {
    float tr_angle = sat_angle + float(tr) * 0.03;
    vec2 tr_pos = vec2(cos(tr_angle), sin(tr_angle)) * orbit_r;
    float d_tr = length(uv - tr_pos);
    float tr_alpha = 1.0 - float(tr) / 20.0;
    col += sat_col * smoothstep(0.006, 0.0, d_tr) * tr_alpha * 0.3;
  }

  return col;
}

// ============================================
// MAIN
// ============================================

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

  // Mode selection: auto-cycle every 15 seconds
  float mode;
  if (u_mode >= 0.0) {
    mode = u_mode;
  } else {
    mode = mod(floor(u_time / 15.0), 4.0);
  }

  // Transition blending (1-second crossfade)
  float cycle_pos = mod(u_time, 15.0);
  float blend_in = smoothstep(0.0, 1.0, cycle_pos);
  float blend_out = smoothstep(14.0, 15.0, cycle_pos);

  vec3 col;

  if (mode < 0.5) {
    col = mode_tape(uv, u_time);
  } else if (mode < 1.5) {
    col = mode_radiation(uv, u_time);
  } else if (mode < 2.5) {
    col = mode_liverwort(uv, u_time);
  } else {
    col = mode_journey(uv, u_time);
  }

  // Cross-fade at mode boundaries
  if (blend_out > 0.0) {
    float next_mode = mod(mode + 1.0, 4.0);
    vec3 next_col;
    if (next_mode < 0.5) {
      next_col = mode_tape(uv, u_time);
    } else if (next_mode < 1.5) {
      next_col = mode_radiation(uv, u_time);
    } else if (next_mode < 2.5) {
      next_col = mode_liverwort(uv, u_time);
    } else {
      next_col = mode_journey(uv, u_time);
    }
    col = mix(col, next_col, blend_out);
  }

  // Subtle vignette
  float vignette = 1.0 - 0.4 * length(uv);
  col *= vignette;

  // Gamma correction
  col = pow(col, vec3(1.0 / 2.2));

  fragColor = vec4(col, 1.0);
}
