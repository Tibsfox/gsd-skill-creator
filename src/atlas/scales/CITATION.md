# Citations: atlas/scales

## Heckbert Nice Numbers (ticks-heckbert.ts)

Heckbert, P. S. (1990). Nice numbers for graph labels.
In A. S. Glassner (Ed.), *Graphics Gems I* (pp. 61–63). Academic Press.
ISBN 0-12-286165-5.

The `niceNum(x, round)` function implements the exact algorithm from pp. 61–63:
choose a "nice" number near x from the set {1, 2, 5, 10} × 10^exp.
`heckbertTicks(dataMin, dataMax, targetCount)` derives step via niceNum on the
range, then computes niceMin/niceMax as multiples of step.
