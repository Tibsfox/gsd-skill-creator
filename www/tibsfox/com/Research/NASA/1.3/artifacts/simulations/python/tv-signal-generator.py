#!/usr/bin/env python3
"""
Pioneer 2 TV Camera — Composite Video Signal Generator
======================================================
NASA Mission Series v1.3 — Pioneer 2

Generates a complete simulated Pioneer 2 TV camera signal.

Pioneer 2 (November 8, 1958) carried the first TV camera on a Pioneer
spacecraft — a vidicon tube system intended to photograph the Moon from
orbit. Since the third stage never fired, the spacecraft only reached
1,550 km altitude. The camera could only point back at Earth.

This script:
  1. Creates a simulated Earth image as seen from 1,550 km
     (circular disk with cloud patterns against black space)
  2. Scans the image line-by-line in a raster pattern
  3. Generates composite video: H-sync + video level per line
  4. Adds vertical sync between frames
  5. Adds realistic thermal noise (1958 signal-to-noise ratio)
  6. Reconstructs the image from the signal
  7. Saves plots as PNG

The output simulates what a ground station oscilloscope would show
as Pioneer 2's telemetry signal arrived.

Hardware reference:
  - Vidicon tube: ~150-200 scan lines
  - Frame rate: ~1 frame per several seconds (slow-scan)
  - Signal: modulated subcarrier on 108 MHz telemetry
  - Bandwidth: narrow (matching telemetry data rate)

Libraries: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
import os

# ============================================================
# PARAMETERS — real Pioneer 2 mission values where known
# ============================================================

# Image parameters
IMG_LINES = 160          # Approximate vidicon scan lines
IMG_PIXELS = 200         # Pixels per line (horizontal resolution)
EARTH_RADIUS_PX = 60     # Earth disk radius in pixels

# Signal parameters
SAMPLE_RATE = 100000     # Samples per second (normalized)
SAMPLES_PER_LINE = 500   # Samples per scan line
SYNC_SAMPLES = 50        # Horizontal sync pulse width
BLANK_SAMPLES = 30       # Front/back porch
ACTIVE_SAMPLES = SAMPLES_PER_LINE - SYNC_SAMPLES - 2 * BLANK_SAMPLES

# Signal levels (normalized 0-1)
SYNC_LEVEL = 0.0         # Sync tip (lowest)
BLANK_LEVEL = 0.15       # Blanking level
BLACK_LEVEL = 0.2        # Black (space)
WHITE_LEVEL = 1.0        # Peak white

# Noise
SNR_DB = 20              # Signal-to-noise ratio (1958 technology)

# Vertical sync
VSYNC_LINES = 6          # Lines used for vertical sync

# Output directory
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_earth_image(lines, pixels, radius):
    """
    Create a simulated Earth as seen from 1,550 km altitude.

    From 1,550 km, Earth subtends about 136 degrees of the field
    of view. The visible disk shows:
      - Blue ocean (dominant)
      - White cloud swirls
      - Green/brown landmass hints
      - Bright limb (atmosphere)
      - Black space beyond the disk
    """
    img = np.zeros((lines, pixels))

    cy, cx = lines // 2, pixels // 2  # Earth center

    for y in range(lines):
        for x in range(pixels):
            # Distance from center
            dy = (y - cy) / radius
            dx = (x - cx) / radius
            r = np.sqrt(dx**2 + dy**2)

            if r > 1.0:
                # Space — black
                img[y, x] = 0.0
            elif r > 0.95:
                # Atmosphere limb — bright blue-white glow
                limb_factor = (1.0 - r) / 0.05
                img[y, x] = 0.7 + 0.3 * limb_factor
            else:
                # Earth surface — base brightness with features
                # Latitude-dependent: brighter near poles (ice/clouds)
                lat = dy  # -1 to 1
                base = 0.35 + 0.15 * abs(lat)

                # Cloud patterns — use sine waves for swirl approximation
                cloud1 = 0.15 * np.sin(6.0 * dx + 2.0 * dy + 1.5)
                cloud2 = 0.10 * np.sin(3.0 * dx - 5.0 * dy + 0.8)
                cloud3 = 0.08 * np.cos(8.0 * dx + 4.0 * dy)

                # Continental hints — rough shapes
                continent = 0.0
                # North America-ish region
                if -0.3 < dx < 0.2 and 0.1 < dy < 0.5:
                    continent = 0.08 * np.exp(-((dx + 0.05)**2 + (dy - 0.3)**2) / 0.04)
                # South America-ish region
                if -0.1 < dx < 0.15 and -0.5 < dy < -0.1:
                    continent = 0.06 * np.exp(-((dx - 0.02)**2 + (dy + 0.3)**2) / 0.03)

                brightness = base + cloud1 + cloud2 + cloud3 + continent
                img[y, x] = np.clip(brightness, 0.1, 0.9)

    return img


def image_to_composite_signal(img, add_noise=True, snr_db=SNR_DB):
    """
    Convert an image to a composite video signal with sync pulses.

    Signal structure per line:
      [H-sync pulse] [back porch] [active video] [front porch]

    The sync pulse is at SYNC_LEVEL (0V).
    Blanking is at BLANK_LEVEL.
    Video ranges from BLACK_LEVEL to WHITE_LEVEL.
    """
    lines, pixels = img.shape
    total_lines = lines + VSYNC_LINES
    signal = np.zeros(total_lines * SAMPLES_PER_LINE)

    for line_num in range(total_lines):
        offset = line_num * SAMPLES_PER_LINE

        if line_num < VSYNC_LINES:
            # Vertical sync — broad pulses (inverted from normal)
            # Serrated vertical sync pulse
            half = SAMPLES_PER_LINE // 2
            # First half: sync
            signal[offset:offset + half - 20] = SYNC_LEVEL
            signal[offset + half - 20:offset + half] = BLANK_LEVEL
            # Second half: sync
            signal[offset + half:offset + SAMPLES_PER_LINE - 20] = SYNC_LEVEL
            signal[offset + SAMPLES_PER_LINE - 20:offset + SAMPLES_PER_LINE] = BLANK_LEVEL
        else:
            img_line = line_num - VSYNC_LINES

            # Horizontal sync pulse
            signal[offset:offset + SYNC_SAMPLES] = SYNC_LEVEL

            # Back porch (blanking level)
            signal[offset + SYNC_SAMPLES:offset + SYNC_SAMPLES + BLANK_SAMPLES] = BLANK_LEVEL

            # Active video — scan one line of the image
            active_start = offset + SYNC_SAMPLES + BLANK_SAMPLES
            active_end = active_start + ACTIVE_SAMPLES

            if img_line < lines:
                # Resample image line to fill active samples
                x_img = np.linspace(0, pixels - 1, ACTIVE_SAMPLES)
                x_idx = np.clip(x_img.astype(int), 0, pixels - 1)
                video = img[img_line, x_idx]

                # Map image brightness to video levels
                signal[active_start:active_end] = (
                    BLACK_LEVEL + video * (WHITE_LEVEL - BLACK_LEVEL)
                )
            else:
                signal[active_start:active_end] = BLACK_LEVEL

            # Front porch (blanking level)
            front_start = active_end
            front_end = offset + SAMPLES_PER_LINE
            if front_end > front_start:
                signal[front_start:front_end] = BLANK_LEVEL

    # Add noise
    if add_noise:
        noise_power = np.mean(signal**2) / (10**(snr_db / 10))
        noise = np.random.normal(0, np.sqrt(noise_power), len(signal))
        signal = signal + noise

    return signal, total_lines


def reconstruct_from_signal(signal, total_lines, img_lines, img_pixels):
    """
    Reconstruct the image from the composite video signal.

    This simulates what the ground station engineers did:
    1. Find horizontal sync pulses (falling edge below threshold)
    2. Extract video data between syncs
    3. Map to pixel brightness values
    """
    reconstructed = np.zeros((img_lines, img_pixels))

    # Find sync pulses by thresholding
    sync_threshold = (SYNC_LEVEL + BLANK_LEVEL) / 2

    # Walk through signal finding line starts
    line_starts = []
    in_sync = False
    for i in range(len(signal) - 1):
        if not in_sync and signal[i] < sync_threshold:
            in_sync = True
            line_starts.append(i)
        elif in_sync and signal[i] > sync_threshold + 0.05:
            in_sync = False

    # Extract video from each detected line
    img_line = 0
    for start in line_starts:
        if img_line >= img_lines:
            break

        # Skip sync + back porch
        video_start = start + SYNC_SAMPLES + BLANK_SAMPLES
        video_end = video_start + ACTIVE_SAMPLES

        if video_end > len(signal):
            break

        # Check if this is a video line (not vsync)
        # Vsync lines have broad pulses — check for video levels
        segment = signal[video_start:video_end]
        if np.mean(segment) > sync_threshold:
            # This is a video line — extract and resample
            x_sig = np.linspace(0, len(segment) - 1, img_pixels)
            x_idx = np.clip(x_sig.astype(int), 0, len(segment) - 1)
            line_data = segment[x_idx]

            # Map video levels back to brightness
            brightness = (line_data - BLACK_LEVEL) / (WHITE_LEVEL - BLACK_LEVEL)
            reconstructed[img_line, :] = np.clip(brightness, 0, 1)
            img_line += 1

    return reconstructed


def plot_composite_signal(signal, total_lines, output_path):
    """
    Plot the composite video signal for several scan lines,
    showing sync pulses and video content.
    """
    fig, axes = plt.subplots(4, 1, figsize=(14, 10), facecolor='#1a1a2e')
    fig.suptitle(
        'Pioneer 2 TV Camera — Composite Video Signal',
        fontsize=16, fontweight='bold', color='#00ff88', y=0.98
    )

    # Colors for 1958 oscilloscope feel
    trace_color = '#00ff88'
    grid_color = '#1a3a1a'
    bg_color = '#0a0a1a'
    text_color = '#88cc88'

    # Panel 1: Vertical sync region (first few lines)
    ax = axes[0]
    ax.set_facecolor(bg_color)
    start = 0
    end = VSYNC_LINES * SAMPLES_PER_LINE + 2 * SAMPLES_PER_LINE
    t = np.arange(start, end) / SAMPLE_RATE * 1000
    ax.plot(t, signal[start:end], color=trace_color, linewidth=0.5, alpha=0.9)
    ax.axhline(y=SYNC_LEVEL, color='#ff4444', linewidth=0.5, linestyle='--', alpha=0.5)
    ax.axhline(y=BLANK_LEVEL, color='#4444ff', linewidth=0.5, linestyle='--', alpha=0.5)
    ax.set_ylabel('Amplitude', color=text_color, fontsize=9)
    ax.set_title('Vertical Sync + First Lines', color=text_color, fontsize=10)
    ax.set_ylim(-0.15, 1.15)
    ax.tick_params(colors=text_color, labelsize=7)
    ax.grid(True, color=grid_color, alpha=0.3)

    # Panel 2: Several active scan lines (lines 40-43, through the Earth disk)
    ax = axes[1]
    ax.set_facecolor(bg_color)
    line_start = (VSYNC_LINES + 40) * SAMPLES_PER_LINE
    line_end = (VSYNC_LINES + 44) * SAMPLES_PER_LINE
    t = np.arange(line_start, line_end) / SAMPLE_RATE * 1000
    ax.plot(t, signal[line_start:line_end], color=trace_color, linewidth=0.5, alpha=0.9)
    ax.axhline(y=SYNC_LEVEL, color='#ff4444', linewidth=0.5, linestyle='--', alpha=0.5)
    ax.axhline(y=BLANK_LEVEL, color='#4444ff', linewidth=0.5, linestyle='--', alpha=0.5)
    ax.set_ylabel('Amplitude', color=text_color, fontsize=9)
    ax.set_title('Scan Lines 40-43 (upper Earth disk — limb visible)', color=text_color, fontsize=10)
    ax.set_ylim(-0.15, 1.15)
    ax.tick_params(colors=text_color, labelsize=7)
    ax.grid(True, color=grid_color, alpha=0.3)

    # Panel 3: Center lines (lines 78-81, through Earth center)
    ax = axes[2]
    ax.set_facecolor(bg_color)
    center = IMG_LINES // 2
    line_start = (VSYNC_LINES + center - 2) * SAMPLES_PER_LINE
    line_end = (VSYNC_LINES + center + 2) * SAMPLES_PER_LINE
    t = np.arange(line_start, line_end) / SAMPLE_RATE * 1000
    ax.plot(t, signal[line_start:line_end], color=trace_color, linewidth=0.5, alpha=0.9)
    ax.axhline(y=SYNC_LEVEL, color='#ff4444', linewidth=0.5, linestyle='--', alpha=0.5)
    ax.axhline(y=BLANK_LEVEL, color='#4444ff', linewidth=0.5, linestyle='--', alpha=0.5)
    ax.set_ylabel('Amplitude', color=text_color, fontsize=9)
    ax.set_title(f'Scan Lines {center-2}-{center+1} (Earth center — clouds, continents)',
                 color=text_color, fontsize=10)
    ax.set_ylim(-0.15, 1.15)
    ax.tick_params(colors=text_color, labelsize=7)
    ax.grid(True, color=grid_color, alpha=0.3)

    # Panel 4: Single line detail with annotations
    ax = axes[3]
    ax.set_facecolor(bg_color)
    detail_line = VSYNC_LINES + center
    line_start = detail_line * SAMPLES_PER_LINE
    line_end = line_start + SAMPLES_PER_LINE
    t = np.arange(0, SAMPLES_PER_LINE)
    ax.plot(t, signal[line_start:line_end], color=trace_color, linewidth=1.0, alpha=0.9)

    # Annotate signal regions
    ax.axvspan(0, SYNC_SAMPLES, alpha=0.15, color='red', label='H-Sync')
    ax.axvspan(SYNC_SAMPLES, SYNC_SAMPLES + BLANK_SAMPLES, alpha=0.15, color='blue', label='Back Porch')
    ax.axvspan(SYNC_SAMPLES + BLANK_SAMPLES,
               SYNC_SAMPLES + BLANK_SAMPLES + ACTIVE_SAMPLES,
               alpha=0.08, color='green', label='Active Video')
    ax.axvspan(SYNC_SAMPLES + BLANK_SAMPLES + ACTIVE_SAMPLES,
               SAMPLES_PER_LINE, alpha=0.15, color='blue')

    ax.axhline(y=SYNC_LEVEL, color='#ff4444', linewidth=0.5, linestyle='--', alpha=0.5)
    ax.axhline(y=BLANK_LEVEL, color='#4444ff', linewidth=0.5, linestyle='--', alpha=0.5)
    ax.axhline(y=BLACK_LEVEL, color='#666666', linewidth=0.5, linestyle=':', alpha=0.5)
    ax.axhline(y=WHITE_LEVEL, color='#ffffff', linewidth=0.5, linestyle=':', alpha=0.3)

    # Labels
    ax.text(SYNC_SAMPLES / 2, -0.1, 'SYNC', ha='center', fontsize=7, color='#ff6666')
    ax.text(SYNC_SAMPLES + BLANK_SAMPLES / 2, -0.1, 'BP', ha='center', fontsize=7, color='#6666ff')
    ax.text(SYNC_SAMPLES + BLANK_SAMPLES + ACTIVE_SAMPLES / 2, -0.1,
            'ACTIVE VIDEO', ha='center', fontsize=7, color='#66ff66')

    ax.set_ylabel('Amplitude', color=text_color, fontsize=9)
    ax.set_xlabel('Sample', color=text_color, fontsize=9)
    ax.set_title(f'Single Line Detail (Line {center}) — Signal Anatomy',
                 color=text_color, fontsize=10)
    ax.set_ylim(-0.2, 1.2)
    ax.legend(loc='upper right', fontsize=7, facecolor=bg_color,
              edgecolor=grid_color, labelcolor=text_color)
    ax.tick_params(colors=text_color, labelsize=7)
    ax.grid(True, color=grid_color, alpha=0.3)

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig(output_path, dpi=150, facecolor='#1a1a2e', bbox_inches='tight')
    plt.close()
    print(f"  Saved: {output_path}")


def plot_reconstruction(original, reconstructed, output_path):
    """
    Plot original image and reconstructed image side by side.
    """
    fig, axes = plt.subplots(1, 2, figsize=(12, 5), facecolor='#1a1a2e')
    fig.suptitle(
        'Pioneer 2 TV Camera — Earth from 1,550 km',
        fontsize=14, fontweight='bold', color='#00ff88', y=0.98
    )

    # Original (what the camera sensor captured)
    ax = axes[0]
    ax.imshow(original, cmap='gray', vmin=0, vmax=1, aspect='equal')
    ax.set_title('Camera Sensor Image\n(photoconductive target)',
                 color='#88cc88', fontsize=10)
    ax.tick_params(colors='#88cc88', labelsize=7)

    # Reconstructed from composite signal
    ax = axes[1]
    ax.imshow(reconstructed, cmap='gray', vmin=0, vmax=1, aspect='equal')
    ax.set_title(f'Reconstructed from Signal\n(SNR = {SNR_DB} dB — ground station)',
                 color='#88cc88', fontsize=10)
    ax.tick_params(colors='#88cc88', labelsize=7)

    plt.tight_layout(rect=[0, 0, 1, 0.93])
    plt.savefig(output_path, dpi=150, facecolor='#1a1a2e', bbox_inches='tight')
    plt.close()
    print(f"  Saved: {output_path}")


def main():
    print("=" * 60)
    print("Pioneer 2 TV Camera — Composite Video Signal Generator")
    print("=" * 60)
    print()

    # Step 1: Generate Earth image
    print("Generating Earth image as seen from 1,550 km...")
    earth = create_earth_image(IMG_LINES, IMG_PIXELS, EARTH_RADIUS_PX)
    print(f"  Image: {IMG_LINES} x {IMG_PIXELS} pixels")
    print(f"  Earth disk radius: {EARTH_RADIUS_PX} px")
    print()

    # Step 2: Generate composite video signal
    print("Generating composite video signal...")
    signal, total_lines = image_to_composite_signal(earth, add_noise=True, snr_db=SNR_DB)
    print(f"  Total signal length: {len(signal):,} samples")
    print(f"  Total lines: {total_lines} ({VSYNC_LINES} vsync + {IMG_LINES} video)")
    print(f"  Samples per line: {SAMPLES_PER_LINE}")
    print(f"  Active video samples: {ACTIVE_SAMPLES}")
    print(f"  SNR: {SNR_DB} dB")
    print()

    # Step 3: Reconstruct image from signal
    print("Reconstructing image from composite signal...")
    reconstructed = reconstruct_from_signal(signal, total_lines, IMG_LINES, IMG_PIXELS)

    # Compute reconstruction quality
    mse = np.mean((earth - reconstructed)**2)
    psnr = 10 * np.log10(1.0 / mse) if mse > 0 else float('inf')
    print(f"  Reconstruction PSNR: {psnr:.1f} dB")
    print()

    # Step 4: Generate plots
    print("Generating plots...")
    signal_path = os.path.join(OUTPUT_DIR, "tv-signal-composite.png")
    plot_composite_signal(signal, total_lines, signal_path)

    recon_path = os.path.join(OUTPUT_DIR, "tv-signal-reconstruction.png")
    plot_reconstruction(earth, reconstructed, recon_path)

    # Step 5: Save raw signal data for the reconstruction script
    signal_data_path = os.path.join(OUTPUT_DIR, "tv-signal-raw.npy")
    np.save(signal_data_path, signal)
    print(f"  Saved raw signal: {signal_data_path}")
    print(f"  Signal data shape: {signal.shape}")

    # Save image parameters for reconstruction script
    params = {
        'img_lines': IMG_LINES,
        'img_pixels': IMG_PIXELS,
        'samples_per_line': SAMPLES_PER_LINE,
        'sync_samples': SYNC_SAMPLES,
        'blank_samples': BLANK_SAMPLES,
        'active_samples': ACTIVE_SAMPLES,
        'sync_level': SYNC_LEVEL,
        'blank_level': BLANK_LEVEL,
        'black_level': BLACK_LEVEL,
        'white_level': WHITE_LEVEL,
        'vsync_lines': VSYNC_LINES,
        'total_lines': total_lines,
        'snr_db': SNR_DB,
    }
    params_path = os.path.join(OUTPUT_DIR, "tv-signal-params.npy")
    np.save(params_path, params)
    print(f"  Saved parameters: {params_path}")

    print()
    print("=" * 60)
    print("Signal generation complete.")
    print()
    print("Pioneer 2 flew for ~45 minutes, reaching 1,550 km.")
    print("The TV camera worked. The third stage did not.")
    print("This is the signal that would have been received")
    print("at the ground station — Earth, not the Moon.")
    print("=" * 60)


if __name__ == "__main__":
    main()
