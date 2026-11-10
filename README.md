# Business Intelligence Dashboard

A full-stack business intelligence application built with React 19, Vite, Recharts, Node.js, Express, and PostgreSQL 16. It provides role-based access control, executive KPI dashboards, CRM and catalog management, transactional sales recording, multi-tab analytics reports, and a Gemini-powered Text-to-SQL AI Assistant.

---

## Architecture

- **Frontend**: React 19 single-page application built with Vite, React Router, and Recharts. Supports light/dark themes, responsive drawer navigation, and relative `/api` proxying.
- **Backend**: Express.js REST API with JWT access/refresh authentication, role-based authorization (`admin`, `manager`, `analyst`), Joi request validation, Helmet security headers, and tiered rate limiting.
- **Database**: PostgreSQL 16 with idempotent SQL migrations (`001`–`008`), restricted read-only `ai_*` views, and a dedicated `ai_readonly` role.
- **AI Assistant**: Dynamic Text-to-SQL pipeline powered by Google Gemini (`gemini-2.5-flash`) with AST SQL validation, error self-correction retries, empty-result refinement, exact-intent fallback, and an offline `mock` mode.

---

## Project Structure

```text
bi-dashboard/
├── backend/              # Express API, services, migrations/seed scripts, evaluation & tests
├── database/
│   ├── migrations/       # Sequential PostgreSQL migrations (001–008)
│   └── seeds/            # Synthetic dataset SQL reference
├── frontend/             # React 19 + Vite UI, components, pages & tests
├── .env.example          # Environment variable template
├── DEMO_GUIDE.md         # Live presentation walkthrough & demo prompts
└── README.md             # Setup, security, testing, and deployment guide
```

---

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16 (or Docker to run `postgres:16`)

---

## Local Setup

### 1. Start PostgreSQL

```bash
docker run -d --name bi_postgres -p 127.0.0.1:5432:5432 \
  -e POSTGRES_DB=business_intelligence \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16
```

If the container already exists:

```bash
docker start bi_postgres
```

### 2. Configure Root `.env`

Copy `.env.example` to `.env` in the repository root and configure values for your environment:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` / `production` | Controls error redaction, CORS strictness, and startup checks |
| `PORT` | `5000` | Backend HTTP port |
| `CORS_ORIGIN` | `http://localhost:5173,http://<server-ip>:5173` | Comma-separated allowed browser origins in production |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `localhost`, `5432`, `business_intelligence`, `postgres` | Primary PostgreSQL connection |
| `AI_DB_USER`, `AI_DB_PASSWORD` | `ai_readonly`, `ai_readonly_password` | Read-only PostgreSQL role created by migrations 004/008 |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `32+ random chars` | **Required non-default secrets in `production`** |
| `AI_PROVIDER` | `mock` (offline) or `gemini` | Explanation provider (`mock` needs no API key) |
| `AI_DYNAMIC_SQL` | `true` | Enables Gemini Text-to-SQL dynamic query pipeline |
| `GEMINI_API_KEY` | *(from Google AI Studio)* | Required for live Gemini Text-to-SQL & `ai_eval.js` |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model used for SQL generation and explanations |
| `AI_SQL_TIMEOUT_MS` | `30000` | Timeout in ms for Gemini SQL generation |
| `LOGIN_RATE_LIMIT_MAX` | `20` | Max login requests per 15-minute window per IP |
| `AI_RATE_LIMIT_MAX` | `30` | Max `/api/ai/ask` requests per 15-minute window per IP |
| `VITE_API_URL` | `/api` | Frontend API base path (proxied to port `5000` by Vite/Nginx) |

### 3. Run Database Migrations and Seed

```bash
cd backend
npm install
npm run migrate
npm run seed
```

- `npm run migrate` executes `database/migrations/001` through `008` in order and records applied filenames in `schema_migrations`, making re-runs safely idempotent.
- Note: By design, `products.cost_price` and `products.supplier` remain excluded from `ai_products` for vendor/margin confidentiality.
- Start the backend dev server (`http://localhost:5000`):

```bash
npm run dev
```

### 4. Start the Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Login Credentials (Seeded)

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| Admin | `admin@bi.corp` | `Admin123!` | Full access including User Management & Audit Logs |
| Manager | `manager@bi.corp` | `Manager123!` | Create and edit customers, products, and sales; view reports & AI |
| Analyst | `analyst@bi.corp` | `Analyst123!` | Read-only access to dashboard, records, reports, and AI Assistant |

---

## AI Assistant Dynamic SQL Safety

When `AI_DYNAMIC_SQL=true` and `GEMINI_API_KEY` is configured:

1. **Restricted Views & Role Isolation**: Dynamic SQL executes strictly over the `ai_readonly` PostgreSQL role, which only has `SELECT` permission on four views: `ai_customers`, `ai_products`, `ai_sales`, and `ai_sale_items`. Base tables (`users`, `audit_logs`, etc.) and sensitive columns (`email`, `phone`, `password_hash`, `cost_price`, `supplier`, `created_by`) are inaccessible (`permission denied`).
2. **AST Validation & 200-Row Cap**: `node-sql-parser` enforces single `SELECT` / `WITH...SELECT` statements, blocks DDL/DML and `SELECT INTO`, verifies all table references and function calls against a safe allow-list (supporting aggregates, window functions, string/date helpers, `CASE`, CTEs, `JOIN`s, and `ILIKE`), and caps results at 200 rows.
3. **Timeouts & Connections**: `ai_readonly` enforces a `5s` PostgreSQL `statement_timeout` and `CONNECTION LIMIT 15`.
4. **Self-Correction & Grounding**: Automatically retries up to 2 times on SQL errors and once on empty result sets against cached `information_schema` and distinct values (`status`, `city`, `category`, `brand`). Explanations are grounded strictly in up to 50 returned rows formatted in `₹` (`en-IN`).
5. **Conversation Context & Audit**: Accepts up to 3 previous `(question, answer)` follow-up turns (`<= 500` / `<= 600` chars) and logs every query in `audit_logs`.

---

## Tests, Linting, Build & AI Evaluation

### Backend Tests (123 tests across 11 suites)

```bash
cd backend
npm test
```

### AI Text-to-SQL Evaluation (40 Benchmark Questions)

Runs all 40 benchmark questions through `aiSqlGenerator` and compares results against hand-written reference SQL on `ai_readonly`. Requires a live `GEMINI_API_KEY`:

```bash
cd backend
GEMINI_API_KEY=your_gemini_api_key AI_DYNAMIC_SQL=true node scripts/ai_eval.js
```

### Frontend Lint, Tests (40 tests across 8 suites), and Build

```bash
cd frontend
npx oxlint src
npm test
npm run build
```

---

## Production / Server Deployment (`http://<ip>:5173`)

Both `frontend/vite.config.js` (`server` and `preview`) bind to `0.0.0.0:5173` and proxy `/api` requests to `http://localhost:5000`, while `frontend/src/api/client.js` defaults `API_BASE_URL` to `/api`. This allows visitors to open `http://<server-ip>:5173` directly without hardcoded `localhost` API URLs.

### Update & Deploy Steps on Server

```bash
# 1. Pull latest code
cd /path/to/bi-dashboard
git pull origin main

# 2. Install dependencies cleanly
cd backend && npm ci
cd ../frontend && npm ci

# 3. Verify root .env for server IP and production secrets
# Ensure root .env contains:
#   NODE_ENV=production
#   CORS_ORIGIN=http://<server-ip>:5173,http://localhost:5173
#   JWT_ACCESS_SECRET=<strong-random-32+-chars>
#   JWT_REFRESH_SECRET=<strong-random-32+-chars>
#   AI_PROVIDER=gemini
#   AI_DYNAMIC_SQL=true
#   GEMINI_API_KEY=<your-live-key>
#   GEMINI_MODEL=gemini-2.5-flash
#   VITE_API_URL=/api

# 4. Apply PostgreSQL migrations (001–008)
cd ../backend
npm run migrate
# Fresh server only (skip on existing live DB because seed truncates tables):
# npm run seed

# 5. Build frontend production bundle
cd ../frontend
npm run build

# 6. Start / restart backend & frontend processes with PM2
pm2 restart bi-backend || pm2 start src/server.js --name bi-backend --cwd /path/to/bi-dashboard/backend
pm2 restart bi-frontend || pm2 start npm --name bi-frontend --cwd /path/to/bi-dashboard/frontend -- run preview -- --host 0.0.0.0 --port 5173
pm2 save
```

If using Nginx instead of `vite preview` on port `5173`, serve `frontend/dist/` and add `location /api/ { proxy_pass http://127.0.0.1:5000; }`.

---

## API Documentation

Swagger / OpenAPI 3.0 documentation is served at `http://<server-ip>:5000/api/docs` (and OpenAPI JSON at `/api/docs.json`) while the backend is running.
