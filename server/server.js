/**
 * COVID Vaccination Management System - Node.js / Express Server
 * Serves the HTML/CSS/JS frontend from /public and a JSON API under /api.
 * In production the frontend is hosted on Vercel, which proxies /api/* and /logout here (Render).
 */
require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { pool, ensureUsersTable, config } = require('./db');
const { isLoggedIn, isAdmin, requireAuth, requireAdmin } = require('./middleware');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Behind Render's / Vercel's HTTPS proxies: trust X-Forwarded-* so secure cookies work
if (process.env.NODE_ENV === 'production') app.set('trust proxy', true);

app.use(express.json());
app.use(session({
    name: 'covid_vms_sid',
    secret: process.env.SESSION_SECRET || 'change-this-session-secret',
    resave: false,
    saveUninitialized: false,
    // Sessions live in MySQL so logins survive server restarts / free-tier sleep
    store: new MySQLStore({ createDatabaseTable: true, clearExpired: true }, pool),
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000,
    },
}));

// ---------------------------------------------------------------------
// Page guards (same redirects the PHP pages performed)
// ---------------------------------------------------------------------
const PROTECTED = ['/index.html', '/citizens.html', '/centers.html', '/vaccines.html',
                   '/vaccinations.html', '/reports.html', '/users.html'];

app.get('/', (req, res) => res.redirect(isLoggedIn(req) ? '/index.html' : '/login.html'));

app.get('/login.html', (req, res, next) => (isLoggedIn(req) ? res.redirect('/index.html') : next()));

app.get(PROTECTED, (req, res, next) => {
    if (!isLoggedIn(req)) return res.redirect('/login.html');
    if (req.path === '/users.html' && !isAdmin(req)) {
        req.session.flash = ['error', 'Administrator access required.'];
        return res.redirect('/index.html');
    }
    next();
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login.html')));

// ---------------------------------------------------------------------
// JSON API
// ---------------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/dashboard',    requireAuth, require('./routes/dashboard'));
app.use('/api/citizens',     requireAuth, require('./routes/citizens'));
app.use('/api/centers',      requireAuth, require('./routes/centers'));
app.use('/api/vaccines',     requireAuth, require('./routes/vaccines'));
app.use('/api/vaccinations', requireAuth, require('./routes/vaccinations'));
app.use('/api/reports',      requireAuth, require('./routes/reports'));
app.use('/api/users',        requireAuth, requireAdmin(), require('./routes/users'));

app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'Unknown API endpoint.' }));

// Static frontend (HTML / CSS / JS)
app.use(express.static(PUBLIC_DIR));

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    const msg = err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR'
        ? 'Database connection failed. Make sure MySQL 8.0 is running and the database has been imported.'
        : 'Server error: ' + err.message;
    res.status(500).json({ ok: false, error: msg });
});

ensureUsersTable()
    .catch(err => {
        console.error(`\n[!] Could not connect to MySQL database "${config.database}" at ${config.host}:${config.port}`);
        console.error(`    ${err.message}`);
        console.error('    Make sure MySQL is running and run "npm run setup-db" to import the schema.\n');
    })
    .finally(() => {
        app.listen(PORT, () => console.log(`COVID Vaccination MS running at http://localhost:${PORT}`));
    });
