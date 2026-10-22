/**
 * Centers page: Vaccination Centers Management
 */
App.init().then(async () => {
    const form = document.getElementById('centerForm');
    const q = App.initSearch('centers.html');

    // Edit mode (?edit=ID)
    const editId = parseInt(App.param('edit'), 10);
    if (form && editId) {
        const { row } = await App.api('GET', `/api/centers/${editId}`);
        if (row) {
            App.editMode(form, { title: 'Edit Center', cancelHref: 'centers.html', button: 'Update Center' });
            form.center_id.value   = row.center_id;
            form.center_name.value = row.center_name;
            form.district.value    = row.district;
            form.state.value       = row.state;
        }
    }

    if (form) {
        App.bindForm(form, data => {
            const id = parseInt(data.center_id, 10) || 0;
            return id > 0
                ? { method: 'PUT',  url: `/api/centers/${id}`, body: data, redirect: 'centers.html' }
                : { method: 'POST', url: '/api/centers',       body: data, redirect: 'centers.html' };
        });
    }

    // Listing
    const { rows = [] } = await App.api('GET', '/api/centers?q=' + encodeURIComponent(q));
    document.getElementById('count').textContent = `${rows.length} center(s) registered`;

    const tbody = document.getElementById('rows');
    if (rows.length === 0) {
        tbody.innerHTML = App.emptyRow(6, 'No centers found matching your query.');
        return;
    }
    tbody.innerHTML = rows.map(r => {
        const vc = Number(r.total_vaccinations);
        return `
            <tr>
                <td>${h(r.center_id)}</td>
                <td><strong>${h(r.center_name)}</strong></td>
                <td>${h(r.district)}</td>
                <td><span class="pill pill-blue">${h(r.state)}</span></td>
                <td>
                    <span class="pill ${vc > 0 ? 'pill-green' : 'pill-yellow'}">
                        ${vc} administered
                    </span>
                </td>
                ${App.isStaff() ? `
                <td style="white-space:nowrap">
                    <a class="btn btn-ghost btn-sm" href="centers.html?edit=${Number(r.center_id)}">
                        <i class="fa-solid fa-pen"></i> Edit
                    </a>
                    ${App.isAdmin() ? `
                    <button class="btn btn-danger btn-sm" type="button" data-delete="${Number(r.center_id)}" data-name="${h(r.center_name)}">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>` : ''}
                </td>` : ''}
            </tr>`;
    }).join('');

    tbody.addEventListener('click', e => {
        const btn = e.target.closest('[data-delete]');
        if (!btn) return;
        App.del(`/api/centers/${btn.dataset.delete}`, `Delete ${btn.dataset.name}?`, 'centers.html');
    });
});
