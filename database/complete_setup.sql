-- =====================================================================
-- COMPLETE_SETUP.SQL: Full Consolidated Database Deployment Script
-- COVID-19 Vaccination Management System (DBMS Project #37)
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+ (InnoDB Engine)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS covid_vaccination
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE covid_vaccination;

-- ---------------------------------------------------------------------
-- 1. DROP EXISTING RELATIONS (Child tables first)
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS vw_citizen_dose_status;
DROP VIEW IF EXISTS vw_vaccination_details;
DROP TABLE IF EXISTS Vaccinations;
DROP TABLE IF EXISTS Vaccines;
DROP TABLE IF EXISTS VaccinationCenters;
DROP TABLE IF EXISTS Citizens;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------
-- 2. SCHEMA DEFINITIONS
-- ---------------------------------------------------------------------
CREATE TABLE Citizens (
    citizen_id    INT AUTO_INCREMENT PRIMARY KEY,
    citizen_name  VARCHAR(100) NOT NULL,
    aadhaar_no    CHAR(12)     NOT NULL UNIQUE,
    mobile        CHAR(10)     NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_aadhaar CHECK (aadhaar_no REGEXP '^[0-9]{12}$'),
    CONSTRAINT chk_mobile  CHECK (mobile REGEXP '^[6-9][0-9]{9}$')
) ENGINE=InnoDB;

CREATE TABLE VaccinationCenters (
    center_id    INT AUTO_INCREMENT PRIMARY KEY,
    center_name  VARCHAR(120) NOT NULL,
    district     VARCHAR(80)  NOT NULL,
    state        VARCHAR(80)  NOT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Vaccines (
    vaccine_id     INT AUTO_INCREMENT PRIMARY KEY,
    vaccine_name   VARCHAR(80)  NOT NULL UNIQUE,
    manufacturer   VARCHAR(120) NOT NULL,
    doses_required TINYINT      NOT NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_doses CHECK (doses_required BETWEEN 1 AND 4)
) ENGINE=InnoDB;

CREATE TABLE Vaccinations (
    vaccination_id   INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id       INT  NOT NULL,
    vaccine_id       INT  NOT NULL,
    center_id        INT  NOT NULL,
    vaccination_date DATE NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vacc_citizen FOREIGN KEY (citizen_id)
        REFERENCES Citizens(citizen_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vacc_vaccine FOREIGN KEY (vaccine_id)
        REFERENCES Vaccines(vaccine_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_vacc_center FOREIGN KEY (center_id)
        REFERENCES VaccinationCenters(center_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_citizen_vaccine_date UNIQUE (citizen_id, vaccine_id, vaccination_date)
) ENGINE=InnoDB;

CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          ENUM('admin','staff','viewer') NOT NULL DEFAULT 'viewer',
    last_login    DATETIME     DEFAULT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_vacc_date   ON Vaccinations(vaccination_date);
CREATE INDEX idx_vacc_center ON Vaccinations(center_id);
CREATE INDEX idx_vacc_cit    ON Vaccinations(citizen_id);

-- ---------------------------------------------------------------------
-- 3. ACTIVE DATABASE TRIGGER
-- ---------------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_vaccinations_before_insert
BEFORE INSERT ON Vaccinations
FOR EACH ROW
BEGIN
    DECLARE v_required INT;
    DECLARE v_taken INT;

    IF NEW.vaccination_date > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Vaccination date cannot be in the future';
    END IF;

    SELECT doses_required INTO v_required
    FROM Vaccines WHERE vaccine_id = NEW.vaccine_id;

    SELECT COUNT(*) INTO v_taken
    FROM Vaccinations
    WHERE citizen_id = NEW.citizen_id AND vaccine_id = NEW.vaccine_id;

    IF v_taken >= v_required THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Citizen has already taken all required doses of this vaccine';
    END IF;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 4. RELATIONAL VIEWS
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_vaccination_details AS
SELECT v.vaccination_id, c.citizen_id, c.citizen_name, c.mobile,
       vac.vaccine_id, vac.vaccine_name, vc.center_id, vc.center_name, 
       vc.district, vc.state, v.vaccination_date
FROM Vaccinations v
JOIN Citizens c            ON c.citizen_id = v.citizen_id
JOIN Vaccines vac          ON vac.vaccine_id = v.vaccine_id
JOIN VaccinationCenters vc ON vc.center_id = v.center_id;

CREATE OR REPLACE VIEW vw_citizen_dose_status AS
SELECT c.citizen_id, c.citizen_name, c.mobile,
       vac.vaccine_id, vac.vaccine_name,
       COUNT(*) AS doses_taken, vac.doses_required,
       CASE WHEN COUNT(*) >= vac.doses_required
            THEN 'Fully Vaccinated' 
            ELSE 'Partially Vaccinated' 
       END AS status
FROM Vaccinations v
JOIN Citizens c   ON c.citizen_id = v.citizen_id
JOIN Vaccines vac ON vac.vaccine_id = v.vaccine_id
GROUP BY c.citizen_id, c.citizen_name, c.mobile, vac.vaccine_id, vac.vaccine_name, vac.doses_required;

-- ---------------------------------------------------------------------
-- 5. INITIAL MASTER DATA SEED
-- ---------------------------------------------------------------------
INSERT INTO Citizens (citizen_id, citizen_name, aadhaar_no, mobile) VALUES
(1, 'Aarav Sharma',  '234567890123', '9876543210'),
(2, 'Ananya Verma',  '345678901234', '9123456780'),
(3, 'Rohan Singh',   '456789012345', '9988776655'),
(4, 'Priya Patel',   '567890123456', '8877665544'),
(5, 'Aditya Kumar',  '678901234567', '7766554433'),
(6, 'Neha Gupta',    '789012345678', '9090909090'),
(7, 'Kabir Khan',    '890123456789', '8080808080'),
(8, 'Sneha Joshi',   '901234567890', '7070707070');

INSERT INTO VaccinationCenters (center_id, center_name, district, state) VALUES
(1, 'District Hospital Bhopal',   'Bhopal',   'Madhya Pradesh'),
(2, 'Community Health Centre',    'Indore',   'Madhya Pradesh'),
(3, 'City Primary Health Centre', 'Jaipur',   'Rajasthan'),
(4, 'Civil Hospital Ahmedabad',   'Ahmedabad','Gujarat');

INSERT INTO Vaccines (vaccine_id, vaccine_name, manufacturer, doses_required) VALUES
(1, 'Covishield',    'Serum Institute of India', 2),
(2, 'Covaxin',       'Bharat Biotech',           2),
(3, 'Corbevax',      'Biological E',             2),
(4, 'Sputnik Light', 'Gamaleya / Dr. Reddy''s',  1);

INSERT INTO Vaccinations (vaccination_id, citizen_id, vaccine_id, center_id, vaccination_date) VALUES
(1,  1, 1, 1, '2021-06-10'),
(2,  1, 1, 1, '2021-09-02'),
(3,  2, 2, 2, '2021-07-15'),
(4,  2, 2, 2, '2021-08-14'),
(5,  3, 1, 3, '2021-08-01'),
(6,  4, 4, 4, '2021-10-05'),
(7,  5, 3, 1, '2022-02-20'),
(8,  5, 3, 1, '2022-03-21'),
(9,  6, 2, 2, '2021-11-11'),
(10, 7, 1, 4, '2021-12-01');

-- Users seeded with standard BCrypt hashes:
-- admin / Admin@123
-- staff / Staff@123
-- viewer / Viewer@123
INSERT INTO users (user_id, username, password_hash, full_name, role) VALUES
(1, 'admin',  '$2b$10$fHKvoEjwy6QC/SOnEqgPTup0obBD1irShsyiHnD8Cx/iO0DBe1X9u', 'Administrator', 'admin'),
(2, 'staff',  '$2b$10$/d7x5NIlfJ//oBvrrsNmIuSbwWrj6Iozt7WpIoD1fxJlcrPEp/Jxe', 'Healthcare Staff', 'staff'),
(3, 'viewer', '$2b$10$4D2mk4/NGnnWJzO4r2HsDuhhmpc7H2UdkQsKqUjQESawh2fbl0jfq', 'Clinical Auditor', 'viewer');
