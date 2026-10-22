-- =====================================================================
-- 01_SCHEMA.SQL: Relational Tables & Integrity Constraints
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+ (InnoDB Storage Engine)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS covid_vaccination
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE covid_vaccination;

-- Drop child tables first to respect foreign key constraints
DROP TABLE IF EXISTS Vaccinations;
DROP TABLE IF EXISTS Vaccines;
DROP TABLE IF EXISTS VaccinationCenters;
DROP TABLE IF EXISTS Citizens;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------
-- 1. Table: Citizens (Master Recipient Registry)
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

-- ---------------------------------------------------------------------
-- 2. Table: VaccinationCenters (Healthcare Facilities)
-- ---------------------------------------------------------------------
CREATE TABLE VaccinationCenters (
    center_id    INT AUTO_INCREMENT PRIMARY KEY,
    center_name  VARCHAR(120) NOT NULL,
    district     VARCHAR(80)  NOT NULL,
    state        VARCHAR(80)  NOT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Table: Vaccines (Pharmaceutical Formulations & Dosage Protocols)
-- ---------------------------------------------------------------------
CREATE TABLE Vaccines (
    vaccine_id     INT AUTO_INCREMENT PRIMARY KEY,
    vaccine_name   VARCHAR(80)  NOT NULL UNIQUE,
    manufacturer   VARCHAR(120) NOT NULL,
    doses_required TINYINT      NOT NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_doses CHECK (doses_required BETWEEN 1 AND 4)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Table: Vaccinations (Transaction Ledger linking Citizen, Vaccine, Center)
-- ---------------------------------------------------------------------
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
    -- Prevent duplicate administration of the exact same vaccine on the same day
    CONSTRAINT uq_citizen_vaccine_date UNIQUE (citizen_id, vaccine_id, vaccination_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Table: users (Role-Based Access Control)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          ENUM('admin','staff','viewer') NOT NULL DEFAULT 'viewer',
    last_login    DATETIME     DEFAULT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Secondary B-Tree Indexes for Query Optimization
-- ---------------------------------------------------------------------
CREATE INDEX idx_vacc_date   ON Vaccinations(vaccination_date);
CREATE INDEX idx_vacc_center ON Vaccinations(center_id);
CREATE INDEX idx_vacc_cit    ON Vaccinations(citizen_id);
