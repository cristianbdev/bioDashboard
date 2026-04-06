#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE_SCRIPT="${ROOT_DIR}/scripts/deploy/deploy-from-laptop.sh"

PROJECT_SLUG="replace-me"
PROJECT_DOMAIN="replace-me.cristianb.dev"
APP_PORT="4020"
SERVER_HOST="${DEPLOY_SERVER_HOST:-bio-server-ts}"
SERVER_USER="${DEPLOY_SERVER_USER:-cristianbdev}"
RUNTIME_ENV_FILE="${DEPLOY_RUNTIME_ENV_FILE:-${ROOT_DIR}/.env.production}"

if [[ $# -gt 0 && -f "$1" ]]; then
  RUNTIME_ENV_FILE="$1"
  shift
fi

if [[ "$PROJECT_SLUG" == "replace-me" || "$PROJECT_DOMAIN" == "replace-me.cristianb.dev" ]]; then
  echo "Edit scripts/deploy/deploy-project-template.sh and set PROJECT_SLUG + PROJECT_DOMAIN." >&2
  exit 1
fi

if [[ ! -f "$RUNTIME_ENV_FILE" ]]; then
  echo "Runtime env file not found: $RUNTIME_ENV_FILE" >&2
  exit 1
fi

EXTRA_ARGS=()
if [[ -n "${DEPLOY_SERVER_PORT:-}" ]]; then
  EXTRA_ARGS+=(--server-port "$DEPLOY_SERVER_PORT")
fi

exec "$BASE_SCRIPT" \
  --project "$PROJECT_SLUG" \
  --domain "$PROJECT_DOMAIN" \
  --app-port "$APP_PORT" \
  --server-host "$SERVER_HOST" \
  --server-user "$SERVER_USER" \
  --runtime-env-file "$RUNTIME_ENV_FILE" \
  "${EXTRA_ARGS[@]}" \
  "$@"
