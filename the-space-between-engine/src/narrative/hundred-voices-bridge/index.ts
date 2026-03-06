/**
 * Hundred Voices Bridges
 *
 * Thematic (NOT textual) connections between literary voices and
 * mathematical foundations. Each bridge describes a stylistic or
 * structural parallel between how a writer uses language and how
 * a mathematical concept organizes reality. No quoted text appears
 * in any bridge description.
 */

import type { FoundationId, HundredVoicesBridge } from '@/types';

// ─── Hemingway / Unit Circle ─────────────────────────

const hemingwayUnitCircle: HundredVoicesBridge = {
  foundationId: 'unit-circle',
  literaryVoice: 'Ernest Hemingway',
  connectionType: 'stylistic parallel',
  description:
    'Hemingway strips prose to its bones. Every unnecessary word is removed until only the essential structure remains — and that structure carries more meaning than the ornamentation ever could. The unit circle does the same thing to trigonometry. It takes an entire universe of angles, ratios, and periodic functions and compresses them into a single object: a circle of radius one. Nothing is wasted. Nothing is redundant. Every point on the circle is doing exactly one job, and that job encodes everything you need. Hemingway once said that the dignity of a story is like an iceberg — the seven-eighths below the surface is what gives it power. The unit circle is that iceberg: a surface of austere simplicity concealing an ocean of consequence. When Hemingway writes a sentence with four words, each word bears the weight of twenty. When the unit circle gives you a single point, that point gives you sine, cosine, tangent, and every other ratio simultaneously. Compression as art. Economy as revelation.',
};

// ─── Woolf / Pythagorean ─────────────────────────────

const woolfPythagorean: HundredVoicesBridge = {
  foundationId: 'pythagorean',
  literaryVoice: 'Virginia Woolf',
  connectionType: 'structural resonance',
  description:
    'Woolf builds narratives from independent consciousnesses that exist separately yet are bound together by invisible structural forces. In her novels, characters move through the same day, the same city, the same party, each carrying a private geometry of thought — and the relationships between those inner worlds create meaning that no single consciousness could produce alone. This is the Pythagorean relationship made literary. Two sides of a right triangle are independent measurements — one horizontal, one vertical — yet they are locked together by a constraint so absolute that knowing any two determines the third. Woolf understood that separate lives constrain each other in exactly this way. The distance between two people is not arbitrary — it is determined by the lengths of their own paths and the angle at which those paths meet. Her prose makes you feel this: the emergent wholeness that arises when independent quantities obey a shared structural law.',
};

// ─── Morrison / Trigonometry ─────────────────────────

const morrisonTrigonometry: HundredVoicesBridge = {
  foundationId: 'trigonometry',
  literaryVoice: 'Toni Morrison',
  connectionType: 'rhythmic parallel',
  description:
    'Morrison writes in waves. Her prose builds — gathering force, layering voice upon voice, image upon image — until it crests in passages of devastating clarity, then recedes into quiet reflection before building again. This is not mere stylistic choice. It is the rhythm of trigonometric oscillation rendered in language. A wave function rises from zero to its peak, descends through zero to its trough, and rises again. Morrison does the same thing with emotional intensity: each chapter, each paragraph, each sentence has an amplitude and a frequency. The amplitude is the depth of feeling. The frequency is the pace of revelation. And just as two waves can combine — reinforcing each other at some points, canceling at others — Morrison layers her narrative voices until they create interference patterns of meaning. Moments where three characters recall the same event produce constructive interference: the emotional amplitude triples. Moments of deliberate silence produce nodes — points of zero displacement that are as powerful as the peaks. Her prose breathes the way the ocean breathes.',
};

// ─── Pynchon / Vector Calculus ───────────────────────

const pynchonVectorCalculus: HundredVoicesBridge = {
  foundationId: 'vector-calculus',
  literaryVoice: 'Thomas Pynchon',
  connectionType: 'field resonance',
  description:
    'Pynchon does not write stories. He writes fields. His novels are spaces in which every point carries a direction and a magnitude — a local narrative force that pushes characters along trajectories they do not choose and cannot fully comprehend. Open one of his books at any page and you find yourself in a specific location in a vast field of meaning: conspiracies exert pull from one direction, entropy pushes from another, history spirals in a third. No single character sees the whole field. Each one experiences only the local vector — the force at their particular point in space and time. But the reader, moving through the pages, begins to sense the field itself: its topology, its singularities, its regions of convergence where all arrows point inward and its regions of divergence where everything flies apart. This is exactly what vector calculus studies. At every point in a field, there is a direction and a strength. The field has sources where force originates and sinks where it disappears. It has curl — regions where the arrows spin — and divergence — regions where they spread. Pynchon narrates the way a field operates: locally everywhere, globally nowhere, yet somehow coherent.',
};

// ─── Borges / Set Theory ─────────────────────────────

const borgesSetTheory: HundredVoicesBridge = {
  foundationId: 'set-theory',
  literaryVoice: 'Jorge Luis Borges',
  connectionType: 'boundary exploration',
  description:
    'Borges writes about the edges of containment. His stories are exercises in asking what happens when you push the idea of a collection to its limits. A library that contains every possible book. A map that is the same size as the territory it represents. A set of all things that do not contain themselves. These are not fantasy premises — they are the exact paradoxes that forged set theory into a rigorous discipline. Borges understood, perhaps more clearly than any other writer, that the act of defining a boundary — of saying this belongs and this does not — is the most powerful and most dangerous act of the mind. Powerful, because without boundaries there is no thought, no category, no identity. Dangerous, because some boundaries, drawn carelessly, consume themselves. His fiction lives at the edge where classification breaks down, where a list tries to include itself, where a room contains all rooms. This is the literary territory of set theory: not the comfortable interior of well-defined collections, but the vertiginous boundary where inclusion and exclusion become matters of logical survival.',
};

// ─── Le Guin / Category Theory ───────────────────────

const leGuinCategoryTheory: HundredVoicesBridge = {
  foundationId: 'category-theory',
  literaryVoice: 'Ursula K. Le Guin',
  connectionType: 'translation parallel',
  description:
    'Le Guin builds worlds that are radically different from our own — different biology, different gender, different time, different social structures — and then shows us that the deep patterns of consciousness, morality, and relationship are preserved across these translations. She does not argue that all worlds are the same. She demonstrates that certain structural relationships survive even the most extreme transformations. A society without gender still has power dynamics. A planet without seasons still has cycles of scarcity and abundance. An alien species still navigates the tension between individual autonomy and collective obligation. This is exactly what category theory studies: not the objects themselves, but the structure-preserving maps between them. A functor does not claim that two mathematical worlds are identical. It shows that the relationships within one world have counterparts in another — that you can translate from here to there without breaking the connections that matter. Le Guin is the literary functor. She translates between human and alien, between familiar and strange, and the translation preserves truth. Not surface truth. Structural truth. The kind that survives the journey between worlds.',
};

// ─── Calvino / Information Theory ────────────────────

const calvinoInformationTheory: HundredVoicesBridge = {
  foundationId: 'information-theory',
  literaryVoice: 'Italo Calvino',
  connectionType: 'encoding resonance',
  description:
    'Calvino writes fiction about fiction. His novels are messages about the nature of messages. A book about a reader trying to read a book. A story that begins over and over, each time in a different genre, each time interrupted — forcing you to confront the machinery of narrative itself. This is information theory made literary. Information theory does not study the content of a message; it studies the structure of communication itself. How much surprise does a message carry? How much redundancy is needed to protect meaning from noise? What is the minimum number of symbols required to encode a given amount of meaning? Calvino asks exactly these questions in prose. When he writes a story that self-destructs, he is exploring the limits of a channel. When he constrains himself to writing without a particular letter, he is measuring the entropy of language — how much information each symbol actually carries. When he begins ten novels and finishes none, he is demonstrating that the most information-rich part of a story is the opening, where uncertainty is highest and every word eliminates the most possibilities. His fiction does not describe information theory. His fiction IS information theory, performed.',
};

// ─── Everett / L-Systems ─────────────────────────────

const everettLSystems: HundredVoicesBridge = {
  foundationId: 'l-systems',
  literaryVoice: 'Percival Everett',
  connectionType: 'recursive parallel',
  description:
    'Everett builds novels that contain smaller versions of themselves. A story about writing will contain a story being written, and that inner story will contain its own inner story, and at each level the rules are the same but the scale changes. Characters rewrite their own narratives. Plots branch, subdivide, and recombine. The distinction between the author, the narrator, and the character dissolves — because at every level of the recursion, someone is doing the same thing: making a story out of simpler stories. This is exactly how a formal rewriting system generates complexity. You begin with a single symbol. You apply a set of rules that replace each symbol with a string of new symbols. Then you apply the same rules again to every new symbol. After enough iterations, a single seed has branched into an intricate structure — a fern, a tree, a coastline — built entirely from the recursive application of simple transformations. Everett works the same way. His initial premise is the axiom. His literary rules — irony, self-reference, genre subversion — are the production rules. Each application produces a new layer that looks like the layer above it but at a different scale. The result is a novel that is fractal in structure: a pattern that repeats at every level of reading, generated not from a master plan but from the relentless re-application of a small set of creative operations.',
};

// ─── Export ──────────────────────────────────────────

export const hundredVoicesBridges: Record<FoundationId, HundredVoicesBridge> = {
  'unit-circle': hemingwayUnitCircle,
  pythagorean: woolfPythagorean,
  trigonometry: morrisonTrigonometry,
  'vector-calculus': pynchonVectorCalculus,
  'set-theory': borgesSetTheory,
  'category-theory': leGuinCategoryTheory,
  'information-theory': calvinoInformationTheory,
  'l-systems': everettLSystems,
};
