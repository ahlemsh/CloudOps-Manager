# Vision and Scope

## Context

Companies operating multi-cloud and VPS infrastructure today face a fragmented tooling landscape. Operations teams typically juggle separate dashboards for server provisioning, deployment tracking, metric collection, and incident response. This fragmentation increases mean time to detection (MTTD) for incidents, slows onboarding of new team members, and creates accountability gaps when ownership of infrastructure assets is unclear.

CloudOps Manager addresses this by providing a single, centralized web platform where all infrastructure-related information lives in one place and all team members — regardless of role — interact through a consistent interface.

---

## Goals

- **Single pane of glass** — one platform to view and manage projects, servers, deployed applications, monitoring metrics, and active alerts.
- **Role-appropriate access** — clear permission boundaries so every team member sees exactly what they need and no more.
- **Operational clarity** — structured server inventory, environment tracking, and incident history reduce ambiguity and improve team coordination.
- **Low operational overhead** — containerized deployment means the platform itself is easy to install and maintain on any VPS or cloud VM.

---

## Stakeholders

| Stakeholder | Type | Primary Concern |
|-------------|------|-----------------|
| Platform / Ops Engineers (DevOps role) | Primary user | Manage servers, deploy applications, monitor metrics, handle alerts |
| Development Teams (Viewer role) | Secondary user | Read-only visibility into deployment status and infrastructure health |
| Management / Team Leads (Admin role) | Primary user | Full control over users, projects, configurations, and audit trails |

---

## In Scope

- **Authentication & Authorization** — email/password login, JWT access + refresh token flow, three roles (Admin, DevOps, Viewer).
- **Project Management** — full CRUD for projects, environment management (Development / Staging / Production), team member assignments.
- **Server Inventory** — full CRUD for VPS/VM records including provider, region, CPU, RAM, storage, IP, and status lifecycle.
- **Monitoring Metrics** — simulated periodic collection of CPU, RAM, disk, and network metrics per server; history queries; availability calculation.
- **Application Tracking** — CRUD for applications linked to servers and environments; deployment status and version management.
- **Alerting** — configurable alert rules per server; automatic alert creation on threshold breach; severity levels; acknowledgement workflow.
- **Dashboard** — global counters, status summaries, metric charts, and environment filters.
- **Containerized Deployment** — Docker Compose setup covering all services; single-command startup.

---

## Out of Scope (Phase 1 and beyond)

The following items are explicitly excluded from this project:

- **Billing and cost management** — no integration with cloud provider billing APIs.
- **Real cloud provider SDK integration** — no AWS/GCP/Azure SDK calls for provisioning or lifecycle management.
- **Mobile native application** — the frontend is responsive web only; no iOS/Android native app.
- **Multi-tenancy** — the platform serves a single organization; no tenant isolation layer.
- **Real metric collection agents** — metric data is simulated. Production-grade agents (e.g., Prometheus node-exporter) are a future enhancement.
- **Advanced notification channels** — email or Slack notifications for alerts are out of scope; the platform UI is the sole notification surface.

---

## Assumptions

1. The team operates a single VPS or VM as the deployment target.
2. Simulated metric data is acceptable for demonstrating monitoring and alerting features.
3. PostgreSQL is the only database; no polyglot persistence is required.
4. All team members use the same deployment environment (no multi-region setup).
5. The platform is an internal tool; public internet access control is handled at the network/VPS level.

---

## Constraints

- **Stack:** The technology stack is fixed: Next.js (App Router) + TypeScript for the frontend; NestJS + TypeScript for the backend; PostgreSQL with Prisma; Docker for deployment.
- **Deployment target:** A single VPS or VM. No managed Kubernetes or serverless infrastructure.
- **Team size:** 2–3 developers. Architecture and process decisions must remain manageable at this scale.
- **Timeline:** Delivery is organized in phases (Phase 1 through Phase 8). Each phase has a fixed scope.
