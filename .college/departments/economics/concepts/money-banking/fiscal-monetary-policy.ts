import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fiscalMonetaryPolicy: RosettaConcept = {
  id: 'econ-fiscal-monetary-policy',
  name: 'Fiscal and Monetary Policy',
  domain: 'economics',
  description: 'Governments use two main tools to manage macroeconomic conditions: fiscal policy (taxes and spending) and monetary policy (interest rates and money supply). ' +
    'Fiscal policy: government changes in spending or taxation to influence aggregate demand. Expansionary (stimulus): increase spending or cut taxes. Contractionary: opposite. ' +
    'Monetary policy: central bank changes in interest rates or money supply. Expansionary: lower rates, buy bonds. Contractionary: raise rates, sell bonds. ' +
    'Aggregate demand (AD): total demand in the economy (C + I + G + NX). Recessions: AD falls below potential output. ' +
    'Inflation vs. unemployment trade-off (Phillips Curve): historically inverse, but stagflation of the 1970s complicated this. ' +
    'Multiplier effect: government spending ripples through the economy -- $1 of spending creates more than $1 of GDP. ' +
    'Crowding out: government borrowing can raise interest rates, reducing private investment -- offsets fiscal stimulus. ' +
    'Quantitative easing (QE): unconventional monetary policy where central bank buys assets to inject money when rates are already near zero.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-banking-credit',
      description: 'Monetary policy operates through the banking system -- interest rate changes affect credit availability and money creation',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-economic-systems',
      description: 'Fiscal and monetary policy debates reflect deeper disagreements about how economic systems work and the proper role of government',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
