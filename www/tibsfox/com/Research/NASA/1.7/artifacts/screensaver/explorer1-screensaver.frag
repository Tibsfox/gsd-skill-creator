#version 330 core

// Explorer 1 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Geiger counter visualization — random bright particle hits
//           that increase in density, then flash to black (saturation),
//           then slowly restart. The paradox made visible.
//   Mode 1: Radiation belt cross-section — Earth at center, dipole
//           magnetic field lines as curves, glowing toroidal inner belt
//           with trapped particles spiraling along field lines.
//   Mode 2: Lungwort lichen growth — organic, ridged texture expanding
//           outward from a substrate, green-gray tones with brown bark.
//   Mode 3: Juno I launch — upward streaking flame trail, spinning
//           upper stages separating, the satellite reaching orbit.
//
// Color palette: Explorer 1 / Van Allen Belt
//   Geiger green:    #00FF41  (phosphor green, detector pulses)
//   Cosmic black:    #050510  (deep space background)
//   Belt gold:       #D4A830  (trapped radiation, warm glow)
//   Lichen sage:     #8FA880  (Lobaria pulmonaria, forest green-gray)
//
// Compile: glslangValidator explorer1-screensaver.frag
// Run:     glslViewer explorer1-screensaver.frag
// Install: copy to /usr/lib/xscreensaver/ or ~/.local/share/xscreensaver/

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_mode;

out vec4 fragColor;

// --- Constants ---
const vec3 GEIGER_GREEN = vec3(0.0, 1.0, 0.255);
const vec3 COSMIC_BLACK = vec3(0.02, 0.02, 0.063);
const vec3 BELT_GOLD    = vec3(0.831, 0.659, 0.188);
const vec3 LICHEN_SAGE  = vec3(0.561, 0.659, 0.502);
const vec3 BARK_BROWN   = vec3(0.25, 0.18, 0.12);
const vec3 FLAME_ORANGE = vec3(1.0, 0.6, 0.1);
const vec3 FLAME_WHITE  = vec3(1.0, 0.95, 0.85);

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// --- Shared utilities ---

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract(p.x * p.y);
}

float hash3(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract(p.x * p.y * p.z);
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

// --- Mode 0: Geiger Counter Visualization ---
vec3 mode_geiger(vec2 uv, float t) {
  vec3 col = COSMIC_BLACK;

  // Cycle: ~10 seconds
  // 0-4s: clicks increase, 4-6s: saturation flash + dark, 6-10s: recovery
  float cycle_t = mod(t, 10.0);

  // Radiation intensity ramps up then saturates
  float intensity;
  if (cycle_t < 4.0) {
    intensity = cycle_t / 4.0;       // ramp up
  } else if (cycle_t < 5.0) {
    intensity = 1.0;                  // peak — about to saturate
  } else if (cycle_t < 6.5) {
    intensity = 0.0;                  // SATURATED — black
  } else {
    intensity = (cycle_t - 6.5) / 3.5 * 0.3;  // slow recovery
  }

  // Particle hit flashes — random positions, more frequent at higher intensity
  float hit_density = intensity * intensity * 200.0;
  float hits = 0.0;
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    // Time-varying random position
    float hit_time = floor(t * (5.0 + fi * 3.0 * intensity));
    vec2 hit_pos = vec2(hash(vec2(fi, hit_time)),
                        hash(vec2(hit_time, fi + 7.3)));
    float hit_age = fract(t * (5.0 + fi * 3.0 * intensity));

    // Each hit: bright flash that fades quickly
    float hit_brightness = exp(-hit_age * 8.0) * step(0.0, intensity - fi / 30.0);
    float hit_size = 0.01 + 0.005 * hash(vec2(fi, 0.5));
    float d = length(uv - hit_pos);
    hits += hit_brightness * exp(-d * d / (hit_size * hit_size));
  }

  col += GEIGER_GREEN * hits * 0.8;

  // Saturation flash — brief white flash before going dark
  if (cycle_t > 4.8 && cycle_t < 5.2) {
    float flash = exp(-abs(cycle_t - 5.0) * 20.0);
    col += vec3(1.0) * flash * 0.5;
  }

  // "SATURATED" text region — subtle red glow in center during saturation
  if (cycle_t > 5.5 && cycle_t < 6.5) {
    float text_region = smoothstep(0.15, 0.05, abs(uv.y - 0.5)) *
                        smoothstep(0.3, 0.1, abs(uv.x - 0.5));
    col += vec3(0.5, 0.0, 0.0) * text_region * 0.3;
  }

  // Counter display — bottom of screen
  float counter_bar = smoothstep(0.08, 0.06, uv.y);
  float count_level = intensity * (1.0 - step(5.0, cycle_t) * step(cycle_t, 6.5));
  col += GEIGER_GREEN * counter_bar * count_level * 0.3;

  // Scan line aesthetic
  float scanline = sin(uv.y * 400.0) * 0.02;
  col -= scanline;

  return col;
}

// --- Mode 1: Radiation Belt Cross-Section ---
vec3 mode_belt(vec2 uv, float t) {
  vec3 col = COSMIC_BLACK;

  vec2 center = vec2(0.5);
  vec2 d = uv - center;
  float dist = length(d);
  float angle = atan(d.y, d.x);

  // Earth
  float earth_r = 0.06;
  float earth = smoothstep(earth_r, earth_r - 0.003, dist);
  vec3 earth_col = vec3(0.1, 0.25, 0.6);
  // Continental hint
  float land = fbm(vec2(angle * 3.0, dist * 20.0) + 1.5);
  earth_col = mix(earth_col, vec3(0.15, 0.35, 0.15), step(0.55, land) * 0.5);
  col += earth_col * earth;
  // Atmosphere glow
  float atmo = smoothstep(earth_r + 0.015, earth_r, dist) *
               smoothstep(earth_r - 0.003, earth_r, dist);
  col += vec3(0.2, 0.4, 0.8) * atmo * 0.4;

  // Magnetic dipole field lines
  // B_r = B_0 * (R/r)^3 * 2*cos(theta)
  // B_theta = B_0 * (R/r)^3 * sin(theta)
  // Field line equation: r = L * cos^2(theta) where L is the L-shell
  for (int i = 1; i <= 8; i++) {
    float L = float(i) * 0.06; // L-shell radius in screen units
    // Evaluate field line: for each angle, r = L * cos^2(angle from pole)
    float mag_angle = angle + PI * 0.5; // rotate so poles are up/down
    float cos_a = cos(mag_angle);
    float r_field = L * cos_a * cos_a;
    float field_dist = abs(dist - r_field);
    float field_line = exp(-field_dist * field_dist / 0.00008);
    // Fade near equator (field lines spread there)
    field_line *= smoothstep(earth_r, earth_r + 0.02, dist);
    col += vec3(0.15, 0.2, 0.4) * field_line * 0.2;
  }

  // Inner Van Allen belt — toroidal region at ~1.5 Re
  float belt_center = earth_r * 2.5;  // ~1.5 Earth radii from center
  float belt_width = earth_r * 1.0;
  // Toroidal shape: concentrated near equatorial plane
  float equatorial = exp(-d.y * d.y / (0.02 * 0.02)); // concentrated near y=0
  float belt_ring = exp(-(dist - belt_center) * (dist - belt_center) /
                    (belt_width * belt_width * 0.3));
  float belt_mask = belt_ring * equatorial;
  col += BELT_GOLD * belt_mask * 0.25;

  // Outer belt — at ~4-5 Re
  float outer_center = earth_r * 6.0;
  float outer_width = earth_r * 1.5;
  float outer_ring = exp(-(dist - outer_center) * (dist - outer_center) /
                     (outer_width * outer_width * 0.3));
  float outer_mask = outer_ring * equatorial * 0.7;
  col += vec3(0.4, 0.5, 0.8) * outer_mask * 0.15;

  // Trapped particles spiraling along field lines
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float particle_angle = t * (0.3 + fi * 0.05) + fi * TAU / 16.0;
    float particle_L = belt_center + sin(fi * 2.7) * belt_width * 0.3;
    float bounce_phase = sin(t * (1.0 + fi * 0.1) + fi);
    vec2 particle_pos = center + vec2(cos(particle_angle) * particle_L,
                                       sin(particle_angle) * particle_L * 0.3 +
                                       bounce_phase * 0.04);
    float pdist = length(uv - particle_pos);
    float particle = exp(-pdist * pdist / 0.0003);
    col += BELT_GOLD * particle * 0.5;
  }

  // Explorer 1 orbit — elliptical, 358 × 2550 km
  // Scale: earth_r = 6371 km, so 358 km = 0.0034 screen,
  //        2550 km = 0.024 screen (relative to earth center)
  float orbit_peri = earth_r * 1.056;  // 358 km above surface
  float orbit_apo = earth_r * 1.4;     // 2550 km above surface
  float orbit_a = (orbit_peri + orbit_apo) / 2.0;
  float orbit_e = (orbit_apo - orbit_peri) / (orbit_apo + orbit_peri);
  float sat_angle = t * 0.2;
  float sat_r = orbit_a * (1.0 - orbit_e * orbit_e) /
                (1.0 + orbit_e * cos(sat_angle));
  vec2 sat_pos = center + vec2(cos(sat_angle), sin(sat_angle)) * sat_r;
  float sat_dot = smoothstep(0.006, 0.002, length(uv - sat_pos));
  col += GEIGER_GREEN * sat_dot;

  // Orbit trail
  for (int i = 1; i < 30; i++) {
    float fi = float(i);
    float trail_a = sat_angle - fi * 0.04;
    float trail_r = orbit_a * (1.0 - orbit_e * orbit_e) /
                    (1.0 + orbit_e * cos(trail_a));
    vec2 trail_pos = center + vec2(cos(trail_a), sin(trail_a)) * trail_r;
    float trail = smoothstep(0.004, 0.001, length(uv - trail_pos));
    col += GEIGER_GREEN * trail * (1.0 - fi / 30.0) * 0.3;
  }

  return col;
}

// --- Mode 2: Lungwort Lichen Growth ---
vec3 mode_lichen(vec2 uv, float t) {
  vec3 col = BARK_BROWN;

  // Bark texture background
  float bark = fbm(vec2(uv.x * 4.0, uv.y * 20.0) + 3.7);
  col = BARK_BROWN * (0.7 + 0.5 * bark);

  // Lichen grows from multiple attachment points
  vec2 center1 = vec2(0.4, 0.55);
  vec2 center2 = vec2(0.6, 0.45);
  vec2 center3 = vec2(0.5, 0.65);

  float growth = min(t * 0.04, 1.0);

  // For each lichen thallus, create the lobed, ridged structure
  for (int lobe = 0; lobe < 3; lobe++) {
    vec2 center;
    if (lobe == 0) center = center1;
    else if (lobe == 1) center = center2;
    else center = center3;

    vec2 d = uv - center;
    float dist = length(d);
    float angle = atan(d.y, d.x);

    // Lobaria has irregular, lobed margins
    float max_r = 0.15 * growth * (0.8 + 0.2 * float(lobe));
    float lobe_edge = max_r + 0.02 * sin(angle * 7.0 + float(lobe) * 2.0)
                             + 0.015 * sin(angle * 13.0 + float(lobe))
                             + 0.01 * vnoise(vec2(angle * 3.0, float(lobe)) + t * 0.05);

    float lichen_mask = smoothstep(lobe_edge, lobe_edge - 0.015, dist);

    // Ridged surface texture — the "lung" pattern of Lobaria pulmonaria
    // Network of ridges with depressions between them
    float ridges = fbm(d * 40.0 + float(lobe) * 5.0);
    float ridge_pattern = smoothstep(0.35, 0.55, ridges);

    // Color: green-gray upper surface, brown-tan ridges
    vec3 upper_col = LICHEN_SAGE * (0.8 + 0.3 * ridge_pattern);
    vec3 ridge_col = vec3(0.45, 0.42, 0.35);

    // Soredia (reproductive granules) — small pale spots
    float soredia = pow(vnoise(d * 80.0 + float(lobe)), 5.0);
    vec3 soredia_col = vec3(0.75, 0.72, 0.65);

    vec3 lichen_col = mix(upper_col, ridge_col, ridge_pattern * 0.4);
    lichen_col = mix(lichen_col, soredia_col, soredia * 0.3);

    // Growing edge — lighter, more yellow-green
    float edge_glow = smoothstep(lobe_edge - 0.03, lobe_edge - 0.005, dist);
    lichen_col = mix(lichen_col, vec3(0.6, 0.7, 0.45), edge_glow * 0.3);

    col = mix(col, lichen_col, lichen_mask);

    // Subtle shadow under the lichen edge
    float shadow = smoothstep(lobe_edge + 0.005, lobe_edge + 0.015, dist) *
                   smoothstep(lobe_edge + 0.025, lobe_edge + 0.015, dist);
    col *= 1.0 - shadow * 0.2;
  }

  // Moss patches on the bark
  float moss = smoothstep(0.6, 0.7, fbm(uv * 15.0 + 7.0));
  col = mix(col, vec3(0.15, 0.25, 0.1), moss * 0.3);

  return col;
}

// --- Mode 3: Juno I Launch ---
vec3 mode_launch(vec2 uv, float t) {
  vec3 col = COSMIC_BLACK;

  float launch_t = mod(t, 15.0);

  // Sky gradient — dark at top, lighter blue at bottom (pre-dawn)
  float sky_grad = uv.y;
  col = mix(vec3(0.01, 0.02, 0.06), COSMIC_BLACK, sky_grad);

  // Stars
  float stars = pow(hash(floor(uv * 200.0)), 20.0);
  col += vec3(0.8, 0.8, 0.9) * stars * sky_grad;

  // Launch pad (ground)
  float ground = smoothstep(0.08, 0.06, uv.y);
  col = mix(col, vec3(0.05, 0.05, 0.04), ground);

  // Rocket position — ascending
  float rocket_y;
  float rocket_speed;
  if (launch_t < 2.0) {
    // Pre-launch: sitting on pad
    rocket_y = 0.1;
    rocket_speed = 0.0;
  } else if (launch_t < 12.0) {
    // Ascending
    float ascent_t = launch_t - 2.0;
    rocket_y = 0.1 + ascent_t * ascent_t * 0.008;  // accelerating
    rocket_speed = ascent_t * 0.016;
  } else {
    rocket_y = 0.1 + 100.0 * 0.008;  // off screen
    rocket_speed = 0.16;
  }

  float rocket_x = 0.5;
  vec2 rocket_pos = vec2(rocket_x, rocket_y);

  // Rocket body — Juno I (modified Redstone with spinning upper stages)
  float rocket_len = 0.06;
  float rocket_wid = 0.008;
  vec2 rd = uv - rocket_pos;

  // Main body
  float body = smoothstep(rocket_wid, rocket_wid - 0.002, abs(rd.x)) *
               smoothstep(rocket_len * 0.5, rocket_len * 0.5 - 0.003, abs(rd.y));

  // Nose cone
  float nose_y = rd.y - rocket_len * 0.5;
  float nose = smoothstep(0.0, -0.003, nose_y - 0.015) *
               smoothstep(rocket_wid * (1.0 - nose_y / 0.015),
                          rocket_wid * (1.0 - nose_y / 0.015) - 0.002, abs(rd.x)) *
               step(0.0, nose_y + 0.005);

  // Fins at base
  float fin_mask = step(-rocket_len * 0.45, rd.y) * step(rd.y, -rocket_len * 0.3);
  float fin_width = rocket_wid + 0.006 * (1.0 - (rd.y + rocket_len * 0.45) / (rocket_len * 0.15));
  float fins = smoothstep(fin_width, fin_width - 0.002, abs(rd.x)) * fin_mask;

  vec3 rocket_col = vec3(0.8, 0.8, 0.85);
  col = mix(col, rocket_col, (body + nose + fins) * step(launch_t, 12.0));

  // Spinning upper stages — visible separating after ~8s
  if (launch_t > 8.0 && launch_t < 14.0) {
    float sep_t = launch_t - 8.0;
    float spin_angle = t * TAU * 2.0;  // rapid spin for stability
    vec2 stage_pos = rocket_pos + vec2(0.0, rocket_len * 0.3 + sep_t * 0.02);

    // Small spinning cylinder
    vec2 sd = uv - stage_pos;
    sd = sd * rot(spin_angle);
    float stage = smoothstep(0.004, 0.003, abs(sd.x)) *
                  smoothstep(0.015, 0.013, abs(sd.y));
    col += vec3(0.6, 0.6, 0.7) * stage * 0.8;

    // Spin lines — motion blur
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float sa = spin_angle + fi * TAU / 4.0;
      vec2 spin_line = uv - stage_pos;
      spin_line = spin_line * rot(sa);
      float sl = smoothstep(0.002, 0.001, abs(spin_line.y)) *
                 smoothstep(0.02, 0.005, abs(spin_line.x)) *
                 step(0.005, abs(spin_line.x));
      col += BELT_GOLD * sl * 0.2;
    }
  }

  // Exhaust flame
  if (launch_t > 1.5 && launch_t < 12.0) {
    float flame_y = rocket_pos.y - rocket_len * 0.5;
    vec2 fd = uv - vec2(rocket_x, flame_y);

    // Flame is below the rocket, wider at bottom
    if (fd.y < 0.0) {
      float flame_len = 0.04 + 0.02 * sin(t * 15.0);
      float flame_dist = -fd.y / flame_len;
      float flame_width = rocket_wid * (1.0 + flame_dist * 2.0);

      // Turbulent flame shape
      float turb = vnoise(vec2(fd.x * 60.0, fd.y * 30.0 - t * 20.0)) * 0.5;
      float flame = smoothstep(flame_width + turb * 0.01,
                               flame_width * 0.3, abs(fd.x));
      flame *= smoothstep(1.0, 0.0, flame_dist);

      // Core (white-hot) to edge (orange)
      float core = smoothstep(flame_width * 0.5, 0.0, abs(fd.x));
      vec3 flame_col = mix(FLAME_ORANGE, FLAME_WHITE, core * 0.7);
      flame_col = mix(flame_col, vec3(1.0, 0.3, 0.05), flame_dist * 0.5);

      col += flame_col * flame * 1.2;
    }

    // Smoke trail — widens and fades below
    float smoke_y = rocket_pos.y - rocket_len * 0.5 - 0.05;
    if (uv.y < smoke_y) {
      float smoke_age = (smoke_y - uv.y) / 0.3;
      float smoke_width = 0.01 + smoke_age * 0.05;
      float smoke_x_drift = vnoise(vec2(uv.y * 5.0, t * 0.5)) * 0.02;
      float smoke = exp(-(uv.x - rocket_x - smoke_x_drift) *
                        (uv.x - rocket_x - smoke_x_drift) /
                        (smoke_width * smoke_width));
      smoke *= exp(-smoke_age * 2.0);
      col += vec3(0.3, 0.25, 0.2) * smoke * 0.3;
    }
  }

  // Launch flash at ignition
  if (launch_t > 1.5 && launch_t < 2.5) {
    float flash_t = launch_t - 1.5;
    float flash = exp(-flash_t * 3.0);
    float flash_dist = length(uv - vec2(0.5, 0.1));
    col += FLAME_ORANGE * flash * exp(-flash_dist * flash_dist / 0.02) * 0.5;
  }

  return col;
}

// --- Main ---
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;
  uv.x -= (aspect - 1.0) * 0.5;

  float t = u_time;

  // Mode selection: auto-cycle every 15 seconds, or manual via u_mode
  float mode;
  if (u_mode < 0.0) {
    mode = floor(mod(t / 15.0, 4.0));
  } else {
    mode = floor(u_mode);
  }

  // Cross-fade between modes (1-second transition)
  float mode_t = mod(t, 15.0);
  float transition = smoothstep(14.0, 15.0, mode_t);

  float next_mode = mod(mode + 1.0, 4.0);

  vec3 col_current;
  vec3 col_next;

  // Current mode
  if (mode < 0.5) col_current = mode_geiger(uv, t);
  else if (mode < 1.5) col_current = mode_belt(uv, t);
  else if (mode < 2.5) col_current = mode_lichen(uv, t);
  else col_current = mode_launch(uv, t);

  // Next mode (for cross-fade)
  if (next_mode < 0.5) col_next = mode_geiger(uv, t);
  else if (next_mode < 1.5) col_next = mode_belt(uv, t);
  else if (next_mode < 2.5) col_next = mode_lichen(uv, t);
  else col_next = mode_launch(uv, t);

  vec3 col = mix(col_current, col_next, transition);

  // Subtle CRT scanline effect
  float scanline = sin(gl_FragCoord.y * 1.5) * 0.02;
  col -= scanline;

  // Vignette
  float vig_uv_x = gl_FragCoord.x / u_resolution.x;
  float vig_uv_y = gl_FragCoord.y / u_resolution.y;
  float vignette = 1.0 - 0.3 * length(vec2(vig_uv_x, vig_uv_y) - 0.5);
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
