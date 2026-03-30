#version 330 core

// Pioneer 1 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Sword fern frond unfurling — fractal branching, green on dark
//   Mode 1: Spore dispersal — particles rising from fern fronds, caught by wind
//   Mode 2: Van Allen belt cross-section — concentric radiation rings, Earth at center
//   Mode 3: Varied thrush flight — bird silhouette gliding through forest
//
// Compile: glslangValidator pioneer1-screensaver.frag
// Run:     glslViewer pioneer1-screensaver.frag
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
const vec3 FERN_DARK   = vec3(0.086, 0.180, 0.075);
const vec3 FERN_MID    = vec3(0.180, 0.340, 0.120);
const vec3 FERN_LIGHT  = vec3(0.290, 0.480, 0.200);
const vec3 FERN_TIP    = vec3(0.400, 0.560, 0.220);
const vec3 SPORE_GOLD  = vec3(0.650, 0.580, 0.280);
const vec3 EARTH_BLUE  = vec3(0.150, 0.300, 0.600);
const vec3 BELT_INNER  = vec3(0.800, 0.400, 0.100);
const vec3 BELT_OUTER  = vec3(0.300, 0.200, 0.700);
const vec3 SLOT_DIM    = vec3(0.040, 0.060, 0.080);
const vec3 THRUSH_BODY = vec3(0.600, 0.350, 0.150);
const vec3 THRUSH_WING = vec3(0.250, 0.280, 0.320);

// ============================================================
// Mode 0: Sword Fern Frond Unfurling
// ============================================================

float fernPinna(vec2 p, float len, float w) {
  // Single pinna (leaflet) shape — pointed oval with auricle
  float d = length(p / vec2(len, w));
  // Auricle bump on one side near base
  float auricle = smoothstep(0.15, 0.0, length(p - vec2(len * 0.05, w * 0.6)));
  return smoothstep(1.0, 0.95, d - auricle * 0.15);
}

vec4 fernUnfurl(vec2 uv, float t) {
  vec3 col = vec3(0.02, 0.03, 0.02);
  float phase = mod(t / 15.0, 1.0);

  // Growth progress: 0 = tight crozier, 1 = fully unfurled
  float grow = smoothstep(0.0, 0.85, phase);

  // Central rachis — curved line unfurling from crozier
  // The frond uncurls from a spiral to a straight line
  float curl_amount = (1.0 - grow) * 4.0;

  // Draw the rachis with pinnae
  float frond_alpha = 0.0;
  vec3 frond_col = FERN_DARK;

  // Walk along the rachis
  for (float i = 0.0; i < 40.0; i++) {
    float param = i / 40.0;
    if (param > grow) break;

    // Rachis position: spiral that straightens
    float angle = param * curl_amount;
    float radius = 0.02 + param * 0.55 * grow;
    vec2 rachis_pos = vec2(
      radius * sin(angle) * 0.3,
      -0.4 + radius * cos(angle) * 0.7 + param * 0.6 * grow
    );

    // Rachis thickness
    float rachis_d = length(uv - rachis_pos);
    float rachis_w = 0.003 * (1.0 - param * 0.5);
    if (rachis_d < rachis_w) {
      frond_alpha = 1.0;
      frond_col = mix(FERN_DARK, FERN_MID, param);
    }

    // Pinnae grow outward from rachis
    float pinna_grow = smoothstep(param - 0.1, param + 0.05, grow);
    if (pinna_grow > 0.0 && param > 0.05) {
      // Tangent direction along rachis
      float tang_angle = angle - 0.1;
      vec2 tangent = vec2(cos(tang_angle), sin(tang_angle) * 0.7);
      vec2 normal = vec2(-tangent.y, tangent.x);

      // Left and right pinnae
      for (float side = -1.0; side <= 1.0; side += 2.0) {
        float pinna_len = (0.04 + 0.08 * (1.0 - abs(param - 0.4) * 1.5)) * pinna_grow;
        vec2 pinna_center = rachis_pos + normal * side * pinna_len * 0.5;
        vec2 local = uv - pinna_center;

        // Rotate pinna to align with frond direction + slight angle
        float pinna_angle = tang_angle + side * 0.4;
        local = rot(pinna_angle) * local;

        float pd = fernPinna(local, pinna_len, pinna_len * 0.25);
        if (pd > 0.0) {
          frond_alpha = max(frond_alpha, pd * pinna_grow);
          float color_t = param + vnoise(uv * 30.0) * 0.15;
          frond_col = mix(FERN_MID, FERN_LIGHT, color_t);
          // Tips are lighter
          if (length(local) > pinna_len * 0.6) {
            frond_col = mix(frond_col, FERN_TIP, 0.4);
          }
        }
      }
    }
  }

  // Crozier spiral (visible when not fully unfurled)
  if (grow < 0.9) {
    float spiral_tight = (1.0 - grow) * 2.5;
    vec2 spiral_center = vec2(0.0, -0.4 + grow * 0.3);
    vec2 sp = uv - spiral_center;
    float sp_angle = atan(sp.y, sp.x);
    float sp_r = length(sp);
    float expected_r = 0.01 + (sp_angle + 3.14159) / 6.28318 * 0.04 * spiral_tight;
    float spiral_d = abs(sp_r - expected_r);
    if (spiral_d < 0.003 && sp_r < 0.06 * (1.0 - grow)) {
      frond_alpha = max(frond_alpha, smoothstep(0.003, 0.001, spiral_d));
      frond_col = FERN_TIP;
    }
  }

  col = mix(col, frond_col, frond_alpha);

  // Subtle ambient particles (forest dust)
  col += step(0.997, hash(floor(uv * 200.0 + t * 3.0))) * vec3(0.1, 0.12, 0.06) * 0.3;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Spore Dispersal
// ============================================================

vec4 sporeDispersal(vec2 uv, float t) {
  vec3 col = vec3(0.02, 0.04, 0.03);

  // Static fern silhouettes at bottom
  for (float i = 0.0; i < 6.0; i++) {
    float fx = (hash(vec2(i, 7.3)) - 0.5) * 1.4;
    float fy = -0.35 + hash(vec2(i, 11.7)) * 0.1;
    float fh = 0.15 + hash(vec2(i, 17.1)) * 0.12;
    vec2 fp = uv - vec2(fx, fy);

    // Simple frond shape: tapered triangle
    float frond_shape = 1.0 - fp.y / fh;
    float frond_width = frond_shape * 0.06;
    if (fp.y > 0.0 && fp.y < fh && abs(fp.x) < frond_width) {
      float sway = sin(t * 0.8 + i * 2.0) * 0.01 * fp.y / fh;
      if (abs(fp.x - sway) < frond_width) {
        float ft = fp.y / fh;
        col = mix(FERN_DARK, FERN_MID, ft * 0.5);
        // Pinna texture
        float pinna_pat = sin(fp.y * 80.0) * 0.5 + 0.5;
        col = mix(col, FERN_LIGHT, pinna_pat * 0.2 * (1.0 - ft));
      }
    }
  }

  // Spore particles rising from fronds
  float cycle = mod(t / 20.0, 1.0);
  for (float s = 0.0; s < 80.0; s++) {
    float birth_time = hash(vec2(s, 31.7)) * 15.0;
    float age = mod(t - birth_time, 15.0);
    if (age < 0.0) continue;

    // Origin: from one of the fern fronds
    float src_fern = floor(hash(vec2(s, 41.3)) * 6.0);
    float sx = (hash(vec2(src_fern, 7.3)) - 0.5) * 1.4
             + (hash(vec2(s, 47.9)) - 0.5) * 0.08;
    float sy = -0.35 + hash(vec2(src_fern, 11.7)) * 0.1
             + hash(vec2(s, 53.1)) * 0.12;

    // Drift upward with wind turbulence
    float wind_x = sin(age * 0.7 + s * 0.3) * 0.15 + sin(age * 1.3 + s * 0.7) * 0.08;
    float wind_y = age * 0.06 + sin(age * 0.5) * 0.02;

    vec2 sp_pos = vec2(sx + wind_x, sy + wind_y);
    float sd = length(uv - sp_pos);

    // Spore size decreases with age (perspective: rising away)
    float sp_size = 0.004 * max(0.2, 1.0 - age * 0.06);
    if (sd < sp_size) {
      float alpha = (1.0 - sd / sp_size) * max(0.0, 1.0 - age * 0.08);
      col = mix(col, SPORE_GOLD, alpha * 0.8);
    }
  }

  // Subtle wind lines
  for (float w = 0.0; w < 5.0; w++) {
    float wy = (hash(vec2(w, 67.3)) - 0.5) * 0.8;
    float wx_start = -0.8 + mod(t * 0.1 + w * 0.3, 2.0);
    float wind_line_d = abs(uv.y - wy - sin(uv.x * 3.0 + t + w) * 0.02);
    float wind_line_x = smoothstep(wx_start, wx_start + 0.3, uv.x)
                      * smoothstep(wx_start + 0.6, wx_start + 0.3, uv.x);
    if (wind_line_d < 0.001) {
      col += vec3(0.06, 0.08, 0.04) * wind_line_x;
    }
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Van Allen Belt Cross-Section
// ============================================================

vec4 vanAllenBelts(vec2 uv, float t) {
  vec3 col = vec3(0.01, 0.015, 0.03);
  float aspect = iResolution.x / iResolution.y;

  // Earth at center
  float earth_r = 0.08;
  float ed = length(uv);
  if (ed < earth_r) {
    // Simple Earth — blue with green/brown
    float lat = atan(uv.y, uv.x);
    float land = vnoise(vec2(lat * 3.0, ed * 20.0) + vec2(t * 0.02, 0.0));
    vec3 earth_col = mix(EARTH_BLUE, vec3(0.15, 0.35, 0.12), smoothstep(0.45, 0.55, land));
    // Atmosphere rim
    float rim = smoothstep(earth_r * 0.7, earth_r, ed);
    earth_col = mix(earth_col, vec3(0.3, 0.5, 0.8), rim * 0.5);
    col = earth_col;
  } else {
    // Radiation belts as glowing concentric rings
    // Scale: 1 Earth radius = earth_r
    // Inner belt: ~1.5-3 Re (centered ~2.2 Re)
    // Slot: ~3-4 Re
    // Outer belt: ~4-8 Re (centered ~5 Re)

    float re = ed / earth_r;  // Distance in Earth radii

    // Inner belt
    float inner = exp(-pow(re - 2.2, 2.0) / 0.5);
    // Outer belt (broader, slightly weaker)
    float outer = exp(-pow(re - 5.0, 2.0) / 2.5) * 0.75;

    // Radiation particles — animated dots
    float particle_density = inner * 0.8 + outer * 0.5;
    float angle = atan(uv.y, uv.x);

    // Trapped particle motion: bounce between mirror points
    // Particles drift in longitude and bounce in latitude
    float drift = t * 0.3;
    float bounce = sin(angle * 3.0 + t * 2.0 + re * 4.0) * 0.5 + 0.5;

    // Belt glow
    vec3 belt_col = mix(BELT_INNER, BELT_OUTER, smoothstep(3.0, 5.0, re));
    float belt_intensity = (inner + outer);

    // Latitude-dependent intensity (belts are toroidal)
    float lat_factor = cos(angle);
    lat_factor = lat_factor * lat_factor;
    belt_intensity *= 0.3 + 0.7 * lat_factor;

    // Animated particles within the belts
    float particles = 0.0;
    for (float p = 0.0; p < 30.0; p++) {
      float p_re = 1.5 + hash(vec2(p, 1.0)) * 7.0;
      float p_angle = hash(vec2(p, 2.0)) * 6.28318 + t * (0.2 + hash(vec2(p, 3.0)) * 0.3);
      float p_bounce = sin(p_angle * 2.0 + t * 3.0) * 0.3;
      vec2 pp = vec2(cos(p_angle + p_bounce), sin(p_angle + p_bounce)) * p_re * earth_r;
      float pd = length(uv - pp);
      float p_belt = exp(-pow(p_re - 2.2, 2.0) / 0.5) + exp(-pow(p_re - 5.0, 2.0) / 2.5);
      if (pd < 0.005 && p_belt > 0.1) {
        particles += (1.0 - pd / 0.005) * p_belt;
      }
    }

    col += belt_col * belt_intensity * 0.4;
    col += belt_col * particles * 0.6;

    // Slot region label — subtle text-like marking
    if (abs(re - 3.5) < 0.15 && abs(angle) < 0.3) {
      col += SLOT_DIM * 0.3;
    }

    // Pioneer 1 trajectory — animated dot climbing and falling
    float p1_phase = mod(t / 12.0, 1.0);
    float p1_alt;
    if (p1_phase < 0.5) {
      p1_alt = p1_phase * 2.0 * 17.8;  // Climb to 17.8 Re (113,854 km)
    } else {
      p1_alt = (1.0 - (p1_phase - 0.5) * 2.0) * 17.8;  // Fall back
    }
    float p1_re = 1.0 + p1_alt;  // 1 Re = surface
    float p1_angle = -1.5708 + p1_phase * 0.4;  // Slight arc
    vec2 p1_pos = vec2(cos(p1_angle), sin(p1_angle)) * p1_re * earth_r;
    float p1_d = length(uv - p1_pos);
    if (p1_d < 0.006) {
      col = mix(col, vec3(1.0, 0.9, 0.7), smoothstep(0.006, 0.002, p1_d));
    }
    // Trail
    for (float tr = 1.0; tr < 8.0; tr++) {
      float tr_phase = p1_phase - tr * 0.003;
      if (tr_phase < 0.0) continue;
      float tr_alt;
      if (tr_phase < 0.5) {
        tr_alt = tr_phase * 2.0 * 17.8;
      } else {
        tr_alt = (1.0 - (tr_phase - 0.5) * 2.0) * 17.8;
      }
      float tr_re = 1.0 + tr_alt;
      float tr_angle = -1.5708 + tr_phase * 0.4;
      vec2 tr_pos = vec2(cos(tr_angle), sin(tr_angle)) * tr_re * earth_r;
      float tr_d = length(uv - tr_pos);
      if (tr_d < 0.003) {
        col += vec3(0.5, 0.4, 0.3) * (1.0 - tr / 8.0) * 0.3;
      }
    }

    // Stars
    col += step(0.998, hash(floor(uv * 250.0))) * vec3(0.5, 0.55, 0.7) * 0.3;

    // Atmosphere glow
    float atmo = smoothstep(earth_r + 0.02, earth_r, ed);
    col += vec3(0.2, 0.4, 0.8) * atmo * 0.3;
  }

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Varied Thrush Flight Through Forest
// ============================================================

vec4 thrushFlight(vec2 uv, float t) {
  vec3 col = vec3(0.0);

  // Forest background — vertical tree trunks in fog
  float fog_depth = fbm(vec2(uv.x * 2.0, 0.5)) * 0.5 + 0.3;

  // Sky gradient through canopy gaps
  vec3 sky = mix(vec3(0.08, 0.12, 0.10), vec3(0.15, 0.20, 0.15), uv.y * 0.5 + 0.5);
  col = sky;

  // Tree trunks at various depths
  for (float i = 0.0; i < 12.0; i++) {
    float depth = hash(vec2(i, 3.3)) * 0.8 + 0.2;  // 0.2 = near, 1.0 = far
    float tx = (hash(vec2(i, 7.7)) - 0.5) * 2.0;
    float trunk_w = 0.03 / depth;
    float trunk_x = tx + sin(uv.y * 0.5 + i) * 0.01;  // Slight lean

    if (abs(uv.x - trunk_x) < trunk_w) {
      float bark = vnoise(vec2(uv.x * 50.0, uv.y * 20.0 + i * 10.0));
      vec3 trunk_col = mix(vec3(0.08, 0.06, 0.04), vec3(0.15, 0.12, 0.08), bark);
      trunk_col *= (1.0 - depth * 0.6);  // Fade with distance
      float trunk_alpha = smoothstep(trunk_w, trunk_w * 0.7, abs(uv.x - trunk_x));
      col = mix(col, trunk_col, trunk_alpha * (1.0 - depth * 0.5));
    }

    // Fern clumps at base of trees
    float fern_h = 0.05 / depth;
    float fern_y = -0.35 + hash(vec2(i, 13.1)) * 0.1;
    if (uv.y > fern_y && uv.y < fern_y + fern_h && abs(uv.x - tx) < 0.12 / depth) {
      float fern_tex = vnoise(vec2(uv.x * 40.0, uv.y * 60.0));
      vec3 fc = mix(FERN_DARK, FERN_MID, fern_tex) * (1.0 - depth * 0.5);
      float fa = (1.0 - (uv.y - fern_y) / fern_h) * 0.6;
      col = mix(col, fc, fa);
    }
  }

  // Fog/mist layers
  float mist = fbm(vec2(uv.x * 1.5 + t * 0.03, uv.y * 0.8));
  col = mix(col, vec3(0.12, 0.15, 0.12), mist * 0.25);

  // Varied thrush — simple geometric bird silhouette
  float flight_phase = mod(t / 10.0, 1.0);

  // Flight path: gentle sine wave through the forest midstory
  float bird_x = -0.8 + flight_phase * 1.6;
  float bird_y = 0.05 + sin(flight_phase * 6.28318 * 1.5) * 0.12;
  float bird_depth = 0.4 + sin(flight_phase * 3.14159) * 0.15;

  // Wing flap
  float flap = sin(t * 8.0) * 0.3 + 0.2;
  float glide_phase = sin(flight_phase * 6.28318 * 3.0);
  float wing_angle = mix(flap, 0.1, smoothstep(-0.3, 0.3, glide_phase));

  vec2 bp = uv - vec2(bird_x, bird_y);
  float bird_scale = 0.04 / bird_depth;

  // Body — ellipse
  vec2 body_p = bp / vec2(bird_scale * 2.0, bird_scale * 0.8);
  float body_d = length(body_p);
  float bird_alpha = 0.0;
  vec3 bird_col = THRUSH_BODY;

  if (body_d < 1.0) {
    bird_alpha = smoothstep(1.0, 0.7, body_d);
    // Orange breast band
    if (body_p.y < 0.2 && body_p.y > -0.5 && body_p.x > -0.3) {
      bird_col = vec3(0.85, 0.45, 0.12);
    }
  }

  // Wings — triangles angled by wing_angle
  for (float side = -1.0; side <= 1.0; side += 2.0) {
    vec2 wing_p = bp - vec2(0.0, bird_scale * 0.2);
    wing_p.y -= abs(wing_p.x) * wing_angle * side;
    float wing_span = bird_scale * 3.0;
    float wing_chord = bird_scale * 1.0;

    if (wing_p.x * side > 0.0 && wing_p.x * side < wing_span) {
      float wing_t = wing_p.x * side / wing_span;
      float wing_w = wing_chord * (1.0 - wing_t * 0.7);
      if (abs(wing_p.y) < wing_w) {
        float wa = (1.0 - wing_t) * smoothstep(wing_w, wing_w * 0.5, abs(wing_p.y));
        bird_alpha = max(bird_alpha, wa);
        bird_col = THRUSH_WING;
        // Wing bar (white stripe)
        if (wing_t > 0.3 && wing_t < 0.45) {
          bird_col = vec3(0.75, 0.72, 0.68);
        }
      }
    }
  }

  // Head
  vec2 head_p = (bp - vec2(bird_scale * 1.5, bird_scale * 0.3)) / (bird_scale * 0.6);
  float head_d = length(head_p);
  if (head_d < 1.0) {
    bird_alpha = max(bird_alpha, smoothstep(1.0, 0.6, head_d));
    bird_col = vec3(0.15, 0.15, 0.15);
    // Eye stripe (orange)
    if (abs(head_p.y - 0.1) < 0.25 && head_p.x > -0.3) {
      bird_col = vec3(0.85, 0.45, 0.12);
    }
    // Eye
    if (length(head_p - vec2(0.3, 0.2)) < 0.2) {
      bird_col = vec3(0.05);
    }
  }

  // Apply bird
  bird_alpha *= (1.0 - bird_depth * 0.3);
  col = mix(col, bird_col, bird_alpha);

  // Light shafts from canopy
  for (float l = 0.0; l < 3.0; l++) {
    float lx = (hash(vec2(l, 23.7)) - 0.5) * 1.5;
    float shaft_w = 0.03 + hash(vec2(l, 29.1)) * 0.04;
    float shaft_angle = (hash(vec2(l, 33.3)) - 0.5) * 0.15;
    float shaft_x = lx + (uv.y - 0.5) * shaft_angle;
    float shaft_d = abs(uv.x - shaft_x);
    if (shaft_d < shaft_w) {
      float shaft_a = (1.0 - shaft_d / shaft_w) * 0.08;
      shaft_a *= smoothstep(-0.4, 0.3, uv.y);  // Fades near ground
      col += vec3(0.15, 0.18, 0.10) * shaft_a;
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
    current_col = fernUnfurl(uv, iTime);
    next_col = sporeDispersal(uv, iTime);
  } else if (mode == 1) {
    current_col = sporeDispersal(uv, iTime);
    next_col = vanAllenBelts(uv, iTime);
  } else if (mode == 2) {
    current_col = vanAllenBelts(uv, iTime);
    next_col = thrushFlight(uv, iTime);
  } else {
    current_col = thrushFlight(uv, iTime);
    next_col = fernUnfurl(uv, iTime);
  }

  fragColor = mix(current_col, next_col, fade);
}
