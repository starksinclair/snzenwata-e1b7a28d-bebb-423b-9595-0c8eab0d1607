# Task Manager – Nx Monorepo

Full-stack task management application with JWT authentication, role-based access control (RBAC), and organization-scoped data isolation.
![Database Schema](docs/home.png)

## Setup

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
  npm install
```

### Environment

The API uses these environment variables (defaults are built-in for development):

| Variable     | Default                   | Description        |
| ------------ | ------------------------- | ------------------ |
| `PORT`       | `3000`                    | API server port    |
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |

For production, set `JWT_SECRET` to a strong random string. The database is SQLite (file-based, zero config) in development.

### Run

```bash

# Start API (http://localhost:3000)
npx nx serve api

# Start Dashboard (http://localhost:4200)
npx nx serve dashboard

# Run API e2e tests (API must be running)
npx nx e2e api-e2e

# Production build
npx nx build api
npx nx build dashboard
```

---

## Architecture

```
├── apps/
│   ├── api/            NestJS REST API (JWT, RBAC, TypeORM + SQLite)
│   ├── api-e2e/        API end-to-end tests (Jest + Axios)
│   └── dashboard/      Angular 21 SPA (standalone components, signals, Tailwind)
├── libs/
│   └── data/           Shared library (DTOs, enums, RBAC policy, types)
```

**Why Nx monorepo?** Single source of truth for types, enums, and RBAC policy. The `libs/data` library is imported by both `api` and `dashboard`, ensuring DTOs and permission maps are always in sync without package publishing.

**Shared library (`libs/data`) exports:**

- `TaskCategory`, `TaskStatus`, `Role` enums
- `CreateTaskDto`, `UpdateTaskDto` interfaces
- `Permission` enum + `ROLE_PERMISSIONS` map
- `JwtPayload` type

---

## Data Model

> Database schema diagram:
>
> ![Database Schema](docs/schema.png)

---

## Access Control

### Roles & Permissions

| Permission  | VIEWER | ADMIN | OWNER |
| ----------- | ------ | ----- | ----- |
| TASK_READ   | x      | x     | x     |
| TASK_CREATE |        | x     | x     |
| TASK_UPDATE |        | x     | x     |
| TASK_DELETE |        | x     | x     |
| AUDIT_READ  |        |       | x     |
| ORG_CREATE  |        |       | x     |

### How Authorization Works

**Registration creates:**

- Organization
- User (role: OWNER)
- JWT returned

**JWT contains:**

- `{ sub, email, role, orgId }`

**Backend:**

- `JwtAuthGuard` validates token
- `PermissionsGuard` checks `ROLE_PERMISSIONS[user.role]`
- Service layer enforces org scoping

**Org Scoping:**

- All database queries filter by `orgId`
- Optional 2-level hierarchy supported via `getAllowedOrgIds()`

**Frontend:**

- Reads JWT `role`
- Uses `hasPermission()` for route guards
- Hides UI actions accordingly

_Backend remains final authority_

### Why file-based RBAC?

Permissions and role-to-permission mappings live in `libs/data/src/lib/rbac/permission.ts`, not in database tables. With a fixed role set (OWNER, ADMIN, VIEWER), this avoids unnecessary joins and migrations while keeping the policy shared between API and dashboard. For a system with dynamic or tenant-defined roles, these mappings would move to `permissions` and `role_permissions` DB tables.

---

## Organization Scope Design

### Single-Organization Membership

Each user belongs to exactly one organization.

**Tradeoff:**  
Users cannot belong to multiple organizations.

**Rationale:**  
Keeps JWT payload simple and RBAC deterministic.  
Multi-org support would require:

- `user_organizations` join table
- Active org switching
- Role-per-org logic

### Two-Level Organization Hierarchy

Organizations support a parent and direct children (maximum 2-level hierarchy, no deep recursion).

**Tradeoff:**  
Limited flexibility for large enterprise structures.

**Rationale:**  
Requirement specifies max 2 levels.

---

## Rate Limiting

Authentication endpoints are rate limited to mitigate abuse and brute-force attacks.

- **Implemented via:** NestJS throttling middleware

**Why?**

- Prevent brute-force attacks
- Improve production-readiness
- Reduce abuse risk

**Tradeoff:**  
Adds slight request overhead.

## API

> **Postman collection:** [TurboVets Workspace collection](https://naahia-6479.postman.co/workspace/Naahia-Workspace~08336faf-d5a8-413a-8d7b-f2e239a19c9b/collection/30869955-b2de4d80-71c3-4df0-9845-4f22710bcdb1?action=share&creator=30869955&active-environment=30869955-520b5efb-2177-4f81-939c-2048253874d0)

### Endpoints

| Method | Path               | Auth | Permission  | Description             |
| ------ | ------------------ | ---- | ----------- | ----------------------- |
| GET    | /api               | No   | –           | Health check            |
| POST   | /api/auth/register | No   | –           | Register org + owner    |
| POST   | /api/auth/login    | No   | –           | Login, get JWT          |
| GET    | /api/tasks         | JWT  | TASK_READ   | List tasks (org-scoped) |
| GET    | /api/tasks/:id     | JWT  | TASK_READ   | Get single task         |
| POST   | /api/tasks         | JWT  | TASK_CREATE | Create task             |
| PUT    | /api/tasks/:id     | JWT  | TASK_UPDATE | Update task             |
| DELETE | /api/tasks/:id     | JWT  | TASK_DELETE | Delete task             |
| GET    | /api/audits-logs   | JWT  | AUDIT_READ  | List audit logs         |

### Sample requests

**Register**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"org_name": "Acme Inc", "email": "admin@acme.com", "password": "Secret123"}'
# -> { "accessToken": "eyJhbG..." }
```

**Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.com", "password": "Secret123"}'
# -> { "accessToken": "eyJhbG..." }
```

**Create task** (requires Bearer token)

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Ship feature", "category": "WORK", "status": "TODO"}'
# -> { "id": "uuid", "title": "Ship feature", "category": "WORK", "status": "TODO", ... }
```

**Update task status** (drag-and-drop uses this)

```bash
curl -X PUT http://localhost:3000/api/tasks/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

---

## Tradeoffs & Solutions

| Decision                           | Tradeoff                    | Rationale                                                         |
| ---------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| File-based RBAC                    | Cannot add roles at runtime | Fixed role set; avoids DB joins; shared via `libs/data`           |
| Single-org membership              | No multi-org switching      | Simplifies JWT and authorization                                  |
| Two-level hierarchy                | No deep nesting             | Matches requirement;                                              |
| SQLite in dev                      | Not production-grade        | Zero config; easily swappable with Postgres                       |
| Client-side JWT decode             | Payload visible             | Payload contains non-sensitive info; backend enforces permissions |
| Authorization in guards + services | Slight duplication          | Defense in depth                                                  |
| Logging successful audit actions   | Larger audit table          | Enables full traceability                                         |
| Rate limiting enabled              | Slight overhead             | Protects auth endpoints                                           |
| Client-side filtering              | Doesn't scale               | Acceptable for scope; can move server-side                        |

---

## Future Considerations

- **Organization invites** – allow owners/admins to invite users via a unique invite code or shareable link, removing the need to manually create accounts per org
- **Multi-org membership** – currently each user belongs to a single organization; extend to a many-to-many relationship (`user_organizations` join table) so users can switch between orgs
- **PostgreSQL** – replace SQLite with Postgres for production (connection pooling, concurrent writes, proper JSON/UUID types). TypeORM config swap only, no schema changes required
- **Profile picture upload** – support image upload during registration or in a profile settings page, storing files in S3/Cloud Storage and saving the URL to `users.profile_picture_url` (column already exists)
- **Pagination** - include pagination for the audit logs.
