# COVID-19 VACCINATION MANAGEMENT SYSTEM
## Comprehensive Viva Voce Preparation Guide & Examination Defense

---

### Table of Contents
1. Key Concepts & Relational Architecture
2. Step-by-Step Examiner Demonstration Script
3. Critical Viva Questions & Ideal Answers
   - 3.1 Normalization & Relational Theory
   - 3.2 Constraints, Active Triggers & Referential Integrity
   - 3.3 Security, Hashing & Session Engineering
   - 3.4 SQL Analytics, Views & Performance Optimization
4. Trap Questions & How to Avoid Common Pitfalls

---

## 1. Quick Technical Summary of the System
* **Domain:** Mass immunization management tracking citizens, approved vaccines, health centers, and dose logs.
* **Architecture:** 3-Tier Web Application (Presentation: HTML5/CSS3/Chart.js, Middleware: Node.js + Express REST API with mysql2, Database: MySQL 8.0 InnoDB).
* **Normalization:** Decomposed up to **Third Normal Form (3NF)** and **BCNF** with zero partial or transitive dependencies.
* **Integrity:** Declarative table constraints (`CHECK` regex on Aadhaar/phone, `UNIQUE`, `NOT NULL`, `FOREIGN KEY`) + procedural `BEFORE INSERT` trigger.
* **Security:** Role-Based Access Control (RBAC: Admin, Staff, Viewer), BCrypt password hashing, parameter binding against SQL injection, and contextual escaping against XSS.

---

## 2. Step-by-Step Viva Demonstration Script

### Step 1: Open Login Page & Explain Authentication
* **URL:** `http://localhost:3000/login.html` (after `npm start`)
* **What to say:**
  > *"Good morning/afternoon, Sir/Ma'am. Today I am presenting the COVID-19 Vaccination Management System. Before accessing the records, our system enforces enterprise-grade Role-Based Access Control (RBAC) across three privilege tiers: Administrator, Staff, and Viewer. All user passwords are encrypted using BCrypt key-derivation with an adaptive work factor."*

### Step 2: Demonstrate Viewer Role (Read-Only Enforcement)
* **Action:** Click "Use" next to `viewer / Viewer@123` and sign in.
* **Action:** Navigate to the **Citizens** page.
* **What to say:**
  > *"Notice that as a Viewer, the UI automatically disarms all modification features. The registration forms and delete buttons are removed. This read-only policy is strictly verified server-side."*

### Step 3: Demonstrate Admin Role & Analytics Dashboard
* **Action:** Sign out, log in with `admin / Admin@123`.
* **What to say:**
  > *"Logged in as Administrator, we see our executive dashboard featuring 7 real-time KPIs and 2 Chart.js visualizers: a curved monthly trend chart and a vaccine distribution doughnut chart. An administrative 'Manage Users' panel also becomes available."*

### Step 4: The Database Trigger Demonstration (Crucial Step!)
* **Action:** Navigate to **Vaccinations**.
* **Action:** Try to add a 3rd Covishield dose for **Aarav Sharma** (who already has 2 doses).
* **What to say:**
  > *"Here is our active database trigger: `trg_vaccinations_before_insert`. Aarav Sharma has already taken both required Covishield doses. When I attempt to record a 3rd dose, the MySQL storage engine intercepts the write, raises a `SIGNAL SQLSTATE '45000'`, and rolls back the transaction. The same trigger also prevents recording vaccination dates set in the future."*

### Step 5: Foreign Key Referential Integrity Check (`ON DELETE RESTRICT`)
* **Action:** Navigate to **Centers**.
* **Action:** Attempt to delete **District Hospital Bhopal**.
* **What to say:**
  > *"Because historical patient records reference this center, MySQL rejects the deletion with error 1451 (`ON DELETE RESTRICT`). Our application catches this and displays a safe error banner, guaranteeing historical medical records are never orphaned."*

---

## 3. High-Frequency Viva Questions & Model Answers

### Q1: "Why is your database in 3NF and not 2NF or unnormalized?"
* **Answer:** *"All candidate keys are single-attribute, which trivially eliminates any possibility of partial dependencies, guaranteeing 2NF. Furthermore, all non-key attributes depend strictly and directly on their relation's primary key without any transitive dependencies (e.g. `center_id` determines `district` and `state`; `vaccine_id` determines `manufacturer` and `doses_required`). This eliminates update and deletion anomalies."*

### Q2: "Why couldn't you enforce the dose limit with a CHECK constraint?"
* **Answer:** *"A SQL `CHECK` constraint evaluates expressions exclusively on the single tuple being inserted. It cannot query other rows or tables. To determine if a citizen has exceeded their dose quota, we must run an aggregate query across historical records (`SELECT COUNT(*) FROM Vaccinations WHERE citizen_id = NEW.citizen_id`). That requires a `BEFORE INSERT` Trigger."*

### Q3: "How does your backend code prevent SQL Injection?"
* **Answer:** *"We use parameterized prepared statements via the Node.js `mysql2` driver (`pool.execute(sql, [params])`). The SQL structure is compiled by the database engine prior to parameter insertion. User inputs are transmitted separately as pure data literals over the protocol, mathematically preventing input from modifying the query syntax."*

### Q4: "What is the difference between ON DELETE CASCADE on Citizens and ON DELETE RESTRICT on Centers?"
* **Answer:** *"If a citizen is deleted from the system, their vaccination history belongs exclusively to them; keeping their doses without the citizen would create orphan records, so `CASCADE` purges both. In contrast, health centers and vaccine brands represent public infrastructure; deleting a center would invalidate clinical records for hundreds of other citizens, so `RESTRICT` forbids deletion while dependencies exist."*
