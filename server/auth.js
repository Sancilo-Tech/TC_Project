const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { pool } = require('./db');
const { httpError } = require('./http');

const TOKEN_LIFETIME = '7d';
const MIN_PASSWORD_LENGTH = 6;

// The columns the frontend is allowed to see (never password_hash)
const USER_COLUMNS = 'id, username, role, created_by, created_at';

function hashPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw httpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return bcrypt.hash(password, 10);
}

const checkPassword = (password, hash) => bcrypt.compare(String(password), hash);

const signToken = user => jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: TOKEN_LIFETIME });

// Requires a valid login token and loads the user fresh from the database,
// so a deleted user or a changed role takes effect on the very next request.
async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw httpError(401, 'Please sign in.');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw httpError(401, 'Your session has expired. Please sign in again.');
  }

  const { rows } = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [payload.sub]);
  if (!rows[0]) throw httpError(401, 'Your session has expired. Please sign in again.');
  req.user = rows[0];
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') throw httpError(403, 'Only an admin can do this.');
  next();
}

module.exports = { USER_COLUMNS, hashPassword, checkPassword, signToken, requireAuth, requireAdmin };
