let myGradesChart = null;
let comparisonChart = null;

// Fetch and display student grades
async function loadGrades() {
    try {
        const response = await fetch('/api/my-grades');
        const grades = await response.json();

        displayStats(grades);
        displayGradesTable(grades);
        createMyGradesChart(grades);

        // Load class averages for comparison
        const avgResponse = await fetch('/api/class-averages');
        const classAverages = await avgResponse.json();
        createComparisonChart(grades, classAverages);
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

// Display statistics
function displayStats(grades) {
    const totalGrades = grades.length;
    document.getElementById('total-grades').textContent = totalGrades;

    if (totalGrades === 0) {
        document.getElementById('average-grade').textContent = '-';
        document.getElementById('performance').textContent = '-';
        return;
    }

    const totalPercentage = grades.reduce((sum, grade) => sum + grade.percentage, 0);
    const averagePercentage = totalPercentage / totalGrades;

    document.getElementById('average-grade').textContent = averagePercentage.toFixed(1) + '%';
    document.getElementById('performance').textContent = averagePercentage.toFixed(1) + '%';
}

// Display grades in table
function displayGradesTable(grades) {
    const tbody = document.getElementById('grades-tbody');

    if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhuma nota encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = grades.map(grade => {
        const percentage = grade.percentage;
        let gradeClass = 'grade-poor';
        if (percentage >= 90) gradeClass = 'grade-excellent';
        else if (percentage >= 70) gradeClass = 'grade-good';
        else if (percentage >= 50) gradeClass = 'grade-average';

        const date = new Date(grade.date);
        const formattedDate = date.toLocaleDateString('pt-BR');

        return `
            <tr>
                <td>${grade.instrument_name}</td>
                <td>${grade.score.toFixed(1)}</td>
                <td>${grade.max_score.toFixed(1)}</td>
                <td class="grade-percentage ${gradeClass}">${percentage.toFixed(1)}%</td>
                <td>${formattedDate}</td>
                <td>${grade.notes || '-'}</td>
            </tr>
        `;
    }).join('');
}

// Create chart showing student's grades by instrument
function createMyGradesChart(grades) {
    const ctx = document.getElementById('myGradesChart');

    if (myGradesChart) {
        myGradesChart.destroy();
    }

    if (grades.length === 0) {
        ctx.parentElement.innerHTML = '<p class="no-data">Nenhuma nota disponível para exibir</p>';
        return;
    }

    const labels = grades.map(g => g.instrument_name);
    const data = grades.map(g => g.percentage);

    myGradesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Minha Nota (%)',
                data: data,
                backgroundColor: 'rgba(37, 99, 235, 0.7)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Create comparison chart (student vs class average)
function createComparisonChart(myGrades, classAverages) {
    const ctx = document.getElementById('comparisonChart');

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    if (myGrades.length === 0 || classAverages.length === 0) {
        ctx.parentElement.innerHTML = '<p class="no-data">Dados insuficientes para comparação</p>';
        return;
    }

    // Group my grades by instrument
    const myGradesByInstrument = {};
    myGrades.forEach(grade => {
        if (!myGradesByInstrument[grade.instrument_name]) {
            myGradesByInstrument[grade.instrument_name] = [];
        }
        myGradesByInstrument[grade.instrument_name].push(grade.percentage);
    });

    // Calculate my average per instrument
    const myAverages = {};
    Object.keys(myGradesByInstrument).forEach(instrument => {
        const grades = myGradesByInstrument[instrument];
        myAverages[instrument] = grades.reduce((a, b) => a + b, 0) / grades.length;
    });

    // Get all unique instruments
    const instruments = [...new Set([
        ...Object.keys(myAverages),
        ...classAverages.map(ca => ca.instrument_name)
    ])];

    const myData = instruments.map(inst => myAverages[inst] || 0);
    const classData = instruments.map(inst => {
        const avg = classAverages.find(ca => ca.instrument_name === inst);
        return avg ? avg.percentage : 0;
    });

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: instruments,
            datasets: [
                {
                    label: 'Minha Média',
                    data: myData,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Média da Turma',
                    data: classData,
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
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadGrades);
