from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import Config
from models import db, User, Assessment
from sqlalchemy import func
import statistics

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
        if current_user.first_login and not current_user.is_admin:
            return redirect(url_for('change_password'))
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)

            # Force password change on first login (except admin)
            if user.first_login and not user.is_admin:
                return redirect(url_for('change_password'))

            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash('RA ou senha inválidos', 'error')

    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/change-password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')

        # Validate current password (unless first login)
        if not current_user.first_login:
            if not current_user.check_password(current_password):
                flash('Senha atual incorreta', 'error')
                return render_template('change_password.html')

        # Validate new passwords match
        if new_password != confirm_password:
            flash('As senhas não conferem', 'error')
            return render_template('change_password.html')

        # Validate password strength (minimum 6 characters)
        if len(new_password) < 6:
            flash('A senha deve ter no mínimo 6 caracteres', 'error')
            return render_template('change_password.html')

        # Update password
        current_user.set_password(new_password)
        current_user.first_login = False
        db.session.commit()

        flash('Senha alterada com sucesso!', 'success')
        return redirect(url_for('dashboard'))

    return render_template('change_password.html')


@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.is_admin:
        return redirect(url_for('admin'))

    # Force password change on first login
    if current_user.first_login:
        return redirect(url_for('change_password'))

    return render_template('dashboard.html', user=current_user)


@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('Acesso negado', 'error')
        return redirect(url_for('dashboard'))

    users = User.query.filter_by(is_admin=False).order_by(User.serie, User.initials).all()
    return render_template('admin.html', users=users)


# API Endpoints for Students
@app.route('/api/my-assessment')
@login_required
def get_my_assessment():
    """Get assessment data for current user"""
    if current_user.is_admin:
        return jsonify({'error': 'Admin users do not have assessments'}), 403

    assessment = Assessment.query.filter_by(student_id=current_user.id).first()

    if not assessment:
        return jsonify({'error': 'No assessment found'}), 404

    return jsonify({
        'student': {
            'initials': current_user.initials,
            'serie': current_user.serie
        },
        'assessment': assessment.to_dict()
    })


@app.route('/api/class-stats')
@login_required
def get_class_stats():
    """Get class statistics (mean and std) for the same serie"""
    if current_user.is_admin:
        return jsonify({'error': 'Admin users do not have a serie'}), 403

    # Get all students from the same serie
    students_in_serie = User.query.filter_by(serie=current_user.serie, is_admin=False).all()
    student_ids = [s.id for s in students_in_serie]

    # Get all assessments for this serie
    assessments = Assessment.query.filter(Assessment.student_id.in_(student_ids)).all()

    if not assessments:
        return jsonify({'error': 'No assessments found for this serie'}), 404

    # Calculate statistics for each field
    casos = ['pac', 'cis', 'mio', 'ar', 'cc', 'ep', 'tep']
    dimensoes = ['dados_relevantes', 'resumo', 'diferencial', 'hp_justificativa',
                 'hp', 'conduta', 'sinais_sintomas', 'fisiopatologia']
    parametros = ['autoconfianca', 'acuracia']

    def calc_stats(values):
        if len(values) > 1:
            return {
                'mean': round(statistics.mean(values), 3),
                'std': round(statistics.stdev(values), 3),
                'min': round(min(values), 3),
                'max': round(max(values), 3)
            }
        elif len(values) == 1:
            return {
                'mean': round(values[0], 3),
                'std': 0,
                'min': round(values[0], 3),
                'max': round(values[0], 3)
            }
        return {'mean': 0, 'std': 0, 'min': 0, 'max': 0}

    stats = {
        'casos_clinicos': {},
        'dimensoes': {},
        'parametros_gerais': {}
    }

    # Calculate stats for casos clínicos
    for caso in casos:
        values = [getattr(a, caso) for a in assessments]
        stats['casos_clinicos'][caso.upper()] = calc_stats(values)

    # Calculate stats for dimensões
    dim_names = ['Dados Relevantes', 'Resumo', 'Diferencial', 'HP Justificativa',
                 'HP', 'Conduta', 'Sinais e Sintomas', 'Fisiopatologia']
    for dim, name in zip(dimensoes, dim_names):
        values = [getattr(a, dim) for a in assessments]
        stats['dimensoes'][name] = calc_stats(values)

    # Calculate stats for parametros gerais
    for param in parametros:
        values = [getattr(a, param) for a in assessments]
        param_name = 'Autoconfiança' if param == 'autoconfianca' else 'Acurácia'
        stats['parametros_gerais'][param_name] = calc_stats(values)

    return jsonify(stats)


@app.route('/api/class-data')
@login_required
def get_class_data():
    """Get all individual data points for scatter plot (anonymized except current user)"""
    if current_user.is_admin:
        return jsonify({'error': 'Admin users do not have a serie'}), 403

    # Get all students from the same serie
    students_in_serie = User.query.filter_by(serie=current_user.serie, is_admin=False).all()
    student_ids = [s.id for s in students_in_serie]

    # Get all assessments for this serie
    assessments = Assessment.query.filter(Assessment.student_id.in_(student_ids)).all()

    data_points = []
    for assessment in assessments:
        data_point = {
            'is_me': assessment.student_id == current_user.id,
            'casos_clinicos': {
                'PAC': assessment.pac,
                'CIS': assessment.cis,
                'MIO': assessment.mio,
                'AR': assessment.ar,
                'CC': assessment.cc,
                'EP': assessment.ep,
                'TEP': assessment.tep
            },
            'dimensoes': {
                'Dados Relevantes': assessment.dados_relevantes,
                'Resumo': assessment.resumo,
                'Diferencial': assessment.diferencial,
                'HP Justificativa': assessment.hp_justificativa,
                'HP': assessment.hp,
                'Conduta': assessment.conduta,
                'Sinais e Sintomas': assessment.sinais_sintomas,
                'Fisiopatologia': assessment.fisiopatologia
            },
            'parametros_gerais': {
                'Autoconfiança': assessment.autoconfianca,
                'Acurácia': assessment.acuracia
            }
        }
        data_points.append(data_point)

    return jsonify(data_points)


# API Endpoints for Admin
@app.route('/api/students', methods=['GET'])
@login_required
def get_students():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    students = User.query.filter_by(is_admin=False).order_by(User.serie, User.initials).all()
    return jsonify([{
        'id': s.id,
        'initials': s.initials,
        'username': s.username,
        'serie': s.serie
    } for s in students])


@app.route('/api/students/<int:student_id>/assessment', methods=['GET'])
@login_required
def get_student_assessment(student_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    student = User.query.get_or_404(student_id)
    assessment = Assessment.query.filter_by(student_id=student_id).first()

    if not assessment:
        return jsonify({'error': 'No assessment found'}), 404

    return jsonify({
        'student': {
            'id': student.id,
            'initials': student.initials,
            'serie': student.serie
        },
        'assessment': assessment.to_dict()
    })


@app.route('/api/series-stats', methods=['GET'])
@login_required
def get_series_stats():
    """Get statistics grouped by serie for admin view"""
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    series = [0, 1, 2, 3, 4]
    stats_by_serie = {}

    for serie in series:
        students = User.query.filter_by(serie=serie, is_admin=False).all()
        student_ids = [s.id for s in students]
        assessments = Assessment.query.filter(Assessment.student_id.in_(student_ids)).all()

        if assessments:
            avg_acuracia = statistics.mean([a.acuracia for a in assessments])
            avg_autoconfianca = statistics.mean([a.autoconfianca for a in assessments])

            stats_by_serie[f'Serie {serie}'] = {
                'count': len(students),
                'avg_acuracia': round(avg_acuracia, 3),
                'avg_autoconfianca': round(avg_autoconfianca, 3)
            }

    return jsonify(stats_by_serie)


# Initialize database
def init_db():
    with app.app_context():
        db.create_all()

        # Check if admin exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                ra=None,
                initials='ADMIN',
                serie=0,
                is_admin=True,
                first_login=False
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print('Admin user created: username=admin, password=admin123')


if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
