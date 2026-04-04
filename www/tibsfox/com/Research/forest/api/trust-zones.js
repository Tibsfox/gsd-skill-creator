// trust-zones.js — Ecological Trust Zones & Awareness Radii
// Session 7 research: Zero Trust + Ancient African Architecture + Maasai Boma
//
// Implements defense-in-depth awareness zones for prey organisms:
// 1. SAFE zone (inner): forage, socialize, rest — no threat detected
// 2. CAUTIOUS zone (middle): heightened awareness, reduced foraging, watch neighbors
// 3. DANGER zone (outer): flee, alert nearby prey, sacrifice foraging for survival
//
// Research sources:
// - OWASP Zero Trust: "never trust, always verify"
// - Maasai boma: 3-layer defense (99.9% success rate over 10 years)
// - Ancient African architecture: species-specific deterrence calibration
// - trust-relationship.ts: quarantine → provisional → trusted lifecycle
// - FAMILIARITY_TIERS: home/neighborhood/town/stranger
//
// College: Ecology, Mathematics, Coding, Philosophy
// Rosetta: Zero Trust = ecological awareness zones (same mathematics)

/**
 * Trust zone radii for different species.
 * Calibrated by body size, speed, and predator awareness.
 * Values in pixels (simulation units).
 */
var TRUST_ZONE_DEFAULTS = {
  // Small songbirds: large danger zone, small safe zone (always vigilant)
  small_prey: { safe: 15, cautious: 45, danger: 90 },
  // Medium birds (thrush, creeper): moderate zones
  medium_prey: { safe: 20, cautious: 50, danger: 80 },
  // Owl (apex): very small zones (few threats)
  apex: { safe: 60, cautious: 80, danger: 100 },
  // Mycelia: no movement-based awareness, chemical sensing instead
  network: { safe: 5, cautious: 15, danger: 30 },
};

/**
 * Determine which trust zone a neighbor falls into relative to this organism.
 * Returns: 'safe', 'cautious', 'danger', or 'beyond' (outside all zones).
 *
 * This is the ecological instantiation of FAMILIARITY_TIERS:
 * - safe = home (trusted, frequent interaction)
 * - cautious = neighborhood (provisional, known but verified)
 * - danger = town (quarantine, observed but not trusted)
 * - beyond = stranger (unknown, no interaction)
 */
function classifyNeighbor(self, other, zones) {
  var dx = self.position.x - other.position.x;
  var dy = self.position.y - other.position.y;
  var distSq = dx * dx + dy * dy;

  if (distSq < zones.safe * zones.safe) return 'safe';
  if (distSq < zones.cautious * zones.cautious) return 'cautious';
  if (distSq < zones.danger * zones.danger) return 'danger';
  return 'beyond';
}

/**
 * Compute trust-weighted behavioral response.
 *
 * In SAFE zone: full foraging, social bonding, energy recovery
 * In CAUTIOUS zone: reduced foraging (50%), scanning neighbors, energy neutral
 * In DANGER zone: flee response, alert nearby prey, energy cost
 *
 * Returns a behavior modifier object that the Vehicle.update() loop can apply.
 */
function computeTrustResponse(self, neighbors, zones, speciesData) {
  var response = {
    foragingMultiplier: 1.0,    // 1.0 = normal, 0 = no foraging
    fleeVector: null,           // direction to flee (null = no flee)
    alertNeighbors: false,      // whether to broadcast alarm
    energyCost: 0.0,            // additional energy cost from vigilance
    scanRate: 0.0,              // rate of head-turning/scanning (visual)
    trustState: 'safe',         // overall state for this frame
  };

  var closestThreatDist = Infinity;
  var closestThreatPos = null;
  var threatCount = 0;

  for (var i = 0; i < neighbors.length; i++) {
    var other = neighbors[i];

    // Skip same species (flocking, not threat assessment)
    if (other.species === self.species) continue;

    // Check if this neighbor is a potential predator
    // Simple heuristic: larger + faster = threat
    var otherSpec = speciesData[other.species];
    var selfSpec = speciesData[self.species];
    if (!otherSpec || !selfSpec) continue;

    var isPredator = otherSpec.sz > selfSpec.sz * 1.5 && otherSpec.spd > selfSpec.spd * 0.8;
    if (!isPredator) continue;

    var zone = classifyNeighbor(self, other, zones);

    if (zone === 'danger') {
      threatCount++;
      var dx = self.position.x - other.position.x;
      var dy = self.position.y - other.position.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestThreatDist) {
        closestThreatDist = dist;
        closestThreatPos = other.position;
      }
    } else if (zone === 'cautious') {
      // Heightened awareness but no flee
      response.foragingMultiplier = Math.min(response.foragingMultiplier, 0.5);
      response.scanRate = Math.max(response.scanRate, 0.6);
      response.energyCost += 0.001; // vigilance cost
      response.trustState = 'cautious';
    }
  }

  if (threatCount > 0 && closestThreatPos) {
    // DANGER: flee response
    response.trustState = 'danger';
    response.foragingMultiplier = 0;
    response.scanRate = 1.0;
    response.energyCost += 0.005 * threatCount; // fleeing is expensive
    response.alertNeighbors = true;

    // Flee vector: away from closest threat
    var fx = self.position.x - closestThreatPos.x;
    var fy = self.position.y - closestThreatPos.y;
    var fmag = Math.sqrt(fx * fx + fy * fy) || 1;
    response.fleeVector = { x: fx / fmag, y: fy / fmag };
  }

  return response;
}

/**
 * Adaptive zone sizing based on experience.
 * Over time, organisms that survive calibrate their zones:
 * - False alarms (flee when no real threat) → shrink danger zone
 * - Near misses (threat got close before detection) → expand danger zone
 *
 * This maps to trust-relationship.ts trust decay:
 * inactivity shrinks trust, incidents expand vigilance.
 */
function adaptZones(zones, event) {
  var ADAPT_RATE = 0.02; // slow adaptation (evolutionary timescale)

  if (event === 'false_alarm') {
    // Shrink danger zone: wasted energy on phantom threat
    zones.danger = Math.max(zones.cautious + 10, zones.danger * (1 - ADAPT_RATE));
  } else if (event === 'near_miss') {
    // Expand all zones: threat got too close
    zones.safe *= (1 + ADAPT_RATE);
    zones.cautious *= (1 + ADAPT_RATE);
    zones.danger *= (1 + ADAPT_RATE * 2);
  } else if (event === 'successful_flee') {
    // Slightly expand cautious (detection worked) but don't grow danger (not needed)
    zones.cautious *= (1 + ADAPT_RATE * 0.5);
  }

  // Clamp to reasonable bounds
  zones.safe = Math.max(10, Math.min(40, zones.safe));
  zones.cautious = Math.max(zones.safe + 10, Math.min(80, zones.cautious));
  zones.danger = Math.max(zones.cautious + 10, Math.min(150, zones.danger));
}

/**
 * Visualize trust zones for a selected organism.
 * Three concentric rings: green (safe), amber (cautious), red (danger).
 * Only drawn when debug mode is active or organism is selected.
 */
function drawTrustZones(x, y, zones, trustState) {
  noFill();
  strokeWeight(0.5);

  // Danger zone (outermost)
  stroke(255, 60, 40, trustState === 'danger' ? 80 : 20);
  ellipse(x, y, zones.danger * 2, zones.danger * 2);

  // Cautious zone
  stroke(255, 180, 40, trustState === 'cautious' ? 80 : 20);
  ellipse(x, y, zones.cautious * 2, zones.cautious * 2);

  // Safe zone (innermost)
  stroke(80, 200, 80, trustState === 'safe' ? 80 : 20);
  ellipse(x, y, zones.safe * 2, zones.safe * 2);
}

/**
 * Compute alarm propagation.
 * When a prey broadcasts alarm (alertNeighbors = true),
 * nearby prey within cautious zone radius also enter cautious state.
 *
 * This is the ecological equivalent of the nudge-sync channel:
 * immediate, volatile, broadcast within range.
 */
function propagateAlarm(alarmedOrganism, allOrganisms, speciesData) {
  var alarmRadius = 80; // alarm call audible range
  var alerted = [];

  for (var i = 0; i < allOrganisms.length; i++) {
    var other = allOrganisms[i];
    if (other === alarmedOrganism) continue;

    // Only same-species or known-symbiotic species respond to alarm calls
    var otherSpec = speciesData[other.species];
    var selfSpec = speciesData[alarmedOrganism.species];
    if (!otherSpec || !selfSpec) continue;

    // Size-similar species respond (mixed flocking behavior in PNW forests)
    var sizeDiff = Math.abs(otherSpec.sz - selfSpec.sz);
    if (sizeDiff > 1.5) continue; // too different in size to respond

    var dx = alarmedOrganism.position.x - other.position.x;
    var dy = alarmedOrganism.position.y - other.position.y;
    var distSq = dx * dx + dy * dy;

    if (distSq < alarmRadius * alarmRadius) {
      alerted.push(other);
    }
  }

  return alerted;
}
