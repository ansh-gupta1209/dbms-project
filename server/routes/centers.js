/**
 * API: Vaccination Centers (CRUD + search)
 */
const router = require('express').Router();
const { pool } = require('../db');
const { fail, requireStaff, requireAdmin, run, wrap, str, int } = require('../middleware');

router.get('/', wrap(async (req, res) => {
    const like = `%${str(req.query.q)}%`;
    const [rows] = await pool.execute(
        `SELECT vc.center_id, vc.center_name, vc.district, vc.state, COUNT(v.vaccination_id) AS total_vaccinations
         FROM VaccinationCenters vc
         LEFT JOIN Vaccinations v ON v.center_id = vc.center_id
         WHERE vc.center_name LIKE ? OR vc.district LIKE ? OR vc.state LIKE ?
         GROUP BY vc.center_id, vc.center_name, vc.district, vc.state
         ORDER BY vc.center_id`,
        [like, like, like]
    );
    res.json({ ok: true, rows });
}));

router.get('/:id', wrap(async (req, res) => {
    const [rows] = await pool.execute('SELECT * FROM VaccinationCenters WHERE center_id = ?', [int(req.params.id)]);
    res.json({ ok: true, row: rows[0] || null });
}));

const canModify = requireStaff('You do not have permission to modify centers.');

function validate(body) {
    const name = str(body.center_name), district = str(body.district), state = str(body.state);
    return { valid: name !== '' && district !== '' && state !== '', name, district, state };
}
const invalidMsg = 'Please fill all center fields.';

router.post('/', canModify, wrap(async (req, res) => {
    const { valid, name, district, state } = validate(req.body);
    if (!valid) return fail(req, res, invalidMsg);
    await run(req, res, 'INSERT INTO VaccinationCenters (center_name, district, state) VALUES (?, ?, ?)',
        [name, district, state], 'Center added successfully.');
}));

router.put('/:id', canModify, wrap(async (req, res) => {
    const { valid, name, district, state } = validate(req.body);
    if (!valid) return fail(req, res, invalidMsg);
    await run(req, res, 'UPDATE VaccinationCenters SET center_name=?, district=?, state=? WHERE center_id=?',
        [name, district, state, int(req.params.id)], 'Center updated successfully.');
}));

router.delete('/:id', canModify, requireAdmin('Only administrators can delete centers.'), wrap(async (req, res) => {
    await run(req, res, 'DELETE FROM VaccinationCenters WHERE center_id=?', [int(req.params.id)], 'Center deleted.');
}));

module.exports = router;
