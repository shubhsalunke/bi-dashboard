const bcrypt = require('bcryptjs');
const { pool, getClient } = require('../config/db');

async function seedDatabase() {
  console.log('--------------------------------------------------');
  console.log('🌱 Starting Synthetic Database Seeding');
  console.log('--------------------------------------------------');

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Clean existing data for deterministic idempotency
    await client.query('TRUNCATE sale_items, sales, products, customers, audit_logs, users RESTART IDENTITY CASCADE');

    // 1. Seed Users
    console.log('  👤 Seeding Users (Admin, Manager, Analyst)...');
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const managerHash = await bcrypt.hash('Manager123!', 10);
    const analystHash = await bcrypt.hash('Analyst123!', 10);

    const usersSql = `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES 
        ('Eleanor Vance', 'admin@bi.corp', $1, 'admin', true),
        ('Marcus Brody', 'manager@bi.corp', $2, 'manager', true),
        ('Sofia Chen', 'analyst@bi.corp', $3, 'analyst', true)
      RETURNING id, name, email, role;
    `;
    const userRes = await client.query(usersSql, [adminHash, managerHash, analystHash]);
    const users = userRes.rows;
    console.log(`     Inserted ${users.length} users`);

    // 2. Seed Customers (30 realistic enterprise/SMB clients across 8 cities)
    console.log('  🏢 Seeding Customers (30 companies)...');
    const customerList = [
      ['CUST-001', 'Acme Global Logistics', 'contact@acmelogistics.com', '+1-212-555-0101', 'New York', 'active'],
      ['CUST-002', 'Apex FinTech Solutions', 'billing@apexfintech.io', '+1-415-555-0102', 'San Francisco', 'active'],
      ['CUST-003', 'Beacon Health Analytics', 'ops@beaconhealth.org', '+1-312-555-0103', 'Chicago', 'active'],
      ['CUST-004', 'BlueSky SaaS Inc', 'admin@blueskycloud.net', '+1-512-555-0104', 'Austin', 'active'],
      ['CUST-005', 'Cascade Energy Corp', 'procure@cascadeenergy.com', '+1-206-555-0105', 'Seattle', 'active'],
      ['CUST-006', 'Catalyst BioSciences', 'lab@catalystbio.com', '+1-617-555-0106', 'Boston', 'active'],
      ['CUST-007', 'Coastal Logistics Group', 'support@coastallog.com', '+1-305-555-0107', 'Miami', 'active'],
      ['CUST-008', 'Crestline Capital Partners', 'deals@crestlinecap.com', '+1-212-555-0108', 'New York', 'active'],
      ['CUST-009', 'Delta Stream Media', 'tech@deltastream.com', '+1-310-555-0109', 'Los Angeles', 'active'],
      ['CUST-010', 'Elevate Retail Systems', 'orders@elevateretail.com', '+1-312-555-0110', 'Chicago', 'active'],
      ['CUST-011', 'Frontier Robotics Lab', 'info@frontierrob.io', '+1-206-555-0111', 'Seattle', 'active'],
      ['CUST-012', 'Horizon Cloud Services', 'it@horizonclouds.net', '+1-415-555-0112', 'San Francisco', 'active'],
      ['CUST-013', 'Ironclad Security Labs', 'ops@ironcladsec.com', '+1-512-555-0113', 'Austin', 'active'],
      ['CUST-014', 'Keystone Manufacturing', 'supply@keystonemfg.com', '+1-214-555-0114', 'Dallas', 'active'],
      ['CUST-015', 'Lighthouse Education Tech', 'admin@lighthouseed.org', '+1-617-555-0115', 'Boston', 'active'],
      ['CUST-016', 'Matrix AI Labs', 'founders@matrixailabs.com', '+1-415-555-0116', 'San Francisco', 'active'],
      ['CUST-017', 'Nexus Supply Chain', 'freight@nexussupply.com', '+1-303-555-0117', 'Denver', 'active'],
      ['CUST-018', 'OmniPay Payment Gateway', 'gateway@omnipaycorp.com', '+1-212-555-0118', 'New York', 'active'],
      ['CUST-019', 'Pinnacle Aerospace Systems', 'procure@pinnacleaero.com', '+1-206-555-0119', 'Seattle', 'active'],
      ['CUST-020', 'Quantum Medical Diagnostics', 'contact@quantummed.org', '+1-312-555-0120', 'Chicago', 'active'],
      ['CUST-021', 'Redwood Data Storage', 'support@redwooddata.com', '+1-415-555-0121', 'San Francisco', 'active'],
      ['CUST-022', 'Silverline Insurance Group', 'claims@silverlineins.com', '+1-214-555-0122', 'Dallas', 'active'],
      ['CUST-023', 'Solstice Energy Networks', 'green@solsticeenergy.com', '+1-303-555-0123', 'Denver', 'active'],
      ['CUST-024', 'Summit Wealth Management', 'wealth@summitwm.com', '+1-212-555-0124', 'New York', 'active'],
      ['CUST-025', 'Titanium Heavy Industries', 'heavy@titaniumind.com', '+1-312-555-0125', 'Chicago', 'active'],
      ['CUST-026', 'Vanguard Mobility Labs', 'fleet@vanguardmob.com', '+1-512-555-0126', 'Austin', 'active'],
      ['CUST-027', 'Vertex Biotechnology', 'research@vertexbio.net', '+1-617-555-0127', 'Boston', 'active'],
      ['CUST-028', 'Zephyr Global Trading', 'trade@zephyrtrade.com', '+1-305-555-0128', 'Miami', 'active'],
      ['CUST-029', 'Legacy Retail Distribution', 'closed@legacyretail.com', '+1-214-555-0129', 'Dallas', 'inactive'],
      ['CUST-030', 'OldTown Printing Services', 'inquiry@oldtownprint.com', '+1-303-555-0130', 'Denver', 'inactive'],
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

    // 3. Seed Products (15 diverse SaaS, Cloud, Cybersecurity and Consulting offerings)
    console.log('  📦 Seeding Products (15 items)...');
    const productList = [
      ['Enterprise Cloud Compute Node', 'Cloud Infrastructure', 450.00, true],
      ['Managed PostgreSQL Cluster Dedicated', 'Cloud Infrastructure', 650.00, true],
      ['Object Storage Tier 1 (10TB)', 'Cloud Infrastructure', 220.00, true],
      ['BI Analytics Suite Pro License', 'Enterprise Software', 1200.00, true],
      ['Customer Data Platform (CDP)', 'Enterprise Software', 2400.00, true],
      ['Workflow Automator Enterprise', 'Enterprise Software', 850.00, true],
      ['Zero Trust Network Gateway', 'Cybersecurity', 1500.00, true],
      ['Endpoint Detection & Response (EDR)', 'Cybersecurity', 950.00, true],
      ['Threat Intelligence Real-time Feed', 'Cybersecurity', 1800.00, true],
      ['Predictive Sales Forecast Engine', 'Analytics & AI', 3200.00, true],
      ['AI Customer Copilot Integration', 'Analytics & AI', 2800.00, true],
      ['Real-time Data Warehouse Connector', 'Analytics & AI', 750.00, true],
      ['Enterprise Cloud Migration Consulting', 'Professional Services', 5000.00, true],
      ['Custom BI Dashboard Implementation', 'Professional Services', 3500.00, true],
      ['24/7 Dedicated SLA Support Package', 'Professional Services', 1500.00, true],
    ];

    const productInsertSql = `
      INSERT INTO products (product_name, category, unit_price, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, product_name, category, unit_price;
    `;
    const products = [];
    for (const p of productList) {
      const res = await client.query(productInsertSql, p);
      products.push(res.rows[0]);
    }
    console.log(`     Inserted ${products.length} products`);

    // 4. Seed 90 Sales and corresponding Sale Items transactionally over the past 6 months
    console.log('  💰 Seeding Sales & Sale Items (90 sales spanning 6 months)...');
    
    // Seed sales distributed across the last 180 days
    const now = new Date();
    let salesCount = 0;
    let saleItemsCount = 0;

    for (let i = 0; i < 90; i++) {
      // Pick random active customer
      const activeCustomers = customers.filter(c => c.id <= 28);
      const customer = activeCustomers[i % activeCustomers.length];
      const creator = users[i % users.length];

      // Date spread over 180 days
      const daysAgo = Math.floor((i * 2) % 180);
      const saleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const saleDateStr = saleDate.toISOString().split('T')[0];

      // Select 1 to 3 items for this sale
      const numItems = (i % 3) + 1;
      const itemsForSale = [];
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const prod = products[(i + j * 3) % products.length];
        const qty = ((i + j) % 4) + 1;
        const unitPrice = parseFloat(prod.unit_price);
        const lineTotal = +(qty * unitPrice).toFixed(2);
        totalAmount += lineTotal;
        itemsForSale.push({
          product_id: prod.id,
          quantity: qty,
          unit_price: unitPrice,
          line_total: lineTotal,
        });
      }

      totalAmount = +totalAmount.toFixed(2);
      const status = i % 15 === 0 ? 'pending' : 'completed';

      // Insert sale
      const saleInsertRes = await client.query(
        `INSERT INTO sales (customer_id, sale_date, total_amount, status, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [customer.id, saleDateStr, totalAmount, status, creator.id]
      );
      const saleId = saleInsertRes.rows[0].id;
      salesCount++;

      // Insert sale items
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
    console.log('🎉 Synthetic database seeding completed successfully!');
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
