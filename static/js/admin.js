// Toast notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Add new grade
document.getElementById('add-grade-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentId = document.getElementById('student-select').value;
    const instrumentName = document.getElementById('instrument-input').value;
    const score = parseFloat(document.getElementById('score-input').value);
    const maxScore = parseFloat(document.getElementById('max-score-input').value);
    const notes = document.getElementById('notes-input').value;

    try {
        const response = await fetch('/api/grades', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: studentId,
                instrument_name: instrumentName,
                score: score,
                max_score: maxScore,
                notes: notes
            })
        });

        if (response.ok) {
            showToast('Nota adicionada com sucesso!');
            e.target.reset();

            // Refresh the student grades view if it's open
            const viewStudentSelect = document.getElementById('view-student-select');
            if (viewStudentSelect.value == studentId) {
                loadStudentGrades(studentId);
            }
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao adicionar nota', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Erro ao adicionar nota', true);
    }
});

// View student grades
document.getElementById('view-student-select').addEventListener('change', async (e) => {
    const studentId = e.target.value;

    if (!studentId) {
        document.getElementById('student-grades-section').style.display = 'none';
        return;
    }

    loadStudentGrades(studentId);
});

async function loadStudentGrades(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}/grades`);
        const grades = await response.json();

        const studentSelect = document.getElementById('view-student-select');
        const studentName = studentSelect.options[studentSelect.selectedIndex].text;

        document.getElementById('student-name').textContent = `Notas de ${studentName}`;
        document.getElementById('student-grades-section').style.display = 'block';

        displayStudentGrades(grades);
    } catch (error) {
        console.error('Error loading student grades:', error);
        showToast('Erro ao carregar notas do aluno', true);
    }
}

function displayStudentGrades(grades) {
    const tbody = document.getElementById('student-grades-tbody');

    if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhuma nota encontrada para este aluno</td></tr>';
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
                <td>
                    <button class="btn btn-danger" onclick="deleteGrade(${grade.id})">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteGrade(gradeId) {
    if (!confirm('Tem certeza que deseja excluir esta nota?')) {
        return;
    }

    try {
        const response = await fetch(`/api/grades/${gradeId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Nota excluída com sucesso!');

            // Refresh the current view
            const studentId = document.getElementById('view-student-select').value;
            if (studentId) {
                loadStudentGrades(studentId);
            }
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao excluir nota', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Erro ao excluir nota', true);
    }
}

// Make deleteGrade available globally
window.deleteGrade = deleteGrade;
