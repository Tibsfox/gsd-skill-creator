/**
 * Solar Engine
 *
 * Photovoltaic cell I-V model, MPPT algorithms (Perturb & Observe,
 * Incremental Conductance), battery state-of-charge tracking, charge
 * controller simulation, and inverter efficiency modeling for Module 14
 * Off-Grid Power labs.
 *
 * Phase 276 Plan 01.
 */

// ===========================================================================
// Types
// ===========================================================================

/** Configuration for solar cell I-V curve generation. */
export interface SolarCellConfig {
  /** Short-circuit current in Amps */
  isc: number;
  /** Open-circuit voltage per cell in Volts */
  voc: number;
  /** Number of series cells */
  cells: number;
  /** Irradiance in W/m2 (default: 1000) */
  irradiance?: number;
  /** Cell temperature in Celsius (default: 25) */
  temperature?: number;
}

/** I-V curve data: parallel arrays of voltage, current, and power. */
export interface IVCurve {
  voltages: number[];
  currents: number[];
  powers: number[];
}

/** Maximum power point result. */
export interface MPPResult {
  vmpp: number;
  impp: number;
  pmpp: number;
  fillFactor: number;
}

/** MPPT algorithm result (P&O). */
export interface MPPTResult {
  vmpp: number;
  impp: number;
  pmpp: number;
  steps: number;
}

/** MPPT algorithm result (Incremental Conductance). */
export interface ICResult {
  vmpp: number;
  impp: number;
  pmpp: number;
}

/** Battery configuration. */
export interface BatteryConfig {
  capacity_ah: number;
  voltage_nominal: number;
  soc_initial: number;
  chemistry: 'lead-acid' | 'lithium';
}

/** Battery state snapshot. */
export interface BatteryState {
  soc: number;
  voltage: number;
  capacity_remaining_ah: number;
}

/** Battery model instance with charge/discharge/getState methods. */
export interface BatteryInstance {
  charge(current_a: number, hours: number): void;
  discharge(current_a: number, hours: number): void;
  getState(): BatteryState;
}

/** Charge controller configuration. */
export interface ChargeControllerConfig {
  panelPower: number;
  batteryVoltage: number;
  batterySOC: number;
  controllerType: 'pwm' | 'mppt';
}

/** Charge controller result. */
export interface ChargeControllerResult {
  chargeCurrent: number;
  chargeVoltage: number;
  efficiency: number;
}

/** Inverter configuration. */
export interface InverterConfig {
  inputVoltage_dc: number;
  outputVoltage_ac: number;
  loadPower_w: number;
  ratedPower_w: number;
}

/** Inverter efficiency result. */
export interface InverterResult {
  efficiency: number;
  outputPower_w: number;
  inputPower_w: number;
}

// ===========================================================================
// Physical constants
// ===========================================================================

/** Boltzmann constant (J/K) */
const K_BOLTZMANN = 1.380649e-23;

/** Elementary charge (C) */
const Q_ELECTRON = 1.602176634e-19;

/** Silicon ideality factor */
const N_IDEALITY = 1.3;

/** Number of sample points on I-V curve */
const IV_POINTS = 200;

// ===========================================================================
// 1. solarCellIV -- Solar cell I-V curve generator
// ===========================================================================

/**
 * Generate an I-V curve for a solar panel using the single-diode model.
 *
 * The model calculates: I = Iph - Is * (exp(V / (n * Vt * Ncells)) - 1)
 * where Iph is the photocurrent scaled by irradiance, Is is the reverse
 * saturation current derived from the open-circuit boundary condition,
 * and Vt is the thermal voltage at the given temperature.
 *
 * @param config - Solar cell parameters
 * @returns Parallel arrays of voltage, current, and power
 */
export function solarCellIV(config: SolarCellConfig): IVCurve {
  const { isc, voc, cells } = config;
  const irradiance = config.irradiance ?? 1000;
  const temperature = config.temperature ?? 25;

  // Thermal voltage: Vt = kT/q
  const T_kelvin = temperature + 273.15;
  const Vt = (K_BOLTZMANN * T_kelvin) / Q_ELECTRON;

  // Temperature effect on Voc: -2mV per cell per degree C above 25
  const dVoc = -0.002 * cells * (temperature - 25);
  const Voc_total = voc * cells + dVoc;

  // Photocurrent scales linearly with irradiance
  const Iph = isc * (irradiance / 1000);

  // Saturation current from boundary condition: at V=Voc, I=0
  // 0 = Iph - Is * (exp(Voc / (n * Vt * Ncells)) - 1)
  // Is = Iph / (exp(Voc / (n * Vt * Ncells)) - 1)
  const exponent = Voc_total / (N_IDEALITY * Vt * cells);
  const Is = Iph / (Math.exp(exponent) - 1);

  // Sample IV_POINTS from V=0 to V=Voc
  const voltages: number[] = [];
  const currents: number[] = [];
  const powers: number[] = [];

  for (let i = 0; i < IV_POINTS; i++) {
    const V = (i / (IV_POINTS - 1)) * Voc_total;
    const I = Iph - Is * (Math.exp(V / (N_IDEALITY * Vt * cells)) - 1);
    const clampedI = Math.max(0, I);

    voltages.push(V);
    currents.push(clampedI);
    powers.push(V * clampedI);
  }

  return { voltages, currents, powers };
}

// ===========================================================================
// 2. solarCellMPP -- Maximum power point finder
// ===========================================================================

/**
 * Find the maximum power point of a solar cell by scanning the I-V curve.
 *
 * @param config - Solar cell parameters (same as solarCellIV)
 * @returns Maximum power point voltage, current, power, and fill factor
 */
export function solarCellMPP(config: SolarCellConfig): MPPResult {
  const iv = solarCellIV(config);

  let maxIdx = 0;
  for (let i = 1; i < iv.powers.length; i++) {
    if (iv.powers[i] > iv.powers[maxIdx]) {
      maxIdx = i;
    }
  }

  const vmpp = iv.voltages[maxIdx];
  const impp = iv.currents[maxIdx];
  const pmpp = iv.powers[maxIdx];

  const irradiance = config.irradiance ?? 1000;
  const Isc_eff = config.isc * (irradiance / 1000);
  const temperature = config.temperature ?? 25;
  const dVoc = -0.002 * config.cells * (temperature - 25);
  const Voc_total = config.voc * config.cells + dVoc;

  const fillFactor = pmpp / (Voc_total * Isc_eff);

  return { vmpp, impp, pmpp, fillFactor };
}

// ===========================================================================
// 3. mpptPerturbAndObserve -- P&O MPPT algorithm
// ===========================================================================

/**
 * Perturb and Observe MPPT algorithm.
 *
 * Starts at the midpoint of the I-V curve and perturbs voltage by
 * stepSize index positions. If power increases, continues in the same
 * direction; if it decreases, reverses. Terminates when the direction
 * reverses twice (oscillating around MPP).
 *
 * @param ivCurve - I-V curve data from solarCellIV
 * @param stepSize - Index step size (default: 1)
 * @returns MPPT result with convergence step count
 */
export function mpptPerturbAndObserve(
  ivCurve: IVCurve,
  stepSize: number = 1,
): MPPTResult {
  const n = ivCurve.voltages.length;
  let idx = Math.floor(n / 2); // Start at midpoint
  let prevPower = ivCurve.powers[idx];
  let direction = 1; // +1 = increase voltage, -1 = decrease
  let reversals = 0;
  let steps = 0;
  let bestIdx = idx;
  let bestPower = prevPower;

  while (reversals < 2 && steps < n) {
    // Perturb
    const newIdx = Math.max(0, Math.min(n - 1, idx + direction * stepSize));
    if (newIdx === idx) {
      // Hit boundary, reverse
      direction = -direction;
      reversals++;
      steps++;
      continue;
    }

    const newPower = ivCurve.powers[newIdx];
    steps++;

    if (newPower > bestPower) {
      bestPower = newPower;
      bestIdx = newIdx;
    }

    if (newPower >= prevPower) {
      // Power increased or same, continue in same direction
      idx = newIdx;
      prevPower = newPower;
    } else {
      // Power decreased, reverse direction
      direction = -direction;
      reversals++;
      idx = newIdx;
      prevPower = newPower;
    }
  }

  return {
    vmpp: ivCurve.voltages[bestIdx],
    impp: ivCurve.currents[bestIdx],
    pmpp: ivCurve.powers[bestIdx],
    steps,
  };
}

// ===========================================================================
// 4. mpptIncrementalConductance -- IC MPPT algorithm
// ===========================================================================

/**
 * Incremental Conductance MPPT algorithm.
 *
 * Walks the I-V curve comparing dI/dV to -I/V at each point. At the
 * maximum power point, dI/dV = -I/V. Finds the crossover point where
 * dI/dV + I/V changes sign.
 *
 * @param ivCurve - I-V curve data from solarCellIV
 * @returns Voltage, current, and power at the detected MPP
 */
export function mpptIncrementalConductance(ivCurve: IVCurve): ICResult {
  const { voltages, currents, powers } = ivCurve;
  const n = voltages.length;

  // Walk from low voltage toward high voltage, looking for the crossover
  // where dI/dV + I/V changes sign (goes from positive to negative)
  let bestIdx = 0;
  let bestPower = powers[0];

  for (let i = 1; i < n - 1; i++) {
    if (powers[i] > bestPower) {
      bestPower = powers[i];
      bestIdx = i;
    }

    const dI = currents[i + 1] - currents[i];
    const dV = voltages[i + 1] - voltages[i];

    if (dV === 0) continue;

    const dIdV = dI / dV;
    const negIoverV = -currents[i] / voltages[i];

    // IC condition: at MPP, dI/dV + I/V = 0
    // When dI/dV + I/V crosses zero from positive to negative, we found MPP
    if (voltages[i] > 0) {
      const sum = dIdV + currents[i] / voltages[i];
      if (sum <= 0) {
        // We've crossed or are at MPP
        return {
          vmpp: voltages[i],
          impp: currents[i],
          pmpp: powers[i],
        };
      }
    }
  }

  // Fallback: return the point with maximum power found during walk
  return {
    vmpp: voltages[bestIdx],
    impp: currents[bestIdx],
    pmpp: powers[bestIdx],
  };
}

// ===========================================================================
// 5. batteryModel -- Battery state-of-charge tracking
// ===========================================================================

/**
 * Create a battery model with charge/discharge methods and SOC tracking.
 *
 * Voltage-SOC curves:
 * - Lead-acid 12V: V = 11.5 + 1.2 * SOC (11.5V empty to 12.7V full)
 * - Lithium 3.7V: V = 3.0 + 1.2 * SOC (3.0V empty to 4.2V full)
 *
 * @param config - Battery parameters
 * @returns Battery instance with charge/discharge/getState methods
 */
export function batteryModel(config: BatteryConfig): BatteryInstance {
  let soc = Math.max(0, Math.min(1, config.soc_initial));

  function getVoltage(): number {
    if (config.chemistry === 'lead-acid') {
      return 11.5 + 1.2 * soc;
    }
    // lithium
    return 3.0 + 1.2 * soc;
  }

  return {
    charge(current_a: number, hours: number): void {
      const ah = current_a * hours;
      soc += ah / config.capacity_ah;
      soc = Math.min(1.0, soc);
    },

    discharge(current_a: number, hours: number): void {
      const ah = current_a * hours;
      soc -= ah / config.capacity_ah;
      soc = Math.max(0.0, soc);
    },

    getState(): BatteryState {
      return {
        soc,
        voltage: getVoltage(),
        capacity_remaining_ah: soc * config.capacity_ah,
      };
    },
  };
}

// ===========================================================================
// 6. chargeControllerSim -- Charge controller simulation
// ===========================================================================

/**
 * Simulate a charge controller (PWM or MPPT).
 *
 * PWM efficiency is limited by the voltage ratio between battery and panel.
 * MPPT controllers achieve ~93% efficiency regardless of voltage mismatch.
 *
 * @param config - Charge controller parameters
 * @returns Charge current, voltage, and efficiency
 */
export function chargeControllerSim(
  config: ChargeControllerConfig,
): ChargeControllerResult {
  const { panelPower, batteryVoltage, controllerType } = config;

  // Estimated panel voltage (typical Vmp/Vbat ratio ~1.4)
  const panelVoltage = batteryVoltage * 1.4;

  let efficiency: number;

  if (controllerType === 'mppt') {
    efficiency = 0.93;
  } else {
    // PWM: efficiency = Vbat / Vpanel, capped at 0.80
    efficiency = Math.min(0.80, batteryVoltage / panelVoltage);
  }

  const chargeCurrent = (panelPower * efficiency) / batteryVoltage;

  // Charge voltage: slightly above battery voltage for charging
  const chargeVoltage = batteryVoltage * 1.05;

  return {
    chargeCurrent,
    chargeVoltage,
    efficiency,
  };
}

// ===========================================================================
// 7. inverterEfficiency -- Inverter efficiency calculation
// ===========================================================================

/**
 * Calculate inverter efficiency at a given load level.
 *
 * Efficiency follows a quadratic curve peaking near rated load, with
 * an additional penalty at very low loads (<10% rated power).
 *
 * Model: eff = nominalEff * (1 - 0.1 * (1 - loadFraction)^2)
 * At loads <10% rated: apply 0.7 penalty factor.
 *
 * @param config - Inverter parameters
 * @returns Efficiency, output power, and input power
 */
export function inverterEfficiency(config: InverterConfig): InverterResult {
  const { loadPower_w, ratedPower_w } = config;

  const nominalEff = 0.93;
  const loadFraction = loadPower_w / ratedPower_w;

  let efficiency =
    nominalEff * (1 - 0.1 * Math.pow(1 - loadFraction, 2));

  // Very low load penalty
  if (loadFraction < 0.1) {
    efficiency *= 0.7;
  }

  const outputPower_w = loadPower_w;
  const inputPower_w = outputPower_w / efficiency;

  return {
    efficiency,
    outputPower_w,
    inputPower_w,
  };
}
