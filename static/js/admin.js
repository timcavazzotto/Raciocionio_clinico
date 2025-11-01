let allStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupFilters();
});

async function loadData() {
    try {
        // Load students and series stats in parallel
        const [studentsRes, statsRes] = await Promise.all([
            fetch('/api/students'),
            fetch('/api/series-stats')
        ]);

        allStudents = await studentsRes.json();
        const seriesStats = await statsRes.json();

        displaySeriesStats(seriesStats);
        displayStudents(allStudents);
        document.getElementById('total-students').textContent = allStudents.length;

    } catch (error) {
        console.error('Error loading data:', error);
        alert('Erro ao carregar dados');
    }
}

function displaySeriesStats(stats) {
    const container = document.getElementById('series-stats');

    const html = Object.entries(stats).map(([serieName, data]) => `
        <div class="stat-card">
            <h3>${serieName}</h3>
            <p class="stat-value">${data.count} alunos</p>
            <p class="stat-subtitle">Acurácia: ${(data.avg_acuracia * 100).toFixed(1)}%</p>
            <p class="stat-subtitle">Autoconfiança: ${(data.avg_autoconfianca * 100).toFixed(1)}%</p>
        </div>
    `).join('');

    container.innerHTML = html;
}

function displayStudents(students) {
    const tbody = document.getElementById('students-tbody');

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">Nenhum aluno encontrado</td></tr>';
        return;
    }

    const html = students.map(student => `
        <tr>
            <td><strong>${student.initials}</strong></td>
            <td><code>${student.username}</code></td>
            <td>Série ${student.serie}</td>
            <td><span class="badge badge-success">Ativo</span></td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
}

function setupFilters() {
    const serieFilter = document.getElementById('serie-filter');

    serieFilter.addEventListener('change', () => {
        const filterValue = serieFilter.value;

        if (filterValue === '') {
            displayStudents(allStudents);
        } else {
            const filtered = allStudents.filter(s => s.serie === parseInt(filterValue));
            displayStudents(filtered);
        }
    });
}
