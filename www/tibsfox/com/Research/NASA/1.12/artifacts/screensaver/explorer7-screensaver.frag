#version 330 core

// Explorer 7 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Earth with incoming yellow rays and outgoing red/IR rays,
//           balance shifting — the radiation budget visualized
//   Mode 1: Bolometer — hemispheric sensor heating up, color changing
//           from blue to red as radiation is absorbed
//   Mode 2: Usnea longissima — pendant lichen strands swaying from
//           old-growth conifer branches, a biological thermometer
//   Mode 3: Sankey-style energy flow diagram animating — solar input
//           branching into reflection, absorption, thermal output
//
// Color palette: Solar / Thermal / Earth / Lichen / Space
//   Solar yellow:    #E8D060 (incoming sunlight, warmth, energy)
//   Thermal red:     #CC4020 (outgoing infrared, Earth's heat)
//   Earth blue:      #2040AA (planet, ocean, atmosphere)
//   Lichen sage:     #8AAA70 (Usnea longissima, biological sensor)
//   Space black:     #050510 (background, the void between)
//
// Compile: glslangValidator explorer7-screensaver.frag
// Run:     glslViewer explorer7-screensaver.frag
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
const vec3 SOLAR_YELLOW  = vec3(0.910, 0.816, 0.376);   // #E8D060
const vec3 THERMAL_RED   = vec3(0.800, 0.251, 0.125);   // #CC4020
const vec3 EARTH_BLUE    = vec3(0.125, 0.251, 0.667);   // #2040AA
const vec3 LICHEN_SAGE   = vec3(0.541, 0.667, 0.439);   // #8AAA70
const vec3 SPACE         = vec3(0.020, 0.020, 0.063);   // #050510
const vec3 CLOUD_WHITE   = vec3(0.850, 0.870, 0.900);
const vec3 ICE_WHITE     = vec3(0.750, 0.800, 0.850);
const vec3 OCEAN_DEEP    = vec3(0.050, 0.100, 0.300);
const vec3 LAND_GREEN    = vec3(0.150, 0.350, 0.120);

// ============================================================
// Mode 0: Earth Radiation Budget — Energy In vs Energy Out
// ============================================================
// A simplified Earth with incoming solar rays (yellow arrows from left)
// and outgoing thermal rays (red arrows radiating outward).
// The balance shifts over time — more energy in than out = warming.

vec4 radiationBudget(vec2 uv, float t) {
  vec3 col = SPACE;

  // Stars
  float star = hash(floor(uv * 250.0));
  if (star > 0.997) col += vec3(0.25);

  // Earth — centered, rotating slowly
  float earth_r = 0.22;
  float earth_d = length(uv);
  float earth_mask = smoothstep(earth_r + 0.003, earth_r, earth_d);

  // Surface detail — rotating texture
  float rot_angle = t * 0.05;
  vec2 rot_uv = rot(rot_angle) * uv;
  float surface_noise = fbm(rot_uv * 8.0 + vec2(3.7, 1.2));

  // Ocean vs land
  float land_mask = smoothstep(0.45, 0.55, surface_noise);
  vec3 surface_col = mix(OCEAN_DEEP, LAND_GREEN, land_mask);

  // Cloud layer
  float cloud_noise = fbm(rot_uv * 5.0 + vec2(t * 0.02, -1.0));
  float clouds = smoothstep(0.5, 0.7, cloud_noise);
  surface_col = mix(surface_col, CLOUD_WHITE, clouds * 0.6);

  // Ice caps
  float polar = abs(uv.y) / earth_r;
  float ice = smoothstep(0.75, 0.9, polar);
  surface_col = mix(surface_col, ICE_WHITE, ice * earth_mask);

  // Atmosphere glow
  float atmo_d = earth_d - earth_r;
  float atmo = smoothstep(0.05, 0.0, atmo_d) * (1.0 - earth_mask);
  col = mix(col, EARTH_BLUE * 0.5, atmo * 0.6);

  // Apply earth surface
  col = mix(col, surface_col, earth_mask);

  // Terminator (day/night boundary)
  float terminator = smoothstep(-0.02, 0.02, uv.x);
  col *= mix(0.15, 1.0, terminator * earth_mask + (1.0 - earth_mask));

  // --- Incoming solar rays (from left, yellow) ---
  float balance_shift = 0.5 + 0.3 * sin(t * 0.15); // slowly shifting balance
  int num_solar = 8;
  for (int i = 0; i < 8; i++) {
    float ray_y = -0.3 + float(i) * 0.09;
    float ray_x = -0.5 + mod(t * 0.15 + float(i) * 0.12, 0.8);

    // Arrow shape — moving rightward
    float ray_body = smoothstep(0.004, 0.001, abs(uv.y - ray_y)) *
                     smoothstep(ray_x - 0.08, ray_x - 0.06, uv.x) *
                     smoothstep(ray_x + 0.01, ray_x, uv.x);
    // Only draw outside earth
    ray_body *= (1.0 - smoothstep(earth_r - 0.05, earth_r - 0.02, earth_d));

    float ray_alpha = 0.5 + 0.3 * sin(t + float(i));
    col = mix(col, SOLAR_YELLOW, ray_body * ray_alpha * 0.7);

    // Arrowhead
    vec2 head_pos = vec2(ray_x, ray_y);
    float head_d = length(uv - head_pos);
    float head = smoothstep(0.012, 0.006, head_d);
    col = mix(col, SOLAR_YELLOW, head * ray_alpha * 0.5 * (1.0 - earth_mask));
  }

  // --- Outgoing thermal rays (radiating outward, red) ---
  int num_thermal = 12;
  for (int i = 0; i < 12; i++) {
    float angle = float(i) * 0.5236 + t * 0.08; // 30-degree spacing, rotating
    vec2 dir = vec2(cos(angle), sin(angle));

    // Ray starts at earth surface, moves outward
    float ray_dist = mod(t * 0.1 + float(i) * 0.15, 0.3);
    float ray_start = earth_r + 0.02;
    float ray_pos = ray_start + ray_dist;

    vec2 ray_center = dir * ray_pos;
    float ray_d = length(uv - ray_center);
    float thermal_ray = smoothstep(0.008, 0.003, ray_d);

    // Intensity modulated by balance — less thermal when greenhouse is strong
    float thermal_intensity = 0.4 + 0.4 * (1.0 - balance_shift);
    col = mix(col, THERMAL_RED, thermal_ray * thermal_intensity * 0.6);
  }

  // --- Reflected solar (scattered white dots leaving dayside) ---
  for (int i = 0; i < 6; i++) {
    float angle = -0.8 + float(i) * 0.32;
    vec2 dir = vec2(cos(angle), sin(angle));
    float ref_dist = mod(t * 0.12 + float(i) * 0.2, 0.25);
    vec2 ref_pos = dir * (earth_r + 0.02 + ref_dist);
    float ref_d = length(uv - ref_pos);
    float reflected = smoothstep(0.005, 0.002, ref_d);
    col = mix(col, CLOUD_WHITE, reflected * 0.3 * balance_shift);
  }

  // Balance indicator bar at bottom
  float bar_y = -0.42;
  float bar_h = 0.012;
  float bar_w = 0.35;
  float in_bar = smoothstep(bar_y - bar_h, bar_y - bar_h + 0.002, uv.y) *
                 smoothstep(bar_y + bar_h, bar_y + bar_h - 0.002, uv.y) *
                 smoothstep(-bar_w, -bar_w + 0.005, uv.x) *
                 smoothstep(bar_w, bar_w - 0.005, uv.x);
  // Left half yellow (input), right half red (output), bar position shows balance
  float bar_norm = (uv.x + bar_w) / (2.0 * bar_w);
  vec3 bar_col = mix(SOLAR_YELLOW, THERMAL_RED, bar_norm);
  // Balance needle
  float needle_x = (balance_shift - 0.5) * 2.0 * bar_w;
  float needle = smoothstep(0.003, 0.001, abs(uv.x - needle_x)) * in_bar * 2.0;
  col = mix(col, bar_col, in_bar * 0.4);
  col = mix(col, vec3(1.0), needle);

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Bolometer — Hemispheric Sensor Heating
// ============================================================
// A large hemisphere sensor absorbing radiation, changing color
// from blue (cold) to red (hot). The Suomi-Parent bolometer concept.

vec4 bolometer(vec2 uv, float t) {
  vec3 col = SPACE;

  float phase = mod(t, 15.0) / 15.0;

  // Heating cycle: cold → warm → hot → cooling
  float heat = 0.0;
  if (phase < 0.3) heat = phase / 0.3;
  else if (phase < 0.6) heat = 1.0;
  else if (phase < 0.9) heat = 1.0 - (phase - 0.6) / 0.3;
  else heat = 0.0;

  // --- Black hemisphere (left) — absorbs everything ---
  vec2 black_center = vec2(-0.18, 0.0);
  float black_r = 0.14;
  float black_d = length(uv - black_center);

  // Hemisphere shape — flat on the right side
  float black_hemi = smoothstep(black_r + 0.003, black_r, black_d) *
                     smoothstep(black_center.x - 0.01, black_center.x, uv.x);
  // Dome on left half
  float black_dome = smoothstep(black_r + 0.003, black_r, black_d) *
                     smoothstep(black_center.x, black_center.x + 0.01, -uv.x + black_center.x * 2.0);
  float black_mask = max(black_hemi, black_dome);

  // Color: blue → purple → red based on heat
  vec3 black_col = mix(vec3(0.05, 0.05, 0.15), THERMAL_RED, heat);
  // Surface detail
  float black_shade = 1.0 - (uv.x - black_center.x + black_r) / (2.0 * black_r) * 0.3;
  black_col *= black_shade;
  col = mix(col, black_col, black_mask);

  // Thermal glow
  float black_glow = smoothstep(black_r + 0.06, black_r, black_d) * (1.0 - black_mask);
  col = mix(col, THERMAL_RED * 0.3, black_glow * heat * 0.5);

  // --- White hemisphere (right) — reflects visible, absorbs thermal ---
  vec2 white_center = vec2(0.18, 0.0);
  float white_r = 0.14;
  float white_d = length(uv - white_center);

  float white_hemi = smoothstep(white_r + 0.003, white_r, white_d) *
                     smoothstep(white_center.x + 0.01, white_center.x, -uv.x + white_center.x * 2.0);
  float white_dome = smoothstep(white_r + 0.003, white_r, white_d) *
                     smoothstep(white_center.x, white_center.x - 0.01, uv.x);
  float white_mask = max(white_hemi, white_dome);

  // White hemisphere heats less (reflects visible component)
  float white_heat = heat * 0.5; // only thermal absorbed
  vec3 white_col = mix(vec3(0.7, 0.75, 0.8), mix(vec3(0.8, 0.6, 0.5), THERMAL_RED * 0.7, white_heat), white_heat);
  float white_shade = 1.0 - (white_center.x - uv.x + white_r) / (2.0 * white_r) * 0.3;
  white_col *= white_shade;
  col = mix(col, white_col, white_mask);

  // Subtle glow for white
  float white_glow = smoothstep(white_r + 0.04, white_r, white_d) * (1.0 - white_mask);
  col = mix(col, SOLAR_YELLOW * 0.15, white_glow * (1.0 - white_heat) * 0.3);

  // --- Incoming radiation arrows ---
  for (int i = 0; i < 5; i++) {
    float ray_y = -0.15 + float(i) * 0.075;
    float ray_x = -0.45 + mod(t * 0.2 + float(i) * 0.15, 0.6);
    float ray = smoothstep(0.003, 0.001, abs(uv.y - ray_y)) *
                smoothstep(ray_x - 0.06, ray_x - 0.04, uv.x) *
                smoothstep(ray_x + 0.01, ray_x, uv.x);
    // Mix of yellow (visible) and red (thermal)
    vec3 ray_col = mix(SOLAR_YELLOW, THERMAL_RED, float(i) / 4.0);
    col = mix(col, ray_col, ray * 0.5);
  }

  // --- Labels: "BLACK" and "WHITE" as dot patterns ---
  // Small indicator dots below each hemisphere
  float label_y = -0.22;
  float dot_black = smoothstep(0.006, 0.003, length(uv - vec2(-0.18, label_y)));
  col = mix(col, vec3(0.05), dot_black); // dark dot = black sensor
  float dot_white = smoothstep(0.006, 0.003, length(uv - vec2(0.18, label_y)));
  col = mix(col, vec3(0.9), dot_white); // light dot = white sensor

  // Temperature readout visualization — vertical bars
  float temp_x_black = -0.38;
  float temp_x_white = 0.38;
  float bar_h = 0.25;
  float bar_w = 0.015;

  // Black sensor temperature bar
  float b_bar = smoothstep(temp_x_black - bar_w, temp_x_black - bar_w + 0.003, uv.x) *
                smoothstep(temp_x_black + bar_w, temp_x_black + bar_w - 0.003, uv.x) *
                smoothstep(-bar_h * 0.5, -bar_h * 0.5 + 0.003, uv.y) *
                smoothstep(bar_h * 0.5, bar_h * 0.5 - 0.003, uv.y);
  float b_fill = smoothstep(-bar_h * 0.5, -bar_h * 0.5 + bar_h * heat, uv.y);
  vec3 b_bar_col = mix(EARTH_BLUE, THERMAL_RED, b_fill);
  col = mix(col, b_bar_col * 0.8, b_bar * b_fill);
  col = mix(col, vec3(0.2), b_bar * (1.0 - b_fill) * 0.3);

  // White sensor temperature bar
  float w_bar = smoothstep(temp_x_white - bar_w, temp_x_white - bar_w + 0.003, uv.x) *
                smoothstep(temp_x_white + bar_w, temp_x_white + bar_w - 0.003, uv.x) *
                smoothstep(-bar_h * 0.5, -bar_h * 0.5 + 0.003, uv.y) *
                smoothstep(bar_h * 0.5, bar_h * 0.5 - 0.003, uv.y);
  float w_fill = smoothstep(-bar_h * 0.5, -bar_h * 0.5 + bar_h * white_heat, uv.y);
  vec3 w_bar_col = mix(EARTH_BLUE, SOLAR_YELLOW * 0.8, w_fill);
  col = mix(col, w_bar_col * 0.8, w_bar * w_fill);
  col = mix(col, vec3(0.2), w_bar * (1.0 - w_fill) * 0.3);

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Usnea Longissima — Pendant Lichen Swaying
// ============================================================
// Long strands of Methuselah's beard lichen hanging from
// old-growth conifer branches, swaying gently in the wind.
// A biological thermometer in the forest canopy.

vec4 usneaLichen(vec2 uv, float t) {
  vec3 col = SPACE * 1.5; // slightly lighter — forest twilight

  float phase = mod(t, 15.0) / 15.0;

  // --- Branch (top) — dark conifer silhouette ---
  float branch_y = 0.35;
  float branch_w = 0.4;
  float branch_thickness = 0.025;
  // Main branch — slightly curved
  float branch_curve = -0.03 * sin(uv.x * 3.0);
  float branch = smoothstep(branch_y + branch_thickness + branch_curve,
                            branch_y + branch_thickness - 0.005 + branch_curve, uv.y) *
                 smoothstep(branch_y - branch_thickness + branch_curve,
                            branch_y - branch_thickness + 0.005 + branch_curve, uv.y) *
                 smoothstep(-branch_w, -branch_w + 0.02, uv.x) *
                 smoothstep(branch_w, branch_w - 0.02, uv.x);
  vec3 branch_col = vec3(0.08, 0.06, 0.04); // dark bark
  col = mix(col, branch_col, branch);

  // Sub-branches
  for (int i = 0; i < 4; i++) {
    float bx = -0.25 + float(i) * 0.17;
    float by = branch_y + branch_curve;
    float sub_angle = 0.3 + float(i) * 0.15;
    float sub_len = 0.08 + hash(vec2(float(i), 1.0)) * 0.06;
    vec2 sub_end = vec2(bx + cos(sub_angle) * sub_len, by - sin(sub_angle) * sub_len);
    // Line from (bx,by) to sub_end
    vec2 sub_dir = normalize(sub_end - vec2(bx, by));
    float sub_proj = dot(uv - vec2(bx, by), sub_dir);
    float sub_perp = length(uv - vec2(bx, by) - sub_dir * sub_proj);
    float sub_branch = smoothstep(0.008, 0.003, sub_perp) *
                       step(0.0, sub_proj) * step(sub_proj, sub_len);
    col = mix(col, branch_col * 0.8, sub_branch);
  }

  // --- Usnea longissima strands ---
  // Long, pendant, sage-green strands hanging from the branch
  // Swaying in wind — sinusoidal displacement increasing with length
  float wind_speed = 0.4 + 0.3 * sin(t * 0.2);
  float wind_gust = 0.15 * sin(t * 0.7 + 2.0);

  for (int i = 0; i < 12; i++) {
    float strand_x = -0.30 + float(i) * 0.055 + hash(vec2(float(i), 2.0)) * 0.02;
    float strand_top = branch_y - branch_thickness + branch_curve;
    float strand_len = 0.25 + hash(vec2(float(i), 3.0)) * 0.30;
    float strand_width = 0.003 + hash(vec2(float(i), 4.0)) * 0.002;

    // Strand shape: hanging from branch, swaying
    // Each point on the strand displaces horizontally based on wind and depth
    float depth = (strand_top - uv.y) / strand_len;
    float sway = (wind_speed + wind_gust) * depth * depth *
                 sin(t * 1.5 + float(i) * 0.8 + depth * 3.0) * 0.08;

    // Strand center x at this y
    float center_x = strand_x + sway;

    // Only draw where strand exists (below branch, above endpoint)
    float in_strand = smoothstep(strand_width + 0.002, strand_width, abs(uv.x - center_x)) *
                      smoothstep(strand_top + 0.005, strand_top, uv.y) *
                      smoothstep(strand_top - strand_len - 0.005, strand_top - strand_len, uv.y);

    // Color variation along strand
    float color_var = 0.8 + 0.2 * vnoise(vec2(uv.y * 30.0, float(i)));
    vec3 strand_col = LICHEN_SAGE * color_var;
    // Lighter tips, darker base
    strand_col *= 0.7 + 0.3 * depth;
    // Slight yellow tones (reproductive soredia)
    strand_col = mix(strand_col, SOLAR_YELLOW * 0.5, hash(vec2(float(i), 5.0)) * 0.15);

    col = mix(col, strand_col, in_strand * 0.85);

    // Wispy sub-filaments
    float filament_x = center_x + sin(uv.y * 40.0 + float(i)) * 0.005;
    float filament = smoothstep(0.002, 0.001, abs(uv.x - filament_x)) *
                     in_strand * 0.3;
    col = mix(col, strand_col * 0.7, filament);
  }

  // --- Ambient forest elements ---
  // Fog / mist — volumetric feel
  float mist = fbm(uv * 3.0 + vec2(t * 0.01, 0.0)) * 0.15;
  col = mix(col, vec3(0.12, 0.14, 0.12), mist * smoothstep(0.3, -0.3, uv.y));

  // Distant canopy above (very dark, suggesting more tree)
  float canopy = smoothstep(0.42, 0.38, uv.y);
  col = mix(col, branch_col * 0.5, (1.0 - canopy) * step(0.38, uv.y));

  // Faint rain drops
  for (int i = 0; i < 10; i++) {
    float rx = hash(vec2(float(i), 6.0)) * 0.8 - 0.4;
    float ry = mod(hash(vec2(float(i), 7.0)) - t * 0.3, 1.0) * 0.8 - 0.3;
    float rain = smoothstep(0.015, 0.0, abs(uv.x - rx)) *
                 smoothstep(0.002, 0.0, abs(uv.y - ry));
    col += vec3(0.15, 0.18, 0.20) * rain * 0.15;
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Sankey Energy Flow — Animated Diagram
// ============================================================
// A Sankey diagram showing energy flowing from solar input
// through the Earth system: reflection, absorption, greenhouse
// trapping, thermal emission. Flows animate with moving particles.

vec4 sankeyFlow(vec2 uv, float t) {
  vec3 col = SPACE;

  // Main flow: Solar input (left) → branches → outputs (right)
  // Layout:
  //   LEFT:  Solar input (single wide band)
  //   MID:   Reflection (up), Absorption (center), Greenhouse (down)
  //   RIGHT: Reflected (up), Thermal out (center), Trapped (down)

  float flow_speed = t * 0.3;

  // --- Solar input band (left) ---
  float solar_band_y = 0.0;
  float solar_band_w = 0.06;
  float solar_band_start = -0.45;
  float solar_band_end = -0.15;

  float solar_band = smoothstep(solar_band_y - solar_band_w, solar_band_y - solar_band_w + 0.005, uv.y) *
                     smoothstep(solar_band_y + solar_band_w, solar_band_y + solar_band_w - 0.005, uv.y) *
                     smoothstep(solar_band_start, solar_band_start + 0.01, uv.x) *
                     smoothstep(solar_band_end + 0.01, solar_band_end, uv.x);
  col = mix(col, SOLAR_YELLOW * 0.7, solar_band);

  // Flowing particles in solar band
  for (int i = 0; i < 6; i++) {
    float px = solar_band_start + mod(flow_speed + float(i) * 0.05, solar_band_end - solar_band_start);
    float py = solar_band_y + (hash(vec2(float(i), 10.0)) - 0.5) * solar_band_w * 1.5;
    float particle = smoothstep(0.008, 0.003, length(uv - vec2(px, py)));
    col = mix(col, SOLAR_YELLOW, particle * 0.8 * solar_band);
  }

  // --- Branch point ---
  float branch_x = -0.15;

  // --- Reflected band (30%, curves upward) ---
  float ref_frac = 0.30;
  float ref_band_w = solar_band_w * ref_frac;
  // Curve from branch point upward to upper-right exit
  float ref_y_start = solar_band_y + solar_band_w * 0.5;
  float ref_y_end = 0.30;
  float ref_x_end = 0.40;

  for (float s = 0.0; s < 1.0; s += 0.02) {
    float rx = mix(branch_x, ref_x_end, s);
    float ry = mix(ref_y_start, ref_y_end, s * s); // quadratic curve up
    float rd = length(uv - vec2(rx, ry));
    float ref_flow = smoothstep(ref_band_w + 0.003, ref_band_w, rd);
    col = mix(col, CLOUD_WHITE * 0.5, ref_flow * 0.4);
  }

  // Reflected particles
  for (int i = 0; i < 4; i++) {
    float s = mod(flow_speed * 0.7 + float(i) * 0.25, 1.0);
    float rx = mix(branch_x, ref_x_end, s);
    float ry = mix(ref_y_start, ref_y_end, s * s);
    float rp = smoothstep(0.008, 0.003, length(uv - vec2(rx, ry)));
    col = mix(col, CLOUD_WHITE, rp * 0.6);
  }

  // --- Absorbed band (70%, continues right) ---
  float abs_band_w = solar_band_w * 0.70;
  float abs_y = solar_band_y - 0.01;
  float abs_x_start = branch_x;
  float abs_x_mid = 0.05;

  float abs_band = smoothstep(abs_y - abs_band_w, abs_y - abs_band_w + 0.004, uv.y) *
                   smoothstep(abs_y + abs_band_w, abs_y + abs_band_w - 0.004, uv.y) *
                   smoothstep(abs_x_start, abs_x_start + 0.01, uv.x) *
                   smoothstep(abs_x_mid + 0.01, abs_x_mid, uv.x);
  col = mix(col, SOLAR_YELLOW * 0.5, abs_band);

  // --- Second branch: absorbed → thermal out + greenhouse trapped ---
  float branch2_x = 0.05;

  // Thermal output (upward, red)
  float therm_y_end = 0.15;
  float therm_x_end = 0.40;
  float therm_band_w = abs_band_w * 0.6;

  for (float s = 0.0; s < 1.0; s += 0.02) {
    float tx = mix(branch2_x, therm_x_end, s);
    float ty = mix(abs_y, therm_y_end, s);
    float td = length(uv - vec2(tx, ty));
    float therm_flow = smoothstep(therm_band_w + 0.003, therm_band_w, td);
    col = mix(col, THERMAL_RED * 0.6, therm_flow * 0.5);
  }

  // Thermal particles
  for (int i = 0; i < 5; i++) {
    float s = mod(flow_speed * 0.6 + float(i) * 0.2, 1.0);
    float tx = mix(branch2_x, therm_x_end, s);
    float ty = mix(abs_y, therm_y_end, s);
    float tp = smoothstep(0.007, 0.002, length(uv - vec2(tx, ty)));
    col = mix(col, THERMAL_RED, tp * 0.7);
  }

  // Greenhouse trapped (downward, darker red)
  float trap_y_end = -0.25;
  float trap_x_end = 0.40;
  float trap_band_w = abs_band_w * 0.4;

  for (float s = 0.0; s < 1.0; s += 0.02) {
    float gx = mix(branch2_x, trap_x_end, s);
    float gy = mix(abs_y, trap_y_end, s * s);
    float gd = length(uv - vec2(gx, gy));
    float trap_flow = smoothstep(trap_band_w + 0.003, trap_band_w, gd);
    col = mix(col, THERMAL_RED * 0.3, trap_flow * 0.5);
  }

  // Trapped particles — cycling back (greenhouse re-emission)
  for (int i = 0; i < 3; i++) {
    float s = mod(flow_speed * 0.4 + float(i) * 0.33, 1.0);
    float gx = mix(branch2_x, trap_x_end, s);
    float gy = mix(abs_y, trap_y_end, s * s);
    float gp = smoothstep(0.006, 0.002, length(uv - vec2(gx, gy)));
    col = mix(col, THERMAL_RED * 0.5, gp * 0.5);

    // Re-emission arrows (some trapped energy goes back down)
    float reback_s = mod(s + 0.5, 1.0);
    float rbx = mix(trap_x_end * 0.7, branch2_x, reback_s);
    float rby = mix(trap_y_end * 0.7, abs_y - 0.05, reback_s);
    float rbp = smoothstep(0.005, 0.002, length(uv - vec2(rbx, rby)));
    col = mix(col, THERMAL_RED * 0.4, rbp * 0.3);
  }

  // --- Flow labels as colored dots ---
  // Solar dot (left)
  float solar_dot = smoothstep(0.012, 0.006, length(uv - vec2(-0.45, solar_band_y)));
  col = mix(col, SOLAR_YELLOW, solar_dot);
  // Reflected dot (upper right)
  float ref_dot = smoothstep(0.010, 0.005, length(uv - vec2(0.42, ref_y_end)));
  col = mix(col, CLOUD_WHITE, ref_dot);
  // Thermal dot (mid right)
  float therm_dot = smoothstep(0.010, 0.005, length(uv - vec2(0.42, therm_y_end)));
  col = mix(col, THERMAL_RED, therm_dot);
  // Trapped dot (lower right)
  float trap_dot = smoothstep(0.010, 0.005, length(uv - vec2(0.42, trap_y_end)));
  col = mix(col, THERMAL_RED * 0.5, trap_dot);

  return vec4(col, 1.0);
}

// ============================================================
// MAIN — Mode Cycling
// ============================================================
void main() {
  vec2 uv = (gl_FragCoord.xy - iResolution.xy * 0.5) / min(iResolution.x, iResolution.y);

  float cycle = 60.0;
  float mode_dur = cycle / 4.0;
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
    result = radiationBudget(uv, mode_t);
  } else if (mode == 1) {
    result = bolometer(uv, mode_t);
  } else if (mode == 2) {
    result = usneaLichen(uv, mode_t);
  } else {
    result = sankeyFlow(uv, mode_t);
  }

  // Apply mode transition fade
  result.rgb *= fade;

  // Subtle vignette
  float vignette = 1.0 - length(uv) * 0.4;
  result.rgb *= vignette;

  fragColor = result;
}
