# PIC Microcontroller & MPLAB XC8 PWM

The PIC microcontroller family from Microchip remains a staple in commercial LED products, industrial controls, and embedded systems where cost, reliability, and long-term availability matter. This page covers PWM generation on the PIC16F877A using the CCP module, register-level configuration in XC8 C, and practical LED driving applications.

---

## Why PIC for LED Control

| Advantage | Detail |
|-----------|--------|
| Cost | PIC16F877A: $2-4 in quantity. 8-pin PIC12F series: under $1 |
| Availability | 30+ year production history, not going end-of-life |
| Low power | Sleep modes draw < 1 uA |
| Industrial range | -40C to +125C standard |
| Deterministic timing | No OS, no interrupts unless you want them |
| In-circuit programming | ICSP header, PICkit 4 programmer |

For hobbyist projects, Arduino is easier. For products that will be manufactured in volume or must operate in harsh environments, PIC is a serious contender. For a full platform comparison, see [MCU Comparison](m2-mcu-comparison.md).

---

## Development Environment

### MPLAB X IDE + XC8 Compiler

- **MPLAB X IDE** -- Free download from Microchip. Cross-platform (Windows, Mac, Linux).
- **XC8 Compiler** -- Free version produces functional code (optimized version requires paid license, but free version is fine for LED projects).
- **PICkit 4** or **SNAP** -- Low-cost programmer/debugger ($30-50). Connects via USB and programs through the ICSP header.

### Minimum ICSP Connection

```
PICkit 4            PIC16F877A
  Pin 1 (MCLR) ---> Pin 1  (MCLR/VPP)
  Pin 2 (VDD)  ---> Pin 11 (VDD)
  Pin 3 (GND)  ---> Pin 12 (VSS)
  Pin 4 (PGD)  ---> Pin 40 (PGD/RB7)
  Pin 5 (PGC)  ---> Pin 39 (PGC/RB6)
```

---

## PIC16F877A Pin Overview

```
              PIC16F877A (40-pin DIP)
         +--------\_/--------+
  MCLR  -|1              40|- RB7 (PGD)
  RA0   -|2              39|- RB6 (PGC)
  RA1   -|3              38|- RB5
  RA2   -|4              37|- RB4
  RA3   -|5              36|- RB3
  RA4   -|6              35|- RB2
  RA5   -|7              34|- RB1
  RE0   -|8              33|- RB0
  RE1   -|9              32|- VDD
  RE2   -|10             31|- VSS
  VDD   -|11             30|- RD7
  VSS   -|12             29|- RD6
  OSC1  -|13             28|- RD5
  OSC2  -|14             27|- RD4
  RC0   -|15             26|- RC7
  RC1   -|16             25|- RC6
  RC2** -|17             24|- RC5
  RC3   -|18             23|- RC4
  RD0   -|19             22|- RD3
  RD1   -|20             21|- RD2
         +------------------+

  ** RC2 = CCP1 output (PWM channel 1)
```

### TRIS and PORT Registers

PIC uses **TRIS** registers to set pin direction (0 = Output, 1 = Input -- think "1 looks like I for Input"):

```c
// Set RC2 as output for CCP1/PWM
TRISCbits.TRISC2 = 0;  // 0 = output

// Set RB0 as input (button)
TRISBbits.TRISB0 = 1;  // 1 = input

// Write to a port pin
PORTCbits.RC0 = 1;  // Set RC0 HIGH
PORTCbits.RC0 = 0;  // Set RC0 LOW
```

---

## CCP Module: PWM Generation

The PIC16F877A has two CCP (Capture/Compare/PWM) modules: **CCP1** (on RC2) and **CCP2** (on RC1). Both can generate hardware PWM independently.

### PWM Frequency Formula

```
f_PWM = f_osc / (4 * T2_prescale * (PR2 + 1))

Where:
  f_osc       = oscillator frequency (e.g., 4 MHz, 20 MHz)
  T2_prescale = Timer2 prescaler (1, 4, or 16)
  PR2         = Timer2 period register (0-255)
```

### PWM Frequency Lookup Table (4 MHz Oscillator)

| PR2 | Prescale=1 | Prescale=4 | Prescale=16 |
|-----|-----------|-----------|------------|
| 49 | 20.0 kHz | 5.0 kHz | 1.25 kHz |
| 99 | 10.0 kHz | 2.5 kHz | 625 Hz |
| 199 | 5.0 kHz | 1.25 kHz | 312 Hz |
| 249 | 4.0 kHz | 1.0 kHz | 250 Hz |
| 255 | 3.9 kHz | 977 Hz | 244 Hz |

### PWM Frequency Lookup Table (20 MHz Oscillator)

| PR2 | Prescale=1 | Prescale=4 | Prescale=16 |
|-----|-----------|-----------|------------|
| 49 | 100 kHz | 25.0 kHz | 6.25 kHz |
| 99 | 50 kHz | 12.5 kHz | 3.125 kHz |
| 199 | 25 kHz | 6.25 kHz | 1.5625 kHz |
| 249 | 20 kHz | 5.0 kHz | 1.25 kHz |

**Worked example:** 4 MHz oscillator, prescaler = 4, PR2 = 249:

```
f_PWM = 4,000,000 / (4 * 4 * (249 + 1))
      = 4,000,000 / (4 * 4 * 250)
      = 4,000,000 / 4,000
      = 1,000 Hz = 1 kHz
```

---

## Register-Level PWM Configuration

### Key Registers

| Register | Purpose | Bits |
|----------|---------|------|
| CCP1CON | CCP1 mode control | CCP1M3:CCP1M0 = mode; DC1B1:DC1B0 = duty cycle LSBs |
| CCPR1L | Duty cycle MSB (8 bits) | Upper 8 bits of 10-bit duty cycle |
| PR2 | Timer2 period | Sets PWM frequency |
| T2CON | Timer2 control | T2CKPS1:T2CKPS0 = prescaler; TMR2ON = enable |

### CCP1CON Mode Bits

```
CCP1M3:CCP1M0 = 1100  -->  PWM mode
DC1B1:DC1B0           -->  Two LSBs of 10-bit duty cycle

CCP1CON register layout:
  Bit 7   Bit 6   Bit 5   Bit 4   Bit 3   Bit 2   Bit 1   Bit 0
  --      --      DC1B1   DC1B0   CCP1M3  CCP1M2  CCP1M1  CCP1M0
```

### 10-Bit Duty Cycle

The PWM duty cycle is 10 bits wide, spread across two registers:

```
  CCPR1L[7:0]  = upper 8 bits
  CCP1CON[5:4] = lower 2 bits (DC1B1:DC1B0)

  Full 10-bit value = (CCPR1L << 2) | (DC1B1:DC1B0)

  Duty cycle = 10-bit value / (4 * (PR2 + 1))
  For PR2=249: max 10-bit value = 4 * 250 = 1000
```

---

## Complete PWM Code Examples

### Example 1: Basic 1 kHz PWM at 50% Duty Cycle

```c
// PIC16F877A PWM Example
// 4 MHz oscillator, 1 kHz PWM on CCP1 (RC2)
// MPLAB X IDE + XC8 compiler

#include <xc.h>

// Configuration bits
#pragma config FOSC = XT    // Crystal oscillator
#pragma config WDTE = OFF   // Watchdog timer OFF
#pragma config PWRTE = ON   // Power-up timer ON
#pragma config BOREN = ON   // Brown-out reset ON
#pragma config LVP = OFF    // Low-voltage programming OFF
#pragma config CPD = OFF    // Data EEPROM protection OFF
#pragma config WRT = OFF    // Flash write protection OFF
#pragma config CP = OFF     // Code protection OFF

#define _XTAL_FREQ 4000000  // 4 MHz crystal

void PWM_Init(void) {
    // 1. Set PR2 for desired frequency
    PR2 = 249;  // f = 4MHz / (4 * 4 * 250) = 1 kHz

    // 2. Set duty cycle to 50%
    // 50% of (4*(PR2+1)) = 50% of 1000 = 500
    // 500 = 0x1F4 -> CCPR1L = 0x7D (125), DC1B = 00
    CCPR1L = 125;
    CCP1CONbits.DC1B1 = 0;
    CCP1CONbits.DC1B0 = 0;

    // 3. Set CCP1 to PWM mode
    CCP1CONbits.CCP1M3 = 1;
    CCP1CONbits.CCP1M2 = 1;
    CCP1CONbits.CCP1M1 = 0;
    CCP1CONbits.CCP1M0 = 0;

    // 4. Set RC2 as output
    TRISCbits.TRISC2 = 0;

    // 5. Configure Timer2 and start it
    T2CONbits.T2CKPS0 = 1;  // Prescaler = 4
    T2CONbits.T2CKPS1 = 0;
    T2CONbits.TMR2ON = 1;   // Enable Timer2
}

void PWM_SetDuty(uint16_t duty_10bit) {
    // Set 10-bit duty cycle value (0-1000 for PR2=249)
    CCPR1L = (uint8_t)(duty_10bit >> 2);
    CCP1CONbits.DC1B1 = (duty_10bit >> 1) & 0x01;
    CCP1CONbits.DC1B0 = duty_10bit & 0x01;
}

void main(void) {
    PWM_Init();

    while (1) {
        // Fade LED up and down
        for (uint16_t i = 0; i <= 1000; i += 5) {
            PWM_SetDuty(i);
            __delay_ms(5);
        }
        for (uint16_t i = 1000; i > 0; i -= 5) {
            PWM_SetDuty(i);
            __delay_ms(5);
        }
    }
}
```

### Example 2: Potentiometer-Controlled LED Brightness

```c
#include <xc.h>

#pragma config FOSC = XT
#pragma config WDTE = OFF
#pragma config PWRTE = ON
#pragma config BOREN = ON
#pragma config LVP = OFF
#pragma config CPD = OFF
#pragma config WRT = OFF
#pragma config CP = OFF

#define _XTAL_FREQ 4000000

void ADC_Init(void) {
    ADCON0 = 0x41;  // ADC ON, channel 0 (RA0), Fosc/8
    ADCON1 = 0x8E;  // Right-justified, AN0 analog, rest digital
    TRISAbits.TRISA0 = 1;  // RA0 as input
}

uint16_t ADC_Read(void) {
    ADCON0bits.GO = 1;            // Start conversion
    while (ADCON0bits.GO_nDONE);  // Wait for completion
    return (uint16_t)((ADRESH << 8) | ADRESL);  // 10-bit result
}

void PWM_Init(void) {
    PR2 = 249;
    CCPR1L = 0;
    CCP1CON = 0x0C;  // PWM mode, duty LSBs = 00
    TRISCbits.TRISC2 = 0;
    T2CON = 0x05;  // Prescaler=4, Timer2 ON
}

void PWM_SetDuty(uint16_t duty_10bit) {
    CCPR1L = (uint8_t)(duty_10bit >> 2);
    CCP1CONbits.DC1B1 = (duty_10bit >> 1) & 0x01;
    CCP1CONbits.DC1B0 = duty_10bit & 0x01;
}

void main(void) {
    ADC_Init();
    PWM_Init();

    while (1) {
        uint16_t pot = ADC_Read();  // 0-1023
        PWM_SetDuty(pot);           // Map directly to PWM duty
        __delay_ms(20);             // Update ~50 times/sec
    }
}
```

### Example 3: Dual-Channel PWM (CCP1 + CCP2)

```c
// Drive two independent LED channels at different brightness levels
// CCP1 on RC2, CCP2 on RC1

void PWM_DualInit(void) {
    // Both channels share Timer2 (same frequency)
    PR2 = 249;  // 1 kHz

    // CCP1 setup (RC2)
    CCP1CON = 0x0C;
    TRISCbits.TRISC2 = 0;

    // CCP2 setup (RC1)
    CCP2CON = 0x0C;
    TRISCbits.TRISC1 = 0;

    // Start Timer2
    T2CON = 0x05;  // Prescaler=4, ON
}

void PWM1_SetDuty(uint16_t duty) {
    CCPR1L = (uint8_t)(duty >> 2);
    CCP1CONbits.DC1B1 = (duty >> 1) & 0x01;
    CCP1CONbits.DC1B0 = duty & 0x01;
}

void PWM2_SetDuty(uint16_t duty) {
    CCPR2L = (uint8_t)(duty >> 2);
    CCP2CONbits.DC2B1 = (duty >> 1) & 0x01;
    CCP2CONbits.DC2B0 = duty & 0x01;
}
```

---

## Interrupt-Driven PWM Updates

For smooth animations without blocking the main loop:

```c
#include <xc.h>

volatile uint16_t pwm_target = 0;
volatile uint16_t pwm_current = 0;

void __interrupt() ISR(void) {
    if (TMR0IF) {
        TMR0IF = 0;
        TMR0 = 6;  // Reload for ~1ms interrupt at 4MHz

        // Smooth ramp toward target
        if (pwm_current < pwm_target) {
            pwm_current += 2;
        } else if (pwm_current > pwm_target) {
            pwm_current -= 2;
        }

        // Update PWM duty
        CCPR1L = (uint8_t)(pwm_current >> 2);
        CCP1CONbits.DC1B1 = (pwm_current >> 1) & 0x01;
        CCP1CONbits.DC1B0 = pwm_current & 0x01;
    }
}

void main(void) {
    PWM_Init();

    // Configure Timer0 for periodic interrupt
    OPTION_REGbits.T0CS = 0;  // Internal clock
    OPTION_REGbits.PSA = 0;   // Prescaler to Timer0
    OPTION_REGbits.PS = 0b010; // 1:8 prescaler
    TMR0 = 6;

    INTCONbits.TMR0IE = 1;  // Enable Timer0 interrupt
    INTCONbits.GIE = 1;     // Enable global interrupts

    while (1) {
        pwm_target = 800;  // Set brightness target
        __delay_ms(2000);
        pwm_target = 100;
        __delay_ms(2000);
    }
}
```

---

## PIC vs Arduino for LED Projects

| Factor | PIC16F877A | Arduino Uno |
|--------|-----------|-------------|
| PWM channels | 2 (CCP1, CCP2) | 6 |
| PWM resolution | 10-bit native | 8-bit (16-bit with Timer1 hack) |
| Clock speed | 4-20 MHz | 16 MHz |
| Ease of use | Register-level C | Arduino framework (beginner-friendly) |
| Cost (unit) | $2-4 | $5-25 |
| Cost (volume) | $1-2 at 1000+ | Not practical |
| Ecosystem | Professional (Microchip support) | Hobbyist (community) |
| IDE | MPLAB X (complex, powerful) | Arduino IDE (simple) |

For hobbyists learning LED control, [Arduino](m2-arduino-led-control.md) is the better starting point. For professional products, PIC offers lower cost, industrial temperature range, and long-term availability from Microchip.

---

## Cross-References

- [MCU Comparison](m2-mcu-comparison.md) -- Full comparison of all five microcontroller platforms
- [Arduino LED Control](m2-arduino-led-control.md) -- Arduino approach for comparison
- [ESP32 LED Control](m2-esp32-led.md) -- WiFi-capable alternative
- [LED Fundamentals](m1-led-fundamentals.md) -- Forward voltage and I-V characteristics
- [Resistor Calculations](m1-resistor-calculations.md) -- Current-limiting for PIC GPIO-driven LEDs
- [Oscilloscope Basics](m7-oscilloscope-basics.md) -- Verifying PWM output signals

---

*Sources: Microchip PIC16F877A datasheet (DS30292C), MPLAB XC8 C Compiler User Guide, Microchip AN564 (Using CCP Modules), Microchip TB3016 (PWM Tips and Tricks), Microchip University training materials.*
