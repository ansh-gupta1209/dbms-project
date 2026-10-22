/**
 * Citizens page: Citizen Master Registry & Masked Aadhaar
 */
App.init().then(async () => {
    const form = document.getElementById('citizenForm');
    const q = App.initSearch('citizens.html');

    // Edit mode (?edit=ID)
    const editId = parseInt(App.param('edit'), 10);
    if (form && editId) {
        const { row } = await App.api('GET', `/api/citizens/${editId}`);
        if (row) {
            App.editMode(form, { title: 'Edit Citizen', cancelHref: 'citizens.html', button: 'Update Citizen' });
            form.citizen_id.value   = row.citizen_id;
            form.citizen_name.value = row.citizen_name;
            form.aadhaar_no.value   = row.aadhaar_no;
            form.mobile.value       = row.mobile;
        }
    }

    if (form) {
        App.bindForm(form, data => {
            const id = parseInt(data.citizen_id, 10) || 0;
            return id > 0
                ? { method: 'PUT',  url: `/api/citizens/${id}`, body: data, redirect: 'citizens.html' }
                : { method: 'POST', url: '/api/citizens',       body: data, redirect: 'citizens.html' };
        });
    }

    // Listing
    const { rows = [] } = await App.api('GET', '/api/citizens?q=' + encodeURIComponent(q));
    document.getElementById('count').textContent = `${rows.length} record(s) found`;

    const tbody = document.getElementById('rows');
    if (rows.length === 0) {
        tbody.innerHTML = App.emptyRow(6, 'No citizens found.');
        return;
    }
    tbody.innerHTML = rows.map(r => {
        const d = Number(r.doses_taken);
        const cls = d === 0 ? 'pill-red' : (d >= 2 ? 'pill-green' : 'pill-yellow');
        return `
            <tr>
                <td>${h(r.citizen_id)}</td>
                <td><strong>${h(r.citizen_name)}</strong></td>
                <td><code>XXXX XXXX ${h(String(r.aadhaar_no).slice(-4))}</code></td>
                <td>${h(r.mobile)}</td>
                <td><span class="pill ${cls}">${d} dose${d !== 1 ? 's' : ''}</span></td>
                ${App.isStaff() ? `
                <td style="white-space:nowrap">
                    <a class="btn btn-ghost btn-sm" href="citizens.html?edit=${Number(r.citizen_id)}">
                        <i class="fa-solid fa-pen"></i> Edit
                    </a>
                    ${App.isAdmin() ? `
                    <button class="btn btn-danger btn-sm" type="button" data-delete="${Number(r.citizen_id)}" data-name="${h(r.citizen_name)}">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>` : ''}
                </td>` : ''}
            </tr>`;
    }).join('');

    tbody.addEventListener('click', e => {
        const btn = e.target.closest('[data-delete]');
        if (!btn) return;
        App.del(`/api/citizens/${btn.dataset.delete}`,
            `Delete ${btn.dataset.name} and all their vaccination records?`, 'citizens.html');
    });
});
