#!/usr/bin/env python3
"""
Pioneer 2 TV Camera — Image Reconstruction from Noisy Scan Data
================================================================
NASA Mission Series v1.3 — Pioneer 2

Takes the TV signal from tv-signal-generator.py and reconstructs
the image at various noise levels and completion stages.

This simulates what ground station engineers saw as Pioneer 2's
signal arrived — a picture building up line by line on a monitor,
degrading as noise increased or the spacecraft's signal weakened.

The four noise levels represent:
  - Clean (30 dB): Lab conditions, signal generator into receiver
  - Moderate (20 dB): Strong signal, close range (1,550 km actual)
  - Noisy (15 dB): Weak signal, edge of receiver sensitivity
  - Very noisy (5 dB): Signal barely above noise floor, deep space

The progressive reconstruction shows:
  - 10% complete: just the top of the frame
  - 25% complete: beginning to see the Earth limb
  - 50% complete: half the disk visible
  - 100% complete: full frame

Libraries: numpy, matplotlib, scipy (optional for filtering)
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
import os

# ============================================================
# PARAMETERS (must match tv-signal-generator.py)
# ============================================================
IMG_LINES = 160
IMG_PIXELS = 200
EARTH_RADIUS_PX = 60
SAMPLES_PER_LINE = 500
SYNC_SAMPLES = 50
BLANK_SAMPLES = 30
ACTIVE_SAMPLES = SAMPLES_PER_LINE - SYNC_SAMPLES - 2 * BLANK_SAMPLES
SYNC_LEVEL = 0.0
BLANK_LEVEL = 0.15
BLACK_LEVEL = 0.2
WHITE_LEVEL = 1.0
VSYNC_LINES = 6

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_earth_image(lines, pixels, radius):
    """Recreate the Earth image (same as generator for self-contained use)."""
    img = np.zeros((lines, pixels))
    cy, cx = lines // 2, pixels // 2

    for y in range(lines):
        for x in range(pixels):
            dy = (y - cy) / radius
            dx = (x - cx) / radius
            r = np.sqrt(dx**2 + dy**2)

            if r > 1.0:
                img[y, x] = 0.0
            elif r > 0.95:
                limb_factor = (1.0 - r) / 0.05
                img[y, x] = 0.7 + 0.3 * limb_factor
            else:
                lat = dy
                base = 0.35 + 0.15 * abs(lat)
                cloud1 = 0.15 * np.sin(6.0 * dx + 2.0 * dy + 1.5)
                cloud2 = 0.10 * np.sin(3.0 * dx - 5.0 * dy + 0.8)
                cloud3 = 0.08 * np.cos(8.0 * dx + 4.0 * dy)
                continent = 0.0
                if -0.3 < dx < 0.2 and 0.1 < dy < 0.5:
                    continent = 0.08 * np.exp(-((dx + 0.05)**2 + (dy - 0.3)**2) / 0.04)
                if -0.1 < dx < 0.15 and -0.5 < dy < -0.1:
                    continent = 0.06 * np.exp(-((dx - 0.02)**2 + (dy + 0.3)**2) / 0.03)
                brightness = base + cloud1 + cloud2 + cloud3 + continent
                img[y, x] = np.clip(brightness, 0.1, 0.9)

    return img


def generate_signal_from_image(img, snr_db=30):
    """Generate composite video signal from image with given SNR."""
    lines, pixels = img.shape
    total_lines = lines + VSYNC_LINES
    signal = np.zeros(total_lines * SAMPLES_PER_LINE)

    for line_num in range(total_lines):
        offset = line_num * SAMPLES_PER_LINE

        if line_num < VSYNC_LINES:
            half = SAMPLES_PER_LINE // 2
            signal[offset:offset + half - 20] = SYNC_LEVEL
            signal[offset + half - 20:offset + half] = BLANK_LEVEL
            signal[offset + half:offset + SAMPLES_PER_LINE - 20] = SYNC_LEVEL
            signal[offset + SAMPLES_PER_LINE - 20:offset + SAMPLES_PER_LINE] = BLANK_LEVEL
        else:
            img_line = line_num - VSYNC_LINES
            signal[offset:offset + SYNC_SAMPLES] = SYNC_LEVEL
            signal[offset + SYNC_SAMPLES:offset + SYNC_SAMPLES + BLANK_SAMPLES] = BLANK_LEVEL

            active_start = offset + SYNC_SAMPLES + BLANK_SAMPLES
            active_end = active_start + ACTIVE_SAMPLES

            if img_line < lines:
                x_img = np.linspace(0, pixels - 1, ACTIVE_SAMPLES)
                x_idx = np.clip(x_img.astype(int), 0, pixels - 1)
                video = img[img_line, x_idx]
                signal[active_start:active_end] = (
                    BLACK_LEVEL + video * (WHITE_LEVEL - BLACK_LEVEL)
                )
            else:
                signal[active_start:active_end] = BLACK_LEVEL

            front_start = active_end
            front_end = offset + SAMPLES_PER_LINE
            if front_end > front_start:
                signal[front_start:front_end] = BLANK_LEVEL

    # Add noise
    noise_power = np.mean(signal**2) / (10**(snr_db / 10))
    noise = np.random.normal(0, np.sqrt(noise_power), len(signal))
    signal = signal + noise

    return signal, total_lines


def reconstruct_image(signal, total_lines, img_lines, img_pixels, max_lines=None):
    """
    Reconstruct image from composite signal.

    max_lines: if set, only reconstruct this many lines (partial scan).
    """
    if max_lines is None:
        max_lines = img_lines

    reconstructed = np.zeros((img_lines, img_pixels))
    sync_threshold = (SYNC_LEVEL + BLANK_LEVEL) / 2

    # Find sync pulses
    line_starts = []
    in_sync = False
    for i in range(len(signal) - 1):
        if not in_sync and signal[i] < sync_threshold:
            in_sync = True
            line_starts.append(i)
        elif in_sync and signal[i] > sync_threshold + 0.05:
            in_sync = False

    img_line = 0
    for start in line_starts:
        if img_line >= max_lines:
            break

        video_start = start + SYNC_SAMPLES + BLANK_SAMPLES
        video_end = video_start + ACTIVE_SAMPLES

        if video_end > len(signal):
            break

        segment = signal[video_start:video_end]
        if np.mean(segment) > sync_threshold:
            x_sig = np.linspace(0, len(segment) - 1, img_pixels)
            x_idx = np.clip(x_sig.astype(int), 0, len(segment) - 1)
            line_data = segment[x_idx]
            brightness = (line_data - BLACK_LEVEL) / (WHITE_LEVEL - BLACK_LEVEL)
            reconstructed[img_line, :] = np.clip(brightness, 0, 1)
            img_line += 1

    return reconstructed


def plot_progressive_reconstruction(earth, output_path):
    """
    Show image building up: 10%, 25%, 50%, 100% of lines received.
    Simulates the ground station monitor as the signal arrives.
    """
    fig, axes = plt.subplots(2, 4, figsize=(16, 8), facecolor='#0a0a1a')
    fig.suptitle(
        'Pioneer 2 TV Camera — Progressive Image Reception\n'
        'Ground station monitor, Cape Canaveral, November 8, 1958',
        fontsize=14, fontweight='bold', color='#00ff88', y=0.98
    )

    percentages = [10, 25, 50, 100]
    snr = 20  # Moderate noise for this demo

    signal, total_lines = generate_signal_from_image(earth, snr_db=snr)

    for i, pct in enumerate(percentages):
        max_lines = int(IMG_LINES * pct / 100)
        recon = reconstruct_image(signal, total_lines, IMG_LINES, IMG_PIXELS,
                                  max_lines=max_lines)

        # Top row: the reconstructed image on a CRT-style display
        ax = axes[0, i]
        ax.set_facecolor('#020208')

        # Apply green phosphor tint (P31 phosphor, typical of era)
        display = np.zeros((IMG_LINES, IMG_PIXELS, 3))
        display[:, :, 0] = recon * 0.1    # slight red
        display[:, :, 1] = recon * 1.0    # dominant green (phosphor)
        display[:, :, 2] = recon * 0.15   # slight blue

        ax.imshow(display, aspect='equal')
        ax.set_title(f'{pct}% received\n({max_lines} of {IMG_LINES} lines)',
                     color='#00ff88', fontsize=10)
        ax.tick_params(colors='#335533', labelsize=6)

        # Add scan line indicator
        if pct < 100:
            ax.axhline(y=max_lines, color='#00ff88', linewidth=1, alpha=0.7)
            ax.text(IMG_PIXELS + 2, max_lines, '<< SCAN',
                    color='#00ff88', fontsize=7, va='center')

        # Bottom row: the signal waveform for the last received line
        ax = axes[1, i]
        ax.set_facecolor('#0a0a1a')

        last_line_idx = VSYNC_LINES + max_lines - 1
        line_start = last_line_idx * SAMPLES_PER_LINE
        line_end = line_start + SAMPLES_PER_LINE
        if line_end <= len(signal):
            t = np.arange(SAMPLES_PER_LINE)
            ax.plot(t, signal[line_start:line_end],
                    color='#00ff88', linewidth=0.5, alpha=0.8)

        ax.axhline(y=SYNC_LEVEL, color='#ff4444', linewidth=0.3, linestyle='--', alpha=0.4)
        ax.axhline(y=BLANK_LEVEL, color='#4444ff', linewidth=0.3, linestyle='--', alpha=0.4)
        ax.set_ylim(-0.2, 1.2)
        ax.set_title(f'Line {max_lines} waveform', color='#668866', fontsize=9)
        ax.tick_params(colors='#335533', labelsize=6)
        ax.grid(True, color='#1a3a1a', alpha=0.3)

    plt.tight_layout(rect=[0, 0, 1, 0.93])
    plt.savefig(output_path, dpi=150, facecolor='#0a0a1a', bbox_inches='tight')
    plt.close()
    print(f"  Saved: {output_path}")


def plot_noise_comparison(earth, output_path):
    """
    Show reconstruction quality at different SNR levels.
    4-panel comparison: 30 dB, 20 dB, 15 dB, 5 dB.
    """
    fig = plt.figure(figsize=(16, 10), facecolor='#0a0a1a')
    gs = GridSpec(3, 4, figure=fig, hspace=0.4, wspace=0.3)

    fig.suptitle(
        'Pioneer 2 TV Camera — Signal Quality vs Noise\n'
        'Same image at 4 signal-to-noise ratios',
        fontsize=14, fontweight='bold', color='#00ff88', y=0.98
    )

    snr_levels = [
        (30, 'Clean (30 dB)\nLab conditions'),
        (20, 'Moderate (20 dB)\nActual Pioneer 2 range'),
        (15, 'Noisy (15 dB)\nWeak signal'),
        (5, 'Very Noisy (5 dB)\nBarely above noise floor'),
    ]

    for i, (snr, label) in enumerate(snr_levels):
        signal, total_lines = generate_signal_from_image(earth, snr_db=snr)
        recon = reconstruct_image(signal, total_lines, IMG_LINES, IMG_PIXELS)

        # Compute quality metrics
        mse = np.mean((earth - recon)**2)
        psnr = 10 * np.log10(1.0 / mse) if mse > 0 else float('inf')

        # Row 1: Reconstructed image (green phosphor)
        ax = fig.add_subplot(gs[0, i])
        ax.set_facecolor('#020208')
        display = np.zeros((IMG_LINES, IMG_PIXELS, 3))
        display[:, :, 0] = np.clip(recon, 0, 1) * 0.1
        display[:, :, 1] = np.clip(recon, 0, 1) * 1.0
        display[:, :, 2] = np.clip(recon, 0, 1) * 0.15
        ax.imshow(display, aspect='equal')
        ax.set_title(label, color='#00ff88', fontsize=9)
        ax.tick_params(colors='#335533', labelsize=6)

        # Row 2: Single line waveform comparison
        ax = fig.add_subplot(gs[1, i])
        ax.set_facecolor('#0a0a1a')

        center_line = VSYNC_LINES + IMG_LINES // 2
        line_start = center_line * SAMPLES_PER_LINE
        line_end = line_start + SAMPLES_PER_LINE

        # Clean reference
        clean_signal, _ = generate_signal_from_image(earth, snr_db=100)
        t = np.arange(SAMPLES_PER_LINE)
        ax.plot(t, clean_signal[line_start:line_end],
                color='#006633', linewidth=0.5, alpha=0.5, label='Clean')
        ax.plot(t, signal[line_start:line_end],
                color='#00ff88', linewidth=0.5, alpha=0.8, label=f'SNR={snr}dB')
        ax.set_ylim(-0.3, 1.4)
        ax.set_title(f'Center line waveform', color='#668866', fontsize=8)
        ax.tick_params(colors='#335533', labelsize=5)
        ax.grid(True, color='#1a3a1a', alpha=0.3)
        if i == 0:
            ax.legend(fontsize=6, facecolor='#0a0a1a', edgecolor='#1a3a1a',
                      labelcolor='#88cc88')

        # Row 3: Error map (difference from original)
        ax = fig.add_subplot(gs[2, i])
        ax.set_facecolor('#0a0a1a')
        error = np.abs(earth - recon)
        ax.imshow(error, cmap='hot', vmin=0, vmax=0.5, aspect='equal')
        ax.set_title(f'Error map (PSNR={psnr:.1f} dB)', color='#cc8844', fontsize=9)
        ax.tick_params(colors='#664422', labelsize=6)

    plt.savefig(output_path, dpi=150, facecolor='#0a0a1a', bbox_inches='tight')
    plt.close()
    print(f"  Saved: {output_path}")


def plot_signal_spectrum(earth, output_path):
    """
    Show the frequency content of the composite video signal.
    """
    fig, axes = plt.subplots(2, 1, figsize=(14, 7), facecolor='#0a0a1a')
    fig.suptitle(
        'Pioneer 2 TV Camera — Signal Spectrum Analysis',
        fontsize=14, fontweight='bold', color='#00ff88', y=0.98
    )

    signal, _ = generate_signal_from_image(earth, snr_db=25)

    # Full spectrum
    ax = axes[0]
    ax.set_facecolor('#0a0a1a')
    n = len(signal)
    freqs = np.fft.rfftfreq(n, d=1.0)  # Normalized frequency
    spectrum = np.abs(np.fft.rfft(signal))
    spectrum_db = 20 * np.log10(spectrum + 1e-10)

    ax.plot(freqs[:n//4], spectrum_db[:n//4], color='#00ff88', linewidth=0.3, alpha=0.8)
    ax.set_ylabel('Magnitude (dB)', color='#88cc88', fontsize=9)
    ax.set_xlabel('Normalized Frequency', color='#88cc88', fontsize=9)
    ax.set_title('Full Signal Spectrum', color='#88cc88', fontsize=10)
    ax.tick_params(colors='#88cc88', labelsize=7)
    ax.grid(True, color='#1a3a1a', alpha=0.3)

    # Zoomed: line rate harmonics
    ax = axes[1]
    ax.set_facecolor('#0a0a1a')
    # The line rate produces spikes at multiples of 1/SAMPLES_PER_LINE
    line_freq = 1.0 / SAMPLES_PER_LINE
    zoom_end = int(20 * line_freq * n)  # Show first 20 harmonics
    if zoom_end > len(freqs):
        zoom_end = len(freqs)
    ax.plot(freqs[:zoom_end], spectrum_db[:zoom_end],
            color='#00ff88', linewidth=0.5, alpha=0.8)

    # Mark line rate harmonics
    for h in range(1, 15):
        f_h = h * line_freq
        ax.axvline(x=f_h, color='#ff6644', linewidth=0.3, alpha=0.4)
        if h <= 5:
            ax.text(f_h, ax.get_ylim()[1] - 5, f'H{h}',
                    color='#ff6644', fontsize=6, ha='center')

    ax.set_ylabel('Magnitude (dB)', color='#88cc88', fontsize=9)
    ax.set_xlabel('Normalized Frequency', color='#88cc88', fontsize=9)
    ax.set_title('Line Rate Harmonics (peaks at multiples of scan frequency)',
                 color='#88cc88', fontsize=10)
    ax.tick_params(colors='#88cc88', labelsize=7)
    ax.grid(True, color='#1a3a1a', alpha=0.3)

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.savefig(output_path, dpi=150, facecolor='#0a0a1a', bbox_inches='tight')
    plt.close()
    print(f"  Saved: {output_path}")


def main():
    print("=" * 60)
    print("Pioneer 2 TV Camera — Image Reconstruction Analysis")
    print("=" * 60)
    print()

    # Generate the Earth image
    print("Generating Earth image...")
    earth = create_earth_image(IMG_LINES, IMG_PIXELS, EARTH_RADIUS_PX)
    print(f"  Image: {IMG_LINES} x {IMG_PIXELS}")
    print()

    # Plot 1: Progressive reconstruction
    print("Generating progressive reconstruction (10%, 25%, 50%, 100%)...")
    prog_path = os.path.join(OUTPUT_DIR, "tv-reconstruction-progressive.png")
    plot_progressive_reconstruction(earth, prog_path)
    print()

    # Plot 2: Noise comparison (30, 20, 15, 5 dB)
    print("Generating noise comparison (4 SNR levels)...")
    noise_path = os.path.join(OUTPUT_DIR, "tv-reconstruction-noise.png")
    plot_noise_comparison(earth, noise_path)
    print()

    # Plot 3: Signal spectrum analysis
    print("Generating signal spectrum analysis...")
    spectrum_path = os.path.join(OUTPUT_DIR, "tv-reconstruction-spectrum.png")
    plot_signal_spectrum(earth, spectrum_path)
    print()

    # Summary statistics
    print("Reconstruction quality summary:")
    print("-" * 50)
    print(f"  {'SNR (dB)':<12} {'PSNR (dB)':<12} {'Quality'}")
    print("-" * 50)

    for snr, desc in [(30, 'Lab quality'), (20, 'Pioneer 2 actual'),
                       (15, 'Weak signal'), (5, 'Near noise floor')]:
        signal, tl = generate_signal_from_image(earth, snr_db=snr)
        recon = reconstruct_image(signal, tl, IMG_LINES, IMG_PIXELS)
        mse = np.mean((earth - recon)**2)
        psnr = 10 * np.log10(1.0 / mse) if mse > 0 else float('inf')
        print(f"  {snr:<12} {psnr:<12.1f} {desc}")

    print("-" * 50)
    print()
    print("=" * 60)
    print("Reconstruction analysis complete.")
    print()
    print("What the ground station engineers saw: a picture")
    print("building up line by line, each line a burst of")
    print("signal from 1,550 km away. The camera worked.")
    print("The image would have been remarkable — Earth")
    print("photographed by television from space.")
    print()
    print("But the third stage never fired, and Pioneer 2")
    print("flew for only 45 minutes. The image was never")
    print("completed. The technology was proven; the rocket")
    print("was not.")
    print("=" * 60)


if __name__ == "__main__":
    main()
