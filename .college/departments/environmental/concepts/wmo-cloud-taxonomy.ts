/**
 * WMO Cloud Taxonomy concept -- 10 genera × 15 species × 9 varieties.
 *
 * Atmospheric observation: the Linnaean classification of clouds.
 * Luke Howard (1803) introduced cirrus / stratus / cumulus / nimbus;
 * the WMO International Cloud Atlas, with its 2017 digital edition,
 * is the authoritative Annex I to Technical Regulations WMO-No. 49.
 *
 * @module departments/environmental/concepts/wmo-cloud-taxonomy
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~11*2pi/19, radius ~0.55 (concrete observational taxonomy)
const theta = 11 * 2 * Math.PI / 19;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const wmoCloudTaxonomy: RosettaConcept = {
  id: 'environmental-wmo-cloud-taxonomy',
  name: 'WMO Cloud Taxonomy',
  domain: 'environmental',
  description: 'The World Meteorological Organization\'s International Cloud Atlas, ' +
    'with roots in Luke Howard\'s 1803 Essay on the Modification of Clouds ' +
    '(cirrus, stratus, cumulus, nimbus), organizes every observed cloud into ' +
    'exactly one of 10 genera (Ci, Cc, Cs, Ac, As, Ns, Sc, St, Cu, Cb), ' +
    'subdivided by 15 species based on shape and structure, with 9 varieties ' +
    'describing transparency or arrangement. The 2017 digital edition added ' +
    'one species (volutus), five supplementary features including asperitas ' +
    '(crowd-sourced by the Cloud Appreciation Society), one accessory cloud, ' +
    'and five special clouds. The Atlas constitutes Annex I to the Technical ' +
    'Regulations WMO-No. 49, binding on member states.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python atmospheric-observation stacks (metpy, siphon, cfgrib, xarray) ingest METAR cloud-layer reports and Himawari / GOES infrared imagery, then classify pixels into the 10 WMO genera via decision-tree classifiers trained on cloud-top temperature, brightness, and texture. ' +
        'pandas joins METAR manual observations with CloudSat radar profiles; notebooks reproduce the Atlas plates from reanalysis fields. ' +
        'See WMO International Cloud Atlas 2017.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ satellite-retrieval pipelines (NOAA Enterprise, EUMETSAT NWC-SAF C++ cores) classify cloud-top pixels into the 10 genera via tile-based decision trees that vectorise across (cloud-top temperature, optical depth, texture) feature vectors. ' +
        'constexpr genus-threshold tables feed a templated GenusClassifier functor; SIMD reductions yield per-scan genus fractions for the operational NWP ingest. ' +
        'See WMO International Cloud Atlas 2017.',
    }],
    ['natural', {
      panelId: 'natural',
      explanation: 'Every cloud you have ever seen falls into exactly one of ten genera. High clouds (above ~6 km): cirrus, cirrocumulus, cirrostratus -- ice crystal veils, mackerel sky, halo-casting sheets. Middle clouds (~2-6 km): altocumulus, altostratus, nimbostratus -- patchy layers and rain-bearing grey. Low clouds (below ~2 km): stratocumulus, stratus, cumulus, cumulonimbus -- marine decks, fog, fair-weather puffs, thunderstorms. ' +
        'See WMO International Cloud Atlas 2017.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'environmental-aerosol-indirect-erf',
      description: 'Cloud genera are the observational categories on which aerosol-indirect-ERF parameterizations are evaluated',
    },
    {
      type: 'dependency',
      targetId: 'chem-reaction-types',
      description: 'Cloud composition (ice vs liquid vs mixed) depends on the phase-change chemistry the genera reflect',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
