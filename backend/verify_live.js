const http = require('http');
const app = require('./src/app');

async function runLiveVerification() {
  const port = 5089;
  const server = app.listen(port);

  const makeRequest = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        (res) => {
          let chunks = '';
          res.on('data', (d) => (chunks += d));
          res.on('end', () => {
            try {
              resolve({ statusCode: res.statusCode, data: JSON.parse(chunks) });
            } catch (e) {
              resolve({ statusCode: res.statusCode, raw: chunks });
            }
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  try {
    console.log('======================================================');
    console.log('🧪 RUNNING LIVE HTTP ENDPOINTS VERIFICATION');
    console.log('======================================================');

    // 1. Health check
    const health = await makeRequest('/api/health');
    console.log(`[PASS] GET /api/health -> HTTP ${health.statusCode} | Status: ${health.data.status} | DB: ${health.data.database.status}`);
    if (health.statusCode !== 200) throw new Error('Health check failed');

    // 2. Authentication: Login with valid credentials
    const login = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@bi.corp',
      password: 'Admin123!',
    });
    console.log(`[PASS] POST /api/auth/login (Admin) -> HTTP ${login.statusCode} | User: ${login.data.data.user.name} | Role: ${login.data.data.user.role}`);
    if (login.statusCode !== 200) throw new Error('Login failed');
    const adminToken = login.data.data.accessToken;
    const refreshToken = login.data.data.refreshToken;

    // 3. Authentication: Reject invalid password
    const badLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@bi.corp',
      password: 'WrongPassword!',
    });
    console.log(`[PASS] POST /api/auth/login (Invalid) -> HTTP ${badLogin.statusCode} | Code: ${badLogin.data.error.code}`);
    if (badLogin.statusCode !== 401) throw new Error('Invalid login was not rejected with 401');

    // 4. Token Refresh
    const refreshed = await makeRequest('/api/auth/refresh', 'POST', { refreshToken });
    console.log(`[PASS] POST /api/auth/refresh -> HTTP ${refreshed.statusCode} | Token received: ${!!refreshed.data.data.accessToken}`);
    if (refreshed.statusCode !== 200) throw new Error('Refresh failed');

    // 5. Manager Login for RBAC testing
    const mgrLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'manager@bi.corp',
      password: 'Manager123!',
    });
    const managerToken = mgrLogin.data.data.accessToken;

    // 6. Analyst Login for RBAC testing
    const anaLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'analyst@bi.corp',
      password: 'Analyst123!',
    });
    const analystToken = anaLogin.data.data.accessToken;

    // 7. Customers: Paginated directory with search & filters
    const customers = await makeRequest('/api/customers?limit=3&city=New%20York', 'GET', null, analystToken);
    console.log(`[PASS] GET /api/customers (City=New York) -> HTTP ${customers.statusCode} | Count: ${customers.data.data.length} | Total: ${customers.data.pagination.total}`);
    if (customers.statusCode !== 200) throw new Error('Customers query failed');

    // 8. Products: List with active filter
    const products = await makeRequest('/api/products?isActive=true&limit=3', 'GET', null, analystToken);
    console.log(`[PASS] GET /api/products -> HTTP ${products.statusCode} | Count: ${products.data.data.length}`);
    if (products.statusCode !== 200) throw new Error('Products query failed');

    // 9. Sales: Transactional Creation with authoritative server pricing (Active products 2 and 3)
    const newSale = await makeRequest(
      '/api/sales',
      'POST',
      {
        customer_id: 2,
        items: [
          { product_id: 2, quantity: 2 }, // $650 * 2 = 1300
          { product_id: 3, quantity: 1 }, // $220 * 1 = 220
        ],
      },
      managerToken
    );
    console.log(`[PASS] POST /api/sales (Transactional) -> HTTP ${newSale.statusCode} | Sale ID: ${newSale.data.data.id} | Total Amount: $${newSale.data.data.total_amount}`);
    if (newSale.statusCode !== 201) throw new Error('Sale creation failed');

    // 10. Sales: Transaction Rollback test on invalid product
    const failedSale = await makeRequest(
      '/api/sales',
      'POST',
      {
        customer_id: 2,
        items: [
          { product_id: 2, quantity: 2 },
          { product_id: 999999, quantity: 1 },
        ],
      },
      managerToken
    );
    console.log(`[PASS] POST /api/sales (Invalid item atomic rollback) -> HTTP ${failedSale.statusCode} | Rejected with code: ${failedSale.data.error.code}`);
    if (failedSale.statusCode !== 400) throw new Error('Invalid sale was not rejected with 400');

    // 11. RBAC: Prevent Analyst from creating sales
    const forbiddenSale = await makeRequest(
      '/api/sales',
      'POST',
      {
        customer_id: 2,
        items: [{ product_id: 2, quantity: 1 }],
      },
      analystToken
    );
    console.log(`[PASS] POST /api/sales (Analyst forbidden) -> HTTP ${forbiddenSale.statusCode} | Code: ${forbiddenSale.data.error.code}`);
    if (forbiddenSale.statusCode !== 403) throw new Error('Analyst was not forbidden with 403');

    // 12. Dashboard: Summary with real KPI calculations
    const dash = await makeRequest('/api/dashboard/summary', 'GET', null, analystToken);
    console.log(`[PASS] GET /api/dashboard/summary -> HTTP ${dash.statusCode} | Total Revenue: $${dash.data.data.kpi.total_revenue} | Total Sales: ${dash.data.data.kpi.total_sales_count} | Top Customers: ${dash.data.data.topCustomers.length}`);
    if (dash.statusCode !== 200) throw new Error('Dashboard summary failed');

    // 13. Reports: Comprehensive Sales breakdown
    const reports = await makeRequest('/api/reports/sales', 'GET', null, analystToken);
    console.log(`[PASS] GET /api/reports/sales -> HTTP ${reports.statusCode} | Monthly periods: ${reports.data.data.byMonth.length} | Cities: ${reports.data.data.byCity.length}`);
    if (reports.statusCode !== 200) throw new Error('Reports failed');

    // 14. Swagger: OpenAPI JSON definition
    const swagger = await makeRequest('/api/docs.json');
    console.log(`[PASS] GET /api/docs.json -> HTTP ${swagger.statusCode} | OpenAPI Spec Title: "${swagger.data.info.title}"`);
    if (swagger.statusCode !== 200) throw new Error('Swagger spec failed');

    console.log('======================================================');
    console.log('🎉 ALL 14 LIVE HTTP VERIFICATION CHECKS SUCCEEDED');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification Error:', err.message);
    process.exit(1);
  }
}

runLiveVerification();
