#version 330 core

// Explorer 6 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Spin-scan effect — rotating scan line sweeps across the screen,
//           gradually revealing a crude Earth image made of phosphor-green
//           dots on dark background, mimicking the strip-chart output
//   Mode 1: Ring current visualization — particles flowing in a toroid
//           around Earth, showing the ring current Explorer 6 discovered
//   Mode 2: Turkey tail growth — concentric colored bands expanding outward
//           from a central point, mimicking Trametes versicolor bracket growth
//   Mode 3: Van Gogh swirl — flowing, spiraling patterns inspired by
//           Starry Night, using the mission's color palette
//
// Color palette: Explorer 6 / First Earth Image
//   Phosphor green:   #33CC33
//   CRT dark:         #0A150A
//   Signal amber:     #D4A830
//   Turkey-tail brown:#6B4226
//
// Compile: glslangValidator explorer6-screensaver.frag
// Run:     glslViewer explorer6-screensaver.frag
// Install: copy to /usr/lib/xscreensaver/ or ~/.local/share/xscreensaver/

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_mode;

out vec4 fragColor;

// --- Constants ---
const vec3 PHOSPHOR_GREEN = vec3(0.2, 0.8, 0.2);
const vec3 CRT_DARK       = vec3(0.04, 0.08, 0.04);
const vec3 SIGNAL_AMBER   = vec3(0.83, 0.66, 0.19);
const vec3 TURKEY_BROWN   = vec3(0.42, 0.26, 0.15);
const vec3 CREAM_WHITE    = vec3(0.92, 0.88, 0.78);
const vec3 RING_BLUE      = vec3(0.2, 0.4, 0.9);

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

// --- Mode 0: Spin-Scan Earth Image ---
vec3 mode_spinscan(vec2 uv, float t) {
  // CRT background with subtle flicker
  vec3 col = CRT_DARK * (0.95 + 0.05 * sin(t * 60.0));

  // Center of "CRT screen"
  vec2 center = vec2(0.5);
  vec2 d = uv - center;
  float dist = length(d);
  float angle = atan(d.y, d.x);

  // CRT circular mask
  float crt_radius = 0.38;
  float crt_mask = smoothstep(crt_radius, crt_radius - 0.01, dist);

  // Scan line — rotates at spin rate (2.8 rpm compressed)
  float spin_angle = t * TAU * 0.15; // ~6.7 second period for visual interest
  float scan_line_width = 0.03;
  float scan_angle_diff = mod(angle - spin_angle + PI, TAU) - PI;
  float scan_brightness = exp(-scan_angle_diff * scan_angle_diff / (2.0 * scan_line_width * scan_line_width));

  // Scan line glow
  col += PHOSPHOR_GREEN * scan_brightness * 0.5 * crt_mask;

  // Earth crescent — builds up over time
  // Earth is roughly centered, crescent shape
  float earth_radius = 0.2;
  float earth_dist = length(d - vec2(0.05, 0.0));

  // Crescent: bright on the right (sunlit), dark on the left
  float earth_mask = smoothstep(earth_radius, earth_radius - 0.02, earth_dist);
  float crescent = smoothstep(-0.1, 0.15, d.x - 0.05);

  // Only show parts that have been "scanned" — progressive buildup
  float scanned_angle = mod(spin_angle, TAU);
  float reveal_progress = min(t / 20.0, 1.0); // Full reveal after 20 seconds
  float pixel_angle = atan(d.y - 0.0, d.x - 0.05);
  float angle_revealed = mod(pixel_angle - spin_angle + 4.0 * PI, TAU);

  // Phosphor dots (simulating strip-chart recorder output)
  float dot_grid = step(0.5, sin(uv.x * 120.0) * sin(uv.y * 120.0));
  float earth_signal = earth_mask * crescent * reveal_progress;

  // Add noise that increases over time (signal degradation)
  float noise_level = 0.1 + 0.2 * smoothstep(15.0, 25.0, mod(t, 30.0));
  earth_signal += (vnoise(uv * 80.0 + t * 2.0) - 0.5) * noise_level * earth_mask;
  earth_signal = clamp(earth_signal, 0.0, 1.0);

  // Phosphor green dots showing the Earth image
  col += PHOSPHOR_GREEN * earth_signal * (0.5 + 0.5 * dot_grid) * crt_mask;

  // Scan line trace — bright horizontal trace
  float h_trace = exp(-d.y * d.y / 0.0001) * scan_brightness;
  col += PHOSPHOR_GREEN * h_trace * 0.3 * crt_mask;

  // CRT border glow
  float border_glow = smoothstep(crt_radius - 0.02, crt_radius, dist) *
                      smoothstep(crt_radius + 0.02, crt_radius, dist);
  col += PHOSPHOR_GREEN * border_glow * 0.15;

  return col;
}

// --- Mode 1: Ring Current ---
vec3 mode_ringcurrent(vec2 uv, float t) {
  vec3 col = vec3(0.02, 0.02, 0.06);

  vec2 center = vec2(0.5);
  vec2 d = uv - center;
  float dist = length(d);
  float angle = atan(d.y, d.x);

  // Earth sphere
  float earth_r = 0.06;
  float earth = smoothstep(earth_r, earth_r - 0.005, dist);
  col += vec3(0.15, 0.3, 0.7) * earth;

  // Day/night terminator
  col += vec3(0.1, 0.2, 0.1) * earth * smoothstep(-0.02, 0.02, d.x);

  // Ring current — toroidal current flowing around Earth
  // at 3-8 Earth radii in the equatorial plane
  float ring_inner = 0.15;
  float ring_outer = 0.35;
  float ring_center = (ring_inner + ring_outer) * 0.5;
  float ring_width = (ring_outer - ring_inner) * 0.5;

  // Toroidal shape (viewed from above the pole)
  float ring_dist = abs(dist - ring_center);
  float ring_mask = smoothstep(ring_width, ring_width * 0.3, ring_dist);

  // Flowing particles
  float flow_speed = t * 0.8;
  float particle_density = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float a = angle + flow_speed + fi * TAU / 12.0;
    float r = ring_center + sin(a * 3.0 + fi) * ring_width * 0.4;
    vec2 particle_pos = center + vec2(cos(a), sin(a)) * r;
    float pdist = length(uv - particle_pos);
    particle_density += exp(-pdist * pdist / 0.0008) * (0.5 + 0.5 * sin(t + fi));
  }

  // Ring current glow
  vec3 ring_col = mix(RING_BLUE, SIGNAL_AMBER, 0.3 + 0.3 * sin(angle * 2.0 + t));
  col += ring_col * ring_mask * 0.15;
  col += ring_col * particle_density * 0.4;

  // Magnetic field lines (dipole approximation)
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float base_angle = fi * PI / 6.0;
    float field_r = 0.08 + dist * 2.0;
    float field_line = sin(angle * 2.0 - base_angle) * cos(angle);
    float field_mask = exp(-abs(field_line) / 0.15) * smoothstep(0.08, 0.12, dist) *
                       smoothstep(0.45, 0.35, dist);
    col += vec3(0.1, 0.15, 0.3) * field_mask * 0.08;
  }

  // Explorer 6 orbit — elliptical path
  float orbit_a = 0.32; // semi-major
  float orbit_b = 0.12; // semi-minor
  float orbit_angle = t * 0.1;
  vec2 orbit_pos = center + vec2(cos(orbit_angle) * orbit_a,
                                  sin(orbit_angle) * orbit_b);
  float orbit_dot = smoothstep(0.008, 0.003, length(uv - orbit_pos));
  col += SIGNAL_AMBER * orbit_dot;

  // Orbit trail
  for (int i = 1; i < 20; i++) {
    float fi = float(i);
    float trail_angle = orbit_angle - fi * 0.02;
    vec2 trail_pos = center + vec2(cos(trail_angle) * orbit_a,
                                    sin(trail_angle) * orbit_b);
    float trail_dot = smoothstep(0.005, 0.002, length(uv - trail_pos));
    col += SIGNAL_AMBER * trail_dot * (1.0 - fi / 20.0) * 0.3;
  }

  return col;
}

// --- Mode 2: Turkey Tail Fungus Growth ---
vec3 mode_turkeytail(vec2 uv, float t) {
  vec3 col = vec3(0.05, 0.04, 0.03);

  vec2 center = vec2(0.5, 0.7); // Grows from bottom
  vec2 d = uv - center;
  float dist = length(d);
  float angle = atan(d.y, d.x);

  // Fan shape — turkey tail brackets are semicircular fans
  float fan_mask = smoothstep(0.0, 0.01, -d.y + 0.3) * smoothstep(0.5, 0.48, dist);

  // Concentric growth rings — the diagnostic feature of Trametes versicolor
  float growth = t * 0.08;
  float ring_count = 8.0;

  for (float i = 0.0; i < 8.0; i++) {
    float ring_r = (i + 1.0) * 0.05 * min(growth, 1.0 + i * 0.1);
    float ring_width = 0.02 + 0.005 * sin(i * 1.7);
    float ring = smoothstep(ring_width, 0.0, abs(dist - ring_r));

    // Each ring has a different color — the "versicolor" in the name
    // Browns, tans, creams, and occasional blue-gray
    vec3 ring_color;
    float color_phase = mod(i, 4.0);
    if (color_phase < 1.0) ring_color = TURKEY_BROWN;
    else if (color_phase < 2.0) ring_color = CREAM_WHITE * 0.7;
    else if (color_phase < 3.0) ring_color = vec3(0.35, 0.30, 0.25);
    else ring_color = vec3(0.50, 0.45, 0.35);

    // Wavy edges — organic irregularity
    float wave = 0.008 * sin(angle * 12.0 + i * 3.0 + t * 0.2);
    ring = smoothstep(ring_width, 0.0, abs(dist - ring_r + wave));

    col += ring_color * ring * fan_mask;
  }

  // Velvety texture
  float velvet = fbm(uv * 30.0 + t * 0.1) * 0.1;
  col += vec3(velvet * 0.5, velvet * 0.4, velvet * 0.3) * fan_mask;

  // Substrate (log/bark) behind the bracket
  float bark = fbm(vec2(uv.x * 3.0, uv.y * 15.0)) * 0.15;
  vec3 bark_col = vec3(0.15, 0.10, 0.07) * (1.0 + bark);
  col = mix(bark_col, col, fan_mask * smoothstep(0.02, 0.05, dist));

  // Spore release — tiny particles drifting down
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float spore_t = mod(t * 0.3 + fi * 0.7, 3.0);
    vec2 spore_pos = center + vec2(sin(fi * 2.3) * 0.15,
                                    -spore_t * 0.15 + 0.05);
    float spore = smoothstep(0.004, 0.001, length(uv - spore_pos));
    col += CREAM_WHITE * spore * 0.3 * (1.0 - spore_t / 3.0);
  }

  return col;
}

// --- Mode 3: Van Gogh Swirl ---
vec3 mode_vangogh(vec2 uv, float t) {
  // Flowing, spiraling patterns inspired by Starry Night
  vec2 p = (uv - 0.5) * 2.0;

  // Flow field — curl noise for swirling motion
  float flow_scale = 3.0;
  vec2 flow = p;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    flow += 0.3 * vec2(
      sin(flow.y * flow_scale + t * 0.5 + fi) + cos(flow.x * flow_scale * 0.7 + t * 0.3),
      cos(flow.x * flow_scale + t * 0.4 + fi) + sin(flow.y * flow_scale * 0.8 + t * 0.6)
    ) / (1.0 + fi);
  }

  // Base swirl pattern
  float swirl = fbm(flow * 2.0 + t * 0.1);
  float swirl2 = fbm(flow * 3.0 - t * 0.15 + 5.0);

  // Night sky — deep blues and blacks
  vec3 sky = mix(vec3(0.03, 0.03, 0.12), vec3(0.05, 0.08, 0.25), swirl);

  // Stars — bright points in the swirl
  float stars = pow(vnoise(uv * 50.0), 8.0) * 2.0;
  sky += vec3(0.9, 0.85, 0.6) * stars;

  // Swirling nebulae — Van Gogh's thick paint strokes
  float nebula = smoothstep(0.4, 0.6, swirl) * smoothstep(0.7, 0.5, swirl);
  vec3 stroke_col = mix(PHOSPHOR_GREEN * 0.5, SIGNAL_AMBER,
                        smoothstep(0.3, 0.7, swirl2));
  sky += stroke_col * nebula * 0.4;

  // Thick impasto brushstrokes — directional texture
  float brush_angle = atan(flow.y, flow.x);
  float brush = sin(brush_angle * 8.0 + length(flow) * 10.0) * 0.5 + 0.5;
  brush *= smoothstep(0.3, 0.5, swirl);
  sky += stroke_col * brush * 0.15;

  // Central bright swirl (the moon/planet in Starry Night)
  float center_dist = length(p + vec2(0.3, -0.2));
  float center_glow = exp(-center_dist * center_dist / 0.08);
  vec3 center_col = mix(SIGNAL_AMBER, PHOSPHOR_GREEN, 0.3);
  sky += center_col * center_glow * 0.5;

  // Spiral arms radiating from center
  float spiral_angle = atan(p.y + 0.2, p.x + 0.3);
  float spiral = sin(spiral_angle * 3.0 - length(p) * 8.0 + t * 0.5) * 0.5 + 0.5;
  spiral *= center_glow * 2.0;
  sky += SIGNAL_AMBER * spiral * 0.2;

  return sky;
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
  if (mode < 0.5) col_current = mode_spinscan(uv, t);
  else if (mode < 1.5) col_current = mode_ringcurrent(uv, t);
  else if (mode < 2.5) col_current = mode_turkeytail(uv, t);
  else col_current = mode_vangogh(uv, t);

  // Next mode (for cross-fade)
  if (next_mode < 0.5) col_next = mode_spinscan(uv, t);
  else if (next_mode < 1.5) col_next = mode_ringcurrent(uv, t);
  else if (next_mode < 2.5) col_next = mode_turkeytail(uv, t);
  else col_next = mode_vangogh(uv, t);

  vec3 col = mix(col_current, col_next, transition);

  // CRT scanline effect (subtle)
  float scanline = sin(gl_FragCoord.y * 1.5) * 0.03;
  col -= scanline;

  // Vignette
  float vignette = 1.0 - 0.3 * length(uv - 0.5);
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
