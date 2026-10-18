# Contributing to CloudOps Manager

Thank you for taking the time to contribute. Please read this guide before opening a branch, commit, or pull request.

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Protected. Stable releases only. Tagged at each phase completion. |
| `develop` | Integration branch. All feature work merges here first. |
| `feature/*` | New functionality (e.g., `feature/server-crud`). |
| `fix/*` | Bug fixes (e.g., `fix/jwt-refresh-expiry`). |
| `docs/*` | Documentation updates (e.g., `docs/update-erd`). |

**Rules:**
- Never commit directly to `main` or `develop`.
- Branch from `develop` for all new work.
- Keep branches short-lived — one feature or fix per branch.
- Delete the branch after the PR is merged.

---

## Conventional Commits

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `chore` | Build process, tooling, config changes |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace (no logic change) |
| `ci` | CI/CD pipeline changes |

**Examples:**

```
feat(servers): add CRUD endpoints for server management
fix(auth): correct token expiry calculation in refresh flow
docs(adr): add ADR-003 for JWT strategy
chore: update .gitignore to exclude .next/ build output
refactor(metrics): extract threshold evaluation to AlertService
test(auth): add unit tests for JwtAuthGuard
```

**Breaking changes** must include `BREAKING CHANGE:` in the commit footer, or use `!` after the type:

```
feat(api)!: rename /servers/:id/metrics to /metrics/servers/:id

BREAKING CHANGE: Endpoint path changed; update frontend fetch calls.
```

---

## Pull Request Workflow

1. **Branch** from `develop`: `git checkout -b feature/my-feature develop`
2. **Commit** your work using Conventional Commits.
3. **Push** your branch: `git push -u origin feature/my-feature`
4. **Open a PR** targeting `develop` (never `main`).
5. **Fill out** the PR template completely.
6. **Request a review** from at least one team member.
7. **Address feedback** — push additional commits to the same branch.
8. **Squash merge** once approved. The squash commit message must follow Conventional Commits.
9. **Delete** the source branch after merge.

Merges from `develop` → `main` are done by the project lead at phase completion and are tagged with a version.

---

## PR Checklist

Before marking a PR as ready for review, verify:

- [ ] The scope is focused — no unrelated changes are included
- [ ] All new functionality has corresponding tests (unit or integration)
- [ ] Documentation has been updated to reflect the change
- [ ] No secrets, API keys, or credentials are present in the diff
- [ ] Breaking changes are flagged in the PR description and commit footer
- [ ] The PR description links the related issue using `Closes #<issue-number>`

---

## Issue Linking

Reference related issues in both commit messages and PR descriptions:

```
Closes #42
Fixes #17
Relates to #55
```

GitHub automatically closes the referenced issue when the PR merges into the default branch.

---

## Team Contribution Guidelines

- Each team member commits their own work under their own Git identity.
- Do not batch-commit work on behalf of other contributors.
- If pair programming, use the co-author trailer in the commit message:

```
feat(dashboard): add CPU chart component

Co-authored-by: Jane Smith <jane@example.com>
```

---

## Getting Help

Open an issue with the `question` label or reach out in the team communication channel.
