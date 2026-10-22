/**
 * API: Approved Vaccines & Dosing Rules (CRUD + search)
 */
const router = require('express').Router();
const { pool } = require('../db');
const { fail, requireStaff, requireAdmin, run, wrap, str, int } = require('../middleware');

router.get('/', wrap(async (req, res) => {
    const like = `%${str(req.query.q)}%`;
    const [rows] = await pool.execute(
        `SELECT vac.vaccine_id, vac.vaccine_name, vac.manufacturer, vac.doses_required, COUNT(v.vaccination_id) AS doses_administered
         FROM Vaccines vac
         LEFT JOIN Vaccinations v ON v.vaccine_id = vac.vaccine_id
         WHERE vac.vaccine_name LIKE ? OR vac.manufacturer LIKE ?
         GROUP BY vac.vaccine_id, vac.vaccine_name, vac.manufacturer, vac.doses_required
         ORDER BY vac.vaccine_id`,
        [like, like]
    );
    res.json({ ok: true, rows });
}));

router.get('/:id', wrap(async (req, res) => {
    const [rows] = await pool.execute('SELECT * FROM Vaccines WHERE vaccine_id = ?', [int(req.params.id)]);
    res.json({ ok: true, row: rows[0] || null });
}));

const canModify = requireStaff('You do not have permission to modify vaccines.');

function validate(body) {
    const name = str(body.vaccine_name), manufacturer = str(body.manufacturer), doses = int(body.doses_required);
    return { valid: name !== '' && manufacturer !== '' && doses >= 1 && doses <= 4, name, manufacturer, doses };
}
const invalidMsg = 'Fill all fields. Doses required must be between 1 and 4.';

router.post('/', canModify, wrap(async (req, res) => {
    const { valid, name, manufacturer, doses } = validate(req.body);
    if (!valid) return fail(req, res, invalidMsg);
    await run(req, res, 'INSERT INTO Vaccines (vaccine_name, manufacturer, doses_required) VALUES (?, ?, ?)',
        [name, manufacturer, doses], 'Vaccine added successfully.');
}));

router.put('/:id', canModify, wrap(async (req, res) => {
    const { valid, name, manufacturer, doses } = validate(req.body);
    if (!valid) return fail(req, res, invalidMsg);
    await run(req, res, 'UPDATE Vaccines SET vaccine_name=?, manufacturer=?, doses_required=? WHERE vaccine_id=?',
        [name, manufacturer, doses, int(req.params.id)], 'Vaccine updated successfully.');
}));

router.delete('/:id', canModify, requireAdmin('Only administrators can delete vaccines.'), wrap(async (req, res) => {
    await run(req, res, 'DELETE FROM Vaccines WHERE vaccine_id=?', [int(req.params.id)], 'Vaccine deleted.');
}));

module.exports = router;
