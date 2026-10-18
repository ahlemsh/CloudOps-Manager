# ADR-004: Simulated Monitoring

**Date:** 2024-10-18
**Status:** Accepted

---

## Context

CloudOps Manager includes a monitoring module that tracks CPU, RAM, disk, and network metrics for registered servers. Real metric collection requires either: (a) installing a monitoring agent (e.g., Prometheus `node_exporter`) on each tracked server, or (b) integrating a cloud provider's metrics API (e.g., AWS CloudWatch, Hetzner Metrics API).

Neither approach is viable within the constraints of this project: the team does not have a controlled infrastructure of servers to install agents on, and cloud provider API integration is explicitly out of scope.

---

## Decision

Implement metric collection as a **simulated NestJS scheduled task** using `@nestjs/schedule` and the `@Cron()` decorator. The scheduler runs every 30 seconds (configurable via `METRICS_COLLECTION_INTERVAL_MS`), iterates over all servers with status `RUNNING`, generates plausible metric values within realistic ranges, and persists them to the `Metric` table.

The scheduler also evaluates all active `AlertRule` records for each server after each metric collection cycle and creates `Alert` records when thresholds are breached.

---

## Rationale

**Enables full feature development without infrastructure dependencies**
Simulated data allows the complete monitoring stack — metric history queries, availability calculation, dashboard charts, alert rule evaluation — to be built, tested, and demonstrated without any external infrastructure.

**Realistic value generation**
The simulation generates values that follow plausible patterns: gradual trend lines with random jitter, occasional spikes to test alert triggering. This makes the demonstration of threshold-based alerting convincing.

**Alert evaluation works identically against simulated data**
The `AlertService` evaluates thresholds against metric values without knowledge of their origin. Switching to real agent data in a future phase requires only changing the data source in `MetricsService.collectAll()` — the alert logic, history queries, and API endpoints remain unchanged.

**Low operational complexity**
The scheduler runs inside the NestJS process. No additional containers, message queues, or external processes are required.

---

## Consequences

- Metrics are not production-accurate. They are suitable for feature demonstration and testing the alert pipeline, but should not be used to make real infrastructure decisions.
- The `Metric` table will grow at approximately `n_servers × 2` records per minute (one every 30 seconds). A data retention policy (e.g., delete records older than 30 days) should be implemented to bound table growth.
- In a future phase, switching to real collection would require implementing a real `MetricsService.collectAll()` that either calls a metrics API or receives pushed data from an agent — the rest of the system architecture is unchanged.

---

## Alternatives Considered

**Real agent-based collection (deferred)**
- Would require test infrastructure with `node_exporter` installed, a Prometheus scrape loop, and an adapter to map Prometheus data to the `Metric` schema.
- Infrastructure access is not available in this phase. Deferred as a future enhancement.

**Cloud provider metrics API integration (out of scope)**
- AWS CloudWatch, Hetzner Metrics, and similar APIs require provider-specific credentials and tie the platform to specific cloud vendors.
- Multi-cloud provider API integration is explicitly listed as out of scope in the vision document.
