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
docker run -d --name bi_postgres -p 5432:5432 \
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

## Running Tests

### Backend Tests

Runs 58 automated unit and integration tests:

```bash
cd backend
npm test
```

### Frontend Tests

Runs 25 automated component and page tests:

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
