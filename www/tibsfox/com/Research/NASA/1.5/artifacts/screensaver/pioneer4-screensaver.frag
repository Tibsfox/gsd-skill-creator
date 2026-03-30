#version 330 core

// Pioneer 4 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Douglas-fir canopy — looking straight up from forest floor, trunk receding
//           into green light, coins of sunlight through needles
//   Mode 1: Pioneer 4 escape trajectory — Earth shrinking, stars appearing,
//           the spacecraft leaving forever
//   Mode 2: Heliocentric orbit — Sun at center, Earth and Mars orbits visible,
//           Pioneer 4 dot between them, 395-day period
//   Mode 3: Red-breasted Nuthatch spiraling headfirst down a Douglas-fir trunk,
//           bark texture, nasal call visualization
//
// Color palette: Canopy Green / Old Growth
//   Deep forest:     #0A2E0A
//   Canopy emerald:  #2D6A2D
//   Bark brown:      #4A3420
//   Light through:   #A8D8A8
//
// Compile: glslangValidator pioneer4-screensaver.frag
// Run:     glslViewer pioneer4-screensaver.frag
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
const vec3 FOREST_DEEP    = vec3(0.039, 0.180, 0.039);   // #0A2E0A
const vec3 FOREST_FLOOR   = vec3(0.051, 0.102, 0.051);   // very dark green
const vec3 CANOPY_EMERALD = vec3(0.176, 0.416, 0.176);   // #2D6A2D
const vec3 BARK_BROWN     = vec3(0.290, 0.204, 0.125);   // #4A3420
const vec3 BARK_DARK      = vec3(0.165, 0.102, 0.055);   // dark bark
const vec3 LIGHT_CANOPY   = vec3(0.659, 0.847, 0.659);   // #A8D8A8
const vec3 LIGHT_BRIGHT   = vec3(0.784, 0.910, 0.784);   // bright canopy light
const vec3 EARTH_BLUE     = vec3(0.150, 0.350, 0.650);   // Earth from space
const vec3 EARTH_GREEN    = vec3(0.200, 0.400, 0.250);   // continents
const vec3 SPACE_BLACK    = vec3(0.005, 0.005, 0.020);   // deep space
const vec3 SUN_GOLD       = vec3(1.000, 0.900, 0.500);   // Sun
const vec3 MARS_RED       = vec3(0.700, 0.350, 0.200);   // Mars orbit color
const vec3 PIONEER_WHITE  = vec3(0.900, 0.920, 0.850);   // spacecraft
const vec3 NUTHATCH_RUST  = vec3(0.700, 0.400, 0.250);   // rust breast
const vec3 NUTHATCH_GRAY  = vec3(0.450, 0.500, 0.550);   // blue-gray back
const vec3 NUTHATCH_BLACK = vec3(0.080, 0.080, 0.100);   // eye stripe

// ============================================================
// Mode 0: Douglas-fir Canopy — Looking Up From Forest Floor
// ============================================================
// The trunk recedes upward for 100 meters. Bark ridges converge to a
// vanishing point. Green light filters through the crown far above.
// Coins of sunlight shift and flicker. This is what it looks like
// standing at the base of a 300-foot Doug-fir looking up through
// the canopy at the sky.

vec4 canopyLookUp(vec2 uv, float t) {
  vec3 col = FOREST_DEEP;

  // Trunk center — receding cylinder perspective
  vec2 center = vec2(0.5, 0.5);
  float dist_from_center = length(uv - center);
  float angle = atan(uv.y - center.y, uv.x - center.x);

  // Trunk radius (perspective: large at bottom, vanishing at center)
  float trunk_radius = 0.35 - dist_from_center * 0.2;
  float in_trunk = smoothstep(trunk_radius + 0.02, trunk_radius - 0.02, dist_from_center);

  // Bark texture — radial ridges converging toward center
  float bark_ridges = sin(angle * 24.0 + vnoise(vec2(angle * 5.0, dist_from_center * 8.0)) * 3.0) * 0.5 + 0.5;
  float bark_depth = fbm(vec2(angle * 6.0 + 1.5, dist_from_center * 10.0 + t * 0.02));

  // Bark color gradient — darker toward edges, lighter in ridge peaks
  vec3 bark_col = mix(BARK_DARK, BARK_BROWN, bark_ridges * 0.7 + bark_depth * 0.3);
  // Perspective darkening toward center (looking up into shadow)
  bark_col *= (0.4 + 0.6 * dist_from_center / 0.5);

  // Canopy light — radial gradient from center (sky above)
  float canopy_light = smoothstep(0.15, 0.0, dist_from_center) * 0.6;
  // Flickering light coins through canopy gaps
  float light_coins = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 coin_pos = center + vec2(
      cos(fi * 0.785 + t * 0.1 * (1.0 + fi * 0.1)) * (0.08 + fi * 0.025),
      sin(fi * 0.785 + t * 0.13 * (1.0 + fi * 0.08)) * (0.08 + fi * 0.02)
    );
    float coin_dist = length(uv - coin_pos);
    float coin_size = 0.015 + 0.008 * sin(t * 0.5 + fi);
    light_coins += smoothstep(coin_size, coin_size * 0.3, coin_dist) * 0.3;
  }

  // Branch silhouettes radiating from center
  float branches = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float branch_angle = fi * 1.047 + 0.3;  // ~60 degree spacing
    float branch_dist = abs(sin(angle - branch_angle));
    float branch_width = 0.03 + 0.02 * (1.0 - dist_from_center);
    float branch_mask = smoothstep(branch_width, branch_width * 0.3, branch_dist);
    // Branches visible only in mid-distance (not near trunk center or edge)
    branch_mask *= smoothstep(0.08, 0.15, dist_from_center) * smoothstep(0.45, 0.30, dist_from_center);
    branches += branch_mask * 0.5;
  }

  // Assemble
  // Background: forest green fading to canopy light at center
  col = mix(FOREST_DEEP, CANOPY_EMERALD, smoothstep(0.5, 0.1, dist_from_center));
  // Sky/light at center
  col = mix(col, LIGHT_CANOPY, canopy_light);
  // Light coins
  col = mix(col, LIGHT_BRIGHT, light_coins);
  // Trunk bark overlay
  col = mix(col, bark_col, in_trunk * 0.85);
  // Branch silhouettes
  col = mix(col, FOREST_DEEP * 0.5, branches);

  // Subtle green atmospheric haze
  col += CANOPY_EMERALD * 0.03 * (1.0 - dist_from_center);

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Pioneer 4 Escape Trajectory
// ============================================================
// Earth at bottom, shrinking as Pioneer 4 leaves forever.
// Stars appear as the atmosphere thins. The spacecraft is a bright dot
// ascending into darkness. It does not come back.

vec4 escapeTrajectory(vec2 uv, float t) {
  float phase = fract(t / 15.0);  // 0-1 over 15 seconds
  vec3 col = SPACE_BLACK;

  // Stars — density increases as we leave atmosphere
  float star_density = smoothstep(0.0, 0.5, phase);
  for (int i = 0; i < 60; i++) {
    float fi = float(i);
    vec2 star_pos = vec2(hash(vec2(fi, 1.0)), hash(vec2(fi, 2.0)));
    float star_dist = length(uv - star_pos);
    float star_bright = hash(vec2(fi, 3.0)) * 0.8 + 0.2;
    float twinkle = 0.7 + 0.3 * sin(t * (1.0 + fi * 0.1) + fi);
    col += vec3(star_bright * twinkle * star_density) *
           smoothstep(0.003, 0.0, star_dist);
  }

  // Earth — starts large at bottom, shrinks as spacecraft leaves
  float earth_size = mix(0.6, 0.08, phase);
  vec2 earth_pos = vec2(0.5, mix(-0.1, -0.3, phase));
  float earth_dist = length(uv - earth_pos);
  float in_earth = smoothstep(earth_size + 0.005, earth_size - 0.005, earth_dist);

  // Earth surface detail
  float continent = fbm((uv - earth_pos) * 4.0 / earth_size + vec2(t * 0.01, 0.0));
  vec3 earth_col = mix(EARTH_BLUE, EARTH_GREEN, smoothstep(0.45, 0.55, continent));
  // Atmosphere rim
  float atmo_ring = smoothstep(earth_size + 0.02, earth_size, earth_dist) *
                    smoothstep(earth_size - 0.01, earth_size, earth_dist);
  earth_col += vec3(0.3, 0.5, 1.0) * atmo_ring * 2.0;

  col = mix(col, earth_col, in_earth);
  col += vec3(0.15, 0.3, 0.6) * smoothstep(earth_size + 0.03, earth_size, earth_dist) * 0.3;

  // Pioneer 4 spacecraft — bright ascending dot
  float sc_y = mix(0.2, 0.85, phase);
  vec2 sc_pos = vec2(0.5 + sin(phase * 2.0) * 0.03, sc_y);
  float sc_dist = length(uv - sc_pos);

  // Spacecraft glow
  float sc_bright = smoothstep(0.015, 0.0, sc_dist);
  col += PIONEER_WHITE * sc_bright * 1.5;
  // Exhaust trail (fades as stages are spent)
  float trail_mask = smoothstep(0.0, 0.4, phase);
  float trail = smoothstep(0.003, 0.0, abs(uv.x - sc_pos.x)) *
                smoothstep(sc_pos.y, sc_pos.y - 0.15 * (1.0 - trail_mask), uv.y) *
                (1.0 - trail_mask);
  col += vec3(1.0, 0.6, 0.2) * trail * 0.4;

  // Radiation belt glow (inner and outer, visible as Pioneer passes through)
  float alt = uv.y - earth_pos.y;
  float inner_belt = exp(-pow((alt - earth_size - 0.06) / 0.03, 2.0)) * 0.15;
  float outer_belt = exp(-pow((alt - earth_size - 0.20) / 0.06, 2.0)) * 0.10;
  col += vec3(1.0, 0.7, 0.2) * inner_belt * (1.0 - smoothstep(0.3, 0.6, phase));
  col += vec3(0.3, 0.5, 1.0) * outer_belt * (1.0 - smoothstep(0.5, 0.8, phase));

  // Moon flyby (appears briefly at phase ~0.5-0.7)
  float moon_vis = smoothstep(0.4, 0.5, phase) * smoothstep(0.75, 0.65, phase);
  vec2 moon_pos = vec2(0.65, 0.55);
  float moon_dist = length(uv - moon_pos);
  float in_moon = smoothstep(0.025, 0.020, moon_dist);
  col = mix(col, vec3(0.7, 0.7, 0.65), in_moon * moon_vis);

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Heliocentric Orbit
// ============================================================
// Sun at center. Earth orbit (1.0 AU) and Mars orbit (1.52 AU) visible.
// Pioneer 4 dot orbiting between them on its 1.22 AU semi-major axis,
// eccentricity 0.17 ellipse. Orbital period 395 days.

vec4 heliocentricOrbit(vec2 uv, float t) {
  vec3 col = SPACE_BLACK;
  vec2 center = vec2(0.5, 0.5);
  vec2 p = uv - center;

  // Faint star field
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    vec2 star_pos = vec2(hash(vec2(fi, 7.0)), hash(vec2(fi, 8.0))) - 0.5;
    float star_dist = length(p - star_pos);
    col += vec3(0.5 + 0.3 * hash(vec2(fi, 9.0))) *
           smoothstep(0.002, 0.0, star_dist) * 0.6;
  }

  // Scale: 0.25 screen units = 1 AU
  float au_scale = 0.22;

  // Sun at center — bright golden glow
  float sun_dist = length(p);
  float sun_glow = exp(-sun_dist * sun_dist * 80.0) * 1.5;
  col += SUN_GOLD * sun_glow;
  float sun_core = smoothstep(0.025, 0.015, sun_dist);
  col = mix(col, SUN_GOLD * 1.2, sun_core);

  // Earth orbit (1.0 AU) — thin blue circle
  float earth_orbit_r = 1.0 * au_scale;
  float earth_orbit_dist = abs(length(p) - earth_orbit_r);
  col += EARTH_BLUE * 0.4 * smoothstep(0.003, 0.0, earth_orbit_dist);

  // Earth position (moving)
  float earth_angle = t * 0.15;
  vec2 earth_pos = center + vec2(cos(earth_angle), sin(earth_angle)) * earth_orbit_r;
  float earth_d = length(uv - earth_pos);
  col += EARTH_BLUE * smoothstep(0.012, 0.004, earth_d) * 1.2;

  // Mars orbit (1.52 AU) — thin red circle
  float mars_orbit_r = 1.52 * au_scale;
  float mars_orbit_dist = abs(length(p) - mars_orbit_r);
  col += MARS_RED * 0.3 * smoothstep(0.003, 0.0, mars_orbit_dist);

  // Mars position (moving, slower than Earth)
  float mars_angle = t * 0.08;
  vec2 mars_pos = center + vec2(cos(mars_angle), sin(mars_angle)) * mars_orbit_r;
  float mars_d = length(uv - mars_pos);
  col += MARS_RED * smoothstep(0.010, 0.003, mars_d) * 1.0;

  // Pioneer 4 orbit — elliptical, semi-major 1.22 AU, e = 0.17
  // Draw the orbit path
  float p4_sma = 1.22 * au_scale;
  float p4_e = 0.17;
  float p4_b = p4_sma * sqrt(1.0 - p4_e * p4_e);  // semi-minor
  float p4_c = p4_sma * p4_e;  // focus offset

  // Approximate ellipse distance (rotated for visual variety)
  float orbit_rot = 0.4;  // argument of perihelion
  vec2 p_rot = vec2(
    p.x * cos(orbit_rot) + p.y * sin(orbit_rot),
    -p.x * sin(orbit_rot) + p.y * cos(orbit_rot)
  );
  p_rot.x += p4_c;  // offset to focus
  float ellipse_val = (p_rot.x * p_rot.x) / (p4_sma * p4_sma) +
                      (p_rot.y * p_rot.y) / (p4_b * p4_b);
  float orbit_line = abs(ellipse_val - 1.0);
  col += PIONEER_WHITE * 0.25 * smoothstep(0.05, 0.0, orbit_line);

  // Pioneer 4 position (moving along ellipse, ~395 day period)
  float p4_angle = t * 0.138;  // ~395/365 * Earth rate
  float p4_r = p4_sma * (1.0 - p4_e * p4_e) / (1.0 + p4_e * cos(p4_angle));
  vec2 p4_pos_local = vec2(cos(p4_angle), sin(p4_angle)) * p4_r;
  // Rotate by argument of perihelion
  vec2 p4_pos = center + vec2(
    p4_pos_local.x * cos(orbit_rot) - p4_pos_local.y * sin(orbit_rot),
    p4_pos_local.x * sin(orbit_rot) + p4_pos_local.y * cos(orbit_rot)
  );

  float p4_d = length(uv - p4_pos);
  col += PIONEER_WHITE * smoothstep(0.008, 0.002, p4_d) * 1.5;
  // Subtle glow
  col += LIGHT_CANOPY * 0.3 * smoothstep(0.020, 0.005, p4_d);

  // Labels (position dots)
  // AU markers at bottom
  float label_y = 0.06;
  for (int i = 1; i <= 2; i++) {
    float fi = float(i);
    float marker_x = 0.5 + fi * au_scale;
    float marker_d = length(uv - vec2(marker_x, label_y));
    col += vec3(0.4) * smoothstep(0.004, 0.001, marker_d);
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Red-breasted Nuthatch on Douglas-fir Trunk
// ============================================================
// The bird spirals headfirst down the trunk, reading the bark
// for insects. Bark texture fills the screen. The nuthatch is
// a small shape descending in a spiral — the only bird that walks
// down trees headfirst.

vec4 nuthatchSpiral(vec2 uv, float t) {
  vec3 col = BARK_DARK;

  // Douglas-fir bark texture — deep vertical ridges
  float bark_x = uv.x * 12.0;
  float bark_y = uv.y * 4.0 + t * 0.05;  // slow upward scroll (trunk passing)

  float ridge = sin(bark_x + vnoise(vec2(bark_x * 0.5, bark_y)) * 2.0) * 0.5 + 0.5;
  float depth = fbm(vec2(bark_x * 0.8, bark_y * 1.5));
  float fine_texture = vnoise(vec2(bark_x * 3.0, bark_y * 6.0));

  // Bark color: ridges lighter, furrows darker
  col = mix(BARK_DARK, BARK_BROWN, ridge * 0.6 + depth * 0.3);
  col += vec3(0.03) * fine_texture;

  // Canopy light from above — subtle gradient at top
  col += LIGHT_CANOPY * 0.08 * smoothstep(0.7, 1.0, uv.y);

  // Moss patches in bark furrows
  float moss_mask = smoothstep(0.55, 0.35, ridge) * smoothstep(0.3, 0.5, depth);
  col = mix(col, FOREST_DEEP * 1.5, moss_mask * 0.3);

  // Lichen (Usnea) strands on bark — thin vertical pale lines
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float lichen_x = 0.15 + fi * 0.22 + sin(bark_y * 2.0 + fi) * 0.03;
    float lichen_d = abs(uv.x - lichen_x);
    float lichen_vis = smoothstep(0.003, 0.001, lichen_d) *
                       vnoise(vec2(fi * 5.0, bark_y * 8.0));
    col = mix(col, LIGHT_CANOPY * 0.8, lichen_vis * 0.4);
  }

  // Red-breasted Nuthatch — spiraling down the trunk
  // The bird moves in a helical path down the trunk face
  float bird_phase = fract(t * 0.08);
  float bird_y = 1.0 - bird_phase;  // descending
  float bird_x = 0.5 + sin(bird_phase * 6.283 * 2.0) * 0.2;  // spiral

  vec2 bird_pos = vec2(bird_x, bird_y);
  float bird_dist = length(uv - bird_pos);

  // Bird body — small oval, head DOWN (headfirst descent)
  float body_size = 0.04;
  vec2 bird_offset = uv - bird_pos;
  // Rotate bird shape so head points DOWN
  float bird_angle = -1.57 + sin(bird_phase * 6.283 * 2.0) * 0.3;
  vec2 bird_rot = vec2(
    bird_offset.x * cos(bird_angle) - bird_offset.y * sin(bird_angle),
    bird_offset.x * sin(bird_angle) + bird_offset.y * cos(bird_angle)
  );

  // Elongated body
  float body = length(bird_rot * vec2(1.5, 1.0)) / body_size;
  float in_body = smoothstep(1.0, 0.8, body);

  // Blue-gray back (upper half of body in rotated space)
  float back_mask = in_body * smoothstep(-0.005, 0.005, bird_rot.y);
  col = mix(col, NUTHATCH_GRAY, back_mask * 0.9);

  // Rust-red breast (lower half)
  float breast_mask = in_body * smoothstep(0.005, -0.005, bird_rot.y);
  col = mix(col, NUTHATCH_RUST, breast_mask * 0.9);

  // Black eye stripe
  float stripe_y = abs(bird_rot.y + 0.003);
  float stripe = smoothstep(0.008, 0.004, stripe_y) * smoothstep(body_size * 0.6, body_size * 0.2, length(bird_rot));
  col = mix(col, NUTHATCH_BLACK, stripe * in_body * 0.8);

  // Eye — tiny bright dot
  vec2 eye_pos = bird_pos + vec2(
    cos(bird_angle + 1.57) * body_size * 0.5,
    sin(bird_angle + 1.57) * body_size * 0.5
  );
  float eye_d = length(uv - eye_pos);
  col += vec3(0.9) * smoothstep(0.004, 0.002, eye_d) * 0.8;

  // Call visualization — concentric arcs emanating from bird (nasal yank-yank)
  float call_phase = fract(t * 0.7);
  float call_vis = smoothstep(0.0, 0.1, call_phase) * smoothstep(0.5, 0.3, call_phase);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float ring_r = 0.03 + fi * 0.025 + call_phase * 0.05;
    float ring_d = abs(length(uv - bird_pos) - ring_r);
    col += LIGHT_CANOPY * 0.15 * smoothstep(0.003, 0.0, ring_d) * call_vis *
           smoothstep(0.5, 0.0, fi / 3.0);
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode selector and crossfade
// ============================================================

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float t = iTime;

  // 60-second total cycle, 15 seconds per mode
  float cycle = mod(t, 60.0);
  int mode = int(cycle / 15.0);
  float mode_t = mod(cycle, 15.0);

  // Crossfade duration (1.5 seconds)
  float fade_dur = 1.5;
  float fade_in = smoothstep(0.0, fade_dur, mode_t);
  float fade_out = smoothstep(15.0 - fade_dur, 15.0, mode_t + fade_dur);

  // Current mode
  vec4 current;
  if (mode == 0) current = canopyLookUp(uv, t);
  else if (mode == 1) current = escapeTrajectory(uv, t);
  else if (mode == 2) current = heliocentricOrbit(uv, t);
  else current = nuthatchSpiral(uv, t);

  // Next mode (for crossfade)
  int next_mode = (mode + 1) % 4;
  vec4 next;
  if (next_mode == 0) next = canopyLookUp(uv, t);
  else if (next_mode == 1) next = escapeTrajectory(uv, t);
  else if (next_mode == 2) next = heliocentricOrbit(uv, t);
  else next = nuthatchSpiral(uv, t);

  // Blend during transition
  float blend = smoothstep(15.0 - fade_dur, 15.0, mode_t);
  fragColor = mix(current, next, blend);
}
