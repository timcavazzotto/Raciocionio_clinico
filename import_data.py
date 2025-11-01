import csv
from app import app, db
from models import User, Assessment
from datetime import datetime

def parse_float(value):
    """Convert string with comma to float"""
    if isinstance(value, str):
        return float(value.replace(',', '.'))
    return float(value)

def import_from_csv(csv_file):
    """Import student data from CSV file"""
    with app.app_context():
        # Clear existing data
        Assessment.query.delete()
        User.query.filter_by(is_admin=False).delete()
        db.session.commit()

        print("Importing students from CSV...")

        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')

            students_created = 0
            assessments_created = 0

            for row in reader:
                initials = row['INICIAIS'].strip()
                serie = int(row['SERIE'])

                # Create username from initials (lowercase, no spaces)
                username = initials.lower().replace(' ', '_')

                # Check if user already exists
                user = User.query.filter_by(username=username).first()

                if not user:
                    # Create new user
                    user = User(
                        username=username,
                        initials=initials,
                        serie=serie,
                        is_admin=False
                    )
                    # Default password is the username
                    user.set_password(username)
                    db.session.add(user)
                    db.session.flush()  # Get user ID
                    students_created += 1

                # Create assessment
                assessment = Assessment(
                    student_id=user.id,
                    application_number=1,
                    # Casos clínicos
                    pac=parse_float(row['PAC']),
                    cis=parse_float(row['CIS']),
                    mio=parse_float(row['MIO']),
                    ar=parse_float(row['AR']),
                    cc=parse_float(row['CC']),
                    ep=parse_float(row['EP']),
                    tep=parse_float(row['TEP']),
                    # Parâmetros gerais
                    autoconfianca=parse_float(row['Autoconfianca']),
                    acuracia=parse_float(row['Acuracia']),
                    # Dimensões
                    dados_relevantes=parse_float(row['DadosRelevantes']),
                    resumo=parse_float(row['Resumo']),
                    diferencial=parse_float(row['Diferencial']),
                    hp_justificativa=parse_float(row['HPJustificativa']),
                    hp=parse_float(row['HP']),
                    conduta=parse_float(row['Conduta']),
                    sinais_sintomas=parse_float(row['SinaisSintomas']),
                    fisiopatologia=parse_float(row['Fisiopatologia'])
                )
                db.session.add(assessment)
                assessments_created += 1

            db.session.commit()

            print(f"\n{'='*60}")
            print(f"Import completed successfully!")
            print(f"{'='*60}")
            print(f"Students created: {students_created}")
            print(f"Assessments created: {assessments_created}")
            print(f"\nDefault credentials:")
            print(f"- Username: [student initials in lowercase]")
            print(f"- Password: [same as username]")
            print(f"\nExamples:")
            print(f"  Username: jps, Password: jps")
            print(f"  Username: jk, Password: jk")
            print(f"{'='*60}")

if __name__ == '__main__':
    import_from_csv('data.csv')
