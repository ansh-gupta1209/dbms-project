/**
 * Vaccines page: Approved Vaccine Protocols & Dosing Rules
 */
App.init().then(async () => {
    const form = document.getElementById('vaccineForm');
    const q = App.initSearch('vaccines.html');

    // Edit mode (?edit=ID)
    const editId = parseInt(App.param('edit'), 10);
    if (form && editId) {
        const { row } = await App.api('GET', `/api/vaccines/${editId}`);
        if (row) {
            App.editMode(form, { title: 'Edit Vaccine', cancelHref: 'vaccines.html', button: 'Update Vaccine' });
            form.vaccine_id.value     = row.vaccine_id;
            form.vaccine_name.value   = row.vaccine_name;
            form.manufacturer.value   = row.manufacturer;
            form.doses_required.value = String(row.doses_required);
        }
    }

    if (form) {
        App.bindForm(form, data => {
            const id = parseInt(data.vaccine_id, 10) || 0;
            return id > 0
                ? { method: 'PUT',  url: `/api/vaccines/${id}`, body: data, redirect: 'vaccines.html' }
                : { method: 'POST', url: '/api/vaccines',       body: data, redirect: 'vaccines.html' };
        });
    }

    // Listing
    const { rows = [] } = await App.api('GET', '/api/vaccines?q=' + encodeURIComponent(q));
    document.getElementById('count').textContent = `${rows.length} vaccine type(s)`;

    const tbody = document.getElementById('rows');
    if (rows.length === 0) {
        tbody.innerHTML = App.emptyRow(6, 'No vaccines found.');
        return;
    }
    tbody.innerHTML = rows.map(r => `
            <tr>
                <td>${h(r.vaccine_id)}</td>
                <td><strong>${h(r.vaccine_name)}</strong></td>
                <td>${h(r.manufacturer)}</td>
                <td>
                    <span class="pill pill-blue">
                        ${h(r.doses_required)} dose${r.doses_required > 1 ? 's' : ''}
                    </span>
                </td>
                <td>
                    <span class="pill pill-green">
                        ${h(r.doses_administered)} administered
                    </span>
                </td>
                ${App.isStaff() ? `
                <td style="white-space:nowrap">
                    <a class="btn btn-ghost btn-sm" href="vaccines.html?edit=${Number(r.vaccine_id)}">
                        <i class="fa-solid fa-pen"></i> Edit
                    </a>
                    ${App.isAdmin() ? `
                    <button class="btn btn-danger btn-sm" type="button" data-delete="${Number(r.vaccine_id)}" data-name="${h(r.vaccine_name)}">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>` : ''}
                </td>` : ''}
            </tr>`).join('');

    tbody.addEventListener('click', e => {
        const btn = e.target.closest('[data-delete]');
        if (!btn) return;
        App.del(`/api/vaccines/${btn.dataset.delete}`, `Delete ${btn.dataset.name}?`, 'vaccines.html');
    });
});
