# ADR-005: Frontend Data Fetching Strategy

**Date:** 2024-10-18
**Status:** Accepted

---

## Context

The CloudOps Manager frontend is a Next.js 14 application using the App Router. It needs a client-side data fetching strategy that handles:

- Authenticated REST API calls with `Authorization: Bearer` headers
- Automatic token refresh on 401 responses
- Loading and error states for every data-dependent page
- Auto-refresh of dashboard and metric chart data every 30 seconds
- Cache invalidation after mutations (e.g., after creating a server, refresh the server list)

---

## Decision

Use **TanStack Query v5** (formerly React Query) for all client-side server state management.

Next.js Server Components are used for initial page layout and static shell rendering where appropriate, but all dynamic data (servers, alerts, metrics, projects) is fetched client-side via TanStack Query hooks.

A typed `client.ts` fetch wrapper handles:
- Attaching the `Authorization: Bearer <accessToken>` header from in-memory state
- Intercepting 401 responses to trigger a token refresh, then retrying the original request once
- Throwing standardized errors for the TanStack Query `onError` handler

---

## Rationale

**Built-in caching and background refresh**
TanStack Query's `staleTime` and `refetchInterval` options make the 30-second dashboard auto-refresh a single configuration option: `refetchInterval: 30_000`. No manual `setInterval` or `useEffect` cleanup is needed.

**Declarative loading and error states**
`isLoading`, `isError`, and `data` from `useQuery` map directly to the three UI states every list page needs (skeleton, error boundary, content). This replaces verbose manual state management with `useState` and `useEffect`.

**Cache invalidation after mutations**
`useMutation` with `onSuccess: () => queryClient.invalidateQueries(['servers'])` keeps list views automatically consistent after a create or delete without a manual refetch call.

**Optimistic updates**
For actions like acknowledging an alert, TanStack Query supports optimistic cache updates so the UI responds instantly while the API call is in flight — important for a responsive feel on the monitoring dashboard.

**TypeScript generics**
`useQuery<ServerListResponse>()` provides full type safety on the `data` return value, matching the API types defined in `types/api.types.ts`.

---

## Consequences

- `QueryClientProvider` must wrap the entire authenticated application layout.
- Query keys must follow a consistent naming convention (e.g., `['servers']`, `['servers', id]`, `['servers', id, 'metrics']`) to ensure predictable cache invalidation.
- Server Components cannot use TanStack Query hooks directly — any page that needs live/cached data must be a Client Component (`'use client'`), or use a hybrid pattern where the Server Component passes static initial data to a Client Component.
- The bundle size increases by approximately 13KB (minified + gzipped) for the TanStack Query core.

---

## Alternatives Considered

**SWR (rejected)**
- Simpler API but less feature-rich for the complex cache invalidation and optimistic update patterns required by the mutations in this application.
- No built-in `refetchInterval` with the same ergonomics. Background refetch configuration is more manual.
- Smaller community compared to TanStack Query for NestJS/Next.js integration patterns.

**Raw `fetch` in `useEffect` (rejected)**
- Results in significant boilerplate: manual `isLoading` state, manual `AbortController` for cleanup, manual error handling, no built-in caching.
- Re-implementing a fraction of TanStack Query's behavior badly on every page is not maintainable.

**Next.js `fetch` with `revalidate` (partially adopted)**
- Appropriate for static or infrequently updated data rendered on the server.
- Not suitable for the live monitoring dashboard or any user-specific data that requires authentication, since Server Components cannot access per-request cookies when running in RSC context behind a CDN cache.
