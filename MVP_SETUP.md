# MVP - Sistema de Avaliação de Raciocínio Clínico

## Status Atual

✅ **Concluído:**
- Modelos de banco de dados atualizados para o instrumento real
- Script de importação CSV criado (import_data.py)
- Arquivo de dados CSV preparado (data.csv)

🔄 **Em Progresso:**
Os arquivos app.py, templates e JavaScript precisam ser atualizados para trabalhar com a nova estrutura de dados.

## Como Finalizar o MVP

### Passos para Configuração:

1. **Instalar dependências:**
```bash
pip install -r requirements.txt
```

2. **Criar arquivo .env:**
```bash
cp .env.example .env
```

3. **Inicializar banco de dados e importar dados:**
```bash
# O banco será criado automaticamente na primeira execução
python import_data.py
```

Isso irá:
- Criar o banco de dados SQLite
- Criar usuário admin (username: admin, password: admin123)
- Importar todos os 123 alunos da planilha
- Cada aluno poderá fazer login com:
  - **Username:** iniciais em minúsculo (ex: jps, jk, gpn)
  - **Password:** mesmo que o username

### Estrutura dos Dados Importados:

**Séries:**
- Série 0: 33 alunos (grupo controle/iniciantes)
- Série 1: 36 alunos
- Série 2: 35 alunos
- Série 3: 19 alunos
- Série 4: 5 "alunos" (IAs: ChatGPT 4, Gemini 2.5, Claude 4, Grok 3, DeepSeek)

**Casos Clínicos Avaliados (7 doenças):**
- PAC (Pneumonia Adquirida na Comunidade)
- CIS (Cistite)
- MIO (Miocardite)
- AR (Artrite Reumatoide)
- CC (Câncer de Cólon)
- EP (Embolia Pulmonar)
- TEP (Tromboembolismo Pulmonar)

**Dimensões do Raciocínio Clínico (8 dimensões):**
1. Dados Relevantes
2. Resumo
3. Diferencial
4. HP Justificativa
5. HP (Hipótese Principal)
6. Conduta
7. Sinais e Sintomas
8. Fisiopatologia

**Parâmetros Gerais:**
- Autoconfiança
- Acurácia

## Visualizações Planejadas

### Para o Aluno:

1. **Gráfico Radar (Spider Chart)** - Dimensões do Raciocínio Clínico
   - 8 eixos (uma para cada dimensão)
   - Mostra perfil individual do aluno
   - Comparação com média da turma (mesma série)

2. **Gráfico de Barras** - Performance por Caso Clínico
   - 7 casos clínicos
   - Nota individual vs média da turma

3. **Scatter Plot com Desvio Padrão**
   - Eixo X: Dimensões ou Casos
   - Eixo Y: Score (0-1)
   - Pontos cinzas: outros alunos (anônimos)
   - Ponto destacado: aluno logado (colorido e etiquetado)
   - Linhas de média ± 1 desvio padrão

4. **Cards de Parâmetros Gerais**
   - Autoconfiança (individual e posição na turma)
   - Acurácia (individual e posição na turma)

### Comparações:

- Todas as comparações devem ser **apenas com alunos da mesma série**
- Série 4 (IAs) pode servir como benchmark opcional

### Preparação para Avaliação Longitudinal:

O modelo `Assessment` já possui o campo `application_number` para suportar múltiplas aplicações do instrumento. No futuro:

- Gráfico de linha mostrando evolução temporal em cada dimensão
- Comparação de crescimento individual vs turma
- Identificação de dimensões que melhoraram/pioraram

## APIs Necessárias

### Para Alunos:
```
GET /api/my-assessment - Retorna avaliação do aluno logado
GET /api/class-stats - Estatísticas da turma (mesma série)
```

### Para Admin:
```
GET /api/all-assessments - Todas as avaliações
POST /api/upload-csv - Upload de novo arquivo CSV
```

## Exemplo de Resposta da API:

```json
{
  "student": {
    "initials": "JPS",
    "serie": 1
  },
  "assessment": {
    "casos_clinicos": {
      "PAC": 0.67,
      "CIS": 0.67,
      ...
    },
    "dimensoes": {
      "Dados Relevantes": 0.50,
      "Resumo": 0.60,
      ...
    },
    "parametros_gerais": {
      "Autoconfiança": 0.657,
      "Acurácia": 0.413
    }
  },
  "class_stats": {
    "casos_clinicos": {
      "PAC": {"mean": 0.61, "std": 0.15},
      ...
    },
    "dimensoes": {
      "Dados Relevantes": {"mean": 0.62, "std": 0.14},
      ...
    }
  },
  "all_students_data": [
    // Array anônimo com todas as notas para scatter plot
    {"dimensoes": {...}, "is_me": false},
    {"dimensoes": {...}, "is_me": true}  // Apenas este marcado
  ]
}
```

## Próximos Passos para Implementação Completa:

1. Atualizar `app.py` com novas rotas
2. Criar `templates/dashboard.html` com layout para múltiplos gráficos
3. Atualizar `static/js/dashboard.js` com Chart.js para:
   - Radar chart
   - Bar chart
   - Scatter plot personalizado
4. Atualizar `templates/admin.html` para gerenciar avaliações
5. Testar todas as visualizações
6. Adicionar filtro de série/turma
7. Documentar no README

## Bibliotecas de Gráficos Recomendadas:

- **Chart.js** (já incluído) - Para radar e barras
- **D3.js** (opcional) - Para scatter plots mais customizados
- Alternativamente, usar apenas Chart.js com plugin para scatter

## Considerações de Privacidade:

- Alunos veem apenas suas próprias notas identificadas
- Gráficos comparativos mostram outros alunos de forma anônima
- Admin pode ver todos os dados identificados
- Não mostrar ranking explícito para evitar competição negativa
