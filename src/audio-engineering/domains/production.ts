/**
 * Production domain — Ch 13-15: DAWs, VST, film scoring.
 */

import type { AudioConcept } from '../types.js';

export const productionConcepts: AudioConcept[] = [
  {
    id: 'daw',
    name: 'Digital Audio Workstation',
    domain: 'production',
    chapter: 13,
    summary: 'Software environment for recording, editing, mixing, and producing audio',
    meshMapping: 'VTM = session arrangement — the VTM pipeline orchestrates work like a DAW session',
    complexPlanePosition: { angle: 4.0, magnitude: 0.9 },
    relatedConcepts: ['multitrack', 'automation', 'bounce'],
    keywords: ['daw', 'recording', 'editing', 'session', 'production'],
  },
  {
    id: 'multitrack',
    name: 'Multitrack Recording',
    domain: 'production',
    chapter: 13,
    summary: 'Recording multiple audio sources onto separate tracks for independent processing and mixing',
    meshMapping: 'parallel agent execution — multiple agents work on separate tracks simultaneously',
    complexPlanePosition: { angle: 4.1, magnitude: 0.85 },
    relatedConcepts: ['daw', 'overdub'],
    keywords: ['tracks', 'parallel', 'independent', 'recording', 'layering'],
  },
  {
    id: 'overdub',
    name: 'Overdub',
    domain: 'production',
    chapter: 13,
    summary: 'Recording new material on top of existing tracks to add layers incrementally',
    meshMapping: 'iterative refinement — adding layers of quality to existing output',
    complexPlanePosition: { angle: 4.2, magnitude: 0.75 },
    relatedConcepts: ['multitrack', 'daw'],
    keywords: ['layer', 'add', 'incremental', 'punch-in'],
  },
  {
    id: 'automation',
    name: 'Mix Automation',
    domain: 'production',
    chapter: 13,
    summary: 'Recorded parameter changes that play back automatically during mixdown',
    meshMapping: 'scheduled configuration — parameter changes that apply automatically at phase boundaries',
    complexPlanePosition: { angle: 4.3, magnitude: 0.7 },
    relatedConcepts: ['daw', 'channel-strip'],
    keywords: ['automation', 'fader-rides', 'parameter-changes', 'playback'],
  },
  {
    id: 'vst-plugin',
    name: 'VST Plugin Architecture',
    domain: 'production',
    chapter: 14,
    summary: 'Virtual Studio Technology — standardized plugin interface for audio processing and instruments',
    meshMapping: 'MCP tools = VST plugins — standardized interfaces for extending system capabilities',
    complexPlanePosition: { angle: 4.4, magnitude: 0.8 },
    relatedConcepts: ['daw'],
    keywords: ['vst', 'plugin', 'virtual-instrument', 'effect', 'interface'],
  },
  {
    id: 'film-scoring',
    name: 'Film Scoring',
    domain: 'production',
    chapter: 15,
    summary: 'Composing music synchronized to visual media with precise timing and emotional arc',
    meshMapping: 'narrative-driven development — code work synchronized to story arcs and educational goals',
    complexPlanePosition: { angle: 4.5, magnitude: 0.6 },
    relatedConcepts: ['daw', 'automation'],
    keywords: ['score', 'sync', 'timecode', 'cue', 'soundtrack'],
  },
];
