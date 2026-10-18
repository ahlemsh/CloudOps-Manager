# User Stories

Stories follow the format: **As a [role], I want [action] so that [benefit].**
Each story includes 2–3 acceptance criteria (AC).

---

## Admin Stories

### US-ADM-01: User Account Management
As an Admin, I want to create user accounts and assign roles so that team members can access the platform with appropriate permissions.

- **AC1:** Admin can create a user by providing email, password, first name, last name, and a role selection from Admin / DevOps / Viewer.
- **AC2:** The newly created user can immediately log in with the provided credentials.
- **AC3:** Admin cannot assign a role higher than their own (i.e., an Admin cannot create another Admin from a lower-privilege account — not applicable here since Admin is the top role; the constraint prevents future privilege escalation paths).

### US-ADM-02: Full Project Oversight
As an Admin, I want to manage all projects regardless of ownership so that I have full oversight of the entire project portfolio.

- **AC1:** Admin can view, edit, and delete any project, including those owned by other users.
- **AC2:** Admin can assign or remove any team member from any project.
- **AC3:** Project list shows owner name and member count.

### US-ADM-03: Alert Rule Configuration
As an Admin, I want to configure alert rules for any server so that the team is automatically notified when infrastructure thresholds are exceeded.

- **AC1:** Admin can create an alert rule by selecting a server, metric type, operator, threshold value, and severity.
- **AC2:** Alert rule becomes active immediately after creation.
- **AC3:** Admin can deactivate or delete an alert rule without deleting associated alert history.

### US-ADM-04: Audit Visibility
As an Admin, I want to view a history of all user-initiated actions so that I can maintain accountability across the team.

- **AC1:** Admin can view a log of create/update/delete operations with the acting user and timestamp.
- **AC2:** Log is filterable by user and action type.
- **AC3:** Log entries cannot be deleted.

### US-ADM-05: Account Deactivation
As an Admin, I want to deactivate user accounts so that former team members immediately lose access to the platform.

- **AC1:** Deactivated accounts cannot authenticate (login returns 401).
- **AC2:** Existing tokens for a deactivated account are rejected by the auth guard.
- **AC3:** Admin can reactivate a deactivated account.

### US-ADM-06: System-Wide Dashboard
As an Admin, I want to view system-wide metrics and counters on the dashboard so that I can assess the overall health of the infrastructure at a glance.

- **AC1:** Dashboard shows total servers, servers by status, total active alerts by severity, and total running applications.
- **AC2:** Dashboard data is refreshed every 30 seconds without a full page reload.
- **AC3:** Admin can filter dashboard data by project or environment.

---

## DevOps Stories

### US-DEV-01: Server Registration
As a DevOps engineer, I want to register servers with their hardware specifications so that the team has an accurate infrastructure inventory.

- **AC1:** DevOps can create a server record with: name, provider, region, IP address, CPU cores, RAM (GB), storage (GB), and environment.
- **AC2:** The new server appears in the server list immediately after creation.
- **AC3:** Server status defaults to PROVISIONING upon creation.

### US-DEV-02: Application Deployment Tracking
As a DevOps engineer, I want to record application deployments to specific servers so that I can track what software version is running where.

- **AC1:** DevOps can create an application record linked to a server and an environment, specifying name, version, and status.
- **AC2:** Application appears in the server's application list with its deployment timestamp.
- **AC3:** DevOps can update the application version and status after a subsequent deployment.

### US-DEV-03: Server Monitoring Charts
As a DevOps engineer, I want to view CPU and RAM monitoring charts for a specific server so that I can diagnose performance issues.

- **AC1:** Metric charts display data for the last 1 hour, 24 hours, and 7 days (selectable time range).
- **AC2:** Charts update automatically every 30 seconds.
- **AC3:** Hovering over a data point shows the exact value and timestamp.

### US-DEV-04: Alert Acknowledgement
As a DevOps engineer, I want to acknowledge active alerts so that the team knows the issue is being handled and the alert is no longer unattended.

- **AC1:** DevOps can acknowledge an alert from the alert list or alert detail page.
- **AC2:** Alert status changes from TRIGGERED to ACKNOWLEDGED and records the acknowledging user and timestamp.
- **AC3:** Acknowledged alerts are visually distinct from triggered alerts in the list view.

### US-DEV-05: Server Filtering
As a DevOps engineer, I want to filter the server list by status and provider so that I can quickly locate relevant infrastructure without scrolling through a full inventory.

- **AC1:** Server list supports simultaneous filters: status, provider, and region.
- **AC2:** Active filters are reflected in the URL query string for shareability.
- **AC3:** Clearing filters restores the full server list.

### US-DEV-06: Threshold Configuration
As a DevOps engineer, I want to set custom metric thresholds per server so that alerts fire automatically when resource limits are exceeded.

- **AC1:** DevOps can create an alert rule with configurable operator (>, >=, <, <=) and numeric threshold for any metric type.
- **AC2:** Alert rules are scoped to a specific server, not globally.
- **AC3:** DevOps can toggle a rule active/inactive without deleting it.

---

## Viewer Stories

### US-VWR-01: Dashboard Overview
As a Viewer, I want to see the infrastructure dashboard so that I can monitor overall health at a glance without needing edit access.

- **AC1:** Dashboard shows total servers, active alert count, running application count, and recent incidents.
- **AC2:** Viewer cannot edit, delete, or create any resource from the dashboard.
- **AC3:** Dashboard auto-refreshes every 30 seconds.

### US-VWR-02: Read-Only Server List
As a Viewer, I want to browse the server list in read-only mode so that I can understand what infrastructure is currently in place.

- **AC1:** Server list displays all servers with name, provider, region, status, and environment.
- **AC2:** No create, edit, or delete controls are visible to the Viewer.
- **AC3:** Viewer can click through to a server detail page to see full specs and linked applications.

### US-VWR-03: Alert History by Severity
As a Viewer, I want to see the alert history filtered by severity so that I can understand incident frequency and patterns.

- **AC1:** Alert history shows severity, status, triggering timestamp, and resolution timestamp.
- **AC2:** Viewer can filter by severity (INFO / WARNING / CRITICAL) and status (TRIGGERED / ACKNOWLEDGED / RESOLVED / CLOSED).
- **AC3:** Alert history is paginated with 20 records per page by default.

### US-VWR-04: Application Deployment Status
As a Viewer, I want to see which application versions are currently deployed on each server so that I know what is live without asking the DevOps team.

- **AC1:** Application list shows name, version, status, server name, environment, and deployment timestamp.
- **AC2:** Viewer can filter applications by server and environment.
- **AC3:** Viewer cannot modify application records.

### US-VWR-05: Dashboard Scoping by Project
As a Viewer, I want to filter the dashboard by project and environment so that I can focus on the context relevant to me.

- **AC1:** Dashboard filter applies to all counters and charts simultaneously.
- **AC2:** Selected filter is persisted in the URL for sharing.
- **AC3:** An empty filter state shows all data across all projects and environments.
