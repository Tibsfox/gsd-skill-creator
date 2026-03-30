var vehicles = [];
var food = [];
var poison = [];

var debug;
var cnv;

function setup() {
  cnv = createCanvas(340, 340);
  cnv.parent('sketch-holder');

  for (var i = 0; i < 50; i++) {
    vehicles[i] = new Vehicle(random(width), random(height));
  }
  for (var i = 0; i < 100; i++) {
    food.push(createVector(10 + random(width - 20), 10 + random(height - 20)));
  }
  for (var i = 0; i < 10; i++) {
    poison.push(createVector(10 + random(width - 20), 10 + random(height - 20)));
  }

  debug = createCheckbox();
  debug.parent('check-box');
}

function mouseDragged() {
  vehicles.push(new Vehicle(mouseX, mouseY));
}

function draw() {
  // Fading trail instead of hard clear
  fill(0, 0, 0, 18);
  noStroke();
  rect(0, 0, width, height);

  if (random(1) < 0.2) {
    food.push(createVector(10 + random(width - 20), 10 + random(height - 20)));
  }
  if (random(1) < 0.01) {
    poison.push(createVector(10 + random(width - 15), 10 + random(height - 15)));
  }
  if (random(1) < 0.01) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }

  for (var i = 0; i < food.length; i++) {
    fill(0, 255, 0);
    noStroke();
    ellipse(food[i].x, food[i].y, 2, 2);
  }

  for (var i = 0; i < poison.length; i++) {
    fill(255, 0, 0);
    noStroke();
    ellipse(poison[i].x, poison[i].y, 4, 4);
  }

  for (var i = vehicles.length - 1; i >= 0; i--) {
    vehicles[i].boundaries();
    vehicles[i].behaviors(food, poison);
    vehicles[i].update();
    vehicles[i].display();

    var newVehicle = vehicles[i].clone();
    if (newVehicle != null) {
      vehicles.push(newVehicle);
    }

    if (vehicles[i].dead()) {
      var x = vehicles[i].position.x;
      var y = vehicles[i].position.y;
      food.push(createVector(x, y));
      vehicles.splice(i, 1);
    }
  }
}
