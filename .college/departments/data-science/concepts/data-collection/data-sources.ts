import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataSources: RosettaConcept = {
  id: 'data-data-sources',
  name: 'Data Sources & Methods',
  domain: 'data-science',
  description: 'Data enters analysis from observational studies (measuring what exists without intervening), ' +
    'experiments (manipulating a variable to see its effect), surveys (asking people directly), ' +
    'administrative records (government databases, hospital records), and sensors/IoT devices. ' +
    'Primary data: collected directly for your question. Secondary data: collected for another purpose, ' +
    'repurposed (government census data, Twitter API). ' +
    'Structured data fits in rows and columns (spreadsheets, SQL databases). ' +
    'Unstructured data does not (emails, images, audio). ' +
    'Semi-structured data has partial organization (JSON, XML). ' +
    'Data provenance -- knowing where data came from and how it was collected -- determines how much you can trust it.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-sampling-bias',
      description: 'Different data sources introduce different biases -- provenance determines which biases to watch for',
    },
    {
      type: 'cross-reference',
      targetId: 'code-input-output',
      description: 'In programming, data sources are input channels -- the data science concept and coding concept are the same abstraction',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
