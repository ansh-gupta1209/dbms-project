/**
 * BACKEND: Role-Based Access Control (RBAC), Session Guards & Error Mapping
 */
const { pool } = require('./db');

const authUser = req => req.session.authUser || null;
const isLoggedIn = req => !!req.session.authUser;
const isAdmin = req => authUser(req)?.role === 'admin';
const isStaff = req => ['admin', 'staff'].includes(authUser(req)?.role);

/**
 * Reply with success / error and queue the same message as a session flash
 * notification, shown by the page the client navigates to next (like PHP's flash()).
 */
function ok(req, res, msg) {
    req.session.flash = ['success', msg];
    res.json({ ok: true, message: msg });
}

function fail(req, res, msg, status = 400) {
    req.session.flash = ['error', msg];
    res.status(status).json({ ok: false, error: msg });
}

/** API guard: Enforce authentication */
function requireAuth(req, res, next) {
    if (!isLoggedIn(req)) return res.status(401).json({ ok: false, error: 'Please sign in to continue.' });
    next();
}

/** API guard: Enforce Staff or Administrator (operational rights) */
function requireStaff(message) {
    return (req, res, next) => {
        if (!isStaff(req)) return fail(req, res, message, 403);
        next();
    };
}

/** API guard: Enforce Administrator access */
function requireAdmin(message = 'Administrator access required.') {
    return (req, res, next) => {
        if (!isAdmin(req)) return fail(req, res, message, 403);
        next();
    };
}

/**
 * Map MySQL internal error codes into human-readable alerts
 */
function dbErrorMessage(err) {
    switch (err.errno) {
        case 1062: return 'Duplicate entry: that record or constraint already exists.';
        case 1451: return 'Cannot delete: other records still depend on this one.';
        case 1452: return 'Invalid reference: the selected citizen, vaccine or center does not exist.';
        case 4025:
        case 3819: return 'Rejected by validation rule. Please verify all inputs format.';
        case 1644: return err.sqlMessage; // Trigger SIGNAL message raised by MySQL engine
        default:   return 'Database error: ' + (err.sqlMessage || err.message);
    }
}

/**
 * Execute a write statement and reply with a success or mapped error message
 */
async function run(req, res, sql, params, okMsg) {
    try {
        await pool.execute(sql, params);
        ok(req, res, okMsg);
    } catch (err) {
        if (!err.errno) console.error(err);
        fail(req, res, dbErrorMessage(err));
    }
}

/** Wrap async route handlers so rejected promises reach the error handler */
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Today's date as YYYY-MM-DD (server local time) */
function today() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Validate a YYYY-MM-DD date that is real and not in the future */
function validDate(d) {
    if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    const dt = new Date(d + 'T00:00:00Z');
    return !isNaN(dt) && dt.toISOString().slice(0, 10) === d && d <= today();
}

const str = v => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());
const int = v => parseInt(v, 10) || 0;

module.exports = {
    authUser, isLoggedIn, isAdmin, isStaff, ok, fail,
    requireAuth, requireStaff, requireAdmin,
    dbErrorMessage, run, wrap, today, validDate, str, int,
};
