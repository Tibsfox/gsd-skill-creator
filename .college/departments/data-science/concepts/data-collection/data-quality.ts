import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataQuality: RosettaConcept = {
  id: 'data-data-quality',
  name: 'Data Quality',
  domain: 'data-science',
  description: 'The four dimensions of data quality: Accuracy (does the value reflect reality?), ' +
    'Completeness (are all expected values present?), Consistency (do related values agree?), ' +
    'Timeliness (is the data current enough for the question?). ' +
    'GIGO: Garbage In, Garbage Out -- no algorithm transforms bad data into reliable conclusions. ' +
    'Data cleaning occupies 60-80% of a data scientist\'s time in practice. ' +
    'Common issues: missing values (NaN), outliers (data entry errors or genuine extremes), ' +
    'duplicates, encoding inconsistencies (NYC vs. New York City), type mismatches. ' +
    'Data documentation (data dictionaries, provenance records) is not optional -- ' +
    'you cannot assess quality without knowing how data was collected.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-data-sources',
      description: 'Data quality depends on the collection method and source -- provenance drives quality assessment',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-evaluating-claims',
      description: 'Evaluating nutritional research requires the same data quality assessment skills as evaluating any dataset',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};
