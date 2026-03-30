#version 300 es
precision highp float;

// Fireweed Bloom Cycle Screensaver
// Mission 1.1 Organism: Chamerion angustifolium
// Progressive bloom (bottom→top), seed dispersal, seasonal cycle
// Suitable for XScreenSaver module or GSD-OS animated wallpaper

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

// 2D noise
float hash2(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract(p.x * p.y);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i), hash2(i + vec2(1,0)), f.x),
    mix(hash2(i + vec2(0,1)), hash2(i + vec2(1,1)), f.x),
    f.y
  );
}

float fbm2(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2D(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Wind field (Perlin flow field)
vec2 windField(vec2 p, float t) {
  float wx = noise2D(p * 0.5 + vec2(t * 0.1, 0.0)) - 0.5;
  float wy = noise2D(p * 0.5 + vec2(0.0, t * 0.08)) - 0.5;
  return vec2(wx, wy) * 0.3;
}

// Fireweed colors
vec3 MAGENTA = vec3(0.784, 0.314, 0.753);    // #C850C0
vec3 DEEP_PURPLE = vec3(0.290, 0.055, 0.306); // #4A0E4E
vec3 STEM_GREEN = vec3(0.176, 0.314, 0.086);  // #2D5016
vec3 SEED_WHITE = vec3(0.95, 0.93, 0.90);
vec3 SKY_DAY = vec3(0.45, 0.65, 0.85);
vec3 SKY_DUSK = vec3(0.65, 0.35, 0.50);
vec3 MOUNTAIN = vec3(0.12, 0.18, 0.25);

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 aspect_uv = vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);

  // Season cycle: 60 seconds per full year
  float season = mod(u_time / 60.0, 1.0);
  // 0.0-0.2: spring (green), 0.2-0.5: bloom (magenta), 0.5-0.7: seed, 0.7-1.0: dormant

  // Sky gradient
  float sky_blend = smoothstep(0.3, 0.8, uv.y);
  vec3 sky = mix(
    mix(SKY_DAY, SKY_DUSK, sin(season * 6.283) * 0.5 + 0.5),
    vec3(0.55, 0.70, 0.95),
    sky_blend
  );

  // Mountain silhouette
  float mt_height = 0.25 + 0.08 * fbm2(vec2(aspect_uv.x * 2.0, 0.0));
  float mt = smoothstep(mt_height, mt_height + 0.01, uv.y);
  vec3 col = mix(MOUNTAIN, sky, mt);

  // Ground
  if (uv.y < 0.25) {
    float ground_noise = fbm2(aspect_uv * 5.0);
    vec3 ground = mix(
      vec3(0.08, 0.06, 0.04),
      vec3(0.15, 0.12, 0.08),
      ground_noise
    );
    col = ground;
  }

  // Fireweed stems
  float stem_count = 30.0;
  for (float i = 0.0; i < stem_count; i++) {
    float stem_x = hash2(vec2(i, 7.31)) * 1.5 - 0.1;
    float stem_height = 0.15 + hash2(vec2(i, 13.7)) * 0.25;
    float stem_base = 0.15 + hash2(vec2(i, 23.1)) * 0.08;

    // Stem sway in wind
    vec2 wind = windField(vec2(stem_x, u_time), u_time);
    float sway = wind.x * (uv.y - stem_base) * 0.3;

    float dx = aspect_uv.x - stem_x - sway;
    float stem_top = stem_base + stem_height;

    // Only draw if in vertical range
    if (uv.y > stem_base && uv.y < stem_top) {
      float stem_t = (uv.y - stem_base) / stem_height;
      float stem_width = 0.002;
      if (abs(dx) < stem_width) {
        // Stem color (green, darkens toward base)
        col = mix(STEM_GREEN * 0.6, STEM_GREEN, stem_t);
      }

      // Flowers (bloom phase, bottom to top)
      if (season > 0.2 && season < 0.6) {
        float bloom_progress = (season - 0.2) / 0.3; // 0→1 during bloom
        float flower_zone = stem_t; // 0 at base, 1 at top

        // Bloom travels bottom to top
        if (flower_zone < bloom_progress && abs(dx) < 0.008) {
          float flower_intensity = 1.0 - abs(flower_zone - bloom_progress * 0.7) * 3.0;
          flower_intensity = clamp(flower_intensity, 0.0, 1.0);

          // Flower or seed pod?
          if (flower_zone < bloom_progress - 0.3) {
            // Seed pod (below flowers, after bloom passes)
            col = mix(col, STEM_GREEN * 1.3, 0.5);
          } else {
            // Active flower
            float petal_noise = noise2D(vec2(dx * 200.0, uv.y * 100.0 + u_time));
            vec3 flower_col = mix(MAGENTA, DEEP_PURPLE, petal_noise * 0.3);
            col = mix(col, flower_col, flower_intensity * 0.9);
          }
        }
      }
    }
  }

  // Seed dispersal particles (late season)
  if (season > 0.5 && season < 0.8) {
    float seed_phase = (season - 0.5) / 0.3;
    for (float s = 0.0; s < 50.0; s++) {
      float seed_start_x = hash2(vec2(s, 41.7));
      float seed_start_y = 0.25 + hash2(vec2(s, 53.2)) * 0.15;
      float seed_birth = hash2(vec2(s, 67.9)) * 0.8;

      if (seed_phase > seed_birth) {
        float seed_age = seed_phase - seed_birth;
        vec2 wind = windField(vec2(seed_start_x + seed_age, seed_start_y), u_time);

        float sx = seed_start_x + wind.x * seed_age * 5.0 + sin(seed_age * 15.0 + s) * 0.02;
        float sy = seed_start_y + seed_age * 0.3 + wind.y * seed_age;

        float sd = length(aspect_uv - vec2(sx, sy));
        if (sd < 0.003) {
          float seed_alpha = (1.0 - seed_age * 1.5);
          if (seed_alpha > 0.0) {
            col = mix(col, SEED_WHITE, seed_alpha * 0.8);
          }
        }
      }
    }
  }

  // Vignette
  float vignette = 1.0 - 0.3 * length(uv - 0.5);
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
