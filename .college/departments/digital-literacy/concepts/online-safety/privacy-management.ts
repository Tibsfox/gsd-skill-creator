import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const privacyManagement: RosettaConcept = {
  id: 'diglit-privacy-management',
  name: 'Privacy Management',
  domain: 'digital-literacy',
  description: 'Privacy is the right to control information about yourself. ' +
    'Platforms collect data through: direct input (forms), behavioral tracking (clicks, time on page), ' +
    'device fingerprinting (browser characteristics), location data, and third-party trackers. ' +
    'Privacy settings: audit them regularly -- defaults favor data collection over privacy. ' +
    'Cookies: small files websites store on your device. ' +
    'First-party cookies: from the site you are visiting. Third-party cookies: from advertisers. ' +
    'VPN (Virtual Private Network): hides traffic from your ISP -- does not make you anonymous. ' +
    'Incognito/private mode: does not save local history, but ISP and websites still see you. ' +
    'Data minimization principle: share only what is necessary for the service you want.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-privacy-consent',
      description: 'Users\' privacy rights correspond to researchers\' and developers\' ethical obligations',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-data-collection',
      description: 'Understanding what data is collected (algorithmic awareness) informs privacy management decisions',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
