/**
 * Vaccinations page: Inoculation Ledger
 * The database trigger trg_vaccinations_before_insert blocks extra doses beyond doses_required.
 */
App.init().then(async () => {
    const card = document.getElementById('doseCard');
    const q = App.initSearch('vaccinations.html');
    const today = App.today();

    if (card) {
        const opts = await App.api('GET', '/api/vaccinations/options');
        const centerOptions = selected => opts.centers.map(c => `
                        <option value="${Number(c.center_id)}" ${c.center_id == selected ? 'selected' : ''}>
                            ${h(c.center_name)} (${h(c.district)})
                        </option>`).join('');

        const editId = parseInt(App.param('edit'), 10);
        const edit = editId ? (await App.api('GET', `/api/vaccinations/${editId}`)).row : null;

        if (edit) {
            // Only center and date can be changed, preserving integrity
            card.innerHTML = `
    <div class="card-header">
        <h2><i class="fa-solid fa-pen-to-square" style="color:var(--warning);margin-right:6px"></i>Edit Record #${Number(edit.vaccination_id)}</h2>
        <a href="vaccinations.html" class="btn btn-ghost btn-sm"><i class="fa-solid fa-xmark"></i> Cancel</a>
    </div>
    <div class="note-box">
        <i class="fa-solid fa-info-circle"></i>
        <span>Editing vaccination for <strong>${h(edit.citizen_name)}</strong> (${h(edit.vaccine_name)}). Citizen and vaccine cannot be changed to prevent dosage bypass.</span>
    </div>
    <form method="post" id="editForm">
        <div class="form-grid">
            <div class="form-group">
                <label>Center</label>
                <select name="center_id" required>${centerOptions(edit.center_id)}
                </select>
            </div>
            <div class="form-group">
                <label>Vaccination Date</label>
                <input type="date" name="vaccination_date" required max="${today}" value="${h(edit.vaccination_date)}">
            </div>
            <div class="form-group" style="justify-content:flex-end;">
                <label>&nbsp;</label>
                <button class="btn btn-success" type="submit">
                    <i class="fa-solid fa-floppy-disk"></i> Update Record
                </button>
            </div>
        </div>
    </form>`;
            App.bindForm(document.getElementById('editForm'), data => ({
                method: 'PUT', url: `/api/vaccinations/${Number(edit.vaccination_id)}`, body: data, redirect: 'vaccinations.html',
            }));
        } else {
            const form = document.getElementById('addForm');
            form.citizen_id.insertAdjacentHTML('beforeend', opts.citizens.map(c => `
                        <option value="${Number(c.citizen_id)}">
                            ${h(c.citizen_name)} (Mobile: ${h(c.mobile)})
                        </option>`).join(''));
            form.vaccine_id.insertAdjacentHTML('beforeend', opts.vaccines.map(v => `
                        <option value="${Number(v.vaccine_id)}">
                            ${h(v.vaccine_name)} (${Number(v.doses_required)} dose course)
                        </option>`).join(''));
            form.center_id.insertAdjacentHTML('beforeend', centerOptions(null));
            form.vaccination_date.max = today;
            form.vaccination_date.value = today;
            App.bindForm(form, data => ({ method: 'POST', url: '/api/vaccinations', body: data, redirect: 'vaccinations.html' }));
        }
    }

    // Listing
    const { rows = [] } = await App.api('GET', '/api/vaccinations?q=' + encodeURIComponent(q));
    document.getElementById('count').textContent = `${rows.length} record(s)`;

    const tbody = document.getElementById('rows');
    if (rows.length === 0) {
        tbody.innerHTML = App.emptyRow(8, 'No vaccination records found.');
        return;
    }
    tbody.innerHTML = rows.map(r => `
            <tr>
                <td>${h(r.vaccination_id)}</td>
                <td><strong>${h(r.citizen_name)}</strong></td>
                <td><span class="pill pill-blue">${h(r.vaccine_name)}</span></td>
                <td><span class="pill pill-green">${h(r.dose)}</span></td>
                <td>${h(r.center_name)}</td>
                <td>${h(r.district)}</td>
                <td>${h(r.vaccination_date)}</td>
                ${App.isStaff() ? `
                <td style="white-space:nowrap">
                    <a class="btn btn-ghost btn-sm" href="vaccinations.html?edit=${Number(r.vaccination_id)}">
                        <i class="fa-solid fa-pen"></i> Edit
                    </a>
                    ${App.isAdmin() ? `
                    <button class="btn btn-danger btn-sm" type="button" data-delete="${Number(r.vaccination_id)}" data-name="${h(r.citizen_name)}">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>` : ''}
                </td>` : ''}
            </tr>`).join('');

    tbody.addEventListener('click', e => {
        const btn = e.target.closest('[data-delete]');
        if (!btn) return;
        App.del(`/api/vaccinations/${btn.dataset.delete}`, `Delete this record for ${btn.dataset.name}?`, 'vaccinations.html');
    });
});
