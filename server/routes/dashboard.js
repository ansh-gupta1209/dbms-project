/**
 * API: Analytics Dashboard (stat cards, chart data, recent doses)
 */
const router = require('express').Router();
const { pool } = require('../db');
const { wrap } = require('../middleware');

async function one(sql) {
    const [rows] = await pool.query(sql);
    return Number(Object.values(rows[0] || {})[0] || 0);
}

router.get('/', wrap(async (req, res) => {
    const stats = {
        total_citizens: await one('SELECT COUNT(*) FROM Citizens'),
        total_centers:  await one('SELECT COUNT(*) FROM VaccinationCenters'),
        total_vaccines: await one('SELECT COUNT(*) FROM Vaccines'),
        total_doses:    await one('SELECT COUNT(*) FROM Vaccinations'),
        completed:      await one("SELECT COUNT(*) FROM vw_citizen_dose_status WHERE status = 'Fully Vaccinated'"),
        pending:        await one("SELECT COUNT(*) FROM vw_citizen_dose_status WHERE status <> 'Fully Vaccinated'"),
        unvaccinated:   await one('SELECT COUNT(*) FROM Citizens c WHERE NOT EXISTS (SELECT 1 FROM Vaccinations v WHERE v.citizen_id = c.citizen_id)'),
    };

    const [recent] = await pool.query(
        `SELECT citizen_name, vaccine_name, center_name, vaccination_date
         FROM vw_vaccination_details
         ORDER BY vaccination_date DESC, vaccination_id DESC LIMIT 5`
    );

    // Chart data: monthly trend
    const [monthly] = await pool.query(
        `SELECT DATE_FORMAT(MIN(vaccination_date), '%b %Y') AS m, COUNT(*) AS c
         FROM Vaccinations
         GROUP BY DATE_FORMAT(vaccination_date, '%Y-%m')
         ORDER BY DATE_FORMAT(vaccination_date, '%Y-%m')`
    );

    // Chart data: vaccine-wise
    const [vwise] = await pool.query(
        `SELECT vac.vaccine_name, COUNT(v.vaccination_id) AS c
         FROM Vaccines vac
         LEFT JOIN Vaccinations v ON v.vaccine_id = vac.vaccine_id
         GROUP BY vac.vaccine_id, vac.vaccine_name`
    );

    res.json({
        ok: true,
        stats,
        recent,
        months:  monthly.map(r => r.m),
        doses:   monthly.map(r => Number(r.c)),
        vnames:  vwise.map(r => r.vaccine_name),
        vcounts: vwise.map(r => Number(r.c)),
    });
}));

module.exports = router;
