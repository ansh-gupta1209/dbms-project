/**
 * COVID Vaccination Management System - Shared Frontend Scripts
 * Layout (sidebar + user card), API client, flash notifications, clock, helpers.
 */

const App = (() => {
    const NAV = [
        ['index.html',        'Dashboard',    'fa-gauge-high'],
        ['citizens.html',     'Citizens',     'fa-users'],
        ['centers.html',      'Centers',      'fa-hospital'],
        ['vaccines.html',     'Vaccines',     'fa-vial'],
        ['vaccinations.html', 'Vaccinations', 'fa-syringe'],
        ['reports.html',      'Reports',      'fa-chart-bar'],
    ];

    let user = null;

    /** Escape output string against Cross-Site Scripting (XSS) */
    function h(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]
        ));
    }

    const ucfirst = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

    /** Current URL query parameter */
    const param = name => new URLSearchParams(location.search).get(name);

    /** JSON API client */
    async function api(method, url, body) {
        const res = await fetch(url, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : {},
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'same-origin',
        });
        if (res.status === 401 && !url.startsWith('/api/auth/login')) {
            location.href = 'login.html';
            throw new Error('Not signed in');
        }
        let data;
        try { data = await res.json(); } catch { data = { ok: false, error: 'Unexpected server response.' }; }
        return data;
    }

    /** Show a flash notification at the top of the content area */
    function flash(type, msg) {
        const content = document.querySelector('.content');
        if (!content) return;
        const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
        const el = document.createElement('div');
        el.className = `flash ${type}`;
        el.innerHTML = `<i class='fa-solid ${icon}'></i> ${h(msg)}`;
        content.prepend(el);
        autoDismiss(el);
    }

    function autoDismiss(el) {
        setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.opacity = '0';
            el.style.transform = 'translateY(-8px)';
            setTimeout(() => el.remove(), 500);
        }, 5000);
    }

    /** Render navigation sidebar with role-aware links and the user profile card */
    function renderSidebar() {
        const current = location.pathname.split('/').pop() || 'index.html';
        const nav = NAV.slice();
        if (user.role === 'admin') nav.push(['users.html', 'Manage Users', 'fa-user-shield']);
        const role = user.role || 'viewer';
        const initials = (user.full_name || 'U').charAt(0).toUpperCase();

        document.getElementById('sidebar').innerHTML = `
    <a class="sidebar-logo" href="index.html">
        <div class="logo-icon"><i class="fa-solid fa-syringe"></i></div>
        <div class="logo-text">
            <strong>COVID Vaccination</strong>
            <span>Management System</span>
        </div>
    </a>

    <nav class="sidebar-nav">
        <div class="nav-section">Main Menu</div>
        ${nav.map(([file, label, icon]) => `
            <a href="${file}" class="${current === file ? 'active' : ''}">
                <i class="fa-solid ${icon}"></i>
                ${label}
            </a>`).join('')}
    </nav>

    <div class="sidebar-footer">
        <div class="user-card">
            <div class="user-avatar avatar-${h(role)}">${h(initials)}</div>
            <div class="user-info">
                <strong>${h(user.full_name)}</strong>
                <span class="badge-role badge-${h(role)}">${h(ucfirst(role))}</span>
            </div>
        </div>
        <a href="/logout" class="btn-logout">
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
        </a>
    </div>`;
    }

    /** Remove elements the current role may not see (data-role="staff|admin|readonly") */
    function applyRoleVisibility(root = document) {
        root.querySelectorAll('[data-role]').forEach(el => {
            const need = el.dataset.role;
            const show = need === 'staff'    ? isStaff()
                       : need === 'admin'    ? isAdmin()
                       : need === 'readonly' ? !isStaff()
                       : true;
            if (!show) el.remove();
        });
    }

    const isAdmin = () => user?.role === 'admin';
    const isStaff = () => user?.role === 'admin' || user?.role === 'staff';

    /** Bootstraps every authenticated page; resolves with the signed-in user */
    async function init() {
        const data = await api('GET', '/api/auth/me');
        user = data.user;
        renderSidebar();
        applyRoleVisibility();
        document.body.classList.remove('loading');
        if (data.flash) flash(data.flash[0], data.flash[1]);
        return user;
    }

    /** Collect a form's fields into a plain object */
    const formData = form => Object.fromEntries(new FormData(form).entries());

    /**
     * Submit a write request; the server queues the result as a flash message,
     * then the page navigates (like the PHP post/redirect/get flow).
     */
    async function send(method, url, body, redirectTo) {
        try {
            await api(method, url, body);
        } catch (e) {
            if (e.message === 'Not signed in') return;
        }
        location.href = redirectTo;
    }

    /** Bind a <form> to submit via the API and redirect afterwards */
    function bindForm(form, getRequest) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const { method, url, body, redirect } = getRequest(formData(form));
            send(method, url, body, redirect);
        });
    }

    /** Today's date in YYYY-MM-DD (local time) */
    function today() {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    /** Wire the GET search bar: keep the query in the box and show "Clear" when searching */
    function initSearch(page) {
        const q = (param('q') || '').trim();
        const form = document.querySelector('form.search-bar');
        if (!form) return q;
        form.querySelector('input[name="q"]').value = q;
        if (q !== '') {
            form.insertAdjacentHTML('beforeend',
                `<a class="btn btn-ghost btn-sm" href="${page}"><i class="fa-solid fa-xmark"></i> Clear</a>`);
        }
        return q;
    }

    /** Switch a card's add-form into edit mode: new title, "Cancel" link and save button label */
    function editMode(form, { title, cancelHref, button }) {
        const header = form.closest('.card').querySelector('.card-header');
        header.querySelector('h2').innerHTML =
            `<i class="fa-solid fa-pen-to-square" style="color:var(--warning);margin-right:6px"></i>${title}`;
        header.insertAdjacentHTML('beforeend',
            `<a href="${cancelHref}" class="btn btn-ghost btn-sm"><i class="fa-solid fa-xmark"></i> Cancel</a>`);
        const btn = form.querySelector('button[type="submit"]');
        if (btn && button) btn.innerHTML = `\n                    <i class="fa-solid fa-floppy-disk"></i>\n                    ${button}\n                `;
    }

    /** Confirm, then delete through the API and reload the page */
    function del(url, message, redirectTo) {
        if (confirm(message)) send('DELETE', url, null, redirectTo);
    }

    /** "No records" table row */
    const emptyRow = (cols, msg) =>
        `<tr class="empty-row"><td colspan="${cols}"><i class="fa-solid fa-inbox"></i> ${h(msg)}</td></tr>`;

    return {
        h, ucfirst, param, api, flash, init, send, bindForm, formData, today, initSearch, editMode, del, emptyRow,
        isAdmin, isStaff, get user() { return user; },
    };
})();

const h = App.h;

// 1. Live Real-Time Header Clock
(function initClock() {
    function tick() {
        const el = document.getElementById('clock');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' · ' +
                             now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        setTimeout(tick, 1000);
    }
    tick();
})();

// 2. Mobile Responsive Sidebar Drawer Controls
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}
