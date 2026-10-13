const fs = require('fs');
const path = require('path');
const { pool, query, getClient } = require('../config/db');

async function runMigrations() {
  console.log('--------------------------------------------------');
  console.log('🔄 Starting Database Migrations');
  console.log('--------------------------------------------------');

  const client = await getClient();

  try {
    // 1. Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch already executed migrations
    const executedRes = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC');
    const executedMigrations = new Set(executedRes.rows.map((r) => r.name));

    // 3. Locate migration files
    const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration file(s) in: ${migrationsDir}`);

    let appliedCount = 0;

    for (const file of migrationFiles) {
      if (executedMigrations.has(file)) {
        console.log(`  ⏭️  Skipping [${file}] (already applied)`);
        continue;
      }

      console.log(`  ▶️  Applying [${file}]...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute migration in a dedicated transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✅ Successfully applied [${file}]`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Error applying migration [${file}]:`, err.message);
        throw err;
      }
    }

    console.log('--------------------------------------------------');
    console.log(`🎉 Migrations complete! Applied: ${appliedCount}, Total tracked: ${executedMigrations.size + appliedCount}`);
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
