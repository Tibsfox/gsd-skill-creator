#version 300 es
precision highp float;

// Pioneer 0 Rocket Exhaust → Explosion Shader
// Mission 1.1: Thor-Able launch and T+77 failure
// Phases: steady exhaust (0-0.7), thrust decay (0.7-0.8), explosion (0.8-1.0)

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

// 3D noise for volumetric turbulence
float hash(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash(i);
  float n100 = hash(i + vec3(1,0,0));
  float n010 = hash(i + vec3(0,1,0));
  float n110 = hash(i + vec3(1,1,0));
  float n001 = hash(i + vec3(0,0,1));
  float n101 = hash(i + vec3(1,0,1));
  float n011 = hash(i + vec3(0,1,1));
  float n111 = hash(i + vec3(1,1,1));

  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise3D(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Blackbody color approximation (temperature in Kelvin)
vec3 blackbody(float T) {
  // Simplified Planckian locus
  float t = T / 1000.0;
  vec3 c;
  c.r = clamp(1.0 - exp(-0.5 * t), 0.0, 1.0);
  c.g = clamp(t < 6.5 ? t * 0.2 - 0.1 : 1.5 - t * 0.1, 0.0, 1.0);
  c.b = clamp(t > 5.0 ? (t - 5.0) * 0.3 : 0.0, 0.0, 1.0);
  return c;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

  // Phase calculation: 10-second cycle
  float cycle = mod(u_time, 10.0) / 10.0;

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  if (cycle < 0.7) {
    // Phase 1: Steady exhaust plume
    float phase_t = cycle / 0.7;

    // Plume center axis (vertical, slight curve with time)
    vec2 axis = vec2(0.0, -0.3);
    vec2 rel = uv - axis;

    // Plume shape: expanding cone going downward
    float plume_dist = length(vec2(rel.x, 0.0));
    float plume_y = -rel.y;

    if (plume_y > 0.0 && plume_y < 0.5) {
      float width = 0.02 + plume_y * 0.15;
      float d = plume_dist / width;

      if (d < 1.0) {
        // Mach diamond pattern
        float mach = sin(plume_y * 40.0 - u_time * 8.0) * 0.5 + 0.5;
        mach *= exp(-plume_y * 4.0);

        // Turbulent mixing
        float turb = fbm(vec3(uv * 8.0, u_time * 2.0));

        // Temperature: hot core (6000K) to cool edge (1500K)
        float temp = mix(6000.0, 1500.0, d) + mach * 2000.0;
        temp += turb * 500.0;

        col = blackbody(temp);
        alpha = (1.0 - d) * (1.0 - plume_y * 2.0);
        alpha *= 0.8 + turb * 0.2;
      }
    }
  } else if (cycle < 0.8) {
    // Phase 2: Thrust decay (bearing failure)
    float phase_t = (cycle - 0.7) / 0.1;

    vec2 axis = vec2(0.0, -0.3);
    vec2 rel = uv - axis;
    float plume_y = -rel.y;
    float plume_dist = length(vec2(rel.x, 0.0));

    if (plume_y > 0.0 && plume_y < 0.3 * (1.0 - phase_t)) {
      float width = 0.02 + plume_y * 0.1;
      // Asymmetric flutter (bearing vibration)
      width += sin(u_time * 50.0) * 0.005 * phase_t;
      float d = plume_dist / width;

      if (d < 1.0) {
        float temp = mix(4000.0, 1000.0, phase_t + d * 0.5);
        col = blackbody(temp);
        alpha = (1.0 - d) * (1.0 - phase_t);
        // Flicker
        alpha *= 0.5 + 0.5 * sin(u_time * 30.0 + phase_t * 10.0);
      }
    }
  } else {
    // Phase 3: Explosion
    float phase_t = (cycle - 0.8) / 0.2;

    // Expanding fireball
    float radius = phase_t * 0.4;
    vec2 center = vec2(0.0, -0.1);
    float d = length(uv - center);

    if (d < radius) {
      float norm_d = d / radius;

      // Noise displacement on fireball surface
      float disp = fbm(vec3(normalize(uv - center) * 3.0, u_time * 1.5));

      float temp = mix(8000.0, 800.0, norm_d + phase_t * 0.5);
      temp += disp * 1000.0;
      col = blackbody(temp);

      // Core is bright, edge fades
      alpha = (1.0 - norm_d) * (1.0 - phase_t * 0.7);
      alpha *= 0.6 + disp * 0.4;
    }

    // Smoke column rising
    float smoke_x = abs(uv.x);
    float smoke_y = uv.y + 0.1;
    if (smoke_y > 0.0 && smoke_x < 0.1 + smoke_y * 0.3 && phase_t > 0.2) {
      float smoke_d = smoke_x / (0.1 + smoke_y * 0.3);
      float smoke_turb = fbm(vec3(uv * 4.0, u_time * 0.5));
      vec3 smoke_col = vec3(0.15 + smoke_turb * 0.1);
      float smoke_alpha = (1.0 - smoke_d) * min(phase_t * 2.0, 1.0) * 0.4;
      col = mix(col, smoke_col, smoke_alpha);
      alpha = max(alpha, smoke_alpha);
    }
  }

  // Subtle star background
  float stars = step(0.998, hash(vec3(floor(uv * 200.0), 1.0)));
  col += stars * vec3(0.8, 0.85, 1.0) * 0.3;

  fragColor = vec4(col, 1.0);
}
