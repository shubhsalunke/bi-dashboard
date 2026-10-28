# Business Intelligence Dashboard

A full-stack business intelligence application built with React, Node.js, Express, and PostgreSQL. It includes user authentication, role-based access control, sales reporting, customer management, and an AI assistant for querying data.

---

## Architecture

- **Frontend**: React 19 single-page application built with Vite. Uses React Router for navigation and Recharts for charts.
- **Backend**: Express.js REST API with JWT authentication and role-based permissions.
- **Database**: PostgreSQL 16 database running in Docker.
- **AI Service**: Natural language question answering using parameterized database queries. Supports OpenAI or an offline mock provider.

---

## Project Structure

```
bi-dashboard/
├── backend/          # Express API server and database migrations
├── frontend/         # React application
└── database/         # Database seed files
```

---

## Prerequisites

- Node.js (version 20 or higher)
- npm
- Docker

---

## Setup and Installation

### 1. Start the PostgreSQL Database

Start the PostgreSQL container:

```bash
docker run -d --name bi_postgres -p 127.0.0.1:5432:5432 \
  -e POSTGRES_DB=business_intelligence \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16
```

If the container already exists from an earlier run:

```bash
docker start bi_postgres
```

### 2. Configure Backend Environment

Copy the example environment file:

```bash
cp .env.example .env
```

The default values work out of the box for local development. To use OpenAI for the assistant, add your API key in `.env`. Otherwise, leave `AI_PROVIDER=mock`.

### 3. Install Backend Dependencies and Run Migrations

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

The backend server runs on `http://localhost:5000`.

### 4. Install Frontend Dependencies and Start Server

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend application runs on `http://localhost:5173`.

---

## Login Credentials

The seed data provides three user accounts with different roles:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| Admin | admin@bi.corp | Admin123! | Full access, including user management |
| Manager | manager@bi.corp | Manager123! | Can create and edit customers, products, and sales |
| Analyst | analyst@bi.corp | Analyst123! | Read-only access to dashboard, reports, and AI assistant |

---

## Features

- **Dashboard**: Displays revenue totals, order counts, monthly revenue line charts, top products, and recent orders.
- **Customer Directory**: Lists customer accounts with search, city filters, and status filters. Shows customer detail views and order history.
- **Product Catalog**: Lists products with categories and prices. Allows adding and editing products.
- **Sales Orders**: Lists past sales orders. Managers and admins can record new orders with multiple line items.
- **Reports**: Summarizes revenue by month, city, and category. Displays customer purchasing trends and supports CSV export.
- **AI Assistant**: Answers business questions in plain text using parameterized SQL queries. Shows summary numbers and data tables.
- **User Management**: Admins can manage user roles and view system audit logs.

---

## AI Assistant Dynamic SQL Safety

When `AI_DYNAMIC_SQL=true` is enabled, questions that do not match predefined reporting intents can be dynamically answered via Gemini-generated SQL through multi-layered safety guardrails:

1. **Restricted Database Views**: Queries can only access four views (`ai_customers`, `ai_products`, `ai_sales`, `ai_sale_items`). The `users` and `audit_logs` tables, as well as customer contact info (`email`, `phone`), are not exposed and remain unreachable.
2. **Dedicated Read-Only Role**: Executed exclusively through a separate connection pool using the `ai_readonly` database role with `SELECT` permissions granted only on the four views.
3. **AST SQL Parser Validation**: Validated before execution using `node-sql-parser`:
   - Exactly one statement, `SELECT` or `WITH...SELECT` only.
   - Strictly rejects all other tables, schemas, or system catalogs.
   - Prohibits dangerous functions (e.g. `pg_sleep`, `pg_read_file`, `dblink`), allowing only common aggregate, string, and date functions.
   - Automatically appends `LIMIT 100` if missing, or caps existing limits to 100.
4. **Statement Timeout**: Enforces a 5000 ms statement timeout to block runaway queries.
5. **Audit Logging & Grounding**: Every generated query is logged in the system audit trail, and explanations are strictly grounded in the returned database rows.

---

## Running Tests

### Backend Tests

Runs 80 automated unit, security, and integration tests:

```bash
cd backend
npm test
```

### Frontend Tests

Runs 26 automated component and page tests:

```bash
cd frontend
npm test
```

### Production Build

Builds the frontend for production:

```bash
cd frontend
npm run build
```

---

## API Documentation

Swagger API documentation is available at `http://localhost:5000/api/docs` while the backend server is running.
