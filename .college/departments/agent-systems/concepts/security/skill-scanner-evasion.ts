/**
 * Skill Scanner Evasion -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/security/skill-scanner-evasion
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 116 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const skillScannerEvasion: RosettaConcept = {
  id: "agent-skill-scanner-evasion",
  name: "Skill Scanner Evasion",
  domain: 'agent-systems',
  description:
    "Skill Scanner Evasion names the class of attacks that slip poisoned agent skills past static, text-first security scanners (arXiv 2606.07943 and 2606.18198, 2026). POISE is a position-aware injection that compresses a malicious trigger into a single benign-looking body instruction and blends it into nearby setup or prerequisite steps; because scanners already false-flag most clean skills, the poisoned variant hides inside that alarm noise, executing while adding almost no new high-risk alerts. SkillCamo instead conceals instructions inside images bundled with a skill, rewriting documentation to reference them so intent emerges only from joint text-plus-visual interpretation at execution time. The distinct contribution is reframing stealth as evasion of the scanner's own noise and modality blind spots rather than mere obfuscation. Implication: skill vetting must become execution-grounded and multimodal, reconstructing behavior chains rather than scanning prose.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-self-mutating-poisoning",
      description: "Both are skill-poisoning attack classes, but scanner evasion hides a static payload inside scanner false-alarm noise or images, whereas self-mutating poisoning rewrites the payload after ingestion to defeat one-time static inspection.",
    },
    {
      type: "analogy",
      targetId: "agent-execution-grounded-selection",
      description: "ExecScan's remedy mirrors execution-grounded selection: judge a skill by simulating and reconstructing its behavior chain rather than trusting its static textual description, since prose and manifests are exactly what these attacks manipulate.",
    },
    {
      type: "cross-reference",
      targetId: "skill-injection-guardian",
      description: "The guardian's static neutralize-at-ingest pass is precisely the text-first defense POISE and SkillCamo are engineered to slip past, motivating an execution-grounded, multimodal complement to close its modality and noise blind spots.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
