import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cybersecurityBasics: RosettaConcept = {
  id: 'tech-cybersecurity-basics',
  name: 'Cybersecurity Basics',
  domain: 'technology',
  description:
    'Cybersecurity protects digital systems from unauthorized access, damage, and disruption. ' +
    'Key concepts: authentication (proving identity), authorization (controlling access), encryption (protecting data in transit and at rest), ' +
    'and the CIA triad (Confidentiality, Integrity, Availability). ' +
    'Common threats: phishing, malware, ransomware, social engineering, and SQL injection. ' +
    'Personal cybersecurity: strong unique passwords, multi-factor authentication, software updates, and recognizing phishing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-networks-internet',
      description: 'Most cybersecurity threats are delivered or enabled through internet and network connections',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
