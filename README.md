# COVID-19 Vaccination Management System
### DBMS Course Project (MySQL 8.0 + Node.js/Express + HTML5/CSS3/JavaScript/Chart.js)
**Institution:** Indian Institute of Information Technology, Bhopal  
**Department:** Computer Science & Engineering  

---

## 📁 Project Directory Structure

```
dbms-project/
├── public/                   # Frontend: plain HTML / CSS / JavaScript
│   ├── css/
│   │   ├── style.css         # Responsive Dark-Sidebar Enterprise Stylesheet
│   │   └── login.css         # Glassmorphic Login Page Styles
│   ├── js/
│   │   ├── main.js           # Shared layout (sidebar, user card), API client, flash alerts, clock
│   │   ├── dashboard.js      # Stat cards + Chart.js visuals
│   │   ├── citizens.js       # Citizen registry (masked Aadhaar)
│   │   ├── centers.js        # Vaccination centers
│   │   ├── vaccines.js       # Vaccine protocols & dosing rules
│   │   ├── vaccinations.js   # Dose ledger (trigger overdose test)
│   │   ├── reports.js        # 7 SQL analytical reports
│   │   └── users.js          # Admin user management
│   ├── login.html            # Login with 1-Click Demo Buttons
│   ├── index.html            # Analytics Dashboard
│   ├── citizens.html  centers.html  vaccines.html
│   ├── vaccinations.html  reports.html  users.html
├── server/                   # Backend: Node.js + Express JSON API
│   ├── server.js             # App entry: sessions, page guards, static files, API routes
│   ├── db.js                 # MySQL connection pool (mysql2) + default user provisioning
│   ├── middleware.js         # RBAC guards, MySQL error-code mapping, validators
│   └── routes/               # auth, dashboard, citizens, centers, vaccines, vaccinations, reports, users
├── database/                 # MySQL SQL Scripts
│   ├── 01_schema.sql         # Table DDL, Foreign Keys, CHECK constraints
│   ├── 02_triggers.sql       # BEFORE INSERT active database trigger
│   ├── 03_views.sql          # Analytical Relational Views
│   ├── 04_seed_data.sql      # Seed Data for 8 citizens, 4 centers, 4 vaccines, 10 doses
│   ├── 05_analytical_queries.sql # 12 Benchmark SQL Evaluation Queries
│   └── complete_setup.sql    # 1-Click Complete Database Import Script
├── scripts/setup-db.js       # `npm run setup-db` – imports complete_setup.sql
├── docs/                     # Project Report, Viva Guide, Architecture
├── .env.example              # Database / server configuration template
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js 18+** — https://nodejs.org
- **MySQL 8.0** (standalone MySQL Server, or just the MySQL module of XAMPP — Apache/PHP are **not** needed)

### 2. Install
```bash
git clone https://github.com/ansh-gupta1209/dbms-project.git
cd dbms-project
npm install
cp .env.example .env        # Windows: copy .env.example .env
```
Edit `.env` if your MySQL user / password differ from `root` / *(empty)*.

### 3. Create the Database
```bash
npm run setup-db
```
This runs `database/complete_setup.sql` (tables, constraints, trigger, views and seed data).
⚠️ It drops and recreates the tables, so existing data in `covid_vaccination` is replaced.
*(Alternatively, import `database/complete_setup.sql` from MySQL Workbench or phpMyAdmin.)*

### 4. Run
```bash
npm start
```
Open 👉 **http://localhost:3000** (redirects to the login page)

---

## 🔐 Default Demo Accounts

| Username | Password | Role | Privileges |
| :--- | :--- | :--- | :--- |
| **`admin`** | `Admin@123` | **Administrator** | Full CRUD, User Management, All Reports |
| **`staff`** | `Staff@123` | **Healthcare Staff** | Add/Edit records, Record Doses (No deletion) |
| **`viewer`** | `Viewer@123` | **Clinical Auditor** | Read-Only audit access |

---

## 🔌 REST API Overview

| Method | Endpoint | Access |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login`, `/api/auth/logout` · `GET /api/auth/me` | Public / Signed-in |
| `GET` | `/api/dashboard`, `/api/reports` | Signed-in |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/citizens`, `/api/centers`, `/api/vaccines`, `/api/vaccinations` | Read: all · Write: staff · Delete: admin |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/users` (`/:id/role`, `/:id/password`) | Admin |

All queries use parameterized prepared statements (`mysql2`), and MySQL error codes
(1062 duplicate, 1451/1452 foreign key, 3819/4025 CHECK, 1644 trigger SIGNAL) are mapped to friendly messages.

---

## ☁️ Deploying Online (optional)

GitHub stores the code; to run it on the internet you need a Node.js host plus a MySQL database:
1. Create a MySQL 8 database on a cloud provider (e.g. Aiven, Railway, TiDB Cloud).
2. Run `npm run setup-db` locally with `.env` pointing at that database (set `DB_SSL=true` if required).
   Some providers need `log_bin_trust_function_creators=1` to allow the trigger.
3. Create a **Web Service** on Render / Railway from this GitHub repo with build command `npm install`,
   start command `npm start`, and the `DB_*`, `SESSION_SECRET` and `NODE_ENV=production` environment variables.

---

## 🧪 Quick Test Scenarios for Evaluation

1. **Active Database Trigger (Overdose Check):**
   - In **Vaccinations**, select **Aarav Sharma** and attempt to give him a 3rd **Covishield** dose.
   - Result: Automatically blocked by `trg_vaccinations_before_insert` with message: *"Citizen has already taken all required doses of this vaccine"*.
2. **Foreign Key Integrity Check (`ON DELETE RESTRICT`):**
   - In **Centers**, attempt to delete **District Hospital Bhopal**.
   - Result: Blocked by foreign key rule with message: *"Cannot delete: other records still depend on this one."*.
3. **Analytical Reports:**
   - Open **Reports** to inspect 7 live relational queries including outer joins, subqueries, and views.
