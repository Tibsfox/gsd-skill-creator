# RP2040 PIO State Machines for LED Control

The RP2040 (Raspberry Pi Pico) introduces a genuinely novel approach to LED driving with its Programmable I/O (PIO) subsystem. PIO state machines can execute custom programs that generate precise timing signals -- including the WS2812B protocol -- in hardware, with zero CPU involvement. This makes the RP2040 one of the most capable LED controllers available at any price.

---

## PIO Architecture Overview

The RP2040 has **2 PIO blocks**, each containing **4 state machines**, for a total of **8 independent state machines**. Each PIO block has a shared 32-instruction program memory.

```
                RP2040 PIO Architecture

  +------ PIO Block 0 ------+    +------ PIO Block 1 ------+
  |                          |    |                          |
  |  Instruction Memory      |    |  Instruction Memory      |
  |  (32 instructions)       |    |  (32 instructions)       |
  |                          |    |                          |
  |  SM0 ---> GPIO           |    |  SM4 ---> GPIO           |
  |  SM1 ---> GPIO           |    |  SM5 ---> GPIO           |
  |  SM2 ---> GPIO           |    |  SM6 ---> GPIO           |
  |  SM3 ---> GPIO           |    |  SM7 ---> GPIO           |
  |                          |    |                          |
  |  IRQ flags (shared)      |    |  IRQ flags (shared)      |
  +-------------------------+    +-------------------------+

  Each SM has:
  - 32-bit output shift register (OSR)
  - 32-bit input shift register (ISR)
  - 32-bit scratch registers (X, Y)
  - TX FIFO (4 entries, 32-bit wide) -- data FROM CPU
  - RX FIFO (4 entries, 32-bit wide) -- data TO CPU
  - Independent clock divider (fractional, 16.8 format)
```

### Key PIO Specifications

| Feature | Value | Significance |
|---------|-------|-------------|
| Clock | Up to 133 MHz (system clock) | ~7.5 ns per instruction |
| Instructions per SM | 9 types, 32 slots shared | Compact programs |
| Shift register | 32 bits | Matches LED data width |
| FIFO depth | 4 x 32-bit (TX), 4 x 32-bit (RX) | DMA-friendly |
| GPIO mapping | Any pin, any SM | Flexible wiring |
| Clock divider | 16-bit integer + 8-bit fraction | Precise timing |
| Side-set | 0-5 pins per instruction | Set pins as instruction executes |

---

## PIO Instruction Set

PIO programs use just 9 instructions:

| Instruction | Description | LED Use |
|------------|-------------|---------|
| `jmp` | Conditional jump | Loop control, bit testing |
| `wait` | Wait for condition | Sync to external signals |
| `in` | Shift bits into ISR | Reading sensor data |
| `out` | Shift bits from OSR | Sending LED data bits |
| `push` | Push ISR to RX FIFO | Sending data to CPU |
| `pull` | Pull TX FIFO to OSR | Receiving data from CPU |
| `mov` | Move/copy between registers | Register manipulation |
| `irq` | Set/clear/wait on IRQ flags | Sync between state machines |
| `set` | Set pin/register to constant | Initialize pins |

Each instruction executes in exactly **one clock cycle** (plus optional delay cycles). This determinism is what makes PIO ideal for LED protocols.

---

## WS2812B PIO Program

This is the canonical WS2812B driver using PIO. The entire protocol is implemented in just 4 instructions:

### PIO Assembly (ws2812.pio)

```
; WS2812B PIO program
; Encodes 24-bit GRB data as NZR single-wire protocol
;
; Timing at 800 kHz (1.25 us per bit):
;   "1" bit: 0.8 us HIGH + 0.45 us LOW
;   "0" bit: 0.4 us HIGH + 0.85 us LOW
;
; With side-set on the data pin:

.program ws2812
.side_set 1

.wrap_target
bitloop:
    out x, 1       side 0 [2]  ; Shift 1 bit from OSR to X. Drive LOW for 3 cycles.
    jmp !x do_zero side 1 [1]  ; If bit is 0, jump. Drive HIGH for 2 cycles.
    jmp bitloop    side 1 [4]  ; Bit was 1: stay HIGH for 5 more cycles (total 7).
do_zero:
    nop            side 0 [4]  ; Bit was 0: go LOW for 5 cycles.
.wrap

; At 800 kHz bit rate with 10 cycles per bit:
; System clock = 800 kHz * 10 = 8 MHz
; Clock divider = 133 MHz / 8 MHz = 16.625
```

### Timing Analysis

```
At 8 MHz PIO clock (125 ns per cycle, 10 cycles per bit = 1.25 us):

"1" bit:
  Cycle 0-2: LOW  (out + 2 delay = 3 cycles = 375 ns)
  Cycle 3-4: HIGH (jmp + 1 delay = 2 cycles = 250 ns)
  Cycle 5-9: HIGH (jmp + 4 delay = 5 cycles = 625 ns)
  Total HIGH = 875 ns, Total LOW = 375 ns
  (WS2812B spec: HIGH 800ns +/-150ns, LOW 450ns +/-150ns) -- PASS

"0" bit:
  Cycle 0-2: LOW  (out + 2 delay = 3 cycles = 375 ns)
  Cycle 3-4: HIGH (jmp + 1 delay = 2 cycles = 250 ns)
  Cycle 5-9: LOW  (nop + 4 delay = 5 cycles = 625 ns)
  Total HIGH = 250 ns, Total LOW = 1000 ns
  (WS2812B spec: HIGH 400ns +/-150ns, LOW 850ns +/-150ns) -- PASS
```

### C Driver Code (MicroPython version follows)

```c
#include "pico/stdlib.h"
#include "hardware/pio.h"
#include "hardware/dma.h"
#include "ws2812.pio.h"  // Generated from .pio file

#define WS2812_PIN 2
#define NUM_LEDS 300

uint32_t led_buffer[NUM_LEDS];

void ws2812_init(PIO pio, uint sm, uint pin) {
    uint offset = pio_add_program(pio, &ws2812_program);

    pio_gpio_init(pio, pin);
    pio_sm_set_consecutive_pindirs(pio, sm, pin, 1, true);

    pio_sm_config c = ws2812_program_get_default_config(offset);
    sm_config_set_sideset_pins(&c, pin);
    sm_config_set_out_shift(&c, false, true, 24);  // Shift left, autopull at 24 bits
    sm_config_set_fifo_join(&c, PIO_FIFO_JOIN_TX);  // Double TX FIFO to 8 entries

    // Set clock divider for 800 kHz bit rate
    float div = clock_get_hz(clk_sys) / (800000.0f * 10.0f);
    sm_config_set_clkdiv(&c, div);

    pio_sm_init(pio, sm, offset, &c);
    pio_sm_set_enabled(pio, sm, true);
}

void ws2812_put_pixel(PIO pio, uint sm, uint32_t grb) {
    pio_sm_put_blocking(pio, sm, grb << 8);
}

void ws2812_show(PIO pio, uint sm) {
    for (int i = 0; i < NUM_LEDS; i++) {
        ws2812_put_pixel(pio, sm, led_buffer[i]);
    }
    sleep_us(300);  // Reset time (>280 us)
}
```

### MicroPython Version

```python
import array
import time
from machine import Pin
import rp2

@rp2.asm_pio(sideset_init=rp2.PIO.OUT_LOW, out_shiftdir=rp2.PIO.SHIFT_LEFT,
             autopull=True, pull_thresh=24)
def ws2812():
    T1 = 2
    T2 = 5
    T3 = 3
    wrap_target()
    label("bitloop")
    out(x, 1)               .side(0)    [T3 - 1]
    jmp(not_x, "do_zero")   .side(1)    [T1 - 1]
    jmp("bitloop")           .side(1)    [T2 - 1]
    label("do_zero")
    nop()                    .side(0)    [T2 - 1]
    wrap()

NUM_LEDS = 60
PIN = 2

sm = rp2.StateMachine(0, ws2812, freq=8_000_000, sideset_base=Pin(PIN))
sm.active(1)

pixels = array.array("I", [0] * NUM_LEDS)

def set_pixel(index, r, g, b):
    pixels[index] = (g << 16) | (r << 8) | b

def show():
    for pixel in pixels:
        sm.put(pixel, 8)  # Shift left by 8 to align 24 bits
    time.sleep_us(300)

# Rainbow effect
while True:
    for offset in range(256):
        for i in range(NUM_LEDS):
            hue = (i * 256 // NUM_LEDS + offset) % 256
            # Simple HSV-to-RGB (hue only, full saturation, full value)
            if hue < 85:
                set_pixel(i, hue * 3, 255 - hue * 3, 0)
            elif hue < 170:
                hue -= 85
                set_pixel(i, 255 - hue * 3, 0, hue * 3)
            else:
                hue -= 170
                set_pixel(i, 0, hue * 3, 255 - hue * 3)
        show()
        time.sleep_ms(10)
```

---

## APA102 via PIO SPI

The APA102 uses a two-wire SPI protocol. PIO can generate SPI, freeing the hardware SPI for other tasks:

```python
import rp2
from machine import Pin
import array
import time

@rp2.asm_pio(out_init=rp2.PIO.OUT_LOW, sideset_init=rp2.PIO.OUT_LOW,
             out_shiftdir=rp2.PIO.SHIFT_LEFT, autopull=True, pull_thresh=32)
def apa102_spi():
    """SPI mode 0: clock idle low, data on rising edge."""
    wrap_target()
    out(pins, 1)    .side(0)   [1]  # Set data bit, clock LOW
    nop()           .side(1)   [1]  # Clock HIGH (data sampled)
    wrap()

NUM_LEDS = 60
DATA_PIN = 3
CLOCK_PIN = 2

sm = rp2.StateMachine(0, apa102_spi, freq=8_000_000,
                       out_base=Pin(DATA_PIN), sideset_base=Pin(CLOCK_PIN))
sm.active(1)

def apa102_show(pixels):
    """pixels: list of (brightness, r, g, b) tuples."""
    # Start frame
    sm.put(0x00000000)

    # LED frames
    for brightness, r, g, b in pixels:
        frame = (0xE0 | (brightness & 0x1F)) << 24 | b << 16 | g << 8 | r
        sm.put(frame)

    # End frame
    for _ in range((len(pixels) + 15) // 16):
        sm.put(0xFFFFFFFF)
```

For more on the APA102 protocol, see [APA102 SPI Protocol](m3-apa102-spi.md).

---

## DMA-Driven LED Updates

For the smoothest animations, use DMA to feed pixel data to PIO without any CPU involvement:

```c
#include "hardware/dma.h"

int dma_chan;

void setup_dma(PIO pio, uint sm) {
    dma_chan = dma_claim_unused_channel(true);

    dma_channel_config c = dma_channel_get_default_config(dma_chan);
    channel_config_set_transfer_data_size(&c, DMA_SIZE_32);
    channel_config_set_read_increment(&c, true);
    channel_config_set_write_increment(&c, false);
    channel_config_set_dreq(&c, pio_get_dreq(pio, sm, true));

    dma_channel_configure(dma_chan, &c,
        &pio->txf[sm],    // Write address: PIO TX FIFO
        led_buffer,        // Read address: LED data array
        NUM_LEDS,          // Transfer count
        false              // Don't start yet
    );
}

void show_leds_dma() {
    dma_channel_set_read_addr(dma_chan, led_buffer, true);
    dma_channel_wait_for_finish_blocking(dma_chan);
    sleep_us(300);  // WS2812B reset
}
```

With DMA, a 300-LED WS2812B update takes about 9 ms of wall time but **zero CPU cycles**. The CPU can compute the next frame while the current one is being sent.

---

## Dual-Core LED Applications

The RP2040 has two ARM Cortex-M0+ cores. A powerful pattern for LED projects:

- **Core 0:** Runs the animation engine, computes pixel colors
- **Core 1:** Handles I/O -- buttons, sensors, serial commands, USB

```c
#include "pico/multicore.h"

// Shared LED buffer (both cores can access)
volatile uint32_t led_buffer[NUM_LEDS];
volatile bool buffer_ready = false;

// Core 1: I/O and communication
void core1_entry() {
    while (true) {
        // Read buttons, serial commands, sensors
        // Update animation parameters
        // The LED buffer is written by Core 0
    }
}

// Core 0: Animation engine
int main() {
    ws2812_init(pio0, 0, WS2812_PIN);
    setup_dma(pio0, 0);

    multicore_launch_core1(core1_entry);

    while (true) {
        compute_next_frame(led_buffer, NUM_LEDS);
        show_leds_dma();
    }
}
```

For POV (Persistence of Vision) display applications that push the RP2040's dual-core architecture to its limits, see [RP2040 POV Architecture](m6-rp2040-pov-architecture.md).

---

## Multiple Independent LED Strips

With 8 state machines, the RP2040 can drive up to 8 independent LED strips simultaneously:

```python
import rp2
from machine import Pin

# Each strip gets its own state machine
sm0 = rp2.StateMachine(0, ws2812, freq=8_000_000, sideset_base=Pin(2))  # Strip 1
sm1 = rp2.StateMachine(1, ws2812, freq=8_000_000, sideset_base=Pin(3))  # Strip 2
sm2 = rp2.StateMachine(2, ws2812, freq=8_000_000, sideset_base=Pin(4))  # Strip 3
sm3 = rp2.StateMachine(3, ws2812, freq=8_000_000, sideset_base=Pin(5))  # Strip 4
# sm4-sm7 available on PIO block 1

for sm in [sm0, sm1, sm2, sm3]:
    sm.active(1)

# Update all strips simultaneously (each SM runs independently)
```

This is a unique advantage of the RP2040. An [Arduino](m2-arduino-led-control.md) can drive only one WS2812B strip at a time (CPU is blocked during output). An [ESP32](m2-esp32-led.md) has 8 RMT channels but they share timing resources. The RP2040's PIO state machines are truly independent.

---

## RP2040 Board Options

| Board | Price | Features |
|-------|-------|----------|
| Raspberry Pi Pico | $4 | Basic, USB micro-B, 26 GPIO |
| Raspberry Pi Pico W | $6 | WiFi + BLE added |
| Adafruit Feather RP2040 | $12 | LiPo charging, Stemma QT |
| Pimoroni Plasma 2040 | $12 | Purpose-built for LEDs, screw terminals, current sensing |
| Seeed XIAO RP2040 | $5 | Tiny form factor, USB-C |

The **Pimoroni Plasma 2040** is specifically designed for LED projects, with 5V level-shifted output, current sensing, onboard WS2812 status LED, and screw terminals for strip connections.

---

## Cross-References

- [MCU Comparison](m2-mcu-comparison.md) -- RP2040 vs ESP32 vs Arduino vs PIC vs Pi
- [WS2812B Protocol](m3-ws2812b-protocol.md) -- The protocol that PIO implements
- [APA102 SPI Protocol](m3-apa102-spi.md) -- SPI-based alternative driven via PIO
- [ESP32 LED Control](m2-esp32-led.md) -- WiFi-capable alternative with RMT peripheral
- [RP2040 POV Architecture](m6-rp2040-pov-architecture.md) -- Dual-core POV display design
- [LED Libraries](m3-led-libraries.md) -- Library support for RP2040

---

*Sources: RP2040 Datasheet (Raspberry Pi Ltd), Raspberry Pi Pico C/C++ SDK documentation, Raspberry Pi Pico MicroPython documentation, PIO programming guide (Chapter 3 of RP2040 Datasheet), Pimoroni Plasma 2040 documentation, Adafruit RP2040 NeoPixel guide.*
