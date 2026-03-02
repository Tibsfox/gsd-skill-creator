/**
 * Physical Education conditions database for the PE Safety Warden.
 *
 * Defines 10 medical/physical conditions relevant to physical education
 * (exercise science focus, distinct from mind-body's yoga/meditation focus).
 * All modifications use positive framing.
 *
 * Mirrors `.college/departments/mind-body/safety/medical-conditions.ts` structure.
 *
 * @module departments/physical-education/safety/pe-conditions
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single modification for a contraindicated activity. */
export interface Modification {
  /** The contraindicated activity or movement pattern */
  technique: string;

  /** The positive-framed modification to offer instead */
  alternative: string;

  /** Brief explanation of why this modification helps */
  reason: string;
}

/** A medical/physical condition with PE-specific contraindications and modifications. */
export interface MedicalCondition {
  /** Unique condition identifier */
  id: string;

  /** Human-readable condition name */
  name: string;

  /** Brief description of the condition */
  description: string;

  /** Activity patterns or techniques that are contraindicated */
  contraindicatedMovements: string[];

  /** Positive-framed modifications for safe practice */
  modifications: Modification[];

  /** Safe alternative activities */
  safeAlternatives: string[];
}

// ─── PE Conditions Database ──────────────────────────────────────────────────

export const peConditions: Map<string, MedicalCondition> = new Map([
  [
    'cardiac-condition',
    {
      id: 'cardiac-condition',
      name: 'Cardiovascular / Heart Condition',
      description:
        'Cardiovascular disease or heart condition requiring exercise intensity limits and monitoring.',
      contraindicatedMovements: [
        'maximal exertion',
        'sprint training',
        'high-intensity interval',
        'competitive athletics',
        'contact sports',
        'weightlifting maximum effort',
      ],
      modifications: [
        {
          technique: 'maximal exertion',
          alternative:
            'Substitute with moderate aerobic exercise at 30-60% HRmax with continuous monitoring',
          reason: 'Maximal exertion causes dangerous cardiac stress — target moderate intensity zones',
        },
        {
          technique: 'sprint training',
          alternative:
            'Use supervised cardiac rehabilitation exercises approved by your cardiologist',
          reason: 'Cardiac rehab protocols provide safe, monitored progressive intensity increases',
        },
        {
          technique: 'high-intensity interval',
          alternative:
            'Prefer steady-state moderate aerobic exercise at physician-approved intensity',
          reason: 'Interval training spikes heart rate unpredictably — constant moderate load is safer',
        },
      ],
      safeAlternatives: [
        'Walking at comfortable pace',
        'Water aerobics',
        'Chair-based exercises',
      ],
    },
  ],
  [
    'asthma',
    {
      id: 'asthma',
      name: 'Exercise-Induced or Persistent Asthma',
      description:
        'Asthma triggered or worsened by exercise, cold air, or high-intensity continuous effort.',
      contraindicatedMovements: [
        'cold weather running',
        'high-intensity continuous aerobic',
        'swimming in heavily chlorinated water',
        'dusty field sports',
        'prolonged aerobic above 70% HRmax',
      ],
      modifications: [
        {
          technique: 'cold weather running',
          alternative:
            'Use indoor climate-controlled exercise facilities; wear a face mask for outdoor cold-weather activity',
          reason: 'Cold dry air is a primary asthma trigger — warm humid indoor air is safer',
        },
        {
          technique: 'high-intensity continuous aerobic',
          alternative:
            'Use gradual warm-up over 10-15 minutes; have rescue inhaler accessible at all times',
          reason: 'Gradual warm-up helps prevent exercise-induced bronchoconstriction',
        },
        {
          technique: 'prolonged aerobic above 70% HRmax',
          alternative:
            'Prefer interval training with rest periods below 70% HRmax to allow airway recovery',
          reason: 'Rest intervals allow airways to recover and reduce sustained bronchoconstriction risk',
        },
      ],
      safeAlternatives: [
        'Swimming in outdoor pools',
        'Yoga',
        'Cycling at moderate pace',
      ],
    },
  ],
  [
    'joint-injury',
    {
      id: 'joint-injury',
      name: 'Acute or Chronic Joint Injury',
      description:
        'Knee, hip, ankle, or shoulder injury requiring joint-protective exercise selection.',
      contraindicatedMovements: [
        'jumping',
        'high-impact aerobic',
        'running on hard surface',
        'contact sports',
        'heavy resistance training affected joint',
        'rapid direction change',
      ],
      modifications: [
        {
          technique: 'jumping',
          alternative:
            'Use pool-based exercise where buoyancy reduces joint impact loading',
          reason: 'Aquatic exercise removes impact forces while maintaining cardiovascular benefit',
        },
        {
          technique: 'high-impact aerobic',
          alternative:
            'Substitute with low-impact alternatives: cycling, elliptical, or swimming',
          reason: 'Low-impact modes provide cardiovascular training without joint stress',
        },
        {
          technique: 'heavy resistance training affected joint',
          alternative:
            'Use resistance band exercises for progressive loading without compression stress',
          reason: 'Resistance bands provide controlled joint loading appropriate for rehabilitation',
        },
      ],
      safeAlternatives: [
        'Swimming',
        'Stationary cycling',
        'Resistance band exercises',
      ],
    },
  ],
  [
    'hypertension',
    {
      id: 'hypertension',
      name: 'High Blood Pressure (Hypertension)',
      description:
        'High blood pressure requiring controlled exercise intensity and avoidance of isometric exertion.',
      contraindicatedMovements: [
        'maximal weightlifting',
        'isometric holds',
        'heavy resistance training',
        'competitive high-stress sports',
        'breath holding during exertion',
        'inverted positions',
      ],
      modifications: [
        {
          technique: 'maximal weightlifting',
          alternative:
            'Use aerobic exercise at 40-60% HRmax; avoid Valsalva maneuver during any resistance training',
          reason: 'Heavy resistance dramatically raises blood pressure — moderate aerobic is safer',
        },
        {
          technique: 'isometric holds',
          alternative:
            'Prefer dynamic (rhythmic) movements over static holds to reduce blood pressure spikes',
          reason: 'Isometric contractions cause sustained pressure increase; dynamic movement is cyclic',
        },
        {
          technique: 'breath holding during exertion',
          alternative:
            'Practice continuous natural breathing throughout all exercises — exhale on exertion',
          reason: 'Breath holding (Valsalva) spikes intrathoracic and blood pressure dangerously',
        },
      ],
      safeAlternatives: [
        'Brisk walking',
        'Cycling',
        'Low-intensity swimming',
      ],
    },
  ],
  [
    'diabetes',
    {
      id: 'diabetes',
      name: 'Type 1 or Type 2 Diabetes',
      description:
        'Diabetes requiring blood glucose monitoring before, during, and after exercise.',
      contraindicatedMovements: [
        'prolonged fasted exercise',
        'very high intensity without glucose monitoring',
        'exercise after insulin injection without snack',
        'remote unsupervised outdoor exercise',
      ],
      modifications: [
        {
          technique: 'prolonged fasted exercise',
          alternative:
            'Check blood glucose before exercise; consume 15-30g carbohydrate if below 100 mg/dL',
          reason: 'Fasted exercise can cause dangerous hypoglycemia — pre-exercise carbohydrate prevents this',
        },
        {
          technique: 'very high intensity without glucose monitoring',
          alternative:
            'Monitor blood glucose before, during (if >30 min), and after exercise',
          reason: 'Intensity-dependent glucose dynamics require monitoring to prevent hypo/hyperglycemia',
        },
        {
          technique: 'remote unsupervised outdoor exercise',
          alternative:
            'Exercise with a partner when possible; carry fast-acting carbohydrate at all times',
          reason: 'Hypoglycemia can impair judgment rapidly — a partner and carbohydrate are essential safety measures',
        },
      ],
      safeAlternatives: [
        'Moderate aerobic exercise post-meal',
        'Resistance training with monitoring',
        'Group fitness classes',
      ],
    },
  ],
  [
    'osteoporosis',
    {
      id: 'osteoporosis',
      name: 'Osteoporosis (Reduced Bone Density)',
      description:
        'Reduced bone density requiring avoidance of high-impact movements and fall-risk activities.',
      contraindicatedMovements: [
        'high-impact aerobic',
        'jumping',
        'contact sports',
        'spinal flexion under load',
        'activities with high fall risk',
        'heavy forward bending with weight',
      ],
      modifications: [
        {
          technique: 'high-impact aerobic',
          alternative:
            'Use weight-bearing at moderate impact: brisk walking or stair climbing without jumping',
          reason: 'Moderate weight-bearing stimulates bone density without fracture risk from impact',
        },
        {
          technique: 'spinal flexion under load',
          alternative:
            'Substitute spinal extension exercises and core stabilization for safer bone loading',
          reason: 'Spinal flexion under load risks vertebral compression fracture in osteoporosis',
        },
        {
          technique: 'activities with high fall risk',
          alternative:
            'Include balance training for fall prevention: single-leg stands, tandem walking',
          reason: 'Fall prevention is the primary injury risk reduction strategy in osteoporosis',
        },
      ],
      safeAlternatives: [
        'Walking',
        'Low-impact aerobics',
        'Resistance training for bone density',
      ],
    },
  ],
  [
    'pregnancy',
    {
      id: 'pregnancy',
      name: 'Pregnancy',
      description:
        'Pregnancy requiring activity modification to protect mother and fetus throughout gestation.',
      contraindicatedMovements: [
        'contact sports',
        'activities with fall risk',
        'supine position after first trimester',
        'breath holding',
        'high-altitude exercise',
        'scuba diving',
        'high-impact jumping',
      ],
      modifications: [
        {
          technique: 'contact sports',
          alternative:
            'Prefer prenatal fitness classes, swimming, and walking — sports with no collision risk',
          reason: 'Abdominal trauma risk from contact sports is unacceptable during pregnancy',
        },
        {
          technique: 'supine position after first trimester',
          alternative:
            'Use side-lying or inclined positions for floor exercises to avoid vena cava compression',
          reason: 'Supine position compresses inferior vena cava, reducing maternal and fetal circulation',
        },
        {
          technique: 'high-impact jumping',
          alternative:
            'Use low-impact alternatives: walking, swimming, stationary cycling, or prenatal yoga',
          reason: 'High-impact activities stress pelvic floor and joints affected by pregnancy hormones',
        },
      ],
      safeAlternatives: [
        'Swimming',
        'Prenatal yoga',
        'Walking',
        'Stationary cycling',
      ],
    },
  ],
  [
    'recent-surgery',
    {
      id: 'recent-surgery',
      name: 'Post-Surgical Recovery',
      description:
        'Post-surgical recovery requiring medical clearance before resuming exercise.',
      contraindicatedMovements: [
        'any vigorous exercise without medical clearance',
        'resistance training affected area',
        'contact sports',
        'heavy lifting',
        'high-impact activities',
      ],
      modifications: [
        {
          technique: 'any vigorous exercise without medical clearance',
          alternative:
            'Obtain physician clearance specifying permitted exercise types and intensity limits',
          reason: 'Surgical recovery timelines vary — only your surgeon knows your healing status',
        },
        {
          technique: 'resistance training affected area',
          alternative:
            'Follow physical therapy rehabilitation protocol; progress only as cleared by therapist',
          reason: 'Premature loading of surgical sites risks dehiscence, re-injury, or complications',
        },
        {
          technique: 'heavy lifting',
          alternative:
            'Perform only gentle walking and physician-cleared range-of-motion exercises initially',
          reason: 'Heavy lifting creates internal pressure that can stress surgical incisions',
        },
      ],
      safeAlternatives: [
        'Gentle walking as cleared',
        'Physical therapy exercises only',
        'Rest and recovery',
      ],
    },
  ],
  [
    'obesity',
    {
      id: 'obesity',
      name: 'Obesity (Extreme)',
      description:
        'Extreme obesity requiring joint-protective, buoyancy-assisted, and gradual-progression exercise selection.',
      contraindicatedMovements: [
        'high-impact running',
        'jumping jacks',
        'burpees',
        'rapid stair climbing',
        'contact sports at high intensity',
      ],
      modifications: [
        {
          technique: 'high-impact running',
          alternative:
            'Use aquatic exercise: buoyancy reduces joint loading by up to 90% in chest-deep water',
          reason: 'Aquatic exercise removes the body weight component that stresses joints in running',
        },
        {
          technique: 'jumping jacks',
          alternative:
            'Substitute with seated exercise or recumbent cycling for equivalent cardiovascular training',
          reason: 'Jumping movements apply 3-5x bodyweight force on joints — avoid until appropriate BMI',
        },
        {
          technique: 'burpees',
          alternative:
            'Use chair-based exercises and gradual progression: standing rows, seated stepping',
          reason: 'Floor-to-standing transitions are hazardous at high BMI — seated progressions build fitness safely',
        },
      ],
      safeAlternatives: [
        'Water aerobics',
        'Stationary recumbent cycling',
        'Chair-based exercises',
        'Gentle walking',
      ],
    },
  ],
  [
    'vertigo',
    {
      id: 'vertigo',
      name: 'Vertigo (Balance Disorder)',
      description:
        'Balance and spatial orientation disorder requiring stability-focused, low-rotation exercise.',
      contraindicatedMovements: [
        'rapid direction changes',
        'gymnastics',
        'balance beam',
        'activities on unstable surfaces',
        'rapid rotation',
        'inversion activities',
      ],
      modifications: [
        {
          technique: 'rapid direction changes',
          alternative:
            'Use seated or wall-supported exercises that eliminate balance demands',
          reason: 'Rapid direction changes trigger vestibular-visual conflict that causes vertigo episodes',
        },
        {
          technique: 'activities on unstable surfaces',
          alternative:
            'Prefer stable flat surfaces; progress to wall-supported single-leg exercises only when stable',
          reason: 'Unstable surfaces amplify proprioceptive challenges beyond safe tolerance for vertigo',
        },
        {
          technique: 'rapid rotation',
          alternative:
            'Perform slow, controlled movements with eyes focused on a stationary point',
          reason: 'Gaze fixation during slow movements helps the vestibular system maintain orientation',
        },
      ],
      safeAlternatives: [
        'Seated exercises',
        'Supported walking',
        'Tai chi at slow pace',
      ],
    },
  ],
]);

// ─── Query Functions ─────────────────────────────────────────────────────────

/**
 * Get modifications for a specific PE condition and technique combination.
 *
 * @param condition - Condition ID or name (case-insensitive, partial match)
 * @param technique - Technique or activity pattern to check
 * @returns Array of applicable modifications (may be empty)
 */
export function getPEConditionModifications(condition: string, technique: string): Modification[] {
  const cond = findPECondition(condition);
  if (!cond) return [];

  const lowerTechnique = technique.toLowerCase();
  return cond.modifications.filter(
    (mod) =>
      lowerTechnique.includes(mod.technique.toLowerCase()) ||
      mod.technique.toLowerCase().includes(lowerTechnique),
  );
}

/**
 * Check whether an activity is contraindicated for a given PE condition.
 *
 * @param condition - Condition ID or name (case-insensitive, partial match)
 * @param technique - Technique or activity pattern to check
 * @returns true if the activity is contraindicated
 */
export function isPEContraindicated(condition: string, technique: string): boolean {
  const cond = findPECondition(condition);
  if (!cond) return false;

  const lowerTechnique = technique.toLowerCase();
  return cond.contraindicatedMovements.some(
    (contra) =>
      lowerTechnique.includes(contra.toLowerCase()) ||
      contra.toLowerCase().includes(lowerTechnique),
  );
}

/**
 * Look up a PE condition by ID or name (case-insensitive, partial match).
 */
function findPECondition(query: string): MedicalCondition | undefined {
  const lower = query.toLowerCase();

  // Try exact ID match first
  const exact = peConditions.get(lower);
  if (exact) return exact;

  // Try partial match on ID or name
  for (const [, cond] of peConditions) {
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
