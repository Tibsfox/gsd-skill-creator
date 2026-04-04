// energy-flow.js — Ecological Energy Flow Network
// Session 7 research: Battery Evolution + Power Electronics + Wright's Law
//
// Models energy transfer through the forest ecosystem using principles
// from electrochemistry and power electronics:
// - N-step transfer principle (many small meals > one feast)
// - CV² loss theorem analog (rapid energy transfer = more waste)
// - Wright's Law for learned foraging efficiency
// - Thermal mass as energy buffer (fat stores, glycogen, starch)
//
// Research sources:
// - Battery Evolution: lead-acid to sodium-ion, Wright's Law
// - Power Electronics (Stauth): CV² hard-charging, N-step soft-charging
// - Energy Systems Rosetta: universal energy budget structure
//
// College: Ecology, Physics, Mathematics, Economics
// Rosetta: Battery chemistry → ecological energy storage → AI token budget

/**
 * Energy storage types — mapped from battery chemistries.
 * Each organism has multiple energy reserves with different characteristics.
 *
 * Lead-acid (heavy, high capacity)  → Fat stores (long-term, slow access)
 * Li-ion (high density, fast)       → Glycogen (muscles, fast burst)
 * Na-ion (abundant, cheap)          → Starch (plants, steady release)
 * Supercapacitor (instant, small)   → ATP (immediate, tiny buffer)
 */
var ENERGY_STORES = {
  atp:      { capacity: 10,   chargeRate: 5.0,  dischargeRate: 10.0, efficiency: 0.95 },
  glycogen: { capacity: 100,  chargeRate: 1.0,  dischargeRate: 3.0,  efficiency: 0.85 },
  fat:      { capacity: 1000, chargeRate: 0.3,  dischargeRate: 0.5,  efficiency: 0.70 },
  // Plants only
  starch:   { capacity: 500,  chargeRate: 0.8,  dischargeRate: 0.4,  efficiency: 0.80 },
};

/**
 * Create an energy system for an organism.
 * Animals get ATP + glycogen + fat.
 * Plants get ATP + starch.
 */
function createEnergySystem(isPlant) {
  if (isPlant) {
    return {
      atp:    { level: 5,   max: ENERGY_STORES.atp.capacity },
      starch: { level: 200, max: ENERGY_STORES.starch.capacity },
    };
  }
  return {
    atp:      { level: 5,   max: ENERGY_STORES.atp.capacity },
    glycogen: { level: 50,  max: ENERGY_STORES.glycogen.capacity },
    fat:      { level: 300, max: ENERGY_STORES.fat.capacity },
  };
}

/**
 * Basal metabolic cost — the "ghost tokens" of ecology.
 * Energy spent just existing before any activity.
 * Scales with body mass^0.75 (Kleiber's Law).
 */
function basalCost(bodySize) {
  // Kleiber's Law: metabolic rate ∝ mass^0.75
  // bodySize is our simulation proxy for mass
  return 0.002 * Math.pow(bodySize, 0.75);
}

/**
 * Activity cost using N-step principle.
 * Gradual movement (many small steps) is more efficient than
 * burst movement (one big sprint), analogous to CV² loss.
 *
 * Sprint energy cost = base * speed² (quadratic — CV² analog)
 * Cruise energy cost = base * speed * 0.7 (sub-quadratic — N-step analog)
 */
function activityCost(speed, maxSpeed, isFleeResponse) {
  var normalizedSpeed = speed / maxSpeed;

  if (isFleeResponse) {
    // Sprint: quadratic energy cost (CV² hard-charging analog)
    // This is why fleeing is expensive — the "50% loss theorem" of ecology
    return 0.008 * normalizedSpeed * normalizedSpeed;
  }
  // Cruise: sub-quadratic (N-step soft-charging analog)
  // Grazing/foraging = many small energy transfers = efficient
  return 0.003 * normalizedSpeed * 0.7;
}

/**
 * Foraging energy gain with Wright's Law learning curve.
 * Older organisms are more efficient foragers — they've learned
 * where food is and how to get it with less wasted motion.
 *
 * Wright's Law: 18-20% improvement per doubling of experience.
 * Modeled as: efficiency = 1 - 0.2 * e^(-age/learningRate)
 */
function foragingEfficiency(age, learningRate) {
  learningRate = learningRate || 500; // frames to become proficient
  var experience = 1 - 0.2 * Math.exp(-age / learningRate);
  return Math.max(0.3, Math.min(1.0, experience));
}

/**
 * Energy transfer between stores (internal recharging).
 * Fat → glycogen → ATP cascade, each with transfer efficiency.
 *
 * The transfer efficiency models the second law of thermodynamics:
 * each conversion step loses energy as heat (metabolic waste).
 * This is identical to the power grid step-down cascade:
 * HV → MV → LV → processor, losing I²R at each stage.
 */
function transferEnergy(energySystem, amount, fromStore, toStore) {
  var from = energySystem[fromStore];
  var to = energySystem[toStore];
  if (!from || !to) return 0;

  var storeConfig = ENERGY_STORES[fromStore];
  var available = Math.min(amount, from.level, storeConfig.dischargeRate);
  var transferred = available * storeConfig.efficiency;
  var headroom = to.max - to.level;
  var actual = Math.min(transferred, headroom);

  from.level -= available;
  to.level += actual;

  return actual;
}

/**
 * Full energy update step for one organism per frame.
 * Handles: basal cost, activity cost, foraging gain, inter-store transfers.
 *
 * Returns: { alive: boolean, totalEnergy: number, efficiency: number }
 */
function updateEnergy(energySystem, bodySize, speed, maxSpeed, isFleeResponse, isForaging, age, foodNearby) {
  // 1. Basal cost (always paid — ghost tokens analog)
  var basal = basalCost(bodySize);
  energySystem.atp.level -= basal;

  // 2. Activity cost
  var activity = activityCost(speed, maxSpeed, isFleeResponse);
  energySystem.atp.level -= activity;

  // 3. Foraging gain (if foraging and food nearby)
  if (isForaging && foodNearby) {
    var efficiency = foragingEfficiency(age);
    var gain = 0.05 * efficiency; // base foraging rate * learned efficiency
    energySystem.atp.level += gain;
  }

  // 4. ATP refill cascade: glycogen → ATP (if ATP is low)
  if (energySystem.atp.level < 3 && energySystem.glycogen) {
    transferEnergy(energySystem, 2, 'glycogen', 'atp');
  }

  // 5. Glycogen refill from fat (if glycogen is low)
  if (energySystem.glycogen && energySystem.glycogen.level < 20 && energySystem.fat) {
    transferEnergy(energySystem, 5, 'fat', 'glycogen');
  }

  // 6. Excess ATP → glycogen storage (if ATP buffer full)
  if (energySystem.atp.level > 8 && energySystem.glycogen) {
    transferEnergy(energySystem, 1, 'atp', 'glycogen');
  }

  // 7. Clamp ATP to bounds
  energySystem.atp.level = Math.max(0, Math.min(energySystem.atp.max, energySystem.atp.level));

  // 8. Calculate total energy and health
  var total = 0;
  var maxTotal = 0;
  for (var store in energySystem) {
    total += energySystem[store].level;
    maxTotal += energySystem[store].max;
  }

  return {
    alive: energySystem.atp.level > 0 || (energySystem.glycogen && energySystem.glycogen.level > 0),
    totalEnergy: total,
    energyPercent: maxTotal > 0 ? total / maxTotal : 0,
    efficiency: foragingEfficiency(age),
  };
}

/**
 * Seasonal energy strategy.
 * Maps to battery management system (BMS) charge/discharge profiles:
 * - Spring/summer: charge all stores (photosynthesis + abundant food)
 * - Autumn: shift to fat storage (preparation for winter)
 * - Winter: minimize activity, drain fat slowly (dormancy = compaction)
 *
 * The seasonal cycle is the ecological equivalent of the progressive
 * compaction trigger: at 20% resources → snapshot, 35% → light conservation,
 * 50% → moderate conservation, 60% → full dormancy.
 */
function seasonalStrategy(season, energySystem) {
  // season: 0-3 (spring, summer, autumn, winter)
  var strategies = {
    0: { foragingBoost: 1.2, storagePriority: 'glycogen', basalMultiplier: 1.0 },  // Spring: active
    1: { foragingBoost: 1.0, storagePriority: 'glycogen', basalMultiplier: 1.0 },  // Summer: steady
    2: { foragingBoost: 1.3, storagePriority: 'fat', basalMultiplier: 0.95 },      // Autumn: fat loading
    3: { foragingBoost: 0.3, storagePriority: 'fat', basalMultiplier: 0.7 },       // Winter: conservation
  };
  return strategies[season] || strategies[1];
}
