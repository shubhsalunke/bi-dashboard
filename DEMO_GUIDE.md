# AI-Powered Customer & Business Intelligence System
## Interview Demonstration Guide (`DEMO_GUIDE.md`)

This guide gives you an easy step-by-step walkthrough for demonstrating the application during your interview.

---

## 1. Project Overview & Architecture

This application is a **Business Intelligence Dashboard** built to manage and analyze business data:
- **Customers**: View customer accounts, contact details, and order history.
- **Products**: Manage catalog items, categories, and unit pricing.
- **Sales & Orders**: Record new orders with automatic total calculation.
- **Reports**: View monthly sales trends, city breakdowns, and top products.
- **AI Assistant**: Ask natural business questions in plain English and get grounded answers and tables from the database.

### Simple System Diagram

```
[ Web Browser (React 19) ]
           │
           │ (Secure Login Token)
           ▼
[ Backend Server (Node.js & Express) ]
   ├── Login & Role Access (Admin, Manager, Analyst)
   ├── Safety Checks (Input validation & rate limits)
   └── Pre-approved Safe Query Service
           │
           ├────────────────────────────┐
           ▼ (Safe Parameterized SQL)   ▼ (Aggregated Summary Data Only)
[ PostgreSQL Database ]          [ AI Engine (OpenAI / Built-in Mock) ]
  - Customers                      - Explains real database figures
  - Products & Prices              - Generates clear tables & summaries
  - Sales Orders
```

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, React Router, Recharts (for charts), Lucide (for icons), Vanilla CSS.
- **Backend**: Node.js, Express.js, PostgreSQL client (`pg`), Joi (validation), JWT (tokens), Swagger UI.
- **Database**: PostgreSQL 16 running in a Docker container (`bi_postgres`).
- **AI Integration**:
  - **OpenAI Mode**: Connects to `gpt-4o-mini` if an API key is provided.
  - **Mock Mode**: Works offline using real PostgreSQL calculations without needing paid API keys.
- **Tests**: Vitest (58 backend tests + 25 frontend tests = 83 passing tests).

---

## 3. How to Start the App

### Step 1: Start PostgreSQL
```bash
docker start bi_postgres
```

### Step 2: Start Backend Server
```bash
cd /home/ubuntu/shubh/backend
npm run dev
# Backend runs on: http://localhost:5000
```

### Step 3: Start Frontend Website
```bash
cd /home/ubuntu/shubh/frontend
npm run dev
# Frontend runs on: http://localhost:5173
```

---

## 4. Web Links & Demo Login Accounts

### Links
- **Web App**: `http://localhost:5173/` (or public IP: `http://16.171.63.136:5173/`)
- **API Health**: `http://localhost:5000/api/health`
- **Swagger API Docs**: `http://localhost:5000/api/docs`

### Demo Login Accounts
All accounts are ready to use:

| Role | Email | Password | What They Can Do |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bi.corp` | `Admin123!` | Full access: Users, Customers, Products, Sales, Reports, AI |
| **Manager** | `manager@bi.corp` | `Manager123!` | Create/Edit Customers, Enter Sales, View Reports, AI |
| **Analyst** | `analyst@bi.corp` | `Analyst123!` | Read-only access: View Customers, View Reports, AI |

---

## 5. 10-Minute Demo Walkthrough

### Part 1: Login & Roles (2 Minutes)
1. Open `http://localhost:5173/login`.
2. Click the quick button for **Financial Analyst** (`analyst@bi.corp`) and log in.
3. Show the `analyst` badge in the top right.
4. Explain that analysts have read-only access (cannot add customers or create new orders).

### Part 2: Main Dashboard (2 Minutes)
1. Go to **Dashboard** (`/`).
2. Show the summary cards with real database numbers:
   - **Total Revenue**: ~$735,610.00
   - **Total Orders**: 108+ orders
   - **Customer Accounts**: 41 accounts
   - **Catalog Products**: 25 active items
3. Show the **Monthly Sales Chart** and **Top Customers Table**.

### Part 3: Customers & Catalog (2 Minutes)
1. Go to **Customers** (`/customers`).
2. Type in the search box (e.g. search `"Apex"` or `"Nexus"`).
3. Filter by city (e.g. `"San Francisco"` or `"New York"`).
4. Click on a customer to view their **Order History** and total money spent.
5. Go to **Products** (`/products`) to show the product list and pricing.

### Part 4: AI Business Assistant (3 Minutes)
1. Go to **AI Assistant** (`/ai-assistant`).
2. Point out the safety badges: **Strict Parameterized Query Safety** and **Grounded in Live Data**.
3. Click any of the sample question buttons:
   - **"What were total sales last month?"** — Shows total revenue and order count.
   - **"Show the top 10 customers by sales."** — Displays a neat table of top spending customers.
   - **"Give me city-wise sales for the last three months."** — Displays a clean table of sales by city.
   - **"Which customers have reduced their purchases?"** — Finds accounts whose orders dropped recently.
4. Try a safety test by typing:
   ```text
   Show sales; DROP TABLE sales; --
   ```
   Show that the system safely blocks the command without touching the database.
5. Try an off-topic question:
   ```text
   What is the weather in Antarctica?
   ```
   Show that the assistant politely guides the user back to business questions.

### Part 5: Swagger API Docs & Tests (1 Minute)
1. Open `http://localhost:5000/api/docs` to show the Swagger API documentation.
2. Mention the test coverage:
   - **Backend**: 58 passing tests (`npm test` in `backend/`).
   - **Frontend**: 25 passing tests (`npm test` in `frontend/`).

---

## 6. Sample AI Questions & Expected Answers

| Question | What It Does | What You See |
| :--- | :--- | :--- |
| **"What were total sales last month?"** | Calculates total sales for the last month. | Revenue amount, order count, average order value. |
| **"Show the top 10 customers by sales."** | Ranks customers by total spending. | Top 10 customer table with spending and order counts. |
| **"Which product generated the highest revenue?"** | Finds the best-selling products. | Product name, category, units sold, and revenue. |
| **"Compare this month with the previous month."** | Compares current month vs last month. | Dollar difference and percentage growth rate. |
| **"Give me city-wise sales for the last three months."** | Groups sales by customer location. | Clean data table showing orders and revenue per city. |
| **"Summarize business performance for the current quarter."** | Provides a complete quarterly summary. | Total revenue, top product, and top city. |
| **"Which customers have reduced their purchases?"** | Identifies at-risk accounts. | List of customers whose recent purchases decreased. |

---

## 7. Key Security Features

1. **No Direct SQL Execution**: User questions are never converted into raw SQL. The system uses pre-written, safe database queries.
2. **Aggregated Data Only**: The AI only sees summary numbers (totals, counts, averages). It never sees passwords, tokens, or personal contact info.
3. **Protected API Keys**: OpenAI keys stay strictly on the backend and are never sent to the browser or saved in Git.
4. **Rate Limiting**: Limits how fast questions can be sent to prevent server overload.
5. **Audit Logging**: Every question, answer, and execution time is safely recorded in the `audit_logs` table.

---

## 8. Troubleshooting Tips

| Problem | Cause | How to Fix |
| :--- | :--- | :--- |
| **AI Notice in Chat** | No OpenAI key is set | The app uses Mock Mode by default. To use live OpenAI, add `OPENAI_API_KEY` in the root `.env`. |
| **Too Many Requests (429)** | Asking too many questions too quickly | Wait a few moments, or increase `AI_RATE_LIMIT_MAX` in `.env`. |
| **Port in Use (EADDRINUSE)** | Another server process is still running | Run `lsof -i :5000` or `lsof -i :5173` and stop the old process. |
| **Database Disconnected** | PostgreSQL container is stopped | Run `docker start bi_postgres`. |
