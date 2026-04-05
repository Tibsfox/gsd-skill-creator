#version 330 core

// Mariner 2 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Western red cedar trunk cross-section — growth rings accumulating,
//           thujaplicin gradient as amber glow in heartwood
//   Mode 1: Mariner 2 cruise — Earth shrinking left, Venus growing right,
//           malfunction indicators flickering, 109-day timeline
//   Mode 2: Venus greenhouse cross-section — trapped IR radiation, CO2 layers,
//           460°C surface glow beneath swirling cloud deck
//   Mode 3: Cedar Waxwing flock — coordinated movement through canopy,
//           berry-laden branches, high-pitched call visualization
//
// Color palette: Cedar / Venus
//   Cedar bark:      #8B4513
//   Heartwood amber: #D4A830
//   Venus clouds:    #E8D8A0
//   Venus surface:   #CC3300
//   Waxwing brown:   #C4A882
//   Waxwing yellow:  #F0E060
//
// Run: glslViewer mariner2-screensaver.frag

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
  float a = hash(i);
  float b = hash(i + vec2(1, 0));
  float c = hash(i + vec2(0, 1));
  float d = hash(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// --- Mode 0: Cedar Cross-Section ---
vec3 cedar_rings(vec2 uv, float t) {
  vec2 center = vec2(0.5, 0.5);
  float dist = length(uv - center);
  float ring_count = 40.0 + 10.0 * sin(t * 0.1);

  // Growth rings with asymmetry (lean correction / reaction wood)
  float angle = atan(uv.y - 0.5, uv.x - 0.5);
  float asymmetry = 0.02 * sin(angle * 2.0 + t * 0.05);
  float r = dist + asymmetry;

  float ring = sin(r * ring_count * 6.2832) * 0.5 + 0.5;
  ring = smoothstep(0.3, 0.7, ring);

  // Heartwood thujaplicin glow (amber center)
  float heartwood = smoothstep(0.25, 0.08, dist);
  vec3 sapwood = vec3(0.75, 0.55, 0.30) * (0.5 + 0.5 * ring);
  vec3 heart_color = vec3(0.83, 0.66, 0.19) * (0.7 + 0.3 * sin(t * 0.3));

  // Bark (outer)
  float bark = smoothstep(0.38, 0.42, dist);
  vec3 bark_color = vec3(0.35, 0.20, 0.08);

  vec3 col = mix(sapwood, heart_color, heartwood);
  col = mix(col, bark_color, bark);

  // Dim outside the trunk
  col *= smoothstep(0.48, 0.44, dist);

  return col;
}

// --- Mode 1: Mariner 2 Cruise ---
vec3 mariner_cruise(vec2 uv, float t) {
  // Star field
  vec3 col = vec3(0.0);
  for (int i = 0; i < 80; i++) {
    vec2 star = vec2(hash(vec2(float(i), 1.0)), hash(vec2(float(i), 2.0)));
    float brightness = hash(vec2(float(i), 3.0));
    float d = length(uv - star);
    col += vec3(brightness) * smoothstep(0.005, 0.0, d);
  }

  // Earth (shrinking, left side)
  float earth_size = 0.06 * max(0.1, 1.0 - t * 0.08);
  float earth_d = length(uv - vec2(0.15, 0.5));
  vec3 earth = vec3(0.2, 0.4, 0.8) * smoothstep(earth_size + 0.002, earth_size, earth_d);

  // Venus (growing, right side)
  float venus_size = 0.02 + 0.06 * min(1.0, t * 0.08);
  float venus_d = length(uv - vec2(0.85, 0.5));
  vec3 venus = vec3(0.9, 0.8, 0.5) * smoothstep(venus_size + 0.002, venus_size, venus_d);

  // Spacecraft indicator (center, blinking for malfunctions)
  float sc_d = length(uv - vec2(0.3 + t * 0.04, 0.5));
  float blink = step(0.5, fract(t * 2.0 + hash(vec2(t, 0.0))));
  vec3 sc = vec3(1.0, 0.84, 0.0) * smoothstep(0.008, 0.004, sc_d) * (0.5 + 0.5 * blink);

  return col + earth + venus + sc;
}

// --- Mode 2: Venus Greenhouse ---
vec3 venus_greenhouse(vec2 uv, float t) {
  // Atmosphere layers
  float surface_y = 0.15;
  float cloud_y = 0.75;

  // Surface glow (460°C)
  float surface_glow = smoothstep(surface_y + 0.05, surface_y, uv.y);
  vec3 surface = vec3(0.8, 0.15, 0.0) * surface_glow * (0.7 + 0.3 * sin(t * 0.5 + uv.x * 10.0));

  // CO2 atmosphere (gradient)
  float atm = smoothstep(surface_y, cloud_y, uv.y);
  vec3 atmosphere = mix(vec3(0.6, 0.15, 0.0), vec3(0.7, 0.6, 0.3), atm) * 0.3;

  // Cloud deck
  float clouds = smoothstep(cloud_y - 0.05, cloud_y + 0.05, uv.y);
  float cloud_pattern = vnoise(vec2(uv.x * 5.0 + t * 0.3, uv.y * 3.0)) * 0.3;
  vec3 cloud_color = vec3(0.9, 0.85, 0.6) * clouds * (0.7 + cloud_pattern);

  // IR radiation arrows (trapped)
  float ir_arrow = sin((uv.y - t * 0.2) * 30.0) * 0.5 + 0.5;
  ir_arrow *= smoothstep(surface_y, cloud_y, uv.y) * smoothstep(cloud_y, surface_y + 0.1, uv.y);
  vec3 ir = vec3(0.8, 0.2, 0.0) * ir_arrow * 0.15;

  // Space above clouds
  float space = smoothstep(cloud_y + 0.05, cloud_y + 0.15, uv.y);
  vec3 space_color = vec3(0.0, 0.0, 0.05) * space;

  return surface + atmosphere + cloud_color + ir + space_color;
}

// --- Mode 3: Cedar Waxwing Flock ---
vec3 waxwing_flock(vec2 uv, float t) {
  vec3 col = vec3(0.05, 0.12, 0.05); // forest background

  // Berry branches
  for (int i = 0; i < 5; i++) {
    vec2 branch = vec2(0.2 + 0.15 * float(i), 0.3 + 0.1 * sin(float(i)));
    float bd = length(uv - branch);
    col += vec3(0.15, 0.25, 0.1) * smoothstep(0.08, 0.02, bd);
    // Berries
    for (int j = 0; j < 3; j++) {
      vec2 berry = branch + vec2(0.02 * float(j), 0.02 * sin(float(j) * 2.0));
      float brd = length(uv - berry);
      col += vec3(0.6, 0.1, 0.1) * smoothstep(0.008, 0.004, brd);
    }
  }

  // Waxwing silhouettes (moving flock)
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    vec2 bird_pos = vec2(
      0.3 + 0.05 * fi + 0.1 * sin(t * 0.8 + fi * 1.5),
      0.6 + 0.05 * cos(t * 0.6 + fi * 2.0)
    );
    float bd = length(uv - bird_pos);
    vec3 bird_col = vec3(0.77, 0.66, 0.51); // waxwing brown
    float mask = step(0.5, hash(vec2(fi, floor(t * 0.5))));
    col += bird_col * smoothstep(0.015, 0.008, bd) * (0.6 + 0.4 * mask);

    // Yellow tail tip
    vec2 tail = bird_pos + vec2(-0.01, -0.005);
    float td = length(uv - tail);
    col += vec3(0.94, 0.88, 0.38) * smoothstep(0.006, 0.003, td);
  }

  return col;
}

// --- Main ---
void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float t = iTime;
  float cycle = mod(t, 60.0);
  float mode_t = mod(cycle, 15.0);

  vec3 col;
  if (cycle < 15.0)      col = cedar_rings(uv, mode_t);
  else if (cycle < 30.0) col = mariner_cruise(uv, mode_t);
  else if (cycle < 45.0) col = venus_greenhouse(uv, mode_t);
  else                    col = waxwing_flock(uv, mode_t);

  // Mode transitions (1-second crossfade)
  float fade_in = smoothstep(0.0, 1.0, mode_t);
  float fade_out = smoothstep(14.0, 15.0, mode_t);
  col *= fade_in * (1.0 - fade_out * 0.5);

  fragColor = vec4(col, 1.0);
}
