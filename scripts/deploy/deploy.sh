#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BASE_SCRIPT="${SCRIPT_DIR}/deploy-from-laptop.sh"
CONFIG_FILE_DEFAULT="${SCRIPT_DIR}/.deploy-target.env"

usage() {
  cat <<'HELP'
Usage:
  deploy.sh [options] [-- <extra deploy-from-laptop args>]

Options:
  --runtime-env-file <path>   Runtime env file (default: .env.production)
  --config-file <path>        Config file path (default: scripts/deploy/.deploy-target.env)
  --project <slug>            Server folder/project slug
  --subdomain <label>         Subdomain label (e.g. biodashboard)
  --domain <fqdn>             Full domain override
  --app-port <port>           Host port override (advanced)
  --server-host <host>        SSH host / alias override
  --server-user <user>        SSH user override
  --server-port <port>        SSH port override
  --reconfigure               Re-run interactive setup and overwrite config
  -h, --help                  Show this help

Examples:
  scripts/deploy/deploy.sh
  scripts/deploy/deploy.sh --runtime-env-file .env.production --allow-dirty
  scripts/deploy/deploy.sh --reconfigure
HELP
}

prompt_default() {
  local prompt="$1"
  local default_value="$2"
  local input

  read -r -p "${prompt} [${default_value}]: " input
  if [[ -z "$input" ]]; then
    printf '%s' "$default_value"
  else
    printf '%s' "$input"
  fi
}

slugify_repo_name() {
  local name
  name="$(basename "$ROOT_DIR")"
  name="${name,,}"
  name="${name//[^a-z0-9]/-}"
  name="$(printf '%s' "$name" | sed -E 's/-+/-/g; s/^-+//; s/-+$//')"
  printf '%s' "${name:-project}"
}

find_free_port() {
  local project="$1"
  local server_port="$2"
  local server_host="$3"
  local server_user="$4"
  local root_port="${5:-4010}"
  local ssh_target="${server_user}@${server_host}"

  ssh -p "$server_port" -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$ssh_target" \
    "PROJECT='${project}' START='${root_port}' bash -s" <<'REMOTE'
set -euo pipefail

existing_env="/srv/proyectosDev/${PROJECT}/.env"
if [[ -f "$existing_env" ]]; then
  existing_port="$(awk -F= '$1=="APP_PORT"{print $2; exit}' "$existing_env" || true)"
  if [[ "$existing_port" =~ ^[0-9]+$ ]]; then
    echo "$existing_port"
    exit 0
  fi
fi

mapfile -t used_ports < <(
  {
    find /srv/proyectosDev -maxdepth 3 -type f -name ".env" -exec awk -F= '$1=="APP_PORT"{print $2}' {} + 2>/dev/null || true
    ss -H -ltn 2>/dev/null | awk '{print $4}' | awk -F: '{print $NF}'
  } | grep -E '^[0-9]+$' | sort -u
)

for ((port=START; port<=4999; port++)); do
  taken=0
  for used in "${used_ports[@]}"; do
    if [[ "$used" == "$port" ]]; then
      taken=1
      break
    fi
  done
  if [[ "$taken" -eq 0 ]]; then
    echo "$port"
    exit 0
  fi
done

echo "No free app port found between ${START} and 4999" >&2
exit 1
REMOTE
}

validate_required() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "Missing required value: ${name}" >&2
    exit 1
  fi
}

RUNTIME_ENV_FILE="${DEPLOY_RUNTIME_ENV_FILE:-${ROOT_DIR}/.env.production}"
CONFIG_FILE="$CONFIG_FILE_DEFAULT"
RECONFIGURE=0

PROJECT="${DEPLOY_PROJECT:-}"
SUBDOMAIN="${DEPLOY_SUBDOMAIN:-}"
DOMAIN="${DEPLOY_DOMAIN:-}"
ROOT_DOMAIN="${DEPLOY_ROOT_DOMAIN:-cristianb.dev}"
APP_PORT="${DEPLOY_APP_PORT:-}"
SERVER_HOST="${DEPLOY_SERVER_HOST:-bio-server-ts}"
SERVER_USER="${DEPLOY_SERVER_USER:-cristianbdev}"
SERVER_PORT="${DEPLOY_SERVER_PORT:-22}"

FORWARD_ARGS=()
APP_PORT_FROM_CLI=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runtime-env-file) RUNTIME_ENV_FILE="$2"; shift 2 ;;
    --config-file) CONFIG_FILE="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --subdomain) SUBDOMAIN="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --app-port) APP_PORT="$2"; APP_PORT_FROM_CLI=1; shift 2 ;;
    --server-host) SERVER_HOST="$2"; shift 2 ;;
    --server-user) SERVER_USER="$2"; shift 2 ;;
    --server-port) SERVER_PORT="$2"; shift 2 ;;
    --reconfigure) RECONFIGURE=1; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    --) shift; FORWARD_ARGS+=("$@"); break ;;
    *)
      FORWARD_ARGS+=("$1")
      shift
      ;;
  esac
done

if [[ "$RECONFIGURE" -eq 0 && -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
  PROJECT="${PROJECT:-${DEPLOY_PROJECT:-}}"
  SUBDOMAIN="${SUBDOMAIN:-${DEPLOY_SUBDOMAIN:-}}"
  DOMAIN="${DOMAIN:-${DEPLOY_DOMAIN:-}}"
  ROOT_DOMAIN="${ROOT_DOMAIN:-${DEPLOY_ROOT_DOMAIN:-cristianb.dev}}"
  if [[ "$APP_PORT_FROM_CLI" -eq 0 ]]; then
    APP_PORT="${APP_PORT:-${DEPLOY_APP_PORT:-}}"
  fi
  SERVER_HOST="${SERVER_HOST:-${DEPLOY_SERVER_HOST:-bio-server-ts}}"
  SERVER_USER="${SERVER_USER:-${DEPLOY_SERVER_USER:-cristianbdev}}"
  SERVER_PORT="${SERVER_PORT:-${DEPLOY_SERVER_PORT:-22}}"
fi

NEEDS_INTERACTIVE_SETUP=0
if [[ "$RECONFIGURE" -eq 1 ]]; then
  NEEDS_INTERACTIVE_SETUP=1
elif [[ ! -f "$CONFIG_FILE" ]]; then
  NEEDS_INTERACTIVE_SETUP=1
elif [[ -z "$PROJECT" || ( -z "$DOMAIN" && -z "$SUBDOMAIN" ) ]]; then
  NEEDS_INTERACTIVE_SETUP=1
fi

if [[ "$NEEDS_INTERACTIVE_SETUP" -eq 1 ]]; then
  if [[ ! -t 0 ]]; then
    echo "Deploy setup requires interaction, but no interactive terminal is available." >&2
    echo "Provide all required args and run from an interactive shell, or pre-create $CONFIG_FILE." >&2
    exit 1
  fi

  default_slug="$(slugify_repo_name)"
  default_subdomain="$default_slug"
  echo "Initial deploy setup (saved for next runs):"
  PROJECT="$(prompt_default "Project slug (server folder)" "${PROJECT:-$default_slug}")"
  SUBDOMAIN="$(prompt_default "Subdomain label" "${SUBDOMAIN:-$default_subdomain}")"
fi

if [[ -z "$DOMAIN" ]]; then
  DOMAIN="${SUBDOMAIN}.${ROOT_DOMAIN}"
fi

validate_required "project" "$PROJECT"
validate_required "domain" "$DOMAIN"
validate_required "server-host" "$SERVER_HOST"
validate_required "server-user" "$SERVER_USER"

if [[ ! "$PROJECT" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Invalid project slug: $PROJECT" >&2
  exit 1
fi

if [[ ! "$SERVER_PORT" =~ ^[0-9]+$ ]]; then
  echo "Invalid server port: $SERVER_PORT" >&2
  exit 1
fi

if [[ ! -f "$RUNTIME_ENV_FILE" ]]; then
  echo "Runtime env file not found: $RUNTIME_ENV_FILE" >&2
  exit 1
fi

if [[ -n "$APP_PORT" ]]; then
  if [[ ! "$APP_PORT" =~ ^[0-9]+$ ]]; then
    echo "Invalid app port: $APP_PORT" >&2
    exit 1
  fi
else
  APP_PORT="$(find_free_port "$PROJECT" "$SERVER_PORT" "$SERVER_HOST" "$SERVER_USER" "4010")"
fi

mkdir -p "$(dirname "$CONFIG_FILE")"
cat > "$CONFIG_FILE" <<EOF
DEPLOY_PROJECT=${PROJECT}
DEPLOY_SUBDOMAIN=${SUBDOMAIN}
DEPLOY_DOMAIN=${DOMAIN}
DEPLOY_ROOT_DOMAIN=${ROOT_DOMAIN}
DEPLOY_APP_PORT=${APP_PORT}
DEPLOY_SERVER_HOST=${SERVER_HOST}
DEPLOY_SERVER_USER=${SERVER_USER}
DEPLOY_SERVER_PORT=${SERVER_PORT}
EOF

echo "Using deploy target: ${PROJECT} -> https://${DOMAIN}"

exec "$BASE_SCRIPT" \
  --project "$PROJECT" \
  --domain "$DOMAIN" \
  --app-port "$APP_PORT" \
  --server-host "$SERVER_HOST" \
  --server-user "$SERVER_USER" \
  --server-port "$SERVER_PORT" \
  --runtime-env-file "$RUNTIME_ENV_FILE" \
  "${FORWARD_ARGS[@]}"
