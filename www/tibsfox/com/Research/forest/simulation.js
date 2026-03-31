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

// === DEPTH PERSPECTIVE ===
function depthScale(y) { var t = y / height; return 0.15 + 0.85 * t * t; }
function depthAlpha(y) { return 0.2 + 0.8 * (y / height) * (y / height); }

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
        if (p.barometricPressure && p.barometricPressure.value !== null) wx.pressure = p.barometricPressure.value / 100;
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
var PLANT_TYPES = [
  { name:'fern',   col:[45,90,58],   angle:25, shrink:0.72, maxDepth:5, width:1.5, rules:'F[+F]F[-F]F' },
  { name:'cedar',  col:[26,58,42],   angle:20, shrink:0.78, maxDepth:6, width:2.0, rules:'FF+[+F-F-F]-[-F+F+F]' },
  { name:'moss',   col:[76,175,80],  angle:35, shrink:0.6,  maxDepth:4, width:0.8, rules:'F[+F][-F]' },
  { name:'alder',  col:[74,124,63],  angle:22, shrink:0.75, maxDepth:5, width:1.2, rules:'F[+F]F[-F][F]' },
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
    var baseAlpha = (0.3 + this.growth * 0.6) * da;
    // Darken at night
    var nightDim = sky.isDay ? 1.0 : 0.35;

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
      for (var i = 0; i < this.segments.length; i++) {
        var s = this.segments[i];
        if (s.depth >= maxD - 2) {
          var leafA = (0.08 + season * 0.15) * this.growth * da * nightDim;
          var leafSz = (1.2 + this.growth) * depthScale(s.y2);
          fill(constrain(c[0]+cs[0]+30,0,255), min(255,constrain(c[1]+cs[1]+40,0,255)), constrain(c[2]+cs[2],0,255), leafA*255);
          ellipse(s.x2, s.y2, leafSz, leafSz);
        }
      }
    }
  };

  this.computeSegments();
}

// === VEHICLE AGENTS ===
var mr = 0.02;
var SPECIES = [
  { name:'forager',  col:PAL.fern,  sz:1.3, spd:2.2, frc:0.06, food:1.0, flee:-1.2, social:0.3, trail:14, shape:'tri' },
  { name:'scout',    col:PAL.amber, sz:0.9, spd:3.2, frc:0.09, food:0.4, flee:-0.4, social:0.1, trail:22, shape:'dart' },
  { name:'guardian', col:PAL.river,  sz:2.0, spd:1.4, frc:0.04, food:0.2, flee:-2.0, social:0.9, trail:5,  shape:'diamond' },
  { name:'mycelia',  col:PAL.gold,   sz:0.7, spd:0.9, frc:0.03, food:0.7, flee:-0.2, social:1.2, trail:35, shape:'circle' },
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
    // Wind affects movement
    var windRad = radians(wx.windDir);
    var windF = wx.windSpeed / 200;
    this.acceleration.add(createVector(cos(windRad)*windF, sin(windRad)*windF));
    this.velocity.add(this.acceleration); this.velocity.limit(this.maxspeed);
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
  this.eat = function(list,nut,perc){var rec=Infinity,cl=null;for(var i=list.length-1;i>=0;i--){var d=this.position.dist(list[i]);if(d<this.maxspeed+2){list.splice(i,1);this.health+=nut;this.health=min(this.health,2.5);if(nut>0)pheromones.push({x:this.position.x,y:this.position.y,life:150,species:this.species})}else if(d<rec&&d<perc){rec=d;cl=list[i]}}if(cl!==null)return this.seek(cl);return createVector(0,0)};
  this.seek = function(t){var d=p5.Vector.sub(t,this.position);d.setMag(this.maxspeed);var s=p5.Vector.sub(d,this.velocity);s.limit(this.maxforce);return s};
  this.clone = function(){if(random(1)<0.002&&this.health>0.8&&vehicles.length<250)return new Vehicle(this.position.x+random(-4,4),this.position.y+random(-4,4),this.dna,this.species);return null};
  this.dead = function(){return this.health<0};
  this.boundaries = function(){var d=20,des=null;if(this.position.x<d)des=createVector(this.maxspeed,this.velocity.y);else if(this.position.x>width-d)des=createVector(-this.maxspeed,this.velocity.y);if(this.position.y<d)des=createVector(this.velocity.x,this.maxspeed);else if(this.position.y>height-d)des=createVector(this.velocity.x,-this.maxspeed);if(des!==null){des.normalize().mult(this.maxspeed);var s=p5.Vector.sub(des,this.velocity);s.limit(this.maxforce);this.applyForce(s)}};
  this.display = function(){
    var sp=SPECIES[this.species],angle=this.velocity.heading()+PI/2;
    var h2=constrain(this.health,0,2),bright=map(h2,0,2,0.25,1.0);
    var c=sp.col,ds=depthScale(this.position.y),da=depthAlpha(this.position.y);
    var nightDim = sky.isDay ? 1.0 : 0.4;
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
  w = min(w, 1400);
  var h = min(floor(w * 0.75), 800);
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
  w = min(w, 1400);
  resizeCanvas(w, min(floor(w * 0.75), 800));
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

  // === SKY RENDERING ===
  // Day/night gradient based on real sun altitude
  var dayR, dayG, dayB;
  if (sky.isDay) {
    dayR = lerp(12, 8, sky.skyBright);
    dayG = lerp(15, 12, sky.skyBright);
    dayB = lerp(22, 18, sky.skyBright);
  } else {
    dayR = 4; dayG = 5; dayB = 10;
  }
  background(dayR, dayG, dayB);

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
    // Glow
    fill(255, 220, 140, sunBright * 12);
    ellipse(sunX, sunY, 60, 60);
    fill(255, 230, 160, sunBright * 30);
    ellipse(sunX, sunY, 25, 25);
    fill(255, 245, 200, sunBright * 80);
    ellipse(sunX, sunY, 8, 8);
  }

  // Moon (if above horizon)
  if (sky.moonAlt > 0) {
    var moonX = map(sky.moonAz, 0, 360, width * 0.1, width * 0.9);
    var moonY = map(sky.moonAlt, 0, 70, height * 0.25, 10);
    moonY = constrain(moonY, 5, height * 0.3);
    var moonBright = constrain(map(sky.moonAlt, 0, 40, 0.2, 1.0), 0, 1);
    // Phase illumination (0=new=dark, 0.5=full=bright)
    var phaseBright = sin(sky.moonPhase * PI); // 0 at new/full boundary, peaks at quarter
    var illum = sky.moonPhase < 0.5 ? sky.moonPhase * 2 : (1 - sky.moonPhase) * 2;
    illum = constrain(illum, 0.05, 1.0);
    fill(180, 190, 210, moonBright * illum * 15);
    ellipse(moonX, moonY, 35, 35);
    fill(200, 210, 230, moonBright * illum * 40);
    ellipse(moonX, moonY, 12, 12);
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
  var nightDim = sky.isDay ? 1.0 : 0.3;
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
  // Mycelia network
  stroke(PAL.gold[0], PAL.gold[1], PAL.gold[2], 8*nightDim); strokeWeight(0.3);
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
  var ecoLine = plants.length + ' plants  ' + seeds.length + ' seeds  ' + vehicles.length + ' agents';

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
