const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AI-Powered Business Intelligence API',
    version: '1.0.0',
    description: `
Executive Customer & Business Intelligence API.
Provides endpoints for CRM, catalog, transactional sales, executive reporting, AI assistant queries, and user administration.

### Roles and Permissions:
- **admin**: Full system access (User management, Customer CRUD + deletion, Product CRUD + deactivation, Sales creation, Reports, AI assistant, Audit logs).
- **manager**: Customer create/read/update, Product create/read/update, Transactional Sales creation, Reports, and AI assistant. Cannot delete customers or manage users.
- **analyst**: Read-only access to Customers, Products, Sales, Dashboard, Reports, and AI assistant.
    `,
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token obtained from /api/auth/login',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'BAD_REQUEST' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'object' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Eleanor Vance' },
          email: { type: 'string', example: 'admin@bi.corp' },
          role: { type: 'string', enum: ['admin', 'manager', 'analyst'], example: 'admin' },
          phone: { type: 'string', nullable: true, example: '+91 98765 43210' },
          department: { type: 'string', nullable: true, example: 'Executive' },
          is_active: { type: 'boolean', example: true },
          last_login_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          customer_code: { type: 'string', example: 'CUST-001' },
          customer_name: { type: 'string', example: 'Acme Global Logistics' },
          email: { type: 'string', example: 'contact@acmelogistics.com' },
          phone: { type: 'string', example: '+91-98201-11001' },
          city: { type: 'string', example: 'Mumbai' },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          sku: { type: 'string', example: 'SFT-004' },
          product_name: { type: 'string', example: 'BI Analytics Suite Pro License' },
          category: { type: 'string', example: 'Enterprise Software' },
          brand: { type: 'string', example: 'Tata' },
          supplier: { type: 'string', example: 'Tata Consultancy Services' },
          unit: { type: 'string', example: 'per seat/yr' },
          unit_price: { type: 'number', format: 'float', example: 1200.00 },
          cost_price: { type: 'number', format: 'float', example: 750.00 },
          stock_quantity: { type: 'integer', example: 25 },
          gst_percent: { type: 'number', format: 'float', example: 18.00 },
          reorder_level: { type: 'integer', example: 10 },
          warranty_months: { type: 'integer', example: 12 },
          description: { type: 'string', example: 'Annual enterprise license seat for business intelligence.' },
          is_active: { type: 'boolean', example: true },
        },
      },
      SaleItem: {
        type: 'object',
        properties: {
          product_id: { type: 'integer', example: 1 },
          quantity: { type: 'integer', example: 2 },
          unit_price: { type: 'number', example: 1200.00 },
          line_total: { type: 'number', example: 2400.00 },
        },
      },
      Sale: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          customer_id: { type: 'integer', example: 1 },
          customer_name: { type: 'string', example: 'Acme Global Logistics' },
          sale_date: { type: 'string', format: 'date', example: '2026-10-13' },
          total_amount: { type: 'number', example: 2400.00 },
          status: { type: 'string', enum: ['completed', 'pending', 'cancelled'], example: 'completed' },
          created_by: { type: 'integer', example: 1 },
        },
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Authenticate user with email and password (rate-limited & lockout protected)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@bi.corp' },
                  password: { type: 'string', example: 'Admin123!' },
                  rememberMe: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with tokens' },
          401: { description: 'Invalid email or password', schema: { $ref: '#/components/schemas/ErrorResponse' } },
          403: { description: 'Account deactivated', schema: { $ref: '#/components/schemas/ErrorResponse' } },
          429: { description: 'Too many failed login attempts; temporary lockout active', schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Submit a password reset request (notifies admin or emails reset link if SMTP is configured)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Generic confirmation returned regardless of whether email exists' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/auth/reset-password-token': {
      post: {
        summary: 'Reset password using an emailed token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 6, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated successfully' },
          400: { description: 'Invalid or expired reset token' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        summary: 'Refresh expired access token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'New token pair generated' },
          401: { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/customers': {
      get: {
        summary: 'List customers with pagination, search, sorting, and filters',
        tags: ['Customers'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'industry', in: 'query', schema: { type: 'string', enum: ['IT Services', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Other'] } },
          { name: 'customer_type', in: 'query', schema: { type: 'string', enum: ['Large Business', 'Small Business', 'Startup', 'Individual'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'on_hold', 'prospect', 'churned'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'created_at' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', default: 'desc' } },
        ],
        responses: {
          200: { description: 'Paginated customer list' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new customer (Admin or Manager)',
        tags: ['Customers'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customer_code', 'customer_name', 'email', 'city'],
                properties: {
                  customer_code: { type: 'string', example: 'CUST-099' },
                  customer_name: { type: 'string', example: 'Vanguard Dynamics' },
                  email: { type: 'string', example: 'contact@vanguard.io' },
                  phone: { type: 'string', example: '9820111099' },
                  city: { type: 'string', example: 'Pune' },
                  status: { type: 'string', enum: ['active', 'inactive', 'on_hold', 'prospect', 'churned'], default: 'active' },
                  industry: { type: 'string', enum: ['IT Services', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Other'] },
                  customer_type: { type: 'string', enum: ['Large Business', 'Small Business', 'Startup', 'Individual'] },
                  contact_person: { type: 'string', example: 'Priya Nair' },
                  state: { type: 'string', example: 'Maharashtra' },
                  gst_number: { type: 'string', example: '27AAACA1234A1Z5' },
                  address: { type: 'string', example: 'Plot 12, Hinjewadi Phase 2, Pune 411057' },
                  notes: { type: 'string', example: 'Strategic enterprise prospect' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Customer created' },
          403: { description: 'Forbidden: Insufficient permissions' },
          409: { description: 'Customer code or email conflict' },
        },
      },
    },
    '/api/customers/{id}': {
      get: {
        summary: 'Get customer profile with lifetime sales metrics',
        tags: ['Customers'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Customer details' },
          404: { description: 'Customer not found' },
        },
      },
      put: {
        summary: 'Update customer details (Admin or Manager)',
        tags: ['Customers'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Customer updated' },
          403: { description: 'Forbidden' },
          404: { description: 'Customer not found' },
        },
      },
      delete: {
        summary: 'Safely delete or deactivate customer (Admin only)',
        tags: ['Customers'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Customer deactivated or deleted' },
          403: { description: 'Forbidden: Admin role required' },
        },
      },
    },
    '/api/products': {
      get: {
        summary: 'List products with filters',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Products list' } },
      },
      post: {
        summary: 'Create a new product (Admin or Manager)',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/api/products/{id}/details': {
      get: {
        summary: 'Get product details with margin, sales metrics, and last 5 sales',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Product details with sales history and margin' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/api/sales': {
      get: {
        summary: 'List sales records with pagination and filters',
        tags: ['Sales'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Sales list' } },
      },
      post: {
        summary: 'Create transactional sale with line items (Admin or Manager)',
        tags: ['Sales'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customer_id', 'items'],
                properties: {
                  customer_id: { type: 'integer', example: 1 },
                  sale_date: { type: 'string', format: 'date', example: '2026-10-13' },
                  status: { type: 'string', enum: ['completed', 'pending'], default: 'completed' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['product_id', 'quantity'],
                      properties: {
                        product_id: { type: 'integer', example: 1 },
                        quantity: { type: 'integer', example: 2 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Sale created atomically' },
          400: { description: 'Validation failed or item invalid (Transaction rolled back)' },
        },
      },
    },
    '/api/sales/{id}': {
      get: {
        summary: 'Get sale details by ID with customer info, line item subtotals, and summary totals',
        tags: ['Sales'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Sale details' },
          404: { description: 'Sale not found' },
        },
      },
    },
    '/api/sales/{id}/status': {
      patch: {
        summary: 'Update sale status (Admin or Manager)',
        tags: ['Sales'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['completed', 'pending', 'cancelled'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Sale status updated' },
          400: { description: 'Invalid status' },
          403: { description: 'Forbidden' },
          404: { description: 'Sale not found' },
        },
      },
    },
    '/api/dashboard/summary': {
      get: {
        summary: 'Executive dashboard KPI cards, period comparisons, charts, and alert datasets',
        tags: ['Dashboard & Reporting'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          {
            name: 'preset',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['all', '7d', '30d', '90d', 'this_month', 'last_month', 'this_quarter', 'this_fy'],
            },
          },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'industry', in: 'query', schema: { type: 'string', enum: ['IT Services', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Other'] } },
          { name: 'customer_type', in: 'query', schema: { type: 'string', enum: ['Large Business', 'Small Business', 'Startup', 'Individual'] } },
          { name: 'granularity', in: 'query', schema: { type: 'string', enum: ['monthly', 'weekly'], default: 'monthly' } },
          { name: 'recentSalesStatus', in: 'query', schema: { type: 'string', enum: ['completed', 'pending', 'cancelled'] } },
          { name: 'topProductsSort', in: 'query', schema: { type: 'string', enum: ['revenue', 'units'], default: 'revenue' } },
          { name: 'topProductsLimit', in: 'query', schema: { type: 'integer', enum: [5, 10], default: 5 } },
          { name: 'topCustomersSort', in: 'query', schema: { type: 'string', enum: ['spent', 'orders'], default: 'spent' } },
          { name: 'topCustomersLimit', in: 'query', schema: { type: 'integer', enum: [5, 10], default: 5 } },
        ],
        responses: {
          200: { description: 'Dashboard summary dataset' },
          400: { description: 'Invalid filter query parameter' },
        },
      },
    },
    '/api/reports/sales': {
      get: {
        summary: 'Comprehensive sales report with multi-dimensional filters, period comparisons, and breakdowns',
        tags: ['Dashboard & Reporting'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          {
            name: 'preset',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['all', '7d', '30d', '90d', 'this_month', 'last_month', 'this_quarter', 'this_fy'],
            },
          },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'industry', in: 'query', schema: { type: 'string', enum: ['IT Services', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Other'] } },
          { name: 'customer_type', in: 'query', schema: { type: 'string', enum: ['Large Business', 'Small Business', 'Startup', 'Individual'] } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'on_hold', 'prospect', 'churned'] } },
          { name: 'granularity', in: 'query', schema: { type: 'string', enum: ['monthly', 'weekly'], default: 'monthly' } },
        ],
        responses: {
          200: { description: 'Filtered sales report dataset with KPIs, period comparison, and chart breakdowns' },
          400: { description: 'Invalid filter query parameter' },
        },
      },
    },
    '/api/reports/customer-insights': {
      get: {
        summary: 'Customer purchasing trends and value tiers (supports report filters)',
        tags: ['Dashboard & Reporting'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'industry', in: 'query', schema: { type: 'string' } },
          { name: 'customer_type', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Customer insights list' },
          400: { description: 'Invalid filter query parameter' },
        },
      },
    },
    '/api/reports/brand-sales': {
      get: {
        summary: 'Report sales aggregated by product brand (supports report filters)',
        tags: ['Dashboard & Reporting'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'industry', in: 'query', schema: { type: 'string' } },
          { name: 'customer_type', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Brand sales dataset with units sold and revenue' },
          400: { description: 'Invalid filter query parameter' },
        },
      },
    },
    '/api/ai/ask': {
      post: {
        summary: 'Ask natural language business questions grounded in verified business records',
        tags: ['AI Business Assistant'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: {
                  question: {
                    type: 'string',
                    example: 'What were total sales last month?',
                    description: 'Natural language business intelligence question (3-500 chars)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Grounded business intelligence response with structured data rows' },
          400: { description: 'Validation failed or question format invalid' },
          401: { description: 'Unauthorized - invalid or missing JWT token' },
          429: { description: 'Rate limit exceeded' },
          503: { description: 'AI provider not configured' },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'List users with search, role/status filters, sorting, and pagination (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 500 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'manager', 'analyst', 'all'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'all'] } },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['name', 'email', 'role', 'department', 'is_active', 'last_login_at', 'created_at'],
              default: 'created_at',
            },
          },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: { description: 'Paginated user list (excluding password hashes)' },
          403: { description: 'Forbidden - Administrator role required' },
        },
      },
      post: {
        summary: 'Create a new user account (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  email: { type: 'string', format: 'email', maxLength: 254 },
                  password: { type: 'string', minLength: 6, maxLength: 128 },
                  role: { type: 'string', enum: ['admin', 'manager', 'analyst'] },
                  phone: { type: 'string', nullable: true, maxLength: 30 },
                  department: { type: 'string', nullable: true, maxLength: 100 },
                  is_active: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User created successfully' },
          400: { description: 'Validation error' },
          403: { description: 'Forbidden - Administrator role required' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get user details by ID (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'User details' },
          404: { description: 'User not found' },
        },
      },
      put: {
        summary: 'Update user profile, role, status, or optional new password (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  email: { type: 'string', format: 'email', maxLength: 254 },
                  password: { type: 'string', minLength: 6, maxLength: 128 },
                  role: { type: 'string', enum: ['admin', 'manager', 'analyst'] },
                  phone: { type: 'string', nullable: true, maxLength: 30 },
                  department: { type: 'string', nullable: true, maxLength: 100 },
                  is_active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User updated' },
          400: { description: 'Validation error or self/last-admin safety rule violation' },
          409: { description: 'Email already exists' },
        },
      },
      delete: {
        summary: 'Delete user account (Admin only; enforces self and last-admin protection)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'User deleted' },
          400: { description: 'Self or last-active-admin protection triggered' },
          409: { description: 'User has associated sales records' },
        },
      },
    },
    '/api/users/{id}/status': {
      patch: {
        summary: 'Activate or deactivate a user account (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['is_active'],
                properties: {
                  is_active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User status updated' },
          400: { description: 'Self or last-active-admin protection triggered' },
        },
      },
    },
    '/api/users/{id}/reset-password': {
      post: {
        summary: 'Generate and set a temporary password for a user (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Temporary password generated and returned once' },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/users/{id}/activity': {
      get: {
        summary: 'Get audit activity logs for a specific user (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'User activity log entries' },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/users/audit-logs': {
      get: {
        summary: 'Get paginated system-wide audit logs (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Audit logs list' },
          403: { description: 'Forbidden - Administrator role required' },
        },
      },
    },
    '/api/users/reset-requests': {
      get: {
        summary: 'List pending password reset requests (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Pending password reset requests' },
          403: { description: 'Forbidden - Administrator role required' },
        },
      },
    },
    '/api/users/reset-requests/{requestId}/complete': {
      post: {
        summary: 'Generate a temporary password for a pending reset request (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'requestId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Temporary password generated and request marked completed' },
          404: { description: 'Reset request not found' },
        },
      },
    },
    '/api/users/reset-requests/{requestId}/dismiss': {
      patch: {
        summary: 'Dismiss a pending password reset request (Admin only)',
        tags: ['User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'requestId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Reset request dismissed' },
          404: { description: 'Pending reset request not found' },
        },
      },
    },
    '/api/health': {
      get: {
        summary: 'System health check and PostgreSQL connectivity',
        tags: ['System'],
        responses: {
          200: { description: 'Service and database healthy' },
          503: { description: 'Service unhealthy' },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

module.exports = { setupSwagger, swaggerDocument };
