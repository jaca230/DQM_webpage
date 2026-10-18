#!/usr/bin/env bash

set -euo pipefail

EXPERIMENT=${1:-${MIDAS_EXPERIMENT:-}}
PORT=${2:-${MIDAS_HTTP_PORT:-8081}}
PAGE_NAME=${DQM_MIDAS_PAGE_NAME:-DQM}

if [[ -z "$EXPERIMENT" ]]; then
    echo "Usage: $0 EXPERIMENT [HTTP_PORT] [mhttpd arguments...]" >&2
    exit 2
fi
if [[ -z "${MIDASSYS:-}" || ! -x "$MIDASSYS/bin/mhttpd" ]]; then
    echo "[run_mhttpd, ERROR] Set MIDASSYS to the MIDAS installation." >&2
    exit 1
fi

if [[ ! "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1 || PORT > 65535 )); then
    echo "[run_mhttpd, ERROR] Invalid HTTP port: $PORT" >&2
    exit 2
fi

shift $(( $# > 0 ? 1 : 0 ))
shift $(( $# > 0 ? 1 : 0 ))

ODBEDIT=("$MIDASSYS/bin/odbedit" -q -e "$EXPERIMENT")
ensure_key() {
    local type=$1
    local path=$2
    local listing
    listing=$("${ODBEDIT[@]}" -c "ls \"$path\"" 2>&1 || true)
    if [[ "$listing" == *"not found"* ]]; then
        "${ODBEDIT[@]}" -c "create $type \"$path\"" >/dev/null
    fi
}

ensure_key BOOL "/WebServer/Enable localhost port"
ensure_key INT32 "/WebServer/localhost port"
"${ODBEDIT[@]}" -c 'set "/WebServer/Enable localhost port" y' >/dev/null
"${ODBEDIT[@]}" -c "set \"/WebServer/localhost port\" $PORT" >/dev/null

echo "[run_mhttpd] DQM page: http://127.0.0.1:$PORT/$PAGE_NAME"
exec "$MIDASSYS/bin/mhttpd" -e "$EXPERIMENT" "$@"
