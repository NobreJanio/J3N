import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { WebhookEndpointModel, WebhookSubscriptionModel, WebhookLogModel, WebhookUtils } from '../models/Webhooks';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// ========================================
// ROTAS PARA ENDPOINTS DE WEBHOOK
// ========================================

/**
 * GET /api/webhooks/endpoints
 * Listar endpoints de webhook do usuário
 */
router.get('/endpoints', [
  authenticateToken,
  query('active').optional().isBoolean().withMessage('Active deve ser um boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const active = req.query.active ? req.query.active === 'true' : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const endpoints = await WebhookEndpointModel.findByUserId(userId, active, limit, offset);
    
    return res.json({
      success: true,
      data: endpoints
    });
  } catch (error) {
    console.error('Erro ao buscar endpoints:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/webhooks/endpoints/:id
 * Obter endpoint específico
 */
router.get('/endpoints/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const endpointId = parseInt(req.params.id);
    const endpoint = await WebhookEndpointModel.findById(endpointId);
    
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    console.error('Erro ao buscar endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/webhooks/endpoints
 * Criar novo endpoint de webhook
 */
router.post('/endpoints', [
  authenticateToken,
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('url').isURL().withMessage('URL deve ser válida'),
  body('method').isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).withMessage('Método HTTP inválido'),
  body('headers').optional().isObject().withMessage('Headers devem ser um objeto'),
  body('timeout_seconds').optional().isInt({ min: 1, max: 300 }).withMessage('Timeout deve ser entre 1 e 300 segundos'),
  body('retry_attempts').optional().isInt({ min: 0, max: 10 }).withMessage('Tentativas de retry devem ser entre 0 e 10'),
  body('retry_delay_seconds').optional().isInt({ min: 1, max: 3600 }).withMessage('Delay de retry deve ser entre 1 e 3600 segundos'),
  body('active').optional().isBoolean().withMessage('Active deve ser um boolean'),
  body('description').optional().isString().withMessage('Descrição deve ser uma string'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Validar URL
    if (!WebhookUtils.validateWebhookUrl(req.body.url)) {
      return res.status(400).json({
        success: false,
        message: 'URL inválida'
      });
    }
    
    // Sanitizar headers
    const headers = req.body.headers ? WebhookUtils.sanitizeHeaders(req.body.headers) : {};
    
    const endpointData = {
      ...req.body,
      user_id: userId,
      headers,
      secret: crypto.randomBytes(32).toString('hex'),
      active: req.body.active !== false // Default true
    };
    
    const endpoint = await WebhookEndpointModel.create(endpointData);
    
    return res.status(201).json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    console.error('Erro ao criar endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/webhooks/endpoints/:id
 * Atualizar endpoint de webhook
 */
router.put('/endpoints/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('name').optional().notEmpty().withMessage('Nome não pode estar vazio'),
  body('url').optional().isURL().withMessage('URL deve ser válida'),
  body('method').optional().isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).withMessage('Método HTTP inválido'),
  body('headers').optional().isObject().withMessage('Headers devem ser um objeto'),
  body('timeout_seconds').optional().isInt({ min: 1, max: 300 }).withMessage('Timeout deve ser entre 1 e 300 segundos'),
  body('retry_attempts').optional().isInt({ min: 0, max: 10 }).withMessage('Tentativas de retry devem ser entre 0 e 10'),
  body('retry_delay_seconds').optional().isInt({ min: 1, max: 3600 }).withMessage('Delay de retry deve ser entre 1 e 3600 segundos'),
  body('active').optional().isBoolean().withMessage('Active deve ser um boolean'),
  body('description').optional().isString().withMessage('Descrição deve ser uma string'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const endpointId = parseInt(req.params.id);
    
    // Verificar se endpoint existe
    const existingEndpoint = await WebhookEndpointModel.findById(endpointId);
    if (!existingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    }
    
    // Validar URL se fornecida
    if (req.body.url && !WebhookUtils.validateWebhookUrl(req.body.url)) {
      return res.status(400).json({
        success: false,
        message: 'URL inválida'
      });
    }
    
    // Sanitizar headers se fornecidos
    const updateData = { ...req.body };
    if (req.body.headers) {
      updateData.headers = WebhookUtils.sanitizeHeaders(req.body.headers);
    }
    
    const endpoint = await WebhookEndpointModel.update(endpointId, updateData);
    
    return res.json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    console.error('Erro ao atualizar endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/webhooks/endpoints/:id
 * Deletar endpoint de webhook
 */
router.delete('/endpoints/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const endpointId = parseInt(req.params.id);
    
    const deleted = await WebhookEndpointModel.delete(endpointId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    }
    
    return res.json({
      success: true,
      message: 'Endpoint deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/webhooks/endpoints/:id/toggle
 * Habilitar/desabilitar endpoint
 */
router.post('/endpoints/:id/toggle', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const endpointId = parseInt(req.params.id);
    
    // Get current endpoint to check its state
    const currentEndpoint = await WebhookEndpointModel.findById(endpointId);
    if (!currentEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    }
    
    // Toggle the active state
    const endpoint = await WebhookEndpointModel.toggleActive(endpointId, !currentEndpoint.is_active);
    
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    console.error('Erro ao alternar endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/webhooks/endpoints/:id/regenerate-secret
 * Regenerar secret do endpoint
 */
router.post('/endpoints/:id/regenerate-secret', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const endpointId = parseInt(req.params.id);
    
    const endpoint = await WebhookEndpointModel.regenerateSecret(endpointId);
    
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    console.error('Erro ao regenerar secret:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/webhooks/endpoints/:id/test
 * Testar endpoint de webhook
 */
router.post('/endpoints/:id/test', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('payload').optional().isObject().withMessage('Payload deve ser um objeto'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const endpointId = parseInt(req.params.id);
    
    const endpoint = await WebhookEndpointModel.findById(endpointId);
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    }
    
    const testPayload = req.body.payload || {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Este é um teste do webhook'
      }
    };
    
    const result = await sendWebhook(endpoint, testPayload, 'test', req.user!.id);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao testar endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA SUBSCRIÇÕES DE WEBHOOK
// ========================================

/**
 * GET /api/webhooks/subscriptions
 * Listar subscrições de webhook do usuário
 */
router.get('/subscriptions', [
  authenticateToken,
  query('endpoint_id').optional().isInt().withMessage('ID do endpoint deve ser um número'),
  query('event_type').optional().isString().withMessage('Tipo de evento deve ser uma string'),
  query('active').optional().isBoolean().withMessage('Active deve ser um boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const endpointId = req.query.endpoint_id ? parseInt(req.query.endpoint_id as string) : undefined;
    const eventType = req.query.event_type as string;
    const active = req.query.active ? req.query.active === 'true' : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const subscriptions = await WebhookSubscriptionModel.findByUserId(userId);
    
    return res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Erro ao buscar subscrições:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/webhooks/subscriptions
 * Criar nova subscrição de webhook
 */
router.post('/subscriptions', [
  authenticateToken,
  body('endpoint_id').isInt().withMessage('ID do endpoint deve ser um número'),
  body('event_type').notEmpty().withMessage('Tipo de evento é obrigatório'),
  body('workflow_id').optional().isInt().withMessage('ID do workflow deve ser um número'),
  body('filters').optional().isObject().withMessage('Filtros devem ser um objeto'),
  body('active').optional().isBoolean().withMessage('Active deve ser um boolean'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Verificar se endpoint existe
    const endpoint = await WebhookEndpointModel.findById(req.body.endpoint_id);
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    }
    
    // Verificar se evento é válido
    const availableEvents = WebhookUtils.getAvailableEvents();
    if (!availableEvents.includes(req.body.event_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de evento inválido',
        available_events: availableEvents
      });
    }
    
    const subscriptionData = {
      ...req.body,
      user_id: userId,
      active: req.body.active !== false // Default true
    };
    
    const subscription = await WebhookSubscriptionModel.create(subscriptionData);
    
    return res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Erro ao criar subscrição:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/webhooks/subscriptions/:id
 * Atualizar subscrição de webhook
 */
router.put('/subscriptions/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  body('event_type').optional().notEmpty().withMessage('Tipo de evento não pode estar vazio'),
  body('workflow_id').optional().isInt().withMessage('ID do workflow deve ser um número'),
  body('filters').optional().isObject().withMessage('Filtros devem ser um objeto'),
  body('active').optional().isBoolean().withMessage('Active deve ser um boolean'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    
    // Verificar se subscrição existe
    const existingSubscription = await WebhookSubscriptionModel.findById(subscriptionId);
    if (!existingSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscrição não encontrada'
      });
    }
    
    // Verificar se evento é válido se fornecido
    if (req.body.event_type) {
      const availableEvents = WebhookUtils.getAvailableEvents();
      if (!availableEvents.includes(req.body.event_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de evento inválido',
          available_events: availableEvents
        });
      }
    }
    
    const subscription = await WebhookSubscriptionModel.update(subscriptionId, req.body);
    
    return res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Erro ao atualizar subscrição:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/webhooks/subscriptions/:id
 * Deletar subscrição de webhook
 */
router.delete('/subscriptions/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    
    const deleted = await WebhookSubscriptionModel.delete(subscriptionId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Subscrição não encontrada'
      });
    }
    
    return res.json({
      success: true,
      message: 'Subscrição deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar subscrição:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA LOGS DE WEBHOOK
// ========================================

/**
 * GET /api/webhooks/logs
 * Listar logs de webhook
 */
router.get('/logs', [
  authenticateToken,
  query('endpoint_id').optional().isInt().withMessage('ID do endpoint deve ser um número'),
  query('status').optional().isIn(['success', 'failed', 'pending']).withMessage('Status inválido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número positivo'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const endpointId = req.query.endpoint_id ? parseInt(req.query.endpoint_id as string) : undefined;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const logs = await WebhookLogModel.findByUserId(userId);
    
    return res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/webhooks/logs/:id
 * Obter log específico
 */
router.get('/logs/:id', [
  authenticateToken,
  param('id').isInt().withMessage('ID deve ser um número'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const logId = parseInt(req.params.id);
    const log = await WebhookLogModel.findById(logId);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Erro ao buscar log:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS PARA EVENTOS E UTILITÁRIOS
// ========================================

/**
 * GET /api/webhooks/events
 * Listar eventos disponíveis
 */
router.get('/events', authenticateToken, async (req: Request, res: Response) => {
  try {
    const events = WebhookUtils.getAvailableEvents().map(event => {
      return { type: event, description: event };
    });
    
    return res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/webhooks/stats
 * Obter estatísticas de webhooks
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const [endpointStats, subscriptionStats, logStats] = await Promise.all([
      WebhookEndpointModel.getStats(userId),
      WebhookSubscriptionModel.getStats(userId),
      WebhookLogModel.getStats(userId)
    ]);
    
    return res.json({
      success: true,
      data: {
        endpoints: endpointStats,
        subscriptions: subscriptionStats,
        logs: logStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// WEBHOOK INCOMING (Receber webhooks)
// ========================================

/**
 * POST /api/webhooks/incoming/:token
 * Receber webhook externo
 */
router.post('/incoming/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const payload = req.body;
    const headers = req.headers;
    
    // Aqui você implementaria a lógica para processar webhooks recebidos
    // Por exemplo, encontrar o workflow associado ao token e executá-lo
    
    console.log('Webhook recebido:', {
      token,
      payload,
      headers: Object.fromEntries(
        Object.entries(headers).filter(([key]) => 
          !['authorization', 'cookie'].includes(key.toLowerCase())
        )
      )
    });
    
    // Simular processamento
    const requestId = WebhookUtils.generateRequestId();
    
    return res.json({
      success: true,
      request_id: requestId,
      message: 'Webhook processado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Enviar webhook para endpoint
 */
async function sendWebhook(endpoint: any, payload: any, eventType: string, userId: number) {
  const requestId = WebhookUtils.generateRequestId();
  const timestamp = new Date();
  
  try {
    // Preparar headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'J3N-Webhook/1.0',
      'X-Webhook-Event': eventType,
      'X-Webhook-ID': requestId,
      'X-Webhook-Timestamp': timestamp.toISOString(),
      ...endpoint.headers
    };
    
    // Gerar assinatura se secret estiver presente
    if (endpoint.secret) {
      const signature = WebhookUtils.generateSignature(JSON.stringify(payload), endpoint.secret);
      headers['X-Webhook-Signature'] = signature;
    }
    
    // Fazer requisição
    const startTime = Date.now();
    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
      data: payload,
      headers,
      timeout: (endpoint.timeout_seconds || 30) * 1000,
      validateStatus: () => true // Não lançar erro para status HTTP
    });
    
    const responseTime = Date.now() - startTime;
    const success = response.status >= 200 && response.status < 300;
    
    // Registrar log
    await WebhookLogModel.create(
      endpoint.id,
      null, // subscription_id
      requestId,
      eventType,
      {
        method: endpoint.method,
        url: endpoint.url,
        headers: endpoint.headers,
        body: payload,
        ip_address: 'server',
        user_agent: 'J3N-Webhook/1.0'
      },
      {
        status: response.status,
        body: response.data,
        headers: response.headers as Record<string, string>
      },
      responseTime,
      success ? undefined : `HTTP ${response.status}: ${response.statusText}`
    );
    
    return {
      request_id: requestId,
      status: response.status,
      success,
      response_time_ms: responseTime,
      response_data: response.data
    };
    
  } catch (error: any) {
    // Registrar log de erro
    await WebhookLogModel.create(
      endpoint.id,
      null, // subscription_id
      requestId,
      eventType,
      {
        method: endpoint.method,
        url: endpoint.url,
        headers: endpoint.headers,
        body: payload,
        ip_address: 'server',
        user_agent: 'J3N-Webhook/1.0'
      },
      undefined,
      Date.now() - timestamp.getTime(),
      error.message
    );
    
    throw error;
  }
}

/**
 * Obter descrição do evento
 */
function getEventDescription(eventType: string): string {
  const descriptions: Record<string, string> = {
    'workflow.started': 'Workflow iniciado',
    'workflow.completed': 'Workflow concluído com sucesso',
    'workflow.failed': 'Workflow falhou',
    'workflow.cancelled': 'Workflow cancelado',
    'execution.node.started': 'Nó do workflow iniciado',
    'execution.node.completed': 'Nó do workflow concluído',
    'execution.node.failed': 'Nó do workflow falhou',
    'schedule.triggered': 'Agendamento disparado',
    'schedule.completed': 'Agendamento concluído',
    'schedule.failed': 'Agendamento falhou',
    'user.created': 'Usuário criado',
    'user.updated': 'Usuário atualizado',
    'credential.created': 'Credencial criada',
    'credential.updated': 'Credencial atualizada',
    'credential.deleted': 'Credencial deletada'
  };
  
  return descriptions[eventType] || 'Evento personalizado';
}

/**
 * Disparar webhook para evento
 */
export async function triggerWebhook(eventType: string, data: any, userId?: number, workflowId?: number) {
  try {
    // Buscar subscrições ativas para o evento
    const subscriptions = await WebhookSubscriptionModel.findByEventType(eventType, userId, workflowId);
    
    for (const subscription of subscriptions) {
      // Verificar filtros se existirem
      if (subscription.filters && !matchesFilters(data, subscription.filters)) {
        continue;
      }
      
      // Buscar endpoint
      const endpoint = await WebhookEndpointModel.findById(subscription.endpoint_id);
      if (!endpoint || !endpoint.active) {
        continue;
      }
      
      // Preparar payload
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        subscription_id: subscription.id,
        data
      };
      
      // Enviar webhook (com retry se configurado)
      try {
        await sendWebhookWithRetry(endpoint, payload, eventType, subscription.user_id);
      } catch (error) {
        console.error(`Erro ao enviar webhook para endpoint ${endpoint.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Erro ao disparar webhooks:', error);
  }
}

/**
 * Enviar webhook com retry
 */
async function sendWebhookWithRetry(endpoint: any, payload: any, eventType: string, userId: number) {
  const maxRetries = endpoint.retry_attempts || 0;
  const retryDelay = (endpoint.retry_delay_seconds || 60) * 1000;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendWebhook(endpoint, payload, eventType, userId);
      if (result.success) {
        return result;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  return { success: false, error: 'All retry attempts failed' };
}

/**
 * Verificar se dados correspondem aos filtros
 */
function matchesFilters(data: any, filters: any): boolean {
  // Implementação simples de filtros
  // Você pode expandir isso para suportar filtros mais complexos
  for (const [key, value] of Object.entries(filters)) {
    if (data[key] !== value) {
      return false;
    }
  }
  return true;
}

export default router;