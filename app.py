from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import Config
from models import db, User, Grade
from sqlalchemy import func
import os

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash('Usuário ou senha inválidos', 'error')

    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.is_admin:
        return redirect(url_for('admin'))
    return render_template('dashboard.html', user=current_user)


@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('Acesso negado', 'error')
        return redirect(url_for('dashboard'))

    users = User.query.filter_by(is_admin=False).all()
    return render_template('admin.html', users=users)


# API Endpoints
@app.route('/api/my-grades')
@login_required
def get_my_grades():
    grades = Grade.query.filter_by(student_id=current_user.id).all()
    return jsonify([grade.to_dict() for grade in grades])


@app.route('/api/class-averages')
@login_required
def get_class_averages():
    # Get average scores grouped by instrument
    averages = db.session.query(
        Grade.instrument_name,
        func.avg(Grade.score).label('avg_score'),
        func.avg(Grade.max_score).label('avg_max_score')
    ).group_by(Grade.instrument_name).all()

    result = []
    for avg in averages:
        percentage = (avg.avg_score / avg.avg_max_score * 100) if avg.avg_max_score > 0 else 0
        result.append({
            'instrument_name': avg.instrument_name,
            'average_score': round(avg.avg_score, 2),
            'max_score': round(avg.avg_max_score, 2),
            'percentage': round(percentage, 2)
        })

    return jsonify(result)


@app.route('/api/students', methods=['GET'])
@login_required
def get_students():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    students = User.query.filter_by(is_admin=False).all()
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'username': s.username,
        'email': s.email
    } for s in students])


@app.route('/api/students/<int:student_id>/grades', methods=['GET'])
@login_required
def get_student_grades(student_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    grades = Grade.query.filter_by(student_id=student_id).all()
    return jsonify([grade.to_dict() for grade in grades])


@app.route('/api/grades', methods=['POST'])
@login_required
def add_grade():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    grade = Grade(
        student_id=data['student_id'],
        instrument_name=data['instrument_name'],
        score=data['score'],
        max_score=data.get('max_score', 10.0),
        notes=data.get('notes', '')
    )

    db.session.add(grade)
    db.session.commit()

    return jsonify({'message': 'Grade added successfully', 'grade': grade.to_dict()}), 201


@app.route('/api/grades/<int:grade_id>', methods=['PUT'])
@login_required
def update_grade(grade_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    grade = Grade.query.get_or_404(grade_id)
    data = request.json

    grade.instrument_name = data.get('instrument_name', grade.instrument_name)
    grade.score = data.get('score', grade.score)
    grade.max_score = data.get('max_score', grade.max_score)
    grade.notes = data.get('notes', grade.notes)

    db.session.commit()

    return jsonify({'message': 'Grade updated successfully', 'grade': grade.to_dict()})


@app.route('/api/grades/<int:grade_id>', methods=['DELETE'])
@login_required
def delete_grade(grade_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    grade = Grade.query.get_or_404(grade_id)
    db.session.delete(grade)
    db.session.commit()

    return jsonify({'message': 'Grade deleted successfully'})


# Create tables and sample data
def init_db():
    with app.app_context():
        db.create_all()

        # Check if admin exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@example.com',
                name='Administrador',
                is_admin=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print('Admin user created: username=admin, password=admin123')


if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
