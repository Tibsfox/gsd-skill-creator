// Foundation Registry — The authoritative source for all 8 mathematical foundations.
// Read-only after initialization. Every component depends on this data.

import type {
  Foundation,
  FoundationId,
  FoundationPhase,
  PhaseType,
  WonderConnection,
  SkillCreatorMapping,
} from '../types/index';

import { FOUNDATION_ORDER, PHASE_ORDER } from '../types/index';

// ─── Internal Registry Store ────────────────────────────────

const foundations: Map<FoundationId, Foundation> = new Map();

// ─── Helper: Build phase map ────────────────────────────────

function phaseMap(phases: FoundationPhase[]): Map<PhaseType, FoundationPhase> {
  const map = new Map<PhaseType, FoundationPhase>();
  for (const phase of phases) {
    map.set(phase.type, phase);
  }
  return map;
}

// ─── Foundation Data ────────────────────────────────────────

function initializeRegistry(): void {
  if (foundations.size > 0) return; // already initialized

  // ── 1. Unit Circle ──────────────────────────────────────

  foundations.set('unit-circle', {
    id: 'unit-circle',
    name: 'Unit Circle',
    subtitle: 'Seeing',
    order: 1,
    description: 'Separate things resolve into one object. The unit circle is the simplest complete mathematical structure — a single radius sweeping all possible angles. It teaches that what looks like many separate values (sine, cosine, tangent) are really one point moving along one path.',
    color: '#1e3a5f',
    icon: 'circle',
    connections: [],
    wonderConnections: [
      {
        id: 'uc-wc-rotation',
        phenomenon: 'Earth\'s rotation and the cycle of day and night',
        description: 'Every 24 hours the Earth completes one full rotation. Dawn, noon, dusk, midnight — they feel like separate events, but they are one continuous sweep. The sun does not jump between positions. It traces a circle.',
        foundationMapping: 'The unit circle unifies sine, cosine, and tangent into a single rotating point. Separate-looking values are really one motion viewed from different angles.',
        imagePrompt: 'Time-lapse of a sundial shadow sweeping a full circle over one day, warm golden light.',
      },
      {
        id: 'uc-wc-sundial',
        phenomenon: 'Sundial shadows trace circular arcs',
        description: 'A stick in the ground casts a shadow that moves in a smooth arc from morning to evening. Ancient peoples noticed this arc and used it to mark time. The shadow never jumps. It never stops. It sweeps.',
        foundationMapping: 'The shadow tip position at any moment can be described by an angle on the unit circle. Time itself becomes an angle.',
        imagePrompt: 'Overhead view of a sundial with its shadow sweeping in a perfect arc across stone.',
      },
      {
        id: 'uc-wc-seasons',
        phenomenon: 'The cycle of seasons',
        description: 'Spring, summer, autumn, winter — four points on a circle that the Earth draws once each year as it tilts toward and away from the sun. We name the seasons as if they are separate, but the tilt is continuous.',
        foundationMapping: 'The axial tilt of Earth traces a sinusoidal temperature curve. The unit circle provides the framework: angle equals time of year, radius equals intensity.',
      },
    ],
    skillCreatorAnalog: {
      mathConcept: 'Unit circle position (angle theta)',
      skillCreatorFunction: 'Complex Plane theta position — abstract-to-concrete spectrum',
      explanation: 'In skill-creator, every skill lives at an angle on the complex plane. Abstract skills (pure math, theory) sit near theta=0. Concrete skills (code, builds) sit near theta=pi. The unit circle IS the skill-creator\'s coordinate system.',
      complexPlanePosition: { theta: 0, r: 1.0 },
      codeParallel: 'Skill positioning on the complex plane: z = r * e^(i*theta)',
    },
    phases: phaseMap([
      {
        type: 'wonder',
        title: 'One Circle, Everything',
        narrativeIntro: 'Before there is any formula, before there is any number, there is a shape. The oldest shape. The shape that taught humanity to measure time, navigate oceans, and predict eclipses. A circle.',
        content: {
          text: 'Look at a clock face. The hour hand sweeps one full circle every twelve hours. At noon it points straight up. At three it points right. At six it points straight down. At nine it points left. Four positions, but one motion — a single hand, tracing one path.\n\nNow imagine you could watch that hand from two different windows. From the east window, you only see how far up or down the hand is. From the south window, you only see how far left or right. Each window shows you something different, but both are watching the same hand make the same circle.\n\nThis is the secret: things that look separate are often one thing, seen from different angles.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'uc-wonder-time', description: 'Spend at least 30 seconds reading', type: 'time-spent', threshold: 30000 },
          { id: 'uc-wonder-continue', description: 'Choose to continue', type: 'manual' },
        ],
      },
      {
        type: 'see',
        title: 'Watching the Point Move',
        narrativeIntro: 'Now we watch. A single point begins to move along a circle, and we track what it does.',
        content: {
          text: 'A point starts on the right side of a circle and begins to move counter-clockwise. As it moves, two shadows appear: one on the vertical axis showing the point\'s height, and one on the horizontal axis showing its side-to-side position.\n\nThe height shadow rises, peaks at the top, descends through zero, dips to the bottom, and returns. The side shadow does the same thing, but shifted — when the height is at its peak, the side is at zero.\n\nTwo waves. One circle. The same point makes both.',
        },
        interactiveElements: [
          {
            id: 'uc-see-point',
            type: 'drag-point',
            config: {
              name: 'angle',
              label: 'Point position',
              type: 'drag-point',
              min: 0,
              max: 6.283,
              step: 0.01,
              default: 0,
              unit: 'radians',
              description: 'Drag the point around the unit circle',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'uc-see-drag', description: 'Drag the point at least once around the full circle', type: 'interaction-count', threshold: 1 },
        ],
      },
      {
        type: 'touch',
        title: 'Your Hand on the Circle',
        narrativeIntro: 'Now it is your turn. Drag the point. Change the speed. Watch what happens to the waves.',
        content: {
          text: 'Drag the point around the circle and watch both waves respond in real time. Try moving it slowly — see how the waves stretch out? Try moving it fast — see how they compress?\n\nNow try stopping at specific positions. When the point is at the very top, what is the height? What is the side position? When it is at 45 degrees, are the two shadows equal?\n\nNotice: you are controlling one thing (the angle) and producing two outputs (height and side position). One input, two outputs. That is the unit circle.',
        },
        interactiveElements: [
          {
            id: 'uc-touch-angle',
            type: 'slider',
            config: {
              name: 'angle',
              label: 'Angle',
              type: 'slider',
              min: 0,
              max: 6.283,
              step: 0.01,
              default: 0,
              unit: 'radians',
              description: 'Set the angle of the point on the unit circle',
            },
            affectsVisualization: true,
          },
          {
            id: 'uc-touch-speed',
            type: 'slider',
            config: {
              name: 'speed',
              label: 'Animation speed',
              type: 'slider',
              min: 0.1,
              max: 5,
              step: 0.1,
              default: 1,
              unit: 'x',
              description: 'Control how fast the point moves',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'uc-touch-interact', description: 'Interact with both controls', type: 'interaction-count', threshold: 5 },
        ],
      },
      {
        type: 'understand',
        title: 'The Language of the Circle',
        narrativeIntro: 'You have felt the circle. Now we name what you already know.',
        content: {
          text: 'The height of the point at angle theta is called sine(theta). The side position is called cosine(theta). These are not separate functions — they are two coordinates of the same point.\n\nThe relationship between them is absolute: at every angle, the square of the height plus the square of the side position equals exactly 1. Always. This is the Pythagorean identity, and it holds because the point never leaves the circle.',
          mathNotation: '\\sin^2(\\theta) + \\cos^2(\\theta) = 1',
          codeExamples: [
            {
              language: 'typescript',
              code: '// The unit circle: one angle, two coordinates\nfunction unitCirclePoint(theta: number) {\n  return {\n    x: Math.cos(theta),  // horizontal position\n    y: Math.sin(theta),  // vertical position\n  };\n}\n\n// The Pythagorean identity — always true\nconst theta = Math.PI / 3; // any angle\nconst x = Math.cos(theta);\nconst y = Math.sin(theta);\nconsole.log(x * x + y * y); // 1.0000000000000002',
              description: 'The unit circle point function and Pythagorean identity verification',
            },
          ],
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'uc-understand-time', description: 'Spend at least 60 seconds with the explanation', type: 'time-spent', threshold: 60000 },
        ],
      },
      {
        type: 'connect',
        title: 'The Circle Appears Everywhere',
        narrativeIntro: 'The unit circle is not just one idea. It is a lens that reveals hidden connections.',
        content: {
          text: 'The unit circle connects to almost everything else in this observatory:\n\n- **Trigonometry** is the unit circle in motion — what happens when the angle keeps changing over time.\n- **The Pythagorean Theorem** is hidden inside: the identity sin squared plus cos squared equals 1 IS the Pythagorean theorem on a radius-1 triangle.\n- **L-Systems** will bring us back here — growth patterns loop back to circular recursion.\n\nEvery foundation you visit will illuminate the circle from a new angle.',
          mathNotation: 'e^{i\\theta} = \\cos(\\theta) + i\\sin(\\theta)',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'uc-connect-insight', description: 'Record at least one connection insight', type: 'insight-recorded', threshold: 1 },
        ],
      },
      {
        type: 'create',
        title: 'Draw with the Circle',
        narrativeIntro: 'Now make something. Use the circle as your instrument.',
        content: {
          text: 'Combine multiple unit circles — different radii, different speeds, different starting angles — to create patterns. This is the beginning of Fourier drawing: any shape can be built from spinning circles.\n\nStart simple: one circle. Add a second. Watch the path the combined point traces. You are drawing with pure rotation.',
          mathNotation: 'z(t) = \\sum_{k} r_k \\cdot e^{i \\omega_k t + \\phi_k}',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Combine spinning circles to draw patterns\nfunction epicycloidPoint(t: number, circles: { r: number; omega: number; phi: number }[]) {\n  let x = 0, y = 0;\n  for (const c of circles) {\n    x += c.r * Math.cos(c.omega * t + c.phi);\n    y += c.r * Math.sin(c.omega * t + c.phi);\n  }\n  return { x, y };\n}',
              description: 'Epicycloid generator — combine spinning circles to draw complex curves',
            },
          ],
        },
        interactiveElements: [
          {
            id: 'uc-create-canvas',
            type: 'canvas-paint',
            config: {
              name: 'epicycloid',
              label: 'Epicycloid canvas',
              type: 'drag-point',
              default: 0,
              description: 'Canvas for creating epicycloid art from combined spinning circles',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'uc-create-art', description: 'Create at least one piece of circle art', type: 'creation-made', threshold: 1 },
        ],
      },
    ]),
  });

  // ── 2. Pythagorean Theorem ──────────────────────────────

  foundations.set('pythagorean', {
    id: 'pythagorean',
    name: 'Pythagorean Theorem',
    subtitle: 'Relationship',
    order: 2,
    description: 'Independent dimensions combine into emergent wholes. The Pythagorean theorem shows that two perpendicular lengths determine a third — the diagonal. This is the mathematics of how separate things relate to produce something new.',
    color: '#c17817',
    icon: 'triangle',
    connections: [],
    wonderConnections: [
      {
        id: 'py-wc-spider',
        phenomenon: 'Spider webs and structural tension',
        description: 'A spider builds its web by stretching silk between anchor points. Every thread meets others at angles, and the web\'s strength comes from how perpendicular forces combine. Pull one strand sideways and the diagonal tension changes — the spider can feel which direction from the vibration pattern.',
        foundationMapping: 'The spider senses direction because perpendicular components combine into a resultant. The web is a physical Pythagorean theorem — radial and spiral threads meeting at right angles create structural integrity.',
      },
      {
        id: 'py-wc-room',
        phenomenon: 'The diagonal of a room',
        description: 'You want to fit a long pole into a room. It will not fit along the length. It will not fit along the width. But tilt it diagonally and it fits — because the diagonal is longer than either side. You knew this without math. You have always known this.',
        foundationMapping: 'The diagonal distance across a rectangle is the hypotenuse of a right triangle formed by the length and width. The Pythagorean theorem gives you the exact length of that diagonal.',
      },
      {
        id: 'py-wc-gps',
        phenomenon: 'GPS triangulation',
        description: 'Your phone knows where you are by measuring distances to multiple satellites. Each satellite gives a circle of possible positions, and where the circles cross is where you stand. The distance calculations use the Pythagorean theorem extended to three dimensions.',
        foundationMapping: 'GPS computes distance in 3D space. The 3D distance formula is the Pythagorean theorem applied three times: once for each pair of perpendicular axes.',
      },
    ],
    skillCreatorAnalog: {
      mathConcept: 'Hypotenuse from orthogonal components',
      skillCreatorFunction: 'Activation magnitude — orthogonal skill dimensions combining',
      explanation: 'In skill-creator, a skill\'s activation is the combined magnitude of independent dimensions (abstract knowledge, concrete practice, creative application). The Pythagorean theorem computes how these orthogonal components produce a single activation strength.',
      complexPlanePosition: { theta: Math.PI / 4, r: 1.0 },
      codeParallel: 'Skill magnitude: |z| = sqrt(abstract^2 + concrete^2)',
    },
    phases: phaseMap([
      {
        type: 'wonder',
        title: 'The Shortcut Across the Field',
        narrativeIntro: 'There is a field. The path goes along the edge, turns the corner, and continues along the other edge. Or you could cut straight across.',
        content: {
          text: 'You are standing at one corner of a rectangular field. Your friend is at the opposite corner. You could walk along the south edge, then turn and walk along the east edge. Two straight paths, one right-angle turn. Or you could walk straight toward your friend, cutting diagonally across the field.\n\nThe diagonal is always shorter than the two edges combined. But it is always longer than either edge alone. Something happens at that diagonal — two separate distances combine into one, and the result is neither their sum nor the larger of the two. It is something in between.\n\nThis in-between is not random. There is an exact relationship. People have known it for at least four thousand years.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'py-wonder-time', description: 'Spend at least 30 seconds reading', type: 'time-spent', threshold: 30000 },
          { id: 'py-wonder-continue', description: 'Choose to continue', type: 'manual' },
        ],
      },
      {
        type: 'see',
        title: 'Squares on the Sides',
        narrativeIntro: 'Watch what happens when you build squares on each side of a right triangle.',
        content: {
          text: 'A right triangle sits on the screen. On each of its three sides, a square grows outward. The two smaller squares — built on the two shorter sides — glow one color. The large square — built on the longest side — glows another.\n\nNow watch: the total area of the two smaller squares exactly equals the area of the large square. Move the triangle. Stretch it. Squash it. As long as the right angle stays, the areas always balance. Always.',
        },
        interactiveElements: [
          {
            id: 'py-see-triangle',
            type: 'drag-point',
            config: {
              name: 'vertex',
              label: 'Triangle vertex',
              type: 'drag-point',
              min: 0,
              max: 10,
              default: 3,
              description: 'Drag the vertex to reshape the right triangle',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'py-see-observe', description: 'Observe the square areas balancing', type: 'time-spent', threshold: 20000 },
        ],
      },
      {
        type: 'touch',
        title: 'Build Your Own Triangle',
        narrativeIntro: 'Drag the corners. Set the sides. See the relationship hold.',
        content: {
          text: 'You control the two shorter sides of a right triangle. Drag them to any length you want. The diagonal adjusts automatically, and the area squares update in real time.\n\nTry making the sides equal. Try making one side very long and the other very short. Try finding a triangle where all three sides are whole numbers. (Hint: 3 and 4 will give you something clean.)',
        },
        interactiveElements: [
          {
            id: 'py-touch-side-a',
            type: 'slider',
            config: {
              name: 'sideA',
              label: 'Side A length',
              type: 'slider',
              min: 0.5,
              max: 10,
              step: 0.1,
              default: 3,
              description: 'Set the length of side A',
            },
            affectsVisualization: true,
          },
          {
            id: 'py-touch-side-b',
            type: 'slider',
            config: {
              name: 'sideB',
              label: 'Side B length',
              type: 'slider',
              min: 0.5,
              max: 10,
              step: 0.1,
              default: 4,
              description: 'Set the length of side B',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'py-touch-interact', description: 'Try at least 3 different triangle configurations', type: 'interaction-count', threshold: 3 },
        ],
      },
      {
        type: 'understand',
        title: 'The Theorem Takes Shape',
        narrativeIntro: 'You already know the relationship. Now it gets a name and a formula.',
        content: {
          text: 'For any right triangle, the square of the longest side (the hypotenuse) equals the sum of the squares of the other two sides. This is the Pythagorean theorem.\n\nIt works because the two shorter sides are perpendicular — they point in completely independent directions. Neither side has any influence over the other. When you combine independent things, the Pythagorean theorem tells you the magnitude of the combination.\n\nThis extends to three dimensions, four dimensions, any number of dimensions. The pattern never breaks.',
          mathNotation: 'a^2 + b^2 = c^2',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Pythagorean theorem in any number of dimensions\nfunction hypotenuse(...sides: number[]): number {\n  return Math.sqrt(sides.reduce((sum, s) => sum + s * s, 0));\n}\n\nhypotenuse(3, 4);       // 5\nhypotenuse(3, 4, 12);   // 13\nhypotenuse(1, 1, 1, 1); // 2',
              description: 'The Pythagorean theorem generalized to n dimensions',
            },
          ],
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'py-understand-time', description: 'Spend at least 60 seconds with the explanation', type: 'time-spent', threshold: 60000 },
        ],
      },
      {
        type: 'connect',
        title: 'Perpendicular Truths Everywhere',
        narrativeIntro: 'The Pythagorean theorem is not just about triangles. It is about how independent dimensions combine.',
        content: {
          text: 'The Pythagorean theorem appears inside the unit circle (sin squared plus cos squared equals 1) and extends into vector calculus (distance in n-dimensional space). Every time you combine perpendicular components — voltage and current, north and east, real and imaginary — the Pythagorean theorem is there.\n\nIn vector calculus, the distance formula between any two points is the Pythagorean theorem applied to each dimension separately.',
          mathNotation: 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'py-connect-insight', description: 'Record at least one connection insight', type: 'insight-recorded', threshold: 1 },
        ],
      },
      {
        type: 'create',
        title: 'Build with Right Angles',
        narrativeIntro: 'Use the Pythagorean theorem to construct and explore.',
        content: {
          text: 'Build a Pythagorean tree — a fractal made by placing squares on the sides of right triangles, then placing smaller right triangles on those squares, repeating forever. The result is a beautiful branching structure that emerges from nothing but right angles and the relationship between perpendicular sides.',
          mathNotation: 'T_{n+1}: \\text{place right triangle on hypotenuse square of } T_n',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Pythagorean tree: recursive squares on right triangles\nfunction pythagoreanTree(x: number, y: number, size: number, angle: number, depth: number): void {\n  if (depth === 0) return;\n  // Draw square, then recurse on the two smaller squares\n  const leftSize = size * Math.cos(angle);\n  const rightSize = size * Math.sin(angle);\n  pythagoreanTree(x, y, leftSize, angle, depth - 1);\n  pythagoreanTree(x, y, rightSize, angle, depth - 1);\n}',
              description: 'Pythagorean tree fractal generator',
            },
          ],
        },
        interactiveElements: [
          {
            id: 'py-create-canvas',
            type: 'canvas-paint',
            config: {
              name: 'pythagorean-tree',
              label: 'Pythagorean tree canvas',
              type: 'drag-point',
              default: 0,
              description: 'Canvas for creating Pythagorean tree fractals',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'py-create-art', description: 'Create at least one Pythagorean construction', type: 'creation-made', threshold: 1 },
        ],
      },
    ]),
  });

  // ── 3. Trigonometry ─────────────────────────────────────

  foundations.set('trigonometry', {
    id: 'trigonometry',
    name: 'Trigonometry',
    subtitle: 'Motion',
    order: 3,
    description: 'Static geometry becomes waves. Trigonometry takes the unit circle and sets it in motion — the angle changes over time, and what emerges are the waves that describe tides, sound, light, seasons, and every periodic phenomenon in nature.',
    color: '#0d7377',
    icon: 'wave',
    connections: [],
    wonderConnections: [
      {
        id: 'trig-wc-tides',
        phenomenon: 'Ocean tides rising and falling',
        description: 'Twice a day the ocean breathes — rising up the shore, then retreating. The tide follows the moon\'s gravitational pull as the Earth rotates, producing a wave with a period of about twelve hours. Stand on any beach and you are watching a trigonometric function written in water.',
        foundationMapping: 'Tidal height as a function of time is a sinusoidal wave. The amplitude is the tidal range. The period is the time between high tides. Trigonometry describes the continuous curve.',
      },
      {
        id: 'trig-wc-swing',
        phenomenon: 'A child on a swing',
        description: 'Push a swing and it arcs forward, slows, pauses at the peak, then sweeps back. The motion repeats, each arc a little smaller unless you push again. The swing traces a sine wave in time — its position at any moment is a trigonometric function of time.',
        foundationMapping: 'The pendulum motion of a swing is described by sine and cosine. The angle of the swing from vertical, plotted against time, draws a damped sine wave.',
      },
      {
        id: 'trig-wc-guitar',
        phenomenon: 'Guitar strings vibrating',
        description: 'Pluck a guitar string and it vibrates. The vibration is not random — the string moves in a standing wave pattern. The fundamental frequency is the note you hear. The overtones — integer multiples of the fundamental — give the guitar its warm timbre. Every note is a sum of sine waves.',
        foundationMapping: 'Musical notes are sinusoidal vibrations. Harmonics are integer-frequency multiples. The timbre of any instrument is the specific combination of sine waves it produces.',
      },
    ],
    skillCreatorAnalog: {
      mathConcept: 'Angular velocity and periodic functions',
      skillCreatorFunction: 'Skill refinement rate — angular velocity as phase position and learning speed',
      explanation: 'In skill-creator, skills refine at a rate analogous to angular velocity. Fast-learning skills spin through the observe-detect-suggest-apply cycle quickly. Slow, deep skills take longer per revolution. The phase position tells you where in the learning cycle the skill currently sits.',
      complexPlanePosition: { theta: Math.PI / 2, r: 1.0 },
      codeParallel: 'Learning rate: omega = d(theta)/dt — how fast a skill moves through its refinement cycle',
    },
    phases: phaseMap([
      {
        type: 'wonder',
        title: 'Everything Waves',
        narrativeIntro: 'Close your eyes and listen. The world hums, pulses, rises and falls. Nothing in nature stays still. Everything oscillates.',
        content: {
          text: 'The ocean rises and falls. Your heart beats in rhythm. The seasons cycle. Day follows night follows day. Sound is a wave in air. Light is a wave in electromagnetic fields. Even the atoms in your body vibrate.\n\nAll of these things share a shape: the wave. A smooth curve that rises, peaks, descends, bottoms out, and rises again. It is the shape of things that repeat. The shape of things in motion.\n\nWhat if every wave — tides, heartbeats, music, light — was the same mathematical object wearing different costumes?',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'trig-wonder-time', description: 'Spend at least 30 seconds reading', type: 'time-spent', threshold: 30000 },
          { id: 'trig-wonder-continue', description: 'Choose to continue', type: 'manual' },
        ],
      },
      {
        type: 'see',
        title: 'The Circle Unrolls',
        narrativeIntro: 'Watch a point trace a circle, but this time we unroll the motion into a wave.',
        content: {
          text: 'A point moves around a circle at constant speed. But now, instead of just watching the circle, we let time flow to the right. The point\'s height, plotted against time, draws a wave. This is the sine wave — born from circular motion.\n\nWatch: the wave begins at zero, rises to a peak, returns to zero, drops to a trough, and returns to zero again. One full cycle corresponds to one full trip around the circle. The wave IS the circle, unrolled into time.',
        },
        interactiveElements: [
          {
            id: 'trig-see-unroll',
            type: 'toggle',
            config: {
              name: 'showUnroll',
              label: 'Show unrolling',
              type: 'toggle',
              default: true,
              description: 'Toggle between circle view and unrolled wave view',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'trig-see-watch', description: 'Watch the full unrolling animation', type: 'time-spent', threshold: 15000 },
        ],
      },
      {
        type: 'touch',
        title: 'Shape the Wave',
        narrativeIntro: 'Now you control the wave. Change its amplitude, frequency, and phase.',
        content: {
          text: 'You have three controls:\n\n- **Amplitude** — how tall the wave is. Turn it up and the peaks grow higher, the troughs deeper. Turn it down and the wave flattens.\n- **Frequency** — how fast it oscillates. Higher frequency means more waves packed into the same time. Lower frequency means long, lazy oscillations.\n- **Phase** — where the wave starts. Shift the phase and the entire wave slides left or right.\n\nEvery wave in nature can be described by these three properties. Every wave is the same shape, just stretched, compressed, or shifted.',
        },
        interactiveElements: [
          {
            id: 'trig-touch-amplitude',
            type: 'slider',
            config: {
              name: 'amplitude',
              label: 'Amplitude',
              type: 'slider',
              min: 0,
              max: 3,
              step: 0.1,
              default: 1,
              description: 'Control the height of the wave',
            },
            affectsVisualization: true,
          },
          {
            id: 'trig-touch-frequency',
            type: 'slider',
            config: {
              name: 'frequency',
              label: 'Frequency',
              type: 'slider',
              min: 0.1,
              max: 10,
              step: 0.1,
              default: 1,
              unit: 'Hz',
              description: 'Control how fast the wave oscillates',
            },
            affectsVisualization: true,
          },
          {
            id: 'trig-touch-phase',
            type: 'slider',
            config: {
              name: 'phase',
              label: 'Phase shift',
              type: 'slider',
              min: 0,
              max: 6.283,
              step: 0.01,
              default: 0,
              unit: 'radians',
              description: 'Shift the wave left or right',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'trig-touch-interact', description: 'Adjust all three wave parameters', type: 'interaction-count', threshold: 5 },
        ],
      },
      {
        type: 'understand',
        title: 'Naming the Wave',
        narrativeIntro: 'The wave you shaped has a precise formula. It is time to see it.',
        content: {
          text: 'The sine function takes an angle and returns a height. When the angle increases steadily over time, the height traces a wave.\n\nAmplitude A scales the wave vertically. Angular frequency omega controls how fast the angle increases. Phase phi shifts the starting position. Together they describe any sinusoidal wave in nature:\n\nEvery sound you hear, every electromagnetic signal your phone receives, every oscillation in a bridge — all described by this single equation, or sums of it.',
          mathNotation: 'y(t) = A \\sin(\\omega t + \\phi)',
          codeExamples: [
            {
              language: 'typescript',
              code: '// A pure sine wave\nfunction sineWave(t: number, amplitude: number, frequency: number, phase: number): number {\n  const omega = 2 * Math.PI * frequency;\n  return amplitude * Math.sin(omega * t + phase);\n}\n\n// Sample a wave at 44100 Hz (CD quality audio)\nconst sampleRate = 44100;\nconst samples = Array.from({ length: sampleRate }, (_, i) => \n  sineWave(i / sampleRate, 1.0, 440, 0) // A440 concert pitch\n);',
              description: 'Sine wave generation at audio sample rates',
            },
          ],
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'trig-understand-time', description: 'Spend at least 60 seconds with the explanation', type: 'time-spent', threshold: 60000 },
        ],
      },
      {
        type: 'connect',
        title: 'Waves Meet Information',
        narrativeIntro: 'Waves carry information. This is where trigonometry meets information theory.',
        content: {
          text: 'Fourier discovered that any wave — no matter how complex — can be decomposed into a sum of simple sine waves. A square wave is the sum of odd harmonics. A sawtooth is the sum of all harmonics. Your voice is a unique combination of frequencies.\n\nThis is the bridge to information theory: signals are waves, and waves are sums of sines. The capacity of a communication channel depends on which frequencies it can carry. Trigonometry IS the language of signals.',
          mathNotation: 'f(t) = \\sum_{n=0}^{\\infty} A_n \\sin(n\\omega t + \\phi_n)',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'trig-connect-insight', description: 'Record at least one connection insight', type: 'insight-recorded', threshold: 1 },
        ],
      },
      {
        type: 'create',
        title: 'Compose with Waves',
        narrativeIntro: 'Build sounds from sine waves. Every note is yours to shape.',
        content: {
          text: 'Combine sine waves to create sounds. Start with a single pure tone — a single frequency. Then add harmonics at integer multiples of the fundamental frequency. Control the amplitude of each harmonic to shape the timbre.\n\nYou are doing additive synthesis — the same technique used in early electronic instruments and still fundamental to digital audio. You are composing with the same building blocks that describe ocean tides and planetary orbits.',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Additive synthesis: combine sine waves\nfunction additiveSynth(t: number, harmonics: { freq: number; amp: number }[]): number {\n  return harmonics.reduce((sum, h) => sum + h.amp * Math.sin(2 * Math.PI * h.freq * t), 0);\n}',
              description: 'Additive synthesis combining multiple sine waves',
            },
          ],
        },
        interactiveElements: [
          {
            id: 'trig-create-synth',
            type: 'canvas-paint',
            config: {
              name: 'wave-composer',
              label: 'Wave composer',
              type: 'drag-point',
              default: 0,
              description: 'Canvas for composing sounds from sine wave harmonics',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'trig-create-sound', description: 'Create at least one composite sound', type: 'creation-made', threshold: 1 },
        ],
      },
    ]),
  });

  // ── 4. Vector Calculus ──────────────────────────────────

  foundations.set('vector-calculus', {
    id: 'vector-calculus',
    name: 'Vector Calculus',
    subtitle: 'Fields',
    order: 4,
    description: 'Everything changes everywhere at once. Vector calculus is the mathematics of fields — quantities that have both direction and magnitude at every point in space. Wind, gravity, magnetism, temperature — all are fields, and vector calculus describes how they flow, converge, and curl.',
    color: '#5b2c6f',
    icon: 'field',
    connections: [],
    wonderConnections: [
      {
        id: 'vc-wc-wind',
        phenomenon: 'Wind flowing around buildings and through valleys',
        description: 'Wind is invisible, but you feel it. At every point in the atmosphere, the air moves with a specific speed in a specific direction. Around a building, the wind splits, accelerates at the corners, and swirls into eddies behind. The wind is a vector field — direction and magnitude at every point.',
        foundationMapping: 'Wind velocity is a vector field: at each position (x, y, z), there is a vector indicating wind speed and direction. Vector calculus describes how the field changes across space.',
      },
      {
        id: 'vc-wc-starlings',
        phenomenon: 'Starling murmurations',
        description: 'Thousands of starlings wheel across an evening sky in perfect coordinated motion. No single bird leads. Each bird follows simple rules — match the velocity of your neighbors, avoid collisions, stay close to the group. From these local vector rules, global patterns emerge.',
        foundationMapping: 'Each bird\'s velocity is a vector. The flock is a vector field in motion. The gradient of bird density, the divergence of their velocities, and the curl of their flow describe the murmuration\'s structure.',
      },
      {
        id: 'vc-wc-fox',
        phenomenon: 'Foxes sensing the magnetic field',
        description: 'Red foxes hunt by aligning their pounce with the Earth\'s magnetic field. They are more successful when they jump toward magnetic north. The fox does not see the field, but it navigates it — sensing the invisible gradient and acting on it.',
        foundationMapping: 'The Earth\'s magnetic field is a vector field. The fox senses field direction and uses it to calibrate distance to prey. The fox is performing intuitive vector calculus — reading a gradient.',
      },
    ],
    skillCreatorAnalog: {
      mathConcept: 'Gradient fields and directional derivatives',
      skillCreatorFunction: 'Gradient descent — navigating the loss surface during calibration',
      explanation: 'In skill-creator, calibration adjusts parameters to minimize error. The error function is a surface in parameter space. Gradient descent computes the direction of steepest improvement at the current position and steps that way. This is vector calculus: the gradient is a vector field on the parameter surface.',
      complexPlanePosition: { theta: Math.PI, r: 0.85 },
      codeParallel: 'Calibration: step = -learningRate * gradient(loss)',
    },
    phases: phaseMap([
      {
        type: 'wonder',
        title: 'The Invisible Rivers',
        narrativeIntro: 'There are rivers you cannot see. They flow through every room, every landscape, every corner of the universe.',
        content: {
          text: 'Hold your hand out on a windy day. You feel the air pushing against your palm — a force with direction and strength. Move your hand a few inches and the force changes. Every point in the air around you has its own little arrow: which way the wind blows and how hard.\n\nNow imagine you could see all those arrows at once. Billions of tiny arrows filling the space around you, flowing, swirling, converging, and spreading apart. That is a vector field.\n\nWind is a vector field. Gravity is a vector field. The magnetic field of the Earth is a vector field. Ocean currents, electric fields, the flow of heat — all vector fields. The mathematics of these invisible rivers is vector calculus.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'vc-wonder-time', description: 'Spend at least 30 seconds reading', type: 'time-spent', threshold: 30000 },
          { id: 'vc-wonder-continue', description: 'Choose to continue', type: 'manual' },
        ],
      },
      {
        type: 'see',
        title: 'Arrows Everywhere',
        narrativeIntro: 'Now we make the invisible visible. Watch a vector field come to life.',
        content: {
          text: 'A grid of arrows fills the screen. Each arrow shows the direction and strength of a field at that point. Watch how the arrows change: near a source they point outward, near a sink they point inward, near a vortex they spin.\n\nDrop a particle into the field and watch it flow — carried by the arrows, tracing a path called a streamline. The particle goes where the field tells it to go.',
        },
        interactiveElements: [
          {
            id: 'vc-see-field',
            type: 'select',
            config: {
              name: 'fieldType',
              label: 'Field type',
              type: 'select',
              default: 'source',
              description: 'Choose which type of vector field to display',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'vc-see-observe', description: 'Observe at least two field types', type: 'interaction-count', threshold: 2 },
        ],
      },
      {
        type: 'touch',
        title: 'Shape the Field',
        narrativeIntro: 'Place sources, sinks, and vortices. Build your own vector field.',
        content: {
          text: 'Click to place sources (points where the field flows outward), sinks (points where the field flows inward), and vortices (points where the field spins). Watch how multiple sources interact — their fields combine at every point.\n\nDrop particles and watch them trace paths through your custom field. The particles never cross streamlines. They always follow the arrows.',
        },
        interactiveElements: [
          {
            id: 'vc-touch-source',
            type: 'button',
            config: {
              name: 'addSource',
              label: 'Add source',
              type: 'toggle',
              default: false,
              description: 'Place a field source at the clicked position',
            },
            affectsVisualization: true,
          },
          {
            id: 'vc-touch-particle',
            type: 'button',
            config: {
              name: 'addParticle',
              label: 'Drop particle',
              type: 'toggle',
              default: false,
              description: 'Drop a test particle into the field',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'vc-touch-interact', description: 'Place at least 3 field elements and drop particles', type: 'interaction-count', threshold: 5 },
        ],
      },
      {
        type: 'understand',
        title: 'Divergence, Curl, and Gradient',
        narrativeIntro: 'Three operations reveal the deep structure of any vector field.',
        content: {
          text: 'Vector calculus gives us three fundamental operations:\n\n- **Gradient** takes a scalar field (like temperature) and produces a vector field pointing toward the steepest increase.\n- **Divergence** measures how much a vector field spreads out from a point. Positive divergence means a source. Negative means a sink.\n- **Curl** measures how much a vector field rotates around a point. Non-zero curl means a vortex.\n\nThese three operations — gradient, divergence, and curl — are the vocabulary of fields. They describe wind, electromagnetism, fluid flow, and gravitational fields.',
          mathNotation: '\\nabla f = \\text{gradient} \\quad \\nabla \\cdot \\mathbf{F} = \\text{divergence} \\quad \\nabla \\times \\mathbf{F} = \\text{curl}',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Numerical gradient of a 2D scalar field\nfunction gradient(field: (x: number, y: number) => number, x: number, y: number, h = 0.001) {\n  const dfdx = (field(x + h, y) - field(x - h, y)) / (2 * h);\n  const dfdy = (field(x, y + h) - field(x, y - h)) / (2 * h);\n  return { x: dfdx, y: dfdy };\n}',
              description: 'Numerical gradient computation for a 2D scalar field',
            },
          ],
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'vc-understand-time', description: 'Spend at least 60 seconds with the explanation', type: 'time-spent', threshold: 60000 },
        ],
      },
      {
        type: 'connect',
        title: 'Fields Connect to Growth',
        narrativeIntro: 'Vector fields do not just describe static patterns — they describe how things change and grow.',
        content: {
          text: 'The gradient of a loss function tells you which direction to step to improve. This is how machine learning works — gradient descent navigates a high-dimensional field. The Pythagorean theorem measures distance in this field space.\n\nVector fields also connect to L-Systems: the growth direction of a plant branch follows a field determined by light, gravity, and the plant\'s own growth hormones. The branch tip navigates a biological vector field.',
          mathNotation: '\\theta_{n+1} = \\theta_n - \\eta \\nabla L(\\theta_n)',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'vc-connect-insight', description: 'Record at least one connection insight', type: 'insight-recorded', threshold: 1 },
        ],
      },
      {
        type: 'create',
        title: 'Paint with Fields',
        narrativeIntro: 'Use vector fields as your brush. Let flow create art.',
        content: {
          text: 'Build a vector field and paint with it. Place colored particles and let the field carry them, leaving trails. Adjust the field in real time — add vortices, change source strengths, and watch the painting evolve.\n\nThe field is your brush, the particles are your paint, and the canvas remembers every trail.',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Particle advection through a vector field\nfunction advect(px: number, py: number, field: (x: number, y: number) => { x: number; y: number }, dt: number) {\n  const v = field(px, py);\n  return { x: px + v.x * dt, y: py + v.y * dt };\n}',
              description: 'Simple Euler-step particle advection',
            },
          ],
        },
        interactiveElements: [
          {
            id: 'vc-create-canvas',
            type: 'canvas-paint',
            config: {
              name: 'field-painter',
              label: 'Field painter canvas',
              type: 'drag-point',
              default: 0,
              description: 'Canvas for painting with vector field particle trails',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'vc-create-art', description: 'Create at least one field painting', type: 'creation-made', threshold: 1 },
        ],
      },
    ]),
  });

  // ── 5. Set Theory ───────────────────────────────────────

  foundations.set('set-theory', {
    id: 'set-theory',
    name: 'Set Theory',
    subtitle: 'Being',
    order: 5,
    description: 'The mathematics of boundaries and identity. Set theory asks the most fundamental question in mathematics: what belongs, and what does not? Every definition, every category, every identity is an act of drawing a boundary — and set theory is the study of those boundaries.',
    color: '#1a5c2e',
    icon: 'venn',
    connections: [],
    wonderConnections: [
      {
        id: 'st-wc-identity',
        phenomenon: 'What makes you YOU',
        description: 'Every cell in your body replaces itself over years. Your memories shift. Your opinions change. Yet something persists — you are still you. What defines the boundary of your identity? What is inside the set of "you" and what is outside?',
        foundationMapping: 'Identity is a set membership question. The set of properties that define "you" has fuzzy boundaries, but the mathematical framework of sets gives us tools to reason about membership, intersection, and change over time.',
      },
      {
        id: 'st-wc-forest',
        phenomenon: 'Forest ecosystems and boundaries',
        description: 'Where does a forest end and a meadow begin? The boundary is not a line — it is a gradient. Trees thin out, grasses appear, and somewhere in the transition zone both exist. Ecologists call this an ecotone — a boundary region that belongs to both sets and neither.',
        foundationMapping: 'Ecosystem boundaries illustrate set intersection and complement. The ecotone is the intersection of the forest set and the meadow set. Pure forest is in the forest set but not the meadow set. Set operations describe ecological boundaries.',
      },
      {
        id: 'st-wc-rivers',
        phenomenon: 'Rivers as natural boundaries',
        description: 'Rivers divide landscapes into regions. On one side: this territory. On the other: that territory. But the river itself is a boundary — it belongs to both banks and neither. Animals cross it. Fish live in it. The boundary is not empty; it is its own domain.',
        foundationMapping: 'A river is a physical set boundary. The regions on each side are disjoint sets. The river itself is the boundary in the topological sense — the set of points that are limits of both sides.',
      },
    ],
    skillCreatorAnalog: {
      mathConcept: 'Set membership and predicates',
      skillCreatorFunction: 'Membership functions — file format filtering as set membership',
      explanation: 'In skill-creator, skills are organized by membership predicates. A skill belongs to the set of "auto-activating skills" if it matches certain criteria. File format filtering is literal set membership: this file is in the set of TypeScript files, that file is not.',
      complexPlanePosition: { theta: (5 * Math.PI) / 4, r: 0.9 },
      codeParallel: 'Skill membership: isAutoActivating(skill) = skill.triggers.some(t => matches(context, t))',
    },
    phases: phaseMap([
      {
        type: 'wonder',
        title: 'Drawing Lines in the Sand',
        narrativeIntro: 'Every time you name something, you draw a line. Inside the line: the thing. Outside: everything else.',
        content: {
          text: 'You have a bag of marbles. Some are red, some are blue, some are both (swirled). You separate them into groups: red marbles here, blue marbles there. But what about the swirled ones? They belong to both groups. Or neither. Or a new group of their own.\n\nThis is what mathematics grapples with at its deepest level. Not numbers. Not equations. Boundaries. What belongs to what. What is included and what is excluded. Every definition you have ever learned is secretly an act of drawing a boundary and declaring: this is inside, that is outside.\n\nThe mathematics of these boundaries is called set theory, and it is the foundation everything else is built on.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'st-wonder-time', description: 'Spend at least 30 seconds reading', type: 'time-spent', threshold: 30000 },
          { id: 'st-wonder-continue', description: 'Choose to continue', type: 'manual' },
        ],
      },
      {
        type: 'see',
        title: 'Circles That Overlap',
        narrativeIntro: 'Watch as sets appear as circles, and their relationships become visible.',
        content: {
          text: 'Two circles appear on the screen. Each circle represents a set — a collection of things. Where the circles overlap is the intersection: things that belong to both sets. The area in one circle but not the other is the difference. The total area of both circles together is the union.\n\nWatch elements appear as dots. They land inside one circle, or the other, or the overlap. The sets are not just abstract — they are visible, spatial, intuitive.',
        },
        interactiveElements: [
          {
            id: 'st-see-sets',
            type: 'toggle',
            config: {
              name: 'showLabels',
              label: 'Show set labels',
              type: 'toggle',
              default: true,
              description: 'Toggle labels showing union, intersection, and difference',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'st-see-observe', description: 'Observe elements being sorted into sets', type: 'time-spent', threshold: 20000 },
        ],
      },
      {
        type: 'touch',
        title: 'Sort and Classify',
        narrativeIntro: 'Now you draw the boundaries. Drag elements into sets. Create new sets.',
        content: {
          text: 'A collection of objects appears — animals, shapes, colors, numbers. Create sets by drawing circles and naming them. Drag elements into the sets where they belong. Watch the Venn diagram update as you add elements.\n\nTry creating overlapping sets. Can a penguin be in both "birds" and "swimmers"? Can the number 6 be in both "even numbers" and "numbers less than 10"? The overlaps reveal hidden structure.',
        },
        interactiveElements: [
          {
            id: 'st-touch-drag',
            type: 'drag-point',
            config: {
              name: 'element',
              label: 'Drag elements',
              type: 'drag-point',
              default: 0,
              description: 'Drag elements into sets to classify them',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'st-touch-interact', description: 'Classify at least 5 elements into sets', type: 'interaction-count', threshold: 5 },
        ],
      },
      {
        type: 'understand',
        title: 'The Algebra of Sets',
        narrativeIntro: 'Sets have their own algebra — operations that combine and transform them with perfect precision.',
        content: {
          text: 'Union combines two sets into one containing everything from both. Intersection keeps only what both sets share. Complement gives you everything NOT in a set. Difference gives you what is in one set but not another.\n\nThese operations follow laws that mirror logic: the union of A and B equals the union of B and A (commutativity). The complement of a union equals the intersection of the complements (De Morgan\'s law). Set theory is logic made visible.',
          mathNotation: 'A \\cup B = B \\cup A \\qquad \\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Set operations in TypeScript\nfunction union<T>(a: Set<T>, b: Set<T>): Set<T> {\n  return new Set([...a, ...b]);\n}\nfunction intersection<T>(a: Set<T>, b: Set<T>): Set<T> {\n  return new Set([...a].filter(x => b.has(x)));\n}\nfunction difference<T>(a: Set<T>, b: Set<T>): Set<T> {\n  return new Set([...a].filter(x => !b.has(x)));\n}',
              description: 'Fundamental set operations implemented in TypeScript',
            },
          ],
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'st-understand-time', description: 'Spend at least 60 seconds with the explanation', type: 'time-spent', threshold: 60000 },
        ],
      },
      {
        type: 'connect',
        title: 'Sets Are the Foundation',
        narrativeIntro: 'Everything in mathematics is built on sets. Every foundation you have visited rests on this one.',
        content: {
          text: 'Numbers are sets. Functions are sets of ordered pairs. The unit circle is a set of points. Probability is measure on sets. Category theory generalizes sets. Information theory measures entropy on probability sets.\n\nSet theory sits beneath everything. It is the mathematics of "what IS this thing?" — and that question is the beginning of all understanding.',
          mathNotation: '\\mathbb{R} = \\{x : x \\text{ is a real number}\\} \\quad f: A \\to B \\quad \\{(a, f(a)) : a \\in A\\}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'st-connect-insight', description: 'Record at least one connection insight', type: 'insight-recorded', threshold: 1 },
        ],
      },
      {
        type: 'create',
        title: 'Define Your World',
        narrativeIntro: 'Use sets to define, classify, and organize. Build a taxonomy of your own.',
        content: {
          text: 'Create a visual taxonomy of something you care about. Music genres, animal species, programming languages, foods — anything. Define sets with clear membership rules. Find the intersections. Discover what resists classification.\n\nThe act of building a taxonomy is the act of doing set theory. You are drawing boundaries, finding overlaps, and mapping the structure of a domain.',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Build a taxonomy with sets\ntype Taxonomy<T> = Map<string, Set<T>>;\n\nfunction findOverlaps<T>(tax: Taxonomy<T>): Map<string, Set<T>> {\n  const overlaps = new Map<string, Set<T>>();\n  const names = [...tax.keys()];\n  for (let i = 0; i < names.length; i++) {\n    for (let j = i + 1; j < names.length; j++) {\n      const key = `${names[i]} ∩ ${names[j]}`;\n      overlaps.set(key, intersection(tax.get(names[i])!, tax.get(names[j])!));\n    }\n  }\n  return overlaps;\n}',
              description: 'Taxonomy builder that discovers set overlaps',
            },
          ],
        },
        interactiveElements: [
          {
            id: 'st-create-canvas',
            type: 'canvas-paint',
            config: {
              name: 'taxonomy-builder',
              label: 'Taxonomy builder canvas',
              type: 'drag-point',
              default: 0,
              description: 'Canvas for building visual set taxonomies',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'st-create-taxonomy', description: 'Create at least one taxonomy', type: 'creation-made', threshold: 1 },
        ],
      },
    ]),
  });

  // ── 6. Category Theory ──────────────────────────────────

  foundations.set('category-theory', {
    id: 'category-theory',
    name: 'Category Theory',
    subtitle: 'Arrows',
    order: 6,
    description: 'Maps between things are more fundamental than the things themselves. Category theory studies not objects but the transformations between them. It reveals that the same pattern of arrows — the same structure of relationships — appears in wildly different domains.',
    color: '#c0392b',
    icon: 'arrow',
    connections: [],
    wonderConnections: [
      {
        id: 'ct-wc-translation',
        phenomenon: 'Translation between languages',
        description: 'When you translate a sentence from English to French, you preserve the meaning while changing the form. The words are different, the grammar shifts, but the structure of the thought survives. A good translation is a structure-preserving map — a functor between languages.',
        foundationMapping: 'Translation is a functor: it maps objects (words) and morphisms (grammatical relationships) from one category (language) to another while preserving composition. Category theory makes "good translation" precise.',
      },
      {
        id: 'ct-wc-metamorphosis',
        phenomenon: 'Metamorphosis — caterpillar to butterfly',
        description: 'A caterpillar dissolves into soup inside its chrysalis and reorganizes into a butterfly. The form is utterly different. Yet something is preserved — the species, the DNA, the developmental program. Metamorphosis is a natural transformation: the same pattern expressed through a completely different structure.',
        foundationMapping: 'Metamorphosis is a natural transformation between functors. The developmental program (functor 1) maps genes to caterpillar structures. A different developmental program (functor 2) maps the same genes to butterfly structures. The natural transformation connects them.',
      },
      {
        id: 'ct-wc-notation',
        phenomenon: 'Musical notation across instruments',
        description: 'A C major chord written on sheet music can be played on a piano, guitar, violin, or synthesizer. Each instrument produces different timbres, but the harmonic structure is preserved. Musical notation is a functor from abstract harmony to concrete sound.',
        foundationMapping: 'Musical notation defines a category of harmonic relationships. Each instrument is a functor from this category to the category of physical sounds, preserving the structure of intervals and progressions.',
      },
    ],
    skillCreatorAnalog: {
      mathConcept: 'Categories, functors, and natural transformations',
      skillCreatorFunction: 'Rosetta Core — structure-preserving maps between domains',
      explanation: 'In skill-creator, the Rosetta Core maps concepts between different domains while preserving their relationships. A design pattern in software maps to a pattern in electronics maps to a pattern in mathematics. These are functors between categories. Rosetta Core IS category theory.',
      complexPlanePosition: { theta: (3 * Math.PI) / 2, r: 0.85 },
      codeParallel: 'Rosetta mapping: functor(concept_in_domain_A) => equivalent_concept_in_domain_B',
    },
    phases: phaseMap([
      {
        type: 'wonder',
        title: 'The Map Is More Than the Territory',
        narrativeIntro: 'What if the relationships between things were more important than the things themselves?',
        content: {
          text: 'You know what a number is. You know what a shape is. But have you ever noticed that the way numbers relate to each other — through addition, multiplication, ordering — has the same SHAPE as the way certain other things relate?\n\nThink about cooking recipes. A recipe transforms ingredients into a dish. Combine two recipes (appetizer + main course) and you get a meal. Recipes compose, just like functions compose. The recipes are not numbers, but they follow the same pattern.\n\nCategory theory is the mathematics of noticing when different things follow the same pattern. Not similar content, but identical structure. The arrows between things — the transformations, the maps, the processes — those are what matter.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'ct-wonder-time', description: 'Spend at least 30 seconds reading', type: 'time-spent', threshold: 30000 },
          { id: 'ct-wonder-continue', description: 'Choose to continue', type: 'manual' },
        ],
      },
      {
        type: 'see',
        title: 'Dots and Arrows',
        narrativeIntro: 'Watch as objects become dots and transformations become arrows. The arrows ARE the mathematics.',
        content: {
          text: 'On the screen: dots (objects) and arrows (morphisms) between them. Each arrow represents a transformation — a way to get from one object to another. If there is an arrow from A to B and an arrow from B to C, then there must be an arrow from A to C (the composition).\n\nWatch as different categories appear: sets and functions, numbers and operations, types and programs. They look different, but the arrow patterns are the same.',
        },
        interactiveElements: [
          {
            id: 'ct-see-category',
            type: 'select',
            config: {
              name: 'categoryExample',
              label: 'Category example',
              type: 'select',
              default: 'sets',
              description: 'Choose which category to visualize',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'ct-see-observe', description: 'View at least two different categories', type: 'interaction-count', threshold: 2 },
        ],
      },
      {
        type: 'touch',
        title: 'Draw the Arrows',
        narrativeIntro: 'Now you build a category. Place objects, draw arrows, and discover what composition requires.',
        content: {
          text: 'Place dots on the canvas. Draw arrows between them. The system will check your work: does every object have an identity arrow (to itself)? Do your arrows compose correctly? If A goes to B and B goes to C, is the A-to-C arrow present?\n\nTry to build a category that matches a familiar structure — days of the week with "next day" arrows, or rooms in a house with "door between" arrows.',
        },
        interactiveElements: [
          {
            id: 'ct-touch-place',
            type: 'drag-point',
            config: {
              name: 'object',
              label: 'Place object',
              type: 'drag-point',
              default: 0,
              description: 'Place objects (dots) and draw arrows between them',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'ct-touch-interact', description: 'Build a category with at least 3 objects and 3 arrows', type: 'interaction-count', threshold: 6 },
        ],
      },
      {
        type: 'understand',
        title: 'Functors — Maps Between Worlds',
        narrativeIntro: 'A functor is a translation between categories that preserves structure.',
        content: {
          text: 'A functor maps one category to another while preserving the arrow structure. If arrows compose in the source category, their images must compose in the target category. A functor translates without distorting.\n\nExamples: the forgetful functor takes a group and forgets the operation, leaving just the underlying set. The free functor takes a set and builds the simplest possible group from it. Functors are not just maps — they are structure-preserving maps.',
          mathNotation: 'F: \\mathcal{C} \\to \\mathcal{D} \\quad F(f \\circ g) = F(f) \\circ F(g) \\quad F(\\text{id}_A) = \\text{id}_{F(A)}',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Array is a functor: it maps types to types and functions to functions\nconst numbers = [1, 2, 3];\nconst toString = (n: number): string => n.toString();\n// Array.map IS the functor action on morphisms\nconst strings = numbers.map(toString); // [\"1\", \"2\", \"3\"]\n\n// Composition is preserved:\nconst double = (n: number) => n * 2;\nconst doubleString = (n: number) => toString(double(n));\nnumbers.map(double).map(toString); // same as:\nnumbers.map(doubleString);',
              description: 'Array.map as a functor — preserving function composition',
            },
          ],
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'ct-understand-time', description: 'Spend at least 60 seconds with the explanation', type: 'time-spent', threshold: 60000 },
        ],
      },
      {
        type: 'connect',
        title: 'The Same Pattern Everywhere',
        narrativeIntro: 'Category theory reveals that set theory, information theory, and programming are the same structure in different clothing.',
        content: {
          text: 'Set theory studies objects and membership. Category theory generalizes this: sets become objects, functions become morphisms. Every set-theoretic construction (product, coproduct, exponential) has a categorical generalization that works in ANY category.\n\nInformation theory channels are morphisms in a category of information types. Programming types and functions form a category. Category theory is the Rosetta Stone that translates between all of these.',
          mathNotation: '\\text{Set} \\xrightarrow{F} \\text{Type} \\xrightarrow{G} \\text{Info}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'ct-connect-insight', description: 'Record at least one connection insight', type: 'insight-recorded', threshold: 1 },
        ],
      },
      {
        type: 'create',
        title: 'Build a Rosetta Map',
        narrativeIntro: 'Create a functor — a structure-preserving map between two domains you know.',
        content: {
          text: 'Choose two domains you understand (music and color, cooking and chemistry, sports and strategy). Build a category for each: identify the objects and the arrows. Then build a functor between them — map the objects and arrows from one domain to the other, preserving composition.\n\nYou are building a Rosetta Stone between two worlds.',
          codeExamples: [
            {
              language: 'typescript',
              code: '// A simple functor between two categories\ninterface Category<Obj, Morph> {\n  objects: Obj[];\n  morphisms: { from: Obj; to: Obj; arrow: Morph }[];\n}\n\ninterface Functor<A, MA, B, MB> {\n  mapObject: (a: A) => B;\n  mapMorphism: (m: MA) => MB;\n}',
              description: 'Category and functor interfaces for building Rosetta maps',
            },
          ],
        },
        interactiveElements: [
          {
            id: 'ct-create-canvas',
            type: 'canvas-paint',
            config: {
              name: 'rosetta-builder',
              label: 'Rosetta map builder',
              type: 'drag-point',
              default: 0,
              description: 'Canvas for building functor maps between two categories',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'ct-create-map', description: 'Create at least one functor map', type: 'creation-made', threshold: 1 },
        ],
      },
    ]),
  });

  // ── 7. Information Theory ───────────────────────────────

  foundations.set('information-theory', {
    id: 'information-theory',
    name: 'Information Theory',
    subtitle: 'The Channel',
    order: 7,
    description: 'Maps have physics — capacity, noise, encoding. Information theory reveals that every act of communication, storage, or computation is constrained by fundamental limits. Channels have maximum capacity. Noise corrupts. Encoding fights back.',
    color: '#34495e',
    icon: 'signal',
    connections: [],
    wonderConnections: [
      {
        id: 'it-wc-photos',
        phenomenon: 'Sharing pet photos on a phone',
        description: 'You take a photo of your cat and send it to a friend. The photo is millions of pixels, each a color. Your phone compresses it — JPEG removes details your eyes would not notice. The compressed file travels through the airwaves, arriving slightly different than it left, and your friend\'s phone reconstructs the image. Compression, channel capacity, error correction — all in one cat photo.',
        foundationMapping: 'Photo sharing is a complete information theory pipeline: source encoding (JPEG compression reduces redundancy), channel coding (error correction bits protect against noise), and transmission over a band-limited channel.',
      },
      {
        id: 'it-wc-birdsong',
        phenomenon: 'Birdsong encoding territory over a noisy channel',
        description: 'A bird sings to declare its territory. The song must carry through wind, traffic, other birds calling, and the absorption of foliage. The bird sings loudly enough and at frequencies that travel well through its environment. It repeats the song because repetition is error correction. The forest is a noisy channel, and the bird is an information theorist.',
        foundationMapping: 'Birdsong is territory information transmitted over an acoustic channel with noise (wind, other birds). The bird uses redundancy (repetition), frequency selection (channel-matched encoding), and amplitude (power) to ensure reliable communication.',
        audioDescription: 'A thrush singing the same complex phrase three times, each repetition a form of error correction.',
      },
      {
        id: 'it-wc-dna',
        phenomenon: 'DNA as an ancestral message',
        description: 'Your DNA is a message written four billion years ago and copied, with errors and corrections, through every generation since. It encodes the instructions to build you, using an alphabet of four letters in triplet codons. The cell has error correction: proofreading enzymes fix copy mistakes. DNA is information theory written in molecules.',
        foundationMapping: 'DNA is source-coded (triplet codons map to amino acids), transmitted through a noisy channel (replication with mutation), and error-corrected (DNA repair enzymes). The genetic code itself is redundant: 64 codons map to 20 amino acids, providing noise tolerance.',
      },
    ],
    skillCreatorAnalog: {
      mathConcept: 'Channel capacity, entropy, and error correction',
      skillCreatorFunction: 'Token budget management — channel capacity, compression, and error correction',
      explanation: 'In skill-creator, the Claude API has a token limit — a channel capacity. Prompts must be compressed to fit. Context windows are band-limited channels. Error correction (DSP hooks, checkpoint assertions) fights hallucination noise. The entire skill-creator system is an information-theoretic pipeline.',
      complexPlanePosition: { theta: (7 * Math.PI) / 4, r: 0.9 },
      codeParallel: 'Token budget: H(prompt) <= C(context_window) — the message entropy must fit the channel',
    },
    phases: phaseMap([
      {
        type: 'wonder',
        title: 'What IS Information?',
        narrativeIntro: 'You know what information feels like. You get a text message and now you know something you did not know before. But what IS that? What changed?',
        content: {
          text: 'Your friend says "I will be there at 3." Before the message, you did not know when they would arrive. After the message, you do. Something crossed the gap between their mind and yours. That something is information.\n\nBut how much information was in that message? What if you already knew they always arrive at 3? Then the message tells you nothing new — zero information. What if they could arrive at any of a thousand possible times? Then "3 o\'clock" narrows a thousand possibilities to one — that is a lot of information.\n\nInformation is surprise. The less you expected the message, the more information it contains. This is not a metaphor. It is a precise mathematical quantity.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'it-wonder-time', description: 'Spend at least 30 seconds reading', type: 'time-spent', threshold: 30000 },
          { id: 'it-wonder-continue', description: 'Choose to continue', type: 'manual' },
        ],
      },
      {
        type: 'see',
        title: 'Surprise and Entropy',
        narrativeIntro: 'Watch information flow through a channel. See surprise accumulate into entropy.',
        content: {
          text: 'A source produces symbols — letters, numbers, colors. Some appear often, others rarely. Watch as each symbol appears: common symbols carry little surprise (low information), rare symbols carry lots (high information).\n\nThe average surprise across all symbols is called entropy. High entropy means the source is unpredictable — lots of information per symbol. Low entropy means the source is predictable — little information per symbol.',
        },
        interactiveElements: [
          {
            id: 'it-see-source',
            type: 'select',
            config: {
              name: 'sourceType',
              label: 'Information source',
              type: 'select',
              default: 'uniform',
              description: 'Choose the probability distribution of the source',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'it-see-observe', description: 'Observe at least two different source distributions', type: 'interaction-count', threshold: 2 },
        ],
      },
      {
        type: 'touch',
        title: 'Encode and Transmit',
        narrativeIntro: 'Now you are the encoder. Compress a message and send it through a noisy channel.',
        content: {
          text: 'You have a message to send. The channel has limited capacity and introduces random errors (noise). Your job: encode the message so it fits the channel AND survives the noise.\n\nTry sending without compression — the message may not fit. Try sending without error correction — the noise corrupts it. Find the balance: compress to fit, add redundancy to survive.',
        },
        interactiveElements: [
          {
            id: 'it-touch-noise',
            type: 'slider',
            config: {
              name: 'noiseLevel',
              label: 'Channel noise',
              type: 'slider',
              min: 0,
              max: 1,
              step: 0.05,
              default: 0.1,
              description: 'Control the noise level of the channel',
            },
            affectsVisualization: true,
          },
          {
            id: 'it-touch-redundancy',
            type: 'slider',
            config: {
              name: 'redundancy',
              label: 'Error correction redundancy',
              type: 'slider',
              min: 0,
              max: 1,
              step: 0.05,
              default: 0.2,
              description: 'How much redundancy to add for error correction',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'it-touch-interact', description: 'Successfully transmit a message through the noisy channel', type: 'interaction-count', threshold: 3 },
        ],
      },
      {
        type: 'understand',
        title: 'Shannon\'s Fundamental Theorem',
        narrativeIntro: 'Claude Shannon proved that every channel has a maximum rate at which information can be reliably transmitted. This limit is absolute.',
        content: {
          text: 'Entropy H(X) measures the average information content of a source. Channel capacity C measures the maximum rate at which information can be transmitted reliably. Shannon\'s noisy channel coding theorem says: if H(X) is less than or equal to C, there exists an encoding that achieves reliable transmission. If H(X) exceeds C, errors are unavoidable.\n\nThis is not a practical limitation — it is a law of mathematics. No amount of cleverness can send more information than the channel capacity.',
          mathNotation: 'H(X) = -\\sum_{x} p(x) \\log_2 p(x) \\qquad C = \\max_{p(x)} I(X; Y)',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Compute entropy of a probability distribution\nfunction entropy(probabilities: number[]): number {\n  return -probabilities\n    .filter(p => p > 0)\n    .reduce((sum, p) => sum + p * Math.log2(p), 0);\n}\n\n// Fair coin: maximum entropy for 2 symbols\nentropy([0.5, 0.5]); // 1.0 bit\n\n// Biased coin: less surprise, less entropy\nentropy([0.9, 0.1]); // 0.469 bits',
              description: 'Shannon entropy computation',
            },
          ],
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'it-understand-time', description: 'Spend at least 60 seconds with the explanation', type: 'time-spent', threshold: 60000 },
        ],
      },
      {
        type: 'connect',
        title: 'Channels Everywhere',
        narrativeIntro: 'Every communication — biological, electronic, mathematical — is constrained by the same laws.',
        content: {
          text: 'Trigonometry connects here through Fourier analysis: the bandwidth of a channel is defined by which frequencies it can carry, and bandwidth determines channel capacity. Set theory connects here because entropy is a measure on probability sets. Category theory connects because channels are morphisms in a category of information types.\n\nThe token window of a large language model is a channel. Your working memory is a channel. DNA replication is a channel. The laws of information theory govern them all.',
          mathNotation: 'C = B \\log_2\\left(1 + \\frac{S}{N}\\right)',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'it-connect-insight', description: 'Record at least one connection insight', type: 'insight-recorded', threshold: 1 },
        ],
      },
      {
        type: 'create',
        title: 'Build a Channel',
        narrativeIntro: 'Design and test your own communication channel. Encode. Transmit. Decode.',
        content: {
          text: 'Build a complete communication pipeline: source encoding (compress the message), channel coding (add error correction), transmission (through a noisy channel you configure), and decoding (reconstruct the original).\n\nExperiment with different noise levels and encoding strategies. Can you approach the Shannon limit? How close can you get before errors become unavoidable?',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Simple repetition code for error correction\nfunction encode(bit: 0 | 1, repetitions: number): number[] {\n  return Array(repetitions).fill(bit);\n}\n\nfunction decode(bits: number[]): 0 | 1 {\n  const sum = bits.reduce((a, b) => a + b, 0);\n  return sum > bits.length / 2 ? 1 : 0; // majority vote\n}',
              description: 'Repetition code with majority-vote decoding',
            },
          ],
        },
        interactiveElements: [
          {
            id: 'it-create-channel',
            type: 'canvas-paint',
            config: {
              name: 'channel-builder',
              label: 'Channel builder',
              type: 'drag-point',
              default: 0,
              description: 'Canvas for designing and testing communication channels',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'it-create-channel', description: 'Build and test at least one channel', type: 'creation-made', threshold: 1 },
        ],
      },
    ]),
  });

  // ── 8. L-Systems ────────────────────────────────────────

  foundations.set('l-systems', {
    id: 'l-systems',
    name: 'L-Systems',
    subtitle: 'Growth',
    order: 8,
    description: 'Simple rules iterated produce complexity beyond their origin. L-Systems (Lindenmayer systems) are string-rewriting grammars that model growth. A short axiom and a few rewrite rules, iterated, produce the branching patterns of ferns, trees, snowflakes, and cities.',
    color: '#27ae60',
    icon: 'tree',
    connections: [],
    wonderConnections: [
      {
        id: 'ls-wc-fern',
        phenomenon: 'Fern fronds unfolding',
        description: 'Look at a fern. Each frond is made of smaller fronds, which are made of even smaller fronds. The pattern repeats at every scale — a fractal grown from a simple branching rule. The fern does not contain a blueprint for every leaf. It contains a rule: branch, then branch again.',
        foundationMapping: 'A fern frond is an L-System. The axiom is the stem. The production rule says: replace each segment with a branching segment. After a few iterations, the simple rule produces the complex fractal structure of the fern.',
      },
      {
        id: 'ls-wc-frost',
        phenomenon: 'Frost patterns on a window',
        description: 'On a cold morning, frost crystals grow on windowpanes in branching, feathery patterns. No two frost patterns are identical, yet they all share the same branching character. The crystal grows by accreting water molecules according to local rules — temperature, humidity, surface tension.',
        foundationMapping: 'Frost crystal growth follows an L-System-like process: local rules applied iteratively produce global branching structure. The rules are simple (accrete at the tip, branch at critical angles), but the result is complex and beautiful.',
      },
      {
        id: 'ls-wc-cities',
        phenomenon: 'Cities growing over centuries',
        description: 'A city begins as a crossroads. A market appears. Houses cluster around the market. Roads extend. New neighborhoods grow along the roads. The city was not designed — it grew, following simple rules: people build near roads, roads extend toward people. After centuries, the result is a complex organism.',
        foundationMapping: 'Urban growth follows L-System principles: simple local rules (build near infrastructure, extend infrastructure toward buildings) iterated over time produce the fractal street patterns of historical cities.',
      },
    ],
    skillCreatorAnalog: {
      mathConcept: 'Formal grammars and iterated rewriting',
      skillCreatorFunction: 'Promotion pipeline — observe, detect, suggest, apply, learn, compose',
      explanation: 'In skill-creator, a skill starts as a simple observation (axiom) and grows through iterative refinement: observe, detect patterns, suggest improvements, apply changes, learn from results, compose with other skills. Each iteration makes the skill more complex and capable — an L-System growing from a seed.',
      complexPlanePosition: { theta: (3 * Math.PI) / 4, r: 1.0 },
      codeParallel: 'Skill growth: axiom="observe" → rules={observe→detect+suggest, suggest→apply+learn} → iterate',
    },
    phases: phaseMap([
      {
        type: 'wonder',
        title: 'From Seeds to Forests',
        narrativeIntro: 'A seed is small enough to hold between two fingers. A forest stretches to the horizon. How does one become the other?',
        content: {
          text: 'An acorn weighs about one gram. The oak tree it becomes can weigh ten thousand kilograms. Where does the complexity come from? Not from the acorn — it is too small to contain the blueprint for every leaf, every branch, every root hair.\n\nThe answer is iteration. The acorn contains a small set of rules: grow toward light, branch when you reach a certain thickness, split when you sense space. These rules, applied over and over, produce the tree. The complexity is not in the rules. It is in the repetition.\n\nThis is the deepest idea in this observatory: simple rules, applied repeatedly, produce structures far more complex than the rules themselves. Growth is the mathematics of becoming.',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'ls-wonder-time', description: 'Spend at least 30 seconds reading', type: 'time-spent', threshold: 30000 },
          { id: 'ls-wonder-continue', description: 'Choose to continue', type: 'manual' },
        ],
      },
      {
        type: 'see',
        title: 'Watch It Grow',
        narrativeIntro: 'A single line. One rule. Watch what happens after five iterations.',
        content: {
          text: 'Start with a single segment — the axiom. The rule says: replace every segment with a branching pair. Press the iterate button and watch: one segment becomes two, two become four, and within a few iterations a recognizable tree appears.\n\nThe tree was not drawn. It was grown. The only input was one segment and one rule. Everything else emerged.',
        },
        interactiveElements: [
          {
            id: 'ls-see-iterate',
            type: 'button',
            config: {
              name: 'iterate',
              label: 'Iterate',
              type: 'toggle',
              default: false,
              description: 'Apply one iteration of the L-System rules',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'ls-see-watch', description: 'Watch at least 4 iterations', type: 'interaction-count', threshold: 4 },
        ],
      },
      {
        type: 'touch',
        title: 'Write the Rules',
        narrativeIntro: 'Now you write the growth rules. Change the angle. Change the branching. Grow your own plant.',
        content: {
          text: 'You control the L-System parameters:\n\n- **Axiom** — the starting string (the seed).\n- **Rules** — what each symbol gets replaced with.\n- **Angle** — how much each branch turns.\n- **Iterations** — how many times to apply the rules.\n\nTry the classic fern: axiom "X", rules X becomes "F+[[X]-X]-F[-FX]+X" and F becomes "FF", angle 25 degrees. Or invent your own rules and see what grows.',
        },
        interactiveElements: [
          {
            id: 'ls-touch-angle',
            type: 'slider',
            config: {
              name: 'angle',
              label: 'Branch angle',
              type: 'slider',
              min: 5,
              max: 90,
              step: 1,
              default: 25,
              unit: 'degrees',
              description: 'Set the branching angle',
            },
            affectsVisualization: true,
          },
          {
            id: 'ls-touch-iterations',
            type: 'slider',
            config: {
              name: 'iterations',
              label: 'Iterations',
              type: 'slider',
              min: 1,
              max: 8,
              step: 1,
              default: 4,
              description: 'Number of iterations to apply',
            },
            affectsVisualization: true,
          },
          {
            id: 'ls-touch-rules',
            type: 'text-input',
            config: {
              name: 'rules',
              label: 'Rewrite rules',
              type: 'select',
              default: 'F→FF, X→F+[[X]-X]-F[-FX]+X',
              description: 'Define the rewrite rules for the L-System',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'ls-touch-interact', description: 'Experiment with at least 3 different parameter combinations', type: 'interaction-count', threshold: 5 },
        ],
      },
      {
        type: 'understand',
        title: 'Formal Grammars',
        narrativeIntro: 'L-Systems are formal grammars — the same mathematics that describes programming languages and natural language.',
        content: {
          text: 'An L-System is defined by an alphabet (the symbols), an axiom (the starting string), and production rules (how each symbol gets rewritten). Unlike sequential grammars (used in programming), L-Systems apply all rules simultaneously — every symbol is rewritten in parallel at each step.\n\nThis parallel rewriting models biology: every cell in a growing organism divides and differentiates simultaneously, not one at a time.',
          mathNotation: 'G = (V, \\omega, P) \\quad V = \\text{alphabet} \\quad \\omega = \\text{axiom} \\quad P: V \\to V^*',
          codeExamples: [
            {
              language: 'typescript',
              code: '// L-System engine\nfunction iterate(axiom: string, rules: Record<string, string>, n: number): string {\n  let current = axiom;\n  for (let i = 0; i < n; i++) {\n    current = [...current].map(c => rules[c] ?? c).join(\'\');\n  }\n  return current;\n}\n\n// Koch snowflake\niterate(\'F\', { F: \'F+F--F+F\' }, 3);\n// \"F+F--F+F+F+F--F+F--F+F--F+F+F+F--F+F...\"',
              description: 'L-System string rewriting engine',
            },
          ],
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'ls-understand-time', description: 'Spend at least 60 seconds with the explanation', type: 'time-spent', threshold: 60000 },
        ],
      },
      {
        type: 'connect',
        title: 'Growth Loops Back',
        narrativeIntro: 'L-Systems connect back to the unit circle — the journey becomes a loop.',
        content: {
          text: 'L-Systems use angles to determine branching direction — those angles live on the unit circle. The growth patterns of plants follow vector fields of light and gravity. Birdsong has recursive grammar structure. DNA is a rewriting system. Growth connects everything.\n\nAnd here is the deepest connection: the L-System for learning itself. You started at the unit circle, grew through 8 foundations, and now the growth patterns of L-Systems point you back to the beginning. The path is a circle. You are ready to begin again, seeing everything differently.',
          mathNotation: '\\text{L-Systems} \\xrightarrow{\\text{angle}} \\text{Unit Circle} \\xrightarrow{\\text{begin again}} \\text{L-Systems}',
        },
        interactiveElements: [],
        completionCriteria: [
          { id: 'ls-connect-insight', description: 'Record at least one connection insight', type: 'insight-recorded', threshold: 1 },
        ],
      },
      {
        type: 'create',
        title: 'Grow a Garden',
        narrativeIntro: 'Plant your own L-System garden. Write rules. Set angles. Watch a digital ecosystem emerge.',
        content: {
          text: 'Combine multiple L-Systems on one canvas. Grow different species side by side. Experiment with stochastic rules (random variation in rule application) to get natural-looking diversity. Add color rules that change with iteration depth — younger branches in bright green, older trunks in brown.\n\nYour garden is a composition of formal grammars. Every plant is a proof that simple rules, iterated, produce beauty.',
          codeExamples: [
            {
              language: 'typescript',
              code: '// Stochastic L-System with multiple rules per symbol\nfunction stochasticIterate(\n  axiom: string,\n  rules: Record<string, { replacement: string; probability: number }[]>,\n  n: number\n): string {\n  let current = axiom;\n  for (let i = 0; i < n; i++) {\n    current = [...current].map(c => {\n      const options = rules[c];\n      if (!options) return c;\n      const r = Math.random();\n      let cumulative = 0;\n      for (const opt of options) {\n        cumulative += opt.probability;\n        if (r < cumulative) return opt.replacement;\n      }\n      return c;\n    }).join(\'\');\n  }\n  return current;\n}',
              description: 'Stochastic L-System for natural-looking variation',
            },
          ],
        },
        interactiveElements: [
          {
            id: 'ls-create-canvas',
            type: 'canvas-paint',
            config: {
              name: 'lsystem-garden',
              label: 'L-System garden canvas',
              type: 'drag-point',
              default: 0,
              description: 'Canvas for growing and composing L-System plants',
            },
            affectsVisualization: true,
          },
        ],
        completionCriteria: [
          { id: 'ls-create-garden', description: 'Grow at least one L-System garden', type: 'creation-made', threshold: 1 },
        ],
      },
    ]),
  });

  // Freeze the registry — no mutations after initialization
  Object.freeze(foundations);
}

// ─── Initialize on module load ──────────────────────────────

initializeRegistry();

// ─── Public API ─────────────────────────────────────────────

export function getFoundation(id: FoundationId): Foundation {
  const foundation = foundations.get(id);
  if (!foundation) {
    throw new Error(`Foundation not found: ${id}`);
  }
  return foundation;
}

export function getAllFoundations(): Foundation[] {
  return FOUNDATION_ORDER.map(id => getFoundation(id));
}

export function getFoundationPhase(id: FoundationId, phase: PhaseType): FoundationPhase {
  const foundation = getFoundation(id);
  const foundationPhase = foundation.phases.get(phase);
  if (!foundationPhase) {
    throw new Error(`Phase "${phase}" not found for foundation "${id}"`);
  }
  return foundationPhase;
}

export function getWonderConnections(id: FoundationId): WonderConnection[] {
  return getFoundation(id).wonderConnections;
}

export function getSkillCreatorMapping(id: FoundationId): SkillCreatorMapping {
  return getFoundation(id).skillCreatorAnalog;
}

export function getNextFoundation(id: FoundationId): FoundationId | null {
  const index = FOUNDATION_ORDER.indexOf(id);
  if (index === -1) {
    throw new Error(`Unknown foundation: ${id}`);
  }
  return index < FOUNDATION_ORDER.length - 1 ? FOUNDATION_ORDER[index + 1]! : null;
}

export function getPreviousFoundation(id: FoundationId): FoundationId | null {
  const index = FOUNDATION_ORDER.indexOf(id);
  if (index === -1) {
    throw new Error(`Unknown foundation: ${id}`);
  }
  return index > 0 ? FOUNDATION_ORDER[index - 1]! : null;
}
