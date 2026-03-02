import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const passwordSecurity: RosettaConcept = {
  id: 'diglit-password-security',
  name: 'Password Security & Authentication',
  domain: 'digital-literacy',
  description: 'Password strength is measured by entropy: the number of bits needed to guess it. ' +
    'A 12-character random password has ~72 bits of entropy -- adequate. ' +
    '"correct horse battery staple" (4 common words) has ~44 bits -- much higher than P@ssw0rd. ' +
    'Password managers (Bitwarden, 1Password): generate and store unique random passwords for each site. ' +
    'Multi-factor authentication (MFA): "something you know" + "something you have" -- ' +
    'even if password is stolen, attacker cannot log in without the second factor. ' +
    'Phishing: fake login pages stealing credentials -- check the URL carefully. ' +
    'Credential stuffing: leaked passwords from one breach tried on other sites -- ' +
    'unique passwords per site prevent this. ' +
    'Password hygiene: change after suspected compromise, not on arbitrary schedules.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'code-cybersecurity-basics',
      description: 'User password security and developer password storage are two sides of the same security concern',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-privacy-management',
      description: 'Strong authentication is the first line of defense for privacy -- protecting access protects data',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
