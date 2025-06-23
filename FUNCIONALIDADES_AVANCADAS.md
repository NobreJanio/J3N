# Funcionalidades Avançadas - J3N Platform

Este documento descreve as funcionalidades avançadas implementadas na plataforma J3N, incluindo Dashboard/Analytics, Agendamento, Webhooks, Templates e Versionamento.

## 📊 Dashboard/Analytics

### Funcionalidades Implementadas
- **Métricas de Execução**: Coleta e análise de dados de performance dos workflows
- **Estatísticas Diárias**: Agregação de dados por dia, usuário e workflow
- **Dashboard Centralizado**: Visão geral de todas as métricas importantes
- **Relatórios de Performance**: Análise detalhada de execuções e tempos de resposta

### Endpoints Disponíveis
```
GET /api/analytics/dashboard - Dashboard geral
GET /api/analytics/performance - Métricas de performance
GET /api/analytics/workflows/:id - Analytics específico do workflow
POST /api/analytics/metrics - Criar métrica de execução
GET /api/analytics/daily-stats - Estatísticas diárias
```

### Estrutura de Dados
- **execution_metrics**: Métricas detalhadas de cada execução
- **daily_stats**: Estatísticas agregadas por dia
- Índices otimizados para consultas rápidas

## ⏰ Agendamento (Scheduling)

### Funcionalidades Implementadas
- **Cron Jobs**: Agendamento baseado em expressões cron
- **Triggers Temporais**: Execução automática em horários específicos
- **Gestão de Schedules**: CRUD completo para agendamentos
- **Monitoramento**: Acompanhamento de execuções agendadas

### Endpoints Disponíveis
```
GET /api/scheduling/schedules - Listar agendamentos
POST /api/scheduling/schedules - Criar agendamento
PUT /api/scheduling/schedules/:id - Atualizar agendamento
DELETE /api/scheduling/schedules/:id - Deletar agendamento
POST /api/scheduling/schedules/:id/toggle - Ativar/desativar
GET /api/scheduling/executions - Histórico de execuções
GET /api/scheduling/cron/validate - Validar expressão cron
```

### Recursos Avançados
- Validação de expressões cron
- Presets de agendamento comuns
- Retry automático em caso de falha
- Logs detalhados de execução

## 🔗 Webhooks

### Funcionalidades Implementadas
- **Webhooks Incoming**: Recebimento de dados externos
- **Webhooks Outgoing**: Envio de notificações para sistemas externos
- **Sistema de Assinaturas**: Gestão de eventos e subscriptions
- **Logs e Monitoramento**: Rastreamento completo de webhooks

### Endpoints Disponíveis
```
GET /api/webhooks/endpoints - Listar endpoints
POST /api/webhooks/endpoints - Criar endpoint
PUT /api/webhooks/endpoints/:id - Atualizar endpoint
DELETE /api/webhooks/endpoints/:id - Deletar endpoint
GET /api/webhooks/subscriptions - Listar subscriptions
POST /api/webhooks/subscriptions - Criar subscription
GET /api/webhooks/logs - Logs de webhooks
POST /api/webhooks/incoming/:id - Receber webhook
```

### Recursos de Segurança
- Assinatura HMAC para validação
- Regeneração de secrets
- Rate limiting por endpoint
- Validação de URLs

## 📋 Templates

### Funcionalidades Implementadas
- **Workflows Pré-configurados**: Templates prontos para uso
- **Sistema de Variáveis**: Personalização dinâmica de templates
- **Avaliações e Ratings**: Sistema de feedback da comunidade
- **Categorização**: Organização por categorias e tags

### Endpoints Disponíveis
```
GET /api/templates - Listar templates
GET /api/templates/:id - Obter template específico
POST /api/templates - Criar template
PUT /api/templates/:id - Atualizar template
DELETE /api/templates/:id - Deletar template
POST /api/templates/:id/use - Usar template
POST /api/templates/:id/clone - Clonar template
GET /api/templates/:id/ratings - Avaliações do template
POST /api/templates/:id/ratings - Avaliar template
```

### Recursos Avançados
- Preview automático de templates
- Sistema de variáveis com validação
- Contagem de uso e popularidade
- Filtros e busca avançada

## 🔄 Versionamento

### Funcionalidades Implementadas
- **Histórico de Versões**: Controle completo de mudanças
- **Sistema de Branches**: Desenvolvimento paralelo
- **Comparação de Versões**: Diff detalhado entre versões
- **Rollback**: Retorno a versões anteriores

### Endpoints Disponíveis
```
GET /api/versioning/workflows/:id/versions - Listar versões
POST /api/versioning/workflows/:id/versions - Criar versão
GET /api/versioning/versions/:id - Obter versão específica
PUT /api/versioning/versions/:id - Atualizar versão
POST /api/versioning/versions/:id/publish - Publicar versão
POST /api/versioning/workflows/:id/rollback/:versionId - Rollback
POST /api/versioning/compare - Comparar versões
GET /api/versioning/workflows/:id/branches - Listar branches
POST /api/versioning/workflows/:id/merge - Merge de branches
```

### Recursos Avançados
- Versionamento semântico automático
- Tags e changelog automáticos
- Detecção de breaking changes
- Merge strategies configuráveis

## 🗄️ Estrutura do Banco de Dados

### Novas Tabelas Criadas

#### Analytics
- `execution_metrics` - Métricas detalhadas de execução
- `daily_stats` - Estatísticas agregadas diárias

#### Scheduling
- `workflow_schedules` - Configurações de agendamento
- `schedule_executions` - Histórico de execuções agendadas

#### Webhooks
- `webhook_endpoints` - Endpoints de webhook
- `webhook_subscriptions` - Assinaturas de eventos
- `webhook_logs` - Logs de webhooks

#### Templates
- `workflow_templates` - Templates de workflow
- `template_ratings` - Avaliações de templates

#### Versioning
- `workflow_versions` - Versões de workflows
- `version_comparisons` - Comparações entre versões

## 🚀 Como Usar

### 1. Instalação das Dependências
```bash
cd backend
npm install
```

### 2. Configuração do Banco de Dados
Execute o script SQL de criação das tabelas:
```bash
psql -U seu_usuario -d sua_database -f database/004_advanced_features.sql
```

### 3. Configuração de Variáveis de Ambiente
Adicione ao seu `.env`:
```env
# Analytics
ANALYTICS_RETENTION_DAYS=90

# Scheduling
SCHEDULING_ENABLED=true
SCHEDULING_MAX_CONCURRENT=10

# Webhooks
WEBHOOK_SECRET_KEY=sua_chave_secreta_aqui
WEBHOOK_TIMEOUT=30000

# Templates
TEMPLATE_MAX_SIZE=1048576

# Versioning
VERSIONING_MAX_VERSIONS=100
```

### 4. Inicialização do Servidor
```bash
npm run dev
```

## 📝 Exemplos de Uso

### Criar um Agendamento
```javascript
POST /api/scheduling/schedules
{
  "workflow_id": 1,
  "name": "Backup Diário",
  "cron_expression": "0 2 * * *",
  "description": "Backup automático às 2h da manhã",
  "is_active": true
}
```

### Criar um Webhook
```javascript
POST /api/webhooks/endpoints
{
  "name": "Notificação Slack",
  "url": "https://hooks.slack.com/services/...",
  "method": "POST",
  "events": ["workflow.completed", "workflow.failed"]
}
```

### Usar um Template
```javascript
POST /api/templates/1/use
{
  "variables": {
    "api_url": "https://api.exemplo.com",
    "timeout": 5000
  }
}
```

### Criar uma Nova Versão
```javascript
POST /api/versioning/workflows/1/versions
{
  "workflow_data": { /* dados do workflow */ },
  "description": "Adicionada validação de entrada",
  "is_major_change": false,
  "auto_publish": true
}
```

## 🔧 Configurações Avançadas

### Analytics
- Configurar retenção de dados
- Personalizar métricas coletadas
- Configurar alertas de performance

### Scheduling
- Configurar timezone padrão
- Definir limites de execução concorrente
- Configurar retry policies

### Webhooks
- Configurar timeouts
- Personalizar headers padrão
- Configurar rate limiting

### Templates
- Definir categorias personalizadas
- Configurar validação de variáveis
- Personalizar sistema de ratings

### Versioning
- Configurar estratégias de merge
- Definir políticas de retenção
- Personalizar tags automáticas

## 🛡️ Segurança

- Todas as rotas são protegidas por autenticação JWT
- Validação rigorosa de entrada em todos os endpoints
- Rate limiting configurável
- Logs de auditoria para todas as operações
- Sanitização automática de dados de entrada

## 📊 Monitoramento

- Logs estruturados para todas as operações
- Métricas de performance em tempo real
- Alertas automáticos para falhas
- Dashboard de saúde do sistema

## 🔄 Próximos Passos

1. **Interface Frontend**: Implementar interfaces para todas as funcionalidades
2. **Notificações**: Sistema de notificações em tempo real
3. **Backup/Restore**: Sistema de backup automático
4. **Multi-tenancy**: Suporte a múltiplos tenants
5. **API Gateway**: Implementar gateway para melhor controle

---

**Nota**: Todas as funcionalidades foram implementadas seguindo as melhores práticas de desenvolvimento, com foco em performance, segurança e escalabilidade.