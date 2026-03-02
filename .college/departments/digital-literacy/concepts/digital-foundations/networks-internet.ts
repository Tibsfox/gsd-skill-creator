import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const networksInternet: RosettaConcept = {
  id: 'diglit-networks-internet',
  name: 'Networks & Internet',
  domain: 'digital-literacy',
  description: 'The internet is a network of networks: billions of devices connected by physical cables, ' +
    'fiber optic lines, and wireless radio signals. ' +
    'IP addresses: unique identifiers for devices (like postal addresses). ' +
    'DNS (Domain Name System): translates "google.com" to IP addresses -- the phonebook of the internet. ' +
    'TCP/IP: the protocols that govern how data is divided into packets, addressed, routed, and reassembled. ' +
    'HTTP/HTTPS: protocols for web pages. HTTPS adds TLS encryption -- the padlock in your browser. ' +
    'Routers: devices that direct packets between networks. ' +
    'Packet switching: data is split into small packets that travel independently and are reassembled -- ' +
    'robust to network failures (ARPANET was designed to survive nuclear attack).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-hardware-components',
      description: 'Network interface cards (NICs) are hardware -- networking builds on hardware understanding',
    },
    {
      type: 'cross-reference',
      targetId: 'code-input-output',
      description: 'Network I/O is the same concept as local I/O -- TCP sockets are just a remote file descriptor',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
