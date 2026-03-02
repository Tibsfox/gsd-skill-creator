import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const privacyConsent: RosettaConcept = {
  id: 'data-privacy-consent',
  name: 'Privacy & Informed Consent',
  domain: 'data-science',
  description: 'Informed consent requires telling participants: what data will be collected, ' +
    'how it will be used, who will see it, and how long it will be retained. ' +
    'Data minimization: collect only data necessary for the stated purpose. ' +
    'Anonymization: removing direct identifiers (name, SSN, email). ' +
    'Re-identification risk: supposedly anonymous data can be re-identified by combining fields ' +
    '(87% of Americans identifiable by zip code, date of birth, and sex alone). ' +
    'GDPR (EU): data protection by design, right to erasure, data portability. ' +
    'Research ethics: IRB review for human subjects research, informed consent documentation. ' +
    'The Netflix Prize dataset was "anonymized" but researchers re-identified users by ' +
    'comparing movie ratings to public IMDB profiles.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'diglit-privacy-management',
      description: 'Researchers\' ethical obligations to protect privacy mirror users\' rights to manage their own privacy',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-developmental-stages',
      description: 'Children require special privacy protections (COPPA) because developmental stages affect consent capacity',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
