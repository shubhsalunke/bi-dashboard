# Demonstration Guide

This guide describes how to run and present the Business Intelligence Dashboard.

---

## 1. System Overview

This application is a business intelligence dashboard for tracking sales, customers, and products:
- Customers: View customer records, contact info, and purchase history.
- Products: Manage product catalog items, categories, and unit prices.
- Sales: Record and inspect orders with line items.
- Reports: View monthly sales trends, city breakdowns, and category revenue.
- AI Assistant: Ask questions in plain language and receive answers backed by database queries.

---

## 2. Technology Stack

- Frontend: React 19, Vite, React Router, Recharts, Lucide, CSS.
- Backend: Node.js, Express.js, PostgreSQL (`pg`), Joi, JSON Web Tokens.
- Database: PostgreSQL 16 in a Docker container (`bi_postgres`).
- Testing: Vitest with 83 automated tests (58 backend, 25 frontend).

---

## 3. Starting the Project

### Step 1: Start PostgreSQL

```bash
docker start bi_postgres
```

### Step 2: Start Backend Server

```bash
cd backend
npm run dev
```

The backend starts at `http://localhost:5000`.

### Step 3: Start Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

The frontend starts at `http://localhost:5173`.

---

## 4. Demo Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| Admin | admin@bi.corp | Admin123! | Full access including User Management |
| Manager | manager@bi.corp | Manager123! | Add and edit customers, products, and sales |
| Analyst | analyst@bi.corp | Analyst123! | Read-only access to records and reports |

---

## 5. Walkthrough Steps

### Step 1: Login and Role Differences
1. Open `http://localhost:5173/login`.
2. Click the quick button for Analyst (`analyst@bi.corp`) and sign in.
3. Show that the navigation bar reflects analyst permissions (read-only access).
4. Sign out and log in as Manager (`manager@bi.corp`) to show write access.

### Step 2: Dashboard Overview
1. Navigate to `/`.
2. Review the summary cards: Total Revenue, Total Orders, Customer Accounts, and Catalog Offerings.
3. Review the monthly revenue trend chart.
4. Show the top products and top clients tables.

### Step 3: Customers and Catalog
1. Navigate to `/customers`.
2. Search for a customer by company name or code.
3. Filter by city (for example, Pune or Mumbai).
4. Click a customer name to open their detail view and past order history.
5. Navigate to `/products` to show active products and unit prices in rupees.

### Step 4: Creating a Sale
1. Navigate to `/sales`.
2. Click "New Sale".
3. Select a customer, date, product, and quantity.
4. Note that prices appear formatted in rupees.
5. Submit the form to record the order.
6. Click the view button next to the new sale to open the item breakdown modal.

### Step 5: Reports and CSV Export
1. Navigate to `/reports`.
2. View the Sales Summary tab showing monthly revenue and city revenue bars.
3. Click "Export CSV" to demonstrate report downloading.
4. Switch to the Customer Trends tab to show customer spending tiers and trend badges.

### Step 6: AI Assistant
1. Navigate to `/ai-assistant`.
2. Click one of the sample question buttons:
   - "What were total sales last month?"
   - "Show the top 10 customers by sales."
   - "Give me city-wise sales for the last three months."
3. Point out that answers display formatted rupee values and structured data tables.
4. Test safety handling by submitting a non-business question or an invalid query to show that arbitrary SQL commands are rejected.

### Step 7: Automated Tests
1. In the `backend` folder, run `npm test`. Show that all 58 tests pass.
2. In the `frontend` folder, run `npm test`. Show that all 25 tests pass.
3. Open `http://localhost:5000/api/docs` to show the Swagger API documentation.
