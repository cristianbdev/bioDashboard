# Deploy Standard (Laptop -> Server over SSH/Tailscale)

This is the deployment strategy to reuse across projects.

## Goal

Deploy directly from your laptop to your server without GitHub Actions or container registry.

Flow:

1. Package source code from the repo (versioned tag).
2. Upload package to server over SSH (preferably Tailscale).
3. Build Docker image on server.
4. Run deployment with healthcheck and rollback.
5. Route public hostname with Caddy + Cloudflare Tunnel.

## Required project files

Every deployable project should include:

1. `Dockerfile` (production-ready).
2. Health endpoint (for example `/api/health`).
3. `scripts/deploy/bootstrap-project.sh`.
4. `scripts/deploy/deploy-project.sh`.
5. `scripts/deploy/deploy-from-laptop.sh`.
6. `scripts/deploy/deploy.sh` (interactive config + execution).

Optional but recommended:

1. Project wrapper script like `scripts/deploy/deploy-<project>.sh`.
2. `.env.production` in local machine only (ignored by git).

## Server prerequisites (one time)

Required software:

1. Docker + Docker Compose.
2. Caddy.
3. cloudflared tunnel (already running in this server setup).

Required folders:

1. `/srv/scripts`
2. `/srv/proyectosDev`
3. `/srv/infra/caddy/apps`

Caddy root config should include:

`import /srv/infra/caddy/apps/*.Caddyfile`

## Connectivity standard

Use Tailscale between laptop and server.

Recommended SSH alias on laptop:

```sshconfig
Host bio-server-ts
  HostName <SERVER_TAILSCALE_IP>
  User <SERVER_USER>
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
```

## Environment files

Use separate env files per environment:

1. `.env.local` for local development (test keys).
2. `.env.production` for server runtime (live keys).

`deploy-from-laptop.sh` always pushes `.env.production` content into:

`/srv/proyectosDev/<project-slug>/.env`

Important for Next.js apps:

1. Any `NEXT_PUBLIC_*` variables in runtime env are automatically injected as Docker build args.
2. Keep production `NEXT_PUBLIC_*` values in `.env.production`.

## Deploy command (recommended)

```bash
scripts/deploy/deploy.sh --runtime-env-file .env.production
```

On first run, it asks and saves:

1. Project slug (server folder under `/srv/proyectosDev/`).
2. Subdomain label.
3. App port is selected automatically (first free from `4010+`) and persisted.
4. SSH target uses defaults (`bio-server-ts`, `cristianbdev`, `22`) unless overridden.

Saved config file:

`scripts/deploy/.deploy-target.env`

Subsequent runs reuse that config automatically.

Useful runtime flags:

1. `--tag <custom-tag>`
2. `--timeout <seconds>`
3. `--allow-dirty` (packages current working tree instead of committed HEAD)
4. `--build-arg KEY=VALUE` (manual extra build args)
5. `--no-caddy-reload`
6. `--reconfigure` (ask again and overwrite saved config)

## Reusing in a new repository

1. Copy `scripts/deploy/*.sh` from this project.
2. Add `Dockerfile` and health endpoint.
3. Create `.env.production` locally.
4. Run `scripts/deploy/deploy.sh` and answer the first-time prompts.
5. Optional: create a project-specific wrapper script.

## Notes for future agents

If asked to set up deploy in another project, follow exactly this standard:

1. Keep direct laptop->server deploy.
2. Do not add GitHub Actions for deployment.
3. Do not require GHCR/registry unless explicitly requested.
4. Keep healthcheck + rollback behavior.
5. Keep env split (`.env.local` and `.env.production`).
6. Default to `scripts/deploy/deploy.sh` so project slug/subdomain are configurable by prompt on first deploy.
