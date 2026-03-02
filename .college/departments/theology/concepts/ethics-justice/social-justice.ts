import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const socialJustice: RosettaConcept = {
  id: 'theo-social-justice',
  name: 'Social Justice',
  domain: 'theology',
  description:
    'Faith-based social justice traditions hold that religious obligations extend to structural ' +
    'conditions producing poverty, oppression, and inequality. Catholic social teaching (Leo XIII\'s ' +
    'Rerum Novarum, 1891) articulated workers\' rights, living wages, and subsidiarity. Liberation ' +
    'theology (Gutierrez, Boff) developed in Latin America arguing God\'s "preferential option for ' +
    'the poor" demands political engagement. Protestant Social Gospel (Rauschenbusch) applied ' +
    'Christian ethics to industrial capitalism\'s injustices. Islamic zakat (obligatory charitable ' +
    'giving) and Jewish tzedakah (righteous giving — obligation, not charity) institutionalize ' +
    'wealth redistribution. The prophetic tradition across religions speaks truth to power: Isaiah, ' +
    'Amos, Muhammad\'s reforms for orphans and the poor, Buddhist engaged social activism (Thich ' +
    'Nhat Hanh). Contemporary applications include environmental justice, anti-racism, gender ' +
    'equality, and refugee advocacy grounded in religious human dignity frameworks.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-religious-ethics',
      description: 'Social justice applies the ethical principles of religious traditions to structural inequalities',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
