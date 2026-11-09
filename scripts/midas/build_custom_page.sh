#!/usr/bin/env bash

set -euo pipefail

if [[ $# -gt 0 ]]; then
    case "$1" in
        -h|--help)
            echo "Usage: ./scripts/midas/build_custom_page.sh"
            echo "Build the production dashboard bundle for MIDAS mhttpd."
            exit 0
            ;;
        *)
            echo "[build_custom_page, ERROR] Unknown option: $1" >&2
            exit 2
            ;;
    esac
fi

SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_DIR=$(realpath "$SCRIPT_DIR/../..")

if ! command -v node >/dev/null 2>&1; then
    if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
        # shellcheck source=/dev/null
        # nvm.sh may return non-zero when no default alias or .nvmrc exists.
        # Load its functions without letting errexit terminate this script.
        set +e
        source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
        set -e
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

GENERATE_SOURCEMAP=false PUBLIC_URL=/ npm run build
mkdir -p "$PROJECT_DIR/build/.well-known/appspecific"
printf '{}\n' > "$PROJECT_DIR/build/.well-known/appspecific/com.chrome.devtools.json"
echo "[build_custom_page] Built MIDAS custom page in $PROJECT_DIR/build"
