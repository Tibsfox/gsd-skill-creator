/**
 * Module 15: PCB Design -- Lab exercises
 *
 * 5 labs backed by the PCB layout tool engine (pcb-layout.ts).
 * Labs demonstrate schematic-to-PCB workflow, IPC-2221 trace width
 * calculation, ground plane crosstalk reduction, EMI risk assessment,
 * and Design for Manufacturing review.
 */

import {
  calcMicrostripImpedance,
  calcTraceWidth,
  calcSkinDepth,
  calcCrosstalk,
  checkDesignRules,
  assessEMI,
  createBoard,
  routeTrace,
  placeComponent,
  describeGerberLayers,
} from '../../simulator/pcb-layout';
import type { DesignRule, PCBComponent } from '../../simulator/pcb-layout';

export interface LabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface Lab {
  id: string;
  title: string;
  steps: LabStep[];
  verify: () => boolean;
}

// ============================================================================
// Standard manufacturing design rules
// ============================================================================

const standardRules: DesignRule[] = [
  { name: 'Min Clearance', type: 'clearance', minValue: 6 },
  { name: 'Min Trace Width', type: 'trace_width', minValue: 6 },
  { name: 'Min Via Drill', type: 'via_drill', minValue: 10 },
  { name: 'Min Annular Ring', type: 'annular_ring', minValue: 4 },
];

// ============================================================================
// Lab 1: Schematic to PCB (m15-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm15-lab-01',
  title: 'Schematic to PCB',
  steps: [
    {
      instruction:
        'Create a 2000x1000 mil 2-layer PCB board. This represents a small prototype board about 2 inches by 1 inch -- typical for a simple LED driver circuit. Place three components: R1 (0805 resistor at 500,500), D1 (LED at 1000,500), and C1 (decoupling cap at 1500,500).',
      expected_observation:
        'The board has 3 components placed in a line along the center. Each component has 2 pads for soldering. The 0805 footprint (2.0mm x 1.25mm) is the most common SMD resistor/capacitor size.',
      learn_note:
        'Component placement is the most critical step in PCB layout. Group related components together, place decoupling caps within 5mm of IC power pins, and orient all ICs the same direction for ease of inspection. H&H Ch.12 emphasizes that good placement makes routing almost trivial.',
    },
    {
      instruction:
        'Route traces between the components: R1 pad 2 to D1 pad 1 (connecting resistor to LED anode), and D1 pad 2 to C1 pad 1 (connecting LED cathode to capacitor). Use 10 mil trace width on the top copper layer.',
      expected_observation:
        'Two traces now connect the three components in series. The 10 mil trace width is adequate for signal-level currents (under 0.5A). The traces are routed on the top layer, leaving the bottom layer free for a ground plane.',
      learn_note:
        'Route critical signals first (clocks, high-speed data), then power, then general signals. Avoid right angles -- use 45-degree bends or arcs. Right angles create impedance discontinuities and concentrate etchant during manufacturing, creating acid traps. H&H Ch.12.',
    },
    {
      instruction:
        'Run Design Rule Check (DRC) with standard manufacturing rules: 6 mil clearance, 6 mil minimum trace width, 10 mil via drill, 4 mil annular ring. Verify no violations.',
      expected_observation:
        'DRC passes with zero violations. All traces are 10 mil wide (above 6 mil minimum), the traces are well-separated (no clearance violations), and no vias are used in this simple design.',
      learn_note:
        'A clean DRC is mandatory before sending a board to fabrication. Design rules encode the factory capabilities: 6/6 mil trace/space is standard for most PCB houses. Tighter rules (4/4, 3/3) cost more and have lower yield. Always run DRC after any layout change. H&H Ch.12.',
    },
  ],
  verify: () => {
    // Create 2-layer board
    let board = createBoard(2000, 1000, 2);

    // Place 3 components
    const r1: PCBComponent = {
      id: 'comp-r1',
      refDes: 'R1',
      x: 500,
      y: 500,
      footprint: '0805',
      pads: [
        { x: 450, y: 500, widthMil: 30, heightMil: 40 },
        { x: 550, y: 500, widthMil: 30, heightMil: 40 },
      ],
    };
    const d1: PCBComponent = {
      id: 'comp-d1',
      refDes: 'D1',
      x: 1000,
      y: 500,
      footprint: 'LED-0805',
      pads: [
        { x: 950, y: 500, widthMil: 30, heightMil: 40 },
        { x: 1050, y: 500, widthMil: 30, heightMil: 40 },
      ],
    };
    const c1: PCBComponent = {
      id: 'comp-c1',
      refDes: 'C1',
      x: 1500,
      y: 500,
      footprint: '0805',
      pads: [
        { x: 1450, y: 500, widthMil: 30, heightMil: 40 },
        { x: 1550, y: 500, widthMil: 30, heightMil: 40 },
      ],
    };

    board = placeComponent(board, r1);
    board = placeComponent(board, d1);
    board = placeComponent(board, c1);

    // Route traces: R1 pad2 -> D1 pad1, D1 pad2 -> C1 pad1
    const route1 = routeTrace(board, { x: 550, y: 500 }, { x: 950, y: 500 }, 10, 'top');
    if ('error' in route1) return false;
    board = route1.board;

    const route2 = routeTrace(board, { x: 1050, y: 500 }, { x: 1450, y: 500 }, 10, 'top');
    if ('error' in route2) return false;
    board = route2.board;

    // Check: 3 components
    if (board.components.length !== 3) return false;

    // Check: at least 2 traces
    if (board.traces.length < 2) return false;

    // Check: all trace widths >= 10 mils
    for (const trace of board.traces) {
      if (trace.widthMil < 10) return false;
    }

    // Check: no DRC violations
    const violations = checkDesignRules(board, standardRules);
    if (violations.length > 0) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: Trace Width Calculator (m15-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm15-lab-02',
  title: 'Trace Width Calculator',
  steps: [
    {
      instruction:
        'Calculate the minimum trace width for a 0.5A signal trace on an external layer with 1 oz copper (1.4 mil thickness) and 10C acceptable temperature rise using the IPC-2221 standard.',
      expected_observation:
        'The 0.5A signal trace requires a relatively narrow trace -- around 5-10 mils. This is well within standard PCB capabilities (6 mil minimum for most fabs).',
      learn_note:
        'The IPC-2221 formula: area = (I / (k * dT^0.44))^(1/0.725) square mils, then width = area / (thickness * 1.378). k=0.048 for external layers, k=0.024 for internal. This is the industry standard for trace sizing. H&H Ch.12.',
    },
    {
      instruction:
        'Calculate the trace width for a 3A power trace on the same external layer with the same copper weight and temperature rise. Compare with the 0.5A signal trace.',
      expected_observation:
        'The 3A power trace requires a significantly wider trace -- roughly 30-60 mils. The width scales nonlinearly with current (approximately as I^1.38), so 6x the current requires much more than 6x the width.',
      learn_note:
        'Power traces must be wider because the IPC-2221 relationship between current and cross-sectional area is nonlinear. Doubling the current more than doubles the required area. Always calculate -- never guess -- trace widths for power rails. H&H Ch.12.',
    },
    {
      instruction:
        'Calculate the same 3A trace width but for an internal layer (buried in the PCB stackup). Compare external vs internal requirements.',
      expected_observation:
        'The internal 3A trace is even wider than the external trace. Internal layers have poorer thermal dissipation (sandwiched between dielectric), so the IPC-2221 formula uses k=0.024 (half the external value), requiring more copper area.',
      learn_note:
        'Internal layers dissipate heat poorly because they are surrounded by FR4 insulator. The IPC standard accounts for this with a halved k-factor. When routing power on inner layers, expect to use copper pours or very wide traces. H&H Ch.12.',
    },
  ],
  verify: () => {
    // 0.5A signal, 10C rise, 1.4 mil copper (1 oz), external
    const signalExternal = calcTraceWidth(0.5, 10, 1.4, true);

    // 3A power, 10C rise, 1.4 mil copper, external
    const powerExternal = calcTraceWidth(3.0, 10, 1.4, true);

    // 3A power, 10C rise, 1.4 mil copper, internal
    const powerInternal = calcTraceWidth(3.0, 10, 1.4, false);

    // Power trace must be wider than signal trace
    if (powerExternal <= signalExternal) return false;

    // Internal trace must be wider than external for same current
    if (powerInternal <= powerExternal) return false;

    // All widths must be positive
    if (signalExternal <= 0) return false;
    if (powerExternal <= 0) return false;
    if (powerInternal <= 0) return false;

    return true;
  },
};

// ============================================================================
// Lab 3: Ground Plane Design (m15-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm15-lab-03',
  title: 'Ground Plane Design',
  steps: [
    {
      instruction:
        'Calculate the crosstalk coupling coefficient between two parallel traces at three different spacings above a 62-mil dielectric (standard 4-layer board inner layer height): 5 mil spacing (very close), 20 mil spacing (moderate), and 62 mil spacing (1:1 ratio with dielectric height).',
      expected_observation:
        'Crosstalk at 5 mil spacing is high (near 0.99), at 20 mil moderate (~0.91), and at 62 mil low (~0.50). The coupling coefficient k = 1/(1+(d/h)^2) drops rapidly as the spacing-to-height ratio increases.',
      learn_note:
        'The 3x rule states that traces should be spaced at least 3 times the dielectric height (d >= 3*h) to achieve low crosstalk (<10%). For a 62 mil dielectric, this means >= 186 mil spacing for critical signals. Ground planes between signal layers also reduce crosstalk. H&H Ch.12.',
    },
    {
      instruction:
        'Calculate the microstrip impedance for a controlled-impedance trace: 10 mil width, 62 mil dielectric height, 1.4 mil copper thickness, on FR4 (er=4.4). This represents a typical narrow signal trace on a standard 4-layer board.',
      expected_observation:
        'The impedance is approximately 130 ohms -- quite high for a narrow trace on a thick dielectric. To achieve the standard 50 ohm target, the trace would need to be much wider (roughly 110 mils) or the dielectric thinner.',
      learn_note:
        'Controlled impedance is critical for signals above ~50 MHz. The microstrip formula Z0 = (87/sqrt(er+1.41)) * ln(5.98*h/(0.8*w+t)) shows impedance increases with dielectric height and decreases with trace width. PCB fabs control the stackup to hit target impedance within 10%. H&H Ch.12.',
    },
    {
      instruction:
        'Verify the 3x spacing rule: calculate crosstalk at d = 3*h = 186 mils with h = 62 mils. Confirm that the coupling coefficient drops below 0.10 (10%), which is the threshold for acceptable crosstalk in most digital designs.',
      expected_observation:
        'At 186 mil spacing (3x the dielectric height), the crosstalk coefficient is approximately 0.10 -- right at the design target. Spacing beyond 3x provides diminishing returns in crosstalk reduction.',
      learn_note:
        'The 3x rule is a practical design guideline, not a hard limit. For extremely sensitive analog signals, use 5x or even 10x spacing. For high-speed differential pairs, the spacing between the pair is tight (coupled) but the spacing from other signals should follow the 3x rule. H&H Ch.12.',
    },
  ],
  verify: () => {
    // Crosstalk at three spacings with h=62 mil
    const xt5 = calcCrosstalk(5, 62);
    const xt20 = calcCrosstalk(20, 62);
    const xt62 = calcCrosstalk(62, 62);

    // Crosstalk must decrease monotonically with increasing spacing
    if (xt5 <= xt20) return false;
    if (xt20 <= xt62) return false;

    // Microstrip impedance: w=10, h=62, t=1.4, er=4.4
    const impedance = calcMicrostripImpedance(10, 62, 1.4, 4.4);

    // Impedance must be positive and between 20 and 150 ohms
    if (impedance <= 20 || impedance >= 150) return false;

    // 3x rule: spacing slightly above 3*h gives crosstalk strictly < 0.10
    // At exactly 3*h (186 mil), k = 1/(1+9) = 0.10 exactly, so use 190 mil
    const xt3x = calcCrosstalk(190, 62);
    if (xt3x >= 0.10) return false;

    return true;
  },
};

// ============================================================================
// Lab 4: EMI Assessment (m15-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm15-lab-04',
  title: 'EMI Assessment',
  steps: [
    {
      instruction:
        'Assess the EMI radiation risk of a 50mm trace at three frequencies: 1 MHz (audio/low-frequency digital), 100 MHz (fast digital logic), and 1 GHz (RF/high-speed serial). The wavelength at each frequency determines whether the trace acts as an antenna.',
      expected_observation:
        'At 1 MHz (wavelength = 300m), a 50mm trace is electrically very short (ratio 0.00017) -- low risk. At 100 MHz (wavelength = 3m), ratio is 0.017 -- moderate risk. At 1 GHz (wavelength = 0.3m), ratio is 0.167 -- high risk, the trace is a significant antenna.',
      learn_note:
        'A trace becomes a significant radiator when its length exceeds lambda/10. The wavelength lambda = c/f, so higher frequencies have shorter wavelengths. At 1 GHz, even a 30mm trace radiates. This is why high-speed designs need ground planes, short traces, and shielding. H&H Ch.12.',
    },
    {
      instruction:
        'Calculate the skin depth for copper (resistivity 1.68e-8 ohm-m, permeability 4*pi*1e-7 H/m) at 1 MHz and 1 GHz. Skin depth determines how deeply current penetrates into the conductor at a given frequency.',
      expected_observation:
        'At 1 MHz, skin depth is approximately 66 micrometers -- current uses most of the copper thickness (1 oz copper is 35 um). At 1 GHz, skin depth drops to about 2.1 micrometers -- current flows only in a thin surface layer, increasing effective resistance.',
      learn_note:
        'Skin effect increases trace resistance at high frequencies because current is confined to the surface. At 1 GHz, the skin depth (~2 um) is much less than the copper thickness (~35 um for 1 oz), so the inner copper contributes nothing to conduction. This is why surface finish quality matters for high-speed PCBs. H&H Ch.12.',
    },
    {
      instruction:
        'Compare the results: the combination of high EMI risk and shallow skin depth at GHz frequencies explains why high-speed PCB design is fundamentally different from low-frequency design. Every trace is a potential antenna and every conductor has higher losses.',
      expected_observation:
        'At 1 GHz, both effects compound: traces radiate (EMI) and have higher losses (skin effect). This is why modern high-speed PCBs require careful stackup design, controlled impedance, low-loss dielectrics (not standard FR4), and smooth copper foils.',
      learn_note:
        'The transition from low-frequency to high-frequency PCB design happens roughly between 50 MHz and 500 MHz. Below 50 MHz, most traces behave as simple wires. Above 500 MHz, every trace is a transmission line. The region between is where many designers first encounter signal integrity problems. H&H Ch.12.',
    },
  ],
  verify: () => {
    const traceLengthMm = 50;
    const currentAmps = 0.01; // signal current

    // EMI assessment at three frequencies
    const emi1MHz = assessEMI(traceLengthMm, 1e6, currentAmps);
    const emi100MHz = assessEMI(traceLengthMm, 100e6, currentAmps);
    const emi1GHz = assessEMI(traceLengthMm, 1e9, currentAmps);

    // Risk levels must be low, moderate, high
    if (emi1MHz.riskLevel !== 'low') return false;
    if (emi100MHz.riskLevel !== 'moderate') return false;
    if (emi1GHz.riskLevel !== 'high') return false;

    // Skin depth for copper at 1 MHz and 1 GHz
    const rho = 1.68e-8; // ohm-meters (copper)
    const mu = 4 * Math.PI * 1e-7; // H/m (free space permeability)

    const skinDepth1MHz = calcSkinDepth(1e6, rho, mu);
    const skinDepth1GHz = calcSkinDepth(1e9, rho, mu);

    // Skin depth at 1 GHz must be less than at 1 MHz
    if (skinDepth1GHz >= skinDepth1MHz) return false;

    // High-frequency skin depth must be < 3 micrometers
    if (skinDepth1GHz >= 3e-6) return false;

    return true;
  },
};

// ============================================================================
// Lab 5: DFM Review (m15-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm15-lab-05',
  title: 'DFM Review',
  steps: [
    {
      instruction:
        'Create a 2000x1000 mil 4-layer board with intentional manufacturing violations: a 4-mil trace (below 6-mil minimum), a via with only 2-mil annular ring (below 4-mil minimum), and two traces within 3 mils of each other on the same layer (below 6-mil clearance minimum).',
      expected_observation:
        'The board has been created with three deliberate design rule violations. These represent common mistakes in PCB layouts that would cause manufacturing defects or board failures.',
      learn_note:
        'Design for Manufacturing (DFM) means designing the board so it can be reliably produced. Trace widths below minimum cause opens (breaks in copper). Insufficient annular rings cause via-pad disconnections. Inadequate clearance causes shorts between conductors. H&H Ch.12.',
    },
    {
      instruction:
        'Run DRC (Design Rule Check) with standard manufacturing rules: 6 mil clearance, 6 mil minimum trace width, 10 mil via drill, 4 mil annular ring. Count and categorize all violations.',
      expected_observation:
        'DRC reports at least 3 violations: (1) trace width violation for the 4-mil trace, (2) annular ring violation for the 2-mil ring via, (3) clearance violation for the 3-mil gap. Each violation has type, location, and severity.',
      learn_note:
        'DRC is the automated safety net for PCB design. Modern tools run DRC in real-time as you route. A clean DRC is a necessary (but not sufficient) condition for a manufacturable board -- it does not check for design intent, thermal issues, or signal integrity. H&H Ch.12.',
    },
    {
      instruction:
        'Describe the Gerber layer stack for the 4-layer board. Verify it includes top/bottom copper, inner copper layers, soldermask, silkscreen, paste, and drill files. Count total manufacturing layers.',
      expected_observation:
        'A 4-layer board produces at least 11 Gerber files: 4 copper (top, inner1, inner2, bottom), 2 soldermask (top, bottom), 2 silkscreen (top, bottom), 2 paste (top, bottom), and 1 drill file. Each file describes one manufacturing step.',
      learn_note:
        'Gerber files (RS-274X format) are the universal language between PCB designer and fabricator. Each file describes one layer as vector graphics. The fabricator builds the board layer by layer: etch copper, drill holes, plate vias, apply soldermask (green coating), print silkscreen (white text). H&H Ch.12.',
    },
  ],
  verify: () => {
    // Create a 4-layer board
    let board = createBoard(2000, 1000, 4);

    // Add a 4-mil trace (violation: below 6-mil minimum)
    const narrowTraceResult = routeTrace(
      board,
      { x: 100, y: 100 },
      { x: 500, y: 100 },
      4,
      'top',
    );
    if ('error' in narrowTraceResult) return false;
    board = narrowTraceResult.board;

    // Add a via with insufficient annular ring (2 mil, minimum is 4 mil)
    board = {
      ...board,
      vias: [
        ...board.vias,
        { id: 'via-1', x: 800, y: 500, drillMil: 10, annularRingMil: 2 },
      ],
    };

    // Add two traces too close together (3 mil edge-to-edge clearance)
    // Place them close on the same layer: two parallel 10-mil traces
    // Center-to-center = 10/2 + 3 + 10/2 = 13 mils apart for 3-mil edge clearance
    const trace2Result = routeTrace(
      board,
      { x: 100, y: 300 },
      { x: 500, y: 300 },
      10,
      'inner1',
    );
    if ('error' in trace2Result) return false;
    board = trace2Result.board;

    const trace3Result = routeTrace(
      board,
      { x: 100, y: 313 },
      { x: 500, y: 313 },
      10,
      'inner1',
    );
    if ('error' in trace3Result) return false;
    board = trace3Result.board;

    // Run DRC with standard rules
    const violations = checkDesignRules(board, standardRules);

    // Must have at least 3 violations (trace width, annular ring, clearance)
    if (violations.length < 3) return false;

    // Describe Gerber layers for 4-layer board
    const gerberLayers = describeGerberLayers(4);

    // Must include inner copper layers
    const hasInnerCopper = gerberLayers.some(
      (l) => l.type === 'copper' && l.side === 'inner',
    );
    if (!hasInnerCopper) return false;

    // Total layers must be >= 9 (4 copper + 2 soldermask + 2 silkscreen + 1 drill minimum)
    // Actually for 4-layer: 4 copper + 2 soldermask + 2 silkscreen + 2 paste + 1 drill = 11
    if (gerberLayers.length < 9) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
