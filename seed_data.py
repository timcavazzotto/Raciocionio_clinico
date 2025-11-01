from app import app, db
from models import User, Grade
import random
from datetime import datetime, timedelta

def seed_database():
    with app.app_context():
        # Clear existing data
        Grade.query.delete()
        User.query.filter_by(is_admin=False).delete()
        db.session.commit()

        print("Creating sample students...")

        # Create sample students
        students_data = [
            {'username': 'joao', 'email': 'joao@example.com', 'name': 'João Silva', 'password': 'senha123'},
            {'username': 'maria', 'email': 'maria@example.com', 'name': 'Maria Santos', 'password': 'senha123'},
            {'username': 'pedro', 'email': 'pedro@example.com', 'name': 'Pedro Costa', 'password': 'senha123'},
            {'username': 'ana', 'email': 'ana@example.com', 'name': 'Ana Oliveira', 'password': 'senha123'},
            {'username': 'carlos', 'email': 'carlos@example.com', 'name': 'Carlos Souza', 'password': 'senha123'},
        ]

        students = []
        for data in students_data:
            student = User(
                username=data['username'],
                email=data['email'],
                name=data['name'],
                is_admin=False
            )
            student.set_password(data['password'])
            students.append(student)
            db.session.add(student)

        db.session.commit()
        print(f"Created {len(students)} students")

        # Instruments to evaluate
        instruments = [
            'Prova de Raciocínio Clínico 1',
            'Prova de Raciocínio Clínico 2',
            'Teste de Diagnóstico Diferencial',
            'Avaliação de Caso Clínico',
            'Exame Final'
        ]

        print("Creating sample grades...")

        # Create grades for each student
        grades_created = 0
        for student in students:
            for instrument in instruments:
                # Create 1-2 grades per instrument per student
                num_grades = random.randint(1, 2)
                for i in range(num_grades):
                    # Generate realistic scores (slightly varied for each student)
                    base_score = random.uniform(5.5, 9.5)
                    score = round(base_score + random.uniform(-0.5, 0.5), 1)
                    score = max(0, min(10, score))  # Ensure score is between 0 and 10

                    # Create grade with date in the past
                    days_ago = random.randint(1, 90)
                    grade_date = datetime.utcnow() - timedelta(days=days_ago)

                    grade = Grade(
                        student_id=student.id,
                        instrument_name=instrument,
                        score=score,
                        max_score=10.0,
                        date=grade_date,
                        notes=f"Avaliação realizada em {grade_date.strftime('%d/%m/%Y')}"
                    )
                    db.session.add(grade)
                    grades_created += 1

        db.session.commit()
        print(f"Created {grades_created} grades")

        print("\n" + "="*60)
        print("Database seeded successfully!")
        print("="*60)
        print("\nYou can now login with:")
        print("\nAdmin account:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\nStudent accounts (all with password 'senha123'):")
        for student in students_data:
            print(f"  Username: {student['username']} - {student['name']}")
        print("="*60)

if __name__ == '__main__':
    seed_database()
