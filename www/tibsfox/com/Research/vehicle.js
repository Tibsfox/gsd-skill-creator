// vehicle.js — loader for PNW Forest Ecosystem simulation
// Canonical source: Research/forest/simulation.js
// This file is loaded by the tibsfox.com homepage.
// It dynamically loads the full simulation from the forest directory.

var FOREST_API = '/Research/forest/api/forest.php';

(function() {
  var script = document.createElement('script');
  script.src = 'Research/forest/simulation.js';
  script.async = false;
  document.head.appendChild(script);
})();
