from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    initials = db.Column(db.String(20), nullable=False)  # INICIAIS do aluno
    password_hash = db.Column(db.String(200), nullable=False)
    serie = db.Column(db.Integer, nullable=False)  # 0, 1, 2, 3, 4
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship with assessments
    assessments = db.relationship('Assessment', backref='student', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.initials} - Serie {self.serie}>'


class Assessment(db.Model):
    """Representa uma aplicação completa do instrumento de avaliação"""
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    application_number = db.Column(db.Integer, default=1)  # Para tracking longitudinal

    # Casos clínicos (7 casos)
    pac = db.Column(db.Float, nullable=False)  # Pneumonia Adquirida na Comunidade
    cis = db.Column(db.Float, nullable=False)  # Cistite
    mio = db.Column(db.Float, nullable=False)  # Miocardite
    ar = db.Column(db.Float, nullable=False)   # Artrite Reumatoide
    cc = db.Column(db.Float, nullable=False)   # Câncer de Cólon
    ep = db.Column(db.Float, nullable=False)   # Embolia Pulmonar
    tep = db.Column(db.Float, nullable=False)  # Tromboembolismo Pulmonar

    # Parâmetros gerais
    autoconfianca = db.Column(db.Float, nullable=False)
    acuracia = db.Column(db.Float, nullable=False)

    # Dimensões do raciocínio clínico (8 dimensões)
    dados_relevantes = db.Column(db.Float, nullable=False)
    resumo = db.Column(db.Float, nullable=False)
    diferencial = db.Column(db.Float, nullable=False)
    hp_justificativa = db.Column(db.Float, nullable=False)
    hp = db.Column(db.Float, nullable=False)
    conduta = db.Column(db.Float, nullable=False)
    sinais_sintomas = db.Column(db.Float, nullable=False)
    fisiopatologia = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return f'<Assessment {self.id} - Student {self.student_id} - App {self.application_number}>'

    def to_dict(self):
        return {
            'id': self.id,
            'application_date': self.application_date.isoformat(),
            'application_number': self.application_number,
            'casos_clinicos': {
                'PAC': self.pac,
                'CIS': self.cis,
                'MIO': self.mio,
                'AR': self.ar,
                'CC': self.cc,
                'EP': self.ep,
                'TEP': self.tep
            },
            'parametros_gerais': {
                'Autoconfiança': self.autoconfianca,
                'Acurácia': self.acuracia
            },
            'dimensoes': {
                'Dados Relevantes': self.dados_relevantes,
                'Resumo': self.resumo,
                'Diferencial': self.diferencial,
                'HP Justificativa': self.hp_justificativa,
                'HP': self.hp,
                'Conduta': self.conduta,
                'Sinais e Sintomas': self.sinais_sintomas,
                'Fisiopatologia': self.fisiopatologia
            }
        }
