# Mission 1.31 -- Mariner 1: The Math of Missing Symbols

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Mariner 1 (July 22, 1962)
**Primary TSPB Layer:** 7 (Information Systems Theory -- Software Verification, Error Propagation)
**Secondary Layers:** 5 (Probability -- Range Safety Decision Theory), 4 (Vector Calculus -- Venus Transfer Orbit), 1 (Unit Circle -- Orbital Windows)
**Format:** McNeese-Hoag Reference Standard (1962) -- Tables, Formulas, Worked Examples

---

## Deposit 1: The Smoothing Function and Its Absence (Layer 7, Section 7.6)

### Table

| Parameter | Symbol | Units | Mariner 1 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | July 22, 1962, 09:21:23 UTC |
| Launch vehicle | -- | -- | Atlas-Agena B |
| Spacecraft mass | m_sc | kg | 202.8 |
| Flight duration | t_flight | s | 293 (destroyed by range safety) |
| Guidance type | -- | -- | Ground-commanded, radar tracking |
| Tracking radar frequency | f_radar | MHz | ~5,600 (C-band) |
| Tracking noise std dev | sigma_noise | m/s | ~5-10 (velocity estimate) |
| Smoothing window (intended) | N | samples | ~5-10 (time-averaged) |
| Smoothing window (actual) | N | samples | 1 (no smoothing -- overbar missing) |
| Correction gain | K | -- | ~0.1-0.5 (guidance law dependent) |
| Time to destruct | t_destruct | s | 293 |
| Cost | -- | $M (1962) | 18.5 |

### Formulas

**The Smoothing Function (What Should Have Happened):**

```
The overbar in the specification denoted time-averaging:

  R_dot_bar = (1/N) * sum(R_dot_i, i=k-N+1 to k)

This is a simple moving average: take the last N samples of
the velocity measurement R_dot, average them, and use the
smoothed value for guidance corrections.

Without the overbar:
  R_dot_raw = R_dot_k  (just the current sample, with all its noise)

The guidance correction:
  correction_k = K * (R_dot_used - R_dot_target)

With smoothing:  correction responds to TREND (real trajectory)
Without smoothing: correction responds to NOISE (phantom deviations)
```

**Error Amplification in Closed-Loop Guidance:**

```
The guidance loop forms a feedback system:
  1. Radar measures position/velocity: y = x + noise
  2. Computer computes error: e = y_smoothed - y_target  (or y_raw - y_target)
  3. Computer commands correction: u = K * e
  4. Vehicle responds: x_new = x + f(u)
  5. Radar measures again → back to step 1

Transfer function (z-domain for discrete system):
  With smoothing:  H(z) = K * G_smooth(z) / (1 + K * G_smooth(z) * G_vehicle(z))
  Without smoothing: H(z) = K / (1 + K * G_vehicle(z))

The smoothing filter G_smooth(z) attenuates high-frequency noise.
Without it, the closed-loop gain at high frequencies is too high,
and the system oscillates -- responding to noise at frequencies
that the vehicle cannot physically track.

This is a classic control theory instability: insufficient
filtering in a high-gain feedback loop leads to oscillation.
```

### Worked Example

**Problem:** Demonstrate the smoothing function's effect on guidance corrections and the destabilizing effect of its absence.

```python
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

np.random.seed(1962)

N = 300  # time steps (seconds, matching Mariner 1 flight time)
dt = 1.0  # 1 second per step

# True trajectory (nominal -- straight line with gentle turn)
x_true = np.cumsum(np.ones(N) * 0.1)  # gradually moving east

# Radar noise
noise_std = 8.0  # m/s velocity noise
radar_noise = np.random.normal(0, noise_std, N)

# Radar measurements
v_measured = np.gradient(x_true) / dt + radar_noise

# Guidance gain
K = 0.4

# WITH SMOOTHING (correct code)
window = 7
x_smoothed = np.zeros(N)
corrections_smoothed = np.zeros(N)
for i in range(1, N):
    start = max(0, i - window)
    v_smooth = np.mean(v_measured[start:i+1])
    error = v_smooth - np.gradient(x_true)[i] / dt
    corrections_smoothed[i] = -K * error
    x_smoothed[i] = x_smoothed[i-1] + corrections_smoothed[i]

# WITHOUT SMOOTHING (Mariner 1 -- missing overbar)
x_raw = np.zeros(N)
corrections_raw = np.zeros(N)
destruct_limit = 40.0
destruct_time = N
for i in range(1, N):
    v_raw = v_measured[i]  # NO SMOOTHING
    error = v_raw - np.gradient(x_true)[i] / dt
    corrections_raw[i] = -K * error
    x_raw[i] = x_raw[i-1] + corrections_raw[i]
    if abs(x_raw[i]) > destruct_limit and destruct_time == N:
        destruct_time = i

fig, axes = plt.subplots(2, 2, figsize=(14, 8))

# Velocity measurements
axes[0,0].plot(v_measured, 'r.', alpha=0.2, markersize=1, label='Raw radar')
start_idx = max(0, len(v_measured)-window)
smoothed_v = np.convolve(v_measured, np.ones(window)/window, mode='same')
axes[0,0].plot(smoothed_v, 'b-', linewidth=1.5, label='Smoothed (overbar)')
axes[0,0].set_title('Radar Velocity Data')
axes[0,0].set_ylabel('Velocity (m/s)')
axes[0,0].legend(fontsize=8)
axes[0,0].grid(alpha=0.3)

# Corrections comparison
axes[0,1].plot(corrections_smoothed, 'b-', alpha=0.7, linewidth=1, label='Smoothed')
axes[0,1].plot(corrections_raw[:destruct_time+10], 'r-', alpha=0.7, linewidth=1, label='Raw (no overbar)')
axes[0,1].set_title('Guidance Corrections')
axes[0,1].set_ylabel('Correction magnitude')
axes[0,1].legend(fontsize=8)
axes[0,1].grid(alpha=0.3)

# Trajectory with smoothing
axes[1,0].plot(x_smoothed, 'b-', linewidth=1.5)
axes[1,0].axhline(destruct_limit, color='r', linestyle='--', alpha=0.5)
axes[1,0].axhline(-destruct_limit, color='r', linestyle='--', alpha=0.5)
axes[1,0].set_title('With Overbar: Stable Flight')
axes[1,0].set_ylabel('Lateral deviation (km)')
axes[1,0].set_xlabel('Time (s)')
axes[1,0].set_ylim(-60, 60)
axes[1,0].grid(alpha=0.3)

# Trajectory without smoothing
axes[1,1].plot(x_raw[:destruct_time+10], 'r-', linewidth=1.5)
axes[1,1].axhline(destruct_limit, color='r', linestyle='--', alpha=0.5)
axes[1,1].axhline(-destruct_limit, color='r', linestyle='--', alpha=0.5)
axes[1,1].axvline(destruct_time, color='orange', linewidth=2, label=f'DESTRUCT T+{destruct_time}s')
axes[1,1].set_title(f'Without Overbar: Oscillation → Destruct T+{destruct_time}s')
axes[1,1].set_ylabel('Lateral deviation (km)')
axes[1,1].set_xlabel('Time (s)')
axes[1,1].set_ylim(-60, 60)
axes[1,1].legend()
axes[1,1].grid(alpha=0.3)

plt.suptitle('MARINER 1: One Missing Symbol', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('mariner1_smoothing.png', dpi=150)
print(f'Destruct at T+{destruct_time}s (actual: T+293s)')
print('The overbar was one character. The cost was $18.5 million.')
```

**Resonance statement:** *The moving average is one of the simplest operations in signal processing: add the last N values, divide by N. The overbar above the variable name is mathematical shorthand for "smooth this." Without it, the guidance computer treated every radar noise spike as a real trajectory error and tried to correct it. The corrections created real errors, which created bigger corrections, which created bigger errors. A simple filter — seven samples averaged — would have prevented the oscillation entirely. The difference between stable flight and range safety destruct was a smoothing window of width seven. The mathematical equivalent of a barn rafter that is too smooth for the Barn Swallow's mud to grip: the foundation holds nothing, and the structure falls.*

---

## Deposit 2: Range Safety Decision Theory (Layer 5, Section 5.6)

### Table

| Parameter | Symbol | Units | Mariner 1 Value |
|-----------|--------|-------|-----------------|
| Mission cost | C_mission | $M | 18.5 |
| Estimated populated impact cost | C_pop | $M | 500+ |
| Time to destruct decision | t_decision | s | <1 (human reaction time) |
| Vehicle velocity at destruct | v_destruct | m/s | ~2,500 (approximate) |
| Range safety margin | d_margin | km | ~50 (to shipping lanes) |

### Worked Example

```python
import numpy as np

print('RANGE SAFETY: THE BROADBENT DECISION')
print('=' * 55)

# At T+293 seconds, Jack Broadbent had to decide:
# Destroy the vehicle (certain $18.5M loss)
# or allow it to continue (uncertain outcome)

C_mission = 18.5  # million dollars

# Probability estimates at T+293s (vehicle off-course, oscillating)
scenarios = [
    ('Guidance recovers',      0.02, 0),     # very unlikely at this point
    ('Ocean impact (safe)',    0.60, 0),     # most likely benign outcome
    ('Shipping lane impact',   0.25, 100),   # moderate: vessel damage, casualties
    ('Populated area impact',  0.08, 1000),  # low but catastrophic
    ('Secondary vehicle damage',0.05, 50),   # debris damages other assets
]

print(f'{"Scenario":<25} {"P":>6} {"Cost($M)":>10} {"E[Cost]":>10}')
print('-' * 55)
e_continue = 0
for name, p, cost in scenarios:
    ec = p * cost
    e_continue += ec
    print(f'{name:<25} {p:>6.2f} {cost:>10.0f} {ec:>10.1f}')

print(f'{"":.<25} {"":>6} {"":>10} {"─"*10}')
print(f'{"E[cost of continuing]":<25} {"":>6} {"":>10} {e_continue:>10.1f}')
print(f'{"E[cost of destruct]":<25} {"":>6} {"":>10} {C_mission:>10.1f}')
print()
print(f'Ratio: {e_continue/C_mission:.1f}x')
print(f'DECISION: DESTRUCT (saves expected ${e_continue - C_mission:.0f}M)')
print()
print('Broadbent had less than a second to make this calculation.')
print('He made the right call. The math was on his side.')
print('Mariner 2 launched 36 days later and reached Venus.')
```

---

## Debate Questions

### Question 1: The Value of a Symbol
The missing overbar was one character in thousands of lines of code. Should the programmer bear responsibility, or the verification process? Modern code review practices exist because of failures like this. Is "blame the programmer" or "blame the process" the right lesson?

### Question 2: Graceful Degradation
The Barn Swallow's navigation uses multiple channels with graceful degradation. Mariner 1's guidance had a single failure mode. Should flight-critical software be required to degrade gracefully? What would that look like for a guidance system?

### Question 3: The Compiler Solution
Grace Hopper's compiler philosophy would have eliminated the hand-transcription step. Should all safety-critical code be generated from formal specifications rather than hand-written? What are the risks of generated code vs. hand-written code?

### Question 4: When to Press the Button
Jack Broadbent destroyed an $18.5M mission because the vehicle might — not would — hit a populated area. How certain must the range safety officer be before sending the destruct command? What is the decision framework?

---

*"One overbar. One symbol in one equation in one program on one vehicle. The cost was $18.5 million and the first American Venus mission. But the Barn Swallow knows: when the nest falls, you rebuild. Mariner 2 launched 36 days later, from the same pad, with the same spacecraft, and reached Venus. The overbar was the most expensive character in the history of computing. Grace Hopper spent her life making sure characters like it could never be lost in translation again."*
