const express = require('express');
const { pool } = require('../db');
const { httpError } = require('../http');
const { USER_COLUMNS, hashPassword, requireAuth, requireAdmin } = require('../auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

function readUsernameAndRole(body) {
  const username = String(body?.username ?? '').trim();
  const role = body?.role;
  if (!username) throw httpError(400, 'Username is required.');
  if (role !== 'admin' && role !== 'user') throw httpError(400, 'Role must be admin or user.');
  return { username, role };
}

// Usernames are unique ignoring case (see idx_users_username)
const usernameTaken = err => (err.code === '23505' ? httpError(409, 'Username already exists') : err);

// There is no dashboard to fall back on, so never let the last admin be removed
async function assertNotLastAdmin(userId) {
  const { rows } = await pool.query("SELECT id FROM users WHERE role = 'admin'");
  if (rows.length === 1 && rows[0].id === userId) {
    throw httpError(400, 'This is the only admin. Make another user an admin first.');
  }
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC`);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { username, role } = readUsernameAndRole(req.body);
  const hash = await hashPassword(req.body.password);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING ${USER_COLUMNS}`,
      [username, hash, role, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    throw usernameTaken(err);
  }
});

router.put('/:id', async (req, res) => {
  const { username, role } = readUsernameAndRole(req.body);
  if (role !== 'admin') await assertNotLastAdmin(req.params.id);
  // A blank password means "keep the current one"
  const hash = req.body.password ? await hashPassword(req.body.password) : null;
  try {
    const { rows } = await pool.query(
      `UPDATE users
          SET username = $1, role = $2, password_hash = COALESCE($3, password_hash)
        WHERE id = $4
        RETURNING ${USER_COLUMNS}`,
      [username, role, hash, req.params.id]
    );
    if (!rows[0]) throw httpError(404, 'User not found.');
    res.json(rows[0]);
  } catch (err) {
    throw usernameTaken(err);
  }
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) throw httpError(400, 'You cannot delete your own account.');
  await assertNotLastAdmin(req.params.id);
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
