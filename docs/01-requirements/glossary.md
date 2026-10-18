# Glossary

Definitions of all domain and technical terms used in CloudOps Manager, listed alphabetically.

---

**Alert**
A record created automatically by the system when a metric value breaches an active alert rule's threshold. An alert carries a severity, status, and timestamps for when it was triggered, acknowledged, and resolved.

**Alert Rule**
A configuration object that defines the conditions under which an alert is created. It specifies a server, a metric type, a comparison operator (e.g., `>`), a numeric threshold, and a severity level. Alert rules can be activated or deactivated without deletion.

**Application**
A software workload deployed to a server. An application record tracks its name, version, runtime status, the server it runs on, its environment, and its most recent deployment timestamp.

**CloudOps Manager**
The name of this platform. CloudOps Manager is a centralized web application for managing infrastructure projects, servers, deployed applications, monitoring metrics, and operational alerts.

**Dashboard**
The main landing page of the platform. It provides a global overview — counters, status summaries, and metric charts — giving any user a quick read on infrastructure health. Data refreshes automatically every 30 seconds.

**DevOps (role)**
One of three platform roles. DevOps users have full write access to servers, applications, alert rules, and their assigned projects. They can acknowledge alerts but cannot manage user accounts.

**Environment**
A named deployment context within a project. The supported environment types are Development, Staging, and Production. Each server and application is associated with an environment to express where it is deployed.

**Incident**
Used interchangeably with an alert that has progressed beyond the TRIGGERED state — particularly one that has been acknowledged or escalated. The alert history captures the full incident timeline.

**JWT (JSON Web Token)**
A compact, URL-safe token format used for authentication. CloudOps Manager issues two JWT variants: a short-lived access token (15 minutes) sent in the `Authorization` header, and a long-lived refresh token (7 days) stored in an `httpOnly` cookie.

**Metric**
A single data point recorded for a server at a specific timestamp. Metrics captured include CPU usage percentage, RAM usage percentage, disk usage percentage, and network in/out bandwidth (kbps).

**Monitoring Agent (simulated)**
In production systems, a monitoring agent is a process running on a server that collects and ships metrics. In CloudOps Manager, this role is fulfilled by a simulated NestJS scheduler that generates plausible metric values at a configurable interval without requiring a real agent binary on target machines.

**Project**
A top-level organizational unit in CloudOps Manager. A project groups related environments, servers, and applications under a common name, with an assigned owner and a team of members.

**RBAC (Role-Based Access Control)**
An access control model where permissions are associated with roles, and users are assigned to roles. CloudOps Manager uses three roles: Admin, DevOps, and Viewer. All permission checks are enforced server-side.

**Refresh Token**
A long-lived token (7 days) stored in an `httpOnly` cookie. It is used exclusively to request a new access token via `POST /auth/refresh`. Refresh tokens are rotated on each use and invalidated on logout.

**Region**
A geographic or logical location identifier for a server, typically matching the naming convention of the hosting provider (e.g., `eu-west-1`, `us-central`, `fra1`). It is stored as a free-text string to accommodate any provider's nomenclature.

**Role**
A named set of permissions assigned to a user. The three roles in CloudOps Manager are Admin, DevOps, and Viewer. Each role is stored as an enum value on the User record.

**Server**
A VPS (Virtual Private Server) or VM (Virtual Machine) record in the platform. A server record tracks the host's hardware specifications (CPU cores, RAM, storage), network details (IP address), provider, region, current status, and the environment it belongs to.

**Severity**
A classification of an alert's urgency. CloudOps Manager uses three severity levels: INFO (informational, no immediate action required), WARNING (attention needed), and CRITICAL (immediate action required).

**Threshold**
The numeric boundary defined in an alert rule. When a metric value crosses this boundary in the specified direction (e.g., CPU > 90), the system creates an alert. Thresholds are stored as floating-point numbers.

**VPS/VM (Virtual Private Server / Virtual Machine)**
The infrastructure unit managed by CloudOps Manager. A VPS is a virtualized server instance provided by a hosting company. A VM is a virtual machine running on a hypervisor, either on-premises or in a cloud data center. The platform treats both equivalently.

**Viewer**
The read-only role in CloudOps Manager. Viewers can browse servers, applications, alerts, and the dashboard but cannot create, update, or delete any resource.
