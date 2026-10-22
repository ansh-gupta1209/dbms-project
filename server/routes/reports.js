/**
 * API: The 7 canonical SQL reports for DBMS evaluation
 */
const router = require('express').Router();
const { pool } = require('../db');
const { wrap } = require('../middleware');

const reports = [
    {
        title: 'Dose Status of Every Citizen (View: vw_citizen_dose_status)',
        desc:  'Calculates doses received vs required and computes vaccination status using SQL CASE expression.',
        icon:  'fa-user-check',
        sql:   `SELECT citizen_name, vaccine_name, doses_taken, doses_required, status
                FROM vw_citizen_dose_status ORDER BY citizen_name`,
    },
    {
        title: 'Citizens with Pending Doses',
        desc:  'Identifies partially vaccinated individuals needing follow-up doses (GROUP BY + HAVING).',
        icon:  'fa-hourglass-half',
        sql:   `SELECT c.citizen_name, c.mobile, vac.vaccine_name,
                       vac.doses_required - COUNT(*) AS doses_pending
                FROM Vaccinations v
                JOIN Citizens c   ON c.citizen_id = v.citizen_id
                JOIN Vaccines vac ON vac.vaccine_id = v.vaccine_id
                GROUP BY c.citizen_id, c.citizen_name, c.mobile, vac.vaccine_id, vac.vaccine_name, vac.doses_required
                HAVING COUNT(*) < vac.doses_required`,
    },
    {
        title: 'Citizens Who Have Never Been Vaccinated',
        desc:  'Registered citizens with zero dose records (LEFT JOIN ... WHERE vaccination_id IS NULL).',
        icon:  'fa-user-xmark',
        sql:   `SELECT c.citizen_id, c.citizen_name, c.mobile
                FROM Citizens c
                LEFT JOIN Vaccinations v ON v.citizen_id = c.citizen_id
                WHERE v.vaccination_id IS NULL`,
    },
    {
        title: 'Vaccinations per Center',
        desc:  'Distribution of administered doses across healthcare facilities (LEFT JOIN + COUNT).',
        icon:  'fa-hospital',
        sql:   `SELECT vc.center_name, vc.district, vc.state, COUNT(v.vaccination_id) AS total_vaccinations
                FROM VaccinationCenters vc
                LEFT JOIN Vaccinations v ON v.center_id = vc.center_id
                GROUP BY vc.center_id, vc.center_name, vc.district, vc.state
                ORDER BY total_vaccinations DESC`,
    },
    {
        title: 'Vaccine-Wise Usage',
        desc:  'Breakdown of doses administered per pharmaceutical brand.',
        icon:  'fa-vial',
        sql:   `SELECT vac.vaccine_name, vac.manufacturer, COUNT(v.vaccination_id) AS doses_administered
                FROM Vaccines vac
                LEFT JOIN Vaccinations v ON v.vaccine_id = vac.vaccine_id
                GROUP BY vac.vaccine_id, vac.vaccine_name, vac.manufacturer
                ORDER BY doses_administered DESC`,
    },
    {
        title: 'State-Wise Vaccinations',
        desc:  'Geographic distribution of vaccinated population by state.',
        icon:  'fa-map-location-dot',
        sql:   `SELECT vc.state, COUNT(*) AS total_vaccinations
                FROM Vaccinations v
                JOIN VaccinationCenters vc ON vc.center_id = v.center_id
                GROUP BY vc.state
                ORDER BY total_vaccinations DESC`,
    },
    {
        title: 'Month-Wise Vaccination Trend',
        desc:  'Timeline analysis aggregated by calendar month (DATE_FORMAT grouping).',
        icon:  'fa-calendar-days',
        sql:   `SELECT DATE_FORMAT(vaccination_date, '%Y-%m') AS month, COUNT(*) AS doses
                FROM Vaccinations
                GROUP BY DATE_FORMAT(vaccination_date, '%Y-%m')
                ORDER BY month`,
    },
];

router.get('/', wrap(async (req, res) => {
    const out = [];
    for (const { title, desc, icon, sql } of reports) {
        const [rows, fields] = await pool.query(sql);
        out.push({ title, desc, icon, columns: fields.map(f => f.name), rows });
    }
    res.json({ ok: true, reports: out });
}));

module.exports = router;
