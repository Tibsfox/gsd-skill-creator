/**
 * Step-by-step animation composer.
 *
 * Reads a YAML/JSON spec enumerating steps and per-step SVG fragments,
 * emits a single self-contained SMIL animation matching the SCRIBE
 * step-by-step pattern (Doc 04 of the source mission).
 *
 * Spec schema:
 *   {
 *     "title": "Solve 2x + 3 = 11 for x",
 *     "viewBox": [0, 0, 600, 320],
 *     "stateHoldSeconds": 1.5,
 *     "transitionSeconds": 0.4,
 *     "steps": [
 *       { "title": "Initial", "desc": "...", "svgFragment": "<text ...>...</text>" },
 *       ...
 *     ]
 *   }
 *
 * Output: single SVG string with one <g class="step"> per step, each with
 * <animate attributeName="opacity"> driving the layered-opacity pattern.
 */

export interface Step {
  title: string;
  desc: string;
  svgFragment: string;
}

export interface StepByStepSpec {
  title: string;
  viewBox: [number, number, number, number];
  stateHoldSeconds: number;
  transitionSeconds: number;
  steps: Step[];
}

export function composeStepByStep(spec: StepByStepSpec): string {
  const { title, viewBox, stateHoldSeconds, transitionSeconds, steps } = spec;
  const stepDur = stateHoldSeconds + transitionSeconds;
  const totalDur = stepDur * steps.length;

  const stepGroups = steps
    .map((step, i) => {
      const start = i * stepDur;
      const fadeIn = start + transitionSeconds * 0.5;
      const fadeOut = start + stepDur;
      const ratio = (t: number) => (t / totalDur).toFixed(4);

      const keyTimes = [
        0,
        ratio(start),
        ratio(fadeIn),
        ratio(fadeOut - transitionSeconds * 0.5),
        ratio(fadeOut),
        1,
      ].join(";");
      const values = "0;0;1;1;0;0";

      return `  <g class="step" opacity="0">
    <title>${escapeXml(step.title)}</title>
    <desc>${escapeXml(step.desc)}</desc>
    ${step.svgFragment}
    <animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${totalDur}s" repeatCount="indefinite"/>
  </g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(" ")}" role="img" aria-labelledby="t d">
  <title id="t">${escapeXml(title)}</title>
  <desc id="d">Step-by-step animation: ${steps.length} steps cycling over ${totalDur}s.</desc>
${stepGroups}
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&apos;",
  );
}
