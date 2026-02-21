# Calculator -- add two numbers
#
# Loads two decimal values from fixed memory, adds them using CA + AD,
# stores the result in erasable memory, and displays it on DSKY R1.
# Demonstrates ones' complement addition and memory addressing.
#
# Curriculum Exercise 3: Memory and Arithmetic

SETLOC   4000

CALC     CA     OPERAND1     # Load first operand
         AD     OPERAND2     # Add second operand
         TS     RESULT       # Store sum
         EXTEND
         WRITE  10           # Display on R1
         TC     DONE

DONE     TC     DONE         # Halt

OPERAND1 DEC    25
OPERAND2 DEC    37
RESULT   ERASE
