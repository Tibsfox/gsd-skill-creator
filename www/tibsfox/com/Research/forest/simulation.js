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

// === SETUP ===
function setup() {
  var holder = document.getElementById('sketch-holder');
  var w = holder && holder.offsetWidth > 50 ? holder.offsetWidth : windowWidth;
  var h = holder && holder.offsetHeight > 50 ? holder.offsetHeight : windowHeight;
  cnv = createCanvas(w, h);
  cnv.parent('sketch-holder');

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
        fireflies.push({
          x: srcPlant.x + random(-30, 30),
          y: srcPlant.y + random(-40, -5),
          vx: random(-0.3, 0.3), vy: random(-0.2, 0.1),
          phase: random(TWO_PI), rate: random(0.03, 0.08),
          life: floor(random(200, 600)),
          sz: random(1.5, 3.0),
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
    // Pulse glow
    var pulse = (sin(frameNum * ff.rate + ff.phase) + 1) * 0.5;
    pulse = pulse * pulse; // sharper on/off
    var fa = pulse * 0.9 * (ff.life > 30 ? 1.0 : ff.life / 30);
    if (fa > 0.05) {
      noStroke();
      fill(180, 220, 80, fa * 30);
      ellipse(ff.x, ff.y, ff.sz * 5, ff.sz * 5);
      fill(200, 240, 100, fa * 80);
      ellipse(ff.x, ff.y, ff.sz * 2.5, ff.sz * 2.5);
      fill(230, 255, 140, fa * 200);
      ellipse(ff.x, ff.y, ff.sz, ff.sz);
    }
  }
  // Firefly synchronization — Kuramoto coupled oscillators
  // Each firefly adjusts its phase toward nearby flashing neighbors
  // Simple rule → collective synchronization (Strogatz 2003)
  if (!sky.isDay) {
    var couplingStrength = 0.015; // K in Kuramoto model
    for (var i = 0; i < fireflies.length; i++) {
      var fi = fireflies[i];
      for (var j = i + 1; j < fireflies.length; j++) {
        var fj = fireflies[j];
        var dx = fi.x - fj.x, dy = fi.y - fj.y;
        var distSq = dx*dx + dy*dy;
        if (distSq < 3600) { // within 60px
          // Phase coupling: each shifts toward the other
          var phaseDiff = sin(fj.phase - fi.phase);
          fi.phase += couplingStrength * phaseDiff;
          fj.phase -= couplingStrength * phaseDiff;
        }
      }
    }
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
  var ecoLine = plants.length + ' plants  ' + seeds.length + ' seeds  ' + speciesStr.trim();
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
