import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataConversionDsp: RosettaConcept = {
  id: 'elec-data-conversion-dsp',
  name: 'Data Conversion & DSP',
  domain: 'electronics',
  description:
    'Analog-to-Digital Converters (ADC) sample continuous signals at discrete time points. ' +
    'Nyquist theorem: sample rate must exceed 2*f_max to prevent aliasing. Quantization maps ' +
    'the signal to N-bit integers; quantization noise power = (Delta^2)/12 where Delta is LSB size. ' +
    'ADC architectures: successive approximation (SAR) -- accurate, slow; sigma-delta -- very high ' +
    'resolution (24-bit audio); flash -- very fast, parallel comparators for each level. ' +
    'Digital-to-Analog Converters (DAC): R-2R ladder network converts digital code to analog voltage. ' +
    'FIR (finite impulse response) filters are always stable, linear phase; IIR (infinite impulse ' +
    'response) are more efficient but can be unstable. FFT computes N-point DFT in O(N*log N) vs ' +
    'O(N^2) for direct DFT. Convolution in time domain equals multiplication in frequency domain. ' +
    'Windowing (Hann, Hamming, Blackman) reduces spectral leakage when analyzing non-integer-period signals.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-signal-ac-analysis',
      description: 'Nyquist sampling theorem and spectral analysis are extensions of AC frequency analysis',
    },
    {
      type: 'dependency',
      targetId: 'elec-microcontroller-interfacing',
      description: 'ADC peripherals in MCUs require understanding of sampling rates, resolution, and reference voltages',
    },
  ],
  complexPlanePosition: {
    real: 0.40,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.40 ** 2 + 0.65 ** 2),
    angle: Math.atan2(0.65, 0.40),
  },
};
