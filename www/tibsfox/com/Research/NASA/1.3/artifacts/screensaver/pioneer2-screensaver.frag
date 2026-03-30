#version 330 core

// Pioneer 2 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Salal berry cluster with dew drops — dark purple berries, waxy bloom
//   Mode 1: Solid rocket grain cross-section — star perforation, combustion front (that never lights)
//   Mode 2: Spectral emission lines — Bunsen flame colors, element fingerprints
//   Mode 3: Black-capped chickadee hopping between salal branches
//
// Compile: glslangValidator pioneer2-screensaver.frag
// Run:     glslViewer pioneer2-screensaver.frag
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
const vec3 BERRY_DARK    = vec3(0.176, 0.098, 0.259);   // #2D1942
const vec3 BERRY_PURPLE  = vec3(0.420, 0.247, 0.627);   // #6B3FA0
const vec3 BERRY_BLOOM   = vec3(0.550, 0.450, 0.650);   // waxy frost
const vec3 SALAL_LEAF    = vec3(0.165, 0.290, 0.165);   // #2A4A2A
const vec3 SALAL_LIGHT   = vec3(0.290, 0.420, 0.290);   // lighter leaf
const vec3 DEW_DROP      = vec3(0.700, 0.750, 0.850);   // water highlight
const vec3 GRAIN_TAN     = vec3(0.600, 0.500, 0.350);   // propellant color
const vec3 GRAIN_DARK    = vec3(0.200, 0.150, 0.100);   // burnt propellant
const vec3 CASING_GRAY   = vec3(0.300, 0.310, 0.320);   // motor casing
const vec3 FLAME_YELLOW  = vec3(1.000, 0.850, 0.200);   // sodium
const vec3 FLAME_RED     = vec3(0.900, 0.200, 0.100);   // lithium/rubidium
const vec3 FLAME_BLUE    = vec3(0.200, 0.400, 0.900);   // cesium
const vec3 FLAME_VIOLET  = vec3(0.500, 0.200, 0.800);   // potassium
const vec3 CHICKADEE_BLK = vec3(0.080, 0.080, 0.090);   // cap/bib
const vec3 CHICKADEE_WHT = vec3(0.850, 0.840, 0.820);   // cheek
const vec3 CHICKADEE_BUF = vec3(0.650, 0.580, 0.450);   // flanks

// ============================================================
// Mode 0: Salal Berry Cluster with Dew Drops
// ============================================================

vec4 salalBerries(vec2 uv, float t) {
  vec3 col = vec3(0.035, 0.025, 0.050);  // Deep forest shadow, purple-dark

  // Salal leaves behind the berries
  for (float i = 0.0; i < 8.0; i++) {
    float lx = (hash(vec2(i, 5.3)) - 0.5) * 0.8;
    float ly = (hash(vec2(i, 9.7)) - 0.5) * 0.5;
    float la = hash(vec2(i, 13.1)) * 6.28;
    float ls = 0.12 + hash(vec2(i, 17.3)) * 0.08;

    vec2 lp = uv - vec2(lx, ly);
    lp = rot(la) * lp;

    // Oval leaf shape
    float leaf_d = length(lp / vec2(ls, ls * 0.5));
    if (leaf_d < 1.0) {
      float edge = smoothstep(1.0, 0.85, leaf_d);
      // Leaf vein
      float vein = smoothstep(0.01, 0.0, abs(lp.y)) * 0.15;
      // Leaf texture
      float tex = vnoise(lp * 30.0 + vec2(i * 10.0, 0.0)) * 0.1;
      vec3 leaf_col = mix(SALAL_LEAF, SALAL_LIGHT, tex + vein);
      // Depth layering
      leaf_col *= (0.6 + hash(vec2(i, 21.7)) * 0.4);
      col = mix(col, leaf_col, edge * 0.8);
    }
  }

  // Berry cluster — 12-15 berries in a hanging raceme
  float phase = mod(t / 15.0, 1.0);
  for (float b = 0.0; b < 14.0; b++) {
    // Arrange berries along a drooping stem
    float bt = b / 14.0;
    float stem_x = sin(bt * 2.5 + 0.5) * 0.12;
    float stem_y = 0.25 - bt * 0.45;

    // Slight sway
    stem_x += sin(t * 0.5 + b * 0.3) * 0.008;

    float berry_r = 0.028 + hash(vec2(b, 37.1)) * 0.012;
    // Growth animation
    float grow = smoothstep(bt - 0.05, bt + 0.1, phase);
    berry_r *= grow;

    vec2 bp = uv - vec2(stem_x, stem_y);
    float bd = length(bp);

    if (bd < berry_r) {
      float berry_t = bd / berry_r;

      // Berry shading: dark center, lighter edge (waxy bloom)
      vec3 berry_col = mix(BERRY_DARK, BERRY_PURPLE, berry_t * 0.5);

      // Waxy bloom (lighter frosted appearance on surface)
      float bloom = smoothstep(0.5, 0.9, berry_t);
      berry_col = mix(berry_col, BERRY_BLOOM, bloom * 0.3);

      // Specular highlight
      vec2 light_dir = normalize(vec2(0.3, 0.5));
      float spec = max(0.0, dot(normalize(bp), light_dir));
      spec = pow(spec, 12.0);
      berry_col += vec3(0.4, 0.35, 0.5) * spec * 0.6;

      // Dew drops on some berries
      if (hash(vec2(b, 43.7)) > 0.5) {
        vec2 dew_offset = vec2(
          hash(vec2(b, 47.1)) * 0.012 - 0.006,
          hash(vec2(b, 51.3)) * 0.012 - 0.006
        );
        float dew_r = 0.004 + hash(vec2(b, 55.7)) * 0.003;
        float dew_d = length(bp - dew_offset);
        if (dew_d < dew_r) {
          float dew_t = dew_d / dew_r;
          // Dew drop: bright center, transparent edge
          float dew_alpha = smoothstep(1.0, 0.3, dew_t);
          vec3 dew_col = mix(DEW_DROP, vec3(1.0), pow(1.0 - dew_t, 4.0));
          berry_col = mix(berry_col, dew_col, dew_alpha * 0.7);
        }
      }

      col = mix(col, berry_col, smoothstep(berry_r, berry_r * 0.9, bd));
    }

    // Stem connecting berries
    if (b > 0.0) {
      float prev_bt = (b - 1.0) / 14.0;
      float prev_x = sin(prev_bt * 2.5 + 0.5) * 0.12 + sin(t * 0.5 + (b-1.0) * 0.3) * 0.008;
      float prev_y = 0.25 - prev_bt * 0.45;

      // Line between berries (stem segment)
      vec2 stem_a = vec2(prev_x, prev_y);
      vec2 stem_b_pos = vec2(stem_x, stem_y);
      vec2 ab = stem_b_pos - stem_a;
      float ab_len = length(ab);
      if (ab_len > 0.001) {
        vec2 ab_n = ab / ab_len;
        float proj = dot(uv - stem_a, ab_n);
        if (proj > 0.0 && proj < ab_len) {
          vec2 closest = stem_a + ab_n * proj;
          float stem_d = length(uv - closest);
          if (stem_d < 0.002) {
            col = mix(col, SALAL_LEAF * 0.6, smoothstep(0.002, 0.001, stem_d) * grow);
          }
        }
      }
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Solid Rocket Grain Cross-Section
// ============================================================

vec4 rocketGrain(vec2 uv, float t) {
  vec3 col = vec3(0.03, 0.03, 0.04);

  // Motor casing — outer circle
  float casing_r = 0.38;
  float casing_d = length(uv);

  if (casing_d < casing_r + 0.01 && casing_d > casing_r - 0.01) {
    col = CASING_GRAY;
  }

  // Propellant grain — fills the casing
  if (casing_d < casing_r - 0.01) {
    // Star perforation pattern — the hollow center of the grain
    // A 6-pointed star shape in the center
    float angle = atan(uv.y, uv.x);
    float r = length(uv);

    // Star shape: alternating inner and outer radii
    float star_points = 6.0;
    float star_angle = mod(angle, 6.28318 / star_points) - 3.14159 / star_points;
    float inner_r = 0.06;
    float outer_r = 0.15;
    float star_r = mix(outer_r, inner_r, cos(star_angle * star_points) * 0.5 + 0.5);

    if (r < star_r) {
      // Inside the star perforation — empty (where combustion gases go)
      col = vec3(0.02, 0.02, 0.03);

      // The failed ignition: normally we'd show a combustion front here
      // Instead, show a faint pulsing "waiting" indicator
      float pulse = sin(t * 2.0) * 0.5 + 0.5;
      float wait_ring = abs(r - star_r * 0.5) - 0.003;
      if (wait_ring < 0.002) {
        // Faint red ring: the ignition that never happened
        col += vec3(0.3, 0.05, 0.02) * pulse * 0.5;
      }

      // "NO IGNITION" text effect: scattered red dots that don't connect
      // Sparse, incomplete — the squib never fired
      float spark_hash = hash(floor(uv * 200.0 + vec2(t * 0.5, 0.0)));
      if (spark_hash > 0.998 && r > star_r * 0.3) {
        col += vec3(0.5, 0.1, 0.05) * 0.3;  // Faint unfired sparks
      }
    } else if (r < casing_r - 0.01) {
      // Propellant grain — tan/brown, with texture
      float grain_tex = vnoise(uv * 40.0) * 0.15;
      col = mix(GRAIN_TAN, GRAIN_DARK, grain_tex);

      // Grain structure — subtle radial striations
      float striation = sin(angle * 20.0 + vnoise(uv * 15.0) * 3.0) * 0.08;
      col += vec3(striation * 0.5, striation * 0.4, striation * 0.2);

      // The grain is INTACT — no combustion front propagating
      // This is the visual of unfired propellant: uniform, undisturbed
      // In a successful ignition, we'd show a burning front spreading
      // from the star perforation outward. Here: nothing. Just waiting.
    }
  }

  // Annotation: squib location (bottom of the motor)
  float squib_y = -casing_r - 0.04;
  float squib_d = length(uv - vec2(0.0, squib_y));
  if (squib_d < 0.015) {
    // Squib: should be glowing, but it's dark
    float squib_pulse = sin(t * 3.0) * 0.5 + 0.5;
    col = mix(vec3(0.1, 0.02, 0.02), vec3(0.25, 0.05, 0.03), squib_pulse * 0.3);
  }

  // Wire from squib (broken!)
  if (uv.x > -0.15 && uv.x < 0.15 && abs(uv.y - (squib_y - 0.015)) < 0.002) {
    // Wire runs left to right but has a GAP in the middle
    if (abs(uv.x) > 0.02) {  // Gap: -0.02 to +0.02
      col = vec3(0.5, 0.3, 0.1);  // Copper wire color
    } else {
      // The gap — the break in the circuit
      // Faint red pulse where the connection should be
      float gap_pulse = sin(t * 4.0) * 0.5 + 0.5;
      col += vec3(0.3, 0.0, 0.0) * gap_pulse * 0.15;
    }
  }

  // Labels (subtle text-like markers)
  // "STAR GRAIN" at top
  if (uv.y > casing_r + 0.03 && uv.y < casing_r + 0.05 && abs(uv.x) < 0.08) {
    col += vec3(0.15, 0.12, 0.08);
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Spectral Emission Lines (Bunsen Flame)
// ============================================================

vec4 spectralLines(vec2 uv, float t) {
  vec3 col = vec3(0.015, 0.010, 0.020);

  // Bunsen burner flame at the bottom
  float flame_base_y = -0.35;
  vec2 flame_uv = uv - vec2(0.0, flame_base_y);

  // Flame shape: tapered upward, flickering
  float flame_h = 0.25 + sin(t * 3.0) * 0.02;
  float flame_w = 0.06 * (1.0 - flame_uv.y / flame_h);
  flame_w = max(flame_w, 0.0);
  float flame_flicker = sin(t * 7.0 + uv.y * 20.0) * 0.008;

  if (flame_uv.y > 0.0 && flame_uv.y < flame_h && abs(flame_uv.x - flame_flicker) < flame_w) {
    float ft = flame_uv.y / flame_h;
    // Inner cone (blue, hot)
    float inner_w = flame_w * 0.4;
    if (abs(flame_uv.x - flame_flicker) < inner_w) {
      col = mix(vec3(0.2, 0.3, 0.9), vec3(0.3, 0.5, 1.0), ft);
    } else {
      // Outer cone (varies by element being burned)
      float element_phase = mod(t / 5.0, 4.0);
      vec3 outer_col;
      if (element_phase < 1.0) {
        outer_col = FLAME_YELLOW;  // Sodium
      } else if (element_phase < 2.0) {
        outer_col = FLAME_RED;     // Lithium
      } else if (element_phase < 3.0) {
        outer_col = FLAME_BLUE;    // Cesium
      } else {
        outer_col = FLAME_VIOLET;  // Potassium
      }
      float outer_alpha = (1.0 - ft) * 0.8;
      col = mix(col, outer_col, outer_alpha);
    }
  }

  // Burner body (simple rectangle at bottom)
  if (uv.y < flame_base_y && uv.y > flame_base_y - 0.08 && abs(uv.x) < 0.02) {
    col = CASING_GRAY * 0.8;
  }

  // Spectral lines above the flame — the dispersed spectrum
  // These appear as vertical bright lines at specific x-positions
  // corresponding to wavelengths

  float spectrum_y_start = 0.0;
  float spectrum_y_end = 0.35;
  float spectrum_h = spectrum_y_end - spectrum_y_start;

  if (uv.y > spectrum_y_start && uv.y < spectrum_y_end) {
    // Background: faint continuous spectrum (blackbody)
    float wavelength_norm = (uv.x + 0.5);  // 0 = left (violet 400nm), 1 = right (red 700nm)
    if (wavelength_norm > 0.0 && wavelength_norm < 1.0) {
      // Faint rainbow background
      vec3 rainbow;
      if (wavelength_norm < 0.15) {
        rainbow = mix(vec3(0.3, 0.0, 0.5), vec3(0.1, 0.0, 0.8), wavelength_norm / 0.15);
      } else if (wavelength_norm < 0.35) {
        rainbow = mix(vec3(0.1, 0.0, 0.8), vec3(0.0, 0.6, 0.3), (wavelength_norm - 0.15) / 0.20);
      } else if (wavelength_norm < 0.55) {
        rainbow = mix(vec3(0.0, 0.6, 0.3), vec3(0.9, 0.9, 0.0), (wavelength_norm - 0.35) / 0.20);
      } else if (wavelength_norm < 0.75) {
        rainbow = mix(vec3(0.9, 0.9, 0.0), vec3(0.9, 0.4, 0.0), (wavelength_norm - 0.55) / 0.20);
      } else {
        rainbow = mix(vec3(0.9, 0.4, 0.0), vec3(0.8, 0.0, 0.0), (wavelength_norm - 0.75) / 0.25);
      }
      col += rainbow * 0.03;

      // Emission lines — bright vertical lines at specific wavelengths
      float element_phase = mod(t / 5.0, 4.0);

      // Each element has its characteristic lines
      // Positions mapped to wavelength_norm (0=400nm, 1=700nm)
      if (element_phase < 1.0) {
        // Sodium: yellow doublet at 589 nm (wavelength_norm ~ 0.63)
        float na_intensity = smoothstep(1.0, 0.0, element_phase) +
                            smoothstep(0.0, 1.0, element_phase);
        float na1 = smoothstep(0.004, 0.0, abs(wavelength_norm - 0.630));
        float na2 = smoothstep(0.004, 0.0, abs(wavelength_norm - 0.632));
        col += FLAME_YELLOW * (na1 + na2) * 0.9;
      } else if (element_phase < 2.0) {
        // Lithium: red 670nm, orange 610nm
        float li1 = smoothstep(0.004, 0.0, abs(wavelength_norm - 0.900));
        float li2 = smoothstep(0.004, 0.0, abs(wavelength_norm - 0.700));
        col += FLAME_RED * (li1 + li2 * 0.6) * 0.9;
      } else if (element_phase < 3.0) {
        // Cesium: blue 455nm, red 697nm (discovered by Bunsen!)
        float cs1 = smoothstep(0.004, 0.0, abs(wavelength_norm - 0.183));
        float cs2 = smoothstep(0.004, 0.0, abs(wavelength_norm - 0.990));
        col += FLAME_BLUE * cs1 * 0.9;
        col += FLAME_RED * cs2 * 0.5;
      } else {
        // Potassium: violet 404nm, red 766nm
        float k1 = smoothstep(0.004, 0.0, abs(wavelength_norm - 0.013));
        float k2 = smoothstep(0.004, 0.0, abs(wavelength_norm - 0.040));
        col += FLAME_VIOLET * (k1 + k2) * 0.9;
      }
    }

    // Wavelength scale at bottom of spectrum
    if (uv.y > spectrum_y_start && uv.y < spectrum_y_start + 0.01) {
      // Tick marks every ~50nm
      for (float nm = 400.0; nm <= 700.0; nm += 50.0) {
        float tick_x = (nm - 400.0) / 300.0 - 0.5;
        if (abs(uv.x - tick_x) < 0.002) {
          col += vec3(0.2);
        }
      }
    }
  }

  // Prism symbol (small triangle representing the spectroscope)
  vec2 prism_center = vec2(-0.35, 0.17);
  vec2 pp = uv - prism_center;
  // Equilateral triangle
  float prism_h = 0.05;
  float prism_w = prism_h * 1.15;
  if (pp.y > -prism_h * 0.5 && pp.y < prism_h * 0.5) {
    float hw = prism_w * 0.5 * (1.0 - (pp.y + prism_h * 0.5) / prism_h);
    if (abs(pp.x) < hw) {
      col = mix(col, vec3(0.3, 0.35, 0.4), 0.5);
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Black-capped Chickadee Hopping Between Branches
// ============================================================

vec4 chickadeeHop(vec2 uv, float t) {
  vec3 col = vec3(0.0);

  // Forest background — salal thicket
  float fog = fbm(vec2(uv.x * 1.5, uv.y * 0.8 + t * 0.01));
  vec3 bg = mix(vec3(0.04, 0.03, 0.05), vec3(0.08, 0.10, 0.07), fog);
  col = bg;

  // Salal branches (horizontal-ish stems with leaves)
  for (float i = 0.0; i < 8.0; i++) {
    float by = (hash(vec2(i, 3.7)) - 0.5) * 0.7;
    float bx_start = -0.7 + hash(vec2(i, 7.1)) * 0.3;
    float bx_end = bx_start + 0.4 + hash(vec2(i, 11.3)) * 0.5;
    float b_sag = hash(vec2(i, 15.7)) * 0.05;  // Branch sag

    // Branch line
    float branch_y = by + (uv.x - bx_start) * b_sag;
    if (uv.x > bx_start && uv.x < bx_end && abs(uv.y - branch_y) < 0.003) {
      col = mix(col, SALAL_LEAF * 0.5, 0.8);
    }

    // Leaves along branch
    for (float l = 0.0; l < 6.0; l++) {
      float lt = l / 6.0;
      float lx = bx_start + lt * (bx_end - bx_start);
      float ly = by + lt * (bx_end - bx_start) * b_sag;
      float l_angle = hash(vec2(i * 10.0 + l, 19.1)) * 2.0 - 1.0;
      float l_size = 0.025 + hash(vec2(i * 10.0 + l, 23.3)) * 0.015;

      vec2 lp = uv - vec2(lx, ly);
      lp = rot(l_angle) * lp;
      float ld = length(lp / vec2(l_size, l_size * 0.45));
      if (ld < 1.0) {
        float leaf_alpha = smoothstep(1.0, 0.7, ld);
        float leaf_tex = vnoise(lp * 50.0) * 0.15;
        vec3 leaf_col = mix(SALAL_LEAF, SALAL_LIGHT, leaf_tex);
        col = mix(col, leaf_col, leaf_alpha * 0.7);
      }
    }

    // Berries on some branches
    if (hash(vec2(i, 27.9)) > 0.5) {
      for (float berry = 0.0; berry < 3.0; berry++) {
        float berry_t = 0.3 + berry * 0.2;
        float berry_x = bx_start + berry_t * (bx_end - bx_start);
        float berry_y = by + berry_t * (bx_end - bx_start) * b_sag - 0.015;
        float berry_r = 0.008;
        float berry_d = length(uv - vec2(berry_x, berry_y));
        if (berry_d < berry_r) {
          col = mix(col, BERRY_PURPLE, smoothstep(berry_r, berry_r * 0.5, berry_d));
        }
      }
    }
  }

  // Chickadee — hopping between branches
  float hop_cycle = mod(t / 3.0, 1.0);  // 3 seconds per hop

  // Define hop positions (branch endpoints)
  float hop_start_x = -0.25 + mod(floor(t / 3.0), 4.0) * 0.15;
  float hop_end_x = hop_start_x + 0.15;
  float hop_start_y = 0.05 + sin(floor(t / 3.0) * 2.1) * 0.12;
  float hop_end_y = 0.05 + sin((floor(t / 3.0) + 1.0) * 2.1) * 0.12;

  // Hop trajectory: quick jump with parabolic arc
  float bird_x, bird_y;
  if (hop_cycle < 0.3) {
    // Sitting on branch (start)
    bird_x = hop_start_x;
    bird_y = hop_start_y;
  } else if (hop_cycle < 0.6) {
    // Hopping (parabolic arc)
    float hop_t = (hop_cycle - 0.3) / 0.3;
    bird_x = mix(hop_start_x, hop_end_x, hop_t);
    bird_y = mix(hop_start_y, hop_end_y, hop_t) + sin(hop_t * 3.14159) * 0.08;
  } else {
    // Sitting on branch (end)
    bird_x = hop_end_x;
    bird_y = hop_end_y;
  }

  // Tail bob when sitting
  float tail_bob = 0.0;
  if (hop_cycle < 0.3 || hop_cycle > 0.6) {
    tail_bob = sin(t * 6.0) * 0.005;
  }

  vec2 bp = uv - vec2(bird_x, bird_y + tail_bob);
  float bird_scale = 0.025;
  float bird_alpha = 0.0;
  vec3 bird_col = CHICKADEE_BUF;

  // Body — ellipse
  vec2 body_p = bp / vec2(bird_scale * 2.2, bird_scale * 1.2);
  float body_d = length(body_p);
  if (body_d < 1.0) {
    bird_alpha = smoothstep(1.0, 0.6, body_d);
    // Buff flanks
    bird_col = CHICKADEE_BUF;
    // Darker back
    if (body_p.y > 0.2) {
      bird_col = mix(bird_col, vec3(0.35, 0.38, 0.35), 0.6);
    }
  }

  // Head — circle
  vec2 head_p = (bp - vec2(bird_scale * 1.8, bird_scale * 0.5)) / (bird_scale * 0.8);
  float head_d = length(head_p);
  if (head_d < 1.0) {
    bird_alpha = max(bird_alpha, smoothstep(1.0, 0.5, head_d));
    // Black cap
    if (head_p.y > -0.1) {
      bird_col = CHICKADEE_BLK;
    }
    // White cheek
    if (head_p.y < 0.3 && head_p.y > -0.5 && head_p.x > -0.2) {
      bird_col = CHICKADEE_WHT;
    }
    // Black bib (below cheek)
    if (head_p.y < -0.4 && head_p.x > -0.1) {
      bird_col = CHICKADEE_BLK;
    }
    // Eye
    if (length(head_p - vec2(0.3, 0.15)) < 0.18) {
      bird_col = vec3(0.02);
    }
    // Beak
    if (head_p.x > 0.7 && abs(head_p.y) < 0.15 * (1.0 - (head_p.x - 0.7) * 2.0)) {
      bird_col = vec3(0.12);
    }
  }

  // Wings (when hopping)
  if (hop_cycle > 0.3 && hop_cycle < 0.6) {
    float flap = sin((hop_cycle - 0.3) / 0.3 * 12.56) * 0.2;
    for (float side = -1.0; side <= 1.0; side += 2.0) {
      vec2 wing_p = bp - vec2(0.0, bird_scale * 0.3);
      wing_p.y -= abs(wing_p.x) * flap * side;
      float wing_span = bird_scale * 2.5;
      if (wing_p.x * side > 0.0 && wing_p.x * side < wing_span) {
        float wt = wing_p.x * side / wing_span;
        float wing_w = bird_scale * 0.8 * (1.0 - wt * 0.7);
        if (abs(wing_p.y) < wing_w) {
          float wa = (1.0 - wt) * smoothstep(wing_w, wing_w * 0.3, abs(wing_p.y));
          bird_alpha = max(bird_alpha, wa);
          bird_col = vec3(0.30, 0.32, 0.30);
          // White wing bar
          if (wt > 0.3 && wt < 0.5) {
            bird_col = vec3(0.75);
          }
        }
      }
    }
  }

  // Tail
  vec2 tail_p = bp - vec2(-bird_scale * 2.0, bird_scale * 0.0 + tail_bob);
  float tail_len = bird_scale * 1.5;
  float tail_w = bird_scale * 0.4;
  if (tail_p.x < 0.0 && tail_p.x > -tail_len) {
    float tt = -tail_p.x / tail_len;
    float tw = tail_w * (1.0 - tt * 0.5);
    if (abs(tail_p.y) < tw) {
      float ta = (1.0 - tt * 0.5) * smoothstep(tw, tw * 0.3, abs(tail_p.y));
      bird_alpha = max(bird_alpha, ta * 0.8);
      bird_col = vec3(0.28, 0.30, 0.32);
    }
  }

  col = mix(col, bird_col, bird_alpha);

  // Light filtering through the thicket
  for (float l = 0.0; l < 4.0; l++) {
    float lx = (hash(vec2(l, 31.7)) - 0.5) * 1.2;
    float shaft_w = 0.02 + hash(vec2(l, 37.1)) * 0.03;
    float shaft_d = abs(uv.x - lx);
    if (shaft_d < shaft_w) {
      float shaft_a = (1.0 - shaft_d / shaft_w) * 0.05;
      shaft_a *= smoothstep(-0.3, 0.2, uv.y);
      col += vec3(0.10, 0.08, 0.12) * shaft_a;  // Purple-tinted light
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Main — Mode cycling with crossfade
// ============================================================

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;

  // 60-second total cycle, 15 seconds per mode
  float cycle = mod(iTime, 60.0);
  int mode = int(cycle / 15.0);

  // Cross-fade between modes (last 2 seconds of each 15-second block)
  float mode_t = mod(cycle, 15.0);
  float fade = smoothstep(13.0, 15.0, mode_t);

  vec4 current_col, next_col;

  if (mode == 0) {
    current_col = salalBerries(uv, iTime);
    next_col = rocketGrain(uv, iTime);
  } else if (mode == 1) {
    current_col = rocketGrain(uv, iTime);
    next_col = spectralLines(uv, iTime);
  } else if (mode == 2) {
    current_col = spectralLines(uv, iTime);
    next_col = chickadeeHop(uv, iTime);
  } else {
    current_col = chickadeeHop(uv, iTime);
    next_col = salalBerries(uv, iTime);
  }

  fragColor = mix(current_col, next_col, fade);
}
