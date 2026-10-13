# Smart BI – AI-Powered Business Intelligence Suite

An enterprise-grade Customer & Business Intelligence platform featuring a relational PostgreSQL database, an Express.js REST API with JWT authentication and Role-Based Access Control (RBAC), a React 19 analytics dashboard, and a secure AI Business Intelligence Assistant.

---

## 🏛️ Architecture Overview

```
                      ┌──────────────────────────────────────────┐
                      │        React 19 Smart BI Dashboard       │
                      │  (Vite, Recharts, Lucide, Glass System)  │
                      └────────────────────┬─────────────────────┘
                                           │ (JWT Bearer Auth via /api)
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │           Express.js REST API            │
                      │  (Helmet, CORS, Joi, RBAC, Morgan, Pool) │
                      └──────────────┬──────────────────┬────────┘
                                     │                  │
                (Approved Aggregations)                  │ (Sanitized Context)
                                     │                  │
                                     ▼                  ▼
                      ┌──────────────────────┐  ┌────────────────────────┐
                      │      PostgreSQL      │  │      AI Providers      │
                      │  (Docker Container)  │  │ (Gemini/OpenAI/Mock)   │
                      └──────────────────────┘  └────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, React Router 7, Recharts, Lucide React, Modern Vanilla CSS Design System.
- **Backend**: Node.js v20+, Express.js 4, `pg` connection pool, Joi validation, bcryptjs, jsonwebtoken, Helmet, CORS, Swagger OpenAPI UI.
- **Database**: PostgreSQL 16 on Docker container `bi_postgres` with migration tracking (`npm run migrate`) and synthetic enterprise seed data (`npm run seed`).
- **AI Integration**: Google Gemini (`gemini-2.5-flash`), OpenAI (`gpt-4o-mini`), and an offline deterministic ground-truth Mock engine for local/air-gapped environments.
- **Testing**: Vitest, React Testing Library, Supertest (83/83 passing tests across 15 test suites).

---

## 🚀 Cloning & Setup on a New Server

Follow these simple steps when deploying or cloning this repository on any new machine, server, or cloud instance:

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2. Configure Environment Variables
Copy the pre-configured `.env.example` template to `.env`:
```bash
cp .env.example .env
```
> **Note**: `.env.example` comes pre-configured with default local database settings and relative `/api` frontend proxying. If using Gemini or OpenAI, add your API key in `.env`; otherwise, keep `AI_PROVIDER=mock` for deterministic database queries.

### 3. Start PostgreSQL Database (Docker)
Ensure Docker is installed and start the `bi_postgres` container:
```bash
docker run -d --name bi_postgres -p 5432:5432 \
  -e POSTGRES_DB=business_intelligence \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16
```
*(If the container already exists from a previous run, simply run `docker start bi_postgres`)*.

### 4. Setup & Start Backend
```bash
cd backend
npm install
npm run migrate    # Creates all PostgreSQL schema tables
npm run seed       # Seeds 58 customers, 41 products, and sales ledger data
npm run dev        # Starts backend API on http://localhost:5000
```

### 5. Setup & Start Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```
Access the application in your browser at `http://<server-ip>:5173` (or `http://localhost:5173`).

---

## 🔐 Demo Credentials

The seed data provides 3 role-based accounts ready for testing:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bi.corp` | `Admin123!` | Full enterprise access (Users, Customers, Products, Sales, Reports, AI) |
| **Manager** | `manager@bi.corp` | `Manager123!` | Commercial management (Customers CRUD, Sales Entry, Reports, AI) |
| **Analyst** | `analyst@bi.corp` | `Analyst123!` | Analytics access (Read-only Customers, Reports, AI Copilot) |

> **Tip**: The login screen features a 1-click **Demo Quick-Fill** bar and an interactive **Show/Hide Password** toggle.

---

## 🌟 Feature Suite

### 1. Operations Dashboard (`/`)
- 4 High-impact KPI Stat Cards (Revenue, Orders, Active Clients, Offerings) with trend indicators.
- Quick Date Preset Filters (`All Time`, `30D`, `90D`).
- Interactive Monthly Revenue Velocity Area Chart.
- Top Clients with gradient avatar initials and Top Products by category.
- Recent completed sales ledger with formatted timestamps.

### 2. AI Business Intelligence Copilot (`/ai-assistant`)
- **4 Categorized Intelligence Modules**:
  - 📈 Revenue & Growth Velocity
  - 👥 Customer Intelligence & CRM
  - 📦 Product Catalog & Margins
  - 🏙️ Geographic & Executive Briefing
- **Strict Parameterized Guardrails**: Translates queries into verified read-only PostgreSQL operations with zero arbitrary SQL execution.
- **Rich Intelligence Responses**: Interactive summary KPI chips, structured data tables, and 1-click **Copy Answer** button.

### 3. Sales & Business Reports (`/reports`)
- Executive period summary KPI cards.
- **Monthly Revenue Run-Rate Chart**: Historical revenue momentum and order pacing.
- **Sales by City**: Ranked market badges (🥇 San Francisco, 🥈 Chicago, 🥉 Boston) with custom bar charts.
- **Sales by Category**: Category badges with percentage revenue share progress bars.
- **Customer Purchasing Trends**: Account tiering, 30-day velocity tracking, and status pills (`Growing`, `Decreased`, `Stable`).
- **1-Click CSV Export**: Instant downloads for sales summaries and customer trends.

### 4. Product Catalog & Inventory (`/products`)
- Portfolio KPI cards: Total SKUs, Active Offerings, Verticals, and Average Catalog Price.
- Quick Category Filter Chips: 1-click filtering across Cloud, Software, Cyber, AI, and Services.
- Sortable table columns (`ID`, `Product Name`, `Category`, `Unit Price`).
- Export Catalog CSV functionality.

### 5. Customer Directory & CRM (`/customers` & `/customers/:id`)
- CRM KPI overview cards: Total Accounts, Active Partners, Metro Hubs, and Governance status.
- Quick City Hub filter chips for 10 regional markets.
- Monospace customer code badges with no-wrap protection.
- **Customer Profile View**: Relationship tiers (`Tier 1 Enterprise Partner`, `Growth Client`), lifetime revenue stats, 1-click code copying, and AI Copilot quick prompt card.

---

## 🧪 Testing & Verification

### Run Full Test Suite (83 / 83 Tests Passing)

#### Backend Tests (58 tests across 9 suites):
```bash
cd backend
npm test
```

#### Frontend Tests (25 tests across 6 suites):
```bash
cd frontend
npm test
```

#### Production Build Check:
```bash
cd frontend
npm run build
```

---

## 🛡️ AI Security & Safety Architecture

1. **Zero Arbitrary SQL Execution**: The AI engine never executes arbitrary SQL directly. All requests are strictly mapped to approved, parameterized SQL queries.
2. **Aggregated Data Only**: Only aggregated business numbers (totals, counts, averages) are sent to the AI provider. No passwords, personal contact numbers, or secret tokens are ever exposed.
3. **Backend-Only Secrets**: All API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) remain strictly confidential on the backend server.
4. **Offline Evaluation Mode**: Setting `AI_PROVIDER=mock` allows offline, deterministic intelligence reporting directly from PostgreSQL without requiring active cloud API credits.

For the detailed 10-minute demonstration sequence, refer to [DEMO_GUIDE.md](./DEMO_GUIDE.md).
