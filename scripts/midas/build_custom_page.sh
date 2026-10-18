#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_DIR=$(realpath "$SCRIPT_DIR/../..")

if ! command -v node >/dev/null 2>&1; then
    if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
        # shellcheck source=/dev/null
        source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
        nvm use --silent 20 >/dev/null
    fi
fi

for command_name in node npm; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "[build_custom_page, ERROR] $command_name is unavailable." >&2
        echo "Install Node.js 20+, or install it through nvm." >&2
        exit 1
    fi
done

cd "$PROJECT_DIR"
if [[ ! -d node_modules ]]; then
    npm ci
fi

PUBLIC_URL=/ npm run build
echo "[build_custom_page] Built MIDAS custom page in $PROJECT_DIR/build"
