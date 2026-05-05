/**
 * Heckbert "nice numbers" tick algorithm.
 * Reference: Heckbert, P. (1990). Nice numbers for graph labels.
 * In A. Glassner (Ed.), Graphics Gems I (pp. 61–63). Academic Press.
 * @module atlas/scales/ticks-heckbert
 */

function niceNum(x: number, round: boolean): number {
  const exp = Math.floor(Math.log10(x));
  const f = x / Math.pow(10, exp);
  let nf: number;
  if (round) {
    if (f < 1.5) nf = 1;
    else if (f < 3) nf = 2;
    else if (f < 7) nf = 5;
    else nf = 10;
  } else {
    if (f <= 1) nf = 1;
    else if (f <= 2) nf = 2;
    else if (f <= 5) nf = 5;
    else nf = 10;
  }
  return nf * Math.pow(10, exp);
}

export interface HeckbertResult {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

/**
 * Compute nice tick positions for [dataMin, dataMax].
 * @param dataMin  Lower bound of data range.
 * @param dataMax  Upper bound of data range.
 * @param targetCount  Desired number of ticks (default 5).
 */
export function heckbertTicks(
  dataMin: number,
  dataMax: number,
  targetCount = 5,
): HeckbertResult {
  if (dataMin === dataMax) {
    const step = Math.abs(dataMin) > 0 ? Math.pow(10, Math.floor(Math.log10(Math.abs(dataMin)))) : 1;
    const ticks = [dataMin];
    return { min: dataMin, max: dataMax, step, ticks };
  }
  const range = niceNum(Math.abs(dataMax - dataMin), false);
  const step = niceNum(range / (targetCount - 1), true);
  const niceMin = Math.floor(dataMin / step) * step;
  const niceMax = Math.ceil(dataMax / step) * step;
  const ticks: number[] = [];
  for (let t = niceMin; t <= niceMax + step * 0.5; t += step) {
    ticks.push(parseFloat(t.toPrecision(12)));
  }
  return { min: niceMin, max: niceMax, step, ticks };
}
