#!/bin/bash
set -euo pipefail

SCRIPT_NAME="[run.sh]"

# Resolve repo root (two levels up from this script)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$REPO_ROOT/scripts/nginx/nginx.pid"
LOG_DIR="$REPO_ROOT/scripts/nginx"

# Ensure logs/dir exists
mkdir -p "$LOG_DIR"

# Optionally stop any existing nginx instance first
if "$REPO_ROOT/scripts/nginx/stop.sh"; then
    echo "$SCRIPT_NAME: Previous nginx instance stopped."
else
    echo "$SCRIPT_NAME: No existing nginx instance found."
fi

# Start nginx in the background with repo root as prefix
nginx -p "$REPO_ROOT" -c "$REPO_ROOT/scripts/nginx/nginx.conf" -g "pid $PID_FILE;" &

echo "$SCRIPT_NAME: nginx started with PID $! (prefix=$REPO_ROOT)"
