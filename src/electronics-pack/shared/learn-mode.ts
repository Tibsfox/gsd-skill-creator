/**
 * Learn Mode System
 *
 * Three-level depth system for progressive content disclosure.
 * Provides depth filtering, H&H citation lookup, and a complete
 * marker registry for all 15 modules (16 directories including 07a).
 */

/** Depth levels for learn mode */
export enum DepthLevel {
  /** Practical rules and intuition — no math */
  Practical = 1,
  /** Section references and deeper explanations */
  Reference = 2,
  /** Full mathematical treatment */
  Mathematical = 3,
}

/** A depth marker embedded in module content */
export interface DepthMarker {
  level: DepthLevel;
  content: string;
  hhCitation: string; // e.g., "H&H 1.2.1" or "H&H p.42"
}

/** Learn mode configuration per module */
export interface LearnModeConfig {
  moduleId: string;
  defaultLevel: DepthLevel;
  markers: DepthMarker[];
}

/** Structured H&H citation resolved from the chapter map */
export interface HHCitation {
  raw: string;
  chapter: number;
  section?: string;
  topic: string;
  modules: string[];
}

// ---------------------------------------------------------------------------
// Internal: H&H Chapter-to-Module Map
// ---------------------------------------------------------------------------

interface ChapterEntry {
  ref: string;
  chapter: number;
  section?: string;
  topic: string;
  modules: string[];
}

const HH_CHAPTER_MAP: ChapterEntry[] = [
  { ref: '1.2', chapter: 1, section: '2', topic: 'Voltage, current, resistance', modules: ['01-the-circuit'] },
  { ref: '1.3', chapter: 1, section: '3', topic: 'Signals', modules: ['03-the-signal'] },
  { ref: '1.4', chapter: 1, section: '4', topic: 'Capacitors and AC circuits', modules: ['02-passive-components'] },
  { ref: '1.5', chapter: 1, section: '5', topic: 'Inductors and transformers', modules: ['02-passive-components'] },
  { ref: '1.6', chapter: 1, section: '6', topic: 'Diodes and diode circuits', modules: ['04-diodes'] },
  { ref: '1.7', chapter: 1, section: '7', topic: 'Impedance, filters, resonance', modules: ['02-passive-components', '03-the-signal'] },
  { ref: 'Ch.2', chapter: 2, topic: 'Bipolar transistors', modules: ['05-transistors'] },
  { ref: 'Ch.3', chapter: 3, topic: 'Field-effect transistors', modules: ['05-transistors'] },
  { ref: 'Ch.4', chapter: 4, topic: 'Operational amplifiers', modules: ['06-op-amps'] },
  { ref: 'Ch.5', chapter: 5, topic: 'Precision circuits', modules: ['12-sensors-actuators'] },
  { ref: 'Ch.6', chapter: 6, topic: 'Filters', modules: ['06-op-amps'] },
  { ref: '8.11', chapter: 8, section: '11', topic: 'Noise', modules: ['03-the-signal'] },
  { ref: 'Ch.9', chapter: 9, topic: 'Voltage regulation and power', modules: ['07-power-supplies', '14-off-grid-power'] },
  { ref: '9.8', chapter: 9, section: '8', topic: 'Solar cells and energy harvesting', modules: ['14-off-grid-power'] },
  { ref: '10.1-10.2', chapter: 10, section: '1-2', topic: 'Digital logic: gates, Boolean', modules: ['07a-logic-gates'] },
  { ref: '10.3-10.5', chapter: 10, section: '3-5', topic: 'Sequential logic', modules: ['08-sequential-logic'] },
  { ref: 'Ch.12', chapter: 12, topic: 'Circuit construction techniques', modules: ['15-pcb-design', '12-sensors-actuators'] },
  { ref: 'Ch.13', chapter: 13, topic: 'Data converters', modules: ['09-data-conversion'] },
  { ref: '13.5', chapter: 13, section: '5', topic: 'Digital signal processing', modules: ['10-dsp'] },
  { ref: 'Ch.14-15', chapter: 14, topic: 'Microcontrollers and embedded', modules: ['11-microcontrollers'] },
];

// ---------------------------------------------------------------------------
// lookupCitation
// ---------------------------------------------------------------------------

/**
 * Resolve an H&H citation string to a structured HHCitation object.
 *
 * Supports formats: "H&H 1.2", "H&H Ch.2", "H&H 10.1-10.2", "H&H Ch.14-15"
 * Returns null if no match found.
 */
export function lookupCitation(citationStr: string): HHCitation | null {
  if (!citationStr) return null;

  // Strip "H&H " prefix if present
  const ref = citationStr.startsWith('H&H ')
    ? citationStr.slice(4).trim()
    : citationStr.trim();

  if (!ref) return null;

  // Try exact match first
  let entry = HH_CHAPTER_MAP.find((e) => e.ref === ref);

  // Try prefix match (e.g., "10.1" should match "10.1-10.2")
  if (!entry) {
    entry = HH_CHAPTER_MAP.find((e) => e.ref.startsWith(ref + '-') || e.ref.startsWith(ref + '.'));
  }

  // Try if the input is a sub-section of a range (e.g., "10.3" matches "10.3-10.5")
  if (!entry) {
    entry = HH_CHAPTER_MAP.find((e) => {
      const dashIdx = e.ref.indexOf('-');
      if (dashIdx === -1) return false;
      const start = e.ref.slice(0, dashIdx);
      return start === ref;
    });
  }

  if (!entry) return null;

  return {
    raw: citationStr,
    chapter: entry.chapter,
    section: entry.section,
    topic: entry.topic,
    modules: [...entry.modules],
  };
}

// ---------------------------------------------------------------------------
// filterByDepth
// ---------------------------------------------------------------------------

/**
 * Filter depth markers to include only those at or below the requested level.
 *
 * - Practical (1): only Level 1
 * - Reference (2): Level 1 + Level 2
 * - Mathematical (3): all levels
 */
export function filterByDepth(markers: DepthMarker[], level: DepthLevel): DepthMarker[] {
  return markers.filter((m) => m.level <= level);
}

// ---------------------------------------------------------------------------
// getModuleMarkers
// ---------------------------------------------------------------------------

/**
 * Get all depth markers for a given module ID.
 * Returns empty array if module not found.
 */
export function getModuleMarkers(moduleId: string): DepthMarker[] {
  return MODULE_MARKERS[moduleId] ?? [];
}

// ---------------------------------------------------------------------------
// MODULE_MARKERS registry
// ---------------------------------------------------------------------------

/** Complete depth marker registry for all 16 module directories */
export const MODULE_MARKERS: Record<string, DepthMarker[]> = {
  // ---- 01-the-circuit: H&H 1.2 ----
  '01-the-circuit': [
    {
      level: DepthLevel.Practical,
      content: 'Voltage is electrical pressure -- higher voltage pushes more current through a resistance. Double the voltage, double the current.',
      hhCitation: 'H&H 1.2',
    },
    {
      level: DepthLevel.Practical,
      content: 'A voltage divider splits voltage proportionally by resistance ratio. The output is always less than the input.',
      hhCitation: 'H&H 1.2',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 1.2 for the relationship between voltage, current, and resistance in linear circuits, including Kirchhoff\'s voltage and current laws (KVL/KCL) and the concept of conductance G.',
      hhCitation: 'H&H 1.2',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Ohm\'s Law: V = IR. Power dissipation: P = IV = I^2R = V^2/R. Voltage divider: V_out = V_in * R2/(R1+R2). For series resistors: R_total = R1 + R2. For parallel: 1/R_total = 1/R1 + 1/R2.',
      hhCitation: 'H&H 1.2',
    },
  ],

  // ---- 02-passive-components: H&H 1.4, 1.5, 1.7 ----
  '02-passive-components': [
    {
      level: DepthLevel.Practical,
      content: 'A capacitor blocks DC and passes AC. Larger capacitors pass lower frequencies. Think of it as a tiny rechargeable battery that charges and discharges rapidly.',
      hhCitation: 'H&H 1.4',
    },
    {
      level: DepthLevel.Practical,
      content: 'An inductor resists changes in current. It passes DC freely but opposes AC -- the opposite of a capacitor.',
      hhCitation: 'H&H 1.5',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 1.4 for capacitor behavior in AC circuits, RC time constants, and high-pass/low-pass filter configurations. Section 1.7 covers impedance and resonant circuits.',
      hhCitation: 'H&H 1.4',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 1.7 for the generalized impedance concept that unifies resistors, capacitors, and inductors in AC analysis, including series and parallel resonance.',
      hhCitation: 'H&H 1.7',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Capacitive impedance: Z_C = 1/(jwC). Inductive impedance: Z_L = jwL. RC time constant: tau = RC. Resonant frequency: f_0 = 1/(2*pi*sqrt(LC)). Quality factor: Q = f_0/BW = (1/R)*sqrt(L/C).',
      hhCitation: 'H&H 1.7',
    },
    {
      level: DepthLevel.Practical,
      content: 'An inductor resists sudden changes in current by storing energy in its magnetic field. The RL time constant (inductance divided by resistance) determines how fast current builds -- after one time constant, current reaches about 63% of its final value.',
      hhCitation: 'H&H 1.5',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'RL transient: I(t) = (V/R)*(1 - e^(-t*R/L)). Time constant: tau = L/R. Inductor voltage: V_L = L*dI/dt. Energy stored: E = (1/2)*L*I^2.',
      hhCitation: 'H&H 1.5',
    },
    {
      level: DepthLevel.Practical,
      content: 'A transformer uses magnetic coupling to transfer energy between coils. The voltage ratio equals the turns ratio: more turns means higher voltage.',
      hhCitation: 'H&H 1.5',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Transformer voltage ratio: V2/V1 = N2/N1. Impedance transformation: Z_reflected = (N1/N2)^2 * Z_load. Power conservation: V1*I1 = V2*I2 (ideal).',
      hhCitation: 'H&H 1.5',
    },
  ],

  // ---- 03-the-signal: H&H 1.7, 8.11 ----
  '03-the-signal': [
    {
      level: DepthLevel.Practical,
      content: 'Every real signal carries noise -- unwanted random fluctuations. Wider bandwidth lets in more noise. Filtering narrows bandwidth to improve signal-to-noise ratio.',
      hhCitation: 'H&H 8.11',
    },
    {
      level: DepthLevel.Practical,
      content: 'A Bode plot shows how a circuit\'s gain changes with frequency. Flat in the passband, rolling off in the stopband. The -3dB point is where power drops to half.',
      hhCitation: 'H&H 1.7',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 1.7 for Bode plot construction, impedance-based filter analysis, and the transition from time-domain to frequency-domain thinking. Section 8.11 covers noise spectral density and noise figure.',
      hhCitation: 'H&H 1.7',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Transfer function magnitude: |H(jw)| = V_out/V_in. Decibels: dB = 20*log10(|H|). Johnson noise voltage: V_n = sqrt(4*k*T*R*BW). SNR = signal_power/noise_power. First-order rolloff: -20dB/decade = -6dB/octave.',
      hhCitation: 'H&H 8.11',
    },
    {
      level: DepthLevel.Practical,
      content: 'Signal sources produce waveforms -- sine, square, triangle -- each with different RMS values even at the same peak amplitude. The square wave has the highest RMS because it spends all its time at peak.',
      hhCitation: 'H&H 1.3',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Waveform RMS values for peak amplitude A: sine Vrms = A/sqrt(2), square Vrms = A, triangle Vrms = A/sqrt(3). Crest factor CF = Vpeak/Vrms: sine CF = sqrt(2), square CF = 1, triangle CF = sqrt(3).',
      hhCitation: 'H&H 1.3',
    },
  ],

  // ---- 04-diodes: H&H 1.6 ----
  '04-diodes': [
    {
      level: DepthLevel.Practical,
      content: 'A diode is a one-way valve for current. It drops about 0.6V when conducting (silicon). Below that threshold, almost no current flows.',
      hhCitation: 'H&H 1.6',
    },
    {
      level: DepthLevel.Practical,
      content: 'A Zener diode conducts in reverse at a specific breakdown voltage, making it useful as a simple voltage reference or clamp.',
      hhCitation: 'H&H 1.6',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 1.6 for the diode I-V characteristic, rectifier circuits (half-wave, full-wave, bridge), Zener regulation, and the exponential diode equation.',
      hhCitation: 'H&H 1.6',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Shockley diode equation: I = I_s * (exp(V/(n*V_T)) - 1), where V_T = kT/q ~ 26mV at room temperature, n ~ 1-2. Piecewise-linear model: I = (V - V_th)/R_on for V > V_th, else I = V/R_off.',
      hhCitation: 'H&H 1.6',
    },
    {
      level: DepthLevel.Practical,
      content: 'Schottky diodes switch thousands of times faster than standard silicon diodes because they have no minority carrier storage -- they are the first choice for high-frequency power supplies',
      hhCitation: 'H&H 1.6',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 1.6 for comparison of diode types: standard silicon (1N400x), fast recovery (1N4148), Schottky (1N58xx), and their reverse recovery characteristics',
      hhCitation: 'H&H 1.6',
    },
  ],

  // ---- 05-transistors: H&H Ch.2, Ch.3 ----
  '05-transistors': [
    {
      level: DepthLevel.Practical,
      content: 'A bipolar transistor (BJT) amplifies current: a small base current controls a large collector current. Think of it as a current-controlled valve.',
      hhCitation: 'H&H Ch.2',
    },
    {
      level: DepthLevel.Practical,
      content: 'A MOSFET is a voltage-controlled switch: gate voltage controls drain current. No gate current flows, so it is easy to drive from logic circuits.',
      hhCitation: 'H&H Ch.3',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H Ch.2 for BJT biasing, common-emitter amplifiers, current mirrors, and the Ebers-Moll model. Ch.3 covers FET types (JFET, MOSFET), transfer characteristics, and CMOS analog switches.',
      hhCitation: 'H&H Ch.2',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'BJT: I_C = beta * I_B, V_BE ~ 0.6V. Transconductance: g_m = I_C / V_T. Voltage gain: A_v = -g_m * R_C. MOSFET saturation: I_D = (1/2)*mu*C_ox*(W/L)*(V_GS - V_th)^2.',
      hhCitation: 'H&H Ch.2',
    },
    {
      level: DepthLevel.Practical,
      content: 'A differential pair amplifies the difference between two inputs while ignoring signals common to both -- this is the front end of every op-amp',
      hhCitation: 'H&H Ch.2',
    },
    {
      level: DepthLevel.Practical,
      content: 'A JFET is a voltage-controlled resistor: the gate voltage squeezes the conducting channel. Zero gate voltage gives maximum current, negative gate voltage reduces it',
      hhCitation: 'H&H Ch.3',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 2.3 for differential amplifier analysis including tail current sources, CMRR, and how transistor matching affects performance',
      hhCitation: 'H&H Ch.2',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 3.1-3.2 for JFET drain characteristics, pinch-off voltage, and common-source/common-drain FET amplifier configurations',
      hhCitation: 'H&H Ch.3',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Differential pair gain: Ad = gm*Rc where gm = Ic/(2*Vt). Common-mode gain: Acm = -Rc/(2*Rtail). CMRR = Ad/Acm = gm*Rtail',
      hhCitation: 'H&H Ch.2',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'JFET Shockley equation: Id = Idss*(1 - Vgs/Vp)^2. Transconductance: gm = 2*Idss/|Vp| * (1 - Vgs/Vp). Common-source gain: Av = -gm*Rd/(1 + gm*Rs)',
      hhCitation: 'H&H Ch.3',
    },
  ],

  // ---- 06-op-amps: H&H Ch.4, Ch.6 ----
  '06-op-amps': [
    {
      level: DepthLevel.Practical,
      content: 'An op-amp with negative feedback forces its two inputs to be at the same voltage. This "golden rule" lets you analyze any op-amp circuit without knowing the internal details.',
      hhCitation: 'H&H Ch.4',
    },
    {
      level: DepthLevel.Practical,
      content: 'Active filters use op-amps with capacitors to achieve sharper frequency cutoffs than passive RC filters. They can also provide gain.',
      hhCitation: 'H&H Ch.6',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H Ch.4 for the ideal op-amp model, inverting/non-inverting configurations, virtual ground concept, and feedback stability. Ch.6 covers active filter topologies (Sallen-Key, state-variable, biquad).',
      hhCitation: 'H&H Ch.4',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Inverting amplifier: V_out = -(R_f/R_in)*V_in. Non-inverting: V_out = (1 + R_f/R_in)*V_in. GBW product: A_v * f_-3dB = constant. Sallen-Key Q: Q = sqrt(C1*C2*R1*R2)/(C2*(R1+R2)).',
      hhCitation: 'H&H Ch.4',
    },
    {
      level: DepthLevel.Practical,
      content: 'A summing amplifier adds multiple input signals with adjustable weights -- changing one resistor changes one input\'s contribution without affecting the others',
      hhCitation: 'H&H Ch.4',
    },
    {
      level: DepthLevel.Practical,
      content: 'Every real op-amp has finite bandwidth, input offset voltage, and slew rate that limit its performance in high-speed or precision circuits',
      hhCitation: 'H&H Ch.4',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 4.2 for inverting op-amp variations: summing amplifier, differentiator, and the virtual ground concept that makes them work',
      hhCitation: 'H&H Ch.4',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 4.3 for op-amp non-idealities: gain-bandwidth product, slew rate, input offset voltage, bias current, and common-mode rejection ratio',
      hhCitation: 'H&H Ch.4',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Summing amplifier: Vout = -(Rf/R1*V1 + Rf/R2*V2 + ... + Rf/Rn*Vn). Differentiator: Vout = -Rf*C*dVin/dt. Integration: Vout = -(1/(Rf*C))*integral(Vin*dt)',
      hhCitation: 'H&H Ch.4',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'GBW product: Av * f_3dB = constant. Slew rate limit: f_max = SR/(2*pi*Vpeak). Output offset from Vos: Vout_offset = Vos * (1 + Rf/Rin)',
      hhCitation: 'H&H Ch.4',
    },
  ],

  // ---- 07-power-supplies: H&H Ch.9 ----
  '07-power-supplies': [
    {
      level: DepthLevel.Practical,
      content: 'A linear regulator wastes excess voltage as heat. Simple and low-noise, but inefficient when the input-output voltage difference is large.',
      hhCitation: 'H&H Ch.9',
    },
    {
      level: DepthLevel.Practical,
      content: 'A switching regulator chops the input voltage rapidly and filters it to get the desired output. Much more efficient than linear, but introduces switching noise.',
      hhCitation: 'H&H Ch.9',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H Ch.9 for linear regulator design (pass transistor, error amplifier, dropout), switching converter topologies (buck, boost, buck-boost), and thermal management.',
      hhCitation: 'H&H Ch.9',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Linear regulator: P_dissipated = (V_in - V_out) * I_load. Buck converter: V_out = D * V_in, where D = duty cycle. Boost: V_out = V_in/(1-D). Efficiency: eta = P_out/P_in. Inductor ripple: delta_I = (V_in - V_out)*D/(L*f_sw).',
      hhCitation: 'H&H Ch.9',
    },
    // Tier 3 depth markers (buck-boost, charge pump, PFC)
    {
      level: DepthLevel.Practical,
      content: 'A buck-boost converter handles input voltages that swing above and below the output -- essential for Li-ion battery to 3.3V rails where the battery voltage crosses the target during discharge',
      hhCitation: 'H&H Ch.9',
    },
    {
      level: DepthLevel.Practical,
      content: 'Charge pumps use capacitors and switches to multiply voltage without an inductor -- smaller and cheaper than inductive converters but limited to low current applications',
      hhCitation: 'H&H Ch.9',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 9.5 for power factor correction (PFC) circuits that shape the input current to match the voltage waveform, reducing harmonic distortion on AC mains and improving energy efficiency',
      hhCitation: 'H&H Ch.9',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 9.7 for charge pump architectures including voltage doublers, inverters, and fractional converters, plus the tradeoff between output impedance and switching frequency',
      hhCitation: 'H&H Ch.9',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Buck-boost duty cycle: V_out = V_in * D/(1-D) for inverting topology, or D crossover between buck (D = V_out/V_in) and boost (D = 1 - V_in/V_out) modes. Charge pump output: V_out = N*V_in - I_load/(f_sw*C_fly) - N*V_diode for N-stage multiplier.',
      hhCitation: 'H&H Ch.9',
    },
  ],

  // ---- 07a-logic-gates: H&H 10.1, 10.2 ----
  '07a-logic-gates': [
    {
      level: DepthLevel.Practical,
      content: 'Digital logic has only two states: HIGH (1) and LOW (0). Gates combine inputs using AND, OR, NOT rules. Any logic function can be built from NAND gates alone.',
      hhCitation: 'H&H 10.1',
    },
    {
      level: DepthLevel.Practical,
      content: 'CMOS gates use complementary MOSFET pairs: when the output is HIGH, the pull-up network is on and pull-down is off, and vice versa. No static power consumption in either state.',
      hhCitation: 'H&H 10.2',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 10.1 for Boolean algebra, truth tables, De Morgan\'s laws, and canonical forms (SOP/POS). Section 10.2 covers CMOS gate implementation, propagation delay, fan-out, and noise margins.',
      hhCitation: 'H&H 10.1',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Boolean identities: A + A\'B = A + B, (A+B)\' = A\'B\' (De Morgan). Propagation delay: t_pd = 0.7*R*C per stage. Dynamic power: P = C_L * V_DD^2 * f. NAND transistor count: 2N MOSFETs for N inputs.',
      hhCitation: 'H&H 10.2',
    },
    // Tier 3 depth markers (MOSFET digital logic depth)
    {
      level: DepthLevel.Practical,
      content: 'MOSFET digital gates come in NMOS-only and CMOS flavors -- CMOS uses complementary pairs to achieve near-zero static power, which is why billions of transistors can fit on a modern chip',
      hhCitation: 'H&H 10.2',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 3.4 for MOSFET behavior in the digital domain: threshold voltage, noise margins, dynamic power dissipation, and why CMOS replaced NMOS for most digital logic',
      hhCitation: 'H&H 10.2',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'CMOS dynamic power: P = C_load * V_DD^2 * f_clk * alpha, where alpha is the activity factor. Propagation delay: t_pd = 0.7 * (R_p * C_load), where R_p is the effective pull-up/pull-down resistance. Static power: P_static = I_leak * V_DD.',
      hhCitation: 'H&H 10.2',
    },
  ],

  // ---- 08-sequential-logic: H&H 10.3-10.5 ----
  '08-sequential-logic': [
    {
      level: DepthLevel.Practical,
      content: 'A flip-flop remembers one bit. It captures input on a clock edge and holds it until the next edge. Registers are groups of flip-flops that store multi-bit values.',
      hhCitation: 'H&H 10.3',
    },
    {
      level: DepthLevel.Practical,
      content: 'A counter increments on each clock pulse. Ripple counters are simple but slow; synchronous counters update all bits simultaneously for higher speed.',
      hhCitation: 'H&H 10.4',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 10.3 for SR, JK, and D flip-flop operation and timing constraints (setup, hold, propagation). Sections 10.4-10.5 cover counters, shift registers, and finite state machine design.',
      hhCitation: 'H&H 10.3',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Maximum clock frequency: f_max = 1/(t_cq + t_comb + t_setup). Ripple counter delay: t_total = N * t_pd. State encoding: log2(N) flip-flops for N states. Counter modulus: 2^n for n-bit binary counter.',
      hhCitation: 'H&H 10.4',
    },
    // Tier 3 depth markers (metastability, FIFO, memory)
    {
      level: DepthLevel.Practical,
      content: 'Metastability is the digital equivalent of balancing a ball on a knife edge -- if the flip-flop input changes too close to the clock edge, the output can hover between 0 and 1 for an unpredictable time',
      hhCitation: 'H&H 10.3-10.5',
    },
    {
      level: DepthLevel.Practical,
      content: 'FIFOs (first-in-first-out buffers) connect subsystems running at different speeds -- the write side pushes data in, the read side pulls data out in the same order, with the FIFO absorbing speed mismatches',
      hhCitation: 'H&H 10.3-10.5',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 10.4 for metastability analysis, MTBF calculations, and multi-stage synchronizer design for crossing clock domains safely',
      hhCitation: 'H&H 10.3-10.5',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 10.5 for memory architectures including SRAM, DRAM, Flash, and FIFO organizations, plus bus protocols for connecting digital subsystems',
      hhCitation: 'H&H 10.3-10.5',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Metastability MTBF: MTBF = exp(t_resolve/tau) / (f_clk * f_data). Two-stage synchronizer: MTBF_2 = exp(2*t_resolve/tau) / (f_clk * f_data). DRAM refresh: t_refresh < t_retention (typically 64ms for 4K rows, so each row refreshed every 15.6us).',
      hhCitation: 'H&H 10.3-10.5',
    },
  ],

  // ---- 09-data-conversion: H&H Ch.13 ----
  '09-data-conversion': [
    {
      level: DepthLevel.Practical,
      content: 'An ADC converts analog voltage to a digital number. More bits means finer resolution. The sampling rate must be at least twice the highest signal frequency (Nyquist rule).',
      hhCitation: 'H&H Ch.13',
    },
    {
      level: DepthLevel.Practical,
      content: 'A DAC converts a digital number back to analog voltage. Glitches during transitions can be smoothed with a sample-and-hold output stage.',
      hhCitation: 'H&H Ch.13',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H Ch.13 for ADC architectures (successive approximation, delta-sigma, flash), DAC topologies (R-2R ladder, current-steering), and quantization error analysis.',
      hhCitation: 'H&H Ch.13',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Resolution: LSB = V_ref / 2^n. Quantization noise: SNR_q = 6.02*n + 1.76 dB. Nyquist criterion: f_sample >= 2*f_max. Oversampling gain: +3dB SNR per doubling of sample rate. ENOB = (SINAD - 1.76)/6.02.',
      hhCitation: 'H&H Ch.13',
    },
    // Tier 3 depth markers (ENOB, precision converters, sample-and-hold)
    {
      level: DepthLevel.Practical,
      content: 'ENOB (effective number of bits) tells the real story of converter quality -- a 16-bit ADC with noisy layout might only give 13 effective bits of resolution',
      hhCitation: 'H&H Ch.13',
    },
    {
      level: DepthLevel.Practical,
      content: 'A sample-and-hold circuit freezes the input voltage on a capacitor so the ADC can take its time converting -- without it, the input could change during conversion and corrupt the result',
      hhCitation: 'H&H Ch.13',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 5.3 for precision converter techniques including auto-zero amplifiers, chopper stabilization, and multi-slope integration that achieve resolution beyond what quantization noise alone would predict',
      hhCitation: 'H&H Ch.13',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 13.4 for converter specifications: INL, DNL, SFDR, SINAD, ENOB, and how to interpret datasheets for ADC and DAC selection',
      hhCitation: 'H&H Ch.13',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 13.6 for sample-and-hold circuits, aperture jitter, droop rate, acquisition time, and the critical role of the hold capacitor in converter accuracy',
      hhCitation: 'H&H Ch.13',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'ENOB = (SINAD - 1.76) / 6.02. Ideal SNR_q = 6.02*N + 1.76 dB. S/H droop: V_droop = I_leak * T_hold / C_hold. Acquisition time: T_acq = -(R_on * C_hold) * ln(epsilon), where epsilon = V_error/V_step.',
      hhCitation: 'H&H Ch.13',
    },
  ],

  // ---- 10-dsp: H&H 13.5 ----
  '10-dsp': [
    {
      level: DepthLevel.Practical,
      content: 'Digital filtering processes sampled signals using math instead of analog components. You can design "impossible" filter shapes that no physical circuit could achieve.',
      hhCitation: 'H&H 13.5',
    },
    {
      level: DepthLevel.Practical,
      content: 'The FFT reveals which frequencies are present in a signal. Think of it as a prism that splits light into a spectrum, but for electronic signals.',
      hhCitation: 'H&H 13.5',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 13.5 for FIR and IIR filter design, the discrete Fourier transform, windowing functions, and the relationship between analog and digital filter specifications.',
      hhCitation: 'H&H 13.5',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'FIR output: y[n] = sum(h[k]*x[n-k], k=0..N-1). DFT: X[k] = sum(x[n]*exp(-j*2*pi*k*n/N), n=0..N-1). Z-transform: H(z) = Y(z)/X(z). IIR: y[n] = sum(b[k]*x[n-k]) - sum(a[k]*y[n-k]).',
      hhCitation: 'H&H 13.5',
    },
  ],

  // ---- 11-microcontrollers: H&H Ch.14-15 ----
  '11-microcontrollers': [
    {
      level: DepthLevel.Practical,
      content: 'A microcontroller is a tiny computer on a single chip with CPU, memory, and I/O peripherals. Program it to read sensors, control outputs, and communicate with other devices.',
      hhCitation: 'H&H Ch.14-15',
    },
    {
      level: DepthLevel.Practical,
      content: 'GPIO pins can be configured as digital input or output. Use pull-up or pull-down resistors on inputs to prevent floating (undefined) logic levels.',
      hhCitation: 'H&H Ch.14-15',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H Ch.14-15 for microcontroller architecture (Harvard vs von Neumann), peripheral configuration (GPIO, UART, SPI, I2C, ADC, timers), interrupt handling, and embedded programming patterns.',
      hhCitation: 'H&H Ch.14-15',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Baud rate: bits/second = f_clk / (prescaler * divisor). Timer period: T = (reload + 1) * (prescaler / f_clk). PWM duty cycle: D = compare_value / period_value. SPI clock: f_SPI = f_clk / (2 * (SPBRG + 1)).',
      hhCitation: 'H&H Ch.14-15',
    },
  ],

  // ---- 12-sensors-actuators: H&H Ch.5, Ch.12 ----
  '12-sensors-actuators': [
    {
      level: DepthLevel.Practical,
      content: 'Sensors convert physical quantities (temperature, light, pressure) into electrical signals. The signal is usually small and noisy, requiring amplification and filtering before the ADC.',
      hhCitation: 'H&H Ch.5',
    },
    {
      level: DepthLevel.Practical,
      content: 'A Wheatstone bridge detects tiny resistance changes in sensors (strain gauges, RTDs). Balance the bridge, then amplify the difference signal.',
      hhCitation: 'H&H Ch.5',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H Ch.5 for precision circuit techniques (auto-zero amplifiers, chopper stabilization, guard rings) and Ch.12 for practical construction methods, shielding, and grounding.',
      hhCitation: 'H&H Ch.5',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Wheatstone bridge: V_out = V_s * (R3/(R3+R4) - R1/(R1+R2)). Thermocouple: V = alpha * delta_T (Seebeck coefficient ~41uV/K for type K). RTD: R(T) = R_0 * (1 + alpha*T + beta*T^2).',
      hhCitation: 'H&H Ch.5',
    },
  ],

  // ---- 13-plc: IEC 61131-3 ----
  '13-plc': [
    {
      level: DepthLevel.Practical,
      content: 'A PLC (Programmable Logic Controller) is an industrial computer designed for harsh environments. It scans inputs, runs a program, and updates outputs in a repeating cycle.',
      hhCitation: 'IEC 61131-3',
    },
    {
      level: DepthLevel.Practical,
      content: 'Ladder logic looks like electrical relay diagrams. Contacts on the left represent conditions; coils on the right represent actions. Read left-to-right, top-to-bottom.',
      hhCitation: 'IEC 61131-3',
    },
    {
      level: DepthLevel.Reference,
      content: 'See IEC 61131-3 for the five standard PLC programming languages: Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Instruction List (IL), and Sequential Function Chart (SFC).',
      hhCitation: 'IEC 61131-3',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'PID control: u(t) = Kp*e(t) + Ki*integral(e(t)dt) + Kd*de(t)/dt. Discrete PID: u[n] = Kp*e[n] + Ki*T*sum(e[k]) + Kd*(e[n]-e[n-1])/T. Scan time: T_scan = T_input + T_execute + T_output.',
      hhCitation: 'IEC 61131-3',
    },
  ],

  // ---- 14-off-grid-power: H&H 9.8, Ch.9 ----
  '14-off-grid-power': [
    {
      level: DepthLevel.Practical,
      content: 'Solar cells produce current proportional to light intensity. They have a "sweet spot" voltage (MPP) where power output is maximized -- an MPPT controller finds and tracks this point.',
      hhCitation: 'H&H 9.8',
    },
    {
      level: DepthLevel.Practical,
      content: 'Battery charging requires careful voltage and current control. Overcharging damages batteries; deep discharging shortens their life. A charge controller manages both limits.',
      hhCitation: 'H&H Ch.9',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H 9.8 for solar cell I-V characteristics, maximum power point tracking algorithms (perturb-and-observe, incremental conductance), and energy harvesting circuit topologies.',
      hhCitation: 'H&H 9.8',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Solar cell: I = I_ph - I_s*(exp(V/(n*V_T))-1). Maximum power: P_mpp = V_mpp * I_mpp. Fill factor: FF = P_mpp/(V_oc*I_sc). MPPT efficiency: eta_mppt = P_actual/P_mpp. Battery capacity: C = I*t (Ah).',
      hhCitation: 'H&H 9.8',
    },
  ],

  // ---- 15-pcb-design: H&H Ch.12 ----
  '15-pcb-design': [
    {
      level: DepthLevel.Practical,
      content: 'Keep analog and digital grounds separate, joining them at a single point near the power supply. Ground loops cause noise and interference.',
      hhCitation: 'H&H Ch.12',
    },
    {
      level: DepthLevel.Practical,
      content: 'Place bypass capacitors as close to IC power pins as possible. Short, wide traces to the cap reduce parasitic inductance and improve high-frequency decoupling.',
      hhCitation: 'H&H Ch.12',
    },
    {
      level: DepthLevel.Reference,
      content: 'See H&H Ch.12 for PCB layout guidelines, controlled-impedance traces, ground plane design, EMI reduction techniques, thermal management, and component placement strategies.',
      hhCitation: 'H&H Ch.12',
    },
    {
      level: DepthLevel.Mathematical,
      content: 'Trace impedance (microstrip): Z_0 = (87/sqrt(e_r+1.41)) * ln(5.98*h/(0.8*w+t)). Skin depth: delta = sqrt(rho/(pi*f*mu)). Crosstalk: k = 1/(1+(d/h)^2). Thermal resistance: theta_JA = (T_J - T_A)/P_D.',
      hhCitation: 'H&H Ch.12',
    },
  ],
};
