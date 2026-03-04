/**
 * Culture domain — Ch 25-27: turntablism, EDM, sound systems.
 */

import type { AudioConcept } from '../types.js';

export const djCultureConcepts: AudioConcept[] = [
  {
    id: 'crossfade',
    name: 'Crossfade',
    domain: 'culture',
    chapter: 25,
    summary: 'Smooth transition between two audio sources by simultaneously fading one out and another in',
    meshMapping: 'context preservation = crossfade — seamless handoff between context windows',
    complexPlanePosition: { angle: 5.0, magnitude: 0.9 },
    relatedConcepts: ['beatmatch', 'bpm-gradient'],
    keywords: ['transition', 'blend', 'fade', 'seamless', 'handoff'],
  },
  {
    id: 'beatmatch',
    name: 'Beatmatching',
    domain: 'culture',
    chapter: 25,
    summary: 'Synchronizing the tempo and phase of two tracks for seamless mixing',
    meshMapping: 'agent synchronization — aligning agent cadence for coordinated parallel work',
    complexPlanePosition: { angle: 5.1, magnitude: 0.85 },
    relatedConcepts: ['crossfade', 'bpm-gradient'],
    keywords: ['sync', 'tempo', 'phase-align', 'pitch-fader', 'mix'],
  },
  {
    id: 'bpm-gradient',
    name: 'BPM Gradient',
    domain: 'culture',
    chapter: 26,
    summary: 'Gradual tempo changes across a DJ set creating energy arcs over hours',
    meshMapping: 'execution pacing — varying work intensity across a milestone for sustained quality',
    complexPlanePosition: { angle: 5.2, magnitude: 0.75 },
    relatedConcepts: ['beatmatch', 'crossfade'],
    keywords: ['tempo', 'energy', 'arc', 'progression', 'pacing'],
  },
  {
    id: 'sound-system',
    name: 'Sound System Design',
    domain: 'culture',
    chapter: 27,
    summary: 'PA system engineering for live events — speaker arrays, power amplifiers, signal distribution',
    meshMapping: 'deployment infrastructure — scaling compute resources for production workloads',
    complexPlanePosition: { angle: 5.3, magnitude: 0.7 },
    relatedConcepts: ['bpm-gradient'],
    keywords: ['pa', 'speakers', 'amplification', 'venue', 'live-sound'],
  },
  {
    id: 'turntablism',
    name: 'Turntablism',
    domain: 'culture',
    chapter: 25,
    summary: 'Using turntables as musical instruments through scratching, beat juggling, and transforming',
    relatedConcepts: ['beatmatch', 'crossfade'],
    keywords: ['scratch', 'dj', 'vinyl', 'transform', 'beat-juggle'],
  },
];
