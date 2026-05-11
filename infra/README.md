# infra

Deployment and local-environment infrastructure: Docker Compose for the dev
stack (Postgres, mailpit, minio), and — added in Phase 6 — production config
(Caddy + TLS + Tailscale for the self-host path, or the cloud-deploy path), the
CD pipeline, and the runbook. See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) §7.

> **Status: empty.** The dev `docker-compose.yml` lands with the API in
> milestone **M0.3**; production infra lands in **Phase 6** (see [`../docs/ROADMAP.md`](../docs/ROADMAP.md)).
