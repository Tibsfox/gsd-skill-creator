/**
 * Medical conditions database for the Physical Safety Warden.
 *
 * Defines 10 medical conditions with specific contraindicated movements,
 * safe modifications, and alternative practices. All modifications use
 * positive framing ("Try this instead") rather than negative prohibitions.
 *
 * @module departments/mind-body/safety/medical-conditions
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single modification for a contraindicated technique. */
export interface Modification {
  /** The contraindicated technique or movement pattern */
  technique: string;

  /** The positive-framed modification to offer instead */
  alternative: string;

  /** Brief explanation of why this modification helps */
  reason: string;
}

/** A medical condition with contraindications and modifications. */
export interface MedicalCondition {
  /** Unique condition identifier */
  id: string;

  /** Human-readable condition name */
  name: string;

  /** Brief description of the condition */
  description: string;

  /** Movement patterns or techniques that are contraindicated */
  contraindicatedMovements: string[];

  /** Positive-framed modifications for safe practice */
  modifications: Modification[];

  /** Safe alternative practices */
  safeAlternatives: string[];
}

// ─── Conditions Database ────────────────────────────────────────────────────

export const medicalConditions: Map<string, MedicalCondition> = new Map([
  [
    'lower-back-pain',
    {
      id: 'lower-back-pain',
      name: 'Lower Back Pain',
      description:
        'Chronic or acute pain in the lumbar region, often aggravated by deep flexion or twisting.',
      contraindicatedMovements: [
        'deep forward fold',
        'deep twist',
        'seated forward bend',
        'full wheel',
        'plow pose',
        'standing toe touch',
      ],
      modifications: [
        {
          technique: 'deep forward fold',
          alternative:
            'Try a supported forward fold with knees generously bent and hands on blocks',
          reason: 'Reduces strain on the lumbar spine while preserving the hamstring stretch',
        },
        {
          technique: 'deep twist',
          alternative:
            'Try a gentle seated twist with the spine tall, rotating only as far as comfortable',
          reason: 'Maintains spinal mobility without compressing the lower vertebrae',
        },
        {
          technique: 'seated forward bend',
          alternative:
            'Try a reclined hamstring stretch with a strap, keeping the back flat on the floor',
          reason: 'Eliminates spinal load while effectively stretching the hamstrings',
        },
      ],
      safeAlternatives: [
        'Cat-cow gentle spinal mobilization',
        'Supported bridge pose',
        'Diaphragmatic breathing in supine position',
      ],
    },
  ],
  [
    'knee-injury',
    {
      id: 'knee-injury',
      name: 'Knee Injury',
      description:
        'Damage to knee ligaments, cartilage, or meniscus requiring movement modification.',
      contraindicatedMovements: [
        'deep knee bend',
        'lotus pose',
        'full squat',
        'hero pose',
        'pigeon pose',
        'kneeling lunge',
      ],
      modifications: [
        {
          technique: 'deep knee bend',
          alternative:
            'Try a shallow knee bend (no more than 90 degrees) with awareness of alignment',
          reason: 'Reduces shear force on the knee joint',
        },
        {
          technique: 'lotus pose',
          alternative:
            'Try a simple cross-legged seat or sit in a chair with feet flat on the floor',
          reason: 'Eliminates rotational stress on the knee ligaments',
        },
        {
          technique: 'full squat',
          alternative:
            'Try a chair-supported squat, lowering only as far as comfortable',
          reason: 'Allows strength building without excessive joint loading',
        },
      ],
      safeAlternatives: [
        'Chair-based yoga modifications',
        'Seated meditation',
        'Upper body breathwork practices',
      ],
    },
  ],
  [
    'pregnancy',
    {
      id: 'pregnancy',
      name: 'Pregnancy',
      description:
        'Requires avoiding prone positions, inversions, and deep twists to protect mother and child.',
      contraindicatedMovements: [
        'prone position',
        'deep twist',
        'inversion',
        'hot yoga',
        'full backbend',
        'intense core work',
      ],
      modifications: [
        {
          technique: 'prone position',
          alternative:
            'Try side-lying or hands-and-knees position as an alternative base',
          reason: 'Avoids compression of the abdomen while maintaining practice options',
        },
        {
          technique: 'deep twist',
          alternative:
            'Try an open twist (rotating away from the bent knee) with gentle range',
          reason: 'Preserves spinal mobility without compressing the uterus',
        },
        {
          technique: 'inversion',
          alternative:
            'Try legs-up-the-wall pose (after first trimester clearance with provider)',
          reason: 'Provides mild inversion benefits with full stability and support',
        },
      ],
      safeAlternatives: [
        'Prenatal yoga sequences',
        'Gentle diaphragmatic breathing',
        'Seated meditation',
      ],
    },
  ],
  [
    'high-blood-pressure',
    {
      id: 'high-blood-pressure',
      name: 'High Blood Pressure',
      description:
        'Hypertension requiring avoidance of movements that spike blood pressure.',
      contraindicatedMovements: [
        'inversion',
        'breath holding',
        'headstand',
        'shoulderstand',
        'intense breath of fire',
      ],
      modifications: [
        {
          technique: 'inversion',
          alternative:
            'Try standing forward fold with head supported on a block or chair seat',
          reason: 'Provides a mild inversion effect without raising intracranial pressure',
        },
        {
          technique: 'breath holding',
          alternative:
            'Try extended exhalation breathing (inhale 4, exhale 6-8) without any holds',
          reason:
            'Activates the parasympathetic response and may help lower blood pressure safely',
        },
        {
          technique: 'headstand',
          alternative:
            'Try mountain pose with gentle upward reach for a grounding, stabilizing practice',
          reason: 'Provides centering and alignment without elevating blood pressure',
        },
      ],
      safeAlternatives: [
        'Gentle tai chi movements',
        'Diaphragmatic breathing',
        'Body scan meditation',
      ],
    },
  ],
  [
    'carpal-tunnel',
    {
      id: 'carpal-tunnel',
      name: 'Carpal Tunnel Syndrome',
      description:
        'Nerve compression in the wrist aggravated by weight-bearing on the hands.',
      contraindicatedMovements: [
        'weight bearing on wrists',
        'plank pose',
        'downward dog',
        'push-up position',
        'handstand',
      ],
      modifications: [
        {
          technique: 'weight bearing on wrists',
          alternative:
            'Try weight-bearing on fists or forearms instead of open palms',
          reason: 'Maintains a neutral wrist position, reducing nerve compression',
        },
        {
          technique: 'plank pose',
          alternative:
            'Try forearm plank, which eliminates wrist extension entirely',
          reason: 'Preserves the core-strengthening benefit without wrist strain',
        },
        {
          technique: 'downward dog',
          alternative:
            'Try dolphin pose (forearm-based) or use yoga wedges under the heels of the hands',
          reason: 'Reduces the angle of wrist extension while maintaining the stretch',
        },
      ],
      safeAlternatives: [
        'Forearm-based poses',
        'Standing balance poses',
        'Breathwork and meditation',
      ],
    },
  ],
  [
    'shoulder-impingement',
    {
      id: 'shoulder-impingement',
      name: 'Shoulder Impingement',
      description:
        'Compression of rotator cuff tendons aggravated by overhead movements.',
      contraindicatedMovements: [
        'overhead movement',
        'full arm raise',
        'upward salute',
        'wheel pose',
        'full chaturanga',
      ],
      modifications: [
        {
          technique: 'overhead movement',
          alternative:
            'Try keeping arms at or below shoulder height with palms facing inward',
          reason: 'Reduces impingement in the subacromial space',
        },
        {
          technique: 'full arm raise',
          alternative:
            'Try cactus arms (elbows bent at 90 degrees, upper arms at shoulder height)',
          reason: 'Maintains shoulder engagement within a safe range of motion',
        },
        {
          technique: 'full chaturanga',
          alternative:
            'Try knees-down chaturanga with elbows close to the body',
          reason: 'Reduces load on the shoulder joint while building strength',
        },
      ],
      safeAlternatives: [
        'Gentle shoulder circles below pain threshold',
        'Lower body standing poses',
        'Seated meditation and breathwork',
      ],
    },
  ],
  [
    'sciatica',
    {
      id: 'sciatica',
      name: 'Sciatica',
      description:
        'Sciatic nerve irritation causing pain from the lower back through the leg.',
      contraindicatedMovements: [
        'forward fold',
        'piriformis stretch',
        'seated toe touch',
        'straight leg raise',
        'deep hamstring stretch',
      ],
      modifications: [
        {
          technique: 'forward fold',
          alternative:
            'Try a gentle supine knee-to-chest stretch, one leg at a time',
          reason: 'Relieves sciatic tension without loading the nerve through spinal flexion',
        },
        {
          technique: 'piriformis stretch',
          alternative:
            'Try a figure-four stretch lying on the back with very gentle range',
          reason: 'Allows controlled piriformis release without overstretching the nerve',
        },
        {
          technique: 'seated toe touch',
          alternative:
            'Try a standing hamstring stretch with the foot elevated on a low step',
          reason: 'Reduces the angle of nerve tension compared to seated flexion',
        },
      ],
      safeAlternatives: [
        'Gentle cat-cow movements',
        'Supported bridge pose',
        'Standing tai chi movements',
      ],
    },
  ],
  [
    'osteoporosis',
    {
      id: 'osteoporosis',
      name: 'Osteoporosis',
      description:
        'Reduced bone density requiring avoidance of spinal flexion and high-impact movements.',
      contraindicatedMovements: [
        'spinal flexion',
        'high impact',
        'sit-ups',
        'forward fold with rounding',
        'jumping',
      ],
      modifications: [
        {
          technique: 'spinal flexion',
          alternative:
            'Try spinal extension exercises like gentle cobra or supported backbend',
          reason: 'Extension strengthens the vertebral bodies without fracture risk',
        },
        {
          technique: 'high impact',
          alternative:
            'Try weight-bearing standing poses held for longer durations',
          reason: 'Provides bone-loading stimulus without impact forces',
        },
        {
          technique: 'sit-ups',
          alternative:
            'Try standing core work or gentle plank holds for core strengthening',
          reason: 'Engages the core without compressive spinal flexion',
        },
      ],
      safeAlternatives: [
        'Standing balance poses',
        'Supported backbends',
        'Weight-bearing tai chi movements',
      ],
    },
  ],
  [
    'vertigo',
    {
      id: 'vertigo',
      name: 'Vertigo',
      description:
        'Balance and spatial orientation disorder aggravated by head position changes.',
      contraindicatedMovements: [
        'inversion',
        'rapid head movement',
        'headstand',
        'shoulder stand',
        'fast transitions between standing and floor',
      ],
      modifications: [
        {
          technique: 'inversion',
          alternative:
            'Try seated forward fold with the head supported on stacked fists or a block',
          reason: 'Avoids rapid changes in head position relative to gravity',
        },
        {
          technique: 'rapid head movement',
          alternative:
            'Try slow, deliberate head turns with the eyes leading the movement',
          reason: 'Gives the vestibular system time to adjust to position changes',
        },
        {
          technique: 'fast transitions between standing and floor',
          alternative:
            'Try moving between positions via a chair, pausing at each level',
          reason: 'Provides stable reference points during elevation changes',
        },
      ],
      safeAlternatives: [
        'Seated meditation',
        'Supine breathing practices',
        'Chair-based gentle movements',
      ],
    },
  ],
  [
    'anxiety-panic',
    {
      id: 'anxiety-panic',
      name: 'Anxiety / Panic Disorder',
      description:
        'Anxiety conditions that can be triggered by breath retention and intense breathwork.',
      contraindicatedMovements: [
        'breath retention',
        'breath of fire',
        'intense breathwork',
        'kapalabhati',
        'extended breath holds',
      ],
      modifications: [
        {
          technique: 'breath retention',
          alternative:
            'Try gentle extended exhalation (inhale 4, exhale 6) with no holds',
          reason:
            'Activates the calming parasympathetic response without triggering hyperventilation anxiety',
        },
        {
          technique: 'breath of fire',
          alternative:
            'Try gentle diaphragmatic breathing with a natural, unhurried rhythm',
          reason: 'Provides grounding without the intensity that can trigger panic',
        },
        {
          technique: 'intense breathwork',
          alternative:
            'Try body scan meditation as an alternative path to relaxation',
          reason: 'Shifts attention from breath control to body awareness, reducing performance anxiety',
        },
      ],
      safeAlternatives: [
        'Gentle diaphragmatic breathing',
        'Body scan meditation',
        'Progressive muscle relaxation',
      ],
    },
  ],
]);

// ─── Query Functions ────────────────────────────────────────────────────────

/**
 * Get modifications for a specific condition and technique combination.
 *
 * @param condition - Condition ID or name (case-insensitive, partial match)
 * @param technique - Technique or movement pattern to check
 * @returns Array of applicable modifications (may be empty)
 */
export function getConditionModifications(
  condition: string,
  technique: string,
): Modification[] {
  const cond = findCondition(condition);
  if (!cond) return [];

  const lowerTechnique = technique.toLowerCase();
  return cond.modifications.filter(
    (mod) =>
      lowerTechnique.includes(mod.technique.toLowerCase()) ||
      mod.technique.toLowerCase().includes(lowerTechnique),
  );
}

/**
 * Check whether a technique is contraindicated for a given condition.
 *
 * @param condition - Condition ID or name (case-insensitive, partial match)
 * @param technique - Technique or movement pattern to check
 * @returns true if the technique is contraindicated
 */
export function isContraindicated(condition: string, technique: string): boolean {
  const cond = findCondition(condition);
  if (!cond) return false;

  const lowerTechnique = technique.toLowerCase();
  return cond.contraindicatedMovements.some(
    (contra) =>
      lowerTechnique.includes(contra.toLowerCase()) ||
      contra.toLowerCase().includes(lowerTechnique),
  );
}

/**
 * Look up a condition by ID or name (case-insensitive, partial match).
 */
function findCondition(query: string): MedicalCondition | undefined {
  const lower = query.toLowerCase();

  // Try exact ID match first
  const exact = medicalConditions.get(lower);
  if (exact) return exact;

  // Try partial match on ID or name
  for (const [, cond] of medicalConditions) {
    if (
      cond.id.includes(lower) ||
      cond.name.toLowerCase().includes(lower) ||
      lower.includes(cond.id) ||
      lower.includes(cond.name.toLowerCase())
    ) {
      return cond;
    }
  }

  return undefined;
}
