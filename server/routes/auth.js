const express = require('express');
const { pool } = require('../db');
const { httpError } = require('../http');
const { hashPassword, checkPassword, signToken, requireAuth } = require('../auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = req.body?.password ?? '';

  const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
  const user = rows[0];
  if (!user || !(await checkPassword(password, user.password_hash))) {
    throw httpError(401, 'Invalid username or password');
  }

  const { password_hash, ...profile } = user;
  res.json({ token: signToken(user), user: profile });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// Change the signed-in user's own password
router.post('/password', requireAuth, async (req, res) => {
  const hash = await hashPassword(req.body?.password);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
  res.status(204).end();
});

module.exports = router;
