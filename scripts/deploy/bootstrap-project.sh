#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bootstrap-project.sh \
    --project <slug> \
    --domain <fqdn> \
    --image <image-name> \
    --port <host-port> \
    [--apps-dir /srv/proyectosDev] \
    [--caddy-snippets-dir /srv/infra/caddy/apps] \
    [--reload-caddy]

Example:
  bootstrap-project.sh \
    --project bio-dashboard \
    --domain bio-dashboard.cristianb.dev \
    --image bio-dashboard \
    --port 4010
EOF
}

PROJECT=""
DOMAIN=""
IMAGE=""
PORT=""
APPS_DIR="/srv/proyectosDev"
CADDY_SNIPPETS_DIR="/srv/infra/caddy/apps"
RELOAD_CADDY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT="${2:-}"; shift 2 ;;
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --image) IMAGE="${2:-}"; shift 2 ;;
    --port) PORT="${2:-}"; shift 2 ;;
    --apps-dir) APPS_DIR="${2:-}"; shift 2 ;;
    --caddy-snippets-dir) CADDY_SNIPPETS_DIR="${2:-}"; shift 2 ;;
    --reload-caddy) RELOAD_CADDY=1; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$PROJECT" || -z "$DOMAIN" || -z "$IMAGE" || -z "$PORT" ]]; then
  usage
  exit 1
fi

PROJECT_DIR="${APPS_DIR}/${PROJECT}"
COMPOSE_FILE="${PROJECT_DIR}/compose.yml"
ENV_FILE="${PROJECT_DIR}/.env"
CADDY_FILE="${CADDY_SNIPPETS_DIR}/${PROJECT}.Caddyfile"

mkdir -p "$PROJECT_DIR"
mkdir -p "$CADDY_SNIPPETS_DIR"

cat > "$COMPOSE_FILE" <<EOF
services:
  app:
    image: \${IMAGE}:\${IMAGE_TAG}
    container_name: ${PROJECT}-app
    restart: unless-stopped
    env_file:
      - ./.env
    ports:
      - "\${APP_PORT}:3000"
EOF

if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<EOF
# Deployment vars used by compose interpolation
PROJECT_SLUG=${PROJECT}
IMAGE=${IMAGE}
IMAGE_TAG=main
APP_PORT=${PORT}

# Healthcheck used by deploy-project.sh
HEALTHCHECK_PATH=/api/health

# App runtime vars
NODE_ENV=production
# KOBOTOOLBOX_TOKEN=replace-me
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=replace-me
# CLERK_SECRET_KEY=replace-me
EOF
fi

cat > "$CADDY_FILE" <<EOF
http://${DOMAIN} {
    bind 127.0.0.1
    import security_headers
    encode zstd gzip
    reverse_proxy 127.0.0.1:${PORT}
}
EOF

echo "Project bootstrapped at: $PROJECT_DIR"
echo "Caddy snippet created at: $CADDY_FILE"
echo "If not already configured, add this line once to your Caddyfile:"
echo "import ${CADDY_SNIPPETS_DIR}/*.Caddyfile"

if [[ "$RELOAD_CADDY" -eq 1 ]]; then
  if caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
    echo "Caddy reloaded"
  elif sudo -n systemctl reload caddy >/dev/null 2>&1; then
    echo "Caddy reloaded via systemctl"
  else
    echo "Warning: could not reload Caddy automatically" >&2
  fi
fi
