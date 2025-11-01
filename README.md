# Sistema de Notas - Raciocínio Clínico

Sistema web para gerenciamento e visualização de notas de instrumentos de avaliação de raciocínio clínico. Os alunos podem acessar suas notas individuais e comparar seu desempenho com a média da turma através de gráficos interativos.

## Funcionalidades

### Para Alunos
- Login seguro com usuário e senha
- Visualização de notas individuais por instrumento
- Gráficos comparativos com a média da turma
- Dashboard com estatísticas de desempenho
- Histórico completo de avaliações

### Para Administradores
- Gerenciamento completo de notas
- Adicionar notas para alunos
- Visualizar notas de todos os alunos
- Excluir notas quando necessário

## Tecnologias Utilizadas

- **Backend**: Python 3 com Flask
- **Banco de Dados**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript
- **Gráficos**: Chart.js
- **Autenticação**: Flask-Login

## Instalação

### Pré-requisitos
- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Passo a Passo

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd Raciocionio_clinico
```

2. Crie um ambiente virtual (recomendado):
```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente (opcional):
```bash
cp .env.example .env
# Edite o arquivo .env e configure suas variáveis
```

5. Inicialize o banco de dados e crie o usuário admin:
```bash
python app.py
```
Após ver a mensagem "Admin user created", pressione Ctrl+C para parar.

6. Popule o banco com dados de exemplo (opcional):
```bash
python seed_data.py
```

7. Inicie o servidor:
```bash
python app.py
```

8. Acesse o sistema em seu navegador:
```
http://localhost:5000
```

## Contas de Acesso

### Conta Administrador
- **Usuário**: admin
- **Senha**: admin123

### Contas de Alunos (após executar seed_data.py)
Todos os alunos têm a senha: **senha123**

- **joao** - João Silva
- **maria** - Maria Santos
- **pedro** - Pedro Costa
- **ana** - Ana Oliveira
- **carlos** - Carlos Souza

## Estrutura do Projeto

```
Raciocionio_clinico/
├── app.py                 # Aplicação Flask principal
├── models.py              # Modelos do banco de dados
├── config.py              # Configurações
├── seed_data.py           # Script para dados de exemplo
├── requirements.txt       # Dependências Python
├── templates/             # Templates HTML
│   ├── base.html
│   ├── login.html
│   ├── dashboard.html
│   └── admin.html
├── static/                # Arquivos estáticos
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── dashboard.js
│       └── admin.js
└── README.md
```

## Uso do Sistema

### Como Aluno

1. Acesse a página de login
2. Entre com seu usuário e senha
3. No dashboard você verá:
   - Suas estatísticas (número de avaliações, média geral, aproveitamento)
   - Gráfico de suas notas por instrumento
   - Gráfico comparativo com a média da turma
   - Tabela com histórico completo de notas

### Como Administrador

1. Acesse com a conta admin
2. Na página de administração você pode:
   - Adicionar novas notas para qualquer aluno
   - Selecionar um aluno para ver todas as suas notas
   - Excluir notas quando necessário

## API Endpoints

### Autenticação
- `POST /login` - Realizar login
- `GET /logout` - Realizar logout

### Notas (requer autenticação)
- `GET /api/my-grades` - Obter notas do usuário atual
- `GET /api/class-averages` - Obter médias da turma por instrumento
- `GET /api/students` - Listar todos os alunos (admin)
- `GET /api/students/<id>/grades` - Obter notas de um aluno específico (admin)
- `POST /api/grades` - Adicionar nova nota (admin)
- `PUT /api/grades/<id>` - Atualizar nota (admin)
- `DELETE /api/grades/<id>` - Excluir nota (admin)

## Personalização

### Adicionar Novos Alunos

Você pode adicionar novos alunos diretamente no banco de dados ou criar um script Python:

```python
from app import app, db
from models import User

with app.app_context():
    student = User(
        username='novousuario',
        email='email@example.com',
        name='Nome Completo',
        is_admin=False
    )
    student.set_password('senha')
    db.session.add(student)
    db.session.commit()
```

### Modificar Instrumentos de Avaliação

Os instrumentos são definidos dinamicamente com base nas notas cadastradas. Para adicionar um novo instrumento, basta cadastrar uma nota com o novo nome através da interface de administração.

## Segurança

- Senhas são armazenadas com hash usando Werkzeug
- Sistema de autenticação com Flask-Login
- Proteção de rotas administrativas
- Validação de dados no backend

## Troubleshooting

### Erro ao instalar dependências
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Banco de dados corrompido
```bash
rm grades.db
python app.py  # Recria o banco
python seed_data.py  # Popula novamente
```

### Porta 5000 já em uso
Edite `app.py` e mude a porta na última linha:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório.
