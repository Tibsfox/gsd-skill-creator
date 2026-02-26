#!/bin/bash
KEY_PATH="$HOME/.ssh/id_rsa"
cat ~/.ssh/id_rsa | ssh-add -
echo "Using SSH_AUTH_SOCK=$SSH_AUTH_SOCK"
