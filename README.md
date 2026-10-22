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
├── vercel.json               # Vercel: serve /public, proxy /api to Render
├── render.yaml               # Render Blueprint for the Node.js API
├── docs/                     # Project Report, Viva Guide, Architecture
├── .env.example              # Database / server configuration template
└── package.json
```

---

## 🌐 Live Deployment Architecture

```
Browser ──► Vercel (static HTML/CSS/JS from /public)
              │  /api/*  and  /logout  are proxied (vercel.json rewrites)
              ▼
            Render (Node.js + Express API, render.yaml)
              │  TLS, MySQL protocol
              ▼
            Aiven (managed MySQL 8.0: tables, trigger, views, sessions)
```
Because Vercel proxies the API, the browser sees a single origin, so session cookies work with no CORS setup.

### Deploy it yourself
1. **Database – Aiven:** create a free MySQL service and copy its **Service URI**.
   Put `DATABASE_URL=<Service URI>` in `.env`, then run `npm install && npm run setup-db` to create the schema and seed data.
2. **API – Render:** New → **Blueprint** → select this repo (uses `render.yaml`) and paste the same `DATABASE_URL`.
   Note the service URL, e.g. `https://covid-vaccination-api.onrender.com`.
3. **Frontend – Vercel:** import this repo (no build step; `vercel.json` serves `public/`).
   If your Render URL differs, update the two `destination` URLs in `vercel.json`.

> Render's free plan sleeps after 15 minutes idle, so the first request after a pause can take ~30–60 s.

---

## 💻 Run Locally (optional)

Requirements: **Node.js 18+** and any MySQL 8.0 server (local or the Aiven one).
```bash
git clone https://github.com/ansh-gupta1209/dbms-project.git
cd dbms-project
npm install
cp .env.example .env        # set DATABASE_URL or the DB_* values
npm run setup-db            # ⚠️ drops & recreates the tables with seed data
npm start                   # http://localhost:3000
```

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

## 🧪 Quick Test Scenarios for Evaluation

1. **Active Database Trigger (Overdose Check):**
   - In **Vaccinations**, select **Aarav Sharma** and attempt to give him a 3rd **Covishield** dose.
   - Result: Automatically blocked by `trg_vaccinations_before_insert` with message: *"Citizen has already taken all required doses of this vaccine"*.
2. **Foreign Key Integrity Check (`ON DELETE RESTRICT`):**
   - In **Centers**, attempt to delete **District Hospital Bhopal**.
   - Result: Blocked by foreign key rule with message: *"Cannot delete: other records still depend on this one."*.
3. **Analytical Reports:**
   - Open **Reports** to inspect 7 live relational queries including outer joins, subqueries, and views.
