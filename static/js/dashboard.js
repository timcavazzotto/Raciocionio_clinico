// Global variables
let myAssessment = null;
let classStats = null;
let classData = null;
let radarChart = null;
let casosChart = null;
let scatterChart = null;

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
        createScatterChart();
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

// Create Scatter Plot showing position in class
function createScatterChart() {
    const ctx = document.getElementById('scatterChart');
    const dimNames = Object.keys(myAssessment.assessment.dimensoes);

    // Prepare datasets
    const datasets = [];

    // Add all classmates' data (gray points)
    const classmatePoints = [];
    const myPoints = [];

    dimNames.forEach((dimName, idx) => {
        classData.forEach(student => {
            const value = student.dimensoes[dimName];
            const point = { x: idx, y: value };

            if (student.is_me) {
                myPoints.push(point);
            } else {
                classmatePoints.push(point);
            }
        });
    });

    // Classmates dataset (gray)
    datasets.push({
        label: 'Colegas de Turma',
        data: classmatePoints,
        backgroundColor: 'rgba(156, 163, 175, 0.5)',
        borderColor: 'rgba(156, 163, 175, 0.8)',
        pointRadius: 4,
        pointHoverRadius: 6
    });

    // My data (colored)
    datasets.push({
        label: 'Você',
        data: myPoints,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'star'
    });

    // Add mean lines
    const meanLine = dimNames.map((name, idx) => ({
        x: idx,
        y: classStats.dimensoes[name].mean
    }));

    datasets.push({
        label: 'Média',
        data: meanLine,
        type: 'line',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
    });

    // Add mean + std and mean - std lines
    const upperLine = dimNames.map((name, idx) => ({
        x: idx,
        y: classStats.dimensoes[name].mean + classStats.dimensoes[name].std
    }));

    const lowerLine = dimNames.map((name, idx) => ({
        x: idx,
        y: Math.max(0, classStats.dimensoes[name].mean - classStats.dimensoes[name].std)
    }));

    datasets.push({
        label: 'Média + DP',
        data: upperLine,
        type: 'line',
        borderColor: 'rgba(16, 185, 129, 0.4)',
        borderWidth: 1,
        borderDash: [3, 3],
        fill: false,
        pointRadius: 0
    });

    datasets.push({
        label: 'Média - DP',
        data: lowerLine,
        type: 'line',
        borderColor: 'rgba(16, 185, 129, 0.4)',
        borderWidth: 1,
        borderDash: [3, 3],
        fill: false,
        pointRadius: 0
    });

    if (scatterChart) scatterChart.destroy();

    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -0.5,
                    max: dimNames.length - 0.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return dimNames[value] || '';
                        }
                    },
                    grid: {
                        display: true
                    }
                },
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
                            const dimName = dimNames[Math.round(context.parsed.x)];
                            return dimName + ': ' + (context.parsed.y * 100).toFixed(1) + '%';
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
