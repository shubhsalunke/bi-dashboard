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
          is_active: { type: 'boolean', example: true },
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
          product_name: { type: 'string', example: 'BI Analytics Suite Pro License' },
          category: { type: 'string', example: 'Enterprise Software' },
          unit_price: { type: 'number', format: 'float', example: 1200.00 },
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
        summary: 'Authenticate user with email and password',
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
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with tokens' },
          401: { description: 'Invalid credentials or inactive account', schema: { $ref: '#/components/schemas/ErrorResponse' } },
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
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
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
                  phone: { type: 'string', example: '+91-98201-11099' },
                  city: { type: 'string', example: 'Pune' },
                  status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
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
    '/api/dashboard/summary': {
      get: {
        summary: 'Executive dashboard KPI cards and top performer analytics',
        tags: ['Dashboard & Reporting'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Dashboard summary dataset' } },
      },
    },
    '/api/reports/sales': {
      get: {
        summary: 'Comprehensive sales report by month, city, and category',
        tags: ['Dashboard & Reporting'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Sales report dataset' } },
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
