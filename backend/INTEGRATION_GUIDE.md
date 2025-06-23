# Guia de Integrações - J3N Platform

Este documento descreve as novas integrações implementadas para preencher as lacunas identificadas na plataforma J3N.

## 🔌 Integrações Implementadas

### 📱 Comunicação
- **Slack** - Envio de mensagens e interação com canais
- **Discord** - Envio de mensagens via webhooks e bot
- **Telegram** - Envio de mensagens via Bot API
- **WhatsApp** - Envio de mensagens via WhatsApp Business API

### 🗄️ Bancos de Dados
- **MySQL** - Execução de queries SQL
- **MongoDB** - Operações CRUD em documentos

### 🔗 APIs Populares
- **Google Sheets** - Leitura e escrita de planilhas
- **Notion** - Gerenciamento de páginas e databases
- **Airtable** - Manipulação de registros

### 📧 Email
- **Gmail** - Envio e listagem de emails
- **Outlook** - Envio e listagem de emails via Microsoft Graph

## 🚀 Como Usar

### 1. Slack Integration

```json
{
  "nodeType": "slack",
  "parameters": {
    "action": "sendMessage",
    "token": "xoxb-your-bot-token",
    "channel": "#general",
    "message": "Hello from J3N!",
    "username": "J3N Bot"
  }
}
```

**Credenciais necessárias:**
- Bot Token do Slack
- Webhook URL (opcional)

### 2. Discord Integration

```json
{
  "nodeType": "discord",
  "parameters": {
    "action": "sendMessage",
    "webhookUrl": "https://discord.com/api/webhooks/...",
    "message": "Hello from J3N!"
  }
}
```

**Credenciais necessárias:**
- Webhook URL do Discord
- Bot Token (para ações avançadas)

### 3. Telegram Integration

```json
{
  "nodeType": "telegram",
  "parameters": {
    "action": "sendMessage",
    "botToken": "your-bot-token",
    "chatId": "123456789",
    "message": "Hello from J3N!",
    "parseMode": "HTML"
  }
}
```

**Credenciais necessárias:**
- Bot Token do Telegram
- Chat ID do destinatário

### 4. WhatsApp Integration

```json
{
  "nodeType": "whatsapp",
  "parameters": {
    "action": "sendMessage",
    "accessToken": "your-access-token",
    "phoneNumberId": "your-phone-number-id",
    "to": "5511999999999",
    "message": "Hello from J3N!"
  }
}
```

**Credenciais necessárias:**
- Access Token do WhatsApp Business
- Phone Number ID

### 5. MySQL Integration

```json
{
  "nodeType": "mysql",
  "parameters": {
    "action": "select",
    "host": "localhost",
    "port": 3306,
    "database": "mydb",
    "username": "user",
    "password": "password",
    "query": "SELECT * FROM users LIMIT 10"
  }
}
```

**Dependências necessárias:**
```bash
npm install mysql2
```

### 6. MongoDB Integration

```json
{
  "nodeType": "mongodb",
  "parameters": {
    "action": "find",
    "connectionString": "mongodb://localhost:27017",
    "database": "mydb",
    "collection": "users",
    "query": {"status": "active"}
  }
}
```

**Dependências necessárias:**
```bash
npm install mongodb
```

### 7. Google Sheets Integration

```json
{
  "nodeType": "googleSheets",
  "parameters": {
    "action": "read",
    "apiKey": "your-api-key",
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Class Data!A2:E"
  }
}
```

**Credenciais necessárias:**
- Google API Key ou OAuth2 credentials
- Spreadsheet ID

### 8. Notion Integration

```json
{
  "nodeType": "notion",
  "parameters": {
    "action": "queryDatabase",
    "token": "secret_your-integration-token",
    "databaseId": "your-database-id",
    "filter": {
      "property": "Status",
      "select": {
        "equals": "Active"
      }
    }
  }
}
```

**Credenciais necessárias:**
- Notion Integration Token
- Database ID

### 9. Airtable Integration

```json
{
  "nodeType": "airtable",
  "parameters": {
    "action": "list",
    "apiKey": "your-api-key",
    "baseId": "appXXXXXXXXXXXXXX",
    "tableId": "tblXXXXXXXXXXXXXX",
    "filterByFormula": "AND({Status} = 'Active')"
  }
}
```

**Credenciais necessárias:**
- Airtable API Key
- Base ID
- Table ID

### 10. Gmail Integration

```json
{
  "nodeType": "gmail",
  "parameters": {
    "action": "sendEmail",
    "accessToken": "your-oauth2-access-token",
    "to": "recipient@example.com",
    "subject": "Hello from J3N",
    "body": "This is a test email from J3N platform."
  }
}
```

**Credenciais necessárias:**
- OAuth2 Access Token do Google

### 11. Outlook Integration

```json
{
  "nodeType": "outlook",
  "parameters": {
    "action": "sendEmail",
    "accessToken": "your-oauth2-access-token",
    "to": "recipient@example.com",
    "subject": "Hello from J3N",
    "body": "This is a test email from J3N platform."
  }
}
```

**Credenciais necessárias:**
- OAuth2 Access Token da Microsoft

## 🔧 Configuração de Credenciais

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Discord
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Google
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Notion
NOTION_TOKEN=secret_your-notion-token

# Airtable
AIRTABLE_API_KEY=your-airtable-api-key

# Microsoft
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password

MONGODB_CONNECTION_STRING=mongodb://localhost:27017
```

## 📦 Dependências Adicionais

Para usar todas as integrações, instale as seguintes dependências:

```bash
# Para MySQL
npm install mysql2

# Para MongoDB
npm install mongodb

# Para validação de dados
npm install joi

# Para criptografia adicional
npm install crypto-js
```

## 🔒 Segurança

### Boas Práticas

1. **Nunca hardcode credenciais** no código
2. **Use variáveis de ambiente** para todas as chaves e tokens
3. **Implemente rate limiting** para evitar abuso das APIs
4. **Valide todos os inputs** antes de processar
5. **Use HTTPS** para todas as comunicações
6. **Monitore logs** para detectar atividades suspeitas

### Validação de Credenciais

Todas as integrações incluem validação básica de credenciais e tratamento de erros. Certifique-se de:

- Verificar se as credenciais estão válidas antes de usar
- Implementar retry logic para falhas temporárias
- Logar erros sem expor informações sensíveis

## 🚨 Limitações e Considerações

### Rate Limits

Cada API tem seus próprios limites de taxa:

- **Slack**: 1+ requests per second
- **Discord**: 5 requests per second
- **Telegram**: 30 messages per second
- **WhatsApp**: Varia por tipo de conta
- **Google Sheets**: 100 requests per 100 seconds
- **Notion**: 3 requests per second
- **Airtable**: 5 requests per second

### Custos

Algumas integrações podem ter custos associados:

- **WhatsApp Business API**: Cobrança por mensagem
- **Google APIs**: Cotas gratuitas limitadas
- **Microsoft Graph**: Incluído no Office 365

## 🔄 Próximos Passos

1. **Implementar sistema de credenciais** no frontend
2. **Adicionar validação de credenciais** em tempo real
3. **Criar templates** para workflows comuns
4. **Implementar cache** para melhorar performance
5. **Adicionar métricas** e monitoramento
6. **Criar testes automatizados** para cada integração

## 📞 Suporte

Para dúvidas ou problemas com as integrações:

1. Verifique os logs do servidor
2. Confirme se as credenciais estão corretas
3. Teste a conectividade com as APIs externas
4. Consulte a documentação oficial de cada serviço

---

**Nota**: Este guia cobre as integrações básicas. Para funcionalidades avançadas, consulte a documentação específica de cada serviço.