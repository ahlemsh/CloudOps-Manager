# Roles & Permissions Matrix

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Full access (create, read, update, delete) |
| 👁 | Read-only access |
| ❌ | No access |
| ⚠️ | Partial — see notes |

---

## Permissions by Resource

| Resource / Action | Admin | DevOps | Viewer | Notes |
|-------------------|-------|--------|--------|-------|
| **Users** | | | | |
| Create user | ✅ | ❌ | ❌ | Only Admin can create accounts |
| List / view users | ✅ | ❌ | ❌ | |
| Update any user | ✅ | ❌ | ❌ | |
| Deactivate / delete user | ✅ | ❌ | ❌ | |
| View & update own profile | ✅ | ✅ | ✅ | All roles can manage their own profile |
| **Projects** | | | | |
| Create project | ✅ | ✅ | ❌ | |
| View projects | ✅ | ✅ | 👁 | Viewer sees projects they are a member of |
| Update project | ✅ | ⚠️ | ❌ | DevOps can update only projects they own or are assigned to |
| Delete project | ✅ | ❌ | ❌ | Only Admin can delete projects |
| Assign / remove members | ✅ | ⚠️ | ❌ | DevOps can manage members on their own projects |
| **Environments** | | | | |
| Create environment | ✅ | ✅ | ❌ | Environments belong to a project |
| View environments | ✅ | ✅ | 👁 | |
| Update / delete environment | ✅ | ⚠️ | ❌ | DevOps limited to environments in their projects |
| **Servers** | | | | |
| Create server | ✅ | ✅ | ❌ | |
| View servers | ✅ | ✅ | 👁 | |
| Update server | ✅ | ✅ | ❌ | |
| Delete server | ✅ | ✅ | ❌ | |
| Change server status | ✅ | ✅ | ❌ | |
| **Applications** | | | | |
| Create application | ✅ | ✅ | ❌ | |
| View applications | ✅ | ✅ | 👁 | |
| Update application | ✅ | ✅ | ❌ | |
| Delete application | ✅ | ✅ | ❌ | |
| **Metrics** | | | | |
| View metric history | ✅ | ✅ | 👁 | All roles can view metrics |
| View availability | ✅ | ✅ | 👁 | |
| Trigger metric collection | ✅ | ✅ | ❌ | Normally driven by scheduler; manual trigger is admin/devops only |
| **Alert Rules** | | | | |
| Create alert rule | ✅ | ✅ | ❌ | |
| View alert rules | ✅ | ✅ | 👁 | |
| Update / deactivate alert rule | ✅ | ✅ | ❌ | |
| Delete alert rule | ✅ | ❌ | ❌ | Only Admin can permanently delete rules |
| **Alerts / Incidents** | | | | |
| View alert list & history | ✅ | ✅ | 👁 | |
| Acknowledge alert | ✅ | ✅ | ❌ | |
| Resolve / close alert | ✅ | ✅ | ❌ | |
| **Dashboard** | | | | |
| View dashboard | ✅ | ✅ | 👁 | All roles can view the dashboard |
| Filter dashboard by project | ✅ | ✅ | ✅ | |

---

## Notes

1. **Admin is a superset of DevOps.** Any action permitted to DevOps is also permitted to Admin.
2. **Own profile** — all authenticated users can view and update their own profile (`GET /auth/me`, `PATCH /users/:id` for their own ID).
3. **Viewer isolation** — Viewers never see write controls in the UI. Backend guards reject any mutating request from a Viewer token.
4. **Project scoping for DevOps** — DevOps users can manage resources within their assigned projects. Admins have cross-project authority.
5. **Alert acknowledgement** — acknowledging an alert records the acknowledging user's ID and timestamp; only DevOps and Admin can perform this action.
