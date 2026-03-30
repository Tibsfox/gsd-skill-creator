#version 330 core

// Pioneer 3 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Usnea lichen strands hanging from branches — pale-green filaments, wind sway
//   Mode 1: Dual radiation rings — Earth center, inner (warm), outer (cool), slot gap
//   Mode 2: Cartesian coordinate grid — rotating 3D grid, Pioneer 3 parabolic trajectory
//   Mode 3: Spotted owl eyes — two amber circles in old-growth darkness, slow blink
//
// Compile: glslangValidator pioneer3-screensaver.frag
// Run:     glslViewer pioneer3-screensaver.frag
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
const vec3 BARK_DARK     = vec3(0.102, 0.078, 0.031);   // #1A1408
const vec3 BARK_MID      = vec3(0.180, 0.140, 0.080);   // mid bark
const vec3 LICHEN_GREEN  = vec3(0.722, 0.788, 0.616);   // #B8C99D
const vec3 LICHEN_PALE   = vec3(0.780, 0.830, 0.700);   // pale tips
const vec3 LICHEN_DIM    = vec3(0.400, 0.480, 0.320);   // shadow strands
const vec3 INNER_WARM    = vec3(0.950, 0.750, 0.200);   // warm yellow belt
const vec3 OUTER_COOL    = vec3(0.250, 0.500, 0.900);   // cool blue belt
const vec3 EARTH_BLUE    = vec3(0.150, 0.300, 0.600);   // Earth
const vec3 EARTH_GREEN   = vec3(0.200, 0.400, 0.250);   // continents
const vec3 GRID_COLOR    = vec3(0.300, 0.500, 0.300);   // Cartesian grid
const vec3 TRAJ_GLOW     = vec3(0.800, 0.900, 0.500);   // trajectory
const vec3 OWL_AMBER     = vec3(0.850, 0.600, 0.100);   // amber iris
const vec3 OWL_PUPIL     = vec3(0.020, 0.020, 0.030);   // deep black
const vec3 OWL_BROWN     = vec3(0.250, 0.180, 0.120);   // feathers

// ============================================================
// Mode 0: Usnea Lichen Strands
// ============================================================
// Thin pale-green filaments hanging from branches, slight wind sway,
// dark bark background. Old Man's Beard — the dual organism.

vec4 usneaLichen(vec2 uv, float t) {
  vec3 col = BARK_DARK;

  // Bark texture background
  float bark_tex = fbm(vec2(uv.x * 8.0, uv.y * 3.0 + 5.0));
  col = mix(BARK_DARK, BARK_MID, bark_tex * 0.4);

  // Vertical bark ridges
  float ridge = sin(uv.x * 40.0 + vnoise(uv * 10.0) * 3.0) * 0.5 + 0.5;
  col = mix(col, BARK_DARK * 0.7, ridge * 0.15);

  // Horizontal branches (lichen hangs from these)
  for (float b = 0.0; b < 5.0; b++) {
    float by = 0.35 - b * 0.14;
    float bx_wobble = sin(b * 2.3 + uv.x * 3.0) * 0.015;
    float branch_d = abs(uv.y - (by + bx_wobble));
    float branch_w = 0.008 + hash(vec2(b, 3.1)) * 0.005;
    if (branch_d < branch_w) {
      float branch_shade = smoothstep(branch_w, 0.0, branch_d);
      col = mix(col, BARK_MID * 1.2, branch_shade * 0.8);
    }

    // Lichen strands hanging from each branch
    for (float s = 0.0; s < 12.0; s++) {
      float sx = -0.5 + (s + hash(vec2(b * 20.0 + s, 7.3))) / 12.0;
      float strand_width = 0.0015 + hash(vec2(b * 20.0 + s, 11.7)) * 0.001;
      float strand_len = 0.08 + hash(vec2(b * 20.0 + s, 15.1)) * 0.15;

      // Wind sway — gentle, slow, different phase per strand
      float sway_phase = t * 0.4 + b * 1.3 + s * 0.7;
      float sway_amount = 0.01 + hash(vec2(b * 20.0 + s, 19.3)) * 0.015;
      float sway = sin(sway_phase) * sway_amount;

      // Additional micro-sway increases with distance from branch
      float dy = by - uv.y;
      if (dy > 0.0 && dy < strand_len) {
        float progress = dy / strand_len;
        float strand_sway = sway * progress * progress;  // More sway at tips
        float micro_sway = sin(t * 1.5 + s * 3.0 + dy * 20.0) * 0.003 * progress;

        float strand_x = sx + strand_sway + micro_sway;
        float strand_d = abs(uv.x - strand_x);

        if (strand_d < strand_width) {
          float alpha = smoothstep(strand_width, strand_width * 0.3, strand_d);
          // Color varies along strand: brighter at top, dimmer at tips
          float color_t = progress;
          vec3 strand_col = mix(LICHEN_GREEN, LICHEN_DIM, color_t * 0.6);
          // Pale tips on some strands
          if (progress > 0.85 && hash(vec2(b * 20.0 + s, 23.7)) > 0.5) {
            strand_col = mix(strand_col, LICHEN_PALE, (progress - 0.85) / 0.15);
          }
          // Slight luminance variation
          strand_col *= (0.8 + vnoise(vec2(uv.x * 50.0, uv.y * 50.0 + t * 0.2)) * 0.4);
          col = mix(col, strand_col, alpha * 0.85);
        }
      }
    }
  }

  // Faint fog/moisture in the air (old-growth humidity)
  float fog = fbm(vec2(uv.x * 2.0 + t * 0.05, uv.y * 1.5)) * 0.06;
  col += vec3(0.15, 0.18, 0.12) * fog;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Dual Radiation Rings
// ============================================================
// Earth at center, inner ring (warm yellow), outer ring (cool blue),
// animated particles trapped in each belt, visible slot gap.

vec4 dualBelts(vec2 uv, float t) {
  vec3 col = vec3(0.01, 0.01, 0.02);  // Deep space

  float r = length(uv);
  float angle = atan(uv.y, uv.x);

  // Earth at center
  float earth_r = 0.06;
  if (r < earth_r) {
    float earth_t = r / earth_r;
    // Simple Earth: blue oceans, green patches
    float continent = vnoise(vec2(angle * 2.0 + t * 0.1, r * 30.0));
    vec3 earth_col = mix(EARTH_BLUE, EARTH_GREEN, smoothstep(0.45, 0.55, continent));
    // Atmosphere glow at edge
    float atmo = smoothstep(0.7, 1.0, earth_t);
    earth_col = mix(earth_col, vec3(0.4, 0.6, 1.0), atmo * 0.4);
    col = earth_col;
  }

  // Atmospheric glow just outside Earth
  if (r > earth_r && r < earth_r + 0.015) {
    float glow = smoothstep(earth_r + 0.015, earth_r, r);
    col += vec3(0.1, 0.2, 0.5) * glow * 0.5;
  }

  // Inner Van Allen Belt: warm yellow, r = 0.10 to 0.18
  float inner_center = 0.14;
  float inner_width = 0.04;
  float inner_intensity = exp(-pow((r - inner_center) / inner_width, 2.0));

  if (inner_intensity > 0.01) {
    // Belt color: warm yellow
    vec3 inner_col = INNER_WARM * inner_intensity;

    // Trapped particle animation: particles spiral along field lines
    float particle_angle = angle + t * 0.8;
    float particle_pattern = sin(particle_angle * 12.0 + r * 80.0) * 0.5 + 0.5;
    particle_pattern *= sin(particle_angle * 7.0 - t * 1.2 + r * 50.0) * 0.5 + 0.5;

    // Individual bright particles
    float bright_particles = 0.0;
    for (float p = 0.0; p < 20.0; p++) {
      float p_angle = mod(t * (0.5 + hash(vec2(p, 1.1)) * 0.8) + p * 0.314, 6.28318);
      float p_r = inner_center + sin(t * 0.3 + p * 0.7) * inner_width * 0.6;
      vec2 p_pos = vec2(cos(p_angle) * p_r, sin(p_angle) * p_r);
      float p_d = length(uv - p_pos);
      bright_particles += smoothstep(0.006, 0.0, p_d) * 0.4;
    }

    col += inner_col * (0.3 + particle_pattern * 0.4) + INNER_WARM * bright_particles;
  }

  // Slot Region: r = 0.18 to 0.24 — notably quiet
  // Just a faint glow to show it exists but is empty
  float slot_center = 0.21;
  float slot_glow = exp(-pow((r - slot_center) / 0.03, 2.0)) * 0.02;
  col += vec3(0.1, 0.1, 0.1) * slot_glow;

  // Outer Van Allen Belt: cool blue, r = 0.24 to 0.40
  float outer_center = 0.32;
  float outer_width = 0.08;
  float outer_intensity = exp(-pow((r - outer_center) / outer_width, 2.0));

  if (outer_intensity > 0.01) {
    vec3 outer_col = OUTER_COOL * outer_intensity;

    // Outer belt particles: more diffuse, slower, electron-dominated
    float outer_particle_angle = angle - t * 0.4;  // Opposite direction
    float outer_pattern = sin(outer_particle_angle * 8.0 + r * 40.0) * 0.5 + 0.5;
    outer_pattern *= sin(outer_particle_angle * 5.0 + t * 0.6) * 0.5 + 0.5;

    // Broader, dimmer particles (electrons are lighter, more spread)
    float outer_particles = 0.0;
    for (float p = 0.0; p < 15.0; p++) {
      float p_angle = mod(-t * (0.3 + hash(vec2(p, 5.1)) * 0.5) + p * 0.419, 6.28318);
      float p_r = outer_center + sin(t * 0.2 + p * 0.5) * outer_width * 0.5;
      vec2 p_pos = vec2(cos(p_angle) * p_r, sin(p_angle) * p_r);
      float p_d = length(uv - p_pos);
      outer_particles += smoothstep(0.008, 0.0, p_d) * 0.3;
    }

    col += outer_col * (0.25 + outer_pattern * 0.35) + OUTER_COOL * outer_particles;
  }

  // Magnetic field lines (subtle, curved)
  for (float fl = 0.0; fl < 6.0; fl++) {
    float fl_angle = fl * 1.0472 + t * 0.02;  // 60 degrees apart, slow rotation
    // Dipole field line: r = r0 * cos^2(theta) simplified as curves
    float line_angle_offset = angle - fl_angle;
    float field_r = 0.45 * cos(line_angle_offset) * cos(line_angle_offset);
    if (field_r > 0.06) {
      float field_d = abs(r - field_r);
      if (field_d < 0.002) {
        col += vec3(0.08, 0.12, 0.15) * smoothstep(0.002, 0.0, field_d);
      }
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Cartesian Coordinate Grid (Descartes)
// ============================================================
// Rotating 3D grid with Pioneer 3's parabolic trajectory.

vec4 cartesianGrid(vec2 uv, float t) {
  vec3 col = vec3(0.02, 0.03, 0.02);  // Dark background

  // Slow rotation
  float rot_angle = t * 0.15;
  float tilt = 0.3 + sin(t * 0.08) * 0.1;

  // 3D to 2D projection (simple orthographic with rotation)
  // Draw grid lines in XY plane, rotated in 3D

  // Grid spacing
  float grid_sp = 0.12;

  // Rotated grid - X lines
  for (float i = -4.0; i <= 4.0; i++) {
    float gx = i * grid_sp;
    // Apply rotation
    float rx = gx * cos(rot_angle);
    float ry_offset = gx * sin(rot_angle) * sin(tilt);

    // Draw vertical line at rotated position
    float d = abs(uv.x - rx);
    if (d < 0.001) {
      float alpha = smoothstep(0.001, 0.0, d) * 0.3;
      // Fade with depth
      alpha *= (1.0 - abs(ry_offset) * 1.5);
      col += GRID_COLOR * alpha;
    }
  }

  // Y lines (horizontal in the rotated plane)
  for (float j = -4.0; j <= 4.0; j++) {
    float gy = j * grid_sp;
    float ry = gy * cos(tilt);

    float d = abs(uv.y - ry);
    if (d < 0.001) {
      float alpha = smoothstep(0.001, 0.0, d) * 0.3;
      col += GRID_COLOR * alpha;
    }
  }

  // X and Y axes (brighter)
  float x_axis_d = abs(uv.y - 0.0);
  float y_axis_d = abs(uv.x - 0.0);
  if (x_axis_d < 0.002) {
    col += GRID_COLOR * smoothstep(0.002, 0.0, x_axis_d) * 0.6;
  }
  if (y_axis_d < 0.002) {
    col += GRID_COLOR * smoothstep(0.002, 0.0, y_axis_d) * 0.6;
  }

  // Axis arrows
  // X-axis arrow at right
  vec2 arrow_x = uv - vec2(0.48, 0.0);
  if (arrow_x.x > -0.02 && arrow_x.x < 0.0 && abs(arrow_x.y) < (-arrow_x.x) * 1.5) {
    col += GRID_COLOR * 0.5;
  }
  // Y-axis arrow at top
  vec2 arrow_y = uv - vec2(0.0, 0.42);
  if (arrow_y.y > -0.02 && arrow_y.y < 0.0 && abs(arrow_y.x) < (-arrow_y.y) * 1.5) {
    col += GRID_COLOR * 0.5;
  }

  // Origin marker (small cross)
  if (length(uv) < 0.008 && (abs(uv.x) < 0.001 || abs(uv.y) < 0.001)) {
    col += vec3(0.5, 0.6, 0.4);
  }

  // Pioneer 3 trajectory: a parabolic arc
  // y = -a*x^2 + b (rises, peaks, falls back)
  // Parametric: x sweeps from -0.35 to 0.35, y = peak - k*x^2
  float peak_y = 0.32;   // Apogee (102,322 km)
  float curve_k = 2.5;

  // Draw trajectory as points
  float traj_progress = mod(t * 0.3, 1.0);  // Animated point moving along
  float min_traj_d = 1.0;
  vec2 traj_point = vec2(0.0);

  for (float s = 0.0; s < 80.0; s++) {
    float st = s / 80.0;
    float tx = (st - 0.5) * 0.7;
    float ty = peak_y - curve_k * tx * tx - 0.15;

    vec2 tp = vec2(tx, ty);
    float d = length(uv - tp);

    // Trajectory line
    if (d < 0.003) {
      float glow = smoothstep(0.003, 0.0, d);
      // Color shifts from warm (launch) to cool (apogee) to warm (reentry)
      float color_mix = abs(st - 0.5) * 2.0;
      vec3 traj_col = mix(TRAJ_GLOW, INNER_WARM, color_mix * 0.5);
      col += traj_col * glow * 0.7;
    }

    // Animated point (Pioneer 3 moving along trajectory)
    if (abs(st - traj_progress) < 0.015) {
      if (d < min_traj_d) {
        min_traj_d = d;
        traj_point = tp;
      }
    }
  }

  // Pioneer 3 spacecraft marker (bright dot with glow)
  float spacecraft_d = length(uv - traj_point);
  if (spacecraft_d < 0.02) {
    float sc_glow = smoothstep(0.02, 0.0, spacecraft_d);
    col += TRAJ_GLOW * sc_glow * 1.2;
    // Bright core
    if (spacecraft_d < 0.005) {
      col += vec3(1.0, 1.0, 0.8) * smoothstep(0.005, 0.0, spacecraft_d) * 0.8;
    }
  }

  // Altitude labels at key points (represented as small markers)
  // Apogee marker
  vec2 apogee_pos = vec2(0.0, peak_y - 0.15);
  if (length(uv - apogee_pos) < 0.004) {
    col += vec3(0.8, 0.9, 0.5);
  }
  // Dashed line from apogee to y-axis
  if (abs(uv.y - (peak_y - 0.15)) < 0.001 && uv.x > -0.02 && uv.x < 0.0) {
    if (mod(uv.x * 200.0, 2.0) > 1.0) {
      col += GRID_COLOR * 0.3;
    }
  }

  // Coordinate equation text area (represented as subtle glow)
  // "y = x^2" region hint at bottom right
  vec2 eq_center = vec2(0.30, -0.30);
  float eq_d = length(uv - eq_center);
  if (eq_d < 0.06) {
    col += GRID_COLOR * smoothstep(0.06, 0.02, eq_d) * 0.08;
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Spotted Owl Eyes
// ============================================================
// Two large amber circles glowing in old-growth darkness, slow blink.

vec4 owlEyes(vec2 uv, float t) {
  vec3 col = vec3(0.0);

  // Old-growth forest darkness with subtle texture
  float dark_forest = fbm(vec2(uv.x * 3.0 + 1.0, uv.y * 2.0));
  col = mix(vec3(0.015, 0.012, 0.010), vec3(0.035, 0.030, 0.025), dark_forest);

  // Faint tree trunk silhouettes
  for (float tr = 0.0; tr < 6.0; tr++) {
    float trunk_x = (hash(vec2(tr, 3.7)) - 0.5) * 1.6;
    float trunk_w = 0.03 + hash(vec2(tr, 7.1)) * 0.04;
    float trunk_d = abs(uv.x - trunk_x);
    if (trunk_d < trunk_w) {
      float trunk_alpha = smoothstep(trunk_w, trunk_w * 0.5, trunk_d) * 0.08;
      col = mix(col, vec3(0.05, 0.04, 0.03), trunk_alpha);
    }
  }

  // Owl facial disc (subtle circle of feathers)
  vec2 face_center = vec2(0.0, 0.02);
  float face_r = 0.28;
  float face_d = length(uv - face_center);

  if (face_d < face_r) {
    float face_t = face_d / face_r;
    // Facial disc: radial feather pattern, brown
    float feather_angle = atan(uv.y - face_center.y, uv.x - face_center.x);
    float feather_pattern = sin(feather_angle * 24.0) * 0.5 + 0.5;
    float feather_radial = vnoise(vec2(feather_angle * 3.0, face_d * 10.0)) * 0.3;

    vec3 disc_col = OWL_BROWN * (0.6 + feather_pattern * 0.15 + feather_radial);
    // Lighter ring at rim of facial disc
    float rim = smoothstep(0.85, 0.95, face_t);
    disc_col = mix(disc_col, OWL_BROWN * 1.3, rim * 0.4);

    float disc_alpha = smoothstep(face_r, face_r - 0.03, face_d) * 0.6;
    col = mix(col, disc_col, disc_alpha);
  }

  // White spots on head/face (spotted owl markings)
  for (float sp = 0.0; sp < 15.0; sp++) {
    vec2 spot_pos = face_center + vec2(
      (hash(vec2(sp, 41.7)) - 0.5) * 0.4,
      (hash(vec2(sp, 45.1)) - 0.5) * 0.4
    );
    float spot_r = 0.005 + hash(vec2(sp, 49.3)) * 0.005;
    float spot_d = length(uv - spot_pos);
    if (spot_d < spot_r && length(spot_pos - face_center) < face_r * 0.9) {
      col = mix(col, vec3(0.7, 0.65, 0.55), smoothstep(spot_r, spot_r * 0.3, spot_d) * 0.3);
    }
  }

  // Blink timing: slow blink every ~8 seconds
  float blink_cycle = mod(t, 8.0);
  float blink = 1.0;
  // Blink: close at 4.0s, open at 4.4s
  if (blink_cycle > 4.0 && blink_cycle < 4.4) {
    float blink_phase = (blink_cycle - 4.0) / 0.4;
    // Close then open: 0→1→0
    blink = abs(blink_phase - 0.5) * 2.0;
  }

  // Eye parameters
  float eye_spacing = 0.10;
  float eye_r = 0.065;

  // Draw both eyes
  for (float side = -1.0; side <= 1.0; side += 2.0) {
    vec2 eye_center = face_center + vec2(side * eye_spacing, 0.03);

    // Apply blink: squash the eye vertically
    vec2 eye_uv = uv - eye_center;
    eye_uv.y /= max(blink, 0.05);  // Squash when blinking

    float eye_d = length(eye_uv);

    if (eye_d < eye_r) {
      float eye_t = eye_d / eye_r;

      // Outer ring: dark edge of eye socket
      if (eye_t > 0.85) {
        col = mix(col, vec3(0.03), smoothstep(0.85, 1.0, eye_t) * blink);
      }
      // Iris: amber gradient
      else {
        // Pupil
        float pupil_r = 0.3 + sin(t * 0.5) * 0.05;  // Slight dilation
        if (eye_t < pupil_r) {
          col = mix(col, OWL_PUPIL, blink);
          // Catchlight (reflection)
          vec2 catch_offset = vec2(0.012 * side, 0.015);
          float catch_d = length(eye_uv - catch_offset);
          if (catch_d < 0.008) {
            col += vec3(0.6, 0.5, 0.3) * smoothstep(0.008, 0.0, catch_d) * blink;
          }
        }
        // Iris
        else {
          float iris_t = (eye_t - pupil_r) / (0.85 - pupil_r);
          // Radial iris texture
          float iris_angle = atan(eye_uv.y, eye_uv.x);
          float iris_pattern = sin(iris_angle * 32.0) * 0.1 + 0.9;
          float iris_radial = mix(0.7, 1.0, iris_t);  // Lighter at edge

          vec3 iris_col = OWL_AMBER * iris_pattern * iris_radial;
          // Deeper amber near pupil, lighter golden at edge
          iris_col = mix(iris_col * 0.6, iris_col * 1.3, iris_t);

          col = mix(col, iris_col, blink);
        }
      }

      // Eyelid shadow (when blinking)
      if (blink < 0.8) {
        float lid_y = eye_center.y + eye_r * (1.0 - blink);
        if (uv.y > lid_y - 0.01 && uv.y < lid_y + 0.01) {
          col = mix(col, OWL_BROWN * 0.5, (1.0 - blink) * 0.5);
        }
      }
    }

    // Ambient glow around each eye (owl eyes glow in darkness)
    float glow_d = length(uv - eye_center);
    if (glow_d > eye_r && glow_d < eye_r + 0.06) {
      float glow = smoothstep(eye_r + 0.06, eye_r, glow_d);
      col += OWL_AMBER * glow * 0.08 * blink;
    }
  }

  // Beak hint (subtle V between eyes)
  vec2 beak_uv = uv - face_center - vec2(0.0, -0.02);
  if (beak_uv.y < 0.0 && beak_uv.y > -0.025) {
    float beak_w = 0.008 * (1.0 + beak_uv.y / 0.025);
    if (abs(beak_uv.x) < beak_w) {
      col = mix(col, vec3(0.12, 0.10, 0.08), 0.4);
    }
  }

  // Lichen strands at top of frame (Usnea connection)
  for (float ls = 0.0; ls < 6.0; ls++) {
    float lx = (hash(vec2(ls, 53.7)) - 0.5) * 1.2;
    float strand_len = 0.05 + hash(vec2(ls, 57.1)) * 0.08;
    float dy = 0.5 - uv.y;
    if (dy > 0.0 && dy < strand_len && abs(uv.x - lx) < 0.001) {
      float sway = sin(t * 0.3 + ls * 1.7) * 0.003 * (dy / strand_len);
      if (abs(uv.x - lx - sway) < 0.001) {
        col = mix(col, LICHEN_DIM, 0.3);
      }
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
    current_col = usneaLichen(uv, iTime);
    next_col = dualBelts(uv, iTime);
  } else if (mode == 1) {
    current_col = dualBelts(uv, iTime);
    next_col = cartesianGrid(uv, iTime);
  } else if (mode == 2) {
    current_col = cartesianGrid(uv, iTime);
    next_col = owlEyes(uv, iTime);
  } else {
    current_col = owlEyes(uv, iTime);
    next_col = usneaLichen(uv, iTime);
  }

  fragColor = mix(current_col, next_col, fade);
}
