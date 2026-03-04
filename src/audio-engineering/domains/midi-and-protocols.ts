/**
 * Protocols domain — Ch 7-8: MIDI, Amiga timing, MCP mapping.
 */

import type { AudioConcept } from '../types.js';

export const midiAndProtocolsConcepts: AudioConcept[] = [
  {
    id: 'midi',
    name: 'MIDI Protocol',
    domain: 'protocols',
    chapter: 7,
    summary: 'Musical Instrument Digital Interface — universal serial protocol for musical control data',
    meshMapping: 'MCP = MIDI for AI — both are universal control protocols enabling device interoperability',
    complexPlanePosition: { angle: 2.0, magnitude: 0.9 },
    relatedConcepts: ['opto-isolation', 'channel-voice', 'sysex', 'mcp-mapping'],
    keywords: ['midi', 'protocol', 'control', 'serial', 'interoperability', 'standard'],
  },
  {
    id: 'opto-isolation',
    name: 'Opto-Isolation',
    domain: 'protocols',
    chapter: 7,
    summary: 'Electrical isolation using light to prevent ground loops between connected devices',
    meshMapping: 'sandboxing — isolated execution prevents one agent from affecting another',
    complexPlanePosition: { angle: 2.1, magnitude: 0.7 },
    relatedConcepts: ['midi'],
    keywords: ['isolation', 'ground-loop', 'safety', 'optocoupler'],
  },
  {
    id: 'channel-voice',
    name: 'Channel Voice Messages',
    domain: 'protocols',
    chapter: 7,
    summary: 'MIDI messages carrying note and control data on specific channels (note-on, note-off, CC)',
    meshMapping: 'task messages — structured control data routed to specific agents on channels',
    complexPlanePosition: { angle: 2.2, magnitude: 0.75 },
    relatedConcepts: ['midi', 'sysex'],
    keywords: ['note-on', 'note-off', 'control-change', 'channel', 'velocity'],
  },
  {
    id: 'sysex',
    name: 'System Exclusive Messages',
    domain: 'protocols',
    chapter: 7,
    summary: 'Manufacturer-specific MIDI messages for device configuration and bulk data transfer',
    meshMapping: 'custom tool protocols — vendor-specific extensions within the standard framework',
    complexPlanePosition: { angle: 2.3, magnitude: 0.6 },
    relatedConcepts: ['midi', 'channel-voice'],
    keywords: ['sysex', 'manufacturer-id', 'bulk-dump', 'configuration'],
  },
  {
    id: 'mcp-mapping',
    name: 'MCP-MIDI Architectural Mapping',
    domain: 'protocols',
    chapter: 8,
    summary: 'Structural parallels between MIDI instrument control and MCP tool orchestration',
    meshMapping: 'direct mapping — MIDI channels = MCP servers, notes = tool calls, velocity = priority',
    complexPlanePosition: { angle: 2.4, magnitude: 0.85 },
    relatedConcepts: ['midi', 'channel-voice'],
    keywords: ['mcp', 'mapping', 'architecture', 'analogy', 'orchestration'],
  },
];
