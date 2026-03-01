/**
 * Module 9: Data Conversion -- Lab exercises
 *
 * 5 labs backed by the DSP engine (quantizeSignal, reconstructSignal, dspFFT).
 * These labs simulate ADC/DAC algorithms, aliasing, and sigma-delta concepts.
 * Unlike Modules 1-7 which use MNA circuit simulation, data conversion labs
 * are pure digital signal processing.
 */

import { quantizeSignal, reconstructSignal, dspFFT } from '../../simulator/dsp-engine.js';

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
// Lab 6: ENOB and Converter Specifications (m9-lab-06)
// ============================================================================

const lab06: Lab = {
  id: 'm9-lab-06',
  title: 'ENOB and Converter Specifications',
  steps: [
    {
      instruction:
        'Calculate the theoretical signal-to-noise ratio (SNR) for ideal N-bit converters using the formula SNR_q = 6.02*N + 1.76 dB. Compute for 8-bit, 12-bit, and 16-bit converters.',
      expected_observation:
        '8-bit: SNR = 49.92 dB. 12-bit: SNR = 74.00 dB. 16-bit: SNR = 98.08 dB. Each additional bit adds 6.02 dB of dynamic range, roughly doubling the signal-to-noise ratio.',
      learn_note:
        'The 6.02*N + 1.76 formula comes from the quantization noise power of a uniform quantizer. The 6.02 factor is 20*log10(2) -- each bit doubles the number of levels, halving the quantization step size. -- H&H Ch.13 [@HH-Ch.13]',
    },
    {
      instruction:
        'Calculate the Effective Number of Bits (ENOB) from the SNR: ENOB = (SNR - 1.76) / 6.02. For an ideal 12-bit converter with 74.0 dB SNR: ENOB = (74.0 - 1.76) / 6.02 = 12.0. For an ideal 8-bit: ENOB = (49.92 - 1.76) / 6.02 = 8.0.',
      expected_observation:
        'Ideal converters achieve ENOB exactly equal to their nominal bit count. This is the theoretical maximum -- real converters always have ENOB below the nominal resolution due to noise, distortion, and non-linearity.',
      learn_note:
        'ENOB is the industry-standard metric for converter quality. It captures all impairments (noise, harmonic distortion, non-linearity) in a single number. Datasheet ENOB is measured at specific frequencies and input levels. -- H&H Ch.13 [@HH-Ch.13]',
    },
    {
      instruction:
        'Model a real 12-bit converter with SINAD (signal-to-noise-and-distortion) of 68 dB instead of the ideal 74 dB. Calculate ENOB = (68 - 1.76) / 6.02 = 11.0 bits. The converter loses 1 full bit of effective resolution to noise and distortion.',
      expected_observation:
        'Real ENOB = 11.0, one bit below the nominal 12-bit resolution. This means the least significant bit is buried in noise -- the converter effectively gives only 11 bits of useful information.',
      learn_note:
        'Losing 1 bit of ENOB is common in practical systems. Layout noise, reference voltage noise, and clock jitter all degrade SINAD. Achieving ENOB within 1 bit of nominal requires careful PCB design, clean power supplies, and low-jitter clocks. -- H&H Ch.13 [@HH-Ch.13]',
    },
  ],
  verify: () => {
    // ENOB formula verification
    const enob = (snr: number) => (snr - 1.76) / 6.02;
    const snrIdeal = (bits: number) => 6.02 * bits + 1.76;

    // 12-bit ideal: SNR = 74.0 dB, ENOB = 12.0
    const snr12 = snrIdeal(12);
    if (!withinTolerance(snr12, 74.0, 0.001)) return false;
    const enob12 = enob(snr12);
    if (!withinTolerance(enob12, 12.0, 0.001)) return false;

    // 8-bit ideal: SNR = 49.92 dB, ENOB = 8.0
    const snr8 = snrIdeal(8);
    if (!withinTolerance(snr8, 49.92, 0.001)) return false;
    const enob8 = enob(snr8);
    if (!withinTolerance(enob8, 8.0, 0.001)) return false;

    // Real 12-bit converter with 68 dB SINAD: ENOB < 12
    const realSinad = 68;
    const realEnob = enob(realSinad);
    if (realEnob >= 12) return false; // Must be below nominal
    if (!withinTolerance(realEnob, 11.0, 0.01)) return false;

    return true;
  },
};

// ============================================================================
// Lab 7: Sample-and-Hold (m9-lab-07)
// ============================================================================

const lab07: Lab = {
  id: 'm9-lab-07',
  title: 'Sample-and-Hold',
  steps: [
    {
      instruction:
        'Model a sample-and-hold (S/H) circuit. During the "sample" phase, a switch connects the input to a hold capacitor. During "hold", the switch opens and the capacitor holds the voltage for the ADC to convert. The key parameter is droop: how much the voltage drops during the hold time due to leakage current.',
      expected_observation:
        'The hold capacitor voltage droops linearly: V_droop = I_leak * T_hold / C_hold. With a good design (large cap, low leakage, short hold), droop is negligible compared to the ADC\'s least significant bit.',
      learn_note:
        'Every ADC needs a sample-and-hold front end to freeze the input during conversion. Without it, the input could change during the conversion process, producing errors. Fast ADCs integrate the S/H on-chip. -- H&H Ch.13 [@HH-Ch.13]',
    },
    {
      instruction:
        'Good design: C_hold = 100pF, I_leak = 1nA, T_hold = 10us. V_droop = 1e-9 * 10e-6 / 100e-12 = 0.1mV. Compare to 1 LSB of a 12-bit 5V ADC: LSB = 5.0/4096 = 1.22mV. Droop is well below 1 LSB -- negligible. Poor design: C_hold = 1pF, I_leak = 10nA, T_hold = 1ms. V_droop = 10e-9 * 1e-3 / 1e-12 = 10V. Droop exceeds the entire full-scale range!',
      expected_observation:
        'Good design droop: 0.1mV (8% of 1 LSB for 12-bit @ 5V). Poor design droop: 10V (catastrophic -- more than full scale). The capacitor size and leakage current dominate S/H performance.',
      learn_note:
        'The hold capacitor faces a fundamental tradeoff: larger capacitance reduces droop but increases acquisition time (the time needed to charge it). In practice, 10pF to 100pF covers most SAR ADC designs. Very low-leakage JFET switches are preferred. -- H&H Ch.13 [@HH-Ch.13]',
    },
    {
      instruction:
        'Calculate the acquisition time for the good design: T_acq = -C_hold * R_on * ln(epsilon), where R_on = 100 ohm (switch resistance), epsilon = LSB/V_step = 1.22mV/5V = 2.44e-4. T_acq = -100e-12 * 100 * ln(2.44e-4) = 100e-12 * 100 * 8.32 = 83.2ns.',
      expected_observation:
        'Acquisition time is 83.2ns -- fast enough for most SAR ADCs running at 1 MSPS (1us per conversion). The S/H must fully settle within this time for the conversion to be accurate.',
      learn_note:
        'Aperture jitter -- random variation in the exact sampling instant -- adds an additional error source. For a sine wave at frequency f with aperture jitter dt: SNR_jitter = -20*log10(2*pi*f*dt). At 1MHz signal, 100ps jitter limits SNR to ~64 dB. -- H&H Ch.13 [@HH-Ch.13]',
    },
  ],
  verify: () => {
    // Good design: minimal droop
    const Chold_good = 100e-12;  // 100 pF
    const Ileak_good = 1e-9;     // 1 nA
    const Thold_good = 10e-6;    // 10 us
    const Vdroop_good = Ileak_good * Thold_good / Chold_good; // 0.1mV

    // 12-bit 5V reference: 1 LSB = 1.22 mV
    const vRef = 5.0;
    const bits = 12;
    const lsb = vRef / Math.pow(2, bits); // 1.22 mV

    // Good design droop must be less than 1 LSB
    if (Vdroop_good >= lsb) return false;

    // Poor design: catastrophic droop
    const Chold_poor = 1e-12;    // 1 pF
    const Ileak_poor = 10e-9;    // 10 nA
    const Thold_poor = 1e-3;     // 1 ms
    const Vdroop_poor = Ileak_poor * Thold_poor / Chold_poor; // 10V

    // Poor design droop must exceed full-scale range
    if (Vdroop_poor <= vRef) return false;

    // Acquisition time for good design
    const Ron = 100;          // 100 ohm switch resistance
    const epsilon = lsb / vRef;  // ~2.44e-4
    const Tacq = -Chold_good * Ron * Math.log(epsilon); // ~83.2 ns

    // Acquisition time should be reasonable (10ns to 1us range)
    if (Tacq < 10e-9 || Tacq > 1e-6) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05, lab06, lab07];
