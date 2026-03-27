/**
 * Safety Assessments
 *
 * Per-module assessment definitions and completion tracking.
 * Gate modules require 70% passing score, Redirect modules require 80%.
 * All questions use positive framing aligned with the Safety Warden.
 */

import type { SafetyAssessment } from '../warden.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface ModuleAssessment {
  moduleId: string;
  title: string;
  questions: AssessmentQuestion[];
  passingScore: number; // 0-1, e.g. 0.7 = 70%
}

// ---------------------------------------------------------------------------
// Assessment definitions — Gate modules (passingScore: 0.7)
// ---------------------------------------------------------------------------

const ASSESSMENTS: Map<string, ModuleAssessment> = new Map([
  [
    '04-diodes',
    {
      moduleId: '04-diodes',
      title: 'Diode Circuits Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '04-q1',
          text: 'What is the best practice for staying within a diode\'s safe operating limits?',
          options: [
            'Apply reverse voltage up to twice the rated maximum',
            'Verify the peak inverse voltage (PIV) stays below the diode\'s rated reverse voltage',
            'Use any diode for any voltage level',
            'Ignore datasheet ratings for low-current applications',
          ],
          correctIndex: 1,
        },
        {
          id: '04-q2',
          text: 'How can thermal runaway in diodes be effectively managed?',
          options: [
            'Ensure adequate heat sinking and airflow for power diodes',
            'Allow the junction temperature to self-regulate',
            'Thermal runaway only occurs in transistors',
            'Increase forward current to stabilize temperature',
          ],
          correctIndex: 0,
        },
        {
          id: '04-q3',
          text: 'What ensures proper forward biasing of a diode in a circuit?',
          options: [
            'Connect the cathode to the positive supply rail',
            'Apply voltage below the forward voltage threshold',
            'Connect the anode to the more positive potential with appropriate current limiting',
            'Use maximum supply voltage for fastest turn-on',
          ],
          correctIndex: 2,
        },
      ],
    },
  ],
  [
    '05-transistors',
    {
      moduleId: '05-transistors',
      title: 'Transistor Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '05-q1',
          text: 'How do you keep a transistor within its safe operating area (SOA)?',
          options: [
            'Operate at maximum voltage and maximum current simultaneously',
            'Verify that the combination of voltage, current, and duration stays within the SOA curve',
            'SOA only matters for high-power transistors above 100W',
            'Use the transistor at rated values with no derating',
          ],
          correctIndex: 1,
        },
        {
          id: '05-q2',
          text: 'What is the recommended approach for heat management in power transistors?',
          options: [
            'A properly sized heatsink with thermal compound at the junction',
            'Natural convection is sufficient for all transistor packages',
            'Mount the transistor directly on a PCB copper pour with no heatsink',
            'Let the package absorb all heat until thermal shutdown activates',
          ],
          correctIndex: 0,
        },
        {
          id: '05-q3',
          text: 'What is the best practice for protecting MOSFETs from electrostatic discharge?',
          options: [
            'MOSFETs have built-in ESD protection and require no precautions',
            'Use a grounded wrist strap and ESD-safe workstation when handling',
            'Store MOSFETs in regular plastic bags',
            'Touch the drain pin first to discharge any static',
          ],
          correctIndex: 1,
        },
      ],
    },
  ],
  [
    '06-op-amps',
    {
      moduleId: '06-op-amps',
      title: 'Op-Amp Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '06-q1',
          text: 'How do you ensure an op-amp operates within safe supply voltage limits?',
          options: [
            'Use the highest voltage available for maximum performance',
            'Verify that Vcc and Vee stay within the datasheet-specified supply range',
            'Op-amps regulate their own supply voltage internally',
            'Supply voltage does not affect op-amp reliability',
          ],
          correctIndex: 1,
        },
        {
          id: '06-q2',
          text: 'What is the best approach for preventing latch-up in CMOS op-amps?',
          options: [
            'Ensure input voltages stay within the specified common-mode range',
            'Latch-up is a digital logic issue, not an op-amp concern',
            'Apply input voltage before powering on the op-amp',
            'Use only bipolar op-amps to avoid the issue entirely',
          ],
          correctIndex: 0,
        },
        {
          id: '06-q3',
          text: 'What is a recommended practice for protecting op-amp inputs?',
          options: [
            'Op-amp inputs are self-protecting due to high impedance',
            'Add series resistance and clamp diodes at the input pins',
            'Drive inputs with low-impedance sources above the supply rails',
            'Leave unused inputs floating for minimal noise',
          ],
          correctIndex: 1,
        },
      ],
    },
  ],
  [
    '07-power-supplies',
    {
      moduleId: '07-power-supplies',
      title: 'Power Supply Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '07-q1',
          text: 'What is the recommended practice before servicing a power supply with large capacitors?',
          options: [
            'Capacitors discharge immediately when power is removed',
            'Use a discharge resistor or verify capacitors are fully discharged before handling',
            'Capacitor stored energy is minimal and safe to touch',
            'Only electrolytic capacitors store charge; film capacitors are safe',
          ],
          correctIndex: 1,
        },
        {
          id: '07-q2',
          text: 'How is inrush current best managed at power-on?',
          options: [
            'Inrush current is brief and self-limiting',
            'Use larger fuses to handle the surge',
            'Include an NTC thermistor or soft-start circuit to limit peak current',
            'Add a larger transformer to absorb the inrush',
          ],
          correctIndex: 2,
        },
        {
          id: '07-q3',
          text: 'What is the best approach for grounding in a power supply circuit?',
          options: [
            'Use a star ground topology connecting all ground returns to a single point',
            'Ground connections are interchangeable; routing does not matter',
            'Share ground paths between high-current and sensitive analog circuits',
            'Float the ground for best noise performance',
          ],
          correctIndex: 0,
        },
      ],
    },
  ],
  [
    '09-data-conversion',
    {
      moduleId: '09-data-conversion',
      title: 'Data Conversion Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '09-q1',
          text: 'What is the best approach for keeping ADC input signals within safe levels?',
          options: [
            'ADC inputs can accept any voltage without harm',
            'Use voltage dividers or clamping circuits to keep inputs within the reference range',
            'Input protection is only needed for high-speed ADCs',
            'Set the reference voltage higher than the expected signal',
          ],
          correctIndex: 1,
        },
        {
          id: '09-q2',
          text: 'How do you best protect ESD-sensitive ADC and DAC input pins?',
          options: [
            'ADC/DAC pins have built-in ESD diodes and require no external protection',
            'Use ESD-safe handling procedures and consider series resistors at I/O pins',
            'Ground yourself by touching the circuit board before handling',
            'ESD is only a concern during manufacturing, not prototyping',
          ],
          correctIndex: 1,
        },
        {
          id: '09-q3',
          text: 'What is the purpose of decoupling capacitors near data converter power pins?',
          options: [
            'They filter the converter output signal',
            'They provide local energy storage and reduce high-frequency supply noise',
            'Decoupling is optional for converters below 1 MHz',
            'They protect against power supply overvoltage',
          ],
          correctIndex: 1,
        },
      ],
    },
  ],
  [
    '10-dsp',
    {
      moduleId: '10-dsp',
      title: 'DSP and Mixed-Signal Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '10-q1',
          text: 'What is the recommended grounding practice for mixed-signal DSP circuits?',
          options: [
            'Connect analog and digital grounds at a single star point near the converter',
            'Use completely separate ground planes with no connection',
            'Route digital return current under analog traces for convenience',
            'Ground plane partitioning has minimal effect on DSP performance',
          ],
          correctIndex: 0,
        },
        {
          id: '10-q2',
          text: 'What is the best practice when probing high-speed DSP signals?',
          options: [
            'Use a standard 10x passive probe at any point',
            'Use matched-impedance probes with short ground leads to minimize signal distortion',
            'Probe directly at the IC pin with a long ground clip',
            'Probing technique does not affect measurement accuracy',
          ],
          correctIndex: 1,
        },
        {
          id: '10-q3',
          text: 'How is electromagnetic interference (EMI) best minimized in DSP circuits?',
          options: [
            'Use proper shielding, decoupling, and controlled-impedance routing',
            'EMI is only a concern at frequencies above 1 GHz',
            'Increase signal amplitude to overcome any interference',
            'Digital signals are inherently immune to EMI',
          ],
          correctIndex: 0,
        },
      ],
    },
  ],
  [
    '11-microcontrollers',
    {
      moduleId: '11-microcontrollers',
      title: 'Microcontroller Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '11-q1',
          text: 'What is the recommended approach for GPIO pin current limits?',
          options: [
            'GPIO pins can source unlimited current for short durations',
            'Check the datasheet for maximum source/sink current per pin and total port limits',
            'Current limiting is only needed for output pins',
            'All microcontroller GPIOs can safely drive LEDs directly without resistors',
          ],
          correctIndex: 1,
        },
        {
          id: '11-q2',
          text: 'How is reliable operation maintained when supply voltage dips temporarily?',
          options: [
            'Microcontrollers tolerate brownout conditions gracefully on their own',
            'Enable the brownout detector (BOD) to hold the MCU in reset during low voltage',
            'Add a large capacitor to ride through any voltage sag',
            'Brownout only matters for battery-powered devices',
          ],
          correctIndex: 1,
        },
        {
          id: '11-q3',
          text: 'What is the best practice for handling ESD on microcontroller I/O pins?',
          options: [
            'Internal ESD protection is sufficient for all environments',
            'Add external TVS diodes or ESD protection ICs on pins exposed to connectors or cables',
            'ESD protection is only needed for analog input pins',
            'Use higher supply voltage to improve ESD robustness',
          ],
          correctIndex: 1,
        },
      ],
    },
  ],
  [
    '12-sensors-actuators',
    {
      moduleId: '12-sensors-actuators',
      title: 'Sensors and Actuators Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '12-q1',
          text: 'What is the recommended practice for Wheatstone bridge excitation voltage?',
          options: [
            'Use maximum excitation for the strongest signal',
            'Match excitation voltage to the bridge sensor\'s rated specification to prevent self-heating',
            'Excitation voltage does not affect sensor accuracy',
            'AC excitation is always preferred over DC for safety',
          ],
          correctIndex: 1,
        },
        {
          id: '12-q2',
          text: 'How are flyback voltage spikes safely managed when driving inductive loads like motors?',
          options: [
            'Motor coils do not generate flyback voltage',
            'Use flyback diodes or snubber circuits across inductive loads',
            'Increase the transistor voltage rating to handle any spike',
            'Switch inductive loads slowly to prevent spikes',
          ],
          correctIndex: 1,
        },
        {
          id: '12-q3',
          text: 'What is the purpose of optocoupler isolation when interfacing sensors to a controller?',
          options: [
            'Optocouplers are only used for communication protocols',
            'They provide galvanic isolation, protecting the controller from high voltages on the sensor side',
            'Optocouplers improve signal speed and bandwidth',
            'Isolation is only needed for wireless sensor interfaces',
          ],
          correctIndex: 1,
        },
      ],
    },
  ],
  [
    '15-pcb-design',
    {
      moduleId: '15-pcb-design',
      title: 'PCB Design and Assembly Safety Fundamentals',
      passingScore: 0.7,
      questions: [
        {
          id: '15-q1',
          text: 'What is the recommended safety practice when soldering?',
          options: [
            'Soldering produces benign fumes that can be ignored',
            'Work in a well-ventilated area or use a fume extractor to avoid inhaling flux fumes',
            'Only lead-free solder produces harmful fumes',
            'A desk fan blowing across the board is sufficient',
          ],
          correctIndex: 1,
        },
        {
          id: '15-q2',
          text: 'How is flux fume exposure best reduced during hand assembly?',
          options: [
            'Use a dedicated fume extractor positioned near the soldering point',
            'Flux fumes dissipate immediately and pose minimal risk',
            'Hold your breath while applying solder',
            'Use the maximum soldering temperature to burn off flux quickly',
          ],
          correctIndex: 0,
        },
        {
          id: '15-q3',
          text: 'What is the best practice for an ESD-safe PCB assembly workspace?',
          options: [
            'Any clean desk surface is suitable for PCB work',
            'Use an ESD mat, grounded wrist strap, and proper storage for components',
            'Rubber-soled shoes are sufficient ESD protection',
            'ESD precautions are only needed for high-speed digital ICs',
          ],
          correctIndex: 1,
        },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // Redirect modules (passingScore: 0.8)
  // -------------------------------------------------------------------------
  [
    '13-plc',
    {
      moduleId: '13-plc',
      title: 'PLC and Industrial Control Safety Fundamentals',
      passingScore: 0.8,
      questions: [
        {
          id: '13-q1',
          text: 'What is the purpose of lockout/tagout (LOTO) procedures in industrial settings?',
          options: [
            'They label equipment for inventory tracking',
            'They ensure energy sources are isolated and de-energized before servicing',
            'LOTO is a documentation-only requirement',
            'They speed up maintenance by pre-staging tools',
          ],
          correctIndex: 1,
        },
        {
          id: '13-q2',
          text: 'How is arc flash risk effectively managed when working on industrial panels?',
          options: [
            'Arc flash only occurs in panels above 10 kV',
            'Wear appropriate PPE and follow arc flash boundary procedures per NFPA 70E',
            'Stand at arm\'s length from the panel for sufficient protection',
            'Arc flash is handled by the circuit breaker automatically',
          ],
          correctIndex: 1,
        },
        {
          id: '13-q3',
          text: 'What is the recommended approach for emergency stop systems in PLC applications?',
          options: [
            'E-stops should be software-controlled for flexibility',
            'Design hardwired e-stop circuits that achieve a safe state independently of the PLC program',
            'A single e-stop button per facility is sufficient',
            'E-stops are optional if the PLC has a watchdog timer',
          ],
          correctIndex: 1,
        },
        {
          id: '13-q4',
          text: 'What is the best grounding practice for industrial control cabinets?',
          options: [
            'Use a dedicated equipment grounding conductor bonded to the cabinet and connected to the facility ground bus',
            'The DIN rail provides sufficient grounding for all components',
            'Industrial equipment operates at safe voltages and does not require grounding',
            'Ground only the PLC processor; I/O modules float by design',
          ],
          correctIndex: 0,
        },
      ],
    },
  ],
  [
    '14-off-grid-power',
    {
      moduleId: '14-off-grid-power',
      title: 'Off-Grid Power Systems Safety Fundamentals',
      passingScore: 0.8,
      questions: [
        {
          id: '14-q1',
          text: 'What is the purpose of a DC disconnect switch in a solar power system?',
          options: [
            'It optimizes panel output voltage',
            'It provides a means to safely isolate the DC source for maintenance and emergency shutdown',
            'DC disconnects are only required for systems above 48V',
            'The inverter handles all disconnection automatically',
          ],
          correctIndex: 1,
        },
        {
          id: '14-q2',
          text: 'What is the recommended practice for battery bank ventilation?',
          options: [
            'Sealed batteries produce no gases under any conditions',
            'Ensure adequate ventilation to safely dissipate hydrogen gas from charging, especially for flooded lead-acid',
            'Ventilation is only needed in temperatures above 40 C',
            'An enclosed insulated battery box maximizes performance and safety',
          ],
          correctIndex: 1,
        },
        {
          id: '14-q3',
          text: 'How is conductor sizing determined for a DC power system?',
          options: [
            'Use the same wire gauge for all DC connections',
            'Size conductors based on maximum expected current, voltage drop limits, and NEC ampacity tables',
            'DC circuits require thinner wire than AC for the same current',
            'Conductor sizing only matters for runs longer than 50 feet',
          ],
          correctIndex: 1,
        },
        {
          id: '14-q4',
          text: 'What code governs residential and commercial solar installations in the United States?',
          options: [
            'There is no specific code for solar installations',
            'NEC Article 690 (Solar Photovoltaic Systems) and Article 705 (Interconnected Power Sources)',
            'OSHA construction standards only',
            'Local building permits replace the need for electrical code compliance',
          ],
          correctIndex: 1,
        },
      ],
    },
  ],
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up the safety assessment for a module.
 * Returns null for Annotate modules (no assessment needed).
 */
export function getAssessment(moduleId: string): ModuleAssessment | null {
  return ASSESSMENTS.get(moduleId) ?? null;
}

/**
 * Tracks assessment completion per module.
 * Only passing submissions are stored.
 */
export class AssessmentTracker {
  private completions: Map<string, SafetyAssessment> = new Map();

  /**
   * Grade a set of answers against the module assessment.
   * @param moduleId - the module being assessed
   * @param answers - array of selected option indices (one per question)
   * @returns SafetyAssessment result with pass/fail and score
   * @throws Error if no assessment exists for the given moduleId
   */
  submit(moduleId: string, answers: number[]): SafetyAssessment {
    const assessment = getAssessment(moduleId);
    if (!assessment) {
      throw new Error(`No assessment exists for module: ${moduleId}`);
    }

    let correct = 0;
    for (let i = 0; i < assessment.questions.length; i++) {
      if (answers[i] === assessment.questions[i].correctIndex) {
        correct++;
      }
    }

    const score = correct / assessment.questions.length;
    const passed = score >= assessment.passingScore;

    const result: SafetyAssessment = {
      moduleId,
      passed,
      score,
      timestamp: Date.now(),
      questions: assessment.questions.length,
      correct,
    };

    if (passed) {
      this.completions.set(moduleId, result);
    }

    return result;
  }

  /** Check whether a module has been passed. */
  isCompleted(moduleId: string): boolean {
    return this.completions.has(moduleId);
  }

  /** Return all passing completions. */
  getCompletions(): SafetyAssessment[] {
    return [...this.completions.values()];
  }
}
