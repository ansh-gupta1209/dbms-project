/**
 * Dashboard page: Analytics with Live Chart.js Visuals
 */
App.init().then(async user => {
    document.getElementById('welcomeName').textContent = user.full_name;

    const data = await App.api('GET', '/api/dashboard');
    if (!data.ok) return App.flash('error', data.error);

    document.querySelectorAll('[data-stat]').forEach(el => {
        el.textContent = data.stats[el.dataset.stat];
    });

    const tbody = document.getElementById('recent');
    tbody.innerHTML = data.recent.length === 0
        ? '<tr class="empty-row"><td colspan="4">No vaccinations recorded yet.</td></tr>'
        : data.recent.map(r => `
            <tr>
                <td>${h(r.citizen_name)}</td>
                <td><span class="pill pill-blue">${h(r.vaccine_name)}</span></td>
                <td>${h(r.center_name)}</td>
                <td>${h(r.vaccination_date)}</td>
            </tr>`).join('');

    Chart.defaults.font.family = '"Segoe UI", Arial, sans-serif';
    Chart.defaults.color = '#64748b';

    // Monthly trend
    new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: data.months,
            datasets: [{
                label: 'Doses',
                data: data.doses,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,.1)',
                tension: .4,
                fill: true,
                pointBackgroundColor: '#2563eb',
                pointRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // Vaccine pie
    new Chart(document.getElementById('vaccineChart'), {
        type: 'doughnut',
        data: {
            labels: data.vnames,
            datasets: [{
                data: data.vcounts,
                backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed'],
                borderWidth: 2, borderColor: '#fff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            cutout: '60%'
        }
    });
});
