#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
GENERIC_SCRIPT="${SCRIPT_DIR}/deploy.sh"

RUNTIME_ENV_FILE="${DEPLOY_RUNTIME_ENV_FILE:-${ROOT_DIR}/.env.production}"
if [[ $# -gt 0 && -f "$1" ]]; then
  RUNTIME_ENV_FILE="$1"
  shift
fi

exec "$GENERIC_SCRIPT" \
  --runtime-env-file "$RUNTIME_ENV_FILE" \
  "$@"
