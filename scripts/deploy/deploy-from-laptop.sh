#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'HELP'
Usage:
  deploy-from-laptop.sh \
    --project <slug> \
    --domain <fqdn> \
    --app-port <port> \
    --server-host <host-or-ip-or-ssh-alias> \
    --server-user <ssh-user> \
    --runtime-env-file <path> \
    [--server-port 22] \
    [--tag <tag>] \
    [--build-arg KEY=VALUE] \
    [--timeout 120] \
    [--no-caddy-reload] \
    [--allow-dirty]

Notes:
  - No container registry is used.
  - The script ships source code to the server, builds there, and deploys locally built images.
  - By default, it deploys committed code from HEAD.

Example:
  deploy-from-laptop.sh \
    --project bio-dashboard \
    --domain dashboard.cristianb.dev \
    --app-port 4010 \
    --server-host bio-server-ts \
    --server-user cristianbdev \
    --runtime-env-file .env.production
HELP
}

PROJECT=""
DOMAIN=""
APP_PORT=""
SERVER_HOST=""
SERVER_USER=""
SERVER_PORT=22
RUNTIME_ENV_FILE=""
TAG=""
TIMEOUT_SECONDS=120
RELOAD_CADDY=1
ALLOW_DIRTY=0
RETAIN_RELEASES="${DEPLOY_RETAIN_RELEASES:-2}"

EXTRA_BUILD_ARGS=()
AUTO_BUILD_ARGS=()

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing command: $cmd" >&2
    exit 1
  fi
}

is_repo_dirty() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    return 0
  fi

  if [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    return 0
  fi

  return 1
}

collect_auto_build_args() {
  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    local line key value
    line="${raw_line%$'\r'}"

    [[ -z "$line" ]] && continue
    [[ "$line" == \#* ]] && continue

    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      key="${line%%=*}"
      value="${line#*=}"
      if [[ "$key" == NEXT_PUBLIC_* ]]; then
        AUTO_BUILD_ARGS+=("${key}=${value}")
      fi
    fi
  done < "$RUNTIME_ENV_FILE"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT="${2:-}"; shift 2 ;;
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --app-port) APP_PORT="${2:-}"; shift 2 ;;
    --server-host) SERVER_HOST="${2:-}"; shift 2 ;;
    --server-user) SERVER_USER="${2:-}"; shift 2 ;;
    --server-port) SERVER_PORT="${2:-}"; shift 2 ;;
    --runtime-env-file) RUNTIME_ENV_FILE="${2:-}"; shift 2 ;;
    --tag) TAG="${2:-}"; shift 2 ;;
    --build-arg) EXTRA_BUILD_ARGS+=("${2:-}"); shift 2 ;;
    --timeout) TIMEOUT_SECONDS="${2:-}"; shift 2 ;;
    --no-caddy-reload) RELOAD_CADDY=0; shift 1 ;;
    --allow-dirty) ALLOW_DIRTY=1; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$PROJECT" || -z "$DOMAIN" || -z "$APP_PORT" || -z "$SERVER_HOST" || -z "$SERVER_USER" || -z "$RUNTIME_ENV_FILE" ]]; then
  usage
  exit 1
fi

if [[ ! "$PROJECT" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Invalid --project. Expected ^[a-z0-9][a-z0-9-]*$" >&2
  exit 1
fi

if [[ ! "$APP_PORT" =~ ^[0-9]+$ ]]; then
  echo "Invalid --app-port. Must be numeric." >&2
  exit 1
fi

if [[ ! "$SERVER_PORT" =~ ^[0-9]+$ ]]; then
  echo "Invalid --server-port. Must be numeric." >&2
  exit 1
fi

if [[ ! "$TIMEOUT_SECONDS" =~ ^[0-9]+$ ]]; then
  echo "Invalid --timeout. Must be numeric." >&2
  exit 1
fi

if [[ ! "$RETAIN_RELEASES" =~ ^[0-9]+$ ]] || [[ "$RETAIN_RELEASES" -lt 1 ]]; then
  echo "Invalid DEPLOY_RETAIN_RELEASES (must be >= 1): $RETAIN_RELEASES" >&2
  exit 1
fi

if [[ ! -f "$RUNTIME_ENV_FILE" ]]; then
  echo "Runtime env file not found: $RUNTIME_ENV_FILE" >&2
  exit 1
fi

if [[ "$ALLOW_DIRTY" -eq 0 ]] && is_repo_dirty; then
  echo "Working tree is dirty. Commit/stash changes or use --allow-dirty." >&2
  exit 1
fi

if [[ -z "$TAG" ]]; then
  TAG="sha-$(git rev-parse --short=12 HEAD)-$(date +%Y%m%d%H%M%S)"
fi

require_cmd git
require_cmd ssh
require_cmd scp
require_cmd mktemp
require_cmd tar

SSH_TARGET="${SERVER_USER}@${SERVER_HOST}"
SSH_OPTS=(-p "$SERVER_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
SCP_OPTS=(-P "$SERVER_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)

if ! getent hosts "$DOMAIN" >/dev/null 2>&1; then
  echo "Warning: ${DOMAIN} does not resolve in DNS from this machine." >&2
  echo "Deployment can continue, but public access will fail until DNS/tunnel routing exists." >&2
fi

echo "Preflight SSH -> ${SSH_TARGET}:${SERVER_PORT}"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'command -v docker >/dev/null 2>&1 && echo "SSH and Docker OK on $(hostname)"'

collect_auto_build_args

TMP_ARCHIVE="$(mktemp)"
TMP_ENV="$(mktemp)"
TMP_BUILD_ARGS="$(mktemp)"
trap 'rm -f "$TMP_ARCHIVE" "$TMP_ENV" "$TMP_BUILD_ARGS"' EXIT

if [[ "$ALLOW_DIRTY" -eq 1 ]]; then
  echo "Packaging source from working tree (allow-dirty enabled)"
  tar --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='coverage' --exclude='out' --exclude='build' --exclude='.env' --exclude='.env.*' -czf "$TMP_ARCHIVE" .
else
  echo "Packaging source from git HEAD"
  git archive --format=tar.gz --output "$TMP_ARCHIVE" HEAD
fi

cat > "$TMP_ENV" <<ENVEOF
PROJECT_SLUG=${PROJECT}
IMAGE=${PROJECT}
IMAGE_TAG=main
APP_PORT=${APP_PORT}
HEALTHCHECK_PATH=/api/health
NODE_ENV=production
ENVEOF
cat "$RUNTIME_ENV_FILE" >> "$TMP_ENV"

for kv in "${AUTO_BUILD_ARGS[@]}"; do
  printf '%s\n' "$kv" >> "$TMP_BUILD_ARGS"
done
for kv in "${EXTRA_BUILD_ARGS[@]}"; do
  printf '%s\n' "$kv" >> "$TMP_BUILD_ARGS"
done

echo "Installing deploy scripts on server"
scp "${SCP_OPTS[@]}" scripts/deploy/bootstrap-project.sh scripts/deploy/deploy-project.sh "${SSH_TARGET}:/tmp/"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
  "mkdir -p /srv/scripts && install -m 755 /tmp/bootstrap-project.sh /srv/scripts/bootstrap-project.sh && install -m 755 /tmp/deploy-project.sh /srv/scripts/deploy-project.sh"

BOOTSTRAP_FLAGS=()
if [[ "$RELOAD_CADDY" -eq 1 ]]; then
  BOOTSTRAP_FLAGS+=(--reload-caddy)
fi

echo "Bootstrapping project on server"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
  "/srv/scripts/bootstrap-project.sh --project '${PROJECT}' --domain '${DOMAIN}' --image '${PROJECT}' --port '${APP_PORT}' ${BOOTSTRAP_FLAGS[*]}"

echo "Syncing runtime env file"
scp "${SCP_OPTS[@]}" "$TMP_ENV" "${SSH_TARGET}:/srv/proyectosDev/${PROJECT}/.env"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "chmod 600 /srv/proyectosDev/${PROJECT}/.env"

REMOTE_ARCHIVE="/tmp/${PROJECT}-${TAG}.src.tar.gz"
REMOTE_BUILD_ARGS="/tmp/${PROJECT}-${TAG}.build-args"

echo "Uploading source package and build args"
scp "${SCP_OPTS[@]}" "$TMP_ARCHIVE" "${SSH_TARGET}:${REMOTE_ARCHIVE}"
scp "${SCP_OPTS[@]}" "$TMP_BUILD_ARGS" "${SSH_TARGET}:${REMOTE_BUILD_ARGS}"

echo "Building image on server: ${PROJECT}:${TAG}"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
  "PROJECT='${PROJECT}' TAG='${TAG}' REMOTE_ARCHIVE='${REMOTE_ARCHIVE}' REMOTE_BUILD_ARGS='${REMOTE_BUILD_ARGS}' bash -s" <<'REMOTE_BUILD'
set -euo pipefail

PROJECT_DIR="/srv/proyectosDev/${PROJECT}"
RELEASES_DIR="${PROJECT_DIR}/releases"
RELEASE_DIR="${RELEASES_DIR}/${TAG}"

mkdir -p "$RELEASE_DIR"
tar -xzf "$REMOTE_ARCHIVE" -C "$RELEASE_DIR"

cd "$RELEASE_DIR"

build_cmd=(docker build -f Dockerfile -t "${PROJECT}:${TAG}" -t "${PROJECT}:main")
if [[ -s "$REMOTE_BUILD_ARGS" ]]; then
  while IFS= read -r kv; do
    [[ -z "$kv" ]] && continue
    build_cmd+=(--build-arg "$kv")
  done < "$REMOTE_BUILD_ARGS"
fi
build_cmd+=(.)

"${build_cmd[@]}"

rm -f "$REMOTE_ARCHIVE" "$REMOTE_BUILD_ARGS"
REMOTE_BUILD

echo "Running remote deployment"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
  "/srv/scripts/deploy-project.sh --project '${PROJECT}' --image '${PROJECT}' --tag '${TAG}' --timeout '${TIMEOUT_SECONDS}' --skip-pull"

echo "Applying release retention policy (keep ${RETAIN_RELEASES})"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
  "PROJECT='${PROJECT}' RETAIN='${RETAIN_RELEASES}' bash -s" <<'REMOTE_RETENTION'
set -euo pipefail

PROJECT_DIR="/srv/proyectosDev/${PROJECT}"
RELEASES_DIR="${PROJECT_DIR}/releases"
mkdir -p "$RELEASES_DIR"

mapfile -t releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %f\n' 2>/dev/null | sort -nr | awk '{print $2}')

keep_tags=()
for ((i=0; i<${#releases[@]} && i<RETAIN; i++)); do
  keep_tags+=("${releases[$i]}")
done

for ((i=RETAIN; i<${#releases[@]}; i++)); do
  rm -rf "${RELEASES_DIR}/${releases[$i]}"
done

mapfile -t image_tags < <(docker image ls --format '{{.Repository}}:{{.Tag}}' "${PROJECT}" 2>/dev/null | sed -n "s#^${PROJECT}:##p" | sort -u)
for tag in "${image_tags[@]}"; do
  [[ "$tag" == "main" ]] && continue
  keep=0
  for kept in "${keep_tags[@]}"; do
    if [[ "$tag" == "$kept" ]]; then
      keep=1
      break
    fi
  done
  if [[ "$keep" -eq 0 ]]; then
    docker image rm "${PROJECT}:${tag}" >/dev/null 2>&1 || true
  fi
done

echo "Retention done. Releases kept: ${#keep_tags[@]}"
REMOTE_RETENTION

echo "Deployment finished: https://${DOMAIN}"
echo "Version: ${PROJECT}:${TAG}"
