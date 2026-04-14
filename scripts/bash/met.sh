#!/bin/bash
# Artemis II Mission Elapsed Time (MET) Clock
# T-0: 2026-04-01T22:35:12Z (Liftoff from Pad 39B)
# Usage: ./met.sh        (one-shot)
#        ./met.sh -w     (watch mode, updates every second)

T0=1775082912  # epoch seconds for 2026-04-01T22:35:12Z

met_display() {
    local now=$(date -u +%s)
    local elapsed=$((now - T0))
    local sign="+"
    if [ $elapsed -lt 0 ]; then
        sign="-"
        elapsed=$((-elapsed))
    fi

    local days=$((elapsed / 86400))
    local hours=$(( (elapsed % 86400) / 3600 ))
    local mins=$(( (elapsed % 3600) / 60 ))
    local secs=$((elapsed % 60))

    if [ $days -gt 0 ]; then
        printf "MET %s%dd %02d:%02d:%02d\n" "$sign" $days $hours $mins $secs
    else
        printf "MET %s%02d:%02d:%02d\n" "$sign" $hours $mins $secs
    fi
}

if [ "$1" = "-w" ]; then
    while true; do
        printf "\r$(met_display)  $(date -u +'%H:%M:%S UTC')  $(date +'%H:%M:%S %Z')  "
        sleep 1
    done
else
    met_display
fi
