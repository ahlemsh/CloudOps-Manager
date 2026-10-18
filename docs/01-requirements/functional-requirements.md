# Functional Requirements

Requirements are grouped by module and prioritized using MoSCoW:
- **Must** — required for the system to be usable
- **Should** — important but not blocking
- **Could** — desirable if time permits
- **Won't** — explicitly deferred to a future phase

---

## Authentication (FR-AUTH)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AUTH-01 | Must | The system shall allow users to log in with email and password, receiving a JWT access token and a refresh token in response. |
| FR-AUTH-02 | Must | The system shall support initial admin account creation on first run when no users exist. |
| FR-AUTH-03 | Must | The system shall enforce three roles — Admin, DevOps, Viewer — with distinct permissions on all resources. |
| FR-AUTH-04 | Must | The system shall allow a valid refresh token to be exchanged for a new access token without re-authentication. |
| FR-AUTH-05 | Should | Users shall be able to view and update their own profile (first name, last name, password). |
| FR-AUTH-06 | Should | The system shall invalidate the refresh token on logout so it cannot be reused. |

---

## Projects (FR-PRJ)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-PRJ-01 | Must | Admin and DevOps users shall be able to create, read, update, and delete projects. |
| FR-PRJ-02 | Must | Each project shall support multiple named environments with types: Development, Staging, Production. |
| FR-PRJ-03 | Must | Team members shall be assignable to projects; assignments record the user, the project, and the timestamp. |
| FR-PRJ-04 | Should | The projects list endpoint shall support full-text search, pagination, and filter by status. |
| FR-PRJ-05 | Could | Each project detail view shall display aggregate counts of associated servers and applications. |

---

## Servers (FR-SRV)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-SRV-01 | Must | Admin and DevOps users shall be able to create, read, update, and delete server records. |
| FR-SRV-02 | Must | A server record shall store: name, provider, region, IP address, CPU cores, RAM (GB), storage (GB), and status. |
| FR-SRV-03 | Must | Servers shall be linked to an environment and optionally associated with a project. |
| FR-SRV-04 | Must | Server status shall transition through the lifecycle: PROVISIONING → RUNNING → STOPPED / MAINTENANCE → TERMINATED. |
| FR-SRV-05 | Should | The servers list endpoint shall support search by name or IP address, filter by status, provider, and region, and pagination. |

---

## Monitoring (FR-MON)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-MON-01 | Must | The system shall collect (via simulation) CPU%, RAM%, disk%, network in/out metrics for each active server on a configurable interval. |
| FR-MON-02 | Must | Metric history for a server shall be queryable via the API with a time-range filter (`from` / `to` timestamps) and pagination. |
| FR-MON-03 | Must | The system shall compute and expose an availability percentage per server based on metric collection history. |
| FR-MON-04 | Should | The dashboard shall display metric charts that auto-refresh at a configurable interval not exceeding 30 seconds. |

---

## Applications (FR-APP)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-APP-01 | Must | Admin and DevOps users shall be able to create, read, update, and delete application records. |
| FR-APP-02 | Must | An application record shall store: name, version, status, linked server ID, environment ID, and deployment timestamp. |
| FR-APP-03 | Must | Application status shall be one of: DEPLOYING, RUNNING, STOPPED, FAILED, ROLLING_BACK. |
| FR-APP-04 | Should | The applications list endpoint shall support filter by status, server, and environment, plus pagination. |

---

## Alerts (FR-ALT)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-ALT-01 | Must | Admin and DevOps users shall be able to configure alert rules specifying: metric type, comparison operator, threshold value, and severity level. |
| FR-ALT-02 | Must | The system shall automatically create an Alert record when a collected metric value breaches an active alert rule's threshold. |
| FR-ALT-03 | Must | Alerts shall carry a severity level: INFO, WARNING, or CRITICAL. |
| FR-ALT-04 | Must | DevOps users shall be able to acknowledge alerts, transitioning them from TRIGGERED to ACKNOWLEDGED status. |
| FR-ALT-05 | Should | The alert history endpoint shall support filter by severity, status, and server, plus pagination. |

---

## Dashboard (FR-DSH)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-DSH-01 | Must | The dashboard shall display global counters: total servers, running servers, active alerts, and deployed applications. |
| FR-DSH-02 | Must | The dashboard shall show CPU and RAM metric charts for monitored servers. |
| FR-DSH-03 | Should | The dashboard shall support filter by project and environment to scope the displayed data. |
