#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_DIR=$(realpath "$SCRIPT_DIR/../..")
BUILD_DIR=${DQM_BUILD_DIR:-$PROJECT_DIR/build}
EXPERIMENT=${MIDAS_EXPT_NAME:-${MIDAS_EXPERIMENT:-}}
GATEWAY_URL=${DQM_GATEWAY_URL:-http://127.0.0.1:8000}
PAGE_NAME=${DQM_MIDAS_PAGE_NAME:-DQM}
FORCE_CUSTOM_PATH=false

show_help() {
    cat <<EOF
Usage: ./scripts/midas/configure_custom_page.sh [OPTIONS]

Options:
  --experiment NAME    MIDAS experiment (default: MIDAS_EXPT_NAME)
  --gateway-url URL    DQM gateway base URL (default: http://127.0.0.1:8000)
  --page-name NAME     MIDAS custom-page name (default: DQM)
  --build-dir PATH     Production frontend bundle (default: build/)
  --force-custom-path Replace an existing MIDAS /Custom/Path value
  -h, --help           Display this help message
EOF
}

require_value() {
    if [[ $# -lt 2 || -z "${2:-}" || "${2:-}" == -* ]]; then
        echo "[configure_custom_page, ERROR] $1 requires a value" >&2
        exit 2
    fi
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --experiment) require_value "$@"; EXPERIMENT=$2; shift 2 ;;
        --gateway-url) require_value "$@"; GATEWAY_URL=$2; shift 2 ;;
        --page-name) require_value "$@"; PAGE_NAME=$2; shift 2 ;;
        --build-dir) require_value "$@"; BUILD_DIR=$2; shift 2 ;;
        --force-custom-path) FORCE_CUSTOM_PATH=true; shift ;;
        -h|--help) show_help; exit 0 ;;
        *) echo "[configure_custom_page, ERROR] Unknown option: $1" >&2; show_help; exit 2 ;;
    esac
done

if [[ -z "$EXPERIMENT" ]]; then
    echo "[configure_custom_page, ERROR] Use --experiment or set MIDAS_EXPT_NAME." >&2
    exit 2
fi
if [[ -z "${MIDASSYS:-}" || ! -x "$MIDASSYS/bin/odbedit" ]]; then
    echo "[configure_custom_page, ERROR] Set MIDASSYS to the MIDAS installation." >&2
    exit 1
fi
BUILD_DIR=$(realpath "$BUILD_DIR")
if [[ ! -f "$BUILD_DIR/index.html" ]]; then
    echo "[configure_custom_page, ERROR] Missing $BUILD_DIR/index.html" >&2
    echo "Run scripts/midas/build_custom_page.sh first." >&2
    exit 1
fi
if [[ "$EXPERIMENT$GATEWAY_URL$PAGE_NAME$BUILD_DIR" == *$'\n'* ||
      "$EXPERIMENT$GATEWAY_URL$PAGE_NAME$BUILD_DIR" == *'"'* ||
      "$EXPERIMENT$GATEWAY_URL$PAGE_NAME$BUILD_DIR" == *'\'* ]]; then
    echo "[configure_custom_page, ERROR] Values cannot contain quotes, backslashes, or newlines." >&2
    exit 2
fi
if [[ ! "$PAGE_NAME" =~ ^[A-Za-z0-9_-]+$ ]]; then
    echo "[configure_custom_page, ERROR] Page name must contain only letters, numbers, '_' or '-'." >&2
    exit 2
fi

cat > "$BUILD_DIR/dqm-config.js" <<EOF
window.DQM_CONFIG = {
  gatewayBaseUrl: "$GATEWAY_URL",
  midasEmbedded: true,
  midasPageName: "$PAGE_NAME"
};
EOF

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

ensure_key STRING "/Custom/Path"
ensure_key STRING "/Custom/$PAGE_NAME&"

current_path=$("${ODBEDIT[@]}" -c 'ls "/Custom/Path"' 2>/dev/null | sed -E 's/^[^[:space:]]+[[:space:]]*//')
if [[ -n "$current_path" && "$current_path" != "$BUILD_DIR" && "$FORCE_CUSTOM_PATH" != true ]]; then
    echo "[configure_custom_page, ERROR] /Custom/Path is already $current_path" >&2
    echo "Use --force-custom-path only when replacing it deliberately." >&2
    exit 1
fi

"${ODBEDIT[@]}" -c "set \"/Custom/Path\" \"$BUILD_DIR\"" >/dev/null
"${ODBEDIT[@]}" -c "set \"/Custom/$PAGE_NAME&\" \"index.html\"" >/dev/null

echo "[configure_custom_page] /Custom/Path = $BUILD_DIR"
echo "[configure_custom_page] /Custom/$PAGE_NAME& = index.html"
echo "[configure_custom_page] Gateway = $GATEWAY_URL"
