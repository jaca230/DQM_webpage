#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_DIR=$(realpath "$SCRIPT_DIR/../..")
BUILD_DIR=${DQM_BUILD_DIR:-$PROJECT_DIR/build}
EXPERIMENT=${1:-${MIDAS_EXPERIMENT:-}}
GATEWAY_URL=${2:-${DQM_GATEWAY_URL:-http://127.0.0.1:8080}}
PAGE_NAME=${DQM_MIDAS_PAGE_NAME:-DQM}

if [[ -z "$EXPERIMENT" ]]; then
    echo "Usage: $0 EXPERIMENT [GATEWAY_URL]" >&2
    exit 2
fi
if [[ -z "${MIDASSYS:-}" || ! -x "$MIDASSYS/bin/odbedit" ]]; then
    echo "[configure_custom_page, ERROR] Set MIDASSYS to the MIDAS installation." >&2
    exit 1
fi
if [[ ! -f "$BUILD_DIR/index.html" ]]; then
    echo "[configure_custom_page, ERROR] Missing $BUILD_DIR/index.html" >&2
    echo "Run scripts/midas/build_custom_page.sh first." >&2
    exit 1
fi
if [[ "$EXPERIMENT$GATEWAY_URL$PAGE_NAME$BUILD_DIR" == *$'\n'* ||
      "$EXPERIMENT$GATEWAY_URL$PAGE_NAME$BUILD_DIR" == *'"'* ||
      "$EXPERIMENT$GATEWAY_URL$PAGE_NAME$BUILD_DIR" == *'\'* ]]; then
    echo "[configure_custom_page, ERROR] Arguments cannot contain quotes, backslashes, or newlines." >&2
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
if [[ -n "$current_path" && "$current_path" != "$BUILD_DIR" &&
      "${DQM_FORCE_CUSTOM_PATH:-0}" != 1 ]]; then
    echo "[configure_custom_page, ERROR] /Custom/Path is already $current_path" >&2
    echo "Copy this build under that directory, or set DQM_FORCE_CUSTOM_PATH=1 deliberately." >&2
    exit 1
fi

"${ODBEDIT[@]}" -c "set \"/Custom/Path\" \"$BUILD_DIR\"" >/dev/null
"${ODBEDIT[@]}" -c "set \"/Custom/$PAGE_NAME&\" \"index.html\"" >/dev/null

echo "[configure_custom_page] /Custom/Path = $BUILD_DIR"
echo "[configure_custom_page] /Custom/$PAGE_NAME& = index.html"
echo "[configure_custom_page] Gateway = $GATEWAY_URL"
