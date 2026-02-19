# Hello DSKY -- display a number on R1
#
# The simplest AGC program: loads an octal value and writes it to
# DSKY channel 10 (relay word 1, controlling the R1 display).
# Then enters a busy loop to halt.
#
# Curriculum Exercise 1: Your First AGC Program

SETLOC   4000

HELLO    CA     DISPVAL      # Load display value into A
         EXTEND
         WRITE  10           # Write A to channel 10 (DSKY relay word 1)
DONE     TC     DONE         # Halt: loop forever

DISPVAL  OCT    12345        # Display pattern for R1
