import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const businessEthics: RosettaConcept = {
  id: 'bus-business-ethics',
  name: 'Business Ethics',
  domain: 'business',
  description:
    'Business ethics examines what is right conduct in commercial contexts. ' +
    'Key frameworks: shareholder theory (maximize shareholder value), stakeholder theory (balance all affected parties), ' +
    'and social contract theory (businesses earn their license to operate from society). ' +
    'Ethical failures — fraud, environmental damage, labor exploitation — have both moral and reputational costs. ' +
    'Ethical organizations build long-term trust; short-term ethical shortcuts typically destroy more value than they create.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.2025 + 0.5625),
    angle: Math.atan2(0.75, 0.45),
  },
};
