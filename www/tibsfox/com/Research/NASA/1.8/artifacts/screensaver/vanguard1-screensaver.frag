#version 330 core

// Vanguard 1 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Grapefruit in orbit — tiny metallic sphere orbiting a larger
//           Earth, showing the vast scale difference. The pear-shaped
//           geoid is subtly visible on the Earth sphere.
//   Mode 1: Solar cell illumination — flat surface representing a solar
//           panel, with a light source sweeping across. Brightness
//           follows cos(theta), with crisp shadow transitions.
//   Mode 2: Licorice fern fronds — unfurling fiddleheads on bark,
//           pinnate frond patterns, green on bark-brown substrate.
//   Mode 3: 68-year clock — orbital counter ticking up continuously,
//           showing accumulated orbits since March 17, 1958 (>330,000).
//
// Color palette: Vanguard 1 / Solar Power
//   Solar gold:      #D4A830  (sunlight on silicon, warm power)
//   Grapefruit amber: #E8A020  (the satellite's aluminum finish)
//   Bark brown:      #4A3420  (bigleaf maple substrate for fern)
//   Fern green:      #5A8A5A  (Polypodium glycyrrhiza fronds)
//   Space deep:      #050510  (orbital darkness)
//
// Compile: glslangValidator vanguard1-screensaver.frag
// Run:     glslViewer vanguard1-screensaver.frag
// Install: copy to /usr/lib/xscreensaver/ or ~/.local/share/xscreensaver/

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_mode;

out vec4 fragColor;

// --- Constants ---
const vec3 SOLAR_GOLD     = vec3(0.831, 0.659, 0.188);
const vec3 GRAPEFRUIT     = vec3(0.910, 0.627, 0.125);
const vec3 BARK_BROWN     = vec3(0.290, 0.204, 0.125);
const vec3 FERN_GREEN     = vec3(0.353, 0.541, 0.353);
const vec3 SPACE_DEEP     = vec3(0.020, 0.020, 0.063);
const vec3 EARTH_BLUE     = vec3(0.10, 0.25, 0.55);
const vec3 EARTH_GREEN    = vec3(0.12, 0.30, 0.12);
const vec3 OCEAN_DEEP     = vec3(0.05, 0.12, 0.35);
const vec3 SILICON_GRAY   = vec3(0.25, 0.27, 0.30);
const vec3 CELL_BLUE      = vec3(0.08, 0.10, 0.20);

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

// SDF for a circle
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

// --- Mode 0: Grapefruit in Orbit ---
vec3 mode_orbit(vec2 uv, float t) {
  vec3 col = SPACE_DEEP;

  vec2 center = vec2(0.5);

  // Stars
  float stars = pow(hash(floor(uv * 300.0)), 22.0);
  col += vec3(0.7, 0.7, 0.8) * stars;

  // Earth — large, center-screen
  float earth_r = 0.18;
  vec2 ed = uv - center;
  float earth_dist = length(ed);
  float earth_angle = atan(ed.y, ed.x);

  // Pear-shaped geoid: J2 (oblate) + J3 (pear)
  // J2 makes equator wider, J3 makes south slightly larger than north
  float j2_effect = 0.004 * (1.0 - 3.0 * (ed.y / max(earth_dist, 0.001)) * (ed.y / max(earth_dist, 0.001)));
  float j3_effect = 0.002 * ed.y / max(earth_dist, 0.001);
  float geoid_r = earth_r + j2_effect + j3_effect;

  float earth_mask = smoothstep(geoid_r, geoid_r - 0.003, earth_dist);

  // Earth surface — continents and ocean
  float land_noise = fbm(vec2(earth_angle * 2.5 + 0.5, earth_dist * 15.0) + t * 0.01);
  vec3 earth_surface = mix(OCEAN_DEEP, EARTH_BLUE, 0.3 + 0.2 * sin(earth_angle * 3.0));
  earth_surface = mix(earth_surface, EARTH_GREEN, step(0.52, land_noise) * 0.6);

  // Atmospheric limb glow
  float limb = smoothstep(geoid_r - 0.01, geoid_r, earth_dist) *
               smoothstep(geoid_r + 0.015, geoid_r, earth_dist);
  vec3 atmo_glow = vec3(0.3, 0.5, 0.9) * limb * 0.5;

  // Day/night terminator
  float sun_angle = t * 0.15;
  float day_side = 0.5 + 0.5 * cos(earth_angle - sun_angle);
  earth_surface *= 0.3 + 0.7 * day_side;

  col = mix(col, earth_surface, earth_mask);
  col += atmo_glow;

  // Vanguard 1 orbit — elliptical, 654 × 3969 km
  // Earth radius = 6371 km, so:
  // Perigee: 6371 + 654 = 7025 km = 1.103 Re
  // Apogee: 6371 + 3969 = 10340 km = 1.623 Re
  float orbit_peri = earth_r * 1.103;
  float orbit_apo = earth_r * 1.623;
  float orbit_a = (orbit_peri + orbit_apo) / 2.0;
  float orbit_e = (orbit_apo - orbit_peri) / (orbit_apo + orbit_peri);

  // Satellite position
  float sat_angle = t * 0.28;  // Orbit speed
  float sat_r = orbit_a * (1.0 - orbit_e * orbit_e) /
                (1.0 + orbit_e * cos(sat_angle));
  vec2 sat_pos = center + vec2(cos(sat_angle), sin(sat_angle)) * sat_r;

  // Draw the orbit path (thin ellipse)
  for (int i = 0; i < 60; i++) {
    float fi = float(i);
    float path_a = fi * TAU / 60.0;
    float path_r = orbit_a * (1.0 - orbit_e * orbit_e) /
                   (1.0 + orbit_e * cos(path_a));
    vec2 path_pos = center + vec2(cos(path_a), sin(path_a)) * path_r;
    float path_d = length(uv - path_pos);
    float path_line = smoothstep(0.003, 0.001, path_d);
    // Only draw the part not behind Earth
    float behind = step(earth_dist, geoid_r) * step(length(path_pos - center), geoid_r);
    col += SOLAR_GOLD * path_line * 0.15 * (1.0 - behind);
  }

  // The grapefruit satellite — tiny! This is the point.
  // At this scale, 16.5 cm on a 12,742 km Earth is invisible.
  // We exaggerate to 0.008 screen units to make it visible but still small.
  float sat_dist = length(uv - sat_pos);
  float sat_size = 0.006;

  // Satellite body — metallic sphere with solar cell glints
  float sat_body = smoothstep(sat_size, sat_size - 0.002, sat_dist);
  vec3 sat_color = GRAPEFRUIT * (0.7 + 0.3 * cos(t * 3.0 + sat_angle)); // spin glint
  col = mix(col, sat_color, sat_body);

  // Solar cell glint — tiny bright flash as cells catch sunlight
  float glint_phase = mod(t * 2.3, TAU);
  float glint = exp(-sat_dist * sat_dist / 0.000005) *
                max(0.0, cos(glint_phase)) * 0.8;
  col += SOLAR_GOLD * glint;

  // Sun direction indicator (subtle glow from one side)
  float sun_dir_x = cos(sun_angle) * 0.5;
  float sun_dir_y = sin(sun_angle) * 0.5;
  float sun_glow = exp(-length(uv - center - vec2(sun_dir_x, sun_dir_y)) * 3.0) * 0.03;
  col += SOLAR_GOLD * sun_glow;

  return col;
}

// --- Mode 1: Solar Cell Illumination ---
vec3 mode_solar(vec2 uv, float t) {
  vec3 col = SPACE_DEEP * 0.5;

  // Solar panel surface — fills most of the screen
  vec2 panel_center = vec2(0.5, 0.5);
  float panel_w = 0.35;
  float panel_h = 0.25;

  // Panel body
  float in_panel = step(abs(uv.x - panel_center.x), panel_w) *
                   step(abs(uv.y - panel_center.y), panel_h);

  // 6 solar cells in a 3×2 grid (like Vanguard 1's configuration)
  float cell_w = panel_w * 0.6 / 3.0;
  float cell_h = panel_h * 0.7 / 2.0;
  float cell_gap = 0.01;

  // Light source sweeping across — represents sun angle changing
  float light_angle = t * 0.4;
  vec2 light_dir = vec2(cos(light_angle), sin(light_angle * 0.3 + 0.5));

  // Draw panel substrate
  if (in_panel > 0.5) {
    col = SILICON_GRAY * 0.4;

    // Draw individual cells
    for (int row = 0; row < 2; row++) {
      for (int cell = 0; cell < 3; cell++) {
        float cx = panel_center.x - panel_w * 0.4 + float(cell) * (cell_w + cell_gap) * 1.8;
        float cy = panel_center.y - panel_h * 0.3 + float(row) * (cell_h + cell_gap) * 2.0;

        float in_cell = step(abs(uv.x - cx), cell_w) *
                        step(abs(uv.y - cy), cell_h);

        if (in_cell > 0.5) {
          // Cell illumination based on cos(theta)
          // theta = angle between light direction and cell normal (z-axis)
          float cos_theta = max(0.0, light_dir.x * 0.5 + 0.5);

          // Each cell is slightly tilted on the sphere
          float cell_tilt = float(cell - 1) * 0.15 + float(row) * 0.1;
          float cell_cos = max(0.0, cos_theta + cell_tilt * 0.3);
          cell_cos = min(cell_cos, 1.0);

          // Cell color: dark blue-black when unlit, bright blue when illuminated
          vec3 cell_col = mix(CELL_BLUE * 0.3, CELL_BLUE + vec3(0.05, 0.08, 0.15), cell_cos);

          // Grid lines within cell (silicon wafer texture)
          float grid_x = abs(fract((uv.x - cx) / cell_w * 8.0) - 0.5);
          float grid_y = abs(fract((uv.y - cy) / cell_h * 6.0) - 0.5);
          float grid = smoothstep(0.48, 0.5, max(grid_x, grid_y));
          cell_col = mix(cell_col, cell_col * 0.7, grid * 0.3);

          // Specular highlight when light hits directly
          float spec = pow(cell_cos, 8.0) * 0.3;
          cell_col += SOLAR_GOLD * spec;

          col = cell_col;
        }
      }
    }
  }

  // Panel frame
  float frame_x = smoothstep(panel_w + 0.005, panel_w, abs(uv.x - panel_center.x)) *
                  smoothstep(panel_w, panel_w + 0.005, abs(uv.x - panel_center.x) + 0.008);
  float frame_y = smoothstep(panel_h + 0.005, panel_h, abs(uv.y - panel_center.y)) *
                  smoothstep(panel_h, panel_h + 0.005, abs(uv.y - panel_center.y) + 0.008);
  float frame = max(frame_x, frame_y) * in_panel;
  col = mix(col, SILICON_GRAY * 0.6, frame);

  // Cos(theta) curve display at bottom
  float curve_y = 0.1;
  float curve_h = 0.08;
  float curve_x_range = 0.3;
  if (uv.y < curve_y + curve_h && uv.y > curve_y - curve_h) {
    float norm_x = (uv.x - 0.5) / curve_x_range;
    if (abs(norm_x) < 1.0) {
      float theta = norm_x * PI * 0.5;  // -90 to +90 degrees
      float cos_val = cos(theta);
      float curve_plot = curve_y + cos_val * curve_h * 0.8;
      float on_curve = smoothstep(0.004, 0.001, abs(uv.y - curve_plot));
      col += SOLAR_GOLD * on_curve * 0.6;

      // Current angle marker
      float current_norm = cos(light_angle * 0.5) * 0.8;
      float marker_x = 0.5 + current_norm * curve_x_range;
      float marker = smoothstep(0.006, 0.002, abs(uv.x - marker_x)) *
                     step(curve_y - curve_h, uv.y) * step(uv.y, curve_y + curve_h);
      col += vec3(1.0, 0.4, 0.1) * marker * 0.4;
    }
  }

  // Label: "P = P_max cos(theta)"
  // (Not rendering text in GLSL — just a subtle indicator bar)
  float label_bar = smoothstep(0.018, 0.015, uv.y) * smoothstep(0.01, 0.013, uv.y);
  col += SOLAR_GOLD * label_bar * 0.1 * step(0.3, uv.x) * step(uv.x, 0.7);

  return col;
}

// --- Mode 2: Licorice Fern ---
vec3 mode_fern(vec2 uv, float t) {
  // Bark background — bigleaf maple
  float bark = fbm(vec2(uv.x * 3.0, uv.y * 15.0) + 5.2);
  float bark2 = fbm(vec2(uv.x * 8.0, uv.y * 25.0) + 2.1);
  vec3 col = BARK_BROWN * (0.6 + 0.5 * bark + 0.2 * bark2);

  // Moss patches on bark (Polypodium grows among moss)
  float moss = smoothstep(0.55, 0.65, fbm(uv * 12.0 + 3.0));
  col = mix(col, vec3(0.12, 0.20, 0.08), moss * 0.4);

  // Growth animation
  float growth = min(t * 0.06, 1.0);

  // Draw 3-4 fronds emerging from different attachment points
  for (int frond = 0; frond < 4; frond++) {
    float fi = float(frond);

    // Attachment point on bark
    vec2 base = vec2(0.2 + fi * 0.18, 0.15 + fi * 0.12 + sin(fi * 2.3) * 0.1);

    // Frond grows upward and slightly outward
    float frond_angle = -PI * 0.4 + fi * 0.25 + sin(fi * 1.7) * 0.15;

    // Fiddlehead unfurling animation
    float unfurl = min(growth + fi * 0.1, 1.0);
    float frond_len = 0.25 * unfurl * (0.8 + 0.2 * fi / 3.0);

    // Main rachis (stem) of the frond
    for (int seg = 0; seg < 40; seg++) {
      float s = float(seg) / 40.0;
      if (s > unfurl) break;

      // Rachis position — slight curve
      float curve = sin(s * PI * 0.5) * 0.03 * (1.0 + fi * 0.3);

      // Fiddlehead curl at the tip (when not fully unfurled)
      float curl = 0.0;
      if (s > unfurl - 0.15) {
        float curl_s = (s - (unfurl - 0.15)) / 0.15;
        curl = curl_s * curl_s * 0.04 * (1.0 - unfurl);
      }

      vec2 pos = base + vec2(
        cos(frond_angle) * s * frond_len + curve + curl * cos(frond_angle + PI * 0.5),
        sin(frond_angle) * s * frond_len + sin(s * PI) * 0.02 + curl * sin(frond_angle + PI * 0.5)
      );

      // Rachis (central stem)
      float rachis_width = 0.003 * (1.0 - s * 0.6);
      float rachis_d = length(uv - pos);
      float rachis = smoothstep(rachis_width, rachis_width - 0.001, rachis_d);
      col = mix(col, FERN_GREEN * 0.6, rachis);

      // Pinnae (leaflets) along the rachis — pinnate pattern
      if (seg % 3 == 0 && s < unfurl - 0.05) {
        for (int side = -1; side <= 1; side += 2) {
          float pinna_angle = frond_angle + float(side) * PI * 0.35;
          float pinna_len = 0.03 * (1.0 - s * 0.7) * unfurl;

          for (int p = 0; p < 6; p++) {
            float ps = float(p) / 6.0;
            vec2 pinna_pos = pos + vec2(
              cos(pinna_angle) * ps * pinna_len,
              sin(pinna_angle) * ps * pinna_len
            );
            float pinna_width = 0.004 * (1.0 - ps * 0.5) * (0.5 + 0.5 * sin(ps * PI));
            float pinna_d = length(uv - pinna_pos);
            float pinna = smoothstep(pinna_width, pinna_width - 0.001, pinna_d);

            // Pinna color — lighter at edges, darker at base
            vec3 pinna_col = mix(FERN_GREEN, FERN_GREEN * 1.3, ps * 0.4);

            col = mix(col, pinna_col, pinna * 0.8);
          }
        }
      }
    }

    // Rhizome at base — dark brown root-like structure
    float rhizome_d = length(uv - base);
    float rhizome = smoothstep(0.008, 0.004, rhizome_d);
    col = mix(col, BARK_BROWN * 0.5, rhizome * 0.6);
  }

  // Subtle moisture droplets (PNW forest is always wet)
  for (int d = 0; d < 8; d++) {
    float fd = float(d);
    vec2 drop_pos = vec2(hash(vec2(fd, 1.5)), hash(vec2(1.5, fd)));
    float drop_d = length(uv - drop_pos);
    float drop = smoothstep(0.004, 0.002, drop_d) * 0.3;
    col += vec3(0.5, 0.6, 0.7) * drop;
  }

  return col;
}

// --- Mode 3: 68-Year Orbit Clock ---
vec3 mode_clock(vec2 uv, float t) {
  vec3 col = SPACE_DEEP;

  vec2 center = vec2(0.5);

  // Orbital ring — thin ellipse representing the orbit path
  float ring_a = 0.3;   // semi-major axis
  float ring_b = 0.18;  // semi-minor axis (inclined orbit)
  float ring_angle = 0.1; // slight tilt
  vec2 rd = (uv - center) * rot(ring_angle);
  float ring_d = abs(length(vec2(rd.x / ring_a, rd.y / ring_b)) - 1.0);
  float ring = smoothstep(0.01, 0.003, ring_d);
  col += SOLAR_GOLD * ring * 0.2;

  // Moving satellite dot on the ring
  float orbit_phase = t * 0.44; // 134.2 min period, compressed
  vec2 sat_on_ring = center + vec2(
    cos(orbit_phase) * ring_a * cos(ring_angle) - sin(orbit_phase) * ring_b * sin(ring_angle),
    cos(orbit_phase) * ring_a * sin(ring_angle) + sin(orbit_phase) * ring_b * cos(ring_angle)
  );
  float sat_d = length(uv - sat_on_ring);
  float sat_dot = smoothstep(0.008, 0.003, sat_d);
  col += GRAPEFRUIT * sat_dot;

  // Satellite trail
  for (int i = 1; i < 20; i++) {
    float fi = float(i);
    float trail_phase = orbit_phase - fi * 0.08;
    vec2 trail_pos = center + vec2(
      cos(trail_phase) * ring_a * cos(ring_angle) - sin(trail_phase) * ring_b * sin(ring_angle),
      cos(trail_phase) * ring_a * sin(ring_angle) + sin(trail_phase) * ring_b * cos(ring_angle)
    );
    float trail_d = length(uv - trail_pos);
    float trail = smoothstep(0.005, 0.002, trail_d) * (1.0 - fi / 20.0);
    col += GRAPEFRUIT * trail * 0.2;
  }

  // Central Earth (small)
  float small_earth = smoothstep(0.04, 0.037, length(uv - center));
  col = mix(col, EARTH_BLUE * 0.6, small_earth);

  // Orbit counter — large ticking number
  // Vanguard 1: launched March 17, 1958. Period = 134.2 minutes = 8052 seconds
  // Orbits per day: 1440 / 134.2 = 10.73
  // Orbits per year: 10.73 * 365.25 = 3920
  // Total after 68 years: ~266,560 orbits
  // We show a slowly incrementing counter
  float orbit_count_base = 330000.0; // approximate current count
  float counter_increment = t * 0.01; // slowly ticking up
  float display_count = orbit_count_base + counter_increment;

  // Render counter as a series of digit-indicating bars
  // (GLSL can't render text, so we use abstract representations)

  // Years counter bar (top)
  float years_bar_y = 0.82;
  float years_fill = 68.0 / 100.0; // 68 years out of ~100 year scale
  float years_bar = step(0.25, uv.x) * step(uv.x, 0.25 + years_fill * 0.5) *
                    smoothstep(years_bar_y + 0.01, years_bar_y + 0.008, uv.y) *
                    smoothstep(years_bar_y - 0.008, years_bar_y - 0.01, uv.y);
  col += SOLAR_GOLD * years_bar * 0.5;
  // Bar outline
  float years_outline = step(0.25, uv.x) * step(uv.x, 0.75) *
                        smoothstep(0.012, 0.01, abs(uv.y - years_bar_y)) *
                        smoothstep(0.008, 0.01, abs(uv.y - years_bar_y));
  col += SOLAR_GOLD * years_outline * 0.15;

  // Orbits counter bar (bottom)
  float orbits_bar_y = 0.15;
  float orbits_fill = mod(display_count, 1000.0) / 1000.0;
  float orbits_bar = step(0.25, uv.x) * step(uv.x, 0.25 + orbits_fill * 0.5) *
                     smoothstep(orbits_bar_y + 0.008, orbits_bar_y + 0.006, uv.y) *
                     smoothstep(orbits_bar_y - 0.006, orbits_bar_y - 0.008, uv.y);
  col += GRAPEFRUIT * orbits_bar * 0.4;

  // Pulse at each "orbit completion" — brief flash
  float orbit_tick = fract(t * 0.44 / TAU);
  float tick_flash = exp(-fract(orbit_tick) * 20.0) * 0.1;
  col += SOLAR_GOLD * tick_flash;

  // Subtle radial rays — representing persistence
  float rays = abs(sin(atan(uv.y - 0.5, uv.x - 0.5) * 12.0 + t * 0.02));
  float ray_mask = smoothstep(0.35, 0.2, length(uv - center)) *
                   smoothstep(0.05, 0.1, length(uv - center));
  col += SOLAR_GOLD * rays * ray_mask * 0.02;

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
  if (mode < 0.5) col_current = mode_orbit(uv, t);
  else if (mode < 1.5) col_current = mode_solar(uv, t);
  else if (mode < 2.5) col_current = mode_fern(uv, t);
  else col_current = mode_clock(uv, t);

  // Next mode (for cross-fade)
  if (next_mode < 0.5) col_next = mode_orbit(uv, t);
  else if (next_mode < 1.5) col_next = mode_solar(uv, t);
  else if (next_mode < 2.5) col_next = mode_fern(uv, t);
  else col_next = mode_clock(uv, t);

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
