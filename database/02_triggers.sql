-- =====================================================================
-- 02_TRIGGERS.SQL: Active Database Rules & Business Integrity
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+
-- =====================================================================

USE covid_vaccination;

DROP TRIGGER IF EXISTS trg_vaccinations_before_insert;

DELIMITER $$
CREATE TRIGGER trg_vaccinations_before_insert
BEFORE INSERT ON Vaccinations
FOR EACH ROW
BEGIN
    DECLARE v_required INT;
    DECLARE v_taken INT;

    -- Business Rule 1: Temporal Constraint (No future bookings allowed)
    IF NEW.vaccination_date > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Vaccination date cannot be in the future';
    END IF;

    -- Retrieve protocol dose quota from parent Vaccines table
    SELECT doses_required INTO v_required
    FROM Vaccines WHERE vaccine_id = NEW.vaccine_id;

    -- Business Rule 2: Course Limit Verification (Reject excess doses)
    SELECT COUNT(*) INTO v_taken
    FROM Vaccinations
    WHERE citizen_id = NEW.citizen_id AND vaccine_id = NEW.vaccine_id;

    IF v_taken >= v_required THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Citizen has already taken all required doses of this vaccine';
    END IF;
END$$
DELIMITER ;
