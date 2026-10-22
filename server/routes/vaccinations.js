/**
 * API: Inoculation Ledger (record / edit / delete doses)
 * The trigger trg_vaccinations_before_insert blocks extra doses beyond doses_required.
 */
const router = require('express').Router();
const { pool } = require('../db');
const { fail, requireStaff, requireAdmin, run, wrap, str, int, validDate } = require('../middleware');

// Dropdown data for the "Record a Vaccination Dose" form
router.get('/options', wrap(async (req, res) => {
    const [citizens] = await pool.query('SELECT citizen_id, citizen_name, mobile FROM Citizens ORDER BY citizen_name');
    const [vaccines] = await pool.query('SELECT vaccine_id, vaccine_name, doses_required FROM Vaccines ORDER BY vaccine_name');
    const [centers]  = await pool.query('SELECT center_id, center_name, district FROM VaccinationCenters ORDER BY center_name');
    res.json({ ok: true, citizens, vaccines, centers });
}));

router.get('/', wrap(async (req, res) => {
    const like = `%${str(req.query.q)}%`;
    const [rows] = await pool.execute(
        `SELECT v.vaccination_id, c.citizen_name, vac.vaccine_name,
                CONCAT((SELECT COUNT(*) FROM Vaccinations x
                        WHERE x.citizen_id = v.citizen_id AND x.vaccine_id = v.vaccine_id
                          AND (x.vaccination_date < v.vaccination_date
                               OR (x.vaccination_date = v.vaccination_date AND x.vaccination_id <= v.vaccination_id))),
                       ' of ', vac.doses_required) AS dose,
                vc.center_name, vc.district, v.vaccination_date
         FROM Vaccinations v
         JOIN Citizens c            ON c.citizen_id = v.citizen_id
         JOIN Vaccines vac          ON vac.vaccine_id = v.vaccine_id
         JOIN VaccinationCenters vc ON vc.center_id = v.center_id
         WHERE c.citizen_name LIKE ? OR vac.vaccine_name LIKE ? OR vc.center_name LIKE ?
         ORDER BY v.vaccination_date DESC, v.vaccination_id DESC`,
        [like, like, like]
    );
    res.json({ ok: true, rows });
}));

router.get('/:id', wrap(async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT v.vaccination_id, v.center_id, v.vaccination_date, c.citizen_name, vac.vaccine_name
         FROM Vaccinations v
         JOIN Citizens c   ON c.citizen_id = v.citizen_id
         JOIN Vaccines vac ON vac.vaccine_id = v.vaccine_id
         WHERE v.vaccination_id = ?`,
        [int(req.params.id)]
    );
    res.json({ ok: true, row: rows[0] || null });
}));

const canModify = requireStaff('You do not have permission to record or update vaccinations.');

router.post('/', canModify, wrap(async (req, res) => {
    const citizen = int(req.body.citizen_id), vaccine = int(req.body.vaccine_id), center = int(req.body.center_id);
    const date = str(req.body.vaccination_date);
    if (citizen <= 0 || vaccine <= 0 || center <= 0 || !validDate(date)) {
        return fail(req, res, 'Please select a citizen, vaccine, center and a valid date (cannot be in the future).');
    }
    await run(req, res,
        'INSERT INTO Vaccinations (citizen_id, vaccine_id, center_id, vaccination_date) VALUES (?, ?, ?, ?)',
        [citizen, vaccine, center, date], 'Vaccination dose recorded successfully.');
}));

// Only center and date can be changed, preserving integrity
router.put('/:id', canModify, wrap(async (req, res) => {
    const id = int(req.params.id), center = int(req.body.center_id), date = str(req.body.vaccination_date);
    if (id <= 0 || center <= 0 || !validDate(date)) {
        return fail(req, res, 'Select a center and a valid date (not in the future).');
    }
    await run(req, res, 'UPDATE Vaccinations SET center_id=?, vaccination_date=? WHERE vaccination_id=?',
        [center, date, id], 'Vaccination record updated.');
}));

router.delete('/:id', canModify, requireAdmin('Only administrators can delete vaccination records.'), wrap(async (req, res) => {
    await run(req, res, 'DELETE FROM Vaccinations WHERE vaccination_id=?', [int(req.params.id)], 'Vaccination record deleted.');
}));

module.exports = router;
