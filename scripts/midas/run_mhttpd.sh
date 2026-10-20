#!/usr/bin/env bash

set -euo pipefail

EXPERIMENT=${MIDAS_EXPT_NAME:-${MIDAS_EXPERIMENT:-}}
PORT=${MIDAS_HTTP_PORT:-8081}
PAGE_NAME=${DQM_MIDAS_PAGE_NAME:-DQM}
MHTTPD_ARGS=()

show_help() {
    cat <<EOF
Usage: ./scripts/midas/run_mhttpd.sh [OPTIONS] [-- MHTTPD_ARGS...]

Options:
  --experiment NAME   MIDAS experiment (default: MIDAS_EXPT_NAME)
  --port PORT         Local HTTP port (default: 8081)
  --page-name NAME    Custom-page name printed in the launch URL (default: DQM)
  --no-hostlist       Forward MIDAS's --no-hostlist option
  -h, --help          Display this help message
EOF
}

require_value() {
    if [[ $# -lt 2 || -z "${2:-}" || "${2:-}" == -* ]]; then
        echo "[run_mhttpd, ERROR] $1 requires a value" >&2
        exit 2
    fi
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --experiment) require_value "$@"; EXPERIMENT=$2; shift 2 ;;
        --port) require_value "$@"; PORT=$2; shift 2 ;;
        --page-name) require_value "$@"; PAGE_NAME=$2; shift 2 ;;
        --no-hostlist) MHTTPD_ARGS+=(--no-hostlist); shift ;;
        -h|--help) show_help; exit 0 ;;
        --) shift; MHTTPD_ARGS+=("$@"); break ;;
        *) echo "[run_mhttpd, ERROR] Unknown option: $1" >&2; show_help; exit 2 ;;
    esac
done

if [[ -z "$EXPERIMENT" ]]; then
    echo "[run_mhttpd, ERROR] Use --experiment or set MIDAS_EXPT_NAME." >&2
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
if [[ ! "$PAGE_NAME" =~ ^[A-Za-z0-9_-]+$ ]]; then
    echo "[run_mhttpd, ERROR] Invalid page name: $PAGE_NAME" >&2
    exit 2
fi

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
exec "$MIDASSYS/bin/mhttpd" -e "$EXPERIMENT" "${MHTTPD_ARGS[@]}"
