/**
 * Users page: Admin User Management & Password Resets
 */

/** Format 'YYYY-MM-DD HH:MM:SS' as e.g. '22 Oct 2026, 03:15 PM' */
function formatLogin(s) {
    const [d, t = '00:00:00'] = s.split(' ');
    const [y, m, day] = d.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const h12 = hh % 12 || 12;
    const pad = n => String(n).padStart(2, '0');
    return `${pad(day)} ${months[m - 1]} ${y}, ${pad(h12)}:${pad(mm)} ${hh < 12 ? 'AM' : 'PM'}`;
}

App.init().then(async () => {
    App.bindForm(document.getElementById('createForm'), data => ({
        method: 'POST', url: '/api/users', body: data, redirect: 'users.html',
    }));

    const me = Number(App.user.id);
    const res = await App.api('GET', '/api/users');
    if (!res.ok) {
        // Not an administrator: the server queued "Administrator access required."
        location.href = 'index.html';
        return;
    }
    const rows = res.rows;
    document.getElementById('count').textContent = `${rows.length} account(s) registered`;

    const tbody = document.getElementById('rows');
    tbody.innerHTML = rows.map(u => {
        const id = Number(u.user_id);
        const opt = (v, label) => `<option value="${v}" ${u.role === v ? 'selected' : ''}>${label}</option>`;
        return `
            <tr>
                <td>${h(u.user_id)}</td>
                <td>
                    <strong>${h(u.full_name)}</strong>
                    ${id === me ? '<span style="font-size:11px;color:var(--primary);font-weight:700;margin-left:4px;">(You)</span>' : ''}
                </td>
                <td><code>@${h(u.username)}</code></td>
                <td>
                    <span class="badge-role badge-${h(u.role)}">${h(App.ucfirst(u.role))}</span>
                </td>
                <td>
                    ${u.last_login ? h(formatLogin(u.last_login)) : '<span style="color:var(--muted)">Never</span>'}
                </td>
                <td style="white-space:nowrap">
                    <!-- Change role -->
                    <form method="post" class="inline" style="margin-right:6px">
                        <select name="role" data-role-for="${id}" style="padding:4px 8px;font-size:12px;border-radius:6px;">
                            ${opt('viewer', 'Viewer')}
                            ${opt('staff', 'Staff')}
                            ${opt('admin', 'Admin')}
                        </select>
                    </form>

                    <!-- Reset Password prompt -->
                    <button class="btn btn-ghost btn-sm" type="button" data-reset="${id}" data-username="${h(u.username)}">
                        <i class="fa-solid fa-key"></i> Key
                    </button>

                    <!-- Delete button -->
                    ${id !== me ? `
                    <button class="btn btn-danger btn-sm" type="button" data-delete="${id}" data-username="${h(u.username)}">
                        <i class="fa-solid fa-trash"></i>
                    </button>` : ''}
                </td>
            </tr>`;
    }).join('');

    tbody.addEventListener('change', e => {
        const sel = e.target.closest('[data-role-for]');
        if (sel) App.send('PUT', `/api/users/${sel.dataset.roleFor}/role`, { role: sel.value }, 'users.html');
    });

    tbody.addEventListener('click', e => {
        const reset = e.target.closest('[data-reset]');
        if (reset) {
            const p = prompt(`Enter new password for @${reset.dataset.username}:`);
            if (p && p.length >= 6) {
                App.send('PUT', `/api/users/${reset.dataset.reset}/password`, { new_password: p }, 'users.html');
            } else if (p) {
                alert('Password must be at least 6 characters.');
            }
            return;
        }
        const del = e.target.closest('[data-delete]');
        if (del) App.del(`/api/users/${del.dataset.delete}`, `Delete account @${del.dataset.username}?`, 'users.html');
    });
});
