#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$REPO_ROOT/scripts/nginx/nginx.pid"

if [[ -f "$PID_FILE" ]]; then
    PID=$(cat "$PID_FILE")
    kill "$PID" && echo "Stopped nginx (PID $PID)"
    rm -f "$PID_FILE"
else
    echo "No PID file found, is nginx running?"
fi
