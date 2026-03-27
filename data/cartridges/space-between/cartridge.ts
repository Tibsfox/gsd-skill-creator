/**
 * The Space Between — first cartridge instance.
 *
 * Bundles the essay narrative, textbook chapter map,
 * and audio-mesh vocabulary chipset.
 */

import type { Cartridge } from '../../../src/bundles/cartridge/types.js';

export const spaceBetwenCartridge: Cartridge = {
  id: 'space-between',
  name: 'The Space Between',
  version: '1.0.0',
  author: 'Maple + Claude',
  description: 'Audio-mesh educational cartridge — maps audio engineering concepts to mesh architecture through the metaphor of the space between notes',
  trust: 'system',
  deepMap: {
    concepts: [
      // Part I: Seeing (math foundations)
      { id: 'natural-numbers', name: 'Natural Numbers', description: 'The counting numbers as foundation of all mathematics', chapter: 1, depth: 'glance', tags: ['math', 'foundation'] },
      { id: 'unit-circle', name: 'Unit Circle', description: 'Circle of radius 1 — the bridge between algebra and geometry', chapter: 2, depth: 'scan', tags: ['math', 'geometry', 'trig'] },
      { id: 'pythagorean-theorem', name: 'Pythagorean Theorem', description: 'a² + b² = c² — the relationship between sides of a right triangle', chapter: 2, depth: 'glance', tags: ['math', 'geometry'] },
      { id: 'complex-numbers', name: 'Complex Numbers', description: 'Numbers with real and imaginary parts — the language of rotation and oscillation', chapter: 3, depth: 'scan', tags: ['math', 'complex'] },
      // Part II: Hearing (wave physics)
      { id: 'wave-equation', name: 'Wave Equation', description: 'Mathematical description of how waves propagate through space and time', chapter: 4, depth: 'scan', tags: ['physics', 'waves'] },
      { id: 'harmonic-series', name: 'Harmonic Series', description: 'Integer multiples of a fundamental frequency — the physics of musical harmony', chapter: 5, depth: 'read', tags: ['physics', 'music', 'harmonics'] },
      { id: 'standing-waves', name: 'Standing Waves', description: 'Interference patterns that create fixed nodes and antinodes in enclosed spaces', chapter: 5, depth: 'scan', tags: ['physics', 'acoustics'] },
      { id: 'musical-notation', name: 'Musical Notation', description: 'Symbolic system for encoding pitch, rhythm, and dynamics', chapter: 6, depth: 'glance', tags: ['music', 'notation'] },
      // Part III: Moving (calculus)
      { id: 'derivative', name: 'Derivative', description: 'Rate of change — how fast a function is moving at any point', chapter: 7, depth: 'scan', tags: ['math', 'calculus'] },
      { id: 'integral', name: 'Integral', description: 'Accumulated area — the inverse of differentiation', chapter: 8, depth: 'scan', tags: ['math', 'calculus'] },
      { id: 'differential-equations', name: 'Differential Equations', description: 'Equations relating functions to their derivatives — the language of change', chapter: 9, depth: 'read', tags: ['math', 'calculus'] },
      { id: 'harmonic-oscillator', name: 'Harmonic Oscillator', description: 'System that oscillates sinusoidally — springs, pendulums, circuits, sound', chapter: 9, depth: 'read', tags: ['physics', 'oscillation'] },
      // Part IV: Expanding (linear algebra)
      { id: 'vector-spaces', name: 'Vector Spaces', description: 'Abstract spaces where addition and scaling follow consistent rules', chapter: 10, depth: 'scan', tags: ['math', 'linear-algebra'] },
      { id: 'linear-algebra', name: 'Linear Algebra', description: 'Mathematics of matrices, transformations, and multidimensional spaces', chapter: 11, depth: 'read', tags: ['math', 'linear-algebra'] },
      { id: 'euler-formula', name: 'Euler Formula', description: 'e^(iθ) = cos(θ) + i·sin(θ) — the most beautiful equation, unifying exp, trig, and complex', chapter: 12, depth: 'read', tags: ['math', 'complex', 'euler'] },
      { id: 'complex-analysis', name: 'Complex Analysis', description: 'Calculus extended to the complex plane — conformal mapping, residues', chapter: 12, depth: 'read', tags: ['math', 'complex'] },
      // Part V: Grounding (physics)
      { id: 'physics-constants', name: 'Physics Constants', description: 'Fundamental constants that define the behavior of the universe', chapter: 13, depth: 'glance', tags: ['physics', 'constants'] },
      { id: 'dimensional-analysis', name: 'Dimensional Analysis', description: 'Using units to verify equations and discover relationships', chapter: 14, depth: 'scan', tags: ['physics', 'analysis'] },
      // Part VII: Mapping (information theory)
      { id: 'signal-processing', name: 'Signal Processing', description: 'Mathematical techniques for analyzing, modifying, and synthesizing signals', chapter: 24, depth: 'read', tags: ['engineering', 'signals', 'dsp'] },
      { id: 'fourier-transform', name: 'Fourier Transform', description: 'Decomposing any signal into its constituent frequencies — the bridge between time and frequency', chapter: 24, depth: 'read', tags: ['math', 'signals', 'frequency'] },
      { id: 'information-theory', name: 'Information Theory', description: 'Mathematical framework for quantifying, storing, and communicating information', chapter: 25, depth: 'read', tags: ['math', 'information'] },
      // Part IX: Growing (complexity)
      { id: 'chaos-theory', name: 'Chaos Theory', description: 'Deterministic systems with sensitive dependence on initial conditions', chapter: 28, depth: 'scan', tags: ['math', 'complexity'] },
      { id: 'neural-networks', name: 'Neural Networks', description: 'Computing systems inspired by biological neural networks', chapter: 30, depth: 'scan', tags: ['ai', 'computing'] },
      // Audio-mesh bridge concepts
      { id: 'overtone-architecture', name: 'Overtone as Architecture', description: 'The overtone series as a structural principle — each harmonic adds richness without changing the fundamental', depth: 'read', tags: ['audio', 'architecture', 'bridge'] },
      { id: 'console-as-chipset', name: 'Console as Chipset', description: 'Mapping mixing console signal flow to the chipset architecture — channel strips, buses, inserts', depth: 'read', tags: ['audio', 'chipset', 'bridge'] },
      { id: 'crossfade-as-handoff', name: 'Crossfade as Context Handoff', description: 'DJ crossfade technique as metaphor for seamless context window transitions', depth: 'read', tags: ['audio', 'context', 'bridge'] },
      { id: 'midi-as-mcp', name: 'MIDI as MCP', description: 'MIDI protocol parallels to MCP — channels, messages, velocity, system exclusive', depth: 'read', tags: ['audio', 'protocol', 'bridge'] },
      { id: 'mixing-science', name: 'Mixing Science', description: 'The science of combining multiple signals — gain staging, EQ, compression, spatial placement', depth: 'read', tags: ['audio', 'mixing'] },
      { id: 'resonance-as-activation', name: 'Resonance as Skill Activation', description: 'Resonance frequency matching as metaphor for context-triggered skill activation', depth: 'scan', tags: ['audio', 'skills', 'bridge'] },
      { id: 'signal-flow', name: 'Signal Flow', description: 'The path a signal takes from input to output through processing stages', depth: 'scan', tags: ['audio', 'engineering'] },
      { id: 'chipset-mapping', name: 'Chipset to Console Mapping', description: 'How chipset subsystems (Copper, Blitter, Teams) map to mixing console components', depth: 'read', tags: ['audio', 'chipset', 'bridge'] },
      { id: 'mesh-routing', name: 'Mesh Routing as Signal Routing', description: 'Mesh node routing parallels audio signal routing — buses, sends, returns', depth: 'scan', tags: ['audio', 'mesh', 'bridge'] },
    ],
    connections: [
      { from: 'unit-circle', to: 'complex-numbers', relationship: 'builds-on', strength: 0.9 },
      { from: 'complex-numbers', to: 'euler-formula', relationship: 'builds-on', strength: 0.95 },
      { from: 'euler-formula', to: 'fourier-transform', relationship: 'enables', strength: 0.9 },
      { from: 'wave-equation', to: 'harmonic-series', relationship: 'builds-on', strength: 0.85 },
      { from: 'harmonic-series', to: 'overtone-architecture', relationship: 'applies-to', strength: 0.8 },
      { from: 'fourier-transform', to: 'signal-processing', relationship: 'enables', strength: 0.9 },
      { from: 'signal-processing', to: 'mixing-science', relationship: 'applies-to', strength: 0.7 },
      { from: 'harmonic-oscillator', to: 'standing-waves', relationship: 'produces', strength: 0.8 },
      { from: 'standing-waves', to: 'resonance-as-activation', relationship: 'metaphor', strength: 0.7 },
      { from: 'console-as-chipset', to: 'chipset-mapping', relationship: 'details', strength: 0.85 },
      { from: 'midi-as-mcp', to: 'signal-flow', relationship: 'applies-to', strength: 0.75 },
      { from: 'crossfade-as-handoff', to: 'mesh-routing', relationship: 'applies-to', strength: 0.7 },
      { from: 'derivative', to: 'differential-equations', relationship: 'builds-on', strength: 0.9 },
      { from: 'integral', to: 'differential-equations', relationship: 'builds-on', strength: 0.9 },
      { from: 'vector-spaces', to: 'linear-algebra', relationship: 'builds-on', strength: 0.85 },
    ],
    entryPoints: ['unit-circle', 'wave-equation', 'fourier-transform'],
    progressionPaths: [
      {
        id: 'audio-thread',
        name: 'The Audio Thread',
        description: 'Follow sound from physics to production to architecture',
        steps: ['wave-equation', 'harmonic-series', 'standing-waves', 'fourier-transform', 'signal-processing', 'mixing-science'],
      },
      {
        id: 'math-thread',
        name: 'The Math Thread',
        description: 'Follow the mathematical foundations from counting to complex analysis',
        steps: ['natural-numbers', 'unit-circle', 'complex-numbers', 'euler-formula', 'complex-analysis'],
      },
      {
        id: 'architecture-thread',
        name: 'The Architecture Thread',
        description: 'Follow the mapping from audio concepts to mesh architecture',
        steps: ['standing-waves', 'resonance-as-activation', 'signal-flow', 'chipset-mapping', 'mesh-routing'],
      },
    ],
  },
  story: {
    title: 'The Space Between',
    narrative: 'The most important part of any system is the space you leave for what comes next.',
    chapters: [
      { id: 'ch-1', title: 'The Note Between the Notes', summary: 'Prelude — the space between notes is where music lives', conceptRefs: ['harmonic-series', 'overtone-architecture'] },
      { id: 'ch-2', title: 'The Overtone Series as Architecture', summary: 'How harmonics create structure without changing the fundamental', conceptRefs: ['overtone-architecture', 'harmonic-series', 'standing-waves'] },
      { id: 'ch-3', title: 'The Console as Chipset', summary: 'Mapping mixing console signal flow to chipset architecture', conceptRefs: ['console-as-chipset', 'chipset-mapping', 'signal-flow'] },
      { id: 'ch-4', title: 'Mushroom Jazz and Crossfades', summary: 'The art of the seamless transition — context preservation in DJ culture', conceptRefs: ['crossfade-as-handoff'] },
      { id: 'ch-5', title: 'Carl Cox and Sustained Crescendo', summary: 'Building energy over hours — pacing and momentum in long-running systems', conceptRefs: ['mixing-science'] },
      { id: 'ch-6', title: 'Orbital and the Machine That Plays Itself', summary: 'Self-sustaining generative systems — when the architecture becomes the performer', conceptRefs: ['harmonic-oscillator', 'chaos-theory'] },
      { id: 'ch-7', title: 'The Lion King and the Spiral', summary: 'Film scoring as narrative architecture — synchronizing emotion with structure', conceptRefs: ['signal-processing'] },
      { id: 'ch-8', title: 'MIDI and MCP', summary: 'How a 1983 music protocol predicted the architecture of AI tool orchestration', conceptRefs: ['midi-as-mcp'] },
      { id: 'ch-9', title: 'From Vision to Mission', summary: 'Transforming creative vision into executable missions — the space between idea and implementation', conceptRefs: ['fourier-transform', 'euler-formula'] },
    ],
    throughLine: 'The most important part of any system is the space you leave for what comes next.',
  },
  chipset: {
    vocabulary: [
      'overtone', 'harmonic', 'resonance', 'frequency', 'amplitude', 'timbre',
      'oscillator', 'filter', 'envelope', 'modulation', 'patch', 'synthesis',
      'midi', 'channel', 'velocity', 'sysex', 'protocol', 'control',
      'channel-strip', 'bus', 'compressor', 'eq', 'gain', 'summing',
      'daw', 'multitrack', 'automation', 'overdub', 'vst', 'plugin',
      'crossfade', 'beatmatch', 'tempo', 'bpm', 'transition', 'blend',
      'signal-flow', 'routing', 'send', 'return', 'insert', 'master',
      'fourier', 'spectrum', 'waveform', 'phase', 'complex-plane', 'euler',
      'mesh', 'node', 'chipset', 'copper', 'blitter',
    ],
    orientation: { angle: Math.PI / 4, magnitude: 0.8 },
    voice: { tone: 'poetic-technical', style: 'narrative' },
    museAffinity: ['foxy', 'sam'],
  },
};
