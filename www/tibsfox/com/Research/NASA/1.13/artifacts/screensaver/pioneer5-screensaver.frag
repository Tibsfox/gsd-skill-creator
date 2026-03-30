#version 330 core

// Pioneer 5 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Signal fading into distance — expanding circles getting dimmer,
//           representing Pioneer 5's 5W signal propagating through space
//   Mode 1: Solar system — Sun, Earth, Venus orbits, Pioneer 5's path
//           between them in heliocentric orbit (0.806 × 0.995 AU)
//   Mode 2: Breadcrumb sponge — encrusting patterns with pore channels,
//           the filter feeder extracting signal from noise
//   Mode 3: Hitchhiker's Guide "DON'T PANIC" tribute — glowing text
//           floating in space, Douglas Adams dedication
//
// Color palette: Deep Space / Signal / Solar / Sponge / Venus
//   Deep space:    #020210 (the void between worlds)
//   Signal blue:   #2060CC (Pioneer 5's carrier wave)
//   Solar gold:    #E8D060 (the Sun, energy, warmth)
//   Sponge orange: #CC8830 (Halichondria panicea, breadcrumb)
//   Venus cream:   #E8D8B0 (the cloud-veiled planet)
//
// Compile: glslangValidator pioneer5-screensaver.frag
// Run:     glslViewer pioneer5-screensaver.frag
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
const vec3 DEEP_SPACE    = vec3(0.008, 0.008, 0.063);   // #020210
const vec3 SIGNAL_BLUE   = vec3(0.125, 0.376, 0.800);   // #2060CC
const vec3 SOLAR_GOLD    = vec3(0.910, 0.816, 0.376);   // #E8D060
const vec3 SPONGE_ORANGE = vec3(0.800, 0.533, 0.188);   // #CC8830
const vec3 VENUS_CREAM   = vec3(0.910, 0.847, 0.690);   // #E8D8B0
const vec3 STAR_WHITE    = vec3(0.900, 0.920, 0.950);

// ============================================================
// Mode 0: Signal Fading Into Distance
// ============================================================
// Expanding concentric rings radiating from a central point (Pioneer 5).
// Each ring represents a wavefront of the 5W signal. As rings expand,
// they dim following 1/r² — the inverse-square law made visible.
// The innermost rings are bright signal blue; outer rings fade to nothing.

vec4 signalFading(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  // Stars
  for (int i = 0; i < 80; i++) {
    vec2 sp = vec2(hash(vec2(float(i), 1.0)), hash(vec2(1.0, float(i))));
    sp = sp * 2.0 - 1.0;
    float brightness = hash(vec2(float(i) * 3.7, 2.1));
    float twinkle = 0.7 + 0.3 * sin(t * (1.0 + brightness * 3.0) + float(i));
    float sd = length(uv - sp);
    col += STAR_WHITE * brightness * twinkle * 0.015 / (sd * sd + 0.001);
  }

  // Pioneer 5 — the source point, drifting slowly rightward (away from Earth)
  vec2 source = vec2(-0.3 + t * 0.05, 0.0);

  float dist = length(uv - source);

  // Expanding rings — each ring is a wavefront
  float ring_speed = 0.4;
  float num_rings = 12.0;
  for (float i = 0.0; i < num_rings; i++) {
    float ring_radius = mod(t * ring_speed + i * 0.15, 2.5);
    float ring_dist = abs(dist - ring_radius);
    // Ring brightness follows 1/r²
    float ring_brightness = 1.0 / (1.0 + ring_radius * ring_radius * 4.0);
    // Ring width narrows with distance
    float ring_width = 0.005 + 0.002 * ring_radius;
    float ring = smoothstep(ring_width, 0.0, ring_dist) * ring_brightness;
    col += SIGNAL_BLUE * ring * 0.8;
  }

  // Central glow — the transmitter
  float glow = 0.04 / (dist * dist + 0.01);
  col += SIGNAL_BLUE * glow * 0.3;

  // Small Pioneer 5 representation
  float probe_dist = length(uv - source);
  if (probe_dist < 0.015) {
    col = mix(col, SOLAR_GOLD, smoothstep(0.015, 0.005, probe_dist));
  }

  // "Earth" on the left edge — a blue dot where the signal is received
  vec2 earth_pos = vec2(-0.85, 0.0);
  float earth_dist = length(uv - earth_pos);
  float earth = smoothstep(0.04, 0.03, earth_dist);
  col = mix(col, vec3(0.1, 0.3, 0.8), earth * 0.6);

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Solar System — Pioneer 5's Heliocentric Orbit
// ============================================================
// Top-down view: Sun at center, Earth orbit (1 AU), Venus orbit (0.723 AU).
// Pioneer 5's elliptical heliocentric orbit (0.806 × 0.995 AU) shown
// as a bright arc between Earth and Venus.

vec4 solarSystem(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  // Stars background
  for (int i = 0; i < 60; i++) {
    vec2 sp = vec2(hash(vec2(float(i), 7.0)), hash(vec2(7.0, float(i))));
    sp = sp * 2.0 - 1.0;
    float sd = length(uv - sp);
    float b = hash(vec2(float(i) * 2.3, 5.1));
    col += STAR_WHITE * b * 0.008 / (sd * sd + 0.001);
  }

  // Sun at center
  float sun_dist = length(uv);
  float sun = smoothstep(0.06, 0.03, sun_dist);
  col = mix(col, SOLAR_GOLD, sun);
  col += SOLAR_GOLD * 0.02 / (sun_dist + 0.01);  // corona

  // Orbital scale: 1 AU = 0.6 screen units
  float au_scale = 0.6;

  // Venus orbit (0.723 AU)
  float venus_r = 0.723 * au_scale;
  float venus_orbit_dist = abs(length(uv) - venus_r);
  col += VENUS_CREAM * 0.15 * smoothstep(0.003, 0.0, venus_orbit_dist);

  // Earth orbit (1.0 AU)
  float earth_r = 1.0 * au_scale;
  float earth_orbit_dist = abs(length(uv) - earth_r);
  col += SIGNAL_BLUE * 0.2 * smoothstep(0.003, 0.0, earth_orbit_dist);

  // Venus position (orbits in ~225 days)
  float venus_angle = t * 0.15 + 1.5;
  vec2 venus_pos = venus_r * vec2(cos(venus_angle), sin(venus_angle));
  float venus_dist = length(uv - venus_pos);
  col = mix(col, VENUS_CREAM, smoothstep(0.025, 0.015, venus_dist));

  // Earth position
  float earth_angle = t * 0.1;
  vec2 earth_pos = earth_r * vec2(cos(earth_angle), sin(earth_angle));
  float earth_d = length(uv - earth_pos);
  col = mix(col, vec3(0.15, 0.4, 0.9), smoothstep(0.02, 0.01, earth_d));

  // Pioneer 5 orbit (0.806 AU perihelion, 0.995 AU aphelion)
  // Semi-major axis = (0.806 + 0.995)/2 = 0.9005 AU
  // Eccentricity = (0.995 - 0.806)/(0.995 + 0.806) = 0.105
  float p5_a = 0.9005 * au_scale;
  float p5_e = 0.105;
  float p5_angle = t * 0.12 + 0.3;

  // Draw orbit path
  for (float a = 0.0; a < 6.283; a += 0.02) {
    float r = p5_a * (1.0 - p5_e * p5_e) / (1.0 + p5_e * cos(a));
    vec2 op = r * vec2(cos(a + 0.8), sin(a + 0.8));
    float od = length(uv - op);
    col += SPONGE_ORANGE * 0.08 * smoothstep(0.004, 0.0, od);
  }

  // Pioneer 5 position
  float p5_r = p5_a * (1.0 - p5_e * p5_e) / (1.0 + p5_e * cos(p5_angle));
  vec2 p5_pos = p5_r * vec2(cos(p5_angle + 0.8), sin(p5_angle + 0.8));
  float p5_dist = length(uv - p5_pos);
  col = mix(col, SOLAR_GOLD, smoothstep(0.012, 0.005, p5_dist));

  // Signal line from Pioneer 5 to Earth (fading with distance)
  vec2 p5_to_earth = earth_pos - p5_pos;
  float line_len = length(p5_to_earth);
  vec2 line_dir = p5_to_earth / line_len;
  vec2 to_pixel = uv - p5_pos;
  float along = dot(to_pixel, line_dir);
  float perp = abs(dot(to_pixel, vec2(-line_dir.y, line_dir.x)));
  if (along > 0.0 && along < line_len) {
    float fade = 1.0 - along / line_len;
    float signal_line = smoothstep(0.003, 0.0, perp) * fade * 0.3;
    // Dashed line effect
    signal_line *= step(0.5, fract(along * 40.0 - t * 2.0));
    col += SIGNAL_BLUE * signal_line;
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Breadcrumb Sponge — Halichondria panicea
// ============================================================
// Encrusting growth pattern with visible osculum (excurrent pores)
// and ostia (incurrent pores). The sponge filters water, extracting
// nutrients — signal from noise. Channels visible within the body.

vec4 breadcrumbSponge(vec2 uv, float t) {
  vec3 col = DEEP_SPACE * 2.0;  // slightly lighter for underwater

  // Underwater ambient — deep blue-green
  vec3 water = vec3(0.02, 0.06, 0.10);
  col = mix(col, water, 0.5);

  // Caustics — light patterns on seafloor
  float caustic1 = fbm(uv * 3.0 + t * 0.1);
  float caustic2 = fbm(uv * 3.0 - t * 0.08 + 5.0);
  float caustic = caustic1 * caustic2;
  col += vec3(0.05, 0.08, 0.12) * caustic;

  // Sponge body — irregular encrusting shape
  // Use FBM to create organic, lumpy outline
  vec2 sponge_center = vec2(0.0, -0.1);
  float sponge_dist = length(uv - sponge_center);
  float sponge_angle = atan(uv.y - sponge_center.y, uv.x - sponge_center.x);
  float sponge_edge = 0.5 + 0.15 * fbm(vec2(sponge_angle * 2.0 + t * 0.02, 0.0));

  // FBM for edge roughness (use angle-based)
  float angle = atan(uv.y - sponge_center.y, uv.x - sponge_center.x);
  float edge_noise = 0.12 * fbm(vec2(angle * 3.0, t * 0.05));
  float sponge_boundary = 0.45 + edge_noise;

  float in_sponge = smoothstep(sponge_boundary + 0.02, sponge_boundary - 0.02, sponge_dist);

  // Sponge texture — breadcrumb-like: rough, granular, orange-brown
  float grain = fbm(uv * 15.0 + t * 0.01);
  float fine_grain = vnoise(uv * 40.0);
  vec3 sponge_color = mix(SPONGE_ORANGE, SPONGE_ORANGE * 0.6, grain);
  sponge_color = mix(sponge_color, SPONGE_ORANGE * 1.2, fine_grain * 0.3);

  col = mix(col, sponge_color, in_sponge * 0.8);

  // Osculum — large excurrent openings (2-4 visible)
  for (int i = 0; i < 4; i++) {
    float oa = float(i) * 1.57 + 0.5;
    float or_dist = 0.15 + 0.05 * float(i);
    vec2 osc_pos = sponge_center + or_dist * vec2(cos(oa), sin(oa));
    float osc_dist = length(uv - osc_pos);
    float osc_size = 0.025 + 0.01 * sin(t * 0.5 + float(i));

    // Dark opening
    float osculum = smoothstep(osc_size + 0.005, osc_size - 0.005, osc_dist);
    col = mix(col, vec3(0.02, 0.03, 0.05), osculum * in_sponge * 0.8);

    // Water flow from osculum — animated particles going outward
    vec2 flow_dir = normalize(osc_pos - sponge_center);
    for (float j = 0.0; j < 5.0; j++) {
      float flow_t = fract(t * 0.3 + j * 0.2);
      vec2 particle = osc_pos + flow_dir * flow_t * 0.15;
      float pd = length(uv - particle);
      float particle_size = 0.004 * (1.0 - flow_t);
      col += vec3(0.1, 0.15, 0.2) * smoothstep(particle_size, 0.0, pd) * (1.0 - flow_t);
    }
  }

  // Ostia — many tiny incurrent pores across the surface
  for (int i = 0; i < 30; i++) {
    vec2 op = sponge_center + (vec2(hash(vec2(float(i), 3.0)),
      hash(vec2(3.0, float(i)))) - 0.5) * 0.7;
    float od = length(uv - op);
    float pore = smoothstep(0.006, 0.003, od);
    col = mix(col, vec3(0.04, 0.05, 0.06), pore * in_sponge * 0.5);
  }

  // Internal channels — visible through translucent body
  float channel1 = abs(sin(uv.x * 20.0 + uv.y * 8.0 + t * 0.1));
  float channel2 = abs(sin(uv.x * 8.0 - uv.y * 15.0 + t * 0.08));
  float channels = smoothstep(0.95, 1.0, channel1) + smoothstep(0.95, 1.0, channel2);
  col = mix(col, col * 0.6, channels * in_sponge * 0.3);

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: DON'T PANIC — Douglas Adams Tribute
// ============================================================
// Large friendly letters floating in the vastness of space.
// The words "DON'T PANIC" glow warmly against the cosmic void.
// Stars drift by. Occasionally a small "42" appears.

// Simple segment-based character rendering
float segment(vec2 p, vec2 a, vec2 b, float w) {
  vec2 ab = b - a;
  vec2 ap = p - a;
  float t_seg = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
  float d = length(ap - ab * t_seg);
  return smoothstep(w, w * 0.3, d);
}

float charD(vec2 p, float s) {
  float d = 0.0;
  d += segment(p, vec2(0,0)*s, vec2(0,1)*s, 0.02*s);
  d += segment(p, vec2(0,1)*s, vec2(0.3,1)*s, 0.02*s);
  d += segment(p, vec2(0.3,1)*s, vec2(0.5,0.7)*s, 0.02*s);
  d += segment(p, vec2(0.5,0.7)*s, vec2(0.5,0.3)*s, 0.02*s);
  d += segment(p, vec2(0.5,0.3)*s, vec2(0.3,0)*s, 0.02*s);
  d += segment(p, vec2(0.3,0)*s, vec2(0,0)*s, 0.02*s);
  return clamp(d, 0.0, 1.0);
}

float charO(vec2 p, float s) {
  float d = length(p - vec2(0.25, 0.5) * s) - 0.35 * s;
  float inner = length(p - vec2(0.25, 0.5) * s) - 0.28 * s;
  return smoothstep(0.02*s, 0.0, abs(d)) * 0.8;
}

float charN(vec2 p, float s) {
  float d = 0.0;
  d += segment(p, vec2(0,0)*s, vec2(0,1)*s, 0.02*s);
  d += segment(p, vec2(0,1)*s, vec2(0.5,0)*s, 0.02*s);
  d += segment(p, vec2(0.5,0)*s, vec2(0.5,1)*s, 0.02*s);
  return clamp(d, 0.0, 1.0);
}

float charT(vec2 p, float s) {
  float d = 0.0;
  d += segment(p, vec2(0,1)*s, vec2(0.5,1)*s, 0.02*s);
  d += segment(p, vec2(0.25,0)*s, vec2(0.25,1)*s, 0.02*s);
  return clamp(d, 0.0, 1.0);
}

float charP(vec2 p, float s) {
  float d = 0.0;
  d += segment(p, vec2(0,0)*s, vec2(0,1)*s, 0.02*s);
  d += segment(p, vec2(0,1)*s, vec2(0.4,1)*s, 0.02*s);
  d += segment(p, vec2(0.4,1)*s, vec2(0.4,0.5)*s, 0.02*s);
  d += segment(p, vec2(0.4,0.5)*s, vec2(0,0.5)*s, 0.02*s);
  return clamp(d, 0.0, 1.0);
}

float charA(vec2 p, float s) {
  float d = 0.0;
  d += segment(p, vec2(0,0)*s, vec2(0.25,1)*s, 0.02*s);
  d += segment(p, vec2(0.25,1)*s, vec2(0.5,0)*s, 0.02*s);
  d += segment(p, vec2(0.1,0.4)*s, vec2(0.4,0.4)*s, 0.02*s);
  return clamp(d, 0.0, 1.0);
}

float charI(vec2 p, float s) {
  float d = 0.0;
  d += segment(p, vec2(0.1,0)*s, vec2(0.4,0)*s, 0.02*s);
  d += segment(p, vec2(0.25,0)*s, vec2(0.25,1)*s, 0.02*s);
  d += segment(p, vec2(0.1,1)*s, vec2(0.4,1)*s, 0.02*s);
  return clamp(d, 0.0, 1.0);
}

float charC(vec2 p, float s) {
  float d = 0.0;
  d += segment(p, vec2(0.5,0.8)*s, vec2(0.2,1)*s, 0.02*s);
  d += segment(p, vec2(0.2,1)*s, vec2(0,0.7)*s, 0.02*s);
  d += segment(p, vec2(0,0.7)*s, vec2(0,0.3)*s, 0.02*s);
  d += segment(p, vec2(0,0.3)*s, vec2(0.2,0)*s, 0.02*s);
  d += segment(p, vec2(0.2,0)*s, vec2(0.5,0.2)*s, 0.02*s);
  return clamp(d, 0.0, 1.0);
}

float charApostrophe(vec2 p, float s) {
  return segment(p, vec2(0.15,0.8)*s, vec2(0.1,1.0)*s, 0.015*s);
}

vec4 dontPanic(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  // Drifting star field
  for (int i = 0; i < 100; i++) {
    vec2 sp = vec2(hash(vec2(float(i), 9.0)), hash(vec2(9.0, float(i))));
    sp = sp * 2.0 - 1.0;
    sp.x = mod(sp.x - t * 0.01 * (0.5 + hash(vec2(float(i), 11.0))), 2.0) - 1.0;
    float sd = length(uv - sp);
    float b = hash(vec2(float(i) * 4.1, 3.3));
    col += STAR_WHITE * b * 0.008 / (sd * sd + 0.0008);
  }

  // "DON'T PANIC" — large friendly letters
  float text_scale = 0.12;
  float text_y = 0.0;
  float glow_pulse = 0.8 + 0.2 * sin(t * 0.5);

  // Letter positions (centered)
  float total_width = 6.5 * text_scale;
  float start_x = -total_width * 0.5;
  float spacing = 0.65 * text_scale;

  float text = 0.0;
  // D
  text += charD(uv - vec2(start_x, text_y), text_scale);
  // O
  text += charO(uv - vec2(start_x + spacing, text_y), text_scale);
  // N
  text += charN(uv - vec2(start_x + spacing * 2.0, text_y), text_scale);
  // '
  text += charApostrophe(uv - vec2(start_x + spacing * 3.0, text_y), text_scale);
  // T
  text += charT(uv - vec2(start_x + spacing * 3.3, text_y), text_scale);
  // (space)
  // P
  text += charP(uv - vec2(start_x + spacing * 4.8, text_y), text_scale);
  // A
  text += charA(uv - vec2(start_x + spacing * 5.8, text_y), text_scale);
  // N
  text += charN(uv - vec2(start_x + spacing * 6.8, text_y), text_scale);
  // I
  text += charI(uv - vec2(start_x + spacing * 7.8, text_y), text_scale);
  // C
  text += charC(uv - vec2(start_x + spacing * 8.5, text_y), text_scale);

  text = clamp(text, 0.0, 1.0);

  // Warm glow around text
  vec3 text_color = mix(SOLAR_GOLD, VENUS_CREAM, 0.3) * glow_pulse;
  col = mix(col, text_color, text * 0.9);

  // Soft glow halo
  float halo_x = uv.x;
  float halo_y = uv.y - text_y;
  float halo = exp(-(halo_x * halo_x * 2.0 + halo_y * halo_y * 8.0));
  col += SOLAR_GOLD * halo * 0.05 * glow_pulse;

  // Occasional "42" floating by
  float forty_two_t = mod(t * 0.1, 1.0);
  float forty_two_x = 1.2 - forty_two_t * 2.4;
  float forty_two_y = -0.4 + 0.1 * sin(t * 0.3);
  float forty_two_alpha = sin(forty_two_t * 3.14159) * 0.3;
  // Simple "42" as two dots
  float d4 = length(uv - vec2(forty_two_x, forty_two_y));
  float d2 = length(uv - vec2(forty_two_x + 0.04, forty_two_y));
  col += SIGNAL_BLUE * forty_two_alpha * (smoothstep(0.015, 0.005, d4) + smoothstep(0.015, 0.005, d2));

  return vec4(col, 1.0);
}

// ============================================================
// Main — mode cycling
// ============================================================

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
  float t = iTime;

  // 60-second cycle, 4 modes × 15 seconds each
  float cycle = mod(t, 60.0);
  int mode = int(cycle / 15.0);

  // Cross-fade between modes (1 second transition)
  float mode_t = mod(cycle, 15.0);
  float fade_in = smoothstep(0.0, 1.0, mode_t);
  float fade_out = smoothstep(14.0, 15.0, mode_t);

  vec4 current_col;
  vec4 next_col;

  if (mode == 0) {
    current_col = signalFading(uv, t);
    next_col = solarSystem(uv, t);
  } else if (mode == 1) {
    current_col = solarSystem(uv, t);
    next_col = breadcrumbSponge(uv, t);
  } else if (mode == 2) {
    current_col = breadcrumbSponge(uv, t);
    next_col = dontPanic(uv, t);
  } else {
    current_col = dontPanic(uv, t);
    next_col = signalFading(uv, t);
  }

  fragColor = mix(current_col, next_col, fade_out);
}
