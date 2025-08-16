#!/bin/bash
set -euo pipefail

SCRIPT_NAME="[stop.sh]"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$REPO_ROOT/scripts/nginx/nginx.pid"

if [[ -f "$PID_FILE" ]]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        echo "$SCRIPT_NAME: Sent TERM to nginx (PID $PID)"
    else
        echo "$SCRIPT_NAME: PID $PID not running"
    fi
else
    echo "$SCRIPT_NAME: No PID file found, is nginx running?"
fi
