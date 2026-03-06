/**
 * Wing 8: L-Systems — Wonder Phase
 * "Growth"
 *
 * Fern fronds. Tree branches. Frost on glass. Growth from simplicity.
 * Zero math. This is the final wing — it should feel like arriving
 * back at the beginning with new eyes. "Begin again."
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface WonderPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const WonderPhase: React.FC<WonderPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase wonder-phase l-systems-wonder">
      <h2>{phase.title}</h2>

      <div className="wonder-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="wonder-stories">
        <div className="wonder-story">
          <h3>The Fern Unfurling</h3>
          <p>
            Watch a fern frond in spring. It begins as a tight spiral — a
            fiddlehead — and then unfurls, slowly, over days. As it opens,
            you see that each leaf is a smaller copy of the whole frond.
            And each leaflet on each leaf is a smaller copy still. The same
            shape, at every scale, nested inside itself. The fern did not
            plan this complexity. It followed one simple rule, again and
            again, and the complexity emerged.
          </p>
        </div>

        <div className="wonder-story">
          <h3>The Branching Tree</h3>
          <p>
            A tree begins as a single stem. The stem splits into two branches.
            Each branch splits again. And again. The angles are not random —
            they follow a pattern encoded in the tree's genes. A rule so simple
            you could write it in a sentence: "grow forward, then split at this
            angle." From that one rule, iterated through seasons and years, a
            oak tree rises — a hundred thousand branches, each one placed by
            the same instruction. Complexity from simplicity. Structure from
            repetition.
          </p>
        </div>

        <div className="wonder-story">
          <h3>Frost on Glass</h3>
          <p>
            On a cold morning, frost crystals spread across a window. They
            branch and fork, forming patterns of breathtaking intricacy.
            No two frost patterns are identical, yet they all share the
            same branching logic. Water molecules following the same rule
            — attach at this angle, branch at this distance — produce
            infinite variation from finite instruction. The frost is
            writing a program on your window, and the program is: grow.
          </p>
        </div>

        <div className="wonder-story">
          <h3>Your Family Tree</h3>
          <p>
            You have two parents. Each of them has two parents. Each of
            those has two. The tree branches backward through time, doubling
            at every generation. And forward: every choice you make branches
            the future. A conversation started, a path taken, a kindness
            offered — each one splits the timeline into what-happened and
            what-did-not. You are standing at the growing tip of a tree
            that stretches back to the first cell and forward into everything
            you might become. The same rule that grows a fern grows a life.
          </p>
        </div>

        <div className="wonder-story">
          <h3>A City Over Centuries</h3>
          <p>
            Look at an old city from above. The streets near the center are
            narrow and winding — they grew organically, path following path,
            each new road branching from the last. The outer suburbs are
            gridded, planned, geometric. The city is a living L-system: its
            early growth followed simple rules (build where people walk),
            and the complexity of its street network emerged from centuries
            of those rules applied, generation after generation, stone upon
            stone.
          </p>
        </div>
      </div>

      <div className="wonder-reflection">
        <p>
          {phase.content.text}
        </p>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        Growth is everywhere...
      </button>
    </div>
  );
};

export default WonderPhase;
