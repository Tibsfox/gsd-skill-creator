#!/usr/bin/env python3
"""
Explorer 6 Spin-Scan Camera Simulator
======================================
Mission 1.6 — Explorer 6 (S-2), August 7, 1959
First photograph of Earth from orbit

Simulates the spin-scan imaging process that produced the first TV image
of Earth from space. Explorer 6 carried a single photocell behind a slit.
As the spacecraft spun at 2.8 rpm, the photocell swept across the field
of view, measuring brightness at each angular position. One revolution
= one scan line. The brightness data was FM-modulated and transmitted
to the ground station at South Point, Hawaii, where it was recorded
on a strip-chart recorder.

The image was crude — a blurry crescent, barely recognizable as Earth.
But it was the first. Every weather satellite image descends from this.

This script:
  1. Generates a procedural Earth crescent (the source "scene")
  2. Simulates the photocell scanning process (one line per revolution)
  3. Adds distance-dependent Gaussian noise (signal degrades at apogee)
  4. Reconstructs the image line by line
  5. Displays original vs reconstructed side by side

Usage: python3 scanline-camera.py
Requires: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

# ============================================================
# CONFIGURATION
# ============================================================
IMAGE_WIDTH = 128          # Horizontal resolution (angular positions per scan)
IMAGE_HEIGHT = 96          # Number of scan lines (revolutions)
EARTH_RADIUS = 35          # Earth radius in pixels
EARTH_CENTER = (60, 48)    # Earth center position (x, y)
SPIN_RATE_RPM = 2.8        # Spacecraft spin rate
SCAN_LINES = 48            # Number of scan lines to simulate
NOISE_BASE = 0.05          # Base noise level (close range)
NOISE_GROWTH = 0.12        # Noise increase per scan line (distance effect)

# ============================================================
# STEP 1: Generate procedural Earth crescent
# ============================================================
def generate_earth_crescent(width, height, center, radius):
    """
    Create a simple Earth crescent image.

    The crescent is formed by:
    - A circular disk (Earth)
    - A shadow circle offset to the left (the dark side)
    - Cloud-like brightness variations on the sunlit side
    """
    img = np.zeros((height, width))

    y_coords, x_coords = np.mgrid[0:height, 0:width]

    # Earth disk
    dist_from_center = np.sqrt((x_coords - center[0])**2 +
                                (y_coords - center[1])**2)
    earth_mask = dist_from_center < radius

    # Sunlit crescent — brighter on the right side
    # Shadow offset simulates the terminator
    shadow_offset = radius * 0.6
    shadow_center = (center[0] - shadow_offset, center[1])
    dist_from_shadow = np.sqrt((x_coords - shadow_center[0])**2 +
                                (y_coords - shadow_center[1])**2)
    shadow_mask = dist_from_shadow < radius * 0.95

    # Crescent = Earth minus shadow
    crescent = earth_mask & ~shadow_mask

    # Brightness gradient — brighter toward the sunlit limb
    brightness = np.clip((x_coords - center[0] + radius) / (2 * radius), 0, 1)

    # Cloud patterns — Perlin-like noise
    np.random.seed(42)  # Reproducible
    cloud_noise = np.zeros_like(img)
    for scale in [4, 8, 16, 32]:
        noise = np.random.randn(height // scale + 2, width // scale + 2)
        # Bilinear upscale
        from numpy import interp
        y_idx = np.linspace(0, noise.shape[0] - 1, height)
        x_idx = np.linspace(0, noise.shape[1] - 1, width)
        for row in range(height):
            y0 = int(y_idx[row])
            y1 = min(y0 + 1, noise.shape[0] - 1)
            fy = y_idx[row] - y0
            for col in range(width):
                x0 = int(x_idx[col])
                x1 = min(x0 + 1, noise.shape[1] - 1)
                fx = x_idx[col] - x0
                val = (noise[y0, x0] * (1-fx) * (1-fy) +
                       noise[y0, x1] * fx * (1-fy) +
                       noise[y1, x0] * (1-fx) * fy +
                       noise[y1, x1] * fx * fy)
                cloud_noise[row, col] += val / scale

    cloud_noise = (cloud_noise - cloud_noise.min()) / (cloud_noise.max() - cloud_noise.min())

    # Assemble the image
    img[crescent] = brightness[crescent] * 0.7 + cloud_noise[crescent] * 0.3

    # Atmosphere glow at the limb
    limb_glow = np.exp(-((dist_from_center - radius) ** 2) / (2 * 3**2))
    limb_glow *= (dist_from_center > radius * 0.9) & (dist_from_center < radius * 1.3)
    img += limb_glow * 0.15

    return np.clip(img, 0, 1)

# ============================================================
# STEP 2: Simulate the spin-scan process
# ============================================================
def simulate_spinscan(source_image, num_scan_lines, noise_base, noise_growth):
    """
    Simulate Explorer 6's spin-scan camera.

    Each scan line samples brightness across one horizontal row of the
    source image. Noise increases with each scan line (simulating the
    spacecraft moving toward apogee = greater distance = weaker signal).

    Returns:
        scan_data: 2D array of sampled brightness values
        reconstructed: The reconstructed image
        noise_levels: Noise level for each scan line
    """
    height, width = source_image.shape
    scan_data = np.zeros((num_scan_lines, width))
    noise_levels = np.zeros(num_scan_lines)

    # Determine which rows to scan (evenly spaced across the image)
    scan_rows = np.linspace(
        height // 2 - num_scan_lines // 2,
        height // 2 + num_scan_lines // 2 - 1,
        num_scan_lines
    ).astype(int)
    scan_rows = np.clip(scan_rows, 0, height - 1)

    for i, row in enumerate(scan_rows):
        # Sample the source image along this row
        clean_signal = source_image[row, :]

        # Add distance-dependent noise
        # Explorer 6 orbit: 237 km perigee to 42,400 km apogee
        # Signal power falls as 1/r^2
        # Noise increases as spacecraft moves toward apogee
        orbit_fraction = i / max(num_scan_lines - 1, 1)
        distance_factor = 1.0 + orbit_fraction * 10.0  # Simplified distance model
        noise_sigma = noise_base + noise_growth * orbit_fraction ** 1.5
        noise_levels[i] = noise_sigma

        noise = np.random.randn(width) * noise_sigma

        # Quantization — the photocell had limited dynamic range
        quantized_signal = np.round(clean_signal * 16) / 16

        # Add noise to quantized signal
        noisy_signal = quantized_signal + noise

        # Clip to valid range
        scan_data[i, :] = np.clip(noisy_signal, 0, 1)

    # Reconstruct the image by placing scan lines at their positions
    reconstructed = np.zeros_like(source_image)
    for i, row in enumerate(scan_rows):
        reconstructed[row, :] = scan_data[i, :]

        # Smear each scan line vertically (the photocell slit has finite width)
        slit_width = max(1, height // (num_scan_lines * 2))
        for dy in range(-slit_width, slit_width + 1):
            target_row = row + dy
            if 0 <= target_row < height:
                weight = 1.0 - abs(dy) / (slit_width + 1)
                reconstructed[target_row, :] = np.maximum(
                    reconstructed[target_row, :],
                    scan_data[i, :] * weight
                )

    return scan_data, reconstructed, noise_levels

# ============================================================
# STEP 3: Visualize
# ============================================================
def main():
    print("Explorer 6 Spin-Scan Camera Simulator")
    print("=" * 50)
    print(f"Spacecraft spin rate: {SPIN_RATE_RPM} rpm")
    print(f"Period per scan line: {60.0 / SPIN_RATE_RPM:.1f} seconds")
    print(f"Simulating {SCAN_LINES} scan lines")
    print(f"Image resolution: {IMAGE_WIDTH} x {IMAGE_HEIGHT}")
    print()

    # Generate source Earth image
    print("Generating procedural Earth crescent...")
    source = generate_earth_crescent(IMAGE_WIDTH, IMAGE_HEIGHT,
                                      EARTH_CENTER, EARTH_RADIUS)

    # Simulate spin-scan process
    print("Simulating spin-scan camera acquisition...")
    scan_data, reconstructed, noise_levels = simulate_spinscan(
        source, SCAN_LINES, NOISE_BASE, NOISE_GROWTH
    )

    # Create phosphor-green colormap (like the actual CRT display)
    phosphor_cmap = LinearSegmentedColormap.from_list('phosphor', [
        (0.0, '#0A150A'),   # CRT dark
        (0.3, '#0D3D0D'),   # Dim green
        (0.6, '#33CC33'),   # Phosphor green
        (1.0, '#88FF88'),   # Bright phosphor
    ])

    # Plot results
    fig, axes = plt.subplots(2, 2, figsize=(14, 10),
                              facecolor='#0A0A0A')

    # Source image (what Explorer 6 was looking at)
    ax1 = axes[0, 0]
    ax1.imshow(source, cmap='gray', vmin=0, vmax=1)
    ax1.set_title('Source: Earth Crescent\n(what the photocell sees)',
                  color='#CCCCCC', fontsize=11)
    ax1.set_facecolor('#0A0A0A')
    ax1.tick_params(colors='#666666')

    # Raw scan data (strip chart)
    ax2 = axes[0, 1]
    ax2.imshow(scan_data, cmap=phosphor_cmap, aspect='auto', vmin=0, vmax=1)
    ax2.set_title(f'Scan Data: {SCAN_LINES} Lines\n(strip-chart recorder output)',
                  color='#33CC33', fontsize=11)
    ax2.set_xlabel('Angular position (degrees)', color='#666666')
    ax2.set_ylabel('Scan line #', color='#666666')
    ax2.set_facecolor('#0A150A')
    ax2.tick_params(colors='#666666')

    # Reconstructed image (phosphor green)
    ax3 = axes[1, 0]
    ax3.imshow(reconstructed, cmap=phosphor_cmap, vmin=0, vmax=1)
    ax3.set_title('Reconstructed Image\n(phosphor green CRT display)',
                  color='#33CC33', fontsize=11)
    ax3.set_facecolor('#0A150A')
    ax3.tick_params(colors='#666666')

    # Noise level plot
    ax4 = axes[1, 1]
    ax4.plot(range(SCAN_LINES), noise_levels, color='#D4A830', linewidth=2)
    ax4.fill_between(range(SCAN_LINES), noise_levels,
                     alpha=0.3, color='#D4A830')
    ax4.set_title('Noise vs. Scan Line\n(signal degrades with distance)',
                  color='#D4A830', fontsize=11)
    ax4.set_xlabel('Scan line number', color='#666666')
    ax4.set_ylabel('Noise level (sigma)', color='#666666')
    ax4.set_facecolor('#0A0A0A')
    ax4.tick_params(colors='#666666')
    ax4.spines['bottom'].set_color('#333333')
    ax4.spines['left'].set_color('#333333')
    ax4.spines['top'].set_visible(False)
    ax4.spines['right'].set_visible(False)

    # Add altitude annotation
    ax4.annotate('Perigee\n237 km', xy=(0, noise_levels[0]),
                 xytext=(5, noise_levels[0] + 0.05),
                 color='#33CC33', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#33CC33'))
    ax4.annotate('Apogee\n42,400 km', xy=(SCAN_LINES-1, noise_levels[-1]),
                 xytext=(SCAN_LINES-15, noise_levels[-1] - 0.03),
                 color='#FF6666', fontsize=9,
                 arrowprops=dict(arrowstyle='->', color='#FF6666'))

    fig.suptitle('Explorer 6 — First Photograph of Earth from Orbit\n'
                 'August 14, 1959 | South Point, Hawaii Ground Station',
                 color='#CCCCCC', fontsize=14, fontweight='bold')
    plt.tight_layout(rect=[0, 0, 1, 0.93])
    plt.savefig('explorer6-scanline-output.png', dpi=150, facecolor='#0A0A0A',
                bbox_inches='tight')
    print("Saved: explorer6-scanline-output.png")
    plt.show()

    # Print statistics
    print()
    print("Scan Statistics:")
    print(f"  Total scan time: {SCAN_LINES * 60.0 / SPIN_RATE_RPM:.0f} seconds "
          f"({SCAN_LINES * 60.0 / SPIN_RATE_RPM / 60:.1f} minutes)")
    print(f"  Noise at first scan line: {noise_levels[0]:.3f}")
    print(f"  Noise at last scan line:  {noise_levels[-1]:.3f}")
    print(f"  SNR degradation: {noise_levels[-1] / max(noise_levels[0], 1e-6):.1f}x")
    print()
    print("  The image that changed everything was barely recognizable.")
    print("  It was enough.")

if __name__ == '__main__':
    main()
