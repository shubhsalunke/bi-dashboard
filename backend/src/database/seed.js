const bcrypt = require('bcryptjs');
const { pool, getClient } = require('../config/db');

async function seedDatabase() {
  console.log('--------------------------------------------------');
  console.log('🌱 Starting Clean Database Seeding (Curated 5 Records)');
  console.log('--------------------------------------------------');

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Clean existing data for deterministic idempotency
    await client.query('TRUNCATE sale_items, sales, products, customers, audit_logs, users RESTART IDENTITY CASCADE');

    // 1. Seed Users (5 Clean Enterprise Users)
    console.log('  👤 Seeding Users (5 Clean Users)...');
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const managerHash = await bcrypt.hash('Manager123!', 10);
    const analystHash = await bcrypt.hash('Analyst123!', 10);

    const usersSql = `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES 
        ('Eleanor Vance', 'admin@bi.corp', $1, 'admin', true),
        ('Marcus Brody', 'manager@bi.corp', $2, 'manager', true),
        ('Sofia Chen', 'analyst@bi.corp', $3, 'analyst', true),
        ('David Miller', 'operations@bi.corp', $2, 'manager', true),
        ('Aria Sharma', 'insights@bi.corp', $3, 'analyst', true)
      RETURNING id, name, email, role;
    `;
    const userRes = await client.query(usersSql, [adminHash, managerHash, analystHash]);
    const users = userRes.rows;
    console.log(`     Inserted ${users.length} users`);

    // 2. Seed Exactly 5 Clean Customers
    console.log('  🏢 Seeding Customers (5 curated enterprise clients)...');
    const customerList = [
      ['CUST-001', 'Acme Logistics India', 'contact@acmelogistics.in', '+91-22-2555-0101', 'Mumbai', 'active'],
      ['CUST-002', 'Tata FinTech Solutions', 'billing@tatafintech.in', '+91-20-2555-0102', 'Pune', 'active'],
      ['CUST-003', 'Reliance Health Analytics', 'ops@reliancehealth.in', '+91-712-2555-0103', 'Nagpur', 'active'],
      ['CUST-004', 'Infosys Cloud Systems', 'admin@infosyscloud.in', '+91-40-2555-0104', 'Hyderabad', 'active'],
      ['CUST-005', 'Mahindra Tech Systems', 'contact@mahindratech.in', '+91-11-2555-0105', 'Delhi', 'active'],
    ];

    const customerInsertSql = `
      INSERT INTO customers (customer_code, customer_name, email, phone, city, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, customer_code, customer_name, city;
    `;
    const customers = [];
    for (const c of customerList) {
      const res = await client.query(customerInsertSql, c);
      customers.push(res.rows[0]);
    }
    console.log(`     Inserted ${customers.length} customers`);

    // 3. Seed Exactly 5 Clean Products
    console.log('  📦 Seeding Products (5 curated items)...');
    const productList = [
      ['Cloud Virtual Server Node', 'Cloud Infrastructure', 450.00, true, 'SKU-CLD-001', 280.00, 45, 'Scalable multi-core cloud compute instance for production workloads.', 'Tata', 'Tata Communications Ltd', 'per instance/mo', 18.00, 15, 12],
      ['Managed Cloud Database Cluster Dedicated', 'Cloud Infrastructure', 650.00, true, 'SKU-DB-002', 420.00, 20, 'High-availability PostgreSQL cluster with automated backups.', 'Infosys', 'Infosys Cloud Platforms', 'per cluster/mo', 18.00, 10, 24],
      ['Object Storage Tier 1 (10TB)', 'Cloud Infrastructure', 220.00, true, 'SKU-STR-003', 130.00, 85, 'Durable distributed object storage with high throughput.', 'Reliance', 'Reliance Jio Data Infra', 'per 10TB/mo', 18.00, 25, 12],
      ['Business Analytics Pro License', 'Enterprise Software', 1200.00, true, 'SKU-SFT-004', 750.00, 8, 'Annual enterprise seat for advanced business intelligence and reporting.', 'Mahindra', 'Mahindra Tejas Tech', 'per user/yr', 18.00, 10, 12],
      ['AI Customer Analytics Integration', 'Analytics & AI', 2800.00, true, 'SKU-AI-011', 1700.00, 0, 'Conversational customer engagement and tier-1 issue resolution bot.', 'Bharat', 'Bharat AI Innovations', 'per deployment', 18.00, 5, 24],
    ];

    const productInsertSql = `
      INSERT INTO products (
        product_name, category, unit_price, is_active, sku, cost_price, stock_quantity, description,
        brand, supplier, unit, gst_percent, reorder_level, warranty_months
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, product_name, category, unit_price, sku, cost_price, stock_quantity, description, brand, supplier, unit, gst_percent, reorder_level, warranty_months;
    `;
    const products = [];
    for (const p of productList) {
      const res = await client.query(productInsertSql, p);
      products.push(res.rows[0]);
    }
    console.log(`     Inserted ${products.length} products`);

    // 4. Seed Exactly 5 Sales & Sale Items
    console.log('  💰 Seeding Sales & Sale Items (5 curated sales)...');
    const salesData = [
      {
        customerIndex: 0, // Acme Global Logistics
        date: '2026-06-15',
        status: 'completed',
        items: [
          { productIndex: 0, quantity: 2 }, // 2 * 450 = 900
          { productIndex: 3, quantity: 1 }, // 1 * 1200 = 1200
        ],
      },
      {
        customerIndex: 1, // Apex FinTech Solutions
        date: '2026-07-20',
        status: 'completed',
        items: [
          { productIndex: 4, quantity: 2 }, // 2 * 2800 = 5600
          { productIndex: 1, quantity: 1 }, // 1 * 650 = 650
        ],
      },
      {
        customerIndex: 2, // Beacon Health Analytics
        date: '2026-08-18',
        status: 'completed',
        items: [
          { productIndex: 3, quantity: 2 }, // 2 * 1200 = 2400
          { productIndex: 2, quantity: 5 }, // 5 * 220 = 1100
        ],
      },
      {
        customerIndex: 3, // BlueSky Cloud Inc
        date: '2026-09-22',
        status: 'completed',
        items: [
          { productIndex: 4, quantity: 1 }, // 1 * 2800 = 2800
          { productIndex: 0, quantity: 4 }, // 4 * 450 = 1800
        ],
      },
      {
        customerIndex: 4, // Horizon Tech Systems
        date: '2026-10-10',
        status: 'completed',
        items: [
          { productIndex: 1, quantity: 2 }, // 2 * 650 = 1300
          { productIndex: 2, quantity: 2 }, // 2 * 220 = 440
          { productIndex: 3, quantity: 1 }, // 1 * 1200 = 1200
        ],
      },
    ];

    let salesCount = 0;
    let saleItemsCount = 0;

    for (let i = 0; i < salesData.length; i++) {
      const s = salesData[i];
      const customer = customers[s.customerIndex];
      const creator = users[i % users.length];

      let totalAmount = 0;
      const itemsForSale = [];

      for (const item of s.items) {
        const prod = products[item.productIndex];
        const unitPrice = parseFloat(prod.unit_price);
        const lineTotal = +(item.quantity * unitPrice).toFixed(2);
        totalAmount += lineTotal;
        itemsForSale.push({
          product_id: prod.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
        });
      }

      totalAmount = +totalAmount.toFixed(2);

      const saleInsertRes = await client.query(
        `INSERT INTO sales (customer_id, sale_date, total_amount, status, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [customer.id, s.date, totalAmount, s.status, creator.id]
      );
      const saleId = saleInsertRes.rows[0].id;
      salesCount++;

      for (const item of itemsForSale) {
        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [saleId, item.product_id, item.quantity, item.unit_price, item.line_total]
        );
        saleItemsCount++;
      }
    }

    console.log(`     Inserted ${salesCount} sales records with ${saleItemsCount} line items`);

    // 5. Seed initial audit log record
    await client.query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        users[0].id,
        users[0].email,
        'SYSTEM_SEED',
        'DATABASE',
        1,
        JSON.stringify({ seeded: { users: users.length, customers: customers.length, products: products.length, sales: salesCount } }),
      ]
    );

    await client.query('COMMIT');
    console.log('--------------------------------------------------');
    console.log('🎉 Clean database seeding completed successfully!');
    console.log('--------------------------------------------------');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database seeding failed, transaction rolled back:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
