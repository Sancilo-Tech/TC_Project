const { Pool, types } = require('pg');
const config = require('./config');

// Return DATE columns as plain 'YYYY-MM-DD' text. The default turns them into
// JS Dates at local midnight, which shifts the day once serialised as UTC.
types.setTypeParser(types.builtins.DATE, v => v);

const pool = new Pool(config.db);

// Idle connections are dropped when PostgreSQL restarts (e.g. during a Windows
// update). Without a listener that error would crash the server; with one the
// pool simply opens fresh connections on the next request.
pool.on('error', err => console.error(`Database connection lost: ${err.message}`));

// `table` and the keys of `values` are put into the SQL as-is, so they must
// come from a fixed column list in the route, never straight from a request.
async function insertRow(table, values) {
  const cols = Object.keys(values);
  const { rows } = await pool.query(
    `INSERT INTO ${table} (${cols.join(', ')})
     VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
     RETURNING *`,
    Object.values(values)
  );
  return rows[0];
}

async function updateRow(table, id, values) {
  const cols = Object.keys(values);
  if (!cols.length) {
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return rows[0];
  }
  const { rows } = await pool.query(
    `UPDATE ${table}
        SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(', ')}
      WHERE id = $${cols.length + 1}
      RETURNING *`,
    [...Object.values(values), id]
  );
  return rows[0];
}

module.exports = { pool, insertRow, updateRow };
