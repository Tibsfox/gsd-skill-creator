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
    "Skill Scanner Evasion names the class of attacks that slip poisoned agent skills past static, text-first security scanners (arXiv 2606.07943 and 2606.18198, 2026). POISE is a position-aware injection that compresses a malicious trigger into a single benign-looking body instruction and blends it into nearby setup or prerequisite steps, reaching 89.3% attack success rate on Skill-Inject with codex+gpt-5.2 -- 28 points above a random-placement body baseline and 2.6 points above a YAML-header-only baseline, while keeping body placement's stealth. That stealth is the load-bearing margin: because legitimate skill bodies routinely require privileged tool operations, LLM scanners are hyper-sensitive and falsely flag 74.6% of CLEAN skills on average (across four judges and both benchmarks), so a poisoned variant simply hides inside that alarm noise -- only 5.6% of poisoned variants gain any new high-risk alert over their clean baseline, rendering static defenses ineffective. SkillCamo instead conceals instructions inside images bundled with a skill, rewriting documentation to reference them so malicious intent emerges only from joint text-plus-visual interpretation at execution time. The distinct contribution is reframing stealth as evasion of the scanner's own false-alarm noise and modality blind spots rather than mere obfuscation. Implication: skill vetting must become execution-grounded and multimodal -- SkillCamo's own ExecScan defense jointly analyzes documentation, code, images, and referenced resources to reconstruct behavior chains rather than scanning prose.",
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
    {
      type: "cross-reference",
      targetId: "agent-skill-resource-supply-chain",
      description: "Reciprocal attack-sibling link: both defeat static, text-first skill scanners and both drive the same remedy — reconstruct behavior from code, images, and referenced resources rather than scanning prose. Scanner-evasion exploits placement stealth and modality blind spots; supply-chain exploits the auxiliary script/resource plane.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-edit-trait-vector",
      description: "Direct attack-to-defense pairing: the trait vector is engineered to resist exactly the surface rephrasing and body-placement stealth (POISE) that lets a poisoned skill evade static scanners, because it scores the semantic embedding delta of the edit rather than pattern-matching its text.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
