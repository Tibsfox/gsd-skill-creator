/**
 * Wing 2: Pythagorean Theorem — Create Phase
 *
 * "Build a Distance Calculator" — learner defines dimensions and sees
 * the theorem generalize.
 */

import React, { useState } from 'react';

export interface CreatePhaseProps {
  onComplete: () => void;
  onSaveCreation?: (creation: { title: string; data: string }) => void;
}

interface Dimension {
  label: string;
  value: number;
}

export const CreatePhase: React.FC<CreatePhaseProps> = ({ onComplete, onSaveCreation }) => {
  const [dimensions, setDimensions] = useState<Dimension[]>([
    { label: 'x', value: 3 },
    { label: 'y', value: 4 },
  ]);
  const [saved, setSaved] = useState(false);

  const sumOfSquares = dimensions.reduce((sum, d) => sum + d.value * d.value, 0);
  const distance = Math.sqrt(sumOfSquares);

  const addDimension = () => {
    const labels = 'xyzwvutsrqponm'.split('');
    const label = labels[dimensions.length] || `d${dimensions.length + 1}`;
    setDimensions([...dimensions, { label, value: 1 }]);
  };

  const removeDimension = () => {
    if (dimensions.length > 2) {
      setDimensions(dimensions.slice(0, -1));
    }
  };

  const updateValue = (index: number, value: number) => {
    const updated = [...dimensions];
    updated[index] = { ...updated[index], value };
    setDimensions(updated);
  };

  const handleSave = () => {
    const data = JSON.stringify({
      dimensions: dimensions.map((d) => ({ label: d.label, value: d.value })),
      sumOfSquares,
      distance,
      nDimensions: dimensions.length,
    });
    onSaveCreation?.({
      title: `${dimensions.length}D Distance Calculator`,
      data,
    });
    setSaved(true);
  };

  return (
    <div className="phase create-phase">
      <h2>Build a Distance Calculator</h2>

      <p className="narrative-intro">
        The Pythagorean theorem does not care how many dimensions you give it. Two
        dimensions, three, a hundred — the pattern is the same. Square each component,
        sum them, take the root. Build your own calculator and watch the theorem
        generalize.
      </p>

      <div className="dimension-controls" style={{ margin: '16px 0' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button onClick={addDimension}>
            Add Dimension ({dimensions.length} current)
          </button>
          <button onClick={removeDimension} disabled={dimensions.length <= 2}>
            Remove Dimension
          </button>
        </div>

        {dimensions.map((dim, i) => (
          <div key={i} style={{ margin: '6px 0' }}>
            <label>
              {dim.label}: {dim.value}
              <input
                type="range"
                min={-10}
                max={10}
                step={0.5}
                value={dim.value}
                onChange={(e) => updateValue(i, Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="calculation-display" style={{
        fontFamily: 'monospace',
        padding: '16px',
        background: '#0a0a2a',
        borderRadius: '8px',
        margin: '12px 0',
      }}>
        <div style={{ marginBottom: '8px' }}>
          {dimensions.map((d) => `${d.label}² = ${(d.value * d.value).toFixed(1)}`).join('  |  ')}
        </div>
        <div style={{ marginBottom: '8px' }}>
          Sum of squares: {dimensions.map((d) => `${(d.value * d.value).toFixed(1)}`).join(' + ')} = {sumOfSquares.toFixed(1)}
        </div>
        <div style={{ fontSize: '1.2em' }}>
          Distance = sqrt({sumOfSquares.toFixed(1)}) = {distance.toFixed(4)}
        </div>
      </div>

      <div className="insight" style={{ margin: '16px 0', padding: '12px', background: '#0a1a0a', borderRadius: '8px', border: '1px solid #2a5a2a' }}>
        <p>
          <strong>Notice:</strong> In {dimensions.length} dimensions, the Pythagorean theorem
          still works. The formula is identical — just more terms under the radical. This is
          why it is called a theorem, not a trick. It is a law of flat space, valid in any
          number of dimensions.
        </p>
      </div>

      <button onClick={handleSave} disabled={saved} style={{ margin: '8px 0' }}>
        {saved ? 'Saved!' : 'Save this calculator'}
      </button>

      <button className="phase-advance" disabled={!saved} onClick={onComplete} style={{ margin: '8px 0' }}>
        {saved ? 'Complete Wing 2' : 'Save your creation first...'}
      </button>
    </div>
  );
};

export const createMeta = {
  containsMath: true,
  interactiveElements: 2,
  interactiveElementIds: ['pyth-create-dimensions', 'pyth-create-sliders'],
  creationType: 'code',
};
