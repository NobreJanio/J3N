# Configuração das Integrações - J3N Platform

## ✅ Status Atual

### Backend
- ✅ **Dependências instaladas**: `mysql2` e `mongodb` foram instaladas com sucesso
- ✅ **Arquivo .env configurado**: Todas as variáveis de ambiente para as 10 integrações foram adicionadas
- ✅ **Código implementado**: Todas as integrações estão funcionais no backend

### Frontend
- ✅ **Não requer implementação específica**: O frontend utiliza a API do backend para executar as integrações
- ✅ **Interface já preparada**: O sistema de nodes já suporta as integrações via API calls

## 🔧 Próximos Passos

### 1. Configurar Credenciais de API

Edite o arquivo `backend/.env` e substitua os valores placeholder pelas suas credenciais reais:

#### 📱 Comunicação
```bash
# Slack
SLACK_BOT_TOKEN=xoxb-seu-token-real-aqui
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/SEU/WEBHOOK/URL

# Discord
DISCORD_BOT_TOKEN=seu-discord-bot-token
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/SEU/WEBHOOK

# Telegram
TELEGRAM_BOT_TOKEN=seu-telegram-bot-token

# WhatsApp Business
WHATSAPP_ACCESS_TOKEN=seu-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
```

#### 🗄️ Bancos de Dados
```bash
# MySQL
MYSQL_HOST=localhost
MYSQL_USER=seu-usuario-mysql
MYSQL_PASSWORD=sua-senha-mysql
MYSQL_DATABASE=seu-database-mysql

# MongoDB
MONGODB_CONNECTION_STRING=mongodb://localhost:27017
MONGODB_DATABASE=seu-database-mongodb
```

#### 🔗 APIs Populares
```bash
# Google (Sheets/Gmail)
GOOGLE_API_KEY=sua-google-api-key
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret

# Notion
NOTION_TOKEN=secret_seu-notion-token

# Airtable
AIRTABLE_API_KEY=sua-airtable-api-key
```

#### 📧 Email
```bash
# Gmail OAuth2
GMAIL_CLIENT_ID=seu-gmail-client-id
GMAIL_CLIENT_SECRET=seu-gmail-client-secret

# Microsoft Graph (Outlook)
MICROSOFT_CLIENT_ID=seu-microsoft-client-id
MICROSOFT_CLIENT_SECRET=seu-microsoft-client-secret
```

### 2. Como Obter as Credenciais

#### Slack
1. Acesse [Slack API](https://api.slack.com/apps)
2. Crie um novo app
3. Obtenha o Bot Token em "OAuth & Permissions"

#### Discord
1. Acesse [Discord Developers](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Configure webhooks no seu servidor

#### Telegram
1. Converse com [@BotFather](https://t.me/botfather)
2. Use `/newbot` para criar um bot
3. Obtenha o token fornecido

#### WhatsApp Business
1. Configure [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
2. Obtenha access token e phone number ID

#### Google APIs
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto e ative as APIs necessárias
3. Configure OAuth2 credentials

#### Notion
1. Acesse [Notion Integrations](https://www.notion.so/my-integrations)
2. Crie uma nova integração
3. Obtenha o Integration Token

#### Airtable
1. Acesse [Airtable Account](https://airtable.com/account)
2. Gere uma API Key

#### Microsoft Graph
1. Acesse [Azure Portal](https://portal.azure.com/)
2. Registre uma aplicação
3. Configure permissões para Mail.Send e Mail.Read

### 3. Testar as Integrações

Após configurar as credenciais, você pode testar as integrações:

1. **Via Interface Web**: Acesse `http://localhost:5173` e crie workflows com os nodes de integração
2. **Via API**: Use os endpoints disponíveis em `http://localhost:3001/api/nodes`

### 4. Arquivos de Referência

- `backend/INTEGRATION_GUIDE.md` - Guia detalhado de cada integração
- `backend/INTEGRATION_STATUS.md` - Status atual de todas as integrações
- `backend/README_INTEGRATIONS.md` - Documentação técnica
- `backend/.env.integrations.example` - Exemplo completo de configuração

## 🚀 Integrações Disponíveis

### ✅ Implementadas e Funcionais

1. **Slack** - Envio de mensagens e listagem de canais
2. **Discord** - Envio de mensagens via webhooks
3. **Telegram** - Envio de mensagens via Bot API
4. **WhatsApp** - Envio de mensagens via Business API
5. **MySQL** - Consultas SQL (dependência instalada)
6. **MongoDB** - Operações CRUD (dependência instalada)
7. **Google Sheets** - Leitura, escrita e append de dados
8. **Notion** - Query de databases, criação e atualização de páginas
9. **Airtable** - Listagem, criação e atualização de registros
10. **Gmail** - Envio e listagem de emails via OAuth2
11. **Outlook** - Envio e listagem de emails via Microsoft Graph

## 📝 Notas Importantes

- **Frontend**: Não requer implementação adicional - as integrações são executadas via API do backend
- **Segurança**: Nunca commite credenciais reais no repositório
- **Rate Limits**: Cada serviço tem seus próprios limites de requisições
- **Produção**: Configure HTTPS e domínios adequados para webhooks

## 🎯 Conclusão

Todas as integrações estão **implementadas e prontas para uso**. O próximo passo é configurar as credenciais específicas de cada serviço que você deseja utilizar.

O frontend **não precisa de implementação adicional** - ele já está preparado para trabalhar com as integrações através da API do backend.