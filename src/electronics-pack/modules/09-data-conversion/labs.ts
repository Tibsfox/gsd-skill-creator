/**
 * Module 9: Data Conversion -- Lab exercises
 *
 * 5 labs backed by the DSP engine (quantizeSignal, reconstructSignal, dspFFT).
 * These labs simulate ADC/DAC algorithms, aliasing, and sigma-delta concepts.
 * Unlike Modules 1-7 which use MNA circuit simulation, data conversion labs
 * are pure digital signal processing.
 */

import { quantizeSignal, reconstructSignal, dspFFT } from '../../simulator/dsp-engine';

export interface LabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface Lab {
  id: string;
  title: string;
  steps: LabStep[];
  verify: () => boolean;
}

// ============================================================================
// Helper: check if two values are within a relative tolerance
// ============================================================================

function withinTolerance(actual: number, expected: number, toleranceFraction: number): boolean {
  if (expected === 0) return Math.abs(actual) < toleranceFraction;
  return Math.abs(actual - expected) / Math.abs(expected) < toleranceFraction;
}

// ============================================================================
// Helper: find peak frequency from FFT result
// ============================================================================

function peakFrequency(frequencies: number[], magnitudes: number[]): number {
  let maxMag = -Infinity;
  let peakFreq = 0;
  // Skip DC bin (index 0)
  for (let i = 1; i < frequencies.length; i++) {
    if (magnitudes[i] > maxMag) {
      maxMag = magnitudes[i];
      peakFreq = frequencies[i];
    }
  }
  return peakFreq;
}

// ============================================================================
// Lab 1: R-2R DAC (m9-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm9-lab-01',
  title: 'R-2R DAC',
  steps: [
    {
      instruction: 'Model an 8-bit R-2R DAC with Vref = 5.0V. The R-2R ladder converts a digital code D to an analog output: V_out = Vref * D / 2^N. Start with code 0 (all bits low).',
      expected_observation: 'Code 0 produces V_out = 0V. No current flows through the resistor ladder when all switches are connected to ground.',
      learn_note: 'The R-2R DAC uses only two resistor values (R and 2R) to create a binary-weighted voltage divider. Each bit contributes exactly half the voltage of the bit above it. This elegant topology is monotonic by construction.',
    },
    {
      instruction: 'Set the digital code to 128 (binary 10000000 -- only the MSB set). Calculate V_out = 5.0 * 128 / 256.',
      expected_observation: 'Code 128 produces V_out = 2.5V, exactly midscale. The MSB alone contributes Vref/2 because it controls the highest-weighted branch of the ladder.',
      learn_note: 'Midscale is the quickest sanity check for any DAC. If midscale is wrong, the reference voltage or bit weighting is off. In production testing, midscale accuracy is one of the first measurements.',
    },
    {
      instruction: 'Set the code to 255 (all bits high, full scale minus 1 LSB). Calculate V_out = 5.0 * 255 / 256.',
      expected_observation: 'Code 255 produces V_out = 4.9805V, which is one LSB below Vref. A DAC can never quite reach its reference voltage -- the maximum output is always Vref * (2^N - 1) / 2^N.',
      learn_note: 'The "full scale minus 1 LSB" behavior is fundamental. An N-bit DAC has 2^N codes (0 to 2^N-1), giving 2^N voltage levels. The LSB size is Vref/2^N = 5.0/256 = 19.53mV for an 8-bit 5V DAC.',
    },
  ],
  verify: () => {
    const bits = 8;
    const vRef = 5.0;
    const levels = Math.pow(2, bits);
    const lsb = vRef / levels;

    // Code 0 -> 0V
    const v0 = vRef * 0 / levels;
    if (Math.abs(v0) > lsb) return false;

    // Code 128 -> 2.5V (midscale)
    const v128 = vRef * 128 / levels;
    if (!withinTolerance(v128, 2.5, 0.01)) return false;

    // Code 255 -> ~4.98V (full scale - 1 LSB)
    const v255 = vRef * 255 / levels;
    const expectedFullScale = vRef * (levels - 1) / levels; // 4.98046875
    if (!withinTolerance(v255, expectedFullScale, 0.001)) return false;

    // Cross-check with reconstructSignal (integer codes -> voltage)
    const reconstructed = reconstructSignal([0, 128, 255], bits, vRef);
    if (Math.abs(reconstructed[0]) > lsb) return false;
    if (!withinTolerance(reconstructed[1], 2.5, 0.01)) return false;
    if (!withinTolerance(reconstructed[2], v255, 0.001)) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: SAR ADC (m9-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm9-lab-02',
  title: 'SAR ADC',
  steps: [
    {
      instruction: 'Implement a successive approximation ADC: 8 bits, Vref = 5.0V, input voltage = 3.3V. Start with an empty code (all bits 0). Set the MSB (bit 7) to 1, giving trial code 128. Compare the DAC output (128 * 5.0/256 = 2.5V) with the input (3.3V).',
      expected_observation: 'DAC output 2.5V < input 3.3V, so keep the MSB set. The SAR has determined the output is in the upper half of the range.',
      learn_note: 'The SAR algorithm is a binary search in voltage space. Each comparison halves the remaining uncertainty. This is why an N-bit SAR ADC needs exactly N clock cycles -- one comparison per bit, MSB first.',
    },
    {
      instruction: 'Continue the binary search: set bit 6 (trial code 192 = 128+64, DAC = 3.75V > 3.3V, clear bit 6). Set bit 5 (trial code 160 = 128+32, DAC = 3.125V < 3.3V, keep). Continue through all 8 bits.',
      expected_observation: 'After all 8 iterations, the SAR converges on code 169 (binary 10101001). Reconstructed voltage: 169 * 5.0/256 = 3.3008V, within 1 LSB (19.5mV) of the 3.3V input.',
      learn_note: 'SAR ADCs are the most widely used ADC architecture (12-16 bits typical, up to 5 MSps). They offer an excellent balance of speed, resolution, power, and cost. Most microcontroller ADCs are SAR type.',
    },
    {
      instruction: 'Verify the quantization error: |3.3V - 3.3008V| = 0.8mV, which is well within 1 LSB (19.5mV). The maximum quantization error for any ADC is +/- 0.5 LSB.',
      expected_observation: 'The error is 0.8mV out of a possible 9.8mV (0.5 LSB). This particular input voltage happens to land very close to a quantization level boundary.',
      learn_note: 'Quantization error is inherent in all ADCs -- it is the price of converting a continuous value to discrete levels. More bits reduces the error: 8-bit gives 19.5mV LSB, 12-bit gives 1.22mV LSB, 16-bit gives 76.3uV LSB (all with 5V reference).',
    },
  ],
  verify: () => {
    const bits = 8;
    const vRef = 5.0;
    const vInput = 3.3;
    const levels = Math.pow(2, bits);
    const lsb = vRef / levels;

    // Run SAR algorithm
    let code = 0;
    for (let bit = bits - 1; bit >= 0; bit--) {
      code |= (1 << bit); // Set current bit
      const dacOutput = code * vRef / levels;
      if (dacOutput > vInput) {
        code &= ~(1 << bit); // Clear if DAC > input
      }
    }

    // Expected code: round(3.3 / 5.0 * 256) = 169
    const expectedCode = Math.round(vInput / vRef * levels);
    if (Math.abs(code - expectedCode) > 1) return false;

    // Reconstructed voltage within 1 LSB of input
    const reconstructedV = code * vRef / levels;
    if (Math.abs(reconstructedV - vInput) > lsb) return false;

    // Cross-check with quantizeSignal
    const quantized = quantizeSignal([vInput], bits, vRef);
    if (Math.abs(quantized[0] - reconstructedV) > lsb) return false;

    return true;
  },
};

// ============================================================================
// Lab 3: Aliasing Demo (m9-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm9-lab-03',
  title: 'Aliasing Demo',
  steps: [
    {
      instruction: 'Generate a 1000 Hz sine wave with amplitude 1.0. Sample it at 8000 Hz (well above the Nyquist rate of 2000 Hz). Compute the FFT of the sampled signal.',
      expected_observation: 'The FFT shows a clear peak at 1000 Hz. Since the sample rate (8000 Hz) is well above twice the signal frequency (2000 Hz), the signal is faithfully captured.',
      learn_note: 'The Nyquist-Shannon sampling theorem states: to perfectly reconstruct a signal, the sample rate must be at least twice the highest frequency component. Here 8000 Hz >= 2 * 1000 Hz, so the signal is properly sampled.',
    },
    {
      instruction: 'Now resample the same 1000 Hz sine at only 1500 Hz -- below the Nyquist rate for this signal (Nyquist = 750 Hz). Compute the FFT.',
      expected_observation: 'The FFT shows a peak near 500 Hz instead of 1000 Hz! The original 1000 Hz signal has aliased to |f_sample - f_signal| = |1500 - 1000| = 500 Hz.',
      learn_note: 'Aliasing creates phantom frequencies that cannot be distinguished from real signals. A 1000 Hz tone sampled at 1500 Hz looks identical to a 500 Hz tone. This is why anti-aliasing filters are mandatory before any ADC.',
    },
    {
      instruction: 'Compare the two FFT results side by side. The properly sampled signal has its energy at 1000 Hz. The undersampled signal has its energy shifted to 500 Hz. No amount of digital processing can recover the original frequency.',
      expected_observation: 'Proper sampling: peak at 1000 Hz. Undersampling: peak at 500 Hz. The alias frequency is always |f_signal mod f_sample| folded into [0, f_sample/2].',
      learn_note: 'In the frequency domain, aliasing "folds" frequencies above Nyquist back into the baseband. Real systems use an analog low-pass filter (anti-aliasing filter) set at f_sample/2 to remove frequencies that would alias.',
    },
  ],
  verify: () => {
    const signalFreq = 1000; // Hz
    const amplitude = 1.0;

    // Proper sampling at 8000 Hz
    const fs1 = 8000;
    const numSamples1 = 1024;
    const signal1: number[] = [];
    for (let i = 0; i < numSamples1; i++) {
      signal1.push(amplitude * Math.sin(2 * Math.PI * signalFreq * i / fs1));
    }
    const fftResult1 = dspFFT(signal1, fs1);
    const peak1 = peakFrequency(fftResult1.frequencies, fftResult1.magnitudes);
    // Peak should be at or near 1000 Hz
    if (Math.abs(peak1 - 1000) > 50) return false;

    // Undersampling at 1500 Hz -- generate directly at this sample rate
    const fs2 = 1500;
    const numSamples2 = 512;
    const signal2: number[] = [];
    for (let i = 0; i < numSamples2; i++) {
      signal2.push(amplitude * Math.sin(2 * Math.PI * signalFreq * i / fs2));
    }
    const fftResult2 = dspFFT(signal2, fs2);
    const peak2 = peakFrequency(fftResult2.frequencies, fftResult2.magnitudes);
    // Alias frequency: |1500 - 1000| = 500 Hz
    if (Math.abs(peak2 - 500) > 50) return false;

    return true;
  },
};

// ============================================================================
// Lab 4: Audio ADC/DAC Round-Trip (m9-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm9-lab-04',
  title: 'Audio ADC/DAC Round-Trip',
  steps: [
    {
      instruction: 'Generate a 440 Hz sine wave (concert A) at 8000 Hz sample rate, 1024 samples. This represents an audio signal entering an ADC. The signal swings from 0 to 1.0V (offset to stay within the ADC range).',
      expected_observation: 'The raw signal is a clean 440 Hz sine. FFT shows a single sharp peak at 440 Hz with negligible energy at other frequencies.',
      learn_note: 'Before quantization, the signal has infinite precision (floating point). The ADC must map this continuous waveform to discrete voltage levels. The number of bits determines how many levels are available.',
    },
    {
      instruction: 'Quantize the signal at 16 bits (Vref = 1.0V). This gives 65536 levels with an LSB of 15.3uV. Compute the FFT of the quantized signal.',
      expected_observation: 'The 16-bit quantized signal is virtually indistinguishable from the original. FFT still shows a dominant 440 Hz peak. The quantization noise floor is extremely low (SNR ~ 98 dB).',
      learn_note: '16-bit resolution is CD quality audio. The quantization noise (SNR = 6.02*16 + 1.76 = 98.1 dB) is well below the threshold of human hearing. This is why 16-bit audio sounds essentially perfect.',
    },
    {
      instruction: 'Quantize the same signal at only 4 bits (Vref = 1.0V). This gives just 16 levels with an LSB of 62.5mV. Compute the FFT and compare with the 16-bit version.',
      expected_observation: 'The 4-bit signal is a crude staircase approximation. FFT shows the 440 Hz peak but with significantly more spectral content spread across all frequencies -- this is quantization noise.',
      learn_note: '4-bit quantization (SNR = 6.02*4 + 1.76 = 25.8 dB) sounds terrible -- like a buzzy, distorted version of the original. Each additional bit of resolution adds ~6 dB of SNR, which is why precision applications use 16-24 bits.',
    },
  ],
  verify: () => {
    const signalFreq = 440;
    const sampleRate = 8000;
    const numSamples = 1024;
    const vRef = 1.0;

    // Generate 440 Hz sine wave offset to [0, 1.0V] range
    const signal: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      signal.push(0.5 + 0.4 * Math.sin(2 * Math.PI * signalFreq * i / sampleRate));
    }

    // 16-bit quantization
    const quantized16 = quantizeSignal(signal, 16, vRef);
    const fft16 = dspFFT(quantized16, sampleRate);
    const peak16 = peakFrequency(fft16.frequencies, fft16.magnitudes);
    if (Math.abs(peak16 - 440) > 20) return false;

    // 4-bit quantization
    const quantized4 = quantizeSignal(signal, 4, vRef);
    const fft4 = dspFFT(quantized4, sampleRate);
    const peak4 = peakFrequency(fft4.frequencies, fft4.magnitudes);
    if (Math.abs(peak4 - 440) > 20) return false;

    // 4-bit should have higher noise floor (more energy spread across bins)
    // Compare total spectral energy outside the signal bin
    let noiseEnergy16 = 0;
    let noiseEnergy4 = 0;
    for (let i = 1; i < fft16.magnitudes.length; i++) {
      // Skip bins near the signal frequency
      if (Math.abs(fft16.frequencies[i] - 440) < 50) continue;
      noiseEnergy16 += fft16.magnitudes[i] * fft16.magnitudes[i];
    }
    for (let i = 1; i < fft4.magnitudes.length; i++) {
      if (Math.abs(fft4.frequencies[i] - 440) < 50) continue;
      noiseEnergy4 += fft4.magnitudes[i] * fft4.magnitudes[i];
    }
    // 4-bit noise should be significantly higher
    if (noiseEnergy4 <= noiseEnergy16) return false;

    return true;
  },
};

// ============================================================================
// Lab 5: Sigma-Delta Concept (m9-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm9-lab-05',
  title: 'Sigma-Delta Concept',
  steps: [
    {
      instruction: 'Generate a slow 100 Hz sine wave at amplitude 0.4V with a 0.5V DC offset (signal range 0.1V to 0.9V). Oversample at 16000 Hz to get 16x the Nyquist rate (Nyquist for 100 Hz = 200 Hz).',
      expected_observation: 'The oversampled signal has 16000/200 = 80x oversampling ratio. Each period of the 100 Hz sine is captured with 160 samples, providing far more data than needed.',
      learn_note: 'Sigma-delta ADCs trade speed for resolution. By sampling at many times the Nyquist rate, they spread quantization noise across a wider bandwidth. A digital filter then removes most of this noise.',
    },
    {
      instruction: 'Apply a 1-bit quantizer: each sample above 0.5V (Vref/2) becomes 1, below becomes 0. This brutal quantization produces a bitstream that looks nothing like the original sine.',
      expected_observation: 'The 1-bit output is a pattern of 0s and 1s. When the sine is near its peak (0.9V), mostly 1s appear. Near its trough (0.1V), mostly 0s. At the midpoint (0.5V), roughly equal numbers of 0s and 1s.',
      learn_note: 'A single-bit quantizer is the simplest possible ADC (just a comparator). Its SNR is only about 7.8 dB (6.02*1 + 1.76). But oversampling spreads the quantization noise, and decimation averaging recovers resolution.',
    },
    {
      instruction: 'Decimate by averaging groups of 16 consecutive 1-bit samples. Each group average produces one multi-bit output sample at the effective sample rate of 16000/16 = 1000 Hz.',
      expected_observation: 'The decimated output is a smoother signal that follows the shape of the original 100 Hz sine. FFT of the decimated output shows a peak near 100 Hz, confirming the signal has been recovered from the 1-bit stream.',
      learn_note: 'Decimation (averaging groups of oversampled 1-bit data) effectively creates a multi-bit result. Each doubling of the oversampling ratio adds 0.5 bits of effective resolution. Real sigma-delta ADCs achieve 24 bits for audio using noise shaping on top of oversampling.',
    },
  ],
  verify: () => {
    const signalFreq = 100; // Hz
    const oversampleRate = 16000; // Hz
    const decimationFactor = 16;
    const effectiveRate = oversampleRate / decimationFactor; // 1000 Hz
    const vRef = 1.0;

    // Generate oversampled signal (enough for several periods)
    const numSamples = 1024 * decimationFactor; // 16384 samples
    const signal: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      signal.push(0.5 + 0.4 * Math.sin(2 * Math.PI * signalFreq * i / oversampleRate));
    }

    // 1-bit quantization: compare to threshold (Vref/2)
    const threshold = vRef / 2;
    const bitstream: number[] = signal.map((s) => s >= threshold ? 1 : 0);

    // Decimate by averaging groups of 16
    const decimated: number[] = [];
    for (let i = 0; i + decimationFactor <= bitstream.length; i += decimationFactor) {
      let sum = 0;
      for (let j = 0; j < decimationFactor; j++) {
        sum += bitstream[i + j];
      }
      decimated.push(sum / decimationFactor);
    }

    // FFT of decimated output to find dominant frequency
    // Use power-of-2 length for clean FFT
    const fftLen = 1024;
    const fftInput = decimated.slice(0, fftLen);
    const fftResult = dspFFT(fftInput, effectiveRate);
    const peak = peakFrequency(fftResult.frequencies, fftResult.magnitudes);

    // Peak should be near 100 Hz
    if (Math.abs(peak - 100) > 20) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
