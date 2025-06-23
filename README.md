# 🚀 FlowBuilder - Plataforma de Automação de Workflows

Uma plataforma moderna e intuitiva para criação de workflows de automação, inspirada no n8n. Construída com React, TypeScript, Node.js, PostgreSQL e Docker.

![FlowBuilder](https://img.shields.io/badge/FlowBuilder-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791)

## ✨ Funcionalidades

### 🔐 **Sistema de Autenticação**
- **Login/Logout** - Sistema completo de autenticação
- **JWT Tokens** - Autenticação segura com tokens
- **Usuário Admin** - Criação automática do usuário administrador
- **Proteção de Rotas** - Todas as rotas protegidas por autenticação

### 🎯 **Triggers (Gatilhos)**
- **Trigger Manually** - Execução manual de workflows
- **On Webhook Call** - Disparo via requisições HTTP
- **When Executed by Another Workflow** - Integração entre workflows
- **On Chat Message** - Disparo por mensagens de chat

### ⚡ **Actions (Ações)**
- **Function** - Execução de código JavaScript personalizado
- **Delay** - Pausas temporizadas no fluxo

### 🔧 **Flow Control**
- **Start** - Início do workflow
- **End** - Finalização do workflow

### 📊 **Interface Visual**
- Editor de fluxo drag-and-drop com ReactFlow
- Background com pontos (estilo n8n)
- Listagem de workflows com filtros e busca
- Interface responsiva e moderna
- Menu de ações (duplicar, excluir, ativar/desativar)
- **Tela de Login** - Interface elegante inspirada no I2N

## 🏗️ Arquitetura do Projeto

```
Flow_builder_VBC/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Contextos (Auth)
│   │   ├── services/        # Serviços (API)
│   │   ├── store/          # Zustand store
│   │   └── ...
│   ├── public/             # Arquivos públicos (logo)
│   └── package.json
├── backend/                 # Node.js + TypeScript + Express
│   ├── src/
│   │   ├── controllers/    # Controladores da API
│   │   ├── models/         # Modelos de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middleware (Auth)
│   │   ├── config/         # Configurações
│   │   └── index.ts        # Servidor principal
│   ├── database/           # Scripts SQL
│   └── package.json
├── docker-compose.yml       # PostgreSQL + pgAdmin
├── Logo I2N.png            # Logo da plataforma
└── README.md
```

## 🚀 Começando

### 📋 Pré-requisitos

- **Node.js** 18.x ou superior
- **npm** ou **yarn**
- **Docker** e **Docker Compose**
- **Git**

### 1️⃣ **Clone o Repositório**

```bash
git clone <seu-repositorio>
cd Flow_builder_VBC
```

### 2️⃣ **Configure o Banco de Dados (PostgreSQL)**

```bash
# Inicie o PostgreSQL e pgAdmin com Docker
docker-compose up -d

# Verifique se os containers estão rodando
docker-compose ps
```

**Credenciais do Banco:**
- **Host:** localhost
- **Porta:** 5432
- **Database:** flowbuilder_db
- **Usuário:** flowbuilder_user
- **Senha:** flowbuilder_password

**pgAdmin (Interface Web):**
- **URL:** http://localhost:8080
- **Email:** admin@flowbuilder.com
- **Senha:** admin123

### 3️⃣ **Configure o Backend**

```bash
# Entre na pasta backend
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente no .env
# Crie o arquivo .env com as seguintes variáveis:
```

**Arquivo `.env` do Backend:**
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flowbuilder_db
DB_USER=flowbuilder_user
DB_PASSWORD=flowbuilder_password
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@flowbuilder.com
ADMIN_PASSWORD=admin123
```

```bash
# Execute o backend em modo desenvolvimento
npm run dev
```

O backend estará disponível em: **http://localhost:3001**

### 4️⃣ **Configure o Frontend**

```bash
# Entre na pasta frontend (em um novo terminal)
cd frontend

# Instale as dependências
npm install

# Execute o frontend em modo desenvolvimento
npm run dev
```

O frontend estará disponível em: **http://localhost:5173**

## 🔐 **Sistema de Autenticação**

### **Credenciais Padrão**
- **Email:** admin@flowbuilder.com
- **Senha:** admin123

### **Como Funciona**
1. **Usuário Admin Automático:** O sistema cria automaticamente um usuário administrador baseado nas variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env`
2. **JWT Tokens:** Autenticação segura com tokens JWT
3. **Proteção de Rotas:** Todas as rotas da API são protegidas por autenticação
4. **Persistência:** O token é salvo no localStorage do navegador
5. **Auto-logout:** Token inválido resulta em logout automático

### **Endpoints de Autenticação**
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/logout` - Logout do usuário
- `GET /api/auth/verify` - Verificar token
- `GET /api/auth/me` - Dados do usuário atual

## 🌐 **URLs de Acesso**

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Interface da aplicação |
| **Backend API** | http://localhost:3001 | API REST |
| **Health Check** | http://localhost:3001/health | Status da API |
| **pgAdmin** | http://localhost:8080 | Interface do PostgreSQL |
| **PostgreSQL** | localhost:5432 | Banco de dados |

## 🛠️ **Scripts Disponíveis**

### Frontend
```bash
cd frontend
npm run dev        # Desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
```

### Backend
```bash
cd backend
npm run dev        # Desenvolvimento com nodemon
npm run build      # Compilar TypeScript
npm run start      # Executar versão compilada
```

### Docker
```bash
docker-compose up -d      # Iniciar serviços
docker-compose down       # Parar serviços
docker-compose logs       # Ver logs
```

## 🎯 **Como Usar**

### 1. **Login**
- Acesse http://localhost:5173
- Use as credenciais padrão ou configure suas próprias no `.env`
- A tela de login é inspirada no design I2N

### 2. **Tela de Workflows**
- Visualize todos os seus workflows criados
- Use a busca para encontrar workflows específicos
- Filtre por status (Ativo/Inativo)
- Use o menu de três pontos para:
  - Abrir workflow
  - Duplicar workflow
  - Excluir workflow
  - Ativar/Desativar workflow

### 3. **Editor de Fluxo**
- Arraste componentes da sidebar para a área de trabalho
- Conecte os nós para criar seu fluxo
- Configure cada nó clicando nele
- Execute o workflow com o botão "Run Flow"

### 4. **Tipos de Nós Disponíveis**

#### **Triggers**
- Arraste da seção "Triggers" na sidebar
- Configure as condições de disparo

#### **Actions**
- Arraste da seção "Actions" na sidebar
- Configure as ações a serem executadas

#### **Flow Control**
- Use Start/End para delimitar seu workflow

## 🔧 **API Endpoints**

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/logout` - Logout do usuário
- `GET /api/auth/verify` - Verificar token
- `GET /api/auth/me` - Dados do usuário atual

### Workflows (Protegidas)
- `GET /api/workflows` - Listar workflows
- `POST /api/workflows` - Criar workflow
- `GET /api/workflows/:id` - Buscar workflow por ID
- `PUT /api/workflows/:id` - Atualizar workflow
- `DELETE /api/workflows/:id` - Excluir workflow
- `POST /api/workflows/:id/duplicate` - Duplicar workflow
- `PATCH /api/workflows/:id/toggle` - Ativar/Desativar workflow

### Health Check
- `GET /health` - Status da API

## 🗃️ **Estrutura do Banco de Dados**

### Tabelas Principais
- **users** - Usuários do sistema
- **workflows** - Workflows criados
- **workflow_executions** - Execuções de workflows
- **execution_logs** - Logs de execução

## 🔒 **Segurança**

- **JWT Tokens** com expiração configurável
- **Bcrypt** para hash de senhas
- **Helmet** para headers de segurança
- **Rate Limiting** para prevenir ataques
- **CORS** configurado
- **Validação** de entrada em todas as rotas

## 🤝 **Contribuindo**

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 **Tecnologias Utilizadas**

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **ReactFlow** - Editor visual de fluxos
- **Zustand** - Gerenciamento de estado
- **Lucide React** - Ícones
- **Context API** - Gerenciamento de autenticação

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados
- **pg** - Driver PostgreSQL
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **cors** - Cross-origin resource sharing
- **helmet** - Segurança
- **morgan** - Logger HTTP

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **pgAdmin** - Interface web para PostgreSQL

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 **Suporte**

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se todos os serviços estão rodando
2. Consulte os logs dos containers: `docker-compose logs`
3. Verifique o health check da API: http://localhost:3001/health
4. Teste o login com as credenciais padrão
5. Abra uma issue no repositório

## 🚨 **Troubleshooting**

### Problemas Comuns

**1. Erro de conexão com o banco:**
```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps
# Reinicie se necessário
docker-compose restart postgres
```

**2. Erro de autenticação:**
- Verifique se as variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` estão configuradas no `.env`
- Use as credenciais padrão: admin@flowbuilder.com / admin123

**3. Frontend não conecta com backend:**
- Verifique se o backend está rodando na porta 3001
- Confirme se o CORS está configurado corretamente

---

**Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento moderno** 