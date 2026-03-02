import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cybersecurityBasics: RosettaConcept = {
  id: 'code-cybersecurity-basics',
  name: 'Cybersecurity Basics',
  domain: 'coding',
  description: 'Foundational security concepts every developer must know. ' +
    'The CIA triad: Confidentiality (only authorized access), Integrity (data not tampered), ' +
    'Availability (system accessible when needed). ' +
    'OWASP Top 10 most common vulnerabilities: SQL injection, broken authentication, ' +
    'sensitive data exposure, XSS, CSRF. ' +
    'Never trust user input: sanitize everything before using in database queries or HTML. ' +
    'HTTPS: TLS encrypts data in transit. ' +
    'Password storage: never store plaintext, use bcrypt/Argon2 (slow hash functions). ' +
    'Defense in depth: multiple security layers, so a single failure is not catastrophic. ' +
    'Security is not optional -- data breaches cost companies millions and harm users.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'diglit-password-security',
      description: 'User password security and developer password storage security are two sides of the same problem',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-privacy-management',
      description: 'Developers implement the privacy controls that users manage in their settings',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
