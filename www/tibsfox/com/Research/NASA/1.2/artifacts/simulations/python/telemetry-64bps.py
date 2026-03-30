#!/usr/bin/env python3
"""
Pioneer 1 — Telemetry Bitstream Generator (64.8 bps)
=====================================================
Mission 1.2, NASA Mission Series

Pioneer 1 transmitted science data at 64.8 bits per second on a 108.06 MHz
carrier using phase modulation (PM). The telemetry was multiplexed across
several instrument channels:

  - Geiger-Mueller tube (radiation counts)
  - Ionization chamber (radiation dose)
  - Temperature sensors (4 positions on spacecraft)
  - Aspect sensor (spin rate / sun angle)
  - Magnetometer (search coil, magnetic field)

This script generates a synthetic telemetry bitstream matching Pioneer 1's
actual data format, applies FM modulation onto a scaled carrier frequency,
and produces spectral analysis plots.

Usage: python3 telemetry-64bps.py
Output: pioneer1_telemetry.png
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec

# ===========================================================================
# Telemetry parameters
# ===========================================================================

BIT_RATE = 64.8              # bits per second (Pioneer 1 actual)
BIT_PERIOD = 1.0 / BIT_RATE  # ~15.43 ms per bit
CARRIER_FREQ = 108.06e6      # Hz (actual Pioneer 1 frequency)

# For computation, we scale the carrier down to make FFT tractable.
# Real carrier at 108 MHz would need >216 MHz sample rate.
# We use a scaled carrier that preserves the modulation structure.
CARRIER_SCALED = 5000        # Hz (scaled for computation)
SAMPLE_RATE = 100_000        # Hz (100 kHz — 20x carrier)
FM_DEVIATION = 500           # Hz (frequency deviation for FM)

DURATION = 10.0              # seconds of telemetry to generate
NUM_BITS = int(BIT_RATE * DURATION)  # ~648 bits

# ===========================================================================
# Channel definitions (Pioneer 1 telemetry frame)
# ===========================================================================

# Pioneer 1 multiplexed channels in a repeating frame.
# Each frame contained readings from all instruments in sequence.
# Frame length: 8 channels x 8 bits = 64 bits per frame
# At 64.8 bps, one complete frame takes ~0.988 seconds

CHANNELS = {
    'GM_TUBE':      {'id': 0, 'bits': 8, 'desc': 'Geiger-Mueller radiation count'},
    'ION_CHAMBER':  {'id': 1, 'bits': 8, 'desc': 'Ionization chamber dose rate'},
    'TEMP_1':       {'id': 2, 'bits': 8, 'desc': 'Temperature sensor 1 (top)'},
    'TEMP_2':       {'id': 3, 'bits': 8, 'desc': 'Temperature sensor 2 (side)'},
    'ASPECT':       {'id': 4, 'bits': 8, 'desc': 'Sun aspect sensor (spin angle)'},
    'MAGNETOMETER': {'id': 5, 'bits': 8, 'desc': 'Search coil magnetometer'},
    'TEMP_3':       {'id': 6, 'bits': 8, 'desc': 'Temperature sensor 3 (bottom)'},
    'HOUSEKEEPING': {'id': 7, 'bits': 8, 'desc': 'Battery voltage / status'},
}

FRAME_BITS = sum(ch['bits'] for ch in CHANNELS.values())  # 64 bits
FRAME_PERIOD = FRAME_BITS / BIT_RATE                       # ~0.988 s


def generate_channel_data(channel_name, frame_number):
    """
    Generate realistic telemetry values for each channel.

    Simulates Pioneer 1 at approximately 50,000 km altitude (mid-flight,
    in the outer Van Allen belt region).
    """
    rng = np.random.default_rng(seed=42 + frame_number)

    if channel_name == 'GM_TUBE':
        # Geiger-Mueller tube: radiation counts
        # At 50,000 km: outer belt, moderate intensity
        # Base count ~200/frame + Poisson noise
        count = int(rng.poisson(200))
        return min(count, 255)  # 8-bit saturation

    elif channel_name == 'ION_CHAMBER':
        # Ionization chamber: dose rate (0-255 scale)
        # Correlated with GM tube but different response
        dose = int(rng.normal(120, 20))
        return np.clip(dose, 0, 255)

    elif channel_name.startswith('TEMP'):
        # Temperature sensors: spacecraft thermal
        # Pioneer 1 was spin-stabilized, so temps varied with sun angle
        # Range: -20C to +40C mapped to 0-255
        if channel_name == 'TEMP_1':  # Sun-facing side (warmer)
            temp = int(rng.normal(180, 10))
        elif channel_name == 'TEMP_2':  # Side
            temp = int(rng.normal(140, 15))
        else:  # Bottom (cooler)
            temp = int(rng.normal(100, 10))
        return np.clip(temp, 0, 255)

    elif channel_name == 'ASPECT':
        # Sun aspect sensor: spin angle detection
        # At 1.8 rev/sec, the sensor fires once per revolution
        # Value encodes time-since-last-pulse (spin period measurement)
        spin_period_ticks = int(rng.normal(139, 2))  # ~1.8 rev/s
        return np.clip(spin_period_ticks, 0, 255)

    elif channel_name == 'MAGNETOMETER':
        # Search coil magnetometer: field strength
        # At 50,000 km: ~0.01 gauss, mapped to 8-bit
        field = int(rng.normal(30, 8))
        return np.clip(field, 0, 255)

    elif channel_name == 'HOUSEKEEPING':
        # Battery voltage + status bits
        # Battery: 28V nominal, mapped to upper 6 bits
        # Status: lower 2 bits (all systems nominal = 0b11)
        voltage_bits = int(rng.normal(200, 3)) & 0xFC
        status_bits = 0x03  # nominal
        return voltage_bits | status_bits

    return 0


def generate_bitstream():
    """Generate the complete telemetry bitstream."""
    bits = []
    channel_names = list(CHANNELS.keys())
    num_frames = int(np.ceil(NUM_BITS / FRAME_BITS))

    print(f"Generating {num_frames} telemetry frames ({NUM_BITS} bits, {DURATION}s)...")
    print(f"Frame format: {FRAME_BITS} bits/frame, {len(CHANNELS)} channels x 8 bits")
    print(f"Frame period: {FRAME_PERIOD*1000:.1f} ms at {BIT_RATE} bps")
    print()

    for frame in range(num_frames):
        frame_data = {}
        for ch_name in channel_names:
            value = generate_channel_data(ch_name, frame)
            frame_data[ch_name] = value
            # Convert to 8-bit binary (MSB first)
            for bit_pos in range(7, -1, -1):
                bits.append((value >> bit_pos) & 1)

        # Print first 3 frames as example
        if frame < 3:
            print(f"  Frame {frame}: ", end='')
            for ch_name in channel_names:
                print(f"{ch_name[:4]}={frame_data[ch_name]:3d} ", end='')
            print()

    if num_frames > 3:
        print(f"  ... ({num_frames - 3} more frames)")
    print()

    # Trim to exact length
    bits = np.array(bits[:NUM_BITS], dtype=float)
    return bits


def apply_fm_modulation(bits):
    """
    Apply FM modulation to the bitstream.

    Pioneer 1 used phase modulation (PM), which is equivalent to FM
    of the derivative of the data signal. For simplicity and clarity,
    we use direct FM modulation here — the spectral structure is similar.

    The modulated signal:
      s(t) = cos(2*pi*fc*t + 2*pi*fd * integral(m(t)))
    where m(t) is the NRZ data signal (+1/-1) and fd is the deviation.
    """
    num_samples = int(DURATION * SAMPLE_RATE)
    t = np.arange(num_samples) / SAMPLE_RATE

    # Create NRZ signal: map bits (0,1) to (-1,+1)
    nrz = 2 * bits - 1  # Now +1 or -1

    # Upsample NRZ to sample rate
    samples_per_bit = int(SAMPLE_RATE / BIT_RATE)
    nrz_upsampled = np.repeat(nrz, samples_per_bit)

    # Trim or pad to match time array
    if len(nrz_upsampled) > num_samples:
        nrz_upsampled = nrz_upsampled[:num_samples]
    elif len(nrz_upsampled) < num_samples:
        nrz_upsampled = np.pad(nrz_upsampled, (0, num_samples - len(nrz_upsampled)))

    # FM modulation: integrate the NRZ signal for phase
    phase = 2 * np.pi * FM_DEVIATION * np.cumsum(nrz_upsampled) / SAMPLE_RATE

    # Carrier + modulation
    carrier_phase = 2 * np.pi * CARRIER_SCALED * t
    signal = np.cos(carrier_phase + phase)

    print(f"FM modulation applied:")
    print(f"  Carrier (scaled): {CARRIER_SCALED} Hz")
    print(f"  Carrier (actual): {CARRIER_FREQ/1e6} MHz")
    print(f"  Deviation: +/-{FM_DEVIATION} Hz")
    print(f"  Sample rate: {SAMPLE_RATE/1000} kHz")
    print(f"  Total samples: {num_samples:,}")
    print()

    return t, signal, nrz_upsampled


def compute_spectrum(signal):
    """Compute power spectrum using FFT."""
    N = len(signal)

    # Apply Hanning window to reduce spectral leakage
    window = np.hanning(N)
    windowed = signal * window

    # FFT
    fft_result = np.fft.rfft(windowed)
    freqs = np.fft.rfftfreq(N, 1.0 / SAMPLE_RATE)

    # Power spectrum (dB)
    power = 20 * np.log10(np.abs(fft_result) / N + 1e-12)

    return freqs, power


def plot_telemetry(bits, t, signal, nrz, freqs, power):
    """Generate the three-panel telemetry plot."""
    fig = plt.figure(figsize=(16, 14))
    gs = GridSpec(4, 1, height_ratios=[1, 1.5, 1.5, 1.5], hspace=0.4)

    # --- Panel 1: Bitstream (first 200 bits) ---
    ax1 = fig.add_subplot(gs[0])
    show_bits = min(200, len(bits))
    bit_times = np.arange(show_bits) / BIT_RATE

    # Draw bit values as colored rectangles
    for i in range(show_bits):
        color = '#4CAF50' if bits[i] == 1 else '#333333'
        ax1.add_patch(plt.Rectangle(
            (bit_times[i], 0), 1/BIT_RATE * 0.95, 1,
            facecolor=color, edgecolor='none', alpha=0.8
        ))

    # Mark frame boundaries
    for frame_start in range(0, show_bits, FRAME_BITS):
        t_frame = frame_start / BIT_RATE
        ax1.axvline(x=t_frame, color='red', linewidth=0.8, alpha=0.5)

    # Mark channel boundaries within first frame
    channel_names_short = ['GM', 'ION', 'T1', 'T2', 'ASP', 'MAG', 'T3', 'HK']
    for i, name in enumerate(channel_names_short):
        t_ch = i * 8 / BIT_RATE
        if t_ch < bit_times[-1]:
            ax1.text(t_ch + 4/BIT_RATE, 1.15, name, fontsize=7,
                    ha='center', color='#666', fontweight='bold')

    ax1.set_xlim(0, bit_times[-1])
    ax1.set_ylim(-0.1, 1.4)
    ax1.set_ylabel('Bit Value', fontsize=11)
    ax1.set_title(
        f'Pioneer 1 Telemetry — {BIT_RATE} bps on {CARRIER_FREQ/1e6} MHz\n'
        f'First {show_bits} bits ({show_bits/BIT_RATE:.1f}s) | '
        f'Red lines = frame boundaries ({FRAME_BITS} bits/frame)',
        fontsize=13, fontweight='bold'
    )
    ax1.set_xlabel('Time (seconds)', fontsize=10)
    ax1.grid(True, alpha=0.2, axis='x')

    # --- Panel 2: NRZ baseband signal (first 50 ms) ---
    ax2 = fig.add_subplot(gs[1])
    show_samples_nrz = int(0.05 * SAMPLE_RATE)  # 50 ms
    t_nrz = t[:show_samples_nrz] * 1000  # ms
    ax2.plot(t_nrz, nrz[:show_samples_nrz], color='#FF9800', linewidth=1.5)
    ax2.set_xlabel('Time (ms)', fontsize=10)
    ax2.set_ylabel('NRZ Level', fontsize=11)
    ax2.set_title('Baseband NRZ Data Signal (first 50 ms)', fontsize=12, fontweight='bold')
    ax2.set_ylim(-1.5, 1.5)
    ax2.grid(True, alpha=0.3)
    ax2.axhline(y=0, color='gray', linewidth=0.5)

    # --- Panel 3: FM modulated signal (zoom to see carrier) ---
    ax3 = fig.add_subplot(gs[2])
    # Show ~5 ms to see individual carrier cycles
    show_samples_fm = int(0.005 * SAMPLE_RATE)  # 5 ms
    t_fm = t[:show_samples_fm] * 1000  # ms
    ax3.plot(t_fm, signal[:show_samples_fm], color='#2196F3', linewidth=0.8)
    ax3.set_xlabel('Time (ms)', fontsize=10)
    ax3.set_ylabel('Amplitude', fontsize=11)
    ax3.set_title(
        f'FM Modulated Signal (carrier: {CARRIER_SCALED} Hz scaled, '
        f'actual: {CARRIER_FREQ/1e6} MHz)',
        fontsize=12, fontweight='bold'
    )
    ax3.set_ylim(-1.3, 1.3)
    ax3.grid(True, alpha=0.3)

    # --- Panel 4: Power spectrum ---
    ax4 = fig.add_subplot(gs[3])

    # Only show around the carrier frequency
    carrier_region = (freqs > CARRIER_SCALED - 2000) & (freqs < CARRIER_SCALED + 2000)
    ax4.plot(freqs[carrier_region], power[carrier_region], color='#9C27B0', linewidth=1)

    # Mark carrier and sidebands
    ax4.axvline(x=CARRIER_SCALED, color='red', linewidth=1, linestyle='--', alpha=0.7,
               label=f'Carrier ({CARRIER_SCALED} Hz)')
    ax4.axvline(x=CARRIER_SCALED - FM_DEVIATION, color='orange', linewidth=1,
               linestyle=':', alpha=0.7, label=f'-{FM_DEVIATION} Hz sideband')
    ax4.axvline(x=CARRIER_SCALED + FM_DEVIATION, color='orange', linewidth=1,
               linestyle=':', alpha=0.7, label=f'+{FM_DEVIATION} Hz sideband')

    # Carson's rule bandwidth
    carson_bw = 2 * (FM_DEVIATION + BIT_RATE)
    ax4.axvspan(CARRIER_SCALED - carson_bw/2, CARRIER_SCALED + carson_bw/2,
               alpha=0.08, color='green', label=f"Carson's BW: {carson_bw:.0f} Hz")

    ax4.set_xlabel('Frequency (Hz)', fontsize=10)
    ax4.set_ylabel('Power (dB)', fontsize=11)
    ax4.set_title('Power Spectrum (FFT) — Carrier + Modulation Sidebands', fontsize=12,
                 fontweight='bold')
    ax4.legend(loc='upper right', fontsize=9)
    ax4.grid(True, alpha=0.3)

    fig.savefig('pioneer1_telemetry.png', dpi=150, bbox_inches='tight')
    print("Saved: pioneer1_telemetry.png")
    plt.close(fig)


# ===========================================================================
# Main
# ===========================================================================

def main():
    print()
    print("  Pioneer 1 — Telemetry Bitstream Generator")
    print("  Mission 1.2, NASA Mission Series")
    print(f"  Data rate: {BIT_RATE} bps | Carrier: {CARRIER_FREQ/1e6} MHz")
    print(f"  Generating {DURATION}s of telemetry ({NUM_BITS} bits)")
    print()

    # Generate bitstream
    bits = generate_bitstream()

    # Apply FM modulation
    t, signal, nrz = apply_fm_modulation(bits)

    # Compute spectrum
    print("Computing FFT power spectrum...")
    freqs, power = compute_spectrum(signal)

    # Find carrier peak
    carrier_idx = np.argmin(np.abs(freqs - CARRIER_SCALED))
    print(f"  Carrier peak at {freqs[carrier_idx]:.1f} Hz: {power[carrier_idx]:.1f} dB")
    print()

    # Plot everything
    print("Generating telemetry plot...")
    plot_telemetry(bits, t, signal, nrz, freqs, power)

    print()
    print("=" * 65)
    print(f"Pioneer 1 telemetry: {NUM_BITS} bits in {DURATION}s")
    print(f"  = {NUM_BITS // FRAME_BITS} complete frames")
    print(f"  = {NUM_BITS // FRAME_BITS * len(CHANNELS)} channel readings")
    print(f"Transmitted from 113,854 km at 300 mW on 108.06 MHz.")
    print(f"Received at Cape Canaveral, Jodrell Bank, and Goldstone.")
    print("=" * 65)


if __name__ == '__main__':
    main()
