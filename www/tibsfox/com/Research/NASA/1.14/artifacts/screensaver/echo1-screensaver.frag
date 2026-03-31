#version 330 core

// Echo 1 Multi-Mode Screensaver
// Cycles through 4 visual modes (~15 seconds each, 60s total cycle):
//   Mode 0: Giant reflective sphere with radio beams bouncing off —
//           Echo 1 in orbit, reflecting signals between ground stations
//   Mode 1: Expanding wavefronts reflecting from curved surface —
//           wave physics of reflection, angle in = angle out
//   Mode 2: Man o' war float — iridescent gas-filled balloon on a
//           rippling ocean surface, Physalia physalis
//   Mode 3: Schrodinger wave equation probability density —
//           quantum wave function evolving, collapsing on observation
//
// Color palette: Mylar Silver / Signal Blue / Iridescent Purple /
//                Ocean Blue / Sky White
//   Mylar silver:      #C0C8D0 (the reflective balloon surface)
//   Signal blue:       #2060CC (radio signals, communication)
//   Iridescent purple: #8040CC (man o' war float, quantum states)
//   Ocean blue:        #1040AA (deep ocean, the medium)
//   Sky:               #E0E8F0 (atmosphere, visible light)
//
// Compile: glslangValidator echo1-screensaver.frag
// Run:     glslViewer echo1-screensaver.frag
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
const vec3 MYLAR_SILVER  = vec3(0.753, 0.784, 0.816);   // #C0C8D0
const vec3 SIGNAL_BLUE   = vec3(0.125, 0.376, 0.800);   // #2060CC
const vec3 IRIS_PURPLE   = vec3(0.502, 0.251, 0.800);   // #8040CC
const vec3 OCEAN_BLUE    = vec3(0.063, 0.251, 0.667);   // #1040AA
const vec3 SKY_WHITE     = vec3(0.878, 0.910, 0.941);   // #E0E8F0
const vec3 DEEP_SPACE    = vec3(0.008, 0.008, 0.040);
const vec3 STAR_WHITE    = vec3(0.900, 0.920, 0.950);

// ============================================================
// Mode 0: Giant Reflective Sphere with Radio Beams
// ============================================================
// Echo 1 in orbit — a massive shiny sphere. Radio beams from a
// ground transmitter hit the surface and reflect to a ground
// receiver. The sphere gleams with reflected starlight.

vec4 reflectiveSphere(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  // Stars
  for (int i = 0; i < 80; i++) {
    vec2 sp = vec2(hash(vec2(float(i), 1.0)), hash(vec2(1.0, float(i))));
    sp = sp * 2.0 - 1.0;
    float brightness = hash(vec2(float(i) * 3.7, 2.1));
    float twinkle = 0.7 + 0.3 * sin(t * (1.0 + brightness * 3.0) + float(i));
    float sd = length(uv - sp);
    col += STAR_WHITE * brightness * twinkle * 0.012 / (sd * sd + 0.001);
  }

  // Echo 1 sphere — large, center of frame, slowly rotating
  vec2 sphere_center = vec2(0.0, 0.05);
  float sphere_radius = 0.35;
  float dist = length(uv - sphere_center);

  if (dist < sphere_radius) {
    // Surface normal on sphere (2D projection)
    vec2 n = (uv - sphere_center) / sphere_radius;
    float nz = sqrt(max(0.0, 1.0 - dot(n, n)));

    // Specular highlight — sunlight reflection
    vec2 light_dir = normalize(vec2(0.5 + 0.2 * sin(t * 0.2), 0.7));
    float spec = pow(max(0.0, dot(normalize(vec2(n.x, nz)), light_dir)), 30.0);

    // Mylar surface — reflective with wrinkle texture
    float wrinkle = fbm(uv * 20.0 + t * 0.05) * 0.15;
    vec3 surface = MYLAR_SILVER * (0.4 + 0.3 * nz + wrinkle);
    surface += SKY_WHITE * spec * 0.8;

    // Environment reflection — distorted star field
    vec2 reflect_uv = n * 2.0 + t * 0.02;
    float env = fbm(reflect_uv * 3.0);
    surface += STAR_WHITE * env * 0.1;

    col = surface;

    // Edge darkening (limb)
    float limb = 1.0 - smoothstep(sphere_radius * 0.7, sphere_radius, dist);
    col *= 0.5 + 0.5 * limb;
  }

  // Sphere edge glow
  float edge_glow = smoothstep(sphere_radius + 0.02, sphere_radius - 0.01, dist)
                  * smoothstep(sphere_radius - 0.03, sphere_radius, dist);
  col += MYLAR_SILVER * edge_glow * 0.4;

  // Radio beam — transmitter to sphere (from lower left)
  vec2 tx_pos = vec2(-0.9, -0.7);
  vec2 tx_to_sphere = sphere_center - tx_pos;
  float tx_len = length(tx_to_sphere);
  vec2 tx_dir = tx_to_sphere / tx_len;
  vec2 to_pixel_tx = uv - tx_pos;
  float along_tx = dot(to_pixel_tx, tx_dir);
  float perp_tx = abs(dot(to_pixel_tx, vec2(-tx_dir.y, tx_dir.x)));
  if (along_tx > 0.0 && along_tx < tx_len) {
    float beam_width = 0.008 + 0.003 * sin(along_tx * 30.0 - t * 4.0);
    float beam = smoothstep(beam_width, 0.0, perp_tx) * 0.5;
    // Animated pulse along beam
    float pulse = smoothstep(0.5, 0.0, abs(fract(along_tx * 3.0 - t * 0.8) - 0.5));
    col += SIGNAL_BLUE * beam * (0.4 + 0.6 * pulse);
  }

  // Radio beam — sphere to receiver (to lower right)
  vec2 rx_pos = vec2(0.9, -0.7);
  vec2 sphere_to_rx = rx_pos - sphere_center;
  float rx_len = length(sphere_to_rx);
  vec2 rx_dir = sphere_to_rx / rx_len;
  vec2 to_pixel_rx = uv - sphere_center;
  float along_rx = dot(to_pixel_rx, rx_dir);
  float perp_rx = abs(dot(to_pixel_rx, vec2(-rx_dir.y, rx_dir.x)));
  if (along_rx > 0.0 && along_rx < rx_len) {
    float beam_width = 0.008 + 0.003 * sin(along_rx * 30.0 - t * 4.0 + 1.5);
    float beam = smoothstep(beam_width, 0.0, perp_rx) * 0.4;
    float pulse = smoothstep(0.5, 0.0, abs(fract(along_rx * 3.0 - t * 0.8 + 0.3) - 0.5));
    col += SIGNAL_BLUE * beam * (0.3 + 0.5 * pulse);
  }

  // Ground stations — small dots
  float tx_dot = length(uv - tx_pos);
  col += SIGNAL_BLUE * 0.5 * smoothstep(0.02, 0.008, tx_dot);
  float rx_dot = length(uv - rx_pos);
  col += SIGNAL_BLUE * 0.4 * smoothstep(0.02, 0.008, rx_dot);

  // Earth horizon — curved line at bottom
  float horizon = smoothstep(-0.55, -0.60, uv.y);
  col = mix(col, vec3(0.02, 0.06, 0.15), horizon * 0.6);

  return vec4(col, 1.0);
}

// ============================================================
// Mode 1: Expanding Wavefronts Reflecting from Curved Surface
// ============================================================
// A curved reflector at center. Plane wavefronts arrive from the
// left, hit the surface, and reflect outward. Shows angle of
// incidence = angle of reflection on a curved surface.

vec4 wavefrontReflection(vec2 uv, float t) {
  vec3 col = DEEP_SPACE * 1.5;

  // The curved reflector (arc)
  float arc_radius = 0.5;
  vec2 arc_center = vec2(0.3, 0.0);
  float arc_dist = length(uv - arc_center);
  float arc = smoothstep(0.008, 0.0, abs(arc_dist - arc_radius));
  // Only the left half of the arc (facing incoming waves)
  float arc_angle = atan(uv.y - arc_center.y, uv.x - arc_center.x);
  float arc_visible = step(arc_angle, 2.5) * step(0.8, arc_angle);
  col += MYLAR_SILVER * arc * arc_visible * 0.8;

  // Incoming wavefronts — plane waves from the left
  for (float i = 0.0; i < 8.0; i++) {
    float wave_x = mod(-0.9 + i * 0.25 + t * 0.3, 2.5) - 1.0;
    float wave_dist = abs(uv.x - wave_x);
    // Only show waves approaching the reflector (left side)
    float incoming = step(uv.x, arc_center.x - arc_radius * cos(1.5));
    float wave = smoothstep(0.006, 0.0, wave_dist) * incoming;
    col += SIGNAL_BLUE * wave * 0.4;
  }

  // Reflected wavefronts — circular waves emanating from reflector surface
  for (float i = 0.0; i < 6.0; i++) {
    float ref_radius = mod(t * 0.3 + i * 0.2, 2.0);
    // Each reflected wave originates from a different point on the arc
    float ref_angle = 1.2 + i * 0.3;
    vec2 ref_origin = arc_center + arc_radius * vec2(cos(ref_angle), sin(ref_angle));
    float ref_dist = length(uv - ref_origin);
    float ref_wave = smoothstep(0.006, 0.0, abs(ref_dist - ref_radius));
    // Only show on the reflected side (away from arc center)
    vec2 outward = normalize(ref_origin - arc_center);
    float is_reflected = step(0.0, dot(uv - ref_origin, outward));
    float brightness = 1.0 / (1.0 + ref_radius * ref_radius * 3.0);
    col += SIGNAL_BLUE * ref_wave * is_reflected * brightness * 0.5;
  }

  // Normal vectors at reflection points
  for (float i = 0.0; i < 5.0; i++) {
    float n_angle = 1.0 + i * 0.35;
    vec2 n_point = arc_center + arc_radius * vec2(cos(n_angle), sin(n_angle));
    vec2 normal = normalize(n_point - arc_center);
    // Draw short normal line
    for (float j = 0.0; j < 1.0; j += 0.01) {
      vec2 n_pos = n_point + normal * j * 0.08;
      float nd = length(uv - n_pos);
      col += MYLAR_SILVER * 0.15 * smoothstep(0.004, 0.0, nd);
    }
  }

  // Labels: "θᵢ = θᵣ" would be text, simulate with a small glow
  float eq_glow = smoothstep(0.15, 0.0, length(uv - vec2(-0.6, 0.5)));
  col += SKY_WHITE * eq_glow * 0.03;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 2: Portuguese Man o' War Float
// ============================================================
// An iridescent gas-filled balloon (pneumatophore) riding on a
// rippling ocean surface. Translucent, shimmering with purple,
// blue, and pink iridescence. Tentacles trailing below.

vec4 manOWar(vec2 uv, float t) {
  // Ocean background — deep blue gradient
  vec3 col = mix(OCEAN_BLUE * 0.3, OCEAN_BLUE * 0.8, uv.y * 0.5 + 0.5);

  // Ocean surface — wavy line near top third
  float ocean_y = 0.2 + 0.02 * sin(uv.x * 4.0 + t * 0.5)
                      + 0.01 * sin(uv.x * 7.0 - t * 0.7);

  // Sky above the water
  if (uv.y > ocean_y) {
    float sky_grad = (uv.y - ocean_y) / (1.0 - ocean_y);
    col = mix(SKY_WHITE * 0.7, SKY_WHITE * 0.3, sky_grad);
    // Clouds
    float cloud = fbm(vec2(uv.x * 2.0 + t * 0.03, uv.y * 4.0));
    col += SKY_WHITE * smoothstep(0.45, 0.65, cloud) * 0.3;
  }

  // Water surface caustics (below water line)
  if (uv.y < ocean_y) {
    float caustic = fbm(uv * 5.0 + vec2(t * 0.1, -t * 0.05));
    col += OCEAN_BLUE * caustic * 0.15;
  }

  // Man o' war float — pneumatophore (gas-filled bladder)
  // Sits right at the water line, partially above, partially below
  vec2 float_center = vec2(-0.1, ocean_y + 0.06);
  float float_dist = length((uv - float_center) * vec2(1.0, 1.8));
  float float_radius = 0.12;

  if (float_dist < float_radius) {
    // Iridescent surface — shifts color based on angle and time
    float angle = atan(uv.y - float_center.y, uv.x - float_center.x);
    float iridescence = sin(angle * 3.0 + t * 0.5) * 0.5 + 0.5;
    float iridescence2 = cos(angle * 5.0 - t * 0.3) * 0.5 + 0.5;

    vec3 float_col = mix(IRIS_PURPLE, SIGNAL_BLUE, iridescence);
    float_col = mix(float_col, vec3(0.8, 0.3, 0.6), iridescence2 * 0.3);

    // Translucency — lighter in the center (gas-filled)
    float translucency = 1.0 - float_dist / float_radius;
    float_col = mix(float_col, SKY_WHITE * 0.8, translucency * 0.4);

    // Surface texture — slight wrinkles
    float wrinkle = vnoise(uv * 50.0 + t * 0.02) * 0.1;
    float_col += wrinkle;

    // Specular highlight
    float spec = pow(max(0.0, 1.0 - float_dist / (float_radius * 0.5)), 8.0);
    float_col += SKY_WHITE * spec * 0.5;

    float alpha = smoothstep(float_radius, float_radius - 0.02, float_dist);
    col = mix(col, float_col, alpha * 0.85);
  }

  // Crest / sail ridge along top of float
  float crest_x = uv.x - float_center.x;
  float crest_y = float_center.y + 0.07 + 0.02 * sin(crest_x * 15.0);
  float crest_dist = abs(uv.y - crest_y);
  float crest_visible = smoothstep(0.15, 0.0, abs(crest_x)) *
                        smoothstep(0.01, 0.003, crest_dist);
  col = mix(col, mix(IRIS_PURPLE, vec3(0.9, 0.4, 0.6), 0.5), crest_visible * 0.5);

  // Tentacles — trailing below the float into the water
  for (int i = 0; i < 6; i++) {
    float tent_x = float_center.x - 0.08 + float(i) * 0.035;
    float tent_offset = sin(float(i) * 2.3 + t * 0.3) * 0.03;
    for (float y = ocean_y; y > ocean_y - 0.5; y -= 0.005) {
      float sway = sin(y * 8.0 + t * 0.5 + float(i)) * 0.02 * (ocean_y - y);
      vec2 tent_pos = vec2(tent_x + sway + tent_offset, y);
      float td = length(uv - tent_pos);
      float thickness = 0.003 * (1.0 - (ocean_y - y) * 1.5);
      if (thickness > 0.0005) {
        float tent = smoothstep(thickness, thickness * 0.3, td);
        col = mix(col, IRIS_PURPLE * 0.6, tent * 0.5);
      }
    }
  }

  // Water surface highlight/reflection
  float surface_line = smoothstep(0.005, 0.0, abs(uv.y - ocean_y));
  col += SKY_WHITE * surface_line * 0.2;

  return vec4(col, 1.0);
}

// ============================================================
// Mode 3: Schrodinger Wave Equation Probability Density
// ============================================================
// A quantum wave function evolving in time. Shows |ψ|² as a
// luminous probability cloud. The wave packet moves, spreads,
// encounters a barrier, partially reflects and partially tunnels.
// Schrodinger's equation made visible.

vec4 schrodingerWave(vec2 uv, float t) {
  vec3 col = DEEP_SPACE;

  // Coordinate system: x is position, y is probability density
  float x = uv.x * 4.0;  // spatial coordinate
  float y = uv.y;         // vertical = probability amplitude

  // Wave packet — Gaussian envelope with plane wave carrier
  float packet_center = -2.0 + mod(t * 0.6, 6.0);  // moves right
  float packet_width = 0.5 + 0.1 * t * 0.1;  // spreads over time (dispersion)
  float gaussian = exp(-pow(x - packet_center, 2.0) / (2.0 * packet_width * packet_width));

  // Carrier wave — complex oscillation (real part shown)
  float k = 8.0;  // wave number
  float omega = k * k * 0.5;  // dispersion relation: E = ℏk²/2m
  float psi_real = gaussian * cos(k * x - omega * t * 0.5);
  float psi_imag = gaussian * sin(k * x - omega * t * 0.5);
  float prob_density = psi_real * psi_real + psi_imag * psi_imag;

  // Potential barrier — a wall at x = 1.0
  float barrier_x = 1.0;
  float barrier_width = 0.15;
  float barrier_height = 0.6;
  float in_barrier = smoothstep(barrier_x - barrier_width, barrier_x - barrier_width + 0.02, x)
                   * smoothstep(barrier_x + barrier_width, barrier_x + barrier_width - 0.02, x);

  // Draw the barrier
  if (in_barrier > 0.5 && y < barrier_height && y > -0.01) {
    col = mix(col, MYLAR_SILVER * 0.3, 0.6);
  }

  // Reflected wave (appears after packet hits barrier)
  float ref_time = (barrier_x - (-2.0)) / 0.6;  // when packet hits barrier
  float time_since_hit = mod(t, 10.0) - ref_time;
  if (time_since_hit > 0.0) {
    float ref_center = barrier_x - time_since_hit * 0.4;
    float ref_gaussian = exp(-pow(x - ref_center, 2.0) / (2.0 * 0.4 * 0.4));
    float ref_psi = ref_gaussian * cos(-k * x - omega * t * 0.5 + 1.0);
    float ref_prob = ref_psi * ref_psi * 0.4;  // weaker (partial reflection)

    // Draw reflected probability
    float ref_bar_height = ref_prob * 1.5;
    if (y > 0.0 && y < ref_bar_height) {
      float ref_intensity = smoothstep(0.0, 0.02, y) * smoothstep(ref_bar_height, ref_bar_height - 0.02, y);
      col += IRIS_PURPLE * ref_intensity * 0.6;
    }
  }

  // Transmitted wave (tunneling through barrier)
  if (time_since_hit > 0.0) {
    float trans_center = barrier_x + barrier_width + time_since_hit * 0.3;
    float trans_gaussian = exp(-pow(x - trans_center, 2.0) / (2.0 * 0.3 * 0.3));
    float trans_psi = trans_gaussian * cos(k * x - omega * t * 0.5 + 2.0);
    float trans_prob = trans_psi * trans_psi * 0.15;  // much weaker (tunneling)

    float trans_bar_height = trans_prob * 1.5;
    if (y > 0.0 && y < trans_bar_height) {
      float trans_intensity = smoothstep(0.0, 0.02, y) * smoothstep(trans_bar_height, trans_bar_height - 0.02, y);
      col += SIGNAL_BLUE * trans_intensity * 0.4;
    }
  }

  // Draw incident probability density as a filled region
  float bar_height = prob_density * 1.5;
  if (y > 0.0 && y < bar_height) {
    float intensity = smoothstep(0.0, 0.02, y) * smoothstep(bar_height, bar_height - 0.02, y);
    // Color shifts: real part blue, imaginary part purple
    float phase_color = 0.5 + 0.5 * psi_real / max(sqrt(prob_density), 0.001);
    vec3 wave_color = mix(IRIS_PURPLE, SIGNAL_BLUE, phase_color);
    col += wave_color * intensity * 0.8;
  }

  // Probability density curve (top edge of the filled region)
  float curve_dist = abs(y - bar_height);
  if (y > -0.01 && prob_density > 0.01) {
    float curve = smoothstep(0.008, 0.0, curve_dist);
    col += SKY_WHITE * curve * prob_density * 2.0;
  }

  // Axis line (x-axis)
  float axis = smoothstep(0.003, 0.0, abs(y));
  col += MYLAR_SILVER * axis * 0.2;

  // Phase indicator — small rotating arrow showing complex phase
  float phase_angle = atan(psi_imag, psi_real);
  vec2 phase_pos = vec2(uv.x, -0.3);
  float phase_dot = length(uv - phase_pos);
  if (phase_dot < 0.15 && prob_density > 0.05) {
    vec2 phase_arrow = vec2(cos(phase_angle), sin(phase_angle)) * 0.01;
    float arrow_d = length(uv - phase_pos - phase_arrow * 5.0);
    col += mix(SIGNAL_BLUE, IRIS_PURPLE, 0.5) * smoothstep(0.005, 0.0, arrow_d) * prob_density;
  }

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
    current_col = reflectiveSphere(uv, t);
    next_col = wavefrontReflection(uv, t);
  } else if (mode == 1) {
    current_col = wavefrontReflection(uv, t);
    next_col = manOWar(uv, t);
  } else if (mode == 2) {
    current_col = manOWar(uv, t);
    next_col = schrodingerWave(uv, t);
  } else {
    current_col = schrodingerWave(uv, t);
    next_col = reflectiveSphere(uv, t);
  }

  fragColor = mix(current_col, next_col, fade_out);
}
