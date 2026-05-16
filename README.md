# Waffar (وفر) — Egypt's Price Intelligence Platform

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy + SSL)       │
├──────────────┬──────────────┬───────────────────────┤
│   Frontend   │   Backend    │      Scraper Workers   │
│   Next.js 14 │   Node.js    │      Python + Celery   │
│   Port 3000  │   Port 4000  │      Beat Scheduler    │
├──────────────┴──────────────┴───────────────────────┤
│              PostgreSQL 16  │  Redis 7  │ MinIO (S3) │
├─────────────────────────────┴───────────┴───────────┤
│              AI Services (Python FastAPI)             │
│   Matching │ Recommendations │ Price Prediction       │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js 20, Express, Prisma ORM, TypeScript |
| Database | PostgreSQL 16 with pg_trgm, unaccent extensions |
| Cache | Redis 7 (sessions, queues, rate limiting) |
| Scrapers | Python 3.12, Playwright, Celery, BeautifulSoup |
| AI | Python FastAPI, sentence-transformers, scikit-learn |
| Storage | MinIO (S3-compatible for images) |
| Search | PostgreSQL full-text search + trigram similarity |
| Auth | JWT + refresh tokens, bcrypt, RBAC |
| Deployment | Docker Compose (dev), Kubernetes (prod) |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- pnpm 8+

### Development Setup

```bash
# Clone and setup
git clone https://github.com/waffar/waffar.git
cd waffar

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Start infrastructure (DB, Redis, MinIO)
docker compose up -d postgres redis minio

# Backend
cd backend
pnpm install
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev

# Scrapers (new terminal)
cd scrapers
pip install -r requirements.txt
playwright install chromium
celery -A src.celery_app worker --loglevel=info
# In another terminal:
celery -A src.celery_app beat --loglevel=info

# AI Services (new terminal)
cd ai
pip install -r requirements.txt
uvicorn src.main:app --reload --port 5000
```

### Full Docker Setup
```bash
docker compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/docs
- AI Service: http://localhost:5000/docs
- MinIO Console: http://localhost:9001
- Grafana: http://localhost:3001

## Assumptions & Defaults

- **Currency**: EGP (Egyptian Pound) — all prices stored as integers (piasters) to avoid floating point
- **Language**: Arabic primary, English secondary. UI supports RTL
- **Region**: Egypt only at launch. City-level pricing where available
- **Stores at launch**: Amazon.eg, Noon, Jumia, B.Tech, 2B, Carrefour Egypt, Electronia
- **Scrape frequency**: Hot products every 5 min, medium every 30 min, cold daily
- **Auth**: Email + password, Google OAuth, phone OTP (via Twilio)
- **Payments**: Paymob for subscriptions (Egyptian payment gateway)
- **Email**: Resend for transactional emails
- **SMS**: Twilio for OTP
- **AI Models**: all-MiniLM-L6-v2 for embeddings, custom classifiers for matching
- **Rate limits**: 100 req/min anonymous, 300 req/min authenticated
- **Free tier**: 5 tracked products, 3 alerts, basic search
- **Pro tier**: Unlimited tracking, unlimited alerts, AI advisor, budget tools — 49 EGP/month

## Project Structure

```
waffar/
├── frontend/          # Next.js 14 application
├── backend/           # Express API server
├── scrapers/          # Python scraper workers
├── ai/                # AI/ML services
├── infra/             # Docker, nginx, scripts
├── business/          # Business docs, pitch, roadmap
├── .github/           # CI/CD workflows
└── docker-compose.yml # Full stack orchestration
```

## License

Proprietary — Waffar Technologies Ltd.
