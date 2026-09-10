# Environment Variable Reference

All variables live in `backend/.env.example`. This explains what each one does and what happens if it's missing.

| Variable | Required | Purpose | If missing |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` / `test` / `production`. Controls `X-Tenant-ID` dev override, `Secure` cookie flag, log format. | Defaults to `development` — **must** be `production` in production or you'll leave a tenant-isolation bypass header active. |
| `PORT` | No | Backend HTTP port. | Defaults to `4000`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. | App fails to start — Prisma throws immediately. |
| `ROOT_DOMAINS` | Yes | Comma-separated root domain(s) this deployment answers for (e.g. `egymotelz.com`). Drives tenant resolution and CORS. | Defaults to `egymotelz.com` — fine for the reference deployment, must be set explicitly for any other domain. |
| `JWT_ACCESS_SECRET` | Yes | Signs access tokens. | App fails to start (`config/env.ts` fails fast on missing secrets). |
| `JWT_REFRESH_SECRET` | Yes | Signs refresh tokens (separate from access secret deliberately). | Same as above. |
| `ACCESS_TOKEN_TTL` | No | Access token lifetime. | Defaults to `15m`. |
| `REFRESH_TOKEN_TTL_DAYS` | No | Refresh token lifetime. | Defaults to `30`. |
| `BOOKING_HOLD_MINUTES` | No | How long a unit's dates are held before an unconfirmed booking auto-releases them. | Defaults to `15` (see `docs/03a-tenant-resolution.md` for why). |
| `REDIS_URL` | No | Shared cache backend. | App still works — caching silently no-ops with a logged error (see `docs/08-09-performance-and-testing.md`). |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | No | Real document/image storage. | Falls back to `LocalDevStorageAdapter`, which fabricates URLs — fine for dev, **must** be set for production document uploads to actually persist. |
| `SMTP_HOST` / `_PORT` / `_USER` / `_PASSWORD` | No | Real email delivery. | Falls back to `ConsoleEmailAdapter` — emails only appear in server logs. |
| `SMS_PROVIDER_API_KEY` | No | Real SMS delivery. | Falls back to `ConsoleSmsAdapter` — SMS only appears in server logs. |

## Frontend

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL the frontend calls for all API requests. |

## Never commit

No real `.env` file is included anywhere in this package — only `.env.example` with placeholder values. Populate real secrets via your deployment platform's secret manager (not a file in version control).
