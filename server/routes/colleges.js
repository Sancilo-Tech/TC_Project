const express = require('express');
const { pool, insertRow, updateRow } = require('../db');
const { httpError, pick } = require('../http');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

const FIELDS = ['name', 'trust_name', 'affiliation', 'address', 'logo_url'];

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM colleges ORDER BY name ASC');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM colleges WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw httpError(404, 'College not found.');
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const values = pick(req.body, FIELDS);
  if (!String(values.name ?? '').trim()) throw httpError(400, 'College name is required');
  res.status(201).json(await insertRow('colleges', values));
});

router.put('/:id', async (req, res) => {
  const college = await updateRow('colleges', req.params.id, pick(req.body, FIELDS));
  if (!college) throw httpError(404, 'College not found.');
  res.json(college);
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM colleges WHERE id = $1', [req.params.id]);
  } catch (err) {
    if (err.code === '23503') throw httpError(409, 'This college has TC records, so it cannot be deleted.');
    throw err;
  }
  res.status(204).end();
});

module.exports = router;
