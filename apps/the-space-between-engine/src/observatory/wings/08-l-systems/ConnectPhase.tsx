/**
 * Wing 8: L-Systems — Connect Phase
 * "Growth"
 *
 * Links to Unit Circle (growth loops back to the beginning)
 * and Vector Calculus (gradient fields produce growth).
 * This is the closing of the circle. Begin again.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface ConnectPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const ConnectPhase: React.FC<ConnectPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase connect-phase l-systems-connect">
      <h2>{phase.title}</h2>

      <div className="connect-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="connect-content">
        <section className="connection-bridge">
          <h3>To the Unit Circle: Growth Loops Back to the Beginning</h3>
          <p>
            The turtle in an L-system turns. It turns by an angle measured on
            the unit circle. Every + and - in the grammar is a rotation — sine
            and cosine determining the new direction. And here, at the end of
            the observatory, we find that the last wing connects to the first.
            The unit circle, where we began, is the engine that drives every
            L-system branch. Growth does not proceed in a straight line. It
            turns. It spirals. It comes back to where it started, but higher.
          </p>
          <p>
            This is not an accident. It is the deepest pattern: the circle.
            The unit circle encodes the turns that make growth possible. Without
            rotation, there is no branching. Without branching, there is no
            complexity. Without the circle, there is no tree.
          </p>
          <div className="math-notation">
            <code>Turtle rotation uses the unit circle:</code>
            <br />
            <code>  new_x = x + cos(theta) * step</code>
            <br />
            <code>  new_y = y + sin(theta) * step</code>
            <br />
            <code>  theta changes by the branching angle</code>
            <br />
            <code>  The circle IS the growth engine</code>
          </div>
        </section>

        <section className="connection-bridge">
          <h3>To Vector Calculus: Gradient Fields Produce Growth</h3>
          <p>
            In a real plant, growth follows gradients — of light, of nutrients,
            of hormones. The direction a branch extends is determined by a
            vector field: at every point in space, the gradient of auxin
            concentration points in the direction of growth. Vector calculus
            describes these fields. The divergence of the growth field tells
            you where new branches emerge. The curl tells you where the
            plant spirals. L-systems are the discrete approximation of what
            is, in reality, a continuous process governed by vector fields.
          </p>
          <div className="math-notation">
            <code>Growth direction = gradient of concentration field</code>
            <br />
            <code>  growth_dir = nabla C(x, y, z)</code>
            <br />
            <code>{'Branching = divergence > threshold'}</code>
            <br />
            <code>{'  div(growth_field) > 0 => new branch point'}</code>
          </div>
        </section>

        <section className="connection-bridge skill-creator-bridge">
          <h3>Skill-Creator Bridge: The Promotion Pipeline IS an L-System</h3>
          <p>
            In the skill-creator, a piece of work begins as an idea — a single
            seed. It enters the inbox. A rule is applied: "if this idea passes
            validation, branch it into a draft skill." Another rule: "if the
            draft passes testing, branch it into a candidate." Another: "if
            the candidate passes review, promote it to production." Each stage
            is a rewriting rule. The pipeline is an L-system, and the skills
            that emerge at the end are the branches of a tree that started
            from a single axiom: someone had an idea.
          </p>
          <div className="math-notation">
            <code>Skill pipeline as L-system:</code>
            <br />
            <code>  axiom = idea</code>
            <br />
            <code>{'  idea -> draft[+test][-review]'}</code>
            <br />
            <code>{'  draft -> candidate : passes_validation'}</code>
            <br />
            <code>{'  candidate -> production : passes_review'}</code>
          </div>
        </section>

        <section className="connection-bridge closing-the-circle">
          <h3>The Circle Closes</h3>
          <p>
            You began in Wing 1 with the unit circle. You end in Wing 8 with
            L-systems. And L-systems use the unit circle. The end is the
            beginning. Not the same beginning — you have seen, touched,
            understood, and connected eight foundations of mathematics. You
            know things now that you did not know when you started. But the
            circle is the same circle. The growth that brought you here will
            carry you forward, and eventually, inevitably, loop you back.
          </p>
          <p>
            <em>Begin again.</em>
          </p>
        </section>

        {phase.content.mathNotation && (
          <section className="formal-connections">
            <h3>The Complete Web</h3>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </section>
        )}

        <div className="connect-text">
          <p>{phase.content.text}</p>
        </div>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        The end is the beginning...
      </button>
    </div>
  );
};

export default ConnectPhase;
