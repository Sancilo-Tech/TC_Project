const express = require('express');
const { pool } = require('../db');
const { httpError } = require('../http');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

// ?category= and ?parent= are both optional filters
router.get('/', async (req, res) => {
  const { category, parent } = req.query;
  const where = [];
  const params = [];
  if (category !== undefined) { params.push(category); where.push(`category = $${params.length}`); }
  if (parent !== undefined)   { params.push(parent);   where.push(`parent = $${params.length}`); }

  const { rows } = await pool.query(
    `SELECT * FROM dropdown_options
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY category, sort_order ASC, value ASC`,
    params
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const category = String(req.body?.category ?? '').trim();
  const value = String(req.body?.value ?? '').trim();
  if (!category || !value) throw httpError(400, 'Category and value are required.');

  const { rows } = await pool.query(
    `INSERT INTO dropdown_options (category, value, parent, sort_order)
     VALUES ($1, $2, $3, 999)
     RETURNING *`,
    [category, value, req.body.parent || null]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM dropdown_options WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
