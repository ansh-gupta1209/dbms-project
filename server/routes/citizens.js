/**
 * API: Citizen Master Registry (CRUD + search)
 */
const router = require('express').Router();
const { pool } = require('../db');
const { fail, requireStaff, requireAdmin, run, wrap, str, int } = require('../middleware');

router.get('/', wrap(async (req, res) => {
    const like = `%${str(req.query.q)}%`;
    const [rows] = await pool.execute(
        `SELECT c.citizen_id, c.citizen_name, c.aadhaar_no, c.mobile,
                COUNT(v.vaccination_id) AS doses_taken
         FROM Citizens c
         LEFT JOIN Vaccinations v ON v.citizen_id = c.citizen_id
         WHERE c.citizen_name LIKE ? OR c.aadhaar_no LIKE ? OR c.mobile LIKE ?
         GROUP BY c.citizen_id, c.citizen_name, c.aadhaar_no, c.mobile
         ORDER BY c.citizen_id`,
        [like, like, like]
    );
    res.json({ ok: true, rows });
}));

router.get('/:id', wrap(async (req, res) => {
    const [rows] = await pool.execute('SELECT * FROM Citizens WHERE citizen_id = ?', [int(req.params.id)]);
    res.json({ ok: true, row: rows[0] || null });
}));

const canModify = requireStaff('You do not have permission to modify records.');

function validate(body) {
    const name = str(body.citizen_name), aadhaar = str(body.aadhaar_no), mobile = str(body.mobile);
    const valid = name !== '' && /^[0-9]{12}$/.test(aadhaar) && /^[6-9][0-9]{9}$/.test(mobile);
    return { valid, name, aadhaar, mobile };
}
const invalidMsg = 'Enter a name, a 12-digit Aadhaar number and a valid 10-digit mobile starting with 6-9.';

router.post('/', canModify, wrap(async (req, res) => {
    const { valid, name, aadhaar, mobile } = validate(req.body);
    if (!valid) return fail(req, res, invalidMsg);
    await run(req, res, 'INSERT INTO Citizens (citizen_name, aadhaar_no, mobile) VALUES (?, ?, ?)',
        [name, aadhaar, mobile], 'Citizen added successfully.');
}));

router.put('/:id', canModify, wrap(async (req, res) => {
    const { valid, name, aadhaar, mobile } = validate(req.body);
    if (!valid) return fail(req, res, invalidMsg);
    await run(req, res, 'UPDATE Citizens SET citizen_name=?, aadhaar_no=?, mobile=? WHERE citizen_id=?',
        [name, aadhaar, mobile, int(req.params.id)], 'Citizen updated successfully.');
}));

router.delete('/:id', canModify, requireAdmin('Only administrators can delete records.'), wrap(async (req, res) => {
    await run(req, res, 'DELETE FROM Citizens WHERE citizen_id=?', [int(req.params.id)],
        'Citizen deleted (vaccination records removed too).');
}));

module.exports = router;
