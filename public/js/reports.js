/**
 * Reports page: 7 SQL Analytical Reports & Print Layout
 */

/** Render any result set as a styled HTML data table */
function renderTable(columns, rows, empty = 'No records found.') {
    if (!rows || rows.length === 0) {
        return `<div class='table-wrap'><table><tr class='empty-row'><td><i class='fa-solid fa-inbox'></i> ${h(empty)}</td></tr></table></div>`;
    }
    const label = c => c.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
    return `<div class='table-wrap'><table><thead><tr>${columns.map(c => `<th>${h(label(c))}</th>`).join('')}</tr></thead><tbody>` +
        rows.map(r => `<tr>${columns.map(c => `<td>${h(r[c])}</td>`).join('')}</tr>`).join('') +
        '</tbody></table></div>';
}

App.init().then(async () => {
    const { reports = [] } = await App.api('GET', '/api/reports');
    document.getElementById('reports').outerHTML = reports.map((rep, index) => `
<div class="card">
    <div class="card-header">
        <div>
            <h2>
                <i class="fa-solid ${rep.icon}" style="color:var(--primary);margin-right:8px"></i>
                ${index + 1}. ${h(rep.title)}
            </h2>
            <p style="font-size:13px;color:var(--muted);margin-top:3px">${h(rep.desc)}</p>
        </div>
    </div>
    ${renderTable(rep.columns, rep.rows, 'No data matching this report criteria.')}
</div>`).join('');
});
