#!/usr/bin/env python3
"""
Room & Microphone Calibration Test for gsd-skill-creator
=========================================================

Measures the frequency response of your speaker-room-microphone chain
and generates an inverse correction curve for flat-as-possible monitoring.

This tool:
  1. Detects available audio hardware (PipeWire/PulseAudio)
  2. Walks you through a safe volume calibration with test tones
  3. Captures room noise floor
  4. Plays a log sweep and records the room response
  5. Derives the mains frequency from room hum
  6. Measures round-trip audio latency
  7. Generates a frequency response report and correction EQ curve
  8. Saves calibration data for use by other tools

WARNING: This test plays audio through your speakers.
         It will ALWAYS start at zero volume and ask you to adjust.
         Never run this test with headphones at unknown volume.

Requirements:
  - PipeWire or PulseAudio running
  - ffmpeg installed
  - At least one audio output (speakers) and one audio input (microphone)
  - Python 3.8+ with numpy

Usage:
  python3 scripts/nasa/room-calibration.py
  python3 scripts/nasa/room-calibration.py --rate 96000
  python3 scripts/nasa/room-calibration.py --rate 192000 --skip-volume-cal
  python3 scripts/nasa/room-calibration.py --report-only /path/to/calibration.json

Part of the NASA Mission Series simulation and measurement infrastructure.
Calibration data feeds into Track 5 (Simulation) and Track 6 (QA).
"""
import argparse
import json
import math
import os
import signal
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

try:
    import numpy as np
except ImportError:
    print("ERROR: numpy is required. Install with: pip install numpy")
    sys.exit(1)


# ─── Constants ───────────────────────────────────────────────────────────────

VERSION = "1.0.0"
DEFAULT_RATE = 48000
SUPPORTED_RATES = [44100, 48000, 96000, 192000]
SWEEP_DURATION = 10  # seconds
NOISE_FLOOR_DURATION = 3  # seconds
LATENCY_TEST_DURATION = 3  # seconds
CALIBRATION_DIR = Path("data/calibration")
AMPLITUDE_SAFE_START = 0.02  # very quiet initial test tone
AMPLITUDE_CALIBRATION = 0.15  # moderate level for calibration tone
AMPLITUDE_SWEEP = 0.30  # sweep level (after user confirms volume)


# ─── Terminal helpers ────────────────────────────────────────────────────────

class Colors:
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    DIM = "\033[2m"
    RESET = "\033[0m"

def banner(text):
    width = max(60, len(text) + 4)
    print(f"\n{Colors.BLUE}{'═' * width}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {text}{Colors.RESET}")
    print(f"{Colors.BLUE}{'═' * width}{Colors.RESET}\n")

def warn(text):
    print(f"{Colors.YELLOW}⚠  {text}{Colors.RESET}")

def info(text):
    print(f"{Colors.CYAN}ℹ  {text}{Colors.RESET}")

def ok(text):
    print(f"{Colors.GREEN}✓  {text}{Colors.RESET}")

def err(text):
    print(f"{Colors.RED}✗  {text}{Colors.RESET}")

def step(n, total, text):
    print(f"\n{Colors.BOLD}[{n}/{total}] {text}{Colors.RESET}")
    print(f"{Colors.DIM}{'─' * 50}{Colors.RESET}")

def ask(prompt, default=None):
    suffix = f" [{default}]" if default else ""
    try:
        response = input(f"{Colors.BOLD}?  {prompt}{suffix}: {Colors.RESET}").strip()
        return response if response else default
    except (EOFError, KeyboardInterrupt):
        print()
        return default


# ─── Audio hardware detection ────────────────────────────────────────────────

def detect_audio_system():
    """Detect PipeWire/PulseAudio and available devices."""
    result = {"system": None, "version": None, "outputs": [], "inputs": [],
              "default_output": None, "default_input": None, "rate": None}

    # Check PipeWire
    try:
        pw = subprocess.run(["pactl", "info"], capture_output=True, text=True, timeout=5)
        if pw.returncode == 0:
            for line in pw.stdout.split("\n"):
                if "Server Name" in line:
                    result["system"] = line.split(":", 1)[1].strip()
                elif "Server Version" in line:
                    result["version"] = line.split(":", 1)[1].strip()
                elif "Default Sink" in line:
                    result["default_output"] = line.split(":", 1)[1].strip()
                elif "Default Source" in line:
                    result["default_input"] = line.split(":", 1)[1].strip()
                elif "Default Sample Specification" in line:
                    spec = line.split(":", 1)[1].strip()
                    # Parse "float32le 2ch 48000Hz"
                    for part in spec.split():
                        if part.endswith("Hz"):
                            result["rate"] = int(part[:-2])
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # List capture devices
    try:
        rec = subprocess.run(["arecord", "-l"], capture_output=True, text=True, timeout=5)
        if rec.returncode == 0:
            for line in rec.stdout.split("\n"):
                if line.startswith("card"):
                    result["inputs"].append(line.strip())
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # List playback devices
    try:
        play = subprocess.run(["aplay", "-l"], capture_output=True, text=True, timeout=5)
        if play.returncode == 0:
            for line in play.stdout.split("\n"):
                if line.startswith("card"):
                    result["outputs"].append(line.strip())
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    return result


def check_prerequisites():
    """Verify all required tools are available."""
    required = ["ffmpeg", "pw-record", "pw-play"]
    missing = []
    for tool in required:
        try:
            subprocess.run(["which", tool], capture_output=True, timeout=5)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            missing.append(tool)

    if missing:
        err(f"Missing required tools: {', '.join(missing)}")
        info("Install with: sudo apt install pipewire ffmpeg")
        return False
    return True


# ─── Audio generation ────────────────────────────────────────────────────────

def generate_sine(freq, duration, rate, amplitude=0.3):
    """Generate a pure sine tone."""
    t = np.linspace(0, duration, int(rate * duration), dtype=np.float32)
    tone = (amplitude * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    # Fade in/out 20ms
    fade = int(0.02 * rate)
    if fade > 0 and len(tone) > 2 * fade:
        tone[:fade] *= np.linspace(0, 1, fade).astype(np.float32)
        tone[-fade:] *= np.linspace(1, 0, fade).astype(np.float32)
    return tone


def generate_log_sweep(f_start, f_end, duration, rate, amplitude=0.3):
    """Generate a logarithmic frequency sweep."""
    n_samples = int(rate * duration)
    t = np.linspace(0, duration, n_samples, dtype=np.float32)
    ratio = f_end / f_start
    sweep = amplitude * np.sin(
        2 * np.pi * f_start * duration / np.log(ratio) *
        (np.exp(t / duration * np.log(ratio)) - 1)
    )
    sweep = sweep.astype(np.float32)
    # Fade in/out 100ms
    fade = int(0.1 * rate)
    if fade > 0 and len(sweep) > 2 * fade:
        sweep[:fade] *= np.linspace(0, 1, fade).astype(np.float32)
        sweep[-fade:] *= np.linspace(1, 0, fade).astype(np.float32)
    return sweep


def generate_clicks(n_clicks, spacing_s, rate, amplitude=0.5):
    """Generate a series of click impulses for latency measurement."""
    duration = spacing_s * (n_clicks + 1)
    n_samples = int(rate * duration)
    audio = np.zeros(n_samples, dtype=np.float32)
    click_len = int(0.001 * rate)  # 1ms click
    for i in range(n_clicks):
        pos = int((i + 1) * spacing_s * rate)
        if pos + click_len < n_samples:
            audio[pos:pos + click_len] = amplitude * np.sin(
                2 * np.pi * 1000 * np.arange(click_len) / rate
            ).astype(np.float32)
    return audio


def write_wav(samples, path, rate):
    """Write float32 samples to WAV via ffmpeg."""
    raw_path = path + ".raw"
    samples.tofile(raw_path)
    subprocess.run([
        "ffmpeg", "-y", "-f", "f32le", "-ar", str(rate), "-ac", "1",
        "-i", raw_path, path
    ], capture_output=True, timeout=30)
    os.unlink(raw_path)
    return path


def read_wav(path, rate):
    """Read WAV to float32 samples via ffmpeg."""
    result = subprocess.run([
        "ffmpeg", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(rate), "-"
    ], capture_output=True, timeout=30)
    return np.frombuffer(result.stdout, dtype=np.float32)


def play_audio(path, wait=True):
    """Play a WAV file through PipeWire."""
    proc = subprocess.Popen(
        ["pw-play", path],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    if wait:
        proc.wait()
    return proc


def record_audio(path, duration, rate, fmt="f32"):
    """Record audio from default input via PipeWire."""
    proc = subprocess.Popen(
        ["pw-record", "--channels", "1", "--rate", str(rate), "--format", fmt, path],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    time.sleep(duration)
    proc.terminate()
    proc.wait()
    return path


# ─── Analysis functions ──────────────────────────────────────────────────────

def analyze_noise_floor(samples, rate):
    """Analyze room noise floor."""
    rms = float(np.sqrt(np.mean(samples ** 2)))
    peak = float(np.max(np.abs(samples)))
    db_rms = 20 * math.log10(rms + 1e-10)
    db_peak = 20 * math.log10(peak + 1e-10)

    # FFT for spectral content
    fft = np.fft.rfft(samples)
    freqs = np.fft.rfftfreq(len(samples), 1.0 / rate)
    mag = np.abs(fft)

    # Find dominant frequencies
    mask = (freqs >= 20) & (freqs <= rate // 2)
    top_idx = np.argsort(mag[mask])[-5:][::-1]
    top_freqs = [(float(freqs[mask][i]), float(mag[mask][i])) for i in top_idx]

    return {
        "rms": rms, "peak": peak,
        "rms_dbfs": db_rms, "peak_dbfs": db_peak,
        "dominant_frequencies": top_freqs
    }


def derive_mains_frequency(samples, rate):
    """Derive AC mains frequency from room hum."""
    fft = np.fft.rfft(samples)
    freqs = np.fft.rfftfreq(len(samples), 1.0 / rate)
    mag = np.abs(fft)

    # Check 50Hz and 60Hz regions
    results = {}
    for target in [50, 60]:
        mask = (freqs >= target - 2) & (freqs <= target + 2)
        if np.any(mask):
            idx = np.argmax(mag[mask])
            results[target] = {
                "frequency": float(freqs[mask][idx]),
                "magnitude": float(mag[mask][idx]),
                "phase_deg": float(np.degrees(np.angle(fft[np.argmin(np.abs(freqs - target))])))
            }

    # Determine which mains frequency
    if 60 in results and 50 in results:
        if results[60]["magnitude"] > results[50]["magnitude"]:
            mains = results[60]
            mains["nominal"] = 60
        else:
            mains = results[50]
            mains["nominal"] = 50
    elif 60 in results:
        mains = results[60]
        mains["nominal"] = 60
    elif 50 in results:
        mains = results[50]
        mains["nominal"] = 50
    else:
        mains = {"frequency": 0, "magnitude": 0, "phase_deg": 0, "nominal": 0}

    return mains


def measure_latency(captured, original_clicks, rate, n_clicks=4, spacing=0.5):
    """Measure round-trip latency from click pattern."""
    # Energy envelope
    win = int(0.005 * rate)  # 5ms window
    hop = win // 4
    energy = np.array([
        np.sum(captured[i:i + win] ** 2)
        for i in range(0, len(captured) - win, hop)
    ])

    threshold = np.max(energy) * 0.1
    peaks = []
    in_peak = False
    for i, e in enumerate(energy):
        if e > threshold and not in_peak:
            peaks.append(i * hop)
            in_peak = True
        elif e < threshold * 0.3:
            in_peak = False

    if len(peaks) < 2:
        return {"total_ms": None, "software_ms": None, "peaks_found": len(peaks)}

    # Find the clicks by looking for consistent spacing
    expected_spacing = int(spacing * rate)
    tolerance = int(0.05 * rate)  # 50ms tolerance

    # Find first pair with correct spacing
    first_click = None
    for i in range(len(peaks) - 1):
        gap = peaks[i + 1] - peaks[i]
        if abs(gap - expected_spacing) < tolerance:
            first_click = peaks[i]
            break

    if first_click is None:
        return {"total_ms": None, "software_ms": None, "peaks_found": len(peaks)}

    # First click was at spacing_s into the original file
    # Recording started ~200ms before playback
    rec_start_offset = 0.2  # seconds
    click_offset_in_file = spacing  # seconds
    expected_arrival = (rec_start_offset + click_offset_in_file) * rate

    total_delay_samples = first_click - int(expected_arrival)
    total_delay_ms = total_delay_samples / rate * 1000

    return {
        "total_ms": float(abs(total_delay_ms)),
        "software_ms": float(abs(total_delay_ms)),  # acoustic path unknown without user input
        "peaks_found": len(peaks),
        "first_click_sample": int(first_click),
        "first_click_ms": float(first_click / rate * 1000)
    }


def compute_frequency_response(captured, original, rate):
    """Compute the transfer function H(f) = captured/original."""
    # Align via cross-correlation
    template_len = min(int(0.5 * rate), len(original) // 4)
    template = original[:template_len]

    n_fft = 2 ** int(np.ceil(np.log2(len(captured) + template_len - 1)))
    corr = np.abs(np.fft.ifft(
        np.fft.fft(captured, n_fft) * np.conj(np.fft.fft(template, n_fft))
    ))
    offset = int(np.argmax(corr[:len(captured)]))

    # Trim to aligned segment
    end = min(offset + len(original), len(captured))
    aligned = captured[offset:end]
    ref = original[:len(aligned)]

    if len(aligned) < rate:
        return None  # too short

    # Transfer function
    S_ref = np.fft.rfft(ref)
    S_cap = np.fft.rfft(aligned)
    freqs = np.fft.rfftfreq(len(aligned), 1.0 / rate)
    eps = 1e-10
    H = S_cap / (S_ref + eps)
    H_mag = np.abs(H)
    H_db = 20 * np.log10(H_mag + eps)

    # 1/3 octave smoothing
    f_min, f_max = 20, min(rate // 2 - 1000, 90000)
    points_per_octave = 3
    n_points = int(points_per_octave * np.log2(f_max / f_min))
    f_centers = f_min * 2 ** (np.arange(n_points) / points_per_octave)
    smoothed_db = np.zeros(n_points)

    for i, fc in enumerate(f_centers):
        f_lo = fc / 2 ** (0.5 / points_per_octave)
        f_hi = fc * 2 ** (0.5 / points_per_octave)
        mask = (freqs >= f_lo) & (freqs <= f_hi)
        if np.any(mask):
            smoothed_db[i] = float(np.mean(H_db[mask]))
        else:
            smoothed_db[i] = float("nan")

    # Normalize to 1kHz reference
    ref_idx = int(np.argmin(np.abs(f_centers - 1000)))
    ref_db = smoothed_db[ref_idx] if not np.isnan(smoothed_db[ref_idx]) else 0.0

    return {
        "frequencies_hz": f_centers.tolist(),
        "response_db": (smoothed_db - ref_db).tolist(),
        "reference_hz": 1000,
        "reference_db": float(ref_db),
        "alignment_offset_samples": offset,
        "aligned_duration_s": float(len(aligned) / rate),
        "raw_freqs": freqs,
        "raw_db": H_db
    }


def compute_correction_eq(response):
    """Generate an inverse EQ curve to flatten the response."""
    freqs = response["frequencies_hz"]
    db = response["response_db"]
    corrections = []

    for f, d in zip(freqs, db):
        if np.isnan(d) or f < 20:
            continue
        # Inverse: if response is +6dB, correction is -6dB
        # Limit correction to +/- 12dB to avoid extreme boosts
        correction = max(-12.0, min(12.0, -d))
        corrections.append({
            "frequency_hz": round(float(f), 1),
            "measured_db": round(float(d), 1),
            "correction_db": round(float(correction), 1)
        })

    return corrections


# ─── Report generation ───────────────────────────────────────────────────────

def print_frequency_response(response):
    """Print a visual frequency response chart."""
    freqs = response["frequencies_hz"]
    db = response["response_db"]

    print(f"\n{'Freq (Hz)':>12s}  {'dB':>8s}  {'Response':>30s}")
    print("─" * 55)

    for f, d in zip(freqs, db):
        if np.isnan(d) or f < 20:
            continue
        bar_len = int(max(0, min(30, 15 + d)))
        bar = "█" * bar_len + "░" * (30 - bar_len)
        flag = " *" if abs(d) > 6 else ""
        print(f"{f:12.0f}  {d:+8.1f}  {bar}{flag}")

    # Summary
    valid = [d for d in db if not np.isnan(d)]
    valid_f = [f for f, d in zip(freqs, db) if not np.isnan(d)]
    audible = [(f, d) for f, d in zip(valid_f, valid) if 20 <= f <= 20000]

    if audible:
        aud_db = [d for _, d in audible]
        print(f"\n  Audible range (20Hz-20kHz):")
        print(f"    Flatness: {max(aud_db) - min(aud_db):.1f} dB")
        print(f"    Mean deviation: {np.mean(aud_db):+.1f} dB")
        print(f"    Std deviation: {np.std(aud_db):.1f} dB")

        above_3 = [f for f, d in audible if d >= -3]
        if above_3:
            print(f"    -3dB bandwidth: {above_3[0]:.0f}Hz — {above_3[-1]:.0f}Hz")


def save_calibration(data, output_path):
    """Save calibration data to JSON."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    ok(f"Calibration saved to {output_path}")


# ─── Volume calibration (safety-first) ──────────────────────────────────────

def volume_calibration(rate, tmpdir):
    """
    Safe volume calibration procedure.
    Starts silent, plays progressively louder test tones,
    asks user to adjust to comfortable level.
    """
    banner("VOLUME CALIBRATION — SAFETY FIRST")

    warn("This test will play audio through your speakers.")
    warn("Please follow the instructions carefully.\n")

    print(f"  1. Turn your speaker/system volume {Colors.BOLD}ALL THE WAY DOWN{Colors.RESET}")
    print(f"  2. We will play a quiet 440Hz tone (A4)")
    print(f"  3. Slowly turn the volume up until you can hear it clearly")
    print(f"  4. That is the level we will use for calibration\n")

    response = ask("Ready? Turn volume ALL THE WAY DOWN first, then press Enter", "yes")
    if response and response.lower() in ("no", "n", "quit", "q"):
        return False

    # Stage 1: Very quiet tone — just to confirm audio is working
    info("Playing very quiet 440Hz tone (2 seconds)...")
    info("You may not hear this yet — that's expected.")
    tone1 = generate_sine(440, 2.0, rate, amplitude=AMPLITUDE_SAFE_START)
    path1 = write_wav(tone1, os.path.join(tmpdir, "vol_test_1.wav"), rate)
    play_audio(path1)

    response = ask("Could you hear anything? (yes/no/barely)", "no")
    if response and response.lower().startswith("y"):
        warn("Your volume may be too high. Please turn it down a bit.")

    # Stage 2: Moderate tone — this is the calibration level
    print()
    info("Now playing a moderate 440Hz tone (3 seconds)...")
    info("Slowly turn your volume up until this is COMFORTABLE — not loud.\n")
    tone2 = generate_sine(440, 3.0, rate, amplitude=AMPLITUDE_CALIBRATION)
    path2 = write_wav(tone2, os.path.join(tmpdir, "vol_test_2.wav"), rate)
    play_audio(path2)

    response = ask("Is the volume at a comfortable level? (yes/louder/quieter)", "yes")
    if response and response.lower().startswith("q"):
        info("Please turn your volume down, then press Enter.")
        ask("Press Enter when ready")
        play_audio(path2)
        ask("Better? Press Enter to continue", "yes")

    # Stage 3: Preview sweep level
    print()
    info("Previewing the sweep signal level (2 seconds)...")
    info("This is the level the calibration sweep will play at.\n")
    preview = generate_log_sweep(200, 4000, 2.0, rate, amplitude=AMPLITUDE_SWEEP)
    path3 = write_wav(preview, os.path.join(tmpdir, "vol_preview.wav"), rate)
    play_audio(path3)

    response = ask("Is this level OK for the full calibration? (yes/no)", "yes")
    if response and response.lower().startswith("n"):
        warn("Please adjust your volume, then press Enter to preview again.")
        ask("Press Enter when ready")
        play_audio(path3)
        ask("Press Enter to continue", "yes")

    ok("Volume calibration complete.\n")
    return True


# ─── Main calibration procedure ─────────────────────────────────────────────

def run_calibration(rate, skip_volume_cal=False):
    """Execute the full calibration procedure."""
    total_steps = 6
    timestamp = datetime.now().isoformat()
    calibration = {
        "version": VERSION,
        "timestamp": timestamp,
        "sample_rate": rate,
        "nyquist_hz": rate // 2,
    }

    tmpdir = tempfile.mkdtemp(prefix="gsd-cal-")
    info(f"Working directory: {tmpdir}")

    # ── Step 1: Hardware detection ───────────────────────────────────────

    step(1, total_steps, "Detecting audio hardware")
    hw = detect_audio_system()
    calibration["hardware"] = hw

    if hw["system"]:
        ok(f"Audio system: {hw['system']} v{hw['version']}")
    else:
        err("No audio system detected")
        return None

    if hw["default_output"]:
        ok(f"Output: {hw['default_output']}")
    else:
        err("No audio output found")
        return None

    if hw["default_input"]:
        ok(f"Input: {hw['default_input']}")
    else:
        err("No audio input found")
        return None

    ok(f"Sample rate: {rate} Hz (Nyquist: {rate // 2} Hz)")

    for dev in hw["inputs"]:
        info(f"  Input: {dev}")
    for dev in hw["outputs"]:
        info(f"  Output: {dev}")

    # ── Step 2: Volume calibration ───────────────────────────────────────

    step(2, total_steps, "Volume calibration")
    if skip_volume_cal:
        warn("Skipping volume calibration (--skip-volume-cal)")
    else:
        if not volume_calibration(rate, tmpdir):
            info("Calibration cancelled by user.")
            return None

    # ── Step 3: Noise floor measurement ──────────────────────────────────

    step(3, total_steps, "Measuring room noise floor")
    info(f"Recording {NOISE_FLOOR_DURATION}s of room silence...")

    noise_path = os.path.join(tmpdir, "noise_floor.wav")
    record_audio(noise_path, NOISE_FLOOR_DURATION, rate)
    noise_samples = read_wav(noise_path, rate)

    if len(noise_samples) > 0:
        noise = analyze_noise_floor(noise_samples, rate)
        calibration["noise_floor"] = noise
        ok(f"RMS: {noise['rms']:.6f} ({noise['rms_dbfs']:.1f} dBFS)")
        ok(f"Peak: {noise['peak']:.6f} ({noise['peak_dbfs']:.1f} dBFS)")
        info("Dominant frequencies:")
        for freq, mag in noise["dominant_frequencies"][:3]:
            print(f"    {freq:.1f} Hz (magnitude: {mag:.2f})")

        # Derive mains frequency
        mains = derive_mains_frequency(noise_samples, rate)
        calibration["mains"] = mains
        if mains["nominal"] > 0:
            ok(f"Mains frequency: {mains['frequency']:.2f} Hz "
               f"(nominal {mains['nominal']} Hz, phase {mains['phase_deg']:.1f}°)")
        else:
            warn("Could not determine mains frequency from room noise")
    else:
        err("Failed to capture room noise")
        calibration["noise_floor"] = None

    # ── Step 4: Round-trip latency measurement ───────────────────────────

    step(4, total_steps, "Measuring round-trip audio latency")
    info("Playing click pattern and recording...")

    clicks = generate_clicks(4, 0.5, rate)
    click_path = write_wav(clicks, os.path.join(tmpdir, "clicks.wav"), rate)
    latency_path = os.path.join(tmpdir, "latency_capture.wav")

    # Record and play simultaneously
    rec_proc = subprocess.Popen(
        ["pw-record", "--channels", "1", "--rate", str(rate), "--format", "f32", latency_path],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    time.sleep(0.2)
    play_audio(click_path, wait=True)
    time.sleep(1.0)
    rec_proc.terminate()
    rec_proc.wait()

    latency_samples = read_wav(latency_path, rate)
    if len(latency_samples) > 0:
        latency = measure_latency(latency_samples, clicks, rate)
        calibration["latency"] = latency
        if latency["total_ms"] is not None:
            ok(f"Round-trip latency: {latency['total_ms']:.1f}ms")
            ok(f"Clicks detected: {latency['peaks_found']}")
        else:
            warn(f"Could not determine precise latency (found {latency['peaks_found']} peaks)")
    else:
        err("Failed to capture latency test")
        calibration["latency"] = None

    # ── Step 5: Frequency response measurement ───────────────────────────

    step(5, total_steps, "Measuring frequency response")
    max_freq = min(rate // 2 - 1000, 90000)
    info(f"Playing log sweep 20Hz — {max_freq}Hz ({SWEEP_DURATION}s)...")

    sweep = generate_log_sweep(20, max_freq, SWEEP_DURATION, rate, amplitude=AMPLITUDE_SWEEP)
    sweep_path = write_wav(sweep, os.path.join(tmpdir, "sweep.wav"), rate)
    response_path = os.path.join(tmpdir, "sweep_capture.wav")

    # Record and play
    rec_proc = subprocess.Popen(
        ["pw-record", "--channels", "1", "--rate", str(rate), "--format", "f32", response_path],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    time.sleep(0.5)
    play_audio(sweep_path, wait=True)
    time.sleep(1.5)
    rec_proc.terminate()
    rec_proc.wait()

    response_samples = read_wav(response_path, rate)
    if len(response_samples) > 0:
        response = compute_frequency_response(response_samples, sweep, rate)
        if response:
            # Store serializable parts
            calibration["frequency_response"] = {
                "frequencies_hz": response["frequencies_hz"],
                "response_db": response["response_db"],
                "reference_hz": response["reference_hz"],
                "aligned_duration_s": response["aligned_duration_s"]
            }
            ok("Frequency response measured")
            print_frequency_response(response)

            # Compute correction EQ
            corrections = compute_correction_eq(response)
            calibration["correction_eq"] = corrections
            ok(f"Generated {len(corrections)}-band correction EQ")
        else:
            err("Could not compute frequency response (alignment failed)")
    else:
        err("Failed to capture sweep response")

    # ── Step 6: Save results ─────────────────────────────────────────────

    step(6, total_steps, "Saving calibration data")

    # Determine output path
    cal_filename = f"room-calibration-{rate}hz-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    cal_path = CALIBRATION_DIR / cal_filename

    # Also save a "latest" symlink
    latest_path = CALIBRATION_DIR / f"room-calibration-{rate}hz-latest.json"

    save_calibration(calibration, cal_path)

    # Create latest symlink
    try:
        if latest_path.exists() or latest_path.is_symlink():
            latest_path.unlink()
        latest_path.symlink_to(cal_path.name)
        ok(f"Latest link: {latest_path}")
    except OSError:
        pass

    # Print summary
    banner("CALIBRATION COMPLETE")

    print(f"  Timestamp:    {timestamp}")
    print(f"  Sample rate:  {rate} Hz")

    if calibration.get("noise_floor"):
        print(f"  Noise floor:  {calibration['noise_floor']['rms_dbfs']:.1f} dBFS RMS")

    if calibration.get("mains"):
        m = calibration["mains"]
        print(f"  Mains freq:   {m['frequency']:.2f} Hz ({m['nominal']} Hz nominal)")

    if calibration.get("latency") and calibration["latency"]["total_ms"]:
        print(f"  Latency:      {calibration['latency']['total_ms']:.1f}ms round-trip")

    if calibration.get("frequency_response"):
        fr = calibration["frequency_response"]
        valid_db = [d for d in fr["response_db"] if not np.isnan(d)]
        if valid_db:
            print(f"  FR range:     {max(valid_db) - min(valid_db):.1f} dB")

    print(f"\n  Results:      {cal_path}")
    print(f"  Working dir:  {tmpdir}")
    print()

    return calibration


# ─── Report-only mode ────────────────────────────────────────────────────────

def report_from_file(path):
    """Load and display a previous calibration."""
    with open(path) as f:
        cal = json.load(f)

    banner(f"CALIBRATION REPORT — {cal.get('timestamp', 'unknown')}")

    print(f"  Sample rate: {cal.get('sample_rate', '?')} Hz")

    if cal.get("hardware"):
        hw = cal["hardware"]
        print(f"  Audio system: {hw.get('system', '?')}")
        print(f"  Output: {hw.get('default_output', '?')}")
        print(f"  Input: {hw.get('default_input', '?')}")

    if cal.get("noise_floor"):
        nf = cal["noise_floor"]
        print(f"  Noise floor: {nf['rms_dbfs']:.1f} dBFS RMS")

    if cal.get("mains"):
        m = cal["mains"]
        print(f"  Mains: {m['frequency']:.2f} Hz")

    if cal.get("latency") and cal["latency"].get("total_ms"):
        print(f"  Latency: {cal['latency']['total_ms']:.1f}ms")

    if cal.get("frequency_response"):
        print_frequency_response(cal["frequency_response"])

    if cal.get("correction_eq"):
        print(f"\n  Correction EQ: {len(cal['correction_eq'])} bands")
        for band in cal["correction_eq"]:
            if abs(band["correction_db"]) > 1:
                print(f"    {band['frequency_hz']:8.0f} Hz: {band['correction_db']:+.1f} dB "
                      f"(measured: {band['measured_db']:+.1f} dB)")


# ─── Entry point ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Room & Microphone Calibration Test for gsd-skill-creator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                        # Run at default 48kHz
  %(prog)s --rate 96000           # Run at 96kHz
  %(prog)s --rate 192000          # Run at 192kHz
  %(prog)s --skip-volume-cal      # Skip volume safety check
  %(prog)s --report-only cal.json # Display previous calibration
        """
    )
    parser.add_argument("--rate", type=int, default=DEFAULT_RATE,
                        choices=SUPPORTED_RATES,
                        help=f"Sample rate in Hz (default: {DEFAULT_RATE})")
    parser.add_argument("--skip-volume-cal", action="store_true",
                        help="Skip the volume calibration step (use with caution)")
    parser.add_argument("--report-only", metavar="FILE",
                        help="Display a previous calibration file instead of running a new test")

    args = parser.parse_args()

    banner("gsd-skill-creator — Room Calibration Test v" + VERSION)

    if args.report_only:
        report_from_file(args.report_only)
        return

    # Safety banner
    print(f"  {Colors.RED}{Colors.BOLD}╔══════════════════════════════════════════════════════╗{Colors.RESET}")
    print(f"  {Colors.RED}{Colors.BOLD}║  WARNING: This test plays audio through speakers.   ║{Colors.RESET}")
    print(f"  {Colors.RED}{Colors.BOLD}║                                                      ║{Colors.RESET}")
    print(f"  {Colors.RED}{Colors.BOLD}║  • Turn your volume ALL THE WAY DOWN before starting ║{Colors.RESET}")
    print(f"  {Colors.RED}{Colors.BOLD}║  • Never run with headphones at unknown volume        ║{Colors.RESET}")
    print(f"  {Colors.RED}{Colors.BOLD}║  • We will guide you to a safe level step by step     ║{Colors.RESET}")
    print(f"  {Colors.RED}{Colors.BOLD}╚══════════════════════════════════════════════════════╝{Colors.RESET}\n")

    if not check_prerequisites():
        sys.exit(1)

    response = ask("Turn volume DOWN, then press Enter to begin (or 'q' to quit)", "")
    if response and response.lower() in ("q", "quit"):
        info("Cancelled.")
        return

    run_calibration(args.rate, skip_volume_cal=args.skip_volume_cal)


if __name__ == "__main__":
    main()
