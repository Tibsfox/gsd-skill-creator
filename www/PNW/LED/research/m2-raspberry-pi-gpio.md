# Raspberry Pi GPIO & pigpio for LED Control

The Raspberry Pi brings Linux, Python, networking, and a full operating system to LED projects. This makes it ideal for smart lighting systems that need web interfaces, databases, schedules, or integration with services like Home Assistant. The tradeoff is that a general-purpose OS cannot provide the deterministic timing that bare-metal microcontrollers offer -- but the `pigpio` library largely solves this for PWM.

---

## GPIO Overview

The Raspberry Pi (models 2B through 5) exposes a 40-pin GPIO header with:

- 26 GPIO pins (active, directly usable)
- 2 I2C channels (SDA/SCL)
- 2 SPI channels (MOSI/MISO/SCLK/CE)
- 1 UART (TX/RX)
- 5V, 3.3V power, and ground pins

### Key GPIO Pins for LED Projects

| Pin (BCM) | Function | LED Use Case |
|-----------|----------|-------------|
| GPIO 12 | PWM0 (hardware) | Hardware PWM LED channel 1 |
| GPIO 13 | PWM1 (hardware) | Hardware PWM LED channel 2 |
| GPIO 18 | PWM0 (hardware, alt) | Hardware PWM (most commonly used) |
| GPIO 19 | PWM1 (hardware, alt) | Hardware PWM channel 2 |
| GPIO 2 | I2C SDA | PCA9685 PWM driver, color sensors |
| GPIO 3 | I2C SCL | PCA9685 PWM driver, color sensors |
| GPIO 10 | SPI MOSI | APA102 data |
| GPIO 11 | SPI SCLK | APA102 clock |

> **SAFETY WARNING:** Raspberry Pi GPIO pins operate at 3.3V and can source a maximum of ~16mA per pin (50mA total across all GPIO). Never connect a GPIO pin directly to a 5V device without a level shifter. Exceeding 3.3V on any GPIO pin will damage the Raspberry Pi permanently. Use a MOSFET or transistor to switch higher-current LED loads.

---

## RPi.GPIO vs pigpio

Two main Python libraries exist for GPIO control. They differ significantly in PWM quality:

### RPi.GPIO: Software PWM

```python
import RPi.GPIO as GPIO
import time

LED_PIN = 18

GPIO.setmode(GPIO.BCM)
GPIO.setup(LED_PIN, GPIO.OUT)

# Create software PWM instance
pwm = GPIO.PWM(LED_PIN, 1000)  # 1 kHz
pwm.start(0)  # Start with 0% duty cycle

try:
    while True:
        # Fade up
        for duty in range(0, 101, 1):
            pwm.ChangeDutyCycle(duty)
            time.sleep(0.01)
        # Fade down
        for duty in range(100, -1, -1):
            pwm.ChangeDutyCycle(duty)
            time.sleep(0.01)
except KeyboardInterrupt:
    pass
finally:
    pwm.stop()
    GPIO.cleanup()
```

**RPi.GPIO limitations:**

- **Software PWM** -- Runs in a Python thread. The Linux scheduler can preempt it at any time, causing jitter.
- **Visible flicker** -- At 1 kHz, jitter of even 0.5ms causes noticeable brightness variation.
- **No DMA** -- All timing depends on CPU availability.
- **Good enough for:** Slow transitions, on/off switching, non-critical dimming.

### pigpio: Hardware-Timed DMA PWM

```python
import pigpio
import time

LED_PIN = 18
pi = pigpio.pi()  # Connect to pigpio daemon

if not pi.connected:
    print("Failed to connect to pigpio daemon")
    print("Start it with: sudo pigpiod")
    exit()

try:
    while True:
        # Fade up (0-255 range for pigpio)
        for brightness in range(0, 256):
            pi.set_PWM_dutycycle(LED_PIN, brightness)
            time.sleep(0.005)
        # Fade down
        for brightness in range(255, -1, -1):
            pi.set_PWM_dutycycle(LED_PIN, brightness)
            time.sleep(0.005)
except KeyboardInterrupt:
    pass
finally:
    pi.set_PWM_dutycycle(LED_PIN, 0)
    pi.stop()
```

**pigpio advantages:**

- **DMA-timed** -- Uses the Pi's DMA controller for precision timing, not CPU threads.
- **No jitter** -- PWM is rock-solid regardless of CPU load.
- **Configurable frequency** -- Up to 8 kHz with 256 steps, or up to 40 kHz with reduced resolution.
- **Remote GPIO** -- The pigpio daemon can be accessed over the network.

### Starting the pigpio Daemon

```bash
# Start the daemon (required before running pigpio scripts)
sudo pigpiod

# Start with specific sample rate (lower = more precise, higher CPU)
sudo pigpiod -s 2    # 2 microsecond sample rate (most precise)
sudo pigpiod -s 5    # 5 microsecond sample rate (default)
sudo pigpiod -s 10   # 10 microsecond sample rate (lowest CPU)

# Auto-start on boot
sudo systemctl enable pigpiod
```

### Direct Comparison

| Feature | RPi.GPIO | pigpio |
|---------|----------|--------|
| PWM method | Software (thread) | DMA (hardware-timed) |
| Jitter | 0.1-2 ms | < 5 us |
| Max frequency | ~10 kHz (unstable) | 40 kHz |
| Resolution | Percentage (0-100) | 0-255 default (configurable) |
| CPU usage | Scales with frequency | Minimal |
| Remote access | No | Yes (network daemon) |
| Python 3 | Yes | Yes |
| Install | Pre-installed | `sudo apt install pigpio` |
| Verdict | Learning only | **Use this** |

---

## Hardware PWM on Raspberry Pi

The Raspberry Pi has two hardware PWM channels accessible via pigpio:

```python
import pigpio

pi = pigpio.pi()

# Hardware PWM: up to 125 MHz clock divided by range
# set_PWM_frequency: sets the frequency
# set_PWM_dutycycle: sets the duty cycle (0-range)
# set_PWM_range: sets the range (resolution)

# Example: 25 kHz PWM with 1000 steps on GPIO 18
pi.set_PWM_range(18, 1000)
pi.set_PWM_frequency(18, 25000)
pi.set_PWM_dutycycle(18, 500)  # 50% duty cycle

# For true hardware PWM (even more precise):
pi.hardware_PWM(18, 25000, 500000)  # GPIO, freq, duty (0-1000000)
# duty is in millionths: 500000 = 50%
```

Hardware PWM is available on GPIO 12, 13, 18, and 19. It is the highest-quality PWM the Pi can produce -- equivalent to what a dedicated microcontroller provides.

---

## RGB LED Control with pigpio

```python
import pigpio
import time
import math

RED_PIN = 17
GREEN_PIN = 22
BLUE_PIN = 27

pi = pigpio.pi()

def set_color(r, g, b):
    """Set RGB LED color. Values 0-255."""
    # Apply gamma correction (gamma = 2.2)
    r_pwm = int(255 * (r / 255.0) ** 2.2)
    g_pwm = int(255 * (g / 255.0) ** 2.2)
    b_pwm = int(255 * (b / 255.0) ** 2.2)

    pi.set_PWM_dutycycle(RED_PIN, r_pwm)
    pi.set_PWM_dutycycle(GREEN_PIN, g_pwm)
    pi.set_PWM_dutycycle(BLUE_PIN, b_pwm)

def hsv_to_rgb(h, s, v):
    """Convert HSV (0-360, 0-1, 0-1) to RGB (0-255)."""
    c = v * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = v - c
    if h < 60:
        r, g, b = c, x, 0
    elif h < 120:
        r, g, b = x, c, 0
    elif h < 180:
        r, g, b = 0, c, x
    elif h < 240:
        r, g, b = 0, x, c
    elif h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    return int((r + m) * 255), int((g + m) * 255), int((b + m) * 255)

try:
    while True:
        # Rainbow cycle
        for hue in range(360):
            r, g, b = hsv_to_rgb(hue, 1.0, 1.0)
            set_color(r, g, b)
            time.sleep(0.02)
except KeyboardInterrupt:
    set_color(0, 0, 0)
    pi.stop()
```

---

## I2C: PCA9685 PWM Driver

For more than 2-3 PWM channels, use the PCA9685 -- a 16-channel, 12-bit PWM driver controlled via I2C:

```python
import time
from smbus2 import SMBus

PCA9685_ADDR = 0x40
MODE1 = 0x00
PRESCALE = 0xFE
LED0_ON_L = 0x06

def pca9685_init(bus, freq=1000):
    """Initialize PCA9685 at given PWM frequency."""
    # Calculate prescale value
    # prescale = round(25MHz / (4096 * freq)) - 1
    prescale = round(25000000.0 / (4096.0 * freq)) - 1

    # Enter sleep mode to set prescale
    bus.write_byte_data(PCA9685_ADDR, MODE1, 0x10)
    bus.write_byte_data(PCA9685_ADDR, PRESCALE, int(prescale))
    bus.write_byte_data(PCA9685_ADDR, MODE1, 0x00)
    time.sleep(0.005)
    bus.write_byte_data(PCA9685_ADDR, MODE1, 0xA0)  # Auto-increment

def set_channel(bus, channel, value):
    """Set PWM duty cycle for a channel. value: 0-4095."""
    reg = LED0_ON_L + 4 * channel
    bus.write_byte_data(PCA9685_ADDR, reg, 0)       # ON_L
    bus.write_byte_data(PCA9685_ADDR, reg + 1, 0)   # ON_H
    bus.write_byte_data(PCA9685_ADDR, reg + 2, value & 0xFF)       # OFF_L
    bus.write_byte_data(PCA9685_ADDR, reg + 3, (value >> 8) & 0x0F) # OFF_H

# Usage
with SMBus(1) as bus:
    pca9685_init(bus, freq=1000)
    set_channel(bus, 0, 2048)   # Channel 0 at 50%
    set_channel(bus, 1, 1024)   # Channel 1 at 25%
    set_channel(bus, 15, 4095)  # Channel 15 at 100%
```

This gives you 16 independent PWM channels at 12-bit resolution (4096 brightness levels) -- enough to drive 5 RGB LEDs or 4 RGBW LEDs, each with smooth dimming. Multiple PCA9685 boards can be daisy-chained with different I2C addresses (up to 62 boards = 992 channels).

---

## SPI: APA102 LED Control

The Raspberry Pi's SPI interface is ideal for APA102 (DotStar) addressable LEDs, which use a clock+data protocol:

```python
import spidev
import time

spi = spidev.SpiDev()
spi.open(0, 0)          # Bus 0, Device 0 (CE0)
spi.max_speed_hz = 8000000  # 8 MHz SPI clock

NUM_LEDS = 60

def apa102_write(pixels):
    """Write pixel data to APA102 strip.
    pixels: list of (brightness, blue, green, red) tuples
    brightness: 0-31
    """
    # Start frame: 4 bytes of 0x00
    data = [0x00] * 4

    # LED frames
    for brightness, b, g, r in pixels:
        data.append(0xE0 | (brightness & 0x1F))  # 111 + 5-bit brightness
        data.append(b & 0xFF)
        data.append(g & 0xFF)
        data.append(r & 0xFF)

    # End frame: ceil(n/2) bytes of 0xFF
    end_bytes = (len(pixels) + 1) // 2
    data.extend([0xFF] * end_bytes)

    spi.xfer2(data)

# Set all LEDs to warm white at half brightness
pixels = [(16, 180, 220, 255)] * NUM_LEDS  # (brightness, B, G, R)
apa102_write(pixels)
```

For a deep dive into the APA102 protocol, see [APA102 SPI Protocol](m3-apa102-spi.md).

---

## Web-Controlled LED Dimmer

One of the Pi's unique strengths -- serve a web interface alongside GPIO control:

```python
from flask import Flask, request, jsonify
import pigpio

app = Flask(__name__)
pi = pigpio.pi()
LED_PIN = 18

@app.route('/')
def index():
    return '''
    <html><body style="font-family:sans-serif;text-align:center;padding:2em;">
    <h1>LED Dimmer</h1>
    <input type="range" id="slider" min="0" max="255" value="0"
     oninput="fetch('/set?v='+this.value)">
    <p id="val">0</p>
    <script>
    document.getElementById('slider').oninput = function() {
      document.getElementById('val').textContent = this.value;
      fetch('/set?v=' + this.value);
    };
    </script>
    </body></html>
    '''

@app.route('/set')
def set_brightness():
    v = int(request.args.get('v', 0))
    v = max(0, min(255, v))
    pi.set_PWM_dutycycle(LED_PIN, v)
    return jsonify({"brightness": v})

if __name__ == '__main__':
    pi.set_PWM_frequency(LED_PIN, 8000)
    app.run(host='0.0.0.0', port=5000)
```

Access from any device on the network at `http://raspberrypi.local:5000/`.

For a more complete smart lighting system with schedules and color sensing, see [Circadian Adaptation](m4-circadian-adaptation.md).

---

## Pi vs Microcontroller for LED Projects

| Factor | Raspberry Pi | Arduino/ESP32 |
|--------|-------------|---------------|
| Boot time | 10-30 seconds | Instant (~100ms) |
| Power consumption | 2-5W idle | 0.02-0.5W |
| WS2812B support | Difficult (timing-critical) | Native |
| APA102 support | Excellent (SPI) | Excellent (SPI) |
| Web interface | Built-in (Python/Node) | Possible but limited |
| Database | SQLite, PostgreSQL | None |
| Cost | $35-80 | $3-15 |
| Reliability | SD card can corrupt | Flash, very reliable |

**Best use case for Pi:** Central controller managing multiple LED zones via I2C (PCA9685) or SPI (APA102), serving web UI, running schedules, integrating with [Home Assistant](m4-diyhue-wled.md). Pair with an [ESP32](m2-esp32-led.md) or [RP2040](m2-rp2040-pio.md) for time-critical WS2812B driving.

---

## Cross-References

- [MCU Comparison](m2-mcu-comparison.md) -- Full platform comparison including Raspberry Pi
- [APA102 SPI Protocol](m3-apa102-spi.md) -- SPI-based addressable LEDs (ideal for Pi)
- [ESP32 LED Control](m2-esp32-led.md) -- WiFi microcontroller alternative
- [Circadian Adaptation](m4-circadian-adaptation.md) -- Smart lighting with color temperature scheduling
- [diyHue & WLED](m4-diyhue-wled.md) -- Home automation integration
- [MOSFET PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- Switching high-current loads from Pi GPIO

---

*Sources: Raspberry Pi Foundation GPIO documentation, pigpio library documentation (joan2937/pigpio), RPi.GPIO documentation, PCA9685 datasheet (NXP), Adafruit PCA9685 breakout guide, SparkFun Raspberry Pi GPIO tutorial.*
