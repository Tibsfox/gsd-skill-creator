#version 330 core

// TIROS-1 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Earth from orbit with swirling cloud patterns below,
//           camera scan line sweeping across — TIROS-1's view
//   Mode 1: Vidicon camera — phosphor-green scan building up a
//           cloud image line by line, vintage TV aesthetic
//   Mode 2: Moon jellyfish — translucent pulsing bells in dark
//           water, Aurelia aurita bioluminescent drift
//   Mode 3: Rachmaninoff — flowing piano-key patterns, wave forms
//           rendered as musical notation, storm crescendo
//
// Color palette: Cloud White / Sky Blue / Storm Gray /
//                Jelly Translucent / Ocean Dark
//   Cloud white:        #E8E8F0 (bright cloud tops)
//   Sky blue:           #4080CC (clear atmosphere)
//   Storm gray:         #606878 (storm systems)
//   Jelly translucent:  #C0D0E0 (moon jellyfish bell)
//   Ocean dark:         #081828 (deep ocean background)
//
// Compile: glslangValidator tiros1-screensaver.frag
// Run:     glslViewer tiros1-screensaver.frag
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

float fbm7(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 7; i++) {
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
const vec3 CLOUD_WHITE     = vec3(0.910, 0.910, 0.941);   // #E8E8F0
const vec3 SKY_BLUE        = vec3(0.251, 0.502, 0.800);   // #4080CC
const vec3 STORM_GRAY      = vec3(0.376, 0.408, 0.471);   // #606878
const vec3 JELLY_TRANS     = vec3(0.753, 0.816, 0.878);   // #C0D0E0
const vec3 OCEAN_DARK      = vec3(0.031, 0.094, 0.157);   // #081828
const vec3 PHOSPHOR_GREEN  = vec3(0.200, 0.900, 0.300);
const vec3 DEEP_SPACE      = vec3(0.008, 0.008, 0.040);

// ============================================================
// Mode 0: Earth from Orbit — Swirling Clouds, Camera Scan
// ============================================================
// TIROS-1's view looking down at Earth. Procedural cloud patterns
// swirl across the curved planetary surface. A scan line sweeps
// across representing the vidicon camera capturing one frame.

vec4 earthFromOrbit(vec2 uv, float t) {
  // Earth fills most of the view from 700 km
  vec3 col = OCEAN_DARK;

  // Earth disc — curved limb
  float earth_dist = length(uv);
  float earth_radius = 0.85;

  if (earth_dist < earth_radius) {
    // Spherical distortion: compress toward edges
    vec2 sphere_uv = uv / earth_radius;
    float nz = sqrt(max(0.0, 1.0 - dot(sphere_uv, sphere_uv)));

    // Ground: ocean with some land masses
    float land = fbm(sphere_uv * 3.0 + vec2(1.5, 0.7));
    vec3 surface = mix(OCEAN_DARK * 1.5, vec3(0.15, 0.20, 0.10), smoothstep(0.48, 0.55, land));

    // Cloud systems — multiple layers of fbm
    vec2 cloud_uv = sphere_uv * 2.5 + t * 0.02;
    float clouds1 = fbm7(cloud_uv);
    float clouds2 = fbm7(cloud_uv * 1.3 + vec2(3.0, 1.5) + t * 0.015);

    // Cyclone vortex — rotating spiral pattern
    vec2 vortex_center = vec2(0.2, -0.15);
    vec2 vc = sphere_uv - vortex_center;
    float vr = length(vc);
    float va = atan(vc.y, vc.x) + 3.0 * exp(-vr * 4.0) + t * 0.3;
    float spiral = fbm(vec2(va * 2.0, vr * 8.0));
    float vortex_mask = smoothstep(0.4, 0.1, vr);
    float vortex_cloud = spiral * vortex_mask;

    // Combine cloud layers
    float total_cloud = max(clouds1, max(clouds2 * 0.8, vortex_cloud));
    float cloud_mask = smoothstep(0.4, 0.7, total_cloud);

    // Cloud color: white tops, gray bottoms (shadow)
    vec3 cloud_col = mix(STORM_GRAY, CLOUD_WHITE, smoothstep(0.5, 0.8, total_cloud));

    // Apply clouds over surface
    surface = mix(surface, cloud_col, cloud_mask * 0.9);

    // Atmospheric limb darkening
    float limb = pow(nz, 0.4);
    surface *= 0.3 + 0.7 * limb;

    // Thin blue atmosphere at limb
    float atm = smoothstep(earth_radius, earth_radius - 0.06, earth_dist)
              * smoothstep(earth_radius - 0.08, earth_radius - 0.02, earth_dist);
    surface += SKY_BLUE * atm * 0.4;

    col = surface;
  }

  // Atmospheric glow
  float atm_glow = smoothstep(earth_radius + 0.04, earth_radius - 0.02, earth_dist)
                 * smoothstep(earth_radius - 0.05, earth_radius, earth_dist);
  col += SKY_BLUE * atm_glow * 0.3;

  // Camera scan line — horizontal sweep
  float scan_y = mod(t * 0.3, 2.0) - 1.0;
  float scan_dist = abs(uv.y - scan_y);
  float scan = smoothstep(0.008, 0.0, scan_dist) * 0.5;
  col += CLOUD_WHITE * scan * step(earth_dist, earth_radius);

  // Stars above
  if (earth_dist > earth_radius) {
    for (int i = 0; i < 50; i++) {
      vec2 sp = vec2(hash(vec2(float(i), 7.0)), hash(vec2(7.0, float(i))));
      sp = sp * 2.0 - 1.0;
      float brightness = hash(vec2(float(i) * 3.1, 5.3));
      float twinkle = 0.7 + 0.3 * sin(t * (1.0 + brightness * 2.0) + float(i));
      float sd = length(uv - sp);
      col += vec3(0.9, 0.92, 0.95) * brightness * twinkle * 0.008 / (sd * sd + 0.0005);
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Vidicon Camera — Phosphor-Green Scan
// ============================================================
// The vidicon tube builds an image line by line. Phosphor-green
// display, scan lines visible, the image assembles progressively.
// Vintage television aesthetic from 1960.

vec4 vidiconCamera(vec2 uv, float t) {
  vec3 col = vec3(0.01, 0.02, 0.01);  // nearly black with green tint

  // Image area: rectangular viewport
  vec2 img_uv = uv * 1.2;
  if (abs(img_uv.x) < 0.55 && abs(img_uv.y) < 0.45) {
    // Cloud image being scanned
    vec2 cloud_uv = (img_uv + vec2(0.55, 0.45)) / vec2(1.1, 0.9);

    // Generate a cloud image (what TIROS-1 would see)
    float clouds = fbm7(cloud_uv * 4.0 + vec2(t * 0.01, 0.0));
    float land = fbm(cloud_uv * 2.0 + vec2(5.0, 3.0));
    float surface = mix(0.1, 0.25, smoothstep(0.45, 0.55, land));
    float brightness = mix(surface, 0.9, smoothstep(0.4, 0.7, clouds));

    // Cyclone feature
    vec2 cyc = cloud_uv - vec2(0.6, 0.4);
    float cr = length(cyc);
    float ca = atan(cyc.y, cyc.x) + 4.0 * exp(-cr * 5.0);
    float cyc_cloud = fbm(vec2(ca * 2.0, cr * 10.0)) * smoothstep(0.35, 0.05, cr);
    brightness = max(brightness, cyc_cloud);

    // Scan line progress: builds image from top to bottom
    float scan_progress = mod(t * 0.15, 1.0);
    float scan_y = 1.0 - scan_progress;  // top to bottom
    float img_y = (img_uv.y + 0.45) / 0.9;  // 0 at bottom, 1 at top

    // Only show lines that have been scanned
    float scanned = step(scan_y, img_y);

    // Active scan line: brightest
    float active_line = smoothstep(0.005, 0.0, abs(img_y - scan_y));

    // Individual scan lines (525 line analog TV standard)
    float line_num = floor(img_y * 500.0);
    float line_phase = fract(img_y * 500.0);
    float scanline = smoothstep(0.3, 0.5, line_phase) * smoothstep(0.9, 0.7, line_phase);

    // Compose the phosphor image
    float pixel = brightness * scanned * scanline;

    // Phosphor green color with brightness variation
    col = PHOSPHOR_GREEN * pixel * 0.7;

    // Active scan line glow
    col += PHOSPHOR_GREEN * active_line * 0.8;

    // Noise: static and interference
    float noise = hash(vec2(img_uv.x * 100.0 + t * 1000.0, line_num)) * 0.05;
    col += PHOSPHOR_GREEN * noise * scanned;

    // Phosphor persistence: recently scanned lines slightly brighter
    float persistence = smoothstep(0.0, 0.1, img_y - scan_y) *
                       smoothstep(0.15, 0.05, img_y - scan_y);
    col += PHOSPHOR_GREEN * persistence * 0.15 * brightness;
  }

  // CRT bezel: dark border
  float bezel_x = smoothstep(0.55, 0.52, abs(img_uv.x));
  float bezel_y = smoothstep(0.45, 0.42, abs(img_uv.y));
  float bezel = bezel_x * bezel_y;
  col *= bezel;

  // Frame border glow
  float frame = smoothstep(0.57, 0.54, abs(img_uv.x)) *
                smoothstep(0.47, 0.44, abs(img_uv.y));
  float border_glow = frame * (1.0 - bezel);
  col += PHOSPHOR_GREEN * border_glow * 0.1;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Moon Jellyfish — Translucent Pulsing Bells
// ============================================================
// Aurelia aurita — translucent bells pulsing in dark water.
// Multiple jellyfish at different depths, their bells contracting
// rhythmically. Bioluminescent edges. Gentle current.

vec4 moonJellyfish(vec2 uv, float t) {
  // Deep ocean background
  vec3 col = mix(OCEAN_DARK, OCEAN_DARK * 0.5, uv.y * 0.3 + 0.5);

  // Underwater particles / plankton
  for (int i = 0; i < 30; i++) {
    vec2 pp = vec2(hash(vec2(float(i), 3.0)), hash(vec2(3.0, float(i))));
    pp = pp * 2.0 - 1.0;
    pp.y += t * 0.01 * (0.5 + hash(vec2(float(i), 9.0)));
    pp.y = mod(pp.y + 1.0, 2.0) - 1.0;
    pp.x += sin(t * 0.3 + float(i)) * 0.02;
    float pd = length(uv - pp);
    float brightness = hash(vec2(float(i) * 2.7, 4.1)) * 0.3;
    col += JELLY_TRANS * brightness * 0.003 / (pd * pd + 0.0003);
  }

  // Draw multiple jellyfish
  for (int j = 0; j < 4; j++) {
    // Position: distributed across frame
    float jf = float(j);
    vec2 jelly_pos = vec2(
      -0.5 + jf * 0.35 + 0.1 * sin(t * 0.2 + jf * 1.5),
      -0.2 + 0.15 * sin(t * 0.15 + jf * 2.0) + jf * 0.1 - 0.15
    );

    float jelly_size = 0.12 + 0.03 * sin(jf * 1.7);

    // Pulsing: bell contracts and expands
    float pulse_rate = 0.4 + 0.1 * jf;
    float pulse = 0.85 + 0.15 * sin(t * pulse_rate * 6.28 + jf * 1.0);

    // Bell shape: dome on top, tentacles below
    vec2 jc = uv - jelly_pos;
    jc.x /= pulse;  // wider when relaxed, narrower when contracting

    // Bell dome (upper part)
    float bell_dist = length(jc * vec2(1.0, 1.5));
    float bell = smoothstep(jelly_size, jelly_size - 0.02, bell_dist);
    float in_bell = step(jc.y, jelly_size * 0.3);  // only upper portion is bell

    if (bell > 0.0 && in_bell > 0.5) {
      // Translucent bell material
      float translucency = 1.0 - bell_dist / jelly_size;
      vec3 bell_col = mix(OCEAN_DARK * 1.5, JELLY_TRANS, translucency * 0.6);

      // Four-lobed gonad pattern (characteristic of Aurelia)
      float angle = atan(jc.y, jc.x);
      float gonad = 0.5 + 0.5 * sin(angle * 4.0);
      float gonad_ring = smoothstep(0.3, 0.5, bell_dist / jelly_size) *
                        smoothstep(0.7, 0.5, bell_dist / jelly_size);
      bell_col += vec3(0.6, 0.5, 0.7) * gonad * gonad_ring * 0.3;

      // Edge glow — bell margin
      float edge = smoothstep(jelly_size - 0.01, jelly_size - 0.03, bell_dist)
                 * smoothstep(jelly_size - 0.04, jelly_size - 0.02, bell_dist);
      bell_col += CLOUD_WHITE * edge * 0.3;

      // Radial lines (radial canals)
      float radial = abs(sin(angle * 8.0));
      float radial_line = smoothstep(0.98, 1.0, radial);
      bell_col += JELLY_TRANS * radial_line * 0.1;

      col = mix(col, bell_col, bell * 0.7);
    }

    // Oral arms and tentacles (below bell)
    for (int arm = 0; arm < 4; arm++) {
      float arm_x = jelly_pos.x + (float(arm) - 1.5) * 0.02 * pulse;
      for (float y = jelly_pos.y - jelly_size * 0.3; y > jelly_pos.y - jelly_size * 1.8; y -= 0.004) {
        float depth = (jelly_pos.y - jelly_size * 0.3 - y) / (jelly_size * 1.5);
        float sway = sin(y * 15.0 + t * 1.0 + float(arm) * 1.5) * 0.015 * depth;
        vec2 tp = vec2(arm_x + sway, y);
        float td = length(uv - tp);
        float thickness = 0.003 * (1.0 - depth * 0.7);
        if (thickness > 0.0005) {
          float tent = smoothstep(thickness, thickness * 0.3, td);
          col = mix(col, JELLY_TRANS * 0.5, tent * 0.4);
        }
      }
    }
  }

  // Gentle current: caustic-like light patterns from above
  float caustic = fbm(uv * 3.0 + vec2(t * 0.05, t * 0.02));
  col += SKY_BLUE * smoothstep(0.55, 0.7, caustic) * 0.06;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Rachmaninoff — Piano Keys and Storm Waveforms
// ============================================================
// Flowing piano-key-like patterns across the screen. Waveforms
// rendered as musical notation. The visual equivalent of a
// Rachmaninoff orchestral crescendo — building from quiet
// ripples to overwhelming waves.

vec4 rachmaninoffStorm(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  // Phase within the crescendo: builds over 15 seconds
  float phase = mod(t, 15.0) / 15.0;
  float intensity = smoothstep(0.0, 0.7, phase);  // builds to fortissimo
  float resolution = smoothstep(0.8, 1.0, phase);  // resolves at end

  // Piano keys — vertical bars across the bottom
  float key_y = -0.3;
  float key_height = 0.15 + 0.1 * intensity;
  if (uv.y < key_y + key_height && uv.y > key_y) {
    float key_x = uv.x * 14.0;  // 28 keys across
    float key_num = floor(key_x + 14.0);
    float key_frac = fract(key_x + 14.0);

    // White keys
    float white_key = smoothstep(0.05, 0.08, key_frac) * smoothstep(0.95, 0.92, key_frac);
    float key_brightness = 0.15 + 0.1 * intensity;

    // Active keys light up in sequence (arpeggios)
    float active_key = sin(key_num * 0.5 + t * 3.0 * (0.5 + intensity)) * 0.5 + 0.5;
    active_key *= intensity;
    key_brightness += active_key * 0.4;

    col += CLOUD_WHITE * white_key * key_brightness;

    // Black keys (sharps/flats)
    float is_black = step(0.5, mod(key_num, 7.0)) * step(mod(key_num, 7.0), 5.5);
    is_black *= step(0.3, key_frac) * step(key_frac, 0.7);
    float black_y = step(key_y + key_height * 0.4, uv.y);
    if (is_black > 0.5 && black_y > 0.5) {
      col = mix(col, STORM_GRAY * 0.3, 0.8);
    }
  }

  // Waveforms — musical phrases rendered as oscillating lines
  for (int w = 0; w < 5; w++) {
    float wf = float(w);
    float wave_y = -0.1 + wf * 0.15;
    float freq = 2.0 + wf * 1.5;
    float amp = (0.02 + 0.03 * intensity) * (1.0 - wf * 0.1);

    // Waveform with harmonic content (like a piano string)
    float wave = sin(uv.x * freq * 6.28 - t * (2.0 + intensity * 3.0) + wf) * amp;
    wave += sin(uv.x * freq * 2.0 * 6.28 - t * 4.0 + wf * 2.0) * amp * 0.3;
    wave += sin(uv.x * freq * 3.0 * 6.28 - t * 6.0 + wf * 3.0) * amp * 0.15;

    // Storm modulation: waves get turbulent at climax
    float turbulence = fbm(vec2(uv.x * 3.0 + t * 0.5, wf + t * 0.1)) * intensity * 0.03;
    wave += turbulence;

    float wave_dist = abs(uv.y - wave_y - wave);
    float wave_line = smoothstep(0.004, 0.0, wave_dist);

    // Color: blue for quiet phrases, white for loud, gray for resolution
    vec3 wave_col = mix(SKY_BLUE, CLOUD_WHITE, intensity);
    wave_col = mix(wave_col, STORM_GRAY, resolution);

    col += wave_col * wave_line * (0.3 + 0.4 * intensity) * (1.0 - resolution * 0.5);
  }

  // Staff lines (musical notation reference)
  for (int s = 0; s < 5; s++) {
    float staff_y = -0.1 + float(s) * 0.15;
    float staff_line = smoothstep(0.002, 0.0, abs(uv.y - staff_y));
    col += STORM_GRAY * staff_line * 0.08;
  }

  // Storm clouds building at the top (the crescendo made visual)
  float storm_y = 0.3 + 0.2 * (1.0 - intensity);
  if (uv.y > storm_y) {
    float storm_uv_y = (uv.y - storm_y) / (1.0 - storm_y);
    float storm = fbm7(vec2(uv.x * 3.0 + t * 0.1, storm_uv_y * 2.0 + t * 0.05));
    float storm_mask = smoothstep(0.0, 0.3, storm_uv_y) * intensity;
    vec3 storm_col = mix(STORM_GRAY, CLOUD_WHITE, storm * 0.5);
    col = mix(col, storm_col, storm_mask * storm * 0.6);
  }

  // Lightning flash at the climax (sforzando)
  float climax = smoothstep(0.65, 0.7, phase) * smoothstep(0.75, 0.7, phase);
  float flash = pow(hash(vec2(floor(t * 8.0), 0.0)), 12.0) * climax;
  col += CLOUD_WHITE * flash * 0.5;

  // Resolution: everything calms, gentle glow
  col += JELLY_TRANS * resolution * 0.05;

  return vec4(col, 1.0);
}

// ============================================================
// Main — mode cycling
// ============================================================

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
  float t = iTime;

  // 60-second cycle, 4 modes x 15 seconds each
  float cycle = mod(t, 60.0);
  int mode = int(cycle / 15.0);

  // Cross-fade between modes (1 second transition)
  float mode_t = mod(cycle, 15.0);
  float fade_out = smoothstep(14.0, 15.0, mode_t);

  vec4 current_col;
  vec4 next_col;

  if (mode == 0) {
    current_col = earthFromOrbit(uv, t);
    next_col = vidiconCamera(uv, t);
  } else if (mode == 1) {
    current_col = vidiconCamera(uv, t);
    next_col = moonJellyfish(uv, t);
  } else if (mode == 2) {
    current_col = moonJellyfish(uv, t);
    next_col = rachmaninoffStorm(uv, t);
  } else {
    current_col = rachmaninoffStorm(uv, t);
    next_col = earthFromOrbit(uv, t);
  }

  fragColor = mix(current_col, next_col, fade_out);
}
