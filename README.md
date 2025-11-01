# Sistema de Avaliação de Raciocínio Clínico

Sistema web para visualização e análise de resultados do instrumento de avaliação de raciocínio clínico para estudantes de medicina.

## Visão Geral

Este sistema permite que estudantes de medicina visualizem seus resultados individuais em um instrumento de avaliação de raciocínio clínico e comparem seu desempenho com a média de sua turma de forma anônima.

### Estrutura da Avaliação

**7 Casos Clínicos:**
- PAC (Pneumonia Adquirida na Comunidade)
- CIS (Cistite)
- MIO (Miocardite)
- AR (Artrite Reumatoide)
- CC (Câncer de Cólon)
- EP (Embolia Pulmonar)
- TEP (Tromboembolismo Pulmonar)

**8 Dimensões do Raciocínio Clínico:**
1. Dados Relevantes
2. Resumo
3. Diferencial
4. HP Justificativa
5. HP (Hipótese Principal)
6. Conduta
7. Sinais e Sintomas
8. Fisiopatologia

**2 Parâmetros Gerais:**
- Autoconfiança
- Acurácia

## Funcionalidades

### Para Alunos
- **Dashboard Interativo** com visualizações personalizadas
- **Gráfico Radar**: Perfil das 8 dimensões do raciocínio clínico
- **Gráfico de Barras**: Performance nos 7 casos clínicos
- **Scatter Plot**: Posição individual na turma (anônimo para outros alunos)
- **Tabelas Detalhadas**: Comparação com média e desvio padrão da turma
- **Comparações**: Apenas com alunos da mesma série

### Para Administradores
- Visualização de estatísticas por série
- Lista de todos os alunos cadastrados
- Filtros por série
- Importação de dados via CSV

## Instalação e Configuração

### Pré-requisitos
- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Passo a Passo

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd Raciocionio_clinico
```

2. **Crie um ambiente virtual (recomendado):**
```bash
python -m venv venv

# Ativar no Linux/macOS:
source venv/bin/activate

# Ativar no Windows:
venv\Scripts\activate
```

3. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

4. **Configure as variáveis de ambiente (opcional):**
```bash
cp .env.example .env
# Edite o arquivo .env se necessário
```

5. **Importe os dados da planilha:**
```bash
python import_data.py
```

Isso irá:
- Criar o banco de dados SQLite automaticamente
- Criar o usuário administrador (admin/admin123)
- Importar todos os 123 alunos do arquivo `data.csv`
- Criar credenciais automáticas para cada aluno

6. **Inicie o servidor:**
```bash
python app.py
```

7. **Acesse o sistema:**
```
http://localhost:5000
```

## Credenciais de Acesso

### Conta Administrador
- **Usuário**: `admin`
- **Senha**: `admin123`

### Contas de Alunos
Após importar os dados, cada aluno pode fazer login usando:
- **Usuário**: Iniciais em minúsculo (ex: `jps`, `jk`, `gpn`)
- **Senha**: Mesma que o usuário (ex: `jps`, `jk`, `gpn`)

**Exemplos de login:**
- Aluno JPS → usuário: `jps`, senha: `jps`
- Aluno CHATGPT_4 → usuário: `chatgpt_4`, senha: `chatgpt_4`

## Estrutura dos Dados

### Séries
- **Série 0**: 33 alunos (grupo controle/iniciantes)
- **Série 1**: 36 alunos
- **Série 2**: 35 alunos
- **Série 3**: 19 alunos
- **Série 4**: 5 "alunos" (IAs: ChatGPT 4, Gemini 2.5, Claude 4, Grok 3, DeepSeek)

### Escala de Pontuação
Todas as notas estão na escala de **0 a 1** (onde 1 = 100%)

## Estrutura do Projeto

```
Raciocionio_clinico/
├── app.py                 # Aplicação Flask principal com APIs
├── models.py              # Modelos de banco de dados (User, Assessment)
├── config.py              # Configurações da aplicação
├── import_data.py         # Script para importar dados do CSV
├── data.csv               # Arquivo com dados dos alunos
├── requirements.txt       # Dependências Python
├── templates/             # Templates HTML
│   ├── base.html          # Template base
│   ├── login.html         # Página de login
│   ├── dashboard.html     # Dashboard do aluno
│   └── admin.html         # Painel administrativo
├── static/                # Arquivos estáticos
│   ├── css/
│   │   └── style.css      # Estilos CSS
│   └── js/
│       ├── dashboard.js   # Lógica e gráficos do dashboard
│       └── admin.js       # Lógica do painel admin
└── README.md
```

## Uso do Sistema

### Dashboard do Aluno

Ao fazer login, o aluno visualiza:

1. **Cards de Parâmetros Gerais**
   - Autoconfiança e Acurácia individuais
   - Posição na turma (ex: "5º de 36")

2. **Gráfico Radar - Dimensões**
   - Mostra o perfil individual nas 8 dimensões
   - Compara com a média da turma
   - Valores em escala de 0-100%

3. **Gráfico de Barras - Casos Clínicos**
   - Performance nos 7 casos clínicos
   - Comparação lado a lado com média da turma

4. **Scatter Plot - Posição na Turma**
   - Pontos cinza: outros alunos (anônimos)
   - Ponto vermelho (estrela): você
   - Linhas verdes: média ± desvio padrão

5. **Tabelas Detalhadas**
   - Tabs para alternar entre Dimensões e Casos Clínicos
   - Mostra: nota individual, média, desvio padrão e posição

### Painel Administrativo

O administrador pode:
- Ver estatísticas agregadas por série
- Listar todos os alunos cadastrados
- Filtrar alunos por série
- Ver contagem total de alunos

## APIs Disponíveis

### Para Alunos (requer autenticação)
```
GET /api/my-assessment    - Dados da avaliação do aluno logado
GET /api/class-stats      - Estatísticas da turma (mesma série)
GET /api/class-data       - Dados individuais para scatter plot
```

### Para Administradores (requer autenticação admin)
```
GET /api/students              - Lista de todos os alunos
GET /api/students/<id>/assessment - Avaliação de um aluno específico
GET /api/series-stats          - Estatísticas agregadas por série
```

## Importando Novos Dados

Para importar uma nova planilha de dados:

1. Prepare um arquivo CSV tab-delimited com as colunas:
```
INICIAIS	SERIE	PAC	CIS	MIO	AR	CC	EP	TEP	Autoconfianca	Acuracia	DadosRelevantes	Resumo	Diferencial	HPJustificativa	HP	Conduta	SinaisSintomas	Fisiopatologia
```

2. Salve o arquivo como `data.csv`

3. Execute o script de importação:
```bash
python import_data.py
```

**Nota:** A importação apaga todos os dados existentes (exceto o admin) e reimporta do zero.

## Avaliações Longitudinais (Futuro)

O sistema foi projetado para suportar múltiplas aplicações do instrumento ao longo do tempo. O modelo `Assessment` possui o campo `application_number` que permite rastrear a evolução do aluno.

Funcionalidades futuras planejadas:
- Gráficos de evolução temporal
- Comparação antes/depois por dimensão
- Identificação de áreas de melhoria/deterioração

## Tecnologias Utilizadas

- **Backend**: Python 3, Flask, SQLAlchemy
- **Banco de Dados**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Gráficos**: Chart.js 4.4.0
- **Autenticação**: Flask-Login com hashing de senhas

## Segurança

- Senhas armazenadas com hash (Werkzeug)
- Sistema de autenticação com sessões
- Proteção de rotas administrativas
- Comparações anônimas (alunos não veem identidade dos colegas)
- Validação de dados no backend

## Troubleshooting

### Erro ao importar dados
```bash
# Verifique se o arquivo data.csv existe e está no formato correto
python import_data.py
```

### Porta 5000 já em uso
Edite `app.py` e mude a porta na última linha:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Banco de dados corrompido
```bash
rm grades.db
python import_data.py
```

### Gráficos não aparecem
- Verifique a console do navegador (F12) para erros JavaScript
- Confirme que o Chart.js está sendo carregado corretamente
- Limpe o cache do navegador (Ctrl+Shift+R)

## Desenvolvimento

### Estrutura do Código

**Backend (app.py):**
- Rotas de autenticação (`/login`, `/logout`)
- Rotas de visualização (`/dashboard`, `/admin`)
- APIs RESTful (`/api/*`)

**Frontend:**
- `dashboard.js`: Carrega dados, cria gráficos (radar, bar, scatter), popula tabelas
- `admin.js`: Gerencia visualização administrativa
- `style.css`: Estilos responsivos e modernos

### Extensões Futuras

1. **Export de Dados**: Permitir alunos baixarem seus resultados em PDF
2. **Comparação Temporal**: Gráficos de evolução entre aplicações
3. **Feedback Personalizado**: Sugestões baseadas no perfil do aluno
4. **Gamificação**: Badges e conquistas por melhoria
5. **Mobile App**: Versão nativa para smartphones

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.

## Suporte

Para problemas ou dúvidas:
- Abra uma issue no repositório
- Entre em contato com o administrador do sistema

## Créditos

Desenvolvido para avaliação de raciocínio clínico de estudantes de medicina.
