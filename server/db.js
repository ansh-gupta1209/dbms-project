/**
 * BACKEND: MySQL Connection Pool & Initialization
 * Uses mysql2 (promise API) with UTF-8 character encoding and TCP connection.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

/**
 * Connection settings: either a single DATABASE_URL
 * (e.g. mysql://user:pass@host:port/db?ssl-mode=REQUIRED, as given by Aiven)
 * or the individual DB_* variables.
 */
function readConfig() {
    if (process.env.DATABASE_URL) {
        const u = new URL(process.env.DATABASE_URL);
        const sslMode = (u.searchParams.get('ssl-mode') || u.searchParams.get('sslmode') || '').toUpperCase();
        return {
            host:     u.hostname,
            port:     Number(u.port || 3306),
            user:     decodeURIComponent(u.username),
            password: decodeURIComponent(u.password),
            database: process.env.DB_NAME || decodeURIComponent(u.pathname.slice(1)) || 'covid_vaccination',
            ssl:      sslMode && sslMode !== 'DISABLED' ? { rejectUnauthorized: false } : undefined,
        };
    }
    return {
        host:     process.env.DB_HOST || '127.0.0.1',
        port:     Number(process.env.DB_PORT || 3306),
        user:     process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'covid_vaccination',
        ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };
}

const config = readConfig();

const pool = mysql.createPool({
    ...config,
    charset: 'UTF8MB4_UNICODE_CI', // match the database collation used by the views
    dateStrings: true,          // return DATE/DATETIME as 'YYYY-MM-DD' strings, like PHP did
    waitForConnections: true,
    connectionLimit: 5,
});

/**
 * Auto-provision users table and seed default role accounts if empty
 */
async function ensureUsersTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        user_id       INT AUTO_INCREMENT PRIMARY KEY,
        username      VARCHAR(50)  NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name     VARCHAR(100) NOT NULL,
        role          ENUM('admin','staff','viewer') NOT NULL DEFAULT 'viewer',
        last_login    DATETIME     DEFAULT NULL,
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM users');
    if (Number(n) === 0) {
        const defaults = [
            ['admin',  'Admin@123',  'Administrator',    'admin'],
            ['staff',  'Staff@123',  'Healthcare Staff', 'staff'],
            ['viewer', 'Viewer@123', 'Clinical Auditor', 'viewer'],
        ];
        for (const [u, p, f, r] of defaults) {
            await pool.execute(
                'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
                [u, bcrypt.hashSync(p, 10), f, r]
            );
        }
    }
}

module.exports = { pool, config, readConfig, ensureUsersTable };
