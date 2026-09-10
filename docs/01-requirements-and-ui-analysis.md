# EGYMOTELZ — Software Requirements Specification (Phase 1)
### Derived from `egymotelz-ui-preview.html` (10-screen prototype, RTL Arabic/English)

> **Scope note on this deliverable:** Per the mission's own workflow ("do not generate all code at once"), this is Phase 1 only — UI analysis → requirements. Phases 2–10 (DB schema, architecture, API spec, roadmap, implementation, tests, deployment) follow in subsequent steps once the requirements below are confirmed.
>
> **Environment note:** This sandbox has no outbound network access, so I can write every backend/DB/Docker file but cannot `npm install`, spin up PostgreSQL, or run Docker here to execute/test it live. I'll build everything to be run and tested in your own environment (or via Claude Code, which has full execution). I'll flag this again at the natural point in the roadmap where "run and verify" matters.

---

## 0. UI Inventory

The prototype is a single static HTML file with a JS `show(id)` tab-router. It is **not** yet Next.js — it's the visual/UX source of truth to be reimplemented in Next.js 14 with pixel-identical layout, copy, and flows. Ten screens/tabs exist:

| # | Tab label | Screen id | Type |
|---|---|---|---|
| 0 | 🌐 Language / اللغة | `sc-lang` | Public splash |
| 1 | 🏠 الرئيسية (Home) | `sc-home` | Public marketing |
| 2 | 🏨 الوحدات (Listings) | `sc-listings` | Public catalog |
| 3 | 🏢 انضم كمالك (Owner onboarding) | `sc-owners` | Public 6-step wizard |
| 4 | 📅 احجز إقامة (Booking) | `sc-booking` | Public request form |
| 5 | ⚙️ الإدارة (Admin) | `sc-admin` | Internal dashboard |
| 6 | 💰 المالية (Finance) | `sc-finance` | Internal, restricted |
| 7 | 📊 الحاسبة (ROI Calculator) | `sc-calc` | Owner-private tool |
| 8 | 🔧 المقاولون (Contractor Portal) | `sc-contractor` | Internal, restricted |
| 9 | ℹ️ من نحن (About) | `sc-about` | Public static |

---

## 1. Screen-by-Screen Specification

### 1.1 Language Selector (`sc-lang`)
- **Purpose:** Entry splash; sets locale before entering the app.
- **Role:** Anonymous/Guest.
- **Inputs:** Language choice (العربية / English).
- **Outputs:** Redirect to Home with locale set; RTL/LTR direction toggle.
- **Endpoints:** None required server-side for v1 (client-stored locale is enough); optional `PATCH /api/users/me/locale` once accounts exist.
- **DB:** None directly; `users.preferred_locale` column for logged-in personalization.
- **Business rules:** Default locale = ar; no login required.
- **Validation:** N/A.
- **Permissions:** Public.

### 1.2 Home / Marketing (`sc-home`)
- **Purpose:** Brand landing page, value proposition, platform stats, trust signals, CTAs to Owner and Listings flows.
- **Role:** Anonymous/Guest.
- **Inputs:** None (informational) besides nav clicks.
- **Outputs:** Static + semi-dynamic stats panel: "50+ units managed", "92% guest satisfaction", "12+ Cairo neighborhoods", "4.9 avg rating".
- **Required endpoints:**
  - `GET /api/public/platform-stats` → aggregated counts (units managed, avg rating, guest satisfaction, active neighborhoods) computed from live data instead of hardcoded.
- **DB tables involved:** `properties`, `units`, `bookings`, `reviews` (aggregate reads only).
- **Business rules:** Stats should be cached (e.g., 1-hour TTL) since they're aggregate queries, not per-request.
- **Validation:** N/A.
- **Permissions:** Public, read-only.

### 1.3 Listings / Units Catalog (`sc-listings`)
- **Purpose:** Browse available serviced-apartment units; entry point to booking.
- **Role:** Guest.
- **Inputs:** (Prototype shows static cards; production needs) filters: city, price range, bedroom count, amenities; pagination.
- **Outputs:** Unit cards: price/night, title, location, badges ("Available now", "Recommended", "Special offer"), amenity chips, cover image.
- **Required endpoints:**
  - `GET /api/units?city=&minPrice=&maxPrice=&bedrooms=&amenities=&page=&sort=` — paginated, filtered, sorted listing of **published, available** units only.
  - `GET /api/units/:id` — unit detail (for a future detail screen/modal; not in current UI but needed to back the "Book Now" action meaningfully).
- **DB tables:** `units` (belongs to `properties`), `unit_images` (media), `amenities`, `unit_amenities` (join), `availability_calendar`.
- **Business rules:** Only units with `status = 'published'` and `is_active = true` are listed; badge logic (`available_now`, `recommended`, `special_offer`) driven by fields/flags, not hardcoded per card.
- **Validation:** Query params sanitized/whitelisted (city enum, numeric ranges).
- **Permissions:** Public read.
- **Relationships:** Unit → Property (N:1) → Owner (N:1). Unit → Amenities (N:N).

### 1.4 Owner Onboarding Wizard (`sc-owners`) — 6 steps
This is the most complex public flow. Steps map to wizard state `os0`–`os5`, progress bar, and a success state `o-suc`.

**Step 0 — Owner Info:** full name*, phone*, email*, national ID (14 digits)*.
**Step 1 — Property Details:** property type* (residential building / villa / full floor), city* (Cairo/Giza/Alexandria), district*, detailed address*, floor count*, unit count*.
**Step 2 — Condition:** overall condition* (excellent/good/needs renovation/raw structure), furnishing level* (fully/partially/unfurnished), free-text notes.
**Step 3 — Financial:** needs financing?* (yes/no/partial), needs furnishing help?* (yes/no/partial), approximate budget (optional, free text currently → should become a validated numeric field with currency).
**Step 4 — Documents:** national ID document* (PDF/JPG/PNG, ≤10MB), proof of ownership* (same constraints), optional inheritance document / power of attorney.
**Step 5 — Review & Submit:** read-only summary, mandatory partnership-terms checkbox, submit.
**Success:** confirmation message ("team will contact within 48h").

- **Role:** Prospective Property Owner (anonymous until this submission creates the account/lead).
- **Required endpoints:**
  - `POST /api/owner-applications` — creates the multi-step submission as one transaction (or `PATCH` per step if we persist wizard progress server-side, recommended so users don't lose data on refresh).
  - `POST /api/owner-applications/:id/documents` — multipart upload → Cloudinary/S3-equivalent, returns document refs.
  - `GET /api/owner-applications/:id` — resume/summary (step 5).
  - Internal: `PATCH /api/admin/owner-applications/:id/status` (approve/reject/request-documents) — used by Admin screen §1.6.
- **DB tables:** `owners` (created on submit or on approval — decision needed, see open question below), `owner_applications` (status machine: `submitted → under_review → docs_requested → approved/rejected`), `properties` (draft created from step 1–2 data), `documents` (polymorphic: owner_id/property_id, type, file_url, verified_at), `system_settings` for review-SLA config (48h).
- **Business rules:**
  - National ID must be exactly 14 numeric digits (Egyptian format) — currently just `maxlength=14`, needs real checksum/format validation.
  - Egyptian phone format (`01[0-2,5]xxxxxxxx`).
  - Required file types/size enforced server-side, not just the upload-zone label.
  - Terms checkbox must be true to submit (already enforced client-side; must be re-enforced server-side).
  - Submission triggers: (a) confirmation email/SMS to owner, (b) notification to Admin queue, (c) 48h SLA timer for internal reporting.
- **Validation:** Zod schemas per step; national ID, phone, email formats; enum whitelisting for selects; numeric mins (floors≥1, units≥1); file MIME/size checks.
- **Permissions:** Public can create; only Admin/Super Admin can transition status.
- **Relationships:** Owner Application → (on approval) → Owner account → Property → Units (auto-created per unit count, initially in "not ready" status) → Documents.

### 1.5 Guest Booking Request (`sc-booking`)
- **Purpose:** Guests submit a **stay request** (manually reviewed/approved — not instant confirmation, per the subtitle "requests are subject to manual review").
- **Role:** Guest.
- **Inputs:** full name*, phone/WhatsApp*, email*, nationality*, check-in date*, check-out date*, guest count* (1/2/3/4/5+), preferred city* (Cairo/Giza/Alexandria), notes, policy-agreement checkbox*.
- **Outputs:** Success message ("request received, team will contact within 24h").
- **Required endpoints:**
  - `POST /api/bookings` — creates a booking **request** in `pending` status (not tied to a specific unit yet, since the form only asks for city — matches "manual matching" business model implied by the UI).
  - Internal: `PATCH /api/admin/bookings/:id` (assign unit, approve, reject, mark contacted).
- **DB tables:** `bookings` (guest info snapshot or FK to a lightweight `guests`/`users` table, check_in, check_out, guest_count, preferred_city, unit_id nullable until assigned, status, notes), `availability_calendar` (checked/blocked once a unit is assigned).
- **Business rules:** check-out > check-in; dates ≥ today; guest count enum; 24h SLA; no instant availability confirmation — this is a lead/request funnel, not a live reservation engine (important: don't over-engineer real-time inventory locking for v1 unless product wants it later).
- **Validation:** Zod: date range, phone/email formats, required checkbox.
- **Permissions:** Public create; Admin/Ops manage.
- **Relationships:** Booking → Guest (N:1, guest may be anonymous/one-off), Booking → Unit (N:1, nullable), Booking → Property (via unit).

### 1.6 Admin Dashboard (`sc-admin`)
- **Purpose:** Operational control center for Owners, Properties, Bookings, Documents, Users; internal-only Finance/Contractors links; metrics + a pending-applications table.
- **Role:** Admin / Super Admin.
- **Sidebar sections:** Dashboard, Owners, Properties, Bookings, Documents, Users | *(internal)* Finance, Contractors, Reports.
- **Metrics shown:** total owners, pending applications, active bookings, managed units (with "active" sub-count).
- **Table shown:** owner applications with owner name, property, city, submission date, status badge (Pending/Approved/Docs Review), action button (Review/View).
- **Required endpoints:**
  - `GET /api/admin/metrics` — dashboard KPIs.
  - `GET /api/admin/owner-applications?status=&page=` — paginated queue.
  - `GET /api/admin/owner-applications/:id` — full detail + documents for review modal.
  - `PATCH /api/admin/owner-applications/:id/status` — approve / reject / request-docs.
  - `GET/PATCH /api/admin/bookings`, `GET/PATCH /api/admin/properties`, `GET/PATCH /api/admin/users` (role management), `GET /api/admin/documents` (verification queue).
- **DB tables:** all core tables (read/write), plus `audit_logs` (every admin mutation logged: actor, action, entity, before/after, timestamp) and `activity_logs` (user-facing activity feed, distinct from audit).
- **Business rules:** Status transitions follow a defined state machine (see §3 workflows); every mutation must write an audit log row; role-gated visibility of "internal" sidebar sections (Finance/Contractors) even within Admin — Super Admin sees everything, scoped Admin roles may not.
- **Validation:** Status enum whitelisting; can't approve an application missing required documents.
- **Permissions:** `role IN (admin, super_admin)`; RBAC + row-level checks for restricted internal sections.
- **Relationships:** Central hub touching Owners, Properties, Units, Bookings, Documents, Users.

### 1.7 Finance Portal — Internal (`sc-finance`)
- **Purpose:** Restricted financial operations: revenue overview, owner payouts, commissions, manual transaction entry, report export. UI explicitly labels this "🔒 not visible to clients or owners."
- **Role:** Admin/Finance role only (should be its own permission, not implied by generic Admin).
- **Metrics:** total monthly revenue, owner payouts, EGYMOTELZ commission (EGP).
- **Table:** owner, transaction type (monthly payment/commission), amount, payment method (bank transfer/cash/deduction), date, status (confirmed/pending).
- **Required endpoints:**
  - `GET /api/finance/summary?month=`
  - `GET /api/finance/transactions?ownerId=&type=&status=&page=`
  - `POST /api/finance/transactions` — manual transaction entry.
  - `GET /api/finance/reports/export?format=csv|pdf&range=`
- **DB tables:** `financial_transactions` (owner_id, booking_id nullable, type: payout/commission/manual, amount, currency, method, status, occurred_at, recorded_by), `contracts` (commission-rate reference), `owners`.
- **Business rules:** Commission rate per owner/property (from contract) drives auto-calculated commission rows; manual entries require a reason/note and are always audit-logged; this data must **never** be exposed through any public or owner-facing endpoint — enforce with a dedicated `finance` scope, not just "is admin."
- **Validation:** Positive amounts, valid currency (EGP default), enum method/status/type.
- **Permissions:** Strictly `finance` or `super_admin` scope — this is the highest-sensitivity module in the system.
- **Relationships:** Transaction → Owner (N:1), optionally → Booking (N:1).

### 1.8 Owner ROI Calculator (`sc-calc`)
- **Purpose:** Private estimation tool (explicitly labeled "owner dashboard-only, not public"): sliders for unit count, avg nightly rate, occupancy %, commission %, furnishing cost → computes gross monthly revenue, commission deduction, net monthly income, projected annual net, furnishing payback period (months).
- **Role:** Property Owner (authenticated) — currently mis-scoped as a public tab in the prototype; per its own label it must move behind owner auth in the real app (a legitimate "minor adjustment" the mission allows for a technical/security reason, not a redesign).
- **Inputs:** 5 numeric slider values (client-side).
- **Outputs:** 5 computed values — this is pure client-side arithmetic today (`calcU()` in JS) and can **stay client-side**; no need to round-trip to the server for a slider calculator. Optionally persist the owner's last-used scenario.
- **Required endpoints (optional, for persistence only):**
  - `POST /api/owners/me/roi-scenarios` / `GET /api/owners/me/roi-scenarios` — save/recall a scenario.
- **DB tables:** optional `roi_scenarios` (owner_id, inputs JSON, computed JSON, created_at).
- **Business rules:** Formula (already defined in prototype JS, to preserve exactly):
  `gross = units × rate × 30 × (occupancy/100)`
  `commission = gross × (commissionRate/100)`
  `net = gross − commission`
  `annual = net × 12`
  `payback = ceil(furnishingCost / net)` months (if net > 0).
- **Validation:** Slider bounds already fixed in UI (units 1–50, rate 300–3000, occupancy 20–100%, commission 10–35%, furnishing 0–2,000,000 EGP) — mirror these as server-side bounds if persistence is added.
- **Permissions:** Authenticated Owner only (see mis-scoping note above).

### 1.9 Contractor / Furnishing Portal — Internal (`sc-contractor`)
- **Purpose:** Internal project tracking for construction/furnishing pipeline per property: progress %, stage tracker (Design → Construction → Furnishing → Inspection).
- **Role:** Contractor / Internal Ops.
- **Cards shown:** project name, address + unit count, progress bar %, current stage label, 4-stage tracker with done/active/todo states.
- **Required endpoints:**
  - `GET /api/contractor/projects` — projects assigned to the logged-in contractor (or all, for internal ops/admin).
  - `PATCH /api/contractor/projects/:id/stage` — advance stage (Design/Construction/Furnishing/Inspection), auto-recomputes progress %.
  - `POST /api/contractor/projects/:id/tasks`, `GET .../tasks` — task-level detail (sidebar has "المهام / Tasks" not yet built out in the mock).
  - `GET/POST /api/contractor/furnishing-requests` — ties into Owner-application step-3 "needs furnishing help."
- **DB tables:** `contractor_projects` (property_id, contractor_id, current_stage enum, progress_pct, started_at), `contractor_tasks`, `furnishing_requests` (linked to `owner_applications`/`properties`), `contractors` (profile, verified status).
- **Business rules:** Stage order is fixed (Design→Construction→Furnishing→Inspection); progress_pct should be derived from stage + task completion, not freely editable; internal-only — same visibility rule as Finance.
- **Validation:** Stage enum sequence enforcement (can't skip backward silently without an explicit "revert" action + audit log).
- **Permissions:** `contractor` or `admin`/`super_admin` scope.
- **Relationships:** Project → Property (1:1 per active engagement), Project → Contractor (N:1), Project → Tasks (1:N).

### 1.10 About (`sc-about`)
- **Purpose:** Static brand/mission content (bilingual mission statement, "what we offer" list).
- **Role:** Public.
- **Endpoints:** None required — this can remain fully static, or optionally be served from a lightweight CMS-style `content_blocks` table if the business wants to edit copy without a redeploy. Not required for v1.
- **Permissions:** Public.

---

## 2. Cross-Cutting Requirements

### 2.1 Roles (confirmed from UI + mission doc)
`guest` (anonymous visitor), `owner`, `tenant` *(mentioned in business requirements but not yet visibly represented as a distinct screen — see open question)*, `contractor`, `financial_partner` *(mission mentions this as a role; UI shows a "Finance" **internal ops** portal, which reads as staff, not an external partner login — needs clarification, see §5)*, `admin`, `super_admin`.

### 2.2 Universal record requirements (per mission Phase 3)
Every table: `id` (uuid PK), relevant FKs with indexes, `created_at`, `updated_at`, `created_by`, `updated_by`, `status` (where applicable), `deleted_at` (soft delete) instead of hard delete.

### 2.3 Notifications triggered by these screens
- Owner application submitted → owner (email/SMS) + admin queue.
- Booking request submitted → guest (email/SMS) + admin/ops queue.
- Application status change (approved/rejected/docs requested) → owner.
- Document verified/rejected → owner.
- Contractor stage advanced → admin dashboard (optional owner-visible milestone update).

### 2.4 Internal-only modules (must be unreachable by non-staff even via direct URL)
Finance Portal, Contractor Portal, and the "internal" sidebar items inside Admin (Finance/Contractors links) — these need both **route-level auth guards** and **API-level scope checks**, not just hidden nav links (the current prototype only hides them via tabs, which is not security).

---

## 3. Key Workflows (state machines)

**Owner Application:** `submitted → under_review → docs_requested ⇄ under_review → approved | rejected`
On `approved`: create/activate `owners` record, create `properties` + `units` (status `not_ready`), optionally create a `contractor_projects` row if furnishing help was requested.

**Property Readiness:** `not_ready → in_preparation → ready → published`
Driven by contractor stage completion + admin sign-off.

**Booking Request:** `pending → contacted → confirmed | declined` (matches "reviewed manually" language; no instant-confirmation state needed for v1).

**Contractor Project Stage:** `design → construction → furnishing → inspection → complete` (linear; reverts require explicit admin/contractor action + audit log).

---

## 4. Open Questions (need product-owner confirmation before Phase 3 schema is finalized)

1. **Owner account creation timing:** Is the `owners` account/login created immediately on wizard submission (so they can log in and check status), or only after Admin approval? This changes the auth flow and whether step-5 needs a password field (currently absent from the UI).
2. **Tenant role:** The business requirements list "Tenant" as a role, but no tenant-facing screen exists in this prototype (the booking form is Guest-facing, not a tenant portal with a login). Is a tenant dashboard a future screen, or does "Tenant" simply mean "the guest, post-booking"?
3. **Financial Partner role:** Is this an external investor/lender who needs their own login, or is "Finance Portal" purely an internal-staff view (as the lock icon and copy suggest)? These require very different auth models.
4. **Booking → Unit assignment:** Should guests eventually pick a specific unit/dates with live availability (like a normal booking engine), or does the business intentionally keep this as a lead-capture form routed to manual matching? This materially changes whether we need a real-time availability/locking system.
5. **Multi-tenancy:** The schema list includes `Tenants` as an entity type separately from `users` — is this literally "renter of a unit" or does it mean "SaaS tenant" (i.e., is EGYMOTELZ itself going to be white-labeled for multiple hospitality brands)? This is the single biggest architecture fork — please confirm before Phase 3.

---

## 5. Confirmed Non-Negotiables Carried Into Every Later Phase
- No visual/layout/copy/flow changes to the 10 screens above — backend is built to match this UI exactly.
- The ROI Calculator's business formula is treated as authoritative and must not be "improved" or changed.
- Finance and Contractor portals are internal-only and must be enforced as such at the API layer, not just hidden in the UI.
- Every mutation in Admin/Finance/Contractor scopes is audit-logged.

---

## Next Steps
**Phase 2 — Database Schema** (PostgreSQL + Prisma): full normalized schema for all tables named above, with the 5 open questions resolved (defaulting to reasonable assumptions if you'd rather I not block on answers — I'll state each assumption inline in the schema so it's easy to override).

**Phase 3 — System Architecture doc**, **Phase 4 — Business logic**, **Phase 5 — API spec**, **Phase 6 — Roadmap**, then implementation phase-by-phase per the mission's own "do not generate all code at once" instruction.
