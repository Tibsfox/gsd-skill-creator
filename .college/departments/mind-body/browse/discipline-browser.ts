/**
 * DisciplineBrowser -- browse all 8 disciplines from the Training Hall.
 *
 * Provides discipline profiles with history, philosophy, key concepts,
 * and inter-discipline connections. Data is compiled from the concept
 * modules created in Phases 12-15. Accessible from the Training Hall's
 * "Browse the Arts" view.
 *
 * @module departments/mind-body/browse/discipline-browser
 */

import type { MindBodyWingId } from '../types.js';
import type { RosettaConcept, ConceptRelationship } from '../../../rosetta-core/types.js';

import { allBreathConcepts } from '../concepts/breath/index.js';
import { allMeditationConcepts } from '../concepts/meditation/index.js';
import { allYogaConcepts } from '../concepts/yoga/index.js';
import { allPilatesConcepts } from '../concepts/pilates/index.js';
import { allMartialArtsConcepts } from '../concepts/martial-arts/index.js';
import { allTaiChiConcepts } from '../concepts/tai-chi/index.js';
import { allRelaxationConcepts } from '../concepts/relaxation/index.js';
import { allPhilosophyConcepts } from '../concepts/philosophy/index.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A connection between two disciplines */
export interface DisciplineConnection {
  /** The target discipline this connection points to */
  targetId: MindBodyWingId;

  /** Human-readable name of the target discipline */
  targetName: string;

  /** Description of how the two disciplines relate */
  description: string;
}

/** A browsable profile for a single discipline */
export interface DisciplineProfile {
  /** Wing identifier */
  id: MindBodyWingId;

  /** Display name */
  name: string;

  /** Historical background compiled from concept descriptions */
  history: string;

  /** Core philosophy and principles */
  philosophy: string;

  /** Key concepts in this discipline (names and brief descriptions) */
  keyConcepts: Array<{ name: string; description: string }>;

  /** Connections to other disciplines */
  connections: DisciplineConnection[];
}

// ─── Wing ID to concept prefix mapping ───────────────────────────────────────

const WING_PREFIX_MAP: Record<MindBodyWingId, string> = {
  'breath': 'mb-breath',
  'meditation': 'mb-med',
  'yoga': 'mb-yoga',
  'pilates': 'mb-pilates',
  'martial-arts': 'mb-ma',
  'tai-chi': 'mb-tc',
  'relaxation': 'mb-relax',
  'philosophy': 'mb-phil',
};

const WING_NAME_MAP: Record<MindBodyWingId, string> = {
  'breath': 'Breath',
  'meditation': 'Meditation',
  'yoga': 'Yoga',
  'pilates': 'Pilates',
  'martial-arts': 'Martial Arts',
  'tai-chi': 'Tai Chi',
  'relaxation': 'Relaxation',
  'philosophy': 'Philosophy',
};

// ─── Discipline metadata ─────────────────────────────────────────────────────

interface DisciplineMetadata {
  id: MindBodyWingId;
  name: string;
  history: string;
  philosophy: string;
  concepts: RosettaConcept[];
}

const disciplines: DisciplineMetadata[] = [
  {
    id: 'breath',
    name: 'Breath',
    history:
      'Breath practices appear in every major contemplative tradition worldwide. Pranayama ' +
      '(Sanskrit: "life force extension") emerged from the Vedic yoga tradition around ' +
      '1500 BCE. Chinese qigong breathing (Tu Na -- "expel and inhale") developed independently ' +
      'in the Taoist tradition. Zazen breath counting anchors Zen Buddhist meditation. ' +
      'The universality of breath practice across cultures reflects a biological truth: ' +
      'the breath is the only autonomic function humans can consciously control.',
    philosophy:
      'Breath is the universal foundation. Every other practice in this department begins ' +
      'with and returns to the breath. Controlling the breath directly modulates the autonomic ' +
      'nervous system, making it the most accessible bridge between conscious intention and ' +
      'involuntary physiological state. At approximately 6 breaths per minute, respiratory ' +
      'rhythm achieves resonance with the baroreflex loop, producing maximum vagal tone.',
    concepts: allBreathConcepts,
  },
  {
    id: 'meditation',
    name: 'Meditation',
    history:
      'Meditation traces from its roots in the Vedic traditions of India (c. 1500 BCE), ' +
      'through the Buddha\'s formalization of Vipassana and Samatha (c. 500 BCE), into Zen ' +
      'Buddhism\'s migration from China to Japan, and to the modern mindfulness movement ' +
      'begun by Jon Kabat-Zinn at the University of Massachusetts Medical School in 1979. ' +
      'Zazen ("seated meditation") is the central practice of Zen Buddhism, brought from ' +
      'China to Japan by Dogen Zenji in the 13th century.',
    philosophy:
      'Meditation cultivates the ability to observe mental processes without being controlled ' +
      'by them. Vipassana ("insight") develops clear seeing of reality as it is. Samatha ' +
      '("calm abiding") develops concentration through single-pointed focus. Together they ' +
      'represent the two fundamental axes of meditative practice: awareness and concentration. ' +
      'The wandering mind is not a failure -- the moment of noticing the wandering IS the practice.',
    concepts: allMeditationConcepts,
  },
  {
    id: 'yoga',
    name: 'Yoga',
    history:
      'Yoga originated in the Indus Valley civilization and was codified in the Yoga Sutras ' +
      'of Patanjali (c. 200 BCE - 200 CE). Hatha Yoga, the body-focused practice, emerged ' +
      'around the 11th century CE. Yoga traveled to the West through teachers like Vivekananda ' +
      '(1893 Parliament of Religions), Krishnamacharya, B.K.S. Iyengar, and Pattabhi Jois. ' +
      'Modern yoga encompasses styles from gentle Hatha to vigorous Ashtanga and Power Yoga.',
    philosophy:
      'Yoga means "union" -- the integration of body, breath, and mind through conscious ' +
      'movement. The physical postures (asanas) are only one of eight limbs described in ' +
      'Patanjali\'s system. Breath-movement synchronization (vinyasa) is the fundamental ' +
      'principle: every movement is initiated by and synchronized with the breath. Pain is ' +
      'information, not an obstacle to push through. Flexibility is a result, not a prerequisite.',
    concepts: allYogaConcepts,
  },
  {
    id: 'pilates',
    name: 'Pilates',
    history:
      'Joseph Hubertus Pilates (1883-1967) developed his method ("Contrology") during World War I ' +
      'while interned as a German national in England. He rigged springs to hospital beds to help ' +
      'immobilized patients exercise -- the origin of Pilates apparatus. After emigrating to New York ' +
      'in 1926, he opened a studio that attracted dancers from the New York City Ballet. Pilates ' +
      'has its roots in rehabilitation and remains deeply connected to physical therapy.',
    philosophy:
      'Pilates is built on six principles: Concentration (mind directs movement), Control ' +
      '(no sloppy repetitions), Centering (all movement initiates from the powerhouse -- the ' +
      'deep core musculature between the ribs and hips), Flow (smooth, continuous movement), ' +
      'Precision (exact alignment matters), and Breathing (lateral thoracic breathing coordinates ' +
      'with every exercise). The "powerhouse" concept -- core stability preceding limb movement -- ' +
      'predated modern core training research by decades.',
    concepts: allPilatesConcepts,
  },
  {
    id: 'martial-arts',
    name: 'Martial Arts',
    history:
      'Kung fu (功夫, gongfu) literally means "skill achieved through hard work and time" -- it ' +
      'does not specifically mean fighting. The Shaolin Temple tradition places Bodhidharma\'s ' +
      'arrival around 527 CE, though combat techniques existed in China long before. Martial arts ' +
      'developed independently across cultures: Japanese bujutsu from samurai traditions, Korean ' +
      'arts from indigenous and Chinese influence, Muay Thai and Silat from Southeast Asian combat ' +
      'needs, and Brazilian Capoeira from African traditions brought by enslaved peoples.',
    philosophy:
      'Martial philosophy distinguishes hard and soft styles (external power vs. internal redirection), ' +
      'and internal and external approaches (qi cultivation vs. physical conditioning). Martial ' +
      'virtues appear across all traditions: Bushido (Japan), Wude (China), and Mudo (Korea) all ' +
      'emphasize discipline, respect, perseverance, integrity, and the restraint that comes with ' +
      'capability. The paradox of martial arts: the goal of learning to fight is reaching the point ' +
      'where you no longer need to.',
    concepts: allMartialArtsConcepts,
  },
  {
    id: 'tai-chi',
    name: 'Tai Chi',
    history:
      'Tai Chi (太極拳, Taiji Quan -- "Supreme Ultimate Fist") is traditionally attributed to the ' +
      'Taoist monk Zhang Sanfeng, though historical evidence is contested. The art crystallized into ' +
      'distinct family styles in the 17th-19th centuries: Chen, Yang, Wu, Sun, and Hao. The Beijing ' +
      '24 Form, created in 1956 by the Chinese government to promote public health, is the most ' +
      'widely practiced tai chi form in the world. Tai chi has an unusually strong evidence base ' +
      'for balance improvement, fall prevention, and blood pressure reduction.',
    philosophy:
      'Tai chi embodies the yin-yang principle in movement: every action contains yielding and ' +
      'expressing, rising and sinking, opening and closing. Five core principles define practice: ' +
      'Song (relaxation without limpness), Zhan (rootedness through skeletal alignment), Zhong Ding ' +
      '(central equilibrium), continuous flow (no stopping between movements), and yin-yang interplay ' +
      '(complementary pairs in every gesture). Tai chi is where everything converges -- breath drives ' +
      'the movement, mindfulness provides attention, yoga\'s flexibility enables postures, Pilates\' ' +
      'core awareness provides structure, martial arts gives meaning to the applications.',
    concepts: allTaiChiConcepts,
  },
  {
    id: 'relaxation',
    name: 'Relaxation',
    history:
      'Progressive Muscle Relaxation was developed by Edmund Jacobson in 1929. Yoga Nidra ' +
      '("yogic sleep") originated in the Tantric tradition and was systematized for modern ' +
      'practice by Swami Satyananda Saraswati in the 1960s. Myofascial release emerged from ' +
      'osteopathic medicine in the mid-20th century. The scientific understanding of the ' +
      'sympathetic and parasympathetic nervous systems, and how to intentionally shift between ' +
      'them, is a relatively recent development in Western medicine.',
    philosophy:
      'Recovery is not optional -- it is an essential component of every practice. Every technique ' +
      'in this discipline activates the parasympathetic nervous system through a specific ' +
      'physiological pathway. The tense-and-release principle (tension followed by release creates ' +
      'deeper relaxation than relaxation alone) and extended-exhale breathing (exhale longer than ' +
      'inhale to directly trigger vagal response) are the two foundational mechanisms. Most modern ' +
      'humans are stuck in sympathetic dominance -- understanding the nervous system toggle makes ' +
      'every relaxation technique more effective.',
    concepts: allRelaxationConcepts,
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    history:
      'Zen Buddhism originated in China around the 6th century CE as Chan, spreading to Japan, ' +
      'Korea, and Vietnam. Taoism\'s foundational text, the Tao Te Ching, is attributed to Lao Tzu ' +
      '(c. 6th-4th century BCE). The Yoga Sutras of Patanjali (c. 200 BCE - 200 CE) codified the ' +
      'eight-limbed path. Martial virtue codes -- Bushido (Japan), Wude (China), Mudo (Korea) -- ' +
      'developed alongside their respective combat traditions. The modern mindfulness movement ' +
      'was catalyzed by Jon Kabat-Zinn\'s work at UMass Medical School beginning in 1979.',
    philosophy:
      'Philosophy is the thread that connects all eight wings. These are practical frameworks for ' +
      'understanding why we practice, not religious instruction. Zen\'s shoshin (beginner\'s mind) ' +
      'teaches that "in the beginner\'s mind there are many possibilities, in the expert\'s mind ' +
      'there are few." Taoism\'s wu wei ("non-action") means acting in harmony with natural flow ' +
      'rather than forcing. The common thread: knowing is not doing, and doing is not being. ' +
      'The practice itself is the teacher.',
    concepts: allPhilosophyConcepts,
  },
];

// ─── Connection Resolution ───────────────────────────────────────────────────

/**
 * Determine which wing a concept ID belongs to by its prefix.
 */
function resolveWingId(conceptId: string): MindBodyWingId | null {
  for (const [wingId, prefix] of Object.entries(WING_PREFIX_MAP)) {
    if (conceptId.startsWith(prefix + '-')) {
      return wingId as MindBodyWingId;
    }
  }
  return null;
}

/**
 * Extract inter-discipline connections from concept relationships.
 *
 * Scans all concepts in a discipline for relationships pointing to
 * concepts in OTHER disciplines, then deduplicates by target wing.
 */
function extractConnections(
  sourceDiscipline: DisciplineMetadata,
): DisciplineConnection[] {
  const connectionMap = new Map<MindBodyWingId, string[]>();

  for (const concept of sourceDiscipline.concepts) {
    for (const rel of concept.relationships) {
      const targetWingId = resolveWingId(rel.targetId);
      if (targetWingId && targetWingId !== sourceDiscipline.id) {
        if (!connectionMap.has(targetWingId)) {
          connectionMap.set(targetWingId, []);
        }
        connectionMap.get(targetWingId)!.push(rel.description);
      }
    }
  }

  const connections: DisciplineConnection[] = [];
  for (const [targetId, descriptions] of connectionMap.entries()) {
    connections.push({
      targetId,
      targetName: WING_NAME_MAP[targetId],
      description: descriptions[0],
    });
  }

  return connections;
}

// ─── DisciplineBrowser ───────────────────────────────────────────────────────

export class DisciplineBrowser {
  private profiles: Map<MindBodyWingId, DisciplineProfile>;

  constructor() {
    this.profiles = new Map();

    // Phase 1: Build profiles with forward connections
    for (const d of disciplines) {
      const profile: DisciplineProfile = {
        id: d.id,
        name: d.name,
        history: d.history,
        philosophy: d.philosophy,
        keyConcepts: d.concepts.map((c) => ({
          name: c.name,
          description: c.description.slice(0, 200) + (c.description.length > 200 ? '...' : ''),
        })),
        connections: extractConnections(d),
      };
      this.profiles.set(d.id, profile);
    }

    // Phase 2: Ensure bidirectional connections
    // If discipline A connects to B, B should also connect to A
    for (const profile of this.profiles.values()) {
      for (const conn of profile.connections) {
        const targetProfile = this.profiles.get(conn.targetId);
        if (targetProfile) {
          const hasReverse = targetProfile.connections.some((c) => c.targetId === profile.id);
          if (!hasReverse) {
            targetProfile.connections.push({
              targetId: profile.id,
              targetName: WING_NAME_MAP[profile.id],
              description: `Connected from ${profile.name}: ${conn.description}`,
            });
          }
        }
      }
    }
  }

  /**
   * Get the full profile for a single discipline.
   */
  getDisciplineProfile(wingId: MindBodyWingId): DisciplineProfile {
    const profile = this.profiles.get(wingId);
    if (!profile) {
      throw new Error(`Unknown discipline: ${wingId}`);
    }
    return profile;
  }

  /**
   * Get profiles for all 8 disciplines.
   */
  getAllDisciplines(): DisciplineProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get connections for a specific discipline to other disciplines.
   */
  getConnections(wingId: MindBodyWingId): DisciplineConnection[] {
    const profile = this.profiles.get(wingId);
    if (!profile) {
      throw new Error(`Unknown discipline: ${wingId}`);
    }
    return profile.connections;
  }
}
