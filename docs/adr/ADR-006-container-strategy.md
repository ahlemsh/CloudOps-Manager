# ADR-006: Container Strategy

**Date:** 2024-10-18
**Status:** Accepted

---

## Context

CloudOps Manager must be deployable on a single VPS or VM with minimal operational overhead. The platform consists of four service components: a PostgreSQL database, a NestJS backend API, a Next.js frontend, and an Nginx reverse proxy. A decision is needed on how to orchestrate these containers for both local development and production deployment.

---

## Decision

Use **Docker Compose** as the sole container orchestration tool for both local development and single-VPS production deployment.

The composition uses one base `docker-compose.yml` with service profiles or override files for environment-specific configuration:

- `docker-compose.yml` — base service definitions
- `docker-compose.dev.yml` — development overrides (hot-reload volumes, dev servers, port exposure)
- `docker-compose.prod.yml` — production overrides (resource limits, restart policies, Nginx with TLS, no source mounts)

Services: `db` (PostgreSQL), `backend` (NestJS), `frontend` (Next.js), `nginx` (Nginx + Certbot in production).

---

## Rationale

**Lowest operational overhead for a small team**
Docker Compose requires only Docker and Docker Compose installed on the target VPS. No cluster management, no cloud-provider-specific tooling, no control plane. A single `docker compose up -d` command starts all services.

**Single VPS matches current scale**
At 2–3 developers and one deployment target, horizontal scaling and distributed workloads are not requirements. Docker Compose handles everything the project needs today.

**Portable across VPS providers**
The Compose configuration works identically on Hetzner, DigitalOcean, OVH, Vultr, or any other Linux VPS — no provider lock-in.

**Development/production parity**
Using Compose in both development and production means the runtime environment is consistent. There are no "works on my machine" issues caused by differences in container networking or volume handling.

**Profile-based environment management**
Docker Compose `--profile` flags or override files provide clean environment separation without maintaining two entirely separate Compose files.

---

## Consequences

- Actual Dockerfiles and Compose files are created in Phase 7. This ADR records the strategy.
- Production deployment requires the operator to configure SSL certificates and DNS before the first run.
- The `postgres_data` named volume must be explicitly backed up — it is not automatically backed up by Docker or the VPS provider.
- **Scaling limitation:** If the project outgrows a single VPS, the migration path is to Kubernetes (e.g., k3s on a multi-node setup) or a managed container service (e.g., AWS ECS, Hetzner managed Kubernetes). The service boundaries in the current Compose file map directly to Kubernetes Deployments and Services.

---

## Alternatives Considered

**Kubernetes (rejected for current phase)**
- Appropriate for multi-node deployments requiring horizontal scaling, rolling updates, and self-healing.
- Overkill at current scale: adds significant operational complexity (control plane, etcd, node management) for a single-VPS deployment.
- Can be adopted in a future phase if traffic and reliability requirements justify the overhead.

**Managed container services — AWS ECS, Google Cloud Run (rejected)**
- Tie the project to a specific cloud provider.
- Add cost and configuration overhead that is not justified by the current scale.
- Contradict the VPS-agnostic deployment goal.

**Bare-metal process management with systemd (rejected)**
- Does not provide environment isolation between services.
- Dependency management (correct Node.js version, PostgreSQL version) becomes host-specific.
- Loses the reproducibility and portability benefits of containers entirely.
