import { pool } from '../config/database';
import crypto from 'crypto';

// ========================================
// INTERFACES PARA WEBHOOKS
// ========================================

export interface WebhookEndpoint {
  id: number;
  user_id: number;
  workflow_id?: number;
  name: string;
  description?: string;
  url_path: string;
  secret_key: string;
  is_active: boolean;
  active: boolean; // Added to solve error
  allowed_methods: string[];
  allowed_origins?: string[];
  rate_limit_per_minute: number;
  timeout_seconds: number;
  retry_count: number;
  headers?: Record<string, string>;
  authentication_type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'signature';
  authentication_config?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookSubscription {
  id: number;
  user_id: number;
  workflow_id: number;
  endpoint_id: number; // Added to solve error
  event_type: string;
  target_url: string;
  secret_key: string;
  is_active: boolean;
  retry_count: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  headers?: Record<string, string>;
  filter_conditions?: Record<string, any>;
  filters?: any; // Added to solve error
  created_at: Date;
  updated_at: Date;
}

export interface WebhookLog {
  id: number;
  endpoint_id?: number;
  subscription_id?: number;
  request_id: string;
  event_type: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  response_status?: number;
  response_body?: any;
  response_time_ms: number;
  error_message?: string;
  retry_attempt: number;
  ip_address: string;
  user_agent?: string;
  created_at: Date;
}

export interface CreateWebhookEndpointData {
  user_id: number;
  workflow_id?: number;
  name: string;
  description?: string;
  url_path: string;
  allowed_methods?: string[];
  allowed_origins?: string[];
  rate_limit_per_minute?: number;
  timeout_seconds?: number;
  retry_count?: number;
  headers?: Record<string, string>;
  authentication_type?: WebhookEndpoint['authentication_type'];
  authentication_config?: Record<string, any>;
}

export interface CreateWebhookSubscriptionData {
  user_id: number;
  workflow_id: number;
  event_type: string;
  target_url: string;
  retry_count?: number;
  retry_delay_seconds?: number;
  timeout_seconds?: number;
  headers?: Record<string, string>;
  filter_conditions?: Record<string, any>;
}

export interface WebhookRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  ip_address: string;
  user_agent?: string;
}

export interface WebhookResponse {
  status: number;
  body?: any;
  headers?: Record<string, string>;
}

// ========================================
// MODELO PARA ENDPOINTS DE WEBHOOK
// ========================================

export class WebhookEndpointModel {
  static async create(data: CreateWebhookEndpointData): Promise<WebhookEndpoint> {
    const secretKey = crypto.randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO webhook_endpoints (
        user_id, workflow_id, name, description, url_path, secret_key,
        allowed_methods, allowed_origins, rate_limit_per_minute, timeout_seconds,
        retry_count, headers, authentication_type, authentication_config
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.workflow_id || null,
      data.name,
      data.description || null,
      data.url_path,
      secretKey,
      JSON.stringify(data.allowed_methods || ['POST']),
      JSON.stringify(data.allowed_origins || []),
      data.rate_limit_per_minute || 60,
      data.timeout_seconds || 30,
      data.retry_count || 3,
      JSON.stringify(data.headers || {}),
      data.authentication_type || 'none',
      JSON.stringify(data.authentication_config || {})
    ];
    
    const result = await pool.query(query, values);
    const endpoint = result.rows[0];
    
    // Parse JSON fields
    endpoint.allowed_methods = JSON.parse(endpoint.allowed_methods);
    endpoint.allowed_origins = JSON.parse(endpoint.allowed_origins);
    endpoint.headers = JSON.parse(endpoint.headers);
    endpoint.authentication_config = JSON.parse(endpoint.authentication_config);
    
    return endpoint;
  }

  static async findById(id: number): Promise<WebhookEndpoint | null> {
    const query = 'SELECT * FROM webhook_endpoints WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const endpoint = result.rows[0];
    endpoint.allowed_methods = JSON.parse(endpoint.allowed_methods);
    endpoint.allowed_origins = JSON.parse(endpoint.allowed_origins);
    endpoint.headers = JSON.parse(endpoint.headers);
    endpoint.authentication_config = JSON.parse(endpoint.authentication_config);
    
    return endpoint;
  }

  static async findByUrlPath(urlPath: string): Promise<WebhookEndpoint | null> {
    const query = 'SELECT * FROM webhook_endpoints WHERE url_path = $1 AND is_active = true';
    const result = await pool.query(query, [urlPath]);
    
    if (result.rows.length === 0) return null;
    
    const endpoint = result.rows[0];
    endpoint.allowed_methods = JSON.parse(endpoint.allowed_methods);
    endpoint.allowed_origins = JSON.parse(endpoint.allowed_origins);
    endpoint.headers = JSON.parse(endpoint.headers);
    endpoint.authentication_config = JSON.parse(endpoint.authentication_config);
    
    return endpoint;
  }

  static async findByUserId(userId: number, active?: boolean, limit?: number, offset?: number): Promise<WebhookEndpoint[]> {
    let query = `
      SELECT we.*, w.name as workflow_name
      FROM webhook_endpoints we
      LEFT JOIN workflows w ON we.workflow_id = w.id
      WHERE we.user_id = $1
    `;
    const values = [userId];
    let paramCount = 2;
    
    if (active !== undefined) {
      query += ` AND we.is_active = $${paramCount}`;
      values.push(active ? 1 : 0);
      paramCount++;
    }
    
    query += ` ORDER BY we.created_at DESC`;
    
    if (limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(limit);
      paramCount++;
    }
    
    if (offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(offset);
    }
    const result = await pool.query(query, values);
    
    return result.rows.map((endpoint: any) => {
      endpoint.allowed_methods = JSON.parse(endpoint.allowed_methods);
      endpoint.allowed_origins = JSON.parse(endpoint.allowed_origins);
      endpoint.headers = JSON.parse(endpoint.headers);
      endpoint.authentication_config = JSON.parse(endpoint.authentication_config);
      return endpoint;
    });
  }

  static async update(id: number, data: Partial<CreateWebhookEndpointData>): Promise<WebhookEndpoint | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (['allowed_methods', 'allowed_origins', 'headers', 'authentication_config'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    const query = `
      UPDATE webhook_endpoints 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    values.push(id);
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    
    const endpoint = result.rows[0];
    endpoint.allowed_methods = JSON.parse(endpoint.allowed_methods);
    endpoint.allowed_origins = JSON.parse(endpoint.allowed_origins);
    endpoint.headers = JSON.parse(endpoint.headers);
    endpoint.authentication_config = JSON.parse(endpoint.authentication_config);
    
    return endpoint;
  }

  static async toggleActive(id: number, isActive: boolean): Promise<WebhookEndpoint | null> {
    const query = `
      UPDATE webhook_endpoints 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [isActive, id]);
    return result.rows[0] || null;
  }

  static async regenerateSecret(id: number): Promise<string> {
    const newSecret = crypto.randomBytes(32).toString('hex');
    const query = `
      UPDATE webhook_endpoints 
      SET secret_key = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING secret_key
    `;
    const result = await pool.query(query, [newSecret, id]);
    return result.rows[0].secret_key;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM webhook_endpoints WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async getStats(userId: number): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive
      FROM webhook_endpoints
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async getEndpointStats(endpointId: number, days: number = 30): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 300) as successful_requests,
        COUNT(*) FILTER (WHERE response_status >= 400) as failed_requests,
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM webhook_logs
      WHERE endpoint_id = $1
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    const result = await pool.query(query, [endpointId]);
    return result.rows[0];
  }
}

// ========================================
// MODELO PARA ASSINATURAS DE WEBHOOK
// ========================================

export class WebhookSubscriptionModel {
  static async create(data: CreateWebhookSubscriptionData): Promise<WebhookSubscription> {
    const secretKey = crypto.randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO webhook_subscriptions (
        user_id, workflow_id, event_type, target_url, secret_key,
        retry_count, retry_delay_seconds, timeout_seconds, headers, filter_conditions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.workflow_id,
      data.event_type,
      data.target_url,
      secretKey,
      data.retry_count || 3,
      data.retry_delay_seconds || 60,
      data.timeout_seconds || 30,
      JSON.stringify(data.headers || {}),
      JSON.stringify(data.filter_conditions || {})
    ];
    
    const result = await pool.query(query, values);
    const subscription = result.rows[0];
    
    subscription.headers = JSON.parse(subscription.headers);
    subscription.filter_conditions = JSON.parse(subscription.filter_conditions);
    
    return subscription;
  }

  static async findById(id: number): Promise<WebhookSubscription | null> {
    const query = 'SELECT * FROM webhook_subscriptions WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const subscription = result.rows[0];
    subscription.headers = JSON.parse(subscription.headers);
    subscription.filter_conditions = JSON.parse(subscription.filter_conditions);
    
    return subscription;
  }

  static async findByEventType(eventType: string, userId?: number, workflowId?: number): Promise<WebhookSubscription[]> {
    const query = `
      SELECT * FROM webhook_subscriptions 
      WHERE event_type = $1 AND is_active = true
      ${userId ? `AND user_id = ${userId}` : ''}
      ${workflowId ? `AND workflow_id = ${workflowId}` : ''}
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [eventType]);
    
    return result.rows.map(subscription => {
      subscription.headers = JSON.parse(subscription.headers);
      subscription.filter_conditions = JSON.parse(subscription.filter_conditions);
      return subscription;
    });
  }

  static async findByUserId(userId: number): Promise<WebhookSubscription[]> {
    const query = `
      SELECT ws.*, w.name as workflow_name
      FROM webhook_subscriptions ws
      JOIN workflows w ON ws.workflow_id = w.id
      WHERE ws.user_id = $1
      ORDER BY ws.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(subscription => {
      subscription.headers = JSON.parse(subscription.headers);
      subscription.filter_conditions = JSON.parse(subscription.filter_conditions);
      return subscription;
    });
  }

  static async update(id: number, data: Partial<CreateWebhookSubscriptionData>): Promise<WebhookSubscription | null> {
    const fields: string[] = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (['headers', 'filter_conditions'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    const query = `
      UPDATE webhook_subscriptions 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    values.push(id);
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    
    const subscription = result.rows[0];
    subscription.headers = JSON.parse(subscription.headers);
    subscription.filter_conditions = JSON.parse(subscription.filter_conditions);
    
    return subscription;
  }

  static async toggleActive(id: number, isActive: boolean): Promise<WebhookSubscription | null> {
    const query = `
      UPDATE webhook_subscriptions 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [isActive, id]);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM webhook_subscriptions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async getStats(userId: number): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive
      FROM webhook_subscriptions
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

// ========================================
// MODELO PARA LOGS DE WEBHOOK
// ========================================

export class WebhookLogModel {
  static async getStats(userId: number): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 300) as success,
        COUNT(*) FILTER (WHERE response_status >= 400) as failed
      FROM webhook_logs l
      JOIN webhook_endpoints e ON l.endpoint_id = e.id
      WHERE e.user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async create(
    endpointId: number | null,
    subscriptionId: number | null,
    requestId: string,
    eventType: string,
    request: WebhookRequest,
    response?: WebhookResponse,
    responseTimeMs: number = 0,
    errorMessage?: string,
    retryAttempt: number = 0
  ): Promise<WebhookLog> {
    const query = `
      INSERT INTO webhook_logs (
        endpoint_id, subscription_id, request_id, event_type, method, url,
        headers, body, response_status, response_body, response_time_ms,
        error_message, retry_attempt, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = [
      endpointId,
      subscriptionId,
      requestId,
      eventType,
      request.method,
      request.url,
      JSON.stringify(request.headers),
      JSON.stringify(request.body),
      response?.status || null,
      JSON.stringify(response?.body) || null,
      responseTimeMs,
      errorMessage || null,
      retryAttempt,
      request.ip_address,
      request.user_agent || null
    ];
    
    const result = await pool.query(query, values);
    const log = result.rows[0];
    
    log.headers = JSON.parse(log.headers);
    log.body = JSON.parse(log.body);
    if (log.response_body) {
      log.response_body = JSON.parse(log.response_body);
    }
    
    return log;
  }

  static async findByUserId(userId: number): Promise<WebhookLog[]> {
    const query = `
      SELECT l.* 
      FROM webhook_logs l
      JOIN webhook_endpoints e ON l.endpoint_id = e.id
      WHERE e.user_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findById(id: number): Promise<WebhookLog | null> {
    const query = 'SELECT * FROM webhook_logs WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const log = result.rows[0];
    log.headers = JSON.parse(log.headers);
    log.body = JSON.parse(log.body);
    if (log.response_body) {
      log.response_body = JSON.parse(log.response_body);
    }
    
    return log;
  }

  static async findByEndpointId(endpointId: number, limit: number = 100): Promise<WebhookLog[]> {
    const query = `
      SELECT * FROM webhook_logs 
      WHERE endpoint_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [endpointId, limit]);
    
    return result.rows.map(log => {
      log.headers = JSON.parse(log.headers);
      log.body = JSON.parse(log.body);
      if (log.response_body) {
        log.response_body = JSON.parse(log.response_body);
      }
      return log;
    });
  }

  static async findBySubscriptionId(subscriptionId: number, limit: number = 100): Promise<WebhookLog[]> {
    const query = `
      SELECT * FROM webhook_logs 
      WHERE subscription_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [subscriptionId, limit]);
    
    return result.rows.map(log => {
      log.headers = JSON.parse(log.headers);
      log.body = JSON.parse(log.body);
      if (log.response_body) {
        log.response_body = JSON.parse(log.response_body);
      }
      return log;
    });
  }

  static async findByRequestId(requestId: string): Promise<WebhookLog[]> {
    const query = `
      SELECT * FROM webhook_logs 
      WHERE request_id = $1 
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [requestId]);
    
    return result.rows.map(log => {
      log.headers = JSON.parse(log.headers);
      log.body = JSON.parse(log.body);
      if (log.response_body) {
        log.response_body = JSON.parse(log.response_body);
      }
      return log;
    });
  }

  static async getLogStats(endpointId?: number, subscriptionId?: number, days: number = 30): Promise<any> {
    let whereClause = `WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'`;
    const values = [];
    let paramCount = 1;

    if (endpointId) {
      whereClause += ` AND endpoint_id = $${paramCount}`;
      values.push(endpointId);
      paramCount++;
    }

    if (subscriptionId) {
      whereClause += ` AND subscription_id = $${paramCount}`;
      values.push(subscriptionId);
    }

    const query = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 300) as successful_requests,
        COUNT(*) FILTER (WHERE response_status >= 400 OR error_message IS NOT NULL) as failed_requests,
        AVG(response_time_ms) as avg_response_time,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT event_type) as unique_events
      FROM webhook_logs
      ${whereClause}
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async cleanup(daysToKeep: number = 90): Promise<number> {
    const query = `
      DELETE FROM webhook_logs 
      WHERE created_at < CURRENT_DATE - INTERVAL '${daysToKeep} days'
    `;
    const result = await pool.query(query);
    return result.rowCount || 0;
  }
}

// ========================================
// UTILITÁRIOS PARA WEBHOOKS
// ========================================

export class WebhookUtils {
  /**
   * Gera uma assinatura HMAC para validação de webhook
   */
  static generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Valida a assinatura de um webhook
   */
  static validateSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Gera um ID único para requisição
   */
  static generateRequestId(): string {
    return crypto.randomUUID();
  }

  /**
   * Valida URL de webhook
   */
  static validateWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Sanitiza headers para log
   */
  static sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie', 'set-cookie'];
    const sanitized = { ...headers };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Eventos disponíveis para webhooks
   */
  static getAvailableEvents(): Array<{ type: string; description: string }> {
    return [
      { type: 'workflow.started', description: 'Workflow iniciado' },
      { type: 'workflow.completed', description: 'Workflow concluído' },
      { type: 'workflow.failed', description: 'Workflow falhou' },
      { type: 'workflow.timeout', description: 'Workflow expirou' },
      { type: 'node.executed', description: 'Nó executado' },
      { type: 'node.failed', description: 'Nó falhou' },
      { type: 'schedule.triggered', description: 'Agendamento disparado' },
      { type: 'user.created', description: 'Usuário criado' },
      { type: 'credential.updated', description: 'Credencial atualizada' },
      { type: 'system.maintenance', description: 'Manutenção do sistema' }
    ];
  }
}