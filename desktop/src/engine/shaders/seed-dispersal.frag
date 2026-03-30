#version 300 es
precision highp float;

// Generative Art: "80,000 Seeds"
// Mission 1.1 — Fireweed seed dispersal as abstract art
// Perlin wind field carries seed particles, trails accumulate
// Each seed traces a path; the accumulated pattern emerges

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
    f.y
  );
}

// Curl noise for divergence-free flow (seeds don't accumulate in sinks)
vec2 curlNoise(vec2 p, float t) {
  float eps = 0.01;
  float n = noise(p + vec2(0, eps) + vec2(t * 0.05, 0));
  float s = noise(p - vec2(0, eps) + vec2(t * 0.05, 0));
  float e = noise(p + vec2(eps, 0) + vec2(0, t * 0.03));
  float w = noise(p - vec2(eps, 0) + vec2(0, t * 0.03));
  return vec2(n - s, -(e - w)) / (2.0 * eps);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = uv * aspect;

  // Dark background
  vec3 col = vec3(0.04, 0.03, 0.04);

  // Accumulate seed trail contributions
  float total = 0.0;

  // Simulate seed paths (limited per frame for real-time)
  float t = u_time;
  for (float seed = 0.0; seed < 200.0; seed++) {
    // Seed origin (central plant)
    vec2 origin = vec2(0.5 * aspect.x, 0.5);
    origin += vec2(hash(vec2(seed, 1.0)) - 0.5, hash(vec2(seed, 2.0)) - 0.5) * 0.05;

    // Seed birth time
    float birth = hash(vec2(seed, 3.0)) * 20.0;
    float age = t - birth;
    if (age < 0.0) continue;
    age = mod(age, 15.0); // loop after 15 seconds

    // Trace seed path using curl noise
    vec2 pos = origin;
    float dt = 0.05;
    for (float step = 0.0; step < 60.0; step++) {
      float step_time = step * dt;
      if (step_time > age) break;

      vec2 flow = curlNoise(pos * 2.0, t * 0.2 + seed * 0.1);
      // Add gentle upward drift (pappus parachute) and rightward wind
      flow += vec2(0.02, 0.01);
      pos += flow * dt;

      // Check if this pixel is near this trail point
      float d = length(p - pos);
      if (d < 0.004) {
        // Trail intensity fades with distance from seed position
        float intensity = exp(-d * 500.0) * 0.15;
        // Fade with age
        intensity *= exp(-step_time * 0.1);
        total += intensity;
      }
    }
  }

  // Color the accumulated trails — magenta fireweed palette
  vec3 trail_color = mix(
    vec3(0.784, 0.314, 0.753),  // magenta (#C850C0)
    vec3(0.95, 0.85, 0.95),     // pale magenta-white
    clamp(total * 2.0, 0.0, 1.0)
  );
  col = mix(col, trail_color, clamp(total, 0.0, 1.0));

  // Subtle center glow (the plant)
  float center_d = length(p - vec2(0.5 * aspect.x, 0.5));
  col += vec3(0.290, 0.055, 0.306) * exp(-center_d * 8.0) * 0.3;

  fragColor = vec4(col, 1.0);
}
