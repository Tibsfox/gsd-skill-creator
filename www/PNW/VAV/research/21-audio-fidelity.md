# M16: Audio Fidelity: Capture, Restoration, and Archival

> **Module ID:** VAV-AUDIO
> **Domain:** Microphone Calibration, Signal Path Synchronization, Analog Media Restoration, Spectral Recovery
> **Through-line:** *Every recording is a sampling event. Every restoration is a reconstruction from incomplete data. Every archive is a backup with a degradation curve.* This module maps the complete audio fidelity pipeline — from microphone calibration through ADC conversion, real-time signal routing, analog media restoration, and spectral recovery of lost content — onto the Ceph/RADOS storage model that underpins the Voxel as Vessel architecture. The connection is not metaphor: a Wiener filter denoising an audio spectrogram performs the same operation as erasure-coded chunk recovery from RADOS replicas. Both reconstruct a missing region from surrounding context and redundant copies. The semaphore-gated ring buffer that feeds audio samples from hardware to DAW is the same producer-consumer pattern that feeds write operations from the Ceph client to the OSD journal. The sample rate decision that determines audio fidelity is the same resolution decision that determines voxel fidelity. Fidelity is fidelity. The math does not care whether the signal is sound pressure or block state.

---

## Table of Contents

1. [Microphone Calibration and Studio Setup](#1-microphone-calibration-and-studio-setup)
2. [Signal Path, Semaphores, and Gating](#2-signal-path-semaphores-and-gating)
3. [Restoring Records, Tapes, and CDs](#3-restoring-records-tapes-and-cds)
4. [Restoring Lost Content: Spectral Recovery](#4-restoring-lost-content-spectral-recovery)
5. [Minecraft/Ceph Isomorphism Mapping](#5-minecraftceph-isomorphism-mapping)
6. [Connection to Other Modules](#6-connection-to-other-modules)
7. [Sources](#7-sources)

---

## 1. Microphone Calibration and Studio Setup

### 1.1 Measurement-Grade Reference Microphones

Microphone calibration characterizes three properties of the transducer: frequency response (magnitude vs. frequency), self-noise floor (equivalent input noise in dBA), and polar pattern (sensitivity vs. angle of incidence). The goal is to establish a known transfer function between the acoustic field and the electrical signal so that all subsequent spectral analysis operates on calibrated data rather than colored data.

Measurement-grade microphones are designed for flat response across the audible band:

| Microphone | Type | Frequency Response | Self-Noise | Polar Pattern | Use Case |
|---|---|---|---|---|---|
| Earthworks M30 | Condenser (omnidirectional) | 5 Hz - 30 kHz, +/-1 dB | 22 dBA | Omni | Room measurement, calibration |
| DPA 4006 | Condenser (omnidirectional) | 10 Hz - 20 kHz, +/-0.5 dB | 15 dBA | Omni | Reference recording, measurement |
| Behringer ECM8000 | Condenser (omnidirectional) | 15 Hz - 20 kHz, +/-2 dB | 28 dBA | Omni | Budget measurement (requires individual calibration file) |

The +/-0.5 dB specification on the DPA 4006 means that across the entire 20-20,000 Hz band, the microphone's sensitivity deviates by no more than 0.5 dB from its rated value. This is the audio equivalent of a calibrated photometric sensor in imaging (M15) -- the transducer is a known quantity, so everything downstream can be trusted.

### 1.2 Consumer and Instrument Microphone Colorations

Consumer and instrument microphones are deliberately colored -- their frequency response is shaped to flatter the source or compensate for expected recording conditions. This coloration is a feature, not a defect, but it must be mapped before any spectral analysis is meaningful.

Common coloration profiles:

| Microphone Class | Typical Coloration | Frequency Range Affected | Purpose |
|---|---|---|---|
| Large-diaphragm vocal condenser (e.g., Neumann U87) | Presence peak +3 to +5 dB | 3-6 kHz | Vocal clarity, "air" |
| Dynamic instrument mic (e.g., Shure SM57) | Upper-mid emphasis +4 dB, rolled-off bass below 200 Hz | 2-8 kHz peak, <200 Hz rolloff | Cuts low-frequency stage bleed, emphasizes attack transients |
| Ribbon mic (e.g., Royer R-121) | Smooth high-frequency rolloff -3 dB/octave above 10 kHz | >10 kHz | Natural, vintage character; tames harsh sources |
| Shotgun mic (e.g., Sennheiser MKH 416) | Tight pickup pattern, off-axis coloration | Variable by angle | Dialogue isolation in noisy environments |
| Lavalier (e.g., Countryman B6) | Body resonance compensation curve | 700 Hz - 3 kHz | Compensates for chest-mount proximity to body cavity resonances |

**The calibration requirement:** Before performing spectral analysis on a recording made with a colored microphone, the transfer function of that microphone must be deconvolved from the signal. Without this step, a "presence peak" at 4 kHz in the recording could be misidentified as content when it is coloration. Calibration files (.cal) contain the measured deviation from flat at each frequency; applying the inverse curve restores the signal to what a flat reference mic would have captured.

### 1.3 Recording in Noisy Environments: SNR Strategies

Signal-to-noise ratio (SNR) is the fundamental quality metric for any capture system. In audio, SNR is measured in decibels as the ratio of desired signal power to noise power. Higher is better. The strategies for maximizing SNR in hostile acoustic environments parallel the strategies for maximizing data integrity in hostile network environments.

**Proximity effect (distance-based isolation):**
Cardioid and hypercardioid microphones exhibit a bass boost when the source is closer than approximately 30 cm. This is because the pressure-gradient component of the transducer responds more strongly to the near-field wavefront curvature at low frequencies. The effect provides isolation -- a close-miked source dominates over distant room noise -- but introduces low-frequency coloration that must be compensated with a high-pass filter (typically 80-120 Hz, 12 dB/octave). The tradeoff: proximity gives you isolation at the cost of spectral accuracy. A high-pass filter restores the spectrum but discards any genuine low-frequency content below the cutoff. For speech, 80 Hz is safe (fundamental frequency of an adult male voice is 85-180 Hz). For music, the cutoff must be chosen instrument by instrument.

**Directional rejection (polar pattern exploitation):**
Every microphone has a polar pattern defining its sensitivity as a function of angle. The null points -- angles of minimum sensitivity -- are the tool for rejecting unwanted sources.

| Polar Pattern | On-Axis (0 deg) | Side (90 deg) | Rear (180 deg) | Null Angle | Rejection at Null |
|---|---|---|---|---|---|
| Omnidirectional | 0 dB | 0 dB | 0 dB | None | No rejection |
| Cardioid | 0 dB | -6 dB | -25 dB | 180 deg | ~25 dB |
| Supercardioid | 0 dB | -9 dB | -12 dB | ~126 deg | ~30 dB |
| Hypercardioid | 0 dB | -12 dB | -6 dB | ~125 deg off-axis | ~30 dB |
| Figure-8 (bidirectional) | 0 dB | -infinity | 0 dB | 90 deg | Total null |

The figure-8 pattern's 90-degree null is the most powerful rejection tool available: a noise source positioned exactly 90 degrees off-axis is completely rejected. This is exploited in Mid-Side (M/S) recording, where a cardioid (Mid) and a figure-8 (Side) capture the sound field in a way that allows post-production width adjustment. It is also the basis of noise-cancellation techniques where the null is aimed at the dominant noise source.

**Acoustic treatment (environment control):**
When the microphone and its placement cannot sufficiently reject noise, the room itself must be treated. Acoustic treatment operates in three frequency bands:

- **Bass traps (20-300 Hz):** Porous absorbers or tuned membrane absorbers placed in room corners where low-frequency standing waves build up. Effective bass treatment requires absorber depth of at least 1/4 wavelength -- at 100 Hz, that is 0.86 meters (34 inches). This is why proper bass treatment is physically large. Inadequate bass trapping causes room modes that color recordings with resonant peaks and nulls at specific frequencies.

- **Broadband absorption panels (300 Hz - 8 kHz):** Rigid fiberglass or rockwool panels (2-4 inches thick) mounted at first reflection points -- the locations on walls and ceiling where sound from the source reflects directly to the microphone. These panels reduce early reflections that cause comb filtering (constructive/destructive interference at frequencies related to the path length difference between direct sound and reflection).

- **Diffusers (1 kHz - 20 kHz):** Quadratic Residue Diffusers (QRD) or primitive root diffusers scatter high-frequency reflections across a wide angle rather than absorbing them. This preserves the sense of "life" in the room -- pure absorption makes a room sound dead and unnatural. The balance between absorption and diffusion defines the room's acoustic character.

**Noise floor targets:**

| Application | Required SNR | Noise Floor Target | Notes |
|---|---|---|---|
| Broadcast (dialogue) | > 60 dB | < -60 dBFS | FCC/EBU standards; room tone audible below this |
| Studio recording (music) | > 80 dB | < -80 dBFS | Professional studio standard |
| Archival capture (restoration source) | > 70 dB | < -70 dBFS | Source medium noise often exceeds this |
| Field recording (nature) | > 50 dB | < -50 dBFS | Ambient noise is the signal; self-noise is the enemy |
| Podcast / streaming | > 55 dB | < -55 dBFS | Acceptable for compressed delivery |

### 1.4 Dynamic Range and Clipping

The analog-to-digital converter (ADC) has a fixed dynamic range determined by its bit depth: a 16-bit ADC provides 96 dB of dynamic range (6.02 dB per bit); a 24-bit ADC provides 144 dB. The critical constraint is that the ADC clips -- produces maximum-value samples with total harmonic distortion -- when the input signal exceeds 0 dBFS (decibels relative to full scale). Digital clipping is not graceful; it produces harsh, inharmonic distortion that cannot be repaired.

**Recording level best practice:**

```
Target peak level:    -18 dBFS (nominal operating level)
Maximum peak level:   -6 dBFS (absolute ceiling for transients)
Headroom:             6-18 dB above program material
Clipping threshold:   0 dBFS (NEVER exceed)
```

The -18 dBFS target aligns with the EBU R128 loudness standard and the SMPTE RP-155 alignment level. Recording at -18 dBFS with a 24-bit ADC gives 126 dB of usable dynamic range below the peak -- more than sufficient for any acoustic source. The common amateur mistake of "recording hot" (targeting -3 to 0 dBFS) sacrifices headroom for no benefit: the noise floor of a 24-bit system at -18 dBFS is already below the thermal noise of any microphone preamplifier.

This is directly analogous to the Ceph OSD journal sizing decision: the journal must have sufficient headroom to absorb write bursts without stalling the pipeline. Recording at -18 dBFS is leaving headroom in the journal. Clipping the ADC is overflowing the journal -- data is destroyed, and no amount of post-processing can recover it.

---

## 2. Signal Path, Semaphores, and Gating

### 2.1 Hardware Signal Path: ADC to Ring Buffer

The hardware signal path converts continuous analog voltage from the microphone preamplifier into discrete PCM (Pulse-Code Modulation) samples stored in RAM. This is the audio system's ingest pipeline -- the point where continuous reality becomes discrete data.

**ADC conversion process:**

1. **Anti-aliasing filter:** An analog low-pass filter (typically a multi-pole Butterworth or elliptic filter) attenuates all frequency content above the Nyquist frequency (half the sample rate) before digitization. Without this filter, frequencies above Nyquist alias into the audible band -- a 25 kHz tone sampled at 44.1 kHz appears as a 19.1 kHz artifact. This is the same aliasing that M14 describes for temporal imaging: the Nyquist theorem is carrier-agnostic.

2. **Sample-and-hold:** The analog voltage is sampled at precise intervals determined by the master clock. Clock jitter (timing uncertainty) introduces noise proportional to the signal frequency and the jitter magnitude. At 192 kHz sample rate and 1 picosecond jitter, the jitter-induced SNR limit is approximately 130 dB -- sufficient for 24-bit operation.

3. **Quantization:** Each sample is quantized to the nearest integer value in the bit-depth range. Quantization error is uniformly distributed between -0.5 LSB and +0.5 LSB, producing a noise floor at -6.02N dB (where N is bit depth). Dithering -- adding low-level noise before quantization -- linearizes the quantization error and eliminates harmonic distortion at the cost of a slightly higher but spectrally benign noise floor.

**Standard sample rates and their Nyquist frequencies:**

| Sample Rate | Nyquist Frequency | Primary Use | Bit Depth | Dynamic Range |
|---|---|---|---|---|
| 44,100 Hz | 22,050 Hz | CD audio (Red Book) | 16-bit | 96 dB |
| 48,000 Hz | 24,000 Hz | Professional video/broadcast | 24-bit | 144 dB |
| 88,200 Hz | 44,100 Hz | High-resolution audio (2x CD) | 24-bit | 144 dB |
| 96,000 Hz | 48,000 Hz | High-resolution audio / archival | 24-bit | 144 dB |
| 176,400 Hz | 88,200 Hz | Ultra-high-resolution (4x CD) | 24-bit | 144 dB |
| 192,000 Hz | 96,000 Hz | Ultra-high-resolution / mastering | 24-bit | 144 dB |

4. **DMA transfer:** The digitized samples are transferred from the ADC's output register to a ring buffer in system RAM via Direct Memory Access (DMA). The DMA controller operates independently of the CPU, moving samples at the ADC clock rate without requiring CPU intervention for each sample. The CPU is notified via interrupt when a buffer segment is full.

5. **Ring buffer:** The ring buffer is a circular queue of fixed size, measured in samples (or frames, where one frame = one sample per channel). Buffer size determines latency:

| Buffer Size (samples) | Latency at 48 kHz | Latency at 96 kHz | CPU Load | Underrun Risk |
|---|---|---|---|---|
| 32 | 0.67 ms | 0.33 ms | Very high | Very high |
| 64 | 1.33 ms | 0.67 ms | High | High |
| 128 | 2.67 ms | 1.33 ms | Moderate | Moderate |
| 256 | 5.33 ms | 2.67 ms | Low | Low |
| 512 | 10.67 ms | 5.33 ms | Very low | Very low |
| 1024 | 21.33 ms | 10.67 ms | Minimal | Minimal |
| 4096 | 85.33 ms | 42.67 ms | Negligible | Negligible |

The buffer size decision is a latency-throughput tradeoff identical to the Ceph OSD journal buffer sizing: smaller buffers give lower latency but higher CPU overhead and greater risk of underrun (the consumer thread consumes samples faster than the producer thread fills them, causing audio dropout -- silence or clicks). Larger buffers absorb scheduling jitter but add latency.

### 2.2 Software Signal Path: Semaphores, Mutexes, and Lock-Free Buffers

The software layer routes audio data from the ring buffer through DSP processing chains (equalization, compression, reverb, effects) to the output device. This involves multiple threads sharing access to the same memory, requiring synchronization primitives.

**Semaphore (counting synchronization primitive):**
A semaphore is an integer counter with two atomic operations: `sem_post()` (increment, signal that a resource is available) and `sem_wait()` (decrement, block if counter is zero). In the audio pipeline:

```
Producer (ADC/DMA interrupt handler):
  1. Write samples to ring buffer segment N
  2. sem_post(&buffer_ready)    // Signal: segment N is full

Consumer (DSP processing thread):
  1. sem_wait(&buffer_ready)    // Block until a segment is available
  2. Read samples from ring buffer segment N
  3. Process (EQ, compression, effects)
  4. Write processed samples to output ring buffer
  5. sem_post(&output_ready)    // Signal: processed segment ready
```

The semaphore decouples the producer's rate (locked to the ADC clock) from the consumer's rate (determined by DSP processing time). If the consumer is briefly delayed by a scheduling hiccup, the semaphore's count accumulates, and the consumer processes the backlog when it resumes. This is precisely the Ceph OSD's write-ahead journal pattern: the OSD journal accumulates writes (producer) that the filestore/bluestore backend processes asynchronously (consumer), with the journal depth acting as the semaphore count.

**Mutex (mutual exclusion):**
A mutex protects a shared data structure from concurrent access. In audio, the shared structure is typically the buffer metadata (head pointer, tail pointer, segment state flags):

```
Thread A (DSP):                    Thread B (I/O):
  pthread_mutex_lock(&buf_meta)      pthread_mutex_lock(&buf_meta)
  // read head/tail pointers         // update tail pointer
  // compute available samples       // mark segment as filled
  pthread_mutex_unlock(&buf_meta)    pthread_mutex_unlock(&buf_meta)
```

Mutexes introduce potential priority inversion: a low-priority thread holding the mutex blocks a high-priority real-time audio thread. Priority inheritance (the low-priority thread temporarily inherits the high-priority thread's priority while holding the mutex) mitigates this, but at the cost of complexity.

**Lock-free ring buffer (atomic operations):**
The preferred solution for real-time audio is a lock-free Single-Producer, Single-Consumer (SPSC) ring buffer using atomic compare-and-swap (CAS) operations on the head and tail pointers. No mutex, no semaphore, no blocking. The producer atomically advances the tail; the consumer atomically advances the head. If the consumer catches up to the tail, the buffer is empty (underrun). If the producer catches up to the head, the buffer is full (overrun -- samples are dropped).

JACK Audio Connection Kit uses this pattern. JACK is a zero-copy real-time audio server that connects applications via POSIX shared memory segments. Each client reads from and writes to shared memory ring buffers without kernel involvement. The JACK server runs at `SCHED_FIFO` real-time priority with priority inheritance, ensuring that audio processing threads are never preempted by non-real-time tasks.

```
JACK architecture:

  Application A (synthesizer)
       |
       v
  [shared memory ring buffer A->B, lock-free SPSC]
       |
       v
  Application B (effects processor)
       |
       v
  [shared memory ring buffer B->output, lock-free SPSC]
       |
       v
  JACK server (SCHED_FIFO, priority-inherited)
       |
       v
  ALSA driver -> hardware DAC -> speakers
```

The entire JACK pipeline from application output to hardware DAC operates without a single memory copy or kernel transition in the fast path. This is the audio equivalent of Ceph's RDMA-based OSD communication (M17): zero-copy, kernel-bypass, priority-scheduled data movement.

### 2.3 Signal Processing Gate (Amplitude Gate)

A gate in signal processing is not a synchronization primitive -- it is an amplitude-threshold processor. The gate monitors the input signal level and passes the signal unchanged when the level exceeds a threshold; when the level drops below the threshold, the gate attenuates the signal to silence (or near-silence). The purpose is to remove room noise, hiss, and ambient sound during pauses between intentional sound events.

**Gate parameters:**

| Parameter | Description | Typical Range | Effect |
|---|---|---|---|
| Threshold | Level above which the gate opens | -60 to -20 dBFS | Sets the boundary between "signal" and "noise" |
| Attack | Time for gate to open after signal exceeds threshold | 0.1 - 10 ms | Fast attack preserves transients; slow attack softens onset |
| Hold | Minimum time the gate stays open after signal drops below threshold | 10 - 500 ms | Prevents gate chatter on decaying signals |
| Release | Time for gate to close after hold period | 10 - 1000 ms | Fast release cuts noise quickly; slow release fades naturally |
| Range | Maximum attenuation when gate is closed | -inf to -20 dB | -inf = complete silence; -20 dB = gentle noise reduction |
| Sidechain filter | Frequency range that triggers the gate | 100 Hz - 10 kHz | HPF on sidechain prevents bass rumble from opening gate |

The gate is a binary classifier applied to a continuous signal: above threshold = signal (pass), below threshold = noise (attenuate). This maps directly to the Ceph scrubbing operation, where the OSD reads objects and compares checksums: matching checksum = valid (keep), mismatching checksum = corrupt (repair from replica). Both are threshold-based pass/fail decisions applied to a continuous data stream.

---

## 3. Restoring Records, Tapes, and CDs

### 3.1 Source-Specific Degradation Profiles

Every recording medium degrades in a characteristic way determined by its physical substrate. Understanding the degradation mode is prerequisite to choosing the restoration approach -- you cannot fix what you have not diagnosed. This is the audio equivalent of M13's failure mode analysis for storage media: every medium has a failure signature, and the recovery strategy must match the failure.

| Medium | Era | Substrate | Degradation Mode | Typical SNR (degraded) | Restoration Approach |
|---|---|---|---|---|---|
| 78 rpm shellac | 1898-1960s | Shellac compound with mineral filler | Surface noise (continuous), groove wear (high-frequency loss), shellac decomposition (chemical breakdown, increased brittleness) | 25-35 dB | Optical scanning (IRENE system); spectral denoising with broadband noise print |
| Vinyl LP | 1948-present | PVC (polyvinyl chloride) | Clicks/pops (surface scratches and debris), crackle (static charge), hiss (stylus friction against groove wall) | 55-65 dB (clean pressing); 35-50 dB (worn) | Declicker (impulse detection + interpolation), decrackler (statistical modeling), Wiener filter denoising |
| Magnetic tape (reel-to-reel) | 1940s-present | Polyester base with iron oxide or chromium dioxide coating | Dropout (oxide flaking from binder degradation), print-through (magnetic imprint from adjacent layers), tape hiss (inherent to oxide particles), wow/flutter (speed variation from transport mechanics) | 55-70 dB (professional); 40-55 dB (consumer) | Baking (120-130 deg F for 8-24 hours to temporarily rebind oxide -- "sticky shed syndrome" treatment), pitch correction, spectral repair of dropouts |
| Cassette | 1963-present | Same as reel-to-reel but narrower track width (0.6 mm vs. 2.5 mm for 1/4" stereo) | Azimuth misalignment (head angle vs. recorded track), dropouts, hiss (worse than reel-to-reel due to narrow track and slow speed) | 40-55 dB (Type IV/metal); 30-45 dB (Type I/normal) | Azimuth adjustment at playback (adjust head angle to maximize high-frequency response), noise reduction decode (Dolby B/C/S, dbx Type II) |
| CD / DAT | 1982-present (CD), 1987-2005 (DAT) | Polycarbonate with aluminum/gold reflective layer + lacquer coating | Laser rot (oxidation of reflective layer through lacquer defects), scratched pits (read errors), buffer underruns (real-time extraction failures) | >90 dB (undamaged); variable when damaged | C1/C2 error rate analysis (C1 = correctable by CIRC inner code; C2 = correctable by outer code; CU = uncorrectable); re-rip with secure mode (AccurateRip verification); interpolation for uncorrectable samples |
| Optical film (soundtrack) | 1927-present | Cellulose acetate or polyester with silver halide or dye image | Shrinkage (acetate base loses plasticizer over decades -- "vinegar syndrome"), perforation damage (mechanical wear from projector transport), color dye fading (cyan/magenta/yellow dye layers fade at different rates) | 35-55 dB (optical variable area); 30-45 dB (optical variable density) | Wet gate scanning (immersion in perchloroethylene fills surface scratches optically); per-channel color re-registration (correct for differential shrinkage between channels); AI restoration (DeOldify for visual, Topaz Video AI for frame interpolation) |

### 3.2 Vinyl Restoration Detail

Vinyl records encode audio as a continuous modulated groove spiral in PVC. The stylus (needle) tracks this groove, converting mechanical displacement into electrical signal via a piezoelectric or electromagnetic transducer. The degradation modes are mechanical:

**Click detection and removal:**
A click is a short-duration, high-amplitude transient caused by the stylus encountering a surface imperfection (scratch, dust particle, static discharge). Clicks are typically 0.5-5 ms in duration and 10-30 dB above the surrounding signal level. They are spectrally broadband -- energy across the entire frequency range -- which distinguishes them from musical transients that have characteristic spectral shapes.

Detection algorithm:
1. High-pass filter the signal (cutoff 1-5 kHz) to suppress low-frequency musical content
2. Compute the local RMS level in a sliding window (10-50 ms)
3. Flag samples where the instantaneous amplitude exceeds the local RMS by a threshold (typically 3-sigma, i.e., 3 standard deviations above the local mean)
4. Validate: true clicks have duration < 5 ms and broadband spectral content; musical transients have duration > 5 ms or band-limited spectral content

Repair:
- **Cubic interpolation:** Replace the flagged samples with values interpolated from the surrounding unflagged samples using a cubic polynomial. Works well for clicks shorter than 2 ms. Artifacts appear for longer clicks.
- **Spectral synthesis:** For clicks 2-10 ms, the damaged region is replaced with spectral content synthesized from the FFT of the surrounding undamaged frames. The phase is extrapolated from adjacent frames; the magnitude is interpolated.

**Crackle removal:**
Crackle is a dense series of micro-clicks caused by static charge between the stylus and the groove wall. Individual crackle events are 50-500 microseconds duration -- too short and too dense for click detection. Statistical modeling (autoregressive prediction) identifies crackle as deviation from the expected sample sequence and attenuates it without affecting the underlying signal.

### 3.3 Magnetic Tape Degradation and Recovery

Magnetic tape stores audio as patterns of magnetized oxide particles bonded to a polyester base with a chemical binder (typically polyester-polyurethane). The binder absorbs moisture over decades, becoming tacky and shedding oxide when played -- "sticky shed syndrome." The tape literally sticks to the heads and guides, causing severe dropout and transport failure.

**Baking protocol (sticky shed treatment):**
1. Remove the tape from its box and inspect for visible shedding (brown residue on fingers)
2. Place in a convection oven (not microwave) at 120-130 degrees F (49-54 degrees C)
3. Bake for 8-24 hours depending on tape type and severity
4. Allow to cool to room temperature (2-4 hours)
5. Play immediately -- the baking temporarily rebinds the oxide, but the effect is reversible. The tape has a window of days to weeks before the shed returns.
6. Digitize in a single pass at the highest practical sample rate

This is a temporary recovery procedure, not a repair. The tape will re-degrade. The digitization must happen during the window of temporary stability. This mirrors the Ceph "degraded mode" operation: when an OSD fails and data is in degraded state (fewer replicas than target), the cluster has a window to recover before a second failure causes data loss. The baking is bringing the medium temporarily above the recovery threshold.

**Print-through:**
When tape is stored on a reel, the magnetic field from one layer bleeds through to adjacent layers. This produces faint pre-echoes (audible before the main sound event) and post-echoes (audible after). The echo level is typically 40-55 dB below the primary signal. Tails-out storage (rewinding so the tape is stored with the end of the program on the outside of the reel) converts pre-echoes to post-echoes, which are perceptually less objectionable because they are masked by the preceding loud event.

**Wow and flutter:**
Wow is slow speed variation (< 4 Hz); flutter is fast speed variation (4-100 Hz). Both are caused by imperfect tape transport mechanics -- bearing wear, capstan eccentricity, uneven tension. The pitch deviation is typically 0.1-0.5% for professional decks and 0.3-2% for consumer cassette decks.

Correction:
1. If a reference tone is present (calibration tone at the head of the tape, typically 1 kHz or 440 Hz), measure the instantaneous frequency deviation over time
2. If no reference tone, use auto-correlation of the spectral centroid to detect pitch drift
3. Apply dynamic time warping: stretch or compress short segments of audio to correct the pitch deviation without altering the overall duration

### 3.4 CD Error Correction and Re-Ripping

CD audio uses Cross-Interleaved Reed-Solomon Coding (CIRC) with two levels of error correction:

```
CD error correction hierarchy:

  C1 (inner code): RS(32,28) over GF(2^8)
     - Corrects up to 2 erroneous symbols per frame (24 bytes of audio = 6 stereo samples)
     - C1 error rate < 220/second: normal operation

  C2 (outer code): RS(28,24) over GF(2^8)
     - Corrects up to 2 erroneous symbols after deinterleaving
     - C2 error rate < 10/second: acceptable
     - C2 error rate > 10/second: disc degradation warning

  CU (uncorrectable):
     - When both C1 and C2 fail, the sample is uncorrectable
     - Player interpolates (averages surrounding samples) or mutes
     - CU > 0: disc needs immediate re-ripping or replacement
```

**Secure ripping (AccurateRip / dbpoweramp / EAC):**
Secure rippers read each sector multiple times, comparing results. If reads disagree, the ripper retries with different read offsets, drive speeds, and error correction settings. AccurateRip compares the ripped data against a database of checksums from other users' rips of the same pressing -- if the checksums match, the rip is bit-perfect. This is exactly the Ceph scrubbing model: read, compare against redundant copy (AccurateRip database = replica), flag discrepancies, retry or interpolate.

---

## 4. Restoring Lost Content: Spectral Recovery

### 4.1 The Spectral Restoration Pipeline

Spectral restoration operates in the frequency domain via the Short-Time Fourier Transform (STFT). The signal is divided into overlapping frames (windows), each frame is FFT-transformed to the frequency domain, processing is applied per-frequency-bin, and the result is inverse-FFT-transformed back to the time domain with overlap-add reconstruction. This is the same FFT framework that M14 describes for spatial frequency analysis of images -- the only difference is the domain (time vs. space) and the dimensionality (1D vs. 2D).

**Complete pipeline (7 steps):**

**Step 1: Digitization at Source-Appropriate Sample Rate**

The digitization sample rate must capture the full bandwidth of the source medium, including noise that will be characterized and removed:

| Source Medium | Recommended Sample Rate | Bit Depth | Rationale |
|---|---|---|---|
| 78 rpm shellac | 96 kHz / 24-bit | 24-bit | Captures up to 48 kHz; stylus noise extends to 8-15 kHz; ultrasonic groove modulation extends further |
| Vinyl LP | 96 kHz / 24-bit | 24-bit | RIAA pre-emphasis boosts high frequencies at cutting; full capture preserves the pre-emphasis curve |
| Reel-to-reel tape (15 ips) | 96 kHz / 24-bit | 24-bit | Professional tape bandwidth extends to 22-25 kHz at 15 ips |
| Reel-to-reel tape (7.5 ips) | 48 kHz / 24-bit | 24-bit | Bandwidth ~15 kHz at 7.5 ips |
| Cassette | 48 kHz / 24-bit | 24-bit | Bandwidth 12-15 kHz (Type IV metal); 44.1/16 minimum acceptable |
| CD (re-rip) | 44,100 Hz / 16-bit | 16-bit | Source is already digital at this specification; higher rates add nothing |

**Step 2: Noise Print Capture**

A noise print is a spectral average of a noise-only section of the recording -- leader tape, runout groove, inter-track silence. This section contains only the medium's characteristic noise signature without any desired signal content.

```
Noise print acquisition:
  1. Identify noise-only region (>500 ms recommended for statistical stability)
  2. Window into overlapping frames:
     - FFT size: 2048-8192 samples
       (2048 at 96 kHz = 21.3 ms frame, 46.9 Hz frequency resolution)
       (8192 at 96 kHz = 85.3 ms frame, 11.7 Hz frequency resolution)
     - Larger FFT = finer frequency resolution, more processing latency
     - Overlap: 50-75% (Hann window)
  3. Compute |X(f)|^2 for each frame (power spectrum)
  4. Average across all frames -> noise power spectrum |N(f)|^2
  5. This averaged spectrum is the noise threshold curve
```

The noise print captures the spectral shape of the noise floor. Shellac records have high-frequency-dominant noise (rising with frequency due to stylus friction). Tape has broadband hiss with slight high-frequency emphasis. Each medium's noise signature is as distinctive as a fingerprint.

**Step 3: Spectral Subtraction (Wiener Filter)**

The Wiener filter is the minimum mean-square-error estimator for a signal corrupted by additive noise. Given the noisy signal X(f) and the noise estimate N(f), the filter computes:

```
Wiener filter transfer function:

  H(f) = max(0, 1 - lambda * |N(f)|^2 / |X(f)|^2)

Where:
  X(f) = FFT of noisy signal frame
  N(f) = noise print (averaged noise spectrum)
  lambda = over-subtraction factor (1.0 to 3.0)
  H(f) = gain applied to each frequency bin

Output: Y(f) = H(f) * X(f)

Lambda controls the aggressiveness:
  lambda = 1.0: minimal subtraction, some residual noise remains
  lambda = 1.5: moderate subtraction, good balance
  lambda = 2.0: aggressive subtraction, audible "musical noise" artifacts begin
  lambda = 3.0: very aggressive, significant artifacts, suitable only for
                 severely degraded sources where artifact < noise
```

The "musical noise" artifact (also called "birdies" or "twinkling") occurs because the noise estimate is an average -- individual frames have random spectral fluctuations above and below the average. When the filter subtracts too aggressively, isolated frequency bins that happened to have below-average noise in a particular frame are reduced to zero, creating brief spectral gaps that the ear perceives as tonal artifacts. Modern implementations (iZotope RX 6+) use machine learning to estimate the noise spectrum adaptively per-frame rather than using a static noise print, significantly reducing musical noise artifacts.

**Step 4: Click/Pop Removal**

```
Click detection algorithm:

  1. Apply high-pass filter (cutoff 1-5 kHz, 4th order Butterworth)
     -> Suppresses musical content, exposes impulsive transients
  2. Compute sliding-window RMS (window = 20-50 ms)
  3. Compute sliding-window standard deviation (sigma)
  4. Flag samples where |x[n]| > mean + 3*sigma
     -> 3-sigma threshold: 99.7% of Gaussian-distributed samples fall below
     -> A click exceeds this by definition (impulsive, non-Gaussian)
  5. Validate flagged regions:
     - Duration < 5 ms -> likely click
     - Duration 5-50 ms -> check spectral content (broadband = click; tonal = music)
     - Duration > 50 ms -> not a click (dropout or other artifact)
  6. Repair:
     - Short click (< 2 ms): cubic spline interpolation from surrounding samples
     - Long click (2-10 ms): spectral synthesis from adjacent frames
       (reconstruct magnitude from frame N-1 and N+1; extrapolate phase)
```

**Step 5: Declicker (Vinyl-Specific)**

The declicker is a refinement of click removal optimized for vinyl's characteristic damage patterns. It uses polynomial prediction (autoregressive modeling) rather than simple amplitude thresholding:

1. Fit an AR (autoregressive) model of order 20-50 to a short window of samples
2. Use the model to predict the next sample
3. Compute prediction error = |actual - predicted|
4. Flag samples where prediction error > 6 dB above the local prediction error average
5. Flagged regions of 2-5 ms duration are classified as clicks
6. Replace with the AR model's predicted values (which represent the underlying music without the click)

The AR model is more robust than simple amplitude thresholding because it accounts for the local spectral context -- a loud cymbal crash has high amplitude but low prediction error (the AR model expects it), while a click has high amplitude AND high prediction error (the AR model does not predict it).

**Step 6: Wow/Flutter Correction (Tape-Specific)**

```
Wow/flutter correction pipeline:

  1. Detect pitch reference:
     a. If calibration tone present (1 kHz / 440 Hz at tape head):
        - Track instantaneous frequency via zero-crossing or phase-locked loop
        - Deviation from reference = speed error curve
     b. If no reference tone:
        - Compute spectral centroid per frame (weighted average frequency)
        - Auto-correlate centroid time series to find periodic drift pattern
        - Model drift as sum of sinusoids (wow = <4 Hz, flutter = 4-100 Hz)
  2. Construct time-varying resampling function:
     - Speed error e(t) -> resampling ratio r(t) = 1 / (1 + e(t))
  3. Apply dynamic time warping:
     - Resample each short segment (10-50 ms) by ratio r(t)
     - Overlap-add with crossfade to avoid discontinuities
  4. Verify: measure residual pitch variation; iterate if > 0.05% remains
```

**Step 7: Output Deliverables**

```
Master output:
  Format:  BWF (Broadcast Wave Format) -- WAV with BEXT metadata chunk
  Sample rate: Source capture rate (96 kHz for analog sources)
  Bit depth: 24-bit
  Metadata (BEXT chunk):
    - Originator: "Restoration Lab"
    - OriginatorReference: unique ID linking to session notes
    - OriginationDate / OriginationTime
    - TimeReference: sample-accurate start time
    - CodingHistory: full chain (e.g., "A=ANALOGUE,M=stereo,T=Studer A810;
                      A=PCM,F=96000,W=24,M=stereo,T=Prism Sound Lyra 2")
    - UMID: SMPTE Unique Material Identifier

Delivery output:
  Format: WAV or FLAC
  Sample rate: 44,100 Hz or 48,000 Hz (downsampled from master)
  Bit depth: 16-bit (with TPDF dither for bit-depth reduction)
  Loudness: normalized to -23 LUFS (EBU R128) or -16 LUFS (streaming)
```

### 4.2 Modern Restoration Tools

**iZotope RX (versions 1-11):**
The industry-standard audio restoration suite. Key modules:

| Module | Function | Algorithm | First Appeared |
|---|---|---|---|
| Spectral De-noise | Broadband noise reduction | Wiener filter (RX 1-5); ML adaptive (RX 6+) | RX 1 (2007) |
| De-click | Click/pop removal | AR prediction + interpolation | RX 1 |
| De-crackle | Dense micro-click removal | Statistical modeling | RX 2 |
| De-clip | Clipping repair | Spectral synthesis of clipped peaks | RX 2 |
| De-hum | Power line hum removal (50/60 Hz + harmonics) | Adaptive notch filter bank | RX 1 |
| Spectral Repair | Fill holes in spectrogram | Context-aware interpolation | RX 3 |
| Music Rebalance | Separate voice/bass/percussion/other | ML source separation (Open-Unmix derivative) | RX 7 |
| Spectral Recovery | Reconstruct bandwidth above 4 kHz | ML conditional generation | RX 8 (2020) |
| Repair Assistant | Automated analysis + suggested processing chain | ML classification of degradation types | RX 9 |

**Acon Digital Restoration Suite:**
Budget alternative to iZotope RX. Four modules: DeNoise (spectral subtraction), DeClick, DeHum, DeClip. Effective for straightforward restoration tasks at a fraction of the cost. Uses classical DSP algorithms without ML components.

**Sonic Solutions NoNoise (1987):**
The pioneer of spectral-domain audio restoration. Developed at Sonic Solutions (founded by Bob Doris and Mary Sauer, San Francisco, 1986) for mastering engineers working on CD reissues of analog catalog recordings. NoNoise introduced the concept of the "noise print" -- sampling a noise-only section and subtracting its spectral profile from the entire recording. This technique, now ubiquitous, was revolutionary in 1987 when the standard approach was broadband filtering that destroyed musical content along with the noise.

### 4.3 IRENE: Non-Contact Optical Playback

The IRENE (Image, Reconstruct, Erase Noise, Etc.) system was developed at Lawrence Berkeley National Laboratory and is operated by the Library of Congress at the National Audio-Visual Conservation Center (NAVCC) in Culpeper, Virginia. IRENE uses 2D optical profilometry to image the groove of a disc record at micrometer resolution, then reconstructs the audio signal from the optical scan without any physical contact between a stylus and the groove.

**How IRENE works:**

1. **Imaging:** A high-resolution line-scan camera captures the groove profile from above. The disc rotates on a precision turntable while the camera captures successive radial lines. The result is a 2D surface map of the entire disc at ~1 micrometer lateral resolution.

2. **Groove tracking:** Software identifies the spiral groove path in the 2D surface map, following the modulated wall positions from the outermost groove to the innermost.

3. **Audio reconstruction:** The lateral displacement of the groove walls (for stereo: left wall = left channel, right wall = right channel; 45/45 cutting standard) is measured at each angular position. This displacement time series IS the audio waveform -- the same waveform a physical stylus would produce, but captured optically.

4. **Advantages over physical playback:**
   - No groove wear (the disc is not touched)
   - Can read damaged grooves that would destroy a stylus
   - Can read broken disc fragments by imaging each piece separately and computationally aligning the groove spiral
   - Can read lacquer instantaneous discs that are too fragile for any stylus
   - Captures the full groove modulation including ultrasonic content above the playback system's bandwidth

**The Ceph mapping:** IRENE reads a RADOS object's metadata without mounting the block device. The groove data is the object content; the optical scan is a metadata-level read that extracts the content without the destructive wear of direct block-level access. In Ceph terms, IRENE performs `rados stat` and `rados getxattr` rather than mounting the RBD image and reading through the filesystem. The data is recovered without the overhead and risk of the full access path.

### 4.4 Spectral Recovery: Reconstructing What Was Never Recorded

iZotope RX 8's Spectral Recovery module represents a fundamental shift in audio restoration philosophy. Traditional restoration removes things that should not be there (noise, clicks, hum). Spectral Recovery adds things that were never there -- synthesizing plausible high-frequency content above the bandwidth limit of the original recording.

**The problem:** Early recordings (pre-1950s electrical recordings, telephone-quality transcriptions, AM radio recordings) were captured with bandwidth limited to 3-5 kHz. The human voice's fundamental frequency is 85-255 Hz, but its intelligibility depends on formant frequencies extending to 4-8 kHz, and the perception of "presence" and "air" depends on content up to 12-16 kHz. A 4 kHz bandwidth-limited recording sounds muffled and distant.

**The approach:** Spectral Recovery trains a neural network on matched pairs: full-bandwidth recordings and their bandwidth-limited versions (created by low-pass filtering the full-bandwidth originals). The network learns the conditional distribution P(high_freq | low_freq) -- given the low-frequency content, what high-frequency content is statistically likely to accompany it? At inference time, the network examines the low-frequency content of the bandwidth-limited recording and synthesizes the most probable high-frequency extension.

**The philosophical tension:** Spectral Recovery generates content that plausibly COULD have been in the original recording but CANNOT be verified against ground truth (the original high-frequency content was never captured). This is fundamentally different from denoising, which removes something that demonstrably was not in the original. The restored recording sounds better -- more present, more natural -- but the high-frequency content is a statistical inference, not a measurement.

This tension maps exactly to the chunk recovery problem in distributed storage. When a Ceph RADOS object is partially corrupt and no clean replica exists, erasure coding can reconstruct the missing data from the coded fragments -- but only up to the redundancy limit of the code. Beyond that limit, reconstruction becomes inference: what data PROBABLY occupied the missing region, given the surrounding context? Audio spectral recovery and storage chunk recovery are the same operation at different scales: reconstruct a missing region from context and redundancy, acknowledge the confidence boundary between verified reconstruction and plausible inference.

---

## 5. Minecraft/Ceph Isomorphism Mapping

### 5.1 Structural Correspondences

The audio fidelity pipeline maps to the Ceph/Minecraft architecture at five points. These are not analogies -- they are structural isomorphisms where the same mathematical operation performs the same function in different domains.

| Audio Domain | Ceph/Minecraft Domain | Mathematical Bridge |
|---|---|---|
| Sample rate (Hz) | Voxel resolution (blocks/meter) | Both are spatial/temporal sampling rate decisions governed by Nyquist: the sampling rate must be at least 2x the highest frequency content to avoid aliasing. A 44.1 kHz audio sample rate captures content up to 22.05 kHz. A 1-block/meter voxel resolution captures spatial features down to 2 meters. |
| Wiener filter denoising (spectral subtraction of noise profile from signal) | Embedding vector denoising after quantization compression | Both subtract an estimated noise component from a corrupted signal. The Wiener filter subtracts |N(f)|^2 from |X(f)|^2 in the frequency domain. Quantization denoising subtracts the estimated quantization error from the compressed embedding vector. The transfer function H(f) = max(0, 1 - lambda * noise/signal) is the same functional form. |
| IRENE non-contact optical playback (reads groove data without stylus contact) | Reading RADOS object metadata without mounting the block device (`rados stat`, `rados getxattr`, `rados listomapkeys`) | Both extract content from a storage medium via an indirect access path that avoids the destructive overhead of the primary access mechanism. IRENE avoids groove wear; RADOS metadata reads avoid filesystem mount overhead and block-level I/O scheduling. |
| Spectral repair (fill missing frequency bands from surrounding context) | Chunk recovery from erasure-coded fragments | Both reconstruct a missing data region using: (a) surrounding context (adjacent time frames / adjacent chunks) and (b) redundant information (noise-print-subtracted spectral prediction / parity fragments from erasure code). The confidence degrades as the missing region grows. |
| Ring buffer + semaphore (producer-consumer audio pipeline) | Ceph OSD write-ahead journal (producer-consumer write pipeline) | Both use a circular buffer to decouple a rate-constrained producer (ADC clock / client write rate) from a variable-latency consumer (DSP processing / filestore commit). The semaphore count (or journal depth) absorbs transient rate mismatches. Overflow in both cases means data loss (audio dropout / write stall). |

### 5.2 The Fidelity Equation

The unifying principle across M14 (imaging), M15 (color), and M16 (audio) is the fidelity equation:

```
Fidelity = f(sampling_rate, bit_depth, noise_floor, restoration_quality)

Where:
  sampling_rate   determines the bandwidth of captured content
  bit_depth       determines the dynamic range (quantization noise floor)
  noise_floor     determines the lowest-amplitude content recoverable
  restoration     determines how much degraded content can be recovered

All four factors apply identically to:
  - Audio: sample rate, bit depth, mic/room noise, spectral denoising
  - Imaging: pixel density, color depth, sensor noise, denoising/super-res
  - Voxel storage: block resolution, palette BPE, RADOS bit-rot, chunk repair

The math is the same math. The Nyquist theorem, the Shannon entropy bound,
the Wiener filter, the FFT -- they operate on signals regardless of domain.
```

### 5.3 STFT Window Size and Ceph Compression Hints

The FFT size used in audio spectral analysis (2048-8192 samples) determines the frequency resolution vs. time resolution tradeoff. Larger windows give finer frequency resolution but coarser time resolution. This is the Heisenberg uncertainty principle for signal processing: you cannot simultaneously have arbitrary precision in both time and frequency.

The same tradeoff appears in Ceph compression. The compression block size determines the granularity of random access vs. the compression ratio:

| Audio FFT Size | Freq Resolution (at 96 kHz) | Time Resolution | Ceph Compression Block | Random Access Granularity | Compression Ratio |
|---|---|---|---|---|---|
| 2048 | 46.9 Hz | 21.3 ms | 4 KiB | Fine | Lower |
| 4096 | 23.4 Hz | 42.7 ms | 8 KiB | Moderate | Moderate |
| 8192 | 11.7 Hz | 85.3 ms | 16 KiB | Coarse | Higher |

Integration test I-02 from the mission specification verifies this correspondence: the audio restoration STFT uses the same FFT size as the Ceph compression hint for the same data, ensuring that the frequency-domain analysis granularity matches the storage-domain random access granularity.

---

## 6. Connection to Other Modules

### 6.1 M7: Palette Entropy (11-block-chunk-data.md)

M7 formalizes palette compression as entropy coding. M16 connects at the spectral level: the Shannon entropy of an audio frame's power spectrum determines its compressibility, just as the palette entropy of a Minecraft section determines its BPE. A section of pure silence (single-valued samples) has zero entropy -- the palette has one entry. A section of white noise has maximum entropy -- every frequency bin has equal energy. The entropy of the audio content maps to the palette size of the equivalent voxel encoding.

### 6.2 M13: Backup Recovery (17-backup-security-hotswap.md)

M13 specifies RBD snapshot and mirroring strategies for world backup. M16's restoration pipeline is the audio domain's equivalent: the noise print is the known-good baseline (snapshot), the Wiener filter is the delta recovery (incremental restore), and spectral repair fills gaps that the baseline cannot cover (reconstruction from erasure-coded fragments). The M2 retrospective section 5.4 identified this connection: "Audio restoration connects to backup recovery -- iZotope RX spectral repair fills holes in audio spectrograms using surrounding context. M13's backup strategy recovers corrupt chunks from RADOS replicas. Same operation: reconstruct missing region from neighbors + redundant copies."

### 6.3 M14: Nyquist/FFT Shared Foundations (19-temporal-imaging.md)

M14 establishes the Nyquist sampling theorem and FFT framework in the imaging domain. M16 applies the identical theory to audio: temporal aliasing in imaging (wagon-wheel effect from frame rate < 2x motion frequency) is the same phenomenon as audio aliasing (high-frequency tones folding into the audible band when sample rate < 2x signal frequency). The anti-aliasing filter before the ADC (M16) is the optical low-pass filter before the sensor (M14). The FFT size tradeoff (frequency resolution vs. time resolution) applies identically in both domains. The cross-module shared dependency is explicit: FFT/STFT theory flows from M14 to M16.

### 6.4 M17: Serialization Overhead in Audio Pipeline (22-serialization-hpc.md)

M17 benchmarks serialization formats (JSON, Protocol Buffers, FlatBuffers, MessagePack) and their deserialization latency. In the audio pipeline, serialization overhead matters at the DAW plugin interface: every audio buffer passed between plugins must be serialized/deserialized if the plugin is out-of-process. JACK's zero-copy shared memory architecture eliminates this overhead -- the audio data is never serialized, only pointed to. FlatBuffers' zero-copy deserialization is the closest file-format equivalent to JACK's shared memory approach: both avoid the copy.

### 6.5 M19: Backup as Restoration Principle (24-backup-federation.md)

M19 specifies backup strategies (full, incremental, differential, CDP) and the 3-2-1-1-0 rule. M16's archival output (24-bit BWAV master + 16-bit delivery + metadata) is a backup strategy for audio content: the master is the full backup, the delivery copy is the differential (lossy reduction from master), and the BEXT metadata is the backup manifest. The tape baking procedure (section 3.3) is a temporary recovery from degraded state -- the storage equivalent of running a degraded Ceph pool with fewer replicas than target. Both require immediate action (digitize / rebalance) before the window of recoverability closes.

---

## 7. Sources

| ID | Reference |
|----|-----------|
| SRC-IZOTOPE | iZotope. "RX 8 Audio Editor: Spectral Recovery." iZotope, Inc. https://www.izotope.com/en/products/rx.html [16] |
| SRC-AUDIORESTORE | Wikipedia. "Audio restoration." https://en.wikipedia.org/wiki/Audio_restoration [17] |
| SRC-IRENE | Carl Haber and Vitaliy Fadeyev. "IRENE: Extracting Sound from Images of Audio Media." Lawrence Berkeley National Laboratory. https://irene.lbl.gov/ [18] |
| SRC-NAVCC | Library of Congress. "National Audio-Visual Conservation Center." https://www.loc.gov/programs/national-film-preservation-board/about-this-program/navcc/ [19] |
| SRC-AUDITION | Adobe. "Adobe Audition: Noise Reduction." Adobe Inc. https://helpx.adobe.com/audition/using/noise-reduction-restoration-effects.html [20] |
| SRC-WIENER | Wiener, Norbert. *Extrapolation, Interpolation, and Smoothing of Stationary Time Series.* MIT Press, 1949. |
| SRC-SHANNON | Shannon, C. E. "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27(3), 379-423, 1948. |
| SRC-JACK | JACK Audio Connection Kit. "JACK Design Documentation." https://jackaudio.org/api/ |
| SRC-CIRC | Vries, L. B. "The Compact Disc Digital Audio System: Modulation and Error Correction." *Phillips Technical Review*, 40(6), 157-164, 1982. |
| SRC-STICKYSHED | Richardson, Casey. "Sticky Shed Syndrome: Causes and Treatments." *Association for Recorded Sound Collections Journal*, 37(1), 2006. |
| SRC-ACCURATERIP | Spoon, Christopher. "AccurateRip." http://www.accuraterip.com/ |
| SRC-SONIC | Sonic Solutions. "NoNOISE: Audio Restoration System." Sonic Solutions, San Francisco, 1987. |

---

*The palette is the vocabulary. The sample is the voxel. The restoration is the recovery. Every degraded recording is a corrupt RADOS object waiting for spectral repair. Every backup is a snapshot with a shelf life. The noise floor is the bit-rot rate. The Wiener filter is the erasure decoder. Fidelity is fidelity -- the math does not care whether the signal is groove displacement or block state.*
