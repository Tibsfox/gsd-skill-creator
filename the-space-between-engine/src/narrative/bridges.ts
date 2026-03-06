// Hundred Voices Bridges — One per foundation.
// Thematic connections to literary voices. Conceptual mappings, NOT reproductions.
// NO quoted text. Describes HOW the literary voice embodies the mathematical foundation.

import type { HundredVoicesBridge, FoundationId } from '../types/index';

export const hundredVoicesBridges: HundredVoicesBridge[] = [

  // ── 1. Unit Circle — Hemingway ──────────────────────────────

  {
    foundationId: 'unit-circle',
    literaryVoice: 'Hemingway',
    connectionType: 'structural parallel',
    description:
      'Hemingway wrote sentences the way the unit circle works: by removing everything that is not essential and discovering that what remains is complete. His prose strips language to its smallest functional radius — subject, verb, object — and trusts that the full circle of meaning will emerge from what is left unsaid. The iceberg theory is the unit circle principle: a single visible point implies the entire shape. Just as the unit circle reduces all of trigonometry to one radius and one angle, Hemingway reduces all of a story to the fewest possible words and the silences between them. The spare clarity is not poverty — it is compression to radius one, where nothing is wasted and everything is load-bearing.',
  },

  // ── 2. Pythagorean — Morrison ───────────────────────────────

  {
    foundationId: 'pythagorean',
    literaryVoice: 'Morrison',
    connectionType: 'harmonic resonance',
    description:
      'Morrison wrote with the awareness that truth has a fixed relationship to experience — that certain proportions between memory, language, and feeling are not negotiable. Her prose carries the Pythagorean conviction that deep structure is discovered, not invented. When she builds a sentence, the rhythm is not decorative; it is structural, the way a right triangle is structural. The distance between two points in her work — between what is said and what is meant, between the spoken word and the body that speaks it — follows a precise and unbreakable law. Her writing embodies the theorem not as formula but as gravity: the diagonal of human experience has an exact length, and she measures it without rounding.',
  },

  // ── 3. Trigonometry — Woolf ─────────────────────────────────

  {
    foundationId: 'trigonometry',
    literaryVoice: 'Woolf',
    connectionType: 'continuous motion',
    description:
      'Woolf wrote in waves. Her sentences do not arrive at their meaning and stop; they pass through it, oscillate around it, approach it from above and below in long flowing periods that never quite come to rest. This is trigonometry made verbal — the continuous transformation of a single thought as it rotates through the angles of consciousness. Her stream-of-consciousness technique is a sine wave of attention: rising toward an image, cresting in recognition, falling through doubt, and rising again toward the next image, each cycle connected to the last by the unbroken line of awareness. She understood that mental life is not a sequence of static observations but a continuously varying signal, and her prose reproduces its frequency and amplitude with extraordinary fidelity.',
  },

  // ── 4. Vector Calculus — Pynchon ────────────────────────────

  {
    foundationId: 'vector-calculus',
    literaryVoice: 'Pynchon',
    connectionType: 'field dynamics',
    description:
      'Pynchon writes as if every point in his narrative is subject to multiple invisible forces simultaneously. His novels are fields in the mathematical sense — structures where direction and magnitude vary from point to point, where characters are pushed and pulled by conspiracies, technologies, histories, and desires that they can sense but never fully map. The paranoia in his work is the experience of living inside a vector field without being able to see it: you feel the gradient, you know something is flowing from high to low, but you cannot identify the source. His digressions are not departures from the main path but explorations of the field at different points. His maximalist style mirrors the density of overlapping fields — gravitational, electromagnetic, political, personal — that vector calculus was invented to describe.',
  },

  // ── 5. Set Theory — Borges ──────────────────────────────────

  {
    foundationId: 'set-theory',
    literaryVoice: 'Borges',
    connectionType: 'boundary meditation',
    description:
      'Borges was obsessed with the same question that animates set theory: what happens at the boundary? His labyrinths are sets whose boundaries are their content. His libraries contain every possible book, which means the set of meaningful books is a vanishingly small subset of the set of all books, and the act of searching is the act of defining membership. His mirrors create sets that contain themselves. His infinite gardens of forking paths are explorations of the power set — every possible subset of choices, every possible combination of taken and not-taken roads, all existing simultaneously. Borges understood that the act of drawing a boundary — saying this is inside, this is outside — is the most fundamental creative act, and that every boundary generates a paradox at its edge, because the line itself belongs to both sides and neither.',
  },

  // ── 6. Category Theory — Le Guin ───────────────────────────

  {
    foundationId: 'category-theory',
    literaryVoice: 'Le Guin',
    connectionType: 'structural translation',
    description:
      'Le Guin practiced translation between worlds as a narrative method. Each of her invented societies is a morphism — a structure-preserving map from one way of being human to another. She did not write aliens to be exotic; she wrote them to reveal, by careful structural correspondence, what was hidden in the familiar. This is category theory as literature: the objects are worlds, the morphisms are the acts of translation between them, and the deep insight is that the translations themselves — not the worlds — are where the meaning lives. Her anthropological eye saw functors everywhere: the way a kinship system in one society maps onto a completely different kinship system in another while preserving the underlying relationships. She understood that knowing what something is like is a deeper kind of knowing than knowing what something is.',
  },

  // ── 7. Information Theory — Calvino ─────────────────────────

  {
    foundationId: 'information-theory',
    literaryVoice: 'Calvino',
    connectionType: 'encoding architecture',
    description:
      'Calvino wrote as if every story were a message being encoded for transmission across a noisy channel. His combinatorial fiction — stories built from constrained sets of elements, novels structured as card games or city catalogs — mirrors the fundamental insight of information theory: that structure and constraint are not the enemies of meaning but its prerequisites. A message that could say anything says nothing. A story that follows a rule can surprise you when it varies from it. His playful, crystalline prose carries maximum information per sentence precisely because it operates within tight formal constraints, the way a well-designed code approaches channel capacity by using every available bit. His awareness of the reader as decoder — someone actively reconstructing meaning from marks on paper — mirrors the sender-channel-receiver architecture that information theory describes.',
  },

  // ── 8. L-Systems — Everett ──────────────────────────────────

  {
    foundationId: 'l-systems',
    literaryVoice: 'Everett',
    connectionType: 'recursive self-reference',
    description:
      'Everett wrote fiction that contains itself — stories about the writing of stories, narratives that branch and recombine, texts where the reader encounters the author encountering the reader. This is the literary equivalent of an L-system: a simple production rule (a story about telling a story) that, when applied recursively, generates structures of extraordinary complexity. His metafictional technique mirrors the L-system mechanism exactly: take the output, feed it back as input, and watch the pattern elaborate. The self-reference is not a gimmick but a generative engine. Each level of recursion adds detail while preserving the shape of the original rule. And like an L-system, the result looks organic — not mechanical, not planned, but grown. His work embodies the L-system insight that the boundary between the rule and its output is permeable: the story is both the seed and the tree.',
  },
];

const bridgeMap = new Map<FoundationId, HundredVoicesBridge>(
  hundredVoicesBridges.map((b) => [b.foundationId, b])
);

export function getBridgeByFoundation(id: FoundationId): HundredVoicesBridge {
  const bridge = bridgeMap.get(id);
  if (!bridge) throw new Error(`No Hundred Voices bridge found for foundation: ${id}`);
  return bridge;
}
