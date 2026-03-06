// Wing 2 — Create Phase: "Build a Distance Calculator"
// Define dimensions, see the theorem generalize.
// Produces a saveable Creation object. Completion: produce creation OR skip.

import React, { useState, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState, Creation } from '@/types/index';

interface CreatePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface DimensionValue {
  label: string;
  value: number;
}

export function CreatePhase({
  onComplete,
  onCreationSave,
}: CreatePhaseProps): React.JSX.Element {
  const [dimensions, setDimensions] = useState<DimensionValue[]>([
    { label: 'width', value: 3 },
    { label: 'height', value: 4 },
  ]);
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);

  const distance = Math.sqrt(
    dimensions.reduce((sum, d) => sum + d.value * d.value, 0)
  );

  const sumOfSquares = dimensions.reduce(
    (sum, d) => sum + d.value * d.value,
    0
  );

  const handleAddDimension = useCallback(() => {
    const names = ['width', 'height', 'depth', 'time', 'color', 'temperature', 'mood', 'brightness', 'loudness', 'texture'];
    const nextName = names[dimensions.length] ?? `dim-${dimensions.length + 1}`;
    setDimensions((prev) => [...prev, { label: nextName, value: 1 }]);
  }, [dimensions.length]);

  const handleRemoveDimension = useCallback((index: number) => {
    setDimensions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleChangeDimensionValue = useCallback(
    (index: number, value: number) => {
      setDimensions((prev) =>
        prev.map((d, i) => (i === index ? { ...d, value } : d))
      );
    },
    []
  );

  const handleChangeDimensionLabel = useCallback(
    (index: number, label: string) => {
      setDimensions((prev) =>
        prev.map((d, i) => (i === index ? { ...d, label } : d))
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    const creation: Creation = {
      id: `py-create-${Date.now()}`,
      foundationId: 'pythagorean',
      type: 'code',
      title: title || `${dimensions.length}D Distance Calculator`,
      data: JSON.stringify({
        dimensions: dimensions.map((d) => ({
          label: d.label,
          value: d.value,
        })),
        distance,
        sumOfSquares,
        formula: `sqrt(${dimensions.map((d) => `${d.label}\u00B2`).join(' + ')})`,
      }),
      createdAt: new Date().toISOString(),
      shared: false,
    };
    onCreationSave(creation);
    setSaved(true);
  }, [title, dimensions, distance, sumOfSquares, onCreationSave]);

  const handleSkip = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  const handleContinue = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  return (
    <div className="phase phase--create">
      <div className="create__intro">
        <h2>Build a Distance Calculator</h2>
        <p>
          Define your own dimensions — they do not have to be spatial. Width,
          height, time, color, mood — the Pythagorean theorem measures
          "distance" in any space where the dimensions are independent. Add
          dimensions. Name them. Watch the theorem generalize.
        </p>
      </div>

      <div className="create__workspace">
        <div className="create__dimensions">
          {dimensions.map((dim, index) => (
            <div key={index} className="create__dimension">
              <input
                type="text"
                className="create__dim-label"
                value={dim.label}
                onChange={(e) =>
                  handleChangeDimensionLabel(index, e.target.value)
                }
                aria-label={`Dimension ${index + 1} name`}
              />
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={dim.value}
                onChange={(e) =>
                  handleChangeDimensionValue(index, Number(e.target.value))
                }
                aria-label={`${dim.label} value`}
              />
              <span className="create__dim-value">{dim.value.toFixed(1)}</span>
              <span className="create__dim-squared">
                {dim.label}\u00B2 = {(dim.value * dim.value).toFixed(2)}
              </span>
              {dimensions.length > 2 && (
                <button
                  className="create__dim-remove"
                  onClick={() => handleRemoveDimension(index)}
                  aria-label={`Remove ${dim.label} dimension`}
                >
                  \u00D7
                </button>
              )}
            </div>
          ))}

          <button
            className="create__add-dim-btn"
            onClick={handleAddDimension}
          >
            + Add dimension
          </button>
        </div>

        <div className="create__result" aria-live="polite">
          <p className="create__formula">
            Distance = sqrt({dimensions.map((d) => `${d.label}\u00B2`).join(' + ')})
          </p>
          <p className="create__formula-values">
            = sqrt({dimensions.map((d) => (d.value * d.value).toFixed(2)).join(' + ')})
          </p>
          <p className="create__formula-values">
            = sqrt({sumOfSquares.toFixed(2)})
          </p>
          <p className="create__distance">
            = <strong>{distance.toFixed(4)}</strong>
          </p>
        </div>

        <div className="create__naming">
          <label className="create__control">
            <span className="create__control-label">Name your calculator</span>
            <input
              type="text"
              className="create__title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Recipe Similarity Metric"
            />
          </label>
        </div>

        <div className="create__actions">
          <button
            className="create__save-btn"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? 'Saved' : 'Save calculator'}
          </button>
        </div>
      </div>

      <div className="create__continue">
        {saved ? (
          <button className="phase__continue-btn" onClick={handleContinue}>
            Complete Wing
          </button>
        ) : (
          <button className="phase__skip-btn" onClick={handleSkip}>
            Skip creation
          </button>
        )}
      </div>
    </div>
  );
}
