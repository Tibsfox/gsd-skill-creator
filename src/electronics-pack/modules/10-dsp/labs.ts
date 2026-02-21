/**
 * Module 10: Digital Signal Processing -- Lab exercises
 *
 * 5 labs backed by real DSP engine simulation.
 * Each lab demonstrates a fundamental DSP concept with
 * hands-on signal processing and a verify() function that checks
 * expected values against DSP engine results.
 */

import {
  dspFFT,
  designFIRLowpass,
  designFIRHighpass,
  designFIRBandpass,
  applyFIR,
} from '../../simulator/dsp-engine';
import { applyWindow } from '../../simulator/instruments';

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
// Helper: generate a sine wave
// ============================================================================

function generateSine(
  freq: number,
  sampleRate: number,
  numSamples: number,
  amplitude: number = 1.0,
): number[] {
  const samples: number[] = [];
  for (let n = 0; n < numSamples; n++) {
    samples.push(amplitude * Math.sin((2 * Math.PI * freq * n) / sampleRate));
  }
  return samples;
}

// ============================================================================
// Helper: find the index of the peak magnitude in an FFT result
// ============================================================================

function findPeakIndex(magnitudes: number[], startBin: number = 1): number {
  let maxIdx = startBin;
  let maxVal = magnitudes[startBin];
  for (let i = startBin + 1; i < magnitudes.length; i++) {
    if (magnitudes[i] > maxVal) {
      maxVal = magnitudes[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}

// ============================================================================
// Helper: find local peaks in FFT magnitudes (above a threshold)
// ============================================================================

function findPeaks(
  frequencies: number[],
  magnitudes: number[],
  threshold: number,
): Array<{ frequency: number; magnitude: number }> {
  const peaks: Array<{ frequency: number; magnitude: number }> = [];
  for (let i = 1; i < magnitudes.length - 1; i++) {
    if (
      magnitudes[i] > threshold &&
      magnitudes[i] >= magnitudes[i - 1] &&
      magnitudes[i] >= magnitudes[i + 1]
    ) {
      peaks.push({ frequency: frequencies[i], magnitude: magnitudes[i] });
    }
  }
  return peaks;
}

// ============================================================================
// Lab 1: Moving Average Filter (m10-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm10-lab-01',
  title: 'Moving Average Filter',
  steps: [
    {
      instruction:
        'Generate a 200 Hz sine wave at 8000 Hz sample rate with 1024 samples. Add deterministic "noise" using sin(17*n) and sin(31*n) to simulate a noisy signal. This represents a typical real-world scenario: a clean signal buried in interference.',
      expected_observation:
        'The signal looks messy -- the 200 Hz sine is barely visible through the noise. An FFT shows a strong 200 Hz peak but also significant energy spread across higher frequencies.',
      learn_note:
        'Real signals always contain noise from various sources: thermal noise, power supply ripple, electromagnetic interference. The goal of filtering is to extract the signal of interest while suppressing the noise.',
    },
    {
      instruction:
        'Create a 16-point moving average filter: an array of 16 coefficients each equal to 1/16. Apply it to the noisy signal using applyFIR. This is the simplest possible digital filter.',
      expected_observation:
        'The output is visibly smoother. The moving average has averaged out the rapid noise fluctuations while preserving the slower 200 Hz oscillation.',
      learn_note:
        'A moving average is a lowpass filter -- it passes low frequencies and attenuates high frequencies. Each output sample is the average of the last 16 input samples. The more points you average, the smoother the output but the more you delay the signal.',
    },
    {
      instruction:
        'Run dspFFT on both the original noisy signal and the filtered signal. Compare the high-frequency energy (above 500 Hz) and verify the 200 Hz fundamental is preserved.',
      expected_observation:
        'The filtered signal has dramatically less energy above 500 Hz. The 200 Hz peak remains strong, confirming the filter passed the signal of interest and rejected the noise.',
      learn_note:
        'The moving average filter has a frequency response of sinc(f * N / fs). It has nulls at multiples of fs/N = 8000/16 = 500 Hz. This makes it excellent at removing harmonics of 500 Hz but less effective at arbitrary frequencies. For more precise frequency control, use a designed FIR filter. -- H&H 13.5',
    },
  ],
  verify: () => {
    const sampleRate = 8000;
    const numSamples = 1024;

    // Generate 200 Hz sine + deterministic noise
    const signal: number[] = [];
    for (let n = 0; n < numSamples; n++) {
      const clean = Math.sin((2 * Math.PI * 200 * n) / sampleRate);
      const noise = 0.3 * Math.sin((17 * n)) + 0.2 * Math.sin((31 * n));
      signal.push(clean + noise);
    }

    // 16-point moving average filter
    const maCoeffs = new Array(16).fill(1 / 16);
    const filtered = applyFIR(signal, maCoeffs);

    // FFT of original and filtered
    const origFFT = dspFFT(signal, sampleRate);
    const filtFFT = dspFFT(filtered, sampleRate);

    // Check 1: filtered signal has reduced high-frequency energy (above 500 Hz)
    let origHighEnergy = 0;
    let filtHighEnergy = 0;
    for (let i = 0; i < origFFT.frequencies.length; i++) {
      if (origFFT.frequencies[i] > 500) {
        origHighEnergy += origFFT.magnitudes[i] * origFFT.magnitudes[i];
        filtHighEnergy += filtFFT.magnitudes[i] * filtFFT.magnitudes[i];
      }
    }
    if (filtHighEnergy >= origHighEnergy) return false;

    // Check 2: 200 Hz peak still present in filtered signal
    // Find the bin closest to 200 Hz
    let peakIdx200 = 0;
    let minDist = Infinity;
    for (let i = 0; i < filtFFT.frequencies.length; i++) {
      const dist = Math.abs(filtFFT.frequencies[i] - 200);
      if (dist < minDist) {
        minDist = dist;
        peakIdx200 = i;
      }
    }
    // The 200 Hz bin should have significant magnitude
    if (filtFFT.magnitudes[peakIdx200] < 0.1) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: FIR Filter Designer (m10-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm10-lab-02',
  title: 'FIR Filter Designer',
  steps: [
    {
      instruction:
        'Use designFIRLowpass(500, 8000, 101) to create a lowpass filter with 500 Hz cutoff at 8000 Hz sample rate and 101 taps. Examine the resulting coefficient array.',
      expected_observation:
        'The coefficients form a symmetric sinc-like shape windowed by a Hamming window. There are 101 coefficients, with the largest value at the center tap (index 50). The coefficients are symmetric: h[n] = h[100-n].',
      learn_note:
        'The windowed-sinc method designs FIR filters by sampling the ideal filter impulse response (a sinc function) and applying a window to control the frequency-domain sidelobes. Symmetric coefficients guarantee linear phase -- all frequencies experience the same time delay. -- H&H 13.5',
    },
    {
      instruction:
        'Generate a test signal with two tones: 200 Hz and 2000 Hz, both at amplitude 1.0, sampled at 8000 Hz for 2048 samples. Apply the lowpass filter using applyFIR.',
      expected_observation:
        'The output signal looks like a pure 200 Hz sine. The 2000 Hz component has been almost completely removed by the filter.',
      learn_note:
        'FIR filtering is convolution in the time domain, which is multiplication in the frequency domain. The 500 Hz lowpass filter multiplies the 200 Hz component by approximately 1.0 (passband) and the 2000 Hz component by approximately 0.0 (stopband). -- H&H 13.5',
    },
    {
      instruction:
        'Run dspFFT on the filtered output. Verify the 200 Hz component is preserved (magnitude > 0.3) and the 2000 Hz component is attenuated (magnitude < 0.1). Also verify the coefficients sum to approximately 1.0.',
      expected_observation:
        'The 200 Hz peak is strong (near 1.0 magnitude). The 2000 Hz peak is nearly invisible (< 0.1). Coefficient sum is ~1.0, confirming unity DC gain.',
      learn_note:
        'A well-designed FIR lowpass filter has three key properties: (1) flat passband (signals below cutoff pass unchanged), (2) deep stopband (signals above cutoff are heavily attenuated), (3) coefficients summing to 1.0 (DC gain = unity). The number of taps controls the transition sharpness. -- H&H 13.5',
    },
  ],
  verify: () => {
    const sampleRate = 8000;
    const numSamples = 2048;

    // Design 500 Hz lowpass filter with 101 taps
    const coeffs = designFIRLowpass(500, sampleRate, 101);

    // Check coefficients are symmetric (linear phase)
    for (let i = 0; i < 50; i++) {
      if (!withinTolerance(coeffs[i], coeffs[100 - i], 0.001)) return false;
    }

    // Check coefficients sum to ~1.0
    const coeffSum = coeffs.reduce((s, c) => s + c, 0);
    if (!withinTolerance(coeffSum, 1.0, 0.01)) return false;

    // Generate 200 Hz + 2000 Hz test signal
    const signal: number[] = [];
    for (let n = 0; n < numSamples; n++) {
      signal.push(
        Math.sin((2 * Math.PI * 200 * n) / sampleRate) +
        Math.sin((2 * Math.PI * 2000 * n) / sampleRate),
      );
    }

    // Apply filter
    const filtered = applyFIR(signal, coeffs);

    // FFT of filtered signal
    const result = dspFFT(filtered, sampleRate);

    // Find magnitude at 200 Hz
    let mag200 = 0;
    let mag2000 = 0;
    for (let i = 0; i < result.frequencies.length; i++) {
      if (Math.abs(result.frequencies[i] - 200) < 10) {
        if (result.magnitudes[i] > mag200) mag200 = result.magnitudes[i];
      }
      if (Math.abs(result.frequencies[i] - 2000) < 10) {
        if (result.magnitudes[i] > mag2000) mag2000 = result.magnitudes[i];
      }
    }

    // 200 Hz should be present (> 0.3), 2000 Hz should be attenuated (< 0.1)
    if (mag200 < 0.3) return false;
    if (mag2000 >= 0.1) return false;

    return true;
  },
};

// ============================================================================
// Lab 3: FFT Spectrum Analyzer (m10-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm10-lab-03',
  title: 'FFT Spectrum Analyzer',
  steps: [
    {
      instruction:
        'Construct a "mystery" signal with three frequency components: 250 Hz at amplitude 1.0, 750 Hz at amplitude 0.5, and 1500 Hz at amplitude 0.25. Sample at 8000 Hz for 2048 samples.',
      expected_observation:
        'The time-domain signal looks complex -- you cannot easily see the individual frequencies by looking at the waveform. It appears as a complicated, repeating pattern.',
      learn_note:
        'When multiple frequencies are summed, the time-domain waveform becomes difficult to interpret visually. This is exactly why the FFT is so valuable: it decomposes the complex waveform back into its constituent frequencies. -- H&H 13.5',
    },
    {
      instruction:
        'Run dspFFT on the mystery signal. Examine the frequency and magnitude arrays to identify the spectral peaks.',
      expected_observation:
        'Three clear peaks appear: one near 250 Hz (magnitude ~1.0), one near 750 Hz (magnitude ~0.5), and one near 1500 Hz (magnitude ~0.25). The FFT has perfectly separated the three components.',
      learn_note:
        'The FFT frequency resolution is fs/N = 8000/2048 = 3.906 Hz. Each bin represents a 3.9 Hz frequency band. Since 250, 750, and 1500 are near integer multiples of the resolution, the peaks are clean and narrow. Non-integer multiples would cause spectral leakage. -- H&H 13.5',
    },
    {
      instruction:
        'Verify the peak frequencies are within 20 Hz of the expected values and the magnitudes follow the expected ratio: 250 Hz > 750 Hz > 1500 Hz.',
      expected_observation:
        'All three peaks are found within 4 Hz of their expected frequencies (due to the 3.9 Hz bin resolution). The magnitudes decrease in the expected order: 1.0, 0.5, 0.25.',
      learn_note:
        'The FFT is a powerful analysis tool that reveals both the frequencies present in a signal and their relative amplitudes. This is the basis of spectrum analyzers used in audio engineering, RF communications, vibration analysis, and medical diagnostics. -- H&H 13.5',
    },
  ],
  verify: () => {
    const sampleRate = 8000;
    const numSamples = 2048;

    // Generate mystery signal: 250 Hz (1.0) + 750 Hz (0.5) + 1500 Hz (0.25)
    const signal: number[] = [];
    for (let n = 0; n < numSamples; n++) {
      signal.push(
        1.0 * Math.sin((2 * Math.PI * 250 * n) / sampleRate) +
        0.5 * Math.sin((2 * Math.PI * 750 * n) / sampleRate) +
        0.25 * Math.sin((2 * Math.PI * 1500 * n) / sampleRate),
      );
    }

    // Run FFT
    const result = dspFFT(signal, sampleRate);

    // Find the three peaks (above threshold of 0.1)
    const peaks = findPeaks(result.frequencies, result.magnitudes, 0.1);

    // Need at least 3 peaks
    if (peaks.length < 3) return false;

    // Sort by magnitude descending
    peaks.sort((a, b) => b.magnitude - a.magnitude);

    // Top 3 peaks should be near 250, 750, 1500 Hz
    const expectedFreqs = [250, 750, 1500];
    const topPeaks = peaks.slice(0, 3);

    // Sort top peaks by frequency for matching
    topPeaks.sort((a, b) => a.frequency - b.frequency);

    for (let i = 0; i < 3; i++) {
      if (Math.abs(topPeaks[i].frequency - expectedFreqs[i]) > 20) return false;
    }

    // Check relative magnitudes: 250 Hz > 750 Hz > 1500 Hz
    // Re-sort by frequency to match expected order
    const mag250 = topPeaks[0].magnitude;
    const mag750 = topPeaks[1].magnitude;
    const mag1500 = topPeaks[2].magnitude;

    if (mag250 <= mag750) return false;
    if (mag750 <= mag1500) return false;

    return true;
  },
};

// ============================================================================
// Lab 4: Windowing Effects (m10-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm10-lab-04',
  title: 'Windowing Effects',
  steps: [
    {
      instruction:
        'Generate a 997 Hz sine wave at 8000 Hz sample rate with 256 samples. Note that 997 Hz is not an integer multiple of the frequency resolution (8000/256 = 31.25 Hz), so the signal does not complete an integer number of cycles in the window.',
      expected_observation:
        'The signal is cleanly sinusoidal but starts and ends at non-zero values. These abrupt edges are what cause spectral leakage in the FFT.',
      learn_note:
        'The FFT assumes the input repeats infinitely. When the signal does not complete an integer number of cycles, the implied repetition creates discontinuities at the boundaries. These discontinuities spread energy across many frequency bins -- this is spectral leakage. -- H&H 13.5',
    },
    {
      instruction:
        'Compute the FFT three ways: (1) with no window (rectangular), (2) with a Hanning window, (3) with a Hamming window. Use applyWindow from instruments.ts for the windowed versions.',
      expected_observation:
        'The rectangular FFT shows a broad peak with significant energy in many bins around 997 Hz. The Hanning FFT shows a narrower peak with much less energy in distant bins. The Hamming FFT is similar to Hanning with slightly different sidelobe levels.',
      learn_note:
        'Window functions taper the signal smoothly to zero at the edges, eliminating the discontinuity. The trade-off: the main peak becomes wider (poorer frequency resolution) but the sidelobes (leakage) are dramatically reduced. Different windows offer different trade-offs between mainlobe width and sidelobe suppression. -- H&H 13.5',
    },
    {
      instruction:
        'Count the number of bins above -30 dB relative to the peak for each window type. Compare the leakage spread.',
      expected_observation:
        'Rectangular window: many bins above -30 dB (significant leakage). Hanning and Hamming windows: fewer bins above -30 dB (reduced leakage). The windowed spectra are "cleaner."',
      learn_note:
        'Choosing the right window depends on your application. For general-purpose spectral analysis, Hanning is a safe default. For situations where you need very low sidelobes, use Blackman or Kaiser. When your signal completes integer cycles, rectangular (no window) is actually optimal -- it gives the narrowest mainlobe. -- H&H 13.5',
    },
  ],
  verify: () => {
    const sampleRate = 8000;
    const numSamples = 256;

    // Generate 997 Hz sine (non-integer cycles causes leakage)
    const signal = generateSine(997, sampleRate, numSamples, 1.0);

    // Rectangular (no window) FFT
    const rectFFT = dspFFT(signal, sampleRate);

    // Hanning window FFT
    const hanningSignal = applyWindow(signal, 'hanning');
    const hanningFFT = dspFFT(hanningSignal, sampleRate);

    // Hamming window FFT
    const hammingSignal = applyWindow(signal, 'hamming');
    const hammingFFT = dspFFT(hammingSignal, sampleRate);

    // Find peak magnitude for each
    const rectPeak = Math.max(...rectFFT.magnitudes);
    const hanningPeak = Math.max(...hanningFFT.magnitudes);
    const hammingPeak = Math.max(...hammingFFT.magnitudes);

    // Count bins above -30 dB relative to peak for each window
    // -30 dB = 10^(-30/20) = 0.0316... of peak magnitude
    const thresholdRatio = Math.pow(10, -30 / 20);

    let rectAbove = 0;
    let hanningAbove = 0;
    let hammingAbove = 0;

    const rectThreshold = rectPeak * thresholdRatio;
    const hanningThreshold = hanningPeak * thresholdRatio;
    const hammingThreshold = hammingPeak * thresholdRatio;

    for (let i = 0; i < rectFFT.magnitudes.length; i++) {
      if (rectFFT.magnitudes[i] > rectThreshold) rectAbove++;
    }
    for (let i = 0; i < hanningFFT.magnitudes.length; i++) {
      if (hanningFFT.magnitudes[i] > hanningThreshold) hanningAbove++;
    }
    for (let i = 0; i < hammingFFT.magnitudes.length; i++) {
      if (hammingFFT.magnitudes[i] > hammingThreshold) hammingAbove++;
    }

    // Rectangular should have more bins above threshold than Hanning/Hamming
    if (rectAbove <= hanningAbove) return false;
    if (rectAbove <= hammingAbove) return false;

    return true;
  },
};

// ============================================================================
// Lab 5: Real-Time Audio EQ (m10-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm10-lab-05',
  title: 'Real-Time Audio EQ',
  steps: [
    {
      instruction:
        'Generate a broadband signal with three frequency components: 100 Hz (bass), 1000 Hz (mid), and 3500 Hz (treble), each at amplitude 1.0, sampled at 8000 Hz for 2048 samples. This represents a simplified audio signal with energy in all three bands.',
      expected_observation:
        'The FFT shows three equal-amplitude peaks at 100, 1000, and 3500 Hz. The signal contains equal energy in bass, mid, and treble bands.',
      learn_note:
        'A graphic equalizer divides the audio spectrum into bands and applies independent gain to each. In the simplest form, three bands are used: bass (below ~300 Hz), mid (300-2500 Hz), and treble (above 2500 Hz). Professional EQs use 10 or 31 bands for finer control. -- H&H 13.5',
    },
    {
      instruction:
        'Design three FIR filters to extract each band: (1) lowpass at 300 Hz for bass, (2) bandpass 300-2500 Hz for mid, (3) highpass at 2500 Hz for treble. Use 101 taps at 8000 Hz sample rate. Apply each filter to the broadband signal.',
      expected_observation:
        'The bass filter output is a clean 100 Hz sine. The mid filter output is a clean 1000 Hz sine. The treble filter output is a clean 3500 Hz sine. Each filter has isolated its target frequency band.',
      learn_note:
        'FIR filters are ideal for EQ because of their linear phase response -- they do not distort the waveform shape, only adjust the amplitude. In a real equalizer, the filtered bands are scaled by the user-selected gain and summed back together. -- H&H 13.5',
    },
    {
      instruction:
        'Run dspFFT on each filtered band. Verify that the dominant peak in each band corresponds to the expected frequency: bass (100 Hz), mid (1000 Hz), treble (3500 Hz).',
      expected_observation:
        'Each filtered band shows its expected frequency as the clear dominant peak. Cross-band interference is minimal thanks to the 101-tap filter design providing sharp cutoffs.',
      learn_note:
        'Digital EQ has largely replaced analog tone controls in modern audio. The advantages are compelling: perfect channel matching, recall of settings, arbitrary frequency response curves, and no component drift. The cost is processing latency (filter delay = (N-1)/2 samples), which for 101 taps at 8 kHz is about 6.25 ms. -- H&H 13.5',
    },
  ],
  verify: () => {
    const sampleRate = 8000;
    const numSamples = 2048;
    const numTaps = 101;

    // Generate broadband signal: 100 + 1000 + 3500 Hz
    const signal: number[] = [];
    for (let n = 0; n < numSamples; n++) {
      signal.push(
        Math.sin((2 * Math.PI * 100 * n) / sampleRate) +
        Math.sin((2 * Math.PI * 1000 * n) / sampleRate) +
        Math.sin((2 * Math.PI * 3500 * n) / sampleRate),
      );
    }

    // Design 3 filters
    const lpCoeffs = designFIRLowpass(300, sampleRate, numTaps);
    const bpCoeffs = designFIRBandpass(300, 2500, sampleRate, numTaps);
    const hpCoeffs = designFIRHighpass(2500, sampleRate, numTaps);

    // Apply filters
    const bass = applyFIR(signal, lpCoeffs);
    const mid = applyFIR(signal, bpCoeffs);
    const treble = applyFIR(signal, hpCoeffs);

    // FFT each band
    const bassFFT = dspFFT(bass, sampleRate);
    const midFFT = dspFFT(mid, sampleRate);
    const trebleFFT = dspFFT(treble, sampleRate);

    // Find dominant peak in each band (skip DC bin at index 0)
    const bassPeakIdx = findPeakIndex(bassFFT.magnitudes, 1);
    const midPeakIdx = findPeakIndex(midFFT.magnitudes, 1);
    const treblePeakIdx = findPeakIndex(trebleFFT.magnitudes, 1);

    const bassPeakFreq = bassFFT.frequencies[bassPeakIdx];
    const midPeakFreq = midFFT.frequencies[midPeakIdx];
    const treblePeakFreq = trebleFFT.frequencies[treblePeakIdx];

    // Bass peak should be near 100 Hz
    if (Math.abs(bassPeakFreq - 100) > 20) return false;

    // Mid peak should be near 1000 Hz
    if (Math.abs(midPeakFreq - 1000) > 20) return false;

    // Treble peak should be near 3500 Hz
    if (Math.abs(treblePeakFreq - 3500) > 20) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
