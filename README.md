# AI-Powered Customer & Business Intelligence System

An enterprise-grade Customer & Business Intelligence platform featuring a relational PostgreSQL database, an Express.js REST API with JWT authentication and Role-Based Access Control (RBAC), a React 19 analytics dashboard, and a secure AI Business Intelligence Assistant.

---

## Architecture Overview

```
                      ┌───────────────────────────┐
                      │    React 19 Dashboard     │
                      │  (Vite, Recharts, Lucide) │
                      └─────────────┬─────────────┘
                                    │ (JWT Bearer Auth)
                                    ▼
                      ┌───────────────────────────┐
                      │    Express.js REST API    │
                      │  (Helmet, CORS, Joi, RBAC)│
                      └──────┬─────────────┬──────┘
                             │             │
        (Approved Aggregations)             │ (Sanitized Context)
                             │             │
                             ▼             ▼
              ┌────────────────────┐ ┌───────────────────┐
              │     PostgreSQL     │ │    AI Provider    │
              │  (Docker Container)│ │ (OpenAI / Mock)   │
              └────────────────────┘ └───────────────────┘
```

---

## Technology Stack

- **Frontend**: React 19, Vite 8, React Router 7, Recharts, Lucide React, Vanilla CSS Design System.
- **Backend**: Node.js v20+, Express.js, `pg` connection pool, Joi validation, bcryptjs, jsonwebtoken, Helmet, CORS, Swagger UI.
- **Database**: PostgreSQL 16 on Docker container `bi_postgres` with migration tracking and synthetic enterprise seed data.
- **AI Integration**: OpenAI API (`gpt-4o-mini`) + deterministic ground-truth Mock engine for offline/test environments.
- **Testing**: Vitest, React Testing Library, Supertest.

---

## Quick Start Guide

### 1. Database
Ensure the `bi_postgres` container is running:
```bash
docker start bi_postgres
```

### 2. Backend
```bash
cd backend
npm install
npm run dev
```
The backend starts on `http://localhost:5000` with API routes mounted under `/api`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

---

## Test Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bi.corp` | `Admin123!` | Full access (Users, Customers, Products, Sales, Reports, AI) |
| **Manager** | `manager@bi.corp` | `Manager123!` | Customers CRUD, Sales Entry, Reports, AI |
| **Analyst** | `analyst@bi.corp` | `Analyst123!` | Read-only Customers, Reports, AI |

---

## Testing & Verification

### Run Backend Tests (58 tests across 9 suites)
```bash
cd backend
npm test
```

### Run Frontend Tests (25 tests across 6 suites)
```bash
cd frontend
npm test
```

### Run Frontend Production Build
```bash
cd frontend
npm run build
```

### Run Live HTTP Regression Checks
```bash
cd backend
node verify_live.js
node verify_ai_live.js
```

---

## AI Assistant Security Principles

1. **Zero Arbitrary SQL Execution**: The model is never permitted to write or execute arbitrary SQL. Requests are mapped to 7 authorized parameterized database operations.
2. **Aggregated Data Only**: Only aggregated figures (counts, revenues, averages) are sent to the AI provider. No passwords, tokens, or customer personal contact info are exposed.
3. **Backend-Only Credentials**: The `OPENAI_API_KEY` is maintained exclusively on the backend server.
4. **Offline Evaluation Mode**: Setting `AI_PROVIDER=mock` enables evaluation using deterministic ground-truth calculations from PostgreSQL without requiring paid API credits.

For the detailed 10-minute demonstration sequence, refer to [DEMO_GUIDE.md](./DEMO_GUIDE.md).
