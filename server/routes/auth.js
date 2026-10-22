/**
 * API: Login / Logout / Current session user
 */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authUser, wrap, str } = require('../middleware');

router.post('/login', wrap(async (req, res) => {
    const username = str(req.body.username);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (username === '' || password === '') {
        return res.status(400).json({ ok: false, error: 'Please enter both username and password.' });
    }

    const [rows] = await pool.execute(
        'SELECT user_id, username, password_hash, full_name, role FROM users WHERE username = ?',
        [username]
    );
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
    }

    // Regenerate session ID to prevent fixation
    req.session.regenerate(async err => {
        if (err) return res.status(500).json({ ok: false, error: 'Could not start session.' });
        req.session.authUser = {
            id:        user.user_id,
            username:  user.username,
            full_name: user.full_name,
            role:      user.role,
        };
        await pool.execute('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
        res.json({ ok: true });
    });
}));

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
    const user = authUser(req);
    if (!user) return res.status(401).json({ ok: false, error: 'Not signed in.' });
    // Hand over (and clear) any queued flash notification
    const flash = req.session.flash || null;
    delete req.session.flash;
    res.json({ ok: true, user, flash });
});

module.exports = router;
