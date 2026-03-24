# VerdictOS API

An extendable API layer for actions, approvals, and rule management, built on Next.js (App Router) with TypeScript and Supabase/Postgres.

## 🔧 Local Development

1. Clone repo & install deps:
    ```
    npm install
    ```
2. Copy `.env.example` to `.env` and fill in all values.
3. Start in dev mode:
    ```
    npm run dev
    ```

## 🛡️ Key Concepts

- API KEY auth via `x-api-key` header
- Idempotency for POST endpoints (send `Idempotency-Key`)
- Supabase/Postgres for persistent storage
- All endpoints under `/api/v1/`
- Health check: `/api/v1/health`

## 📦 Main Endpoints

- `POST /api/v1/actions`: Create action (idempotent, validated)
- `POST /api/v1/approvals`: Approve/Reject action
- `GET/POST /api/v1/rules`: CRUD for rules
- `GET /api/v1/health`: Liveness/readiness probe

## ⚙️ Env Vars

- `API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `WEBHOOK_SECRET`
