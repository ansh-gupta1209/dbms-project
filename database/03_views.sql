-- =====================================================================
-- 03_VIEWS.SQL: Relational Views (Virtual Tables)
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+
-- =====================================================================

USE covid_vaccination;

-- ---------------------------------------------------------------------
-- View 1: vw_vaccination_details
-- Denormalizes the 4-way join between Vaccinations, Citizens, Vaccines,
-- and VaccinationCenters for reporting and dashboard access.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_vaccination_details AS
SELECT v.vaccination_id, 
       c.citizen_id, 
       c.citizen_name, 
       c.mobile,
       vac.vaccine_id,
       vac.vaccine_name, 
       vc.center_id,
       vc.center_name, 
       vc.district, 
       vc.state,
       v.vaccination_date
FROM Vaccinations v
JOIN Citizens c            ON c.citizen_id = v.citizen_id
JOIN Vaccines vac          ON vac.vaccine_id = v.vaccine_id
JOIN VaccinationCenters vc ON vc.center_id = v.center_id;

-- ---------------------------------------------------------------------
-- View 2: vw_citizen_dose_status
-- Calculates completed doses vs protocol requirement per citizen,
-- and classifies status as 'Fully Vaccinated' or 'Partially Vaccinated'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_citizen_dose_status AS
SELECT c.citizen_id, 
       c.citizen_name, 
       c.mobile,
       vac.vaccine_id,
       vac.vaccine_name,
       COUNT(*) AS doses_taken, 
       vac.doses_required,
       CASE WHEN COUNT(*) >= vac.doses_required
            THEN 'Fully Vaccinated' 
            ELSE 'Partially Vaccinated' 
       END AS status
FROM Vaccinations v
JOIN Citizens c   ON c.citizen_id = v.citizen_id
JOIN Vaccines vac ON vac.vaccine_id = v.vaccine_id
GROUP BY c.citizen_id, c.citizen_name, c.mobile, vac.vaccine_id, vac.vaccine_name, vac.doses_required;
