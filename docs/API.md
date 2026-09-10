# API Documentation

Interactive Swagger UI is mounted at `GET /api/docs` when the backend is running (raw OpenAPI JSON at `/api/docs.json`). This document is the static reference; see `docs/05-api-design.md` for the design rationale behind pagination/filtering/auth conventions.

## Conventions
- All list endpoints: `?page=&pageSize=` (max 100/page), response shape `{ items, pagination: { page, pageSize, total, totalPages } }`.
- Sortable list endpoints: `?sort=field:asc|desc`, restricted to an explicit per-resource allow-list.
- All mutating request bodies are validated with Zod; failures return `422` with per-field messages.
- Authenticated endpoints require `Authorization: Bearer <accessToken>`.
- Errors: `{ "error": "message", "details": [...] }` — never a raw stack trace.

## Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/login` | public | Sets httpOnly refresh cookie + CSRF cookie; returns access token + user |
| POST | `/refresh` | cookie + CSRF header | Rotates refresh token |
| POST | `/logout` | cookie + CSRF header | Clears cookies, revokes refresh token |
| POST | `/password-reset/request` | public | Always returns the same message (no account enumeration) |
| POST | `/password-reset/confirm` | public | Revokes all sessions on success |
| GET | `/me` | bearer | Current user + roles |

### Public / Units (`/api/units`, `/api/public`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/units` | public | Filters: `city`, `minPrice`, `maxPrice`, `bedrooms`, `amenities` (comma-separated); 30s cache |
| GET | `/units/:id` | public | 30s cache |
| GET | `/public/platform-stats` | public | Home screen stats; 1h server cache, 5min client cache |

### Owner Applications (`/api/owner-applications`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/` | public | Full 6-step wizard payload; creates User+Owner+Application atomically |
| GET | `/me` | bearer | Owner Dashboard entry point — own application + documents, no id needed |
| POST | `/:id/documents` | bearer, ownership-checked, rate-limited | Multipart upload, 10MB max, PDF/JPG/PNG only |
| GET | `/:id` | bearer, ownership-checked | Owner sees only their own; admin sees all |

### Contractor Applications (`/api/contractor-applications`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/` | public | Full contractor registration; account created immediately |
| GET | `/me` | bearer | Own application, no id needed |
| POST | `/:id/documents` | bearer, ownership-checked | Commercial registration, tax card, previous projects |
| GET | `/:id` | bearer, ownership-checked | Detail |
| GET | `/` | admin/super_admin | Review queue |
| PATCH | `/:id/review` | admin/super_admin | Actions: `start_review`, `approve`, `reject` |

### Hotel Management Companies (`/api/hotel-management-companies`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/` | public | Full registration; account created immediately |
| GET | `/me` | bearer | Own application, no id needed |
| GET | `/approved` | admin/super_admin | Approved companies, for future property assignment |
| POST | `/:id/documents` | bearer, ownership-checked | Commercial registration, tax card, company profile, operating license |
| GET | `/:id` | bearer, ownership-checked | Detail |
| GET | `/` | admin/super_admin | Review queue |
| PATCH | `/:id/review` | admin/super_admin | Actions: `start_review`, `approve`, `reject`, `request_more_info` (reason required) |

### Public Geo (`/api/public/cities`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/cities` | public | Full city + district list, cached 6h — backs the searchable location dropdown |

### Bookings (`/api/bookings`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/` | public | Real availability-locking transaction; 409 on date conflict |
| PATCH | `/:id/transition` | admin/super_admin | Actions: `mark_contacted`, `confirm`, `decline`, `cancel`, `check_in`, `check_out` |

### Admin (`/api/admin`) — all require `admin` or `super_admin`
| Method | Path | Notes |
|---|---|---|
| GET | `/metrics` | Dashboard KPIs |
| GET | `/owner-applications` | Paginated review queue |
| GET | `/owner-applications/:id` | Detail + documents |
| PATCH | `/owner-applications/:id/review` | Actions: `start_review`, `request_docs`, `approve`, `reject` |
| GET, PATCH | `/bookings`, `/bookings/:id` | Ops booking management |
| GET, PATCH | `/documents`, `/documents/:id/verify` | Verification queue |
| GET | `/users` | User list with roles |

### Finance (`/api/finance`) — requires `finance_staff` or `super_admin` specifically
| Method | Path | Notes |
|---|---|---|
| GET | `/summary` | Monthly revenue/payout/commission totals |
| GET | `/transactions` | Filterable by `ownerId`, `type`, `status` |
| POST | `/transactions` | Manual entry — always audit-logged |

### Contractor (`/api/contractor`) — requires `contractor`, `admin`, or `super_admin`
| Method | Path | Notes |
|---|---|---|
| GET | `/projects` | Own projects only, unless admin |
| PATCH | `/projects/:id/advance` | One step forward in the fixed pipeline |
| PATCH | `/projects/:id/revert` | Explicit, reason-required exception path |
| POST, PATCH | `/projects/:id/tasks`, `/tasks/:taskId` | Task management |

### Financial Partner (`/api/financial-partner`) — requires `financial_partner`
| Method | Path | Notes |
|---|---|---|
| GET | `/me` | Own partner profile |
| GET | `/transactions` | Strictly self-scoped — never owner/platform-wide data |

## Resolved since earlier phases
The document-upload endpoints previously had no auth gate (protected only by an unguessable UUID). This was closed once the Owner/Contractor/Hotel-Company Dashboards gave document upload a real login-gated home — all three upload endpoints now require `requireAuth` plus an ownership check (or admin), and are additionally rate-limited.
