/**
 * One-command database import: runs database/complete_setup.sql against MySQL.
 * Usage:  npm run setup-db
 * Honours DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME from .env.
 * WARNING: drops and recreates the tables (all existing data is replaced by seed data).
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'covid_vaccination';
const SQL_FILE = path.join(__dirname, '..', 'database', 'complete_setup.sql');

/** Split a SQL script into statements, honouring DELIMITER changes (used for triggers) */
function splitStatements(sql) {
    const statements = [];
    let delimiter = ';';
    let buffer = '';
    for (const line of sql.split(/\r?\n/)) {
        const m = line.match(/^\s*DELIMITER\s+(\S+)\s*$/i);
        if (m) { delimiter = m[1]; continue; }
        if (buffer === '' && /^\s*(--.*)?$/.test(line)) continue; // skip blank / comment lines between statements
        buffer += line + '\n';
        if (buffer.trimEnd().endsWith(delimiter)) {
            const stmt = buffer.trimEnd().slice(0, -delimiter.length).trim();
            if (stmt) statements.push(stmt);
            buffer = '';
        }
    }
    if (buffer.trim()) statements.push(buffer.trim());
    return statements;
}

(async () => {
    const sql = fs.readFileSync(SQL_FILE, 'utf8')
        .replace(/CREATE DATABASE IF NOT EXISTS covid_vaccination/i, `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``)
        .replace(/USE covid_vaccination;/i, `USE \`${DB_NAME}\`;`);

    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST || '127.0.0.1',
        port:     Number(process.env.DB_PORT || 3306),
        user:     process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    const statements = splitStatements(sql);
    for (const stmt of statements) {
        await conn.query(stmt);
    }
    await conn.end();
    console.log(`Database "${DB_NAME}" is ready (${statements.length} statements executed).`);
})().catch(err => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
});
