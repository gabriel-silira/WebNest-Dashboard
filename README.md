# 📊 WebNest Dashboard

Dashboard privada de análise do Instagram desenvolvida para centralizar métricas, publicações e o acompanhamento de uma conta profissional da **WebNest**.

O projeto combina uma interface responsiva em React com autenticação, armazenamento e funções server-side do Supabase. Os dados reais são consultados pela API oficial do Instagram/Meta e somente o proprietário configurado no backend pode acessá-los.

Versão 1.0.2

> A aplicação é de uso privado. Este repositório apresenta a implementação para fins de portfólio, mas não fornece acesso aos dados reais nem às credenciais de produção.

---

## 🌐 Demonstração

🔗 **GitHub Pages:** [WebNest Dashboard](https://gabriel-silira.github.io/WebNest-Dashboard/)

> A interface de login é pública, mas o acesso à Dashboard e aos dados reais permanece restrito ao proprietário autorizado no backend.

---

## 🚀 Funcionalidades

- **Autenticação privada:** login e gerenciamento de sessão com Supabase Auth.
- **Recuperação de conta protegida:** fluxo de redefinição de senha separado de uma sessão normal da Dashboard.
- **Visão geral:** indicadores, gráficos e as três publicações mais recentes.
- **Publicações:** listagem responsiva com busca, filtros, miniaturas e métricas reais.
- **Métricas:** acompanhamento de seguidores, alcance, interações e desempenho da conta.
- **Histórico de seguidores:** dados armazenados pelo backend e protegidos contra acesso direto pelo navegador.
- **Configurações da conta:** nome de exibição, usuário do Instagram e preferências locais.
- **Temas claro e escuro:** aparência persistida no navegador.
- **Interface responsiva:** navegação adaptada para desktop, tablet e celular.
- **Testes de segurança:** cobertura automatizada das regras de sessão e autorização do proprietário.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia              | Aplicação                                    |
| ----------------------- | -------------------------------------------- |
| React                   | Componentes e interface da Dashboard         |
| Vite                    | Ambiente de desenvolvimento e build          |
| JavaScript              | Lógica da aplicação e tratamento dos dados   |
| CSS                     | Design system, temas e responsividade        |
| Recharts                | Visualização das métricas em gráficos        |
| Lucide React            | Ícones da interface                          |
| Supabase Auth           | Login, sessões e recuperação de senha        |
| Supabase Edge Functions | Autorização e integração segura com a API    |
| PostgreSQL              | Histórico de seguidores e dados persistidos  |
| Instagram Graph API     | Métricas e publicações da conta profissional |

---

## 🏗️ Arquitetura

```text
Navegador (React + Vite)
        │
        ├── Supabase Auth ── sessão e identidade do usuário
        │
        └── Edge Function instagram-insights
                ├── valida JWT e método de autenticação
                ├── confirma o UUID exclusivo do proprietário
                ├── consulta a Instagram Graph API
                └── lê e grava o histórico com credenciais de servidor
```

A chave publicável do Supabase é utilizada no frontend apenas para iniciar a comunicação com o projeto. Tokens da Meta, `service_role` e o UUID autorizado permanecem exclusivamente nos Secrets da Edge Function.

Sessões originadas de recuperação de senha não são aceitas como sessões normais, inclusive após a renovação do token. A tabela de histórico também não concede acesso direto ao papel `authenticated`; as operações necessárias são realizadas pelo backend autorizado.

---

## 📂 Estrutura do projeto

```text
WebNest-Dashboard/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   └── WebNest_Logo.png
├── src/
│   ├── components/
│   ├── data/
│   ├── lib/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── functions/
│   │   └── instagram-insights/
│   └── history-access.review.sql
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── vite.config.js
```

Os backups operacionais e os arquivos de ambiente locais são mantidos fora do versionamento pelas regras do `.gitignore`.

---

## 💻 Executar localmente

### Requisitos

- Node.js e npm compatíveis com as dependências do projeto.
- Um projeto Supabase próprio configurado.
- Uma conta profissional do Instagram conectada à API oficial da Meta para utilizar dados reais.

### Instalação

```bash
npm ci
```

Crie um arquivo `.env.local` a partir do exemplo:

```bash
cp .env.example .env.local
```

No PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Preencha somente as variáveis públicas do seu próprio projeto:

| Variável                        | Finalidade                               |
| ------------------------------- | ---------------------------------------- |
| `VITE_SUPABASE_URL`             | URL pública do projeto Supabase          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável utilizada pelo frontend |

Nunca utilize `service_role`, secret keys ou tokens da Meta em variáveis iniciadas por `VITE_`, pois elas são incorporadas ao bundle do navegador.

Inicie o ambiente local:

```bash
npm run dev
```

Sem uma infraestrutura própria e um usuário autorizado, a aplicação não exibirá os dados reais da conta WebNest.

---

## ✅ Verificações do projeto

```bash
npm run lint
npm test
npm run build
```

Os testes automatizados validam, entre outros cenários:

- Login normal após renovação do token.
- Bloqueio de sessões originadas de recuperação de senha.
- Interpretação consistente dos métodos de autenticação no frontend e no backend.
- Autorização exclusiva do UUID configurado como proprietário.

---

## 🚢 Publicação no GitHub Pages

O workflow `.github/workflows/deploy.yml` executa os testes, gera o build e publica a pasta `dist` automaticamente após cada push para a branch `main`.

Antes da primeira publicação:

1. Em **Settings → Secrets and variables → Actions**, crie os seguintes Repository Secrets usando os valores públicos do frontend:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Em **Settings → Pages**, selecione **GitHub Actions** como fonte de publicação.
3. No Supabase, em **Authentication → URL Configuration**, adicione exatamente esta URL à lista de Redirect URLs:

```text
https://gabriel-silira.github.io/WebNest-Dashboard/
```

Mantenha também a URL local necessária para desenvolvimento. A aplicação usa `import.meta.env.BASE_URL`, portanto o link de recuperação direciona corretamente tanto para o ambiente local quanto para o subdiretório do GitHub Pages.

Nenhum Secret da Edge Function, token da Meta ou chave `service_role` deve ser adicionado ao workflow.

---

## 🔐 Segurança

- O backend valida o JWT e exige autenticação por senha antes de consultar dados do Instagram.
- A Edge Function autoriza exclusivamente o usuário definido por `INSTAGRAM_HISTORY_OWNER_ID` no servidor.
- O histórico de seguidores é acessado com credenciais server-side somente após a autorização do proprietário.
- `verify_jwt` deve permanecer ativado na função implantada.
- `.env`, builds, caches, logs e backups privados não são versionados.
- O cadastro público deve permanecer desabilitado no projeto Supabase utilizado em produção.

O arquivo `.env.example` contém somente nomes de variáveis e valores fictícios. Cada pessoa que reutilizar o projeto deve configurar sua própria infraestrutura, seus próprios Secrets, políticas e agendamentos.

---

## 🎯 Objetivo do projeto

A WebNest Dashboard foi desenvolvida para demonstrar a construção de uma aplicação completa, indo além da interface: autenticação, autorização server-side, integração com API externa, persistência de dados, responsividade e proteção de informações privadas.

O projeto faz parte do portfólio da **WebNest** e representa uma solução real de acompanhamento de desempenho digital utilizada exclusivamente pelo proprietário.

---

**Desenvolvido por [Gabriel Silira](https://github.com/gabriel-silira) | WebNest**
