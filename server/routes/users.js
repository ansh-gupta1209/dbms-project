/**
 * API: Admin User Management & Password Resets (admin only)
 */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authUser, fail, run, wrap, str, int } = require('../middleware');

const ROLES = ['admin', 'staff', 'viewer'];
const role = v => (ROLES.includes(v) ? v : 'viewer');

router.get('/', wrap(async (req, res) => {
    const [rows] = await pool.query(
        'SELECT user_id, username, full_name, role, last_login, created_at FROM users ORDER BY user_id ASC'
    );
    res.json({ ok: true, rows });
}));

router.post('/', wrap(async (req, res) => {
    const username = str(req.body.username), fullname = str(req.body.full_name);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (username === '' || fullname === '' || password.length < 6) {
        return fail(req, res, 'All fields are required. Password must be at least 6 characters.');
    }
    await run(req, res, 'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        [username, bcrypt.hashSync(password, 10), fullname, role(req.body.role)],
        `User account '${username}' created successfully.`);
}));

router.put('/:id/role', wrap(async (req, res) => {
    const id = int(req.params.id), newRole = role(req.body.role);
    if (id === Number(authUser(req).id) && newRole !== 'admin') {
        return fail(req, res, 'You cannot demote your own administrator account.');
    }
    await run(req, res, 'UPDATE users SET role = ? WHERE user_id = ?', [newRole, id], 'User role updated successfully.');
}));

router.put('/:id/password', wrap(async (req, res) => {
    const pw = typeof req.body.new_password === 'string' ? req.body.new_password : '';
    if (pw.length < 6) {
        return fail(req, res, 'New password must be at least 6 characters.');
    }
    await run(req, res, 'UPDATE users SET password_hash = ? WHERE user_id = ?',
        [bcrypt.hashSync(pw, 10), int(req.params.id)], 'Password reset successfully.');
}));

router.delete('/:id', wrap(async (req, res) => {
    const id = int(req.params.id);
    if (id === Number(authUser(req).id)) {
        return fail(req, res, 'You cannot delete your own logged-in account.');
    }
    await run(req, res, 'DELETE FROM users WHERE user_id = ?', [id], 'User account deleted.');
}));

module.exports = router;
