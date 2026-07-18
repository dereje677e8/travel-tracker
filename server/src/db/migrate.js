import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
}

async function run() {
  // A dedicated connection with multipleStatements enabled - unlike the
  // shared app pool (pool.js), which deliberately leaves this off since
  // application queries build SQL from user input. Migration files are
  // trusted, developer-authored SQL, so a file with several semicolon-
  // separated ALTER/CREATE statements can run as written.
  const conn = await mysql.createConnection({
    host: env.db.host, port: env.db.port, user: env.db.user, password: env.db.password,
    database: env.db.database, multipleStatements: true, dateStrings: true,
  });
  try {
    await ensureMigrationsTable(conn);
    const [applied] = await conn.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(applied.map((r) => r.filename));

    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.info('Skipping already-applied migration', { file });
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      logger.info('Applying migration', { file });
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
    }

    logger.info('Migrations complete');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  logger.error('Migration failed', { error: err.message });
  process.exit(1);
});
