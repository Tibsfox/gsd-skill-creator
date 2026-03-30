#version 300 es
precision highp float;

// Armillaria Network — Mycelial Growth Screensaver
// Mission 1.0 Organism: Armillaria ostoyae (Honey Mushroom)
// Golden rhizomorphs spreading through dark earth, nutrient pulses traveling
// XScreenSaver / GSD-OS animated wallpaper

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

// Voronoi for branching structure
vec2 voronoiCell(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 closest = vec2(0.0);
  float minDist = 10.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash(i + neighbor + vec2(0.5)) * vec2(hash(i + neighbor), hash(i + neighbor + vec2(7.3)));
      point = 0.5 + 0.4 * sin(vec2(hash(i + neighbor) * 6.283, hash(i + neighbor + vec2(3.7)) * 6.283));
      float d = length(neighbor + point - f);
      if (d < minDist) {
        minDist = d;
        closest = i + neighbor + point;
      }
    }
  }
  return vec2(minDist, length(closest));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = uv * aspect;

  // Dark earth background
  float soil_noise = fbm(p * 8.0 + vec2(0.0, u_time * 0.02));
  vec3 col = mix(vec3(0.035, 0.065, 0.035), vec3(0.06, 0.10, 0.06), soil_noise);

  // Growth front — expanding circle from center
  vec2 center = vec2(0.5 * aspect.x, 0.5);
  float dist_from_center = length(p - center);
  float growth_radius = mod(u_time * 0.03, 1.5); // slowly expanding
  float in_network = smoothstep(growth_radius, growth_radius - 0.02, dist_from_center);

  // Voronoi-based branching pattern
  vec2 vor = voronoiCell(p * 6.0 + vec2(u_time * 0.01));
  float edge_dist = vor.x;

  // Rhizomorph: glow along Voronoi edges (where cells meet)
  float rhizo_width = 0.08 + 0.02 * noise(p * 20.0);
  float rhizo = smoothstep(rhizo_width, 0.0, edge_dist) * in_network;

  // Organic displacement
  float displacement = noise(p * 15.0 + vec2(u_time * 0.1, 0.0)) * 0.3;
  rhizo *= 0.7 + displacement;

  // Nutrient pulse — traveling wave along the network
  float pulse_phase = fract(dist_from_center * 3.0 - u_time * 0.2);
  float pulse = exp(-pulse_phase * pulse_phase * 20.0) * 0.5;

  // Rhizomorph color: golden with pulse brightening
  vec3 rhizo_base = vec3(0.769, 0.643, 0.353);   // #C4A35A
  vec3 rhizo_bright = vec3(0.910, 0.851, 0.659);  // #E8D9A8
  vec3 rhizo_color = mix(rhizo_base, rhizo_bright, pulse);

  // Add rhizomorph glow to background
  col = mix(col, rhizo_color, rhizo * 0.85);

  // Soft glow around rhizomorphs
  float glow = smoothstep(0.15, 0.0, edge_dist) * in_network * 0.15;
  col += rhizo_base * glow;

  // Fruiting bodies (mushrooms) at network nodes — occasional golden dots
  float node_hash = hash(floor(p * 6.0));
  if (node_hash > 0.92 && in_network > 0.5) {
    float node_dist = length(fract(p * 6.0) - 0.5);
    if (node_dist < 0.06) {
      float mushroom = smoothstep(0.06, 0.02, node_dist);
      col = mix(col, vec3(0.855, 0.647, 0.125), mushroom * 0.8); // #DAA520 honey gold
    }
  }

  // Center: brightest node (the seed, the origin)
  float center_dist = length(p - center);
  if (center_dist < 0.02) {
    col = mix(col, vec3(0.910, 0.851, 0.659), smoothstep(0.02, 0.005, center_dist));
  }

  // Subtle vignette
  col *= 1.0 - 0.3 * length(uv - 0.5);

  fragColor = vec4(col, 1.0);
}
