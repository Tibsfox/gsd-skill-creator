// ─── Garden Workshop ────────────────────────────────────
// Creative workshop with tabs for Art Canvas, Music Studio,
// L-System Editor, and Reflection Journal.

import React, { useState, useCallback } from 'react';
import type { LearnerState, Creation, FoundationId } from '../../types/index.js';
import { ArtCanvas } from './ArtCanvas.js';
import { MusicStudio } from './MusicStudio.js';
import { LSystemEditor } from './LSystemEditor.js';
import { Journal } from './Journal.js';

export type GardenTab = 'art' | 'music' | 'lsystem' | 'journal';

export interface GardenProps {
  learnerState: LearnerState;
  onCreateSave: (creation: Omit<Creation, 'id' | 'createdAt'>) => void;
}

const TAB_LABELS: Record<GardenTab, string> = {
  art: 'Art Canvas',
  music: 'Music Studio',
  lsystem: 'L-System Editor',
  journal: 'Journal',
};

const TAB_ORDER: GardenTab[] = ['art', 'music', 'lsystem', 'journal'];

export function Garden({ learnerState, onCreateSave }: GardenProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<GardenTab>('art');
  const foundation = learnerState.currentFoundation;

  const handleSaveArt = useCallback(
    (dataUrl: string, title: string) => {
      onCreateSave({
        foundationId: foundation,
        type: 'generative-art',
        title,
        data: dataUrl,
        shared: false,
      });
    },
    [foundation, onCreateSave],
  );

  const handleSaveMusic = useCallback(
    (config: string, title: string) => {
      onCreateSave({
        foundationId: foundation,
        type: 'algorithmic-music',
        title,
        data: config,
        shared: false,
      });
    },
    [foundation, onCreateSave],
  );

  const handleSaveLSystem = useCallback(
    (dataUrl: string, title: string) => {
      onCreateSave({
        foundationId: foundation,
        type: 'l-system',
        title,
        data: dataUrl,
        shared: false,
      });
    },
    [foundation, onCreateSave],
  );

  const handleSaveJournal = useCallback(
    (text: string, prompt?: string) => {
      onCreateSave({
        foundationId: foundation,
        type: 'journal',
        title: prompt ?? 'Journal Entry',
        data: text,
        shared: false,
      });
    },
    [foundation, onCreateSave],
  );

  return (
    <div className="garden-workshop" data-testid="garden-workshop">
      <nav className="garden-tabs" data-testid="garden-tabs">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            className={`garden-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            data-testid={`garden-tab-${tab}`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      <div className="garden-content" data-testid="garden-content">
        {activeTab === 'art' && (
          <ArtCanvas foundation={foundation} onSave={handleSaveArt} />
        )}
        {activeTab === 'music' && (
          <MusicStudio foundation={foundation} onSave={handleSaveMusic} />
        )}
        {activeTab === 'lsystem' && (
          <LSystemEditor onSave={handleSaveLSystem} />
        )}
        {activeTab === 'journal' && (
          <Journal
            foundation={foundation}
            entries={learnerState.journalEntries}
            onSave={handleSaveJournal}
          />
        )}
      </div>
    </div>
  );
}

export { ArtCanvas } from './ArtCanvas.js';
export { MusicStudio } from './MusicStudio.js';
export { LSystemEditor } from './LSystemEditor.js';
export { Journal } from './Journal.js';
