// vehicle.js — PNW Forest Ecosystem with Real-Time Science Data
// Seeds arrive on Paine Field wind. Rain waters them. Sun and moon
// track across the sky. Plants grow via L-systems with genetic mutation.
// All weather from NOAA KPAE (Everett/Snohomish County).
// Sun/moon computed astronomically for 47.9°N 122.3°W.

var vehicles = [];
var food = [];
var poison = [];
var pheromones = [];
var spores = [];
var slimeMold = null; // Physarum polycephalum network
var plants = [];
var seeds = [];
var raindrops = [];
var fireflies = [];
var stars = [];
var shootingStars = [];
var grasses = [];
var groundMoisture = 0; // 0=dry, 1=saturated
var puddles = [];
var leafLitter = [];

var debug;
var cnv;
var frameNum = 0;
var season = 0;

// === REAL-TIME WEATHER STATE ===
var wx = {
  temp: 10,         // °C
  windSpeed: 5,     // km/h
  windDir: 180,     // degrees (0=N, 90=E, 180=S, 270=W)
  windGust: 0,
  humidity: 70,     // %
  pressure: 1013,   // hPa
  dewpoint: 5,
  visibility: 16000, // meters
  precip: 0,        // mm/h
  description: 'Clear',
  isRaining: false,
  loaded: false,
  stationName: 'KPAE',
};

// === FEATURE FLAGS (default OFF; see Phase 681 of v1.49.568 Nonlinear Frontier) ===
var featureFlags = {
  microphysics: false,   // Köhler droplet activation — www/tibsfox/com/Research/forest/microphysics.js
  k41Turbulence: false,  // K41 sub-grid turbulence — ships in Plan 02
};

// === MICROPHYSICS STATE (populated each draw() when featureFlags.microphysics is true) ===
var microState = {
  activatedFraction: 0,   // 0..1 cloud-droplet activation fraction from Köhler
  lastUpdate: 0,          // frameNum of last recompute
};

// === CELESTIAL STATE ===
var sky = {
  sunAlt: 0,    // altitude in degrees (-90 to 90)
  sunAz: 180,   // azimuth in degrees
  moonAlt: 0,
  moonAz: 0,
  moonPhase: 0, // 0=new, 0.5=full, 1=new
  isDay: true,
  skyBright: 0.5,
};

// Paine Field coordinates
var LAT = 47.9063;
var LON = -122.2816;

// === FOG STATE ===
var fog = { density: 0, spread: 10 };

// === AURORA STATE ===
var aurora = { kp: 0, active: false, lastFetch: 0 };

// === CIRCADIAN ACTIVITY MULTIPLIER ===
// Returns activity level (0-2) for a species based on sun altitude and activity pattern
// Dawn chorus: birds sing most at civil twilight (sun alt -6 to +3)
// Musical harmonic: activity follows a sinusoidal curve, period matched to species energy level
function circadianMultiplier(speciesData) {
  var sunAlt = sky.sunAlt;
  var pattern = speciesData.active || 'diurnal';
  var base, dawn;

  if (pattern === 'diurnal') {
    // Active during day, quiet at night. Dawn boost = ii-V-I approach (tension → resolve)
    base = constrain(map(sunAlt, -12, 20, 0.05, 1.0), 0.05, 1.0);
    // Dawn chorus boost (sun alt -6 to +6 = the "V chord" — peak tension before the day resolves)
    dawn = (sunAlt > -8 && sunAlt < 8) ? speciesData.dawnBoost || 1.0 : 1.0;
  } else if (pattern === 'nocturnal') {
    // Active at night, rest during day. Tritone substitution: inverted diurnal
    base = constrain(map(sunAlt, -6, 15, 1.0, 0.05), 0.05, 1.0);
    dawn = 1.0;
  } else if (pattern === 'crepuscular') {
    // Peak at twilight (dawn + dusk). Polyrhythmic: two peaks per cycle
    var twilight = abs(sunAlt) < 10 ? constrain(map(abs(sunAlt), 10, 0, 0.5, 1.5), 0.5, 1.5) : 0.3;
    base = twilight;
    dawn = speciesData.dawnBoost || 1.5;
  } else {
    // 'always' — constant (mycelia)
    base = 1.0; dawn = 1.0;
  }

  // Energy level modulates amplitude (E=5 → more dynamic range, E=1 → steady)
  var energyMod = 0.7 + (speciesData.energy || 3) * 0.06;
  return base * dawn * energyMod;
}

// === DEPTH PERSPECTIVE ===
function depthScale(y) { var t = y / height; return 0.2 + 0.8 * t * t; }
function depthAlpha(y) { return 0.35 + 0.65 * (y / height); }

// === ASTRONOMY — Sun & Moon position ===
function computeSunPosition(date) {
  var JD = date.getTime() / 86400000 + 2440587.5;
  var n = JD - 2451545.0;
  var L = (280.460 + 0.9856474 * n) % 360;
  var g = (357.528 + 0.9856003 * n) % 360;
  if (L < 0) L += 360; if (g < 0) g += 360;
  var gR = g * Math.PI / 180;
  var lambda = L + 1.915 * Math.sin(gR) + 0.020 * Math.sin(2 * gR);
  var eps = 23.439 - 0.0000004 * n;
  var lambdaR = lambda * Math.PI / 180;
  var epsR = eps * Math.PI / 180;
  var ra = Math.atan2(Math.cos(epsR) * Math.sin(lambdaR), Math.cos(lambdaR));
  var dec = Math.asin(Math.sin(epsR) * Math.sin(lambdaR));

  var GMST = (280.46061837 + 360.98564736629 * n) % 360;
  if (GMST < 0) GMST += 360;
  var LST = (GMST + LON) % 360;
  var HA = (LST - ra * 180 / Math.PI) % 360;
  if (HA < 0) HA += 360;
  if (HA > 180) HA -= 360;
  var HAr = HA * Math.PI / 180;
  var latR = LAT * Math.PI / 180;

  var alt = Math.asin(Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(HAr));
  var az = Math.atan2(-Math.sin(HAr), Math.tan(dec) * Math.cos(latR) - Math.sin(latR) * Math.cos(HAr));
  return { alt: alt * 180 / Math.PI, az: (az * 180 / Math.PI + 360) % 360 };
}

function computeMoonPosition(date) {
  var JD = date.getTime() / 86400000 + 2440587.5;
  var T = (JD - 2451545.0) / 36525;
  var Lp = (218.3165 + 481267.8813 * T) % 360;
  var M  = (357.5291 + 35999.0503 * T) % 360;
  var Mp = (134.9634 + 477198.8676 * T) % 360;
  var D  = (297.8502 + 445267.1115 * T) % 360;
  var F  = (93.2720 + 483202.0175 * T) % 360;
  if (Lp < 0) Lp += 360;
  var MpR = Mp * Math.PI / 180, DR = D * Math.PI / 180, FR = F * Math.PI / 180;
  var lon = Lp + 6.289 * Math.sin(MpR) + 1.274 * Math.sin(2*DR - MpR) + 0.658 * Math.sin(2*DR);
  var lat = 5.128 * Math.sin(FR);
  var eps = 23.439 - 0.0000004 * (JD - 2451545.0);
  var lonR = lon * Math.PI / 180, latR2 = lat * Math.PI / 180, epsR = eps * Math.PI / 180;
  var ra = Math.atan2(Math.sin(lonR) * Math.cos(epsR) - Math.tan(latR2) * Math.sin(epsR), Math.cos(lonR));
  var dec = Math.asin(Math.sin(latR2) * Math.cos(epsR) + Math.cos(latR2) * Math.sin(epsR) * Math.sin(lonR));

  var n2 = JD - 2451545.0;
  var GMST = (280.46061837 + 360.98564736629 * n2) % 360;
  if (GMST < 0) GMST += 360;
  var LST = (GMST + LON) % 360;
  var HA = (LST - ra * 180 / Math.PI) % 360;
  if (HA < 0) HA += 360; if (HA > 180) HA -= 360;
  var HAr = HA * Math.PI / 180;
  var latR = LAT * Math.PI / 180;
  var alt = Math.asin(Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(HAr));
  var az = Math.atan2(-Math.sin(HAr), Math.tan(dec) * Math.cos(latR) - Math.sin(latR) * Math.cos(HAr));

  // Moon phase (simple synodic)
  var synodicMonth = 29.53059;
  var refNewMoon = 2451550.1; // Jan 6 2000 new moon
  var phase = ((JD - refNewMoon) % synodicMonth) / synodicMonth;
  if (phase < 0) phase += 1;

  return { alt: alt * 180 / Math.PI, az: (az * 180 / Math.PI + 360) % 360, phase: phase };
}

function updateCelestial() {
  var now = new Date();
  var sun = computeSunPosition(now);
  sky.sunAlt = sun.alt;
  sky.sunAz = sun.az;
  sky.isDay = sun.alt > -6; // civil twilight
  sky.skyBright = constrain(map(sun.alt, -12, 45, 0, 1), 0, 1);

  var moon = computeMoonPosition(now);
  sky.moonAlt = moon.alt;
  sky.moonAz = moon.az;
  sky.moonPhase = moon.phase;
}

// === FETCH WEATHER ===
function fetchWeather() {
  var url = 'https://api.weather.gov/stations/KPAE/observations/latest';
  // Use fetch if available (modern browsers), XMLHttpRequest fallback
  if (typeof fetch !== 'undefined') {
    fetch(url, {headers:{'Accept':'application/geo+json'}})
      .then(function(r){return r.json()})
      .then(function(d){
        var p = d.properties || {};
        if (p.temperature && p.temperature.value !== null) wx.temp = p.temperature.value;
        if (p.windSpeed && p.windSpeed.value !== null) wx.windSpeed = p.windSpeed.value;
        if (p.windDirection && p.windDirection.value !== null) wx.windDir = p.windDirection.value;
        if (p.windGust && p.windGust.value !== null) wx.windGust = p.windGust.value;
        if (p.relativeHumidity && p.relativeHumidity.value !== null) wx.humidity = p.relativeHumidity.value;
        if (p.barometricPressure && p.barometricPressure.value !== null) {
          wx._prevPressure = wx.pressure; // track delta for behavioral prediction
          wx.pressure = p.barometricPressure.value / 100;
        }
        if (p.dewpoint && p.dewpoint.value !== null) wx.dewpoint = p.dewpoint.value;
        if (p.visibility && p.visibility.value !== null) wx.visibility = p.visibility.value;
        if (p.precipitationLastHour && p.precipitationLastHour.value !== null) wx.precip = p.precipitationLastHour.value;
        if (p.textDescription) wx.description = p.textDescription;
        wx.isRaining = /rain|drizzle|shower|thunder/i.test(wx.description);
        wx.loaded = true;
      })
      .catch(function(){wx.loaded = true}); // fail silently, use defaults
  }
}

// Fox watercolor palette
var PAL = {
  foxDeep:   [158, 68, 37], fox:       [199, 91, 58],
  foxWarm:   [212,130, 58], amber:     [232,152, 72],
  foxLight:  [240,192,112], canopy:    [ 26, 58, 42],
  forest:    [ 45, 90, 58], moss:      [ 76,175, 80],
  fern:      [ 74,124, 63], river:     [ 30,108,160],
  lichen:    [192, 57, 43], soil:      [ 92, 64, 51],
  gold:      [196,163, 90], cosmic:    [142, 36,170],
  bark:      [ 62, 44, 34],
};

// === L-SYSTEM PLANTS ===
// Types informed by NASA organism pairings and PNW ecology research
var PLANT_TYPES = [
  { name:'fern',     col:[45,90,58],   angle:25, shrink:0.72, maxDepth:5, width:1.5, rules:'F[+F]F[-F]F',             shade:true,  pioneer:false }, // Polystichum munitum (v1.2)
  { name:'cedar',    col:[26,58,42],   angle:20, shrink:0.78, maxDepth:6, width:2.0, rules:'FF+[+F-F-F]-[-F+F+F]',    shade:true,  pioneer:false }, // Thuja plicata — hub tree
  { name:'moss',     col:[76,175,80],  angle:35, shrink:0.6,  maxDepth:4, width:0.8, rules:'F[+F][-F]',               shade:true,  pioneer:false }, // Hylocomium splendens
  { name:'alder',    col:[74,124,63],  angle:22, shrink:0.75, maxDepth:5, width:1.2, rules:'F[+F]F[-F][F]',           shade:false, pioneer:true  }, // Alnus rubra — nitrogen fixer
  { name:'fireweed', col:[60,100,50],  angle:12, shrink:0.85, maxDepth:7, width:0.7, rules:'FF[+F][-F]',              shade:false, pioneer:true, bloom:true }, // Chamerion angustifolium (v1.1)
  // Fireweed: 80K seeds/plant, 0.3 m/s terminal velocity, progressive bottom-to-top bloom,
  // pioneer colonizer on disturbed ground, obligate sun, 0.5-3m tall, magenta raceme flowers
];

function Plant(x, y, typeIdx, parentDna) {
  this.x = x;
  this.y = y !== undefined ? y : height;
  this.type = typeIdx !== undefined ? typeIdx : floor(random(PLANT_TYPES.length));
  this.pt = PLANT_TYPES[this.type];
  this.growth = 0;
  this.maxGrowth = 1.0;
  this.segments = [];
  this.age = 0;
  this.seedTimer = 0;
  this.hasSeedlings = 0;
  this.waterLevel = 0; // accumulated rain

  if (parentDna) {
    this.dna = {
      angleVar: parentDna.angleVar + random(-3, 3),
      baseLen:  constrain(parentDna.baseLen + random(-4, 4), 10, 55),
      shrinkMod: constrain(parentDna.shrinkMod + random(-0.03, 0.03), -0.15, 0.15),
      colShift: [
        constrain(parentDna.colShift[0] + floor(random(-6, 6)), -25, 25),
        constrain(parentDna.colShift[1] + floor(random(-6, 6)), -25, 25),
        constrain(parentDna.colShift[2] + floor(random(-6, 6)), -25, 25),
      ],
    };
  } else {
    this.dna = {
      angleVar: random(-5, 5),
      baseLen: random(18, 45),
      shrinkMod: random(-0.05, 0.05),
      colShift: [floor(random(-12,12)), floor(random(-12,12)), floor(random(-12,12))],
    };
  }

  var ds = depthScale(this.y);
  this.baseLen = this.dna.baseLen * ds;

  this.lstring = 'F';
  var maxGens = max(2, floor(this.pt.maxDepth * ds));
  for (var gen = 0; gen < maxGens; gen++) {
    var next = '';
    for (var c = 0; c < this.lstring.length; c++) {
      if (this.lstring[c] === 'F') next += this.pt.rules;
      else next += this.lstring[c];
    }
    this.lstring = next;
    if (this.lstring.length > 1500) break;
  }

  this.computeSegments = function() {
    this.segments = [];
    var stack = [];
    var cx = this.x, cy = this.y;
    var ang = -90;
    var len = this.baseLen * this.growth;
    var depth = 0;
    var maxSeg = floor(this.lstring.length * this.growth);
    var angVar = this.dna.angleVar;
    var shrk = this.pt.shrink + this.dna.shrinkMod;
    // Wind bends the plant
    var windBend = (wx.windSpeed / 50) * cos(radians(wx.windDir)) * 3;

    for (var i = 0; i < maxSeg && i < this.lstring.length; i++) {
      var ch = this.lstring[i];
      if (ch === 'F') {
        var segLen = len * pow(shrk, depth);
        var nx = cx + cos(radians(ang + windBend * depth * 0.3)) * segLen;
        var ny = cy + sin(radians(ang)) * segLen;
        nx += random(-0.3, 0.3);
        ny += random(-0.2, 0.2);
        this.segments.push({x1:cx, y1:cy, x2:nx, y2:ny, depth:depth});
        cx = nx; cy = ny;
      } else if (ch === '+') { ang += this.pt.angle + angVar + random(-2, 2);
      } else if (ch === '-') { ang -= this.pt.angle + angVar + random(-2, 2);
      } else if (ch === '[') { stack.push({x:cx, y:cy, a:ang, d:depth}); depth++;
      } else if (ch === ']') { var st = stack.pop(); if (st) { cx=st.x; cy=st.y; ang=st.a; depth=st.d; } }
    }
  };

  this.update = function() {
    this.age++;
    // Growth rate depends on temperature, water, and daylight
    var tempFactor = constrain(map(wx.temp, -5, 25, 0.2, 1.0), 0, 1);
    var waterFactor = constrain(map(this.waterLevel, 0, 10, 0.3, 1.0), 0, 1);
    var lightFactor = sky.isDay ? (0.5 + sky.skyBright * 0.5) : 0.1;
    var rate = 0.00003 * tempFactor * waterFactor * lightFactor;
    if (this.growth < this.maxGrowth) this.growth = min(this.growth + rate, this.maxGrowth);
    this.waterLevel = max(0, this.waterLevel - 0.005); // evaporation
    if (this.age % 200 === 0 && this.growth < 1.0) this.computeSegments();
    // Food from mature plants
    if (this.growth > 0.5 && random(1) < 0.001) {
      var tip = this.segments.length > 0 ? this.segments[floor(random(this.segments.length))] : null;
      if (tip) food.push(createVector(tip.x2 + random(-6, 6), tip.y2 + random(-6, 6)));
    }
    // Seed dispersal
    this.seedTimer++;
    if (this.growth > 0.7 && this.seedTimer > 800 && this.hasSeedlings < 3 && random(1) < 0.001) {
      this.seedTimer = 0;
      this.hasSeedlings++;
      var windRad = radians(wx.windDir);
      var windStr = wx.windSpeed / 5;
      seeds.push({
        x: this.x, y: this.y,
        vx: cos(windRad) * windStr * random(0.3, 1.0) + random(-0.5, 0.5),
        vy: sin(windRad) * windStr * random(0.2, 0.5) - random(0.1, 0.5),
        type: this.type, dna: this.dna,
        life: 400 + floor(random(300)),
        grounded: false,
      });
    }
  };

  this.display = function() {
    if (this.segments.length === 0) return;
    var c = this.pt.col;
    var cs = this.dna.colShift;
    var da = depthAlpha(this.y);
    var baseAlpha = (0.45 + this.growth * 0.5) * da;
    // Darken at night — moonlight keeps plants visible
    var moonGlow = sky.moonAlt > 0 ? constrain(map(sky.moonAlt, 0, 40, 0.2, 0.4), 0, 0.4) : 0;
    var nightDim = sky.isDay ? 1.0 : (0.55 + moonGlow);

    for (var i = 0; i < this.segments.length; i++) {
      var s = this.segments[i];
      var ds2 = depthScale(s.y1);
      var w = max(0.2, this.pt.width * pow(this.pt.shrink, s.depth) * ds2);
      var a = baseAlpha * (1 - s.depth * 0.1) * nightDim;
      stroke(constrain(c[0]+cs[0],0,255), constrain(c[1]+cs[1],0,255), constrain(c[2]+cs[2],0,255), a*255);
      strokeWeight(w);
      line(s.x1, s.y1, s.x2, s.y2);
    }
    if (this.growth > 0.3) {
      noStroke();
      var maxD = max(2, floor(this.pt.maxDepth * depthScale(this.y)));
      var isFireweed = this.pt.bloom === true;

      for (var i = 0; i < this.segments.length; i++) {
        var s = this.segments[i];
        if (s.depth >= maxD - 2) {
          if (isFireweed && this.growth > 0.5) {
            // Fireweed progressive bloom — magenta flowers open bottom-to-top
            // The bloom fraction progresses upward as the plant matures
            var segFrac = i / this.segments.length; // 0=base, 1=tip
            var bloomFront = this.growth * 1.2; // how far up the bloom has reached
            if (segFrac < bloomFront) {
              // Open flower — vivid magenta-pink (Chamerion angustifolium)
              var flowerA = (0.25 + this.growth * 0.5) * da * nightDim;
              var flowerSz = (1.8 + this.growth * 1.5) * depthScale(s.y2);
              // Magenta petals with slight variation
              fill(200 + cs[0], 50 + cs[1]*0.3, 120 + cs[2]*0.5, flowerA * 255);
              ellipse(s.x2, s.y2, flowerSz, flowerSz * 0.8);
            } else {
              // Bud — small green at tip (not yet bloomed)
              var budA = 0.12 * da * nightDim;
              fill(80, 120, 60, budA * 255);
              ellipse(s.x2, s.y2, 1.5 * depthScale(s.y2), 2 * depthScale(s.y2));
            }
          } else {
            // Standard leaf rendering for non-fireweed plants
            var leafA = (0.08 + season * 0.15) * this.growth * da * nightDim;
            var leafSz = (1.2 + this.growth) * depthScale(s.y2);
            fill(constrain(c[0]+cs[0]+30,0,255), min(255,constrain(c[1]+cs[1]+40,0,255)), constrain(c[2]+cs[2],0,255), leafA*255);
            ellipse(s.x2, s.y2, leafSz, leafSz);
          }
        }
      }
      // Fireweed seed explosion — when fully grown, massive seed release with pappus
      if (isFireweed && this.growth > 0.9 && this.seedTimer > 400 && random(1) < 0.003 && seeds.length < 80) {
        // 80,000 seeds per plant IRL — we release a burst of 5-10 at once
        var burstSize = floor(random(5, 10));
        for (var b = 0; b < burstSize; b++) {
          var windRad2 = radians(wx.windDir);
          var windStr2 = wx.windSpeed / 5;
          seeds.push({
            x: this.x + random(-5, 5), y: this.y - this.baseLen * this.growth * 0.5,
            vx: cos(windRad2) * windStr2 * random(0.2, 1.2) + random(-0.8, 0.8),
            vy: -random(0.3, 0.8), // pappus lifts initially, terminal velocity ~0.3 m/s
            type: this.type, dna: this.dna,
            life: 600 + floor(random(500)), // fireweed seeds travel far
            grounded: false,
          });
        }
        this.seedTimer = 0;
        this.hasSeedlings++;
      }
    }
  };

  this.computeSegments();
}

// === PNW BIRD SPECIES (from Seattle 360 Engine + AVI taxonomy) ===
// Each species from a documented S36 degree with real ecological behavior
// Energy levels (E=1-5) from the 360 engine musical energy assignments
// Activity patterns: diurnal, nocturnal, crepuscular, always
var mr = 0.02;
var SPECIES = [
  // deg 49: Fox Sparrow — ground scratcher, seed eater, thick underbrush, folk-punk E=3
  { name:'Fox Sparrow',             col:[139,90,60],  sz:1.3, spd:2.0, frc:0.06, food:1.0, flee:-1.0, social:0.4, trail:12, shape:'tri',
    energy:3, active:'diurnal', dawnBoost:1.3, latin:'Passerella iliaca' },
  // deg 27: Violet-green Swallow — aerial insectivore, fast, colonial, social
  { name:'Violet-green Swallow',    col:[40,130,90],  sz:0.8, spd:3.5, frc:0.10, food:0.5, flee:-0.3, social:0.8, trail:25, shape:'dart',
    energy:4, active:'diurnal', dawnBoost:1.0, latin:'Tachycineta thalassina' },
  // deg 4: Spotted Owl — nocturnal apex, territorial, old-growth specialist
  { name:'Spotted Owl',             col:[80,65,50],   sz:2.2, spd:1.8, frc:0.05, food:0.3, flee:-2.5, social:0.1, trail:4,  shape:'diamond',
    energy:2, active:'nocturnal', dawnBoost:0.3, latin:'Strix occidentalis' },
  // Mycorrhizal network — Armillaria ostoyae (NASA v1.0), underground fungal network
  { name:'Mycelia',                 col:PAL.gold,     sz:0.7, spd:0.9, frc:0.03, food:0.7, flee:-0.2, social:1.2, trail:35, shape:'circle',
    energy:1, active:'always', dawnBoost:1.0, latin:'Armillaria ostoyae' },
  // deg 2: Varied Thrush — forest floor, haunting single-note song, crepuscular
  { name:'Varied Thrush',           col:[200,120,40], sz:1.5, spd:1.6, frc:0.05, food:0.9, flee:-1.5, social:0.5, trail:8,  shape:'tri',
    energy:2, active:'crepuscular', dawnBoost:2.0, latin:'Ixoreus naevius' },
  // deg 36: Anna's Hummingbird — tiny, territorial, fastest bird, nectar, year-round PNW
  { name:'Annas Hummingbird',       col:[180,40,80],  sz:0.5, spd:4.2, frc:0.12, food:0.6, flee:-0.1, social:0.0, trail:30, shape:'dart',
    energy:5, active:'diurnal', dawnBoost:1.5, latin:'Calypte anna' },
  // deg 51: Brown Creeper — bark gleaner, spirals up trunks, tiny, camouflaged
  { name:'Brown Creeper',           col:[110,85,60],  sz:0.6, spd:1.5, frc:0.05, food:0.8, flee:-0.8, social:0.2, trail:18, shape:'tri',
    energy:2, active:'diurnal', dawnBoost:1.2, latin:'Certhia americana' },
];

function Vehicle(x, y, dna, speciesIdx) {
  this.acceleration = createVector(0, 0);
  this.velocity = p5.Vector.random2D().mult(random(0.4, 1.2));
  this.position = createVector(x, y);
  this.species = speciesIdx !== undefined ? speciesIdx : floor(random(SPECIES.length));
  var sp = SPECIES[this.species];
  this.r = sp.sz; this.maxspeed = sp.spd + random(-0.2, 0.2); this.maxforce = sp.frc;
  this.health = 1.5; this.age = 0; this.trail = [];
  this.dna = [];
  if (dna === undefined) {
    this.dna[0]=random(-12,12)*sp.food; this.dna[1]=random(-12,12)*sp.flee;
    this.dna[2]=random(20,100); this.dna[3]=random(20,100);
    this.dna[4]=random(0.3,2.5)*sp.social; this.dna[5]=random(25,70);
  } else { for(var i=0;i<dna.length;i++){this.dna[i]=dna[i];if(random(1)<mr){if(i<2)this.dna[i]+=random(-0.4,0.4);else if(i<4)this.dna[i]+=random(-8,8);else if(i===4)this.dna[i]+=random(-0.15,0.15);else this.dna[i]+=random(-4,4)}} }

  this.update = function() {
    this.health -= 0.004 + this.age * 0.000008;
    this.age++;
    // Circadian rhythm — activity level from sun position + species pattern
    var sp = SPECIES[this.species];
    var circadian = circadianMultiplier(sp);
    this.currentActivity = circadian; // store for display alpha
    // Barometric pressure effect — falling pressure = more active foraging (storm approaching)
    var pressureDelta = wx.pressure - (wx._prevPressure || wx.pressure);
    var pressureMod = pressureDelta < -0.5 ? 1.3 : pressureDelta > 0.5 ? 0.85 : 1.0;
    // Wind affects movement
    var windRad = radians(wx.windDir);
    var windF = wx.windSpeed / 200;
    this.acceleration.add(createVector(cos(windRad)*windF, sin(windRad)*windF));
    var effectiveSpeed = this.maxspeed * circadian * pressureMod;
    this.velocity.add(this.acceleration); this.velocity.limit(effectiveSpeed);
    this.position.add(this.velocity); this.acceleration.mult(0);
    if (frameNum%2===0){this.trail.push({x:this.position.x,y:this.position.y});if(this.trail.length>SPECIES[this.species].trail)this.trail.shift()}
  };
  this.applyForce = function(f){this.acceleration.add(f)};
  this.behaviors = function(good,bad,others){
    var sg=this.eat(good,0.12,this.dna[2]),sb=this.eat(bad,-0.7,this.dna[3]);
    sg.mult(this.dna[0]);sb.mult(this.dna[1]);this.applyForce(sg);this.applyForce(sb);
    if(this.dna[4]>0.1){var s=this.flock(others);s.mult(this.dna[4]*0.08);this.applyForce(s)}
  };
  this.flock = function(others){var sum=createVector(0,0),c=0,p=this.dna[5];for(var i=0;i<others.length;i++){if(others[i]===this)continue;var d=this.position.dist(others[i].position);if(d<p&&others[i].species===this.species){sum.add(others[i].position);c++}}if(c>0){sum.div(c);return this.seek(sum)}return createVector(0,0)};
  this.eat = function(list,nut,perc){
    // Fog reduces perception radius — birds can't see as far
    var fogMod = constrain(1.0 - fog.density * 0.6, 0.3, 1.0);
    var effPerc = perc * fogMod;
    var rec=Infinity,cl=null;for(var i=list.length-1;i>=0;i--){var d=this.position.dist(list[i]);if(d<this.maxspeed+2){list.splice(i,1);this.health+=nut;this.health=min(this.health,2.5);if(nut>0)pheromones.push({x:this.position.x,y:this.position.y,life:150,species:this.species})}else if(d<rec&&d<effPerc){rec=d;cl=list[i]}}if(cl!==null)return this.seek(cl);return createVector(0,0)};
  this.seek = function(t){var d=p5.Vector.sub(t,this.position);d.setMag(this.maxspeed);var s=p5.Vector.sub(d,this.velocity);s.limit(this.maxforce);return s};
  this.clone = function(){if(random(1)<0.002&&this.health>0.8&&vehicles.length<250)return new Vehicle(this.position.x+random(-4,4),this.position.y+random(-4,4),this.dna,this.species);return null};
  this.dead = function(){return this.health<0};
  this.boundaries = function(){var d=20,des=null;if(this.position.x<d)des=createVector(this.maxspeed,this.velocity.y);else if(this.position.x>width-d)des=createVector(-this.maxspeed,this.velocity.y);if(this.position.y<d)des=createVector(this.velocity.x,this.maxspeed);else if(this.position.y>height-d)des=createVector(this.velocity.x,-this.maxspeed);if(des!==null){des.normalize().mult(this.maxspeed);var s=p5.Vector.sub(des,this.velocity);s.limit(this.maxforce);this.applyForce(s)}};
  this.display = function(){
    var sp=SPECIES[this.species],angle=this.velocity.heading()+PI/2;
    var h2=constrain(this.health,0,2),bright=map(h2,0,2,0.25,1.0);
    var c=sp.col,ds=depthScale(this.position.y),da=depthAlpha(this.position.y);
    var nightDim = sky.isDay ? 1.0 : (0.5 + (sky.moonAlt > 0 ? 0.2 : 0));
    if(this.trail.length>1){noFill();for(var t=0;t<this.trail.length-1;t++){var ta=(t/this.trail.length)*0.1*da*nightDim;stroke(c[0],c[1],c[2],ta*255);strokeWeight(0.4*ds);line(this.trail[t].x,this.trail[t].y,this.trail[t+1].x,this.trail[t+1].y)}}
    push();translate(this.position.x,this.position.y);rotate(angle);scale(ds);
    fill(c[0]*bright,c[1]*bright,c[2]*bright,da*nightDim*255);stroke(c[0],c[1],c[2],60*da*nightDim);strokeWeight(0.4);
    var r=this.r;
    if(sp.shape==='tri'){beginShape();vertex(0,-r*2.5);vertex(-r*1.2,r*2);vertex(r*1.2,r*2);endShape(CLOSE)}
    else if(sp.shape==='dart'){beginShape();vertex(0,-r*3);vertex(-r*0.5,r*1.5);vertex(0,r*0.6);vertex(r*0.5,r*1.5);endShape(CLOSE)}
    else if(sp.shape==='diamond'){beginShape();vertex(0,-r*2);vertex(-r*2,0);vertex(0,r*2);vertex(r*2,0);endShape(CLOSE)}
    else if(sp.shape==='circle'){ellipse(0,0,r*2.5,r*2.5)}
    pop();
  };
}

// === SLIME MOLD — Physarum polycephalum network optimization ===
// Intelligence without a brain. A single cell that solves shortest-path
// problems through cytoplasmic streaming and chemotaxis.
// Lifecycle: spore → amoeba → plasmodium (network phase) → fruiting body
// Active when moisture is high. Forms transport networks between food sources.
// Streaming oscillation period: ~2 min IRL, ~120 frames in sim.

function SlimeMold() {
  this.nodes = [];      // network nodes (food sources the mold has found)
  this.edges = [];      // transport tubes between nodes {a, b, flow, age}
  this.fronts = [];     // exploring pseudopod tips
  this.mass = 0;        // total biomass (controls max network size)
  this.phase = 'dormant'; // dormant | exploring | network | fruiting
  this.fruitBodies = []; // sporangia when drying out
  this.pulsePhase = 0;  // cytoplasmic streaming oscillation

  this.activate = function(x, y) {
    // Spore germinates — start exploring from a point
    this.phase = 'exploring';
    this.mass = 0.5;
    this.fronts.push({ x: x, y: y, vx: 0, vy: 0, life: 600, trail: [] });
  };

  this.update = function() {
    if (this.phase === 'dormant') return;

    // Moisture dependency — slime mold needs wet conditions
    var moistureOk = groundMoisture > 0.3 || wx.isRaining || wx.humidity > 80;
    if (!moistureOk && this.phase !== 'fruiting') {
      // Drying out — trigger sporulation
      if (this.nodes.length > 0 && random(1) < 0.01) {
        this.phase = 'fruiting';
        for (var i = 0; i < this.nodes.length; i++) {
          if (random(1) < 0.4) {
            this.fruitBodies.push({
              x: this.nodes[i].x, y: this.nodes[i].y,
              age: 0, type: floor(random(3)), // 0=Physarum yellow, 1=Lycogala pink, 2=Stemonitis brown
            });
          }
        }
      }
      return;
    }

    // Reactivate from fruiting if moisture returns
    if (this.phase === 'fruiting' && moistureOk) {
      this.phase = this.nodes.length > 2 ? 'network' : 'exploring';
      this.fruitBodies = [];
    }

    this.pulsePhase += 0.052; // ~120 frame period for cytoplasmic streaming

    // === EXPLORING PHASE — pseudopod tips search for food ===
    for (var i = this.fronts.length - 1; i >= 0; i--) {
      var f = this.fronts[i];
      f.life--;
      if (f.life <= 0) { this.fronts.splice(i, 1); continue; }

      // Chemotaxis: bias movement toward nearest food
      var bestDist = 80, bestFood = null;
      for (var j = 0; j < food.length; j++) {
        var d = dist(f.x, f.y, food[j].x, food[j].y);
        if (d < bestDist) { bestDist = d; bestFood = food[j]; }
      }
      // Also attracted to leaf litter (decomposing material)
      for (var j = 0; j < leafLitter.length; j++) {
        var d2 = dist(f.x, f.y, leafLitter[j].x, leafLitter[j].y);
        if (d2 < bestDist * 0.7) { bestDist = d2; bestFood = leafLitter[j]; }
      }

      if (bestFood) {
        var dx = bestFood.x - f.x, dy = bestFood.y - f.y;
        var mag = Math.sqrt(dx * dx + dy * dy) || 1;
        f.vx += (dx / mag) * 0.15;
        f.vy += (dy / mag) * 0.15;
      } else {
        // Random walk with slight downhill bias (moisture collects low)
        f.vx += random(-0.12, 0.12);
        f.vy += random(-0.05, 0.12);
      }

      // Speed limit — slime molds move 1-4 cm/hr, slow in sim
      var speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
      if (speed > 0.6) { f.vx *= 0.6 / speed; f.vy *= 0.6 / speed; }

      f.x += f.vx; f.y += f.vy;
      f.trail.push({ x: f.x, y: f.y });
      if (f.trail.length > 80) f.trail.shift();

      // Boundary check
      if (f.x < 5 || f.x > width - 5 || f.y < height * 0.3 || f.y > height - 5) {
        f.vx *= -0.5; f.vy *= -0.5;
        f.x = constrain(f.x, 5, width - 5);
        f.y = constrain(f.y, height * 0.3, height - 5);
      }

      // Found food — create network node, consume food
      if (bestFood && bestDist < 5) {
        var nodeExists = false;
        for (var n = 0; n < this.nodes.length; n++) {
          if (dist(this.nodes[n].x, this.nodes[n].y, f.x, f.y) < 15) { nodeExists = true; break; }
        }
        if (!nodeExists) {
          this.nodes.push({ x: f.x, y: f.y, strength: 1.0 });
          this.mass += 0.3;
          // Connect to nearest existing node
          if (this.nodes.length > 1) {
            var nearIdx = -1, nearDist = Infinity;
            for (var n = 0; n < this.nodes.length - 1; n++) {
              var nd = dist(this.nodes[n].x, this.nodes[n].y, f.x, f.y);
              if (nd < nearDist) { nearDist = nd; nearIdx = n; }
            }
            if (nearIdx >= 0) {
              this.edges.push({ a: nearIdx, b: this.nodes.length - 1, flow: 1.0, age: 0 });
            }
          }
        }
        // Spawn new exploring front from this food source
        if (this.fronts.length < 6 && random(1) < 0.5) {
          this.fronts.push({ x: f.x + random(-3, 3), y: f.y + random(-3, 3), vx: random(-0.3, 0.3), vy: random(-0.1, 0.3), life: 500, trail: [] });
        }
        f.life = max(f.life, 300); // finding food extends life
      }
    }

    // === NETWORK PHASE — optimize transport tubes ===
    if (this.nodes.length >= 3 && this.phase === 'exploring') {
      this.phase = 'network';
    }

    if (this.phase === 'network') {
      // Network optimization: strengthen used edges, prune weak ones
      for (var i = this.edges.length - 1; i >= 0; i--) {
        var e = this.edges[i];
        e.age++;
        // Flow follows Murray's law — tubes with more downstream nodes get more flow
        var aConns = 0, bConns = 0;
        for (var j = 0; j < this.edges.length; j++) {
          if (this.edges[j].a === e.a || this.edges[j].b === e.a) aConns++;
          if (this.edges[j].a === e.b || this.edges[j].b === e.b) bConns++;
        }
        e.flow = 0.3 + (aConns + bConns) * 0.15;
        e.flow = min(e.flow, 2.0);

        // Prune edges that are too old with low flow
        if (e.age > 500 && e.flow < 0.5 && this.edges.length > this.nodes.length - 1) {
          this.edges.splice(i, 1);
        }
      }

      // Try to form new shortcut edges (the slime mold finds shorter paths)
      if (frameNum % 60 === 0 && this.nodes.length > 2) {
        var a = floor(random(this.nodes.length));
        var b = floor(random(this.nodes.length));
        if (a !== b) {
          var d = dist(this.nodes[a].x, this.nodes[a].y, this.nodes[b].x, this.nodes[b].y);
          if (d < 80 && d > 20) {
            // Check if edge already exists
            var exists = false;
            for (var j = 0; j < this.edges.length; j++) {
              if ((this.edges[j].a === a && this.edges[j].b === b) || (this.edges[j].a === b && this.edges[j].b === a)) { exists = true; break; }
            }
            if (!exists && this.edges.length < this.nodes.length * 2) {
              this.edges.push({ a: a, b: b, flow: 0.5, age: 0 });
            }
          }
        }
      }

      // Occasionally spawn new exploring fronts from network nodes
      if (this.fronts.length < 3 && random(1) < 0.003 && this.nodes.length > 0) {
        var src = this.nodes[floor(random(this.nodes.length))];
        this.fronts.push({ x: src.x + random(-5, 5), y: src.y + random(-5, 5), vx: random(-0.3, 0.3), vy: random(-0.1, 0.3), life: 400, trail: [] });
      }
    }

    // Node decay — nodes lose strength if no nearby food
    for (var i = this.nodes.length - 1; i >= 0; i--) {
      var hasFood = false;
      for (var j = 0; j < food.length; j++) {
        if (dist(this.nodes[i].x, this.nodes[i].y, food[j].x, food[j].y) < 25) { hasFood = true; break; }
      }
      if (!hasFood) this.nodes[i].strength -= 0.0005;
      if (this.nodes[i].strength <= 0) {
        // Remove edges referencing this node
        for (var e = this.edges.length - 1; e >= 0; e--) {
          if (this.edges[e].a === i || this.edges[e].b === i) this.edges.splice(e, 1);
        }
        // Reindex edges
        for (var e = 0; e < this.edges.length; e++) {
          if (this.edges[e].a > i) this.edges[e].a--;
          if (this.edges[e].b > i) this.edges[e].b--;
        }
        this.nodes.splice(i, 1);
      }
    }

    // Reset to dormant if network collapses
    if (this.nodes.length === 0 && this.fronts.length === 0 && this.phase !== 'fruiting') {
      this.phase = 'dormant';
    }
  };

  this.display = function() {
    if (this.phase === 'dormant') return;

    var nightDim = sky.isDay ? 1.0 : 0.6;
    var pulse = sin(this.pulsePhase) * 0.5 + 0.5; // 0-1 oscillation for streaming

    // === EXPLORING PSEUDOPOD TRAILS ===
    for (var i = 0; i < this.fronts.length; i++) {
      var f = this.fronts[i];
      if (f.trail.length < 2) continue;
      noFill();
      for (var t = 0; t < f.trail.length - 1; t++) {
        var ta = (t / f.trail.length) * 0.35 * nightDim * depthAlpha(f.trail[t].y);
        // Bright yellow — Physarum polycephalum
        stroke(220, 200, 40, ta * 255);
        strokeWeight(0.8 * depthScale(f.trail[t].y));
        line(f.trail[t].x, f.trail[t].y, f.trail[t + 1].x, f.trail[t + 1].y);
      }
      // Pseudopod tip — brighter, pulsing
      var tipAlpha = 0.6 * nightDim * depthAlpha(f.y);
      fill(240, 220, 50, tipAlpha * 255 * (0.7 + pulse * 0.3));
      noStroke();
      ellipse(f.x, f.y, 3 * depthScale(f.y), 3 * depthScale(f.y));
    }

    // === NETWORK EDGES — transport tubes with cytoplasmic streaming ===
    for (var i = 0; i < this.edges.length; i++) {
      var e = this.edges[i];
      if (e.a >= this.nodes.length || e.b >= this.nodes.length) continue;
      var na = this.nodes[e.a], nb = this.nodes[e.b];
      var avgY = (na.y + nb.y) / 2;
      var ea = depthAlpha(avgY) * nightDim;

      // Tube width proportional to flow (Murray's law visualization)
      var w = (0.5 + e.flow * 0.8) * depthScale(avgY);

      // Streaming effect: alternate bright/dim segments along the tube
      var dx = nb.x - na.x, dy = nb.y - na.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var segments = max(3, floor(len / 6));

      for (var s = 0; s < segments; s++) {
        var t0 = s / segments, t1 = (s + 1) / segments;
        var x0 = na.x + dx * t0, y0 = na.y + dy * t0;
        var x1 = na.x + dx * t1, y1 = na.y + dy * t1;
        // Streaming pulse travels along the tube
        var streamPhase = sin(this.pulsePhase + s * 0.8 - i * 0.5);
        var bright = 0.4 + streamPhase * 0.3;
        stroke(220 * bright, 200 * bright, 40 * bright, ea * e.flow * 0.4 * 255);
        strokeWeight(w);
        line(x0, y0, x1, y1);
      }
    }

    // === NETWORK NODES — food source junctions ===
    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i];
      var ds = depthScale(n.y), da = depthAlpha(n.y) * nightDim;
      var nodePulse = 0.6 + sin(this.pulsePhase + i * 1.2) * 0.2;
      fill(240, 220, 50, da * n.strength * nodePulse * 255);
      noStroke();
      ellipse(n.x, n.y, (4 + n.strength * 2) * ds, (4 + n.strength * 2) * ds);
    }

    // === FRUITING BODIES ===
    for (var i = 0; i < this.fruitBodies.length; i++) {
      var fb = this.fruitBodies[i];
      fb.age++;
      var ds = depthScale(fb.y), da = depthAlpha(fb.y);
      var mature = min(1, fb.age / 200);

      if (fb.type === 0) {
        // Physarum — tiny yellow-brown sporangia on stalks
        stroke(180, 160, 60, da * 0.5 * 255); strokeWeight(0.3 * ds);
        line(fb.x, fb.y, fb.x, fb.y - 4 * ds * mature); // stalk
        fill(200, 180, 50, da * mature * 255); noStroke();
        ellipse(fb.x, fb.y - 4 * ds * mature, 2.5 * ds, 2 * ds);
      } else if (fb.type === 1) {
        // Lycogala epidendrum — wolf's milk, pink spheres
        fill(200, 100, 110, da * mature * 255); noStroke();
        ellipse(fb.x, fb.y, 3 * ds, 3 * ds);
        // Darker with age
        if (fb.age > 300) {
          fill(120, 70, 60, da * 0.4 * 255);
          ellipse(fb.x, fb.y, 3 * ds, 3 * ds);
        }
      } else {
        // Stemonitis — chocolate tube, cluster of tiny stalks
        stroke(100, 70, 45, da * 0.6 * 255); strokeWeight(0.2 * ds);
        for (var s = -1; s <= 1; s++) {
          line(fb.x + s * 1.2 * ds, fb.y, fb.x + s * 1.2 * ds, fb.y - 5 * ds * mature);
          fill(80, 55, 35, da * mature * 255); noStroke();
          ellipse(fb.x + s * 1.2 * ds, fb.y - 5 * ds * mature, 1 * ds, 3 * ds * mature);
        }
      }

      // Disperse spores when fully mature
      if (fb.age > 400 && random(1) < 0.005) {
        var windRad3 = radians(wx.windDir);
        var windStr3 = wx.windSpeed / 8;
        spores.push({ x: fb.x, y: fb.y - 4 * ds, vy: -random(0.1, 0.3), vx: cos(windRad3) * windStr3 * 0.2, life: 400 });
      }
    }
  };
}

// === SETUP ===
function setup() {
  var holder = document.getElementById('sketch-holder');
  var w = holder && holder.offsetWidth > 50 ? holder.offsetWidth : windowWidth;
  var h = holder && holder.offsetHeight > 50 ? holder.offsetHeight : windowHeight;
  cnv = createCanvas(w, h);
  cnv.parent('sketch-holder');

  // Initialize slime mold (dormant until conditions are right)
  slimeMold = new SlimeMold();

  // Fetch real weather + compute celestial
  fetchWeather();
  updateCelestial();

  // Try to restore state: server first, then localStorage, then fresh seeds
  var restored = loadLocalState();
  if (!restored) {
    // Start with ONLY seeds — ecosystem bootstraps from wind
    var initSeeds = floor(w / 40);
    for (var i = 0; i < initSeeds; i++) {
      seeds.push({
        x: random(width), y: random(-20, height * 0.3),
        vx: random(-1, 1), vy: random(0.2, 0.8),
        type: floor(random(PLANT_TYPES.length)),
        dna: null,
        life: 500 + floor(random(500)),
        grounded: false,
      });
    }
  }
  // Try server state (merges with local)
  loadFromServer();

  // Generate ground cover — grass blades rooted to the terrain
  grasses = [];
  for (var i = 0; i < 400; i++) {
    var gx = random(width);
    var gy = random(height * 0.45, height); // lower 55% of canvas
    var ds = depthScale(gy);
    grasses.push({
      x: gx, y: gy,
      len: random(4, 18) * ds,            // blade length scales with depth
      width: random(0.3, 1.0) * ds,
      hue: floor(random(3)),               // 0=green, 1=yellow-green, 2=brown
      phase: random(TWO_PI),               // wind sway phase offset
      stiffness: random(0.3, 1.0),         // how much it resists wind
    });
  }

  // Generate star field (persistent positions, vary only twinkle)
  stars = [];
  for (var i = 0; i < 200; i++) {
    stars.push({
      x: random(width), y: random(height * 0.45),
      sz: random(0.5, 2.2),
      base: random(0.3, 1.0),    // base brightness
      rate: random(0.005, 0.03), // twinkle speed
      phase: random(TWO_PI),     // twinkle phase offset
      col: random(1) < 0.1 ? [200,180,140] : random(1) < 0.15 ? [140,160,220] : [220,220,230], // warm/cool/white
    });
  }

  // A few pioneer food sources
  for (var i = 0; i < 30; i++) {
    food.push(createVector(10 + random(width - 20), random(height * 0.4, height)));
  }

  debug = createCheckbox('', false);
  debug.parent('check-box');
  debug.style('opacity', '0.3');

  // === NASA cumulative init (retro-wire v1.62) ===
  for (var nhi = 0; nhi < nasaHooks.length; nhi++) {
    if (nasaHooks[nhi].init) {
      try { nasaHooks[nhi].init(); }
      catch (e) { if (typeof console !== 'undefined') console.warn('NASA init ' + nasaHooks[nhi].degree + ': ' + e.message); }
    }
  }
}

function windowResized() {
  var holder = document.getElementById('sketch-holder');
  var w = holder && holder.offsetWidth > 50 ? holder.offsetWidth : windowWidth;
  var h = holder && holder.offsetHeight > 50 ? holder.offsetHeight : windowHeight;
  resizeCanvas(w, h);
}

function mouseDragged() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    // Drop a seed where you drag
    seeds.push({x:mouseX,y:mouseY,vx:random(-0.5,0.5),vy:random(-0.1,0.3),type:floor(random(PLANT_TYPES.length)),dna:null,life:200,grounded:false});
  }
}

// === DRAW ===
function draw() {
  frameNum++;
  season = (sin(frameNum * 0.0015) + 1) * 0.5;

  // Köhler microphysics (gated on featureFlags.microphysics — Phase 681)
  if (featureFlags.microphysics && typeof MicroPhysics !== 'undefined') {
    // Derive environmental supersaturation from wx.humidity (% RH) — crude approximation:
    //   S_env ≈ (RH/100) - 1 when RH > 100%; otherwise 0 (no activation).
    // For visualization we map humidity 95-105% to S_env 0 - 0.01 (0 - 1%).
    var rhFrac = Math.max(0, (wx.humidity - 95) / 10);  // 0 at RH≤95, 1 at RH=105
    var sEnv   = 0.01 * rhFrac;                          // 0 - 1% supersaturation
    var aero   = { N_total: 200e6, r_mode: 50e-9, sigma_geo: 2.0 }; // typical continental CCN
    var Tk     = (wx.temp || 10) + 273.15;
    microState.activatedFraction = MicroPhysics.kohlerActivationFraction(sEnv, aero, Tk, 0.3);
    microState.lastUpdate = frameNum;
  }

  // Refresh weather every 5 minutes, celestial every 30 seconds
  if (frameNum % 18000 === 0) fetchWeather();
  if (frameNum % 1800 === 0) updateCelestial();

  // Fog: forms when temp-dewpoint spread < 2.5°C (PNW radiation fog)
  fog.spread = wx.temp - wx.dewpoint;
  fog.density = constrain(map(fog.spread, 0, 5, 0.8, 0.0), 0, 0.8);
  // Calm + clear + night = radiation fog. Windy = no fog.
  fog.density *= constrain(map(wx.windSpeed, 0, 15, 1.0, 0.1), 0.1, 1.0);

  // Fetch aurora Kp every 30 minutes
  if (frameNum % 54000 === 1 || (aurora.lastFetch === 0 && frameNum > 60)) {
    aurora.lastFetch = frameNum;
    fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
      .then(function(r){return r.json()})
      .then(function(d){
        if (d && d.length > 1) {
          var last = d[d.length - 1];
          aurora.kp = parseFloat(last[1]) || 0;
          aurora.active = aurora.kp >= 4 && !sky.isDay;
        }
      }).catch(function(){});
  }

  // === SKY RENDERING ===
  var dayR, dayG, dayB;
  if (sky.isDay) {
    dayR = lerp(15, 45, sky.skyBright);
    dayG = lerp(18, 75, sky.skyBright);
    dayB = lerp(28, 120, sky.skyBright);
  } else {
    dayR = 6; dayG = 8; dayB = 18;
  }
  background(dayR, dayG, dayB);

  // Night sky gradient — deep blue near zenith, lighter at horizon
  if (!sky.isDay) {
    noStroke();
    for (var row = 0; row < height * 0.45; row++) {
      var t = row / (height * 0.45);
      fill(8 + t*12, 10 + t*15, 22 + t*18, 30);
      rect(0, row, width, 1);
    }
  }

  // === STARS (night only, fade during twilight) ===
  var starVis = constrain(map(sky.sunAlt, -18, -2, 1.0, 0.0), 0, 1);
  if (starVis > 0.01) {
    noStroke();
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      var twinkle = st.base + sin(frameNum * st.rate + st.phase) * 0.35;
      twinkle = constrain(twinkle, 0.05, 1.0) * starVis;
      // Brighter stars near zenith, dimmer near horizon
      var horizFade = constrain(1.0 - (st.y / (height * 0.45)), 0.2, 1.0);
      var a = twinkle * horizFade;
      fill(st.col[0], st.col[1], st.col[2], a * 255);
      var sz = st.sz * (0.8 + sin(frameNum * st.rate * 0.7 + st.phase) * 0.2);
      ellipse(st.x, st.y, sz, sz);
      // Bright stars get a subtle cross-spike
      if (st.sz > 1.6 && a > 0.5) {
        stroke(st.col[0], st.col[1], st.col[2], a * 40);
        strokeWeight(0.3);
        line(st.x - 3, st.y, st.x + 3, st.y);
        line(st.x, st.y - 3, st.x, st.y + 3);
        noStroke();
      }
    }
  }

  // === SHOOTING STARS (occasional) ===
  if (!sky.isDay && random(1) < 0.002 && shootingStars.length < 2) {
    var sx = random(width * 0.1, width * 0.9);
    var sy = random(5, height * 0.2);
    var ang = random(PI * 0.5, PI * 0.8);
    shootingStars.push({x:sx, y:sy, vx:cos(ang)*random(8,14), vy:sin(ang)*random(3,7), life:random(15,35), trail:[]});
  }
  for (var i = shootingStars.length - 1; i >= 0; i--) {
    var ss = shootingStars[i];
    ss.trail.push({x:ss.x, y:ss.y});
    ss.x += ss.vx; ss.y += ss.vy; ss.life--;
    if (ss.trail.length > 12) ss.trail.shift();
    // Draw trail
    for (var t = 0; t < ss.trail.length; t++) {
      var ta = (t / ss.trail.length) * (ss.life / 35) * 0.8;
      fill(255, 250, 230, ta * 255); noStroke();
      ellipse(ss.trail[t].x, ss.trail[t].y, 1.5 - t*0.1, 1.5 - t*0.1);
    }
    // Bright head
    fill(255, 255, 240, min(1, ss.life/10) * 255);
    ellipse(ss.x, ss.y, 2, 2);
    if (ss.life <= 0) shootingStars.splice(i, 1);
  }

  // === GROUND GRADIENT — forest floor ===
  noStroke();
  var groundStart = height * 0.65;
  for (var row = 0; row < height - groundStart; row++) {
    var t = row / (height - groundStart);
    var gAlpha = t * t * 0.12;
    if (sky.isDay) {
      fill(20 + t*15, 35 + t*20, 18 + t*10, gAlpha * 255);
    } else {
      fill(8 + t*8, 15 + t*12, 10 + t*6, gAlpha * 255);
    }
    rect(0, groundStart + row, width, 1);
  }

  // Horizon fog (visibility-based)
  var fogDensity = constrain(map(wx.visibility, 1000, 16000, 0.08, 0.02), 0.01, 0.1);
  noStroke();
  for (var row = 0; row < height * 0.2; row++) {
    var fogA = (1 - row / (height * 0.2)) * fogDensity;
    fill(30, 45, 40, fogA * 255);
    rect(0, row, width, 1);
  }

  // Sun (if above horizon)
  if (sky.sunAlt > -2) {
    var sunX = map(sky.sunAz, 0, 360, width * 0.1, width * 0.9);
    var sunY = map(sky.sunAlt, -5, 70, height * 0.25, 10);
    sunY = constrain(sunY, 5, height * 0.3);
    var sunBright = constrain(map(sky.sunAlt, -2, 30, 0.1, 1.0), 0, 1);
    // Outer glow
    fill(255, 200, 100, sunBright * 6);
    ellipse(sunX, sunY, 100, 100);
    fill(255, 220, 140, sunBright * 15);
    ellipse(sunX, sunY, 55, 55);
    fill(255, 230, 160, sunBright * 40);
    ellipse(sunX, sunY, 25, 25);
    fill(255, 245, 200, sunBright * 100);
    ellipse(sunX, sunY, 10, 10);
  }

  // Moon (if above horizon)
  if (sky.moonAlt > 0) {
    var moonX = map(sky.moonAz, 0, 360, width * 0.1, width * 0.9);
    var moonY = map(sky.moonAlt, 0, 70, height * 0.25, 10);
    moonY = constrain(moonY, 5, height * 0.3);
    var moonBright = constrain(map(sky.moonAlt, 0, 40, 0.3, 1.0), 0, 1);
    var illum = sky.moonPhase < 0.5 ? sky.moonPhase * 2 : (1 - sky.moonPhase) * 2;
    illum = constrain(illum, 0.08, 1.0);
    var mb = moonBright * illum;
    // Atmospheric halo
    fill(120, 140, 180, mb * 5);
    ellipse(moonX, moonY, 90, 90);
    fill(150, 165, 200, mb * 10);
    ellipse(moonX, moonY, 55, 55);
    // Moon disc
    fill(180, 190, 210, mb * 25);
    ellipse(moonX, moonY, 28, 28);
    fill(210, 215, 230, mb * 60);
    ellipse(moonX, moonY, 18, 18);
    fill(235, 238, 245, mb * 100);
    ellipse(moonX, moonY, 12, 12);
    // Moonlight on ground — subtle wash
    if (mb > 0.2) {
      fill(100, 120, 160, mb * 3);
      rect(0, height * 0.5, width, height * 0.5);
    }
  }

  // === FIREFLIES (night only, emerge near plants) ===
  if (!sky.isDay && plants.length > 2) {
    // Spawn fireflies near mature plants
    if (random(1) < 0.04 && fireflies.length < 40) {
      var srcPlant = plants[floor(random(plants.length))];
      if (srcPlant.growth > 0.3) {
        // Enhanced firefly with energy, spectral variation, temperature-dependent rate
        var baseRate = map(constrain(wx.temp, 5, 30), 5, 30, 0.025, 0.09);
        fireflies.push({
          x: srcPlant.x + random(-30, 30),
          y: srcPlant.y + random(-40, -5),
          vx: random(-0.3, 0.3), vy: random(-0.2, 0.1),
          phase: random(TWO_PI), rate: baseRate * random(0.8, 1.2),
          life: floor(random(300, 800)),
          sz: random(1.5, 3.0),
          energy: 1.0,                      // bioluminescence energy (0-1)
          spectral: random(-0.15, 0.15),    // color temp shift (LED-inspired)
        });
      }
    }
  }
  for (var i = fireflies.length - 1; i >= 0; i--) {
    var ff = fireflies[i];
    ff.x += ff.vx + sin(frameNum * 0.02 + ff.phase) * 0.3;
    ff.y += ff.vy + cos(frameNum * 0.015 + ff.phase * 1.3) * 0.2;
    ff.vx += random(-0.02, 0.02); ff.vy += random(-0.02, 0.02);
    ff.vx = constrain(ff.vx, -0.5, 0.5); ff.vy = constrain(ff.vy, -0.4, 0.3);
    ff.life--;
    if (ff.life <= 0 || ff.y < 0 || ff.x < -10 || ff.x > width + 10) { fireflies.splice(i, 1); continue; }
    // Pulse glow with LED-inspired spectral variation
    var pulse = (sin(frameNum * ff.rate + ff.phase) + 1) * 0.5;
    pulse = pulse * pulse; // sharper on/off
    var nrg = ff.energy || 1.0;
    var fa = pulse * 0.9 * nrg * (ff.life > 30 ? 1.0 : ff.life / 30);
    // Energy decay + renewal (bioluminescence ATP cost)
    if (ff.energy !== undefined) {
      ff.energy -= 0.0008;
      ff.energy += 0.0004 * (1.0 + sin(ff.phase)); // recover near flash peak
      ff.energy = constrain(ff.energy, 0.15, 1.0);
    }
    if (fa > 0.05) {
      noStroke();
      // Spectral shift: amber (-0.15) to green (+0.15) — LED bioluminescence variation
      var sp = ff.spectral || 0;
      fill(180 + sp * 60, 220 + sp * 20, 80 - sp * 40, fa * 30);
      ellipse(ff.x, ff.y, ff.sz * 5, ff.sz * 5);
      fill(200 + sp * 40, 240 + sp * 10, 100 - sp * 30, fa * 80);
      ellipse(ff.x, ff.y, ff.sz * 2.5, ff.sz * 2.5);
      fill(230, 255, 140 + sp * 60, fa * 200);
      ellipse(ff.x, ff.y, ff.sz, ff.sz);
    }
  }
  // Enhanced Kuramoto synchronization — Session 7 research upgrade
  // Adaptive coupling: strength depends on distance, brightness match, and phase proximity
  // Temperature-dependent flash rate from real KPAE weather data
  // Order parameter r measures collective synchronization (0=chaos, 1=perfect sync)
  // Sources: Self-Organizing Intelligence (p3nGu1nZz), LED Evolution, Strogatz 2003
  if (!sky.isDay && fireflies.length > 1) {
    var baseCoupling = 0.02;
    var n = fireflies.length;
    // Phase 1: Adaptive coupling (distance + brightness + phase proximity)
    for (var i = 0; i < n; i++) {
      var fi = fireflies[i];
      for (var j = i + 1; j < n; j++) {
        var fj = fireflies[j];
        var dx = fi.x - fj.x, dy = fi.y - fj.y;
        var distSq = dx * dx + dy * dy;
        if (distSq > 4900) continue; // beyond 70px visual range
        // Distance factor: inverse square with soft floor
        var distFactor = 1.0 / (1.0 + distSq / 900);
        // Phase proximity: positive feedback — near-sync strengthens bond
        var phaseDiff = sin(fj.phase - fi.phase);
        var phaseBonus = 1.0 + (1.0 - abs(phaseDiff)) * 0.5;
        var K = baseCoupling * distFactor * phaseBonus;
        fi.phase += K * phaseDiff;
        fj.phase -= K * phaseDiff;
      }
    }
    // Phase 2: Temperature-dependent frequency — warmer = faster flash
    var tempRate = map(constrain(wx.temp, 5, 30), 5, 30, 0.8, 1.3);
    for (var i = 0; i < n; i++) {
      fireflies[i].rate = fireflies[i].rate || random(0.03, 0.08);
      fireflies[i].phase += fireflies[i].rate * tempRate * 0.1;
      if (fireflies[i].phase > TWO_PI) fireflies[i].phase -= TWO_PI;
    }
    // Phase 3: Compute order parameter r (collective sync metric)
    var sumCos = 0, sumSin = 0;
    for (var i = 0; i < n; i++) { sumCos += cos(fireflies[i].phase); sumSin += sin(fireflies[i].phase); }
    var orderR = sqrt((sumCos/n)*(sumCos/n) + (sumSin/n)*(sumSin/n));
    // Store for debug/display
    if (typeof window._kuramotoR === 'undefined') window._kuramotoR = 0;
    window._kuramotoR = window._kuramotoR * 0.95 + orderR * 0.05; // smoothed
  }
  // Clear fireflies during day
  if (sky.isDay && fireflies.length > 0) fireflies = [];

  // === FOG RENDERING (temp-dewpoint spread < 2.5°C) ===
  if (fog.density > 0.02) {
    noStroke();
    // Ground-hugging fog layers — denser at bottom, PNW radiation fog
    for (var row = 0; row < height * 0.5; row++) {
      var fy = height - row;
      var layerDense = fog.density * (row < height * 0.15 ? 1.0 : map(row, height*0.15, height*0.5, 0.8, 0.0));
      // Drift with wind
      var drift = sin((fy * 0.01) + frameNum * 0.003 + cos(radians(wx.windDir)) * 0.5) * 0.15;
      var fogAlpha = (layerDense + drift) * 0.06;
      if (fogAlpha > 0.003) {
        fill(180, 195, 210, fogAlpha * 255);
        rect(0, fy, width, 1);
      }
    }
  }

  // === AURORA BOREALIS (Kp >= 4, nighttime, from NOAA Space Weather) ===
  if (aurora.active && aurora.kp >= 4 && !sky.isDay) {
    noStroke();
    var aIntensity = constrain(map(aurora.kp, 4, 8, 0.3, 1.0), 0, 1);
    // Green curtains in the northern sky (top of canvas)
    for (var x = 0; x < width; x += 3) {
      var n1 = noise(x * 0.008, frameNum * 0.003);
      var n2 = noise(x * 0.015 + 100, frameNum * 0.005);
      var curtainH = n1 * height * 0.25 * aIntensity;
      var cx = x + sin(frameNum * 0.01 + x * 0.02) * 5;
      // Green (557.7nm oxygen emission)
      var ga = n2 * aIntensity * 0.15;
      fill(80, 255, 120, ga * 255);
      rect(cx, 0, 3, curtainH);
      // Purple/red fringe at higher altitude (630nm)
      if (aurora.kp >= 6) {
        fill(160, 60, 180, ga * 0.5 * 255);
        rect(cx, 0, 3, curtainH * 0.3);
      }
    }
  }

  // === RAIN ===
  if (wx.isRaining || wx.humidity > 90) {
    var rainRate = wx.isRaining ? 8 : 2;
    for (var r = 0; r < rainRate; r++) {
      raindrops.push({x:random(width), y:random(-10, 0), vy:random(4, 8), life:80});
    }
  }
  stroke(100, 140, 180, 25);
  strokeWeight(0.5);
  for (var i = raindrops.length - 1; i >= 0; i--) {
    var rd = raindrops[i];
    rd.x += wx.windSpeed / 30 * cos(radians(wx.windDir));
    rd.y += rd.vy;
    rd.life--;
    line(rd.x, rd.y, rd.x + 0.3, rd.y + 3);
    // Water plants when rain lands
    if (rd.y > height * 0.3 || rd.life <= 0) {
      for (var p = 0; p < plants.length; p++) {
        if (abs(plants[p].x - rd.x) < 15 && abs(plants[p].y - rd.y) < 20) {
          plants[p].waterLevel = min(plants[p].waterLevel + 0.1, 15);
        }
      }
      raindrops.splice(i, 1);
    }
  }

  // === SEEDS — blown by real wind ===
  var windRad = radians(wx.windDir);
  var windStr = wx.windSpeed / 10;
  for (var i = seeds.length - 1; i >= 0; i--) {
    var sd = seeds[i];
    if (!sd.grounded) {
      sd.vx += cos(windRad) * windStr * 0.01 + random(-0.05, 0.05);
      sd.vy += 0.008; // gravity
      sd.vx *= 0.99; // drag
      sd.x += sd.vx;
      sd.y += sd.vy;
      // Ground contact
      if (sd.y >= height * 0.3 + random(height * 0.7)) {
        sd.grounded = true;
        sd.vy = 0; sd.vx = 0;
      }
    }
    sd.life--;
    // Draw seed
    var sa = depthAlpha(sd.y) * (sd.grounded ? 0.4 : 0.25);
    var ssz = (sd.grounded ? 2.0 : 1.5) * depthScale(sd.y);
    fill(PAL.foxLight[0], PAL.foxLight[1], PAL.foxLight[2], sa * 255);
    noStroke();
    ellipse(sd.x, sd.y, ssz, ssz);
    // Germinate
    if (sd.grounded && sd.life <= 0 && plants.length < 60) {
      plants.push(new Plant(sd.x, sd.y, sd.type, sd.dna));
      seeds.splice(i, 1);
    } else if (!sd.grounded && (sd.y > height + 10 || sd.x < -10 || sd.x > width + 10)) {
      seeds.splice(i, 1);
    } else if (sd.life < -200) {
      seeds.splice(i, 1); // failed to germinate
    }
  }

  // New seeds blow in from upwind edge
  if (random(1) < 0.005 && seeds.length < 50) {
    var edge = wx.windDir > 90 && wx.windDir < 270 ? 0 : width;
    seeds.push({x:edge, y:random(0, height*0.4), vx:cos(windRad)*windStr*0.5, vy:random(0.1,0.5), type:floor(random(PLANT_TYPES.length)), dna:null, life:600+floor(random(400)), grounded:false});
  }

  // Spore drift
  if (random(1) < 0.006) spores.push({x:random(width), y:0, vy:random(0.15, 0.5), vx:cos(windRad)*windStr*0.1, life:300});
  for (var i = spores.length - 1; i >= 0; i--) {
    var sp = spores[i];
    sp.x += sp.vx + sin(frameNum * 0.015 + i) * 0.1;
    sp.y += sp.vy;
    sp.life--;
    if (sp.life <= 0 || sp.y > height) { spores.splice(i, 1); continue; }
    var sa2 = (sp.life / 300) * 0.15 * depthAlpha(sp.y);
    fill(PAL.gold[0], PAL.gold[1], PAL.gold[2], sa2 * 255);
    noStroke();
    ellipse(sp.x, sp.y, 1.0 * depthScale(sp.y), 1.0 * depthScale(sp.y));
  }

  if (food.length > 300) food.splice(0, food.length - 300);
  if (poison.length > 20) poison.splice(0, poison.length - 20);

  // === GROUND MOISTURE — accumulates from rain, evaporates in sun ===
  if (wx.isRaining || wx.humidity > 90) {
    groundMoisture = min(groundMoisture + 0.0008, 1.0);
  } else {
    var evapRate = sky.isDay ? 0.0003 * (1 + wx.temp / 30) : 0.0001;
    groundMoisture = max(groundMoisture - evapRate, 0);
  }

  // === PUDDLES — form when ground is saturated ===
  if (groundMoisture > 0.6 && random(1) < 0.01 && puddles.length < 15) {
    puddles.push({
      x: random(width * 0.05, width * 0.95),
      y: random(height * 0.6, height - 5),
      w: random(8, 30) * depthScale(random(height * 0.6, height)),
      h: random(2, 6),
      life: floor(random(500, 2000)),
    });
  }
  // Draw puddles — subtle reflective ellipses
  for (var i = puddles.length - 1; i >= 0; i--) {
    var pd = puddles[i];
    if (!wx.isRaining && groundMoisture < 0.3) pd.life -= 3; else pd.life--;
    if (pd.life <= 0) { puddles.splice(i, 1); continue; }
    var pa = min(1, pd.life / 200) * 0.12 * depthAlpha(pd.y);
    var nightDimP = sky.isDay ? 1.0 : 0.6;
    // Puddle body — dark reflective
    fill(15, 25, 40, pa * nightDimP * 255);
    noStroke();
    ellipse(pd.x, pd.y, pd.w, pd.h);
    // Sky reflection highlight
    if (sky.isDay) {
      fill(60, 90, 120, pa * 0.4 * 255);
    } else if (sky.moonAlt > 0) {
      fill(80, 90, 110, pa * 0.25 * 255);
    }
    ellipse(pd.x - pd.w * 0.15, pd.y - pd.h * 0.1, pd.w * 0.4, pd.h * 0.5);
  }

  // === GRASS BLADES — sway with real wind, color with season + moisture ===
  var windSway = wx.windSpeed / 8; // stronger wind = more sway
  var windAngle = radians(wx.windDir);
  var nightDimG = sky.isDay ? 1.0 : (0.5 + (sky.moonAlt > 0 ? 0.25 : 0));

  for (var i = 0; i < grasses.length; i++) {
    var g = grasses[i];
    var da = depthAlpha(g.y);
    // Wind displacement — each blade sways independently
    var sway = sin(frameNum * 0.025 + g.phase) * windSway * (1 - g.stiffness * 0.6);
    sway += cos(frameNum * 0.01 + g.phase * 2.3) * windSway * 0.3; // secondary harmonic
    var tipX = g.x + sway * g.len * 0.15;
    var tipY = g.y - g.len;

    // Color — shifts with season, moisture, and individual variation
    var gr, gg, gb;
    if (g.hue === 0) {
      // Green — dominant
      gr = 30 + season * 15 + groundMoisture * 10;
      gg = 55 + season * 25 + groundMoisture * 20;
      gb = 25 + groundMoisture * 8;
    } else if (g.hue === 1) {
      // Yellow-green — autumn tint
      gr = 50 + season * 40;
      gg = 60 + season * 20;
      gb = 15;
    } else {
      // Brown — dead/dormant
      gr = 55 + season * 10;
      gg = 40 + season * 5;
      gb = 25;
    }
    var ga = (0.25 + groundMoisture * 0.15) * da * nightDimG;

    stroke(gr, gg, gb, ga * 255);
    strokeWeight(g.width);
    // Curved blade — quadratic from root to tip
    noFill();
    beginShape();
    vertex(g.x, g.y);
    quadraticVertex(g.x + sway * g.len * 0.08, g.y - g.len * 0.5, tipX, tipY);
    endShape();
  }

  // === LEAF LITTER — drops from mature plants, accumulates on ground ===
  // Spawn from plants
  if (random(1) < 0.003 * (0.5 + season)) {
    for (var p = 0; p < plants.length; p++) {
      if (plants[p].growth > 0.6 && random(1) < 0.02 && leafLitter.length < 200) {
        var lx = plants[p].x + random(-15, 15);
        var ly = plants[p].y + random(-3, 3);
        var c = plants[p].pt.col;
        leafLitter.push({
          x: lx, y: ly,
          sz: random(1, 3) * depthScale(ly),
          r: constrain(c[0] + random(-15, 40), 20, 180),
          g: constrain(c[1] + random(-20, 10), 15, 120),
          b: constrain(c[2] + random(-10, 10), 10, 60),
          rot: random(TWO_PI),
          life: floor(random(2000, 8000)), // decomposes over time
        });
      }
    }
  }
  // Draw and decay
  noStroke();
  for (var i = leafLitter.length - 1; i >= 0; i--) {
    var lf = leafLitter[i];
    lf.life--;
    // Wind pushes litter slightly
    lf.x += cos(windAngle) * windSway * 0.01;
    lf.rot += windSway * 0.001;
    if (lf.life <= 0) { leafLitter.splice(i, 1); continue; }
    var la = min(1, lf.life / 500) * 0.2 * depthAlpha(lf.y) * nightDimG;
    // Darken as it decomposes — browns and grays
    var decomp = max(0, 1 - lf.life / 4000);
    var lr = lerp(lf.r, 45, decomp);
    var lg = lerp(lf.g, 30, decomp);
    var lb = lerp(lf.b, 20, decomp);
    fill(lr, lg, lb, la * 255);
    push();
    translate(lf.x, lf.y);
    rotate(lf.rot);
    ellipse(0, 0, lf.sz, lf.sz * 0.6);
    pop();
  }

  // Sort plants by depth
  plants.sort(function(a, b) { return a.y - b.y; });
  for (var i = 0; i < plants.length; i++) { plants[i].update(); plants[i].display(); }

  // Pheromones
  for (var i = pheromones.length - 1; i >= 0; i--) {
    var ph = pheromones[i]; ph.life--;
    if (ph.life <= 0) { pheromones.splice(i, 1); continue; }
    var pa = (ph.life / 150) * 0.05 * depthAlpha(ph.y);
    var sc = SPECIES[ph.species].col;
    fill(sc[0], sc[1], sc[2], pa * 255); noStroke();
    ellipse(ph.x, ph.y, 4*depthScale(ph.y), 4*depthScale(ph.y));
  }

  // Food & poison (depth-scaled)
  var fSize = map(season, 0, 1, 1.0, 2.5);
  var nightDim = sky.isDay ? 1.0 : 0.5;
  for (var i = 0; i < food.length; i++) {
    fill(PAL.moss[0], PAL.moss[1], PAL.moss[2], 110*depthAlpha(food[i].y)*nightDim);
    noStroke(); ellipse(food[i].x, food[i].y, fSize*depthScale(food[i].y), fSize*depthScale(food[i].y));
  }
  for (var i = 0; i < poison.length; i++) {
    fill(PAL.lichen[0], PAL.lichen[1], PAL.lichen[2], 80*depthAlpha(poison[i].y)*nightDim);
    noStroke(); ellipse(poison[i].x, poison[i].y, 2.5*depthScale(poison[i].y), 2.5*depthScale(poison[i].y));
  }

  // Agents emerge once plants establish (ecosystem bootstraps from seeds)
  if (plants.length > 3 && vehicles.length < 5 && frameNum % 120 === 0) {
    vehicles.push(new Vehicle(random(width), random(height * 0.5, height)));
  }
  // Mycelia network — bioluminescent at night
  var myceliaGlow = sky.isDay ? 8 : 18;
  stroke(PAL.gold[0], PAL.gold[1], PAL.gold[2], myceliaGlow); strokeWeight(sky.isDay ? 0.3 : 0.6);
  for (var i = 0; i < vehicles.length; i++) { if(vehicles[i].species!==3)continue;
    for (var j = i+1; j < vehicles.length; j++) { if(vehicles[j].species!==3)continue;
      if(vehicles[i].position.dist(vehicles[j].position)<55) line(vehicles[i].position.x,vehicles[i].position.y,vehicles[j].position.x,vehicles[j].position.y);
  }}

  // === SLIME MOLD — Physarum polycephalum network ===
  // Activates on dead logs (leaf litter) when moisture is high
  if (slimeMold.phase === 'dormant' && leafLitter.length > 3 && (groundMoisture > 0.4 || wx.isRaining) && frameNum > 300) {
    // Find a good leaf litter spot to germinate
    var litter = leafLitter[floor(random(leafLitter.length))];
    slimeMold.activate(litter.x, litter.y);
  }
  slimeMold.update();
  slimeMold.display();

  // Spawn food, poison
  if (random(1) < map(season, 0, 1, 0.04, 0.25) && plants.length > 2) food.push(createVector(10+random(width-20),random(height*0.3,height)));
  if (random(1) < 0.004) poison.push(createVector(10+random(width-20),random(height*0.3,height)));
  if (random(1) < 0.006 && vehicles.length < 250 && plants.length > 5) vehicles.push(new Vehicle(random(width),random(height*0.4,height)));

  // Update vehicles
  for (var i = vehicles.length - 1; i >= 0; i--) {
    vehicles[i].boundaries(); vehicles[i].behaviors(food, poison, vehicles);
    vehicles[i].update(); vehicles[i].display();
    var child = vehicles[i].clone(); if (child !== null) vehicles.push(child);
    if (vehicles[i].dead()) {
      food.push(createVector(vehicles[i].position.x, vehicles[i].position.y));
      vehicles.splice(i, 1);
    }
  }

  // === HUD ===
  // Update DOM status bar if it exists (forest/index.html), else draw on canvas
  var wxLine = wx.stationName + ' ' + wx.temp.toFixed(0) + '°C ' + wx.description + ' Wind ' + wx.windDir.toFixed(0) + '° ' + wx.windSpeed.toFixed(0) + 'km/h';
  var skyLine = (sky.isDay ? 'Sun ' + sky.sunAlt.toFixed(0) + '°' : 'Moon ' + sky.moonAlt.toFixed(0) + '° ph' + (sky.moonPhase*100).toFixed(0) + '%');
  // Count species for HUD
  var speciesCounts = {};
  for (var i = 0; i < vehicles.length; i++) {
    var sn = SPECIES[vehicles[i].species].name;
    speciesCounts[sn] = (speciesCounts[sn] || 0) + 1;
  }
  var speciesStr = '';
  for (var s in speciesCounts) { if (speciesCounts[s] > 0) speciesStr += speciesCounts[s] + ' ' + s + '  '; }
  var slimeLine = slimeMold.phase !== 'dormant' ? '  Physarum:' + slimeMold.phase + '(' + slimeMold.nodes.length + 'n/' + slimeMold.edges.length + 'e)' : '';
  var ecoLine = plants.length + ' plants  ' + seeds.length + ' seeds  ' + speciesStr.trim() + slimeLine;
  var fogLine = fog.density > 0.05 ? '  Fog' : '';
  var auroraLine = aurora.active ? '  Aurora Kp=' + aurora.kp : '';
  ecoLine += fogLine + auroraLine;

  var wxEl = document.getElementById('wx-status');
  var ecoEl = document.getElementById('eco-status');
  if (wxEl) { wxEl.textContent = wxLine + '  ' + skyLine; ecoEl.textContent = ecoLine; }
  else {
    fill(200, 210, 220, 120); noStroke(); textSize(10); textFont('monospace'); textAlign(LEFT);
    text(wxLine + '  ' + skyLine + '  ' + ecoLine, 4, height - 5);
  }

  // === NASA cumulative per-frame (retro-wire v1.62) ===
  for (var nhi = 0; nhi < nasaHooks.length; nhi++) {
    if (nasaHooks[nhi].tick) {
      try { nasaHooks[nhi].tick(frameNum); }
      catch (e) { /* silent in prod */ }
    }
  }

  // === PERSISTENCE — save state periodically ===
  if (frameNum % 1800 === 0 && frameNum > 0) saveLocalState();
  if (frameNum % 5400 === 0 && frameNum > 0) syncToServer();
}

// === LOCAL PERSISTENCE (localStorage) ===
var STORAGE_KEY = 'pnw-forest-state';
var STORAGE_VERSION = 1;

function serializePlant(p) {
  return { x:p.x, y:p.y, type:p.type, growth:p.growth, age:p.age, water:p.waterLevel||0, dna:p.dna };
}

function serializeSeed(s) {
  return { x:s.x, y:s.y, type:s.type, dna:s.dna, life:s.life, grounded:s.grounded };
}

function saveLocalState() {
  try {
    var state = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      plants: plants.map(serializePlant),
      seeds: seeds.map(serializeSeed),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) { /* quota exceeded or private mode — fail silently */ }
}

function loadLocalState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var state = JSON.parse(raw);
    if (!state || state.version !== STORAGE_VERSION) return false;
    // Reject if older than 24 hours
    if (Date.now() - state.timestamp > 24 * 3600 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    // Advance growth for time passed
    var elapsed = (Date.now() - state.timestamp) / 1000;
    var growthBonus = elapsed * 0.00003; // slow offline growth

    if (state.plants && state.plants.length > 0) {
      plants = [];
      for (var i = 0; i < state.plants.length; i++) {
        var sp = state.plants[i];
        var p = new Plant(sp.x, sp.y, sp.type, sp.dna);
        p.growth = Math.min(1.0, (sp.growth || 0) + growthBonus);
        p.age = sp.age || 0;
        p.waterLevel = sp.water || 0;
        p.computeSegments();
        plants.push(p);
      }
    }
    if (state.seeds && state.seeds.length > 0) {
      seeds = [];
      for (var i = 0; i < state.seeds.length; i++) {
        var ss = state.seeds[i];
        seeds.push({ x:ss.x, y:ss.y, type:ss.type, dna:ss.dna, life:ss.life, grounded:ss.grounded||false, vx:0, vy:0.1 });
      }
    }
    return true;
  } catch(e) { return false; }
}

// === SERVER SYNC (zero-trust shared forest) ===
var syncState = 'local'; // 'local', 'connected', 'offline'
var FOREST_API_URL = (typeof FOREST_API !== 'undefined') ? FOREST_API : 'forest/api/forest.php';

function updateSyncIndicator() {
  var el = document.querySelector('.sync-dot');
  if (!el) return;
  el.className = 'sync-dot ' + syncState;
  var label = el.parentElement;
  if (label) label.innerHTML = '<span class="sync-dot ' + syncState + '"></span>' +
    (syncState === 'connected' ? 'Shared' : syncState === 'offline' ? 'Offline' : 'Local');
}

function loadFromServer() {
  if (typeof fetch === 'undefined') return;
  fetch(FOREST_API_URL)
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(state) {
      if (!state || !state.plants) { syncState = 'offline'; updateSyncIndicator(); return; }
      syncState = 'connected';
      updateSyncIndicator();

      // Merge server plants with local (server wins for duplicates, local adds new)
      var serverPlants = state.plants || [];
      if (serverPlants.length > 0 && plants.length === 0) {
        // First load and no local state — use server state
        var elapsed = (state.timeSinceUpdate || 0);
        var growthBonus = elapsed * 0.00003;
        for (var i = 0; i < serverPlants.length; i++) {
          var sp = serverPlants[i];
          var p = new Plant(sp.x, sp.y, sp.type, sp.dna);
          p.growth = Math.min(1.0, (sp.growth || 0) + growthBonus);
          p.age = sp.age || 0;
          p.waterLevel = sp.water || 0;
          p.computeSegments();
          plants.push(p);
        }
      }
      // Merge server seeds
      var serverSeeds = state.seeds || [];
      for (var i = 0; i < serverSeeds.length; i++) {
        var ss = serverSeeds[i];
        seeds.push({ x:ss.x, y:ss.y, type:ss.type, dna:ss.dna, life:ss.life||300, grounded:false, vx:0, vy:0.1 });
      }
    })
    .catch(function() { syncState = 'offline'; updateSyncIndicator(); });
}

function syncToServer() {
  if (typeof fetch === 'undefined' || plants.length === 0) return;

  // Only send plants that have meaningfully grown
  var contribution = {
    plants: plants.filter(function(p) { return p.growth > 0.1; }).slice(0, 20).map(serializePlant),
    seeds: seeds.filter(function(s) { return s.grounded; }).slice(0, 10).map(serializeSeed),
  };

  fetch(FOREST_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contribution),
  })
  .then(function(r) { return r.json(); })
  .then(function(resp) {
    if (resp.ok) { syncState = 'connected'; }
    else { syncState = 'offline'; }
    updateSyncIndicator();
  })
  .catch(function() { syncState = 'offline'; updateSyncIndicator(); });
}
// === NASA CUMULATIVE GENERATIVE LAYER ===
// Assembled by .planning/missions/forest-sim-retro-wire/extract_and_assemble.py
// 63 degree blocks (v1.0 through v1.61, with v1.9 split into 9a+9b).
// Each block is contributed by one NASA degree (mission + S36 artist + SPS species).
// Later degrees may read nasaState.v1_{earlier}; forward references forbidden.

var nasaHooks = [];
var nasaState = {};
function nasaEmit(name, payload) {
  for (var i = 0; i < nasaHooks.length; i++) {
    if (nasaHooks[i].event) { try { nasaHooks[i].event(name, payload); } catch (e) {} }
  }
}

// --- DEGREE v1_0 ---
/* ==== DEGREE v1.0 — Armillaria Mycelial Pulse Network ====
 * Source spec: ../NASA/1.0/forest-module/armillaria-mycelium-network.js
 * Triad: NASA=NASA Agency Founding (Oct 1, 1958) · S36=none (foundation) · SPS=Armillaria ostoyae
 * Couplings: physarum (nutrient), lsystem (canopy bump), audio (ambient) — visual-only port here
 * Emergent contribution: publishes nasaState.v1_0.pulses for every later degree to forage/shelter over.
 */
(function() {
  nasaState.v1_0 = {
    pulses: [],                  // [{x, y, r, birth}]
    seedIntervalFrames: 180,     // ~3s @ 60fps
    pulseSpeedPxPerFrame: 1.33,  // ~80 px/s
    lifespanFrames: 360,         // 6s
    maxPulses: 8,                // budget guard
    activePulseAt: function(x, y) {
      // Returns strongest band intensity [0..1] at (x,y). Later degrees call this
      // to bias foraging / sheltering toward active mycelium fronts.
      var best = 0;
      var list = nasaState.v1_0.pulses;
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var dx = x - p.x, dy = y - p.y;
        var d = Math.sqrt(dx*dx + dy*dy);
        var band = Math.exp(-Math.pow((d - p.r) / 24, 2));
        if (band > best) best = band;
      }
      return best;
    }
  };

  nasaHooks.push({
    degree: '1.0',
    init: function() {
      // Seed one immediately so the network is visible from frame 1.
      nasaState.v1_0.pulses.push({
        x: width * (0.25 + Math.random() * 0.5),
        y: height * (0.55 + Math.random() * 0.35),
        r: 0,
        birth: frameNum
      });
    },
    tick: function(fn) {
      var S = nasaState.v1_0;
      // --- seed a new pulse once every ~3 seconds ---
      if (fn % S.seedIntervalFrames === 0 && S.pulses.length < S.maxPulses) {
        // Prefer a position near an existing plant (root-contact bias); fall back to random.
        var nx, ny;
        if (plants && plants.length > 0 && Math.random() < 0.75) {
          var src = plants[Math.floor(Math.random() * plants.length)];
          nx = src.x + (Math.random() - 0.5) * 60;
          ny = src.y - Math.random() * 20; // just at/above soil line
        } else {
          nx = width * (0.15 + Math.random() * 0.7);
          ny = height * (0.5 + Math.random() * 0.4); // lower half only (soil zone)
        }
        S.pulses.push({ x: nx, y: ny, r: 0, birth: fn });
        // Canopy bump: briefly nudge growth of the nearest young plant (L-system coupling).
        if (plants && plants.length > 0) {
          var near = null, nd = 1e9;
          for (var i = 0; i < plants.length; i++) {
            var dx = plants[i].x - nx, dy = plants[i].y - ny;
            var d2 = dx*dx + dy*dy;
            if (d2 < nd) { nd = d2; near = plants[i]; }
          }
          if (near && near.growth < near.maxGrowth) {
            near.growth = Math.min(near.maxGrowth, near.growth + 0.04);
          }
        }
      }

      // --- render live pulses (honey-gold rings with origin dot) ---
      var alive = [];
      for (var j = 0; j < S.pulses.length; j++) {
        var p = S.pulses[j];
        var age = fn - p.birth;
        if (age > S.lifespanFrames) continue;
        p.r = age * S.pulseSpeedPxPerFrame;
        var a = 0.65 * (1 - age / S.lifespanFrames);
        noFill();
        stroke(218, 165, 32, 255 * a);       // mycelium honey-gold #DAA520
        strokeWeight(1.8);
        ellipse(p.x, p.y, p.r * 2, p.r * 2);
        noStroke();
        fill(232, 217, 168, 255 * Math.min(1, a * 1.3));
        ellipse(p.x, p.y, 4, 4);
        alive.push(p);
      }
      S.pulses = alive;
    }
  });
})();

// --- DEGREE v1_1 ---
/* ==== DEGREE v1.1 — Douglas-Fir Radiation Canopy ====
 * Source spec: ../NASA/1.1/forest-module/douglas-fir-radiation-canopy.js
 * Triad: NASA=Explorer 1 · S36=(v1.1 pair) · SPS=Varied Thrush
 * Couplings: physarum-field, lsystem-event, audio-layer (field + event flavor)
 * Emergent contribution: publishes a lateral radiation-dose field and a canopy
 *   shadow factor so later degrees can damp growth or bias foraging; emits
 *   belt-crossing events every compressed orbital period (~22 s) that brighten
 *   canopy cues. Reads v1_0 Armillaria pulses (optional) as soil-moisture hint.
 */
(function() {
  // 22 s orbit @ 60 fps = 1320 frames; belt occupies 50%-70% of phase.
  var ORBIT_FRAMES = 1320;
  var BELT_PHASE_LO = 0.50, BELT_PHASE_HI = 0.70;

  nasaState.v1_1 = {
    beltPhase: 0,
    beltCentreNorm: 0.6,        // drifts slowly across width
    crossings: 0,
    lastCrossFrame: -9999,
    _shadowCache: null,          // Float32-ish array of length = width, rebuilt per-second
    _shadowStamp: -1,
    // Dose in [0,~0.5]. x,y in pixels; safe to call anywhere, any frame.
    getRadiationDose: function(x, y) {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var phase = this.beltPhase;
      if (phase < BELT_PHASE_LO || phase > BELT_PHASE_HI) return 0;
      var normX = x / W;
      var dist = Math.abs(normX - this.beltCentreNorm);
      var lateral = Math.max(0, 0.35 * (1 - dist / 0.18));
      // Mild vertical falloff: canopy (top third) sees full dose, floor sees ~40%.
      var vert = 0.4 + 0.6 * (1 - Math.min(1, y / (H * 0.66)));
      return lateral * vert;
    },
    // Canopy shadow factor in [0,1]; 0 = open sky, 1 = deep interception.
    canopyShadow: function(x) {
      if (!this._shadowCache) return 0.35;
      var W = (typeof width === 'number' && width > 0) ? width : this._shadowCache.length;
      var i = Math.max(0, Math.min(this._shadowCache.length - 1, Math.floor(x * this._shadowCache.length / W)));
      return this._shadowCache[i];
    }
  };

  nasaHooks.push({
    degree: '1.1',
    init: function() {
      // Pre-build shadow cache: 64 columns is plenty; sinusoidal trunk spacing.
      var N = 64, cache = new Array(N);
      for (var i = 0; i < N; i++) {
        // Base 30% interception; trunks add local spikes, gaps relax it.
        var u = i / N;
        cache[i] = 0.30 + 0.20 * Math.abs(Math.sin(u * Math.PI * 7.0))
                       + 0.10 * Math.sin(u * Math.PI * 13.0 + 1.3);
        if (cache[i] < 0.05) cache[i] = 0.05;
        if (cache[i] > 0.65) cache[i] = 0.65;
      }
      nasaState.v1_1._shadowCache = cache;
      nasaState.v1_1._shadowStamp = 0;
    },
    tick: function(fn) {
      var s = nasaState.v1_1;
      // Per-frame: advance phase (cheap, needed for dose queries by later degrees).
      s.beltPhase = (fn % ORBIT_FRAMES) / ORBIT_FRAMES;

      // Per-second: drift belt centre; optionally boost near v1_0 mycelium pulses.
      if (fn % 60 === 0) {
        s.beltCentreNorm = 0.6 + 0.2 * Math.sin(fn * 0.0003 * 60);
        if (nasaState.v1_0 && nasaState.v1_0.pulses && nasaState.v1_0.pulses.length) {
          // If any pulse lies within 10% of belt centre, nudge centre toward it
          // (ionised soil moisture couples radiation to mycelium). Small effect.
          var W = (typeof width === 'number' && width > 0) ? width : 960;
          var target = s.beltCentreNorm, best = 0.12;
          for (var i = 0; i < nasaState.v1_0.pulses.length; i++) {
            var p = nasaState.v1_0.pulses[i];
            if (!p) continue;
            var px = (p.x || 0) / W;
            var d = Math.abs(px - s.beltCentreNorm);
            if (d < best) { best = d; target = px; }
          }
          s.beltCentreNorm = s.beltCentreNorm * 0.85 + target * 0.15;
        }
      }

      // Per-orbit event: belt crossing. Bump counter; brief canopy flash overlay.
      if (fn % ORBIT_FRAMES === 0 && fn !== s.lastCrossFrame) {
        s.crossings += 1;
        s.lastCrossFrame = fn;
        // Tiny visual cue: a handful of amber-gold sparks along belt band.
        // Uses p5 globals (noStroke, fill, ellipse). Reuses no array.
        if (typeof noStroke === 'function' && typeof fill === 'function' && typeof ellipse === 'function') {
          var W = (typeof width === 'number' && width > 0) ? width : 960;
          var H = (typeof height === 'number' && height > 0) ? height : 540;
          noStroke();
          fill(212, 160, 48, 140);
          var cx = s.beltCentreNorm * W;
          for (var k = 0; k < 8; k++) {
            var sx = cx + (Math.random() - 0.5) * W * 0.18;
            var sy = Math.random() * H * 0.45;
            ellipse(sx, sy, 2.0 + Math.random() * 2.0, 2.0 + Math.random() * 2.0);
          }
        }
      }
    }
  });
})();

// --- DEGREE v1_2 ---
/* ==== DEGREE v1.2 — Sword Fern Failure Mapping ====
 * Source spec: ../NASA/1.2/forest-module/sword-fern-failure-mapping.js
 * Triad: NASA=Explorer 2 · S36=deg-5 pairing · SPS=Pacific Wren / Polystichum munitum
 * Couplings: lsystem (fern growth pulse), physarum (failure-zone nutrient sink), audio (implicit)
 * Emergent contribution: 4-beat ignition cycle with suppressed 4th beat stamps persistent
 *   propagation-failure zones; exposes getFailurePressure(x,y) for later degrees.
 */
(function() {
  nasaState.v1_2 = {
    stagingCount: 0,           // 1..4 cycling
    failureZones: [],          // {x, y, birth, strength}
    propagationFailures: 0,    // cumulative count — published for scorer / later degrees
    _lastBeat: 0,              // frameNum of last beat
    getFailurePressure: function(x, y) {
      // 0..1 scalar — how much past stage-4 failure saturates this site.
      var sum = 0, zs = nasaState.v1_2.failureZones;
      for (var i = 0; i < zs.length; i++) {
        var dx = x - zs[i].x, dy = y - zs[i].y;
        var d2 = dx*dx + dy*dy;
        if (d2 < 14400) sum += zs[i].strength * Math.exp(-d2 / 3600);
      }
      return Math.min(1, sum);
    }
  };

  nasaHooks.push({
    degree: '1.2',
    init: function() {
      nasaState.v1_2._lastBeat = frameNum || 0;
    },
    tick: function(fn) {
      var st = nasaState.v1_2;

      // Age out zones (decay over ~30s) to bound memory.
      if (fn % 60 === 0 && st.failureZones.length > 0) {
        for (var i = st.failureZones.length - 1; i >= 0; i--) {
          st.failureZones[i].strength *= 0.985;
          if (st.failureZones[i].strength < 0.02 || fn - st.failureZones[i].birth > 4800) {
            st.failureZones.splice(i, 1);
          }
        }
      }

      // 4-beat cycle — beat every ~132 frames (~2.2s), matching source spec's 2200ms.
      if (fn - st._lastBeat < 132) return;
      st._lastBeat = fn;
      st.stagingCount = (st.stagingCount % 4) + 1;

      // Pick a beat location — random understory patch, avoid clustering on
      // v1_0 Armillaria pulse centres if that degree is publishing them.
      var bx = 0.15 * width + Math.random() * 0.7 * width;
      var by = 0.55 * height + Math.random() * 0.4 * height;
      if (nasaState.v1_0 && nasaState.v1_0.pulses && nasaState.v1_0.pulses.length > 0) {
        var tries = 0;
        while (tries++ < 3) {
          var p = nasaState.v1_0.pulses[0];
          if (Math.abs(bx - p.x) + Math.abs(by - p.y) > 120) break;
          bx = 0.15 * width + Math.random() * 0.7 * width;
        }
      }

      if (st.stagingCount === 4) {
        // Suppressed beat — stamp failure zone, record propagation failures on nearby drifting sword-fern seeds.
        st.failureZones.push({ x: bx, y: by, birth: fn, strength: 0.5 });
        for (var s = 0; s < seeds.length; s++) {
          if (seeds[s].type !== 0) continue; // sword fern is PLANT_TYPES[0]
          var ddx = seeds[s].x - bx, ddy = seeds[s].y - by;
          if (ddx*ddx + ddy*ddy < 3600) {
            seeds[s].life = Math.max(30, seeds[s].life * 0.5);
            st.propagationFailures++;
          }
        }
      } else {
        // Successful beat — nudge nearest sword-fern's segment cache to refresh (growth pulse).
        var best = null, bestD = 22500; // 150px
        for (var p = 0; p < plants.length; p++) {
          if (plants[p].type !== 0) continue;
          var dx2 = plants[p].x - bx, dy2 = plants[p].y - by;
          var d2 = dx2*dx2 + dy2*dy2;
          if (d2 < bestD) { bestD = d2; best = plants[p]; }
        }
        if (best && best.growth < 0.98) {
          best.growth = Math.min(1, best.growth + 0.01);
          best.computeSegments();
        }
      }
    }
  });
})();

// --- DEGREE v1_3 ---
/* ==== DEGREE v1.3 — Western Red Cedar Orbital Longevity ====
 * Source spec: ../NASA/1.3/forest-module/western-red-cedar-orbital-longevity.js
 * Triad: NASA=Vanguard 1 · S36=(degree 3 hub-tree slot) · SPS=Varied Thrush
 * Couplings: physarum (cedar mycorrhizal field) · lsystem (growth-ring events) · audio (108 Hz beacon)
 * Emergent contribution: publishes mature-cedar "hub tree" directory with per-hub ring counters
 *   on ~8s compressed-century cadence; reads v1_0 Armillaria pulses to flag mycelial-linked hubs.
 */
(function() {
  nasaState.v1_3 = {
    hubs: [],          // {x, y, plantIdx, rings, armillariaLinked, lastRingFrame}
    lastScan: 0,
    getNearestHub: function(x, y) {
      var best = null, bestD = Infinity;
      for (var i = 0; i < this.hubs.length; i++) {
        var h = this.hubs[i];
        var dx = h.x - x, dy = h.y - y;
        var d = dx*dx + dy*dy;
        if (d < bestD) { bestD = d; best = h; }
      }
      return best;
    }
  };

  function rescan() {
    var state = nasaState.v1_3;
    state.hubs.length = 0;
    if (typeof plants === 'undefined' || !plants) return;
    for (var i = 0; i < plants.length; i++) {
      var p = plants[i];
      // PLANT_TYPES[1] is cedar (Thuja plicata, hub tree)
      if (p.type === 1 && p.growth > 0.7) {
        state.hubs.push({
          x: p.x, y: p.y, plantIdx: i, rings: 0,
          armillariaLinked: false, lastRingFrame: 0
        });
      }
    }
  }

  nasaHooks.push({
    degree: '1.3',
    init: function() { rescan(); },
    tick: function(fn) {
      var state = nasaState.v1_3;
      // Rescan cedars once/sec — cheap; hub set is tiny
      if (fn % 60 === 0) rescan();

      // Accrue a growth ring every ~8 s (compressed centuries); cap at 64
      if (fn % 480 === 0 && state.hubs.length > 0) {
        var pulses = (nasaState.v1_0 && nasaState.v1_0.pulses) || null;
        for (var i = 0; i < state.hubs.length; i++) {
          var h = state.hubs[i];
          if (h.rings < 64) { h.rings++; h.lastRingFrame = fn; }
          // Cross-reference v1_0 Armillaria pulses — cedars are Armillaria hosts
          h.armillariaLinked = false;
          if (pulses) {
            for (var j = 0; j < pulses.length; j++) {
              var pu = pulses[j];
              var dx = pu.x - h.x, dy = pu.y - h.y;
              var rr = (pu.r || 40);
              if (dx*dx + dy*dy < rr*rr) { h.armillariaLinked = true; break; }
            }
          }
        }
      }

      // Render faint cedar-green halo once every 2 s (no per-frame cost)
      if (fn % 120 !== 0) return;
      if (typeof noFill !== 'function' || typeof ellipse !== 'function') return;
      noFill();
      for (var k = 0; k < state.hubs.length; k++) {
        var hh = state.hubs[k];
        var rings = hh.rings;
        var alpha = Math.min(0.18, 0.04 + rings * 0.002);
        if (hh.armillariaLinked) alpha *= 1.4;
        var rad = 18 + rings * 0.6;
        // Cedar-green (cedar-green-dim palette, #1A3A1A territory)
        stroke(46, 90, 52, alpha * 255);
        strokeWeight(0.8);
        ellipse(hh.x, hh.y, rad, rad * 0.6);
      }
    }
  });
})();

// --- DEGREE v1_4 ---
/* ==== DEGREE v1.4 — Red Alder Nitrogen Pulse ====
 * Source spec: ../NASA/1.4/forest-module/red-alder-nitrogen-pulse.js
 * Triad: NASA=Explorer 3 · S36=Lise Meitner · SPS=Band-tailed Pigeon (Alnus rubra)
 * Couplings: physarum (nutrient-source), lsystem (leaf-density), audio (layer)
 * Emergent contribution: Alder trees episodically emit a nitrogen-boost field;
 *   nearby non-alder plants grow ~6% faster while a pulse is active. Confirms
 *   Explorer 3's orbit-cycle as periodic N-flush (store-and-forward telemetry).
 */
(function() {
  nasaState.v1_4 = {
    pulses: [],          // { x, y, birth, spread, intensity }
    lastOrbit: -1,
    orbitCount: 0,
    getBoost: function(x, y) {
      var s = 0, P = nasaState.v1_4.pulses, i, p, dx, dy, sp;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        sp = p.spread;
        dx = x - p.x; dy = y - p.y;
        s += p.intensity * Math.exp(-(dx*dx + dy*dy) / (sp*sp));
      }
      return s > 0.8 ? 0.8 : s;
    }
  };

  nasaHooks.push({
    degree: '1.4',
    init: function() {
      nasaState.v1_4.lastOrbit = frameNum;
    },
    tick: function(fn) {
      var S = nasaState.v1_4, P = S.pulses, i;
      // Age and expand live pulses (per-frame, but cheap: just mutate floats)
      for (i = P.length - 1; i >= 0; i--) {
        var age = (fn - P[i].birth) / 60; // seconds
        if (age > 12) { P.splice(i, 1); continue; }
        P[i].spread = 80 + age * 30;
        P[i].intensity = P[i].intensity0 * (1 - age / 12);
      }
      // Orbit completion every 600 frames (~10s at 60fps)
      if (fn - S.lastOrbit >= 600) {
        S.lastOrbit = fn;
        S.orbitCount++;
        var ex = width * 0.5, ey = height * 0.55;
        // Prefer an alder base (PLANT_TYPES[3] = alder, pioneer:true)
        var alders = [], j;
        for (j = 0; j < plants.length; j++) {
          if (plants[j].type === 3 && plants[j].growth > 0.2) alders.push(plants[j]);
        }
        if (alders.length) {
          var a = alders[(Math.random() * alders.length) | 0];
          ex = a.x; ey = a.y - 20;
        }
        // v1_0 mycelium coupling: drift toward nearest active pulse if present
        if (nasaState.v1_0 && nasaState.v1_0.pulses && nasaState.v1_0.pulses.length) {
          var m = nasaState.v1_0.pulses[0];
          ex = ex * 0.6 + m.x * 0.4; ey = ey * 0.6 + m.y * 0.4;
        }
        var inten = 0.55 + Math.random() * 0.25;
        P.push({ x: ex, y: ey, birth: fn, spread: 80, intensity: inten, intensity0: inten });
      }
      // Apply growth boost to nearby non-alder plants (once per second)
      if (fn % 60 !== 0 || !P.length) return;
      for (i = 0; i < plants.length; i++) {
        var pl = plants[i];
        if (pl.type === 3 || pl.growth >= pl.maxGrowth) continue;
        var b = S.getBoost(pl.x, pl.y);
        if (b > 0.05) pl.growth = Math.min(pl.maxGrowth, pl.growth + b * 0.0006);
      }
    }
  });
})();

// --- DEGREE v1_5 ---
/* ==== DEGREE v1.5 — Tardigrade Cryptobiosis on Moss Film ====
 * Source spec: ../NASA/1.5/forest-module/NOT_APPLICABLE.md (retro-reversed)
 * Triad: NASA=Explorer 4 + Argus · S36=(unassigned, Christofilos dedication) · SPS=Ramazzottius/Hypsibius
 * Couplings: PLANT_TYPES[2] moss, wx.isRaining, wx.humidity, groundMoisture, rain event
 * Emergent contribution: invisible micro-colonies on moss plants that flip tun<->active
 *   on moisture, ignoring any published radiation dose (Dsup narrative).
 */
(function() {
  nasaState.v1_5 = {
    tuns: 0,
    active: 0,
    colonies: [],       // [{plantRef, count, state: 'tun'|'active', revivalFrame}]
    lastRebuild: -9999,
    reviveFlashUntil: 0 // frameNum until which we paint violet stipples
  };

  function rebuildColonies() {
    var cols = nasaState.v1_5.colonies;
    cols.length = 0;
    for (var i = 0; i < plants.length; i++) {
      if (plants[i].type === 2 && plants[i].growth > 0.3) {
        cols.push({
          plantRef: plants[i],
          count: 3 + floor(random(10)), // 3-12 animals per moss
          state: 'tun',
          revivalFrame: -1
        });
      }
    }
  }

  function moistureOk() {
    return groundMoisture > 0.5 || wx.humidity > 85 || wx.isRaining;
  }

  nasaHooks.push({
    degree: '1.5',
    init: function() {
      nasaState.v1_5.lastRebuild = 0;
      rebuildColonies();
    },
    tick: function(fn) {
      if (fn % 60 !== 0) {
        // cheap per-frame: just the revival stipple render
        if (fn < nasaState.v1_5.reviveFlashUntil && nasaState.v1_5.colonies.length) {
          push();
          noStroke();
          for (var k = 0; k < nasaState.v1_5.colonies.length; k++) {
            var c = nasaState.v1_5.colonies[k];
            if (c.state !== 'active') continue;
            var p = c.plantRef;
            // argus-violet stipple — 112,48,160
            fill(112, 48, 160, 90);
            for (var s = 0; s < c.count; s++) {
              var sx = p.x + (noise(s * 0.3, fn * 0.02) - 0.5) * 14;
              var sy = p.y - 2 + (noise(s * 0.7, fn * 0.02 + 7) - 0.5) * 6;
              ellipse(sx, sy, 1.2, 1.2);
            }
          }
          pop();
        }
        return;
      }
      // per-second state-machine work
      if (fn - nasaState.v1_5.lastRebuild > 3600) { // rebuild once/minute
        rebuildColonies();
        nasaState.v1_5.lastRebuild = fn;
      }
      var wet = moistureOk();
      var tuns = 0, active = 0;
      for (var i = 0; i < nasaState.v1_5.colonies.length; i++) {
        var c = nasaState.v1_5.colonies[i];
        if (wet && c.state === 'tun') {
          c.state = 'active';
          c.revivalFrame = fn;
          nasaState.v1_5.reviveFlashUntil = fn + 120;
        } else if (!wet && c.state === 'active' && fn - c.revivalFrame > 300) {
          c.state = 'tun';
        }
        if (c.state === 'tun') tuns += c.count; else active += c.count;
      }
      nasaState.v1_5.tuns = tuns;
      nasaState.v1_5.active = active;
      // Dsup narrative: intentionally ignore nasaState.v1_1.radiationDose if present.
    },
    event: function(name, payload) {
      if (name === 'rain') {
        // force-revive all colonies on rain onset
        for (var i = 0; i < nasaState.v1_5.colonies.length; i++) {
          var c = nasaState.v1_5.colonies[i];
          if (c.state === 'tun') {
            c.state = 'active';
            c.revivalFrame = frameNum;
          }
        }
        nasaState.v1_5.reviveFlashUntil = frameNum + 180;
      }
    }
  });
})();

// --- DEGREE v1_6 ---
/* ==== DEGREE v1.6 — Fireweed Succession Bloom ====
 * Source spec: ../NASA/1.6/forest-module/fireweed-succession-bloom.js
 * Triad: NASA=Pioneer 0 · S36=Pearl Bailey · SPS=Chamerion angustifolium
 * Couplings: physarum (scar field), lsystem (fireweed recruitment), audio (bloom whisper via bloomFront readership)
 * Emergent contribution: disturbance events carve scars; fireweed preferentially recruits on scar margins;
 * mature fireweed plants publish a bloom-front so later pollinators can converge on it.
 */
(function() {
  nasaState.v1_6 = {
    scars: [],          // {x, y, r, birthFrame, phase}  phase: 'burn'|'bare'|'bloom'|'recovery'
    bloomFront: [],     // {x, y, intensity, frame} — snapshot of blooming fireweed
    recentDisturbance: 0, // counter: frames since last disturbance event
    lastBurnFrame: -9999,
    MAX_SCARS: 4,
    _gustPrev: 0,
  };

  nasaHooks.push({
    degree: '1.6',
    init: function() {
      nasaState.v1_6.recentDisturbance = 999999;
    },
    tick: function(fn) {
      var S = nasaState.v1_6;
      S.recentDisturbance++;

      // --- per-second: detect disturbance events (1/sec) ---
      if (fn % 60 === 0) {
        var gust = (typeof wx !== 'undefined' && wx.windGust) ? wx.windGust : 0;
        var burned = false;
        // Wind-gust disturbance: sudden rise above 35 km/h from low baseline
        if (gust > 35 && S._gustPrev < 20 && (fn - S.lastBurnFrame) > 900) burned = true;
        // Baseline ambient-burn poll: roughly once every ~10 min expected value
        if (!burned && Math.random() < 0.0015 && (fn - S.lastBurnFrame) > 1800) burned = true;
        S._gustPrev = gust;

        if (burned && S.scars.length < S.MAX_SCARS) {
          var sx = 80 + Math.random() * (width - 160);
          var sy = height - 40 - Math.random() * 180;
          var sr = 55 + Math.random() * 40;
          S.scars.push({ x: sx, y: sy, r: sr, birthFrame: fn, phase: 'burn' });
          S.lastBurnFrame = fn;
          S.recentDisturbance = 0;
        }

        // --- age scars through phases, recruit fireweed at bloom onset ---
        for (var i = S.scars.length - 1; i >= 0; i--) {
          var sc = S.scars[i];
          var ageSec = (fn - sc.birthFrame) / 60;
          if (ageSec < 4)       sc.phase = 'burn';
          else if (ageSec < 18) sc.phase = 'bare';
          else if (ageSec < 80) sc.phase = 'bloom';
          else if (ageSec < 140) sc.phase = 'recovery';
          else { S.scars.splice(i, 1); continue; }

          // Recruitment pulse: on bare→bloom transition (once) spawn 2-3 fireweed on scar margin
          if (sc.phase === 'bloom' && !sc._seeded && typeof Plant === 'function' && plants.length < 120) {
            sc._seeded = true;
            var n = 2 + Math.floor(Math.random() * 2);
            for (var k = 0; k < n; k++) {
              var a = Math.random() * Math.PI * 2;
              var d = sc.r * (0.55 + Math.random() * 0.35);
              var px = sc.x + Math.cos(a) * d;
              var py = sc.y + Math.sin(a) * d * 0.3; // flatten onto ground band
              plants.push(new Plant(px, py, 4)); // type 4 = fireweed
            }
          }

          // Fast-track any seed landing inside a bloom-phase scar: bias ground adhesion
          if (sc.phase === 'bloom' && typeof seeds !== 'undefined') {
            for (var s = 0; s < seeds.length; s++) {
              var sd = seeds[s];
              if (sd.type !== 4 || sd.grounded) continue;
              var ddx = sd.x - sc.x, ddy = sd.y - sc.y;
              if (ddx * ddx + ddy * ddy < sc.r * sc.r) sd.life = Math.min(sd.life, 30);
            }
          }
        }
      }

      // --- per-frame: refresh bloom-front snapshot cheaply (every 30 frames) ---
      if (fn % 30 === 0) {
        S.bloomFront.length = 0;
        for (var p = 0; p < plants.length && S.bloomFront.length < 32; p++) {
          var pl = plants[p];
          if (pl.type === 4 && pl.growth > 0.55) {
            S.bloomFront.push({
              x: pl.x,
              y: pl.y - pl.baseLen * pl.growth * 0.6,
              intensity: Math.min(1, (pl.growth - 0.55) / 0.4),
              frame: fn
            });
          }
        }
      }
    }
  });
})();

// --- DEGREE v1_7 ---
/* ==== DEGREE v1.7 — Fly Agaric Mycorrhizal Pulse ====
 * Source spec: ../NASA/1.7/forest-module/fly-agaric-mycorrhizal-pulse.js
 * Triad: NASA=Explorer S-1 (Juno I separation failure, 24 Aug 1958) · Dedication=Borges · SPS=Amanita muscaria
 * Couplings: physarum (nutrient-source), audio (layer), lsystem (leaf-density)
 * Emergent contribution: ectomycorrhizal fruiting clusters near the v1.3 cedar hub, pulsed by a photosynthesis day cycle; complements v1.0's saprotrophic pulse list.
 */
(function() {
  nasaState.v1_7 = {
    fruits: [],      // {x, y, birth, scale} visible fruiting bodies
    dayPhase: 0,     // 0..1 photosynthesis cycle
    lastEmerge: -1,  // frameNum of last emergence
    hub: null,       // {x, y} cached host anchor
    emergeEvery: 720 // frames between emergences (~12s @ 60fps)
  };

  nasaHooks.push({
    degree: '1.7',
    init: function() {
      var s = nasaState.v1_7;
      // Prefer v1.3 cedar hub if earlier degree published one; otherwise find a cedar plant; else canvas center.
      if (nasaState.v1_3 && nasaState.v1_3.hub) {
        s.hub = { x: nasaState.v1_3.hub.x, y: nasaState.v1_3.hub.y };
      } else {
        var best = null;
        for (var i = 0; i < plants.length; i++) {
          if (plants[i] && plants[i].pt && plants[i].pt.name === 'cedar') { best = plants[i]; break; }
        }
        s.hub = best ? { x: best.x, y: best.y } : { x: width * 0.45, y: height * 0.7 };
      }
    },
    tick: function(fn) {
      var s = nasaState.v1_7;
      // Advance day cycle once per second (~30s period).
      if (fn % 60 === 0) {
        s.dayPhase = ((fn / 60) % 30) / 30;
        // Emergence check on the same second-gate.
        if (fn - s.lastEmerge >= s.emergeEvery || s.lastEmerge < 0) {
          s.lastEmerge = fn;
          var n = 3 + Math.floor(Math.random() * 5);
          for (var i = 0; i < n; i++) {
            var angle = Math.random() * Math.PI * 2;
            var dist = 20 + Math.random() * 70;
            s.fruits.push({
              x: s.hub.x + Math.cos(angle) * dist,
              y: s.hub.y + Math.sin(angle) * dist * 0.6,
              birth: fn,
              scale: 0
            });
          }
        }
        // Age + cull (fruits live ~14s).
        var keep = [];
        for (var j = 0; j < s.fruits.length; j++) {
          var f = s.fruits[j];
          var ageSec = (fn - f.birth) / 60;
          if (ageSec > 14) continue;
          f.scale = Math.min(1, ageSec / 2.5);
          keep.push(f);
        }
        s.fruits = keep;
      }
      // Per-frame: tiny red-cap dots with white wart, alpha driven by day pulse.
      if (s.fruits.length === 0) return;
      var pulse = 0.5 + 0.5 * Math.sin(s.dayPhase * Math.PI * 2);
      noStroke();
      for (var k = 0; k < s.fruits.length; k++) {
        var fb = s.fruits[k];
        var ageSec2 = (fn - fb.birth) / 60;
        var a = Math.max(0, fb.scale * (1 - Math.max(0, (ageSec2 - 10) / 4)));
        var r = 3 + 2 * fb.scale;
        fill(204, 48, 48, 255 * a * (0.7 + 0.3 * pulse));
        ellipse(fb.x, fb.y, r * 2, r * 2);
        if (r > 2) {
          fill(240, 230, 220, 200 * a);
          ellipse(fb.x - r * 0.2, fb.y - r * 0.2, r * 0.7, r * 0.7);
        }
      }
    }
  });
})();

// --- DEGREE v1_8 ---
/* ==== DEGREE v1.8 — Sword Fern Frond Unfurl Phenology ====
 * Source spec: ../NASA/1.8/forest-module/sword-fern-frond-unfurl.js
 * Triad: NASA=Pioneer 1 · S36=Van Gogh · SPS=Varied Thrush
 * Couplings: lsystem-density (existing fern rendering), geometric spiral overlay
 * Emergent contribution: logarithmic-spiral unfurl decorator on fresh fern seedlings;
 *   publishes per-plant unfurl-phase state for later degrees to key off.
 */
(function() {
  nasaState.v1_8 = {
    unfurlers: [],           // {plantIdx, x, y, born, life}
    knownCount: 0,           // plants.length snapshot
    getUnfurlPhase: function(plantIdx) {
      var list = nasaState.v1_8.unfurlers;
      for (var i = 0; i < list.length; i++) {
        if (list[i].plantIdx === plantIdx) {
          return (frameNum - list[i].born) / list[i].life;
        }
      }
      return null; // not unfurling
    }
  };

  nasaHooks.push({
    degree: '1.8',
    tick: function(fn) {
      var st = nasaState.v1_8;
      // --- once/sec: detect newly-spawned fern seedlings (PLANT_TYPES[0]) ---
      if (fn % 60 === 0 && plants.length > st.knownCount) {
        for (var i = st.knownCount; i < plants.length; i++) {
          if (plants[i].type === 0 && plants[i].age < 120) {
            st.unfurlers.push({
              plantIdx: i, x: plants[i].x, y: plants[i].y,
              born: fn, life: 180
            });
          }
        }
        st.knownCount = plants.length;
        if (st.unfurlers.length > 12) st.unfurlers.splice(0, st.unfurlers.length - 12);
      }
      // --- per-frame: render active spirals (cheap — ≤12 × ~30 segments) ---
      var alive = [];
      for (var u = 0; u < st.unfurlers.length; u++) {
        var uf = st.unfurlers[u];
        var t = (fn - uf.born) / uf.life;
        if (t >= 1) continue;
        alive.push(uf);
        // Logarithmic spiral: r = a * e^(b*theta), b tied to golden ratio
        var maxTheta = (1 - t) * Math.PI * 3.0;  // 1.5 turns → 0
        var len = 6 + t * 22;
        var da = depthAlpha(uf.y);
        var g = 110 + Math.floor(t * 50);
        stroke(55, g, 45, (0.55 * da) * 255);
        strokeWeight(1.1);
        noFill();
        beginShape();
        var steps = 16;
        for (var k = 0; k <= steps; k++) {
          var th = (k / steps) * maxTheta;
          var r = len * Math.exp(-0.306 * th);  // 0.306 ≈ ln(phi)/pi*2 (Fibonacci)
          vertex(uf.x + r * Math.cos(th - Math.PI * 0.5), uf.y - r * Math.sin(th - Math.PI * 0.5) * 0.85);
        }
        endShape();
      }
      st.unfurlers = alive;
    }
  });
})();

// --- DEGREE v1_9a ---
/* ==== DEGREE v1.9a — Pacific Madrone Bark Shedding Phenology ====
 * Source spec: ../NASA/1.9/forest-module/pacific-madrone-bark-shed.js
 * Triad: NASA=Pioneer 2 · S36=(v1.9 pair) · SPS=Pacific Madrone
 * Couplings: lsystem (density hint via canopy read), audio (silent here — layer owned by module), kuramoto (annual phase reference)
 * Emergent contribution: publishes an annual shed-phase scalar + shedding events;
 *   emits cinnamon-to-chartreuse curl particles falling from canopy during
 *   summer peak (season ~0.72-0.95); reads v1_1 canopy shadow to bias origins.
 */
(function() {
  nasaState.v1_9a = {
    shedPhase: 0, sheddingActive: false, lastShedFrame: -9999,
    shedEvents: 0, _curls: [], _wasShedding: false,
    getShedPhase: function() { return this.shedPhase; }
  };
  nasaHooks.push({
    degree: '1.9a',
    init: function() { nasaState.v1_9a._curls.length = 0; },
    tick: function(fn) {
      var s = nasaState.v1_9a;
      // Annual phase: map global season (0..1) to shed-window intensity.
      // Window: season ∈ [0.72, 0.95]; ramp up, plateau, sharp fall.
      var sv = (typeof season === 'number') ? season : 0;
      var phase = 0;
      if (sv >= 0.72 && sv <= 0.95) {
        var u = (sv - 0.72) / 0.23;
        phase = u < 0.3 ? u / 0.3 : (u < 0.8 ? 1 : (1 - u) / 0.2);
        if (phase < 0) phase = 0;
      }
      s.shedPhase = phase;
      s.sheddingActive = phase > 0.2;
      // Rising-edge onset: emit burst of curls biased toward dense canopy cols.
      if (s.sheddingActive && !s._wasShedding) {
        s.shedEvents += 1; s.lastShedFrame = fn;
        var W = (typeof width === 'number' && width > 0) ? width : 960;
        var H = (typeof height === 'number' && height > 0) ? height : 540;
        var burst = 6 + Math.floor(Math.random() * 8);
        for (var i = 0; i < burst; i++) {
          var cx = Math.random() * W;
          if (nasaState.v1_1 && typeof nasaState.v1_1.canopyShadow === 'function') {
            var c1 = Math.random() * W, c2 = Math.random() * W;
            cx = (nasaState.v1_1.canopyShadow(c1) >= nasaState.v1_1.canopyShadow(c2)) ? c1 : c2;
          }
          s._curls.push({
            x: cx, y: 0.05 * H + Math.random() * 0.35 * H,
            vx: (Math.random() - 0.5) * 0.6, vy: 0.35 + Math.random() * 0.7,
            rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.05,
            age: 0, maxAge: 180 + Math.floor(Math.random() * 140)
          });
        }
      }
      s._wasShedding = s.sheddingActive;
      // Per-frame curl physics + draw (skip if no curls).
      if (!s._curls.length) return;
      if (typeof stroke !== 'function' || typeof noFill !== 'function') return;
      noFill();
      var alive = [];
      for (var k = 0; k < s._curls.length; k++) {
        var c = s._curls[k]; c.age += 1;
        if (c.age > c.maxAge) continue;
        c.x += c.vx; c.y += c.vy; c.vy += 0.02; c.rot += c.spin;
        var t = c.age / c.maxAge;
        // Cinnamon (192,112,72) → chartreuse (74,120,64).
        var r = Math.floor(192 + t * (74 - 192));
        var g = Math.floor(112 + t * 8);
        var b = Math.floor(72 + t * (-8));
        var a = (t < 0.85) ? 180 : Math.floor(180 * (1 - (t - 0.85) / 0.15));
        stroke(r, g, b, a);
        if (typeof push === 'function') push();
        if (typeof translate === 'function') translate(c.x, c.y);
        if (typeof rotate === 'function') rotate(c.rot);
        if (typeof line === 'function') { line(-4, 0, 4, 0); line(-2, -1, 2, 1); }
        if (typeof pop === 'function') pop();
        alive.push(c);
      }
      s._curls = alive;
    }
  });
})();

// --- DEGREE v1_9b ---
/* ==== DEGREE v1.9b — Rhinoceros Auklet Colonial Nesting ====
 * Source spec: ../NASA/1.9/forest-module/rhinoceros-auklet-colonial-nesting.js
 * Triad: NASA=Pioneer 2 (signal lost at stage separation) · S36=Halley (v1.9) · SPS=Rhinoceros Auklet
 * Couplings: boids-attractor (colony centers), audio-event (conceptual dusk surge), circadian-phase-offset (inverted: dusk peak)
 * Emergent contribution: publishes four colony-center anchors usable by later degrees;
 *   state-machine-gated dusk-return surge triggered by sky.sunAlt crossing below horizon,
 *   inverting the default diurnal signature of earlier degrees' bird behaviour.
 */
(function() {
  // Normalised burrow-cluster anchors from source spec (Protection Island stylisation).
  var ANCHORS = [
    { nx: 0.18, ny: 0.72 }, { nx: 0.35, ny: 0.65 },
    { nx: 0.55, ny: 0.70 }, { nx: 0.72, ny: 0.68 }
  ];
  var DUSK_ENTER_ALT = -4;   // degrees below horizon to trigger return
  var DAWN_EXIT_ALT  =  2;   // degrees above horizon to clear colony
  var SURGE_RISE = 120;      // frames (~2 s @ 60fps) to full surge
  var SURGE_HOLD = 480;      // frames (~8 s) sustained
  var SURGE_FALL = 180;      // frames (~3 s) decay

  nasaState.v1_9b = {
    state: 'DAYTIME_ABSENT',
    colonyCenters: [],       // filled at init; {x,y} pixel coords for later degrees
    returnSurge: 0,          // 0..1 envelope
    returns: 0,
    _surgeFrame: -9999       // frame the last dusk transition fired
  };

  nasaHooks.push({
    degree: '1.9b',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var centers = [];
      for (var i = 0; i < ANCHORS.length; i++) {
        centers.push({ x: ANCHORS[i].nx * W, y: ANCHORS[i].ny * H });
      }
      nasaState.v1_9b.colonyCenters = centers;
    },
    tick: function(fn) {
      var s = nasaState.v1_9b;
      var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;

      // State transitions (hysteresis prevents flicker at the horizon).
      if (s.state === 'DAYTIME_ABSENT' && alt < DUSK_ENTER_ALT) {
        s.state = 'DUSK_RETURN';
        s.returns += 1;
        s._surgeFrame = fn;
      } else if (s.state === 'DUSK_RETURN' && alt > DAWN_EXIT_ALT) {
        s.state = 'DAYTIME_ABSENT';
        s.returnSurge = 0;
      }

      // Envelope update (only while DUSK_RETURN).
      if (s.state === 'DUSK_RETURN') {
        var dt = fn - s._surgeFrame;
        if (dt < SURGE_RISE) s.returnSurge = dt / SURGE_RISE;
        else if (dt < SURGE_RISE + SURGE_HOLD) s.returnSurge = 1;
        else if (dt < SURGE_RISE + SURGE_HOLD + SURGE_FALL)
          s.returnSurge = 1 - (dt - SURGE_RISE - SURGE_HOLD) / SURGE_FALL;
        else s.returnSurge = 0.15; // residual roosted calls
      }

      // Per-10-frame render: steel-blue arc traces + ember anchor dots.
      if (fn % 10 !== 0 || s.returnSurge <= 0) return;
      if (typeof noFill !== 'function' || typeof stroke !== 'function') return;
      var a = s.returnSurge;
      noFill();
      stroke(112, 144, 176, 90 * a);
      strokeWeight(0.6);
      for (var c = 0; c < s.colonyCenters.length; c++) {
        var cc = s.colonyCenters[c];
        // Two converging arcs from above toward each burrow cluster.
        for (var k = 0; k < 3; k++) {
          var off = (k - 1) * 12;
          var sx = cc.x + off + Math.sin((fn + c * 37 + k * 11) * 0.05) * 18;
          var sy = cc.y - 60 - k * 8;
          line(sx, sy, cc.x, cc.y);
        }
      }
      if (a > 0.3 && typeof fill === 'function' && typeof ellipse === 'function') {
        noStroke();
        fill(192, 72, 48, 160 * a); // ember-red anchor marker (mission palette)
        for (var d = 0; d < s.colonyCenters.length; d++) {
          ellipse(s.colonyCenters[d].x, s.colonyCenters[d].y, 2.5, 2.5);
        }
      }
    }
  });
})();

// --- DEGREE v1_10 ---
/* ==== DEGREE v1.10 — Ramalina menziesii Lace Lichen Epiphyte ====
 * Source spec: ../NASA/1.10/forest-module/ramalina-lichen-epiphyte.js
 * Triad: NASA=Pioneer 3 · S36=Dave Brubeck · SPS=Clark's Nutcracker / Organism=Ramalina menziesii
 * Couplings: lsystem (leaf-density), physarum (humidity-field), circadian (dawn-fog)
 * Emergent contribution: publishes per-hub-tree lichen coverage that thrives in
 *   moderate shade + high hydration + low nitrogen — a slow bioindicator field
 *   cumulatively reading v1_1 canopyShadow, v1_3 hubs, v1_4 nitrogen pulses.
 */
(function() {
  var DAWN_FOG_PERIOD = 3600;  // ~60 s compressed diel cycle
  var SHADOW_OPTIMUM = 0.45;   // peak lichen growth at this canopy shadow
  var GROWTH_STEP = 480;       // frames (~8 s @ 60 fps) — Brubeck 5/4 off-beat
  var RENDER_STEP = 120;       // frames (~2 s) pendant render

  nasaState.v1_10 = {
    lichenByHub: {},   // hubIdx (plantIdx) -> coverage 0..1
    hydration: 0.5,
    lichenCoverageAt: function(x, y) {
      if (!nasaState.v1_3 || !nasaState.v1_3.hubs) return 0;
      var hubs = nasaState.v1_3.hubs, best = 0;
      for (var i = 0; i < hubs.length; i++) {
        var h = hubs[i];
        var dx = h.x - x, dy = h.y - y;
        if (dx*dx + dy*dy < 60*60) {
          var cov = this.lichenByHub[h.plantIdx] || 0;
          if (cov > best) best = cov;
        }
      }
      return best;
    }
  };

  nasaHooks.push({
    degree: '1.10',
    init: function() { nasaState.v1_10.hydration = 0.5; },
    tick: function(fn) {
      var s = nasaState.v1_10;
      // Cheap per-frame: hydration follows dawn-fog oscillator (peak at phase 0).
      var phase = (fn % DAWN_FOG_PERIOD) / DAWN_FOG_PERIOD;
      var target = (phase < 0.15) ? 0.95 : (0.35 + 0.10 * Math.cos(phase * Math.PI * 2));
      s.hydration += (target - s.hydration) * 0.008;

      // Per-8s growth step across all v1_3 hubs.
      if (fn % GROWTH_STEP === 0 && nasaState.v1_3 && nasaState.v1_3.hubs) {
        var hubs = nasaState.v1_3.hubs;
        for (var i = 0; i < hubs.length; i++) {
          var h = hubs[i];
          // (a) canopy shadow gate (peak at 0.45)
          var shd = nasaState.v1_1 ? nasaState.v1_1.canopyShadow(h.x) : 0.35;
          var shadeGate = 1 - Math.min(1, Math.abs(shd - SHADOW_OPTIMUM) / 0.35);
          // (b) hydration gate
          var hydGate = s.hydration;
          // (c) inverse-nitrogen gate (alder pulses suppress)
          var nBoost = nasaState.v1_4 ? nasaState.v1_4.getBoost(h.x, h.y) : 0;
          var nGate = 1 - Math.min(1, nBoost / 0.6);
          // Old-tree bonus: ring count amplifies biomass ceiling
          var ringBonus = 0.5 + Math.min(0.5, (h.rings || 0) / 64);
          var dCov = 0.012 * shadeGate * hydGate * nGate * ringBonus;
          var cur = s.lichenByHub[h.plantIdx] || 0;
          s.lichenByHub[h.plantIdx] = Math.max(0, Math.min(1, cur + dCov - 0.0008));
        }
      }

      // Per-2s render: pale grey-green pendant lace at each hub, length = coverage.
      if (fn % RENDER_STEP !== 0) return;
      if (!nasaState.v1_3 || !nasaState.v1_3.hubs) return;
      if (typeof stroke !== 'function' || typeof line !== 'function') return;
      var hydAlpha = 0.25 + 0.45 * s.hydration;
      var hubs2 = nasaState.v1_3.hubs;
      for (var k = 0; k < hubs2.length; k++) {
        var hh = hubs2[k];
        var cov = s.lichenByHub[hh.plantIdx] || 0;
        if (cov < 0.05) continue;
        var strands = 2 + Math.floor(cov * 5);
        var len = 6 + cov * 28;
        stroke(138, 154, 112, 255 * hydAlpha * Math.min(1, cov * 1.6));
        strokeWeight(0.6);
        for (var t = 0; t < strands; t++) {
          var sx = hh.x + (t - strands/2) * 3.5;
          var sy = hh.y - 6;
          var wob = Math.sin((fn + t * 17) * 0.03) * (1.5 * s.hydration);
          line(sx, sy, sx + wob, sy + len);
        }
      }
    }
  });
})();

// --- DEGREE v1_11 ---
/* ==== DEGREE v1.11 — American Dipper Riparian Patrol ====
 * Source spec: ../NASA/1.11/forest-module/american-dipper-riparian.js
 * Triad: NASA=Pioneer 4 (first US heliocentric escape, 60,000 km lunar miss) · S36=(v1.11 pair, Bell dedication) · SPS=American Dipper (Cinclus mexicanus)
 * Couplings: boids-attractor (solo territorial, 5 waypoints), audio-layer (circadian-enveloped song published as scalar), lsystem-leaf-density (riparian moss — read-only hint)
 * Emergent contribution: single visible patrol agent along the stream-corridor
 *   bottom quarter, dipping periodically; publishes dipper position + song-phase
 *   (dawn/dusk peaked from sky.sunAlt) for later degrees to consume.
 */
(function() {
  // Normalised patrol waypoints from source spec _PATROL_WAYPOINTS.
  var WPS = [
    { nx: 0.15, ny: 0.78 }, { nx: 0.32, ny: 0.82 },
    { nx: 0.50, ny: 0.80 }, { nx: 0.68, ny: 0.77 },
    { nx: 0.82, ny: 0.81 }
  ];
  var DWELL_FRAMES = 252;   // ~4.2 s @ 60fps (source _WAYPOINT_DWELL_MS)
  var DIVE_FRAMES  = 30;    // ~0.5 s submerged
  var DIVE_DEPTH   = 7;     // px below baseline y
  var TRAVEL_SPEED = 1.0;   // px/frame between waypoints

  nasaState.v1_11 = {
    dipper: { x: 0, y: 0, wp: 0, phase: 'PATROL' },
    songPhase: 0,
    waypoints: [],
    dives: 0,
    _stateFrame: 0,
    _baselineY: 0
  };

  nasaHooks.push({
    degree: '1.11',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var pts = [];
      for (var i = 0; i < WPS.length; i++) {
        pts.push({ x: WPS[i].nx * W, y: WPS[i].ny * H });
      }
      nasaState.v1_11.waypoints = pts;
      nasaState.v1_11.dipper.x = pts[0].x;
      nasaState.v1_11.dipper.y = pts[0].y;
      nasaState.v1_11._baselineY = pts[0].y;
    },
    tick: function(fn) {
      var s = nasaState.v1_11;
      var d = s.dipper;
      var wps = s.waypoints;
      if (!wps.length) return;

      // Circadian song envelope: dawn proximity (0.25) + dusk proximity (0.75)
      // derived from sky.sunAlt mapped to normalised diurnal phase.
      var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;
      // sunAlt ~ +60° at noon, ~0° at civil twilight, ~-30° at night.
      // Map to peak-at-twilight scalar: |alt| near 0 = peak, large |alt| = trough.
      var twilightProx = Math.min(Math.abs(alt) / 12, 1);
      s.songPhase = 0.25 + 0.75 * Math.exp(-twilightProx * 2.8);

      // State machine: PATROL → DWELL → DIVE → PATROL.
      var target = wps[d.wp];
      if (d.phase === 'PATROL') {
        var dx = target.x - d.x, dy = target.y - d.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < TRAVEL_SPEED * 1.5) {
          d.x = target.x; d.y = target.y; s._baselineY = target.y;
          d.phase = 'DWELL'; s._stateFrame = fn;
        } else {
          d.x += (dx / dist) * TRAVEL_SPEED;
          d.y += (dy / dist) * TRAVEL_SPEED;
        }
      } else if (d.phase === 'DWELL') {
        // Characteristic bob while dwelling.
        d.y = s._baselineY + Math.sin((fn - s._stateFrame) * 0.22) * 1.6;
        if (fn - s._stateFrame >= DWELL_FRAMES) {
          // Half of dwells end with a dive; others advance directly.
          if (Math.random() < 0.55) {
            d.phase = 'DIVE'; s._stateFrame = fn; s.dives += 1;
          } else {
            d.wp = (d.wp + 1) % wps.length; d.phase = 'PATROL';
          }
        }
      } else if (d.phase === 'DIVE') {
        var t = (fn - s._stateFrame) / DIVE_FRAMES;
        d.y = s._baselineY + Math.sin(t * Math.PI) * DIVE_DEPTH;
        if (fn - s._stateFrame >= DIVE_FRAMES) {
          d.y = s._baselineY;
          d.wp = (d.wp + 1) % wps.length; d.phase = 'PATROL';
        }
      }

      // Render: slate-grey silhouette (source palette) + song arc when singing.
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      noStroke();
      fill(90, 122, 90, 235);
      if (typeof ellipse === 'function') {
        ellipse(d.x, d.y, 6, 4);       // body
        ellipse(d.x + 2.2, d.y - 0.8, 2.4, 2.2); // head
      }
      if (s.songPhase > 0.45 && typeof stroke === 'function' && typeof noFill === 'function') {
        var a = (s.songPhase - 0.45) / 0.55; if (a > 1) a = 1;
        noFill();
        stroke(230, 220, 180, 140 * a);
        strokeWeight(0.6);
        if (typeof arc === 'function') {
          arc(d.x, d.y - 9, 10, 6, Math.PI, Math.PI * 2);
        }
      }
    }
  });
})();

// --- DEGREE v1_12 ---
/* ==== DEGREE v1.12 — Osprey Aerial Predator ====
 * Source spec: ../NASA/1.12/forest-module/osprey-aerial-predator.js
 * Triad: NASA=Explorer 6 (first photo from orbit) · S36=Leakey (v1.12) · SPS=Osprey (first raptor)
 * Couplings: boids-predator-agent (avoidance 120 px), audio-event (hunting cry on dive), circadian-dawn-trigger
 * Emergent contribution: single persistent aerial predator publishing position + dive events;
 *   four-state scan-hover-dive-climb loop over fake fish anchors in the lower canvas band,
 *   dawn phase compresses inter-dive interval. First raptor in the 61-degree corpus.
 */
(function() {
  var PATROL_Y_NORM = 0.22;   // canopy-top altitude
  var PATROL_CX_NORM = 0.50;
  var PATROL_R_NORM = 0.18;
  var HOVER_FRAMES = 30;
  var DIVE_VY = 5.4;           // pixels/frame descent
  var CLIMB_VY = 2.2;
  var COOLDOWN_DEFAULT = 900;  // ~15 s @ 60fps
  var COOLDOWN_DAWN = 480;     // ~8 s
  var DAWN_WINDOW_FRAMES = 1800; // 30 s of accelerated hunting after dawn

  nasaState.v1_12 = {
    ospreyX: 0,
    ospreyY: 0,
    state: 'PATROL',
    diveCount: 0,
    lastDiveFrame: -9999,
    _angle: 0,
    _hoverFrame: -9999,
    _targetX: 0,
    _targetY: 0,
    _fishAnchors: [],
    _prevSunAlt: -90,
    _dawnBoostUntil: -9999
  };

  nasaHooks.push({
    degree: '1.12',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var s = nasaState.v1_12;
      // Six fake fish anchors along the lower stream/shore band.
      for (var i = 0; i < 6; i++) {
        s._fishAnchors.push({
          x: W * (0.12 + (i / 5) * 0.76),
          y: H * (0.82 + Math.random() * 0.08)
        });
      }
      s.ospreyX = W * PATROL_CX_NORM;
      s.ospreyY = H * PATROL_Y_NORM;
    },
    tick: function(fn) {
      var s = nasaState.v1_12;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;

      // Dawn detection (cheap: reads sky.sunAlt already maintained by sim).
      if (fn % 60 === 0) {
        var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;
        if (s._prevSunAlt < 2 && alt >= 2) s._dawnBoostUntil = fn + DAWN_WINDOW_FRAMES;
        s._prevSunAlt = alt;
      }

      // State advance.
      if (s.state === 'PATROL') {
        s._angle += 0.008; // slow soaring circle
        s.ospreyX = W * (PATROL_CX_NORM + PATROL_R_NORM * Math.cos(s._angle));
        s.ospreyY = H * (PATROL_Y_NORM + PATROL_R_NORM * 0.4 * Math.sin(s._angle));
        // Dive trigger (once-per-second poll with cooldown).
        if (fn % 60 === 0) {
          var cd = (fn < s._dawnBoostUntil) ? COOLDOWN_DAWN : COOLDOWN_DEFAULT;
          if (fn - s.lastDiveFrame > cd) {
            s.state = 'HOVER';
            s._hoverFrame = fn;
            var anchor = s._fishAnchors[Math.floor(Math.random() * s._fishAnchors.length)];
            s._targetX = anchor.x;
            s._targetY = anchor.y;
          }
        }
      } else if (s.state === 'HOVER') {
        s.ospreyX += (s._targetX - s.ospreyX) * 0.06;
        if (fn - s._hoverFrame > HOVER_FRAMES) {
          s.state = 'DIVE';
          s.lastDiveFrame = fn;
          s.diveCount += 1;
        }
      } else if (s.state === 'DIVE') {
        s.ospreyY += DIVE_VY;
        s.ospreyX += (s._targetX - s.ospreyX) * 0.15;
        if (s.ospreyY >= s._targetY) s.state = 'CLIMB';
      } else if (s.state === 'CLIMB') {
        s.ospreyY -= CLIMB_VY;
        if (s.ospreyY <= H * PATROL_Y_NORM) {
          s.ospreyY = H * PATROL_Y_NORM;
          s.state = 'PATROL';
        }
      }

      // Render: thin osprey silhouette (per-frame, cheap).
      if (typeof stroke !== 'function' || typeof line !== 'function') return;
      var wing = 10 + Math.sin(fn * 0.18) * 3;
      stroke(160, 140, 100, 200);
      strokeWeight(1.2);
      noFill && noFill();
      // Body
      line(s.ospreyX, s.ospreyY - 4, s.ospreyX, s.ospreyY + 4);
      // Wings (curved via two straight segments — cheap quadratic proxy)
      line(s.ospreyX - wing, s.ospreyY - 1, s.ospreyX, s.ospreyY - 2);
      line(s.ospreyX, s.ospreyY - 2, s.ospreyX + wing, s.ospreyY - 1);
      // Tail
      line(s.ospreyX - 2, s.ospreyY + 4, s.ospreyX + 2, s.ospreyY + 4);
    }
  });
})();

// --- DEGREE v1_13 ---
/* ==== DEGREE v1.13 — Black Oystercatcher Intertidal Pair ====
 * Source spec: ../NASA/1.13/forest-module/black-oystercatcher-intertidal.js
 * Triad: NASA=Explorer 7 (radiation budget boundary) · S36=(v1.13 pair) · SPS=Black Oystercatcher
 * Couplings: audio-sidechain (piercing call, conceptual), boids-attractor (pair + roost), kuramoto-phase-kick (tidal forcing)
 * Emergent contribution: introduces intertidal shoreline band and tide oscillator;
 *   publishes tidePhase, state, shorelineY for later degrees; two pair-bonded
 *   oystercatchers probe at low tide and roost at high tide, moon-altitude biased.
 */
(function() {
  var PAIR_ANCHORS = [ { nx: 0.28, ny: 0.78 }, { nx: 0.44, ny: 0.74 } ];
  var ROOST_ANCHOR = { nx: 0.36, ny: 0.82 };
  var TIDAL_PERIOD_FRAMES = 60 * 28;     // ~28 s @ 60fps — one full cycle
  var PROBE_PERIOD = 90;                 // frames between individual probes
  var CALL_MIN_GAP = 180;                // frames between piercing calls

  nasaState.v1_13 = {
    tidePhase: 0,
    state: 'HIGH_TIDE_ROOST',
    probes: 0,
    lastCallFrame: -9999,
    shorelineY: 0,
    _pair: [],
    _roost: { x: 0, y: 0 }
  };

  nasaHooks.push({
    degree: '1.13',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var s = nasaState.v1_13;
      s._pair = [];
      for (var i = 0; i < PAIR_ANCHORS.length; i++) {
        s._pair.push({ x: PAIR_ANCHORS[i].nx * W, y: PAIR_ANCHORS[i].ny * H, bob: 0 });
      }
      s._roost.x = ROOST_ANCHOR.nx * W;
      s._roost.y = ROOST_ANCHOR.ny * H;
      s.shorelineY = H * 0.82;
    },
    tick: function(fn) {
      var s = nasaState.v1_13;
      // Tide phase with gentle moon-altitude bias (astronomical forcing).
      var moonBias = (typeof sky === 'object' && sky && sky.moonAlt > 0) ? 0.12 : 0;
      var raw = ((fn / TIDAL_PERIOD_FRAMES) + moonBias) % 1;
      if (raw < 0) raw += 1;
      s.tidePhase = raw;

      // State transition with hysteresis-free half-cycle gate.
      var newState = (raw < 0.5) ? 'LOW_TIDE_ACTIVE' : 'HIGH_TIDE_ROOST';
      if (newState !== s.state) {
        s.state = newState;
        if (newState === 'LOW_TIDE_ACTIVE' && fn - s.lastCallFrame > CALL_MIN_GAP) {
          s.lastCallFrame = fn;   // piercing call event — downstream may react
        }
      }

      // Render gated per 30 frames (~2 Hz) to stay inside 2 ms budget.
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      // Waterline oscillates ±4 px around shorelineY by tide phase.
      var wl = s.shorelineY + Math.sin(raw * 2 * Math.PI) * 4;

      // Intertidal band: balance-blue below waterline, thermal-orange exposed rock above.
      noStroke();
      fill(48, 112, 176, 90);             // #3070B0 water
      rect(0, wl, W, H - wl);
      fill(208, 112, 48, 50);              // #D07030 exposed rock strip
      rect(0, s.shorelineY - 6, W, wl - (s.shorelineY - 6));

      // Draw the pair (LOW) or roost cluster (HIGH).
      if (s.state === 'LOW_TIDE_ACTIVE') {
        for (var i = 0; i < s._pair.length; i++) {
          var p = s._pair[i];
          // Probing peck: brief downward bob every PROBE_PERIOD frames, staggered by bird.
          var phase = (fn + i * 45) % PROBE_PERIOD;
          var peck = (phase < 10) ? 3 : 0;
          if (phase === 0) s.probes += 1;
          fill(26, 26, 26, 220);           // #1A1A1A jet-black plumage
          ellipse(p.x, p.y + peck, 8, 6);
          fill(208, 112, 48, 240);         // #D07030 bill
          ellipse(p.x + 4, p.y + peck, 3, 1.5);
        }
      } else {
        // HIGH_TIDE: both birds at roost anchor, close together.
        for (var j = 0; j < 2; j++) {
          fill(26, 26, 26, 220);
          ellipse(s._roost.x + (j - 0.5) * 10, s._roost.y, 7, 5);
        }
      }

      // Piercing-call flash: brief thermal-orange ring at lead bird for ~30 frames post-event.
      if (fn - s.lastCallFrame < 30 && s.state === 'LOW_TIDE_ACTIVE' && s._pair.length > 0) {
        var a = 1 - (fn - s.lastCallFrame) / 30;
        if (typeof noFill === 'function' && typeof stroke === 'function') {
          noFill();
          stroke(208, 112, 48, 200 * a);
          strokeWeight(1);
          ellipse(s._pair[0].x, s._pair[0].y, 14 + (1 - a) * 18, 14 + (1 - a) * 18);
        }
      }
    }
  });
})();

// --- DEGREE v1_14 ---
/* ==== DEGREE v1.14 — Monarch Butterfly Migration Wave ====
 * Source spec: ../NASA/1.14/forest-module/monarch-butterfly-migration.js
 * Triad: NASA=Pioneer 5 (IMF + solar wind) · S36=Sonett · SPS=Danaus plexippus
 * Couplings: boids (directional wave), circadian (dusk roost flag)
 * Emergent contribution: seasonal SSW diagonal butterfly flow; agents steer toward v1_6.bloomFront
 *   nectar sources and emit milkweed-visit events; publishes roosting flag at dusk for later degrees.
 */
(function() {
  var DRIFT_X = -0.35, DRIFT_Y = 0.55;   // SSW px/frame
  var MAX_AGENTS = 24;
  var SPAWN_INTERVAL = 90;               // frames between spawns while active

  nasaState.v1_14 = {
    agents: [],
    visits: 0,
    season: 'off',
    roosting: false,
    _spawnFrame: 0
  };

  nasaHooks.push({
    degree: '1.14',
    init: function() { nasaState.v1_14.agents.length = 0; },
    tick: function(fn) {
      var S = nasaState.v1_14;
      var seas = (typeof season === 'number') ? season : 0;
      S.season = seas > 0.75 ? 'fall' : (seas > 0.45 ? 'summer' : 'off');
      var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;
      S.roosting = alt < -2;

      // --- spawn (top/north edge) while in season, not roosting ---
      if (S.season !== 'off' && !S.roosting && S.agents.length < MAX_AGENTS &&
          fn - S._spawnFrame > SPAWN_INTERVAL) {
        S._spawnFrame = fn;
        var W = (typeof width === 'number') ? width : 960;
        S.agents.push({
          x: W * (0.55 + Math.random() * 0.45), // enter from NE quadrant
          y: -10,
          vx: DRIFT_X + (Math.random() - 0.5) * 0.10,
          vy: DRIFT_Y + (Math.random() - 0.5) * 0.08,
          age: 0
        });
      }

      // --- per-frame agent update + render ---
      var W2 = (typeof width === 'number') ? width : 960;
      var H2 = (typeof height === 'number') ? height : 540;
      var bloom = (nasaState.v1_6 && nasaState.v1_6.bloomFront) ? nasaState.v1_6.bloomFront : null;
      var renderable = (typeof fill === 'function' && typeof ellipse === 'function' && typeof noStroke === 'function');
      if (renderable) noStroke();

      for (var i = S.agents.length - 1; i >= 0; i--) {
        var a = S.agents[i];
        a.age++;

        // bloom attraction: bend toward nearest bloom record within 80 px
        if (bloom && bloom.length && (fn & 3) === 0) {
          var best = -1, bd = 6400; // 80^2
          for (var b = 0; b < bloom.length; b++) {
            var dx = bloom[b].x - a.x, dy = bloom[b].y - a.y;
            var d2 = dx * dx + dy * dy;
            if (d2 < bd) { bd = d2; best = b; }
          }
          if (best >= 0) {
            a.vx += (bloom[best].x - a.x) * 0.0012;
            a.vy += (bloom[best].y - a.y) * 0.0012;
            if (bd < 64) S.visits++; // within ~8 px = milkweed-visit event
          }
        }
        // damp toward nominal drift so agents don't spiral
        a.vx = a.vx * 0.94 + DRIFT_X * 0.06;
        a.vy = a.vy * 0.94 + DRIFT_Y * 0.06;
        a.x += a.vx; a.y += a.vy;

        // render: orange body + black wing-tip fleck
        if (renderable) {
          fill(212, 120, 10, 220);
          ellipse(a.x, a.y, 3, 3);
          fill(26, 26, 10, 180);
          ellipse(a.x - a.vx * 1.4, a.y - a.vy * 1.4, 1.4, 1.4);
        }

        // recycle when off-canvas (SW exit) or aged out
        if (a.x < -12 || a.y > H2 + 12 || a.age > 1800) S.agents.splice(i, 1);
      }

      // season end / dusk: drain cohort gradually
      if ((S.season === 'off' || S.roosting) && S.agents.length > 0 && fn % 120 === 0) {
        S.agents.pop();
      }
    }
  });
})();

// --- DEGREE v1_15 ---
/* ==== DEGREE v1.15 — TIROS-1 Osprey Migration Timing ====
 * Source spec: ../NASA/1.15/forest-module/tiros1-osprey-migration-timing.js
 * Triad: NASA=TIROS-1 (first weather satellite, synoptic orbit) · S36=Wexler (v1.15) · SPS=Osprey migration-timing lens
 * Couplings: circadian (phase-offset via presence factor), lsystem (canopy-hue at tallest plants), kuramoto (one-shot commitment per season)
 * Emergent contribution: publishes an annual migration-presence envelope driven by the season global;
 *   enhances v1.12 osprey predator behaviour (if present) with seasonal gating — osprey fade spring,
 *   peak summer, fade fall; commits to a nest site once per season with a phase-kick event.
 */
(function() {
  nasaState.v1_15 = {
    phase: 'ABSENT',
    presence: 0,
    committed: false,
    seasonYear: 0,
    _prevSeason: 0.5,
    _tallest: []  // indices into plants[] of the two tallest, refreshed rarely
  };

  nasaHooks.push({
    degree: '1.15',
    init: function() {
      nasaState.v1_15._prevSeason = (typeof season === 'number') ? season : 0.5;
    },
    tick: function(fn) {
      if (fn % 60 !== 0) return;
      var S = nasaState.v1_15;
      var sn = (typeof season === 'number') ? season : 0.5;

      // Detect annual wrap (season is a sin wave, crosses through winter twice per cycle;
      // we use rising-through-0.5 as the "new year" marker to reset commitment).
      if (S._prevSeason < 0.2 && sn >= 0.2) {
        S.seasonYear += 1;
        S.committed = false;
      }
      S._prevSeason = sn;

      // Map season (0..1) to phenological phase + presence envelope.
      //   sn < 0.15 : ABSENT (deep winter)
      //   0.15..0.35 : ARRIVING (spring ramp)
      //   0.35..0.55 : ASSESSING (nest-site decision window)
      //   0.55..0.85 : RESIDENT (breeding peak)
      //   > 0.85 : fall fade, heading to ABSENT
      if (sn < 0.15)       { S.phase = 'ABSENT';    S.presence = 0; }
      else if (sn < 0.35)  { S.phase = 'ARRIVING';  S.presence = (sn - 0.15) / 0.20 * 0.55; }
      else if (sn < 0.55)  { S.phase = 'ASSESSING'; S.presence = 0.55 + (sn - 0.35) / 0.20 * 0.25; }
      else if (sn < 0.85)  { S.phase = 'RESIDENT';  S.presence = 0.85 + Math.sin((sn - 0.55) / 0.30 * Math.PI) * 0.15; }
      else                 { S.phase = 'ARRIVING';  S.presence = Math.max(0, 0.7 - (sn - 0.85) / 0.15 * 0.7); }

      // Kuramoto-analog: one-shot commitment during ASSESSING.
      if (S.phase === 'ASSESSING' && !S.committed) {
        S.committed = true;
        // Defensive coupling to v1.12 predator state if that degree has been retro-wired.
        if (nasaState.v1_12 && typeof nasaState.v1_12 === 'object') {
          nasaState.v1_12.migrationPresence = S.presence;
          if (typeof nasaState.v1_12.nestCommitFrame !== 'undefined') {
            nasaState.v1_12.nestCommitFrame = fn;
          }
        }
      }
      // Continuously publish the presence factor to v1_12 (if it exists) so its hunting
      // probability can scale with the migration envelope.
      if (nasaState.v1_12 && typeof nasaState.v1_12 === 'object') {
        nasaState.v1_12.migrationPresence = S.presence;
      }

      // Lsystem-analog: refresh tallest-plant cache once per ~15 s, tint when presence > 0.3.
      if (fn % 900 === 0 && typeof plants !== 'undefined' && plants.length > 0) {
        var h1 = -1, h2 = -1, i1 = -1, i2 = -1;
        for (var i = 0; i < plants.length; i++) {
          var pl = plants[i];
          var h = (pl.baseLen || 0) * (pl.growth || 0);
          if (h > h1) { h2 = h1; i2 = i1; h1 = h; i1 = i; }
          else if (h > h2) { h2 = h; i2 = i; }
        }
        S._tallest = (i1 >= 0 && i2 >= 0) ? [i1, i2] : (i1 >= 0 ? [i1] : []);
      }
      if (S.presence > 0.3 && S._tallest.length > 0 &&
          typeof noFill === 'function' && typeof stroke === 'function') {
        noFill();
        stroke(216, 200, 168, 70 * S.presence); // osprey-cream canopy tint
        strokeWeight(0.5);
        for (var t = 0; t < S._tallest.length; t++) {
          var p = plants[S._tallest[t]];
          if (!p) continue;
          var topY = p.y - (p.baseLen || 30) * (p.growth || 0.5);
          ellipse(p.x, topY, 18, 8); // nest-platform halo
        }
      }
    }
  });
})();

// --- DEGREE v1_16 ---
/* ==== DEGREE v1.16 — Common Loon Yodel Phase-Sync ====
 * Source spec: ../NASA/1.16/forest-module/echo1-loon-yodel-sync.js
 * Triad: NASA=Echo 1 · S36=(Echo 1 balloon) · SPS=Gavia immer (Common Loon)
 * Couplings: kuramoto (phase-inject), audio (layer, silent here), circadian (event dawn/dusk)
 * Emergent contribution: three loon agents on a lake ring; phases entrain via Kuramoto coupling
 *   with gain scaled by dawn/dusk proximity — the acoustic analogue of Echo 1's passive reflection.
 */
(function() {
  nasaState.v1_16 = {
    phases: [0.0, 2.1, 4.2],          // three loons, initial phase spread
    naturalFreq: [0.018, 0.021, 0.016], // rad/sec (~35–40 s per loon cycle)
    K: 0.0,                            // coupling strength (0 outside dawn/dusk)
    injectionGain: 0.0,                // 0..1 envelope driven by sky.sunAlt
    lastYodel: -9999,
    yodelCount: 0,
    lakeRing: null,                    // [{x,y}] positions on a virtual lake
    getMeanPhase: function() {
      var s = 0, c = 0, p = nasaState.v1_16.phases, i;
      for (i = 0; i < p.length; i++) { s += Math.sin(p[i]); c += Math.cos(p[i]); }
      return Math.atan2(s / p.length, c / p.length);
    }
  };

  nasaHooks.push({
    degree: '1.16',
    init: function() {
      // Three loons arranged across a virtual lake — horizontal span, mid-water line.
      var cy = height * 0.62;
      nasaState.v1_16.lakeRing = [
        { x: width * 0.25, y: cy },
        { x: width * 0.50, y: cy + 6 },
        { x: width * 0.75, y: cy }
      ];
    },
    tick: function(fn) {
      if (fn % 60 !== 0) return;       // 1 Hz integration — budget-cheap
      var s = nasaState.v1_16;

      // Dawn/dusk proximity envelope from sky.sunAlt (matches v1_9b convention).
      var alt = (typeof sky !== 'undefined' && sky.sunAlt !== undefined) ? sky.sunAlt : 0;
      // Peak around horizon crossings: exp fall-off with |alt| in the −6..+6 band.
      var windowness = Math.exp(-Math.pow(alt / 4.0, 2));
      s.injectionGain = 0.1 + 0.9 * windowness;
      s.K = 0.35 * s.injectionGain;    // matches source-spec strength 0.35 at peak

      // Kuramoto update across the 3-ring (dt = 1s since tick is per-second).
      var p = s.phases, n = p.length, next = [0, 0, 0], i, j, coupling;
      for (i = 0; i < n; i++) {
        coupling = 0;
        for (j = 0; j < n; j++) {
          if (j !== i) coupling += Math.sin(p[j] - p[i]);
        }
        next[i] = p[i] + s.naturalFreq[i] + s.K * coupling;
        // Wrap to [0, 2π).
        while (next[i] >= Math.PI * 2) next[i] -= Math.PI * 2;
        while (next[i] < 0) next[i] += Math.PI * 2;
      }
      s.phases = next;

      // Yodel fires when loon 0 crosses phase ~0 during the dawn/dusk window.
      if (s.injectionGain > 0.6 && p[0] > Math.PI * 1.85 && next[0] < Math.PI * 0.15) {
        s.yodelCount++;
        s.lastYodel = fn;
      }
    }
  });
})();

// --- DEGREE v1_17 ---
/* ==== DEGREE v1.17 — Killdeer Broken-Wing Display ====
 * Source spec: ../NASA/1.17/forest-module/mr1-killdeer-broken-wing.js
 * Triad: NASA=Mercury-Redstone 1 (four-inch flight) · S36=(von Braun engineering-culture dedication) · SPS=Killdeer
 * Couplings: boids-param-tune (cohesion intent via event tag), audio-event (state transitions), circadian-event (midday bias)
 * Emergent contribution: ground-nesting killdeer agent with state-machine-gated distraction-event
 *   stream; scrape anchor + decoy-bird path mirror MR-1's fixed-sequence abort logic.
 */
(function() {
  var ALARM_FRAMES    = 480;  // 8 s @ 60fps
  var DISPLAY_FRAMES  = 1200; // 20 s
  var RECOVERY_FRAMES = 720;  // 12 s
  var EVENT_CAP       = 16;

  nasaState.v1_17 = {
    state: 'CALM',
    scrape: { x: 0, y: 0 },
    bird:   { x: 0, y: 0 },
    decoyAngle: 0,           // radians, set per DISPLAY entry
    enteredFrame: 0,
    lastDisplayFrame: -9999,
    events: []               // ring buffer: [{frame, type}]
  };

  function pushEvent(fn, type) {
    var ev = nasaState.v1_17.events;
    ev.push({ frame: fn, type: type });
    if (ev.length > EVENT_CAP) ev.splice(0, ev.length - EVENT_CAP);
  }

  function setState(fn, next) {
    if (nasaState.v1_17.state === next) return;
    nasaState.v1_17.state = next;
    nasaState.v1_17.enteredFrame = fn;
    pushEvent(fn, next);
  }

  nasaHooks.push({
    degree: '1.17',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      // Scrape in the soil band (below groundStart = H*0.65).
      var sx = W * (0.20 + Math.random() * 0.60);
      var sy = H * (0.72 + Math.random() * 0.18);
      nasaState.v1_17.scrape.x = sx; nasaState.v1_17.scrape.y = sy;
      nasaState.v1_17.bird.x   = sx; nasaState.v1_17.bird.y   = sy;
    },
    tick: function(fn) {
      var S = nasaState.v1_17;
      var age = fn - S.enteredFrame;

      // --- per-second CALM trigger poll (midday-biased, gust-startled) ---
      if (S.state === 'CALM' && fn % 60 === 0 && (fn - S.lastDisplayFrame) > 1800) {
        var alt = (typeof sky === 'object' && sky && typeof sky.sunAlt === 'number') ? sky.sunAlt : 0;
        // Midday proximity: peak at solar zenith (~max alt), falls off above/below.
        var mid = Math.max(0, alt / 60);       // 0..1 rough midday kernel
        var gust = (typeof wx === 'object' && wx && wx.windGust) ? wx.windGust : 0;
        var pTrigger = 0.015 * mid + (gust > 35 ? 0.05 : 0);
        if (Math.random() < pTrigger) {
          setState(fn, 'ALARM');
          S.lastDisplayFrame = fn;
        }
      }

      // --- state-machine advance (fixed timers, no setTimeout) ---
      if (S.state === 'ALARM' && age >= ALARM_FRAMES) {
        setState(fn, 'DISPLAY');
        S.decoyAngle = Math.random() * Math.PI * 2;
      } else if (S.state === 'DISPLAY' && age >= DISPLAY_FRAMES) {
        setState(fn, 'RECOVERY');
      } else if (S.state === 'RECOVERY' && age >= RECOVERY_FRAMES) {
        setState(fn, 'CALM');
        S.bird.x = S.scrape.x; S.bird.y = S.scrape.y;
      }

      // --- decoy-path update (DISPLAY: run away; RECOVERY: return) ---
      if (S.state === 'DISPLAY') {
        var prog = Math.min(1, age / DISPLAY_FRAMES);
        var reach = 90 * prog;
        S.bird.x = S.scrape.x + Math.cos(S.decoyAngle) * reach;
        S.bird.y = S.scrape.y + Math.sin(S.decoyAngle) * reach * 0.35; // flatten along ground
      } else if (S.state === 'RECOVERY') {
        var back = 1 - Math.min(1, age / RECOVERY_FRAMES);
        var reachR = 90 * back;
        S.bird.x = S.scrape.x + Math.cos(S.decoyAngle) * reachR;
        S.bird.y = S.scrape.y + Math.sin(S.decoyAngle) * reachR * 0.35;
      }

      // --- render (every 10 frames, only when active) ---
      if (fn % 10 !== 0 || S.state === 'CALM') return;
      if (typeof noFill !== 'function' || typeof stroke !== 'function' || typeof fill !== 'function') return;
      // Scrape mark: small tan crescent on the ground.
      noStroke(); fill(100, 84, 56, 180);
      ellipse(S.scrape.x, S.scrape.y, 5, 2.2);
      // Decoy bird: killdeer-tan glyph, wing-drag shimmer during DISPLAY.
      fill(200, 168, 120, S.state === 'DISPLAY' ? 230 : 180);
      ellipse(S.bird.x, S.bird.y, 4.5, 3);
      if (S.state === 'DISPLAY') {
        stroke(200, 168, 120, 140);
        strokeWeight(0.8);
        var wob = Math.sin(fn * 0.5) * 3;
        line(S.bird.x, S.bird.y, S.bird.x - 5 + wob, S.bird.y + 1.2); // dragged wing
      }
    }
  });
})();

// --- DEGREE v1_18 ---
/* ==== DEGREE v1.18 — Bull Kelp Pneumatocyst Buoyancy Field (aquatic-flex) ====
 * Source spec: ../NASA/1.18/forest-module/ma5-bull-kelp-pneumatocyst.js
 * Triad: NASA=Mercury-Atlas 5 · S36=degree-18 artist · SPS=Bull Kelp (Nereocystis luetkeana)
 * Couplings: lsystem (branching-angle), physarum (scalarField buoyancy), circadian (phase)
 * Emergent contribution: Offshore kelp forest band with wind-proxied current sway and
 *   diel-brightened pneumatocyst bulbs; publishes coverage field for later degrees.
 */
(function() {
  nasaState.v1_18 = {
    stipes: [],
    coverage: 0,
    bandTop: 0,
    bandBottom: 0,
    inited: false
  };

  nasaHooks.push({
    degree: '1.18',
    init: function() {
      var st = nasaState.v1_18;
      st.bandBottom = height;
      st.bandTop = height - Math.floor(height * 0.18);
      // Offshore of v1_13 shoreline zone if present; else full bottom band.
      var xStart = 0, xEnd = width;
      if (nasaState.v1_13 && typeof nasaState.v1_13.shorelineX === 'number') {
        xStart = nasaState.v1_13.shorelineX;
      }
      var spacing = 14; // px between stipes
      var count = Math.max(0, Math.floor((xEnd - xStart) / spacing));
      for (var i = 0; i < count; i++) {
        var baseX = xStart + i * spacing + (i * 37 % 7) - 3;
        var topY = st.bandTop + ((i * 53) % 22); // varied stipe heights
        st.stipes.push({
          x: baseX,
          topY: topY,
          phase: (i * 0.31) % (Math.PI * 2),
          bulbR: 3 + (i % 3)
        });
      }
      st.coverage = count > 0 ? 1 : 0;
      st.inited = true;
    },
    tick: function(fn) {
      var st = nasaState.v1_18;
      if (!st.inited || st.stipes.length === 0) return;
      // Current proxy: windSpeed mapped to sway amplitude (px).
      var sway = (typeof wx !== 'undefined' && wx.windSpeed) ? (wx.windSpeed / 6) : 0.5;
      // Diel brightness (circadian via sky, if present): noon brighter bulbs.
      var diel = 0.6;
      if (typeof sky !== 'undefined' && typeof sky.sunAltitude === 'number') {
        diel = 0.35 + 0.55 * Math.max(0, Math.sin(sky.sunAltitude));
      }
      var t = fn * 0.035;
      for (var i = 0; i < st.stipes.length; i++) {
        var s = st.stipes[i];
        var dx = Math.sin(t + s.phase) * sway;
        // Stipe: olive-amber vertical line, base anchored, top sways.
        stroke(70, 95, 55, 170);
        strokeWeight(1.4);
        line(s.x, st.bandBottom, s.x + dx, s.topY);
        // Pneumatocyst bulb: brighter at solar noon.
        noStroke();
        fill(180 + diel * 50, 160 + diel * 40, 70, 200);
        ellipse(s.x + dx, s.topY, s.bulbR * 2, s.bulbR * 1.6);
      }
    }
  });
})();

// --- DEGREE v1_19 ---
/* ==== DEGREE v1.19 — Chinook Salmon Marine Nitrogen Pulse ====
 * Source spec: ../NASA/1.19/forest-module/freedom7-chinook-salmon-nutrient-pulse.js
 * Triad: NASA=Freedom 7 (Mercury-Redstone 3, Shepard) · S36=(v1.19 pair) · SPS=Chinook Salmon
 * Couplings: physarum (radial N field), lsystem (riparian leaf-density), circadian (fall-pulse event)
 * Emergent contribution: periodic salmon-run events deposit marine-origin N-boost zones along
 *   the bottom-canvas stream corridor; riparian plants (y > 0.7H) get ~20% growth nudge inside
 *   active zones. Composes with v1_4 alder N (Helfield & Naiman 2001 compound fertilisation).
 */
(function() {
  var RUN_PERIOD   = 2700;   // frames between runs (~45s @ 60fps = annual proxy)
  var RUN_DURATION = 900;    // frames active per run (~15s = spawning window)
  var ZONE_PERIOD  = 90;     // frames between zone spawns during active run
  var ZONE_LIFE    = 1200;   // frames per zone (~20s nitrogen uptake)
  var STREAM_Y_MIN = 0.85;   // stream corridor upper bound (normalised)
  var RIPARIAN_Y   = 0.70;   // riparian influence reaches up to here

  nasaState.v1_19 = {
    runs: [],
    nzones: [],       // { x, y, birth, radius, intensity0, intensity }
    runCount: 0,
    active: false,
    _lastRun: -9999,
    _lastZone: -9999,
    getNBoost: function(x, y) {
      var Z = nasaState.v1_19.nzones, s = 0, i, z, dx, dy, r;
      for (i = 0; i < Z.length; i++) {
        z = Z[i]; r = z.radius;
        dx = x - z.x; dy = y - z.y;
        s += z.intensity * Math.exp(-(dx*dx + dy*dy) / (r*r));
      }
      return s > 0.75 ? 0.75 : s;
    }
  };

  nasaHooks.push({
    degree: '1.19',
    init: function() {
      nasaState.v1_19._lastRun = -RUN_PERIOD; // fire once shortly after boot
    },
    tick: function(fn) {
      var S = nasaState.v1_19, Z = S.nzones, i;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;

      // Age and decay live zones (per-frame float mutation, no alloc).
      for (i = Z.length - 1; i >= 0; i--) {
        var age = fn - Z[i].birth;
        if (age > ZONE_LIFE) { Z.splice(i, 1); continue; }
        Z[i].intensity = Z[i].intensity0 * (1 - age / ZONE_LIFE);
      }

      // Run gating: start a new run on period, end after duration.
      var sinceRun = fn - S._lastRun;
      if (!S.active && sinceRun >= RUN_PERIOD) {
        S.active = true;
        S._lastRun = fn;
        S.runCount += 1;
        S.runs.push({ t0: fn, duration: RUN_DURATION });
      } else if (S.active && sinceRun >= RUN_DURATION) {
        S.active = false;
      }

      // During active run: spawn a zone every ZONE_PERIOD frames.
      if (S.active && fn - S._lastZone >= ZONE_PERIOD) {
        S._lastZone = fn;
        var zx = (0.08 + Math.random() * 0.84) * W;
        var zy = (STREAM_Y_MIN + Math.random() * (1 - STREAM_Y_MIN)) * H;
        var rad = 0.2 * W;
        var inten = 0.45 + Math.random() * 0.20;
        // v1_4 alder coupling: amplify 20% at alder-proximate sites.
        if (nasaState.v1_4 && typeof nasaState.v1_4.getBoost === 'function') {
          if (nasaState.v1_4.getBoost(zx, zy - 40) > 0.1) inten *= 1.2;
        }
        Z.push({ x: zx, y: zy, birth: fn, radius: rad, intensity0: inten, intensity: inten });
      }

      // Riparian growth nudge: once per second, plants above RIPARIAN_Y that sit inside an active zone.
      if (fn % 60 !== 0 || !Z.length || typeof plants !== 'object' || !plants) return;
      var ripMin = RIPARIAN_Y * H;
      for (i = 0; i < plants.length; i++) {
        var pl = plants[i];
        if (!pl || pl.y < ripMin || pl.type === 3) continue; // skip alders (v1_4 handles those)
        if (pl.growth >= pl.maxGrowth) continue;
        var b = S.getNBoost(pl.x, pl.y);
        if (b > 0.05) pl.growth = Math.min(pl.maxGrowth, pl.growth + b * 0.0007);
      }

      // Per-15-frame render: river-green annulus at each zone while intensity > 0.1.
      if (fn % 15 !== 0 || !Z.length) return;
      if (typeof noFill !== 'function' || typeof stroke !== 'function') return;
      noFill();
      for (i = 0; i < Z.length; i++) {
        var zz = Z[i];
        if (zz.intensity < 0.1) continue;
        var a = zz.intensity * 200;
        stroke(58, 128, 88, a);
        strokeWeight(0.7);
        ellipse(zz.x, zz.y, zz.radius * 0.6, zz.radius * 0.28);
      }
    }
  });
})();

// --- DEGREE v1_20 ---
/* ==== DEGREE v1.20 — Harbor Seal Haul-Out + Splashdown-Anomaly Dispersal ====
 * Source spec: ../NASA/1.20/forest-module/NOT_APPLICABLE.md (retro-wire contribution)
 * Triad: NASA=Mercury-Redstone 4 / Liberty Bell 7 (Grissom) · S36=(v1.20 pair) · SPS=Harbor Seal
 * Couplings: boids (haul-out attractor + scare-dispersal), circadian (tidal gating via v1_13), audio-sidechain (hatch-blow transient)
 * Emergent contribution: six seals haul out on shoreline rock at low tide, drift seaward at
 *   high tide; a periodic fake "hatch-blow" anomaly scatters them in a scare-dispersal pulse
 *   — unscheduled eviction parallels Grissom's ejection after the Liberty Bell 7 hatch fired.
 *   Publishes simple primitives (seals, haulOutX/Y, lastAnomalyFrame) for later retro-wires.
 */
(function() {
  var SEAL_COUNT        = 6;
  var ANOMALY_PERIOD    = 2100;  // frames between splashdown anomalies (~35s @ 60fps)
  var ANOMALY_MEMORY    = 240;   // frames the scare is visible / seals stay agitated (~4s)
  var SCARE_RADIUS_N    = 0.18;  // normalised W — impulse falloff
  var SCARE_IMPULSE     = 2.6;   // peak px/frame radial velocity kick
  var HAUL_ANCHOR_X_N   = 0.62;  // Mukilteo-like rock on the shoreline
  var RETURN_GAIN       = 0.015; // spring constant pulling seals back to anchor
  var VEL_DAMP          = 0.90;  // per-frame velocity damping

  nasaState.v1_20 = {
    seals: [],
    haulOutX: 0,
    haulOutY: 0,
    lastAnomalyFrame: -9999,
    dispersals: 0,
    state: 'HAULED',
    _lastAnomaly: -ANOMALY_PERIOD
  };

  nasaHooks.push({
    degree: '1.20',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var s = nasaState.v1_20;
      var shoreY = (nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
        ? nasaState.v1_13.shorelineY : (0.82 * H);
      s.haulOutX = HAUL_ANCHOR_X_N * W;
      s.haulOutY = shoreY - 8;
      s.seals = [];
      for (var i = 0; i < SEAL_COUNT; i++) {
        s.seals.push({
          x: s.haulOutX + (i - (SEAL_COUNT - 1) / 2) * 9,
          y: s.haulOutY + ((i & 1) ? 1.5 : -1.5),
          vx: 0, vy: 0, state: 'HAULED'
        });
      }
    },
    tick: function(fn) {
      var s = nasaState.v1_20;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;

      // Tide gate: prefer v1.13's published phase; fall back to internal 32s period.
      var tide = (nasaState.v1_13 && typeof nasaState.v1_13.tidePhase === 'number')
        ? nasaState.v1_13.tidePhase : ((fn / (60 * 32)) % 1);
      var lowTide = (tide < 0.5);

      // Anomaly fire: once per ANOMALY_PERIOD, only at low tide (seals must be present).
      if (lowTide && fn - s._lastAnomaly >= ANOMALY_PERIOD) {
        s._lastAnomaly = fn;
        s.lastAnomalyFrame = fn;
        s.dispersals += 1;
        s.state = 'SCATTERED';
        var scareR = SCARE_RADIUS_N * W;
        for (var j = 0; j < s.seals.length; j++) {
          var sj = s.seals[j];
          var dx = sj.x - s.haulOutX;
          var dy = sj.y - s.haulOutY;
          var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          if (d < scareR) {
            var k = SCARE_IMPULSE * (1 - d / scareR);
            sj.vx += (dx / d) * k;
            sj.vy += (dy / d) * k * 0.4;  // flatter — seals slide along shoreline
            sj.state = 'SCATTERED';
          }
        }
      }

      // Per-frame integration: anchor pull (low tide) OR seaward drift (high tide).
      for (var i = 0; i < s.seals.length; i++) {
        var sl = s.seals[i];
        if (lowTide) {
          sl.vx += (s.haulOutX - sl.x) * RETURN_GAIN;
          sl.vy += (s.haulOutY - sl.y) * RETURN_GAIN;
        } else {
          sl.vx += 0.04;          // gentle seaward drift (to the right, off-canvas)
          sl.state = 'AT_SEA';
        }
        sl.vx *= VEL_DAMP;
        sl.vy *= VEL_DAMP;
        sl.x += sl.vx;
        sl.y += sl.vy;
      }

      // State recovery: SCATTERED clears once anomaly memory fades.
      if (s.state === 'SCATTERED' && fn - s.lastAnomalyFrame > ANOMALY_MEMORY) {
        s.state = lowTide ? 'HAULED' : 'AT_SEA';
      } else if (s.state !== 'SCATTERED') {
        s.state = lowTide ? 'HAULED' : 'AT_SEA';
      }

      // Render gated per 30 frames.
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Seal bodies: seal-gray ellipses. Hidden off-canvas during AT_SEA drift.
      noStroke();
      for (var r = 0; r < s.seals.length; r++) {
        var sr = s.seals[r];
        if (sr.x < -10 || sr.x > W + 10) continue;
        fill(112, 144, 160, 220);  // #7090A0 seal-gray
        ellipse(sr.x, sr.y, 11, 5);
      }

      // Hatch-blow flash ring at anchor for ~60 frames after the anomaly fires.
      var since = fn - s.lastAnomalyFrame;
      if (since >= 0 && since < 60 && typeof noFill === 'function' && typeof stroke === 'function') {
        var a = 1 - since / 60;
        noFill();
        stroke(204, 64, 32, 220 * a);  // #CC4020 hatch-red
        strokeWeight(1.2);
        ellipse(s.haulOutX, s.haulOutY, 18 + (1 - a) * 40, 10 + (1 - a) * 22);
      }
    }
  });
})();

// --- DEGREE v1_21 ---
/* ==== DEGREE v1.21 — Ranger 1 Pacific Salmon Spawn-Run Phase Synchronisation ====
 * Source spec: ../NASA/1.21/forest-module/ranger1-pacific-salmon-spawn-sync.js
 * Triad: NASA=Ranger 1 · S36=(Season-36 artist for 1.21) · SPS=Pacific Salmon (Rhinoceros Auklet audio)
 * Couplings: kuramoto (phase-reference), lsystem (branching-angle 45°), audio (layer)
 * Emergent contribution: Kuramoto phase-reference oscillator at v1_19 run cadence, modulated by
 *   lunar altitude; publishes getFrequencyMod() so downstream run-trigger cadence can entrain.
 *   Coherence tracks phase-alignment to v1_19's actual run events.
 */
(function() {
  var RUN_PERIOD_F = 2700;           // matches v1_19 fundamental (~45s @ 60fps)
  var TWO_PI       = Math.PI * 2;
  var OMEGA        = TWO_PI / RUN_PERIOD_F;  // natural frequency per frame

  nasaState.v1_21 = {
    phase: 0,
    coherence: 0,
    runWindow: false,
    lunarGain: 0,
    _lastCoherenceCheck: -9999,
    _lastObservedRun: -1,
    getFrequencyMod: function() {
      var s = nasaState.v1_21;
      // Lunar-boosted amplitude modulates run-trigger frequency 0.7..1.4
      return 1.0 + (s.lunarGain * 0.4) - ((1 - s.lunarGain) * 0.3);
    }
  };

  nasaHooks.push({
    degree: '1.21',
    init: function() {
      // Align internal phase with v1_19's boot offset if present.
      if (nasaState.v1_19 && typeof nasaState.v1_19._lastRun === 'number') {
        nasaState.v1_21.phase = 0;
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_21;

      // Lunar cue: sky.moonAlt in degrees, [-90..90]. Map to [0..1] above horizon only.
      var mAlt = (typeof sky === 'object' && sky && typeof sky.moonAlt === 'number')
        ? sky.moonAlt : 0;
      S.lunarGain = mAlt > 0 ? (mAlt / 90) : 0;
      if (S.lunarGain > 1) S.lunarGain = 1;

      // Advance phase at natural frequency; lunar gain slightly accelerates.
      S.phase += OMEGA * (1 + S.lunarGain * 0.15);
      if (S.phase >= TWO_PI) S.phase -= TWO_PI;

      // Run window = mid-cycle arc where sin(phase) > 0.5 (~30% duty — upstream-migration proxy).
      S.runWindow = Math.sin(S.phase) > 0.5;

      // Every 90 frames, snapshot coherence vs v1_19's observed run cadence.
      if (fn - S._lastCoherenceCheck < 90) return;
      S._lastCoherenceCheck = fn;
      if (!nasaState.v1_19 || typeof nasaState.v1_19._lastRun !== 'number') return;
      var lr = nasaState.v1_19._lastRun;
      if (lr === S._lastObservedRun) return;
      S._lastObservedRun = lr;

      // Phase of v1_19's last run within our cycle; coherence = cos(Δphase).
      var observedPhase = ((fn - lr) % RUN_PERIOD_F) / RUN_PERIOD_F * TWO_PI;
      var delta = S.phase - observedPhase;
      S.coherence = (Math.cos(delta) + 1) * 0.5;
    }
  });
})();

// --- DEGREE v1_22 ---
/* ==== DEGREE v1.22 — Cliff Swallow Colony Boids ====
 * Source spec: ../NASA/1.22/forest-module/cliff-swallow-colony-boids.js
 * Triad: NASA=Ranger 2 (fluxgate magnetometer, Agena timing failure) · S36=(v1.22 pair) · SPS=Petrochelidon pyrrhonota
 * Couplings: boids (colonial cohort, tight separation), audio (colony chatter — state field only)
 * Emergent contribution: 28-agent colonial aerial forager with Reynolds cohesion/alignment/separation
 *   around a left-cliff nest anchor; state-machine flips foraging↔returning on sky.sunAlt; opportunistic
 *   prey scan against v1_14 monarch agents increments a catch counter.
 */
(function() {
  var AGENT_COUNT = 28;
  var NEIGHBOR_R2 = 900;   // 30^2 — perception radius squared
  var SEPARATE_R2 = 144;   // 12^2 — tight colonial separation
  var MAX_SPD = 2.4;
  var NEST_NX = 0.12, NEST_NY = 0.35;

  nasaState.v1_22 = {
    agents: [],
    state: 'foraging',
    nestX: 0, nestY: 0,
    prey: 0,
    _inited: false
  };

  nasaHooks.push({
    degree: '1.22',
    init: function() {
      var S = nasaState.v1_22;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      S.nestX = W * NEST_NX;
      S.nestY = H * NEST_NY;
      for (var i = 0; i < AGENT_COUNT; i++) {
        S.agents.push({
          x: S.nestX + (Math.random() - 0.5) * 60,
          y: S.nestY + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6
        });
      }
      S._inited = true;
    },
    tick: function(fn) {
      var S = nasaState.v1_22;
      if (!S._inited || !S.agents.length) return;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var alt = (typeof sky === 'object' && sky && typeof sky.sunAlt === 'number') ? sky.sunAlt : 10;
      S.state = alt < -1 ? 'returning' : 'foraging';
      var anchorW = S.state === 'returning' ? 0.0040 : 0.0008;
      var A = S.agents, N = A.length;

      var render = (typeof fill === 'function' && typeof ellipse === 'function' && typeof noStroke === 'function');
      if (render) noStroke();

      // Prey scan vs v1_14 monarchs (once per 6 frames, defensive).
      var prey = (nasaState.v1_14 && nasaState.v1_14.agents) ? nasaState.v1_14.agents : null;
      var scanPrey = prey && prey.length && (fn % 6 === 0);

      // Strided neighbour scan: start offset rotates per frame to amortise O(n^2).
      var start = fn & 3;
      for (var i = 0; i < N; i++) {
        var a = A[i];
        var cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, cn = 0, sn = 0;
        for (var j = start; j < N; j += 4) {
          if (j === i) continue;
          var b = A[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx*dx + dy*dy;
          if (d2 < NEIGHBOR_R2) { cx += b.x; cy += b.y; ax += b.vx; ay += b.vy; cn++; }
          if (d2 < SEPARATE_R2 && d2 > 0.01) { sx -= dx / d2; sy -= dy / d2; sn++; }
        }
        if (cn > 0) { cx = cx/cn - a.x; cy = cy/cn - a.y; ax = ax/cn - a.vx; ay = ay/cn - a.vy; }
        // Reynolds weights: cohesion 0.0006, alignment 0.04, separation 0.9, anchor state-weighted.
        a.vx += cx * 0.0006 + ax * 0.04 + sx * 0.9 + (S.nestX - a.x) * anchorW;
        a.vy += cy * 0.0006 + ay * 0.04 + sy * 0.9 + (S.nestY - a.y) * anchorW;
        // Limit speed.
        var sp2 = a.vx*a.vx + a.vy*a.vy;
        if (sp2 > MAX_SPD * MAX_SPD) { var s = MAX_SPD / Math.sqrt(sp2); a.vx *= s; a.vy *= s; }
        a.x += a.vx; a.y += a.vy;
        // Soft canvas clamp.
        if (a.x < 4) { a.x = 4; a.vx = Math.abs(a.vx); }
        else if (a.x > W - 4) { a.x = W - 4; a.vx = -Math.abs(a.vx); }
        if (a.y < 4) { a.y = 4; a.vy = Math.abs(a.vy); }
        else if (a.y > H - 4) { a.y = H - 4; a.vy = -Math.abs(a.vy); }

        // Prey intercept: monarchs within 6 px get consumed.
        if (scanPrey) {
          for (var k = prey.length - 1; k >= 0; k--) {
            var p = prey[k], pdx = p.x - a.x, pdy = p.y - a.y;
            if (pdx*pdx + pdy*pdy < 36) { prey.splice(k, 1); S.prey++; break; }
          }
        }

        // Render: swallow-rust body + dark chestnut trailing accent.
        if (render) {
          fill(176, 72, 48, 220);
          ellipse(a.x, a.y, 3, 2.4);
          fill(26, 18, 16, 180);
          ellipse(a.x - a.vx * 1.3, a.y - a.vy * 1.3, 1.2, 1.2);
        }
      }
    }
  });
})();

// --- DEGREE v1_23 ---
/* ==== DEGREE v1.23 — Enos Capsule Circadian Perturbation ====
 * Source spec: ../NASA/1.23/forest-module/enos-capsule-circadian.js
 * Triad: NASA=Mercury-Atlas 5 (Enos) · S36=(v1.23 pair) · SPS=Chimpanzee (Pan troglodytes)
 * Couplings: circadian (phase-offset publisher; parallels Enos's 2-orbit capsule-clock drift)
 * Emergent contribution: publishes a circadian-perturbation metric (native vs. perturbed phase,
 *   accumulated phase-shift in hours) that later mammal-agent degrees can read via
 *   nasaState.v1_23.getActivityShift() to slide their active windows. MA-5 launched at
 *   14:07 UTC (phase 0.588); orbital transits pulse the perturbation every ~20 s sim-time.
 */
(function() {
  var LAUNCH_PHASE  = 0.588;   // 14:07 UTC / 24h
  var ORBIT_FRAMES  = 1200;    // ~20 s @ 60fps — one MA-5 orbit proxy (88.6 min compressed)
  var MAX_SHIFT_HR  = 3;       // clamp ±3 hours (Enos flew 2 orbits; 2 * ~100 min ≈ 3.3 h)
  var SHIFT_STEP_HR = 0.35;    // per-transit phase nudge, sign-alternating
  var EVENT_CAP     = 16;      // rolling ring-buffer cap

  nasaState.v1_23 = {
    nativePhase: LAUNCH_PHASE,
    perturbedPhase: LAUNCH_PHASE,
    phaseShift: 0,            // radians
    events: [],
    eventCount: 0,
    _lastEvent: -ORBIT_FRAMES,
    _sign: 1,
    getActivityShift: function() {
      var dp = nasaState.v1_23.perturbedPhase - nasaState.v1_23.nativePhase;
      // wrap to [-0.5, 0.5] so shortest-path diff maps cleanly to hours
      if (dp >  0.5) dp -= 1;
      if (dp < -0.5) dp += 1;
      return dp * 24;
    }
  };

  nasaHooks.push({
    degree: '1.23',
    init: function() {
      nasaState.v1_23._lastEvent = -ORBIT_FRAMES; // allow first transit shortly after boot
    },
    tick: function(fn) {
      var S = nasaState.v1_23;

      // Per-second native-phase update from sky.sunAlt. sunAlt in degrees, -90..90.
      // Map: noon (alt ~ max) → 0.25, midnight (alt ~ min) → 0.75. Half-cosine model is
      // smoother than a strict step. Defensive: sky may not be ready at frame 0.
      if (fn % 60 === 0) {
        var alt = (typeof sky !== 'undefined' && typeof sky.sunAlt === 'number') ? sky.sunAlt : 0;
        // sin-space phase: at solar noon, phase=0.25; at midnight phase=0.75.
        // Use alt sign to pick day-arc (phase 0..0.5) vs night-arc (0.5..1).
        var norm = Math.max(-1, Math.min(1, alt / 60));
        S.nativePhase = (alt >= 0)
          ? 0.25 - 0.25 * norm        // 0.0 at horizon-rise, 0.25 at zenith, 0.5 at horizon-set
          : 0.75 + 0.25 * norm;       // 0.5 at horizon-set, 0.75 at nadir, 1.0 → 0 at horizon-rise
      }

      // Per-orbit-proxy perturbation pulse. Each transit nudges perturbed phase by
      // SHIFT_STEP_HR/24, alternating sign so the drift oscillates instead of running away;
      // decays slowly back toward native between transits. Clamped to ±MAX_SHIFT_HR.
      if (fn - S._lastEvent >= ORBIT_FRAMES) {
        S._lastEvent = fn;
        var step = (SHIFT_STEP_HR / 24) * S._sign;
        S._sign = -S._sign;
        S.perturbedPhase = S.nativePhase + step + (S.getActivityShift() / 24);
        // Wrap to [0,1).
        S.perturbedPhase = ((S.perturbedPhase % 1) + 1) % 1;
        // Clamp |shift| ≤ MAX_SHIFT_HR.
        var cur = S.getActivityShift();
        if (cur >  MAX_SHIFT_HR) S.perturbedPhase = ((S.nativePhase + MAX_SHIFT_HR/24) % 1 + 1) % 1;
        if (cur < -MAX_SHIFT_HR) S.perturbedPhase = ((S.nativePhase - MAX_SHIFT_HR/24) % 1 + 1) % 1;
        S.phaseShift = (S.perturbedPhase - S.nativePhase) * Math.PI * 2;
        S.eventCount += 1;
        S.events.push({ t: fn, shiftHr: S.getActivityShift() });
        if (S.events.length > EVENT_CAP) S.events.shift();
      }
    }
  });
})();

// --- DEGREE v1_24 ---
/* ==== DEGREE v1.24 — Oregon Junco Winter Ground Flock ====
 * Source spec: ../NASA/1.24/forest-module/oregon-junco-winter-flock.js
 * Triad: NASA=Ranger 3 (1962) · S36=(v1.24 pair) · SPS=Oregon Dark-eyed Junco
 * Couplings: boids (loose ground cohort), circadian (winter photoperiod gate)
 * Emergent contribution: winter-only (season < 0.25) flock of 6-12 juncos ground-foraging
 *   in loose cohesion near forest edge; publishes positions for later consumers.
 */
(function() {
  var FLOCK_N      = 9;      // within 6-12 window
  var INTERACT_R   = 18;     // px, tight ground-level radius
  var ANCHOR_PULL  = 0.0018;
  var SEP_STRENGTH = 0.08;
  var DAMPING      = 0.86;
  var GROUND_Y     = 0.72;   // normalised: forest-edge ground band top
  var GROUND_SPAN  = 0.22;   // extends to 0.94

  nasaState.v1_24 = {
    agents: [],
    active: false,
    anchor: { x: 0, y: 0 },
    _phase: 0,
    getPositions: function() { return nasaState.v1_24.agents; }
  };

  nasaHooks.push({
    degree: '1.24',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      nasaState.v1_24.anchor.x = 0.22 * W;
      nasaState.v1_24.anchor.y = (GROUND_Y + GROUND_SPAN * 0.5) * H;
    },
    tick: function(fn) {
      var S = nasaState.v1_24;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;

      // Season/circadian gate — re-check once/second to stay cheap.
      if (fn % 60 === 0) {
        var seas = (typeof season === 'number') ? season : 0;
        var daylight = !(sky && sky.phase && (sky.phase === 'night' || sky.phase === 'dusk'));
        S.active = (seas < 0.25) && daylight;
        if (!S.active) { S.agents.length = 0; }
        else if (S.agents.length === 0) {
          for (var k = 0; k < FLOCK_N; k++) {
            S.agents.push({
              x: S.anchor.x + (Math.random() - 0.5) * 40,
              y: S.anchor.y + (Math.random() - 0.5) * 18,
              vx: 0, vy: 0
            });
          }
        }
      }
      if (!S.active || S.agents.length === 0) return;

      // Per-90-frame anchor reshuffle: slow drift along ground band, optional v1_0 nudge.
      if (fn % 90 === 0) {
        S._phase += 0.08;
        var ax = (0.18 + 0.18 * (Math.sin(S._phase) + 1) * 0.5) * W;
        var ay = (GROUND_Y + GROUND_SPAN * 0.5 + 0.04 * Math.cos(S._phase * 1.3)) * H;
        if (nasaState.v1_0 && nasaState.v1_0.pulses && nasaState.v1_0.pulses.length) {
          var p = nasaState.v1_0.pulses[0];
          if (p && p.y > GROUND_Y * H) { ax = 0.7 * ax + 0.3 * p.x; ay = 0.8 * ay + 0.2 * p.y; }
        }
        S.anchor.x = ax; S.anchor.y = ay;
      }

      // Per-frame integration: anchor pull + short-range separation, no cohesion target.
      var A = S.agents, i, j, a, b, dx, dy, d2, inv;
      for (i = 0; i < A.length; i++) {
        a = A[i];
        a.vx += (S.anchor.x - a.x) * ANCHOR_PULL;
        a.vy += (S.anchor.y - a.y) * ANCHOR_PULL;
        for (j = 0; j < A.length; j++) {
          if (j === i) continue;
          b = A[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx*dx + dy*dy;
          if (d2 > 0 && d2 < INTERACT_R * INTERACT_R) {
            inv = SEP_STRENGTH / Math.sqrt(d2);
            a.vx += dx * inv; a.vy += dy * inv;
          }
        }
        a.vx *= DAMPING; a.vy *= DAMPING;
        a.x += a.vx; a.y += a.vy;
      }

      // Render: white-belly dot + dark-hood half, every 2 frames.
      if (fn % 2 !== 0 || typeof fill !== 'function' || typeof noStroke !== 'function') return;
      noStroke();
      for (i = 0; i < A.length; i++) {
        fill(232, 228, 220); ellipse(A[i].x, A[i].y, 3.2, 2.4);
        fill(42, 32, 32);    ellipse(A[i].x, A[i].y - 0.9, 1.8, 1.3);
      }
    }
  });
})();

// --- DEGREE v1_25 ---
/* ==== DEGREE v1.25 — Tundra Swan Migration Wave (V-Formation) ====
 * Source spec: ../NASA/1.25/forest-module/tundra-swan-migration-wave.js
 * Triad: NASA=Mercury-Atlas 6 (Friendship 7, Glenn) · S36=Glenn · SPS=Cygnus columbianus
 * Couplings: boids (migration-wave, V-echelon), circadian (season gate via sin wave)
 * Emergent contribution: spring/fall discrete migration events — 12-20 agent V-formations
 *   traverse canvas on NNW (spring) or SSE (fall) vectors; rigid offset geometry per leader.
 */
(function() {
  var FALL_VX  =  0.55, FALL_VY  =  1.20; // SSE px/frame (autumn Skagit-bound)
  var SPRING_VX= -0.45, SPRING_VY= -1.10; // NNW px/frame (spring Arctic-bound)
  var SPAWN_INTERVAL_FRAMES = 1800; // ~30 s between flock events at 60 fps

  nasaState.v1_25 = {
    flock: [],
    season: 'off',
    events: 0,
    active: false,
    _lastSpawn: -9999
  };

  function buildFormation(lx, ly, vx, vy, count) {
    // Leader at index 0; followers echelon ±18° behind leader at fixed offsets.
    var flock = [{ x: lx, y: ly, role: 'lead', idx: 0 }];
    var half = (count - 1) >> 1;
    // perpendicular unit (rotate drift vector +90°) for wing spread
    var mag = Math.sqrt(vx*vx + vy*vy) || 1;
    var px = -vy / mag, py = vx / mag;
    for (var k = 1; k <= half; k++) {
      var back = k * 14, spread = k * 10;
      flock.push({ x: lx - vx/mag * back + px * spread, y: ly - vy/mag * back + py * spread, role: 'wingR', idx: k });
      flock.push({ x: lx - vx/mag * back - px * spread, y: ly - vy/mag * back - py * spread, role: 'wingL', idx: -k });
    }
    if (((count - 1) & 1) === 1) { // odd tail
      var kt = half + 1, backt = kt * 14;
      flock.push({ x: lx - vx/mag * backt, y: ly - vy/mag * backt, role: 'tail', idx: kt });
    }
    return flock;
  }

  nasaHooks.push({
    degree: '1.25',
    init: function() { nasaState.v1_25.flock.length = 0; nasaState.v1_25.events = 0; },
    tick: function(fn) {
      var S = nasaState.v1_25;
      var seas = (typeof season === 'number') ? season : 0;
      S.season = seas > 0.62 ? 'fall' : (seas < 0.38 ? 'spring' : 'off');
      var W = (typeof width  === 'number') ? width  : 960;
      var H = (typeof height === 'number') ? height : 540;

      // --- spawn gate: one flock per SPAWN_INTERVAL while in season ---
      if (S.season !== 'off' && S.flock.length === 0 && fn - S._lastSpawn > SPAWN_INTERVAL_FRAMES) {
        S._lastSpawn = fn;
        var count = 12 + (Math.floor(Math.random() * 9)); // 12..20
        if (S.season === 'fall') {
          S.flock = buildFormation(W * 0.15, -20, FALL_VX, FALL_VY, count);
        } else {
          S.flock = buildFormation(W * 0.85, H + 20, SPRING_VX, SPRING_VY, count);
        }
        S.active = true;
      }

      // --- per-frame: advance formation rigidly + render ---
      if (S.flock.length > 0) {
        var vx = (S.season === 'spring') ? SPRING_VX : FALL_VX;
        var vy = (S.season === 'spring') ? SPRING_VY : FALL_VY;
        var renderable = (typeof fill === 'function' && typeof ellipse === 'function' && typeof noStroke === 'function');
        if (renderable) noStroke();
        var offCanvas = 0;
        for (var i = 0; i < S.flock.length; i++) {
          var a = S.flock[i];
          a.x += vx; a.y += vy;
          if (renderable) {
            fill(216, 208, 192, 230);
            ellipse(a.x, a.y, 5, 5);
            fill(232, 224, 208, 180);
            ellipse(a.x - vx * 1.2, a.y - vy * 1.2, 2, 2); // wing highlight trail
          }
          if (a.x < -30 || a.x > W + 30 || a.y < -30 || a.y > H + 30) offCanvas++;
        }
        // flock fully off-canvas → complete the event
        if (offCanvas === S.flock.length) {
          S.flock.length = 0;
          S.events++;
          S.active = false;
        }
      }
    }
  });
})();

// --- DEGREE v1_26 ---
/* ==== DEGREE v1.26 — Pacific Tree Frog Chorus Synchronisation ====
 * Source spec: ../NASA/1.26/forest-module/pacific-tree-frog-chorus-kuramoto.js
 * Triad: NASA=Ranger 4 (lunar-farside silence) · S36=(silence dedication) · SPS=Pseudacris regilla
 * Couplings: kuramoto (phase-kick, swarm N=20..40), audio (layer, silent at this tier),
 *            circadian (state-gated CHORUS/SILENT), alarm-coupling to v1_17 killdeer events.
 * Emergent contribution: large-N mean-field Kuramoto chorus near a wetland point; dusk/spring
 *   gated; order-parameter rises with coupling, collapses on killdeer alarm. Crowd-scale
 *   analogue of the v1.16 3-loon ring.
 */
(function() {
  var N_MIN = 20, N_MAX = 40;
  var K_PEAK = 0.28, OMEGA_0 = 1.05 / 60;   // rad per 1-s tick (converted from ~1 Hz)
  var REFRACTORY = 1800;                    // 30 s @ 60fps post-alarm cooldown
  var ALARM_WINDOW = 240;                   // 4 s lookback on v1_17 events

  nasaState.v1_26 = {
    phases: [], naturalFreqs: [],
    N: 0, K: 0,
    origin: { x: 0, y: 0 },
    state: 'silent',
    orderParam: 0,
    lastAlarmFrame: -9999,
    getMeanPhase: function() {
      var p = nasaState.v1_26.phases, s = 0, c = 0, i;
      if (!p.length) return 0;
      for (i = 0; i < p.length; i++) { s += Math.sin(p[i]); c += Math.cos(p[i]); }
      return Math.atan2(s / p.length, c / p.length);
    }
  };

  function seedCallers() {
    var S = nasaState.v1_26;
    S.N = N_MIN + Math.floor(Math.random() * (N_MAX - N_MIN + 1));
    S.phases = []; S.naturalFreqs = [];
    for (var i = 0; i < S.N; i++) {
      S.phases.push(Math.random() * Math.PI * 2);
      // Detune ±12% around OMEGA_0 → rich pre-sync disorder.
      S.naturalFreqs.push(OMEGA_0 * (0.88 + Math.random() * 0.24));
    }
  }

  function alarmRecent(fn) {
    var v17 = nasaState.v1_17;
    if (!v17 || !v17.events || !v17.events.length) return false;
    var last = v17.events[v17.events.length - 1];
    return last && last.type === 'ALARM' && (fn - last.frame) <= ALARM_WINDOW;
  }

  nasaHooks.push({
    degree: '1.26',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      // Wetland anchor: lower-third, near stream zone (left-of-center bias).
      nasaState.v1_26.origin.x = W * (0.30 + Math.random() * 0.25);
      nasaState.v1_26.origin.y = H * (0.78 + Math.random() * 0.08);
    },
    tick: function(fn) {
      if (fn % 60 !== 0) return;              // 1 Hz integration
      var S = nasaState.v1_26;
      var alt = (typeof sky === 'object' && sky) ? (sky.sunAlt || 0) : 0;
      var seas = (typeof season === 'number') ? season : 0;
      var springDusk = (seas >= 0.20 && seas <= 0.40) && (alt < 5);

      // Alarm: collapse chorus, randomize phases, enter refractory.
      if ((fn % 30 === 0) && alarmRecent(fn) && S.state !== 'alarm') {
        S.state = 'alarm'; S.K = 0;
        for (var i = 0; i < S.phases.length; i++) S.phases[i] = Math.random() * Math.PI * 2;
        S.lastAlarmFrame = fn;
      }

      // Gate transitions.
      if (S.state === 'alarm' && (fn - S.lastAlarmFrame) > REFRACTORY) S.state = 'silent';
      if (!springDusk) { S.state = 'silent'; S.K = 0; S.orderParam = 0; return; }
      if (S.state === 'silent') { seedCallers(); S.state = 'building'; S.K = 0; }

      // Coupling ramp: building → chorus over ~20 s.
      if (S.state === 'building') {
        S.K = Math.min(K_PEAK, S.K + K_PEAK / 20);
        if (S.K >= K_PEAK * 0.95) S.state = 'chorus';
      }

      // Mean-field Kuramoto update (dt = 1s).
      var p = S.phases, n = p.length, sumS = 0, sumC = 0, j;
      for (j = 0; j < n; j++) { sumS += Math.sin(p[j]); sumC += Math.cos(p[j]); }
      var mx = sumC / n, my = sumS / n;
      S.orderParam = Math.sqrt(mx * mx + my * my);
      var meanPhase = Math.atan2(my, mx);
      for (j = 0; j < n; j++) {
        p[j] += S.naturalFreqs[j] + S.K * S.orderParam * Math.sin(meanPhase - p[j]);
        while (p[j] >= Math.PI * 2) p[j] -= Math.PI * 2;
        while (p[j] < 0) p[j] += Math.PI * 2;
      }
    }
  });
})();

// --- DEGREE v1_27 ---
/* ==== DEGREE v1.27 — Sooty Shearwater Trans-Pacific Migration Wave ====
 * Source spec: ../NASA/1.27/forest-module/sooty-shearwater-migration.js
 * Triad: NASA=Mercury-Atlas 7 / Aurora 7 (orbital closed-loop) · S36=Carpenter aquanaut · SPS=Ardenna grisea
 * Couplings: boids (pelagic migration wave), audio-layer (rendered visually as underpart flash on dip)
 * Emergent contribution: rare-but-dramatic offshore streaming sighting — 6-10 shearwaters traverse
 *   canvas end-to-end rapidly (~8-12s), staying BELOW v1.13 shorelineY, dipping briefly to water
 *   on surface-feed events with pale-underpart flash. Publishes passCount + dipEvents.
 */
(function() {
  var STREAM_MIN_GAP = 1800;   // ≥ 30 s between streams
  var STREAM_CHANCE = 0.004;   // per-frame chance once gap elapsed (~0.24/s → ~60-90 s mean)
  var STREAM_SIZE_MIN = 6, STREAM_SIZE_MAX = 10;
  var SPEED = 3.2;             // px/frame westbound — dramatic end-to-end
  var DIP_CHANCE = 0.015;      // per-agent per-frame
  var DIP_FRAMES = 20;

  nasaState.v1_27 = {
    agents: [],
    passCount: 0,
    dipEvents: 0,
    lastStreamFrame: -9999
  };

  nasaHooks.push({
    degree: '1.27',
    init: function() { nasaState.v1_27.agents.length = 0; },
    tick: function(fn) {
      var S = nasaState.v1_27;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var shoreY = (nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
                   ? nasaState.v1_13.shorelineY : H * 0.82;
      var oceanTop = shoreY + 8, oceanBot = H - 4;

      // --- rare stream spawn ---
      if (S.agents.length === 0 && fn - S.lastStreamFrame > STREAM_MIN_GAP &&
          Math.random() < STREAM_CHANCE) {
        S.lastStreamFrame = fn;
        var n = STREAM_SIZE_MIN + Math.floor(Math.random() * (STREAM_SIZE_MAX - STREAM_SIZE_MIN + 1));
        for (var i = 0; i < n; i++) {
          S.agents.push({
            x: W + 12 + i * 18,
            y: oceanTop + Math.random() * (oceanBot - oceanTop),
            vx: -(SPEED + (Math.random() - 0.5) * 0.4),
            dipPhase: Math.random() * Math.PI * 2,
            dipTimer: 0
          });
        }
      }

      // --- per-frame update + render ---
      var renderable = (typeof fill === 'function' && typeof ellipse === 'function' && typeof noStroke === 'function');
      if (renderable) noStroke();

      for (var j = S.agents.length - 1; j >= 0; j--) {
        var a = S.agents[j];
        a.x += a.vx;
        a.dipPhase += 0.16;
        // baseline soaring bob ±6 px
        var bobY = a.y + Math.sin(a.dipPhase) * 6;
        // surface-feed dip trigger
        if (a.dipTimer === 0 && Math.random() < DIP_CHANCE) {
          a.dipTimer = DIP_FRAMES;
          S.dipEvents++;
        }
        var drawY = bobY;
        var flashing = false;
        if (a.dipTimer > 0) {
          var t = 1 - a.dipTimer / DIP_FRAMES;    // 0 → 1 across dip
          var arc = Math.sin(t * Math.PI);         // dip then return
          drawY = bobY + arc * (shoreY + 2 - bobY);
          flashing = t > 0.3 && t < 0.7;
          a.dipTimer--;
        }

        if (renderable) {
          fill(58, 48, 32, 220);                   // #3A3020 sooty brown
          ellipse(a.x, drawY, 4, 2);
          if (flashing) {
            fill(200, 192, 168, 220);              // #C8C0A8 pale-underpart flash
            ellipse(a.x, drawY + 0.6, 2.4, 1.2);
          }
        }

        if (a.x < -14) {
          S.passCount++;
          S.agents.splice(j, 1);
        }
      }
    }
  });
})();

// --- DEGREE v1_28 ---
/* ==== DEGREE v1.28 — Monarch Milkweed L-System ====
 * Source spec: ../NASA/1.28/forest-module/monarch-milkweed-lsystem.js
 * Triad: NASA=Mariner 1 (hyphen-loss) · S36=(v1.28 pair) · SPS=Danaus plexippus (spring relay)
 * Couplings: lsystem (milkweed host-plant phenology), audio (spring wing-beat) [visual-only here]
 * Emergent contribution: sparse milkweed waypoints anchor monarch agents from v1_14;
 *   per-frame proximity scan lays eggs that hatch into caterpillar markers — the redundancy
 *   answer Mariner 1 did not have: every individual is expendable because the host-plant
 *   network converts transient visitors into the next generation.
 */
(function() {
  var HOST_XRATIOS = [0.12, 0.30, 0.50, 0.68, 0.86];
  var MAX_SEGMENTS = 6;
  var EGG_HATCH_FRAMES = 120;
  var VISIT_RADIUS_SQ = 144; // 12 px

  nasaState.v1_28 = {
    plants: [],
    caterpillars: [],
    oviposition: 0,
    _lastGrow: 0
  };

  nasaHooks.push({
    degree: '1.28',
    init: function() {
      var S = nasaState.v1_28;
      S.plants.length = 0; S.caterpillars.length = 0; S.oviposition = 0;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      for (var i = 0; i < HOST_XRATIOS.length; i++) {
        S.plants.push({
          x: W * HOST_XRATIOS[i],
          baseY: H - 30 - Math.random() * 20,
          growth: 0.0,
          segments: 0,
          eggs: []
        });
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_28;
      if (!S.plants.length) return;
      var v14 = nasaState.v1_14;
      var inSeason = v14 && (v14.season === 'summer' || v14.season === 'fall');

      // --- L-system growth: one segment/second while in season, retract in winter ---
      if (fn % 60 === 0) {
        for (var p = 0; p < S.plants.length; p++) {
          var m = S.plants[p];
          if (inSeason && m.segments < MAX_SEGMENTS) { m.segments++; m.growth = m.segments / MAX_SEGMENTS; }
          else if (!inSeason && m.segments > 0 && Math.random() < 0.15) { m.segments--; m.growth = m.segments / MAX_SEGMENTS; }
        }
      }

      // --- Per-frame render + oviposition scan ---
      var drawable = (typeof stroke === 'function' && typeof line === 'function' && typeof fill === 'function' && typeof ellipse === 'function');
      var agents = (v14 && v14.agents) ? v14.agents : null;

      for (var i = 0; i < S.plants.length; i++) {
        var mp = S.plants[i];
        var segLen = 14;
        var topY = mp.baseY - mp.segments * segLen;

        if (drawable && mp.segments > 0) {
          stroke(120, 176, 96, 220);
          strokeWeight(2);
          line(mp.x, mp.baseY, mp.x, topY);
          // lateral leaf pairs every segment
          for (var sg = 1; sg <= mp.segments; sg++) {
            var ly = mp.baseY - sg * segLen;
            var leafLen = 8 + sg;
            stroke(176, 208, 80, 200);
            line(mp.x, ly, mp.x - leafLen, ly - 3);
            line(mp.x, ly, mp.x + leafLen, ly - 3);
          }
          noStroke();
        }

        // oviposition scan: any v1_14 agent within 12 px of plant top → lay egg
        if (agents && !v14.roosting && mp.segments >= 3 && (fn & 3) === 0) {
          for (var a = 0; a < agents.length; a++) {
            var ag = agents[a];
            var dx = ag.x - mp.x, dy = ag.y - topY;
            if (dx * dx + dy * dy < VISIT_RADIUS_SQ && mp.eggs.length < 4) {
              mp.eggs.push({ born: fn, hostIdx: i, hatched: false });
              S.oviposition++;
              break;
            }
          }
        }

        // egg rendering + hatch
        for (var e = mp.eggs.length - 1; e >= 0; e--) {
          var eg = mp.eggs[e];
          var ey = topY + (e % 2) * 4;
          var ex = mp.x + (e < 2 ? -4 : 4);
          if (!eg.hatched && fn - eg.born > EGG_HATCH_FRAMES) {
            eg.hatched = true;
            S.caterpillars.push({ x: ex, y: ey, hostIdx: i, born: fn });
          }
          if (drawable && !eg.hatched) { fill(240, 228, 200, 200); ellipse(ex, ey, 2, 2); }
        }
      }

      // caterpillar markers (stationary, striped)
      if (drawable) {
        for (var c = 0; c < S.caterpillars.length; c++) {
          var ct = S.caterpillars[c];
          fill(240, 228, 100, 220); ellipse(ct.x, ct.y, 5, 2.4);
          fill(26, 20, 10, 240);     ellipse(ct.x, ct.y, 1.6, 2.4);
        }
      }
    }
  });
})();

// --- DEGREE v1_29 ---
/* ==== DEGREE v1.29 — Mariner 2 Orca Pod Pass (oceanic strip, simple) ====
 * Source spec: ../NASA/1.29/forest-module/NOT_APPLICABLE.md (retro-fill)
 * Triad: NASA=Mariner 2 (first interplanetary flyby) · S36=(v1.29 pair) · SPS=Orca
 * Couplings: offshore-strip event (reads v1_13.shorelineY, v1_18.bandTop), circadian bias via sky.moonAlt
 * Emergent contribution: periodic orca pod traversal of oceanic strip with fluke-splash events;
 *   parallels Mariner 2's crossing + hidden-world emission. No forward ref to v1_59 canonical SRKW.
 */
(function() {
  var PASS_PERIOD   = 3600;  // frames between passes (~60s @ 60fps)
  var PASS_DURATION = 1200;  // base frames per pass (~20s traversal)
  var FLUKE_PERIOD  = 120;   // frames between fluke-splash probes
  var MIN_AGENTS    = 3;
  var MAX_AGENTS    = 6;

  nasaState.v1_29 = {
    podActive: false,
    podX: -9999,
    podY: 0,
    agents: [],
    flukeEvents: 0,
    lastFlukeFrame: -9999,
    passCount: 0,
    _lastPass: -PASS_PERIOD,
    _dir: 1,
    _speed: 0.8,
    _endX: 0
  };

  nasaHooks.push({
    degree: '1.29',
    init: function() {
      nasaState.v1_29._lastPass = -PASS_PERIOD + 180; // first pass a few seconds after boot
    },
    tick: function(fn) {
      var S = nasaState.v1_29;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;

      // Offshore Y: between v1_13 shoreline (top of water) and v1_18 kelp bandTop.
      var yTop = (nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
        ? nasaState.v1_13.shorelineY : H * 0.85;
      var yBot = (nasaState.v1_18 && typeof nasaState.v1_18.bandTop === 'number')
        ? nasaState.v1_18.bandTop : H * 0.95;
      var poolY = (yTop + yBot) * 0.5;

      // Dawn/dusk bias: moon up extends pass by 30%.
      var moonUp = (typeof sky === 'object' && sky && sky.moonAlt > 0);
      var duration = moonUp ? Math.floor(PASS_DURATION * 1.3) : PASS_DURATION;

      // Spawn a new pass on period.
      var sincePass = fn - S._lastPass;
      if (!S.podActive && sincePass >= PASS_PERIOD) {
        S.podActive = true;
        S._lastPass = fn;
        S._dir = (S.passCount % 2 === 0) ? 1 : -1;
        S.podX = (S._dir === 1) ? -40 : W + 40;
        S._endX = (S._dir === 1) ? W + 40 : -40;
        S.podY = poolY;
        var n = MIN_AGENTS + ((fn * 7) % (MAX_AGENTS - MIN_AGENTS + 1));
        S.agents = [];
        for (var i = 0; i < n; i++) {
          S.agents.push({
            dx: -i * 18 * S._dir,             // trailing offset behind lead
            dy: ((i * 53) % 14) - 7,          // small y scatter
            phase: (i * 0.47) % (Math.PI * 2) // bob phase offset
          });
        }
      }

      // Advance lead during active pass.
      if (S.podActive) {
        S.podX += S._speed * S._dir;
        // End pass when lead exits the far side OR duration elapses.
        var exited = (S._dir === 1) ? (S.podX > S._endX) : (S.podX < S._endX);
        if (exited || fn - S._lastPass > duration) {
          S.podActive = false;
          S.passCount += 1;
          return;
        }
        // Fluke-splash probe at the lead agent.
        if (fn - S.lastFlukeFrame > FLUKE_PERIOD) {
          S.lastFlukeFrame = fn;
          S.flukeEvents += 1;
        }
      }

      // Render gated per 30 frames — pod silhouettes + optional splash ring.
      if (!S.podActive || fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      var t = fn * 0.04;
      for (var a = 0; a < S.agents.length; a++) {
        var ag = S.agents[a];
        var ax = S.podX + ag.dx;
        var ay = S.podY + ag.dy + Math.sin(t + ag.phase) * 1.5;
        if (ax < -20 || ax > W + 20) continue;
        noStroke();
        fill(26, 72, 104, 210);                // #1A4868 salish-blue silhouette
        ellipse(ax, ay, 14, 4);                // low-profile back-at-surface shape
        fill(232, 236, 240, 180);              // #E8ECF0 orca-white eye/saddle pip
        ellipse(ax - 2 * S._dir, ay - 1, 2, 1.2);
      }
      // Splash ring on recent fluke event at lead agent position.
      if (fn - S.lastFlukeFrame < 30 && typeof noFill === 'function' && typeof stroke === 'function') {
        var a2 = 1 - (fn - S.lastFlukeFrame) / 30;
        noFill();
        stroke(212, 168, 72, 200 * a2);        // #D4A848 venus-gold flash
        strokeWeight(1);
        ellipse(S.podX, S.podY, 12 + (1 - a2) * 18, 6 + (1 - a2) * 8);
      }
    }
  });
})();

// --- DEGREE v1_30 ---
/* ==== DEGREE v1.30 — Pileated Woodpecker Snag Drum ====
 * Source spec: ../NASA/1.30/forest-module/pileated-woodpecker-snag-drum.js
 * Triad: NASA=Mercury-Atlas 8 / Sigma 7 · S36=(v1.30 pair) · SPS=Pileated Woodpecker
 * Couplings: snag-anchor (reads v1_3.hubs or mature plants), midday drum bursts, patrol agent
 * Emergent contribution: one woodpecker agent anchors to the oldest hub/snag and emits
 *   4–5 Hz drum bursts in midday; publishes drumEvents for forest-density analysis.
 */
(function() {
  var BURST_PERIOD = 1200;  // ~20s between bursts @60fps
  var BEATS_PER_BURST = 5;
  var BEAT_GAP = 13;        // frames between beats → ~4.6 Hz

  nasaState.v1_30 = {
    snag: null,            // {x, y} or null
    wx: { x: 0, y: 0 },    // woodpecker agent position
    drumming: false,
    drumEvents: 0,
    lastDrumFrame: -9999,
    beatsThisEvent: 0,
    _lastBurstStart: -BURST_PERIOD,
    _burstBeatsLeft: 0,
    _nextBeatFrame: 0
  };

  function pickSnag() {
    // Preferred: oldest v1_3 cedar hub (highest rings) — most snag-like
    var hubs = (nasaState.v1_3 && nasaState.v1_3.hubs) || null;
    if (hubs && hubs.length > 0) {
      var best = null, bestR = -1;
      for (var i = 0; i < hubs.length; i++) {
        if (hubs[i].rings > bestR) { bestR = hubs[i].rings; best = hubs[i]; }
      }
      if (best && bestR >= 4) return { x: best.x, y: best.y };
    }
    // Fallback: a mature plant that has stopped growing
    if (typeof plants !== 'undefined' && plants) {
      for (var j = 0; j < plants.length; j++) {
        var p = plants[j];
        if (p && p.growth >= (p.maxGrowth || 1) - 0.01 && p.age > 600) {
          return { x: p.x, y: p.y };
        }
      }
    }
    return null;
  }

  nasaHooks.push({
    degree: '1.30',
    init: function() {
      nasaState.v1_30.snag = pickSnag();
      if (nasaState.v1_30.snag) {
        nasaState.v1_30.wx.x = nasaState.v1_30.snag.x + 14;
        nasaState.v1_30.wx.y = nasaState.v1_30.snag.y - 20;
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_30;
      if (fn % 120 === 0) { if (!S.snag) S.snag = pickSnag(); }
      if (!S.snag) return;

      // Ease agent toward snag (cheap)
      var tgtX = S.snag.x + Math.sin(fn * 0.03) * 18;
      var tgtY = S.snag.y - 18 + Math.cos(fn * 0.04) * 6;
      S.wx.x += (tgtX - S.wx.x) * 0.05;
      S.wx.y += (tgtY - S.wx.y) * 0.05;

      // Midday gate: drum bursts during daylight with sun high
      var midday = (typeof sky === 'object' && sky && sky.isDay && sky.sunAlt > 20);

      // Start a new burst
      if (midday && !S.drumming && fn - S._lastBurstStart >= BURST_PERIOD) {
        S.drumming = true;
        S._lastBurstStart = fn;
        S._burstBeatsLeft = BEATS_PER_BURST;
        S._nextBeatFrame = fn;
        S.beatsThisEvent = 0;
      }

      // Fire beats inside an active burst
      if (S.drumming && fn >= S._nextBeatFrame) {
        S.drumEvents += 1;
        S.beatsThisEvent += 1;
        S.lastDrumFrame = fn;
        S._burstBeatsLeft -= 1;
        if (S._burstBeatsLeft <= 0) { S.drumming = false; }
        else { S._nextBeatFrame = fn + BEAT_GAP; }
      }

      // Render snag marker + agent every 20 frames + beat flash
      if (fn % 20 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      noStroke();
      // Crest: pileated-red #C83024 with brief brighten on beat
      var lit = (fn - S.lastDrumFrame) < 8 ? 255 : 180;
      fill(200, 48, 36, lit);
      ellipse(S.wx.x, S.wx.y, 4.5, 3);
      // Body dot: near-black
      fill(16, 16, 24, 220);
      ellipse(S.wx.x + 0.8, S.wx.y + 1.6, 3, 2.4);
    }
  });
})();

// --- DEGREE v1_31 ---
/* ==== DEGREE v1.31 — Coho Smolt Ocean Outmigration ====
 * Source spec: ../NASA/1.31/forest-module/coho-smolt-outmigration.js
 * Triad: NASA=Ranger 5 (short-circuit silent flyby) · S36=(v1.31 pair) · SPS=Coho Smolt
 * Couplings: boids (migration-wave, downstream drift), audio (tidal-mix layer) [visual-only here]
 * Emergent contribution: spring-gated smolt tokens flow DOWNSTREAM through the stream corridor;
 *   one-way threshold crossing; publishes smolt-out events for downstream consumers.
 */
(function() {
  var BURST_PERIOD  = 45;    // frames between burst spawns while gated open (~0.75s)
  var BURST_MIN     = 4;
  var BURST_MAX     = 6;
  var MAX_LIVE      = 24;    // hard cap on live tokens
  var STREAM_Y_MIN  = 0.85;  // stream corridor upper bound (matches v1_19 convention)
  var DRIFT_VY_BASE = 1.15;  // downstream pixels/frame (≈strong rheotaxis)
  var SEASON_GATE   = 0.3;   // spring threshold

  nasaState.v1_31 = {
    smolts: [],
    outEvents: 0,
    seasonGate: false,
    lastOutFrame: -9999,
    recentBursts: 0,
    _lastBurst: -9999,
    emit: function() { /* set in init to call subscribers; no-op default */ }
  };

  nasaHooks.push({
    degree: '1.31',
    init: function() {
      nasaState.v1_31._lastBurst = -BURST_PERIOD;
    },
    tick: function(fn) {
      var S = nasaState.v1_31;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var s = (typeof season === 'number') ? season : 0;
      S.seasonGate = s > SEASON_GATE;

      // Advance live tokens downstream; despawn when exiting canvas.
      var M = S.smolts, i;
      for (i = M.length - 1; i >= 0; i--) {
        M[i].y += M[i].vy;
        M[i].x += Math.sin((fn + M[i].birth) * 0.08) * 0.25; // gentle lateral shimmer
        if (M[i].y > H + 4) { M.splice(i, 1); }
      }

      // Gated burst spawn: only while spring window open AND under population cap.
      if (S.seasonGate && fn - S._lastBurst >= BURST_PERIOD && M.length < MAX_LIVE) {
        S._lastBurst = fn;
        var count = BURST_MIN + ((fn * 11) % (BURST_MAX - BURST_MIN + 1));
        // Ecological coupling: if v1_19 chinook run active, reduce burst ~20%.
        if (nasaState.v1_19 && nasaState.v1_19.active) count = Math.max(BURST_MIN - 1, count - 1);
        var cx = (0.12 + ((fn * 37) % 1000) / 1000 * 0.76) * W;
        for (var k = 0; k < count && M.length < MAX_LIVE; k++) {
          M.push({
            x: cx + ((k * 7) % 11) - 5,
            y: STREAM_Y_MIN * H + 2,
            vy: DRIFT_VY_BASE + ((k * 13) % 5) * 0.08,
            birth: fn
          });
        }
        S.outEvents += 1;
        S.lastOutFrame = fn;
        S.recentBursts = (S.recentBursts + 1) & 0xffff;
        try { S.emit(fn, count); } catch (e) {}
      }

      // Render: per-30-frame silver flecks (coho-silver #C8C8CC).
      if (fn % 30 !== 0 || !M.length) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      noStroke();
      for (i = 0; i < M.length; i++) {
        fill(200, 200, 204, 215);
        ellipse(M[i].x, M[i].y, 3.2, 1.6);
      }
    }
  });
})();

// --- DEGREE v1_32 ---
/* ==== DEGREE v1.32 — White-crowned Sparrow Dialect Geography ====
 * Source spec: ../NASA/1.32/forest-module/white-crowned-sparrow-dialect.js
 * Triad: NASA=MA-9 Faith 7 (1963, Cooper manual retrofire) · S36=(v1.32 pair) · SPS=Z. l. pugetensis
 * Couplings: boids/colonial-cohort (scrub-edge), audio/event (dawn dialect), circadian/daylight-bias
 * Emergent contribution: ORIGIN of cultural-transmission axis — 3-5 territory zones each carrying a
 *   scalar dialectPhase; neighbouring zones drift slowly toward each other via Kuramoto-weak coupling
 *   but never lock. Published phase vector cited by v1.58 (Bewick's Wren) + v1.61 (Humpback).
 */
(function() {
  var ZONE_N        = 4;       // within 3-5 window
  var DRIFT_EPS     = 0.012;   // rad/step — slow enough to never lock
  var ROOST_X       = 0.62;    // normalised scrub-edge roost anchor from source spec
  var ROOST_Y       = 0.72;
  var ZONE_RADIUS   = 0.11;    // normalised ring radius around roost
  var TWO_PI        = Math.PI * 2;

  nasaState.v1_32 = {
    zones: [],
    dialectGrid: [],
    active: false,
    driftEvents: 0,
    getDialectPhase: function(i) {
      var z = nasaState.v1_32.zones[i];
      return z ? z.dialectPhase : 0;
    }
  };

  nasaHooks.push({
    degree: '1.32',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var Z = nasaState.v1_32.zones;
      for (var k = 0; k < ZONE_N; k++) {
        var theta = (k / ZONE_N) * TWO_PI;
        // Seed each zone with a distinct initial dialectPhase (90° apart for N=4).
        Z.push({
          x: (ROOST_X + ZONE_RADIUS * Math.cos(theta)) * W,
          y: (ROOST_Y + ZONE_RADIUS * Math.sin(theta) * 0.6) * H,
          dialectPhase: (k / ZONE_N) * TWO_PI,
          neighborCount: 2
        });
        nasaState.v1_32.dialectGrid.push(Z[k].dialectPhase);
      }
      // Optional nudge of zone 0 toward a v1_0.pulses seed if present.
      if (nasaState.v1_0 && nasaState.v1_0.pulses && nasaState.v1_0.pulses.length) {
        var p = nasaState.v1_0.pulses[0];
        if (p && typeof p.x === 'number') { Z[0].x = 0.7 * Z[0].x + 0.3 * p.x; Z[0].y = 0.8 * Z[0].y + 0.2 * p.y; }
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_32;

      // Gate: spring breeding window + dawn/morning sky. Re-check once/second.
      if (fn % 60 === 0) {
        var seas = (typeof season === 'number') ? season : 0;
        var phase = (sky && sky.phase) ? sky.phase : 'day';
        S.active = (seas >= 0.25 && seas < 0.50) && (phase === 'dawn' || phase === 'morning');
      }
      if (!S.active) return;

      // Per-15-second Kuramoto-weak neighbourhood drift: each zone's phase steps epsilon
      // toward the circular mean of its two ring-neighbours. Never locks (eps small, two-sided).
      if (fn % 900 === 0) {
        var Z = S.zones, n = Z.length, i, prev, next, target, diff;
        var newPhases = [];
        for (i = 0; i < n; i++) {
          prev = Z[(i - 1 + n) % n].dialectPhase;
          next = Z[(i + 1) % n].dialectPhase;
          // Circular mean of two neighbours via atan2 of summed unit vectors.
          target = Math.atan2(Math.sin(prev) + Math.sin(next), Math.cos(prev) + Math.cos(next));
          diff = target - Z[i].dialectPhase;
          // Wrap diff into [-π, π].
          while (diff >  Math.PI) diff -= TWO_PI;
          while (diff < -Math.PI) diff += TWO_PI;
          newPhases.push(Z[i].dialectPhase + diff * DRIFT_EPS);
        }
        for (i = 0; i < n; i++) {
          Z[i].dialectPhase = ((newPhases[i] % TWO_PI) + TWO_PI) % TWO_PI;
          S.dialectGrid[i] = Z[i].dialectPhase;
        }
        S.driftEvents += 1;
      }

      // Render gated per 20 frames — one small phase-tinted dot per zone with a crown-stripe pip.
      if (fn % 20 !== 0 || typeof fill !== 'function' || typeof noStroke !== 'function') return;
      noStroke();
      var A = S.zones;
      for (var j = 0; j < A.length; j++) {
        var z = A[j];
        // Hue from dialectPhase: map [0, 2π) → [0, 255] R channel bias for zone contrast.
        var r = 120 + Math.floor(80 * Math.cos(z.dialectPhase));
        var g = 110 + Math.floor(40 * Math.sin(z.dialectPhase));
        fill(r, g, 80, 200);
        ellipse(z.x, z.y, 4.5, 3.2);
        fill(240, 240, 240, 220);         // white-crown stripe pip
        ellipse(z.x, z.y - 1.4, 2.2, 0.9);
      }
    }
  });
})();

// --- DEGREE v1_33 ---
/* ==== DEGREE v1.33 — Northern Spotted Owl Territorial Duet ====
 * Source spec: ../NASA/1.33/forest-module/northern-spotted-owl-territory.js
 * Triad: NASA=Ranger 6 · S36=(dedication: Schurmeier/Block III) · SPS=Strix occidentalis caurina
 * Couplings: kuramoto (phase-inject, internal), audio (event, silent here — render-only), circadian (event night/dusk)
 * Emergent contribution: 1–2 territory zones anchored on v1_3 cedar hubs; publishes reusable
 *   old-growth habitat-quality sampler; hoots gate on substrate score (Ranger-6 presence-without-signal).
 */
(function() {
  nasaState.v1_33 = {
    territories: [],      // [{cx, cy, r, anchorHub, oldGrowthScore, lastHoot, phase}]
    hootCount: 0,
    lastDuskHoot: -9999,
    oldGrowthScore: function(x, y) {
      var hubs = (nasaState.v1_3 && nasaState.v1_3.hubs) || null;
      if (!hubs || hubs.length === 0) return 0;
      var score = 0, i, h, dx, dy, d2, falloff;
      for (i = 0; i < hubs.length; i++) {
        h = hubs[i];
        dx = h.x - x; dy = h.y - y; d2 = dx*dx + dy*dy;
        falloff = Math.exp(-d2 / 14400); // ~120 px characteristic length
        score += falloff * (0.3 + Math.min(0.7, h.rings * 0.02));
        if (h.armillariaLinked) score += falloff * 0.15;
      }
      return Math.min(1, score);
    }
  };

  function anchorTerritories() {
    var state = nasaState.v1_33;
    state.territories.length = 0;
    var hubs = (nasaState.v1_3 && nasaState.v1_3.hubs) || null;
    if (!hubs || hubs.length === 0) return;
    // Rank hubs: armillariaLinked first, then by ring count
    var ranked = hubs.slice().sort(function(a, b) {
      var aw = (a.armillariaLinked ? 1000 : 0) + a.rings;
      var bw = (b.armillariaLinked ? 1000 : 0) + b.rings;
      return bw - aw;
    });
    var n = Math.min(2, ranked.length);
    for (var i = 0; i < n; i++) {
      var h = ranked[i];
      state.territories.push({
        cx: h.x, cy: h.y, r: 140,
        anchorHub: h, oldGrowthScore: 0,
        lastHoot: -9999, phase: i * Math.PI
      });
    }
  }

  nasaHooks.push({
    degree: '1.33',
    init: function() { anchorTerritories(); },
    tick: function(fn) {
      var state = nasaState.v1_33;
      // Per-second: re-anchor if v1_3 hubs changed, refresh oldGrowthScore at each centre
      if (fn % 60 === 0) {
        var hubs = (nasaState.v1_3 && nasaState.v1_3.hubs) || null;
        if (!hubs || state.territories.length === 0) anchorTerritories();
        for (var i = 0; i < state.territories.length; i++) {
          var t = state.territories[i];
          t.oldGrowthScore = state.oldGrowthScore(t.cx, t.cy);
        }
      }
      // Dusk/night territorial hoot — Ranger 6 gate: substrate must clear 0.35
      var isNight = (typeof sky !== 'undefined' && sky.isDay === false);
      if (isNight && fn % 180 === 0) { // ~3s cadence during night
        for (var k = 0; k < state.territories.length; k++) {
          var tr = state.territories[k];
          if (tr.oldGrowthScore > 0.35 && fn - tr.lastHoot > 300) {
            tr.lastHoot = fn;
            state.hootCount++;
            state.lastDuskHoot = fn;
          }
        }
      }
      // Render faint eye-gold territory ring + hoot diamond glyph every 3s
      if (fn % 180 !== 0) return;
      if (typeof noFill !== 'function' || typeof ellipse !== 'function') return;
      noFill();
      for (var m = 0; m < state.territories.length; m++) {
        var tt = state.territories[m];
        var active = (fn - tt.lastHoot) < 120;
        var baseA = 0.08 + tt.oldGrowthScore * 0.12;
        // Owl-amber (#B88838) territory ring — dark-camera analogue
        stroke(184, 136, 56, baseA * (isNight ? 255 : 110));
        strokeWeight(active ? 1.4 : 0.6);
        ellipse(tt.cx, tt.cy, tt.r * 2, tt.r * 2);
        if (active) {
          // Eye-gold (#D4A030) hoot diamond at centre
          stroke(212, 160, 48, 210);
          strokeWeight(1.6);
          var s = 8;
          line(tt.cx, tt.cy - s, tt.cx + s, tt.cy);
          line(tt.cx + s, tt.cy, tt.cx, tt.cy + s);
          line(tt.cx, tt.cy + s, tt.cx - s, tt.cy);
          line(tt.cx - s, tt.cy, tt.cx, tt.cy - s);
        }
      }
    }
  });
})();

// --- DEGREE v1_34 ---
/* ==== DEGREE v1.34 — Ranger 7 River Otter Riparian Family ====
 * Source spec: ../NASA/1.34/forest-module/river-otter-riparian.js
 * Triad: NASA=Ranger 7 (first close-range lunar photography) · S36=(v1.34 pair, Kuiper dedication) · SPS=River Otter (Lontra canadensis)
 * Couplings: physarum (prey-density stream-edge gradient), audio (stream ambient layer)
 * Emergent contribution: 2-4 otter family cluster patrolling the stream zone with high cohesion,
 *   periodic play-bouts, and salmon-run-gated foraging surge reading v1_19.active/nzones.
 */
(function() {
  var N_MIN = 2, N_MAX = 4;
  var Y_MIN = 0.72, Y_MAX = 0.84;     // stream-zone band (matches source TERRITORY_Y)
  var X_MIN = 0.10, X_MAX = 0.90;     // patrol corridor (matches source TERRITORY_X_*)
  var BASE_SPEED = 0.45;              // px/frame patrol pace
  var SURGE_MULT = 1.40;              // salmon-run activity boost
  var COHESION   = 0.035;             // pull toward centroid
  var PLAY_PERIOD = 480;              // ~8 s between play-bouts

  nasaState.v1_34 = {
    otters: [],
    groupCentroid: { x: 0, y: 0 },
    playBouts: 0,
    foragingSurge: false,
    circuitCount: 0,
    _dir: 1,
    _lastPlay: -PLAY_PERIOD
  };

  nasaHooks.push({
    degree: '1.34',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var n = N_MIN + Math.floor(Math.random() * (N_MAX - N_MIN + 1));
      var baseY = (Y_MIN + Y_MAX) * 0.5 * H;
      for (var i = 0; i < n; i++) {
        nasaState.v1_34.otters.push({
          x: (X_MIN + 0.05 + i * 0.03) * W,
          y: baseY + ((i * 37) % 10) - 5,
          phase: 'PATROL',
          phaseFrame: 0,
          bondTarget: -1
        });
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_34, O = S.otters;
      if (!O.length) return;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var xMinPx = X_MIN * W, xMaxPx = X_MAX * W;
      var yMinPx = Y_MIN * H, yMaxPx = Y_MAX * H;

      // Salmon-run gate: speed bonus + biased target when v1_19 is running.
      S.foragingSurge = !!(nasaState.v1_19 && nasaState.v1_19.active);
      var speed = S.foragingSurge ? BASE_SPEED * SURGE_MULT : BASE_SPEED;

      // Target the nearest active salmon zone if surging; else scan along corridor.
      var tx = -1, ty = -1;
      if (S.foragingSurge && nasaState.v1_19.nzones && nasaState.v1_19.nzones.length) {
        var Z = nasaState.v1_19.nzones, best = 1e9, b;
        for (var k = 0; k < Z.length; k++) {
          b = Math.abs(Z[k].x - S.groupCentroid.x);
          if (b < best) { best = b; tx = Z[k].x; ty = Math.min(Math.max(Z[k].y, yMinPx), yMaxPx); }
        }
      }

      // Centroid.
      var cx = 0, cy = 0, i, o;
      for (i = 0; i < O.length; i++) { cx += O[i].x; cy += O[i].y; }
      cx /= O.length; cy /= O.length;
      S.groupCentroid.x = cx; S.groupCentroid.y = cy;

      // Circuit reversal on corridor edges.
      if (cx >= xMaxPx - 4) { S._dir = -1; S.circuitCount += 1; }
      else if (cx <= xMinPx + 4) { S._dir = 1; S.circuitCount += 1; }

      // Periodic play-bout: pick a random pair.
      if (O.length >= 2 && fn - S._lastPlay >= PLAY_PERIOD) {
        S._lastPlay = fn;
        S.playBouts += 1;
        var a = Math.floor(Math.random() * O.length);
        var b2 = (a + 1 + Math.floor(Math.random() * (O.length - 1))) % O.length;
        O[a].phase = 'PLAY'; O[a].phaseFrame = fn; O[a].bondTarget = b2;
        O[b2].phase = 'PLAY'; O[b2].phaseFrame = fn; O[b2].bondTarget = a;
      }

      // Per-otter update.
      for (i = 0; i < O.length; i++) {
        o = O[i];
        if (o.phase === 'PLAY') {
          // Vertical slide toward bond partner; 48-frame bout.
          var peer = O[o.bondTarget];
          if (peer) {
            o.x += (peer.x - o.x) * 0.08;
            o.y += (peer.y - o.y) * 0.08 + Math.sin((fn - o.phaseFrame) * 0.35) * 0.6;
          }
          if (fn - o.phaseFrame >= 48) { o.phase = 'PATROL'; o.bondTarget = -1; }
          continue;
        }
        // PATROL: advance along corridor, pulled to centroid + optional salmon target.
        var advX = speed * S._dir;
        var ccx = (cx - o.x) * COHESION;
        var ccy = (cy - o.y) * COHESION;
        if (tx >= 0) { ccx += (tx - o.x) * 0.012; ccy += (ty - o.y) * 0.012; }
        o.x += advX + ccx;
        o.y += ccy + Math.sin((fn + i * 13) * 0.08) * 0.25;
        if (o.y < yMinPx) o.y = yMinPx;
        if (o.y > yMaxPx) o.y = yMaxPx;
      }

      // Render gated per 30 frames.
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      for (i = 0; i < O.length; i++) {
        o = O[i];
        noStroke();
        fill(122, 88, 56, 225);                   // river-brown silhouette #7A5838
        ellipse(o.x, o.y, 11, 3.5);               // low-profile body at surface
        fill(200, 181, 144, 200);                 // cognitum-beige highlight #C8B590
        ellipse(o.x + 4 * S._dir, o.y - 1, 2.5, 2); // head
        if (o.phase === 'PLAY' && typeof stroke === 'function' && typeof noFill === 'function') {
          var a2 = 1 - (fn - o.phaseFrame) / 48;
          if (a2 > 0) {
            noFill(); stroke(176, 136, 72, 200 * a2);   // mare-amber play flash #B08848
            strokeWeight(0.6); ellipse(o.x, o.y, 14, 6);
          }
        }
      }
    }
  });
})();

// --- DEGREE v1_35 ---
/* ==== DEGREE v1.35 — Western Toad Spring Chorus (Bufonidae Stochastic) ====
 * Source spec: ../NASA/1.35/forest-module/western-toad-chorus-bufonidae.js
 * Triad: NASA=Mariner 3 (stuck shroud) · S36=(Jack N. James dedication) · SPS=Anaxyrus boreas
 * Couplings: physarum (scalarField — male-density gradient along pond margin),
 *            audio (layer — stochastic FM-trill chorus ambient), state-machine CHORUS/SILENT.
 * Emergent contribution: 9 independent Poisson callers on pond margin, 4-12s inter-call
 *   intervals; reads v1_26 tree-frog phase and biases toad firing into the anti-phase window
 *   when tree-frog chorus is active; decaying male-density scalar publishes aggregate activity.
 */
(function() {
  var N_MALES = 9;
  var MIN_INTERVAL = 240;   // 4 s @ 60fps
  var MAX_INTERVAL = 720;   // 12 s @ 60fps
  var DENSITY_DECAY = 0.98;
  var DENSITY_KICK = 0.12;

  nasaState.v1_35 = {
    males: [],
    state: 'silent',
    origin: { x: 0, y: 0 },
    density: 0,
    lastFireFrame: -9999,
    callCount: 0
  };

  function seedMales(fn) {
    var S = nasaState.v1_35;
    var W = (typeof width === 'number' && width > 0) ? width : 960;
    var H = (typeof height === 'number' && height > 0) ? height : 540;
    S.origin.x = W * 0.50; S.origin.y = H * 0.82;
    S.males = [];
    for (var i = 0; i < N_MALES; i++) {
      var t = (i / N_MALES) * Math.PI * 2;
      S.males.push({
        x: S.origin.x + Math.cos(t) * W * 0.22,
        y: S.origin.y + Math.sin(t) * H * 0.05,
        nextFrame: fn + MIN_INTERVAL + Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL)),
        lastFireFrame: -9999
      });
    }
  }

  function treeFrogActive() {
    var v26 = nasaState.v1_26;
    return !!(v26 && (v26.state === 'chorus' || v26.state === 'building'));
  }

  nasaHooks.push({
    degree: '1.35',
    init: function() { seedMales(0); },
    tick: function(fn) {
      var S = nasaState.v1_35;

      // Density decay per second (coarse gate — scalar, not per-frame cost).
      if (fn % 60 === 0) {
        S.density *= DENSITY_DECAY;
        var alt = (typeof sky === 'object' && sky) ? (sky.sunAlt || 0) : 0;
        var seas = (typeof season === 'number') ? season : 0;
        var springDusk = (seas >= 0.20 && seas <= 0.40) && (alt < 5);
        S.state = springDusk ? 'chorus' : 'silent';
        if (S.state === 'silent') return;
      }
      if (S.state !== 'chorus') return;

      // Per-frame: cheap integer compare to find males due to fire.
      for (var i = 0; i < S.males.length; i++) {
        var m = S.males[i];
        if (fn < m.nextFrame) continue;

        // Duology-aware scheduling: if tree-frog chorus active, bias into anti-phase window.
        var base = MIN_INTERVAL + Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL));
        if (treeFrogActive() && nasaState.v1_26.getMeanPhase) {
          // Anti-phase bias: add a half-period ~30-frame offset when tree-frog mean phase > 0.
          var mp = nasaState.v1_26.getMeanPhase();
          if (mp > 0) base += 30;
        }
        m.nextFrame = fn + base;
        m.lastFireFrame = fn;
        S.lastFireFrame = fn;
        S.callCount++;
        S.density = Math.min(1, S.density + DENSITY_KICK);
      }
    }
  });
})();

// --- DEGREE v1_36 ---
/* ==== DEGREE v1.36 — Mariner 4 Spikemoss Resurrection ====
 * Source spec: ../NASA/1.36/forest-module/mariner4-spikemoss-resurrection.js
 * Triad: NASA=Mariner 4 · S36=Robert Cray · SPS=Selaginella oregana
 * Couplings: physarum (suppressed-state scalar), audio (readership), lsystem (leaf-density via moss-band clumps)
 * Emergent contribution: small low-mat spikemoss clumps near moss/rock zones that brown during dry
 * weather and green instantly on rain events — desiccation-tolerance compressed to the sim frame scale.
 */
(function() {
  var CLUMP_MIN = 6, CLUMP_MAX = 10;
  var DRY_RGB   = [126, 92, 58];    // curled-brown
  var WET_RGB   = [90, 122, 72];    // spikemoss-green (matches 1.36 page --spikemoss-green)

  nasaState.v1_36 = {
    clumps: [],             // {x, y, r}
    hydration: 0.0,         // 0 = fully brown, 1 = fully green
    lastRainFrame: -9999,
    greenedCount: 0
  };

  nasaHooks.push({
    degree: '1.36',
    init: function() {
      var S = nasaState.v1_36;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var n = CLUMP_MIN + Math.floor(Math.random() * (CLUMP_MAX - CLUMP_MIN + 1));
      // Gather moss-plant anchor points (PLANT_TYPES[2] = moss).
      var anchors = [];
      if (typeof plants !== 'undefined') {
        for (var i = 0; i < plants.length; i++) {
          if (plants[i] && plants[i].type === 2) anchors.push({ x: plants[i].x, y: plants[i].y });
        }
      }
      for (var k = 0; k < n; k++) {
        var ax, ay;
        if (anchors.length > 0) {
          var a = anchors[Math.floor(Math.random() * anchors.length)];
          ax = a.x + (Math.random() - 0.5) * 60;
          ay = a.y + (Math.random() - 0.5) * 8;
        } else {
          ax = 40 + Math.random() * (W - 80);
          ay = H - 18 - Math.random() * 30;          // rock/ground band
        }
        S.clumps.push({ x: ax, y: ay, r: 3 + Math.random() * 3 });
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_36;
      // --- per-second: drift hydration toward environmental target ---
      if (fn % 60 === 0) {
        var target = 0.1;
        if (typeof wx === 'object' && wx) {
          if (wx.isRaining) target = 1.0;
          else if (wx.humidity > 85) target = 0.8;
          else if (wx.humidity < 60) target = 0.05;
          else target = 0.4;
        }
        if (typeof raindrops !== 'undefined' && raindrops.length > 20) target = 1.0;
        // Slow drift during dry (desiccate ~24s) vs fast drift during wet (rehydrate ~8s).
        var rate = target > S.hydration ? 0.12 : 0.04;
        S.hydration += (target - S.hydration) * rate;
        if (S.hydration < 0) S.hydration = 0;
        if (S.hydration > 1) S.hydration = 1;
      }
      // --- per-30-frame: render clumps as low-mat sprites ---
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function' || typeof ellipse !== 'function') return;
      var t = S.hydration;
      var r = Math.round(DRY_RGB[0] * (1 - t) + WET_RGB[0] * t);
      var g = Math.round(DRY_RGB[1] * (1 - t) + WET_RGB[1] * t);
      var b = Math.round(DRY_RGB[2] * (1 - t) + WET_RGB[2] * t);
      var alpha = 180 + Math.round(60 * t);          // wetter = more opaque
      noStroke();
      for (var i = 0; i < S.clumps.length; i++) {
        var c = S.clumps[i];
        fill(r, g, b, alpha);
        ellipse(c.x, c.y, c.r * 2.4, c.r);           // low-mat flattened sprite
        // Tiny pendant festoon hint above the mat when hydrated
        if (t > 0.5) {
          fill(r, g, b, alpha * 0.65);
          ellipse(c.x, c.y - c.r * 0.8, c.r * 1.2, c.r * 0.7);
        }
      }
    },
    event: function(name, payload) {
      if (name !== 'rain') return;
      var S = nasaState.v1_36;
      S.hydration = 1.0;                              // instant green flip
      S.lastRainFrame = (typeof frameNum === 'number') ? frameNum : -1;
      S.greenedCount += 1;
    }
  });
})();

// --- DEGREE v1_37 ---
/* ==== DEGREE v1.37 — Ranger 8 Anna's Hummingbird Wing-Beat Kuramoto ====
 * Source spec: ../NASA/1.37/forest-module/ranger8-hummingbird-kuramoto.js
 * Triad: NASA=Ranger 8 · S36=Jimi Hendrix · SPS=Calypte anna
 * Couplings: kuramoto (wing-phase mutual attraction K=0.05), audio-event (gorget flash at dive nadir)
 * Emergent contribution: 2-3 hummingbirds visit v1_6 fireweed bloomfront with weakly-coupled
 *   wing oscillators; circadian dawn triggers display dive with gorget-magenta ring marker.
 */
(function() {
  var N_BIRDS = 3;
  var HOVER_HZ = 42, DIVE_HZ = 78;
  var COUPLING_K = 0.05;

  nasaState.v1_37 = {
    birds: [],
    meanPhase: 0,
    diveEvents: 0,
    _lastDiveFrame: -9999
  };

  nasaHooks.push({
    degree: '1.37',
    init: function() {
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      for (var i = 0; i < N_BIRDS; i++) {
        nasaState.v1_37.birds.push({
          x: 80 + Math.random() * (W - 160),
          y: 60 + Math.random() * (H * 0.5),
          targetX: W * 0.5, targetY: H * 0.5,
          wingPhase: Math.random() * Math.PI * 2,
          wingFreq: HOVER_HZ,
          state: 'HOVER',
          diveTimer: 0
        });
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_37;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var bloom = (nasaState.v1_6 && nasaState.v1_6.bloomFront) ? nasaState.v1_6.bloomFront : null;

      // Reselect nectar targets every 30 frames.
      if (fn % 30 === 0) {
        for (var r = 0; r < S.birds.length; r++) {
          var b0 = S.birds[r];
          if (bloom && bloom.length > 0) {
            var pick = bloom[(fn + r * 7) % bloom.length];
            b0.targetX = pick.x; b0.targetY = pick.y;
          } else {
            b0.targetX = 80 + ((fn * 3 + r * 97) % (W - 160));
            b0.targetY = 80 + ((fn * 5 + r * 53) % (H * 0.5));
          }
        }
      }

      // Kuramoto: compute mean phase, then pull each toward it.
      var sx = 0, sy = 0;
      for (var m = 0; m < S.birds.length; m++) {
        sx += Math.cos(S.birds[m].wingPhase);
        sy += Math.sin(S.birds[m].wingPhase);
      }
      S.meanPhase = Math.atan2(sy / S.birds.length, sx / S.birds.length);

      // Circadian dawn gate: approximate via 30-min sim cycle, fire once per cycle.
      var dawnGate = (fn % 1800 === 0) && (fn - S._lastDiveFrame > 1200);
      if (dawnGate && S.birds.length > 0) {
        S.birds[0].state = 'DIVE';
        S.birds[0].diveTimer = 0;
        S.birds[0].wingFreq = DIVE_HZ;
        S._lastDiveFrame = fn;
      }

      // Per-bird update.
      for (var i = 0; i < S.birds.length; i++) {
        var b = S.birds[i];
        // Advance wing phase + Kuramoto pull toward mean.
        var dphi = (b.wingFreq * 2 * Math.PI) / 60;
        var pull = COUPLING_K * Math.sin(S.meanPhase - b.wingPhase);
        b.wingPhase = (b.wingPhase + dphi + pull) % (Math.PI * 2);

        // Move toward target (hover) or dive down sharply.
        if (b.state === 'DIVE') {
          b.diveTimer++;
          b.y += 3.2;
          b.x += (b.targetX - b.x) * 0.04;
          if (b.diveTimer > 20) {
            S.diveEvents++;
            b.state = 'HOVER';
            b.wingFreq = HOVER_HZ;
            b.y = Math.max(40, b.y - 60);
          }
        } else {
          b.x += (b.targetX - b.x) * 0.03 + Math.cos(b.wingPhase) * 0.4;
          b.y += (b.targetY - b.y) * 0.03 + Math.sin(b.wingPhase) * 0.25;
        }

        // Render: tiny dart silhouette + gorget flash at dive nadir.
        if (typeof noStroke === 'function' && typeof fill === 'function' && typeof ellipse === 'function') {
          noStroke();
          fill(60, 90, 70, 200);
          ellipse(b.x, b.y, 4, 2);
          if (b.state === 'DIVE' && b.diveTimer > 15 && typeof stroke === 'function' && typeof noFill === 'function') {
            var a = 1 - (b.diveTimer - 15) / 5;
            noFill(); stroke(196, 80, 112, 220 * a); strokeWeight(1);
            ellipse(b.x, b.y, 8 + (1 - a) * 10, 6 + (1 - a) * 8);
          }
        }
      }
    }
  });
})();

// --- DEGREE v1_38 ---
/* ==== DEGREE v1.38 — Ranger 9 Peregrine Ballistic Stoop ====
 * Source spec: ../NASA/1.38/forest-module/ranger9-peregrine-stoop.js
 * Triad: NASA=Ranger 9 (Alphonsus live broadcast) · S36=Farnsworth (v1.38) · SPS=Peregrine Falcon (2nd raptor)
 * Couplings: boids predator-agent (ballistic near-vertical), audio-impact event, circadian dawn/dusk gate
 * Emergent contribution: second raptor with ballistic stoop geometry distinct from v1.12 osprey;
 *   publishes predatorEvent flag for v1.22 swallows / v1.24 juncos to consume without forward ref.
 */
(function() {
  var SOAR_Y_NORM   = 0.12;   // above v1.12 osprey patrol altitude
  var SOAR_CX_NORM  = 0.55;
  var SOAR_R_NORM   = 0.28;
  var STOOP_VY      = 7.0;    // px/frame near-vertical descent
  var RECOVER_VY    = 2.0;
  var SOAR_FRAMES   = 1800;   // 30 s patrol
  var STOOP_FRAMES  = 210;    // 3.5 s ballistic
  var RECOVER_FRAMES = 480;   // 8 s recovery

  nasaState.v1_38 = {
    falconX: 0, falconY: 0,
    state: 'SOAR',
    stoopCount: 0,
    predatorEvent: null,      // {frame, x, y} on strike — forward-readable
    targetX: 0, targetY: 0,
    _angle: 0,
    _stateFrame: 0,
    _prevSunAlt: -90
  };

  nasaHooks.push({
    degree: '1.38',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var s = nasaState.v1_38;
      s.falconX = W * SOAR_CX_NORM;
      s.falconY = H * SOAR_Y_NORM;
      s._stateFrame = 0;
    },
    tick: function(fn) {
      var s = nasaState.v1_38;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      s._stateFrame += 1;

      // Dawn/dusk gate: sunAlt crossing ±2° OR 30 s timeout triggers STOOP.
      if (fn % 60 === 0 && s.state === 'SOAR' && s._stateFrame > SOAR_FRAMES * 0.25) {
        var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;
        var atDawn = (s._prevSunAlt < 2 && alt >= 2);
        var atDusk = (s._prevSunAlt > -2 && alt <= -2);
        s._prevSunAlt = alt;
        if (atDawn || atDusk || s._stateFrame > SOAR_FRAMES) {
          // Target: swallows > juncos > fake mid-canvas anchor.
          var tx = W * 0.5, ty = H * 0.55;
          var swallows = (nasaState.v1_22 && nasaState.v1_22.agents) ? nasaState.v1_22.agents : null;
          var juncos   = (nasaState.v1_24 && nasaState.v1_24.agents) ? nasaState.v1_24.agents : null;
          if (swallows && swallows.length) {
            var sp = swallows[(fn >> 3) % swallows.length];
            tx = sp.x; ty = sp.y;
          } else if (juncos && juncos.length) {
            var jp = juncos[(fn >> 3) % juncos.length];
            tx = jp.x; ty = jp.y;
          }
          s.targetX = tx; s.targetY = ty;
          s.state = 'STOOP';
          s._stateFrame = 0;
        }
      }

      // State integration.
      if (s.state === 'SOAR') {
        s._angle += 0.006;
        s.falconX = W * (SOAR_CX_NORM + SOAR_R_NORM * Math.cos(s._angle));
        s.falconY = H * (SOAR_Y_NORM + SOAR_R_NORM * 0.18 * Math.sin(s._angle));
      } else if (s.state === 'STOOP') {
        s.falconY += STOOP_VY;
        s.falconX += (s.targetX - s.falconX) * 0.12;
        if (s.falconY >= s.targetY || s._stateFrame >= STOOP_FRAMES) {
          s.predatorEvent = { frame: fn, x: s.falconX, y: s.falconY };
          s.stoopCount += 1;
          s.state = 'RECOVER';
          s._stateFrame = 0;
        }
      } else if (s.state === 'RECOVER') {
        s.falconY -= RECOVER_VY;
        if (s.falconY <= H * SOAR_Y_NORM || s._stateFrame >= RECOVER_FRAMES) {
          s.falconY = H * SOAR_Y_NORM;
          s.state = 'SOAR';
          s._stateFrame = 0;
        }
      }

      // Render: slate falcon silhouette, tight teardrop during STOOP.
      if (typeof stroke !== 'function' || typeof line !== 'function') return;
      var tuck = (s.state === 'STOOP') ? 0.3 : 1.0;
      var wing = (7 + Math.sin(fn * 0.22) * 2) * tuck;
      stroke(74, 85, 104, 220);
      strokeWeight(1.3);
      if (typeof noFill === 'function') noFill();
      line(s.falconX, s.falconY - 3, s.falconX, s.falconY + 3);
      line(s.falconX - wing, s.falconY - 1, s.falconX + wing, s.falconY - 1);
      if (s.state === 'STOOP' && typeof fill === 'function') {
        fill(214, 158, 46, 220);
        if (typeof ellipse === 'function') ellipse(s.falconX, s.falconY - 2, 1.4, 1.4);
      }
    }
  });
})();

// --- DEGREE v1_39 ---
/* ==== DEGREE v1.39 — Gemini 3 / Molly Brown — Green Sea Turtle Beach Nesting ====
 * Source spec: ../NASA/1.39/forest-module/gemini3-sea-turtle-nesting.js
 * Triad: NASA=Gemini 3 (first crewed orbital maneuver) · S36=(v1.39 pair) · SPS=Green Sea Turtle
 * Couplings: physarum-scalarField (nest track), circadian-phase-offset (nocturnal gate), audio-layer (surf bed, conceptual)
 * Emergent contribution: rare nocturnal single-agent beach-nesting event — turtle emerges from
 *   surf at v1_13 shoreline, crawls to dry sand, deposits clutch over ~18 s, returns to sea.
 *   Publishes nest events (state, nestX/Y, nestEvents) readable by later degrees.
 */
(function() {
  var APPROACH_FRAMES   = 300;    // 5 s crawl up
  var NESTING_FRAMES    = 1080;   // 18 s clutch deposit
  var RETURN_FRAMES     = 300;    // 5 s crawl down
  var MIN_EVENT_GAP     = 2400;   // ~40 s between nesting events

  nasaState.v1_39 = {
    state: 'MARINE',
    turtleX: -9999, turtleY: -9999,
    nestX: 0, nestY: 0,
    nestEvents: 0,
    lastNestFrame: -9999,
    lastStateChangeFrame: -9999,
    _stateStart: 0,
    _emergeX: 0, _emergeY: 0
  };

  nasaHooks.push({
    degree: '1.39',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      nasaState.v1_39._emergeX = W * 0.62;
      nasaState.v1_39._emergeY = (nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
        ? nasaState.v1_13.shorelineY : H * 0.85;
      nasaState.v1_39.nestX = W * 0.62;
      nasaState.v1_39.nestY = H * 0.68;   // dry sand, above tidal band
    },
    tick: function(fn) {
      var S = nasaState.v1_39;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      // Refresh emerge Y from v1_13 each tick (cheap).
      var shoreY = (nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
        ? nasaState.v1_13.shorelineY : H * 0.85;
      S._emergeY = shoreY;

      // Nocturnal + lunar gate for MARINE -> APPROACH transition.
      if (S.state === 'MARINE') {
        var moonUp = (typeof sky === 'object' && sky && sky.moonAlt > 0.3);
        var nocturnal = (typeof sky === 'object' && sky && sky.sunAlt < -0.1);
        var gapOk = (fn - S.lastNestFrame) > MIN_EVENT_GAP;
        if (moonUp && nocturnal && gapOk) {
          S.state = 'APPROACH';
          S._stateStart = fn;
          S.lastStateChangeFrame = fn;
          S.turtleX = S._emergeX;
          S.turtleY = S._emergeY;
        }
      } else if (S.state === 'APPROACH') {
        var t = (fn - S._stateStart) / APPROACH_FRAMES;
        if (t >= 1) {
          S.state = 'NESTING';
          S._stateStart = fn;
          S.lastStateChangeFrame = fn;
          S.turtleX = S.nestX; S.turtleY = S.nestY;
        } else {
          S.turtleX = S._emergeX + (S.nestX - S._emergeX) * t;
          S.turtleY = S._emergeY + (S.nestY - S._emergeY) * t;
        }
      } else if (S.state === 'NESTING') {
        S.turtleX = S.nestX; S.turtleY = S.nestY;
        if (fn - S._stateStart >= NESTING_FRAMES) {
          S.state = 'RETURN';
          S._stateStart = fn;
          S.lastStateChangeFrame = fn;
          S.nestEvents += 1;
          S.lastNestFrame = fn;    // publishable event — clutch deposited
        }
      } else if (S.state === 'RETURN') {
        var r = (fn - S._stateStart) / RETURN_FRAMES;
        if (r >= 1) {
          S.state = 'MARINE';
          S.lastStateChangeFrame = fn;
          S.turtleX = -9999; S.turtleY = -9999;
        } else {
          S.turtleX = S.nestX + (S._emergeX - S.nestX) * r;
          S.turtleY = S.nestY + (S._emergeY - S.nestY) * r;
        }
      }

      // Render gated per 30 frames — only during non-MARINE states.
      if (S.state === 'MARINE' || fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Crawl track: faint dashed line behind active turtle (physarum/scalarField analog).
      if (S.state !== 'NESTING' && typeof stroke === 'function') {
        stroke(74, 139, 92, 70);                 // turtle-green track
        strokeWeight(1);
        if (typeof line === 'function') line(S._emergeX, S._emergeY, S.turtleX, S.turtleY);
      }
      // Turtle body.
      noStroke();
      fill(74, 139, 92, 230);                    // #4A8B5C carapace
      ellipse(S.turtleX, S.turtleY, 14, 10);
      fill(26, 58, 36, 200);                     // #1A3A24 deep green head shadow
      ellipse(S.turtleX, S.turtleY - 4, 5, 4);
      // Nesting scrape: lunar-silver sand pit ring during NESTING only.
      if (S.state === 'NESTING' && typeof noFill === 'function' && typeof stroke === 'function') {
        var pulse = 0.5 + 0.5 * Math.sin(fn * 0.15);   // slow breathing scrape
        noFill();
        stroke(200, 200, 184, 120 + pulse * 60);       // #C8C8B8 moonlit sand
        strokeWeight(1);
        ellipse(S.nestX, S.nestY, 18, 8);
      }
    }
  });
})();

// --- DEGREE v1_40 ---
/* ==== DEGREE v1.40 — Gemini 4 White-throated Swift Colonial Boids ====
 * Source spec: ../NASA/1.40/forest-module/gemini4-swift-colony-boids.js
 * Triad: NASA=Gemini 4 (first US EVA, Ed White tether) · S36=(v1.40 pair) · SPS=Aeronautes saxatalis
 * Couplings: boids (colonial-cohort N=12, cliff-anchored), audio (layer gain state field),
 *            circadian (daylight-bias tri-state FSM with thermal-bob sinusoid nested in FORAGE)
 * Emergent contribution: 12-swift cliff colony with ROOST↔FORAGE↔COLONY_DISPLAY FSM gated
 *   on sky.sunAlt; FORAGE adds sinusoidal thermal-bias altitude bob; mid-morning elects a
 *   display pair that tumbles with faster speed and boosts colony-call gain. Published state
 *   fields (callGain, thermalBias, tumbleEvents) are consumable by later degrees.
 */
(function() {
  var COLONY_N   = 12;
  var NBR_R2     = 900;    // 30^2
  var SEP_R2     = 100;    // 10^2 — tight colony flutter
  var MAX_SPD_R  = 1.6;    // roost/return
  var MAX_SPD_F  = 2.4;    // forage
  var MAX_SPD_D  = 3.4;    // display tumble
  var CLIFF_NX   = 0.08, CLIFF_NY = 0.42;

  nasaState.v1_40 = {
    agents: [],
    state: 'ROOST',
    cliffX: 0, cliffY: 0,
    callGain: -40,
    thermalBias: 0,
    displayPair: null,
    tumbleEvents: 0,
    _thermalPhase: 0,
    _displayTimer: 0,
    _lastDisplayFrame: -99999,
    _inited: false
  };

  nasaHooks.push({
    degree: '1.40',
    init: function() {
      var S = nasaState.v1_40;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      S.cliffX = W * CLIFF_NX;
      S.cliffY = H * CLIFF_NY;
      for (var i = 0; i < COLONY_N; i++) {
        S.agents.push({
          x: S.cliffX + (Math.random() - 0.5) * 22,
          y: S.cliffY + (Math.random() - 0.5) * 22,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8
        });
      }
      S._inited = true;
    },
    tick: function(fn) {
      var S = nasaState.v1_40;
      if (!S._inited) return;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var A = S.agents, N = A.length;
      var alt = (typeof sky === 'object' && sky && typeof sky.sunAlt === 'number') ? sky.sunAlt : 10;

      // State gate — once per second.
      if (fn % 60 === 0) {
        if (S.state === 'ROOST' && alt > 2) { S.state = 'FORAGE'; S.callGain = -22; }
        else if (S.state === 'FORAGE' && alt > 28 && (fn - S._lastDisplayFrame) > 3600) {
          S.state = 'COLONY_DISPLAY'; S.callGain = -16;
          S.displayPair = [0, 1 % N]; S._displayTimer = 0; S._lastDisplayFrame = fn;
        }
        else if (S.state === 'COLONY_DISPLAY' && S._displayTimer > 300) {
          S.state = 'FORAGE'; S.callGain = -22; S.displayPair = null; S.tumbleEvents++;
        }
        else if (alt < -1 && S.state !== 'ROOST') { S.state = 'ROOST'; S.callGain = -40; S.displayPair = null; }
      }
      if (S.state === 'COLONY_DISPLAY') S._displayTimer++;

      // Thermal-bias sinusoid nested in FORAGE (~14 s period @ 60 fps).
      if (S.state === 'FORAGE') {
        S._thermalPhase += 0.0075;
        S.thermalBias = Math.sin(S._thermalPhase) * 0.5;
      } else {
        S.thermalBias *= 0.9;
      }

      // Anchor weight + speed cap by state.
      var anchorW = (S.state === 'ROOST') ? 0.006 : (S.state === 'COLONY_DISPLAY') ? 0.0015 : 0.0010;
      var maxSpd  = (S.state === 'ROOST') ? MAX_SPD_R : (S.state === 'COLONY_DISPLAY') ? MAX_SPD_D : MAX_SPD_F;
      var scanStart = fn & 7;
      var render = (typeof fill === 'function' && typeof ellipse === 'function' && typeof noStroke === 'function');
      if (render) noStroke();

      for (var i = 0; i < N; i++) {
        var a = A[i];
        var cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, cn = 0;
        for (var j = scanStart; j < N; j += 8) {
          if (j === i) continue;
          var b = A[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx*dx + dy*dy;
          if (d2 < NBR_R2) { cx += b.x; cy += b.y; ax += b.vx; ay += b.vy; cn++; }
          if (d2 < SEP_R2 && d2 > 0.01) { sx -= dx / d2; sy -= dy / d2; }
        }
        if (cn > 0) { cx = cx/cn - a.x; cy = cy/cn - a.y; ax = ax/cn - a.vx; ay = ay/cn - a.vy; }
        // Pair-tumble: display duo gets a rotating attractor around colony mean.
        var extraX = 0, extraY = 0;
        if (S.displayPair && (i === S.displayPair[0] || i === S.displayPair[1])) {
          var theta = S._displayTimer * 0.12 + (i === S.displayPair[0] ? 0 : Math.PI);
          extraX = Math.cos(theta) * 1.2; extraY = Math.sin(theta) * 0.9;
        }
        a.vx += cx * 0.0008 + ax * 0.05 + sx * 0.7 + (S.cliffX - a.x) * anchorW + extraX;
        a.vy += cy * 0.0008 + ay * 0.05 + sy * 0.7 + (S.cliffY - a.y) * anchorW + extraY + S.thermalBias;
        var sp2 = a.vx*a.vx + a.vy*a.vy;
        if (sp2 > maxSpd * maxSpd) { var s = maxSpd / Math.sqrt(sp2); a.vx *= s; a.vy *= s; }
        a.x += a.vx; a.y += a.vy;
        if (a.x < 4) { a.x = 4; a.vx = Math.abs(a.vx); }
        else if (a.x > W - 4) { a.x = W - 4; a.vx = -Math.abs(a.vx); }
        if (a.y < 4) { a.y = 4; a.vy = Math.abs(a.vy); }
        else if (a.y > H - 4) { a.y = H - 4; a.vy = -Math.abs(a.vy); }

        // Render: EVA-white body + visor-gold dorsal accent; display pair brighter.
        if (render) {
          var bright = (S.displayPair && (i === S.displayPair[0] || i === S.displayPair[1])) ? 1.0 : 0.78;
          fill(240, 236, 228, 200 * bright);
          ellipse(a.x, a.y, 3.2, 2.2);
          fill(212, 168, 48, 170 * bright);
          ellipse(a.x - a.vx * 1.1, a.y - a.vy * 1.1, 1.3, 1.0);
        }
      }
    }
  });
})();

// --- DEGREE v1_41 ---
/* ==== DEGREE v1.41 — Gemini 5 — Arctic Tern Pole-to-Pole Migration Wave ====
 * Source spec: ../NASA/1.41/forest-module/gemini5-arctic-tern-migration.js
 * Triad: NASA=Gemini 5 (endurance) · S36=Shackleton dedication · SPS=Sterna paradisaea
 * Couplings: boids (migration-wave), audio (plunge-dive event → bill-flash),
 *            circadian (seasonal direction flip + solar-noon dive gate)
 * Emergent contribution: rarer, more aerial counterpart to v1.27 sooty shearwater.
 *   6-12 white-with-black-cap terns cross oceanic strip ~every 120-180 s (2x rarer
 *   than v1.27). Seasonal direction flip (spring E, fall W). Plunge arrests x-motion
 *   with red bill-flash — NO surface-rest, NO soaring bob.
 */
(function() {
  var MIN_GAP = 3600, STREAM_CHANCE = 0.002;
  var SIZE_MIN = 6, SIZE_MAX = 12, SPEED = 2.6;
  var DIVE_CHANCE = 0.008, DIVE_FRAMES = 12;

  nasaState.v1_41 = {
    agents: [], passCount: 0, diveEvents: 0,
    lastStreamFrame: -9999, lastDirection: 0   // +1 spring E, -1 fall W
  };

  nasaHooks.push({
    degree: '1.41',
    init: function() { nasaState.v1_41.agents.length = 0; },
    tick: function(fn) {
      var S = nasaState.v1_41;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var shoreY = (nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
                   ? nasaState.v1_13.shorelineY : H * 0.82;
      var oceanTop = shoreY + 6, oceanBot = H - 6;

      // Solar-noon Gaussian dive-rate (§9.3 phaseFunction proxy via sunAlt).
      var sunAlt = (typeof sky === 'object' && sky && typeof sky.sunAlt === 'number') ? sky.sunAlt : 10;
      var diveMult = Math.max(0.05, Math.exp(-0.5 * Math.pow((sunAlt - 30) / 20, 2)));

      // Seasonal gate: spring+fall only (silent in summer/winter — bird at pole).
      var s = (typeof season === 'number') ? season : 2.5;
      var isSpring = (s > 0.2 && s < 1.1), isFall = (s > 2.2 && s < 3.1);
      var dir = isSpring ? +1 : -1;

      if ((isSpring || isFall) && S.agents.length === 0 &&
          fn - S.lastStreamFrame > MIN_GAP && Math.random() < STREAM_CHANCE) {
        S.lastStreamFrame = fn; S.lastDirection = dir;
        var n = SIZE_MIN + Math.floor(Math.random() * (SIZE_MAX - SIZE_MIN + 1));
        var startX = (dir > 0) ? -16 : W + 16;
        for (var i = 0; i < n; i++) {
          S.agents.push({
            x: startX - dir * i * 22,
            y: oceanTop + Math.random() * (oceanBot - oceanTop),
            vx: dir * (SPEED + (Math.random() - 0.5) * 0.5),
            diveTimer: 0, diveY0: 0
          });
        }
      }

      var renderable = (typeof fill === 'function' && typeof ellipse === 'function' && typeof noStroke === 'function');
      if (renderable) noStroke();

      for (var j = S.agents.length - 1; j >= 0; j--) {
        var a = S.agents[j];
        if (a.diveTimer === 0 && Math.random() < DIVE_CHANCE * diveMult) {
          a.diveTimer = DIVE_FRAMES; a.diveY0 = a.y; S.diveEvents++;
        }
        if (a.diveTimer > 0) {
          var arc = Math.sin((1 - a.diveTimer / DIVE_FRAMES) * Math.PI);  // drop-rise
          a.y = a.diveY0 + arc * Math.min(24, shoreY + 2 - a.diveY0);
          a.diveTimer--;
        } else {
          a.x += a.vx;                          // straight glide, NO soaring bob
        }

        if (renderable) {
          fill(244, 240, 232, 235); ellipse(a.x, a.y, 4, 2);                    // #F4F0E8 body
          fill(12, 12, 14, 240);    ellipse(a.x + a.vx * 0.5, a.y - 0.8, 2.0, 1.1); // #0C0C0E cap
          if (a.diveTimer > DIVE_FRAMES * 0.4) {
            fill(204, 68, 51, 235); ellipse(a.x + a.vx * 0.9, a.y - 0.2, 1.2, 0.8); // #CC4433 bill-flash
          }
        }

        if (a.x < -20 || a.x > W + 20) { S.passCount++; S.agents.splice(j, 1); }
      }
    }
  });
})();

// --- DEGREE v1_42 ---
/* ==== DEGREE v1.42 — Gemini 7 / Sandhill Crane Staging Migration Wave ====
 * Source spec: ../NASA/1.42/forest-module/gemini7-sandhill-crane-migration.js
 * Triad: NASA=Gemini 7 (Borman/Lovell, 14d) · S36=John Boyd (OODA dedication) · SPS=Antigone canadensis
 * Couplings: boids (loose migration-wave), physarum-scalarField (staging cluster), audio (bugle event flag), circadian (staging phase 0.50-0.65)
 * Emergent contribution: spring/fall loose-skein crane events with staging sub-phase — flock
 *   decelerates and aggregates toward wetland centroid during circadian 0.50-0.65, then disperses
 *   and resumes migration. Bugle events counted but not audibly synthesised (flag-only).
 *   Season thresholds phase-shifted earlier than v1.25 swan to avoid collision.
 */
(function() {
  var FALL_VX   =  0.60, FALL_VY   =  1.15; // SSW autumn (Platte-bound then dispersal)
  var SPRING_VX = -0.50, SPRING_VY = -1.05; // NNE spring (breeding grounds)
  var SPAWN_INTERVAL_FRAMES = 2100;         // ~35 s between crane events @ 60 fps (offset from swan)
  var BUGLE_MIN_FRAMES      = 1800;         // 30 s
  var BUGLE_RANGE_FRAMES    = 2400;         // +0..40 s
  var STAGING_X_FRAC        = 0.50;
  var STAGING_Y_FRAC        = 0.70;
  var STAGING_PULL          = 0.012;        // per-frame lerp toward centroid during staging
  var JITTER_AMP            = 0.25;         // px/frame loose-skein micro-correction

  nasaState.v1_42 = {
    flock: [], season: 'off', state: 'off', events: 0, bugles: 0,
    active: false, _lastSpawn: -9999, _nextBugle: 9999
  };

  function buildSkein(lx, ly, vx, vy, count) {
    // Leader at idx 0; followers loose echelon ±22° with per-agent jitter seed.
    var flock = [{ x: lx, y: ly, role: 'lead', idx: 0, jit: 0 }];
    var half = (count - 1) >> 1;
    var mag = Math.sqrt(vx*vx + vy*vy) || 1;
    var px = -vy / mag, py = vx / mag;
    for (var k = 1; k <= half; k++) {
      var back = k * 18, spread = k * 13;       // looser than swan (14,10)
      flock.push({ x: lx - vx/mag*back + px*spread, y: ly - vy/mag*back + py*spread, role: 'wR', idx: k,  jit: Math.random()*6.28 });
      flock.push({ x: lx - vx/mag*back - px*spread, y: ly - vy/mag*back - py*spread, role: 'wL', idx: -k, jit: Math.random()*6.28 });
    }
    if (((count - 1) & 1) === 1) {
      var kt = half + 1;
      flock.push({ x: lx - vx/mag*(kt*18), y: ly - vy/mag*(kt*18), role: 'tail', idx: kt, jit: Math.random()*6.28 });
    }
    return flock;
  }

  nasaHooks.push({
    degree: '1.42',
    init: function() {
      nasaState.v1_42.flock.length = 0;
      nasaState.v1_42.events = 0;
      nasaState.v1_42.bugles = 0;
      nasaState.v1_42._nextBugle = BUGLE_MIN_FRAMES + Math.floor(Math.random() * BUGLE_RANGE_FRAMES);
    },
    tick: function(fn) {
      var S = nasaState.v1_42;
      var seas = (typeof season === 'number') ? season : 0;
      // Crane windows phase-shifted earlier than swan (swan: 0.62/0.38; crane: 0.58/0.34).
      S.season = seas > 0.58 ? 'fall' : (seas < 0.34 ? 'spring' : 'off');
      var W = (typeof width  === 'number') ? width  : 960;
      var H = (typeof height === 'number') ? height : 540;

      // Circadian staging sub-phase (0.50..0.65 of day).
      var dayPhase = (typeof sky === 'object' && sky && typeof sky.dayPhase === 'number')
        ? sky.dayPhase
        : ((fn / 3600) % 1);
      var staging = dayPhase >= 0.50 && dayPhase < 0.65;

      // --- spawn gate ---
      if (S.season !== 'off' && S.flock.length === 0 && fn - S._lastSpawn > SPAWN_INTERVAL_FRAMES) {
        S._lastSpawn = fn;
        var count = 18 + Math.floor(Math.random() * 5); // 18..22 visible skein
        if (S.season === 'fall') {
          S.flock = buildSkein(W * 0.10, -24, FALL_VX, FALL_VY, count);
        } else {
          S.flock = buildSkein(W * 0.90, H + 24, SPRING_VX, SPRING_VY, count);
        }
        S.active = true;
      }

      // --- advance + render ---
      if (S.flock.length > 0) {
        var baseVx = (S.season === 'spring') ? SPRING_VX : FALL_VX;
        var baseVy = (S.season === 'spring') ? SPRING_VY : FALL_VY;
        var speedScale = staging ? 0.25 : 1.0;
        S.state = staging ? 'staging' : 'migrating';
        var sx = W * STAGING_X_FRAC, sy = H * STAGING_Y_FRAC;
        var renderable = (typeof fill === 'function' && typeof ellipse === 'function' && typeof noStroke === 'function');
        if (renderable) noStroke();

        var offCanvas = 0;
        for (var i = 0; i < S.flock.length; i++) {
          var a = S.flock[i];
          // Loose-skein jitter (OODA micro-corrections) — additive per-frame noise.
          var jx = Math.cos(a.jit + fn * 0.07) * JITTER_AMP;
          var jy = Math.sin(a.jit + fn * 0.09) * JITTER_AMP;
          a.x += baseVx * speedScale + jx;
          a.y += baseVy * speedScale + jy;
          // Staging pull: lerp all agents toward centroid while staging.
          if (staging) {
            a.x += (sx - a.x) * STAGING_PULL;
            a.y += (sy - a.y) * STAGING_PULL;
          }
          if (renderable) {
            // Tall crane silhouette: body + neck streak; leader gets rust crown.
            fill(138, 142, 148, 230);             // #8A8E94 slate plumage
            ellipse(a.x, a.y, 6, 6);
            fill(108, 112, 118, 200);
            ellipse(a.x - baseVx * 1.4, a.y - baseVy * 1.4, 2, 3); // trailing neck streak
            if (a.role === 'lead') {
              fill(160, 72, 48, 220);             // #A04830 rust crown on leader
              ellipse(a.x + baseVx * 0.8, a.y + baseVy * 0.8, 2, 2);
            }
          }
          if (a.x < -40 || a.x > W + 40 || a.y < -40 || a.y > H + 40) offCanvas++;
        }

        // Bugle gate (flag-only; no audio synthesised from canvas layer).
        if (fn - S._lastSpawn > S._nextBugle) {
          S.bugles += 1;
          S._nextBugle = (fn - S._lastSpawn) + BUGLE_MIN_FRAMES + Math.floor(Math.random() * BUGLE_RANGE_FRAMES);
        }

        if (offCanvas === S.flock.length) {
          S.flock.length = 0;
          S.events += 1;
          S.active = false;
          S.state = 'off';
          S._nextBugle = BUGLE_MIN_FRAMES + Math.floor(Math.random() * BUGLE_RANGE_FRAMES);
        }
      } else {
        S.state = 'off';
      }
    }
  });
})();

// --- DEGREE v1_43 ---
/* ==== DEGREE v1.43 — Gemini 6A + Marbled Murrelet Inland Commute ====
 * Source spec: ../NASA/1.43/forest-module/gemini6a-marbled-murrelet.js
 * Triad: NASA=Gemini 6A (first crewed rendezvous) · S36=(v1.43 pair) · SPS=Marbled Murrelet
 * Couplings: boids (migration-wave), circadian (dawn/dusk event), kuramoto (phase-kick), audio (layer)
 * Emergent contribution: solitary inland commute 1-3 murrelets from v1_13 coast to v1_33
 *   old-growth territory at dawn, silent NEST hold, return at dusk. Publishes inland-flight
 *   events linking coast (v1_13) to old-growth (v1_33).
 */
(function() {
  var SPEED = 2.0;                 // ~100 km/h scaled (Burger 2001)
  var MIN_AGENTS = 1, MAX_AGENTS = 3;
  var INBOUND_MAX_FRAMES = 600;    // ~10 s sim cap to reach nest
  var NEST_FRAMES = 1800;          // ~30 s compressed nest hold
  var OUTBOUND_MAX_FRAMES = 600;
  var KEER_KICK_STRENGTH = 0.08;
  var KEER_KICK_FRAMES = 24;       // ~0.4s at 60fps — Nelson 1997

  nasaState.v1_43 = {
    state: 'OCEAN',
    agents: [],
    inlandFlightEvents: 0,
    lastInlandArrivalFrame: -9999,
    lastReturnFrame: -9999,
    _stateStart: 0,
    _target: null,
    _prevSunAlt: 0
  };

  function pickTerritory() {
    var t = nasaState.v1_33 && nasaState.v1_33.territories;
    if (!t || t.length === 0) return null;
    return t[Math.floor(Math.random() * t.length)];
  }

  function spawnAgents(S, fromX, fromY, toX, toY) {
    S.agents.length = 0;
    var n = MIN_AGENTS + Math.floor(Math.random() * (MAX_AGENTS - MIN_AGENTS + 1));
    var dx = toX - fromX, dy = toY - fromY;
    var len = Math.sqrt(dx*dx + dy*dy) || 1;
    var ux = dx / len, uy = dy / len;
    for (var i = 0; i < n; i++) {
      S.agents.push({
        x: fromX + (Math.random() - 0.5) * 20,
        y: fromY + (Math.random() - 0.5) * 12,
        vx: ux * SPEED, vy: uy * SPEED,
        dir: ux
      });
    }
  }

  nasaHooks.push({
    degree: '1.43',
    init: function() {
      nasaState.v1_43._prevSunAlt = (typeof sky === 'object' && sky) ? (sky.sunAlt || 0) : 0;
    },
    tick: function(fn) {
      var S = nasaState.v1_43;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var coastY = (nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
        ? nasaState.v1_13.shorelineY : H * 0.82;
      var sa = (typeof sky === 'object' && sky) ? (sky.sunAlt || 0) : 0;
      var crossedUp = (S._prevSunAlt <= 0 && sa > 0);     // dawn edge
      var crossedDn = (S._prevSunAlt >= 0 && sa < 0);     // dusk edge
      S._prevSunAlt = sa;

      if (S.state === 'OCEAN' && crossedUp) {
        var tgt = pickTerritory();
        if (tgt) {
          S._target = tgt;
          S.state = 'COMMUTE_INBOUND';
          S._stateStart = fn;
          spawnAgents(S, 0, coastY, tgt.cx, tgt.cy);
        }
      } else if (S.state === 'COMMUTE_INBOUND') {
        var arrived = false;
        for (var i = 0; i < S.agents.length; i++) {
          var a = S.agents[i];
          a.x += a.vx; a.y += a.vy;
          if (S._target) {
            var ddx = S._target.cx - a.x, ddy = S._target.cy - a.y;
            if (ddx*ddx + ddy*ddy < 400) arrived = true;
          }
        }
        if (arrived || (fn - S._stateStart) > INBOUND_MAX_FRAMES) {
          S.state = 'NEST';
          S._stateStart = fn;
          S.inlandFlightEvents += 1;
          S.lastInlandArrivalFrame = fn;
          S.agents.length = 0;                // silent nest — no render
        }
      } else if (S.state === 'NEST') {
        if ((fn - S._stateStart) >= NEST_FRAMES || crossedDn) {
          if (S._target) {
            S.state = 'COMMUTE_OUTBOUND';
            S._stateStart = fn;
            spawnAgents(S, S._target.cx, S._target.cy, 0, coastY);
          } else {
            S.state = 'OCEAN';
          }
        }
      } else if (S.state === 'COMMUTE_OUTBOUND') {
        var done = true;
        for (var j = 0; j < S.agents.length; j++) {
          var b = S.agents[j];
          b.x += b.vx; b.y += b.vy;
          if (b.x > 0 && b.y < H) done = false;
        }
        if (done || (fn - S._stateStart) > OUTBOUND_MAX_FRAMES) {
          S.state = 'OCEAN';
          S.lastReturnFrame = fn;
          S.agents.length = 0;
          S._target = null;
        }
      }

      // keer phase-kick: COMMUTE states only, weak perturbation
      if ((S.state === 'COMMUTE_INBOUND' || S.state === 'COMMUTE_OUTBOUND') &&
          fn % KEER_KICK_FRAMES === 0 &&
          typeof nasaState.v1_33 === 'object' &&
          nasaState.v1_33 && nasaState.v1_33.territories &&
          nasaState.v1_33.territories.length > 0) {
        // kick first territory phase (if present) — documents intent; harmless if field absent
        var tr = nasaState.v1_33.territories[0];
        if (tr && typeof tr.phase === 'number') tr.phase += KEER_KICK_STRENGTH;
      }

      // Render agents during COMMUTE states only (silent during NEST)
      if ((S.state !== 'COMMUTE_INBOUND' && S.state !== 'COMMUTE_OUTBOUND') || S.agents.length === 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      noStroke();
      for (var k = 0; k < S.agents.length; k++) {
        var ag = S.agents[k];
        fill(110, 118, 128, 220);     // #6E7680 slate back
        ellipse(ag.x, ag.y, 6, 3);
        fill(160, 104, 72, 200);      // #A06848 cinnamon breast-mottle
        ellipse(ag.x - ag.dir * 1.5, ag.y + 0.8, 3, 2);
      }
    }
  });
})();

// --- DEGREE v1_44 ---
/* ==== DEGREE v1.44 — Pioneer 6 / Pacific Geoduck Subtidal Siphon Bed ====
 * Source spec: ../NASA/1.44/forest-module/NOT_APPLICABLE.md (retro-wire contribution)
 * Triad: NASA=Pioneer 6 (35-year solar-wind monitor) · S36=(v1.44 pair) · SPS=Pacific Geoduck
 * Couplings: subtidal-bed primitive (reads v1_13.shorelineY + tidePhase), circadian bias via sky.moonAlt
 * Emergent contribution: ten long-lived siphons extend slowly from the seabed just below the shoreline,
 *   modulated faintly by tide; rare "still-alive" ping fires every ~35 s as a thin orange ring — a
 *   35-year telemetry trickle in biological form. Low intensity, long duration. No forward refs.
 */
(function() {
  var SIPHON_COUNT    = 10;
  var SIPHON_MAX_LEN  = 9;      // px at full extension
  var PING_PERIOD     = 2100;   // frames between still-alive pings (~35s @ 60fps)
  var PING_MEMORY     = 120;    // frames the ring is visible (~2s fade)
  var EXTEND_W        = 0.008;  // rad/frame — ~78s sinusoid period
  var BED_OFFSET      = 12;     // px below v1_13.shorelineY

  nasaState.v1_44 = {
    siphons: [],
    bedTop: 0,
    stillAliveFrame: -9999,
    pings: 0,
    yearsElapsed: 0,
    _lastPing: -PING_PERIOD,
    _pingIdx: 0
  };

  nasaHooks.push({
    degree: '1.44',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var s = nasaState.v1_44;
      var shoreY = (nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
        ? nasaState.v1_13.shorelineY : (0.82 * H);
      s.bedTop = shoreY + BED_OFFSET;
      s.siphons = [];
      // Evenly-spaced anchors across 0.12 .. 0.88 W, each with a fixed phase offset.
      for (var i = 0; i < SIPHON_COUNT; i++) {
        var t = i / (SIPHON_COUNT - 1);
        s.siphons.push({
          x: (0.12 + 0.76 * t) * W,
          extend: 0.625,
          phase: (i * 0.61) % (Math.PI * 2)  // quasi-random phase offsets
        });
      }
    },
    tick: function(fn) {
      var s = nasaState.v1_44;

      // Tide amplitude modulation: slight retraction at low tide, extension at high.
      var tide = (nasaState.v1_13 && typeof nasaState.v1_13.tidePhase === 'number')
        ? nasaState.v1_13.tidePhase : ((fn / (60 * 28)) % 1);
      var tideAmp = 0.85 + 0.15 * Math.sin(tide * 2 * Math.PI);  // 0.70..1.00

      // Per-frame extend update — cheap, no allocation.
      for (var i = 0; i < s.siphons.length; i++) {
        var sp = s.siphons[i];
        sp.extend = (0.625 + 0.375 * Math.sin(fn * EXTEND_W + sp.phase)) * tideAmp;
      }

      // Still-alive ping: ~35s period, moon-up shortens by 20% (low-light feeding bias).
      var moonUp = (typeof sky === 'object' && sky && sky.moonAlt > 0);
      var period = moonUp ? Math.floor(PING_PERIOD * 0.8) : PING_PERIOD;
      if (fn - s._lastPing >= period) {
        s._lastPing = fn;
        s.stillAliveFrame = fn;
        s.pings += 1;
        s._pingIdx = (fn * 7) % s.siphons.length;  // deterministic-ish rotation
      }

      // Geoduck-year counter: one sim-year per real hour of sim time.
      s.yearsElapsed = Math.floor(fn / (60 * 60 * 60));

      // Render gated per 60 frames (~1 Hz) — low intensity is the aesthetic.
      if (fn % 60 !== 0) return;
      if (typeof noStroke !== 'function' || typeof stroke !== 'function') return;

      // Siphons: thin cream vertical lines rising from bedTop, tip ellipse.
      stroke(232, 216, 192, 180);  // #E8D8C0 siphon cream
      strokeWeight(1);
      for (var j = 0; j < s.siphons.length; j++) {
        var sj = s.siphons[j];
        var len = sj.extend * SIPHON_MAX_LEN;
        line(sj.x, s.bedTop, sj.x, s.bedTop - len);
        if (typeof noStroke === 'function' && typeof fill === 'function') {
          noStroke();
          fill(232, 216, 192, 200);
          ellipse(sj.x, s.bedTop - len, 2, 1.5);
          stroke(232, 216, 192, 180);
          strokeWeight(1);
        }
      }

      // Still-alive ring: thin orange fade over ~2s at the chosen siphon.
      var since = fn - s.stillAliveFrame;
      if (since >= 0 && since < PING_MEMORY && s.siphons.length > 0
          && typeof noFill === 'function') {
        var a = 1 - since / PING_MEMORY;
        var target = s.siphons[s._pingIdx];
        noFill();
        stroke(212, 134, 42, 200 * a);  // #D4862A Pioneer 6 solar-orange
        strokeWeight(1);
        var r = 6 + (1 - a) * 16;
        ellipse(target.x, s.bedTop - target.extend * SIPHON_MAX_LEN, r, r * 0.6);
      }
    }
  });
})();

// --- DEGREE v1_45 ---
/* ==== DEGREE v1.45 — Gemini 8 Peregrine Aborted Stoop & Recovery ====
 * Source spec: ../NASA/1.45/forest-module/gemini8-peregrine-abort-recovery.js
 * Triad: NASA=Gemini 8 (first docking + first abort) · S36=Tsiolkovsky (v1.45) · SPS=Peregrine Falcon (duology axis 2)
 * Couplings: boids predator-agent (abort drag), kuramoto phase-kick (tumble arrest), audio kak recovery, circadian gates
 * Emergent contribution: second peregrine whose stoop CAN ABORT mid-dive (White 1994 miss rate 0.25) —
 *   complements v1.38 nominal ballistic; reads v1_38.state to refuse overlap; publishes abortEvent.
 */
(function() {
  var SOAR_Y_NORM    = 0.10;   // slightly above v1.38 0.12 to share sky without stacking
  var SOAR_CX_NORM   = 0.42;   // counter-phase horizontal from v1.38's 0.55
  var SOAR_R_NORM    = 0.26;
  var STOOP_VY       = 6.5;    // px/frame, slightly less committed than v1.38's 7.0
  var ABORT_DRAG_VY  = 1.8;    // wing-extension asymmetric drag
  var RECOVERY_VY    = 2.0;
  var SOAR_FRAMES    = 1680;   // 28 s patrol (SOAR_DURATION)
  var STOOP_FRAMES   = 210;    // 3.5 s
  var ABORT_FRAMES   = 66;     // 1.1 s tumble arrest (White 1994 midpoint)
  var RECOVERY_FRAMES = 480;   // 8 s recovery soar
  var MISS_PROB      = 0.25;   // White 1994

  nasaState.v1_45 = {
    falconX: 0, falconY: 0,
    state: 'SOAR',
    abortEvent: null,          // {frame,x,y} on tumble — forward-readable
    abortCount: 0,
    targetX: 0, targetY: 0,
    _angle: Math.PI,           // counter-phase to v1.38
    _stateFrame: 0,
    _prevSunAlt: -90
  };

  nasaHooks.push({
    degree: '1.45',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var s = nasaState.v1_45;
      s.falconX = W * SOAR_CX_NORM;
      s.falconY = H * SOAR_Y_NORM;
      s._stateFrame = 0;
    },
    tick: function(fn) {
      var s = nasaState.v1_45;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      s._stateFrame += 1;

      // Refuse overlap with v1.38's active stoop — once/second gate.
      if (fn % 60 === 0 && s.state === 'SOAR' && s._stateFrame > SOAR_FRAMES * 0.3) {
        var v138State = (nasaState.v1_38 && nasaState.v1_38.state) ? nasaState.v1_38.state : 'SOAR';
        if (v138State !== 'STOOP') {
          var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;
          var atDawn = (s._prevSunAlt < 2 && alt >= 2);
          var atDusk = (s._prevSunAlt > -2 && alt <= -2);
          s._prevSunAlt = alt;
          if (atDawn || atDusk || s._stateFrame > SOAR_FRAMES) {
            var tx = W * 0.42, ty = H * 0.58;
            var sw = (nasaState.v1_22 && nasaState.v1_22.agents) ? nasaState.v1_22.agents : null;
            var jn = (nasaState.v1_24 && nasaState.v1_24.agents) ? nasaState.v1_24.agents : null;
            if (sw && sw.length) { var a = sw[(fn >> 4) % sw.length]; tx = a.x; ty = a.y; }
            else if (jn && jn.length) { var b = jn[(fn >> 4) % jn.length]; tx = b.x; ty = b.y; }
            s.targetX = tx; s.targetY = ty;
            s.state = 'STOOP';
            s._stateFrame = 0;
          }
        }
      }

      // State integration.
      if (s.state === 'SOAR') {
        s._angle += 0.0055;
        s.falconX = W * (SOAR_CX_NORM + SOAR_R_NORM * Math.cos(s._angle));
        s.falconY = H * (SOAR_Y_NORM + SOAR_R_NORM * 0.16 * Math.sin(s._angle));
      } else if (s.state === 'STOOP') {
        s.falconY += STOOP_VY;
        s.falconX += (s.targetX - s.falconX) * 0.10;
        if (s._stateFrame >= STOOP_FRAMES || s.falconY >= s.targetY) {
          if (Math.random() < MISS_PROB) {
            s.abortEvent = { frame: fn, x: s.falconX, y: s.falconY };
            s.abortCount += 1;
            s.state = 'ABORT';
          } else {
            s.state = 'RECOVERY';
          }
          s._stateFrame = 0;
        }
      } else if (s.state === 'ABORT') {
        // Wing-extension asymmetric drag: slight lateral wobble + reduced descent.
        s.falconY += ABORT_DRAG_VY;
        s.falconX += Math.sin(s._stateFrame * 0.42) * 1.1;
        if (s._stateFrame >= ABORT_FRAMES) {
          s.state = 'RECOVERY';
          s._stateFrame = 0;
        }
      } else if (s.state === 'RECOVERY') {
        s.falconY -= RECOVERY_VY;
        if (s.falconY <= H * SOAR_Y_NORM || s._stateFrame >= RECOVERY_FRAMES) {
          s.falconY = H * SOAR_Y_NORM;
          s.state = 'SOAR';
          s._stateFrame = 0;
        }
      }

      // Render: slate silhouette, amber pip during ABORT (inverted from v1.38's STOOP pip).
      if (typeof stroke !== 'function' || typeof line !== 'function') return;
      var tuck = (s.state === 'STOOP') ? 0.28 : (s.state === 'ABORT' ? 1.4 : 1.0);
      var wing = (6.5 + Math.sin(fn * 0.20) * 1.8) * tuck;
      stroke(74, 85, 104, 210);
      strokeWeight(1.25);
      if (typeof noFill === 'function') noFill();
      line(s.falconX, s.falconY - 3, s.falconX, s.falconY + 3);
      line(s.falconX - wing, s.falconY - 1, s.falconX + wing, s.falconY - 1);
      if (s.state === 'ABORT' && typeof fill === 'function') {
        fill(196, 163, 90, 230); // amber pip — Tsiolkovsky palette signature
        if (typeof ellipse === 'function') ellipse(s.falconX, s.falconY - 2, 1.6, 1.6);
      }
    }
  });
})();

// --- DEGREE v1_46 ---
/* ==== DEGREE v1.46 — Surveyor 1 / Oregon White Oak Prairie-Edge Savanna ====
 * Source spec: ../NASA/1.46/forest-module/surveyor1-oregon-white-oak.js
 * Triad: NASA=Surveyor 1 (first US soft lunar landing) · S36=(v1.46 pair) · SPS=Oregon White Oak (Quercus garryana)
 * Couplings: physarum-scalarField (photosynthesis-pulse), audio-layer (crown ambient), lsystem-leaf-density (seasonal)
 * Emergent contribution: inline climax-species oak trio at prairie edge with slow diurnal growth,
 *   seasonal leaf-density ramp (WINTER 0.05 / SUMMER 0.95 / AUTUMN 0.60), and rare autumn acorn-drop
 *   events gated on season > 0.7. Canonical-trio establishment; does NOT mutate PLANT_TYPES.
 */
(function() {
  var OAK_TYPE = {
    name: 'oregon-white-oak',
    barkCol: [107, 80, 48],     // #6B5030 furrowed bark
    leafCol: [94, 118, 62],     // summer canopy green
    autumnCol: [196, 163, 90],  // #C4A35A senescence gold
    acornCol: [138, 94, 48],    // acorn brown
    trunkH: 70,                 // ~70 px trunk
    crownR: 42                  // ~42 px crown radius
  };
  var MIN_DROP_GAP = 180;       // ~3 s between acorn events
  var MAX_DROPS_PER_SEASON = 12;

  nasaState.v1_46 = {
    oaks: [],
    acornDrops: [],             // {x,y,life} — fading ground marks
    dropsThisSeason: 0,
    lastDropFrame: -9999,
    lastSeasonBucket: -1,
    leafDensity: 0.5,           // published for later degrees
    season: 0
  };

  nasaHooks.push({
    degree: '1.46',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      // 3 oaks at prairie-edge positions (NOT in plants[] — avoids seed-random mutation)
      var xs = [W * 0.18, W * 0.52, W * 0.82];
      var yBase = H * 0.62;     // upland slope above forest floor
      for (var i = 0; i < xs.length; i++) {
        nasaState.v1_46.oaks.push({
          x: xs[i],
          y: yBase + (i % 2 === 0 ? -6 : 4),  // slight elevation jitter
          growth: 0.65 + i * 0.12,            // staggered maturity
          age: 0
        });
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_46;
      S.season = (typeof season === 'number') ? season : 0;
      // Slow diurnal growth — climax species, 300-500 yr lifespan compressed
      if (fn % 60 === 0) {
        for (var j = 0; j < S.oaks.length; j++) {
          if (S.oaks[j].growth < 1.0) S.oaks[j].growth += 0.0008;
          S.oaks[j].age += 1;
        }
      }
      // Leaf density by season (lsystem/leaf-density coupling)
      if (S.season < 0.22)      S.leafDensity = 0.05;   // WINTER
      else if (S.season < 0.55) S.leafDensity = 0.45 + (S.season - 0.22) * 1.5;   // SPRING→SUMMER ramp
      else if (S.season < 0.70) S.leafDensity = 0.95;   // SUMMER_FULL
      else                       S.leafDensity = 0.60;   // AUTUMN_SENESCENCE
      // Season-bucket reset for drop counter
      var bucket = Math.floor(S.season * 4);
      if (bucket !== S.lastSeasonBucket) { S.dropsThisSeason = 0; S.lastSeasonBucket = bucket; }
      // Acorn drops — autumn only (Burns & Honkala 1990: 2-8/min under tree)
      if (S.season > 0.7 && S.dropsThisSeason < MAX_DROPS_PER_SEASON &&
          (fn - S.lastDropFrame) > MIN_DROP_GAP && fn % 15 === 0 && Math.random() < 0.08) {
        var oak = S.oaks[Math.floor(Math.random() * S.oaks.length)];
        S.acornDrops.push({
          x: oak.x + (Math.random() - 0.5) * OAK_TYPE.crownR * 1.6,
          y: oak.y + OAK_TYPE.trunkH * 0.3,
          life: 240
        });
        S.dropsThisSeason += 1;
        S.lastDropFrame = fn;
      }
      // Age acorns + cull
      for (var k = S.acornDrops.length - 1; k >= 0; k--) {
        S.acornDrops[k].life -= 1;
        if (S.acornDrops[k].life <= 0) S.acornDrops.splice(k, 1);
      }
      // Render per 30 frames
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      var crownCol = (S.season > 0.7) ? OAK_TYPE.autumnCol : OAK_TYPE.leafCol;
      var canopyA = 90 + S.leafDensity * 150;
      for (var m = 0; m < S.oaks.length; m++) {
        var o = S.oaks[m];
        noStroke();
        fill(OAK_TYPE.barkCol[0], OAK_TYPE.barkCol[1], OAK_TYPE.barkCol[2], 220);
        ellipse(o.x, o.y + OAK_TYPE.trunkH * 0.5, 8 * o.growth, OAK_TYPE.trunkH * o.growth);
        if (S.leafDensity > 0.1) {
          fill(crownCol[0], crownCol[1], crownCol[2], canopyA);
          ellipse(o.x, o.y - OAK_TYPE.crownR * 0.4 * o.growth,
                  OAK_TYPE.crownR * 2 * o.growth, OAK_TYPE.crownR * 1.6 * o.growth);
        }
      }
      // Acorns on ground
      for (var n = 0; n < S.acornDrops.length; n++) {
        var a = S.acornDrops[n];
        fill(OAK_TYPE.acornCol[0], OAK_TYPE.acornCol[1], OAK_TYPE.acornCol[2],
             Math.min(220, a.life));
        ellipse(a.x, a.y, 3, 4);
      }
    }
  });
})();

// --- DEGREE v1_47 ---
/* ==== DEGREE v1.47 — Gemini 9A Angry Alligator Target-Abort ====
 * Source spec: ../NASA/1.47/forest-module/gemini9a-american-alligator.js
 * Triad: NASA=Gemini 9A (ATDA shroud failure) · S36=(v1.47 pair) · SPS=American Alligator (metaphor-only, out-of-region)
 * Couplings: target-abort on v1_38 stoop transition (35% probability); 60° jaw-wedge render; no agent
 * Emergent contribution: probabilistic "angry alligator" cancel on peregrine STOOP — models the
 *   Gemini 9A ATDA failure pattern (target looked reachable, action could not complete). Publishes
 *   abortEvents so later degrees can distinguish clean v1.38 strikes from aborted ones.
 */
(function() {
  var ABORT_PROBABILITY = 0.35;     // 35% of stoops get the angry-alligator treatment
  var JAW_RENDER_FRAMES = 90;       // ~1.5 s wedge visibility per abort
  var JAW_ANGLE_DEG     = 60;       // Stafford's estimate of shroud half-angle

  nasaState.v1_47 = {
    armed: false,
    abortEvents: 0,
    lastAbortFrame: -9999,
    lastCheckedStoopCount: 0,
    jawOpenFrames: 0,
    _jawX: 0, _jawY: 0
  };

  nasaHooks.push({
    degree: '1.47',
    init: function() {
      nasaState.v1_47.lastCheckedStoopCount =
        (nasaState.v1_38 && typeof nasaState.v1_38.stoopCount === 'number')
          ? nasaState.v1_38.stoopCount : 0;
    },
    tick: function(fn) {
      var S = nasaState.v1_47;
      var P = nasaState.v1_38;
      if (!P) return;

      // Arm the abort when v1.38 enters STOOP for the first time this cycle.
      if (P.state === 'STOOP' && !S.armed && P.stoopCount === S.lastCheckedStoopCount) {
        // Roll the die once per STOOP entry.
        var seed = (fn * 9301 + 49297) % 233280;
        var roll = seed / 233280;
        if (roll < ABORT_PROBABILITY) {
          S.armed = true;
          S._jawX = P.falconX;
          S._jawY = P.falconY + 40;     // project wedge onto anticipated target zone
          S.jawOpenFrames = JAW_RENDER_FRAMES;
        } else {
          // Clean stoop — advance the counter without aborting.
          S.lastCheckedStoopCount = P.stoopCount + 1;
        }
      }

      // When v1.38 lands its predatorEvent while armed, register the abort.
      if (S.armed && P.predatorEvent && P.predatorEvent.frame > S.lastAbortFrame) {
        S.abortEvents += 1;
        S.lastAbortFrame = P.predatorEvent.frame;
        S.lastCheckedStoopCount = P.stoopCount;
        S.armed = false;              // disarm; next stoop gets a fresh roll
      }

      // Render the angry-alligator jaw wedge while visible.
      if (S.jawOpenFrames > 0) {
        S.jawOpenFrames -= 1;
        if (fn % 20 === 0 && typeof stroke === 'function' && typeof line === 'function') {
          var half = JAW_ANGLE_DEG * Math.PI / 360;   // half-angle in radians
          var r = 18;
          var ax = S._jawX + r * Math.cos(-Math.PI / 2 - half);
          var ay = S._jawY + r * Math.sin(-Math.PI / 2 - half);
          var bx = S._jawX + r * Math.cos(-Math.PI / 2 + half);
          var by = S._jawY + r * Math.sin(-Math.PI / 2 + half);
          stroke(232, 228, 216, 180); strokeWeight(1.2);
          if (typeof noFill === 'function') noFill();
          line(S._jawX, S._jawY, ax, ay);
          line(S._jawX, S._jawY, bx, by);
          stroke(196, 163, 90, 140);  // ATDA gold trim pip
          if (typeof ellipse === 'function') ellipse(S._jawX, S._jawY, 2, 2);
        }
      }
    }
  });
})();

// --- DEGREE v1_48 ---
/* ==== DEGREE v1.48 — White-crowned Sparrow Dialect Convergence ====
 * Source spec: ../NASA/1.48/forest-module/gemini10-white-crowned-sparrow-convergence.js
 * Triad: NASA=Gemini 10 (dual rendezvous, 1966) · S36=Sera Cahoone · SPS=Z. leucophrys
 * Couplings: boids/colonial-cohort (x2), kuramoto/phase-inject, audio/layer, circadian
 * Emergent contribution: CONVERGENCE extension to v1.32 isolation axis — during winter
 *   (season < 0.2), pulls v1.32 dialectPhase values toward the ring's circular mean with
 *   a stronger-than-intrinsic coupling; resets as spring returns. Gemini 10 dual-rendezvous
 *   metaphor: two trajectories briefly contact, exchange, then separate.
 */
(function() {
  var WINTER_COUPLE   = 0.08;  // per-step winter convergence strength (> v1.32's 0.012)
  var WINTER_CUTOFF   = 0.20;  // season threshold below which convergence is active
  var TWO_PI          = Math.PI * 2;

  nasaState.v1_48 = {
    wintering: false,
    couplingStrength: 0,
    convergenceEvents: 0,
    active: false
  };

  nasaHooks.push({
    degree: '1.48',
    init: function() {
      // No entities — pure state mutator on v1_32.zones[]. Guard confirms v1.32 is present.
      nasaState.v1_48.active = !!(nasaState.v1_32 && nasaState.v1_32.zones);
    },
    tick: function(fn) {
      var S = nasaState.v1_48;
      if (!S.active) return;

      // Gate: once/second, check winter window.
      if (fn % 60 === 0) {
        var seas = (typeof season === 'number') ? season : 0.5;
        S.wintering = seas < WINTER_CUTOFF;
        // Coupling ramps down linearly across the winter cutoff — Sera Cahoone held-rest decay.
        S.couplingStrength = S.wintering ? WINTER_COUPLE * (1 - seas / WINTER_CUTOFF) : 0;
      }
      if (!S.wintering) return;

      // Per-30-second convergence step: pull every v1_32 zone toward the ring circular mean.
      if (fn % 1800 !== 0) return;
      var Z = nasaState.v1_32.zones;
      if (!Z || !Z.length) return;
      var n = Z.length, i, sx = 0, cx = 0;
      for (i = 0; i < n; i++) { sx += Math.sin(Z[i].dialectPhase); cx += Math.cos(Z[i].dialectPhase); }
      var mean = Math.atan2(sx, cx);
      var eps = S.couplingStrength;
      for (i = 0; i < n; i++) {
        var d = mean - Z[i].dialectPhase;
        while (d >  Math.PI) d -= TWO_PI;
        while (d < -Math.PI) d += TWO_PI;
        Z[i].dialectPhase = ((Z[i].dialectPhase + d * eps) % TWO_PI + TWO_PI) % TWO_PI;
        if (nasaState.v1_32.dialectGrid) nasaState.v1_32.dialectGrid[i] = Z[i].dialectPhase;
      }
      S.convergenceEvents += 1;
    }
  });
})();

// --- DEGREE v1_49 ---
/* ==== DEGREE v1.49 — Lunar Orbiter 1 / Common Raven Territorial Patrol & Cache Cognition ====
 * Source spec: ../NASA/1.49/forest-module/lunar-orbiter1-common-raven.js
 * Triad: NASA=Lunar Orbiter 1 (first far-side, Earthrise H-102, 1966) · S36=(v1.49 pair) · SPS=Common Raven
 * Couplings: physarum/scalarField (territorial-patrol-knowledge), boids/predator-agent (soar), audio/event (quork/knock/gurgle), circadian/event
 * Emergent contribution: CANONICAL-TRIO closure. 2 territorial ravens soar a shared circuit;
 *   episodic spatial memory encoded as 6 cache nodes with decay 0.002/s and +0.15-on-visit
 *   reinforcement; scans mycelium pulses (v1_0) as ground-forage signal; diverts to scavenge
 *   peregrine strikes (v1_38); publishes ravenCorvidCache handshake for v1.53 duology second member.
 */
(function() {
  var CENTRE_X       = 0.50, CENTRE_Y = 0.45;   // territory centre (normalised)
  var PATROL_R       = 0.28;                    // soaring radius (fraction of min(W,H))
  var N_CACHES       = 6;
  var CACHE_DECAY    = 0.002;                   // weight lost per second (Heinrich 1988)
  var CACHE_GAIN     = 0.15;                    // weight added on inspection
  var CALL_PERIOD    = 360;                     // ~6 s between quork calls @ 60fps
  var MIN_CACHE_GAP  = 240;                     // ≥4 s between cache inspections
  var SCAVENGE_DWELL = 240;                     // 4 s diverted to peregrine strike
  var BASE_SPEED     = 0.55;                    // radians/sec around ring (soar cadence)
  var TWO_PI         = Math.PI * 2;

  nasaState.v1_49 = {
    ravens: [],
    caches: [],
    state: 'ROOST',
    callEvents: 0,
    cacheVisits: 0,
    lastCallFrame: -9999,
    lastCacheFrame: -9999,
    ravenCorvidCache: { caches: null, meanWeight: 0, lastVisitFrame: -9999 },
    _scavUntil: -1,
    _scavX: 0, _scavY: 0,
    _dawnSeen: false
  };

  nasaHooks.push({
    degree: '1.49',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var cx = CENTRE_X * W, cy = CENTRE_Y * H;
      var rPx = PATROL_R * Math.min(W, H);
      // Two ravens on opposite sides of the ring — pair-bond territorial signature.
      nasaState.v1_49.ravens.push({ x: cx + rPx, y: cy, vx: 0, vy: 0, phase: 0,       state: 'ROOST' });
      nasaState.v1_49.ravens.push({ x: cx - rPx, y: cy, vx: 0, vy: 0, phase: Math.PI, state: 'ROOST' });
      // 6 cache nodes seeded in a rough inner torus around territory centre.
      for (var i = 0; i < N_CACHES; i++) {
        var a = (i / N_CACHES) * TWO_PI + (i * 0.37);
        var r = rPx * (0.35 + (i % 3) * 0.15);
        nasaState.v1_49.caches.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          weight: 0.3 + 0.1 * ((i * 7) % 4)     // seeded non-uniform
        });
      }
      nasaState.v1_49.ravenCorvidCache.caches = nasaState.v1_49.caches;
    },
    tick: function(fn) {
      var S = nasaState.v1_49, R = S.ravens, C = S.caches;
      if (!R.length) return;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var cx = CENTRE_X * W, cy = CENTRE_Y * H;
      var rPx = PATROL_R * Math.min(W, H);
      var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;

      // Once/second FSM gate keyed to sun altitude (dawn/midday/dusk proxy).
      if (fn % 60 === 0) {
        if (S.state === 'ROOST' && alt > 3) {
          S.state = 'PATROL';
          R[0].state = R[1].state = 'PATROL';
        } else if (S.state === 'PATROL' && alt > 45) {
          S.state = 'FORAGE';                   // lower soar, opportunistic
          R[0].state = R[1].state = 'FORAGE';
        } else if (S.state === 'FORAGE' && alt < 35) {
          S.state = 'PATROL';
          R[0].state = R[1].state = 'PATROL';
        } else if (S.state !== 'ROOST' && alt < -2) {
          S.state = 'ROOST';
          R[0].state = R[1].state = 'ROOST';
        }
        // Cache weight decay once/second (CACHE_DECAY per-second scale).
        for (var c = 0; c < C.length; c++) {
          C[c].weight = Math.max(0, C[c].weight - CACHE_DECAY);
        }
        // v1_0 mycelium pulses bump nearby cache weights (ground-forage surfacing).
        if (nasaState.v1_0 && nasaState.v1_0.pulses) {
          var P = nasaState.v1_0.pulses;
          for (var p = 0; p < P.length; p++) {
            for (var q = 0; q < C.length; q++) {
              var dx = P[p].x - C[q].x, dy = P[p].y - C[q].y;
              if (dx * dx + dy * dy < 3600) C[q].weight = Math.min(1, C[q].weight + 0.01);
            }
          }
        }
        // Mean weight published for v1.53 duology second member.
        var mw = 0; for (var m = 0; m < C.length; m++) mw += C[m].weight;
        S.ravenCorvidCache.meanWeight = mw / C.length;
      }

      // Peregrine scavenge pull: v1_38 strike within 80 px diverts both ravens for ~4 s.
      if (nasaState.v1_38 && nasaState.v1_38.predatorEvent) {
        var pe = nasaState.v1_38.predatorEvent;
        if (pe.frame > S._scavUntil - SCAVENGE_DWELL && fn - pe.frame < SCAVENGE_DWELL) {
          S._scavX = pe.x; S._scavY = pe.y; S._scavUntil = pe.frame + SCAVENGE_DWELL;
        }
      }
      var scavenging = S.state !== 'ROOST' && fn < S._scavUntil;

      // Per-frame soaring advance (skip during ROOST — ravens at roost).
      if (S.state === 'ROOST') return;
      var speedRad = BASE_SPEED / 60;                             // radians per frame
      if (S.state === 'FORAGE') speedRad *= 0.7;                  // lower altitude, slower
      for (var i = 0; i < R.length; i++) {
        var rv = R[i];
        rv.phase = (rv.phase + speedRad) % TWO_PI;
        var tx = cx + Math.cos(rv.phase) * rPx;
        var ty = cy + Math.sin(rv.phase) * rPx * 0.6;             // flattened ellipse = thermal soar
        if (scavenging) { tx = S._scavX; ty = S._scavY; }
        rv.vx = (tx - rv.x) * 0.08;
        rv.vy = (ty - rv.y) * 0.08;
        rv.x += rv.vx; rv.y += rv.vy;
      }

      // Quork call + stochastic cache inspection during PATROL.
      if (S.state === 'PATROL' && !scavenging && fn - S.lastCallFrame >= CALL_PERIOD) {
        S.lastCallFrame = fn;
        S.callEvents += 1;
        if (fn - S.lastCacheFrame >= MIN_CACHE_GAP && Math.random() < 0.3) {
          // Pick highest-weight cache and reinforce.
          var best = 0, bw = -1;
          for (var k = 0; k < C.length; k++) if (C[k].weight > bw) { bw = C[k].weight; best = k; }
          C[best].weight = Math.min(1, C[best].weight + CACHE_GAIN);
          S.cacheVisits += 1;
          S.lastCacheFrame = fn;
          S.ravenCorvidCache.lastVisitFrame = fn;
        }
      }

      // Per-30-frame render: 2 NASA-blue raven silhouettes + cache-node ignitions.
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      for (var j = 0; j < R.length; j++) {
        noStroke();
        fill(11, 61, 145, 235);                                    // NASA-blue #0B3D91
        ellipse(R[j].x, R[j].y, 9, 3);                             // low-profile soaring body
        fill(8, 9, 10, 180);
        ellipse(R[j].x + (R[j].vx > 0 ? 3 : -3), R[j].y - 1, 2, 2); // head
      }
      // Cache nodes: lunar-silver ring with gold pulse for freshly-visited / high-weight.
      for (var n = 0; n < C.length; n++) {
        var w = C[n].weight;
        if (w < 0.1) continue;
        if (typeof noFill === 'function' && typeof stroke === 'function') {
          noFill();
          stroke(200, 200, 184, 80 + w * 120);                     // lunar-silver #C8C8B8
          strokeWeight(0.6);
          ellipse(C[n].x, C[n].y, 6 + w * 6, 6 + w * 6);
        }
        if (w > 0.6 && fn - S.lastCacheFrame < 60) {
          noStroke();
          fill(196, 163, 90, 180);                                 // gold #C4A35A ignition
          ellipse(C[n].x, C[n].y, 3, 3);
        }
      }
    }
  });
})();

// --- DEGREE v1_50 ---
/* ==== DEGREE v1.50 — Gemini 11 / Fox Sparrow First-Revolution Orbit Shift ====
 * Source spec: ../NASA/1.50/forest-module/gemini11-first-revolution.js
 * Triad: NASA=Gemini 11 (first-orbit rendezvous, 1,369 km apogee, 1966) · S36=(v1.50 pair) · SPS=Sooty Fox Sparrow
 * Couplings: boids/phase-shift (single-orbit heading bias), audio/impact (docking-latch pulse ring),
 *   circadian/phase-offset (Fox Sparrow pre-dawn double-scratch)
 * Emergent contribution: One-shot apogee traversal with conrad-gold arc + silver latch ring;
 *   pre-dawn double-scratch events excavate sparrow-sooty trenches, preferring v1_0 mycelium surfacings.
 */
(function() {
  var LATCH_FRAME       = 300;        // ~5 s after init — "T+94m" docking-latch analog
  var ARC_DECAY_FRAMES  = 1800;       // ~30 s gold arc fade
  var APOGEE_X_FRAC     = 0.62;       // right of centre — apogee point in frame
  var APOGEE_Y_FRAC     = 0.18;       // high — 1,369 km altitude analog
  var HEADING_BIAS      = 0.18;       // boid phase-shift magnitude (65° ≈ direct-ascent delta)
  var SCRATCH_PERIOD    = 180;        // ≥3 s between double-scratches (MacMillan 1960)
  var DAWN_ALT_LOW      = -6;         // civil twilight onset
  var DAWN_ALT_HIGH     = 3;          // early morning close

  nasaState.v1_50 = {
    revolution: { frame: -1, apogeePhase: 0, headingBias: HEADING_BIAS, fired: false },
    scratchEvents: 0,
    trenches: [],                     // {x, y, r, birth} — persistent excavations
    lastLatchFrame: -9999,
    lastScratchFrame: -9999,
    foxSparrowDawnBias: 0.15          // Weckstein et al. 2002 — dawn phase fraction
  };

  nasaHooks.push({
    degree: '1.50',
    init: function() {
      // No allocations beyond state — trenches grow on first dawn.
    },
    tick: function(fn) {
      var S = nasaState.v1_50;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var ax = APOGEE_X_FRAC * W, ay = APOGEE_Y_FRAC * H;

      // ----- One-shot first-revolution arc (fires exactly once) -----
      if (!S.revolution.fired && fn >= LATCH_FRAME) {
        S.revolution.fired = true;
        S.revolution.frame = fn;
        S.revolution.apogeePhase = (fn % 360) / 360;
        S.lastLatchFrame = fn;
      }

      // Per-second dawn FSM + double-scratch gate
      if (fn % 60 === 0) {
        var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;
        var inDawn = alt > DAWN_ALT_LOW && alt < DAWN_ALT_HIGH;
        if (inDawn && fn - S.lastScratchFrame >= SCRATCH_PERIOD) {
          // Place scratch trench — prefer v1_0 mycelium pulse locations if present.
          var tx, ty;
          if (nasaState.v1_0 && nasaState.v1_0.pulses && nasaState.v1_0.pulses.length) {
            var P = nasaState.v1_0.pulses;
            var p = P[(fn / 60) % P.length | 0];
            tx = p.x + (Math.random() - 0.5) * 40;
            ty = p.y + (Math.random() - 0.5) * 40;
          } else {
            tx = Math.random() * W;
            ty = H * (0.65 + Math.random() * 0.30);  // forest floor
          }
          S.trenches.push({ x: tx, y: ty, r: 6 + Math.random() * 4, birth: fn });
          if (S.trenches.length > 24) S.trenches.shift();  // bounded
          S.scratchEvents += 1;
          S.lastScratchFrame = fn;
        }
      }

      // ----- Render -----
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Conrad-gold apogee arc fade (only while active)
      if (S.revolution.fired) {
        var age = fn - S.revolution.frame;
        if (age < ARC_DECAY_FRAMES) {
          var life = 1 - age / ARC_DECAY_FRAMES;
          if (typeof noFill === 'function' && typeof stroke === 'function') {
            noFill();
            stroke(212, 168, 67, 180 * life);       // conrad-gold #D4A843
            strokeWeight(1.2);
            // Simplified arc: quarter ellipse up-and-over toward apogee
            ellipse(ax, ay, 180 * life + 60, 60 * life + 20);
          }
          // Latch pulse ring — first ~40 frames only
          if (age < 40) {
            var ringR = age * 1.5;
            noFill();
            stroke(176, 192, 208, 220 - age * 5);    // tether-silver #B0C0D0
            strokeWeight(0.8);
            ellipse(ax, ay, ringR, ringR);
          }
          // Altitude-blue trail descending from apogee
          noStroke();
          fill(26, 74, 124, 140 * life);            // altitude-blue #1A4A7C
          ellipse(ax, ay + age * 0.08, 3, 3);
        }
      }

      // Sparrow-sooty trenches (double-scratch excavations)
      if (fn % 6 === 0) {
        for (var i = 0; i < S.trenches.length; i++) {
          var t = S.trenches[i];
          var tAge = fn - t.birth;
          if (tAge > 9000) continue;                // ~2.5 min persistence
          var tLife = 1 - tAge / 9000;
          noStroke();
          fill(58, 42, 26, 140 * tLife);            // sparrow-sooty #3A2A1A
          ellipse(t.x, t.y, t.r, t.r * 0.5);
        }
      }
    }
  });
})();

// --- DEGREE v1_51 ---
/* ==== DEGREE v1.51 — Surveyor 2 Midcourse Tumble & Mountain Chickadee Dee-Alarm ====
 * Source spec: ../NASA/1.51/forest-module/surveyor2-tumble-decay.js
 * Triad: NASA=Surveyor 2 (vernier-3 valve failure, Sep 1966) · S36=Mirah · SPS=Mountain Chickadee
 * Couplings: kuramoto/drift-field (single-agent asymmetric-thrust bias), audio/drone (dee-note cadence envelope)
 * Emergent contribution: one vehicle acquires uncorrectable angular drift (the tumble); one seed
 *   stalls mid-germination (the aborted ignition); dee-note alarm envelope pulses once/second.
 *   Publishes failureMode token for v1.59 Surveyor 4 handshake (§6.4 FAILURE-MODE declination).
 */
(function() {
  var TUMBLE_DRIFT       = 0.22;   // per-frame angular bias (radians/60 ≈ 0.22 rad/s)
  var DEE_HIGH_RISK      = 8;      // dee-note count at peak urgency (Templeton & Greene 2007)
  var DEE_PERIOD_FRAMES  = 180;    // 3 s chickadee alarm cycle
  var DEE_ACTIVE_FRAC    = 0.40;   // pulses confined to first 40% of period

  nasaState.v1_51 = {
    tumbleVehicleIdx: -1,
    tumbleRotation: 0,             // accumulated rotation (radians)
    tumbleOmega: TUMBLE_DRIFT / 60, // per-frame angular increment
    abortedSeed: null,             // {x, y} of the stalled seed, or null
    deePhase: 0,                   // 0..1 envelope within each DEE_PERIOD
    deeEvents: 0,
    failureMode: { kind: 'vernier-valve', degree: '1.51', frame: 0 }
  };

  nasaHooks.push({
    degree: '1.51',
    init: function() {
      var S = nasaState.v1_51;
      S.failureMode.frame = (typeof frameNum === 'number') ? frameNum : 0;
      // Pick the vehicle closest to canvas centre as the tumbler.
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var cx = W * 0.5, cy = H * 0.5;
      var best = -1, bestD = Infinity;
      if (typeof vehicles !== 'undefined' && vehicles.length) {
        for (var i = 0; i < vehicles.length; i++) {
          var v = vehicles[i];
          if (!v || !v.position) continue;
          var dx = v.position.x - cx, dy = v.position.y - cy;
          var d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
      }
      S.tumbleVehicleIdx = best;
      // Flag one seed as aborted (stalled ignition) — record position but don't mutate.
      if (typeof seeds !== 'undefined' && seeds.length > 0) {
        var s0 = seeds[0];
        if (s0 && typeof s0.x === 'number' && typeof s0.y === 'number') {
          S.abortedSeed = { x: s0.x, y: s0.y };
        }
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_51;

      // Per-frame tumble: apply angular drift to the selected vehicle's velocity.
      if (S.tumbleVehicleIdx >= 0 && typeof vehicles !== 'undefined' &&
          S.tumbleVehicleIdx < vehicles.length) {
        var v = vehicles[S.tumbleVehicleIdx];
        if (v && v.velocity) {
          var c = Math.cos(S.tumbleOmega), s = Math.sin(S.tumbleOmega);
          var vx = v.velocity.x * c - v.velocity.y * s;
          var vy = v.velocity.x * s + v.velocity.y * c;
          v.velocity.x = vx; v.velocity.y = vy;
          S.tumbleRotation += S.tumbleOmega;
        }
      }

      // Per-second dee-note alarm envelope (pulses in first 40% of period, silence after).
      if (fn % 60 === 0) {
        var phase = (fn % DEE_PERIOD_FRAMES) / DEE_PERIOD_FRAMES;
        if (phase < DEE_ACTIVE_FRAC) {
          var sub = Math.sin(2 * Math.PI * DEE_HIGH_RISK * phase / DEE_ACTIVE_FRAC);
          S.deePhase = sub * 0.5 + 0.5;
          if (S.deePhase > 0.7) S.deeEvents += 1;
        } else {
          S.deePhase = 0;
        }
      }

      // Per-30-frame render: red wobble trail on tumbler + shroud-grey abort glyph + dee pip.
      if (fn % 30 !== 0) return;
      if (S.tumbleVehicleIdx >= 0 && typeof vehicles !== 'undefined' &&
          S.tumbleVehicleIdx < vehicles.length) {
        var vv = vehicles[S.tumbleVehicleIdx];
        if (vv && vv.position && typeof noStroke === 'function' && typeof fill === 'function') {
          noStroke();
          fill(252, 61, 33, 120);                          // failed-red #FC3D21
          ellipse(vv.position.x, vv.position.y, 4, 4);
        }
      }
      if (S.abortedSeed && typeof stroke === 'function' && typeof line === 'function') {
        stroke(200, 200, 184, 160); strokeWeight(0.8);
        var a = S.abortedSeed;
        line(a.x - 3, a.y, a.x + 3, a.y);                  // shroud-grey stall bar
        line(a.x, a.y - 2, a.x, a.y + 2);
      }
      if (S.deePhase > 0.5 && typeof noStroke === 'function' && typeof fill === 'function') {
        noStroke();
        fill(90, 96, 64, 120 * S.deePhase);                // chickadee-olive #5A6040
        ellipse(12, 12, 3, 3);                             // corner pip — alarm indicator
      }
    }
  });
})();

// --- DEGREE v1_52 ---
/* ==== DEGREE v1.52 — Lunar Orbiter 2 / Northern Spotted Owl Oblique Scan ====
 * Source spec: ../NASA/1.52/forest-module/lo2-oblique-scan.js
 * Triad: NASA=Lunar Orbiter 2 (frame 162 Copernicus oblique, Nov 1966) · S36=The Daily Flash · SPS=Strix occidentalis caurina
 * Couplings: lsystem/canopy-hue (shift 0.06), physarum/scalarField (radius 0.22, strength 0.35)
 * Emergent contribution: periodic oblique orbital pass (pitch 0→30°→0 over ~12 s, every ~60 s)
 *   over v1.33 Spotted Owl territories; publishes scalarField overlays + canopy-hue shift state;
 *   one-shot frame162 flag at peak pitch = duology-axis oblique-precision-scanning signature.
 */
(function() {
  var SWEEP_DEG      = 30;     // ORBITAL_SWEEP_DEGREES from source
  var HUE_SHIFT_MAX  = 0.06;   // CANOPY_HUE_SHIFT from source
  var FIELD_RADIUS   = 0.22;   // OWL_TERRITORY_FIELD_RADIUS
  var FIELD_STRENGTH = 0.35;   // OWL_TERRITORY_STRENGTH
  var PASS_PERIOD    = 3600;   // ~60 s between passes @ 60fps
  var PASS_DURATION  = 720;    // ~12 s active pass window
  var FRAME_162_AT   = 0.5;    // passPhase where peak pitch fires

  nasaState.v1_52 = {
    scanFrame: 0, passActive: false, passPhase: 0, pitchDeg: 0,
    hueShift: 0, fields: [], passCount: 0, frame162: -9999, _passStart: -9999
  };

  function seedFields() {
    var S = nasaState.v1_52;
    S.fields.length = 0;
    var T = (nasaState.v1_33 && nasaState.v1_33.territories) || null;
    if (!T || !T.length) return;
    var W = (typeof width === 'number' && width > 0) ? width : 960;
    var H = (typeof height === 'number' && height > 0) ? height : 540;
    var rPx = FIELD_RADIUS * Math.min(W, H);
    for (var i = 0; i < T.length; i++) {
      var t = T[i], ogs = (t.oldGrowthScore !== undefined) ? t.oldGrowthScore : 0.5;
      S.fields.push({ x: t.cx, y: t.cy, r: rPx, strength: FIELD_STRENGTH * (0.6 + 0.4 * ogs) });
    }
  }

  nasaHooks.push({
    degree: '1.52',
    init: function() { seedFields(); },
    tick: function(fn) {
      var S = nasaState.v1_52;
      // Per-second: re-seed fields if v1.33 changed; launch a new pass on cadence.
      if (fn % 60 === 0) {
        var T = (nasaState.v1_33 && nasaState.v1_33.territories) || null;
        if (T && T.length !== S.fields.length) seedFields();
        if (!S.passActive && fn - S._passStart >= PASS_PERIOD) {
          S.passActive = true; S._passStart = fn; S.passCount += 1;
        }
      }
      if (!S.passActive) { S.pitchDeg = 0; S.hueShift = 0; S.passPhase = 0; return; }
      // Advance pass phase 0..1 over PASS_DURATION; pitch ramps up and back down.
      var elapsed = fn - S._passStart;
      if (elapsed >= PASS_DURATION) {
        S.passActive = false; S.pitchDeg = 0; S.hueShift = 0; S.passPhase = 0; return;
      }
      S.passPhase = elapsed / PASS_DURATION;
      var envelope = Math.sin(S.passPhase * Math.PI);            // 0→1→0
      S.pitchDeg   = SWEEP_DEG * envelope;
      S.hueShift   = HUE_SHIFT_MAX * envelope;
      S.scanFrame  = fn;
      // Frame 162: one-shot iconic-oblique marker at peak pitch.
      if (S.frame162 < S._passStart && S.passPhase >= FRAME_162_AT) S.frame162 = fn;

      // Render the oblique scan line and territory scalar-field rings only during pass.
      if (typeof stroke !== 'function' || typeof line !== 'function') return;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      // Oblique sweep line: diagonal traversal whose slope encodes pitchDeg.
      var sweepX = S.passPhase * W;
      var slope  = Math.tan((S.pitchDeg * Math.PI) / 180);        // 0..~0.577 over pass
      var y0     = H * 0.25 + slope * 60;
      var y1     = H * 0.75 - slope * 60;
      stroke(184, 115, 51, 70 + envelope * 110);                  // LO-copper #B87333
      strokeWeight(0.8 + envelope * 1.2);
      line(sweepX, y0, sweepX + 40, y1);                          // oblique scan streak
      // ScalarField rings over v1.33 territories — regolith warm-gray.
      if (typeof noFill !== 'function' || typeof ellipse !== 'function') return;
      noFill();
      for (var i = 0; i < S.fields.length; i++) {
        var f = S.fields[i];
        stroke(190, 192, 195, 40 + f.strength * 80 * envelope);   // lunar-silver #BEC0C3
        strokeWeight(0.6);
        ellipse(f.x, f.y, f.r * 2, f.r * 2);
        if (S.passPhase >= FRAME_162_AT && S.passPhase < FRAME_162_AT + 0.08) {
          stroke(196, 163, 90, 200);                              // gold ignition at frame 162
          strokeWeight(1.2);
          ellipse(f.x, f.y, f.r * 0.6, f.r * 0.6);
        }
      }
    }
  });
})();

// --- DEGREE v1_53 ---
/* ==== DEGREE v1.53 — Gemini 12 / Steller's Jay Cache Pilferage & Hawk-Mimicry Flush ====
 * Source spec: ../NASA/1.53/forest-module/gemini12-corvid-cache.js
 * Triad: NASA=Gemini 12 (EVA mastery, program close, 1966) · S36=Fleet Foxes · SPS=Steller's Jay
 * Couplings: physarum/scalarField (cache seeds), audio/layer (rattle+mimicry), boids/attractor (competitor pressure)
 * Emergent contribution: CORVID-CACHE DUOLOGY second member. 3 jays on a tight nest-ring pilfer
 *   from v1_49 raven caches (Clayton & Emery re-cache theory), emit Red-tailed Hawk mimicry flush
 *   calls (Bolen 2000), and seed jay-specific caches at half-radius of raven circuit.
 */
(function() {
  var JAY_CX = 0.50, JAY_CY = 0.52;
  var JAY_R = 0.18;               // tighter than raven 0.28 — closer to nests
  var N_JAYS = 3;
  var N_JAY_CACHES = 8;
  var JAY_DECAY = 0.003;          // slightly faster than raven (perishable acorns)
  var RATTLE_PERIOD = 360;        // ~6s shack-shack-shack
  var MIMIC_PERIOD = 1080;        // ~18s hawk mimicry burst
  var PILFER_PERIOD = 240;        // min 4s between pilfer attempts
  var PILFER_RADIUS_SQ = 6400;    // 80px: jay must be within range of raven cache
  var TWO_PI = Math.PI * 2;

  nasaState.v1_53 = {
    jays: [], jayCaches: [],
    rattleEvents: 0, mimicryEvents: 0, pilferEvents: 0,
    lastRattleFrame: -9999, lastMimicFrame: -9999, lastPilferFrame: -9999,
    jayCorvidCache: { caches: null, meanWeight: 0, lastPilferFrame: -9999 }
  };

  nasaHooks.push({
    degree: '1.53',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var cx = JAY_CX * W, cy = JAY_CY * H;
      var rPx = JAY_R * Math.min(W, H);
      for (var i = 0; i < N_JAYS; i++) {
        var ph = (i / N_JAYS) * TWO_PI;   // 120° spacing (harmony stack)
        nasaState.v1_53.jays.push({ x: cx + Math.cos(ph) * rPx, y: cy + Math.sin(ph) * rPx, phase: ph, state: 'ROOST' });
      }
      // 8 jay caches seeded in a golden-angle torus per source file.
      for (var c = 0; c < N_JAY_CACHES; c++) {
        var a = c * 2.399963;
        var r = rPx * (0.45 + 0.25 * (c / N_JAY_CACHES));
        nasaState.v1_53.jayCaches.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, weight: 0.25 });
      }
      nasaState.v1_53.jayCorvidCache.caches = nasaState.v1_53.jayCaches;
    },
    tick: function(fn) {
      var S = nasaState.v1_53, J = S.jays, JC = S.jayCaches;
      if (!J.length) return;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var cx = JAY_CX * W, cy = JAY_CY * H, rPx = JAY_R * Math.min(W, H);
      var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;

      // Once/sec FSM + decay; jays are more active than ravens (lower dawn threshold).
      if (fn % 60 === 0) {
        var target = (alt > 1) ? 'PATROL' : 'ROOST';
        for (var t = 0; t < J.length; t++) J[t].state = target;
        for (var d = 0; d < JC.length; d++) JC[d].weight = Math.max(0, JC[d].weight - JAY_DECAY);
        var mw = 0; for (var m = 0; m < JC.length; m++) mw += JC[m].weight;
        S.jayCorvidCache.meanWeight = mw / JC.length;
      }

      if (J[0].state === 'ROOST') return;

      // Per-frame jittery arc (noisier than raven soar).
      var speedRad = 0.9 / 60;
      for (var i = 0; i < J.length; i++) {
        var jy = J[i];
        jy.phase = (jy.phase + speedRad + (Math.random() - 0.5) * 0.02) % TWO_PI;
        var tx = cx + Math.cos(jy.phase) * rPx;
        var ty = cy + Math.sin(jy.phase) * rPx * 0.75;
        jy.x += (tx - jy.x) * 0.12; jy.y += (ty - jy.y) * 0.12;
      }

      // Rattle every 6s during PATROL.
      if (fn - S.lastRattleFrame >= RATTLE_PERIOD) { S.lastRattleFrame = fn; S.rattleEvents += 1; }

      // Hawk-mimicry flush every 18s (Bolen 2000 stolen-authority).
      if (fn - S.lastMimicFrame >= MIMIC_PERIOD) { S.lastMimicFrame = fn; S.mimicryEvents += 1; }

      // Pilferage from v1.49 raven caches (Clayton & Emery theory-of-mind re-cache).
      if (nasaState.v1_49 && nasaState.v1_49.state !== 'ROOST' && nasaState.v1_49.ravenCorvidCache &&
          nasaState.v1_49.ravenCorvidCache.caches && fn - S.lastPilferFrame >= PILFER_PERIOD) {
        var RC = nasaState.v1_49.ravenCorvidCache.caches;
        for (var p = 0; p < RC.length; p++) {
          if (RC[p].weight < 0.3) continue;
          for (var j = 0; j < J.length; j++) {
            var ddx = RC[p].x - J[j].x, ddy = RC[p].y - J[j].y;
            if (ddx * ddx + ddy * ddy < PILFER_RADIUS_SQ) {
              var stolen = RC[p].weight * 0.5;
              RC[p].weight -= stolen;
              var target = JC[S.pilferEvents % JC.length];
              target.weight = Math.min(1, target.weight + stolen);
              S.pilferEvents += 1; S.lastPilferFrame = fn;
              S.jayCorvidCache.lastPilferFrame = fn;
              p = RC.length; break;
            }
          }
        }
      }

      // Per-30-frame render: jay-blue silhouettes + crest-black heads + cache rings.
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      for (var k = 0; k < J.length; k++) {
        noStroke(); fill(42, 90, 154, 230);                  // jay-blue #2A5A9A
        ellipse(J[k].x, J[k].y, 7, 3);
        fill(26, 26, 36, 210);                                // crest-black #1A1A24
        ellipse(J[k].x + 3, J[k].y - 1, 2.5, 2.5);
      }
      for (var n = 0; n < JC.length; n++) {
        var w = JC[n].weight; if (w < 0.1) continue;
        if (typeof noFill === 'function' && typeof stroke === 'function') {
          noFill(); stroke(139, 107, 74, 60 + w * 140);       // folk-warm #8B6B4A
          strokeWeight(0.6); ellipse(JC[n].x, JC[n].y, 5 + w * 5, 5 + w * 5);
        }
        if (w > 0.7 && fn - S.lastPilferFrame < 90) {
          noStroke(); fill(196, 163, 90, 200);                // gold pilfer flash
          ellipse(JC[n].x, JC[n].y, 2.5, 2.5);
        }
      }
    }
  });
})();

// --- DEGREE v1_54 ---
/* ==== DEGREE v1.54 — Apollo 1 (AS-204) / Common Raven Witness — In Memoriam ====
 * Source spec: ../NASA/1.54/forest-module/apollo1-raven-witness.js
 * Triad: NASA=Apollo 1 (pad fire, Jan 27 1967) · S36=Damien Jurado · SPS=Common Raven
 * Couplings: circadian phase-offset (crepuscular), audio drone (-42 dB), lsystem leaf-density reduction
 * Emergent contribution: DISASTER MISSION — §6.5 solemn treatment. A ceremonial stilling of v1.49's
 *   ravens over a 17-second window representing the 18:31:04 → 18:31:19 EST fire-to-rupture interval.
 *   Muted candle-gold halo at each stilled raven. No new agents. No flashy motion. Grief as substrate.
 */
(function() {
  var MEMORIAL_START  = 1860;   // ~31 s from init — ceremonial offset, not real-time
  var MEMORIAL_LENGTH = 1020;   // 17 s @ 60fps = fire-call to cabin-rupture interval
  var MEMORIAL_END    = MEMORIAL_START + MEMORIAL_LENGTH;

  nasaState.v1_54 = {
    memorial: { active: false, frameStart: MEMORIAL_START, frameEnd: MEMORIAL_END },
    stillFrames: 0
  };

  nasaHooks.push({
    degree: '1.54',
    init: function() {
      // No entities to spawn. The raven is already here (v1_49). We only witness.
    },
    tick: function(fn) {
      var S = nasaState.v1_54;
      var inWindow = (fn >= MEMORIAL_START && fn < MEMORIAL_END);
      S.memorial.active = inWindow;
      if (!inWindow) return;
      S.stillFrames += 1;

      // Still v1.49's ravens for the duration — they pause and bear witness.
      var R = (nasaState.v1_49 && nasaState.v1_49.ravens) ? nasaState.v1_49.ravens : null;
      if (R && R.length) {
        for (var i = 0; i < R.length; i++) {
          R[i].vx = 0; R[i].vy = 0;
          // Hold phase — prevents v1.49's per-frame advance from moving them this frame.
          if (typeof R[i].phase === 'number') R[i].phase = R[i].phase;
        }
      }

      // Once/second: a muted candle-gold halo at each stilled raven. No sound. No motion.
      if (fn % 60 !== 0) return;
      if (!R || !R.length) return;
      if (typeof noFill !== 'function' || typeof stroke !== 'function') return;
      for (var j = 0; j < R.length; j++) {
        noFill();
        stroke(212, 160, 23, 60);   // candle-gold #D4A017, very low alpha
        strokeWeight(0.5);
        ellipse(R[j].x, R[j].y, 14, 14);
      }
    }
  });
})();

// --- DEGREE v1_55 ---
/* ==== DEGREE v1.55 — Lunar Orbiter 3 / Varied Thrush Territory Return (Triology Close) ====
 * Source spec: ../NASA/1.55/forest-module/lo3-thrush-territory-return.js
 * Triad: NASA=Lunar Orbiter 3 (L+9d from Apollo 1 fire) · S36=The Sonics · SPS=Varied Thrush
 * Couplings: audio/layer, physarum/scalarField (territory), kuramoto/phase-reference (octave clock)
 * Emergent contribution: Triology close (v1.1+v1.3+v1.55, axis=persistence-through-repetition).
 *   1-2 thrushes with fixed territory; depart in winter, return in spring;
 *   anchor to v1.3 cedar hub if present, else v1.1 canopy-shadow column.
 */
(function() {
  var WHISTLE_PERIOD = 330;               // ~5.5 s @ 60fps (Brenowitz & Kroodsma 1996)
  var SEASON_RETURN  = 0.35;              // spring crossover
  var SEASON_DEPART  = 0.22;              // late fall crossover
  var TERRITORY_R    = 0.08;              // radius fraction of min(W,H)

  nasaState.v1_55 = {
    thrushes: [], octavePhase: 0,
    whistleEvents: 0, returnEvents: 0, lastWhistleFrame: -9999,
    triologyAxis: 'persistence-through-repetition'
  };

  nasaHooks.push({
    degree: '1.55',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var count = (W > 1100) ? 2 : 1;
      for (var i = 0; i < count; i++) {
        var ax = W * (0.32 + i * 0.36), ay = H * 0.55;
        if (nasaState.v1_3 && nasaState.v1_3.getNearestHub) {
          var h = nasaState.v1_3.getNearestHub(ax, ay);
          if (h) { ax = h.x; ay = h.y; }
        } else if (nasaState.v1_1 && nasaState.v1_1.canopyShadow) {
          var best = ax, bestS = -1;
          for (var k = 0; k < 12; k++) {
            var cx = W * (0.15 + k * 0.06);
            var s = nasaState.v1_1.canopyShadow(cx);
            if (s > bestS) { bestS = s; best = cx; }
          }
          ax = best;
        }
        nasaState.v1_55.thrushes.push({
          anchorX: ax, anchorY: ay, x: ax, y: ay,
          onTerritory: false, state: 'ABSENT'
        });
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_55, T = S.thrushes;
      if (!T.length) return;
      S.octavePhase = (fn / 330) % 1;                             // kuramoto clock

      if (fn % 60 === 0) {
        var seas = (typeof season === 'number') ? season : 0.5;
        var alt  = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;
        for (var i = 0; i < T.length; i++) {
          var th = T[i];
          if (!th.onTerritory && seas > SEASON_RETURN && alt > -4) {
            th.onTerritory = true; th.state = 'PRESENT';
            th.x = th.anchorX; th.y = th.anchorY;
            S.returnEvents += 1;                                  // cartographic closure
          } else if (th.onTerritory && seas < SEASON_DEPART) {
            th.onTerritory = false; th.state = 'ABSENT';
          }
        }
      }

      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var rPx = TERRITORY_R * Math.min(W, H);
      var damp = 1.0;
      if (nasaState.v1_1 && nasaState.v1_1.getRadiationDose) {
        damp = 1 - Math.min(0.6, 2 * nasaState.v1_1.getRadiationDose(T[0].x, T[0].y));
      }
      for (var j = 0; j < T.length; j++) {
        var t = T[j]; if (!t.onTerritory) continue;
        t.x += (t.anchorX - t.x) * 0.02 + (Math.random() - 0.5) * 0.8 * damp;
        t.y += (t.anchorY - t.y) * 0.02 + (Math.random() - 0.5) * 0.5 * damp;
        var ddx = t.x - t.anchorX, ddy = t.y - t.anchorY, d2 = ddx*ddx + ddy*ddy;
        if (d2 > rPx * rPx) {
          var d = Math.sqrt(d2);
          t.x = t.anchorX + ddx / d * rPx;
          t.y = t.anchorY + ddy / d * rPx;
        }
      }

      if (fn - S.lastWhistleFrame >= WHISTLE_PERIOD) {
        S.lastWhistleFrame = fn;
        for (var m = 0; m < T.length; m++) {
          if (T[m].onTerritory) {
            S.whistleEvents += 1;
            if (typeof pheromones !== 'undefined' && pheromones && pheromones.push) {
              pheromones.push({ x: T[m].x, y: T[m].y, strength: 0.35, age: 0 });
            }
          }
        }
      }

      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;
      for (var r = 0; r < T.length; r++) {
        var tr = T[r];
        if (typeof noFill === 'function' && typeof stroke === 'function') {
          noFill();
          stroke(196, 122, 58, tr.onTerritory ? 60 : 20);
          strokeWeight(0.5);
          ellipse(tr.anchorX, tr.anchorY, rPx * 2, rPx * 1.4);
        }
        if (tr.onTerritory) {
          noStroke();
          fill(26, 26, 36, 220); ellipse(tr.x, tr.y, 4, 3);
          fill(196, 122, 58, 240); ellipse(tr.x, tr.y - 1, 2.5, 1.5);
          if (fn - S.lastWhistleFrame < 10) {
            fill(212, 160, 23, 180); ellipse(tr.x + 3, tr.y - 2, 2, 2);
          }
        }
      }
    }
  });
})();

// --- DEGREE v1_56 ---
/* ==== DEGREE v1.56 — Surveyor 3 / Red-breasted Sapsucker Triple-Bounce + Sap-Well Row ====
 * Source spec: ../NASA/1.56/forest-module/surveyor3-triple-bounce.js
 * Triad: NASA=Surveyor 3 (triple-bounce Apr 1967) · S36=Ivan & Alyosha · SPS=Red-breasted Sapsucker
 * Couplings: kuramoto/phase-burst×3, physarum/scalarField sap-wells×6, audio/layer + 3 impacts
 * Emergent contribution: acorn drops from v1.46 middle oak are hijacked into 3-bounce ballistic
 *   trajectories (decelerating intervals 28/18/10 frames) with bounce-amber flashes; a sapsucker
 *   drills a horizontal row of 6 sap-wells on the middle oak trunk — keystone infrastructure.
 */
(function() {
  var BOUNCE_INTERVALS = [28, 18, 10];           // decelerating bounce gaps (frames)
  var BOUNCE_HEIGHTS   = [14, 9, 4];             // bounce amplitudes (px)
  var N_WELLS          = 6;
  var WELL_SPACING_PX  = 6;                      // Theimer & Gowdy 2003 scaled
  var DRILL_PERIOD     = 1080;                   // ~18 s per well
  var OAK_IDX          = 1;                      // middle oak of v1.46 trio

  nasaState.v1_56 = {
    bouncers: [],                                // {x,y0,y,t,stage,life}
    sapWells: [],                                // {x,y,age}
    wellVisits: 0,
    lastWellFrame: -9999,
    sapsuckerXY: null,
    bounceEvents: 0,
    _lastAcornCount: 0
  };

  nasaHooks.push({
    degree: '1.56',
    init: function() {
      // Sapsucker placeholder — anchored to v1.46 middle oak in tick().
      nasaState.v1_56.sapsuckerXY = { x: 0, y: 0 };
    },
    tick: function(fn) {
      var S = nasaState.v1_56;
      if (!(nasaState.v1_46 && nasaState.v1_46.oaks && nasaState.v1_46.oaks.length > OAK_IDX)) return;
      var oak = nasaState.v1_46.oaks[OAK_IDX];
      var trunkTopY = oak.y - 20;                // sap-well row just above ground on trunk

      // --- Acorn-drop hijack: whenever v1.46 spawns a new acorn, launch a bouncer ---
      var drops = nasaState.v1_46.acornDrops || [];
      if (drops.length > S._lastAcornCount) {
        var newest = drops[drops.length - 1];
        // Only hijack drops near the middle oak (within crown reach).
        if (Math.abs(newest.x - oak.x) < 50) {
          S.bouncers.push({
            x: newest.x,
            y0: newest.y - 35,                   // launch point above ground mark
            y: newest.y - 35,
            yRest: newest.y,
            t: 0,
            stage: 0,
            life: 90
          });
          S.bounceEvents += 1;
        }
      }
      S._lastAcornCount = drops.length;

      // --- Per-frame bouncer physics ---
      for (var b = S.bouncers.length - 1; b >= 0; b--) {
        var bc = S.bouncers[b];
        bc.t += 1; bc.life -= 1;
        if (bc.stage < 3) {
          var gap = BOUNCE_INTERVALS[bc.stage];
          var h = BOUNCE_HEIGHTS[bc.stage];
          var phase = bc.t / gap;                // 0..1 over this bounce arc
          // Parabolic arc: peaks at phase=0.5
          bc.y = bc.yRest - h * 4 * phase * (1 - phase);
          if (bc.t >= gap) { bc.t = 0; bc.stage += 1; }
        } else {
          bc.y = bc.yRest;                       // settled
        }
        if (bc.life <= 0) S.bouncers.splice(b, 1);
      }

      // --- Sapsucker drilling: one new well every DRILL_PERIOD until row complete ---
      if (S.sapWells.length < N_WELLS && (fn - S.lastWellFrame) > DRILL_PERIOD) {
        var idx = S.sapWells.length;
        S.sapWells.push({
          x: oak.x - (N_WELLS / 2 * WELL_SPACING_PX) + idx * WELL_SPACING_PX,
          y: trunkTopY,
          age: 0
        });
        S.wellVisits += 1;
        S.lastWellFrame = fn;
      }
      // Sapsucker position orbits slowly around trunk top (visible agent)
      S.sapsuckerXY.x = oak.x + Math.cos(fn * 0.02) * 10;
      S.sapsuckerXY.y = trunkTopY + Math.sin(fn * 0.02) * 4;

      // --- Render per 15 frames (bouncers need responsive draw; wells are static) ---
      if (fn % 15 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Sap-wells: small dark pockmarks on trunk (persistent infrastructure)
      for (var w = 0; w < S.sapWells.length; w++) {
        noStroke();
        fill(58, 30, 20, 220);                   // deep bark-well shadow
        ellipse(S.sapWells[w].x, S.sapWells[w].y, 2, 2);
      }
      // Sapsucker: crimson-headed dot on trunk
      if (S.sapWells.length < N_WELLS) {
        noStroke();
        fill(192, 48, 48, 240);                  // sapsucker-crimson #C03030
        ellipse(S.sapsuckerXY.x, S.sapsuckerXY.y, 4, 3);
      }
      // Bouncers: amber flash at each contact, fades with stage
      for (var i = 0; i < S.bouncers.length; i++) {
        var b2 = S.bouncers[i];
        var alpha = Math.max(60, 220 - b2.stage * 50);
        fill(212, 160, 48, alpha);               // bounce-amber #D4A030
        ellipse(b2.x, b2.y, 3 - b2.stage * 0.5, 3 - b2.stage * 0.5);
      }
    }
  });
})();

// --- DEGREE v1_57 ---
/* ==== DEGREE v1.57 — Lunar Orbiter 4: The Complete Picture ====
 * Source spec: ../NASA/1.57/forest-module/lunar-orbiter-4-complete-picture.js
 * Triad: NASA=Lunar Orbiter 4 (99% nearside, 85.5° near-polar) · S36=Brandi Carlile (testimony-roar) · SPS=American Dipper (pair-bond, §6.4 duology w/ v1.11 solo-patrol)
 * Couplings: physarum-scalarField (quadrant coverage 4×4), kuramoto-phase-burst (OPC single shot), audio-layer (testimony-roar gain ramp)
 * Emergent contribution: PRINCIPLE-TRINITY scan-across-canvas probe that once-per-year
 *   sweeps every quadrant, accumulates a coverage field, publishes three independent
 *   scalars (coverage grid, OPC latch, pairBondPhase) each encoding the COVERAGE theme
 *   at its own subsystem layer.
 */
(function() {
  var QN = 4;                       // 4×4 = 16 quadrants ≈ the 99% complete-picture grid
  var SCAN_PERIOD_FRAMES = 3600;    // one full sweep per 60 s sim-year (once-per-year visit)
  var OPC_DELAY_FRAMES = 240;       // ~4 s @ 60fps — orbit-plane-change single burst
  var OPC_BURST_LEN = 36;           // 600 ms burst duration
  var COVERAGE_THRESHOLD = 0.90;    // matches source _COVERAGE_THRESHOLD
  var CELL_RAMP = 0.035;            // per-visit coverage increment

  nasaState.v1_57 = {
    coverage: new Array(QN * QN),
    pairBondPhase: 0,
    scanX: 0,
    opcFired: false,
    surveyYear: 0,
    _initFrame: 0,
    _baselineY: 0,
    _opcBurstUntil: 0
  };
  for (var k = 0; k < QN * QN; k++) nasaState.v1_57.coverage[k] = 0;

  nasaHooks.push({
    degree: '1.57',
    init: function() {
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      // Soft-read duology partner v1.11 corridor baseline (§6.4 pair); fallback 0.62*H.
      var base = H * 0.62;
      if (nasaState.v1_11 && nasaState.v1_11.waypoints && nasaState.v1_11.waypoints[0]) {
        base = nasaState.v1_11.waypoints[0].y;
      }
      nasaState.v1_57._baselineY = base;
      nasaState.v1_57._initFrame = (typeof frameNum === 'number') ? frameNum : 0;
    },
    tick: function(fn) {
      var s = nasaState.v1_57;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;

      // --- Kuramoto layer: one-shot orbit-plane-change burst ---------------
      var elapsed = fn - s._initFrame;
      if (!s.opcFired && elapsed >= OPC_DELAY_FRAMES) {
        s.opcFired = true;
        s._opcBurstUntil = fn + OPC_BURST_LEN;
      }

      // --- Physarum layer: scan probe accumulates coverage per quadrant ---
      // Near-polar sweep: x progresses linearly, y drifts across the full canopy
      // rather than clinging to the stream corridor (§6.4 duology contrast:
      // v1.11 stays at y≈0.80*H; v1.57 sweeps y ∈ [0.20*H, 0.85*H]).
      var phase = (elapsed % SCAN_PERIOD_FRAMES) / SCAN_PERIOD_FRAMES;  // 0..1
      if (elapsed > 0 && (elapsed % SCAN_PERIOD_FRAMES) === 0) s.surveyYear += 1;
      s.scanX = phase;
      var yDrift = 0.20 + (Math.sin(phase * Math.PI * 2) * 0.5 + 0.5) * 0.65;
      var probeX = phase * W;
      var probeY = yDrift * H;

      // Mark the current quadrant as visited (ramp toward 1.0).
      var qx = Math.min(QN - 1, Math.floor(phase * QN));
      var qy = Math.min(QN - 1, Math.floor(yDrift * QN));
      var cellIdx = qy * QN + qx;
      if (s.coverage[cellIdx] < 1) {
        s.coverage[cellIdx] = Math.min(1, s.coverage[cellIdx] + CELL_RAMP);
      }

      // --- Audio layer: testimony-roar ramp on aggregate completeness -----
      // Once per second, recompute pairBondPhase from mean coverage vs threshold.
      if (fn % 60 === 0) {
        var sum = 0;
        for (var i = 0; i < s.coverage.length; i++) sum += s.coverage[i];
        var mean = sum / s.coverage.length;
        s.pairBondPhase = mean >= COVERAGE_THRESHOLD
          ? 1.0
          : Math.max(0, mean / COVERAGE_THRESHOLD);
      }

      // --- Render: probe, pair-bond dipper silhouettes, OPC flare ---------
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Coverage quadrant glyphs (faint green where visited).
      if (typeof stroke === 'function' && typeof noFill === 'function') {
        noFill();
        var cellW = W / QN, cellH = H / QN;
        for (var gy = 0; gy < QN; gy++) {
          for (var gx = 0; gx < QN; gx++) {
            var c = s.coverage[gy * QN + gx];
            if (c < 0.05) continue;
            stroke(74, 154, 90, 40 + c * 110);
            if (typeof strokeWeight === 'function') strokeWeight(0.5);
            if (typeof rect === 'function') rect(gx * cellW, gy * cellH, cellW, cellH);
          }
        }
      }

      // Pair of dipper silhouettes trailing the probe (pair-bond, not solo).
      noStroke();
      fill(90, 100, 112, 220);
      if (typeof ellipse === 'function') {
        ellipse(probeX, probeY, 5.5, 3.5);
        ellipse(probeX - 6.5, probeY + 1.5, 5.0, 3.2);
      }

      // OPC burst flare: brief amber streak in the canopy.
      if (s._opcBurstUntil > fn && typeof stroke === 'function') {
        var flareA = (s._opcBurstUntil - fn) / OPC_BURST_LEN;
        stroke(196, 138, 58, 180 * flareA);
        if (typeof strokeWeight === 'function') strokeWeight(1.1);
        if (typeof line === 'function') line(probeX - 14, probeY - 4, probeX + 14, probeY - 4);
      }

      // Testimony-roar chord ring when pairBondPhase saturates.
      if (s.pairBondPhase >= 1.0 && typeof stroke === 'function' && typeof noFill === 'function') {
        noFill();
        stroke(196, 138, 58, 90);
        if (typeof strokeWeight === 'function') strokeWeight(0.7);
        if (typeof ellipse === 'function') ellipse(probeX, probeY, 16, 10);
      }
    }
  });
})();

// --- DEGREE v1_58 ---
/* ==== DEGREE v1.58 — Mariner 5 Twenty-Four Hours / Bewick's Wren Cultural Transmission ====
 * Source spec: ../NASA/1.58/forest-module/mariner5-twenty-four-hours.js
 * Triad: NASA=Mariner 5 + Venera 4 (24 h apart, Oct 1967) · S36=Shelby Earl · SPS=Bewick's Wren
 * Couplings: kuramoto/scalarField (9-seed dialect grid), boids/attractor (perch), boids/agent (wren+probes), audio/layer
 * Emergent contribution: CHANNEL-PARALLELISM origin. Two probe-agents traverse the same flyby arc at a
 *   24-sim-second offset; wren dialect grid extends v1_32 sparrow ring via neighbour-copying chain.
 *   Publishes dialectWren handshake for future Troglodytidae + complementary-pair duologies.
 */
(function() {
  var PERCH_X         = 0.52, PERCH_Y = 0.30;   // exposed hedgetop (source spec)
  var GRID_COLS       = 3, GRID_ROWS = 3;       // 9 dialect seeds (source spec sparse grid)
  var GRID_X0         = 0.18, GRID_Y0 = 0.44;   // suburban yard origin
  var GRID_DX         = 0.21, GRID_DY = 0.18;
  var ARC_CX          = 0.52, ARC_CY = 0.28;    // flyby arc centre (above perch)
  var ARC_R           = 0.24;                   // arc radius (fraction of min W,H)
  var ARC_PERIOD      = 1800;                   // 30 s per probe traversal
  var VENERA_OFFSET   = 1440;                   // 24 "hours" compressed to 24 s @ 60 fps
  var VENERA_CRUSH    = 0.82;                   // fractional phase at which Venera loses signal
  var DRIFT_EPS       = 0.010;                  // wren grid drift (slower than sparrow 0.012)
  var COPY_BIAS       = 0.21;                   // per-seed rotation against parent zone
  var TWO_PI          = Math.PI * 2;

  nasaState.v1_58 = {
    mariner: { x: 0, y: 0, phase: 0, alive: true },
    venera:  { x: 0, y: 0, phase: 0, alive: true, offsetFrames: VENERA_OFFSET },
    dialectSeeds: [],
    perch: { x: 0, y: 0 },
    occultEvents: 0,
    lastOccultFrame: -9999,
    dialectWren: { phase: 0, meanDelta: 0 }
  };

  nasaHooks.push({
    degree: '1.58',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var S = nasaState.v1_58;
      S.perch.x = PERCH_X * W;
      S.perch.y = PERCH_Y * H;
      // 3x3 dialect grid — each seed copies a v1_32 parent zone (modulo 4) with rotation bias.
      var parentN = (nasaState.v1_32 && nasaState.v1_32.zones) ? nasaState.v1_32.zones.length : 4;
      for (var r = 0; r < GRID_ROWS; r++) {
        for (var c = 0; c < GRID_COLS; c++) {
          var k = r * GRID_COLS + c;
          var parent = k % parentN;
          var parentPhase = (nasaState.v1_32 && typeof nasaState.v1_32.getDialectPhase === 'function')
            ? nasaState.v1_32.getDialectPhase(parent) : (k / 9) * TWO_PI;
          S.dialectSeeds.push({
            x: (GRID_X0 + c * GRID_DX) * W,
            y: (GRID_Y0 + r * GRID_DY) * H,
            phase: (parentPhase + k * COPY_BIAS) % TWO_PI,
            parentZone: parent
          });
        }
      }
      // Stagger probe phases so mariner leads venera by VENERA_OFFSET frames equivalent.
      S.mariner.phase = 0;
      S.venera.phase  = -(VENERA_OFFSET / ARC_PERIOD) * TWO_PI;
    },
    tick: function(fn) {
      var S = nasaState.v1_58;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;
      var cx = ARC_CX * W, cy = ARC_CY * H;
      var rPx = ARC_R * Math.min(W, H);

      // Per-frame probe advance — two agents, same arc, fixed 24 s offset.
      var dPhase = TWO_PI / ARC_PERIOD;
      S.mariner.phase = (S.mariner.phase + dPhase) % TWO_PI;
      S.venera.phase  = (S.venera.phase  + dPhase + TWO_PI) % TWO_PI;
      S.mariner.x = cx + Math.cos(S.mariner.phase) * rPx;
      S.mariner.y = cy + Math.sin(S.mariner.phase) * rPx * 0.55;   // flattened flyby
      // Venera travels the same curve but is crushed at VENERA_CRUSH of its arc.
      var veneraFrac = (S.venera.phase + TWO_PI) % TWO_PI / TWO_PI;
      S.venera.alive = veneraFrac < VENERA_CRUSH;
      if (S.venera.alive) {
        S.venera.x = cx + Math.cos(S.venera.phase) * rPx;
        S.venera.y = cy + Math.sin(S.venera.phase) * rPx * 0.55;
      }

      // Occultation event: mariner crosses perch meridian (phase ≈ π/2 ± small).
      if (fn % 5 === 0) {
        var d = Math.abs(S.mariner.phase - Math.PI / 2);
        if (d < 0.05 && fn - S.lastOccultFrame > 300) {
          S.occultEvents += 1;
          S.lastOccultFrame = fn;
        }
      }

      // Per-15-second dialect drift — each seed drifts epsilon toward its parent zone's current phase.
      if (fn % 900 === 0 && nasaState.v1_32 && typeof nasaState.v1_32.getDialectPhase === 'function') {
        var G = S.dialectSeeds, sum = 0, deltaSum = 0;
        for (var i = 0; i < G.length; i++) {
          var pp = nasaState.v1_32.getDialectPhase(G[i].parentZone);
          var targ = (pp + i * COPY_BIAS) % TWO_PI;
          var diff = targ - G[i].phase;
          while (diff >  Math.PI) diff -= TWO_PI;
          while (diff < -Math.PI) diff += TWO_PI;
          G[i].phase = ((G[i].phase + diff * DRIFT_EPS) % TWO_PI + TWO_PI) % TWO_PI;
          sum += G[i].phase; deltaSum += Math.abs(diff);
        }
        S.dialectWren.phase = sum / G.length;
        S.dialectWren.meanDelta = deltaSum / G.length;
      }

      // Render gated per 20 frames — dialect pips + perch + two probes.
      if (fn % 20 !== 0 || typeof fill !== 'function' || typeof noStroke !== 'function') return;
      var alt = (typeof sky === 'object' && sky) ? sky.sunAlt : 10;
      // Wren dialect pips visible only in daylight (wren active window).
      if (alt > -6) {
        noStroke();
        var D = S.dialectSeeds;
        for (var j = 0; j < D.length; j++) {
          var dph = D[j].phase;
          var rr = 139 + Math.floor(60 * Math.cos(dph));      // ember range #8B-#C7
          var gg = 112 + Math.floor(30 * Math.sin(dph));      // folk-warm
          fill(rr, gg, 64, 180);
          ellipse(D[j].x, D[j].y, 3.6, 2.4);
        }
        // Perch glint (Venus amber #d4a84a).
        fill(212, 168, 74, 210);
        ellipse(S.perch.x, S.perch.y, 5, 3);
        fill(106, 90, 58, 230);                                 // Bewick plumage brown (source spec)
        ellipse(S.perch.x, S.perch.y - 2, 3.6, 2.6);
      }
      // Mariner probe — stable cooler register (occult-blue #7EB8DA).
      noStroke();
      fill(126, 184, 218, 210);
      ellipse(S.mariner.x, S.mariner.y, 3.2, 3.2);
      // Venera probe — warmer ember, dimmed when crushed.
      if (S.venera.alive) {
        fill(192, 128, 48, 220);                                 // ember #C08030
        ellipse(S.venera.x, S.venera.y, 3.0, 3.0);
      } else {
        fill(90, 82, 64, 120);                                   // dust-warm, crushed trail
        ellipse(S.venera.x || cx, S.venera.y || cy, 2.2, 2.2);
      }
    }
  });
})();

// --- DEGREE v1_59 ---
/* ==== DEGREE v1.59 — Surveyor 4 Engineering Lineage + Mount Eerie + SRKW ====
 * Source spec: ../NASA/1.59/forest-module/surveyor4-engineering-lineage.js
 * Triad: NASA=Surveyor 4 (lost terminal-descent 1967-07-17) · S36=Mount Eerie (Anacortes WA)
 *        · SPS=Southern Resident Killer Whale (first marine species / mammal / cetacean)
 * Couplings: boids/trajectory-wave (descent agent), kuramoto/scalarField (3×4 matriline grid),
 *            audio/layer (CHANNEL-PARALLELISM: three registers, divergent tempos)
 * Emergent contribution: FAILURE-MODE duology 2nd member (peer v1.51 S2, terminal-descent axis);
 *   CHANNEL-PARALLELISM 2nd exemplar (origin v1.58). Single descent agent cuts off at T+41s;
 *   matriline register (3 pods × 4 calls) drifts slowly and never locks; Mount Eerie register
 *   continues past the cutoff. First downstream use of v1.32 getDialectPhase API.
 */
(function() {
  var DESCENT_START_FRAME    = 240;     // ~4 s after init — main retro ignition analog
  var DESCENT_FAILURE_FRAMES = 2460;    // ~41 s into ~40 s burn — telemetry cutoff
  var DESCENT_X_FRAC         = 0.50;
  var DESCENT_Y_START        = 0.10;
  var DESCENT_Y_END          = 0.85;
  var POD_COUNT              = 3;       // J, K, L
  var CALL_COUNT             = 4;       // S1, S4, S10, S16 representative J-Clan calls
  var MATRILINE_STRENGTH     = 0.12;    // weak — multi-decade stability
  var MATRILINE_DRIFT_EPS    = 0.005;   // intra-pod only, half v1.32 eps — tighter matriline
  var TWO_PI                 = Math.PI * 2;

  nasaState.v1_59 = {
    descent: { fired: false, startFrame: -1, cutoffFrame: -1, x: 0, y: 0, vy: 0, lost: false },
    matriline: [],
    eerieContinuous: true,
    cutoffEvents: 0,
    matrilineDriftEvents: 0,
    failureDuology: { axis: 'descent-phase-of-loss', peer: '1.51', role: 'terminal-descent' },
    getMatrilinePhase: function(pod, call) {
      var M = nasaState.v1_59.matriline;
      for (var i = 0; i < M.length; i++) {
        if (M[i].pod === pod && M[i].call === call) return M[i].phase;
      }
      return 0;
    }
  };

  nasaHooks.push({
    degree: '1.59',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      nasaState.v1_59.descent.x = DESCENT_X_FRAC * W;
      nasaState.v1_59.descent.y = DESCENT_Y_START * H;
      // Seed 3 pods × 4 calls. Phases inherit from v1_32 getDialectPhase when available
      // (first downstream consumer of the cultural-transmission-axis origin API).
      var haveV32 = (nasaState.v1_32 && typeof nasaState.v1_32.getDialectPhase === 'function');
      for (var pod = 0; pod < POD_COUNT; pod++) {
        for (var call = 0; call < CALL_COUNT; call++) {
          var idx = pod * CALL_COUNT + call;
          var basePhase = haveV32 ? nasaState.v1_32.getDialectPhase(idx % 4) : (idx / 12) * TWO_PI;
          nasaState.v1_59.matriline.push({
            pod: pod,
            call: call,
            x: (0.15 + pod * 0.35) * W,     // 3 pods horizontally spaced
            y: (0.60 + call * 0.08) * H,    // 4 calls vertically spaced
            phase: (basePhase + pod * 0.2) % TWO_PI,
            strength: MATRILINE_STRENGTH
          });
        }
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_59;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;

      // ----- Channel 1: Surveyor 4 descent (one-shot, aborts at T+41s) -----
      if (!S.descent.fired && fn >= DESCENT_START_FRAME) {
        S.descent.fired = true;
        S.descent.startFrame = fn;
      }
      if (S.descent.fired && !S.descent.lost) {
        var elapsed = fn - S.descent.startFrame;
        if (elapsed >= DESCENT_FAILURE_FRAMES) {
          S.descent.lost = true;
          S.descent.cutoffFrame = fn;
          S.cutoffEvents += 1;
          // NOTE: eerieContinuous stays true — Ch. 2 continues past the loss.
        } else {
          var t = elapsed / DESCENT_FAILURE_FRAMES;   // 0..1 across burn
          S.descent.y = (DESCENT_Y_START + (DESCENT_Y_END - DESCENT_Y_START) * t) * H;
          S.descent.vy = (DESCENT_Y_END - DESCENT_Y_START) * H / DESCENT_FAILURE_FRAMES;
        }
      }

      // ----- Channel 3: SRKW matriline Kuramoto-weak intra-pod drift (per-second) -----
      if (fn % 60 === 0) {
        var M = S.matriline, n = M.length;
        for (var pod = 0; pod < POD_COUNT; pod++) {
          // Circular mean within this pod only — matrilineal, not cross-pod.
          var sx = 0, sy = 0;
          for (var i = 0; i < n; i++) {
            if (M[i].pod === pod) { sx += Math.cos(M[i].phase); sy += Math.sin(M[i].phase); }
          }
          var target = Math.atan2(sy, sx);
          for (var j = 0; j < n; j++) {
            if (M[j].pod !== pod) continue;
            var diff = target - M[j].phase;
            while (diff > Math.PI)  diff -= TWO_PI;
            while (diff < -Math.PI) diff += TWO_PI;
            M[j].phase = ((M[j].phase + diff * MATRILINE_DRIFT_EPS) % TWO_PI + TWO_PI) % TWO_PI;
          }
        }
        S.matrilineDriftEvents += 1;
        // v1.29 oceanic-strip coupling: if a pod pass is active, its matriline cells pulse.
        if (nasaState.v1_29 && nasaState.v1_29.podActive) {
          var activePod = (nasaState.v1_29._dir > 0) ? 0 : 2;   // J east-bound / L west-bound heuristic
          for (var k = 0; k < n; k++) {
            if (M[k].pod === activePod) M[k].strength = Math.min(0.22, M[k].strength + 0.01);
            else                         M[k].strength = Math.max(MATRILINE_STRENGTH, M[k].strength - 0.005);
          }
        }
      }

      // ----- Render gated per 30 frames -----
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Ch. 1 descent agent — Salish-teal, abrupt cutoff (render gate on !lost).
      if (S.descent.fired && !S.descent.lost) {
        noStroke();
        fill(176, 196, 216, 230);              // #B0C4D8 Salish-teal spacecraft metallic
        ellipse(S.descent.x, S.descent.y, 5, 5);
        // Retro plume trail behind agent
        if (typeof stroke === 'function') {
          stroke(212, 168, 74, 120);           // lineage-gold plume
          strokeWeight(0.8);
          line(S.descent.x, S.descent.y - 4, S.descent.x, S.descent.y - 14);
        }
      }
      // Ch. 1 cutoff flash — one-frame-ish silence ring at cutoff moment.
      if (S.descent.lost && fn - S.descent.cutoffFrame < 120 && typeof noFill === 'function') {
        var fade = 1 - (fn - S.descent.cutoffFrame) / 120;
        noFill();
        stroke(176, 64, 48, 200 * fade);       // fail-red #B04030 cutoff ring
        strokeWeight(0.7);
        ellipse(S.descent.x, S.descent.y, 8 + (1 - fade) * 20, 8 + (1 - fade) * 20);
      }

      // Ch. 3 matriline grid — one dot per (pod, call), phase-tinted.
      var Mr = S.matriline;
      for (var m = 0; m < Mr.length; m++) {
        var c = Mr[m];
        var r = 120 + Math.floor(80 * Math.cos(c.phase));
        var g = 140 + Math.floor(40 * Math.sin(c.phase));
        noStroke();
        fill(r, g, 180, 180 + c.strength * 200);
        ellipse(c.x, c.y, 3.2 + c.strength * 6, 2.0 + c.strength * 3);
      }

      // Ch. 2 Mount Eerie continuous register — Anacortes anchor glyph, always drawn after init.
      if (S.eerieContinuous) {
        noStroke();
        fill(139, 112, 64, 140);               // folk-warm #8B7040 Anacortes anchor
        ellipse(0.06 * W, 0.08 * H, 2.4, 2.4);
      }
    }
  });
})();

// --- DEGREE v1_60 ---
/* ==== DEGREE v1.60 — Explorer 35 Anchored Listener + Harbor Seal MMPA Recovery ====
 * Source spec: ../NASA/1.60/forest-module/explorer35-anchored-listener.js
 * Triad: NASA=Explorer 35 (selenocentric anchored monitor) · S36=Modest Mouse (Issaquah) · SPS=Pacific Harbor Seal
 * Couplings: boids/mission-anchored-orbit (1 agent), cellular/artist-decades-cultural, kuramoto/scalarField/organism-haulout
 * Emergent contribution: PRINCIPLE-TRINITY 2nd exemplar (§6.6) + MARINE-MAMMAL CLASS TRANSITION (§6.4).
 *   A fixed-canvas anchored listener emits slow listen-events (~12.5s period); MMPA-recovery
 *   aux-seal population grows from 2 → 14 over sim-time alongside v1.20's origin pod; publishes
 *   classSealCount for future marine-mammal cross-references (class closes at two-exemplar status).
 */
(function() {
  var LISTEN_PERIOD        = 750;     // frames between anchored-listen events (~12.5s @ 60fps ≈ 0.08 Hz)
  var LISTEN_FLASH_FRAMES  = 90;      // ~1.5s gold-pulse visibility
  var ANCHOR_X_N           = 0.50;
  var ANCHOR_Y_N           = 0.22;    // upper-canvas fixed point = selenocentric orbit position
  var POPULATION_TARGET    = 14;      // MMPA recovery aux-seals (16.7× origin ≈ 14 over 6)
  var RECOVERY_PERIOD      = 5400;    // frames per +1 seal (~90s compressed arc)
  var KURAMOTO_K           = 0.012;   // weak phase coupling among haul-out sites
  var RETURN_GAIN          = 0.012;
  var VEL_DAMP             = 0.92;
  var TWO_PI               = Math.PI * 2;

  nasaState.v1_60 = {
    anchor: { x: 0, y: 0, listenPhase: 0, lastListenFrame: -9999 },
    auxSeals: [],
    populationTarget: POPULATION_TARGET,
    mmpaT0Frame: -1,
    recoveryMultiplier: 1.0,
    listenEvents: 0,
    classSealCount: 0,
    _lastListen: -LISTEN_PERIOD,
    _lastGrowth: 0
  };

  nasaHooks.push({
    degree: '1.60',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      var S = nasaState.v1_60;
      S.anchor.x = ANCHOR_X_N * W;
      S.anchor.y = ANCHOR_Y_N * H;
      // Shoreline: prefer v1_20's haul-out, then v1_13, then default.
      var shoreY = (nasaState.v1_20 && typeof nasaState.v1_20.haulOutY === 'number')
        ? nasaState.v1_20.haulOutY
        : ((nasaState.v1_13 && typeof nasaState.v1_13.shorelineY === 'number')
           ? nasaState.v1_13.shorelineY : 0.82 * H);
      // Seed with 2 aux seals east of v1_20 anchor — MMPA floor at ~3,000 of 1960s low scaled.
      S.auxSeals = [];
      for (var i = 0; i < 2; i++) {
        S.auxSeals.push({
          x: 0.72 * W + i * 11,
          y: shoreY - 6 + (i & 1 ? 1.5 : -1.5),
          vx: 0, vy: 0,
          anchorX: 0.72 * W + i * 11,
          anchorY: shoreY - 6,
          phase: Math.random() * TWO_PI
        });
      }
      S.mmpaT0Frame = 0;
    },
    tick: function(fn) {
      var S = nasaState.v1_60;
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;

      // Per-second: anchored-listen event + MMPA recovery growth + Kuramoto phase advance.
      if (fn % 60 === 0) {
        // Slow anchored listener — fires at LISTEN_PERIOD cadence, pure observation (no propagation).
        if (fn - S._lastListen >= LISTEN_PERIOD) {
          S._lastListen = fn;
          S.anchor.lastListenFrame = fn;
          S.anchor.listenPhase = (S.anchor.listenPhase + 1) % 256;
          S.listenEvents += 1;
        }
        // MMPA recovery — add 1 aux seal every RECOVERY_PERIOD frames up to target.
        if (S.auxSeals.length < POPULATION_TARGET && fn - S._lastGrowth >= RECOVERY_PERIOD) {
          S._lastGrowth = fn;
          var shoreY2 = (nasaState.v1_20 && typeof nasaState.v1_20.haulOutY === 'number')
            ? nasaState.v1_20.haulOutY : 0.82 * H;
          var idx = S.auxSeals.length;
          var siteX = 0.72 * W + (idx * 9) + ((idx % 3) * 4);  // spread east along shoreline
          S.auxSeals.push({
            x: siteX, y: shoreY2 - 6 + (idx & 1 ? 2 : -2),
            vx: 0, vy: 0,
            anchorX: siteX, anchorY: shoreY2 - 6,
            phase: Math.random() * TWO_PI
          });
        }
        S.recoveryMultiplier = S.auxSeals.length / 2;  // vs mid-1960s floor
        var v20n = (nasaState.v1_20 && nasaState.v1_20.seals) ? nasaState.v1_20.seals.length : 0;
        S.classSealCount = v20n + S.auxSeals.length;
      }

      // Per-frame: Kuramoto phase advance + position integration (cheap, no allocations).
      var meanPhase = 0;
      for (var k = 0; k < S.auxSeals.length; k++) meanPhase += S.auxSeals[k].phase;
      meanPhase = S.auxSeals.length ? meanPhase / S.auxSeals.length : 0;

      for (var i = 0; i < S.auxSeals.length; i++) {
        var sl = S.auxSeals[i];
        sl.phase += 0.001 + KURAMOTO_K * Math.sin(meanPhase - sl.phase);
        sl.vx += (sl.anchorX - sl.x) * RETURN_GAIN;
        sl.vy += (sl.anchorY - sl.y) * RETURN_GAIN;
        sl.vx *= VEL_DAMP; sl.vy *= VEL_DAMP;
        sl.x += sl.vx; sl.y += sl.vy;
      }

      // Per-30-frame render.
      if (fn % 30 !== 0) return;
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Fixed anchor: magnetometer-blue dot (always visible) + gold pulse on listen-event.
      noStroke();
      fill(92, 107, 120, 200);                         // #5C6B78 magnetometer-blue
      ellipse(S.anchor.x, S.anchor.y, 4, 4);
      var sinceL = fn - S.anchor.lastListenFrame;
      if (sinceL >= 0 && sinceL < LISTEN_FLASH_FRAMES
          && typeof noFill === 'function' && typeof stroke === 'function') {
        var a = 1 - sinceL / LISTEN_FLASH_FRAMES;
        noFill();
        stroke(212, 168, 74, 200 * a);                 // #D4A84A gold listen-pulse
        strokeWeight(0.8);
        ellipse(S.anchor.x, S.anchor.y, 8 + (1 - a) * 36, 8 + (1 - a) * 36);
      }

      // Aux seals: seal-gray bodies matching v1.20 palette (class-visual consistency).
      noStroke();
      for (var r = 0; r < S.auxSeals.length; r++) {
        var sr = S.auxSeals[r];
        if (sr.x < -10 || sr.x > W + 10) continue;
        fill(112, 144, 160, 210);                      // #7090A0 seal-gray
        ellipse(sr.x, sr.y, 10, 4);
      }
    }
  });
})();

// --- DEGREE v1_61 ---
/* ==== DEGREE v1.61 — Lunar Orbiter 5 / The Completion of the Survey ====
 * Source spec: ../NASA/1.61/forest-module/lunar-orbiter-5-completion.js
 * Triad: NASA=Lunar Orbiter 5 (program closure 5/5, 1967-68) · S36=Death Cab for Cutie · SPS=Humpback Whale
 * Couplings: boids/trajectory-wave (mission), cellular/11x3 grid (artist), kuramoto/scalarField (organism)
 * Emergent contribution: CHANNEL-PARALLELISM third exemplar stabilizes §6.6 variant. Three parallel
 *   completion-of-survey narratives run at divergent scales: LO5 polar orbit + 844 shutter events,
 *   DCFC 11-album × 3-era cultural-transmission catalog, humpback east/west-Australian song revolution
 *   coupling. Cultural-transmission axis stabilizes at three exemplars (neighborhood/matriline/ocean-basin).
 */
(function() {
  var SHUTTER_MAX = 844;                             // LO5 total frames
  var ROWS = 11, COLS = 3;                           // 11 DCFC albums × 3 label eras
  var ERA_COLORS = [[196,153,82], [58,90,138], [43,43,46]];  // Barsuk / Atlantic / ANTI-
  var CULT_SPREAD = 0.12;                            // cellular cultural-transmission rate
  var KMIN = 0.02, KMAX = 0.38;                      // Kuramoto coupling range
  var REV_START = 3600, REV_END = 10800;             // 60s..180s ramp = 1996-1998 proxy
  var TWO_PI = Math.PI * 2;

  nasaState.v1_61 = {
    orbiter: { x: 0, y: 0, phase: 0, shutterFrame: -999, shutterCount: 0 },
    catalog: [],
    songs: { phaseE: 0, phaseW: Math.PI, coupling: KMIN, revolution: false, revolutionFrame: -1, phaseDiff: Math.PI },
    channels: { missionActive: false, artistActive: false, organismActive: false },
    programClosure: false
  };

  nasaHooks.push({
    degree: '1.61',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      nasaState.v1_61.orbiter.x = 0.50 * W + 0.18 * Math.min(W, H);
      nasaState.v1_61.orbiter.y = 0.14 * H;
      for (var r = 0; r < ROWS; r++) {
        var row = [];
        for (var c = 0; c < COLS; c++) row.push({ intensity: (r === 0 && c === 0) ? 1.0 : 0.0, era: c });
        nasaState.v1_61.catalog.push(row);
      }
    },
    tick: function(fn) {
      var S = nasaState.v1_61;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;

      // --- Channel 1 (MISSION): per-frame 85° retrograde polar orbit + per-second shutter.
      var rPx = 0.18 * Math.min(W, H);
      var cx = 0.50 * W, cy = 0.14 * H;
      S.orbiter.phase = (S.orbiter.phase - 0.035) % TWO_PI;
      S.orbiter.x = cx + Math.cos(S.orbiter.phase) * rPx;
      S.orbiter.y = cy + Math.sin(S.orbiter.phase) * rPx * 0.08;   // 85° inclination = near-vertical
      S.channels.missionActive = !S.programClosure;
      if (fn % 60 === 0 && S.orbiter.shutterCount < SHUTTER_MAX) {
        S.orbiter.shutterFrame = fn;
        S.orbiter.shutterCount += 1;
        if (S.orbiter.shutterCount === SHUTTER_MAX) { S.programClosure = true; S.channels.missionActive = false; }
      }

      // --- Channel 2 (ARTIST): per-second cellular-transmission across 11×3 catalog.
      if (fn % 60 === 0) {
        var G = S.catalog, next = [], r2, c2, v, inflow, neigh, nv;
        for (r2 = 0; r2 < ROWS; r2++) {
          var rowN = [];
          for (c2 = 0; c2 < COLS; c2++) {
            v = G[r2][c2].intensity; inflow = 0; neigh = 0;
            if (r2 > 0)        { inflow += G[r2-1][c2].intensity; neigh++; }
            if (r2 < ROWS - 1) { inflow += G[r2+1][c2].intensity; neigh++; }
            if (c2 > 0)        { inflow += G[r2][c2-1].intensity; neigh++; }
            if (c2 < COLS - 1) { inflow += G[r2][c2+1].intensity; neigh++; }
            nv = v + CULT_SPREAD * (inflow / Math.max(1, neigh) - v);
            if (nv > 0.02) S.channels.artistActive = true;
            rowN.push({ intensity: Math.min(1, nv), era: c2 });
          }
          next.push(rowN);
        }
        S.catalog = next;
      }
      if (fn === 1800)  S.catalog[0][0].intensity = 1.0;   // Barsuk era re-emphasis
      if (fn === 7200)  S.catalog[4][1].intensity = 1.0;   // Atlantic transition (~Plans)
      if (fn === 14400) S.catalog[8][2].intensity = 1.0;   // ANTI- transition

      // --- Channel 3 (ORGANISM): per-second Kuramoto step for east/west-Australian song field.
      if (fn % 60 === 0) {
        var t = Math.max(0, Math.min(1, (fn - REV_START) / (REV_END - REV_START)));
        S.songs.coupling = KMIN + (KMAX - KMIN) * t;
        var K = S.songs.coupling;
        S.songs.phaseE = (S.songs.phaseE + 0.08 + K * Math.sin(S.songs.phaseW - S.songs.phaseE)) % TWO_PI;
        S.songs.phaseW = (S.songs.phaseW + 0.06 + K * Math.sin(S.songs.phaseE - S.songs.phaseW)) % TWO_PI;
        var diff = Math.abs(((S.songs.phaseE - S.songs.phaseW + Math.PI) % TWO_PI) - Math.PI);
        S.songs.phaseDiff = diff;
        if (!S.songs.revolution && diff < 0.25 && fn > REV_START) { S.songs.revolution = true; S.songs.revolutionFrame = fn; }
        S.channels.organismActive = true;
      }

      // --- Render: three regions, three visible features.
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Region 1: LO5 silhouette + per-second shutter flash.
      noStroke(); fill(200, 200, 184, 230); ellipse(S.orbiter.x, S.orbiter.y, 5, 5);
      if (fn - S.orbiter.shutterFrame < 4) { fill(255, 240, 200, 160); ellipse(S.orbiter.x, S.orbiter.y, 11, 11); }

      if (fn % 4 !== 0) return;

      // Region 2: 11×3 album-catalog grid (era-tinted cellular-transmission).
      var gx = 0.04 * W, gy = 0.45 * H, cell, col;
      for (var r3 = 0; r3 < ROWS; r3++) for (var c3 = 0; c3 < COLS; c3++) {
        cell = S.catalog[r3][c3]; if (cell.intensity < 0.03) continue;
        col = ERA_COLORS[cell.era];
        fill(col[0], col[1], col[2], 60 + cell.intensity * 180);
        ellipse(gx + c3 * 10, gy + r3 * 10, 3 + cell.intensity * 4, 3 + cell.intensity * 4);
      }

      // Region 3: east/west-Australian song field with coupling line + revolution flash.
      var ox = 0.68 * W, oy = 0.86 * H, sep = 90;
      fill(200, 200, 184, 160);
      ellipse(ox - sep / 2 + Math.cos(S.songs.phaseE) * 6, oy + Math.sin(S.songs.phaseE) * 6, 4, 4);
      ellipse(ox + sep / 2 + Math.cos(S.songs.phaseW) * 6, oy + Math.sin(S.songs.phaseW) * 6, 4, 4);
      if (typeof stroke === 'function') {
        stroke(200, 200, 184, Math.min(200, 40 + S.songs.coupling * 400));
        strokeWeight(0.4); line(ox - sep / 2, oy, ox + sep / 2, oy);
      }
      if (S.songs.revolution && fn - S.songs.revolutionFrame < 180) {
        noStroke(); fill(232, 152, 72, 140); ellipse(ox, oy, 24, 6);
      }
    }
  });
})();

// --- DEGREE v1_62 ---
/* ==== DEGREE v1.62 — Surveyor 5 / The Ground Beneath the Survey ====
 * Source spec: ../NASA/1.62/forest-module/surveyor5-alpha-scattering-triad.js
 * Triad: NASA=Surveyor 5 (alpha-scattering, Mare Tranquillitatis, Sept 1967) · S36=Grand Archives (Sub Pop two-album cycle 2008-2009) · SPS=Pileated Woodpecker laughing call (second appearance)
 * Couplings: physarum/nutrient-source (chemistry sampler), audio/layer (laughing call), kuramoto/phase-reference (two-album oscillators), lsystem/snag-density (forest-intactness proxy)
 * Emergent contribution: PRINCIPLE-TRINITY third exemplar stabilizes §6.6 variant. Three parallel
 *   first-chemistry instruments decompose the single principle of first-chemistry-of-the-hidden-
 *   substrate: alpha-scattering of lunar regolith + two-album emotional-register catalog + pileated
 *   bioacoustic snag-inventory. Publishes successAfterFailure narrative counterpoint to v1.59 S4 loss.
 */
(function() {
  var TWO_PI = Math.PI * 2;
  var SAMPLE_PERIOD = 300;              // ~5s cadence @60fps = 83h spectra compressed
  var PULSE_LIFETIME = 180;             // frames; 3s slow outward chemistry-reading pulse
  var PULSE_MAX_SAMPLES = 4;            // cap concurrent outward pulses
  var CALL_BOUT_COOLDOWN = 2400;        // ~40s between territorial laughing bouts
  var CALL_BOUT_FRAMES = 140;           // active bout duration — ~12 kuk notes at ~4 Hz
  var CALL_NOTE_GAP = 13;               // frames between kuk notes inside a bout
  var REL_WINDOW_START = 4500;          // album release-window ramp begin
  var REL_WINDOW_PEAK  = 7200;          // 2008/2009 combined peak (compressed)
  var REL_WINDOW_END   = 10800;         // coupling returns to floor
  var KURAMOTO_BASE = 0.08;             // weak-coupling floor
  var KURAMOTO_PEAK = 0.41;             // release-window peak
  var ALBUM1_OMEGA = 0.032;
  var ALBUM2_OMEGA = 0.029;

  nasaState.v1_62 = {
    chemistry: {
      samples: [],                      // {x, y, birthFrame, radius, strength}
      lastSampleFrame: -9999,
      totalSamples: 0,
      elementalAbundances: { Si: 0.60, Al: 0.145, Fe: 0.13, Mg: 0.08, Ca: 0.06, other: 0.085 }
    },
    pileatedLaugh: {
      state: 'silent',                  // 'silent' | 'calling'
      callCount: 0,
      lastCallFrame: -9999,
      boutStartFrame: -9999,
      noteCount: 0,
      lastNoteFrame: -9999,
      gatedOff: false                   // true when v1_30 drum event suppresses call
    },
    archives: {
      album1Phase: 0,
      album2Phase: Math.PI * 0.6,
      coupling: KURAMOTO_BASE,
      releaseWindowActive: false,
      phaseDiff: Math.PI
    },
    snagDensity: 0,                     // 0-1 forest-intactness proxy (derived from v1_3)
    successAfterFailure: true,          // narrative flag for any future retro-wire reads
    retroPeer: { degree: '1.59', arc: 'engineering-lineage-survival-after-loss' }
  };

  nasaHooks.push({
    degree: '1.62',
    init: function() {
      var W = (typeof width === 'number' && width > 0) ? width : 960;
      var H = (typeof height === 'number' && height > 0) ? height : 540;
      // Seed chemistry sample anchor at top-center canvas (0.50, 0.09).
      nasaState.v1_62.chemistry.anchorX = 0.50 * W;
      nasaState.v1_62.chemistry.anchorY = 0.09 * H;
      // Derive initial snagDensity from v1_3 cedar-hub count (proxy: ~6 hubs = fully intact).
      var hubs = (nasaState.v1_3 && nasaState.v1_3.hubs) ? nasaState.v1_3.hubs.length : 0;
      nasaState.v1_62.snagDensity = Math.max(0, Math.min(1, hubs / 6));
    },
    tick: function(fn) {
      var S = nasaState.v1_62;
      var W = (typeof width === 'number') ? width : 960;
      var H = (typeof height === 'number') ? height : 540;

      // --- Channel 1 (CHEMISTRY): alpha-scattering sampler at top-center. ---
      // Periodic chemistry sample at SAMPLE_PERIOD cadence. Each sample births
      // an outward-expanding pulse (physarum nutrient-source analog) that
      // lives PULSE_LIFETIME frames and carries elemental-reading strength.
      if (fn % SAMPLE_PERIOD === 0 && fn > 0) {
        if (S.chemistry.samples.length < PULSE_MAX_SAMPLES) {
          S.chemistry.samples.push({
            x: S.chemistry.anchorX, y: S.chemistry.anchorY,
            birthFrame: fn, radius: 0, strength: 0.34
          });
          S.chemistry.lastSampleFrame = fn;
          S.chemistry.totalSamples += 1;
        }
      }
      // Age and prune pulses.
      if (fn % 6 === 0 && S.chemistry.samples.length > 0) {
        var kept = [];
        for (var si = 0; si < S.chemistry.samples.length; si++) {
          var smp = S.chemistry.samples[si];
          var age = fn - smp.birthFrame;
          if (age < PULSE_LIFETIME) {
            smp.radius = (age / PULSE_LIFETIME) * 0.18 * Math.min(W, H);
            smp.strength = 0.34 * (1 - age / PULSE_LIFETIME);
            kept.push(smp);
          }
        }
        S.chemistry.samples = kept;
      }

      // --- Channel 2 (PILEATED LAUGHING CALL): dawn/dusk gated territorial ---
      // Gate: sky.sunAlt in [-6, +12] degrees (civil-dawn to peak-territorial).
      // Suppression: if v1_30.drumming is active, laughing channel stays silent
      // (same individual, distinct behavioral channel, non-overlapping per §3.1).
      if (fn % 30 === 0) {
        var P = S.pileatedLaugh;
        var sunAlt = (typeof sky === 'object' && sky && typeof sky.sunAlt === 'number') ? sky.sunAlt : 0;
        var inDawnDuskWindow = (sunAlt >= -6 && sunAlt <= 12);
        var drumActive = (nasaState.v1_30 && nasaState.v1_30.drumming === true);
        P.gatedOff = drumActive;

        // Start a new bout: window open + not drumming + cooldown satisfied.
        if (P.state === 'silent' && inDawnDuskWindow && !drumActive &&
            (fn - P.boutStartFrame) >= CALL_BOUT_COOLDOWN) {
          P.state = 'calling';
          P.boutStartFrame = fn;
          P.noteCount = 0;
          P.lastNoteFrame = fn - CALL_NOTE_GAP;
        }
      }
      // Per-frame bout tick: fire kuk notes at CALL_NOTE_GAP cadence.
      if (S.pileatedLaugh.state === 'calling') {
        var PL = S.pileatedLaugh;
        if ((fn - PL.lastNoteFrame) >= CALL_NOTE_GAP) {
          PL.noteCount += 1;
          PL.callCount += 1;
          PL.lastCallFrame = fn;
          PL.lastNoteFrame = fn;
        }
        if ((fn - PL.boutStartFrame) >= CALL_BOUT_FRAMES || PL.noteCount >= 15) {
          PL.state = 'silent';
        }
      }

      // --- Channel 3 (GRAND ARCHIVES): two-album Kuramoto oscillators. ---
      // Coupling ramps up during REL_WINDOW_START..REL_WINDOW_END (triangular
      // envelope peaking at REL_WINDOW_PEAK = 2008/2009 combined release peak).
      if (fn % 60 === 0) {
        var A = S.archives;
        var t;
        if (fn < REL_WINDOW_START || fn > REL_WINDOW_END) {
          t = 0;
          A.releaseWindowActive = false;
        } else if (fn <= REL_WINDOW_PEAK) {
          t = (fn - REL_WINDOW_START) / (REL_WINDOW_PEAK - REL_WINDOW_START);
          A.releaseWindowActive = true;
        } else {
          t = 1 - (fn - REL_WINDOW_PEAK) / (REL_WINDOW_END - REL_WINDOW_PEAK);
          A.releaseWindowActive = true;
        }
        A.coupling = KURAMOTO_BASE + (KURAMOTO_PEAK - KURAMOTO_BASE) * t;
        var K = A.coupling;
        A.album1Phase = (A.album1Phase + ALBUM1_OMEGA + K * Math.sin(A.album2Phase - A.album1Phase)) % TWO_PI;
        A.album2Phase = (A.album2Phase + ALBUM2_OMEGA + K * Math.sin(A.album1Phase - A.album2Phase)) % TWO_PI;
        var d = Math.abs(((A.album1Phase - A.album2Phase + Math.PI) % TWO_PI) - Math.PI);
        A.phaseDiff = d;
      }

      // --- Channel 4 (SNAG DENSITY): cumulative proxy for future consumers. ---
      // Reads v1_3 cedar hubs (snag-proxy). Blends in v1_6 fireweed recent-
      // disturbance signal as a winter-forage availability modifier.
      if (fn % 600 === 0) {
        var hubCount = (nasaState.v1_3 && nasaState.v1_3.hubs) ? nasaState.v1_3.hubs.length : 0;
        var baseDensity = Math.max(0, Math.min(1, hubCount / 6));
        var forageBoost = 0;
        if (nasaState.v1_6 && typeof nasaState.v1_6.recentDisturbance === 'number') {
          // Long time since burn = stable winter forage; brief recent = stressed.
          forageBoost = Math.min(0.15, nasaState.v1_6.recentDisturbance / 36000);
        }
        S.snagDensity = Math.max(0, Math.min(1, baseDensity + forageBoost));
      }

      // --- Render: top-center chemistry pulses + bottom-right archives + overlay. ---
      if (typeof noStroke !== 'function' || typeof fill !== 'function') return;

      // Region 1: chemistry sampler pulses (regolith-gray rings spreading outward).
      if (S.chemistry.samples.length > 0) {
        noStroke();
        for (var pi = 0; pi < S.chemistry.samples.length; pi++) {
          var pp = S.chemistry.samples[pi];
          var alpha = 40 + pp.strength * 200;
          fill(176, 168, 152, alpha);
          if (typeof ellipse === 'function') {
            ellipse(pp.x, pp.y, Math.max(2, pp.radius * 2), Math.max(2, pp.radius * 2));
          }
        }
        // Anchor dot (instrument body)
        fill(210, 198, 172, 220);
        if (typeof ellipse === 'function') ellipse(S.chemistry.anchorX, S.chemistry.anchorY, 4, 4);
      }

      // Render lower-frequency features only every 4th frame.
      if (fn % 4 !== 0) return;

      // Region 2: Grand Archives two-oscillator orbs at bottom-right.
      var ox = 0.82 * W, oy = 0.14 * H, sep = 28;
      var orb1x = ox - sep / 2 + Math.cos(S.archives.album1Phase) * 5;
      var orb1y = oy + Math.sin(S.archives.album1Phase) * 5;
      var orb2x = ox + sep / 2 + Math.cos(S.archives.album2Phase) * 5;
      var orb2y = oy + Math.sin(S.archives.album2Phase) * 5;
      fill(196, 153, 82, 160); if (typeof ellipse === 'function') ellipse(orb1x, orb1y, 3, 3); // Sub Pop ochre
      fill(43, 43, 46, 180);   if (typeof ellipse === 'function') ellipse(orb2x, orb2y, 3, 3); // Sub Pop charcoal
      if (typeof stroke === 'function' && S.archives.releaseWindowActive) {
        stroke(196, 153, 82, Math.min(180, 30 + S.archives.coupling * 360));
        if (typeof strokeWeight === 'function') strokeWeight(0.4);
        if (typeof line === 'function') line(orb1x, orb1y, orb2x, orb2y);
      }

      // Region 3: pileated laughing-call flash at bottom-left during active bout.
      if (S.pileatedLaugh.state === 'calling' && (fn - S.pileatedLaugh.lastNoteFrame) < 5) {
        noStroke(); fill(178, 34, 34, 160);  // pileated crest-red flash
        var lx = 0.10 * W, ly = 0.82 * H;
        if (typeof ellipse === 'function') ellipse(lx, ly, 6, 6);
      }
    },
    event: function(name, _payload) {
      // 'rain' — pileated shelters in cavity; suppress current bout if active.
      if (name === 'rain' && nasaState.v1_62.pileatedLaugh.state === 'calling') {
        nasaState.v1_62.pileatedLaugh.state = 'silent';
      }
    }
  });
})();

