import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const collaborativeTools: RosettaConcept = {
  id: 'diglit-collaborative-tools',
  name: 'Collaborative Digital Tools',
  domain: 'digital-literacy',
  description: 'Shared documents and collaborative platforms enable asynchronous teamwork. ' +
    'Version history: every edit is tracked -- you can see who changed what and revert. ' +
    'Comments vs. suggestions: comments discuss; suggestions propose changes that can be accepted or rejected. ' +
    'Simultaneous editing: multiple people editing the same document creates merge conflicts -- ' +
    'establish team norms about section ownership. ' +
    'File naming conventions: date_project_version_author prevents "final_FINAL_v3_reallyfinal.docx." ' +
    'Cloud sync: local files synchronized to cloud (Google Drive, OneDrive, Dropbox) -- ' +
    'understand conflict resolution when the same file is edited offline. ' +
    'Access control: viewer, commenter, editor, owner permissions -- ' +
    'grant minimum necessary access (principle of least privilege).',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'code-peer-review',
      description: 'Document collaboration with comments and suggestions mirrors code review with pull requests',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
