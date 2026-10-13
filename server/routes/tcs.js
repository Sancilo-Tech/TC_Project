const express = require('express');
const { pool, insertRow, updateRow } = require('../db');
const { httpError, pick } = require('../http');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

const DATE_FIELDS = ['dob', 'admission_date', 'leaving_date', 'application_date'];
const FIELDS = [
  'tc_number', 'id_number', 'student_name', 'father_name', 'mother_name', 'guardian_name',
  'parent_name', 'gender', 'nationality', 'religion', 'community', 'caste', 'dob', 'dob_words',
  'admission_date', 'study_period', 'leaving_date', 'class_at_leaving', 'medium', 'umis_number',
  'promotion_status', 'application_date', 'reason', 'conduct', 'college_id',
];

// A date input left empty arrives as '', which PostgreSQL rejects for a DATE column
function tcValues(body) {
  const values = pick(body, FIELDS);
  for (const f of DATE_FIELDS) {
    if (values[f] === '') values[f] = null;
  }
  return values;
}

// TCs issued before the prefix became configurable are stored as "TC/2026/003"
// and print with the college abbreviation in front ("PAC/TC/2026/003").
// Keep in step with printedTCNumber in src/lib/tc.ts.
const LEGACY_TC_NUMBER = /^TC\/\d{4}\/\d+$/;

function printedTCNumber(tc_number, collegeName) {
  if (!collegeName || !LEGACY_TC_NUMBER.test(tc_number)) return tc_number;
  const abbr = collegeName.split(' ').map(w => w[0]).join('').toUpperCase();
  return `${abbr}/${tc_number}`;
}

async function assertTCNumberFree(tc_number, excludeId) {
  const legacy = tc_number.slice(tc_number.indexOf('/') + 1);
  const { rows } = await pool.query(
    `SELECT t.id, t.tc_number, c.name AS college_name
       FROM tc_records t
       LEFT JOIN colleges c ON c.id = t.college_id
      WHERE t.tc_number = ANY($1)`,
    [[tc_number, legacy]]
  );
  for (const row of rows) {
    if (row.id === excludeId) continue;
    if (printedTCNumber(row.tc_number, row.college_name) === tc_number) {
      throw httpError(409, `T.C. No. ${tc_number} is already issued.`);
    }
  }
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tc_records ORDER BY created_at DESC');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tc_records WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw httpError(404, 'TC record not found.');
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const values = tcValues(req.body);
  if (!values.tc_number) throw httpError(400, 'T.C. No. is required.');
  await assertTCNumberFree(values.tc_number);
  res.status(201).json(await insertRow('tc_records', values));
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const values = tcValues(req.body);
  if (values.tc_number) await assertTCNumberFree(values.tc_number, id);
  const tc = await updateRow('tc_records', id, values);
  if (!tc) throw httpError(404, 'TC record not found.');
  res.json(tc);
});

router.put('/:id/download-count', async (req, res) => {
  await pool.query('UPDATE tc_records SET download_count = $1 WHERE id = $2', [
    req.body?.download_count,
    req.params.id,
  ]);
  res.status(204).end();
});

router.get('/:id/download-logs', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM tc_download_logs WHERE tc_id = $1 ORDER BY download_count ASC',
    [req.params.id]
  );
  res.json(rows);
});

router.post('/:id/download-logs', async (req, res) => {
  await pool.query('INSERT INTO tc_download_logs (tc_id, download_count, reason) VALUES ($1, $2, $3)', [
    req.params.id,
    req.body?.download_count,
    req.body?.reason,
  ]);
  res.status(204).end();
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM tc_records WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
