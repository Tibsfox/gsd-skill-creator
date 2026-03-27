/**
 * Wonder Stories
 *
 * Eight stories that open each wing's Wonder phase. Written in the
 * philosophical voice of "The Space Between," these stories evoke
 * genuine emotion and wonder. They contain ZERO mathematical notation
 * and connect natural phenomena to mathematical concepts WITHOUT
 * naming the mathematics.
 */

import type { FoundationId, WonderStory } from '@/types';

// ─── The Shadow's Circle ─────────────────────────────

const shadowsCircle: WonderStory = {
  foundationId: 'unit-circle',
  title: "The Shadow's Circle",
  voiceTone: 'contemplative',
  keyImage: "A sundial's shadow tracing a perfect circle through the day",
  body: `There is a stone in a garden somewhere — it does not matter where — and it has stood there longer than anyone can remember. It is not remarkable. It is roughly the height of a child, tapered at the top, and planted in the earth with the quiet permanence of something that was placed once and never questioned again.

But the stone has a secret, and the secret is its shadow.

At dawn, the shadow stretches long toward the west, thin as a finger pointing at the place where night still lingers. As the morning deepens, the shadow shortens, pivots, sweeps across the ground like the hand of some enormous, unhurried clock. By noon it has drawn itself in close, a dark puddle at the stone's feet. And then, without pause, it begins its afternoon journey — lengthening again, reaching east now, tracing the same arc in reverse until the sun drops below the horizon and the shadow merges with the coming dark.

If you were patient — truly, stubbornly patient — and you marked the tip of that shadow every few minutes from sunrise to sunset, you would find something that might take your breath away. The marks would form a curve. Not a jagged line, not a wandering path, but a smooth, continuous arc. And if you returned the next day and did it again, and the next, through the slow turning of the seasons, you would discover that the arcs nest inside one another, shifting with the tilt of the world, but always curving, always returning.

The shadow knows something we spend years learning: that every straight-seeming motion in the sky is secretly circular. The sun does not march across the heavens — it wheels. The seasons do not march either — they revolve. And the shadow, faithful to its stone, traces this truth on the ground each day, writing it in a language older than words.

What is remarkable is not that the shadow moves. Everything moves. What is remarkable is that the shadow's path is so utterly, unbreakably regular. It can be described. It can be predicted. The same curve, the same rhythm, today and a thousand years from now. There is a shape hiding inside every rotation, every cycle, every return — and once you see it, you cannot unsee it.

That shape is where we begin.`,
};

// ─── The Spider's Theorem ────────────────────────────

const spidersTheorem: WonderStory = {
  foundationId: 'pythagorean',
  title: "The Spider's Theorem",
  voiceTone: 'awed',
  keyImage: 'A spider web where every thread is in tension with every other',
  body: `In the early morning, before the world wakes, a garden spider finishes her web. She has worked through the dark hours with no blueprint, no ruler, no plan she could show you on paper. And yet the web is precise. Not approximately precise. Not close enough. Precise.

Every radial thread runs from the center to the frame, taut as a guitar string. Every spiral thread connects them, spaced with a regularity that would humble a draftsman. And at every junction — every place where a spiral thread crosses a radial one — there is a small, glistening knot that holds the whole structure in tension.

But here is the part that stops you, if you look closely enough: the distances matter. Not just aesthetically, not just for catching flies, but structurally. The length of each thread, the angle where two threads meet, the distance from the center to each ring of the spiral — these are not arbitrary. They are locked together by a relationship so fundamental that it appears everywhere in the built and natural world.

A carpenter framing a wall discovers it. She measures three feet along one edge, four feet along another, and finds that the diagonal is exactly five feet — not four point nine, not five point one, but five. A navigator at sea discovers it. She charts two legs of a journey and calculates the straight-line distance home. A child discovers it with a piece of string and three pins on a board.

The spider, of course, discovers nothing. She simply builds according to what works. Her body knows what her mind cannot articulate: that there is a rule governing the relationship between sides and diagonals, between the straight and the slanted, between the parts and the whole. This rule is not a human invention. It was not discovered so much as noticed — the way you might notice, one morning, that the sun always rises in the east. It was already there. It was always there.

The web trembles in the breeze. A dewdrop catches the light. The geometry holds. And the distances — always, inevitably, without exception — obey.`,
};

// ─── The Moon's Pull ─────────────────────────────────

const moonsPull: WonderStory = {
  foundationId: 'trigonometry',
  title: "The Moon's Pull",
  voiceTone: 'rhythmic',
  keyImage: 'Ocean tides rising and falling as the moon orbits',
  body: `Stand at the edge of the sea at midnight. The water is high — lapping at the dune grass, pressing against the rocks, reaching upward as if drawn by an invisible hand. Come back six hours later and the shore has widened. The water has pulled away, exposing sand and shells and small creatures blinking in the sudden air. Six hours more and it returns. Six hours more and it retreats.

This is not random. This is not weather. This is a rhythm so regular that fishermen have trusted it with their lives for ten thousand years.

The moon is up there, somewhere. Perhaps you can see it, pale in the daylight sky, or perhaps it is below the horizon, hidden but not absent. It does not matter whether you can see it. The water can feel it. The ocean responds to the moon the way a sleeping person responds to a hand on their shoulder — not with thought, but with something deeper than thought. The pull is gentle, constant, and inescapable.

But it is not just pulling. It is shaping. The moon does not simply drag the water higher and let it fall. The water rises and falls in a wave — not a wave you can see crashing on the shore, but a vast, slow, planetary wave that travels around the Earth as the moon travels above it. This wave has a peak and a trough, a crest and a valley, and the distance between them is as regular as your own heartbeat.

Listen: the tides are not just a thing that happens at the beach. They are a message written in the language of oscillation. The universe is built on waves — sound waves, light waves, the waves in a field of wheat when the wind passes through. Every wave has a shape, and every shape has a rhythm, and every rhythm can be described by the relationship between an angle and a height.

You already know this in your body. Your lungs fill and empty. Your heart contracts and releases. You walk in a rhythm of alternating legs. You breathe in, breathe out, breathe in. The tides are doing exactly what you are doing, on a scale so vast it takes the moon itself to keep time.

The wave rises. The wave falls. The wave rises again.

It never stops.`,
};

// ─── The Fox in the Field ────────────────────────────

const foxInField: WonderStory = {
  foundationId: 'vector-calculus',
  title: 'The Fox in the Field',
  voiceTone: 'reverent',
  keyImage: "A fox tilting its head, feeling the earth's magnetic field",
  body: `A red fox stands at the edge of a snow-covered meadow. She is perfectly still. Her ears are forward, her nose is low, and every nerve in her body is listening — not to a sound, exactly, but to something more subtle. Something in the field itself.

Beneath the snow, a vole is tunneling. The fox cannot see it. She can barely hear it. But she can feel something else — a direction, a pull, an invisible arrow pointing downward and northward through the earth. Scientists have a name for what the fox is sensing, but the fox does not need a name. She needs only the feeling: a direction at every point in space, whispering which way to leap.

She leaps. Nose-first, she dives into the snow at a precise angle — and emerges with the vole.

Here is what is astonishing: the fox is more accurate when she pounces toward magnetic north. Not slightly more accurate. Dramatically more accurate. Something in her body reads the invisible arrows that thread through the earth's crust, and she uses them to calculate the angle of her dive.

Now imagine those arrows everywhere. Not just at the fox's feet, but at every point in the meadow, every point in the forest, every point in the sky. At each location, an arrow pointing in a particular direction with a particular strength. Some arrows are long and forceful. Some are short and gentle. Together, they form an invisible fabric draped over the landscape — a fabric you cannot see or touch, but that the fox navigates as confidently as you navigate a hallway.

This is not unique to magnetism. The wind is the same kind of thing: at every point in the atmosphere, the air is moving in some direction at some speed. Temperature, too: at every point in a room, the warmth has a direction it wants to flow — from hot to cold, always, without exception. Gravity pulls with different strength at different altitudes. Ocean currents thread the seas like rivers in the water.

The world is full of these invisible fabrics. Fields, we might call them. And at every point in a field, there is a direction and a magnitude — an arrow that tells you what is happening here, right now, at this exact spot.

The fox tilts her head one more time. The arrows align.

She leaps.`,
};

// ─── The River's Name ────────────────────────────────

const riversName: WonderStory = {
  foundationId: 'set-theory',
  title: "The River's Name",
  voiceTone: 'philosophical',
  keyImage: 'A river changing every molecule yet remaining itself',
  body: `There is a river near where you live. Perhaps you know its name. Perhaps you have walked along its banks, or crossed it on a bridge, or watched the light change on its surface in the late afternoon.

Here is a question that sounds simple but is not: is it the same river today as it was yesterday?

The water is different. Every molecule that flowed past the bridge yesterday is miles downstream by now, or has evaporated into the air, or has been drunk by a deer. The mud on the bottom shifts with every current. The banks erode a little each year. Even the channel changes — slowly, imperceptibly, but certainly.

And yet you call it by the same name. You point at it and say: that is the river. Not a different river. Not a new river. The same one. Why?

Because the river is not its water. The river is a pattern — a shape that water takes, a path that persists even as everything flowing through it changes. The river is defined not by what it contains, but by what it includes and what it excludes. The water inside the banks belongs to the river. The water in the aquifer beneath does not. The fish swimming upstream are part of the river's world. The birds flying above it are visitors.

This is a deeper idea than it first appears. The river teaches us that identity is about boundaries, not contents. What makes a thing a thing is not the stuff inside it but the rule that decides what belongs and what does not.

Think about your own body. Every atom in you is replaced over the course of a few years. The cells in your skin, your blood, your bones — they die and are remade. You are not made of the same matter you were made of as a child. And yet you are you. The pattern persists. The boundary holds.

Think about a family. People are born into it, people leave it, people join it by marriage or choice. The members change. But the family endures, defined by some rule of belonging that is not written down but is understood by everyone inside it.

There is something profound in the act of drawing a boundary — of saying these things belong together, and those things do not. It is the first act of understanding. Before you can count, you must decide what to count. Before you can measure, you must decide what to measure. Before you can think clearly about anything, you must first draw the circle that separates the thing from everything else.

The river flows on.

Its name does not change.`,
};

// ─── The Musician's Fingers ──────────────────────────

const musiciansFingers: WonderStory = {
  foundationId: 'category-theory',
  title: "The Musician's Fingers",
  voiceTone: 'gentle',
  keyImage: 'Sheet music becoming sound becoming emotion',
  body: `Watch a pianist's hands. The left hand plays a pattern — a sequence of notes that rises and falls in a certain shape. Now listen to the right hand. It plays a different pattern: different notes, different rhythm, different register. And yet the two patterns are doing the same thing.

Not the same notes. Not the same sounds. The same thing.

This is harder to explain than it should be, because language wants us to say that two things are either identical or different, and this is neither. The left hand is playing a progression that moves from tension to resolution in three steps. The right hand is doing the same — tension to resolution in three steps — but in a completely different voice. The shape of the journey is the same. The territory is different.

A translator knows this feeling. She reads a poem in Spanish — the words, the rhythm, the particular music of the language — and she must render it in English. She cannot use the same words. She cannot preserve the same sounds. But she can preserve the relationships. If the original poem moves from loneliness to connection to wonder, the translation must do the same. If a metaphor in the third line calls back to an image in the first, the translation must preserve that echo. What matters is not the surface but the structure — the way the parts relate to each other.

A chef knows it too. She learns to make a French mother sauce, and then she encounters a Japanese dashi. The ingredients are unrelated. The technique is different. But the function — the role the sauce plays in the dish, the way it provides depth and body and a foundation for other flavors — is the same. She can translate her understanding from one cuisine to another, not by copying recipes but by recognizing what is preserved across the translation.

This is perhaps the most powerful idea a mind can hold: that two things which look nothing alike can share a deep structure. That you can strip away the surface — the specific notes, the specific words, the specific ingredients — and find underneath a pattern of relationships that is the same in both. And once you see that pattern, you can carry it anywhere. You can translate between music and cooking, between poetry and physics, between the flight of a bird and the flow of a river.

The pianist's left hand resolves its chord.

The right hand follows, in a different key, telling the same story.`,
};

// ─── The Photo You Shared ────────────────────────────

const photoYouShared: WonderStory = {
  foundationId: 'information-theory',
  title: 'The Photo You Shared',
  voiceTone: 'warm',
  keyImage: 'Sharing a photo of your pet — joy encoded, transmitted, decoded',
  body: `You take a photo of your dog. She is lying in a patch of sunlight on the kitchen floor, one ear flopped over, eyes half-closed in that particular expression of canine contentment that makes your chest tight with affection. You look at the photo on your screen and you feel the warmth of the moment. Then you send it to a friend.

Think about what just happened. Not emotionally — you know what happened emotionally. Think about it mechanically. The warmth you felt, the specific pattern of light and shadow and color that made your heart respond — that had to survive a journey. It had to be converted from photons striking a sensor into numbers. Millions of numbers, each one representing a tiny square of color. Then those numbers had to be compressed — because sending millions of numbers is expensive, so the phone had to decide which details matter and which can be approximated. Then the compressed numbers traveled through the air as radio waves, were received by a tower, converted to light pulses in a fiber optic cable, routed through a dozen machines, converted back to radio waves, and received by your friend's phone, which decompressed the numbers and turned them back into light on a screen.

Your friend sees the photo and smiles.

The remarkable thing is not that the photo arrived. The remarkable thing is that the smile arrived. The information that mattered — the flop of the ear, the quality of the light, the contentment in the dog's expression — survived. Not perfectly. A few details were lost in compression. The color is slightly different on your friend's screen. But the essence — the thing that makes a person smile — made it through.

This is the central mystery: how do you send meaning through a channel that carries only numbers? How much can you compress before the meaning is lost? If the channel is noisy — if some of the numbers get corrupted along the way — how do you protect the ones that matter most?

Every conversation you have ever had is this same process. You feel something. You encode it into words — a lossy compression, because words never capture everything. You transmit the words through sound waves in the air. Your listener receives them, decodes them, reconstructs something in their own mind. If the room is noisy, you repeat yourself. If the listener speaks a different language, you find a translator. If the message is urgent, you strip it to essentials. If it is nuanced, you add redundancy — saying the same thing three different ways to make sure the important parts survive.

The question is not whether information can be transmitted. It can. The question is: how much of what matters can you preserve, and what is the cost of preserving it?

Your friend types back: "She looks so happy."

The message got through.`,
};

// ─── The Fern's Secret ───────────────────────────────

const fernsSecret: WonderStory = {
  foundationId: 'l-systems',
  title: "The Fern's Secret",
  voiceTone: 'wonder',
  keyImage: 'A fern frond unfurling, each leaf a smaller copy of the whole',
  body: `Unfurl a fern frond. Slowly, the way it actually happens — not all at once but in a tight spiral that uncoils over days, each leaflet emerging from the curl like a thought completing itself. Watch one of those leaflets. It has smaller leaflets of its own. And those have smaller ones still, and those have smaller ones, until you reach the limit of what your eyes can resolve.

Each part looks like the whole.

This is not a metaphor. This is not a poetic approximation. Each small piece of the fern is shaped like the entire fern. The pattern at the scale of your thumbnail is the same pattern at the scale of your arm. The same shape, repeated at every level of magnification, from the frond you can hold in your hand down to structures so small they are measured in the width of a human hair.

How does the fern do this? It does not carry a blueprint of its final shape. It cannot. The final shape has billions of details, and the fern's genetic instructions are finite. Instead, the fern carries something much more elegant: a small set of simple rules. Grow forward a little. Branch to the left. Branch to the right. Now take each branch and apply the same rules again. And again. And again.

From a handful of instructions, repeated and nested, the entire fern emerges. Not designed but generated. Not drawn but grown.

Look around. The fern is not alone. A tree branches the same way — each limb divides into smaller limbs, each twig into smaller twigs, until the pattern disappears into buds and leaves. A river delta does it: the main channel splits into tributaries, each tributary into smaller channels, each channel into rivulets, spreading across the plain in a shape that looks like a tree turned on its side. Lightning does it. Your lungs do it — the bronchial tubes split and split and split until they reach the tiny air sacs where oxygen crosses into your blood. Blood vessels do the same thing on the other side.

The world is full of structures that are built not from a master plan but from a simple rule applied over and over. A few words of instruction, repeated, produce complexity that no blueprint could capture. The secret is not in the details. The secret is in the repetition. The secret is that the rule does not say what to build — it says how to grow. And from that how, the what emerges on its own.

The fern does not know its own shape. It only knows the next step.

And the next step is always the same.`,
};

// ─── Export ──────────────────────────────────────────

export const wonderStories: Record<FoundationId, WonderStory> = {
  'unit-circle': shadowsCircle,
  pythagorean: spidersTheorem,
  trigonometry: moonsPull,
  'vector-calculus': foxInField,
  'set-theory': riversName,
  'category-theory': musiciansFingers,
  'information-theory': photoYouShared,
  'l-systems': fernsSecret,
};
