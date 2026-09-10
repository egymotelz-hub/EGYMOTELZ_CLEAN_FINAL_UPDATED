# Production Deployment Guide

This complements `10-deployment-checklist.md` (the pre-launch checklist) with the actual deployment steps.

## Recommended topology

```
                    ┌──────────────────────┐
  *.egymotelz.com ─▶│  Reverse proxy (LB)  │  wildcard TLS, forwards Host header unchanged
                    └──────────┬───────────┘
                       ┌───────┴────────┐
                       ▼                ▼
                 ┌──────────┐    ┌──────────────┐
                 │ frontend │    │   backend    │
                 │ (Next.js)│    │  (Express)   │
                 └──────────┘    └──────┬───────┘
                                         │
                              ┌──────────┴──────────┐
                              ▼                     ▼
                       ┌────────────┐        ┌────────────┐
                       │ PostgreSQL │        │   Redis    │
                       └────────────┘        └────────────┘
```

See `docs/03b-system-architecture.md` for the full reasoning behind this topology, including why the reverse proxy must forward the `Host` header unchanged (tenant resolution depends on it).

## Steps

### 1. Provision infrastructure
- A managed PostgreSQL instance (recommended over self-hosting — get automated backups/PITR for free)
- A managed Redis instance (or self-hosted; caching degrades gracefully if unavailable, per `docs/08-09-performance-and-testing.md`)
- Two container hosts (or one, if colocating) for `backend` and `frontend`
- A reverse proxy / load balancer with wildcard TLS for `*.egymotelz.com`

### 2. Build and push images

```bash
docker build -t your-registry/egymotelz-backend:v1.3 ./backend
docker build -t your-registry/egymotelz-frontend:v1.3 ./frontend
docker push your-registry/egymotelz-backend:v1.3
docker push your-registry/egymotelz-frontend:v1.3
```

The CI pipeline in `deployment/.github/workflows/ci.yml` already does this build step (minus the push/registry-auth, which is environment-specific — add a push step there once you've chosen a registry).

### 3. Configure environment variables on the host/orchestrator

Copy every key from `backend/.env.example` into your production secrets manager (not a committed `.env` file). See `docs/ENVIRONMENT.md` for what each one does.

### 4. Run migrations and seed data (once, before first traffic)

```bash
npx prisma migrate deploy    # NOT `migrate dev` — that's for local iteration only
npx ts-node prisma/seed-roles.ts
npx ts-node prisma/seed-tenant.ts
```

### 5. Deploy

Point your orchestrator (Docker Compose, ECS, Kubernetes, etc.) at the pushed images with the production environment variables. `deployment/docker-compose.yml` is a working reference for a single-host deployment; adapt it for your actual orchestrator.

### 6. Point DNS + verify TLS
- Root domain (`egymotelz.com`, `www.egymotelz.com`) → reverse proxy
- Wildcard (`*.egymotelz.com`) → same reverse proxy, once any brand subdomains are live
- Confirm the wildcard cert covers both

### 7. Smoke test
Run through Section 6 of `docs/10-deployment-checklist.md` before declaring launch complete.

## Rolling back

Redeploy the previous image tag. Database migrations in this project are additive-by-default (Prisma migrate history) — confirm any specific migration applied since the last known-good deploy is non-destructive before treating an image rollback alone as sufficient.
