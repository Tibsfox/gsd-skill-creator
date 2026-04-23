/**
 * WMO Cloud Taxonomy try-session -- field-guide to the 10 genera.
 *
 * Walk a learner from Luke Howard's 1803 four-root scheme (cirrus,
 * stratus, cumulus, nimbus), through the modern 10-genus WMO
 * International Cloud Atlas classification, to the 2017 additions
 * (volutus, asperitas) that reopened the Atlas after a 40-year gap.
 *
 * @module departments/environmental/try-sessions/wmo-cloud-taxonomy
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const wmoCloudTaxonomySession: TrySessionDefinition = {
  id: 'environmental-wmo-cloud-taxonomy-first-steps',
  title: 'WMO Cloud Taxonomy: The Linnaean Sky',
  description:
    'A guided first pass through the WMO International Cloud Atlas -- ' +
    'from Luke Howard\'s 1803 four-root scheme, through the 10 modern ' +
    'genera organised by altitude, to the 2017 additions (volutus, ' +
    'asperitas) that reopened the Atlas after a 40-year gap.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Go outside and look up. For the next 2 minutes, describe the clouds you see using ordinary words: fluffy, wispy, flat, grey, layered, piled-up, thin, scattered, uniform. Then read Luke Howard (1803, Essay on the Modification of Clouds): cirrus (curl), stratus (layer), cumulus (heap), nimbus (rain). Which of his four roots apply to what you just saw?',
      expectedOutcome:
        'You connect your field observation to Howard\'s four Latin roots. Even if the sky is mixed, you see that every cloud form can be described as some combination of wispy/curled (cirrus), layered (stratus), piled-up (cumulus), and/or rain-bearing (nimbus). Howard\'s insight was that clouds are transforming systems, not static objects -- hence "modifications".',
      hint: 'Howard presented his essay to the Askesian Society in London in December 1802-January 1803. Goethe translated it into German. It was the first successful attempt to give clouds a grammar.',
      conceptsExplored: ['environmental-wmo-cloud-taxonomy'],
    },
    {
      instruction:
        'Open the WMO International Cloud Atlas (https://cloudatlas.wmo.int/) and find the 10-genus list. Learn the altitude-grouped scheme: High (Ci, Cc, Cs, above ~6 km), Middle (Ac, As, above ~2 km), Low (Sc, St, Cu, Cb, below ~2 km), plus nimbostratus (Ns) which spans multiple levels. Write down the full Latin name for each genus.',
      expectedOutcome:
        'You list all 10 genera with Latin names: cirrus (Ci), cirrocumulus (Cc), cirrostratus (Cs), altocumulus (Ac), altostratus (As), nimbostratus (Ns), stratocumulus (Sc), stratus (St), cumulus (Cu), cumulonimbus (Cb). You understand that each observed cloud belongs to exactly one genus -- the scheme is exhaustive and mutually exclusive by design.',
      hint: 'Ns is the odd one out -- it can extend from low through middle altitudes. It is classified as a middle cloud by convention.',
      conceptsExplored: ['environmental-wmo-cloud-taxonomy'],
    },
    {
      instruction:
        'Now move to the species level. The Atlas defines 15 species that subdivide genera by shape and internal structure: fibratus, uncinus, spissatus, castellanus, floccus, stratiformis, nebulosus, lenticularis, fractus, humilis, mediocris, congestus, calvus, capillatus, volutus (added 2017). Match a species to a genus: which species can appear in cumulus?',
      expectedOutcome:
        'You identify cumulus humilis (fair-weather, flat-topped), cumulus mediocris (medium vertical development), cumulus congestus (tall, towering but no anvil), cumulus fractus (torn, ragged). You appreciate that species describes the shape of individual cloud cells; genus describes the cloud family.',
      hint: 'Not every species pairs with every genus. Fibratus applies only to cirrus and cirrostratus; humilis/mediocris/congestus apply only to cumulus.',
      conceptsExplored: ['environmental-wmo-cloud-taxonomy'],
    },
    {
      instruction:
        'Read about the 9 varieties: intortus, vertebratus, undulatus, radiatus, lacunosus, duplicatus, translucidus, perlucidus, opacus. These describe transparency (translucidus, perlucidus, opacus) and arrangement (undulatus, radiatus, vertebratus, intortus, duplicatus, lacunosus). Spot an altocumulus undulatus in a photo -- what are you seeing?',
      expectedOutcome:
        'You identify that "undulatus" means wave-like parallel bands, driven by atmospheric gravity waves at the cloud layer\'s top or bottom. Altocumulus undulatus is the classic "mackerel sky" pattern you see on a lenticular wave-flow morning. The variety tells you the dynamics; the genus+species tells you the cloud\'s microphysics.',
      hint: 'Variety names are stackable: altocumulus stratiformis translucidus undulatus is a valid full classification. You rarely need more than genus + 1 variety in the field.',
      conceptsExplored: ['environmental-wmo-cloud-taxonomy'],
    },
    {
      instruction:
        'Read about the 2017 digital edition. The WMO added one species (volutus -- roll cloud), five supplementary features including asperitas (crowd-sourced via the Cloud Appreciation Society), one accessory cloud (flumen), and five special clouds (cataractagenitus, flammagenitus, homogenitus, homomutatus, silvagenitus). Why were these added after 40 years, and what does asperitas look like?',
      expectedOutcome:
        'You explain that the 1975 edition went 40+ years without updates; the 2017 edition reopened the classification to incorporate photography advances, aviation observation reports, and the Cloud Appreciation Society\'s decade-long petition for asperitas. Asperitas appears as a turbulent, wavy, sea-like underside -- dramatic and previously uncatalogued. It is the first new cloud accepted into the WMO Atlas in over 50 years.',
      hint: 'Gavin Pretor-Pinney founded the Cloud Appreciation Society in 2005. Members submitted thousands of asperitas photos over a decade before WMO adopted the name (2017-03-22, World Meteorological Day).',
      conceptsExplored: ['environmental-wmo-cloud-taxonomy'],
    },
    {
      instruction:
        'Connect the taxonomy to aerosol-cloud interactions. Each genus has a characteristic microphysical regime: cirrus = ice only, stratocumulus = liquid only, cumulonimbus = mixed phase with glaciation. Why does aerosol-indirect ERF_aci assessment need the genus breakdown -- cannot you just average over all clouds?',
      expectedOutcome:
        'You explain that ERF_aci parametrisations are genus-dependent: Twomey brightening is strongest in marine stratocumulus (Sc) where liquid-water path is fixed by the boundary-layer depth; weaker in cumulus where entrainment dilutes the perturbation; irrelevant in cirrus where ice-crystal habit governs radiative properties. The Atlas is the observational grammar the ERF_aci assessment speaks in.',
      hint: 'IPCC AR6 Chapter 7 explicitly structures its ERF_aci discussion by cloud regime (marine Sc, continental Cu, cirrus Ci). The WMO taxonomy is not a field-guide curiosity -- it is load-bearing on climate assessment.',
      conceptsExplored: ['environmental-wmo-cloud-taxonomy', 'environmental-aerosol-indirect-erf'],
    },
    {
      instruction:
        'Close by placing WMO cloud taxonomy on the complex plane of experience: it is a concrete observational vocabulary with moderate complexity -- exhaustive enumeration rather than continuous mathematics, but with enough species/varieties to require training. State one line that captures why a 200-year-old Linnaean classification scheme is still load-bearing in 2026 atmospheric science.',
      expectedOutcome:
        'You state something like: "WMO taxonomy = 10 genera × 15 species × 9 varieties, exhaustive enumeration of every observed cloud form. Luke Howard 1803 provided the roots; WMO 2017 added asperitas and volutus; every METAR report, satellite retrieval, and IPCC Chapter speaks this language because the clouds still do."',
      hint: 'When a century-old vocabulary absorbs new observations without breaking, that is a sign the underlying phenomenology really does have the structure the taxonomy assumes.',
      conceptsExplored: ['environmental-wmo-cloud-taxonomy', 'environmental-aerosol-indirect-erf'],
    },
  ],
};
