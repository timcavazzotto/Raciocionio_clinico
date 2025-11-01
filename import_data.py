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
            student_index = 1

            for row in reader:
                initials = row['INICIAIS'].strip()
                serie = int(row['SERIE'])

                # Generate fictitious RA (format: 20241001, 20241002, etc.)
                # When you have real RAs, add a column 'RA' in the CSV
                if 'RA' in row and row['RA']:
                    ra = row['RA'].strip()
                else:
                    # Generate fictitious RA: 2024 + serie + 4-digit sequential
                    ra = f"2024{serie}{student_index:04d}"

                # Last 4 digits of RA as initial password
                initial_password = ra[-4:]

                # Username is the RA itself
                username = ra

                # Check if user already exists
                user = User.query.filter_by(username=username).first()

                if not user:
                    # Create new user
                    user = User(
                        username=username,
                        ra=ra,
                        initials=initials,
                        serie=serie,
                        is_admin=False,
                        first_login=True
                    )
                    # Initial password: last 4 digits of RA
                    user.set_password(initial_password)
                    db.session.add(user)
                    db.session.flush()  # Get user ID
                    students_created += 1
                    student_index += 1

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
            print(f"\n🔐 CREDENCIAIS DE ACESSO:")
            print(f"- Username: RA completo do aluno")
            print(f"- Senha inicial: Últimos 4 dígitos do RA")
            print(f"- Primeiro acesso: Sistema forçará troca de senha")
            print(f"\n📝 Exemplos (RAs fictícios gerados):")
            print(f"  RA: 20240001, Senha: 0001")
            print(f"  RA: 20241002, Senha: 1002")
            print(f"\n💡 Para usar RAs reais:")
            print(f"  Adicione uma coluna 'RA' no arquivo data.csv")
            print(f"{'='*60}")

if __name__ == '__main__':
    import_from_csv('data.csv')
