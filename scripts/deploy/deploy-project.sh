#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  deploy-project.sh --project <slug> --image <image> --tag <tag> [--apps-dir /srv/proyectosDev] [--timeout 120] [--skip-pull]

Example:
  deploy-project.sh --project bio-dashboard --image bio-dashboard --tag sha-abc123 --skip-pull
EOF
}

PROJECT=""
IMAGE=""
TAG=""
APPS_DIR="/srv/proyectosDev"
TIMEOUT_SECONDS=120
SKIP_PULL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT="${2:-}"; shift 2 ;;
    --image) IMAGE="${2:-}"; shift 2 ;;
    --tag) TAG="${2:-}"; shift 2 ;;
    --apps-dir) APPS_DIR="${2:-}"; shift 2 ;;
    --timeout) TIMEOUT_SECONDS="${2:-}"; shift 2 ;;
    --skip-pull) SKIP_PULL=1; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$PROJECT" || -z "$IMAGE" || -z "$TAG" ]]; then
  usage
  exit 1
fi

PROJECT_DIR="${APPS_DIR}/${PROJECT}"
COMPOSE_FILE="${PROJECT_DIR}/compose.yml"
ENV_FILE="${PROJECT_DIR}/.env"
STATE_DIR="${PROJECT_DIR}/.deploy"
LAST_TAG_FILE="${STATE_DIR}/last_successful_tag"
LOCK_FILE="/tmp/deploy-${PROJECT}.lock"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing compose file: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$STATE_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Deployment already running for project: $PROJECT" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
  HEALTH_URL="$HEALTHCHECK_URL"
else
  APP_PORT="${APP_PORT:-3000}"
  HEALTH_PATH="${HEALTHCHECK_PATH:-/api/health}"
  HEALTH_URL="http://127.0.0.1:${APP_PORT}${HEALTH_PATH}"
fi

PREVIOUS_TAG=""
if [[ -f "$LAST_TAG_FILE" ]]; then
  PREVIOUS_TAG="$(<"$LAST_TAG_FILE")"
fi

run_compose() {
  local deploy_tag="$1"
  if [[ "$SKIP_PULL" -eq 0 ]]; then
    IMAGE="$IMAGE" IMAGE_TAG="$deploy_tag" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
  else
    echo "Skipping image pull for ${IMAGE}:${deploy_tag}"
  fi
  IMAGE="$IMAGE" IMAGE_TAG="$deploy_tag" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans
}

wait_for_health() {
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  while (( SECONDS < deadline )); do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

echo "Deploying ${PROJECT} -> ${IMAGE}:${TAG}"
run_compose "$TAG"

if wait_for_health; then
  echo "$TAG" > "$LAST_TAG_FILE"
  echo "Deployment OK"
  exit 0
fi

echo "Deployment failed healthcheck (${HEALTH_URL})" >&2

if [[ -n "$PREVIOUS_TAG" && "$PREVIOUS_TAG" != "$TAG" ]]; then
  echo "Rolling back to ${IMAGE}:${PREVIOUS_TAG}"
  run_compose "$PREVIOUS_TAG"
  if wait_for_health; then
    echo "Rollback OK"
  else
    echo "Rollback failed healthcheck" >&2
  fi
fi

exit 1
