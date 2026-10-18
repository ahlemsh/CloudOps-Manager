# CloudOps Manager — Documentation Index

This directory contains all project documentation organized by phase and topic.

---

## 01 — Requirements

| Document | Description |
|----------|-------------|
| [Vision & Scope](./01-requirements/vision-and-scope.md) | Project context, goals, stakeholders, in/out of scope, assumptions, and constraints. |
| [Functional Requirements](./01-requirements/functional-requirements.md) | Numbered requirements per module with MoSCoW priority (Must/Should/Could/Won't). |
| [Non-Functional Requirements](./01-requirements/non-functional-requirements.md) | Quality attributes: security, performance, usability, maintainability, observability, deployability. |
| [User Stories](./01-requirements/user-stories.md) | Behaviour-driven stories per role (Admin, DevOps, Viewer) with acceptance criteria. |
| [Roles & Permissions Matrix](./01-requirements/roles-permissions-matrix.md) | Resource-level permission table for all three roles. |
| [Glossary](./01-requirements/glossary.md) | Alphabetical definitions of all domain and technical terms used in the project. |

---

## 02 — UML Diagrams

All diagrams are written in Mermaid and render directly on GitHub.

| Document | Description |
|----------|-------------|
| [Use Case Diagram](./02-uml/use-case-diagram.md) | Use cases grouped by actor (Admin, DevOps, Viewer, System Scheduler). |
| [Class Diagram](./02-uml/class-diagram.md) | Domain model showing all 10 entities, their attributes, and relationships. |
| [Sequence Diagrams](./02-uml/sequence-diagrams.md) | Four key flows: login, server creation, metric ingestion/alerting, dashboard view. |
| [Activity Diagram](./02-uml/activity-diagram.md) | Full alert lifecycle from metric evaluation through acknowledgement to resolution. |
| [State Diagrams](./02-uml/state-diagrams.md) | State machines for Server status, Application status, and Alert/Incident status. |

---

## 03 — Architecture

| Document | Description |
|----------|-------------|
| [Architecture Overview](./03-architecture/architecture-overview.md) | C4 Level 1 & 2 diagrams, backend layered structure, and frontend App Router layout. |
| [Deployment Architecture](./03-architecture/deployment-architecture.md) | VPS topology, Nginx reverse proxy, environment strategy, volumes, and network isolation. |
| [Security Design](./03-architecture/security-design.md) | JWT flow, password hashing, RBAC enforcement, input validation, CORS, and secrets management. |
| [Coding Standards](./03-architecture/coding-standards.md) | Naming conventions, folder structures for backend and frontend, linting, and testing strategy. |

---

## 04 — Data Model

| Document | Description |
|----------|-------------|
| [ER Diagram](./04-data-model/erd.md) | Mermaid `erDiagram` showing all 10 entities with fields and relationships. |
| [Data Dictionary](./04-data-model/data-dictionary.md) | Per-entity field tables with type, nullability, constraints, and all enum values. |

---

## API

| Document | Description |
|----------|-------------|
| [Endpoint Catalog](./api/endpoint-catalog.md) | 25+ REST endpoints organized by module with method, path, roles, request/response. |

---

## Architecture Decision Records (ADRs)

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./adr/ADR-001-monorepo-layout.md) | Monorepo Layout | Accepted |
| [ADR-002](./adr/ADR-002-orm-choice.md) | ORM Choice (Prisma) | Accepted |
| [ADR-003](./adr/ADR-003-jwt-strategy.md) | JWT Authentication Strategy | Accepted |
| [ADR-004](./adr/ADR-004-simulated-monitoring.md) | Simulated Monitoring | Accepted |
| [ADR-005](./adr/ADR-005-frontend-data-fetching.md) | Frontend Data Fetching (TanStack Query) | Accepted |
| [ADR-006](./adr/ADR-006-container-strategy.md) | Container Strategy (Docker Compose) | Accepted |
