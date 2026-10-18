# Coding Standards

---

## Naming Conventions

| Construct | Convention | Example |
|-----------|-----------|---------|
| Classes, Interfaces, Enums | PascalCase | `UserService`, `CreateServerDto`, `ServerStatus` |
| Variables, functions, methods | camelCase | `getUserById`, `accessToken`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `JWT_EXPIRES_IN`, `MAX_PAGE_SIZE` |
| Files | kebab-case | `user.service.ts`, `create-user.dto.ts`, `jwt.strategy.ts` |
| Database columns | snake_case | `password_hash`, `created_at`, `environment_id` |
| React components | PascalCase file + PascalCase export | `ServerCard.tsx` → `export function ServerCard` |
| CSS classes (Tailwind) | Follow Tailwind conventions | `text-sm`, `bg-red-500` |

---

## Backend Folder Structure

```
apps/backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   └── strategies/
│   │       ├── jwt.strategy.ts
│   │       └── jwt-refresh.strategy.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   ├── projects/
│   ├── environments/
│   ├── servers/
│   ├── applications/
│   ├── metrics/
│   ├── alert-rules/
│   ├── alerts/
│   └── dashboard/
│
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── global-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   └── pipes/
│       └── (ValidationPipe registered globally in main.ts)
│
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
├── main.ts
└── app.module.ts
```

---

## Frontend Folder Structure

```
apps/frontend/src/
├── app/
│   ├── layout.tsx
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── servers/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── projects/
│       │   └── page.tsx
│       ├── applications/
│       │   └── page.tsx
│       └── alerts/
│           └── page.tsx
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Spinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── SkeletonLoader.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PageShell.tsx
│   ├── servers/
│   │   ├── ServerCard.tsx
│   │   └── ServerStatusBadge.tsx
│   ├── metrics/
│   │   ├── MetricChart.tsx
│   │   └── AvailabilityBar.tsx
│   └── alerts/
│       ├── AlertRow.tsx
│       └── AlertSeverityIcon.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.api.ts
│   │   ├── servers.api.ts
│   │   ├── projects.api.ts
│   │   ├── applications.api.ts
│   │   ├── metrics.api.ts
│   │   ├── alerts.api.ts
│   │   └── dashboard.api.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useServers.ts
│   │   ├── useProjects.ts
│   │   ├── useAlerts.ts
│   │   ├── useMetrics.ts
│   │   └── useDashboard.ts
│   └── utils/
│       ├── formatDate.ts
│       ├── formatBytes.ts
│       └── cn.ts
│
├── types/
│   └── api.types.ts
│
└── constants/
    └── index.ts
```

---

## TypeScript Configuration

- **`strict: true`** must be enabled in both app `tsconfig.json` files.
- No `any` type in production code without an explicit inline comment explaining why.
- Shared types live in `apps/frontend/src/types/api.types.ts` and must mirror the backend response DTOs exactly.
- Use `unknown` instead of `any` for truly unknown values, then narrow with type guards.

---

## Linting & Formatting

- **ESLint** with `@typescript-eslint/recommended` rules enabled in both apps.
- **Frontend additional rules:** `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`.
- **Prettier** handles all formatting. `.prettierrc` is co-located in each app root.
- No `console.log` in committed code — use the NestJS logger in the backend and a logger utility in the frontend.
- ESLint is run as a pre-commit hook (via `lint-staged`) and in CI.

---

## Testing Strategy

| Layer | Tool | Scope | Target Coverage |
|-------|------|-------|-----------------|
| Unit tests | Jest | Services, Guards, Utilities | ≥ 70% line coverage on services |
| Integration / e2e | Jest + Supertest | API endpoint flows, auth | Key flows: login, CRUD, role enforcement |

- Test files are co-located next to the source file: `user.service.spec.ts` next to `user.service.ts`.
- Prisma is mocked with `jest.mock('../prisma/prisma.service')` using a factory that returns a mocked `PrismaClient`.
- Integration tests run against a separate test database (or in-memory SQLite via Prisma's test provider).
- Coverage reports are generated with `jest --coverage` and checked in CI.

---

## Git Workflow

- Every PR targets `develop`. Never commit directly to `main`.
- One feature or fix per branch, named by convention: `feature/server-crud`, `fix/jwt-refresh`.
- Squash merge to keep the `develop` history linear.
- Conventional Commits enforced via `commitlint` (configured in Phase 2).
- At least one peer review required before merge.
- `main` receives only tagged releases, merged from `develop` by the project lead.
