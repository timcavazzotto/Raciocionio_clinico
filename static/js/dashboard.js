// Global variables
let myAssessment = null;
let classStats = null;
let classData = null;
let radarChart = null;
let casosChart = null;

// Load all data when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    setupTabs();
});

// Load all assessment data
async function loadAllData() {
    try {
        // Load data in parallel
        const [assessmentRes, statsRes, dataRes] = await Promise.all([
            fetch('/api/my-assessment'),
            fetch('/api/class-stats'),
            fetch('/api/class-data')
        ]);

        myAssessment = await assessmentRes.json();
        classStats = await statsRes.json();
        classData = await dataRes.json();

        // Display all visualizations
        displayStats();
        createRadarChart();
        createCasosChart();
        populateTables();

    } catch (error) {
        console.error('Error loading data:', error);
        alert('Erro ao carregar dados. Por favor, recarregue a página.');
    }
}

// Display summary statistics
function displayStats() {
    const autoconfianca = myAssessment.assessment.parametros_gerais['Autoconfiança'];
    const acuracia = myAssessment.assessment.parametros_gerais['Acurácia'];

    document.getElementById('autoconfianca-value').textContent = (autoconfianca * 100).toFixed(1) + '%';
    document.getElementById('acuracia-value').textContent = (acuracia * 100).toFixed(1) + '%';
    document.getElementById('class-size').textContent = classData.length;

    // Calculate position in class
    const autoconfiancas = classData.map(d => d.parametros_gerais['Autoconfiança']).sort((a, b) => b - a);
    const acuracias = classData.map(d => d.parametros_gerais['Acurácia']).sort((a, b) => b - a);

    const autoPos = autoconfiancas.indexOf(autoconfianca) + 1;
    const acuPos = acuracias.indexOf(acuracia) + 1;

    document.getElementById('autoconfianca-position').textContent = `${autoPos}º de ${classData.length}`;
    document.getElementById('acuracia-position').textContent = `${acuPos}º de ${classData.length}`;
}

// Create Radar Chart for Clinical Reasoning Dimensions
function createRadarChart() {
    const ctx = document.getElementById('radarChart');
    const dims = myAssessment.assessment.dimensoes;
    const dimNames = Object.keys(dims);
    const myValues = Object.values(dims);
    const classAvgs = dimNames.map(name => classStats.dimensoes[name].mean);

    if (radarChart) radarChart.destroy();

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: dimNames,
            datasets: [
                {
                    label: 'Minhas Notas',
                    data: myValues,
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                    pointRadius: 4
                },
                {
                    label: 'Média da Turma',
                    data: classAvgs,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        stepSize: 0.2,
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + (context.parsed.r * 100).toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Create Bar Chart for Clinical Cases
function createCasosChart() {
    const ctx = document.getElementById('casosChart');
    const casos = myAssessment.assessment.casos_clinicos;
    const casoNames = Object.keys(casos);
    const myValues = Object.values(casos);
    const classAvgs = casoNames.map(name => classStats.casos_clinicos[name].mean);

    if (casosChart) casosChart.destroy();

    casosChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: casoNames,
            datasets: [
                {
                    label: 'Minhas Notas',
                    data: myValues,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Média da Turma',
                    data: classAvgs,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + (context.parsed.y * 100).toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Populate tables with detailed data
function populateTables() {
    populateDimensoesTable();
    populateCasosTable();
}

function populateDimensoesTable() {
    const tbody = document.getElementById('dimensoes-tbody');
    const dims = myAssessment.assessment.dimensoes;

    const rows = Object.entries(dims).map(([name, value]) => {
        const stats = classStats.dimensoes[name];
        const position = calculatePosition(value, classData.map(d => d.dimensoes[name]));

        return `
            <tr>
                <td><strong>${name}</strong></td>
                <td>${(value * 100).toFixed(1)}%</td>
                <td>${(stats.mean * 100).toFixed(1)}%</td>
                <td>±${(stats.std * 100).toFixed(1)}%</td>
                <td>${position}º de ${classData.length}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join('');
}

function populateCasosTable() {
    const tbody = document.getElementById('casos-tbody');
    const casos = myAssessment.assessment.casos_clinicos;

    const rows = Object.entries(casos).map(([name, value]) => {
        const stats = classStats.casos_clinicos[name];
        const position = calculatePosition(value, classData.map(d => d.casos_clinicos[name]));

        return `
            <tr>
                <td><strong>${name}</strong></td>
                <td>${(value * 100).toFixed(1)}%</td>
                <td>${(stats.mean * 100).toFixed(1)}%</td>
                <td>±${(stats.std * 100).toFixed(1)}%</td>
                <td>${position}º de ${classData.length}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join('');
}

// Helper function to calculate position
function calculatePosition(myValue, allValues) {
    const sorted = allValues.slice().sort((a, b) => b - a);
    return sorted.indexOf(myValue) + 1;
}

// Setup tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');

            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content visibility
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}
