/**
 * Foundation Registry
 *
 * The canonical source of truth for all 8 mathematical foundations.
 * Each foundation carries full metadata, 6 learning phases, wonder
 * connections to the natural world, and a bridge to the skill-creator
 * complex plane.
 */

import type {
  Foundation,
  FoundationId,
  FoundationPhase,
  PhaseType,
  WonderConnection,
  SkillCreatorMapping,
} from '@/types';
import { FOUNDATION_ORDER } from '@/types';

// ─── Unit Circle ──────────────────────────────────────

const unitCircle: Foundation = {
  id: 'unit-circle',
  name: 'Unit Circle',
  subtitle: 'Seeing',
  order: 1,
  description:
    'The unit circle is where all of trigonometry lives. A circle of radius one, centered at the origin, encoding every angle, every ratio, every periodic phenomenon in the universe into a single, elegant shape.',
  color: '#1e3a5f',
  icon: '○',
  wonderConnections: [
    {
      id: 'uc-wc-seasons',
      phenomenon: 'The Seasons',
      description:
        "Earth's axial tilt traces a circle through the year. The angle of sunlight — governed by the unit circle — determines whether you feel summer warmth or winter cold.",
      foundationMapping: 'The angle theta on the unit circle maps to the solar declination angle across the year.',
    },
    {
      id: 'uc-wc-pendulum',
      phenomenon: 'A Pendulum Swinging',
      description:
        'Watch a pendulum swing. Its position at any moment is the cosine of an angle changing with time — the unit circle turning, projected onto a line.',
      foundationMapping: 'The x-coordinate of a point on the unit circle is cos(theta) — the pendulum position.',
    },
    {
      id: 'uc-wc-clocks',
      phenomenon: 'Clock Hands',
      description:
        'Every clock face is a unit circle. The tip of each hand traces the circle, and the time is the angle.',
      foundationMapping: 'Hour/minute hands map angular position to time: theta = 2pi * (minutes/60).',
    },
  ],
  skillCreatorAnalog: {
    mathConcept: 'theta position on the unit circle',
    skillCreatorFunction: 'Complex Plane position',
    explanation:
      'In the skill-creator, every skill occupies a position on the complex plane parameterized by theta. The unit circle is the foundation: theta determines where on the abstract-to-concrete spectrum a skill lives.',
    complexPlanePosition: { theta: Math.PI / 4, r: 1.0 },
    codeParallel: 'complexPlanePosition = { theta: pi/4, r: 1.0 } — the identity position',
  },
  connections: [],
  phases: new Map<PhaseType, FoundationPhase>([
    [
      'wonder',
      {
        type: 'wonder',
        title: 'A Circle That Contains Everything',
        narrativeIntro:
          'Before mathematics, there is wonder. Stand outside on a clear night. The stars wheel overhead in great circles. The moon traces an arc. The sun rises and sets in a rhythm as old as the Earth itself. Every one of these motions is a circle. And the simplest circle of all — radius one, centered at zero — contains the secret to all of them.',
        content: {
          text: 'The unit circle is not just a shape. It is a language. Every point on it encodes two numbers (cosine and sine of an angle), and those two numbers describe oscillation, rotation, and waves everywhere in nature. You will learn to read this language.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'uc-wonder-read', description: 'Read the introduction', type: 'manual' },
          { id: 'uc-wonder-time', description: 'Spend at least 30 seconds reflecting', type: 'time-spent', threshold: 30000 },
        ],
      },
    ],
    [
      'see',
      {
        type: 'see',
        title: 'Seeing the Circle',
        narrativeIntro:
          'Now look more closely. Imagine a point moving around a circle of radius one. As the angle grows, the point traces out every position. Watch the x-coordinate: it rises and falls like a wave. Watch the y-coordinate: another wave, shifted. Two waves, one circle.',
        content: {
          text: 'As a point P travels counterclockwise around the unit circle starting from (1, 0), the x-coordinate traces out the cosine function and the y-coordinate traces out the sine function. Every angle theta corresponds to exactly one point (cos theta, sin theta) on the circle.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'uc-see-observe', description: 'Observe the point moving around the circle', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'touch',
      {
        type: 'touch',
        title: 'Touch the Circle',
        narrativeIntro:
          'Now it is your turn. Drag the point around the circle. Feel how the angle changes. Watch the sine and cosine values update in real time. Notice the symmetry: what happens at pi/4? At pi/2? At pi?',
        content: {
          text: 'Drag the point to explore how the angle theta determines the coordinates. Try placing the point at the cardinal positions (0, pi/2, pi, 3pi/2) and notice what sine and cosine become. Then try the diagonals (pi/4, 3pi/4, 5pi/4, 7pi/4).',
        },
        interactiveElements: [
          {
            id: 'uc-touch-drag',
            type: 'draggable-point',
            config: {
              name: 'theta',
              label: 'Angle (theta)',
              type: 'drag-point',
              min: 0,
              max: 6.2832,
              step: 0.01,
              default: 0,
              unit: 'radians',
              description: 'Drag to change the angle on the unit circle',
            },
            affectsVisualization: true,
          },
          {
            id: 'uc-touch-speed',
            type: 'slider',
            config: {
              name: 'animationSpeed',
              label: 'Animation Speed',
              type: 'slider',
              min: 0.1,
              max: 3.0,
              step: 0.1,
              default: 1.0,
              unit: 'x',
              description: 'Control how fast the point travels around the circle',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'uc-touch-drag-count', description: 'Drag the point at least 5 times', type: 'interaction-count', threshold: 5 },
          { id: 'uc-touch-full-rotation', description: 'Complete a full rotation', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'understand',
      {
        type: 'understand',
        title: 'Understanding the Circle',
        narrativeIntro:
          'The unit circle is defined by a single equation. Every point (x, y) on the circle satisfies it. And from this one equation, all of trigonometry unfolds.',
        content: {
          text: 'The unit circle is the set of all points (x, y) in the plane at distance 1 from the origin. The fundamental identity connects sine and cosine: they are not independent but constrained to the circle. This is why trigonometry works — two functions, one constraint, infinite applications.',
          mathNotation: 'x^2 + y^2 = 1\ncos^2(\\theta) + sin^2(\\theta) = 1',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'uc-understand-identity', description: 'Recognize the Pythagorean identity on the circle', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'connect',
      {
        type: 'connect',
        title: 'Connecting the Circle',
        narrativeIntro:
          'The unit circle does not live alone. It connects to the Pythagorean theorem (the identity IS Pythagoras on a unit triangle), to trigonometry (sine and cosine are projections), and to every wave and cycle in nature.',
        content: {
          text: 'Euler\'s formula reveals the deepest connection: the unit circle lives in the complex plane. The exponential function, evaluated at imaginary arguments, traces the circle. This single equation connects five fundamental constants and unites algebra, geometry, and analysis.',
          mathNotation: 'e^{i\\theta} = cos(\\theta) + i \\cdot sin(\\theta)\ne^{i\\pi} + 1 = 0',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'uc-connect-euler', description: 'Explore Euler\'s formula connection', type: 'interaction-count', threshold: 1 },
          { id: 'uc-connect-journal', description: 'Write about a connection you discovered', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'create',
      {
        type: 'create',
        title: 'Creating with the Circle',
        narrativeIntro:
          'You have seen, touched, understood, and connected the unit circle. Now make something with it. Use sine and cosine to generate spirographs, Lissajous curves, or sound waves. The circle is your instrument.',
        content: {
          text: 'Parametric equations using sine and cosine can produce an endless variety of curves. Lissajous figures, spirographs, and harmonograph patterns all emerge from combining circular motions at different frequencies and phases.',
          mathNotation: 'x(t) = A \\cdot cos(a \\cdot t + \\delta)\ny(t) = B \\cdot sin(b \\cdot t)',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'uc-create-artwork', description: 'Create a piece of generative art using the unit circle', type: 'creation-made' },
        ],
      },
    ],
  ]),
};

// ─── Pythagorean Theorem ──────────────────────────────

const pythagorean: Foundation = {
  id: 'pythagorean',
  name: 'Pythagorean Theorem',
  subtitle: 'Relationship',
  order: 2,
  description:
    'The Pythagorean theorem is the oldest, most proven, and most fundamental relationship in geometry. It tells us how orthogonal dimensions combine — how length and width conspire to create distance.',
  color: '#d4a574',
  icon: '△',
  wonderConnections: [
    {
      id: 'pyth-wc-horizon',
      phenomenon: 'How Far Is the Horizon?',
      description:
        'Stand at the top of a lighthouse. How far can you see? The answer depends on the Pythagorean theorem: your height, the Earth\'s radius, and the distance to the horizon form a right triangle.',
      foundationMapping: 'd^2 + R^2 = (R+h)^2 gives d = sqrt(2Rh + h^2) — the horizon distance.',
    },
    {
      id: 'pyth-wc-music',
      phenomenon: 'Musical Intervals',
      description:
        'The Pythagoreans discovered that harmonious musical intervals correspond to simple ratios of string lengths. The theorem that bears their name was born from the same school that found mathematics in music.',
      foundationMapping: 'String length ratios (2:1 octave, 3:2 fifth) connect geometry to harmony via whole-number relationships.',
    },
  ],
  skillCreatorAnalog: {
    mathConcept: 'Activation magnitude from orthogonal dimensions',
    skillCreatorFunction: 'Skill activation strength',
    explanation:
      'In the skill-creator, a skill\'s activation magnitude is the Pythagorean combination of its orthogonal dimensions (abstract vs concrete, broad vs narrow). Just as c = sqrt(a^2 + b^2), activation = sqrt(dim1^2 + dim2^2).',
    complexPlanePosition: { theta: Math.PI / 6, r: 0.85 },
    codeParallel: 'magnitude = Math.sqrt(abstract**2 + concrete**2)',
  },
  connections: [],
  phases: new Map<PhaseType, FoundationPhase>([
    [
      'wonder',
      {
        type: 'wonder',
        title: 'The Shape of Distance',
        narrativeIntro:
          'How do you measure the distance between two points? Not along a street grid — as the crow flies. This question, asked by builders and astronomers for millennia, leads to one of the most beautiful truths in mathematics.',
        content: {
          text: 'The Pythagorean theorem is about relationship — the relationship between the sides of a right triangle, between perpendicular dimensions, between the parts and the whole. It is the first theorem many people learn, and it never stops being useful.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'pyth-wonder-read', description: 'Read the introduction', type: 'manual' },
        ],
      },
    ],
    [
      'see',
      {
        type: 'see',
        title: 'Seeing the Squares',
        narrativeIntro:
          'Draw a right triangle. Now draw a square on each side. The two smaller squares, taken together, have exactly the same area as the large square on the hypotenuse. This visual proof has been drawn on clay tablets, papyrus, and chalkboards for over 4,000 years.',
        content: {
          text: 'The theorem states that for any right triangle, the area of the square on the hypotenuse equals the sum of the areas of the squares on the other two sides. This is not just an algebraic fact — it is a geometric reality you can see with your eyes.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'pyth-see-visual', description: 'Watch the visual proof animation', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'touch',
      {
        type: 'touch',
        title: 'Building Triangles',
        narrativeIntro:
          'Drag the vertices of a right triangle. Change the side lengths. Watch the squares on each side resize. Verify for yourself: the areas always balance.',
        content: {
          text: 'Adjust the legs of the right triangle and observe how the hypotenuse length changes. Try integer triples like (3,4,5), (5,12,13), or (8,15,17). These Pythagorean triples are right triangles where all sides are whole numbers.',
        },
        interactiveElements: [
          {
            id: 'pyth-touch-leg-a',
            type: 'slider',
            config: {
              name: 'legA',
              label: 'Leg a',
              type: 'slider',
              min: 1,
              max: 12,
              step: 0.5,
              default: 3,
              unit: 'units',
              description: 'Adjust the length of leg a',
            },
            affectsVisualization: true,
          },
          {
            id: 'pyth-touch-leg-b',
            type: 'slider',
            config: {
              name: 'legB',
              label: 'Leg b',
              type: 'slider',
              min: 1,
              max: 12,
              step: 0.5,
              default: 4,
              unit: 'units',
              description: 'Adjust the length of leg b',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'pyth-touch-triples', description: 'Find at least 2 Pythagorean triples', type: 'interaction-count', threshold: 2 },
          { id: 'pyth-touch-explore', description: 'Explore at least 5 different triangle configurations', type: 'interaction-count', threshold: 5 },
        ],
      },
    ],
    [
      'understand',
      {
        type: 'understand',
        title: 'Understanding Orthogonal Combination',
        narrativeIntro:
          'The Pythagorean theorem is the first instance of a profound pattern: orthogonal (perpendicular) quantities combine by summing their squares. This pattern repeats everywhere — in distance, in probability, in quantum mechanics.',
        content: {
          text: 'The theorem is not just about triangles. It is the fundamental law of how independent dimensions combine. The distance formula in any number of dimensions is a direct generalization. In the unit circle, it becomes the Pythagorean identity for sine and cosine.',
          mathNotation: 'a^2 + b^2 = c^2\nd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'pyth-understand-generalize', description: 'See the connection to distance in higher dimensions', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'connect',
      {
        type: 'connect',
        title: 'Connecting to the World',
        narrativeIntro:
          'The Pythagorean theorem connects to the unit circle through the fundamental identity. It connects to vector calculus through the distance metric. It connects to information theory through the norm of a probability vector.',
        content: {
          text: 'Every inner product space has a Pythagorean theorem. The dot product of orthogonal vectors is zero, and their magnitudes combine quadratically. This structure underlies GPS positioning, signal processing, machine learning, and the fabric of spacetime itself.',
          mathNotation: '||\\vec{u} + \\vec{v}||^2 = ||\\vec{u}||^2 + ||\\vec{v}||^2 \\quad \\text{when} \\quad \\vec{u} \\perp \\vec{v}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'pyth-connect-applications', description: 'Explore at least one real-world application', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'create',
      {
        type: 'create',
        title: 'Creating with Distance',
        narrativeIntro:
          'Use the Pythagorean theorem to build something. Create a distance-based visualization, generate Pythagorean-triple art, or build a tool that measures real distances.',
        content: {
          text: 'Pythagorean triples form a rich mathematical structure. Every primitive triple can be generated from two integers m > n > 0 using the formulas a = m^2 - n^2, b = 2mn, c = m^2 + n^2. Use this to create visualizations of the infinite family of right triangles with integer sides.',
          mathNotation: 'a = m^2 - n^2, \\quad b = 2mn, \\quad c = m^2 + n^2',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'pyth-create-work', description: 'Create something using the Pythagorean theorem', type: 'creation-made' },
        ],
      },
    ],
  ]),
};

// ─── Trigonometry ─────────────────────────────────────

const trigonometry: Foundation = {
  id: 'trigonometry',
  name: 'Trigonometry',
  subtitle: 'Motion',
  order: 3,
  description:
    'Trigonometry is the mathematics of oscillation and periodic motion. It turns the static unit circle into a dynamic language for describing everything that repeats: sound waves, light, tides, orbits, the beating of your heart.',
  color: '#2d8c8c',
  icon: '∿',
  wonderConnections: [
    {
      id: 'trig-wc-tides',
      phenomenon: 'Ocean Tides',
      description:
        'The tides rise and fall in a pattern governed by the gravitational pull of the Moon and Sun. This rhythm is a superposition of sine waves at different frequencies — pure trigonometry.',
      foundationMapping: 'Tidal height h(t) = A*sin(omega*t + phi) — a sinusoidal function of time.',
    },
    {
      id: 'trig-wc-sound',
      phenomenon: 'Musical Sound',
      description:
        'Every sound you hear is a vibration in air pressure. A pure tone is a sine wave. A complex sound (a voice, a violin) is a sum of sine waves at different frequencies — a Fourier series.',
      foundationMapping: 'Sound pressure p(t) = sum of A_n * sin(n*omega*t + phi_n) — harmonics stacking.',
    },
    {
      id: 'trig-wc-heartbeat',
      phenomenon: 'Your Heartbeat',
      description:
        'The electrical signal driving your heart — the ECG waveform — is analyzed using trigonometric decomposition. Each component frequency reveals something about cardiac health.',
      foundationMapping: 'ECG signal decomposed via Fourier analysis into trigonometric components.',
    },
  ],
  skillCreatorAnalog: {
    mathConcept: 'Angular velocity on the complex plane',
    skillCreatorFunction: 'Skill refinement rate',
    explanation:
      'In the skill-creator, the rate at which a skill is refined corresponds to angular velocity on the complex plane. Fast-changing skills have high angular velocity; stable skills rotate slowly. Trigonometry governs the dynamics.',
    complexPlanePosition: { theta: Math.PI / 3, r: 0.9 },
    codeParallel: 'refinementRate = d(theta)/dt — angular velocity of skill position',
  },
  connections: [],
  phases: new Map<PhaseType, FoundationPhase>([
    [
      'wonder',
      {
        type: 'wonder',
        title: 'The Mathematics of Rhythm',
        narrativeIntro:
          'Close your eyes. Listen. The hum of a refrigerator. Traffic passing in waves. Your own breathing — in, out, in, out. Rhythm is everywhere. Trigonometry is the mathematics that captures it.',
        content: {
          text: 'Trigonometry began with astronomers measuring angles to the stars. But it became something far greater: the language of periodic phenomena. Anything that oscillates — swings back and forth, rises and falls, waxes and wanes — speaks trigonometry.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'trig-wonder-listen', description: 'Listen to the introductory sound examples', type: 'manual' },
        ],
      },
    ],
    [
      'see',
      {
        type: 'see',
        title: 'Seeing Waves',
        narrativeIntro:
          'As a point moves around the unit circle at constant speed, its y-coordinate traces out a sine wave and its x-coordinate traces out a cosine wave. This is not a metaphor — trigonometric functions ARE circular motion projected onto a line.',
        content: {
          text: 'Watch the animation: a point on the unit circle projects shadows onto the x-axis (cosine) and y-axis (sine). As the angle increases with time, these projections create smooth, continuous waves. Change the speed and you change the frequency. Change the radius and you change the amplitude.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'trig-see-waves', description: 'Watch sine and cosine waves unfold from the circle', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'touch',
      {
        type: 'touch',
        title: 'Shaping Sound',
        narrativeIntro:
          'Now control the wave. Change the frequency — hear the pitch rise and fall. Change the amplitude — hear the volume shift. Add a second wave — hear the harmony or dissonance.',
        content: {
          text: 'Adjust the frequency and amplitude sliders to shape a sine wave. Then combine two waves together. When their frequencies are in simple ratios (2:1, 3:2), you hear harmony. When the ratios are complex, you hear dissonance. This is the Pythagorean discovery in action.',
        },
        interactiveElements: [
          {
            id: 'trig-touch-freq',
            type: 'slider',
            config: {
              name: 'frequency',
              label: 'Frequency',
              type: 'slider',
              min: 20,
              max: 2000,
              step: 1,
              default: 440,
              unit: 'Hz',
              description: 'Set the frequency of the sine wave (440 Hz = concert A)',
            },
            affectsVisualization: true,
          },
          {
            id: 'trig-touch-amplitude',
            type: 'slider',
            config: {
              name: 'amplitude',
              label: 'Amplitude',
              type: 'slider',
              min: 0,
              max: 1,
              step: 0.01,
              default: 0.5,
              unit: '',
              description: 'Control the amplitude (volume) of the wave',
            },
            affectsVisualization: true,
          },
          {
            id: 'trig-touch-phase',
            type: 'slider',
            config: {
              name: 'phase',
              label: 'Phase Shift',
              type: 'slider',
              min: 0,
              max: 6.2832,
              step: 0.01,
              default: 0,
              unit: 'radians',
              description: 'Shift the wave left or right',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'trig-touch-explore-freq', description: 'Explore at least 3 different frequencies', type: 'interaction-count', threshold: 3 },
          { id: 'trig-touch-combine', description: 'Combine two waves', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'understand',
      {
        type: 'understand',
        title: 'Understanding Oscillation',
        narrativeIntro:
          'Sine and cosine are defined by the unit circle, but they model the entire world of periodic phenomena. Amplitude controls height. Frequency controls speed. Phase controls starting position. With these three parameters, you can describe any simple oscillation.',
        content: {
          text: 'A general sinusoidal function has three parameters: amplitude A (how far it swings), angular frequency omega (how fast it oscillates), and phase phi (where it starts). The period T is the time for one complete cycle. The frequency f is cycles per second.',
          mathNotation: 'y(t) = A \\cdot sin(\\omega t + \\phi)\nT = \\frac{2\\pi}{\\omega}, \\quad f = \\frac{1}{T} = \\frac{\\omega}{2\\pi}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'trig-understand-params', description: 'Identify amplitude, frequency, and phase in a wave', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'connect',
      {
        type: 'connect',
        title: 'Connecting Sound and Light',
        narrativeIntro:
          'Fourier discovered that ANY periodic function can be decomposed into a sum of sine waves. This is one of the most powerful ideas in all of mathematics — the Fourier series. It connects trigonometry to signal processing, music, image compression, and quantum mechanics.',
        content: {
          text: 'The Fourier series expresses any periodic function as a sum of harmonics. A square wave, a sawtooth, even a photograph — all decompose into sines and cosines. This is how MP3 compression works, how MRI scans create images, and how radio separates overlapping stations.',
          mathNotation: 'f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left[ a_n \\cos(nx) + b_n \\sin(nx) \\right]',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'trig-connect-fourier', description: 'Explore Fourier decomposition of a complex wave', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'create',
      {
        type: 'create',
        title: 'Creating with Waves',
        narrativeIntro:
          'Build your own synthesizer. Stack sine waves to create instrument-like sounds. Or use trigonometric functions to draw harmonic curves — spirographs of sound made visible.',
        content: {
          text: 'Additive synthesis builds complex sounds by stacking sine waves (harmonics). Each harmonic has its own amplitude and phase. A flute is dominated by the fundamental; an oboe has strong odd harmonics; a brass instrument has many harmonics at similar amplitudes.',
          mathNotation: 'sound(t) = \\sum_{n=1}^{N} A_n \\cdot sin(n \\cdot \\omega_0 \\cdot t + \\phi_n)',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'trig-create-synth', description: 'Create a sound using additive synthesis', type: 'creation-made' },
        ],
      },
    ],
  ]),
};

// ─── Vector Calculus ──────────────────────────────────

const vectorCalculus: Foundation = {
  id: 'vector-calculus',
  name: 'Vector Calculus',
  subtitle: 'Fields',
  order: 4,
  description:
    'Vector calculus is the mathematics of fields — quantities that vary from point to point in space. Wind velocity, temperature gradients, electromagnetic fields, gravitational pull: all are vector or scalar fields, and vector calculus is how we reason about them.',
  color: '#6b4d8a',
  icon: '→',
  wonderConnections: [
    {
      id: 'vec-wc-wind',
      phenomenon: 'Wind Patterns',
      description:
        'A weather map with wind arrows is a vector field. The length and direction of each arrow tells you wind speed and direction at that point. The curl tells you where cyclones form. The divergence tells you where air masses collide or separate.',
      foundationMapping: 'Wind velocity v(x,y) is a 2D vector field; curl(v) locates rotation; div(v) locates convergence.',
    },
    {
      id: 'vec-wc-water',
      phenomenon: 'River Currents',
      description:
        'Watch water flow around rocks in a stream. The speed and direction change from point to point. Where the water speeds up around a rock, that is a gradient. Where it spirals into an eddy, that is curl.',
      foundationMapping: 'Fluid velocity field v(x,y,z) with div(v)=0 for incompressible flow.',
    },
  ],
  skillCreatorAnalog: {
    mathConcept: 'Gradient descent on a loss surface',
    skillCreatorFunction: 'Calibration field',
    explanation:
      'In the skill-creator, calibration works like gradient descent on a loss surface. The gradient points toward better calibration, and the skill follows it. Vector calculus provides the mathematical framework for navigating parameter spaces toward optimal configurations.',
    complexPlanePosition: { theta: Math.PI / 2, r: 0.95 },
    codeParallel: 'calibrationStep = -learningRate * gradient(loss, params)',
  },
  connections: [],
  phases: new Map<PhaseType, FoundationPhase>([
    [
      'wonder',
      {
        type: 'wonder',
        title: 'Fields of Influence',
        narrativeIntro:
          'Hold a magnet near iron filings. Watch them align into beautiful curves — field lines made visible. Every point in space feels the magnet\'s pull, with a specific strength and direction. This is a vector field: an invisible tapestry of forces filling space.',
        content: {
          text: 'Vector calculus extends the ideas of calculus (rates of change, accumulation) from single variables to fields that fill space. It answers questions like: Which way does temperature increase fastest? Where does a fluid rotate? How much stuff flows through a surface?',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'vec-wonder-read', description: 'Read the introduction', type: 'manual' },
        ],
      },
    ],
    [
      'see',
      {
        type: 'see',
        title: 'Seeing Fields',
        narrativeIntro:
          'Watch arrows fill the plane, each one showing the direction and magnitude of a vector field at that point. See how patterns emerge: sources where arrows radiate outward, sinks where they converge, vortices where they swirl.',
        content: {
          text: 'A vector field assigns a vector (direction and magnitude) to every point in a region of space. Common visualizations include arrow plots, streamlines (curves tangent to the field everywhere), and heat maps for the magnitude. Scalar fields (like temperature) are visualized as contour maps or heat maps.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'vec-see-field', description: 'Observe a vector field visualization', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'touch',
      {
        type: 'touch',
        title: 'Touching the Field',
        narrativeIntro:
          'Place sources and sinks in the field. Drag them around and watch the flow change. Add vortices and see rotation emerge. Build your own weather system.',
        content: {
          text: 'Experiment with placing point sources (positive divergence), sinks (negative divergence), and vortices (curl) in a 2D vector field. Observe how streamlines respond. Drop a tracer particle and watch it follow the field.',
        },
        interactiveElements: [
          {
            id: 'vec-touch-source',
            type: 'draggable-point',
            config: {
              name: 'sourcePosition',
              label: 'Source Position',
              type: 'drag-point',
              default: 0,
              description: 'Place and drag a source in the field',
            },
            affectsVisualization: true,
          },
          {
            id: 'vec-touch-strength',
            type: 'slider',
            config: {
              name: 'fieldStrength',
              label: 'Field Strength',
              type: 'slider',
              min: 0.1,
              max: 5.0,
              step: 0.1,
              default: 1.0,
              unit: '',
              description: 'Control the overall strength of the vector field',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'vec-touch-place', description: 'Place at least 3 field elements', type: 'interaction-count', threshold: 3 },
          { id: 'vec-touch-trace', description: 'Trace a particle path through the field', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'understand',
      {
        type: 'understand',
        title: 'Understanding Gradient, Divergence, Curl',
        narrativeIntro:
          'Three operations form the backbone of vector calculus. The gradient points uphill on a scalar field. The divergence measures expansion or contraction of a vector field. The curl measures local rotation. Together, they describe everything a field can do.',
        content: {
          text: 'The gradient of a scalar field f points in the direction of steepest increase and has magnitude equal to the rate of increase. The divergence of a vector field measures how much the field "spreads out" from each point. The curl measures the rotational tendency at each point.',
          mathNotation: '\\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z}\\right)\n\\nabla \\cdot \\vec{F} = \\frac{\\partial F_x}{\\partial x} + \\frac{\\partial F_y}{\\partial y} + \\frac{\\partial F_z}{\\partial z}\n\\nabla \\times \\vec{F} = \\text{curl}(\\vec{F})',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'vec-understand-ops', description: 'Understand gradient, divergence, and curl', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'connect',
      {
        type: 'connect',
        title: 'Connecting Fields and Flows',
        narrativeIntro:
          'The fundamental theorems of vector calculus connect local behavior (derivatives) to global behavior (integrals). Green\'s theorem, Stokes\' theorem, and the divergence theorem all say the same thing: what happens inside a region is determined by what happens on its boundary.',
        content: {
          text: 'Stokes\' theorem unifies all the fundamental theorems of calculus. The integral of a derivative over a region equals the integral of the original function over the boundary. This principle appears in electromagnetism (Maxwell\'s equations), fluid dynamics, and general relativity.',
          mathNotation: '\\oint_C \\vec{F} \\cdot d\\vec{r} = \\iint_S (\\nabla \\times \\vec{F}) \\cdot d\\vec{S}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'vec-connect-theorem', description: 'Explore the connection between local and global properties', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'create',
      {
        type: 'create',
        title: 'Creating with Fields',
        narrativeIntro:
          'Build a flow visualization. Design a vector field with specific properties — sources, sinks, vortices — and watch particles trace beautiful paths through it. Or use gradient fields to create terrain generators.',
        content: {
          text: 'Flow visualizations combine art and mathematics. Define a vector field by its component functions F_x(x,y) and F_y(x,y), then trace thousands of particles through it. The resulting image reveals the field\'s structure — laminar regions, turbulent zones, fixed points, and limit cycles.',
          mathNotation: '\\vec{F}(x,y) = (F_x(x,y), F_y(x,y))\n\\frac{d\\vec{r}}{dt} = \\vec{F}(\\vec{r})',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'vec-create-flow', description: 'Create a flow field visualization', type: 'creation-made' },
        ],
      },
    ],
  ]),
};

// ─── Set Theory ───────────────────────────────────────

const setTheory: Foundation = {
  id: 'set-theory',
  name: 'Set Theory',
  subtitle: 'Being',
  order: 5,
  description:
    'Set theory is the mathematics of belonging. What is in and what is out. What things share in common and what distinguishes them. It is the foundation on which all of modern mathematics is built — the grammar beneath the language.',
  color: '#2d5a2d',
  icon: '{}',
  wonderConnections: [
    {
      id: 'set-wc-taxonomy',
      phenomenon: 'Biological Classification',
      description:
        'Every living thing belongs to nested sets: kingdom, phylum, class, order, family, genus, species. A dog is a member of Canis, which is a subset of Canidae, which is a subset of Carnivora. This is set theory at work in nature.',
      foundationMapping: 'Taxonomic classification is a hierarchy of nested sets with membership and subset relations.',
    },
    {
      id: 'set-wc-venn',
      phenomenon: 'Overlapping Friend Groups',
      description:
        'You know people from school, from work, and from your neighborhood. Some people belong to more than one group — the intersections of your social sets. The people who are in all three? A very special intersection indeed.',
      foundationMapping: 'Social groups as sets; shared members are intersections; union is your entire social network.',
    },
  ],
  skillCreatorAnalog: {
    mathConcept: 'Membership functions and type hierarchies',
    skillCreatorFunction: 'File format recognition and type hierarchies',
    explanation:
      'In the skill-creator, file formats, skill types, and capability categories form sets with membership, intersection, and union operations. A skill that handles both TypeScript and Rust belongs to the intersection of two file-type sets.',
    complexPlanePosition: { theta: (2 * Math.PI) / 3, r: 0.8 },
    codeParallel: 'supportedFormats = new Set(["ts", "rs", "py"]); isSupported = supportedFormats.has(ext)',
  },
  connections: [],
  phases: new Map<PhaseType, FoundationPhase>([
    [
      'wonder',
      {
        type: 'wonder',
        title: 'What Belongs?',
        narrativeIntro:
          'Look around you. Some things are red. Some are heavy. Some are alive. When you group things by a shared property, you have made a set. This act of grouping — of deciding what belongs — is the most fundamental operation in mathematics.',
        content: {
          text: 'Set theory asks the simplest possible questions: Is this element a member of this collection? What do two collections have in common? What happens when we combine them? These simple questions, pursued rigorously, lead to the foundations of all mathematics.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'set-wonder-read', description: 'Read the introduction', type: 'manual' },
        ],
      },
    ],
    [
      'see',
      {
        type: 'see',
        title: 'Seeing Sets',
        narrativeIntro:
          'Venn diagrams are the classic visualization: overlapping circles showing how sets relate. But sets can also be seen as regions of the plane, color-coded by membership. Watch as elements flow into their proper sets, and see the boundaries form.',
        content: {
          text: 'Sets are collections of distinct elements. The operations on sets — union, intersection, difference, complement — can be visualized as regions of the plane. The empty set is the set with no elements. The universal set contains everything under discussion.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'set-see-venn', description: 'Explore a Venn diagram visualization', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'touch',
      {
        type: 'touch',
        title: 'Building Sets',
        narrativeIntro:
          'Drag elements into sets. Create intersections by placing elements in overlapping regions. Remove elements and watch the sets change. Build your own classification system.',
        content: {
          text: 'Create sets by dragging elements into circles. Observe how the intersection, union, and difference update in real time. Try building sets with specific properties: an empty intersection, a superset relationship, or sets that partition the universe.',
        },
        interactiveElements: [
          {
            id: 'set-touch-drag-elements',
            type: 'draggable-point',
            config: {
              name: 'element',
              label: 'Element',
              type: 'drag-point',
              default: 0,
              description: 'Drag elements into set regions',
            },
            affectsVisualization: true,
          },
          {
            id: 'set-touch-set-toggle',
            type: 'button',
            config: {
              name: 'toggleSet',
              label: 'Add/Remove Set',
              type: 'toggle',
              default: false,
              description: 'Add or remove a set circle from the diagram',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'set-touch-build', description: 'Build at least 3 sets with elements', type: 'interaction-count', threshold: 3 },
          { id: 'set-touch-ops', description: 'Perform union, intersection, and difference operations', type: 'interaction-count', threshold: 3 },
        ],
      },
    ],
    [
      'understand',
      {
        type: 'understand',
        title: 'Understanding Set Operations',
        narrativeIntro:
          'Sets have an algebra — a set of rules for combining them. Union, intersection, and complement satisfy laws remarkably similar to AND, OR, and NOT in logic. This is not a coincidence: set theory and logic are two faces of the same coin.',
        content: {
          text: 'The fundamental operations are: union (elements in either set), intersection (elements in both sets), difference (elements in one but not the other), and complement (elements not in the set). De Morgan\'s laws connect complement with union and intersection, mirroring logical negation of AND and OR.',
          mathNotation: 'A \\cup B = \\{x : x \\in A \\text{ or } x \\in B\\}\nA \\cap B = \\{x : x \\in A \\text{ and } x \\in B\\}\n(A \\cup B)^c = A^c \\cap B^c',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'set-understand-demorgan', description: 'Verify De Morgan\'s laws with a concrete example', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'connect',
      {
        type: 'connect',
        title: 'Connecting Sets to Everything',
        narrativeIntro:
          'Set theory is the foundation. Numbers are defined as sets. Functions are sets of pairs. Topology is about open sets. Probability is about measure on sets. Even category theory starts with sets as its first example.',
        content: {
          text: 'Russell\'s paradox (the set of all sets that don\'t contain themselves) showed that naive set theory leads to contradictions. Axiomatic set theory (ZFC) resolved this by carefully restricting which sets can exist. This foundational crisis led to a deeper understanding of mathematical truth itself.',
          mathNotation: 'R = \\{x : x \\notin x\\} \\quad \\text{Paradox: } R \\in R \\iff R \\notin R',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'set-connect-paradox', description: 'Understand Russell\'s paradox', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'create',
      {
        type: 'create',
        title: 'Creating with Classification',
        narrativeIntro:
          'Use set operations to build a classification system for something you care about. Music genres, recipe ingredients, programming languages — anything can be organized into overlapping sets.',
        content: {
          text: 'Build an interactive Venn diagram tool that classifies a domain of your choice. Use set operations to answer questions: What genres share characteristics? What ingredients appear in multiple cuisines? Power sets (the set of all subsets) grow exponentially — a set with n elements has 2^n subsets.',
          mathNotation: '|\\mathcal{P}(A)| = 2^{|A|}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'set-create-classify', description: 'Create a classification system using sets', type: 'creation-made' },
        ],
      },
    ],
  ]),
};

// ─── Category Theory ──────────────────────────────────

const categoryTheory: Foundation = {
  id: 'category-theory',
  name: 'Category Theory',
  subtitle: 'Arrows',
  order: 6,
  description:
    'Category theory is the mathematics of structure and transformation. It cares not about what things ARE but about how they RELATE — the arrows (morphisms) between objects. It is the Rosetta Stone of mathematics: the same pattern appearing in algebra, topology, logic, and computation.',
  color: '#d47a6b',
  icon: '⟶',
  wonderConnections: [
    {
      id: 'cat-wc-translation',
      phenomenon: 'Translation Between Languages',
      description:
        'A translator preserves meaning while changing form. A functor in category theory does the same: it maps one mathematical world to another while preserving the essential structure — the relationships between objects.',
      foundationMapping: 'A functor F: C -> D maps objects and morphisms while preserving composition and identity.',
    },
    {
      id: 'cat-wc-recipes',
      phenomenon: 'Recipe Adaptations',
      description:
        'A recipe can be adapted for different dietary needs (vegan, gluten-free) while preserving the essential relationships between ingredients and steps. This adaptation is a functor: it maps the original recipe to a new one while preserving structure.',
      foundationMapping: 'Diet adaptation as functor: ingredients map to substitutes, steps map to modified steps, composition preserved.',
    },
  ],
  skillCreatorAnalog: {
    mathConcept: 'Functors between domains',
    skillCreatorFunction: 'Rosetta Core',
    explanation:
      'The skill-creator\'s Rosetta Core is a category-theoretic structure. It maps concepts between domains (math, code, nature, narrative) while preserving relationships. A functor from mathematics to TypeScript preserves compositional structure: if A -> B -> C in math, the code analog composes the same way.',
    complexPlanePosition: { theta: (3 * Math.PI) / 4, r: 0.85 },
    codeParallel: 'rosettaCore.translate(concept, fromDomain, toDomain) — a functor in action',
  },
  connections: [],
  phases: new Map<PhaseType, FoundationPhase>([
    [
      'wonder',
      {
        type: 'wonder',
        title: 'The Pattern Behind Patterns',
        narrativeIntro:
          'Have you ever noticed that two very different things follow the same pattern? Numbers can be added. Strings can be concatenated. Sets can be unioned. The operations are different, but the STRUCTURE is the same. Category theory is the mathematics that captures this sameness.',
        content: {
          text: 'Category theory is sometimes called "abstract nonsense" — but it is actually the deepest kind of sense. It reveals that the same structural patterns appear across all of mathematics, computer science, physics, and linguistics. Learning to see these patterns is like learning to read a hidden language.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'cat-wonder-read', description: 'Read the introduction to category theory', type: 'manual' },
        ],
      },
    ],
    [
      'see',
      {
        type: 'see',
        title: 'Seeing Arrows',
        narrativeIntro:
          'A category is a collection of objects connected by arrows (morphisms). The only rules: arrows can be composed (if A->B and B->C, then A->C exists), and every object has an identity arrow to itself. That\'s it. From these simple rules, all of mathematics emerges.',
        content: {
          text: 'Watch a category diagram: dots (objects) connected by arrows (morphisms). Follow composition: two arrows combine into a third. Notice that identity arrows are invisible — they are always there, but they do nothing. This simplicity is the source of category theory\'s power.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'cat-see-diagram', description: 'Observe a category diagram with composition', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'touch',
      {
        type: 'touch',
        title: 'Building Categories',
        narrativeIntro:
          'Build your own category. Place objects, draw arrows between them, and verify composition. The system will check that your arrows compose correctly and that identity arrows exist.',
        content: {
          text: 'Drag to create objects and arrows. The system enforces the category laws: every composition must exist, and every identity must be present. Try building the category of sets (objects = sets, arrows = functions), or a simple preorder (objects = numbers, arrows = less-than-or-equal).',
        },
        interactiveElements: [
          {
            id: 'cat-touch-objects',
            type: 'draggable-point',
            config: {
              name: 'object',
              label: 'Category Object',
              type: 'drag-point',
              default: 0,
              description: 'Place objects in the category diagram',
            },
            affectsVisualization: true,
          },
          {
            id: 'cat-touch-arrow',
            type: 'button',
            config: {
              name: 'drawArrow',
              label: 'Draw Morphism',
              type: 'toggle',
              default: false,
              description: 'Toggle arrow-drawing mode to connect objects',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'cat-touch-build', description: 'Build a category with at least 3 objects and 4 morphisms', type: 'interaction-count', threshold: 4 },
          { id: 'cat-touch-compose', description: 'Verify at least 2 compositions', type: 'interaction-count', threshold: 2 },
        ],
      },
    ],
    [
      'understand',
      {
        type: 'understand',
        title: 'Understanding Functors',
        narrativeIntro:
          'A functor is a structure-preserving map between categories. It sends objects to objects and arrows to arrows, preserving composition and identities. Functors are the "morphisms between categories" — arrows between entire mathematical worlds.',
        content: {
          text: 'A functor F from category C to category D maps every object in C to an object in D and every morphism in C to a morphism in D, such that composition and identities are preserved. Functors formalize the idea of "structural analogy" — the same pattern in different settings.',
          mathNotation: 'F: C \\to D\nF(f \\circ g) = F(f) \\circ F(g)\nF(id_A) = id_{F(A)}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'cat-understand-functor', description: 'Understand how functors preserve structure', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'connect',
      {
        type: 'connect',
        title: 'Connecting Everything',
        narrativeIntro:
          'Natural transformations connect functors to each other, forming a "category of categories." This meta-structure reveals deep relationships: the Yoneda lemma says every object is determined by its relationships (morphisms). Category theory is the ultimate connection-finder.',
        content: {
          text: 'The Yoneda lemma is one of the most important results in category theory. It states that an object is completely determined by the collection of morphisms into (or out of) it. In other words: you are your relationships. This principle appears in physics (gauge theory), computation (types), and philosophy (structuralism).',
          mathNotation: '\\text{Nat}(\\text{Hom}(A, -), F) \\cong F(A)\n\\text{(Yoneda Lemma)}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'cat-connect-yoneda', description: 'Explore the Yoneda perspective', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'create',
      {
        type: 'create',
        title: 'Creating with Structure',
        narrativeIntro:
          'Build a Rosetta Stone: take a concept (like "combining things") and map it across multiple domains using functors. Show how addition of numbers, concatenation of strings, and union of sets are all instances of the same categorical structure (a monoid).',
        content: {
          text: 'A monoid is a category with one object. Its morphisms are the elements, and composition is the operation. Numbers under addition, strings under concatenation, and functions under composition are all monoids. Map between them with functors to create your own Rosetta Stone of analogies.',
          mathNotation: '(M, \\cdot, e) \\quad \\text{where} \\quad a \\cdot (b \\cdot c) = (a \\cdot b) \\cdot c \\quad \\text{and} \\quad a \\cdot e = e \\cdot a = a',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'cat-create-rosetta', description: 'Create a cross-domain structural mapping', type: 'creation-made' },
        ],
      },
    ],
  ]),
};

// ─── Information Theory ───────────────────────────────

const informationTheory: Foundation = {
  id: 'information-theory',
  name: 'Information Theory',
  subtitle: 'The Channel',
  order: 7,
  description:
    'Information theory is the mathematics of communication. How much information does a message carry? How efficiently can it be compressed? How reliably can it be transmitted through a noisy channel? Claude Shannon answered these questions in 1948, founding the digital age.',
  color: '#c4a02d',
  icon: '⊕',
  wonderConnections: [
    {
      id: 'info-wc-surprise',
      phenomenon: 'Surprise and Prediction',
      description:
        'When something surprising happens, you learn more than when something predictable happens. "The sun rose today" carries almost no information. "It snowed in the Sahara" carries a lot. Information IS surprise, measured mathematically.',
      foundationMapping: 'Information content I(x) = -log2(P(x)) — rare events carry more information.',
    },
    {
      id: 'info-wc-compression',
      phenomenon: 'ZIP Files and MP3s',
      description:
        'Why can a ZIP file make a document smaller without losing anything? Because the document has redundancy — patterns that can be described more efficiently. Shannon proved there is a fundamental limit to how much you can compress: the entropy.',
      foundationMapping: 'Shannon entropy H = -sum(p_i * log2(p_i)) is the minimum bits per symbol for lossless compression.',
    },
  ],
  skillCreatorAnalog: {
    mathConcept: 'Channel capacity and token budget',
    skillCreatorFunction: 'Token budget management',
    explanation:
      'In the skill-creator, the Claude API has a finite context window — a channel with limited capacity. Information theory governs how to use it efficiently: compress prompts, eliminate redundancy, maximize the information per token. The skill-creator\'s token budget is Shannon\'s channel capacity made concrete.',
    complexPlanePosition: { theta: (5 * Math.PI) / 6, r: 0.9 },
    codeParallel: 'tokenBudget = channelCapacity; efficiency = information / tokensUsed',
  },
  connections: [],
  phases: new Map<PhaseType, FoundationPhase>([
    [
      'wonder',
      {
        type: 'wonder',
        title: 'What Is Information?',
        narrativeIntro:
          'What does it mean to "know" something? How much does a single bit — a yes-or-no answer — tell you? If I flip a fair coin and tell you the result, I have given you exactly one bit of information. If the coin is weighted, the information is different. Shannon made this precise.',
        content: {
          text: 'Information is not about meaning — it is about surprise. A message that tells you something you already knew carries zero information. A message that tells you something completely unexpected carries maximum information. Shannon measured this mathematically, creating the foundation for all digital communication.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'info-wonder-read', description: 'Read the introduction', type: 'manual' },
        ],
      },
    ],
    [
      'see',
      {
        type: 'see',
        title: 'Seeing Entropy',
        narrativeIntro:
          'Watch a histogram of symbol frequencies. As the distribution becomes more uniform (every symbol equally likely), entropy increases. As it becomes more peaked (one symbol dominates), entropy drops. Entropy IS the spread of probability.',
        content: {
          text: 'Shannon entropy measures the average surprise per symbol. When all outcomes are equally likely, entropy is maximized — there is no way to predict what comes next. When one outcome dominates, entropy is low — most messages are unsurprising. The visualization shows how probability distributions map to entropy values.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'info-see-entropy', description: 'Observe how probability distributions affect entropy', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'touch',
      {
        type: 'touch',
        title: 'Touching Probability',
        narrativeIntro:
          'Adjust the probabilities of symbols in an alphabet. Watch entropy change in real time. Find the distribution that maximizes entropy. Find the one that minimizes it.',
        content: {
          text: 'Drag the probability sliders for a set of symbols (e.g., letters A through D). The entropy meter updates in real time. Notice: entropy is maximized when all symbols are equally likely, and minimized when one symbol has probability 1 (certainty). Try to create specific entropy values.',
        },
        interactiveElements: [
          {
            id: 'info-touch-prob',
            type: 'slider',
            config: {
              name: 'probability',
              label: 'Symbol Probability',
              type: 'slider',
              min: 0,
              max: 1,
              step: 0.01,
              default: 0.25,
              unit: '',
              description: 'Adjust the probability of a symbol to see how entropy changes',
            },
            affectsVisualization: true,
          },
          {
            id: 'info-touch-symbols',
            type: 'slider',
            config: {
              name: 'symbolCount',
              label: 'Number of Symbols',
              type: 'slider',
              min: 2,
              max: 16,
              step: 1,
              default: 4,
              unit: '',
              description: 'Change the alphabet size',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'info-touch-max-entropy', description: 'Find the maximum entropy distribution', type: 'interaction-count', threshold: 1 },
          { id: 'info-touch-explore', description: 'Explore at least 5 different probability distributions', type: 'interaction-count', threshold: 5 },
        ],
      },
    ],
    [
      'understand',
      {
        type: 'understand',
        title: 'Understanding Entropy',
        narrativeIntro:
          'Shannon entropy is measured in bits. A fair coin has 1 bit of entropy. A fair die has about 2.58 bits. The English language has about 1.0-1.5 bits per character (much less than the ~4.7 bits a uniform 26-letter alphabet would have), because English is highly redundant.',
        content: {
          text: 'Shannon entropy H(X) measures the expected information content of a random variable X. It is always non-negative, maximized by the uniform distribution, and additive for independent variables. Conditional entropy H(X|Y) measures remaining uncertainty about X after observing Y. Mutual information I(X;Y) = H(X) - H(X|Y) measures how much Y tells you about X.',
          mathNotation: 'H(X) = -\\sum_{x} P(x) \\log_2 P(x)\nI(X;Y) = H(X) - H(X|Y) = H(Y) - H(Y|X)',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'info-understand-entropy', description: 'Calculate entropy for a given distribution', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'connect',
      {
        type: 'connect',
        title: 'Connecting Channels',
        narrativeIntro:
          'Shannon\'s noisy channel coding theorem is the crown jewel: for any channel with noise, there exists a coding scheme that achieves reliable communication at any rate below the channel capacity. This is why your phone call works, your WiFi streams video, and your text messages arrive intact.',
        content: {
          text: 'The channel capacity C is the maximum rate at which information can be reliably transmitted. Shannon proved that reliable communication is possible at any rate below C, and impossible above it. This limit depends on signal power, noise power, and bandwidth — captured in the Shannon-Hartley theorem.',
          mathNotation: 'C = B \\log_2\\left(1 + \\frac{S}{N}\\right)\n\\text{where B = bandwidth, S/N = signal-to-noise ratio}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'info-connect-capacity', description: 'Explore how noise affects channel capacity', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'create',
      {
        type: 'create',
        title: 'Creating with Codes',
        narrativeIntro:
          'Build a compression algorithm. Encode a message using Huffman coding — assigning shorter codes to more frequent symbols. See how close you can get to the entropy limit. Or build an error-correcting code that can survive a noisy channel.',
        content: {
          text: 'Huffman coding assigns variable-length bit strings to symbols based on their frequency. Frequent symbols get short codes; rare symbols get long ones. The average code length approaches the entropy — the theoretical minimum. Build a Huffman tree for a text and see the compression ratio.',
          mathNotation: 'L_{avg} = \\sum_i p_i \\cdot l_i \\geq H(X)\n\\text{where } l_i \\text{ is the code length for symbol } i',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'info-create-code', description: 'Build a Huffman encoding for a message', type: 'creation-made' },
        ],
      },
    ],
  ]),
};

// ─── L-Systems ────────────────────────────────────────

const lSystems: Foundation = {
  id: 'l-systems',
  name: 'L-Systems',
  subtitle: 'Growth',
  order: 8,
  description:
    'L-Systems (Lindenmayer systems) are the mathematics of growth and self-similarity. Simple rewriting rules, applied iteratively, produce the branching patterns of trees, the spirals of shells, the fractals of ferns. They show how vast complexity emerges from simple rules.',
  color: '#2da55a',
  icon: '\uD83C\uDF3F',
  wonderConnections: [
    {
      id: 'lsys-wc-fern',
      phenomenon: 'Fern Fronds',
      description:
        'Look at a fern. Each frond is a smaller copy of the whole plant. Each sub-frond is a smaller copy of the frond. This self-similarity at every scale is exactly what L-systems produce: recursive growth from a simple rule.',
      foundationMapping: 'Fern shape from L-system rule: F -> F[+F]F[-F]F — branching at each step.',
    },
    {
      id: 'lsys-wc-snowflake',
      phenomenon: 'Snowflakes and Coastlines',
      description:
        'The Koch snowflake — made by repeatedly replacing each line segment with a triangular bump — has infinite perimeter but finite area. Coastlines exhibit the same property: the more closely you measure, the longer they get. This is fractal geometry, powered by L-system-like iteration.',
      foundationMapping: 'Koch curve rule: F -> F+F--F+F — each iteration adds detail at every scale.',
    },
    {
      id: 'lsys-wc-trees',
      phenomenon: 'Branching Trees',
      description:
        'A tree trunk splits into branches. Each branch splits again. The pattern of splitting follows rules that can be captured by an L-system. Different rules produce different species: the wide canopy of an oak, the conical form of a spruce, the weeping silhouette of a willow.',
      foundationMapping: 'Tree branching as L-system with stochastic rules: branch angle, length ratio, and branching probability.',
    },
  ],
  skillCreatorAnalog: {
    mathConcept: 'Iterative rewriting and promotion pipeline',
    skillCreatorFunction: 'Promotion pipeline',
    explanation:
      'The skill-creator\'s promotion pipeline is an L-system: observe -> detect -> suggest -> apply -> learn -> compose. Each stage rewrites the skill\'s state, producing increasingly complex behavior from simple rules. Just as an L-system turns "F" into a tree through iterative rewriting, a skill grows from a pattern observation into a fully composed capability.',
    complexPlanePosition: { theta: (11 * Math.PI) / 12, r: 0.95 },
    codeParallel: 'promotionPipeline = ["observe", "detect", "suggest", "apply", "learn", "compose"]',
  },
  connections: [],
  phases: new Map<PhaseType, FoundationPhase>([
    [
      'wonder',
      {
        type: 'wonder',
        title: 'How Does a Tree Know Its Shape?',
        narrativeIntro:
          'A tree has no blueprint. No architect draws its branches. Yet every oak looks like an oak, and every fern looks like a fern. How does such complex, beautiful form emerge from a single seed? The answer is iteration: simple rules, applied again and again, growing complexity from nothing.',
        content: {
          text: 'Aristid Lindenmayer invented L-systems in 1968 to model plant growth. He discovered that the branching patterns of plants could be described by simple string-rewriting rules. Replace each symbol by a string of symbols, over and over, and the patterns of nature emerge. Simplicity generates complexity.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'lsys-wonder-read', description: 'Read the introduction', type: 'manual' },
        ],
      },
    ],
    [
      'see',
      {
        type: 'see',
        title: 'Seeing Growth',
        narrativeIntro:
          'Watch a single line segment transform. With each iteration, parts of the line are replaced by more complex shapes. After just a few iterations, recognizable forms appear: ferns, trees, snowflakes, dragon curves.',
        content: {
          text: 'An L-system starts with an axiom (initial string) and applies production rules simultaneously to all symbols. The string grows exponentially, and when interpreted as drawing instructions (F = forward, + = turn left, - = turn right, [ = save position, ] = restore position), beautiful fractal patterns appear.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'lsys-see-grow', description: 'Watch an L-system grow through at least 4 iterations', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'touch',
      {
        type: 'touch',
        title: 'Growing Your Own',
        narrativeIntro:
          'Now you control the rules. Change the branching angle. Modify the production rule. Add new symbols. Watch your L-system grow into shapes you have never seen before.',
        content: {
          text: 'Adjust the parameters of an L-system: the axiom, the production rules, the branching angle, and the number of iterations. Small changes in the rules produce dramatically different results. Try the classic presets (Koch curve, Sierpinski triangle, branching plant) and then experiment with your own.',
        },
        interactiveElements: [
          {
            id: 'lsys-touch-angle',
            type: 'slider',
            config: {
              name: 'branchAngle',
              label: 'Branch Angle',
              type: 'slider',
              min: 5,
              max: 90,
              step: 1,
              default: 25,
              unit: 'degrees',
              description: 'Set the angle at which branches diverge',
            },
            affectsVisualization: true,
          },
          {
            id: 'lsys-touch-iterations',
            type: 'slider',
            config: {
              name: 'iterations',
              label: 'Iterations',
              type: 'slider',
              min: 1,
              max: 8,
              step: 1,
              default: 4,
              unit: '',
              description: 'Control how many times the rules are applied',
            },
            affectsVisualization: true,
          },
          {
            id: 'lsys-touch-rule',
            type: 'text-input',
            config: {
              name: 'productionRule',
              label: 'Production Rule',
              type: 'select',
              default: 'F[+F]F[-F]F',
              description: 'Edit the L-system production rule for symbol F',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'lsys-touch-presets', description: 'Try at least 3 different L-system presets', type: 'interaction-count', threshold: 3 },
          { id: 'lsys-touch-custom', description: 'Create a custom L-system rule', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'understand',
      {
        type: 'understand',
        title: 'Understanding Rewriting',
        narrativeIntro:
          'An L-system is a formal grammar. It has an alphabet (symbols), an axiom (starting string), and production rules (how each symbol is replaced). What makes L-systems special is that ALL symbols are replaced simultaneously (parallel rewriting), unlike sequential grammars used in compilers.',
        content: {
          text: 'Formally, an L-system is a triple (V, omega, P) where V is the alphabet, omega is the axiom, and P is the set of production rules. The key insight is parallel rewriting: every symbol in the string is replaced at once, modeling the way cells in a plant all divide simultaneously. This parallelism is what produces the characteristic branching and self-similarity.',
          mathNotation: 'G = (V, \\omega, P)\n\\text{Example: } V = \\{F, +, -\\}, \\; \\omega = F, \\; P = \\{F \\to F+F-F-F+F\\}\n\\text{Iteration 0: } F\n\\text{Iteration 1: } F+F-F-F+F',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'lsys-understand-grammar', description: 'Understand the formal grammar of L-systems', type: 'insight-recorded' },
        ],
      },
    ],
    [
      'connect',
      {
        type: 'connect',
        title: 'Connecting Growth Patterns',
        narrativeIntro:
          'L-systems connect to fractals (self-similar structures at every scale), to the unit circle (branching angles are trigonometric), to information theory (the production rules encode the "program" for growth), and to category theory (the rewriting rules are morphisms in a string category).',
        content: {
          text: 'The fractal dimension of an L-system curve measures its complexity. The Koch curve has dimension log(4)/log(3) approx 1.26 — more than a line but less than a plane. Stochastic L-systems add randomness to the rules, producing the natural variation seen in real plants. Context-sensitive L-systems let rules depend on neighbors, modeling cell-to-cell communication.',
          mathNotation: 'D = \\frac{\\log N}{\\log S}\n\\text{Koch curve: } D = \\frac{\\log 4}{\\log 3} \\approx 1.2619',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'lsys-connect-fractal', description: 'Explore fractal dimension of an L-system', type: 'interaction-count', threshold: 1 },
        ],
      },
    ],
    [
      'create',
      {
        type: 'create',
        title: 'Creating Living Art',
        narrativeIntro:
          'You have come full circle. The final foundation loops back to the first — L-systems use trigonometry (angles), which lives on the unit circle. Now create a living artwork: a growing, branching, fractal structure that embodies everything you have learned.',
        content: {
          text: 'Design an L-system that produces a visually striking pattern. Combine deterministic rules with stochastic variation. Use color to indicate depth or iteration count. Animate the growth process to show how complexity emerges from simplicity. This is your capstone creation — the universe growing from a seed.',
          mathNotation: '\\text{Stochastic rule: } F \\xrightarrow{0.5} F[+F]F[-F]F \\;|\\; F \\xrightarrow{0.5} F[-F]F[+F]F',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'lsys-create-art', description: 'Create a generative L-system artwork', type: 'creation-made' },
        ],
      },
    ],
  ]),
};

// ─── Foundation Registry ──────────────────────────────

const FOUNDATIONS: Map<FoundationId, Foundation> = new Map([
  ['unit-circle', unitCircle],
  ['pythagorean', pythagorean],
  ['trigonometry', trigonometry],
  ['vector-calculus', vectorCalculus],
  ['set-theory', setTheory],
  ['category-theory', categoryTheory],
  ['information-theory', informationTheory],
  ['l-systems', lSystems],
]);

// ─── Public API ───────────────────────────────────────

export function getFoundation(id: FoundationId): Foundation {
  const f = FOUNDATIONS.get(id);
  if (!f) {
    throw new Error(`Foundation not found: ${id}`);
  }
  return f;
}

export function getAllFoundations(): Foundation[] {
  return FOUNDATION_ORDER.map((id) => getFoundation(id));
}

export function getFoundationPhase(id: FoundationId, phase: PhaseType): FoundationPhase {
  const f = getFoundation(id);
  const p = f.phases.get(phase);
  if (!p) {
    throw new Error(`Phase '${phase}' not found for foundation '${id}'`);
  }
  return p;
}

export function getWonderConnections(id: FoundationId): WonderConnection[] {
  return getFoundation(id).wonderConnections;
}

export function getSkillCreatorMapping(id: FoundationId): SkillCreatorMapping {
  return getFoundation(id).skillCreatorAnalog;
}

export function getNextFoundation(id: FoundationId): FoundationId | null {
  const idx = FOUNDATION_ORDER.indexOf(id);
  if (idx === -1 || idx === FOUNDATION_ORDER.length - 1) return null;
  return FOUNDATION_ORDER[idx + 1];
}

export function getPreviousFoundation(id: FoundationId): FoundationId | null {
  const idx = FOUNDATION_ORDER.indexOf(id);
  if (idx <= 0) return null;
  return FOUNDATION_ORDER[idx - 1];
}
