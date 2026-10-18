# ADR-001: Monorepo Layout

**Date:** 2024-10-18
**Status:** Accepted

---

## Context

CloudOps Manager consists of two application layers (Next.js frontend and NestJS backend), shared infrastructure configuration, and a growing documentation corpus. The team has 2–3 developers and a single deployment target.

A decision is needed on whether to maintain a single repository containing all components or separate repositories per service.

---

## Decision

Maintain a **single Git monorepo** with the following top-level layout:

```
apps/backend/     ← NestJS API
apps/frontend/    ← Next.js application
infra/docker/     ← Dockerfiles and Compose configurations
docs/             ← All project documentation
```

---

## Rationale

- **Shared tooling configuration** — root-level `.editorconfig`, `.gitattributes`, and linting configs apply consistently to both apps without duplication.
- **Atomic cross-cutting commits** — a change that spans both the API and the frontend (e.g., a new endpoint and the UI that consumes it) can land in a single commit with a coherent message, making the history easier to understand.
- **Simplified PR review** — reviewers see the full context of a change (backend + frontend + docs) in one PR, reducing back-and-forth.
- **Single issue tracker** — GitHub Issues, labels, milestones, and project boards cover the entire system in one place.
- **Low tooling overhead** — at 2–3 developers, there is no need for the orchestration complexity (Nx, Turborepo, Lerna) that larger monorepos require. Simple `npm workspaces` or independent installs per app are sufficient.

---

## Consequences

- Both apps share the same Git history. Developers must use path-scoped commits and meaningful commit messages to keep the log navigable.
- CI pipelines (Phase 5+) must be configured to run only the jobs relevant to the changed paths (using `paths` filters in GitHub Actions or equivalent).
- If the project scales significantly and independent deployment cadences become necessary, migrating to separate repositories is straightforward — the folder structure already reflects clean service boundaries.

---

## Alternatives Considered

**Separate repositories per service (rejected)**
- Increases overhead: two separate PRs for cross-cutting changes, two issue trackers, duplicated CI setup.
- At 2–3 developers, the coordination cost outweighs the isolation benefit.
- Documentation would need its own repository or be scattered across both.
