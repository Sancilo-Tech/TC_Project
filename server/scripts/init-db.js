// Sets up the database: `npm run db:init`. Safe to run again at any time;
// it only adds what is missing and never changes existing data.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const config = require('../config');
const { hashPassword } = require('../auth');

const sqlFile = name => fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'db', name), 'utf8');

async function createDatabaseIfMissing() {
  const name = config.db.database;
  const client = new Client({ ...config.db, database: 'postgres' });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (rowCount) return console.log(`Database "${name}" already exists.`);
    await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
    console.log(`Created database "${name}".`);
  } finally {
    await client.end();
  }
}

async function main() {
  await createDatabaseIfMissing();

  const db = new Client(config.db);
  await db.connect();
  try {
    await db.query(sqlFile('schema.sql'));
    console.log('Tables are ready.');

    // Only seed an empty table: options without a parent are not covered by the
    // unique constraint (NULLs never collide), so seeding twice would duplicate them.
    const options = await db.query('SELECT COUNT(*)::int AS n FROM dropdown_options');
    if (options.rows[0].n === 0) {
      await db.query(sqlFile('seed_dropdowns.sql'));
      console.log('Loaded the default dropdown options.');
    }

    const users = await db.query('SELECT COUNT(*)::int AS n FROM users');
    if (users.rows[0].n === 0) {
      const username = (process.env.ADMIN_USERNAME || '').trim();
      if (!username || !process.env.ADMIN_PASSWORD) {
        throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD in .env to create the first admin, then run this again.');
      }
      const hash = await hashPassword(process.env.ADMIN_PASSWORD);
      await db.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')", [username, hash]);
      console.log(`Created the first admin user "${username}".`);
    }
  } finally {
    await db.end();
  }
  console.log('Done.');
}

main().catch(err => {
  console.error(`Database setup failed: ${err.message}`);
  process.exit(1);
});
