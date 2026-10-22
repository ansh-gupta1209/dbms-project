-- =====================================================================
-- 05_ANALYTICAL_QUERIES.SQL: Benchmark SQL Queries for DBMS Evaluation
-- Demonstrates: Joins, Aggregation, HAVING, Outer Joins, Views, Subqueries
-- =====================================================================

USE covid_vaccination;

-- Q1. Full vaccination record with names (4-table JOIN)
SELECT v.vaccination_id, c.citizen_name, vac.vaccine_name,
       vc.center_name, vc.district, v.vaccination_date
FROM Vaccinations v
JOIN Citizens c            ON c.citizen_id = v.citizen_id
JOIN Vaccines vac          ON vac.vaccine_id = v.vaccine_id
JOIN VaccinationCenters vc ON vc.center_id = v.center_id
ORDER BY v.vaccination_date;

-- Q2. Doses taken vs doses required per citizen and vaccine
SELECT c.citizen_name, vac.vaccine_name,
       COUNT(*) AS doses_taken, vac.doses_required
FROM Vaccinations v
JOIN Citizens c   ON c.citizen_id = v.citizen_id
JOIN Vaccines vac ON vac.vaccine_id = v.vaccine_id
GROUP BY c.citizen_id, c.citizen_name, vac.vaccine_id, vac.vaccine_name, vac.doses_required;

-- Q3. Fully vaccinated citizens (GROUP BY + HAVING)
SELECT c.citizen_name, vac.vaccine_name
FROM Vaccinations v
JOIN Citizens c   ON c.citizen_id = v.citizen_id
JOIN Vaccines vac ON vac.vaccine_id = v.vaccine_id
GROUP BY c.citizen_id, c.citizen_name, vac.vaccine_id, vac.vaccine_name, vac.doses_required
HAVING COUNT(*) >= vac.doses_required;

-- Q4. Citizens with pending doses (Outreach Queue)
SELECT c.citizen_name, c.mobile, vac.vaccine_name,
       vac.doses_required - COUNT(*) AS doses_pending
FROM Vaccinations v
JOIN Citizens c   ON c.citizen_id = v.citizen_id
JOIN Vaccines vac ON vac.vaccine_id = v.vaccine_id
GROUP BY c.citizen_id, c.citizen_name, c.mobile, vac.vaccine_id, vac.vaccine_name, vac.doses_required
HAVING COUNT(*) < vac.doses_required;

-- Q5. Citizens who have never been vaccinated (LEFT JOIN ... IS NULL)
SELECT c.citizen_id, c.citizen_name, c.mobile
FROM Citizens c
LEFT JOIN Vaccinations v ON v.citizen_id = c.citizen_id
WHERE v.vaccination_id IS NULL;

-- Q6. Number of vaccinations per center (Workload Distribution)
SELECT vc.center_name, vc.district, COUNT(v.vaccination_id) AS total_vaccinations
FROM VaccinationCenters vc
LEFT JOIN Vaccinations v ON v.center_id = vc.center_id
GROUP BY vc.center_id, vc.center_name, vc.district
ORDER BY total_vaccinations DESC;

-- Q7. Vaccine-wise market usage
SELECT vac.vaccine_name, vac.manufacturer, COUNT(v.vaccination_id) AS doses_administered
FROM Vaccines vac
LEFT JOIN Vaccinations v ON v.vaccine_id = vac.vaccine_id
GROUP BY vac.vaccine_id, vac.vaccine_name, vac.manufacturer
ORDER BY doses_administered DESC;

-- Q8. State-wise vaccination distribution
SELECT vc.state, COUNT(*) AS total_vaccinations
FROM Vaccinations v
JOIN VaccinationCenters vc ON vc.center_id = v.center_id
GROUP BY vc.state
ORDER BY total_vaccinations DESC;

-- Q9. Month-wise vaccination trend (Time-Series)
SELECT DATE_FORMAT(vaccination_date, '%Y-%m') AS month, COUNT(*) AS doses
FROM Vaccinations
GROUP BY DATE_FORMAT(vaccination_date, '%Y-%m')
ORDER BY month;

-- Q10. Centers with above-average vaccinations (Correlated Subquery)
SELECT vc.center_name, COUNT(*) AS total
FROM Vaccinations v
JOIN VaccinationCenters vc ON vc.center_id = v.center_id
GROUP BY vc.center_id, vc.center_name
HAVING COUNT(*) > (
    SELECT AVG(cnt) FROM (
        SELECT COUNT(*) AS cnt FROM Vaccinations GROUP BY center_id
    ) t
);

-- Q11. Gap in days between first and last dose (DATEDIFF)
SELECT c.citizen_name, vac.vaccine_name,
       MIN(v.vaccination_date) AS first_dose, MAX(v.vaccination_date) AS last_dose,
       DATEDIFF(MAX(v.vaccination_date), MIN(v.vaccination_date)) AS days_between
FROM Vaccinations v
JOIN Citizens c   ON c.citizen_id = v.citizen_id
JOIN Vaccines vac ON vac.vaccine_id = v.vaccine_id
GROUP BY c.citizen_id, c.citizen_name, vac.vaccine_id, vac.vaccine_name
HAVING COUNT(*) > 1;

-- Q12. Parametric Search (Name or Mobile)
SELECT * FROM Citizens WHERE mobile = '9876543210' OR citizen_name LIKE '%Sharma%';
