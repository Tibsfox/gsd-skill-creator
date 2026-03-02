import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const studyEnvironment: RosettaConcept = {
  id: 'learn-study-environment',
  name: 'Study Environment',
  domain: 'learning',
  description:
    'The physical and temporal environment significantly affects learning quality. ' +
    'Distraction management: every interruption costs 15-23 minutes of cognitive recovery ' +
    '(Gloria Mark\'s research); smartphone notifications are the primary culprit in modern ' +
    'study environments. Phone in another room (not face-down on the desk) improves ' +
    'working memory availability. The Pomodoro technique (25-minute focused sessions with ' +
    '5-minute breaks) works because: it creates artificial urgency, provides regular breaks ' +
    'that consolidate memory, and makes large tasks tractable. ' +
    'Variation in study location slightly improves recall because retrieval cues become ' +
    'more context-independent. ' +
    'Background music: instrumental music at low volume is neutral for most people; ' +
    'music with lyrics competes with reading and writing. ' +
    'Paper vs. digital notes: note-taking by hand forces synthesis (cannot transcribe everything) ' +
    'and produces better long-term retention than typed transcription. ' +
    'Physical environment: temperature 70-76°F optimal; natural light or cool-white light; ' +
    'sitting upright (not reclined) maintains alertness.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-memory-science',
      description: 'Environment design is applied memory science -- creating conditions for optimal encoding',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
