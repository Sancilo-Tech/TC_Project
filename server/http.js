// An error whose message is safe to show to the user, with the HTTP status to send
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Copies only the listed keys out of a request body
function pick(body, fields) {
  const out = {};
  for (const f of fields) {
    if (body && body[f] !== undefined) out[f] = body[f];
  }
  return out;
}

// Every response the frontend treats as a failure is `{ error: "<message>" }`
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ error: err.message });

  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  const code = typeof err.code === 'string' ? err.code : '';
  if (code === '23505') return res.status(409).json({ error: 'That value already exists.' });
  if (code === '23503') {
    return res.status(409).json({ error: 'This is still used by other records, so it cannot be deleted.' });
  }
  // Bad input (wrong date format, text too long, missing required value, ...)
  if (code.startsWith('22') || code === '23502' || code === '23514') {
    return res.status(400).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: 'Server error. Please try again.' });
}

module.exports = { httpError, pick, errorHandler };
