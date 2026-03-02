import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const networksInternet: RosettaConcept = {
  id: 'tech-networks-internet',
  name: 'Networks & the Internet',
  domain: 'technology',
  description:
    'Computer networks connect devices to share data. The TCP/IP protocol stack governs internet communication: ' +
    'IP addresses identify devices, TCP ensures reliable delivery, HTTP transfers web content, DNS resolves names to addresses. ' +
    'The internet is a network of networks; the web (HTTP, HTML, URLs) is a service that runs on it. ' +
    'WiFi and cellular networks provide wireless access. ' +
    'Network literacy is increasingly essential for participating in and building digital society.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-binary-data',
      description: 'All network communication is ultimately the transmission of binary data through physical or wireless channels',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
