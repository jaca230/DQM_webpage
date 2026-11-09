#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(dirname "$(realpath "$0")")
EXPERIMENT=${MIDAS_EXPT_NAME:-${MIDAS_EXPERIMENT:-}}
GATEWAY_URL=${DQM_GATEWAY_URL:-http://127.0.0.1:8000}
PORT=${MIDAS_HTTP_PORT:-8080}
PAGE_NAME=${DQM_MIDAS_PAGE_NAME:-DQM}
BUILD_DIR=${DQM_BUILD_DIR:-}
BUILD_PAGE=true
NO_HOSTLIST=false
FORCE_CUSTOM_PATH=false

show_help() {
    cat <<EOF
Usage: ./scripts/midas/launch.sh [OPTIONS]

Build, register, and serve the DQM dashboard as a MIDAS custom page.

Options:
  --experiment NAME    MIDAS experiment (default: MIDAS_EXPT_NAME)
  --gateway-url URL    DQM gateway URL (default: http://127.0.0.1:8000)
  --port PORT           mhttpd HTTP port (default: 8080)
  --page-name NAME      MIDAS custom-page name (default: DQM)
  --build-dir PATH      Production frontend bundle (default: build/)
  --skip-build          Reuse the existing production bundle
  --force-custom-path   Replace an existing MIDAS /Custom/Path value
  --no-hostlist         Disable the MIDAS hostlist for local testing only
  -h, --help            Display this help message
EOF
}

require_value() {
    if [[ $# -lt 2 || -z "${2:-}" || "${2:-}" == -* ]]; then
        echo "[launch, ERROR] $1 requires a value" >&2
        exit 2
    fi
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --experiment) require_value "$@"; EXPERIMENT=$2; shift 2 ;;
        --gateway-url) require_value "$@"; GATEWAY_URL=$2; shift 2 ;;
        --port) require_value "$@"; PORT=$2; shift 2 ;;
        --page-name) require_value "$@"; PAGE_NAME=$2; shift 2 ;;
        --build-dir) require_value "$@"; BUILD_DIR=$2; shift 2 ;;
        --skip-build) BUILD_PAGE=false; shift ;;
        --force-custom-path) FORCE_CUSTOM_PATH=true; shift ;;
        --no-hostlist) NO_HOSTLIST=true; shift ;;
        -h|--help) show_help; exit 0 ;;
        *) echo "[launch, ERROR] Unknown option: $1" >&2; show_help; exit 2 ;;
    esac
done

if [[ -z "$EXPERIMENT" ]]; then
    echo "[launch, ERROR] Use --experiment or set MIDAS_EXPT_NAME." >&2
    exit 2
fi
if [[ -z "${MIDASSYS:-}" || ! -x "$MIDASSYS/bin/mhttpd" || ! -x "$MIDASSYS/bin/odbedit" ]]; then
    echo "[launch, ERROR] Set MIDASSYS to the MIDAS installation." >&2
    exit 1
fi

if [[ "$BUILD_PAGE" == true ]]; then
    "$SCRIPT_DIR/build_custom_page.sh"
fi

CONFIGURE_ARGS=(
    --experiment "$EXPERIMENT"
    --gateway-url "$GATEWAY_URL"
    --page-name "$PAGE_NAME"
)
RUN_ARGS=(
    --experiment "$EXPERIMENT"
    --port "$PORT"
    --page-name "$PAGE_NAME"
)
if [[ -n "$BUILD_DIR" ]]; then
    CONFIGURE_ARGS+=(--build-dir "$BUILD_DIR")
    RUN_ARGS+=(--build-dir "$BUILD_DIR")
fi
[[ "$FORCE_CUSTOM_PATH" == true ]] && CONFIGURE_ARGS+=(--force-custom-path)
[[ "$NO_HOSTLIST" == true ]] && RUN_ARGS+=(--no-hostlist)

"$SCRIPT_DIR/configure_custom_page.sh" "${CONFIGURE_ARGS[@]}"
exec "$SCRIPT_DIR/run_mhttpd.sh" "${RUN_ARGS[@]}"
