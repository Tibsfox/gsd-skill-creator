// Emergent Behavior Simulation — Tibsfox
// Upgraded from the original p5.js vehicle sketch
// Now with: species diversity, trails, pheromones, flocking,
// predator-prey dynamics, seasonal cycles, and the fox palette
//
// Link from tibsfox.com home page:
//   <script src="Research/emergent.js"></script>
// or load standalone at Research/emergent-demo.html

var vehicles = [];
var food = [];
var poison = [];
var trails = [];
var pheromones = [];

var debug;
var cnv;
var frameNum = 0;
var season = 0; // 0-1 cycling

// Color palette from brand.css
var PAL = {
  foxDeep:    [158,  68,  37],
  fox:        [199,  91,  58],
  foxWarm:    [212, 130,  58],
  foxBright:  [232, 152,  72],
  foxLight:   [240, 192, 112],
  amber:      [201, 160,  48],
  canopy:     [ 26,  58,  42],
  forest:     [ 45,  90,  58],
  meadow:     [ 74, 124,  63],
  river:      [ 42, 100, 150],
  soil:       [ 92,  64,  51],
  magenta:    [200,  80, 192],
  gold:       [196, 163,  90],
};

var mr = 0.02; // mutation rate

// Species drawn from NASA mission organisms (PNW ecosystem)
var SPECIES = [
  { name: 'newt',       color: PAL.foxWarm,   size: 1.2, speed: 2.0, force: 0.05, foodAffinity: 1.0,  poisonFear: -1.0, social: 0.3,  trailLen: 12 }, // Taricha granulosa — rough-skinned newt (v1.17)
  { name: 'octopus',    color: PAL.foxBright, size: 0.8, speed: 3.0, force: 0.08, foodAffinity: 0.5,  poisonFear: -0.5, social: 0.1,  trailLen: 20 }, // Enteroctopus dofleini — Giant Pacific octopus (v1.20)
  { name: 'kelp',       color: PAL.forest,    size: 1.8, speed: 1.5, force: 0.04, foodAffinity: 0.3,  poisonFear: -2.0, social: 0.8,  trailLen: 6  }, // Nereocystis luetkeana — bull kelp (v1.18)
  { name: 'armillaria', color: PAL.gold,      size: 0.6, speed: 1.0, force: 0.03, foodAffinity: 0.8,  poisonFear: -0.3, social: 1.0,  trailLen: 30 }, // Armillaria ostoyae — honey mushroom (v1.0)
];

function Vehicle(x, y, dna, speciesIdx) {
  this.acceleration = createVector(0, 0);
  this.velocity = p5.Vector.random2D().mult(random(0.5, 1.5));
  this.position = createVector(x, y);
  this.species = speciesIdx !== undefined ? speciesIdx : floor(random(SPECIES.length));
  var sp = SPECIES[this.species];
  this.r = sp.size;
  this.maxspeed = sp.speed + random(-0.3, 0.3);
  this.maxforce = sp.force;
  this.health = 1.5;
  this.age = 0;
  this.trail = [];

  this.dna = [];
  if (dna === undefined) {
    this.dna[0] = random(-15, 15) * sp.foodAffinity;   // food weight
    this.dna[1] = random(-15, 15) * sp.poisonFear;      // poison weight
    this.dna[2] = random(20, 120);                        // food perception
    this.dna[3] = random(20, 120);                        // poison perception
    this.dna[4] = random(0.5, 3.0) * sp.social;          // social attraction
    this.dna[5] = random(30, 80);                         // social perception
  } else {
    for (var i = 0; i < dna.length; i++) {
      this.dna[i] = dna[i];
      if (random(1) < mr) {
        if (i < 2) this.dna[i] += random(-0.5, 0.5);
        else if (i < 4) this.dna[i] += random(-10, 10);
        else if (i === 4) this.dna[i] += random(-0.2, 0.2);
        else this.dna[i] += random(-5, 5);
      }
    }
  }

  this.update = function() {
    this.health -= 0.005 + this.age * 0.00001;
    this.age++;
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Trail
    if (frameNum % 2 === 0) {
      this.trail.push({ x: this.position.x, y: this.position.y, a: 1.0 });
      if (this.trail.length > SPECIES[this.species].trailLen) {
        this.trail.shift();
      }
    }
  };

  this.applyForce = function(force) {
    this.acceleration.add(force);
  };

  this.behaviors = function(good, bad, others) {
    var steerG = this.eat(good, 0.15, this.dna[2]);
    var steerB = this.eat(bad, -0.8, this.dna[3]);
    steerG.mult(this.dna[0]);
    steerB.mult(this.dna[1]);
    this.applyForce(steerG);
    this.applyForce(steerB);

    // Social behavior — flock with same species
    if (this.dna[4] > 0.1) {
      var social = this.flock(others);
      social.mult(this.dna[4] * 0.1);
      this.applyForce(social);
    }
  };

  this.flock = function(others) {
    var sum = createVector(0, 0);
    var count = 0;
    var perception = this.dna[5];
    for (var i = 0; i < others.length; i++) {
      if (others[i] === this) continue;
      var d = this.position.dist(others[i].position);
      if (d < perception && others[i].species === this.species) {
        sum.add(others[i].position);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }
    return createVector(0, 0);
  };

  this.clone = function() {
    if (random(1) < 0.002 && this.health > 0.8) {
      return new Vehicle(
        this.position.x + random(-5, 5),
        this.position.y + random(-5, 5),
        this.dna,
        this.species
      );
    }
    return null;
  };

  this.eat = function(list, nutrition, perception) {
    var record = Infinity;
    var closest = null;
    for (var i = list.length - 1; i >= 0; i--) {
      var d = this.position.dist(list[i]);
      if (d < this.maxspeed + 2) {
        list.splice(i, 1);
        this.health += nutrition;
        // Drop pheromone at food location
        if (nutrition > 0) {
          pheromones.push({ x: this.position.x, y: this.position.y, life: 120, species: this.species });
        }
      } else if (d < record && d < perception) {
        record = d;
        closest = list[i];
      }
    }
    if (closest !== null) return this.seek(closest);
    return createVector(0, 0);
  };

  this.seek = function(target) {
    var desired = p5.Vector.sub(target, this.position);
    desired.setMag(this.maxspeed);
    var steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  };

  this.dead = function() {
    return (this.health < 0);
  };

  this.display = function() {
    var sp = SPECIES[this.species];
    var angle = this.velocity.heading() + PI / 2;

    // Draw trail
    if (this.trail.length > 1) {
      noFill();
      for (var t = 0; t < this.trail.length - 1; t++) {
        var ta = (t / this.trail.length) * 0.15;
        stroke(sp.color[0], sp.color[1], sp.color[2], ta * 255);
        strokeWeight(0.5);
        line(this.trail[t].x, this.trail[t].y, this.trail[t+1].x, this.trail[t+1].y);
      }
    }

    push();
    translate(this.position.x, this.position.y);
    rotate(angle);

    // Debug view
    if (debug && debug.checked()) {
      strokeWeight(0.3);
      stroke(0, 255, 0, 40);
      noFill();
      ellipse(0, 0, this.dna[2] * 0.3);
      stroke(255, 0, 0, 40);
      ellipse(0, 0, this.dna[3] * 0.3);
      stroke(sp.color[0], sp.color[1], sp.color[2], 40);
      ellipse(0, 0, this.dna[5] * 0.3);
    }

    // Health-based color
    var h = constrain(this.health, 0, 2);
    var brightness = map(h, 0, 2, 0.3, 1.0);
    fill(sp.color[0] * brightness, sp.color[1] * brightness, sp.color[2] * brightness);
    stroke(sp.color[0], sp.color[1], sp.color[2], 120);
    strokeWeight(0.5);

    // Species-specific shapes
    if (this.species === 0) {
      // Newt: rounded triangle (amphibian body)
      beginShape();
      vertex(0, -this.r * 2.5);
      vertex(-this.r * 1.2, this.r * 2);
      vertex(this.r * 1.2, this.r * 2);
      endShape(CLOSE);
    } else if (this.species === 1) {
      // Octopus: dart (fast, streamlined)
      beginShape();
      vertex(0, -this.r * 3);
      vertex(-this.r * 0.6, this.r * 1.5);
      vertex(0, this.r * 0.8);
      vertex(this.r * 0.6, this.r * 1.5);
      endShape(CLOSE);
    } else if (this.species === 2) {
      // Kelp: diamond (broad frond)
      beginShape();
      vertex(0, -this.r * 2);
      vertex(-this.r * 2, 0);
      vertex(0, this.r * 2);
      vertex(this.r * 2, 0);
      endShape(CLOSE);
    } else {
      // Armillaria: circle (fungal network)
      ellipse(0, 0, this.r * 2.5, this.r * 2.5);
      // Network lines to nearby same-species
      if (this.dna[4] > 0.5) {
        stroke(sp.color[0], sp.color[1], sp.color[2], 20);
        strokeWeight(0.3);
      }
    }

    pop();
  };

  this.boundaries = function() {
    var d = 25;
    var desired = null;
    if (this.position.x < d) desired = createVector(this.maxspeed, this.velocity.y);
    else if (this.position.x > width - d) desired = createVector(-this.maxspeed, this.velocity.y);
    if (this.position.y < d) desired = createVector(this.velocity.x, this.maxspeed);
    else if (this.position.y > height - d) desired = createVector(this.velocity.x, -this.maxspeed);
    if (desired !== null) {
      desired.normalize().mult(this.maxspeed);
      var steer = p5.Vector.sub(desired, this.velocity);
      steer.limit(this.maxforce);
      this.applyForce(steer);
    }
  };
}

function setup() {
  cnv = createCanvas(380, 380);
  cnv.parent('sketch-holder');

  // Initial population — PNW ecosystem (newt, octopus, kelp, armillaria)
  for (var i = 0; i < 40; i++) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }

  // Initial food
  for (var i = 0; i < 80; i++) {
    food.push(createVector(10 + random(width - 20), 10 + random(height - 20)));
  }

  // Initial poison (sparse)
  for (var i = 0; i < 8; i++) {
    poison.push(createVector(10 + random(width - 20), 10 + random(height - 20)));
  }

  debug = createCheckbox('', false);
  debug.parent('check-box');
  debug.style('opacity', '0.3');
}

function mouseDragged() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    vehicles.push(new Vehicle(mouseX, mouseY));
  }
}

function draw() {
  frameNum++;
  season = (sin(frameNum * 0.002) + 1) * 0.5; // 0-1 seasonal cycle

  // Background with subtle gradient
  background(8, 9, 12);

  // Seasonal food spawn rate
  var foodRate = map(season, 0, 1, 0.05, 0.3); // more food in "summer"
  if (random(1) < foodRate) {
    food.push(createVector(10 + random(width - 20), 10 + random(height - 20)));
  }
  // Poison (constant, low rate)
  if (random(1) < 0.008) {
    poison.push(createVector(10 + random(width - 20), 10 + random(height - 20)));
  }
  // Spontaneous generation (rare)
  if (random(1) < 0.005 && vehicles.length < 120) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }

  // Cap populations
  if (food.length > 200) food.splice(0, food.length - 200);
  if (poison.length > 30) poison.splice(0, poison.length - 30);

  // Draw pheromones (fading marks where food was found)
  for (var i = pheromones.length - 1; i >= 0; i--) {
    var ph = pheromones[i];
    ph.life--;
    if (ph.life <= 0) { pheromones.splice(i, 1); continue; }
    var pa = (ph.life / 120) * 0.12;
    var sp = SPECIES[ph.species];
    fill(sp.color[0], sp.color[1], sp.color[2], pa * 255);
    noStroke();
    ellipse(ph.x, ph.y, 6, 6);
  }

  // Draw food (green dots, size varies with season)
  var foodSize = map(season, 0, 1, 1.5, 3);
  for (var i = 0; i < food.length; i++) {
    fill(PAL.meadow[0], PAL.meadow[1], PAL.meadow[2], 180);
    noStroke();
    ellipse(food[i].x, food[i].y, foodSize, foodSize);
  }

  // Draw poison (muted red)
  for (var i = 0; i < poison.length; i++) {
    fill(180, 50, 40, 160);
    noStroke();
    ellipse(poison[i].x, poison[i].y, 3.5, 3.5);
  }

  // Draw armillaria network lines between nearby fungi
  stroke(PAL.gold[0], PAL.gold[1], PAL.gold[2], 15);
  strokeWeight(0.4);
  for (var i = 0; i < vehicles.length; i++) {
    if (vehicles[i].species !== 3) continue;
    for (var j = i + 1; j < vehicles.length; j++) {
      if (vehicles[j].species !== 3) continue;
      var d = vehicles[i].position.dist(vehicles[j].position);
      if (d < 60) {
        line(vehicles[i].position.x, vehicles[i].position.y,
             vehicles[j].position.x, vehicles[j].position.y);
      }
    }
  }

  // Update and draw vehicles
  for (var i = vehicles.length - 1; i >= 0; i--) {
    vehicles[i].boundaries();
    vehicles[i].behaviors(food, poison, vehicles);
    vehicles[i].update();
    vehicles[i].display();

    var child = vehicles[i].clone();
    if (child !== null && vehicles.length < 120) {
      vehicles.push(child);
    }

    if (vehicles[i].dead()) {
      // Death drops food (nutrient recycling)
      food.push(createVector(vehicles[i].position.x, vehicles[i].position.y));
      food.push(createVector(
        vehicles[i].position.x + random(-3, 3),
        vehicles[i].position.y + random(-3, 3)
      ));
      vehicles.splice(i, 1);
    }
  }

  // Subtle stats overlay
  fill(255, 255, 255, 25);
  noStroke();
  textSize(8);
  textFont('monospace');
  textAlign(LEFT);
  text(vehicles.length + ' agents', 6, height - 6);
}
