# 🔌 Guia de Integrações - J3N Platform

## 📋 Visão Geral

Este documento detalha as integrações implementadas na plataforma J3N, incluindo configuração, uso e exemplos práticos.

## 🚀 Integrações Disponíveis

### 📱 Comunicação
- **Slack** - Envio de mensagens e notificações
- **Discord** - Integração com servidores Discord
- **Telegram** - Bot e mensagens automáticas
- **WhatsApp Business** - Mensagens via API oficial

### 🗄️ Bancos de Dados
- **MySQL** - Consultas e operações SQL
- **MongoDB** - Operações NoSQL

### 🔗 APIs Populares
- **Google Sheets** - Leitura e escrita de planilhas
- **Notion** - Gerenciamento de páginas e databases
- **Airtable** - Manipulação de bases de dados

### 📧 Email
- **Gmail** - Envio via API do Google
- **Outlook** - Envio via Microsoft Graph

## ⚙️ Configuração Inicial

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.integrations.example .env

# Edite o arquivo .env com suas credenciais
nano .env
```

### 3. Instalar Dependências Opcionais

Para usar todas as integrações, instale as dependências opcionais:

```bash
npm install mysql2 mongodb joi crypto-js
```

## 📖 Exemplos de Uso

### 🔵 Slack

#### Enviar Mensagem
```json
{
  "nodeType": "slack",
  "parameters": {
    "action": "sendMessage",
    "channel": "#general",
    "message": "Olá do J3N!",
    "username": "J3N Bot"
  },
  "credentials": {
    "token": "xoxb-your-token"
  }
}
```

#### Enviar Mensagem Rica
```json
{
  "nodeType": "slack",
  "parameters": {
    "action": "sendRichMessage",
    "channel": "#alerts",
    "title": "🚨 Alerta do Sistema",
    "message": "Erro detectado no servidor",
    "color": "danger",
    "fields": [
      {"title": "Servidor", "value": "web-01", "short": true},
      {"title": "Status", "value": "Offline", "short": true}
    ]
  }
}
```

### 🟣 Discord

#### Enviar Mensagem
```json
{
  "nodeType": "discord",
  "parameters": {
    "action": "sendMessage",
    "channelId": "123456789",
    "message": "Mensagem do J3N!"
  },
  "credentials": {
    "token": "your-bot-token"
  }
}
```

### 🔵 Telegram

#### Enviar Mensagem
```json
{
  "nodeType": "telegram",
  "parameters": {
    "action": "sendMessage",
    "chatId": "123456789",
    "message": "Olá do Telegram!"
  },
  "credentials": {
    "token": "your-bot-token"
  }
}
```

### 🟢 WhatsApp

#### Enviar Mensagem
```json
{
  "nodeType": "whatsapp",
  "parameters": {
    "action": "sendMessage",
    "to": "5511999999999",
    "message": "Mensagem via WhatsApp Business API"
  },
  "credentials": {
    "accessToken": "your-access-token",
    "phoneNumberId": "your-phone-id"
  }
}
```

### 🔶 MySQL

#### Executar Query
```json
{
  "nodeType": "mysql",
  "parameters": {
    "action": "executeQuery",
    "query": "SELECT * FROM users WHERE active = ?",
    "params": [true]
  },
  "credentials": {
    "host": "localhost",
    "user": "username",
    "password": "password",
    "database": "mydb"
  }
}
```

### 🟢 MongoDB

#### Buscar Documentos
```json
{
  "nodeType": "mongodb",
  "parameters": {
    "action": "find",
    "collection": "users",
    "filter": {"status": "active"},
    "limit": 10
  },
  "credentials": {
    "connectionString": "mongodb://localhost:27017",
    "database": "myapp"
  }
}
```

### 📊 Google Sheets

#### Ler Dados
```json
{
  "nodeType": "googleSheets",
  "parameters": {
    "action": "readData",
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:D10"
  },
  "credentials": {
    "apiKey": "your-api-key",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "your-refresh-token"
  }
}
```

#### Escrever Dados
```json
{
  "nodeType": "googleSheets",
  "parameters": {
    "action": "writeData",
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:B2",
    "values": [
      ["Nome", "Email"],
      ["João", "joao@email.com"]
    ]
  }
}
```

### 📝 Notion

#### Criar Página
```json
{
  "nodeType": "notion",
  "parameters": {
    "action": "createPage",
    "parentId": "database-id",
    "title": "Nova Página",
    "properties": {
      "Name": {"title": [{"text": {"content": "Título da Página"}}]},
      "Status": {"select": {"name": "Em Progresso"}}
    }
  },
  "credentials": {
    "token": "secret_your-integration-token"
  }
}
```

### 🔷 Airtable

#### Criar Registro
```json
{
  "nodeType": "airtable",
  "parameters": {
    "action": "createRecord",
    "baseId": "appXXXXXXXXXXXXXX",
    "tableId": "tblXXXXXXXXXXXXXX",
    "fields": {
      "Name": "Novo Cliente",
      "Email": "cliente@email.com",
      "Status": "Ativo"
    }
  },
  "credentials": {
    "apiKey": "your-airtable-api-key"
  }
}
```

### 📧 Gmail

#### Enviar Email
```json
{
  "nodeType": "gmail",
  "parameters": {
    "action": "sendEmail",
    "to": "destinatario@email.com",
    "subject": "Assunto do Email",
    "body": "Corpo do email em HTML",
    "isHtml": true
  },
  "credentials": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "your-refresh-token"
  }
}
```

### 📧 Outlook

#### Enviar Email
```json
{
  "nodeType": "outlook",
  "parameters": {
    "action": "sendEmail",
    "to": "destinatario@email.com",
    "subject": "Assunto do Email",
    "body": "Corpo do email",
    "isHtml": false
  },
  "credentials": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "tenantId": "your-tenant-id"
  }
}
```

## 🔐 Configuração de Credenciais

### Slack
1. Acesse [Slack API](https://api.slack.com/apps)
2. Crie um novo app
3. Obtenha o Bot Token em "OAuth & Permissions"
4. Configure escopos necessários: `chat:write`, `channels:read`

### Discord
1. Acesse [Discord Developers](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Vá para "Bot" e obtenha o token
4. Adicione o bot ao servidor com permissões adequadas

### Telegram
1. Converse com [@BotFather](https://t.me/botfather)
2. Use `/newbot` para criar um novo bot
3. Obtenha o token fornecido
4. Configure comandos se necessário

### WhatsApp Business
1. Configure [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
2. Obtenha Access Token no Facebook Developers
3. Configure Phone Number ID
4. Verifique webhook se necessário

### Google APIs
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto ou selecione existente
3. Ative as APIs necessárias (Sheets, Gmail)
4. Configure OAuth2 credentials
5. Obtenha refresh token através do fluxo OAuth

### Notion
1. Acesse [Notion Integrations](https://www.notion.so/my-integrations)
2. Crie uma nova integração
3. Obtenha o Integration Token
4. Compartilhe databases/páginas com a integração

### Airtable
1. Acesse [Airtable Account](https://airtable.com/account)
2. Gere uma API Key
3. Encontre Base ID na URL da base
4. Use a documentação da API para encontrar Table IDs

### Microsoft Graph (Outlook)
1. Acesse [Azure Portal](https://portal.azure.com)
2. Registre uma nova aplicação
3. Configure permissões: `Mail.Send`, `Mail.Read`
4. Obtenha Client ID, Secret e Tenant ID

## 🛡️ Segurança

### Boas Práticas
- ✅ Use HTTPS em produção
- ✅ Implemente rate limiting
- ✅ Valide todas as entradas
- ✅ Use diferentes credenciais por ambiente
- ✅ Monitore logs de acesso
- ✅ Rotacione tokens regularmente
- ❌ Nunca commite credenciais no código
- ❌ Não exponha tokens em logs

### Rate Limits
- **Slack**: 1+ requests per second
- **Discord**: 50 requests per second
- **Telegram**: 30 messages per second
- **WhatsApp**: 1000 messages per day (sandbox)
- **Google APIs**: Varia por API
- **Notion**: 3 requests per second
- **Airtable**: 5 requests per second

## 🔧 Troubleshooting

### Problemas Comuns

#### Erro de Autenticação
```
Erro: 401 Unauthorized
Solução: Verifique se o token está correto e não expirou
```

#### Rate Limit Excedido
```
Erro: 429 Too Many Requests
Solução: Implemente retry com backoff exponencial
```

#### Timeout de Conexão
```
Erro: Connection timeout
Solução: Verifique conectividade e aumente timeout se necessário
```

### Logs e Debugging

Para habilitar logs detalhados:

```bash
# No arquivo .env
DEBUG_MODE=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

## 📊 Monitoramento

### Métricas Importantes
- Taxa de sucesso das requisições
- Tempo de resposta médio
- Erros por integração
- Uso de rate limits
- Volume de mensagens/operações

### Health Checks

Cada integração possui endpoints de health check:

```bash
GET /api/integrations/slack/health
GET /api/integrations/discord/health
# ... etc
```

## 🚀 Próximos Passos

### Integrações Futuras
- [ ] Microsoft Teams
- [ ] Zapier Webhooks
- [ ] Salesforce
- [ ] HubSpot
- [ ] Stripe
- [ ] PayPal
- [ ] AWS Services
- [ ] Azure Services

### Melhorias Planejadas
- [ ] Interface gráfica para configuração
- [ ] Templates de workflow
- [ ] Retry automático com backoff
- [ ] Cache de respostas
- [ ] Métricas em tempo real
- [ ] Alertas automáticos

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte este README
2. Verifique os logs da aplicação
3. Teste com credenciais de desenvolvimento
4. Consulte a documentação oficial de cada serviço

---

**Desenvolvido para J3N Platform** 🚀