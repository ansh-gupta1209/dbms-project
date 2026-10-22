/**
 * BACKEND: MySQL Connection Pool & Initialization
 * Uses mysql2 (promise API) with UTF-8 character encoding and TCP connection.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = {
    host:     process.env.DB_HOST || '127.0.0.1',
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'covid_vaccination',
};

const pool = mysql.createPool({
    ...config,
    charset: 'UTF8MB4_UNICODE_CI', // match the database collation used by the views
    dateStrings: true,          // return DATE/DATETIME as 'YYYY-MM-DD' strings, like PHP did
    waitForConnections: true,
    connectionLimit: 10,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
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

module.exports = { pool, config, ensureUsersTable };
