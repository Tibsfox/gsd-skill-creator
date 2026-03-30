#version 300 es
precision highp float;

// Pioneer 0 Multi-Mode Screensaver
// Cycles through 4 visual modes:
//   Mode 0: Rocket exhaust plume (steady thrust)
//   Mode 1: Fireweed meadow with progressive bloom
//   Mode 2: Seed dispersal generative art (80,000 Seeds)
//   Mode 3: Explosion and rebirth (failure → fireweed)
//
// Install: copy to /usr/lib/xscreensaver/ or ~/.local/share/xscreensaver/
// Run standalone: glslViewer pioneer0-screensaver.frag
// GSD-OS: register as animated wallpaper source

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

// --- Shared noise functions ---

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract(p.x * p.y);
}

float hash3(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}

float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n00 = mix(hash3(i), hash3(i+vec3(1,0,0)), f.x);
  float n10 = mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x);
  float n01 = mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x);
  float n11 = mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x);
  return mix(mix(n00, n10, f.y), mix(n01, n11, f.y), f.z);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise2(p); p *= 2.0; a *= 0.5; }
  return v;
}

float fbm3(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise3(p); p *= 2.0; a *= 0.5; }
  return v;
}

vec3 blackbody(float T) {
  float t = T / 1000.0;
  return vec3(
    clamp(1.0 - exp(-0.5 * t), 0.0, 1.0),
    clamp(t < 6.5 ? t * 0.2 - 0.1 : 1.5 - t * 0.1, 0.0, 1.0),
    clamp(t > 5.0 ? (t - 5.0) * 0.3 : 0.0, 0.0, 1.0)
  );
}

vec2 curlNoise(vec2 p, float t) {
  float eps = 0.01;
  float n = noise2(p + vec2(0, eps) + vec2(t * 0.05, 0));
  float s = noise2(p - vec2(0, eps) + vec2(t * 0.05, 0));
  float e = noise2(p + vec2(eps, 0) + vec2(0, t * 0.03));
  float w = noise2(p - vec2(eps, 0) + vec2(0, t * 0.03));
  return vec2(n - s, -(e - w)) / (2.0 * eps);
}

// --- Colors ---
const vec3 MAGENTA = vec3(0.784, 0.314, 0.753);
const vec3 DEEP_PURPLE = vec3(0.290, 0.055, 0.306);
const vec3 STEM_GREEN = vec3(0.176, 0.314, 0.086);
const vec3 MOUNTAIN = vec3(0.12, 0.18, 0.25);

// --- Mode 0: Rocket Exhaust ---

vec4 rocketExhaust(vec2 uv, float t) {
  vec3 col = vec3(0.02);
  float phase = mod(t / 12.0, 1.0);

  vec2 nozzle = vec2(0.0, 0.2);
  vec2 rel = uv - nozzle;
  float plume_y = -rel.y;
  float plume_x = abs(rel.x);

  if (plume_y > 0.0 && plume_y < 0.6) {
    float width = 0.015 + plume_y * 0.12;
    float turb = fbm3(vec3(uv * 6.0, t * 3.0)) * 0.3;
    width += turb * 0.02;
    float d = plume_x / width;

    if (d < 1.0) {
      // Mach diamonds
      float mach = sin(plume_y * 35.0 - t * 6.0) * 0.5 + 0.5;
      mach *= exp(-plume_y * 5.0);
      float temp = mix(7000.0, 1200.0, d) + mach * 3000.0;
      col = blackbody(temp) * (1.0 - d) * (1.0 - plume_y * 1.5);
    }
  }

  // Stars
  col += step(0.998, hash(floor(uv * 300.0))) * vec3(0.6, 0.65, 0.8) * 0.4;

  return vec4(col, 1.0);
}

// --- Mode 1: Fireweed Meadow ---

vec4 fireweedMeadow(vec2 uv, vec2 aspect_uv, float t) {
  float season = mod(t / 45.0, 1.0);

  // Sky
  float sky_y = smoothstep(0.3, 0.85, uv.y);
  vec3 col = mix(
    mix(vec3(0.45, 0.65, 0.85), vec3(0.65, 0.35, 0.50), sin(season * 6.283) * 0.3 + 0.3),
    vec3(0.5, 0.65, 0.9), sky_y
  );

  // Mountains
  float mt_h = 0.28 + 0.06 * fbm(vec2(aspect_uv.x * 2.5, 0.0));
  col = mix(MOUNTAIN * (0.8 + 0.2 * fbm(aspect_uv * 3.0)), col, smoothstep(mt_h, mt_h + 0.01, uv.y));

  // Ground
  if (uv.y < 0.28) {
    col = mix(vec3(0.06, 0.05, 0.03), vec3(0.14, 0.11, 0.07), fbm(aspect_uv * 6.0));
  }

  // Fireweed stems and flowers
  for (float i = 0.0; i < 40.0; i++) {
    float sx = hash(vec2(i, 7.31)) * 1.6 - 0.15;
    float sh = 0.12 + hash(vec2(i, 13.7)) * 0.22;
    float sb = 0.18 + hash(vec2(i, 23.1)) * 0.08;

    float wind_sway = (noise2(vec2(sx + t * 0.3, t * 0.2)) - 0.5) * (uv.y - sb) * 0.25;
    float dx = aspect_uv.x - sx - wind_sway;
    float st = sb + sh;

    if (uv.y > sb && uv.y < st && abs(dx) < 0.003) {
      float stem_t = (uv.y - sb) / sh;
      col = mix(STEM_GREEN * 0.5, STEM_GREEN, stem_t);
    }

    // Flowers during bloom
    if (season > 0.15 && season < 0.65 && uv.y > sb && uv.y < st) {
      float bloom_p = clamp((season - 0.15) / 0.35, 0.0, 1.0);
      float flower_t = (uv.y - sb) / sh;

      if (flower_t < bloom_p && abs(dx) < 0.007) {
        float fi = 1.0 - abs(flower_t - bloom_p * 0.6) * 4.0;
        fi = clamp(fi, 0.0, 1.0);
        if (flower_t < bloom_p - 0.35) {
          col = mix(col, STEM_GREEN * 1.2, 0.4);
        } else {
          float pn = noise2(vec2(dx * 150.0, uv.y * 80.0 + t * 0.5));
          col = mix(col, mix(MAGENTA, DEEP_PURPLE, pn * 0.3), fi * 0.85);
        }
      }
    }
  }

  // Seeds
  if (season > 0.55 && season < 0.85) {
    float sp = (season - 0.55) / 0.3;
    for (float s = 0.0; s < 30.0; s++) {
      float birth = hash(vec2(s, 41.7)) * 0.7;
      if (sp > birth) {
        float age = sp - birth;
        float seed_x = hash(vec2(s, 53.2)) * 1.4;
        float seed_y = 0.28 + hash(vec2(s, 67.9)) * 0.12;
        vec2 w = curlNoise(vec2(seed_x, seed_y), t);
        seed_x += w.x * age * 4.0 + sin(age * 12.0 + s) * 0.015;
        seed_y += age * 0.25 + w.y * age;
        float sd = length(aspect_uv - vec2(seed_x, seed_y));
        if (sd < 0.003) {
          float sa = max(1.0 - age * 1.8, 0.0);
          col = mix(col, vec3(0.95, 0.92, 0.88), sa * 0.7);
        }
      }
    }
  }

  return vec4(col * (1.0 - 0.25 * length(uv - 0.5)), 1.0);
}

// --- Mode 2: Generative Seed Art ---

vec4 seedArt(vec2 uv, float t) {
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = uv * aspect;
  vec3 col = vec3(0.035, 0.025, 0.04);

  float total = 0.0;
  for (float seed = 0.0; seed < 150.0; seed++) {
    vec2 origin = vec2(0.5 * aspect.x, 0.5);
    origin += (vec2(hash(vec2(seed, 1.0)), hash(vec2(seed, 2.0))) - 0.5) * 0.04;

    float birth = hash(vec2(seed, 3.0)) * 18.0;
    float age = mod(t - birth, 18.0);
    if (age < 0.0) continue;

    vec2 pos = origin;
    float dt_step = 0.06;
    for (float step = 0.0; step < 50.0; step++) {
      float st = step * dt_step;
      if (st > age) break;
      vec2 flow = curlNoise(pos * 2.5, t * 0.15 + seed * 0.1);
      flow += vec2(0.015, 0.008);
      pos += flow * dt_step;
      float d = length(p - pos);
      if (d < 0.005) {
        total += exp(-d * 400.0) * 0.12 * exp(-st * 0.08);
      }
    }
  }

  vec3 trail = mix(MAGENTA, vec3(0.92, 0.82, 0.92), clamp(total * 2.5, 0.0, 1.0));
  col = mix(col, trail, clamp(total, 0.0, 1.0));

  // Center glow
  col += DEEP_PURPLE * exp(-length(p - vec2(0.5 * aspect.x, 0.5)) * 6.0) * 0.4;

  return vec4(col, 1.0);
}

// --- Mode 3: Explosion and Rebirth ---

vec4 explosionRebirth(vec2 uv, float t) {
  float phase = mod(t / 20.0, 1.0);
  vec3 col = vec3(0.02);

  if (phase < 0.3) {
    // Explosion expanding
    float ep = phase / 0.3;
    float radius = ep * 0.35;
    vec2 center = vec2(0.0, 0.1);
    float d = length(uv - center);

    if (d < radius) {
      float nd = d / radius;
      float disp = fbm3(vec3(normalize(uv - center) * 4.0, t * 2.0));
      float temp = mix(9000.0, 600.0, nd + ep * 0.6) + disp * 1500.0;
      col = blackbody(temp) * (1.0 - nd) * (1.0 - ep * 0.5);
    }

    // Debris
    for (float i = 0.0; i < 20.0; i++) {
      float angle = hash(vec2(i, 7.7)) * 6.283;
      float speed = 0.2 + hash(vec2(i, 13.3)) * 0.4;
      vec2 dp = center + vec2(cos(angle), sin(angle)) * speed * ep;
      float dd = length(uv - dp);
      if (dd < 0.005) {
        col += blackbody(3000.0) * exp(-ep * 2.0) * 0.8;
      }
    }
  } else if (phase < 0.5) {
    // Cooling, smoke
    float sp = (phase - 0.3) / 0.2;
    float smoke_turb = fbm(uv * 3.0 + vec2(0, t * 0.3));
    float smoke_shape = exp(-length(uv - vec2(0.0, 0.1 + sp * 0.2)) * 3.0);
    col = vec3(0.12 + smoke_turb * 0.08) * smoke_shape * (1.0 - sp * 0.5);
  } else {
    // Rebirth: fireweed grows from the explosion site
    float rp = (phase - 0.5) / 0.5;

    // Ash ground
    col = vec3(0.06, 0.05, 0.04);

    // Growing stems
    for (float i = 0.0; i < 8.0; i++) {
      float sx = (hash(vec2(i, 31.1)) - 0.5) * 0.3;
      float max_h = 0.05 + hash(vec2(i, 37.7)) * 0.25;
      float grow_delay = hash(vec2(i, 43.3)) * 0.4;
      float grow = clamp((rp - grow_delay) / (1.0 - grow_delay), 0.0, 1.0);
      float sh = max_h * grow;
      float sb = -0.15;

      float wind = sin(t * 1.5 + i) * 0.01 * grow;
      float dx = uv.x - sx - wind * (uv.y - sb);

      if (uv.y > sb && uv.y < sb + sh) {
        // Stem
        if (abs(dx) < 0.002) {
          col = STEM_GREEN * (0.5 + 0.5 * (uv.y - sb) / sh);
        }
        // Flower (only when fully grown)
        if (grow > 0.8 && abs(dx) < 0.006) {
          float ft = (uv.y - sb) / sh;
          float bloom = clamp((grow - 0.8) / 0.2, 0.0, 1.0);
          if (ft > 0.5 && ft < 0.5 + bloom * 0.5) {
            float pn = noise2(vec2(dx * 100.0, uv.y * 60.0));
            col = mix(MAGENTA, DEEP_PURPLE, pn * 0.3);
          }
        }
      }
    }

    // Subtle star background above
    if (uv.y > 0.0) {
      col += step(0.998, hash(floor(uv * 250.0))) * vec3(0.5, 0.55, 0.7) * 0.3;
    }
  }

  return vec4(col, 1.0);
}

// --- Main ---

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec2 uv01 = gl_FragCoord.xy / u_resolution;
  vec2 aspect_uv = vec2(uv01.x * u_resolution.x / u_resolution.y, uv01.y);

  // 80-second total cycle, 20 seconds per mode
  float cycle = mod(u_time, 80.0);
  int mode = int(cycle / 20.0);

  // Cross-fade between modes (last 2 seconds of each 20-second block)
  float mode_t = mod(cycle, 20.0);
  float fade = smoothstep(18.0, 20.0, mode_t);

  vec4 current, next;

  if (mode == 0) {
    current = rocketExhaust(uv, u_time);
    next = fireweedMeadow(uv01, aspect_uv, u_time);
  } else if (mode == 1) {
    current = fireweedMeadow(uv01, aspect_uv, u_time);
    next = seedArt(uv01, u_time);
  } else if (mode == 2) {
    current = seedArt(uv01, u_time);
    next = explosionRebirth(uv, u_time);
  } else {
    current = explosionRebirth(uv, u_time);
    next = rocketExhaust(uv, u_time);
  }

  fragColor = mix(current, next, fade);
}
