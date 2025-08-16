#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$REPO_ROOT/scripts/nginx/nginx.pid"

# Ensure scripts/nginx folder exists (for logs and PID)
mkdir -p "$REPO_ROOT/scripts/nginx"

# Start nginx in the background with repo root as prefix
nginx -p "$REPO_ROOT" -c scripts/nginx/nginx.conf -g "pid $PID_FILE;" &

echo "nginx started with PID $! (prefix=$REPO_ROOT)"
