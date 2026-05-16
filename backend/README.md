# Waffar.eg Backend

Express/TypeScript API for Waffar.eg, backed by PostgreSQL, Prisma, Redis, and BullMQ.

## Run Locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Run background jobs in a second terminal:

```bash
npm run worker
```

## Core Endpoints

- `GET /api/health` and `GET /api/v1/system/health` check database and Redis.
- `GET /api/v1/system/ready` is the readiness probe for deployments.
- `GET /api/v1/system/metrics` returns admin metrics for users, products, stores, alerts, failed scrapes, and feature flags.
- `/api/auth` and `/api/v1/auth` support register, login, refresh, logout, logout-all, sessions, password reset, email verification, profile, and settings.
- `/api/products`, `/api/search`, `/api/stores`, `/api/alerts`, `/api/watchlists`, `/api/coupons`, `/api/dashboard`, `/api/guides`, `/api/ai`, `/api/campaigns`, and `/api/upload` keep the existing frontend contract stable.
- `/api/v1/commerce/comparisons` records product comparison groups and returns side-by-side product data.
- `/api/v1/commerce/reports` records product or store reports.
- `/api/v1/commerce/redirect` tracks affiliate clicks and redirects with Waffar UTM parameters.

## Admin Operations

Admin and super-admin users can manage scraper operations through:

- `GET /api/v1/admin/scrapers`
- `PATCH /api/v1/admin/scrapers/:id`
- `POST /api/v1/admin/scrapers/:id/start`
- `POST /api/v1/admin/scrapers/:id/pause`
- `POST /api/v1/admin/scrapers/:id/resume`
- `GET /api/v1/admin/scrapers/runs`
- `POST /api/v1/admin/scrapers/runs/:id/retry`
- `GET /api/v1/admin/scrapers/runs/:id/errors`

Every state-changing admin action creates an audit log entry.

## Background Jobs

BullMQ uses Redis and currently defines:

- `scrape` queue: accepts `scrape-store` jobs from admin controls or internal APIs.
- `maintenance` queue: accepts `check-alerts`, `update-product-aggregates`, and `daily-price-snapshot`.
- `notifications` queue: reserved for email/push notification delivery.

Internal job APIs require `x-internal-api-key`:

- `POST /api/v1/system/jobs/scrape`
- `POST /api/v1/system/jobs/maintenance`

## Environment

Required:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `INTERNAL_API_KEY`

Recommended production settings:

- `CORS_ORIGINS=https://waffar.eg,https://www.waffar.eg`
- `BCRYPT_ROUNDS=12`
- `FEATURE_AFFILIATE_TRACKING=true`
- `FEATURE_NOTIFICATIONS=true`
- `SCRAPER_CONCURRENCY=5`

## Data Model Highlights

The Prisma schema includes users, refresh tokens, device sessions, password reset tokens, email verification tokens, user settings, stores, products, listings, price history, alerts, watchlists, coupons, reviews, search logs, price views, scraper configs, scraper runs, scrape errors, comparison logs, affiliate clicks, reports, audit logs, campaigns, notifications, and system settings.

Prices are stored as integer piasters to avoid floating-point currency issues.

## Verification

```bash
npm run prisma:generate
npm run lint
npm run build
npm test
```

The API keeps legacy `/api/*` routes available and also exposes the same surface under `/api/v1/*` for mobile apps and future clients.
